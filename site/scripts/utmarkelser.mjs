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
 *                  minst HISTORY_DEPTH kontroller inom femårsfönstret, alla utan
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

/**
 * Speglar FRESHNESS_WINDOW_DAYS i pipeline/prikko/grading.py.
 *
 * Talet gick från tre år till fem i augusti 2026. Vakten om chipet längre ner
 * jämför mot `distinction` i datan och stannar bygget om de två glider isär, så
 * en glömd ändring här blir ett stopp och inte en utgåva som motsäger
 * verksamhetssidan.
 */
const WINDOW_DAYS = 5 * 365;
/** Speglar HISTORY_DEPTH i samma modul. Chipets ribba, inte utmärkelsens. */
const HISTORY_DEPTH = 3;

/**
 * Vilken modell som räknade fram utgåvan.
 *
 *   1  Fem kontroller inom ett fönster på 1 095 dagar, alltså det dåvarande
 *      WINDOW_DAYS.
 *   2  Fem kontroller i rad, utan fönster, hos en verksamhet med bedömning.
 *   3  Kontroller i rad, utan fönster, med en ribba som HÄRLEDS PER KOMMUN ur
 *      kommunens egen data. Se AWARD_TARGET.
 *
 * Talet skrivs in i utgåvan och sidorna läser det därifrån. Metodiksidan sade
 * en gång version 2 när modellen var 3, och utgåvesidan sade tre kontroller när
 * ribban var fem. Ett tal i filen kan inte glida ifrån filen.
 */
const AWARD_MODEL = 3;

/**
 * Ribban: kontroller i RAD utan anmärkning, olika många i olika kommuner.
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
 * ## Varför ribban inte kan vara ett tal för hela landet
 *
 * Ett gemensamt tal måste väljas för den kommun som publicerar minst eller för
 * den som publicerar mest, och båda valen förstör listan. Mätt på hela beståndet
 * med en gemensam ribba:
 *
 *   Ribba 3   Jönköping 121 utmärkta, Stockholm 2 707. 37 procent av Stockholms
 *             bedömda verksamheter. Ett deltagandebevis.
 *   Ribba 5   Stockholm 1 061, alltså 14,6 procent, och sex kommuner kan inte
 *             nå utmärkelsen alls eftersom deras register är grundare än fem.
 *   Ribba 8   Stockholm 169, alltså 2,3 procent, men bara tre kommuner i landet
 *             har ett register som ens är åtta kontroller djupt.
 *
 * Talet mäter alltså inte hur skötsamma verksamheterna är utan hur djupt
 * kommunen publicerar och hur ofta den kontrollerar. Örebro kontrollerar
 * ungefär hälften så ofta som Linköping; en gemensam ribba låter det avgöra vem
 * som får en utmärkelse.
 *
 * ## Vad ribban i stället är
 *
 * Utgåvan är per kommun, och ribban härleds ur kommunens egen data: den lägsta
 * serielängd som gör utmärkelsen minst lika sällsynt som AWARD_TARGET bland
 * kommunens bedömda verksamheter. Utfallet i den här utgåvan:
 *
 *   Stockholm 8 (2,3 %)   Linköping 11 (2,4 %)   Örebro 7 (3,0 %)
 *   Uppsala 4 (1,9 %)     Borgholm 4 (0,3 %)
 *
 * Märket betyder därmed samma sak överallt: bland de tre procent i kommunen som
 * har längst obruten ren kontrollhistorik. Det är inte samma serielängd, och
 * ribban står utskriven på varje kommuns sida så att ingen behöver gissa.
 *
 * En kommun rangordnas inte av det här. En hög ribba betyder att kommunen
 * publicerar djup historik, inte att dess kök är renare eller dess inspektörer
 * strängare.
 */
const AWARD_TARGET = 0.03;

/**
 * Ribban går aldrig under det här, hur grund kommunens historik än är.
 *
 * Skälet är att utmärkelsen måste säga MER än märkningen "ren historik", som
 * kräver tre kontroller utan anmärkning inom femårsfönstret. En ribba på tre
 * hade gjort de två nästan utbytbara i just de kommuner där skillnaden är
 * svårast att förklara, och de två har redan blandats ihop en gång.
 *
 * Priset är Höganäs och Jönköping, vars register är exakt tre kontroller djupa.
 * De kan alltså inte nå utmärkelsen. Det är ett faktum om vad kommunen lämnar
 * ut och sidorna skriver ut det i klartext.
 *
 * Golvet kostar också en bredare lista i Borgholm: med golv tre hade sex
 * verksamheter där stått med i stället för en. Sex rader köpta genom att sudda
 * gränsen mellan utmärkelsen och märkningen är inte värt priset.
 */
const AWARD_FLOOR = 4;

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

  /** Serien per verksamhet, uträknad en gång. Ribban behöver hela fördelningen. */
  const runs = [];
  let assessed = 0;
  let maxHistory = 0;
  let deepestWindow = 0;

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
       den senaste kontrollen ligger inom färskhetsfönstret; utan bedömning finns
       inget att utmärka. Se AWARD_TARGET för varför utgåvan inte räknar om det. */
    if (e.verdict === null) continue;

    runs.push({ e, recent, run: cleanRun(recent) });
  }

  /*
   * Ribban, härledd ur kommunens egen fördelning.
   *
   * Den lägsta serielängd från AWARD_FLOOR och uppåt som gör utmärkelsen minst
   * lika sällsynt som AWARD_TARGET bland kommunens bedömda verksamheter.
   * Andelen faller när ribban höjs och når till slut noll, så det finns alltid
   * ett svar. Blir svaret djupare än kommunens register kan ingen nå det, och
   * sidorna redovisar kommunen som utestängd i stället för tom.
   */
  const share = (k) => (assessed === 0 ? 0 : runs.filter((r) => r.run >= k).length / assessed);
  let awardRun = AWARD_FLOOR;
  while (share(awardRun) > AWARD_TARGET) awardRun += 1;

  const qualified = [];
  let pool = 0;

  for (const { e, recent, run } of runs) {
    /* Poolen mäts mot kommunens egen ribba: de som alls hunnit kontrolleras så
       många gånger är de som kunde tävla om utmärkelsen. */
    if (recent.length >= awardRun) pool += 1;
    if (run < awardRun) continue;

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
     * Kommunens egen ribba: kontroller i rad som krävdes här. Skrivs ut på
     * sidan; ingen ska behöva gissa varför Stockholm kräver åtta.
     */
    awardRun,
    /**
     * Djupaste kontrollhistorik kommunen lämnar ut för någon verksamhet. Det är
     * taket för hur lång serie som alls kan visas här, och skälet till att
     * serielängder inte jämförs mellan kommuner.
     */
    maxHistory,
    /** Samma tak räknat inom färskhetsfönstret. Chipets tak, inte utmärkelsens. */
    deepestWindow,
    /** Verksamheter som alls kontrollerats awardRun gånger, med aktuell bedömning. */
    pool,
    qualified,
  });
}

municipalities.sort((a, b) => a.city.localeCompare(b.city, 'sv'));

/**
 * Vem som fanns i den publicerade utgåvan men inte i den nya.
 *
 * Ett märke i ett fönster pekar på den här listan. En verksamhet som inte längre
 * står där har fått ett märke som ljuger om oss, och det är värre än att inte ge
 * något märke alls.
 */
function losses(before, after) {
  if (!before) return [];
  const now = new Set();
  for (const m of after) for (const q of m.qualified) now.add(`${m.slug}/${q.slug}`);
  const lost = [];
  for (const m of before.municipalities) {
    for (const q of m.qualified) {
      if (!now.has(`${m.slug}/${q.slug}`)) lost.push(`${m.slug}/${q.slug}`);
    }
  }
  return lost;
}

/**
 * En publicerad utgåva får bara växa, och undantaget gäller en enda gång.
 *
 * Vakten är kvar av samma skäl som förut. Den enda anledningen att den gick att
 * öppna i augusti 2026 var att sajten var dagar gammal: ingen hade sett listan,
 * ingen verksamhet hade hunnit åberopa sitt märke, ingen extern länk pekade hit.
 * Om ett halvår gäller inte något av det, och då ska bygget fällas utan att
 * någon behöver komma ihåg att sätta tillbaka vakten.
 *
 * Därför två spärrar:
 *
 *   1. Förluster kräver flaggan --godkann-forluster="<skäl>" på kommandoraden.
 *      Utan den stannar skriptet, som förut.
 *   2. Flaggan biter bara på en utgåva som inte redan har öppnats. Har filen ett
 *      `lossesAccepted` i sitt revisionsblock är svaret en NY årsutgåva, och
 *      ingen flagga i världen skriver om den gamla igen.
 *
 * Skälet skrivs in i utgåvan och ut på sidan. Ett undantag som inte syns är
 * inget undantag, det är en tyst ändring.
 */
function acceptLosses(before, lost) {
  const flag = process.argv.find((a) => a.startsWith('--godkann-forluster'));
  const reason = flag?.includes('=') ? flag.slice(flag.indexOf('=') + 1).trim() : '';

  if (lost.length === 0) return null;

  if (!flag) {
    throw new Error(
      `${lost.length} verksamheter skulle förlora en redan publicerad utmärkelse: ` +
        `${lost.slice(0, 5).join(', ')}${lost.length > 5 ? ' …' : ''}. En fryst utgåva ` +
        'får bara växa. Frys en ny årsutgåva i stället, eller kör om med ' +
        '--godkann-forluster="skäl" om utgåvan bevisligen inte nått någon ännu.',
    );
  }
  if (!reason) {
    throw new Error(
      '--godkann-forluster kräver ett skäl: --godkann-forluster="därför att ...". ' +
        'Skälet publiceras på utgåvans sida.',
    );
  }
  if (before?.revision?.lossesAccepted) {
    throw new Error(
      `${year} års utgåva har redan skrivits om med förluster ` +
        `(${before.revision.lossesAccepted.date}: ${before.revision.lossesAccepted.reason}). ` +
        'En utgåva öppnas en gång. Frys en ny årsutgåva i stället.',
    );
  }
  return { count: lost.length, reason, date: new Date().toISOString().slice(0, 10) };
}

const previous = published;
const lost = losses(previous, municipalities);
const lossesAccepted = acceptLosses(previous, lost);

/**
 * Vad som ändrades när utgåvan räknades om, i klartext och räknat ur filerna.
 *
 * Sidorna skriver ut det. En läsare som såg listan i går ska kunna se hur den
 * ändrats och varför. En lista som krympt till en femtedel över en natt utan ett
 * ord om saken är en lista man slutar tro på, och en som vuxit tio gånger likaså.
 *
 * `frozen` och `originalQualified` följer med genom varje omräkning, så att
 * jämförelsen alltid går mot den första frysningen och inte mot ett mellanläge
 * som stod uppe i en timme.
 */
let revision = previous?.revision ?? null;
if (previous && (previous.awardModel ?? 1) !== AWARD_MODEL) {
  const added = municipalities
    .flatMap((m) => m.qualified.map((q) => `${m.slug}/${q.slug}`))
    .filter((key) => {
      const [slug, entry] = [key.slice(0, key.indexOf('/')), key.slice(key.indexOf('/') + 1)];
      const was = previous.municipalities.find((p) => p.slug === slug);
      return !was?.qualified.some((q) => q.slug === entry);
    }).length;

  revision = {
    /*
     * Den FÖRSTA frysningen, buren vidare genom varje omräkning.
     *
     * Reservvärdena går bakåt ett steg i taget: saknas `originalModel` är filen
     * skriven av en äldre version av det här skriptet, och då beskriver dess
     * `previousModel` just det första läget. Att i stället falla tillbaka på
     * filens eget nuläge hade gjort ett mellanläge till "originalet".
     */
    frozen: revision?.frozen ?? previous.asOf,
    originalModel: revision?.originalModel ?? revision?.previousModel ?? previous.awardModel ?? 1,
    originalQualified:
      revision?.originalQualified ?? revision?.previousQualified ?? previous.totals.qualified,
    /** Dagen modellen rättades och listan räknades om senast. */
    revised: new Date().toISOString().slice(0, 10),
    previousModel: previous.awardModel ?? 1,
    previousQualified: previous.totals.qualified,
    added,
    removed: lost.length,
    lossesAccepted,
  };
}

const edition = {
  year,
  /** Dagen utgåvan frystes: den färskaste hämtningen som ingår. */
  asOf: editionAsOf,
  /** Modellen som räknade fram listan. Se AWARD_MODEL. */
  awardModel: AWARD_MODEL,
  /* Måltalet och golvet som ribborna härleddes ur. Skrivs in i filen så att en
     gammal utgåva går att läsa korrekt även om vi ändrar dem senare: den som
     slår upp 2026 ska få veta vad som gällde 2026. Ribban i sig står per kommun,
     eftersom den ÄR per kommun. */
  awardTarget: AWARD_TARGET,
  awardFloor: AWARD_FLOOR,
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
      (lost.length === 0
        ? 'Ingen förlorade sin plats.'
        : `${lost.length} förlorade sin plats, godkänt med flagga.`),
  );
}
for (const m of municipalities) {
  const was = previous?.municipalities.find((p) => p.slug === m.slug);
  const before = was ? `${was.qualified.length} → ` : '';
  const reach = m.awardRun > m.maxHistory ? '  (utom räckhåll, taket är ' + m.maxHistory + ')' : '';
  console.log(
    `  ${m.slug.padEnd(13)} ribba ${String(m.awardRun).padStart(2)}  ` +
      `${before}${m.qualified.length} av ${m.assessed} bedömda` +
      `${m.assessed ? ` (${((m.qualified.length / m.assessed) * 100).toFixed(1)} %)` : ''}${reach}`,
  );
}
console.log(`Skrev ${target}`);
