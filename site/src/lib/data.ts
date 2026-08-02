/**
 * Domänlogik och presentation ovanpå datakällan.
 *
 * `db.ts` vet var datan kommer ifrån. Den här modulen vet vad den betyder:
 * etiketter, färger, härledd statistik och kvalitetsgrinden. Sidmallarna
 * pratar bara med den här nivån.
 */
import {
  coverage,
  establishments,
  findEstablishment,
  municipalities,
  municipality,
  sourceFor,
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
  coverageGaps,
  noteUnknown,
  rawValues,
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
  /** Längsta uppehållet mellan två noteringar av bristen, i hela dagar. */
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
        existing.count += 1;
        existing.dates.push(inspection.date);
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
    if (issue.count < minCount) continue;
    // Samma kontrolldatum kan bära flera rader som normaliseras till samma
    // brist. Uppehållet ska mätas mellan KONTROLLTILLFÄLLEN, annars räknas ett
    // dubblerat datum som ett uppehåll på noll och döljer ett verkligt.
    const unique = issue.dates.filter((d, i) => i === 0 || d !== issue.dates[i - 1]);
    issue.gapDays = longestGap(unique);
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

/** Avvikelser vid en enskild kontroll. */
export function deviations(inspection: Inspection): ControlArea[] {
  return inspection.areas.filter(isRemark);
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
  /** Kan någon verksamhet i kommunen alls nå utmärkelsen? */
  distinctionPossible: boolean;
  /** Kan modellen alls härleda kvarstående brister i kommunen? */
  persistingPossible: boolean;
  /** Notis i klarspråk, eller null när källan inte begränsar något. */
  note: string | null;
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
  for (const e of all) {
    if (e.inspections.length > maxHistory) maxHistory = e.inspections.length;
    for (const i of e.inspections) if (i.type !== 0) typedInspections += 1;
  }

  const noInspectionType = typedInspections === 0;

  // Utmärkelsen kräver HISTORY_DEPTH kontroller utan anmärkning. Räcker inte
  // historiken till så många kontroller kan ingen få den.
  const distinctionPossible = maxHistory >= HISTORY_DEPTH;

  // Kvarstående brister härleds ur två tecken: senaste kontrollen är ett
  // återbesök, eller föregående kontroll hade också avvikelser. Saknas både
  // kontrolltyp och en föregående kontroll finns inget av tecknen.
  const persistingPossible = !noInspectionType || maxHistory >= 2;

  // Kommuner som lämnar ut mer än modellens fönster begränsar ingenting.
  const causes: string[] = [];
  if (maxHistory <= 1) {
    causes.push('publicerar bara den senaste kontrollen');
  } else if (maxHistory <= HISTORY_DEPTH) {
    causes.push(
      `lämnar ut högst ${maxHistory === 2 ? 'två' : 'tre'} kontroller per verksamhet`,
    );
  }
  if (noInspectionType) causes.push('anger inte om en kontroll är ett återbesök');

  let note: string | null = null;
  if (causes.length > 0) {
    const missing: string[] = [];
    if (!distinctionPossible) missing.push('utmärkelsen för genomgående skötsamhet');
    if (!persistingPossible) missing.push('nivån ”Brister som kvarstår”');

    note =
      missing.length > 0
        ? `${name} ${joinSv(causes)}. Därför kan ingen verksamhet här nå ${joinSv(missing)}, ` +
          'hur kontrollerna än ser ut. Frånvaron säger något om vad kommunen lämnar ut, ' +
          'inte om verksamheterna.'
        : `${name} ${joinSv(causes)}. Historiken är alltså precis så djup som modellen ` +
          'väger in, och kortare än i de flesta andra kommuner.';
  }

  const limits: SourceLimits = {
    maxHistory,
    noInspectionType,
    distinctionPossible,
    persistingPossible,
    note,
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
  /**
   * Varför kategorin är tom här, i klarspråk. Null när den går att fylla.
   * Sätts bara när källan är orsaken, aldrig när kommunen helt enkelt saknar
   * den sortens verksamheter.
   */
  note: string | null;
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

export interface MunicipalityCategories {
  slug: string;
  /** Alla fem toppkategorier i visningsordning, även de tomma. */
  slices: CategorySlice[];
  /** Underkategorier per toppkategori. Bara de kommunen faktiskt levererar. */
  subs: Map<TopCategoryId, SubCategorySlice[]>;
  /** Verksamheter helt utan kategori. */
  uncategorised: number;
  /** Varför de saknar kategori, i klarspråk. Null när ingen gör det. */
  gapNote: string | null;
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
  const city = listing[0]?.municipality.city ?? slug;

  const members = new Map<TopCategoryId, Establishment[]>();
  const subMembers = new Map<string, Establishment[]>();
  const counts = new Map<TopCategoryId, number>();
  const subCounts = new Map<string, number>();
  const vocabulary = new Set<string>();

  let uncategorised = 0;
  let spanning = 0;
  let noType = 0;
  let unknownRows = 0;

  for (const e of listing) {
    for (const v of rawValues(slug, e.types)) vocabulary.add(v);

    const c = classify(slug, e.types);

    for (const value of c.unknown) {
      noteUnknown(slug, value, c.status === 'unknown');
      scheduleUnknownLog();
    }

    if (c.status === 'spanning') spanning += 1;
    else if (c.status === 'no_type') noType += 1;
    else if (c.status === 'unknown') unknownRows += 1;

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

  const gaps = coverageGaps(slug, vocabulary);
  const gapByCategory = new Map(gaps.map((g) => [g.category, g]));

  // Den odelbara gruppen är EN företeelse, inte tre. Höganäs blandar
  // restauranger, caféer och butiker i samma hink, och tre nästan identiska
  // meningar under filtret hade läst som tre olika problem. Notisen sätts
  // därför på den första av dem och räknar upp allihop.
  const spanningGroup = gaps
    .filter((g) => g.kind === 'spanning' && (counts.get(g.category) ?? 0) === 0)
    .map((g) => topCategory(g.category));
  const spanningNote =
    spanningGroup.length > 0
      ? `${city} källa lägger ${joinSv(spanningGroup.map((c) => c.short))} i en enda grupp ` +
        'och skiljer dem inte åt. Ingen av dem går att filtrera här.'
      : null;

  const slices: CategorySlice[] = TOP_CATEGORIES.map((category) => {
    const count = counts.get(category.id) ?? 0;
    const gap = count === 0 ? gapByCategory.get(category.id) : undefined;

    let note: string | null = null;
    if (gap?.kind === 'absorbed') {
      const into = gap.into.map((id) => topCategory(id));
      note =
        `${city} skiljer inte ${category.plural} från ${joinSv(into.map((c) => c.plural))}. ` +
        `De ligger under ${joinSv(into.map((c) => c.name))}.`;
    } else if (gap?.kind === 'spanning' && category.id === spanningGroup[0]?.id) {
      note = spanningNote;
    }

    return {
      category,
      count,
      linked: count >= MIN_CATEGORY_PAGE,
      note,
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

  // En verksamhet utan kategori försvinner ur varje filter. Då måste hubben
  // säga att den finns och varför den inte syns — annars ser summan av
  // kategorierna ut som hela kommunen, och den som räknar efter blir lurad.
  let gapNote: string | null = null;
  if (uncategorised > 0) {
    const causes: string[] = [];
    if (spanning > 0) {
      causes.push(
        spanningGroup.length > 0
          ? `${formatNumber(spanning)} ligger i en grupp där källan blandar ` +
            joinSv(spanningGroup.map((c) => c.short))
          : `${formatNumber(spanning)} ligger i en grupp källan inte delar upp`,
      );
    }
    if (noType > 0) causes.push(`${formatNumber(noType)} saknar verksamhetstyp i källan`);
    if (unknownRows > 0) {
      causes.push(`${formatNumber(unknownRows)} har en typ vi ännu inte känner igen`);
    }
    gapNote =
      `${formatNumber(uncategorised)} av ${formatNumber(listing.length)} verksamheter i ${city} ` +
      `saknar kategori: ${joinSv(causes)}. De finns kvar i listan ovan och har egna sidor, ` +
      'men syns inte i något filter.';
  }

  const index: CategoryIndex = {
    slug,
    slices,
    subs,
    uncategorised,
    gapNote,
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

export function municipalityPoints(): MunicipalityPoint[] {
  if (pointsCache) return pointsCache;

  const points: MunicipalityPoint[] = [];

  for (const m of municipalities()) {
    const declared = m as Municipality & { lat?: number; lng?: number };
    if (typeof declared.lat === 'number' && typeof declared.lng === 'number') {
      points.push({ slug: m.slug, city: m.city, lat: declared.lat, lng: declared.lng });
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
