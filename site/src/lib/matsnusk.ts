/**
 * Matsnusklistan: verksamheter där brister i livsmedelshanteringen kvarstår.
 *
 * ## Vad listan är
 *
 * Spegelbilden av utmärkelsen. Utmärkelsen samlar dem som klarat tre
 * kontroller i rad utan anmärkning; den här listan samlar dem där bristerna
 * inte var en engångsnotering. Varje rad är ett referat av kommunens egna
 * kontrollrader, aldrig ett omdöme från oss.
 *
 * "Kom tillbaka och konstaterade att de inte var åtgärdade" stod här fram
 * till 2026-09-05 och beskrev bara en av de tre grunder `ground` nedan
 * skiljer på. Av Stockholms 64 rader vilar 51 på upprepning, alltså utan
 * något återbesök. Raderna har alltid skrivit ut rätt grund var för sig; det
 * var sammanfattningarna ovanför dem som drog alla tre över en kam.
 *
 * Namnet Matsnusk är ägarens beslut (2026-08-05), samma ord som SVT använder
 * om sina granskningar. Ordet är LISTANS namn och står i rubrik och adress.
 * Det står aldrig i en mening om en namngiven verksamhet; där är texten
 * fortfarande referat av kommunens konstateranden.
 *
 * ## Varför listan är per kommun och aldrig nationell
 *
 * Andelen kvarstående brister spänner från 0,3 procent i Jönköping till
 * 23,7 procent i Oskarshamn, och den skillnaden speglar hur kommunerna
 * arbetar och publicerar, inte hur rent det är i köken. En rikslista hade
 * därför blivit en lista över restauranger i de kommuner som redovisar mest.
 * Inom en kommun har alla mätts av samma inspektörer med samma praxis; där är
 * jämförelsen ärlig. Samma skäl som gör att sajten aldrig rangordnar kommuner.
 *
 * ## Varför listan är levande och inte en fryst utgåva
 *
 * Utmärkelsen fryses i årsutgåvor, och det är rätt för den: ett erkännande
 * som består skadar ingen. En fryst lista över brister vore motsatsen: en
 * verksamhet som åtgärdat allt hade stått kvar med anklagelsen tills nästa
 * utgåva. Listan räknas därför om vid varje datauppdatering, och en rad
 * försvinner så snart en ny kontroll visar att bristerna är åtgärdade.
 *
 * ## De fyra kraven för en rad
 *
 * 1. KVARSTOD. Bedömningen är "Brister som kvarstår" (verdict major), alltså
 *    att kommunens egen bedömning på senaste kontrollen är den allvarligaste,
 *    att avvikelsen överlevt ett återbesök, eller att avvikelser fanns även
 *    vid kontrollen före. Inte "Brister".
 * 2. KONSUMENTNÄRA, BEVISAT. Minst en avvikelse vid senaste kontrollen ligger
 *    i ett lagstiftningsområde som rör livsmedlen eller hanteringen av dem,
 *    enligt Livsmedelsverkets egen indelning. Rent administrativa avvikelser
 *    kvalificerar aldrig, som en saknad registrering eller en lucka i
 *    journalföringen, och OBEVISAT räknas som administrativt: en kontroll utan
 *    redovisade kontrollpunkter, eller en rad vars område inte går att
 *    avgöra, ger ingen rad. Observera att bevisbördan är OMVÄND mot
 *    grading.py: där får okänt aldrig MILDRA en bedömning, här får okänt
 *    aldrig SÄTTA någon på listan. Båda reglerna skyddar samma part.
 * 3. FÄRSKT. Kontrollen är högst MATSNUSK_WINDOW_DAYS gammal, räknat mot
 *    datauttagets datum. Se motiveringen vid konstanten.
 * 4. ÖVER GRINDEN. Kommunen får sidan bara med minst MIN_MATSNUSK_PAGE rader
 *    (bibeln §6, samma tal och skäl som MIN_CATEGORY_PAGE och MIN_OWN_PAGE).
 *
 * ## Varför raderna inte numreras
 *
 * En rangordning inom listan vore vårt eget omdöme: att fyra avvikelser är
 * "värre" än två går inte att härleda ur datan, eftersom kommunerna redovisar
 * olika många rader per kontroll. Raderna sorteras på kontrolldatum, nyast
 * först, det enda tal som betyder samma sak för varje rad.
 */
import {
  establishments,
  isRemark,
  municipalities,
  sourceFor,
  type ControlArea,
  type Establishment,
  type Inspection,
  type Municipality,
} from './data';

/**
 * Rent administrativa lagstiftningsområden, per bokstaven i Livsmedelsverkets
 * rapporteringspunkt. SPEGLAR ADMINISTRATIVE_AREAS i pipeline/prikko/grading.py
 * (modellversion 4) och måste ändras i takt med den. Se grading.py för varför
 * just de här sex, och varför B, C och K uttryckligen INTE ingår.
 */
export const ADMINISTRATIVE_AREAS = new Set(['A', 'D', 'E', 'F', 'H', 'M']);

/**
 * Områdesnamn -> bokstav, för källor som inte lämnar någon kod. SPEGLAR
 * AREA_LETTER_BY_NAME i pipeline/prikko/grading.py och måste ändras i takt
 * med den. Nyckeln är gemener.
 */
const AREA_LETTER_BY_NAME: Record<string, string> = {
  'administrativa krav': 'A',
  'administration': 'A',
  'allmän livsmedelsinformation': 'B',
  'information om livsmedel': 'B',
  'livsmedelsinformation': 'B',
  'märkning': 'B',
  'särskild märkning och information': 'C',
  'specialinformation': 'C',
  'skyddade beteckningar': 'D',
  'handelsnormer': 'E',
  'varustandarder': 'F',
  'livsmedel för särskilda grupper': 'G',
  'spårbarhet': 'H',
  'särskilda ingredienser och processhjälpmedel': 'I',
  'grundförutsättningar, hygien': 'J',
  'hygien': 'J',
  'haccp-baserade förfaranden': 'K',
  'riskhantering': 'K',
  'faroanalys': 'K',
  'handel inom eu, import och export': 'M',
  'internationell handel': 'M',
  'dricksvattenanläggningar': 'N',
  'övrigt': 'O',
  'operativa mål': 'P',
  'kontaktmaterial': 'Q',
  'kontaktmaterial - tillverkning, förädling och distribution': 'Q',
};

/** Lagstiftningsområdets bokstav, eller null när den inte går att avgöra. */
export function areaLetter(area: ControlArea): string | null {
  const code = area.code.trim();
  if (code && /[a-z]/i.test(code[0])) return code[0].toUpperCase();
  for (const name of [area.group, area.description]) {
    const letter = AREA_LETTER_BY_NAME[name.trim().toLowerCase()];
    if (letter) return letter;
  }
  return null;
}

/**
 * Är avvikelsen BEVISAT konsumentnära?
 *
 * Kräver ett känt lagstiftningsområde utanför de administrativa. En rad vars
 * område inte går att avgöra svarar falskt; se punkt 2 i modulhuvudet om den
 * omvända bevisbördan.
 */
export function isConsumerRemark(area: ControlArea): boolean {
  const letter = areaLetter(area);
  return letter !== null && !ADMINISTRATIVE_AREAS.has(letter);
}

/**
 * Hur gammal senaste kontrollen får vara, räknat mot datauttagets datum.
 *
 * Ett år, för det är ett ordinarie kontrollintervall: medianen mellan två
 * kontroller i beståndet är 267 dagar (se HISTORY_GAP_DAYS i data.ts). Inom
 * fönstret är fyndet alltså högst en kontrollcykel gammalt. Utanför har
 * verksamheten i normalfallet hunnit få en ny kontroll. Att den inte syns
 * hos oss säger då mer om kommunens publicering än om köket, och en lista
 * som pekar ut namngivna verksamheter får inte vila på det. Bedömningens
 * eget femårsfönster (grading.py) gäller fortfarande på verksamhetssidan;
 * matsnusklistan ställer ett hårdare krav för att den ställer ut raderna
 * bredvid varandra.
 */
export const MATSNUSK_WINDOW_DAYS = 365;

/**
 * Minsta antal rader för att kommunen ska få en matsnusksida.
 *
 * Samma tal och samma skäl som MIN_CATEGORY_PAGE i data.ts och MIN_OWN_PAGE i
 * utmarkelser.ts: en sida med en handfull rader bär ingen information som
 * inte redan står på anmärkningssidan, och tunna sidor drar ner domänen
 * (bibeln §6). Under gränsen finns ingen sida alls, och raderna samlas INTE på
 * någon riksvy, se modulhuvudet.
 */
export const MIN_MATSNUSK_PAGE = 25;

export interface MatsnuskRow {
  establishment: Establishment;
  /** Senaste kontrollen, den som bär bedömningen. */
  inspection: Inspection;
  /** Samtliga avvikelser vid kontrollen, i källans ordning. */
  remarks: ControlArea[];
  /** De bevisat konsumentnära av dem. Alltid minst en. */
  consumer: ControlArea[];
  /**
   * Varför bedömningen är "Brister som kvarstår", som referat av kommunens
   * egen data. Exakt ett av tre:
   *
   *  - 'stated'   Kommunens egen bedömning på kontrollen är den allvarligaste
   *               (Sambruk-tvåan). Kommunens ord, ingen härledning.
   *  - 'followup' Kontrollen är ett återbesök och fann ändå avvikelser.
   *  - 'repeat'   Avvikelser fanns även vid föregående kontroll.
   *
   * Ordningen är styrkeordning och speglar _is_persisting i grading.py:
   * kommunens egen tvåa går före våra härledda tecken, och återbesöket är
   * det starkare av de två tecknen.
   */
  ground: 'stated' | 'followup' | 'repeat';
  /** Föregående kontroll, bara satt när ground är 'repeat'. */
  previous: Inspection | null;
}

const rowsCache = new Map<string, MatsnuskRow[]>();

/**
 * Kommunens matsnuskrader, nyast först.
 *
 * Färskheten mäts mot kommunens `fetchedAt`, inte mot byggets klocka. Datat
 * ändras bara när pipelinen kört, så samma datafiler ska ge samma sidor
 * oavsett när bygget råkar köras. Annars kan en ombyggnad utan ny data tyst
 * ändra vilka verksamheter som pekas ut.
 */
export function matsnuskRows(slug: string): MatsnuskRow[] {
  const cached = rowsCache.get(slug);
  if (cached) return cached;

  const fetchedAt = sourceFor(slug)?.fetchedAt ?? '';
  const cutoff = isoDaysBefore(fetchedAt.slice(0, 10), MATSNUSK_WINDOW_DAYS);

  const rows: MatsnuskRow[] = [];
  for (const e of establishments(slug)) {
    if (e.verdict !== 'major') continue;

    /*
     * Verksamheter som upphört står inte med. Källorna har inget eget fält
     * för det; kommunerna skriver i stället om NAMNET i registret ("Alana
     * butik Upphörd 2026"), och mönstret är belagt i Örebro, Stockholm och
     * Uppsala. En lista som lovar färskhet får inte peka ut ett kök som
     * kommunens egen data säger inte längre finns. Verksamhetssidan finns
     * kvar med hela historiken; det är listan raden lämnar, inte sajten.
     */
    if (/\bupphörd\b/i.test(e.name)) continue;

    const inspection = e.inspections[0];
    if (!inspection || inspection.date < cutoff) continue;

    const remarks = inspection.areas.filter(isRemark);
    const consumer = remarks.filter(isConsumerRemark);
    if (consumer.length === 0) continue;

    const previous = e.inspections[1] ?? null;
    const ground: MatsnuskRow['ground'] =
      inspection.assessment === 2
        ? 'stated'
        : inspection.type === 1
          ? 'followup'
          : 'repeat';

    // 'repeat' är ett påstående om föregående kontroll. Kan det inte beläggas
    // i datan får raden inte stå med, hur bedömningen än räknats fram.
    // Referatet vore annars en mening vi inte kan visa upp källan till.
    if (ground === 'repeat' && (!previous || previous.assessment === 0)) continue;

    rows.push({
      establishment: e,
      inspection,
      remarks,
      consumer,
      ground,
      // Föregående kontroll hör bara till påståendet när påståendet ÄR att
      // avvikelserna upprepats från den.
      previous: ground === 'repeat' ? previous : null,
    });
  }

  rows.sort(
    (a, b) =>
      b.inspection.date.localeCompare(a.inspection.date) ||
      a.establishment.slug.localeCompare(b.establishment.slug, 'sv'),
  );

  rowsCache.set(slug, rows);
  return rows;
}

/** Har kommunen en matsnusksida? Grinden, på ett ställe. */
export function hasMatsnuskPage(slug: string): boolean {
  return matsnuskRows(slug).length >= MIN_MATSNUSK_PAGE;
}

const memberIndexes = new Map<string, Map<string, MatsnuskRow>>();

/**
 * Verksamhetens egen rad, eller null. Driver märket på verksamhetssidan.
 *
 * Märket följer RADENS kriterier, inte sidgrinden: kraven är lokala för
 * verksamheten och lika bevisade i en liten kommun som i en stor. Grinden
 * MIN_MATSNUSK_PAGE avgör bara om det finns en lista att länka till, och det
 * valet gör komponenten. Precis som raden är märket levande: det försvinner
 * vid första datauppdatering där kriterierna inte längre är uppfyllda.
 */
export function matsnuskFor(e: Establishment): MatsnuskRow | null {
  const slug = e.municipality.slug;
  let index = memberIndexes.get(slug);
  if (!index) {
    index = new Map(matsnuskRows(slug).map((r) => [r.establishment.slug, r]));
    memberIndexes.set(slug, index);
  }
  return index.get(e.slug) ?? null;
}

/** Kommunerna som klarar grinden, i bokstavsordning. */
export function matsnuskMunicipalities(): Municipality[] {
  return municipalities().filter((m) => hasMatsnuskPage(m.slug));
}

/** ISO-datumet `days` dagar före `iso`. */
function isoDaysBefore(iso: string, days: number): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '9999-12-31'; // trasigt fetchedAt -> tom lista, aldrig en gissad.
  return new Date(t - days * 86_400_000).toISOString().slice(0, 10);
}
