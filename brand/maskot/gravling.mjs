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
 * ── v5, när grävlingen blev vald ──────────────────────────────────────
 * Ägaren har valt figuren och pekat ut det INRAMADE FÖRENKLADE läget som
 * bedömningsmärket. Tre saker följde av det, och alla tre är mätbara:
 *
 *   PLATTAN   fick fem härledda steg, se PLATTA_TONER. Villkoret är att
 *             huvudets kontur ska synas mot plattan i 96, 64, 40, 24 och 16 px
 *             och även i gråskala. Tidigare hade platta och huvud samma färg.
 *   BRYNEN    fick ett eget mätt system med fem storheter, se BRYN_LAGE, på
 *             samma sätt som munnen har ett i ../maskot-mun.mjs.
 *   MÄRKET    ritas inte längre om utan BESKÄRS. Det enkla läget är samma
 *             ansikte som det fria med tre bevisade offer, se ansikte().
 *
 * Och ett verktyg: `isolera` låser allt utom en enda uttrycksbärare till clean,
 * så att frågan om en bärare bär går att avgöra i stället för att tyckas om.
 *
 * ── v6, när grävlingen skulle in i sajten ─────────────────────────────
 * Ingenting i teckningen ändrades. Det som ändrades är mekanik, och allt utom
 * det grå är räknat i tecken per märke gånger 8 511 märken på Stockholms hubb:
 *
 *   GRÅTT     sajten har FYRA lägen och inte tre. `none` är verksamheten som
 *             ännu inte bedömts. Den ligger nu i PALETT, i PLATTA_TONER, i
 *             BRYN_LAGE, i MUNNAR, i UTTRYCK och i POS, härledd med exakt samma
 *             recept som de fyra andra kulörerna. Se PALETT.none.
 *   NÅLEN     `detalj: 'nal'`, en tredje detaljnivå på tusen tecken mot det
 *             enkla lägets sextusen, utan en enda beskärning. Se 5b.
 *   BESKÄRNINGARNA  ögonbeskärningen ritas bara när den beskär något, alltså
 *             aldrig i bedömningsmärket. Se pupillenRyms.
 *   DECIMALERNA  varje koordinat i varje variant går genom P eller N. Se lem().
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
  /* FJÄRDE LÄGET, och det är inte en fjärde bedömning.
   *
   * Sajten har fyra lägen och inte tre: `none` är verksamheten som ännu inte
   * blivit bedömd. Den syns i listor, på kartan och i sökträffar precis lika
   * ofta som de tre andra, alltså måste figuren kunna bära den.
   *
   * Talen är inte nya. De är sajtens egna, ur site/src/lib/face.ts, där
   * FACE_FILL.none är #C7C7CC med det mörkare stoppet #AEAEB2 och FACE_RING.none
   * är #C7C7CC. Grundfärgen är alltså ringens och fyllningens gemensamma ton.
   *
   * Ingenting härleds annorlunda för grått. `toner` och PLATTA_TONER räknar på
   * `bas` precis som för de andra fyra, alltså är den grå figuren samma figur
   * med en kulör som råkar sakna mättnad. Det är hela poängen med att bära
   * teckningen på VALÖR: en avfärgad kulör är bara ett specialfall. */
  none: { bas: '#C7C7CC', mork: '#AEAEB2' },
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
    /* Den mörka tonen HÄRLEDS och tas inte ur paletten. Prikkos egna mörka
     * gula, #DEB201, ligger bara 12 procent under sin grundfärg, och i gult
     * försvann därför lemmarna in i kroppen och banden in i ansiktet. Ett fast
     * procenttal ger samma valörsprång i alla fyra kulörer, vilket är hela
     * poängen med att bära teckningen på valör i stället för på svart och vitt. */
    mork: morkare(p.bas, 0.26),
    ljus: ljusare(p.bas, 0.62),
    skugga: ljusare(p.bas, 0.84),
    djup: morkare(p.bas, 0.62),
  };
}

/**
 * MÄRKESPLATTAN, fem steg.
 *
 * Ägaren: "kanske den ska ha bakgrund som är lite lite starkare av
 * originalfärgen men samtidigt ljus".
 *
 * Problemet steget löser är mätbart och inte estetiskt. Plattan hade exakt
 * huvudets egen ljusa ton, alltså fanns ingen kant, alltså läste märket som två
 * mörka band som svävade fritt i stället för som ett ansikte. Det är samma
 * kontrastproblem som ägaren pekade ut i annan form tidigare.
 *
 * Stegen HÄRLEDS ur grundfärgen och är inte påhittade. Två axlar går samtidigt:
 *   mörkning  0 till 0,26, alltså slutar exakt på figurens egen `mork`-ton
 *   vitning   0,62 till 0,30, alltså blandning mot vitt
 * Steg 0 är därför bokstavligen ljusare(bas, 0,62), alltså dagens platta och
 * identisk med huvudets ton. Steg 4 är den mörka tonen blandad 30 procent mot
 * vitt, alltså tydligt mättad och ändå klart ljusare än huvudets grundton.
 *
 * Varför inte bara blanda mot vitt. I gult ligger grundfärgens ljushet redan på
 * 199 av 255, alltså finns bara 56 gråsteg mellan bas och vitt att fördela på
 * fem steg, och huvudets kontur försvann i gråskala. Med mörkningsaxeln med
 * blir gult 54 gråsteg skilt från huvudet vid steg 4 i stället för 22.
 */
const PLATTA_MORK = [0, 0.065, 0.13, 0.195, 0.26];
const PLATTA_VIT = [0.62, 0.54, 0.46, 0.38, 0.30];

export const PLATTA_TONER = Object.fromEntries(
  Object.entries(PALETT).map(([k, p]) => [
    k,
    PLATTA_MORK.map((d, i) => ljusare(morkare(p.bas, d), PLATTA_VIT[i])),
  ]),
);

/** Förvalt steg. Se PLATTA_TONER ovan för varför det inte är 0. */
export const PLATTA_VALD = 3;

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
 *   hjässa y 9,5   haka y 93,5   bredast 81 enheter vid y 50, alltså x 10 till 91
 *   öronen är PUNKTER i samma slutna kurva som hjässan, inte pålimmade
 *   bezierbukter. Det var öronens 174-graders spets som gjorde att förra
 *   versionen läste som kantig i själva toppen av siluetten.
 */

const HUVUD_PUNKTER = [
  [10.0, 50.0], [11.4, 36.0], [16.0, 26.0],          // vänster tinning uppåt
  [19.5, 20.5], [23.0, 14.5], [28.5, 13.5],          // vänster öra, rundad bula
  [33.5, 18.5],                                      // örats fäste, grund dal
  [40.0, 12.5], [50.5, 9.5], [61.0, 12.5],           // hjässan
  [67.5, 18.5],                                      // höger örfäste
  [72.5, 13.5], [78.0, 14.5], [81.5, 20.5],          // höger öra
  [85.0, 26.0], [89.6, 36.0], [91.0, 50.0],          // höger tinning nedåt
  [89.6, 62.0], [85.0, 73.0], [77.0, 82.5],          // höger kind
  [65.0, 90.5], [50.5, 93.5], [36.0, 90.5],          // haka
  [24.0, 82.5], [16.0, 73.0], [11.4, 62.0],          // vänster kind
];
const HUVUD = mjuk(HUVUD_PUNKTER, 0.92);
const HUVUD_BREDD = 81;

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
 *               stort utslag för liten insats. Brynet har ett EGET MÄTT SYSTEM
 *               med fem storheter, se 2bb, och är den bärare som klarar minst
 *               storlek av alla drag i ansiktet.
 *
 * Ögonen sitter ISÄR med ett ljust bläs emellan, de är OLIKA STORA och de har
 * INGEN gemensam mask. Det är tre medvetna avstånd till Duos två nästan
 * perfekta cirklar i en delad ljusare mask.
 *
 * Ögonvitan per öga är 25,2 respektive 26,8 enheter bred av huvudets 79, alltså
 * 32 och 34 procent. Tillsammans 66 procent av ansiktsbredden.
 */

const OGA = {
  v: { x: 31.0, y: 50.5, rx: 12.4, ry: 13.10, vrid: -5, rim: 3.2, s: 1 },
  h: { x: 71.0, y: 48.5, rx: 13.2, ry: 14.00, vrid: 6, rim: 3.0, s: -1 },
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
  [-0.86, -60], [-0.95, -44], [-1.00, -30], [-1.02, -18],          // yttersidan, uppifrån
  [-1.02, -6], [-1.00, 6], [-0.96, 12], [-0.84, 17], [-0.52, 21.5],
  [0.00, 23.5],                                                     // nedre änden, in i nosen
  [0.50, 21.5], [0.82, 17], [0.94, 12], [0.99, 6],                  // innersidan, nedifrån
  [1.00, -4], [0.92, -16], [0.74, -28], [0.56, -42], [0.40, -60],
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
  [39.5, 62.0], [45.0, 57.5], [51.0, 56.5], [57.0, 57.5], [62.5, 62.0],
  [61.5, 67.5], [57.0, 72.0], [51.0, 74.5], [45.0, 72.0], [40.5, 67.5],
], 0.9);

/**
 * ÖRONSPETSARNA. Grävlingens öron är svarta med en VIT KANT, och det är det
 * enda draget i hela ansiktet som ligger utanför bandet. De gör tre saker på
 * en gång: de är artriktiga, de bryter upp bandens övre ändar som annars läser
 * som två horn, och de ger figuren ett par ljusa punkter högst upp som ögat
 * hittar innan det hittar något annat.
 */
const ORON =
  `<ellipse cx="24.6" cy="17.2" rx="4.9" ry="4.0" transform="rotate(-22 24.6 17.2)"/>` +
  `<ellipse cx="76.4" cy="17.2" rx="5.2" ry="4.2" transform="rotate(22 76.4 17.2)"/>`;

/** 2. PUPILLEN. */
function pupill(o, b, T, enkel) {
  const r = o.rx * (enkel ? 0.55 : 0.47);
  const cx = o.x + 0.11 * o.rx * o.s + b[0];        // konvergerar svagt inåt
  const cy = o.y + 0.30 * o.ry + b[1];              // aldrig vertikalt centrerad
  return `<circle cx="${N(cx)}" cy="${N(cy)}" r="${N(r)}" fill="${T.djup}"/>`;
}

/**
 * RYMS PUPILLEN I ÖGONVITAN UTAN BESKÄRNING?
 *
 * Pupillen är beskuren mot ögonvitan för att blicken ska få gå ända ut i kanten
 * utan att spilla ut på bandet. För de blickriktningar som faktiskt använder den
 * friheten är beskärningen alltså ritad geometri och inte försiktighet: `soker`
 * går 1,8 enheter utanför, `vantar` 1,2 och `tom` 0,8.
 *
 * Men de fyra BEDÖMNINGARNA gör det inte. Deras minsta marginal är 0,83 enheter,
 * alltså ligger pupillen helt innanför, och där är beskärningen ett clipPath med
 * två ellipser som inte tar bort en enda pixel.
 *
 * Provet görs bara mot ELLIPSÖGAT, alltså det enkla lägets ögonvita. Det rika
 * lägets ögonvita moduleras in och ut 8,3 procent och kan vara smalare än
 * ellipsen just där pupillen står, så där behålls beskärningen alltid.
 *
 * Marginalen 0,3 enheter är tre tusendelar av rutan. Den finns för att pupillens
 * rand samplas och inte löses analytiskt, och den kostar ingenting: de fyra
 * bedömningarna klarar den med god råge och de fyra spillande lägena missar den
 * med lika god.
 */
const RYMS_MARGINAL = 0.3;
const rymsSvar = new Map();

function pupillenRyms(o, blick) {
  const nyckel = `${o.x},${blick[0]},${blick[1]}`;
  const svar = rymsSvar.get(nyckel);
  if (svar !== undefined) return svar;
  const r = o.rx * 0.55;
  const cx = o.x + 0.11 * o.rx * o.s + blick[0];
  const cy = o.y + 0.30 * o.ry + blick[1];
  const v = (-o.vrid * Math.PI) / 180, c = Math.cos(v), s = Math.sin(v);
  const a = o.rx - RYMS_MARGINAL, b = o.ry - RYMS_MARGINAL;
  let inne = true;
  for (let i = 0; i < 180 && inne; i++) {
    const t = (i / 180) * 2 * Math.PI;
    const dx = cx + r * Math.cos(t) - o.x, dy = cy + r * Math.sin(t) - o.y;
    const X = dx * c - dy * s, Y = dx * s + dy * c;
    inne = (X * X) / (a * a) + (Y * Y) / (b * b) <= 1;
  }
  rymsSvar.set(nyckel, inne);
  return inne;
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
  const rot = v ? ` transform="rotate(${N(o.s * v)} ${N(o.x)} ${N(o.y)})"` : '';
  return `<ellipse cx="${N(o.x)}" cy="${N(kant - ry)}" rx="${N(rx)}" ry="${N(ry)}"${rot}/>`;
}

/* ══ 2bb. BRYNEN, ETT EGET MÄTT SYSTEM ═════════════════════════════════
 *
 * Munnen fick ett eget uppmätt system i ../maskot-mun.mjs, och brynen får det
 * här av exakt samma skäl: en uttrycksbärare som bor som lösa tal inne i
 * uttryckstabellen går inte att mäta, inte att jämföra mellan figurer och
 * framför allt inte att ISOLERA. Utan isolering vet vi inte om bäraren bär.
 *
 * Ägarens skäl till att brynen finns över huvud taget är riktigt: det är
 * beskärningen som ger plats åt dem, och ett bryn bär ett ansiktsuttryck
 * starkare än något annat drag. Det är dessutom det BILLIGASTE draget i pixlar,
 * en tjock lutande stapel, alltså den formtyp som överlever nedskalning bäst.
 * Därför offras brynen sist av allt och blir KRAFTIGARE när ytan krymper.
 *
 * ── Fem storheter ─────────────────────────────────────────────────────
 * Alla utom vinkeln uttrycks som ANDEL AV HUVUDETS BREDD, alltså av 81 enheter,
 * så att de skalar med utsnittet och går att jämföra rakt av mellan figurer.
 *
 *   dy         HÖJD ÖVER ÖGAT. Avstånd från ögats övre kant upp till brynets
 *              mittlinje i brynets mitt, alltså mätt FÖRE lutningen.
 *              Per öga, [vänster, höger]. Positiv = högre upp.
 *   vinkel     GRADER, per öga. Positiv = INRE änden ned = arg. Negativ = inre
 *              änden upp = bekymrad. Roteras kring brynets egen mittpunkt.
 *   langd      LÄNGD längs brynets egen axel, utan de runda ändarna.
 *   tjocklek   FULL TJOCKLEK vid den YTTRE änden. Den inre är 52,5 procent av
 *              den, alltså avsmalnande inåt som ett riktigt bryn.
 *   glugg      AVSTÅNDET MELLAN BRYNENS INRE ÄNDAR, mätt före lutningen.
 *              Egen kanal, skild från vinkeln: närmare varandra läser argare
 *              även när lutningen står stilla, och det går att prova var för
 *              sig genom `brynGap`.
 *
 * Ett undantag från "andel av huvudbredden": längden multipliceras med det egna
 * ögats rx delat med ögonens medel-rx. Ögonen är avsiktligt OLIKA STORA, och i
 * det fria ansiktet följde brynet sitt eget öga. Utan faktorn hade det inramade
 * ansiktet fått en annan brynlängd än det fria, alltså en omritning i stället
 * för en beskärning.
 *
 * Talen nedan är UPPMÄTTA UR DET FRIA ANSIKTET, det som ägaren skrev redan var
 * korrekt, och inte nyvalda. Omräkningen från den gamla tabellen är
 * dy = (5,6 − gammalt dy) / 81, och vinklarna är oförändrade.
 */

const BRYN_ENHET = HUVUD_BREDD;                       // 81, alltså huvudets bredd
const RX_MEDEL = (OGA.v.rx + OGA.h.rx) / 2;           // 12,8
const MITT = 51;                                      // ansiktets mittlinje i rutan

/** Gemensamma mått. Ett bryn byter höjd och lutning med humöret, inte längd. */
const BRYN_FORM = { langd: 0.2688, tjocklek: 0.120, glugg: 0.2252 };

/**
 * BRYNETS TJOCKLEK PER DETALJNIVÅ.
 *
 * Tjockleken höjdes en gång från 0,0988 till 0,120, och till 0,140 i major,
 * eftersom brynen läste som tunna streck i 24 px och isoleringsprovet föll
 * där. Det var rätt för märket och fel för de stora storlekarna: ägaren såg
 * det direkt live, "är inte ögonbrynen lite tjocka".
 *
 * Båda har rätt, och felet var att tjockleken var EN konstant för alla
 * storlekar. Ett bryn som ska bära bedömningen i 24 px måste vara kraftigare
 * än ett som bara ska se rätt ut i 200 px. Samma logik som resten av
 * nivåsystemet: det som krymper får kompensera.
 *
 * Faktorerna multiplicerar BRYN_FORM.tjocklek, alltså 0,120:
 *
 *   rik    0,823  ->  0,0988, exakt originalets. Används över 56 px, där
 *                    ingenting går förlorat på att brynet är tunnare.
 *   enkel  1,35   ->  0,162. 32 till 56 px.
 *   nal    1,35   ->  0,162. Under 32 px, och där bär brynen ensamma.
 *
 * Ändras något av talen ska isoleringsprovet på enbart brynen köras om i
 * 24 px i gråskala. Det är det provet som avgör om brynen fortfarande bär.
 */
export const BRYN_TJOCKNA = { rik: 0.823, enkel: 1.35, nal: 1.35 };

export const BRYN_LAGE = {
  /* ── De tre bedömningarna ────────────────────────────────────────── */
  clean: { ...BRYN_FORM, dy: [0.0988, 0.1062], vinkel: [-3, -4] },
  minor: { ...BRYN_FORM, dy: [0.0494, 0.1160], vinkel: [9, -9] },
  /* major är enda läget med egen glugg och egen tjocklek. Gluggen är ilskans
   * ANDRA kanal, oberoende av vinkeln: inre ändarna in mot näsroten.
   *
   * 0,185 och inte 0,165, och skälet är gränsen mellan argt och elakt. Vid
   * 0,165 möts brynens inre spetsar nästan över nosryggen, och tillsammans med
   * det mörka bandet emellan bildar de en enda nedåtriktad dolk. Det är den
   * formen som läser hotfullt. Vid 0,185 står spetsarna isär med en ljus glugg
   * kvar, och samma vinkel läser då som rynkad panna i stället för som mask.
   * Skillnaden i läsbarhet i 24 px mellan de två är försumbar, skillnaden i
   * tonläge är inte det. */
  major: { ...BRYN_FORM, glugg: 0.1850, tjocklek: 0.140, dy: [0.0272, 0.0321], vinkel: [21, 19] },

  /* ── Det obedömda ────────────────────────────────────────────────── */
  /* `none` är avspänt och ingenting annat. Vinkeln är NOLL på båda sidor, alltså
   * det enda läget i hela tabellen utan lutning, och höjden ligger mitt emellan
   * clean och vantar. Skälet till att den inte lånar clean minus lutningen är
   * att clean sitter HÖGT, och högt sittande bryn läser som öppet och positivt.
   * En verksamhet som inte är bedömd ska varken beröm eller anmärkning, alltså
   * varken höga eller sänkta bryn. Symmetrin är också medveten: figurens övriga
   * lägen har alltid olika värde per öga, och just avsaknaden av den asymmetrin
   * är det som gör att ansiktet läser som väntande i stället för som menande. */
  none: { ...BRYN_FORM, dy: [0.0850, 0.0850], vinkel: [0, 0] },

  /* ── De sex övriga ───────────────────────────────────────────────── */
  soker: { ...BRYN_FORM, dy: [0.0765, 0.0519], vinkel: [4, 12] },
  hittat: { ...BRYN_FORM, dy: [0.1333, 0.1407], vinkel: [-6, -7] },
  vantar: { ...BRYN_FORM, dy: [0.0568, 0.0543], vinkel: [2, 2] },
  nojd: { ...BRYN_FORM, dy: [0.0914, 0.1086], vinkel: [-7, -10] },
  tom: { ...BRYN_FORM, dy: [0.0963, 0.0938], vinkel: [-16, -15] },
  fyrafyra: { ...BRYN_FORM, dy: [0.1259, 0.0420], vinkel: [-12, 8] },
};

/**
 * AMPLITUDEN. 1 är de uppmätta grundvärdena ovan, alltså det fria ansiktet som
 * det såg ut när ägaren godkände riktningen.
 *
 * Regeln är karaktärsdesignens egen och skälet till att Duo fungerar: rita
 * uttrycket kraftigare än verkligheten, eftersom små storlekar äter nyans. Ett
 * bryn som ser lagom argt ut i 96 px är borta i 24. Valet görs därför i
 * 24-pixelsraden och kontrolleras sedan i 96, aldrig tvärtom.
 *
 * Amplituden rör BARA de tre bedömningarna, och bara två saker: brynvinkeln och
 * munnens bågdjup. Gult är mellanläget och dess mun står helt utanför, se
 * MUNNAR.vagig.ampK, eftersom en gul mun som djupnar lutar mot arg och en som
 * flackar ut lutar mot glad, och båda är fel.
 */
export const AMP = { lugn: 1, vald: 1.5, kraftig: 2 };

/** 4. BRYNET. Avsmalnande stav med runda ändar, tjockast ytterst. */
function bryn(o, lage, i, { amp = 1, gapSkala = 1, tjockna = 1, just = 0 } = {}) {
  const L = lage.langd * BRYN_ENHET * (o.rx / RX_MEDEL);
  const halvT = (lage.tjocklek * BRYN_ENHET * tjockna) / 2;
  const G = lage.glugg * BRYN_ENHET * gapSkala;
  const v = lage.vinkel[i] * amp;
  const cy = o.y - o.ry - (lage.dy[i] * BRYN_ENHET + just);
  const xin = MITT - o.s * (G / 2);            // inre änden, före lutning
  const cx = xin - o.s * (L / 2);              // brynets mittpunkt
  /* u löper -L/2 ytterst till +L/2 innerst. Avsmalningen är linjär. */
  const t = (u) => halvT * (1 - 0.475 * ((u + L / 2) / L));
  const us = [-L / 2, -L / 4, 0, L / 4, L / 2];
  const lokal = [
    ...us.map((u) => [u, -t(u)]),
    [L * 0.6, 0],
    ...us.slice().reverse().map((u) => [u, t(u)]),
    [-L * 0.6, 0],
  ];
  const r = (o.s * v * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r);
  return mjuk(lokal.map(([u, w]) => {
    const x = u * o.s;
    return [cx + (x * c - w * sn), cy + (x * sn + w * c)];
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
const MUN_B = (0.22 * HUVUD_BREDD) / 100;              // 0,1782 av rutan
const KRYMP = MUN_B / BREDD.storre;                    // 0,3874
const MUN_R = RADIE.dagens * KRYMP;
/* Tjockleken skalas inte rakt av. Märkets 21,4 procent av munbredden gällde en
 * mun som var två och en halv gånger så bred, och ett stryk som krymper linjärt
 * försvinner: en linje läses av ögat i absoluta pixlar och inte i andelar.
 * 27 procent av den nya bredden ger tillbaka ungefär samma synliga vikt. */
const MUN_SW = MUN_B * 0.27;
const MUN_CY = 78.5;

/**
 * `ampK` är munnens andel i amplituden, se AMP. Djupet ändras genom att RADIEN
 * krymper och aldrig genom att ändpunkterna flyttas. Flyttar man ändpunkterna
 * blir munnen bredare och FLACKARE i stället för argare, och det är exakt det
 * felet som redan är rättat en gång i ../maskot-mun.mjs.
 *
 * Talen är olika med flit. `ledsen` tål mycket, eftersom sambandet radie till
 * pilhöjd är brant först nära halvcirkeln. `glad` tål lite: samma faktor där
 * hade gjort clean till ett leende som går ut i en halvcirkel, alltså clown i
 * stället för nöjd. `vagig` står på noll, se AMP.
 */
const MUNNAR = {
  glad: { n: 'clean', b: 1.06, r: 1, lut: 2, djup: 2.6, ampK: 0.06 },
  vagig: { n: 'minor', b: 1.0, r: 1, lut: 2.5, djup: 0, ampK: 0 },
  ledsen: { n: 'major', b: 0.98, r: 1, lut: 2, djup: 0, ampK: 0.30 },
  smal: { n: 'minor', b: 0.68, r: 0.8, lut: 3, djup: 0, ampK: 0 },
  finurlig: { n: 'clean', b: 0.9, r: 0.76, lut: 7, djup: 2, ampK: 0 },
  oppen: { n: 'clean', b: 0.92, r: 0.8, lut: 2, djup: 6.5, ampK: 0 },
  rundo: { n: 'clean', b: 0.42, r: 0.5, lut: 0, djup: 3.4, ampK: 0 },
  /* HELT RAK, och det är inte samma sak som `vagig`.
   *
   * ../maskot-mun.mjs RIKTNING ger minor andelen -0,18 med ett uttalat skäl:
   * mellanläget i en tregradig skala ska luta svagt nedåt, annars läser det som
   * frånvaro i stället för som tveksamhet. För det obedömda läget är frånvaro
   * exakt vad vi vill säga, alltså är den svaga nedåtlutningen fel här.
   *
   * Nyckeln `none` finns med flit INTE i RIKTNING. Uppslaget faller då på
   * `?? 0`, alltså pilhöjd noll och en bokstavligen rak mun. Lägger någon in
   * RIKTNING.none i munmodulen slutar den här munnen vara rak, och det är
   * avsiktligt: munnens riktning ska bestämmas på ett ställe för alla figurer. */
  rak: { n: 'none', b: 1.0, r: 1, lut: 2, djup: 0, ampK: 0 },
};

const BAGE = /^M([-\d.]+) ([-\d.]+)A([-\d.]+) [-\d.]+ 0 0 (\d) ([-\d.]+) ([-\d.]+)$/;

/**
 * MUNNENS VARVFLAGGA. Buggen var verklig, den är rättad i källan, och den
 * lokala vändningen som stod här är därför borttagen.
 *
 * Historiken är värd att spara eftersom den säger något om metod. Två
 * figuragenter rapporterade oberoende av varandra att `clean` renderades som
 * en ledsen båge. En numerisk kontroll av samma bana svarade att allt var
 * rätt, och den kontrollen hade fel av rätt utseende. Det som avgjorde saken
 * var att rendera de tre munnarna ensamma och TITTA på bilden.
 *
 * Sensmoral: för geometri är renderingen facit, inte resonemanget. En
 * sweep-flagga går att räkna fel på i huvudet men aldrig att se fel på i en
 * bild. Fixen ligger nu i maskot-mun.mjs, alltså på ett ställe för alla
 * figurer, och den här funktionen skickar bara vidare.
 */
function munD(nyckel, b, lut, r) {
  return munbana(51, MUN_CY, 100, nyckel, b, lut, r);
}

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
  const ned = sw === 0 ? ht : -ht;              // positiv = munnen buktar nedåt
  const h = ned + djup;
  if (h <= 0.05) return '';
  const R = h / 2 + (b * b) / (8 * h);
  /* Samma båge baklänges vänder flaggan, alltså sweep 1 för en djupare
   * nedbuktning på vägen tillbaka. */
  return `${d}A${R.toFixed(2)} ${R.toFixed(2)} 0 0 1 ${x1} ${y1}Z`;
}

/* ══ 3. UTTRYCKEN ══════════════════════════════════════════════════════
 *
 * Nio stycken. Var och en sätter ögonlockens nivå och vinkel, VILKET BRYNLÄGE
 * som gäller, pupillernas läge, huvudets vridning, munnen och kroppens pose.
 *
 * De tre bedömningarna delade tidigare allt utom munnen, av rädsla för att två
 * bärare skulle bli gröt. Den regeln föll med v4: nu när munnen är en femtedel
 * så stor kan den inte bära ensam, och brynen är i stället den tydligaste
 * kanalen som finns. Skillnaden bärs därför av tre saker som pekar åt samma
 * håll: brynen, munnen och klornas höjd. De motsäger aldrig varandra, och det
 * är motsägelsen och inte mångfalden som gör gröt.
 *
 * Uppmätt med `isolera` i 24 px, i gråskala: brynen ensamma skiljer alla tre åt,
 * munnen ensam skiljer alla tre åt. I 16 px skiljer båda ut major men clean mot
 * minor blir marginellt på var för sig, alltså behöver den minsta storleken
 * bägge. Det är därför båda finns kvar och ingen av dem är dekoration.
 */

export const UTTRYCK = {
  clean: 'Inga anmärkningar',
  minor: 'Brister',
  major: 'Brister som kvarstår',
  none: 'Ingen bedömning',
  soker: 'Söker',
  hittat: 'Hittat något',
  vantar: 'Väntar',
  nojd: 'Nöjd',
  tom: 'Tom sida',
  fyrafyra: '404',
};

/* lock:  [nivå vänster, nivå höger], vinkel [v, h]
 * bryn:  NYCKEL in i BRYN_LAGE. Brynens tal bor inte längre här, se 2bb.
 *        Det är hela poängen: en bärare som ligger som lösa tal i en
 *        uttryckstabell går inte att isolera, och utan isolering vet vi inte
 *        om den bär.
 * lockAmp: hur mycket av amplituden som går till ögonlocket. Bara major har
 *        något här: smalare ögon genom LÄGRE lock, aldrig genom vassare form.
 * blick: pupillens förskjutning i rutans egna enheter, samma för båda ögonen
 *        så att de tittar åt samma håll. */
const POS = {
  clean: {
    mun: 'glad', lock: [0, 0], lockv: [0, 0], bryn: 'clean',
    blick: [0.6, -0.8], hr: -10, pose: 'klorHogt',
  },
  minor: {
    mun: 'vagig', lock: [0.24, 0.10], lockv: [7, -4], bryn: 'minor',
    blick: [1.6, 0.4], hr: 13, pose: 'klorUt',
  },
  major: {
    mun: 'ledsen', lock: [0.30, 0.30], lockv: [16, 15], bryn: 'major', lockAmp: 0.25,
    blick: [0.2, 1.0], hr: 5, pose: 'klorNed',
  },
  /* Det obedömda. Allt står i viloläge: locken uppe, brynen raka och lika,
   * munnen rak, huvudet ovridet. Blicken tittar rakt fram och inte åt sidan,
   * eftersom en sidoblick alltid läser som en åsikt om något. Enda draget som
   * inte står stilla är pupillens lilla nedåtförskjutning, och den ligger i
   * pupill() och gäller alla lägen. */
  none: {
    mun: 'rak', lock: [0, 0], lockv: [0, 0], bryn: 'none',
    blick: [1.0, 0], hr: 0, pose: 'lutar',
  },

  soker: {
    mun: 'smal', lock: [0.42, 0.34], lockv: [11, 8], bryn: 'soker',
    blick: [4.2, 1.4], hr: 15, pose: 'nosar',
  },
  hittat: {
    mun: 'oppen', lock: [0, 0], lockv: [0, 0], bryn: 'hittat',
    blick: [0.4, -2.6], hr: -4, pose: 'hojer',
  },
  vantar: {
    mun: 'smal', lock: [0.50, 0.50], lockv: [4, 3], bryn: 'vantar',
    blick: [4.4, 0.2], hr: 11, pose: 'lutar',
  },
  nojd: {
    mun: 'finurlig', lock: [0.44, 0.30], lockv: [-9, -12], bryn: 'nojd',
    blick: [1.4, 0.4], hr: -14, pose: 'sitter',
  },
  tom: {
    mun: 'rundo', lock: [0.20, 0.20], lockv: [-13, -12], bryn: 'tom',
    blick: [1.2, 2.6], hr: 20, pose: 'tittar_ned',
  },
  fyrafyra: {
    mun: 'smal', lock: [0.14, 0.46], lockv: [-8, 10], bryn: 'fyrafyra',
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
  [26.0, 77.0], [33.0, 68.5], [43.5, 63.0], [56.0, 60.4], [68.0, 60.2], [80.0, 63.4],
  [88.0, 52.0], [80.0, 40.0], [56.0, 37.0], [32.0, 41.0], [22.0, 56.0],
], 0.9);

const UNDER = mjuk([
  [32.5, 95.5], [42.5, 100.2], [54.0, 101.6], [66.0, 99.2], [79.0, 92.5],
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
    /* N och inte råa wa och wb. Halvbredderna räknas fram, alltså kom
     * 5.8500000000000005 ut i banan: sjutton tecken för en halvpixel som ingen
     * ser. Varenda koordinat i varenda variant går genom P eller N. */
    `A${N(wb)} ${N(wb)} 0 0 0 ${P(C2)}` +
    `C${P(sub(C2, mul(ubc, k2)))} ${P(add(B2, mul(um, k2)))} ${P(B2)}` +
    `C${P(sub(B2, mul(um, k1)))} ${P(add(A2, mul(uab, k1)))} ${P(A2)}` +
    `A${N(wa)} ${N(wa)} 0 0 0 ${P(A1)}Z`
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
    hoger: { a: [70, 66], b: [84, 56], c: [89, 42], v: -74, k: 11 },
    vanster: { a: [43, 70], b: [35, 80], c: [33, 93], v: 99, k: 3 },
    ben: [[46, 94, 44, 104], [66, 94, 70, 104]],
    fot: [[40, 108, -7], [74, 109, 6]],
    lut: 0, kropp: '',
  },
  klorUt: {
    hoger: { a: [70, 70], b: [83, 67], c: [90, 60], v: -38, k: 10 },
    vanster: { a: [43, 71], b: [34, 79], c: [30, 89], v: 78, k: 3 },
    ben: [[46, 94, 42, 104], [66, 94, 71, 104]],
    fot: [[38, 108, -9], [75, 109, 9]],
    lut: 2, kropp: '',
  },
  klorNed: {
    hoger: { a: [70, 74], b: [79, 85], c: [79, 97], v: 86, k: 2 },
    vanster: { a: [43, 73], b: [35, 84], c: [34, 96], v: 94, k: 2 },
    ben: [[46, 96, 43, 105], [66, 96, 70, 105]],
    fot: [[40, 109, -5], [73, 110, 5]],
    lut: -6, kropp: 'translate(60 108)scale(1.04 0.94)translate(-60 -108)',
  },
  hojer: {
    hoger: { a: [70, 65], b: [84, 53], c: [88, 37], v: -80, k: 12 },
    vanster: { a: [43, 69], b: [35, 79], c: [33, 92], v: 99, k: 3 },
    ben: [[46, 94, 44, 104], [66, 94, 70, 104]],
    fot: [[40, 108, -7], [74, 109, 6]],
    lut: 0, kropp: 'translate(0 -3)',
  },
  nosar: {
    hoger: { a: [70, 69], b: [80, 81], c: [84, 95], v: 62, k: 9 },
    vanster: { a: [43, 70], b: [35, 81], c: [34, 94], v: 88, k: 3 },
    ben: [[46, 94, 42, 104], [66, 94, 71, 104]],
    fot: [[38, 108, -7], [75, 109, 6]],
    lut: -7, kropp: '',
  },
  lutar: {
    hoger: { a: [70, 67], b: [82, 61], c: [88, 52], v: -104, k: 9 },
    vanster: { a: [43, 69], b: [35, 79], c: [33, 92], v: 99, k: 3 },
    ben: [[46, 94, 45, 104], [66, 94, 69, 104]],
    fot: [[41, 108, -7], [73, 109, 6]],
    lut: 0, kropp: '',
  },
  sitter: {
    hoger: { a: [70, 69], b: [80, 78], c: [83, 90], v: 68, k: 3 },
    vanster: { a: [43, 70], b: [34, 79], c: [31, 90], v: 106, k: 3 },
    ben: [[46, 92, 40, 102], [66, 92, 74, 102]],
    fot: [[36, 106, -7], [78, 107, 6]],
    lut: 0, kropp: 'translate(60 108)scale(1.04 0.94)translate(-60 -108)',
  },
  tittar_ned: {
    hoger: { a: [70, 69], b: [80, 80], c: [84, 92], v: 72, k: 4 },
    vanster: { a: [43, 70], b: [34, 80], c: [31, 92], v: 106, k: 3 },
    ben: [[46, 94, 43, 104], [66, 94, 70, 104]],
    fot: [[39, 108, -7], [74, 109, 6]],
    lut: -2, kropp: '',
  },
  graver: {
    hoger: { a: [70, 69], b: [84, 77], c: [90, 91], v: 44, k: 11 },
    vanster: { a: [43, 70], b: [35, 82], c: [34, 95], v: 90, k: 3 },
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
  /* Armarna svänger FRAM och TILLBAKA, inte ut åt sidorna. Basen ligger tätt
   * intill kroppen och utslaget är litet: en figur vars armar går rakt ut i
   * halva rutorna läser som att den flaxar, inte som att den går. */
  const armH = [rund(84 + 7 * Math.cos(t + Math.PI)), rund(82 + 10 * Math.sin(t + Math.PI))];
  const armV = [rund(30 + 6 * Math.cos(t)), rund(86 + 9 * Math.sin(t))];
  const sk = KROPP_SKALA[i];
  return {
    hoger: {
      a: [70, 68],
      b: [rund((70 + armH[0]) / 2 + 3), rund((68 + armH[1]) / 2)],
      c: armH, v: rund(50 - 34 * Math.cos(t + Math.PI)), k: 5,
    },
    vanster: {
      a: [43, 69],
      b: [rund((43 + armV[0]) / 2 - 3), rund((69 + armV[1]) / 2)],
      c: armV, v: rund(96 - 26 * Math.cos(t)), k: 5,
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
      /* Gången lånar clean-brynet och flyttar det per ruta. `brynJust` är i
       * rutans enheter och positivt betyder HÖGRE, alltså omvänt tecken mot den
       * gamla GANG_BRYN-tabellen som räknade nedåt. */
      bryn: 'clean',
      brynJust: -GANG_BRYN[i],
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
/**
 * ── DET ENKLA LÄGET ÄR SAMMA ANSIKTE, INTE ETT ANNAT ──────────────────
 *
 * Ägaren: "den har redan korrekt ansikte när den inte är förenklad".
 *
 * Han har rätt, och den gamla koden gjorde precis fel sak: det enkla läget var
 * en EGEN ritning där brynen och ögonlocken var borttagna helt. Alltså offrade
 * förenklingen exakt det drag som bär bedömningen, och kvar blev två runda ögon
 * och en munbåge som såg likadana ut i alla tre lägena. Märket är en BESKÄRNING
 * av ansiktet, inte en omritning av det, precis som Duolingos appikon.
 *
 * Nu är det EN kodväg med samma element i samma ordning. Det som skiljer är tre
 * saker, var och en med sitt skäl, och offerordningen är bevisad storlek för
 * storlek och inte antagen:
 *
 *   1  ÖGONVITANS FORM.  Rik ritar en svagt oregelbunden blobb, enkel ritar
 *      ellipsen den moduleras kring. Moduleringen är 5,5 procent av radien,
 *      alltså under en halv pixel redan i 40 px, och kostar en hel path.
 *      SAMMA storlek och samma läge, bara jämnare kant.
 *   2  MUNHÅLAN.  Den mörka ytan innanför en öppen mun slammar ihop med
 *      strykets runda ändar under 40 px och blir en klump. Bågen står kvar.
 *   3  ÖRONTIPPARNA, och bara under 64 px. Skälet är inte att de är för små,
 *      de är 2,3 px höga även i 24 px. Skälet är att de är LJUSA MÄRKEN PÅ DET
 *      MÖRKA BANDET, alltså exakt samma visuella klass som brynet, och de
 *      sitter rakt ovanför det. Under 64 px smälter de två ihop till två ljusa
 *      streck per sida och brynets lutning blir tvetydig. Draget som bär
 *      bedömningen vinner över draget som bär arten.
 *   4  OPTISK KOMPENSATION.  Munnen 18 procent tjockare, brynen 35 procent.
 *      Det är INTE en förenkling utan dess motsats: en linje läses i absoluta
 *      pixlar och inte i andelar, alltså måste den bli grövre när ytan krymper
 *      för att behålla samma synliga vikt. Brynen offras aldrig och blir
 *      tvärtom kraftigare, eftersom det är de som ska bära när allt annat är
 *      borta.
 *
 * Allt annat är identiskt: ögonens läge och storlek, brynens vinkel höjd längd
 * och glugg, ögonlockens nivå och vinkel, pupillerna, munnens bredd och radie.
 */
function ansikte(p, T, enkel, o = {}) {
  const { amp = 1, brynGap = 1, size = 160 } = o;
  const oron = !enkel || size >= 64;
  const idB = nyttId();
  const par = [['v', 0], ['h', 1]];
  const lage = BRYN_LAGE[p.bryn] || BRYN_LAGE.clean;

  /* Ögonvitan. Ett uttryck, två utseenden, samma mått. */
  const vitaEl = (k, fyll) => {
    const g = OGA[k];
    return enkel
      ? `<ellipse cx="${N(g.x)}" cy="${N(g.y)}" rx="${N(g.rx)}" ry="${N(g.ry)}"` +
        ` transform="rotate(${N(g.vrid)} ${N(g.x)} ${N(g.y)})"${fyll}/>`
      : `<path d="${ogonvita(g)}"${fyll}/>`;
  };

  const pupiller = par.map(([k]) => pupill(OGA[k], p.blick, T, enkel)).join('');
  /* Ögonbeskärningen ritas BARA när den beskär något, se pupillenRyms. I det
   * enkla läget, alltså i bedömningsmärket, ryms pupillen i ögonvitan för alla
   * fyra bedömningarna, och då är en clipPath med två ellipser i bara 230
   * tecken utan verkan per märke. Med 8 511 märken på Stockholms hubb är det
   * nästan två megabyte för ingenting. */
  const behoverOgonklipp = !enkel || !par.every(([k]) => pupillenRyms(OGA[k], p.blick));
  const idO = behoverOgonklipp ? nyttId() : null;

  /* Ögonlocket. `lockAmp` finns bara på major: smalare ögon genom LÄGRE lock.
   * Taket 0,46 är hårt. Ett lock som går längre stänger ögat, och ett stängt
   * öga läser som sovande och inte som argt. */
  /* Klassen `lock-hoger` är en KROK FÖR SAJTEN och inte en stilfråga här.
   * FaceMark blinkar genom att skala just det locket i höjd, och blinkningen
   * är en av sajtens tre rörelser. Ett lock som faller läser som en blinkning,
   * medan ett öga som skalas i höjd läser som en bild som klämts ihop.
   *
   * Locket ritas därför ALLTID, även i clean där det är som minst, annars
   * finns ingenting att animera när ögat är öppet. */
  const locken = par.map(([k, i]) => {
    const niva = Math.min(p.lock[i] * (1 + (amp - 1) * (p.lockAmp || 0)), 0.46);
    const g = OGA[k];
    /* PLATSHÅLLARLOCKET, och varför det inte är ett vanligt lock på nivå noll.
     *
     * Det högra locket måste finnas som element även när ögat är helt öppet,
     * annars har sajten ingenting att blinka med. Första försöket satte i
     * stället nivån till 0,001 och lät lock() rita som vanligt. Det var
     * osynligt i teorin och synligt i bild: lockets ellips är 1,4 gånger ögats
     * höjd, alltså 39 enheter, och den sträcker sig från ögats överkant upp
     * till y −4,7. Där ligger den HÖGRA ÖRONSPETSEN, och eftersom locket har
     * bandets färg försvann örat. Draget som bär arten dog för en krok.
     *
     * Platshållaren har därför samma bredd som ett riktigt lock men bara åtta
     * tiondels enhets höjd, alltså slutar den femton enheter under öronspetsen.
     * Sajten skalar den i höjd från underkanten, och en ellips som skalas i höjd
     * är fortfarande en ellips med samma bredd och samma underkant, alltså exakt
     * vad ett fallande lock är.
     *
     * Höjden är mätt och inte vald. Mellan brynets underkant och ögonvitans
     * överkant finns ett dött fält på två enheter där bara bandet ligger, alltså
     * där en form i bandets egen färg inte kan synas. En platshållare som RÖR
     * någon av de två kanterna ger en dubbeltäckt kantutjämning och därmed en
     * hårfin mörkare linje: mätt i 96 px blev det 65 bildpunkter med upp till
     * 43 av 255 i avvikelse. Med 0,8 enheters höjd mitt i fältet är det 47
     * bildpunkter, varav 44 avviker med exakt 1 av 255, alltså avrundning i
     * sammansättningen av samma färg mot sig själv. De tre återstående ligger på
     * bandets egen kantutjämning. I 16 px är största avvikelsen 2 av 255. */
    if (i === 1 && niva <= 0) {
      return `<ellipse class="lock-hoger" cx="${N(g.x)}" cy="${N(g.y - g.ry - 1)}"` +
        ` rx="${N(g.rx * 1.95)}" ry="0.4"/>`;
    }
    const kod = lock(g, niva, p.lockv[i]);
    if (i !== 1 || !kod) return kod;
    return kod.replace(/^<(path|ellipse|rect|g)\b/, '<$1 class="lock-hoger"');
  }).join('');

  const brynen = par.map(([k, i]) => `<path d="${bryn(OGA[k], lage, i, {
    amp, gapSkala: brynGap, tjockna: enkel ? BRYN_TJOCKNA.enkel : BRYN_TJOCKNA.rik,
    just: p.brynJust || 0,
  })}"/>`).join('');

  const m = MUNNAR[p.mun] || MUNNAR.glad;
  /* Djupare båge genom MINDRE RADIE, aldrig genom flyttade ändpunkter. */
  const rAmp = 1 / (1 + (amp - 1) * (m.ampK || 0));
  const d = munD(m.n, MUN_B * m.b, m.lut, MUN_R * m.r * rAmp);
  const sw = MUN_SW * 100 * (enkel ? 1.18 : 1);
  const hal = enkel ? '' : kavitet(d, m.djup);
  const munnen =
    (hal ? `<path d="${hal}" fill="${T.djup}"/>` : '') +
    `<path class="mun" pathLength="1" d="${d}" fill="none" stroke="${T.mork}" stroke-width="${N(sw)}" stroke-linecap="round"/>`;

  return (
    `<defs>` +
    `<clipPath id="${idB}"><path d="${BAND_V}"/><path d="${BAND_H}"/></clipPath>` +
    (idO ? `<clipPath id="${idO}">` + par.map(([k]) => vitaEl(k, '')).join('') + `</clipPath>` : '') +
    `</defs>` +
    `<g fill="${T.mork}"><path d="${BAND_V}"/><path d="${BAND_H}"/><path d="${NOS}"/></g>` +
    (oron ? `<g fill="${T.ljus}">${ORON}</g>` : '') +
    par.map(([k]) => vitaEl(k, ' fill="#fff"')).join('') +
    (idO ? `<g clip-path="url(#${idO})">${pupiller}</g>` : pupiller) +
    `<g clip-path="url(#${idB})"><g fill="${T.mork}">${locken}</g><g fill="${T.ljus}">${brynen}</g></g>` +
    munnen
  );
}

/** Huvudet med ansikte, beskuret mot huvudkonturen. */
function huvud(p, T, enkel, siluett, o) {
  const id = nyttId();
  if (siluett) {
    return `<path d="${HUVUD}" fill="#111"/>`;
  }
  return (
    `<defs><clipPath id="${id}"><path d="${HUVUD}"/></clipPath></defs>` +
    `<path d="${HUVUD}" fill="${T.ljus}"/>` +
    `<g clip-path="url(#${id})">${ansikte(p, T, enkel, o)}</g>`
  );
}

/* ══ 5b. NÅLNIVÅN ══════════════════════════════════════════════════════
 *
 * `detalj: 'nal'`, en tredje detaljnivå under `enkel`.
 *
 * ── Varför den finns ──────────────────────────────────────────────────
 * Kartnålen serialiseras till en data-URI PER NÅL, alltså betalar sidan hela
 * märkets teckenlängd en gång för varje verksamhet, dessutom procentkodad. Det
 * enkla märket är knappt 6 800 tecken. Stockholms hubb har 8 511 rader. Det är
 * femtiosju megabyte innan någon ens sett en nål, och det är exakt det problem
 * spriten en gång byggdes för att lösa.
 *
 * ── Vad nivån har ETT jobb att göra ───────────────────────────────────
 * Att de FYRA LÄGENA går att skilja åt. Inte att figuren ska vara vacker, inte
 * att arten ska synas, inte att det ska vara samma antal former. Under 24 px
 * finns det inte plats för mer än en avläsning, och den avläsningen är
 * bedömningen. Allt som inte tjänar den är borta.
 *
 * ── Vad som är kvar, och varför precis det ────────────────────────────
 *   PLATTAN   bär kulören, alltså den snabbaste kanalen som finns i färg. I
 *             gråskala bär den ingenting, och det är därför den inte räcker.
 *   BANDEN    är kvar av ett enda skäl: brynet är LJUST och huvudet är LJUST,
 *             alltså finns brynet bara där det ligger på något mörkt. Utan
 *             banden finns inga bryn. De ritas som piller och inte som sin
 *             riktiga profil: profilen kostar 1 260 tecken, pillret 114, och
 *             under 24 px är bandet en lodrät stapel i båda fallen.
 *   ÖGONEN    ögonvita och pupill, alltså blicken. Två ljusa fält i det mörka
 *             som gör att stapeln läser som ett ansikte och inte som ett streck.
 *   BRYNEN    bär bedömningen. De offras aldrig, det är hela poängen med
 *             figuren, och de är dessutom det billigaste draget som finns.
 *   MUNNEN    bär bedömningen en andra gång. Mätt i ../maskot-mun.mjs: i 16 px
 *             skiljer brynen ensamma ut major men inte clean från minor, alltså
 *             behövs båda kanalerna och ingen av dem är dekoration.
 *
 * Offrat: huvudets riktiga kontur, öronen, öronspetsarna, nosen, ögonlocken,
 * bandens profil, ögonvitans lutning, munhålan, kroppen.
 *
 * ── Ingen enda clipPath, och det är strukturellt och inte tur ─────────
 * Tre beskärningar försvann, var och en genom att det som beskars togs bort
 * eller genom att beskärningen bevisligen inte tar bort något:
 *
 *   HUVUDET   banden går ut ovanför hjässan i det riktiga ansiktet och måste
 *             beskäras. Här börjar de i stället under hjässan, se NAL_TOPP.
 *   BANDET    beskar ögonlocken, och ögonlocken finns inte här. Brynen beskars
 *             också, men det var alltid verkningslöst: brynet är T.ljus och det
 *             som ligger under bandet är huvudet, som ÄR T.ljus. Ett bryn som
 *             spiller ut ur bandet spiller ut i sin egen färg.
 *   ÖGONVITAN beskar pupillen. För de fyra bedömningarna ryms pupillen med
 *             0,83 enheters marginal, se pupillenRyms.
 *
 * Det som ändå måste beskäras, alltså det som går utanför rutan, sköts av
 * svg-elementets egen viewport. Den beskär gratis och behöver inget id.
 */

/* Huvudrutans mått TAS UR huvudets egen punktlista och skrivs inte av. Ändras
 * figuren följer nålen med. Hörnradien är mätt: vid 26 ligger den rundade
 * rutans kant inom en enhet från den riktiga konturen över hela tinningen. */
const NAL_RUTA = {
  x: Math.min(...HUVUD_PUNKTER.map((q) => q[0])),
  y: Math.min(...HUVUD_PUNKTER.map((q) => q[1])),
  x2: Math.max(...HUVUD_PUNKTER.map((q) => q[0])),
  y2: Math.max(...HUVUD_PUNKTER.map((q) => q[1])),
  horn: 26,
};

/* Bandets nedre ände tas ur profilen, alltså samma tal som det riktiga bandet.
 *
 * ÖVERKANTEN RÄKNAS FRAM och skrivs inte av, och det är den mest bärande siffran
 * i hela nivån. Det riktiga bandet slutar långt ovanför hjässan och lever på att
 * huvudet beskär det, alltså blir det mörka fältet OVANFÖR ögat högt, och det är
 * i det fältet brynet bor. Sätts överkanten för lågt sticker brynets övre halva
 * upp i det ljusa huvudet, alltså i sin egen färg, alltså syns bara halva
 * brynet. Ett halvt bryn bär inte en bedömning.
 *
 * `nalToppen` letar därför upp den HÖGSTA överkant där båda bandpillren
 * fortfarande ligger helt innanför den rundade huvudrutan, med en halv enhets
 * marginal. Utan beskärning är det villkoret hårt: en mörk fläck utanför huvudet
 * läser som ett tryckfel och inte som ett arttecken. */
const NAL_BAND_NED = Math.max(...BAND_PROFIL.map(([, dy]) => dy));

/** Den rundade huvudrutans vänstra och högra kant vid en given höjd. */
function nalKant(y) {
  const R = NAL_RUTA;
  const d = y < R.y + R.horn ? R.y + R.horn - y : y > R.y2 - R.horn ? y - (R.y2 - R.horn) : 0;
  const in_ = d >= R.horn ? R.horn : R.horn - Math.sqrt(R.horn * R.horn - d * d);
  return [R.x + in_, R.x2 - in_];
}

const NAL_TOPP = (() => {
  const MARGINAL = 0.5;
  const ryms = (topp) => [OGA.v, OGA.h].every((o) => {
    const W = o.rx + o.rim;
    const mitt = topp + W;                       // övre halvcirkelns centrum
    for (let y = topp; y <= mitt; y += 0.5) {
      const h = Math.sqrt(Math.max(0, W * W - (mitt - y) * (mitt - y)));
      const [v, hg] = nalKant(y);
      if (o.x - h < v + MARGINAL || o.x + h > hg - MARGINAL) return false;
    }
    return true;
  });
  for (let t = 6; t <= 40; t += 0.5) if (ryms(t)) return t;
  return 24;
})();

/* Optisk kompensation, samma princip som i det enkla läget och av samma skäl:
 * ett drag läses i absoluta pixlar och inte i andelar. Talen är högre här
 * eftersom ytan är mindre. Brynets ellips tappar dessutom tjocklek mot ändarna
 * där den riktiga staven är som tjockast, alltså kompenserar 1,35 två saker. */
const NAL_BRYN_TJOCKNA = BRYN_TJOCKNA.nal;
const NAL_MUN_TJOCKNA = 1.35;

/** Bandet som piller. Bredden är ögats egen ram, alltså samma W som band(). */
function nalBand(o) {
  const W = o.rx + o.rim;
  return `<rect x="${N(o.x - W)}" y="${NAL_TOPP}" width="${N(2 * W)}"` +
    ` height="${N(o.y + NAL_BAND_NED - NAL_TOPP)}" rx="${N(W)}"/>`;
}

/**
 * Brynet som ellips.
 *
 * Läget, längden, gluggen och vinkeln kommer ur BRYN_LAGE precis som i det
 * riktiga brynet, alltså är nålens bryn samma mätta system och inte en ny
 * uppskattning. Bara formen är enklare: en ellips i stället för en avsmalnande
 * stav med runda ändar, 84 tecken i stället för 420.
 *
 * rx är L·0,6, alltså exakt de yttersta punkterna i den riktiga stavens
 * punktlista. Ellipsen har därför samma längd som staven och inte en egen.
 */
function nalBryn(o, lage, i, amp) {
  const L = lage.langd * BRYN_ENHET * (o.rx / RX_MEDEL);
  const G = lage.glugg * BRYN_ENHET;
  const cy = o.y - o.ry - lage.dy[i] * BRYN_ENHET;
  const cx = MITT - o.s * (G / 2) - o.s * (L / 2);
  const v = N(o.s * lage.vinkel[i] * amp);
  const rot = v ? ` transform="rotate(${v} ${N(cx)} ${N(cy)})"` : '';
  return `<ellipse cx="${N(cx)}" cy="${N(cy)}" rx="${N(L * 0.6)}"` +
    ` ry="${N((lage.tjocklek * BRYN_ENHET * NAL_BRYN_TJOCKNA) / 2)}"${rot}/>`;
}

function nalMarke(p, T, plattfarg, size, kl, a11y, ramskala, amp) {
  const lage = BRYN_LAGE[p.bryn] || BRYN_LAGE.clean;
  const par = [['v', 0], ['h', 1]];
  const m = MUNNAR[p.mun] || MUNNAR.glad;
  const rAmp = 1 / (1 + (amp - 1) * (m.ampK || 0));
  const d = munD(m.n, MUN_B * m.b, m.lut, MUN_R * m.r * rAmp);
  const R = NAL_RUTA;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100"${kl}${a11y}>` +
    `<rect width="100" height="100" fill="${plattfarg}"/>` +
    `<g transform="translate(50 50)scale(${ramskala})translate(-51 -55)">` +
    `<rect x="${N(R.x)}" y="${N(R.y)}" width="${N(R.x2 - R.x)}" height="${N(R.y2 - R.y)}"` +
      ` rx="${R.horn}" fill="${T.ljus}"/>` +
    `<g fill="${T.mork}">${par.map(([k]) => nalBand(OGA[k])).join('')}</g>` +
    `<g fill="#fff">${par.map(([k, i]) => {
      const g = OGA[k];
      /* ÖGONLOCKET UTAN ÖGONLOCK, och det är nivåns billigaste drag.
       *
       * Locket är i figuren en ellips i bandets färg som skär in uppifrån, och
       * den är avsiktligt mycket bredare än ögat, alltså MÅSTE den beskäras mot
       * bandet. Här finns ingen beskärning, alltså kan den inte ritas.
       *
       * Men det locket gör är att flytta ögonvitans ÖVERKANT nedåt, och det går
       * att göra i ögonvitan själv: samma underkant, ny överkant. En ellips som
       * kortas uppifrån har exakt de två måtten. Räknat ur lock(): underkanten
       * ligger på y+ry och överkanten på y-ry+2·ry·nivå.
       *
       * Vinsten är att minor och major behåller sin tredje kanal ned i 16 px
       * utan en enda extra form och utan en enda extra beskärning. Priset är
       * lockets lutning, alltså lockv, som inte går att uttrycka i ögats egen
       * ellips. I 16 px är ett locks lutning under en tiondels pixel.
       *
       * Lutningen på ögat självt är också borta. Ögat är 5 respektive 6 grader
       * vridet i figuren, och en ellips som är 95 procent så hög som den är bred
       * visar inte 5 graders vridning ens i 96 px. Transformen kostar 35 tecken
       * per öga och skulle dessutom slåss med kortningen ovan. */
      const niva = Math.min(p.lock[i] * (1 + (amp - 1) * (p.lockAmp || 0)), 0.46);
      return `<ellipse cx="${N(g.x)}" cy="${N(g.y + g.ry * niva)}" rx="${N(g.rx)}"` +
        ` ry="${N(g.ry * (1 - niva))}"/>`;
    }).join('')}</g>` +
    par.map(([k]) => pupill(OGA[k], p.blick, T, true)).join('') +
    `<g fill="${T.ljus}">${par.map(([k, i]) => nalBryn(OGA[k], lage, i, amp)).join('')}</g>` +
    `<path class="mun" pathLength="1" d="${d}" fill="none" stroke="${T.mork}"` +
      ` stroke-width="${N(MUN_SW * 100 * NAL_MUN_TJOCKNA)}" stroke-linecap="round"/>` +
    `</g></svg>`
  );
}

/**
 * ISOLERINGEN, provet som avgör om en bärare bär.
 *
 * `isolera` låser ALLT utom en enda uttrycksbärare till clean-läget. Med 'bryn'
 * är mun, ögonlock, pupiller, blick och huvudlutning identiska i alla tre
 * bedömningarna och bara brynen följer uttrycket. Med 'mun' tvärtom.
 *
 * Skälet att det är värt en egen parameter: så länge tre kanaler ändras
 * samtidigt går det inte att veta vilken som gör arbetet, och en kanal som inte
 * gör något kostar ändå plats och risk. Går de tre bedömningarna inte att
 * skilja åt med 'bryn' är brynsystemet inte färdigt, och det är ett svar värt
 * lika mycket som ett godkänt.
 */
function isoleraPos(p, vad) {
  const bas = POS.clean;
  if (vad === 'bryn') return { ...bas, bryn: p.bryn, brynJust: p.brynJust };
  if (vad === 'mun') return { ...bas, mun: p.mun };
  return p;
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
 * @param {string}  detalj   'rik' ritar ögonvitans modulering och munhålan.
 *                           'enkel' är SAMMA ansikte med de två offrade och med
 *                           grövre mun och bryn. 'nal' är den tredje nivån, för
 *                           kartnålar och under 24 px: platta, band, ögon, bryn
 *                           och mun, ingenting annat och ingen clipPath. Se 5b.
 *                           Utelämnad väljer 'enkel' i inramat läge, 'rik'
 *                           annars. 'nal' finns bara inramat och faller tillbaka
 *                           på 'enkel' i det fria läget, där det inte finns
 *                           någon nål att vara liten i.
 * @param {number}  platta   0..4, märkesplattans mättnad. Se PLATTA_TONER.
 *                           Bara inramat läge.
 * @param {string}  isolera  null | 'bryn' | 'mun'. Låser allt utom en bärare
 *                           till clean, se isoleraPos.
 * @param {number}  amp      amplitud för bedömningarnas bryn och mun. Se AMP.
 * @param {number}  brynGap  faktor på avståndet mellan brynens inre ändar.
 *                           Under 1 är närmare varandra, alltså argare.
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
  platta = PLATTA_VALD,
  isolera = null,
  amp = AMP.vald,
  brynGap = 1,
} = {}) {
  const g = steg === null || steg === undefined ? null : gangRuta(((steg % 8) + 8) % 8);
  let p = g ? { ...POS.clean, ...g.ansikte } : (POS[uttryck] || POS.clean);
  if (isolera && !g) p = isoleraPos(p, isolera);
  if (blink) {
    const niva = blink === 2 ? 1 : 0.58;
    p = { ...p, lock: [niva, niva], lockv: blink === 2 ? [0, 0] : p.lockv };
  }
  /* Amplituden rör bara de tre bedömningarna. De sex övriga uttrycken är inte
   * en skala från nöjd till arg och har ingenting att förstärkas åt. */
  const bedomning = uttryck === 'clean' || uttryck === 'minor' || uttryck === 'major';
  const o = { amp: g || !bedomning ? 1 : amp, brynGap, size };
  const T = siluett
    ? { bas: '#111', mork: '#111', ljus: '#111', skugga: '#111', djup: '#111' }
    : toner(ton);
  const kl = klass ? ` class="${klass}"` : '';
  const a11y = ' role="img" aria-label="Prikkos grävling"';
  const niva = detalj ?? (inramat ? 'enkel' : 'rik');
  /* 'nal' ritas av nalMarke och når aldrig ansikte(). Kommer den ändå hit, alltså
   * i det fria läget, är den det enkla ansiktet: en figur med kropp och lemmar
   * har inget att vinna på en förenkling som är gjord för 16 px. */
  const enkel = niva === 'enkel' || niva === 'nal';

  /* INRAMAT LÄGE. Ansiktet beskuret så att dragen går kant i kant. Ramen sätts
   * centralt av byggskriptet och ritas alltså inte här.
   *
   * Huvudets fyllning är den ljusa valören och PLATTAN är något mättare, så att
   * huvudets kontur syns. Tidigare hade de två exakt samma färg, alltså fanns
   * ingen kant alls och märket läste som två mörka band som svävade fritt.
   * Steget sätts med `platta`, se PLATTA_TONER. */
  if (inramat) {
    const RAMSKALA = 1.20;
    if (siluett) {
      /* Det enfärgade enpathsläget, alltså faviconen: bara arttecknet och
       * munnen står kvar, i en färg, på genomskinlig botten. */
      const m = MUNNAR[p.mun] || MUNNAR.glad;
      const d = munD(m.n, MUN_B * m.b, m.lut, MUN_R * m.r);
      return (
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100"${kl}${a11y}>` +
        `<g transform="translate(50 50)scale(${RAMSKALA})translate(-51 -55)">` +
        `<g fill="#111"><path d="${BAND_V}"/><path d="${BAND_H}"/><path d="${NOS}"/></g>` +
        `<path d="${d}" fill="none" stroke="#111" stroke-width="${N(MUN_SW * 118)}" stroke-linecap="round"/>` +
        `</g></svg>`
      );
    }
    const steg = Math.max(0, Math.min(4, Math.round(platta)));
    const plattfarg = (PLATTA_TONER[ton] || PLATTA_TONER.blue)[steg];
    if (niva === 'nal') return nalMarke(p, T, plattfarg, size, kl, a11y, RAMSKALA, o.amp);
    const id = nyttId();
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100"${kl}${a11y}>` +
      `<rect width="100" height="100" fill="${plattfarg}"/>` +
      `<defs><clipPath id="${id}"><path d="${HUVUD}"/></clipPath></defs>` +
      `<g transform="translate(50 50)scale(${RAMSKALA})translate(-51 -55)">` +
      `<path d="${HUVUD}" fill="${T.ljus}"/>` +
      `<g clip-path="url(#${id})">${ansikte(p, T, enkel, o)}</g></g></svg>`
    );
  }

  /* FRITT LÄGE. */
  const idK = nyttId();
  const q = g || POSER[p.pose] || POSER.klorHogt;
  const hdy = g ? g.hdy : 0;

  /* VARVRIKTNINGEN. Arm och tass, ben och fot, ritades tidigare som delbanor i
   * EN path-d. Tassens polära punktlista löper motsols och lemmens medsols,
   * alltså subtraherade de varandra i överlappet och det slog ett vitt hål rakt
   * genom handleden. Felet syns bara där två delbanor korsas, alltså inte i
   * konturprovet, och det är precis den sorten som överlever fyra granskningar.
   *
   * Botemedlet är strukturellt: varje form är ett EGET element. Två element kan
   * inte subtrahera varandra oavsett hur punktlistorna vänds. */
  const bit = (d) => `<path d="${d}" fill="${T.mork}"/>`;
  const arm = (o, w) => bit(lem(o.a, o.b, o.c, w, w * 0.78)) + bit(tass(o.c, o.v, 9, o.k ?? 10));
  const benTass = q.ben
    .map(([x1, y1, x2, y2]) => bit(lem([x1, y1], [(x1 + x2) / 2, (y1 + y2) / 2 + 1], [x2, y2], 8, 7)))
    .join('');
  const fotter = q.fot.map(([x, y, v]) => bit(fot([x, y], v))).join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 120 120"${kl}${a11y}>` +
    `<defs><clipPath id="${idK}"><path d="${KROPP}"/></clipPath></defs>` +
    `<g transform="${q.kropp || ''}rotate(${q.lut} 60 108)">` +
    (siluett ? '' : `<path d="${SKUGGA}" fill="${T.skugga}"/>`) +
    benTass + fotter +
    arm(q.vanster, 7.5) +
    `<path d="${KROPP}" fill="${T.bas}"/>` +
    (siluett ? '' : `<g clip-path="url(#${idK})"><path d="${RYGG}" fill="${T.ljus}"/><path d="${UNDER}" fill="${T.mork}"/></g>`) +
    arm(q.hoger, 8) +
    `<g transform="translate(57 ${34 + hdy})rotate(${p.hr})scale(0.62)translate(-51 -52)">` +
    huvud(p, T, enkel, siluett, o) +
    `</g></g></svg>`
  );
}

export const META = {
  namn: 'Prikko, grävlingen',
  koncept:
    'En grävling mitt i ett skrap, där artens två lodräta band inte ligger bredvid ögonen utan ÄR ögonen: ögonvitan är urskuren ur bandet, och hela blicken lever inuti arttecknet.',
  former: 26,
  farger: 6,
  egenhet:
    'Bandet och ögat är samma form. Ögat kan bokstavligen inte lämna arttecknet, för hela ögonsystemet är beskuret mot bandet, och de ljusa brynen ligger fritt inne i det mörka.',
  svaghet:
    'Ögonen tar så mycket plats att munnen blivit en accent. I 16 px skiljer brynen ensamma ut major men inte clean från minor, alltså behöver de två minsta storlekarna både brynen och munnen för att bära hela skalan.',
  raka: 0,
};
