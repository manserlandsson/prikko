/**
 * GET /api/marke. Bygger fönsterdekalen, A4-arket och certifikatet vid begäran.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR DEN HÄR FILEN FINNS, OCH VARFÖR DEN INTE MOTSÄGER MARKE.SVG.TS
 * ---------------------------------------------------------------------------
 * `pages/utmarkelser/[year]/marke.svg.ts` säger att märket är GENERISKT och
 * inte nämner någon verksamhet, med skälet att ett märke med namn i hade krävt
 * 1 541 filer. Det skälet står kvar och det är fortfarande sant. En QR-kod per
 * verksamhet är exakt samma problem, i värre skala: 17 066 dekaler plus 17 066
 * ark plus 254 certifikat är 34 386 filer.
 *
 * Alltså byggs de inte. De sätts ihop här, när någon ber om dem, och kostar
 * noll filer i bygget. Det är samma apparat som `ratta.ts` redan använder, och
 * ADR 0001 pekar åt samma håll.
 *
 * MÄRKET SOM SIDORNA VISAR ÄNDRAS INTE. `/utmarkelser/2026/marke.svg` är kvar
 * som den är, generisk och fryst, och det är fortfarande DEN filen kodsnutten
 * på emblemsidan pekar på. Skälen står i lib/emblem.ts avsnitt 2 och gäller
 * oförändrat: ett märke som hämtas från oss vid varje visning hos verksamheten
 * gör oss till en tredje part på deras sajt och binder deras sida till vår
 * drifttid. Det den här rutten levererar är NEDLADDNINGAR, alltså filer som
 * skapas en gång och sedan lever utan oss. Skillnaden mellan de två är hela
 * grunden för att den här filen får finnas, och den står utskriven i
 * lib/dekal.ts avsnitt 1.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR FUNKTIONEN HÄMTAR SINA RITNINGAR I STÄLLET FÖR ATT IMPORTERA DEM
 * ---------------------------------------------------------------------------
 * Cloudflare Pages bundlar `functions/` för sig, med esbuild, utan Vite.
 * `lib/marke.ts` upptäcker sina ritningar med `import.meta.glob` och går
 * därför inte att importera hit: bundlaren hade antingen fallit eller, värre,
 * tagit med en tom lista.
 *
 * Ritningarna hämtas i stället ur vårt eget statiska bygge, alltså exakt de
 * filer sidorna själva visar. Det är bättre än en import och inte en
 * nödlösning: `marke.svg.ts` skriver i sitt huvud att bilden sidan visar och
 * filen verksamheten laddar ner MÅSTE vara samma URL, annars kan de glida
 * isär. Den regeln gäller nu också dekalen.
 *
 * Det som importeras är ren TypeScript utan Vite-beroenden, `lib/qr.ts` och
 * `lib/dekal.ts`, och de ligger i `src/` för att de ska gå att köra också vid
 * bygget. Emblemsidan ritar sin förhandsvisning ur samma två moduler, så det
 * man ser på sidan är det man laddar ner.
 *
 * ---------------------------------------------------------------------------
 * VAD FUNKTIONEN INTE GÖR
 * ---------------------------------------------------------------------------
 * Den skriver aldrig ut text som kommer från anropet. Verksamhetens namn på
 * certifikatet slås upp i `/utmarkelser/senaste.json` och hämtas aldrig ur
 * frågesträngen. Utan den regeln hade vem som helst kunnat be om ett
 * Prikko-certifikat med vilket företagsnamn som helst på.
 *
 * Den avgör heller aldrig något om kvalitet. `typ=hanvisning` ges till VARJE
 * verksamhet som har en sida hos oss, utan ett enda villkor, och det är
 * avsiktligt: ett märke som bara vissa får blir ett märke vars frånvaro säger
 * något. Se docs/24_maskotprogram.md § 2 och docs/48 avsnitt 5.
 */
import { encodeQr, qrPath } from '../../src/lib/qr';
import {
  arkDocument,
  certifikatDocument,
  dekalDocument,
  filename,
  ritning,
  type MarkeForm,
  type MarkeTyp,
} from '../../src/lib/dekal';

interface Env {
  /** Pages statiska filer. Finns i drift, saknas i vissa lokala körningar. */
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}

interface Context {
  request: Request;
  env: Env;
}

/* -------------------------------------------------------------------------- */
/* Takregel                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Samma enkla takregel som ratta.ts, med samma ärliga förbehåll: minnet lever
 * i ett isolat och Cloudflare kör många isolat, så den stoppar en enskild
 * skriptkörning och är ingen global garanti.
 *
 * Trettio i minuten är rundligt tilltaget. En verksamhet hämtar fyra filer och
 * ångrar sig ett par gånger. Talet är högre än rättelseformulärets fem
 * eftersom en sida här kan utlösa flera hämtningar i rad utan att någon gjort
 * något konstigt.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const MAX_KEYS = 5_000;
const recent = new Map<string, number[]>();

function overRateLimit(key: string, now: number): boolean {
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  if (recent.size > MAX_KEYS) recent.clear();
  recent.set(key, hits);
  return hits.length > MAX_PER_WINDOW;
}

/* -------------------------------------------------------------------------- */
/* Hämtning ur vårt eget bygge                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Hämtar en fil ur den statiska utgåvan.
 *
 * `env.ASSETS` är Pages egen bindning till filerna och går direkt, utan att
 * lämna kanten. Saknas den, vilket händer i vissa lokala körningar, faller vi
 * tillbaka på ett vanligt anrop mot samma ursprung. Adressen byggs alltid ur
 * `request.url` och aldrig ur något som kommit in i anropet, så rutten kan inte
 * fås att hämta från någon annan värd.
 */
async function asset(context: Context, path: string): Promise<Response> {
  const url = new URL(path, new URL(context.request.url).origin);
  const req = new Request(url.href, { headers: { Accept: '*/*' } });
  return context.env.ASSETS ? context.env.ASSETS.fetch(req) : fetch(req);
}

/**
 * Ritningarna, sparade i isolatet efter första hämtningen.
 *
 * Utan cachen kostar varje dekal två hämtningar av samma tio kilobyte. Med den
 * betalar den första begäran efter en kallstart, och resten går på minnet. Ett
 * isolat lever i storleksordningen minuter, alltså räcker det gott för den som
 * hämtar fyra filer i rad.
 */
const drawings = new Map<string, string>();

async function drawing(context: Context, path: string): Promise<string> {
  const cached = drawings.get(path);
  if (cached) return cached;

  const response = await asset(context, path);
  if (!response.ok) {
    throw new Error(`Ritningen ${path} svarade ${response.status}.`);
  }
  const text = await response.text();
  drawings.set(path, text);
  return text;
}

interface Edition {
  year: number;
  asOf: string;
  asOfText: string;
  holders: Record<string, { n: string; k: string }>;
}

let edition: Edition | null = null;
let editionAt = 0;

/**
 * Utgåvan, med en femminuterscache i isolatet.
 *
 * Kort och inte oändlig, eftersom en ny utgåva ska slå igenom samma dag.
 * Filen är omkring 20 kB och hämtas alltså sällan nog att det inte spelar
 * roll.
 */
async function latestEdition(context: Context): Promise<Edition> {
  const now = Date.now();
  if (edition && now - editionAt < 300_000) return edition;

  const response = await asset(context, '/utmarkelser/senaste.json');
  if (!response.ok) {
    throw new Error(`Utgåvan svarade ${response.status}.`);
  }
  edition = (await response.json()) as Edition;
  editionAt = now;
  return edition;
}

/* -------------------------------------------------------------------------- */
/* Inkommande fält                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Nyckeln `kommun/verksamhet`.
 *
 * Formen kontrolleras hårt innan den används till någonting, och det är inte
 * paranoia: värdet går in i en URL som funktionen sedan hämtar från sitt eget
 * ursprung, och det ska inte gå att skriva `../` eller ett helt annat värdnamn
 * i det. Slugarna i pipelinen är gemener, siffror och bindestreck, ingenting
 * annat, mätt över samtliga 17 066.
 */
const KEY = /^[a-z0-9-]{1,80}\/[a-z0-9-]{1,140}$/;

const FORMS: MarkeForm[] = ['dekal', 'ark', 'certifikat'];
const TYPES: MarkeTyp[] = ['hanvisning', 'utmarkelse'];

function fail(message: string, status: number): Response {
  return new Response(`${message}\n`, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

/* -------------------------------------------------------------------------- */
/* Handlaren                                                                   */
/* -------------------------------------------------------------------------- */

export async function onRequestGet(context: Context): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);

  const ip = request.headers.get('CF-Connecting-IP') ?? 'okänd';
  if (overRateLimit(ip, Date.now())) {
    return fail('För många hämtningar. Vänta en minut.', 429);
  }

  const key = (url.searchParams.get('v') ?? '').trim().toLowerCase();
  if (!KEY.test(key)) {
    return fail(
      'Välj din verksamhet först. Adressen ska se ut som ' +
        '?v=kommun/verksamhet, till exempel ?v=stockholm/ag.',
      400,
    );
  }

  const form = (url.searchParams.get('form') ?? 'dekal') as MarkeForm;
  if (!FORMS.includes(form)) {
    return fail(`Okänt format. Välj ${FORMS.join(', ')}.`, 400);
  }

  const typ = (url.searchParams.get('typ') ?? 'hanvisning') as MarkeTyp;
  if (!TYPES.includes(typ)) {
    return fail(`Okänd typ. Välj ${TYPES.join(', ')}.`, 400);
  }

  /* Certifikatet finns bara som utmärkelse. Ett diplom för att man existerar
     är inte ett diplom, och det vore dessutom precis det slags påstående som
     hänvisningsmärket finns till för att slippa. */
  if (form === 'certifikat' && typ !== 'utmarkelse') {
    return fail('Certifikatet finns bara för utmärkelsen.', 400);
  }

  const target = `${new URL(request.url).origin}/${key}/`;
  const slug = key.split('/')[1];

  try {
    /*
     * Finns verksamheten?
     *
     * Kontrollen görs genom att hämta verksamhetens egen sida ur bygget, och
     * inte genom en lista i funktionen. En lista över 17 066 nycklar hade varit
     * en halv megabyte som dessutom måste hållas i takt med datan. Sidan är
     * sanningen: finns sidan finns verksamheten, och QR-koden pekar på just den
     * sidan. Kroppen läses aldrig, den avbryts.
     */
    const page = await asset(context, `/${key}/`);
    await page.body?.cancel();
    if (!page.ok) {
      return fail('Vi har ingen sida för den verksamheten.', 404);
    }

    let body: string;
    let year: number | undefined;

    if (typ === 'utmarkelse') {
      const current = await latestEdition(context);
      const holder = current.holders[key];
      if (!holder) {
        return fail(
          `Verksamheten står inte i ${current.year} års utgåva av utmärkelsen. ` +
            'Hänvisningsmärket kan alla hämta: byt typ=hanvisning.',
          404,
        );
      }

      year = current.year;
      const mark = ritning(await drawing(context, `/utmarkelser/${year}/marke.svg`));
      const code = encodeQr(target);
      const arg = {
        typ,
        ritning: mark,
        qrPath: qrPath(code),
        qrModules: code.size,
        url: target,
        year,
      };

      body =
        form === 'certifikat'
          ? certifikatDocument({
              ...arg,
              name: holder.n,
              municipalityName: holder.k,
              asOf: current.asOfText,
              year,
            })
          : form === 'ark'
            ? arkDocument(arg)
            : dekalDocument(arg);
    } else {
      /*
       * Hänvisningsmärket hämtar ingen ritning alls. Det bär inget ansikte och
       * ingen krans, av skäl som står i lib/dekal.ts vid `dekalGroup`: ett
       * ansikte i ett restaurangfönster läses som ett betyg, och det här
       * märket säger ingenting om resultatet.
       */
      const code = encodeQr(target);
      const arg = {
        typ,
        qrPath: qrPath(code),
        qrModules: code.size,
        url: target,
      };
      body = form === 'ark' ? arkDocument(arg) : dekalDocument(arg);
    }

    return new Response(body, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        /*
         * Nedladdning och inte visning. Utan det öppnar webbläsaren SVG:n som
         * en sida, och den som klickat på "Hämta dekalen" står med en bild i
         * en flik i stället för en fil i mappen Hämtade filer.
         */
        'Content-Disposition': `attachment; filename="${filename(form, slug, year)}"`,
        /*
         * En timme. Innehållet ändras bara när utgåvan gör det, men adressen
         * bär inget innehållsspår och kan därför inte cachas som märket självt.
         */
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    /*
     * Ett fel här är vårt och inte anroparens: alla värden är redan
     * kontrollerade ovan. Meddelandet skrivs ut i klartext, eftersom den som
     * står med en trasig hämtning ska kunna klistra in raden i ett mejl till
     * oss.
     */
    const message = error instanceof Error ? error.message : 'okänt fel';
    return fail(`Kunde inte bygga märket: ${message}`, 500);
  }
}
