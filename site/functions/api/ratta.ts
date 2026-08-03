/**
 * POST /api/ratta. Tar emot en rättelse och mejlar den till redaktionen.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR DEN HÄR FILEN LIGGER I site/functions/ OCH INTE I REPOTS ROT
 * ---------------------------------------------------------------------------
 * Cloudflare Pages letar efter `functions/` i PROJEKTETS rot, alltså i den
 * katalog som står som "Root directory" i Pages-projektet, och uttryckligen
 * inte i den statiska utdatakatalogen (`dist`). Det här projektet har
 * `site` som root directory och `dist` som output, så katalogen hör hemma
 * här bredvid `src` och `public`, inte i repots rot.
 *
 * Flyttas root directory någon gång till repots rot måste den här katalogen
 * följa med dit, annars byggs funktionen tyst bort och formuläret får 404.
 *
 * Astro rör aldrig den här katalogen. Astro läser `src`, `public` och sin
 * konfiguration, så `functions/` är osynlig för bygget och tvingar ingen sida
 * att renderas vid förfrågan. Sidorna förblir statiska, se ADR 0001: beslutet
 * pekar mot Cloudflare, och en slutpunkt bredvid det statiska bygget är den
 * riktningen och inte ett avsteg.
 *
 * ---------------------------------------------------------------------------
 * HEMLIGHETEN
 * ---------------------------------------------------------------------------
 * `RESEND_API_KEY` sätts som **Secret** i Pages miljövariabler. Den läses bara
 * här, på Cloudflares sida, och når aldrig webbläsaren. Den får aldrig ligga i
 * `site/.env`: allt med prefixet PUBLIC_ bakas in i klienten, och en nyckel som
 * kan skicka mejl i vårt namn hör inte hemma i något som laddas ner.
 *
 * ---------------------------------------------------------------------------
 * VAD FUNKTIONEN INTE ÄR
 * ---------------------------------------------------------------------------
 * Den är ingen öppen reläserver. Mottagaren är hårdkodad till redaktionen, och
 * ingenting i anropet kan peka den någon annanstans. Avsändarens adress hamnar
 * i `reply_to` så att ett svar går tillbaka till rätt människa, men den styr
 * aldrig vem brevet går TILL.
 *
 * Brevets text byggs här, inte i webbläsaren. Klienten skickar fält, inte en
 * färdig kropp. Annars hade vem som helst kunnat lägga vad som helst i ett
 * brev som ser ut att komma från vårt eget formulär.
 */

/** Miljövariabler och hemligheter som funktionen läser. */
interface Env {
  /** Resends API-nyckel. Sätts som Secret, aldrig som Text. */
  RESEND_API_KEY?: string;
}

/**
 * Redaktionens brevlåda.
 *
 * MÅSTE STÄMMA med `PUBLISHER.correctionEmail` i site/src/lib/site.ts, som är
 * sajtens centrala sanning för adressen. Konstanten står här i stället för att
 * importeras därifrån, eftersom Pages bygger den här filen för sig och en
 * trasig sökväg över kataloggränsen syns först vid en misslyckad deploy.
 *
 * Brevlådan är ännu inte uppsatt. Se docs/13_epost_pa_prikko_se.md steg 1.
 * Tills den finns skickas brevet iväg utan fel men landar ingenstans.
 */
const TO = 'ratta@prikko.se';

/**
 * Avsändare. Måste ligga på en domän som är verifierad i Resend.
 *
 * `prikko.se` är verifierad: DKIM ligger på `resend._domainkey.prikko.se` och
 * returadressen på `send.prikko.se`, båda kontrollerade i docs/13. Samma
 * adress som Supabase skickar inloggningskoderna från.
 */
const FROM = 'Prikko <no-reply@prikko.se>';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/* -------------------------------------------------------------------------- */
/* Takregel                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Enkel takregel per IP.
 *
 * ÄRLIGT OM VAD DEN ÄR: minnet lever i en isolat, och Cloudflare kör många
 * isolat och återvinner dem. Den här regeln stoppar alltså en enskild
 * skriptkörning som hamrar på samma slutpunkt, vilket är det vanliga fallet,
 * men den är ingen global garanti. Blir det ett verkligt problem är rätt svar
 * Cloudflares egen rate limiting-bindning eller en KV-räknare, och båda kräver
 * en wrangler-konfiguration som projektet inte har i dag.
 *
 * Tjugo rättelser på en minut är inte en restaurangägare. Fem är redan
 * osannolikt, och den som verkligen har fem fel att anmäla kan skicka det
 * sjätte en minut senare eller mejla direkt.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

/** Nycklar med tidpunkter för de senaste anropen. */
const recent = new Map<string, number[]>();

/**
 * Vaktar minnet.
 *
 * Utan taket växer kartan med en nyckel per IP tills isolatet återvinns, och
 * det är en läcka som en angripare styr helt själv. Vid taket töms de äldsta
 * i stället, vilket i värsta fall betyder att någon får ett extra försök.
 */
const MAX_KEYS = 5_000;

function overRateLimit(key: string, now: number): boolean {
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);

  if (recent.size > MAX_KEYS) recent.clear();
  recent.set(key, hits);

  return hits.length > MAX_PER_WINDOW;
}

/* -------------------------------------------------------------------------- */
/* Inkommande fält                                                             */
/* -------------------------------------------------------------------------- */

interface Payload {
  issue?: unknown;
  fixLabel?: unknown;
  fix?: unknown;
  placeName?: unknown;
  placeMunicipality?: unknown;
  placeId?: unknown;
  placePath?: unknown;
  pageUrl?: unknown;
  role?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  note?: unknown;
  /** Honungsfällan. Ska alltid vara tom. */
  webbplats?: unknown;
  /** Millisekunder sedan epok då formuläret ritades. */
  startedAt?: unknown;
}

/**
 * Klipper ett fält till en trimmad sträng med tak.
 *
 * Taken är samma som `maxlength` i formuläret, men de kontrolleras HÄR också.
 * Attributet i HTML är en bekvämlighet för den som fyller i, aldrig en spärr:
 * anropet kommer över nätet och kan innehålla vad som helst.
 */
function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/** Grov kontroll. En adress som inte går fram studsar hos avsändaren. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 150;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/* -------------------------------------------------------------------------- */
/* Handlaren                                                                   */
/* -------------------------------------------------------------------------- */

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return json({ error: 'Kunde inte läsa anropet.' }, 400);
  }

  const now = Date.now();

  /*
   * Honungsfällan.
   *
   * Fältet är dolt för människor och heter något en ifyllningsrobot gärna
   * fyller i. Är det ifyllt svarar vi 200 och gör ingenting. Att svara med ett
   * fel hade lärt roboten vilket fält som avslöjade den; en tyst framgång gör
   * att den går vidare nöjd och kommer tillbaka med samma misstag.
   */
  if (text(body.webbplats, 200) !== '') return json({ ok: true }, 200);

  /*
   * Tiden det tog att fylla i.
   *
   * Ett formulär med tio alternativ och fem fält tar en människa mer än tre
   * sekunder. Värdet kommer från klienten och går att ljuga om, så det är ett
   * komplement till fällan ovan och inte en spärr att lita på ensam.
   */
  const startedAt = typeof body.startedAt === 'number' ? body.startedAt : 0;
  if (startedAt > 0 && now - startedAt < 3_000) return json({ ok: true }, 200);

  /* Cloudflare sätter huvudet själv och det går inte att förfalska utifrån.
     Saknas det, vilket det gör vid lokal körning, faller vi tillbaka på en
     gemensam nyckel så att takregeln ändå går att prova. */
  const ip = request.headers.get('CF-Connecting-IP') ?? 'lokal';
  if (overRateLimit(ip, now)) {
    return json({ error: 'För många försök. Vänta en minut och prova igen.' }, 429);
  }

  const issue = text(body.issue, 120);
  const role = text(body.role, 60);
  const name = text(body.name, 100);
  const email = text(body.email, 150);
  const placeName = text(body.placeName, 150);
  const pageUrl = text(body.pageUrl, 300);

  if (!issue) return json({ error: 'Välj vad som är fel.' }, 400);
  if (!role) return json({ error: 'Välj om du är besökare eller företräder verksamheten.' }, 400);
  if (!name) return json({ error: 'Skriv ditt namn.' }, 400);
  if (!looksLikeEmail(email)) return json({ error: 'Skriv en e-postadress vi kan svara på.' }, 400);
  if (!placeName && !pageUrl) return json({ error: 'Skriv vad det gäller.' }, 400);

  /* Brevet byggs här. Klienten skickar fält, aldrig en färdig kropp. */
  const lines: string[] = [`Vad är fel: ${issue}`];

  if (placeName) {
    const municipality = text(body.placeMunicipality, 80);
    lines.push(`Verksamhet: ${placeName}${municipality ? `, ${municipality}` : ''}`);

    /* Sökvägen kommer från vår egen länk men går över nätet, så den kontrolleras
       en gång till. Bara rotrelativa adresser på vår egen sajt skrivs ut. */
    const path = text(body.placePath, 300);
    if (path.startsWith('/') && !path.startsWith('//')) {
      lines.push(`Sida: https://prikko.se${path}`);
    }

    const id = text(body.placeId, 60);
    if (id) lines.push(`Id: ${id}`);
  } else {
    lines.push(`Sida: ${pageUrl}`);
  }

  const fixLabel = text(body.fixLabel, 120);
  const fix = text(body.fix, 300);
  if (fixLabel && fix) lines.push(`${fixLabel} ${fix}`);

  lines.push('', `Avsändare: ${name}, ${role}`, `E-post: ${email}`);

  const phone = text(body.phone, 30);
  if (phone) lines.push(`Telefon: ${phone}`);

  const note = text(body.note, 1200);
  if (note) lines.push('', note);

  const subject = `Rättelse: ${placeName || pageUrl}`;

  /*
   * Nyckeln saknas.
   *
   * Svaret säger det rakt ut i stället för att låtsas att brevet gick iväg.
   * Klienten visar då reservvägen, alltså samma text att kopiera och adressen
   * utskriven, och ingen tror att en rättelse är inskickad när den inte är det.
   */
  if (!env.RESEND_API_KEY) {
    return json({ error: 'Utskicket är inte konfigurerat på den här installationen.' }, 503);
  }

  let sent: Response;
  try {
    sent = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        /* Svaret ska gå till människan som hörde av sig, inte till no-reply. */
        reply_to: [email],
        subject,
        text: lines.join('\n'),
      }),
    });
  } catch {
    return json({ error: 'Kunde inte nå utskickstjänsten.' }, 502);
  }

  if (!sent.ok) {
    /* Resends eget fel loggas för oss men skickas aldrig vidare till
       besökaren: det är på engelska och kan innehålla detaljer om kontot. */
    console.error('Resend svarade', sent.status, await sent.text());
    return json({ error: 'Kunde inte skicka just nu.' }, 502);
  }

  return json({ ok: true }, 200);
}

/**
 * Allt annat än POST.
 *
 * Utan den här svarar Pages med den statiska 404-sidan, vilket ser ut som att
 * slutpunkten inte finns när någon råkar öppna adressen i webbläsaren.
 */
export function onRequest(): Response {
  return json({ error: 'Använd POST.' }, 405);
}
