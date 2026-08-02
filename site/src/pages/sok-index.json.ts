import type { APIRoute } from 'astro';
import {
  SEARCH_INDEX_BODY,
  SEARCH_INDEX_FALLBACK_CACHE_CONTROL,
} from '../lib/search-index';

/**
 * Sökregistret på sin gamla, föränderliga adress. Reserv, inte huvudväg.
 *
 * Huvudvägen är /sok-index/<hash>.json. Den här filen finns kvar för ett enda
 * fall: ett HTML-dokument som legat i besökarens cache sedan förra bygget
 * pekar på en hash som inte längre finns på servern. Utan reserv blir
 * sökningen då död i stället för inaktuell. Konsumenterna provar hit när den
 * hashade hämtningen svarar 404.
 *
 * Kort cachetid, av just det skäl som gjorde den gamla lösningen fel: den här
 * adressen byter innehåll utan att byta namn.
 */
export const prerender = true;

export const GET: APIRoute = () =>
  new Response(SEARCH_INDEX_BODY, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': SEARCH_INDEX_FALLBACK_CACHE_CONTROL,
    },
  });
