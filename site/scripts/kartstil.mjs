/**
 * Bygger Prikkos egen kartstil och skriver den till public/kartstil/prikko.json.
 *
 * Varför en egen stil och inte en av OpenFreeMaps fyra:
 *
 * Positron är CARTO:s och ligger under CC BY, alltså kräver den att CARTO
 * nämns på varje karta. Den är dessutom grå rakt igenom, vilket gör att
 * kartan läser som en bakgrundsbild i stället för som en karta man kan
 * orientera sig i. Bright och Liberty är båda för mättade: en grön park i
 * #d8e8c8 ligger nära nog vår gröna nål för att ögat ska behöva arbeta.
 *
 * Liberty är BSD-3-Clause (OSM Liberty, Lukas Martinelli), alltså fri att
 * bygga vidare på så länge upphovsrättsnoten följer med. Den har också den
 * mest genomarbetade lagerindelningen av de fyra, 111 lager med systematiska
 * id:n, vilket gör den möjlig att färga om regelmässigt i stället för lager
 * för lager.
 *
 * Vad omfärgningen gör: skruvar ned mättnaden i landskapet och skruvar upp
 * kontrasten i vägnätet. Kartans jobb är att säga var man är, nålarnas jobb
 * är att säga vad som finns där. Ingen yta i landskapet får därför ligga nära
 * nålarnas grönt, gult eller grått i mättnad.
 *
 * Kör med `node scripts/kartstil.mjs`. Resultatet checkas in, så bygget har
 * ingen nätberoende. Kör om den när OpenFreeMap ändrar sin lagerindelning.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const KALLA = 'https://tiles.openfreemap.org/styles/liberty';
const UT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'kartstil');

/*
 * Paletten.
 *
 * Utgångspunkten är Apple Maps ljusa läge, som Måns pekade ut: varm off-white
 * mark, vita vägar, dämpad blå vatten, mjuk grön park. Skillnaden mot Apple är
 * att allt grönt och blått här är ett par steg mindre mättat, av skälet ovan.
 */
const F = {
  mark: '#F6F4F1',
  markUpptagen: '#F1EEE9', // bostadsområde, syns bara som en aning mörkare mark
  vatten: '#BBD8E8',
  vattendrag: '#BBD8E8',
  park: '#DCE7D2',
  skog: '#D5E1C8',
  gras: '#DEE8D5',
  sand: '#EFE8D6',
  is: '#ECF1F1',
  begravning: '#DFE4D6',
  sjukhus: '#F1E9E9', // Liberty har #fde, en rosa som skriker på en tyst karta
  skola: '#EEEBE1', // Liberty har rgb(236,238,204), en gulgrön som gör detsamma
  hus: '#EAE6E0',
  husKant: '#DFDAD3',

  // Vägnätet. Vitt fyll och en ljus varm kant, som Apple.
  vag: '#FFFFFF',
  vagKant: '#E7E1D8',
  motorvag: '#FCEFD9', // enda vägtypen med egen ton, så att stommen syns direkt
  motorvagKant: '#E9D8B6',
  mindre: '#FAF8F5',
  mindreKant: '#EAE4DB',
  gangvag: '#E6E0D5',
  rals: '#DAD5CD',

  // Text. En enda grå för allt utom vatten, halo alltid vit.
  text: '#5C5A56',
  textVatten: '#7C9FB8',
  textPlats: '#44423E',
  halo: '#FFFFFF',

  grans: '#D6D1C9',
};

/** Lager-id till färg. Första träffen vinner, så ordningen är betydelsefull. */
const REGLER = [
  [/^background$/, { 'background-color': F.mark }],

  // Vatten före allt annat med "water" i namnet, annars fångar waterway det.
  [/^water$/, { 'fill-color': F.vatten }],
  [/^water/, { 'fill-color': F.vatten, 'line-color': F.vattendrag }],
  [/^waterway/, { 'line-color': F.vattendrag }],

  [/^park/, { 'fill-color': F.park, 'fill-outline-color': F.park, 'line-color': F.park }],
  [/landcover_wood/, { 'fill-color': F.skog }],
  [/landcover_grass/, { 'fill-color': F.gras }],
  [/landcover_sand/, { 'fill-color': F.sand }],
  [/landcover_ice|glacier/, { 'fill-color': F.is }],
  [/landuse_cemetery|landuse_pitch|landuse_track/, { 'fill-color': F.begravning }],
  [/landuse_hospital/, { 'fill-color': F.sjukhus }],
  [/landuse_school/, { 'fill-color': F.skola }],
  [/landuse_residential/, { 'fill-color': F.markUpptagen }],
  [/^landuse|^landcover/, { 'fill-color': F.markUpptagen }],

  [/building/, { 'fill-color': F.hus, 'fill-outline-color': F.husKant, 'fill-extrusion-color': F.hus }],

  // Vägar. Casing först i regellistan hade fångat även fyllet, så de skiljs åt
  // på att id:t slutar på _casing.
  [/(motorway|trunk)_casing$/, { 'line-color': F.motorvagKant }],
  [/motorway|trunk/, { 'line-color': F.motorvag }],
  [/(service|track|path|pedestrian)_casing$/, { 'line-color': F.mindreKant }],
  [/service|track/, { 'line-color': F.mindre }],
  [/path|pedestrian/, { 'line-color': F.gangvag }],
  [/_casing$/, { 'line-color': F.vagKant }],
  [/rail/, { 'line-color': F.rals }],
  [/^road|^bridge|^tunnel/, { 'line-color': F.vag }],

  [/boundary/, { 'line-color': F.grans }],

  [/water.*(label|name)|(label|name).*water/, { 'text-color': F.textVatten, 'text-halo-color': F.halo }],
  [/place|country|state|continent/, { 'text-color': F.textPlats, 'text-halo-color': F.halo }],
  [/label|name|^poi|housenumber/, { 'text-color': F.text, 'text-halo-color': F.halo }],
];

function fargom(lager) {
  const regel = REGLER.find(([m]) => m.test(lager.id));
  if (!regel) return;
  const [, farger] = regel;
  const paint = lager.paint;
  if (!paint) return;
  for (const [nyckel, varde] of Object.entries(farger)) {
    // Skriv bara nycklar som lagret faktiskt har. Att lägga till en
    // fill-color på ett line-lager är ogiltigt och får MapLibre att kasta.
    if (nyckel in paint) paint[nyckel] = varde;
  }
}

const svar = await fetch(KALLA);
if (!svar.ok) throw new Error(`${KALLA} svarade ${svar.status}`);
const stil = await svar.json();

/*
 * Reliefen bort. ne2_shaded är en rasterkälla som bara syns under zoom 6, och
 * vi öppnar alltid kartan zoomad till en kommun. Den kostar alltså en extra
 * källa och en handfull PNG-anrop utan att någon ser den.
 */
delete stil.sources.ne2_shaded;
stil.layers = stil.layers.filter((l) => l.source !== 'ne2_shaded');

for (const lager of stil.layers) fargom(lager);

stil.name = 'Prikko';
stil.metadata = {
  'prikko:bygge': 'scripts/kartstil.mjs',
  'prikko:grund': 'OSM Liberty via OpenFreeMap, BSD-3-Clause, Lukas Martinelli',
};

await mkdir(UT, { recursive: true });
const fil = join(UT, 'prikko.json');
await writeFile(fil, JSON.stringify(stil));

const trafffar = stil.layers.filter((l) => REGLER.some(([m]) => m.test(l.id))).length;
console.log(`${fil}: ${stil.layers.length} lager, ${trafffar} omfärgade`);
