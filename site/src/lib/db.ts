/**
 * Datakälla.
 *
 * All läsning går genom den här modulen — aldrig direkt från en sidmall och
 * aldrig mot en namngiven fil. Kommuner upptäcks automatiskt: lägg en ny
 * datafil i `src/data/` och den finns på sajten. Ingen kod ska behöva ändras
 * för att lägga till en kommun.
 *
 * Källan är i dag filer som pipelinen skriver. Nästa steg är Supabase, och
 * bytet sker enbart här: signaturerna utåt är redan asynkrona och
 * kommunagnostiska, så sidmallarna påverkas inte.
 *
 * Se pipeline/schema.sql för måltabellerna.
 */

export type Verdict = 'clean' | 'minor' | 'major';
export type MissingReason = 'no_inspections' | 'stale_inspections';
export type AreaStatus = 'ok' | 'fixed' | 'deviation' | 'persisting';

export interface ControlArea {
  /** Livsmedelsverkets rapporteringspunkt, t.ex. "J03". */
  code: string;
  /** Övergripande område, t.ex. "Grundförutsättningar, hygien". */
  group: string;
  /** Vad punkten avser. */
  description: string;
  status: AreaStatus;
}

export interface Inspection {
  id: string;
  /** ISO-datum. En kontroll hör till ett datum, inte till en sekund. */
  date: string;
  /** 0 = inga anmärkningar, 1 = mindre, 2 = allvarliga. */
  assessment: 0 | 1 | 2;
  /** 0 = rutin, 1 = uppföljning, 2 = händelsestyrd. */
  type: 0 | 1 | 2;
  prenotified: boolean | null;
  audit: boolean;
  onSite: boolean;
  areas: ControlArea[];
  /**
   * Verksamhetens replikrätt, publicerad ORDAGRANT.
   *
   * Sidfoten och metodiksidan lovar att svaren publiceras oredigerade, och
   * det löftet hålls i tre steg. Verksamheten skriver i schemat `community`,
   * där en trigger fryser texten så att ingen kan ändra den efter
   * insändning. Redaktionen väljer sedan mellan att publicera ordagrant och
   * att avslå; någon ändra-väg finns inte. Först vid publicering skrivs
   * texten till `inspections.owner_comment` och följer med exporten hit.
   *
   * Att fältet är satt betyder alltså att en människa släppt fram exakt de
   * tecknen. Se pipeline/schema_community.sql och pipeline/moderate.py.
   */
  ownerComment?: string | null;
}

export interface StreetImage {
  /**
   * VÅR kopia av bilden, i vår egen objektlagring.
   *
   * Aldrig källans egen adress. Mapillarys miniatyr-URL:er är signerade och har
   * en utgångstid, så en sådan här ger en bild som slutar visas en tid efter
   * bygget utan att något klagar. Pipelinen laddar ned bytesen och lägger dem i
   * Cloudflare R2. Se pipeline/prikko/imagery.py.
   */
  url: string;
  /** Bildens id hos källan, för länken tillbaka dit. */
  id: string;
  /** ISO-datum, YYYY-MM-DD, eller null. */
  capturedAt: string | null;
  /**
   * Var bilden kommer ifrån. Styr attributionen, som skiljer sig åt: Mapillarys
   * villkor kräver deras logotyp och en länk, inte bara en textrad.
   */
  source?: 'mapillary' | 'panoramax' | 'owner' | 'own' | 'wikimedia';
  /** SPDX-beteckning, t.ex. "CC-BY-SA-4.0". */
  licence?: string | null;
  /** Färdig attributionstext, t.ex. "Mapillary, CC BY-SA 4.0". */
  attribution?: string | null;
}

export type SourceType =
  | 'open_data'          // kommunen publicerar en öppen datamängd
  | 'reverse_engineered' // vi anropar samma gränssnitt som kommunens egen tjänst
  | 'scrape'
  | 'foi_request';

export interface Municipality {
  code: string;
  /** Formellt namn: "Stockholms stad". */
  name: string;
  /** Orten i grundform: "Stockholm". Härled aldrig ur `name`. */
  city: string;
  slug: string;
  sourceType?: SourceType;
}

export interface Establishment {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  types: string[];
  lat: number | null;
  lng: number | null;
  /**
   * Satt bara när koordinaten är HÄRLEDD ur adressen i stället för publicerad
   * av kommunen. Uppsala och Örebro lämnar inga koordinater; deras nålar är
   * geokodade mot OpenStreetMap. Saknas fältet kommer punkten från källan.
   */
  geoSource?: 'osm';
  /** 'address' = adressens egen punkt. 'approximate' = grannporten. */
  geoPrecision?: 'address' | 'approximate';
  image: StreetImage | null;
  verdict: Verdict | null;
  distinction: boolean;
  reason: string;
  modelVersion: number;
  uncertain: boolean;
  inspections: Inspection[];
  /** Fylls i av lagret, så anropare alltid vet vilken kommun posten hör till. */
  municipality: Municipality;
}

interface Dataset {
  municipality: Municipality;
  source: { url: string; fetchedAt: string };
  establishments: Omit<Establishment, 'municipality'>[];
}

/**
 * Kommuner upptäcks från filsystemet — ingen lista i kod. `eager` krävs
 * eftersom Astro behöver datan synkront vid bygget.
 */
const files = import.meta.glob<{ default: Dataset }>('../data/*.json', {
  eager: true,
});

const datasets: Dataset[] = Object.values(files)
  .map((m) => m.default as unknown as Dataset)
  .filter((d) => d && d.municipality && Array.isArray(d.establishments))
  .sort((a, b) => a.municipality.city.localeCompare(b.municipality.city, 'sv'));

/** Alla kommuner vi har data för, i bokstavsordning. */
export function municipalities(): Municipality[] {
  return datasets.map((d) => d.municipality);
}

export function municipality(slug: string): Municipality | undefined {
  return datasets.find((d) => d.municipality.slug === slug)?.municipality;
}

export function sourceFor(slug: string) {
  return datasets.find((d) => d.municipality.slug === slug)?.source;
}

function withMunicipality(d: Dataset): Establishment[] {
  return d.establishments.map((e) => ({ ...e, municipality: d.municipality }));
}

/**
 * Färdiga listor per kommun, plus rikslistan under nyckeln ''.
 *
 * Utan minnet byggdes listan om vid VARJE anrop, och anropen är inte få:
 * sidfoten och sökrutan ligger i baslayouten och frågar efter varje kommun på
 * varje sida. Med 14 950 sidor blev det närmare en miljard objektkopior per
 * bygge och ungefär två tredjedelar av byggtiden.
 *
 * Datan är oföränderlig under ett bygg. Filerna läses in en gång via
 * import.meta.glob, så en delad instans är säker. Villkoret är att ingen
 * anropare sorterar eller muterar listan hon får tillbaka. Alla anropare
 * filtrerar eller kopierar först (se municipalityListing), och nya måste göra
 * detsamma: sortera aldrig direkt på det establishments() returnerar.
 */
const listCache = new Map<string, Establishment[]>();

/** Alla verksamheter i landet, eller i en kommun om slug anges. */
export function establishments(slug?: string): Establishment[] {
  const key = slug ?? '';
  const cached = listCache.get(key);
  if (cached) return cached;

  const wanted = slug ? datasets.filter((d) => d.municipality.slug === slug) : datasets;
  const built = wanted.flatMap(withMunicipality);
  listCache.set(key, built);
  return built;
}

export function findEstablishment(
  slug: string,
  establishmentSlug: string,
): Establishment | undefined {
  return establishments(slug).find((e) => e.slug === establishmentSlug);
}

/** Sammanlagd täckning. Används på startsida och källsida. */
export function coverage() {
  const all = establishments();
  return {
    municipalities: datasets.length,
    establishments: all.length,
    inspections: all.reduce((n, e) => n + e.inspections.length, 0),
    assessed: all.filter((e) => e.verdict !== null).length,
  };
}
