/**
 * Företagsytan: vad en godkänd företrädare fyller på med.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR DEN HÄR FILEN INTE ÄR EN DEL AV community.ts
 * ---------------------------------------------------------------------------
 * Den borde vara det, och bör flyttas dit när det går. Skälet att den ligger
 * här är att community.ts skrivs om samtidigt av besökarbilderna, och två
 * skrivningar i samma fil samma dag blir en sammanslagning som ingen ville
 * göra. Det som lånas därifrån lånas via export: sessionen förnyas på ETT
 * ställe, aldrig två.
 *
 * ---------------------------------------------------------------------------
 * VAD FILEN INTE GÖR
 * ---------------------------------------------------------------------------
 * Ingen regel bor här. Att bara en godkänd företrädare får skriva står som
 * radsäkerhet i pipeline/schema_foretagsyta.sql. Att texten inte kan ändras
 * efter insändning står som trigger i samma fil. Den här filen är ett
 * formulär, inte en grind, precis som community.ts säger om sig själv.
 *
 * Bedömningen, kontrollhistoriken och utmärkelsen finns inte i den här filen
 * och ska aldrig göra det.
 */

import { CommunityError, configured, currentUser, signedIn } from './community';

export { CommunityError, configured };

const URL_BASE = (import.meta.env.PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
const ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Samma nyckel som community.ts skriver sessionen under. */
const STORAGE_KEY = 'prikko.session';

/**
 * Giltig access token, eller null.
 *
 * signedIn() i community.ts förnyar sessionen när den håller på att gå ut och
 * skriver tillbaka den till localStorage. Vi frågar därför den först och läser
 * token efteråt, i stället för att skriva en egen förnyelse. Två förnyelser
 * som körs parallellt ogiltigförklarar varandra, och den buggen är redan
 * betald för en gång.
 */
async function token(): Promise<string | null> {
  if (!(await signedIn())) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? ((JSON.parse(raw)?.accessToken as string) ?? null) : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------------ */
/* Nivå                                                                      */
/* ------------------------------------------------------------------------ */

/**
 * Vad varje nivå får göra.
 *
 * Tjänsten är gratis nu och kan kosta senare. Den dagen ska skillnaden vara
 * en uppgift på anspråket och den här tabellen, inte en villkorssats i varje
 * sidmall. `gratis` får allt som är byggt i dag; `plus` finns för att raden
 * ska gå att flytta utan att någon skriver om en enda vy.
 *
 * Håller gränsen pengar en dag måste den också stå som policy i databasen.
 * Det som står här stoppar ett misstag, inte en motståndare.
 */
export interface Niva {
  /** Längsta presentationstext. */
  presentation: number;
  oppettider: boolean;
  telefon: boolean;
  lankar: boolean;
}

export const NIVAER: Record<string, Niva> = {
  gratis: { presentation: 1500, oppettider: true, telefon: true, lankar: true },
  plus: { presentation: 1500, oppettider: true, telefon: true, lankar: true },
};

export function nivaFor(tier: string | null | undefined): Niva {
  return NIVAER[tier ?? 'gratis'] ?? NIVAER.gratis;
}

/* ------------------------------------------------------------------------ */
/* Nätet                                                                     */
/* ------------------------------------------------------------------------ */

async function rest(
  method: string,
  path: string,
  options: { body?: unknown; prefer?: string; anon?: boolean } = {},
): Promise<any> {
  if (!configured) throw new CommunityError('Funktionen är inte konfigurerad.');

  const headers: Record<string, string> = {
    apikey: ANON_KEY,
    'Accept-Profile': 'community',
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  /* Content-Profile på varje skrivande metod, inte bara när det finns en
     kropp. En DELETE utan den hamnar i public och nekas där. */
  if (method !== 'GET' && method !== 'HEAD') headers['Content-Profile'] = 'community';
  if (options.prefer) headers.Prefer = options.prefer;

  if (options.anon) {
    headers.Authorization = `Bearer ${ANON_KEY}`;
  } else {
    const t = await token();
    if (!t) throw new CommunityError('Du är utloggad. Logga in igen.');
    headers.Authorization = `Bearer ${t}`;
  }

  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    method,
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });

  if (!res.ok) {
    let message = `Något gick fel (${res.status}).`;
    try {
      const payload = JSON.parse(await res.text());
      /* Databasens egna fel är redan skrivna på svenska och ska visas
         ordagrant. Se check_profile() och freeze_profile(). */
      message = payload?.message || payload?.hint || message;
    } catch {
      /* Tomt eller trasigt svar. Meddelandet ovan får stå. */
    }
    throw new CommunityError(message);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Lägger ägarfiltret på en läsning av egna rader.
 *
 * Samma regel som ownRows() i community.ts, och den finns av samma skäl:
 * radsäkerhet är inte ett filter. business_profiles har två läspolicyer som
 * läggs ihop med ELLER, egna rader och allas publicerade. En fråga utan eget
 * filter får tillbaka andras publicerade uppgifter, och sidan hade målat dem
 * som ens egna.
 *
 * pipeline/tests/test_egna_rader.py läser den här filen och fäller bygget om
 * en GET mot business_profiles går förbi den här funktionen.
 */
async function ownRows(path: string): Promise<string> {
  const user = currentUser();
  if (!user?.id) throw new CommunityError('Du är utloggad. Logga in igen.');
  return `${path}${path.includes('?') ? '&' : '?'}user_id=eq.${encodeURIComponent(user.id)}`;
}

/* ------------------------------------------------------------------------ */
/* Uppgifterna                                                               */
/* ------------------------------------------------------------------------ */

export const DAGAR = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Dag = (typeof DAGAR)[number];

export const DAGNAMN: Record<Dag, string> = {
  mon: 'Måndag',
  tue: 'Tisdag',
  wed: 'Onsdag',
  thu: 'Torsdag',
  fri: 'Fredag',
  sat: 'Lördag',
  sun: 'Söndag',
};

export type Oppettid = { closed: true } | { from: string; to: string };
export type Oppettider = Partial<Record<Dag, Oppettid>>;

export interface Foretagsuppgifter {
  presentation: string | null;
  opening_hours: Oppettider | null;
  phone: string | null;
  website: string | null;
  booking_url: string | null;
}

export interface Insandning extends Foretagsuppgifter {
  id: string;
  status: 'pending' | 'published' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
}

const FALT = 'id,presentation,opening_hours,phone,website,booking_url,status,rejection_reason,created_at';

/** Nivån på det godkända anspråket, eller null om det inte finns något. */
export async function tierFor(establishmentId: string): Promise<string | null> {
  const rows = await rest(
    'GET',
    await ownRows(
      `establishment_claims?select=tier&status=eq.published&establishment_id=eq.${encodeURIComponent(
        establishmentId,
      )}&limit=1`,
    ),
  );
  return Array.isArray(rows) && rows.length > 0 ? (rows[0].tier ?? 'gratis') : null;
}

/** Egna insändningar för en verksamhet, nyast först. */
export async function insandningar(establishmentId: string): Promise<Insandning[]> {
  return (
    (await rest(
      'GET',
      await ownRows(
        `business_profiles?select=${FALT}&establishment_id=eq.${encodeURIComponent(
          establishmentId,
        )}&order=created_at.desc`,
      ),
    )) ?? []
  );
}

/**
 * De uppgifter som visas för besökare i dag.
 *
 * Läses utan inloggning, för det är samma rad som verksamhetssidan ska hämta
 * när den börjar visa den. Vyn tar den senast publicerade insändningen.
 */
export async function publiceradeUppgifter(
  establishmentId: string,
): Promise<Foretagsuppgifter | null> {
  const rows = await rest(
    'GET',
    `published_profiles?select=presentation,opening_hours,phone,website,booking_url&establishment_id=eq.${encodeURIComponent(
      establishmentId,
    )}&limit=1`,
    { anon: true },
  );
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export interface Place {
  id: string;
  name: string;
  municipalitySlug: string;
}

/** Tomt fält ska bli null och inte tom sträng, annars faller profile_not_empty. */
function eller(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function skickaUppgifter(
  place: Place,
  fields: {
    presentation: string;
    openingHours: Oppettider | null;
    phone: string;
    website: string;
    bookingUrl: string;
  },
): Promise<void> {
  const user = currentUser();
  if (!user) throw new CommunityError('Du är utloggad. Logga in igen.');

  const hours =
    fields.openingHours && Object.keys(fields.openingHours).length > 0
      ? fields.openingHours
      : null;

  const body = {
    user_id: user.id,
    establishment_id: place.id,
    municipality_slug: place.municipalitySlug,
    presentation: eller(fields.presentation),
    opening_hours: hours,
    phone: eller(fields.phone),
    website: eller(fields.website),
    booking_url: eller(fields.bookingUrl),
  };

  if (
    body.presentation === null &&
    body.opening_hours === null &&
    body.phone === null &&
    body.website === null &&
    body.booking_url === null
  ) {
    throw new CommunityError('Fyll i minst en uppgift.');
  }

  await rest('POST', 'business_profiles', { body });
}

/**
 * Löser in koden ur ett brev.
 *
 * Hela prövningen sker i community.redeem_letter_code(). Den är security
 * definer, för att sätta ett anspråk till godkänt är precis det en inloggad
 * inte får göra själv. Att räkna försök, jämföra hashen och kolla utgångstid
 * hör därför hemma där och inte här: det som körs i webbläsaren kan läsas och
 * ändras av den som ska hindras.
 *
 * Funktionen svarar med en mening på svenska, och fel kastas som undantag med
 * svensk text. Båda visas ordagrant.
 */
export async function losInKod(establishmentId: string, code: string): Promise<string> {
  const answer = await rest('POST', 'rpc/redeem_letter_code', {
    body: { p_establishment_id: establishmentId, p_code: code },
  });
  return typeof answer === 'string' && answer.length > 0
    ? answer
    : 'Klart. Du är godkänd som företrädare för verksamheten.';
}

/**
 * Drar tillbaka en insändning som ännu inte granskats.
 *
 * Policyn släpper bara egna rader med status pending, så en publicerad
 * uppgift kan inte försvinna den här vägen. Filtret står ändå med i frågan:
 * radsäkerhet är inte ett filter, och en bredare policy i morgon ska inte
 * kunna göra den här raden till en radering av något annat.
 */
export async function angraInsandning(id: string): Promise<void> {
  await rest(
    'DELETE',
    await ownRows(
      `business_profiles?id=eq.${encodeURIComponent(id)}&status=eq.pending`,
    ),
  );
}
