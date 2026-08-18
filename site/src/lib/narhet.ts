/**
 * Närhet: hållplatsen och parkeringarna omkring en verksamhet.
 *
 * Uppgiften kommer ur OpenStreetMap och räknas ut av pipeline/narhet.py. Den
 * här modulen vet vad talen betyder och ingenting om var de kommer ifrån.
 *
 * TRE SAKER STYR ALLT ANNAT HÄR
 * -----------------------------
 *
 * 1. TALEN ÄR FÅGELVÄGEN, OCH DET ORDET MÅSTE SYNAS. Åttio meter fågelvägen
 *    kan vara fyrahundra runt ett kvarter, över ett spår eller längs en kaj.
 *    Vi räknar inte gångavstånd; se docs/38_ta_mig_hit.md §3 för vad en
 *    ruttmotor över hela Sverige hade kostat och varför den inte gick. Alltså
 *    står förbehållet i klartext under raderna, och det är inte en detalj som
 *    får trimmas bort för att raden blir kortare utan den.
 *
 * 2. INGEN TÄCKNINGSTRÖSKEL STYR VAD SOM VISAS. Har vi hållplatsen för tio
 *    ställen av tiotusen visas den för de tio. Saknas den står ingenting alls,
 *    aldrig en rad som säger att vi inte vet. Samma dom som kontaktuppgifterna
 *    fick i docs/37, och av samma skäl: en VISNING har ingen nedsida, medan
 *    ett FILTER döljer.
 *
 *    Följden är att den här modulen aldrig får en `filtreraPaHallplats`. Ett
 *    filter på gångavstånd till buss hade dolt de sextio procent vi inget vet
 *    om, och ingen hade sett att de försvann. Se docs/33 §7.
 *
 * 3. NOLL SKRIVS ALDRIG UT. "0 parkeringar inom 200 m" är ett påstående om
 *    att det inte finns några, och det vi vet är bara att OpenStreetMap inte
 *    har kartlagt några. Pipelinen skriver därför inget fält alls i det läget,
 *    och den här modulen returnerar null.
 */

/** Trafikslag vi kan namnge. Pipelinen skriver aldrig något annat. */
export type Trafikslag = 'bus' | 'tram' | 'train' | 'subway' | 'ferry';

export interface Hallplats {
  /** Hållplatsens namn, eller null när OSM inte har något. */
  namn: string | null;
  slag: Trafikslag;
  /** Fågelvägen, i hela tiotal meter. */
  meter: number;
}

export interface Parkeringar {
  /** Antal parkeringar inom radien. Alltid minst 1; se punkt 3 ovan. */
  antal: number;
  /** Fågelvägen till den närmaste, i hela tiotal meter. */
  narmast: number;
}

/**
 * Radien parkeringarna räknades inom, i meter. Speglar PARKING_RADIUS_M i
 * pipeline/prikko/narhet.py.
 *
 * Talet står HÄR som en konstant och skrivs inte ut i varje datafil, av samma
 * skäl som datumet inte gör det: det är samma tal för hela beståndet, och en
 * kopia per verksamhet är nio tusen rader som inte säger något nytt. Ändras
 * radien i pipelinen ska den ändras här, och då ändras texten på alla sidor
 * samtidigt i stället för att halva beståndet bär det gamla talet.
 */
export const PARKERINGSRADIE_M = 200;

/**
 * De fem trafikslagen i ord.
 *
 * Substantiv och inte adjektiv: "Busshållplats" och inte "Buss". Raden läses
 * ensam, utan rubrik ovanför, och "Buss Stadshuset, 80 m" säger inte vad det
 * är för sorts sak som ligger åttio meter bort.
 */
const SLAGORD: Record<Trafikslag, string> = {
  bus: 'Busshållplats',
  tram: 'Spårvagnshållplats',
  train: 'Tågstation',
  subway: 'Tunnelbanestation',
  ferry: 'Färjeläge',
};

const SLAG = new Set<string>(Object.keys(SLAGORD));

/**
 * Packa upp `stop` ur datafilen: "Stadshuset|bus|80".
 *
 * Formen är en sträng och inte ett objekt för att datafilerna skrivs med
 * indent=1: varje nyckel kostar en RAD per verksamhet, och nio tusen
 * verksamheter gånger fem nycklar hade lagt 45 000 rader i site/src/data.
 * Samma dom som veckoschemat fick i docs/33 §8.
 *
 * Returnerar null på allt som inte går att läsa HELT. En halvläst rad är
 * precis den sortens fel som blir osynligt för läsaren.
 */
export function packaUppHallplats(raw: string | undefined): Hallplats | null {
  if (!raw) return null;
  const delar = raw.split('|');
  if (delar.length !== 3) return null;
  const [namn, slag, meter] = delar;
  if (!SLAG.has(slag)) return null;
  const m = Number(meter);
  if (!Number.isFinite(m) || m <= 0) return null;
  return { namn: namn.trim() || null, slag: slag as Trafikslag, meter: m };
}

/** Packa upp `parking` ur datafilen: "3|40". */
export function packaUppParkeringar(raw: string | undefined): Parkeringar | null {
  if (!raw) return null;
  const delar = raw.split('|');
  if (delar.length !== 2) return null;
  const antal = Number(delar[0]);
  const narmast = Number(delar[1]);
  if (!Number.isInteger(antal) || antal < 1) return null;
  if (!Number.isFinite(narmast) || narmast <= 0) return null;
  return { antal, narmast };
}

/**
 * Avståndet i ord.
 *
 * Under tusen meter skrivs metern rakt av. Över det blir "1 200 m" ett tal
 * man måste räkna om i huvudet, så det blir kilometer med en decimal. Radien
 * i pipelinen är i dag 500 meter, alltså går den grenen inte att nå med
 * dagens data; den finns för att radien är en konstant någon kan ändra, och
 * en formaterare som bara råkar fungera för dagens värden är en fälla.
 */
export function avstandIOrd(meter: number): string {
  if (meter < 1000) return `${meter} m`;
  return `${(meter / 1000).toLocaleString('sv-SE', { maximumFractionDigits: 1 })} km`;
}

/**
 * Hållplatsraden i ord: "Busshållplats Stadshuset" eller bara
 * "Busshållplats" när OSM inte har något namn.
 *
 * En namnlös hållplats är fortfarande en hållplats och avståndet till den är
 * lika sant, så raden visas ändå. Att hitta på ett namn ur gatan intill hade
 * varit en gissning som läsaren inte kan avslöja.
 */
export function hallplatsIOrd(hallplats: Hallplats): string {
  const ord = SLAGORD[hallplats.slag];
  return hallplats.namn ? `${ord} ${hallplats.namn}` : ord;
}

/**
 * Parkeringsraden i ord: "3 parkeringar inom 200 m".
 *
 * ANTALET PARKERINGAR OCH ALDRIG ANTALET PLATSER. `capacity` finns på 9,2
 * procent av parkeringarna i uttaget, och en summa över dem hade sett
 * fullständig ut utan att vara det. Se pipeline/prikko/narhet.py.
 */
export function parkeringarIOrd(parkeringar: Parkeringar): string {
  const ord = parkeringar.antal === 1 ? 'parkering' : 'parkeringar';
  return `${parkeringar.antal} ${ord} inom ${PARKERINGSRADIE_M} m`;
}
