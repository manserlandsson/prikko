/**
 * Rörelsen. Bildrutor, inte transformer.
 *
 * Ägarens dom över första försöket: "ren css ser wack ut". Han har rätt, och
 * skälet är tekniskt och inte estetiskt.
 *
 * En CSS-transform kan flytta, skala och rotera former som REDAN FINNS. Den
 * kan inte ändra en form. En figur vars enda rörelse är transform blir därför
 * en pappersdocka på en pinne: allt glider och roterar, ingenting böjs.
 * Det är precis den känslan av billigt.
 *
 * Tre vägar övervägdes:
 *
 *  1. BILDRUTOR med steps(). Figuren ritas i åtta lägen och rutorna växlas.
 *     Samma teknik som klassisk tecknad film. Noll JavaScript, noll körtid,
 *     och den enda som ger kontroll över tajmingen mellan enskilda rutor.
 *     VALD för figurens egen rörelse.
 *  2. SMIL, alltså <animate> på attribut. Kan det CSS inte kan: ändra ett
 *     attribut som r eller d, alltså faktisk formändring. VALD för blinkningen,
 *     där en pupill som krymper i höjd är en formändring och inte en flytt.
 *  3. RIVE. Byggt för precis det här och ger högst kvalitet, men lägger en
 *     körtid på en sajt vars bärande princip är att inte skicka JavaScript.
 *     VALD BORT, eftersom 1 och 2 räcker. Lottie var aldrig aktuellt, det är
 *     tyngre än Rive och löser inget som Rive inte löser bättre.
 *
 * Det som avgör om en loop ser dyr eller billig ut är tajmingen, inte antalet
 * rutor. En ren steps(8) håller varje ruta exakt lika länge, och det är den
 * jämnheten ögat läser som mekaniskt. Därför genereras keyframes här ur en
 * håll-tid per ruta, så att kontaktlägena kan ligga kvar längre än
 * passeringarna. Det är hela skillnaden.
 */

/** Reservtajming om figurmodulen inte levererar en egen. Ojämn med flit. */
export const GANG_STANDARD = { rutor: 8, halltid: [90, 70, 70, 110, 90, 70, 70, 110] };

/**
 * Bygger keyframes där varje bildruta får sin egen andel av loopen.
 * Hårda klipp, alltså inga mellanlägen: varje värde upprepas i början och
 * slutet av sin andel, vilket ger samma effekt som steps() men med olika
 * långa steg.
 */
export function gangKeyframes(namn, { rutor, halltid }, bredd) {
  const total = halltid.reduce((a, b) => a + b, 0);
  let t = 0;
  const rader = [];
  for (let i = 0; i < rutor; i++) {
    const fran = (t / total) * 100;
    t += halltid[i];
    const till = (t / total) * 100;
    const x = -bredd * i;
    // Slutprocenten dras in en tusendel så att klippet blir hårt.
    rader.push(`  ${fran.toFixed(3)}%, ${(till - 0.001).toFixed(3)}% { transform: translate3d(${x}px, 0, 0); }`);
  }
  rader.push(`  100% { transform: translate3d(${-bredd * (rutor - 1)}px, 0, 0); }`);
  return `@keyframes ${namn} {\n${rader.join('\n')}\n}`;
}

/**
 * Blinkningen som SMIL. Letar upp de vita cirklarna i ansiktet, alltså
 * prickögonen, och lägger en animate på deras radie.
 *
 * Radien är en FORM, inte en position. Det är därför den här raden gör något
 * CSS inte kan, och det är därför blinkningen läser som ett ögonlock i stället
 * för som en hopklämd bild.
 *
 * Tajmingen: ögat är öppet i drygt fem sekunder, stängs på 60 ms och öppnas på
 * 90 ms. Att öppningen är långsammare än stängningen är det som gör att det
 * läser som en blinkning och inte som ett glitch.
 */
export function blinkSmil(svg, { period = 5.4 } = {}) {
  const ned = 0.06 / period;
  const upp = 0.09 / period;
  return svg.replace(
    /<circle([^>]*?)fill="#f{3,6}"([^>]*?)\/>/gi,
    (hel, fore, efter) => {
      const r = (hel.match(/\br="([\d.]+)"/) || [])[1];
      if (!r) return hel;
      const utan = hel.replace(/\/>$/, '>');
      const nyckel = [0, 1 - ned - upp, 1 - upp, 1].map((v) => v.toFixed(4)).join(';');
      return `${utan}<animate attributeName="r" dur="${period}s" repeatCount="indefinite"
        values="${r};${r};${(+r * 0.12).toFixed(2)};${r}" keyTimes="${nyckel}"
        calcMode="spline" keySplines=".4 0 .6 1;.9 0 1 1;0 0 .2 1"/></circle>`;
    }
  );
}

/**
 * Bildruteremsan. Fönstret är en ruta, remsan är alla rutor på rad, och
 * keyframesen flyttar remsan i hårda klipp.
 */
export function remsa(rutor, { size = 120, namn, klass = '' } = {}) {
  return `<div class="rutfonster ${klass}" style="width:${size}px;height:${size}px">
  <div class="rutremsa" style="width:${size * rutor.length}px;animation-name:${namn}">${rutor.join('')}</div>
</div>`;
}

/** CSS som hör till bildruteremsan. Läggs en gång i arket. */
export const REMSA_CSS = `
.rutfonster { overflow: hidden; position: relative; }
.rutremsa {
  display: flex;
  animation-duration: .58s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
  will-change: transform;
}
.rutremsa > svg { flex: none; display: block; }

/* Springrundan: bildruteloopen inuti, förflyttningen utanpå. Två animationer
   på två element, aldrig på samma, annars slåss de om transform. */
.spring-yta { position: relative; overflow: hidden; height: 150px; }
.spring-yta > .lopare { position: absolute; bottom: 8px; left: 0; animation: spring-tvars 7.5s linear infinite; }
@keyframes spring-tvars {
  0%   { transform: translateX(0) scaleX(1); }
  47%  { transform: translateX(calc(100vw - 0px)) scaleX(1); }
  47.5%{ transform: translateX(calc(100vw - 0px)) scaleX(-1); }
  95%  { transform: translateX(0) scaleX(-1); }
  100% { transform: translateX(0) scaleX(1); }
}

@media (prefers-reduced-motion: reduce) {
  .rutremsa { animation: none !important; }
  .spring-yta > .lopare { animation: none !important; left: 50%; }
}
`;
