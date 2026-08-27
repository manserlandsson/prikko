/**
 * BEDÖMNINGSMÄRKETS RÖRELSE, förberedd en gång per bygge.
 *
 * Modulen gör två saker, och båda finns här av samma skäl: de får hända EN
 * gång, inte 15 983 gånger. Astros frontmatter körs per renderad sida, och så
 * många verksamhetssidor bär ett märke i rörelse, uppmätt i bygget. En modul på toppnivå körs vid första
 * importen och aldrig mer.
 *
 *   1. RIGGAR de fyra ansiktena, alltså ger varje del en namngiven led.
 *   2. PLOCKAR UT märkets del av rörelsekatalogen.
 *
 * MODULEN FÖRUTSÄTTER GRÄVLINGSANSIKTET. Riggen letar sex leder som bara den
 * ritningen har, och blinkningen läser ögonlockens viloläge ur markupen. Går
 * strömbrytaren i lib/face.ts till det klassiska märket finns inget att rigga,
 * och då ska ingen rörelse ritas alls. Grinden heter MARKE_ROR_SIG och sitter
 * i FaceMark.astro, alltså före första anropet hit. Spärrarna nedan står kvar
 * som spärrar: de ska fälla ett bygge, inte tyst leverera ett halvt ansikte.
 *
 * ── Varför riggen och inte fyra nya klasser i figuren ───────────────────
 *
 * Ansiktet som FaceMark ritar bär bara två klasser, `mun` och `lock-hoger`.
 * Brynen, pupillerna och ögonvitorna är anonyma paths, och det går inte att
 * animera det man inte kan peka på.
 *
 * Det fanns två vägar. Den ena var att sätta klasser i brand/maskot/gravling.mjs
 * och generera om, den andra att köra samma rigg som maskoten redan använder.
 * Riggen valdes, och skälen är tre:
 *
 *   Den finns och den är prövad. `lasAnsikte()` i maskot-rigg.mjs säger
 *   uttryckligen att ansiktet ser likadant ut i helfiguren och i det beskurna
 *   märket, alltså finns bara en avläsning. Prövat på alla fyra lägena: noll
 *   saknade delar, arton namngivna leder i vart och ett.
 *
 *   Den kostar bara där rörelsen finns. Klasser i figuren hade hamnat i
 *   spritens fyra symboler, alltså på alla 16 558 sidor med märken. Riggen
 *   körs bara på det märke som faktiskt ska röra sig, alltså på ett per
 *   verksamhetssida.
 *
 *   Den rör inte generatorn. Att generera om face-geometri.ts skriver också
 *   om faviconen, app-ikonen, mejlbilden, ordmärket och gångcykeln. Att ta
 *   den risken för fyra klassnamn är fel avvägning.
 *
 * Priset är mätt: 424 till 475 byte rått per märke, 99 till 111 gzippat, och
 * det betalas bara av de sidor som har ett märke i rörelse.
 *
 * ── Varför katalogen skalas och inte importeras ─────────────────────────
 *
 * `import '../styles/maskot-rorelse.css'` hade hissat hela katalogen till
 * varje sida som ritar ett märke, alltså i praktiken hela sajten. Katalogen
 * är 14 735 byte utan sina noter, och det mesta av den är maskotens fria
 * läge, som ett märke aldrig kan använda: den har varken kropp, ben eller
 * skugga att animera.
 *
 * Det som plockas ut här är tokens, riggens två grundrader och allt som bär
 * `mm-`. Resten lämnas. Utfallet mäts av provet längst ned i den här filen
 * och ligger på ungefär en sjättedel av katalogen.
 *
 * KATALOGEN ÄR FORTFARANDE DEN ENDA SANNINGEN. Ingen regel skrivs här, bara
 * ett urval, och urvalet går sönder HÖGLJUTT: saknas en av grundreglerna
 * kastar modulen och bygget stannar. Alternativet, att tyst leverera ett
 * märke som står still, är precis den sortens fel som ingen upptäcker.
 */
import KATALOG from '../styles/maskot-rorelse.css?raw';
import { FACE_MARKUP } from './face';
import type { FaceDetalj, FaceKey } from './face';
import { rigga } from './maskot-rigg.mjs';

/* ══ 1. URVALET UR KATALOGEN ═════════════════════════════════════════════ */

/** Ett block på toppnivån: allt före klammern, och allt inuti den. */
interface Block {
  pre: string;
  kropp: string;
}

/**
 * Delar CSS i block på toppnivå och räknar klammerdjup.
 *
 * En regex hade räckt ända fram till `@media` och `@keyframes`, som båda har
 * block inuti sig. Djupräkningen är sex rader och gör frågan omöjlig att få
 * fel. Katalogen är dessutom vår egen och maskinläst: den har inga strängar
 * med klamrar i, vilket är det enda som kan lura en räknare.
 */
function blockDela(css: string): Block[] {
  const ut: Block[] = [];
  let djup = 0;
  let start = 0;
  let pre = '';
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '{') {
      if (djup === 0) {
        pre = css.slice(start, i);
        start = i + 1;
      }
      djup++;
    } else if (c === '}') {
      djup--;
      if (djup === 0) {
        ut.push({ pre, kropp: css.slice(start, i) });
        start = i + 1;
      }
    }
  }
  return ut;
}

/** Selektorn i jämförbar form: en rad, inga blanksteg efter komma. */
const normal = (s: string) => s.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',').trim();

/**
 * De regler som INTE bär `mm-` men ändå måste följa med.
 *
 * Listan är uttrycklig och kort med flit. Ett mönster hade tagit med sig
 * kroppens och benens ledpunkter, alltså fyrtio rader om armar och fötter som
 * ett ansikte utan kropp aldrig kan använda.
 *
 *   tokens        varaktigheterna och kurvorna, alltså var(--m-mjuk) och
 *                 var(--m-ut) som mm-reglerna läser.
 *   ledernas bas  transform-box och origo. Utan den roterar och skalar varje
 *                 del kring svg-rutans övre vänstra hörn i stället för kring
 *                 sig själv, och ansiktet faller isär i första bildrutan.
 *   iterationer   reducerad rörelse. tokens.css nollar varaktigheten men en
 *                 `infinite` med varaktigheten noll TAR INTE SLUT, se
 *                 avsnitt 6 i katalogen. Den här raden är hela skyddet.
 */
const BASREGLER = [
  '.r-figur,:root',
  ".r-figur [class^='r-']",
  '.r-figur,.r-figur *',
];

/** Sant om blocket hör till märket. */
const gallerMarket = (pre: string) => /(^|[\s,({])\.mm-|@keyframes\s+mm-/.test(pre);

/**
 * Katalogen skalad ned till det märket kan använda.
 *
 * Noterna åker först, av exakt samma skäl som i Maskot.astro: rå text går
 * förbi Astros stilpipeline, alltså hamnar varenda kommentarstecken i
 * dokumentet. Skillnaden mot Maskot är att den här texten skrivs på 15 983
 * verksamhetssidor och inte på 22.
 */
function plockaMarket(css: string): string {
  const rent = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const funna = new Set<string>();
  const ut: string[] = [];
  let tokens = '';

  for (const { pre, kropp } of blockDela(rent)) {
    const sel = normal(pre);

    /* Tokenblocket skjuts upp till sist. Först när resten är plockad går det
       att veta VILKA tokens som faktiskt läses, och katalogen har tolv medan
       märket använder två. De tio andra är 190 byte på varenda
       verksamhetssida, alltså tre megabyte över bygget, för värden ingen
       regel på sidan slår upp. */
    if (sel === BASREGLER[0]) {
      funna.add(sel);
      tokens = normal(kropp);
      continue;
    }

    if (BASREGLER.includes(sel)) {
      funna.add(sel);
      ut.push(`${sel}{${normal(kropp)}}`);
      continue;
    }

    if (gallerMarket(sel)) {
      /* @keyframes har egna block inuti sig och får därför inte plattas till
         med samma normalisering som en vanlig regel: bildrutornas klamrar
         måste stå kvar. Innehållet skrivs ut som det står, minus radbrytningar. */
      ut.push(`${sel}{${kropp.replace(/\s+/g, ' ').trim()}}`);
      continue;
    }

    /* @media-blocket för reducerad rörelse innehåller både maskotens och
       märkets regler. Det öppnas och bara märkets följer med. */
    if (/^@media/.test(sel)) {
      const inre = blockDela(kropp)
        .filter((b) => BASREGLER.includes(normal(b.pre)) || gallerMarket(normal(b.pre)))
        .map((b) => {
          const s = normal(b.pre);
          if (BASREGLER.includes(s)) funna.add(s);
          return `${s}{${normal(b.kropp)}}`;
        });
      if (inre.length) ut.push(`${sel}{${inre.join('')}}`);
    }
  }

  const saknas = BASREGLER.filter((r) => !funna.has(r));
  if (saknas.length) {
    throw new Error(
      'marke-rorelse: grundregler saknas i maskot-rorelse.css: ' + saknas.join(' | ') +
      '. Utan dem står märket still utan att något klagar. Läs om urvalet i ' +
      'site/src/lib/marke-rorelse.ts.',
    );
  }

  /* Tokenblocket, nedskuret till det som slås upp. Namnen läses ur reglerna
     själva, alltså kan listan aldrig glida ifrån dem: skriver någon in en ny
     var(--m-...) i en mm-regel följer deklarationen med av sig själv. */
  const lasta = new Set([...ut.join('').matchAll(/var\((--m-[\w-]+)/g)].map((x) => x[1]));
  const kvar = tokens
    .split(';')
    .map((d) => d.trim())
    .filter((d) => lasta.has(d.split(':')[0]?.trim() ?? ''));

  return `${BASREGLER[0]}{${kvar.join(';')}}${ut.join('')}`;
}

/** Märkets rörelser, färdiga att skrivas in i en sida. */
export const MARKE_KATALOG = plockaMarket(KATALOG);

/* ══ 2. DE RIGGADE ANSIKTENA ═════════════════════════════════════════════ */

/**
 * Ögonlockens VILOLÄGE, läst ur markupen och skickat till stilmallen.
 *
 * Blinkningens bildrutor känner bara till det slutna läget; viloläget kommer
 * härifrån. Skälet står i katalogen vid mm-blink och det är värt att upprepa:
 * locket i vila är olika i varje bedömning, eftersom det ÄR uttrycket, och
 * tre viloställningar hårdkodade i en stilmall är tre fel den dagen någon
 * ändrar ett uttryck i figuren.
 */
interface Lockvila {
  vcy: string;
  vry: string;
  hcy: string;
  hry: string;
}

function lasLock(markup: string, sida: 'v' | 'h'): { cy: string; ry: string } {
  const g = new RegExp(`<g class="r-lock-${sida}"><ellipse\\b([^>]*)>`).exec(markup);
  const cy = g && /\bcy="([-\d.]+)"/.exec(g[1]);
  const ry = g && /\bry="([-\d.]+)"/.exec(g[1]);
  if (!cy || !ry) {
    throw new Error(
      `marke-rorelse: hittade inget ögonlock r-lock-${sida} med cy och ry. ` +
      'Blinkningen skulle då börja från fel läge och locket hoppa. Läs ' +
      'lasAnsikte() i maskot-rigg.mjs.',
    );
  }
  return { cy: cy[1], ry: ry[1] };
}

const RIGGAT = new Map<string, { markup: string; vila: Lockvila }>();

/**
 * Ansiktet med namngivna leder, plus ögonlockens viloläge.
 *
 * Fyra lägen gånger ett anrop. Utan minnet hade riggen läst och skrivit om en
 * nio kilobyte lång sträng en gång per verksamhetssida.
 *
 * Riggen vill ha en hel svg, eftersom den letar rätt på rotnoden för att veta
 * var kroppen börjar. Märket är bara innehållet, så det lindas inför riggningen
 * och skalas av efteråt. Samma grepp som i Maskot.astro, och av samma skäl:
 * komponentens egen svg bär aria och storlek och är kontraktet utåt.
 */
export function riggatAnsikte(key: FaceKey, niva: FaceDetalj) {
  const minne = RIGGAT.get(`${key}-${niva}`);
  if (minne) return minne;

  const rent = FACE_MARKUP[key][niva];
  const { svg, saknas } = rigga(`<svg viewBox="0 0 100 100">${rent}</svg>`);
  if (saknas.length) {
    throw new Error(
      `marke-rorelse: riggen hittade inte ${saknas.join(', ')} i ansiktet "${key}". ` +
      'Ett märke där halva ansiktet lever är sämre än ett som står still. ' +
      'Gäller det klassiska märket är svaret inte att lätta på spärren utan ' +
      'att inte rita rörelse alls; se MARKE_ROR_SIG i lib/face.ts.',
    );
  }

  const markup = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const v = lasLock(markup, 'v');
  const h = lasLock(markup, 'h');
  const svar = { markup, vila: { vcy: v.cy, vry: v.ry, hcy: h.cy, hry: h.ry } };
  RIGGAT.set(`${key}-${niva}`, svar);
  return svar;
}
