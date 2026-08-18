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

import type { Hours } from './oppettider';
import type { Contact } from './kontakt';

export type { Hours };

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
  /**
   * Bildens id hos källan, för länken tillbaka dit.
   *
   * För `wikimedia` är det filens namn på Commons, "Den Gyldene Freden
   * 2013a.jpg", och det är den strängen filsidans adress byggs av. Se
   * Commonsbild.astro.
   */
  id: string;
  /**
   * ISO-datum, YYYY-MM-DD, eller null.
   *
   * Null är vanligt för `wikimedia`: Commons datumfält är fritext och står i
   * former som "2009", "1959-09" och "mellan 1912 och 1920". Bara ett fullt
   * datum skrivs hit, för `images.captured_at` är en `date`. ÅRTALET som visas
   * under bilden kommer därför inte härifrån utan ur `attribution`, se nedan.
   */
  capturedAt: string | null;
  /**
   * Var bilden kommer ifrån. Styr attributionen, som skiljer sig åt: Mapillarys
   * villkor kräver deras logotyp och en länk, inte bara en textrad, medan en
   * Commons-bild kräver fotografens namn, licensnamnet och en länk till
   * filsidan. Fältet är alltså inte en upplysning utan det som avgör vilken
   * komponent som får rita bilden.
   */
  source?: 'mapillary' | 'panoramax' | 'owner' | 'own' | 'wikimedia';
  /**
   * SPDX-beteckning, t.ex. "CC-BY-SA-4.0". För `wikimedia` läst ur Commons
   * eget maskinvärde `extmetadata.License` och aldrig ur texten för
   * människor. "PD" betyder public domain, som inte är en licens.
   */
  licence?: string | null;
  /**
   * Färdig attributionstext, t.ex. "Mapillary, CC BY-SA 4.0" eller
   * "Foto: Holger.Ellgaard, 2013".
   *
   * Byggd i pipelinen och skriven ut ordagrant av mallen. Attributionen är ett
   * licensvillkor, och den ska följa bilden genom databasen i stället för att
   * sättas ihop på nytt av varje mall som råkar visa den.
   */
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
  geoSource?: 'osm' | 'lantmateriet';
  /** 'address' = adressens egen punkt. 'approximate' = grannporten. */
  geoPrecision?: 'address' | 'approximate';
  /**
   * Öppettider ur OpenStreetMap, satt bara när pipelinen kunde para ihop
   * verksamheten med ett OSM-objekt på BÅDE namn och närhet. Uppgiften är
   * alltså aldrig kommunens, och den är inte heller vanlig: se
   * docs/33_oppettider.md för täckningen per kommun.
   *
   * Fältet är valfritt och ska förbli valfritt. Sajten visar öppettider där
   * de finns och ingenting alls där de saknas. Se lib/oppettider.ts.
   */
  hours?: Hours;
  /**
   * Telefon, webbplats, e-post och egenskaper ur SAMMA OSM-uttag som `hours`,
   * och satt på samma villkor: verksamheten måste vara hopparad med ett
   * OSM-objekt på BÅDE namn och närhet.
   *
   * Fältet står på FLER verksamheter än `hours`, inte färre. Öppettiden
   * kräver dessutom att OSM-objektet bär en `opening_hours` som vi kan tolka
   * helt; kontakten kräver bara hopparningen. 3 274 av 9 995 konsumentvända
   * mot 2 747. Se docs/37_osm_taggar.md.
   *
   * Valfritt, och ska förbli valfritt. Sajten visar uppgiften där den finns
   * och ingenting alls där den saknas. Se lib/kontakt.ts.
   */
  contact?: Contact;
  /**
   * Närmaste hållplats, packad som "Stadshuset|bus|80": namn, trafikslag och
   * avstånd FÅGELVÄGEN i hela tiotal meter. Namnet kan vara tomt.
   *
   * En sträng och inte ett objekt, av samma skäl som veckoschemat i `hours`
   * är en rad: datafilerna skrivs med indent=1, och tre nycklar gånger nio
   * tusen verksamheter hade lagt 27 000 rader i site/src/data. Uppackningen
   * är en `split` i lib/narhet.ts.
   *
   * Valfritt, och ska förbli valfritt. Sajten visar raden där den finns och
   * ingenting alls där den saknas. Se docs/38_ta_mig_hit.md.
   */
  stop?: string;
  /** Parkeringar inom 200 m, packat som "3|40": antal och avstånd till den närmaste. */
  parking?: string;
  image: StreetImage | null;
  verdict: Verdict | null;
  distinction: boolean;
  reason: string;
  modelVersion: number;
  uncertain: boolean;
  inspections: Inspection[];
  /** Fylls i av lagret, så anropare alltid vet vilken kommun posten hör till. */
  municipality: Municipality;
  /**
   * Datumet OSM-uttaget bakom `stop` och `parking` hämtades, ISO.
   *
   * Fylls i av lagret ur filens `narhet`-block och står ALDRIG på raden i
   * datafilen. Det är samma datum för hela uttaget, och nio tusen kopior av
   * det hade varit nio tusen rader utan innehåll. Att `hours.checkedAt` och
   * `contact.checkedAt` upprepas per verksamhet är ett arv och inte en
   * förebild.
   */
  narhetCheckedAt?: string;
}

interface Dataset {
  municipality: Municipality;
  source: { url: string; fetchedAt: string };
  /** Skrivs av pipeline/narhet.py, bara när filen faktiskt bär en sådan uppgift. */
  narhet?: { checkedAt: string };
  establishments: Omit<Establishment, 'municipality' | 'narhetCheckedAt'>[];
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
  return d.establishments.map((e) => ({
    ...e,
    municipality: d.municipality,
    narhetCheckedAt: d.narhet?.checkedAt,
  }));
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
