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
import { chain, type Chain } from './kedjor';
import { path } from './urls';

/**
 * Kedjorna som lyfts fram, med sina id i kedjeregistret.
 *
 * Antalet står inte här längre. Det räknas ur beståndet av lib/kedjor.ts, och
 * ett handskrivet tal bredvid ett räknat är ett tal som kommer att bli fel:
 * de tre som stod här ("Espresso House 51, Max 43, McDonalds 38") var redan
 * inaktuella mot dagens 52, 31 och 40.
 *
 * Urvalet är däremot fortfarande ett val. Pressbyrån är störst av de riktiga
 * kedjorna med 118 ställen men är en kiosk, inte ett ställe man väljer att äta
 * på; ICA och Coop är större men är en veckohandling snarare än ett besök.
 * Listan tar de tre största kedjorna någon faktiskt planerar ett besök till.
 */
const CHAINS = ['espresso-house', 'mcdonalds', 'max'];

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
 * Kedjorna pekar aldrig på ett enskilt ställe: att lyfta fram ett namngivet
 * ställe i en förvald lista är ett redaktionellt val vi inte har underlag
 * för. Har det brister ser det ut som att vi pekar ut någon, har det inga ser
 * det ut som reklam.
 *
 * De pekade tidigare på `/sok/?q=Espresso%20House`, alltså på ett fritextfält
 * som fylls i webbläsaren. Det var det bästa som fanns då. Nu finns
 * `/kedja/espresso-house/`, som är samma fråga med ett riktigt svar: en sida
 * med alla 52, kommun för kommun, som går att länka, dela och indexera. En
 * förvald sökning som leder till en sida är alltid bättre än en som leder
 * till ett sökresultat.
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

  // Kedjor som fallit under kvalitetsgrinden i lib/kedjor.ts har ingen sida
  // och faller därför ut här också, i stället för att bli en död länk.
  const chains = CHAINS.map((id) => chain(id))
    .filter((c): c is Chain => c !== null)
    .map((c) => ({
      href: path('kedja', c.id),
      name: c.name,
      meta: `${c.total} ställen`,
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

  // Kedjechipet pekar på kedjesidan och inte längre på en fritextsökning, av
  // samma skäl som popularSearches: en sida med ett svar slår ett sökfält med
  // en förifylld sträng. Faller kedjan under kvalitetsgrinden faller chipet.
  const first = chain(CHAINS[0]);

  return [
    chip('restaurang', `Restauranger i ${biggest.city}`),
    chip('cafe', `Caféer i ${biggest.city}`),
    chip('skola', `Skolor och omsorg i ${biggest.city}`),
    first ? { label: first.name, href: path('kedja', first.id) } : null,
  ].filter((c) => c !== null);
}
