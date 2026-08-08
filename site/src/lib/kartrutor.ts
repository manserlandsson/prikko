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
import { establishments, latestInspectionDate, municipalities } from './data';
import { writePMTiles } from './pmtiles';
import { slugify } from './slug';

/** Ordningen är siffran i `v`. 3 = ingen bedömning. Samma som map-data.ts. */
export const MAP_VERDICTS = ['clean', 'minor', 'major'] as const;

/** Nollpunkt för `dt`. Före första kontrollen i beståndet, och rund. */
export const MAP_EPOCH = '2020-01-01';

/** Lagrets namn i rutorna. Måste stämma med `source-layer` i kartans lager. */
export const TILE_LAYER = 'punkter';

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
 * De tre talen som avgör hur mycket blått man ser, oförändrade från den
 * klustring som redan står i Karta.astro. Motiveringen står där: under fem
 * punkter ritas de som var sin nål i stället för som en bubbla med en trea i,
 * radien håller klustren lokala i stället för stadsdelsstora, och 13 släpper
 * fram nålarna ett zoomsteg tidigare.
 */
const CLUSTER_RADIUS_PX = 38;
const CLUSTER_MIN_POINTS = 5;
const CLUSTER_MAX_ZOOM = 13;

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

interface Punkt {
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

    const date = latestInspectionDate(e);
    if (date) props.dt = Math.round((Date.parse(date) - epochMs) / DAY);

    if (e.inspections.length > 0) props.k = e.inspections.length;
    if (e.distinction) props.u = 1;

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
    tiles: archive.tiles,
    body: archive.buffer,
    hash,
    url: `/kartrutor/punkter-${hash}.pmtiles`,
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
