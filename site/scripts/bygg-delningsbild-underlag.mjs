/**
 * Underlaget till delningsbilden: glyfkonturer och ordmärket, en fil.
 *
 * ## Varför filen finns
 *
 * Delningsbilden ritas i en Pages Function, alltså i en Workers-isolat utan
 * sharp, utan canvas och utan systemtypsnitt. Den kan därför inte be någon
 * annan rita text åt sig, den måste rita bokstäverna själv. Det den behöver
 * för det är konturerna, och de ligger i Instrument Sans woff2-fil som redan
 * finns i node_modules. Skriptet packar upp dem här, vid bygget, och skriver
 * dem som en enda fil som funktionen hämtar ur den statiska utgåvan.
 *
 * En fil i utgåvan och inte 17 868. Det är hela poängen, se docs/17 punkt 8b.
 *
 * ## Varför konturer och inte färdiga bokstavsbilder
 *
 * Alternativet var att rastrera varje bokstav i tre storlekar med sharp och
 * skicka bilderna. Det hade gett librsvg:s kantutjämning, men låst
 * storlekarna: ett namn på 41 tecken, vilket var hundrade verksamhet har,
 * måste kunna krympa tills det ryms. Konturer kan skalas, bilder kan det inte.
 * Filen blir dessutom mindre: 129 tecken i två vikter väger 92 kB, mindre än
 * en enda bokstavsatlas i en enda storlek.
 *
 * ## Teckenuppsättningen är MÄTT, inte gissad
 *
 * Alla namn, adresser och orter i site/src/data läses igenom, och varje tecken
 * som förekommer kommer med. Uppmätt 2026-09-05: 111 olika tecken över 17 146
 * verksamheter. Utöver dem tas hela synliga ASCII med, eftersom de generiska
 * korten ritar sidans egen titel och beskrivning och de skrivs av våra mallar.
 * Summan blir 129 tecken.
 *
 * ## Varför de STATISKA vikterna och inte den variabla filen
 *
 * Sajten laddar Instrument Sans som variabelt typsnitt, och den filen ligger
 * redan i node_modules. Den går ändå inte att använda här. `fontkitten` läser
 * konturer ur en woff2 utmärkt men bara i axelns förvalsläge, alltså 400:
 * `getVariation()` bygger en TTFFont ur en woff2-ström och den fonten går
 * sönder på första uppslagningen, `numGlyphs` kastar, och klassen WOFF2Font
 * exporteras inte så felet går inte att kringgå utifrån.
 *
 * Att nöja sig med 400 vore inte en detalj. Uppmätt i typsnittets eget rutnät:
 * stammen i ett I är 82 enheter vid vikt 400 och 130 vid 600, alltså 6,1 px
 * mot 9,6 px i kortets rubrikstorlek 74 px. Det är 58 procent tjockare.
 * tokens.css säger dessutom rakt ut varför det spelar roll: "Booli kör 600 på
 * varenda rubrik på varenda sidtyp; det är en av anledningarna till att deras
 * sidor läser som samma produkt." En delningsbild med en mager rubrik hade
 * läst som en annan produkt.
 *
 * Alltså läses konturerna ur @fontsource/instrument-sans, som är samma familj
 * från samma utgivare som @fontsource/instrument-serif redan i package.json,
 * och den ligger som devDependency eftersom den bara körs vid bygget. Vikt 400
 * ur den statiska filen är samma kontur som den variabla ger i förvalsläget,
 * kontrollerat: stegbredd 736 och stam 82 i båda.
 *
 * Körs av prebuild, samma plats som kopiera-maplibre.mjs:
 *   node scripts/bygg-delningsbild-underlag.mjs
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { create } from 'fontkitten';
import sharp from 'sharp';

const here = fileURLToPath(new URL('.', import.meta.url));
const dataDir = `${here}../src/data`;
const publicDir = `${here}../public`;
const wordmarkFile = `${here}../../brand/prikko-wordmark.svg`;

/*
 * Två delmängder, och båda behövs. `latin` bär allt utom ō, som förekommer i
 * ett enda namn av 17 146, och det tecknet finns bara i `latin-ext`. Att
 * hämta båda kostar en uppslagning i tur och ordning och gör att inget namn
 * kan tappa ett tecken.
 */
const VIKTER = [400, 600];

const fontFiles = (vikt) =>
  [`instrument-sans-latin-${vikt}-normal.woff2`, `instrument-sans-latin-ext-${vikt}-normal.woff2`].map(
    (f) => `${here}../node_modules/@fontsource/instrument-sans/files/${f}`,
  );

/* -------------------------------------------------------------------------- */
/* Teckenuppsättningen                                                         */
/* -------------------------------------------------------------------------- */

function charset() {
  const set = new Set();

  /* Hela synliga ASCII. De generiska korten ritar sidans titel och
     beskrivning, och de skrivs av våra egna mallar med parenteser, procent
     och siffror i. */
  for (let c = 0x20; c <= 0x7e; c++) set.add(String.fromCharCode(c));

  /* Typografiska tecken mallarna använder och som inte ligger i ASCII. */
  for (const c of '–—’”“…·°') set.add(c);

  for (const file of readdirSync(dataDir)) {
    if (!file.endsWith('.json')) continue;
    const data = JSON.parse(readFileSync(`${dataDir}/${file}`, 'utf8'));
    if (!data.establishments) continue;
    for (const c of data.municipality.city ?? '') set.add(c);
    for (const c of data.municipality.name ?? '') set.add(c);
    for (const e of data.establishments) {
      for (const c of e.name ?? '') set.add(c);
      for (const c of e.address ?? '') set.add(c);
    }
  }

  /* Radbrytningar och tabbar finns i tre namn i källdatan, och det mjuka
     bindestrecket kan ligga i en mall. Alla fyra städas bort vid ritning,
     alltså behöver de ingen egen kontur. Se `stada()` i lib/delningsbild.ts. */
  for (const c of '\n\r\t\u00ad') set.delete(c);

  return [...set].sort();
}

/* -------------------------------------------------------------------------- */
/* Konturerna                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Kommandona som tal, inte som SVG-text.
 *
 * 0 = flytta, 1 = linje, 2 = kvadratisk, 3 = kubisk, 4 = slut på konturen.
 * Talet efter opkoden säger hur många koordinater som följer, och rasteraren
 * läser listan rakt igenom. En sträng hade krävt en banparser i funktionen, och
 * det är den enda sorts kod man aldrig får skriva två gånger.
 *
 * Koordinaterna avrundas till hela enheter i typsnittets eget rutnät om 1 000
 * per fyrkant. Vid 74 px är en enhet 0,074 px, alltså långt under vad
 * kantutjämningen kan visa, och avrundningen halverar filen.
 */
function commands(path) {
  const out = [];
  for (const c of path.commands) {
    const a = c.args.map(Math.round);
    if (c.command === 'moveTo') out.push(0, ...a);
    else if (c.command === 'lineTo') out.push(1, ...a);
    else if (c.command === 'quadraticCurveTo') out.push(2, ...a);
    else if (c.command === 'bezierCurveTo') out.push(3, ...a);
    else if (c.command === 'closePath') out.push(4);
  }
  return out;
}

function glyphs(chars, vikt) {
  const fonts = fontFiles(vikt).map((f) => create(readFileSync(f)));
  const out = {};
  const missing = [];

  for (const ch of chars) {
    const cp = ch.codePointAt(0);
    const font = fonts.find((f) => f.hasGlyphForCodePoint(cp));
    if (!font) {
      missing.push(ch);
      continue;
    }
    const g = font.glyphForCodePoint(cp);
    const scale = 1000 / font.unitsPerEm;
    const entry = { a: Math.round(g.advanceWidth * scale) };
    const d = commands(g.path);
    if (d.length) entry.d = d;
    out[ch] = entry;
  }

  if (missing.length) {
    throw new Error(`Vikt ${vikt} saknar konturer för: ${missing.join(' ')}`);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Ordmärket                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Ordmärket som täckningsmask, rastrerat en gång i sin slutliga storlek.
 *
 * Rasteraren i funktionen fyller banor, den stryker dem inte, och ordmärkets
 * mun är en STRUKEN båge med rundade ändar. Att skriva en strykningsalgoritm
 * för en enda båge vore fel arbete. Här finns librsvg redan via sharp, alltså
 * ritas märket här och skickas som alfavärden.
 *
 * 176 px bredd är märkets bredd på kortet, och den enda som behövs: kortet är
 * alltid 1 200 x 630 och märket sitter alltid i samma hörn. En mask i en
 * storlek väger 176 x 66 = 11 616 byte före komprimering.
 */
async function wordmark() {
  const svg = readFileSync(wordmarkFile, 'utf8');
  const W = 176;
  const H = Math.round((59 / 159) * W);

  /* Alfakanalen ensam. Färgen sätts av kortet, som lägger märket i
     märkesblåans toneskala, alltså ska masken inte bära någon egen färg. */
  const { data, info } = await sharp(Buffer.from(svg))
    .resize(W, H)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const alpha = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) alpha[i] = data[i * info.channels + (info.channels - 1)];

  return { b: W, h: H, px: alpha.toString('base64') };
}

/* -------------------------------------------------------------------------- */

const chars = charset();
const vikter = Object.fromEntries(VIKTER.map((v) => [v, glyphs(chars, v)]));
const ordmarke = await wordmark();

mkdirSync(`${publicDir}/delningsbild`, { recursive: true });
const file = `${publicDir}/delningsbild/underlag.json`;
writeFileSync(file, JSON.stringify({ upm: 1000, vikter, ordmarke }));

const bytes = readFileSync(file).length;
console.log(
  `Skrev public/delningsbild/underlag.json: ${chars.length} tecken i ` +
    `${VIKTER.length} vikter, ordmärke ${ordmarke.b}x${ordmarke.h}, ` +
    `${(bytes / 1024).toFixed(1)} kB.`,
);
