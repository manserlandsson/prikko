/**
 * Låsande kontroll av öppettidsutvärderaren.
 *
 *     node site/scripts/check-oppettider.ts
 *
 * `status()` körs i webbläsaren och kan därför inte falla ett bygge. Den är
 * samtidigt den enda kod på sajten som påstår något om NUET, och ett fel där
 * ser ut som ett svar: "Öppet nu" på en låst dörr går inte att skilja från ett
 * riktigt besked. Proven ligger alltså här och körs för hand och i CI.
 *
 * Klockan skickas in i varje prov. Ett prov som läser systemets klocka blir
 * grönt på förmiddagen och rött på kvällen, och det är sämre än inget prov.
 *
 * Avslutar med 1 vid första felet.
 */
import {
  formatSpans,
  isPublicHoliday,
  localNow,
  status,
  weekRows,
  type Hours,
  type LocalNow,
} from '../src/lib/oppettider.ts';

let fel = 0;

function lika(namn: string, fick: unknown, vantat: unknown): void {
  const a = JSON.stringify(fick);
  const b = JSON.stringify(vantat);
  if (a === b) return;
  fel += 1;
  console.error(`FEL  ${namn}\n     fick   ${a}\n     väntat ${b}`);
}

/** Ett nu, angivet i klartext. `dag` är 0 för måndag. */
function nu(ar: number, manad: number, dag: number, klocka: string): LocalNow {
  const [h, m] = klocka.split(':').map(Number);
  const weekday = (new Date(Date.UTC(ar, manad - 1, dag)).getUTCDay() + 6) % 7;
  return { year: ar, month: manad, day: dag, weekday, minutes: h * 60 + m };
}

function hours(week: number[][][], ph: number[][] | null = null): Hours {
  return {
    raw: 'prov',
    week: week as Hours['week'],
    ph: ph as Hours['ph'],
    osm: 'node/1',
    checkedAt: '2026-08-18',
  };
}

const STANGD: number[][] = [];
/* Måndag till fredag 11:00-22:00, helgen stängd. 2026-08-17 är en måndag. */
const vardagar = hours([
  [[660, 1320]],
  [[660, 1320]],
  [[660, 1320]],
  [[660, 1320]],
  [[660, 1320]],
  STANGD,
  STANGD,
]);

// --- Öppet, stänger snart, stängt ------------------------------------------

lika(
  'mitt på dagen är det öppet',
  status(vardagar, nu(2026, 8, 17, '13:00')),
  { state: 'open', label: 'Öppet nu', detail: 'Stänger 22:00' },
);

lika(
  'en timme före stängning står det stänger snart',
  status(vardagar, nu(2026, 8, 17, '21:15')),
  { state: 'closing', label: 'Stänger snart', detail: 'Stänger 22:00' },
);

lika(
  'exakt en timme före är fortfarande stänger snart',
  status(vardagar, nu(2026, 8, 17, '21:00')),
  { state: 'closing', label: 'Stänger snart', detail: 'Stänger 22:00' },
);

lika(
  'en minut tidigare är bara öppet',
  status(vardagar, nu(2026, 8, 17, '20:59')),
  { state: 'open', label: 'Öppet nu', detail: 'Stänger 22:00' },
);

lika(
  'på morgonen är det stängt och öppnar samma dag',
  status(vardagar, nu(2026, 8, 17, '08:00')),
  { state: 'closed', label: 'Stängt nu', detail: 'Öppnar 11:00' },
);

lika(
  'efter stängning öppnar det i morgon',
  status(vardagar, nu(2026, 8, 17, '23:00')),
  { state: 'closed', label: 'Stängt nu', detail: 'Öppnar i morgon 11:00' },
);

// --- Helgen ----------------------------------------------------------------

lika(
  'på lördagen är det stängt och nästa öppning står med veckodag',
  // 2026-08-22 är en lördag.
  status(vardagar, nu(2026, 8, 22, '13:00')),
  { state: 'closed', label: 'Stängt nu', detail: 'Öppnar måndag 11:00' },
);

lika(
  'på söndagen står det i morgon och inte måndag',
  status(vardagar, nu(2026, 8, 23, '13:00')),
  { state: 'closed', label: 'Stängt nu', detail: 'Öppnar i morgon 11:00' },
);

// --- Natten över ------------------------------------------------------------

/* Fredag och lördag 18:00-02:00. Slutet skrivs som 1560, alltså efter
   midnatt, och ligger kvar på fredagens rad. */
const nattklubb = hours([
  STANGD,
  STANGD,
  STANGD,
  STANGD,
  [[1080, 1560]],
  [[1080, 1560]],
  STANGD,
]);

lika(
  'halv ett på lördagsmorgonen är fredagskvällen fortfarande öppen',
  status(nattklubb, nu(2026, 8, 22, '00:30')),
  { state: 'open', label: 'Öppet nu', detail: 'Stänger 02:00' },
);

lika(
  'klockan 01:30 stänger det snart',
  status(nattklubb, nu(2026, 8, 22, '01:30')),
  { state: 'closing', label: 'Stänger snart', detail: 'Stänger 02:00' },
);

lika(
  'klockan tre är det stängt och öppnar samma kväll',
  status(nattklubb, nu(2026, 8, 22, '03:00')),
  { state: 'closed', label: 'Stängt nu', detail: 'Öppnar 18:00' },
);

// --- Två pass på samma dag --------------------------------------------------

const lunchOchKvall = hours([
  [[660, 840], [1020, 1320]],
  [[660, 840], [1020, 1320]],
  [[660, 840], [1020, 1320]],
  [[660, 840], [1020, 1320]],
  [[660, 840], [1020, 1320]],
  STANGD,
  STANGD,
]);

lika(
  'mellan passen är det stängt och öppnar igen samma dag',
  status(lunchOchKvall, nu(2026, 8, 17, '15:00')),
  { state: 'closed', label: 'Stängt nu', detail: 'Öppnar 17:00' },
);

lika(
  'i lunchpasset stänger det 14:00 och inte 22:00',
  status(lunchOchKvall, nu(2026, 8, 17, '12:00')),
  { state: 'open', label: 'Öppet nu', detail: 'Stänger 14:00' },
);

// --- Dygnet runt ------------------------------------------------------------

const dygnetRunt = hours(Array.from({ length: 7 }, () => [[0, 1440]]));

lika(
  'dygnet runt varnar aldrig för stängning',
  status(dygnetRunt, nu(2026, 8, 17, '23:45')),
  { state: 'open', label: 'Öppet nu', detail: 'Dygnet runt' },
);

// --- Röda dagar -------------------------------------------------------------

const medHelgdag = hours(
  [
    [[660, 1320]],
    [[660, 1320]],
    [[660, 1320]],
    [[660, 1320]],
    [[660, 1320]],
    [[660, 1320]],
    [[660, 1320]],
  ],
  [],
);

lika(
  'juldagen är stängd trots att veckoschemat säger öppet',
  // 2026-12-25 är en fredag, alltså öppen enligt veckoschemat. Annandagen är
  // också röd, så nästa öppning är söndagen därpå.
  status(medHelgdag, nu(2026, 12, 25, '13:00')),
  { state: 'closed', label: 'Stängt nu', detail: 'Öppnar söndag 11:00' },
);

lika(
  'nästa öppning hoppar över BÅDA röda dagarna',
  status(medHelgdag, nu(2026, 12, 24, '23:00')),
  { state: 'closed', label: 'Stängt nu', detail: 'Öppnar söndag 11:00' },
);

/* Öppet bara på måndagar, och klockan är 23:00 på en måndag. Sju dygn fram är
   samma veckodag, och "Öppnar måndag" hade lästs som i kväll. */
const baraMandag = hours([[[660, 1320]], STANGD, STANGD, STANGD, STANGD, STANGD, STANGD]);
lika(
  'samma veckodag en vecka fram skrivs som nästa',
  status(baraMandag, nu(2026, 8, 17, '23:00')),
  { state: 'closed', label: 'Stängt nu', detail: 'Öppnar nästa måndag 11:00' },
);

/* De rörliga helgdagarna räknas ur påsken. 2026 infaller påskdagen 5 april. */
lika('långfredagen 2026 är röd', isPublicHoliday(2026, 4, 3), true);
lika('påskdagen 2026 är röd', isPublicHoliday(2026, 4, 5), true);
lika('annandag påsk 2026 är röd', isPublicHoliday(2026, 4, 6), true);
lika('Kristi himmelsfärd 2026 är röd', isPublicHoliday(2026, 5, 14), true);
lika('pingstdagen 2026 är röd', isPublicHoliday(2026, 5, 24), true);
lika('midsommardagen 2026 är röd', isPublicHoliday(2026, 6, 20), true);
lika('alla helgons dag 2026 är röd', isPublicHoliday(2026, 10, 31), true);
lika('nationaldagen är röd', isPublicHoliday(2026, 6, 6), true);
/* Julafton är INTE en allmän helgdag i lagens mening. Att räkna in den hade
   varit att tolka mer än källan säger, se lib/oppettider.ts. */
lika('julafton är inte en allmän helgdag', isPublicHoliday(2026, 12, 24), false);
lika('en vanlig tisdag är inte röd', isPublicHoliday(2026, 8, 18), false);
/* Påsken 2027 infaller 28 mars, alltså en annan månad. Formeln ska klara det. */
lika('påskdagen 2027 är röd', isPublicHoliday(2027, 3, 28), true);

// --- Presentation -----------------------------------------------------------

lika('spann sätts med halvt fyrkantsstreck', formatSpans([[660, 1320]]), '11:00–22:00');
lika(
  'två pass skiljs med komma',
  formatSpans([[660, 840], [1020, 1320]]),
  '11:00–14:00, 17:00–22:00',
);
lika('ett spann över midnatt skrivs som klockslag', formatSpans([[1080, 1560]]), '18:00–02:00');

lika(
  'veckoraderna börjar på måndag och skriver stängt som stängt',
  weekRows(vardagar).map((r) => `${r.name} ${r.closed ? 'Stängt' : r.text}`),
  [
    'Måndag 11:00–22:00',
    'Tisdag 11:00–22:00',
    'Onsdag 11:00–22:00',
    'Torsdag 11:00–22:00',
    'Fredag 11:00–22:00',
    'Lördag Stängt',
    'Söndag Stängt',
  ],
);

// --- Klockan i Sverige ------------------------------------------------------

/* Sommartid: 12:00 UTC är 14:00 i Stockholm. Läser koden webbläsarens egen
   tidszon i stället för verksamhetens blir varje besökare utanför Sverige
   serverad fel besked. */
lika(
  'nuet läses i svensk tid och inte i webbläsarens',
  localNow(new Date('2026-08-17T12:00:00Z')).minutes,
  14 * 60,
);
lika(
  'måndag är dag noll',
  localNow(new Date('2026-08-17T12:00:00Z')).weekday,
  0,
);
/* Vintertid: 12:00 UTC är 13:00 i Stockholm. */
lika(
  'vintertid ger en timmes förskjutning och inte två',
  localNow(new Date('2026-12-14T12:00:00Z')).minutes,
  13 * 60,
);

if (fel > 0) {
  console.error(`\n${fel} prov föll.`);
  process.exit(1);
}
console.log('Öppettider: alla prov gick igenom.');
