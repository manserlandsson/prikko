// @ts-check
import { globSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { establishments, isIndexable } from './src/lib/data.ts';
import { path } from './src/lib/urls.ts';

/**
 * Renderingsstrategi (se docs/adr/0001-rendering-strategi.md):
 * Vi kör statiskt (SSG) nu. När sidantalet passerar ~15 000 byter vi till
 * hybrid på Cloudflare Workers — hubbar/leaderboards förrenderas, restaurang-
 * sidornas långa svans SSR:as på edge med cache. Det bytet ska vara ett
 * adapter-tillägg plus `export const prerender = false` på svanssidorna,
 * inget omskrivet datalager. Håll därför all dataåtkomst i src/lib/.
 */

/**
 * Sökvägar som bär `noindex` och därför aldrig får ligga i sitemapen.
 *
 * En sitemap är ett påstående om vilka sidor som ska indexeras. Att be Google
 * indexera sidor som samtidigt säger noindex är en direkt motsägelse: Search
 * Console rapporterar "Skickad URL markerad som noindex", de riktiga felen
 * dränks, och Google lär sig att sitemapen inte är tillförlitlig. På en ny
 * domän är den signalen dyr. Före den här listan låg samtliga 2 137
 * no-indexade sidor i sitemapen, alltså 13,9 procent av den.
 *
 * Listan räknas INTE upp för hand. Den härleds ur exakt samma predikat som
 * sidmallen använder, `isIndexable()` i lib/data.ts, så kvalitetsgrinden och
 * sitemapen inte kan glida isär när kravet ändras. Det gamla filtret uteslöt
 * `/preview/`, en sökväg som aldrig funnits i utfallet, med en kommentar om
 * att det skulle utökas när sidmallarna fanns.
 *
 * Undantaget är /ratta, som sätter `noindex` i sin egen mall av juridiska skäl
 * och inte ur någon datamängd. Den och varje framtida syskonsida fångas av
 * `sitemapGuard` nedan, som mäter utfallet i stället för att lita på den här
 * funktionen.
 */
function noindexPaths() {
  const paths = new Set();
  for (const e of establishments()) {
    if (!isIndexable(e)) paths.add(path(e.municipality.slug, e.slug));
  }
  paths.add(path('ratta'));
  return paths;
}

const excluded = noindexPaths();

/**
 * Bygggrind: sitemapen och `noindex` får aldrig säga emot varandra.
 *
 * Filtret ovan läser KÄLLDATAN. Den här läser UTFALLET: varje HTML-fil som
 * bär `<meta name="robots" content="noindex">` jämförs med sitemapens URL:er.
 * Lägger någon till en no-indexad sidtyp som filtret inte känner till stannar
 * bygget här i stället för att publicera motsägelsen.
 *
 * Integrationen måste ligga EFTER sitemap i `integrations`: hookarna körs i
 * arrayordning, och sitemap-0.xml finns inte förrän sitemap kört sin.
 */
function sitemapGuard() {
  return {
    name: 'prikko:sitemap-guard',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const out = fileURLToPath(dir);

        const listed = new Set();
        for (const file of globSync('sitemap-*.xml', { cwd: out })) {
          const xml = readFileSync(`${out}${file}`, 'utf8');
          for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
            if (match[1].endsWith('.xml')) continue;
            listed.add(new URL(match[1]).pathname);
          }
        }

        const contradictions = [];
        for (const file of globSync('**/*.html', { cwd: out })) {
          const html = readFileSync(`${out}${file}`, 'utf8');
          if (!html.includes('name="robots" content="noindex')) continue;
          const pathname = `/${file.replace(/index\.html$/, '')}`;
          if (listed.has(pathname)) contradictions.push(pathname);
        }

        if (contradictions.length > 0) {
          throw new Error(
            `${contradictions.length} sidor är både noindex och med i sitemapen. ` +
              'Sitemap-filtret i astro.config.mjs måste utesluta dem. Först: ' +
              contradictions.slice(0, 5).join(', '),
          );
        }

        logger.info(`${listed.size} URL:er i sitemapen, ingen motsäger sin egen noindex`);
      },
    },
  };
}

export default defineConfig({
  site: 'https://prikko.se',

  integrations: [
    sitemap({
      // Kvalitetsgrind: no-indexade sidor får aldrig hamna i sitemap.
      filter: (page) => !excluded.has(new URL(page).pathname),
      changefreq: 'weekly',
      lastmod: new Date(),
    }),
    sitemapGuard(),
  ],

  build: {
    // Rena URL:er utan .html → /stockholm/sodermalm/vesuvio
    format: 'directory',
  },

  compressHTML: true,

  prefetch: {
    // Snabb navigering hub → spoke utan att skicka onödig JS i förväg.
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
});
