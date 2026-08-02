/**
 * Domänlogik och presentation ovanpå datakällan.
 *
 * `db.ts` vet var datan kommer ifrån. Den här modulen vet vad den betyder:
 * etiketter, färger, härledd statistik och kvalitetsgrinden. Sidmallarna
 * pratar bara med den här nivån.
 */
import {
  coverage,
  establishments,
  findEstablishment,
  municipalities,
  municipality,
  sourceFor,
  type AreaStatus,
  type ControlArea,
  type Establishment,
  type Inspection,
  type MissingReason,
  type Municipality,
  type StreetImage,
  type Verdict,
} from './db';

export {
  coverage,
  establishments,
  findEstablishment,
  municipalities,
  municipality,
  sourceFor,
};
export type {
  AreaStatus,
  ControlArea,
  Establishment,
  Inspection,
  MissingReason,
  Municipality,
  StreetImage,
  Verdict,
};

// ---------------------------------------------------------------------------
// Kvalitetsgrind
// ---------------------------------------------------------------------------

/**
 * En sida får bara indexeras när den bär faktisk information. Annars drar de
 * tunna sidorna ner hela domänen vid Googles bedömning av skalat innehåll
 * (bibeln §6) — och med tiotusentals sidor är det en reell risk.
 */
export function isIndexable(e: Establishment): boolean {
  return e.verdict !== null && e.inspections.length > 0;
}

export function missingReason(e: Establishment): MissingReason {
  return e.reason === 'stale_inspections' ? 'stale_inspections' : 'no_inspections';
}

/** Senaste kontrollens datum, eller null. Driver "senast uppdaterad". */
export function latestInspectionDate(e: Establishment): string | null {
  return e.inspections[0]?.date ?? null;
}

// ---------------------------------------------------------------------------
// Kontrollområden
// ---------------------------------------------------------------------------

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

/** Etikett för en ENSKILD kontroll i historiken, inte för helhetsbedömningen. */
export const ASSESSMENT_LABEL: Record<Inspection['assessment'], string> = {
  0: 'Inga anmärkningar',
  1: 'Avvikelse',
  2: 'Kvarstående avvikelse',
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

/**
 * Livsmedelsverkets lagstiftningsområden, kodade med bokstaven i
 * rapporteringspunkten. Källa: Linköpings egen läsanvisning. Används för att
 * förklara vad en avvikelse handlar om — koden "J03" säger inget för en
 * besökare.
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
  return LEGISLATION_AREAS[(code || '').charAt(0).toUpperCase()];
}

// ---------------------------------------------------------------------------
// Härledd statistik och närhet
// ---------------------------------------------------------------------------

export interface Stats {
  total: number;
  clean: number;
  cleanShare: number;
  followUps: number;
  firstYear: string | null;
}

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
 * Närmaste verksamheter inom samma kommun. Ger besökaren ett alternativ när
 * stället hen tittar på har brister, och binder samman den interna
 * länkgrafen mellan restaurangsidor — inte bara uppåt till kommunhubben.
 */
export function nearby(
  e: Establishment,
  limit = 4,
): Array<Establishment & { metres: number }> {
  if (e.lat === null || e.lng === null) return [];
  return establishments(e.municipality.slug)
    .filter((o) => o.id !== e.id && o.lat !== null && o.lng !== null && o.verdict !== null)
    .map((o) => ({ ...o, metres: Math.round(distance(e.lat!, e.lng!, o.lat!, o.lng!)) }))
    .sort((a, b) => a.metres - b.metres)
    .slice(0, limit);
}

export function formatDistance(metres: number): string {
  return metres < 1000 ? `${metres} m` : `${(metres / 1000).toFixed(1)} km`;
}

// ---------------------------------------------------------------------------
// Formatering
// ---------------------------------------------------------------------------

const MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
];

/** Svenskt datum i löptext: "19 mars 2026". */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Tusentalsavgränsat tal: "8 511". */
export function formatNumber(n: number): string {
  return n.toLocaleString('sv-SE');
}

// ---------------------------------------------------------------------------
// Återkommande brister
// ---------------------------------------------------------------------------

export interface RecurringIssue {
  /** Vad bristen gäller, med kommunens egna ord. */
  description: string;
  group: string;
  code: string;
  /** Hur många kontroller den noterats vid. */
  count: number;
  /** Datum för de kontroller där den noterats, nyast först. */
  dates: string[];
  /** Kvarstod den vid senaste kontrollen den noterades? */
  latestPersisting: boolean;
}

/**
 * Brister som noterats vid mer än en kontroll.
 *
 * Det här är sidans egentliga insikt. En enskild avvikelse säger lite — alla
 * får en emellanåt. Att samma kylkedja underkänts fyra gånger på två år säger
 * något helt annat, och det syns inte om man bara läser kontrollerna var för
 * sig. Vi har datan för hela historiken; utan den här sammanställningen
 * visades bara den senaste kontrollen.
 */
export function recurringIssues(e: Establishment, minCount = 2): RecurringIssue[] {
  const seen = new Map<string, RecurringIssue>();

  for (const inspection of e.inspections) {
    for (const area of inspection.areas) {
      if (!isRemark(area)) continue;
      // Nyckeln är beskrivningen: koden saknas i Stockholms data, och samma
      // brist ska räknas som samma oavsett vilken kommun den kommer från.
      const key = (area.description || area.group).toLowerCase();
      if (!key) continue;

      const existing = seen.get(key);
      if (existing) {
        existing.count += 1;
        existing.dates.push(inspection.date);
      } else {
        seen.set(key, {
          description: area.description || area.group,
          group: area.group,
          code: area.code,
          count: 1,
          dates: [inspection.date],
          // Inspektionerna är sorterade nyast först, så första förekomsten
          // är den senaste.
          latestPersisting: area.status === 'persisting',
        });
      }
    }
  }

  return [...seen.values()]
    .filter((i) => i.count >= minCount)
    .sort((a, b) => b.count - a.count || b.dates[0].localeCompare(a.dates[0]));
}

/** Avvikelser vid en enskild kontroll. */
export function deviations(inspection: Inspection): ControlArea[] {
  return inspection.areas.filter(isRemark);
}

// ---------------------------------------------------------------------------
// Kommunens sammanräkning
// ---------------------------------------------------------------------------

export interface MunicipalitySummary extends Municipality {
  /** Alla verksamheter i kommunens register. */
  total: number;
  clean: number;
  minor: number;
  major: number;
  /**
   * Verksamheter utan bedömning. De är inte rena — de är okända, och måste
   * hållas isär från `clean` överallt där ett tal visas.
   */
  unassessed: number;
  /** clean + minor + major. */
  assessed: number;
  /**
   * Andel utan anmärkningar, räknad på BEDÖMDA och aldrig på totalen. Med
   * totalen som nämnare hade en kommun som lämnar ut lite data sett sämre ut
   * än en som lämnar ut mycket, vilket är precis fel signal.
   */
  cleanShare: number;
  /** Kommunens senaste kontroll, eller null om ingen har något datum. */
  latest: string | null;
}

/**
 * Kommunens siffror i den form startsidan och kommunkortet visar dem.
 *
 * Låg tidigare inline i två sidmallar med var sin definition av "bedömd", och
 * de hann glida isär. Den här är den enda. Ett enda svep över beståndet:
 * Stockholm är 8 500 poster och funktionen anropas för varje kommun på
 * startsidan.
 */
export function municipalitySummary(input: string | Municipality): MunicipalitySummary {
  const m = typeof input === 'string' ? municipality(input) : input;
  if (!m) throw new Error(`Okänd kommun: ${input as string}`);

  let clean = 0;
  let minor = 0;
  let major = 0;
  let latest: string | null = null;

  const all = establishments(m.slug);
  for (const e of all) {
    if (e.verdict === 'clean') clean += 1;
    else if (e.verdict === 'minor') minor += 1;
    else if (e.verdict === 'major') major += 1;

    const date = latestInspectionDate(e);
    if (date && (latest === null || date > latest)) latest = date;
  }

  const assessed = clean + minor + major;

  return {
    ...m,
    total: all.length,
    clean,
    minor,
    major,
    unassessed: all.length - assessed,
    assessed,
    cleanShare: assessed ? Math.round((clean / assessed) * 100) : 0,
    latest,
  };
}

/** Alla kommuner sammanräknade, i `municipalities()`-ordning (bokstavsordning). */
export function municipalitySummaries(): MunicipalitySummary[] {
  return municipalities().map(municipalitySummary);
}

// ---------------------------------------------------------------------------
// Kommunhubbens ordning
// ---------------------------------------------------------------------------

/**
 * Kommunens verksamheter i den ordning hubben listar dem: bokstavsordning.
 *
 * Ordningen MÅSTE vara oberoende av bedömningen. Hubben är sidindelad, och
 * med bedömningen som primär sorteringsnyckel hade en enda ändrad kontroll i
 * kommunen skjutit hundratals verksamheter mellan sidor vid varje
 * datauppdatering. Då pekar varje extern länk till /stockholm/sida/12 på
 * något annat än förra veckan, och Google får en katalog som aldrig står
 * still. Bokstavsordning ändras bara när beståndet ändras.
 *
 * Det som avviker har en egen sida — /[kommun]/anmarkningar — och den är
 * enligt SEO-dimensioneringen den som faktiskt söks. Hubben får vara det den
 * är bäst på: ett fullständigt, förutsägbart register.
 *
 * Slug som sista nyckel gör sorteringen total: två verksamheter kan heta
 * likadant, och `localeCompare` returnerar då 0. Utan tiebreak avgörs
 * ordningen av datafilens ordning, som pipelinen inte lovar något om.
 */
export function municipalityListing(slug: string): Establishment[] {
  return [...establishments(slug)].sort(
    (a, b) => a.name.localeCompare(b.name, 'sv') || a.slug.localeCompare(b.slug, 'sv'),
  );
}

export interface RemarkedEstablishment extends Establishment {
  /** Antal avvikelser vid den senaste kontrollen. */
  remarks: number;
}

/**
 * Verksamheter med anmärkning vid senaste kontrollen, i listans ordning.
 *
 * Allvarligast först, sedan flest avvikelser, sedan senast kontrollerad.
 * Här FÅR bedömningen styra ordningen — det är hela sidans poäng, och listan
 * är kort nog att en förskjutning inte flyttar någon långt. Slug sist gör
 * sorteringen total, så att två poster med samma nivå, samma antal
 * avvikelser och samma datum inte byter plats mellan bygg.
 */
export function municipalityRemarks(slug: string): RemarkedEstablishment[] {
  const severity = { major: 0, minor: 1, clean: 2 } as const;
  return establishments(slug)
    .filter((e) => e.verdict !== null && e.verdict !== 'clean')
    .map((e) => ({ ...e, remarks: e.inspections[0]?.areas.filter(isRemark).length ?? 0 }))
    .sort(
      (a, b) =>
        severity[a.verdict!] - severity[b.verdict!] ||
        b.remarks - a.remarks ||
        (latestInspectionDate(b) ?? '').localeCompare(latestInspectionDate(a) ?? '') ||
        a.slug.localeCompare(b.slug, 'sv'),
    );
}

// ---------------------------------------------------------------------------
// Kommunens läge
// ---------------------------------------------------------------------------

export interface MunicipalityPoint {
  slug: string;
  city: string;
  lat: number;
  lng: number;
}

/** Medianen — inte medelvärdet. En enda felkodad koordinat i Bottenhavet
 *  hade flyttat medelvärdet, medianen rör den sig inte av. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * En punkt per kommun, härledd ur verksamheternas koordinater.
 *
 * Används av platsväljaren för att svara på "vilken kommun är närmast mig".
 * Vi hittar INTE på koordinater: kommuner vars datakälla saknar koordinater
 * (i dag Uppsala och Örebro) utelämnas ur listan och kan alltså inte träffas
 * av platsknappen. De finns kvar i väljarens lista och går att välja för
 * hand. När pipelinen börjar leverera koordinater för dem försvinner luckan
 * av sig själv — eller när datafilens `municipality` får egna lat/lng, som
 * läses först här nedan.
 */
export function municipalityPoints(): MunicipalityPoint[] {
  const points: MunicipalityPoint[] = [];

  for (const m of municipalities()) {
    const declared = m as Municipality & { lat?: number; lng?: number };
    if (typeof declared.lat === 'number' && typeof declared.lng === 'number') {
      points.push({ slug: m.slug, city: m.city, lat: declared.lat, lng: declared.lng });
      continue;
    }

    const lats: number[] = [];
    const lngs: number[] = [];
    for (const e of establishments(m.slug)) {
      if (e.lat !== null && e.lng !== null) {
        lats.push(e.lat);
        lngs.push(e.lng);
      }
    }
    if (lats.length) {
      points.push({ slug: m.slug, city: m.city, lat: median(lats), lng: median(lngs) });
    }
  }

  return points;
}
