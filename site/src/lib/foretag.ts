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

/*
 * imageType() lånas och skrivs INTE av på nytt, till skillnad från resten av
 * bildhanteringen här.
 *
 * Skälet är att den inte bär någon regel om vem som får ladda upp vad. Den
 * svarar på en enda fråga: vilket format är den här filen, när webbläsare är
 * oense om HEIC och ibland lämnar `file.type` tomt. Den tabellen måste stämma
 * med vad pipeline/moderate.py kan konvertera, och två kopior av den hade
 * glidit isär vid första formatet som lades till.
 */
import { CommunityError, configured, currentUser, imageType, signedIn } from './community';

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
  /** Avvikande tider för enskilda datum. */
  avvikandeTider: boolean;
  telefon: boolean;
  lankar: boolean;
  /** Antal egna bilder. Noll betyder att bildrutan inte visas alls. */
  bilder: number;
}

/**
 * Taket i databasen är ett annat tal och ska förbli det.
 * community.check_business_image() släpper 24 bilder per verksamhet. Det är ett
 * skydd mot att någon fyller lagringen, inte en produktgräns. Nivån nedan är
 * produktgränsen, och den ska ligga under taket så att en höjning av den ena
 * aldrig kräver en ändring av den andra.
 */
export const NIVAER: Record<string, Niva> = {
  gratis: {
    presentation: 1500,
    oppettider: true,
    avvikandeTider: true,
    telefon: true,
    lankar: true,
    bilder: 12,
  },
  plus: {
    presentation: 1500,
    oppettider: true,
    avvikandeTider: true,
    telefon: true,
    lankar: true,
    bilder: 12,
  },
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

/**
 * En avvikande dag. Nyckeln är ett datum på formen 2026-12-24.
 *
 * `label` är dagens namn och bara det. Ingen förklarande text, se
 * docs/18_sprakregler.md.
 */
export type Avvikelse = ({ closed: true } | { from: string; to: string }) & {
  label?: string;
};
export type Avvikelser = Record<string, Avvikelse>;

export interface Foretagsuppgifter {
  presentation: string | null;
  opening_hours: Oppettider | null;
  opening_hours_exceptions: Avvikelser | null;
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

const FALT =
  'id,presentation,opening_hours,opening_hours_exceptions,phone,website,booking_url,status,rejection_reason,created_at';

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
 * Läses utan inloggning, för det är samma rad som verksamhetssidan hämtar. Vyn
 * tar den senast publicerade insändningen.
 *
 * `select=*` och inte en fältlista, av ett enda skäl: vyn ÄR den publika formen.
 * Den innehåller ingenting som inte är till för att visas, alltså finns inget
 * att välja bort. Vinsten är att en kolumn som lagts till i koden men ännu inte
 * i databasen ger en rad utan det fältet i stället för ett fel, och avsnittet
 * på verksamhetssidan fortsätter visa det som faktiskt finns.
 */
export async function publiceradeUppgifter(
  establishmentId: string,
): Promise<Foretagsuppgifter | null> {
  const rows = await rest(
    'GET',
    `published_profiles?select=*&establishment_id=eq.${encodeURIComponent(
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

/** Ett tomt objekt är inte samma sak som ingen uppgift. Null betyder ingen. */
function ellerTomt<T extends object>(value: T | null): T | null {
  return value && Object.keys(value).length > 0 ? value : null;
}

export async function skickaUppgifter(
  place: Place,
  fields: {
    presentation: string;
    openingHours: Oppettider | null;
    exceptions: Avvikelser | null;
    phone: string;
    website: string;
    bookingUrl: string;
  },
): Promise<void> {
  const user = currentUser();
  if (!user) throw new CommunityError('Du är utloggad. Logga in igen.');

  const body = {
    user_id: user.id,
    establishment_id: place.id,
    municipality_slug: place.municipalitySlug,
    presentation: eller(fields.presentation),
    opening_hours: ellerTomt(fields.openingHours),
    opening_hours_exceptions: ellerTomt(fields.exceptions),
    phone: eller(fields.phone),
    website: eller(fields.website),
    booking_url: eller(fields.bookingUrl),
  };

  const innehall = [
    body.presentation,
    body.opening_hours,
    body.opening_hours_exceptions,
    body.phone,
    body.website,
    body.booking_url,
  ];
  if (innehall.every((value) => value === null)) {
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

/* ------------------------------------------------------------------------ */
/* Öppet nu                                                                  */
/* ------------------------------------------------------------------------ */

/**
 * ALLTID SVENSK TID, ALDRIG BESÖKARENS.
 *
 * Öppettiden är ställets, och ett ställe i Örebro stänger 22:00 svensk tid även
 * för den som läser sidan från Bangkok. Räknades besökarens klocka hade sidan
 * påstått att köket var öppet mitt i natten.
 */
const TIDSZON = 'Europe/Stockholm';

const KLOCKA = new Intl.DateTimeFormat('sv-SE', {
  timeZone: TIDSZON,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Datum och minut på dygnet i svensk tid. */
function nuIStockholm(now: Date): { datum: string; minut: number } {
  const delar = KLOCKA.formatToParts(now);
  const del = (typ: string) => delar.find((p) => p.type === typ)?.value ?? '00';
  return {
    datum: `${del('year')}-${del('month')}-${del('day')}`,
    minut: Number(del('hour')) * 60 + Number(del('minute')),
  };
}

/** Datumräkning i UTC, så att sommartidsskiftet inte tappar eller lägger till en dag. */
function skift(datum: string, dagar: number): string {
  const d = new Date(`${datum}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dagar);
  return d.toISOString().slice(0, 10);
}

function veckodag(datum: string): Dag {
  /* getUTCDay räknar söndag som 0. Vår vecka börjar på måndag. */
  return DAGAR[(new Date(`${datum}T00:00:00Z`).getUTCDay() + 6) % 7];
}

function minut(klocka: string): number {
  const [h, m] = klocka.split(':');
  return Number(h) * 60 + Number(m);
}

interface Dagsschema {
  closed: boolean;
  from?: string;
  to?: string;
  label?: string;
  /** Sant när dagen styrs av ett avvikande datum och inte av veckoschemat. */
  avvikelse: boolean;
}

/**
 * Vad som gäller ett visst datum.
 *
 * Ett avvikande datum slår veckoschemat. Null betyder att företaget inte sagt
 * något om den dagen, och det är inte samma sak som stängt. Skillnaden är hela
 * skälet att funktionen får returnera null: att skriva "Stängt" på en dag ingen
 * uttalat sig om vore att publicera ett påstående vi inte har täckning för.
 */
function schemaFor(
  datum: string,
  hours: Oppettider | null,
  exceptions: Avvikelser | null,
): Dagsschema | null {
  const undantag = exceptions?.[datum];
  if (undantag) {
    if ('closed' in undantag) {
      return { closed: true, label: undantag.label, avvikelse: true };
    }
    return {
      closed: false,
      from: undantag.from,
      to: undantag.to,
      label: undantag.label,
      avvikelse: true,
    };
  }

  const vardag = hours?.[veckodag(datum)];
  if (!vardag) return null;
  if ('closed' in vardag) return { closed: true, avvikelse: false };
  return { closed: false, from: vardag.from, to: vardag.to, avvikelse: false };
}

/**
 * Slutminuten för en dags öppettid, räknad från den dagens midnatt.
 *
 * Ett stängningsklockslag som är mindre än eller lika med öppningen betyder att
 * kvällen fortsätter efter midnatt: 17:00 till 02:00 slutar minut 1560, alltså
 * på nästa dygn. Lika stora klockslag blir ett helt dygn, vilket är hur man
 * skriver "öppet dygnet runt" med två fält.
 */
function slutminut(schema: Dagsschema): number {
  const start = minut(schema.from!);
  const slut = minut(schema.to!);
  return slut <= start ? slut + 1440 : slut;
}

export interface Oppetlage {
  open: boolean;
  /** Klockslaget stället stänger, när det är öppet nu. */
  stanger?: string;
  /** Nästa öppning. `dag` är null när den infaller senare i dag. */
  oppnar?: { dag: Dag | null; klocka: string };
  /** Dagens namn när ett avvikande datum gäller, till exempel "Julafton". */
  label?: string;
}

/**
 * Öppet eller stängt just nu.
 *
 * RÄKNAS I WEBBLÄSAREN OCH ALDRIG VID BYGGET. Sidan är statisk och kan ligga
 * kvar i en cache i timmar; ett "Öppet nu" som satts vid bygget hade varit ett
 * påstående om en tidpunkt som passerat.
 *
 * Null betyder att företaget inte sagt något om dagen. Då står ingenting.
 */
export function oppetNu(
  hours: Oppettider | null,
  exceptions: Avvikelser | null,
  now: Date = new Date(),
): Oppetlage | null {
  const nu = nuIStockholm(now);

  /* Gårdagens kväll först. Är klockan 01:00 och stället stänger 02:00 är det
     öppet, och den öppettiden står på gårdagens rad. */
  const igar = schemaFor(skift(nu.datum, -1), hours, exceptions);
  if (igar && !igar.closed) {
    const slut = slutminut(igar);
    if (slut > 1440 && nu.minut < slut - 1440) {
      return { open: true, stanger: igar.to, label: igar.label };
    }
  }

  const idag = schemaFor(nu.datum, hours, exceptions);
  if (!idag) return null;

  if (!idag.closed) {
    const start = minut(idag.from!);
    if (nu.minut >= start && nu.minut < slutminut(idag)) {
      return { open: true, stanger: idag.to, label: idag.label };
    }
    if (nu.minut < start) {
      return { open: false, oppnar: { dag: null, klocka: idag.from! }, label: idag.label };
    }
  }

  /* Stängt i dag, eller stängt för dagen. Leta upp nästa öppning inom en vecka. */
  for (let i = 1; i <= 7; i += 1) {
    const datum = skift(nu.datum, i);
    const schema = schemaFor(datum, hours, exceptions);
    if (schema && !schema.closed) {
      return {
        open: false,
        oppnar: { dag: veckodag(datum), klocka: schema.from! },
        label: idag.label,
      };
    }
  }

  return { open: false, label: idag.label };
}

/**
 * Avvikande datum som ännu inte passerat, i datumordning.
 *
 * Gårdagens jul är ingen upplysning. Filtret räknas i svensk tid av samma skäl
 * som öppetNu().
 */
export function kommandeAvvikelser(
  exceptions: Avvikelser | null,
  now: Date = new Date(),
): { datum: string; avvikelse: Avvikelse }[] {
  if (!exceptions) return [];
  const idag = nuIStockholm(now).datum;
  return Object.entries(exceptions)
    .filter(([datum]) => datum >= idag)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([datum, avvikelse]) => ({ datum, avvikelse }));
}

const SCHEMADAG: Record<Dag, string> = {
  mon: 'https://schema.org/Monday',
  tue: 'https://schema.org/Tuesday',
  wed: 'https://schema.org/Wednesday',
  thu: 'https://schema.org/Thursday',
  fri: 'https://schema.org/Friday',
  sat: 'https://schema.org/Saturday',
  sun: 'https://schema.org/Sunday',
};

/**
 * Öppettiderna som schema.org-form.
 *
 * Det här är den enda vägen ut till en sökmotor eller en språkmodell.
 * Öppettiderna hämtas i webbläsaren, alltså kan de inte ligga i sidans
 * statiska JSON-LD, och den som vill ha svar på "har det öppet på söndag" ska
 * inte behöva läsa vår CSS för att hitta det.
 *
 * En stängd dag skrivs 00:00 till 00:00. Det är schema.org:s egen konvention
 * för stängt, och den valdes framför att utelämna dagen: en utelämnad dag
 * betyder "vet inte", en nollställd betyder "stängt", och de två ska inte
 * blandas ihop.
 *
 * Ett avvikande datum får validFrom och validThrough på samma dag. Bara datum
 * som inte passerat tas med.
 */
export function oppettiderSchema(
  hours: Oppettider | null,
  exceptions: Avvikelser | null,
  now: Date = new Date(),
): Record<string, unknown>[] {
  const spec: Record<string, unknown>[] = [];

  /* Dagar med samma tider slås ihop till en post. Sju nästan identiska poster
     är samma uppgift skriven sju gånger. */
  const grupper = new Map<string, Dag[]>();
  for (const dag of DAGAR) {
    const varde = hours?.[dag];
    if (!varde) continue;
    const nyckel = 'closed' in varde ? 'closed' : `${varde.from}-${varde.to}`;
    const lista = grupper.get(nyckel);
    if (lista) lista.push(dag);
    else grupper.set(nyckel, [dag]);
  }

  for (const [nyckel, dagar] of grupper) {
    const [opens, closes] =
      nyckel === 'closed' ? ['00:00', '00:00'] : nyckel.split('-');
    spec.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: dagar.map((d) => SCHEMADAG[d]),
      opens,
      closes,
    });
  }

  for (const { datum, avvikelse } of kommandeAvvikelser(exceptions, now)) {
    const stangt = 'closed' in avvikelse;
    spec.push({
      '@type': 'OpeningHoursSpecification',
      opens: stangt ? '00:00' : avvikelse.from,
      closes: stangt ? '00:00' : avvikelse.to,
      validFrom: datum,
      validThrough: datum,
    });
  }

  return spec;
}

/* ------------------------------------------------------------------------ */
/* Företagets egna bilder                                                    */
/* ------------------------------------------------------------------------ */

/**
 * BESÖKARNAS BILDER LIGGER NÅGON ANNANSTANS.
 *
 * community.image_uploads hör till gästen och stänger uttryckligen ute den som
 * har ett godkänt anspråk. Den här tabellen kräver tvärtom ett. De två flödena
 * delar bara lagringsutrymme, under var sin mapp, och koden delas inte alls:
 * det som liknar community.ts nedan är avsiktligt skrivet en gång till, så att
 * en ändring i besökarflödet inte kan ändra företagsflödet utan att någon
 * märker det.
 */
const INKORG = 'verksamhetsbilder-inkomna';
const PUBLIK = 'verksamhetsbilder';

/**
 * Samma tak som besökarbilderna, och av samma skäl.
 *
 * En HEIC kan oftast INTE komprimeras i webbläsaren: Chrome och Firefox kan
 * inte avkoda formatet, och då går originalet iväg som det är. En 48-megapixlig
 * iPhone-bild ligger då på flera megabyte. Se MAX_UPLOAD_BYTES i community.ts.
 */
const MAX_BYTES = 12 * 1024 * 1024;
const MAX_KANT = 1600;

/**
 * Filändelse per typ. Sökvägen ska säga vad filen faktiskt är.
 *
 * HEIC OCH HEIF STÅR MED. Formatet är förvalt på varje iPhone sedan 2017, och
 * en restaurangägare fotograferar sin egen matsal med samma telefon som
 * gästerna. Konverteringen till JPEG sker i pipeline/moderate.py före
 * publicering, alltså når en HEIC aldrig den publika hinken.
 */
const ANDELSER: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/heic-sequence': 'heic',
  'image/heif-sequence': 'heif',
};

export interface Foretagsbild {
  id: string;
  storage_path: string;
  caption: string | null;
  status: 'pending' | 'published' | 'rejected';
  rejection_reason: string | null;
  published_url: string | null;
  sort_order: number;
  created_at: string;
}

const BILDFALT =
  'id,storage_path,caption,status,rejection_reason,published_url,sort_order,created_at';

/** Egna bilder för en verksamhet, i den ordning de visas. */
export async function egnaBilder(establishmentId: string): Promise<Foretagsbild[]> {
  return (
    (await rest(
      'GET',
      await ownRows(
        `business_images?select=${BILDFALT}&establishment_id=eq.${encodeURIComponent(
          establishmentId,
        )}&order=sort_order.asc,created_at.asc`,
      ),
    )) ?? []
  );
}

export interface PubliceradBild {
  id: string;
  published_url: string;
  caption: string | null;
}

/** Bilderna verksamhetssidan visar. Läses utan inloggning. */
export async function publiceradeBilder(
  establishmentId: string,
): Promise<PubliceradBild[]> {
  return (
    (await rest(
      'GET',
      `published_business_images?select=id,published_url,caption&establishment_id=eq.${encodeURIComponent(
        establishmentId,
      )}&order=sort_order.asc,created_at.asc&limit=24`,
      { anon: true },
    )) ?? []
  );
}

/**
 * Krymper bilden och tvättar bort kamerans metadata på köpet.
 *
 * Ritas bilden om på en duk följer varken GPS-position eller kameranummer med.
 * Det är samma grepp som besökarbilderna använder, och det är avsiktligt
 * kopierat i stället för delat: se kommentaren över INKORG.
 */
async function krymp(file: File, typ: string): Promise<File> {
  try {
    /* `imageOrientation: 'from-image'` är inte en finess utan en spärr.
       En telefon sparar en liggande bild stående plus en EXIF-tagg om hur den
       ska vridas. Ritas bilden om utan att vridningen först utförs försvinner
       taggen med metadatan, och bilden ligger ner för alltid. Det har hänt en
       gång i det här projektet; se _finish_jpeg i pipeline/moderate.py, som gör
       samma sak på serversidan. */
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const skala = Math.min(1, MAX_KANT / Math.max(bitmap.width, bitmap.height));
    const duk = document.createElement('canvas');
    duk.width = Math.round(bitmap.width * skala);
    duk.height = Math.round(bitmap.height * skala);
    const ctx = duk.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, duk.width, duk.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      duk.toBlob(resolve, 'image/jpeg', 0.82),
    );
    if (!blob) return file;
    return new File([blob], 'bild.jpg', { type: 'image/jpeg' });
  } catch {
    /* Chrome och Firefox kan inte avkoda HEIC, och då kastar createImageBitmap.
       Originalet går iväg som det är, och granskningen konverterar det. Filen
       får behålla den typ imageType() kom fram till: `file.type` är tom i just
       det fallet, och en tom typ i lagringen är inget att gå på senare. */
    return file.type ? file : new File([file], file.name, { type: typ });
  }
}

/**
 * Laddar upp en bild: raden först, filen sedan.
 *
 * Ordningen är inte godtycklig. Lagringens policy släpper bara igenom en fil
 * som redan har en väntande rad som pekar på exakt den sökvägen, alltså kan
 * ingen fylla bucketen utan att först passera kvoterna i triggern. Går filen
 * inte fram tas raden bort igen, så att kön inte fylls med rader utan bild.
 */
export async function laddaUppBild(
  place: Place,
  file: File,
  caption: string,
  sortOrder: number,
): Promise<void> {
  if (!configured) throw new CommunityError('Funktionen är inte konfigurerad.');
  const user = currentUser();
  if (!user) throw new CommunityError('Du är utloggad. Logga in igen.');

  const typ = imageType(file);
  if (!typ) {
    throw new CommunityError('Bilden måste vara JPEG, PNG, WebP eller HEIC.');
  }
  if (file.size > MAX_BYTES) {
    throw new CommunityError('Bilden får vara högst 12 MB.');
  }

  /* krymp() ritar om bilden till JPEG när webbläsaren kan avkoda den, och
     lämnar tillbaka originalet när den inte kan. En HEIC som gått genom Safari
     är alltså en JPEG här, medan samma fil i Chrome fortfarande är en HEIC.
     Sökvägen och content_type måste följa det faktiska utfallet och inte det
     vi hoppades på, annars ligger en HEIC i lagringen och kallar sig jpg. */
  const liten = await krymp(file, typ);
  const faktisk = liten.type || typ;
  const suffix = ANDELSER[faktisk] ?? 'jpg';
  const path = `foretag/${user.id}/${crypto.randomUUID()}.${suffix}`;

  const rows = await rest('POST', 'business_images', {
    prefer: 'return=representation',
    body: {
      user_id: user.id,
      establishment_id: place.id,
      municipality_slug: place.municipalitySlug,
      storage_path: path,
      content_type: liten.type,
      byte_size: liten.size,
      caption: eller(caption),
      rights_confirmed: true,
      sort_order: sortOrder,
    },
  });
  const rad = Array.isArray(rows) ? rows[0] : rows;

  const t = await token();
  if (!t) throw new CommunityError('Du är utloggad. Logga in igen.');

  const res = await fetch(`${URL_BASE}/storage/v1/object/${INKORG}/${path}`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${t}`, 'Content-Type': liten.type },
    body: liten,
  });

  if (!res.ok) {
    if (rad?.id) {
      await rest(
        'DELETE',
        await ownRows(`business_images?id=eq.${encodeURIComponent(rad.id)}`),
      ).catch(() => {
        /* Raden blir kvar utan fil. Granskningen ser att bilden saknas. */
      });
    }
    throw new CommunityError('Bilden gick inte att ladda upp. Försök igen.');
  }
}

/**
 * Tar bort en egen bild: filen först, raden sedan.
 *
 * Omvänd ordning mot uppladdningen, och av samma skäl. Faller raderingen efter
 * att filen är borta blir raden kvar utan bild, vilket syns. Faller den i andra
 * ordningen blir filen kvar utan rad, vilket inte syns för någon.
 */
export async function taBortBild(bild: Foretagsbild): Promise<void> {
  const t = await token();
  if (!t) throw new CommunityError('Du är utloggad. Logga in igen.');

  const huvuden = { apikey: ANON_KEY, Authorization: `Bearer ${t}` };
  const platser = [[INKORG, bild.storage_path]];
  if (bild.published_url) platser.push([PUBLIK, bild.storage_path]);

  for (const [bucket, path] of platser) {
    await fetch(`${URL_BASE}/storage/v1/object/${bucket}/${path}`, {
      method: 'DELETE',
      headers: huvuden,
    }).catch(() => {
      /* Filen kan redan vara borta. Raden ska bort ändå. */
    });
  }

  await rest('DELETE', await ownRows(`business_images?id=eq.${encodeURIComponent(bild.id)}`));
}
