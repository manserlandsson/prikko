// Prikkos maskot: UTTERN.
//
// Varför utter, kort:
//   Uttern måste putsa pälsen för att överleva. Den saknar späck och värms av
//   LUFTEN som fastnar mellan hårstråna. Blir pälsen smutsig kollapsar
//   luftlagret och djuret kyls ned. Renlighet är alltså inte en vana hos
//   uttern, det är en överlevnadsfråga, och det är precis vad en hygientjänst
//   vill säga. Den är dessutom nordisk, ledig, saknar egen kulör i folks
//   huvuden och är känd för att LEKA, vilket gör ett torrt ämne lättsamt.
//
// Ritmetod, enligt brief version 4:
//   Figuren ritas FRI, för 200 px, med riktiga ögon i fyra delar. Ingenting
//   här är kompromissat för 24 px. Det inramade läget och den enkla
//   detaljnivån är EGNA ritningar, inte figuren med bortplockade delar.
//
// Rundheten:
//   NOLL raka linjekommandon. Varenda form är byggd av cirkelbågar. Där en
//   vanlig kapsel skulle ha två raka tangentlinjer mellan sina två cirklar
//   använder den här modulen i stället två bågar med stor radie, vilket ger
//   en svagt svälld sida i stället för en rak. Det är hela skillnaden mellan
//   en kropp och en polygon, och det syns i konturprovet.
//
// Inga stroke, inga gradienter, inga masker, inga filter, inga id.
// 120-ruta, marken på y 116.

// Munnen bor inte här, den är Prikkos och hämtas ur det centrala systemet.
// Figuren får inte ha stroke, så bågen byggs om till en fylld form med samma
// korda, samma pilhöjd och samma radie som munbana() räknar fram.
import { pilhojd, RIKTNING } from '../maskot-mun.mjs';

// ============================================================ 1. FÄRG
// Fem toner: ljus, bas, mörk, djup och vitt. Bara basen och den mörka är
// satta, de två övriga härleds ur dem. Inga nya kulörer.
const PALETT = {
  blue:  { bas: '#007BE0', mork: '#0063B4' },
  clean: { bas: '#00B92B', mork: '#009523' },
  minor: { bas: '#FECB00', mork: '#DEB201' },
  major: { bas: '#EB0000', mork: '#C50000' },
};
const kanal = (hex, i) => parseInt(hex.slice(1 + i, 3 + i), 16);
const hexa = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
const ljusna = (hex, t) => '#' + [0, 2, 4].map((i) => hexa(kanal(hex, i) + (255 - kanal(hex, i)) * t)).join('');
const morkna = (hex, t) => '#' + [0, 2, 4].map((i) => hexa(kanal(hex, i) * (1 - t))).join('');
const toner = (ton) => {
  const p = PALETT[ton] || PALETT.blue;
  return {
    ljus: ljusna(p.bas, 0.52),   // strupfläck, mule, bryn
    bas: p.bas,                  // kropp och huvud
    mork: p.mork,                // ben, tassar, svans, ryggens rand
    djup: morkna(p.mork, 0.56),  // pupill, nos, mun
    vit: '#fff',                 // ögonvita
  };
};

// ============================================================ 2. GRUNDFORMER
const n = (v) => Math.round(v * 100) / 100;
const PI = Math.PI;

// Transformen bakas in i punkterna, aldrig i ett g-element, så att hela
// figuren kan kollapsa till en enda fylld bana.
const T = (grad = 0, cx = 0, cy = 0, dx = 0, dy = 0) => {
  const a = (grad * PI) / 180, s = Math.sin(a), c = Math.cos(a);
  const f = (x, y) => [
    cx + (x - cx) * c - (y - cy) * s + dx,
    cy + (x - cx) * s + (y - cy) * c + dy,
  ];
  f.sx = 1; f.sy = 1;
  return f;
};
// Squash och stretch. Skalan läggs YTTERST, alltså i världens koordinater, och
// är därför alltid axelparallell. En cirkel som först vridits och sedan skalats
// är en ellips med axlarna längs x och y, alltså kan varje båge skrivas exakt
// med x-axis-rotation 0 utan att en enda punkt behöver samplas.
const SKALA = (sx, sy, cx, cy) => {
  const f = (x, y) => [cx + (x - cx) * sx, cy + (y - cy) * sy];
  f.sx = sx; f.sy = sy;
  return f;
};
const ID = T();
const kombinera = (yttre, inre) => {
  const f = (x, y) => yttre(...inre(x, y));
  f.sx = (yttre.sx ?? 1) * (inre.sx ?? 1);
  f.sy = (yttre.sy ?? 1) * (inre.sy ?? 1);
  return f;
};

/** Cirkeln. Två halvbågar, noll raka. */
const cirkel = (m, x0, y0, r, fx = 1, fy = 1) => {
  const [x, y] = m(x0, y0);
  const rx = r * (m.sx ?? 1) * fx, ry = r * (m.sy ?? 1) * fy;
  return `M${n(x - rx)} ${n(y)}A${n(rx)} ${n(ry)} 0 1 0 ${n(x + rx)} ${n(y)}` +
    `A${n(rx)} ${n(ry)} 0 1 0 ${n(x - rx)} ${n(y)}Z`;
};

/**
 * SVÄLLD KAPSEL. Modulens arbetshäst och hela rundhetslösningen.
 *
 * En vanlig kapsel är två cirklar förbundna med sina yttre tangentlinjer,
 * alltså två RAKA segment. Här ersätts de två tangentlinjerna av bågar med
 * stor radie genom samma tangentpunkter. Sidorna sväller alltså utåt med
 * `svall` gånger sidans längd, skarvarna mot ändcirklarna sitter kvar på
 * tangentpunkterna och lemmen får en muskel i stället för en avfasning.
 *
 * Vid svall 0,06 är utbuktningen knappt mätbar för ögat men den tar bort
 * varje rakt segment ur figuren.
 */
const kapsel = (m, ax, ay, r1, bx, by, r2, svall = 0.055) => {
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
  if (L < 0.01 || L <= Math.abs(r1 - r2)) return cirkel(m, ax, ay, Math.max(r1, r2));
  const fi = Math.atan2(dy, dx), beta = Math.acos((r1 - r2) / L);
  const a1 = fi + beta, a2 = fi - beta;
  const sx = m.sx ?? 1, sy = m.sy ?? 1;
  const P = (x, y, r, a) => {
    const [px, py] = m(x + r * Math.cos(a), y + r * Math.sin(a));
    return `${n(px)} ${n(py)}`;
  };
  const R = (r) => `${n(r * sx)} ${n(r * sy)}`;
  // Sidans längd mellan tangentpunkterna, och bågradien som ger önskad pilhöjd.
  const sida = Math.hypot(
    (bx + r2 * Math.cos(a1)) - (ax + r1 * Math.cos(a1)),
    (by + r2 * Math.sin(a1)) - (ay + r1 * Math.sin(a1)),
  );
  const s = Math.max(0.05, svall * sida);
  const Rb = s / 2 + (sida * sida) / (8 * s);
  // Sweep 1 buktar mot tangentpunktens egen utåtriktning på båda sidor.
  // Härlett, inte provat: sin(fi - a1) = -sin(beta) < 0 ger sweep 1, och
  // motsvarande för a2 där färdriktningen är den omvända.
  return (
    `M${P(ax, ay, r1, a1)}A${R(Rb)} 0 0 1 ${P(bx, by, r2, a1)}` +
    `A${R(r2)} 0 ${beta > PI / 2 ? 1 : 0} 0 ${P(bx, by, r2, a2)}` +
    `A${R(Rb)} 0 0 1 ${P(ax, ay, r1, a2)}` +
    `A${R(r1)} 0 ${beta < PI / 2 ? 1 : 0} 0 ${P(ax, ay, r1, a1)}Z`
  );
};

/** Kedja av svällda kapslar längs en punktlista [x, y, r]. Svans och lemmar. */
const kedja = (m, pts, svall) => {
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    d += kapsel(m, pts[i][0], pts[i][1], pts[i][2], pts[i + 1][0], pts[i + 1][1], pts[i + 1][2], svall);
  }
  return d;
};

/**
 * BÅGBAND: en fylld cirkelbåge med konstant tjocklek och runda ändar.
 * Ytterkant, ändhalvcirkel, innerkant, ändhalvcirkel. Fyra bågar, noll raka.
 * Munnen ritas med den här, alltså som en RIKTIG cirkelbåge och inte som en
 * bezier som nästan är en cirkel.
 */
const bagband = (m, cx, cy, R, a0, a1, w) => {
  const sx = m.sx ?? 1, sy = m.sy ?? 1;
  const P = (r, a) => {
    const [x, y] = m(cx + r * Math.cos(a), cy + r * Math.sin(a));
    return `${n(x)} ${n(y)}`;
  };
  const RR = (r) => `${n(r * sx)} ${n(r * sy)}`;
  const stor = Math.abs(a1 - a0) > PI ? 1 : 0;
  return (
    `M${P(R + w, a0)}A${RR(R + w)} 0 ${stor} 1 ${P(R + w, a1)}` +
    `A${RR(w)} 0 0 1 ${P(R - w, a1)}` +
    `A${RR(R - w)} 0 ${stor} 0 ${P(R - w, a0)}` +
    `A${RR(w)} 0 0 1 ${P(R + w, a0)}Z`
  );
};

/**
 * MUNNEN som fylld form. Tar korda och pilhöjd ur det centrala munsystemet,
 * räknar fram cirkeln som går genom de tre punkterna och lämnar över till
 * bågbandet. Lutningen är munsystemets egen asymmetri på två grader: munnen
 * ska vara figurens minst geometriska form.
 */
const munform = (m, cx, cy, b, h, w, lutning = 2) => {
  const hh = Math.abs(h) < 0.12 ? 0.12 * Math.sign(h || 1) : h;
  const dy = Math.tan((lutning * PI) / 180) * (b / 2);
  const p1 = [cx - b / 2, cy - hh / 2 - dy];
  const p2 = [cx + b / 2, cy - hh / 2 + dy];
  const d = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
  const s = Math.abs(hh);
  const R = s / 2 + (d * d) / (8 * s);
  const ux = (p2[0] - p1[0]) / d, uy = (p2[1] - p1[1]) / d;
  const sg = Math.sign(hh);
  const nx = -uy * sg, ny = ux * sg;          // pekar mot bågens buk
  const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
  const C = [mx - nx * (R - s), my - ny * (R - s)];
  const vinkel = (p) => Math.atan2(p[1] - C[1], p[0] - C[0]);
  const apex = vinkel([mx + nx * s, my + ny * s]);
  const upp = (a, fran) => { let v = a; while (v < fran) v += 2 * PI; return v; };
  let a0 = vinkel(p1), a1 = upp(vinkel(p2), a0);
  if (upp(apex, a0) > a1) { a0 = vinkel(p2); a1 = upp(vinkel(p1), a0); }
  return bagband(m, C[0], C[1], R, a0, a1, w);
};

/** Tass eller fot: dyna plus tre tår, alltså riktiga ändar och inga streck. */
const tass = (m, x, y, rikt, r) =>
  cirkel(m, x, y, r) +
  cirkel(m, x + rikt * 0.92 * r, y - 0.42 * r, r * 0.52) +
  cirkel(m, x + rikt * 0.98 * r, y + 0.28 * r, r * 0.5) +
  cirkel(m, x + rikt * 0.34 * r, y + 0.74 * r, r * 0.48);

// ============================================================ 3. MÅTT
// Allt i 120-rutan. Figuren är vänd åt VÄNSTER, medvetet: den mest utsatta
// likheten i branschen är "a cartoon animal facing right with wide eyes".
//
// HUVUDET
const SKALLE = [53, 32, 19.2];      // rund skalle
const NACKE = [54.5, 52];           // huvudets vridpunkt
const MULE = [46.6, 45.6, 11.6];    // bred platt mule, ljus ton
const KIND = [55, 44, 9.4];         // mulen fortsätter in i kinden
const NOS = [42.6, 40.2, 3.7];      // nosplätt, djup ton
const ORA_N = [34.6, 17.8, 5.5];    // små runda öron, HÖGT på huvudet
const ORA_B = [69.6, 17.0, 4.8];    // bortre örat mindre, medveten asymmetri
// ÖGONEN. Ögonvitan är 13,6 respektive 12,4 breda mot huvudets 38,4, alltså
// 35 och 32 procent per öga. Brief version 4 anger 31,6 procent som Duos mått.
// De sitter ISÄR, utan gemensam mask, och de är olika stora.
const OGA_N = [42.4, 30.2, 6.8];
const OGA_B = [61.4, 28.2, 6.2];
const PUPILL = 0.46;                // andel av ögonvitans bredd, Duos är 0,475
// MUNNEN: 21 procent av huvudets bredd. Brief anger 15 till 22 procent.
const MUNBREDD = 0.21 * (SKALLE[2] * 2);
const MUNRADIE = 0.72 * MUNBREDD;   // förhållandet radie mot bredd, ur munsystemet
const MUN = [45.4, 48.6];
// Huvudets egen ruta för det inramade läget. Skallen med öron går från x 29
// till 74 och från y 12 till 57. Rutan är 42 och skär alltså både hjässa,
// öronspetsar och haka: beskärning, inte förminskning.
const ANSIKTSRUTA = '31 16 42 42';
// KROPPEN. Uttern är LÅNG, inte rund. Bålen är en kedja av tre cirklar över
// 46 enheter, alltså längre än huvudet är högt.
const BROST = [55.5, 63, 14.2];
const MIDJA = [57.5, 80, 15.4];

// ============================================================ 4. ANSIKTET
// Ögat har fyra utbytbara delar och alla fyra styrs härifrån:
//   1 ögonvitan  ägg, inte cirkel, byggd av två cirklar med olika radie
//   2 pupillen   solid djup form, ALDRIG vertikalt centrerad, svagt inåtvänd
//   3 ögonlocket cirkel i KROPPENS färg som skär in uppifrån, vinkel + slutning
//   4 brynet     fri form ovanför, sitter inte fast i pannan
//
// blick  [x, y] i andelar av ögonvitans radie. y får aldrig vara 0.
// lock   [slutning nära, slutning bortre] 0 öppet, 1 slutet
// lockv  [vinkel nära, vinkel bortre] grader. Positivt lutar locket INÅT
//        mot nosen, alltså arg. Negativt lutar det utåt, alltså ledsen.
// bryn   [lyft nära, lyft bortre, vinkel]
// mun    [riktning, dy, breddskala]
// hrot   huvudets vridning kring nacken
const ANSIKTE = {
  // Nöjd granskare. Locken nästan uppe, brynen höga, blicken rakt fram.
  clean:    { blick: [0.30, 0.42], lock: [0.05, 0.02], lockv: [-7, -5], bryn: [3.0, 2.4, -7], mun: [RIKTNING.clean, 0, 1], hrot: -5 },
  // Skeptisk. ETT halvslutet öga, ett lyft bryn. Utan asymmetrin blir gult
  // och grönt samma bild i gråskala.
  minor:    { blick: [0.62, 0.30], lock: [0.44, 0.06], lockv: [10, -14], bryn: [1.0, 3.4, 5], mun: [RIKTNING.minor, 0.4, 0.95], hrot: 7 },
  // Bekymrad, inte arg. Locken ligger lågt och lutar UTÅT, brynen inre ändar
  // uppdragna. Arg utter vore fel figur för ett myndighetsbeslut.
  major:    { blick: [0.16, 0.54], lock: [0.40, 0.36], lockv: [-20, -16], bryn: [2.2, 1.8, 13], mun: [RIKTNING.major, 0.8, 1.02], hrot: 9 },
  soker:    { blick: [-0.72, 0.52], lock: [0.22, 0.14], lockv: [6, 4], bryn: [1.4, 0.6, 4], mun: [0.18, 0.5, 0.7], hrot: 11 },
  hittat:   { blick: [0.44, -0.30], lock: [0, 0], lockv: [-12, -10], bryn: [4.2, 3.8, -10], mun: [1.35, -0.4, 1.1], hrot: -13 },
  vantar:   { blick: [0.86, 0.34], lock: [0.5, 0.46], lockv: [-4, -2], bryn: [1.2, -0.8, 2], mun: [0.05, 0.5, 0.8], hrot: -7 },
  nojd:     { blick: [0.24, 0.44], lock: [0.34, 0.30], lockv: [-16, -14], bryn: [2.6, 2.2, -5], mun: [0.92, -0.1, 1.05], hrot: -6 },
  tom:      { blick: [-0.94, 0.20], lock: [0.20, 0.16], lockv: [-2, 0], bryn: [1.0, 0.4, -2], mun: [0.06, -0.3, 0.62], hrot: -17 },
  fyrafyra: { blick: [0.9, -0.24], lock: [0.06, 0.42], lockv: [14, -18], bryn: [3.6, -1.2, 8], mun: [-0.3, 0.6, 0.72], hrot: -24 },
};

// ============================================================ 5. POSER
// Grundställning finns inte. Uttern sitter upprätt på bakbenen med svansen
// som stöd och HÅLLER NÅGOT mellan framtassarna. Posen är känd från varje
// naturfilm och läser omedelbart som någon som undersöker något noga.
// Föremålet är Prikkos egen prick, alltså ingen lupp och ingen hatt.
//
// sitter   1 upprätt på svans och häl, 0 stående på benen
// lyft     hur högt pricken hålls, 0 vid magen, 1 uppe vid ansiktet
// hall     0 pricken saknas, 1 pricken hålls, 2 pricken ligger på marken
// svans    svansens sving i grader kring roten
const POSER = {
  clean:    { luta: -4, sitter: 1, lyft: 0.62, hall: 1, svans: -6, hojd: -1, oron: -6 },
  minor:    { luta: 2, sitter: 1, lyft: 0.34, hall: 1, svans: 4, hojd: 0, oron: 4 },
  major:    { luta: 7, sitter: 1, lyft: 0.12, hall: 1, svans: 12, hojd: 2, oron: 12 },
  soker:    { luta: 10, sitter: 0.72, lyft: 0.06, hall: 2, svans: -14, hojd: 1, oron: -10 },
  hittat:   { luta: -10, sitter: 1, lyft: 1, hall: 1, svans: -20, hojd: -3, oron: -16 },
  vantar:   { luta: -2, sitter: 1, lyft: 0.3, hall: 1, svans: 8, hojd: 0, oron: 6 },
  nojd:     { luta: -6, sitter: 1, lyft: 0.5, hall: 1, svans: -10, hojd: -1, oron: -8 },
  tom:      { luta: -3, sitter: 1, lyft: 0.2, hall: 0, svans: 2, hojd: 0, oron: 10 },
  fyrafyra: { luta: 4, sitter: 1, lyft: 0, hall: 2, svans: 16, hojd: 1, oron: -2 },
};

// ============================================================ 5b. GÅNGCYKELN
// Åtta bildrutor. Uttern vaggar fram på bakbenen med pricken kvar i tassarna
// och svansen som motvikt.
//   0 och 4  kontakt, varandras spegling
//   1 och 5  nedgång, kroppen lägst och mest hoptryckt
//   2 och 6  passering
//   3 och 7  uppgång, kroppen högst och sträckt
// Huvudet följer med EN RUTA SENARE än kroppen. Ansiktet ändrar sig mellan
// rutorna: locken och munnen är inte samma bild som åker med.
export const GANG = { rutor: 8, halltid: [90, 70, 70, 110, 90, 70, 70, 110] };

const H_SQUASH = [0, 0.072, 0.014, -0.066, 0, 0.072, 0.014, -0.066];
const H_HOJD = [0, 1.1, 0.3, -1.1, 0, 1.1, 0.3, -1.1];
const GANGRUTOR = H_HOJD.map((h, i) => ({
  hojd: h,
  fotNdx: [8, 4.5, 0, -4.5, -8, -5, 0, 5][i],
  fotBdx: [-8, -5, 0, 5, 8, 4.5, 0, -4.5][i],
  fotNdy: [0, 0, -4, 0, 0, 0, 0, 0][i],
  fotBdy: [0, 0, 0, 0, 0, 0, -4, 0][i],
  boj: [2, 5, 1.5, 0, 2, 5, 1.5, 0][i],
  armdx: [-3, -1.5, 0, 1.5, 3, 1.5, 0, -1.5][i],
  svans: [-12, 4, 12, 4, -12, 4, 12, 4][i],
  oron: [8, -10, -8, 10, 8, -10, -8, 10][i],
  q: H_SQUASH[i],
  huvudDy: H_HOJD[(i + 7) % 8] * 0.85,
  // ansiktet arbetar: munnen plattas i nedslaget och djupnar i luften,
  // ögonen trycks ihop i höjd när kroppen tar emot
  munk: [1, 0.5, 0.86, 1.3, 1, 0.5, 0.86, 1.3][i],
  lock: [0.06, 0.3, 0.14, 0, 0.06, 0.3, 0.14, 0][i],
  ogaSy: [1, 0.87, 0.97, 1.06, 1, 0.87, 0.97, 1.06][i],
}));

// ============================================================ 6. KONTRAKT
export const META = {
  namn: 'Prikko, uttern',
  koncept: 'En utter som sitter upprätt med Prikkos prick mellan framtassarna och vänder på den tills den vet vad den tycker.',
  former: 24,
  farger: 5,
  egenhet: 'Renligheten är bokstavlig och sann: uttern saknar späck och värms av luften i pälsen, så den som slutar putsa sig dör. Det är det enda djuret där hygien är en överlevnadsfråga och inte en vana.',
  svaghet: 'Uttern är smal i ansiktet och lever på sin mule och sina ögon, alltså tappar den mer på nedskalning än ett djur med stora öron eller stark siluettdetalj, och en sittande utter kan i mycket små format läsa som en säl.',
  raka: 0,
};

export const UTTRYCK = {
  clean: 'Inga anmärkningar', minor: 'Brister', major: 'Brister som kvarstår',
  soker: 'Söker', hittat: 'Hittat något', vantar: 'Väntar',
  nojd: 'Nöjd', tom: 'Tom sida', fyrafyra: '404',
};

// ============================================================ 7. FIGUREN
export function figur({
  size = 160,
  ton = 'blue',
  uttryck = 'clean',
  siluett = false,
  ansikte = false,
  klass = '',
  steg = null,
  blink = 0,
  detalj = 'rik',
} = {}) {
  const u = ANSIKTE[uttryck] ? uttryck : 'clean';
  const g = steg === null || steg === undefined ? null : GANGRUTOR[((steg % 8) + 8) % 8];
  const rik = detalj !== 'enkel' && !siluett;
  const c = siluett
    ? { ljus: '#111', bas: '#111', mork: '#111', djup: '#111', vit: '#111' }
    : toner(ton);

  // Gången skriver över posen: figuren går alltid upprätt på benen.
  const p = g
    ? { ...POSER[u], luta: 3, sitter: 0, lyft: 0.34, svans: POSER[u].svans + g.svans, hojd: g.hojd, oron: g.oron }
    : POSER[u];
  const a0 = ANSIKTE[u];
  const a = blink
    ? { ...a0, lock: [blink === 2 ? 1 : 0.55, blink === 2 ? 1 : 0.5], lockv: [-6, -6] }
    : g
      ? { ...a0, lock: [a0.lock[0] + g.lock, a0.lock[1] + g.lock], mun: [a0.mun[0] * g.munk, a0.mun[1], a0.mun[2]] }
      : a0;

  // ---------------------------------------------------------- HUVUDET
  // Hela huvudet byggs ur EN transform, så att det kan sitta antingen på
  // kroppen eller ensamt i den beskurna rutan utan att ritas om.
  const byggHuvud = (yttre, ram = false) => {
    const H = kombinera(yttre, T(a.hrot, NACKE[0], NACKE[1]));
    const oy = g ? g.ogaSy : 1;
    const ox = 1 / Math.sqrt(oy);

    // Skallen och mulen i en massa: rund skalle, bred platt mule som skjuter
    // ut framåt nedåt. Huvudet lutar mjukt bakåt från nosen, som en riktig
    // utter, och det är kedjan skalle till kind till mule som gör det.
    const skalleD =
      cirkel(H, ...SKALLE) +
      kapsel(H, SKALLE[0], SKALLE[1], SKALLE[2], MULE[0], MULE[1], MULE[2]) +
      kapsel(H, SKALLE[0], SKALLE[1], SKALLE[2], KIND[0], KIND[1], KIND[2]);

    // Öronen: små, runda, HÖGT uppe. De sitter halvt bakom skallen, alltså
    // sticker bara knappt upp, precis som på en riktig utter.
    const ora = (o, vrid, r) => {
      const E = kombinera(H, T(vrid, SKALLE[0], SKALLE[1]));
      return { yttre: cirkel(E, o[0], o[1], o[2]), inre: cirkel(E, o[0], o[1] + 0.5, o[2] * r) };
    };
    const oN = ora(ORA_N, p.oron * 0.5 + (ram ? -8 : 0), 0.5);
    const oB = ora(ORA_B, p.oron * 0.4 + (ram ? 6 : 0), 0.48);

    // Mulen och strupen i ljus ton. Uttern har en gräddvit strupfläck och en
    // ljus mule, alltså är den ljusa tonen artens egen och inte en påhittad
    // dekor.
    const muleD =
      cirkel(H, ...MULE) +
      kapsel(H, MULE[0], MULE[1], MULE[2], KIND[0] + 1, KIND[1] + 1.5, KIND[2] * 0.82);

    // 1. ÖGONVITAN. Ett ägg, inte en cirkel: två cirklar med olika radie
    // förbundna, alltså en form som lutar och är tyngre nedtill. Duos ögon är
    // två nästan perfekta cirklar i en gemensam mask, våra är varken runda
    // eller sammansatta.
    // Squashen i gången trycker ihop ögat i höjd, alltså ligger den i formens
    // egna koordinater och inte i en transform.
    const vita = (o, lut) => kapsel(
      H,
      o[0] + lut * 0.5, o[1] + o[2] * 0.24 * oy, o[2] * (0.6 + 0.4 * oy),
      o[0] - lut, o[1] - o[2] * 0.86 * oy, o[2] * 0.68 * (0.6 + 0.4 * oy),
      0.02,
    );
    const vitaD = vita(OGA_N, 1.1) + vita(OGA_B, -0.7);

    // 2. PUPILLEN. Sitter LÅGT i ögonvitan, aldrig vertikalt centrerad, och
    // de två konvergerar svagt inåt mot varandra.
    const pup = (o, inat) => cirkel(
      H,
      o[0] + a.blick[0] * o[2] * 0.42 + inat,
      o[1] + a.blick[1] * o[2] * 0.46 + o[2] * 0.2,
      o[2] * PUPILL, ox, oy,
    );
    const pupillD = pup(OGA_N, 0.5) + pup(OGA_B, -0.45);

    // 3. ÖGONLOCKET. En cirkel i KROPPENS färg som skjuts ned över ögonvitan.
    // Radien är 1,7 gånger ögats, alltså är lockets båge flackare än ögats och
    // läser som ett lock och inte som en andra pupill. Vinkeln bär känslan:
    // inåt lutande är strängt, utåt lutande är bekymrat.
    const lock = (o, slut, vinkel) => {
      const RL = o[2] * 1.72;
      const th = (vinkel * PI) / 180;
      const D = RL + o[2] * 0.86 - slut * o[2] * 2.05;
      return cirkel(H, o[0] + Math.sin(th) * D, o[1] - Math.cos(th) * D, RL);
    };
    const lockD = lock(OGA_N, a.lock[0], a.lockv[0]) + lock(OGA_B, a.lock[1], a.lockv[1]);

    // 4. BRYNET. Fritt liggande form ovanför ögat, alltså inte fastvuxen i
    // pannan. Två svällda kapslar i följd ger en böj utan ett enda rakt drag.
    const bryn = (o, lyft, vinkel, bredd) => {
      const B = kombinera(H, T(vinkel, o[0], o[1]));
      const y = o[1] - o[2] - 3.4 - lyft;
      return kedja(B, [
        [o[0] - bredd, y + 1.5, 1.05],
        [o[0], y - 0.5, 1.25],
        [o[0] + bredd * 0.85, y + 0.6, 0.95],
      ], 0.05);
    };
    const brynD =
      bryn(OGA_N, a.bryn[0], a.bryn[2], 5.2) +
      bryn(OGA_B, a.bryn[1], -a.bryn[2] * 0.7, 4.6);

    // NOSEN. Bred och platt, med en mjuk topp: två cirklar i en svälld kapsel.
    const nosD = kapsel(H, NOS[0] - 1.5, NOS[1], NOS[2], NOS[0] + 1.7, NOS[1] - 0.5, NOS[2] * 0.86, 0.09);

    // MUNNEN. Riktig cirkelbåge med konstant radie, hämtad ur munsystemet.
    const [mr, mdy, mb] = a.mun;
    const b = MUNBREDD * mb;
    const h = pilhojd(b, MUNRADIE) * mr * (b / MUNBREDD);
    const munD = munform(H, MUN[0], MUN[1] + mdy, b, h, rik ? 1.35 : 1.6);

    // MORRHÅREN. Det enda stället där tunna linjer är motiverade, och därför
    // sparsamt: tre på den nära sidan, två på den bortre. De ritas som
    // avsmalnande kapslar, alltså har de rundade ändar och ingen rak linje.
    const har = (x, y, dx, dy2, r) => kapsel(H, x, y, r, x + dx, y + dy2, r * 0.34, 0.12);
    const morrD = rik
      ? har(38.5, 42.5, -9.5, -3.4, 0.62) + har(38.2, 44.6, -10.5, 0.4, 0.62) + har(38.6, 46.5, -9, 3.6, 0.58) +
        har(53.5, 44.5, 9.5, -1.6, 0.55) + har(53.8, 46.4, 8.6, 2.2, 0.5)
      : '';

    return [
      [oN.yttre + oB.yttre, c.mork],
      [oN.inre + oB.inre, c.djup],
      [skalleD, c.bas],
      [muleD, c.ljus],
      ...(rik
        ? [[vitaD, c.vit], [pupillD, c.djup], [lockD, c.bas]]
        // ENKEL detaljnivå: ögat ritas om, inte plockas isär. Pupillen växer
        // och sväljer ögonvitan, alltså blir ögat EN mörk droppform i samma
        // läge och med samma lutning som den rika ritningens pupill. Locket
        // finns kvar bara när uttrycket kräver ett slutet öga.
        : [[
          kapsel(H, OGA_N[0] + a.blick[0] * 1.6, OGA_N[1] + a.blick[1] * 1.8 + 1.2, OGA_N[2] * 0.74,
            OGA_N[0] + a.blick[0] * 1.6 - 0.8, OGA_N[1] + a.blick[1] * 1.8 - 3.4, OGA_N[2] * 0.5, 0.02) +
          kapsel(H, OGA_B[0] + a.blick[0] * 1.4, OGA_B[1] + a.blick[1] * 1.6 + 1.1, OGA_B[2] * 0.74,
            OGA_B[0] + a.blick[0] * 1.4 + 0.6, OGA_B[1] + a.blick[1] * 1.6 - 3.1, OGA_B[2] * 0.5, 0.02),
          c.djup,
        ], [
          a.lock[0] > 0.34 || a.lock[1] > 0.34
            ? lock(OGA_N, Math.max(0, a.lock[0] - 0.1), a.lockv[0]) + lock(OGA_B, Math.max(0, a.lock[1] - 0.1), a.lockv[1])
            : '',
          c.bas,
        ]]),
      [brynD, c.ljus],
      [nosD, c.djup],
      [munD, c.djup],
      [morrD, c.mork],
    ];
  };

  // ---------------------------------------------------------- INRAMAT LÄGE
  if (ansikte) return svg(byggHuvud(ID, true), size, ANSIKTSRUTA, klass, u, siluett);

  // ---------------------------------------------------------- KROPPEN
  const S = g ? SKALA(1 + g.q, 1 - g.q, 60, 116) : ID;
  const K = kombinera(S, T(p.luta, 58, 96, 0, p.hojd));
  const KH = g ? kombinera(S, T(p.luta, 58, 96, 0, g.huvudDy)) : K;
  const st = p.sitter;

  // BÅLEN. Tre cirklar i en lång kedja, plus höften som varierar med om
  // figuren sitter eller står. Uttern är lång och smidig, inte en klump:
  // bålen mäter 46 enheter från bröstets topp till höftens botten.
  const hoft = [57.5 + 1.5 * st, 92 + 6 * st, 15 + 3.2 * st];
  const balD = kedja(K, [
    [NACKE[0] - 2, NACKE[1] + 1, 11.4],
    [BROST[0], BROST[1], BROST[2]],
    [MIDJA[0], MIDJA[1], MIDJA[2]],
    hoft,
  ], 0.05);

  // RYGGENS MÖRKA RAND. Ingen ny form och ingen mask: bålen ritas två gånger,
  // först i mörk ton och sedan en aning inskjuten i basfärgen. Det som blir
  // kvar är en jämn mörk kant längs rygg och bak, alltså platta färgytor med
  // hård kant precis som stilen kräver.
  const INS = kombinera(K, SKALA(0.94, 0.965, 46, 74));
  const balInreD = kedja(INS, [
    [NACKE[0] - 2, NACKE[1] + 1, 11.4],
    [BROST[0], BROST[1], BROST[2]],
    [MIDJA[0], MIDJA[1], MIDJA[2]],
    hoft,
  ], 0.05);

  // SVANSEN. Tjock vid roten, jämnt avsmalnande, och den fungerar som stöd
  // när djuret sitter upprätt. Den ger också hela kompositionens balans:
  // huvudet lutar åt vänster, svansen ligger åt höger.
  const SV = kombinera(K, T(p.svans, 68, 104));
  const svansD = kedja(SV, [
    [66, 101, 8.4],
    [80, 108, 6.6],
    [93, 111.4, 4.8],
    [102, 108, 3.1],
    [105.5, 101, 1.8],
  ], 0.06);

  // BAKBENEN. Korta och kraftiga, med breda simfötter. I sittande läge är de
  // hopfällda framför kroppen, i stående läge bär de figuren.
  const gN = g ? g.fotNdx : 0, gB = g ? g.fotBdx : 0, bj = g ? g.boj : 0;
  const fotN = [40.5 - 2 * st + gN, 111.5 + (g ? g.fotNdy : 0)];
  const fotB = [72 + 3 * st + gB, 112.8 + (g ? g.fotBdy : 0)];
  const benN = kapsel(K, 50 - 4 * st, 96 + 4 * st + bj * 0.4, 8.2, fotN[0] + 3, fotN[1] - 3.6, 5.4) +
    tass(K, fotN[0], fotN[1], -1, 5.2);
  const benB = kapsel(K, 66 + 3 * st, 97 + 4 * st + bj * 0.4, 7.4, fotB[0] - 2.5, fotB[1] - 3.4, 4.8) +
    tass(K, fotB[0], fotB[1], 1, 4.6);

  // FRAMTASSARNA håller pricken. Armarna är korta, som utterns är, och de
  // ligger UTANFÖR bålens siluett så att de syns utan egen extra färg.
  const ly = p.lyft;
  const px = 42.5 - 2 * ly + (g ? g.armdx : 0);
  const py = 76 - 16 * ly;
  const prickD = p.hall === 1 ? cirkel(K, px, py, 5) : '';
  const armN = kapsel(K, 47, 68, 5.6, px + 2.5, py + 3.2, 4.3) + tass(K, px + 1.5, py + 3.4, -1, 4.1);
  const armB = kapsel(K, 62, 68.5, 5.2, px + 7.5, py + 1.5, 3.9) + tass(K, px + 7, py + 1.6, 1, 3.7);

  // Pricken kan också ligga på marken, i skuggans egen linje, aldrig svävande.
  const markprickD = p.hall === 2 ? cirkel(ID, 24, 112.4, 3.4) : '';

  // SKUGGAN är en PILLERFORM, aldrig en oval, eftersom ovaler antyder
  // perspektiv. Den följer squashen i bredd men inte i höjd.
  const skuggaD = kapsel(ID, 33 - (g ? g.q * 42 : 0), 114.6, 3.4, 84 + (g ? g.q * 42 : 0), 114.6, 3.4);

  const delar = [
    [skuggaD, c.ljus],
    [svansD, c.mork],
    [benB, c.mork],
    [balD, c.mork],
    [balInreD, c.bas],
    [benN, c.mork],
    [armB, c.mork],
    [prickD, c.ljus],
    ...byggHuvud(KH),
    [armN, c.mork],
    [markprickD, c.ljus],
  ];
  return svg(delar, size, '0 0 120 120', klass, u, siluett);
}

function svg(delar, size, vb, klass, u, siluett) {
  const rena = delar.filter(([d]) => d);
  const kropp = siluett
    ? `<path d="${rena.map(([d]) => d).join('')}" fill="#111"/>`
    : rena.map(([d, f]) => `<path d="${d}" fill="${f}"/>`).join('');
  return (
    `<svg width="${size}" height="${size}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg"` +
    (klass ? ` class="${klass}"` : '') +
    ` role="img" aria-label="${META.namn}, ${UTTRYCK[u]}">${kropp}</svg>`
  );
}

export const utter = figur;
export default figur;
