import type { APIRoute } from 'astro';
import { kommunDokument } from '../../../../lib/api';
import { municipalities, municipality } from '../../../../lib/data';

/**
 * `/api/v1/kommun/<kommun>.json`, kommunens NULÄGE med en rad per verksamhet.
 *
 * ## Vad filen är, och vad den med flit inte är
 *
 * Den bär samma mängd som kommunens egen listsida: varje verksamhet vi har,
 * med senaste kontrollens datum och utfall, bedömningen, koordinaten och två
 * länkar. Den bär INTE historiken. En kommunfil med historik hade varit hela
 * beståndet i tretton hämtningar, alltså den massnedladdning `lib/api.ts`
 * avsnitt 3 förklarar varför vi inte publicerar.
 *
 * Den som vill ha en verksamhets historik följer `api`-länken på raden. Det
 * är en förfrågan per verksamhet, och det är hela skillnaden.
 *
 * ## Verksamheter utan bedömning står med
 *
 * 1 574 av 17 066 verksamheter saknar bedömning, antingen för att kommunen
 * inte registrerat någon kontroll eller för att den senaste är äldre än fem
 * år. De ligger i filen med `verdict: null` och ett `reason` som säger
 * vilket. Att tysta bort dem hade fått täckningen att se bättre ut än den är,
 * och kommunens egen listsida visar dem också.
 *
 * ## Huvudena sätts i `public/_headers`
 *
 * Se regeln för `/api/v1/*` där, och skälet i filens huvud: ett `Response`
 * i ett statiskt bygge lämnar bara sin kropp efter sig.
 */
export const prerender = true;

export function getStaticPaths() {
  return municipalities().map((m) => ({ params: { kommun: m.slug } }));
}

export const GET: APIRoute = ({ params }) => {
  const m = municipality(params.kommun!)!;
  return new Response(`${JSON.stringify(kommunDokument(m), null, 1)}\n`, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
