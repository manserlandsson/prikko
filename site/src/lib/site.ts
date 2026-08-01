/**
 * Central sanning för sajtens identitet. Allt som rör NAP-konsistens,
 * entitetsnamn och kanoniska URL:er går härifrån.
 *
 * Varför: AEO-forskningen (bibeln §6b) visar 28–40 % fler AI-citeringar vid
 * konsistent entitetsdata. Namnet får aldrig varieras ad hoc i mallarna.
 */

export const SITE = {
  name: 'Prikko',
  /** Används i <title>-suffix och og:site_name */
  legalName: 'Prikko',
  url: 'https://prikko.se',
  locale: 'sv_SE',
  lang: 'sv',
  description:
    'Prikko samlar kommunernas offentliga livsmedelskontroller till ett jämförbart hygienbetyg per restaurang — med karta, kontrollhistorik och verksamhetens svar.',
  themeColor: '#007BE0',
} as const;

/** Betygsskala. Ordningen är signifikant (bäst → sämst). */
export const GRADES = ['A', 'B', 'C', 'D', 'E'] as const;
export type Grade = (typeof GRADES)[number];

/**
 * `null` = otillräckligt underlag. Detta är AVSIKTLIGT en egen sort och inte
 * ett dåligt betyg: att gissa ett betyg på tunn data är både orättvist mot
 * verksamheten och en juridisk risk. Sidor utan betyg no-indexeras.
 */
export type GradeOrNone = Grade | null;

export const GRADE_LABEL: Record<Grade, string> = {
  A: 'Mycket bra hygien',
  B: 'Bra hygien',
  C: 'Godtagbar hygien',
  D: 'Brister i hygienen',
  E: 'Allvarliga brister',
};

export const GRADE_COLOR_VAR: Record<Grade, string> = {
  A: 'var(--grade-a)',
  B: 'var(--grade-b)',
  C: 'var(--grade-c)',
  D: 'var(--grade-d)',
  E: 'var(--grade-e)',
};
