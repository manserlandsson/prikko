/**
 * Rörelsen i beståndet: vad som tillkommit och vad som försvunnit.
 *
 * ## Vad talen betyder, och vad de inte betyder
 *
 * Det finns ingen uppgift någonstans om när en verksamhet öppnade eller
 * stängde. `active` säger bara om raden lämnas ut just nu, och de fält som
 * skulle kunna bära ett startdatum är null i de flesta källorna. Det som går
 * att observera är smalare: ett anläggnings-id dök upp i kommunens utlämning,
 * eller slutade lämnas ut.
 *
 * Sidan säger därför "tillkommit" och "försvunnit", aldrig "nyöppnat" och
 * "stängt". Skillnaden är inte försiktighet utan sanning: en kommun som
 * lägger om sitt register skulle annars se ut att öppna trehundra restauranger
 * på en dag.
 *
 * Filtreringen som gör talen möjliga att stå för sker i pipelinen, inte här.
 * Första körningen mot en kommun, omläggningar av registret och id-byten
 * sparas men publiceras aldrig, och varken en tillkomst eller en frånvaro
 * publiceras på en enda observation. Se pipeline/prikko/rorelse.py.
 *
 * ## Modulen är tom tills loggen har något att säga
 *
 * Historiken går inte att räkna fram i efterhand. Den börjar den natt
 * pipeline/rorelse.py körs första gången, och den första körningen publicerar
 * ingenting alls. Saknas datafilerna finns ingen sida: `getStaticPaths` ger
 * en tom lista och webbkartan hoppar över raden. Det är avsiktligt. En sida
 * som säger "inga händelser" är en tunn sida, och tunna sidor i tiotal drar
 * ner hela domänen vid Googles bedömning av skalat innehåll (bibeln §6).
 */
import { municipalities, municipality, type Municipality } from './db';
import { findEstablishment } from './data';

export type MovementKind = 'ny' | 'borta';

export interface MovementEvent {
  kind: MovementKind;
  /** ISO-datum. Utlämningen händelsen observerades i. */
  on: string;
  slug: string;
  name: string;
  address: string | null;
}

interface MovementFile {
  municipality: { slug: string; city: string };
  /** Första utlämningen loggen bär, eller null. */
  observedFrom: string | null;
  observedTo: string | null;
  deliveries: number;
  events: MovementEvent[];
}

/**
 * Minsta antal händelser för att kommunen ska få en egen sida.
 *
 * Samma resonemang som MIN_CATEGORY_PAGE i data.ts. Under gränsen bär sidan
 * inte sin egen URL: fyra rader är ett utsnitt av kommunhubben och ingenting
 * mer. Gränsen är satt lågt eftersom rörelsen är gles av naturen — tolv rader
 * på en månad är ett verkligt besked i en kommun med tusen verksamheter.
 */
export const MIN_MOVEMENT_PAGE = 12;

const files = import.meta.glob<{ default: MovementFile }>('../data/rorelse/*.json', {
  eager: true,
});

const datasets = new Map<string, MovementFile>();
for (const module of Object.values(files)) {
  const data = module.default as unknown as MovementFile;
  if (!data || !data.municipality || !Array.isArray(data.events)) continue;
  datasets.set(data.municipality.slug, data);
}

export interface MovementMonth {
  /** 'YYYY-MM'. */
  month: string;
  label: string;
  arrived: MovementEvent[];
  departed: MovementEvent[];
}

export interface Movement {
  municipality: Municipality;
  observedFrom: string | null;
  deliveries: number;
  arrived: number;
  departed: number;
  /** Månader med minst en händelse, nyast först. */
  months: MovementMonth[];
  events: MovementEvent[];
}

const MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
];

export function monthLabel(month: string): string {
  const [year, number] = month.split('-');
  return `${MONTHS[Number(number) - 1]} ${year}`;
}

const cache = new Map<string, Movement | null>();

/**
 * Kommunens rörelse, eller null när loggen inte har något att säga.
 *
 * Händelserna sorteras på datum och ingenting annat. Sorterade eller
 * filtrerade på bedömning hade listan blivit en skampåle med veckans namn,
 * och det är inte vad den finns för.
 */
export function movement(slug: string): Movement | null {
  if (cache.has(slug)) return cache.get(slug)!;

  const data = datasets.get(slug);
  const m = municipality(slug);
  if (!data || !m) {
    cache.set(slug, null);
    return null;
  }

  const events = [...data.events].sort(
    (a, b) => b.on.localeCompare(a.on) || a.slug.localeCompare(b.slug, 'sv'),
  );

  const byMonth = new Map<string, MovementMonth>();
  for (const event of events) {
    const month = event.on.slice(0, 7);
    let bucket = byMonth.get(month);
    if (!bucket) {
      bucket = { month, label: monthLabel(month), arrived: [], departed: [] };
      byMonth.set(month, bucket);
    }
    if (event.kind === 'ny') bucket.arrived.push(event);
    else bucket.departed.push(event);
  }

  const result: Movement = {
    municipality: m,
    observedFrom: data.observedFrom ? data.observedFrom.slice(0, 10) : null,
    deliveries: data.deliveries,
    arrived: events.filter((e) => e.kind === 'ny').length,
    departed: events.filter((e) => e.kind === 'borta').length,
    months: [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month)),
    events,
  };

  cache.set(slug, result);
  return result;
}

/** Kommuner med tillräckligt många händelser för en egen sida. */
export function movementMunicipalities(): Municipality[] {
  return municipalities().filter((m) => {
    const found = movement(m.slug);
    return found !== null && found.events.length >= MIN_MOVEMENT_PAGE;
  });
}

export function hasMovementPage(slug: string): boolean {
  const found = movement(slug);
  return found !== null && found.events.length >= MIN_MOVEMENT_PAGE;
}

export interface NationalEvent extends MovementEvent {
  municipality: Municipality;
}

/**
 * Rikets händelser i en enda tidsordnad följd.
 *
 * Notera vad riksvyn INTE gör: den räknar inte per kommun och den sorterar
 * inte kommuner mot varandra. Ett tal som "flest nya verksamheter" hade
 * rangordnat kommunerna på hur de sköter sitt register, vilket är samma fel
 * som att rangordna dem på kontrollresultat och lika lite vår sak att göra.
 * Här finns bara en följd av händelser med datum, precis som på en kommunsida.
 */
export function nationalMovement(limit = 200): NationalEvent[] {
  const all: NationalEvent[] = [];
  for (const m of municipalities()) {
    const found = movement(m.slug);
    if (!found) continue;
    for (const event of found.events) all.push({ ...event, municipality: m });
  }
  all.sort(
    (a, b) =>
      b.on.localeCompare(a.on) ||
      a.municipality.slug.localeCompare(b.municipality.slug, 'sv') ||
      a.slug.localeCompare(b.slug, 'sv'),
  );
  return all.slice(0, limit);
}

/** Minsta antal händelser i landet för att riksvyn ska byggas. */
export const MIN_NATIONAL_PAGE = 25;

export function hasNationalPage(): boolean {
  return nationalMovement(MIN_NATIONAL_PAGE).length >= MIN_NATIONAL_PAGE;
}

/**
 * Har händelsen en verksamhetssida att länka till?
 *
 * En verksamhet som försvunnit ur utlämningen har `active = 0` och finns inte
 * i sajtens datafiler. Den får därför nämnas vid namn men inte länkas: en länk
 * till en sida som inte byggts är en 404 vi själva lagt ut. Att namnet och
 * adressen ändå kan skrivas ut beror på att raden ligger kvar i databasen och
 * följer med rörelsefilen. Se pipeline/rorelse.py.
 */
export function eventIsLive(kommun: string, event: MovementEvent): boolean {
  return findEstablishment(kommun, event.slug) !== undefined;
}
