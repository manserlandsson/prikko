/**
 * Märket som PNG, rasteriserat vid bygget.
 *
 * ## Varför en rasterisering och inte en andra ritning
 *
 * Ett emblem ska gå att sätta i ett Instagraminlägg och att skriva ut och
 * tejpa i ett fönster, och ingendera tar en SVG. Frestelsen är då att rita en
 * "tryckversion", och det är precis felet lib/marke.ts redan varnar för: två
 * ritningar glider isär, och den dagen är märket i fönstret inte längre samma
 * märke som listan delar ut.
 *
 * Filen här rasteriserar därför den EXAKTA fil som serveras som marke.svg,
 * kommentaren i huvudet inräknad. Går ritningen sönder går alla tre formaten
 * sönder samtidigt, vilket är det enda felläge som går att upptäcka.
 *
 * ## Varför sharp
 *
 * sharp ligger redan i node_modules som beroende till astro@7, som använder
 * det för sin egen bildtjänst. Det är alltså inget nytt beroende, och det
 * körs bara vid bygget: modulen importeras av en enda rutt och når aldrig
 * webbläsaren.
 *
 * `density` är inte upplösning utan hur fint librsvg tolkar kurvorna innan
 * sharp skalar. Den behövs eftersom ritningens viewBox är 507 enheter bred
 * medan vi vill ha 2 400 pixlar: utan den rastreras den i sin nominella
 * storlek och skalas upp suddig.
 */
import sharp from 'sharp';
import { markDocument } from './marke';
import { RASTER_BG, pngGeometry } from './emblem';

/**
 * Så fint ritningen tolkas innan den skalas.
 *
 * 600 dpi mot en nominell bredd på 507 punkter ger drygt 4 200 pixlar, alltså
 * med marginal över den största filen vi skriver. Högre kostar byggtid utan
 * att synas, lägre ger mjuka kanter i lagerkransens tunna blad.
 */
const DENSITY = 600;

/** En PNG. `width` är filens bredd, marginalen inräknad. */
export async function markPng(
  year: number,
  width: number,
  editionUrl: string,
): Promise<Buffer> {
  const g = pngGeometry(year, width);
  const svg = Buffer.from(markDocument(year, editionUrl));

  return sharp(svg, { density: DENSITY })
    .resize(g.inner.width, g.inner.height, { fit: 'contain', background: RASTER_BG })
    .extend({
      top: g.pad,
      bottom: g.pad,
      left: g.pad,
      right: g.pad,
      background: RASTER_BG,
    })
    /* Ritningen har genomskinlig botten. Utan flatten blir PNG:n genomskinlig
       trots att extend fyllt kanterna, och en genomskinlig PNG hamnar på svart
       så fort någon lägger den i ett mörkt inlägg. */
    .flatten({ background: RASTER_BG })
    .png({ compressionLevel: 9 })
    .toBuffer();
}
