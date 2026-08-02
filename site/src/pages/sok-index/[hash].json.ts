import type { APIRoute } from 'astro';
import {
  SEARCH_INDEX_BODY,
  SEARCH_INDEX_CACHE_CONTROL,
  SEARCH_INDEX_HASH,
} from '../../lib/search-index';

/**
 * Sökregistret på en innehållsbaserad adress.
 *
 * Registret låg tidigare i ett <script type="application/json"> mitt i
 * söksidan. Det gjorde /sok till ett 2,4 MB HTML-dokument som måste laddas
 * ner i sin helhet innan sidan ens ritades, och laddas ner igen vid varje
 * besök, eftersom HTML sällan cachas länge. Som egen fil hämtas den efter
 * att sidan ritats, ligger kvar i webbläsarens cache och komprimeras av
 * servern som vilken statisk resurs som helst.
 *
 * Hashen i filnamnet är det som gör den långa cachetiden ofarlig. Se
 * lib/search-index.ts för resonemanget. Rutten har bara en giltig parameter,
 * nämligen hashen på den data bygget faktiskt innehåller. En förfrågan på en
 * gammal hash finns inte som fil och ger 404, vilket är rätt: filen med det
 * innehållet existerar inte längre.
 *
 * När beståndet växer nationellt byts den här filen mot ett serveranrop.
 * Formatet utåt får då se likadant ut.
 */
export const prerender = true;

export function getStaticPaths() {
  return [{ params: { hash: SEARCH_INDEX_HASH } }];
}

export const GET: APIRoute = () =>
  new Response(SEARCH_INDEX_BODY, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': SEARCH_INDEX_CACHE_CONTROL,
    },
  });
