/**
 * GET /dela/<sidans sökväg>.png. Sidans delningsbild, ritad vid begäran.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR RUTTEN FINNS
 * ---------------------------------------------------------------------------
 * 16 742 av 16 767 byggda sidor bar samma `og-default.png`, mätt i site/dist
 * 2026-09-05. En bild per sida vid bygget hade varit 17 868 nya filer ovanpå
 * de 18 171 utgåvan redan har, alltså 36 039 mot gratisplanens tak på 20 000.
 * Det ryms inte, och det gör det inte som SVG heller: taket räknar filer.
 *
 * Alltså ritas bilden här, av samma skäl och med samma apparat som
 * `functions/api/marke.ts` bygger dekalen i stället för att checka in 34 386
 * filer. Ritverket, kortet och PNG-skrivaren står i `src/lib/delningsbild.ts`
 * och beslutet om vad kortet får bära står i huvudet på den filen.
 *
 * ---------------------------------------------------------------------------
 * INGEN TEXT KOMMER FRÅN ANROPET
 * ---------------------------------------------------------------------------
 * Anropet bär en SÖKVÄG och ingenting annat. Varje ord som hamnar på bilden
 * läses ur den sidan i vårt eget bygge: namnet och adressen ur sidans JSON-LD,
 * datumet ur dess `last-modified`, titeln och beskrivningen ur dess metataggar.
 *
 * Regeln är marke.ts egen och gäller här av samma skäl. Kunde texten skickas
 * in hade vem som helst kunnat beställa ett kort med vilket företagsnamn och
 * vilket påstående som helst på, och den bilden hade burit vårt ordmärke.
 * Sidan är sanningen: finns sidan finns kortet, och kortet kan aldrig säga
 * något annat än sidan gör.
 *
 * ---------------------------------------------------------------------------
 * VAD SOM HÄNDER NÄR NÅGOT GÅR FEL
 * ---------------------------------------------------------------------------
 * Rutten svarar aldrig med ett fel. Varje väg ut som inte är en färdig bild
 * leder till en omdirigering till `/og-default.png`, alltså till exakt det
 * läge sajten hade innan rutten fanns.
 *
 * Det är inte artighet, det är riskhantering: taggen står nu på 17 868 sidor,
 * och en trasig rutt utan reservväg hade tagit bort förhandsvisningen från
 * hela sajten i stället för att bara låta bli att förbättra den.
 */
import {
  BREDD,
  HOJD,
  kortFranHtml,
  png,
  rita,
  type Underlag,
} from '../../src/lib/delningsbild';

interface Env {
  /** Pages statiska filer. Finns i drift, saknas i vissa lokala körningar. */
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}

interface Context {
  request: Request;
  env: Env;
  params: { vag?: string | string[] };
  waitUntil?: (p: Promise<unknown>) => void;
}

/* -------------------------------------------------------------------------- */
/* Takregel                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Samma enkla takregel som ratta.ts och marke.ts, med samma ärliga förbehåll:
 * minnet lever i ett isolat och Cloudflare kör många isolat, alltså stoppar
 * den en enskild skriptkörning och är ingen global garanti.
 *
 * Talet är högre än de andra två rutternas fem och trettio, och det är räknat:
 * en enda inläggsvägg kan be om trettio förhandsvisningar samtidigt, och
 * Slack hämtar varje länk i en tråd. 120 i minuten är rundligt för det och
 * långt under gratisplanens 100 000 anrop om dygnet.
 */
const FONSTER_MS = 60_000;
const MAX_PER_FONSTER = 120;
const MAX_NYCKLAR = 5_000;
const senaste = new Map<string, number[]>();

function overTak(nyckel: string, nu: number): boolean {
  const traffar = (senaste.get(nyckel) ?? []).filter((t) => nu - t < FONSTER_MS);
  traffar.push(nu);
  if (senaste.size > MAX_NYCKLAR) senaste.clear();
  senaste.set(nyckel, traffar);
  return traffar.length > MAX_PER_FONSTER;
}

/* -------------------------------------------------------------------------- */
/* Hämtning ur vårt eget bygge                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Hämtar en fil ur den statiska utgåvan.
 *
 * `env.ASSETS` är Pages egen bindning och går direkt, utan att lämna kanten.
 * Saknas den, vilket händer i vissa lokala körningar, faller vi tillbaka på
 * ett vanligt anrop mot samma ursprung. Adressen byggs alltid ur
 * `request.url` och aldrig ur något som kommit in i anropet, så rutten kan
 * inte fås att hämta från någon annan värd.
 */
async function fil(ctx: Context, vag: string): Promise<Response> {
  const url = new URL(vag, new URL(ctx.request.url).origin);
  const req = new Request(url.href, { headers: { Accept: '*/*' } });
  return ctx.env.ASSETS ? ctx.env.ASSETS.fetch(req) : fetch(req);
}

/**
 * Underlaget, sparat i isolatet efter första hämtningen.
 *
 * Filen är 92 kB och tolkas en gång per isolat. Utan cachen hade varje bild
 * kostat en hämtning och en JSON-tolkning till, och tolkningen är den enda
 * post i hela rutten som är dyr utan att rita något.
 */
let underlag: Underlag | null = null;

async function hamtaUnderlag(ctx: Context): Promise<Underlag> {
  if (underlag) return underlag;
  const svar = await fil(ctx, '/delningsbild/underlag.json');
  if (!svar.ok) throw new Error(`Underlaget svarade ${svar.status}.`);
  underlag = (await svar.json()) as Underlag;
  return underlag;
}

/**
 * Läser sidans huvud utan att läsa hela sidan.
 *
 * En verksamhetssida väger 120 till 300 kB och allt vi behöver ligger i de
 * första tjugotusen tecknen. Strömmen avbryts så fort `</head>` passerat,
 * alltså läses aldrig kontrollhistoriken, kartan eller sidfoten.
 */
async function huvud(svar: Response): Promise<string> {
  const lasare = svar.body?.getReader();
  if (!lasare) return '';
  const avkodare = new TextDecoder();
  let text = '';
  try {
    for (;;) {
      const { done, value } = await lasare.read();
      if (done) break;
      text += avkodare.decode(value, { stream: true });
      if (text.includes('</head>') || text.length > 200_000) break;
    }
  } finally {
    void lasare.cancel();
  }
  return text;
}

/* -------------------------------------------------------------------------- */
/* Sökvägen                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * `/dela/stockholm/ag.png` blir sidan `/stockholm/ag/`, och `/dela/start.png`
 * blir startsidan.
 *
 * Formen kontrolleras hårt innan den används till någonting, och det är inte
 * paranoia: värdet går in i en URL som funktionen sedan hämtar från sitt eget
 * ursprung. Slugarna i pipelinen är gemener, siffror och bindestreck och inget
 * annat, mätt över samtliga 17 146, så mönstret nedan kostar oss ingen sida.
 */
const SEGMENT = /^[a-z0-9-]{1,140}$/;

function sidvag(vag: string | string[] | undefined): string | null {
  const delar = (Array.isArray(vag) ? vag : vag ? [vag] : []).slice();
  if (!delar.length) return null;

  const sista = delar[delar.length - 1];
  if (!sista.endsWith('.png')) return null;
  delar[delar.length - 1] = sista.slice(0, -4);

  if (delar.length > 6) return null;
  if (!delar.every((d) => SEGMENT.test(d))) return null;

  if (delar.length === 1 && delar[0] === 'start') return '/';
  return `/${delar.join('/')}/`;
}

/* -------------------------------------------------------------------------- */
/* Handlaren                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Vägen ut: standardbilden, och den får ALDRIG cachas.
 *
 * `Response.redirect()` sätter inga huvuden, och en hämtare som fick den
 * tomma omdirigeringen hade kunnat behålla den. Då blir en tillfällig
 * takträff eller ett bygge mellan två utgåvor permanent för just den sidan,
 * och sidan står med standardbilden tills någon råkar tvinga en omhämtning.
 * `no-store` gör felet lika kortvarigt som orsaken.
 */
function tillbaka(ctx: Context): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL('/og-default.png', new URL(ctx.request.url).origin).href,
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestGet(ctx: Context): Promise<Response> {
  const { request } = ctx;

  const ip = request.headers.get('CF-Connecting-IP') ?? 'okänd';
  if (overTak(ip, Date.now())) return tillbaka(ctx);

  const vag = sidvag(ctx.params.vag);
  if (!vag) return tillbaka(ctx);

  /*
   * Kanten först.
   *
   * Ett svar som en funktion har byggt läggs inte i Cloudflares cache av sig
   * själv, det måste läggas dit. Utan raderna här hade varje omhämtning från
   * Facebook, Slack, LinkedIn och iMessage kostat en full ritning, och
   * gratisplanen ger 10 ms processortid per anrop. Med dem betalar den första
   * begäran och resten går på kanten.
   */
  const cache = (caches as unknown as { default?: Cache }).default;
  const nyckel = new Request(new URL(request.url).href, { method: 'GET' });
  if (cache) {
    const traff = await cache.match(nyckel);
    if (traff) return traff;
  }

  try {
    /*
     * Sidan hämtas i två former. Nästan allt ligger som katalog med
     * index.html, men 404-sidan ligger som `/404.html`, och en rutt som bara
     * kan det ena hade tappat den.
     */
    let sida = await fil(ctx, vag);
    if (!sida.ok && vag !== '/') {
      await sida.body?.cancel();
      sida = await fil(ctx, `${vag.slice(0, -1)}.html`);
    }
    if (!sida.ok) {
      await sida.body?.cancel();
      return tillbaka(ctx);
    }

    const kort = kortFranHtml(await huvud(sida));
    if (!kort) return tillbaka(ctx);

    const bild = await png(rita(await hamtaUnderlag(ctx), kort));

    const svar = new Response(bild, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': String(bild.length),
        /*
         * En dag, inte ett år. Kortet bär datumet för senaste kontrollen, och
         * det ändras när kommunen kommer på besök. Adressen bär inget
         * innehållsspår och kan därför inte cachas som märket självt.
         *
         * `stale-while-revalidate` finns för att en förhandsvisning aldrig ska
         * behöva vänta på en ritning: en dag gammal bild med rätt namn på är
         * bättre än en tom ruta.
         */
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        /* Bilden får hämtas av vem som helst. Det är hela poängen: den ska
           kunna läsas av Facebooks, Slacks och Apples hämtare. */
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
        /* Måtten står i svaret också, inte bara i sidans metataggar, så att en
           hämtare som läser bilden före sidan slipper gissa. */
        'X-Bildmatt': `${BREDD}x${HOJD}`,
      },
    });

    if (cache) {
      const kopia = svar.clone();
      const vanta = cache.put(nyckel, kopia);
      if (ctx.waitUntil) ctx.waitUntil(vanta);
      else await vanta;
    }
    return svar;
  } catch {
    /* Se huvudet: en trasig ritning får aldrig bli en trasig förhandsvisning
       på 16 742 sidor. Standardbilden är det läge sajten redan hade. */
    return tillbaka(ctx);
  }
}
