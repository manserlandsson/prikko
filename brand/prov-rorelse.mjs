/**
 * Provarket för maskotens rörelser.
 *
 * Riggen i site/src/lib/maskot-rigg.mjs och rörelsekatalogen i
 * site/src/styles/maskot-rorelse.css skrevs båda färdiga, men ingenting
 * renderade dem: varken sajten eller ett ark. En rörelse som ingen kan titta
 * på är inte gjord, den är påstådd. Det här arket är därför inte dekoration,
 * det är det enda sättet att se om katalogen håller.
 *
 * Arket LÄSER css-filen i stället för att kopiera den, precis som
 * maskot-forslag.html påstod sig göra. Det som syns här är alltså per
 * definition det sajten skickar.
 *
 * Varje rörelse spelas om på klick och på en knapp, eftersom en rörelse som
 * går en gång vid sidladdning är omöjlig att bedöma. Klassen tas bort, en
 * bildruta väntas ut, och sätts tillbaka: det är det enda sättet att starta om
 * en css-animation utan att duplicera den.
 *
 *   node brand/prov-rorelse.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { figur } from './maskot/gravling.mjs';
import { rigga, RIGGDELAR } from '../site/src/lib/maskot-rigg.mjs';
import { medRekvisita } from '../site/src/lib/maskot-rekvisita.mjs';

const CSS = readFileSync(new URL('../site/src/styles/maskot-rorelse.css', import.meta.url), 'utf8');

/**
 * Rörelserna, i den ordning de rimligen bedöms: först det som händer när
 * figuren kommer in, sedan vilan, sedan gesterna, sist bedömningsmärkets egna.
 *
 * `ton` och `uttryck` styr vilken figur rörelsen provas på, för att en rörelse
 * ska visas på den grävling den faktiskt är skriven för. Ögonpoppen hör till
 * den röda, hoppet till den gröna.
 */
const RORELSER = [
  { klass: 'm-ankomst', namn: 'Ankomst', not: 'Kroppen först, huvudet efter, öronen sist. Skuggan står kvar på marken.' },
  { klass: 'm-andas', namn: 'Andning', not: 'Vilan. Går för alltid och ska knappt märkas.', loop: true },
  { klass: 'm-blink', namn: 'Blinkning', not: 'Höger öga tolv millisekunder efter vänster. Ingen blinkar synkront.' },
  { klass: 'm-spana', namn: 'Spaning', not: 'Den godkända, och orörd. Måttstocken för alla andra.' },
  { klass: 'm-spetsa', namn: 'Spetsade öron', not: 'Hovringens läge. Stannar kvar tills pekaren lämnar.' },
  { klass: 'm-nick', namn: 'Nick', not: 'Bekräftelsen. Hållet i botten är 213 ms.' },
  { klass: 'm-titt', namn: 'Titt', not: 'Blicken går först, huvudet följer. Längsta hållet i katalogen.' },
  { klass: 'm-vinka', namn: 'Vink', not: 'Arm och tass roterar kring axeln, tassen 60 ms efter.' },
  { klass: 'm-glad', namn: 'Hopp', ton: 'clean', not: 'Gröna grävlingen. Hangtime på toppen, skuggan kvar på marken.' },
  { klass: 'm-ogonpopp', namn: 'Ögonpopp', ton: 'major', not: 'Röda grävlingen. Pupillen krymper först, sedan hållet.' },
  { klass: 'm-rok', namn: 'Rök ur öronen', ton: 'major', rekvisita: 'rok', not: 'Röda grävlingen, när det gått för långt.', loop: true },
  { klass: 'm-skaka', namn: 'Rysning', not: 'Darrning, och sedan ett håll i en sjunken pose.' },
  { klass: 'm-grav', namn: 'Grävning', not: 'Armarna arbetar, huvudet dyker.', loop: true },
];

/**
 * Märkets egna rörelser provas på det beskurna ansiktet, eftersom det är den
 * formen märket har på sajten. Att visa dem på helfiguren hade sagt något om
 * en figur vi inte publicerar.
 */
const MARKESRORELSER = [
  { klass: 'mm-ankomst', namn: 'Märket kommer in', ton: 'clean' },
  { klass: 'mm-glad', namn: 'Leendet ritas', ton: 'clean' },
  { klass: 'mm-bryn', namn: 'Brynen lyfter', ton: 'minor' },
  { klass: 'mm-allvar', namn: 'Allvaret', ton: 'major' },
];

/* Riggen skriver in `</g>` INUTI ett attributvärde när en märkt grupp har
 * märkta barn, alltså när högerörat ligger i örongruppen. Följden syns direkt
 * i bild: högerörats `ry` blir `4</g>.2`, örat renderas inte alls, och
 * högerbrynets bana kapas mitt i.
 *
 * Arket LAGAR INTE det, och det är ett medvetet val. Hela poängen med filen är
 * att det som syns här per definition är det sajten skickar; ett ark som
 * städar upp efter riggen skulle dölja precis det fel som gör att figuren ser
 * fel ut. Det RÄKNAS i stället, och står i en varning högst upp.
 *
 * Felet bor i site/src/lib/maskot-rigg.mjs och rättas där. */
const trasigaAttribut = (svg) => (svg.match(/="[^"]*<\/g>[^"]*"/g) || []).length;
let trasigaTotalt = 0;

function ruta({ klass, namn, not, ton = 'blue', uttryck, ansikte = false, loop, rekvisita }) {
  const ren = figur({
    size: ansikte ? 100 : 132,
    ton,
    uttryck,
    ansikte,
    detalj: 'rik',
  });
  /* Rekvisitan läggs FÖRE riggningen, så att röken hamnar inuti rot-svg:n och
     alltså under rörelsens klass. Läggs den efteråt sitter den utanför
     selektorn och rör sig aldrig. */
  const medProps = rekvisita ? medRekvisita(ren, [rekvisita]) : ren;
  const { svg, saknas } = rigga(medProps, { klass });
  trasigaTotalt += trasigaAttribut(svg);
  const varning = saknas.length
    ? `<p class="saknas">Riggen hittade inte: ${saknas.join(', ')}</p>`
    : '';
  return `<figure class="ruta" data-klass="${klass}">
    <div class="scen">${svg}</div>
    <figcaption>
      <strong>${namn}</strong>
      <code>.${klass}</code>
      ${not ? `<span class="not">${not}</span>` : ''}
      ${loop ? '<span class="loopar">går i loop</span>' : ''}
      ${varning}
    </figcaption>
  </figure>`;
}

/* Rutorna byggs FÖRE mallen, eftersom varningen om trasig markup står högst
   upp i dokumentet och räkningen sker medan rutorna byggs. */
const figurRutor = RORELSER.map(ruta).join('');
const markesRutor = MARKESRORELSER.map((r) => ruta({ ...r, ansikte: true })).join('');

const riggvarning = trasigaTotalt
  ? `<p class="riggfel"><strong>Riggen skickar trasig markup: ${trasigaTotalt} attribut
     innehåller ett <code>&lt;/g&gt;</code> som hamnat inuti sitt eget värde.</strong>
     Följden syns i varje figur nedan: <strong>högerörat ritas inte alls</strong>, eftersom
     dess <code>ry</code> blivit <code>4&lt;/g&gt;.2</code>, och <strong>högerbrynets bana kapas
     mitt i</strong>. Orsaken är att <code>rigga()</code> i
     <code>site/src/lib/maskot-rigg.mjs</code> sätter in sina grupper bakifrån efter
     nodens <em>start</em>, vilket håller för syskon men inte för en förälder som är
     märkt tillsammans med sina barn: föräldern behandlas sist och dess slutindex har då
     redan flyttats av barnens insättningar. Arket lagar det inte med flit, se filhuvudet.
     Rörelserna nedan går alltså på en figur som saknar ett öra.</p>`
  : '';

const html = `<!doctype html>
<html lang="sv">
<meta charset="utf-8">
<title>Prikko, rörelsekatalogen</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { color-scheme: light; }
  body {
    margin: 0; padding: 40px 32px 80px;
    font: 15px/1.55 -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    color: #16181d; background: #fbfbfa;
  }
  h1 { font-size: 26px; margin: 0 0 6px; letter-spacing: -0.015em; }
  .ingress { margin: 0 0 6px; color: #5b6070; max-width: 62ch; }
  .rad { display: flex; gap: 10px; align-items: center; margin: 22px 0 30px; }
  button {
    font: inherit; font-size: 13px; padding: 7px 13px; border-radius: 8px;
    border: 1px solid #d7d9de; background: #fff; cursor: pointer;
  }
  button:hover { background: #f2f3f5; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 0.07em;
       color: #6b7080; margin: 44px 0 16px; font-weight: 600; }
  .rutnat { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); }
  .ruta {
    margin: 0; background: #fff; border: 1px solid #e7e8ec; border-radius: 14px;
    overflow: hidden; cursor: pointer;
  }
  .ruta:hover { border-color: #c9ccd4; }
  .scen {
    display: grid; place-items: center; height: 168px;
    background: repeating-linear-gradient(45deg, #fafafa 0 8px, #f4f4f5 8px 16px);
  }
  .scen svg { display: block; overflow: visible; }
  figcaption { padding: 11px 13px 13px; border-top: 1px solid #eff0f3; display: grid; gap: 3px; }
  code { font-size: 11.5px; color: #7a7f8c; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .not { font-size: 12.5px; color: #61667a; }
  .loopar { font-size: 11px; color: #2f6feb; }
  .saknas { margin: 4px 0 0; font-size: 12px; color: #b42318; }
  .riggfel {
    margin: 18px 0 0; padding: 13px 15px; max-width: 92ch;
    border: 1px solid #f0c2bc; background: #fdf3f2; border-radius: 10px;
    font-size: 13px; line-height: 1.5; color: #7a2a20;
  }
  .riggfel code { color: #7a2a20; }
  /* Bildrutevyn. En rörelse går inte att bedöma i farten: hållen syns bara
     när tiden står stilla. Varje ruta kan därför visa sin egen rörelse som
     åtta pausade lägen i rad. */
  .ruta.rutor .scen { height: auto; padding: 8px 0; }
  .rutband { display: flex; flex-wrap: wrap; justify-content: center; gap: 2px; }
  .rutband > div { width: 62px; text-align: center; font: 9px/1.4 ui-monospace, Menlo, monospace; color: #8b90a0; }
  .rutband svg { display: block; margin: 0 auto; }
${CSS}
</style>

<h1>Prikko, rörelsekatalogen</h1>
<p class="ingress">Arket läser <code>site/src/styles/maskot-rorelse.css</code> direkt, så det som
syns här är exakt det sajten skickar. Klicka på en ruta för att spela om den, eller kör alla på en gång.</p>
<p class="ingress">Riggen namnger ${RIGGDELAR.length} leder på figuren. Hittar den inte en led står det i rutan.</p>
<p class="ingress"><strong>Bildrutor</strong> visar varje rörelse som åtta pausade lägen i rad. Det är
den enda vyn där HÅLLEN går att se, alltså de bildrutor där posen står kvar, och hållen är
skillnaden mellan rörelse som ser dyr ut och rörelse som ser billig ut.</p>
${riggvarning}

<div class="rad">
  <button id="alla">Spela alla</button>
  <button id="langsamt">Kvartsfart</button>
  <button id="rutor">Bildrutor</button>
</div>

<h2>Figuren</h2>
<div class="rutnat">${figurRutor}</div>

<h2>Bedömningsmärket</h2>
<div class="rutnat">${markesRutor}</div>

<script>
  // En css-animation startar inte om av sig själv. Klassen måste bort, en
  // bildruta passera, och sedan tillbaka. Utan väntan ser webbläsaren aldrig
  // att den var borta.
  function spela(ruta) {
    const klass = ruta.dataset.klass;
    const svg = ruta.querySelector('svg');
    svg.classList.remove(klass);
    void svg.offsetWidth;
    requestAnimationFrame(() => svg.classList.add(klass));
  }
  document.querySelectorAll('.ruta').forEach((r) => r.addEventListener('click', () => spela(r)));
  document.getElementById('alla').addEventListener('click', () => {
    document.querySelectorAll('.ruta').forEach(spela);
  });
  // BILDRUTEVYN. En kopia av figuren per tidpunkt, var och en pausad på sitt
  // eget läge med Web Animations API. Att pausa KOPIOR i stället för originalet
  // är hela tricket: originalet ligger kvar och går att spela som vanligt, och
  // varje kopia bär samma klass och därmed samma css-regler.
  const RUTOR = 8;
  function langd(svg) {
    let tot = 0;
    for (const a of svg.getAnimations({ subtree: true })) {
      const t = a.effect.getTiming();
      const d = (t.delay || 0) + (typeof t.duration === 'number' ? t.duration : 0);
      if (d > tot) tot = d;
    }
    return tot;
  }
  function rutband(ruta) {
    const scen = ruta.querySelector('.scen');
    const svg = scen.querySelector('svg');
    const tot = langd(svg);
    if (!tot) return;
    ruta.dataset.scen = scen.innerHTML;
    const band = document.createElement('div');
    band.className = 'rutband';
    // Bandet läggs in i dokumentet FÖRE kopiorna. En css-animation finns inte
    // på ett element som inte renderas, alltså ger getAnimations() en tom lista
    // på en lös nod och ingenting går att pausa. Det felet syns inte som ett
    // fel: rutorna visas, de visar bara alla samma bildruta.
    scen.innerHTML = '';
    scen.appendChild(band);
    ruta.classList.add('rutor');
    for (let i = 0; i < RUTOR; i++) {
      const t = (tot * i) / (RUTOR - 1);
      const cell = document.createElement('div');
      band.appendChild(cell);
      const kopia = svg.cloneNode(true);
      kopia.setAttribute('width', 58);
      kopia.setAttribute('height', 58);
      cell.appendChild(kopia);
      cell.appendChild(document.createTextNode(Math.round(t)));
      for (const a of kopia.getAnimations({ subtree: true })) { a.pause(); a.currentTime = t; }
    }
  }
  document.getElementById('rutor').addEventListener('click', (e) => {
    const pa = document.body.dataset.rutor === '1';
    document.body.dataset.rutor = pa ? '' : '1';
    document.querySelectorAll('.ruta').forEach((r) => {
      if (pa) {
        if (r.dataset.scen) r.querySelector('.scen').innerHTML = r.dataset.scen;
        r.classList.remove('rutor');
      } else {
        rutband(r);
      }
    });
    e.target.textContent = pa ? 'Bildrutor' : 'Tillbaka';
  });

  document.getElementById('langsamt').addEventListener('click', (e) => {
    const pa = document.documentElement.style.getPropertyValue('--prov-fart') === '4';
    document.documentElement.style.setProperty('--prov-fart', pa ? '' : '4');
    document.querySelectorAll('.scen svg').forEach((s) => {
      s.style.animationDuration = '';
    });
    document.querySelectorAll('.scen svg, .scen svg *').forEach((n) => {
      n.style.animationDuration = pa ? '' : (parseFloat(getComputedStyle(n).animationDuration) * 4 || 0) + 's';
    });
    e.target.textContent = pa ? 'Kvartsfart' : 'Full fart';
  });
</script>
</html>`;

writeFileSync(new URL('_prov-rorelse.html', import.meta.url), html);
console.log(`brand/_prov-rorelse.html skrevs. ${RORELSER.length + MARKESRORELSER.length} rörelser.`);
