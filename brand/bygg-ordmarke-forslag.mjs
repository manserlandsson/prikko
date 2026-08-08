/**
 * Bygger ordmärkesarket: ska grävlingen in i loggan, och i så fall hur hårt?
 * Kör:  node brand/bygg-ordmarke-forslag.mjs  ->  brand/ordmarke-forslag.html
 *
 * ── Varför frågan ställs ────────────────────────────────────────────────
 *
 * Ägaren: "hur ska vi få in grävlingen mer, nu är han ju vår maskot, då ska
 * han ju vara central."
 *
 * Den enda åtgärden som gör figuren CENTRAL i stället för bara närvarande är
 * ordmärket. Byts smileyn i loggan mot grävlingens ansikte är han med i
 * sidhuvudet på varje sida sajten har, i favikonen, i delningsbilden och i
 * varje mejl. Det är så Duolingo fungerar: ugglan ÄR varumärket.
 *
 * Skälet till att allt annat känns som placeringar är regeln i docs/24: han
 * får inte stå bredvid en bedömning av en namngiven verksamhet, och sajtens
 * 15 916 mest besökta sidor ÄR sådana bedömningar. De största ytorna är
 * alltså stängda med avsikt, och ordmärket är den enda stora yta som är öppen.
 *
 * ── Vad det här arket är, och inte är ───────────────────────────────────
 *
 * Ett förslag att välja ur. Nuvarande logga och wordmark står orörda i sajten,
 * och ingenting här är inkopplat. Ägaren har tidigare sagt att han gillar
 * loggan som den är, så beslutet är hans och bara hans.
 *
 * ── Varför arket ser ut som det gör ─────────────────────────────────────
 *
 * Frågan avgörs INTE på ett vitt ark i 200 px. Den avgörs i sidhuvudets
 * verkliga höjd, som är 36 px på desktop och mindre på mobil, där grävlingens
 * ansikte bara får vara omkring 20 px högt. Ett ansikte med ögon, bryn och mun
 * i 20 px är en hård fråga, och den ska ställas rakt.
 *
 * Därför visas varje variant i ett riktigt sidhuvud, i 1280 och 375 px bredd,
 * före alla närbilder. Närbilderna finns för att förstå VARFÖR, inte för att
 * välja.
 */
import { writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STIL } from './maskot-ark-stil.mjs';

const HAR = dirname(fileURLToPath(import.meta.url));

let VARIANTER = null;
if (existsSync(join(HAR, 'ordmarke-varianter.mjs'))) {
  ({ VARIANTER } = await import('./ordmarke-varianter.mjs'));
}

if (!VARIANTER) {
  console.error('brand/ordmarke-varianter.mjs saknas. Inget att bygga än.');
  process.exit(1);
}

/* Nuvarande först, sedan stigande grad av ingrepp. Ordningen är avsiktlig:
   den som väljer ska se utgångsläget innan förslagen. */
const ORDNING = ['nuvarande', 'a', 'b', 'c', 'd'].filter((k) => VARIANTER[k]);

const BLA = '#007BE0';

/**
 * Sidhuvudet, byggt av sajtens egna mått.
 *
 * Detta är arkets viktigaste ruta. Allt annat är stödbevisning.
 */
function sidhuvud(v, bredd) {
  const mobil = bredd < 700;
  const hojd = mobil ? 28 : 36;
  return `<div class="skarm" style="width:${bredd}px">
  <div class="huvud">
    ${v.svg({ height: hojd, farg: BLA })}
    <span class="sok">${mobil ? 'Sök ställe eller ort' : 'Sök restaurang, café eller kommun'}</span>
    <span class="meny"></span>
  </div>
  <div class="innehall">
    <div class="rad lang"></div>
    <div class="rad kort"></div>
  </div>
</div>`;
}

function kort(nyckel) {
  const v = VARIANTER[nyckel];
  const ar = nyckel === 'nuvarande';
  return `<section class="kort" id="om-${nyckel}">
  <h3 style="margin-top:0">${v.namn}${ar ? ' <span class="tagg">utgångsläget</span>' : ''}</h3>
  <p class="note" style="max-width:680px">${v.koncept}</p>

  <div class="block">
    <h4>I sidhuvudet, 1280 px. Här avgörs frågan</h4>
    <div class="ruta">${sidhuvud(v, 1180)}</div>
  </div>

  <div class="block">
    <h4>I sidhuvudet, 375 px</h4>
    <div class="ruta"><div class="rad">${sidhuvud(v, 375)}</div></div>
  </div>

  <div class="block">
    <h4>Höjderna, 64 / 36 / 28 / 20 px</h4>
    <div class="ruta">
      <div class="rad mitt">${[64, 36, 28, 20].map((h) => v.svg({ height: h, farg: BLA })).join('')}</div>
    </div>
    <div class="ruta mork" style="margin-top:12px">
      <div class="rad mitt">${[64, 36, 28, 20].map((h) => v.svg({ height: h, farg: '#FFFFFF' })).join('')}</div>
    </div>
  </div>

  <div class="block">
    <h4>I gråskala, 36 och 20 px</h4>
    <div class="ruta">
      <div class="rad mitt" style="filter:grayscale(1)">${[36, 20].map((h) => v.svg({ height: h, farg: BLA })).join('')}</div>
      <p class="note" style="margin:10px 0 0">Ett ordmärke måste fungera i en färg. Faller
      ansiktet ihop till en fläck här bär det inte i tryck heller.</p>
    </div>
  </div>
</section>`;
}

const html = `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Prikkos ordmärke, med eller utan grävlingen</title>
<style>${STIL}
/* Ett riktigt sidhuvud i miniatyr, med sajtens egna mått ur tokens.css. */
.skarm { border: 1px solid var(--hairline); border-radius: 12px; overflow: hidden;
  background: var(--card); max-width: 100%; }
.huvud { display: flex; align-items: center; gap: 16px; padding: 12px 20px;
  border-bottom: 1px solid var(--hairline); }
.huvud .sok { flex: 1; background: var(--canvas); border: 1px solid var(--hairline);
  border-radius: 999px; padding: 9px 16px; font-size: 14px; color: var(--ink-faint); }
.huvud .meny { width: 34px; height: 34px; border-radius: 999px; border: 1px solid var(--hairline); }
.innehall { padding: 20px; background: var(--canvas); }
.innehall .rad { height: 10px; border-radius: 999px; background: rgba(0,0,0,.06); }
.innehall .rad.lang { width: 62%; margin-bottom: 10px; }
.innehall .rad.kort { width: 38%; }
.ruta.mork { background: #1D1D1F; border-color: #1D1D1F; }
</style>
<div class="wrap">
  <div class="read">
    <h1>Ordmärket, med eller utan grävlingen</h1>
    <p class="lead">Frågan är inte om maskoten är bra. Den är om han ska bo i loggan.</p>

    <p>Ägarens fråga var hur grävlingen blir <b>central</b> och inte bara närvarande. Svaret
    är ordmärket, och skälet är obekvämt: regeln i <code>docs/24</code> säger att han aldrig
    får stå bredvid en bedömning av en namngiven verksamhet, och sajtens 15 916 mest besökta
    sidor är precis sådana bedömningar. De största ytorna är stängda med avsikt. Ordmärket är
    den enda stora yta som är öppen, eftersom det är avsändaren och inte en dom.</p>

    <p>Byts smileyn i loggan mot grävlingens ansikte finns han i sidhuvudet på varje sida,
    i favikonen, i delningsbilden och i varje mejl. Det är så Duolingo fungerar: ugglan är
    inte placerad i produkten, den <b>är</b> varumärket.</p>

    <div class="kort">
      <h4>Läs arket i rätt ordning</h4>
      <p class="note" style="margin:0">Frågan avgörs i <b>sidhuvudets verkliga höjd</b>, alltså
      36 px på desktop och 28 på mobil, där ansiktet bara får vara omkring 20 px. Titta där
      först. Närbilderna längre ned finns för att förstå varför, inte för att välja på.</p>
      <p class="note" style="margin:10px 0 0">Och en ärlig brasklapp innan du börjar: ett
      ansikte med ögon, bryn och mun i 20 px är en hård fråga. Om svaret blir att det inte
      bär, är det ett giltigt svar och inte ett misslyckande.</p>
    </div>

    <div class="kort">
      <h4>Vad som INTE är rört</h4>
      <p class="note" style="margin:0">Ingenting här är inkopplat. <code>Wordmark.astro</code>,
      <code>Header.astro</code> och <code>brand/prikko-wordmark.svg</code> står orörda, och
      sajten ser ut precis som förut. Det här är ett ark att välja ur.</p>
    </div>
  </div>

  <h2>Varianterna</h2>
  <p class="read">Från minsta till största ingrepp. Alla i Prikkoblå, aldrig i en
  bedömningsfärg: loggan är avsändare och inte data, och den delningen står i
  <code>docs/24</code>.</p>
  ${ORDNING.map(kort).join('')}
</div>
`;

const ut = join(HAR, 'ordmarke-forslag.html');
writeFileSync(ut, html);
console.log(`Skrev ${ut}`);
console.log(`Varianter: ${ORDNING.map((k) => VARIANTER[k].namn).join(', ')}`);
