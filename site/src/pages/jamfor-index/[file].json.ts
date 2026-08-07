import type { APIRoute } from 'astro';
import { JAMFOR_CACHE_CONTROL, JAMFOR_SHARDS, jamforShard } from '../../lib/jamfor';

/**
 * Jämförelseregistret, en fil per kommun på en innehållsbaserad adress.
 *
 * Samma grepp som /sok-index/[hash].json: hashen i filnamnet räknas på den
 * byte-sekvens som skickas ut, så adressen byts i samma stund datan byts och
 * filen kan cachas för alltid. En förfrågan på en gammal hash finns inte som
 * fil och ger 404, vilket är rätt svar: filen med det innehållet finns inte
 * längre.
 *
 * Ingen reservadress, till skillnad från sökregistret. Sökningen ligger i
 * sidhuvudet på varje sida och måste överleva ett dokument som legat i cachen
 * sedan förra bygget. Jämförelsesidan hämtar sin adress ur den sida som just
 * laddats, så en gammal hash kan inte nå hit.
 *
 * Filen per kommun är inte en optimering. Se lib/jamfor.ts: kommungränsen är
 * regeln som gör jämförelsen ärlig, och den bärs av att registret är delat på
 * just den gränsen.
 */
export const prerender = true;

export function getStaticPaths() {
  return JAMFOR_SHARDS.map((s) => ({ params: { file: s.file } }));
}

export const GET: APIRoute = ({ params }) => {
  const shard = jamforShard(params.file!);
  if (!shard) return new Response('Not found', { status: 404 });

  return new Response(shard.body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': JAMFOR_CACHE_CONTROL,
    },
  });
};
