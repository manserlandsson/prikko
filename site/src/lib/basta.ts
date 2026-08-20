/**
 * Sidtypen som svarar på `restauranger [stad] högst betyg`.
 *
 * ## Varför sidtypen finns
 *
 * `restauranger [stad] högst betyg` är den enda frasform som mätts till 8 av 8
 * i docs/26 §4.1, och den håller: mätt om 2026-08-20 kompletteras den för 8 av
 * våra 12 kommuner. `caféer [stad] högst betyg` kompletteras för 6 av 6 prövade
 * städer. Fram till nu fanns inget svar på den frågan utom blocket "Bäst i
 * närheten" i sidopanelen på en verksamhetssida, alltså inne på en sida man
 * redan hittat. Mätningen står i docs/30 §12.
 *
 * Ordet `betyg` står aldrig i en rubrik hos oss, av skälet i docs/26 §8 punkt 5
 * och docs/30 §9 punkt 7. Frasen är belägg för efterfrågan, aldrig förlaga för
 * text. Vad sidan bär i stället är vad listan FAKTISKT är, och det är också vad
 * som skiljer oss från alla andra som svarar på frågan: talet kommer ur
 * kommunens kontroller och inte ur gästernas omdömen.
 *
 * ## Vad som får stå på sidan, och varför den inte går att vända
 *
 * Regeln är `bestNearby`s i data.ts och den är en regel om RIKTNING, inte en
 * tröskel: en namngiven verksamhet får aldrig framställas som något att undvika.
 * Listan innehåller därför bara verksamheter vars VARJE publicerade kontroll
 * saknar anmärkning. Den har ingen botten, ingen vändning och ingen sista sida,
 * och den ska aldrig få en: vänder man ordningen får man de sämsta av de
 * fläckfria, vilket är en rangordning av oskyldiga.
 *
 * Av samma skäl rangordnas aldrig kommuner mot varandra. Sidan finns per kommun
 * och jämför bara inom kommunen, och ribban skrivs ut just för att den INTE går
 * att läsa som ett betyg på kommunen. Se `kommunensTak` nedan.
 *
 * ## Varför kravet är fläckfri och inte `clean`
 *
 * `clean` betyder att SENASTE kontrollen saknade anmärkning. Det säger
 * ingenting om de föregående. Stockholms djupaste register är 113 kontroller,
 * och att rangordna `clean`-verksamheter på antal kontroller hade lagt en
 * verksamhet med tolv anmärkningar och en ren sistekontroll överst på en sida
 * som utger sig för att visa de bästa. Det är fel som spelar roll.
 *
 * Kravet är därför att varje publicerad kontroll har `assessment === 0`. Då
 * betyder talet på raden exakt det raden påstår, och en läsare kan räkna efter
 * i kontrollhistoriken på verksamhetens egen sida.
 *
 * Mätt på beståndet 2026-08-20: 2 984 av Stockholms 3 559 restauranger är
 * `clean`, men bara 972 av dem är fläckfria genom hela registret, och 454 av de
 * 972 har minst tre kontroller. Skillnaden mellan kravet och `clean` är alltså
 * 2 012 verksamheter, inte en teknikalitet.
 *
 * ## Ordningen
 *
 * Samma två nycklar som `bestNearby`, av samma skäl, med den ena bytt eftersom
 * en kommunsida inte har någon läsare att mäta avstånd från.
 *
 *  1. FLEST KONTROLLER FÖRST. Ett fläckfritt register på tolv kontroller är
 *     bättre belagt än ett på tre, och det är den enda skillnaden mellan två
 *     fläckfria register som vi har täckning för.
 *  2. FÄRSKAST KONTROLL FÖRST vid lika många. `bestNearby` valde bort
 *     färskheten som TREDJE nyckel, med skälet att en ordning som inte går att
 *     läsa ut ur raden inte går att pröva. Här är den andra nyckeln, och
 *     datumet står på raden. Skälet står alltså kvar och pekar åt andra hållet.
 *  3. Bokstavsordning vid lika på båda. Det är ingen rangordning utan ett
 *     stabilt utfall mellan bygg, och det är därför raderna inte numreras.
 *
 * Båda nycklarna står på varje rad, så ordningen går att pröva mot det man ser.
 *
 * ## Varför raderna grupperas och inte numreras
 *
 * Samma svar som lib/utmarkelser.ts ger: gruppen ÄR rangordningen. I Stockholms
 * restauranglista ligger nio verksamheter på nio kontroller, och en numrerad
 * lista hade påstått att den fjärde är bättre än den tolfte när skillnaden är
 * bokstavsordningen.
 */
import { classify, topCategory, type TopCategory, type TopCategoryId } from './categories';
import {
  HISTORY_DEPTH,
  establishments,
  latestInspectionDate,
  municipalities,
  type Establishment,
  type Municipality,
} from './data';

/**
 * Minsta antal fläckfria kontroller en verksamhet måste ha för att alls stå på
 * sidan.
 *
 * Talet är inte nytt. `HISTORY_DEPTH` i data.ts är hur många kontroller
 * modellen väger in, och märkningen "ren historik" kräver just så många utan
 * anmärkning. Att kräva färre här hade betytt att sidan kallar något
 * välbelagt som huset i övrigt inte anser vara det.
 */
export const MIN_BASTA_KONTROLLER = HISTORY_DEPTH;

/**
 * Tak för hur många rader sidan visar.
 *
 * Sidan är en TOPPLISTA och inte ett register. Kommunens fullständiga register
 * ligger på /[kommun]/ och kategorins på /[kommun]/kategori/[kategori]/, båda
 * med sidindelning. En "bästa"-lista som rymmer varenda kvalificerad verksamhet
 * har slutat vara ett urval: Stockholm har 454 fläckfria restauranger, och en
 * lista på 454 namn svarar inte på frågan som ställdes.
 *
 * Taket är också det som avgör VILKA kommuner som får en sida, och det är
 * avsikten. Se `bastaSnitt`.
 */
export const BASTA_TAK = 50;

/**
 * Minsta antal rader för att sidan alls ska byggas.
 *
 * Samma tal och samma skäl som `MIN_LAST_PAGE` i lib/pagination.ts: tio är
 * punkten där en sida slutar vara ett utsnitt och blir en lista. Under den är
 * det en handfull namn med en rubrik över, alltså den tunna sida bibeln §6
 * säger drar ner hela domänen.
 */
export const MIN_BASTA_RADER = 10;

/**
 * Kategorierna med mätt efterfrågan, och inga andra.
 *
 * `restauranger [stad] högst betyg` 8 av 12, `caféer [stad] högst betyg` 6 av 6.
 * Butiksledet mättes till 0 av 6 under ordet mataffär och skolledet till 0 av 6
 * under ordet förskolor, fem av de tolv med noll förslag över huvud taget.
 * Övrigtkategorin prövades inte om: docs/30 §6.3 fann att träffarna där tillhör
 * klädeskedjan Lager 157 och inte oss.
 *
 * En kategori utan mätt efterfrågan får ingen sida hur bra datan än är.
 */
export const BASTA_KATEGORIER: readonly TopCategoryId[] = ['restaurang', 'cafe'];

/**
 * URL-ledet under kommunen: /[kommun]/utan-anmarkning/[kategori]/.
 *
 * Ledet hette `basta` i första bygget och kunde inte heta det. Verksamheternas
 * sluggar delar namnrymd med kommunens listsidor, `/stockholm/vesuvio/` ligger
 * på samma nivå som `/stockholm/kategori/`, och det finns en restaurang som
 * heter Basta i både Stockholm och Örebro. Utfallet blev att `/stockholm/basta/`
 * var en restaurangsida OCH föräldern till vår topplista, och att sidtyp() i
 * astro.config.mjs klassade de två verksamhetssidorna som topplistor i
 * sitemapen. Bygget gick igenom; det var alltså ett fel som inte syntes.
 *
 * Det nya ledet är två ord och säger vad sidan är, alltså samma ord som
 * rubriken. Att det inte krockar är mätt och inte antaget: `sparraKrock` nedan
 * fäller bygget den dag en verksamhet får just den sluggen.
 */
export const BASTA_SEGMENT = 'utan-anmarkning';

/**
 * Bygggrind: ingen verksamhet får bära URL-ledets namn.
 *
 * Krocken ovan upptäcktes för att en katalog såg fel ut i utgåvan, inte för att
 * något fällde. Nästa gång ska den fälla. Grinden är billig, den körs en gång
 * per bygge ur bastaSidor(), och den beskriver felet i klartext i stället för
 * att lämna efter sig en verksamhetssida som ligger som förälder till en
 * listsida.
 */
function sparraKrock(): void {
  for (const e of establishments()) {
    if (e.slug === BASTA_SEGMENT) {
      throw new Error(
        `Verksamheten "${e.name}" i ${e.municipality.name} har sluggen ` +
          `"${BASTA_SEGMENT}", vilket är URL-ledet för topplistorna. ` +
          `/${e.municipality.slug}/${BASTA_SEGMENT}/ skulle då vara både en ` +
          'verksamhetssida och förälder till en listsida. Byt BASTA_SEGMENT i ' +
          'src/lib/basta.ts och i sidtyp() i astro.config.mjs, i samma ändring.',
      );
    }
  }
}

export interface BastaRad {
  slug: string;
  name: string;
  address: string | null;
  /** Publicerade kontroller, samtliga utan anmärkning. Ordningens första nyckel. */
  kontroller: number;
  /** Senaste kontrollens datum. Ordningens andra nyckel, och den står på raden. */
  senast: string;
}

/** En grupp är ett antal kontroller. Gruppen är rangordningen, inte raden. */
export interface BastaGrupp {
  kontroller: number;
  rader: BastaRad[];
}

export interface BastaSnitt {
  kommun: Municipality;
  category: TopCategory;
  /** Verksamheter i kategorin i kommunen. Trattens första tal. */
  iKategorin: number;
  /** Av dem: senaste kontrollen utan anmärkning. */
  rena: number;
  /** Av dem: VARJE publicerad kontroll utan anmärkning, oavsett antal. */
  flackfria: number;
  /** Av dem: minst MIN_BASTA_KONTROLLER stycken. Kandidaterna till sidan. */
  kandidater: number;
  /** Ribban sidan landade på, alltså minsta antal kontroller som kom med. */
  ribba: number;
  grupper: BastaGrupp[];
  /** Summan av gruppernas rader. */
  antal: number;
  /** Djupaste fläckfria register i kategorin. Radernas översta tal. */
  djupast: number;
}

/** Varje publicerad kontroll utan anmärkning, och minst en kontroll. */
function flackfri(e: Establishment): boolean {
  return (
    e.verdict === 'clean' &&
    e.inspections.length > 0 &&
    e.inspections.every((i) => i.assessment === 0)
  );
}

/**
 * Snittet för en kommun och en kategori, eller null när det inte bär en sida.
 *
 * ## Varför hela grupper och aldrig ett snitt inne i en grupp
 *
 * Taket räknas genom att grupper läggs till uppifrån så länge HELA gruppen får
 * plats. En grupp som inte får plats tas inte in halv. Skälet är att raderna
 * inom en grupp har identiskt underlag: att visa 30 av 72 verksamheter som alla
 * har tio fläckfria kontroller vore att välja ut 30 på bokstavsordning och
 * kalla dem de bästa.
 *
 * ## Vad regeln kostar, och varför kostnaden är rätt
 *
 * Regeln stänger ute varje kommun vars källa är för grund för att skilja någon
 * från någon annan. Mätt 2026-08-20:
 *
 *   Karlstad, Lomma och Oskarshamn publicerar HÖGST EN kontroll per
 *   verksamhet. Ingen kan då ha tre fläckfria, och ingen ordning finns att
 *   redovisa. Karlstads 154 rena restauranger är alla lika välbelagda.
 *
 *   Jönköping publicerar högst tre. 64 restauranger är fläckfria och samtliga
 *   64 har exakt tre. En enda grupp, alltså ingen ordning.
 *
 * Det är samma utlämnandegräns som docs/30 §4 beskriver för kontrollpunkter och
 * som lib/utmarkelser.ts beskriver som `maxHistory`. Den handlar om vad
 * kommunen publicerar, aldrig om hur rena köken är, och sidan skriver ut det.
 *
 * Kravet på minst två grupper ändrar i dag inget utfall, och det är mätt: ingen
 * kommun faller på enbart det villkoret. Det står ändå kvar, eftersom det är
 * villkoret som gör sidans egen rubrikmening sann. Får Jönköping en fjärde
 * kontroll per verksamhet blir det villkoret som fäller, inte taket.
 */
export function bastaSnitt(slug: string, categoryId: TopCategoryId): BastaSnitt | null {
  /*
   * Efterfrågan prövas HÄR och inte hos anroparen.
   *
   * Filtret låg först bara i bastaSidor(), som bygger sidorna, medan
   * KategoriHub frågade bastaSnitt() rakt av för den kategori den råkade visa.
   * De två svarade då olika: Örebros övrigtkategori passerar datavillkoren och
   * fick en länk till /orebro/utan-anmarkning/ovrigt/, en adress som aldrig
   * byggs. Tio av femton länkar i utgåvan pekade på en 404 av det skälet, och
   * ingen grind sade något: sitemapgrinden läser sitemapen, noindex och
   * webbkartan, inte varje <a href> i utfallet.
   *
   * Modulen är därför den enda som vet vad som får finnas, och en anropare kan
   * inte gå runt den ens av misstag.
   */
  if (!BASTA_KATEGORIER.includes(categoryId)) return null;

  const alla = establishments(slug);
  const kommun = alla[0]?.municipality;
  if (!kommun) return null;

  const iKategorin = alla.filter((e) => classify(slug, e.types).categories.includes(categoryId));
  const rena = iKategorin.filter((e) => e.verdict === 'clean');
  const flackfria = iKategorin.filter(flackfri);
  const kandidater = flackfria.filter((e) => e.inspections.length >= MIN_BASTA_KONTROLLER);

  const perAntal = new Map<number, Establishment[]>();
  for (const e of kandidater) {
    const n = e.inspections.length;
    const hink = perAntal.get(n);
    if (hink) hink.push(e);
    else perAntal.set(n, [e]);
  }

  const grupper: BastaGrupp[] = [];
  let antal = 0;
  let ribba = 0;
  for (const n of [...perAntal.keys()].sort((a, b) => b - a)) {
    const hink = perAntal.get(n)!;
    if (antal + hink.length > BASTA_TAK) break;
    grupper.push({ kontroller: n, rader: hink.map(rad).sort(ordning) });
    antal += hink.length;
    ribba = n;
  }

  if (antal < MIN_BASTA_RADER || grupper.length < 2) return null;

  return {
    kommun,
    category: topCategory(categoryId),
    iKategorin: iKategorin.length,
    rena: rena.length,
    flackfria: flackfria.length,
    kandidater: kandidater.length,
    ribba,
    grupper,
    antal,
    djupast: grupper[0].kontroller,
  };
}

function rad(e: Establishment): BastaRad {
  return {
    slug: e.slug,
    name: e.name,
    address: e.address,
    kontroller: e.inspections.length,
    // Varje kontroll är utan anmärkning, så den senaste finns alltid.
    senast: latestInspectionDate(e)!,
  };
}

/**
 * Ordningen INOM en grupp, alltså när första nyckeln är lika.
 *
 * Färskast först, sedan bokstavsordning. Se modulhuvudet för varför det är två
 * nycklar och inte tre.
 */
function ordning(a: BastaRad, b: BastaRad): number {
  if (a.senast !== b.senast) return a.senast < b.senast ? 1 : -1;
  return a.name.localeCompare(b.name, 'sv');
}

/**
 * Djupaste publicerade register i hela kommunen, alltså taket för hur långt ett
 * fläckfritt register kan bli där.
 *
 * Talet står på sidan för att ribban annars läses som ett betyg på kommunen.
 * Samma varning som lib/utmarkelser.ts skriver ut: en hög ribba säger att
 * kommunen publicerar djup historik och kontrollerar ofta, aldrig att köken är
 * renare.
 */
export function kommunensTak(slug: string): number {
  let max = 0;
  for (const e of establishments(slug)) {
    if (e.inspections.length > max) max = e.inspections.length;
  }
  return max;
}

/**
 * Varje kommun och kategori som bär en sida.
 *
 * En enda källa, läst av tre ställen som aldrig får komma fram till olika svar:
 * getStaticPaths i pages/[kommun]/utan-anmarkning/[kategori].astro, `kommunLinks` i
 * lib/webbkarta.ts och länkarna på kommunens kategorisida.
 */
export function bastaSidor(): BastaSnitt[] {
  sparraKrock();
  const ut: BastaSnitt[] = [];
  for (const m of municipalities()) {
    for (const id of BASTA_KATEGORIER) {
      const snitt = bastaSnitt(m.slug, id);
      if (snitt) ut.push(snitt);
    }
  }
  return ut;
}

/** Kommunens egna snitt, i BASTA_KATEGORIER-ordning. */
export function bastaForKommun(slug: string): BastaSnitt[] {
  return BASTA_KATEGORIER.map((id) => bastaSnitt(slug, id)).filter(
    (s): s is BastaSnitt => s !== null,
  );
}
