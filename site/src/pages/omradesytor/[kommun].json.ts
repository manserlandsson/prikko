import type { APIRoute } from 'astro';
import { municipalities } from '../../lib/db';
import { linkedAreas, municipalityArea } from '../../lib/omraden';

/**
 * Områdenas konturer, en fil per kommun, för kartans skuggning.
 *
 * ## Varför en egen fil och inte sidans HTML
 *
 * Kartan skuggar allt utanför ett valt område, se OMRÅDESSKUGGAN i
 * Karta.astro. Ytan behövs alltså bara när någon faktiskt väljer ett område,
 * och de flesta gör aldrig det. Stockholm har 51 länkade områden och deras
 * konturer väger tillsammans drygt hundra kilobyte; att lägga dem i varje
 * kartsidas HTML hade betalat den kostnaden för varenda besökare, varje gång.
 *
 * Filen hämtas därför på begäran, en gång per besök, och bara vid ett val.
 *
 * ## Geometrin är REDAN VÅR, och det är hela poängen
 *
 * Konturerna kommer ur `lib/omraden.ts`, alltså ur precis samma polygoner som
 * avgör vilka verksamheter som RÄKNAS till området. Det är inte en detalj utan
 * villkoret för att skuggningen ska vara sann: hade kartan skuggat efter en
 * kontur och listan räknat efter en annan, hade en verksamhet i springan
 * mellan dem synts i listan men legat i dimman, eller tvärtom. Det felet är
 * omöjligt att felsöka i efterhand och lätt att undvika här.
 *
 * Av samma skäl hämtas ingenting nytt ur Overpass för den här filen.
 * `pipeline/omraden.py` har redan hämtat ytorna, och en andra hämtning hade
 * gett en andra sanning om samma gräns.
 *
 * ## Både ytterringar och hål
 *
 * `Area` bär `outer` och `inner`, alltså flera ytterringar för ett område som
 * är delat i flera stycken, och hål för ytor med en annan yta inuti. Båda
 * bärs vidare. Ingen av dagens 64 länkade områden har mer än en ytterring
 * eller något hål, men `linkoping/Torvinge industriområde` har elva
 * ytterringar och skulle förlora tio av dem den dag den passerar tröskeln för
 * en egen sida. Ett format som tappar geometri tappar den tyst.
 *
 * ## Bara länkade områden
 *
 * Samma urval som områdessidorna, alltså de med minst 25 verksamheter. Ett
 * område utan sida går inte att välja i söket heller, så en kontur för det
 * hade varit vikt utan mottagare.
 *
 * ## Kommunen ligger i samma fil, under en nyckel utan snedstreck
 *
 * "Om man söker på jönköping, så är väl det hela staden, den ska väl skuggas in
 * som ett filter då." Kommunen är ett val precis som stadsdelen, och den ska
 * skugga på samma sätt. Konturen kommer ur `municipalityArea` i lib/omraden.ts,
 * alltså ur samma pipeline och samma `sources`-block som stadsdelarna.
 *
 * NYCKELN ÄR KOMMUNENS SLUG UTAN SNEDSTRECK, alltså `stockholm` där ett område
 * heter `stockholm/sodermalm`. Formen är vald för att kartan inte ska behöva
 * lära sig något nytt: den härleder kommunen ur nyckeln med
 * `nyckel.split('/')[0]`, vilket ger `stockholm` för båda formerna, och slår
 * upp ytan med `ytor[nyckel]`. Ett val av kommun och ett val av stadsdel kan
 * därmed ligga i samma urval och bli hål i samma mask.
 *
 * Kommunens kontur väger 2 till 36 kilobyte per kommun efter förenkling. Den
 * ligger i samma fil som områdena och inte i en egen, av samma skäl som
 * områdena delar fil: en hämtning per kommun, aldrig en per val.
 */
export const prerender = true;

export function getStaticPaths() {
  return municipalities()
    .filter((m) => linkedAreas(m.slug).length > 0 || municipalityArea(m.slug))
    .map((m) => ({ params: { kommun: m.slug } }));
}

export const GET: APIRoute = ({ params }) => {
  const kommun = params.kommun!;
  const ytor: Record<string, { namn: string; outer: number[][][]; inner: number[][][] }> = {};

  const hela = municipalityArea(kommun);
  if (hela) {
    ytor[kommun] = { namn: hela.name, outer: hela.outer, inner: hela.inner };
  }

  for (const skiva of linkedAreas(kommun)) {
    ytor[`${kommun}/${skiva.area.slug}`] = {
      namn: skiva.area.name,
      outer: skiva.area.outer,
      inner: skiva.area.inner,
    };
  }

  return new Response(JSON.stringify({ kommun, ytor }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      /*
       * En timme, inte för alltid. Adressen bär ingen hash över innehållet,
       * eftersom kartan måste kunna bilda den ur kommunens slug utan att veta
       * något om filens innehåll. Gränserna ändras dessutom sällan: de kommer
       * ur en Overpass-körning som görs manuellt och inte i nattjobbet.
       */
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
