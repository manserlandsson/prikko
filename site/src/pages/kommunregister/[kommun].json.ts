import type { APIRoute } from 'astro';
import { municipalities } from '../../lib/data';
import { kommunregister } from '../../lib/kommunregister';

/**
 * Kommunens hela register som kommunsidans filter läser det.
 *
 * Varför filen finns, och varför den inte är /kartlista/, står i huvudet på
 * lib/kommunregister.ts.
 *
 * EN FIL OCH INTE EN SIDA. Adressen slutar på .json, bär ingen HTML och
 * räknas därför varken av sitemapen, av noindex-grinden eller av länkgrinden,
 * som bara prövar rotrelativa sökvägar med snedstreck. Filtret skapar alltså
 * inga nya indexerbara adresser, och det skriver heller aldrig något i
 * adressfältet. Femton filer mot Pages tak på 20 000.
 *
 * Filen hämtas först när besökaren rör filtret, aldrig vid sidladdning. Se
 * Registerfilter.astro för vad det kostar.
 */
export const prerender = true;

export function getStaticPaths() {
  return municipalities().map((m) => ({ params: { kommun: m.slug } }));
}

export const GET: APIRoute = ({ params }) => {
  return new Response(JSON.stringify(kommunregister(params.kommun!)), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      /* Samma timme som kartlistan, av samma skäl: adressen bär ingen hash,
         och en ändrad bedömning ska synas utan att någon tömmer sin cache. */
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
