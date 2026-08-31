import type { APIRoute } from 'astro';
import { apiIndex } from '../../../lib/api';

/**
 * `/api/v1/index.json`, en enda hämtning som svarar på vad som finns och var.
 *
 * ## Varför indexet är en egen fil och inte bara text på /api/
 *
 * Den som skriver en klient läser inte vår dokumentationssida, den hämtar en
 * fil och tittar. Indexet bär därför adressmallarna (`endpoints`), kodlistan
 * i klartext (`codes`), täckningen och varje kommuns egen källa med
 * hämtdatum. En klient som har den här filen kan nå allt annat utan att gissa
 * en enda adress.
 *
 * ## Varför den ligger på `index.json` och inte på `/api/v1/`
 *
 * `/api/v1/` utan filnamn hade blivit en katalog i det statiska bygget, och
 * en katalog svarar med `index.html` som inte finns här. Ändelsen är
 * dessutom vad `public/_headers` matchar på; se regeln för `/api/v1/*` där.
 *
 * ## Huvudena sätts INTE här
 *
 * `Content-Type` och `Cache-Control` nedan kastas i ett statiskt bygge, och
 * det är precis felet `public/_headers` beskriver i sitt huvud: bara KROPPEN
 * skrivs till fil. Raderna står kvar som avsiktsförklaring, exakt som
 * `sok-index/[hash].json.ts` gör, och det som faktiskt gäller står i
 * `_headers`. CORS finns bara där, och utan den regeln är hela API:et
 * oanvändbart från en webbläsare.
 */
export const prerender = true;

export const GET: APIRoute = () =>
  new Response(`${JSON.stringify(apiIndex(), null, 1)}\n`, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
