/**
 * Kartans punkter som en förgenererad rutpyramid, hela riket i EN fil.
 *
 * Ersätter `map-data.ts`, som lägger en fil per kommun. Skälet står i sin
 * helhet i docs/23_rikskartan.md och i korthet här: en kommunfil kan bara svara
 * på "vad finns i Linköping", medan en rikskarta ställer frågan "vad finns i
 * den här rektangeln". Ingen kommunfil svarar på den, och en geografisk
 * uppdelning som vanliga filer blir 15 000 till 30 000 rutor vid full täckning
 * mot de 3 466 vi har kvar till Cloudflare Pages tak på 20 000 filer.
 *
 * Adressen är innehållsbaserad, som sökregistret och kartdatan före den. Se
 * `search-index.ts` för resonemanget i sin helhet.
 *
 * ## Klustringen görs här, inte hos besökaren
 *
 * `cluster: true` på en GeoJSON-källa i MapLibre ÄR supercluster i en arbetare.
 * Vi byter alltså inte klusterverktyg, vi flyttar samma verktyg med samma
 * parametrar från besökarens telefon till bygget. Kartan ska se likadan ut
 * efteråt, och det är ett krav.
 *
 * EN DETALJ SOM KOSTADE EN FELMÄTNING. MapLibre skalar `clusterRadius` innan
 * supercluster får den:
 *
 *     radius = clusterRadius * (EXTENT / tileSize)
 *
 * med EXTENT 8192 och tileSize 512, alltså faktor 16. Skrivs `radius: 38` rakt
 * av mot vår `extent` klustrar bygget åtta gånger för hårt: första mätningen
 * gav 2 443 oklustrade namngivna punkter i en enda z11-ruta och ett arkiv på
 * 2,25 MB i stället för 1,38. Kvoten räknas därför fram ur EXTENT nedan och
 * skrivs aldrig av.
 *
 * ## Vad rutorna bär, och varför allt
 *
 * Nålarna bär allt som listan och kortet behöver. Alternativet, att bara bära
 * ett id och hämta resten, hade lagt en andra rundtur mitt i en panorering, och
 * det är precis den väntan hela den här lösningen finns för att slippa. Rutan
 * hämtas ändå bara för det utsnitt man tittar på: en typisk ruta är under en
 * kilobyte, den tyngsta i landet 27 kB.
 *
 * Två saker skickas inte. Slugen härleds ur namnet och skickas bara när
 * härledningen inte stämmer, med samma grind som `map-data.ts`: bygget jämför
 * alltid mot den slug pipelinen satte. Kommunens namn ersätts av ett index mot
 * ordboken `MUNICIPALITY_KEYS`, eftersom en rikskarta inte har en enda kommun
 * att utgå från när den bygger en länk.
 */
import { createHash } from 'node:crypto';
import Supercluster from 'supercluster';
import vtpbf from 'vt-pbf';
import { TOP_CATEGORIES } from './categories';
import { categoriesOf, establishments, latestInspectionDate, municipalities } from './data';
import { TILE_LAYER } from './kartbas';
import { writePMTiles } from './pmtiles';
import { slugify } from './slug';

/** Ordningen är siffran i `v`. 3 = ingen bedömning. Samma som map-data.ts. */
export const MAP_VERDICTS = ['clean', 'minor', 'major'] as const;

/** Nollpunkt för `dt`. Före första kontrollen i beståndet, och rund. */
export const MAP_EPOCH = '2020-01-01';

/**
 * Lagrets namn i rutorna. Måste stämma med `source-layer` i kartans lager.
 *
 * Definitionen bor i lib/kartbas.ts och återexporteras här, för att den här
 * filen inte går att importera från ett <script>: den drar in node:crypto,
 * supercluster, vt-pbf och hela datalagret. Motiveringen står i sin helhet
 * där. Skriv alltså inte tillbaka ett eget värde här, och skriv aldrig
 * strängen för hand i ett kartlager.
 */
export { TILE_LAYER };

/**
 * Djupaste nivån som faktiskt genereras. Mätt: z15 kostar 2,27 MB och z16
 * 3,36 mot z14:s 1,38, och den TYNGSTA rutan krymper inte av någon av dem,
 * eftersom z14-rutorna finns kvar och det är de som väger. Över maxzoom
 * överzoomar MapLibre den ruta den redan har, gratis och ur cachen.
 */
const MAXZOOM = 14;

/** Rutans eget rutnät. 4096 är det gängse i Mapbox Vector Tile. */
const EXTENT = 4096;

/*
 * De tre talen som avgör hur mycket blått man ser.
 *
 * ══ ÄGARENS INVÄNDNING 2026-08-25 ═════════════════════════════════════════
 *
 * "kan vi undvika dom där blåa prickarna som säger 340+, jag förstår att det
 * behövs ibland, men kan vi sänka threshold, dvs visa fler markörer om
 * möjligt", och strax efter: "booli har också inte att man måste zooma in så
 * långt för att se nålar."
 *
 * Han har rätt, och Boolis karta är mätt 2026-08-25 för att visa hur långt
 * ifrån vi låg. De klustrar inte i klienten alls. Aggregeringen ligger i
 * vektorbrickan och cellen är en rutnätscell på kartans zoom PLUS ÅTTA,
 * alltså ungefär två pixlar. I praktiken betyder det att ett "kluster" hos
 * dem är objekt på SAMMA ADRESS, ingenting annat. Uppmätt över Linköpings
 * kommun vid zoom 8,73: 960 figurer för 1 155 objekt, varav 551 var ensamma
 * nålar. Alltså syns hälften som egna nålar redan på en zoom där hela
 * kommunen ryms i rutan.
 *
 * Vi låg på 38 pixlars radie och släppte inte fram en enda nål förrän z14.
 *
 * ══ VAD SOM ÄNDRADES OCH VARFÖR JUST DE TALEN ═════════════════════════════
 *
 * ══ ÄGARENS AVVÄGNING, OCH DEN ÄR HANS ATT GÖRA ═══════════════════════════
 *
 * "jag har det hellre att några prickar kanske inte syns, än att köra dom där
 * blå rutorna med siffror i så långt ut, liksom jag vill att det ska se
 * proppfullt ut i stockholm nästan."
 *
 * Det avgör frågan, och det är värt att skriva ned VILKEN fråga det är. En
 * bubbla är ett byte: man ger upp att se de enskilda ställena för att slippa
 * nålar som ligger ovanpå varandra. Ägaren väljer den andra sidan av det
 * bytet. En karta som ser tät ut säger sanningen om Stockholm, som har 8 520
 * verksamheter; en karta med fjorton blå rutor på säger ingenting alls, och
 * en ruta med "340+" i är dessutom ett tal ingen kan använda till något.
 *
 * ══ TALEN ═════════════════════════════════════════════════════════════════
 *
 * Radien 38 till 12. Trettioåtta pixlar är ungefär en stadsdel på z12 och
 * slår ihop krogar som ligger på olika gator. Tolv är mindre än en nåls egen
 * bredd, alltså slås bara det ihop som faktiskt ligger på samma punkt.
 *
 * Minsta antalet 5 till 3. Under tre punkter ritades de redan som egna nålar;
 * med tre går även trean och fyran fram, och en bubbla med en trea i är den
 * mest meningslösa bubblan som finns.
 *
 * Maxzoomen 13 till 8, och åttan är RÄKNAD och inte vald på känsla.
 *
 * Supercluster klustrar för zoom mindre än eller lika med maxzoomen, och
 * MapLibre begär rutan på golvet av kartans zoom. Stockholms kartsida öppnar
 * på ungefär 10,7, alltså hämtas ruta z10. Med maxzoomen på 10 var den rutan
 * fortfarande klustrad, och öppningsvyn såg ut precis som förut trots att
 * radien var sänkt två gånger. Först på 9 blir öppningsvyn råa punkter, och
 * 8 ger en marginal för de kommuner som öppnar vidare än Stockholm.
 *
 * Över åttan klustras ingenting alls. Bubblorna finns kvar bara på den zoom
 * där man ser flera län samtidigt och de faktiskt bär en upplysning.
 *
 * Boolis motsvarighet, uppmätt 2026-08-25: de klustrar inte i klienten alls,
 * cellen är ungefär två pixlar, och `icon-allow-overlap: true` gör att
 * ingenting göms av kollision. Vid zoom 8,73 över Linköpings kommun ritade de
 * 551 ensamma nålar av 1 155 objekt. Vi landar nu på samma sida av bytet.
 *
 * Priset är fler figurer per ruta, och det är rutgrinden i astro.config.mjs
 * som vaktar det: den mäter tyngsta rutan uppackad vid varje bygge och fäller
 * om arkivet blir för dyrt. Talen efter ändringen står i byggets utskrift.
 */
const CLUSTER_RADIUS_PX = 12;
const CLUSTER_MIN_POINTS = 3;
const CLUSTER_MAX_ZOOM = 8;

const DAY = 86_400_000;
const epochMs = Date.parse(MAP_EPOCH);

/**
 * Utsnitt och tal för EN vy: hela riket, eller en kommun.
 *
 * Kartsidan behöver samma fyra saker vare sig den öppnar på Sverige eller på
 * Linköping, och sedan `/karta/` finns är kommunen inte längre given. Därför
 * ligger de här och inte i en kommunspecifik modul.
 */
export interface Utsnitt {
  /** Antal punkter i vyn. */
  count: number;
  /** [väst, syd, öst, nord]. Kartan öppnar på den här utsträckningen. */
  bounds: [number, number, number, number];
  /** Punkter per bedömning, index som MAP_VERDICTS plus 3 för obedömda. */
  counts: [number, number, number, number];
  /**
   * Alla koordinater i vyn är geokodade ur adressen i stället för lämnade av
   * kommunen, och kartan ska då bära förbehållet om beräknade lägen. Per
   * kommun, eftersom källorna är det: en kommun lämnar antingen koordinater
   * eller inga alls.
   */
  derived: boolean;
}

export interface TileSet extends Utsnitt {
  /**
   * Varje punkt i beståndet, i den ordning `i` pekar på dem.
   *
   * Samma array som rutorna byggs av, alltså samma egenskaper och SAMMA
   * radnummer. Att den ligger här är hela villkoret för att listan ska kunna
   * drivas av ett urval i stället för av kameran: rutorna bär bara det
   * kartan tittar på, och ett urval som spänner ett land kan inte hämta sina
   * rader ur dem. Se pages/kartlista/[kommun].json.ts.
   *
   * Den serveras ALDRIG som den är. Fältet finns för att rutten bredvid ska
   * kunna dela upp den per kommun utan att bygga om beståndet en andra gång,
   * och en andra uppbyggnad hade dessutom kunnat numrera raderna annorlunda,
   * vilket är exakt det fel som bryter kopplingen mellan en rad och en nål.
   */
  punkter: Punkt[];
  /** Antal rutor i arkivet. */
  tiles: number;
  /** Kommunernas slugar i den ordning `m` i rutorna pekar på dem. */
  keys: string[];
  /** Utsnitt och tal per kommun, för de kommuner som har minst en punkt. */
  perKommun: Map<string, Utsnitt>;
  /** Rader vars slug inte gick att härleda. Bara för rapportering. */
  slugOverrides: number;
  body: Buffer;
  hash: string;
  url: string;
}

export interface Punkt {
  lng: number;
  lat: number;
  props: Record<string, string | number>;
}

/**
 * Ytterkanten på en mängd punkter, beskuren mot de yttersta halvprocenten.
 *
 * Rå min och max går sönder på en enda felkodad koordinat. Stockholm har
 * verksamheter registrerade på adresser långt utanför kommunen, och en karta
 * som öppnar på hela den utsträckningen visar mest Östersjön. Punkten FINNS
 * kvar i rutorna, den ligger bara utanför det första utsnittet.
 */
function extent(values: number[]): [number, number] {
  const sorted = [...values].sort((a, b) => a - b);
  return [
    sorted[Math.floor(sorted.length * 0.005)],
    sorted[Math.ceil(sorted.length * 0.995) - 1],
  ];
}

/**
 * Hur nära två punkter måste ligga för att räknas som SAMMA ADRESS.
 *
 * Koordinaterna är avrundade till hundratusendels grad, ungefär en meter, så
 * två verksamheter i samma hus har oftast identiska tal. Tröskeln ligger ändå
 * något över noll: en gallerias verksamheter kan ha geokodats mot samma adress
 * med en meters spridning, och för en besökare är det samma plats. Tre
 * hundratusendelar är omkring tre meter i nordsydlig led, alltså inom en
 * byggnad och aldrig två grannhus.
 *
 * Talet MÅSTE vara detsamma som `SAMMA_PLATS` i Karta.astro. Bygget sätter
 * brickan, webbläsaren bygger gruppen bakom den, och pekar de på olika
 * adresser säger brickan sex medan kortet bläddrar bland fem.
 */
const SAMMA_PLATS = 3e-5;

/**
 * Den nål som bär brickan för en adress: den SÄMSTA bedömningen i gruppen.
 *
 * Inte den första i bokstavsordning. Skälet är samma som ritordningen på
 * kartan redan följer: en anmärkning får aldrig gömmas under en granne som
 * klarade sig. Ligger ett rött och ett grönt ansikte på samma adress är det
 * röda det som syns, och bläddringen i kortet visar båda.
 *
 * Ordningen 2, 1, 0, 3 och inte rakt fallande, eftersom 3 betyder ingen
 * bedömning och inte "värst". Samma tabell som `ALLVAR` i Karta.astro.
 */
const ALLVAR = [2, 1, 0, 3];

/**
 * Kategorin som en bitmask, och varför det inte är ett tal.
 *
 * 1,4 procent av beståndet hör hemma i två toppkategorier samtidigt, främst
 * Stockholm där `1. Café` och `1. Restaurang` står på samma verksamhet. Båda
 * är sanna, och ett fält som bara rymmer den ena hade tappat halva sanningen
 * för just de raderna. En bitmask rymmer alla fem i ett tal.
 *
 * Bitordningen är TOP_CATEGORIES ordning, alltså restaurang, café, butik,
 * skola, övrigt. `kategoriBitar()` nedan är den enda källan för den
 * översättningen, och kartan läser den i stället för att räkna ut den igen.
 *
 * Okänt får INGEN bit, av samma skäl som `categories.ts` skiljer okänt från
 * övrigt: fältet utelämnas, och en verksamhet vi inte kan kategorisera visas
 * därför inte under någon kategori i stället för att gömmas under fel.
 */
export function kategoriBitar(): Record<string, number> {
  const ut: Record<string, number> = {};
  TOP_CATEGORIES.forEach((c, i) => {
    ut[c.slug] = 1 << i;
  });
  return ut;
}

const KATEGORI_BIT = new Map(TOP_CATEGORIES.map((c, i) => [c.id, 1 << i]));

function collect(): { punkter: Punkt[]; keys: string[]; set: Omit<TileSet, 'body' | 'hash' | 'url' | 'tiles'> } {
  const keys = municipalities().map((m) => m.slug);
  const keyIndex = new Map(keys.map((s, i) => [s, i]));

  const punkter: Punkt[] = [];
  const counts: [number, number, number, number] = [0, 0, 0, 0];
  let slugOverrides = 0;

  /** Per kommun: bedömningar, koordinater och om varje läge är härlett. */
  const perKommun = new Map<
    string,
    { counts: [number, number, number, number]; lngs: number[]; lats: number[]; derived: boolean }
  >();

  const rows = establishments().filter((e) => e.lat !== null && e.lng !== null);

  rows.forEach((e, i) => {
    const lng = e.lng!;
    const lat = e.lat!;

    const raw = e.verdict ? MAP_VERDICTS.indexOf(e.verdict) : 3;
    const v = raw < 0 ? 3 : raw;
    counts[v] += 1;

    let per = perKommun.get(e.municipality.slug);
    if (!per) {
      per = { counts: [0, 0, 0, 0], lngs: [], lats: [], derived: true };
      perKommun.set(e.municipality.slug, per);
    }
    per.counts[v] += 1;
    per.lngs.push(lng);
    per.lats.push(lat);
    /* `derived` betyder att INGEN koordinat i kommunen kommer från kommunen
       själv. Villkoret räknar varje källa vi själva härlett ur adressen, alltså
       även Lantmäteriets belägenhetsadressregister. Se samma anteckning i
       map-data.ts, där en tidigare formulering ritade en adress slagen mot
       registret som om kommunen publicerat punkten. */
    if (e.geoSource === undefined) per.derived = false;

    /*
     * All blankrymd pressas till ett mellanslag. Två av Stockholms namn
     * innehåller själva CRLF, dubblerade av källan. Här kostar det inte samma
     * sak som i kolumnformatet, där ett sådant namn sköt HELA namnkolumnen ur
     * fas, men ett namn med radbrytning i ett kort är fel ändå.
     */
    const name = e.name.replace(/\s+/g, ' ').trim();

    const props: Record<string, string | number> = {
      i,
      v,
      m: keyIndex.get(e.municipality.slug) ?? 0,
      nm: name,
    };

    // Grinden: härledningen jämförs alltid mot verkligheten. Se lib/slug.ts.
    if (slugify(name) !== e.slug) {
      props.s = e.slug;
      slugOverrides += 1;
    }

    const type = e.types[0];
    if (type) props.ty = type;

    let kat = 0;
    for (const id of categoriesOf(e).categories) kat |= KATEGORI_BIT.get(id) ?? 0;
    if (kat) props.c = kat;

    const date = latestInspectionDate(e);
    if (date) props.dt = Math.round((Date.parse(date) - epochMs) / DAY);

    if (e.inspections.length > 0) props.k = e.inspections.length;
    if (e.distinction) props.u = 1;

    /*
     * Bildens adress, och bara när den finns.
     *
     * Listraderna i den delade vyn bär sedan 2026-08-26 en bildyta, och 366 av
     * 16 047 verksamheter har ett riktigt foto. Resten får en ritad
     * platshållare som ligger i CSS och alltså inte kostar en byte i rutan.
     *
     * URL:en är VÅR egen kopia i objektlagringen, aldrig källans, se
     * StreetImage i lib/db.ts. Att i stället bära ett id och slå upp adressen
     * hade lagt en andra rundtur mitt i en panorering, vilket är precis det
     * hela rutlösningen finns för att slippa.
     *
     * Kostnaden är mätt och inte uppskattad: 366 adresser à ungefär 150 tecken
     * är 55 kB i hela landet, utspritt över de rutor som råkar innehålla en av
     * dem, och rutorna är dessutom komprimerade. En rad utan bild bär ingen
     * nyckel alls.
     */
    if (e.image?.url) props.b = e.image.url;

    punkter.push({ lng, lat, props });
  });

  /*
   * Antalsbrickan, satt här i stället för i webbläsaren.
   *
   * Kartan ritar en liten blå ring med en siffra i nålens övre högra hörn för
   * adresser där mer än en verksamhet ligger. Förut räknades den om i klienten
   * vid varje filterändring, ur hela kommunens punktlista. Den listan finns
   * inte längre: klienten ser bara det som ligger i de rutor den hämtat.
   *
   * `h: 1` sätts på den nål som ska bära brickan och `n` på hur många adressen
   * rymmer. Bara BÄRAREN får fälten. De andra nålarna i stapeln ritas som
   * vanligt, eftersom tolv identiska nålar ovanpå varandra ser ut som en, och
   * de kostar inget att utelämna fälten på.
   *
   * Följden är att brickan alltid säger hur många som FINNS på adressen, även
   * när ett filter är på. Det är avsiktligt: en bricka som säger tre för att
   * sökningen råkar träffa tre av tolv beskriver sökningen och inte platsen.
   */
  const rutor = new Map<string, Punkt[]>();
  for (const p of punkter) {
    const nyckel = Math.round(p.lng / SAMMA_PLATS) + ':' + Math.round(p.lat / SAMMA_PLATS);
    const lista = rutor.get(nyckel);
    if (lista) lista.push(p);
    else rutor.set(nyckel, [p]);
  }
  for (const lista of rutor.values()) {
    if (lista.length < 2) continue;
    let barare = lista[0];
    for (const p of lista) {
      if (ALLVAR.indexOf(p.props.v as number) < ALLVAR.indexOf(barare.props.v as number)) barare = p;
    }
    barare.props.h = 1;
    barare.props.n = lista.length;
  }

  const utsnitt = (lngs: number[], lats: number[]): [number, number, number, number] => {
    const [w, e] = extent(lngs);
    const [s, n] = extent(lats);
    return [w, s, e, n];
  };

  return {
    punkter,
    keys,
    set: {
      count: punkter.length,
      bounds: utsnitt(
        punkter.map((p) => p.lng),
        punkter.map((p) => p.lat),
      ),
      keys,
      counts,
      /* Rikskartan bär förbehållet bara om VARENDA läge i landet är härlett,
         vilket det inte är så snart en enda kommun lämnar egna koordinater.
         I praktiken alltså false, och det är rätt: en mening om att platserna
         kan ligga några tiotal meter fel hör hemma där den gäller. */
      derived: [...perKommun.values()].every((v) => v.derived),
      perKommun: new Map(
        [...perKommun].map(([slug, v]) => [
          slug,
          {
            count: v.lngs.length,
            bounds: utsnitt(v.lngs, v.lats),
            counts: v.counts,
            derived: v.derived,
          },
        ]),
      ),
      slugOverrides,
    },
  };
}

function tileXY(lon: number, lat: number, z: number): [number, number] {
  const n = 2 ** z;
  const la = (lat * Math.PI) / 180;
  return [
    Math.floor(((lon + 180) / 360) * n),
    Math.floor(((1 - Math.log(Math.tan(la) + 1 / Math.cos(la)) / Math.PI) / 2) * n),
  ];
}

function build(): TileSet {
  const { punkter, set } = collect();

  const index = new Supercluster({
    /* Se modulkommentaren. Faktorn är MapLibres egen och skrivs aldrig av. */
    radius: CLUSTER_RADIUS_PX * (EXTENT / 512),
    minPoints: CLUSTER_MIN_POINTS,
    maxZoom: CLUSTER_MAX_ZOOM,
    extent: EXTENT,
    minZoom: 0,
  });

  index.load(
    punkter.map((p) => ({
      type: 'Feature' as const,
      properties: p.props,
      geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
    })),
  );

  /*
   * Klustrets svar bakas in i klustret.
   *
   * `getClusterExpansionZoom` och `getClusterLeaves` finns bara på en
   * GeoJSON-källa, och den försvinner med det här bytet. De två anropen är
   * dessutom asynkrona i dag, alltså en väntan mitt i ett klick. Frågan ställs
   * här i stället, en gång, och svaret följer med rutan: `ez` är den zoom där
   * klustret slutar slås ihop, `bx` är lövens utbredning. `delaKluster()` i
   * webbläsaren blir därmed synkron och gör exakt samma sak som förut.
   */
  const svar = new Map<number, { ez: number; bx: string }>();

  function klustersvar(id: number): { ez: number; bx: string } {
    const cached = svar.get(id);
    if (cached) return cached;

    const lov = index.getLeaves(id, Infinity);
    let w = 180;
    let s = 90;
    let e = -180;
    let n = -90;
    for (const l of lov) {
      const [x, y] = l.geometry.coordinates;
      if (x < w) w = x;
      if (x > e) e = x;
      if (y < s) s = y;
      if (y > n) n = y;
    }

    const ut = {
      ez: index.getClusterExpansionZoom(id),
      // Fem decimaler är ungefär en meter, samma precision som pipelinen
      // lagrar. En sträng och inte fyra fält: MVT lägger nyckelnamnen i en
      // ordbok per ruta, men fyra tal är ändå fyra poster i värdelistan.
      bx: [w, s, e, n].map((v) => v.toFixed(5)).join(','),
    };
    svar.set(id, ut);
    return ut;
  }

  const tiles = new Map<string, Buffer>();

  for (let z = 0; z <= MAXZOOM; z += 1) {
    /*
     * Bara rutor som innehåller minst en punkt. Ett kluster kan inte hamna i en
     * tom ruta: dess mittpunkt är medelvärdet av medlemmarnas lägen och ligger
     * därmed i det konvexa höljet av dem, alltså i en ruta som redan har en
     * punkt. Mängden här är därför en övermängd av det som faktiskt ritas.
     */
    const rutor = new Set<string>();
    for (const p of punkter) rutor.add(tileXY(p.lng, p.lat, z).join('/'));

    for (const key of rutor) {
      const [tx, ty] = key.split('/').map(Number);
      const tile = index.getTile(z, tx, ty);
      if (!tile || tile.features.length === 0) continue;

      for (const f of tile.features) {
        const tags = f.tags as Record<string, unknown>;
        if (!tags.cluster) continue;
        const { ez, bx } = klustersvar(tags.cluster_id as number);
        tags.ez = ez;
        tags.bx = bx;
        /* `cluster_id` behövs inte längre av någon, och det är ett stort tal
           per bubbla. Svaren det ledde till ligger redan i rutan. */
        delete tags.cluster_id;
      }

      tiles.set(
        `${z}/${tx}/${ty}`,
        Buffer.from(vtpbf.fromGeojsonVt({ [TILE_LAYER]: tile }, { version: 2, extent: EXTENT })),
      );
    }
  }

  const archive = writePMTiles(tiles, {
    name: 'Prikko',
    minzoom: 0,
    maxzoom: MAXZOOM,
    bounds: set.bounds,
    /* Sverige i sin helhet ligger på ungefär z4 i en kartruta av vår storlek.
       Talet läses bara av verktyg som öppnar arkivet fristående. */
    centerzoom: 4,
    vector_layers: [
      {
        id: TILE_LAYER,
        minzoom: 0,
        maxzoom: MAXZOOM,
        fields: {
          i: 'Number',
          v: 'Number',
          m: 'Number',
          nm: 'String',
          s: 'String',
          ty: 'String',
          c: 'Number',
          dt: 'Number',
          k: 'Number',
          u: 'Number',
          h: 'Number',
          n: 'Number',
          cluster: 'Boolean',
          point_count: 'Number',
          point_count_abbreviated: 'String',
          ez: 'Number',
          bx: 'String',
        },
      },
    ],
  });

  const hash = createHash('sha256').update(archive.buffer).digest('hex').slice(0, 12);

  return {
    ...set,
    punkter,
    tiles: archive.tiles,
    body: archive.buffer,
    hash,
    /*
     * `.bin` och inte `.pmtiles`. Ändelsen är inte kosmetik, den avgör om
     * kartan fungerar.
     *
     * Cloudflares kant cachar efter FILÄNDELSE, ur en fast lista, och läser
     * inte vårt `Cache-Control` för att avgöra saken. Mätt mot prikko.se
     * 2026-08-11, med `_headers` redan på plats:
     *
     *   /_astro/*.js      max-age=14400, must-revalidate   REVALIDATED
     *   /favicon.svg      max-age=14400, must-revalidate   REVALIDATED
     *   /og-default.png   max-age=14400, must-revalidate   REVALIDATED
     *   /sok-index/*.json max-age=31536000, immutable      DYNAMIC
     *   *.pmtiles         max-age=31536000, immutable      DYNAMIC
     *
     * Ett år och `immutable` hjälpte alltså ingenting, och fyra timmar med
     * `must-revalidate` räckte. Det som skiljer raderna åt är ändelsen.
     * `.pmtiles` och `.json` står inte på listan, `.bin` gör det.
     *
     * Och det är räckvidden som hänger på det: kanten besvarar `Range` ur sin
     * cache, en DYNAMIC-förfrågan strömmas rakt igenom och svarar 200 med hela
     * filen, och då hittar PMTiles ingen ruta. Se `docs/23_rikskartan.md`.
     *
     * Innehållet är oförändrat. PMTiles-läsaren bryr sig inte om vad filen
     * heter, den läser magin i de första sju byten.
     */
    url: `/kartrutor/punkter-${hash}.bin`,
  };
}

/**
 * Byggs en gång per byggprocess och delas. Kartsidan, rutten som skriver filen
 * och kommunhubben läser alla samma arkiv, och att bygga om pyramiden per sida
 * vore orimligt. Samma skäl och samma mönster som `search-index.ts`.
 */
let cache: TileSet | null = null;

export function tileSet(): TileSet {
  if (!cache) cache = build();
  return cache;
}

/**
 * Utsnittet en sida ska öppna kartan på: kommunens, eller hela rikets när
 * ingen kommun är given.
 *
 * `undefined` betyder att kommunen inte har en enda punkt med känt läge, och
 * då ska den varken få en kartsida eller en länk till en. Fyra av tolv
 * kommuner lämnar inga koordinater alls.
 */
export function utsnitt(slug?: string): Utsnitt | undefined {
  const set = tileSet();
  if (slug === undefined) return set;
  return set.perKommun.get(slug);
}

/** Ett år, oföränderligt — adressen ÄR innehållet. Se search-index.ts. */
export const TILES_CACHE_CONTROL = 'public, max-age=31536000, immutable';

/**
 * En låda som kartfragment: `#map=<zoom>/<lat>/<lng>`.
 *
 * Landningssidorna, alltså kategori och område, ska kunna peka in i kartan på
 * SITT utsnitt och inte på kommunens. De vet var deras innehåll ligger men inte
 * vilken zoom det motsvarar, och den räkningen hör hemma på ett ställe.
 *
 * Måtten nedan är ett ANTAGANDE och står därför utskrivet. Kartrutan är olika
 * stor på olika skärmar, och zoomen som får en låda att rymmas beror på den.
 * 1024 gånger 768 är medvetet snålt taget: en bredare ruta visar mer än lådan,
 * vilket är rätt fel att göra, medan en för hög zoom hade klippt bort en del av
 * det området sidan handlar om. MapLibre räknar med 512-rutor, se `tileSize` i
 * kartstilen.
 *
 * Tre decimaler på mitten, av samma skäl som överallt annars där en position
 * skrivs i en adress: ungefär 110 meter, alltså kvarteret och inte porten. Se
 * integritetspolicyn och fragmentavsnittet i Karta.astro.
 */
export function kartfragment(bounds: [number, number, number, number]): string {
  const [vast, syd, ost, nord] = bounds;

  const RUTA = 512;
  const BREDD = 1024;
  const HOJD = 768;

  /* Mercators y som andel av världen. En latitudgrad är inte lika hög överallt,
     och en linjär räkning hade gett fel zoom ju längre norrut lådan ligger. */
  const merc = (lat: number) =>
    Math.log(Math.tan(Math.PI / 4 + (Math.max(-85, Math.min(85, lat)) * Math.PI) / 360));

  const dx = Math.max(1e-6, (ost - vast) / 360);
  const dy = Math.max(1e-6, (merc(nord) - merc(syd)) / (2 * Math.PI));

  const zoom = Math.min(
    Math.log2(BREDD / (RUTA * dx)),
    Math.log2(HOJD / (RUTA * dy)),
  );

  /* Klämd i båda ändar. Under 4 ser man Europa, över 17 finns inga rutor och
     MapLibre överzoomar utan att visa mer. */
  const z = Math.round(Math.max(4, Math.min(17, zoom)) * 100) / 100;
  const lat = (syd + nord) / 2;
  const lng = (vast + ost) / 2;

  return `#map=${z}/${lat.toFixed(3)}/${lng.toFixed(3)}`;
}
