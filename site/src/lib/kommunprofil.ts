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
import { establishments, isRemark, latestInspectionDate, type Establishment } from './data';

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
