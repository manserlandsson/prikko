/**
 * Ordmärket som konturer. En källa i koden, två konsumenter.
 *
 * ============================================================================
 * VARFÖR RITNINGEN FLYTTADE HIT UR Wordmark.astro
 * ============================================================================
 *
 * Den låg som fyra `<path>` direkt i komponenten, vilket var rätt så länge den
 * bara skulle ritas på en sida. Nu ska den också ligga i fönsterdekalen, och
 * dekalen byggs av `functions/api/marke.ts`, som Cloudflare Pages bundlar för
 * sig med esbuild. En `.astro`-fil går inte att importera dit.
 *
 * Alternativet hade varit att skriva av ritningen till dekalfilen. Två kopior
 * av ett ordmärke är två ordmärken så fort någon rättar det ena, och det här
 * är logotypen. Alltså ligger den som ren TypeScript, som både komponenten och
 * funktionen kan läsa.
 *
 * Originalet ligger fortfarande i brand/prikko-wordmark.svg. Ändras den ena
 * ska den andra följa.
 *
 * ============================================================================
 * VARFÖR DEKALEN INTE FÅR SÄTTA ORDET SOM TEXT
 * ============================================================================
 *
 * Dekalen bar först `prikko.se` som en `<text>` i
 * `font-family="'Instrument Sans',...,Helvetica,Arial,sans-serif"`. Rastrerad
 * på en maskin utan Instrument Sans installerad blev det Helvetica.
 *
 * Det är inte en detalj. Ett ordmärke ÄR sin form. Ett ordmärke satt i
 * Helvetica är inte vårt ordmärke i fel typsnitt, det är ett annat ordmärke.
 * Och den filen hamnar i ett skyltfönster.
 *
 * Som konturer finns ingen font att sakna, och filen ser likadan ut i varje
 * program som kan öppna en SVG.
 */

/** Ritningens egen ruta. Bredd genom höjd är 159/59, alltså 2,695. */
export const WORDMARK_VIEWBOX = '0 0 159 59';
export const WORDMARK_RATIO = 159 / 59;

/**
 * De fyllda konturerna: bokstäverna och smileyns två ögon.
 *
 * Ögonen bär både `fill` och `stroke` i originalet. Strecket är en hårsmån
 * som gör prickarna aningen tyngre, och det ska stå kvar: utan det krymper de
 * synligt mot bokstäverna i små storlekar.
 */
export const WORDMARK_FILLS: string[] = [
  'M139.5 20.5c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3Z',
  'M152.5 20.5c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3Z',
  'M2.44 49V19.24h4.92v4.32l-.48-1.08c.747-1.173 1.76-2.08 3.04-2.72 1.28-.667 2.76-1 4.44-1 2.053 0 3.907.507 5.56 1.52 1.653 1.013 2.96 2.373 3.92 4.08.987 1.707 1.48 3.627 1.48 5.76 0 2.107-.48 4.027-1.44 5.76-.96 1.733-2.267 3.107-3.92 4.12-1.653.987-3.533 1.48-5.64 1.48-1.573 0-3.027-.307-4.36-.92-1.307-.64-2.347-1.547-3.12-2.72l.84-1.04V49H2.44Zm11.28-12.32c1.2 0 2.267-.28 3.2-.84.933-.56 1.653-1.333 2.16-2.32.533-.987.8-2.12.8-3.4 0-1.28-.267-2.4-.8-3.36-.507-.987-1.227-1.76-2.16-2.32-.933-.587-2-.88-3.2-.88-1.147 0-2.187.28-3.12.84-.907.56-1.627 1.347-2.16 2.36-.507.987-.76 2.107-.76 3.36 0 1.28.253 2.413.76 3.4.533.987 1.253 1.76 2.16 2.32.933.56 1.973.84 3.12.84ZM29.315 41V19.24h4.92v4.84l-.4-.72c.507-1.627 1.293-2.76 2.36-3.4 1.093-.64 2.4-.96 3.92-.96h1.28v4.64h-1.88c-1.493 0-2.693.467-3.6 1.4-.907.907-1.36 2.187-1.36 3.84V41h-5.24ZM44.276 41V19.24h5.24V41h-5.24Zm0-24.2v-5.6h5.24v5.6h-5.24ZM54.354 41V10.72h5.24v19.84l-2-.6 10.24-10.72h6.52l-8.04 8.76 8.2 13h-6l-7.12-11.28 3.12-.64-6.56 7.04 1.64-3.2V41h-5.24ZM77.44 41V10.72h5.24v19.84l-2-.6 10.24-10.72h6.52l-8.04 8.76 8.2 13h-6l-7.12-11.28 3.12-.64-6.56 7.04 1.64-3.2V41h-5.24ZM110.775 41.48c-2.133 0-4.08-.493-5.84-1.48-1.733-.987-3.12-2.333-4.16-4.04-1.013-1.707-1.52-3.653-1.52-5.84 0-2.187.507-4.133 1.52-5.84 1.04-1.707 2.427-3.053 4.16-4.04 1.734-.987 3.68-1.48 5.84-1.48 2.134 0 4.067.493 5.8 1.48 1.734.987 3.107 2.333 4.12 4.04 1.04 1.68 1.56 3.627 1.56 5.84 0 2.187-.52 4.133-1.56 5.84-1.04 1.707-2.426 3.053-4.16 4.04-1.733.987-3.653 1.48-5.76 1.48Zm0-4.8c1.174 0 2.2-.28 3.08-.84.907-.56 1.614-1.333 2.12-2.32.534-1.013.8-2.147.8-3.4 0-1.28-.266-2.4-.8-3.36-.506-.987-1.213-1.76-2.12-2.32-.88-.587-1.906-.88-3.08-.88-1.2 0-2.253.293-3.16.88-.906.56-1.626 1.333-2.16 2.32-.506.96-.76 2.08-.76 3.36 0 1.253.254 2.387.76 3.4.534.987 1.254 1.76 2.16 2.32.907.56 1.96.84 3.16.84Z',
];

/** Munnens båge. Ett streck och ingen fyllning, se `WORDMARK_MOUTH_WIDTH`. */
export const WORDMARK_MOUTH = 'M135 34c7 6.667 14 6.667 21 0';
export const WORDMARK_MOUTH_WIDTH = 4.5;

/**
 * Ordmärket som en `<svg>` att sätta in i ett annat dokument.
 *
 * Färgen skickas in i stället för att stå som `currentColor`. I en HTML-sida
 * ärvs `currentColor` från texten omkring, men en nedladdad SVG som öppnas i
 * ett trycksaksprogram har ingen text omkring sig, och `currentColor` blir då
 * svart hos en renderare och odefinierad hos en annan.
 */
export function wordmarkSvg(color: string): string {
  const fills = WORDMARK_FILLS.map(
    (d) => `<path fill="${color}" d="${d}"/>`,
  ).join('');
  /* Prickarna bär stroke i originalet. Här ligger det på de två första. */
  const eyes = WORDMARK_FILLS.slice(0, 2)
    .map((d) => `<path fill="none" stroke="${color}" stroke-width="1" d="${d}"/>`)
    .join('');
  const mouth =
    `<path fill="none" stroke="${color}" stroke-width="${WORDMARK_MOUTH_WIDTH}" ` +
    `stroke-linecap="round" d="${WORDMARK_MOUTH}"/>`;
  return fills + eyes + mouth;
}
