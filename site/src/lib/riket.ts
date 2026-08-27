/**
 * Sveriges sjögräns, för rikskartans skugga.
 *
 * Rikskartan öppnar på hela landet. Allt utanför gränsen ska dämpas, på samma
 * sätt som allt utanför ett valt område dämpas, se OMRÅDESSKUGGAN i
 * Karta.astro. Gränsen är samma sorts hål i samma sorts världspolygon, bara
 * större.
 *
 * ## Var geometrin kommer ifrån
 *
 * Hela resonemanget står i pipeline/riket.py. Kortaste versionen: ytan är
 * OSM:s `admin_level=2`-relation för Sverige, alltså SJÖGRÄNSEN och inte
 * kusten. Det är avsiktligt. Booli skuggar likadant, uppmätt 2026-08-27: deras
 * ljusa fält går ute i vattnet mot Östersjön, och Gotland och Öland ligger
 * inne i fältet tillsammans med havet runt dem.
 *
 * Två ringar, fastlandets sjögräns och Gotlands. Öland, Orust och hela
 * skärgården ligger innanför den större och behöver inga egna.
 *
 * ## Ringarna går MEDSOLS, och det är inte en detalj
 *
 * Masken är en världspolygon med de här ringarna som HÅL. Världsringen går
 * moturs och ett hål måste gå åt motsatt håll. Går de åt samma håll
 * triangulerar MapLibre ytan fel, och det som ritas är grå band tvärs över
 * kartan i stället för ett utsparat Sverige. Vindningen skrivs ut i filen, se
 * medsols() i pipeline/riket.py, och prövas en gång till här nedan.
 *
 * ## Ytan får skugga, och numera filtrera
 *
 * Här stod tidigare en reservation: den gamla kustkonturen la 187 kajlägen i
 * vattnet och fick därför aldrig avgöra vad som RÄKNADES till något.
 *
 * Reservationen föll med kustlinjen. Mätt 2026-08-27 ligger alla 13 692 av
 * beståndets koordinater innanför sjögränsen, och en kajplats ligger innanför
 * territorialhavet av samma skäl som en badbrygga gör det. Ytan är ändå grov,
 * förenklad med 600 meters tolerans, så för frågor om vad som ligger i en
 * kommun eller en stadsdel gäller fortfarande `municipalityArea` och områdenas
 * ytor i lib/omraden.ts.
 */

/** En ring är en sluten lista av [longitud, latitud]. */
type Ring = number[][];

export interface RiketSource {
  name: string;
  licence: string;
  attribution: string;
  fetchedAt: string;
}

export interface Riksgrans {
  /** "Sverige". */
  name: string;
  /** "sverige". Också nyckeln kartan slår upp ytan på. */
  slug: string;
  source: 'osm';
  /** Objektet hos källan, för spårbarhet. "relation/52822". */
  ref: string;
  sources: { osm: RiketSource };
  outer: Ring[];
  inner: Ring[];
}

import fil from '../data/riket/sverige.json';

const riksgrans = fil as unknown as Riksgrans;

/**
 * Samma grind som assertRings i lib/omraden.ts, av samma skäl.
 *
 * Tre fel skulle annars passera tyst, och alla tre ger en karta som SER
 * avsiktlig ut: par kastade om till [lat, lon], en ring som inte slutit sig,
 * och en ring vänd moturs. De två första ger en mask som täcker allt eller
 * ingenting. Den tredje ger grå band tvärs över kartan, och det är det fel som
 * faktiskt låg live i augusti 2026.
 *
 * Grinden körs vid bygget och inte hos besökaren: filen läses bara av
 * pages/omradesytor/sverige.json.ts, som är förrenderad.
 */
for (const ring of [...riksgrans.outer, ...riksgrans.inner]) {
  if (ring.length < 4) {
    throw new Error('riket: en ring har färre än fyra punkter.');
  }
  const [fx, fy] = ring[0];
  const [lx, ly] = ring[ring.length - 1];
  if (fx !== lx || fy !== ly) {
    throw new Error('riket: en ring sluter sig inte. Se gransringar() i pipeline/riket.py.');
  }
  for (const [lon, lat] of ring) {
    if (lon < 10 || lon > 25 || lat < 55 || lat > 70) {
      throw new Error(
        `riket: punkten [${lon}, ${lat}] ligger utanför Sverige. Ordningen är ` +
          '[longitud, latitud]; är paren omkastade blir masken hela världen.',
      );
    }
  }
  let yta = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    yta += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  if (yta > 0) {
    throw new Error(
      'riket: en ring går moturs. Ett hål i världspolygonen måste gå medsols, ' +
        'annars ritar MapLibre grå band. Se medsols() i pipeline/riket.py.',
    );
  }
}

/** Sveriges sjögräns. */
export function swedenOutline(): Riksgrans {
  return riksgrans;
}

/**
 * Attributionen som måste stå där gränsen visas.
 *
 * Kravet kommer ur ODbL. Rikskartan visar redan OpenStreetMap under kartan för
 * sitt underlag, men källan hör till DATAN och inte till sidan: flyttas
 * gränsen någon annanstans ska attributionen följa med av sig själv.
 */
export function swedenSource(): RiketSource {
  return riksgrans.sources.osm;
}

/* ══════════════════════════════════════════════════════════════════════════
 * SILUETTEN, alltså samma kontur ritad som en SVG-bana i stället för en mask.
 *
 * Kartrutan står tom i ungefär en sekund vid laddning. Ägaren har tagit upp
 * det tre gånger, senast 2026-08-27: "jag ser även som min screenshot på
 * load... är typ i en sekund, kan du ta bort det helt och hållet".
 *
 * En karta går inte att rita omedelbart. MapLibre är en dynamisk import, och
 * efter den kommer stilen, teckensnitten, sprajten och de första rutorna.
 * Sveriges kontur går däremot att rita i första bildrutan, för den ligger
 * redan i det här bygget och kostar bara några hundra byte i sidans HTML.
 *
 * Funktionerna nedan körs vid BYGGET, i Karta.astros frontmatter. Ingenting av
 * det här hamnar hos besökaren som kod, bara som en färdig bana.
 *
 * ── Enheterna ────────────────────────────────────────────────────────────
 *
 * Banan ritas i en värld på 262 144 px, alltså MapLibres zoom 9 med 512-rutor.
 * Skälet är att heltal då räcker: en enhet är 153 meter, och vid rikskartans
 * öppningszoom 5,1 är den 0,067 skärmpixlar. Banan blir därför både exakt och
 * kort, eftersom relativa drag mellan grannpunkter blir ensiffriga tal.
 * ═══════════════════════════════════════════════════════════════════════ */

/** Världens bredd i de enheter siluettens bana är ritad i. MapLibres zoom 9. */
export const SILUETT_VARLD = 262144;

/**
 * Web Mercator, samma projektion MapLibre använder, i SILUETT_VARLD-enheter.
 *
 * Måste stämma på decimalen med bibliotekets egen, annars ligger siluetten
 * bredvid kartan i stället för under den.
 */
export function mercator(lon: number, lat: number): [number, number] {
  const s = Math.sin((lat * Math.PI) / 180);
  return [
    ((lon + 180) / 360) * SILUETT_VARLD,
    (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * SILUETT_VARLD,
  ];
}

export interface Siluett {
  /** SVG-bana, absolut start och relativa drag, i SILUETT_VARLD-enheter. */
  d: string;
  /** Banans låda i samma enheter, som en färdig viewBox-sträng. */
  viewBox: string;
  /** Lådan var för sig, för den som ska räkna ut var banan hamnar. */
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Douglas-Peucker, för siluetten och ingenting annat.
 *
 * TOLERANSEN ÄR VALD I SKÄRMPIXLAR OCH INTE I METER. 12 enheter är 0,80 px vid
 * öppningszoomen 5,1, alltså under en pixel: skillnaden mot den fulla konturen
 * går inte att se, och den syns dessutom bara under den sekund siluetten
 * ligger framme. Uppmätt utfall: 434 punkter blir 375, och banan går från
 * 1 538 till 1 367 byte gzippat.
 *
 * Konturen är REDAN förenklad en gång, med 600 meters tolerans i
 * pipeline/riket.py. Det här är alltså inte samma förenkling en gång till utan
 * en andra, grövre, som bara den här användningen tål. Masken använder
 * fortfarande den fulla konturen.
 */
function fornkla(punkter: number[][], tolerans: number): number[][] {
  if (punkter.length < 3) return punkter;
  const [x1, y1] = punkter[0];
  const [x2, y2] = punkter[punkter.length - 1];
  const namnare = Math.hypot(y2 - y1, x2 - x1);
  let storst = 0;
  let index = 0;
  for (let i = 1; i < punkter.length - 1; i += 1) {
    const [x, y] = punkter[i];
    const avstand = namnare
      ? Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / namnare
      : Math.hypot(x - x1, y - y1);
    if (avstand > storst) {
      storst = avstand;
      index = i;
    }
  }
  if (storst <= tolerans) return [punkter[0], punkter[punkter.length - 1]];
  return [
    ...fornkla(punkter.slice(0, index + 1), tolerans).slice(0, -1),
    ...fornkla(punkter.slice(index), tolerans),
  ];
}

/** 12 enheter, alltså 0,80 px vid rikskartans öppningszoom. Se fornkla(). */
const SILUETT_TOLERANS = 12;

/**
 * Sveriges kontur som en SVG-bana.
 *
 * Bara de yttre ringarna, alltså fastlandet och Gotland. Masken behöver dem
 * som HÅL i en världspolygon och bryr sig därför om vindningen; en fylld bana
 * gör det inte, och `fill-rule` spelar ingen roll så länge ringarna inte
 * ligger inuti varandra. De gör de inte, se noten om ringarna längst upp.
 */
export function swedenSilhouette(): Siluett {
  const ringar = riksgrans.outer.map((ring) =>
    fornkla(
      ring.map(([lon, lat]) => mercator(lon, lat)),
      SILUETT_TOLERANS,
    ).map(([x, y]) => [Math.round(x), Math.round(y)]),
  );

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const delar: string[] = [];

  for (const ring of ringar) {
    /* Sista punkten är den första igen, och Z sluter ringen åt oss. */
    const sist = ring.length - 1;
    const punkter =
      ring[0][0] === ring[sist][0] && ring[0][1] === ring[sist][1] ? ring.slice(0, sist) : ring;
    let px = 0;
    let py = 0;
    punkter.forEach(([x, y], i) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (i === 0) {
        delar.push(`M${x} ${y}`);
      } else if (x !== px || y !== py) {
        delar.push(`l${x - px} ${y - py}`);
      }
      px = x;
      py = y;
    });
    delar.push('Z');
  }

  return {
    d: delar.join(''),
    viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`,
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
  };
}
