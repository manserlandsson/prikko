/**
 * Innehållssamlingar: författad text, till skillnad från allt annat på sajten.
 *
 * Rapporterna (lib/rapporter.ts) är räknade ur beståndet och bor därför i ett
 * TypeScript-register. Artiklarna är motsatsen: skriven text med publicerings-
 * datum, och för det är en content collection rätt verktyg. rapporter.ts
 * förutsåg den här delningen i sin egen huvudkommentar, och den ska bestå:
 * en artikel får aldrig flyttas in i rapportregistret eller tvärtom.
 *
 * Schemat är avsiktligt strängt. Base.astro kräver unik title och description
 * per sida, och kvalitetsgrinden (bibeln §6) tål inga tomma fält. Ett bygge
 * med en artikel utan description ska stanna här, i valideringen, inte
 * upptäckas i Search Console.
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const artiklar = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/artiklar' }),
  schema: z.object({
    /** H1 och länktext. Base lägger till varumärket i <title>. */
    title: z.string().min(10).max(80),
    /**
     * Meta description, skriven för sidan och aldrig delad med en annan.
     * Google klipper runt 160 tecken; ett golv finns för att en enradig
     * beskrivning är den tunna sida grinden ska stoppa.
     */
    description: z.string().min(70).max(170),
    /** Ingressen under rubriken och på kortet i indexlistan. */
    lede: z.string().min(40),
    /**
     * Kategorietiketten på kortet, JobbSafari-mönstret. Sluten lista:
     * "Guide" hjälper läsaren att göra något, "Förklarat" hjälper läsaren
     * att förstå något. Fler kategorier läggs till här när de behövs, inte
     * ad hoc i en artikel.
     */
    category: z.enum(['Guide', 'Förklarat']),
    /** Första publicering, ISO-datum. Blir datePublished i JSON-LD. */
    published: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** Senaste innehållsändring. Sätts BARA när texten faktiskt ändrats. */
    updated: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    /** Utkast byggs aldrig och räknas inte mot kvalitetsgrinden. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { artiklar };
