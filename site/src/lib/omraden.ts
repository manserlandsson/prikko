/**
 * Områden: stadsdelen som utsnitt av kommunen.
 *
 * "Restauranger på Södermalm" är en sökning. "Restauranger i Stockholm" är en
 * annan, och den som söker den första blir inte hjälpt av den andra. Det är
 * hela skälet till att sidtypen finns, och det är samma skäl som gav
 * kategorisidorna sina egna URL:er: ett utsnitt som folk faktiskt frågar efter
 * ska ha en adress.
 *
 * ## Var gränserna kommer ifrån
 *
 * OpenStreetMap, och bara därifrån. Resonemanget i sin helhet står i
 * pipeline/omraden.py, som hämtar dem. Kortaste versionen: det är den enda
 * källan som ger både en riktig gräns och ett namn folk söker på. SCB:s RegSO
 * har gränserna men kallar Södermalm för sju olika församlingar, `district` i
 * databasen är tom i alla 15 921 rader, och kommunernas egna indelningar kostar
 * tolv integrationer.
 *
 * ## Ingen gräns, ingen sida
 *
 * OSM har namnen överallt men polygonerna bara i Stockholm. En punkt kan inte
 * säga var ett område slutar, och att rita en cirkel runt punkten och kalla den
 * Södermalm vore att publicera en gräns vi hittat på. Modulen läser därför bara
 * polygonfiler. Saknas filen för en kommun finns inga områdessidor där, och det
 * är rätt utfall: sidtypen växer av sig själv när OSM kartläggs vidare, utan
 * att någon rad här behöver ändras.
 *
 * Detsamma gäller koordinaterna. En verksamhet utan koordinat kan inte placeras
 * i ett område och räknas inte i något. Kommuner vars källa inte lämnar
 * koordinater får alltså inga områdessidor, vilket är samma svar som kartan ger
 * för samma kommuner.
 */
import {
  establishments,
  municipalities,
  municipalityListing,
  type Establishment,
  type SliceVerdicts,
} from './data';

/** En ring är en sluten lista av [longitud, latitud]. */
type Ring = number[][];

export interface Area {
  /** Områdets namn hos OSM, oredigerat. "Södermalm", "Gamla stan". */
  name: string;
  /** URL-segment, härlett ur namnet i pipelinen. */
  slug: string;
  /** OSM-objektet, för spårbarhet tillbaka till källan. */
  osm: string;
  /** Ytans storlek i kvadratgrader. Rangordnar bara, mäter aldrig. */
  size: number;
  outer: Ring[];
  inner: Ring[];
}

interface AreaFile {
  municipality: { code: string; slug: string };
  source: { name: string; licence: string; attribution: string; fetchedAt: string };
  areas: Area[];
}

/**
 * Minsta antal verksamheter för att ett område ska få en egen sida.
 *
 * Samma tal som MIN_CATEGORY_PAGE i data.ts, och av samma skäl. Ett område med
 * en handfull verksamheter är ett utsnitt av kommunhubbens första sida och
 * ingenting mer: det bär ingen egen information, och tunna sidor i tiotal drar
 * ner hela domänen vid Googles bedömning av skalat innehåll (bibeln §6).
 *
 * Området har visserligen något kategorisidan saknar, en karta och en
 * jämförelse mot resten av kommunen. Men det har också hårdare konkurrens:
 * hitta.se, Yelp och TripAdvisor har alla stadsdelssidor, och en sida med
 * tolv rader vinner ingen av de sökningarna. Gränsen får därför inte vara
 * lägre än kategorisidornas.
 *
 * Mätt i dagens bestånd faller den ut så här i Stockholm, som är enda kommunen
 * med polygoner:
 *
 *     tröskel 15    36 områden
 *     tröskel 25    30 områden
 *     tröskel 50    19 områden
 *
 * Skillnaden mellan 15 och 25 är sex områden som alla ligger mellan 19 och 24
 * verksamheter, alltså precis den storlek där en lista slutar vara en lista.
 */
export const MIN_AREA_PAGE = 25;

export interface AreaSlice extends SliceVerdicts {
  area: Area;
  /** Antal verksamheter som ligger i området. */
  count: number;
  /** Har området en egen sida? */
  linked: boolean;
}

const files = import.meta.glob<{ default: AreaFile }>('../data/omraden/*.json', {
  eager: true,
});

/**
 * Grinden mot en kontur som inte kan stämma.
 *
 * Två fel skulle annars passera tyst och bara visa sig som en sidtyp som
 * plötsligt inte finns: en polygon vars par är kastade om till [lat, lon], och
 * en ring som inte slutit sig. Båda ger noll träffar i punkt-i-polygon, alltså
 * noll områdessidor, alltså ingenting att lägga märke till förrän någon
 * undrar vart Södermalm tog vägen.
 *
 * Ytterhöljet är detsamma som looks_like_sweden() i pipeline/prikko/geo.py
 * använder, av samma skäl: en koordinat utanför landet är inte osäker, den är
 * fel, och bygget ska stanna i stället för att publicera den.
 */
function assertRings(slug: string, area: Area): void {
  for (const ring of [...area.outer, ...area.inner]) {
    if (ring.length < 4) {
      throw new Error(`${slug}/${area.slug}: en ring har färre än fyra punkter.`);
    }
    const [fx, fy] = ring[0];
    const [lx, ly] = ring[ring.length - 1];
    if (fx !== lx || fy !== ly) {
      throw new Error(
        `${slug}/${area.slug}: en ring sluter sig inte. Se rings_from_relation i ` +
          'pipeline/omraden.py.',
      );
    }
    for (const [lon, lat] of ring) {
      if (lon < 10 || lon > 25 || lat < 55 || lat > 70) {
        throw new Error(
          `${slug}/${area.slug}: punkten [${lon}, ${lat}] ligger utanför Sverige. ` +
            'Ordningen är [longitud, latitud]; är paren omkastade blir varje sida tom.',
        );
      }
    }
  }
}

const areaFiles = new Map<string, AreaFile>();
for (const module of Object.values(files)) {
  const file = module.default as unknown as AreaFile;
  if (file && file.municipality && Array.isArray(file.areas)) {
    for (const area of file.areas) assertRings(file.municipality.slug, area);
    areaFiles.set(file.municipality.slug, file);
  }
}

/** Attributionen som måste stå där en gräns visas. ODbL kräver den. */
export function areaSource(slug: string): AreaFile['source'] | undefined {
  return areaFiles.get(slug)?.source;
}

// ---------------------------------------------------------------------------
// Placeringen
// ---------------------------------------------------------------------------

interface Boxed extends Area {
  /** [väst, syd, öst, nord]. Grovgallret före punkt-i-polygon. */
  bbox: [number, number, number, number];
}

/**
 * Strålmetoden. Räknar hur många gånger en stråle österut korsar ringen; udda
 * antal betyder att punkten ligger innanför.
 */
function inRing(x: number, y: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function contains(a: Boxed, x: number, y: number): boolean {
  const [west, south, east, north] = a.bbox;
  if (x < west || x > east || y < south || y > north) return false;
  if (!a.outer.some((ring) => inRing(x, y, ring))) return false;
  return !a.inner.some((ring) => inRing(x, y, ring));
}

function boxed(area: Area): Boxed {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const ring of area.outer) {
    for (const [x, y] of ring) {
      if (x < west) west = x;
      if (x > east) east = x;
      if (y < south) south = y;
      if (y > north) north = y;
    }
  }
  return { ...area, bbox: [west, south, east, north] };
}

interface AreaIndex {
  slices: AreaSlice[];
  /** Medlemmar per områdesslug, i hubbens bokstavsordning. */
  members: Map<string, Establishment[]>;
  /** Områdets slug per verksamhets-id. Driver länken på verksamhetssidan. */
  byEstablishment: Map<string, string>;
  areas: Map<string, Area>;
}

const indexes = new Map<string, AreaIndex>();

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
 * Delas av alla kommuner utan gränsdata.
 *
 * `linkedAreaOf` anropas en gång per verksamhetssida, alltså närmare 16 000
 * gånger per bygge, och de flesta av dem gäller kommuner som inte har någon
 * fil. Utan ett delat tomt register byggdes fyra tomma Map per anrop till
 * ingen nytta. Samma anteckning finns i db.ts om listorna där.
 */
const EMPTY_INDEX: AreaIndex = {
  slices: [],
  members: new Map(),
  byEstablishment: new Map(),
  areas: new Map(),
};

function buildIndex(slug: string): AreaIndex {
  const file = areaFiles.get(slug);
  if (!file) {
    indexes.set(slug, EMPTY_INDEX);
    return EMPTY_INDEX;
  }

  const boxes = file.areas.map(boxed);
  const members = new Map<string, Establishment[]>();
  const byEstablishment = new Map<string, string>();

  /*
   * Bokstavsordning redan här, så att varje områdessida ärver hubbens ordning
   * utan att sortera om. Samma skäl som i categoryIndex: ordningen måste vara
   * oberoende av bedömningen, annars flyttar en enda ändrad kontroll rader
   * mellan sidor vid varje datauppdatering.
   */
  for (const e of municipalityListing(slug)) {
    if (e.lat === null || e.lng === null) continue;

    /*
     * Mest specifika området vinner när flera överlappar.
     *
     * Polygonerna är i praktiken en partition: av Stockholms 5 803 placerade
     * verksamheter ligger 5 690 i exakt en polygon och 113 i två. Regeln
     * behövs ändå, dels för att utfallet ska vara bestämt och inte bero på
     * filens ordning, dels för att en stadsdel inuti en annan ska räknas som
     * den inre.
     */
    let best: Boxed | null = null;
    for (const a of boxes) {
      if (!contains(a, e.lng, e.lat)) continue;
      if (best === null || a.size < best.size) best = a;
    }
    if (!best) continue;

    byEstablishment.set(e.id, best.slug);
    const bucket = members.get(best.slug);
    if (bucket) bucket.push(e);
    else members.set(best.slug, [e]);
  }

  const slices: AreaSlice[] = [];
  const areas = new Map<string, Area>();
  for (const area of file.areas) {
    areas.set(area.slug, area);
    const items = members.get(area.slug) ?? [];
    if (items.length === 0) continue;
    slices.push({
      area,
      count: items.length,
      linked: items.length >= MIN_AREA_PAGE,
      ...verdictCounts(items),
    });
  }

  // Bokstavsordning, inte storleksordning. En lista sorterad på antal läser
  // som en rangordning, och det är inte vad talet betyder: Södermalm har fler
  // verksamheter än Gamla stan därför att det är större, inte bättre.
  slices.sort((a, b) => a.area.name.localeCompare(b.area.name, 'sv'));

  const index: AreaIndex = { slices, members, byEstablishment, areas };
  indexes.set(slug, index);
  return index;
}

function index(slug: string): AreaIndex {
  const cached = indexes.get(slug);
  if (cached) return cached;
  return buildIndex(slug);
}

// ---------------------------------------------------------------------------
// Utåt
// ---------------------------------------------------------------------------

/** Kommunens områden som har minst en verksamhet, i bokstavsordning. */
export function municipalityAreas(slug: string): AreaSlice[] {
  return index(slug).slices;
}

/** Bara de som förtjänar en egen sida. */
export function linkedAreas(slug: string): AreaSlice[] {
  return index(slug).slices.filter((s) => s.linked);
}

/** Har kommunen några områdessidor alls? Driver avsnittet på kommunhubben. */
export function hasAreaPages(slug: string): boolean {
  return linkedAreas(slug).length > 0;
}

export function areaSlice(slug: string, areaSlug: string): AreaSlice | undefined {
  return index(slug).slices.find((s) => s.area.slug === areaSlug);
}

/**
 * Verksamheterna i ett område, i hubbens bokstavsordning.
 *
 * Listan är delad med registret och får varken sorteras eller muteras av
 * anroparen. Samma villkor som establishments() i db.ts.
 */
export function areaListing(slug: string, areaSlug: string): Establishment[] {
  return index(slug).members.get(areaSlug) ?? [];
}

/** Området en verksamhet ligger i, eller null. */
export function areaOf(e: Establishment): Area | null {
  const i = index(e.municipality.slug);
  const areaSlug = i.byEstablishment.get(e.id);
  if (!areaSlug) return null;
  return i.areas.get(areaSlug) ?? null;
}

/**
 * Detsamma, men bara när området har en egen sida.
 *
 * Verksamhetssidan får bara länka dit det finns något att komma till. Ett
 * område under MIN_AREA_PAGE har ingen URL, och namnet ensamt utan länk hade
 * bara varit ännu en etikett i adressraden.
 */
export function linkedAreaOf(e: Establishment): Area | null {
  const area = areaOf(e);
  if (!area) return null;
  const slice = areaSlice(e.municipality.slug, area.slug);
  return slice?.linked ? area : null;
}

/**
 * Områden intill, närmast först.
 *
 * Mätt mellan ytornas mittpunkter och inte på delad gräns. Delad gräns vore
 * det exakta svaret men kräver att två konturer jämförs kant mot kant, och
 * utfallet blir sämre än det låter: OSM:s stadsdelar möts inte alltid exakt,
 * så två grannar som ser ut att dela gräns kan ligga någon meter isär och
 * därmed räknas som icke-grannar. Mittpunktsavstånd har inte det problemet och
 * ger samma svar för de områden som faktiskt ligger intill varandra.
 *
 * Rubriken på sidan säger "Områden intill", inte "Grannområden", eftersom det
 * är vad talet bär.
 */
export function nearbyAreas(slug: string, areaSlug: string, limit = 6): AreaSlice[] {
  const here = index(slug).areas.get(areaSlug);
  if (!here) return [];

  const centre = centroid(here);
  return linkedAreas(slug)
    .filter((s) => s.area.slug !== areaSlug)
    .map((s) => {
      const c = centroid(s.area);
      // Longituden krymps med latitudens cosinus, annars väger en grad öst
      // dubbelt så tungt som en grad norr på Stockholms breddgrad.
      const dx = (c[0] - centre[0]) * Math.cos((centre[1] * Math.PI) / 180);
      const dy = c[1] - centre[1];
      return { slice: s, d: dx * dx + dy * dy };
    })
    .sort((a, b) => a.d - b.d || a.slice.area.name.localeCompare(b.slice.area.name, 'sv'))
    .slice(0, limit)
    .map((x) => x.slice);
}

/**
 * "på Södermalm" men "i Gamla stan".
 *
 * Svenskan har ingen regel för det här som täcker allt, men den har ett
 * mönster som täcker det mesta: malmar, holmar, öar och gärden tar `på`,
 * övriga ortnamn tar `i`. Stockholms innerstad, som är den yta sidtypen når
 * först, faller helt inom mönstret: på Södermalm, på Norrmalm, på Östermalm,
 * på Kungsholmen, på Djurgården, på Långholmen, i Gamla stan, i Vasastaden,
 * i Stadshagen.
 *
 * Mönstret har mjuka kanter, och de är kända. "Marieberg" och "Kristineberg"
 * sägs oftare med `på` än med `i` men slutar inte på något ändelsen fångar,
 * och `-holmen` ger "på Liljeholmen" där bruket vacklar. Det är en skavank i
 * språket och inte ett fel i en uppgift: namnet är alltid källans, och det är
 * bara bindeordet framför som är vårt.
 *
 * En handskriven tabell över undantagen vore möjlig men skulle behöva växa för
 * varje ny kommun och varje ny stadsdel i OSM, alltså ruttna tyst. Regeln
 * degraderar i stället till `i`, som är det neutrala valet.
 */
const PA_ANDELSER = ['malm', 'holmen', 'holme', 'holm', 'gården', 'garden', 'gärdet', 'ön', 'landet'];

export function areaPreposition(name: string): 'i' | 'på' {
  const lowered = name.toLowerCase();
  return PA_ANDELSER.some((slut) => lowered.endsWith(slut)) ? 'på' : 'i';
}

/** Ytans mittpunkt, som medelvärdet av den största ringens hörn. */
export function centroid(area: Area): [number, number] {
  let ring: Ring = area.outer[0] ?? [];
  for (const r of area.outer) if (r.length > ring.length) ring = r;
  let x = 0;
  let y = 0;
  for (const [lon, lat] of ring) {
    x += lon;
    y += lat;
  }
  return ring.length ? [x / ring.length, y / ring.length] : [0, 0];
}

/** [väst, syd, öst, nord] runt områdets kontur. */
export function areaBounds(area: Area): [number, number, number, number] {
  return boxed(area).bbox;
}

/** Alla kommuner som har minst en områdessida. Används av rutt och sitemap. */
export function municipalitiesWithAreas(): string[] {
  return municipalities()
    .map((m) => m.slug)
    .filter(hasAreaPages);
}

/**
 * Andel utan anmärkning bland de BEDÖMDA i kommunen, för jämförelseraden.
 *
 * Nämnaren är alltid bedömda och aldrig totalen, av exakt samma skäl som i
 * municipalitySummary: med totalen som nämnare ser en kommun som lämnar ut lite
 * data sämre ut än en som lämnar ut mycket.
 */
export function municipalityCleanShare(slug: string): { share: number; assessed: number } {
  const counts = verdictCounts(establishments(slug));
  return {
    share: counts.assessed ? Math.round((counts.clean / counts.assessed) * 100) : 0,
    assessed: counts.assessed,
  };
}
