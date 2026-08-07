// Prikkos maskot: TVÄTTBJÖRNEN.
//
// Ritad i en 120-ruta, viewBox "0 0 120 120", marken på y 116.
// Inga stroke-attribut, inga gradienter, inga filter, inga masker, inga id.
// Alla former är fyllda ytor med hårda kanter, som i Duolingos egna filer.
//
// ANSIKTET ÄR SYSTEMET, kroppen följer efter.
// Ansiktet är två solida vita prickögon och en båge, alltså samma grammatik
// som Prikkos ordmärke och bedömningsmärke. Ovanpå ögonen ligger artens egen
// mask, och den gör tjänst som ett permanent ögonbryn. Masken är den enda
// delen av figuren som ändrar form mellan de tre bedömningarna utöver munnen,
// och den är gratis: den finns ändå.
//
// SUBTRAKTIONEN: tvättbjörnen har ingen nos. Artens mest väntade drag är
// borttaget med flit. Ytan mellan ögonen och munnen lämnas tom, vilket ger
// munbågen ensamrätt på undre ansiktshalvan.
//
// EN BÄRARE: bedömningen sitter i munbågen, som i den danska smileyordningen.
// Maskens lutning och ögonens storlek är låsta till munbågen och rör sig
// alltid med den, aldrig fritt.

// ---------------------------------------------------------------------------
// GEMENSAMT KONTRAKT
// ---------------------------------------------------------------------------
export const META = {
  namn: 'Tvättbjörnen',
  koncept: 'En tvättbjörn på huk som känner efter med framtassarna, där artens egen mask gör tjänst som permanent ögonbryn.',
  former: 15,
  farger: 4,
  egenhet: 'Masken är brynet. Den finns ändå och bär hela bedömningen, och det vikta högerörat gör figuren igenkännbar även i ren siluett.',
  svaghet: 'Metaforen är för bokstavlig, arten är EU-listad invasiv och förbjuden i Sverige, och kroppen läser lätt som katt om huvudet inte får dominera.',
};

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

export const PROPORTIONER = [
  'Tvättbjörnen är ett och en halv huvud hög. Huvudet är alltid figurens största form och tar de översta två tredjedelarna. Blir kroppen större än huvudet blir figuren en katt.',
  'Figuren är alltid på huk, aldrig upprätt. Gumpen ligger högre än hakan, och massan lutar åt höger i toppen och åt vänster i botten.',
  'Masken ligger på huvudets mittlinje och går ut till huvudets kant på båda sidor. Den är tjockast över ögat och smalnar av åt båda hållen.',
  'Ögonen är solida vita prickar med en radie på knappt en tiondel av huvudets bredd. De sitter LÅGT i masken, så att de bryter maskens underkant.',
  'Svansen är lika lång som kroppen och alltid tjockare än en framtass. Den bär tre ringar, aldrig fler, och den sista ringen är spetsen.',
  'Framtassarna är fristående kapslar utan armar. Minst en av dem rör alltid något: marken, kroppen eller luften mitt i en rörelse.',
];

export const FORBJUDET = [
  'Aldrig rekvisita som bär betydelsen: inget förstoringsglas, ingen hatt, ingen kappa, ingen soptunna, ingen tvättbalja.',
  'Aldrig ögonvita med pupill i. Ögonen är solida vita prickar, det är vårt avstånd till Duo.',
  'Aldrig rakt framifrån med tassarna ihop. Huvudet är alltid kvartsvridet och minst en tass i arbete.',
  'Aldrig svart. Den mörka tonen är alltid härledd ur tillståndsfärgen, aldrig #000.',
  'Aldrig stroke, gradient, filter eller oskarp skugga. Skuggan är en pillerform, aldrig en oval.',
  'Aldrig fler än tre svansringar och aldrig en fjärde ansiktsmin. Tre bedömningar, tre miner.',
  'Aldrig en ledsen eller gråtande maskot som straff för att användaren varit borta. Det är Duos beteendespråk.',
];

// Tre toner plus vitt. Ett byte färgar om hela figuren.
// bas och mork är Prikkos befintliga par. ljus är basen blandad med vitt,
// tillräckligt mycket för att den mörka tonen ska synas mot den.
export const TONER = {
  blue:  { ljus: '#7FBDF0', bas: '#007BE0', mork: '#0063B4' },
  clean: { ljus: '#7FDC97', bas: '#00B92B', mork: '#009523' },
  minor: { ljus: '#FFE79A', bas: '#FECB00', mork: '#DEB201' },
  major: { ljus: '#FF9E96', bas: '#EB0000', mork: '#C50000' },
};
const VIT = '#FFFFFF';
const SILUETTFARG = '#111111';

// ---------------------------------------------------------------------------
// FORM 4: SILHUETTEN. Huvud, öron och kropp är EN enda bana.
// Öronen är utskurna ur konturen, inte pålagda ovanpå den.
// Höger öra är vikt i toppen. Det är figurens egenhet.
// Massan lutar åt höger upptill och åt vänster nedtill, alltså framåt.
// ---------------------------------------------------------------------------
const SILUETT_D = [
  'M34,52',
  'C30,38 32,14 46,13',     // vänster öra, brett och rundat, aldrig kattspetsigt
  'C54,13 59,21 62,28',     // vänster öra, innersida ned mot skallen
  'C70,23 79,22 87,27',     // skalltak
  'C89,18 95,12 100,16',    // höger öra upp
  'C104,20 101,27 96,31',   // höger öra, spetsen lutar framåt. Egenheten.
  'C97,40 98,50 96,58',     // huvudets högersida
  'C96,70 92,84 84,96',     // kinden ned i bringan, en obruten linje
  'C78,104 64,108 52,105',  // buken
  'C38,102 26,88 28,70',    // gumpen, hög rygg
  'C29,62 31,56 34,52Z',    // vänster kind
].join('');

// FORM 8: ansiktsfältet i ljus ton. Stort, så att masken har ljust ovanför
// sig, under sig och utanför sig. Utan den marginalen syns masken inte alls.
const PANNA_D =
  'M65,25C81,25 92,35 92,49C92,65 80,77 64,77' +
  'C48,77 37,65 37,49C37,35 49,25 65,25Z';

// ---------------------------------------------------------------------------
// Bézierhjälpare. Svansen, masken och munnen blir FYLLDA former med runda
// ändar utan ett enda stroke-attribut.
// ---------------------------------------------------------------------------
const f2 = (n) => Number(n.toFixed(2));

function bezPunkt(P, t) {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [
    a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0],
    a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1],
  ];
}

function bezTangent(P, t) {
  const u = 1 - t;
  const a = 3 * u * u, b = 6 * u * t, c = 3 * t * t;
  const x = a * (P[1][0] - P[0][0]) + b * (P[2][0] - P[1][0]) + c * (P[3][0] - P[2][0]);
  const y = a * (P[1][1] - P[0][1]) + b * (P[2][1] - P[1][1]) + c * (P[3][1] - P[2][1]);
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}

// Fyllt band längs en kubisk kurva, med valfri halvbredd per t.
function band(P, t0, t1, halvbredd, opt = {}, steg = 22) {
  const H = typeof halvbredd === 'function' ? halvbredd : () => halvbredd;
  const A = [], B = [];
  for (let i = 0; i <= steg; i++) {
    const t = t0 + (t1 - t0) * (i / steg);
    const [x, y] = bezPunkt(P, t);
    const [tx, ty] = bezTangent(P, t);
    const h = H(t);
    A.push([x - ty * h, y + tx * h]);
    B.push([x + ty * h, y - tx * h]);
  }
  let d = `M${f2(A[0][0])},${f2(A[0][1])}`;
  for (let i = 1; i <= steg; i++) d += `L${f2(A[i][0])},${f2(A[i][1])}`;
  if (opt.kapEnd) {
    const h = f2(H(t1));
    d += `A${h},${h} 0 0 0 ${f2(B[steg][0])},${f2(B[steg][1])}`;
  } else {
    d += `L${f2(B[steg][0])},${f2(B[steg][1])}`;
  }
  for (let i = steg - 1; i >= 0; i--) d += `L${f2(B[i][0])},${f2(B[i][1])}`;
  if (opt.kapStart) {
    const h = f2(H(t0));
    d += `A${h},${h} 0 0 0 ${f2(A[0][0])},${f2(A[0][1])}`;
  }
  return d + 'Z';
}

// Kapsel som bana. Rundad rektangel med full radie, Duolingos favoritprimitiv.
function kapselD(cx, cy, w, h, vinkel = 0) {
  const r = h / 2, L = w / 2, a = (vinkel * Math.PI) / 180;
  const co = Math.cos(a), si = Math.sin(a);
  const p = (lx, ly) => [f2(cx + lx * co - ly * si), f2(cy + lx * si + ly * co)];
  const P1 = p(-L + r, -r), P2 = p(L - r, -r), P3 = p(L - r, r), P4 = p(-L + r, r);
  return `M${P1[0]},${P1[1]}L${P2[0]},${P2[1]}A${f2(r)},${f2(r)} 0 0 1 ${P3[0]},${P3[1]}` +
         `L${P4[0]},${P4[1]}A${f2(r)},${f2(r)} 0 0 1 ${P1[0]},${P1[1]}Z`;
}

// ---------------------------------------------------------------------------
// SVANSEN. Ringsvansen är figurens andra igenkänningstecken.
// Fyra former: grundform plus tre mörka ringar, där den sista är spetsen.
// ---------------------------------------------------------------------------
const SVANSAR = {
  upp:   [[36, 92], [10, 96], [2, 60], [12, 38]],
  hog:   [[36, 90], [8, 92], [2, 56], [14, 34]],
  lag:   [[36, 94], [12, 102], [2, 82], [10, 60]],
  tight: [[36, 92], [14, 98], [8, 66], [18, 48]],
};
const SVANS_BREDD = (t) => 10.5 - 5.6 * Math.pow(t, 1.4);
const RINGAR = [[0.30, 0.42], [0.55, 0.67], [0.82, 1.0]];

// ---------------------------------------------------------------------------
// MASKEN, alltså brynet. Två halvor delade av en ljus strimma över nosryggen,
// precis som hos en riktig tvättbjörn. Delningen är det som hindrar masken
// från att smeta ihop till ett enda mörkt fält i 24 px.
// Varje halva är tjockast över ögat och smalnar av åt båda hållen, så att
// dess silhuett aldrig blir en rektangel.
// ---------------------------------------------------------------------------
const MASK_V = [[62, 46], [55, 45.5], [47, 44], [39, 42]];
const MASK_H = [[68, 45], [75, 44.5], [83, 43], [91, 41]];
const MASK_V_MITT = [50.5, 44.4];
const MASK_H_MITT = [79.5, 43.4];
const MASK_BREDD = (t) => 6.5 + 3.5 * Math.sin(Math.PI * t);

// ---------------------------------------------------------------------------
// ANSIKTSSYSTEMET. Utbytbara delar, namngivna.
//   munbage    nyckel i MUNNAR. Den primära bäraren av bedömningen.
//   bryn.v/.h  maskhalvornas lutning i grader kring sin egen mitt.
//              Positivt = inre änden sjunker mot nosryggen, alltså arg.
//              Negativt = inre änden lyfter, alltså mjuk båge över ögonen.
//   ogonlock   ögonens radie som faktor. Under 1 läser som hopknipet.
//   pupillDy   ögonen flyttas ned i masken, spänt.
//   pupillInat ögonen dras mot mitten, konvergerar.
// ---------------------------------------------------------------------------
const MUNNAR = {
  glad:      [[54, 62], [59, 70], [71, 70.5], [79, 61.5]],
  rak:       [[54, 66], [60, 66.8], [71, 66.4], [79, 65]],
  ledsen:    [[54, 70], [60, 63], [71, 62.5], [79, 69.5]],
  liten:     [[62, 65], [66, 68], [74, 67.4], [79, 64]],
  litenglad: [[58, 64], [64, 69.5], [73, 69.5], [80, 62.5]],
  snett:     [[55, 67], [62, 62.5], [71, 69.5], [79, 65]],
};

// Nio uttryck, alla med egen kropp. [cx, cy, bredd, hojd, vinkel] per tass.
const LAGE = {
  clean: {
    munbage: 'glad', bryn: { v: -8, h: -8 }, ogonlock: 1.05, pupillDy: -1, pupillInat: 0,
    lut: 2, svans: 'hog',
    tassA: [90, 95, 16, 12, 12], tassB: [88, 80, 14, 11, -56], bak: [42, 102, 21, 12, -4],
  },
  minor: {
    munbage: 'rak', bryn: { v: 12, h: -3 }, ogonlock: 0.93, pupillDy: 0, pupillInat: 0.6,
    lut: 4, svans: 'upp',
    tassA: [92, 99, 16, 12, 16], tassB: [86, 88, 14, 11, -32], bak: [42, 101, 21, 12, -6],
  },
  major: {
    munbage: 'ledsen', bryn: { v: 20, h: 20 }, ogonlock: 0.78, pupillDy: 1.5, pupillInat: 1.6,
    lut: 6, svans: 'lag',
    tassA: [93, 102, 16, 12, 8], tassB: [84, 100, 14, 11, 2], bak: [41, 100, 21, 12, -9],
  },
  soker: {
    munbage: 'liten', bryn: { v: 6, h: -11 }, ogonlock: 0.9, pupillDy: 0.6, pupillInat: 1,
    lut: 7, svans: 'lag',
    tassA: [95, 104, 16, 12, 10], tassB: [85, 101, 14, 11, 4], bak: [40, 99, 21, 12, -10],
  },
  hittat: {
    munbage: 'oppen', bryn: { v: -16, h: -16 }, ogonlock: 1.16, pupillDy: -1.5, pupillInat: 0,
    lut: -5, svans: 'hog',
    tassA: [95, 66, 16, 12, -48], tassB: [85, 76, 14, 11, -62], bak: [45, 103, 21, 12, 2],
  },
  vantar: {
    munbage: 'rak', bryn: { v: 1, h: 1 }, ogonlock: 0.97, pupillDy: 0, pupillInat: 0,
    lut: 1, svans: 'tight',
    tassA: [89, 84, 15, 11, -74], tassB: [88, 98, 14, 11, 4], bak: [43, 103, 21, 12, -2],
  },
  nojd: {
    munbage: 'litenglad', bryn: { v: -5, h: -10 }, ogonlock: 1.0, pupillDy: -1, pupillInat: 0,
    lut: 2, svans: 'hog',
    tassA: [91, 96, 16, 12, 10], tassB: [89, 81, 14, 11, -56], bak: [43, 103, 21, 12, -3],
  },
  tom: {
    munbage: 'liten', bryn: { v: -12, h: -4 }, ogonlock: 1.05, pupillDy: -1, pupillInat: 0,
    lut: -3, svans: 'tight',
    tassA: [96, 82, 16, 12, -16], tassB: [80, 84, 14, 11, -164], bak: [44, 104, 21, 12, 0],
  },
  fyrafyra: {
    munbage: 'snett', bryn: { v: -18, h: 10 }, ogonlock: 0.98, pupillDy: 0, pupillInat: 0,
    lut: -6, svans: 'lag',
    tassA: [103, 22, 15, 11, -62], tassB: [91, 94, 14, 11, -14], bak: [44, 104, 21, 12, 1],
  },
};

// ---------------------------------------------------------------------------
// figur(o)
//   size     px, kvadratisk
//   ton      'blue' | 'clean' | 'minor' | 'major'
//   uttryck  nyckel ur UTTRYCK
//   siluett  true ger EN enda fylld bana i en enda färg, faviconläget
//   ansikte  true beskär till ansiktet, för 40 px och mindre
//   klass    sätts på svg-elementet
// ---------------------------------------------------------------------------
export function figur({
  size = 160,
  ton = 'blue',
  uttryck = 'clean',
  siluett = false,
  ansikte = false,
  klass = '',
} = {}) {
  const t = TONER[ton] || TONER.blue;
  const L = LAGE[uttryck] || LAGE.clean;
  const mini = ansikte && size <= 20;

  const kl = klass ? ` class="${klass}"` : '';
  // BESKÄRNINGEN ligger HELT INNANFÖR huvudets kontur. Huvudet fyller alltså
  // hela rutan i grundtonen, samma färg som den centrala ramen, och konturen
  // försvinner. Kvar syns bara masken, ögonen och munbågen. Masken går ut
  // genom båda sidokanterna, vilket är det som räddar den i 24 px.
  const vb = ansikte ? (mini ? '45 35 42 42' : '43 33 46 46') : '0 0 120 120';
  const oppna = `<svg width="${size}" height="${size}" viewBox="${vb}" ` +
    `xmlns="http://www.w3.org/2000/svg" role="img"${kl} ` +
    `aria-label="Prikkos tvättbjörn, ${UTTRYCK[uttryck] || ''}">`;

  const svansP = SVANSAR[L.svans] || SVANSAR.upp;

  // -------------------------------------------------------------------------
  // ENPATHSLÄGET. Hela figuren kollapsar till en enda fylld bana i en färg.
  // Silhuetten, svansen och de tre tassarna ligger som delbanor i samma d.
  // -------------------------------------------------------------------------
  if (siluett) {
    const d = [
      SILUETT_D,
      band(svansP, 0, 1, SVANS_BREDD, { kapEnd: true }),
      kapselD(...L.bak),
      kapselD(...L.tassB),
      kapselD(...L.tassA),
    ].join('');
    return oppna +
      `<g transform="rotate(${L.lut} 60 80)">` +
      `<path d="${d}" fill="${SILUETTFARG}"/></g></svg>`;
  }

  const ut = [];

  // ---- FORM 1: skuggan. En PILLERFORM, aldrig en oval. Ritas oroterad.
  if (!ansikte) {
    ut.push(`<rect x="24" y="110" width="66" height="8" rx="4" fill="${t.mork}" opacity="0.16"/>`);
  }

  // Helfigur vrids kring höften. Beskuret ansikte vrids kring huvudets mitt,
  // så att beskärningen håller oavsett uttryck.
  ut.push(`<g transform="${ansikte ? 'rotate(4 65 50)' : `rotate(${L.lut} 60 80)`}">`);

  if (!ansikte) {
    // ---- FORM 2: svansen.
    ut.push(`<path d="${band(svansP, 0, 1, SVANS_BREDD, { kapEnd: true })}" fill="${t.bas}"/>`);
    // ---- FORM 3: ringarna, tre stycken. Den sista är den mörka spetsen.
    for (const [a, b] of RINGAR) {
      ut.push(`<path d="${band(svansP, a, b, (x) => SVANS_BREDD(x) + 0.35, { kapEnd: b >= 1 })}" fill="${t.mork}"/>`);
    }
    // ---- FORM 5: bakfoten, bakom kroppen.
    ut.push(`<path d="${kapselD(...L.bak)}" fill="${t.mork}"/>`);
  }

  // ---- FORM 4: silhuetten, en enda bana.
  ut.push(`<path d="${SILUETT_D}" fill="${t.bas}"/>`);

  if (!ansikte) {
    // ---- FORM 6 och 7: framtassarna. Alltid i arbete, aldrig i givakt.
    ut.push(`<path d="${kapselD(...L.tassB)}" fill="${t.mork}"/>`);
    ut.push(`<path d="${kapselD(...L.tassA)}" fill="${t.mork}"/>`);
  }

  // ---- FORM 8: ansiktsfältet i ljus ton.
  ut.push(`<path d="${PANNA_D}" fill="${t.ljus}"/>`);

  // ---- FORM 9 och 10: maskens två halvor, alltså brynet.
  const bv = mini ? L.bryn.v * 1.3 : L.bryn.v;
  const bh = mini ? L.bryn.h * 1.3 : L.bryn.h;
  ut.push(`<path d="${band(MASK_V, 0, 1, MASK_BREDD, { kapStart: true, kapEnd: true })}"` +
    ` transform="rotate(${f2(bv)} ${MASK_V_MITT[0]} ${MASK_V_MITT[1]})" fill="${t.mork}"/>`);
  ut.push(`<path d="${band(MASK_H, 0, 1, MASK_BREDD, { kapStart: true, kapEnd: true })}"` +
    ` transform="rotate(${f2(-bh)} ${MASK_H_MITT[0]} ${MASK_H_MITT[1]})" fill="${t.mork}"/>`);

  // ---- FORM 11 och 12: ögonen. SOLIDA VITA PRICKAR utan ögonvita.
  // De sitter LÅGT i masken och bryter dess underkant, så att bandet får två
  // vita hack och aldrig kan smeta ihop till en enda mörk stapel.
  // Olika stora, huvudet är kvartsvridet åt höger.
  const s = L.ogonlock, dy = L.pupillDy, di = L.pupillInat;
  ut.push(`<circle cx="${f2(52 + di)}" cy="${f2(48 + dy)}" r="${f2(6.4 * s)}" fill="${VIT}"/>`);
  ut.push(`<circle cx="${f2(79 - di)}" cy="${f2(47 + dy)}" r="${f2(6.9 * s)}" fill="${VIT}"/>`);

  // ---- FORM 13: munbågen. Fylld form med runda ändar, inget stroke.
  // Mörk ton mot det ljusa ansiktsfältet. Det ger bättre kontrast i alla fyra
  // tillstånd än vitt gör, särskilt i det gula, och geometrin är densamma som
  // i bedömningsmärket: två prickar och en båge.
  if (L.munbage === 'oppen') {
    ut.push(`<path d="${kapselD(68, 66, 14, 12, -6)}" fill="${t.mork}"/>`);
  } else {
    ut.push(`<path d="${band(MUNNAR[L.munbage] || MUNNAR.rak, 0, 1, mini ? 3.6 : 2.8, { kapStart: true, kapEnd: true }, 14)}" fill="${t.mork}"/>`);
  }

  ut.push('</g>');
  return oppna + ut.join('') + '</svg>';
}

export default figur;
