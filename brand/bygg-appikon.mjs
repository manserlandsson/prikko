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
