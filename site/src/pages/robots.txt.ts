import type { APIRoute } from 'astro';
import { SITE } from '../lib/site';

/**
 * robots.txt genereras dynamiskt så sitemap-URL:en aldrig kan bli inaktuell.
 *
 * ---------------------------------------------------------------------------
 * FILEN DU LÄSER ÄR INTE FILEN SOM LEVERERAS
 * ---------------------------------------------------------------------------
 * Cloudflare skjuter in sitt "Managed content"-block FÖRE det här innehållet.
 * Vad `curl https://prikko.se/robots.txt` faktiskt ger är alltså två
 * `User-agent: *`-grupper, Cloudflares och vår, plus en rad `Disallow`-grupper
 * per AI-robot som vi inte skrivit. Det är inte trasigt: RFC 9309 säger att
 * grupper med samma user-agent slås ihop, och våra `Disallow`-rader gäller.
 * Men den som läser den här filen ser inte hela sanningen, och den som ändrar
 * policy måste veta att omkopplaren sitter i Cloudflares gränssnitt.
 *
 * ---------------------------------------------------------------------------
 * OM AI-CRAWLERS
 * ---------------------------------------------------------------------------
 * Den här filen blockerar inga AI-crawlers, men det betyder inte att alla
 * släpps fram. Policyn bor i Cloudflare och inte här, och det är medvetet:
 * robots.txt är en artig förfrågan medan Cloudflare blockerar på nätverksnivå,
 * och två ställen som beskriver samma policy kommer att säga emot varandra.
 *
 * Beslutet är delat i två, eftersom det är två olika saker:
 *
 *   Hämtning för svar     SLÄPPS FRAM. Att bli citerad av ChatGPT,
 *                         Perplexity, AI Overviews och Claude är en uttalad
 *                         del av strategin (bibeln §6b). De hämtar, svarar
 *                         och länkar tillbaka. Bing måste vara tillåten
 *                         eftersom den driver ChatGPT:s webbsökning.
 *
 *   Träning               BLOCKERAS. Innehållet sugs då in i en modell som
 *                         svarar utan att nämna oss och utan att skicka
 *                         någon vidare. Det är inte citering, det är att ge
 *                         bort hela aggregatet.
 *
 * VARJE LEVERANTÖR HAR SKILDA ROBOTAR FÖR DE TVÅ SAKERNA, och det är därför
 * uppdelningen fungerar. Blockerad hos oss i dag står till vänster, den robot
 * som faktiskt hämtar för ett citat till höger, och den senare är fri:
 *
 *   GPTBot (träning)          →  OAI-SearchBot (index), ChatGPT-User (live)
 *   ClaudeBot (träning)       →  Claude-SearchBot (index), Claude-User (live)
 *   meta-externalagent        →  Meta-ExternalFetcher (live)
 *   Applebot-Extended         →  Applebot (Siri och Spotlight)
 *
 * PerplexityBot och Perplexity-User är inte blockerade alls, och ingen av dem
 * används för träning enligt Perplexitys egen dokumentation.
 *
 * UNDANTAGET, OCH DET ÄR VÄRT ATT FÖRSTÅ: `Google-Extended` är inte bara ett
 * träningstoken. Googles egen dokumentation säger att det styr BÅDE träning av
 * Gemini OCH "grounding" i Gemini Apps och Vertex AI, alltså precis den
 * hämtning i stunden som producerar ett citat. Det påverkar inte Google Search
 * eller AI Overviews, som körs på Googlebots index, men så länge
 * `Google-Extended` är blockerad kan Gemini inte citera oss. Det är det enda
 * stället där dagens blockering kostar synlighet i AI-svar.
 *
 * Omkopplaren sitter i Cloudflare, inte här: dash.cloudflare.com, zonen
 * prikko.se, AI Crawl Control, fliken robots.txt. Där finns den hanterade
 * regeln och per-robot-inställningarna, och där sätts även `Content-Signal`.
 * `ai-input` står i dag osagt, vilket enligt signalens egen definition varken
 * beviljar eller nekar hämtning för AI-svar. Vill vi säga uttryckligen ja till
 * citering lyder raden `search=yes,ai-input=yes,ai-train=no`.
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
