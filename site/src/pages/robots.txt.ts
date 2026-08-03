import type { APIRoute } from 'astro';
import { SITE } from '../lib/site';

/**
 * robots.txt genereras dynamiskt så sitemap-URL:en aldrig kan bli inaktuell.
 *
 * ---------------------------------------------------------------------------
 * OM AI-CRAWLERS
 * ---------------------------------------------------------------------------
 * Den här filen blockerar inga AI-crawlers, men det betyder inte att alla
 * släpps fram. Policyn bor i Cloudflare och inte här, och det är medvetet.
 *
 * Skälet är att robots.txt är en artig förfrågan medan Cloudflare blockerar
 * på nätverksnivå. Den som struntar i en Disallow-rad hindras ändå. Att
 * dessutom skriva reglerna här hade gett två ställen som kan säga emot
 * varandra, och den som läser den ena skulle tro att den är hela sanningen.
 *
 * Beslutet är delat i två, eftersom det är två olika saker:
 *
 *   Sökning och agenter    SLÄPPS FRAM. Att bli citerad av ChatGPT,
 *                          Perplexity och AI Overviews är en uttalad del av
 *                          strategin (bibeln §6b). De hämtar, svarar och
 *                          länkar tillbaka. Bing måste vara tillåten
 *                          eftersom den driver ChatGPT:s webbsökning.
 *
 *   Träning                BLOCKERAS. Innehållet sugs då in i en modell som
 *                          svarar utan att nämna oss och utan att skicka
 *                          någon vidare. Det är inte citering, det är att
 *                          ge bort hela aggregatet.
 *
 * Google-Extended styr träning och är skild från Googlebot, så blockeringen
 * påverkar inte indexering eller ranking.
 */
export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /

# Interna sök- och förhandsvisningsvyer ska inte indexeras.
# Båda formerna av frågesträngen: sökvägsmatchningen är prefixbaserad, och
# /sok/?q= börjar inte med /sok? . Sedan länkarna fick avslutande snedstreck
# är det den andra raden som gör jobbet, men den första måste stå kvar för
# alla länkar som redan finns ute.
Disallow: /sok?
Disallow: /sok/?
Disallow: /preview/

Sitemap: ${SITE.url}/sitemap-index.xml
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
