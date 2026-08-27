/**
 * Gatan som söktyp: namnet ur adressen, punkterna som bär det, och lådan.
 *
 * Ägaren om kartans sökfält: "najs om man skriva kungsgatan liksom, så står det
 * kungsgatan, stockholm, typ." Gatan blir en femte rad vid sidan av Kommun,
 * Stadsdel, Område och Verksamhet.
 *
 * ## Reglerna står i pipeline/prikko/gatunamn.py
 *
 * `gatunamn()` här nere är en ORDAGRANN portning av `gatunamn()` där, precis
 * som lib/slug.ts är en portning av prikko/text.py. Python-filen är källan:
 * den bär mätningarna, motiveringen till varje ändelse och de fyra ändelser
 * som prövades och föll. `pipeline/tests/test_gatunamn.py` läser BÅDA filerna
 * och fäller om `SUFFIX` glider isär.
 *
 * Kortaste versionen av regeln: en sträng är en gata om ett husnummer satt
 * sist och togs bort, ELLER om det som står kvar slutar på en gatuändelse.
 * `Räpplinge` är ingen gata, och det är hela poängen: Borgholm, Höganäs och
 * Svenljunga skriver ORTEN i adressfältet på 439 rader.
 *
 * ## En gata har ingen polygon
 *
 * Ett område skuggar: kartan svartar allt utanför konturen, se OMRÅDESSKUGGAN
 * i Karta.astro. En gata kan inte det, för vi har ingen gatugeometri och att
 * rita en korridor runt punkterna vore att publicera en gräns vi hittat på.
 * Gatan gör i stället två saker, och båda finns i filen:
 *
 *   FLYGER till `bbox`, alltså punkternas låda.
 *   FILTRERAR listan till `punkter`, alltså radnumren i kartlistan.
 *
 * ## Varför radnummer och inte namnet
 *
 * Uppdraget sade "den filtrerar på namnet". Det går inte i dag och det är värt
 * att skriva ned varför: raderna kartan filtrerar bär `i`, `v`, `m`, `nm` och
 * några valfria fält, se `props` i lib/kartrutor.ts, OCH INGEN ADRESS. Klienten
 * kan alltså inte härleda gatan ur en rad. Radnumret är samma urval uttryckt i
 * det raderna redan bär, och `omradesSvar` i Karta.astro har dessutom redan en
 * cache som är nycklad på just punkt-id.
 *
 * Priset är mätt: radnumren är ungefär två tredjedelar av filen. Skulle någon
 * vilja ha namnfiltret i stället är vägen dit att lägga en gatunyckel i
 * `props` i lib/kartrutor.ts, och då kan `punkter` här utgå.
 *
 * ## Radnumret måste vara SAMMA nummer som rutorna och kartlistan bär
 *
 * `i` sätts i lib/kartrutor.ts som index i `establishments()` filtrerad på
 * känt läge. Modulen här filtrerar med exakt samma uttryck och kontrollerar
 * sedan resultatet mot `tileSet().punkter`, punkt för punkt. Utan den
 * kontrollen hade en ändrad ordning i db.ts gett en gata som markerar fel
 * nålar, tyst och utan att något går sönder synligt. Se samma resonemang i
 * pages/kartlista/[kommun].json.ts.
 *
 * ## Bara punkter med känt läge räknas
 *
 * En verksamhet utan koordinat kan varken flygas till eller stå i kartlistan,
 * alltså kan den inte ingå i en gata heller. Räknades den ändå hade chippet
 * sagt "Kungsgatan 41" och listan visat 38 rader. Samma val som områdena
 * gjorde av samma skäl, se lib/omraden.ts.
 */
import { establishments, municipalities, type Establishment } from './db';
import { tileSet } from './kartrutor';
import { slugify } from './slug';

/**
 * Ändelser som ensamma får en sträng utan husnummer att kvala som gata.
 *
 * ORDAGRANT samma lista som `SUFFIX` i pipeline/prikko/gatunamn.py, i samma
 * ordning. Motiveringen till varje rad och de fyra som föll står där.
 */
export const SUFFIX = [
  'allé',
  'allén',
  'backen',
  'brinken',
  'esplanaden',
  'gata',
  'gatan',
  'gränd',
  'gränden',
  'gången',
  'kajen',
  'kroken',
  'leden',
  'liden',
  'plan',
  'promenaden',
  'ringen',
  'slingan',
  'spången',
  'stigen',
  'terrassen',
  'torg',
  'torget',
  'tunet',
  'vreten',
  'väg',
  'vägen',
];

/** Husnumret sist: `12`, `12 A`, `12A`, `66AB`, `5-7`. */
const HOUSE_NUMBER = /\s+\d+\s*[A-Za-zÅÄÖåäö]{0,3}(\s*[-–/]\s*\d*\s*[A-Za-zÅÄÖåäö]{0,3})?$/;

/** Husnumret utan mellanslag före: `Sjöåkravägen18`. Tre rader i Jönköping. */
const GLUED_NUMBER = /([A-Za-zÅÄÖåäö])\d+[A-Za-zÅÄÖåäö]{0,2}$/;

function endsWithSuffix(value: string): boolean {
  const low = value.toLowerCase();
  return SUFFIX.some((s) => low.endsWith(s));
}

/**
 * Delarna av en adress, i den ordning de ska prövas.
 *
 * Postorten klipps vid första kommat. Snedstreck och parenteser kan bära gatan
 * i vilken halva som helst, alltså prövas båda; utanför parentesen först.
 */
function segments(address: string): string[] {
  const whole = address.replace(/\s+/g, ' ').trim();
  if (!whole) return [];

  const head = whole.split(',')[0].trim();
  if (!head) return [];

  const inside = [...head.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]);
  const outside = head.replace(/\([^)]*\)/g, ' ');

  const parts: string[] = [];
  for (const chunk of [outside, ...inside]) {
    for (const piece of chunk.split('/')) {
      const trimmed = piece.replace(/\s+/g, ' ').trim();
      if (trimmed) parts.push(trimmed);
    }
  }
  return parts;
}

function streetOfSegment(segment: string): string | null {
  const stripped = segment.replace(HOUSE_NUMBER, '').trim();
  if (stripped && stripped !== segment) return stripped;

  if (endsWithSuffix(segment)) return segment;

  const glued = segment.replace(GLUED_NUMBER, '$1').trim();
  if (glued && glued !== segment && endsWithSuffix(glued)) return glued;

  return null;
}

/**
 * Gatunamnet ur en adress, eller null när raden inte bär någon gata.
 *
 * null är ett svar och inte ett fel: 1 774 rader saknar adress och 505 bär en
 * ort, ett hus eller en fastighetsbeteckning i stället för en gata.
 */
export function gatunamn(address: string | null | undefined): string | null {
  for (const segment of segments(address ?? '')) {
    const street = streetOfSegment(segment);
    if (street) return street;
  }
  return null;
}

/** Jämförelsenyckeln för två skrivningar av samma gata. */
export function jamforelsenyckel(name: string): string {
  return name.replace(/\s+/g, ' ').trim().normalize('NFC').toLowerCase();
}

/** Antal ord med stor begynnelsebokstav. Skiljer lika vanliga skrivningar. */
function capitals(name: string): number {
  return name.split(' ').filter((w) => w.slice(0, 1) !== w.slice(0, 1).toLowerCase()).length;
}

/**
 * Den skrivning som ska visas.
 *
 * Total och deterministisk: antal, sedan stora begynnelsebokstäver, sedan
 * bokstavsordning. 217 av gatorna skrivs på mer än ett sätt i samma kommun,
 * alltid samma skillnad: `Västra Storgatan` mot `Västra storgatan`.
 */
export function kanoniskForm(forms: Map<string, number>): string {
  return [...forms.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    const ca = capitals(a[0]);
    const cb = capitals(b[0]);
    if (cb !== ca) return cb - ca;
    return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
  })[0][0];
}

/**
 * Minsta antal verksamheter för att en gata ska erbjudas i sökfältet.
 *
 * "En gata med en enda verksamhet är inte en sökträff, den är verksamheten
 * själv och hittas på sitt namn." Talet är alltså 2.
 *
 * FÖRDELNINGEN, räknad på de 13 768 verksamheter som HAR en gata, varav
 * 12 745 också har ett känt läge och alltså är de som filen bygger på:
 *
 *     3 440 gator i sju kommuner
 *     1 668 av dem har exakt en verksamhet
 *       610 har två, 318 har tre, 209 har fyra, 144 har fem
 *
 * Halva beståndet är alltså engångsgator, och därefter faller kurvan jämnt
 * utan knä. Den enda gräns som betyder något är den mellan en och flera.
 * Tröskel 2 lämnar 1 772 gator kvar; tröskel 3 lämnar 1 162, alltså 610
 * färre gator — och just tvåorna är de en sökande minst kan hitta på annat
 * sätt. Priset för att behålla dem är 17 kB gzippat i hela landet, 71 mot
 * 54, se pages/gatunamn/[kommun].json.ts.
 *
 * Samma tal som `TROSKEL` i pipeline/prikko/gatunamn.py.
 */
export const TROSKEL = 2;

export interface Gata {
  /**
   * `gata/<kommun>/<slug>`. Tre led, aldrig två, så att nyckeln ALDRIG kan
   * krocka med ett områdes `<kommun>/<slug>` i samma chipsamling. `Hötorget`
   * kan vara både en gata och ett område, och två chips med samma nyckel hade
   * blivit ett.
   */
  nyckel: string;
  /** Kommunens slug. Avgör vilken kartlista raderna hör hemma i. */
  kommun: string;
  /** Gatans namn i den skrivning som ska visas. */
  namn: string;
  /** Gatans slug. Tredje ledet i nyckeln. */
  slug: string;
  /** Antal verksamheter med känt läge. Rangordnar förslagen. */
  antal: number;
  /** [väst, syd, öst, nord]. Kartan flyger hit; gatan skuggar aldrig. */
  bbox: [number, number, number, number];
  /** Radnumren i kartlistan, stigande. Samma `i` som rutorna bär. */
  punkter: number[];
}

/**
 * Verksamheterna med känt läge, i SAMMA ordning som `i` i rutorna.
 *
 * Uttrycket är ordagrant detsamma som i `build()` i lib/kartrutor.ts. Att det
 * står två gånger är avsiktligt och kontrolleras nedan i stället för att lösas
 * med en delad hjälpare: kartrutor.ts ägs av kartan och ska inte behöva ändras
 * för att gatorna kom till.
 */
function placerade(): Establishment[] {
  return establishments().filter((e) => e.lat !== null && e.lng !== null);
}

let cache: Map<string, Gata[]> | null = null;

function build(): Map<string, Gata[]> {
  const rows = placerade();
  const punkter = tileSet().punkter;

  /*
   * GRINDEN. Radnumret binder en gata till en nål, och binder det fel pekar
   * chippet ut andra verksamheter än det säger. Felet är osynligt i ett grönt
   * bygge, alltså kontrolleras det här och inte i en test.
   */
  if (rows.length !== punkter.length) {
    throw new Error(
      `gatunamn: ${rows.length} placerade verksamheter men ${punkter.length} punkter i rutorna`,
    );
  }

  interface Rakning {
    forms: Map<string, number>;
    punkter: number[];
    west: number;
    south: number;
    east: number;
    north: number;
  }
  const perKommun = new Map<string, Map<string, Rakning>>();

  rows.forEach((e, i) => {
    const p = punkter[i];
    if (p.props.i !== i || p.lng !== e.lng || p.lat !== e.lat) {
      throw new Error(`gatunamn: punkt ${i} stämmer inte med verksamheten på samma plats`);
    }

    const street = gatunamn(e.address);
    if (!street) return;

    const kommun = e.municipality.slug;
    let per = perKommun.get(kommun);
    if (!per) {
      per = new Map();
      perKommun.set(kommun, per);
    }

    const key = jamforelsenyckel(street);
    let r = per.get(key);
    if (!r) {
      r = {
        forms: new Map(),
        punkter: [],
        west: e.lng!,
        south: e.lat!,
        east: e.lng!,
        north: e.lat!,
      };
      per.set(key, r);
    }
    r.forms.set(street, (r.forms.get(street) ?? 0) + 1);
    r.punkter.push(i);
    r.west = Math.min(r.west, e.lng!);
    r.east = Math.max(r.east, e.lng!);
    r.south = Math.min(r.south, e.lat!);
    r.north = Math.max(r.north, e.lat!);
  });

  const out = new Map<string, Gata[]>();
  for (const [kommun, per] of perKommun) {
    const gator: Gata[] = [];
    /*
     * Slugarna dedupliceras inte utan KONTROLLERAS. Noll krockar i dagens
     * bestånd, och en krock är inte något att lappa över med en siffra på
     * slutet: två gator som ger samma slug betyder att `slugify` tappat något
     * som skiljer dem åt, och det ska läsas innan det döljs.
     */
    const sedda = new Set<string>();
    for (const r of per.values()) {
      if (r.punkter.length < TROSKEL) continue;
      const namn = kanoniskForm(r.forms);
      const slug = slugify(namn);
      if (sedda.has(slug)) {
        throw new Error(`gatunamn: ${kommun} har två gator med slugen ${slug}`);
      }
      sedda.add(slug);
      gator.push({
        nyckel: `gata/${kommun}/${slug}`,
        kommun,
        namn,
        slug,
        antal: r.punkter.length,
        /* Fyra decimaler, alltså drygt tio meter. Lådan är ett kameramål och
           inte en gräns; en decimal till hade lagt fyra tusen tecken i
           Stockholms fil för en skillnad ingen kan se. */
        bbox: [
          Math.round(r.west * 1e4) / 1e4,
          Math.round(r.south * 1e4) / 1e4,
          Math.round(r.east * 1e4) / 1e4,
          Math.round(r.north * 1e4) / 1e4,
        ],
        punkter: r.punkter,
      });
    }
    /* Störst först. Filen läses av ett sökfält som rangordnar på antal, och en
       sorterad fil gör att en oändrad ordning i beståndet ger en oändrad fil. */
    gator.sort((a, b) => b.antal - a.antal || (a.slug < b.slug ? -1 : 1));
    if (gator.length > 0) out.set(kommun, gator);
  }
  return out;
}

/** Gatorna i en kommun, störst först. Tom lista när kommunen inte har några. */
export function gator(kommun: string): Gata[] {
  if (!cache) cache = build();
  return cache.get(kommun) ?? [];
}

/** Kommuner som har minst en gata över tröskeln. Avgör vilka filer som byggs. */
export function kommunerMedGator(): string[] {
  if (!cache) cache = build();
  return municipalities()
    .map((m) => m.slug)
    .filter((slug) => (cache!.get(slug)?.length ?? 0) > 0);
}
