/**
 * Förslagsradens anatomi och rankning — en enda sanning för hela sökningen.
 *
 * Sajten hade tidigare TVÅ paneler under samma fält: sökfältets egen och
 * kommandopaletten som cmd+K fällde ut. De delade den här modulen, men bara
 * halva urvalet: paletten nådde dessutom sajtens egna sidor, kartorna och
 * artiklarna. Samma fält och samma sökord gav alltså två olika svar, och
 * vilket man fick avgjordes av om man kunde en tangentgenväg. Ägarens ord:
 * "nu är sök annorlunda om du trycker cmd K mot bara söker i sökrutan genom
 * klick."
 *
 * Panelerna är numera en enda (SiteSearch), och den här modulen bär hela
 * dess innehåll: raden, grupprubriken, handlingsraden, registret och
 * rankningen — både för verksamheter och för sajtens egna sidor. /sok läser
 * samma rankning, så resultatsidan och panelen kan inte svara olika.
 *
 * Modulen buntas till webbläsaren och får därför inte röra node: eller
 * astro:. lib/face importeras för geometrin och drar bara in en typ, som
 * försvinner vid kompileringen.
 */
import { FACE_MARKUP, FACE_PLATE, FACE_RING, type FaceKey } from './face';

/** Rad i registret: [namn, adress, slug, kommunindex, bedömningsindex]. */
export type Row = [string, string, string, number, number];

/**
 * Radens sort, som bestämmer dess märke.
 *
 * `place` är en verksamhet och bär sitt bedömningsansikte. Resten bär en
 * glyf ur GLYPHS: `kommun` en nål, `query` ett förstoringsglas (populära
 * kedjesökningar och handlingsraden), `page`/`map`/`article` sajtens eget.
 */
export type SuggestionKind = 'kommun' | 'place' | 'query' | 'page' | 'map' | 'article';

export interface Suggestion {
  /** Raden som fyller fältet vid val och autoifyllnad. */
  label: string;
  /** Den dämpade underraden. */
  meta: string;
  href: string;
  kind: SuggestionKind;
  /**
   * Bedömningen, som index i registrets v-lista. -1 = ingen kontroll.
   * Bara verksamheter har en; kommuner och handlingar lämnar den odefinierad.
   */
  verdict?: number;
  /**
   * Extra sökord utöver etiketten, bara på sajtens egna sidor. "betyg" ska
   * hitta metodiken fast ordet inte står i rubriken. Skickas med i JSON till
   * klienten och normaliseras där.
   */
  kw?: string;
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
  // Nal-nivån, av samma skäl som på kartan: förslagslistan buntas till
  // webbläsaren och märket ritas i 20 till 24 px. Det rika ansiktet hade lagt
  // åtta kilobyte per läge i en fil som laddas på varje sidvisning, för
  // detaljer som ändå inte syns i den storleken.
  return `<svg class="face" viewBox="0 0 100 100" aria-hidden="true" focusable="false">` +
    `<clipPath id="sf-${key}"><rect width="100" height="100" rx="17"/></clipPath>` +
    `<g clip-path="url(#sf-${key})">` +
    `<rect width="100" height="100" fill="${FACE_PLATE[key]}"/>${FACE_MARKUP[key].nal}</g></svg>`;
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
const KOMMUN_PIN =
  '<path d="M10 17.4c3.2-3.5 4.9-6.2 4.9-8.2a4.9 4.9 0 1 0-9.8 0c0 2 1.7 4.7 4.9 8.2Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="10" cy="9" r="1.9" fill="none" stroke="currentColor" stroke-width="1.5"/>';

export const GLYPHS: Record<Exclude<SuggestionKind, 'place'>, string> = {
  kommun: KOMMUN_PIN,
  /** Kartan är en kommun sedd uppifrån, alltså samma nål. */
  map: KOMMUN_PIN,
  query:
    '<circle cx="9" cy="9" r="5.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M13.2 13.2 17.2 17.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  page:
    '<path d="M5.4 2.9h6.4l2.8 2.8v11.4H5.4Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M11.8 2.9v2.8h2.8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7.6 9.6h4.8M7.6 12.4h4.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  article:
    '<path d="M4.2 4.6h11.6M4.2 8.2h11.6M4.2 11.8h11.6M4.2 15.4h6.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
};

function glyphSvg(paths: string): string {
  return `<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">${paths}</svg>`;
}

/**
 * Grupprubriken i listan. Ett ögonbryn, inte ett alternativ: i panelen
 * ligger den i <ul role="listbox"> och bär därför role="presentation" och
 * aria-hidden, eftersom en listbox bara får innehålla valbara rader.
 * Rubriken är en synlig gruppering för ögat, och skärmläsaren får ordningen
 * i stället.
 */
export function groupLi(name: string): string {
  return `<li class="group eyebrow" role="presentation" aria-hidden="true">${escapeHtml(name)}</li>`;
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
    s.kind === 'place' ? faceSvg(s.verdict) : glyphSvg(GLYPHS[s.kind]);

  // Bedömningen i ord, bara för verksamheter. Ansiktet är aria-hidden, och
  // utan det här hade en skärmläsare fått namnet och adressen men aldrig
  // omdömet — alltså allt utom det sajten finns för.
  const spoken =
    s.kind === 'place'
      ? `<span class="visually-hidden">. ${escapeHtml(verdictWord(s.verdict))}</span>`
      : '';

  return `<span class="mark" aria-hidden="true">${badge}</span><span class="body"><span class="name">${mark(s.label, q)}</span><span class="meta">${mark(s.meta, q)}</span></span>${spoken}`;
}

/**
 * En hel <li> med förslagsraden i.
 *
 * `option` styr ARIA, inte utseendet. I panelen är raden ett alternativ i en
 * combobox-listbox. På /sok är samma rad en vanlig länk i en vanlig lista,
 * och role="option" utanför en listbox är trasig ARIA — men raden ska se
 * likadan ut på båda ställena, alltså är det samma funktion.
 */
export function suggestionLi(s: Suggestion, q: string, option = true): string {
  const open = option ? '<li role="presentation">' : '<li>';
  const attrs = option ? ' role="option" aria-selected="false"' : '';
  return `${open}<a href="${escapeHtml(s.href)}"${attrs}>${suggestionInner(s, q)}</a></li>`;
}

/**
 * En rubrik och dess rader, eller ingenting alls när gruppen är tom.
 *
 * Att tomma grupper försvinner är inte en detalj. Panelen bygger sin lista
 * av samma anrop oavsett fråga, och en rubrik utan rader under sig läser som
 * ett fel — särskilt "Verksamheter och kommuner" över tomrum när frågan bara
 * träffade en av sajtens egna sidor.
 */
export function sectionHtml(name: string, items: Suggestion[], q: string): string {
  if (!items.length) return '';
  return groupLi(name) + items.map((s) => suggestionLi(s, q)).join('');
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
  /**
   * Antal verksamhetsträffar i HELA registret, oberoende av hur många rader
   * som sparades. /sok skriver ut talet och får inte skriva ut "40".
   */
  count: number;
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

/**
 * Lägger raden i klassen om den hör till de `keep` bästa, annars inte.
 *
 * Det här ersatte en scanCap, och skillnaden är hela poängen. Förut slutade
 * genomsökningen leta efter ett visst antal FUNNA rader och rankade sedan
 * det den råkat hitta. Registret ligger i kommunordning, alltså
 * bokstavsordning, så Borgholm och Höganäs fyllde kvoten innan Stockholm
 * hunnit prövas: panelen visade sju rader ur de tre första kommunerna och
 * kallade det rankning. Det var samma fel som /sok hade, och därför visade
 * de två inte samma träffar på samma ord.
 *
 * Nu prövas hela registret alltid, men objektet byggs bara för de rader som
 * faktiskt tar sig in. När klassen är full kostar en kandidat en enda
 * längdjämförelse, och 15 916 sådana är inget. Följden är att panelens sju
 * bästa är exakt /sok:s sju första: samma klass, samma ordning, samma urval,
 * bara olika djupt.
 */
function offer(
  bucket: Suggestion[],
  keep: number,
  name: string,
  make: () => Suggestion,
): void {
  const n = bucket.length;
  if (n >= keep && name.length > bucket[n - 1].label.length) return;

  const item = make();
  let i = n;
  bucket.push(item);
  while (i > 0 && byLength(item, bucket[i - 1]) < 0) {
    bucket[i] = bucket[i - 1];
    i--;
  }
  bucket[i] = item;
  if (bucket.length > keep) bucket.pop();
}

/**
 * Kandidaterna, klassvis och rankade.
 *
 * `keep` är hur många rader varje klass sparar. Panelen ber om sju,
 * resultatsidan om fyrtio. Talet påverkar bara djupet, aldrig ordningen.
 */
export function collect(q: string, keep: number): Groups {
  const { rows, hay, kommuner } = index;
  const kommunPrefix: Suggestion[] = [];
  const kommunLoose: Suggestion[] = [];
  const namePrefix: Suggestion[] = [];
  const nameWord: Suggestion[] = [];
  const loose: Suggestion[] = [];
  let count = 0;

  for (let i = 0; i < kommuner.length; i++) {
    const [slug, city] = kommuner[i];
    const c = normalise(city);
    const item: Suggestion = { label: city, meta: 'Kommun', href: `/${slug}/`, kind: 'kommun' };
    if (c.startsWith(q)) kommunPrefix.push(item);
    else if (c.includes(q)) kommunLoose.push(item);
  }

  // Tolv kommuner: en vanlig sortering är billigare än en insättning.
  kommunPrefix.sort(byLength);
  kommunLoose.sort(byLength);

  for (let i = 0; i < rows.length; i++) {
    const h = hay[i];
    const at = h.indexOf(q);
    if (at < 0) continue;
    count++;

    const row = rows[i];
    const name = row[0];
    // Karlstad publicerar ingen adress. Utan grenen blir underraden
    // " · Karlstad" med en hängande punkt och ett inledande blanksteg.
    const make = (): Suggestion => ({
      label: name,
      meta: row[1] ? `${row[1]} · ${kommuner[row[3]][1]}` : kommuner[row[3]][1],
      href: `/${kommuner[row[3]][0]}/${row[2]}/`,
      kind: 'place',
      verdict: row[4],
    });

    if (at === 0) offer(namePrefix, keep, name, make);
    else if (at < name.length && wordStart(h, at)) offer(nameWord, keep, name, make);
    else offer(loose, keep, name, make);
  }

  return { kommunPrefix, namePrefix, nameWord, kommunLoose, loose, count };
}

/** Klasserna hopslagna i rankningsordning. */
export function ranked(g: Groups): Suggestion[] {
  return [...g.kommunPrefix, ...g.namePrefix, ...g.nameWord, ...g.kommunLoose, ...g.loose];
}

/**
 * Sajtens egna sidor, kartor och artiklar, rankade mot samma fråga.
 *
 * Samma tre klasser som verksamheterna, av samma skäl: rubriken börjar med
 * frågan, ett ord i rubriken börjar med den, eller så sitter träffen bland
 * de extra sökorden. Listan är ett trettiotal rader lång och byggs i
 * sidans HTML, så här behövs varken register eller kvot.
 *
 * ATT DE RANKAS FÖR SIG är avsiktligt. Paletten la dem tidigare direkt
 * efter kommunprefixen, alltså FÖRE verksamheterna, och då fick den som
 * sökte ett kafé sajtens metodiksida först. De hör hemma i en egen grupp
 * under träffarna, dit man tittar när namnet man skrev inte var ett ställe.
 */
export function matchPages(items: Suggestion[], q: string, keep: number): Suggestion[] {
  const prefix: Suggestion[] = [];
  const word: Suggestion[] = [];
  const loose: Suggestion[] = [];

  for (const item of items) {
    const label = normalise(item.label);
    const at = label.indexOf(q);
    if (at === 0) prefix.push(item);
    else if (at > 0 && wordStart(label, at)) word.push(item);
    else if (item.kw && normalise(item.kw).includes(q)) loose.push(item);
  }

  return [...prefix, ...word, ...loose].slice(0, keep);
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
