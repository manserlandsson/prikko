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
 * ## 1600 px och webp q80
 *
 * Bredaste visningen är verksamhetssidans bildband i huvudkolumnen, 680 px, och
 * på en skärm med dubbel pixeltäthet blir det 1360. 1600 ger marginal utan att
 * bli en fil ingen ser. Uppmätt på Commons-bilderna vi redan har: q80 landar
 * runt 130 kB för en fasad, vilket är under hälften av vad q90 kostar utan att
 * skillnaden syns i 3:2 på en kortyta.
 *
 * `withoutEnlargement` så att en redan liten bild inte skalas upp till gröt.
 *
 * ## Ingenting går live utan godkännande
 *
 * Skriptet skriver bara en kö. Samma ordning som pipeline/commonsko.py håller
 * för Commons-bilderna, och av samma skäl: ett foto på fel verksamhet är ett
 * påstående om en namngiven verksamhet, och det går inte att ta tillbaka när
 * sidan är indexerad.
 */
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const IN = join(ROT, 'brand', 'egna-foton');
const UT = join(ROT, 'pipeline', 'data', 'interim', 'egna-foton-webp');
const KO = join(ROT, 'pipeline', 'data', 'interim', 'egna_foton.json');
const DATA = join(ROT, 'site', 'src', 'data');

const BREDD = Number(process.argv[process.argv.indexOf('--bredd') + 1]) || 1600;
const KVALITET = 80;
const ANDELSER = new Set(['.heic', '.heif', '.jpg', '.jpeg', '.png', '.webp']);

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
 * Filnamnet är namnet, och allt efter ett kommatecken är adressen.
 * "Espresso House, Kungsgatan 12.jpg" blir { namn, gata }.
 */
function tolka(filnamn) {
  const utan = basename(filnamn, extname(filnamn));
  const bit = utan.split(',');
  return { namn: bit[0].trim(), gata: bit.slice(1).join(',').trim() || null };
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

const rader = [];
const problem = [];

await mkdir(UT, { recursive: true });

for (const kommun of (await readdir(IN, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)) {
  const dataset = await las(kommun);
  if (!dataset) {
    problem.push(`${kommun}/: ingen datafil site/src/data/${kommun}.json`);
    continue;
  }

  for (const fil of await readdir(join(IN, kommun))) {
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
    const kalla = join(IN, kommun, fil);
    const mal = join(UT, `${kommun}-${e.slug}.webp`);

    await sharp(kalla)
      .rotate() // följer EXIF, annars ligger telefonbilder på sidan
      .resize({ width: BREDD, withoutEnlargement: true })
      .webp({ quality: KVALITET })
      .toFile(mal);

    const fore = (await stat(kalla)).size;
    const efter = (await stat(mal)).size;
    rader.push({
      kommun,
      slug: e.slug,
      namn: e.name,
      adress: e.address || null,
      fil: mal,
      kalla: fil,
      kB: Math.round(efter / 1024),
      krympning: `${Math.round((1 - efter / fore) * 100)} %`,
    });
    console.log(
      `  ${e.name.slice(0, 34).padEnd(34)} ${String(Math.round(fore / 1024)).padStart(5)} kB -> ${String(Math.round(efter / 1024)).padStart(4)} kB`,
    );
  }
}

await mkdir(dirname(KO), { recursive: true });
await writeFile(KO, JSON.stringify(rader, null, 1) + '\n');

console.log(`\n${rader.length} bilder omgjorda, kö skriven till ${KO}`);
if (rader.length) {
  const summa = rader.reduce((s, r) => s + r.kB, 0);
  console.log(`Sammanlagt ${Math.round(summa / 1024)} MB, i snitt ${Math.round(summa / rader.length)} kB.`);
}
if (problem.length) {
  console.log(`\n${problem.length} filer kunde inte paras ihop:`);
  for (const p of problem) console.log('  ' + p);
}
