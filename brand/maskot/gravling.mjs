/**
 * Prikkos maskot: GRÄVLINGEN.  Byggd mot BRIEF.md v3 plus fältresearchen.
 *
 * ── Bärande idé ───────────────────────────────────────────────────────
 * Prikkos ordmärke är två punkter och en båge. Bedömningsmärket är samma två
 * punkter med bågen vänd åt tre håll. Grävlingen lägger till EN vit form:
 * pannstrimman. Det som blir kvar av grundfärgen på var sida om strimman ÄR
 * grävlingens mörka band genom ögat. Bandet ritas aldrig, det uppstår.
 * Märket blir därmed strukturellt identiskt med dagens, en färgad rundad
 * kvadrat plus två vita prickar plus en vit båge, med artens tecken tillagt.
 *
 * ── En bärare ─────────────────────────────────────────────────────────
 * De tre bedömningstillstånden skiljs åt av MUNNEN OCH INGET ANNAT. Ögon,
 * blick, huvudvinkel och kroppspose är identiska i clean, minor och major.
 * Danska smileyordningen gör precis så och gick 2022 från fyra ansikten till
 * tre just för att fyra inte gick att skilja åt. Två bärare blir gröt.
 *
 * ── Två lägen av samma karaktär ───────────────────────────────────────
 * INRAMAT   ansikte: true. Huvudet beskuret så att dragen går kant i kant.
 *           Huvudets fyllning är grundtonen, alltså samma som ramens, så att
 *           huvudkonturen försvinner och bara dragen syns. Detta är märket.
 * FRITT     ansikte: false. Hela figuren, ingen ram. Den som springer.
 * Ansiktet ritas EN gång i en egen 100-ruta och används i båda lägena.
 * Nedskalning sker alltså genom beskärning, inte genom krympning.
 *
 * ── Subtraktionen ─────────────────────────────────────────────────────
 * Grävlingen har INGEN NOS. Den borde ha det, alla ritar det, och utan den
 * är ansiktet exakt två vita prickar och en vit båge, alltså ordmärket.
 */

/* ══ 1. FÄRG ═══════════════════════════════════════════════════════════ */

export const PALETT = {
  blue: { bas: '#007BE0', mork: '#0063B4' },
  clean: { bas: '#00B92B', mork: '#009523' },
  minor: { bas: '#FECB00', mork: '#DEB201' },
  major: { bas: '#EB0000', mork: '#C50000' },
};

const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hs = (a) => '#' + a.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const ljusare = (c, t) => hs(hx(c).map((v) => v + (255 - v) * t));

/** Ett byte färgar om hela figuren. Ljus ton härleds, mörk ton är Prikkos egen. */
function toner(ton) {
  const p = PALETT[ton] || PALETT.blue;
  return { bas: p.bas, mork: p.mork, ljus: ljusare(p.bas, 0.38), skugga: ljusare(p.bas, 0.84) };
}

/* ══ 2. ANSIKTET, EGEN 100-RUTA ════════════════════════════════════════
 *
 * Huvudkontur  bred rundad hjässa, breda kindben, kort trubbig nosdel, två
 *              små öron inbakade i konturen. Bredast 80 vid y 42 (x 10..90),
 *              hjässa y 11, haka y 96. Används bara i det fria läget.
 * Strimma      17 bred, går ut över hjässan så att den bleeder i beskärningen,
 *              slutar mjukt vid y 55, alltså strax under ögonlinjen. Slutar
 *              den lägre läses den som en nos, och det är fel djur.
 * Ögon         centrum (26, 42) r 10,2 och (75, 42) r 10,6. Höger öga större.
 * Mun          x 24..76, y 62..88. Bär hela bedömningen.
 */

const HUVUD =
  'M12 46C11 34 16 24 24 19.5' +
  'C25.5 16.5 29 15.5 31.5 17.5C33.5 19 34 21.5 33 24' +
  'C38 14.5 44 11 50 11C56 11 62 14.5 67 24' +
  'C66 21.5 66.5 19 68.5 17.5C71 15.5 74.5 16.5 76 19.5' +
  'C84 24 89 34 88 46C89.5 54 88 62 85 68' +
  'C82 76 76 83 69 88.5C62.5 93.5 55 96.5 50 97' +
  'C45 96.5 37.5 93.5 31 88.5C24 83 18 76 15 68C12 62 10.5 54 12 46Z';

/* ── ARTTECKNET. Fyra lösningar, jämförda i 56, 32 och 24 px. ──────────
 *
 * Grävlingens signal är TVÅ LODRÄTA BAND GENOM ögonen. Den tidigare
 * versionen ritade ett brett vitt band MELLAN ögonen, vilket ger lång nos och
 * läser som brottarmask. Mittstolpen är borta i samtliga fyra.
 *
 *  A  två band genom ögonen, sammanfogade nedtill till ett nosparti.
 *     Ljust huvud, vit mun på det mörka nospartiet.
 *  B  färre och bredare band, bara 4 enheters ljus springa emellan.
 *     Ljust huvud, mörk mun under banden.
 *  C  bandet som en RAM runt ögat i stället för ett streck. Ljust huvud.
 *  D  mörka band på GRUNDFÄRGAT huvud, alltså ingen ljus grundyta alls.
 *     Vit mun. Behåller märkets färgmättnad, som är produktkravet.
 *
 * Ögonen ritas ALLTID som solida vita cirklar ovanpå bandet, aldrig som hål.
 * Ett hål skulle visa huvudtonen och då är ögat inte längre vitt.
 */

const OGA = { v: { x: 30, y: 42, r: 10 }, h: { x: 70, y: 42, r: 10.4 } };

/* Medurs rundad rektangel. Alla maskformer ritas åt samma håll. */
function rrekt(x0, y0, x1, y1, r) {
  return (
    `M${x0 + r} ${y0}H${x1 - r}A${r} ${r} 0 0 1 ${x1} ${y0 + r}V${y1 - r}` +
    `A${r} ${r} 0 0 1 ${x1 - r} ${y1}H${x0 + r}A${r} ${r} 0 0 1 ${x0} ${y1 - r}` +
    `V${y0 + r}A${r} ${r} 0 0 1 ${x0 + r} ${y0}Z`
  );
}

/* D: bandet är brett vid ögat och smalnar av uppåt och nedåt, precis som
 * artens egen teckning. Arttecken och öga blir därmed samma form. */
const BAND_D = (spegel) => {
  const f = (x) => (spegel ? 100 - x : x);
  return (
    `M${f(21)} -16C${f(30)} -18 ${f(38)} -17 ${f(40)} -9` +
    `C${f(42)} 7 ${f(45.5)} 23 ${f(45.5)} 38C${f(45.5)} 48 ${f(44.5)} 57 ${f(42)} 64` +
    `C${f(40)} 70 ${f(37)} 74.5 ${f(33)} 76C${f(31)} 76.8 ${f(28.5)} 76.8 ${f(26.5)} 76` +
    `C${f(22.5)} 74.5 ${f(19.5)} 70 ${f(17.5)} 64C${f(15)} 57 ${f(14)} 48 ${f(14)} 38` +
    `C${f(14)} 23 ${f(17)} 7 ${f(19)} -9C${f(19.5)} -13 ${f(20)} -15 ${f(21)} -16Z`
  );
};

const ANSIKTEN = {
  A: {
    namn: 'A. Band genom ögonen, sammanfogade till nosparti',
    huvud: 'ljus',
    mask: rrekt(17, -16, 43, 60, 11) + rrekt(57, -16, 83, 60, 11) + rrekt(27, 48, 73, 93, 19),
    mun: 'vit',
    munDy: 2,
  },
  B: {
    namn: 'B. Färre och bredare band',
    huvud: 'ljus',
    mask: rrekt(11, -16, 48, 64, 14) + rrekt(52, -16, 89, 64, 14),
    mun: 'mork',
    munDy: 10,
  },
  C: {
    namn: 'C. Bandet som ram runt ögat',
    huvud: 'ljus',
    mask: rrekt(15, 24, 45, 61, 13) + rrekt(55, 24, 85, 61, 13),
    mun: 'mork',
    munDy: 6,
  },
  D: {
    namn: 'D. Mörka band på grundfärgat huvud',
    huvud: 'bas',
    mask: BAND_D(false) + BAND_D(true),
    mun: 'vit',
    munDy: 4,
  },
};

export const ANSIKTSVARIANTER = Object.fromEntries(Object.entries(ANSIKTEN).map(([k, v]) => [k, v.namn]));

/* ── Munnen. Enda bäraren av bedömningen. ──────────────────────────────
 * Fylld bana, aldrig stroke, alltid asymmetrisk: höger mungipa spetsig och
 * högre, vänster trubbig och lägre. Munnen är den minst geometriska formen. */
const MUN = {
  glad:
    'M23 62C26 81 39 91.5 54 89.5C64 88 71.5 80 75 67' +
    'C71 63 67 63.5 65.5 68C62 77 55 82 47 81.5C37 81 30 74 28 60Z',
  vagig:
    'M23 71C31 65.5 43 67 54.5 68.5C63 69.5 69.5 69 75.5 65.5' +
    'C76.5 70.5 76.5 74.5 75.5 77.5C68.5 81 59.5 80.5 49.5 79C40 77.5 32 77 25 80C23 77.5 22.5 74 23 71Z',
  ledsen:
    'M24 88C27 74 36.5 65.5 49 65.5C60.5 65.5 70 70.5 75.5 79' +
    'C73 83 69 83.5 66 80C61 73.5 55 71 48.5 71C39.5 71 32.5 77 30 90Z',
  smal: 'M31 71C40 68.5 53.5 68.5 63.5 71C64 75 63.5 77.5 62.5 79.5C53 77 42 77 33 79.5C31.5 77.5 30.5 74 31 71Z',
  oppen: 'M39 65C52 61 65 65 68.5 74C71.5 84 61.5 92 50 91C38.5 90 32.5 81 34 73C34.6 69.5 36.5 66 39 65Z',
  finurlig:
    'M23 66C30 79 42 86 55.5 85C65.5 84 73 77.5 77 66.5' +
    'C73.5 63 69.5 63.5 67 67.5C63 75 56 79 47.5 78.5C38 78 31 73.5 27 63.5Z',
  rundo: 'M42.5 68C50 66.5 57 69 58.5 74.5C60 81 55 86 49 85.5C43 85 39.5 81 40 76C40.3 72.5 41 69 42.5 68Z',
};

/* Ögonlock i mörk ton. ANVÄNDS ALDRIG i clean, minor och major, bara i de
 * sex övriga uttrycken, så att bedömningen behåller sin enda bärare. */
function lockBana(niva, vinkel) {
  if (!niva) return '';
  const en = (o, s) => {
    const y = o.y - o.r + 2 * o.r * niva;
    return `<path d="M${o.x - 22} ${y}H${o.x + 22}V${y - 32}H${o.x - 22}Z" transform="rotate(${s * vinkel} ${o.x} ${o.y})"/>`;
  };
  return en(OGA.v, 1) + en(OGA.h, -1);
}

/* ══ 3. UTTRYCK ════════════════════════════════════════════════════════ */

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
  hittat_over: 'Hittat något, overshoot',
};

/* De tre första delar allt utom munnen. Det är hela poängen. */
const BLICK = { dv: [1.5, -1], dh: [1, -1], dr: 0 };
const POS = {
  clean: { mun: 'glad', lock: 0, lockv: 0, blick: BLICK, hr: -11, pose: 'klorHogt' },
  minor: { mun: 'vagig', lock: 0, lockv: 0, blick: BLICK, hr: 15, pose: 'klorUt' },
  major: { mun: 'ledsen', lock: 0, lockv: 0, blick: BLICK, hr: 6, pose: 'klorNed' },

  soker: { mun: 'smal', lock: 0.44, lockv: -10, blick: { dv: [4, 1.5], dh: [3.5, 1.5], dr: -1 }, hr: 14, pose: 'nosar' },
  hittat: { mun: 'oppen', lock: 0, lockv: 0, blick: { dv: [0.5, -3.5], dh: [0, -3.5], dr: 1.4 }, hr: -3, pose: 'hojer' },
  vantar: { mun: 'smal', lock: 0.56, lockv: 3, blick: { dv: [4.5, 0], dh: [4, 0], dr: -0.6 }, hr: 12, pose: 'lutar' },
  nojd: { mun: 'finurlig', lock: 0.46, lockv: -12, blick: { dv: [1.5, 0], dh: [1, 0], dr: 0 }, hr: -15, pose: 'sitter' },
  tom: { mun: 'rundo', lock: 0.3, lockv: -5, blick: { dv: [2, 2.5], dh: [1.5, 2.5], dr: -0.5 }, hr: 22, pose: 'tittar_ned' },
  /* Anticipation: drar sig bakåt och ihop INNAN kastet. Overshoot: går för
   * långt och studsar tillbaka. Två rutor, och den billigaste kvalitets-
   * höjningen som finns. Spelas 60 ms, 260 ms, 90 ms. */
  hittat_anticip: { mun: 'smal', lock: 0.5, lockv: 4, blick: { dv: [-1, 1.5], dh: [-1.5, 1.5], dr: -0.8 }, hr: 12, pose: 'anticip' },
  hittat_over: { mun: 'oppen', lock: 0, lockv: 0, blick: { dv: [1, -4.5], dh: [0.5, -4.5], dr: 1.8 }, hr: -12, pose: 'over' },

  fyrafyra: { mun: 'smal', lock: 0.38, lockv: 9, blick: { dv: [3.5, 2], dh: [3, 2], dr: -0.4 }, hr: 30, pose: 'graver' },
};

/* ══ 4. KROPPEN ════════════════════════════════════════════════════════
 *
 * Grundposen är INTE givakt. Grävlingen står framåtlutad mitt i ett skrap:
 * tyngden på det bakre benet, ena framtassen uppe med klorna i luften, den
 * andra nere, fötterna isär och olika vinklade, huvudet vridet mot dig.
 *
 * Kropp   kompakt päron, x 32..80, y 58..102. Smalare än huvudet.
 * Huvud   centrum (57, 37), skala 0,56, alltså 45 brett och 48 högt.
 *         Huvud 48 mot kropp 44 = 1,09:1. Inom kravet 1:1 till 1,3:1.
 * Klorna  det enda som sticker ut ur konturen. De bär siluetten.
 */

const KROPP =
  'M56 55C49 55 43 60 39.5 68C36 76 34.5 86 36 93' +
  'C37.5 99.5 44 104 54 104.5C64.5 105 72 101 75 94.5' +
  'C78 88 77 77 73.5 68.5C70 60 63 55 56 55Z';

/* Skuldrornas ljusa fält. Hård kant mot grundtonen, aldrig en toning. */
const RYGG =
  'M56 55C49 55 43 60 39.5 68C38.1 71.2 37 74.6 36.2 78.2' +
  'C42.6 72.4 50.6 69 59 67.9C66.4 66.9 71.8 67.5 75.6 69.2' +
  'C74.6 65 72.4 61.4 69.4 58.8C65.8 56.2 61.2 55 56 55Z';

/* Undersidans mörka fält: magen och benens fästen. */
const UNDER =
  'M76.2 87C76.6 94.4 72.8 100.4 65.4 103C57.4 105.8 45.4 105.2 39 101' +
  'C36.6 99.4 35.2 96.6 34.6 93.4C40.8 97.4 49.6 99 58.4 97.4C67 95.8 73 91.4 76.2 87Z';

/* Skuggan är en pillerform, aldrig en oval. Ovaler antyder perspektiv. */
const SKUGGA = 'M34 106H82A6 6 0 0 1 82 118H34A6 6 0 0 1 34 106Z';

/* ── Lemgenerator. Gör figuren poserbar utan att ritas om. ───────────── */

const P = (a) => `${+a[0].toFixed(1)} ${+a[1].toFixed(1)}`;
const norm = (p, q) => {
  const dx = q[0] - p[0],
    dy = q[1] - p[1],
    L = Math.hypot(dx, dy) || 1;
  return [-dy / L, dx / L];
};

/** Avsmalnande lem från axel via böj till handled. */
function lem(a, b, c, wa, wb) {
  const na = norm(a, b),
    nc = norm(b, c),
    nm = [(na[0] + nc[0]) / 2, (na[1] + nc[1]) / 2],
    wm = (wa + wb) / 2;
  const o = (p, nn, w, s) => [p[0] + nn[0] * w * s, p[1] + nn[1] * w * s];
  return (
    `M${P(o(a, na, wa, 1))}Q${P(o(b, nm, wm, 1))} ${P(o(c, nc, wb, 1))}` +
    `L${P(o(c, nc, wb, -1))}Q${P(o(b, nm, wm, -1))} ${P(o(a, na, wa, -1))}Z`
  );
}

/**
 * Tass med tre gräveklor. Klorna är artens signatur och det enda som bryter
 * konturen. Grova och raka, aldrig tunna spetsar: tunna linjer försvinner
 * först vid nedskalning.
 */
function tass(c, vinkel, r = 9, klo = 10) {
  const pt = (d, a) => {
    const v = ((vinkel + a) * Math.PI) / 180;
    return [c[0] + d * Math.cos(v), c[1] + d * Math.sin(v)];
  };
  let d = `M${c[0] - r} ${c[1]}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  for (const a of [-34, 0, 34]) {
    d +=
      `M${P(pt(r * 0.85, a - 26))}Q${P(pt(r + klo * 0.6, a - 8))} ${P(pt(r + klo, a + 1))}` +
      `Q${P(pt(r + klo * 0.55, a + 12))} ${P(pt(r * 0.85, a + 26))}Z`;
  }
  return d;
}

/** Bakfot. Platt och rundad, UTAN klor: bara framtassarna gräver. */
function fot([cx, cy], vinkel, w = 11, h = 7) {
  const r = (vinkel * Math.PI) / 180,
    co = Math.cos(r),
    si = Math.sin(r);
  const p = (x, y) => [cx + x * co - y * si, cy + x * si + y * co];
  return (
    `M${P(p(-w, -h * 0.2))}C${P(p(-w, -h * 1.6))} ${P(p(w, -h * 1.6))} ${P(p(w, -h * 0.2))}` +
    `C${P(p(w, h * 0.9))} ${P(p(w * 0.35, h * 1.3))} ${P(p(-w * 0.15, h * 1.25))}` +
    `C${P(p(-w * 0.6, h * 1.2))} ${P(p(-w, h * 0.6))} ${P(p(-w, -h * 0.2))}Z`
  );
}

/* Poserna. hoger = den lyfta framtassen, vanster = den andra, ben + fötter.
 * Fötterna står isär och är olika vinklade. Den medvetna asymmetrin. */
const POSER = {
  /* De tre bedömningarna har VAR SIN pose, för i gråskala i fritt läge räcker
   * inte munnen. Klornas höjd och ryggens vinkel bär skillnaden:
   *   clean  klorna högt, ryggen rak, figuren hög
   *   minor  klorna rakt ut i midjehöjd, huvudet tydligt lutat
   *   major  klorna nere, ryggen böjd, figuren tio procent kortare */
  klorHogt: {
    hoger: { a: [70, 64], b: [84, 54], c: [89, 40], v: -74 },
    vanster: { a: [43, 67], b: [33, 76], c: [29, 90], v: 86 },
    ben: [[46, 94, 44, 104], [66, 94, 70, 104]],
    fot: [[40, 108, -7], [74, 109, 6]],
    lut: 0,
    kropp: '',
  },
  klorUt: {
    hoger: { a: [70, 70], b: [86, 72], c: [97, 73], v: -6 },
    vanster: { a: [43, 69], b: [32, 74], c: [26, 82], v: 56 },
    ben: [[46, 94, 42, 104], [66, 94, 71, 104]],
    fot: [[38, 108, -9], [75, 109, 9]],
    lut: 2,
    kropp: '',
  },
  klorNed: {
    hoger: { a: [70, 72], b: [82, 84], c: [86, 97], v: 62 },
    vanster: { a: [43, 71], b: [34, 84], c: [32, 97], v: 104 },
    ben: [[46, 96, 43, 105], [66, 96, 70, 105]],
    fot: [[40, 109, -5], [73, 110, 5]],
    lut: -7,
    kropp: 'translate(60 108)scale(1.06 0.9)translate(-60 -108)',
  },
  anticip: {
    hoger: { a: [70, 72], b: [78, 80], c: [78, 90], v: 76 },
    vanster: { a: [43, 72], b: [36, 80], c: [37, 90], v: 100 },
    ben: [[46, 96, 45, 105], [66, 96, 69, 105]],
    fot: [[41, 109, -5], [72, 110, 4]],
    lut: 5,
    kropp: 'translate(60 108)scale(1.08 0.88)translate(-60 -108)',
  },
  over: {
    hoger: { a: [70, 60], b: [86, 44], c: [90, 26], v: -84 },
    vanster: { a: [43, 63], b: [30, 62], c: [22, 56], v: -132 },
    ben: [[46, 92, 42, 103], [66, 92, 72, 103]],
    fot: [[38, 107, -12], [76, 108, 11]],
    lut: -4,
    kropp: 'translate(0 -5)scale(0.97 1.08)translate(0 5)',
  },
  skrapar: {
    hoger: { a: [70, 66], b: [82, 63], c: [89, 57], v: -46 },
    vanster: { a: [43, 67], b: [33, 76], c: [29, 90], v: 86 },
    ben: [[46, 94, 44, 104], [66, 94, 70, 104]],
    fot: [[40, 108, -7], [74, 109, 6]],
    lut: -3,
  },
  hojer: {
    hoger: { a: [70, 64], b: [84, 52], c: [88, 36], v: -80 },
    vanster: { a: [43, 67], b: [33, 76], c: [29, 90], v: 86 },
    ben: [[46, 94, 44, 104], [66, 94, 70, 104]],
    fot: [[40, 108, -7], [74, 109, 6]],
    lut: 0,
  },
  nosar: {
    hoger: { a: [70, 68], b: [80, 80], c: [84, 94], v: 62 },
    vanster: { a: [43, 69], b: [35, 80], c: [34, 93], v: 88 },
    ben: [[46, 94, 42, 104], [66, 94, 71, 104]],
    fot: [[38, 108, -7], [75, 109, 6]],
    lut: -7,
  },
  lutar: {
    hoger: { a: [70, 66], b: [78, 58], c: [77, 48], v: -118 },
    vanster: { a: [43, 67], b: [33, 76], c: [29, 90], v: 86 },
    ben: [[46, 94, 45, 104], [66, 94, 69, 104]],
    fot: [[41, 108, -7], [73, 109, 6]],
    lut: 0,
  },
  sitter: {
    hoger: { a: [70, 68], b: [78, 78], c: [76, 90], v: 74 },
    vanster: { a: [43, 69], b: [36, 80], c: [36, 91], v: 92 },
    ben: [[46, 92, 40, 102], [66, 92, 74, 102]],
    fot: [[36, 106, -7], [78, 107, 6]],
    lut: 0,
  },
  tittar_ned: {
    hoger: { a: [70, 68], b: [78, 80], c: [76, 92], v: 78 },
    vanster: { a: [43, 69], b: [36, 81], c: [36, 92], v: 92 },
    ben: [[46, 94, 43, 104], [66, 94, 70, 104]],
    fot: [[39, 108, -7], [74, 109, 6]],
    lut: -2,
  },
  graver: {
    hoger: { a: [70, 68], b: [84, 76], c: [90, 90], v: 44 },
    vanster: { a: [43, 69], b: [35, 81], c: [34, 94], v: 90 },
    ben: [[46, 94, 42, 104], [66, 94, 72, 104]],
    fot: [[38, 108, -7], [76, 109, 6]],
    lut: -9,
  },
};

/* ══ 4b. GÅNGCYKELN ════════════════════════════════════════════════════
 *
 * Bildrutor, inte transform. En transform kan flytta, skala och rotera former
 * som redan finns, men inte ÄNDRA en form, och det är formändringen som gör
 * att figuren läser som levande i stället för som en pappersdocka på en pinne.
 *
 * Åtta rutor. Kroppens höjd går ned, upp, ned, upp, alltså två gånger per
 * cykel, och lemmarna byter sida en gång.
 *   ruta 0 och 4  kontakt, framtassen sätter i marken, varandras spegling
 *   ruta 1 och 5  nedgång, kroppen LÄGST, benen mest böjda
 *   ruta 2 och 6  passering, bortre benet passerar det närmare, på väg upp
 *   ruta 3 och 7  uppgång, kroppen HÖGST, tassen sträckt bakåt
 *
 * Huvudet följer kroppen en ruta SENARE. Det är eftersläpningen som ger tyngd.
 * Tajmingen är avsiktligt ojämn: kontaktlägena ligger kvar längre än
 * passeringarna. Jämn tajming är det som får en loop att se billig ut.
 */

export const GANG = { rutor: 8, halltid: [90, 70, 70, 110, 90, 70, 70, 110] };

/* Kroppens höjd per ruta. Positivt tal = lägre. */
const KROPP_Y = [0, 4, 1, -3, 0, 4, 1, -3];
const KROPP_LUT = [-1, -3.5, -1.5, 2, -1, -3.5, -1.5, 2];

function gangRuta(i) {
  const t = (i / 8) * 2 * Math.PI;
  const rund = (v) => +v.toFixed(1);
  /* Diagonal gång: närarmen går i motfas till närbenet. */
  const ben = (fas, xbas) => {
    const x = xbas + 17 * Math.cos(fas);
    const lyft = Math.max(0, -Math.sin(fas)) * 7;
    return [rund(x), rund(lyft)];
  };
  const [xn, ln] = ben(t, 57);
  const [xb, lb] = ben(t + Math.PI, 57);
  const armH = [rund(87 + 11 * Math.cos(t + Math.PI)), rund(70 + 15 * Math.sin(t + Math.PI))];
  const armV = [rund(27 + 10 * Math.cos(t)), rund(80 + 14 * Math.sin(t))];
  return {
    hoger: { a: [70, 68], b: [rund((70 + armH[0]) / 2 + 4), rund((68 + armH[1]) / 2)], c: armH, v: rund(18 - 52 * Math.cos(t + Math.PI)) },
    vanster: { a: [43, 69], b: [rund((43 + armV[0]) / 2 - 4), rund((69 + armV[1]) / 2)], c: armV, v: rund(90 - 40 * Math.cos(t)) },
    ben: [
      [46, 94, rund(xn - 12), rund(104 - ln)],
      [66, 94, rund(xb + 12), rund(104 - lb)],
    ],
    fot: [
      [rund(xn - 16), rund(108 - ln), -7],
      [rund(xb + 16), rund(109 - lb), 6],
    ],
    lut: KROPP_LUT[i],
    kropp: `translate(0 ${KROPP_Y[i]})`,
    hdy: KROPP_Y[(i + 7) % 8],
  };
}

/* ══ 5. RITNING ════════════════════════════════════════════════════════ */

/* Ögonen. Två solida vita prickar. Aldrig ögonvita, aldrig glansdager: det
 * är vårt starkaste avstånd till Duo. Prickarna flyttar sig inom hålan. */
function ogonBana(b) {
  const c = (o, d) => {
    const r = o.r + b.dr,
      x = o.x + d[0],
      y = o.y + d[1];
    return `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  };
  return c(OGA.v, b.dv) + c(OGA.h, b.dh);
}

function drag(p, T, vit, variant) {
  const a = ANSIKTEN[variant] || ANSIKTEN.D;
  const l = lockBana(p.lock, p.lockv);
  return (
    `<path d="${a.mask}" fill="${T.mork}"/>` +
    `<path d="${ogonBana(p.blick)}" fill="${vit}"/>` +
    (l ? `<g fill="${T.mork}">${l}</g>` : '') +
    `<g transform="translate(0 ${a.munDy})"><path d="${MUN[p.mun]}" fill="${a.mun === 'vit' ? vit : T.mork}"/></g>`
  );
}

let n = 0;

/**
 * @param {number}  size
 * @param {string}  ton      'blue' | 'clean' | 'minor' | 'major'
 * @param {string}  uttryck  nyckel ur UTTRYCK
 * @param {boolean} siluett  hela figuren i #111, inget vitt
 * @param {boolean} ansikte  beskuret ansikte, kant i kant, utan ram
 * @param {string}  klass    sätts på svg-elementet
 */
export function figur({
  size = 160,
  ton = 'blue',
  uttryck = 'clean',
  siluett = false,
  ansikte = false,
  klass = '',
  variant = 'D',
  steg = null,
  blink = 0,
} = {}) {
  const av = ANSIKTEN[variant] || ANSIKTEN.D;
  let p = POS[uttryck] || POS.clean;
  /* Blinkningen är en egen axel och rör inte uttryckets övriga delar. */
  if (blink) p = { ...p, lock: blink === 2 ? 1 : 0.55, lockv: blink === 2 ? 0 : p.lockv };
  const T = siluett ? { bas: '#111', mork: '#111', ljus: '#111', skugga: '#111' } : toner(ton);
  const vit = siluett ? '#111' : '#fff';
  const kl = klass ? ` class="${klass}"` : '';
  const a11y = ' role="img" aria-label="Prikkos grävling"';

  /* INRAMAT LÄGE. Ingen ram ritas här, den sätts centralt. Huvudets fyllning
   * går kant i kant i grundtonen så att konturen försvinner in i ramen. */
  if (ansikte) {
    /* I siluettläge fylls inte rutan: då vore provet en svart kvadrat och sa
     * ingenting. I stället står dragen kvar i en färg. Det är också det
     * enfärgade enpathsläget, alltså faviconen. */
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100"${kl}${a11y}>` +
      (siluett ? '' : `<path d="M0 0H100V100H0Z" fill="${T[av.huvud]}"/>`) +
      `<g transform="translate(50 50)scale(1.22)translate(-50 -56)">${drag(p, T, siluett ? '#111' : '#fff', variant)}</g>` +
      `</svg>`
    );
  }

  /* FRITT LÄGE. */
  const id = `g${(++n).toString(36)}`;
  const g = steg === null || steg === undefined ? null : gangRuta(((steg % 8) + 8) % 8);
  const q = g || POSER[p.pose];
  const hdy = g ? g.hdy : 0;
  const arm = (o, w) => `${lem(o.a, o.b, o.c, w, w * 0.78)}${tass(o.c, o.v)}`;
  const benTass = q.ben
    .map(([x1, y1, x2, y2], i) => lem([x1, y1], [(x1 + x2) / 2, (y1 + y2) / 2 + 1], [x2, y2], 8, 7))
    .join('');
  const fotter = q.fot.map(([x, y, v]) => fot([x, y], v)).join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 120 120"${kl}${a11y}>` +
    `<defs><clipPath id="${id}"><path d="${HUVUD}"/></clipPath></defs>` +
    `<g transform="${q.kropp || ''}rotate(${q.lut} 60 108)">` +
    (siluett ? '' : `<path d="${SKUGGA}" fill="${T.skugga}"/>`) +
    `<path d="${benTass}${fotter}" fill="${T.mork}"/>` +
    `<path d="${arm(q.vanster, 7.5)}" fill="${T.mork}"/>` +
    `<path d="${KROPP}" fill="${T.bas}"/>` +
    `<path d="${RYGG}" fill="${T.ljus}"/>` +
    `<path d="${UNDER}" fill="${T.mork}"/>` +
    `<path d="${arm(q.hoger, 8)}" fill="${T.mork}"/>` +
    `<g transform="translate(57 ${37 + hdy})rotate(${p.hr})scale(0.56)translate(-50 -50)">` +
    `<path d="${HUVUD}" fill="${T[av.huvud]}"/><g clip-path="url(#${id})">${drag(p, T, vit, variant)}</g></g>` +
    `</g></svg>`
  );
}

export const META = {
  namn: 'Prikko, grävlingen',
  koncept:
    'En grävling mitt i ett skrap, med artens två lodräta band tvärs genom ögonen så att arttecken och öga blir samma form.',
  former: 11,
  farger: 5,
  egenhet:
    'Tre grova gräveklor i luften, och artens två lodräta band som går GENOM ögonen, så att arttecken och öga är samma form.',
  svaghet:
    'I gult har den mörka tonen svag kontrast mot grundtonen, så banden nästan försvinner i 24 px. Siluetten lutar sig dessutom hårt mot klorna.',
};
