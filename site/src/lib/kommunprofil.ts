/**
 * Kommunens profil — det hubben kan säga som ingen enskild restaurangsida kan.
 *
 * Hubben var tidigare en rubrik, tre tal och en bokstavsordnad lista på upp
 * till hundra rader. Allt på sidan utom namnen var identiskt mellan kommuner,
 * och den bar ändå den mesta trafiken: mätningen mot brittiska FSA ger
 * kommunsidor 37,9 % mot enskilda verksamheter 5,8 %.
 *
 * Modulen räknar fram två saker ur data som redan finns men aldrig visats:
 * vad som brister oftast i just den här kommunen, och vilka kontroller som
 * gjordes senast. Ingenting här är uppskattat eller modellerat — det är
 * summeringar av kommunens egna kontrollrapporter.
 *
 * Allt är minneslagrat per kommun. Funktionerna anropas en gång per sida i en
 * sidindelad serie (Stockholm är 86 sidor), och svepet går över hela
 * kommunens bestånd.
 */
import {
  establishments,
  followUp,
  isRemark,
  latestInspectionDate,
  type Establishment,
} from './data';

export interface CommonIssue {
  /** Kommunens egen formulering av vad bristen gäller. */
  description: string;
  /** Antal verksamheter som fick den vid sin senaste kontroll. */
  count: number;
  /** Andel av de verksamheter som alls hade en anmärkning, i procent. */
  share: number;
}

export interface KommunProfil {
  /** Vanligaste bristerna, flest först. Tom när källan inte redovisar dem. */
  issues: CommonIssue[];
  /** Verksamheter med minst en avvikelse vid sin senaste kontroll. */
  withRemarks: number;
  /** Sant när ingen kontroll i kommunen har någon redovisad kontrollpunkt. */
  noAreas: boolean;
}

const profiles = new Map<string, KommunProfil>();

/**
 * Vanligaste bristerna vid den SENASTE kontrollen per verksamhet.
 *
 * Senaste kontrollen och inte hela historiken, av två skäl. Den ska svara på
 * "hur ser det ut i kommunen nu", inte "vad har någonsin hänt här". Och
 * historiken är olika djup i olika kommuner — Karlstad publicerar en enda
 * kontroll per verksamhet, Stockholm arton — så en summering över hela
 * historiken hade gjort kommunerna ojämförbara utan att säga det.
 *
 * Nyckeln är beskrivningen, inte koden. Stockholm lämnar ingen kod, och Lomma
 * skriver fritext i gemener ("rengöring", "temperatur") där Linköping skriver
 * Livsmedelsverkets rapporteringspunkt i klartext. Beskrivningen finns i alla
 * nio källorna; koden gör det inte.
 *
 * Samma brist räknas EN gång per verksamhet även om den står på flera rader i
 * samma rapport. Annars mäter talet hur utförligt inspektören skrev, inte hur
 * vanlig bristen är.
 */
function build(slug: string): KommunProfil {
  const counts = new Map<string, number>();
  let withRemarks = 0;
  let areaRows = 0;

  for (const e of establishments(slug)) {
    const latest = e.inspections[0];
    if (!latest) continue;
    areaRows += latest.areas.length;

    const seen = new Set<string>();
    for (const area of latest.areas) {
      if (!isRemark(area)) continue;
      const key = area.description.trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    if (seen.size > 0) withRemarks += 1;
  }

  const issues = [...counts.entries()]
    // Beskrivningen som andra nyckel gör ordningen total: två brister som är
    // lika vanliga ska inte byta plats mellan två bygg av samma data.
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'sv'))
    .map(([description, count]) => ({
      description,
      count,
      // Nämnaren är verksamheter MED anmärkning, inte hela kommunen. Med
      // beståndet som nämnare blir varje tal några få procent och säger
      // ingenting; frågan är vad en anmärkning brukar gälla, inte hur ovanlig
      // den är.
      share: withRemarks ? Math.round((count / withRemarks) * 100) : 0,
    }));

  return { issues, withRemarks, noAreas: areaRows === 0 };
}

export function kommunProfil(slug: string): KommunProfil {
  const cached = profiles.get(slug);
  if (cached) return cached;
  const built = build(slug);
  profiles.set(slug, built);
  return built;
}

// ---------------------------------------------------------------------------
// Vad kontrollen inte når
// ---------------------------------------------------------------------------

export interface Unseen {
  /** Verksamheter i registret utan en enda publicerad kontroll. */
  never: number;
  /** Verksamheter vars senaste kontroll är äldre än pipelinens färskhetsgräns. */
  stale: number;
  /** never + stale. Grå i fördelningsstapeln. */
  total: number;
  /** Kommunens hela register. Nämnaren. */
  register: number;
}

const unseens = new Map<string, Unseen>();

/**
 * Hur stor del av kommunens register kontrollen inte når just nu.
 *
 * Fördelningsstapeln har hela tiden haft ett grått segment, "Ingen bedömning",
 * som i Stockholm är 1 234 verksamheter. Vad grått BETYDER har aldrig stått
 * någonstans, och det är två helt olika saker: 556 har aldrig kontrollerats
 * över huvud taget, medan 678 har kontrollerats men för länge sedan. Skillnaden
 * finns i datan sedan första dagen, i `reason`, och används redan på
 * verksamhetssidan för att välja svarsmening. På hubben har den aldrig visats.
 *
 * Det här är ett påstående om KOMMUNEN, inte om någon namngiven verksamhet, och
 * det är därför det är tryggt. Vi skriver inte att ett visst ställe är
 * ohygieniskt för att det saknar kontroll — vi skriver hur många ställen
 * kommunens kontroll inte har nått.
 *
 * Förbehållet i gränssnittet är obligatoriskt: ett registerpost utan kontroll
 * kan lika gärna vara en verksamhet som lagt ner utan att avregistreras. Vi kan
 * inte skilja de två fallen åt, och därför får meningen aldrig läsas som att
 * kommunen struntat i ett ställe som är öppet.
 */
export function unseen(slug: string): Unseen {
  const cached = unseens.get(slug);
  if (cached) return cached;

  let never = 0;
  let stale = 0;
  const all = establishments(slug);
  for (const e of all) {
    if (e.verdict !== null) continue;
    if (e.inspections.length === 0) never += 1;
    else stale += 1;
  }

  const built: Unseen = { never, stale, total: never + stale, register: all.length };
  unseens.set(slug, built);
  return built;
}

// ---------------------------------------------------------------------------
// Ledde uppföljningen till åtgärd?
// ---------------------------------------------------------------------------

export interface FollowUpRecord {
  /** Verksamheter med ett utfall att räkna. */
  total: number;
  /** Utfall där inget kvarstod vid uppföljningen. */
  resolved: number;
  /** Utfall där något kvarstod. */
  remaining: number;
  /** resolved i hela procent av total. */
  share: number;
  /** Hur många av utfallen kommunen själv märkt upp som åtgärdat/kvarstår. */
  explicit: number;
}

/**
 * Minsta antal utfall för att kommunen ska få en siffra.
 *
 * Borgholm har tolv. En andel räknad på tolv är inte en egenskap hos kommunen,
 * den är brus, och den ser exakt lika auktoritativ ut som Stockholms 3 049.
 */
const MIN_FOLLOW_UPS = 100;

const records = new Map<string, FollowUpRecord | null>();

/**
 * Hur ofta uppföljningen i kommunen slutade med att bristen var borta.
 *
 * Summan av per-verksamhetsutfall, och därför bara så stark som varje enskilt
 * utfall är. Det är hela poängen med att bygga den så här: varje rad i
 * nämnaren är en observation om två konkreta kontroller på samma adress med
 * veckor emellan, inte en summering av en verksamhets historia över år. Se
 * followUp() i data.ts för varför det är den enda formen som håller.
 *
 * Talet får ALDRIG ställas bredvid en annan kommuns. Stockholm läser utfallet
 * ur återbesökets bedömning eftersom källan inte lämnar kontrollpunkter, medan
 * Linköping och Örebro läser kommunens egen uppmärkning "Åtgärdad" respektive
 * "Kvarstår". Två olika mätningar med samma enhet är ingen jämförelse. Sajten
 * publicerar av samma skäl ingen rangordning av kommuner (se /metodik#jamfor).
 *
 * Null när kommunen saknar underlag. Då står ingenting på sidan.
 */
export function followUpRecord(slug: string): FollowUpRecord | null {
  const cached = records.get(slug);
  if (cached !== undefined) return cached;

  let total = 0;
  let resolved = 0;
  let explicit = 0;

  for (const e of establishments(slug)) {
    const f = followUp(e);
    if (!f) continue;
    total += 1;
    if (f.explicit) {
      explicit += 1;
      // Kommunens egna ord: inget antecknat som kvarstående.
      if (f.persisting === 0) resolved += 1;
    } else if (f.visit.assessment === 0) {
      // Kommunens egen bedömning av återbesöket: inga anmärkningar.
      resolved += 1;
    }
  }

  const built =
    total >= MIN_FOLLOW_UPS
      ? {
          total,
          resolved,
          remaining: total - resolved,
          share: Math.round((resolved / total) * 100),
          explicit,
        }
      : null;

  records.set(slug, built);
  return built;
}

const recents = new Map<string, Establishment[]>();

/**
 * Senast kontrollerade verksamheterna i kommunen, nyast först.
 *
 * Färskhet är en dokumenterad citeringsfaktor för AI-svar och det enda på
 * hubben som ändras av sig självt mellan datauppdateringar. Den bokstavsordnade
 * listan under den är med flit orörlig — se municipalityListing i data.ts —
 * så utan det här blocket ser sidan likadan ut i månader.
 *
 * Slug som sista nyckel: många kontroller delar datum, och utan tiebreak
 * avgörs ordningen av datafilens ordning, som pipelinen inte lovar något om.
 */
export function recentlyInspected(slug: string, limit = 5): Establishment[] {
  const key = `${slug}:${limit}`;
  const cached = recents.get(key);
  if (cached) return cached;

  const built = establishments(slug)
    .filter((e) => e.verdict !== null && latestInspectionDate(e))
    .sort(
      (a, b) =>
        latestInspectionDate(b)!.localeCompare(latestInspectionDate(a)!) ||
        a.slug.localeCompare(b.slug, 'sv'),
    )
    .slice(0, limit);

  recents.set(key, built);
  return built;
}
