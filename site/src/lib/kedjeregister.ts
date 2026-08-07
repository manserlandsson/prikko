/**
 * Kedjeregistret och namnmatchningen. Ingenting annat.
 *
 * Filen har med flit noll importer. Den är den enda delen av kedjelogiken som
 * är ren funktion av ett namn, och den ska gå att köra utan Astro, utan Vite
 * och utan beståndet inläst. Annars går registret inte att granska med ett
 * skript, och ett register som bara går att granska genom att bygga sajten
 * kommer inte att granskas. `scripts/kedjegranskning.mjs` importerar just den
 * här filen och läser datafilerna själv.
 *
 * Sammanräkningen, kvalitetsgrinden och allt som rör verksamheter bor i
 * `kedjor.ts`, som förklarar varför kedjorna är ett register och inte en
 * härledning.
 */

export interface ChainEntry {
  /**
   * URL-segment. Skrivs för hand och ändras aldrig, eftersom det är en publicerad
   * adress, och en ändring är en trasig länk plus en förlorad indexering.
   */
  id: string;
  /** Namnet som det ska stå på sidan, med kedjans egen stavning. */
  name: string;
  /**
   * Namnets inledning, i normaliserad form.
   *
   * Matchningen sker på HELA ORD från namnets början, aldrig på delsträng.
   * Kommunerna skriver varumärket först och platsen efter ("Espresso House
   * Bromma Center", "Max Hamburgerrestaurang Marieberg"), så prefixet är den
   * form som bär. En delsträngsmatchning hade dragit in "Restaurangen vid Max
   * gata"; ordmatchning gör dessutom att `max` inte träffar "Maxim".
   *
   * Flera mönster när källorna stavar olika, och det är regel snarare än
   * undantag: O'Learys står som både "O´Learys" och "OLearys", McDonald's som
   * "Mcdonalds" och "McDonalds" men aldrig med apostrof.
   */
  patterns: string[];
}

/**
 * Kedjorna vi känner igen.
 *
 * URVALSREGELN: maten ska vara skälet till besöket. Restauranger, snabbmat,
 * caféer, bagerier, livsmedelsbutiker, servicebutiker och bemannade
 * drivmedelsstationer. Utanför står gym, apotek, klädbutiker, biografer och
 * lågprisvaruhus. De är registrerade livsmedelsverksamheter och finns på
 * sajten som vanligt, men en sida med rubriken "XXL" som handlar om
 * hygienkontroll säger mer om vår datamodell än om vad besökaren undrade.
 *
 * Att lägga till en kedja är en rad. Sidan byggs bara om raden klarar
 * gränserna i `kedjor.ts`, så en felaktig rad ger ingen sida snarare än en
 * tunn sida.
 */
export const REGISTER: ChainEntry[] = [
  // Kaféer och bagerier
  { id: 'espresso-house', name: 'Espresso House', patterns: ['espresso house'] },
  { id: 'waynes-coffee', name: "Wayne's Coffee", patterns: ['waynes coffee', 'wayne s coffee'] },
  { id: 'joe-and-the-juice', name: 'Joe & The Juice', patterns: ['joe the juice'] },
  { id: 'caffe-nero', name: 'Caffè Nero', patterns: ['caffe nero'] },
  { id: 'gateau', name: 'Gateau', patterns: ['gateau'] },
  { id: 'fabrique', name: 'Fabrique', patterns: ['fabrique'] },
  { id: 'brod-och-salt', name: 'Bröd & Salt', patterns: ['brod salt'] },
  { id: 'thelins', name: 'Thelins', patterns: ['thelins'] },
  { id: 'naked-juicebar', name: 'Naked Juicebar', patterns: ['naked juicebar'] },

  // Snabbmat
  { id: 'mcdonalds', name: "McDonald's", patterns: ['mcdonalds', 'mc donalds', 'mcdonald s'] },
  { id: 'max', name: 'MAX', patterns: ['max'] },
  { id: 'burger-king', name: 'Burger King', patterns: ['burger king'] },
  { id: 'kfc', name: 'KFC', patterns: ['kfc'] },
  { id: 'subway', name: 'Subway', patterns: ['subway'] },
  { id: 'sibylla', name: 'Sibylla', patterns: ['sibylla'] },
  { id: 'bastard-burgers', name: 'Bastard Burgers', patterns: ['bastard burgers'] },
  { id: 'chopchop', name: 'ChopChop', patterns: ['chopchop', 'chop chop'] },
  {
    id: 'panini-internazionale',
    name: 'Panini Internazionale',
    patterns: ['panini internazionale'],
  },

  // Restauranger
  { id: 'texas-longhorn', name: 'Texas Longhorn', patterns: ['texas longhorn'] },
  { id: 'olearys', name: "O'Learys", patterns: ['o learys', 'olearys'] },
  { id: 'pinchos', name: 'Pinchos', patterns: ['pinchos'] },
  { id: 'pizza-hut', name: 'Pizza Hut', patterns: ['pizza hut'] },
  { id: 'taco-bar', name: 'Taco Bar', patterns: ['taco bar'] },
  { id: 'holy-greens', name: 'Holy Greens', patterns: ['holy greens'] },
  { id: 'sushi-yama', name: 'Sushi Yama', patterns: ['sushi yama'] },
  { id: 'pong', name: 'Pong', patterns: ['pong'] },
  { id: 'heat', name: 'Heat', patterns: ['heat'] },
  { id: 'brodernas', name: 'Brödernas', patterns: ['brodernas'] },
  { id: 'thai-house-wok', name: 'Thai House Wok', patterns: ['thai house wok'] },
  { id: 'hawaii-poke', name: 'Hawaii Poke', patterns: ['hawaii poke'] },
  // Fyra kommuner, tre stavningar: "Grekiska Grill och Bar", "Grekiska Grill
  // & Bar", "Grekiska grill o bar". Mönstret slutar därför före bindeordet.
  { id: 'grekiska-grill-och-bar', name: 'Grekiska Grill & Bar', patterns: ['grekiska grill'] },

  // Livsmedelsbutiker
  { id: 'ica', name: 'ICA', patterns: ['ica'] },
  { id: 'coop', name: 'Coop', patterns: ['coop'] },
  { id: 'hemkop', name: 'Hemköp', patterns: ['hemkop'] },
  { id: 'willys', name: 'Willys', patterns: ['willys'] },
  { id: 'lidl', name: 'Lidl', patterns: ['lidl'] },
  { id: 'city-gross', name: 'City Gross', patterns: ['city gross'] },
  { id: 'tempo', name: 'Tempo', patterns: ['tempo'] },
  { id: 'handlarn', name: 'Handlar’n', patterns: ['handlarn'] },

  // Servicebutiker och drivmedel
  { id: 'pressbyran', name: 'Pressbyrån', patterns: ['pressbyran'] },
  { id: '7-eleven', name: '7-Eleven', patterns: ['7 eleven', 'seven eleven'] },
  { id: 'direkten', name: 'Direkten', patterns: ['direkten'] },
  { id: 'circle-k', name: 'Circle K', patterns: ['circle k'] },
  { id: 'okq8', name: 'OKQ8', patterns: ['okq8'] },
  { id: 'preem', name: 'Preem', patterns: ['preem'] },
];

/** Samma translitterering som `slugify` i slug.ts, och av samma skäl. */
const SWEDISH: Record<string, string> = {
  å: 'a',
  ä: 'a',
  ö: 'o',
  é: 'e',
  è: 'e',
  ü: 'u',
  ø: 'o',
  æ: 'a',
};

/**
 * Namnet som en ordlista, jämförbar mellan kommuner.
 *
 * Skiljetecken faller bort helt i stället för att bli bindestreck, till
 * skillnad från `slugify`. Det är avsiktligt: "O´Learys", "O'Learys" och
 * "OLearys" ska kunna fångas av två mönster i stället för sex.
 */
export function normalise(name: string): string[] {
  let lowered = name.toLowerCase();
  for (const [char, replacement] of Object.entries(SWEDISH)) {
    lowered = lowered.split(char).join(replacement);
  }

  return lowered
    .normalize('NFKD')
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

interface CompiledPattern {
  id: string;
  words: string[];
}

/**
 * Mönstren, längsta först.
 *
 * Ordningen avgör vem som vinner när två kedjor båda kan matcha, och längsta
 * mönster ska vinna: fanns både `coop` och `coop nara` i registret vore det
 * senare det mer specifika svaret. Ordningen är därför en egenskap hos
 * uppslaget och inte hos registrets radordning, som är grupperad för att gå
 * att läsa.
 */
const COMPILED: CompiledPattern[] = REGISTER.flatMap((c) =>
  c.patterns.map((p) => ({ id: c.id, words: normalise(p) })),
).sort(
  (a, b) =>
    b.words.length - a.words.length || b.words.join(' ').length - a.words.join(' ').length,
);

/** Kedjans id för ett namn, eller null när namnet inte hör till någon kedja. */
export function chainIdFor(name: string): string | null {
  const words = normalise(name);

  for (const pattern of COMPILED) {
    if (words.length < pattern.words.length) continue;

    let hit = true;
    for (let i = 0; i < pattern.words.length; i++) {
      if (words[i] !== pattern.words[i]) {
        hit = false;
        break;
      }
    }
    if (hit) return pattern.id;
  }

  return null;
}
