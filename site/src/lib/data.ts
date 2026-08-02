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

export interface Inspection {
  id: string;
  /** ISO-datum. Kontroller hör till ett datum, inte till en sekund. */
  date: string;
  /** 0 = inga anmärkningar, 1 = mindre, 2 = allvarliga (Sambruk `assessment`). */
  assessment: 0 | 1 | 2;
  /** 0 = rutin, 1 = uppföljning, 2 = händelsestyrd. */
  type: 0 | 1 | 2;
  prenotified: boolean | null;
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
