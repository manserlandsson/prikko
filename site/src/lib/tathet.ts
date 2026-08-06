/**
 * Hur många ställen att äta på en kommun har, per invånare.
 *
 * Det första jämförelsetalet på sajten som INTE handlar om hygien, och därför
 * det första som får rangordnas. Regeln som förbjuder topplistor gäller
 * kontrollresultat: att Borgholm har åtta gånger Stockholms täthet av
 * serveringsställen säger ingenting om hur rent det är någonstans.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR TÄLJAREN ÄR RESTAURANGER OCH CAFÉER TILLSAMMANS
 * ---------------------------------------------------------------------------
 * Därför att bara restauranger inte går att jämföra mellan kommuner.
 *
 * Stockholm skiljer `1. Café` från `1. Restaurang` och får 3 556 respektive
 * 1 117. Uppsalas källa har en enda grovetikett, `Restaurang och servering`,
 * och lägger stadens alla caféer i den. Uppsalas cafésiffra är alltså noll,
 * inte för att staden saknar caféer utan för att källan inte skiljer dem åt.
 * Ett tal räknat på enbart kategorin Restauranger hade gjort Uppsala
 * konstlat glest och Stockholm konstlat tätt.
 *
 * Summan är däremot densamma oavsett var källan drar gränsen, och det är den
 * som räknas här. Se absorbs-fältet i categories.ts.
 *
 * Unionen, inte summan av två tal: 1,4 procent av beståndet bär både café och
 * restaurang, och de ska räknas en gång.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR HÖGANÄS INTE FÅR NÅGOT TAL
 * ---------------------------------------------------------------------------
 * Kommunens källa lägger butik, restaurang och servering i samma hink, så 212
 * av 310 verksamheter hamnar utanför varje kategori. Täljaren blir noll, och
 * en nolla här läser som att kommunen saknar restauranger. Grinden är samma
 * som filtret använder: går kategorierna inte att lita på i kommunen visas
 * ingenting alls. Se MIN_CATEGORY_COVERAGE i data.ts.
 *
 * SCB:s tal följer med i fallet, trots att det inte är beroende av våra
 * kategorier. Ett avsnitt som heter Restaurangtätheten och bara innehåller
 * sysselsättningen är inte ett avsnitt, det är en rest. Samma resonemang som
 * MIN_FIGURES i kontrollen.ts.
 *
 * ---------------------------------------------------------------------------
 * NÄMNAREN
 * ---------------------------------------------------------------------------
 * Folkbokförda invånare. En turistkommun får därför ett högt tal, och det är
 * sant snarare än missvisande: ställena finns, det är gästerna som är
 * tillresta. SCB:s sysselsättningstal bredvid visar samma sak från andra
 * hållet, se branschen() i kontrollen.ts.
 */
import { categoryListing, municipalityCategories } from './data';
import { branschen, population } from './kontrollen';

export interface Tathet {
  /** Restauranger och caféer i registret, unika verksamheter. */
  places: number;
  /** places per 10 000 invånare, avrundat. */
  perTenThousand: number;
  /** Sysselsatta inom hotell och restaurang per 10 000 invånare, SCB. */
  jobsPer10k: number | null;
  /** Riksmedian för jobsPer10k, räknad över alla 290 kommuner. */
  jobsMedian: number | null;
  /** Året SCB:s mätning gäller. */
  jobsYear: number | null;
  /** Källhänvisningen SCB rekommenderar. */
  attribution: string | null;
}

const built = new Map<string, Tathet | null>();

/**
 * Kommunens täthetstal, eller null när underlaget inte räcker.
 *
 * Anropas en gång per sida i en sidindelad serie, och svepet går över hela
 * kommunens bestånd. Därför minneslagrat per kommun, precis som
 * kommunprofil.ts.
 */
export function tathet(slug: string, code: string): Tathet | null {
  const cached = built.get(slug);
  if (cached !== undefined) return cached;

  const result = build(slug, code);
  built.set(slug, result);
  return result;
}

function build(slug: string, code: string): Tathet | null {
  const residents = population(code);
  if (!residents) return null;
  if (!municipalityCategories(slug).usable) return null;

  const places = new Set<string>();
  for (const e of categoryListing(slug, 'restaurang')) places.add(e.slug);
  for (const e of categoryListing(slug, 'cafe')) places.add(e.slug);
  if (places.size === 0) return null;

  const jobs = branschen(code);

  return {
    places: places.size,
    perTenThousand: Math.round((10000 * places.size) / residents),
    jobsPer10k: jobs?.jobsPer10k ?? null,
    jobsMedian: jobs?.median ?? null,
    jobsYear: jobs?.year ?? null,
    attribution: jobs?.attribution ?? null,
  };
}
