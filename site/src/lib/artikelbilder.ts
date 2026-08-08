/**
 * Artiklarnas bilder: filen, texten om den och kopplingen dem emellan.
 *
 * ## Varför filen hittas på slug och inte skrivs i frontmatter
 *
 * Samma mönster som stadsfotona i KommunKort.astro. Bilderna upptäcks från
 * filsystemet, och namnet på filen ÄR kopplingen: heter artikeln
 * `sa-laser-du-en-hygienkontroll.mdx` heter bilden
 * `sa-laser-du-en-hygienkontroll.jpg`. Ingen sökväg att skriva av i tolv
 * frontmatterblock, och ingen sökväg som pekar fel dagen en artikel byter
 * filnamn.
 *
 * ## Varför modulen stoppar bygget i stället för att visa det som finns
 *
 * Fil och frontmatter är två halvor av samma bild, och de kan glida isär åt
 * två håll. En fil utan `image:` i frontmattern är en bild utan alt-text,
 * alltså en tom lucka för den som lyssnar på sidan i stället för att se den —
 * och sajten har tillgänglighet som krav, inte som ambition. En `image:` utan
 * fil är en bild som försvann i en flytt utan att någon märkte det.
 *
 * Båda ger `Error` här och stoppar bygget. Det är samma hållning som
 * artikelgrinden i lib/artiklar.ts: en motsägelse i innehållet upptäcks vid
 * bygget, inte av en läsare.
 */
import type { ImageMetadata } from 'astro';

/**
 * Alla filer i src/assets/artiklar, nycklade på slug.
 *
 * `eager: true` för att metadatan (bredd, höjd, format) måste finnas synkront
 * när mallen renderar. Det är bara metadatan som laddas här, inte bildernas
 * bytes: Astro kompilerar importen till ett litet objekt och genererar de
 * faktiska filerna först när <Image> begär en bredd.
 */
const files = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/artiklar/*.jpg',
  { eager: true },
);

const photos: Record<string, ImageMetadata> = Object.fromEntries(
  Object.entries(files).map(([file, mod]) => [
    file.split('/').pop()!.replace('.jpg', ''),
    mod.default,
  ]),
);

/** Bildens texter, exakt så som de står i artikelns frontmatter. */
export interface ArticleImageMeta {
  alt: string;
  source: string;
  credit?: string;
  creditUrl?: string;
}

/** Filen och texterna ihop, klart att rendera. */
export interface ArticleImage extends ArticleImageMeta {
  src: ImageMetadata;
}

/**
 * Artikelns bild, eller null när artikeln inte har någon.
 *
 * Kastar när filen och frontmattern säger emot varandra. Se huvudkommentaren.
 */
export function articleImage(
  slug: string,
  meta: ArticleImageMeta | undefined,
): ArticleImage | null {
  const src = photos[slug] ?? null;

  if (src && !meta) {
    throw new Error(
      `src/assets/artiklar/${slug}.jpg finns, men ${slug}.mdx saknar image: i frontmattern. ` +
        'En bild utan alt-text får inte publiceras. Se src/content/artiklar/README.md.',
    );
  }
  if (meta && !src) {
    throw new Error(
      `${slug}.mdx har image: i frontmattern, men src/assets/artiklar/${slug}.jpg saknas. ` +
        'Bilden hittas på artikelns slug, så filen måste heta exakt som .mdx-filen.',
    );
  }
  if (!src || !meta) return null;

  return { src, ...meta };
}

/**
 * Kreditraden under bilden och i listan på källsidan.
 *
 * Formen är "Fotograf / Källa" när fotografen är känd och bara källan när den
 * inte är det. Ingen påhittad upphovsperson och ingen tom parentes: raden ska
 * kunna läsas rakt av som ett påstående vi står för.
 */
export function creditLine(image: ArticleImageMeta): string {
  return image.credit ? `${image.credit} / ${image.source}` : image.source;
}

/**
 * Bredderna Astro genererar srcset ur.
 *
 * Källfilerna är 1400 px breda (samma mått som stadsfotona), och listan slutar
 * därför på 1400: högre värden skulle bara skala upp. Den största sätts också
 * som `width` på elementet — utan den lägger Astro originalet som `src` och vi
 * bygger ut en fil som ingen webbläsare med srcset-stöd hämtar.
 */
export const HERO_WIDTHS = [680, 1080, 1400];
export const HERO_SIZES = '(max-width: 720px) 100vw, 680px';

/** Korten i listan är ~280–400 px breda, så 800 täcker 2× på retina. */
export const CARD_WIDTHS = [400, 560, 800];
export const CARD_SIZES = '(max-width: 560px) 100vw, 360px';
