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
 * RADIEN, och varför den ersatte pilhöjden.
 *
 * Ägaren: "just nu är munnen typ rak och konstig också, kolla på duo, den ser
 * så rund och fin och perfekt ut, vår ser kantig och overklig ut."
 *
 * Diagnosen är riktig och orsaken är räknebar. Första versionen höll PILHÖJDEN
 * konstant som andel av bredden och ökade bredden. En båge med samma pilhöjd
 * utdragen över nästan dubbla bredden blir flackare, inte gladare, och vid
 * tillräcklig bredd läser den som ett streck. Vi gjorde alltså munnen rakare
 * genom att göra den större.
 *
 * Rätt storhet att hålla fast är RADIEN. Håller radien och ökar bredden så
 * ökar pilhöjden av sig själv, precis som på en riktig cirkel.
 *
 * Räknat ur dagens märke: bredd 36,74 och pilhöjd 6,15 ger radien
 *   R = h/2 + b²/(8h) = 3,08 + 27,43 = 30,5 enheter av 96, alltså 31,8 procent.
 * Det är alltså inte ett påhittat tal, det är den radie dagens mun redan har.
 *
 * Vad det ger vid olika bredder, med radien fast på 31,8 procent:
 *   bredd 38,3 %  ->  pilhöjd 16,7 % av bredden   (dagens, oförändrad)
 *   bredd 46,0 %  ->  pilhöjd 21,4 % av bredden
 *   bredd 54,0 %  ->  pilhöjd 27,8 % av bredden
 *
 * Munnen ritas dessutom som en RIKTIG cirkelbåge, alltså ett A-kommando, och
 * inte som en bezier som nästan är en cirkel. Det är samma sak som skiljer en
 * rund figur från en som läser som polygon: fyra bezierkurvor som nästan är en
 * cirkel ser inte lika runda ut som en cirkel.
 */
export const RADIE = { dagens: 0.318, rundare: 0.270, flackare: 0.400 };

/** Pilhöjd räknad ur bredd och radie. Positiv = glad, negativ = ledsen. */
export function pilhojd(b, R) { return pilhojdRaknad(b, R); }

function pilhojdRaknad(b, R) {
  const inre = R * R - (b / 2) * (b / 2);
  if (inre <= 0) return R;              // bågen är en halvcirkel eller mer
  return R - Math.sqrt(inre);
}

/**
 * Bågens riktning per tillstånd, som andel av full pilhöjd.
 *
 * Mellanläget är inte längre exakt noll. En rak linje mellan en glad och en
 * ledsen båge läser som frånvaro snarare än som mellanläge, och danska
 * smileyordningen har samma tre lägen och samma svaghet. Ett litet negativt
 * värde läser som tveksamhet i stället för som ingenting.
 */
export const RIKTNING = { clean: 1, minor: -0.18, major: -0.9 };

/**
 * Bakåtkompatibel pilhöjd som andel av munnens bredd, för figurmoduler som
 * ännu inte gått över till radiemodellen.
 *
 * HÄRLEDD, inte satt. Talen räknas ur den förordade bredden 46 procent och
 * radien 31,8 procent, alltså exakt vad radiemodellen ger, så en modul som
 * använder de här talen ritar samma mun som en som räknar själv. Nya moduler
 * ska använda munbana() och inte den här.
 */
export const PILHOJD = (() => {
  const b = BREDD.storre * 100;
  const h = pilhojdRaknad(b, RADIE.dagens * 100) / b;
  return { clean: h * RIKTNING.clean, minor: h * RIKTNING.minor, major: h * RIKTNING.major };
})();
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
export function munbana(cx, cy, w, nyckel, bredd = 'storre', lutning = 2, radie = 'dagens') {
  const b = (typeof bredd === 'number' ? bredd : BREDD[bredd]) * w;
  const R = (typeof radie === 'number' ? radie : RADIE[radie]) * w;
  const r = RIKTNING[nyckel] ?? 0;
  const h = pilhojd(b, R) * r;

  const x1 = cx - b / 2;
  const x2 = cx + b / 2;
  const dy = Math.tan((lutning * Math.PI) / 180) * (b / 2);
  const y1 = cy - h / 2 - dy;
  const y2 = cy - h / 2 + dy;

  // Radien som faktiskt behövs för den valda pilhöjden. Vid full pilhöjd är
  // det R, vid mellanlägena en mycket större radie, alltså en flackare båge.
  const hh = Math.abs(h);
  const Rr = hh < 0.001 ? b * 40 : hh / 2 + (b * b) / (8 * hh);
  // sweep 1 böjer nedåt mellan ändpunkterna, alltså glad i en y-nedåt-ruta.
  const sweep = h >= 0 ? 1 : 0;
  return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${Rr.toFixed(2)} ${Rr.toFixed(2)} 0 0 ${sweep} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export function mun(cx, cy, w, nyckel, {
  bredd = 'storre', tjocklek = 'dagens', farg = '#fff', lutning = 2, radie = 'dagens',
} = {}) {
  const sw = (typeof tjocklek === 'number' ? tjocklek : TJOCKLEK[tjocklek]) * w;
  return `<path d="${munbana(cx, cy, w, nyckel, bredd, lutning, radie)}" stroke="${farg}"` +
    ` stroke-width="${sw.toFixed(2)}" stroke-linecap="round" fill="none"/>`;
}

/**
 * Ögonen, dagens geometri skalad till valfri ruta.
 *
 * `pupill` är ett PROV, inte ett ställningstagande. Ägaren öppnade för pupiller
 * och bad uttryckligen om att se dem mätta i stället för bortargumenterade.
 * Pupillen ritas som en mörk cirkel i den vita pricken, alltså ögonvitan är
 * pricken själv. Andelen 0,42 är Duos egen, uppmätt: hans pupill är 47,5
 * procent av ögats bredd, och vi ligger strax under eftersom vårt öga är
 * mycket mindre från början.
 */
export function ogon(w, {
  farg = '#fff', cy = 0.386, dx = 0.118, r = 0.0637,
  pupill = null, pupillAndel = 0.42, blick = [0.12, 0.10],
} = {}) {
  const c = w / 2;
  const R = r * w;
  const oga = (x) => {
    const vit = `<circle cx="${x.toFixed(2)}" cy="${(cy * w).toFixed(2)}" r="${R.toFixed(2)}" fill="${farg}"/>`;
    if (!pupill) return vit;
    // Aldrig vertikalt centrerad. Duolingos egen regel, och den billigaste
    // knappen för liv som finns.
    const px = x + R * blick[0];
    const py = cy * w + R * blick[1];
    return vit + `<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${(R * pupillAndel).toFixed(2)}" fill="${pupill}"/>`;
  };
  return oga(c - dx * w) + oga(c + dx * w);
}

/**
 * PROVET SOM AVGÖR: samma ansikte tre gånger, ENDAST munnen skiljer.
 * Går bedömningen att läsa här är munnen bärande. Går den inte det är allt
 * annat vi ritat kosmetika.
 */
export function baraMunnen({
  size = 64, fyll = '#007BE0', bredd = 'storre', tjocklek = 'dagens', rx = 17,
  radie = 'dagens', pupill = null,
} = {}) {
  return ['clean', 'minor', 'major'].map((k) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="${rx}" fill="${fyll}"/>
      ${ogon(100, { pupill })}
      ${mun(50, 63.5, 100, k, { bredd, tjocklek, radie })}
    </svg>`).join('');
}
