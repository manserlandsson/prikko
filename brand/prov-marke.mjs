/**
 * PROVARK: munnen som ensam bärare, och brynens tonläge.
 *
 * Kör:  node brand/prov-brynvinkel.mjs
 * Skriver: brand/_prov-marke.html
 *
 * ── Arbetsdelningen arket prövar ──────────────────────────────────────────
 *
 * Ägaren har satt den: "munnen ska såklart skilja på alla". Alltså bär MUNNEN
 * bedömningen och BRYNEN bär tonen. Brynen säger om figuren är bekymrad eller
 * lugn, inte vilket besked det är. Kravet att brynen ensamma skulle skilja de
 * tre bedömningarna åt är därmed struket som villkor, och provet som måste
 * hålla är i stället `isolera: 'mun'`: samma ansikte tre gånger där ENDAST
 * munnen skiljer, läsbart i 24 px och i gråskala.
 *
 * ── Vad arket visar, i den ordning frågorna ställdes ──────────────────────
 *
 *   1  Munnen ensam. Provet som avgör. Färg och gråskala, fem storlekar.
 *   2  Munnens tre former uppförstorade, så att skillnaden går att se som form
 *      och inte som grad.
 *   3  Brynens tonläge i major, tre steg, med "nära platt" som valt förval.
 *   4  Samma bedömning i alla vägar genom koden, alltså provet på om märket
 *      verkligen är EN ritning och inte tre.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HAR = dirname(fileURLToPath(import.meta.url));
const UT = join(HAR, '_prov-marke.html');

const m = await import('./maskot/gravling.mjs?v=' + Date.now());

/** Storlekarna som ägaren dömer på. 52 är verksamhetssidans stora märke. */
const STORLEKAR = [96, 64, 52, 40, 24, 16];
const TRE = ['clean', 'minor', 'major'];
const NIVAER = ['rik', 'enkel', 'nal'];

const cell = (svg, etikett) =>
  `<figure><div class="yta">${svg}</div><figcaption>${etikett}</figcaption></figure>`;

/* ══ 1. MUNNEN ENSAM ═══════════════════════════════════════════════════════
 *
 * `isolera: 'mun'` låser bryn, ögonlock, pupiller, blick och huvudlutning till
 * clean. Det som skiljer bilderna åt är då munnen och ingenting annat. Går de
 * tre inte att skilja åt här bär munnen inte, och då är allt annat vi ritat
 * kosmetika.
 */
function munprovet() {
  let ut = '';
  for (const niva of NIVAER) {
    const rader = STORLEKAR.map((px) => {
      const tre = TRE.map((u) =>
        m.figur({ size: px, ton: u, uttryck: u, ansikte: true, detalj: niva, isolera: 'mun' })).join('');
      return `<div class="trio">
        <div class="tre">${tre}</div>
        <div class="tre gra">${tre}</div>
        <span>${px} px</span></div>`;
    }).join('');
    ut += `<section class="steg"><h3>${niva}</h3><div class="rad">${rader}</div></section>`;
  }
  return ut;
}

/* ══ 2. MUNNENS TRE FORMER ════════════════════════════════════════════════
 *
 * Samma tre munnar, mycket förstorade och utan ansikte omkring sig, så att
 * frågan blir om de är tre FORMER eller tre grader av samma form.
 */
function munformerna() {
  return TRE.map((u) => cell(
    m.figur({ size: 260, ton: u, uttryck: u, ansikte: true, isolera: 'mun' }), u)).join('');
}

/* ══ 3. BRYNENS TONLÄGE ═══════════════════════════════════════════════════ */

const VALD = m.BRYN_LAGE.major.vinkel.slice();
const STEG = [
  { namn: 'Var: 21 och 19 grader', vinkel: [21, 19] },
  { namn: 'Halva: 10 och 9', vinkel: [10, 9] },
  { namn: `VALT, nära platt: ${VALD.join(' och ')}`, vinkel: VALD },
];

function brynstegen() {
  let ut = '';
  for (const s of STEG) {
    m.BRYN_LAGE.major.vinkel = s.vinkel;
    const rad = STORLEKAR
      .map((px) => cell(m.figur({ size: px, ton: 'major', uttryck: 'major', ansikte: true }), px + ' px'))
      .join('');
    ut += `<section class="steg"><h3>${s.namn}</h3>
      <div class="rad">${rad}</div>
      <div class="rad gra">${rad}</div>
      <div class="rad">
        ${cell(m.figur({ size: 200, ton: 'major', uttryck: 'major', ansikte: true }), 'Märket')}
        ${cell(m.figur({ size: 200, ton: 'major', uttryck: 'major' }), 'Figuren fri')}
      </div></section>`;
  }
  m.BRYN_LAGE.major.vinkel = VALD;
  return ut;
}

/* ══ 4. ALLA VÄGAR GENOM KODEN ════════════════════════════════════════════
 *
 * Märket är en BESKÄRNING av det fria ansiktet och inte en omritning, alltså
 * ska dragen ligga likadant i alla vägar. Storleken är densamma i alla fyra så
 * att skillnader inte kan skyllas på skala.
 */
function vagar(uttryck) {
  const px = 150;
  const alt = [
    ['Fritt läge', m.figur({ size: px, ton: uttryck, uttryck })],
    ...NIVAER.map((n) => [
      `Inramat, ${n}`,
      m.figur({ size: px, ton: uttryck, uttryck, ansikte: true, detalj: n }),
    ]),
  ];
  return `<section class="steg"><h3>${uttryck}</h3><div class="rad">${
    alt.map(([n, svg]) => cell(svg, n)).join('')
  }</div></section>`;
}

/* ══ MULENS UNDERKANT SOM RITAD LINJE ═════════════════════════════════════
 *
 * Ägaren såg att munnen gick upp i nosen. Talen i den här filen såg samtidigt
 * riktiga ut, eftersom ingen av dem mätte just det avståndet. En linje i en
 * bild fångar det som inget tal i en rapport gör, alltså ritas mulens
 * underkant ut och munnen får synas mot den.
 *
 * Linjen ligger på y 74,5 i figurens egen 100-ruta och läggs in i det inramade
 * märket, som ritar sitt ansikte i en grupp med samma transform. Den plockas
 * ur den renderade svg:n och inte skriven av, så att den följer med om ramen
 * eller skalan ändras.
 */
const MULE_Y = 74.5;

function medMulinje(svg) {
  const g = svg.match(/<g transform="(translate\(50 50\)scale\([\d.]+\)translate\([-\d. ]+\))">/);
  const linje =
    `<g transform="${g ? g[1] : ''}">` +
    `<line x1="20" y1="${MULE_Y}" x2="82" y2="${MULE_Y}" stroke="#FF00A8"` +
    ` stroke-width="0.7" stroke-dasharray="3 2.5"/></g>`;
  return svg.replace('</svg>', linje + '</svg>');
}

/**
 * Alla elva uttryck mot mulens underkant. Den rosa streckade linjen är y 74,5.
 * Går bläck ovanför den är munnen inne i nosen.
 */
function mulprovet() {
  return Object.keys(m.UTTRYCK).map((u) => cell(
    medMulinje(m.figur({ size: 190, ton: 'blue', uttryck: u, ansikte: true, detalj: 'rik' })),
    `${u} — ${m.UTTRYCK[u]}`)).join('');
}

/** Nivåerna i sina FAKTISKA storlekar, alltså så som de faktiskt möter ögat. */
function nivaerIStorlek() {
  return STORLEKAR.map((px) => `<div class="trio">
    <div class="tre">${NIVAER.map((n) =>
      m.figur({ size: px, ton: 'major', uttryck: 'major', ansikte: true, detalj: n })).join('')}</div>
    <span>${px} px: rik, enkel, nål</span></div>`).join('');
}

const html = `<!doctype html>
<html lang="sv"><head><meta charset="utf-8">
<title>Prov: munnen bär, brynen tonar</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; padding: 32px 40px 96px; background: #fff; color: #16181d;
    font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  h1 { font-size: 28px; margin: 0 0 8px; letter-spacing: -.02em; }
  h2 { font-size: 20px; margin: 52px 0 4px; letter-spacing: -.01em; }
  h3 { font-size: 14px; margin: 22px 0 2px; color: #454b57; }
  p { max-width: 70ch; color: #454b57; margin: 6px 0; }
  .rad { display: flex; align-items: flex-end; gap: 20px; flex-wrap: wrap; margin: 10px 0 16px; }
  figure { margin: 0; text-align: center; }
  figcaption { font-size: 11px; color: #8a919e; margin-top: 6px; }
  .yta { display: flex; align-items: flex-end; justify-content: center; min-height: 100px; }
  .gra { filter: grayscale(1); }
  .trio { text-align: center; }
  .trio .tre { display: flex; gap: 5px; justify-content: center; }
  .trio .gra { margin-top: 5px; }
  .trio span { font-size: 11px; color: #8a919e; display: block; margin-top: 6px; }
  svg { display: block; }
  .steg { border-top: 1px solid #e8eaee; padding-top: 4px; }
</style></head><body>

<h1>Munnen bär bedömningen, brynen bär tonen</h1>
<p>Ägaren: "munnen ska såklart skilja på alla". Provet som avgör är därför
munnen ensam i 24 px i gråskala. Brynen säger om figuren är bekymrad eller
lugn, inte vilket besked det är, och i major är de nedsatta från 21 grader till
nära platt eftersom de läste som arga.</p>

<h2>0. Munnen mot mulens underkant</h2>
<p>Den rosa streckade linjen är mulens underkant, y 74,5. Går munnens bläck
ovanför den ligger munnen inne i nosen. Munnens mittlinje räknas numera fram ur
den här linjen plus strykets halva tjocklek plus djupaste bågens halva pilhöjd,
alltså kan kollisionen inte komma tillbaka genom att någon fördjupar munnen.</p>
<div class="rad">${mulprovet()}</div>

<h2>1. Munnen ensam: clean, minor, major</h2>
<p>Allt utom munnen är låst till clean. Övre raden i färg, undre i gråskala.</p>
${munprovet()}

<h2>2. Är de tre formerna, eller tre grader av samma form?</h2>
<div class="rad">${munformerna()}</div>

<h2>3. Brynens tonläge i major</h2>
${brynstegen()}

<h2>4. Samma bedömning, alla vägar genom koden</h2>
<p>Fritt läge och de tre inramade nivåerna, alla i 150 px.</p>
${TRE.concat('none').map(vagar).join('')}

<h2>5. Nivåerna i sina faktiska storlekar</h2>
<div class="rad">${nivaerIStorlek()}</div>

</body></html>`;

writeFileSync(UT, html);
console.log(`Skrev ${UT} (${(html.length / 1024).toFixed(0)} kB)`);
