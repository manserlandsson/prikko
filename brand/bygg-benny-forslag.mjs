/**
 * Bygger förslagsbladet: Benny som bedömningsmärke.
 * Kör: node bygg-smiley-forslag.mjs  →  smiley-forslag.html i samma katalog.
 *
 * Riktning från Måns efter förra bladet: wordmark och logga rörs inte.
 * Ringen, fyllda boxen och blundaren är släppta. Benny, figuren med ben,
 * ska själv vara bedömningsmärkena, och den ska vara Prikkos egen figur,
 * byggd ur vår egen geometri (prickögonen, den runda munnen, cirkeln),
 * inte en kopia av molnreferensen.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLUE = '#007BE0';
const RED = '#FF0000';
const RED_DARK = '#C50000';
const REPO = '/Users/manserlandsson/Documents/Summer Project';
const FILL = { clean: '#00B92B', minor: '#FECB00', major: '#FF0000' };
const KEYS = ['clean', 'minor', 'major'];
const LABEL = {
  clean: 'Inga anmärkningar',
  minor: 'Brister',
  major: 'Brister som kvarstår',
};
const MORK = '#1c1e21';

/* ── De tre Benny-tolkningarna ───────────────────────────────────────────
 *
 * Gemensam grund, allt i en 100-ruta:
 *   kropp kring (50, 44), prickögon och rundad mun i Prikkos eget språk,
 *   korta ben med runda fötter. Fötterna är märkets ankare: på kartan står
 *   Benny PÅ adressen, med samma icon-anchor: bottom som droppen har i dag.
 */

/** Munnar, samma cirkelbåge speglad: glad, rak, ledsen. */
function munnar(cy) {
  return {
    clean: `M37 ${cy - 3.5}A14.6 14.6 0 0 0 63 ${cy - 3.5}`,
    minor: `M38.5 ${cy}H61.5`,
    major: `M37 ${cy + 3.5}A14.6 14.6 0 0 1 63 ${cy + 3.5}`,
  };
}

const B1 = {
  id: 'b1',
  namn: 'Benny 1: Klotet',
  koncept: 'Ordagrant "en smiley med ben som kan stå". Cirkeln ur loggan, våra ögon, vår mun, två ben.',
  egenart: 'Lägst egenart, störst kontinuitet.',
  body: { kind: 'circle', cx: 50, cy: 44, r: 30 },
  legs: [
    ['M41 70L40 84', 8.5],
    ['M59 70L60 84', 8.5],
  ],
  eyes: () => `<circle cx="39" cy="37" r="7" fill="#fff"/><circle cx="61" cy="37" r="7" fill="#fff"/>`,
  mun: munnar(54.5),
  munSw: 9.5,
  cropFull: '12 13 76 76',
  cropHead: '17 11 66 66',
  rorelse:
    'Gupp (fyra keyframes på transform med origin i fötterna), blink med scaleY på ögonen, munuppritningen ärvs rakt av från dagens märke. Allt ren CSS.',
  motivering:
    'Den ärliga minimalisten: exakt det Måns sa högt, smileyn som fått ben. Ansiktet är pixel för pixel vårt eget, så bron från dagens märke är omedelbar, och huvudet ensamt är fortfarande vårt ansikte. Det är samtidigt svagheten: utan benen i bild är det bara dagens smiley i en fylld cirkel, och kritiken var att vara unik. Kontinuitetens pris är egenarten.',
};

const B2 = {
  id: 'b2',
  namn: 'Benny 2: Vitögd',
  koncept: 'Samma kropp, men tecknade ögon med vitor och pupiller: mest liv, mest blick.',
  egenart: 'Mellanläge: levande i stort, vår prick i smått.',
  body: { kind: 'circle', cx: 50, cy: 44, r: 30 },
  legs: [
    ['M41 70L40 84', 8.5],
    ['M59 70L60 84', 8.5],
  ],
  eyes: (size) =>
    size >= 40
      ? `<g class="m-oga"><ellipse cx="39.5" cy="37" rx="7.8" ry="9.3" fill="#fff"/><circle class="m-pupill" cx="41" cy="38.5" r="4" fill="${MORK}"/></g>
<g class="m-oga"><ellipse cx="60.5" cy="37" rx="7.8" ry="9.3" fill="#fff"/><circle class="m-pupill" cx="62" cy="38.5" r="4" fill="${MORK}"/></g>`
      : `<circle cx="39" cy="37" r="7" fill="#fff"/><circle cx="61" cy="37" r="7" fill="#fff"/>`,
  mun: munnar(54.5),
  munSw: 9.5,
  cropFull: '12 13 76 76',
  cropHead: '17 11 66 66',
  rorelse:
    'Pupillerna glider och kan följa pekaren (två rader JS), blink med scaleY, gupp i fötterna. Ögonen är byggda för blick: Benny kan titta på sökfältet, på ett tomt resultat, på märket bredvid.',
  motivering:
    'Vitorna är det som gör referensfiguren levande, och här sitter de på vår kropp i stället för på ett lånat moln. Regeln som gör det hållbart: under 40 px kollapsar ögonen till våra vita prickar, så bedömningsmärket i list- och kartstorlek är alltid Prikkos ansikte. Risken är huvudet ensamt i stor storlek: vitor plus pupiller utan benen läses som vilken tecknad figur som helst, inte som Prikko.',
};

const B3 = {
  id: 'b3',
  namn: 'Benny 3: Pricken över i',
  koncept: 'Egen silhuett: en mjukt päronrund prick med en liten fristående prick över huvudet, som pricken över i:et i prikko.',
  egenart: 'Mest egenart, byggd av namnet.',
  body: {
    kind: 'path',
    d: 'M50 20C64.5 20 76.5 30 77.5 44.5C78.5 59 68 75 50 75C32 75 21.5 59 22.5 44.5C23.5 30 35.5 20 50 20Z',
  },
  dot: { cx: 50, cy: 9.5, r: 5.5 },
  legs: [
    ['M41 72L40 86', 8.5],
    ['M59 72L60 86', 8.5],
  ],
  eyes: () => `<circle cx="39" cy="40" r="7" fill="#fff"/><circle cx="61" cy="40" r="7" fill="#fff"/>`,
  mun: munnar(57.5),
  munSw: 9.5,
  cropFull: '6 3 88 88',
  cropHead: '14 3.5 72 72',
  rorelse:
    'I-pricken studsar (translateY, fyra keyframes), och det räcker som signatur: i laddlägen kan pricken studsa ensam. Gupp och blink som de andra. Kroppens mjuka päronform tål squash and stretch bättre än en perfekt cirkel.',
  motivering:
    'Svaret på "va unik": silhuetten finns inte hos någon annan, och den är byggd av vårt eget namn. Pricken över i:et är lyft ur wordmarkens gemena i och lagd över huvudet, kroppen är loggans prick som mjuknat och ställt sig upp. Ansiktet är fortfarande exakt vårt. Ärlig brasklapp: under 20 px försvinner både prick och päronform och alla tre tolkningarna blir samma färgade prick med fötter, så egenarten måste göra jobbet från 28 px och uppåt, vilket den gör.',
};

const BENNYS = [B1, B2, B3];

/* ── Det negativa märket ─────────────────────────────────────────────────
 *
 * Granskningslistans märke. Beskedet: samma stil som utmärkelsen, utan
 * krans, på verksamhetens egen sida. Utmärkelsen är wordmarken plus årtalet
 * i en lagerkrans, allt i en enda färg (#007BE0), och den grå varianten är
 * enligt lib/marke.ts samma ritning i annan färg. Speglingen byggs därför
 * på wordmarken med munnen i sitt ledsna läge och den röda bedömningsfärgen.
 *
 * Inget årtal. Utmärkelsen fryses i årsutgåvor och årtalet är det som gör
 * påståendet sant för alltid. Granskningslistan är levande: raden försvinner
 * så snart en ny kontroll visar att bristerna är åtgärdade, och ett årtal i
 * märket hade låtit anklagelsen bestå efter att den slutat vara sann.
 */

const WM_SRC = readFileSync(join(REPO, 'brand', 'prikko-wordmark.svg'), 'utf8');
const POS_SRC = readFileSync(join(REPO, 'brand', 'prikko-utmärkelse-blå.svg'), 'utf8');

/** Glada munnen i wordmarken, ordagrant ur filen. */
const WM_MUN_GLAD = 'M135 34C142 40.6667 149 40.6667 156 34';
/** Ledsna munnen: samma båge vänd, lite lägre och flackare, samma
 * proportion mellan glad och ledsen som bedömningsmärkets banor i face.ts. */
const WM_MUN_LEDSEN = 'M135 39.6C142 35.3 149 35.3 156 39.6';

/** Wordmarkens inre, med valbar mun och separata färger för ansikte och
 * text. Ansiktet (ögonen och munnen) ligger före textbanan i filen, så
 * färgläggningen kan göras med en enda delning. */
function wmInre({ textInk, faceInk, mouth }) {
  const inner = WM_SRC.replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(WM_MUN_GLAD, mouth === 'ledsen' ? WM_MUN_LEDSEN : WM_MUN_GLAD);
  const [ansikte, ...rest] = inner.split('<path d="M2.44');
  return (
    ansikte.replaceAll(BLUE, faceInk) +
    '<path d="M2.44' +
    rest.join('<path d="M2.44').replaceAll(BLUE, textInk)
  );
}

function negWordmark({ textInk, faceInk }, width) {
  const h = Math.round((width * 59) / 159);
  return `<svg width="${width}" height="${h}" viewBox="0 0 159 59" fill="none">${wmInre({ textInk, faceInk, mouth: 'ledsen' })}</svg>`;
}

/** Tvåvåningsvarianten: wordmarken där utmärkelsen har den, textraden där
 * årtalet står. Textraden är satt i systemtypsnitt som skiss, slutversionen
 * sätts i Figma med wordmarkens egna bokstavsformer. */
function negTvavaning({ textInk, faceInk, radInk }, width) {
  const h = Math.round((width * 132) / 260);
  return `<svg width="${width}" height="${h}" viewBox="0 0 260 132" fill="none">
  <g transform="translate(30.6 2) scale(1.25)">${wmInre({ textInk, faceInk, mouth: 'ledsen' })}</g>
  <text x="130" y="116" text-anchor="middle" fill="${radInk}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="23.5" font-weight="800" letter-spacing="1.2">BRISTER KVARSTÅR</text>
</svg>`;
}

/** Utmärkelsen som den är, för jämförelsen sida vid sida. Bäddas in EN gång,
 * ritningen bär mask-id:n som inte får dubbleras i samma dokument. */
function posMark(width) {
  const h = Math.round((width * 236) / 507);
  return POS_SRC.replace('width="507" height="236"', `width="${width}" height="${h}"`);
}

const NEG = [
  {
    id: 'n1',
    namn: 'Negativ 1: Spegeln',
    koncept: 'Utmärkelsens recept rakt av: hela märket i en enda färg, munnen vänd, kransen borta.',
    svg: (w) => negWordmark({ textInk: RED_DARK, faceInk: RED_DARK }, w),
    motivering:
      'Den ordagranna tolkningen av beskedet, och den som är enklast att rita klart: byt färg, vänd munnen, ta bort kransen. Färgen är gradientens mörka stopp #C50000 i stället för #FF0000, av samma skäl som utmärkelsen fick en kontrastnot i marke.ts: den mörka ligger över 6:1 mot vitt och bär text, den ljusa ligger strax under 4:1 och bär bara grafik. Svagheten är att ordet prikko blir rött: avsändaren själv ser arg ut, och en röd wordmark läses lätt som ett annat varumärke än den blå.',
  },
  {
    id: 'n2',
    namn: 'Negativ 2: Röd dom, blå avsändare',
    koncept: 'Wordmarken står kvar i märkesblått, bara ansiktet byter läge och färg: ledsen mun, bedömningsröd.',
    svg: (w) => negWordmark({ textInk: BLUE, faceInk: RED }, w),
    motivering:
      'Uppdelningen säger exakt det märket ska säga: Prikko är avsändaren och är densamma som alltid, det röda är domen och sitter enbart i ansiktet. Rött ansikte på blå text är dessutom samma grammatik som resten av sajten, där wordmarken alltid är blå och bedömningsfärgen alltid bärs av minen. Ansiktet är grafik och klarar sig med #FF0000, samma röda som bedömningsmärkena. Märket behöver inte förklara sig självt: till skillnad från utmärkelsen laddar ingen ner det här märket och sätter det i sitt fönster, det lever bara på vår sida där rubriken och referatet av kommunens rader gör klartextjobbet.',
  },
  {
    id: 'n3',
    namn: 'Negativ 3: Med textrad',
    koncept: 'Utmärkelsens tvåvåningslayout: wordmarken ovanpå, och där årtalet står i den positiva står orden i den negativa.',
    svg: (w) => negTvavaning({ textInk: BLUE, faceInk: RED, radInk: RED_DARK }, w),
    motivering:
      'Mest självbärande, och den som tydligast är utmärkelsens syskon: samma två våningar, samma tyngdpunkt nertill, kransen borta. Textraden tar årtalets plats men är ord i stället för år, eftersom listan är levande och ett årtal hade låtit anklagelsen bestå efter att bristerna åtgärdats. Priset är tonläget: ett märke som skriker BRISTER KVARSTÅR är en varningsskylt, och på verksamhetens sida står samma ord redan i rubrik och text. Rätt variant den dag märket måste stå ensamt utanför sajten, fel som standard på sidan. Textraden här är skissad i systemtypsnitt, slutversionen sätts i Figma.',
  },
];

/* ── Rendering ───────────────────────────────────────────────────────── */

function bennySvg(v, { size = 64, fill = BLUE, mouth = 'clean', crop = 'full', outline = false, anim = false } = {}) {
  const full = crop === 'full';
  const vb = full ? v.cropFull : v.cropHead;
  const delar = [];

  if (full && outline) {
    for (const [d] of v.legs) delar.push(`<path d="${d}" stroke="#fff" stroke-width="14" stroke-linecap="round"/>`);
  }
  if (full) {
    for (const [d, sw] of v.legs) delar.push(`<path d="${d}" stroke="${fill}" stroke-width="${sw}" stroke-linecap="round"/>`);
  }
  if (v.dot && (full || crop === 'head')) {
    const o = outline ? ` stroke="#fff" stroke-width="3.5"` : '';
    delar.push(`<circle class="${anim ? 'm-prick' : ''}" cx="${v.dot.cx}" cy="${v.dot.cy}" r="${v.dot.r}" fill="${fill}"${o}/>`);
  }
  const kroppO = outline ? ` stroke="#fff" stroke-width="5"` : '';
  delar.push(
    v.body.kind === 'circle'
      ? `<circle cx="${v.body.cx}" cy="${v.body.cy}" r="${v.body.r}" fill="${fill}"${kroppO}/>`
      : `<path d="${v.body.d}" fill="${fill}"${kroppO}/>`
  );
  delar.push(v.eyes(size, anim));
  delar.push(
    `<path d="${v.mun[mouth]}" stroke="#fff" stroke-width="${v.munSw}" stroke-linecap="round" fill="none"/>`
  );

  const inre = anim ? `<g class="m-gupp">${delar.join('')}</g>` : delar.join('');
  return `<svg width="${size}" height="${size}" viewBox="${vb}" fill="none">${inre}</svg>`;
}

function kort(v) {
  return `<section class="kort" id="${v.id}">
  <header><h2>${v.namn}</h2><p class="koncept">${v.koncept}</p></header>
  <p class="egenart">${v.egenart}</p>
  <div class="prover">
    <div class="prov">
      <span class="rubrik">Figuren, levande</span>
      <div class="rad">${bennySvg(v, { size: 132, anim: true })}</div>
    </div>
    <div class="prov">
      <span class="rubrik">Benny som bedömning, 64 px</span>
      <div class="rad">${KEYS.map((k) => bennySvg(v, { size: 64, fill: FILL[k], mouth: k })).join('')}</div>
      <div class="etiketter">${KEYS.map((k) => `<span>${LABEL[k]}</span>`).join('')}</div>
    </div>
    <div class="prov">
      <span class="rubrik">Degradering: 40, 28, 16 px</span>
      <div class="rad botten">
        ${bennySvg(v, { size: 40, fill: FILL.clean, mouth: 'clean' })}
        ${bennySvg(v, { size: 28, fill: FILL.clean, mouth: 'clean' })}
        ${bennySvg(v, { size: 16, fill: FILL.clean, mouth: 'clean' })}
      </div>
      <div class="rad tajt">${KEYS.map((k) => bennySvg(v, { size: 16, fill: FILL[k], mouth: k })).join('')}</div>
    </div>
    <div class="prov">
      <span class="rubrik">Bara huvudet, 24 px</span>
      <div class="rad tajt">${KEYS.map((k) => bennySvg(v, { size: 24, fill: FILL[k], mouth: k, crop: 'head' })).join('')}</div>
    </div>
    <div class="prov">
      <span class="rubrik">Kartnål: Benny står på adressen</span>
      <div class="karta">${KEYS.map((k) => bennySvg(v, { size: 38, fill: FILL[k], mouth: k, outline: true })).join('')}</div>
    </div>
  </div>
  <p class="anim-rad"><b>Rörelse:</b> ${v.rorelse}</p>
  <p class="motivering">${v.motivering}</p>
</section>`;
}

function negKort(v) {
  return `<section class="kort" id="${v.id}">
  <header><h2>${v.namn}</h2><p class="koncept">${v.koncept}</p></header>
  <div class="prover">
    <div class="prov">
      <span class="rubrik">På verksamhetens sida, 220 px</span>
      <div class="rad">${v.svg(220)}</div>
    </div>
    <div class="prov">
      <span class="rubrik">Mindre, 120 px</span>
      <div class="rad">${v.svg(120)}</div>
    </div>
  </div>
  <p class="motivering">${v.motivering}</p>
</section>`;
}

const negSektion = `<h2 class="mellanrubrik">Det negativa märket</h2>
<p class="ingress">Granskningslistan, arbetsnamn matsnusk, samlar verksamheter där brister
kvarstod efter kommunens uppföljning, och den ska ha ett märke på verksamhetens sida precis
som utmärkelsen har. Beskedet: samma stil som den positiva, utan krans. Utmärkelsen är
wordmarken med årtalet i en lagerkrans, allt i en färg, så speglingen byggs på wordmarken
med munnen vänd till sitt ledsna läge och den röda bedömningsfärgen. Munnen är samma
cirkelbåge som den glada, lite lägre och flackare, i samma proportion som bedömningsmärkets
glada och ledsna banor. Inget årtal: listan är levande och raden försvinner när bristerna
åtgärdats, så ett årtal hade låtit anklagelsen bestå efter att den slutat vara sann.
Och ingen Benny: maskoten hyllar och visar vägen, den hänger inte ut namngivna företag.
Ansiktet i märket är wordmarkens eget, samma som i den positiva.</p>

<section class="kort not">
  <span class="rubrik">Tonläget, och paret sida vid sida</span>
  <div class="rad par">
    ${posMark(230)}
    ${negWordmark({ textInk: BLUE, faceInk: RED }, 200)}
  </div>
  <p class="motivering">Utan krans säger märket vi konstaterar detta, i stället för vi hyllar
  detta. Det är rätt tonläge när man namnger företag: kransen är en ceremoni, och en ceremoni
  kring ett underkännande vore hån. Samma skillnad som mellan diplomet på väggen och raden i
  protokollet. Därför ska den negativa aldrig få ett eget smycke som väger upp kransen, dess
  stramhet är själva budskapet.</p>
</section>

${NEG.map(negKort).join('\n')}

<section class="rank">
  <h2>Rangordning, negativa märket</h2>
  <ol>
    <li><b>Negativ 2: Röd dom, blå avsändare.</b> Avsändaren förblir sig lik och det röda
    sitter enbart i domen, precis som i resten av systemet där wordmarken alltid är blå och
    bedömningsfärgen bärs av minen. Märket lever bara på vår sida, så det behöver inte vara
    självförklarande, och sidans text gör klartextjobbet.</li>
    <li><b>Negativ 1: Spegeln.</b> Närmast beskedet och minst att rita, men en röd wordmark
    gör avsändaren arg och ser ut som ett annat varumärke. Rätt utgångspunkt om Måns vill ha
    ett enda bläck, då med #C50000 som textfärg av kontrastskäl.</li>
    <li><b>Negativ 3: Med textrad.</b> Mest självbärande och tydligast utmärkelsens syskon,
    men en varningsskylt på en sida som redan säger samma sak i text. Värd att spara till den
    dag märket måste stå ensamt utanför sajten.</li>
  </ol>
</section>`;

/* ── Sidan ───────────────────────────────────────────────────────────── */

const html = `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Prikko, Benny som bedömningsmärke och det negativa märket</title>
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #f4f5f7; color: #17191c;
    padding: 48px 24px 80px;
    -webkit-font-smoothing: antialiased;
  }
  main { max-width: 1020px; margin: 0 auto; }
  h1 { font-size: 30px; letter-spacing: -0.02em; }
  .ingress { color: #565c66; margin: 10px 0 32px; max-width: 66ch; line-height: 1.55; }
  .kort {
    background: #fff; border: 1px solid #e4e6ea; border-radius: 14px;
    padding: 26px 28px 24px; margin-bottom: 22px;
    box-shadow: 0 1px 2px rgba(20, 24, 33, .04);
  }
  .kort header { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: 4px; }
  .kort h2 { font-size: 19px; letter-spacing: -0.01em; }
  .koncept { color: #565c66; font-size: 14.5px; }
  .egenart { font-size: 12px; font-weight: 600; color: ${BLUE}; margin-bottom: 18px; }
  .prover { display: flex; flex-wrap: wrap; gap: 28px 40px; align-items: flex-start; }
  .prov { display: flex; flex-direction: column; gap: 9px; }
  .rubrik {
    font-size: 10.5px; font-weight: 600; letter-spacing: .08em;
    text-transform: uppercase; color: #8a909b;
  }
  .rad { display: flex; gap: 14px; align-items: center; }
  .rad.botten { align-items: flex-end; }
  .rad.tajt { gap: 7px; min-height: 24px; }
  .etiketter { display: flex; gap: 14px; }
  .etiketter span { width: 64px; font-size: 9.5px; color: #8a909b; text-align: center; line-height: 1.3; }
  .karta {
    display: flex; gap: 18px; align-items: flex-end;
    background: #eae7df; border-radius: 10px; padding: 12px 18px 8px;
  }
  .anim-rad { margin-top: 20px; font-size: 13.5px; line-height: 1.55; color: #565c66; max-width: 78ch; }
  .anim-rad b { color: #17191c; font-weight: 600; }
  .motivering { margin-top: 10px; font-size: 14.5px; line-height: 1.6; color: #3a3f47; max-width: 78ch; }
  .rank, .rek { background: #fff; border: 1px solid #e4e6ea; border-radius: 14px; padding: 26px 28px; margin-top: 26px; }
  .rank h2, .rek h2 { font-size: 19px; margin-bottom: 14px; }
  .rank ol { padding-left: 22px; display: flex; flex-direction: column; gap: 10px; }
  .rank li, .rek p { font-size: 14.5px; line-height: 1.55; color: #3a3f47; }
  .rank b, .rek b { color: #17191c; }
  .rek { border: 2px solid ${BLUE}; }
  .rek .rad { margin: 16px 0; flex-wrap: wrap; align-items: flex-end; }
  .rek p + p { margin-top: 10px; }
  .mellanrubrik { font-size: 24px; letter-spacing: -0.015em; margin: 46px 0 0; }
  .kort.not { border-left: 3px solid ${RED_DARK}; }
  .kort.not .rubrik { display: block; margin-bottom: 12px; }
  .rad.par { flex-wrap: wrap; gap: 34px; align-items: center; margin-bottom: 16px; }

  /* Rörelse: allt är transform, inget kostar layout. */
  .m-gupp { transform-box: fill-box; transform-origin: 50% 100%; animation: gupp 3.8s ease-in-out infinite; }
  @keyframes gupp {
    0%, 78%, 100% { transform: translateY(0) scaleY(1); }
    84% { transform: translateY(1.5px) scaleY(.96); }
    90% { transform: translateY(-3.5px) scaleY(1.02); }
    95% { transform: translateY(.6px) scaleY(.985); }
  }
  .m-oga { transform-box: fill-box; transform-origin: center; animation: blink 6.4s ease-in-out infinite; }
  @keyframes blink {
    0%, 91%, 100% { transform: scaleY(1); }
    94%, 96% { transform: scaleY(.08); }
  }
  .m-pupill { animation: titta 7.5s ease-in-out infinite; }
  @keyframes titta {
    0%, 34%, 100% { transform: translateX(0); }
    42%, 62% { transform: translateX(-3.4px); }
    70%, 88% { transform: translateX(0); }
  }
  .m-prick { transform-box: fill-box; transform-origin: center; animation: prickstuds 4.6s ease-in-out infinite; }
  @keyframes prickstuds {
    0%, 70%, 100% { transform: translateY(0); }
    78% { transform: translateY(-4.5px); }
    85% { transform: translateY(1.2px); }
    92% { transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .m-gupp, .m-oga, .m-pupill, .m-prick { animation: none; }
  }
</style>
</head>
<body>
<main>
  <h1>Benny som bedömningsmärke, och det negativa märket</h1>
  <p class="ingress">Nytt blad efter beskeden: wordmarken och loggan rörs inte, ringen och den
  fyllda rutan är släppta, och Benny ska inte stå bredvid märkena utan vara dem. Tre tolkningar
  med stigande grad av egenart, alla byggda ur Prikkos egen geometri: prickögonen, den runda
  munnen med samma cirkelbåge speglad för glad, rak och ledsen, och cirkeln ur loggan. Ingen av
  dem lånar molnformen ur referensbilden. Fötterna tar över droppens jobb: märket ankras i
  botten, så Benny står bokstavligen på adressen. Varje kort visar degraderingen storlek för
  storlek, ner till 16 px, och vad som kan animeras billigt. Figurerna rör sig i bladet,
  det är ren CSS på transform. Längst ner: det nya negativa märket för granskningslistan,
  utmärkelsens spegling utan krans.</p>

  ${BENNYS.map(kort).join('\n')}

  <section class="rank">
    <h2>Rangordning, Benny</h2>
    <ol>
      <li><b>Benny 3: Pricken över i.</b> Enda tolkningen som svarar på kritiken i sak: silhuetten
      är vår egen och berättelsen bakom den, pricken ur wordmarkens i som lagt sig över huvudet,
      går inte att kopiera utan att kopiera namnet. Ansiktet är oförändrat vårt, så kontinuiteten
      mot dagens märke sitter där den ska: i minen, inte i konturen.</li>
      <li><b>Benny 2: Vitögd.</b> Mest liv och den bästa animationsytan, och regeln att vitorna
      kollapsar till prickar under 40 px håller märkena rena. Men utan benen i bild är huvudet en
      generisk tecknad figur, och det är precis lägena (huvud i liten cirkel, avatarer, knappar)
      som ett märke hamnar i.</li>
      <li><b>Benny 1: Klotet.</b> Tryggast och närmast dagens smiley, men därmed också svaret som
      inte tar kritiken på allvar: unikheten sitter enbart i benen, och benen är det första som
      försvinner när märket krymper.</li>
    </ol>
  </section>

  ${negSektion}

  <section class="rek">
    <h2>Min rekommendation för helheten</h2>
    <div class="rad">
      ${bennySvg(B3, { size: 96, anim: true })}
      ${KEYS.map((k) => bennySvg(B3, { size: 56, fill: FILL[k], mouth: k })).join('')}
      <div class="karta">${KEYS.map((k) => bennySvg(B3, { size: 38, fill: FILL[k], mouth: k, outline: true })).join('')}</div>
      ${negWordmark({ textInk: BLUE, faceInk: RED }, 180)}
    </div>
    <p><b>Kombinationen: Benny 3 rakt igenom, och Negativ 2 som granskningens märke.</b>
    Benny 3, Pricken över i, som figur, bedömningsmärken och kartnålar: en figur i stället för
    två system, och en som ingen annan kan ha eftersom den är byggd av namnet. I stora
    sammanhang (hero, tomma lägen, felmeddelanden) lever den med gupp, blink och studsande
    i-prick. Som märke bär den bedömningen med exakt vårt ansikte och skilda munnar för
    färgblinda, och på kartan står den på adressen med vit kontur mot kartbotten.</p>
    <p>Negativ 2 därför att den delar arbetet exakt som resten av kombinationen gör: den blå
    wordmarken är avsändaren, det röda ansiktet är domen, och den ledsna munnen är samma båge
    som Bennys röda märke bär på kartan. Utmärkelse, granskningsmärke, bedömningsmärken och
    maskot talar då ett enda språk: blått är Prikko, färgen är domen, och minen säger samma
    sak som färgen för den som inte ser skillnaden. Rollerna hålls isär: Benny hyllar och
    visar vägen men sätts aldrig på ett namngivet företag med brister, där talar registret
    genom wordmarken.</p>
    <p>Vill Måns ha mer blick i heroformat kan Benny 2:s vitögon läggas på Benny 3:s kropp som
    ett storleksläge, regeln är redan definierad: vitor från 40 px och uppåt, våra prickar under.
    Det enda som ges upp är i-pricken och päronformen under 20 px, där alla tolkningar ändå
    konvergerar till samma färgade prick med fötter. Där gör minen jobbet, och minen är vår.</p>
  </section>
</main>
</body>
</html>`;

const dir = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(dir, 'smiley-forslag.html'), html);
console.log('skrev', join(dir, 'smiley-forslag.html'));
