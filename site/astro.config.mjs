// @ts-check
import { globSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import {
  establishments,
  isIndexable,
  latestInspectionDate,
  municipalities,
  sourceFor,
} from './src/lib/data.ts';
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
 *
 * Kontosidorna står också här. De har inget innehåll att indexera: HTML-filen
 * är ett tomt formulär som fylls i webbläsaren av den som är inloggad. En
 * inloggningssida i sökresultatet är tunt innehåll i bibelns mening, och
 * kvalitetsgrinden gäller våra egna sidor lika mycket som datans.
 *
 * /sluta-bevaka hör till samma sort trots att den ligger utanför /konto. Den
 * nås bara från en länk i ett notismejl, den bär en engångsnyckel i adressen,
 * och en avregistreringssida i ett sökresultat är meningslös för alla utom
 * den som just fått mejlet.
 */
const ACCOUNT_PAGES = ['konto', 'konto/inloggad', 'konto/verksamhet', 'sluta-bevaka'];

function noindexPaths() {
  const paths = new Set();
  for (const e of establishments()) {
    if (!isIndexable(e)) paths.add(path(e.municipality.slug, e.slug));
  }
  paths.add(path('ratta'));
  for (const page of ACCOUNT_PAGES) paths.add(path(page));
  return paths;
}

const excluded = noindexPaths();

/**
 * `lastmod` per URL, hämtad ur datans egna datum.
 *
 * Tidigare stod `lastmod: new Date()`, vilket gav samtliga 14 041 poster
 * exakt samma tidsstämpel: byggtidpunkten. Google använder `lastmod` för att
 * prioritera omcrawlning, men bara när värdet är trovärdigt, och en sitemap
 * där varenda URL ändras i samma millisekund är per definition inte det. Den
 * ignoreras då i sin helhet.
 *
 * Det är dyrare här än på en vanlig sajt. Färskhet är en uttalad AEO-signal
 * (bibeln §6b: sidor uppdaterade inom två månader får 28 procent fler
 * citat), och förmågan att säga "den här verksamheten kontrollerades i
 * förrgår" är sajtens skarpaste kant. Den signalen kastades bort på det enda
 * ställe där Google faktiskt läser den. Datumet fanns redan i datan och
 * renderades till och med i huvudet som `<meta name="last-modified">`, ett
 * fält ingen sökmotor känner till.
 *
 * Att `InfoTip` genererar id med `Math.random()` gör dessutom bygget
 * oreproducerbart: varje körning ändrar varenda restaurangsidas HTML. Ett
 * `lastmod` som följde byggtiden hade alltså påstått att hela beståndet
 * ändrats varje natt.
 *
 * Tre nivåer, i den ordning de prövas:
 *
 *   Verksamhetssida   Senaste kontrollens datum. Det är sidans innehåll.
 *   Kommunens sidor   `source.fetchedAt`, alltså när vi senast hämtade
 *                     kommunen. Hubb, sidindelning, kategori och
 *                     anmärkningssida ändras alla när hämtningen ändras.
 *   Statisk sida      Inget `lastmod` alls. Vi vet inte när texten på /om
 *                     senast skrevs om, och att gissa är att göra om samma
 *                     fel i mindre skala. Fältet är valfritt i standarden.
 */
function lastmodIndex() {
  const byPath = new Map();

  for (const m of municipalities()) {
    const fetchedAt = sourceFor(m.slug)?.fetchedAt;
    if (fetchedAt) byPath.set(path(m.slug), fetchedAt.slice(0, 10));
  }

  for (const e of establishments()) {
    const date = latestInspectionDate(e);
    if (date) byPath.set(path(e.municipality.slug, e.slug), date.slice(0, 10));
  }

  return byPath;
}

const lastmods = lastmodIndex();

/**
 * Kommunprefixet för en sökväg, så att `/stockholm/sida/2/`,
 * `/stockholm/kategori/butiker/` och `/stockholm/anmarkningar/` ärver
 * kommunens hämtningsdatum utan att var och en behöver räknas upp.
 */
function lastmodFor(pathname) {
  const own = lastmods.get(pathname);
  if (own) return own;

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 1) return lastmods.get(path(segments[0]));

  return undefined;
}

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
      // `changefreq` är borttaget med flit. Google har sagt rakt ut att fältet
      // ignoreras helt, och ett fält som ingen läser är brus i en fil på 2 MB.
      serialize: (item) => {
        const lastmod = lastmodFor(new URL(item.url).pathname);
        return lastmod ? { url: item.url, lastmod } : { url: item.url };
      },
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
