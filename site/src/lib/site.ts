/**
 * Central sanning för sajtens identitet och bedömningsskala.
 *
 * Varför här: AEO-forskningen (bibeln §6b) visar 28–40 % fler AI-citeringar
 * vid konsistent entitetsdata. Namn och formuleringar får aldrig varieras
 * ad hoc i mallarna.
 */

/**
 * Juridisk avsändare.
 *
 * UTKAST, EJ GRANSKAT AV JURIST. Uppgifterna här återges på policysidorna och
 * måste stämma exakt.
 *
 * Varför bolagsnamnet står publikt trots att ägaren först ville hålla det
 * utanför: GDPR artikel 13.1 a kräver den personuppgiftsansvariges identitet
 * och kontaktuppgifter, och 8 § lagen (2002:562) om elektronisk handel kräver
 * att tjänsteleverantören anger namn, adress, e-post, organisationsnummer och
 * momsregistreringsnummer. Ett varumärke är inte en juridisk person och kan
 * inte vara personuppgiftsansvarig. Magoed AB står därför i policyerna.
 * Prikko är varumärket överallt annars.
 *
 * ADVOKAT / ÄGARE, KONTROLLERA:
 *  1. `address` saknas. 8 § e-handelslagen kräver adress i etableringsstaten.
 *     Sidorna kan inte publiceras utan den.
 *  2. `email` finns ännu inte som brevlåda. GDPR-begäranden har en
 *     månadsfrist; adressen måste fungera innan sidorna går live.
 */
export const PUBLISHER = {
  legalName: 'Magoed AB',
  orgNumber: '559386-1015',
  vatNumber: 'SE559386101501',
  /** Brevlåda för dataskyddsärenden. MÅSTE SKAPAS innan publicering. */
  email: 'dataskydd@prikko.se',
  /** Befintlig väg för rättelse och genmäle, se /ratta. */
  correctionEmail: 'ratta@prikko.se',
  /**
   * Postadress. Utelämnad efter ägarens beslut: e-post räcker som kontaktväg.
   *
   * Det stämmer för integritetspolicyn. GDPR artikel 13 kräver "kontaktuppgifter",
   * och en e-postadress uppfyller det.
   *
   * Det stämmer INTE för villkorssidan. 8 § lagen (2002:562) om elektronisk
   * handel räknar upp adress i etableringsstaten som en egen punkt vid sidan
   * av e-post. Punkten står kvar på advokatens lista. Fylls fältet i skrivs
   * adressen ut automatiskt på båda sidorna.
   */
  address: null as string | null,
} as const;

export const SITE = {
  name: 'Prikko',
  legalName: 'Prikko',
  url: 'https://prikko.se',
  locale: 'sv_SE',
  lang: 'sv',
  description:
    'Prikko samlar kommunernas offentliga livsmedelskontroller och visar hur varje restaurang klarade sin senaste hygienkontroll, med karta, kontrollhistorik och verksamhetens svar.',
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
 * Märkningen på verksamhetssidan: de tre senaste kontrollerna utan anmärkning.
 * Den påverkar aldrig nivån, bara erkännandet.
 *
 * Det här är INTE utmärkelsen. Utmärkelsen är årsutgåvan i src/editions och
 * kräver fem kontroller i rad; se lib/utmarkelser.ts. De två hette båda
 * "utmärkelsen" fram till augusti 2026, med olika krav, och en besökare som
 * läste metodiksidan och utgåvesidan fick två svar på samma fråga.
 *
 * Konstanten heter fortfarande DISTINCTION eftersom fältet i datan gör det,
 * hela vägen från grading.py till databasen. Namnet i koden är ett annat
 * problem än namnet i texten, och det var bara det senare läsaren mötte.
 */
export const DISTINCTION = {
  label: 'Utan anmärkning vid de tre senaste kontrollerna',
  short: 'Ren historik',
  colorVar: 'var(--distinction)',
} as const;
