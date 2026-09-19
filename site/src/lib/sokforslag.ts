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
 * SÖKNINGEN TÅL FELSTAVNING, och den gör det i två steg som är värda att
 * hålla isär:
 *
 *   Vikningen (foldKey) gör stavningar som låter lika till samma sträng, så
 *   att cafe, kafé och caffe är en och samma fråga. Den kostar ingenting per
 *   fråga och löser den vanligaste sortens fel.
 *
 *   Avståndspasset (repair) letar upp ord som ligger ett eller två tecken fel
 *   och körs BARA när det vanliga passet gav nästan ingenting.
 *
 * Bara det första av de två får synas i det som skrivs ut. Söknyckeln är
 * hopvikt och duger inte att visa för någon, och den ändrar dessutom
 * strängens längd, vilket träffmarkeringen måste veta om. Se mark().
 *
 * SÖKNINGEN TÅL OCKSÅ ETT ORD TILL, och det är en annan sak än stavning.
 * Frågan matchades tidigare som en enda sträng, alltså måste orden stå i följd
 * i registret: "max" gav 70 träffar, "max hamburgare" gav 2 av 34 möjliga och
 * "max stockholm" gav noll fast femton MAX ligger i Stockholm. Frågan delas nu
 * i ord som söks var för sig, se tokens() och scan(), och raderna faller i två
 * högar: de som bär alla orden, och de som bär några. Den andra högen ligger
 * sist och är avstängd så snart den första räcker.
 *
 * Registrets söksträng bär numera också verksamhetens MATKATEGORIER och dess
 * OMRÅDE, alltså det som gör "kebab östermalm" möjligt. Se extraText().
 *
 * Modulen buntas till webbläsaren och får därför inte röra node: eller
 * astro:. lib/face importeras för geometrin och drar bara in en typ, som
 * försvinner vid kompileringen.
 */
import { FACE_MARKUP, FACE_PLATE, type FaceKey } from './face';

/**
 * Rad i registret: [namn, adress, slug, kommunindex, bedömningsindex] och
 * därefter, om raden har dem, [kategorikombination, områdesnummer,
 * hållplatsnummer].
 *
 * De tre sista är olika ofta med, och det är avsiktligt: två tredjedelar av
 * raderna saknar kategori, nästan hälften ligger utanför varje område med egen
 * sida och två tredjedelar har ingen hållplats som tio ställen delar. Skälet
 * till att de utelämnas i stället för att skrivas som nollor står i
 * lib/search-index.ts, och kostnaden i docs/63.
 */
export type Row = [string, string, string, number, number, number?, number?, number?];

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
   * Kommunen har inte längre verksamheten registrerad, se docs/35 §5.1.
   * Bara verksamheter kan bära den; en kommun eller en handling lämnar den
   * odefinierad, precis som `verdict`.
   */
  avreg?: boolean;
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

/**
 * Den VISNINGSNÄRA formen: gemener och avskalade diakriter, ingenting annat.
 *
 * Den bevarar längden. Ett "å" är ett tecken före och efter, eftersom NFD
 * delar det i två och den kombinerande accenten faller bort igen. Därför kan
 * ett index som räknats i den här strängen skäras ur originalet, vilket är
 * precis vad mark() gör. Rör inte den egenskapen.
 */
export function normalise(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// ---- Söknyckeln -----------------------------------------------------------

/**
 * Söknyckeln, alltså den hopvikta formen. Den får BARA matchas mot, aldrig
 * visas.
 *
 * Bakgrunden är ägarens beställning: "ibland skriver man ju lite fel, alt.
 * minns inte exakt stavningen eller vad den heter." Det vanligaste felet är
 * inte ett tappat tecken utan en annan STAVNING av samma ljud. Svenska
 * verksamhetsnamn är fulla av dem, och besökaren skriver den stavning hon
 * hört, inte den som står i kommunens register.
 *
 * Vikningen gör därför de förväxlingar som faktiskt förekommer till samma
 * sträng:
 *
 *     c, ck, q  ->  k     café, kafé, caffe och Cafe blir alla "kafe"
 *     z         ->  s     Pizzeria och Pissaria
 *     x         ->  ks    Max och Maks
 *     w         ->  v     Wictoria och Victoria
 *     ph        ->  f     Sophia och Sofia
 *     qu        ->  kv    Quality och Kvality
 *     dubbel    ->  enkel Villa/Vila, Klostergatan/Klosterrgatan
 *     ' ’ ´ `   ->  bort  O'Learys och OLearys
 *     & . , -   ->  mellanslag, och flera i rad blir ett
 *
 * Dubbelkonsonanten är den enskilt mest lönsamma regeln, och den bär ägarens
 * eget exempel utan att avståndssökningen ens behöver vakna: både
 * "Västerlånggatan" och felstavade "Västerlångatan" viks till
 * "vasterlangatan". Mätt i webbläsaren på det riktiga registret, 504 riktiga
 * gatunamn ur datan med ett inskrivet fel var, löser vikningen ensam 35
 * procent av frågorna. Avståndspasset tar 61 procent till, och 4 procent blir
 * kvar utan träff.
 *
 * Siffror viks inte ihop. "Storgatan 11" och "Storgatan 1" är olika adresser,
 * och en regel som slog ihop dem hade gjort husnumret oanvändbart.
 *
 * Vikningen kostar ingenting över tråden. Registret skickar samma bytes som
 * förut; det är klienten som viker när den ändå bygger sina söksträngar.
 */

/** Bokstäver utanför ASCII som teckenkod till teckenkod. */
const PLAIN = new Map<number, number>();
for (const [from, to] of Object.entries({
  'àáâãäåæÀÁÂÃÄÅÆ': 'a',
  'çÇ': 'c',
  'èéêëÈÉÊË': 'e',
  'ìíîïÌÍÎÏ': 'i',
  'ñÑ': 'n',
  'òóôõöøÒÓÔÕÖØ': 'o',
  'ùúûüÙÚÛÜ': 'u',
  'ýÿÝ': 'y',
  'ßšśŠŚşŞ': 's',
  'žźŽŹ': 'z',
  'čćČĆ': 'c',
  'łŁ': 'l',
  'đĐ': 'd',
  'ğĞ': 'g',
})) {
  for (const c of from) PLAIN.set(c.charCodeAt(0), to.charCodeAt(0));
}

const SPACE = 32;
const LOW_A = 97;
const LOW_Z = 122;
const DIG_0 = 48;
const DIG_9 = 57;

/**
 * Arbetsytan. En modulglobal buffert och inte en sträng per tecken: vikningen
 * körs på 15 900 rader när registret landar, och där är varje allokering
 * betald 16 000 gånger.
 *
 * 1024 platser räcker med marginal. Ett tecken kan ge som mest två (x blir
 * ks), och foldInto läser därför aldrig mer än 500 tecken. Namn och adresser
 * ligger under 80; gränsen finns för inklistrade frågor, och den sitter i
 * vikningen själv så att ingen anropare kan råka gå förbi den.
 */
const KEY_MAX = 500;
const keyBuf = new Uint16Array(1024);
/** Var i originalet varje vikt tecken börjar respektive slutar. */
const keyFrom = new Int32Array(1024);
const keyTo = new Int32Array(1024);
/** Vikt längd av det som låg före `boundary`, se hur registret byggs. */
let keyCut = 0;

/**
 * Viker `s` ner i keyBuf och svarar med antalet tecken.
 *
 * `map` styr om keyFrom och keyTo fylls i. De behövs bara när en träff ska
 * markeras i en rad som faktiskt visas, alltså på ett par rader i taget, och
 * att alltid skriva dem hade lagt två arrayskrivningar per tecken på ett svep
 * över hela registret.
 *
 * `boundary` är ett index i originalet vars vikta motsvarighet läggs i
 * keyCut. Registret vill veta var namnet slutar i den vikta strängen, och det
 * går inte att räkna ut i efterhand: vikningen ändrar längden.
 */
function foldInto(s: string, map: boolean, boundary: number): number {
  let n = 0;
  let last = 0;
  keyCut = -1;
  const len = s.length > KEY_MAX ? KEY_MAX : s.length;

  for (let i = 0; i < len; i++) {
    if (i === boundary) keyCut = last === SPACE ? n - 1 : n;

    let c = s.charCodeAt(i);
    let step = 1;
    let a = 0;
    let b = 0;

    if (c < 65) {
      // Siffror står kvar. Apostrofer faller bort utan att dela ordet, allt
      // annat blir ett mellanslag.
      a = c >= DIG_0 && c <= DIG_9 ? c : c === 39 || c === 96 ? 0 : SPACE;
    } else {
      if (c <= 90) c += 32;
      else if (c > 127) {
        const flat = PLAIN.get(c);
        if (flat !== undefined) c = flat;
        else if (c === 8217 || c === 180) c = 0;
        else {
          // Sällsynta bokstäver, till exempel ur ett namn med tjeckisk eller
          // vietnamesisk stavning. Dyrare vägen, men den går bara på tecken
          // tabellen inte kände igen.
          const d = String.fromCharCode(c).toLowerCase().normalize('NFD').charCodeAt(0);
          c = d >= LOW_A && d <= LOW_Z ? d : SPACE;
        }
      }

      if (c >= LOW_A && c <= LOW_Z) {
        if (c === 99) a = 107; // c blir k, och ck blir kk som viks till k
        else if (c === 113) {
          a = 107; // q blir k
          if ((s.charCodeAt(i + 1) | 32) === 117) {
            b = 118; // qu blir kv
            step = 2;
          }
        } else if (c === 112 && (s.charCodeAt(i + 1) | 32) === 104) {
          a = 102; // ph blir f
          step = 2;
        } else if (c === 122) a = 115; // z blir s
        else if (c === 119) a = 118; // w blir v
        else if (c === 120) {
          a = 107; // x blir ks
          b = 115;
        } else a = c;
      } else if (c >= DIG_0 && c <= DIG_9) a = c;
      else if (c === 0) a = 0;
      else a = SPACE;
    }

    for (let k = 0; k < 2; k++) {
      const ch = k === 0 ? a : b;
      if (!ch) continue;
      if (ch === SPACE) {
        // Flera skiljetecken i rad, och ett inledande, blir ingenting.
        if (last === SPACE || last === 0) continue;
      } else if (ch === last && !(ch >= DIG_0 && ch <= DIG_9)) {
        // Dubbelkonsonanten. Tecknet försvinner ur nyckeln men originalet
        // sträcker sig ett steg längre, och det ska markeringen veta om.
        if (map) keyTo[n - 1] = i + step;
        continue;
      }
      keyBuf[n] = ch;
      if (map) {
        keyFrom[n] = i;
        keyTo[n] = i + step;
      }
      n++;
      last = ch;
    }
    i += step - 1;
  }

  if (last === SPACE) n--;
  if (keyCut < 0 || keyCut > n) keyCut = n;
  return n;
}

/** Bufferten som sträng. Styckvis, för att inte spränga argumentlistan. */
function keyText(n: number): string {
  let out = '';
  for (let i = 0; i < n; i += 256) {
    out += String.fromCharCode.apply(
      null,
      keyBuf.subarray(i, Math.min(n, i + 256)) as unknown as number[],
    );
  }
  return out;
}

/**
 * Söknyckeln för en sträng. Idempotent: en redan vikt sträng viks till sig
 * själv, så det är ofarligt att köra den på en fråga som redan gått igenom.
 */
export function foldKey(s: string): string {
  return keyText(foldInto(s, false, -1));
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
  // RIK-nivån, av samma skäl som på kartan och i listorna: nivåerna är
  // avställda och märket ska se likadant ut överallt, se lib/face.ts.
  //
  // Här stod tidigare nal-nivån med argumentet att förslagslistan buntas till
  // webbläsaren och att åtta kilobyte per läge var för dyrt i en fil som
  // laddas på varje sidvisning. Kostnaden finns kvar men den betalas redan:
  // FACE_MARKUP är ett objekt med tolv strängar och alla tolv följer med i
  // bunten oavsett vilken av dem den här raden slår upp. Att välja nal sparade
  // alltså ingenting i det som gick över tråden, bara i den DOM panelen bygger
  // när den öppnas, och där är åtta rader inte en kostnad.
  return `<svg class="face" viewBox="0 0 100 100" aria-hidden="true" focusable="false">` +
    `<clipPath id="sf-${key}"><rect width="100" height="100" rx="17"/></clipPath>` +
    `<g clip-path="url(#sf-${key})">` +
    `<rect width="100" height="100" fill="${FACE_PLATE[key]}"/>${FACE_MARKUP[key].rik}</g></svg>`;
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
 * TVÅ PASS, och skälet är hela poängen med den här funktionen.
 *
 * Första passet är det gamla: indexet räknas på den normaliserade strängen
 * men skärs ur originalet. Det går bara därför att normaliseringen bevarar
 * längden, så position för position är de två strängarna samma sträng.
 *
 * Söknyckeln gör inte det. Den viker "ck" till "k" och "x" till "ks", alltså
 * ändrar den LÄNGDEN, och ett index räknat i nyckeln pekar på fel bokstav i
 * originalet. Skillnaden växer dessutom med varje vikt tecken före träffen,
 * så felet är inte en bokstav utan flera, och på en lång adress hamnar
 * fetstilen mitt i nästa ord.
 *
 * Valet stod mellan en indexkarta och två pass. Det blev BÅDA, i den här
 * ordningen, för att de löser olika halvor:
 *
 *   Två pass gör att den överlägset vanligaste raden, den som träffas rakt
 *   av, aldrig betalar för vikningen. Den går genom det gamla passet och tar
 *   samma väg som förut.
 *
 *   Indexkartan behövs i andra passet, och den kan bara byggas där. Att bära
 *   en karta per rad i registret vore 15 900 arrayer i minnet för något som
 *   används på de åtta rader panelen visar. Här byggs den för en rad i taget,
 *   när raden faktiskt ska ritas, och kastas direkt.
 *
 * keyFrom och keyTo är kartan: var i originalet det vikta tecknet börjar och
 * var det slutar. De är två och inte en, eftersom ett vikt tecken kan svara
 * mot två original ("nn" som blev "n") och ett original mot två vikta ("x"
 * som blev "ks"). Med bara en startkarta hade slutet på markeringen skurit
 * mitt i det tecken som gav träffen.
 */
export function mark(text: string, q: string): string {
  if (!q) return escapeHtml(text);

  const hela = span(text, q);
  if (hela) return cut(text, [hela]);

  /*
   * ORD FÖR ORD när hela frågan inte står i följd.
   *
   * Det är samma byte som sökningen själv gör, och det syns på precis de rader
   * den nya matchningen la till: "max stockholm" träffar "Max" i namnet och
   * "Stockholm" i orten, alltså två ställen på olika sidor av raden. Utan det
   * här passet ritades de raderna helt utan fetstil, och en lista där inget är
   * markerat läser som en gissning. Se noten över `mark`.
   */
  const ord = q.split(' ').filter(Boolean);
  if (ord.length < 2) return escapeHtml(text);

  const spans: Array<[number, number]> = [];
  for (const w of ord) {
    const s = span(text, w);
    if (s) spans.push(s);
  }
  if (!spans.length) return escapeHtml(text);

  // Överlappande markeringar slås ihop. Två ord kan träffa samma bokstäver,
  // till exempel "max maxi", och två <b> som griper in i varandra ger trasig
  // markup.
  spans.sort((a, b) => a[0] - b[0]);
  const flat: Array<[number, number]> = [spans[0]];
  for (let i = 1; i < spans.length; i++) {
    const sist = flat[flat.length - 1];
    if (spans[i][0] <= sist[1]) sist[1] = Math.max(sist[1], spans[i][1]);
    else flat.push(spans[i]);
  }
  return cut(text, flat);
}

/** Var ett sökord sitter i texten, eller null. Se de två passen i `mark`. */
function span(text: string, q: string): [number, number] | null {
  const at = normalise(text).indexOf(q);
  if (at >= 0) return [at, at + q.length];

  const key = foldKey(q);
  if (!key) return null;
  const n = foldInto(text, true, -1);
  const hit = keyText(n).indexOf(key);
  if (hit < 0) return null;
  return [keyFrom[hit], keyTo[hit + key.length - 1]];
}

function cut(text: string, spans: Array<[number, number]>): string {
  let ut = '';
  let vid = 0;
  for (const [from, to] of spans) {
    ut += escapeHtml(text.slice(vid, from)) + '<b>' + escapeHtml(text.slice(from, to)) + '</b>';
    vid = to;
  }
  return ut + escapeHtml(text.slice(vid));
}

/**
 * Innehållet i en förslagsrads länk. Klasserna stylas av respektive
 * komponent, men strukturen står här så att de två panelerna inte kan få
 * olika rader.
 */
export function suggestionInner(s: Suggestion, q: string): string {
  const badge =
    s.kind === 'place' ? faceSvg(s.verdict) : glyphSvg(GLYPHS[s.kind]);

  /*
   * MÄRKET FÖR EN VERKSAMHET SOM INTE LÄNGRE ÄR REGISTRERAD.
   *
   * FÖRST I METARADEN, och den platsen är räknad och inte vald. Både .name
   * och .meta står med `white-space: nowrap` och `text-overflow: ellipsis` i
   * båda panelerna, alltså klipps raden från HÖGER. Ett märke efter namnet
   * hade därför försvunnit på precis de rader där namnet är långt, och ett
   * märke som ibland inte syns är exakt den fälla §5.1 finns för att stänga.
   * Först i metaraden överlever det varje klippning.
   *
   * Kommunhubbens lista lägger det efter namnet i stället, och det är samma
   * regel och inte en avvikelse: den raden bryter i stället för att klippa,
   * alltså kan märket inte falla bort där.
   *
   * Strängen är AVREGISTRERAD.heading i lib/site, upprepad här av exakt samma
   * skäl som VERDICT_LABEL ovan: modulen buntas till webbläsaren på 14 711
   * sidor och lib/site drar in mer än ett klientskript ska bära för en sträng.
   * Ändras ordet där ska det ändras här, och tvärtom.
   *
   * INTE mark(): märket är vårt eget ord och inte data ur registret, alltså
   * ska en sökning på "registrerad" inte fetstila halva pillret.
   */
  const avreg = s.avreg ? '<span class="avreg">Inte längre registrerad</span>' : '';

  // Bedömningen i ord, bara för verksamheter. Ansiktet är aria-hidden, och
  // utan det här hade en skärmläsare fått namnet och adressen men aldrig
  // omdömet — alltså allt utom det sajten finns för.
  const spoken =
    s.kind === 'place'
      ? `<span class="visually-hidden">. ${escapeHtml(verdictWord(s.verdict))}</span>`
      : '';
  /* Märket står redan som synlig text i metaraden och läses därför upp av sig
     självt. Ingen extra visually-hidden-rad alltså: den hade sagt samma sak
     två gånger i samma listrad. */

  return `<span class="mark" aria-hidden="true">${badge}</span><span class="body"><span class="name">${mark(s.label, q)}</span><span class="meta">${avreg}${mark(s.meta, q)}</span></span>${spoken}`;
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
  /** Vikt "namn adress ort" per rad, byggd en gång. Söknyckeln alltså, inte
   *  något som får visas.
   *  Att namnet ligger FÖRST är avsiktligt: en prefixträff på hela strängen
   *  är därmed samma sak som en prefixträff på namnet, och träffens position
   *  säger dessutom om den sitter i namnet eller i adressen. */
  hay: string[];
  /** Var namnet slutar i hay-strängen. Kan inte räknas som name.length:
   *  vikningen ändrar längden, och gränsen mellan namn och adress är det som
   *  skiljer en namnträff från en adressträff i rankningen. */
  nameEnd: Int32Array;
  /** Områdena: [kommunindex, slug, namn, antal]. Se search-index.ts. */
  omraden: [number, string, string, number][];
  /**
   * Matkategorierna som söktext, en sträng per förekommande kombination.
   *
   * Raden pekar in i listan med ett litet heltal, och plats noll är tom. Att
   * det är text och inte bitar är avsiktligt: den blir en del av radens
   * söksträng och matchas som vilket ord som helst, se `extraText`.
   */
  mk: string[];
  /**
   * Hållplatsnamnen, vanligast först. Raden pekar in med ett tal där ett är
   * plats noll, och bara hållplatser som minst tio ställen delar står här. Se
   * HALLPLATS_MIN i lib/search-index.ts för varför, och `extraText` för hur
   * namnet blir ett sökord utan att bli ett namn.
   */
  hallplatser: string[];
  /** [slug, ort] och en etta på de kommuner som har en kartsida. Se
   *  lib/search-index.ts för varför den tredje platsen finns. */
  kommuner: Array<[string, string] | [string, string, number]>;
  /**
   * Radnumren för de verksamheter kommunen inte längre har registrerade.
   *
   * En Set och inte listan som den kom, eftersom uppslaget sker en gång per
   * ritad rad. Registret bär dem som en lista av radnummer i stället för som
   * ett fält per rad, och talen som motiverar det står i lib/search-index.ts.
   */
  avreg: Set<number>;
}

const index: SearchIndex = {
  rows: [],
  hay: [],
  nameEnd: new Int32Array(0),
  kommuner: [],
  omraden: [],
  mk: [],
  hallplatser: [],
  avreg: new Set(),
};

/**
 * Radens KATEGORIER OCH OMRÅDE som söktext, eller tom sträng.
 *
 * Det här är hela hål tre: "pizzeria odenplan" och "kebab östermalm" är det
 * naturligaste sättet att leta efter mat, och båda halvorna fanns redan i
 * huset. Kategorierna satt i kartans rutor (props.mk i lib/kartrutor.ts) och
 * områdena på verksamhetssidan ("Restaurang · Birger Jarlsgatan 4 · Stockholm ·
 * Östermalm"), men ingen av dem gick att nå från fritextsökningen.
 *
 * Texten läggs SIST i söksträngen, efter namn, adress och ort. Platsen är
 * räknad: `nameEnd` skiljer en namnträff från en adressträff i rankningen, och
 * ett ord som bara står i kategorin ska aldrig kunna se ut som ett namn. En
 * träff här hamnar därför alltid i den lösa klassen, alltså under dem som
 * heter det man skrev.
 *
 * HÅLLPLATSEN står allra sist, och det var den som faktiskt saknades.
 * Kategorierna var sökbara redan, men "odenplan" stod i 16 namn, noll
 * adresser och inget område, så "pizzeria odenplan" hade ingen rad som bar
 * båda orden. Namnet är närmaste hållplats ur lib/narhet.ts, bara när minst tio
 * ställen delar den och bara när namnet eller adressen inte redan säger det.
 * Samma regel om klassen gäller: ett hållplatsord kan aldrig slå ett namnord.
 */
function extraText(row: Row): string {
  const delar: string[] = [];
  if (row[5]) delar.push(index.mk[row[5]] ?? '');
  if (row[6]) delar.push(index.omraden[row[6] - 1]?.[2] ?? '');
  if (row[7]) delar.push(index.hallplatser[row[7] - 1] ?? '');
  const text = delar.filter(Boolean).join(' ');
  return text ? ` ${text}` : '';
}
/**
 * Var extratexten börjar i varje rads söksträng, alltså kategorin, området och
 * hållplatsen. Lika med strängens längd när raden inte har någon.
 *
 * Gränsen finns för FRASBONUSEN i `scan` och ingenting annat. Uppmätt på
 * "kebab uppsala" 2026-09-14: Döner & Co bär kategoritexten "Pizza pizzeria
 * pizzor Kebab" och hållplatsen "Uppsala Centralstation", alltså stod
 * "kebab upsala" i följd över skarven mellan två fält. Raden fick bonusen för
 * hela frågan i följd, flyttades upp i namnklassen och gick förbi Holy Kebab
 * Gränby och Amandas & Kebab house, som bär ordet i sina namn. Samma skarv
 * fanns redan mellan kategori och område. Två ord som bara råkar stå intill
 * varandra i två olika fält är inte frågan i följd.
 */
let extraStart = new Int32Array(0);
/** Kommunernas orter som söknycklar, vikta en gång i stället för per fråga. */
let kommunKey: string[] = [];
let omradeKey: string[] = [];
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
      index.omraden = data.o ?? [];
      /* `?? []` av samma skäl som `data.a` nedan: ett dokument ur besökarens
         cache kan peka på ett register som byggdes innan nyckeln fanns, och en
         sökning som kastar är ett värre fel än en sökning utan kategoriord. */
      index.mk = data.mk ?? [];
      /* Samma `?? []`, av samma skäl: ett äldre register utan hållplatser ska
         ge en sökning utan platsord, inte en sökning som kastar. */
      index.hallplatser = data.h ?? [];
      /* `?? []` och inte `data.a`: ett dokument ur besökarens cache kan peka
         på ett register som byggdes innan nyckeln fanns, och en sökning som
         kastar är ett värre fel än en sökning utan märke. Samma hållning som
         reservadressen ovan. */
      index.avreg = new Set<number>(data.a ?? []);
      kommunKey = index.kommuner.map(([, city]) => foldKey(city));
      /* Vikta en gång, som kommunerna. 148 rader, alltså inget att optimera,
         men samma mönster gör att en läsare slipper undra varför de skiljer. */
      omradeKey = index.omraden.map(([, , namn]) => foldKey(namn));

      /*
       * Söksträngarna byggs i ETT svep per rad, inte tre.
       *
       * Den gamla raden var `normalise(namn + adress + ort)`. Vikningen är
       * dyrare per tecken än normaliseringen, och att köra den flera gånger
       * per rad hade märkts. Mätt i Chrome på det riktiga registret, 15 983
       * rader och ett svep per rad, kostar vikningen 60 till 80 ms mot
       * normaliseringens 20 till 55. Spridningen är maskinen och inte koden,
       * men förhållandet håller sig: ungefär fyrtio millisekunder extra, en
       * gång per sidladdning, i samma andetag som registret ändå tolkas.
       *
       * Det är också skälet till att keyCut finns. Alternativet hade varit att
       * vika namnet en gång till för att veta hur långt det är, alltså att
       * betala hela den kostnaden två gånger för ett heltal.
       *
       * Adressen utelämnas när den saknas i stället för att bli ett tomt
       * mellanslag. Karlstad publicerar ingen adress, och en fråga som spänner
       * över "namn ort" ska träffa där lika väl som i övriga elva kommuner.
       */
      /*
       * EXTRATEXTEN VIKS FÖR SIG och fogas på efteråt, så att gränsen till den
       * blir känd, se `extraStart`. Strängen blir tecken för tecken densamma som
       * när allt veks i ett svep: fälten skiljs alltid av ett mellanslag, och
       * vikningen slår aldrig ihop något över ett mellanslag. Kostnaden är en
       * andra vikning av en kort sträng på de rader som har en.
       */
      const n = index.rows.length;
      const hay = new Array<string>(n);
      const nameEnd = new Int32Array(n);
      const extra = new Int32Array(n);
      for (let i = 0; i < n; i++) {
        const row = index.rows[i];
        const [name, address, , k] = row;
        const city = index.kommuner[k][1];
        const len = foldInto(
          address ? `${name} ${address} ${city}` : `${name} ${city}`,
          false,
          name.length,
        );
        nameEnd[i] = keyCut;
        const bas = keyText(len);
        const tillagg = extraText(row);
        const vikt = tillagg ? foldKey(tillagg) : '';
        hay[i] = vikt ? `${bas} ${vikt}` : bas;
        extra[i] = bas.length;
      }
      index.hay = hay;
      index.nameEnd = nameEnd;
      extraStart = extra;
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
  /** Områdena, se search-index.ts. Rankas direkt efter kommunerna: den som
   *  skriver "Östermalm" vill till stadsdelen och inte till en verksamhet som
   *  råkar ha ordet i sin adress. */
  omradePrefix: Suggestion[];
  namePrefix: Suggestion[];
  nameWord: Suggestion[];
  kommunLoose: Suggestion[];
  loose: Suggestion[];
  /**
   * NÄSTAN-TRÄFFARNA: rader som bär några av frågans ord men inte alla.
   *
   * Klassen finns för att ett ord till ska SMALNA AV och inte utplåna. "max
   * hamburgare" är fallet den byggdes för: ordet "hamburgare" står bokstavligen
   * i två av trettiofyra MAX-namn, alltså gav en ren OCH-sökning 2 av 34 och
   * kastade de trettiotvå som frågan handlade om.
   *
   * Raderna ligger SIST i rankningen, alltid under dem som bär hela frågan, och
   * sinsemellan efter hur sällsynta de träffade orden är. Se `offerScored`.
   *
   * Tom i tre lägen, och alla tre är avsiktliga: frågan är ett enda ord, hela
   * frågan gav redan tillräckligt många träffar, eller något av orden finns
   * inte någonstans i registret. Det sista är det som håller "sushi kalmar" och
   * "mcdonalds göteborg" på noll: vi täcker inte de kommunerna, och att då
   * svara med sushi i Uppsala vore att byta ett tomt svar mot ett felaktigt.
   */
  partial: Suggestion[];
  /** Antal nästan-träffar i hela registret. Noll när klassen inte fylldes. */
  partialCount: number;
  /**
   * Antal verksamhetsträffar i HELA registret, oberoende av hur många rader
   * som sparades. /sok skriver ut talet och får inte skriva ut "40".
   *
   * Räknar bara rader som bär ALLA frågans ord. Nästan-träffarna räknas för
   * sig, eftersom "2 träffar" och "34 liknande" är två olika besked och sidan
   * inte får slå ihop dem till ett tal som ingen kan kontrollera.
   */
  count: number;
  /**
   * Frågan raderna faktiskt matchades mot. Skicka DEN till mark(), inte det
   * skrivna.
   *
   * Nästan alltid ÄR den det skrivna, normaliserat. Den skiljer sig bara när
   * avståndspasset bytt ut ett felstavat ord, och då står här den rättade
   * frasen. Utan det skulle raderna markera efter en stavning som inte finns
   * i dem, alltså inte markera alls: besökaren fick en lista utan att se
   * varför något av det låg där.
   */
  term: string;
  /**
   * Rättningen att skriva ut som "Menade du ...", eller null.
   *
   * Null betyder inte att inget rättades. Den är satt bara när vi är säkra,
   * se sureEnough längre ner, och raderna kan mycket väl komma från en rättad
   * fråga ändå. Skillnaden är om vi PÅSTÅR något eller bara visar det vi
   * hittade.
   */
  didYouMean: string | null;
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
 * faktiskt tar sig in. När klassen är full kostar en kandidat två jämförelser,
 * och 17 146 sådana är inget. Följden är att panelens sju bästa är exakt
 * /sok:s sju första: samma klass, samma ordning, samma urval, bara olika
 * djupt.
 *
 * ORDNINGEN INOM KLASSEN har tre led, och funktionen bär alla tre därför att
 * de hela träffarna och nästan-träffarna ska rankas av samma kod:
 *
 *   `score` först. För en hel träff är den ett när raden bär frågan i följd
 *   och noll annars; för en nästan-träff är den summan av de träffade ordens
 *   sällsynthet, se `weigh`.
 *
 *   `cls` sedan, alltså var träffen sitter. De hela träffarna ligger redan i
 *   var sin klasslista och skickar därför noll.
 *
 *   Kortast namn sist, se `byLength`.
 */
interface Scored {
  item: Suggestion;
  score: number;
  cls: number;
}

function betterScored(a: Scored, b: Scored): boolean {
  if (a.score !== b.score) return a.score > b.score;
  if (a.cls !== b.cls) return a.cls < b.cls;
  return byLength(a.item, b.item) < 0;
}

function offerScored(
  bucket: Scored[],
  keep: number,
  score: number,
  cls: number,
  name: string,
  make: () => Suggestion,
): void {
  const n = bucket.length;
  if (n >= keep) {
    const worst = bucket[n - 1];
    if (score < worst.score) return;
    if (
      score === worst.score &&
      (cls > worst.cls || (cls === worst.cls && name.length > worst.item.label.length))
    ) {
      return;
    }
  }

  const rad: Scored = { item: make(), score, cls };
  let i = n;
  bucket.push(rad);
  while (i > 0 && betterScored(rad, bucket[i - 1])) {
    bucket[i] = bucket[i - 1];
    i--;
  }
  bucket[i] = rad;
  if (bucket.length > keep) bucket.pop();
}

// ---- Frågans ord ----------------------------------------------------------

/**
 * FLER ORD SKA RANGORDNA, INTE UTESLUTA.
 *
 * Sökningen matchade tidigare hela frågan som EN sträng: "max hamburgare" lästes
 * som bokstäverna "maks hamburgare" i följd, och eftersom registret bär "Max
 * Hötorget", "MAX Sergels Torg" och "Max Burgers" gav ett extra beskrivande ord
 * 2 träffar där ordet ensamt gav 70. "max stockholm" gav noll, fast femton MAX
 * ligger i Stockholm och orten står i varenda en av deras söksträngar. Att lägga
 * till orten är den vanligaste förfiningen en människa gör, och den slog sönder
 * svaret.
 *
 * Frågan delas därför i ORD, och varje ord söks för sig:
 *
 *   Rader som bär ALLA orden är träffarna. De rankas som förut, i klasser efter
 *   var träffen sitter. "max stockholm" blir därmed de MAX som ligger i
 *   Stockholm, varken mer eller mindre.
 *
 *   Rader som bär NÅGRA av orden är nästan-träffar och ligger sist, se
 *   `Groups.partial`.
 *
 * Åtta ord är taket. En fråga med fler är inte en sökning utan en inklistrad
 * mening, och masken som bär vilka ord raden träffat får plats i ett heltal.
 */
const TOKEN_MAX = 8;

function tokens(key: string): string[] {
  const parts = key.split(' ');
  return parts.length > TOKEN_MAX ? parts.slice(0, TOKEN_MAX) : parts;
}

/** Vilka av frågans ord raden bär, som bitar. Fylls av `scan`. */
let hitMask = new Int32Array(0);
/**
 * Var varje ord träffade, som två bitar per ord: 0 namnets början, 1 ett ord i
 * namnet, 2 längre bak, 3 ingen träff.
 *
 * En klass PER ORD och inte en per rad, och det är skillnaden mellan att hitta
 * Riche och att hitta ett 7-Eleven. "birger jarlsgatan 4" bär ett ensamt "4",
 * och den siffran står i tusen namn: "7 Eleven 4216125" träffar den mitt i sitt
 * namn och såg därmed ut som en namnträff, medan Riche, som ligger på adressen
 * man skrev, såg ut som en adressträff och hamnade under. Klassen väljs därför
 * i `gather` efter radens SÄLLSYNTASTE ord, och sällsyntheten är känd först när
 * hela svepet är gjort. Alltså måste alla klasserna sparas.
 */
let hitClass = new Int32Array(0);
/**
 * En bit per ord: slutade träffen vid ett ordslut?
 *
 * "max" står först i både "Max Bromma" och "Maxim", alltså i samma klass, och
 * mellan dem avgjorde kortast namn: tre "Maxim" la sig över samtliga
 * MAX-restauranger på "max stockholm". Ett HELT ord är en starkare träff än
 * början på ett längre, och biten säger vilket det var. Den kan bara vara satt
 * när ordet är färdigskrivet, alltså stör den inte den som söker medan hon
 * skriver: "esp" slutar mitt i "espresso" i varenda rad.
 */
let hitWhole = new Int32Array(0);
/** Ett för de rader som bär hela frågan i följd. Se poängen i `gather`. */
let hitPhrase = new Uint8Array(0);
/** Hur många rader varje ord står i, och ordets vikt i poängen. */
const hitDf = new Int32Array(TOKEN_MAX);
const hitWeight = new Int32Array(TOKEN_MAX);

/**
 * Ett svep över registret som räknar ut allt strängarbete på en gång.
 *
 * Att det är ETT svep och inte två är prestandan. Nästan-klassen behöver veta
 * hur sällsynt varje ord är innan raderna kan rankas, alltså måste hela
 * registret vara läst innan den första raden byggs. Passet lägger därför undan
 * vilka ord raden bar och var den bästa träffen satt, och `gather` bygger sedan
 * listorna ur talen utan att röra en enda sträng igen.
 *
 * Svarar med antalet rader som bar ALLA orden.
 */
function scan(toks: string[], key: string): number {
  const { hay, nameEnd } = index;
  const n = hay.length;
  if (hitMask.length < n) {
    hitMask = new Int32Array(n);
    hitClass = new Int32Array(n);
    hitWhole = new Int32Array(n);
    hitPhrase = new Uint8Array(n);
  }
  const alla = (1 << toks.length) - 1;
  const enda = toks.length === 1;
  hitDf.fill(0);

  let full = 0;
  for (let i = 0; i < n; i++) {
    const h = hay[i];
    let mask = 0;
    let klasser = 0;
    let hela = 0;
    for (let t = 0; t < toks.length; t++) {
      const tok = toks[t];
      const at = h.indexOf(tok);
      if (at < 0) {
        klasser |= 3 << (t << 1);
        continue;
      }
      mask |= 1 << t;
      hitDf[t]++;
      const c = at === 0 ? 0 : at < nameEnd[i] && wordStart(h, at) ? 1 : 2;
      klasser |= c << (t << 1);
      // Slutet räcker: att träffen BÖRJAR ett ord ligger redan i klassen.
      const slut = at + tok.length;
      if (slut === h.length || h.charCodeAt(slut) === SPACE) hela |= 1 << t;
    }
    hitMask[i] = mask;
    hitClass[i] = klasser;
    hitWhole[i] = hela;
    /* Hela frågan i följd. Ett ord till söks bara när raden redan bär alla
       orden, alltså på en bråkdel av registret, och svaret på "är det här
       samma sak som förut?" är värt det: se poängen i `gather`. */
    /* Bara INOM namn, adress och ort, se `extraStart`. Första förekomsten
       räcker: extratexten ligger sist, så en fras som börjar före gränsen och
       slutar efter den kan inte ha en senare förekomst som ryms före. */
    let fras = 0;
    if (!enda && mask === alla) {
      const p = h.indexOf(key);
      fras = p >= 0 && p + key.length <= extraStart[i] ? 1 : 0;
    }
    hitPhrase[i] = fras;
    if (mask === alla) full++;
  }
  return full;
}

/**
 * Ordens vikt: ju färre rader ordet står i, desto tyngre väger det.
 *
 * Det är den vanliga idf-vikten, och den avgör ordningen bland nästan-träffarna.
 * "pizzeria odenplan" är fallet som visar varför: "pizzeria" står i tusentals
 * rader och "odenplan" i femton, alltså ska de femton ligga överst. Utan vikten
 * hade det vanligaste ordet i frågan bestämt hela listan.
 *
 * Talen är heltal, tusendelar av den naturliga logaritmen, eftersom de bara
 * jämförs med varandra och heltal jämförs billigare.
 */
function weigh(toks: string[], rows: number): void {
  for (let t = 0; t < toks.length; t++) {
    const df = hitDf[t];
    hitWeight[t] = df > 0 ? Math.round(1000 * Math.log(rows / df)) : 0;
  }
}

/**
 * Ett pass över registret med en färdig söknyckel.
 *
 * `keep` är hur många rader varje klass sparar. Panelen ber om sju,
 * resultatsidan om fyrtio. Talet påverkar bara djupet, aldrig ordningen.
 *
 * `toks` är frågans ord och `q` samma fråga som en sträng. Kommunerna och
 * områdena matchas mot HELA strängen och inte mot orden var för sig: en kommun
 * heter det den heter, och "max stockholm" ska ge MAX i Stockholm och inte en
 * rad som föreslår hela kommunen.
 *
 * `delvis` säger om nästan-klassen ska fyllas. Beslutet fattas i `collect`.
 */
function gather(toks: string[], q: string, keep: number, term: string, delvis: boolean): Groups {
  const { rows, kommuner } = index;
  const kommunPrefix: Suggestion[] = [];
  const kommunLoose: Suggestion[] = [];
  const namePrefix: Scored[] = [];
  const nameWord: Scored[] = [];
  const loose: Scored[] = [];
  let count = 0;

  for (let i = 0; i < kommuner.length; i++) {
    const [slug, city, karta] = kommuner[i];
    const c = kommunKey[i];
    /*
     * Kommunraden leder till den delade vyn när kommunen har en.
     *
     * Ägarens beställning, ordagrant: "söker man på en kommun tex i sök ska
     * man komma till split screen på karta och lista". Den som söker på en
     * ORT vill se orten, och kartsidan är den enda sida som visar den; hubben
     * är en bokstavsordnad katalog. De fyra kommuner som inte lämnar en enda
     * koordinat har ingen kartsida och står därför kvar på hubben.
     *
     * Metaraden säger vilken av de två raden leder till. Utan den ser två
     * kommunrader identiska ut och leder olika, vilket är värre än att den
     * ena är en katalog.
     */
    const item: Suggestion = karta
      ? { label: city, meta: 'Kommun · karta och lista', href: `/${slug}/karta/`, kind: 'kommun' }
      : { label: city, meta: 'Kommun', href: `/${slug}/`, kind: 'kommun' };
    if (c.startsWith(q)) kommunPrefix.push(item);
    else if (c.includes(q)) kommunLoose.push(item);
  }

  // Tolv kommuner: en vanlig sortering är billigare än en insättning.
  kommunPrefix.sort(byLength);
  kommunLoose.sort(byLength);

  /*
   * OMRÅDENA. Ägaren 2026-08-25: "varför kan jag ej söka på områden som t.ex.
   * Östermalm eller Kungsholmen i sök?"
   *
   * Bara prefixträffar, till skillnad från kommunerna som också tas på en
   * träff mitt i ordet. Skälet är att områdesnamn är korta och ofta ingår i
   * varandra: "Gamla stan" mot "stan", "Norra Ängby" mot "Ängby". En lös
   * träff hade fyllt panelen med stadsdelar som bara delar en stavelse med
   * frågan.
   *
   * Metaraden bär kommunen OCH antalet, eftersom två kommuner kan ha ett
   * Centrum och den som söker måste se vilket som är vilket.
   */
  const omradePrefix: Suggestion[] = [];
  for (let i = 0; i < index.omraden.length; i++) {
    if (!omradeKey[i].startsWith(q)) continue;
    const [k, slug, namn, antal] = index.omraden[i];
    const [kommunSlug, city] = kommuner[k];
    omradePrefix.push({
      label: namn,
      meta: `Område i ${city} · ${antal} verksamheter`,
      href: `/${kommunSlug}/omrade/${slug}/`,
      kind: 'kommun',
    });
  }
  omradePrefix.sort(byLength);

  /*
   * Raderna byggs ur `scan`:s tal och inte ur strängarna igen. Masken säger
   * vilka av frågans ord raden bar, och `alla` är masken där samtliga sitter.
   */
  const alla = (1 << toks.length) - 1;
  const partial: Scored[] = [];
  let partialCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const mask = hitMask[i];
    if (mask === 0) continue;
    const hel = mask === alla;
    if (!hel && !delvis) continue;

    /*
     * KLASSEN VÄLJS EFTER RADENS SÄLLSYNTASTE ORD, se `hitClass`. Poängen
     * summerar de träffade ordens vikt, alltså står en rad som bär två
     * sällsynta ord före en som bär ett vanligt.
     */
    let cls = 3;
    let score = 0;
    let tyngst = -1;
    let helt = 0;
    for (let t = 0; t < toks.length; t++) {
      if ((mask & (1 << t)) === 0) continue;
      const w = hitWeight[t];
      score += w;
      const c = (hitClass[i] >> (t << 1)) & 3;
      if (w > tyngst || (w === tyngst && c < cls)) {
        tyngst = w;
        cls = c;
        helt = (hitWhole[i] >> t) & 1;
      }
    }
    /* Poängen har tre led och de väger i den här ordningen: hela frågan i
       följd, sedan att det tyngsta ordet är ett helt ord, sedan orden själva.
       För en hel träff är summan lika för alla rader och de två bonusarna
       avgör; för en nästan-träff är det tvärtom. */
    score += hitPhrase[i] * 2 + helt;

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
      avreg: index.avreg.has(i),
    });

    if (hel) {
      count++;
      /*
       * HELA FRÅGAN I FÖLJD ÄR VÄRD ETT STEG NÄRMARE NAMNET.
       *
       * Ordindelningen kostade annars adressökningen dess bästa rad. "birger
       * jarlsgatan 4" gick från 16 träffar till 22, och bland de sex nya låg
       * "Monster Chicken, Birger Jarlsgatan" på Birger jarlsgatan 34: den bär
       * gatan i sitt NAMN och en fyra inuti ett husnummer, alltså såg den ut
       * som en namnträff och la sig över Riche, som ligger på precis den
       * adress som skrevs. Uppmätt: Riche föll från plats 1 till plats 2.
       *
       * En rad som bär hela frågan i följd flyttas därför ett steg uppåt i
       * klasserna och står dessutom först inom sin klass. Det är samma
       * rangordning som fanns före ordindelningen, med de nya raderna under i
       * stället för i vägen.
       */
      const rank = hitPhrase[i] && cls > 0 ? cls - 1 : cls;
      const hink = rank === 0 ? namePrefix : rank === 1 ? nameWord : loose;
      offerScored(hink, keep, score, 0, name, make);
      continue;
    }

    partialCount++;
    offerScored(partial, keep, score, cls, name, make);
  }

  return {
    kommunPrefix,
    omradePrefix,
    namePrefix: namePrefix.map((p) => p.item),
    nameWord: nameWord.map((p) => p.item),
    kommunLoose,
    loose: loose.map((p) => p.item),
    partial: partial.map((p) => p.item),
    partialCount,
    count,
    term,
    didYouMean: null,
  };
}

/**
 * Kandidaterna, klassvis och rankade, med avståndspasset som reserv.
 *
 * Frågan kommer in normaliserad från fältet och viks här. Att den viks på ETT
 * ställe är hela skälet till att den här modulen finns: panelen och /sok kan
 * inte längre tolka samma bokstäver olika.
 */
export function collect(q: string, keep: number): Groups {
  const key = foldKey(q);
  /*
   * EN NYCKEL PÅ ETT TECKEN ÄR INGET SVAR.
   *
   * En fråga som bara består av skiljetecken viks till ingenting, och en tom
   * nyckel finns i varje rad på plats noll: utan den här raden gav "&&" sju
   * godtyckliga verksamheter och såg ut som ett svar.
   *
   * Ett tecken är samma fel en storlek större, och det hittades när frågorna i
   * docs/63 kördes: "zzzzz" viks till "s", eftersom z blir s och dubbletter
   * faller bort, och "s" står i 16 674 av 17 146 rader. Sidan svarade alltså
   * med hela registret på fem tecken nonsens. En fråga på två tecken eller mer
   * som viks till ETT är alltid samma bokstavsljud upprepat, aldrig ett namn
   * någon söker, och det svaret är noll.
   */
  if (!key || (key.length < 2 && q.length > 1)) {
    return {
      kommunPrefix: [],
      omradePrefix: [],
      namePrefix: [],
      nameWord: [],
      kommunLoose: [],
      loose: [],
      partial: [],
      partialCount: 0,
      count: 0,
      term: q,
      didYouMean: null,
    };
  }

  const groups = run(key, keep, q);
  if (groups.count >= NEAR_MIN) return groups;

  const fix = repair(key);
  if (!fix) return groups;

  /* BYTET SKER BARA NÄR DET SKRIVNA GAV NOLL.
     ────────────────────────────────────────────────────────────────────────
     Här byttes frågan ut så snart träffarna var färre än tre, alltså även när
     de var en eller två. Följden var att sidan visade träffar för ett ord
     besökaren inte skrivit, utan att säga det: `didYouMean` krävde tomt
     resultat och tigde därför i precis de lägen då bytet faktiskt skedde.
     Att svara på en annan fråga i tysthet är sämre än att inte rätta alls.

     Nu gäller: noll träffar byter fråga, en eller två behåller sina. I det
     andra fallet står rättningen som en LÄNK i stället, "Menade du X?", och
     besökaren väljer själv. Det är Googles ordning, och den bygger på att den
     som fått två träffar har fått ett svar på det hon faktiskt skrev. */
  if (groups.count > 0) {
    groups.didYouMean = fix.didYouMean;
    return groups;
  }

  const better = run(fix.key, keep, fix.key);
  /* En rättning som inte hittar något får inte kosta oss nästan-träffarna.
     "max burgare" är fallet: hela frasen finns ingenstans, men de trettiofyra
     MAX-raderna gör det, och en rättad fras utan en enda träff är ett sämre
     svar än de raderna. */
  if (better.count === 0 && better.partial.length === 0 && groups.partial.length > 0) {
    return groups;
  }
  better.didYouMean = fix.didYouMean;
  return better;
}

/**
 * Ett helt sökpass: svep, vikter och rankning.
 *
 * NÄR NÄSTAN-KLASSEN FYLLS, och alla tre villkoren är nödvändiga:
 *
 *   Frågan har mer än ett ord. Ett ensamt ord har ingen delmängd att falla
 *   tillbaka på, och passet ska då bete sig exakt som förut.
 *
 *   Hela frågan gav färre än RELAX_MIN träffar. Gav den fler har besökaren
 *   redan fått ett svar på det hon skrev, och att fylla på med rader som bara
 *   bär hälften av orden vore att sänka listan. "max stockholm" ger 39 hela
 *   träffar och ser därför aldrig ett enda nästan-svar.
 *
 *   Varje ord finns någonstans i registret. Det är det villkor som håller
 *   "mcdonalds göteborg" och "sushi kalmar" på noll: vi täcker inte de
 *   kommunerna, och ett ord vi aldrig sett är ett ord besökaren menade på
 *   riktigt. Att då visa McDonald's i Örebro vore att svara på en fråga som
 *   inte ställdes.
 */
function run(key: string, keep: number, term: string): Groups {
  const toks = tokens(key);
  const full = scan(toks, key);
  /* Vikterna räknas ALLTID, inte bara när nästan-klassen fylls: de avgör vilket
     av radens ord som bestämmer klassen, se `gather`. Åtta logaritmer per
     fråga. */
  weigh(toks, index.hay.length);
  const delvis =
    toks.length > 1 && full < RELAX_MIN && hitDf.every((df, t) => t >= toks.length || df > 0);
  return gather(toks, key, keep, term, delvis);
}

/**
 * Så många hela träffar som räcker för att nästan-träffarna ska tiga.
 *
 * Tio, och talet är mätt och inte tyckt. Provat mot de 49 frågorna i docs/63 i
 * tre lägen: alltid på, tröskel tio och tröskel fyrtio. Skillnaden mellan tio
 * och fyrtio är noll rader i de fyrtionio utfallen, eftersom ingen fråga i
 * listan landar mellan de två. Skillnaden mot "alltid på" är däremot stor:
 * "max odenplan" har en enda hel träff och den är rätt, och med klassen alltid
 * påslagen följde 3 800 rader med som bar antingen "max" eller "odenplan"
 * under den. Tröskeln finns alltså för att ett bra svar inte ska dränkas i ett
 * sämre.
 */
const RELAX_MIN = 10;

// ---- Avståndspasset -------------------------------------------------------

/**
 * Så få träffar det vanliga passet får ge innan avståndssökningen vaknar.
 *
 * Tre och inte noll. En fråga som ger en enda träff är ofta ett halvt ord med
 * ett fel i, och den som skrivit "Stensholmsvgen" har redan sett listan
 * krympa till ingenting. Men det är också gränsen som håller kostnaden nere:
 * en fråga som ger träffar går aldrig in här, och det är de allra flesta.
 */
const NEAR_MIN = 3;

/** Kortare ord än så rättas inte. Ett fel på tre tecken är en annan fråga. */
const FUZZY_MIN = 4;

/**
 * Ordboken: varje ord som förekommer i registret, i vikt form.
 *
 * Den byggs LAT, alltså först när någon faktiskt stavat fel, och sedan en
 * gång. Att bygga den vid inläsningen hade lagt tolv millisekunder på varje
 * sidladdning för något de flesta besökare aldrig rör.
 *
 * Den byggs dessutom ur hay, som redan är vikt, och inte ur rådatan. Att
 * splittra 15 983 färdiga strängar på mellanslag kostar 12 ms; att vika om
 * varje ord hade kostat 93. Den första felstavade frågan bär den kostnaden
 * plus att koden nedanför kompileras för första gången, mätt till 17 ms i
 * Chrome. Alla frågor efter den ligger under fem.
 *
 * Mätt på det riktiga registret: 15 337 unika ord.
 */
let words: string[] | null = null;
/** Så många rader ordboken byggdes ur. Registret kan landa efter första
 *  frågan, och en ordbok byggd ur ett tomt register får inte bli kvar. */
let wordRows = -1;
/** Bokstäverna i varje ord som 26 bitar. Grovsållningen, se nearest. */
let wordMask: Int32Array = new Int32Array(0);
let wordLen: Int32Array = new Int32Array(0);
/** Hur många rader ordet står i. Skiljedomare när avstånden är lika. */
let wordFreq: Int32Array = new Int32Array(0);

function dictionary(): void {
  if (words && wordRows === index.hay.length) return;
  const seen = new Map<string, number>();
  const hay = index.hay;
  wordRows = hay.length;
  for (let i = 0; i < hay.length; i++) {
    const h = hay[i];
    let start = 0;
    for (let j = 0; j <= h.length; j++) {
      if (j === h.length || h.charCodeAt(j) === SPACE) {
        if (j - start >= FUZZY_MIN) {
          const w = h.slice(start, j);
          seen.set(w, (seen.get(w) ?? 0) + 1);
        }
        start = j + 1;
      }
    }
  }

  words = [...seen.keys()];
  wordMask = new Int32Array(words.length);
  wordLen = new Int32Array(words.length);
  wordFreq = new Int32Array(words.length);
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    let m = 0;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - LOW_A;
      if (c >= 0 && c < 26) m |= 1 << c;
    }
    wordMask[i] = m;
    wordLen[i] = w.length;
    wordFreq[i] = seen.get(w)!;
  }
}

function popcount(x: number): number {
  x -= (x >> 1) & 0x55555555;
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  x = (x + (x >> 4)) & 0x0f0f0f0f;
  return (x * 0x01010101) >> 24;
}

const dpA = new Int32Array(128);
const dpB = new Int32Array(128);

/**
 * Redigeringsavståndet mellan `q` och det BÄSTA PREFIXET av `w`, eller max+1
 * när det är längre än så.
 *
 * Prefix och inte hela ordet, därför att fältet söker medan man skriver.
 * Halvskrivna "stensholmsv" ska ligga nära "stensholmsvagen" och inte fyra
 * steg bort bara för att fyra bokstäver ännu inte hunnit skrivas. Det är
 * samma sak som DP-tabellens sista rad: minsta värdet i den är avståndet till
 * det prefix som passar bäst.
 *
 * Bandet, alltså att bara celler med |i-j| <= max räknas, är det som gör
 * funktionen billig. Ett svar över max är ändå värdelöst, och utanför bandet
 * kan svaret inte bli mindre än så. Raden avbryts dessutom så fort hela den
 * blivit för dyr.
 */
function prefixDistance(q: string, w: string, max: number): number {
  const n = q.length;
  const m = Math.min(w.length, n + max);
  let prev = dpA;
  let cur = dpB;
  for (let j = 0; j <= m; j++) prev[j] = j;

  for (let i = 1; i <= n; i++) {
    const qc = q.charCodeAt(i - 1);
    const lo = Math.max(1, i - max);
    const hi = Math.min(m, i + max);
    cur[0] = i;
    let best = i;
    for (let j = 1; j < lo; j++) cur[j] = max + 1;
    for (let j = lo; j <= hi; j++) {
      let v = prev[j - 1] + (qc === w.charCodeAt(j - 1) ? 0 : 1);
      if (prev[j] + 1 < v) v = prev[j] + 1;
      if (cur[j - 1] + 1 < v) v = cur[j - 1] + 1;
      cur[j] = v;
      if (v < best) best = v;
    }
    for (let j = hi + 1; j <= m; j++) cur[j] = max + 1;
    if (best > max) return max + 1;
    const swap = prev;
    prev = cur;
    cur = swap;
  }

  let best = max + 1;
  for (let j = 0; j <= m; j++) if (prev[j] < best) best = prev[j];
  return best;
}

interface Candidate {
  word: string;
  distance: number;
  freq: number;
}

/**
 * De fyra närmaste orden i ordboken, närmast först.
 *
 * SÅLLNINGEN ÄR HELA PRESTANDAN. Att räkna avstånd mot 15 337 ord per
 * tangenttryck är inte gratis, och därför prövas ett ord bara om det klarar
 * två frågor som var och en kostar en jämförelse:
 *
 *   Är det långt nog? Ett prefixavstånd på högst `max` kräver att ordet är
 *   minst så många tecken kortare än frågan. Uppåt finns ingen gräns, för
 *   frågan är ofta ett halvskrivet ord.
 *
 *   Saknar det för många av frågans bokstäver? Varje bokstav som finns i
 *   frågan men inte i ordet kostar minst en redigering, så fler än `max`
 *   sådana kan inte gå ihop. Bokstäverna ligger som 26 bitar per ord, alltså
 *   en OCH och en bituppräkning.
 *
 * Mätt i Chrome på det riktiga registret slipper sållningen igenom 100 till
 * 4 300 ord av 15 337. Hela reservpasset, alltså sållning, avstånd, ett andra
 * svep över registret med den rättade frasen och rankningen av det, kostar
 * över 504 riktiga felstavade gatunamn 1,8 ms i median, 3,9 ms i 95:e
 * percentilen och 5,7 ms som värst. Det vanliga passet ensamt ligger på
 * 0,7 ms. Att skriva "Stensholmsvgen 3" tecken för tecken, alltså sexton
 * frågor i rad varav de sista går genom reserven, kostar 26 ms totalt och
 * 2,6 ms på det dyraste tangenttrycket.
 *
 * Taket i beställningen var 30 ms. Sållningen är det som håller det: utan den
 * skulle 15 337 avståndsräkningar per tangenttryck kosta storleksordningen
 * hundra millisekunder, alltså ett fält som hakar upp sig medan man skriver.
 *
 * Fyra kandidater och inte en: ett ord kan ha flera lika goda stavningar, och
 * den bästa enskilt kan ge en fras som inte finns i registret. Se repair.
 */
function nearest(word: string, max: number): Candidate[] {
  dictionary();
  const list = words!;
  let qmask = 0;
  for (let j = 0; j < word.length; j++) {
    const c = word.charCodeAt(j) - LOW_A;
    if (c >= 0 && c < 26) qmask |= 1 << c;
  }

  const min = word.length - max;
  const top: Candidate[] = [];
  for (let i = 0; i < list.length; i++) {
    if (wordLen[i] < min) continue;
    if (popcount(qmask & ~wordMask[i]) > max) continue;

    const d = prefixDistance(word, list[i], max);
    if (d > max) continue;

    const f = wordFreq[i];
    const worst = top[top.length - 1];
    if (top.length === 4 && (d > worst.distance || (d === worst.distance && f <= worst.freq))) {
      continue;
    }
    const item: Candidate = { word: list[i], distance: d, freq: f };
    let k = top.length;
    top.push(item);
    while (k > 0 && (top[k - 1].distance > d || (top[k - 1].distance === d && top[k - 1].freq < f))) {
      top[k] = top[k - 1];
      k--;
    }
    top[k] = item;
    if (top.length > 4) top.pop();
  }
  return top;
}

/**
 * Hur många rader söknyckeln träffar. Räknar bara, bygger ingenting.
 *
 * Ord för ord och inte som en sträng, av samma skäl som sökningen själv, se
 * `tokens`. Annars hade rättningen prövats mot en regel som inte längre gäller:
 * "espreso huse" rättas till "espresso house", och den frasen står bara i
 * följd i namnen. Med orden var för sig håller provet även när rättningen
 * gäller ett ord som står i adressen eller i kategorin.
 */
function countRows(key: string): number {
  const hay = index.hay;
  const toks = tokens(key);
  let n = 0;
  for (let i = 0; i < hay.length; i++) {
    const h = hay[i];
    let alla = true;
    for (let t = 0; t < toks.length; t++) {
      if (h.indexOf(toks[t]) < 0) {
        alla = false;
        break;
      }
    }
    if (alla) n++;
  }
  return n;
}

/**
 * Ordet som det STAVAS i datan, för utskrift.
 *
 * Ordboken bär vikta nycklar, och "vasterlangatan" duger inte att visa för
 * någon. Stavningen letas upp först när vi bestämt oss för att påstå något,
 * alltså som mest en gång per fråga, och kostar ett svep till över registret.
 */
function spelling(key: string): string {
  const { rows, hay, kommuner } = index;
  for (let i = 0; i < hay.length; i++) {
    if (hay[i].indexOf(key) < 0) continue;
    const row = rows[i];
    /* Kategorierna och området står med, eftersom söksträngen bär dem: utan
       dem hade en rättning som pekade på "Östermalm" eller "pizzeria" inte
       hittat sin egen stavning och skrivit ut den vikta nyckeln i klartext. */
    const text = `${row[0]} ${row[1]} ${kommuner[row[3]][1]}${extraText(row)}`;
    for (const w of text.split(/[^\p{L}\p{N}]+/u)) {
      if (w && foldKey(w) === key) return w;
    }
  }
  return key;
}

/**
 * Frågan med felstavningarna utbytta, eller null när ingen rättning håller.
 *
 * `didYouMean` är satt bara när vi är SÄKRA, och det är avsiktligt strängt.
 * Fyra villkor, alla nödvändiga:
 *
 *   Det vanliga passet gav noll. Gav det något är det svaret besökaren
 *   frågade efter, och då ska sajten inte gissa vad hon egentligen menade.
 *
 *   Exakt ett ord rättades. Två fel i samma fras är inte en felstavning, det
 *   är en annan fråga.
 *
 *   Avståndet är ett. Två tecken fel tillåts för att HITTA, aldrig för att
 *   påstå.
 *
 *   Tvåan ligger längre bort, och med tvåan menas nästa kandidat som är ett
 *   ANNAT ord. Är det jämnt mellan "Västerlånggatan" och "Österlånggatan" har
 *   vi ingen aning om vilken som menades, och då visas träffarna utan
 *   påstående. Ett ord som bara är vinnaren i förkortad eller förlängd form
 *   räknas däremot inte som tvekan, se rival längre ner.
 *
 * Skillnaden är hela poängen: ett "menade du" som stämmer varje gång det
 * står ut är värt något, ett som gissar är brus. På 504 riktiga gatunamn med
 * ett inskrivet fel skrevs raden ut 217 gånger och pekade rätt 217 gånger.
 * Resten av de rättade frågorna visade sina träffar utan att påstå något,
 * vilket är exakt vad "Rosenborgatan" ska ge: den ligger ett steg från
 * "Rosenborgsgatan", men inte ensam om det.
 */
function repair(key: string): { key: string; didYouMean: string | null } | null {
  const parts = key.split(' ');
  const found: Array<Candidate[] | null> = [];
  let changed = -1;
  let changes = 0;

  for (let i = 0; i < parts.length; i++) {
    const w = parts[i];
    if (w.length < FUZZY_MIN) {
      found.push(null);
      continue;
    }
    // Två tecken fel bara på långa ord. På ett kort blir två fel en helt
    // annan sträng, och rättningen skulle hitta på snarare än rätta.
    const top = nearest(w, w.length >= 8 ? 2 : 1);
    found.push(top);
    if (top.length && top[0].word !== w) {
      changes++;
      changed = i;
    }
  }
  if (!changes) return null;

  const fixed = parts.map((w, i) => {
    const top = found[i];
    return top && top.length ? top[0].word : w;
  });

  let hits = countRows(fixed.join(' '));
  let pick = 0;

  // Rättningen får inte peka på en fras som inte finns. "espresso huse" ger
  // "huset" som närmaste ord, men "espreso huset" står ingenstans i registret
  // medan "espreso house" står på 52 rader. Alltså prövas de näst bästa.
  const list = found[changed]!;
  if (!hits && changes === 1) {
    for (let n = 1; n < list.length && !hits; n++) {
      fixed[changed] = list[n].word;
      hits = countRows(fixed.join(' '));
      pick = n;
    }
  }
  if (!hits) return null;

  /*
   * Tvåan som RIVAL, alltså nästa kandidat som är ett ANNAT ord.
   *
   * Tvekansregeln stod tidigare som `list[1].distance > 1` rakt av, och det
   * var den som tystade raden i praktiken. Skälet ligger i prefixDistance:
   * den mäter mot det bästa PREFIXET av ordbokens ord, eftersom fältet söker
   * medan man skriver. Följden är att ett ord som är en förkortning eller en
   * förlängning av vinnaren hamnar på exakt samma avstånd som vinnaren.
   *
   * Registret är fullt av sådana par, för det bär både kedjan och bolaget:
   *
   *     "mcdonals"  ->  mkdonalds (avstånd 1, 40 rader)
   *                     mkdonald  (avstånd 1,  2 rader)
   *     "frantzn"   ->  frantsen  (avstånd 1,  2 rader)
   *                     frants    (avstånd 1,  1 rad)
   *
   * "mkdonald" är inte en annan stavning som besökaren kan ha menat, det är
   * samma ord ett tecken kortare. Att låta det rösta ner rättningen är att
   * kalla ett ord tvetydigt mot sig självt, och båda de två frågorna ovan
   * visade sina rättade träffar helt utan att säga varför.
   *
   * En prefixsläkting hoppas därför över när tvåan letas upp. Äkta tvekan
   * står kvar orörd: "vasterlangatan" och "osterlangatan" är inget prefix av
   * varandra, alltså tiger raden där precis som förut.
   *
   * Mätt på registrets egna ord med ett fel inskrivet, 2 314 frågor över 400
   * gatunamn och 400 verksamhetsnamn med tappat tecken, omkastade tecken och
   * fel tecken: raden gick från 1 431 till 1 475 utskrifter. Ingen befintlig
   * rad föll bort, och samtliga 44 nya pekar på det ord som muterades, 29 på
   * ordet självt och 15 på dess genitivform eller på ledet före bindestrecket
   * ("Båggatans" för Båggatan, "Gällersta" för Gällersta-ökna).
   */
  const win = list[0].word;
  const rival = list.find((c, i) => i > 0 && !win.startsWith(c.word) && !c.word.startsWith(win));

  /* `empty` stod som första villkor här och är borttaget. Det fanns för att
     hålla raden tyst när frågan gav träffar, men `collect` anropar repair
     BARA när träffarna är färre än tre, så villkoret uteslöt i praktiken just
     de en eller två träffar där rättningen är som mest värd. Grinden ligger
     numera i `collect`, se bytet där, och den här funktionen svarar bara på
     hur säker rättningen är. */
  const sure =
    changes === 1 &&
    pick === 0 &&
    list[0].distance === 1 &&
    (!rival || rival.distance > 1);

  return {
    key: fixed.join(' '),
    didYouMean: sure ? spelling(list[0].word) : null,
  };
}

/** Klasserna hopslagna i rankningsordning. */
export function ranked(g: Groups): Suggestion[] {
  /* Områdena direkt efter kommunerna och FÖRE verksamheterna. Den som skriver
     "Östermalm" vill till stadsdelen, inte till en pizzeria som råkar ha ordet
     i sin adress. */
  /* Nästan-träffarna SIST och aldrig blandade med de hela. Den som skrivit tre
     ord ska se svaret på alla tre först, och raderna som bara bär två ska ligga
     under dem och inte emellan. */
  return [
    ...g.kommunPrefix,
    ...g.omradePrefix,
    ...g.namePrefix,
    ...g.nameWord,
    ...g.kommunLoose,
    ...g.loose,
    ...g.partial,
  ];
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
  // Samma vikning som registret. Ett trettiotal rader, alltså ingen anledning
  // att spara nycklarna: den som söker "cafeer" ska hitta artikeln om kaféer
  // här av exakt samma skäl som hon hittar ett kafé i listan ovanför.
  const key = foldKey(q);
  if (!key) return [];

  for (const item of items) {
    const label = foldKey(item.label);
    const at = label.indexOf(key);
    if (at === 0) prefix.push(item);
    else if (at > 0 && wordStart(label, at)) word.push(item);
    else if (item.kw && foldKey(item.kw).includes(key)) loose.push(item);
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
