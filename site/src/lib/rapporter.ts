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
  establishments,
  legislationArea,
  municipalities,
  sourceFor,
  sourceLimits,
  type Inspection,
} from './data';

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
