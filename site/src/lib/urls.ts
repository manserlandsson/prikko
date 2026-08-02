/**
 * Intern länkform. Ett ställe, en form.
 *
 * `build.format: 'directory'` publicerar varje sida som en katalog, så den
 * kanoniska URL:en slutar alltid med snedstreck. Canonical byggs ur
 * `Astro.url.pathname` och får snedstrecket gratis. Allt annat som bygger en
 * länk måste sätta det själv, och gjorde det inte: 518 589 av 888 585
 * `<a href>` i utfallet pekade på formen utan snedstreck, liksom samtliga
 * 30 840 `item`-URL:er i BreadcrumbList.
 *
 * Två skäl att inte lämna det åt varje mall:
 *
 * 1. På Cloudflare Pages svarar en katalogsökväg utan snedstreck med en 308
 *    till formen med snedstreck. Utan den här hjälparen blir varje internt
 *    klick en omdirigering, och crawlbudgeten är den knappa resursen på en ny
 *    domän.
 * 2. Google kräver att `item` i BreadcrumbList är sidans KANONISKA URL.
 *    Brödsmulan i sökresultatet uteblir annars.
 *
 * Sajten motsade dessutom sig själv: sidnavigeringens `<a href>` sade
 * `/stockholm/sida/2` medan `<link rel="next">` på samma sida sade
 * `https://prikko.se/stockholm/sida/2/`.
 *
 * Frågesträng och fragment hör inte hemma här. `path('/sok') + '?q=…'` är
 * rätt väg — hjälparen bygger sökvägen, anroparen hänger på resten.
 */
import { SITE } from './site';

/**
 * Rotrelativ sökväg med avslutande snedstreck.
 *
 * Segmenten får själva innehålla snedstreck, så `path(base, 'sida', n)`
 * fungerar lika bra som `path('/stockholm/anmarkningar')`. Tomma segment
 * faller bort, och `path()` utan argument ger roten.
 */
export function path(...segments: Array<string | number>): string {
  const parts: string[] = [];
  for (const segment of segments) {
    for (const part of String(segment).split('/')) {
      if (part) parts.push(part);
    }
  }
  return parts.length > 0 ? `/${parts.join('/')}/` : '/';
}

/**
 * Absolut URL mot produktionsdomänen, i exakt den form Base sätter canonical.
 *
 * Används av JSON-LD, som till skillnad från `<a href>` inte kan vara
 * rotrelativ.
 */
export function absolute(...segments: Array<string | number>): string {
  return new URL(path(...segments), SITE.url).href;
}
