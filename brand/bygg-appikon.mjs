/**
 * Rasteriserar app-ikonen till apple-touch-icon.png.
 * Kör:  node brand/bygg-appikon.mjs
 *
 * iOS läser inte SVG som hemskärmsikon, så den enda vägen är en PNG. Underlaget
 * genereras av bygg-face-geometri.mjs och ligger i site/public/maskot/appikon.svg,
 * alltså samma figur som märket och favicon. Att rita ikonen för hand vid sidan
 * av är hur en ikon slutar likna produkten.
 *
 * 180 px är Apples nuvarande största begärda storlek. Mindre storlekar skalas
 * ned av systemet.
 *
 * Rasteriseringen görs med den Chrome som redan finns på maskinen, i stället för
 * ett bildbibliotek som beroende. En ikon byggs om några gånger om året.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const ROT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KALLA = join(ROT, 'site', 'public', 'maskot', 'appikon.svg');
const UT = join(ROT, 'site', 'public', 'apple-touch-icon.png');

/* Maskoten för e-post. Gmail rensar bort SVG och Outlook renderar den inte
   alls, så den enda vägen in i ett mejl är en PNG på en publik adress. Den
   rasteriseras ur samma figur som allt annat, av samma skäl som app-ikonen:
   en figur som ritas för hand vid sidan av slutar likna produkten.

   144 px är 72 logiska px i dubbel upplösning, alltså skarp på en modern
   skärm utan att bli en tung bilaga. */
const KALLA_MEJL = join(ROT, 'site', 'public', 'maskot', 'mejl.svg');
const UT_MEJL = join(ROT, 'site', 'public', 'maskot-mejl.png');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

if (!existsSync(CHROME)) {
  console.error('Chrome hittades inte. Kör bygg-face-geometri.mjs först och rastrera för hand.');
  process.exit(1);
}

execFileSync(CHROME, [
  '--headless', '--disable-gpu', '--hide-scrollbars',
  '--default-background-color=00000000',
  `--screenshot=${UT}`,
  '--window-size=180,180',
  '--virtual-time-budget=2000',
  `file://${KALLA}`,
], { stdio: 'inherit' });

console.log(`Skrev ${UT}`);

if (existsSync(KALLA_MEJL)) {
  execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--hide-scrollbars',
    '--default-background-color=00000000',
    `--screenshot=${UT_MEJL}`,
    '--window-size=144,144',
    '--virtual-time-budget=2000',
    `file://${KALLA_MEJL}`,
  ], { stdio: 'inherit' });
  console.log(`Skrev ${UT_MEJL}`);
}
