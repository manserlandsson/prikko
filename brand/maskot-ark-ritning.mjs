/**
 * Konstruktionsritningen, byggd generiskt ur en figurmodul.
 *
 * Poängen med en konstruktionsritning är att nya poser ska kunna ritas utan
 * att karaktären glider. Den ritning som duger till det visar tre saker:
 * vilka former figuren består av, i vilken ordning de ligger, och var de
 * sitter i rutnätet.
 *
 * Den här modulen vet ingenting om enskilda figurer. Den plockar isär den
 * färdiga SVG-strängen i sina former och sätter ihop tre vyer av dem. Det
 * betyder att ritningen aldrig kan komma i otakt med figuren: ändrar någon
 * en bana i figurmodulen ritas ritningen om av sig själv nästa bygge.
 */

/** Plockar ut formelementen ur en svg-sträng, i ritordning. */
export function former(svg) {
  const inre = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const ut = [];
  const re = /<(path|circle|ellipse|rect|polygon)\b[^>]*?\/?>/g;
  let m;
  while ((m = re.exec(inre))) ut.push({ tagg: m[1], kod: m[0] });
  return ut;
}

/** Samma element men som ren kontur, så att formen syns i stället för ytan. */
function kontur(kod, farg = '#007BE0', vikt = 1.1) {
  return kod
    .replace(/\s(fill|stroke|stroke-width|stroke-linecap|opacity)="[^"]*"/g, '')
    .replace(/\/?>$/, ` fill="none" stroke="${farg}" stroke-width="${vikt}" vector-effect="non-scaling-stroke"/>`);
}

/**
 * Rutnätet, lagt över figurens EGEN viewBox.
 *
 * Första versionen ritade alltid ett 120-rutnät oavsett vad figuren hade för
 * viewBox, och då hamnade rutnät och figur i otakt: konturen sköt ut nedanför
 * marklinjen och utanför ramen. Rutnätet räknas nu ur viewBoxen, alltså kan
 * det aldrig hamna fel igen.
 */
function rutnat(vb) {
  const [x0, y0, w, h] = vb.split(/[\s,]+/).map(Number);
  const steg = w / 12;
  const linjer = [];
  for (let i = 1; i < 12; i++) {
    const stark = i % 3 === 0;
    const x = x0 + steg * i;
    const y = y0 + (h / 12) * i;
    linjer.push(`<path d="M${x.toFixed(2)} ${y0}V${(y0 + h).toFixed(2)}" stroke="#D8D8DE" stroke-width="${stark ? 0.6 : 0.3}"/>`);
    linjer.push(`<path d="M${x0} ${y.toFixed(2)}H${(x0 + w).toFixed(2)}" stroke="#D8D8DE" stroke-width="${stark ? 0.6 : 0.3}"/>`);
  }
  const mitt = x0 + w / 2;
  const mark = y0 + h * (116 / 120);
  return `<g>${linjer.join('')}
  <path d="M${mitt.toFixed(2)} ${y0}V${(y0 + h).toFixed(2)}" stroke="#EB0000" stroke-width="0.5" stroke-dasharray="3 3"/>
  <path d="M${x0} ${mark.toFixed(2)}H${(x0 + w).toFixed(2)}" stroke="#EB0000" stroke-width="0.6"/>
  <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="none" stroke="#A1A1A6" stroke-width="0.8"/></g>`;
}

/**
 * Ritningen i tre vyer.
 *  1. Rutnätet med hela figuren som kontur ovanpå, alltså var allt sitter.
 *  2. Formerna en och en, numrerade i ritordning, alltså vad figuren består av.
 *  3. Uppbyggnaden steg för steg, alltså i vilken ordning ytorna läggs.
 */
export function ritning(m, { steg = 6 } = {}) {
  const svg = m.figur({ size: 120 });
  const delar = former(svg);
  const vb = (svg.match(/viewBox="([^"]+)"/) || [null, '0 0 120 120'])[1];

  const ram = (inner, size = 120) =>
    `<svg width="${size}" height="${size}" viewBox="${vb}">${inner}</svg>`;

  // 1. Måttvyn
  const matt = ram(rutnat(vb) + delar.map((d) => kontur(d.kod)).join(''), 300);

  // 2. Formerna en och en, med figurens ytterkontur som svag referens under.
  //    Referensen definieras EN gång som en symbol och pekas på med use. Ritas
  //    den om i varje bricka växer ritningen kvadratiskt med antalet former,
  //    och då blev arket en megabyte utan att bli en enda pixel bättre.
  const spokId = `spok-${m.art ?? 'x'}`;
  const spok = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <symbol id="${spokId}" viewBox="${vb}">
      <g opacity=".12">${delar.map((x) => kontur(x.kod, '#1D1D1F', 0.8)).join('')}</g>
    </symbol></svg>`;
  // Brickorna har ett mellangrått underlag med flit: figurernas vita former,
  // alltså ögonen och munnen, försvann helt mot en vit platta och en tredjedel
  // av rutorna såg tomma ut. En formlista där formerna inte syns bevisar inget.
  const [bx, by, bw, bh] = vb.split(/[\s,]+/).map(Number);
  const platta = `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#9A9AA2"/>`;
  const enskilda = delar.map((d, i) => `<div class="cell">
    ${ram(platta + `<use href="#${spokId}" width="${bw}" height="${bh}" x="${bx}" y="${by}"/>` + d.kod, 78)}
    <span>${i + 1}. ${d.tagg}</span>
  </div>`).join('');

  // 3. Uppbyggnaden, jämnt fördelade steg genom ritordningen
  const punkter = Array.from({ length: steg }, (_, i) =>
    Math.max(1, Math.round(((i + 1) / steg) * delar.length)));
  const bygge = punkter.map((n, i) => `<div class="cell">
    ${ram(platta + delar.slice(0, n).map((d) => d.kod).join(''), 84)}
    <span>Steg ${i + 1}, ${n} av ${delar.length}</span>
  </div>`).join('');

  return `${spok}<div class="block">
  <h4>Konstruktionsritning. ${delar.length} former i 120-rutan</h4>
  <div class="ruta">
    <div class="rad">
      <div>${matt}</div>
      <div class="read" style="max-width:340px">
        <p class="note"><b>Rutnätet</b> går i tiondelar av 120-rutan. Den röda lodräta
        linjen är mittlinjen, den vågräta är marken på y 116. Varje form är ritad som
        kontur så att det syns var den börjar och slutar, inte bara hur den ser ut
        fylld.</p>
        <p class="note">Nya poser ritas genom att flytta befintliga former inom det här
        rutnätet, aldrig genom att rita nya. Det är hela poängen: karaktären glider inte
        så länge formerna är desamma och bara sitter på nya ställen.</p>
        <p class="note">Duolingos egen formbudget säger att 6 former är för abstrakt,
        15 lagom och 30 för många. Den här figuren ligger på <b>${delar.length}</b>.</p>
      </div>
    </div>
  </div>
</div>

<div class="block">
  <h4>Formerna, en och en, i ritordning</h4>
  <div class="ruta"><div class="rutnat">${enskilda}</div></div>
</div>

<div class="block">
  <h4>Uppbyggnaden. Ytorna läggs bakifrån och fram</h4>
  <div class="ruta"><div class="rutnat">${bygge}</div></div>
</div>`;
}
