import type { APIRoute } from 'astro';
import { gator, kommunerMedGator, TROSKEL } from '../../lib/gatunamn';

/**
 * Kommunens gator, en fil per kommun, för kartans sökfält.
 *
 * ## Varför en egen fil och inte sidans HTML
 *
 * Samma skäl som områdeskonturerna och kartlistan, och det är inte en vana
 * utan samma räkning: uppgiften behövs bara för den som faktiskt skriver i
 * sökfältet, och de flesta gör aldrig det. Stockholms gator väger 46 kB
 * gzippat. I sidans HTML hade varenda besökare betalat dem, varje gång.
 *
 * Uppmätt på beståndet 2026-08-27, rå JSON och gzip -9:
 *
 *     stockholm     1 070 gator    130,7 kB    45,8 kB
 *     linkoping       211 gator     22,4 kB     7,5 kB
 *     jonkoping       170 gator     17,2 kB     6,0 kB
 *     uppsala         157 gator     18,2 kB     6,0 kB
 *     orebro          109 gator     12,1 kB     3,8 kB
 *     oskarshamn       40 gator      4,0 kB     1,4 kB
 *     kristinehamn     15 gator      1,6 kB     0,6 kB
 *
 * Hela riket är 206 kB rått och 71 kB gzippat, och rikskartan hämtar de sju
 * parallellt precis som den redan hämtar sju kartlistor. Kommunkartan hämtar
 * bara sin egen. Talet ska ställas mot kartlistan bredvid, som väger 265 kB
 * gzippat bara för Stockholm; gatorna är en sjättedel av en fil sidan redan
 * hämtar.
 *
 * Radnumren är två tredjedelar av vikten. De kan pressas: samma tal
 * delta-kodade i bas 36 ger 34 kB för Stockholm i stället för 46. Det är
 * INTE gjort, för filen kopplas in av någon annan och en kodning kräver en
 * avkodare som måste beskrivas rätt. Elva kilobyte är fel pris att betala
 * med en gissning i en annan fil.
 *
 * ## FORMEN, som kartan ska kunna koppla in utan att gissa
 *
 *     {
 *       "kommun": "stockholm",
 *       "troskel": 2,
 *       "gator": [
 *         { "n": "Kungsgatan", "s": "kungsgatan",
 *           "b": [18.0567, 59.3312, 18.0701, 59.3388],
 *           "p": [12, 88, 401, 1523] }
 *       ]
 *     }
 *
 *   n  Gatans namn i den skrivning som ska VISAS. Ingen annan skrivning
 *      finns; de 217 gator som stavas på två sätt är redan ihopslagna.
 *   s  Gatans slug. NYCKELN ÄR `gata/<kommun>/<s>`, alltså TRE led där ett
 *      områdes nyckel har två. Formen är vald för att `Hötorget` ska kunna
 *      vara både en gata och ett område utan att de två chippen blir ett,
 *      och `nyckel.split('/')[0] === 'gata'` är hela typprovet.
 *   b  [väst, syd, öst, nord], fyra decimaler. Punkternas låda. En gata har
 *      ingen polygon och SKUGGAR ALDRIG; den flyger hit och filtrerar.
 *   p  Radnumren i /kartlista/<kommun>.json, stigande. Samma `i` som
 *      vektorrutorna bär, alltså samma tal `omradesSvar` i Karta.astro redan
 *      nycklar sin cache på. Antalet verksamheter är `p.length`.
 *
 * Gatorna ligger STÖRST FÖRST, så att ett sökfält som rangordnar på antal
 * kan läsa filen i den ordning den står.
 *
 * ## Varför radnummer och inte gatunamnet på varje rad
 *
 * Kartlistans rader bär `i`, `v`, `m`, `nm` och några valfria fält, se `props`
 * i lib/kartrutor.ts, OCH INGEN ADRESS. Klienten kan alltså inte härleda
 * gatan ur en rad, och ett namnfilter hade behövt en gatunyckel i `props`.
 * Radnumren är ungefär två tredjedelar av filen och är priset för att kartans
 * egna filer inte behöver ändras. Se lib/gatunamn.ts.
 *
 * ## Bara kommuner som har gator
 *
 * Sju av tolv. Fem lämnar ingen enda, och en tom fil för dem hade varit en
 * hämtning som aldrig kan ge en rad. Skälen är värda att stå här, för ett av
 * dem är vårt och de andra är källornas:
 *
 *     karlstad   VÅRT. Adressen hämtas sedan 2026-08-25 ur ett avställt
 *                kartlager, se sources/karlstad.py, men den incheckade
 *                ögonblicksbilden är äldre än den ändringen och bär noll
 *                adresser på 696 rader. Kommunen får sina gator av sig själv
 *                vid nästa nattkörning: en färsk hämtning 2026-08-27 gav 514
 *                adresser, 244 gator och 93 över tröskeln. Ingen rad här
 *                behöver ändras för det.
 *     lomma      Publicerar ingen adress alls, kontrollerat mot alla fyra
 *                listsidor på nytt 2026-08-27. Lämnar heller inga
 *                koordinater, alltså finns kommunen inte på kartan.
 *     borgholm   Alla tre skriver ORTEN i adressfältet: `Räpplinge`,
 *     hoganas    `Viken`, `Kalv`. En ort är ingen gata. De lämnar dessutom
 *     svenljunga inga koordinater, så de har varken kartlista eller nålar att
 *                filtrera, och en gata utan punkter kan varken flyga eller
 *                markera.
 */
export const prerender = true;

export function getStaticPaths() {
  return kommunerMedGator().map((kommun) => ({ params: { kommun } }));
}

export const GET: APIRoute = ({ params }) => {
  const kommun = params.kommun!;
  const rader = gator(kommun).map((g) => ({
    n: g.namn,
    s: g.slug,
    b: g.bbox,
    p: g.punkter,
  }));

  return new Response(JSON.stringify({ kommun, troskel: TROSKEL, gator: rader }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      /* Adressen bär ingen hash över innehållet, alltså kan den inte cachas
         för alltid: radnumren flyttar sig så snart beståndet ändras, och en
         gammal fil hade pekat ut fel nålar. Samma timme som kartlistan och
         områdesytorna. */
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
