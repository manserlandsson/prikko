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
 * Varje anrop härifrån pekar uttryckligen på `community`. Det finns ingen kod
 * i den här filen som kan nå `public`, och det är avsiktligt: den redaktionella
 * databasen ska inte kunna röras från en webbläsare ens av misstag.
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
    (await rest('GET', 'follows?select=establishment_id,establishment_name,municipality_slug&order=created_at.desc')) ?? []
  );
}

export async function isFollowing(establishmentId: string): Promise<boolean> {
  const rows = await rest(
    'GET',
    `follows?select=establishment_id&establishment_id=eq.${encodeURIComponent(establishmentId)}&limit=1`,
  );
  return Array.isArray(rows) && rows.length > 0;
}

export async function follow(place: Place): Promise<void> {
  const user = currentUser();
  await rest('POST', 'follows', {
    prefer: 'resolution=merge-duplicates',
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

/* Omdömen ------------------------------------------------------------------ */

export interface PublishedReview {
  id: string;
  body: string;
  /** Besökarens betyg 1 till 5, eller null. ALDRIG hygienbedömningen. */
  rating: number | null;
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
      `published_reviews?select=id,body,rating,author,created_at&establishment_id=eq.${encodeURIComponent(establishmentId)}&order=created_at.desc&limit=50`,
      { auth: false },
    )) ?? []
  );
}

export interface MyReview {
  id: string;
  body: string;
  rating: number | null;
  status: 'pending' | 'published' | 'rejected';
  rejection_reason: string | null;
}

/** Alla egna omdömen, till kontosidan. */
export async function myReviews(): Promise<MyReview[]> {
  return (
    (await rest(
      'GET',
      'reviews?select=id,body,rating,status,rejection_reason&order=created_at.desc',
    )) ?? []
  );
}

export async function myReview(
  establishmentId: string,
): Promise<{ id: string; body: string; status: string; rejection_reason: string | null } | null> {
  const rows = await rest(
    'GET',
    `reviews?select=id,body,rating,status,rejection_reason&establishment_id=eq.${encodeURIComponent(establishmentId)}&limit=1`,
  );
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

/**
 * Skickar in ett omdöme för granskning.
 *
 * Visningsnamnet KOPIERAS hit i stället för att slås upp vid läsning. Den
 * publika vyn får då stå för sig själv utan att röra profiltabellen, som anon
 * inte ska komma åt. Namnet blir också det som gällde när omdömet skrevs,
 * vilket är rätt för ett yttrande som fryses vid insändning.
 */
export async function submitReview(
  place: Place,
  body: string,
  /**
   * Betyg 1 till 5, eller null.
   *
   * Frivilligt med avsikt. Den som vill berätta något behöver inte sätta en
   * siffra på det, och ett tvingande betyg hade gjort att folk klickar en
   * fyra för att komma vidare i stället för att mena den.
   */
  rating: number | null = null,
): Promise<void> {
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
  await rest('POST', 'reviews', {
    body: {
      user_id: user?.id,
      establishment_id: place.id,
      municipality_slug: place.municipalitySlug,
      body,
      rating,
    },
  });
}

export async function deleteReview(id: string): Promise<void> {
  await rest('DELETE', `reviews?id=eq.${encodeURIComponent(id)}`);
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
      'establishment_claims?select=id,establishment_id,establishment_name,municipality_slug,status,rejection_reason&order=created_at.desc',
    )) ?? []
  );
}

export async function claimFor(establishmentId: string): Promise<Claim | null> {
  const rows = await rest(
    'GET',
    `establishment_claims?select=id,establishment_id,establishment_name,municipality_slug,status,rejection_reason&establishment_id=eq.${encodeURIComponent(establishmentId)}&limit=1`,
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
      `owner_responses?select=id,inspection_id,body,status,rejection_reason&establishment_id=eq.${encodeURIComponent(establishmentId)}`,
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

const INBOX_BUCKET = 'verksamhetsbilder-inkomna';

export interface Upload {
  id: string;
  caption: string | null;
  status: 'pending' | 'published' | 'rejected';
  rejection_reason: string | null;
  published_url: string | null;
}

export async function uploads(establishmentId: string): Promise<Upload[]> {
  return (
    (await rest(
      'GET',
      `image_uploads?select=id,caption,status,rejection_reason,published_url&establishment_id=eq.${encodeURIComponent(establishmentId)}&order=created_at.desc`,
    )) ?? []
  );
}

/**
 * Laddar upp en bild till den PRIVATA inkorgen och registrerar den för
 * granskning.
 *
 * Två steg som båda kan misslyckas var för sig. Filen skrivs först, raden
 * sedan. Blir raden inte skriven ligger filen kvar utan att någon vet om den,
 * vilket är den ofarliga riktningen: en fil utan rad är osynlig för alla,
 * medan en rad utan fil hade sett ut som en väntande bild i granskningen.
 */
export async function uploadImage(
  place: Place,
  file: File,
  caption: string,
): Promise<void> {
  const user = currentUser();
  if (!user) throw new CommunityError('Du är utloggad. Logga in igen.');

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type))
    throw new CommunityError('Bilden måste vara JPEG, PNG eller WebP.');
  if (file.size > 8 * 1024 * 1024) throw new CommunityError('Bilden får vara högst 8 MB.');

  const token = await validToken();
  if (!token) throw new CommunityError('Du är utloggad. Logga in igen.');

  const suffix = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `pending/${user.id}/${crypto.randomUUID()}.${suffix}`;

  const res = await fetch(`${URL_BASE}/storage/v1/object/${INBOX_BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': file.type,
    },
    body: file,
  });
  if (!res.ok) await fail(res);

  await rest('POST', 'image_uploads', {
    body: {
      user_id: user.id,
      establishment_id: place.id,
      municipality_slug: place.municipalitySlug,
      storage_path: path,
      content_type: file.type,
      byte_size: file.size,
      caption: caption || null,
    },
  });
}
