/**
 * Domänlogik och presentation ovanpå datakällan.
 *
 * `db.ts` vet var datan kommer ifrån. Den här modulen vet vad den betyder:
 * etiketter, färger, härledd statistik och kvalitetsgrinden. Sidmallarna
 * pratar bara med den här nivån.
 */
import {
  coverage,
  egenBild,
  establishments,
  findEstablishment,
  municipalities,
  municipality,
  sourceFor,
  visbarBild,
  type AreaStatus,
  type ControlArea,
  type Establishment,
  type Inspection,
  type MissingReason,
  type Municipality,
  type StreetImage,
  type Verdict,
} from './db';

import {
  SUB_CATEGORIES,
  TOP_CATEGORIES,
  assertKnown,
  classify,
  noteUnknown,
  scheduleUnknownLog,
  subCategory,
  subCategoryBySlug,
  subCategoryRank,
  topCategory,
  topCategoryBySlug,
  type Categorised,
  type SubCategory,
  type TopCategory,
  type TopCategoryId,
} from './categories';

export {
  coverage,
  establishments,
  findEstablishment,
  municipalities,
  municipality,
  sourceFor,
};
/* Licensgrinden. Bor i db.ts, se kommentaren där, och går ut den här vägen av
   samma skäl som allt annat: sidmallar och komponenter pratar med den här
   nivån och aldrig med datakällan direkt. */
export { egenBild, visbarBild };
export {
  SUB_CATEGORIES,
  TOP_CATEGORIES,
  subCategory,
  subCategoryBySlug,
  topCategory,
  topCategoryBySlug,
};
export type { SubCategory, TopCategory, TopCategoryId };
export type {
  AreaStatus,
  ControlArea,
  Establishment,
  Inspection,
  MissingReason,
  Municipality,
  StreetImage,
  Verdict,
};

// ---------------------------------------------------------------------------
// Kvalitetsgrind
// ---------------------------------------------------------------------------

/**
 * En sida får bara indexeras när den bär faktisk information. Annars drar de
 * tunna sidorna ner hela domänen vid Googles bedömning av skalat innehåll
 * (bibeln §6) — och med tiotusentals sidor är det en reell risk.
 */
/*
 * ── EN AVREGISTRERAD VERKSAMHET FALLER INTE UT HÄR, OCH DET ÄR PRÖVAT ─────
 *
 * Frågan ställdes när noten om nedlagda verksamheter byggdes 2026-08-31: ska
 * en sida om ett ställe kommunen inte längre har registrerat ligga kvar i
 * sitemapen? Svaret är ja, och villkoret nedan är därför oförändrat.
 *
 * Skälet är notens eget skäl, se docs/35 §5.1: SIDAN ÄR DET ENDA STÄLLET
 * NOTEN KAN LÄSAS. Den som googlar "har X i Vasastan stängt" ska landa på en
 * sida som svarar. Att lyfta ut sidan ur indexet är att ta bort svaret på
 * precis den fråga funktionen finns för, alltså en avpublicering i allt utom
 * namnet, och en funktion får aldrig kosta en sida.
 *
 * Grinden gör dessutom redan sitt jobb på de tunna av dem utan att veta något
 * om registret: 7 av de 30 saknar bedömning, 5 med noll kontroller och 2 med
 * kontroller äldre än femårsfönstret, och de faller på raden nedan som vilken
 * annan tunn sida som helst. Kvar i indexet står 23 sidor som var och en bär
 * en publicerad kontrollhistorik, alltså faktisk information. Se
 * docs/35 §9.
 */
export function isIndexable(e: Establishment): boolean {
  return e.verdict !== null && e.inspections.length > 0;
}

export function missingReason(e: Establishment): MissingReason {
  return e.reason === 'stale_inspections' ? 'stale_inspections' : 'no_inspections';
}

/** Senaste kontrollens datum, eller null. Driver "senast uppdaterad". */
export function latestInspectionDate(e: Establishment): string | null {
  return e.inspections[0]?.date ?? null;
}

// ---------------------------------------------------------------------------
// Kontrollområden
// ---------------------------------------------------------------------------

/** Områden som räknas som brist. "Åtgärdad" och "Avskriven" gör det inte. */
export const REMARK_STATUSES: AreaStatus[] = ['deviation', 'persisting'];

export function isRemark(area: ControlArea): boolean {
  return REMARK_STATUSES.includes(area.status);
}

export const AREA_STATUS_LABEL: Record<AreaStatus, string> = {
  ok: 'Utan avvikelse',
  fixed: 'Åtgärdad',
  deviation: 'Avvikelse',
  persisting: 'Kvarstår',
};

/** Ytfärg — prickar och ikonbakgrunder. */
export const AREA_STATUS_COLOR: Record<AreaStatus, string> = {
  ok: 'var(--verdict-clean)',
  fixed: 'var(--verdict-clean)',
  deviation: 'var(--verdict-minor)',
  persisting: 'var(--verdict-major)',
};

/** Textfärg — måste vara den mörkare varianten för att vara läsbar. */
export const AREA_STATUS_INK: Record<AreaStatus, string> = {
  ok: 'var(--verdict-clean-ink)',
  fixed: 'var(--verdict-clean-ink)',
  deviation: 'var(--verdict-minor-ink)',
  persisting: 'var(--verdict-major-ink)',
};

/** Etikett för en ENSKILD kontroll i historiken, inte för helhetsbedömningen. */
export const ASSESSMENT_LABEL: Record<Inspection['assessment'], string> = {
  0: 'Inga anmärkningar',
  1: 'Avvikelse',
  2: 'Kvarstående avvikelse',
};

export const ASSESSMENT_COLOR: Record<Inspection['assessment'], string> = {
  0: 'var(--verdict-clean)',
  1: 'var(--verdict-minor)',
  2: 'var(--verdict-major)',
};

export const ASSESSMENT_INK: Record<Inspection['assessment'], string> = {
  0: 'var(--verdict-clean-ink)',
  1: 'var(--verdict-minor-ink)',
  2: 'var(--verdict-major-ink)',
};

export const INSPECTION_TYPE_LABEL: Record<Inspection['type'], string> = {
  0: 'Planerad kontroll',
  1: 'Återbesök',
  2: 'Händelsestyrd kontroll',
};

/**
 * Livsmedelsverkets lagstiftningsområden, kodade med bokstaven i
 * rapporteringspunkten. Källa: Linköpings egen läsanvisning. Används för att
 * förklara vad en avvikelse handlar om — koden "J03" säger inget för en
 * besökare.
 */
export const LEGISLATION_AREAS: Record<string, { name: string; explanation: string }> = {
  A: { name: 'Administrativa krav', explanation: 'Godkännande och registrering av verksamheten.' },
  B: { name: 'Allmän livsmedelsinformation', explanation: 'Information som gäller de flesta livsmedel, till exempel innehållsförteckning.' },
  C: { name: 'Särskild märkning', explanation: 'Krav för till exempel Nyckelhålet, kosttillskott och glutenfritt.' },
  D: { name: 'Skyddade beteckningar', explanation: 'Ursprungs- och geografiska beteckningar.' },
  E: { name: 'Handelsnormer', explanation: 'Regler för fiskeri- och jordbruksprodukter.' },
  F: { name: 'Varustandarder', explanation: 'Bestämmelser för till exempel sylt och juice.' },
  G: { name: 'Särskilda grupper', explanation: 'Spädbarnsmat och livsmedel för medicinska ändamål.' },
  H: { name: 'Spårbarhet', explanation: 'Att det går att spåra varifrån kött, ägg och andra råvaror kommer.' },
  I: { name: 'Ingredienser', explanation: 'Tillsatser, aromer och berikning.' },
  J: { name: 'Hygien', explanation: 'Allmänna hygienkrav: lokaler, personlig hygien, kylkedja, skadedjur och rengöring.' },
  K: { name: 'HACCP', explanation: 'Verksamhetens faroanalys och mikrobiologiska kriterier.' },
  L: { name: 'Egenkontroller', explanation: 'Krav på företagarens egna kontroller.' },
  M: { name: 'Import och export', explanation: 'Handel inom EU och import från länder utanför EU.' },
  N: { name: 'Dricksvatten', explanation: 'Kontroll vid dricksvattenanläggningar.' },
  O: { name: 'Övrigt', explanation: 'Lagkrav som inte ryms i övriga områden.' },
  P: { name: 'Operativa mål', explanation: 'Nationellt prioriterade kontrollpunkter, till exempel allergener och spårbarhet.' },
  Q: { name: 'Kontaktmaterial', explanation: 'Material som är avsedda att komma i kontakt med livsmedel.' },
};

export function legislationArea(code: string) {
  return LEGISLATION_AREAS[(code || '').charAt(0).toUpperCase()];
}

// ---------------------------------------------------------------------------
// Härledd statistik och närhet
// ---------------------------------------------------------------------------

/**
 * Ovanligt långt uppehåll mellan två kontroller.
 *
 * Två år är hämtat ur beståndet, inte ur luften. Av de 48 230 uppehållen mellan
 * två på varandra följande kontroller ligger medianen på 267 dagar och
 * nittionde percentilen på 724. Ett uppehåll på två år är alltså längre än nio
 * av tio normala kontrollintervall.
 *
 * ## LÄS DETTA INNAN DU ANVÄNDER TRÖSKELN TILL NÅGOT NYTT
 *
 * Tröskeln får ANVÄNDAS TILL: att rangordna ner en återkommande brist vars
 * noteringar ligger långt isär, och att skriva ut hur lång tid det gått.
 *
 * Tröskeln får INTE ANVÄNDAS TILL: att dra slutsatser om ägarbyte, om att
 * lokalen bytt verksamhet, eller om att historiken före uppehållet hör till
 * någon annan. Den bar det påståendet en kort tid och det var fel.
 *
 * Skälet är mätt. Uppehållet styrs av hur ofta kommunen kontrollerar just den
 * sortens verksamhet, inte av om lokalen bytt hand. Andel med uppehåll >= 2 år,
 * per verksamhetstyp:
 *
 *     Stockholm   restaurang 28 %   butik 55 %   förskola mottagning 72 %
 *                 matmäklare 79 %
 *     Örebro      pizzeria    6 %   restaurang 13 %   buffert 67 %
 *     Linköping   restaurang 26 %   skola och omsorg 60 %
 *
 * Tre Apotek Hjärtat i Örebro har samma uppehåll på 2 086 dagar med exakt samma
 * datumpar. Det är kommunen som sveper en lågriskkategori på en flerårscykel,
 * inte tre lokaler som bytt ägare samtidigt.
 *
 * Sambandet går dessutom åt FEL HÅLL. Restauranger kontrolleras oftast och
 * byter ägare oftast, alltså är de minst flaggade: av 4 678 restaurangliknande
 * verksamheter med minst två kontroller i Stockholm, Linköping och Örebro får
 * 3 015 (64 %) ingen flagga alls. Medianintervallet för en restaurang i
 * Stockholm är 272 dagar, och ett ägarbyte däremellan ger inget uppehåll över
 * huvud taget.
 *
 * Att historiken följer lokalen och inte företaget är sant för VARJE verksamhet
 * i varje kommun som publicerar mer än en kontroll. Den upplysningen är därför
 * ovillkorlig i gränssnittet. Villkorar man den på det här uppehållet lär man
 * läsaren att frånvaron betyder att historiken är säker, och det är falskt
 * just på restaurangsidorna där risken är störst. Ett villkorat förbehåll
 * tillverkar en falsk trygghetssignal, vilket är värre än problemet det skulle
 * lösa.
 */
export const HISTORY_GAP_DAYS = 730;

const DAY_MS = 86_400_000;

/** Hela dagar mellan två ISO-datum. Alltid positivt. */
function daysBetween(a: string, b: string): number {
  return Math.abs(Date.parse(a) - Date.parse(b)) / DAY_MS;
}

/**
 * Längsta uppehållet mellan två på varandra följande datum i en fallande serie.
 * Noll när serien har färre än två datum.
 */
function longestGap(datesNewestFirst: string[]): number {
  let longest = 0;
  for (let i = 0; i + 1 < datesNewestFirst.length; i += 1) {
    const gap = daysBetween(datesNewestFirst[i], datesNewestFirst[i + 1]);
    if (gap > longest) longest = gap;
  }
  return longest;
}

export interface Stats {
  total: number;
  clean: number;
  cleanShare: number;
  followUps: number;
  /**
   * Året för den ÄLDSTA publicerade kontrollen på adressen.
   *
   * Hette tidigare `firstYear` och visades som "Först kontrollerad", vilket
   * läses som verksamhetens ålder. Det är inte vad talet betyder: det är den
   * äldsta kontroll kommunen råkar publicera på lokalen, begränsad av
   * kommunens eget publiceringsfönster och orörd av att verksamheten bytt.
   */
  oldestYear: string | null;
}

/**
 * Här fanns tidigare `longestGapDays` och `hasHistoryGap`, som drev ett
 * förbehåll i sidfoten om att historiken kunde gälla en tidigare verksamhet.
 * De är borttagna med avsikt: uppehållet kan inte bära den slutsatsen, och
 * upplysningen om lokalen är nu ovillkorlig i stället. Se HISTORY_GAP_DAYS.
 */
export function statistics(e: Establishment): Stats {
  const total = e.inspections.length;
  const clean = e.inspections.filter((i) => i.assessment === 0).length;
  const followUps = e.inspections.filter((i) => i.type === 1).length;
  const oldest = e.inspections[e.inspections.length - 1];

  return {
    total,
    clean,
    cleanShare: total ? Math.round((clean / total) * 100) : 0,
    followUps,
    oldestYear: oldest ? oldest.date.slice(0, 4) : null,
  };
}

/**
 * Hur många kontroller i följd, räknat från den senaste och bakåt, som inte
 * fick en enda anmärkning. Noll när den senaste kontrollen har en.
 *
 * ## Varför talet finns bredvid andelen och inte i stället för den
 *
 * `cleanShare` kan inte skilja på en ren bedömning som vilar på mycket och en
 * som vilar på lite. 6 636 av de 16 047 sidorna visar "100 %", och 3 406 av
 * dem, alltså mer än hälften, vilar på EN ENDA publicerad kontroll. Samma tal
 * står på en verksamhet med tjugo rena kontroller bakom sig. Raden i följd
 * skiljer dem åt.
 *
 * Åt andra hållet döljer andelen det motsatta. 3 375 sidor har en rad på minst
 * två rena i följd utan att nå 100 %, för att det ligger en gammal anmärkning
 * längst ned i historiken. Wirströms Pub i Stockholm är en av dem: åtta rena i
 * rad sedan 2018, och en enda avvikelse dessförinnan drar talet till 89 %.
 * Ingen siffra på sidan bar den upplysningen förut.
 *
 * ## Räckvidd, mätt 2026-08-20 över hela beståndet
 *
 *   rad >= 2   6 605 sidor   41,2 %
 *   rad >= 3   3 848 sidor   24,0 %
 *   rad >= 5   1 420 sidor    8,8 %
 *
 * Sidmallen visar raden bara när den är minst två OCH kortare än historiken,
 * alltså på 3 375 sidor (21,0 %). På de 3 230 sidor där hela historiken är ren
 * säger raden exakt samma sak som "Kontroller" och "100 %" redan säger några
 * centimeter bort, och ett tal som redan står på sidan ska inte stå två gånger.
 *
 * ## Vad talet INTE får bli
 *
 * Det är ett tal om DEN HÄR adressen och aldrig en jämförelse. Det får inte
 * rangordnas mot andra, det får inte vändas till en rad anmärkningar i följd,
 * och frånvaron av raden är ingen utsaga: 62 procent av sidorna saknar den,
 * de flesta för att kommunen bara publicerat en eller två kontroller.
 *
 * Återbesök räknas med. De ÄR kontroller, kommunen bedömer dem på samma
 * tresteg, och att räkna bort dem hade tappat 1 131 sidor (6 605 mot 5 474)
 * utan att göra påståendet sannare.
 */
export function cleanStreak(e: Establishment): number {
  let n = 0;
  for (const i of e.inspections) {
    if (i.assessment !== 0) break;
    n += 1;
  }
  return n;
}

/**
 * Kandidatregister per kommun: verksamheter som alls kan bli en granne, med
 * koordinaterna förkonverterade till radianer.
 *
 * Finns för att nearby() körs en gång per restaurangsida. Utan registret gjorde
 * varje sida om filtreringen och radiankonverteringen för hela kommunen, ett
 * kvadratiskt arbete som i Stockholm ensamt kostade ett halvt bygge.
 *
 * Ordningen är densamma som i establishments(), vilket är det som gör att den
 * stabila topplistan nedan ger exakt samma svar som den gamla sorteringen.
 */
interface NearbyIndex {
  items: Establishment[];
  lat: Float64Array;
  lng: Float64Array;
  cosLat: Float64Array;
}

const nearbyIndexes = new Map<string, NearbyIndex>();

function nearbyIndex(slug: string): NearbyIndex {
  const cached = nearbyIndexes.get(slug);
  if (cached) return cached;

  const items: Establishment[] = [];
  const lat: number[] = [];
  const lng: number[] = [];
  const cosLat: number[] = [];

  for (const o of establishments(slug)) {
    if (o.lat === null || o.lng === null || o.verdict === null) continue;
    const rad = (o.lat * Math.PI) / 180;
    items.push(o);
    lat.push(rad);
    lng.push((o.lng * Math.PI) / 180);
    cosLat.push(Math.cos(rad));
  }

  const index: NearbyIndex = {
    items,
    lat: Float64Array.from(lat),
    lng: Float64Array.from(lng),
    cosLat: Float64Array.from(cosLat),
  };
  nearbyIndexes.set(slug, index);
  return index;
}

/**
 * Närmaste verksamheter inom samma kommun. Ger besökaren ett alternativ när
 * stället hen tittar på har brister, och binder samman den interna
 * länkgrafen mellan restaurangsidor — inte bara uppåt till kommunhubben.
 *
 * Här låg tidigare en filter/map/sort-kedja över hela kommunen. Den gav rätt
 * svar men byggde 8 500 objektkopior och sorterade dem, för att sedan behålla
 * fyra. Nu svepes kandidaterna i stället en gång och bara de fyra bästa
 * kopieras.
 *
 * Rangordningen sker på AVRUNDADE meter, precis som förut, och insättningen
 * flyttar bara element som är strikt större. Det bevarar registrets ordning
 * mellan grannar på samma avstånd, vilket är exakt vad den stabila sorteringen
 * gjorde. Utfallet är verifierat identiskt för samtliga sidor.
 */
export function nearby(
  e: Establishment,
  limit = 4,
): Array<Establishment & { metres: number }> {
  if (e.lat === null || e.lng === null) return [];

  const index = nearbyIndex(e.municipality.slug);

  // Haversine mot jordens medelradie, samma formel som förut men inlagd i
  // svepet: kandidaternas radianer och cosinus är redan uträknade i registret.
  const R = 6371000;
  const lat = (e.lat * Math.PI) / 180;
  const lng = (e.lng * Math.PI) / 180;
  const cosLat = Math.cos(lat);

  // Topplista med `limit` platser. Fylld med Infinity betyder "ledig plats".
  const bestMetres = new Float64Array(limit).fill(Infinity);
  const bestIndex = new Int32Array(limit).fill(-1);
  let cutoff = Infinity;

  for (let i = 0; i < index.items.length; i += 1) {
    if (index.items[i].id === e.id) continue;

    const sinLat = Math.sin((index.lat[i] - lat) / 2);
    const sinLng = Math.sin((index.lng[i] - lng) / 2);
    const h = sinLat * sinLat + cosLat * index.cosLat[i] * sinLng * sinLng;
    const metres = Math.round(2 * R * Math.asin(Math.sqrt(h)));

    // Lika långt bort som den sämsta på listan räcker inte: den som stod först
    // i registret behåller platsen.
    if (metres >= cutoff) continue;

    let slot = limit - 1;
    while (slot > 0 && bestMetres[slot - 1] > metres) {
      bestMetres[slot] = bestMetres[slot - 1];
      bestIndex[slot] = bestIndex[slot - 1];
      slot -= 1;
    }
    bestMetres[slot] = metres;
    bestIndex[slot] = i;
    cutoff = bestMetres[limit - 1];
  }

  const result: Array<Establishment & { metres: number }> = [];
  for (let k = 0; k < limit; k += 1) {
    if (bestIndex[k] < 0) continue;
    result.push({ ...index.items[bestIndex[k]], metres: bestMetres[k] });
  }
  return result;
}

export function formatDistance(metres: number): string {
  return metres < 1000 ? `${metres} m` : `${(metres / 1000).toFixed(1)} km`;
}

/**
 * Avståndet där två ställen inte längre ligger på var sitt avstånd, i meter.
 *
 * "0 m" är sant och läser ändå som saknad data. Ägarens beslut 2026-09-05 är
 * att skriva ut vad noll meter BETYDER, och talet nedan är mätt och inte
 * antaget.
 *
 * Koordinaterna är avrundade till en miljondels grad, inte en hundratusendels:
 * samtliga 14 384 koordinater i beståndet är jämna miljondelar och 14 234 av
 * dem är INTE jämna hundratusendelar. Rutnätet är alltså 0,11 m i latitud och
 * 0,06 m i longitud, och noll meter betyder därför samma punkt och inte samma
 * avrundning.
 *
 * Fördelningen av grannrader över de 13 160 sidor som har en grannlista,
 * 52 640 rader, är en klippa och inte en sluttning:
 *
 *   0 m   7 050 rader        4 m    56        8 m   110
 *   1 m     412              5 m    51        9 m   120
 *   2 m      46              6 m    81       10 m   123
 *   3 m      46              7 m    51       20 m   458
 *
 * Efter 1 m faller antalet nio gånger och planar ut. Tröskeln är alltså 1 och
 * inte 5 eller 10: allt över den är riktiga avstånd mellan riktiga adresser,
 * och ett tal som stämmer ska stå kvar som ett tal.
 *
 * ADRESSEN AVGÖR ORDET, inte avståndet ensamt. De 7 462 raderna på 1 m eller
 * mindre delar upp sig så här:
 *
 *   6 141  samma adress efter normalisering        82,3 %
 *     655  samma gata, olika nummer                 8,8 %
 *     325  olika gata                               4,4 %
 *     341  minst en adress saknas                   4,6 %
 *
 * Koordinaten är en BYGGNAD och adresserna är dess olika entréer:
 * Hötorgshallen har 21 verksamheter på samma punkt, Kista galleria 20 med
 * ingångar både från Hanstavägen och Brandesgången, Östermalmshallen 13.
 * Ibland är punkten bara delad och fel för minst en av dem, som "Åhléns @
 * Dalagatan 100" och "Hemköp @ Ringvägen 100".
 *
 * Att skriva "samma adress" på de 1 321 hade bytt ett tal som LÄSER fel mot
 * ett påstående som ÄR fel, och det är ett sämre byte. De får "samma plats",
 * vilket är exakt vad noll meter betyder och ingenting mer.
 */
export const SAME_PLACE_M = 1;

/**
 * Avståndet till en granne, i ord när metern inte längre säger något.
 *
 * Se SAME_PLACE_M för talen bakom tröskeln och för varför adresserna avgör
 * vilket av de två orden som står. Över tröskeln är svaret formatDistance:s,
 * alltså oförändrat på 85,8 procent av alla grannrader.
 */
export function distanceLabel(
  metres: number,
  address: string | null,
  otherAddress: string | null,
): string {
  if (metres > SAME_PLACE_M) return formatDistance(metres);
  // Skiljetecken, versaler och mellanrum skiljer inte två adresser åt.
  // "Östra Storgatan 109" och "Östra Storgatan 109 A" gör det, och de är två
  // entréer och alltså två adresser.
  const norm = (s: string) => s.toLowerCase().replace(/[^0-9a-zåäöéü]+/g, '');
  const same = address && otherAddress && norm(address) === norm(otherAddress);
  return same ? 'samma adress' : 'samma plats';
}

// ---------------------------------------------------------------------------
// Bäst i närheten
// ---------------------------------------------------------------------------

/**
 * Radien för "Bäst i närheten", i meter.
 *
 * nearby() har ingen radie alls, och behöver ingen: den sorterar på avstånd, så
 * den närmaste är den närmaste hur långt bort den än är. En lista som sorterar
 * på något ANNAT än avstånd måste ha en, annars kan den kröna ett ställe åtta
 * kilometer bort och kalla det närhet.
 *
 * 500 meter, och talet är mätt över hela beståndet 2026-08-18. Andel av de
 * 13 616 verksamheter som har en koordinat och som får minst en ren granne:
 *
 *   radie   minst en   minst tre
 *   500 m   97,0 %     92,7 %
 *   750 m   98,1 %     95,7 %
 *  1000 m   98,5 %     96,8 %
 *  1500 m   98,9 %     97,7 %
 *
 * Att gå från 500 till 1 500 meter köper 1,9 procentenheter och tredubblar den
 * yta läsaren ska tro på som "i närheten". 500 meter är dessutom ett tal som
 * går att skriva ut på sidan och som en läsare kan pröva mot verkligheten,
 * vilket "gångavstånd" inte är.
 */
export const BEST_NEARBY_M = 500;

export interface BestNearby extends Establishment {
  metres: number;
  /** Antal kontroller bakom bedömningen. Det första ordningen avgörs på. */
  controls: number;
}

export interface BestNearbyResult {
  /** De som får plats i listan, högst `limit` stycken. */
  items: BestNearby[];
  /**
   * HELA antalet rena inom radien, alltså listans nämnare.
   *
   * Listan visar fyra namn ur en mängd som medianvis är 39 stycken, mätt över
   * de 13 210 sidor som har minst en ren granne inom 500 meter (tionde
   * percentilen 5, största 506). Utan nämnaren tror läsaren att fyra är alla,
   * vilket är exakt felet RenHistorik.astro redan skriver ut på kommunsidan:
   * "Sex rader av 1 084 är ett urval".
   *
   * Talet är ett tal om OMRÅDET och aldrig om verksamheten sidan handlar om.
   * Den är varken räknad i det eller ställd mot det, och nämnaren är därför
   * identisk för varje sida i samma kvarter oavsett vilken bedömning den bär.
   */
  total: number;
}

/**
 * Register över de RENA verksamheterna per kommun, med det ordningen avgörs på
 * förkonverterat.
 *
 * Eget register i stället för ett filter inne i svepet, av samma skäl som
 * nearbyIndex finns: funktionen körs en gång per verksamhetssida. Registret är
 * mindre än nearbyIndex på varje sida, eftersom bara ett av de tre utfallen
 * kommer in: 11 966 av 16 047 verksamheter är rena, och Stockholms 8 520 blir
 * omkring 6 400 kandidater i stället för 8 520.
 *
 * `controls` ligger i registret och inte bakom ett anrop per kandidat, av samma
 * skäl som radianerna gör det: ordningen avgörs på talet en gång per granne per
 * sida, och i Stockholm är det 6 400 kandidater gånger 8 520 sidor.
 */
interface CleanIndex {
  items: Establishment[];
  lat: Float64Array;
  lng: Float64Array;
  cosLat: Float64Array;
  controls: Int32Array;
}

const cleanIndexes = new Map<string, CleanIndex>();

function cleanIndex(slug: string): CleanIndex {
  const cached = cleanIndexes.get(slug);
  if (cached) return cached;

  const items: Establishment[] = [];
  const lat: number[] = [];
  const lng: number[] = [];
  const cosLat: number[] = [];
  const controls: number[] = [];

  for (const o of establishments(slug)) {
    if (o.lat === null || o.lng === null || o.verdict !== 'clean') continue;
    const rad = (o.lat * Math.PI) / 180;
    items.push(o);
    lat.push(rad);
    lng.push((o.lng * Math.PI) / 180);
    cosLat.push(Math.cos(rad));
    controls.push(o.inspections.length);
  }

  const index: CleanIndex = {
    items,
    lat: Float64Array.from(lat),
    lng: Float64Array.from(lng),
    cosLat: Float64Array.from(cosLat),
    controls: Int32Array.from(controls),
  };
  cleanIndexes.set(slug, index);
  return index;
}

/**
 * De bästa inom BEST_NEARBY_M meter. Systerlista till nearby(), aldrig ersätta.
 *
 * ## Vad som får stå i listan, och varför den är tillåten
 *
 * Prikko rangordnar aldrig kommuner på kontrollresultat och publicerar aldrig
 * en lista över de sämsta. Den regeln är inte en tröskel som den här listan
 * kryper under, den är en regel om RIKTNING: en namngiven verksamhet får aldrig
 * framställas som något att undvika.
 *
 * Därför innehåller listan bara `clean`, alltså de som fick inga anmärkningar
 * vid sin senaste kontroll. Den är inte en topplista med en botten. Den har
 * ingen ordningsvändning, ingen "visa de sämsta", och den ska aldrig få en:
 * vänder man ordningen får man de sämsta AV DE RENA, vilket är en rangordning
 * av oskyldiga och är precis lika förbjudet.
 *
 * Att verksamheten man står på inte är med är ingen utsaga om den. Den står med
 * sitt eget besked högst upp på sidan, och listan handlar per definition om
 * andra ställen, precis som nearby() redan gör.
 *
 * ## Ordningen, och varför den inte är godtycklig
 *
 * Alla i listan har samma bedömning. Utan en uttalad regel hade ordningen
 * avgjorts av registrets ordning, alltså av vilken ordning kommunen råkade
 * lämna sin fil i, och det hade varit en rangordning vi inte kan försvara.
 *
 * Två nycklar, i tur och ordning:
 *
 *  1. FLEST KONTROLLER FÖRST. En ren bedömning som vilar på 26 kontroller är
 *     bättre belagd än en som vilar på 1, och det är den enda skillnaden mellan
 *     två rena bedömningar som vi faktiskt har täckning för.
 *  2. NÄRMAST FÖRST vid lika många. Då är listan åter en närhetslista.
 *
 * TVÅ OCH INTE TRE. "Färskast kontroll" prövades som mellanliggande nyckel och
 * togs bort igen, av två skäl som båda håller. Det första är att den knappt
 * skiljer något: en `clean`-bedömning kan aldrig vila på en kontroll äldre än
 * fem år, eftersom modellen slutar bedöma vid den gränsen och verksamheten då
 * faller ur listan helt. Alla i listan ligger alltså redan inom samma
 * femårsfönster. Det andra är att raden på sidan bär antal kontroller och avstånd,
 * alltså exakt de två nycklarna. En tredje nyckel hade avgjort ordningen på
 * något läsaren inte kan se på raden, och en ordning som inte går att läsa ut
 * ur sidan är en ordning läsaren inte kan pröva.
 *
 * Regeln står dessutom utskriven, i tipset på panelrubriken i
 * [kommun]/[slug].astro.
 *
 * Insättningen flyttar bara element som är STRIKT sämre, precis som nearby().
 * Det bevarar registrets ordning när alla tre nycklarna är lika, alltså är
 * utfallet stabilt mellan bygg så länge datan är densamma.
 *
 * ## Varför nämnaren följer med ut
 *
 * `total` räknas i SAMMA svep och kostar därför ingenting: avståndet är redan
 * uträknat för varje kandidat, och räkningen är ett steg på den rad som ändå
 * avgör om kandidaten ligger inom radien. Ett andra anrop hade i Stockholm
 * betytt 6 400 kandidater gånger 8 520 sidor en gång till, vilket är precis
 * det arbete registret ovan finns för att slippa.
 */
export function bestNearby(
  e: Establishment,
  limit = 4,
  radius = BEST_NEARBY_M,
): BestNearbyResult {
  if (e.lat === null || e.lng === null) return { items: [], total: 0 };

  const index = cleanIndex(e.municipality.slug);

  // Haversine mot jordens medelradie, samma formel och samma avrundning till
  // hela meter som nearby(), så att ett avstånd som visas i båda listorna är
  // exakt samma tal på båda ställena.
  const R = 6371000;
  const lat = (e.lat * Math.PI) / 180;
  const lng = (e.lng * Math.PI) / 180;
  const cosLat = Math.cos(lat);

  const bestIndex = new Int32Array(limit).fill(-1);
  const bestMetres = new Float64Array(limit).fill(Infinity);

  /** Är a strikt bättre än b enligt de två nycklarna? b = -1 är en ledig plats. */
  const battre = (ai: number, am: number, bi: number, bm: number): boolean => {
    if (bi < 0) return true;
    if (index.controls[ai] !== index.controls[bi]) {
      return index.controls[ai] > index.controls[bi];
    }
    return am < bm;
  };

  /** Nämnaren. Räknas på exakt de kandidater som passerar radievillkoret. */
  let total = 0;

  for (let i = 0; i < index.items.length; i += 1) {
    if (index.items[i].id === e.id) continue;

    const sinLat = Math.sin((index.lat[i] - lat) / 2);
    const sinLng = Math.sin((index.lng[i] - lng) / 2);
    const h = sinLat * sinLat + cosLat * index.cosLat[i] * sinLng * sinLng;
    const metres = Math.round(2 * R * Math.asin(Math.sqrt(h)));

    if (metres >= radius) continue;
    total += 1;
    if (!battre(i, metres, bestIndex[limit - 1], bestMetres[limit - 1])) continue;

    let slot = limit - 1;
    while (slot > 0 && battre(i, metres, bestIndex[slot - 1], bestMetres[slot - 1])) {
      bestIndex[slot] = bestIndex[slot - 1];
      bestMetres[slot] = bestMetres[slot - 1];
      slot -= 1;
    }
    bestIndex[slot] = i;
    bestMetres[slot] = metres;
  }

  const items: BestNearby[] = [];
  for (let k = 0; k < limit; k += 1) {
    if (bestIndex[k] < 0) continue;
    items.push({
      ...index.items[bestIndex[k]],
      metres: bestMetres[k],
      controls: index.controls[bestIndex[k]],
    });
  }
  return { items, total };
}

// ---------------------------------------------------------------------------
// Formatering
// ---------------------------------------------------------------------------

const MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
];

/** Svenskt datum i löptext: "19 mars 2026". */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Tusentalsavgränsat tal: "8 511". */
export function formatNumber(n: number): string {
  return n.toLocaleString('sv-SE');
}

// ---------------------------------------------------------------------------
// Återkommande brister
// ---------------------------------------------------------------------------

export interface RecurringIssue {
  /** Vad bristen gäller, med kommunens egna ord. */
  description: string;
  group: string;
  code: string;
  /** Hur många kontroller den noterats vid. */
  count: number;
  /** Datum för de kontroller där den noterats, nyast först. */
  dates: string[];
  /** Kvarstod den vid senaste kontrollen den noterades? */
  latestPersisting: boolean;
  /** Längsta uppehållet mellan två kontroller som noterat bristen, i dagar. */
  gapDays: number;
  /**
   * Sant när noteringarna ligger på var sin sida av ett uppehåll på minst
   * HISTORY_GAP_DAYS.
   *
   * Betyder ENBART att det gått ovanligt lång tid mellan två noteringar, och
   * att ordet "återkommande" därför väger lättare. Det är inte ett tecken på
   * ägarbyte: läs varningen vid HISTORY_GAP_DAYS innan du bygger vidare på
   * fältet.
   */
  straddlesGap: boolean;
}

/**
 * Brister som noterats vid mer än en kontroll.
 *
 * Det här är sidans egentliga insikt. En enskild avvikelse säger lite — alla
 * får en emellanåt. Att samma kylkedja underkänts fyra gånger på två år säger
 * något helt annat, och det syns inte om man bara läser kontrollerna var för
 * sig. Vi har datan för hela historiken; utan den här sammanställningen
 * visades bara den senaste kontrollen.
 *
 * Det är också sidans farligaste påstående. Kommunen registrerar kontrollerna
 * på lokalen, inte på företaget, så en "återkommande" brist kan vara två
 * företag som råkat få samma anmärkning i samma kök med flera år emellan.
 * Uppmätt i beståndet: av 3 376 verksamheter med minst en återkommande brist
 * har 1 968 minst en brist vars noteringar ligger två år eller mer isär.
 *
 * Vi tar inte bort dem. De finns i kommunens data och Stockholms egen
 * e-tjänst visar dem. Vi slutar bara låta dem gå före de brister vi faktiskt
 * kan stå för, och märker dem så att sidan säger vad den vet.
 */
export function recurringIssues(e: Establishment, minCount = 2): RecurringIssue[] {
  const seen = new Map<string, RecurringIssue>();

  for (const inspection of e.inspections) {
    for (const area of inspection.areas) {
      if (!isRemark(area)) continue;
      // Nyckeln är beskrivningen: koden saknas i Stockholms data, och samma
      // brist ska räknas som samma oavsett vilken kommun den kommer från.
      const key = (area.description || area.group).toLowerCase();
      if (!key) continue;

      const existing = seen.get(key);
      if (existing) {
        /*
         * EN RAD PER KONTROLL, INTE PER NOTERING. Rättat 2026-09-05.
         *
         * Svepet lägger en rad per NOTERING, och en kontroll kan bära flera
         * rader som normaliseras till samma brist. Det stod i klartext på
         * sidan: Gröna Lund läste "Information om livsmedel: 10 juni 2026 ·
         * 10 juni 2026 · 10 juni 2026 · 4 juni 2025", alltså samma datum tre
         * gånger i följd.
         *
         * Uppmätt över hela beståndet 2026-09-05, på de 3 609 sidor som har
         * blocket: 727 av 5 881 rader (12,4 procent) upprepade minst ett
         * datum, som mest sex gånger, och de låg på 652 sidor. Räknat på bara
         * de fyra datum raden hinner visa: 609 rader på 555 sidor.
         *
         * Alternativet var att skriva ut upprepningen som "10 juni 2026 (3)".
         * Det behåller ett värre fel. `count` var antalet NOTERINGAR, medan
         * rubrikens räknare och tipset båda säger "vid mer än en kontroll".
         * På 46 rader, spridda över 43 sidor, låg samtliga noteringar på ett
         * ENDA kontrolltillfälle, och där påstod sidan alltså något som inte
         * stämde. En parentes hade lämnat de 46 kvar och dessutom lagt till
         * ett tal utan enhet intill ett datum.
         *
         * Jämförelsen med sist tillagda datum räcker och behöver ingen
         * mängd: alla områden i EN kontroll gås igenom i följd, så noteringar
         * med samma datum kan bara landa här efter varandra.
         */
        if (existing.dates[existing.dates.length - 1] !== inspection.date) {
          existing.count += 1;
          existing.dates.push(inspection.date);
        }
      } else {
        seen.set(key, {
          description: area.description || area.group,
          group: area.group,
          code: area.code,
          count: 1,
          dates: [inspection.date],
          // Inspektionerna är sorterade nyast först, så första förekomsten
          // är den senaste.
          latestPersisting: area.status === 'persisting',
          gapDays: 0,
          straddlesGap: false,
        });
      }
    }
  }

  const issues: RecurringIssue[] = [];
  for (const issue of seen.values()) {
    /*
     * Grinden mäter nu kontroller och inte noteringar, se svepet ovanför.
     * Följden i beståndet 2026-09-05: 46 rader på 43 sidor faller bort, och
     * 24 av de sidorna tappar hela blocket. Ingen av dem hade en brist som
     * återkom, de hade en kontroll som noterat samma sak flera gånger.
     */
    if (issue.count < minCount) continue;
    // Uppehållet mäts mellan kontrolltillfällen och inte mellan noteringar,
    // annars räknas ett dubblerat datum som ett uppehåll på noll och döljer
    // ett verkligt.
    issue.gapDays = longestGap(issue.dates);
    issue.straddlesGap = issue.gapDays >= HISTORY_GAP_DAYS;
    issues.push(issue);
  }

  // De tätast noterade bristerna först. En brist vars noteringar ligger flera
  // år isär är ett svagare belägg för att något återkommer, och ska inte toppa
  // listan bara för att den råkar ha noterats fler gånger. Rangordningen är
  // det enda uppehållet får styra.
  return issues.sort(
    (a, b) =>
      Number(a.straddlesGap) - Number(b.straddlesGap) ||
      b.count - a.count ||
      b.dates[0].localeCompare(a.dates[0]),
  );
}

/**
 * Kontrollens områden, med samma punkt bara EN gång.
 *
 * Örebro registrerar då och då samma rapporteringspunkt två gånger vid ett och
 * samma besök, med olika status: 366 gånger i beståndet, i 310 av 5 491
 * kontroller. Vanligast är "Åtgärdad" tillsammans med "Utan avvikelse" (154),
 * därefter "Avvikelse" med "Utan avvikelse" (61) och "Avvikelse" med
 * "Kvarstår" (40). Det ser ut som att kommunen bokför både uppföljningen av en
 * gammal brist och dagens läge på samma punkt.
 *
 * Två identiska rader intill varandra som säger emot varandra läser som en
 * bugg hos oss. Punkten har ett läge vid ett besök, och det är det strängaste:
 * en punkt som någon gång under besöket stod som avvikelse var en avvikelse.
 * Att i stället visa den mildaste hade tonat ned en brist, och det får aldrig
 * hända åt det hållet.
 *
 * Ordningen bevaras: den första förekomsten behåller sin plats i listan.
 * Källor utan dubbletter, alltså alla utom Örebro, går igenom oförändrade.
 */
const AREA_SEVERITY: Record<AreaStatus, number> = {
  ok: 0,
  fixed: 1,
  deviation: 2,
  persisting: 3,
};

export function mergedAreas(areas: ControlArea[]): ControlArea[] {
  const at = new Map<string, number>();
  const out: ControlArea[] = [];
  for (const area of areas) {
    const key = `${area.code}|${area.description}`;
    const seen = at.get(key);
    if (seen === undefined) {
      at.set(key, out.length);
      out.push(area);
    } else if (AREA_SEVERITY[area.status] > AREA_SEVERITY[out[seen].status]) {
      out[seen] = area;
    }
  }
  return out;
}

/** Avvikelser vid en enskild kontroll. */
export function deviations(inspection: Inspection): ControlArea[] {
  return mergedAreas(inspection.areas).filter(isRemark);
}

// ---------------------------------------------------------------------------
// Uppföljningen
// ---------------------------------------------------------------------------

/**
 * Längsta avstånd mellan en kontroll och det återbesök vi låter höra ihop med
 * den.
 *
 * Mätt i beståndet. Av de 14 582 återbesök som har en föregående kontroll
 * ligger fjärdedelen på fyra dagar, medianen på 24 och tre fjärdedelar inom
 * 111. Vid 180 dagar är 81 procent med. Svansen därefter är inte uppföljningar
 * av kontrollen före: Örebros nittionde percentil ligger på 723 dagar, alltså
 * två år, och ett besök två år senare svarar inte på om just den bristen
 * rättades.
 *
 * Gränsen används bara för att avgöra vilka två kontroller som får ställas
 * bredvid varandra. Ingenting härleds ur själva avståndet.
 */
export const FOLLOW_UP_DAYS = 180;

export interface FollowUp {
  /** Återbesöket, eller den kontroll där utfallet antecknades. */
  visit: Inspection;
  /** Kontrollen som bristerna noterades vid, när den går att peka ut. */
  before: Inspection | null;
  /** Antal brister vid `before`. Noll när `before` saknas. */
  raised: number;
  /** Brister kommunen uttryckligen antecknat som åtgärdade vid `visit`. */
  fixed: number;
  /** Brister kommunen uttryckligen antecknat som kvarstående vid `visit`. */
  persisting: number;
  /**
   * Sant när kommunen SJÄLV märker upp åtgärdat eller kvarstående på
   * kontrollraden. Då är utfallet kommunens ord, inte vår slutsats.
   */
  explicit: boolean;
  /** Dagar mellan `before` och `visit`, eller null när `before` saknas. */
  days: number | null;
}

/**
 * Vad uppföljningen visade
 *
 * Det här är den enda insikt sajten kan bygga som varken summerar över tid
 * eller över kommungränser. Den handlar om TVÅ KONKRETA KONTROLLER på samma
 * adress, några veckor isär: kommunen påpekade något, kom tillbaka, och
 * antecknade vad den då såg. Ett ägarbyte hinner i praktiken inte ske i det
 * fönstret, och även om det gjorde det är påståendet fortfarande sant. Det
 * säger vad kommunen antecknade vid ett besök, inte vem som drev stället.
 *
 * Två former, i fallande styrka:
 *
 * 1. EXPLICIT. Källan märker kontrollraderna "Åtgärdad" respektive "Kvarstår".
 *    Linköping, Örebro, Uppsala och Borgholm gör det. Då behövs ingen
 *    hopparning alls: en enda kontrollrapport bär både bristen och utfallet,
 *    och vi återger kommunens egen uppmärkning. Noll inferens.
 *
 * 2. HÄRLEDD. Källan saknar den uppmärkningen, men märker kontrollen som
 *    återbesök. Stockholm är fallet. Då ställs återbesöket bredvid kontrollen
 *    före, och utfallet läses ur ÅTERBESÖKETS EGEN BEDÖMNING — kommunens
 *    tresteg 0/1/2 på just det besöket.
 *
 * Att läsa utfallet ur bedömningen och inte ur frånvaron av avvikelserader är
 * avgörande. 3 495 av Stockholms 3 603 återbesök redovisar inga
 * kontrollpunkter alls, eftersom Stockholm sällan lämnar ut dem. Hade vi läst
 * "inga rader" som "bristen borta" hade 341 återbesök som kommunen själv
 * bedömt till en etta räknats som åtgärdade. Frånvaro av rader är inte ett
 * besked; bedömningen är det.
 *
 * Returnerar det SENASTE utfallet i historiken, eller null när inget finns.
 * Utan block är sidan tyst: en verksamhet utan uppföljning ska inte få en
 * rubrik som antyder att vi letat och hittat något.
 */
export function followUp(e: Establishment): FollowUp | null {
  const ins = e.inspections;

  for (let k = 0; k < ins.length; k += 1) {
    const visit = ins[k];
    const before = ins[k + 1] ?? null;
    const days = before ? Math.round(daysBetween(visit.date, before.date)) : null;
    const raised = before ? before.areas.filter(isRemark).length : 0;

    let fixed = 0;
    let persisting = 0;
    for (const area of visit.areas) {
      if (area.status === 'fixed') fixed += 1;
      else if (area.status === 'persisting') persisting += 1;
    }

    /*
     * 1. Kommunens egen uppmärkning, på ett besök som ÄR ett återbesök.
     *
     * Kravet på kontrolltyp hör hit trots att uppmärkningen står på egna ben.
     * Uppsala sätter "Kvarstår" även på planerade kontroller, och då betyder
     * det att bristen levt kvar sedan ett tidigare besök som kan ligga år
     * tillbaka. Det är ett annat påstående än det här blocket gör, eftersom
     * det ärver anläggningsproblemet: "sedan förra gången" kan spänna över ett
     * ägarbyte. Rubriken "Vad uppföljningen visade" hade dessutom varit falsk
     * på en kontroll som ingen följt upp något med.
     */
    if (visit.type === 1 && (fixed > 0 || persisting > 0)) {
      return { visit, before, raised, fixed, persisting, explicit: true, days };
    }

    // 2. Ett äkta återbesök på en kontroll som faktiskt hade något att följa upp.
    if (
      visit.type === 1 &&
      before &&
      raised > 0 &&
      days !== null &&
      days <= FOLLOW_UP_DAYS
    ) {
      return { visit, before, raised, fixed: 0, persisting: 0, explicit: false, days };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Kommunens sammanräkning
// ---------------------------------------------------------------------------

export interface MunicipalitySummary extends Municipality {
  /** Alla verksamheter i kommunens register. */
  total: number;
  clean: number;
  minor: number;
  major: number;
  /**
   * Verksamheter utan bedömning. De är inte rena — de är okända, och måste
   * hållas isär från `clean` överallt där ett tal visas.
   */
  unassessed: number;
  /** clean + minor + major. */
  assessed: number;
  /**
   * Andel utan anmärkningar, räknad på BEDÖMDA och aldrig på totalen. Med
   * totalen som nämnare hade en kommun som lämnar ut lite data sett sämre ut
   * än en som lämnar ut mycket, vilket är precis fel signal.
   */
  cleanShare: number;
  /** Kommunens senaste kontroll, eller null om ingen har något datum. */
  latest: string | null;
}

/**
 * Kommunens siffror i den form startsidan och kommunkortet visar dem.
 *
 * Låg tidigare inline i två sidmallar med var sin definition av "bedömd", och
 * de hann glida isär. Den här är den enda. Ett enda svep över beståndet:
 * Stockholm är 8 500 poster och funktionen anropas för varje kommun på
 * startsidan.
 */
export function municipalitySummary(input: string | Municipality): MunicipalitySummary {
  const m = typeof input === 'string' ? municipality(input) : input;
  if (!m) throw new Error(`Okänd kommun: ${input as string}`);

  let clean = 0;
  let minor = 0;
  let major = 0;
  let latest: string | null = null;

  const all = establishments(m.slug);
  for (const e of all) {
    if (e.verdict === 'clean') clean += 1;
    else if (e.verdict === 'minor') minor += 1;
    else if (e.verdict === 'major') major += 1;

    const date = latestInspectionDate(e);
    if (date && (latest === null || date > latest)) latest = date;
  }

  const assessed = clean + minor + major;

  return {
    ...m,
    total: all.length,
    clean,
    minor,
    major,
    unassessed: all.length - assessed,
    assessed,
    cleanShare: assessed ? Math.round((clean / assessed) * 100) : 0,
    latest,
  };
}

/** Alla kommuner sammanräknade, i `municipalities()`-ordning (bokstavsordning). */
export function municipalitySummaries(): MunicipalitySummary[] {
  return municipalities().map(municipalitySummary);
}

// ---------------------------------------------------------------------------
// Vad källan gör omöjligt
// ---------------------------------------------------------------------------

/**
 * Hur många kontroller modellen väger in. Speglar HISTORY_DEPTH i
 * pipeline/prikko/grading.py och måste ändras i takt med den.
 */
export const HISTORY_DEPTH = 3;

export interface SourceLimits {
  /** Djupaste kontrollhistorik någon verksamhet i kommunen har. */
  maxHistory: number;
  /**
   * Sant när ingen kontroll i kommunen är märkt som återbesök. Då kan modellen
   * inte se att en avvikelse överlevt en uppföljning.
   */
  noInspectionType: boolean;
  /** Kan någon verksamhet i kommunen alls nå märkningen ”ren historik”? */
  distinctionPossible: boolean;
  /** Kan modellen alls härleda kvarstående brister i kommunen? */
  persistingPossible: boolean;
  /**
   * Fullständig notis i klarspråk, eller null.
   *
   * Sätts BARA när källan stänger ute ett av modellens utfall. Att en kommun
   * lämnar ut kortare historik än en annan är i sig ingen upplysning: inget
   * blir fel av det, och en mening om saken är då bara en ursäkt.
   *
   * Hör hemma på /metodik, där modellens utfall är beskrivna. Se
   * `distributionNote` för den som får stå på kommunsidan.
   */
  note: string | null;
  /**
   * Notisen som hör hemma intill fördelningsstapeln på kommunhubben.
   *
   * Skiljer sig från `note` genom att bara nämna utfall besökaren FAKTISKT SER
   * en nolla för på just den sidan. Stapeln visar bedömningsnivåerna, alltså
   * även ”Brister som kvarstår”. Den visar inte utmärkelsen för genomgående
   * skötsamhet.
   *
   * Karlstad är fallet som visade skillnaden. Hubben skrev tidigare ut att
   * ingen verksamhet där kan nå utmärkelsen — ett begrepp sidan aldrig nämner
   * någon annanstans, infört enbart för att meddela att det inte finns.
   * Samtidigt stod 35 verksamheter under ”Brister som kvarstår” några rader
   * ovanför, så ingenting på sidan kunde missförstås. Kvar blev en ursäkt.
   */
  distributionNote: string | null;
}

const limitsCache = new Map<string, SourceLimits>();

function joinSv(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} och ${parts[parts.length - 1]}`;
}

/**
 * Vad kommunens datakälla gör strukturellt omöjligt.
 *
 * Modellen är densamma överallt, men källorna är det inte. Karlstad publicerar
 * bara den senaste kontrollen, så ingen verksamhet där kan visa tre rena i rad
 * och utmärkelsen är utom räckhåll för alla 694. Oskarshamn saknar dessutom
 * kontrolltyp, så modellen aldrig kan se att en avvikelse överlevt en
 * uppföljning: noll av 239 kan hamna på "Brister som kvarstår".
 *
 * Utan den här upplysningen läser besökaren frånvaron som ett omdöme om
 * verksamheten, när den i själva verket är ett omdöme om vad kommunen lämnar
 * ut. Räknas fram ur datan i stället för att listas i kod, så att den inte kan
 * bli inaktuell när en kommun börjar publicera mer.
 */
/**
 * Vad kommunen SJÄLV säger om hur den hanterar ägarbyte.
 *
 * Detta är kommunens utsaga, inte vår slutsats, och måste återges så. Vi går
 * inte i god för den och vi motsäger den inte. Örebros formulering står
 * ordagrant på deras verksamhetssidor under rubriken "Vad betyder resultatet?":
 *
 *   "Vid ägarbyte tar vi bort resultatet från tidigare kontroller."
 *
 * Jag har inte kunnat bekräfta den i datan. Fyra oberoende test mot Stockholm
 * och Linköping i identiskt tidsfönster visar ingen rensningssignatur i Örebro:
 * de har snarast FLER långa uppehåll (12,2 % mot 9,4 % respektive 7,6 %), lika
 * många historiker som återupptas efter ett uppehåll (5,8 %, samma som
 * Stockholm) och samma fördelning av när historiken börjar. En kommun kan
 * dessutom bara rensa när den fått veta att bytet skett.
 *
 * Att därför TA BORT upplysningen om lokalen i Örebro vore att hävda att deras
 * historik säkert gäller ett och samma företag. Det är ett starkare påstående
 * än det vi försöker undvika. Vi lägger till kommunens uppgift, vi drar inte
 * ifrån vår egen.
 *
 * Nyckeln är kommunens slug. Saknas den har kommunen inte sagt något om saken,
 * vilket inte betyder att de inte rensar.
 */
export const OWNERSHIP_POLICY: Record<string, string> = {
  orebro:
    'Örebro kommun uppger att resultat från tidigare kontroller tas bort vid ägarbyte.',
};

export function ownershipPolicy(slug: string): string | null {
  return OWNERSHIP_POLICY[slug] ?? null;
}

export function sourceLimits(slug: string): SourceLimits {
  const cached = limitsCache.get(slug);
  if (cached) return cached;

  const all = establishments(slug);
  const name = all[0]?.municipality.name ?? slug;

  let maxHistory = 0;
  let typedInspections = 0;
  let statedPersisting = 0;
  for (const e of all) {
    if (e.inspections.length > maxHistory) maxHistory = e.inspections.length;
    for (const i of e.inspections) {
      if (i.type !== 0) typedInspections += 1;
      if (i.assessment === 2) statedPersisting += 1;
    }
  }

  const noInspectionType = typedInspections === 0;

  // Märkningen "ren historik" kräver HISTORY_DEPTH kontroller utan anmärkning.
  // Räcker inte historiken till så många kan ingen få den. Utmärkelsen, alltså
  // årsutgåvan, har en högre ribba och redovisas i lib/utmarkelser.ts.
  const distinctionPossible = maxHistory >= HISTORY_DEPTH;

  /*
   * Kvarstående brister härleds ur två tecken: senaste kontrollen är ett
   * återbesök, eller föregående kontroll hade också avvikelser. Saknas båda
   * finns inget av tecknen — MEN källan kan också säga det rakt ut.
   *
   * Lomma är fallet som visade att villkoret var för snävt. Kommunen
   * publicerar en enda kontroll per verksamhet och märker ingen som återbesök,
   * så de två strukturella tecknen saknas. Ändå har två verksamheter nivån
   * "Brister som kvarstår", eftersom Lommas egen bedömning på kontrollen är en
   * tvåa. Sidan skrev alltså ut att ingen kunde nå nivån, med de två som nått
   * den synliga i samma stapel några rader ovanför.
   */
  const persistingPossible =
    !noInspectionType || maxHistory >= 2 || statedPersisting > 0;

  const causes: string[] = [];
  if (maxHistory <= 1) {
    causes.push('publicerar bara den senaste kontrollen');
  } else if (maxHistory <= HISTORY_DEPTH) {
    causes.push(
      `lämnar ut högst ${maxHistory === 2 ? 'två' : 'tre'} kontroller per verksamhet`,
    );
  }
  if (noInspectionType) causes.push('anger inte om en kontroll är ett återbesök');

  /*
   * Notisen sätts bara när ett utfall är OMÖJLIGT.
   *
   * Här stod tidigare också en andra mening för kommuner vars historik råkar
   * vara grund utan att stänga ute något: "Historiken är alltså precis så djup
   * som modellen väger in, och kortare än i de flesta andra kommuner." Den
   * förklarade ingenting man kunde se. Höganäs och Jönköping bar den, och i
   * båda kommunerna kan varje utfall nås — inga nollor att missförstå, alltså
   * inget att förklara. Kvar blev en ursäkt överst på sidan.
   *
   * Regeln: en frånvaro som kan MISSFÖRSTÅS förklaras, en frånvaro som bara är
   * en frånvaro är tyst.
   */
  const write = (missing: string[]) =>
    missing.length > 0 && causes.length > 0
      ? `${name} ${joinSv(causes)}. Därför kan ingen verksamhet här nå ${joinSv(missing)}, ` +
        'hur kontrollerna än ser ut. Frånvaron säger något om vad kommunen lämnar ut, ' +
        'inte om verksamheterna.'
      : null;

  const missing: string[] = [];
  if (!distinctionPossible) missing.push('märkningen ”ren historik”');
  if (!persistingPossible) missing.push('nivån ”Brister som kvarstår”');

  const limits: SourceLimits = {
    maxHistory,
    noInspectionType,
    distinctionPossible,
    persistingPossible,
    note: write(missing),
    // Bara det fördelningsstapeln faktiskt visar en nolla för.
    distributionNote: write(persistingPossible ? [] : ['nivån ”Brister som kvarstår”']),
  };
  limitsCache.set(slug, limits);
  return limits;
}

/** Kommuner där källan stänger ute något utfall, i bokstavsordning. */
export function limitedMunicipalities(): Array<Municipality & { limits: SourceLimits }> {
  return municipalities()
    .map((m) => ({ ...m, limits: sourceLimits(m.slug) }))
    .filter((m) => m.limits.note !== null);
}

// ---------------------------------------------------------------------------
// Kommunhubbens ordning
// ---------------------------------------------------------------------------

/**
 * Kommunens verksamheter i den ordning hubben listar dem: bokstavsordning.
 *
 * Ordningen MÅSTE vara oberoende av bedömningen. Hubben är sidindelad, och
 * med bedömningen som primär sorteringsnyckel hade en enda ändrad kontroll i
 * kommunen skjutit hundratals verksamheter mellan sidor vid varje
 * datauppdatering. Då pekar varje extern länk till /stockholm/sida/12 på
 * något annat än förra veckan, och Google får en katalog som aldrig står
 * still. Bokstavsordning ändras bara när beståndet ändras.
 *
 * Det som avviker har en egen sida — /[kommun]/anmarkningar — och den är
 * enligt SEO-dimensioneringen den som faktiskt söks. Hubben får vara det den
 * är bäst på: ett fullständigt, förutsägbart register.
 *
 * Slug som sista nyckel gör sorteringen total: två verksamheter kan heta
 * likadant, och `localeCompare` returnerar då 0. Utan tiebreak avgörs
 * ordningen av datafilens ordning, som pipelinen inte lovar något om.
 */
export function municipalityListing(slug: string): Establishment[] {
  return [...establishments(slug)].sort(
    (a, b) => a.name.localeCompare(b.name, 'sv') || a.slug.localeCompare(b.slug, 'sv'),
  );
}

export interface RemarkedEstablishment extends Establishment {
  /** Antal avvikelser vid den senaste kontrollen. */
  remarks: number;
}

/**
 * Verksamheter med anmärkning vid senaste kontrollen, i listans ordning.
 *
 * Allvarligast först, sedan flest avvikelser, sedan senast kontrollerad.
 * Här FÅR bedömningen styra ordningen — det är hela sidans poäng, och listan
 * är kort nog att en förskjutning inte flyttar någon långt. Slug sist gör
 * sorteringen total, så att två poster med samma nivå, samma antal
 * avvikelser och samma datum inte byter plats mellan bygg.
 */
export function municipalityRemarks(slug: string): RemarkedEstablishment[] {
  const severity = { major: 0, minor: 1, clean: 2 } as const;
  return establishments(slug)
    .filter((e) => e.verdict !== null && e.verdict !== 'clean')
    .map((e) => ({ ...e, remarks: e.inspections[0]?.areas.filter(isRemark).length ?? 0 }))
    .sort(
      (a, b) =>
        severity[a.verdict!] - severity[b.verdict!] ||
        b.remarks - a.remarks ||
        (latestInspectionDate(b) ?? '').localeCompare(latestInspectionDate(a) ?? '') ||
        a.slug.localeCompare(b.slug, 'sv'),
    );
}

// ---------------------------------------------------------------------------
// Kategorier
// ---------------------------------------------------------------------------

/**
 * Minsta antal verksamheter för att en kategori ska få en egen sida.
 *
 * Under gränsen syns kategorin fortfarande på hubben, med sin siffra, men utan
 * länk. En sida med tjugo rader är ett utsnitt av hubbens första sida och
 * ingenting mer — den bär ingen egen information, och tunna sidor i tiotal
 * drar ner hela domänen vid Googles bedömning av skalat innehåll (bibeln §6).
 * Hellre en siffra som stämmer än en sida som inte förtjänar sin URL.
 */
export const MIN_CATEGORY_PAGE = 25;

/**
 * Detsamma för underkategorier, men högre.
 *
 * Underkategorin ligger ett steg längre in och konkurrerar med sin egen
 * toppkategori om samma sökning. Den måste bära mer för att vara värd en URL.
 */
export const MIN_SUB_PAGE = 50;

/** Bedömningarna inom ett utsnitt. Bär kategorisidans svarsmening. */
export interface SliceVerdicts {
  clean: number;
  minor: number;
  major: number;
  /** clean + minor + major. Nämnaren, aldrig totalen. */
  assessed: number;
}

export interface CategorySlice extends SliceVerdicts {
  category: TopCategory;
  count: number;
  /** Har kategorin en egen sida i den här kommunen? */
  linked: boolean;
}

export interface SubCategorySlice extends SliceVerdicts {
  sub: SubCategory;
  count: number;
  linked: boolean;
}

function verdictCounts(items: readonly Establishment[]): SliceVerdicts {
  let clean = 0;
  let minor = 0;
  let major = 0;
  for (const e of items) {
    if (e.verdict === 'clean') clean += 1;
    else if (e.verdict === 'minor') minor += 1;
    else if (e.verdict === 'major') major += 1;
  }
  return { clean, minor, major, assessed: clean + minor + major };
}

/**
 * Minsta andel av kommunens bestånd som måste gå att kategorisera för att
 * filtret alls ska visas.
 *
 * Höganäs är fallet gränsen finns för. Källan där lägger butik, restaurang och
 * servering i en enda hink, så 212 av 310 verksamheter hamnar utanför varje
 * kategori. Kvar blev två chips som täckte knappt en tredjedel av kommunen,
 * plus tre meningar som förklarade varför de tre andra stod på noll.
 *
 * Ett filter som inte kan filtrera är ingen funktion, det är en förklaring med
 * chips runt. Under gränsen visas ingenting alls: listan under är fullständig
 * och sökrutan hittar varje verksamhet ändå.
 */
export const MIN_CATEGORY_COVERAGE = 0.5;

export interface MunicipalityCategories {
  slug: string;
  /** Alla fem toppkategorier i visningsordning, även de tomma. */
  slices: CategorySlice[];
  /**
   * Kategorier kommunen faktiskt har verksamheter i, i visningsordning.
   *
   * Det är den här listan gränssnittet visar. Ett chip som står på noll är
   * inte en tom hylla utan ett felaktigt besked: "Caféer 0" i Uppsala läses som
   * att staden saknar kaféer, när sanningen är att källan lägger dem under
   * Restauranger. Nollan tvingade fram en mening som förklarade bort den, och
   * det enklaste sättet att slippa förklaringen är att inte påstå nollan.
   */
  shown: CategorySlice[];
  /** Underkategorier per toppkategori. Bara de kommunen faktiskt levererar. */
  subs: Map<TopCategoryId, SubCategorySlice[]>;
  /** Verksamheter helt utan kategori. */
  uncategorised: number;
  /** Andel av beståndet som hamnar i minst en kategori, 0–1. */
  coverage: number;
  /** Ska filtret visas alls i den här kommunen? */
  usable: boolean;
}

interface CategoryIndex extends MunicipalityCategories {
  /** Medlemmar per toppkategori, i hubbens bokstavsordning. */
  members: Map<TopCategoryId, Establishment[]>;
  /** Medlemmar per underkategori, nyckel `${top}/${sub}`. */
  subMembers: Map<string, Establishment[]>;
}

const categoryIndexes = new Map<string, CategoryIndex>();

function categoryIndex(slug: string): CategoryIndex {
  const cached = categoryIndexes.get(slug);
  if (cached) return cached;

  // Bokstavsordning redan här, så att varje kategorisida ärver hubbens ordning
  // utan att sortera om. municipalityListing kopierar innan den sorterar; det
  // som establishments() lämnar ut får inte röras (se db.ts).
  const listing = municipalityListing(slug);

  const members = new Map<TopCategoryId, Establishment[]>();
  const subMembers = new Map<string, Establishment[]>();
  const counts = new Map<TopCategoryId, number>();
  const subCounts = new Map<string, number>();

  let uncategorised = 0;

  for (const e of listing) {
    const c = classify(slug, e.types);

    for (const value of c.unknown) {
      noteUnknown(slug, value, c.status === 'unknown');
      scheduleUnknownLog();
    }

    if (c.categories.length === 0) {
      uncategorised += 1;
      continue;
    }

    for (const id of c.categories) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
      const bucket = members.get(id);
      if (bucket) bucket.push(e);
      else members.set(id, [e]);
    }

    for (const sub of c.subcategories) {
      const key = `${subCategory(sub).top}/${sub}`;
      subCounts.set(key, (subCounts.get(key) ?? 0) + 1);
      const bucket = subMembers.get(key);
      if (bucket) bucket.push(e);
      else subMembers.set(key, [e]);
    }
  }

  // Grinden. Över en procent okategoriserade har källan lagt om sin modell,
  // och då ska bygget stanna i stället för att publicera gissningar.
  assertKnown(slug, listing.length);

  /*
   * Här räknades tidigare fram tre sorters förklarande text: varför en kategori
   * står på noll ("Uppsala skiljer inte caféer och bagerier från restauranger"),
   * varför en hel grupp inte går att dela upp, och hur många verksamheter som
   * faller utanför varje filter. Femton kommunsidor bar dem, och tillsammans
   * blev de ett stycke ursäkter ovanför själva registret.
   *
   * Alla tre var svar på en fråga gränssnittet ställde själv. Nollan var
   * påståendet; meningen under var rättelsen. Utan nollan behövs ingen
   * rättelse. Kategorier utan verksamheter visas därför inte alls, och
   * kommuner vars källa inte kan kategorisera tillräckligt får inget filter.
   *
   * coverageGaps finns kvar i categories.ts. Den bär täckningskartan som
   * mappningen underhålls mot, och den kartan ska inte försvinna för att
   * gränssnittet slutat skriva ut den.
   */
  const slices: CategorySlice[] = TOP_CATEGORIES.map((category) => {
    const count = counts.get(category.id) ?? 0;
    return {
      category,
      count,
      linked: count >= MIN_CATEGORY_PAGE,
      ...verdictCounts(members.get(category.id) ?? []),
    };
  });

  const subs = new Map<TopCategoryId, SubCategorySlice[]>();
  for (const [key, count] of subCounts) {
    const sub = subCategory(key.slice(key.indexOf('/') + 1));
    const list = subs.get(sub.top) ?? [];
    list.push({
      sub,
      count,
      linked: count >= MIN_SUB_PAGE,
      ...verdictCounts(subMembers.get(key) ?? []),
    });
    subs.set(sub.top, list);
  }
  for (const list of subs.values()) {
    list.sort((a, b) => b.count - a.count || subCategoryRank(a.sub.id) - subCategoryRank(b.sub.id));
  }

  const shown = slices.filter((s) => s.count > 0);
  const coverage = listing.length ? (listing.length - uncategorised) / listing.length : 0;

  /*
   * Ett filter behöver två val för att vara ett val, och det måste nå de
   * flesta. En ensam kategori filtrerar ingenting bort, och två som täcker en
   * tredjedel av kommunen ger en lista som ser fullständig ut utan att vara
   * det.
   */
  const usable = shown.length >= 2 && coverage >= MIN_CATEGORY_COVERAGE;

  const index: CategoryIndex = {
    slug,
    slices,
    shown,
    subs,
    uncategorised,
    coverage,
    usable,
    members,
    subMembers,
  };
  categoryIndexes.set(slug, index);
  return index;
}

/** Kommunens kategorier med antal, länkbarhet och förklaringar. */
export function municipalityCategories(slug: string): MunicipalityCategories {
  return categoryIndex(slug);
}

/**
 * Verksamheterna i en kategori, i hubbens bokstavsordning.
 *
 * Listan är delad med registret och får inte sorteras eller muteras av
 * anroparen, precis som establishments(). Sidmallarna skär bara ut en sida.
 */
export function categoryListing(slug: string, category: TopCategoryId): Establishment[] {
  return categoryIndex(slug).members.get(category) ?? [];
}

export function subCategoryListing(
  slug: string,
  category: TopCategoryId,
  sub: string,
): Establishment[] {
  return categoryIndex(slug).subMembers.get(`${category}/${sub}`) ?? [];
}

/** Kategoriseringen av en enskild verksamhet. */
export function categoriesOf(e: Establishment): Categorised {
  return classify(e.municipality.slug, e.types);
}

// ---------------------------------------------------------------------------
// Kommunens läge
// ---------------------------------------------------------------------------

export interface MunicipalityPoint {
  slug: string;
  city: string;
  lat: number;
  lng: number;
}

/** Medianen — inte medelvärdet. En enda felkodad koordinat i Bottenhavet
 *  hade flyttat medelvärdet, medianen rör den sig inte av. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * En punkt per kommun, härledd ur verksamheternas koordinater.
 *
 * Används av platsväljaren för att svara på "vilken kommun är närmast mig".
 * Vi hittar INTE på koordinater: kommuner vars datakälla saknar koordinater
 * (i dag Uppsala och Örebro) utelämnas ur listan och kan alltså inte träffas
 * av platsknappen. De finns kvar i väljarens lista och går att välja för
 * hand. När pipelinen börjar leverera koordinater för dem försvinner luckan
 * av sig själv — eller när datafilens `municipality` får egna lat/lng, som
 * läses först här nedan.
 */
let pointsCache: MunicipalityPoint[] | null = null;

/**
 * Tätortspunkter för kommuner vars källa inte lämnar några koordinater alls.
 *
 * Utan dem är de här fyra kommunerna osynliga för platsknappen: den som står
 * mitt i Lomma fick "vi täcker inte ditt område än" och Jönköping tjugo mil
 * bort som närmaste förslag, trots att Lomma finns på sajten. Det är värre än
 * en ungefärlig punkt.
 *
 * Detta är inte gissningar utan slagningar mot OSM/Nominatim (2026-08-04),
 * avrundade till fyra decimaler. Punkten används enbart för att räkna avstånd
 * mot en besökares position, där ett fel på någon kilometer inte kan ändra
 * utfallet: närmaste granne ligger tiotals kilometer bort. Ingen nål ritas ur
 * den här tabellen.
 *
 * Tabellen läses före medianberäkningen, så en rad som ligger kvar när
 * kommunen börjat leverera riktiga koordinater skulle skugga dem för alltid.
 * Därför finns bygg-vakten inne i municipalityPoints: den fäller bygget och
 * pekar ut raden som ska bort.
 */
const DECLARED_POINTS: Record<string, { lat: number; lng: number }> = {
  borgholm: { lat: 56.8795, lng: 16.656 },
  lomma: { lat: 55.6667, lng: 13.0833 },
  svenljunga: { lat: 57.4964, lng: 13.1116 },
};

export function municipalityPoints(): MunicipalityPoint[] {
  if (pointsCache) return pointsCache;

  const points: MunicipalityPoint[] = [];

  for (const m of municipalities()) {
    const declared = m as Municipality & { lat?: number; lng?: number };
    if (typeof declared.lat === 'number' && typeof declared.lng === 'number') {
      points.push({ slug: m.slug, city: m.city, lat: declared.lat, lng: declared.lng });
      continue;
    }

    const table = DECLARED_POINTS[m.slug];
    if (table) {
      /*
       * Vakten: har kommunen börjat leverera egna koordinater ska raden i
       * DECLARED_POINTS bort, annars ligger en handskriven punkt kvar och
       * skuggar den riktiga medianen för alltid. Bygget säger till i stället
       * för att låta det ruttna tyst.
       */
      const har = establishments(m.slug).some((e) => e.lat !== null && e.lng !== null);
      if (har) {
        throw new Error(
          `${m.slug} har nu egna koordinater. Ta bort raden ur DECLARED_POINTS i lib/data.ts ` +
            'så att medianen av verksamheterna används i stället.',
        );
      }
      points.push({ slug: m.slug, city: m.city, lat: table.lat, lng: table.lng });
      continue;
    }

    const lats: number[] = [];
    const lngs: number[] = [];
    for (const e of establishments(m.slug)) {
      if (e.lat !== null && e.lng !== null) {
        lats.push(e.lat);
        lngs.push(e.lng);
      }
    }
    if (lats.length) {
      points.push({ slug: m.slug, city: m.city, lat: median(lats), lng: median(lngs) });
    }
  }

  // Punkterna ligger i platsväljaren, och platsväljaren ligger i sidhuvudet på
  // varje sida. Utan minnet sorterades alltså varje kommuns hela koordinatlista
  // om 14 950 gånger per bygge, mätt till 28 % av byggtiden. Datan ändras inte
  // under ett bygg, så en körning räcker.
  pointsCache = points;
  return points;
}
