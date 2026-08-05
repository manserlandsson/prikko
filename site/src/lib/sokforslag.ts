/**
 * Förslagsradens anatomi och rankning — en enda sanning för de två panelerna.
 *
 * Sökfältet (SiteSearch) och kommandopaletten (CommandPalette) visar samma
 * sorts rad under samma fält, tio pixlar från varandra. De byggde tidigare
 * raden var för sig, med två kopior av ikonerna, två kopior av escapeHtml och
 * två kopior av rankningen. Kopiorna hade redan börjat glida isär: paletten
 * visade åtta förslag och fältet sju, och bara den ena hade kvar kommentaren
 * om varför. En rad som ser olika ut beroende på vilken tangent besökaren
 * tryckte är ett fel oavsett hur liten skillnaden är.
 *
 * Modulen importeras av BÅDA komponenternas klientskript. Den får därför inte
 * röra node: eller astro: — den buntas till webbläsaren. lib/face importeras
 * för geometrin och drar bara in en typ, som försvinner vid kompileringen.
 */
import {
  FACE_EYE_LEFT,
  FACE_EYE_RIGHT,
  FACE_MOUTH,
  FACE_MOUTH_WIDTH,
  FACE_RING,
  type FaceKey,
} from './face';

/** Rad i registret: [namn, adress, slug, kommunindex, bedömningsindex]. */
export type Row = [string, string, string, number, number];

export interface Suggestion {
  /** Raden som fyller fältet vid val och autoifyllnad. */
  label: string;
  /** Den dämpade underraden. */
  meta: string;
  href: string;
  kind: 'kommun' | 'place' | 'query';
  /**
   * Bedömningen, som index i registrets v-lista. -1 = ingen kontroll.
   * Bara verksamheter har en; kommuner och handlingar lämnar den odefinierad.
   */
  verdict?: number;
}

/** Ordningen speglar registrets v-lista (se lib/search-index). */
const FACE_BY_INDEX: FaceKey[] = ['clean', 'minor', 'major'];

/**
 * Bedömningens ord, för skärmläsare. Ansiktet är aria-hidden: det är en bild
 * av ett omdöme, och en skärmläsare ska få omdömet i ord i stället.
 * Texterna är VERDICT.label i lib/site, upprepade här eftersom lib/site drar
 * in mer än ett klientskript ska bära för tre strängars skull.
 */
const VERDICT_LABEL: Record<FaceKey, string> = {
  clean: 'Inga anmärkningar',
  minor: 'Brister',
  major: 'Brister som kvarstår',
  none: 'Ingen kontroll',
};

export function normalise(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function escapeHtml(s: string) {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!,
  );
}

/**
 * Bedömningsmärket som markup, ritat ur samma modul som listorna på
 * kommunhubben och nålarna på kartan.
 *
 * Inte <use> mot FaceSprite, fast det vore billigare. Spriten lägger fyra
 * symboler med fasta id:n i dokumentet, och panelen bor i sidhuvudet på
 * 14 711 sidor — varav kommunhubben, /sok, kartan och matsnusksidan redan
 * har en egen sprite. Två spriter i samma dokument ger dubbla id:n. Panelen
 * visar som mest åtta rader åt gången, så åtta inlinade märken är billigt;
 * banorna själva ligger i bunten en gång.
 */
function faceSvg(verdict: number | undefined): string {
  const key: FaceKey =
    verdict === undefined ? 'none' : (FACE_BY_INDEX[verdict] ?? 'none');
  const c = FACE_RING[key];
  return `<svg class="face" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="93" height="93" rx="46.5" fill="#fff" stroke="${c}" stroke-width="7"/><path d="${FACE_EYE_LEFT}" fill="${c}"/><path d="${FACE_EYE_RIGHT}" fill="${c}"/><path d="${FACE_MOUTH[key]}" stroke="${c}" stroke-width="${FACE_MOUTH_WIDTH}" stroke-linecap="round" fill="none"/></svg>`;
}

function verdictWord(verdict: number | undefined): string {
  return VERDICT_LABEL[
    verdict === undefined ? 'none' : (FACE_BY_INDEX[verdict] ?? 'none')
  ];
}

/**
 * Glyferna för det som inte är en verksamhet. Samma streckvikt och
 * 20-rutnät som resten av sajtens ikoner.
 *
 * Verksamheter har ingen glyf i listan: de bär sitt bedömningsmärke i
 * stället, och den identiska husikonen på var och en av dem var brus.
 */
export const GLYPHS = {
  kommun:
    '<path d="M10 17.4c3.2-3.5 4.9-6.2 4.9-8.2a4.9 4.9 0 1 0-9.8 0c0 2 1.7 4.7 4.9 8.2Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="10" cy="9" r="1.9" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  query:
    '<circle cx="9" cy="9" r="5.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M13.2 13.2 17.2 17.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
};

function glyphSvg(paths: string): string {
  return `<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">${paths}</svg>`;
}

/**
 * Träffen i fetstil, Boolis mönster: de skriver "**Stor**a Ursvik" och låter
 * resten av raden stå i vanlig vikt. Det gör synligt VARFÖR raden ligger i
 * listan, vilket är hela skillnaden mellan en träfflista och en gissning —
 * särskilt när träffen sitter i adressen och inte i namnet.
 *
 * Indexet räknas på den normaliserade strängen men skärs ur originalet.
 * Normaliseringen tar bort kombinerande tecken efter NFD, så ett "å" är ett
 * tecken före och efter och positionerna följer med. Skulle en exotisk
 * teckenföljd ändå glida är felet kosmetiskt: fel bokstav blir fet.
 */
export function mark(text: string, q: string): string {
  if (!q) return escapeHtml(text);
  const at = normalise(text).indexOf(q);
  if (at < 0) return escapeHtml(text);
  return (
    escapeHtml(text.slice(0, at)) +
    '<b>' +
    escapeHtml(text.slice(at, at + q.length)) +
    '</b>' +
    escapeHtml(text.slice(at + q.length))
  );
}

/**
 * Innehållet i en förslagsrads länk. Klasserna stylas av respektive
 * komponent, men strukturen står här så att de två panelerna inte kan få
 * olika rader.
 */
export function suggestionInner(s: Suggestion, q: string): string {
  const badge =
    s.kind === 'place'
      ? faceSvg(s.verdict)
      : glyphSvg(s.kind === 'kommun' ? GLYPHS.kommun : GLYPHS.query);

  // Bedömningen i ord, bara för verksamheter. Ansiktet är aria-hidden, och
  // utan det här hade en skärmläsare fått namnet och adressen men aldrig
  // omdömet — alltså allt utom det sajten finns för.
  const spoken =
    s.kind === 'place'
      ? `<span class="visually-hidden">. ${escapeHtml(verdictWord(s.verdict))}</span>`
      : '';

  return `<span class="mark" aria-hidden="true">${badge}</span><span class="body"><span class="name">${mark(s.label, q)}</span><span class="meta">${mark(s.meta, q)}</span></span>${spoken}`;
}

/** En hel <li> med förslagsraden i. */
export function suggestionLi(s: Suggestion, q: string): string {
  return `<li role="presentation"><a href="${escapeHtml(s.href)}" role="option" aria-selected="false">${suggestionInner(s, q)}</a></li>`;
}

/**
 * Sista raden: gå vidare till /sok med det skrivna.
 *
 * Den är en HANDLING, inte en träff, och får därför en egen form. Tidigare
 * låg den som en rad bland andra, med besökarens fråga där ett namn brukar
 * stå och "Visa alla träffar" där adressen brukar stå. Den läste som en
 * verksamhet som hette "max" och låg på gatan "Visa alla träffar".
 *
 * Nu: en rad, en mening, avskild med en hårlinje. Hitta.se skiljer sin
 * motsvarande rad med en fylld ikonruta och lägger den först; vi behåller
 * den sist, eftersom fältets egen enter-tangent redan går till /sok och
 * raden därmed främst är en musväg.
 */
export function actionLi(query: string, href: string): string {
  return `<li class="handling" role="presentation"><a href="${escapeHtml(href)}" role="option" aria-selected="false" class="action"><span class="mark" aria-hidden="true">${glyphSvg(GLYPHS.query)}</span><span class="name">Visa alla träffar för ”${escapeHtml(query)}”</span></a></li>`;
}

// ---- Registret ------------------------------------------------------------

/**
 * Registret, hämtat en gång och delat av båda panelerna.
 *
 * Förut hämtade och tolkade de var sitt exemplar. Nätverket märkte inget —
 * adressen är innehållsbaserad och cachad för alltid, så den andra hämtningen
 * var en cacheträff — men webbläsaren tolkade 970 kB JSON två gånger och höll
 * sedan två kopior av 15 916 rader plus två uppsättningar normaliserade
 * söksträngar i minnet. På en telefon är det inte gratis.
 *
 * Att det här går att göra är hela poängen med den delade modulen: Vite
 * lyfter den till en egen bunt som båda komponentskripten importerar, så det
 * finns exakt en instans av variablerna nedan i dokumentet.
 */
export interface SearchIndex {
  rows: Row[];
  /** Normaliserad "namn adress ort" per rad, byggd en gång.
   *  Att namnet ligger FÖRST är avsiktligt: en prefixträff på hela strängen
   *  är därmed samma sak som en prefixträff på namnet, och träffens position
   *  säger dessutom om den sitter i namnet eller i adressen. */
  hay: string[];
  kommuner: Array<[string, string]>;
}

const index: SearchIndex = { rows: [], hay: [], kommuner: [] };
let loading: Promise<void> | null = null;
let failed = false;

/** Tomt tills registret landat. Anropa loadIndex först. */
export function searchIndex(): SearchIndex {
  return index;
}

/** Sant när hämtningen gav upp. Panelerna säger då ifrån i klartext. */
export function indexFailed(): boolean {
  return failed;
}

/**
 * Hämtar registret från den hashade adressen, med den gamla som reserv.
 *
 * Reserven är inte paranoia. Dokumentet kan ha legat i cachen sedan förra
 * bygget och peka på en hash som inte längre finns på servern. Att sökningen
 * då blir helt död vore ett värre fel än det inaktuella register vi gick
 * ifrån.
 */
function fetchIndex(url: string, fallback: string | null): Promise<any> {
  return fetch(url).then((r) => {
    if (r.ok) return r.json();
    if (fallback) return fetchIndex(fallback, null);
    throw new Error(String(r.status));
  });
}

export function loadIndex(url: string, fallback: string | null): Promise<void> {
  if (loading) return loading;
  loading = fetchIndex(url, fallback)
    .then((data) => {
      index.kommuner = data.k;
      index.rows = data.e;
      index.hay = index.rows.map(([name, address, , k]) =>
        normalise(`${name} ${address} ${index.kommuner[k][1]}`),
      );
    })
    .catch(() => {
      failed = true;
    });
  return loading;
}

// ---- Rankning -------------------------------------------------------------

/**
 * Kandidaterna i den ordning de rankas, indelade i klasser.
 *
 * Klasserna är inte kosmetik. Dels bär de autoifyllnaden: en prefixträff på
 * en kommun är entydig på ett sätt som en prefixträff på ett verksamhetsnamn
 * sällan är, och "sto" ska bli Stockholm trots att hundra verksamheter också
 * börjar så. Dels avgör de vad besökaren faktiskt ser i sju rader.
 *
 * `nameWord` är den klass som saknades. Förut fanns bara "namnet börjar med
 * frågan" och "frågan finns någonstans i namn, adress eller ort", vilket la
 * "Pizzeria Max" i samma hög som ett ställe på Maxgatan. Ett ord som börjar
 * mitt i namnet är en riktig namnträff och ska stå före en adressträff.
 */
export interface Groups {
  kommunPrefix: Suggestion[];
  namePrefix: Suggestion[];
  nameWord: Suggestion[];
  kommunLoose: Suggestion[];
  loose: Suggestion[];
}

/** Sant när träffen på index `at` inleder ett ord. */
function wordStart(h: string, at: number) {
  return at === 0 || !/[a-z0-9]/.test(h[at - 1]);
}

/**
 * Kortast namn först. Vi har ingen popularitetssignal att ranka med, och
 * datafilens ordning är inte en. Längden är däremot ett rimligt mått på hur
 * nära namnet ligger det skrivna: söker man "espresso house" ska "Espresso
 * House" ligga före "Espresso House Gränden 4".
 */
const byLength = (a: Suggestion, b: Suggestion) =>
  a.label.length - b.label.length || a.label.localeCompare(b.label, 'sv');

export function collect(q: string, scanCap: number): Groups {
  const { rows, hay, kommuner } = index;
  const kommunPrefix: Suggestion[] = [];
  const kommunLoose: Suggestion[] = [];
  const namePrefix: Suggestion[] = [];
  const nameWord: Suggestion[] = [];
  const loose: Suggestion[] = [];

  for (let i = 0; i < kommuner.length; i++) {
    const [slug, city] = kommuner[i];
    const c = normalise(city);
    const item: Suggestion = { label: city, meta: 'Kommun', href: `/${slug}/`, kind: 'kommun' };
    if (c.startsWith(q)) kommunPrefix.push(item);
    else if (c.includes(q)) kommunLoose.push(item);
  }

  for (let i = 0; i < rows.length; i++) {
    if (
      namePrefix.length >= scanCap &&
      nameWord.length >= scanCap &&
      loose.length >= scanCap
    ) {
      break;
    }
    const h = hay[i];
    const at = h.indexOf(q);
    if (at < 0) continue;

    const [name, address, slug, k, verdict] = rows[i];
    const city = kommuner[k][1];
    // Karlstad publicerar ingen adress. Utan grenen blir underraden
    // " · Karlstad" med en hängande punkt och ett inledande blanksteg.
    const item: Suggestion = {
      label: name,
      meta: address ? `${address} · ${city}` : city,
      href: `/${kommuner[k][0]}/${slug}/`,
      kind: 'place',
      verdict,
    };

    if (at === 0) {
      if (namePrefix.length < scanCap) namePrefix.push(item);
    } else if (at < name.length && wordStart(h, at)) {
      if (nameWord.length < scanCap) nameWord.push(item);
    } else if (loose.length < scanCap) {
      loose.push(item);
    }
  }

  namePrefix.sort(byLength);
  nameWord.sort(byLength);
  loose.sort(byLength);

  return { kommunPrefix, namePrefix, nameWord, kommunLoose, loose };
}

/** Klasserna hopslagna i rankningsordning. */
export function ranked(g: Groups): Suggestion[] {
  return [...g.kommunPrefix, ...g.namePrefix, ...g.nameWord, ...g.kommunLoose, ...g.loose];
}

/**
 * Kan det skrivna fyllas ut entydigt?
 *
 * Regeln: den högst rankade klass som har prefixträffar måste innehålla exakt
 * EN etikett. Träffar "stora c" två olika Stora Coop fylls inget i, precis
 * som det ska. Att kommunklassen prövas först är det som gör att "sto" blir
 * Stockholm trots att hundra verksamheter också börjar så.
 */
export function completionFor(g: Groups): string | null {
  const tier = g.kommunPrefix.length ? g.kommunPrefix : g.namePrefix;
  if (!tier.length) return null;
  const distinct = new Set(tier.map((s) => s.label));
  return distinct.size === 1 ? tier[0].label : null;
}
