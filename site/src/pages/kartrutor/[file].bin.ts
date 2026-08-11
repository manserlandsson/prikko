import type { APIRoute } from 'astro';
import { TILES_CACHE_CONTROL, tileSet } from '../../lib/kartrutor';

/**
 * Kartans rutpyramid, hela riket i en fil, på en innehållsbaserad adress.
 *
 * Filnamnet är `punkter-<hash>.bin`. Hashen gör adressen oföränderlig så att
 * filen kan cachas för alltid, precis som kartdatan och sökregistret före den.
 * En förfrågan på en gammal hash ger 404, vilket är rätt svar: arkivet med det
 * innehållet finns inte längre.
 *
 * ## Räckviddsförfrågningar, och varför filen heter `.bin`
 *
 * Webbläsaren hämtar ALDRIG hela filen. Den läser huvudet och rotkatalogen med
 * en `Range`-begäran på de första 16 kB och sedan de fyra till nio rutor som
 * ligger i utsnittet, alltså tiotals kilobyte. Att arkivet är megabyte stort
 * kostar oss lagring, inte besökaren bandbredd.
 *
 * Det förutsätter att värden svarar `206 Partial Content`, och DET ÄR INTE
 * GRATIS PÅ CLOUDFLARE PAGES. Kanten besvarar `Range` ur sin cache. En fil som
 * inte ligger där blir DYNAMIC och strömmas rakt igenom med 200 och hela
 * kroppen, även när man bett om 128 byte, och då hittar PMTiles ingen ruta.
 *
 * Vad som avgör om filen hamnar i kanten är FILÄNDELSEN och inte
 * `Cache-Control`. Mätningen står i `lib/kartrutor.ts` vid adressen och i
 * `public/_headers`. `.pmtiles` står inte på Cloudflares lista, `.bin` gör det.
 * Ändelsen är alltså inte kosmetik: den är skälet till att kartan har punkter.
 *
 * `Cache-Control` nedan når dessutom inte fram av sig självt. Ett statiskt
 * Astro-bygge skriver bara KROPPEN av det här svaret till fil och kastar
 * huvudena, utan ett ord i byggloggen. Huvudena sätts därför i
 * `public/_headers`. Ändras adressen här måste regeln där följa med.
 *
 * Kontrollen, som måste köras mot den PUBLICERADE filen och inte mot ett
 * bygge, eftersom felet finns i värden och inte i filen:
 *
 *     node scripts/kontrollera-rackvidd.mjs
 */
export const prerender = true;

export function getStaticPaths() {
  const set = tileSet();
  return [{ params: { file: `punkter-${set.hash}` }, props: { body: set.body } }];
}

export const GET: APIRoute = ({ props }) =>
  new Response(props.body as Buffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Cache-Control': TILES_CACHE_CONTROL,
    },
  });
