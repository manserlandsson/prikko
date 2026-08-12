// @ts-check
import { globSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { inloggningsgrind } from './scripts/inloggningsgrind.mjs';
import { kartrutegrind } from './scripts/kartrutegrind.mjs';
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
 * En sitemapfil per sidtyp, i stället för en enda på 14 000 rader.
 *
 * Bakgrunden är en mätning, inte en smaksak. Search Console rapporterade en
 * vecka efter lansering 12 indexerade sidor mot 13 999 "Discovered, currently
 * not indexed". På en domän som är en vecka gammal är det crawlbudget och inte
 * ett tekniskt fel, men med allt i EN fil går det inte att se VILKA sidor som
 * väntar. Search Console redovisar täckning PER SITEMAPFIL, och det är den
 * enda uppdelning verktyget erbjuder. Med en fil kan vi alltså inte skilja
 * "de sexhundra rankbara sidorna är indexerade och svansen väntar" från
 * "ingenting går in", och de två lägena kräver rakt motsatta åtgärder.
 *
 * VALET AV VÄG. Integrationens `chunks` gör precis det här: en nyckel per
 * grupp, en återanropsfunktion per nyckel, och filerna heter efter nyckeln.
 * En egen generator hade betytt att vi själva skriver XML-escaping,
 * indexfilen, styckningen vid `entryLimit` och `lastmod` per fil, alltså fyra
 * saker som redan är lösta och underhållna. Det enda vi inte kommer åt är
 * ändelsen: filerna heter `sitemap-kommuner-0.xml` och inte
 * `sitemap-kommuner.xml`, eftersom nollan är styckningsnumret. Det är rätt
 * pris. Numret betyder något den dag verksamheterna passerar 45 000 och måste
 * ligga i två filer, och namnet är läsbart i Search Console ändå, vilket var
 * hela poängen.
 *
 * ORDNINGEN SPELAR INGEN ROLL, MEN UTESLUTNINGEN GÖR DET. Integrationen kör
 * varje återanrop över SAMTLIGA URL:er, så en URL som två grupper säger ja
 * till hamnar i båda och räknas dubbelt. Därför finns ett enda klassificerande
 * uttryck här, `sidtyp()`, och varje grupp frågar bara om svaret är dess eget.
 * Två grupper kan då inte överlappa ens av misstag.
 *
 * `sidtyp()` svarar `null` för en sökväg den inte känner igen. Sådana URL:er
 * hamnar i integrationens egen restgrupp, `sitemap-pages-0.xml`, och den
 * filens blotta existens fäller bygget i `sitemapGuard`. En ny sidtyp ska
 * alltså räknas upp här, inte tyst falla ned i en fil som heter fel.
 */
const kommunSlugs = new Set(municipalities().map((m) => m.slug));

/** Toppnivåns skrivna och räknade sidor, alltså sajten om sig själv. */
const START_PAGES = new Set([
  'om',
  'metodik',
  'kallor',
  'sok',
  'webbkarta',
  'villkor',
  'cookies',
  'integritetspolicy',
  'hjalp',
  'kontakt',
]);

function sidtyp(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'start';

  if (kommunSlugs.has(segments[0])) {
    if (segments.length === 1) return 'kommuner';

    switch (segments[1]) {
      case 'kategori':
        return 'kategorier';
      case 'omrade':
        return 'omraden';
      case 'karta':
        return 'kartor';
      /* Kommunens övriga listsidor. Sidindelningen, anmärkningslistan,
         matsnusksidan och rörelseloggen är alla vyer över samma register och
         hör ihop med hubben de nås från. */
      case 'sida':
      case 'anmarkningar':
      case 'matsnusk':
      case 'nytt-och-borta':
        return 'kommuner';
      default:
        /* `/stockholm/vesuvio/` och ingenting djupare. En tredje nivå under en
           kommun som inte fångats ovan är en sidtyp vi inte känner till. */
        return segments.length === 2 ? 'verksamheter' : null;
    }
  }

  switch (segments[0]) {
    case 'artiklar':
      return 'artiklar';
    case 'rapporter':
      return 'rapporter';
    case 'utmarkelser':
      return 'utmarkelser';
    case 'kedja':
      return 'kedjor';
    /* Rikskartan ligger hos kommunkartorna och inte bland toppsidorna: den
       besvarar samma fråga för hela landet som de gör för sin kommun. */
    case 'karta':
      return 'kartor';
    case 'nytt-och-borta':
      return 'kommuner';
    default:
      return segments.length === 1 && START_PAGES.has(segments[0]) ? 'start' : null;
  }
}

/** Grupperna, i den ordning de ska läsas i Search Console. */
const SITEMAP_GROUPS = [
  'start',
  'kommuner',
  'kategorier',
  'omraden',
  'kartor',
  'kedjor',
  'artiklar',
  'rapporter',
  'utmarkelser',
  'verksamheter',
];

const sitemapChunks = Object.fromEntries(
  SITEMAP_GROUPS.map((grupp) => [
    grupp,
    (item) => (sidtyp(new URL(item.url).pathname) === grupp ? item : undefined),
  ]),
);

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
 * 3. Ingen URL får ha hamnat utanför grupperna i `sitemapChunks`. Restgruppen
 *    heter `pages` i integrationen och går inte att döpa om, så en fil med det
 *    namnet betyder att en ny sidtyp tillkommit utan att `sidtyp()` känner
 *    igen den. Den skulle då ligga i en sitemapfil vars namn inte säger vad
 *    den innehåller, alltså precis det blindläge delningen skulle bort med.
 *
 * Läsningen sker över SAMTLIGA `sitemap-*.xml`, inte över en enskild fil.
 * Sitemapen är delad per sidtyp och antalet filer ändras när en sidtyp
 * tillkommer, så en vakt som läste en namngiven fil hade slutat mäta tyst.
 * Indexfilens egna rader hoppas över på att de pekar på .xml.
 *
 * Integrationen måste ligga EFTER sitemap i `integrations`: hookarna körs i
 * arrayordning, och sitemapfilerna finns inte förrän sitemap kört sin.
 */
/**
 * Grinden mot CSS som svalt sitt eget stylesheet.
 *
 * En saknad avslutande klammer i ett scopeat <style> är INTE ett syntaxfel.
 * CSS-nästling är giltig syntax, så allt som står efter den trasiga regeln
 * blir i stället nästlat INUTI den. Bygget säger ingenting, loggen är tom, och
 * filen ser normal ut. Reglerna gäller bara i det tillstånd den yttre
 * selektorn beskriver.
 *
 * Det hände 2026-08-08 och kostade oss ett halvt dygn i två skepnader som
 * ingen kopplade ihop: fördelningsstapeln i kommunpanelen försvann, och
 * verksamhetssidans sidopanel la sig ovanpå texten på telefon. Båda berodde på
 * att `.jamfor-knapp:hover` saknade sin klammer. Sist i den svalda svansen låg
 * `@media (max-width: 900px)`, alltså mediefrågan som lägger sidopanelen under
 * huvudkolumnen, och utan den pressades huvudkolumnen till noll pixlars bredd
 * av den fasta 300-pixelsspalten.
 *
 * Vakten letar därför efter nästling i det MINIFIERADE resultatet, som är där
 * felet blir synligt. Sajten skriver ingen nästling för hand, så varje träff är
 * ett fel. Skulle vi någon gång vilja använda nästling med avsikt är rätt
 * åtgärd att lista den filen som undantag här, med skälet skrivet, inte att ta
 * bort vakten.
 */
function nestingGuard() {
  return {
    name: 'prikko:nesting-guard',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const traffar = [];

        for (const file of globSync('**/*.css', { cwd: out })) {
          const css = readFileSync(`${out}${file}`, 'utf8');
          /* `}& ` och `;& ` är hur en nästlad regel ser ut efter minifiering:
             en avslutad deklaration eller regel följd av nästningsväljaren. */
          const antal = (css.match(/[};]&[\s.#\[:]/g) ?? []).length;
          if (antal > 0) traffar.push(`${file}: ${antal}`);
        }

        if (traffar.length > 0) {
          throw new Error(
            'CSS-nästling i byggd stilfil. Nästan alltid en saknad avslutande\n' +
              '  klammer i ett <style>-block: allt efter den trasiga regeln har\n' +
              '  hamnat inuti den och gäller bara i dess tillstånd.\n\n' +
              traffar.map((t) => `    ${t}`).join('\n') +
              '\n\n  Sök i site/src efter det senast ändrade stilblocket och räkna\n' +
              '  klamrarna. Se prikko:nesting-guard i astro.config.mjs.',
          );
        }

        logger.info('inga nästlade CSS-regler, alltså inget svalt stilark.');
      },
    },
  };
}

function sitemapGuard() {
  return {
    name: 'prikko:sitemap-guard',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const out = fileURLToPath(dir);

        const listed = new Set();
        const perFile = [];
        for (const file of globSync('sitemap-*.xml', { cwd: out }).sort()) {
          const xml = readFileSync(`${out}${file}`, 'utf8');
          let n = 0;
          for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
            if (match[1].endsWith('.xml')) continue;
            listed.add(new URL(match[1]).pathname);
            n += 1;
          }
          if (n > 0) perFile.push(`${file.replace(/^sitemap-|-\d+\.xml$/g, '')} ${n}`);

          if (file.startsWith('sitemap-pages-')) {
            const strays = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
              .map((m) => new URL(m[1]).pathname)
              .slice(0, 5);
            throw new Error(
              `${n} URL:er föll utanför sitemapens grupper och hamnade i ${file}. ` +
                'Filnamnet säger då ingenting om vad den innehåller, och Search ' +
                'Console kan inte skilja sidtyperna åt. Lägg till sidtypen i ' +
                `sidtyp() i astro.config.mjs. Först: ${strays.join(', ')}`,
            );
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
        logger.info(`sitemapen delad per sidtyp: ${perFile.join(', ')}.`);
      },
    },
  };
}

export default defineConfig({
  site: 'https://prikko.se',

  integrations: [
    /* Artiklarna är .mdx för att en text ska kunna visa ett diagram där talet
       annars stått i löptext. Ligger först i arrayen: sitemapGuard nedan läser
       de färdiga sidorna, och MDX måste vara registrerad innan samlingen
       laddas. Rapporterna påverkas inte, de är TypeScript och inte innehåll. */
    mdx(),
    sitemap({
      // Kvalitetsgrind: no-indexade sidor får aldrig hamna i sitemap.
      filter: (page) => !excluded.has(new URL(page).pathname),
      // `changefreq` är borttaget med flit. Google har sagt rakt ut att fältet
      // ignoreras helt, och ett fält som ingen läser är brus i en fil på 2 MB.
      serialize: (item) => {
        const lastmod = lastmodFor(new URL(item.url).pathname);
        return lastmod ? { url: item.url, lastmod } : { url: item.url };
      },
      // En fil per sidtyp under sitemap-index.xml. Se `sitemapChunks` ovan för
      // varför uppdelningen finns och varför den görs med integrationens egna
      // alternativ i stället för med en egen generator.
      chunks: sitemapChunks,
    }),
    sitemapGuard(),
    nestingGuard(),
    /* Vaktar de fyra regler som gör att arken inte hoppar på telefon.
       Grinden bor i scripts/inloggningsgrind.mjs och förklarar sig själv. */
    inloggningsgrind(),
    /* Öppnar det färdiga rutarkivet med samma läsare som webbläsaren kör.
       Vi skriver PMTiles själva, och en egen skrivare utan en mätning är ett
       löfte. Grinden bor i scripts/kartrutegrind.mjs. */
    kartrutegrind(),
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
