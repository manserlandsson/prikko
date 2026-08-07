/**
 * MUNNEN. Prikkos bärande form, uppmätt.
 *
 * Ägaren, tre gånger i olika ord, senast ordagrant: "munnen är viktigast, det
 * är det allt hänger på". Det stämmer, och det har varit underskattat i allt
 * arbete hittills. Sajtens identitet är två prickar och en båge, och
 * BEDÖMNINGEN ÄR BÅGENS RIKTNING. Allt annat i figuren är omgivning kring
 * den bågen.
 *
 * Därför bor munnen här och inte i figurmodulerna. Den är Prikkos, inte
 * grävlingens och inte hundens. Byter vi djur byter vi inte mun.
 *
 * ── Uppmätt nuläge ──────────────────────────────────────────────────────
 * Dagens märke, ur site/src/lib/face.ts, 96-rutan:
 *   glad    M32 57.4883C44.2457 69.1509 56.4915 69.1509 68.7372 57.4883
 *   rak     M32 61.0004C44.5 61 56.5 60.9995 68.7372 61.0004
 *   ledsen  M32 64.2196C44.5511 57.3262 56.6858 57.1944 68.7372 64.2196
 *   stroke-width 7.87226, round linecap
 *
 * Räknat på den:
 *   bredd      36,74 enheter = 38,3 % av märkets bredd
 *   tjocklek    7,87 enheter =  8,2 % av bredden
 *   pilhöjd     6,15 enheter i glad, alltså kurvans djup från korda till båge
 *   mittlinje   y 61 av 96, alltså 63,5 % ned i rutan
 *
 * ── Jämförelsen med Duo ─────────────────────────────────────────────────
 * Duos motsvarighet är näbben. Mätt i Duolingos publicerade lockup-SVG är
 * kroppen 134,6 enheter bred och den övre näbben 16 enheter, alltså 11,9 %.
 * Undre näbben är större men fortfarande långt under vår.
 *
 * Slutsatsen är inte att vår mun är för liten i märket, den är över tre
 * gånger så bred som Duos relativt figuren. Slutsatsen är att Duo INTE bär
 * sitt uttryck i munnen. Han bär det i ögonen, och näbben är en accent.
 * Vi har valt bort ögonvita och pupill, alltså har vi inte den kanalen, och
 * då MÅSTE munnen göra hela arbetet. Den ska därför vara större än den är i
 * dag, inte lika stor.
 *
 * Storlekarna nedan finns för att kunna välja på syn i stället för på tro.
 */

/** Bredd som andel av rutans bredd. Dagens märke är 38,3 procent. */
export const BREDD = { dagens: 0.383, storre: 0.460, storst: 0.540 };

/** Tjocklek som andel av rutans bredd. Dagens märke är 8,2 procent. */
export const TJOCKLEK = { fin: 0.070, dagens: 0.082, kraftig: 0.100 };

/**
 * Pilhöjd, alltså hur djup bågen är, som andel av munnens BREDD.
 * Dagens glada båge är 6,15 av 36,74, alltså 0,167.
 *
 * Den raka är exakt 0 och det är ett problem: en rak linje mellan en glad och
 * en ledsen båge läser som "ingenting" snarare än som "mellanläge". Danska
 * smileyordningen har samma tre lägen och samma svaghet. Ett litet negativt
 * värde, alltså en nästan omärkligt nedåtböjd linje, läser som tveksamhet i
 * stället för som frånvaro, och det är vad `minor` använder här.
 */
export const PILHOJD = { clean: 0.167, minor: -0.030, major: -0.150 };

/**
 * Bygger munbanan.
 *
 * @param cx      mittpunkt x i rutan
 * @param cy      mittlinje y i rutan
 * @param w       rutans bredd, alltså 96 eller 100 eller 120
 * @param nyckel  clean, minor eller major
 * @param bredd   nyckel ur BREDD, eller ett tal
 * @param lutning grader. Asymmetri, se nedan.
 *
 * LUTNINGEN är det enda som skiljer den här munnen från märkets nuvarande.
 * Duolingos egen regel: munnen är den minst geometriska formen i hela stilen
 * och ska vara ASYMMETRISK och favorisera ena sidan, eftersom det ger mer liv.
 * Vår är i dag perfekt symmetrisk. Två grader räcker, och det är avsiktligt
 * så lite att ingen ser det medvetet.
 */
export function munbana(cx, cy, w, nyckel, bredd = 'dagens', lutning = 2) {
  const b = (typeof bredd === 'number' ? bredd : BREDD[bredd]) * w;
  const p = PILHOJD[nyckel] ?? 0;
  const h = p * b;
  const x1 = cx - b / 2;
  const x2 = cx + b / 2;
  // Kubisk båge med kontrollpunkter på en tredjedel, vilket ger en kurva som
  // ligger nära en cirkelbåge men går att luta utan att ändarna vandrar.
  const k = h * 1.34;
  const rad = (lutning * Math.PI) / 180;
  const dy = Math.tan(rad) * (b / 2);
  return `M${x1.toFixed(2)} ${(cy - h / 2 - dy).toFixed(2)}` +
    `C${(x1 + b / 3).toFixed(2)} ${(cy + k - dy / 3).toFixed(2)}` +
    ` ${(x2 - b / 3).toFixed(2)} ${(cy + k + dy / 3).toFixed(2)}` +
    ` ${x2.toFixed(2)} ${(cy - h / 2 + dy).toFixed(2)}`;
}

export function mun(cx, cy, w, nyckel, {
  bredd = 'dagens', tjocklek = 'dagens', farg = '#fff', lutning = 2,
} = {}) {
  const sw = (typeof tjocklek === 'number' ? tjocklek : TJOCKLEK[tjocklek]) * w;
  return `<path d="${munbana(cx, cy, w, nyckel, bredd, lutning)}" stroke="${farg}"` +
    ` stroke-width="${sw.toFixed(2)}" stroke-linecap="round" fill="none"/>`;
}

/** Ögonen, dagens geometri skalad till valfri ruta. Prickar, inget annat. */
export function ogon(w, { farg = '#fff', cy = 0.386, dx = 0.118, r = 0.0637 } = {}) {
  const c = w / 2;
  return `<circle cx="${(c - dx * w).toFixed(2)}" cy="${(cy * w).toFixed(2)}" r="${(r * w).toFixed(2)}" fill="${farg}"/>` +
    `<circle cx="${(c + dx * w).toFixed(2)}" cy="${(cy * w).toFixed(2)}" r="${(r * w).toFixed(2)}" fill="${farg}"/>`;
}

/**
 * PROVET SOM AVGÖR: samma ansikte tre gånger, ENDAST munnen skiljer.
 * Går bedömningen att läsa här är munnen bärande. Går den inte det är allt
 * annat vi ritat kosmetika.
 */
export function baraMunnen({ size = 64, fyll = '#007BE0', bredd = 'dagens', tjocklek = 'dagens', rx = 17 } = {}) {
  return ['clean', 'minor', 'major'].map((k) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="${rx}" fill="${fyll}"/>
      ${ogon(100)}
      ${mun(50, 63.5, 100, k, { bredd, tjocklek })}
    </svg>`).join('');
}
