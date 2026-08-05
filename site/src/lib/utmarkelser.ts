/**
 * Hederslistan: årsutgåvorna av Prikkos utmärkelse.
 *
 * ## Två ribbor med två namn, och de får aldrig blandas ihop
 *
 * REN HISTORIK är nuläget: `distinction` i pipeline/prikko/grading.py, alltså
 * minst historyDepth kontroller inom treårsfönstret, samtliga utan anmärkning.
 * Det är chipet på verksamhetssidan och det räknas om vid varje bygge. Den här
 * filen rör det inte.
 *
 * UTMÄRKELSEN är den här filens ämne: kontroller I RAD utan anmärkning, hur
 * långt tillbaka de än ligger, hos en verksamhet som har en aktuell bedömning.
 * Den fryses en gång om året och ger ett märke med årtal.
 *
 * De hette båda "utmärkelsen" fram till augusti 2026, med olika krav, och en
 * besökare som läste metodiksidan och utgåvesidan fick två svar på samma fråga.
 * Skriv aldrig ut något av talen för hand i sidtext: använd barFor och barRange.
 *
 * ## Varför tidsfönstret är borta ur utmärkelsen
 *
 * Till och med den första frysningen av 2026 krävdes fem kontroller INOM 1 095
 * dagar. Den regeln mätte kommunens kontrollfrekvens och inte verksamhetens
 * renlighet: AG i Stockholm, med tretton kontroller utan en enda anmärkning
 * sedan 2018, hann bara med tre i fönstret och stod utanför listan, medan en
 * verksamhet med fem kontroller på arton månader stod med.
 *
 * ## Varför ribban är olika i olika kommuner
 *
 * Utgåvan är per kommun. Det är inte en eftergift utan en beskrivning av
 * verkligheten: kommunerna kontrollerar olika ofta och publicerar olika djupt,
 * och en gemensam ribba låter den skillnaden avgöra vem som får ett märke.
 * Mätt på beståndet gav en gemensam ribba på fem 14,6 procent av Stockholms
 * bedömda verksamheter och samtidigt noll i sex kommuner, vars register är
 * grundare än fem. Ribban mätte alltså registret, inte köket.
 *
 * I stället härleds ribban ur varje kommuns egen fördelning: den lägsta
 * serielängd som gör utmärkelsen minst lika sällsynt som `awardTarget` bland
 * kommunens bedömda verksamheter, aldrig under `awardFloor`. I 2026 års utgåva
 * blev det åtta i Stockholm, elva i Linköping, sju i Örebro och fyra i Uppsala
 * och Borgholm.
 *
 * Märket betyder därmed samma sak överallt: bland de tre procent i kommunen som
 * har längst obruten ren kontrollhistorik. Det är INTE samma serielängd, och
 * ribban står utskriven på varje kommuns sida, så att ingen behöver gissa varför
 * Stockholm kräver åtta och Uppsala fyra.
 *
 * ## Varför det ändå inte är en rangordning av kommuner
 *
 * En hög ribba säger att kommunen publicerar djup historik och kontrollerar
 * ofta. Den säger ingenting om hur rena köken är, och den som läser den som ett
 * betyg på kommunen läser fel. Sidorna skriver ut det, eftersom det är den
 * uppenbara felläsningen.
 *
 * Serielängden går av samma skäl inte att jämföra mellan kommuner. Uppsala
 * lämnar aldrig ut fler än fem kontroller per verksamhet, så ingen verksamhet
 * där kan visa en längre serie än fem, hur skötsam den än är. I Stockholm
 * publiceras upp till 113. En rikslista sorterad på serielängd hade lagt varje
 * verksamhet i Uppsala under nästan varje verksamhet i Stockholm, och läsaren
 * hade dragit slutsatsen att Stockholm sköter sig bättre. `maxHistory` per
 * kommun är precis det taket, räknat ur datan, och sidorna skriver ut det.
 *
 * Kvar blir en ordning INOM kommunen, där metodiken säger att jämförelsen är
 * rättvis (/metodik/#jamfor). Den ordningen är serielängden, och inget annat.
 *
 * ## Varför raderna inte numreras
 *
 * Ungefär hälften av 2026 års utgåva ligger på exakt sin kommuns ribba. En
 * numrerad lista hade gett plats 4 och plats 90 till två verksamheter med exakt
 * samma underlag, och skillnaden hade varit bokstavsordningen. Därför grupperas
 * raderna på serielängd och sorteras alfabetiskt inom gruppen. Gruppen är
 * rangordningen; inom den finns ingen skillnad att redovisa.
 */
import { formatNumber, municipalities } from './data';
import { hasMark } from './marke';

export interface EditionEntry {
  slug: string;
  name: string;
  address: string | null;
  type: string | null;
  /** Kontroller i följd utan anmärkning. Alltid minst awardRun. */
  run: number;
  /** Äldsta kontrollen i serien. */
  from: string;
  /** Senaste kontrollen i serien. */
  to: string;
}

export interface EditionMunicipality {
  slug: string;
  city: string;
  name: string;
  asOf: string;
  establishments: number;
  assessed: number;
  /**
   * Kommunens egen ribba: kontroller i rad som krävdes just här.
   *
   * Saknas i utgåvor frysta före modell 3, som hade ett gemensamt tal på
   * utgåvenivå. Läs alltid genom barFor().
   */
  awardRun?: number;
  /** Djupaste historik kommunen lämnar ut. Taket för hur lång en serie kan bli. */
  maxHistory: number;
  /** Samma tak räknat inom treårsfönstret. Chipets tak, inte utmärkelsens. */
  deepestWindow: number;
  /** Verksamheter som alls kontrollerats awardRun gånger, med aktuell bedömning. */
  pool: number;
  qualified: EditionEntry[];
}

/** Vad som ändrades den enda gång en fryst utgåva räknats om. */
export interface EditionRevision {
  /** Dagen utgåvan först frystes. */
  frozen: string;
  /** Dagen modellen rättades och listan räknades om. */
  revised: string;
  /** Modellen och antalet vid den FÖRSTA frysningen. */
  originalModel?: number;
  originalQualified?: number;
  /** Modellen och antalet omedelbart före den senaste omräkningen. */
  previousModel: number;
  previousQualified: number;
  /** Tillkomna respektive borttagna vid den senaste omräkningen. */
  added: number;
  removed: number;
  /**
   * Sätts bara när en omräkning tagit bort någon, vilket kräver ett uttryckligt
   * beslut på kommandoraden. Skälet publiceras. Se acceptLosses i
   * scripts/utmarkelser.mjs: en utgåva öppnas en gång, sedan är svaret en ny
   * årsutgåva.
   */
  lossesAccepted?: { count: number; reason: string; date: string } | null;
}

export interface Edition {
  year: number;
  asOf: string;
  /**
   * Modellen som räknade fram listan.
   *
   *   1  awardRun kontroller inom ett fönster på windowDays.
   *   2  awardRun kontroller i rad, utan fönster, hos en verksamhet med
   *      aktuell bedömning.
   *   3  Samma som 2, men med en ribba härledd PER KOMMUN ur kommunens egen
   *      fördelning. Se awardTarget och municipalities[].awardRun.
   *
   * Läses ur filen och skrivs ut på sidan. Metodiksidan sade en gång version 2
   * när modellen var 3; ett tal som bor i filen kan inte glida ifrån filen.
   * Utgåvor frysta före fältet fanns byggdes på modell 1.
   */
  awardModel?: number;
  /**
   * Måltalet ribborna härleddes ur: högst så stor andel av kommunens bedömda
   * verksamheter får utmärkelsen. 0,03 i 2026 års utgåva.
   */
  awardTarget?: number;
  /** Ribban går aldrig under det här, hur grund kommunens historik än är. */
  awardFloor?: number;
  /** Hur färsk den senaste kontrollen måste vara för att serien ska räknas. */
  freshnessDays?: number;
  /** Chipets fönster respektive ribba vid frysningen. Styr inte listan. */
  windowDays: number;
  historyDepth: number;
  revision?: EditionRevision | null;
  /**
   * Kontroller i följd som krävdes för att stå i JUST den här utgåvan.
   *
   * Läses ur filen och inte ur en konstant här, eftersom en gammal utgåva ska
   * gå att läsa korrekt även efter att ribban ändrats. Den som slår upp 2026
   * ska få veta vad som krävdes 2026.
   *
   * Utgåvor frysta före ribban infördes saknar fältet. De byggdes på
   * historyDepth, så det är rätt reservvärde.
   */
  awardRun?: number;
  totals: {
    municipalities: number;
    establishments: number;
    assessed: number;
    qualified: number;
  };
  municipalities: EditionMunicipality[];
}

/**
 * Utgåvorna upptäcks ur filsystemet, precis som kommunerna i db.ts. En ny
 * årsutgåva är en fil, inte en kodändring: kör `node scripts/utmarkelser.mjs`.
 */
const files = import.meta.glob<{ default: Edition }>('../editions/*.json', {
  eager: true,
});

const EDITIONS: Edition[] = Object.values(files)
  .map((m) => m.default as unknown as Edition)
  .filter((e) => e && typeof e.year === 'number' && Array.isArray(e.municipalities))
  .sort((a, b) => b.year - a.year);

/*
 * Byggrind: en utgåva utan sitt märke får inte publiceras.
 *
 * Årtalet i märket är kurvor och kan inte bytas med en variabel, så varje
 * utgåva kräver en egen ritning (se scripts/importera-marke.mjs för varför det
 * är rätt trots priset). Utan den här kontrollen hade en 2027-lista tyst kunnat
 * gå ut med 2026 års märke bredvid sig, och märket är det enda vi låter lämna
 * sajten. Hellre ett bygge som stannar än ett märke som säger fel år.
 */
for (const e of EDITIONS) {
  if (!hasMark(e.year)) {
    throw new Error(
      `${e.year} års utgåva finns i src/editions men saknar märke i src/marks. ` +
        `Kör node scripts/importera-marke.mjs <ritning> ${e.year} innan utgåvan publiceras.`,
    );
  }
}

/** Utgåvorna, nyast först. */
export function editions(): Edition[] {
  return EDITIONS;
}

export function edition(year: number | string): Edition {
  const found = EDITIONS.find((e) => e.year === Number(year));
  if (!found) throw new Error(`Ingen utgåva för ${year}`);
  return found;
}

export function latestEdition(): Edition | null {
  return EDITIONS[0] ?? null;
}

// ---------------------------------------------------------------------------
// Kommunernas tre lägen
// ---------------------------------------------------------------------------

/**
 * Varför en kommun saknas ur listan.
 *
 * Skillnaden mellan de två sista är hela poängen med att redovisa dem. I
 * Karlstad kan ingen verksamhet nå utmärkelsen, hur välskött den än är, för
 * kommunen publicerar bara den senaste kontrollen. I Kristinehamn kan den nås,
 * men en enda verksamhet i hela kommunen har alls hunnit kontrolleras awardRun
 * gånger. Skrevs de ihop till "inga verksamheter i Karlstad och Kristinehamn"
 * skulle läsaren tro att det inte finns skötsamma restauranger där. Det står
 * ingenting om saken i datan.
 *
 * Exemplet var tidigare Höganäs, som med treribban var 'none_yet'. Med
 * femribban är Höganäs i stället 'impossible': källan lämnar bara tre
 * kontroller per verksamhet.
 */
export type EditionStatus = 'listed' | 'none_yet' | 'impossible';

export interface EditionStanding extends EditionMunicipality {
  status: EditionStatus;
  /** Varför kommunen inte kan vara med, i klarspråk. Bara vid 'impossible'. */
  blocked: string | null;
  /** Får kommunen en egen sida i utgåvan? */
  ownPage: boolean;
  /**
   * Längsta serie någon i kommunen FAKTISKT har.
   *
   * Får aldrig förväxlas med `maxHistory`, som är taket. I Stockholm publiceras
   * upp till 113 kontroller per verksamhet, men den längsta obrutna rena serien
   * är femton. Taket säger vad som är möjligt, det här talet vad som hänt, och
   * en text som blandar ihop dem påstår något om kök som i själva verket handlar
   * om ett register.
   */
  topRun: number;
}

/**
 * Minsta antal utmärkta för att kommunen ska få en egen sida i utgåvan.
 *
 * Samma tal och samma skäl som MIN_CATEGORY_PAGE i data.ts: en sida med en rad
 * bär ingen information som inte redan står på utgåvans egen sida, och tunna
 * sidor i tiotal drar ner hela domänen. Kommunerna under gränsen listas i sin
 * helhet direkt på utgåvan i stället.
 */
export const MIN_OWN_PAGE = 25;

/**
 * Ribban i EN kommun: hur många kontroller i rad som krävdes där det året.
 *
 * ANVÄND DEN HÄR I SIDTEXTEN. Skriv aldrig ut talet för hand. Sidorna bar en
 * gång siffran "tre" i löptext medan utgåvan krävde fem, och sade då emot sina
 * egna datadrivna stycken. Nu är talet dessutom olika i olika kommuner, så ett
 * tal i löptext hade varit fel på de flesta sidor samtidigt.
 *
 * Reservvärdena gäller utgåvor frysta före modell 3, som hade ett gemensamt tal
 * på utgåvenivå.
 */
export function barFor(year: number | string, slug: string): number {
  const ed = edition(year);
  const m = ed.municipalities.find((x) => x.slug === slug);
  return m?.awardRun ?? ed.awardRun ?? ed.historyDepth;
}

/**
 * Spannet av ribbor i utgåvan, räknat på kommuner där utmärkelsen alls kan nås.
 *
 * Sidor som talar om utmärkelsen i allmänhet behöver ett sätt att säga "mellan
 * fyra och elva kontroller" utan att räkna upp kommunerna, vilket hade blivit
 * en rangordning i tabellform.
 */
export function barRange(year: number | string): { min: number; max: number } {
  const bars = standings(year)
    .filter((m) => m.status !== 'impossible')
    .map((m) => m.awardRun ?? 0);
  return { min: Math.min(...bars), max: Math.max(...bars) };
}

/** Andelen av kommunens bedömda som ribban siktar på. Se awardTarget. */
export function awardTarget(year: number | string): number {
  return edition(year).awardTarget ?? 0;
}

/** Utgåvans modell. Se awardModel i Edition för vad talen betyder. */
export function awardModel(year: number | string): number {
  return edition(year).awardModel ?? 1;
}

/** Vad som ändrades de gånger utgåvan räknats om, eller null. */
export function awardRevision(year: number | string): EditionRevision | null {
  return edition(year).revision ?? null;
}

export function standings(year: number | string): EditionStanding[] {
  const ed = edition(year);
  return ed.municipalities.map((m) => {
    const bar = m.awardRun ?? ed.awardRun ?? ed.historyDepth;
    /*
     * Omöjligt härleds ur KOMMUNENS ribba, inte ur sourceLimits.
     *
     * sourceLimits svarar på om kommunen publicerar nog för chipet "ren
     * historik", alltså tre kontroller. Utmärkelsen kräver mer. Frågade vi
     * sourceLimits skulle Jönköping räknas som "möjligt men ingen ännu",
     * fast deras källa aldrig lämnar ut mer än tre kontroller per verksamhet
     * och ribban där är fyra.
     *
     * Taket är `maxHistory`, alltså djupaste historik kommunen alls lämnar ut.
     * Här stod tidigare `deepestWindow`, som var rätt så länge serien måste
     * rymmas inom treårsfönstret. Utan fönster är det hela historiken som sätter
     * taket, och de två skiljer sig: i Stockholm 113 mot 28. Är taket lägre än
     * ribban kan ingen nå den, och det är ett faktum om utlämnandet och inte ett
     * omdöme om verksamheterna.
     *
     * Att en härledd ribba kan hamna över taket är inte ett fel i härledningen.
     * I Jönköping har 121 av 1 118 bedömda alla sina tre publicerade kontroller
     * rena, alltså 10,8 procent. Ingen ribba som registret rymmer kan skilja ut
     * tre procent, och då är svaret att utmärkelsen inte går att dela ut där,
     * inte att dela ut den till var tionde.
     */
    const impossible = m.maxHistory < bar;
    return {
      ...m,
      awardRun: bar,
      status: m.qualified.length > 0 ? 'listed' : impossible ? 'impossible' : 'none_yet',
      blocked: impossible ? blockedText(m, bar) : null,
      ownPage: m.qualified.length >= MIN_OWN_PAGE,
      // Listan är redan sorterad på serielängd, längst först.
      topRun: m.qualified[0]?.run ?? 0,
    };
  });
}

export function standing(year: number | string, slug: string): EditionStanding {
  const found = standings(year).find((m) => m.slug === slug);
  if (!found) throw new Error(`${slug} saknas i ${year} års utgåva`);
  return found;
}

/**
 * Varför utmärkelsen är utom räckhåll i kommunen, byggd av kommunens egna tal.
 *
 * Meningen är en mall som fylls med `maxHistory` och antalet verksamheter, på
 * samma sätt som notisen i sourceLimits(). Ingen del av den är skriven om för
 * en enskild kommun.
 */
function blockedText(m: EditionMunicipality, bar: number): string {
  const depth =
    m.maxHistory <= 1
      ? 'bara den senaste kontrollen'
      : `högst ${numeral(m.maxHistory)} kontroller per verksamhet`;
  return (
    `${m.name} publicerar ${depth}. Ribban här skulle behöva vara ${numeral(bar)} ` +
    'kontroller i rad för att skilja ut de skötsammaste, och så många finns inte i ' +
    `registret. Ingen av kommunens ${formatNumber(m.establishments)} verksamheter kan ` +
    'därför nå utmärkelsen. Frånvaron säger något om vad kommunen lämnar ut, inte om ' +
    'hur verksamheterna sköter sig.'
  );
}

// ---------------------------------------------------------------------------
// Grupperingen som bär ordningen
// ---------------------------------------------------------------------------

export interface RunGroup {
  run: number;
  /** "Fyra kontroller i rad utan anmärkning". */
  heading: string;
  entries: EditionEntry[];
}

/** Verksamheterna grupperade på serielängd, längst först. */
export function runGroups(entries: EditionEntry[]): RunGroup[] {
  const buckets = new Map<number, EditionEntry[]>();
  for (const e of entries) {
    const bucket = buckets.get(e.run) ?? [];
    bucket.push(e);
    buckets.set(e.run, bucket);
  }
  return [...buckets.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([run, list]) => ({
      run,
      heading: `${capitalise(numeral(run))} kontroller i rad utan anmärkning`,
      entries: list,
    }));
}

/**
 * Hur många rader utgåvans egen sida visar per kommun innan den länkar vidare.
 *
 * Utgåvan ska gå att överblicka. Tolv rader räcker för att toppen ska synas
 * utan att Stockholms 1 086 tar över sidan.
 */
const TOP_ROWS = 12;

/**
 * Grupper som är för stora för att visas som en topp.
 *
 * En grupp är per definition oordnad inom sig. Att klippa den vid tolv och
 * kalla resultatet toppen vore att presentera bokstavsordningen som en
 * rangordning. Jönköping är fallet: taket där är tre kontroller, så samtliga
 * 121 utmärkta ligger i EN grupp. Den gruppen visas inte i utdrag alls, utan
 * sammanfattas med sitt antal och en länk till hela listan.
 */
const MAX_GROUP_IN_EXCERPT = 30;

/** Toppen av en kommuns lista: hela grupper, aldrig ett klipp inuti en. */
export function topGroups(groups: RunGroup[]): RunGroup[] {
  const picked: RunGroup[] = [];
  let shown = 0;
  for (const group of groups) {
    if (shown >= TOP_ROWS) break;
    if (group.entries.length > MAX_GROUP_IN_EXCERPT) break;
    picked.push(group);
    shown += group.entries.length;
  }
  return picked;
}

// ---------------------------------------------------------------------------
// Uppslag från en verksamhetssida
// ---------------------------------------------------------------------------

const indexes = new Map<number, Map<string, EditionEntry>>();

function indexFor(e: Edition): Map<string, EditionEntry> {
  const cached = indexes.get(e.year);
  if (cached) return cached;
  const built = new Map<string, EditionEntry>();
  for (const m of e.municipalities) {
    for (const q of m.qualified) built.set(`${m.slug}/${q.slug}`, q);
  }
  indexes.set(e.year, built);
  return built;
}

export interface Awarded {
  year: number;
  asOf: string;
  entry: EditionEntry;
}

/**
 * Utgåvorna en verksamhet står i, nyast först.
 *
 * Uppslaget går på kommun plus slug, alltså på sidans egen adress. Byter en
 * verksamhet namn i kommunens register byter den också slug, och då hittas den
 * inte här. Det är rätt beteende: utgåvan gäller den post som fanns när den
 * frystes, och en ny post är en ny verksamhet så långt vi kan se.
 */
export function awardsFor(municipalitySlug: string, establishmentSlug: string): Awarded[] {
  const key = `${municipalitySlug}/${establishmentSlug}`;
  const found: Awarded[] = [];
  for (const e of EDITIONS) {
    const entry = indexFor(e).get(key);
    if (entry) found.push({ year: e.year, asOf: e.asOf, entry });
  }
  return found;
}

// ---------------------------------------------------------------------------
// Tal som ord
// ---------------------------------------------------------------------------

const NUMERALS = [
  'noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio',
  'elva', 'tolv',
];

/** Små tal skrivs ut. Över tolv står siffran, som i svensk skrivregel. */
export function numeral(n: number): string {
  return NUMERALS[n] ?? formatNumber(n);
}

/** Versal begynnelsebokstav. Räkneorden skrivs ut och inleder ibland en mening. */
export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Tal som sidorna behöver
// ---------------------------------------------------------------------------

export interface EditionFacts {
  listed: EditionStanding[];
  noneYet: EditionStanding[];
  impossible: EditionStanding[];
  /** Kortaste respektive längsta serie som ÖVERHUVUDTAGET kan visas, per kommun. */
  lowestCeiling: EditionStanding | null;
  highestCeiling: EditionStanding | null;
  /** Verksamheter som alls kontrollerats awardRun gånger, med aktuell bedömning. */
  pool: number;
  /** Kommuner i beståndet som saknas helt ur utgåvan. */
  missingFromEdition: string[];
}

export function editionFacts(year: number | string): EditionFacts {
  const all = standings(year);
  const listed = all.filter((m) => m.status === 'listed');
  const known = new Set(all.map((m) => m.slug));

  // Taket är hela den publicerade historiken, inte fönstrets del av den. Se
  // `impossible` i standings().
  const ceilings = [...listed].sort((a, b) => a.maxHistory - b.maxHistory);

  return {
    listed,
    noneYet: all.filter((m) => m.status === 'none_yet'),
    impossible: all.filter((m) => m.status === 'impossible'),
    lowestCeiling: ceilings[0] ?? null,
    highestCeiling: ceilings[ceilings.length - 1] ?? null,
    pool: all.reduce((n, m) => n + m.pool, 0),
    // En kommun som tillkommit efter frysningen finns i beståndet men inte i
    // utgåvan. Utgåvan får inte räknas om för att ta in den; däremot ska det
    // stå på sidan att hon inte var med.
    missingFromEdition: municipalities()
      .filter((m) => !known.has(m.slug))
      .map((m) => m.city),
  };
}
