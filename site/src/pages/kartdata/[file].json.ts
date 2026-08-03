import type { APIRoute } from 'astro';
import { MAP_DATA_CACHE_CONTROL, mapDatasets } from '../../lib/map-data';

/**
 * Kartans punkter, en fil per kommun, på en innehållsbaserad adress.
 *
 * Filnamnet är `<kommun>-<hash>.json`. Kommunen står först för att filerna ska
 * gå att läsa i en kataloglistning och i en nätverkspanel; hashen gör adressen
 * oföränderlig så att filen kan cachas för alltid. Se lib/map-data.ts.
 *
 * Rutten har bara de giltiga kombinationerna som statiska sökvägar. En
 * förfrågan på en gammal hash ger 404, vilket är rätt svar: filen med det
 * innehållet finns inte längre. Klienten har ingen reservadress att falla
 * tillbaka på, till skillnad från sökregistret, och behöver ingen — adressen
 * står i sidans HTML och hämtas i samma ögonblick som sidan lästes.
 */
export const prerender = true;

export function getStaticPaths() {
  return mapDatasets().map((d) => ({
    params: { file: `${d.municipality.slug}-${d.hash}` },
    props: { body: d.body },
  }));
}

export const GET: APIRoute = ({ props }) =>
  new Response(props.body as string, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': MAP_DATA_CACHE_CONTROL,
    },
  });
