/**
 * Rapporterna: sajtens redaktionella del.
 *
 * ## Varför det här inte är en blogg
 *
 * Sökefterfrågan på hygien i Sverige är hela 400 till 1 200 sökningar i
 * månaden, nationellt, över samtliga formuleringar (research/R2 och R3).
 * `hygienbetyg` och `restaurang hygien` ligger på exakt noll i 262 av 262
 * uppmätta veckor. En blogg som skriver om hygien skulle alltså jaga en
 * efterfrågan som inte finns.
 *
 * Det vi däremot har, och som ingen annan i Sverige har, är beståndet: 68 892
 * kontroller i tolv kommuner. Rapporterna räknar på det. De finns för att bli
 * lästa och citerade av journalister och av AI-svar, inte för att ranka på ett
 * sökord.
 *
 * ## Varför de är RÄKNADE och inte SKRIVNA
 *
 * Metodiksidan lovar uttryckligen: "Vi skriver ingen text med AI. Sidorna
 * byggs av datan; formuleringarna är mallar som fylls med kommunens
 * uppgifter." Det löftet gäller varje sida på sajten, också de redaktionella.
 *
 * Därför fungerar en rapport exakt som en verksamhetssida. Funktionerna här
 * räknar fram varje siffra, varje andel och varje rangordning ur beståndet vid
 * bygget. Sidmallen innehåller bara fast text som beskriver metoden och
 * placerar talen. Ingen mening i en rapport påstår något som inte är räknat
 * ur datan, och ingen slutsats formuleras om per körning.
 *
 * Det betyder också att rapporterna skriver om sig själva. När Örebro nästa
 * natt lämnar ut fler kontroller ändras siffrorna i texten med dem. Ingen
 * behöver komma ihåg att gå tillbaka och rätta en artikel som blivit inaktuell,
 * vilket är exakt den sortens fel en publicerad siffra annars drabbas av.
 *
 * ## Vad som INTE får byggas här
 *
 * En guide om matförgiftning är den enda angränsande efterfrågan med verklig
 * volym (~5 300 sökningar i månaden, R3 §3). Den hör inte hemma i den här
 * modulen och får inte genereras: den går inte att härleda ur vårt bestånd,
 * den är hälsorelaterad och den kräver en namngiven mänsklig avsändare. Den
 * ska skrivas av Måns, inte räknas fram.
 */
import {
  categoriesOf,
  establishments,
  legislationArea,
  municipalities,
  sourceFor,
  sourceLimits,
  TOP_CATEGORIES,
  type Inspection,
  type TopCategoryId,
} from './data';
import { chainIdFor } from './kedjeregister';

// ---------------------------------------------------------------------------
// Registret
// ---------------------------------------------------------------------------

export interface Report {
  slug: string;
  /** H1 och länktext. Sidans titel i Base blir den här plus varumärket. */
  title: string;
  /** Egen meta description. Skriven för sidan, aldrig delad med en annan. */
  description: string;
  /** Ingressen under rubriken. */
  lede: string;
  /** Kortare mening som index-sidan listar rapporten med. */
  summary: string;
  /** Datum då rapporten först publicerades. Siffrorna i den är färskare. */
  published: string;
}

/**
 * Rapporterna i publiceringsordning, nyast först.
 *
 * Registret är avsiktligt en vanlig modul och inte en Astro content
 * collection. Content collections finns för att läsa in FÖRFATTAD text från
 * markdown, och det är precis vad en rapport inte är: dess innehåll ligger i
 * beståndet, inte i en fil. Skulle Måns börja skriva egna artiklar med
 * byline är en content collection rätt verktyg för dem, och den kan ligga
 * bredvid den här utan att röra något här.
 */
export const REPORTS: Report[] = [
  {
    slug: 'kontrollresultaten-over-tid',
    title: 'Blir kontrollresultaten bättre eller sämre?',
    description:
      'Prikko har räknat andelen planerade kontroller som gav minst en anmärkning, år för år sedan 2018, och prövat samma serie i de kommuner som publicerar hela perioden.',
    lede:
      'Ett enskilt år säger ingenting. Åtta år i rad säger något, om man håller isär utvecklingen från det faktum att fler kommuner tillkommit under tiden.',
    summary:
      'Andelen planerade kontroller med anmärkning per år, med samma serie räknad enbart på kommunerna som publicerar hela perioden.',
    published: '2026-08-12',
  },
  {
    slug: 'kedja-eller-fristaende',
    title: 'Sköter kedjorna sig bättre än de fristående?',
    description:
      'Prikko har delat beståndet i kedjeställen och fristående verksamheter och räknat andelen kontroller med anmärkning för båda, totalt, per kategori och per kommun.',
    lede:
      'Frågan låter enkel och totalsumman svarar på den. Svaret blir ett annat så snart man jämför samma sorts verksamhet med samma sorts verksamhet.',
    summary:
      'Andelen kontroller med anmärkning hos kedjeställen och fristående verksamheter, räknad inom varje kategori och varje kommun.',
    published: '2026-08-12',
  },
  {
    slug: 'anmarkningar-over-aret',
    title: 'Så varierar anmärkningarna över året',
    description:
      'Prikko har räknat andelen planerade kontroller med anmärkning för varje månad, och delat upp skillnaden på områdena i livsmedelslagstiftningen.',
    lede:
      'Kontrollåret är inte jämnt. Andelen kontroller som ger en anmärkning skiljer sig åt mellan månaderna, och skillnaden ligger inte i alla delar av lagstiftningen.',
    summary:
      'Andelen planerade kontroller med anmärkning månad för månad, och vilka lagstiftningsområden som står för skillnaden.',
    published: '2026-08-12',
  },
  {
    slug: 'vad-anmarkningarna-galler',
    title: 'Vad anmärkningarna faktiskt gäller',
    description:
      'En del kommuner publicerar vilken punkt i livsmedelslagstiftningen varje avvikelse gällde. Prikko har räknat dem och sorterat dem på område. Hygien är störst, men långt ifrån allt: märkning och livsmedelsinformation är näst störst i varje kommun som anger koden.',
    lede:
      'Ordet hygienkontroll leder tanken till smuts. Men kommunerna kodar varje avvikelse mot ett område i livsmedelslagstiftningen, och koderna säger något mer än så.',
    summary:
      'Kodade avvikelser sorterade på Livsmedelsverkets lagstiftningsområden, räknade över de kommuner som publicerar rapporteringspunkten.',
    published: '2026-08-03',
  },
  {
    slug: 'tre-sorters-kontroll',
    title: 'Tre sorters kontroll, tre olika utfall',
    description:
      'En planerad kontroll, ett återbesök och en kontroll efter en anmälan hittar inte lika ofta något. Prikko har räknat andelen med anmärkning för varje kontrolltyp i tolv kommuner.',
    lede:
      'Kommunen kommer av tre olika skäl: enligt plan, för att följa upp en tidigare brist, eller för att någon hört av sig. Utfallet skiljer sig åt mellan de tre.',
    summary:
      'Andelen kontroller med anmärkning, uppdelad på planerad kontroll, återbesök och händelsestyrd kontroll. Räknad på samtliga kontroller i beståndet.',
    published: '2026-08-03',
  },
];

export function report(slug: string): Report {
  const found = REPORTS.find((r) => r.slug === slug);
  if (!found) throw new Error(`Okänd rapport: ${slug}`);
  return found;
}

/**
 * Senaste hämtning över samtliga källor, som ISO-datum.
 *
 * Rapporterna räknas om vid varje bygge, så det här är den ärliga
 * `dateModified`: det datum då den färskaste siffran i rapporten hämtades.
 */
export function dataUpdated(): string {
  let latest = '';
  for (const m of municipalities()) {
    const at = sourceFor(m.slug)?.fetchedAt;
    if (at && at > latest) latest = at;
  }
  return latest.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Gemensamt
// ---------------------------------------------------------------------------

/** Andel i procent med en decimal, svensk form. Aldrig avrundad till heltal
 *  när nämnaren är stor: 31,6 och 32,4 blir annars samma tal. */
export function percent(part: number, whole: number): string {
  if (!whole) return '–';
  return ((part / whole) * 100).toFixed(1).replace('.', ',');
}

/** Samma tal som `percent` ger, men som number för sortering och jämförelse. */
function share(part: number, whole: number): number {
  return whole ? (part / whole) * 100 : 0;
}

/** En redan uträknad procentandel i samma form som `percent` skriver den. */
export function formatShare(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

// ---------------------------------------------------------------------------
// Kontrolltakten över tid
// ---------------------------------------------------------------------------

/**
 * Första året som får ritas.
 *
 * Beståndet innehåller tre kontroller från 2017, alla i Linköping. Ett år som
 * vilar på tre besök är inte ett år i en tidsserie, det är en svans från när
 * kommunens system började föras. Det skulle dessutom bli seriens lägsta punkt
 * i varje kommun och därmed styra hela skalan.
 */
export const FIRST_YEAR = 2018;

/**
 * Sista året som är slut.
 *
 * Läses ur klockan och inte ur datan. Hämtningen kan halka efter, men det är
 * ändå kalendern som avgör vilket år som är färdigt, och ett år som pågår
 * ritar alltid en brant nedgång i seriens sista steg.
 */
export function lastCompleteYear(): number {
  return new Date().getUTCFullYear() - 1;
}

export interface YearPoint {
  year: number;
  /**
   * Kontroller det året, eller null när kommunen inte har någon uppgift alls
   * för året.
   *
   * Skillnaden är hela poängen med fältet. Uppsala, Jönköping, Karlstad och
   * Borgholm har ingenting före 2024, eftersom källan inte lämnar ut äldre
   * kontroller. Att rita det som noll vore att påstå att kommunen inte
   * kontrollerade någonting 2018, vilket är fel och dessutom en nedgång som
   * aldrig har hänt. Null ritas som en lucka i linjen; en riktig nolla mitt i
   * en serie, som Oskarshamn 2020, ritas som en nolla.
   */
  count: number | null;
  /** Andel av årets kontroller som gav minst en anmärkning, eller null. */
  remarkShare: number | null;
}

const yearCache = new Map<string, YearPoint[]>();

/**
 * Kontroller per år, för hela beståndet eller för en kommun.
 *
 * ## Varför det innevarande året klipps bort
 *
 * En tidsserie som slutar i ett år som pågår ritar alltid en brant nedgång i
 * sista steget, och den nedgången är en artefakt av kalendern. Serien slutar
 * därför på det senaste avslutade året. Gränsen läses ur klockan vid bygget
 * och inte ur datan: hämtningen kan halka efter, och det är ändå kalendern
 * som avgör vilket år som är färdigt.
 *
 * ## Varför tomma år före källans början blir null och inte noll
 *
 * Se YearPoint.count. Startpunkten är kommunens första år med en publicerad
 * kontroll; allt före det är null.
 */
export function inspectionsPerYear(slug?: string): YearPoint[] {
  const key = slug ?? '*';
  const cached = yearCache.get(key);
  if (cached) return cached;

  const total = new Map<number, { n: number; r: number }>();

  for (const e of establishments()) {
    if (slug && e.municipality.slug !== slug) continue;
    for (const i of e.inspections) {
      const year = Number(i.date.slice(0, 4));
      const bucket = total.get(year) ?? { n: 0, r: 0 };
      bucket.n += 1;
      if (i.assessment > 0) bucket.r += 1;
      total.set(year, bucket);
    }
  }

  const lastComplete = lastCompleteYear();
  const years = [...total.keys()].filter((y) => y >= FIRST_YEAR && y <= lastComplete);
  if (!years.length) return [];

  const first = Math.min(...years);

  const points: YearPoint[] = [];
  for (let y = FIRST_YEAR; y <= lastComplete; y += 1) {
    if (y < first) {
      points.push({ year: y, count: null, remarkShare: null });
      continue;
    }
    const bucket = total.get(y) ?? { n: 0, r: 0 };
    points.push({
      year: y,
      count: bucket.n,
      remarkShare: bucket.n ? share(bucket.r, bucket.n) : null,
    });
  }

  yearCache.set(key, points);
  return points;
}

// ---------------------------------------------------------------------------
// Rapport: vad anmärkningarna gäller
// ---------------------------------------------------------------------------

export interface AreaTally {
  /** Bokstaven i rapporteringspunkten, till exempel "J". */
  letter: string;
  name: string;
  explanation: string;
  count: number;
  /** Andel av samtliga kodade avvikelser, i procent. */
  share: number;
}

export interface AreaSource {
  slug: string;
  city: string;
  /** Kodade avvikelser kommunen bidrar med. */
  count: number;
  /** Kontroller i kommunen med minst en kodad avvikelse. */
  inspections: number;
  /** Andelen av kommunens kodade avvikelser som ligger i hygienområdet J. */
  hygieneShare: number;
  /** Detsamma för livsmedelsinformation, område B. */
  informationShare: number;
}

export interface DeviationAreaReport {
  /** Avvikelser med en kod vi kan tolka. Rapportens nämnare. */
  coded: number;
  /** Avvikelser utan tolkbar kod. De räknas inte in någonstans. */
  uncoded: number;
  /** Kontroller som bidrar med minst en kodad avvikelse. */
  inspections: number;
  /** Områdena i fallande ordning, tomma utelämnade. */
  areas: AreaTally[];
  /** Kommunerna som publicerar koden, i bokstavsordning. */
  sources: AreaSource[];
  /** Hur många kommuner i beståndet som inte publicerar någon kod alls. */
  withoutCodes: number;
  /** Kommuner totalt i beståndet. */
  municipalities: number;
}

let areaReportCache: DeviationAreaReport | null = null;

/**
 * Avvikelserna sorterade på Livsmedelsverkets lagstiftningsområden.
 *
 * ## Varför bara bokstaven, inte hela koden
 *
 * Linköping och Örebro publicerar hela rapporteringspunkten ("J03"), Stockholm
 * bara bokstaven ("J"). Räknade vi på hela punkten skulle Stockholms 16 312
 * avvikelser falla ur helt, och rapporten skulle handla om Linköping. Bokstaven
 * är den enda upplösning alla fyra källorna delar, och därför den enda nivå där
 * talen betyder samma sak.
 *
 * ## Vad som räknas
 *
 * En AVVIKELSE, inte en verksamhet och inte en kontroll. En kontroll som fick
 * tre anmärkningar bidrar med tre rader. Det är den enda räkningen som svarar
 * på frågan "vad handlar anmärkningarna om", och den måste stå utskriven på
 * sidan eftersom talet annars läses som antal drabbade verksamheter.
 *
 * Statusarna "Åtgärdad" och "Avskriven" räknas inte som avvikelse, precis som
 * i resten av sajten (se REMARK_STATUSES i data.ts).
 */
export function deviationAreaReport(): DeviationAreaReport {
  if (areaReportCache) return areaReportCache;

  const counts = new Map<string, number>();
  const perMunicipality = new Map<
    string,
    { city: string; count: number; inspections: number; hygiene: number; information: number }
  >();

  let coded = 0;
  let uncoded = 0;
  let inspections = 0;

  for (const e of establishments()) {
    const slug = e.municipality.slug;

    for (const inspection of e.inspections) {
      let codedHere = 0;

      for (const area of inspection.areas) {
        if (area.status !== 'deviation' && area.status !== 'persisting') continue;

        const known = legislationArea(area.code);
        if (!known) {
          uncoded += 1;
          continue;
        }

        const letter = area.code.charAt(0).toUpperCase();
        coded += 1;
        codedHere += 1;
        counts.set(letter, (counts.get(letter) ?? 0) + 1);

        const bucket = perMunicipality.get(slug) ?? {
          city: e.municipality.city,
          count: 0,
          inspections: 0,
          hygiene: 0,
          information: 0,
        };
        bucket.count += 1;
        if (letter === 'J') bucket.hygiene += 1;
        else if (letter === 'B') bucket.information += 1;
        perMunicipality.set(slug, bucket);
      }

      if (codedHere > 0) {
        inspections += 1;
        const bucket = perMunicipality.get(slug);
        if (bucket) bucket.inspections += 1;
      }
    }
  }

  const areas: AreaTally[] = [];
  for (const [letter, count] of counts) {
    const known = legislationArea(letter);
    if (!known) continue;
    areas.push({
      letter,
      name: known.name,
      explanation: known.explanation,
      count,
      share: share(count, coded),
    });
  }
  areas.sort((a, b) => b.count - a.count || a.letter.localeCompare(b.letter));

  // Bokstavsordning, aldrig efter andel. En tabell sorterad på andelen läses
  // som en rangordning av kommuner, och metodiken säger uttryckligen att en
  // sådan rangordning inte går att göra rättvist (se /metodik/#jamfor).
  const sources: AreaSource[] = [...perMunicipality.entries()]
    .map(([slug, b]) => ({
      slug,
      city: b.city,
      count: b.count,
      inspections: b.inspections,
      hygieneShare: share(b.hygiene, b.count),
      informationShare: share(b.information, b.count),
    }))
    .sort((a, b) => a.city.localeCompare(b.city, 'sv'));

  const total = municipalities().length;

  areaReportCache = {
    coded,
    uncoded,
    inspections,
    areas,
    sources,
    withoutCodes: total - sources.length,
    municipalities: total,
  };
  return areaReportCache;
}

// ---------------------------------------------------------------------------
// Rapport: tre sorters kontroll
// ---------------------------------------------------------------------------

export type InspectionType = Inspection['type'];

export interface TypeTally {
  type: InspectionType;
  label: string;
  /** Vad kontrolltypen betyder, i klarspråk. */
  meaning: string;
  total: number;
  withRemark: number;
  /** Andel av kontrolltypens kontroller som fick anmärkning, i procent. */
  share: number;
}

export interface TypeSource {
  slug: string;
  city: string;
  planned: number;
  plannedShare: number;
  followUps: number;
  followUpShare: number;
  /** Är återbesöken mindre ofta med anmärkning än de planerade kontrollerna? */
  followUpLower: boolean;
}

export interface InspectionTypeReport {
  /** Samtliga kontroller i beståndet. */
  total: number;
  types: TypeTally[];
  /** Kommuner med tillräckligt många återbesök för en jämförelse. */
  comparable: TypeSource[];
  /** Av dem: hur många där återbesöken oftare är rena. */
  followUpLower: number;
  /** Kommuner utan en enda kontroll märkt som återbesök. */
  withoutFollowUps: number;
  /**
   * Kommuner som inte anger kontrolltyp alls.
   *
   * Räknas via sourceLimits() och inte via frånvaron av återbesök här, för det
   * är två olika påståenden: en kommun kan ha noll återbesök i beståndet och
   * ändå ange typen på de kontroller den gör. Bara sourceLimits vet skillnaden.
   */
  withoutTypes: number;
  /** Kommuner med återbesök, men för få för att jämförelsen ska betyda något. */
  belowThreshold: number;
  municipalities: number;
}

/**
 * Minsta antal återbesök för att en kommun ska få vara med i jämförelsen.
 *
 * Svenljunga har ett (1) återbesök i beståndet, och det hade en anmärkning.
 * Utan golv står kommunen på 100,0 procent i tabellen, vilket är ett sant tal
 * och ett meningslöst tal på samma gång. Femtio är lågt nog att bara utesluta
 * det uppenbart obrukbara och högt nog att ett enskilt utfall inte flyttar
 * andelen mer än två procentenheter.
 */
export const MIN_FOLLOW_UPS = 50;

const TYPE_MEANING: Record<InspectionType, string> = {
  0: 'Kommunen kommer enligt sin egen kontrollplan. Verksamheten vet ofta inte om det i förväg.',
  1: 'Kommunen kommer tillbaka för att se om en tidigare påpekad brist är åtgärdad.',
  2: 'Kommunen kommer för att något inträffat: en anmälan, ett klagomål eller en misstänkt matförgiftning.',
};

const TYPE_LABEL: Record<InspectionType, string> = {
  0: 'Planerad kontroll',
  1: 'Återbesök',
  2: 'Händelsestyrd kontroll',
};

let typeReportCache: InspectionTypeReport | null = null;

/**
 * Andelen kontroller med anmärkning, per kontrolltyp.
 *
 * Räknat på kommunens EGEN bedömning av kontrollen (`assessment`), inte på vår
 * modell. Frågan rapporten ställer är vad kommunen fann, och då ska kommunens
 * eget svar användas. Vår modell väger in historik och skulle blanda in något
 * annat än det som mäts.
 *
 * En kommun som inte anger kontrolltyp får allt räknat som planerad kontroll,
 * eftersom 0 är fältets defaultvärde. Kommunerna utan en enda typad kontroll
 * räknas därför separat och utelämnas ur jämförelsen: att låtsas att de bara
 * gör planerade kontroller vore att hitta på.
 */
export function inspectionTypeReport(): InspectionTypeReport {
  if (typeReportCache) return typeReportCache;

  const totals = new Map<InspectionType, { total: number; withRemark: number }>();
  const perMunicipality = new Map<
    string,
    {
      city: string;
      planned: number;
      plannedRemarks: number;
      followUps: number;
      followUpRemarks: number;
    }
  >();

  let total = 0;

  for (const e of establishments()) {
    const slug = e.municipality.slug;
    const bucket = perMunicipality.get(slug) ?? {
      city: e.municipality.city,
      planned: 0,
      plannedRemarks: 0,
      followUps: 0,
      followUpRemarks: 0,
    };

    for (const inspection of e.inspections) {
      total += 1;
      const remark = inspection.assessment > 0;

      const tally = totals.get(inspection.type) ?? { total: 0, withRemark: 0 };
      tally.total += 1;
      if (remark) tally.withRemark += 1;
      totals.set(inspection.type, tally);

      if (inspection.type === 0) {
        bucket.planned += 1;
        if (remark) bucket.plannedRemarks += 1;
      } else if (inspection.type === 1) {
        bucket.followUps += 1;
        if (remark) bucket.followUpRemarks += 1;
      }
    }

    perMunicipality.set(slug, bucket);
  }

  const types: TypeTally[] = ([0, 1, 2] as InspectionType[])
    .map((type) => {
      const tally = totals.get(type) ?? { total: 0, withRemark: 0 };
      return {
        type,
        label: TYPE_LABEL[type],
        meaning: TYPE_MEANING[type],
        total: tally.total,
        withRemark: tally.withRemark,
        share: share(tally.withRemark, tally.total),
      };
    })
    .filter((t) => t.total > 0);

  const comparable: TypeSource[] = [...perMunicipality.entries()]
    .filter(([, b]) => b.followUps >= MIN_FOLLOW_UPS && b.planned > 0)
    .map(([slug, b]) => {
      const plannedShare = share(b.plannedRemarks, b.planned);
      const followUpShare = share(b.followUpRemarks, b.followUps);
      return {
        slug,
        city: b.city,
        planned: b.planned,
        plannedShare,
        followUps: b.followUps,
        followUpShare,
        followUpLower: followUpShare < plannedShare,
      };
    })
    // Bokstavsordning. Se samma resonemang i deviationAreaReport.
    .sort((a, b) => a.city.localeCompare(b.city, 'sv'));

  let withoutFollowUps = 0;
  let belowThreshold = 0;
  for (const b of perMunicipality.values()) {
    if (b.followUps === 0) withoutFollowUps += 1;
    else if (b.followUps < MIN_FOLLOW_UPS) belowThreshold += 1;
  }

  let withoutTypes = 0;
  for (const m of municipalities()) if (sourceLimits(m.slug).noInspectionType) withoutTypes += 1;

  typeReportCache = {
    total,
    types,
    comparable,
    followUpLower: comparable.filter((m) => m.followUpLower).length,
    withoutFollowUps,
    withoutTypes,
    belowThreshold,
    municipalities: perMunicipality.size,
  };
  return typeReportCache;
}

// ---------------------------------------------------------------------------
// Rapport: kontrollresultaten över tid
// ---------------------------------------------------------------------------

/**
 * Minsta antal planerade kontroller ett enskilt år för att en kommun ska
 * räknas som närvarande i panelen.
 *
 * Panelen finns för att svara på den enda invändning som annars sänker hela
 * serien: andelen kan ha fallit för att beståndet bytt sammansättning, inte
 * för att utfallet ändrats. Fyra kommuner kommer in först 2024 och nio av tolv
 * har ingenting alls från seriens första år.
 *
 * Golvet måste vara ett antal och inte bara "minst en kontroll". Kristinehamn
 * har tre kontroller 2018 och sju 2019, alltså en kommun som formellt finns
 * varje år och vars årsandel kan hoppa trettio procentenheter på ett enda
 * besök. En sådan rad gör panelen brusigare än serien den ska kontrollera.
 * Hundra är lågt nog att bara utesluta det som är statistiskt obrukbart.
 */
export const MIN_PANEL_YEAR = 100;

export interface TrendYear {
  year: number;
  /** Planerade kontroller det året. */
  total: number;
  withRemark: number;
  /** Andel av årets planerade kontroller som gav minst en anmärkning. */
  share: number;
}

export interface TrendCategory {
  id: TopCategoryId;
  name: string;
  /** Kort form för uppräkningar i löptext. Se ChainCategoryRow.short. */
  short: string;
  firstTotal: number;
  firstShare: number;
  lastTotal: number;
  lastShare: number;
  /** Sista årets andel minus första årets, i procentenheter. */
  change: number;
}

export interface TrendReport {
  first: number;
  last: number;
  /** Hela beståndet, ett värde per år i perioden. */
  years: TrendYear[];
  /** Samma serie, räknad enbart på panelkommunerna. */
  panel: TrendYear[];
  /** Panelkommunernas städer, i bokstavsordning. */
  panelCities: string[];
  /** Panelens andel av periodens planerade kontroller, i procent. */
  panelShare: number;
  /** Kommuner utan en enda planerad kontroll seriens första år. */
  absentFirstYear: number;
  municipalities: number;
  /** Sista årets andel minus första årets, hela beståndet. */
  change: number;
  panelChange: number;
  /** Året med högst respektive lägst andel, hela beståndet. */
  highest: TrendYear;
  lowest: TrendYear;
  /** Kategorierna i panelen, första året mot det sista. */
  categories: TrendCategory[];
  /** Planerade kontroller i hela perioden. */
  total: number;
}

interface YearTally {
  n: number;
  r: number;
}

function emptyTally(): YearTally {
  return { n: 0, r: 0 };
}

function bump(map: Map<string, YearTally>, key: string, remark: boolean): void {
  const bucket = map.get(key) ?? emptyTally();
  bucket.n += 1;
  if (remark) bucket.r += 1;
  map.set(key, bucket);
}

let trendCache: TrendReport | null = null;

/**
 * Andelen planerade kontroller med anmärkning, år för år.
 *
 * ## Varför bara planerade kontroller
 *
 * Blandningen mellan kontrollslagen ändras från år till år: i panelen var 9,8
 * procent av kontrollerna återbesök 2018 och 26,2 procent 2023. Återbesöket
 * har ett annat utfall än den planerade kontrollen (se rapporten om de tre
 * kontrollslagen), så en serie över samtliga kontroller mäter hur kommunerna
 * lagt upp arbetet lika mycket som vad de fann. Den planerade kontrollen är
 * det enda kontrollslag som görs av samma skäl varje år.
 *
 * En kommun som inte anger kontrolltyp får allt räknat som planerad kontroll,
 * eftersom 0 är fältets grundvärde. Det gäller tre kommuner med tillsammans
 * knappt en procent av kontrollerna, och de ligger utanför panelen.
 *
 * ## Varför kategorierna räknas i panelen och inte i hela beståndet
 *
 * Kategorijämförelsen ställer första året mot det sista, och det är just den
 * jämförelsen som blir meningslös om nämnaren bytt kommuner däremellan.
 */
export function trendReport(): TrendReport {
  if (trendCache) return trendCache;

  const first = FIRST_YEAR;
  const last = lastCompleteYear();
  const years: number[] = [];
  for (let y = first; y <= last; y += 1) years.push(y);

  const perCity = new Map<
    string,
    { city: string; years: Map<string, YearTally>; cats: Map<string, YearTally> }
  >();

  for (const e of establishments()) {
    const slug = e.municipality.slug;
    let city = perCity.get(slug);
    if (!city) {
      city = { city: e.municipality.city, years: new Map(), cats: new Map() };
      perCity.set(slug, city);
    }

    const category = categoriesOf(e).category;

    for (const i of e.inspections) {
      if (i.type !== 0) continue;
      const year = Number(i.date.slice(0, 4));
      if (year < first || year > last) continue;
      const remark = i.assessment > 0;
      bump(city.years, String(year), remark);
      if (category) bump(city.cats, `${category}|${year}`, remark);
    }
  }

  const panelSlugs = [...perCity.entries()]
    .filter(([, c]) => years.every((y) => (c.years.get(String(y))?.n ?? 0) >= MIN_PANEL_YEAR))
    .map(([slug]) => slug);

  const series = (slugs: string[] | null): TrendYear[] =>
    years.map((year) => {
      let n = 0;
      let r = 0;
      for (const [slug, c] of perCity) {
        if (slugs && !slugs.includes(slug)) continue;
        const bucket = c.years.get(String(year));
        if (!bucket) continue;
        n += bucket.n;
        r += bucket.r;
      }
      return { year, total: n, withRemark: r, share: share(r, n) };
    });

  const all = series(null);
  const panel = series(panelSlugs);

  const total = all.reduce((sum, y) => sum + y.total, 0);
  const panelTotal = panel.reduce((sum, y) => sum + y.total, 0);

  const categories: TrendCategory[] = [];
  for (const c of TOP_CATEGORIES) {
    let firstN = 0;
    let firstR = 0;
    let lastN = 0;
    let lastR = 0;
    for (const slug of panelSlugs) {
      const city = perCity.get(slug);
      if (!city) continue;
      const a = city.cats.get(`${c.id}|${first}`);
      const b = city.cats.get(`${c.id}|${last}`);
      if (a) {
        firstN += a.n;
        firstR += a.r;
      }
      if (b) {
        lastN += b.n;
        lastR += b.r;
      }
    }
    // Samma golv som panelen: en kategori som vilar på en handfull kontroller
    // det ena året kan inte bära en jämförelse mellan två år.
    if (firstN < MIN_PANEL_YEAR || lastN < MIN_PANEL_YEAR) continue;
    const firstShare = share(firstR, firstN);
    const lastShare = share(lastR, lastN);
    categories.push({
      id: c.id,
      name: c.name,
      short: c.short,
      firstTotal: firstN,
      firstShare,
      lastTotal: lastN,
      lastShare,
      change: lastShare - firstShare,
    });
  }
  // Visningsordning, aldrig efter utfall: kategorierna är ingen rangordning.
  categories.sort(
    (a, b) =>
      TOP_CATEGORIES.findIndex((c) => c.id === a.id) -
      TOP_CATEGORIES.findIndex((c) => c.id === b.id),
  );

  let absentFirstYear = 0;
  for (const c of perCity.values()) {
    if ((c.years.get(String(first))?.n ?? 0) === 0) absentFirstYear += 1;
  }

  const withData = all.filter((y) => y.total > 0);
  const highest = withData.reduce((a, b) => (b.share > a.share ? b : a), withData[0]);
  const lowest = withData.reduce((a, b) => (b.share < a.share ? b : a), withData[0]);

  trendCache = {
    first,
    last,
    years: all,
    panel,
    panelCities: panelSlugs
      .map((slug) => perCity.get(slug)!.city)
      .sort((a, b) => a.localeCompare(b, 'sv')),
    panelShare: share(panelTotal, total),
    absentFirstYear,
    municipalities: perCity.size,
    change: all[all.length - 1].share - all[0].share,
    panelChange: panel[panel.length - 1].share - panel[0].share,
    highest,
    lowest,
    categories,
    total,
  };
  return trendCache;
}

// ---------------------------------------------------------------------------
// Rapport: kedja eller fristående
// ---------------------------------------------------------------------------

/**
 * Minsta antal kedjekontroller för att en kommun eller en kategori ska få
 * stå i jämförelsen.
 *
 * Sex av tolv kommuner har färre än tjugofem kedjekontroller i beståndet, och
 * en andel räknad på dem säger ingenting om kedjor. Samma golv används på
 * kategorierna, vilket stryker skolor och omsorg: tre kontroller i hela
 * beståndet gäller ett kedjeställe i den kategorin, och skolkök drivs inte
 * i kedja.
 */
export const MIN_CHAIN_INSPECTIONS = 100;

export interface ChainSplit {
  chainTotal: number;
  chainRemarks: number;
  chainShare: number;
  soloTotal: number;
  soloRemarks: number;
  soloShare: number;
  /** Kedjornas andel minus de fristående, i procentenheter. */
  gap: number;
}

export interface ChainCategoryRow extends ChainSplit {
  id: TopCategoryId;
  name: string;
  /**
   * Kort form för uppräkningar i löptext. "caféer och bagerier och butiker"
   * är obegripligt; short ger "caféer och butiker". Se TOP_CATEGORIES.
   */
  short: string;
  /**
   * Har kategorin nog många kedjekontroller för att jämförelsen ska betyda
   * något? Raderna under golvet ligger kvar i listan i stället för att
   * försvinna, eftersom det är just frånvaron av kedjor i skolor och omsorg
   * som förklarar varför totalen ser ut som den gör.
   */
  comparable: boolean;
}

export interface ChainCityRow extends ChainSplit {
  slug: string;
  city: string;
}

export interface ChainSplitReport {
  /** Kedjor i registret som har minst ett ställe i beståndet. */
  chains: number;
  chainPlaces: number;
  soloPlaces: number;
  places: number;
  total: ChainSplit;
  /** Samtliga kategorier i visningsordning, jämförbara och inte. */
  categories: ChainCategoryRow[];
  cities: ChainCityRow[];
  /** Kommuner som föll bort på golvet. */
  belowFloor: number;
  /** Kommuner i jämförelsen där kedjorna ligger lägre. */
  chainLower: number;
  municipalities: number;
}

interface SplitTally {
  chainTotal: number;
  chainRemarks: number;
  soloTotal: number;
  soloRemarks: number;
}

function emptySplit(): SplitTally {
  return { chainTotal: 0, chainRemarks: 0, soloTotal: 0, soloRemarks: 0 };
}

function finishSplit(t: SplitTally): ChainSplit {
  const chainShare = share(t.chainRemarks, t.chainTotal);
  const soloShare = share(t.soloRemarks, t.soloTotal);
  return {
    chainTotal: t.chainTotal,
    chainRemarks: t.chainRemarks,
    chainShare,
    soloTotal: t.soloTotal,
    soloRemarks: t.soloRemarks,
    soloShare,
    gap: chainShare - soloShare,
  };
}

let chainSplitCache: ChainSplitReport | null = null;

/**
 * Andelen kontroller med anmärkning hos kedjeställen och fristående.
 *
 * ## Vad "kedja" betyder här
 *
 * Att namnet matchar en post i kedjeregistret (lib/kedjeregister.ts). Det är
 * ett register och inte en härledning, av skäl som står utskrivna i
 * lib/kedjor.ts: de vanligaste namnprefixen i beståndet är "forskolan",
 * "restaurang" och "cafe", och ingen av dem är en kedja.
 *
 * Räkningen använder registret direkt och inte kedjesidornas kvalitetsgrind.
 * Grinden finns för att en kedja med fem ställen inte bär en egen sida, vilket
 * är ett publiceringsbeslut. Ett ställe som tillhör en kedja gör det oavsett
 * om kedjan har en sida.
 *
 * ## Varför totalen inte får stå ensam
 *
 * De två grupperna innehåller olika saker. Skolköken, som är det skötsammaste
 * beståndet, är i praktiken helt fristående, och de drar ner de fristående i
 * totalen. Kategorierna nedan är därför inte en fördjupning utan hela svaret:
 * det är där samma sorts verksamhet ställs mot samma sorts verksamhet.
 */
export function chainSplitReport(): ChainSplitReport {
  if (chainSplitCache) return chainSplitCache;

  const total = emptySplit();
  const perCity = new Map<string, { city: string; split: SplitTally }>();
  const perCategory = new Map<TopCategoryId, SplitTally>();
  const seenChains = new Set<string>();

  let chainPlaces = 0;
  let soloPlaces = 0;

  for (const e of establishments()) {
    const id = chainIdFor(e.name);
    if (id) {
      chainPlaces += 1;
      seenChains.add(id);
    } else {
      soloPlaces += 1;
    }

    const slug = e.municipality.slug;
    let city = perCity.get(slug);
    if (!city) {
      city = { city: e.municipality.city, split: emptySplit() };
      perCity.set(slug, city);
    }

    const category = categoriesOf(e).category;
    let cat: SplitTally | undefined;
    if (category) {
      cat = perCategory.get(category);
      if (!cat) {
        cat = emptySplit();
        perCategory.set(category, cat);
      }
    }

    for (const i of e.inspections) {
      const remark = i.assessment > 0;
      for (const bucket of [total, city.split, cat]) {
        if (!bucket) continue;
        if (id) {
          bucket.chainTotal += 1;
          if (remark) bucket.chainRemarks += 1;
        } else {
          bucket.soloTotal += 1;
          if (remark) bucket.soloRemarks += 1;
        }
      }
    }
  }

  const categories: ChainCategoryRow[] = [];
  for (const c of TOP_CATEGORIES) {
    const tally = perCategory.get(c.id);
    if (!tally) continue;
    categories.push({
      id: c.id,
      name: c.name,
      short: c.short,
      comparable: tally.chainTotal >= MIN_CHAIN_INSPECTIONS,
      ...finishSplit(tally),
    });
  }

  // Bokstavsordning, aldrig efter utfall. Se samma resonemang i
  // deviationAreaReport: en tabell sorterad på andelen läses som en
  // rangordning av kommuner.
  const cities: ChainCityRow[] = [...perCity.entries()]
    .filter(([, c]) => c.split.chainTotal >= MIN_CHAIN_INSPECTIONS)
    .map(([slug, c]) => ({ slug, city: c.city, ...finishSplit(c.split) }))
    .sort((a, b) => a.city.localeCompare(b.city, 'sv'));

  chainSplitCache = {
    chains: seenChains.size,
    chainPlaces,
    soloPlaces,
    places: chainPlaces + soloPlaces,
    total: finishSplit(total),
    categories,
    cities,
    belowFloor: perCity.size - cities.length,
    chainLower: cities.filter((c) => c.gap < 0).length,
    municipalities: perCity.size,
  };
  return chainSplitCache;
}

// ---------------------------------------------------------------------------
// Rapport: anmärkningarna över året
// ---------------------------------------------------------------------------

/**
 * Kort form till diagrammets axel, gemener.
 *
 * Samma skrivsätt som artikeln om kylkedjan redan använder på en tidslinje
 * över tolv månader. Två månadsaxlar på samma sajt får inte se ut som två
 * olika sajter.
 */
const MONTH_LABEL = [
  'jan', 'feb', 'mar', 'apr', 'maj', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
];

/** Full form till löptext, gemener som svensk sats kräver. */
const MONTH_NAME = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
];

/**
 * Minsta antal granskade punkter i toppmånaden för att ett lagstiftningsområde
 * ska få stå i jämförelsen.
 *
 * De fem största områdena klarar det. Resten ligger på under tjugo punkter i
 * toppmånaden, alltså på en nivå där en enda avvikelse flyttar andelen med
 * fem procentenheter.
 */
export const MIN_AREA_CHECKS = 100;

export interface MonthPoint {
  /** 1 till 12. */
  month: number;
  /** "Jul". */
  label: string;
  /** "juli". */
  name: string;
  total: number;
  withRemark: number;
  share: number;
}

export interface SeasonArea {
  letter: string;
  name: string;
  explanation: string;
  /** Granskade punkter i toppmånaden, alltså nämnaren. */
  peakChecks: number;
  peakShare: number;
  restChecks: number;
  restShare: number;
  /** Toppmånadens andel minus resten av årets, i procentenheter. */
  gap: number;
}

export interface SeasonReport {
  first: number;
  last: number;
  months: MonthPoint[];
  /** Månaden med högst respektive lägst andel med anmärkning. */
  peak: MonthPoint;
  quiet: MonthPoint;
  /** Månaden med flest respektive färst kontroller. */
  busiest: MonthPoint;
  thinnest: MonthPoint;
  /** Planerade kontroller i perioden, och andelen av dem med anmärkning. */
  total: number;
  share: number;
  /** Områdena, störst först, med både täljare och nämnare. */
  areas: SeasonArea[];
  /** Städerna som redovisar även godkända punkter, i bokstavsordning. */
  areaCities: string[];
  /** Granskade punkter i underlaget för områdesuppdelningen. */
  areaChecks: number;
  /** Områden där toppmånaden ligger högre respektive lägre. */
  higher: number;
  lower: number;
}

let seasonCache: SeasonReport | null = null;

/**
 * Andelen planerade kontroller med anmärkning, månad för månad.
 *
 * ## Varför bara hela år
 *
 * Serien pratar om månader och inte om år, så varje månad måste vila på lika
 * många år. Tas det pågående året med får månaderna fram till hämtningen ett
 * år extra i nämnaren, och kurvan skulle då rita kalendern i stället för
 * säsongen. Samma skäl som i inspectionsPerYear, av samma sort.
 *
 * ## Varför bara planerade kontroller
 *
 * Se trendReport. Återbesöket följer på en tidigare kontroll och ligger därför
 * i en annan månad än den kontroll som utlöste det, vilket i sig flyttar
 * anmärkningar mellan månaderna.
 *
 * ## Varför områdesuppdelningen bara får två kommuner
 *
 * Den frågar hur stor ANDEL av de granskade punkterna i ett område som föll,
 * och behöver alltså en nämnare: hur många punkter i området som tittades på.
 * Bara de kommuner som redovisar även de godkända punkterna har en sådan.
 * Övriga publicerar enbart avvikelserna, och ur dem går det att räkna hur
 * anmärkningarna fördelar sig men inte hur ofta en punkt föll. Vilka kommuner
 * det är räknas fram ur datan och står inte i kod.
 */
export function seasonReport(): SeasonReport {
  if (seasonCache) return seasonCache;

  const first = FIRST_YEAR;
  const last = lastCompleteYear();
  const inRange = (date: string) => {
    const year = Number(date.slice(0, 4));
    return year >= first && year <= last;
  };

  const perMonth = new Map<number, YearTally>();
  /** Kommuner som redovisar även de punkter som var utan avvikelse. */
  const withDenominator = new Map<string, string>();

  for (const e of establishments()) {
    for (const i of e.inspections) {
      if (!withDenominator.has(e.municipality.slug)) {
        for (const a of i.areas) {
          if (a.status === 'ok') {
            withDenominator.set(e.municipality.slug, e.municipality.city);
            break;
          }
        }
      }
      if (i.type !== 0 || !inRange(i.date)) continue;
      const month = Number(i.date.slice(5, 7));
      const bucket = perMonth.get(month) ?? emptyTally();
      bucket.n += 1;
      if (i.assessment > 0) bucket.r += 1;
      perMonth.set(month, bucket);
    }
  }

  const months: MonthPoint[] = [];
  for (let m = 1; m <= 12; m += 1) {
    const bucket = perMonth.get(m) ?? emptyTally();
    months.push({
      month: m,
      label: MONTH_LABEL[m - 1],
      name: MONTH_NAME[m - 1],
      total: bucket.n,
      withRemark: bucket.r,
      share: share(bucket.r, bucket.n),
    });
  }

  const measured = months.filter((m) => m.total > 0);
  const peak = measured.reduce((a, b) => (b.share > a.share ? b : a), measured[0]);
  const quiet = measured.reduce((a, b) => (b.share < a.share ? b : a), measured[0]);
  const busiest = measured.reduce((a, b) => (b.total > a.total ? b : a), measured[0]);
  const thinnest = measured.reduce((a, b) => (b.total < a.total ? b : a), measured[0]);

  // Områdesuppdelningen: toppmånaden mot resten av året, per bokstav i
  // rapporteringspunkten. Se huvudkommentaren om nämnaren.
  const perArea = new Map<
    string,
    { peakN: number; peakR: number; restN: number; restR: number }
  >();
  let areaChecks = 0;

  for (const e of establishments()) {
    if (!withDenominator.has(e.municipality.slug)) continue;
    for (const i of e.inspections) {
      if (!inRange(i.date)) continue;
      const month = Number(i.date.slice(5, 7));
      for (const a of i.areas) {
        const letter = (a.code || '').charAt(0).toUpperCase();
        if (!legislationArea(letter)) continue;
        const bucket = perArea.get(letter) ?? { peakN: 0, peakR: 0, restN: 0, restR: 0 };
        const failed = a.status === 'deviation' || a.status === 'persisting';
        if (month === peak.month) {
          bucket.peakN += 1;
          if (failed) bucket.peakR += 1;
        } else {
          bucket.restN += 1;
          if (failed) bucket.restR += 1;
        }
        perArea.set(letter, bucket);
        areaChecks += 1;
      }
    }
  }

  const areas: SeasonArea[] = [];
  for (const [letter, bucket] of perArea) {
    if (bucket.peakN < MIN_AREA_CHECKS) continue;
    const known = legislationArea(letter);
    if (!known) continue;
    const peakShare = share(bucket.peakR, bucket.peakN);
    const restShare = share(bucket.restR, bucket.restN);
    areas.push({
      letter,
      name: known.name,
      explanation: known.explanation,
      peakChecks: bucket.peakN,
      peakShare,
      restChecks: bucket.restN,
      restShare,
      gap: peakShare - restShare,
    });
  }
  // Störst underlag först. Ordningen är en storleksordning och ingen
  // rangordning av utfall.
  areas.sort((a, b) => b.peakChecks + b.restChecks - (a.peakChecks + a.restChecks));

  const total = months.reduce((sum, m) => sum + m.total, 0);
  const remarks = months.reduce((sum, m) => sum + m.withRemark, 0);

  seasonCache = {
    first,
    last,
    months,
    peak,
    quiet,
    busiest,
    thinnest,
    total,
    share: share(remarks, total),
    areas,
    areaCities: [...withDenominator.values()].sort((a, b) => a.localeCompare(b, 'sv')),
    areaChecks,
    higher: areas.filter((a) => a.gap > 0).length,
    lower: areas.filter((a) => a.gap < 0).length,
  };
  return seasonCache;
}
