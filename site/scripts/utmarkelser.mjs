/**
 * Fryser en årsutgåva av hederslistan.
 *
 * ## Varför en fryst fil och inte en beräkning vid bygget
 *
 * Resten av sajten räknas om vid varje bygge, och det är rätt där: en
 * verksamhetssida ska visa nuläget. En årslista är motsatsen. Den är ett
 * påstående om ett datum, och ett påstående om ett datum får inte ändra sig i
 * efterhand.
 *
 * Skälet är märket. En verksamhet som sätter "Prikko 2026" i fönstret har fått
 * något av oss, och det vi gav måste gå att slå upp. Vore listan levande skulle
 * raden försvinna nästa gång kommunen hittar en avvikelse, och märket i fönstret
 * skulle peka på en sida som säger att verksamheten aldrig funnits med. Det är
 * värre än att inte ge något märke alls.
 *
 * Därför: den här filen körs EN gång per utgåva, skriver `src/editions/<år>.json`
 * och filen checkas in. Sidorna läser den. Ändras kommunernas register efteråt
 * ändras nuläget på verksamhetssidan, men utgåvan står kvar och säger vad som
 * gällde den dag den frystes.
 *
 * ## Två olika ribbor med två olika namn
 *
 * De hette båda "utmärkelsen" fram till augusti 2026, och en besökare som läste
 * metodiksidan och utgåvesidan fick därför två svar på samma fråga. Nu:
 *
 *   REN HISTORIK   Nuläget, satt av `distinction` i pipeline/prikko/grading.py:
 *                  minst HISTORY_DEPTH kontroller inom treårsfönstret, alla utan
 *                  anmärkning. Det är chipet på verksamhetssidan, och det
 *                  försvinner samma dag kommunen hittar en avvikelse.
 *
 *   UTMÄRKELSEN    Årsutgåvan och märket. AWARD_RUN kontroller I RAD utan
 *                  anmärkning, hur långt tillbaka de än ligger. Se den
 *                  konstanten.
 *
 * Skriptet kontrollerar fortfarande att `distinction` betyder exakt tre i rad
 * inom fönstret, och stannar om grading.py glider. Den vakten skyddar chipet och
 * har ingenting med utmärkelsens ribba att göra.
 *
 * Kör:  node scripts/utmarkelser.mjs [år]
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DATA = join(here, '..', 'src', 'data');
const OUT = join(here, '..', 'src', 'editions');

/** Speglar FRESHNESS_WINDOW_DAYS i pipeline/prikko/grading.py. */
const WINDOW_DAYS = 3 * 365;
/** Speglar HISTORY_DEPTH i samma modul. Chipets ribba, inte utmärkelsens. */
const HISTORY_DEPTH = 3;

/**
 * Vilken modell som räknade fram utgåvan.
 *
 *   1  AWARD_RUN kontroller inom ett fönster på WINDOW_DAYS.
 *   2  AWARD_RUN kontroller i rad, utan fönster, med krav på att den senaste
 *      är färsk nog att alls bedöma.
 *
 * Talet skrivs in i utgåvan och sidorna läser det därifrån. Metodiksidan sade
 * en gång version 2 när modellen var 3, och utgåvesidan sade tre kontroller när
 * ribban var fem. Ett tal i filen kan inte glida ifrån filen.
 */
const AWARD_MODEL = 2;

/**
 * Ribban för att stå i årsutgåvan: kontroller i RAD utan anmärkning.
 *
 * ## Varför fönstret är borta
 *
 * Fram till augusti 2026 krävdes fem kontroller inom 1 095 dagar. Den regeln
 * mätte fel sak. AG i Stockholm har tretton kontroller utan en enda anmärkning
 * sedan 2018, Allegrine nio sedan samma tid; båda inspekteras ungefär en gång om
 * året och hade därför bara tre i fönstret. De stod utanför listan medan en
 * verksamhet med fem kontroller på arton månader stod med. Modellen belönade
 * alltså kommunens KONTROLLFREKVENS, inte verksamhetens renlighet, och
 * frekvensen bestäms av riskklass och myndighetens planering.
 *
 * Serien i rad har ingen sådan slagsida. Fem kontroller utan anmärkning är fem
 * kontroller utan anmärkning oavsett om de tog två år eller åtta.
 *
 * ## Varför färskhetskravet är bedömningen själv och inget eget tal
 *
 * En serie som slutade 2019 säger inget om i dag, så den senaste kontrollen
 * måste vara färsk. Villkoret är att verksamheten HAR en bedömning: `verdict`
 * sätts bara när den senaste kontrollen ligger inom WINDOW_DAYS, och det är
 * exakt samma gräns som avgör om sajten alls uttalar sig om en verksamhet.
 *
 * Att läsa pipelinens svar i stället för att räkna om datumen själv är inte
 * bekvämlighet. Ett eget tal hade blivit en tredje ribba att hålla reda på, och
 * hade kunnat ge en verksamhet som visar "Inga anmärkningar" på sin sida ett
 * avslag vars skäl läsaren inte kan se. Dessutom räknar pipelinen mot sin
 * körningsdag och utgåvan mot hämtdagen; ligger en kontroll precis på fönstrets
 * kant hamnar de på olika sidor om den. Utgåvan ska inte ha en egen mening om
 * den saken.
 *
 * ## Varför fem och inte åtta
 *
 * Mätt på hela beståndet, andel av de bedömda i Stockholm: fem i rad ger 14,6
 * procent, sex 8,7, sju 4,8, åtta 2,3. Åtta hade alltså gett en snävare lista.
 * Två skäl väger tyngre.
 *
 * Det första är taket. Ingen kommun kan visa en längre serie än den publicerar.
 * Vid fem kan sex av tolv kommuner nå utmärkelsen, vid sex fyra, vid åtta tre.
 * Ribban skulle då avgöras av Stockholms, Linköpings och Örebros register
 * ensamma, och resten av landet vore uteslutet på förhand.
 *
 * Det andra är löftet om det redan utdelade. 2026 års utgåva är publicerad. Vid
 * sex i rad förlorar 66 av dess 148 verksamheter sin utmärkelse, vid åtta 115.
 * Vid fem förlorar ingen: varje verksamhet som klarade fem inom fönstret har per
 * definition fem i rad. Se assertNoLosses längre ner, som gör det till en
 * byggregel i stället för en avsikt.
 *
 * Fem i rad är dessutom strängare än förebilden. Danmarks Elite-Smiley kräver
 * fyra i rad och innehas av ungefär en tredjedel av deras verksamheter; vår
 * ribba ger 9,7 procent av de bedömda.
 */
const AWARD_RUN = 5;

function minusDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Kontrollerna till och med hämtdagen, nyast först. */
function history(establishment, asOf) {
  return establishment.inspections
    .filter((i) => i.date <= asOf)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Kontrollerna från och med `start`, nyast först.
 *
 * Används bara till vakten om chipet. Fönstret ankras i kommunens EGEN
 * hämtningsdag och inte i utgåvans datum, eftersom det är ungefär den dag
 * pipelinen räknade `distinction`.
 */
function since(recent, start) {
  return recent.filter((i) => i.date >= start);
}

/**
 * Hur många dygn hämtdagen och pipelinens körningsdag får skilja sig åt.
 *
 * Kontrollerna hämtas en natt och bedöms samma natt, men en modelländring
 * räknas om senare med recompute.py, och då är fönstret ankrat i den dagen i
 * stället. Ligger en kontroll precis på fönstrets kant hamnar de två på olika
 * sidor om den: i Stockholm gällde det en verksamhet av 7 955, vars äldsta
 * kontroll låg på fönstrets första dag.
 *
 * Vakten om chipet ska fånga att grading.py ÄNDRAT betydelse, inte att klockan
 * gått. Därför godtas chipet om det stämmer med fönstret ankrat i hämtdagen
 * eller i hämtdagen plus det här talet. En verklig glidning i HISTORY_DEPTH
 * bryter mot båda och stannar bygget som förut.
 */
const CLOCK_DRIFT_DAYS = 7;

/** Antal kontroller i obruten följd utan anmärkning, bakåt från den senaste. */
function cleanRun(recent) {
  let run = 0;
  for (const i of recent) {
    if (i.assessment !== 0) break;
    run += 1;
  }
  return run;
}

const year = Number(process.argv[2] ?? new Date().getFullYear());
if (!Number.isInteger(year) || year < 2020 || year > 2100) {
  throw new Error(`Orimligt årtal: ${process.argv[2]}`);
}

const target = join(OUT, `${year}.json`);
/** Utgåvan som redan ligger publicerad, om det finns någon. */
const published = existsSync(target) ? JSON.parse(readFileSync(target, 'utf8')) : null;

const municipalities = [];
let establishmentCount = 0;
let assessedCount = 0;
let qualifiedCount = 0;
let editionAsOf = '';

for (const file of readdirSync(DATA).filter((f) => f.endsWith('.json')).sort()) {
  const dataset = JSON.parse(readFileSync(join(DATA, file), 'utf8'));
  if (!dataset.municipality || !Array.isArray(dataset.establishments)) continue;

  const asOf = dataset.source.fetchedAt.slice(0, 10);
  if (asOf > editionAsOf) editionAsOf = asOf;
  /* Fönstrets tidigaste dag, ankrad i hämtdagen respektive så sent pipelinens
     klocka rimligen kan ha stått. Bara vakten om chipet behöver dem. */
  const windowFrom = minusDays(asOf, WINDOW_DAYS);
  const windowFromLate = minusDays(asOf, WINDOW_DAYS - CLOCK_DRIFT_DAYS);

  const qualified = [];
  let assessed = 0;
  let maxHistory = 0;
  let deepestWindow = 0;
  let pool = 0;

  for (const e of dataset.establishments) {
    establishmentCount += 1;
    if (e.verdict !== null) assessed += 1;
    if (e.inspections.length > maxHistory) maxHistory = e.inspections.length;

    const recent = history(e, asOf);
    const windowed = since(recent, windowFrom);
    if (windowed.length > deepestWindow) deepestWindow = windowed.length;

    /*
     * Vakten om CHIPET. Den har ingenting med listan att göra: den ser till att
     * `distinction` i datan fortfarande betyder tre kontroller i rad inom
     * fönstret. Skulle en framtida ändring i grading.py flytta chipet utan att
     * någon säger det, stannar utgåvan här i stället för att publiceras bredvid
     * en verksamhetssida som säger något annat.
     *
     * Fönstret smalnar av när ankaret flyttas framåt, så de två anvisningarna
     * ger chipets ytterlägen. Se CLOCK_DRIFT_DAYS.
     */
    const chipEarly = cleanRun(windowed) >= HISTORY_DEPTH;
    const chipLate = cleanRun(since(recent, windowFromLate)) >= HISTORY_DEPTH;
    if (e.distinction !== chipEarly && e.distinction !== chipLate) {
      throw new Error(
        `${dataset.municipality.slug}/${e.slug}: fönstret ger ` +
          `${cleanRun(windowed)} kontroller i följd men datans distinction är ` +
          `${e.distinction}. Chipets definition har glidit isär mellan grading.py ` +
          'och det här skriptet.',
      );
    }

    /* Färskhetskravet, läst ur pipelinens eget svar. `verdict` sätts bara när
       den senaste kontrollen ligger inom treårsfönstret; utan bedömning finns
       inget att utmärka. Se AWARD_RUN för varför utgåvan inte räknar om det. */
    if (e.verdict === null) continue;

    /* Poolen mäts mot utgåvans egen ribba: de som alls hunnit kontrolleras
       AWARD_RUN gånger är de som kunde tävla om utmärkelsen. */
    if (recent.length >= AWARD_RUN) pool += 1;

    const run = cleanRun(recent);
    if (run < AWARD_RUN) continue;

    /* En serie som börjar i den senaste kontrollen och är ren betyder att den
       senaste kontrollen är ren, alltså att bedömningen är "Inga anmärkningar".
       Går de isär är det datan som är trasig, inte listan som är fel. */
    if (e.verdict !== 'clean') {
      throw new Error(
        `${dataset.municipality.slug}/${e.slug}: ${run} rena kontroller i rad men ` +
          `bedömningen är ${e.verdict}. Utgåvan vägrar publicera en utmärkelse ` +
          'bredvid ett annat besked.',
      );
    }

    const series = recent.slice(0, run);
    qualified.push({
      slug: e.slug,
      name: e.name,
      address: e.address,
      /** Verksamhetstypen som kommunen anger, för att skilja likalydande namn. */
      type: e.types[0] ?? null,
      /** Kontroller i följd utan anmärkning. Listans enda rangordningsgrund. */
      run,
      /** Äldsta respektive senaste kontrollen i serien. */
      from: series[series.length - 1].date,
      to: series[0].date,
    });
  }

  // Bokstavsordning inom serielängden. Se lib/utmarkelser.ts för varför
  // raderna inte numreras.
  qualified.sort(
    (a, b) => b.run - a.run || a.name.localeCompare(b.name, 'sv') || a.slug.localeCompare(b.slug),
  );

  assessedCount += assessed;
  qualifiedCount += qualified.length;

  municipalities.push({
    slug: dataset.municipality.slug,
    city: dataset.municipality.city,
    name: dataset.municipality.name,
    /** Dagen kommunens uppgifter hämtades. Färskhetskravet utgår från den. */
    asOf,
    establishments: dataset.establishments.length,
    assessed,
    /**
     * Djupaste kontrollhistorik kommunen lämnar ut för någon verksamhet. Det är
     * taket för hur lång serie som alls kan visas här, och skälet till att
     * serielängder inte jämförs mellan kommuner.
     */
    maxHistory,
    /** Samma tak räknat inom treårsfönstret. Chipets tak, inte utmärkelsens. */
    deepestWindow,
    /** Verksamheter som alls kontrollerats AWARD_RUN gånger, med aktuell bedömning. */
    pool,
    qualified,
  });
}

municipalities.sort((a, b) => a.city.localeCompare(b.city, 'sv'));

/**
 * En publicerad utgåva får bara växa.
 *
 * Att räkna om en fryst utgåva är i sig ett brott mot löftet om att den står
 * still, och det görs en enda gång: när modellen bakom den visat sig mäta fel
 * sak. Det som ALDRIG får hända är att någon försvinner. Ett märke i ett fönster
 * pekar på den här listan, och en verksamhet som inte längre står där har fått
 * ett märke som ljuger om oss.
 *
 * Därför en byggregel och inte en avsikt: skulle en framtida ribba plocka bort
 * någon stannar skriptet, och då är svaret en NY årsutgåva med den nya ribban,
 * inte en omskrivning av den gamla.
 */
function assertNoLosses(before, after) {
  if (!before) return null;
  const now = new Set();
  for (const m of after) for (const q of m.qualified) now.add(`${m.slug}/${q.slug}`);

  const lost = [];
  for (const m of before.municipalities) {
    for (const q of m.qualified) {
      if (!now.has(`${m.slug}/${q.slug}`)) lost.push(`${m.slug}/${q.slug}`);
    }
  }
  if (lost.length > 0) {
    throw new Error(
      `${lost.length} verksamheter skulle förlora en redan publicerad utmärkelse: ` +
        `${lost.slice(0, 5).join(', ')}${lost.length > 5 ? ' …' : ''}. En fryst utgåva ` +
        'får bara växa. Frys en ny årsutgåva i stället.',
    );
  }
  return before;
}

const previous = assertNoLosses(published, municipalities);

/**
 * Vad som ändrades när utgåvan räknades om, i klartext och räknat ur filerna.
 *
 * Sidorna skriver ut det. En läsare som såg listan i går ska kunna se att den
 * vuxit, varför, och att ingen togs bort. En lista som blivit många gånger
 * längre över en natt utan ett ord om saken är en lista man slutar tro på.
 *
 * Blocket sätts en gång, den dagen modellen byttes, och bärs sedan vidare
 * oförändrat. Körs skriptet om med samma modell ska inget nytt datum uppstå.
 */
let revision = previous?.revision ?? null;
if (previous && (previous.awardModel ?? 1) !== AWARD_MODEL) {
  revision = {
    /** Dagen utgåvan först frystes. */
    frozen: previous.asOf,
    /** Dagen modellen rättades och listan räknades om. */
    revised: new Date().toISOString().slice(0, 10),
    previousModel: previous.awardModel ?? 1,
    previousRun: previous.awardRun ?? previous.historyDepth,
    previousQualified: previous.totals.qualified,
    added: qualifiedCount - previous.totals.qualified,
    removed: 0,
  };
}

const edition = {
  year,
  /** Dagen utgåvan frystes: den färskaste hämtningen som ingår. */
  asOf: editionAsOf,
  /** Modellen som räknade fram listan. Se AWARD_MODEL. */
  awardModel: AWARD_MODEL,
  /* Ribban som gällde när utgåvan frystes. Skrivs ut i filen så att en gammal
     utgåva går att läsa korrekt även om vi höjer eller sänker den senare: den
     som slår upp 2026 ska få veta vad som krävdes 2026. */
  awardRun: AWARD_RUN,
  /** Hur gammal den senaste kontrollen får vara för att serien ska räknas. */
  freshnessDays: WINDOW_DAYS,
  /** Chipets ribba vid frysningen. Speglar grading.py, styr inte listan. */
  windowDays: WINDOW_DAYS,
  historyDepth: HISTORY_DEPTH,
  revision,
  totals: {
    municipalities: municipalities.length,
    establishments: establishmentCount,
    assessed: assessedCount,
    qualified: qualifiedCount,
  },
  municipalities,
};

mkdirSync(OUT, { recursive: true });
writeFileSync(target, `${JSON.stringify(edition, null, 1)}\n`);

console.log(
  `${year} års utgåva: ${qualifiedCount} verksamheter i ${
    municipalities.filter((m) => m.qualified.length > 0).length
  } av ${municipalities.length} kommuner, fryst per ${editionAsOf}.`,
);
if (previous) {
  console.log(
    `Tidigare: ${previous.totals.qualified} verksamheter, modell ${previous.awardModel ?? 1}. ` +
      `Ingen förlorade sin plats.`,
  );
  for (const m of municipalities) {
    const was = previous.municipalities.find((p) => p.slug === m.slug);
    if (!was) continue;
    if (was.qualified.length === m.qualified.length) continue;
    console.log(`  ${m.slug}: ${was.qualified.length} → ${m.qualified.length}`);
  }
}
console.log(`Skrev ${target}`);
