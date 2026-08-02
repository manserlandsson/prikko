/**
 * Dataåtkomst.
 *
 * All läsning går genom den här modulen — aldrig direkt från en sidmall.
 * Skälet står i ADR 0001: när sidantalet växer byter vi från statiskt bygge
 * till hybridrendering på edge, och då ska bara den här filen behöva ändras.
 *
 * Just nu läses en fil som pipelinen skriver. Nästa steg är Supabase, med
 * samma signaturer utåt.
 */
import raw from '../data/linkoping.json';
import type { MissingReason, Verdict } from './site';

/** Utfall per granskat kontrollområde. */
export type AreaStatus = 'ok' | 'fixed' | 'deviation' | 'persisting';

export interface ControlArea {
  /** Livsmedelsverkets rapporteringspunkt, t.ex. "J03". */
  code: string;
  /** Övergripande område, t.ex. "Grundförutsättningar, hygien". */
  group: string;
  /** Vad punkten avser, t.ex. "Hygien före, under och efter processen". */
  description: string;
  status: AreaStatus;
}

export interface Inspection {
  id: string;
  /** ISO-datum. Kontroller hör till ett datum, inte till en sekund. */
  date: string;
  /** 0 = inga anmärkningar, 1 = mindre, 2 = allvarliga (Sambruk `assessment`). */
  assessment: 0 | 1 | 2;
  /** 0 = rutin, 1 = uppföljning, 2 = händelsestyrd. */
  type: 0 | 1 | 2;
  prenotified: boolean | null;
  audit: boolean;
  onSite: boolean;
  areas: ControlArea[];
}

/** Områden som räknas som brist. "Åtgärdad" och "Avskriven" gör det inte. */
export const REMARK_STATUSES: AreaStatus[] = ['deviation', 'persisting'];

export function isRemark(area: ControlArea): boolean {
  return REMARK_STATUSES.includes(area.status);
}

export const AREA_STATUS_LABEL: Record<AreaStatus, string> = {
  ok: 'Utan avvikelse',
  fixed: 'Åtgärdad',
  deviation: 'Avvikelse',
  persisting: 'Kvarstår',
};

/** Ytfärg — prickar och ikonbakgrunder. */
export const AREA_STATUS_COLOR: Record<AreaStatus, string> = {
  ok: 'var(--verdict-clean)',
  fixed: 'var(--verdict-clean)',
  deviation: 'var(--verdict-minor)',
  persisting: 'var(--verdict-major)',
};

/** Textfärg — måste vara den mörkare varianten för att vara läsbar. */
export const AREA_STATUS_INK: Record<AreaStatus, string> = {
  ok: 'var(--verdict-clean-ink)',
  fixed: 'var(--verdict-clean-ink)',
  deviation: 'var(--verdict-minor-ink)',
  persisting: 'var(--verdict-major-ink)',
};

/**
 * Livsmedelsverkets lagstiftningsområden, kodade med bokstaven i
 * rapporteringspunkten. Källa: Linköpings egen läsanvisning i Livsmedelskollen.
 * Används för att förklara vad en avvikelse faktiskt handlar om — koden "J03"
 * säger ingenting för en besökare.
 */
export const LEGISLATION_AREAS: Record<string, { name: string; explanation: string }> = {
  A: { name: 'Administrativa krav', explanation: 'Godkännande och registrering av verksamheten.' },
  B: { name: 'Allmän livsmedelsinformation', explanation: 'Information som gäller de flesta livsmedel, till exempel innehållsförteckning.' },
  C: { name: 'Särskild märkning', explanation: 'Krav för till exempel Nyckelhålet, kosttillskott och glutenfritt.' },
  D: { name: 'Skyddade beteckningar', explanation: 'Ursprungs- och geografiska beteckningar.' },
  E: { name: 'Handelsnormer', explanation: 'Regler för fiskeri- och jordbruksprodukter.' },
  F: { name: 'Varustandarder', explanation: 'Bestämmelser för till exempel sylt och juice.' },
  G: { name: 'Särskilda grupper', explanation: 'Spädbarnsmat och livsmedel för medicinska ändamål.' },
  H: { name: 'Spårbarhet', explanation: 'Att det går att spåra varifrån kött, ägg och andra råvaror kommer.' },
  I: { name: 'Ingredienser', explanation: 'Tillsatser, aromer och berikning.' },
  J: { name: 'Hygien', explanation: 'Allmänna hygienkrav: lokaler, personlig hygien, kylkedja, skadedjur och rengöring.' },
  K: { name: 'HACCP', explanation: 'Verksamhetens faroanalys och mikrobiologiska kriterier.' },
  L: { name: 'Egenkontroller', explanation: 'Krav på företagarens egna kontroller.' },
  M: { name: 'Import och export', explanation: 'Handel inom EU och import från länder utanför EU.' },
  N: { name: 'Dricksvatten', explanation: 'Kontroll vid dricksvattenanläggningar.' },
  O: { name: 'Övrigt', explanation: 'Lagkrav som inte ryms i övriga områden.' },
  P: { name: 'Operativa mål', explanation: 'Nationellt prioriterade kontrollpunkter, till exempel allergener och spårbarhet.' },
  Q: { name: 'Kontaktmaterial', explanation: 'Material som är avsedda att komma i kontakt med livsmedel.' },
};

export function legislationArea(code: string) {
  return LEGISLATION_AREAS[code.charAt(0).toUpperCase()];
}

export interface Establishment {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  types: string[];
  lat: number | null;
  lng: number | null;
  verdict: Verdict | null;
  distinction: boolean;
  reason: string;
  modelVersion: number;
  /** Bedömningen vilar på en tolkning vi inte bekräftat med kommunen. */
  uncertain: boolean;
  inspections: Inspection[];
}

export interface Municipality {
  code: string;
  /** Formellt namn: "Linköpings kommun". */
  name: string;
  /** Orten i grundform: "Linköping". Härled aldrig ur `name`. */
  city: string;
  slug: string;
}

const dataset = raw as unknown as {
  municipality: Municipality;
  source: { url: string; fetchedAt: string };
  establishments: Establishment[];
};

export const MUNICIPALITY = dataset.municipality;
export const SOURCE = dataset.source;

export function allEstablishments(): Establishment[] {
  return dataset.establishments;
}

/**
 * Kvalitetsgrinden. En sida får bara indexeras när den bär faktisk
 * information — annars drar de tunna sidorna ner hela domänen vid Googles
 * bedömning av skalat innehåll (bibeln §6).
 */
export function isIndexable(e: Establishment): boolean {
  return e.verdict !== null && e.inspections.length > 0;
}

export function findEstablishment(slug: string): Establishment | undefined {
  return dataset.establishments.find((e) => e.slug === slug);
}

export function missingReason(e: Establishment): MissingReason {
  return e.reason === 'stale_inspections' ? 'stale_inspections' : 'no_inspections';
}

/** Senaste kontrollens datum, eller null. Driver "senast uppdaterad". */
export function latestInspectionDate(e: Establishment): string | null {
  return e.inspections[0]?.date ?? null;
}

// ---------------------------------------------------------------------------
// Presentation av enskilda kontroller
// ---------------------------------------------------------------------------

export const ASSESSMENT_LABEL: Record<Inspection['assessment'], string> = {
  0: 'Inga anmärkningar',
  1: 'Mindre brister',
  2: 'Allvarliga brister',
};

export const ASSESSMENT_COLOR: Record<Inspection['assessment'], string> = {
  0: 'var(--verdict-clean)',
  1: 'var(--verdict-minor)',
  2: 'var(--verdict-major)',
};

export const ASSESSMENT_INK: Record<Inspection['assessment'], string> = {
  0: 'var(--verdict-clean-ink)',
  1: 'var(--verdict-minor-ink)',
  2: 'var(--verdict-major-ink)',
};

export const INSPECTION_TYPE_LABEL: Record<Inspection['type'], string> = {
  0: 'Planerad kontroll',
  1: 'Återbesök',
  2: 'Händelsestyrd kontroll',
};

const MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
];

/** Svenskt datum i löptext: "19 mars 2026". */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// ---------------------------------------------------------------------------
// Härledd statistik och närliggande verksamheter
// ---------------------------------------------------------------------------

export interface Stats {
  total: number;
  clean: number;
  cleanShare: number;
  followUps: number;
  firstYear: string | null;
}

/** Sammanfattar hela kontrollhistoriken. Visas som faktarutor. */
export function statistics(e: Establishment): Stats {
  const total = e.inspections.length;
  const clean = e.inspections.filter((i) => i.assessment === 0).length;
  const followUps = e.inspections.filter((i) => i.type === 1).length;
  const oldest = e.inspections[e.inspections.length - 1];
  return {
    total,
    clean,
    cleanShare: total ? Math.round((clean / total) * 100) : 0,
    followUps,
    firstYear: oldest ? oldest.date.slice(0, 4) : null,
  };
}

/** Avstånd i meter mellan två WGS84-punkter (haversine). */
function distance(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Närmaste verksamheter. Ger besökaren ett alternativ när stället hen tittar
 * på har brister, och binder samman den interna länkgrafen mellan
 * restaurangsidor — inte bara uppåt till kommunhubben.
 */
export function nearby(e: Establishment, limit = 4): Array<Establishment & { metres: number }> {
  if (e.lat === null || e.lng === null) return [];
  return dataset.establishments
    .filter((o) => o.id !== e.id && o.lat !== null && o.lng !== null && o.verdict !== null)
    .map((o) => ({ ...o, metres: Math.round(distance(e.lat!, e.lng!, o.lat!, o.lng!)) }))
    .sort((a, b) => a.metres - b.metres)
    .slice(0, limit);
}

export function formatDistance(metres: number): string {
  return metres < 1000 ? `${metres} m` : `${(metres / 1000).toFixed(1)} km`;
}
