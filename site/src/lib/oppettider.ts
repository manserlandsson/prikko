/**
 * Öppettider, och tillståndet "öppet nu".
 *
 * Uppgiften kommer ur OpenStreetMap och paras ihop av pipeline/oppettider.py.
 * Den här modulen vet vad den betyder och ingenting om var den kommer ifrån.
 *
 * TRE SAKER STYR ALLT ANNAT HÄR
 * -----------------------------
 *
 * 1. TILLSTÅNDET RÄKNAS I WEBBLÄSAREN, ALDRIG VID BYGGET. Sajten är statisk
 *    och en HTML-fil kan ligga i en cache i timmar. "Öppet nu" skrivet vid
 *    bygget hade varit osant större delen av dygnet. Veckoschemat renderas
 *    därför i filen, tillståndet fylls i av `mountaStatus` när sidan öppnas.
 *    Utan JavaScript syns schemat men inget tillstånd, och det är rätt: vi
 *    påstår hellre ingenting än fel sak.
 *
 * 2. GRÖNT LÅNAS ALDRIG UT. `docs/17` stoppade en grön "öppet nu"-pille redan
 *    i rapport 15, och domen står. Grönt är bedömningens språk på den här
 *    sajten, och en läsare som ser grönt bredvid ett namn läser det som
 *    hygien och inte som klockslag. Öppet är märkesbläck, stängt är dämpat.
 *
 * 3. VI TOLKAR BARA DEN DELMÄNGD VI FÖRSTÅR HELT. `opening_hours` är ett eget
 *    litet språk med veckonummer, datumintervall, soluppgång och kommentarer.
 *    Pipelinen kastar allt utanför delmängden, se pipeline/prikko/oppettider.py
 *    för dess BNF. Hit kommer alltså bara färdigtolkade veckoscheman.
 */

/** Ett spann i minuter från midnatt. Slutet kan passera 1440, alltså natten över. */
export type Span = [number, number];

/**
 * Ett dygns öppettider som en rad: "660-1320", eller "660-840,1020-1320" för
 * två pass, eller tom sträng för stängt. Talen är minuter från midnatt.
 *
 * Raden är formen i FILEN och inte i koden. Datafilerna skrivs med indent=1,
 * och ett veckoschema av nästlade listor blev femtio rader per verksamhet:
 * 2 788 verksamheter hade lagt drygt 100 000 rader i site/src/data och gjort
 * varje framtida diff oläsbar. Se pipeline/prikko/oppettider.py.
 */
export type DayText = string;

export interface Hours {
  /** OSM-uttrycket ordagrant. Visas aldrig, men gör en felrapport möjlig. */
  raw: string;
  /** Sju poster, måndag först. Tom sträng betyder stängt hela dagen. */
  week: DayText[];
  /**
   * Vad som gäller på helgdag. `null` när uttrycket inte säger något, och då
   * gäller veckodagen som vanligt. Tom sträng betyder stängt.
   */
  ph: DayText | null;
  /** OSM-objektet uppgiften kommer ur, t.ex. "node/1234". */
  osm: string;
  /** ISO-datum då vi hämtade den. */
  checkedAt: string;
}

/**
 * Packa upp en dygnsrad till spann.
 *
 * Ogiltiga tal ger ett tomt dygn i stället för NaN. Datan skrivs av vår egen
 * pipeline och ska aldrig vara trasig, men den läses i webbläsaren där ett
 * NaN inte syns som ett fel utan som ett besked: "Öppnar NaN:NaN" är sämre än
 * ingen rad alls.
 */
export function spansOf(text: DayText | null | undefined): Span[] {
  if (!text) return [];
  const out: Span[] = [];
  for (const part of text.split(',')) {
    const [a, b] = part.split('-');
    const start = Number(a);
    const end = Number(b);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    out.push([start, end]);
  }
  return out;
}

export const DAY_NAMES = [
  'Måndag',
  'Tisdag',
  'Onsdag',
  'Torsdag',
  'Fredag',
  'Lördag',
  'Söndag',
] as const;

/**
 * Hur nära stängning "stänger snart" börjar gälla.
 *
 * En timme. Kortare och beskedet kommer för sent för den som ska ta sig dit,
 * längre och halva kvällen står som en varning. Samma tröskel som Google
 * Maps använder för sin motsvarande rad.
 */
export const CLOSING_SOON_MINUTES = 60;

// ---------------------------------------------------------------------------
// Klockan i Sverige
// ---------------------------------------------------------------------------

/**
 * Nu, uttryckt i verksamhetens tidszon.
 *
 * Öppettider gäller på plats. En besökare i London som läser om en restaurang
 * i Uppsala ska se restaurangens klocka, inte sin egen, och skillnaden är en
 * hel timme större delen av året. Därför läses tiden ur Europe/Stockholm och
 * aldrig ur webbläsarens lokala tid.
 */
export interface LocalNow {
  year: number;
  month: number; // 1-12
  day: number;
  /** 0 = måndag. Samma ordning som `week`. */
  weekday: number;
  /** Minuter från midnatt. */
  minutes: number;
}

const STOCKHOLM = 'Europe/Stockholm';

export function localNow(at: Date = new Date()): LocalNow {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: STOCKHOLM,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  }).formatToParts(at);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
  // sv-SE ger "mån", "tis", "ons", "tors", "fre", "lör", "sön". Vi matchar på
  // de tre första tecknen, som är entydiga.
  const short = (get('weekday') || '').slice(0, 3).toLowerCase();
  const order = ['mån', 'tis', 'ons', 'tor', 'fre', 'lör', 'sön'];
  const weekday = Math.max(0, order.indexOf(short));

  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday,
    // "24" förekommer i vissa körningar vid midnatt. Klämmer till 0.
    minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')),
  };
}

// ---------------------------------------------------------------------------
// Svenska helgdagar
// ---------------------------------------------------------------------------

/**
 * `PH` i OSM betyder röd dag i det land objektet ligger i. Utan den här
 * listan hade en verksamhet som skriver "PH off" stått som öppen på juldagen,
 * alltså exakt det fel som gör att någon står utanför en låst dörr.
 *
 * De tretton röda dagarna enligt lagen (1989:253) om allmänna helgdagar.
 * Midsommarafton, julafton och nyårsafton är INTE röda dagar i lagens mening
 * och står därför inte här, trots att många har stängt då. Att gissa dit dem
 * hade varit att tolka mer än källan säger.
 */
export function isPublicHoliday(year: number, month: number, day: number): boolean {
  const md = (m: number, d: number) => m === month && d === day;

  if (md(1, 1)) return true; // nyårsdagen
  if (md(1, 6)) return true; // trettondedag jul
  if (md(5, 1)) return true; // första maj
  if (md(6, 6)) return true; // nationaldagen
  if (md(12, 25)) return true; // juldagen
  if (md(12, 26)) return true; // annandag jul

  const easter = easterSunday(year);
  const offsets = [-2, 0, 1, 39, 49]; // långfredag, påskdag, annandag påsk,
  //                                     Kristi himmelsfärd, pingstdagen
  for (const offset of offsets) {
    const d = new Date(Date.UTC(year, easter.month - 1, easter.day + offset));
    if (d.getUTCMonth() + 1 === month && d.getUTCDate() === day) return true;
  }

  // Midsommardagen: lördagen som infaller 20-26 juni.
  if (month === 6 && day >= 20 && day <= 26 && weekdayUTC(year, 6, day) === 5) return true;
  // Alla helgons dag: lördagen som infaller 31 oktober till 6 november.
  if (month === 10 && day === 31 && weekdayUTC(year, 10, 31) === 5) return true;
  if (month === 11 && day <= 6 && weekdayUTC(year, 11, day) === 5) return true;

  return false;
}

/** 0 = måndag. */
function weekdayUTC(year: number, month: number, day: number): number {
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

/** Gauss påskformel. Ger påskdagen i den gregorianska kalendern. */
function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

// ---------------------------------------------------------------------------
// Tillståndet
// ---------------------------------------------------------------------------

export type State = 'open' | 'closing' | 'closed';

export interface Status {
  state: State;
  /** Kort besked: "Öppet nu", "Stänger snart", "Stängt nu". */
  label: string;
  /** Tillägget: "Stänger 22:00", "Öppnar 11:00", "Öppnar tisdag 11:00". */
  detail: string;
}

export function formatClock(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Spannen som gäller ett visst datum, med helgdagsregeln inräknad. */
function spansOn(hours: Hours, year: number, month: number, day: number): Span[] {
  if (hours.ph !== null && isPublicHoliday(year, month, day)) return spansOf(hours.ph);
  return spansOf(hours.week[weekdayUTC(year, month, day)]);
}

/** Datumet n dygn efter det angivna. */
function shift(year: number, month: number, day: number, days: number) {
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/**
 * Är det öppet, och vad händer härnäst.
 *
 * Gårdagen räknas med. Ett spann som slutar 02:00 skrivs som 1560 minuter i
 * gårdagens post, och klockan 01:00 i natt ligger inne i det spannet. Utan
 * gårdagen hade varje nattöppet ställe stått som stängt efter midnatt.
 */
export function status(hours: Hours, now: LocalNow = localNow()): Status {
  const today = spansOn(hours, now.year, now.month, now.day);
  const y = shift(now.year, now.month, now.day, -1);
  const yesterday = spansOn(hours, y.year, y.month, y.day);

  let closesAt: number | null = null;
  for (const [start, end] of today) {
    if (now.minutes >= start && now.minutes < end) closesAt = end;
  }
  for (const [start, end] of yesterday) {
    const m = now.minutes + 1440;
    if (m >= start && m < end) closesAt = end - 1440;
  }

  if (closesAt !== null) {
    const left = closesAt - now.minutes;
    // Dygnet runt: inget klockslag att varna för, och "stänger 00:00" hade
    // varit direkt missvisande.
    const roundTheClock = today.some(([s, e]) => e - s >= 1440);
    if (roundTheClock) return { state: 'open', label: 'Öppet nu', detail: 'Dygnet runt' };
    if (left <= CLOSING_SOON_MINUTES) {
      return { state: 'closing', label: 'Stänger snart', detail: `Stänger ${formatClock(closesAt)}` };
    }
    return { state: 'open', label: 'Öppet nu', detail: `Stänger ${formatClock(closesAt)}` };
  }

  return { state: 'closed', label: 'Stängt nu', detail: nextOpening(hours, now) };
}

/**
 * När det öppnar härnäst, som text.
 *
 * Sju dygn framåt räcker: ett veckoschema upprepar sig. Hittas ingen öppning
 * alls på en vecka står det inget alls, eftersom "öppnar aldrig" är en
 * slutsats vi inte har täckning för.
 */
function nextOpening(hours: Hours, now: LocalNow): string {
  for (let offset = 0; offset <= 7; offset += 1) {
    const date = shift(now.year, now.month, now.day, offset);
    const spans = spansOn(hours, date.year, date.month, date.day);
    for (const [start] of spans) {
      if (offset === 0 && start <= now.minutes) continue;
      const clock = formatClock(start);
      if (offset === 0) return `Öppnar ${clock}`;
      if (offset === 1) return `Öppnar i morgon ${clock}`;
      const weekday = DAY_NAMES[weekdayUTC(date.year, date.month, date.day)].toLowerCase();
      // Sju dygn fram är samma veckodag som i dag. "Öppnar måndag" en måndag
      // kväll läses som i dag och är alltså sämre än inget besked.
      if (offset === 7) return `Öppnar nästa ${weekday} ${clock}`;
      return `Öppnar ${weekday} ${clock}`;
    }
  }
  return '';
}

// ---------------------------------------------------------------------------
// Veckoschemat
// ---------------------------------------------------------------------------

/** "11:00–22:00" eller "11:00–14:00, 17:00–22:00". Halvt fyrkantsstreck, som i svensk sättning. */
export function formatSpans(spans: Span[]): string {
  return spans.map(([a, b]) => `${formatClock(a)}–${formatClock(b)}`).join(', ');
}

export interface DayRow {
  name: string;
  /** "11:00–22:00" eller "11:00–14:00, 17:00–22:00". Tom sträng när stängt. */
  text: string;
  closed: boolean;
}

/** Sju rader, måndag först. */
export function weekRows(hours: Hours): DayRow[] {
  return DAY_NAMES.map((name, i) => {
    const spans = spansOf(hours.week[i]);
    if (spans.length === 0) return { name, text: '', closed: true };
    return { name, text: formatSpans(spans), closed: false };
  });
}
