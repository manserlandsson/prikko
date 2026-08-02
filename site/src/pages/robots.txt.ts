import type { APIRoute } from 'astro';
import { SITE } from '../lib/site';

/**
 * robots.txt genereras dynamiskt så sitemap-URL:en aldrig kan bli inaktuell.
 *
 * Vi blockerar INGA AI-crawlers: att bli citerad av ChatGPT/Perplexity/AI
 * Overviews är en uttalad del av strategin (bibeln §6b). Bing måste vara
 * tillåten — den driver ChatGPT:s webbsökning.
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
