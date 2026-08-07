/**
 * PRIKKOS MASKOT: GÅRDSVÄTTEN
 * ---------------------------
 * Tomtenissen i sin ursprungliga folkliga betydelse. Inte jultomten.
 * Ett litet väsen som gick runt på gården, sopade, skötte djuren, KRÄVDE
 * renlighet, straffade vanvård och belönade den som skötte sig. Prikkos
 * affärsidé formulerad som svensk folktro.
 *
 * Rent SVG. Inga bibliotek, inga filter, inga masker, inga clipPath, inga id.
 * Tjugo figurer kan ligga i samma dokument utan att krocka.
 *
 * Se vatte-konstruktion.md för koordinatritningen.
 */

/* ================================================================= META */

export const META = {
  namn: 'Gårdsvätten',
  koncept:
    'Gårdsvätten ur svensk folktro: den lilla som går runt, kräver ordning ' +
    'och säger som det är.',
  former: 12,   // distinkta banor i grundposen, skuggan inräknad. 6 i beskuret.
  farger: 5,    // bas, mörk, ljus, vitt, plus en tillståndsneutral markgrå
  egenhet:
    'Luvspetsen är en visare. Den släpar bakåt när vätten är på väg, viner ' +
    'fram och pekar i samma sekund han hittar något, står pigg upp när han ' +
    'är nöjd och hänger slak när han väntar.',
  svaghet:
    'Konen är stor och läser lätt som en vinge om spetsen dras för långt ' +
    'bakåt. Marginalen mellan toppluva och hajfena är liten, och i gult ' +
    'tillstånd bär formen bedömningen ensam eftersom vitt på gult är svagt.',
};

/** PROPORTIONSREGLER. Uppmätta i 120-rutan. Läs dem som lag. */
export const PROPORTIONER = [
  'Vätten är två huvuden hög. Huvudet är 52 enheter, hela figuren 112.',
  'Huvudet är bredare än det är högt: 67 mot 52. Vätten har ingen hjässa, luvan äger hela kalotten.',
  'Luvkanten skär aldrig under y 62 och aldrig över y 26. Utanför det spannet tappar ansiktet plats.',
  'Prickögonen ligger på huvudets mittlinje, y 60, aldrig ovanför.',
  'Prickparets mitt ligger framför ansiktets mitt: x 64 mot x 60,5. Prickar centreras aldrig.',
  'Konens spets når aldrig längre bak än x 26. Bakom den punkten lyfter luvan från huvudet och blir en vinge.',
  'Näsan sticker ut 10 enheter förbi silhuettens framkant och tar noll plats i ansiktet.',
  'En fot i taget rör marken. Den andra svävar fri från kroppen.',
];

/** FÖRBJUDET. Bryts en av dessa är figuren inte längre vår. */
export const FORBJUDET = [
  'Aldrig jultomte. Ingen röd luva, ingen säck, ingen tomtekostym, ingen gran.',
  'Aldrig skägg. Skägget äter ansiktet och gör figuren gammal och långsam.',
  'Aldrig rött som figurens egen kulör. Rött är en tillståndsfärg och inget annat.',
  'Aldrig keramiktrådgårdstomte eller Roaming Gnome. Ingen spade, ingen svamp, inga kinder med rouge.',
  'Aldrig förstoringsglas, rutig hatt eller kappa som grundvariant. Detektiv läses ur hållning och blick.',
  'Aldrig centrerade prickar och aldrig symmetrisk grundställning rakt framifrån.',
  'Aldrig ögonvita. Ögat är en enda solid vit prick. Det är vårt avstånd till Duo.',
  'Aldrig gradient, stroke på kroppen, tunna linjer eller oval skugga.',
];

/**
 * SUBTRAKTIONER. Vad vätten INTE har fastän man förväntar sig det.
 *  - Inget skägg. Det uppenbara bortvalet, och det som gör honom snabb.
 *  - Inga ben. Bara två fotpiller under förklädet, som Duo. Ger fri posering.
 *  - Ingen mun i vila. Munnen finns bara som en vit båge, aldrig som en öppen
 *    hålighet med tänder eller tunga.
 */

/* =============================================================== FÄRGER */

/** Tre toner per tillstånd. Mörk ton är Prikkos egen. Ljus ton är basen
 *  blandad 45 procent mot vitt. Inga påhittade kulörer. */
export const TONER = {
  blue:  { bas: '#007BE0', mork: '#0063B4', ljus: '#73B6EE' },
  clean: { bas: '#00B92B', mork: '#009523', ljus: '#73D88A' },
  minor: { bas: '#FECB00', mork: '#DEB201', ljus: '#FEE873' },
  major: { bas: '#EB0000', mork: '#C50000', ljus: '#F47373' },
};

/** Skuggan är tillståndsneutral. Den är mark, inte figur. */
const SKUGGFARG = '#D7DDE4';

/* ============================================================= GEOMETRI */

/** KROPPEN. Huvud och bål i EN enda bana. Marken ligger på y 116.
 *  Huvudet är medvetet BREDARE än det är högt och saknar hjässa: luvan äger
 *  hela kalotten. Det är skillnaden mot varv 1, där luvan bara låg som en
 *  hjälm ovanpå ett runt huvud och läste som en hajfena. */
const KROPP_HEL =
  'M61 34C80 34 93 44 94 56C95 68 89 80 80 86C88 90 92 98 90 103' +
  'C86 109 76 111 62 111C46 111 36 108 33 102C31 96 34 90 41 86' +
  'C33 79 27 68 28 56C29 44 42 34 61 34Z';

/** Samma bana avslutad vid hakan. Bara i beskuret läge, där bålen är offrad. */
const KROPP_HUVUD =
  'M61 34C80 34 93 44 94 56C95 68 89 80 80 86C70 92 48 92 41 86' +
  'C33 79 27 68 28 56C29 44 42 34 61 34Z';

/**
 * LUVAN. En kon, inte en kalott. Konens bas är luvkanten tvärs över pannan
 * och konen smalnar av mot en spets. Fyra riktningar, var och en en egen
 * ritad bana, eftersom en roterad spets ser påklistrad ut.
 *
 * DETTA ÄR FIGURENS EGENHET: spetsen är en visare. Den släpar bakåt när
 * vätten är på väg, viner fram och pekar när han hittar något, står pigg upp
 * när han är nöjd och hänger slak när han väntar.
 *
 * Argumentet [bak, mitt, fram] är luvkantens tre höjder. Kanten är samtidigt
 * ögonbryn och ögonlock, eftersom luvan ritas SIST, ovanpå prickögonen.
 */
function luvbana([bak, mitt, fram], riktning) {
  // Luvkanten är konens BAS, ritad framifrån och bakåt respektive tvärtom.
  const kantBak = `C70 ${mitt + 2} 46 ${mitt} 28 ${bak}`;
  const kantFram = `C46 ${mitt} 70 ${mitt + 2} 93 ${fram}`;
  // Konens spets. Riktningen är figurens egenhet, inte en dekoration.
  switch (riktning) {
    case 'fram': // viner fram och pekar ut över näsan
      return `M28 ${bak}C24 30 34 12 62 6C82 8 98 14 106 20` +
             `C104 28 99 38 93 ${fram}${kantBak}Z`;
    case 'upp':  // pigg, nästan rakt upp
      return `M28 ${bak}C25 30 30 14 44 6C50 2 56 2 60 4` +
             `C74 14 88 28 93 ${fram}${kantBak}Z`;
    case 'slak': // hänger tungt bakåt och ner över nacken
      return `M93 ${fram}C93 34 84 16 60 10C36 6 14 16 10 34` +
             `C14 40 20 42 28 ${bak}${kantFram}Z`;
    default:     // bak: släpar bakåt av farten. Grundläget.
      // Spetsen sitter medvetet nära hjässan. Varv 5 flyttade den ut till
      // x 28 och då lyfte hela luvan från huvudet och läste som en vinge.
      return `M93 ${fram}C92 24 64 6 36 5C28 12 26 28 28 ${bak}` +
             `${kantFram}Z`;
  }
}

/** NÄSAN. Sticker ut FÖRBI silhuettens framkant i stället för att ligga mitt
 *  i ansiktet. Den har GRUNDTONEN, inte ljus ton: i varv 2 var den en ljus
 *  boll som läste som en kind. En bula på konturen läser entydigt som näsa
 *  och tar noll plats från ögon och mun. */
const NASA = 'M86 52C96 51 105 56 104 63C103 71 94 74 86 70Z';

/** FÖRKLÄDET. Arbetskläder, inte julkostym. Urringningen dippar i mitten så
 *  att det läses som ett plagg och inte som en bräda figuren sitter på. */
const FORKLADE =
  'M52 87C58 93 66 93 72 87C80 90 84 96 83 103C72 106 51 106 42 102' +
  'C41 94 46 88 52 87Z';

/** SKUGGAN. Pillerform, aldrig oval. Ovaler antyder perspektiv. */
const SKUGGA = { x: 30, y: 110, w: 62, h: 8, rx: 4 };

/* ================================================ ANSIKTET SOM SYSTEM */

/**
 * BÄRAREN AV BEDÖMNINGEN ÄR LUVKANTEN.
 *
 * Mellan clean, minor och major ändras EN parameter: luvkantens tre höjder.
 * Eftersom luvan ritas SIST, ovanpå ögonen, gör den två saker på en gång.
 * Den är ögonbryn, och dess underkant skär av prickögats överkant och blir
 * ögonlock. Prickarnas ry och munbågen följer med som konsekvenser av samma
 * rörelse, inte som fria val. Kropp, armar, fötter och luvspets är IDENTISKA
 * i alla tre bedömningslägen. Ingenting annat rör sig.
 *
 * Delarna, namngivna:
 *   kant  [bak, mitt, fram]  luvkantens y i tre punkter. Hög mittsiffra =
 *                            brynet dyker ner mellan ögonen, rynkad panna.
 *   bak   [cx, cy, rx, ry]   bortre prickögat. Alltid mindre än det främre.
 *   fram  [cx, cy, rx, ry]   främre prickögat.
 *   mun                      nyckel i MUNNAR.
 */
const ANSIKTEN = {
  // ---- de tre bedömningarna. Samma kropp, samma pose, bara luvkanten rör sig
  clean:    { kant: [32, 36, 46], bak: [49, 60, 8.4, 8.4], fram: [75, 58, 9.2, 9.2], mun: 'glad' },
  minor:    { kant: [29, 45, 56], bak: [49, 60, 8.4, 7.2], fram: [76, 61, 9.2, 4.0], mun: 'kink' },
  major:    { kant: [39, 61, 57], bak: [51, 66, 8.0, 4.4], fram: [78, 65, 8.8, 4.8], mun: 'ledsen' },
  // ---- arbetslägen
  soker:    { kant: [31, 40, 49], bak: [53, 60, 7.6, 8.2], fram: [79, 58, 9.4, 8.8], mun: 'sokt' },
  hittat:   { kant: [26, 30, 41], bak: [51, 59, 9.0, 9.4], fram: [78, 57, 9.8, 10.2], mun: 'oh' },
  vantar:   { kant: [35, 45, 52], bak: [48, 62, 8.4, 3.6], fram: [74, 61, 9.2, 4.0], mun: 'rak' },
  nojd:     { kant: [30, 34, 45], bak: [50, 59, 8.6, 8.6], fram: [76, 57, 9.4, 9.4], mun: 'glad' },
  tom:      { kant: [33, 42, 49], bak: [44, 59, 8.6, 8.6], fram: [69, 58, 9.0, 9.0], mun: 'rak' },
  fyrafyra: { kant: [26, 29, 42], bak: [52, 60, 9.2, 9.6], fram: [79, 58, 10.0, 10.4], mun: 'oh' },
};

/** Luvkanten i BESKURET läge. Där finns ingen kon, bara ett mörkt fält som
 *  går diagonalt tvärs över hela rutan och slutar i luvkanten. Konen offras,
 *  kanten behålls, precis som Duolingos app-ikon offrar kropp och vingar. */
function luvbanaBeskuren([bak, mitt, fram]) {
  return `M-30 -30L140 -30L140 ${fram}C108 ${fram + 1} 72 ${mitt + 2} 28 ${bak}L-30 ${bak - 4}Z`;
}

/**
 * MUNBÅGARNA. Alla asymmetriska, alla favoriserar framsidan, ingen är en ren
 * cirkelbåge. Ärvda från Prikkos bedömningsmärken men lutade med ansiktets
 * kvartsvridning. `ledsen` bryter medvetet ut ur ansiktets ram i bakkanten,
 * vilket är tillåtet vid starka känslor.
 */
const MUNNAR = {
  glad:   'M42 70C53 82 70 83 82 68',
  kink:   'M44 79C53 75 60 81 81 73',
  ledsen: 'M37 82C50 69 68 68 82 78',
  oh:     'M56 71C58 83 72 83 75 70',
  rak:    'M44 78C55 80 66 79 81 76',
  sokt:   'M46 77C55 81 63 75 79 78',
};

/** Munnens tjocklek. 7 av 120, alltså samma andel av huvudets bredd som
 *  märkets 8,2 procent. Enda strecket i hela figuren, medvetet ärvt. */
const MUNTJOCKLEK = 7;

/* ================================================================ POSER */

/**
 * Armar och fötter är rundade rektanglar, exakt det verktyg Duolingo anger
 * för att böja en figur. Fötterna ligger UTANFÖR lutningsgruppen så att bålen
 * kan luta framåt utan att fötterna glider.
 *
 * lut    bålens lutning i grader kring (60, 104). Positivt = framåt.
 * skift  ansiktsgruppens förskjutning. Antyder en huvudvridning.
 */
const GRUNDPOS = {
  lut: 9, spets: 'bak', skift: [2, 1],
  armB: { cx: 27, cy: 93, w: 12, h: 28, rot: -30 },
  armF: { cx: 95, cy: 97, w: 13, h: 31, rot: 24 },
  fotB: { cx: 42, cy: 105, w: 24, h: 12, rot: -20 },
  fotF: { cx: 76, cy: 111, w: 27, h: 13, rot: 4 },
};

const POSER = {
  // De tre bedömningarna delar EXAKT samma kropp. Bara ansiktet skiljer.
  clean: GRUNDPOS,
  minor: GRUNDPOS,
  major: GRUNDPOS,

  // Spanar av rummet. Upprätt, ena armen upp mot pannan.
  soker: {
    lut: 3, spets: 'bak', skift: [3, -1],
    armB: { cx: 26, cy: 97, w: 12, h: 25, rot: -12 },
    armF: { cx: 93, cy: 91, w: 13, h: 27, rot: 54 },
    fotB: { cx: 44, cy: 111, w: 24, h: 12, rot: -8 },
    fotF: { cx: 78, cy: 111, w: 26, h: 13, rot: 8 },
  },
  // Rycker till bakåt och pekar. Luvspetsen viner fram över hjässan.
  hittat: {
    lut: -6, spets: 'fram', skift: [4, -2],
    armB: { cx: 26, cy: 91, w: 12, h: 27, rot: -48 },
    armF: { cx: 97, cy: 88, w: 13, h: 31, rot: 76 },
    fotB: { cx: 42, cy: 111, w: 24, h: 12, rot: -14 },
    fotF: { cx: 80, cy: 110, w: 27, h: 13, rot: 14 },
  },
  // Står och väntar. Luvspetsen hänger slakt. Ena foten utåtvriden.
  vantar: {
    lut: 0, spets: 'slak', skift: [0, 1],
    armB: { cx: 27, cy: 98, w: 12, h: 25, rot: -6 },
    armF: { cx: 94, cy: 98, w: 12, h: 25, rot: 8 },
    fotB: { cx: 48, cy: 112, w: 23, h: 12, rot: -4 },
    fotF: { cx: 77, cy: 112, w: 26, h: 12, rot: 14 },
  },
  // Nöjd. Lutar bakåt, luvspetsen pigg uppåt.
  nojd: {
    lut: -5, spets: 'upp', skift: [1, -1],
    armB: { cx: 27, cy: 96, w: 12, h: 25, rot: -18 },
    armF: { cx: 94, cy: 96, w: 12, h: 27, rot: 16 },
    fotB: { cx: 46, cy: 112, w: 23, h: 12, rot: -10 },
    fotF: { cx: 78, cy: 111, w: 27, h: 12, rot: 16 },
  },
  // Tom sida. Vänd bort, tittar tillbaka över axeln på ingenting.
  tom: {
    lut: -2, spets: 'slak', skift: [-4, 0],
    armB: { cx: 27, cy: 98, w: 12, h: 26, rot: -4 },
    armF: { cx: 94, cy: 98, w: 12, h: 26, rot: 4 },
    fotB: { cx: 46, cy: 112, w: 23, h: 12, rot: -16 },
    fotF: { cx: 76, cy: 112, w: 26, h: 12, rot: 20 },
  },
  // 404. Böjd djupt fram och letar under något som inte finns.
  fyrafyra: {
    lut: 22, spets: 'fram', skift: [4, 2],
    armB: { cx: 29, cy: 88, w: 12, h: 29, rot: -62 },
    armF: { cx: 95, cy: 102, w: 13, h: 31, rot: 30 },
    fotB: { cx: 38, cy: 109, w: 24, h: 12, rot: -28 },
    fotF: { cx: 78, cy: 112, w: 27, h: 12, rot: 6 },
  },
};

/** De nio uttrycken, med den etikett de bär i produkten. */
export const UTTRYCK = {
  clean:    'Inga anmärkningar',
  minor:    'Brister',
  major:    'Brister som kvarstår',
  soker:    'Söker',
  hittat:   'Hittat något',
  vantar:   'Väntar',
  nojd:     'Nöjd',
  tom:      'Tom sida',
  fyrafyra: '404',
};

/* ============================================================== RITNING */

const n = (v) => (Math.round(v * 100) / 100).toString();

/** Rundad rektangel, poserbar. Duolingos eget verktyg för att böja en figur. */
function pill(p, fill) {
  const r = Math.min(p.w, p.h) / 2;
  return `<rect x="${n(p.cx - p.w / 2)}" y="${n(p.cy - p.h / 2)}" width="${p.w}"` +
    ` height="${p.h}" rx="${r}" fill="${fill}"` +
    ` transform="rotate(${p.rot} ${p.cx} ${p.cy})"/>`;
}

function prick([cx, cy, rx, ry], fill) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
}

/**
 * Ritar gårdsvätten.
 *
 * @param {object}  o
 * @param {number}  o.size      pixelstorlek, kvadratisk.
 * @param {string}  o.ton       'blue' | 'clean' | 'minor' | 'major'.
 * @param {string}  o.uttryck   nyckel ur UTTRYCK. Varje uttryck är en egen pose.
 * @param {boolean} o.siluett   hela figuren i #111, inget vitt, ingen skugga.
 * @param {boolean} o.ansikte   beskuren ansiktsvariant. För 40 px och mindre.
 * @param {string}  o.klass     sätts som class på svg-elementet.
 * @param {string}  o.titel     tillgänglighetstext. Tom = aria-hidden.
 * @returns {string} fristående svg-markup utan id, mask eller clipPath.
 */
export function figur({
  size = 160,
  ton = 'blue',
  uttryck = 'clean',
  siluett = false,
  ansikte = false,
  klass = '',
  titel = '',
} = {}) {
  const c = TONER[ton] || TONER.blue;
  const a = ANSIKTEN[uttryck] || ANSIKTEN.clean;
  const p = POSER[uttryck] || POSER.clean;

  // ETT byte färgar om hela figuren.
  const BAS = siluett ? '#111' : c.bas;
  const MORK = siluett ? '#111' : c.mork;
  const LJUS = siluett ? '#111' : c.ljus;

  const [sdx, sdy] = ansikte ? [0, 0] : p.skift;

  // Ansiktsgruppen. Luvan ritas SIST och skär av prickögonens överkant.
  const face =
    `<g transform="translate(${sdx} ${sdy})">` +
      `<path d="${NASA}" fill="${BAS}"/>` +
      (siluett ? '' : prick(a.bak, '#fff') + prick(a.fram, '#fff')) +
      (siluett ? '' :
        `<path d="${MUNNAR[a.mun]}" fill="none" stroke="#fff"` +
        ` stroke-width="${MUNTJOCKLEK}" stroke-linecap="round"/>`) +
      `<path d="${ansikte ? luvbanaBeskuren(a.kant) : luvbana(a.kant, p.spets)}"` +
        ` fill="${MORK}"/>` +
    `</g>`;

  const kropp = ansikte
    ? `<path d="${KROPP_HUVUD}" fill="${BAS}"/>${face}`
    : (siluett ? '' :
        `<rect x="${SKUGGA.x}" y="${SKUGGA.y}" width="${SKUGGA.w}"` +
        ` height="${SKUGGA.h}" rx="${SKUGGA.rx}" fill="${SKUGGFARG}"/>`) +
      pill(p.fotB, MORK) + pill(p.fotF, MORK) +
      `<g transform="rotate(${p.lut} 60 104)">` +
        pill(p.armB, BAS) +
        `<path d="${KROPP_HEL}" fill="${BAS}"/>` +
        `<path d="${FORKLADE}" fill="${LJUS}"/>` +
        pill(p.armF, BAS) +
        face +
      `</g>`;

  // Beskuret läge: huvudet fyller rutan kant i kant, som Duolingos app-ikon.
  // Konen är offrad, luvkanten går diagonalt tvärs över hela rutan.
  const vb = ansikte ? '36 22 72 72' : '0 0 120 120';
  const a11y = titel ? `role="img" aria-label="${titel}"`
                     : 'aria-hidden="true" focusable="false"';
  const cls = klass ? ` class="${klass}"` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"` +
    ` width="${size}" height="${size}"${cls} ${a11y}>${kropp}</svg>`;
}

export default figur;
