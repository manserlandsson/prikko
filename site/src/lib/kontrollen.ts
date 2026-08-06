/**
 * Hur kommunen bedriver sin livsmedelskontroll.
 *
 * Två källor, båda med full täckning över landets kommuner: Livsmedelsverkets
 * myndighetsrapportering och Kolada. Pipelinen hämtar dem och skriver en fil,
 * sajten läser den vid bygget. Se pipeline/fetch_kommunkallor.py.
 *
 * ---------------------------------------------------------------------------
 * VAD TALEN ÄR TILL FÖR
 * ---------------------------------------------------------------------------
 * Att förklara varför kommunernas tal skiljer sig, inte att rangordna dem.
 *
 * Metodiksidan har hittills fått skriva ut att andelen verksamheter med
 * kvarstående brister spänner från 0,3 procent i en kommun till 23,7 i en
 * annan, och sedan be läsaren att inte läsa det som en ranking, utan att
 * kunna erbjuda något att läsa det som i stället. Kontrollfrekvensen och
 * antalet anläggningar per årsarbetskraft är det som saknades.
 *
 * ---------------------------------------------------------------------------
 * DEN BINDANDE GRÄNSEN
 * ---------------------------------------------------------------------------
 * Kommuner rangordnas aldrig. Ingen sorterad tabell, ingen topplista, ingen
 * kartfärgning per kommun på ett nyckeltal. En kommuns tal visas på den
 * kommunens egen sida, och det enda jämförelsetalet är medianen för riket som
 * referenslinje.
 *
 * Regeln är byggd in i datan och inte bara i den här modulen: filen bär bara
 * de kommuner vi publicerar, plus en median räknad över landets samtliga
 * kontrollmyndigheter. Alla 290 kommuners tal finns aldrig samlade hos oss,
 * och därför finns det ingenting att sortera.
 *
 * Och riktningen ges aldrig. 65 procent kontrollerade kan betyda god tillsyn,
 * eller ett register fullt av anläggningar som upphört utan att avregistreras,
 * eller en riskklassning som styr om resurser. Vi ger nämnaren, inte omdömet.
 */
import file from '../data/riket/kontrollen.json';

interface Row {
  authority: string;
  facilities: number | null;
  shareControlled: number | null;
  planned: number | null;
  followUp: number | null;
  eventDriven: number | null;
  controls: number | null;
  shareFollowUp: number | null;
  fte: number | null;
  facilitiesPerFte: number | null;
  population: number | null;
  residentsPerFacility: number | null;
  /** SKR:s Insiktsmätning. Null när kommunen fått för få svar. */
  rating: number | null;
  /**
   * Sysselsatta inom hotell och restaurang per 10 000 invånare, ur SCB.
   *
   * Branschens storlek i kommunen, mätt på arbetsställets belägenhet. Den
   * hör inte till kontrollen och visas därför inte i kontrollrutan, utan i
   * Tathet.astro bredvid vårt eget antal serveringsställen.
   */
  hotelAndRestaurantJobsPer10k: number | null;
}

interface Dataset {
  fetchedAt: string;
  report: {
    year: number;
    series: string;
    title: string;
    url: string;
    publisher: string;
    /** Hur många kontrollmyndigheter medianen räknats över. */
    authorities: number;
  };
  kolada: {
    attribution: string;
    population: { kpi: string; title: string; year: number };
    rating: { kpi: string; title: string; year: number };
  };
  scb: {
    /** CC0 kräver ingen källhänvisning. SCB rekommenderar den här. */
    attribution: string;
    license: string;
    jobs: { table: string; title: string; industry: string; year: number };
  };
  median: {
    shareControlled: number | null;
    shareFollowUp: number | null;
    facilitiesPerFte: number | null;
    residentsPerFacility: number | null;
    rating: number | null;
    /** Riksmedian räknad över alla 290 kommuner, inte över våra tolv. */
    hotelAndRestaurantJobsPer10k: number | null;
  };
  municipalities: Record<string, Row>;
}

const data = file as unknown as Dataset;

export interface ControlFigure {
  /** Talet, färdigt att skriva ut utan enhet. */
  value: number;
  /** Enheten, tom sträng när talet inte har någon. */
  unit: string;
  /** Vad talet är, i löptext. Blir cellens etikett. */
  label: string;
  /** Medianen för riket, eller null när den inte går att räkna. */
  median: number | null;
}

export interface Kontrollen {
  /** Kontrollåret uppgifterna gäller, inte året rapporten kom ut. */
  year: number;
  figures: ControlFigure[];
  /**
   * Om företagens betyg finns för kommunen.
   *
   * SKR redovisar inte Insikt för en kommun med färre än tio svar, och
   * Oskarshamn är en sådan. Källraden får inte nämna en mätning som inte står
   * i rutan: en källhänvisning till något osynligt läser som att en uppgift
   * fallit bort.
   */
  hasRating: boolean;
  /** Året SKR:s mätning gäller. Behövs i källraden, som är en annan årgång. */
  ratingYear: number;
  report: Dataset['report'];
  kolada: Dataset['kolada'];
  fetchedAt: string;
}

/**
 * Minsta antal tal för att blocket ska ritas.
 *
 * Layoutregeln på sajten är att ingen etikett någonsin står tom. Ett block med
 * en ensam siffra kvar är inte ett block, det är en rest, och det ser ut som
 * att sajten är trasig snarare än som att uppgiften saknas. Under tröskeln
 * renderas ingenting, inte ens rubriken.
 */
const MIN_FIGURES = 4;

/**
 * De tre rikskällorna, för källsidan.
 *
 * Koladas villkor kräver attributionen "Källa: Kolada" för obearbetade
 * uppgifter. Den står i rutan på kommunsidan, där uppgiften visas, och här,
 * där sajtens källor redovisas samlat. SCB:s data är CC0 och kräver ingen
 * källhänvisning alls; vi skriver ändå ut den de rekommenderar.
 */
export function nationalSources() {
  return {
    report: data.report,
    kolada: data.kolada,
    scb: data.scb,
    fetchedAt: data.fetchedAt,
  };
}

/** Kommunens invånarantal, nämnaren i varje tal per invånare. Kolada. */
export function population(code: string): number | null {
  return data.municipalities[code]?.population ?? null;
}

/** Sysselsättningen i branschen, för Tathet.astro. Null när SCB saknar tal. */
export function branschen(code: string) {
  const row = data.municipalities[code];
  if (!row || row.hotelAndRestaurantJobsPer10k === null) return null;
  return {
    jobsPer10k: row.hotelAndRestaurantJobsPer10k,
    median: data.median.hotelAndRestaurantJobsPer10k,
    year: data.scb.jobs.year,
    industry: data.scb.jobs.industry,
    attribution: data.scb.attribution,
  };
}

const built = new Map<string, Kontrollen | null>();

/** Kommunens kontrolluppgifter, eller null när de inte räcker till ett block. */
export function kontrollen(code: string): Kontrollen | null {
  const cached = built.get(code);
  if (cached !== undefined) return cached;

  const row = data.municipalities[code];
  const result = row ? assemble(row) : null;
  built.set(code, result);
  return result;
}

function assemble(row: Row): Kontrollen | null {
  const { median, report, kolada } = data;

  /*
   * Ordningen är läsordningen och den är vald: först hur stort registret är,
   * sedan hur mycket av det som nås, sedan hur arbetet ser ut, och sist
   * företagens egen bedömning. Varje cell renderas bara när den har ett tal.
   */
  const candidates: (ControlFigure | null)[] = [
    figure(row.facilities, '', `livsmedelsanläggningar i kommunens register ${report.year}`, null),
    figure(
      row.residentsPerFacility,
      '',
      'invånare per anläggning',
      median.residentsPerFacility,
    ),
    figure(
      row.shareControlled,
      ' %',
      `av anläggningarna kontrollerades under ${report.year}`,
      median.shareControlled,
    ),
    figure(
      row.shareFollowUp,
      ' %',
      'av kontrollerna var uppföljande',
      median.shareFollowUp,
    ),
    figure(
      row.facilitiesPerFte,
      '',
      'anläggningar per årsarbetskraft',
      median.facilitiesPerFte,
    ),
    // Skalan står i etiketten och inte som enhet efter talet: enheten
    // upprepas på referensraden, och "riksmedian 80 av 100" är tre ord för
    // mycket i en cell som ska gå att läsa på en blick.
    figure(
      row.rating,
      '',
      'av 100 i företagens betyg på kontrollen',
      median.rating,
    ),
  ];

  const figures = candidates.filter((f): f is ControlFigure => f !== null);
  if (figures.length < MIN_FIGURES) return null;

  return {
    year: report.year,
    figures,
    hasRating: row.rating !== null,
    ratingYear: kolada.rating.year,
    report,
    kolada,
    fetchedAt: data.fetchedAt,
  };
}

function figure(
  value: number | null,
  unit: string,
  label: string,
  median: number | null,
): ControlFigure | null {
  return value === null ? null : { value, unit, label, median };
}
