/**
 * Sveriges landkontur, för rikskartans skugga.
 *
 * Rikskartan öppnar på hela landet. Allt utanför gränsen ska dämpas, på samma
 * sätt som allt utanför ett valt område dämpas, se OMRÅDESSKUGGAN i
 * Karta.astro. Konturen är samma sorts hål i samma sorts världspolygon, bara
 * större.
 *
 * ## Var geometrin kommer ifrån
 *
 * Hela resonemanget står i pipeline/riket.py. Kortaste versionen: OSM:s
 * `admin_level=2`-relation för Sverige är SJÖGRÄNSEN och inte kusten, så den
 * duger inte som kontur. Konturen kommer i stället ur OSM:s egen generalisering
 * av sin egen kustlinje, klippt mot samma relation. Två OSM-källor, en ODbL,
 * samma attribution som stadsdelarnas och kommunernas ytor.
 *
 * ## Konturen SKUGGAR, den filtrerar aldrig
 *
 * Ytan är förenklad med 600 meters tolerans, alltså sextio gånger grövre än
 * kommunernas. 98,6 procent av beståndets koordinater ligger innanför; resten
 * är kajlägen i Stockholm och Oskarshamn som förenklingen lagt i vattnet.
 *
 * Det är oskadligt för en skugga och skulle vara förödande för ett filter.
 * Använd alltså ALDRIG den här ytan för att avgöra vad som räknas till något,
 * till skillnad från `municipalityArea` och områdenas ytor i lib/omraden.ts,
 * som är metersanna nog för just det.
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
 * Två fel skulle annars passera tyst: par kastade om till [lat, lon], och en
 * ring som inte slutit sig. Båda ger en mask som täcker allt eller ingenting,
 * alltså antingen en helt grå karta eller ingen skugga alls, och ingendera går
 * att felsöka i efterhand.
 *
 * Ytterhöljet är detsamma som looks_like_sweden() i pipeline/prikko/geo.py.
 */
for (const ring of [...riksgrans.outer, ...riksgrans.inner]) {
  if (ring.length < 4) {
    throw new Error('riket: en ring har färre än fyra punkter.');
  }
  const [fx, fy] = ring[0];
  const [lx, ly] = ring[ring.length - 1];
  if (fx !== lx || fy !== ly) {
    throw new Error('riket: en ring sluter sig inte. Se kedja() i pipeline/riket.py.');
  }
  for (const [lon, lat] of ring) {
    if (lon < 10 || lon > 25 || lat < 55 || lat > 70) {
      throw new Error(
        `riket: punkten [${lon}, ${lat}] ligger utanför Sverige. Ordningen är ` +
          '[longitud, latitud]; är paren omkastade blir masken hela världen.',
      );
    }
  }
}

/** Sveriges landkontur. */
export function swedenOutline(): Riksgrans {
  return riksgrans;
}

/**
 * Attributionen som måste stå där konturen visas.
 *
 * Kravet kommer ur ODbL. Rikskartan visar redan OpenStreetMap under kartan för
 * sitt underlag, men källan hör till DATAN och inte till sidan: flyttas
 * konturen någon annanstans ska attributionen följa med av sig själv.
 */
export function swedenSource(): RiketSource {
  return riksgrans.sources.osm;
}
