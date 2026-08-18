/**
 * Kontrollpunkterna, räknade en gång för alla artiklar.
 *
 * ## Varför modulen finns
 *
 * Fem artiklar bar egna, handskrivna tal om samma kontrollpunkter, och de gled
 * isär. J03 stod som "1 977 av 11 344 granskningar" i två artiklar och som
 * "657 av 1 911 avvikelser" i två andra, över en tredje bas som beskrevs som
 * "samma 14 588 kontroller". Varje tal var rimligen sant den dag det skrevs,
 * men de kom från olika körningar mot ett bestånd som växer varje natt, och en
 * läsare som jämför två av våra artiklar ser en motsägelse.
 *
 * Talen räknas därför här, vid bygget, ur samma data som resten av sajten.
 * Artiklarna importerar dem i stället för att skriva av dem. Går datan upp
 * följer texten med, och två artiklar kan inte längre säga olika saker.
 *
 * ## Basen, och varför den är liten
 *
 * Bara kommuner som publicerar HELA rapporteringspunkten kan brytas ned så
 * här. Stockholm publicerar bara bokstaven ("J"), och faller därför ur helt.
 * Basen är alltså mycket mindre än sajtens bestånd, och det måste stå i varje
 * artikel som använder talen. `punktBas().kommuner` finns för just det.
 *
 * Samma avvägning som `deviationAreaReport()` i rapporter.ts gör åt andra
 * hållet: den räknar på bokstaven för att få med alla kommuner. De två svarar
 * på olika frågor och ska inte slås ihop.
 *
 * ## Vad som räknas som avvikelse
 *
 * "Avvikelse" och "kvarstående", aldrig "åtgärdad" eller "avskriven". Samma
 * regel som REMARK_STATUSES i data.ts, av samma skäl: en punkt som var fel och
 * rättades ska inte ligga kvar som en anmärkning i statistiken.
 */
import {
  categoriesOf,
  establishments,
  municipalities,
  TOP_CATEGORIES,
  type ControlArea,
  type TopCategoryId,
} from './data';
import { FIRST_YEAR, lastCompleteYear } from './rapporter';

/** En kontrollpunkt, räknad på fyra sätt. */
export interface Punkt {
  /** Livsmedelsverkets rapporteringspunkt, t.ex. "J03". */
  kod: string;
  /** Punktens egen beskrivning, hämtad ur datan och inte skriven här. */
  namn: string;
  /** Kontroller där punkten alls granskades. Nämnaren för `andel`. */
  granskad: number;
  /** Granskningar som gav avvikelse eller kvarstående avvikelse. */
  avvikelse: number;
  /** Avvikelser som stod kvar vid kommunens uppföljning. */
  kvarstod: number;
  /**
   * Avvikelser som var protokollets ENDA avvikelse.
   *
   * Räknas mot alla avvikelser i kontrollen, även på punkter som ingen artikel
   * nämner. Annars blir en kontroll med J03 plus H01 felaktigt en ensam J03.
   */
  ensam: number;
  /**
   * Summan av ANDRA avvikelser vid de kontroller där punkten brast, och antalet
   * sådana kontroller. Kvoten är genomsnittet.
   *
   * Två summor och inte ett färdigt medeltal, eftersom ett medeltal inte går
   * att räkna vidare på. Delningen sker i `ovrigaVid`.
   */
  ovrigaNar: number;
  ovrigaNarAntal: number;
  /** Samma två tal för de kontroller där punkten granskades UTAN anmärkning. */
  ovrigaUtan: number;
  ovrigaUtanAntal: number;
}

export interface PunktBas {
  /** Kontroller totalt i punktkommunerna. */
  kontroller: number;
  /** Kommunernas namn i bokstavsordning, till meningen som anger basen. */
  kommuner: string[];
  /**
   * Kommuner i hela beståndet, alltså nämnaren till "3 av 12".
   *
   * Står här för att artiklarna ska kunna skriva ut hur liten basen är utan att
   * räkna själva. Utan den läser en artikel som om talen gällde hela sajten.
   */
  kommunerTotalt: number;
  /** Punkterna i fallande antal avvikelser. */
  punkter: Punkt[];
}

const AVVIKANDE = new Set(['deviation', 'persisting']);

/**
 * En kontroll som går att bryta ned på punktnivå, med det som frågorna utanför
 * själva punktsummorna behöver: vem, var, när och vilken sorts verksamhet.
 *
 * Raderna byggs en gång och delas av alla mått. Utan dem hade varje nytt mått
 * krävt en egen genomgång av beståndet, och de är sex stycken: punktsummorna,
 * kategorierna, åren, korstabellen mot en annan punkt, återkomsten per
 * verksamhet och kommunlistan.
 */
export interface Kontrollrad {
  /** Verksamhetens id, till frågan om samma ställe får punkten igen. */
  verksamhet: string;
  /** Orten i grundform, till meningen som anger basen. */
  kommun: string;
  /** Kontrollens år, YYYY. */
  ar: string;
  /** Verksamhetens kategori, eller null när källans typvärden inte räcker. */
  kategori: TopCategoryId | null;
  /** Punktraderna precis som de står i protokollet. */
  omraden: ControlArea[];
}

let radcache: Kontrollrad[] | null = null;

/**
 * Kontrollens punktrader, eller tom lista när kontrollen inte har några.
 *
 * Kravet är en HEL rapporteringspunkt, alltså "J03" och inte "J". Stockholm
 * publicerar bara bokstaven och faller därför ur, och en kontroll helt utan
 * `areas` faller ur på samma sätt i stället för att fälla bygget. Fältet står
 * som obligatoriskt i `Inspection`, men modulen går igenom alla tolv kommuners
 * bestånd och inte bara de tre den handlar om, och en källa som slutar lämna
 * listan ska ge en tunnare artikel och inte ett stoppat bygge.
 */
function punktomraden(kontroll: { areas?: ControlArea[] }): ControlArea[] {
  const omraden = kontroll.areas;
  if (!Array.isArray(omraden)) return [];
  return omraden.some((a) => a?.code && a.code.length > 1) ? omraden : [];
}

/**
 * Kontrollerna som alls kan brytas ned på punktnivå.
 *
 * Publicerar kommunen punktnivå? Avgörs på raden, inte på en lista i koden. En
 * källa som börjar publicera hela punkten kommer med av sig själv, och en som
 * slutar faller ur utan att någon måste minnas det. Borgholm kom in på det
 * sättet och bidrar med 49 av 14 667 kontroller.
 *
 * Genomgången gäller HELA beståndet och inte de tre kommuner modulen handlar
 * om, så den måste tåla varje form en kontroll kan ha. `areas` är i dag alltid
 * en lista i datafilerna, men en kontroll utan punkter är inget fel i datan
 * utan just en kontroll som saknar punktnivå: den ska falla ur här och inte
 * stoppa bygget. Se `punktomraden`.
 */
export function rader(): Kontrollrad[] {
  if (radcache) return radcache;

  const ut: Kontrollrad[] = [];
  for (const e of establishments()) {
    /*
     * Kategorin klassificeras en gång per verksamhet och inte en gång per
     * kontroll. Linköping ensamt har 9 130 kontroller på ungefär en tredjedel
     * så många ställen, och klassificeringen går igenom kommunens hela
     * ordförråd för varje anrop.
     */
    let kategori: TopCategoryId | null | undefined;

    for (const kontroll of e.inspections ?? []) {
      const omraden = punktomraden(kontroll);
      if (omraden.length === 0) continue;
      if (kategori === undefined) kategori = categoriesOf(e).category;

      ut.push({
        verksamhet: e.id,
        kommun: e.municipality.city,
        ar: kontroll.date.slice(0, 4),
        kategori,
        omraden,
      });
    }
  }

  radcache = ut;
  return ut;
}

let cache: PunktBas | null = null;

/**
 * Hela underlaget, räknat en gång per byggprocess.
 *
 * Cachen är inte en optimering utan ett krav: fem artiklar anropar funktionen,
 * och utan cache skulle beståndet gås igenom fem gånger under ett bygge som
 * redan tar minuter.
 */
export function punktBas(): PunktBas {
  if (cache) return cache;

  const stat = new Map<string, Punkt>();
  const kommuner = new Set<string>();
  let kontroller = 0;

  for (const kontroll of rader()) {
    kontroller += 1;
    kommuner.add(kontroll.kommun);

    const avvikandeKoder: string[] = [];

    for (const område of kontroll.omraden) {
      const rad = stat.get(område.code) ?? {
        kod: område.code,
        namn: område.description,
        granskad: 0,
        avvikelse: 0,
        kvarstod: 0,
        ensam: 0,
        ovrigaNar: 0,
        ovrigaNarAntal: 0,
        ovrigaUtan: 0,
        ovrigaUtanAntal: 0,
      };
      rad.granskad += 1;

      if (AVVIKANDE.has(område.status)) {
        rad.avvikelse += 1;
        if (område.status === 'persisting') rad.kvarstod += 1;
        avvikandeKoder.push(område.code);
      }

      stat.set(område.code, rad);
    }

    if (avvikandeKoder.length === 1) {
      const rad = stat.get(avvikandeKoder[0]);
      if (rad) rad.ensam += 1;
    }

    /*
     * "Andra avvikelser vid samma kontroll", räknat per punkt.
     *
     * Måste ske efter att hela kontrollen är genomgången: totalen är känd
     * först då. En punkt som själv brast räknar bort sig själv ur totalen,
     * annars jämförs "en avvikelse plus punkten" med "noll avvikelser" och
     * skillnaden blir en per definition.
     */
    const totalt = avvikandeKoder.length;
    const avvikande = new Set(avvikandeKoder);
    for (const område of kontroll.omraden) {
      const rad = stat.get(område.code);
      if (!rad) continue;
      if (avvikande.has(område.code)) {
        rad.ovrigaNar += totalt - 1;
        rad.ovrigaNarAntal += 1;
      } else {
        rad.ovrigaUtan += totalt;
        rad.ovrigaUtanAntal += 1;
      }
    }
  }

  cache = {
    kontroller,
    kommuner: [...kommuner].sort((a, b) => a.localeCompare(b, 'sv')),
    kommunerTotalt: municipalities().length,
    punkter: [...stat.values()].sort((a, b) => b.avvikelse - a.avvikelse),
  };
  return cache;
}

/**
 * En enskild punkt.
 *
 * Kastar om koden inte finns. Ett diagram som tyst tappar en stapel är värre
 * än ett bygge som stannar: artikeln runt omkring beskriver fortfarande
 * stapeln i löptext.
 */
export function punkt(kod: string): Punkt {
  const träff = punktBas().punkter.find((p) => p.kod === kod);
  if (!träff) {
    const finns = punktBas().punkter.map((p) => p.kod).join(', ');
    throw new Error(
      `Kontrollpunkten ${kod} finns inte i beståndet. Punkter som finns: ${finns}`,
    );
  }
  return träff;
}

/** Andel i procent med svenskt decimaltecken, t.ex. "17,6 %". */
export function andel(del: number, helhet: number): string {
  if (helhet === 0) return '0,0 %';
  return `${((del / helhet) * 100).toFixed(1).replace('.', ',')} %`;
}

/** Samma andel som tal, för stapelns längd. */
export function andelTal(del: number, helhet: number): number {
  if (helhet === 0) return 0;
  return Number(((del / helhet) * 100).toFixed(1));
}

/** Ett tal med tusentalsavstånd, som resten av sajten skriver dem. */
function tal(n: number): string {
  return n.toLocaleString('sv-SE');
}

/** En rad i en Stapel. Formen är den `Stapel.astro` redan tar. */
export interface Stapelrad {
  label: string;
  value: number;
  display: string;
  note: string;
}

/*
 * Diagramraderna byggs här och inte i artiklarna.
 *
 * Fem artiklar skrev sina tal för hand och de gled isär. J03 stod som
 * "1 977 av 11 344 granskningar" i två artiklar och som "657 av 1 911
 * avvikelser" i två andra, över en tredje bas beskriven som "samma 14 588
 * kontroller". Varje tal var rimligen sant den dag det skrevs, men beståndet
 * växer varje natt: samma punkt räknas 2026-08-18 till 2 001 av 11 399 över en
 * bas på 14 667 kontroller. En läsare som jämför två av våra artiklar såg en
 * motsägelse.
 *
 * Den första raden i ett diagram skriver ut enheterna och resten är korta, för
 * att "1 349 av 8 895" åtta gånger under varandra läser som en tabell utan
 * rubrik. Därför flaggan `utforlig`.
 */

/** Andel av granskningarna som gav avvikelse. */
export function andelsrad(kod: string, label?: string, utforlig = false): Stapelrad {
  const p = punkt(kod);
  return {
    label: label ?? kortnamn(p),
    value: andelTal(p.avvikelse, p.granskad),
    display: andel(p.avvikelse, p.granskad),
    note: utforlig
      ? `${tal(p.avvikelse)} avvikelser av ${tal(p.granskad)} granskningar`
      : `${tal(p.avvikelse)} av ${tal(p.granskad)}`,
  };
}

/** Andel av avvikelserna som stod kvar vid kommunens uppföljning. */
export function kvarstodsrad(kod: string, label?: string, utforlig = false): Stapelrad {
  const p = punkt(kod);
  return {
    label: label ?? kortnamn(p),
    value: andelTal(p.kvarstod, p.avvikelse),
    display: andel(p.kvarstod, p.avvikelse),
    note: utforlig
      ? `${tal(p.kvarstod)} av ${tal(p.avvikelse)} avvikelser stod kvar`
      : `${tal(p.kvarstod)} av ${tal(p.avvikelse)}`,
  };
}

/** En ruta i en FactGrid. Formen är den `FactGrid.astro` redan tar. */
export interface Faktaruta {
  label: string;
  value: string;
  unit: string;
}

/**
 * Kvarstående avvikelser som faktarutor, i fallande andel.
 *
 * Sorterad här och inte i artikeln, eftersom meningen bredvid rutorna säger
 * vilken punkt som ligger överst. Skulle ordningen skrivas för hand i artikeln
 * och andelarna byta plats vid en nattlig uppdatering pekar meningen på fel
 * ruta, vilket är precis det den här modulen finns för att förhindra.
 */
export function kvarstodsfakta(koder: string[]): Faktaruta[] {
  return koder
    .map((kod) => punkt(kod))
    .sort((a, b) => b.kvarstod / b.avvikelse - a.kvarstod / a.avvikelse)
    .map((p) => ({
      label: kortnamn(p),
      value: andel(p.kvarstod, p.avvikelse).replace(' %', ''),
      unit: '%',
    }));
}

/** Andel av avvikelserna som var protokollets enda avvikelse. */
export function ensamrad(kod: string, label?: string, utforlig = false): Stapelrad {
  const p = punkt(kod);
  return {
    label: label ?? kortnamn(p),
    value: andelTal(p.ensam, p.avvikelse),
    display: andel(p.ensam, p.avvikelse),
    note: utforlig
      ? `${tal(p.ensam)} av ${tal(p.avvikelse)} avvikelser stod ensamma`
      : `${tal(p.ensam)} av ${tal(p.avvikelse)}`,
  };
}

/**
 * Meningen som anger underlaget, till diagrammens `underlag`.
 *
 * Basen MÅSTE stå utskriven varje gång, och kommunlistan med. Bara de som
 * publicerar hela rapporteringspunkten kan brytas ned så här, så talen gäller
 * en liten del av beståndet. Stockholm publicerar bara bokstaven och faller ur
 * helt. En läsare som tror att de 14 667 kontrollerna är hela sajten läser fel,
 * och därför står "3 av beståndets 12 kommuner" i varje underlagsmening.
 */
export function basmening(tillagg = ''): string {
  const bas = punktBas();
  return (
    `${tal(bas.kontroller)} kontroller med redovisade kontrollpunkter i ` +
    `${kommunlista()}, ${tal(bas.kommuner.length)} av beståndets ` +
    `${tal(bas.kommunerTotalt)} kommuner.${tillagg ? ' ' + tillagg : ''}`
  );
}

/**
 * Kommunerna i basen som en uppräkning: "Borgholm, Linköping och Örebro".
 *
 * Finns för att ingen artikel ska räkna upp dem för hand. De var två när
 * artiklarna skrevs och är tre sedan Borgholm började publicera hela
 * rapporteringspunkten, och de fyra artiklar som hade listan i löptext stod
 * kvar på "Linköping och Örebro" tills talen räknades här.
 */
export function kommunlista(): string {
  const namn = punktBas().kommuner;
  if (namn.length <= 1) return namn.join('');
  return `${namn.slice(0, -1).join(', ')} och ${namn[namn.length - 1]}`;
}

/** En rad i en Parstapel: andel som brister mot andel som kvarstår. */
export interface Parrad {
  label: string;
  a: number;
  b: number;
  aDisplay: string;
  bDisplay: string;
  note: string;
}

/**
 * Punkten ställd mot sig själv: hur ofta den brister, och hur ofta bristen
 * står kvar vid kommunens uppföljning.
 *
 * De två andelarna har OLIKA nämnare, och det är hela poängen med diagrammet.
 * A räknas mot granskningarna, B mot avvikelserna. Noten skriver därför ut
 * båda talen i klartext, annars läses 4,7 och 8,8 som två delar av samma
 * helhet.
 */
export function parrad(kod: string, label?: string): Parrad {
  const p = punkt(kod);
  return {
    label: label ?? kortnamn(p),
    a: andelTal(p.avvikelse, p.granskad),
    b: andelTal(p.kvarstod, p.avvikelse),
    aDisplay: andel(p.avvikelse, p.granskad),
    bDisplay: andel(p.kvarstod, p.avvikelse),
    note: `${tal(p.avvikelse)} avvikelser, ${tal(p.kvarstod)} kvarstod`,
  };
}

/** Genomsnittligt antal ANDRA avvikelser vid kontroller där punkten brast. */
export function ovrigaVid(kod: string): number {
  const p = punkt(kod);
  return p.ovrigaNarAntal === 0 ? 0 : p.ovrigaNar / p.ovrigaNarAntal;
}

/** Samma genomsnitt för kontroller där punkten var utan anmärkning. */
export function ovrigaUtan(kod: string): number {
  const p = punkt(kod);
  return p.ovrigaUtanAntal === 0 ? 0 : p.ovrigaUtan / p.ovrigaUtanAntal;
}

/** Två decimaler med svenskt decimaltecken, för genomsnitten. */
export function tvaDecimaler(n: number): string {
  return n.toFixed(2).replace('.', ',');
}

/** Ett tal med tusentalsavstånd, tillgängligt för artiklarna. */
export function nummer(n: number): string {
  return tal(n);
}

// ---------------------------------------------------------------------------
// Namn och ordning
// ---------------------------------------------------------------------------

/**
 * Läsbara namn på de punkter artiklarna nämner.
 *
 * Källans egna beskrivningar är protokollsvenska och ibland trettio tecken för
 * långa för en stapeletikett: "Upprätthållande av kylkedjan och uppfyllande av
 * temperaturkriterier" och "Material i kontakt med livsmedel (FCM)". Fyra
 * artiklar skrev därför egna etiketter till samma kod, och en punkt hette två
 * saker beroende på vilken artikel man läste. Kortnamnet står här, en gång.
 *
 * Bara koder vi faktiskt skriver om. Saknas koden används källans beskrivning,
 * vilket är rätt: en punkt ingen artikel nämner ska heta det källan kallar den.
 */
export const KORTNAMN: Record<string, string> = {
  A01: 'Godkännande och registrering',
  B01: 'Allmänna krav och skyldigheter',
  B02: 'Obligatorisk livsmedelsinformation',
  B99: 'Övrig livsmedelsinformation',
  H01: 'Spårbarhet',
  J01: 'Allmänna krav på livsmedelssäkerhet',
  J02: 'Utformning och underhåll av lokaler',
  J03: 'Hygien före, under och efter processen',
  J04: 'Personlig hygien',
  J05: 'Utbildning i hygien och arbetsmetoder',
  J06: 'Bekämpning av skadedjur',
  J07: 'Vattenförsörjning',
  J08: 'Kylkedja och temperatur',
  J09: 'Material i kontakt med livsmedel',
  K01: 'Faroanalys och kritiska styrpunkter',
  K02: 'Mikrobiologiska kriterier',
  K05: 'Främmande ämnen',
  K06: 'Allergena kriterier',
};

/** Punktens namn i en etikett: kortnamnet om vi har ett, annars källans. */
export function kortnamn(p: Punkt): string {
  return KORTNAMN[p.kod] ?? p.namn;
}

const RAKNEORD = [
  'ett',
  'två',
  'tre',
  'fyra',
  'fem',
  'sex',
  'sju',
  'åtta',
  'nio',
  'tio',
  'elva',
  'tolv',
];

/**
 * Antal i ord, för löptext: "de nio hygienpunkterna", "tre av tolv kommuner".
 *
 * Svensk sättningssed skriver små tal i ord i brödtext, och "de 9
 * hygienpunkterna" mitt i en mening läser som ett stavfel. Diagrammens
 * underlag och faktarutor behåller siffrorna: där är talet uppgiften.
 *
 * Över tolv blir det siffror igen. De tal artiklarna räknar i ord är antalet
 * kommuner och antalet punkter i ett område, och båda ligger under gränsen.
 */
export function antalOrd(n: number): string {
  return RAKNEORD[n - 1] ?? tal(n);
}

const ORDNINGSTAL = [
  'första',
  'andra',
  'tredje',
  'fjärde',
  'femte',
  'sjätte',
  'sjunde',
  'åttonde',
  'nionde',
  'tionde',
];

/**
 * Ordningstal i ord, för meningar som "faroanalysen på femte plats".
 *
 * Skrivs ut i ord upp till tionde och som "12:e" därefter, eftersom de listor
 * artiklarna placerar en punkt i är tio eller nio poster långa.
 */
export function ordningstal(n: number, versal = false): string {
  const ord = ORDNINGSTAL[n - 1] ?? `${n}:e`;
  return versal ? ord.charAt(0).toUpperCase() + ord.slice(1) : ord;
}

/**
 * Punktens plats i en lista, räknat från ett.
 *
 * Kastar om punkten inte finns i listan, av samma skäl som `punkt()` kastar:
 * meningen runt omkring säger "femte plats" och får inte tyst bli "nollte".
 */
export function plats(kod: string, lista: Punkt[]): number {
  const i = lista.findIndex((p) => p.kod === kod);
  if (i < 0) {
    throw new Error(
      `Punkten ${kod} finns inte i listan den skulle placeras i. ` +
        `Listan innehåller: ${lista.map((p) => p.kod).join(', ')}`,
    );
  }
  return i + 1;
}

/** Punkterna i fallande andel avvikelser, alltså den ordning diagrammen har. */
function iAndelsordning(punkter: Punkt[]): Punkt[] {
  return [...punkter].sort(
    (a, b) => b.avvikelse / b.granskad - a.avvikelse / a.granskad,
  );
}

/**
 * Gränsen för när en punkts andel alls går att läsa.
 *
 * Står här och inte i artiklarna, eftersom den både styr urvalet och skrivs ut
 * i diagrammens underlag. Flyttas den ska båda följa med.
 */
export const STOR_PUNKT_GRANS = 1000;

/**
 * Punkter som granskats tillräckligt ofta för att en andel ska betyda något.
 *
 * Gränsen är tusen granskningar och den är inte godtycklig: under den ligger
 * punkter som D09 med två granskningar och en avvikelse, alltså 100 procent,
 * och de skulle lägga sig överst i varje topplista. Fjorton punkter klarar
 * gränsen och de bär 91 procent av alla avvikelser.
 */
export function storaPunkter(minGranskad = STOR_PUNKT_GRANS): Punkt[] {
  return iAndelsordning(punktBas().punkter.filter((p) => p.granskad >= minGranskad));
}

/**
 * Gränsen för när en punkt inom ett område alls ritas som stapel.
 *
 * Lägre än STOR_PUNKT_GRANS, eftersom ett område kan sakna punkter som når
 * tusen granskningar: under K ligger K01 på 4 678 och de tre övriga på mellan
 * 53 och 261. Under femtio blir stapeln en tillfällighet, K04 är fem
 * granskningar och noll avvikelser.
 */
export const OMRADES_PUNKT_GRANS = 50;

/**
 * Punkterna i ett lagstiftningsområde, alltså de som delar begynnelsebokstav.
 *
 * Bokstaven och inte fältet `group`: källans grupptext är inte normaliserad
 * mellan kommunerna, och J03 ligger under "Hygien före, under och efter
 * processen" medan J04 ligger under "Grundförutsättningar, hygien". Bokstaven
 * är Livsmedelsverkets egen indelning och den håller.
 */
export function punkterI(bokstav: string, minGranskad = 0): Punkt[] {
  return iAndelsordning(
    punktBas().punkter.filter(
      (p) => p.kod.startsWith(bokstav) && p.granskad >= minGranskad,
    ),
  );
}

/**
 * De nio hygienpunkterna J01 till J09, i fallande andel avvikelser.
 *
 * J10 och J99 är källans restposter, "övriga grundförutsättningar", och hör
 * inte till de nio numrerade punkterna en artikel räknar upp.
 */
export function hygienpunkter(): Punkt[] {
  return iAndelsordning(punktBas().punkter.filter((p) => /^J0[1-9]$/.test(p.kod)));
}

/** Alla avvikelser i basen, nämnaren till "20,4 procent av allt som noteras". */
export function avvikelserTotalt(): number {
  return punktBas().punkter.reduce((n, p) => n + p.avvikelse, 0);
}

/** Färdiga andelsrader ur en lista punkter. Första raden skriver ut enheterna. */
export function andelsrader(punkter: Punkt[]): Stapelrad[] {
  return punkter.map((p, i) => andelsrad(p.kod, undefined, i === 0));
}

/**
 * Ensamrader ur en handplockad lista koder, i fallande andel.
 *
 * Sorteringen sker här och inte i artikeln, av samma skäl som i
 * `kvarstodsfakta`: meningen bredvid diagrammet säger vilken punkt som ligger
 * överst och vilken som ligger underst.
 */
export function ensamrader(koder: string[]): Stapelrad[] {
  return koder
    .map((kod) => punkt(kod))
    .sort((a, b) => b.ensam / b.avvikelse - a.ensam / a.avvikelse)
    .map((p, i) => ensamrad(p.kod, undefined, i === 0));
}

/** Övrigarader ur en handplockad lista koder, i fallande genomsnitt. */
export function ovrigarader(koder: string[]): Parrad[] {
  return [...koder]
    .sort((a, b) => ovrigaVid(b) - ovrigaVid(a))
    .map((kod) => ovrigarad(kod));
}

// ---------------------------------------------------------------------------
// Lagstiftningsområden
// ---------------------------------------------------------------------------

export interface Omrade {
  bokstav: string;
  granskad: number;
  avvikelse: number;
  kvarstod: number;
}

/**
 * Ett helt lagstiftningsområde, alltså summan av punkterna under bokstaven.
 *
 * Summeras ur punkterna och inte ur en egen genomgång, så att området och dess
 * punkter aldrig kan säga olika saker: hygienen är 6 493 avvikelser av 56 261
 * granskningar, och J03 är 2 001 av dem.
 */
export function omrade(bokstav: string): Omrade {
  const punkter = punktBas().punkter.filter((p) => p.kod.startsWith(bokstav));
  return {
    bokstav,
    granskad: punkter.reduce((n, p) => n + p.granskad, 0),
    avvikelse: punkter.reduce((n, p) => n + p.avvikelse, 0),
    kvarstod: punkter.reduce((n, p) => n + p.kvarstod, 0),
  };
}

/**
 * Områdena som stapelrader, i fallande andel.
 *
 * Etiketterna kommer utifrån eftersom de är artikelns språk och inte källans:
 * "Livsmedelsinformation och märkning" är begripligare än "B".
 */
export function omradesrader(par: [string, string][]): Stapelrad[] {
  return par
    .map(([bokstav, label]) => ({ o: omrade(bokstav), label }))
    .sort((a, b) => b.o.avvikelse / b.o.granskad - a.o.avvikelse / a.o.granskad)
    .map(({ o, label }, i) => ({
      label,
      value: andelTal(o.avvikelse, o.granskad),
      display: andel(o.avvikelse, o.granskad),
      note: i === 0
        ? `${tal(o.avvikelse)} avvikelser av ${tal(o.granskad)} granskningar`
        : `${tal(o.avvikelse)} av ${tal(o.granskad)}`,
    }));
}

// ---------------------------------------------------------------------------
// Punkten jämförd med sig själv och med en annan punkt
// ---------------------------------------------------------------------------

/**
 * Punkten ställd mot sig själv i en annan fråga: hur många ANDRA avvikelser
 * protokollet bar, när punkten brast och när den inte gjorde det.
 *
 * Två serier i samma rad eftersom talet ensamt inte säger något. Att en
 * utbildningsavvikelse följs av 2,03 andra avvikelser betyder ingenting förrän
 * det står bredvid de 0,54 som gäller när punkten var utan anmärkning.
 */
export function ovrigarad(kod: string, label?: string): Parrad {
  const p = punkt(kod);
  return {
    label: label ?? kortnamn(p),
    a: ovrigaVid(kod),
    b: ovrigaUtan(kod),
    aDisplay: tvaDecimaler(ovrigaVid(kod)),
    bDisplay: tvaDecimaler(ovrigaUtan(kod)),
    note: `${tal(p.ovrigaNarAntal)} mot ${tal(p.ovrigaUtanAntal)} kontroller`,
  };
}

export interface Beroende {
  /** Kontroller där BÅDA punkterna granskades. Den enda jämförbara mängden. */
  granskade: number;
  vidGranskad: number;
  vidAvvikelse: number;
  utanGranskad: number;
  utanAvvikelse: number;
}

/**
 * Punkten uppdelad efter hur en ANNAN punkt bedömdes vid samma kontroll.
 *
 * Räknas per kontroll och inte per granskad rad, eftersom frågan gäller vad som
 * stod i samma protokoll. Bara kontroller där båda punkterna granskades räknas:
 * en kontroll som aldrig tittade på lokalen kan varken bekräfta eller motsäga
 * sambandet, och att lägga den i nämnaren hade spätt ut båda högarna.
 */
export function beroende(kod: string, villkor: string): Beroende {
  const ut: Beroende = {
    granskade: 0,
    vidGranskad: 0,
    vidAvvikelse: 0,
    utanGranskad: 0,
    utanAvvikelse: 0,
  };

  for (const kontroll of rader()) {
    const egna = kontroll.omraden.filter((o) => o.code === kod);
    const villkorsrader = kontroll.omraden.filter((o) => o.code === villkor);
    if (egna.length === 0 || villkorsrader.length === 0) continue;

    ut.granskade += 1;
    const brast = egna.some((o) => AVVIKANDE.has(o.status));
    if (villkorsrader.some((o) => AVVIKANDE.has(o.status))) {
      ut.vidGranskad += 1;
      if (brast) ut.vidAvvikelse += 1;
    } else {
      ut.utanGranskad += 1;
      if (brast) ut.utanAvvikelse += 1;
    }
  }

  return ut;
}

/** Samma beroende som en rad i en Parstapel. */
export function beroenderad(kod: string, villkor: string, label?: string): Parrad {
  const b = beroende(kod, villkor);
  return {
    label: label ?? kortnamn(punkt(kod)),
    a: andelTal(b.vidAvvikelse, b.vidGranskad),
    b: andelTal(b.utanAvvikelse, b.utanGranskad),
    aDisplay: andel(b.vidAvvikelse, b.vidGranskad),
    bDisplay: andel(b.utanAvvikelse, b.utanGranskad),
    note:
      `${tal(b.vidAvvikelse)} av ${tal(b.vidGranskad)} mot ` +
      `${tal(b.utanAvvikelse)} av ${tal(b.utanGranskad)}`,
  };
}

// ---------------------------------------------------------------------------
// Punkten per kategori
// ---------------------------------------------------------------------------

export interface Kategoridel {
  id: TopCategoryId;
  label: string;
  granskad: number;
  avvikelse: number;
}

/**
 * Kategorins namn i en stapeletikett.
 *
 * "Övrigt" heter så i gränssnittet, där den står som filterknapp bredvid de
 * andra. I en stapel bland fyra kategorinamn läser den i stället som en
 * restpost utan innehåll, och raden gäller tillverkare, grossister och lager.
 */
function kategorinamn(id: TopCategoryId): string {
  const c = TOP_CATEGORIES.find((k) => k.id === id);
  if (!c) return id;
  return id === 'ovrigt' ? 'Övriga verksamheter' : c.name;
}

/**
 * Punkten uppdelad på verksamhetskategori, i fallande andel.
 *
 * Verksamheter vars kategori inte går att avgöra räknas inte. De är få, 114 av
 * 11 399 granskningar av J03, men de hör inte hemma i någon stapel och skulle
 * som egen rad bara säga något om källans typvärden.
 */
export function kategorier(kod: string): Kategoridel[] {
  const stat = new Map<TopCategoryId, Kategoridel>();

  for (const kontroll of rader()) {
    if (!kontroll.kategori) continue;
    const id = kontroll.kategori;
    for (const område of kontroll.omraden) {
      if (område.code !== kod) continue;
      const rad = stat.get(id) ?? {
        id,
        label: kategorinamn(id),
        granskad: 0,
        avvikelse: 0,
      };
      rad.granskad += 1;
      if (AVVIKANDE.has(område.status)) rad.avvikelse += 1;
      stat.set(id, rad);
    }
  }

  return [...stat.values()].sort(
    (a, b) => b.avvikelse / b.granskad - a.avvikelse / a.granskad,
  );
}

/** En enskild kategori, till en mening som jämför två av dem i löptext. */
export function kategoridel(kod: string, id: TopCategoryId): Kategoridel {
  const träff = kategorier(kod).find((k) => k.id === id);
  if (!träff) {
    throw new Error(`Kategorin ${id} har inga granskningar av punkten ${kod}.`);
  }
  return träff;
}

/** En kategoris andel som färdig text, till en jämförelse i löptext. */
export function kategoriandel(kod: string, id: TopCategoryId): string {
  const k = kategoridel(kod, id);
  return andel(k.avvikelse, k.granskad);
}

/** Kategorierna som stapelrader. */
export function kategoriradar(kod: string): Stapelrad[] {
  return kategorier(kod).map((k, i) => ({
    label: k.label,
    value: andelTal(k.avvikelse, k.granskad),
    display: andel(k.avvikelse, k.granskad),
    note: i === 0
      ? `${tal(k.avvikelse)} avvikelser av ${tal(k.granskad)} granskningar`
      : `${tal(k.avvikelse)} av ${tal(k.granskad)}`,
  }));
}

/**
 * Två punkter jämförda kategori för kategori.
 *
 * Ordningen följer den första punkten, så att den andra seriens avvikelser från
 * mönstret syns som just avvikelser. Skolköken är den enda kategori där
 * utbildningspunkten faller oftare än den personliga hygienen, och det ska gå
 * att se på en sekund.
 */
export function kategoripar(kodA: string, kodB: string): Parrad[] {
  const b = new Map(kategorier(kodB).map((k) => [k.id, k]));
  return kategorier(kodA).map((a) => {
    const motpart = b.get(a.id);
    return {
      label: a.label,
      a: andelTal(a.avvikelse, a.granskad),
      b: motpart ? andelTal(motpart.avvikelse, motpart.granskad) : 0,
      aDisplay: andel(a.avvikelse, a.granskad),
      bDisplay: motpart ? andel(motpart.avvikelse, motpart.granskad) : '0,0 %',
      note: motpart
        ? `${tal(a.avvikelse)} av ${tal(a.granskad)} respektive ` +
          `${tal(motpart.avvikelse)} av ${tal(motpart.granskad)}`
        : `${tal(a.avvikelse)} av ${tal(a.granskad)}`,
    };
  });
}

/** Underlagsmening till ett kategoridiagram, med det bortfall den bär. */
export function kategorimening(kod: string): string {
  const p = punkt(kod);
  const med = kategorier(kod).reduce((n, k) => n + k.granskad, 0);
  return (
    `${tal(med)} av de ${tal(p.granskad)} granskningarna av punkten, ` +
    'alltså de där verksamhetens kategori går att avgöra.'
  );
}

// ---------------------------------------------------------------------------
// Punkten över tid
// ---------------------------------------------------------------------------

export interface Arpunkt {
  label: string;
  value: number;
  display: string;
  granskad: number;
  avvikelse: number;
}

export interface Arserie {
  punkter: Arpunkt[];
  /** Skalans botten och tak, satta ur serien med två procentenheters luft. */
  min: number;
  max: number;
  lagst: Arpunkt;
  hogst: Arpunkt;
}

/**
 * Punkten år för år.
 *
 * Innevarande år utelämnas, av samma skäl som `inspectionsPerYear` i
 * rapporter.ts utelämnar det: ett år som pågår ritar alltid en brant nedgång i
 * seriens sista steg. FIRST_YEAR kommer också därifrån, så att artikelns kurva
 * och rapportsidornas kurvor börjar på samma år.
 *
 * Skalan sätts ur serien och inte i artikeln. Med fast tak på 21 procent hade
 * ett år som stiger över det ritats utanför rutan utan att något klagade.
 */
export function arserie(kod: string): Arserie {
  const sista = lastCompleteYear();
  const stat = new Map<string, { granskad: number; avvikelse: number }>();

  for (const kontroll of rader()) {
    const ar = Number(kontroll.ar);
    if (ar < FIRST_YEAR || ar > sista) continue;
    for (const område of kontroll.omraden) {
      if (område.code !== kod) continue;
      const rad = stat.get(kontroll.ar) ?? { granskad: 0, avvikelse: 0 };
      rad.granskad += 1;
      if (AVVIKANDE.has(område.status)) rad.avvikelse += 1;
      stat.set(kontroll.ar, rad);
    }
  }

  const punkter: Arpunkt[] = [...stat.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ar, v]) => ({
      label: ar,
      value: andelTal(v.avvikelse, v.granskad),
      display: andel(v.avvikelse, v.granskad).replace(' %', ''),
      granskad: v.granskad,
      avvikelse: v.avvikelse,
    }));

  const efterVarde = [...punkter].sort((a, b) => a.value - b.value);
  const lagst = efterVarde[0];
  const hogst = efterVarde[efterVarde.length - 1];

  return {
    punkter,
    min: Math.max(0, Math.floor(lagst.value - 2)),
    max: Math.ceil(hogst.value + 2),
    lagst,
    hogst,
  };
}

// ---------------------------------------------------------------------------
// Punkten per verksamhet
// ---------------------------------------------------------------------------

export interface Aterkomst {
  /** Verksamheter där punkten granskades minst en gång. */
  granskade: number;
  /** Av dem: verksamheter som fick minst en avvikelse på punkten. */
  medAvvikelse: number;
  /** Av dem: verksamheter som fick den mer än en gång. */
  flerGanger: number;
  /** Verksamheter där punkten granskades minst tre gånger. */
  minstTre: number;
  /** Av dem: verksamheter som fick avvikelse vid minst två tillfällen. */
  minstTvaAvvikelser: number;
}

/**
 * Hur ofta samma verksamhet får samma punkt igen.
 *
 * Måttet kräver en nämnare som inte är kontroller utan ställen, och det är hela
 * poängen: att 697 avvikelser på faroanalysen fördelar sig på 455 verksamheter
 * betyder något helt annat än att de fördelar sig på 697.
 *
 * Gränsen tre granskningar finns för att ett ställe som besökts en gång varken
 * kan bekräfta eller motsäga att punkten återkommer.
 */
export function aterkommande(kod: string): Aterkomst {
  const per = new Map<string, { granskad: number; avvikelse: number }>();

  for (const kontroll of rader()) {
    for (const område of kontroll.omraden) {
      if (område.code !== kod) continue;
      const rad = per.get(kontroll.verksamhet) ?? { granskad: 0, avvikelse: 0 };
      rad.granskad += 1;
      if (AVVIKANDE.has(område.status)) rad.avvikelse += 1;
      per.set(kontroll.verksamhet, rad);
    }
  }

  const alla = [...per.values()];
  const minstTre = alla.filter((v) => v.granskad >= 3);
  return {
    granskade: alla.length,
    medAvvikelse: alla.filter((v) => v.avvikelse > 0).length,
    flerGanger: alla.filter((v) => v.avvikelse > 1).length,
    minstTre: minstTre.length,
    minstTvaAvvikelser: minstTre.filter((v) => v.avvikelse >= 2).length,
  };
}
