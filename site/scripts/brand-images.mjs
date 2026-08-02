/**
 * Genererar de två bitmappade märkesfilerna i public/.
 *
 * Varför de behövs: `Base.astro` refererar `/og-default.png` och
 * `/apple-touch-icon.png` på varenda sida, och ingen av filerna fanns.
 * 15 428 sidor gav alltså 404 på sin delningsbild, och `twitter:card` är satt
 * till `summary_large_image`, som inte renderar någonting alls utan bild. En
 * länk i Slack, LinkedIn eller ett redaktionellt nyhetsbrev blev en tom ruta.
 * R3 §1 säger att Prikko inte fångar efterfrågan utan skapar en kategori och
 * att PR går före sök. Då är delningsförhandsvisningen inte kosmetik, den är
 * distributionsytan.
 *
 * Varför bilderna genereras och checkas in i stället för att byggas varje
 * gång: de ändras bara när märket ändras, och ett bygge som producerar
 * identiska binärer 15 000 gånger om året är slöseri. Skriptet är formen,
 * PNG-filen är utfallet.
 *
 * Formgivning, medvetet återhållsam. Wordmarken är Måns egen och ligger som
 * vektor i brand/prikko-wordmark.svg; banorna kopieras därifrån vid körning i
 * stället för att skrivas av, så filen kan inte glida isär från logotypen. Vit
 * botten, en rad i klarspråk under, och en brandblå list längs nederkanten.
 * Ingen toning över ytan, inga emoji, ingenting som inte redan finns i
 * varumärket.
 *
 * Typsnittet i underraden är en systemgrotesk, inte Instrument Sans:
 * SVG-renderaren i sharp läser bara installerade systemtypsnitt, och ett
 * inbäddat @font-face skulle tyst falla tillbaka ändå. Underraden är två
 * sekundära ord under en vektorlogotyp, och skillnaden bär inte kostnaden av
 * en typsnittspipeline. Ändras det ska wordmarken ändå ligga kvar som vektor.
 *
 * Körs manuellt när märket ändras:
 *   node scripts/brand-images.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = fileURLToPath(new URL('.', import.meta.url));
const publicDir = `${here}../public`;
const wordmarkFile = `${here}../../brand/prikko-wordmark.svg`;

/** Ur tokens.css. Hårdkodade här: skriptet körs utanför Vite. */
const BRAND = '#007BE0';
const BRAND_DEEP = '#005EAB';
const TEXT_SECONDARY = '#6E6E73';

/** Systemgrotesker i fallande ordning. Sista posten finns överallt. */
const SANS = 'Instrument Sans, Helvetica Neue, Helvetica, Arial, sans-serif';

/** Innehållet mellan <svg> och </svg>, alltså banorna utan yttre ram. */
function innerSvg(file) {
  const svg = readFileSync(file, 'utf8');
  return svg.slice(svg.indexOf('>', svg.indexOf('<svg')) + 1, svg.lastIndexOf('</svg>')).trim();
}

/**
 * Delningsbilden, 1200 × 630.
 *
 * Måtten är Facebooks och LinkedIns rekommendation och Twitters krav för
 * `summary_large_image`. Google Discover kräver minst 1 200 px bredd, vilket
 * är samma tal.
 */
async function shareImage() {
  const W = 1200;
  const H = 630;

  // Wordmarken är 159 × 59 i sin egen viewBox. Skalan sätter bredden till
  // 520 px, ungefär 43 % av bilden: stort nog att läsas i en Slack-förhands-
  // visning på ett par hundra pixlar, litet nog att inte se uppblåst ut.
  const scale = 520 / 159;
  const markW = 159 * scale;
  const markH = 59 * scale;

  // Blocket centreras optiskt, alltså något över mitten. Ett block som
  // centreras matematiskt läses som för lågt placerat.
  const blockH = markH + 46 + 40;
  const top = Math.round((H - blockH) / 2) - 14;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>
  <!-- fill="none" hör till den yttre <svg> i brand-filen, som inte följer med
       innerSvg(). Utan den fylls munnens bana svart i stället för att bara
       strykas i brandblått. -->
  <g fill="none" transform="translate(${Math.round((W - markW) / 2)} ${top}) scale(${scale})">
    ${innerSvg(wordmarkFile)}
  </g>
  <text x="${W / 2}" y="${top + markH + 46 + 34}" text-anchor="middle"
        font-family="${SANS}" font-size="40" fill="${TEXT_SECONDARY}"
    >Kommunernas hygienkontroller, samlade</text>
  <rect x="0" y="${H - 12}" width="${W}" height="12" fill="${BRAND}"/>
</svg>`;

  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(`${publicDir}/og-default.png`);
}

/**
 * Ikonen för hemskärmen på iOS, 180 × 180.
 *
 * Samma ansikte som favicon.svg, men helt utfallande utan egna rundade hörn:
 * iOS lägger sin egen mask över ikonen, och transparenta hörn i filen blir
 * svarta kanter i äldre versioner.
 */
async function touchIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 96 96">
  <defs>
    <linearGradient id="bg" x1="48" y1="0" x2="48" y2="96" gradientUnits="userSpaceOnUse">
      <stop stop-color="${BRAND}"/>
      <stop offset="1" stop-color="${BRAND_DEEP}"/>
    </linearGradient>
  </defs>
  <rect width="96" height="96" fill="url(#bg)"/>
  <path d="M37.8719 43.2457C41.2535 43.2457 43.9948 40.5044 43.9948 37.1229C43.9948 33.7413 41.2535 31 37.8719 31C34.4903 31 31.749 33.7413 31.749 37.1229C31.749 40.5044 34.4903 43.2457 37.8719 43.2457Z" fill="white"/>
  <path d="M60.6141 43.2457C63.9957 43.2457 66.737 40.5044 66.737 37.1229C66.737 33.7413 63.9957 31 60.6141 31C57.2325 31 54.4912 33.7413 54.4912 37.1229C54.4912 40.5044 57.2325 43.2457 60.6141 43.2457Z" fill="white"/>
  <path d="M30 55.4883C42.2457 67.1509 54.4915 67.1509 66.7372 55.4883" stroke="white" stroke-width="7.87226" stroke-linecap="round" fill="none"/>
</svg>`;

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(`${publicDir}/apple-touch-icon.png`);
}

await shareImage();
await touchIcon();
console.log('Skrev public/og-default.png och public/apple-touch-icon.png');
