/**
 * Central sanning för sajtens identitet och bedömningsskala.
 *
 * Varför här: AEO-forskningen (bibeln §6b) visar 28–40 % fler AI-citeringar
 * vid konsistent entitetsdata. Namn och formuleringar får aldrig varieras
 * ad hoc i mallarna.
 */

export const SITE = {
  name: 'Prikko',
  legalName: 'Prikko',
  url: 'https://prikko.se',
  locale: 'sv_SE',
  lang: 'sv',
  description:
    'Prikko samlar kommunernas offentliga livsmedelskontroller och visar hur varje restaurang klarade sin senaste hygienkontroll — med karta, kontrollhistorik och verksamhetens svar.',
  themeColor: '#007BE0',
} as const;

/**
 * Bedömningsnivåer.
 *
 * Etiketterna beskriver vad som HÄNT, inte hur allvarligt vi tycker att det
 * är. Tidigare stod det "Allvarliga brister" — men ingen kommun använder det
 * ordet. Linköping skriver "Kvarstår" och "Ej godtagbar", Stockholm skriver
 * ingenting alls. Att gradera allvar var alltså vårt eget påstående att
 * försvara, och det riskerade dessutom att låta som råttor och salmonella när
 * det i praktiken kan gälla en oåtgärdad allergenmärkning.
 *
 * "Brister som kvarstår" säger exakt det vi kan bevisa: kommunen påpekade
 * något, kom tillbaka, och det var inte åtgärdat. Sant, verifierbart, och
 * mer användbart för besökaren än en gradering — det säger något om
 * verksamhetens vilja att rätta till, inte bara om ett ögonblick.
 *
 * Speglar källdatans tre steg ett till ett
 * (Sambruk `assessment` 0/1/2). Se pipeline/prikko/grading.py för varför det
 * inte är en bokstavsskala: en femgradig skala hade krävt precision som datan
 * inte innehåller, och A–E krockar med de svenska skolbetygen där E är
 * lägsta godkända.
 */
export const VERDICTS = ['clean', 'minor', 'major'] as const;
export type Verdict = (typeof VERDICTS)[number];

/** `null` = otillräckligt underlag. Aldrig detsamma som en dålig bedömning. */
export type VerdictOrNone = Verdict | null;

/** Varför en bedömning saknas. Besökaren har rätt att veta vilket fall det är. */
export type MissingReason = 'no_inspections' | 'stale_inspections';

interface VerdictPresentation {
  /** Kort etikett — används i chip, kort och kartnål. */
  label: string;
  /** Fullständig mening som leder sidan. Skriven för att kunna citeras rakt av
   *  av AI-svar, därför alltid självbärande. */
  sentence: string;
  colorVar: string;
  /** Symbol i stället för bokstav: språkoberoende och funkar i en kartnål. */
  glyph: string;
}

export const VERDICT: Record<Verdict, VerdictPresentation> = {
  clean: {
    label: 'Inga anmärkningar',
    sentence: 'fick inga anmärkningar vid den senaste hygienkontrollen',
    colorVar: 'var(--verdict-clean-ink)',
    glyph: '✓',
  },
  minor: {
    label: 'Brister',
    sentence: 'fick anmärkningar vid den senaste hygienkontrollen',
    colorVar: 'var(--verdict-minor-ink)',
    glyph: '!',
  },
  major: {
    label: 'Brister som kvarstår',
    sentence: 'har brister som inte åtgärdats vid kommunens uppföljning',
    colorVar: 'var(--verdict-major-ink)',
    glyph: '✕',
  },
};

export const MISSING: Record<MissingReason, VerdictPresentation> = {
  no_inspections: {
    label: 'Ingen kontroll',
    sentence: 'har ingen registrerad hygienkontroll hos kommunen',
    colorVar: 'var(--verdict-none-ink)',
    glyph: '–',
  },
  stale_inspections: {
    label: 'Ingen aktuell kontroll',
    sentence:
      'har ingen hygienkontroll de senaste tre åren, så nuläget går inte att bedöma',
    colorVar: 'var(--verdict-none-ink)',
    glyph: '–',
  },
};

/**
 * Utmärkelsen för genomgående skötsamhet — vår motsvarighet till Danmarks
 * Elite-Smiley. Ges när samtliga tre senaste kontroller är utan anmärkning.
 * Den påverkar aldrig nivån, bara erkännandet.
 */
export const DISTINCTION = {
  label: 'Genomgående utan anmärkningar',
  short: 'Genomgående ren',
  colorVar: 'var(--distinction)',
} as const;
