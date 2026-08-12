/**
 * REKVISITA. Former som inte finns i figuren.
 *
 * Två saker, och båda är ägarens egna uppslag: ett förstoringsglas och rök ur
 * öronen. De hör hemma i det FRIA LÄGET och ingen annanstans, alltså 404,
 * tomma lägen och kartans laddyta, där figuren är avsändare och ingen
 * namngiven verksamhet finns i närheten.
 *
 * ── Förstoringsglaset, och varför det är tillåtet nu ────────────────────
 *
 * Ägaren har tidigare underkänt förstoringsglas och detektivhatt, med rätta:
 * det är den slitnaste bildbanksklyschan som finns, och beslutet var att
 * granskandet skulle läsas ur hållning och blick i stället.
 *
 * Det beslutet gällde GRUNDPOSEN, alltså figurens permanenta utseende. Det här
 * är något annat. Luppen plockas fram, används och läggs undan igen, och den
 * finns inte i en enda stillbild. Ett förstoringsglas som sitter fast säger
 * "jag är en detektiv". Ett som plockas fram säger "jag tittar efter", och det
 * senare är vad tjänsten faktiskt gör.
 *
 * Därför är den byggd som en RÖRELSE och aldrig som en pose, och därför ligger
 * den dold tills `m-lupp` hämtar fram den. Se maskot-rorelse.css.
 *
 * ── Placeringen är räknad ur figuren, inte gissad ───────────────────────
 *
 * Huvudet sitter i `translate(57 34) scale(0.62) translate(-51 -52)`, alltså
 * ligger en punkt (x, y) i ansiktets 100-ruta på 57 + (x-51)*0.62 respektive
 * 34 + (y-52)*0.62 i figurens 120-ruta. Ur den formeln:
 *
 *   höger öga, ansiktets cx 71, cy 55   ->  (69,4  35,9)
 *   höger öra, ansiktets cx 76,4 cy 17  ->  (72,7  12,3)
 *   vänster öra, cx 24,6 cy 17          ->  (40,6  12,3)
 *
 * Ändras figurens huvudplacering ska de tre raderna räknas om. Det är också
 * skälet till att formeln står skriven här och inte bara talen.
 */

/** Figurens blå valörer, härledda på samma sätt som toner() i gravling.mjs. */
const BLA = {
  ljus: '#9ecdf3',
  mork: '#005ba6',
  glas: '#d6eafa',
};

/**
 * Förstoringsglaset.
 *
 * Linsen är genomskinlig och inte en fylld skiva: hela poängen är att ÖGAT
 * syns igenom och förstoras bakom den, och en fylld lins hade dolt det som
 * skämtet handlar om. Förstoringen görs i CSS på ögat, inte här.
 *
 * Glaset har ändå en svag ton och en dager, annars läser ringen som en cirkel
 * och inte som ett glas.
 */
export function lupp() {
  return (
    '<g class="r-rekvisita r-rekvisita-lupp">' +
    /* Skaftet ritas FÖRST, så att ringen ligger ovanpå fästet. */
    '<path d="M79.5 46.5L92 61" stroke="' + BLA.mork + '" stroke-width="5.4" stroke-linecap="round" fill="none"/>' +
    '<circle cx="69.4" cy="35.9" r="15.5" fill="' + BLA.glas + '" fill-opacity=".34"/>' +
    /* Dagern. En kort båge uppe till vänster, samma ställe som allt annat ljus
       i figuren kommer ifrån. */
    '<path d="M59.5 27.5A15.5 15.5 0 0 0 55.6 39" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".7"/>' +
    '<circle cx="69.4" cy="35.9" r="15.5" fill="none" stroke="' + BLA.mork + '" stroke-width="4.2"/>' +
    '</g>'
  );
}

/**
 * Röken.
 *
 * Tre puffar per öra. Att de INTE går i takt är hela effekten; två symmetriska
 * rökpelare läser som en maskin och inte som ånga. Fördröjningarna ligger i
 * stilmallen, se `.m-rok .rok-puff:nth-child(n)`.
 *
 * Puffarna ritas i den LJUSA valören och inte i vitt. Vitt är reserverat för
 * ögonvitan i hela figuren, och en vit puff intill ett vitt öga läser som att
 * något gått sönder i ritningen.
 */
export function rok() {
  const puff = (x, y, r) =>
    `<circle class="rok-puff" cx="${x}" cy="${y}" r="${r}" fill="${BLA.ljus}"/>`;
  return (
    '<g class="r-rekvisita r-rekvisita-rok">' +
    /* Vänster öra, (40,6  12,3). */
    puff(40.6, 10.5, 3.4) + puff(38.2, 10.5, 2.6) + puff(42.4, 10.5, 2.1) +
    /* Höger öra, (72,7  12,3). */
    puff(72.7, 10.5, 3.4) + puff(75.1, 10.5, 2.6) + puff(70.6, 10.5, 2.1) +
    '</g>'
  );
}

/**
 * Lägger in rekvisita i en färdig figur, sist inuti rot-svg:n så att den
 * hamnar ÖVER allt annat. Luppen måste ligga över ansiktet för att kunna
 * förstora det, och röken över öronen för att komma ur dem och inte bakom dem.
 *
 * @param {string} svg  utdata ur figur(), gärna redan riggad
 * @param {string[]} vilka  'lupp' och/eller 'rok'
 */
export function medRekvisita(svg, vilka = []) {
  const delar = vilka
    .map((v) => (v === 'lupp' ? lupp() : v === 'rok' ? rok() : ''))
    .join('');
  if (!delar) return svg;
  return svg.replace(/<\/svg>\s*$/, delar + '</svg>');
}

/** Rekvisita som finns, för byggskript och för arket. */
export const REKVISITA = ['lupp', 'rok'];
