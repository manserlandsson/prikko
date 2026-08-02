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
}

export interface StreetImage {
  url: string;
  id: string;
  capturedAt: string | null;
}

export interface Municipality {
  code: string;
  /** Formellt namn: "Stockholms stad". */
  name: string;
  /** Orten i grundform: "Stockholm". Härled aldrig ur `name`. */
  city: string;
  slug: string;
}

export interface Establishment {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  types: string[];
  lat: number | null;
  lng: number | null;
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

/** Alla verksamheter i landet, eller i en kommun om slug anges. */
export function establishments(slug?: string): Establishment[] {
  const wanted = slug ? datasets.filter((d) => d.municipality.slug === slug) : datasets;
  return wanted.flatMap(withMunicipality);
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
