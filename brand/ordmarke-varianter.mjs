/**
 * ORDMÄRKESVARIANTER — FÖRSLAG, inte beslut.
 *
 * Nuvarande ordmärke ligger orört i brand/prikko-wordmark.svg och i
 * site/src/components/Wordmark.astro. Ingenting här ändrar dem. Det här är
 * fyra grader av ingrepp att välja UR, plus dagens märke ordagrant som
 * referens, så att jämförelsen görs i samma bild och inte ur minnet.
 *
 * ── Rutan alla fem delar ──────────────────────────────────────────────
 * Varenda variant har viewBox-HÖJDEN 59, exakt som dagens märke, och ordet
 * står på samma baslinje i samma storlek. Skälet är metodiskt: sidhuvudet
 * sätter `height` i px på svg-elementet, alltså blir en variant med tightare
 * viewBox automatiskt STÖRRE i bild vid samma angivna höjd. Då jämför man
 * skalor och inte förslag. Här kostar en bredare uppställning bredd, aldrig
 * höjd, och 36 px betyder samma bokstavsstorlek i alla fem.
 *
 * ── Måtten som allt hänger på ─────────────────────────────────────────
 * Ordet "prikko" i dagens ruta: vänsterkant 2,44, högerkant 122,26,
 * baslinje 41, x-höjdens tak 19,24, alltså X-HÖJD 21,76. Versalhöjd, alltså
 * k:ets topp, 10,72. p:ets stapel ned till 49.
 *
 * Smileyn i slutet av ordet upptar x 132,75 till 158,25 och y 20 till 41,25,
 * alltså är den EXAKT x-höjd hög och står på baslinjen. Det är den luckan
 * variant A och B ska bo i, och den är 21,25 enheter hög. Vid sidhuvudets
 * 36 px är hela rutan 59 enheter = 36 px, alltså är luckan 13,0 px. Vid 28 px
 * är den 10,1 px och vid 20 px 7,2 px. De tre talen är hela provets kärna och
 * de står här för att ingen ska behöva räkna om dem.
 *
 * ── Färg ──────────────────────────────────────────────────────────────
 * Prikkoblå #007BE0 rakt igenom. Ordet ritas i `farg` så att märket kan ärva
 * currentColor som i dag. Grävlingens egna valörer härleds ur samma blå av
 * maskotmodulen och är alltså aldrig gröna, gula eller röda.
 */

import { figur } from './maskot/gravling.mjs';

export const PRIKKOBLA = '#007BE0';

/* ── Dagens ruta och ordets mått ───────────────────────────────────── */

const RUTA_H = 59;
const ORD = {
  v: 2.44,          // ordets vänsterkant
  h: 122.26,        // ordets högerkant, alltså o:ets slut
  bas: 41,          // baslinjen
  xtak: 19.24,      // x-höjdens tak
  topp: 10.72,      // k:ets topp
  botten: 49,       // p:ets stapel
};
const XHOJD = ORD.bas - ORD.xtak;          // 21,76
const ORD_BREDD = ORD.h - ORD.v;           // 119,82

/* Smileyns lucka, med strykets runda ändar inräknade. */
const LUCKA = { v: 132.75, h: 158.25, topp: 20, botten: 41.25, mx: 145.5 };

/** Bokstäverna p r i k k o. Ordagrant ur brand/prikko-wordmark.svg. */
const ORD_D =
  'M2.44 49V19.24H7.36V23.56L6.88 22.48C7.62667 21.3067 8.64 20.4 9.92 19.76C11.2 19.0933 12.68 18.76 14.36 18.76C16.4133 18.76 18.2667 19.2667 19.92 20.28C21.5733 21.2933 22.88 22.6533 23.84 24.36C24.8267 26.0667 25.32 27.9867 25.32 30.12C25.32 32.2267 24.84 34.1467 23.88 35.88C22.92 37.6133 21.6133 38.9867 19.96 40C18.3067 40.9867 16.4267 41.48 14.32 41.48C12.7467 41.48 11.2933 41.1733 9.96 40.56C8.65333 39.92 7.61333 39.0133 6.84 37.84L7.68 36.8V49H2.44ZM13.72 36.68C14.92 36.68 15.9867 36.4 16.92 35.84C17.8533 35.28 18.5733 34.5067 19.08 33.52C19.6133 32.5333 19.88 31.4 19.88 30.12C19.88 28.84 19.6133 27.72 19.08 26.76C18.5733 25.7733 17.8533 25 16.92 24.44C15.9867 23.8533 14.92 23.56 13.72 23.56C12.5733 23.56 11.5333 23.84 10.6 24.4C9.69333 24.96 8.97333 25.7467 8.44 26.76C7.93333 27.7467 7.68 28.8667 7.68 30.12C7.68 31.4 7.93333 32.5333 8.44 33.52C8.97333 34.5067 9.69333 35.28 10.6 35.84C11.5333 36.4 12.5733 36.68 13.72 36.68ZM29.315 41V19.24H34.235V24.08L33.835 23.36C34.3417 21.7333 35.1283 20.6 36.195 19.96C37.2883 19.32 38.595 19 40.115 19H41.395V23.64H39.515C38.0217 23.64 36.8217 24.1067 35.915 25.04C35.0083 25.9467 34.555 27.2267 34.555 28.88V41H29.315ZM44.2759 41V19.24H49.5159V41H44.2759ZM44.2759 16.8V11.2H49.5159V16.8H44.2759ZM54.3541 41V10.72H59.5941V30.56L57.5941 29.96L67.8341 19.24H74.3541L66.3141 28L74.5141 41H68.5141L61.3941 29.72L64.5141 29.08L57.9541 36.12L59.5941 32.92V41H54.3541ZM77.44 41V10.72H82.68V30.56L80.68 29.96L90.92 19.24H97.44L89.4 28L97.6 41H91.6L84.48 29.72L87.6 29.08L81.04 36.12L82.68 32.92V41H77.44ZM110.775 41.48C108.642 41.48 106.695 40.9867 104.935 40C103.202 39.0133 101.815 37.6667 100.775 35.96C99.762 34.2533 99.2553 32.3067 99.2553 30.12C99.2553 27.9333 99.762 25.9867 100.775 24.28C101.815 22.5733 103.202 21.2267 104.935 20.24C106.669 19.2533 108.615 18.76 110.775 18.76C112.909 18.76 114.842 19.2533 116.575 20.24C118.309 21.2267 119.682 22.5733 120.695 24.28C121.735 25.96 122.255 27.9067 122.255 30.12C122.255 32.3067 121.735 34.2533 120.695 35.96C119.655 37.6667 118.269 39.0133 116.535 40C114.802 40.9867 112.882 41.48 110.775 41.48ZM110.775 36.68C111.949 36.68 112.975 36.4 113.855 35.84C114.762 35.28 115.469 34.5067 115.975 33.52C116.509 32.5067 116.775 31.3733 116.775 30.12C116.775 28.84 116.509 27.72 115.975 26.76C115.469 25.7733 114.762 25 113.855 24.44C112.975 23.8533 111.949 23.56 110.775 23.56C109.575 23.56 108.522 23.8533 107.615 24.44C106.709 25 105.989 25.7733 105.455 26.76C104.949 27.72 104.695 28.84 104.695 30.12C104.695 31.3733 104.949 32.5067 105.455 33.52C105.989 34.5067 106.709 35.28 107.615 35.84C108.522 36.4 109.575 36.68 110.775 36.68Z';

/* ── Små verktyg ──────────────────────────────────────────────────── */

const n = (v) => +v.toFixed(2);
let raknare = 0;
const nyttId = () => `om${(++raknare).toString(36)}`;

/**
 * Svg-skalet. HÖJDEN anges i px och bredden räknas fram ur viewBox, så att
 * alla fem varianterna kan ställas på rad och bara skilja sig i bredd.
 */
function skal(vb, height, innanfor, titel) {
  const [, , w, h] = vb.split(' ').map(Number);
  const bredd = +((w / h) * height).toFixed(2);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"` +
    ` width="${bredd}" height="${height}" role="img" aria-label="${titel}"` +
    ` focusable="false">${innanfor}</svg>`
  );
}

/** Ordet, med eller utan smiley, ritat i en enda färg. */
const ordet = (farg) => `<path d="${ORD_D}" fill="${farg}"/>`;

/**
 * BÅGEN. Munnen som ett riktigt A-kommando, given mittpunkt, kordabredd,
 * pilhöjd som ANDEL av bredden och lutning i grader.
 *
 * `cy` är bågens vertikala MITT och inte kordans y, alltså samma konvention
 * som munbana() i ../maskot-mun.mjs. Att hålla samma konvention är hela
 * skälet till att grävlingens muntal går att flytta hit utan omräkning.
 */
function bage(cx, cy, b, andel, lutning) {
  const h = b * andel;
  const R = h / 2 + (b * b) / (8 * h);
  const dy = Math.tan((lutning * Math.PI) / 180) * (b / 2);
  return (
    `M${n(cx - b / 2)} ${n(cy - h / 2 - dy)}` +
    `A${n(R)} ${n(R)} 0 0 0 ${n(cx + b / 2)} ${n(cy - h / 2 + dy)}`
  );
}

/**
 * Ellips som BANA, så att den kan ligga som delbana i en evenodd-figur.
 *
 * Två halvbågar och inte fyra bezierkurvor. Ändpunkterna är ellipsens egen
 * huvudaxel, alltså roterad med formen, och x-axelrotationen skickas vidare
 * till A-kommandot. Varvriktningen spelar ingen roll: evenodd räknar
 * korsningar och inte varv, alltså kan ett hål inte råka fyllas igen.
 */
function ellipsBana(cx, cy, rx, ry, rot = 0) {
  const r = (rot * Math.PI) / 180;
  const dx = rx * Math.cos(r), dy = rx * Math.sin(r);
  const A = `A${n(rx)} ${n(ry)} ${n(rot)} 1 0 `;
  return (
    `M${n(cx - dx)} ${n(cy - dy)}` +
    A + `${n(cx + dx)} ${n(cy + dy)}` +
    A + `${n(cx - dx)} ${n(cy - dy)}Z`
  );
}

/** Rundad rektangel som bana. rx är hörnradien. */
function rutaBana(x, y, w, h, r) {
  const R = Math.min(r, w / 2, h / 2);
  return (
    `M${n(x + R)} ${n(y)}H${n(x + w - R)}A${n(R)} ${n(R)} 0 0 1 ${n(x + w)} ${n(y + R)}` +
    `V${n(y + h - R)}A${n(R)} ${n(R)} 0 0 1 ${n(x + w - R)} ${n(y + h)}` +
    `H${n(x + R)}A${n(R)} ${n(R)} 0 0 1 ${n(x)} ${n(y + h - R)}` +
    `V${n(y + R)}A${n(R)} ${n(R)} 0 0 1 ${n(x + R)} ${n(y)}Z`
  );
}

/* ══ GRÄVLINGENS EGNA TAL ══════════════════════════════════════════════
 *
 * Hämtade ur brand/maskot/gravling.mjs och inte uppskattade. De står här som
 * TAL och inte som import, eftersom modulen inte exporterar dem, och varje
 * rad säger var den kommer ifrån.
 */

/* OGA, alltså ögonsystemets grundmått i figurens egen 100-ruta. */
const OGA = {
  v: { x: 31.0, y: 50.5, rx: 12.4, ry: 13.1, vrid: -5, rim: 3.2, s: 1 },
  h: { x: 71.0, y: 48.5, rx: 13.2, ry: 14.0, vrid: 6, rim: 3.0, s: -1 },
};

/* BRYN_LAGE.clean, BRYN_FORM och BRYN_TJOCKNA.nal, gånger AMP.vald = 1,5. */
const BRYN = {
  enhet: 81,                 // HUVUD_BREDD
  rxMedel: 12.8,
  mitt: 51,
  langd: 0.2688,
  tjocklek: 0.12 * 1.35,     // BRYN_TJOCKNA.nal
  glugg: 0.2252,
  dy: [0.0988, 0.1062],
  vinkel: [-3 * 1.5, -4 * 1.5],
};

/* Munnens tal: MUN_B = 0,22 · 81 / 100, munnen `glad` med b 1,06 och lut 2,
 * radien MUN_R = RADIE.dagens · KRYMP dämpad av amplitudens ampK 0,06. */
const MUN = {
  bredd: 0.22 * 0.81 * 1.06 * 100,                        // 18,89
  radie: 0.318 * ((0.22 * 0.81) / 0.46) * 100 * (1 / 1.03), // 11,96
  lut: 2,
  cy: 78.5,
  cx: 51,
  stryk: 0.22 * 0.81 * 0.27 * 100 * 1.35,                 // 6,49
};
const MUN_ANDEL = (() => {
  const R = MUN.radie, b = MUN.bredd;
  return (R - Math.sqrt(R * R - (b / 2) ** 2)) / b;        // 0,2446
})();

/* ══ GRÄVLINGENS ANSIKTE SOM BYGGKLOSS ═════════════════════════════════ */

const RAM_R = 17;   // FaceMark.astro rx på 100-rutan, samma som märkesramen

/** Ansiktets 100-ruta, hämtad ur maskotmodulen och skalad in på plats. */
function ansiktsruta({ x, y, storlek, detalj = 'nal', platta = true, rundad = true }) {
  let kod = figur({
    size: 100, ton: 'blue', uttryck: 'clean',
    ansikte: true, detalj, platta: 3,
  })
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
  /* Plattan är märkets bakgrund. Utan den står huvudet fritt, vilket är vad
   * ett ansikte INNE i ett ord vill, och med den är det appikonen. */
  if (!platta) kod = kod.replace(/<rect width="100" height="100" fill="[^"]*"\/>/, '');
  const id = nyttId();
  const klipp = rundad
    ? `<defs><clipPath id="${id}"><rect width="100" height="100" rx="${RAM_R}"/></clipPath></defs>` +
      `<g clip-path="url(#${id})">${kod}</g>`
    : kod;
  return (
    `<g transform="translate(${n(x)} ${n(y)})scale(${n(storlek / 100)})">${klipp}</g>`
  );
}

/* ══ A. LÅNADE DRAG ════════════════════════════════════════════════════
 *
 * Ordet står kvar exakt. Smileyns två prickar och båge byter FORM mot
 * grävlingens egna och ingenting annat rör sig:
 *
 *   PRICKARNA  blir ellipser med ögonens egen proportion, ry/rx 1,057 och
 *              1,061, med ögonens egen lutning, −5 och +6 grader, och med
 *              ögonens egen OLIKHET: höger öga är 13,8 procent större till
 *              ytan än vänster. Ytan per prick är i övrigt densamma som
 *              dagens r = 3 plus 1 i stryk, alltså väger märket lika mycket.
 *   BÅGEN      får munnens egen pilhöjd, 24,46 procent av kordan mot dagens
 *              23,81, och munnens egen lutning på 2 grader.
 *
 * Vad som MEDVETET inte lånades: pupillernas konvergens inåt och höger ögas
 * högre läge. Båda är LÄGEN och inte former, och de skulle flytta märkets
 * rytm. "Utan att något annat ändras" tolkas bokstavligt.
 */
function svgA({ height = 36, farg = PRIKKOBLA } = {}) {
  const v = OGA.v, h = OGA.h;
  const r0 = 3.5;                                     // dagens prick, stryk inräknat
  const kv = Math.sqrt(v.ry / v.rx);                  // 1,0279
  const kh = Math.sqrt(h.ry / h.rx);
  const skala = Math.sqrt((h.rx * h.ry) / (v.rx * v.ry));   // höger ögas övervikt
  const ogaEl = (cx, cy, rx, ry, rot) =>
    `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}"` +
    ` transform="rotate(${n(rot)} ${n(cx)} ${n(cy)})" fill="${farg}"/>`;
  return skal(
    `0 0 159 ${RUTA_H}`, height,
    ogaEl(139.5, 23.5, r0 / kv, r0 * kv, v.vrid) +
    ogaEl(152.5, 23.5, (r0 / kh) * skala, r0 * kh * skala, h.vrid) +
    `<path d="${bage(LUCKA.mx, 36.5, 21, MUN_ANDEL, MUN.lut)}" fill="none"` +
    ` stroke="${farg}" stroke-width="4.5" stroke-linecap="round"/>` +
    ordet(farg),
    'Prikko',
  );
}

/* ══ B. ANSIKTET I ORDET ═══════════════════════════════════════════════
 *
 * Smileyn stryks och grävlingens ansikte ställs på dess plats, i dess
 * storlek, alltså 21,25 enheter, alltså x-höjd. Ordet är oförändrat.
 *
 * Två utföranden ligger här av ett skäl: ett ansikte i en RUNDAD KVADRAT
 * mitt inne i ett ord läser som en app-ikon som fastnat i texten, medan
 * ansiktet utan platta läser som en bokstav. Båda ritas, så att valet kan
 * göras i bild.
 */
const B_MITT = LUCKA.topp + (LUCKA.botten - LUCKA.topp) / 2;   // 30,63

function svgB({ height = 36, farg = PRIKKOBLA, platta = false } = {}) {
  const S = LUCKA.botten - LUCKA.topp;                          // 21,25
  return skal(
    `0 0 159 ${RUTA_H}`, height,
    ansiktsruta({ x: LUCKA.mx - S / 2, y: B_MITT - S / 2, storlek: S, platta, rundad: platta }) +
    ordet(farg),
    'Prikko',
  );
}

/* ══ C. ANSIKTET BREDVID ORDET ═════════════════════════════════════════
 *
 * Ett lockup. Ansiktet i den rundade kvadraten står FÖRE ordet och ordet
 * står rent, utan smiley. Kvadraten är centrerad på ordets optiska mitt,
 * alltså mitt emellan x-höjdens tak och baslinjen, och inte på rutans mitt.
 *
 * Två storleksförhållanden och två avstånd, alla fyra mätta mot X-HÖJDEN
 * eftersom det är den bokstavsstorlek ögat faktiskt läser:
 *
 *   liten   1,39 · x-höjd = 30,3, alltså exakt k:ets topp till baslinjen.
 *           Märket är då lika högt som ordets versalhöjd, den lugna vägen.
 *   stor    1,76 · x-höjd = 38,3, alltså hela ordets bläckhöjd, k:ets topp
 *           till p:ets fot. Märket blir ordets jämlike i stället för dess
 *           accent.
 *   tat     0,32 · x-höjd = 7,0. Ungefär o:ets egen stapelbredd.
 *   luftig  0,64 · x-höjd = 13,9, alltså dubbla det.
 */
const C_MITT = ORD.xtak + XHOJD / 2;                 // 30,12
export const C_STORLEK = { liten: XHOJD * 1.39, stor: XHOJD * 1.76 };
export const C_AVSTAND = { tat: XHOJD * 0.32, luftig: XHOJD * 0.64 };

function svgC({ height = 36, farg = PRIKKOBLA, storlek = 'stor', avstand = 'tat' } = {}) {
  const S = typeof storlek === 'number' ? storlek : C_STORLEK[storlek];
  const G = typeof avstand === 'number' ? avstand : C_AVSTAND[avstand];
  const x0 = 2.44;
  const ordX = x0 + S + G;
  const bredd = ordX + ORD_BREDD + 2.44;
  return skal(
    `0 0 ${n(bredd)} ${RUTA_H}`, height,
    ansiktsruta({ x: x0, y: C_MITT - S / 2, storlek: S }) +
    `<g transform="translate(${n(ordX - ORD.v)} 0)">${ordet(farg)}</g>`,
    'Prikko',
  );
}

/* ══ D. MASKEN ═════════════════════════════════════════════════════════
 *
 * Mitt eget förslag, och det är inte ansiktet som pricken över i:et.
 *
 * Den prickens ruta är 5,24 enheter bred. Vid sidhuvudets 36 px är det
 * 3,2 px. Ett ansikte med ögon, bryn och mun i 3,2 px är inte ett svårt
 * problem, det är inget problem alls: det finns ingenting att avgöra där.
 * Idén faller på en uppmätt siffra och inte på smak.
 *
 * I stället: grävlingen reducerad till sitt ENDA egna drag. Figurens bärande
 * idé, ordagrant ur maskotmodulen, är att BANDET OCH ÖGAT ÄR SAMMA FORM.
 * Masken behåller precis det och slänger allt annat:
 *
 *   TVÅ BAND      lodräta rundade staplar, bredden är ögats egen ram,
 *                 alltså rx + rim, exakt som nålnivåns band.
 *   ÖGONEN        HÅL i banden, med pupillen som en ö inne i hålet. Det är
 *                 grävlingens valörordning översatt till ett enda bläck:
 *                 mörkt band, ljus ögonvita, mörk pupill.
 *   BRYNEN        också hål, och det är rätt väg och inte en genväg: i
 *                 figuren ÄR brynet ljus päls i ett mörkt band.
 *   MUNNEN        samma båge som i A, alltså grävlingens egen.
 *
 * Tre saker följer, och det är de som gör förslaget värt en plats:
 *
 *   EN FÄRG    hela masken är en enda bana med fill-rule evenodd plus ett
 *              stryk. Den ärver currentColor, fungerar mot vilken botten som
 *              helst, och den kan aldrig få en platta som slåss med ordet.
 *   EN BANA    inga clipPath, ingen mask, inget som kan tolkas olika av två
 *              renderare. Hålen är hål för att varvtalet är udda.
 *   NEDBRYTNINGEN  när masken krymper sluts brynen först, sedan pupillerna,
 *              och kvar står två ljusa ögon i två mörka staplar över en båge.
 *              Alltså exakt dagens smiley. Märket urartar TILL sig självt,
 *              och det är den bästa nedbrytning ett litet märke kan ha.
 *
 * Masken är avsiktligt högre än x-höjden: den går upp till k:ets topp och
 * ned till baslinjen, alltså är den ordets versal och inte dess gemen. Utan
 * den höjden får brynet ingen plats ovanför ögat.
 */

const D = (() => {
  const TOPP = 15;                                   // bandets överkant
  const band = (o) => {
    const W = o.rx + o.rim;
    return { x: o.x - W, y: TOPP, w: 2 * W, h: o.y + 23.5 - TOPP, r: W * 0.5 };
  };
  const bryn = (o, i) => {
    const L = BRYN.langd * BRYN.enhet * (o.rx / BRYN.rxMedel);
    const G = BRYN.glugg * BRYN.enhet;
    return {
      cx: BRYN.mitt - o.s * (G / 2) - o.s * (L / 2),
      cy: o.y - o.ry - BRYN.dy[i] * BRYN.enhet,
      rx: L * 0.6,
      ry: (BRYN.tjocklek * BRYN.enhet) / 2,
      rot: o.s * BRYN.vinkel[i],
    };
  };
  const pupill = (o) => ({
    cx: o.x + 0.11 * o.rx * o.s,
    cy: o.y + 0.3 * o.ry,
    r: o.rx * 0.55,
  });
  const par = [['v', 0], ['h', 1]];
  const banden = par.map(([k]) => band(OGA[k]));
  const brynen = par.map(([k, i]) => bryn(OGA[k], i));
  const d =
    banden.map((b) => rutaBana(b.x, b.y, b.w, b.h, b.r)).join('') +
    par.map(([k]) => {
      const o = OGA[k];
      return ellipsBana(o.x, o.y, o.rx, o.ry, o.vrid);
    }).join('') +
    par.map(([k]) => {
      const p = pupill(OGA[k]);
      return ellipsBana(p.cx, p.cy, p.r, p.r, 0);
    }).join('') +
    brynen.map((b) => ellipsBana(b.cx, b.cy, b.rx, b.ry, b.rot)).join('');
  const munD = bage(MUN.cx, MUN.cy, MUN.bredd, MUN_ANDEL, MUN.lut);
  /* Bläckets ruta, räknad ur primitiverna och inte avskriven. */
  const x1 = Math.min(...banden.map((b) => b.x));
  const x2 = Math.max(...banden.map((b) => b.x + b.w));
  const y2 = MUN.cy + (MUN.bredd * MUN_ANDEL) / 2 + MUN.stryk / 2;
  return { d, munD, box: { x: x1, y: TOPP, w: x2 - x1, h: y2 - TOPP } };
})();

function svgD({ height = 36, farg = PRIKKOBLA } = {}) {
  /* Masken står från k:ets topp till baslinjen, alltså ordets versalhöjd. */
  const H = ORD.bas - ORD.topp;                       // 30,28
  const s = H / D.box.h;
  const B = D.box.w * s;
  const glugg = XHOJD * 0.42;                         // luft mellan ord och mask
  const x0 = ORD.h + glugg;
  const tx = x0 - D.box.x * s;
  const ty = ORD.topp - D.box.y * s;
  const bredd = x0 + B + 2;
  return skal(
    `0 0 ${n(bredd)} ${RUTA_H}`, height,
    ordet(farg) +
    `<g transform="translate(${n(tx)} ${n(ty)})scale(${n(s)})">` +
    `<path fill-rule="evenodd" d="${D.d}" fill="${farg}"/>` +
    `<path d="${D.munD}" fill="none" stroke="${farg}" stroke-width="${n(MUN.stryk)}"` +
    ` stroke-linecap="round"/></g>`,
    'Prikko',
  );
}

/* ══ NUVARANDE ═════════════════════════════════════════════════════════ */

function svgNu({ height = 36, farg = PRIKKOBLA } = {}) {
  return skal(
    `0 0 159 ${RUTA_H}`, height,
    `<path d="M139.5 20.5C141.157 20.5 142.5 21.8431 142.5 23.5C142.5 25.1569 141.157 26.5 139.5 26.5C137.843 26.5 136.5 25.1569 136.5 23.5C136.5 21.8431 137.843 20.5 139.5 20.5Z" fill="${farg}" stroke="${farg}"/>` +
    `<path d="M152.5 20.5C154.157 20.5 155.5 21.8431 155.5 23.5C155.5 25.1569 154.157 26.5 152.5 26.5C150.843 26.5 149.5 25.1569 149.5 23.5C149.5 21.8431 150.843 20.5 152.5 20.5Z" fill="${farg}" stroke="${farg}"/>` +
    `<path d="M135 34C142 40.6667 149 40.6667 156 34" stroke="${farg}" stroke-width="4.5" stroke-linecap="round" fill="none"/>` +
    ordet(farg),
    'Prikko',
  );
}

/* ══ EXPORT ════════════════════════════════════════════════════════════ */

export const VARIANTER = {
  a: {
    namn: 'A. Lånade drag',
    koncept:
      'Ordet och smileyns lägen står exakt kvar. Prickarna får ögonens proportion, lutning och olikhet, bågen får munnens pilhöjd och tvågradiga lutning. Släktskap utan formbyte.',
    svg: svgA,
  },
  b: {
    namn: 'B. Ansiktet i ordet',
    koncept:
      'Grävlingens ansikte ersätter smileyn på dess plats och i dess storlek, alltså 21,25 enheter, alltså exakt x-höjd. Ordet är oförändrat.',
    svg: svgB,
  },
  c: {
    namn: 'C. Ansiktet bredvid ordet',
    koncept:
      'Lockup. Ansiktet i den rundade kvadraten står före ett rent ord utan smiley, centrerat på ordets optiska mitt. Två storlekar mot x-höjden och två avstånd.',
    svg: svgC,
  },
  d: {
    namn: 'D. Masken',
    koncept:
      'Grävlingen reducerad till sitt enda egna drag: två band med ögonen som hål och brynen som hål i banden, plus munnens båge. En bana, en färg, inga beskärningar, och den urartar vid små storlekar till dagens smiley.',
    svg: svgD,
  },
  nuvarande: {
    namn: 'Nuvarande',
    koncept:
      'Dagens märke ordagrant ur brand/prikko-wordmark.svg. Två prickar och en båge i slutet av ordet, x-höjd hög, på baslinjen.',
    svg: svgNu,
  },
};

/** B utan platta mot B med platta, för provsidan. */
export const B_VARIANTER = {
  fri: { namn: 'B. utan platta', svg: (o) => svgB({ ...o, platta: false }) },
  platta: { namn: 'B. med platta', svg: (o) => svgB({ ...o, platta: true }) },
};

/** C:s fyra kombinationer, för provsidan. */
export const C_VARIANTER = {
  liten_tat: { namn: 'C. liten, tät', svg: (o) => svgC({ ...o, storlek: 'liten', avstand: 'tat' }) },
  liten_luftig: { namn: 'C. liten, luftig', svg: (o) => svgC({ ...o, storlek: 'liten', avstand: 'luftig' }) },
  stor_tat: { namn: 'C. stor, tät', svg: (o) => svgC({ ...o, storlek: 'stor', avstand: 'tat' }) },
  stor_luftig: { namn: 'C. stor, luftig', svg: (o) => svgC({ ...o, storlek: 'stor', avstand: 'luftig' }) },
};

/** Måtten provet vilar på, så att de går att skriva ut i stället för att tros. */
export const MATT = {
  rutaHojd: RUTA_H,
  xhojd: XHOJD,
  luckaHojd: LUCKA.botten - LUCKA.topp,
  /** Smileyluckans verkliga höjd i px vid ett givet märke i px. */
  luckaIPx: (h) => +(((LUCKA.botten - LUCKA.topp) / RUTA_H) * h).toFixed(1),
  /** C:s kvadrat i px vid ett givet märke i px. */
  kvadratIPx: (h, storlek = 'stor') => +((C_STORLEK[storlek] / RUTA_H) * h).toFixed(1),
};
