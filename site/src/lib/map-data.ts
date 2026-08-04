/**
 * Kartans datamängd, en fil per kommun, på en innehållsbaserad adress.
 *
 * Samma lösning som sökregistret i search-index.ts, och av samma tre skäl:
 * filen får inte ligga i sidans HTML, den ska kunna cachas för alltid, och en
 * ändring i datan måste slå igenom direkt i stället för när en cachetid råkar
 * löpa ut. Läs kommentaren där för resonemanget i sin helhet.
 *
 * ## Varför en fil per kommun, och var gränsen går
 *
 * Kommunbeståndet är litet och orörligt mellan bygg. Stockholm är 8 511
 * punkter, alla andra kommuner mindre. Hela kommunen kan alltså skickas EN
 * gång och filtreras mot kartans utsnitt lokalt, vilket är bättre än att fråga
 * en server vid varje panorering: ingen väntan, inget skelett, listan följer
 * med medan man drar.
 *
 * Det håller inte nationellt. Vid full täckning över 290 kommuner blir
 * beståndet omkring 90 000 punkter, och det skickar man inte till en telefon.
 * En riksvy behöver förgenererade rutor eller en serverfråga per utsnitt. Se
 * `PunktKalla` i Karta.astro: klienten läser punkter genom EN funktion, och
 * det är den funktionen som byts den dagen. Ingenting annat i kartan vet var
 * punkterna kommer ifrån.
 *
 * ## Formatet
 *
 * Kolumner, inte rader. Ett objekt per punkt med `name`, `slug`, `lat`, `lng`,
 * `verdict` upprepar nyckelnamnen 8 511 gånger; tuplar tar bort nyckelnamnen
 * men behåller en avgränsare per fält. Kolumner lägger likadan data intill
 * likadan, vilket är precis vad en kompressor kan utnyttja.
 *
 * Mätt på Stockholm, gzippat:
 *
 *   objekt per punkt                        ~300 kB
 *   tuplar                                   225 kB
 *   kolumner + deltakoordinater              171 kB
 *   + härledd slug (se lib/slug.ts)          110 kB
 *
 * Tre saker gör resten av jobbet:
 *
 * 1. Koordinaterna är heltal i hundratusendels grad, ungefär en meter, och
 *    lagras som SKILLNADEN mot föregående rad. Raderna sorteras geografiskt
 *    först, så skillnaderna blir små tal i stället för sjusiffriga.
 * 2. Namnen ligger i EN sträng med radbrytning mellan. Då slipper filen
 *    citattecken och kommatecken runt varje namn.
 * 3. Slugen skickas inte alls när den går att räkna fram ur namnet, vilket den
 *    gör för 8 246 av 8 511 rader. Undantagen skickas som en tabell på
 *    radnummer. Bygget jämför alltid mot den slug pipelinen satte, så en
 *    felräknad slug kan inte nå klienten. Se lib/slug.ts.
 *
 * Datumet är antal dagar sedan EPOCH i stället för "2026-04-17". Elva tecken
 * blir fyra siffror, och deltat mellan grannar är litet.
 */
import { createHash } from 'node:crypto';
import { establishments, latestInspectionDate, municipalities } from './data';
import type { Municipality } from './db';
import { slugify } from './slug';

/** Ordningen är siffran i `v`. 3 = ingen bedömning. */
export const MAP_VERDICTS = ['clean', 'minor', 'major'] as const;

/** Nollpunkt för `d`. Före första kontrollen i beståndet, och rund. */
export const MAP_EPOCH = '2020-01-01';

export interface MapDataset {
  municipality: Municipality;
  count: number;
  /** Alla koordinater är geokodade ur adressen i stället för lämnade av
   *  kommunen. Per kommun, eftersom källorna är det: en kommun lämnar antingen
   *  koordinater eller inga alls. */
  derived: boolean;
  /** [väst, syd, öst, nord]. Kartan öppnar på den här utsträckningen. */
  bounds: [number, number, number, number];
  /** Punkter per bedömning, index som MAP_VERDICTS plus 3 för obedömda. */
  counts: [number, number, number, number];
  /** Antal rader vars slug INTE gick att härleda. Bara för rapportering. */
  slugOverrides: number;
  body: string;
  hash: string;
  url: string;
}

/**
 * Ytterkanten på kommunens punkter, beskuren mot de yttersta halvprocenten.
 *
 * Rå min/max går sönder på en enda felkodad koordinat. Stockholm har
 * verksamheter registrerade på adresser långt utanför kommunen, och en karta
 * som öppnar på hela den utsträckningen visar mest Östersjön. Punkten FINNS
 * kvar på kartan, den ligger bara utanför det första utsnittet.
 */
function extent(values: number[]): [number, number] {
  const sorted = [...values].sort((a, b) => a - b);
  return [
    sorted[Math.floor(sorted.length * 0.005)],
    sorted[Math.ceil(sorted.length * 0.995) - 1],
  ];
}

const DAY = 86_400_000;
const epochMs = Date.parse(MAP_EPOCH);

function build(m: Municipality): MapDataset | null {
  const rows = establishments(m.slug).filter((e) => e.lat !== null && e.lng !== null);
  if (rows.length === 0) return null;

  /*
   * Sorterade geografiskt, inte alfabetiskt. Deltakodningen bygger på att
   * grannrader ligger nära varandra; i bokstavsordning hoppar varje rad över
   * hela kommunen och deltana blir lika stora som talen de skulle ersätta.
   * Latitud grovt först, sedan longitud, alltså ungefär radvis över kartan.
   */
  const sorted = [...rows].sort(
    (a, b) => Math.round(a.lat! * 1e3) - Math.round(b.lat! * 1e3) || a.lng! - b.lng!,
  );

  const x: number[] = [];
  const y: number[] = [];
  const d: number[] = [];
  const names: string[] = [];
  const overrides: Record<number, string> = {};
  const counts: [number, number, number, number] = [0, 0, 0, 0];
  let verdicts = '';
  let derived = true;
  let prevX = 0;
  let prevY = 0;

  /*
   * Verksamhetstypen som ordbok plus index i stället för en sträng per rad.
   *
   * Stockholm har 8 511 rader men bara ett åttiotal skilda typer, så
   * ordboken kostar en gång och raden kostar en siffra. Rå sträng per rad
   * hade lagt på runt 30 kB gzippat, ordboken lägger på under 2.
   *
   * Bara FÖRSTA typen skickas. Kortet har plats för en rad, och den första är
   * den kommunen själv satte främst. Hela listan står på verksamhetssidan.
   *
   * Typerna är kommunens egna ord och är INTE normaliserade mellan kommuner,
   * vilket är ofarligt här eftersom filen är per kommun. Den dagen kartan blir
   * nationell måste de mappas mot en gemensam uppsättning först.
   */
  const typeDict: string[] = [];
  const typeIndex = new Map<string, number>();
  const t: number[] = [];

  /** Antal kontroller i historiken. Små tal, komprimerar nästan gratis. */
  const k: number[] = [];

  /** Radnummer med utmärkelse. Gles lista: de är få, och en nolla per rad
   *  hade kostat mer än att räkna upp dem som har den. */
  const u: number[] = [];

  sorted.forEach((e, i) => {
    const ix = Math.round(e.lng! * 1e5);
    const iy = Math.round(e.lat! * 1e5);
    x.push(ix - prevX);
    y.push(iy - prevY);
    prevX = ix;
    prevY = iy;

    const v = e.verdict ? MAP_VERDICTS.indexOf(e.verdict) : 3;
    const verdict = v < 0 ? 3 : v;
    counts[verdict] += 1;
    verdicts += verdict;

    if (e.geoSource !== 'osm') derived = false;

    /*
     * All blankrymd pressas till ett mellanslag INNAN namnet läggs i listan.
     *
     * Namnen skiljs åt med radbrytning i filen. Två av Stockholms 8 511 namn
     * innehöll själva CRLF ("Pyttirian\r\n\r\nPyttirian" och
     * "Meno Male\r\nMeno Male", båda dubblerade av källan). Ett sådant namn
     * blir tre rader i stället för en vid uppdelningen i klienten, och därmed
     * hamnar VARJE namn efter det på fel nål: fel titel i listan, fel titel i
     * kortet, och en länk till fel verksamhet. Bedömningen och datumet låg
     * kvar rätt, eftersom de ligger i egna kolumner med ett tecken per rad,
     * vilket är precis det som gjorde felet svårt att se.
     */
    const name = e.name.replace(/\s+/g, ' ').trim();
    names.push(name);
    // Här är grinden: härledningen jämförs alltid mot verkligheten, och
    // avviker den skickas den riktiga slugen med. Se lib/slug.ts.
    if (slugify(name) !== e.slug) overrides[i] = e.slug;

    const date = latestInspectionDate(e);
    d.push(date ? Math.round((Date.parse(date) - epochMs) / DAY) : 0);

    const type = e.types[0] ?? '';
    let ti = typeIndex.get(type);
    if (ti === undefined) {
      ti = typeDict.length;
      typeDict.push(type);
      typeIndex.set(type, ti);
    }
    t.push(ti);

    k.push(e.inspections.length);
    if (e.distinction) u.push(i);
  });

  /*
   * Grinden mot att namnraderna glider ur led igen.
   *
   * Normaliseringen ovan gör felet omöjligt i dag. Den här kontrollen gör det
   * omöjligt att RÅKA ta bort normaliseringen: går uppdelningen inte att vända
   * tillbaka till lika många rader stannar bygget här i stället för att
   * publicera en karta där namn och nål inte hör ihop.
   */
  const joined = names.join('\n');
  if (joined.split('\n').length !== names.length) {
    throw new Error(
      `${m.slug}: ett namn innehåller radbrytning, så kartans namnkolumn går ur fas. ` +
        'Se normaliseringen i build().',
    );
  }

  const [west, east] = extent(sorted.map((e) => e.lng!));
  const [south, north] = extent(sorted.map((e) => e.lat!));

  const body = JSON.stringify({
    x,
    y,
    v: verdicts,
    n: joined,
    o: overrides,
    d,
    t,
    td: typeDict,
    k,
    u,
  });
  const hash = createHash('sha256').update(body).digest('hex').slice(0, 12);

  return {
    municipality: m,
    count: sorted.length,
    derived,
    bounds: [west, south, east, north],
    counts,
    slugOverrides: Object.keys(overrides).length,
    body,
    hash,
    url: `/kartdata/${m.slug}-${hash}.json`,
  };
}

/**
 * Byggs en gång per byggprocess och delas. Kommunhubben importerar modulen för
 * att veta OM kartan finns, och den mallen renderas 14 711 gånger — se samma
 * anteckning i search-index.ts.
 */
let cache: Map<string, MapDataset> | null = null;

function all(): Map<string, MapDataset> {
  if (cache) return cache;
  cache = new Map();
  for (const m of municipalities()) {
    const dataset = build(m);
    if (dataset) cache.set(m.slug, dataset);
  }
  return cache;
}

/** Kommunens kartdata, eller undefined när kommunen saknar koordinater. */
export function mapDataset(slug: string): MapDataset | undefined {
  return all().get(slug);
}

/** Alla kommuner som har en karta. Används av rutterna. */
export function mapDatasets(): MapDataset[] {
  return [...all().values()];
}

/** Ett år, oföränderligt — adressen ÄR innehållet. Se search-index.ts. */
export const MAP_DATA_CACHE_CONTROL = 'public, max-age=31536000, immutable';
