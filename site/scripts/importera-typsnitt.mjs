/**
 * Drar ut glyfkonturer ur Instrument Sans till en genererad modul.
 *
 * ============================================================================
 * VARFÖR DET HÄR SKRIPTET FINNS
 * ============================================================================
 *
 * Fönsterdekalen, arket och certifikatet lämnar sajten. De hamnar hos ett
 * tryckeri, i ett ritprogram och på en kontorsskrivare, och där finns inte vårt
 * typsnitt. En `<text>` med `font-family="Instrument Sans, Helvetica, Arial"`
 * blir därför Helvetica i praktiken, alltså vårt varumärke satt i någon annans
 * typsnitt, på en dekal i en restaurangs fönster.
 *
 * Det är samma sak tryckerier alltid gjort åt problemet: göra om texten till
 * KONTURER. En kontur är en `<path>` och inte en bokstav, alltså finns ingen
 * font att sakna och filen ser identisk ut i varje renderare.
 *
 * Alternativet, att baka in hela fontfilen som base64, är avvisat på storleken.
 * `instrument-sans-latin-wght-normal.woff2` är 24 kB komprimerad men måste
 * ligga som base64 i varje fil, och base64 växer med en tredjedel. Konturerna
 * för de tecken som faktiskt används är i storleksordningen en kilobyte per
 * dekal.
 *
 * ============================================================================
 * VARFÖR ETT SKRIPT OCH INTE ETT STEG I BYGGET ELLER I FUNKTIONEN
 * ============================================================================
 *
 * Samma svar som scripts/importera-marke.mjs ger för märkets ritning, och av
 * samma tre skäl.
 *
 * INTE I FUNKTIONEN. `functions/api/marke.ts` körs i en Cloudflare Worker. Där
 * finns ingen fontparser, inget filsystem och ingen anledning att packa upp en
 * woff2 vid varje hämtning av en dekal.
 *
 * INTE VID BYGGET. Datan ändras bara när typsnittet byts eller när nya tecken
 * behöver täckas, alltså ungefär aldrig. Att packa upp och tolka en font vid
 * varje bygge är arbete för ett resultat som är identiskt varje gång.
 *
 * SOM EN GENERERAD MODUL, incheckad. Då är den granskningsbar, den kan inte
 * fälla ett bygge, och den fortsätter fungera även om fontkitten skulle
 * försvinna ur trädet. Se nästa stycke om varför det sista inte är en teoretisk
 * oro.
 *
 * ============================================================================
 * BEROENDET, ÄRLIGT: FONTKITTEN ÄR ASTROS OCH INTE VÅR
 * ============================================================================
 *
 * `fontkitten` står INTE i vår package.json. Den ligger i node_modules därför
 * att Astro drar in den, genom `@capsizecss/unpack` och `fontace`, för sitt
 * eget typsnittsstöd. Vi lånar alltså någon annans beroende.
 *
 * Det är medvetet och det är därför utdraget sker HÄR och inte i bygget. Skulle
 * Astro byta bibliotek slutar det här skriptet gå att köra, och ingenting
 * annat händer: den genererade modulen ligger kvar och sajten byggs som
 * vanligt. Först den dag någon vill dra ut nya tecken behöver frågan lösas, och
 * då är svaret en rad i package.json.
 *
 * ============================================================================
 * VARFÖR BARA VIKT 400
 * ============================================================================
 *
 * Instrument Sans är en variabel font med en vikt-axel från 400 till 700, och
 * fontsource levererar bara den variabla filen. Att läsa vikt 500 eller 700 ur
 * den kräver att fontens gvar-deltan appliceras, alltså en instansiering.
 *
 * fontkitten har ett `getVariation()`, och det FUNGERAR INTE för woff2. Mätt
 * 2026-08-31: metoden bygger en ny TTFFont ur `this.stream.buffer`, vilket för
 * en woff2 är den brotlipackade behållaren och inte en TTF. Fonten som kommer
 * tillbaka saknar maxp, cmap och glyf, och varje uppslag kastar. Att i stället
 * konstruera den interna klassen med variationskoordinater direkt kastar på
 * privata fält.
 *
 * Alltså finns bara standardinstansen, alltså vikt 400. Konsekvensen bärs av
 * lib/dekal.ts, som sätter hierarki med storlek och färg i stället för med
 * vikt. Vill vi ha fet text i de här filerna krävs ett riktigt beroende, och
 * frågan står i docs/48.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { create } from 'fontkitten';

/**
 * Delmängderna, i prioritetsordning.
 *
 * `latin` täcker U+0000 till U+00FF, alltså å, ä, ö och é. `latin-ext` ligger
 * med för att ett verksamhetsnamn kan bära ett tecken vi inte tänkt på: mätt
 * över 254 vinnare, 13 kommunnamn och samtliga fasta rader behövs 78 tecken,
 * varav ett enda, U+2019, ligger utanför latin. Att dra ut båda kostar 92 kB
 * före avrundning och gör att en framtida Č inte blir en tom ruta.
 */
const SUBSETS = ['latin', 'latin-ext'];
const KALLA = (s) =>
  `node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-${s}-wght-normal.woff2`;
const MAL = 'src/typsnitt/instrument-sans-400.ts';

/**
 * Avrundning till hela fontenheter.
 *
 * Fonten har 1 000 enheter per em. En enhet är alltså en tusendels
 * teckengrad, vilket vid certifikatets 11 mm är 0,011 mm och vid dekalens
 * minsta rad 0,0025 mm. Inget tryckeri i världen ser det, och avrundningen
 * tar bort ungefär en tredjedel av filens storlek.
 */
function runda(d) {
  return d.replace(/-?\d+(\.\d+)?/g, (n) => String(Math.round(Number(n))));
}

const glyfer = new Map();
let upem = null;

for (const subset of SUBSETS) {
  const font = create(readFileSync(KALLA(subset)));
  upem ??= font.unitsPerEm;
  if (font.unitsPerEm !== upem) {
    throw new Error(`${subset} har ${font.unitsPerEm} enheter per em, inte ${upem}.`);
  }
  for (const cp of font.characterSet) {
    /* Styrtecken har ingen kontur och ingen mening i en dekal. */
    if (cp < 0x20) continue;
    if (glyfer.has(cp)) continue;
    const g = font.glyphForCodePoint(cp);
    /* Glyf 0 är .notdef, alltså rutan som betyder "det här tecknet saknas". Den
       ska aldrig hamna i tabellen: en saknad bokstav ska upptäckas av
       lib/kontur.ts och rapporteras, inte tryckas som en ruta. */
    if (!g || g.id === 0) continue;
    glyfer.set(cp, [g.advanceWidth, runda(g.path.toSVG())]);
  }
}

const rader = [...glyfer.entries()]
  .sort((a, b) => a[0] - b[0])
  .map(([cp, [adv, d]]) => `  ${cp}: [${adv}, ${JSON.stringify(d)}],`)
  .join('\n');

const ut = `/**
 * Instrument Sans, vikt 400, som konturer. GENERERAD FIL, redigera den inte.
 *
 * Skriven av scripts/importera-typsnitt.mjs ur
 * @fontsource-variable/instrument-sans. Det skriptets huvud förklarar varför
 * konturer och inte text, varför en genererad modul och inte ett byggsteg, och
 * varför bara vikt 400.
 *
 * Typsnittet är licensierat under SIL Open Font License 1.1. Licensen tillåter
 * att glyfer bakas in i ett dokument; villkoret som gäller oss är att den
 * omarbetade fonten inte får heta Instrument Sans. Det här är inte en font utan
 * konturer i ett dokument, och namnet står här som upphovsuppgift och inte som
 * varumärke: Copyright 2022 The Instrument Sans Project Authors.
 *
 * Formen är kodpunkt: [teckenbredd, path-data]. Båda i fontenheter, alltså
 * ${'${UPEM}'} per em, med y uppåt som i alla fonter. lib/kontur.ts vänder axeln.
 */
export const family = 'Instrument Sans';
export const weight = 400;
export const unitsPerEm = ${upem};

/** Kodpunkt till [teckenbredd, konturens d-attribut]. */
export const glyphs: Record<number, [number, string]> = {
${rader}
};
`.replace('${UPEM}', String(upem));

writeFileSync(MAL, ut);
console.log(
  `${MAL}: ${glyfer.size} glyfer, ${(ut.length / 1024).toFixed(1)} kB, ${upem} enheter per em.`,
);
