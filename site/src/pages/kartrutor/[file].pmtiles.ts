import type { APIRoute } from 'astro';
import { TILES_CACHE_CONTROL, tileSet } from '../../lib/kartrutor';

/**
 * Kartans rutpyramid, hela riket i en fil, på en innehållsbaserad adress.
 *
 * Filnamnet är `punkter-<hash>.pmtiles`. Hashen gör adressen oföränderlig så
 * att filen kan cachas för alltid, precis som kartdatan och sökregistret före
 * den. En förfrågan på en gammal hash ger 404, vilket är rätt svar: arkivet med
 * det innehållet finns inte längre.
 *
 * ## Räckviddsförfrågningar
 *
 * Webbläsaren hämtar ALDRIG hela filen. Den läser huvudet och rotkatalogen med
 * en `Range`-begäran på de första 16 kB och sedan de fyra till nio rutor som
 * ligger i utsnittet, alltså tiotals kilobyte. Att arkivet är megabyte stort
 * kostar oss lagring, inte besökaren bandbredd.
 *
 * Det förutsätter att värden svarar `206 Partial Content`. Cloudflare Pages gör
 * det för statiska filer. Kontrollen är:
 *
 *     curl -sI -H 'Range: bytes=0-127' https://prikko.se/kartrutor/punkter-<hash>.pmtiles
 *
 * Läsaren felar dessutom av sig själv om servern skickar hela filen på en
 * räckviddsbegäran, så felet kan inte passera obemärkt.
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
