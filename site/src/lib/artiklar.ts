/**
 * Artikelsektionens kvalitetsgrind och småhjälpare.
 *
 * ## Varför filen läser filsystemet och inte astro:content
 *
 * Grinden behövs på två ställen som inte kan dela kod hur som helst:
 * sidmallarna (som kan använda astro:content) och astro.config.mjs (som körs
 * innan Astro finns och därför inte kan). Skulle tröskeln bo i sidmallen och
 * sitemap-filtret räkna på egen hand glider de isär, och det är exakt den
 * motsägelse sitemapGuard i astro.config.mjs stoppar bygget för. Därför läser
 * grinden markdown-filerna direkt: samma funktion, båda ställena.
 *
 * ## Varför tröskeln finns
 *
 * En indexsida med en ensam artikel är en tunn sida i bibelns §6-mening, och
 * en sektion som lanseras tom skadar hela domänen vid bedömning av skalat
 * innehåll. Under MIN_ARTICLES publicerade artiklar bär därför hela sektionen
 * noindex och hålls ur sitemapen. Sidorna byggs ändå, så att de går att
 * granska på plats innan de släpps på.
 */
import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Minsta antal publicerade artiklar innan sektionen får indexeras. */
export const MIN_ARTICLES = 3;

/**
 * Katalogen läses relativt processens arbetskatalog, inte import.meta.url.
 * Vid bygget buntas modulen till dist/.prerender/chunks/, och en sökväg
 * relativ filen pekar då ut i tomma intet: grinden såg noll artiklar och
 * indexsidans rimlighetskontroll stoppade bygget. Astro körs alltid från
 * site/, så cwd är stabil; körs den någon annanstans ifrån blir listan tom
 * och samma rimlighetskontroll stoppar bygget högt i stället för att tyst
 * no-indexera en frisk sektion.
 */
const DIR = join(process.cwd(), 'src/content/artiklar');

export interface ArticleFile {
  /** Filnamnet utan .md, vilket är exakt vad glob-loadern gör till id/slug. */
  slug: string;
  /**
   * Rubriken ur frontmattern.
   *
   * Läses här och inte via astro:content, eftersom den här modulen också
   * importeras av astro.config.mjs och av webbkarta.ts, och ingen av dem kör
   * i en sammanhang där astro:content finns. Fältet är obligatoriskt i
   * content.config.ts, så det finns alltid; saknas det ändå faller vi
   * tillbaka på slugen i stället för att bygga en länk utan text.
   */
  title: string;
  published: string | null;
  updated: string | null;
}

/**
 * Publicerade artiklar, lästa från disk. Utkast (draft: true) räknas inte:
 * de byggs inte och får därför varken hålla grinden öppen eller stängd.
 *
 * Frontmatter läses med regex i stället för en YAML-tolk. Fälten som behövs
 * är tre ISO-datum och en boolesk rad, och schemat i content.config.ts har
 * redan validerat filen långt strängare än någon tolk här skulle.
 */
export function articleFiles(): ArticleFile[] {
  const files: ArticleFile[] = [];
  for (const file of globSync('*.md', { cwd: DIR })) {
    // README.md i katalogen är instruktionen för hur bilderna läggs in, inte
    // en artikel. Samma undantag står i content.config.ts loader, och de två
    // måste följas åt: räknas README som artikel här hamnar /artiklar/readme/
    // i sitemapen utan att sidan finns, och sitemapGuard stoppar bygget.
    if (file === 'README.md') continue;
    const raw = readFileSync(join(DIR, file), 'utf8');
    if (/^draft:\s*true\s*$/m.test(raw)) continue;
    const slug = file.replace(/\.md$/, '');
    files.push({
      slug,
      title: raw.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? slug,
      published: raw.match(/^published:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1] ?? null,
      updated: raw.match(/^updated:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1] ?? null,
    });
  }
  return files;
}

/** Sant när sektionen har nog med innehåll för att få indexeras. */
export function sectionReady(): boolean {
  return articleFiles().length >= MIN_ARTICLES;
}

/**
 * Lästid i hela minuter, ur markdown-källan.
 *
 * 200 ord i minuten är en vedertagen läshastighet för sakprosa. Talet är en
 * uppskattning åt läsaren, inte ett mått vi står för, så det avrundas och
 * golvas till en minut i stället för att låtsas om precision.
 */
export function readingMinutes(body: string): number {
  const words = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_[\]()`|-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
