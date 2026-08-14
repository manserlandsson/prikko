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
import { establishments } from './data';

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
}

export interface PunktBas {
  /** Kontroller totalt i punktkommunerna. */
  kontroller: number;
  /** Kommunernas namn i bokstavsordning, till meningen som anger basen. */
  kommuner: string[];
  /** Punkterna i fallande antal avvikelser. */
  punkter: Punkt[];
}

const AVVIKANDE = new Set(['deviation', 'persisting']);

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

  for (const e of establishments()) {
    for (const kontroll of e.inspections) {
      /*
       * Publicerar kommunen punktnivå? Avgörs på raden, inte på en lista i
       * koden. En källa som börjar publicera hela punkten kommer med av sig
       * själv, och en som slutar faller ur utan att någon måste minnas det.
       */
      const punktnivå = kontroll.areas.some((a) => a.code.length > 1);
      if (!punktnivå) continue;

      kontroller += 1;
      kommuner.add(e.municipality.city);

      const avvikandeKoder: string[] = [];

      for (const område of kontroll.areas) {
        const rad = stat.get(område.code) ?? {
          kod: område.code,
          namn: område.description,
          granskad: 0,
          avvikelse: 0,
          kvarstod: 0,
          ensam: 0,
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
    }
  }

  cache = {
    kontroller,
    kommuner: [...kommuner].sort((a, b) => a.localeCompare(b, 'sv')),
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
