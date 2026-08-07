/**
 * Prikkos maskot: GRÄVLINGEN.  Ritad mot BRIEF.md v4, alltså FIGUREN FÖRST.
 *
 * ── Vad som är nytt, och varför ────────────────────────────────────────
 * Tidigare versioner ritades under bedömningsmärkets villkor: märket ska bära
 * i 24 px, en pupill kräver en ögonvita, en ögonvita kräver en kant, en kant
 * slammar igen i 24 px, alltså förbjöds ögonvita och pupill i hela figuren.
 * Resultatet överlevde i 24 px och var dött i 200 px. Den ordningen är nu
 * omvänd. Figuren ritas fri, med riktiga ögon, och märket härleds efteråt.
 *
 * ── Figurens enda riktigt egna idé ────────────────────────────────────
 * BANDET OCH ÖGAT ÄR SAMMA FORM.
 *
 * Grävlingens verkliga teckning är två LODRÄTA mörka band som löper från
 * öronen, GENOM ögonen, ned längs mulen och samman i nosen. Den tidigare
 * versionen ritade i stället ett brett ljust band MELLAN ögonen, och det läser
 * som en brottarmask eller en apa, inte som en grävling.
 *
 * Nu när ögat är en stor ljus form kan bandet bli ögats ram. Bandet är brett
 * exakt där ögat sitter och avsmalnar uppåt och nedåt, alltså är dess bredaste
 * parti ögonvitans inramning. Arttecknet och ögat är därmed inte två drag som
 * ligger nära varandra, de är EN form.
 *
 * Följden är strukturell och inte kosmetisk: hela ögonsystemet, alltså
 * ögonvita, pupill, ögonlock och bryn, ritas inuti en beskärning som ÄR de två
 * banden. Ögat kan inte lämna bandet, och locket kan inte spilla ut på den
 * ljusa kinden. Det är också det som gör att locket får vara hur stort som
 * helst: överskottet hamnar alltid på bandet och är per definition osynligt.
 *
 * ── Buggen från förra försöket, och hur den är omöjlig här ─────────────
 * Då lades banden som två delbanor i EN path-d. De fick motsatt varvriktning
 * mot cirklarna i samma bana, subtraherade i stället för att förenas och
 * försvann. Här är varje band ett EGET path-element, och nos och band ligger i
 * en grupp med gemensam fyllning. Två element kan inte subtrahera varandra,
 * alltså kan felet inte uppstå igen oavsett hur punktlistorna vänds.
 *
 * ── Valör, inte svart och vitt ────────────────────────────────────────
 * Arten är svartvit, figuren måste tåla blått, grönt, gult och rött som hela
 * sin kulör. Teckningen bärs därför av VALÖR: ljus panna, mörkt band, vit
 * ögonvita, mycket mörk pupill. Alla utom vitt härleds ur grundfärgen, så ett
 * enda färgbyte färgar om hela figuren och avstånden mellan valörerna följer
 * med. Pupillen är avsiktligt mörkare än allt annat, eftersom gult annars
 * tappar sitt djupaste steg och blicken slocknar.
 *
 * ── Rundheten ─────────────────────────────────────────────────────────
 * Slutna konturer ritas genom `mjuk()`, som lägger en Catmull-Rom-kurva genom
 * en punktlista och räknar om den till kubiska bezier. Kontrollpunkterna kring
 * varje punkt härleds ur samma sekant och ligger därför per definition på en
 * linje genom punkten: en sådan kontur KAN inte få ett hörn, hur punkterna än
 * flyttas. Det som är runt av naturen, alltså pupiller, ögonlock och munbågen,
 * ritas som riktiga cirklar, ellipser och A-kommandon och aldrig som fyra
 * bezierkurvor som nästan är en cirkel.  Raka linjekommandon i figuren: 0.
 */

import { munbana, BREDD, TJOCKLEK, RADIE } from '../maskot-mun.mjs';

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
const morkare = (c, t) => hs(hx(c).map((v) => v * (1 - t)));

/**
 * Fem härledda valörer plus vitt. Ordnade ljusast till mörkast:
 *   skugga  marken under figuren
 *   ljus    ansiktets ljusa fält och ryggens dager, alltså grävlingens vita
 *   bas     kroppen
 *   mork    banden, nosen, munnen, lemmarna
 *   djup    pupillen, och ingenting annat
 * `djup` finns för att gult annars saknar ett mörkaste steg. Utan den läser
 * den gula figurens blick som en grumlig fläck i stället för som en pupill.
 */
function toner(ton) {
  const p = PALETT[ton] || PALETT.blue;
  return {
    bas: p.bas,
    mork: p.mork,
    ljus: ljusare(p.bas, 0.62),
    skugga: ljusare(p.bas, 0.84),
    djup: morkare(p.mork, 0.52),
  };
}

/* ══ 1b. RUNDHETENS VERKTYG ════════════════════════════════════════════ */

/* Två decimaler och inte en. Rundningsfelet hamnar annars i kontrollpunkterna,
 * och en kontrollarm på två enheter tappar då upp emot sex grader tangent. */
const P = (a) => `${+a[0].toFixed(2)} ${+a[1].toFixed(2)}`;
const N = (v) => +v.toFixed(2);

/**
 * SLUTEN MJUK KURVA genom en punktlista. Catmull-Rom till kubisk bezier.
 * @param pts      punkter i ordning
 * @param spanning 1 är rak Catmull-Rom. Lägre ger stramare, högre fylligare.
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

/* ══ 2. HUVUDET, EGEN 100-RUTA ═════════════════════════════════════════
 *
 * Måtten står samlade i gravling-konstruktion.md. Kort:
 *   hjässa y 9,5   haka y 95,5   bredast 79 enheter vid y 50
 *   öronen är PUNKTER i samma slutna kurva som hjässan, inte pålimmade
 *   bezierbukter. Det var öronens 174-graders spets som gjorde att förra
 *   versionen läste som kantig i själva toppen av siluetten.
 */

const HUVUD_PUNKTER = [
  [10.5, 50.0], [12.0, 37.0], [17.0, 27.0],          // vänster tinning uppåt
  [22.5, 21.0], [26.5, 16.5], [31.5, 18.0],          // vänster öra, fyllig bula
  [35.2, 23.5],                                      // örats fäste, mjuk dal
  [41.0, 14.0], [50.5, 9.5], [60.0, 14.0],           // hjässan
  [65.8, 23.5],                                      // höger örfäste
  [69.0, 18.0], [73.5, 16.5], [77.8, 21.0],          // höger öra
  [83.0, 27.0], [88.0, 37.0], [89.5, 50.0],          // höger tinning nedåt
  [88.2, 62.0], [84.0, 73.0], [76.0, 83.5],          // höger kind
  [64.5, 92.0], [50.5, 95.5], [36.5, 92.0],          // haka
  [25.0, 83.5], [17.0, 73.0], [12.3, 62.0],          // vänster kind
];
const HUVUD = mjuk(HUVUD_PUNKTER, 0.92);
const HUVUD_BREDD = 79;

/* ══ 2b. ÖGONSYSTEMET, FYRA DELAR ══════════════════════════════════════
 *
 * 1 ÖGONVITAN   en aningen oregelbunden form, inte en cirkel och inte en
 *               ellips. Skevheten är två svaga sinusmoduleringar av radien,
 *               och den är det billigaste som finns för att en form ska läsa
 *               som ritad i stället för som konstruerad.
 * 2 PUPILLEN    solid, i den mörkaste valören, fritt flyttbar inom ögonvitan.
 *               Aldrig vertikalt centrerad, alltid svagt konvergerande inåt.
 * 3 ÖGONLOCKET  en ellips i BANDETS färg som skär in uppifrån. Locket gör hela
 *               känsloarbetet: vinkeln är skillnaden mellan vaken, misstänksam,
 *               trött och bekymrad.
 * 4 BRYNET      en fristående avsmalnande stav i den LJUSA valören, alltså
 *               grävlingens ljusa päls som tränger in i det mörka bandet. Den
 *               sitter inte fast i pannan, och just friläget är det som ger
 *               stort utslag för liten insats.
 *
 * Ögonen sitter ISÄR med ett ljust bläs emellan, de är OLIKA STORA och de har
 * INGEN gemensam mask. Det är tre medvetna avstånd till Duos två nästan
 * perfekta cirklar i en delad ljusare mask.
 *
 * Ögonvitan per öga är 25,2 respektive 26,8 enheter bred av huvudets 79, alltså
 * 32 och 34 procent. Tillsammans 66 procent av ansiktsbredden.
 */

const OGA = {
  v: { x: 32.5, y: 49.5, rx: 12.6, ry: 13.35, vrid: -5, rim: 3.2, s: 1 },
  h: { x: 69.5, y: 47.5, rx: 13.4, ry: 14.20, vrid: 6, rim: 3.0, s: -1 },
};

/* `s` är riktningen INÅT mot ansiktets mitt. Allt spegelvänt i ögonsystemet
 * går genom den, så vänster och höger öga delar all geometri och skiljer sig
 * bara i sina egna mått. */

const vrid = (o, dx, dy) => {
  const r = (o.vrid * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return [o.x + dx * c - dy * s, o.y + dx * s + dy * c];
};

/** 1. ÖGONVITAN. */
function ogonvita(o) {
  const n = 14;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI;
    const k = 1 + 0.055 * Math.sin(a + 0.9) + 0.028 * Math.sin(2 * a + 2.2);
    pts.push(vrid(o, o.rx * k * Math.cos(a), o.ry * k * Math.sin(a)));
  }
  return mjuk(pts, 0.98);
}

/**
 * ARTTECKNET. Bandets profil, som andel av bandets halva bredd W och med y
 * räknat från ögats centrum. Negativ andel är utåt mot kinden, positiv är inåt
 * mot nosen. W = ögats rx plus ramens tjocklek, alltså är ramen runt ögat
 * konstruerad och inte handpassad.
 *
 * Bandet är brett över hela ögats höjd, avsmalnar uppåt och löper ut ovanför
 * hjässan där det beskärs av huvudet, och avsmalnar nedåt in i nosen.
 */
const BAND_PROFIL = [
  [-0.63, -58.5], [-0.85, -34.5], [-0.97, -18.0], [-1.00, -4.0],   // ut, uppifrån
  [-1.00, 6.0], [-0.96, 12.0], [-0.84, 17.0], [-0.52, 21.5],       // ut, nedåt
  [0.00, 23.5],                                                     // nedre änden
  [0.55, 21.5], [0.86, 15.0], [0.98, 7.0], [1.00, -2.0],           // in, uppåt
  [0.96, -14.0], [0.84, -30.0], [0.58, -58.5],
];

function band(o) {
  const W = o.rx + o.rim;
  return mjuk(BAND_PROFIL.map(([u, dy]) => [o.x + u * W * o.s, o.y + dy]), 0.92);
}

const BAND_V = band(OGA.v);
const BAND_H = band(OGA.h);

/**
 * NOSEN. Bandens nedre ändar löper in i den, så att nos och band är ETT
 * system och inte tre lösa fläckar. En rundad sköld, bredast upptill.
 */
const NOS = mjuk([
  [40.0, 62.0], [45.0, 58.0], [51.0, 57.0], [57.0, 58.0], [62.0, 62.0],
  [61.0, 67.5], [56.5, 72.0], [51.0, 74.0], [45.5, 72.0], [41.0, 67.5],
], 0.9);

/** 2. PUPILLEN. */
function pupill(o, b, T, enkel) {
  const r = o.rx * (enkel ? 0.55 : 0.47);
  const cx = o.x + 0.11 * o.rx * o.s + b[0];        // konvergerar svagt inåt
  const cy = o.y + 0.30 * o.ry + b[1];              // aldrig vertikalt centrerad
  return `<circle cx="${N(cx)}" cy="${N(cy)}" r="${N(r)}" fill="${T.djup}"/>`;
}

/**
 * 3. ÖGONLOCKET.  niva 0 är helt öppet, 1 är helt slutet.
 * Ellipsen är avsiktligt mycket bredare än ögat, så att lockets underkant blir
 * en flack båge över ögat i stället för en tvär kupa. Överskottet beskärs av
 * bandet. Positiv vinkel sänker den INRE änden, alltså arg, negativ höjer den,
 * alltså bekymrad.
 */
function lock(o, niva, v) {
  if (niva <= 0) return '';
  const rx = o.rx * 1.95, ry = o.ry * 1.4;
  const kant = o.y - o.ry + 2 * o.ry * niva;
  const rot = v ? ` transform="rotate(${N(o.s * v)} ${o.x} ${o.y})"` : '';
  return `<ellipse cx="${o.x}" cy="${N(kant - ry)}" rx="${N(rx)}" ry="${N(ry)}"${rot}/>`;
}

/**
 * 4. BRYNET. Avsmalnande stav med runda ändar, tjockast ytterst. Ligger fritt
 * ovanför locket. `dy` höjer eller sänker det, `v` vrider det, med samma
 * teckenregel som locket: positivt är arg.
 */
function bryn(o, dy, v) {
  const L = o.rx * 0.95;
  const cy = o.y - o.ry - 5.4 + dy;
  const t = (u) => 3.7 - 1.6 * ((u + L) / (2 * L));
  const us = [-L, -L * 0.5, 0, L * 0.5, L];
  const lokal = [
    ...us.map((u) => [u, -t(u)]),
    [L * 1.2, 0],
    ...us.slice().reverse().map((u) => [u, t(u)]),
    [-L * 1.2, 0],
  ];
  const r = (o.s * v * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r);
  return mjuk(lokal.map(([u, w]) => {
    const x = u * o.s;
    return [o.x + (x * c - w * sn), cy + (x * sn + w * c)];
  }), 0.9);
}

/* ══ 2c. MUNNEN ════════════════════════════════════════════════════════
 *
 * Munnen KRYMPER, eftersom ögonen nu gör arbetet. Den var 46 procent av
 * rutans bredd när den ensam bar hela bedömningen. Nu är den 22 procent av
 * HUVUDETS bredd, alltså 17,4 av 79 enheter, vilket ligger i övre kanten av
 * briefens intervall 15 till 22 procent.
 *
 * Radie och tjocklek skalas med SAMMA faktor som bredden, inte var för sig.
 * Håller man bredden och behåller märkets radie blir bågen nästan rak, och det
 * var precis det felet som gjorde munnen till ett streck förra gången. Här är
 * pilhöjden fortfarande 21,4 procent av munnens bredd, alltså exakt märkets
 * egen bågform, bara mindre.
 */
const MUN_B = (0.22 * HUVUD_BREDD) / 100;              // 0,1738 av rutan
const KRYMP = MUN_B / BREDD.storre;                    // 0,3778
const MUN_R = RADIE.dagens * KRYMP;
const MUN_SW = TJOCKLEK.dagens * KRYMP;
const MUN_CY = 80.0;

const MUNNAR = {
  glad: { n: 'clean', b: 1.06, r: 1, lut: 2, djup: 2.6 },
  vagig: { n: 'minor', b: 1.0, r: 1, lut: 2.5, djup: 0 },
  ledsen: { n: 'major', b: 0.98, r: 1, lut: 2, djup: 0 },
  smal: { n: 'minor', b: 0.68, r: 0.8, lut: 3, djup: 0 },
  finurlig: { n: 'clean', b: 0.9, r: 0.76, lut: 7, djup: 2 },
  oppen: { n: 'clean', b: 0.92, r: 0.8, lut: 2, djup: 6.5 },
  rundo: { n: 'clean', b: 0.42, r: 0.5, lut: 0, djup: 3.4 },
};

const BAGE = /^M([-\d.]+) ([-\d.]+)A([-\d.]+) [-\d.]+ 0 0 (\d) ([-\d.]+) ([-\d.]+)$/;

/**
 * Munhålan byggs PÅ munbanan och inte bredvid den: ändpunkterna och radien
 * läses ur maskot-mun.mjs egen utdata, så munnen förblir enda källa också när
 * figuren öppnar munnen. Returbågen är ett riktigt A-kommando, och hålans två
 * spetsar ligger under strykets runda ändar, alltså syns aldrig ett hörn.
 */
function kavitet(d, djup) {
  const t = d.match(BAGE);
  if (!t || djup <= 0) return '';
  const [x1, y1, Rt, sw, x2, y2] = [+t[1], +t[2], +t[3], +t[4], +t[5], +t[6]];
  const b = Math.hypot(x2 - x1, y2 - y1);
  const ht = Rt - Math.sqrt(Math.max(0, Rt * Rt - (b / 2) ** 2));
  const h = (sw === 1 ? ht : -ht) + djup;
  if (h <= 0.05) return '';
  const R = h / 2 + (b * b) / (8 * h);
  return `${d}A${R.toFixed(2)} ${R.toFixed(2)} 0 0 0 ${x1} ${y1}Z`;
}

/* ══ 3. UTTRYCKEN ══════════════════════════════════════════════════════
 *
 * Nio stycken. Var och en sätter ögonlockens nivå och vinkel, brynens höjd och
 * vinkel, pupillernas läge, huvudets vridning, munnen och kroppens pose.
 *
 * De tre bedömningarna delade tidigare allt utom munnen, av rädsla för att två
 * bärare skulle bli gröt. Den regeln föll med v4: nu när munnen är en femtedel
 * så stor kan den inte bära ensam, och brynen är i stället den tydligaste
 * kanalen som finns. Skillnaden bärs därför av tre saker som pekar åt samma
 * håll: brynen, munnen och klornas höjd. De motsäger aldrig varandra, och det
 * är motsägelsen och inte mångfalden som gör gröt.
 */

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

/* lock:  [nivå vänster, nivå höger], vinkel [v, h]
 * bryn:  [dy vänster, dy höger], vinkel [v, h].  Positiv vinkel = inre änden
 *        ned = arg.  Negativ = inre änden upp = bekymrad.
 * blick: pupillens förskjutning i rutans egna enheter, samma för båda ögonen
 *        så att de tittar åt samma håll. */
const POS = {
  clean: {
    mun: 'glad', lock: [0, 0], lockv: [0, 0], bryn: [-2.4, -3.0], brynv: [-3, -4],
    blick: [0.6, -0.8], hr: -10, pose: 'klorHogt',
  },
  minor: {
    mun: 'vagig', lock: [0.24, 0.10], lockv: [7, -4], bryn: [1.6, -3.8], brynv: [9, -9],
    blick: [1.6, 0.4], hr: 13, pose: 'klorUt',
  },
  major: {
    mun: 'ledsen', lock: [0.30, 0.30], lockv: [16, 15], bryn: [3.4, 3.0], brynv: [21, 19],
    blick: [0.2, 1.0], hr: 5, pose: 'klorNed',
  },

  soker: {
    mun: 'smal', lock: [0.42, 0.34], lockv: [11, 8], bryn: [-0.6, 1.4], brynv: [4, 12],
    blick: [4.2, 1.4], hr: 15, pose: 'nosar',
  },
  hittat: {
    mun: 'oppen', lock: [0, 0], lockv: [0, 0], bryn: [-5.2, -5.8], brynv: [-6, -7],
    blick: [0.4, -2.6], hr: -4, pose: 'hojer',
  },
  vantar: {
    mun: 'smal', lock: [0.50, 0.50], lockv: [4, 3], bryn: [1.0, 1.2], brynv: [2, 2],
    blick: [4.4, 0.2], hr: 11, pose: 'lutar',
  },
  nojd: {
    mun: 'finurlig', lock: [0.44, 0.30], lockv: [-9, -12], bryn: [-1.8, -3.2], brynv: [-7, -10],
    blick: [1.4, 0.4], hr: -14, pose: 'sitter',
  },
  tom: {
    mun: 'rundo', lock: [0.20, 0.20], lockv: [-13, -12], bryn: [-2.2, -2.0], brynv: [-16, -15],
    blick: [1.2, 2.6], hr: 20, pose: 'tittar_ned',
  },
  fyrafyra: {
    mun: 'smal', lock: [0.14, 0.46], lockv: [-8, 10], bryn: [-4.6, 2.2], brynv: [-12, 8],
    blick: [3.0, 1.2], hr: 27, pose: 'graver',
  },
};

/* ══ 4. KROPPEN ════════════════════════════════════════════════════════
 *
 * Grundposen är INTE givakt. Grävlingen står framåtlutad mitt i ett skrap:
 * tyngden på det bakre benet, ena framtassen uppe med klorna i luften, den
 * andra nere, fötterna isär och olika vinklade, huvudet vridet mot dig.
 *
 * Kropp   kompakt päron, x 34..78, y 55..106.
 * Huvud   centrum (57, 34), skala 0,62, alltså 49 brett mot kroppens 44.
 *         Kvoten 1,11:1. Huvudet växte från 0,56 när ögonen tog över: ett
 *         ansikte som ska bära uttrycket måste ha plats att göra det.
 * Klorna  det enda som sticker ut ur konturen. De bär siluetten.
 */

const KROPP_PUNKTER = [
  [56.0, 55.0], [65.5, 58.0], [72.8, 66.0], [76.6, 77.0], [77.2, 89.0],
  [73.4, 99.5], [64.5, 104.6], [54.0, 105.4], [43.8, 103.4], [37.2, 96.8],
  [35.0, 87.0], [36.2, 76.0], [40.8, 64.6], [47.8, 57.6],
];
const KROPP = mjuk(KROPP_PUNKTER, 0.95);

/* Skuldrornas ljusa fält och undersidans mörka. Hård kant mot grundtonen,
 * aldrig en toning. Båda ritas som egna mjuka blobbar som SPILLER UT över
 * kroppen och beskärs mot kroppens egen bana, så att den yttre kanten per
 * definition är kroppens och den inre är en enda mjuk kurva. */
const RYGG = mjuk([
  [27.0, 83.0], [33.5, 74.0], [43.5, 68.2], [56.0, 65.6], [68.0, 65.2], [80.0, 68.4],
  [88.0, 58.0], [80.0, 44.0], [56.0, 41.0], [32.0, 45.0], [24.0, 60.0],
], 0.9);

const UNDER = mjuk([
  [31.0, 91.5], [41.5, 96.8], [54.0, 98.4], [66.5, 95.6], [79.0, 87.5],
  [86.0, 100.0], [79.0, 114.0], [54.0, 117.0], [29.0, 114.0], [24.0, 100.0],
], 0.9);

/* Skuggan är en pillerform, aldrig en oval: ovaler antyder perspektiv. Ritad
 * genom `mjuk`, alltså utan ett enda rakt parti. Marken är y 116. */
const SKUGGA = mjuk([
  [58, 106], [70, 106.4], [79, 108.8], [82, 112], [79, 115.2], [70, 117.6],
  [58, 118], [46, 117.6], [37, 115.2], [34, 112], [37, 108.8], [46, 106.4],
], 0.85);

/* ── Lemgenerator ─────────────────────────────────────────────────────── */

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const enh = (a) => { const L = Math.hypot(a[0], a[1]) || 1; return [a[0] / L, a[1] / L]; };
const perp = (a) => [-a[1], a[0]];

/**
 * Avsmalnande lem från axel via böj till handled, med RUNDA ändar.
 * Ändarna är halvcirklar med lemmens egen halvbredd som radie, och
 * kontrollpunkterna ligger LÄNGS centrumlinjen i ändpunkterna, vilket gör
 * skarven mot halvcirkeln exakt tangentkontinuerlig i stället för ungefär.
 * Vid böjen används bisektrisen som tangent på båda sidor, så lemmen böjer sig
 * utan att knäcka. Noll raka segment, noll hörn.
 */
function lem(a, b, c, wa, wb) {
  const uab = enh(sub(b, a)), ubc = enh(sub(c, b));
  const um = enh(add(uab, ubc));
  const na = perp(uab), nb = perp(um), nc = perp(ubc);
  const wm = (wa + wb) / 2;
  const k1 = Math.hypot(...sub(b, a)) * 0.5, k2 = Math.hypot(...sub(c, b)) * 0.5;
  const A1 = add(a, mul(na, wa)), B1 = add(b, mul(nb, wm)), C1 = add(c, mul(nc, wb));
  const A2 = sub(a, mul(na, wa)), B2 = sub(b, mul(nb, wm)), C2 = sub(c, mul(nc, wb));
  return (
    `M${P(A1)}` +
    `C${P(add(A1, mul(uab, k1)))} ${P(sub(B1, mul(um, k1)))} ${P(B1)}` +
    `C${P(add(B1, mul(um, k2)))} ${P(sub(C1, mul(ubc, k2)))} ${P(C1)}` +
    `A${wb} ${wb} 0 0 0 ${P(C2)}` +
    `C${P(sub(C2, mul(ubc, k2)))} ${P(add(B2, mul(um, k2)))} ${P(B2)}` +
    `C${P(sub(B2, mul(um, k1)))} ${P(add(A2, mul(uab, k1)))} ${P(A2)}` +
    `A${wa} ${wa} 0 0 0 ${P(A1)}Z`
  );
}

/**
 * Tass med tre gräveklor, ritad som EN sluten mjuk kontur. Tassen samplas i
 * polära koordinater: grundradien är cirkelns, och vid varje klovinkel höjs
 * radien med en cos²-klocka, som har derivatan noll i sina kanter och därför
 * smälter in i cirkeln utan skarv. Klon blir en grov rundad utväxt i stället
 * för en spets, vilket dessutom är vad artens gräveklo ser ut som i siluett.
 */
function tass(c, vinkel, r = 9, klo = 10) {
  const KLOR = [-34, 0, 34];
  const BV = 17;
  const vinklar = [];
  for (const k of KLOR) for (const d of [-1, -0.62, -0.3, 0, 0.3, 0.62, 1]) vinklar.push(k + d * BV);
  for (const m of [-90, -56, 56, 90, 125, 180, 235]) vinklar.push(m);
  vinklar.sort((x, y) => x - y);
  const pts = vinklar.map((A) => {
    let ut = 0;
    for (const k of KLOR) {
      let d = A - k;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      if (Math.abs(d) < BV) ut = Math.max(ut, klo * Math.cos((Math.PI * d) / (2 * BV)) ** 2);
    }
    const v = ((vinkel + A) * Math.PI) / 180;
    return [c[0] + (r + ut) * Math.cos(v), c[1] + (r + ut) * Math.sin(v)];
  });
  return mjuk(pts, 0.72);
}

/** Bakfot. Platt och rundad, UTAN klor: bara framtassarna gräver. */
function fot([cx, cy], vinkel, w = 11, h = 7) {
  const r = (vinkel * Math.PI) / 180, co = Math.cos(r), si = Math.sin(r);
  const p = (x, y) => [cx + x * co - y * si, cy + x * si + y * co];
  return mjuk([
    p(-w * 0.55, -h * 1.25), p(w * 0.2, -h * 1.3), p(w * 0.86, -h * 0.95),
    p(w, -h * 0.1), p(w * 0.8, h * 0.85), p(w * 0.15, h * 1.25),
    p(-w * 0.6, h * 1.15), p(-w, h * 0.3), p(-w, -h * 0.7),
  ], 0.9);
}

/* Poserna. hoger = den lyfta framtassen, vanster = den andra, ben och fötter.
 * Fötterna står isär och är olika vinklade. Den medvetna asymmetrin. */
const POSER = {
  klorHogt: {
    hoger: { a: [70, 66], b: [84, 56], c: [89, 42], v: -74 },
    vanster: { a: [43, 69], b: [33, 78], c: [29, 92], v: 86 },
    ben: [[46, 94, 44, 104], [66, 94, 70, 104]],
    fot: [[40, 108, -7], [74, 109, 6]],
    lut: 0, kropp: '',
  },
  klorUt: {
    hoger: { a: [70, 71], b: [86, 73], c: [97, 74], v: -6 },
    vanster: { a: [43, 70], b: [32, 76], c: [26, 84], v: 56 },
    ben: [[46, 94, 42, 104], [66, 94, 71, 104]],
    fot: [[38, 108, -9], [75, 109, 9]],
    lut: 2, kropp: '',
  },
  klorNed: {
    hoger: { a: [70, 73], b: [82, 85], c: [86, 98], v: 62 },
    vanster: { a: [43, 72], b: [34, 85], c: [32, 98], v: 104 },
    ben: [[46, 96, 43, 105], [66, 96, 70, 105]],
    fot: [[40, 109, -5], [73, 110, 5]],
    lut: -6, kropp: 'translate(60 108)scale(1.06 0.9)translate(-60 -108)',
  },
  hojer: {
    hoger: { a: [70, 65], b: [84, 53], c: [88, 37], v: -80 },
    vanster: { a: [43, 68], b: [33, 77], c: [29, 91], v: 86 },
    ben: [[46, 94, 44, 104], [66, 94, 70, 104]],
    fot: [[40, 108, -7], [74, 109, 6]],
    lut: 0, kropp: 'translate(0 -3)',
  },
  nosar: {
    hoger: { a: [70, 69], b: [80, 81], c: [84, 95], v: 62 },
    vanster: { a: [43, 70], b: [35, 81], c: [34, 94], v: 88 },
    ben: [[46, 94, 42, 104], [66, 94, 71, 104]],
    fot: [[38, 108, -7], [75, 109, 6]],
    lut: -7, kropp: '',
  },
  lutar: {
    hoger: { a: [70, 67], b: [78, 59], c: [77, 49], v: -118 },
    vanster: { a: [43, 68], b: [33, 77], c: [29, 91], v: 86 },
    ben: [[46, 94, 45, 104], [66, 94, 69, 104]],
    fot: [[41, 108, -7], [73, 109, 6]],
    lut: 0, kropp: '',
  },
  sitter: {
    hoger: { a: [70, 69], b: [78, 79], c: [76, 91], v: 74 },
    vanster: { a: [43, 70], b: [36, 81], c: [36, 92], v: 92 },
    ben: [[46, 92, 40, 102], [66, 92, 74, 102]],
    fot: [[36, 106, -7], [78, 107, 6]],
    lut: 0, kropp: 'translate(60 108)scale(1.04 0.94)translate(-60 -108)',
  },
  tittar_ned: {
    hoger: { a: [70, 69], b: [78, 81], c: [76, 93], v: 78 },
    vanster: { a: [43, 70], b: [36, 82], c: [36, 93], v: 92 },
    ben: [[46, 94, 43, 104], [66, 94, 70, 104]],
    fot: [[39, 108, -7], [74, 109, 6]],
    lut: -2, kropp: '',
  },
  graver: {
    hoger: { a: [70, 69], b: [84, 77], c: [90, 91], v: 44 },
    vanster: { a: [43, 70], b: [35, 82], c: [34, 95], v: 90 },
    ben: [[46, 94, 42, 104], [66, 94, 72, 104]],
    fot: [[38, 108, -7], [76, 109, 6]],
    lut: -9, kropp: '',
  },
};

/* ══ 4b. GÅNGCYKELN ════════════════════════════════════════════════════
 *
 * Bildrutor, inte transform. En transform kan flytta, skala och rotera former
 * som redan finns, men inte ÄNDRA en form, och det är formändringen som gör
 * att figuren läser som levande i stället för som en pappersdocka på en pinne.
 *
 *   ruta 0 och 4  kontakt, varandras spegling
 *   ruta 1 och 5  nedgång, kroppen LÄGST och mest hoptryckt
 *   ruta 2 och 6  passering
 *   ruta 3 och 7  uppgång, kroppen HÖGST och sträckt
 *
 * Huvudet följer kroppen EN RUTA SENARE. Eftersläpningen är det som ger tyngd.
 * Och ansiktet åker inte bara med: ögonlock, bryn, blick och mun har egna
 * värden per ruta, så figuren blinkar och andas medan den springer.
 */

export const GANG = { rutor: 8, halltid: [90, 70, 70, 110, 90, 70, 70, 110] };

const KROPP_Y = [0, 4, 1, -3, 0, 4, 1, -3];
const KROPP_LUT = [-1, -3.5, -1.5, 2, -1, -3.5, -1.5, 2];
const KROPP_SKALA = [1, 1.06, 1.01, 0.95, 1, 1.06, 1.01, 0.95];   // squash och stretch, 6 %
/* Ansiktet per ruta. Lock nere i nedgången, bryn upp i uppgången. */
const GANG_LOCK = [0.12, 0.30, 0.14, 0, 0.12, 0.30, 0.14, 0];
const GANG_BRYN = [-1.2, 1.4, -0.6, -4.0, -1.2, 1.4, -0.6, -4.0];
const GANG_BLICK = [-0.4, 1.0, 0, -1.6, -0.4, 1.0, 0, -1.6];
const GANG_MUN = ['glad', 'smal', 'glad', 'oppen', 'glad', 'smal', 'glad', 'oppen'];

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
  const sk = KROPP_SKALA[i];
  return {
    hoger: {
      a: [70, 68],
      b: [rund((70 + armH[0]) / 2 + 4), rund((68 + armH[1]) / 2)],
      c: armH, v: rund(18 - 52 * Math.cos(t + Math.PI)),
    },
    vanster: {
      a: [43, 69],
      b: [rund((43 + armV[0]) / 2 - 4), rund((69 + armV[1]) / 2)],
      c: armV, v: rund(90 - 40 * Math.cos(t)),
    },
    ben: [
      [46, 94, rund(xn - 12), rund(104 - ln)],
      [66, 94, rund(xb + 12), rund(104 - lb)],
    ],
    fot: [
      [rund(xn - 16), rund(108 - ln), -7],
      [rund(xb + 16), rund(109 - lb), 6],
    ],
    lut: KROPP_LUT[i],
    kropp: `translate(0 ${KROPP_Y[i]})translate(60 108)scale(${N(2 - sk)} ${sk})translate(-60 -108)`,
    hdy: KROPP_Y[(i + 7) % 8],
    ansikte: {
      mun: GANG_MUN[i],
      lock: [GANG_LOCK[i], GANG_LOCK[i] * 0.8],
      lockv: [2, -1],
      bryn: [GANG_BRYN[i], GANG_BRYN[i] - 0.6],
      brynv: [-2, -3],
      blick: [1.2, GANG_BLICK[i]],
      hr: rund(-6 + 5 * Math.sin(t)),
    },
  };
}

/* ══ 5. RITNING ════════════════════════════════════════════════════════ */

let n = 0;
const nyttId = () => `pk${(++n).toString(36)}`;

/**
 * ANSIKTET. Ritordningen är hela poängen:
 *   1  banden och nosen, ett element var, i den mörka valören
 *   2  ögonvitorna, ovanpå bandet
 *   3  pupillerna, beskurna mot ögonvitan så att blicken får gå ända ut
 *   4  ögonlocken och brynen, beskurna mot BANDET så att de aldrig kan
 *      spilla ut på den ljusa kinden
 *   5  munnen sist
 *
 * Banden och nosen ligger i en <g> med gemensam fyllning och som SEPARATA
 * element. Det är den enda konstruktion där varvriktningen inte kan ställa
 * till det: två element kan aldrig subtrahera varandra.
 */
function ansikte(p, T, enkel) {
  const idB = nyttId(), idO = nyttId();
  const par = [['v', 0], ['h', 1]];

  const vitor = par.map(([k]) => `<path d="${ogonvita(OGA[k])}" fill="#fff"/>`).join('');
  const pupiller = par.map(([k, i]) => pupill(OGA[k], [p.blick[0], p.blick[1]], T, enkel)).join('');
  const locken = par.map(([k, i]) => lock(OGA[k], p.lock[i], p.lockv[i])).join('');
  const brynen = par.map(([k, i]) => `<path d="${bryn(OGA[k], p.bryn[i], p.brynv[i])}"/>`).join('');

  const m = MUNNAR[p.mun] || MUNNAR.glad;
  const d = munbana(51, MUN_CY, 100, m.n, MUN_B * m.b, m.lut, MUN_R * m.r);
  const sw = MUN_SW * 100 * (enkel ? 1.18 : 1);
  const hal = enkel ? '' : kavitet(d, m.djup);
  const munnen =
    (hal ? `<path d="${hal}" fill="${T.djup}"/>` : '') +
    `<path d="${d}" fill="none" stroke="${T.mork}" stroke-width="${N(sw)}" stroke-linecap="round"/>`;

  /* Den enkla nivån är en EGEN ritning och inte den rika med delar borttagna:
   * ögonvitan är rundare och mindre modulerad, pupillen är större i förhållande
   * till ögat, locket och brynet är borta helt, och munnen är 18 procent
   * tjockare för att bära ned i små format. */
  if (enkel) {
    return (
      `<g fill="${T.mork}"><path d="${BAND_V}"/><path d="${BAND_H}"/><path d="${NOS}"/></g>` +
      par.map(([k]) => {
        const o = OGA[k];
        return `<ellipse cx="${o.x}" cy="${o.y}" rx="${N(o.rx * 0.94)}" ry="${N(o.ry * 0.94)}" fill="#fff"/>`;
      }).join('') +
      pupiller + munnen
    );
  }

  return (
    `<defs>` +
    `<clipPath id="${idB}"><path d="${BAND_V}"/><path d="${BAND_H}"/></clipPath>` +
    `<clipPath id="${idO}">` + par.map(([k]) => `<path d="${ogonvita(OGA[k])}"/>`).join('') + `</clipPath>` +
    `</defs>` +
    `<g fill="${T.mork}"><path d="${BAND_V}"/><path d="${BAND_H}"/><path d="${NOS}"/></g>` +
    vitor +
    `<g clip-path="url(#${idO})">${pupiller}</g>` +
    `<g clip-path="url(#${idB})"><g fill="${T.mork}">${locken}</g><g fill="${T.ljus}">${brynen}</g></g>` +
    munnen
  );
}

/** Huvudet med ansikte, beskuret mot huvudkonturen. */
function huvud(p, T, enkel, siluett) {
  const id = nyttId();
  if (siluett) {
    return `<path d="${HUVUD}" fill="#111"/>`;
  }
  return (
    `<defs><clipPath id="${id}"><path d="${HUVUD}"/></clipPath></defs>` +
    `<path d="${HUVUD}" fill="${T.ljus}"/>` +
    `<g clip-path="url(#${id})">${ansikte(p, T, enkel)}</g>`
  );
}

/**
 * @param {number}  size
 * @param {string}  ton      'blue' | 'clean' | 'minor' | 'major'
 * @param {string}  uttryck  nyckel ur UTTRYCK
 * @param {boolean} siluett  hela figuren i #111, inget vitt
 * @param {boolean} ansikte  beskuret ansikte, kant i kant, utan ram
 * @param {string}  klass    sätts på svg-elementet
 * @param {number}  steg     0..7, gångcykelns bildrutor. null = stillbild
 * @param {number}  blink    0 öppna, 1 halvslutna, 2 slutna
 * @param {string}  detalj   'rik' med pupill, lock och bryn. 'enkel' är en
 *                           egen förenklad ritning för märket. Utelämnad
 *                           väljer 'enkel' i inramat läge, 'rik' annars.
 */
export function figur({
  size = 160,
  ton = 'blue',
  uttryck = 'clean',
  siluett = false,
  ansikte: inramat = false,
  klass = '',
  steg = null,
  blink = 0,
  detalj = null,
} = {}) {
  const g = steg === null || steg === undefined ? null : gangRuta(((steg % 8) + 8) % 8);
  let p = g ? { ...POS.clean, ...g.ansikte } : (POS[uttryck] || POS.clean);
  if (blink) {
    const niva = blink === 2 ? 1 : 0.58;
    p = { ...p, lock: [niva, niva], lockv: blink === 2 ? [0, 0] : p.lockv };
  }
  const T = siluett
    ? { bas: '#111', mork: '#111', ljus: '#111', skugga: '#111', djup: '#111' }
    : toner(ton);
  const kl = klass ? ` class="${klass}"` : '';
  const a11y = ' role="img" aria-label="Prikkos grävling"';
  const enkel = (detalj ?? (inramat ? 'enkel' : 'rik')) === 'enkel';

  /* INRAMAT LÄGE. Ansiktet beskuret så att dragen går kant i kant. Ramen sätts
   * centralt av byggskriptet och ritas alltså inte här. Huvudets fyllning går
   * kant i kant i den ljusa valören, så att huvudkonturen försvinner. */
  if (inramat) {
    const RAMSKALA = 1.26;
    if (siluett) {
      /* Det enfärgade enpathsläget, alltså faviconen: bara arttecknet och
       * munnen står kvar, i en färg, på genomskinlig botten. */
      const m = MUNNAR[p.mun] || MUNNAR.glad;
      const d = munbana(51, MUN_CY, 100, m.n, MUN_B * m.b, m.lut, MUN_R * m.r);
      return (
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100"${kl}${a11y}>` +
        `<g transform="translate(50 50)scale(${RAMSKALA})translate(-51 -58)">` +
        `<g fill="#111"><path d="${BAND_V}"/><path d="${BAND_H}"/><path d="${NOS}"/></g>` +
        `<path d="${d}" fill="none" stroke="#111" stroke-width="${N(MUN_SW * 118)}" stroke-linecap="round"/>` +
        `</g></svg>`
      );
    }
    const id = nyttId();
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100"${kl}${a11y}>` +
      `<rect width="100" height="100" fill="${T.ljus}"/>` +
      `<defs><clipPath id="${id}"><path d="${HUVUD}"/></clipPath></defs>` +
      `<g transform="translate(50 50)scale(${RAMSKALA})translate(-51 -58)">` +
      `<g clip-path="url(#${id})">${ansikte(p, T, enkel)}</g></g></svg>`
    );
  }

  /* FRITT LÄGE. */
  const idK = nyttId();
  const q = g || POSER[p.pose] || POSER.klorHogt;
  const hdy = g ? g.hdy : 0;
  const arm = (o, w) => `${lem(o.a, o.b, o.c, w, w * 0.78)}${tass(o.c, o.v)}`;
  const benTass = q.ben
    .map(([x1, y1, x2, y2]) => lem([x1, y1], [(x1 + x2) / 2, (y1 + y2) / 2 + 1], [x2, y2], 8, 7))
    .join('');
  const fotter = q.fot.map(([x, y, v]) => fot([x, y], v)).join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 120 120"${kl}${a11y}>` +
    `<defs><clipPath id="${idK}"><path d="${KROPP}"/></clipPath></defs>` +
    `<g transform="${q.kropp || ''}rotate(${q.lut} 60 108)">` +
    (siluett ? '' : `<path d="${SKUGGA}" fill="${T.skugga}"/>`) +
    `<path d="${benTass}${fotter}" fill="${T.mork}"/>` +
    `<path d="${arm(q.vanster, 7.5)}" fill="${T.mork}"/>` +
    `<path d="${KROPP}" fill="${T.bas}"/>` +
    (siluett ? '' : `<g clip-path="url(#${idK})"><path d="${RYGG}" fill="${T.ljus}"/><path d="${UNDER}" fill="${T.mork}"/></g>`) +
    `<path d="${arm(q.hoger, 8)}" fill="${T.mork}"/>` +
    `<g transform="translate(57 ${34 + hdy})rotate(${p.hr})scale(0.62)translate(-51 -52)">` +
    huvud(p, T, enkel, siluett) +
    `</g></g></svg>`
  );
}

export const META = {
  namn: 'Prikko, grävlingen',
  koncept:
    'En grävling mitt i ett skrap, där artens två lodräta band inte ligger bredvid ögonen utan ÄR ögonen: ögonvitan är urskuren ur bandet, och hela blicken lever inuti arttecknet.',
  former: 22,
  farger: 6,
  egenhet:
    'Bandet och ögat är samma form. Ögat kan bokstavligen inte lämna arttecknet, för hela ögonsystemet är beskuret mot bandet, och de ljusa brynen ligger fritt inne i det mörka.',
  svaghet:
    'Ögonen tar så mycket plats att munnen blivit en accent, och i 24 px är brynen och pupillen borta, alltså är det inramade läget en egen ritning och inte figuren förminskad.',
  raka: 0,
};
