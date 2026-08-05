// @ts-check
import { globSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { inloggningsgrind } from './scripts/inloggningsgrind.mjs';
import {
  establishments,
  latestInspectionDate,
  municipalities,
  sourceFor,
} from './src/lib/data.ts';
import { path } from './src/lib/urls.ts';
import { articleFiles } from './src/lib/artiklar.ts';
import { REPORTS } from './src/lib/rapporter.ts';
import { editions, standings } from './src/lib/utmarkelser.ts';
import { noindexPaths } from './src/lib/webbkarta.ts';

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
 * Predikatet bor i `src/lib/webbkarta.ts` och inte här. Det flyttade dit när
 * den läsbara webbkartan tillkom, eftersom den sidan måste utesluta exakt
 * samma sökvägar som XML-sitemapen gör. Två beskrivningar av vad som får
 * indexeras kommer att glida isär, och när de gör det märks det först i
 * Search Console.
 *
 * Motiveringen till varje utesluten sidtyp står i den filen. `sitemapGuard`
 * nedan mäter utfallet i stället för att lita på funktionen.
 */
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
 * Fem nivåer, i den ordning de prövas:
 *
 *   Verksamhetssida   Senaste kontrollens datum. Det är sidans innehåll.
 *   Kommunens sidor   `source.fetchedAt`, alltså när vi senast hämtade
 *                     kommunen. Hubb, sidindelning, kategori och
 *                     anmärkningssida ändras alla när hämtningen ändras.
 *   Artikel           `updated` ur frontmattern, annars `published`.
 *   Räknad sida       Färskaste hämtningen. Rapporterna, källsidan, sökningen,
 *                     webbkartan och startsidan innehåller inga skrivna
 *                     meningar utom rubrikerna; varje tal räknas fram vid
 *                     bygget och ändras när datan gör det.
 *   Fryst sida        Utgåvans `asOf`. Utmärkelserna läser sin egen fil och
 *                     ändras aldrig mer.
 *   Skriven sida      Inget `lastmod` alls. Vi vet inte när texten på /om
 *                     senast skrevs om, och att gissa är att göra om samma
 *                     fel i mindre skala. Fältet är valfritt i standarden.
 *                     Kvar utan datum: /om, /metodik, /villkor, /cookies och
 *                     /integritetspolicy.
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

  // Artiklarna bär sina egna datum i frontmatter: `updated` när texten
  // ändrats, annars `published`. Indexsidan ändras när dess färskaste
  // artikel gör det.
  let latestArticle = '';
  for (const a of articleFiles()) {
    const date = a.updated ?? a.published;
    if (!date) continue;
    byPath.set(path('artiklar', a.slug), date);
    if (date > latestArticle) latestArticle = date;
  }
  if (latestArticle) byPath.set(path('artiklar'), latestArticle);

  /*
   * De räknade sidorna: rapporter, källsidan, sökningen, webbkartan och
   * startsidan.
   *
   * Fjorton URL:er saknade `lastmod` helt, och för fem av dem var det rätt
   * (se nedan). För de här nio var det fel av ett skäl som är lätt att missa:
   * de innehåller inga skrivna meningar utom rubrikerna. Varenda siffra på
   * /rapporter/vad-anmarkningarna-galler/ räknas fram ur beståndet vid bygget,
   * så sidan ändras exakt när datan gör det. Att utelämna datumet var att
   * påstå att vi inte vet, när vi vet på dagen.
   *
   * `dataUpdated()` är den färskaste hämtningen över alla källor, alltså samma
   * tal som rapportsidorna redan skriver ut som `dateModified` i sin JSON-LD.
   * Sitemapen och sidan säger nu samma sak.
   */
  const dataDate = municipalities()
    .map((m) => sourceFor(m.slug)?.fetchedAt)
    .filter(Boolean)
    .sort()
    .at(-1)
    ?.slice(0, 10);

  if (dataDate) {
    for (const p of ['/', path('rapporter'), path('kallor'), path('sok'), path('webbkarta')]) {
      byPath.set(p, dataDate);
    }
    for (const r of REPORTS) byPath.set(path('rapporter', r.slug), dataDate);
  }

  /*
   * Utmärkelserna är motsatsen: de är FRYSTA. En utgåva läser inte beståndet
   * utan sin egen fil i src/editions/, och `asOf` är den dag den frystes.
   * Sidan ändras därför aldrig mer, och det är precis vad `lastmod` ska säga.
   * Att låta dem ärva hämtningsdatumet hade varit att be Google crawla om
   * sidor som per konstruktion är oföränderliga.
   */
  let latestEdition = '';
  for (const ed of editions()) {
    const asOf = ed.asOf.slice(0, 10);
    byPath.set(path('utmarkelser', String(ed.year)), asOf);
    for (const m of standings(ed.year)) {
      if (m.ownPage) byPath.set(path('utmarkelser', String(ed.year), m.slug), asOf);
    }
    if (asOf > latestEdition) latestEdition = asOf;
  }
  if (latestEdition) byPath.set(path('utmarkelser'), latestEdition);

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
 * Bygggrind: sitemapen, `noindex` och webbkartan får aldrig säga emot varandra.
 *
 * Filtret ovan läser KÄLLDATAN. Den här läser UTFALLET, och kontrollerar två
 * saker:
 *
 * 1. Varje HTML-fil som bär `<meta name="robots" content="noindex">` jämförs
 *    med sitemapens URL:er. Lägger någon till en no-indexad sidtyp som filtret
 *    inte känner till stannar bygget i stället för att publicera motsägelsen.
 *
 * 2. Varje intern länk i webbkartans `<main>` måste finnas i XML-sitemapen.
 *    Det är hela garantin för att den läsbara och den maskinläsbara
 *    innehållsförteckningen inte kan glida isär. De byggs ur samma modul, men
 *    en delad modul är ett löfte medan det här är en mätning: en länk till en
 *    sida som slutat byggas, eller till en sida som fallit under sin
 *    kvalitetsgrind, stoppar bygget.
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

        // Webbkartan mot sitemapen. Bara sidlänkar prövas, alltså rotrelativa
        // sökvägar som slutar med snedstreck. Det är formen lib/urls.ts alltid
        // producerar, så filer (/sitemap-index.xml) och ankare (#kommuner)
        // faller bort utan att behöva räknas upp.
        const map = readFileSync(`${out}webbkarta/index.html`, 'utf8');
        const main = map.slice(map.indexOf('<main'), map.indexOf('</main>'));
        const dangling = new Set();
        for (const match of main.matchAll(/href="(\/[^"#?]*\/)"/g)) {
          if (!listed.has(match[1])) dangling.add(match[1]);
        }

        if (dangling.size > 0) {
          throw new Error(
            `${dangling.size} länkar på /webbkarta/ saknas i XML-sitemapen. ` +
              'Antingen byggs sidan inte längre, eller så har den fallit under ' +
              'sin kvalitetsgrind och ska utelämnas i src/lib/webbkarta.ts. ' +
              `Först: ${[...dangling].slice(0, 5).join(', ')}`,
          );
        }

        const links = [...main.matchAll(/href="(\/[^"#?]*\/)"/g)].length;
        logger.info(
          `${listed.size} URL:er i sitemapen, ingen motsäger sin egen noindex. ` +
            `Webbkartan länkar ${links} av dem.`,
        );
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
    /* Vaktar de fyra regler som gör att arken inte hoppar på telefon.
       Grinden bor i scripts/inloggningsgrind.mjs och förklarar sig själv. */
    inloggningsgrind(),
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
