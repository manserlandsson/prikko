/**
 * Prikkos maskot: KAMELEONTEN. Version 3.
 * ====================================================================
 *
 * KONCEPT
 * Figuren byter inte färg för att gömma sig. Den byter färg för att TALA OM
 * vad den sett. Den kan inte dölja sitt fynd, det syns på skinnet.
 *
 * VAD SOM GÖR DEN TILL EN KARAKTÄR OCH INTE EN ILLUSTRATION AV EN FUNKTION
 * Färgbytet är metaforen rakt av, och en metafor rakt av ger en logotyp, inte
 * en figur. Docker ritade en val med containrar på ryggen och fick sina
 * ansiktsdrag bortplockade. Motmedlet här är en VANA som inte har något med
 * färg att göra:
 *
 *     Kameleonten tittar alltid åt två håll. Även när den är nöjd.
 *     Den slutar aldrig granska, och den pekar aldrig med handen.
 *     Den pekar med ett öga.
 *
 * En kameleont vrider sina två ögontorn oberoende av varandra. Ingen annan
 * maskot kan titta åt två håll samtidigt. Hela uttryckssystemet är byggt
 * på det, och de fyra lägen som bara den här figuren kan göra är:
 *
 *   söker    tornen pekar åt var sitt håll, ett framåt och ett bakåt
 *   brister  det nära ögat har låst sig på golvet, det bortre är kvar på dig
 *   404      tornen pekar mot varandra, figuren är vindögd
 *   tom sida tornen pekar utåt från varandra, det finns inget att titta på
 *
 * EN BÄRARE FÖR BEDÖMNINGEN
 * De tre bedömningstillstånden bärs av ÖGONEN ENSAMMA: lockens täckning,
 * lockens vinkel och de två pupillernas riktning. Munnen ändras också, men
 * bara som förstärkning åt samma håll, aldrig som en andra oberoende
 * dimension. Provet finns på provsidan: samma tre tillstånd med munnen
 * borttagen ska fortfarande gå att skilja åt i 24 px.
 *
 *   clean  BÅDA TORNEN ÖPPNA OCH FRAMÅT       lock 0,10   pupiller högt
 *   minor  TORNEN DELADE, ETT NED ETT BAKÅT   lock 0,40 / 0,52
 *   major  BÅDA LÅSTA LÅGT, TUNGA HÄNGLOCK    lock 0,56 / 0,50, vinklade in
 *
 * Mörk massa i tornen: cirka 14, 46 respektive 55 procent. Det är en
 * skillnad i ytstorlek, inte i kulör, och den överlever både svartvitt,
 * rödgrönblindhet och 24 px.
 *
 * SLÄKTSKAP MED ORDMÄRKET
 * Prikkos ordmärke är två punkter och en båge. Kameleontens ansikte är
 * två solida vita punkter och en vit båge. Beskuret läge lägger dem i
 * samma rundade kvadrat som dagens bedömningsmärke, i samma proportioner:
 * munnens stroke landar på 8,0 procent av bredden mot märkets 8,2.
 *
 * VAD SOM ÄR SUBTRAHERAT
 * Kameleontens mest kända egenskap efter färgbytet är sitt SKINNMÖNSTER.
 * Alla som ritar en kameleont ritar prickar, band eller fjäll. Här finns
 * inget av det. Skinnet är en enda platt yta. Figuren har dessutom bara EN
 * arm, aldrig två, på samma sätt som Firefox tog bort rävens ben.
 *
 * KONSTRUKTIONSREGLER SOM FÖLJS
 *   noll gradienter, noll filter, noll masker, noll clipPath, noll id
 *   stroke används på exakt en form, munnen, som Prikkos märke redan gör
 *   skuggan är en pillerform, aldrig en oval
 *   volym görs av platta ytor med hårda kanter
 *   pupillerna är aldrig centrerade
 *   munnen är asymmetrisk och bryter ut ur ramen vid stark känsla
 *   trekvartsvy, aldrig rakt framifrån, fötterna aldrig ihop
 *
 * 120-ruta, viewBox "0 0 120 120", marken på y 116, figuren vänd åt vänster.
 */

/* ══ META ═══════════════════════════════════════════════════════════════ */

export const META = {
  namn: 'Kameleonten',
  koncept:
    'En kameleont som granskar. Den byter inte färg för att gömma sig utan för att tala om vad den hittat, och den kan titta åt två håll samtidigt.',
  former: 17,
  farger: 5,
  egenhet:
    'De två ögontornen vrids oberoende av varandra. Figuren söker framåt och bakåt i samma bild, blir vindögd på en 404 och tittar bort från varandra på en tom sida. Den pekar aldrig med handen, den pekar med ett öga.',
  svaghet:
    'Ryggkammen och griptångsfötterna, de två detaljer som gör den till kameleont snarare än ödla, dör helt under 32 px. Under den gränsen bärs arten enbart av kaskens vinkel och svansens spiral, och det är tunt.',
};

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

/* ══ PROPORTIONSREGLER, KLARTEXT ════════════════════════════════════════
 * Skrivna som Reddits regler för Snoo, alltså som order och inte som råd.
 */
export const PROPORTIONER = [
  'KAMELEONTEN ÄR TVÅ HUVUDEN HÖG, RÄKNAT FRÅN KASKENS TOPP TILL FOTEN.',
  'DET NÄRA ÖGONTORNET ÄR EN TREDJEDEL SÅ BRETT SOM HELA HUVUDET OCH BUKTAR ALLTID UT OVANFÖR SKALLENS ÖVERKANT.',
  'DET BORTRE ÖGONTORNET ÄR TVÅ TREDJEDELAR AV DET NÄRA OCH LIGGER ALLTID HÖGRE OCH LÄNGRE BAK, ALDRIG I JÄMNHÖJD.',
  'KROPPEN ÄR BREDARE ÄN HUVUDET. STORT HUVUD PÅ LITEN KROPP ÄR FÖRBJUDET.',
  'ARMEN NÅR ALDRIG LÄNGRE FRAM ÄN NOSSPETSEN.',
  'SVANSEN RULLAR MEDURS OCH DESS YTTERSTA VARV ÄR ALDRIG BREDARE ÄN ETT ÖGONTORN.',
  'MUNNEN BÖRJAR VID NOSSPETSEN OCH SLUTAR ALDRIG BAKOM DET NÄRA TORNETS MITT.',
];

/* ══ FÖRBJUDET ══════════════════════════════════════════════════════════ */
export const FORBJUDET = [
  'INGA PRICKAR, BAND, FJÄLL ELLER ANDRA SKINNMÖNSTER. SKINNET ÄR EN PLATT YTA.',
  'INGEN ANDRA ARM. FIGUREN HAR EN ARM, ALLTID.',
  'INGEN NÄSA, INGA NÄSBORRAR, INGA FINGRAR, INGA TÄNDER, INGA ÖGONBRYN SOM EGEN FORM. BRYNET ÄR ÖGONLOCKET.',
  'INGEN ÖGONVITA. PUPILLEN ÄR EN SOLID VIT PUNKT, ALDRIG ETT KLOT MED PUPILL I.',
  'INGA SPETSIGA HÖRN. RYGGKAMMENS TAGGAR ÄR RUNDADE, KASKEN SLUTAR I EN RUNDNING OCH ALDRIG I ETT HORN.',
  'SKUGGAN ÄR EN PILLERFORM. ALDRIG EN OVAL, EFTERSOM OVALER ANTYDER PERSPEKTIV.',
  'ALDRIG RAKT FRAMIFRÅN. FRAMIFRÅNVYN GÖR DE TVÅ TORNEN TILL ÖRON OCH FIGUREN TILL EN APA.',
  'ALDRIG FÖRSTORINGSGLAS, HATT ELLER KAPPA I GRUNDPOSEN.',
  'ALDRIG BÅDA ÖGONEN ÅT EXAKT SAMMA HÅLL I EN VILANDE POS. DÅ ÄR DET INTE LÄNGRE EN KAMELEONT.',
];

/* ══ TONSYSTEM ══════════════════════════════════════════════════════════
 * Tre toner per tillstånd plus vitt. Inga nya kulörer uppfinns.
 *   BAS   tillståndets färg, oförändrad
 *   MÖRK  Prikkos egen mörka ton för samma tillstånd
 *   LJUS  BAS blandad 34 procent i vitt, räknad i kod
 */

export const TON = {
  blue: { bas: '#007BE0', mork: '#0063B4' },
  clean: { bas: '#00B92B', mork: '#009523' },
  minor: { bas: '#FECB00', mork: '#DEB201' },
  major: { bas: '#EB0000', mork: '#C50000' },
};

export function ljusare(hex, andel = 0.34) {
  const n = parseInt(hex.slice(1), 16);
  const m = (v) => Math.round(v + (255 - v) * andel);
  return (
    '#' +
    [m((n >> 16) & 255), m((n >> 8) & 255), m(n & 255)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

export function palett(nyckel) {
  const t = TON[nyckel] ?? TON.blue;
  return {
    bas: t.bas,
    mork: t.mork,
    ljus: ljusare(t.bas),
    skugga: ljusare(t.mork, 0.86),
    vit: '#fff',
  };
}

/* Enhetsgrått för svartvitprovet. Alla tre tillstånd får IDENTISKT grått,
   så att formen tvingas göra hela arbetet. Det är det hårda provet. */
const GRA = { bas: '#9AA0A6', mork: '#4A5055', ljus: '#C9CDD1', skugga: '#E6E8EA', vit: '#fff' };
const SVART = { bas: '#111', mork: '#111', ljus: '#111', skugga: '#111', vit: '#111' };

const f = (v) => Math.round(v * 100) / 100;

/* ══ GEOMETRI, 120-RUTAN ════════════════════════════════════════════════
 *
 * SILUETT   en enda bana: nos, panna, kask, nacke, ryggkam, kropp, buk, käke
 *           nosspets (13,60)  kaskspets (71,11)  kaskens bakspets (87,30)
 *           svansrot (100,80) bukens botten y 99  hakan (40,67)
 * BUK       ljus ton, strupe plus mage, förankrad i siluettens underkant
 * SVANS     räknad spiral, avsmalnande fylld bana, aldrig stroke
 * BEN       två banor, lår genom griptång i ETT stycke vardera
 * ARM       en bana plus tång
 * TORN      nära cx 34 cy 41 r 15,5   bortre cx 58 cy 32 r 10,5
 * PUPILL    nära r 6,4   bortre r 4,3   solida vita, ingen ögonvita
 * MUN       vit båge, stroke 5,6, round linecap
 */

/* HUVUDET. En bana. Kort trubbig nos längst fram till vänster, HJÄSSAN
   LIGGER LÅGT så att de två ögontornen får bukta ut ovanför konturen som
   två knoppar, och under käken hänger strupkammens två flikar.
   Huvudet är EGEN bana och inte del av kroppen, av ett enda skäl: figuren
   ska gå att posera, och ett huvud som inte kan vridas ur nacken är en
   ikon och inte en maskot. Banorna ligger i samma ton och överlappar med
   27 enheter, så siluetten är obruten trots att banorna är två. */
const HUVUD = [
  'M12 64', // nosspetsen, kort och lågt framme
  'C10 55 12 47 19 42', // ansiktets framkant reser sig brant
  'C26 38 34 37 43 38', // HJÄSSAN LÅG, tornen får sticka ut ovanför
  'C52 39 61 40 67 46', // skallen bakåt mot nacken
  'C72 52 70 59 63 63', // nacken faller
  'C56 67 50 68 44 66', // käkens bakre fäste
  'C42 71 37 71 34 66', // strupkam, flik 1
  'C31 71 26 71 23 65', // strupkam, flik 2
  'C19 66 15 66 12 64', // käklinjen ut mot nosspetsen
  'Z',
].join('');

/* KASKEN. Egen bana i MÖRK ton, ritad BAKOM huvudet. Skälet är läsbarhet:
   i version 1 låg kasken i huvudets egen ton och smälte ihop med ögontornen
   till en enda klump som läste som en elefantskalle. Som eget mörkt plan
   blir kasken den bakåtsvepta fena den ska vara, tornen står fritt mot den,
   och den är den enda artdetaljen som överlever ned till 24 px. */
const KASK = 'M42 46C48 30 60 21 72 23C80 25 84 33 80 40C74 46 71 52 70 60C60 56 46 52 42 46Z';

/* KROPPEN. En bana. Bredare än huvudet, med en enda rundad ryggkamstagg
   och svansroten inbakad. Runda taggar, aldrig spetsiga. */
const KROPP =
  'M50 56C66 46 88 54 94 68C101 68 107 76 103 84C105 94 98 103 87 106C74 110 58 108 50 101C42 94 38 84 38 74C38 66 43 59 50 56Z';

/* Buken. Ljus ton, hård kant, förankrad i kroppens underkant. En månskära
   längs undersidan, aldrig en fritt svävande oval. */
const BUK =
  'M41 84C46 95 58 102 71 103C82 104 92 101 99 96C98 103 89 109 77 109C61 109 43 102 41 92Z';

/* Ögontornen. Båda buktar 17 enheter ovanför hjässlinjen, alltså sticker de
   ut UTANFÖR huvudets kontur som två knoppar, vilket är hur en kameleonts
   ögon faktiskt sitter. Det nära tornet är en tredjedel av huvudbredden. */
const TORN = {
  nara: { cx: 31, cy: 38, r: 15.5, pr: 6.4 },
  bortre: { cx: 53, cy: 28, r: 10.5, pr: 4.3 },
};

/* ══ MUNNEN ═════════════════════════════════════════════════════════════
 * Käklinjen går från nosspetsen (13,60) till hakan (40,67). Munnen ligger
 * strax ovanför. Alla bågar är ASYMMETRISKA och favoriserar nossidan.
 * I de tre bedömningslägena är munnen bara förstärkning, aldrig bäraren.
 */
const MUN = {
  glad: { d: 'M14 56C18 66 30 68 40 59', sw: 5.6 }, // bred, uppåt
  tveksam: { d: 'M17 62C22 65 27 60 38 62', sw: 5.6 }, // smal, kink åt ena hållet
  sur: { d: 'M8 68C14 57 31 55 42 65', sw: 6.8 }, // bredast, nedåt, bryter ut
  liten: { d: 'M18 62C23 64 28 64 34 63', sw: 5.2 }, // kort platt streck
  spetsig: { d: 'M18 61C22 66 26 66 30 62', sw: 5.6 }, // koncentrerad, kort
  nojd: { d: 'M15 59C20 66 29 67 38 61', sw: 5.6 }, // mildare än glad
  krokig: { d: 'M15 63C19 58 23 68 27 62C30 58 34 66 39 62', sw: 4.8 }, // vinglig
  gap: { d: 'M14 59C18 65 24 66 30 63', sw: 5.6 }, // öppen, tungan går ut
};

/* Tungan. Ljus ton, en bana, klubbformad spets. Bara i posen hittat. */
const TUNGA =
  'M18 60C14 66 10 72 7 78C3 79 0 83 1 87C2 91 6 93 10 92C14 90 16 86 14 82C17 76 20 70 24 65Z';

/* ══ SVANSEN ════════════════════════════════════════════════════════════
 * Räknad spiral, inte handritad. En fylld avsmalnande bana, eftersom en
 * stroke inte kan smalna av och stroke dessutom är förbjudet här.
 * kurl 1 = hårt rullad, kurl 0 = utrullad och hängande.
 */
function svansBana(kurl = 1) {
  const N = 30;
  const langd = 40 + 36 * kurl;
  const a0 = -0.5 + (1 - kurl) * 1.15; // utrullad hänger nedåt
  const K = 0.7 + 8.0 * kurl; // total vinkeländring i radianer
  const b0 = 10.6; // svansrotens bredd
  let x = 101;
  let y = 78;
  const vanster = [];
  const hoger = [];

  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const a = a0 + K * Math.pow(s, 1.35);
    const b = b0 * Math.pow(1 - s, 0.5) + 0.9;
    const nx = Math.sin(a);
    const ny = -Math.cos(a);
    vanster.push([x + nx * b * 0.5, y + ny * b * 0.5]);
    hoger.push([x - nx * b * 0.5, y - ny * b * 0.5]);
    const ds = (langd / N) * (1 - 0.42 * kurl * s);
    x += Math.cos(a) * ds;
    y += Math.sin(a) * ds;
  }

  const p = (pt) => `${f(pt[0])} ${f(pt[1])}`;
  return 'M' + vanster.map(p).join('L') + 'L' + hoger.reverse().map(p).join('L') + 'Z';
}

/* ══ ÖGONLOCKET, UTTRYCKETS MOTOR ═══════════════════════════════════════
 * Kameleontens ögonlock är en hudkon som täcker nästan hela klotet och
 * lämnar en liten öppning. Det ger en exakt reglerbar form:
 *
 *   vinkel    kordans lutning i grader. Negativt sänker lockets NOSSIDA,
 *             alltså rynkad panna. Positivt sänker yttersidan, alltså trött.
 *   tackning  0 = locket täcker inget, 0,5 = övre halvan, 1 = ögat slutet.
 *
 * Banan är den exakta skärningen mellan tornets cirkel och ett halvplan,
 * räknad, inte gissad. Ingen mask behövs.
 */
function lockBana(t, vinkel, tackning) {
  const tt = Math.max(0, Math.min(1, tackning));
  if (tt <= 0.001) return '';
  const a = (vinkel * Math.PI) / 180;
  const r = t.r * 1.03; // litet överdrag så tornets kant inte blottas
  const h = r * (1 - 2 * tt);
  const L = Math.sqrt(Math.max(r * r - h * h, 0.0001));
  const ux = Math.sin(a);
  const uy = -Math.cos(a);
  const vx = Math.cos(a);
  const vy = Math.sin(a);
  const p1 = [t.cx + ux * h + vx * L, t.cy + uy * h + vy * L];
  const p2 = [t.cx + ux * h - vx * L, t.cy + uy * h - vy * L];
  const stor = h < 0 ? 1 : 0;
  return `M${f(p1[0])} ${f(p1[1])}A${f(r)} ${f(r)} 0 ${stor} 0 ${f(p2[0])} ${f(p2[1])}Z`;
}

/* Vecket. Samma räkning nedifrån, alltså hudfållen under tornet. Ger volym
   med hård kant i stället för toning, och skiljer tornet från en påmålad
   cirkel. Bara det nära tornet har veck, det bortre är för litet. */
function veckBana(t, djup = 0.17) {
  return lockBana(t, 180, djup);
}

/* ══ BEN OCH ARM ════════════════════════════════════════════════════════
 * Griptången är kameleontens fot: två tår mot tre, ett halvt tumgrepp.
 */
/* En avsmalnande kapsel mellan två punkter, med olika radie i ändarna.
   Rena bågar, inga stroke, så lemmen kan smalna av. Allt räknat. */
function kapsel(pk, q, r0, r1) {
  const dx = q[0] - pk[0];
  const dy = q[1] - pk[1];
  const L = Math.hypot(dx, dy) || 0.001;
  const nx = -dy / L;
  const ny = dx / L;
  const P = (x, y) => `${f(x)} ${f(y)}`;
  return (
    `M${P(pk[0] + nx * r0, pk[1] + ny * r0)}` +
    `L${P(q[0] + nx * r1, q[1] + ny * r1)}` +
    `A${f(r1)} ${f(r1)} 0 0 0 ${P(q[0] - nx * r1, q[1] - ny * r1)}` +
    `L${P(pk[0] - nx * r0, pk[1] - ny * r0)}` +
    `A${f(r0)} ${f(r0)} 0 0 0 ${P(pk[0] + nx * r0, pk[1] + ny * r0)}Z`
  );
}

/* Griptången. Kameleontens fot är inga tår, den är en tång.
   BAKFOTEN har den tjocka klon UTÅT och de två smala inåt.
   FRAMFOTEN har det omvända. Ritar man samma delning på alla fyra är det
   fel, och på just en kameleont märks det. */
function klo(pt, vinkel, bakfot) {
  const g = 55; // gapet mellan klorna i grader
  const rad = (v) => (v * Math.PI) / 180;
  const ut = (v, l) => [pt[0] + Math.cos(rad(v)) * l, pt[1] + Math.sin(rad(v)) * l];
  const lY = bakfot ? 12 : 8.5; // yttre klons längd
  const lI = bakfot ? 8.5 : 12; // inre klons längd
  const rY = bakfot ? 4.4 : 3.2;
  const rI = bakfot ? 3.2 : 4.4;
  return (
    kapsel(pt, ut(vinkel - g, lY), rY, 2.4) + kapsel(pt, ut(vinkel + g, lI), rI, 2.4)
  );
}

/* En lem: höft, knä, vrist och tång i EN bana. */
function lem(a, b, c, r, vinkel, bakfot) {
  return kapsel(a, b, r[0], r[1]) + kapsel(b, c, r[1], r[2]) + klo(c, vinkel, bakfot);
}

function benBortre(steg) {
  const d = steg * 10;
  return lem([59, 86], [50 - d * 0.4, 99], [53 - d, 108], [7.5, 5.6, 4.2], 90, true);
}

function benNara(steg) {
  const d = steg * 10;
  return lem([79, 88], [89 + d * 0.4, 100], [85 + d, 108], [8, 6, 4.4], 90, true);
}

/* Armen. Fyra lägen, angivna som höft, armbåge och handled plus tångens
   riktning. Armen når aldrig längre fram än nosspetsen på x 12. */
const ARM = {
  framat: { a: [54, 72], b: [42, 80], c: [27, 85], v: 165 },
  hogt: { a: [54, 72], b: [42, 64], c: [27, 57], v: 205 },
  ned: { a: [55, 74], b: [52, 88], c: [47, 100], v: 110 },
  peka: { a: [55, 74], b: [44, 88], c: [32, 99], v: 130 },
};
function armBana(namn) {
  const a = ARM[namn] ?? ARM.framat;
  return lem(a.a, a.b, a.c, [7.6, 5.8, 4.2], a.v, false);
}

/* ══ UTTRYCKSTABELL ═════════════════════════════════════════════════════
 * Varje pose är en riktig pose, inte samma figur med bytt mun.
 *
 *   lut     hela kroppens lutning kring höften (70,96), positivt = framåt
 *   huvud   huvudets extra lutning kring nacken (46,52)
 *   arm     armens läge
 *   ben     stegets längd. Fötterna ihop är förbjudet, alltid > 0
 *   kurl    svansens rullning, 1 = hårt rullad
 *   mun     nyckel i MUN, förstärkning och aldrig bärare i de tre första
 *   nara    { v lockets vinkel, t lockets täckning, p pupillförskjutning }
 *   bortre  samma för det bortre tornet
 */
const POSER = {
  // BÄRAREN: båda tornen öppna och riktade framåt. Minsta mörka massa.
  clean: {
    lut: 4, huvud: -3, arm: 'framat', ben: 0.45, kurl: 0.9, mun: 'glad',
    nara: { v: -12, t: 0.1, p: [-4.8, -2.6] },
    bortre: { v: 12, t: 0.1, p: [-3.4, -2.0] },
  },
  // BÄRAREN: tornen DELADE. Det nära har låst sig på golvet, det bortre är
  // kvar på dig med halvsänkt lock. De två pupillerna står långt isär.
  minor: {
    lut: 3, huvud: 2, arm: 'peka', ben: 0.3, kurl: 0.75, mun: 'tveksam',
    nara: { v: -2, t: 0.4, p: [-1.2, 4.4] },
    bortre: { v: 26, t: 0.52, p: [3.8, -1.0] },
  },
  // BÄRAREN: båda låsta på samma låga punkt under tunga hänglock vinklade
  // ned mot nosen. Störst mörk massa, pupillerna nära varandra och lågt.
  major: {
    lut: 7, huvud: 5, arm: 'ned', ben: 0.2, kurl: 1, mun: 'sur',
    nara: { v: -36, t: 0.56, p: [-3.4, 4.0] },
    bortre: { v: -28, t: 0.5, p: [-2.6, 3.4] },
  },
  // Signaturen. Tornen pekar åt var sitt håll, ett framåt och ned, ett rakt
  // bakåt. Kroppen långt framåtlutad, armen uppe, längsta steget.
  soker: {
    lut: 12, huvud: -8, arm: 'hogt', ben: 0.85, kurl: 1, mun: 'spetsig',
    nara: { v: -8, t: 0.08, p: [-5.6, 1.8] },
    bortre: { v: 34, t: 0.16, p: [5.8, -1.6] },
  },
  // Ögonblicket då de två blickarna blir eniga. Tungan skjuter ut.
  hittat: {
    lut: 9, huvud: -4, arm: 'framat', ben: 0.5, kurl: 0.7, mun: 'gap',
    tunga: true,
    nara: { v: -6, t: 0.05, p: [-5.8, 2.8] },
    bortre: { v: 4, t: 0.05, p: [-5.0, 2.4] },
  },
  // Ett öga helt slutet, det andra halvsänkt och drivande utåt. Svansen
  // utrullad och hängande, kroppen bakåtlutad.
  vantar: {
    lut: -4, huvud: 3, arm: 'ned', ben: 0.25, kurl: 0.12, mun: 'liten',
    nara: { v: 8, t: 0.62, p: [2.8, 2.4] },
    bortre: { v: 10, t: 1, p: [0, 0] },
  },
  // Nöjd, men fortfarande med blicken på två håll. Ingen övertydlig glädje.
  nojd: {
    lut: -3, huvud: -5, arm: 'ned', ben: 0.35, kurl: 1, mun: 'nojd',
    nara: { v: -16, t: 0.18, p: [-3.6, -3.4] },
    bortre: { v: 18, t: 0.24, p: [2.4, -2.4] },
  },
  // Tom sida. Tornen pekar UTÅT från varandra, maximal divergens.
  tom: {
    lut: -2, huvud: 1, arm: 'ned', ben: 0.2, kurl: 0.35, mun: 'liten',
    nara: { v: 4, t: 0.34, p: [-6.0, 0.4] },
    bortre: { v: 18, t: 0.36, p: [6.0, 0.2] },
  },
  // 404. Tornen pekar MOT varandra, figuren är vindögd, munnen vinglig,
  // kroppen tippad bakåt som om den gått in i en dörrpost.
  fyrafyra: {
    lut: -6, huvud: 8, arm: 'hogt', ben: 0.55, kurl: 0.5, mun: 'krokig',
    nara: { v: -6, t: 0.12, p: [5.8, -1.6] },
    bortre: { v: -14, t: 0.14, p: [-5.6, 0.8] },
  },
};

/* ══ INRAMAT LÄGE ═══════════════════════════════════════════════════════
 * Ansiktet beskuret KANT I KANT, inte helfiguren förminskad. Modulen ritar
 * INGEN ram: ramen ägs av bedömningsmärket. Här fylls hela viktboxen med
 * grundtonen, så att huvudets kontur försvinner in i ramen och bara dragen
 * syns, precis som Duolingos app-ikon.
 *
 * Beskärningen är figurens starkaste kort. Ögontornen sticker ut utanför
 * huvudets kontur, så det som möter ramens kanter är just de två tornen
 * med sina vita prickar. Ingen annan figur i urvalet kan beskäras så.
 *
 * Skalan 1,72 är vald så att munnens stroke landar på 9,6 av 120, alltså
 * 8,0 procent av bredden, mot bedömningsmärkets 8,2. Räknat, inte påstått.
 */
const ANSIKTE_SKALA = 1.72;
const ANSIKTE_T = `translate(48 54) scale(${ANSIKTE_SKALA}) translate(${-TORN.nara.cx} ${-TORN.nara.cy})`;

/* Kasken i inramat läge, handpassad så att den stannar innanför en hörnradie
   på 17 procent. Därför behövs varken clipPath eller mask. */
const KASK_ANSIKTE = 'M56 30C68 8 86 -2 104 4C112 7 114 15 110 21C94 15 80 26 72 46Z';

/* ══ ENPATHSLÄGET ═══════════════════════════════════════════════════════
 * En bana, en färg, för favicon och 16 px. GitLabs tanuki är åtta banor i
 * tre färger men EN bana i EN färg i 16-spriten. Detta är motsvarigheten:
 * huvudet i profil med kasken, tornets bukt och nosen, och pupillen som ett
 * hål i samma bana genom fill-rule evenodd. Ingen kropp, ingen svans.
 */
const ENPATH =
  // huvudets kontur: nos, ansiktets framkant, ögonkupolen som en båge,
  // ett hack, och kasken bakåtsvept
  'M8 70C3 56 9 42 22 37' +
  'A32 32 0 0 1 66 32' +
  'C66 22 74 12 86 12C100 12 107 25 98 37' +
  'C92 45 87 53 85 65C83 86 63 99 42 96C24 94 11 85 8 70Z' +
  // pupillen som hål i samma bana
  'M27 48a13 13 0 1 0 26 0a13 13 0 1 0-26 0Z' +
  // munnen som slits i samma bana, ett hack läser bättre än en linje i 16 px
  'M16 68C24 81 46 84 58 74C50 88 22 85 16 68Z';

/* ══ DELAR ══════════════════════════════════════════════════════════════ */

/** Ett ögontorn: cirkel i bas, veck i mörk, lock i mörk, pupill i vitt. */
function torn(p, t, u, medVeck) {
  const gr = t.r - t.pr - 1.1;
  const dx = Math.max(-gr, Math.min(gr, u.p[0]));
  const dy = Math.max(-gr, Math.min(gr, u.p[1]));
  const veck = medVeck ? `<path d="${veckBana(t)}" fill="${p.mork}"/>` : '';
  const lock = u.t > 0.001 ? `<path d="${lockBana(t, u.v, u.t)}" fill="${p.mork}"/>` : '';
  // Vid nästan slutet öga försvinner pupillen, locket ÄR hela ögat.
  const pupill =
    u.t >= 0.9
      ? ''
      : `<circle cx="${f(t.cx + dx)}" cy="${f(t.cy + dy)}" r="${t.pr}" fill="${p.vit}"/>`;
  return `<circle cx="${t.cx}" cy="${t.cy}" r="${t.r}" fill="${p.bas}"/>${veck}${lock}${pupill}`;
}

/** Ansiktsgruppen. Används oförändrad av både helfigur och beskuret läge. */
function ansikteGrupp(p, pose, siluett, utanMun) {
  const m = MUN[pose.mun] ?? MUN.glad;
  const tunga = pose.tunga ? `<path d="${TUNGA}" fill="${siluett ? p.mork : p.ljus}"/>` : '';
  const mun =
    utanMun || siluett
      ? ''
      : `<path d="${m.d}" fill="none" stroke="#fff" stroke-width="${m.sw}" stroke-linecap="round"/>`;
  return (
    tunga +
    torn(p, TORN.bortre, pose.bortre, false) +
    torn(p, TORN.nara, pose.nara, true) +
    mun
  );
}

/* ══ HUVUDEXPORT ════════════════════════════════════════════════════════
 * Gränssnittet är det gemensamma kontraktet. Inga id, inga masker, inga
 * clipPath, så tjugo figurer i samma dokument kan aldrig krocka.
 */
export function figur({
  size = 160,
  ton = 'blue',
  uttryck = 'clean',
  siluett = false,
  ansikte = false,
  enpath = false,
  gra = false,
  utanMun = false,
  klass = '',
} = {}) {
  const pose = POSER[uttryck] ?? POSER.clean;
  const p = siluett ? SVART : gra ? GRA : palett(ton);
  const svg = (inner) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" class="${klass}">${inner}</svg>`;

  /* EN BANA, EN FÄRG. Faviconläget. */
  if (enpath) {
    return svg(`<path d="${ENPATH}" fill-rule="evenodd" fill="${siluett ? '#111' : p.bas}"/>`);
  }

  /* BESKURET ANSIKTE.
     Bortklippt i denna ordning: skuggan, svansen, benen, armen, kroppen
     med ryggkam, och sist den LJUSA tonen som helt utgår. Kvar: rundad
     kvadrat i bas, kaskkil i mörkt, två torn, två lock, två pupiller,
     en munbåge. Tre färger i stället för fyra. */
  if (ansikte) {
    return svg(
      `<rect x="0" y="0" width="120" height="120" fill="${p.bas}"/>` +
        `<path d="${KASK_ANSIKTE}" fill="${p.mork}"/>` +
        `<g transform="${ANSIKTE_T}">${ansikteGrupp(p, pose, false, utanMun)}</g>`
    );
  }

  /* HELFIGUR. 16 banor. Ritordning bakifrån och fram:
     1 skugga  2 bortre ben  3 svans  4 kropp  5 buk  6 arm  7 kask
     8 huvud  9 bortre torn  10 bortre lock  11 bortre pupill
     12 nära torn  13 nära veck  14 nära lock  15 nära pupill
     16 mun  17 nära ben. Tungan är en artonde bana och finns bara i
     posen hittat. */
  return svg(
    (siluett
      ? ''
      : `<rect x="${f(38 - pose.lut * 0.6)}" y="112" width="54" height="7" rx="3.5" fill="${p.skugga}"/>`) +
      `<path d="${benBortre(pose.ben)}" fill="${p.mork}"/>` +
      `<g transform="rotate(${pose.lut} 70 96)">` +
      `<path d="${svansBana(pose.kurl)}" fill="${p.mork}"/>` +
      `<path d="${KROPP}" fill="${p.bas}"/>` +
      (siluett ? '' : `<path d="${BUK}" fill="${p.ljus}"/>`) +
      `<path d="${armBana(pose.arm)}" fill="${p.mork}"/>` +
      `<g transform="rotate(${pose.huvud} 50 52)">` +
      `<path d="${KASK}" fill="${p.mork}"/>` +
      `<path d="${HUVUD}" fill="${p.bas}"/>` +
      ansikteGrupp(p, pose, siluett, utanMun) +
      `</g></g>` +
      `<path d="${benNara(pose.ben)}" fill="${p.mork}"/>`
  );
}

export default figur;
