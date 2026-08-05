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
  /**
   * README.md i samma katalog är instruktionen för hur bilderna läggs in, inte
   * en artikel. Den undantas här OCH i lib/artiklar.ts, som läser katalogen med
   * sin egen glob för sitemapen. Glider de två isär hamnar /artiklar/readme/ i
   * sitemapen utan att sidan finns, och sitemapGuard stoppar bygget.
   */
  loader: glob({ pattern: ['*.md', '!README.md'], base: './src/content/artiklar' }),
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
    /**
     * Artikelbilden, på kortet i listan och överst i artikeln.
     *
     * Själva FILEN står inte här. Den hittas på slug, precis som stadsfotona
     * hittas på kommunens slug i KommunKort.astro: heter filen
     * src/assets/artiklar/<samma namn som .md-filen>.jpg får artikeln bild.
     * Ingen sökväg att skriva av, inget att glömma uppdatera när en artikel
     * byter namn.
     *
     * Det som står här är det som inte går att läsa ur filen: vad bilden
     * visar och varifrån den kommer. Fälten ligger i ETT objekt, och det är
     * hela poängen: en bild utan alt-text är en trasig sida för den som läser
     * med skärmläsare, och ett fristående altfält är ett fält som glöms.
     * Ligger alt inuti bilden går den inte att utelämna utan att ta bort
     * bilden helt.
     *
     * Hela objektet är valfritt, eftersom bilderna läggs in en artikel i
     * taget och en artikel utan bild ska fungera och se hel ut. Men fil och
     * frontmatter måste följas åt åt BÅDA håll, och lib/artikelbilder.ts
     * stoppar bygget om de inte gör det: en fil utan alt-text får inte
     * publiceras, och en alt-text utan fil är en bild som tyst försvann.
     */
    image: z
      .object({
        /**
         * Vad bilden visar, för den som inte ser den. Beskriv motivet, inte
         * artikeln: rubriken står redan intill. Golvet finns för att "bild"
         * och "foto" är sämre än ingen alt alls.
         */
        alt: z.string().min(15).max(160),
        /** Var fotot är hämtat, till exempel Pexels. */
        source: z.string().min(2),
        /**
         * Fotografens namn, så som källan skriver det.
         *
         * Valfritt, och bara därför att det finns källor som inte kräver
         * attribution och bilder vars upphovsperson inte går att spåra i
         * efterhand. Går namnet att få tag på ska det stå här. Ett tomt fält
         * är ärligt, ett påhittat namn är en tillskrivning till fel person.
         */
        credit: z.string().min(2).optional(),
        /** Länk till fotot hos källan, när det finns en. */
        creditUrl: z.string().url().optional(),
      })
      .optional(),
  }),
});

export const collections = { artiklar };
