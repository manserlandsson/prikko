import type { APIRoute } from 'astro';
import { tileSet } from '../../lib/kartrutor';

/**
 * Kommunens verksamheter som listan läser dem, en fil per kommun.
 *
 * ## Varför filen finns, alltså vad den löser
 *
 * Listan i den delade vyn drevs fram till 2026-08-27 av KAMERAN. Raderna
 * plockades ur de vektorrutor MapLibre råkat hämta, beskurna mot kartans
 * utsnitt, och det är också allt rutorna kan svara på: en ruta bär det man
 * tittar på och ingenting annat.
 *
 * Ägaren ville ha motsatsen, och han har rätt: listan ska svara på det man
 * VALT och inte på var kameran råkar stå. Ett urval kan spänna en kommun eller
 * hela landet, alltså kan det aldrig hämtas ur rutorna. Det behöver en egen
 * källa, och det är den här.
 *
 * ## Innehållet är rutornas egna egenskaper, tecken för tecken
 *
 * Varje rad är `[lng, lat, props]` där `props` är EXAKT det objekt rutan bär:
 * `i`, `v`, `m`, `nm` och de valfria `s`, `ty`, `c`, `dt`, `k`, `u`, `b`.
 * Kartans `franRuta()` läser därför en rad härifrån och en rad ur en ruta med
 * samma kod, oförändrad.
 *
 * DET ÄR INTE EN BEKVÄMLIGHET UTAN VILLKORET. `i` är radnumret som binder en
 * rad i listan till en nål på kartan, och den kopplingen är vår egen. Byggdes
 * den här filen ur en andra genomgång av beståndet kunde numreringen glida,
 * och då hade en rad pekat ut fel nål utan att något gick sönder synligt.
 * Punkterna kommer därför ur `tileSet().punkter`, alltså ur samma array som
 * rutorna byggdes av, i samma ordning.
 *
 * ## Kostnaden, uppmätt på beståndet
 *
 * Rå JSON och gzip -9 per kommun:
 *
 *     stockholm     8 520 rader    808 kB    265 kB
 *     linkoping     1 246 rader    130 kB     39 kB
 *     jonkoping     1 115 rader    103 kB     32 kB
 *     uppsala         986 rader    108 kB     29 kB
 *     karlstad        696 rader     62 kB     19 kB
 *     orebro          645 rader     57 kB     18 kB
 *     oskarshamn      238 rader     22 kB      7 kB
 *     kristinehamn    170 rader     15 kB      5 kB
 *
 * Hela riket är 1,24 MB rått. Ägaren 2026-08-27, efter att ha fått talet:
 * "ja betalr megabyten". Avvägningen är hans och den är gjord.
 *
 * ## En fil per kommun och inte en för riket
 *
 * Rikskartan behöver alla åtta och hämtar dem parallellt. En enda riksfil hade
 * varit en begäran i stället för åtta, men den hade också tvingat varje
 * KOMMUNKARTA att hämta hela landet för att visa sin egen kommun: Stockholm
 * hade betalat 1,24 MB för 808 kB. Med en fil per kommun betalar varje sida
 * för det den visar, och rikskartans åtta filer är dessutom samma filer som
 * kommunkartorna redan har i cachen.
 *
 * ## Bara kommuner med minst en punkt
 *
 * Samma urval som kartsidorna själva, alltså de åtta som lämnar koordinater.
 * Fyra kommuner lämnar ingen enda, och en tom fil för dem hade varit en
 * hämtning som aldrig kan ge en rad.
 */
export const prerender = true;

export function getStaticPaths() {
  const set = tileSet();
  return [...set.perKommun.keys()].map((kommun) => ({ params: { kommun } }));
}

export const GET: APIRoute = ({ params }) => {
  const set = tileSet();
  const kommun = params.kommun!;
  const m = set.keys.indexOf(kommun);

  const rader = set.punkter
    .filter((p) => p.props.m === m)
    /* Fem decimaler, alltså ungefär en meter. Samma avrundning som rutorna
       bär, och en decimal till hade lagt tiotusen tecken i filen för en
       precision ingen kan se. */
    .map((p) => [Math.round(p.lng * 1e5) / 1e5, Math.round(p.lat * 1e5) / 1e5, p.props]);

  return new Response(JSON.stringify({ id: kommun, rader }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      /* Adressen bär ingen hash över innehållet, alltså kan den inte cachas
         för alltid. Ett år hade betytt att en ändrad bedömning inte syntes i
         listan förrän någon tömde sin cache. Samma timme som områdesytorna. */
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
