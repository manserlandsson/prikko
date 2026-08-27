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
