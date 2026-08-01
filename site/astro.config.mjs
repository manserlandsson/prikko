// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * Renderingsstrategi (se docs/adr/0001-rendering-strategi.md):
 * Vi kör statiskt (SSG) nu. När sidantalet passerar ~15 000 byter vi till
 * hybrid på Cloudflare Workers — hubbar/leaderboards förrenderas, restaurang-
 * sidornas långa svans SSR:as på edge med cache. Det bytet ska vara ett
 * adapter-tillägg plus `export const prerender = false` på svanssidorna,
 * inget omskrivet datalager. Håll därför all dataåtkomst i src/lib/.
 */
export default defineConfig({
  site: 'https://prikko.se',

  integrations: [
    sitemap({
      // Kvalitetsgrind: no-indexade sidor får aldrig hamna i sitemap.
      // Filtret utökas när sidmallarna finns.
      filter: (page) => !page.includes('/preview/'),
      changefreq: 'weekly',
      lastmod: new Date(),
    }),
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
