/**
 * Granskningen, i webbläsaren.
 *
 * ---------------------------------------------------------------------------
 * VAD DEN HÄR FILEN INTE ÄR
 * ---------------------------------------------------------------------------
 * Den är inte en behörighet. Sajten är statiskt genererad och anon-nyckeln
 * ligger öppet i varje byggd sida, alltså finns det ingen server hos oss som
 * kan skydda något. Varje spärr står i pipeline/schema_admin.sql:
 *
 *   community.admins        vem redaktionen är. Skrivbar bara av service_role.
 *   community.is_admin()    frågan varje policy och varje beslutsfunktion ställer.
 *   community.moderate_*()  den enda vägen från pending till published.
 *
 * Ingen e-postadress står som villkor i den här filen, och ingen får någonsin
 * göra det. Att sidan döljer sig för den som inte är admin är bekvämlighet. Att
 * databasen svarar 42501 är spärren. Den som tar bort allt i den här filen kan
 * fortfarande inte publicera en enda rad.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR DEN INTE LIGGER I community.ts
 * ---------------------------------------------------------------------------
 * Samma skäl som foretag.ts anger om sig själv: filen skrivs om av flera händer
 * samtidigt, och två skrivningar samma dag blir en sammanslagning ingen ville
 * göra. Det som lånas därifrån lånas via export, så sessionen förnyas på ETT
 * ställe.
 *
 * Det finns ett skäl till: pipeline/tests/test_egna_rader.py läser community.ts
 * och fäller bygget om en GET mot en användartabell saknar ägarfiltret. Den
 * regeln är riktig där och FEL här. Granskningen ska med avsikt läsa andras
 * rader, och den läsningen hör därför hemma i en fil där regeln inte gäller,
 * inte i ett undantag inuti den fil regeln vaktar.
 *
 * ---------------------------------------------------------------------------
 * TERMINALVERKTYGET FINNS KVAR
 * ---------------------------------------------------------------------------
 * pipeline/moderate.py kör med service_role och går förbi allt det här. Det är
 * reserven: går inloggningen sönder, eller står en bild i ett format
 * webbläsaren inte kan avkoda, är den vägen fortfarande öppen.
 */

import { CommunityError, configured, currentUser, signedIn } from './community';

export { CommunityError, configured, currentUser, signedIn };

const URL_BASE = (import.meta.env.PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
const ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';

const SCHEMA = 'community';
const INKORG = 'verksamhetsbilder-inkomna';
const PUBLIK = 'verksamhetsbilder';

/** Samma nyckel som community.ts skriver sessionen under. */
const STORAGE_KEY = 'prikko.session';

/**
 * Längsta sidan på en bild vi själva skriver till den publika hinken.
 *
 * Samma mått som MAX_EDGE i community.ts och i pipeline/moderate.py. En bild ska
 * väga lika lite oavsett vilken av de tre vägarna den tog.
 */
const MAX_KANT = 1600;

/**
 * Format som inte får nå den publika hinken.
 *
 * Hinken avvisar dem också, se schema_community.sql, så det här är inte den enda
 * spärren. Chrome och Firefox kan inte avkoda HEIC, och en publicerad HEIC hade
 * varit osynlig för de flesta besökare.
 */
const BEHOVER_KONVERTERING = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

/**
 * Giltig access token, eller null.
 *
 * signedIn() i community.ts förnyar sessionen när den håller på att gå ut. Vi
 * frågar den först och läser token efteråt i stället för att skriva en egen
 * förnyelse: två parallella förnyelser ogiltigförklarar varandra.
 */
async function token(): Promise<string> {
  if (!(await signedIn())) throw new CommunityError('Du är utloggad. Logga in igen.');
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const t = raw ? ((JSON.parse(raw)?.accessToken as string) ?? null) : null;
    if (!t) throw new Error();
    return t;
  } catch {
    throw new CommunityError('Du är utloggad. Logga in igen.');
  }
}

async function fel(res: Response): Promise<never> {
  let kropp: any = {};
  try {
    kropp = await res.json();
  } catch {
    /* Tomt svar. */
  }
  const text =
    kropp.message || kropp.msg || kropp.error_description || kropp.error || res.statusText;
  /* Databasens meddelanden är skrivna på svenska och för den som läser dem, se
     beslutsfunktionerna i schema_admin.sql. De skickas därför vidare ordagrant
     i stället för att bytas mot en artig intetsägande mening. */
  throw new CommunityError(String(text || 'Något gick fel.'));
}

async function rest(
  method: string,
  path: string,
  options: { body?: unknown; prefer?: string } = {},
): Promise<any> {
  if (!configured) throw new CommunityError('Funktionen är inte konfigurerad.');

  const headers: Record<string, string> = {
    apikey: ANON_KEY,
    'Accept-Profile': SCHEMA,
    Authorization: `Bearer ${await token()}`,
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET' && method !== 'HEAD') headers['Content-Profile'] = SCHEMA;
  if (options.prefer) headers.Prefer = options.prefer;

  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    method,
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
  if (!res.ok) await fel(res);
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/* ------------------------------------------------------------------------ */
/* Behörighet                                                                */
/* ------------------------------------------------------------------------ */

/**
 * Är den inloggade admin?
 *
 * Frågan ställs till DATABASEN och besvaras av community.is_admin(). Den kan
 * inte besvaras här, för svaret hade då bara varit vad klienten tror.
 *
 * Falskt vid varje fel, inklusive 404 innan schema_admin.sql körts. En sida som
 * inte vet ska visa mindre, aldrig mer.
 */
export async function arAdmin(): Promise<boolean> {
  try {
    return (await rest('POST', 'rpc/is_admin', { body: {} })) === true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------------ */
/* Kön                                                                       */
/* ------------------------------------------------------------------------ */

export type Sort = 'omdome' | 'bild' | 'svar' | 'ansprak';

export interface Post {
  sort: Sort;
  id: string;
  establishment_id: string;
  municipality_slug: string;
  created_at: string;
}

export interface OmdomePost extends Post {
  sort: 'omdome';
  body: string | null;
  rating: number | null;
  visited_month: string | null;
  /** Bilder som hör till omdömet och fortfarande väntar. Granskas som en enhet. */
  bilder: number;
}

export interface BildPost extends Post {
  sort: 'bild';
  storage_path: string;
  content_type: string;
  caption: string | null;
  byte_size: number;
  review_id: string | null;
  /** Texten i omdömet bilden hör till, om den finns. Bilden granskas mot den. */
  omdome: { body: string | null; rating: number | null; status: string } | null;
}

export interface SvarPost extends Post {
  sort: 'svar';
  inspection_id: string;
  body: string;
}

export interface AnsprakPost extends Post {
  sort: 'ansprak';
  establishment_name: string;
  claimant_name: string;
  claimant_role: string;
  organization_number: string | null;
  contact_email: string;
  contact_phone: string | null;
}

export type KoPost = OmdomePost | BildPost | SvarPost | AnsprakPost;

/**
 * Allt som väntar på ett beslut, äldst först.
 *
 * Äldst först och inte nyast: en kö man betar av uppifrån låter den som väntat
 * längst vänta längst. Samma ordning som `moderate.py kö`.
 *
 * INGET ÄGARFILTER, och det är hela poängen med den här filen. Läsningen går
 * genom de fyra admin-policyerna i schema_admin.sql, som är falska för varje
 * konto som inte står i community.admins. Den som inte är admin får en tom
 * lista av databasen, inte av koden nedan.
 */
export async function ko(): Promise<KoPost[]> {
  const [omdomen, bilder, svar, ansprak] = await Promise.all([
    rest(
      'GET',
      'reviews?select=id,establishment_id,municipality_slug,body,rating,visited_month,created_at' +
        '&status=eq.pending&order=created_at.asc&limit=200',
    ),
    rest(
      'GET',
      'image_uploads?select=id,establishment_id,municipality_slug,storage_path,content_type,' +
        'caption,byte_size,review_id,created_at&status=eq.pending&order=created_at.asc&limit=200',
    ),
    rest(
      'GET',
      'owner_responses?select=id,establishment_id,municipality_slug,inspection_id,body,created_at' +
        '&status=eq.pending&order=created_at.asc&limit=200',
    ),
    rest(
      'GET',
      'establishment_claims?select=id,establishment_id,municipality_slug,establishment_name,' +
        'claimant_name,claimant_role,organization_number,contact_email,contact_phone,created_at' +
        '&status=eq.pending&order=created_at.asc&limit=200',
    ),
  ]);

  /* Bilderna som hör till ett väntande omdöme räknas, så att granskaren ser att
     texten och bilden hör ihop innan hen avslår den ena. Ett avslag på texten
     avslår bilderna med den, se community.moderate_review(). */
  const perOmdome = new Map<string, number>();
  for (const b of bilder ?? []) {
    if (!b.review_id) continue;
    perOmdome.set(b.review_id, (perOmdome.get(b.review_id) ?? 0) + 1);
  }

  /* Texten en bild hör till hämtas i ETT anrop, inte ett per bild. En bild utan
     sammanhang är det svåraste tänkbara granskningsärendet: texten säger om det
     är disken, skylten eller en tallrik man tittar på. */
  const omdomesIds = [...new Set((bilder ?? []).map((b: any) => b.review_id).filter(Boolean))];
  const texter = new Map<string, { body: string | null; rating: number | null; status: string }>();
  if (omdomesIds.length > 0) {
    const rader = await rest(
      'GET',
      `reviews?select=id,body,rating,status&id=in.(${omdomesIds.map(encodeURIComponent).join(',')})`,
    );
    for (const r of rader ?? []) texter.set(r.id, { body: r.body, rating: r.rating, status: r.status });
  }

  const allt: KoPost[] = [
    ...(omdomen ?? []).map(
      (r: any): OmdomePost => ({ ...r, sort: 'omdome', bilder: perOmdome.get(r.id) ?? 0 }),
    ),
    ...(bilder ?? []).map(
      (b: any): BildPost => ({ ...b, sort: 'bild', omdome: b.review_id ? (texter.get(b.review_id) ?? null) : null }),
    ),
    ...(svar ?? []).map((s: any): SvarPost => ({ ...s, sort: 'svar' })),
    ...(ansprak ?? []).map((a: any): AnsprakPost => ({ ...a, sort: 'ansprak' })),
  ];

  return allt.sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0));
}

/* ------------------------------------------------------------------------ */
/* Lagring                                                                   */
/* ------------------------------------------------------------------------ */

/**
 * En tillfällig länk till en bild i den privata inkorgen.
 *
 * Hinken förblir privat. En signerad länk är en nyckel till en fil som gäller en
 * timme, inte en öppning av bucketen, och den delas ut bara till den som redan
 * har läsrätt genom policyn `inkomna_read_admin`.
 */
export async function bildlank(path: string, sekunder = 3600): Promise<string> {
  const res = await fetch(`${URL_BASE}/storage/v1/object/sign/${INKORG}/${path}`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${await token()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expiresIn: sekunder }),
  });
  if (!res.ok) await fel(res);
  const data = await res.json();
  return `${URL_BASE}/storage/v1${data.signedURL}`;
}

/** Sökvägen i den publika hinken: samma som i inkorgen, utan `pending/`. */
function malvag(storagePath: string): string {
  return storagePath.replace(/^pending\//, '');
}

function publikAdress(dest: string): string {
  return `${URL_BASE}/storage/v1/object/public/${PUBLIK}/${dest}`;
}

/**
 * Raderar filer ur lagringen.
 *
 * Databasen kan inte göra det: storage.objects är metadata, och filen ligger
 * bakom lagrings-API:t. Beslutsfunktionerna returnerar därför vad som ska bort,
 * och den här funktionen tar bort det.
 *
 * Ett objekt som redan är borta är inte ett fel. Ett fel här får inte heller
 * skugga beslutet, som redan är fattat och skrivet: raden är avslagen, och en
 * avslagen rad får aldrig en publik adress. Det som kan bli kvar är en fil ingen
 * sida kan nå, och den kan städas för hand.
 */
export async function raderaFiler(filer: Array<{ bucket: string; path: string }>): Promise<string[]> {
  const kvar: string[] = [];
  if (filer.length === 0) return kvar;
  const t = await token();

  for (const fil of filer) {
    try {
      const res = await fetch(`${URL_BASE}/storage/v1/object/${fil.bucket}/${fil.path}`, {
        method: 'DELETE',
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${t}` },
      });
      /* 404 betyder att filen redan är borta, och det är ett godtagbart utfall. */
      if (!res.ok && res.status !== 404) kvar.push(`${fil.bucket}/${fil.path}`);
    } catch {
      kvar.push(`${fil.bucket}/${fil.path}`);
    }
  }
  return kvar;
}

/* ------------------------------------------------------------------------ */
/* Besluten                                                                  */
/* ------------------------------------------------------------------------ */

interface Fil {
  bucket: string;
  path: string;
}

async function beslut(fn: string, body: Record<string, unknown>): Promise<Fil[]> {
  const svar = await rest('POST', `rpc/${fn}`, { body });
  return Array.isArray(svar) ? svar : [];
}

/** Publicerar ett omdöme ordagrant. Texten kan inte ändras, se freeze_body(). */
export async function publiceraOmdome(id: string): Promise<void> {
  await beslut('moderate_review', { target_id: id, decision: 'publish' });
}

/**
 * Avslår ett omdöme, och bilderna som hör till det.
 *
 * Text och bild granskas som en enhet: det som fällde texten gäller nästan alltid
 * bilderna med. Databasen avslår raderna och säger vilka filer som ska bort.
 */
export async function avslaOmdome(id: string, skal: string): Promise<string[]> {
  const filer = await beslut('moderate_review', {
    target_id: id,
    decision: 'reject',
    reason: skal,
  });
  return raderaFiler(filer);
}

/**
 * Publicerar en bild.
 *
 * FILEN KOPIERAS FÖRST, RADEN SKRIVS SEDAN. Samma ordning som cmd_publish() i
 * pipeline/moderate.py, och av samma skäl: går kopieringen fel finns det ingen
 * rad som påstår att bilden ligger ute. Omvänd ordning hade gett en publicerad
 * rad som pekar på en fil som inte finns, alltså en trasig bild på sajten.
 *
 * Adressen räknas ut här men PRÖVAS i databasen: community.moderate_image() fäller
 * varje adress som inte pekar på just den här radens fil.
 */
export async function publiceraBild(post: BildPost): Promise<string> {
  const t = await token();
  let dest = malvag(post.storage_path);

  if (BEHOVER_KONVERTERING.has(post.content_type)) {
    /* HEIC måste bli JPEG före publicering. Safari kan avkoda formatet, Chrome
       och Firefox kan inte, och då finns det ingenting den här sidan kan göra:
       konverteringen görs av pipeline/moderate.py i stället. Beskedet säger
       exakt vilket kommando som gäller, för alternativet är en knapp som inte
       fungerar och inte förklarar sig. */
    const blob = await hamtaBild(post.storage_path);
    const jpeg = await tillJpeg(blob);
    if (!jpeg) {
      throw new CommunityError(
        'Bilden är HEIC och den här webbläsaren kan inte avkoda den. Öppna sidan i ' +
          'Safari, eller publicera från terminalen:\n' +
          `python3 pipeline/moderate.py publicera bild ${post.id}`,
      );
    }
    dest = dest.replace(/\.[^./]+$/, '.jpg');
    const res = await fetch(`${URL_BASE}/storage/v1/object/${PUBLIK}/${dest}`, {
      method: 'POST',
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'image/jpeg' },
      body: jpeg,
    });
    if (!res.ok) await fel(res);
  } else {
    /* Serverkopia. Ingenting behöver hem till den här datorn när filen redan har
       ett format alla webbläsare kan visa. */
    const res = await fetch(`${URL_BASE}/storage/v1/object/copy`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${t}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bucketId: INKORG,
        sourceKey: post.storage_path,
        destinationBucket: PUBLIK,
        destinationKey: dest,
      }),
    });
    if (!res.ok) await fel(res);
  }

  const url = publikAdress(dest);
  await beslut('moderate_image', { target_id: post.id, decision: 'publish', public_url: url });
  return url;
}

/**
 * Avslår en bild OCH RADERAR FILEN.
 *
 * Det är skillnaden mot en text, som bara blir osynlig. En bild som inte får
 * publiceras ska inte ligga kvar i vår lagring. Ett avslag går inte att ångra.
 */
export async function avslaBild(id: string, skal: string): Promise<string[]> {
  const filer = await beslut('moderate_image', {
    target_id: id,
    decision: 'reject',
    reason: skal,
  });
  return raderaFiler(filer);
}

/**
 * Godkänner ett svar från en verksamhet.
 *
 * TEXTEN STÅR INTE PÅ SAJTEN FÖRRÄN PIPELINEN SKRIVIT DEN DIT. Beslutet fattas
 * här, men public.inspections.owner_comment skrivs av
 * `python3 pipeline/moderate.py synka`, som kör med service_role. Ingen väg från
 * en webbläsare får leda in i den redaktionella databasen.
 */
export async function publiceraSvar(id: string): Promise<void> {
  await beslut('moderate_owner_response', { target_id: id, decision: 'publish' });
}

export async function avslaSvar(id: string, skal: string): Promise<void> {
  await beslut('moderate_owner_response', { target_id: id, decision: 'reject', reason: skal });
}

/** Metoderna ett anspråk kan ha kontrollerats med. Samma lista som databasen. */
export const METODER: Array<{ varde: string; text: string }> = [
  /* Kort text med flit. Etiketten sitter i en rullgardin bredvid två knappar,
     och en mening där tvingar ut raden ur en telefonskärm. Vad var och en
     betyder står i schema_community.sql, hos den som ska förstå det. */
  { varde: 'register_check', text: 'Registerkontroll' },
  { varde: 'postal_code', text: 'Kod per brev' },
];

/**
 * Godkänner ett anspråk.
 *
 * Metoden är obligatorisk. Villkoret claim_published_requires_method i databasen
 * fäller annars raden, och en rad som ser verifierad ut utan att någon vet varför
 * är värre än ett obehandlat anspråk.
 */
export async function publiceraAnsprak(id: string, metod: string): Promise<void> {
  await beslut('moderate_claim', { target_id: id, decision: 'publish', method: metod });
}

export async function avslaAnsprak(id: string, skal: string): Promise<void> {
  await beslut('moderate_claim', { target_id: id, decision: 'reject', reason: skal });
}

/* ------------------------------------------------------------------------ */
/* Bildhantering                                                             */
/* ------------------------------------------------------------------------ */

async function hamtaBild(path: string): Promise<Blob> {
  const res = await fetch(`${URL_BASE}/storage/v1/object/${INKORG}/${path}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${await token()}` },
  });
  if (!res.ok) await fel(res);
  return res.blob();
}

/**
 * Ritar om en bild till JPEG, nedskalad och utan metadata.
 *
 * Null när webbläsaren inte kan avkoda formatet, vilket är det normala för HEIC
 * i Chrome och Firefox. Det är ett svar och inte ett fel: anroparen skickar då
 * granskaren vidare till terminalverktyget.
 *
 * EXIF FÖRSVINNER HÄR. En canvas bär ingen metadata. Den vanliga vägen tappar
 * den redan vid uppladdningen, men en HEIC som webbläsaren inte kunde rita
 * skickades iväg orörd och bär fortfarande GPS-koordinaten till fotografens hem.
 * Omdömen är anonyma, och en bild med koordinat är inte anonym.
 */
async function tillJpeg(blob: Blob): Promise<Blob | null> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return null;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    return null;
  }

  try {
    const skala = Math.min(1, MAX_KANT / Math.max(bitmap.width, bitmap.height));
    const bredd = Math.max(1, Math.round(bitmap.width * skala));
    const hojd = Math.max(1, Math.round(bitmap.height * skala));

    const canvas = document.createElement('canvas');
    canvas.width = bredd;
    canvas.height = hojd;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, bredd, hojd);

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.82);
    });
  } catch {
    return null;
  } finally {
    bitmap.close();
  }
}
