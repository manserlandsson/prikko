/**
 * Kedjor: samma varumärke över kommungränserna.
 *
 * Det här är sajtens enda yta som inte är organiserad efter kommun, och det är
 * hela poängen med den. Kommunernas egna tjänster kan per konstruktion inte
 * visa en kedja. Stockholms e-tjänst listar 33 Espresso House i Stockholm och
 * inte en enda i Uppsala; den som undrar hur kedjan sköter sig får fråga tolv
 * kommuner var för sig, i tolv gränssnitt, varav de flesta saknar adresser man
 * kan länka till. Vi har alla tolv i samma tabell.
 *
 * ## Varför identifieringen är ett register och inte en härledning
 *
 * Frestelsen är att räkna fram kedjorna: ta de vanligaste namnprefixen i
 * beståndet och kalla dem kedjor. Det prövades på hela beståndet, och det
 * fungerar inte. De vanligaste prefixen är "forskolan" (815), "restaurang"
 * (373), "cafe" (224), "the" (123), "pizzeria" (122), "la", "lilla", "gamla"
 * och "nya". Ett steg ner ligger "taste" med elva träffar (Taste of Ceylon,
 * Taste of Africa, Taste of Lahore), "asian" med elva och "falafel" med tio.
 * Ingen av dem är en kedja, och en sida som påstår att "Taste" är en
 * restaurangkedja med elva ställen är inte ett skönhetsfel utan ett sakfel med
 * egen URL och plats i sitemapen.
 *
 * Ett register vänder på beviskravet. Varje kedja finns för att någon skrivit
 * in den, och varje mönster går att läsa, ifrågasätta och rätta på ett ställe.
 * Medlemskapet är däremot räknat: VILKA ställen som hör till kedjan och HUR
 * MÅNGA de är kommer alltid ur beståndet, aldrig ur registret. Registret säger
 * vad som är en kedja, datan säger vilka och hur många.
 *
 * Registret bor i `kedjeregister.ts`, som saknar importer just för att
 * `scripts/kedjegranskning.mjs` ska kunna skriva ut varje kedjas träffar utan
 * att bygga sajten. Ett register som bara går att granska genom att bygga
 * kommer inte att granskas.
 *
 * ## Varför inte organisationsnummer
 *
 * Organisationsnummer vore en starkare signal än namnet, och kolumnen finns i
 * `pipeline/schema.sql`. Tre skäl gör den oanvändbar i dag, och de är av tre
 * olika slag:
 *
 * 1. Den är tom. Ingen kod i pipelinen skriver `establishments.
 *    organization_number`, och fältet finns inte i exporten till `src/data`.
 *    Det enda organisationsnummer sajten faktiskt har är det en ägare själv
 *    skriver in vid anspråk, i `community.establishment_claims`.
 * 2. Schemat varnar för fältet i sig: för enskild firma ÄR numret ägarens
 *    personnummer. Att gruppera publika sidor på det fältet vore att publicera
 *    en sammanställning av personuppgifter.
 * 3. Det löser ändå inte problemet. Franchise driver varje lokal i eget bolag,
 *    så tio McDonald's i samma stad har tio olika organisationsnummer. Numret
 *    hittar koncernägda kedjor och missar franchisekedjor, alltså precis de
 *    kedjor läsaren undrar över.
 *
 * Ett ifyllt organisationsnummer vore ändå värt att lägga till SOM KOMPLEMENT,
 * som en kontroll av att namnmatchningen inte drar in fel ställe. Uppdelningen
 * mellan register och sammanräkning är gjord så att det kan ske utan att
 * sidorna ändras.
 *
 * ## Vad en kedjesida får och inte får säga
 *
 * Kommunerna publicerar olika mycket. Andelen kvarstående brister varierar
 * mellan 0,3 procent i Jönköping och 23,7 i Oskarshamn, och den skillnaden
 * speglar publiceringspraxis, inte hygien. Därför:
 *
 * - Kedjesidan visar ANTAL, aldrig ett rikssnitt i procent som huvudtal. Ett
 *   sådant tal hade vägt ihop tolv olika publiceringspraxis till en siffra som
 *   ser jämförbar ut och inte är det.
 * - Där en andel ändå bär mening jämförs kedjan mot SIN EGEN KOMMUNS bestånd.
 *   Täljare och nämnare kommer då från samma utgivare och jämförelsen är
 *   giltig. `ChainMunicipality.baseline` är det talet.
 * - Kommunraderna sorteras på ANTAL STÄLLEN, aldrig på utfall. En kedjesida
 *   får inte bli en rangordning av kommuner i förklädnad.
 * - Enskilda verksamheter får däremot rangordnas, och gör det: `remarks` och
 *   `spotless` är kedjans två ändar.
 */
import {
  establishments,
  latestInspectionDate,
  municipalitySummary,
  type Establishment,
  type Municipality,
} from './data';
import { REGISTER, chainIdFor } from './kedjeregister';

/**
 * Minsta antal ställen för att kedjan ska få en sida.
 *
 * Sex är valt för att fem ställen ryms i en enda kommun, och då är kommunens
 * kategorisida en bättre sida än vår. Vid sex och uppåt börjar det bli en
 * fråga ingen annan yta i Sverige kan svara på.
 */
export const MIN_LOCATIONS = 6;

/**
 * Minsta antal BEDÖMDA ställen.
 *
 * En kedja där ingen fått en kontroll som går att bedöma är en lista med
 * adresser, inte ett svar. Kravet är av samma sort som `MIN_CATEGORY_PAGE` i
 * data.ts: sidan ska bära faktisk information eller inte finnas.
 */
export const MIN_ASSESSED = 3;

// ---------------------------------------------------------------------------
// Sammanräkning
// ---------------------------------------------------------------------------

export interface ChainCounts {
  total: number;
  clean: number;
  minor: number;
  major: number;
  /** Utan bedömning. De är inte rena, de är okända, och slås aldrig ihop med `clean`. */
  unassessed: number;
  /** clean + minor + major. */
  assessed: number;
}

export interface ChainMunicipality extends ChainCounts {
  municipality: Municipality;
  /** Kedjans ställen i kommunen, i bokstavsordning. */
  items: Establishment[];
  /**
   * Kommunens egen andel utan anmärkning bland bedömda, i procent.
   *
   * Referenslinjen som gör kedjans siffra i just den kommunen läsbar. Talet
   * går att jämföra mot eftersom det kommer från samma utgivare som kedjans
   * egna rader i den kommunen. Ett rikssnitt hade inte gjort det.
   */
  baseline: number;
  /** Hur många bedömda verksamheter referenslinjen bygger på. */
  baselineAssessed: number;
}

export interface Chain extends ChainCounts {
  id: string;
  name: string;
  /** Kommuner där kedjan finns, flest ställen först. Aldrig sorterat på utfall. */
  municipalities: ChainMunicipality[];
  /**
   * Ställen med anmärkning vid senaste kontrollen. Kvarstående brister först,
   * därefter senast kontrollerade först.
   */
  remarks: Establishment[];
  /** Ställen utan anmärkning vid de tre senaste kontrollerna. */
  spotless: Establishment[];
  /** Kedjans senaste kontroll, oavsett kommun. */
  latest: string | null;
}

function emptyCounts(): ChainCounts {
  return { total: 0, clean: 0, minor: 0, major: 0, unassessed: 0, assessed: 0 };
}

function tally(counts: ChainCounts, e: Establishment): void {
  counts.total += 1;
  if (e.verdict === 'clean') counts.clean += 1;
  else if (e.verdict === 'minor') counts.minor += 1;
  else if (e.verdict === 'major') counts.major += 1;
  else counts.unassessed += 1;
  counts.assessed = counts.clean + counts.minor + counts.major;
}

/**
 * Alla verksamheter per kedja, ett svep över beståndet.
 *
 * Minnet finns av samma skäl som `listCache` i db.ts: sökningen, webbkartan
 * och varje verksamhetssida frågar efter kedjor, och 15 916 namn ska inte
 * normaliseras om per anrop.
 */
let roster: Map<string, Establishment[]> | null = null;

function buildRoster(): Map<string, Establishment[]> {
  if (roster) return roster;

  const ids = new Set(REGISTER.map((c) => c.id));
  if (ids.size !== REGISTER.length) {
    throw new Error(
      'Två kedjor i REGISTER (lib/kedjeregister.ts) delar id. Id:t är en publicerad URL ' +
        'och måste vara unikt.',
    );
  }

  const found = new Map<string, Establishment[]>();
  for (const e of establishments()) {
    const id = chainIdFor(e.name);
    if (!id) continue;
    const list = found.get(id);
    if (list) list.push(e);
    else found.set(id, [e]);
  }

  /*
   * Bygggrind: en kedja i registret som inte matchar ett enda namn är alltid
   * ett fel.
   *
   * Antingen är mönstret felstavat mot hur kommunerna faktiskt skriver namnet
   * ("McDonald's" med apostrof ger noll träffar, eftersom ingen kommun
   * registrerar dem så), eller så har kedjan lämnat beståndet, och då ska
   * raden bort. Båda fallen ska stanna bygget i stället för att bli en kedja
   * som tyst slutar finnas. Samma sorts grind som `assertKnown` i
   * categories.ts.
   */
  const missing = REGISTER.filter((c) => !found.has(c.id)).map((c) => c.name);
  if (missing.length > 0) {
    throw new Error(
      `${missing.length} kedjor i REGISTER (lib/kedjeregister.ts) matchar inget namn i ` +
        `beståndet: ${missing.join(', ')}. Antingen stämmer mönstret inte med hur kommunerna ` +
        'skriver namnet, eller så finns kedjan inte längre och raden ska tas bort. ' +
        'Kör scripts/kedjegranskning.mjs för att se vad registret faktiskt fångar.',
    );
  }

  roster = found;
  return roster;
}

const built = new Map<string, Chain | null>();

/**
 * En kedja, färdigräknad. `null` när kedjan inte finns i registret eller inte
 * klarar kvalitetsgrinden.
 */
export function chain(id: string): Chain | null {
  const cached = built.get(id);
  if (cached !== undefined) return cached;

  const entry = REGISTER.find((c) => c.id === id);
  const members = entry ? (buildRoster().get(entry.id) ?? []) : [];

  if (!entry || members.length < MIN_LOCATIONS) {
    built.set(id, null);
    return null;
  }

  const counts = emptyCounts();
  const perMunicipality = new Map<string, Establishment[]>();
  let latest: string | null = null;

  for (const e of members) {
    tally(counts, e);

    const list = perMunicipality.get(e.municipality.slug);
    if (list) list.push(e);
    else perMunicipality.set(e.municipality.slug, [e]);

    const date = latestInspectionDate(e);
    if (date && (latest === null || date > latest)) latest = date;
  }

  if (counts.assessed < MIN_ASSESSED) {
    built.set(id, null);
    return null;
  }

  const municipalities: ChainMunicipality[] = [];
  for (const [, items] of perMunicipality) {
    const own = emptyCounts();
    for (const e of items) tally(own, e);

    const summary = municipalitySummary(items[0].municipality.slug);
    municipalities.push({
      ...own,
      municipality: items[0].municipality,
      items: [...items].sort((a, b) => a.name.localeCompare(b.name, 'sv')),
      baseline: summary.cleanShare,
      baselineAssessed: summary.assessed,
    });
  }

  // Storleksordning, aldrig utfall. Se filhuvudet.
  municipalities.sort(
    (a, b) => b.total - a.total || a.municipality.city.localeCompare(b.municipality.city, 'sv'),
  );

  const SEVERITY: Record<'major' | 'minor', number> = { major: 0, minor: 1 };
  const byDate = (a: Establishment, b: Establishment) => {
    const dateA = latestInspectionDate(a) ?? '';
    const dateB = latestInspectionDate(b) ?? '';
    return dateB.localeCompare(dateA) || a.name.localeCompare(b.name, 'sv');
  };

  const remarks = members
    .filter((e): e is Establishment & { verdict: 'major' | 'minor' } =>
      e.verdict === 'major' || e.verdict === 'minor',
    )
    .sort((a, b) => SEVERITY[a.verdict] - SEVERITY[b.verdict] || byDate(a, b));

  const spotless = members.filter((e) => e.distinction).sort(byDate);

  const result: Chain = {
    ...counts,
    id: entry.id,
    name: entry.name,
    municipalities,
    remarks,
    spotless,
    latest,
  };

  built.set(id, result);
  return result;
}

/** Alla kedjor som klarar kvalitetsgrinden, i bokstavsordning. */
export function chains(): Chain[] {
  buildRoster();
  return REGISTER.map((c) => chain(c.id))
    .filter((c): c is Chain => c !== null)
    .sort((a, b) => a.name.localeCompare(b.name, 'sv'));
}

/**
 * Kedjan en verksamhet hör till, men bara när kedjan har en sida att länka
 * till.
 *
 * Verksamhetssidan använder den och ska aldrig länka till en sida som inte
 * byggs. Att gå via `chain()` i stället för att slå upp id:t direkt är hela
 * garantin för det: kvalitetsgrinden sitter på ett ställe.
 */
export function chainFor(e: Establishment): Chain | null {
  const id = chainIdFor(e.name);
  return id ? chain(id) : null;
}

/**
 * Kedjor i registret som INTE fick en sida, med sitt antal.
 *
 * Bara för granskningsskriptet. En kedja under gränsen ska inte synas för
 * någon besökare, men den som underhåller registret behöver se att den ligger
 * på fem och snart tippar över.
 */
export function belowBar(): Array<{ name: string; total: number }> {
  const found = buildRoster();
  return REGISTER.filter((c) => chain(c.id) === null)
    .map((c) => ({ name: c.name, total: found.get(c.id)?.length ?? 0 }))
    .sort((a, b) => b.total - a.total);
}
