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
 * ## Vad som räknas
 *
 * Två olika saker som är lätta att blanda ihop:
 *
 *   `distinction` i datan   Nuläget, satt av pipeline/prikko/grading.py: minst
 *                           tre kontroller inom treårsfönstret, alla utan
 *                           anmärkning. Det är chipet på verksamhetssidan.
 *
 *   Årsutgåvan              Kräver AWARD_RUN i följd, alltså mer. Se den
 *                           konstanten för varför.
 *
 * Skriptet kontrollerar fortfarande att `distinction` betyder exakt tre i rad,
 * och stannar om grading.py glider. Den vakten är kvar även när ribban för
 * listan ligger högre, för den skyddar mot något annat: att pipelinen tyst
 * ändrar vad chipet betyder.
 *
 * Kör:  node scripts/utmarkelser.mjs [år]
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DATA = join(here, '..', 'src', 'data');
const OUT = join(here, '..', 'src', 'editions');

/** Speglar FRESHNESS_WINDOW_DAYS i pipeline/prikko/grading.py. */
const WINDOW_DAYS = 3 * 365;
/** Speglar HISTORY_DEPTH i samma modul. */
const HISTORY_DEPTH = 3;

/**
 * Ribban för att stå i årsutgåvan. HÖGRE än pipelinens `distinction`.
 *
 * De två var samma sak fram till 2026 års utgåva, och då blev resultatet att
 * 1 541 verksamheter fick utmärkelsen, varav 1 086 i Stockholm. Det är 38
 * procent av Stockholms kontrollerade bestånd. En utmärkelse som drygt en
 * tredjedel får är inte en utmärkelse, den är ett deltagandebevis.
 *
 * Fem i rad ger 148 i stället för 1 541.
 *
 * Varför en ribba och inte ett fast antal per kommun: ägaren bad om ungefär
 * tre per kommun, och det går inte att härleda ur datan. Jönköping lämnar
 * aldrig ut mer än tre kontroller per verksamhet, och 121 verksamheter där
 * ligger på exakt tre. Att välja ut tre av 121 identiska hade betytt att vi
 * sorterar på bokstavsordning och kallar det en bedömning. En ribba plockar
 * ingen: den som når den står med, den som inte gör det står inte med.
 *
 * Priset är att kommuner som publicerar grunt får noll. Det är inte ett
 * omdöme om deras verksamheter utan om deras utlämnande, och sidorna skriver
 * ut skillnaden i klartext.
 */
const AWARD_RUN = 5;

function minusDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Kontrollerna inom fönstret, nyast först.
 *
 * Fönstret ankras i kommunens EGEN hämtningsdag och inte i utgåvans datum.
 * Det är samma dag pipelinen räknade `distinction`, och avvikelser mellan de
 * två skulle annars uppstå för en kommun som hämtades några dagar tidigare.
 */
function inWindow(establishment, asOf) {
  const start = minusDays(asOf, WINDOW_DAYS);
  return establishment.inspections
    .filter((i) => i.date >= start && i.date <= asOf)
    .sort((a, b) => b.date.localeCompare(a.date));
}

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

  const qualified = [];
  let assessed = 0;
  let maxHistory = 0;
  let deepestWindow = 0;
  let pool = 0;

  for (const e of dataset.establishments) {
    establishmentCount += 1;
    if (e.verdict !== null) assessed += 1;
    if (e.inspections.length > maxHistory) maxHistory = e.inspections.length;

    const recent = inWindow(e, asOf);
    if (recent.length > deepestWindow) deepestWindow = recent.length;
    /* Poolen mäts mot utgåvans ribba, inte mot pipelinens. Annars skulle
       "av 310 kontrollerade tillräckligt många gånger klarade 0" räknas mot
       ett tal som ingen av dem ens kunde tävla om. */
    if (recent.length >= AWARD_RUN) pool += 1;

    const run = cleanRun(recent);

    /*
     * Grinden. Utmärkelsen är pipelinens, inte skriptets: `distinction` i datan
     * avgör vem som står i listan. Serien räknas bara fram för att ordna den.
     *
     * De två är samma påstående uttryckt två gånger, och just därför får de
     * aldrig glida isär. Kontrollen är körd mot hela beståndet: 15 916 av
     * 15 916 stämde. Skulle en framtida ändring i grading.py bryta likheten
     * stannar utgåvan här i stället för att publicera en lista där märket och
     * verksamhetssidan säger olika saker.
     */
    if (run >= HISTORY_DEPTH !== e.distinction) {
      throw new Error(
        `${dataset.municipality.slug}/${e.slug}: serien säger ${run} kontroller i följd ` +
          `men datans distinction är ${e.distinction}. Utmärkelsens definition har ` +
          'glidit isär mellan grading.py och det här skriptet.',
      );
    }
    /* Här skiljer utgåvan ut sig från pipelinen. Spärren ovanför vaktar
       fortfarande att `distinction` betyder tre i rad, så en glidning i
       grading.py fångas. Men listan kräver AWARD_RUN. */
    if (run < AWARD_RUN) continue;

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
    /** Dagen kommunens uppgifter hämtades. Utmärkelsens fönster utgår från den. */
    asOf,
    establishments: dataset.establishments.length,
    assessed,
    /** Djupaste kontrollhistorik kommunen lämnar ut för någon verksamhet. */
    maxHistory,
    /**
     * Flest kontroller någon verksamhet i kommunen har INOM fönstret. Det är
     * taket för hur lång serie som alls kan visas här, och skälet till att
     * serielängder inte jämförs mellan kommuner.
     */
    deepestWindow,
    /** Verksamheter som kontrollerats minst AWARD_RUN gånger inom fönstret. */
    pool,
    qualified,
  });
}

municipalities.sort((a, b) => a.city.localeCompare(b.city, 'sv'));

const edition = {
  year,
  /** Dagen utgåvan frystes: den färskaste hämtningen som ingår. */
  asOf: editionAsOf,
  /** Speglar MODEL_VERSION i grading.py vid frysningen. */
  windowDays: WINDOW_DAYS,
  historyDepth: HISTORY_DEPTH,
  /* Ribban som gällde när utgåvan frystes. Skrivs ut i filen så att en gammal
     utgåva går att läsa korrekt även om vi höjer eller sänker den senare: den
     som slår upp 2026 ska få veta vad som krävdes 2026, inte vad som krävs nu. */
  awardRun: AWARD_RUN,
  totals: {
    municipalities: municipalities.length,
    establishments: establishmentCount,
    assessed: assessedCount,
    qualified: qualifiedCount,
  },
  municipalities,
};

mkdirSync(OUT, { recursive: true });
const target = join(OUT, `${year}.json`);
writeFileSync(target, `${JSON.stringify(edition, null, 1)}\n`);

console.log(
  `${year} års utgåva: ${qualifiedCount} verksamheter i ${
    municipalities.filter((m) => m.qualified.length > 0).length
  } av ${municipalities.length} kommuner, fryst per ${editionAsOf}.`,
);
console.log(`Skrev ${target}`);
