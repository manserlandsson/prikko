/**
 * Kontrollerar att det PUBLICERADE rutarkivet går att läsa med räckvidd.
 *
 * Kör efter utrullning:
 *
 *     node scripts/kontrollera-rackvidd.mjs
 *     node scripts/kontrollera-rackvidd.mjs https://nagon-annan-vard.example
 *
 * ## Varför det här inte kan vara en bygggrind
 *
 * `scripts/kartrutegrind.mjs` öppnar den färdiga filen i `dist/` och
 * kontrollerar att den är ett giltigt PMTiles-arkiv. Den grinden var grön hela
 * tiden medan kartan var tom i produktion 2026-08-08, och den hade rätt: felet
 * fanns inte i filen.
 *
 * Felet fanns i VÄRDEN. Cloudflare Pages besvarar räckviddsförfrågningar ur sin
 * edge-cache, och ett statiskt Astro-bygge kastar de huvuden en rutt sätter, så
 * vårt `max-age=31536000, immutable` nådde aldrig fram. Pages standard,
 * `max-age=0, must-revalidate`, höll filen utanför cachen, varje förfrågan blev
 * DYNAMIC, och en DYNAMIC-förfrågan svarar 200 med hela filen även när man bett
 * om 128 byte. PMTiles kan då inte hitta en enda ruta.
 *
 * En lokal statisk server svarar 206 utan att blinka. Det är precis därför
 * felet inte syntes förrän det låg live, och därför den här kontrollen måste
 * fråga den riktiga adressen.
 *
 * Rättningen är `public/_headers`. Det här skriptet är mätningen som säger att
 * rättningen sitter kvar.
 */

const bas = (process.argv[2] ?? 'https://prikko.se').replace(/\/$/, '');

function fel(rad) {
  console.error('FEL: ' + rad);
  process.exitCode = 1;
}

/** Arkivets adress läses ur den publicerade sidan, inte ur bygget. Adressen är
 *  innehållsbaserad, så den ändras vid varje datauppdatering, och en hårdkodad
 *  hash här hade blivit fel efter första natten. */
async function arkivadress() {
  const svar = await fetch(`${bas}/stockholm/karta/`);
  if (!svar.ok) throw new Error(`${bas}/stockholm/karta/ svarade ${svar.status}`);
  const html = await svar.text();
  const träff = /data-url="([^"]+\.pmtiles)"/.exec(html);
  if (!träff) throw new Error('hittade ingen data-url med ett pmtiles-arkiv på kartsidan');
  return träff[1];
}

const adress = await arkivadress();
console.log(`arkiv        ${adress}`);

const hel = await fetch(`${bas}${adress}`, { method: 'HEAD' });
const storlek = Number(hel.headers.get('content-length'));
console.log(`hela filen   ${hel.status}, ${storlek.toLocaleString('sv-SE')} byte`);
console.log(`cache        ${hel.headers.get('cache-control')}`);
console.log(`typ          ${hel.headers.get('content-type')}`);
console.log(`accept-range ${hel.headers.get('accept-ranges') ?? 'SAKNAS'}`);

if (hel.status !== 200) fel(`arkivet svarar ${hel.status} på en vanlig förfrågan`);

/*
 * Själva provet. 128 byte är PMTiles-huvudet plus en byte, alltså det allra
 * första läsaren ber om.
 */
const del = await fetch(`${bas}${adress}`, { headers: { Range: 'bytes=0-127' } });
const kropp = await del.arrayBuffer();
console.log(`räckvidd     ${del.status}, ${kropp.byteLength.toLocaleString('sv-SE')} byte`);
console.log(`content-range ${del.headers.get('content-range') ?? 'SAKNAS'}`);

if (del.status !== 206) {
  fel(
    `räckviddsförfrågan gav ${del.status} med ${kropp.byteLength.toLocaleString('sv-SE')} byte i ` +
      'stället för 206 med 128. Kartan hämtar då hela arkivet via reserven i ' +
      'Karta.astro, alltså långsamt men inte trasigt. Kontrollera att ' +
      'public/_headers ger /kartrutor/* ett långt Cache-Control, och att filen ' +
      'faktiskt cachas i kanten (cf-cache-status ska inte vara DYNAMIC).',
  );
} else if (kropp.byteLength !== 128) {
  fel(`räckvidden gav 206 men ${kropp.byteLength} byte i stället för 128`);
}

/* Magin i huvudet. Svarar värden 206 men med fel byte är arkivet inte det vi
   tror, och då hjälper ingen cacheinställning. */
const magi = new TextDecoder().decode(new Uint8Array(kropp).slice(0, 7));
if (del.status === 206 && magi !== 'PMTiles') {
  fel(`de första sju byten är "${magi}" och inte "PMTiles"`);
}

if (process.exitCode) {
  console.error('\nKartan är trasig eller långsam i produktion.');
} else {
  console.log('\nRäckvidd fungerar. Kartan läser rutor ur arkivet som den ska.');
}
