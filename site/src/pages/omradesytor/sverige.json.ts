import type { APIRoute } from 'astro';
import { swedenOutline, swedenSource } from '../../lib/riket';

/**
 * Sveriges sjögräns, för rikskartans skugga.
 *
 * ## Varför den ligger här och inte i kommunfilerna
 *
 * `[kommun].json.ts` bredvid serverar en fil PER KOMMUN, och Sveriges gräns
 * hör inte till någon av dem. Den ligger därför på en egen adress, men i exakt
 * samma hölje: ett `ytor`-objekt med nycklar. Kartan kan alltså läsa den med
 * samma tre rader som läser en kommunfil, och en Sverigeskugga och ett
 * områdesval kan bli hål i samma mask utan att någon kod behöver veta vilket
 * som är vilket.
 *
 * ## Nyckeln
 *
 *     /omradesytor/sverige.json
 *     { "id": "sverige",
 *       "sources": { "osm": { name, licence, attribution, fetchedAt } },
 *       "ytor": { "sverige": { "namn": "Sverige", "outer": [...], "inner": [] } } }
 *
 * Nyckeln är `sverige`, alltså utan snedstreck, precis som kommunens egen yta
 * heter `stockholm` i sin fil medan ett område heter `stockholm/sodermalm`.
 * `nyckel.split('/')[0]` ger `sverige` och `/omradesytor/sverige.json` är den
 * adress kartans `hamtaYtor` redan bildar ur den strängen. Ingen ny hämtväg
 * behövs alltså, bara ett anrop till den som finns.
 *
 * `outer` är TVÅ ringar, fastlandets sjögräns och Gotlands. Båda blir hål i
 * samma världspolygon, se maskAv i Karta.astro.
 *
 * `inner` är tom i dag. Fältet bärs ändå, eftersom en yta utan hål och en yta
 * som TAPPAT sina hål ser likadana ut i ett format som utelämnar det.
 *
 * ## Talen bor i kartan och är Boolis
 *
 * Kartsidan äger dem och sätter dem, se LANDSSKUGGAN i Karta.astro. Kort:
 * fyllning #878787 vid opacitet 0,6, alltså Boolis egna tal uppmätta i deras
 * levande stil 2026-08-27, och INGEN kontur. En ritad linje längs sjögränsen
 * läser som en påstådd landsgräns, och den går ute i vattnet.
 *
 * Här stod ett förslag på 0,25 till 0,3, byggt på tanken att en landsskugga
 * ska säga mindre än ett områdesval. Mätningen av förlagan fällde det:
 * Booli har ETT masklager och byter bara dess data, alltså är deras
 * landsskugga och deras områdesskugga samma tal.
 */
export const prerender = true;

export const GET: APIRoute = () => {
  const sverige = swedenOutline();

  return new Response(
    JSON.stringify({
      id: sverige.slug,
      sources: { osm: swedenSource() },
      ytor: {
        [sverige.slug]: {
          namn: sverige.name,
          outer: sverige.outer,
          inner: sverige.inner,
        },
      },
    }),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        /* En timme, som kommunernas. Adressen bär ingen hash över innehållet,
           och gränsen ändras i praktiken aldrig. */
        'Cache-Control': 'public, max-age=3600',
      },
    },
  );
};
