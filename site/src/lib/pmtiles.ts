/**
 * PMTiles v3, skrivsidan.
 *
 * En rutpyramid ska ligga i EN fil, och skälet är räknat i docs/23_rikskartan:
 * geografiskt uppdelade rutor som vanliga filer blir 15 000 till 30 000 stycken
 * vid full täckning, mot de 3 466 vi har kvar till Cloudflare Pages tak på
 * 20 000. PMTiles är den etablerade formen för det: ett huvud, en katalog och
 * rutdatan efter, läst av webbläsaren med HTTP-räckviddsförfrågningar.
 *
 * ## Varför skrivaren är vår egen
 *
 * `pmtiles` på npm är en LÄSARE. `s2-pmtiles` har en skrivare men bygger filen
 * genom att trycka in en byte i taget i en JavaScript-array, vilket inte håller
 * för ett arkiv på nio megabyte. Tippecanoe skriver PMTiles direkt och är
 * uteslutet av ett annat skäl: det är C++, och bygget kör på Cloudflare Pages
 * byggbild och i GitHub Actions, där vi varken har root eller en kompilator.
 *
 * Formatet är publicerat och stabilt, och skrivsidan blev det här. Den enda
 * delen som verkligen måste stämma exakt med läsaren är översättningen från
 * z/x/y till ett tal längs Hilbert-kurvan, och den IMPORTERAS därför ur
 * läsaren. Skrivare och läsare kan då per definition inte bli oense om vilken
 * ruta ett tal betyder.
 *
 * ## Filens delar, i den ordning de ligger
 *
 *   huvud            127 byte, fasta fält
 *   rotkatalog       gzippad, MÅSTE rymmas i 16 384 byte med huvud och metadata
 *   metadata         gzippad JSON, TileJSON-liknande
 *   lövkataloger     bara när rotkatalogen inte räckte
 *   rutdata          varje ruta gzippad för sig
 */
import { gzipSync } from 'node:zlib';
import { zxyToTileId } from 'pmtiles';

const HEADER_BYTES = 127;

/** Taket för huvud plus rotkatalog plus metadata. Står i specifikationen, och
 *  är skälet till att lövkataloger finns över huvud taget. */
const ROOT_MAX = 16_384;

interface Entry {
  tileId: number;
  offset: number;
  length: number;
  /** 1 för en vanlig ruta. 0 betyder att posten pekar på en lövkatalog. */
  runLength: number;
}

export interface TileMeta {
  name: string;
  minzoom: number;
  maxzoom: number;
  /** [väst, syd, öst, nord] */
  bounds: [number, number, number, number];
  centerzoom?: number;
  vector_layers: { id: string; minzoom: number; maxzoom: number; fields: Record<string, string> }[];
}

export interface Archive {
  buffer: Buffer;
  tiles: number;
  leaves: number;
  rootLength: number;
}

function writeVarint(out: number[], value: number): void {
  while (value >= 0x80) {
    out.push((value & 0x7f) | 0x80);
    // Division och inte >>> 7: talen är rutförskjutningar i en fil som kan bli
    // större än 2^31, och en bitskiftning hade tystnat vid fyra byte.
    value = Math.floor(value / 128);
  }
  out.push(value);
}

/**
 * Katalogen som fyra KOLUMNER i följd, inte som poster efter varandra.
 *
 * Samma grepp och samma skäl som kartdatans eget format: likadan data intill
 * likadan komprimerar. Rutnumren lagras dessutom som skillnaden mot
 * föregående, och en förskjutning som råkar ligga direkt efter föregående rutas
 * slut skrivs som en nolla i stället för som talet. I ett arkiv skrivet i
 * ordning är nästan varenda post en sådan nolla.
 */
export function serializeDir(entries: Entry[]): Buffer {
  const out: number[] = [];
  writeVarint(out, entries.length);

  let last = 0;
  for (const e of entries) {
    writeVarint(out, e.tileId - last);
    last = e.tileId;
  }
  for (const e of entries) writeVarint(out, e.runLength);
  for (const e of entries) writeVarint(out, e.length);
  for (let i = 0; i < entries.length; i += 1) {
    const e = entries[i];
    const prev = entries[i - 1];
    if (i > 0 && e.offset === prev.offset + prev.length) writeVarint(out, 0);
    else writeVarint(out, e.offset + 1);
  }

  return Buffer.from(out);
}

/**
 * Rotkatalogen, och lövkataloger när den inte räcker.
 *
 * Tolv kommuner ryms i roten med god marginal: 1 719 rutor blir 3 799 byte
 * gzippat mot taket på drygt 16 000. Vid 290 kommuner gör de inte det, och då
 * delas posterna i löv medan roten bara pekar ut vilket löv som täcker vilket
 * intervall. Bladstorleken dubblas tills roten ryms, vilket är samma
 * tillvägagångssätt som referensimplementationen använder.
 */
function buildDirectories(entries: Entry[], limit: number) {
  const flat = gzipSync(serializeDir(entries), { level: 9 });
  if (flat.length <= limit) return { root: flat, leaves: Buffer.alloc(0), count: 0 };

  let leafSize = 4096;
  for (;;) {
    const rootEntries: Entry[] = [];
    const chunks: Buffer[] = [];
    let offset = 0;

    for (let i = 0; i < entries.length; i += leafSize) {
      const slice = entries.slice(i, i + leafSize);
      const buf = gzipSync(serializeDir(slice), { level: 9 });
      rootEntries.push({ tileId: slice[0].tileId, offset, length: buf.length, runLength: 0 });
      chunks.push(buf);
      offset += buf.length;
    }

    const root = gzipSync(serializeDir(rootEntries), { level: 9 });
    if (root.length <= limit) {
      return { root, leaves: Buffer.concat(chunks), count: rootEntries.length };
    }
    leafSize *= 2;
  }
}

function setUint64(view: DataView, pos: number, value: number): void {
  view.setUint32(pos, value >>> 0, true);
  view.setUint32(pos + 4, Math.floor(value / 4294967296), true);
}

/**
 * @param tiles Nyckel `"z/x/y"` mot RÅ rutdata. Komprimeringen sker här, så
 *              den som anropar ska lämna okomprimerad protobuf.
 */
export function writePMTiles(tiles: Map<string, Buffer>, meta: TileMeta): Archive {
  /*
   * Rutorna sorteras på sitt tal, alltså längs Hilbert-kurvan. Det är vad
   * `clustered` i huvudet lovar läsaren, och det är också det som gör att
   * geografiska grannar hamnar intill varandra i filen: en panorering läser då
   * byte som ligger nära dem den nyss läste, vilket är hela poängen med att
   * hämta ur en enda fil.
   */
  const rows = [...tiles].map(([key, raw]) => {
    const [z, x, y] = key.split('/').map(Number);
    return { tileId: zxyToTileId(z, x, y), raw };
  });
  rows.sort((a, b) => a.tileId - b.tileId);

  const entries: Entry[] = [];
  const blobs: Buffer[] = [];
  const seen = new Map<string, { offset: number; length: number }>();
  let offset = 0;

  for (const r of rows) {
    const gz = gzipSync(r.raw, { level: 9 });
    /*
     * Identiska rutor lagras EN gång och pekas ut av flera poster. Det spelar
     * ingen roll i dag, men en rutpyramid över ett glest land får med tiden
     * gott om nivåer där samma handfull punkter ger exakt samma ruta.
     */
    const key = gz.toString('latin1');
    const before = seen.get(key);
    if (before) {
      entries.push({ tileId: r.tileId, offset: before.offset, length: before.length, runLength: 1 });
      continue;
    }

    entries.push({ tileId: r.tileId, offset, length: gz.length, runLength: 1 });
    seen.set(key, { offset, length: gz.length });
    blobs.push(gz);
    offset += gz.length;
  }

  const metaBuf = gzipSync(Buffer.from(JSON.stringify(meta)), { level: 9 });
  const dirs = buildDirectories(entries, ROOT_MAX - HEADER_BYTES - metaBuf.length);

  const rootOffset = HEADER_BYTES;
  const metaOffset = rootOffset + dirs.root.length;
  const leafOffset = metaOffset + metaBuf.length;
  const dataOffset = leafOffset + dirs.leaves.length;
  const data = Buffer.concat(blobs);

  const header = Buffer.alloc(HEADER_BYTES);
  header.write('PMTiles', 0, 'ascii');
  header.writeUInt8(3, 7);

  const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
  setUint64(view, 8, rootOffset);
  setUint64(view, 16, dirs.root.length);
  setUint64(view, 24, metaOffset);
  setUint64(view, 32, metaBuf.length);
  setUint64(view, 40, leafOffset);
  setUint64(view, 48, dirs.leaves.length);
  setUint64(view, 56, dataOffset);
  setUint64(view, 64, data.length);
  setUint64(view, 72, entries.length);
  setUint64(view, 80, entries.length);
  setUint64(view, 88, blobs.length);
  view.setUint8(96, 1); // clustered: rutorna ligger i tal-ordning
  view.setUint8(97, 2); // katalogernas komprimering: gzip
  view.setUint8(98, 2); // rutornas komprimering: gzip
  view.setUint8(99, 1); // rutornas typ: mvt

  view.setUint8(100, meta.minzoom);
  view.setUint8(101, meta.maxzoom);

  /* Utsträckning och mittpunkt i tiomiljondels grad. MapLibre behöver dem inte,
     men varje verktyg som kan öppna ett PMTiles-arkiv läser dem, och att skriva
     dem rätt kostar sju rader. */
  const e7 = (v: number) => Math.round(v * 1e7);
  view.setInt32(102, e7(meta.bounds[0]), true);
  view.setInt32(106, e7(meta.bounds[1]), true);
  view.setInt32(110, e7(meta.bounds[2]), true);
  view.setInt32(114, e7(meta.bounds[3]), true);
  view.setUint8(118, meta.centerzoom ?? meta.minzoom);
  view.setInt32(119, e7((meta.bounds[0] + meta.bounds[2]) / 2), true);
  view.setInt32(123, e7((meta.bounds[1] + meta.bounds[3]) / 2), true);

  return {
    buffer: Buffer.concat([header, dirs.root, metaBuf, dirs.leaves, data]),
    tiles: entries.length,
    leaves: dirs.count,
    rootLength: dirs.root.length,
  };
}
