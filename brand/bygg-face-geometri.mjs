/**
 * Genererar sajtens märkesgeometri ur maskotfiguren.
 * Kör:  node brand/bygg-face-geometri.mjs
 * Skriver: site/src/lib/face-geometri.ts
 *
 * ── Varför en generator och inte en import ──────────────────────────────
 *
 * Figuren bor i brand/maskot/gravling.mjs och är ett ritverktyg: den räknar
 * fram bezierkurvor, gångcykler och uttryckslägen vid anrop. Sajten behöver
 * inte något av det. Den behöver fyra lägen gånger tre detaljnivåer, alltså
 * tolv färdiga strängar, och de är konstanta.
 *
 * Att låta site/ importera brand/ hade betytt att ett ritbibliotek följde med
 * in i bygget, att Vite måste släppa in filer utanför roten, och att sajtens
 * utfall berodde på kod som ingen granskar i sajtens namn. Generatorn ger i
 * stället en fil som går att läsa, granska i en diff och versionshantera, och
 * sajten står fri.
 *
 * Priset är att någon måste komma ihåg att köra om den. Därför skriver den
 * också in figurens hash i utfilen, så att en glömd körning syns.
 *
 * ── Vad som genereras ───────────────────────────────────────────────────
 *
 * Markupen är ansiktet UTAN omslutande svg, inklusive plattan. Den som bäddar
 * in lägger till ramen, alltså rundad kvadrat eller cirkel. Det är avsiktligt:
 * ramen är sajtens beslut och skiljer sig mellan FaceMark, spriten och
 * kartnålarna, medan ansiktet är figurens och ska vara identiskt överallt.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HAR = dirname(fileURLToPath(import.meta.url));
const ROT = join(HAR, '..');
const FIGUR = join(HAR, 'maskot', 'gravling.mjs');
const UT = join(ROT, 'site', 'src', 'lib', 'face-geometri.ts');
const UT_GANG = join(ROT, 'site', 'public', 'maskot', 'gang.svg');
const UT_IKON = join(ROT, 'site', 'public', 'favicon.svg');
const UT_APPIKON = join(ROT, 'site', 'public', 'maskot', 'appikon.svg');

const LAGEN = ['clean', 'minor', 'major', 'none'];
const NIVAER = ['rik', 'enkel', 'nal'];

/** Plattans steg. Tre av fem, valt på kontrast och inte på smak. */
const PLATTSTEG = 3;

const m = await import(`./maskot/gravling.mjs?v=${Date.now()}`);

/** Plockar ut det som ligger inuti svg-elementet. */
function inre(svg) {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
}

/**
 * Gör id-referenser unika per läge och nivå.
 *
 * Figuren räknar upp sina id vid varje anrop, vilket är rätt där, men här
 * bakas resultatet in i statiska strängar som återanvänds. Två symboler i
 * samma sprite får aldrig bära samma id. Prefixet är därför härlett ur läget
 * och nivån, alltså stabilt mellan byggen: ett slumpat id hade gett nytt
 * utfall varje bygge och tvingat CDN:er att ompröva varenda sida i onödan.
 * Sajten har redan varit där en gång.
 */
function unikaId(markup, prefix) {
  const ids = [...new Set([...markup.matchAll(/\bid="([^"]+)"/g)].map((x) => x[1]))];
  let ut = markup;
  for (const id of ids) {
    const ny = `${prefix}-${id}`;
    ut = ut.replaceAll(`id="${id}"`, `id="${ny}"`);
    ut = ut.replaceAll(`url(#${id})`, `url(#${ny})`);
    ut = ut.replaceAll(`href="#${id}"`, `href="#${ny}"`);
  }
  return ut;
}

/** Uttryck per läge. `none` är neutralt om figuren har det, annars minor. */
function uttryckFor(lage) {
  if (lage === 'none') return m.UTTRYCK && 'none' in m.UTTRYCK ? 'none' : 'minor';
  return lage;
}

/** Ton per läge. Faller tillbaka på minor-grått om figuren saknar none. */
function tonFor(lage) {
  return m.PALETT && lage in m.PALETT ? lage : (lage === 'none' ? 'minor' : lage);
}

const markup = {};
const platta = {};
const matt = [];

for (const lage of LAGEN) {
  markup[lage] = {};
  for (const niva of NIVAER) {
    let svg;
    try {
      svg = m.figur({
        size: 100,
        ton: tonFor(lage),
        uttryck: uttryckFor(lage),
        ansikte: true,
        detalj: niva,
        platta: PLATTSTEG,
      });
    } catch {
      // Nivån finns inte ännu. Fall tillbaka på närmast rikare, så att
      // sajten alltid bygger och saknaden syns som en siffra i tabellen.
      svg = m.figur({
        size: 100,
        ton: tonFor(lage),
        uttryck: uttryckFor(lage),
        ansikte: true,
        detalj: niva === 'nal' ? 'enkel' : 'rik',
        platta: PLATTSTEG,
      });
    }
    const kod = unikaId(inre(svg), `${lage}-${niva}`);
    markup[lage][niva] = kod;
    matt.push({ lage, niva, tecken: kod.length });
  }
  platta[lage] = m.PLATTA_TONER?.[tonFor(lage)]?.[PLATTSTEG]
    ?? m.PALETT?.[tonFor(lage)]?.bas
    ?? '#C7C7CC';
}

/* ── Det FRIA läget ──────────────────────────────────────────────────────
 *
 * Märket är ansiktet beskuret. Figuren är hela grävlingen med kropp, och den
 * hör hemma där en yta är tom eller fel: 404, sökning utan träffar, konto
 * utan bevakningar. Den är dyrare än märket och används därför på få ställen,
 * ett per sida, aldrig i en lista.
 *
 * Gångcykelns åtta rutor genereras också, för den enda yta som ska ha rörelse.
 */
const POSER = ['clean', 'soker', 'hittat', 'vantar', 'nojd', 'tom', 'fyrafyra'];
const figurMarkup = {};
const figurMatt = [];
for (const pose of POSER) {
  if (!(pose in (m.UTTRYCK ?? {}))) continue;
  const kod = unikaId(inre(m.figur({ size: 120, ton: 'blue', uttryck: pose })), `fig-${pose}`);
  figurMarkup[pose] = kod;
  figurMatt.push({ pose, tecken: kod.length });
}

const gangRutor = [];
for (let i = 0; i < (m.GANG?.rutor ?? 0); i++) {
  gangRutor.push(unikaId(inre(m.figur({ size: 120, ton: 'blue', steg: i })), `gang-${i}`));
}

const hash = createHash('sha256').update(readFileSync(FIGUR)).digest('hex').slice(0, 12);

const rader = matt
  .map((x) => ` *   ${x.lage.padEnd(6)} ${x.niva.padEnd(6)} ${String(x.tecken).padStart(6)} tecken`)
  .join('\n');

const fil = `/**
 * GENERERAD FIL. Ändra inte för hand.
 *
 * Skapad av brand/bygg-face-geometri.mjs ur brand/maskot/gravling.mjs.
 * Kör om efter varje ändring i figuren:
 *
 *     node brand/bygg-face-geometri.mjs
 *
 * Figurens hash vid genereringen: ${hash}
 * Plattans steg: ${PLATTSTEG} av 5.
 *
 * Uppmätta teckenlängder, som är det som avgör dokumentstorleken på en
 * kommunhubb med tusentals rader:
 *
${rader}
 *
 * Markupen är ansiktet UTAN omslutande svg, plattan inkluderad. Den som
 * bäddar in lägger till ramen, eftersom ramen skiljer sig mellan FaceMark,
 * spriten och kartnålarna medan ansiktet ska vara identiskt överallt.
 */

export type FaceKeyG = 'clean' | 'minor' | 'major' | 'none';
export type FaceDetaljG = 'rik' | 'enkel' | 'nal';

/** Plattans färg per läge, alltså ytan bakom ansiktet. */
export const FACE_PLATE: Record<FaceKeyG, string> = {
${LAGEN.map((l) => `  ${l}: '${platta[l]}',`).join('\n')}
};

/** Ansiktets markup per läge och detaljnivå. */
export const FACE_MARKUP: Record<FaceKeyG, Record<FaceDetaljG, string>> = {
${LAGEN.map((l) => `  ${l}: {
${NIVAER.map((n) => `    ${n}: ${JSON.stringify(markup[l][n])},`).join('\n')}
  },`).join('\n')}
};

/**
 * DET FRIA LÄGET. Hela figuren, viewBox "0 0 120 120", marken på y 116.
 *
 * Används där en yta är tom eller fel, ett per sida och aldrig i en lista.
 * Den är många gånger dyrare än märket, och det är avsiktligt: den ska bära
 * en hel sida, inte stå bredvid en rad.
 */
export const FIGUR_MARKUP: Record<string, string> = {
${Object.keys(figurMarkup).map((k) => `  ${k}: ${JSON.stringify(figurMarkup[k])},`).join('\n')}
};

/**
 * Gångcykelns bildrutor och deras hålltider i millisekunder.
 *
 * Rörelsen ligger i bildrutor och inte i en transform, eftersom en transform
 * kan flytta, skala och rotera former som redan finns men inte ÄNDRA en form.
 * Det är formändringen som skiljer en levande figur från en pappersdocka på
 * en pinne. Hålltiderna är ojämna med flit: en ren steps() håller varje ruta
 * lika länge, och den jämnheten läser ögat som mekanisk.
 */
export const FIGUR_GANG_FIL = '/maskot/gang.svg';
export const FIGUR_GANG_HALLTID: number[] = ${JSON.stringify(m.GANG?.halltid ?? [])};

/** Teckenlängder, för den som mäter dokumentstorlek. */
export const FACE_TECKEN: Record<FaceKeyG, Record<FaceDetaljG, number>> = {
${LAGEN.map((l) => `  ${l}: { ${NIVAER.map((n) => `${n}: ${markup[l][n].length}`).join(', ')} },`).join('\n')}
};
`;

/* ── Gångcykeln som EGEN FIL ─────────────────────────────────────────────
 *
 * Åtta bildrutor är omkring 117 kB. Inlinat i en sida är det oförsvarbart, och
 * på en sajt vars bärande princip är att inte skicka onödiga byte vore det ett
 * självmål att lägga det i HTML:en.
 *
 * Som egen fil kostar den noll i dokumentet, cachas av webbläsaren, och laddas
 * bara på de sidor som faktiskt använder den. Animationen ligger inuti filen,
 * så den fungerar i ett vanligt <img>-element utan skript.
 *
 * Rutorna läggs på rad och en grupp flyttas i hårda klipp. Hålltiderna är
 * ojämna: en ren steps() håller varje ruta lika länge, och den jämnheten läser
 * ögat som mekanisk. Kontaktlägena ligger kvar längre än passeringarna.
 */
if (gangRutor.length) {
  const halltid = m.GANG?.halltid ?? gangRutor.map(() => 100);
  const total = halltid.reduce((a, b) => a + b, 0);
  let t = 0;
  const steg = gangRutor.map((_, i) => {
    const fran = (t / total) * 100;
    t += halltid[i];
    const till = (t / total) * 100;
    return `${fran.toFixed(2)}%,${(till - 0.01).toFixed(2)}%{transform:translateX(${-120 * i}px)}`;
  }).join('');

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" ` +
    `role="img" aria-label="Prikkos grävling går">` +
    `<style>` +
    `@keyframes g{${steg}100%{transform:translateX(${-120 * (gangRutor.length - 1)}px)}}` +
    `.r{animation:g ${(total / 1000).toFixed(2)}s linear infinite}` +
    /* Rörelse kan utlösa yrsel hos den som har en vestibulär sjukdom. Den som
       bett om mindre rörelse har oftast ett medicinskt skäl, och den första
       bildrutan är ett giltigt stillbildsläge. */
    `@media(prefers-reduced-motion:reduce){.r{animation:none}}` +
    `</style>` +
    `<g class="r">` +
    gangRutor.map((r, i) => `<g transform="translate(${120 * i} 0)">${r}</g>`).join('') +
    `</g></svg>`;

  mkdirSync(dirname(UT_GANG), { recursive: true });
  writeFileSync(UT_GANG, svg);
  console.log(`Skrev ${UT_GANG} (${svg.length} tecken, ${(total / 1000).toFixed(2)} s loop)`);
}

/* ── IKONERNA ────────────────────────────────────────────────────────────
 *
 * Favicon och app-ikon var tidigare ordmärkets smiley, alltså två prickar och
 * en båge utan platta. Nu när sajten har en maskot är den rundade kvadraten
 * med grävlingens ansikte exakt det formatet en ikon vill ha, och det är också
 * det enda stället där en app-ikon och ett bedömningsmärke är samma sak.
 *
 * Ikonen byggs ur NAL-nivån och inte ur den rika. En favicon visas i 16 till
 * 32 px i en flikrad, alltså precis det spann nal-nivån är ritad för. Den rika
 * hade lagt åtta kilobyte på en fil som laddas på varje sidvisning, för
 * detaljer som ingen kan se.
 *
 * Blå och inte grön. Ikonen är AVSÄNDARE och inte data: den säger vem sajten
 * är, inte hur det står till med en verksamhet. Ett grönt märke i flikraden
 * hade påstått något om ett företag som inte finns på skärmen.
 *
 * Plattan är fylld med flit. Den gamla ikonen var genomskinlig och behövde
 * därför en egen regel för mörkt läge, eftersom prikkoblått mot en nästan
 * svart flikrad hamnade runt 3,2:1. En fylld platta bär sin egen bakgrund och
 * behöver ingen sådan regel alls.
 */
function ikon(storlek, kommentar) {
  const inreKod = unikaId(inre(m.figur({
    size: 100, ton: 'blue', uttryck: 'clean', ansikte: true, detalj: 'nal', platta: 3,
  })), 'ikon');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${storlek}" height="${storlek}" role="img" aria-label="Prikko">\n<!--\n${kommentar}\n-->\n` +
    `<clipPath id="ikon-ram"><rect width="100" height="100" rx="${17}"/></clipPath>` +
    `<g clip-path="url(#ikon-ram)">${inreKod}</g></svg>\n`;
}

writeFileSync(UT_IKON, ikon(100, [
  '  GENERERAD FIL. Ändra inte för hand.',
  '  Skapad av brand/bygg-face-geometri.mjs ur brand/maskot/gravling.mjs.',
  '',
  '  Grävlingens ansikte i den rundade kvadraten, byggt ur nal-nivån eftersom',
  '  en favicon visas i 16 till 32 px. Blå och inte grön: ikonen säger vem',
  '  sajten är, inte hur det står till med en verksamhet.',
  '',
  '  Plattan är fylld, vilket gör den gamla mörka-läget-regeln onödig: en fylld',
  '  platta bär sin egen bakgrund mot flikradens nästan svarta yta.',
].join('\n')));

/* App-ikonen levereras som SVG här och rasteriseras till apple-touch-icon.png
   av brand/bygg-appikon.mjs. iOS lägger ikonen mot en egen bakgrund och gör
   genomskinligt till svart, så den MÅSTE vara fylld kant i kant. Den rundade
   kvadraten är därför utan clip: iOS rundar hörnen själv, och rundar man dem
   två gånger blir kanten grå och fransig. */
writeFileSync(UT_APPIKON, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="180" height="180" role="img" aria-label="Prikko">
<!--
  GENERERAD FIL. Ändra inte för hand.
  Underlag för apple-touch-icon.png, rasteriseras av brand/bygg-appikon.mjs.

  UTAN rundade hörn med flit: iOS maskar ikonen själv, och rundar man hörnen
  två gånger blir kanten grå och fransig. Fylld kant i kant av samma skäl som
  förut, iOS gör genomskinligt till svart.
-->
${unikaId(inre(m.figur({ size: 100, ton: 'blue', uttryck: 'clean', ansikte: true, detalj: 'enkel', platta: 3 })), 'app')}</svg>
`);
console.log(`Skrev ${UT_IKON}`);
console.log(`Skrev ${UT_APPIKON}`);

writeFileSync(UT, fil);
console.log(`Skrev ${UT}`);
console.log(`Figurens hash: ${hash}`);
for (const x of matt) console.log(`  ${x.lage.padEnd(6)} ${x.niva.padEnd(6)} ${String(x.tecken).padStart(6)} tecken`);
console.log('Fritt läge:');
for (const x of figurMatt) console.log(`  ${x.pose.padEnd(9)} ${String(x.tecken).padStart(6)} tecken`);
console.log(`  gångcykel  ${gangRutor.length} rutor, ${gangRutor.reduce((a, b) => a + b.length, 0)} tecken totalt`);
