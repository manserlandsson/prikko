import type { APIRoute } from 'astro';
import { swedenOutline, swedenSource } from '../../lib/riket';

/**
 * Sveriges kontur, för rikskartans skugga.
 *
 * ## Varför den ligger här och inte i kommunfilerna
 *
 * `[kommun].json.ts` bredvid serverar en fil PER KOMMUN, och Sveriges kontur
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
 * `inner` är tom i dag. Fältet bärs ändå, eftersom en kontur utan hål och en
 * kontur som TAPPAT sina hål ser likadana ut i ett format som utelämnar det.
 *
 * ## Skuggan ska vara svagare än ett områdesval
 *
 * Ett förslag till kartsidan, som äger talen och sätter dem: områdesskuggan
 * använder Boolis fyllning #878787 vid opacitet 0,6. Landsskuggan säger något
 * mycket svagare än ett val. "Du har valt bort det här" mot "här slutar vårt
 * bestånd", och den andra meningen ska inte skrika. Samma fyllning vid
 * opacitet 0,25 till 0,3 och INGEN kontur: en linje längs gränsen läser som en
 * ritad landsgräns, och den är inte metersann nog att påstå var gränsen går.
 *
 * Konturen är förenklad med 600 meters tolerans och får aldrig filtrera, bara
 * skugga. Se lib/riket.ts.
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
