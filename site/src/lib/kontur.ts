/**
 * Text som konturer: sätter en rad med glyfer ur den genererade fonttabellen.
 *
 * ============================================================================
 * VAD PROBLEMET VAR
 * ============================================================================
 *
 * Filerna i lib/dekal.ts lämnar sajten. En `<text>` i dem bär en
 * `font-family`-lista, och listan är ett önskemål och inte ett löfte: har
 * mottagaren inte Instrument Sans installerad byter programmet typsnitt. Mätt
 * på den här maskinen med sharp och librsvg blev det Helvetica.
 *
 * Föregångaren till den här modulen försökte hantera följden i stället för
 * orsaken: `line()` i dekal.ts UPPSKATTADE radens bredd ur teckenantal gånger
 * teckengrad och sänkte graden tills raden fick plats. Det fungerade, men det
 * löste fel problem. Texten blev fortfarande fel typsnitt, och bredden var en
 * gissning med tolv procents påslag.
 *
 * Med konturer finns ingen font att sakna och ingen bredd att gissa: varje
 * glyf bär sin egen teckenbredd ur fonten, alltså är radens bredd EXAKT och
 * uträknad, och filen ser likadan ut i varje renderare.
 *
 * ============================================================================
 * VAD MODULEN INTE GÖR
 * ============================================================================
 *
 * INGEN KERNING. Fonten har en GPOS-tabell med parvisa justeringar, och den
 * läses inte. Följden är att par som "Av" och "To" står en aning glesare än i
 * en webbläsare. Skillnaden är några tusendels em per par och syns inte i de
 * storlekar filerna använder, men den ska stå skriven och inte upptäckas.
 *
 * INGEN LIGATUR OCH INGEN OMFORMNING. Svenska behöver ingen, och en dekal med
 * fem rader text är fel plats att bygga en textmotor.
 *
 * INGEN RADBRYTNING. Raderna är satta för hand i dekal.ts, eftersom var de
 * bryter är en formfråga och inte en beräkning.
 *
 * BARA VIKT 400. Skälet står i scripts/importera-typsnitt.mjs: fontkitten kan
 * inte instansiera en variabel woff2, och fonten levereras bara variabel.
 * Hierarki sätts därför med storlek och färg, inte med vikt.
 */
import { glyphs, unitsPerEm } from '../typsnitt/instrument-sans-400';

export interface Kontur {
  /** Färdig SVG-markup: en `<path>` med hela raden i. */
  markup: string;
  /** Radens bredd i millimeter. Uträknad, inte uppskattad. */
  width: number;
  /** Tecken som saknade glyf. Tom i normalfallet, se `textOutline`. */
  missing: string[];
}

/**
 * Bredden på en rad i millimeter, utan att rita den.
 *
 * Används av dekal.ts för att välja teckengrad innan raden sätts, och den
 * räknar på exakt samma teckenbredder som `textOutline` sedan ritar med. Det
 * är hela vinsten mot den gamla uppskattningen: talet kan inte skilja sig från
 * ritningen, eftersom det kommer ur samma tabell.
 */
export function textWidth(text: string, size: number): number {
  let units = 0;
  for (const ch of text) {
    const g = glyphs[ch.codePointAt(0) as number];
    if (g) units += g[0];
  }
  return (units * size) / unitsPerEm;
}

/**
 * Flyttar och vänder en glyfs `d` från fontens koordinatsystem till SVG:ns.
 *
 * En font har origo i skrivlinjen med y UPPÅT. SVG har y NEDÅT. Vändningen
 * görs här, i fontenheter, i stället för med ett `transform="scale(1 -1)"`
 * på elementet. Skälet är att alla glyfer på raden ska hamna i EN `<path>`:
 * ett element per bokstav är trettio element per rad, och en dekal med fem
 * rader blir då hundrafemtio element som varje ritprogram visar som var sitt
 * objekt när någon öppnar filen.
 *
 * Talen är absoluta i fontkittens utdata, alltså är kommandona M, L, Q, C och
 * Z och varje talpar en koordinat. Inga relativa kommandon förekommer, och
 * skulle de börja göra det ger den här funktionen fel svar tyst. Därför
 * kontrolleras det: ett gement kommando kastar.
 */
function place(d: string, penX: number): string {
  const ut: string[] = [];
  const delar = d.match(/[A-Za-z][^A-Za-z]*/g) ?? [];

  for (const del of delar) {
    const cmd = del[0];
    if (cmd !== cmd.toUpperCase()) {
      throw new Error(`lib/kontur.ts väntar absoluta kommandon, fick "${cmd}".`);
    }
    if (cmd === 'Z') {
      ut.push('Z');
      continue;
    }
    const tal = (del.slice(1).match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    if (tal.length % 2 !== 0) {
      throw new Error(`lib/kontur.ts: ${cmd} har ${tal.length} tal, alltså inget helt antal koordinater.`);
    }
    const par: string[] = [];
    for (let i = 0; i < tal.length; i += 2) {
      par.push(`${round(tal[i] + penX)} ${round(-tal[i + 1])}`);
    }
    ut.push(cmd + par.join(' '));
  }

  return ut.join('');
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

export type Anchor = 'start' | 'middle';

/**
 * Sätter en rad som konturer.
 *
 * `x` och `y` är i millimeter och `y` är SKRIVLINJEN, precis som `y` på ett
 * `<text>`, så att anropen i dekal.ts kunde behålla sina koordinater när de
 * bytte från text till kontur.
 *
 * Saknas en glyf hoppas tecknet över och läggs i `missing`. Det är ett
 * medvetet val framför att rita fontens `.notdef`, alltså den tomma rutan:
 * en dekal med en ruta mitt i ett verksamhetsnamn ser ut som ett fel i
 * verksamhetens namn. Anroparen får listan och kan välja att i stället sätta
 * just den raden som vanlig `<text>`, alltså rätt innehåll i fel typsnitt,
 * vilket är den mindre skadan. Se `nameElement` i dekal.ts.
 */
export function textOutline(
  text: string,
  x: number,
  y: number,
  size: number,
  fill: string,
  anchor: Anchor = 'middle',
): Kontur {
  const scale = size / unitsPerEm;
  const missing: string[] = [];
  const bitar: string[] = [];
  let pen = 0;

  for (const ch of text) {
    const g = glyphs[ch.codePointAt(0) as number];
    if (!g) {
      missing.push(ch);
      continue;
    }
    const [advance, d] = g;
    if (d) bitar.push(place(d, pen));
    pen += advance;
  }

  const width = pen * scale;
  const left = anchor === 'middle' ? x - width / 2 : x;

  /*
   * Ett `transform` med skala på gruppen, i stället för att räkna om varje
   * koordinat till millimeter. Det håller talen i `d` i hela fontenheter,
   * alltså korta, och gör filen ungefär en tredjedel mindre än om varje
   * koordinat vore ett millimetertal med tre decimaler.
   */
  const markup = bitar.length
    ? `<path fill="${fill}" transform="translate(${round(left)} ${round(y)}) ` +
      `scale(${Math.round(scale * 1e6) / 1e6})" d="${bitar.join('')}"/>`
    : '';

  return { markup, width, missing };
}
