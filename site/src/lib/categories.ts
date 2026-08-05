/**
 * Kategoriindelning av verksamheter.
 *
 * Bygger på research/R7_kategorier.md. Fem toppkategorier räcker och täcker
 * allt: Restauranger, Caféer och bagerier, Butiker, Skolor och omsorg,
 * Övrigt. Modulen är ren: den känner till råvärden och vad de betyder, inte
 * var datan kommer ifrån. Allt som rör verksamheter och kommuner ligger i
 * data.ts.
 *
 * Tre saker styr allt annat här:
 *
 * 1. MAPPNINGEN ÄR EN TABELL, INTE EN HEURISTIK. Ingen strängmatchning, inga
 *    prefixregler, ingen fuzzy matching. Ett råvärde står i tabellen eller är
 *    okänt. Nya kommuner kommer med nya råvärden, och den dagen ska vi få veta
 *    det i stället för att tyst få en felaktig kategori.
 *
 * 2. OKÄNT ÄR INTE ÖVRIGT. Ett okänt råvärde ger ingen kategori alls. `null`
 *    betyder "vi vet inte", `ovrigt` betyder "vi vet, och det är en grossist".
 *    De två får aldrig blandas ihop.
 *
 * 3. SAMMA ORD BETYDER OLIKA SAKER I OLIKA KOMMUNER. `Mottagningskök` är
 *    skolmat i Jönköping och restaurangservering i Linköping. Därför är
 *    nyckeln (kommun, råvärde) med kommunen valfri: en global tabell för det
 *    som är entydigt, en överstyrning per kommun för resten.
 */

// ---------------------------------------------------------------------------
// Toppkategorier
// ---------------------------------------------------------------------------

export type TopCategoryId = 'restaurang' | 'cafe' | 'butik' | 'skola' | 'ovrigt';

export interface TopCategory {
  id: TopCategoryId;
  /** URL-segment: /stockholm/kategori/restauranger */
  slug: string;
  /** Rubrik och filternamn. */
  name: string;
  /** Form i löptext: "12 restauranger i Stockholm". */
  plural: string;
  /**
   * Kort form för uppräkningar. `plural` för caféerna är "caféer och bagerier",
   * och en uppräkning av tre kategorier blir då "restauranger, caféer och
   * bagerier och butiker" — obegriplig. Uppräkningar använder den här.
   */
  short: string;
  /** Underrubrik i gränssnittet. Klarspråk, aldrig myndighetssvenska. */
  blurb: string;
}

/**
 * Visningsordning. Övrigt sist och nedtonat — det är restposten, inte en
 * jämbördig kategori. Ordningen är också den som avgör vilken kategori som
 * visas när en verksamhet hamnar i flera (se `displayCategory`).
 */
export const TOP_CATEGORIES: readonly TopCategory[] = [
  {
    id: 'restaurang',
    slug: 'restauranger',
    name: 'Restauranger',
    plural: 'restauranger',
    short: 'restauranger',
    blurb: 'Restauranger, pizzerior, gatukök, catering och food trucks',
  },
  {
    id: 'cafe',
    slug: 'cafeer-och-bagerier',
    name: 'Caféer och bagerier',
    plural: 'caféer och bagerier',
    short: 'caféer',
    blurb: 'Caféer, konditorier och bagerier',
  },
  {
    id: 'butik',
    slug: 'butiker',
    name: 'Butiker',
    plural: 'butiker',
    short: 'butiker',
    blurb: 'Mataffärer, kiosker, hälsokost och apotek',
  },
  {
    id: 'skola',
    slug: 'skolor-och-omsorg',
    name: 'Skolor och omsorg',
    plural: 'skolor och omsorgsverksamheter',
    short: 'skolor och omsorg',
    blurb: 'Förskolor, skolor, äldreboenden och annan omsorg',
  },
  {
    id: 'ovrigt',
    slug: 'ovrigt',
    name: 'Övrigt',
    plural: 'verksamheter',
    short: 'övriga verksamheter',
    blurb: 'Tillverkare, grossister, lager och annat du inte besöker',
  },
];

const TOP_BY_ID = new Map(TOP_CATEGORIES.map((c) => [c.id, c]));
const TOP_BY_SLUG = new Map(TOP_CATEGORIES.map((c) => [c.slug, c]));

export function topCategory(id: TopCategoryId): TopCategory {
  const c = TOP_BY_ID.get(id);
  if (!c) throw new Error(`Okänd toppkategori: ${id}`);
  return c;
}

export function topCategoryBySlug(slug: string): TopCategory | undefined {
  return TOP_BY_SLUG.get(slug);
}

/** Rangordning för `displayCategory`, härledd ur visningsordningen. */
const TOP_ORDER = new Map(TOP_CATEGORIES.map((c, i) => [c.id, i]));

/**
 * En kategori att visa när en verksamhet hör hemma i flera.
 *
 * 1,4 % av beståndet får två kategorier på samma rang, främst Stockholm där
 * `1. Café` och `1. Restaurang` förekommer på samma verksamhet. Båda är sanna.
 * Listan avgör filtren, den här avgör vad som står som etikett.
 */
export function displayCategory(ids: readonly TopCategoryId[]): TopCategoryId | null {
  let best: TopCategoryId | null = null;
  for (const id of ids) {
    if (best === null || TOP_ORDER.get(id)! < TOP_ORDER.get(best)!) best = id;
  }
  return best;
}

// ---------------------------------------------------------------------------
// Underkategorier
// ---------------------------------------------------------------------------

export interface SubCategory {
  id: string;
  slug: string;
  name: string;
  /** Pluralform för rubriker: "Pizzerior i Örebro". */
  plural: string;
  top: TopCategoryId;
}

/**
 * 21 underkategorier. INGEN av dem finns i alla kommuner, och därför är de
 * aldrig ett nationellt filter — bara ett filter inne på en kommunsida, med
 * bara de underkategorier just den kommunen faktiskt levererar.
 *
 * Kökstyp går inte att göra nationellt över huvud taget. Sökning på hamburg,
 * burger, sushi, thai, wok, falafel och tio ord till över hela beståndet ger
 * en enda träff (Oskarshamn, 1 verksamhet). Pizzeria är det enda kökstypsord
 * som förekommer på riktigt, och det saknas i Stockholm som ensamt är över
 * hälften av datat.
 */
export const SUB_CATEGORIES: readonly SubCategory[] = [
  { id: 'pizzeria', slug: 'pizzeria', name: 'Pizzeria', plural: 'Pizzerior', top: 'restaurang' },
  { id: 'snabbmat', slug: 'snabbmat-och-gatukok', name: 'Snabbmat och gatukök', plural: 'Snabbmat och gatukök', top: 'restaurang' },
  { id: 'enklare-servering', slug: 'enklare-servering', name: 'Enklare servering', plural: 'Enklare servering', top: 'restaurang' },
  { id: 'mobilt', slug: 'food-truck-och-mobilt', name: 'Food truck och mobilt', plural: 'Food trucks och mobil servering', top: 'restaurang' },
  { id: 'catering', slug: 'catering', name: 'Catering', plural: 'Catering', top: 'restaurang' },
  { id: 'kafe', slug: 'cafe', name: 'Café', plural: 'Caféer', top: 'cafe' },
  { id: 'bageri', slug: 'bageri', name: 'Bageri', plural: 'Bagerier', top: 'cafe' },
  { id: 'livsmedelsbutik', slug: 'livsmedelsbutik', name: 'Livsmedelsbutik', plural: 'Livsmedelsbutiker', top: 'butik' },
  { id: 'kiosk', slug: 'kiosk', name: 'Kiosk', plural: 'Kiosker', top: 'butik' },
  { id: 'halsokost', slug: 'halsokost-och-apotek', name: 'Hälsokost och apotek', plural: 'Hälsokost och apotek', top: 'butik' },
  { id: 'gardsforsaljning', slug: 'gardsforsaljning', name: 'Gårdsförsäljning', plural: 'Gårdsförsäljning', top: 'butik' },
  { id: 'forskola', slug: 'forskola', name: 'Förskola', plural: 'Förskolor', top: 'skola' },
  { id: 'skola-fritids', slug: 'skola-och-fritids', name: 'Skola och fritids', plural: 'Skolor och fritidshem', top: 'skola' },
  { id: 'vard', slug: 'vard-och-aldreomsorg', name: 'Vård och äldreomsorg', plural: 'Vård och äldreomsorg', top: 'skola' },
  { id: 'tillverkning', slug: 'tillverkning', name: 'Tillverkning', plural: 'Tillverkning', top: 'ovrigt' },
  { id: 'grossist', slug: 'grossist', name: 'Grossist', plural: 'Grossister', top: 'ovrigt' },
  { id: 'lager', slug: 'lager-och-transport', name: 'Lager och transport', plural: 'Lager och transport', top: 'ovrigt' },
  { id: 'mellanhand', slug: 'mellanhand-och-e-handel', name: 'Mellanhand och e-handel', plural: 'Mellanhänder och e-handel', top: 'ovrigt' },
  { id: 'huvudkontor', slug: 'huvudkontor', name: 'Huvudkontor', plural: 'Huvudkontor', top: 'ovrigt' },
  { id: 'forpackningar', slug: 'forpackningar', name: 'Förpackningar', plural: 'Förpackningar', top: 'ovrigt' },
  { id: 'dricksvatten', slug: 'dricksvatten', name: 'Dricksvatten', plural: 'Dricksvatten', top: 'ovrigt' },
];

const SUB_BY_ID = new Map(SUB_CATEGORIES.map((s) => [s.id, s]));
const SUB_BY_SLUG = new Map(SUB_CATEGORIES.map((s) => [s.slug, s]));
const SUB_ORDER = new Map(SUB_CATEGORIES.map((s, i) => [s.id, i]));

export function subCategory(id: string): SubCategory {
  const s = SUB_BY_ID.get(id);
  if (!s) throw new Error(`Okänd underkategori: ${id}`);
  return s;
}

export function subCategoryBySlug(slug: string): SubCategory | undefined {
  return SUB_BY_SLUG.get(slug);
}

export function subCategoryRank(id: string): number {
  return SUB_ORDER.get(id) ?? Number.MAX_SAFE_INTEGER;
}

// ---------------------------------------------------------------------------
// Regeltyper
// ---------------------------------------------------------------------------

/**
 * Vad ett råvärde är värt.
 *
 * - `specific` (rang 2) — en riktig verksamhetstyp: `Pizzeria`, `Vårdkök`,
 *   `1. Förskola tillagning`.
 * - `coarse` (rang 1) — kommunens egen grovetikett: `Restaurang och servering`,
 *   `Övriga verksamheter`. Används bara när ingen specifik typ finns, vilket
 *   är hela Uppsala, hela Höganäs och delar av alla andra.
 * - `attribute` (rang 0) — en egenskap, inte en verksamhetstyp: `2. Kväll`,
 *   `Säsong`, `2. Med fiskdisk`, `Fritering`. Styr aldrig kategori.
 * - `spanning` — ett känt värde som vår indelning inte kan lösa upp. Höganäs
 *   enda stora grupp heter `Butik, restaurang och servering` och rymmer
 *   apotek, pizzerior, kaffestugor och stormarknader i samma hink. Det är inte
 *   okänt, men det går inte att kategorisera. Att gissa hade varit sämre än
 *   att säga det rakt ut.
 *
 * `absorbs` säger vad grovetiketten sväljer. Uppsalas `Restaurang och
 * servering` innehåller kommunens alla caféer, och det är därför Uppsala inte
 * kan få ett cafefilter. Fältet finns för att sajten ska kunna skriva ut VARFÖR
 * ett filter saknas i stället för att bara utelämna det.
 */
export type Rule =
  | { kind: 'specific'; top: TopCategoryId; sub?: string }
  | { kind: 'coarse'; top: TopCategoryId; absorbs?: readonly TopCategoryId[] }
  | { kind: 'attribute' }
  | { kind: 'spanning'; tops: readonly TopCategoryId[]; absorbs?: readonly TopCategoryId[] };

const specific = (top: TopCategoryId, sub?: string): Rule => ({ kind: 'specific', top, sub });
const coarse = (top: TopCategoryId, absorbs?: readonly TopCategoryId[]): Rule =>
  ({ kind: 'coarse', top, absorbs });
const attribute: Rule = { kind: 'attribute' };

// ---------------------------------------------------------------------------
// Mappningen — global
// ---------------------------------------------------------------------------

/**
 * Råvärden som betyder samma sak i alla kommuner där de förekommer.
 *
 * Kontrollerat mot varje kommuns hela frekvenslista: inget värde här har
 * motstridig innebörd någonstans. Det som skaver ligger i PER_MUNICIPALITY.
 */
const GLOBAL: Record<string, Rule> = {
  // --- Kommunernas grovetiketter (rang 1) --------------------------------
  'Restaurang och servering': coarse('restaurang', ['cafe']),
  'Restaurang och café': coarse('restaurang', ['cafe']), // Lomma
  'Restauranger och pizzerior': coarse('restaurang'), // Svenljunga
  // Borgholm, 230 av 406. Samma form som Uppsalas grovetikett: kommunens
  // caféer ligger delvis här och delvis under Bageri/konditori. Caféfiltret
  // blir alltså inte tomt i Borgholm, bara inte uttömmande, precis som i
  // Jönköping, Karlstad och Linköping.
  Servering: coarse('restaurang', ['cafe']),
  // Svenljunga. Namnet säger gatukök, innehållet säger café: tio av elva
  // heter Café något, den elfte är Torgkiosken. Källans egen gruppering
  // väger tyngre än ordet, precis som för Bageri och Kiosk i R7. Kommunens
  // gatukök hamnar alltså under Caféer — men Restauranger är inte tom här,
  // så ingen läser en nolla som ett besked.
  'Caféer och gatukök': coarse('cafe'),
  'Skola och omsorg': coarse('skola'),
  'Skolor, förskolor och annan omsorg': coarse('skola'), // Uppsala
  'Skolor och förskolor': coarse('skola'), // Svenljunga
  'Vård och omsorgsverksamheter': coarse('skola'), // Svenljunga
  'Omsorg/skola/vård': coarse('skola'), // Borgholm
  'Butik och handel': coarse('butik'),
  'Butiker och annan handel': coarse('butik'), // Uppsala
  Butiker: coarse('butik'), // Svenljunga
  Butik: coarse('butik'),
  'Café och bageri': coarse('cafe'), // Oskarshamn
  // Borgholm. Konditorier och kaffestugor med disk: Gallericafeet, Café
  // Göthlin, Kaffestugan i Böda, Löttorps Konditori. Kommunens rena
  // produktionsbagerier ligger under Tillverkning, precis som Kristinehamns.
  // Ingen underkategori — hinken är både Café och Bageri, båda under samma
  // toppkategori, och källan säger inte vilket.
  'Bageri/konditori': coarse('cafe'),
  'Övriga verksamheter': coarse('ovrigt'),
  Övriga: coarse('ovrigt'),
  Övrigt: coarse('ovrigt'),
  Buffert: coarse('ovrigt'), // Örebro, kommunens interna restpost
  Tillverkare: coarse('ovrigt'),
  'Tillverkare eller grossist': coarse('ovrigt'), // Höganäs

  // --- Restauranger -------------------------------------------------------
  Restaurang: specific('restaurang'),
  Förening: specific('restaurang'), // Jönköping placerar dem under servering
  Pizzeria: specific('restaurang', 'pizzeria'),
  Gatukök: specific('restaurang', 'snabbmat'),
  Kebabhantering: specific('restaurang', 'snabbmat'),
  Kebab: specific('restaurang', 'snabbmat'),
  Hamburgare: specific('restaurang', 'snabbmat'),
  Korv: specific('restaurang', 'snabbmat'),
  Frukostservering: specific('restaurang', 'enklare-servering'),
  // Borgholm. Pensionat och bed and breakfast är registrerade för frukosten,
  // vilket är exakt vad Enklare servering betyder.
  'B & B': specific('restaurang', 'enklare-servering'),
  'Mobil verksamhet': specific('restaurang', 'mobilt'),
  'Mobil anläggning': specific('restaurang', 'mobilt'),
  'Food trucks': specific('restaurang', 'mobilt'),
  Catering: specific('restaurang', 'catering'),
  Cateringverksamhet: specific('restaurang', 'catering'),

  // --- Caféer och bagerier ------------------------------------------------
  // Bagerierna ligger hos caféerna. Kommunerna är oense (Jönköping säger
  // servering, Karlstad säger handel, Linköping säger övrigt), så vi måste
  // välja. Besökaren gör ingen skillnad på ett bageri med disk och ett café.
  Café: specific('cafe', 'kafe'),
  Kafé: specific('cafe', 'kafe'), // Kristinehamns stavning, samma sak
  Bageri: specific('cafe', 'bageri'),
  'Konditori med eget bageri': specific('cafe', 'bageri'), // Oskarshamn

  // --- Butiker ------------------------------------------------------------
  'Butik utan egen beredning': specific('butik', 'livsmedelsbutik'),
  'Butik med egen beredning': specific('butik', 'livsmedelsbutik'),
  // Kristinehamn skriver samma distinktion utan ordet "egen". Kommunens fem
  // apotek ligger inne i "utan beredning" och får därför Livsmedelsbutik i
  // stället för Hälsokost och apotek. Toppkategorin är rätt, och vi följer
  // källans egen gruppering hellre än vår läsning av namnen.
  'Butik utan beredning': specific('butik', 'livsmedelsbutik'),
  'Butik med beredning': specific('butik', 'livsmedelsbutik'),
  'Livsmedelsbutik ej hantering': specific('butik', 'livsmedelsbutik'),
  'Livsmedelsbutik med hantering': specific('butik', 'livsmedelsbutik'),
  Kiosk: specific('butik', 'kiosk'),
  Hälsokost: specific('butik', 'halsokost'),
  Apotek: specific('butik', 'halsokost'),
  'Läkemedel/hälsokost - Apotek': specific('butik', 'halsokost'), // Oskarshamn
  'Läkemedel/hälsokost - Kosttillskott': specific('butik', 'halsokost'),
  'Läkemedel/hälsokost - Sport- och viktminskningsprodukter': specific('butik', 'halsokost'),
  Gårdsförsäljning: specific('butik', 'gardsforsaljning'),

  // --- Skolor och omsorg --------------------------------------------------
  // En kategori, inte två. Att dela skola från vård hade fungerat i Stockholm,
  // Karlstad och Linköping, men Jönköpings Tillagningskök/Mottagningskök och
  // Örebros Tillagning säger ingenting om vilket. Uppdelningen finns kvar på
  // undernivån, där den går.
  Tillagningskök: specific('skola'),
  Mottagningskök: specific('skola'),
  Tillagning: specific('skola'), // Örebro
  Förskolekök: specific('skola', 'forskola'),
  'Förskolekök mottagning': specific('skola', 'forskola'),
  'Förskolekök tillagning': specific('skola', 'forskola'),
  'Mottagningskök förskola': specific('skola', 'forskola'),
  'Tillagningskök förskola': specific('skola', 'forskola'),
  Skolkök: specific('skola', 'skola-fritids'),
  'Skolkök mottagning': specific('skola', 'skola-fritids'),
  'Skolkök tillagning': specific('skola', 'skola-fritids'),
  'Mottagningskök skola': specific('skola', 'skola-fritids'),
  'Tillagningskök skola': specific('skola', 'skola-fritids'),
  Fritidsverksamhet: specific('skola', 'skola-fritids'),
  Vårdkök: specific('skola', 'vard'),
  'Mottagningskök vård': specific('skola', 'vard'),
  'Tillagningskök vård': specific('skola', 'vard'),
  Gruppboende: specific('skola', 'vard'),
  'Daglig verksamhet': specific('skola', 'vard'),
  'Äldreboende mottagningskök': specific('skola', 'vard'),
  'Äldreboende tillagningskök': specific('skola', 'vard'),
  'US Avdelningskök': specific('skola', 'vard'), // Universitetssjukhuset, Linköping
  Hemtjänst: specific('skola', 'vard'),
  'Skola/Vård - Vårdboende': specific('skola', 'vard'), // Oskarshamn

  // --- Övrigt -------------------------------------------------------------
  'Industriell tillv och bered': specific('ovrigt', 'tillverkning'),
  'Tillverkare av konfektyr': specific('ovrigt', 'tillverkning'),
  'Tillverkare av dryck': specific('ovrigt', 'tillverkning'),
  'Tillverkare övriga livsmedel': specific('ovrigt', 'tillverkning'),
  Viltanläggning: specific('ovrigt', 'tillverkning'),
  'Egen tillverkning': specific('ovrigt', 'tillverkning'), // Oskarshamn
  // Kristinehamn. Bryter INTE mot R7:s beslut att bagerier hör till caféerna —
  // det gällde värdet `Bageri`, som inte kan skilja produktion från disk. Här
  // gör källan skillnaden själv: Drevstabageriet ligger under `Kafé`, medan
  // Bageri Höghuset, Vetekransen, Sockerslottet och Chocolate by L ligger här.
  // Ordet är tillverkning, och ett tillverkningsställe svarar inte på frågan
  // "kan jag fika där".
  Bagerivarutillverkning: specific('ovrigt', 'tillverkning'),
  // Borgholm: bryggerier, musterier, rökerier, glassfabrik, gårdsmjölk och de
  // rena produktionsbagerierna. Kommunens bagerier med disk ligger under
  // Bageri/konditori.
  Tillverkning: specific('ovrigt', 'tillverkning'),
  Grossist: specific('ovrigt', 'grossist'),
  'Grossist/lager/transport': specific('ovrigt', 'grossist'),
  Distributör: specific('ovrigt', 'lager'),
  Distribution: specific('ovrigt', 'lager'), // Borgholm
  Lager: specific('ovrigt', 'lager'), // Borgholm
  Livsmedelslager: specific('ovrigt', 'lager'),
  'Lager/Transport/Omlastning': specific('ovrigt', 'lager'),
  Transportör: specific('ovrigt', 'lager'),
  Matmäklare: specific('ovrigt', 'mellanhand'),
  Kosttillskott: specific('ovrigt', 'mellanhand'),
  Huvudkontor: specific('ovrigt', 'huvudkontor'),
  // Borgholm. Vattenverk, samfälligheter och enskilda dricksvattenanläggningar.
  // Campingar och stugbyar förekommer, men de är registrerade för sitt vatten;
  // deras servering är en egen post under Servering.
  Vattenverk: specific('ovrigt', 'dricksvatten'),

  // --- Attribut (rang 0) --------------------------------------------------
  Säsong: attribute,
  'Hantering i hemlika förhållanden': attribute,
  'Skyddad beteckning': attribute,
  'Fri från-livsmedel': attribute,
  // Karlstads värde ligger HTML-kodat i datat. Båda formerna står här så att
  // tabellen överlever den dag pipelinen börjar avkoda entiteter.
  '&gt;150 engångs/flergångs': attribute,
  '>150 engångs/flergångs': attribute,
  Fritering: attribute,
  Matsal: attribute,
  'Utleverans av mat': attribute,
  Internetförsäljning: attribute,
  'Manuell hantering - Chark': attribute,
  'Manuell hantering - Fisk': attribute,
  'Glass - Mjukglass': attribute,
  'Förpackade livsmedel': attribute,
  'Införsel av livsmedel från tredje land': attribute,
};

// ---------------------------------------------------------------------------
// Mappningen — per kommun
// ---------------------------------------------------------------------------

/**
 * Överstyrningar. Bara värden som betyder något annat i just den kommunen,
 * eller som bara den kommunen har och som krockar med den globala tabellen.
 */
const PER_MUNICIPALITY: Record<string, Record<string, Rule>> = {
  hoganas: {
    // Höganäs källa har tre grova grupper, och den största blandar apotek,
    // pizzerior, kaffestugor och stormarknader. Se `spanning` ovan.
    'Butik, restaurang och servering': {
      kind: 'spanning',
      tops: ['restaurang', 'butik'],
      absorbs: ['cafe'],
    },
  },

  kristinehamn: {
    // Varje verksamhet i Kristinehamn bär exakt ETT värde. Det gör rangen
    // verkningslös inom kommunen, men den sätts ändå rätt: står strängen en
    // dag bredvid en riktig typ i en annan källa ska den typen vinna.
    //
    // Namnet säger vem som driver stället, inte vad det är. Innehållet svarar
    // ändå: 23 av 24 är förskolor, skolor, fritidshem, gruppboenden,
    // äldreboenden och hemvård. Den tjugofjärde är Landa café. Samma sorts
    // dominansbeslut som R7 gjorde för Örebros `Buffert` och Jönköpings
    // `Förening`. Ingen underkategori — gruppen blandar förskola, skola och
    // äldreomsorg utan att säga vilket.
    'Kommunal livsmedelsverksamhet': coarse('skola'),

    // Inte ett attribut, trots att ordet låter så. Oskarshamns `Fritering` och
    // `Matsal` står BREDVID en riktig typ och är därför tillägg; det här är
    // det enda källan säger om de nio, och att kalla det rang 0 vore att
    // påstå att källan inte sagt något.
    //
    // Men det går inte heller att lösa upp. Sju av nio serverar (två hotell,
    // ett cateringföretag, RIA, Träffpunkten, en friluftsgård, Krongården) och
    // två tillverkar (Björns Bigårdar, Mor Carins Ostkaka). Känt värde, ingen
    // kategori vi kan stå för. Det är precis vad `spanning` finns för.
    'Mindre beredning': { kind: 'spanning', tops: ['restaurang', 'ovrigt'] },
  },

  linkoping: {
    // Betyder motsatsen till Jönköpings `Mottagningskök`: 28 av 30 ligger
    // under kommunens egen grovkategori Restaurang och servering.
    'Mottagningskök/serveringskök': specific('restaurang', 'enklare-servering'),
  },

  oskarshamn: {
    // Oskarshamns Skolkök står alltid tillsammans med Skola/Vård - Skolkök,
    // och gruppen innehåller lika många förskolor som skolor. Toppkategorin
    // är säker, underkategorin är den inte. Då sätts ingen underkategori.
    Skolkök: specific('skola'),
    'Skola/Vård - Skolkök': specific('skola'),
    'Skola/Vård - Mottagning av färdig mat': specific('skola'),
  },

  stockholm: {
    // Stockholms värden är prefixade: 1. = huvudverksamhet, 2. = tillägg.
    // Varenda verksamhet har minst ett 1.-värde (0 undantag av 8 511), och
    // 2.-värdena är attribut som aldrig får styra kategorin — utom de fem
    // nedan, som är riktiga verksamhetstyper i tilläggsfältet.
    '1. Restaurang': specific('restaurang'),
    '2. Restaurang': specific('restaurang'),
    '1. Snabbmatsrestaurang': specific('restaurang', 'snabbmat'),
    '2. Snabbmatsrestaurang': specific('restaurang', 'snabbmat'),
    '1. Enklare servering': specific('restaurang', 'enklare-servering'),
    '1. Catering': specific('restaurang', 'catering'),
    '2. Catering': specific('restaurang', 'catering'),
    '2. Mobil': specific('restaurang', 'mobilt'),
    '2. Vagn': specific('restaurang', 'mobilt'),
    '2. Cykel': specific('restaurang', 'mobilt'),
    '2. Food truck': specific('restaurang', 'mobilt'),
    '1. Torghandel': specific('restaurang', 'mobilt'),

    '1. Café': specific('cafe', 'kafe'),
    '2. Café': specific('cafe', 'kafe'),
    '1. Bageri': specific('cafe', 'bageri'),

    '1. Butik': specific('butik', 'livsmedelsbutik'),
    '1. Kiosk': specific('butik', 'kiosk'),
    '1. Apotek': specific('butik', 'halsokost'),

    '1. Förskola tillagning': specific('skola', 'forskola'),
    '1. Förskola mottagning': specific('skola', 'forskola'),
    '1. Skola tillagning': specific('skola', 'skola-fritids'),
    '1. Skola mottagning': specific('skola', 'skola-fritids'),
    '1. Fritidshem': specific('skola', 'skola-fritids'),
    '2. Leverans till skolor': specific('skola', 'skola-fritids'),
    '1. Vård/omsorg tillagning': specific('skola', 'vard'),
    '1. Vård/omsorg mottagning': specific('skola', 'vard'),
    '1. Hemtjänst': specific('skola', 'vard'),

    '1. Tillverkning': specific('ovrigt', 'tillverkning'),
    '1. 853': specific('ovrigt', 'tillverkning'), // animalieanläggning
    '1. Grossist': specific('ovrigt', 'grossist'),
    '1. Transportör': specific('ovrigt', 'lager'),
    '1. Lager': specific('ovrigt', 'lager'),
    '1. Matmäklare': specific('ovrigt', 'mellanhand'),
    '1. Kosttillskott': specific('ovrigt', 'mellanhand'),
    '1. E-handel': specific('ovrigt', 'mellanhand'),
    '1. Huvudkontor': specific('ovrigt', 'huvudkontor'),
    '1. Kontaktmaterialverksamhet': specific('ovrigt', 'forpackningar'),
    '1. Dricksvattenpost': specific('ovrigt', 'dricksvatten'),
    '1. Dricksvatten - Distributionsnät': specific('ovrigt', 'dricksvatten'),
    '1. Matdemonstrationer': specific('ovrigt'),

    // Fritext som läckt in i ett annars prefixat fält.
    'fsk eller annan omsorg': specific('skola', 'forskola'),
    smörgåsar: attribute,

    // Tilläggsegenskaper. Verkligt innehåll, men inte verksamhetstyper.
    '2. Kopplad till HK': attribute,
    '2. Kväll': attribute,
    '2. Införsel': attribute,
    '2. Import': attribute,
    '2. Export': attribute,
    '2. E-handel': attribute,
    '2. Säsong sommar': attribute,
    '2. Säsong vinter': attribute,
    '2. I hemmet': attribute,
    '2. EMV': attribute,
    '2. Butik': attribute,
    '2. Bageri': attribute,
    '2. Med mobil verksamhet': attribute,
    '2. Båt': attribute,
    '2. Huvudkontor': attribute,
    '2. Transportör': attribute,
    '2. Grillad kyckling': attribute,
    '2. Med fiskdisk': attribute,
    '2. Grossist': attribute,
    '2. Med köttdisk': attribute,
    '2. Med servering': attribute,
    '2. Med sallader': attribute,
    '2. Glass': attribute,
    '2. Tillverkning': attribute,
    '2. Med bageri': attribute,
    '2. Med tillagning': attribute,
    '2. Med bearbetade animalier': attribute,
    '2. Kosttillskott': attribute,
    '2. Matmäklare': attribute,
    '2. Med FCM': attribute,
    '2. Undantag 853-anläggning': attribute,
    '2. Med vegetabilier': attribute,
    '2. Matdemonstrationer': attribute,
    '2. Med ABP': attribute,
    '2. Lager': attribute,
    '2. Med Livsmedel (för FCM)': attribute,
    '2. Korttidstillstånd': attribute,
    '2. Med matlådor': attribute,
    '2. Förpackade livsmedel': attribute,
    '2. Fristående': attribute,
    '2. Fri från (SLV)': attribute,
  },
};

/**
 * Kommuner vars adapter lägger flera värden i EN sträng, kommaseparerat.
 *
 * Karlstads `inriktning` och Linköpings `allaInriktningar` innehåller värden
 * som "Butik utan egen beredning, Café, Säsong". Splitten får INTE göras
 * generellt: Uppsalas `Skolor, förskolor och annan omsorg` och Höganäs
 * `Butik, restaurang och servering` är ett enda värde vardera och skulle gå
 * sönder. Listan är alltså en egenskap hos källan, inte en textregel.
 *
 * Buggen ligger i pipeline/prikko/sources/karlstad.py och linkoping.py. När
 * den är rättad blir splitten här verkningslös, inte fel: värdena kommer redan
 * delade och innehåller inget komma.
 */
const COMMA_JOINED = new Set(['karlstad', 'linkoping']);

/** Råvärden en verksamhet faktiskt bär, efter kommunens egen uppdelning. */
export function rawValues(municipality: string, types: readonly string[] | null | undefined): string[] {
  if (!types || types.length === 0) return [];
  if (!COMMA_JOINED.has(municipality)) return types.filter((t) => t.trim() !== '');
  const out: string[] = [];
  for (const t of types) {
    for (const part of t.split(',')) {
      const v = part.trim();
      if (v !== '') out.push(v);
    }
  }
  return out;
}

/**
 * Stockholms sorteringsnummer framför typen: "1. Restaurang".
 *
 * Numret är stadens interna listordning, inte en del av typnamnet, och det
 * syntes rakt igenom till besökaren ("1. Restaurang · Kammakargatan 22").
 * Pipelinen skalar av det vid inläsning, men tabellen nedan är skriven mot
 * de prefixade strängarna och skulle annars sluta känna igen dem. Att skala
 * av även HÄR gör uppslagningen okänslig för vilken form datan har, så att
 * tabellen fortsätter fungera både före och efter en omkörning av pipelinen.
 */
const SORT_PREFIX = /^\d+\.\s*/;

/**
 * Tabellen ovan är skriven mot Stockholms RÅA strängar, alltså med prefixet
 * kvar. Pipelinen skalar numera av det vid inläsning, så uppslagningen måste
 * hitta "Restaurang" i en tabell som säger "1. Restaurang".
 *
 * Ett avskalat index byggs därför en gång per kommun, lat. Krockar mellan två
 * prefix som ger samma namn kan inte uppstå i Stockholms lista, och skulle de
 * uppstå vinner den första, vilket är samma ordning som tabellen har.
 */
const STRIPPED: Record<string, Record<string, Rule>> = {};

function strippedFor(municipality: string): Record<string, Rule> {
  const cached = STRIPPED[municipality];
  if (cached) return cached;
  const built: Record<string, Rule> = {};
  for (const [key, rule] of Object.entries(PER_MUNICIPALITY[municipality] ?? {})) {
    const utan = key.replace(SORT_PREFIX, '');
    if (utan !== key && !(utan in built)) built[utan] = rule;
  }
  STRIPPED[municipality] = built;
  return built;
}

export function ruleFor(municipality: string, value: string): Rule | undefined {
  const direkt = PER_MUNICIPALITY[municipality]?.[value] ?? GLOBAL[value];
  if (direkt) return direkt;
  return strippedFor(municipality)[value];
}

// ---------------------------------------------------------------------------
// Klassificering
// ---------------------------------------------------------------------------

export type Classification =
  /** Minst en kategori kunde bestämmas. */
  | 'ok'
  /** Kända värden, men indelningen kan inte lösa upp dem. Höganäs. */
  | 'spanning'
  /** Källan lämnar ingen verksamhetstyp alls, eller bara attribut. */
  | 'no_type'
  /** Minst ett råvärde saknas i tabellen och inget annat värde räddade posten. */
  | 'unknown';

export interface Categorised {
  /** Alla toppkategorier posten hör hemma i, i visningsordning. Filtren använder den här. */
  categories: TopCategoryId[];
  /** Underkategorier, i visningsordning. Bara de kommunen faktiskt levererar. */
  subcategories: string[];
  /** Kategorin att visa som etikett, eller null. */
  category: TopCategoryId | null;
  status: Classification;
  /** Råvärden som inte står i tabellen. Alltid loggade, även när posten fick en kategori. */
  unknown: string[];
}

/**
 * Kategorisera en verksamhet ur dess råvärden.
 *
 * Högsta rang vinner: en specifik typ slår alltid kommunens grovetikett.
 * Grovetiketten används bara när ingen specifik typ finns, vilket är hela
 * Uppsala, hela Höganäs, hela Lomma och delar av alla andra.
 */
export function classify(
  municipality: string,
  types: readonly string[] | null | undefined,
): Categorised {
  const values = rawValues(municipality, types);

  const specificTops: TopCategoryId[] = [];
  const specificSubs: string[] = [];
  const coarseTops: TopCategoryId[] = [];
  const unknown: string[] = [];
  let spanning = false;

  for (const value of values) {
    const rule = ruleFor(municipality, value);
    if (!rule) {
      if (!unknown.includes(value)) unknown.push(value);
      continue;
    }
    switch (rule.kind) {
      case 'specific':
        if (!specificTops.includes(rule.top)) specificTops.push(rule.top);
        if (rule.sub && !specificSubs.includes(rule.sub)) specificSubs.push(rule.sub);
        break;
      case 'coarse':
        if (!coarseTops.includes(rule.top)) coarseTops.push(rule.top);
        break;
      case 'spanning':
        spanning = true;
        break;
      case 'attribute':
        break;
    }
  }

  const byOrder = (a: TopCategoryId, b: TopCategoryId) => TOP_ORDER.get(a)! - TOP_ORDER.get(b)!;

  // Rang 2 slår rang 1. Underkategorier hör alltid till det specifika värdet.
  const categories = (specificTops.length > 0 ? specificTops : coarseTops).sort(byOrder);
  const subcategories = specificTops.length > 0
    ? specificSubs.sort((a, b) => subCategoryRank(a) - subCategoryRank(b))
    : [];

  let status: Classification;
  if (categories.length > 0) status = 'ok';
  else if (spanning) status = 'spanning';
  else if (unknown.length > 0) status = 'unknown';
  else status = 'no_type';

  return {
    categories,
    subcategories,
    category: displayCategory(categories),
    status,
    unknown,
  };
}

// ---------------------------------------------------------------------------
// Vad kommunens ordförråd gör omöjligt
// ---------------------------------------------------------------------------

export interface CoverageGap {
  /** Kategorin som inte går att fylla i kommunen. */
  category: TopCategoryId;
  /**
   * `absorbed` — kategorin ligger inuti en grovetikett och går inte att skilja
   * ut. `spanning` — källan har en enda grupp som blandar flera kategorier.
   */
  kind: 'absorbed' | 'spanning';
  /** Kategorierna den ligger begravd i. */
  into: TopCategoryId[];
}

/**
 * Kategorier kommunens ordförråd inte kan fylla, och varför.
 *
 * Uppsala har fyra värden, punkt. Deras 688 caféer OCH restauranger ligger
 * tillsammans under `Restaurang och servering`, så ett cafefilter i Uppsala
 * skulle ge noll träffar. Ett filter som inte finns ljuger inte. Ett filter
 * som ger noll träffar gör det. Därför räknas luckan fram här, ur kommunens
 * egna råvärden, och skrivs ut som en mening i stället för att visas som ett
 * tomt filter.
 *
 * Räknas ur ordförrådet och inte ur en lista i kod, så att den inte kan bli
 * inaktuell när en kommun börjar publicera finare typer.
 */
export function coverageGaps(municipality: string, values: Iterable<string>): CoverageGap[] {
  const absorbedInto = new Map<TopCategoryId, Set<TopCategoryId>>();
  const spanningInto = new Map<TopCategoryId, Set<TopCategoryId>>();

  const add = (
    map: Map<TopCategoryId, Set<TopCategoryId>>,
    category: TopCategoryId,
    into: readonly TopCategoryId[],
  ) => {
    const set = map.get(category) ?? new Set<TopCategoryId>();
    for (const t of into) set.add(t);
    map.set(category, set);
  };

  for (const value of values) {
    const rule = ruleFor(municipality, value);
    if (!rule) continue;
    if (rule.kind === 'coarse') {
      for (const a of rule.absorbs ?? []) add(absorbedInto, a, [rule.top]);
    } else if (rule.kind === 'spanning') {
      for (const t of rule.tops) add(spanningInto, t, rule.tops);
      for (const a of rule.absorbs ?? []) add(spanningInto, a, rule.tops);
    }
  }

  const byOrder = (a: TopCategoryId, b: TopCategoryId) => TOP_ORDER.get(a)! - TOP_ORDER.get(b)!;
  const gaps: CoverageGap[] = [];

  for (const c of TOP_CATEGORIES) {
    // En odelbar grupp är den värre diagnosen och vinner över en grovetikett.
    const spanning = spanningInto.get(c.id);
    if (spanning) {
      gaps.push({
        category: c.id,
        kind: 'spanning',
        into: [...spanning].filter((t) => t !== c.id).sort(byOrder),
      });
      continue;
    }
    const absorbed = absorbedInto.get(c.id);
    if (absorbed) {
      gaps.push({ category: c.id, kind: 'absorbed', into: [...absorbed].sort(byOrder) });
    }
  }

  return gaps;
}

// ---------------------------------------------------------------------------
// Okända värden
// ---------------------------------------------------------------------------

/**
 * Andel okategoriserade som får passera innan bygget stannar.
 *
 * Under en procent är en ny nisch. Över en procent har källan lagt om sin
 * modell, och då är tystnad det farligaste av alla utfall: sajten skulle
 * publicera fel kategori på tusentals verksamheter utan att någon märker det.
 */
export const UNKNOWN_ABORT_SHARE = 0.01;

export class UnknownSourceValues extends Error {
  municipality: string;
  values: UnknownValue[];

  constructor(municipality: string, values: UnknownValue[], message: string) {
    super(message);
    this.name = 'UnknownSourceValues';
    this.municipality = municipality;
    this.values = values;
  }
}

export interface UnknownValue {
  municipality: string;
  value: string;
  /** Antal verksamheter som bär värdet. */
  establishments: number;
  /** Antal av dem som blev helt utan kategori. */
  uncategorised: number;
  firstSeen: string;
}

const unknownRegistry = new Map<string, UnknownValue>();

export function noteUnknown(municipality: string, value: string, uncategorised: boolean): void {
  const key = `${municipality} ${value}`;
  const existing = unknownRegistry.get(key);
  if (existing) {
    existing.establishments += 1;
    if (uncategorised) existing.uncategorised += 1;
    return;
  }
  unknownRegistry.set(key, {
    municipality,
    value,
    establishments: 1,
    uncategorised: uncategorised ? 1 : 0,
    firstSeen: new Date().toISOString().slice(0, 10),
  });
}

export function unknownValues(municipality?: string): UnknownValue[] {
  const all = [...unknownRegistry.values()];
  const wanted = municipality ? all.filter((u) => u.municipality === municipality) : all;
  return wanted.sort(
    (a, b) => a.municipality.localeCompare(b.municipality) || b.establishments - a.establishments,
  );
}

/**
 * Stanna bygget när en källa har lagt om sin modell.
 *
 * Två villkor, båda på en procent av kommunen. Det första fångar det uppenbara:
 * många verksamheter helt utan kategori. Det andra fångar det lömska: ett nytt
 * specifikt värde som döljs bakom kommunens grovetikett, så att posterna får en
 * kategori ändå — fast kanske fel.
 */
export function assertKnown(municipality: string, total: number): void {
  if (total === 0) return;
  const values = unknownValues(municipality);
  if (values.length === 0) return;

  const uncategorised = values.reduce((n, u) => n + u.uncategorised, 0);
  const worst = values.reduce((n, u) => Math.max(n, u.establishments), 0);
  const limit = total * UNKNOWN_ABORT_SHARE;

  const list = values
    .slice(0, 10)
    .map((u) => `  ${u.establishments.toString().padStart(6)}  ${JSON.stringify(u.value)}`)
    .join('\n');

  if (uncategorised > limit || worst > limit) {
    throw new UnknownSourceValues(
      municipality,
      values,
      `${municipality}: ${values.length} okända råvärden i källan. ` +
        `${uncategorised} av ${total} verksamheter blev helt utan kategori, ` +
        `och det vanligaste okända värdet bärs av ${worst}. ` +
        `Gränsen är ${(UNKNOWN_ABORT_SHARE * 100).toFixed(0)} % (${Math.floor(limit)} verksamheter).\n` +
        `Källan har sannolikt lagt om sin modell. Komplettera tabellen i ` +
        `site/src/lib/categories.ts innan bygget kan gå igenom.\n${list}`,
    );
  }

  console.warn(
    `[kategorier] ${municipality}: ${values.length} okända råvärden, ` +
      `${uncategorised} av ${total} verksamheter utan kategori. Se pipeline/unknown_types.json.\n${list}`,
  );
}

// ---------------------------------------------------------------------------
// Loggen
// ---------------------------------------------------------------------------

/**
 * Skriv okända råvärden till pipeline/unknown_types.json.
 *
 * Filen skrivs en gång, när processen avslutas, och bara när det finns något
 * att skriva. `firstSeen` bevaras från en tidigare körning så att man kan se
 * hur länge ett värde har varit okänt. Ett misslyckat skrivförsök får aldrig
 * fälla ett bygge — grinden är assertKnown, det här är protokollet.
 */
function writeUnknownLog(fs: NodeFs, path: NodePath): void {
  const values = unknownValues();
  if (values.length === 0) return;

  try {
    const { readFileSync, writeFileSync, existsSync } = fs;
    const { join, dirname } = path;

    let dir = process.cwd();
    let target = '';
    for (let i = 0; i < 8; i += 1) {
      if (existsSync(join(dir, 'pipeline'))) {
        target = join(dir, 'pipeline', 'unknown_types.json');
        break;
      }
      const up = dirname(dir);
      if (up === dir) break;
      dir = up;
    }
    if (!target) return;

    const seen = new Map<string, string>();
    if (existsSync(target)) {
      const previous = JSON.parse(readFileSync(target, 'utf8')) as { values?: UnknownValue[] };
      for (const v of previous.values ?? []) seen.set(`${v.municipality} ${v.value}`, v.firstSeen);
    }

    writeFileSync(
      target,
      `${JSON.stringify(
        {
          note:
            'Råvärden som saknas i site/src/lib/categories.ts. Skrivs av sajtbygget. ' +
            'Varje rad ska antingen läggas till i tabellen eller förklaras.',
          writtenAt: new Date().toISOString().slice(0, 10),
          values: values.map((v) => ({
            ...v,
            firstSeen: seen.get(`${v.municipality} ${v.value}`) ?? v.firstSeen,
          })),
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
  } catch {
    // Loggen är en bekvämlighet. Bygget stannar av assertKnown, inte av det här.
  }
}

type NodeFs = typeof import('node:fs');
type NodePath = typeof import('node:path');

let logScheduled = false;

/**
 * Kopplar in loggskrivningen. Anropas när ett okänt värde noteras.
 *
 * Modulerna laddas HÄR och inte i utskrivaren. En `exit`-hanterare får inte
 * vänta på något asynkront — processen är redan på väg ut när den kallas, och
 * en dynamisk import hade aldrig hunnit lösas ut.
 */
export function scheduleUnknownLog(): void {
  if (logScheduled) return;
  if (typeof process === 'undefined' || typeof process.on !== 'function') return;
  logScheduled = true;

  void Promise.all([import('node:fs'), import('node:path')])
    .then(([fs, path]) => {
      process.on('exit', () => writeUnknownLog(fs, path));
    })
    .catch(() => {
      // Ingen filsystemsåtkomst. assertKnown gör jobbet ändå.
    });
}
