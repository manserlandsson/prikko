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
  { klass: 'm-ankomst', namn: 'Ankomst', not: 'Kroppen först, huvudet efter, öronen sist. Skuggan hinner ikapp.' },
  { klass: 'm-andas', namn: 'Andning', not: 'Vilan. Går för alltid och ska knappt märkas.', loop: true },
  { klass: 'm-blink', namn: 'Blinkning', not: 'Höger öga tolv millisekunder efter vänster. Ingen blinkar synkront.' },
  { klass: 'm-spana', namn: 'Spaning', not: 'Blicken går ut, huvudet följer efter, öronen sist.' },
  { klass: 'm-spetsa', namn: 'Spetsade öron', not: 'Hovringens läge. Stannar kvar tills pekaren lämnar.' },
  { klass: 'm-nick', namn: 'Nick', not: 'Bekräftelsen. Kort och färdig.' },
  { klass: 'm-titt', namn: 'Titt', not: 'Kikar fram, till exempel ur en tom lista.' },
  { klass: 'm-vinka', namn: 'Vink', not: 'Armen, tassen och huvudet på tre olika kurvor.' },
  { klass: 'm-glad', namn: 'Hopp', ton: 'clean', not: 'Gröna grävlingen. Skuggan krymper i luften.' },
  { klass: 'm-ogonpopp', namn: 'Ögonpopp', ton: 'major', not: 'Röda grävlingen. Ögonvitan går ut, pupillen efter.' },
  { klass: 'm-rok', namn: 'Rök ur öronen', ton: 'major', rekvisita: 'rok', not: 'Röda grävlingen, när det gått för långt.' },
  { klass: 'm-skaka', namn: 'Rysning', not: 'Skakar av sig. Kroppen och öronen ur fas.' },
  { klass: 'm-grav', namn: 'Grävning', not: 'Armarna arbetar, huvudet dyker.' },
  { klass: 'm-gang', namn: 'Gång', not: 'Hela cykeln. Ben, fot, bål, arm, öra och skugga.', loop: true },
  { klass: 'm-lupp', namn: 'Förstoringsglaset', rekvisita: 'lupp', not: 'Detektiven. Ögat bakom glaset förstoras.' },
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

function ruta({ klass, namn, not, ton = 'blue', uttryck, ansikte = false, loop, rekvisita }) {
  const ren = figur({
    size: ansikte ? 100 : 132,
    ton,
    uttryck,
    ansikte,
    detalj: 'rik',
  });
  /* Rekvisitan läggs FÖRE riggningen, så att luppen och röken hamnar inuti
     rot-svg:n och alltså under rörelsens klass. Läggs den efteråt sitter den
     utanför selektorn och rör sig aldrig. */
  const medProps = rekvisita ? medRekvisita(ren, [rekvisita]) : ren;
  const { svg, saknas } = rigga(medProps, { klass });
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
${CSS}
</style>

<h1>Prikko, rörelsekatalogen</h1>
<p class="ingress">Arket läser <code>site/src/styles/maskot-rorelse.css</code> direkt, så det som
syns här är exakt det sajten skickar. Klicka på en ruta för att spela om den, eller kör alla på en gång.</p>
<p class="ingress">Riggen namnger ${RIGGDELAR.length} leder på figuren. Hittar den inte en led står det i rutan.</p>

<div class="rad">
  <button id="alla">Spela alla</button>
  <button id="langsamt">Kvartsfart</button>
</div>

<h2>Figuren</h2>
<div class="rutnat">${RORELSER.map(ruta).join('')}</div>

<h2>Bedömningsmärket</h2>
<div class="rutnat">${MARKESRORELSER.map((r) => ruta({ ...r, ansikte: true })).join('')}</div>

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
