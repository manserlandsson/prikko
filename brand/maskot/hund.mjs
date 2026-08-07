// Prikkos maskot: SPÅRHUNDEN.
// Blodhund i tjänst. Nosen är tyngdpunkten, öronen gör siluettarbetet,
// MUNBÅGEN och ingenting annat bär bedömningen.
//
// Konstruktion enligt Duolingos egen regel: allt är byggt av tre grundformer,
// cirkeln, den rundade stapeln och det böjda bandet. Inga spetsiga former,
// inga stroke, inga gradienter, inga masker, inga id.
// Alla transformer är bakade i koordinaterna, aldrig i ett g-element, så att
// hela figuren kan kollapsa till EN fylld bana för favicon.
//
// 120-ruta, marken på y=116.

// ============================================================ 1. FÄRG
// Tre toner plus vitt. Mörka tonen är Prikkos egen, ljusa härleds ur grunden.
const PALETT = {
  blue:  { bas: '#007BE0', mork: '#0063B4' },
  clean: { bas: '#00B92B', mork: '#009523' },
  minor: { bas: '#FECB00', mork: '#DEB201' },
  major: { bas: '#EB0000', mork: '#C50000' }
};
const ljusna = (hex, t) =>
  '#' + [0, 2, 4].map((i) => {
    const v = parseInt(hex.slice(1 + i, 3 + i), 16);
    return Math.round(v + (255 - v) * t).toString(16).padStart(2, '0');
  }).join('');
const toner = (ton) => {
  const p = PALETT[ton] || PALETT.blue;
  return { ljus: ljusna(p.bas, 0.42), bas: p.bas, mork: p.mork, vit: '#fff' };
};

// ============================================================ 2. GRUNDFORMER
const n = (v) => Math.round(v * 100) / 100;
// Transform som bakas in i punkterna. Bara vridning och flytt, alltså behåller
// cirklar sin radie och figuren kan aldrig få ojämn linjetjocklek.
const T = (grad = 0, cx = 0, cy = 0, dx = 0, dy = 0) => {
  const a = (grad * Math.PI) / 180, s = Math.sin(a), c = Math.cos(a);
  return (x, y) => [
    cx + (x - cx) * c - (y - cy) * s + dx,
    cy + (x - cx) * s + (y - cy) * c + dy
  ];
};
const ID = T();
const kombinera = (yttre, inre) => (x, y) => yttre(...inre(x, y));

// Cirkeln. Duolingos regel: ett tassavtryck är en perfekt cirkel.
const cirkel = (m, x0, y0, r) => {
  const [x, y] = m(x0, y0);
  return `M${n(x - r)} ${n(y)}A${n(r)} ${n(r)} 0 1 0 ${n(x + r)} ${n(y)}A${n(r)} ${n(r)} 0 1 0 ${n(x - r)} ${n(y)}Z`;
};

// Kapseln: rundad stapel mellan två cirklar med olika radie. Ger avsmalnande
// lemmar, öron och kroppar utan en enda spetsig ände.
const kapsel = (m, ax, ay, r1, bx, by, r2) => {
  const [x1, y1] = m(ax, ay), [x2, y2] = m(bx, by);
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  if (L < 0.01 || L <= Math.abs(r1 - r2)) return cirkel(ID, x1, y1, Math.max(r1, r2));
  const fi = Math.atan2(dy, dx), beta = Math.acos((r1 - r2) / L);
  const a1 = fi + beta, a2 = fi - beta;
  const P = (x, y, r, a) => `${n(x + r * Math.cos(a))} ${n(y + r * Math.sin(a))}`;
  return (
    `M${P(x1, y1, r1, a1)}L${P(x2, y2, r2, a1)}` +
    `A${n(r2)} ${n(r2)} 0 ${beta > Math.PI / 2 ? 1 : 0} 0 ${P(x2, y2, r2, a2)}` +
    `L${P(x1, y1, r1, a2)}` +
    `A${n(r1)} ${n(r1)} 0 ${beta < Math.PI / 2 ? 1 : 0} 0 ${P(x1, y1, r1, a1)}Z`
  );
};

// Bandet: böjt, avsmalnande, rundade ändar. Munnen och brynen ritas med det,
// och blir därmed figurens minst geometriska former, som de ska vara.
const band = (m, ax, ay, kx, ky, bx, by, w0, w1, steg = 11) => {
  const [x0, y0] = m(ax, ay), [cx, cy] = m(kx, ky), [x1, y1] = m(bx, by);
  const ov = [], un = [];
  for (let i = 0; i <= steg; i++) {
    const t = i / steg, u = 1 - t;
    const px = u * u * x0 + 2 * u * t * cx + t * t * x1;
    const py = u * u * y0 + 2 * u * t * cy + t * t * y1;
    const tx = 2 * (u * (cx - x0) + t * (x1 - cx));
    const ty = 2 * (u * (cy - y0) + t * (y1 - cy));
    const L = Math.hypot(tx, ty) || 1, w = w0 + (w1 - w0) * t;
    ov.push(`${n(px - (ty / L) * w)} ${n(py + (tx / L) * w)}`);
    un.push(`${n(px + (ty / L) * w)} ${n(py - (tx / L) * w)}`);
  }
  return (
    `M${ov[0]}L${ov.slice(1).join('L')}` +
    `A${n(w1)} ${n(w1)} 0 0 1 ${un[steg]}` +
    `L${un.slice(0, steg).reverse().join('L')}` +
    `A${n(w0)} ${n(w0)} 0 0 1 ${ov[0]}Z`
  );
};

// Kalotten: cirkelns kapade del. Ger ett tonfält med HÅRD kant som slutar
// exakt vid silhuettens kant, utan mask och utan clipPath.
const kalott = (m, cx0, cy0, r, rx, ry, t) => {
  const [cx, cy] = m(cx0, cy0);
  const [ox, oy] = m(0, 0), [px, py] = m(rx, ry);
  const a = Math.atan2(py - oy, px - ox);
  const b = Math.acos(Math.max(-1, Math.min(1, t / r)));
  const p = (v) => `${n(cx + r * Math.cos(v))} ${n(cy + r * Math.sin(v))}`;
  return `M${p(a - b)}A${n(r)} ${n(r)} 0 ${b > Math.PI / 2 ? 1 : 0} 0 ${p(a + b)}Z`;
};

// Tassen: en dyna och tre tår, alltså riktiga ändar och inga rundade linjeslut.
const tass = (m, x, y, rikt, r) =>
  cirkel(m, x, y, r) +
  cirkel(m, x + rikt * 0.95 * r, y - 0.38 * r, r * 0.6) +
  cirkel(m, x + rikt * 0.8 * r, y + 0.55 * r, r * 0.56) +
  cirkel(m, x + rikt * 0.1 * r, y + 0.72 * r, r * 0.54);

// ============================================================ 3. MÅTT
// Huvudet i eget system. Nacken (48,56) är vridpunkt.
// Mulen sitter nästan rakt under skallen, bara lätt vriden åt vänster, så att
// ansiktet fyller en kvadrat. Den lilla vridningen är hela kvartsvridningen.
const SK = [44, 30, 14.5];        // skalle
const MU = [40, 47, 9.6];         // mulen, EN mörk massa. Nosknappen är bortvald.
const MASK = [37, 29, 6.6, 48.8, 27.4, 6.2]; // ögonmask, kapsel över båda ögonen
const OGA_N = [36.6, 29, 4.4];    // nära öga
const OGA_B = [48.8, 27.4, 3.9];  // bortre öga, mindre: den medvetna asymmetrin
const ORA_N = [33, 34, 5.4, 26, 61, 8];   // vänster öra, fäste till lob
const ORA_B = [55, 32, 5, 63, 54, 7.2];   // höger öra, kortare och smalare
const NACKE = [48, 56];
// Huvudets egen ruta. Skallen och mulen tillsammans upptar x 28,4 till 58,5 och
// y 15,5 till 56,6, alltså 30 brett och 41 högt med mitt i (43,5 , 36).
// Rutan är 38 och centrerad där, så att hjässan och hakan skärs ett par enheter
// och öronen går ut genom sidorna. Det är beskärning, inte förminskning.
const ANSIKTSRUTA = '25.5 17 38 38';
const AXEL = [56, 64, 12.5];
const HOFT = [66, 85, 10.5];

// ============================================================ 4. ANSIKTET
// Bedömningen bärs av EN parameter, k. Munbågens krökning ÄR bedömningen.
// Ögonprickens läge, ögonlocket och brynhöjden är alla HÄRLEDDA ur samma k,
// inte egna reglage. Öronen och kroppen är identiska i de tre tillstånden,
// så att ingenting utom ansiktet kan bära betydelsen.
const bedomning = (k) => ({
  blick: [k * 0.6 + 0.3, -k * 1.8],
  // vid k=0 halvslutet på ENA ögat, alltså tydlig asymmetri mitt emellan
  lock: [k >= 0 ? k * 0 : -k * 0.5, k >= 0 ? 0 : -k * 0.34],
  bryn: [k * 2.6 + 0.3, k * 2.1 + 0.2, -k * 8],
  mun: [k, 0, 0.92 + k * 0.05],
  hrot: -k * 7
});
// Mellanläget får sitt eget ansikte: ett halvslutet öga och ett lyft bryn,
// alltså skeptiskt. Utan det blev gult och grönt lika i gråskala.
const MELLAN = { blick: [1.1, 0.2], lock: [0.46, 0.04], bryn: [2.4, -1.6, 4], mun: [0.05, 0.3, 0.9], hrot: 3 };
// De sex övriga uttrycken är riktiga poser, inte samma figur med bytt mun.
const ANSIKTE = {
  clean: bedomning(1),
  minor: MELLAN,
  major: bedomning(-1),
  soker:    { blick: [-0.9, 1.2], lock: [0.24, 0.16], bryn: [0.6, 0.2, 3],   mun: [0.1, 0.4, 0.66], hrot: 9 },
  hittat:   { blick: [1.3, -1.8], lock: [0, 0],       bryn: [3.2, 2.8, -7],  mun: [1.4, -0.2, 0.8], hrot: -16 },
  vantar:   { blick: [1.6, 0.5],  lock: [0.5, 0.32],  bryn: [1.4, -1, 2],    mun: [0, 0.5, 0.62],   hrot: -8 },
  nojd:     { blick: [0.6, -0.5], lock: [0.52, 0.46], bryn: [2, 1.6, -3],    mun: [0.85, 0, 0.92],  hrot: -6 },
  tom:      { blick: [-1.6, -1],  lock: [0.18, 0.12], bryn: [1.2, 0, -1],    mun: [0.05, -0.4, 0.56], hrot: -20 },
  fyrafyra: { blick: [1.7, -0.4], lock: [0.08, 0.34], bryn: [3, -1.8, 6],    mun: [-0.25, 0.6, 0.58], hrot: -28 },
  hittat_anticip: { blick: [-0.6, 0.4], lock: [0.3, 0.24], bryn: [2.6, 2.2, -4], mun: [0.2, 0.4, 0.5], hrot: 12 },
  hittat_over:    { blick: [1.6, -2.2], lock: [0, 0],      bryn: [3.6, 3.2, -8], mun: [1.6, -0.3, 0.86], hrot: -22 }
};

// ============================================================ 5. POSER
// Grundställning finns inte. Hunden är alltid i arbete: kroppen lutar framåt,
// ena framtassen är lyft, bakbenen står i kliv.
// De tre bedömningstillstånden delar EXAKT samma kropp och samma öron.
// De tre bedömningstillstånden har VAR SIN pose, eftersom de annars blev
// omöjliga att skilja åt i gråskala i fritt läge. Munbågen är fortfarande
// den som BÄR bedömningen, posen är redundant förstärkning av samma tal.
const POSER = {
  // hög och sträckt, huvudet upp, svansen upp, en tass högt lyft
  clean:    { luta: -16, orN: -18, orB: -22, kliv: 1.05, lyft: 0.95, hojd: -4, spar: 0, sitter: 0 },
  // stannad mitt i steget, huvudet på sned, tassen halvvägs, svansen rakt ut
  minor:    { luta: -2,  orN: -12, orB: 10,  kliv: 0.35, lyft: 0.5,  hojd: 0,  spar: 0, sitter: 0 },
  // låg och hukande, nosen mot marken, öronen rakt ner, svansen ner
  major:    { luta: 20,  orN: 12,  orB: 16,  kliv: 0.5,  lyft: 0,    hojd: 7,  spar: 2, sitter: 0 },
  soker:    { luta: 7,   orN: -6,  orB: -14, kliv: 1.25, lyft: 0.25, hojd: 2,  spar: 3, sitter: 0 },
  hittat:   { luta: -12, orN: -26, orB: -30, kliv: 0,    lyft: 0,    hojd: 0,  spar: 1, sitter: 1 },
  vantar:   { luta: -4,  orN: 6,   orB: -6,  kliv: 0.2,  lyft: 0,    hojd: 1,  spar: 0, sitter: 0 },
  nojd:     { luta: -9,  orN: -12, orB: -16, kliv: 0.5,  lyft: 0.9,  hojd: -2, spar: 0, sitter: 0 },
  tom:      { luta: -6,  orN: -14, orB: -4,  kliv: 0.35, lyft: 0.15, hojd: 0,  spar: 0, sitter: 0 },
  fyrafyra: { luta: -2,  orN: -20, orB: 16,  kliv: 0.75, lyft: 0.85, hojd: 0,  spar: 0, sitter: 0 },
  // Anticipation: figuren drar sig BAKÅT och ihop innan den kastar sig fram.
  hittat_anticip: { luta: -26, orN: 16, orB: 20, kliv: 0.3, lyft: 0, hojd: 5, spar: 1, sitter: 0.5 },
  // Overshoot: den går för långt fram och studsar tillbaka.
  hittat_over:    { luta: 24,  orN: -40, orB: -46, kliv: 0.9, lyft: 0.5, hojd: -3, spar: 1, sitter: 0 }
};

// ============================================================ 5b. GÅNGCYKELN
// Åtta bildrutor, ritade som en riktig cykel. Ren transform kan bara flytta och
// vrida befintliga former, den kan inte ÄNDRA en form. Därför bildrutor.
//  0 och 4  kontakt, tassen sätter i marken. Varandras spegling.
//  1 och 5  nedgång, kroppen lägst, benen mest böjda.
//  2 och 6  passering, det ena benet passerar det andra, kroppen på väg upp.
//  3 och 7  uppgång, kroppen högst, tassen sträckt bakåt.
// Huvudet och öronen följer kroppen med EN RUTA fördröjning. Det är tyngden.
export const GANG = { rutor: 8, halltid: [90, 70, 70, 110, 90, 70, 70, 110] };

const H_HOJD = [0, 4.6, 0.6, -4.2, 0, 4.6, 0.6, -4.2];   // kroppens höjd, ner och upp
const GANGRUTOR = H_HOJD.map((h, i) => {
  const fram = [9, 5, 0, -5, -9, -6, 0, 6][i];   // nära fotens läge i steget
  const bak = [-9, -6, 0, 6, 9, 5, 0, -5][i];    // bortre fotens, en halv cykel fel
  const sving = [0, 0, -4.5, 0, 0, 0, 0, 0][i];  // nära tassen lyft vid passering
  const svingB = [0, 0, 0, 0, 0, 0, -4.5, 0][i]; // bortre tassen lyft vid passering
  const boj = [2, 5.5, 1.5, 0, 2, 5.5, 1.5, 0][i];   // knäböjen, störst i nedgång
  return {
    hojd: h,
    fotNdx: fram, fotBdx: bak, fotNdy: sving, fotBdy: svingB, boj,
    armNdx: -fram * 0.8, armBdx: -bak * 0.8,
    // en ruta efter kroppen, alltid
    huvudDy: H_HOJD[(i + 7) % 8] * 0.8,
    oron: [9, -11, -9, 11, 9, -11, -9, 11][i]
  };
});

export const META = {
  namn: 'Prikko, hunden',
  koncept: 'En blodhund i tjänst, alltid mitt i ett spår, som markerar fynd genom att sätta sig ner i stället för att skälla.',
  former: 13,
  farger: 4,
  egenhet: 'Den har ingen ritad nosknapp. Hela mulen är nosen, en enda mörk massa, vilket är det enda draget som gör en tecknad hund omöjlig att förväxla med alla andra tecknade hundar.',
  svaghet: 'Spårhund för en tjänst som spårar upp saker är en bokstavlig metafor, och hund är dessutom det mest ritade djuret som finns.'
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
  hittat_anticip: 'Hittat något, anticipation',
  hittat_over: 'Hittat något, overshoot'
};

// ============================================================ 6. FIGUREN
export function figur({
  size = 160,
  ton = 'blue',
  uttryck = 'clean',
  siluett = false,
  ansikte = false,
  enbana = false,
  steg = null,
  blink = 0,
  klass = ''
} = {}) {
  const u = POSER[uttryck] ? uttryck : 'clean';
  const g = steg === null || steg === undefined ? null : GANGRUTOR[((steg % 8) + 8) % 8];
  const p = g ? { ...POSER[u], luta: 2, lyft: 0, kliv: 0, hojd: g.hojd, spar: 0 } : POSER[u];
  const a0 = ANSIKTE[u];
  const a = blink
    ? { ...a0, lock: [blink === 2 ? 1 : 0.52, blink === 2 ? 1 : 0.5] }
    : a0;
  const t = toner(ton);
  const en = enbana || siluett;
  const c = en
    ? { ljus: '#111', bas: '#111', mork: '#111', vit: '#111' }
    : t;

  // ---------------------------------------------------------- HUVUDET
  const [bx, by] = a.blick;
  // Hela huvudet byggs ur EN transform, så att det kan sitta antingen på
  // kroppen eller ensamt i den beskurna kvadraten utan att ritas om.
  const byggHuvud = (yttre) => {
    const H = kombinera(yttre, T(a.hrot, NACKE[0], NACKE[1]));
    const huvudD = kapsel(H, SK[0], SK[1], SK[2], MU[0], MU[1], MU[2]) + cirkel(H, ...SK);
    // Ögonmasken är MÖRKARE än kroppen, tvärtemot Duos ljusa mask. Det är
    // förutsättningen för att de solida vita prickögonen ska hålla i 24 px.
    const markD = kapsel(H, ...MASK) + cirkel(H, ...MU);
    const ogonD =
      cirkel(H, OGA_N[0] + bx, OGA_N[1] + by, OGA_N[2]) +
      cirkel(H, OGA_B[0] + bx * 0.8, OGA_B[1] + by * 0.8, OGA_B[2]);
    // Ögonlocket är en cirkel i maskens ton som skjuts ner över pricken.
    const lockA = (o, g, f) =>
      g <= 0.01 ? '' : cirkel(H, o[0] + bx - 1.4 + g * 1.6, o[1] + by - (o[2] + 0.6) * 2 + g * (o[2] + 0.6) * 2.1 - f, o[2] + 0.6);
    const lockD = lockA(OGA_N, a.lock[0], 0) + lockA(OGA_B, a.lock[1], 0.5);
    // Brynen ligger på masken i ljus ton, alltså hundens tanfläckar över ögat.
    const brynD =
      band(H, 33.4, 24.6 - a.bryn[0], 36.6, 22.8 - a.bryn[0] - a.bryn[2] * 0.1, 40.2, 23.6 - a.bryn[0] + a.bryn[2] * 0.14, 1.8, 1.3, 6) +
      band(H, 45.6, 23 - a.bryn[1], 48.8, 21.4 - a.bryn[1] - a.bryn[2] * 0.09, 52, 22.2 - a.bryn[1] + a.bryn[2] * 0.12, 1.6, 1.15, 6);
    // Munnen: en båge under nosen, längs mulens underkant. Nosen sitter HÖGT
    // på mulen och munnen lågt, så de delar mule men aldrig samma yta.
    const [mb, mf, ml] = a.mun;
    const m0 = [32.4 + (1 - ml) * 2.4, 49.8 + mf], m1 = [32.4 + 15.4 * ml, 49.8 + mf - 1.2 * ml - mb * 0.9];
    const munD = band(
      H, m0[0], m0[1],
      (m0[0] + m1[0]) / 2 + 0.9, (m0[1] + m1[1]) / 2 + 4 * mb + 1.4,
      m1[0], m1[1], 2.6, 2, 10
    );
    // Hängöron ska SLÄPA EFTER kroppen med en ruta och svänga tydligt. Det är
    // den billigaste livgivaren som finns i en hundfigur.
    const sv = g ? g.oron : 0;
    const oronD =
      kapsel(kombinera(H, T(p.orN + sv, ORA_N[0], ORA_N[1])), ...ORA_N) +
      kapsel(kombinera(H, T(p.orB + sv * 0.8, ORA_B[0], ORA_B[1])), ...ORA_B);
    return [
      [oronD, c.mork],
      [huvudD, c.ljus],
      [markD, c.mork],
      [munD, c.vit],
      [ogonD, c.vit],
      [lockD, c.mork],
      [brynD, c.ljus]
    ];
  };

  // ---------------------------------------------------------- INRAMAT LÄGE
  // Nedskalning görs genom BESKÄRNING, inte krympning. Bortfallsordning:
  // 1 spår, 2 skugga, 3 ben och fötter, 4 bål och armar, 5 bringans ljusa fält,
  // 6 öronen skärs av ramens sidor och blir två mörka fält längs kanterna.
  // Huvudets egen fyllning är grundtonen, samma som ramens, så konturen
  // försvinner in i bakgrunden och bara dragen syns.
  if (ansikte) return svg(byggHuvud(ID), size, ANSIKTSRUTA, klass, u, en);

  // ---------------------------------------------------------- KROPPEN
  const K = T(p.luta, HOFT[0], HOFT[1], 0, p.hojd);
  // Huvudet flyttas med kroppens höjd från FÖRRA rutan, inte den här.
  const KH = g ? T(p.luta, HOFT[0], HOFT[1], 0, g.huvudDy) : K;
  const k = p.kliv, s = p.sitter;
  // Bakben. Sittande läge fäller ihop knäet under höften: hundens riktiga
  // markering av ett fynd är att sätta sig ner, inte att skälla.
  // Lår, knä, ankel, tass. Benen står lodrätt med en bakåtböjd has, så att
  // siluetten visar två pelare och inte två streck som möts i marken.
  const gN = g ? g.fotNdx : 0, gB = g ? g.fotBdx : 0, bj = g ? g.boj : 0;
  const laarN = [60 - 3 * k - 3 * s + gN * 0.3, 92 + 4 * s];
  const knaN = [56 - 4 * k - 4 * s + gN * 0.65, 100 + 5 * s + bj];
  const fotN = [55 - 5 * k - 6 * s + gN, 111.4 + (g ? g.fotNdy : 0)];
  const laarB = [73 + 3 * k + 6 * s + gB * 0.3, 92 + 4 * s];
  const knaB = [77 + 4 * k + 8 * s + gB * 0.65, 100 + 5 * s + bj];
  const fotB = [78 + 5 * k + 3 * s + gB, 111.4 + (g ? g.fotBdy : 0)];
  const benD =
    // hasen, alltså lårmassan, är en egen cirkel som ger bakdelen tyngd
    cirkel(K, laarN[0], laarN[1], 9) +
    kapsel(K, laarN[0], laarN[1], 9, knaN[0], knaN[1], 6.2) +
    kapsel(K, knaN[0], knaN[1], 6.2, fotN[0], fotN[1] - 3.6, 5.2) +
    tass(K, fotN[0] - 1.6, fotN[1], -1, 5) +
    cirkel(K, laarB[0], laarB[1], 8.4) +
    kapsel(K, laarB[0], laarB[1], 8.4, knaB[0], knaB[1], 5.8) +
    kapsel(K, knaB[0], knaB[1], 5.8, fotB[0], fotB[1] - 3.6, 4.8) +
    tass(K, fotB[0] + 1.6, fotB[1], 1, 4.6);

  // Bål, hals och armar i en enda bana. Främre tassen är lyft: figuren är
  // aldrig i givakt.
  // Armarna svingar UT från bålen, aldrig innanför den. Duolingos egen regel:
  // poserar man lemmarna rätt behövs ingen extra färg för att skilja dem åt.
  const handN = [42 - 3 * p.lyft + (g ? g.armNdx : 0), 88 - 18 * p.lyft];
  const handB = [73 + 3 * s + (g ? g.armBdx : 0), 86 + 4 * s];
  const balD =
    kapsel(K, AXEL[0], AXEL[1], AXEL[2], HOFT[0], HOFT[1] + 6 * s, HOFT[2]) +
    cirkel(K, ...AXEL) +
    kapsel(K, NACKE[0], NACKE[1] - 2, 8.2, AXEL[0], AXEL[1], AXEL[2]) +
    kapsel(K, AXEL[0] - 5, AXEL[1] + 5, 5.2, handN[0], handN[1], 4.2) +
    tass(K, handN[0] - 2.4, handN[1] + 3.4, -1, 4.2) +
    kapsel(K, AXEL[0] + 6, AXEL[1] + 5, 4.8, handB[0], handB[1], 3.8) +
    tass(K, handB[0] + 2.4, handB[1] + 3.4, 1, 3.8);
  // Svansen: ett böjt band från korset. Den är kroppens enda utstickare uppåt
  // och gör siluetten till hund redan innan man ser ansiktet.
  const svansD = band(K, 74, 80, 96, 76, 100, 52, 4.6, 1.8, 10);
  // Bukens mörkare fält, hård kant, kapat ur axelcirkeln. Tillsammans med det
  // ljusa huvudet ger det tre lager: ljust upptill, bas i mitten, mörkt nertill.
  const bukD = kalott(K, AXEL[0], AXEL[1], AXEL[2], -0.42, 0.91, 5.5);

  // Skuggan är en PILLERFORM, aldrig en oval, eftersom ovaler antyder perspektiv.
  const skuggaD = kapsel(ID, fotN[0] - 6, 114.6, 3.6, fotB[0] + 6, 114.6, 3.6);
  // Spåret: Prikkos egen prick, i luften framför nosen. Det figuren följer.
  // Spåret ligger PÅ marken, i skuggans egen linje, aldrig svävande i luften.
  const sparD = [
    '',
    kapsel(ID, 30, 114.6, 2.6, 36, 114.6, 2.6),
    kapsel(ID, 28, 114.6, 2.8, 34, 114.6, 2.8) + kapsel(ID, 15, 114.6, 2.2, 20, 114.6, 2.2),
    kapsel(ID, 28, 114.6, 2.8, 34, 114.6, 2.8) + kapsel(ID, 15, 114.6, 2.2, 20, 114.6, 2.2) +
      kapsel(ID, 5, 114.6, 1.7, 9, 114.6, 1.7)
  ][p.spar];

  const delar = [
    [skuggaD, c.ljus],
    [benD, c.bas],
    [svansD, c.bas],
    [balD, c.bas],
    [bukD, c.mork],
    ...byggHuvud(KH),
    [sparD, c.mork]
  ];
  return svg(delar, size, '0 0 120 120', klass, u, en);
}

function svg(delar, size, vb, klass, u, en) {
  const rena = delar.filter(([d]) => d);
  const kropp = en
    ? `<path d="${rena.map(([d]) => d).join('')}" fill="#111"/>`
    : rena.map(([d, f]) => `<path d="${d}" fill="${f}"/>`).join('');
  return (
    `<svg width="${size}" height="${size}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg"` +
    (klass ? ` class="${klass}"` : '') +
    ` role="img" aria-label="${META.namn}, ${UTTRYCK[u]}">${kropp}</svg>`
  );
}

export const hund = figur;
export default figur;
