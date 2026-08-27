/**
 * Ägarens egna fotografier: matcha mot registret, gör om till webp, lägg i kö.
 *
 * Kör:  node site/scripts/egna-foton.mjs
 *       node site/scripts/egna-foton.mjs --bredd 2000   (annan bredd)
 *
 * ## Varför egna bilder och inte Commons
 *
 * Frågan kom upp 2026-08-25: vore det billigare att ladda upp till Wikimedia
 * Commons och hämta därifrån, i stället för att lagra själva?
 *
 * Nej, av tre skäl, och det första är att kostnaden inte finns. Uppmätt samma
 * dag: 303 bilder i objektlagringen, i snitt 133 kB som webp, alltså cirka
 * 40 MB. Alla 2 655 matplatser i Stockholm skulle bli omkring 400 MB och hela
 * registret på 16 047 runt 2,1 GB. Supabase Pro har 100 GB inkluderat.
 * Bilderna ligger dessutom aldrig i BYGGET, så filtaket på 19 500 i
 * astro.config.mjs rörs inte: talet stod på 16 980 före och efter.
 *
 * De två andra skälen: Commons kräver CC BY-SA, alltså skulle Stockholms stads
 * Livsmedelskollen få använda ägarens egna bilder mot en attributionsrad, och
 * Commons raderar filer utanför sin skoperegel, vilket en fasad på en pizzeria
 * i Farsta lätt hamnar. Då slocknar bilden på vår sida utan förvarning.
 *
 * ## FLERA BILDER PER VERKSAMHET, OCH VAD SOM AVGÖR ORDNINGEN
 *
 * Ägaren 2026-08-27: "fixa så en restaurang kan ha flera bilder också, första
 * kan vara på utsidan, sedan blir det om vi laddat upp fler". Filnamnen bär
 * numreringen, se `tolka` nedan: `Holy Smoke.heic`, `Holy Smoke-2.heic`.
 *
 * Numret är alltså inte ordningen på sidan utan bara ägarens egen räkning.
 * Ordningen sätts av MOTIVET, se `sortera`, eftersom den första bilden är den
 * som visas i listor, på kort och i kartnålens popup. En fasad ska ligga före
 * en tallrik, och bedömningen av vad ett fotografi föreställer bor i
 * site/src/lib/bildmotiv.data.json, där varje rad är sedd av en människa.
 * Filer som ingen sett på ännu behåller sin filnamnsordning.
 *
 * ## HEIC, OCH VARFÖR SIPS OCH INTE SHARP
 *
 * Ägarens foton kommer ur en iPhone och är HEIC. `sharp` i det här repot kan
 * INTE läsa dem: libvips är byggt utan HEIF-stöd och svarar "Input file has
 * corrupt header: heif: Invalid input" på en fullt frisk fil. Att byta ut
 * libvips vore att lägga ett systemberoende på hela bygget för ett format som
 * bara förekommer i det här steget.
 *
 * macOS `sips` läser HEIC ur operativsystemets egen avkodare. Kedjan är
 * därför: sips gör en JPEG i en temporärkatalog, sharp läser den och gör
 * webp, och temporärfilen tas bort direkt. Uppmätt på ägarens tolv: 3,2 MB
 * HEIC blir 7,7 MB mellanliggande JPEG blir 195 kB webp.
 *
 * Mellanledet är avsiktligt förlustfritt (`formatOptions best`). Att spara
 * några megabyte temporärt genom att komprimera två gånger hade synts i den
 * fil som faktiskt publiceras.
 *
 * EXIF-RIKTNINGEN ÖVERLEVER MELLANLEDET. sips flyttar inte över pixlarna utan
 * behåller taggen: `Holy Smoke-6.heic` ligger 5712x4284 med orientation 6 och
 * JPEG:en gör likadant. Det är `sharp.rotate()` som vänder, precis som förut,
 * och det är prövat och inte antaget.
 *
 * ## 1600 px och webp q80
 *
 * Bredaste visningen är verksamhetssidans bildband i huvudkolumnen, 680 px, och
 * på en skärm med dubbel pixeltäthet blir det 1360. 1600 ger marginal utan att
 * bli en fil ingen ser. Uppmätt på Commons-bilderna vi redan har: q80 landar
 * runt 130 kB för en fasad, vilket är under hälften av vad q90 kostar utan att
 * skillnaden syns i 3:2 på en kortyta.
 *
 * BREDDEN OCH INTE LÄNGSTA SIDAN, och det gäller även stående bilder. Bandet
 * beskär med `object-fit: cover`, alltså är det bredden som ska täcka de
 * 1 360 px. En stående bild blir därmed 1600x2133 och väger tre gånger en
 * liggande. Det är priset för att den ska vara skarp i en 3:2-ruta.
 *
 * `withoutEnlargement` så att en redan liten bild inte skalas upp till gröt.
 *
 * ## Ingenting går live utan godkännande
 *
 * Skriptet skriver bara en kö och ett granskningsark. Samma ordning som
 * pipeline/commonsko.py och pipeline/gatubildsko.py håller, och av samma skäl:
 * ett foto på fel verksamhet är ett påstående om en namngiven verksamhet, och
 * det går inte att ta tillbaka när sidan är indexerad.
 *
 * Steg två är en människa, steg tre är pipeline/egna_fotoko.py, som lägger
 * bytesen i objektlagringen och skriver raderna i BÅDE datafilen och
 * databasen. Bara filen räcker inte: nattens export_supabase.py bygger om
 * filen ur databasen, och en bild som saknar rad i `public.images` är borta
 * inom ett dygn utan att något klagar.
 */
import { readdir, readFile, writeFile, mkdir, stat, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';
import { dirname, join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const kor = promisify(execFile);

const ROT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const IN = join(ROT, 'brand', 'egna-foton');
const UT = join(ROT, 'pipeline', 'data', 'interim', 'egna-foton-webp');
const KO = join(ROT, 'pipeline', 'data', 'interim', 'egna_foton.json');
const ARK = join(ROT, 'pipeline', 'data', 'interim', 'egna-foton-ark.html');
const DATA = join(ROT, 'site', 'src', 'data');
const MOTIVFIL = join(ROT, 'site', 'src', 'lib', 'bildmotiv.data.json');

const BREDD = Number(process.argv[process.argv.indexOf('--bredd') + 1]) || 1600;
const KVALITET = 80;
const ANDELSER = new Set(['.heic', '.heif', '.jpg', '.jpeg', '.png', '.webp']);

/** Format sharp inte kan läsa i det här repot. Se HEIC-avsnittet ovan. */
const VIA_SIPS = new Set(['.heic', '.heif']);

/**
 * Källfilens namn som en filnamnsvänlig nyckel.
 *
 * "Holy Smoke-12.heic" blir "holy-smoke-12". Ändelsen faller bort eftersom
 * resultatet alltid är webp, och versaler, mellanslag och diakriter faller
 * bort eftersom nyckeln också blir en URL i objektlagringen.
 */
const filnyckel = (namn) =>
  vik(basename(namn, extname(namn))).replace(/ /g, '-');

/** Viker bort versaler, diakriter och skiljetecken. Samma tanke som lib/sokforslag. */
const vik = (s) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

async function las(kommun) {
  const fil = join(DATA, `${kommun}.json`);
  if (!existsSync(fil)) return null;
  const d = JSON.parse(await readFile(fil, 'utf8'));
  return d?.municipality ? d : null;
}

/**
 * Filnamnet är namnet, allt efter ett kommatecken är adressen, och ett
 * avslutande `-N` är ägarens egen numrering.
 *
 *   "Holy Smoke.heic"                     { namn: 'Holy Smoke', nr: 1 }
 *   "Holy Smoke-12.heic"                  { namn: 'Holy Smoke', nr: 12 }
 *   "Espresso House, Kungsgatan 12.jpg"   { namn, gata: 'Kungsgatan 12', nr: 1 }
 *
 * Numret läses SIST i namnet och bara när det är ett bindestreck följt av
 * enbart siffror. "Café Nord-Öst.jpg" är alltså ett namn med bindestreck och
 * inte bild nummer Öst. En adress som slutar på siffra-bindestreck-siffra,
 * "Kungsgatan 12-3", går inte att skilja från en numrering och ska skrivas
 * med bild nummer sist ändå: numret är det som står efter det sista
 * bindestrecket.
 */
export function tolka(filnamn) {
  const utan = basename(filnamn, extname(filnamn));
  const nummer = /^(.*)-(\d+)$/.exec(utan);
  const kropp = nummer ? nummer[1] : utan;
  const nr = nummer ? Number(nummer[2]) : 1;
  const bit = kropp.split(',');
  return { namn: bit[0].trim(), gata: bit.slice(1).join(',').trim() || null, nr };
}

function hitta(dataset, { namn, gata }) {
  const n = vik(namn);
  let kandidater = dataset.establishments.filter((e) => vik(e.name) === n);

  // Ingen exakt träff: pröva den som BÖRJAR med namnet, alltså "Sturehof" mot
  // "Sturehof Restaurang". Aldrig tvärtom: ett kort filnamn får inte fånga ett
  // långt registernamn som råkar innehålla ordet.
  if (kandidater.length === 0) {
    kandidater = dataset.establishments.filter((e) => vik(e.name).startsWith(n + ' '));
  }

  if (kandidater.length > 1 && gata) {
    const g = vik(gata);
    const smalare = kandidater.filter((e) => vik(e.address || '').startsWith(g));
    if (smalare.length) kandidater = smalare;
  }
  return kandidater;
}

/**
 * Vad fotografiet föreställer, bedömt av en människa.
 *
 * Tabellen är site/src/lib/bildmotiv.data.json, samma fil som styr ordningen
 * på startsidan. En rad med `bild` gäller EN fil; en rad utan gäller
 * verksamhetens första bild. Se bildmotiv.ts för varför fältet är bedömt och
 * inte härlett: `amenity=restaurant` sitter på både Riche och Operakällaren,
 * och en namnregel hade fel om sex av trettiotre.
 */
async function motivtabell() {
  if (!existsSync(MOTIVFIL)) return new Map();
  const rader = JSON.parse(await readFile(MOTIVFIL, 'utf8'));
  return new Map(
    rader.filter((r) => r.bild).map((r) => [`${r.kommun}/${r.slug}/${r.bild}`, r.motiv]),
  );
}

/** Fasaden före byggnaden före tallriken. Se sortera. */
const MOTIVRANG = { stallet: 0, byggnad: 1, annat: 2 };

/**
 * Ordningen på sidan.
 *
 * Ägaren: "första kan vara på utsidan". Den första bilden är den som visas i
 * listor, på kort och i kartnålens popup, alltså är ordningen inte kosmetisk
 * utan ett påstående om vad stället ÄR.
 *
 * Sorteringen är stabil och har två nycklar. Motivet först, i ordningen
 * stallet, byggnad, annat, så att en fasad alltid ligger före en maträtt.
 * Ägarens egen numrering sedan, inom varje motivgrupp, så att den ordning han
 * själv lagt filerna i behålls där bedömningen inte skiljer dem åt.
 *
 * En obedömd fil får rangen 1, alltså mellan fasaden och tallriken. Att lägga
 * den sist hade dolt varje nytt foto längst bak i bandet tills någon hunnit
 * se på det; att lägga den först hade låtit en osedd bild bli den som
 * representerar stället i alla listor.
 */
function sortera(bilder, motiv) {
  return bilder
    .map((b, i) => ({ b, i, rang: MOTIVRANG[motiv.get(b.motivnyckel)] ?? 1 }))
    .sort((a, z) => a.rang - z.rang || a.b.nr - z.b.nr || a.i - z.i)
    .map((x) => x.b);
}

/**
 * HEIC via sips, allt annat rakt in i sharp.
 *
 * Temporärfilen tas bort i `finally`, även när sharp faller: en avbruten
 * körning ska inte lämna sjuttio megabyte JPEG i /tmp.
 */
async function tillWebp(kalla, mal) {
  const andelse = extname(kalla).toLowerCase();
  if (!VIA_SIPS.has(andelse)) return skala(kalla, mal);

  const mellan = join(await mkdtempKatalog(), 'mellan.jpg');
  try {
    await kor('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', 'best', kalla, '--out', mellan]);
    return await skala(mellan, mal);
  } finally {
    await rm(dirname(mellan), { recursive: true, force: true });
  }
}

async function mkdtempKatalog() {
  const { mkdtemp } = await import('node:fs/promises');
  return mkdtemp(join(tmpdir(), 'prikko-foton-'));
}

function skala(kalla, mal) {
  return sharp(kalla)
    .rotate() // följer EXIF, annars ligger telefonbilder på sidan
    .resize({ width: BREDD, withoutEnlargement: true })
    .webp({ quality: KVALITET })
    .toFile(mal);
}

const grupper = new Map();
const problem = [];
const motiv = await motivtabell();

await mkdir(UT, { recursive: true });

for (const kommun of (await readdir(IN, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)) {
  const dataset = await las(kommun);
  if (!dataset) {
    problem.push(`${kommun}/: ingen datafil site/src/data/${kommun}.json`);
    continue;
  }

  for (const fil of (await readdir(join(IN, kommun))).sort()) {
    if (!ANDELSER.has(extname(fil).toLowerCase())) continue;

    const traff = hitta(dataset, tolka(fil));
    if (traff.length === 0) {
      problem.push(`${kommun}/${fil}: ingen verksamhet med det namnet`);
      continue;
    }
    if (traff.length > 1) {
      const namn = traff.map((e) => `${e.name} (${e.address || 'utan adress'})`).join(', ');
      problem.push(`${kommun}/${fil}: ${traff.length} träffar, lägg till gatan efter ett komma. ${namn}`);
      continue;
    }

    const e = traff[0];
    const nyckel = `${kommun}/${e.slug}`;
    if (!grupper.has(nyckel)) grupper.set(nyckel, { kommun, e, bilder: [] });
    grupper.get(nyckel).bilder.push({
      fil,
      nr: tolka(fil).nr,
      motivnyckel: `${nyckel}/${fil}`,
    });
  }
}

const rader = [];

for (const { kommun, e, bilder } of [...grupper.values()].sort((a, z) =>
  `${a.kommun}/${a.e.slug}`.localeCompare(`${z.kommun}/${z.e.slug}`, 'sv'),
)) {
  console.log(`${e.name} (${kommun})`);

  const ordnade = sortera(bilder, motiv);
  for (const [plats, bild] of ordnade.entries()) {
    const kalla = join(IN, kommun, bild.fil);
    // Namnet följer KÄLLFILEN och aldrig platsen i bandet.
    //
    // Ett första försök numrerade efter plats, `...-5.webp`. Det ser
    // deterministiskt ut och är det inte: så snart en bild får en ny
    // motivbedömning byter halva bandet plats, och då byter halva filerna
    // innehåll medan de behåller sina namn. I objektlagringen blir samma sak
    // värre, för de gamla objekten ligger kvar under nycklar som nu pekar på
    // fel bild.
    //
    // Källfilens namn ändras inte när någon ändrar sig om ett motiv, alltså
    // är det den som ska bära nyckeln. Ordningen bor i kön och i
    // `images.position`, där den hör hemma.
    const mal = join(UT, kommun, e.slug, `${filnyckel(bild.fil)}.webp`);
    await mkdir(dirname(mal), { recursive: true });

    await tillWebp(kalla, mal);

    const fore = (await stat(kalla)).size;
    const efter = (await stat(mal)).size;
    rader.push({
      kommun,
      slug: e.slug,
      id: e.id,
      namn: e.name,
      adress: e.address || null,
      /** Plats i bandet, noll först. Se sortera. */
      ordning: plats,
      /** Bedömt motiv, eller null när ingen sett på bilden ännu. */
      motiv: motiv.get(bild.motivnyckel) ?? null,
      fil: mal,
      /** Ursprungsfilens namn. Blir `source_id`, så bilden går att spåra. */
      kalla: bild.fil,
      kB: Math.round(efter / 1024),
      krympning: `${Math.round((1 - efter / fore) * 100)} %`,
    });
    console.log(
      `  ${String(plats + 1).padStart(2)}. ${bild.fil.slice(0, 28).padEnd(28)} ` +
        `${(rader.at(-1).motiv ?? 'obedömd').padEnd(8)} ` +
        `${String(Math.round(fore / 1024)).padStart(5)} kB -> ${String(efter / 1024 | 0).padStart(4)} kB`,
    );
  }
}

await mkdir(dirname(KO), { recursive: true });
await writeFile(KO, JSON.stringify(rader, null, 1) + '\n');
await writeFile(ARK, ark(rader), 'utf8');

console.log(`\n${rader.length} bilder omgjorda på ${grupper.size} verksamheter.`);
console.log(`Kö:  ${KO}`);
console.log(`Ark: ${ARK}`);
if (rader.length) {
  const summa = rader.reduce((s, r) => s + r.kB, 0);
  console.log(`Sammanlagt ${Math.round(summa / 1024)} MB, i snitt ${Math.round(summa / rader.length)} kB.`);
}
if (problem.length) {
  console.log(`\n${problem.length} filer kunde inte paras ihop:`);
  for (const p of problem) console.log('  ' + p);
}
console.log(
  '\nIngenting är publicerat. Öppna arket, stryk det som är fel, och kör sedan\n' +
    '  set -a && . ~/.prikko-env && set +a\n' +
    `  python3 pipeline/egna_fotoko.py tillampa site/src/data/*.json --godkanda ${KO}`,
);

/**
 * Granskningsarket.
 *
 * Samma form som commonsko.py och gatubildsko.py skriver: en rad per
 * verksamhet, bilderna i den ordning de kommer att stå på sidan, och namnet
 * och adressen intill så att den som granskar kan se att det ÄR stället.
 * Bilderna pekas ut med `file://`, för de ligger i data/interim och ska
 * aldrig checkas in.
 */
function ark(rader) {
  const per = new Map();
  for (const r of rader) {
    const nyckel = `${r.kommun}/${r.slug}`;
    if (!per.has(nyckel)) per.set(nyckel, []);
    per.get(nyckel).push(r);
  }

  const grupp = [...per.values()]
    .map(
      (bilder) => `
  <section>
    <h2>${esc(bilder[0].namn)}</h2>
    <p>${esc(bilder[0].adress ?? 'utan adress')} · ${esc(bilder[0].kommun)} · ${bilder.length} bilder</p>
    <div class="band">
      ${bilder
        .map(
          (b) => `<figure${b.ordning === 0 ? ' class="forst"' : ''}>
        <img src="file://${encodeURI(b.fil)}" alt="">
        <figcaption>${b.ordning + 1}. ${esc(b.kalla)}<br>${esc(b.motiv ?? 'obedömd')} · ${b.kB} kB</figcaption>
      </figure>`,
        )
        .join('\n      ')}
    </div>
  </section>`,
    )
    .join('\n');

  return `<!doctype html>
<meta charset="utf-8">
<title>Egna foton, granskning</title>
<style>
  body { font: 15px/1.5 system-ui, sans-serif; margin: 32px; max-width: 1100px; }
  section { border-top: 1px solid #ddd; padding-top: 20px; margin-top: 24px; }
  h2 { margin: 0 0 4px; font-size: 20px; }
  p { margin: 0 0 12px; color: #666; }
  .band { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; }
  figure { margin: 0; flex: 0 0 240px; }
  figure.forst { flex: 0 0 380px; }
  img { display: block; width: 100%; aspect-ratio: 3 / 2; object-fit: cover; border-radius: 6px; background: #eee; }
  figcaption { font-size: 12px; color: #666; margin-top: 4px; }
</style>
<h1>Egna foton, granskning</h1>
<p>Ingenting är publicerat. Den vänstra bilden i varje band är den som blir
   verksamhetens förstabild, alltså den som syns i listor, på kort och i
   kartnålen. Stryk rader ur kön innan du kör <code>tillampa</code>.</p>
${grupp}
`;
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}
