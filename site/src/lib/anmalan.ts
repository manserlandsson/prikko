/**
 * Från en verksamhet till en färdig länk in i kommunens anmälningsformulär.
 *
 * ---------------------------------------------------------------------------
 * VAD MODULEN GÖR OCH VAD DEN INTE GÖR
 * ---------------------------------------------------------------------------
 * Den slår upp kommunen i `anmalan.data.ts`, bygger frågesträngen där
 * formuläret tar emot en, och lämnar ifrån sig noll, en eller två färdiga
 * vägar. Den vet ingenting om hur rutan ser ut; det är Anmal.astro. Den vet
 * heller ingenting om var datan kommer ifrån; det är data.ts.
 *
 * Sidmallen frågar en gång per sida och får antingen en tom lista, och då
 * ritas ingen ruta alls, eller de vägar som faktiskt finns.
 *
 * ---------------------------------------------------------------------------
 * TVÅ ETIKETTER TILL SAMMA STÄLLE ÄR ETT LÖFTE VI INTE HÅLLER
 * ---------------------------------------------------------------------------
 * Borgholms enda e-tjänst heter "Klagomål" och täcker både matförgiftning och
 * annat. Båda posterna i tabellen pekar därför på samma adress. Att rita två
 * knappar med olika text till exakt samma sida vore att erbjuda ett val som
 * inte finns. `anmalningsvagar` tar därför bort den andra vägen när dess
 * href är identisk med den första.
 *
 * Regeln är allmän och inte ett undantag för Borgholm: rutan visar aldrig
 * samma destination två gånger.
 *
 * ---------------------------------------------------------------------------
 * KODNINGEN
 * ---------------------------------------------------------------------------
 * `URLSearchParams`, som skriver mellanslag som `+`. Prövat mot samtliga tre
 * förifyllbara formulär med snedstreck, plus, ampersand och å-ä-ö i namnet:
 * "M/s Ballerina", "Parma Kök & Bar" och "Café Lödde Å & Co" kom tillbaka
 * oförändrade.
 */

import { ANMALAN, type Anmalningslank } from './anmalan.data.ts';
import type { Categorised, TopCategoryId } from './categories.ts';

/**
 * Ett mellanslag, aldrig en tom sträng.
 *
 * Se `allaEllerInget` i anmalan.data.ts: Stockholms formulär släpper hela
 * parameterblocket när adressen är tom, och sidan laddar då oifylld med status
 * 200. Det är en tyst förlust, alltså den sortens fel man aldrig ser förrän
 * någon mäter efter.
 */
const ADRESS_SAKNAS = ' ';

/** Det rutan behöver veta om verksamheten. Inget mer. */
export interface Anmalningsverksamhet {
  /** Vårt nationella id, `F-<kommunkod>-<lokalt id>`. */
  id: string;
  name: string;
  address: string | null;
}

export interface Anmalningsvag {
  /** Knappens text. Ordagrant, se docs/18_sprakregler.md. */
  etikett: string;
  href: string;
}

/**
 * Etiketterna.
 *
 * Rubriken bär verbet ("Anmäl till kommunen"), alltså behöver knapparna det
 * inte. Stockholms egna heter "Rapportera misstänkt matförgiftning" och
 * "Lämna klagomål"; vi kortar dem på samma sätt som handlingsraden kortar
 * "Följ" och "Dela".
 *
 * Ordet "misstänkt" är kommunens eget och bär hela förbehållet: man anmäler en
 * misstanke, inte ett faktum. Det är därför etiketten aldrig får skrivas om
 * till något kortare.
 */
const ETIKETT_MATFORGIFTNING = 'Misstänkt matförgiftning';
const ETIKETT_BRISTER = 'Brister i livsmedelshanteringen';

/**
 * Är det här en plats någon ätit på?
 *
 * NÄMNAREN ÄR ÖPPETTIDERNAS, INTE EN NY. `classify_via_node` i
 * pipeline/oppettider.py gör exakt den här uträkningen innan den hämtar
 * öppettider, och kommentaren där pekar hit och säger att categories.ts är
 * sanningen. Skulle de två glida isär hade en verksamhet kunnat ha öppettider
 * utan att få anmäla, eller tvärtom, och ingen hade märkt det.
 *
 * `spanning` RÄKNAS MED, och det är hela skillnaden mot vad sidmallen gjorde
 * förut. Statusvärdet betyder att kommunens ordförråd inte går att lösa upp;
 * Höganäs enda stora grupp heter "Butik, restaurang och servering" och rymmer
 * apotek, pizzerior och stormarknader i samma hink. Alla tre ÄR konsumentvända,
 * det är bara vår indelning som inte kan säga vilken.
 *
 * Sidmallen räknade tidigare bort dem, med den då riktiga motiveringen att
 * Stockholm har noll `spanning` och att grenen därför aldrig togs. När rutan
 * flyttade ut till alla tolv kommuner blev det fel: 217 av Höganäs 316 och 9
 * av Kristinehamns 170 är `spanning`, och utan dem hade Höganäs blivit den
 * enda kommun med en fungerande matförgiftningstjänst men noll rutor.
 */
export function arKonsumentvand(c: Categorised): boolean {
  const KONSUMENT: readonly TopCategoryId[] = ['restaurang', 'cafe', 'butik'];
  return c.status === 'spanning' || c.categories.some((id) => KONSUMENT.includes(id));
}

/** Bygger den färdiga adressen för en post i tabellen. */
function bygg(lank: Anmalningslank, v: Anmalningsverksamhet): string {
  const f = lank.forifyllning;
  if (!f) return lank.url;

  const adress = (v.address ?? '').trim();
  const params = new URLSearchParams();

  if (f.id) {
    // Prefixet skalas av BARA i början. `String.replace` med en sträng träffar
    // första förekomsten var som helst, och ett id som råkade bära "F-0180-"
    // en gång till inuti sig hade då stympats på fel ställe.
    const utanPrefix =
      f.idPrefix && v.id.startsWith(f.idPrefix) ? v.id.slice(f.idPrefix.length) : v.id;
    params.set(f.id, utanPrefix);
  }
  params.set(f.namn, v.name);

  if (f.adress) {
    // Allt eller inget: hellre ett mellanslag än ett tomt fält som nollar
    // resten. Binds fälten var för sig utelämnas parametern i stället, för då
    // är en tom parameter bara skräp i adressfältet.
    if (adress) params.set(f.adress, adress);
    else if (f.allaEllerInget) params.set(f.adress, ADRESS_SAKNAS);
  }

  return `${lank.url}?${params.toString()}`;
}

/**
 * Vägarna att visa för en verksamhet, i ordning.
 *
 * @param kommunkod  `Municipality.code`.
 * @param v          Verksamheten.
 * @param konsumentvand
 *   Är det här en plats någon ätit på? Bara då får matförgiftningslänken
 *   visas. Räkna den med `arKonsumentvand` ovan och skicka in svaret.
 */
export function anmalningsvagar(
  kommunkod: string,
  v: Anmalningsverksamhet,
  konsumentvand: boolean,
): Anmalningsvag[] {
  const kommun = ANMALAN[kommunkod];
  if (!kommun) return [];

  const vagar: Anmalningsvag[] = [];

  if (kommun.matforgiftning && konsumentvand) {
    vagar.push({ etikett: ETIKETT_MATFORGIFTNING, href: bygg(kommun.matforgiftning, v) });
  }

  if (kommun.brister) {
    const href = bygg(kommun.brister, v);
    // Aldrig samma destination två gånger. Se rubriken överst.
    if (!vagar.some((x) => x.href === href)) {
      vagar.push({ etikett: ETIKETT_BRISTER, href });
    }
  }

  return vagar;
}
