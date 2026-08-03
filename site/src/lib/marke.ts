/**
 * Märket. En egen ritning, inte en lånad.
 *
 * ## Varför en lagerkrans
 *
 * Lagerkransen är en generisk utmärkelseform, äldre än varumärkesrätten och
 * fri att använda. Den är också det enda som gör att en klisterlapp i ett
 * restaurangfönster omedelbart läses som "de har fått något" utan att någon
 * behöver veta vad Prikko är. Kransen här är ritad från grunden ur en
 * parametrisering, inte kalkerad från någon annans märke: bladen sitter på en
 * båge, lutningen ökar mot toppen, och formen faller ur talen nedan.
 *
 * ## Varför årtalet är det största i märket
 *
 * Ett märke i ett fönster åldras. Det tas inte ned den dagen kommunen hittar
 * en avvikelse, och verksamheten har heller ingen skyldighet att göra det.
 * Därför får märket aldrig påstå något om NULÄGET. Det påstår att verksamheten
 * fanns med i en namngiven årsutgåva, vilket är sant för alltid, och årtalet
 * är det som syns mest just för att den läsning ska vara den enda möjliga.
 *
 * Det är samma konstruktion som Michelin och Danmarks Elite-Smiley använder,
 * och den är det enda sättet vi kan låta ett märke lämna sajten utan att
 * riskera att det ljuger.
 *
 * ## Varför texten är mörk och bara kransen guld
 *
 * `--distinction` (#C8A24B) mot vitt ligger på 2,6:1 och underkänns av WCAG för
 * text. Guldet bär formen, `--text` bär orden. Bedömningsfärgerna används
 * aldrig: märket är ingen bedömningsnivå, och grönt här hade läst som "inga
 * anmärkningar vid den senaste kontrollen", vilket är något annat.
 */

export interface SealColors {
  /** Kransen och ringen. */
  wreath: string;
  /** All text. */
  ink: string;
}

/** På sajten: sajtens tokens. Se filhuvudet för varför de är olika. */
export const SEAL_ON_SITE: SealColors = {
  wreath: 'var(--distinction)',
  ink: 'var(--text)',
};

/**
 * I den nedladdningsbara filen: samma två färger som literaler.
 *
 * En fristående SVG hamnar i ett trycksaksprogram eller på en vägg och har
 * ingen sajt att ärva variabler ur. Värdena MÅSTE vara desamma som tokens.css,
 * annars är märket i fönstret en annan produkt än märket på sidan.
 */
export const SEAL_STANDALONE: SealColors = {
  wreath: '#C8A24B',
  ink: '#1D1D1F',
};

const SIZE = 200;
const C = SIZE / 2;

/** Bladbågens radie. */
const R = 74;
/** Blad per gren. Udda tal ger en spets överst på grenen. */
const LEAVES = 9;

/**
 * Grenens sträckning, i radianer, med 0 åt höger och π/2 nedåt (SVG-y).
 *
 * Kransen öppnar sig uppåt: grenen börjar nära botten och slutar innan toppen.
 * Öppningen är där årtalet får luft.
 */
const BRANCH_START = 0.5 * Math.PI;
const BRANCH_END = -0.32 * Math.PI;

/**
 * Var på grenen det första bladet sitter, som andel av dess längd.
 *
 * Stjälkarna möts i botten, men bladen får inte göra det. Med bladen ända ned
 * lade sig de två understa nästan vågrätt över varandra och bildade en fläck
 * som såg ut som en rosett i stället för som en knut.
 */
const LEAF_START = 0.12;

interface Leaf {
  x: number;
  y: number;
  rotation: number;
  rx: number;
  ry: number;
}

/**
 * Ett blad per steg längs bågen, speglat i lodlinjen.
 *
 * Bladen krymper mot toppen och lutar allt mer utåt, vilket är det som gör att
 * formen läses som en växt och inte som en punktlista på en cirkel.
 */
function branch(mirrored: boolean): Leaf[] {
  const leaves: Leaf[] = [];
  for (let i = 0; i < LEAVES; i += 1) {
    const t = i / (LEAVES - 1);
    const along = LEAF_START + t * (1 - LEAF_START);
    const angle = BRANCH_START + along * (BRANCH_END - BRANCH_START);

    // Bladet sitter en aning utanför stjälken.
    const radius = R + 5;
    const x = C + radius * Math.cos(angle) * (mirrored ? -1 : 1);
    const y = C + radius * Math.sin(angle);

    // Tangenten i grader, plus en lutning som växer mot toppen.
    const tangent = (angle * 180) / Math.PI + (mirrored ? 180 : 0);
    const tilt = (mirrored ? 1 : -1) * (26 + t * 16);

    leaves.push({
      x,
      y,
      rotation: tangent + tilt,
      rx: 10.5 - t * 2.6,
      ry: 4.4 - t * 1.1,
    });
  }
  return leaves;
}

function round(n: number): string {
  return n.toFixed(2).replace(/\.?0+$/, '');
}

/** Stjälken: en båge längs samma sträckning som bladen. */
function stem(mirrored: boolean): string {
  const sign = mirrored ? -1 : 1;
  const x1 = C + R * Math.cos(BRANCH_START) * sign;
  const y1 = C + R * Math.sin(BRANCH_START);
  const x2 = C + R * Math.cos(BRANCH_END) * sign;
  const y2 = C + R * Math.sin(BRANCH_END);
  const sweep = mirrored ? 1 : 0;
  return `M ${round(x1)} ${round(y1)} A ${R} ${R} 0 0 ${sweep} ${round(x2)} ${round(y2)}`;
}

export interface SealOptions {
  colors?: SealColors;
  /** Sätts när märket ligger i löptext och redan har en läsbar rubrik intill. */
  decorative?: boolean;
}

/**
 * Märkets innehåll, utan `<svg>`-elementet.
 *
 * Åtskilt från höljet därför att sajten och nedladdningsfilen behöver olika
 * höljen. Det ena ärver storlek ur sitt sammanhang, det andra måste ha en fast.
 * Innehållet får däremot aldrig skilja sig: ritas märket på två ställen kommer
 * de två att glida isär, och då bär två restauranger olika märken för samma sak.
 */
export function sealContent(year: number, options: SealOptions = {}): string {
  const { wreath, ink } = options.colors ?? SEAL_ON_SITE;

  const leaves = [...branch(false), ...branch(true)]
    .map(
      (l) =>
        `<ellipse cx="${round(l.x)}" cy="${round(l.y)}" rx="${round(l.rx)}" ry="${round(
          l.ry,
        )}" transform="rotate(${round(l.rotation)} ${round(l.x)} ${round(l.y)})"/>`,
    )
    .join('');

  return (
    `<g fill="${wreath}">${leaves}</g>` +
    `<g fill="none" stroke="${wreath}" stroke-width="1.6" stroke-linecap="round">` +
    `<path d="${stem(false)}"/><path d="${stem(true)}"/></g>` +
    // Fästpunkten där grenarna möts nedtill. Utan den ser kransen ut som två
    // lösa kvistar.
    `<circle cx="${C}" cy="${C + R}" r="2.8" fill="${wreath}"/>` +
    /*
     * Textblockets rader ligger där kransen är bred nog.
     *
     * "UTAN ANMÄRKNINGAR" är den längsta raden och den som sitter lägst, alltså
     * den som först skär i stjälken. Vid y=150 är stjälkens innermått ±54 och
     * raden ±50 bred. Sänks raden eller ökas teckenstorleken skär den kransen,
     * och det syns inte förrän någon tryckt märket i A5.
     */
    `<g fill="${ink}" text-anchor="middle" font-family="'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">` +
    `<text x="${C}" y="76" font-size="13" font-weight="600" letter-spacing="3.2">PRIKKO</text>` +
    `<text x="${C}" y="122" font-size="40" font-weight="600" letter-spacing="-.5" style="font-variant-numeric:tabular-nums">${year}</text>` +
    // Olika teckenmellanrum på de två raderna, så att de blir nästan lika
    // breda. Samma mellanrum hade gjort den understa halvannan gång längre än
    // den övre, och blocket hade läst som en kil.
    `<text x="${C}" y="139" font-size="8.5" font-weight="600" letter-spacing="2.6">GENOMGÅENDE</text>` +
    `<text x="${C}" y="150" font-size="8.5" font-weight="600" letter-spacing=".5">UTAN ANMÄRKNINGAR</text>` +
    '</g>' +
    // Hårlinjen skiljer avsändaren från årtalet och ger märket en mittlinje.
    `<path d="M ${C - 24} 83 H ${C + 24}" stroke="${wreath}" stroke-width="1"/>`
  );
}

/** Vad märket betyder, som text. Används som `<title>` och som bildtext. */
export function sealTitle(year: number): string {
  return `Prikkos utmärkelse ${year}: genomgående utan anmärkningar`;
}

/**
 * Fristående SVG-fil för nedladdning.
 *
 * Verksamheten laddar ner den här och sätter den i fönstret eller på sin egen
 * sajt. Den bär därför en kommentar med årtalet och en länk tillbaka till
 * utgåvan, så att den som hittar filen lös kan slå upp vad den betyder.
 */
export function sealDocument(year: number, editionUrl: string): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    `<!-- ${sealTitle(year)}. Utmärkelsen avser ${year} års utgåva och säger ` +
    `ingenting om nuläget. Vad som gällde då: ${editionUrl} -->\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" ` +
    `height="${SIZE}" role="img" aria-label="${sealTitle(year)}">` +
    `<title>${sealTitle(year)}</title>` +
    sealContent(year, { colors: SEAL_STANDALONE }) +
    '</svg>\n'
  );
}

export const SEAL_VIEWBOX = `0 0 ${SIZE} ${SIZE}`;
