/**
 * MATSNUSKMÄRKET. Ritningen, och provarket som den valdes på.
 *
 * Kör:  node brand/matsnuskmarke.mjs
 * Skriver: brand/prikko-matsnuskmarke.svg och brand/_prov-matsnuskmarke.html
 *
 * Originalet som skrivs härifrån importeras sedan till sajten:
 *
 *     cd site && node scripts/importera-marke.mjs ../brand/prikko-matsnuskmarke.svg matsnusk
 *
 * ── Vad märket är ─────────────────────────────────────────────────────────
 *
 * Utmärkelsens spegelbild, och ägarens beställning ordagrant: "den får stamp
 * precis som dom bra, fast dålig", och sedan "det ska ju vara som ett märke
 * som utmärkelsen, eller?".
 *
 * Utmärkelsen är LAGERKRANS + WORDMARK + ÅRTAL. Två av de tre faller bort och
 * skälen är olika:
 *
 *   Kransen faller på TONLÄGET. En krans är en ceremoni, och en ceremoni kring
 *   ett underkännande vore hån. Vi återger ett myndighetsbeslut om en namngiven
 *   verksamhet; vi hånar aldrig någon.
 *
 *   Årtalet faller på SANNINGEN. Utmärkelsen är en fryst årsutgåva och kan bära
 *   ett årtal för alltid. Matsnusk är levande: raden och märket försvinner i
 *   samma bygge som en ny kontroll visar att bristerna är åtgärdade. Ett årtal
 *   hade låtit anklagelsen bestå efter att den slutat vara sann.
 *
 * Kvar blir wordmarken, och den är inte ett märke i sig. Det som gör den till
 * ett märke är STÄMPELRAMEN: där utmärkelsen har två organiska grenar som
 * omfamnar, har matsnusk en hård dubbelregel som ramar in. Samma silhuett,
 * nästan samma proportion, motsatt karaktär. Diplomet på väggen mot raden i
 * protokollet.
 *
 * ── Vad som tittades på innan något ritades ───────────────────────────────
 *
 * Uppmätt i webbläsaren 13 augusti 2026, inte hämtat ur minnet.
 *
 * **Danska smileyordningen**, findsmiley.dk, den ordning som ligger närmast
 * oss. Märket verksamheten hänger i fönstret är ett vitt kort: rubriken
 * "Fødevarekontrol", en hårlinje, datum och CVR-nummer, och de senaste
 * kontrollernas ansikten. Ansiktena är ren linjekonst i EN färg, två prickar
 * och en båge. Ingen kropp, ingen figur, ingen dekor. Det NEGATIVA läget är
 * samma ansikte med bågen vänd, ingenting annat.
 *
 * **USDA:s officiella märken**, 9 CFR 312. De POSITIVA är inneslutna:
 * "U.S. INSP'D & P'S'D" står inuti en cirkel eller en hexagon med en regel
 * runt. Det NEGATIVA, "U.S. INSP'D AND CONDEMNED", har ingen inneslutning
 * alls: två rader smal grotesk, en liten över en stor, och ingenting runt.
 * Stramheten är själva budskapet, alltså samma slutsats som kransen ovan.
 *
 * **New Yorks betygskort**, Two Twelve 2010. Konstruktionen är en liten versal
 * rad som namnger ordningen, "SANITARY INSPECTION GRADE", och under den ett
 * stort besked. Alltså exakt utmärkelsens två våningar och exakt USDA:s
 * uppställning. Det sämsta kortet bär inget ansikte och ingen färgsymbol.
 *
 * **Livsmedelsverket och de svenska kommunerna** har inget konsumentvänt
 * kontrollmärke alls. Frånvaron är svaret, och den är samma frånvaro som
 * `docs/24_maskotprogram.md` §4c noterat om svenska myndigheters designsystem.
 *
 * Mönstret i alla fyra: **ett kontrollmärke är geometri, inte en teckning, och
 * det negativa läget skiljs på FORM och inte på en figur.** Därför bär märket
 * ingen grävling. Ägaren har sagt det två gånger, "Matsnusk ikonen ska
 * fortsatt ej vara grävlingen", och kontrollen säger samma sak av egen kraft.
 *
 * ── Ansiktet, och varför det inte är maskotens ────────────────────────────
 *
 * Ansiktet i märket är WORDMARKENS eget, alltså de två prickarna och bågen som
 * står efter ordet prikko i logotypen. Det är inte grävlingens: ingen kontur,
 * inga öron, ingen nos, inga bryn, inga pupiller. Det är samma skillnad som
 * §2 i maskotprogrammet drar mellan ett neutralt tecken och en karaktär, och
 * det är också vad danskarna ritar.
 *
 * Munnen är vänd nedåt, och det är ett val mot en flack mun. `docs/24` §3b
 * lägger BEDÖMNINGEN i munnen på ägarens eget besked, "munnen ska såklart
 * skilja på alla", och sätter tre former: båge uppåt för clean, praktiskt
 * taget rak för minor, båge nedåt för major. En flack mun på ett märke som
 * betyder "brister som kvarstår" hade alltså sagt MINOR i sajtens egen
 * grammatik. Märket följer grammatiken i stället för att uppfinna en fjärde
 * form.
 *
 * Djupet är härlett och inte satt på känsla. Wordmarkens leende är 5,0 enheter
 * djupt över 21 enheters bredd, alltså pilhöjd 0,238. §3b:s pilhöjder är 0,30,
 * −0,05 och −0,27 av munnens egen bredd, alltså är major −0,9 gånger clean.
 * Samma förhållande på wordmarkens leende ger −4,5 enheter, och det är talet
 * nedan.
 *
 * ── Vad som prövades och föll ─────────────────────────────────────────────
 *
 * Sex uppställningar ritades i provarket. De ligger kvar som `FORMER` så att
 * valet går att pröva om, precis som `enkel` och `nal` ligger kvar i
 * face-geometrin.
 *
 *   `naken`    Wordmarken ensam i rött, USDA:s stramhet rakt av. Sannast mot
 *              researchen och sämst i produkten: utan ram läser den som en
 *              logotyp i fel färg, inte som ett märke, och ägaren har
 *              uttryckligen bett om ett märke.
 *   `regler`   New York-greppet, tung regel över och under. Läser som
 *              rubrikdekor och flyter ihop med sidans egna hårlinjer.
 *   `enkel`    Två våningar med en enda tung regel runt. Med liten radie läser
 *              ramen som en knapp, med stor som en bricka. En regel räcker
 *              inte för att en rektangel ska bli en stämpel.
 *   `omvand`   Ansiktet överst och wordmarken under, alltså danska kortets
 *              ordning. Avsändaren hamnar under beskedet och märket blir ett
 *              ansikte som råkar vara signerat.
 *   `sigill`   Utmärkelsens två våningar med ansiktet uppförstorat där årtalet
 *              står, i samma andel av höjden. Den är den mest LÄSBARA av alla
 *              sex och ändå den som ströks hårdast, och skälet står nedan.
 *   `stampel`  VALD. Wordmarken med sitt eget ansikte på en rad, innesluten i
 *              en dubbelregel. Ritningen blir 248 × 118, alltså proportion
 *              2,10 mot utmärkelsens 2,15: samma silhuett på bedömningsraden.
 *
 * **Reglarna vägdes mot utmärkelsen och inte mot sig själva.** Första
 * ritningen hade 10 enheters ytterregel och stod bredvid kransen i provarket
 * som en betydligt tyngre grafik. Att en anklagelse ropar högre än ett beröm
 * är fel ordning oavsett hur märket ser ut för sig, alltså gick reglarna ned
 * till 7, 6 och 3 enheter tills de två väger lika på 132 px.
 *
 * **Varför det uppförstorade ansiktet ströks, trots att det läste bäst.** Ett
 * ansikte som fyller ett märke är inte längre ett tecken, det är en min, och
 * en min bredvid namnet på en restaurang är ett omdöme om någon. Uppritat i
 * provarket och sett i storlek är `sigill` en ledsen emoji i en röd ruta, och
 * det är precis den bild en verksamhet skulle hålla upp den dagen de hör av
 * sig. Vi återger ett myndighetsbeslut; vi hånar aldrig någon.
 *
 * Det är också samma avvägning som `docs/24_maskotprogram.md` §4b beskriver i
 * teorin: en figur uppfattas ha en AVSIKT, och då läses felet som avsiktligt.
 * Ansiktet stannar därför i wordmarkens egen skala, alltså som en detalj i
 * logotypen och inte som märkets budskap. Det som säger vad märket betyder är
 * FÄRGEN och texten intill, inte en min.
 *
 * ── Färgen ───────────────────────────────────────────────────────────────
 *
 * Ritningen bär EN färg och den byts mot `currentColor` vid importen, precis
 * som utmärkelsen. Sammanhanget sätter `--verdict-major-ink`, alltså #EB0000
 * och inte #FF0000: märket står intill text och behöver 4,5:1.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HAR = dirname(fileURLToPath(import.meta.url));

/**
 * Färgen i originalfilen. Bytt mot currentColor av importskriptet, alltså syns
 * den bara i brand/ och i provarket. Samma värde som `--verdict-major-ink`.
 */
export const FARG = '#EB0000';

const runda = (n) => Number(n.toFixed(2));

/* ══ DELARNA ══════════════════════════════════════════════════════════════
 *
 * Banorna är ordagrant ur site/src/components/Wordmark.astro, viewBox
 * 0 0 159 59. De är kopierade och inte importerade därför att brand/ inte får
 * bero på site/: skriptet ska gå att köra utan att sajten byggs.
 *
 * Alla ramar nedan är UPPMÄTTA med getBBox i webbläsaren och inte lästa ur
 * banornas siffror, eftersom en kubisk bana sällan når sina kontrollpunkter.
 * Strykbredden är pålagd för hand där den finns, eftersom getBBox inte räknar
 * den.
 */

/** Ordet prikko. Uppmätt ram: x 2,44..122,25, y 10,72..49,00. */
const ORD_D =
  'M2.44 49V19.24h4.92v4.32l-.48-1.08c.747-1.173 1.76-2.08 3.04-2.72 1.28-.667 2.76-1 4.44-1 2.053 0 3.907.507 5.56 1.52 1.653 1.013 2.96 2.373 3.92 4.08.987 1.707 1.48 3.627 1.48 5.76 0 2.107-.48 4.027-1.44 5.76-.96 1.733-2.267 3.107-3.92 4.12-1.653.987-3.533 1.48-5.64 1.48-1.573 0-3.027-.307-4.36-.92-1.307-.64-2.347-1.547-3.12-2.72l.84-1.04V49H2.44Zm11.28-12.32c1.2 0 2.267-.28 3.2-.84.933-.56 1.653-1.333 2.16-2.32.533-.987.8-2.12.8-3.4 0-1.28-.267-2.4-.8-3.36-.507-.987-1.227-1.76-2.16-2.32-.933-.587-2-.88-3.2-.88-1.147 0-2.187.28-3.12.84-.907.56-1.627 1.347-2.16 2.36-.507.987-.76 2.107-.76 3.36 0 1.28.253 2.413.76 3.4.533.987 1.253 1.76 2.16 2.32.933.56 1.973.84 3.12.84ZM29.315 41V19.24h4.92v4.84l-.4-.72c.507-1.627 1.293-2.76 2.36-3.4 1.093-.64 2.4-.96 3.92-.96h1.28v4.64h-1.88c-1.493 0-2.693.467-3.6 1.4-.907.907-1.36 2.187-1.36 3.84V41h-5.24ZM44.276 41V19.24h5.24V41h-5.24Zm0-24.2v-5.6h5.24v5.6h-5.24ZM54.354 41V10.72h5.24v19.84l-2-.6 10.24-10.72h6.52l-8.04 8.76 8.2 13h-6l-7.12-11.28 3.12-.64-6.56 7.04 1.64-3.2V41h-5.24ZM77.44 41V10.72h5.24v19.84l-2-.6 10.24-10.72h6.52l-8.04 8.76 8.2 13h-6l-7.12-11.28 3.12-.64-6.56 7.04 1.64-3.2V41h-5.24ZM110.775 41.48c-2.133 0-4.08-.493-5.84-1.48-1.733-.987-3.12-2.333-4.16-4.04-1.013-1.707-1.52-3.653-1.52-5.84 0-2.187.507-4.133 1.52-5.84 1.04-1.707 2.427-3.053 4.16-4.04 1.734-.987 3.68-1.48 5.84-1.48 2.134 0 4.067.493 5.8 1.48 1.734.987 3.107 2.333 4.12 4.04 1.04 1.68 1.56 3.627 1.56 5.84 0 2.187-.52 4.133-1.56 5.84-1.04 1.707-2.426 3.053-4.16 4.04-1.733.987-3.653 1.48-5.76 1.48Zm0-4.8c1.174 0 2.2-.28 3.08-.84.907-.56 1.614-1.333 2.12-2.32.534-1.013.8-2.147.8-3.4 0-1.28-.266-2.4-.8-3.36-.506-.987-1.213-1.76-2.12-2.32-.88-.587-1.906-.88-3.08-.88-1.2 0-2.253.293-3.16.88-.906.56-1.626 1.333-2.16 2.32-.506.96-.76 2.08-.76 3.36 0 1.253.254 2.387.76 3.4.534.987 1.254 1.76 2.16 2.32.907.56 1.96.84 3.16.84Z';

const ORD = { x: 2.44, y: 10.72, bredd: 119.81, hojd: 38.28 };

/** Ögonen. Radie 3 med 1 enhets stryk, alltså 3,5 i verklig radie. */
const OGON = [139.5, 152.5];
const OGA_Y = 23.5;
const OGA_R = 3;
const OGA_STRYK = 1;

/** Munnen. Samma ram som wordmarkens leende: x 135..156, stryk 4,5. */
const MUN_X = 135;
const MUN_BREDD = 21;
const MUN_STRYK = 4.5;

/** Leendets pilhöjd, ur dess egen bana: 6,667 gånger 0,75 för en kubisk. */
const LEENDE_DJUP = 6.667 * 0.75;

/** Matsnuskmunnens pilhöjd. Negativ, alltså båge nedåt. Härledd i huvudet. */
const MUN_DJUP = -(0.27 / 0.3) * LEENDE_DJUP;

/**
 * Munnens ändar. Leendet börjar på y 34 och faller nedåt; den vända munnen
 * stiger, alltså läggs ändarna vid leendets djupaste punkt så att munnen
 * upptar samma band i ansiktet och inte glider uppåt mot ögonen.
 */
const MUN_Y = 34 + LEENDE_DJUP;

/** Ansiktets ram, med stryk. Ögonen y 20..27, munnen y 32,25..41,25. */
const ANSIKTE = {
  x: MUN_X - MUN_STRYK / 2,
  y: OGA_Y - OGA_R - OGA_STRYK / 2,
  bredd: MUN_BREDD + MUN_STRYK,
  hojd: MUN_Y + MUN_STRYK / 2 - (OGA_Y - OGA_R - OGA_STRYK / 2),
};

function ordSvg() {
  return `<path fill="${FARG}" d="${ORD_D}"/>`;
}

function ansikteSvg(djup = MUN_DJUP) {
  const k = djup / 0.75;
  const y = djup < 0 ? MUN_Y : 34;
  const ogon = OGON.map(
    (cx) =>
      `<circle cx="${cx}" cy="${OGA_Y}" r="${OGA_R}" fill="${FARG}" ` +
      `stroke="${FARG}" stroke-width="${OGA_STRYK}"/>`,
  ).join('');
  const mun =
    `<path d="M${MUN_X} ${runda(y)}c${runda(MUN_BREDD / 3)} ${runda(k)} ` +
    `${runda((MUN_BREDD / 3) * 2)} ${runda(k)} ${MUN_BREDD} 0" stroke="${FARG}" ` +
    `stroke-width="${MUN_STRYK}" stroke-linecap="round" fill="none"/>`;
  return ogon + mun;
}

/** Lägger en del med känd ram så att dess ram hamnar på (x, y) i skala s. */
function placera(svg, ram, x, y, s = 1) {
  return (
    `<g transform="translate(${runda(x - ram.x * s)} ${runda(y - ram.y * s)})` +
    `${s === 1 ? '' : ` scale(${runda(s)})`}">${svg}</g>`
  );
}

/* ══ RAMEN ════════════════════════════════════════════════════════════════ */

/** Ytterregelns bredd, i märkets egna enheter. */
const YTTRE = 7;
/** Gluggen mellan reglarna. Det är den som gör konstruktionen till en stämpel. */
const GLUGG = 6;
/** Innerregelns bredd. */
const INRE = 3;

/**
 * Hörnradie på ytterregelns YTTERKANT.
 *
 * Nästan kvadratisk med flit. Sajten rundar allt annat, alltså läser en hård
 * kant här som ett avsteg och inte som en glömska, och det är exakt vad ett
 * dokument, en stämpel och en varningsskylt gör. Med sajtens `--r-card` blev
 * ramen en knapp, och provarket visar den formen som `enkel`.
 */
const RADIE = 7;

/**
 * En regel ritad som rundad rektangel på sin MITTLINJE, alltså med stroke och
 * inte som fylld bana. Radien som skickas in är ytterkantens; mittlinjens är
 * den minus halva strykbredden. Räknas den inte om blir reglarna okoncentriska
 * och gluggen ojämn i hörnen.
 */
function regel(bredd, hojd, inset, stryk, ytterRadie) {
  const x = inset + stryk / 2;
  return (
    `<rect x="${runda(x)}" y="${runda(x)}" width="${runda(bredd - 2 * x)}" ` +
    `height="${runda(hojd - 2 * x)}" rx="${runda(Math.max(0, ytterRadie - stryk / 2))}" ` +
    `fill="none" stroke="${FARG}" stroke-width="${stryk}"/>`
  );
}

const dubbelregel = (b, h) =>
  regel(b, h, 0, YTTRE, RADIE) +
  regel(b, h, YTTRE + GLUGG, INRE, Math.max(0, RADIE - YTTRE - GLUGG));

/* ══ UPPSTÄLLNINGARNA ═════════════════════════════════════════════════════
 *
 * Var och en returnerar { bredd, hojd, svg }. Måtten räknas fram ur delarnas
 * uppmätta ramar, alltså flyttar en ändrad regelbredd ramen och inte
 * innehållet.
 */

/** Luft mellan innerregeln och innehållet. */
const LUFT_X = 30;
const LUFT_Y = 24;

/**
 * Avsändarens grad i sigillet.
 *
 * Utmärkelsen sätter wordmarken på 154 enheter i en ritning som är 507 bred,
 * alltså 30 procent av bredden, och årtalet på 200, alltså 39 procent och
 * dubbelt så högt. Sigillet håller samma förhållande: avsändaren liten,
 * beskedet stort.
 */
const ORD_SKALA = 0.62;

/**
 * Ansiktets skala i sigillet.
 *
 * Utmärkelsens årtal är 74 enheter högt i en 236 enheter hög ritning, alltså
 * 31 procent. Ansiktet är 21,25 enheter högt i sin egen skala, och 2,45 gånger
 * det ger 52 enheter i ett märke som blir omkring 168 högt, alltså samma andel.
 */
const ANSIKTE_SKALA = 2.45;

/** Luft mellan avsändaren och beskedet. */
const VANING = 20;

function tvavaning(ramfn, omvand = false) {
  const ob = ORD.bredd * ORD_SKALA;
  const oh = ORD.hojd * ORD_SKALA;
  const ab = ANSIKTE.bredd * ANSIKTE_SKALA;
  const ah = ANSIKTE.hojd * ANSIKTE_SKALA;

  const kant = YTTRE + GLUGG + INRE;
  const bredd = Math.round(2 * (kant + LUFT_X) + Math.max(ob, ab));
  const hojd = Math.round(2 * (kant + LUFT_Y) + oh + VANING + ah);

  const topp = kant + LUFT_Y;
  const ordY = omvand ? topp + ah + VANING : topp;
  const ansikteY = omvand ? topp : topp + oh + VANING;

  return {
    bredd,
    hojd,
    svg:
      ramfn(bredd, hojd) +
      placera(ordSvg(), ORD, (bredd - ob) / 2, ordY, ORD_SKALA) +
      placera(ansikteSvg(), ANSIKTE, (bredd - ab) / 2, ansikteY, ANSIKTE_SKALA),
  };
}

/**
 * Ordet och ansiktet på en rad, alltså wordmarkens egen uppställning.
 *
 * `djup` finns för provarket: med leendets pilhöjd ritas märket som
 * wordmarken faktiskt ser ut, så att skillnaden mot den vända munnen går att
 * se bredvid varandra i den storlek märket levereras i.
 */
function envaning(ramfn, djup = MUN_DJUP) {
  const b = ANSIKTE.x + ANSIKTE.bredd - ORD.x;
  const h = ORD.hojd;
  const kant = ramfn === tom ? 0 : YTTRE + GLUGG + INRE;
  const bredd = Math.round(2 * (kant + LUFT_X) + b);
  const hojd = Math.round(2 * (kant + LUFT_Y) + h);
  const inne = `<g transform="translate(${runda((bredd - b) / 2 - ORD.x)} ${runda(
    (hojd - h) / 2 - ORD.y,
  )})">${ordSvg()}${ansikteSvg(djup)}</g>`;
  return { bredd, hojd, svg: ramfn(bredd, hojd) + inne };
}

const tom = () => '';

export const FORMER = {
  naken: () => envaning(tom),
  regler: () => {
    const m = envaning(tom);
    return {
      ...m,
      svg:
        `<rect x="0" y="0" width="${m.bredd}" height="${YTTRE}" fill="${FARG}"/>` +
        `<rect x="0" y="${m.hojd - YTTRE}" width="${m.bredd}" height="${YTTRE}" fill="${FARG}"/>` +
        m.svg,
    };
  },
  enkel: () => tvavaning((b, h) => regel(b, h, 0, YTTRE, RADIE)),
  omvand: () => tvavaning(dubbelregel, true),
  sigill: () => tvavaning(dubbelregel),
  stampel: () => envaning(dubbelregel),
};

/** Formen som levereras. Ändras den här raden ändras märket. */
export const VALD_FORM = 'stampel';

/** Samma stämpel med wordmarkens leende. Bara provarket, aldrig levererad. */
const leende = () => envaning(dubbelregel, LEENDE_DJUP);

/**
 * Märket som fristående SVG-källa.
 *
 * `width` och `height` skrivs inte ut: importskriptet tar bort dem ändå, och
 * en fil med bara viewBox skalar med sin behållare i stället för att slåss med
 * den. Se scripts/importera-marke.mjs.
 */
export function marke(form = VALD_FORM) {
  return svgAv(FORMER[form]());
}

const svgAv = (m) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m.bredd} ${m.hojd}" ` +
  `fill="none">${m.svg}</svg>`;

/* ══ PROVARKET ════════════════════════════════════════════════════════════
 *
 * Bredderna är de märket faktiskt får. 132 är utmärkelsens bredd på
 * bedömningsraden och alltså matsnuskmärkets tak, 104 är samma rad under
 * 640 px. De övriga är där märket ska hålla om någon sätter det mindre.
 */
const BREDDER = [176, 132, 104, 80, 56];

/**
 * Utmärkelsens ritning, hämtad ur den genererade modulen i sajten.
 *
 * Provarket måste kunna ställa de två bredvid varandra: hela beställningen är
 * "som ett märke som utmärkelsen", och det påståendet går inte att pröva på
 * ett märke i taget. Modulen läses som text och `source` plockas ut som det
 * JSON-literal den är, alltså utan att bygga sajten.
 */
function utmarkelsen() {
  const fil = join(HAR, '..', 'site', 'src', 'marks', 'utmarkelse-2026.ts');
  const rad = readFileSync(fil, 'utf8').match(/export const source =\s*([\s\S]*?);\s*$/);
  return JSON.parse(rad[1].trim()).replace(/currentColor/g, '#007BE0');
}

function ark() {
  const rad = (form) =>
    BREDDER.map(
      (px) =>
        `<figure><div class="yta" style="width:${px}px">${marke(form)}</div>` +
        `<figcaption>${px} px</figcaption></figure>`,
    ).join('');

  const former = Object.keys(FORMER)
    .map((form) => {
      const m = FORMER[form]();
      return `<section class="steg${form === VALD_FORM ? ' vald' : ''}">
        <h3>${form}${form === VALD_FORM ? ' <em>vald</em>' : ''}
          <span>${m.bredd} × ${m.hojd}</span></h3>
        <div class="rad">${rad(form)}</div>
        <div class="rad mork">${rad(form)}</div>
      </section>`;
    })
    .join('');

  return `<!doctype html>
<html lang="sv"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Provark: matsnuskmärket</title>
<style>
  * { margin: 0; box-sizing: border-box; }
  body { font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         background: #FCFCFD; color: #17191c; padding: 40px 24px 96px; }
  main { max-width: 1100px; margin: 0 auto; }
  h1 { font-size: 27px; letter-spacing: -.02em; }
  .ingress { color: #565c66; margin: 10px 0 34px; max-width: 68ch; }
  .steg { border-top: 1px solid #e4e6ea; padding: 22px 0 4px; }
  .steg.vald { border-top: 2px solid ${FARG}; }
  h3 { font-size: 13px; letter-spacing: .06em; text-transform: uppercase;
       color: #8a909b; margin-bottom: 12px; }
  h3 em { color: ${FARG}; font-style: normal; }
  h3 span { text-transform: none; letter-spacing: 0; color: #b3b8c2; }
  .rad { display: flex; gap: 30px; align-items: flex-end; flex-wrap: wrap;
         padding: 18px 0; }
  .rad.mork { background: #17191c; padding: 18px; border-radius: 12px; }
  .rad.mork figcaption { color: #8a909b; }
  .yta svg { display: block; width: 100%; height: auto; }
  figcaption { font-size: 11px; color: #8a909b; margin-top: 8px; }
  .sammanhang { display: flex; gap: 20px; align-items: flex-start;
                padding: 6px 0 0; }
  .grund, .metod { font-size: 14px; color: #565c66; max-width: 56ch; }
  .grund { margin-top: 12px; }
  .metod { margin: 12px 0 26px; }
  .sammanhang .txt { flex: 1 1 auto; }
  .sammanhang .eyebrow { color: #565c66; font-size: 14px; margin-bottom: 10px; }
  .sammanhang b { display: block; font-size: 24px; letter-spacing: -.02em; }
  .sammanhang p { color: #565c66; font-size: 14px; max-width: 46ch; margin-top: 4px; }
  .ansikte { width: 52px; height: 52px; border-radius: 14px; background: ${FARG};
             flex: none; }
</style></head>
<body><main>
  <h1>Matsnuskmärket</h1>
  <p class="ingress">Utmärkelsens konstruktion utan lagerkrans och utan årtal.
  Sex uppställningar, fem bredder, mot ljus och mot mörk yta. Den valda står med
  röd linje. Färgen är <code>--verdict-major-ink</code>, alltså #EB0000.</p>

  <section class="steg">
    <h3>I sitt sammanhang: bedömningsraden på verksamhetssidan</h3>
    <div class="sammanhang">
      <div class="ansikte"></div>
      <div class="txt">
        <p class="eyebrow">Bedömning</p>
        <b>Brister som kvarstår</b>
        <p>Pizzeria Vesuvio hade brister som kvarstod vid kommunens senaste
        kontroll den 12 maj 2026.</p>
      </div>
      <div class="yta" style="width:132px">${marke()}</div>
    </div>
    <p class="grund">Minst en av bristerna gällde livsmedelshanteringen och
    inte bara administrativa krav. <a href="#">Se listan för Stockholm</a>.</p>
    <p class="metod"><a href="#">Så sätts bedömningen</a></p>
  </section>

  <section class="steg">
    <h3>Syskonprovet: samma plats, samma bredd, aldrig samtidigt</h3>
    <div class="rad">
      <figure><div class="yta" style="width:132px">${utmarkelsen()}</div>
        <figcaption>Utmärkelsen, 132 px. Krans, wordmark, årtal.</figcaption></figure>
      <figure><div class="yta" style="width:132px">${marke()}</div>
        <figcaption>Matsnusk, 132 px. Dubbelregel, wordmark, inget årtal.</figcaption></figure>
    </div>
  </section>

  <section class="steg">
    <h3>Munnen: leendet mot den vända, i levererad storlek</h3>
    <div class="rad">
      ${[176, 132, 104]
        .map(
          (px) =>
            `<figure><div class="yta" style="width:${px}px">${svgAv(leende())}</div>` +
            `<figcaption>Leendet, ${px} px</figcaption></figure>` +
            `<figure><div class="yta" style="width:${px}px">${marke()}</div>` +
            `<figcaption>Vänd, ${px} px</figcaption></figure>`,
        )
        .join('')}
    </div>
  </section>

  ${former}
</main></body></html>`;
}

const m = FORMER[VALD_FORM]();
writeFileSync(join(HAR, 'prikko-matsnuskmarke.svg'), marke() + '\n');
writeFileSync(join(HAR, '_prov-matsnuskmarke.html'), ark());
console.log(`viewBox 0 0 ${m.bredd} ${m.hojd}, form ${VALD_FORM}`);
console.log('Skrev brand/prikko-matsnuskmarke.svg och brand/_prov-matsnuskmarke.html');
