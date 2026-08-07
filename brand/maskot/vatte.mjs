/**
 * PRIKKOS MASKOT: GÅRDSVÄTTEN
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Gårdsvätten, alltså tomtegubben i sin URSPRUNGLIGA folkliga betydelse och
 * inte jultomten. Institutet för språk och folkminnen beskriver honom som ett
 * litet väsen som arbetade på gården, sopade, skötte djuren och höll ordning,
 * som KRÄVDE renlighet, straffade vanvård och slarv, och som belönade den som
 * skötte sig. Det är Prikkos affärsidé formulerad som svensk folktro,
 * hundratals år innan tjänsten fanns.
 *
 * ── Vad som ändrades i den här omritningen ────────────────────────────
 *
 * Version 1 av vätten ritades under MÄRKETS begränsningar: ögonvita och
 * pupill var förbjudna för att de slammar igen i 24 px. Resultatet överlevde
 * i 24 px och var dött i 200. Den här versionen ritar figuren FRI. Ögat är
 * byggt av fyra utbytbara delar och märket härleds efteråt.
 *
 * Och därmed öppnade sig figurens egna möjlighet, som ingen annan kandidat
 * på arket har:
 *
 *   MÖSSANS KANT ÄR ÖGONBRYNET. PERMANENT.
 *
 * Mössan sitter lågt ner i pannan och ritas SIST, ovanpå ögonen. Dess
 * underkant är fem styrhöjder tvärs över ansiktet, och två av dem ligger rakt
 * över var sitt öga. Sänker man mittpunkten dyker kanten ner mot näsroten och
 * figuren blir sträng. Höjer man den välver kanten upp och figuren blir vaken.
 * Sänker man bara den ena sidan blir figuren skeptisk. Skillnaden mellan
 * clean och major är i praktiken ETT TAL, och hela känsloregistret bor i fem.
 * Det är ett grepp med lång tradition i tecknad film och ingen annan kandidat
 * på arket har en form som kan bära det.
 *
 * ── De tre skälen till att version 1 föll, och svaren ─────────────────
 *
 * 1. "Den är inte ett djur." Går inte att rita bort. Svaret är att göra
 *    figuren så bra att invändningen blir en formalitet.
 * 2. "I rött läge läser den som jultomten." Det avgörande. Svaren, alla
 *    strukturella: INGET skägg, öron som sticker ut under luvan så att det
 *    läser som väsen och inte som gubbe, ingen vit mössbrätte och ingen
 *    tofs, ingen säck, arbetsförkläde i stället för rock, och luvan har
 *    ALDRIG egen färg. Den bär figurens egen mörka ton, alltså mörkblå i
 *    grundläge och mörkröd i rött. En röd luva med rosa förkläde och stora
 *    tecknade ögon är inte jultomten, den är samma väsen i rött ljus.
 * 3. "Luvan tog för mycket plats och tryckte ner ansiktet." Den långa konen
 *    är struken. Luvan är nu en tätsittande ARBETSMÖSSA med ett mörkt uppslag
 *    vid pannan och en kort SNÄRT bakåt. Den tar en tredjedel av den plats
 *    konen tog, och kanten arbetar i stället för att bara vila.
 *
 * ── Egenheten som överlevde ───────────────────────────────────────────
 *
 * En oberoende granskare skrev att luvspetsen som släpar bakåt när figuren
 * går och viner fram när den pekar var den enda idén på hela arket som gick
 * att minnas en vecka senare. Den är kvar som mössans SNÄRT, och den är nu
 * fyra ritade riktningar i stället för en roterad form.
 *
 * Rent SVG. Inga filter, inga masker, inga clipPath, inga id, noll gradient,
 * noll stroke utom munnen. Tjugo figurer kan ligga i samma dokument.
 *
 * Konstruktionsritningen med alla mått, ögonsystemets fyra delar namngivna
 * och hela uttryckstabellen: vatte-konstruktion.md
 */

/* ══ 0. KONTRAKT ═══════════════════════════════════════════════════════ */

export const META = {
  namn: 'Prikko, gårdsvätten',
  koncept:
    'Gårdsvätten ur svensk folktro, den som går runt och kräver ordning, ' +
    'ritad med luvkanten som permanent ögonbryn.',
  former: 23,   // former i grundposen, skuggan inräknad. Mätt, se RÄKNINGEN.
  farger: 6,    // bas, mörk, ljus, djup, vit, plus tillståndsneutral markgrå
  egenhet:
    'Mössans kant är ögonbrynet. Den dyker ner mot näsroten när han är ' +
    'sträng och välver upp när han är nöjd, och mössans snärt släpar bakåt ' +
    'när han går och viner fram i samma sekund han hittar något.',
  svaghet:
    'Det är inte ett djur, och det går inte att rita bort. Snärten är ' +
    'dessutom figurens mest utstickande form och äter siluettens marginal ' +
    'i toppen av rutan, alltså är den det första som måste kortas om ' +
    'figuren någon gång ska stå i en trängre ram.',
  raka: 0,      // antal raka linjekommandon L, H och V. Mätt, se RAKNING.
};

/** De nio uttrycken, med den etikett de bär i produkten. */
export const UTTRYCK = {
  clean: 'Inga anmärkningar',
  minor: 'Brister',
  major: 'Brister som kvarstår',
  soker: 'Söker',
  hittat: 'Hittat något',
  vantar: 'Väntar',
  nojd: 'Nöjd',
  tom: 'Tom sida',
  fyrafyra: '404',
};

export const GANG = { rutor: 8, halltid: [90, 70, 70, 110, 90, 70, 70, 110] };

/**
 * RÄKNINGEN, redovisad öppet och mätt i utdata och inte i huvudet.
 *
 * RAKA KOMMANDON: 0. Ingen bana i figuren innehåller L, H eller V. Alla
 * konturer är kubiska bezier härledda ur Catmull-Rom, alla lemmar är rect
 * med rx, alla pupiller och lock är circle, och munnen är ett A-kommando.
 * Ett rect och en circle har över huvud taget inga bankommandon och kan
 * därför inte bidra med ett hörn. Räkna själv:
 *
 *   node -e "import('./brand/maskot/vatte.mjs').then(m=>console.log(
 *     (m.figur({size:120}).match(/[LHVlhv]\s*[-\d.]/g)||[]).length))"
 *
 * FORMER i grundposen: 23, i ritordning.
 *    1 skugga            9 öra fram          17 pupill fram
 *    2 fot bak          10 huvud             18 underlock bak
 *    3 fot fram         11 inneröra bak      19 underlock fram
 *    4 arm bak          12 inneröra fram     20 mössan
 *    5 hand bak         13 ögonvita bak      21 mössans uppslag
 *    6 bål              14 ögonvita fram     22 arm fram
 *    7 förkläde         15 pupill bak        23 hand fram
 *    8 öra bak          16 mun
 *
 * Ögonlocken är två former till och ritas i stället för underlocken i de
 * uttryck som har dem, alltså är 23 också taket.
 *
 * FÄRGER: 6. Bas, mörk, ljus och djup är alla härledda ur tonens egen
 * grundfärg, plus vitt och en tillståndsneutral markgrå till skuggan.
 */

/* ══ 1. PROPORTIONER OCH FÖRBUD ════════════════════════════════════════ */

/** Uppmätta i den färdiga 120-rutan. Läs dem som lag. */
export const PROPORTIONER = [
  'Marken ligger på y 116. Figuren står från y 5 till y 116, mössans snärt inräknad.',
  'Huvudet är 61 brett och 52 högt, x 29..90, y 26..78. Bålen är 51 bred, x 35..86, y 73..109.',
  'Huvudet är alltså bredare än kroppen och nästan lika högt. Det är avsiktligt och det är samma grepp som Duo.',
  'Ögonvitorna är 18,4 och 21,2 enheter breda, alltså 30 och 35 procent av huvudets bredd per öga. Duos är 31,6.',
  'Ögonen sitter ISÄR med 6,2 enheters mellanrum och är OLIKA STORA. Det är vårt avstånd till Duos två lika cirklar i gemensam mask.',
  'Pupillen är 52 procent av ögats bredd och sitter ALDRIG vertikalt centrerad, alltid under mitten.',
  'Munnen är 15 enheter bred i clean, alltså 25 procent av huvudets bredd. Märkets nuvarande är 38 procent, Duos näbb 11,9.',
  'Mössans kant styrs av fem y-värden vid x 33, 47, 60, 73 och 87. Talen vid 47 och 73 ligger rakt över ögonen.',
  'Kanten skär aldrig under y 56 och aldrig över y 26. Utanför det spannet tappar ögonen sin plats.',
  'Mössans kalott går fem till sex enheter UTANFÖR huvudets kontur. Det är den marginalen som gör den till ett plagg och inte till hår.',
  'Mössans fästen ligger fem enheter INNANFÖR huvudets kontur, så att en remsa av huvudets egen färg syns utanför kanten.',
  'Snärtens spets når aldrig längre bak än x 8 och aldrig högre än y 0.',
  'Öronen sticker ut under kanten på båda sidor. Det är figurens enskilt starkaste avstånd till jultomten.',
  'En fot i taget bär tyngden. Den andra är vinklad eller lyft.',
];

/** Bryts en av dessa är figuren inte längre vår. */
export const FORBJUDET = [
  'Aldrig jultomte. Ingen vit mössbrätte, ingen tofs, ingen säck, ingen rock, ingen gran.',
  'Aldrig skägg. Skägget äter ansiktet, gör figuren gammal och långsam, och drar rakt mot jultomten.',
  'Aldrig egen färg på luvan. Luvan bär alltid figurens egen mörka ton och byter kulör med tillståndet.',
  'Aldrig rött som figurens vilofärg. Rött är en tillståndsfärg och inget annat.',
  'Aldrig keramikträdgårdstomte eller Roaming Gnome. Ingen spade, ingen svamp, inga rougekinder.',
  'Aldrig förstoringsglas, rutig hatt eller kappa. Detektiv läses ur hållning och blick.',
  'Aldrig vertikalt centrerad pupill, och aldrig två lika stora ögon i en gemensam ögonmask.',
  'Aldrig symmetrisk grundställning rakt framifrån med fötterna ihop.',
  'Aldrig gradient, aldrig stroke på kroppen, aldrig oval skugga.',
];

/**
 * SUBTRAKTIONER. Vad vätten INTE har fastän man förväntar sig det.
 *  - Inget skägg. Det uppenbara bortvalet, och det som gör honom snabb.
 *  - Ingen vit mössbrätte. Den enda detaljen som ensam kan läsa som jul.
 *  - Inga ben. Två fotpiller under förklädet, som Duo. Ger fri posering.
 *  - Ingen glansdagg i pupillen. Duo har den inte, och den är en av de
 *    säkraste markörerna för AI-genererad maskotdesign.
 */

/* ══ 2. FÄRG ═══════════════════════════════════════════════════════════ */

/** Prikkos fyra kulörer. Mörk ton är Prikkos egen, inte uträknad. */
export const PALETT = {
  blue:  { bas: '#007BE0', mork: '#0063B4' },
  clean: { bas: '#00B92B', mork: '#009523' },
  minor: { bas: '#FECB00', mork: '#DEB201' },
  major: { bas: '#EB0000', mork: '#C50000' },
};

const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hs = (a) => '#' + a.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const ljusare = (c, t) => hs(hx(c).map((v) => v + (255 - v) * t));
const morkare = (c, t) => hs(hx(c).map((v) => v * (1 - t)));

/**
 * Ett byte färgar om hela figuren. Inga påhittade kulörer: ljus ton är basen
 * blandad mot vitt, djup ton är basen mörknad mot svart.
 *
 * DJUP är pupillens färg och den finns av ett skäl. En pupill i mörk ton har
 * för svag kontrast mot ögonvitan i gult läge, där mörk ton är #DEB201. Djup
 * ton av gult är #473900, alltså mörkbrunt, och det bär. Pupillen är därmed
 * alltid tonens egen djupaste ton och aldrig en importerad svart.
 */
function toner(ton) {
  const p = PALETT[ton] || PALETT.blue;
  return {
    bas: p.bas,
    mork: p.mork,
    ljus: ljusare(p.bas, 0.46),
    djup: morkare(p.bas, 0.74),
  };
}

/** Skuggan är tillståndsneutral. Den är mark, inte figur. */
const SKUGGFARG = '#D7DDE4';

/* ══ 3. RUNDHETENS VERKTYG ═════════════════════════════════════════════
 *
 * Provet som fällde tidigare kandidater var antalet raka linjekommandon.
 * Här finns inga. Två verktyg räcker för hela figuren, och båda bygger
 * kurvor där varje skarv är tangentkontinuerlig av konstruktion, alltså
 * där kurvan går över i nästa utan att byta riktning. Det går inte att få
 * ett hörn någonstans, hur mycket punkterna än flyttas, och det är därför
 * figuren tål att poseras vidare utan att bli kantig igen.
 */

/* Två decimaler och inte en. Rundningsfelet hamnar annars i kontrollpunkterna,
 * och en kontrollarm på två enheter tappar då upp emot sex grader tangent. */
const P = (a) => `${+a[0].toFixed(2)} ${+a[1].toFixed(2)}`;

/**
 * SLUTEN mjuk kurva genom en punktlista. Catmull-Rom omräknad till kubiska
 * bezier: runt punkten p1 blir kontrollpunkterna p1 ± (p2−p0)·s, alltså två
 * punkter på SAMMA linje genom p1. Tangentkontinuiteten är inbyggd.
 */
function mjuk(pts, spanning = 1) {
  const n = pts.length;
  const at = (i) => pts[((i % n) + n) % n];
  const s = spanning / 6;
  let d = `M${P(at(0))}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d +=
      `C${P([p1[0] + (p2[0] - p0[0]) * s, p1[1] + (p2[1] - p0[1]) * s])}` +
      ` ${P([p2[0] - (p3[0] - p1[0]) * s, p2[1] - (p3[1] - p1[1]) * s])} ${P(p2)}`;
  }
  return d + 'Z';
}

/**
 * ÖPPET kurvsegment genom en punktlista, utan inledande M. Ändpunkternas
 * saknade grannar speglas, så segmentet börjar och slutar med en naturlig
 * tangent i stället för att plana ut.
 *
 * Används för luvans kant och kon, som byggs av flera segment i följd.
 * Skarven mellan två segment får en SPETS om och endast om grannpunkterna
 * ligger på olika sidor, vilket är precis vad luvspetsen ska ha och inget
 * annat ställe i figuren har.
 */
function segment(pts, spanning = 1) {
  const n = pts.length;
  const s = spanning / 6;
  const at = (i) => {
    if (i < 0) return [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]];
    if (i > n - 1) return [2 * pts[n - 1][0] - pts[n - 2][0], 2 * pts[n - 1][1] - pts[n - 2][1]];
    return pts[i];
  };
  let d = '';
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d +=
      `C${P([p1[0] + (p2[0] - p0[0]) * s, p1[1] + (p2[1] - p0[1]) * s])}` +
      ` ${P([p2[0] - (p3[0] - p1[0]) * s, p2[1] - (p3[1] - p1[1]) * s])} ${P(p2)}`;
  }
  return d;
}

/* ══ 4. KROPPEN ════════════════════════════════════════════════════════
 *
 * Huvudet och bålen är två banor och inte en. Det kostar en form och köper
 * gångcykeln: huvudet måste kunna släpa EN RUTA efter kroppen, och det är
 * den eftersläpningen som ger figuren tyngd. En sammanbyggd bana kan inte
 * göra det.
 */

/** HUVUDET. Bredast strax över mitten, kvartsvridet så att framsidan, alltså
 *  höger, är fylligare än baksidan. Ingen hjässa i egentlig mening: luvan
 *  äger den övre tredjedelen och huvudet behöver bara nå upp under kanten. */
const HUVUD = mjuk([
  [58, 26], [75, 29], [87, 40], [90, 53], [84, 67],
  [72, 76], [57, 78], [43, 75], [33, 65], [29, 52], [32, 38], [44, 28],
], 0.94);

/** BÅLEN. Päronformad, tyngdpunkten lågt, ingen midja. Bredast vid y 94.
 *  Underkanten stannar på y 107 så att fötterna syns nedanför i stället för
 *  att gömma sig bakom bålen, vilket var varv 1:s fel. */
const KROPP = mjuk([
  [60, 73], [74, 77], [84, 88], [86, 98], [78, 106],
  [60, 109], [43, 107], [35, 98], [37, 88], [47, 77],
], 0.95);

/** FÖRKLÄDET. Arbetskläder, inte julrock. Urringningen dippar i mitten så att
 *  det läses som ett plagg och inte som en bräda figuren håller framför sig.
 *  Det är den enda ljusa ytan på kroppen och därmed det som säger arbete.
 *  Smalare än varv 1: täckte den nästan hela bålen försvann kroppsfärgen och
 *  figuren blev en ljus klump med mörka kanter. */
const FORKLADE = mjuk([
  [51, 86], [60, 92], [70, 85], [77, 94], [76, 103],
  [68, 108], [53, 109], [45, 103], [44, 94],
], 0.92);

/**
 * ÖRONEN. Vättens viktigaste anti-jultomte, och det är inte en dekoration.
 * En gubbe med luva och utan öron är jultomten. Ett väsen med spetsiga öron
 * som sticker ut under luvkanten är något annat, och det avgörs inom en
 * tiondels sekund.
 *
 * Örat måste därför ha en riktig SPETS, och en sluten mjuk kurva kan inte ge
 * en spets. Alltså byggs det av två segment som möts i spetspunkten, precis
 * som luvan. Basen ligger inne i huvudet och syns aldrig.
 */
function spetsform(bas1, mitt1, spets, mitt2, bas2) {
  return `M${P(bas1)}` + segment([bas1, mitt1, spets], 0.88) +
    segment([spets, mitt2, bas2], 0.88) + segment([bas2, bas1], 1) + 'Z';
}
const ORA_F = spetsform([85, 50], [93, 47], [101, 43], [96, 57], [86, 63]);
const ORA_B = spetsform([35, 49], [28, 46], [20, 43], [25, 56], [35, 62]);
/** Innerörat i MÖRK ton och inte ljus. En ljus fläck inne i örat läser som en
 *  reflex eller en fläck. En mörk läser som skugga, alltså som djup, och det
 *  är det som gör att formen entydigt blir ett öra. */
const INNER_F = spetsform([88, 52], [94, 50], [99, 47], [95, 56], [89, 59]);
const INNER_B = spetsform([33, 51], [28, 49], [23, 47], [27, 55], [33, 58]);

/*
 * NÄSAN ÄR STRUKEN, och skälet är värt att skriva ned.
 *
 * Fyra varv, fyra placeringar, samma utfall varje gång: en bula i huvudets
 * EGEN färg på huvudets EGEN kontur läser som en KIND och inte som en näsa,
 * och gjord stor nog att inte göra det läste den i stället som en lös flik.
 *
 * Figuren blev omedelbart bättre utan den, och orsaken går att säga rakt ut:
 * ansiktet har redan fyra starka drag, alltså mössans kant, öronen, ögonen
 * och munnen. En näsa i samma färg som huvudet kan inte konkurrera med något
 * av dem, men den konkurrerar ändå om platsen. Duo har heller ingen näsa,
 * och det är samma bortval av samma skäl.
 */

/** SKUGGAN. Pillerform, aldrig oval. Ovaler antyder perspektiv. */
const SKUGGA = { x: 31, y: 112, w: 58, h: 7 };

/* ══ 5. ÖGONSYSTEMET, FYRA DELAR ═══════════════════════════════════════
 *
 * Det här är uppdraget och inte en detalj. Delarna, namngivna:
 *
 *   1. ÖGONVITAN   en form, inte en cirkel. Åtta punkter med små avvikelser,
 *                  så att den läser som ett öga och inte som en boll. Det
 *                  bakre ögat är spegelvänt så att de två inte är samma form
 *                  två gånger.
 *   2. PUPILLEN    en solid cirkel i tonens djupaste ton, fritt flyttbar inom
 *                  ögonvitan. Aldrig vertikalt centrerad. Konvergerar svagt
 *                  inåt mot den andra pupillen.
 *   3. ÖGONLOCKET  en cirkel i KROPPENS färg som skär in över ögonvitan
 *                  uppifrån. Eftersom locket har huvudets färg behövs ingen
 *                  mask: det som hamnar utanför ögat försvinner in i huvudet.
 *                  Lockets vinkel gör det finstämda arbetet, dess nivå det
 *                  grova. Ett underlock kan dessutom trycka upp ögat
 *                  underifrån, vilket är hur ett äkta leende ser ut.
 *   4. BRYNET      LUVKANTEN. Se avsnitt 6. Den är permanent, den är ritad
 *                  i mörk ton, och den är figurens hela idé.
 */

/** Ögonvitans form. Nästan en cirkel, men bara nästan: övre yttre kvadranten
 *  är fylligare och nedre inre stramare. Skillnaden är under sex procent av
 *  radien och syns aldrig medvetet, men den är skillnaden mellan ett öga och
 *  en boll. */
const VITFORM = [
  [0.02, -1.00], [0.78, -0.72], [1.00, 0.02], [0.70, 0.74],
  [-0.04, 1.00], [-0.70, 0.68], [-0.96, -0.06], [-0.74, -0.74],
];

/** Ögonens geometri. Bortre ögat är MINDRE, det är kvartsvridningen. */
const OGON = {
  bak:  { x: 47, y: 55, rx: 9.2, ry: 10.2, spegel: -1 },
  fram: { x: 73, y: 54, rx: 10.6, ry: 11.6, spegel: 1 },
};

function vitaBana(o) {
  return mjuk(VITFORM.map(([u, v]) => [o.x + u * o.rx * o.spegel, o.y + v * o.ry]), 0.96);
}

/**
 * PUPILLEN. `blick` är gemensam för båda ögonen, `KONVERGENS` drar dem mot
 * varandra. Duolingos egen skrivna regel är att en vertikalt centrerad pupill
 * gör figuren obehaglig, och deras egen sitter nästan mot ögats underkant i
 * helkroppsläget. Vår vilar på 0,30 av ögats halva höjd nedanför mitten och
 * går aldrig över noll.
 */
const KONVERGENS = 0.13;
const PUPILL_ANDEL = 0.52;   // av ögats bredd. Duos är 47,5 procent.

function pupill(o, blick, skala, farg) {
  const inat = o.spegel > 0 ? -KONVERGENS : KONVERGENS;
  const x = o.x + (blick[0] + inat) * o.rx * 0.72;
  const y = o.y + Math.max(0.14, blick[1]) * o.ry * 0.92;
  const r = o.rx * PUPILL_ANDEL * skala;
  return `<circle cx="${+x.toFixed(2)}" cy="${+y.toFixed(2)}" r="${+r.toFixed(2)}" fill="${farg}"/>`;
}

/**
 * ÖGONLOCKET. En cirkel med 1,18 gånger ögats radie, förskjuten uppåt så att
 * dess underkant hamnar på önskad nivå, och sedan roterad kring ögats mitt.
 *
 * Radien är avsiktligt STÖRRE än ögats. Ett lock med exakt ögats radie ger
 * en kant som följer ögats egen rundning och därför läser som om ögat bara
 * krympt. En något flackare kant läser som ett lock som lagts över.
 *
 *   niva   0 = locket tangerar ögats topp, alltså osynligt.
 *          1 = locket når ögats botten, alltså helt slutet öga.
 *   vinkel grader. Positivt lutar lockets inre ände NEDÅT, alltså arg.
 *          Speglat mellan ögonen så att båda lutar mot näsroten.
 */
function lock(o, niva, vinkel, farg) {
  if (niva <= 0.001) return '';
  const R = o.rx * 1.18;
  const under = o.y - o.ry + niva * 2 * o.ry;
  const cy = under - R;
  const v = vinkel * (o.spegel > 0 ? 1 : -1);
  const rot = v ? ` transform="rotate(${+v.toFixed(1)} ${o.x} ${o.y})"` : '';
  return `<circle cx="${o.x}" cy="${+cy.toFixed(2)}" r="${+R.toFixed(2)}" fill="${farg}"${rot}/>`;
}

/** UNDERLOCKET. Trycker upp ögat underifrån. Det är vad som skiljer ett
 *  artigt leende från ett äkta: i ett äkta går kinden upp och kniper ögat.
 *  Samma cirkel, samma färg, spegelvänd. */
function underlock(o, niva, farg) {
  if (niva <= 0.001) return '';
  const R = o.rx * 1.3;
  const over = o.y + o.ry - niva * 2 * o.ry;
  return `<circle cx="${o.x}" cy="${+(over + R).toFixed(2)}" r="${+R.toFixed(2)}" fill="${farg}"/>`;
}

/* ══ 6. LUVAN, ALLTSÅ BRYNET ═══════════════════════════════════════════
 *
 * Luvan är EN bana och gör TVÅ saker. Konen är figurens siluett och dess
 * spets är visaren. Kanten är ögonbrynet, och den ritas sist så att den
 * också skär in över ögonvitan uppifrån.
 *
 * Kanten är fem y-värden vid fasta x, och de fem x-lägena är valda så att
 * varje tal betyder något man kan säga högt:
 *
 *   x 33   luvans bakre fäste, INNANFÖR huvudets bakkant
 *   x 47   BRYNET ÖVER DET BAKRE ÖGAT      (ögat sitter på x 47)
 *   x 60   NÄSROTEN, mellan ögonen
 *   x 73   BRYNET ÖVER DET FRÄMRE ÖGAT     (ögat sitter på x 73)
 *   x 87   luvans främre fäste, INNANFÖR huvudets framkant
 *
 * Nio uttryck skiljer sig alltså åt i fem tal, och talen är läsbara: sänk
 * näsroten under brynen och kanten blir ett V, alltså sträng. Höj den och
 * kanten välver, alltså vaken. Sänk bara det bakre brynet och figuren blir
 * skeptisk. Sänk allt och figuren blir tung och trött.
 */
const KX = [33, 47, 60, 73, 87];

/**
 * KONEN, fyra ritade riktningar. En roterad spets ser påklistrad ut, alltså
 * ritas varje riktning för sig. `p` är spetsen, `a` är vägen dit och `b`
 * vägen tillbaka. `vand` säger om konen ritas bakifrån och fram.
 *
 * Spetsen är figurens EGENHET och inte en dekoration: den släpar bakåt när
 * vätten är på väg, viner fram och pekar i samma sekund han hittar något,
 * står pigg upp när han är nöjd och hänger slak när han väntar.
 *
 * ── Varför det inte längre är en toppluva ─────────────────────────────
 *
 * Två varv ritades konen som en riktig tomteluva, alltså med hela pannlinjen
 * som bas. Det gick inte, och skälet är räknebart. Basen är 64 enheter bred,
 * och för att en kon ska LÄSA som en kon måste spetsen ligga minst lika
 * långt bort som basen är bred. Det finns inte i en 120-ruta där huvudet
 * redan tagit 52 enheter i höjd. Resultatet blev en bred platt flik som ögat
 * läste som en FRISYR, båda gångerna, och det var samma invändning som fällde
 * varv 1 av hela figuren.
 *
 * Luvan är därför nu en tätsittande arbetsmössa som följer hjässans rundning
 * med tolv enheters marginal, plus en SNÄRT som skjuter ut bakåt. Snärten är
 * kort och smal, alltså en accent i stället för figurens huvudform, och den
 * gör exakt samma jobb som den långa konen gjorde: den pekar.
 *
 * Bytet vinner tre saker och kostar en. Det vinner att mössan är entydigt ett
 * plagg, att ansiktet får tillbaka den plats luvan tog, och att jultomten
 * försvinner helt, eftersom jultomtens luva ÄR den långa slaka konen. Det
 * kostar att figuren är mindre omedelbart folkloristisk, vilket är ett pris
 * värt att betala när alternativet inte fungerade.
 */
const SPETSAR = {
  /* Grundläget. Snärten släpar bakåt av farten. */
  bak: {
    vand: false,
    a: [[95, 45], [96, 33], [88, 20], [66, 12], [42, 14], [26, 21]],
    p: [8, 12], b: [[19, 24], [26, 34], [30, 43]],
  },
  /* Viner fram och pekar ut över näsan. Används när han hittat något. */
  fram: {
    vand: true,
    a: [[26, 45], [25, 32], [33, 19], [52, 12], [74, 13], [92, 20]],
    p: [110, 26], b: [[96, 33], [95, 45]],
  },
  /* Pigg, nästan rakt upp. Snärten reser sig i stället för att släpa. */
  upp: {
    vand: false,
    a: [[95, 45], [96, 32], [90, 19], [83, 9]],
    p: [74, 0], b: [[59, 12], [41, 15], [26, 25], [30, 43]],
  },
  /* Hänger tungt ner bakom nacken. Ingen fart, ingen riktning. */
  slak: {
    vand: false,
    a: [[95, 45], [96, 33], [88, 20], [64, 12], [38, 17], [24, 30]],
    p: [9, 48], b: [[21, 47]],
  },
};

/**
 * LUVANS UPPSLAG. Ett band lagt ovanpå luvans underkant, i tonens DJUPASTE
 * ton, alltså samma färg som pupillen.
 *
 * Det här är svaret på varv 2:s allvarligaste invändning: luvan läste som en
 * FRISYR och inte som ett plagg. Skälet var att en enfärgad mörk massa ovanpå
 * ett huvud är precis vad hår är. Det som gör ett plagg till ett plagg är att
 * det har en KANT, alltså en synlig avslutning där tyget viks.
 *
 * Bandet har tre jobb på en gång:
 *   1. Det gör luvan till en mössa i stället för en lugg.
 *   2. Det gör brynet till figurens mörkaste form, vilket är precis vad ett
 *      ögonbryn är i ett verkligt ansikte.
 *   3. Det lägger ett tredje värde i huvudet, vilket är exakt det märkets
 *      kontrastproblem saknar.
 *
 * Färgvalet är inte fritt. Ett LJUST band hade läst som jultomtens vita
 * brätte i rött läge, och i gråskala hade det varit omöjligt att skilja från
 * päls. Ett band mörkare än luvan kan aldrig göra det.
 *
 * Tjockleken smalnar till nästan noll i båda ändarna, så att bandet slutar
 * exakt där luvans kant slutar och aldrig visar en avhuggen ände.
 */
const BAND_T = [1.0, 6.0, 6.8, 6.4, 1.0];

function luvband(k) {
  const inre = KX.map((x, i) => [x, k[i]]);
  const over = inre.map(([x, y], i) => [x, y - BAND_T[i]]);
  return `M${P(inre[0])}` + segment(inre, 0.95) + segment([inre[4], over[4]], 1) +
    segment([...over].reverse(), 0.95) + segment([over[0], inre[0]], 1) + 'Z';
}

function luvbana(k, spets) {
  const S = SPETSAR[spets] || SPETSAR.bak;
  const kant = KX.map((x, i) => [x, k[i]]);
  const A = kant[4], B = kant[0];
  if (S.vand) {
    // bakifrån upp till spetsen, fram till kantens framände, kanten bakåt
    return `M${P(B)}` + segment([B, ...S.a, S.p], 0.92) + segment([S.p, ...S.b, A], 0.92) +
      segment([...kant].reverse(), 0.95) + 'Z';
  }
  return `M${P(A)}` + segment([A, ...S.a, S.p], 0.92) + segment([S.p, ...S.b, B], 0.92) +
    segment(kant, 0.95) + 'Z';
}

/**
 * Luvkanten i BESKURET läge, alltså när ansiktet är beskuret för märket.
 * Konen är offrad precis som Duolingos app-ikon offrar kropp och vingar,
 * men KANTEN är kvar, eftersom kanten är hela uttrycket. Fältet ovanför
 * kanten går ut ur rutan åt alla håll, och även det är byggt av kurvor så
 * att räkningen av raka kommandon förblir noll.
 */
function luvbanaBeskuren(k) {
  const kant = KX.map((x, i) => [x, k[i]]);
  return `M${P([-40, k[0] - 6])}` + segment([[-40, k[0] - 6], ...kant, [160, k[4] - 4]], 0.95) +
    segment([[160, k[4] - 4], [160, -60], [-40, -60], [-40, k[0] - 6]], 1) + 'Z';
}

/* ══ 7. MUNNEN ═════════════════════════════════════════════════════════
 *
 * Geometrin är Prikkos och inte vättens, och den bor i brand/maskot-mun.mjs.
 * Munnen räknas som en RIKTIG cirkelbåge med konstant radie, alltså ett
 * A-kommando, och inte som en bezier som nästan är en cirkel.
 *
 * Det nya är BREDDEN. Munnen har hittills varit 38 procent av märkets bredd
 * eftersom den ensam bar bedömningen. Nu bär luvkanten och ögonen den, och
 * munnen får krympa till 20 procent av huvudets bredd, alltså 14 enheter.
 * Det är fortfarande nästan dubbelt mot Duos näbb.
 *
 * ── Felet som varv 1 gjorde, och som är värt att skriva ned ───────────
 *
 * Märkets radie är 31,8 procent av RUTANS bredd, och dess mun är 38,3
 * procent av samma ruta. Kvoten radie genom bredd är alltså 0,83, och det
 * är kvoten som bestämmer bågens FORM. Varv 1 behöll radien i rutans mått
 * men krympte munnen till 14 enheter. Kvoten sköt då upp till 2,7 och
 * pilhöjden föll till under en enhet: munnen blev ett rakt streck.
 *
 * Rätt storhet att hålla när munnen byter SKALA är alltså kvoten, inte
 * radien. Håller man radien när bredden krymper gör man exakt samma fel
 * baklänges som när man håller pilhöjden och ökar bredden.
 *
 * Kvoten här är 0,62 och inte märkets 0,83, alltså en rundare mun än
 * märkets. Det är ett medvetet val: en liten mun behöver mer krökning för
 * att läsa som en båge alls, och maskot-mun.mjs har redan namnet `rundare`
 * på i stort sett detta värde.
 */
/* eslint-disable-next-line import/first */
import { pilhojd } from '../maskot-mun.mjs';

const MUN_MITT = [63, 67];
const MUN_KVOT = 0.62;   // radie genom bredd. Ger pilhöjd 25,2 procent av bredden.
const MUN_SW = 4.3;

/**
 * En cirkelbåge. `r` är riktningen som andel av full pilhöjd: 1 är helt glad,
 * negativ är ledsen, nära noll är tveksam. `lut` är asymmetrin. Duolingos
 * egen regel är att munnen ska favorisera ena sidan eftersom en perfekt
 * symmetrisk mun läser som ett tecken och inte som ett ansikte.
 */
function munbage([cx, cy], b, r, lut) {
  const h = pilhojd(b, b * MUN_KVOT) * r;
  const dy = Math.tan((lut * Math.PI) / 180) * (b / 2);
  const x1 = cx - b / 2, x2 = cx + b / 2;
  const y1 = cy - h / 2 - dy, y2 = cy - h / 2 + dy;
  const hh = Math.abs(h);
  const R = hh < 0.02 ? b * 40 : hh / 2 + (b * b) / (8 * hh);
  /* SWEEP. Mätt i en renderad bild och inte antaget. Med start till vänster
   * och slut till höger går sweep 1 medurs över bågens TOPP, alltså uppåt,
   * alltså ledsen. Glad kräver sweep 0. Kommentaren i maskot-mun.mjs påstår
   * motsatsen och den modulens egen baraMunnen() ritar därför de tre
   * bedömningarna spegelvänt. Det är rapporterat separat. */
  const sweep = h >= 0 ? 0 : 1;
  return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${R.toFixed(2)} ${R.toFixed(2)} 0 0 ${sweep} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/** b = bredd i enheter, r = riktning, lut = grader, rund = fylld oval i stället. */
const MUNNAR = {
  glad:   { b: 15, r: 1.00, lut: 4 },
  bred:   { b: 17, r: 1.00, lut: 3 },
  kink:   { b: 12, r: -0.18, lut: 11 },
  streng: { b: 14, r: -0.85, lut: 2 },
  rak:    { b: 11, r: -0.10, lut: 2 },
  smal:   { b: 9,  r: 0.40, lut: 7 },
  oj:     { b: 8,  r: -0.55, lut: 5 },
  oh:     { rund: [6.2, 7.6] },
};

function munform(nyckel, mitt, farg) {
  const m = MUNNAR[nyckel] || MUNNAR.rak;
  if (m.rund) {
    // Öppen mun. En fylld oval, aldrig en hålighet med tänder eller tunga.
    return `<path d="${mjuk(VITFORM.map(([u, v]) => [mitt[0] + u * m.rund[0], mitt[1] + v * m.rund[1]]), 0.96)}" fill="${farg}"/>`;
  }
  return `<path d="${munbage(mitt, m.b, m.r, m.lut)}" fill="none" stroke="${farg}"` +
    ` stroke-width="${MUN_SW}" stroke-linecap="round"/>`;
}

/* ══ 8. UTTRYCKEN ══════════════════════════════════════════════════════
 *
 * Nio uttryck. Varje är fem tal för luvkanten, två lock, en blick och en mun.
 * Kropp och pose ligger separat i POSER, så att ansikte och kropp går att
 * ändra oberoende av varandra.
 *
 *   kant   luvkantens fem y-värden vid x 18, 38, 58, 78 och 102
 *   lockB  [niva, vinkel] för bortre ögat
 *   lockF  [niva, vinkel] för främre ögat
 *   under  underlockets nivå, gemensam. Noll = av.
 *   blick  [vågrätt, lodrätt] pupillens läge. Lodrätt är alltid positivt.
 *   pupill pupillens skala. Under 1 = chock, över 1 = mjukhet.
 *   mun    nyckel i MUNNAR
 *   munny  munnens förskjutning från MUN_MITT
 */
const ANSIKTEN = {
  /* De tre bedömningarna. Kanten gör hela arbetet och ögonen följer med.
     Läs talen som [bakfäste, brynBak, näsrot, brynFram, framfäste]. */
  clean: {
    // Näsroten HÖGST, alltså kanten välver. Öppen och vaken.
    kant: [50, 42, 35, 40, 49], lockB: [0, 0], lockF: [0, 0], under: 0.20,
    blick: [0.22, 0.42], pupill: 1, mun: 'bred', munny: [0, 0],
  },
  minor: {
    // Skepsis. Bakre brynet dyker, främre lyfter. Ett halvt lock på det bakre.
    kant: [51, 52, 44, 34, 42], lockB: [0.34, -7], lockF: [0.06, 3], under: 0,
    blick: [0.30, 0.38], pupill: 0.98, mun: 'kink', munny: [-1, 1],
  },
  major: {
    // Stränghet. Näsroten LÄNGST NER, alltså kanten blir ett V som skär in
    // över ögonens insidor. Ett enda tal skiljer den från clean.
    kant: [45, 46, 56, 50, 44], lockB: [0.08, 6], lockF: [0.10, 8], under: 0,
    blick: [0.20, 0.34], pupill: 1.04, mun: 'streng', munny: [-1, 3],
  },

  /* Arbetslägen. */
  soker: {
    // Koncentration. Kanten stram och hög, blicken långt ut åt sidan.
    kant: [46, 39, 35, 38, 47], lockB: [0.16, 2], lockF: [0.10, 3], under: 0.10,
    blick: [0.52, 0.26], pupill: 0.96, mun: 'smal', munny: [1, 1],
  },
  hittat: {
    // Ryck. Kanten flyger upp, ögonen maximalt öppna, pupillerna KRYMPER.
    // Att pupillen blir mindre i förvåning är det billigaste och starkaste
    // knepet i hela tecknarhantverket.
    kant: [41, 31, 27, 30, 40], lockB: [0, 0], lockF: [0, 0], under: 0,
    blick: [0.34, 0.30], pupill: 0.72, mun: 'oh', munny: [1, 2],
  },
  vantar: {
    // Tristess. Kanten låg och platt, locken halvvägs, blicken bortåt.
    kant: [54, 54, 53, 52, 52], lockB: [0.48, 1], lockF: [0.52, 1], under: 0,
    blick: [-0.26, 0.30], pupill: 1, mun: 'rak', munny: [-2, 1],
  },
  nojd: {
    // Äkta leende. Underlocket trycker upp ögonen underifrån.
    kant: [49, 41, 36, 39, 48], lockB: [0, 0], lockF: [0, 0], under: 0.44,
    blick: [0.16, 0.30], pupill: 1.04, mun: 'glad', munny: [0, 1],
  },
  tom: {
    // Ingenting att granska. Blicken går bakåt, ut ur bilden.
    kant: [52, 48, 46, 47, 52], lockB: [0.22, 0], lockF: [0.26, 0], under: 0,
    blick: [-0.42, 0.38], pupill: 1, mun: 'rak', munny: [-3, 0],
  },
  fyrafyra: {
    // Letar efter något som inte finns. Blicken ner, kanten hopdragen.
    kant: [47, 47, 51, 45, 41], lockB: [0.08, 4], lockF: [0.06, 5], under: 0,
    blick: [0.26, 0.62], pupill: 1, mun: 'oj', munny: [1, 2],
  },
};

/* ══ 9. POSER ══════════════════════════════════════════════════════════
 *
 * Armar och fötter är rect med rx, exakt det verktyg Duolingo anger för att
 * böja en figur, och de har inga bankommandon alls. Händerna är cirklar.
 * Fötterna ligger UTANFÖR lutningsgruppen så att bålen kan luta framåt utan
 * att fötterna glider med.
 *
 *   lut     bålens lutning i grader kring (60, 106). Positivt = framåt.
 *   hskift  huvudgruppens förskjutning
 *   hvrid   huvudgruppens rotation kring (60, 46)
 */
const GRUND = {
  lut: 4, hskift: [1, 0], hvrid: -3, spets: 'bak',
  armB: { cx: 36, cy: 90, w: 12, h: 27, rot: -18 }, handB: { cx: 32, cy: 101, r: 6.6 },
  armF: { cx: 85, cy: 89, w: 12, h: 27, rot: 24 },  handF: { cx: 90, cy: 100, r: 6.6 },
  fotB: { cx: 47, cy: 110, w: 22, h: 11, rot: -13 },
  fotF: { cx: 75, cy: 112, w: 25, h: 11, rot: 6 },
};

const POSER = {
  /* De tre bedömningarna delar EXAKT samma kropp. Bara ansiktet skiljer, och
   * det är hela poängen: bedömningen bärs av luvkanten, inte av posen. */
  clean: GRUND,
  minor: GRUND,
  major: GRUND,

  /* Spanar av rummet. Upprätt, främre handen upp mot pannans kant. */
  soker: {
    lut: 1, hskift: [2, -1], hvrid: -6, spets: 'bak',
    armB: { cx: 34, cy: 90, w: 12, h: 26, rot: -10 }, handB: { cx: 31, cy: 101, r: 6.6 },
    armF: { cx: 87, cy: 90, w: 12, h: 27, rot: 48 },  handF: { cx: 96, cy: 83, r: 6.6 },
    fotB: { cx: 47, cy: 110, w: 22, h: 11, rot: -7 },
    fotF: { cx: 77, cy: 111, w: 24, h: 11, rot: 9 },
  },
  /* Rycker till bakåt och pekar. Luvspetsen viner fram över hjässan. */
  hittat: {
    lut: -7, hskift: [3, -2], hvrid: -8, spets: 'fram',
    armB: { cx: 34, cy: 89, w: 12, h: 28, rot: -40 }, handB: { cx: 26, cy: 99, r: 6.6 },
    armF: { cx: 92, cy: 92, w: 12, h: 29, rot: 52 },  handF: { cx: 104, cy: 86, r: 6.6 },
    fotB: { cx: 44, cy: 110, w: 22, h: 11, rot: -16 },
    fotF: { cx: 79, cy: 110, w: 25, h: 11, rot: 13 },
  },
  /* Står och väntar. Luvspetsen hänger slakt. Ena foten utåtvriden. */
  vantar: {
    lut: 0, hskift: [0, 1], hvrid: 2, spets: 'slak',
    armB: { cx: 35, cy: 91, w: 12, h: 26, rot: -5 },  handB: { cx: 33, cy: 102, r: 6.6 },
    armF: { cx: 87, cy: 91, w: 12, h: 26, rot: 7 },   handF: { cx: 90, cy: 102, r: 6.6 },
    fotB: { cx: 48, cy: 112, w: 21, h: 11, rot: -3 },
    fotF: { cx: 76, cy: 112, w: 24, h: 11, rot: 16 },
  },
  /* Nöjd. Lutar bakåt på hälarna, luvspetsen pigg uppåt. */
  nojd: {
    lut: -6, hskift: [1, -1], hvrid: 4, spets: 'upp',
    armB: { cx: 34, cy: 89, w: 12, h: 27, rot: -16 }, handB: { cx: 30, cy: 100, r: 6.6 },
    armF: { cx: 88, cy: 88, w: 12, h: 27, rot: 18 },  handF: { cx: 93, cy: 99, r: 6.6 },
    fotB: { cx: 47, cy: 112, w: 21, h: 11, rot: -9 },
    fotF: { cx: 77, cy: 111, w: 25, h: 11, rot: 17 },
  },
  /* Tom sida. Vänd bort, tittar tillbaka över axeln på ingenting. */
  tom: {
    lut: -2, hskift: [-3, 0], hvrid: 5, spets: 'slak',
    armB: { cx: 35, cy: 91, w: 12, h: 27, rot: -3 },  handB: { cx: 33, cy: 103, r: 6.6 },
    armF: { cx: 87, cy: 91, w: 12, h: 27, rot: 3 },   handF: { cx: 89, cy: 103, r: 6.6 },
    fotB: { cx: 47, cy: 112, w: 21, h: 11, rot: -15 },
    fotF: { cx: 75, cy: 112, w: 24, h: 11, rot: 21 },
  },
  /* 404. Böjd djupt fram och letar under något som inte finns. */
  fyrafyra: {
    lut: 20, hskift: [3, 2], hvrid: 8, spets: 'fram',
    armB: { cx: 34, cy: 82, w: 12, h: 30, rot: -58 }, handB: { cx: 24, cy: 91, r: 6.6 },
    armF: { cx: 89, cy: 94, w: 12, h: 30, rot: 28 },  handF: { cx: 96, cy: 106, r: 6.6 },
    fotB: { cx: 42, cy: 110, w: 22, h: 11, rot: -26 },
    fotF: { cx: 77, cy: 112, w: 25, h: 11, rot: 6 },
  },
};

/* ══ 10. GÅNGCYKELN ════════════════════════════════════════════════════
 *
 * Åtta rutor. 0 och 4 är kontaktlägen och varandras spegling, 1 och 5 är
 * nedgång med kroppen lägst och mest hoptryckt, 2 och 6 är passering, 3 och
 * 7 är uppgång med kroppen högst och sträckt.
 *
 * Två saker som är lätta att missa och som är hela skillnaden:
 *
 *   HUVUDET SLÄPAR EN RUTA. Kroppens höjdkurva och huvudets är samma kurva
 *   förskjuten ett steg. Det är eftersläpningen som ger tyngd, och den syns
 *   direkt om man tar bort den.
 *
 *   ANSIKTET RÖR SIG. Ögonlocken och munnen förändras mellan rutorna. En
 *   figur vars ansikte bara åker med läser som en pappersdocka på en pinne,
 *   hur bra kroppen än rör sig.
 *
 * Squash och stretch ligger på 6 procent och görs som skalning kring
 * fotlinjen, så att volymen ser konstant ut: blir figuren lägre blir den
 * också bredare.
 */
const G_Y     = [0, 3.4, 1.0, -2.6, 0, 3.4, 1.0, -2.6];   // kroppens höjd, positivt = lägre
const G_SQ    = [1.00, 1.06, 1.01, 0.96, 1.00, 1.06, 1.01, 0.96];
const G_LUT   = [5, 2, 6, 9, 5, 2, 6, 9];
const G_SPETS = ['bak', 'bak', 'bak', 'bak', 'bak', 'bak', 'bak', 'bak'];
/* Luvkantens mittvärde per ruta. Ansiktet arbetar med i språnget. */
const G_KANT  = [0, 1.5, 0, -2.5, 0, 1.5, 0, -2.5];
const G_LOCK  = [0, 0.20, 0.06, 0, 0, 0.20, 0.06, 0];
const G_MUN   = ['glad', 'smal', 'glad', 'oh', 'glad', 'smal', 'glad', 'oh'];

/* Fötternas bana genom cykeln. Åtta lägen, framfot och bakfot en halv cykel
 * isär, alltså samma lista lästa med fyra rutors förskjutning. */
const STEG_FOT = [
  { dx:  12, dy:  0, rot:  14 },   // 0 kontakt fram
  { dx:   7, dy:  0, rot:   6 },   // 1 nedgång
  { dx:   0, dy:  0, rot:  -2 },   // 2 passering, bär tyngden
  { dx:  -7, dy:  0, rot:  -9 },   // 3 avstamp bakåt
  { dx: -12, dy: -1, rot: -16 },   // 4 lyft
  { dx:  -6, dy: -6, rot: -10 },   // 5 svingar fram, högt
  { dx:   2, dy: -7, rot:   2 },   // 6 svingen högst fram
  { dx:   9, dy: -3, rot:  11 },   // 7 sänks mot kontakt
];

function gangPose(i) {
  const s = ((i % 8) + 8) % 8;
  const fF = STEG_FOT[s];
  const fB = STEG_FOT[(s + 4) % 8];
  const fl = (f, d) => ({ cx: f.cx + d.dx, cy: f.cy + d.dy, w: f.w, h: f.h, rot: f.rot + d.rot });
  /* Armarna går i MOTFAS mot foten på samma sida. Det är inte en stilfråga,
   * det är hur en kropp faktiskt balanserar, och ögat känner igen det. */
  const am = (a, d, k) => ({ ...a, cx: a.cx + d.dx * k, rot: a.rot - d.rot * 1.3 });
  const hd = (h, d, k) => ({ ...h, cx: h.cx + d.dx * k * 1.6, cy: h.cy - Math.abs(d.dy) * 0.4 });
  return {
    ...GRUND,
    lut: G_LUT[s],
    spets: G_SPETS[s],
    /* Huvudet släpar en ruta: hämtar föregående rutas höjd. */
    hskift: [1 + fF.dx * 0.06, G_Y[(s + 7) % 8] * 0.7],
    hvrid: -3 + G_Y[(s + 7) % 8] * 0.9,
    armB: am(GRUND.armB, fB, -0.5), handB: { ...GRUND.handB, cx: GRUND.handB.cx - fB.dx * 0.7 },
    armF: am(GRUND.armF, fF, -0.5), handF: { ...GRUND.handF, cx: GRUND.handF.cx - fF.dx * 0.7 },
    fotB: fl(GRUND.fotB, fB),
    fotF: fl(GRUND.fotF, fF),
  };
}

function gangAnsikte(i) {
  const s = ((i % 8) + 8) % 8;
  const a = ANSIKTEN.clean;
  return {
    ...a,
    kant: a.kant.map((v, j) => v + G_KANT[s] * (j === 2 ? 1.4 : 1)),
    lockB: [G_LOCK[s], 0], lockF: [G_LOCK[s] * 0.9, 0],
    under: 0.20 - G_LOCK[s] * 0.5,
    blick: [0.30, 0.36],
    mun: G_MUN[s],
  };
}

/* ══ 11. RITNING ═══════════════════════════════════════════════════════ */

const rekt = (p, fill) =>
  `<rect x="${+(p.cx - p.w / 2).toFixed(2)}" y="${+(p.cy - p.h / 2).toFixed(2)}"` +
  ` width="${p.w}" height="${p.h}" rx="${Math.min(p.w, p.h) / 2}" fill="${fill}"` +
  (p.rot ? ` transform="rotate(${+p.rot.toFixed(1)} ${+p.cx.toFixed(2)} ${+p.cy.toFixed(2)})"` : '') + '/>';

const cirkel = (p, fill) =>
  `<circle cx="${+p.cx.toFixed(2)}" cy="${+p.cy.toFixed(2)}" r="${p.r}" fill="${fill}"/>`;

/**
 * Ritar gårdsvätten.
 *
 * @param {object}  o
 * @param {number}  o.size     pixelstorlek, kvadratisk
 * @param {string}  o.ton      'blue' | 'clean' | 'minor' | 'major'
 * @param {string}  o.uttryck  nyckel ur UTTRYCK
 * @param {boolean} o.siluett  hela figuren i #111, inget vitt, ingen skugga
 * @param {boolean} o.ansikte  beskuren ansiktsvariant, alltså märkets ritning
 * @param {string}  o.klass    sätts som class på svg-elementet
 * @param {?number} o.steg     0..7, gångcykelns bildrutor. null = stillbild.
 * @param {number}  o.blink    0 öppna, 1 halvslutna, 2 slutna
 * @param {string}  o.detalj   'rik' med ögonvita, pupill och lock, eller
 *                             'enkel' med förenklat öga för litet format
 * @param {string}  o.titel    tillgänglighetstext. Tom = aria-hidden.
 * @returns {string} fristående svg-markup utan id, mask eller clipPath
 */
export function figur({
  size = 160,
  ton = 'blue',
  uttryck = 'clean',
  siluett = false,
  ansikte = false,
  klass = '',
  steg = null,
  blink = 0,
  detalj = null,
  titel = '',
} = {}) {
  const T = toner(ton);
  const BAS  = siluett ? '#111' : T.bas;
  const MORK = siluett ? '#111' : T.mork;
  const LJUS = siluett ? '#111' : T.ljus;
  const DJUP = siluett ? '#111' : T.djup;
  const VIT  = siluett ? '#111' : '#fff';

  const gang = steg !== null && steg !== undefined;
  let a = gang ? gangAnsikte(steg) : (ANSIKTEN[uttryck] || ANSIKTEN.clean);
  const p = gang ? gangPose(steg) : (POSER[uttryck] || POSER.clean);

  /* Blinkningen är en EGEN axel och rör inget annat i uttrycket. Det är därför
   * en figur kan blinka mitt i en sträng min utan att bli vänlig. */
  if (blink) {
    const n = blink === 2 ? 1 : 0.58;
    a = { ...a, lockB: [Math.max(a.lockB[0], n), a.lockB[1]], lockF: [Math.max(a.lockF[0], n), a.lockF[1]], under: 0 };
  }

  const rik = (detalj ?? (ansikte || siluett ? 'enkel' : 'rik')) === 'rik' && !siluett;

  /* ── Ögonen. Fyra delar, ritade i ordning inifrån och ut ──────────── */
  const oga = (o) => {
    if (siluett) return '';
    if (!rik) {
      /* ENKEL DETALJNIVÅ, en egen ritning och inte en avskalad kopia.
       * Mätningen säger att pupillen bär ned till 32 px och är borta vid 16.
       * Alltså smälter ögonvitan och pupillen här ihop till EN solid prick
       * med ögonvitans form men 62 procent av dess storlek, placerad där
       * pupillen skulle ha suttit. Silhuetten av blicken finns kvar, men det
       * finns ingen kant som kan slamma igen. */
      const k = 0.74;
      const cx = o.x + (a.blick[0] + (o.spegel > 0 ? -KONVERGENS : KONVERGENS)) * o.rx * 0.4;
      const cy = o.y + Math.max(0.06, a.blick[1]) * o.ry * 0.4;
      return `<path d="${mjuk(VITFORM.map(([u, v]) => [cx + u * o.rx * k * o.spegel, cy + v * o.ry * k]), 0.96)}" fill="${VIT}"/>`;
    }
    const l = o.spegel > 0 ? a.lockF : a.lockB;
    return `<path d="${vitaBana(o)}" fill="${VIT}"/>` +
      pupill(o, a.blick, a.pupill, DJUP) +
      lock(o, l[0], l[1], BAS) +
      underlock(o, a.under, BAS);
  };

  const munmitt = [MUN_MITT[0] + (a.munny?.[0] ?? 0), MUN_MITT[1] + (a.munny?.[1] ?? 0)];

  /* ── Ansiktsgruppen. Luvan ritas SIST, ovanpå ögonen, och blir därmed
   *    ögonbryn och ögonlock i samma form. Det är figurens hela idé. ── */
  const huvud =
    `<path d="${ORA_B}" fill="${BAS}"/>` +
    `<path d="${ORA_F}" fill="${BAS}"/>` +
    `<path d="${HUVUD}" fill="${BAS}"/>` +
    (siluett ? '' : `<path d="${INNER_B}" fill="${LJUS}"/><path d="${INNER_F}" fill="${LJUS}"/>`) +
    oga(OGON.bak) + oga(OGON.fram) +
    (siluett ? '' : munform(a.mun, munmitt, VIT)) +
    `<path d="${ansikte ? luvbanaBeskuren(a.kant) : luvbana(a.kant, p.spets)}" fill="${MORK}"/>` +
    `<path d="${luvband(a.kant)}" fill="${DJUP}"/>`;

  const huvudgrupp =
    `<g transform="translate(${+(p.hskift[0]).toFixed(2)} ${+(p.hskift[1]).toFixed(2)})` +
    `${p.hvrid ? ` rotate(${+p.hvrid.toFixed(1)} 60 54)` : ''}">${huvud}</g>`;

  /* Beskuret läge: huvudet fyller rutan och kroppen är offrad, precis som
   * Duolingos app-ikon offrar kropp och vingar. */
  if (ansikte) {
    /* Beskärningen är räknad på huvudets egen ruta, x 29..90 och y 26..78,
     * med fyra enheters luft. Öronen får skäras av: Duolingos app-ikon
     * skär av både vingar och öronbuskar av exakt samma skäl, alltså att
     * ögonen ska nå kant i kant. */
    return svg('27 25 66 66', size, klass, titel, huvud);
  }

  const sq = gang ? G_SQ[((steg % 8) + 8) % 8] : 1;
  const dy = gang ? G_Y[((steg % 8) + 8) % 8] : 0;

  const inne =
    rekt(p.armB, MORK) + cirkel(p.handB, MORK) +
    `<path d="${KROPP}" fill="${BAS}"/>` +
    (siluett ? '' : `<path d="${FORKLADE}" fill="${LJUS}"/>`) +
    huvudgrupp +
    rekt(p.armF, MORK) + cirkel(p.handF, MORK);

  /* Squash och stretch kring fotlinjen. Blir figuren lägre blir den bredare,
   * alltså ser volymen konstant ut. Fötterna ligger utanför och glider inte. */
  const kropp =
    (siluett ? '' :
      `<rect x="${SKUGGA.x}" y="${SKUGGA.y}" width="${SKUGGA.w}" height="${SKUGGA.h}"` +
      ` rx="${SKUGGA.h / 2}" fill="${SKUGGFARG}"/>`) +
    rekt(p.fotB, MORK) + rekt(p.fotF, MORK) +
    `<g transform="translate(0 ${+dy.toFixed(2)}) translate(60 112) scale(${+(1 / sq).toFixed(3)} ${sq.toFixed(3)}) translate(-60 -112)` +
    ` rotate(${+p.lut.toFixed(1)} 60 104)">${inne}</g>`;

  return svg('0 0 120 120', size, klass, titel, kropp);
}

function svg(vb, size, klass, titel, inne) {
  const a11y = titel ? `role="img" aria-label="${titel}"` : 'aria-hidden="true" focusable="false"';
  const cls = klass ? ` class="${klass}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${size}"` +
    ` height="${size}"${cls} ${a11y}>${inne}</svg>`;
}

export default figur;
