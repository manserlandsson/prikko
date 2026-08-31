import type { APIRoute } from 'astro';
import { PER_VERKSAMHET, verksamhetDokument } from '../../../../../lib/api';
import { establishments, findEstablishment } from '../../../../../lib/data';

/**
 * `/api/v1/verksamhet/<kommun>/<slug>.json`, alltså API:ets kärna.
 *
 * ===========================================================================
 * RUTTEN ÄR AVSTÄNGD I DAG, OCH FLAGGAN STÅR I lib/api.ts
 * ===========================================================================
 *
 * `PER_VERKSAMHET` är `false`, alltså returnerar `getStaticPaths()` en tom
 * lista och rutten skriver noll filer. HELA skälet, villkoret för att slå på
 * den och den bestämda adressen står vid konstanten i `lib/api.ts`. Läs den
 * innan du rör något här.
 *
 * Kort, för den som bara vill veta talet: rutten kostar **17 066 filer**, en
 * per verksamhet, och kontot ligger kvar på gratisplanen vars tak är 20 000.
 * Slå på den samma dag `docs/46_filtaket.md` §6 steg ett är gjort.
 *
 * Filen står kvar som kod och inte som en bortkommenterad hög eller en gren
 * vid sidan om, med flit. Den byggs vid varje körning, typkontrolleras vid
 * varje körning och importerar `verksamhetDokument()` som redan är verifierad
 * mot beståndet. En gren hade ruttnat i tysthet; en flagga kan inte.
 *
 * ===========================================================================
 * ADRESSEN ÄR SIDANS ADRESS MED TVÅ TILLÄGG
 * ===========================================================================
 *
 *     /stockholm/vesuvio/
 *     /api/v1/verksamhet/stockholm/vesuvio.json
 *
 * Prefixet och ändelsen, ingenting annat. Den som redan har en länk till en
 * verksamhetssida kan alltså räkna fram dokumentet utan att slå upp något,
 * och `ADR 0003` gör slugen permanent, så de två följs åt.
 *
 * ===========================================================================
 * ALTERNATIVET, OM FILTAKET BLIR BINDANDE ÄVEN EFTER UPPGRADERINGEN
 * ===========================================================================
 *
 * `site/functions/api/` finns redan och kör två Pages Functions. Samma svar
 * går att sätta ihop där vid begäran och kostar då noll filer i bygget. Det
 * är inte byggt, eftersom beställningen sa statiska filer och ingen server,
 * men vägen är öppen och den kräver ingen adressändring. Se docs/55 §5.2.
 *
 * ===========================================================================
 * HUVUDENA SÄTTS I public/_headers
 * ===========================================================================
 *
 * Se regeln för `/api/v1/*` där. Ett `Response`-huvud i ett statiskt bygge
 * lämnar bara sin kropp efter sig.
 */
export const prerender = true;

export function getStaticPaths() {
  if (!PER_VERKSAMHET) return [];

  return establishments().map((e) => ({
    params: { kommun: e.municipality.slug, slug: e.slug },
  }));
}

export const GET: APIRoute = ({ params }) => {
  const e = findEstablishment(params.kommun!, params.slug!)!;
  return new Response(`${JSON.stringify(verksamhetDokument(e), null, 1)}\n`, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
