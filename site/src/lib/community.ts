/**
 * Klientlagret mot Supabase. KÖRS BARA I WEBBLÄSAREN.
 *
 * ---------------------------------------------------------------------------
 * Varför ingen serveradapter
 * ---------------------------------------------------------------------------
 * Sajten är statiskt genererad och ska förbli det. ADR 0001 säger att bytet
 * till hybrid ska vara ett adaptertillägg när sidantalet kräver det, inte
 * något inloggningen tvingar fram i förtid.
 *
 * Ingenting i den här funktionen behöver en server hos oss. Supabase ÄR
 * servern: GoTrue sköter lösenord, e-postutskick och tokens, PostgREST sköter
 * skrivningarna, och radsäkerheten sköter behörigheten. En egen serverdel hade
 * bara flyttat samma anrop ett steg och lagt till en driftsdel att ha sönder.
 *
 * Det som gör det försvarbart är att INGEN regel bor här. Klienten kan ljuga
 * om allt den vill; policyerna i pipeline/schema_community.sql avgör vad som
 * faktiskt får skrivas. Den här filen är ett formulär, inte en grind.
 *
 * ---------------------------------------------------------------------------
 * Varför inget @supabase/supabase-js
 * ---------------------------------------------------------------------------
 * Biblioteket väger drygt 60 kB minifierat och skulle ligga på en sajt vars
 * bärande princip är att inte skicka JavaScript. Vi använder fyra endpoints i
 * GoTrue och tre verb i PostgREST, båda vanlig REST över HTTPS. Det blir de
 * här dryga tvåhundra raderna i stället, och de laddas bara på sidor som
 * faktiskt har en inloggning.
 *
 * ---------------------------------------------------------------------------
 * Konfiguration
 * ---------------------------------------------------------------------------
 * PUBLIC_SUPABASE_URL och PUBLIC_SUPABASE_ANON_KEY måste finnas vid bygget.
 * Saknas de är `configured` falsk, och varje yta som beror på inloggning visar
 * det i stället för att gå sönder. Anon-nyckeln är avsedd att vara publik; det
 * är radsäkerheten som skyddar datan, aldrig nyckeln.
 */

const URL_BASE = (import.meta.env.PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
const ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';

export const configured = Boolean(URL_BASE && ANON_KEY);

/** Schemat med användarinnehåll. Aldrig `public`. Se schema_community.sql. */
const SCHEMA = 'community';

const STORAGE_KEY = 'prikko.session';

export interface Session {
  accessToken: string;
  refreshToken: string;
  /** Millisekunder sedan epok. */
  expiresAt: number;
  userId: string;
  email: string;
}

/* ------------------------------------------------------------------------ */
/* Session                                                                   */
/* ------------------------------------------------------------------------ */

/**
 * Sessionen ligger i localStorage och inte i en cookie.
 *
 * Skälet är att det inte finns någon server som skulle läsa cookien. Sidorna
 * är statiska filer; allt som behöver veta vem du är körs i webbläsaren. En
 * cookie hade skickats med varje bildhämtning utan att någon läste den.
 */
function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s?.accessToken || !s?.refreshToken) return null;
    return s;
  } catch {
    return null;
  }
}

/**
 * Namnet på händelsen som säger att inloggningsläget ändrats.
 *
 * En sida bär flera ytor som var för sig bryr sig om vem som är inloggad:
 * bevakningsknappen, omdömesformuläret och kontoraden i menyn. Var och en
 * frågade tidigare `signedIn()` när den startade och behöll svaret. Loggade
 * man in via en av dem visste de andra ingenting om det, och omdömesknappen
 * bad om inloggning igen fastän man just loggat in på samma sida.
 *
 * Den som lyssnar behöver inte veta VEM som ändrade läget, bara att det
 * ändrats. Alternativet, att varje yta pollar, hade betytt att de fortfarande
 * kan visa fel under tiden.
 */
export const AUTH_EVENT = 'prikko:auth';

function writeSession(s: Session | null): void {
  try {
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Privat läge utan lagring. Sessionen lever då bara sidan ut. */
  }
  /* Efter skrivningen, aldrig före: den som lyssnar ska kunna läsa det nya
     läget direkt i sin hanterare. */
  try {
    window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { signedIn: s !== null } }));
  } catch {
    /* Ingen window, alltså inget att uppdatera. */
  }
}

/** Kör `fn` varje gång någon loggar in eller ut på den här sidan. */
export function onAuthChange(fn: () => void): void {
  window.addEventListener(AUTH_EVENT, fn);
}

function toSession(payload: any): Session {
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
    userId: payload.user?.id ?? '',
    email: payload.user?.email ?? '',
  };
}

let inFlightRefresh: Promise<Session | null> | null = null;

/**
 * Giltig access token, eller null.
 *
 * Förnyar sextio sekunder innan utgång så ett anrop aldrig hinner falla på
 * att token gick ut mitt i. Parallella anrop delar samma förnyelse; annars
 * hade tre samtidiga hämtningar gjort tre förnyelser och två av dem hade
 * ogiltigförklarat den första.
 */
async function validToken(): Promise<string | null> {
  const s = readSession();
  if (!s) return null;
  if (Date.now() < s.expiresAt - 60_000) return s.accessToken;

  inFlightRefresh ??= refresh(s.refreshToken).finally(() => {
    inFlightRefresh = null;
  });
  const next = await inFlightRefresh;
  return next?.accessToken ?? null;
}

async function refresh(refreshToken: string): Promise<Session | null> {
  try {
    const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      writeSession(null);
      return null;
    }
    const next = toSession(await res.json());
    writeSession(next);
    return next;
  } catch {
    return null;
  }
}

/** Vem som är inloggad just nu, utan nätanrop. */
export function currentUser(): { id: string; email: string } | null {
  const s = readSession();
  return s ? { id: s.userId, email: s.email } : null;
}

export async function signedIn(): Promise<boolean> {
  return (await validToken()) !== null;
}

/* ------------------------------------------------------------------------ */
/* Fel                                                                       */
/* ------------------------------------------------------------------------ */

export class CommunityError extends Error {}

/**
 * GoTrue och PostgREST svarar på engelska. Besökaren ska inte behöva läsa det.
 *
 * Okända fel återges som de kommer i stället för att bytas mot en artig
 * intetsägande mening. Ett fel man kan söka på är mer värt än ett fel som ser
 * bra ut.
 */
function translate(message: string, code?: string): string {
  const m = (message || '').toLowerCase();
  if (m.includes('token has expired') || m.includes('invalid token') || code === 'otp_expired')
    return 'Koden stämmer inte, eller så har den gått ut. Begär en ny.';
  if (m.includes('email not confirmed')) return 'Bekräfta din e-postadress först. Kolla inkorgen.';
  if (m.includes('signups not allowed') || code === 'signup_disabled')
    return 'Nya konton är avstängda just nu.';
  if (m.includes('error sending') || m.includes('smtp'))
    return 'Koden kunde inte skickas. Prova igen om en stund.';
  if (m.includes('provider is not enabled') || code === 'provider_disabled')
    return 'Den inloggningen är inte påslagen.';
  if (m.includes('unable to validate email') || m.includes('invalid format'))
    return 'E-postadressen ser inte riktig ut.';
  if (m.includes('for security purposes') || m.includes('rate limit') || code === 'over_email_send_rate_limit')
    return 'För många försök. Vänta en minut och prova igen.';
  if (m.includes('duplicate key') && m.includes('reviews'))
    return 'Du har redan skrivit ett omdöme om den här verksamheten.';
  if (m.includes('duplicate key') && m.includes('owner_responses'))
    return 'Det finns redan ett svar på den kontrollen.';
  if (m.includes('duplicate key') && m.includes('claims'))
    return 'Du har redan ansökt om att företräda den här verksamheten.';
  if (m.includes('duplicate key')) return 'Det finns redan en sådan post.';
  if (m.includes('violates row-level security'))
    return 'Du saknar behörighet för det här. Ett anspråk måste vara godkänt först.';
  if (m.includes('frusen efter insändning'))
    return 'Texten kan inte ändras efter att den skickats in.';
  return message || 'Något gick fel.';
}

async function fail(res: Response): Promise<never> {
  let body: any = {};
  try {
    body = await res.json();
  } catch {
    /* Tomt svar. */
  }
  const message = body.msg || body.error_description || body.message || body.error || res.statusText;
  throw new CommunityError(translate(String(message), body.error_code || body.code));
}

/* ------------------------------------------------------------------------ */
/* Auth                                                                      */
/* ------------------------------------------------------------------------ */

async function authPost(path: string, body: unknown, token?: string): Promise<any> {
  const res = await fetch(`${URL_BASE}/auth/v1/${path}`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) await fail(res);
  return res.json();
}

/**
 * Steg 1: begär en sexsiffrig engångskod till e-postadressen.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR KOD OCH INTE LÖSENORD
 * ---------------------------------------------------------------------------
 * Prikko besöks sällan. Ett lösenord till en sajt man är inne på två gånger om
 * året är ett lösenord man har glömt, och då är hela "glömt lösenord"-flödet
 * bara ett omväg tillbaka till e-posten. Med kod finns det inget att glömma,
 * ingen återanvänd lösenordssträng att läcka, och ingen lösenordsdatabas att
 * skydda.
 *
 * Det gör också att det bara finns EN väg in. "Logga in eller bli medlem" är
 * ett och samma anrop: `create_user: true` skapar kontot om adressen är ny och
 * loggar in om den inte är det. Besökaren behöver aldrig veta vilket som
 * gällde, och vi behöver inte två formulär.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR KOD OCH INTE MAGISK LÄNK
 * ---------------------------------------------------------------------------
 * En länk måste öppnas i samma webbläsare som begärde den. Den som fyller i
 * adressen på datorn och läser mejlet i telefonen hamnar inloggad på fel
 * enhet. En kod går att flytta med ögonen, och det är just den situationen som
 * uppstår när någon står i en restaurang och läser om den.
 *
 * E-post är enda kanalen. Beslutat av ägaren, och koden bär inga spår av
 * något annat: ingen kanalparameter, inget telefonfält, ingen halv struktur
 * som väntar på något som kanske aldrig kommer.
 *
 * ---------------------------------------------------------------------------
 * ÄGARENS STEG INNAN DETTA FUNGERAR
 * ---------------------------------------------------------------------------
 * Supabase skickar som förval en LÄNK och inte en kod. Mallen måste ändras:
 *   Authentication → Email Templates → Magic Link → lägg in {{ .Token }}
 * Utan det kommer mejlet fram, men utan siffror att skriva in.
 */
export async function requestCode(email: string): Promise<void> {
  await authPost('otp', { email, create_user: true });
}

/**
 * Steg 2: växla in koden mot en session.
 *
 * `type: 'email'` är den typ GoTrue använder för engångskod till e-post, både
 * för ett nytt konto och för ett befintligt.
 */
export async function verifyCode(email: string, token: string): Promise<void> {
  const data = await authPost('verify', { email, token, type: 'email' });
  writeSession(toSession(data));
}

/**
 * Inloggning via Google eller Apple.
 *
 * Byggd men AVSTÄNGD. Knapparna renderas bara för de leverantörer som står i
 * PUBLIC_OAUTH_PROVIDERS, och den listan är tom tills ägaren registrerat en
 * OAuth-app hos respektive bolag och slagit på leverantören i Supabase. En
 * knapp som leder till en leverantör som inte är uppsatt ger ett engelskt
 * felmeddelande från Supabase, och det är precis den sortens halvfärdiga
 * kontroll det här bygget är till för att bli av med.
 */
export const OAUTH_PROVIDERS: string[] = (import.meta.env.PUBLIC_OAUTH_PROVIDERS ?? '')
  .split(',')
  .map((p: string) => p.trim().toLowerCase())
  .filter((p: string) => p === 'google' || p === 'apple');

export function oauthUrl(provider: string, next: string): string {
  const target = new URL('/konto/inloggad/', window.location.origin);
  try {
    sessionStorage.setItem('prikko.next', next);
  } catch {
    /* Utan lagring landar man på kontosidan i stället. Inte hela världen. */
  }
  return `${URL_BASE}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(target.href)}`;
}

export async function signOut(): Promise<void> {
  const s = readSession();
  writeSession(null);
  if (!s) return;
  try {
    await authPost('logout', {}, s.accessToken);
  } catch {
    /* Sessionen är redan borta lokalt. Att servern inte svarade ändrar inte det. */
  }
}

/**
 * Plockar upp en session ur adressfältet efter ett klick i ett mejl.
 *
 * GoTrue skickar tillbaka tokens i fragmentet (`#access_token=...`). Det tas
 * bort ur adressfältet direkt efteråt, annars ligger en giltig token kvar i
 * webbläsarhistoriken och i allt som råkar logga URL:er.
 *
 * Returnerar typen av länk: 'recovery' vid lösenordsåterställning, 'signup'
 * efter bekräftad registrering.
 */
export function captureLinkSession(): string | null {
  const hash = window.location.hash.slice(1);
  if (!hash.includes('access_token')) return null;

  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;

  writeSession({
    accessToken,
    refreshToken,
    expiresAt: Date.now() + Number(params.get('expires_in') ?? 3600) * 1000,
    userId: '',
    email: '',
  });

  const type = params.get('type');
  history.replaceState(null, '', window.location.pathname + window.location.search);
  void hydrateUser();
  return type;
}

/** Fyller i id och e-post på en session som kom från en mejllänk. */
async function hydrateUser(): Promise<void> {
  const token = await validToken();
  const s = readSession();
  if (!token || !s) return;
  try {
    const res = await fetch(`${URL_BASE}/auth/v1/user`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const user = await res.json();
    writeSession({ ...s, userId: user.id ?? '', email: user.email ?? '' });
  } catch {
    /* Namnet får vara tomt. Sessionen fungerar ändå. */
  }
}

/* ------------------------------------------------------------------------ */
/* PostgREST mot schemat community                                           */
/* ------------------------------------------------------------------------ */

/**
 * `Accept-Profile` och `Content-Profile` är hur PostgREST väljer schema.
 *
 * Varje anrop härifrån pekar uttryckligen på `community`. Läsning ur `public`
 * går genom readPublic ovan, som bara kan göra GET, och det är avsiktligt: den
 * redaktionella databasen ska inte kunna skrivas från en webbläsare ens av
 * misstag.
 */
async function rest(
  method: string,
  path: string,
  options: { body?: unknown; auth?: boolean; prefer?: string } = {},
): Promise<any> {
  const headers: Record<string, string> = {
    apikey: ANON_KEY,
    'Accept-Profile': SCHEMA,
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  /*
   * Content-Profile på VARJE skrivning, inte bara när det finns en kropp.
   *
   * PostgREST väljer schema med Accept-Profile för läsning och Content-Profile
   * för skrivning. En DELETE har ingen kropp, så villkoret ovan hoppade över
   * headern och servern föll tillbaka på public. Följden var att avfölj gav
   * "Could not find the table 'public.follows' in the schema cache" medan
   * följ, som har en kropp, fungerade. Felet gick inte att se i koden för
   * varje enskilt anrop pekar korrekt på community; det satt i att headern
   * hängde på kroppen i stället för på metoden.
   */
  if (method !== 'GET' && method !== 'HEAD') {
    headers['Content-Profile'] = SCHEMA;
  }
  if (options.prefer) headers.Prefer = options.prefer;

  if (options.auth !== false) {
    const token = await validToken();
    if (!token) throw new CommunityError('Du är utloggad. Logga in igen.');
    headers.Authorization = `Bearer ${token}`;
  } else {
    headers.Authorization = `Bearer ${ANON_KEY}`;
  }

  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    method,
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
  if (!res.ok) await fail(res);
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Sökväg för rader som är ANVÄNDARENS EGNA, med ägarfiltret utskrivet.
 *
 * Radsäkerheten räcker inte som filter här, och det såg ut som att den
 * gjorde det. Tabellen reviews har TVÅ läspolicyer som läggs ihop med eller:
 * egna rader, och allas publicerade rader. Den senare finns för att den
 * publika listan under en verksamhet ska kunna läsas alls. En fråga utan
 * eget filter fick därför tillbaka andras publicerade omdömen, och både
 * kontosidan och kvittensen på verksamhetssidan målade dem som ens egna:
 * den som loggade in med ett nytt konto stod som avsändare av omdömen
 * skrivna från ett annat.
 *
 * Därför går varje läsning av egna rader genom den här funktionen, även mot
 * tabeller där radsäkerheten i dag bara släpper ut egna rader. Får en sådan
 * tabell en bredare policy i morgon läcker den inte hit. Testet
 * pipeline/tests/test_egna_rader.py fäller bygget om någon fråga går förbi.
 *
 * Saknar sessionen användar-id, vilket händer när den just plockats ur en
 * mejllänk, hämtas det först. Utan id ingen fråga: hellre ett fel än någon
 * annans rader.
 */
async function ownRows(path: string): Promise<string> {
  let user = currentUser();
  if (!user?.id) {
    await hydrateUser();
    user = currentUser();
  }
  if (!user?.id) throw new CommunityError('Du är utloggad. Logga in igen.');
  return `${path}${path.includes('?') ? '&' : '?'}user_id=eq.${encodeURIComponent(user.id)}`;
}

export interface Place {
  id: string;
  name: string;
  municipalitySlug: string;
}

/**
 * Läsning ur den REDAKTIONELLA databasen, alltså schemat `public`.
 *
 * Enda vägen dit härifrån, och bara med GET. Kontrolldatan är allmänna
 * handlingar och läsbar för alla, men den skrivs uteslutande av pipelinen med
 * service_role. Att det inte finns någon skrivfunktion mot `public` i den här
 * filen är avsiktligt och ska förbli så.
 */
async function readPublic(path: string): Promise<any> {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  if (!res.ok) await fail(res);
  return res.json();
}

export interface InspectionRow {
  id: string;
  inspected_at: string;
  assessment: 0 | 1 | 2;
  owner_comment: string | null;
}

/** Kontrollerna för en verksamhet, nyast först. Används av svarsformuläret. */
export async function inspectionsFor(establishmentId: string): Promise<InspectionRow[]> {
  return (
    (await readPublic(
      `inspections?select=id,inspected_at,assessment,owner_comment&establishment_id=eq.${encodeURIComponent(establishmentId)}&order=inspected_at.desc&limit=40`,
    )) ?? []
  );
}

/* Bevakning ---------------------------------------------------------------- */

export async function follows(): Promise<
  Array<{ establishment_id: string; establishment_name: string; municipality_slug: string }>
> {
  return (
    (await rest(
      'GET',
      await ownRows('follows?select=establishment_id,establishment_name,municipality_slug&order=created_at.desc'),
    )) ?? []
  );
}

export async function isFollowing(establishmentId: string): Promise<boolean> {
  const rows = await rest(
    'GET',
    await ownRows(
      `follows?select=establishment_id&establishment_id=eq.${encodeURIComponent(establishmentId)}&limit=1`,
    ),
  );
  return Array.isArray(rows) && rows.length > 0;
}

export async function follow(place: Place): Promise<void> {
  const user = currentUser();
  await rest('POST', 'follows', {
    /*
     * ignore-duplicates, ALDRIG merge-duplicates.
     *
     * merge-duplicates blir en upsert, och en upsert kräver UPDATE-rättighet.
     * Rollen authenticated har select, insert och delete på follows men aldrig
     * update, vilket är medvetet i schema_community.sql. PostgREST svarade
     * därför 403 med "permission denied for table follows", och det såg ut som
     * ett fel i inloggningen fastän det var ett fel i det här ordet.
     *
     * Semantiskt är ignore rätt ändå: att följa något man redan följer ska
     * inte skriva om raden, det ska inte göra någonting. Verifierat mot
     * databasen, två anrop i rad ger 201 båda gångerna och en enda rad.
     */
    prefer: 'resolution=ignore-duplicates',
    body: {
      user_id: user?.id,
      establishment_id: place.id,
      establishment_name: place.name,
      municipality_slug: place.municipalitySlug,
    },
  });
}

export async function unfollow(establishmentId: string): Promise<void> {
  await rest('DELETE', `follows?establishment_id=eq.${encodeURIComponent(establishmentId)}`);
}

/* Avregistrering från notismejl -------------------------------------------- */

/**
 * Länken i ett notismejl bär en token, inte en session.
 *
 * Den som just blivit störd av ett mejl ska kunna stoppa det på ett klick,
 * inte på ett klick plus en inloggningskod plus ett byte av enhet. Och sajten
 * är statisk, så det finns ingen server hos oss som kan ta emot klicket.
 *
 * Lösningen ligger i databasen: två `security definer`-funktioner som anon får
 * anropa, och ingenting annat. Anon har varken select eller delete på follows
 * och ska inte få det. Se pipeline/schema_community.sql.
 *
 * Ingen personuppgift finns i länken. Token är en slumpad uuid som bara pekar
 * ut en rad, och den försvinner med raden.
 */
export interface FollowByToken {
  /** Verksamheten länken gäller. */
  place_name: string;
  /** Hur många ANDRA verksamheter personen bevakar. */
  other_follows: number;
}

export async function followByToken(token: string): Promise<FollowByToken | null> {
  const rows = await rest('POST', 'rpc/follow_by_token', {
    auth: false,
    body: { token },
  });
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

/**
 * Tar bort bevakningen, eller alla bevakningar för samma person.
 *
 * Att sluta få mejl och att sluta bevaka är samma sak: en bevakning har ingen
 * annan funktion än att ge notiser. Ett halvläge där raden ligger kvar men är
 * tyst hade sett ut som en bevakning på kontosidan utan att vara det.
 *
 * `removed: 0` betyder att token inte finns, alltså att länken redan använts.
 */
export async function stopFollowing(
  token: string,
  everything = false,
): Promise<{ place_name: string | null; removed: number }> {
  const rows = await rest('POST', 'rpc/stop_following', {
    auth: false,
    body: { token, everything },
  });
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : { place_name: null, removed: 0 };
}

/* Omdömen ------------------------------------------------------------------ */

export interface PublishedReview {
  id: string;
  /** Texten, eller null när skribenten bara satte betyg. */
  body: string | null;
  /** Besökarens betyg 1 till 5, eller null. ALDRIG hygienbedömningen. */
  rating: number | null;
  /**
   * Månaden besöket gjordes, som 'ÅÅÅÅ-MM-01', eller null.
   *
   * Alltid den första i månaden. Databasen fäller allt annat, se
   * schema_community.sql. Dagen ska aldrig visas för en läsare.
   */
  visited_month: string | null;
  author: string;
  created_at: string;
}

/**
 * Publicerade omdömen om en verksamhet.
 *
 * Läses utan inloggning, och bara ur vyn `published_reviews`. Vyn väljer sina
 * kolumner uttryckligen, så ingen ny kolumn på tabellen kan följa med ut.
 */
export async function publishedReviews(establishmentId: string): Promise<PublishedReview[]> {
  return (
    (await rest(
      'GET',
      `published_reviews?select=id,body,rating,visited_month,author,created_at&establishment_id=eq.${encodeURIComponent(establishmentId)}&order=created_at.desc&limit=50`,
      { auth: false },
    )) ?? []
  );
}

export interface MyReview {
  id: string;
  /** Texten, eller null när omdömet bara är ett betyg. */
  body: string | null;
  rating: number | null;
  status: 'pending' | 'published' | 'rejected';
  rejection_reason: string | null;
  establishment_id: string;
  municipality_slug: string;
}

/** Alla egna omdömen, till kontosidan. */
export async function myReviews(): Promise<MyReview[]> {
  return (
    (await rest(
      'GET',
      await ownRows(
        'reviews?select=id,body,rating,status,rejection_reason,establishment_id,' +
          'municipality_slug&order=created_at.desc',
      ),
    )) ?? []
  );
}

export async function myReview(
  establishmentId: string,
): Promise<{
  id: string;
  body: string | null;
  status: string;
  rejection_reason: string | null;
} | null> {
  const rows = await rest(
    'GET',
    await ownRows(
      `reviews?select=id,body,rating,status,rejection_reason&establishment_id=eq.${encodeURIComponent(establishmentId)}&limit=1`,
    ),
  );
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

/**
 * Skickar in ett omdöme för granskning.
 *
 * Varje fält är frivilligt för sig, men raden måste bära minst ETT av betyg
 * och text. Villkoret `review_says_something` i schema_community.sql fäller
 * resten, och den här funktionen kontrollerar det inte en gång till.
 *
 * STATUSEN SKICKAS INTE HÄRIFRÅN, och ska aldrig göra det. En trigger i
 * databasen sätter den: ett betyg utan text publiceras direkt, allt som bär
 * text väntar på att en människa läst det. Skulle den här funktionen skicka
 * med en status ignoreras den, vilket är hela poängen med att regeln bor där
 * och inte här.
 *
 * Svaret är id:t på raden som skapades, eller null om den inte gick att läsa
 * tillbaka. Bilderna behöver det: `image_uploads.review_id` måste peka på ett
 * eget omdöme om samma verksamhet, annars avvisar policyn raden. Att omdömet
 * ändå är inskickat är skälet att null inte är ett fel här.
 */
export async function submitReview(
  place: Place,
  /**
   * Texten, minst 20 tecken, eller null när skribenten bara satte betyg.
   *
   * Tom sträng är INTE samma sak som null här. Databasen avvisar den, och det
   * är avsiktligt: den som inte skrev något ska stå som att ingen text finns,
   * inte som att texten är tom.
   */
  body: string | null,
  /**
   * Betyg 1 till 5, eller null.
   *
   * Frivilligt med avsikt. Den som vill berätta något behöver inte sätta en
   * siffra på det, och ett tvingande betyg hade gjort att folk klickar en
   * fyra för att komma vidare i stället för att mena den.
   */
  rating: number | null = null,
  /**
   * Besöksmånaden som 'ÅÅÅÅ-MM-01', eller null.
   *
   * Alltid den första i månaden. Databasen fäller varje annan dag och varje
   * månad som ligger i framtiden, så den här funktionen behöver inte kontrollera
   * det en gång till. Klienten är ett formulär, inte en grind.
   */
  visitedMonth: string | null = null,
): Promise<string | null> {
  const user = currentUser();

  /*
   * INGET NAMN. Omdömen är anonyma, beslutat av ägaren.
   *
   * Vyn published_reviews skriver "Besökare" när author_name är null, så
   * anonymiteten ligger i att vi aldrig skickar något. Kolumnen finns kvar i
   * tabellen men fylls inte av oss.
   *
   * Det är ett rimligt val på just den här sajten: den som skriver om en
   * restaurang i sin egen kvarter kan ha skäl att slippa stå med namn. Priset
   * är att ett anonymt omdöme väger lättare för läsaren, och att hela
   * trovärdigheten därmed vilar på att varje omdöme läses innan det
   * publiceras. Det gör den redan, se moderate.py.
   */
  const rows = await rest('POST', 'reviews', {
    prefer: 'return=representation',
    body: {
      user_id: user?.id,
      establishment_id: place.id,
      municipality_slug: place.municipalitySlug,
      body,
      rating,
      visited_month: visitedMonth,
    },
  });
  return (Array.isArray(rows) ? rows[0]?.id : rows?.id) ?? null;
}

export async function deleteReview(id: string): Promise<void> {
  await rest('DELETE', `reviews?id=eq.${encodeURIComponent(id)}`);
}

/* Notiser ------------------------------------------------------------------ */

/**
 * Klockan på kontot.
 *
 * TVÅ KÄLLOR, INTE EN TABELL. Varför står utskrivet över community.notices i
 * pipeline/schema_community.sql och upprepas inte här. Kort: en bevakad
 * verksamhets nya bedömning är en rad någon skrivit åt dig, och ett avgjort
 * omdöme är ett tillstånd på din egen rad. Det andra behöver ingen kopia.
 *
 * Läsmarkeringen ligger i databasen och ALDRIG i localStorage. De enda
 * nycklar som får finnas hos besökaren utan samtycke är `prikko.session` och
 * `prikko.next`, och /cookies påstår att listan är uttömmande. Se
 * docs/14_samtycke_och_lagring_i_webblasaren.md.
 */

/** En rad ur community.notices. */
export interface NoticeRow {
  id: string;
  establishment_id: string;
  municipality_slug: string;
  establishment_name: string;
  establishment_slug: string;
  inspection_id: string;
  inspected_at: string;
  verdict: 'minor' | 'major';
  created_at: string;
}

/** Ett avgjort omdöme, alltså ett som en människa tagit ställning till. */
export interface ReviewNotice {
  id: string;
  establishment_id: string;
  municipality_slug: string;
  body: string | null;
  rating: number | null;
  status: 'published' | 'rejected';
  rejection_reason: string | null;
  moderated_at: string;
}

/**
 * Antalet olästa notiser.
 *
 * ETT anrop, inte tre. Räkningen görs av community.unread_notices() i
 * databasen eftersom klockan sitter i sidhuvudet och sidhuvudet ligger på
 * 15 500 sidor. Funktionen är `security invoker` och skriver ut
 * `user_id = auth.uid()` i varje gren, alltså samma disciplin som ownRows()
 * kräver av varje läsning här.
 *
 * Svarar databasen inte alls, vilket den gör tills ägaren kört om
 * schema_community.sql, är noll rätt svar. En klocka som ropar om ett fel
 * ingen besökare kan åtgärda är sämre än ingen klocka.
 */
export async function unreadNotices(): Promise<number> {
  try {
    const value = await rest('POST', 'rpc/unread_notices', { body: {} });
    return typeof value === 'number' && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

/** Notiserna om bevakade verksamheter, nyast först. */
export async function notices(): Promise<NoticeRow[]> {
  return (
    (await rest(
      'GET',
      await ownRows(
        'notices?select=id,establishment_id,municipality_slug,establishment_name,establishment_slug,inspection_id,inspected_at,verdict,created_at&order=created_at.desc&limit=50',
      ),
    )) ?? []
  );
}

/**
 * Egna omdömen som fått ett besked, nyast först.
 *
 * `moderated_by=not.like.automatik:*` fäller de betyg som publicerats direkt
 * av community.set_review_status(). En notis om dem hade kommit i samma
 * sekund som man tryckte skicka, och klockan ska bära vad någon annan gjort.
 * Filtret står som villkor och inte i utsökningen med flit: moderatorns
 * identitet ska inte lämna databasen bara för att den behövde läsas.
 *
 * Samma regel finns i community.unread_notices(). Ändras den ena måste den
 * andra följa med, annars räknar pricken något annat än listan visar.
 */
export async function reviewNotices(): Promise<ReviewNotice[]> {
  return (
    (await rest(
      'GET',
      await ownRows(
        'reviews?select=id,establishment_id,municipality_slug,body,rating,status,rejection_reason,moderated_at&moderated_at=not.is.null&moderated_by=not.like.automatik:*&order=moderated_at.desc&limit=50',
      ),
    )) ?? []
  );
}

/** Tidpunkten allt äldre räknas som läst. Null när kontot aldrig öppnat listan. */
export async function noticesReadAt(): Promise<string | null> {
  const rows = await rest('GET', await ownRows('notice_reads?select=read_at&limit=1'));
  return Array.isArray(rows) && rows.length > 0 ? (rows[0].read_at ?? null) : null;
}

/**
 * Flyttar vattenlinjen till nu.
 *
 * `merge-duplicates`, alltså en upsert, och den kräver UPDATE-rättighet.
 * Rollen authenticated har select, insert och update på notice_reads men
 * ingen delete: raden ÄR markeringen, och en borttagen rad betyder aldrig
 * läst. Se follow() ovan för samma fälla åt andra hållet.
 */
export async function markNoticesRead(): Promise<void> {
  const user = currentUser();
  await rest('POST', 'notice_reads?on_conflict=user_id', {
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: { user_id: user?.id, read_at: new Date().toISOString() },
  });
}

/** Namn och slug för en handfull anläggningar, ur den redaktionella databasen. */
export interface PlaceName {
  id: string;
  name: string;
  slug: string;
  municipality_slug: string;
}

/**
 * Slår upp verksamheter på id.
 *
 * Omdömestabellen bär inget namn — den lagrar `establishment_id` och
 * kommunens slug, ingenting annat, och ska inte lagra mer. Namnet hämtas
 * därför där det hör hemma: i den redaktionella databasen, med GET och utan
 * inloggning. Vyn publishable_establishments och inte tabellen, av samma skäl
 * som överallt annars: vyn väljer sina kolumner uttryckligen.
 *
 * En verksamhet som avpublicerats sedan omdömet skrevs saknas i svaret, och
 * anroparen får då skriva notisen utan namn i stället för att utelämna den.
 */
export async function placeNames(ids: string[]): Promise<Map<string, PlaceName>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return new Map();

  const list = unique.map((id) => `"${id}"`).join(',');
  const rows: PlaceName[] =
    (await readPublic(
      `publishable_establishments?select=id,name,slug,municipality_slug&id=in.(${encodeURIComponent(list)})`,
    )) ?? [];
  return new Map(rows.map((row) => [row.id, row]));
}


/* Anspråk och svar --------------------------------------------------------- */

export interface Claim {
  id: string;
  establishment_id: string;
  establishment_name: string;
  municipality_slug: string;
  status: 'pending' | 'published' | 'rejected';
  rejection_reason: string | null;
}

export async function claims(): Promise<Claim[]> {
  return (
    (await rest(
      'GET',
      await ownRows(
        'establishment_claims?select=id,establishment_id,establishment_name,municipality_slug,status,rejection_reason&order=created_at.desc',
      ),
    )) ?? []
  );
}

export async function claimFor(establishmentId: string): Promise<Claim | null> {
  const rows = await rest(
    'GET',
    await ownRows(
      `establishment_claims?select=id,establishment_id,establishment_name,municipality_slug,status,rejection_reason&establishment_id=eq.${encodeURIComponent(establishmentId)}&limit=1`,
    ),
  );
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export async function submitClaim(
  place: Place,
  fields: {
    claimantName: string;
    claimantRole: string;
    organizationNumber: string;
    contactEmail: string;
    contactPhone: string;
  },
): Promise<void> {
  const user = currentUser();
  await rest('POST', 'establishment_claims', {
    body: {
      user_id: user?.id,
      establishment_id: place.id,
      establishment_name: place.name,
      municipality_slug: place.municipalitySlug,
      claimant_name: fields.claimantName,
      claimant_role: fields.claimantRole,
      organization_number: fields.organizationNumber || null,
      contact_email: fields.contactEmail,
      contact_phone: fields.contactPhone || null,
    },
  });
}

export interface OwnerResponse {
  id: string;
  inspection_id: string;
  body: string;
  status: 'pending' | 'published' | 'rejected';
  rejection_reason: string | null;
}

export async function ownerResponses(establishmentId: string): Promise<OwnerResponse[]> {
  return (
    (await rest(
      'GET',
      await ownRows(
        `owner_responses?select=id,inspection_id,body,status,rejection_reason&establishment_id=eq.${encodeURIComponent(establishmentId)}`,
      ),
    )) ?? []
  );
}

export async function submitOwnerResponse(
  place: Place,
  inspectionId: string,
  body: string,
): Promise<void> {
  const user = currentUser();
  await rest('POST', 'owner_responses', {
    body: {
      user_id: user?.id,
      establishment_id: place.id,
      municipality_slug: place.municipalitySlug,
      inspection_id: inspectionId,
      body,
    },
  });
}

/* Bilder ------------------------------------------------------------------- */

/*
 * BILDER KOMMER FRÅN BESÖKARE, INTE FRÅN VERKSAMHETEN.
 *
 * En bild kan skickas in ensam, utan ett ord skrivet. Skrivs den tillsammans
 * med ett omdöme knyts den till det och följer med om omdömet raderas, men
 * omdömet är frivilligt. Den som företräder verksamheten kan inte ladda upp
 * här; policyn image_uploads_insert i schema_community.sql stänger den vägen,
 * och ägarens egen bildyta är en betaltjänst som inte finns i någon form i dag.
 *
 * Reglerna bor i databasen, som allt annat i den här filen. Kontrollerna nedan
 * är ett formulär, inte en grind.
 */

const INBOX_BUCKET = 'verksamhetsbilder-inkomna';
const PUBLIC_BUCKET = 'verksamhetsbilder';

/** Största fil vi tar emot INNAN komprimering. Bucketen har samma tak. */
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Längsta sidan på den bild som faktiskt skickas.
 *
 * En telefonbild är åtta megapixel och flera megabyte. Ytan den visas i är som
 * mest ett par hundra pixlar bred, och en granskare tittar på den i ett fönster
 * som inte heller är större. 1600 räcker till en skarp bild på en näthinneskärm
 * och gör en fil på sex megabyte till en på ett par hundra kilobyte.
 *
 * Det som annars hade hänt är inte främst att lagringen fylls: det är att den
 * som står i en restaurang på en mobiluppkoppling väntar en halv minut per bild
 * och avbryter.
 */
const MAX_EDGE = 1600;

export interface Upload {
  id: string;
  establishment_id: string;
  municipality_slug: string;
  /** Sökvägen i inkorgen. Behövs för att kunna ta bort filen, inte bara raden. */
  storage_path: string;
  caption: string | null;
  status: 'pending' | 'published' | 'rejected';
  rejection_reason: string | null;
  published_url: string | null;
}

/**
 * Alla egna bilder, till kontosidan.
 *
 * Hämtas utan filter på verksamhet, till skillnad från förut. Den gamla
 * varianten tog ett establishment_id och kontosidan gick igenom sina GODKÄNDA
 * ANSPRÅK för att hitta id:n att fråga med. Den vägen kan aldrig ge något
 * längre: den som företräder en verksamhet får inte ladda upp bilder, så
 * listan hade alltid varit tom och besökarens egna bilder hade aldrig synts.
 *
 * Att de syns är inte en bekvämlighet. Ett avslag bär ett skäl, och moderate.py
 * säger till granskaren att skälet visas för avsändaren på hens kontosida. Det
 * löftet hålls här.
 */
export async function myUploads(): Promise<Upload[]> {
  return (
    (await rest(
      'GET',
      await ownRows(
        'image_uploads?select=id,establishment_id,municipality_slug,storage_path,caption,status,rejection_reason,published_url&order=created_at.desc&limit=50',
      ),
    )) ?? []
  );
}

/**
 * Tar tillbaka en bild man skickat in.
 *
 * FILEN FÖRST, RADEN SEDAN, alltså tvärtom mot uppladdningen. Skälet är
 * detsamma i båda fallen: den ofarliga riktningen vinner. Vid uppladdning är en
 * rad utan fil ofarlig och en fil utan rad farlig; vid borttagning är det
 * likadant, för en rad som ligger kvar visar bara en bild som fortfarande finns,
 * medan en fil som ligger kvar efter en borttagen rad är en publik URL ingen
 * längre kan nå eller städa bort.
 *
 * Två filer kan finnas: originalet i den privata inkorgen, och kopian i den
 * publika bucketen om bilden hann publiceras. Båda tas bort. Att en av dem
 * redan är borta är inget fel, och stoppar inte borttagningen.
 */
export async function deleteUpload(upload: Upload): Promise<void> {
  const token = await validToken();
  if (!token) throw new CommunityError('Du är utloggad. Logga in igen.');

  const objects: Array<[string, string]> = [[INBOX_BUCKET, upload.storage_path]];
  if (upload.published_url) {
    objects.push([PUBLIC_BUCKET, upload.storage_path.replace(/^pending\//, '')]);
  }

  for (const [bucket, path] of objects) {
    try {
      await fetch(`${URL_BASE}/storage/v1/object/${bucket}/${path}`, {
        method: 'DELETE',
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
      });
    } catch {
      /* Filen får bli kvar. Raden ska bort ändå: bilden slutar visas, och en
         föräldralös fil är något redaktionen kan städa, medan en rad man inte
         kan ta bort är något besökaren står maktlös inför. */
    }
  }

  await rest('DELETE', `image_uploads?id=eq.${encodeURIComponent(upload.id)}`);
}

export interface PublishedImage {
  id: string;
  published_url: string;
  created_at: string;
}

/**
 * Publicerade bilder på en verksamhet.
 *
 * Läses utan inloggning, och bara ur vyn `published_images`. Vyn väljer sina
 * kolumner uttryckligen och bär varken uppladdarens id eller något namn: en
 * bild bredvid ett anonymt omdöme får inte vara vägen till att identifiera den
 * som skrev det.
 */
export async function publishedImages(establishmentId: string): Promise<PublishedImage[]> {
  return (
    (await rest(
      'GET',
      `published_images?select=id,published_url,created_at&establishment_id=eq.${encodeURIComponent(establishmentId)}&order=created_at.desc&limit=24`,
      { auth: false },
    )) ?? []
  );
}

/**
 * Ritar om bilden mindre innan den lämnar datorn.
 *
 * Tre saker händer på en gång, och bara den första är syftet:
 *
 *   1. Filen blir liten. Se MAX_EDGE ovan.
 *   2. EXIF FÖRSVINNER. En canvas bär ingen metadata, så GPS-koordinat,
 *      tidsstämpel, kameramodell och serienummer finns inte kvar i det som
 *      skickas. Det är inte en bonus utan ett krav sedan omdömen blev anonyma:
 *      en bild med koordinaten till fotografens hem i sig är inte anonym. Den
 *      som en dag flyttar eller tar bort komprimeringen måste veta det.
 *      Se docs/13_bilder_och_verksamhetsdata.md, del C5.
 *   3. Riktningen bakas in. `imageOrientation: 'from-image'` gör att en bild
 *      tagen med telefonen på högkant blir stående i filen i stället för att
 *      bero på en EXIF-tagg vi just tagit bort.
 *
 * Faller något tillbaka på originalfilen. En bild som inte gick att rita om är
 * fortfarande en bild, och databasen tar emot JPEG, PNG och WebP upp till
 * åtta megabyte. Då följer däremot EXIF med, vilket är skälet att fallet är
 * just ett fall och inte ett alternativ.
 */
async function shrink(file: File): Promise<File> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      /* JPEG och inte WebP. Kvaliteten är likvärdig vid de här måtten, och
         JPEG kan varje webbläsare skriva. Safari kunde länge inte, och en
         `toBlob` som tyst ger null är svårare att upptäcka än en stor fil. */
      canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.82);
    });
    if (!blob) return file;

    /* Bara om det faktiskt blev bättre. En liten bild som redan är en JPEG kan
       bli större av att kodas om, och då är originalet rätt fil att skicka. */
    if (blob.size >= file.size && file.type === 'image/jpeg') return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    bitmap.close();
  }
}

/**
 * Skickar in en bild för granskning.
 *
 * RADEN SKRIVS FÖRST, FILEN SEDAN, och den ordningen är vänd mot hur det såg ut
 * när bara registerkontrollerade företrädare kunde ladda upp. Skälet står i
 * docs/13, del C2: policyn på storage.objects kan bara se vilken mapp en fil
 * hamnar i. Skrevs filen först skulle vem som helst med ett konto kunna fylla
 * bucketen utan att skapa en enda rad, och varje kvot i databasen hade vaktat
 * en dörr ingen behövde gå igenom.
 *
 * Nu är bucketen stängd som förval: `inkomna_upload_own` kräver att det redan
 * finns en väntande rad som pekar på exakt den sökvägen. Databasen delar alltså
 * ut platsen, och kvoterna sitter där de kan räknas.
 *
 * Går uppladdningen fel tas raden bort igen. En rad utan fil är ofarlig, den
 * kan inte visas någonstans, men den kostar en människa ett klick i
 * granskningskön för att upptäcka att det inte finns någon bild att titta på.
 */
export async function uploadImage(
  place: Place,
  file: File,
  /**
   * Omdömet bilden hör till, eller null.
   *
   * FRIVILLIGT. En bild kan skickas in utan att någon skrivit något. Är det
   * satt knyts bilden till omdömet och följer med om det raderas; policyn
   * kräver då att omdömet är ens eget och gäller samma verksamhet.
   */
  reviewId: string | null = null,
): Promise<void> {
  const user = currentUser();
  if (!user) throw new CommunityError('Du är utloggad. Logga in igen.');

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type))
    throw new CommunityError('Bilden måste vara JPEG, PNG eller WebP.');
  if (file.size > MAX_UPLOAD_BYTES) throw new CommunityError('Bilden får vara högst 8 MB.');

  const token = await validToken();
  if (!token) throw new CommunityError('Du är utloggad. Logga in igen.');

  const sending = await shrink(file);
  const suffix =
    sending.type === 'image/png' ? 'png' : sending.type === 'image/webp' ? 'webp' : 'jpg';
  /* Sökvägens form är inte fri. community.set_image_status() fäller varje rad
     som inte ligger under uppladdarens egen mapp, och storage-policyn kräver
     samma sak från andra hållet. */
  const path = `pending/${user.id}/${crypto.randomUUID()}.${suffix}`;

  const rows = await rest('POST', 'image_uploads', {
    prefer: 'return=representation',
    body: {
      user_id: user.id,
      establishment_id: place.id,
      municipality_slug: place.municipalitySlug,
      review_id: reviewId || null,
      storage_path: path,
      content_type: sending.type,
      byte_size: sending.size,
      /* Uppladdarens försäkran om att bilden är hens egen. Skickas som ett
         värde och inte som ett antagande: rutan i formuläret är det som gör
         den sann, och policyn kräver true. */
      rights_confirmed: true,
    },
  });
  const rowId: string | undefined = Array.isArray(rows) ? rows[0]?.id : rows?.id;

  try {
    const res = await fetch(`${URL_BASE}/storage/v1/object/${INBOX_BUCKET}/${path}`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': sending.type,
      },
      body: sending,
    });
    if (!res.ok) await fail(res);
  } catch (err) {
    if (rowId) {
      try {
        await rest('DELETE', `image_uploads?id=eq.${encodeURIComponent(rowId)}`);
      } catch {
        /* Raden blir kvar som en tom plats i kön. Det felet ska inte skugga
           det som faktiskt gick fel, alltså uppladdningen. */
      }
    }
    throw err;
  }
}
