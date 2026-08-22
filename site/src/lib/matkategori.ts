/**
 * Matkategorier: den fina indelningen, byggd av OpenStreetMap.
 *
 * ══ VARFÖR MODULEN FINNS ════════════════════════════════════════════════
 *
 * `categories.ts` delar hela beståndet i fem: restauranger, caféer och
 * bagerier, butiker, skolor och omsorg, övrigt. Den indelningen kommer ur
 * kommunernas egna verksamhetstyper och täcker alla 16 047 rader, vilket är
 * hela dess poäng: varje sida på sajten måste kunna placeras.
 *
 * Den duger inte som kategorirad på startsidan. Ägaren 2026-08-21: "vi måste
 * bygga egna kategorier själva, för vi har för få nu, så det blir liksom en
 * dålig skroll och restauranger säger ingenting." Han har rätt i båda
 * leden. Fem val ger en rad som inte går att rulla, och "Restauranger" är
 * 8 000 rader, alltså ingen valmöjlighet alls. Den som söker mat söker pizza,
 * sushi eller bageri.
 *
 * ══ VAR DATAN KOMMER IFRÅN ══════════════════════════════════════════════
 *
 * Samma hopparning mot OpenStreetMap som redan bär öppettider och
 * kontaktuppgifter, se pipeline/oppettider.py. Den paras på namn inom 100 m
 * (250 m när vår koordinat bara är gatunivå) och avstår vid tvetydighet.
 * Tre taggar ur den träffen används här:
 *
 *   cuisine   vad stället lagar          1 674 verksamheter
 *   amenity   vad stället ÄR             3 005
 *   shop      samma för butiker            962
 *
 * `amenity` och `shop` hämtades inte förrän 2026-08-21, och det var hela
 * skillnaden: med bara `cuisine` saknade café, snabbmat, bageri, bar och
 * livsmedelsbutik kategori, alltså de fem vanligaste ställena i landet.
 *
 * ══ TABELL, INTE HEURISTIK ══════════════════════════════════════════════
 *
 * Samma regel som categories.ts §1: ett råvärde står i tabellen eller ger
 * ingen kategori. Ingen strängmatchning på verksamhetsnamn, ingen gissning.
 * "Pizzeria Roma" hamnar under Pizza därför att någon kartlagt
 * `cuisine=pizza` på den punkten, inte därför att namnet innehåller "pizz".
 *
 * Det är också skälet till att modulen INTE låter en språkmodell avgöra ur
 * namnet, vilket var det andra alternativet ägaren nämnde. En gissning ur
 * namnet är osynlig när den är fel: "Kina Palatset" kan vara en thairestaurang
 * och "Bagarstugan" en pub, och en kategori som ser rätt ut men är fel går
 * inte att upptäcka i efterhand. OSM-taggen är någons faktiska iakttagelse på
 * plats, den bär licens och den går att rätta vid källan.
 *
 * ══ EN VERKSAMHET KAN LIGGA I FLERA ═════════════════════════════════════
 *
 * `cuisine=burger,pizza` är både Burgare och Pizza, och ett bageri med
 * servering är både Bageri och Café. Kategorierna är ingångar och inte fack.
 */
import type { Contact } from './kontakt';
import type { Establishment } from './db';

/** Nyckeln är också ikonnyckeln och filterradens id. */
export type MatkategoriId =
  | 'pizza'
  | 'sushi'
  | 'burgare'
  | 'kebab'
  | 'thai'
  | 'asiatiskt'
  | 'indiskt'
  | 'italienskt'
  | 'medelhav'
  | 'mellanostern'
  | 'grill'
  | 'sallad'
  | 'snabbmat'
  | 'cafe-fik'
  | 'bageri'
  | 'konditori'
  | 'glass'
  | 'bar'
  | 'livsmedel'
  | 'kiosk';

export interface Matkategori {
  id: MatkategoriId;
  /** Filterradens etikett. Kort: raden rullar och långa ord äter bredd. */
  namn: string;
  /** OSM `cuisine`-värden. */
  kok: readonly string[];
  /** OSM `amenity`-värden. */
  amenity: readonly string[];
  /** OSM `shop`-värden. */
  shop: readonly string[];
  /**
   * KOMMUNENS EGNA råvärden ur `types`, ordagrant.
   *
   * Det här fältet är det som gör raden användbar. OSM täcker 3 927 av
   * 16 047; kommunernas egen typ täcker 15 961. "Pizzeria" står i Örebros,
   * Jönköpings, Linköpings, Karlstads och Kristinehamns register och är inte
   * en gissning ur namnet utan myndighetens egen klassning av lokalen.
   *
   * BARA OTVETYDIGA ORD. categories.ts §3 varnar för att samma ord betyder
   * olika saker i olika kommuner: `Mottagningskök` är skolmat i Jönköping och
   * restaurangservering i Linköping. Orden här är valda för att de INTE har
   * det problemet. Kontrollerat per kommun 2026-08-22, och varje ord finns
   * med i kommentaren ovanför sin kategori.
   */
  typer: readonly string[];
}

/**
 * Tabellen. Ordningen är RADENS ordning och den är räknad, inte tyckt:
 * fallande antal verksamheter, mätt 2026-08-21 över de 3 927 hopparade.
 * Den som rullar minst hittar mest.
 *
 *   livsmedel 625   snabbmat 549   cafe-fik 484   pizza 311   asiatiskt 236
 *   bar 221   sushi 172   burgare 160   italienskt 136   kiosk 135
 *   bageri 117   kebab 91   medelhav 87   sallad 77   thai 76
 *   indiskt 72   konditori 63   grill 61   mellanostern 48   glass 31
 *
 * En kategori under 30 verksamheter tas inte med: tolv rutor ur trettio är
 * inte ett urval, det är listan. `frozen_yogurt`, `crepe` och `peruvian`
 * ligger därför utanför och bärs av "Alla".
 */
export const MATKATEGORIER: readonly Matkategori[] = [
  {
    id: 'livsmedel',
    namn: 'Livsmedel',
    kok: [],
    amenity: [],
    shop: [
      'supermarket',
      'convenience',
      'greengrocer',
      'butcher',
      'deli',
      'seafood',
      'cheese',
      'farm',
      'frozen_food',
      'spices',
      'health_food',
      'grocery',
    ],
    typer: [
      'Livsmedelsbutik ej hantering',
      'Livsmedelsbutik med hantering',
      'Hälsokost',
      'Med fiskdisk',
      'Med köttdisk',
    ],
  },
  {
    id: 'snabbmat',
    namn: 'Snabbmat',
    kok: ['hot_dog', 'sausage', 'chicken', 'fried_food', 'fish_and_chips'],
    amenity: ['fast_food'],
    shop: [],
    typer: [
      'Snabbmatsrestaurang',
      'Gatukök',
      'Grillad kyckling',
      'Food trucks',
      'Caféer och gatukök',
    ],
  },
  {
    id: 'cafe-fik',
    namn: 'Café',
    kok: ['coffee_shop', 'cafe', 'tea'],
    amenity: ['cafe'],
    shop: ['coffee', 'tea'],
    typer: [
      'Café',
      'Kafé',
      'Restaurang och café',
      'Café och bageri',
      'Caféer och gatukök',
    ],
  },
  {
    id: 'pizza',
    namn: 'Pizza',
    kok: ['pizza', 'italian_pizza'],
    amenity: [],
    shop: [],
    typer: ['Pizzeria', 'Restauranger och pizzerior'],
  },
  {
    id: 'asiatiskt',
    namn: 'Asiatiskt',
    kok: [
      'asian',
      'chinese',
      'japanese',
      'vietnamese',
      'korean',
      'ramen',
      'noodle',
      'dumpling',
      'wok',
      'malaysian',
      'filipino',
      'taiwanese',
      'indonesian',
    ],
    amenity: [],
    shop: [],
    typer: [],
  },
  {
    id: 'bar',
    namn: 'Bar och pub',
    kok: ['wine_bar', 'beer'],
    amenity: ['bar', 'pub', 'biergarten', 'nightclub'],
    shop: ['alcohol', 'wine', 'beverages'],
    typer: [],
  },
  {
    id: 'sushi',
    namn: 'Sushi',
    kok: ['sushi', 'poke'],
    amenity: [],
    shop: [],
    typer: [],
  },
  {
    id: 'burgare',
    namn: 'Burgare',
    kok: ['burger'],
    amenity: [],
    shop: [],
    typer: [],
  },
  {
    id: 'italienskt',
    namn: 'Italienskt',
    kok: ['italian', 'pasta'],
    amenity: [],
    shop: [],
    typer: [],
  },
  {
    id: 'kiosk',
    namn: 'Kiosk',
    kok: [],
    amenity: [],
    shop: ['kiosk', 'newsagent'],
    typer: ['Kiosk'],
  },
  {
    id: 'bageri',
    namn: 'Bageri',
    kok: ['bakery'],
    amenity: [],
    shop: ['bakery'],
    typer: [
      'Bageri',
      'Bageri/konditori',
      'Café och bageri',
      'Med bageri',
    ],
  },
  {
    id: 'kebab',
    namn: 'Kebab',
    kok: ['kebab', 'falafel', 'shawarma'],
    amenity: [],
    shop: [],
    typer: [],
  },
  {
    id: 'medelhav',
    namn: 'Medelhavet',
    kok: ['greek', 'tapas', 'spanish', 'mediterranean', 'french', 'portuguese'],
    amenity: [],
    shop: [],
    typer: [],
  },
  {
    id: 'sallad',
    namn: 'Sallad',
    kok: [
      'salad',
      'sandwich',
      'vegan',
      'vegetarian',
      'soup',
      'juice',
      'breakfast',
      'brunch',
    ],
    amenity: [],
    shop: [],
    typer: ['Med sallader'],
  },
  {
    id: 'thai',
    namn: 'Thai',
    kok: ['thai'],
    amenity: [],
    shop: [],
    typer: [],
  },
  {
    id: 'indiskt',
    namn: 'Indiskt',
    kok: ['indian', 'pakistani', 'nepalese', 'sri_lankan', 'curry'],
    amenity: [],
    shop: [],
    typer: [],
  },
  {
    id: 'konditori',
    namn: 'Konditori',
    kok: ['cake', 'dessert', 'pastry', 'chocolate'],
    amenity: [],
    shop: ['pastry', 'confectionery', 'chocolate'],
    typer: ['Bageri/konditori', 'Tillverkare av konfektyr'],
  },
  {
    id: 'grill',
    namn: 'Grill',
    kok: ['grill', 'barbecue', 'steak_house', 'american'],
    amenity: [],
    shop: [],
    typer: [],
  },
  {
    id: 'mellanostern',
    namn: 'Mellanöstern',
    kok: [
      'lebanese',
      'persian',
      'middle_eastern',
      'turkish',
      'syrian',
      'arab',
      'afghan',
      'iraqi',
      'moroccan',
    ],
    amenity: [],
    shop: [],
    typer: [],
  },
  {
    id: 'glass',
    namn: 'Glass',
    kok: ['ice_cream', 'frozen_yogurt'],
    amenity: ['ice_cream'],
    shop: [],
    typer: ['Glass'],
  },
] as const;

/**
 * Uppslagstabeller, byggda EN gång.
 *
 * Utan dem blir kategorisering av 16 047 verksamheter en genomgång av tjugo
 * kategorier gånger tre listor per verksamhet, alltså strax under en miljon
 * jämförelser per bygge. Tre Map:ar gör det till tre uppslag.
 */
function index(valj: (k: Matkategori) => readonly string[]) {
  const m = new Map<string, MatkategoriId[]>();
  for (const kategori of MATKATEGORIER) {
    for (const varde of valj(kategori)) {
      const rad = m.get(varde);
      if (rad) rad.push(kategori.id);
      else m.set(varde, [kategori.id]);
    }
  }
  return m;
}

const PER_KOK = index((k) => k.kok);
const PER_AMENITY = index((k) => k.amenity);
const PER_SHOP = index((k) => k.shop);
const PER_TYP = index((k) => k.typer);

/**
 * Kategorier som namnger MATEN. En verksamhet som hamnar i någon av dem visas
 * aldrig också under Snabbmat.
 *
 * Ägaren 2026-08-22: "snabbmat, hur kan det va en egen kategori om vi har
 * pizza osv?"
 *
 * Han sätter fingret på att tabellen blandar två axlar. Pizza, Sushi och
 * Kebab säger VAD man äter; Snabbmat säger HUR det serveras. En pizzeria är
 * nästan alltid `amenity=fast_food` OCH `cuisine=pizza`, och stod därför
 * under båda flikarna, vilket gör Snabbmat till en dubblett av allt annat.
 *
 * Snabbmat är därför en RESTPOST: snabbmat vi inte kan namnge närmare. Ett
 * ställe faller ur den så fort någon källa säger vad det faktiskt lagar.
 *
 * Café, Bar och pub, Livsmedel och Kiosk står inte i listan, och det är
 * avsiktligt: de beskriver också ett ställe och inte en maträtt, alltså kan
 * de inte krocka med Snabbmat på samma sätt. Ett café som säljer korv är
 * fortfarande ett café.
 */
const NAMNGER_MATEN = new Set<MatkategoriId>([
  'pizza',
  'sushi',
  'burgare',
  'kebab',
  'thai',
  'asiatiskt',
  'indiskt',
  'italienskt',
  'medelhav',
  'mellanostern',
  'grill',
  'sallad',
  'bageri',
  'konditori',
  'glass',
]);

export const MATKATEGORI_ORDNING: readonly MatkategoriId[] = MATKATEGORIER.map(
  (k) => k.id,
);

const PER_ID = new Map(MATKATEGORIER.map((k) => [k.id, k]));

export function matkategori(id: MatkategoriId): Matkategori {
  const k = PER_ID.get(id);
  if (!k) throw new Error(`Okänd matkategori: ${id}`);
  return k;
}

/**
 * Vilka matkategorier en verksamhet hör till. Tom lista är det normala:
 * 12 120 av 16 047 har ingen OSM-träff alls.
 *
 * ORDNINGEN ÄR EFTER SKÄRPA, INTE EFTER TABELLENS STORLEKSORDNING, och det
 * är inte en detalj: FÖRSTA posten är den kortet ritar ikon och ton efter.
 *
 * Ett `cuisine` säger vad stället LAGAR och ett `amenity` bara vad det ÄR.
 * Pizzeria Peppar bär `cuisine=pizza` och `amenity=fast_food`, alltså både
 * Pizza och Snabbmat. Med tabellordningen vann Snabbmat, eftersom den är
 * större, och kortet fick en pommesstrut medan man stod på fliken Pizza.
 * Uppmätt på skärm 2026-08-21: tre av åtta kort under Pizza gjorde det.
 *
 * Kök först, ställets slag sedan, och inom respektive halva tabellens
 * ordning. MEDLEMSKAPET är oförändrat, bara ordningen: filtret visar samma
 * verksamheter som förut under båda flikarna.
 */
export function matkategorierFor(e: Establishment): MatkategoriId[] {
  const contact: Contact | undefined = e.contact;

  /** Säger vad stället LAGAR: OSM:s `cuisine` och kommunens egen typ. */
  const skarpa = new Set<MatkategoriId>();
  /** Säger vad stället ÄR: OSM:s `amenity` och `shop`. */
  const slag = new Set<MatkategoriId>();

  for (const typ of e.types ?? []) {
    for (const id of PER_TYP.get(typ) ?? []) skarpa.add(id);
  }

  if (contact) {
    for (const del of (contact.cuisine ?? '').split(',')) {
      const varde = del.trim();
      if (!varde) continue;
      for (const id of PER_KOK.get(varde) ?? []) skarpa.add(id);
    }
    for (const id of PER_AMENITY.get(contact.amenity ?? '') ?? []) slag.add(id);
    for (const id of PER_SHOP.get(contact.shop ?? '') ?? []) slag.add(id);
  }

  // Snabbmat är en restpost, se NAMNGER_MATEN.
  if ([...skarpa].some((id) => NAMNGER_MATEN.has(id))) {
    skarpa.delete('snabbmat');
    slag.delete('snabbmat');
  }

  if (skarpa.size === 0 && slag.size === 0) return [];
  return [
    ...MATKATEGORI_ORDNING.filter((id) => skarpa.has(id)),
    ...MATKATEGORI_ORDNING.filter((id) => slag.has(id) && !skarpa.has(id)),
  ];
}

/**
 * Säger OSM att det här är ett ställe man ÄTER på?
 *
 * ══ VARFÖR FUNKTIONEN FINNS ═════════════════════════════════════════════
 *
 * Startsidans rad "Kända ställen" krävde först att verksamheten bar en
 * MATKATEGORI. Det var fel, och ägaren såg det direkt 2026-08-22: "för
 * närvarande har vi typ inga med brister som kvarstår på homepage, trots att
 * tex riche har det."
 *
 * Riche bär `amenity=restaurant`, ingen `cuisine`, och kommunens typ är
 * `Restaurang`. Ingen av de tre finns i tabellen ovan, och det är AVSIKTLIGT:
 * "Restaurang" är 8 000 rader och duger inte som filterval. Följden blev att
 * grinden sållade bort precis de bästa krogarna, Operakällaren, Ekstedt,
 * Wedholms Fisk, Den Gyldene Freden, medan kyrkor med kyrkfik slank igenom,
 * eftersom kommunen typar dem `Café` och Café ÄR en kategori.
 *
 * Frågan raden ställer är inte "vilken sorts mat" utan "är det här en
 * matplats någon kartlagt på riktig". Det svarar `amenity` och `shop` på, och
 * bara de: kommunens typ kan inte skilja ett kyrkfik från ett kafé, och det
 * ska den inte heller behöva.
 *
 * Mätt 2026-08-22 över de 210 bilderna: 33 verksamheter passerar, varav 29
 * rena, 2 med brister, 1 med brister som kvarstår och 1 utan bedömning.
 */
const ATERSTALLEN = new Set([
  'restaurant',
  'cafe',
  'bar',
  'pub',
  'fast_food',
  'ice_cream',
  'biergarten',
  'food_court',
]);

const MATBUTIKER = new Set([
  'bakery',
  'pastry',
  'confectionery',
  'deli',
  'butcher',
  'seafood',
  'greengrocer',
  'cheese',
  'supermarket',
  'convenience',
  'kiosk',
]);

export function arMatplats(e: Establishment): boolean {
  const contact: Contact | undefined = e.contact;
  if (!contact) return false;
  return (
    ATERSTALLEN.has(contact.amenity ?? '') || MATBUTIKER.has(contact.shop ?? '')
  );
}
