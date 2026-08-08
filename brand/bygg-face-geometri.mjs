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
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HAR = dirname(fileURLToPath(import.meta.url));
const ROT = join(HAR, '..');
const FIGUR = join(HAR, 'maskot', 'gravling.mjs');
const UT = join(ROT, 'site', 'src', 'lib', 'face-geometri.ts');

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

/** Teckenlängder, för den som mäter dokumentstorlek. */
export const FACE_TECKEN: Record<FaceKeyG, Record<FaceDetaljG, number>> = {
${LAGEN.map((l) => `  ${l}: { ${NIVAER.map((n) => `${n}: ${markup[l][n].length}`).join(', ')} },`).join('\n')}
};
`;

writeFileSync(UT, fil);
console.log(`Skrev ${UT}`);
console.log(`Figurens hash: ${hash}`);
for (const x of matt) console.log(`  ${x.lage.padEnd(6)} ${x.niva.padEnd(6)} ${String(x.tecken).padStart(6)} tecken`);
