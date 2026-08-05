/**
 * Snabbval och populära sökningar, räknade ur beståndet.
 *
 * Tre ytor visar samma urval: sökfältets panel ("Populära sökningar"),
 * startsidans chips under herofältet och kommandopaletten som fälls ut ur
 * fältet vid cmd+K. Urvalet låg tidigare beräknat i två av filerna var för
 * sig och var på väg in i en tredje — därför bor det här nu. Tre ytor som
 * räknar själva glider isär; en funktion kan inte.
 *
 * Ingenting här är sökhistorik, och det är ett beslut: historik kräver
 * lagring i webbläsaren, och docs/14 slår fast att bara prikko.session och
 * prikko.next får finnas utan samtycke — /cookies påstår dessutom att den
 * listan är uttömmande. "Populärt" betyder därför räknat ur datat: de
 * kommuner som har flest verksamheter och de kedjor som förekommer oftast.
 * Det är den bästa gissning som går att göra utan att lagra ett tecken hos
 * besökaren.
 */
import {
  establishments,
  municipalities,
  municipalityCategories,
  municipalitySummaries,
  type TopCategoryId,
} from './data';
import { path } from './urls';

/**
 * Kedjor och antal förekomster i beståndet 2026-08-02. Räknade, inte valda
 * på känsla. Pressbyrån är vanligast med 115 men är en kiosk, inte ett
 * ställe man väljer att äta på, så listan tar de tre största kedjorna som
 * någon faktiskt planerar ett besök till.
 *
 * Stavningen måste matcha datat, inte hur kedjan skriver sig själv.
 * "McDonald's" med apostrof ger noll träffar: kommunerna registrerar dem
 * som "Mcdonalds" och "McDonalds", aldrig med apostrof.
 */
const CHAINS = [
  { query: 'Espresso House', count: 51 },
  { query: 'Max', count: 43 },
  { query: 'McDonalds', count: 38 },
];

const TOP_MUNICIPALITIES = 3;

export interface PopularItem {
  href: string;
  name: string;
  meta: string;
  kind: 'kommun' | 'kedja';
}

/**
 * De vanligaste ingångarna: största kommunerna varvade med största kedjorna,
 * så listan inte läser som två separata block.
 *
 * Kedjorna pekar på /sok och aldrig på ett enskilt ställe: att lyfta fram
 * ett namngivet ställe i en förvald lista är ett redaktionellt val vi inte
 * har underlag för. Har det brister ser det ut som att vi pekar ut någon,
 * har det inga ser det ut som reklam. En kedjesökning är i stället en
 * verklig fråga med ett verkligt svar.
 */
export function popularSearches(): PopularItem[] {
  const cities = municipalities()
    .map((m) => ({ ...m, count: establishments(m.slug).length }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, 'sv'))
    .slice(0, TOP_MUNICIPALITIES)
    .map((m) => ({
      href: path(m.slug),
      name: m.city,
      meta: 'Kommun',
      kind: 'kommun' as const,
    }));

  const chains = CHAINS.map((c) => ({
    href: `/sok/?q=${encodeURIComponent(c.query)}`,
    name: c.query,
    meta: `${c.count} ställen`,
    kind: 'kedja' as const,
  }));

  return cities.flatMap((c, i) => (chains[i] ? [c, chains[i]] : [c]));
}

export interface QuickPick {
  label: string;
  href: string;
}

/**
 * Kategorisnabbvalen: de vanligaste frågorna som knappar, för den som inte
 * vet vad den ska skriva i fältet. Varje chip är en verklig sida med ett
 * verkligt svar, aldrig en död sökning.
 *
 * Urvalet är räknat, inte tyckt: kategorisidorna i landets största kommun
 * (restauranger och caféer är de kategorier man väljer ett ställe ur,
 * skolkök är föräldrafrågan) plus den vanligaste kedjan i beståndet. Finns
 * inte kategorisidan finns inte chipet — linked-flaggan kommer ur samma
 * grind som bygger sidorna (MIN_CATEGORY_PAGE i lib/data) och dubbleras
 * inte här.
 */
export function quickPicks(): QuickPick[] {
  const biggest = [...municipalitySummaries()].sort((a, b) => b.total - a.total)[0];
  const categories = municipalityCategories(biggest.slug);

  const chip = (id: TopCategoryId, label: string): QuickPick | null => {
    const slice = categories.slices.find((s) => s.category.id === id);
    if (!slice?.linked) return null;
    return { label, href: path(biggest.slug, 'kategori', slice.category.slug) };
  };

  return [
    chip('restaurang', `Restauranger i ${biggest.city}`),
    chip('cafe', `Caféer i ${biggest.city}`),
    chip('skola', `Skolor och omsorg i ${biggest.city}`),
    { label: 'Espresso House', href: '/sok/?q=Espresso%20House' },
  ].filter((c) => c !== null);
}
