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
 * "Brister som kvarstår" säger exakt det vi kan bevisa: bristerna var inte
 * en engångsnotering. Sant, verifierbart, och mer användbart för besökaren
 * än en gradering, eftersom det säger något om verksamhetens vilja att rätta
 * till och inte bara om ett ögonblick.
 *
 * ETIKETTEN bär de tre grunderna lika bra; MENINGEN gör det inte. Här stod
 * fram till 2026-09-05 att kommunen "kom tillbaka, och det var inte
 * åtgärdat", och det var en beskrivning av EN av tre grunder. På 130 av 403
 * sidor finns inget återbesök alls, bara en upprepning från kontrollen före.
 * Etiketten står därför kvar oförändrad, och meningen väljs numera per sida
 * ur grunden. Se MAJOR_SENTENCE i lib/omdome.ts, där talen står.
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
    /*
     * RESERVTEXT, och bara det. Den riktiga meningen väljs per sida ur
     * grunden i lib/omdome.ts, eftersom en fast mening om en uppföljning var
     * falsk på 130 av 403 sidor. Den här står bara om en sida med `major`
     * saknar kontroller helt, vilket bedömningen inte tillåter, och är
     * därför skriven som det mildaste sanna påståendet.
     */
    sentence: 'fick anmärkningar vid den senaste hygienkontrollen',
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
      'har ingen hygienkontroll de senaste fem åren, så nuläget går inte att bedöma',
    colorVar: 'var(--verdict-none-ink)',
    glyph: '–',
  },
};

/**
 * ══ NOTEN OM EN VERKSAMHET SOM INTE LÄNGRE ÄR REGISTRERAD ═════════════════
 *
 * Orden står här och ingen annanstans, av samma skäl som VERDICT gör det:
 * noten skrivs på fem ytor, verksamhetssidan, kommunhubbens lista,
 * startsidans kort, sökningen och kartan, och fem formuleringar av samma
 * besked är fem påståenden som kan glida isär.
 *
 * ── VAD NOTEN FÅR SÄGA, OCH VAD DEN ALDRIG FÅR SÄGA ──────────────────────
 *
 * Underlaget är kommunens EGET registreringsintyg, uppslaget på vårt eget
 * anläggnings-id, se pipeline/prikko/stockholmsintyg.py. Intyget svarar
 * `Status: Aktiv`, `Inaktiv` eller `Upphörd/Skrotad`. Det är alltså kommunens
 * besked om sin egen registrering, och det är precis det noten återger.
 *
 * Den säger DÄRFÖR INTE att stället har stängt. Vi vet inte det, och en
 * avregistrering har minst tre andra förklaringar: ägarbyte där den nya
 * ägaren registrerat sig som en ny anläggning, flytt, eller en post staden
 * städat. Att skriva "stängt" hade varit att gissa i stället för att
 * rapportera, vilket är själva skiljelinjen i docs/35 §5.1.
 *
 * Den säger inte heller något om hygienen. Kontrollerna på sidan är allmänna
 * handlingar om en period som faktiskt inträffade, och de dras inte tillbaka.
 * De dateras.
 *
 * ── `Inaktiv` OCH `Upphörd/Skrotad` SÄGER SAMMA SAK HÄR ──────────────────
 *
 * Skillnaden mellan de två värdena bärs inte vidare till sajten, och det är
 * ett beslut och inte en förlust. Tre skäl:
 *
 *   1. För läsaren är frågan EN: står stället kvar i kommunens register?
 *      Båda värdena svarar nej. "Skrotad" är stadens ord om en POST i ett
 *      diarium, inte om ett ställe på en gata.
 *   2. Pipelinen drog redan den slutsatsen, och skälet är läst av en
 *      människa: alla tre `Upphörd/Skrotad` bär ordet "Upphörd" redan i
 *      verksamhetens namn. Se `STATUS` i pipeline/prikko/stockholmsintyg.py.
 *   3. Tre rader av trettio är en formulering nästan ingen möter, och varje
 *      extra formulering är ännu en mening som måste hållas sann.
 *
 * ── MÄRKET ÄR NOTENS EGEN RUBRIK ─────────────────────────────────────────
 *
 * `mark` är ordagrant `heading`. Det är avsiktligt: docs/35 §5.1 kräver samma
 * markering i listor, sök och karta, annars är noten "en fälla man bara ser
 * om man klickar in". Två snarlika formuleringar hade varit två markeringar.
 */
export const AVREGISTRERAD = {
  /** Notens rubrik, och märket i listor, sök och karta. */
  heading: 'Inte längre registrerad',
  /**
   * Första meningen. Kommunens formella namn sätts in, alltså "Stockholms
   * stad" och aldrig "Stockholm": det är ett myndighetsbesked och ska bära
   * myndighetens namn.
   */
  sentence: (kommun: string) =>
    `${kommun} anger att verksamheten inte längre är registrerad som livsmedelsverksamhet.`,
  /** Förbehållet. Står alltid, eftersom det är det läsaren annars gissar. */
  caveat:
    'Registret säger inte om stället har stängt, bytt ägare eller registrerats på nytt.',
  /**
   * Bara på sidor som faktiskt HAR en kontroll under sig. Fem av de trettio
   * har noll kontroller, och "Kontrollerna nedan" om ingenting är en mening
   * som pekar på tomrum.
   */
  history: 'Kontrollerna nedan gäller tiden då verksamheten var registrerad.',
} as const;

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
