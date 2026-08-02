/**
 * Härleder ett stadskorts gradientfärger UR fotot.
 *
 * Varför: kommunvapen får inte användas (lag 1970:498 om skydd för vapen och
 * vissa andra officiella beteckningar). Ett vapen på kortet skulle dessutom
 * antyda att kommunen står bakom Prikkos bedömningar. Färgen måste därför
 * komma från något vi äger — och fotot är det enda som gör kortet till just
 * den staden. Gradienten blir då en förlängning av bilden i stället för ett
 * lager ovanpå den.
 *
 * Metod
 *   1. Skala ned till 80 px bredd (≈3 600 pixlar — stabila kluster, snabbt).
 *   2. K-means i CIELAB, inte i RGB. RGB-medelvärde blandar himmel och vatten
 *      till lera; Lab ger kluster man känner igen från bilden.
 *   3. Kör klustringen två gånger: en gång på hela bilden (identitet), en
 *      gång på nedre 45 % (det gradienten faktiskt ligger över).
 *   4. Scrimkulören är ett cirkulärt medelvärde av bottenzonens kluster,
 *      viktat på både yta och mättnad — gråa pixlar ska inte få rösta om
 *      kulören. Mättnaden kapas: en scrim ska bära kulör, inte färglägga.
 *   5. Ljusheten låses till 12 % / 24 % och kontrasten mot vit text
 *      verifieras (WCAG 4,5:1) i stället för att gissas.
 *
 * Deterministisk: startpunkterna sprids över L-axeln, ingen slump. Samma
 * bild ger samma värden vid varje körning.
 *
 * Körs manuellt när en ny stadsbild läggs till:
 *   node scripts/palette.mjs ../brand/stockholm.png
 */
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

// --- färgrymder -----------------------------------------------------------

const srgbToLinear = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

function rgbToLab(r, g, b) {
  const [R, G, B] = [r, g, b].map(srgbToLinear);
  let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  let y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  [x, y, z] = [f(x), f(y), f(z)];
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const t =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return t.map((q) => Math.round((q + m) * 255));
}

const hex = (rgb) =>
  '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

const luminance = ([r, g, b]) => {
  const [R, G, B] = [r, g, b].map(srgbToLinear);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

/** Kontrast mot vit text. WCAG kräver 4,5:1 för brödtext. */
const contrastWithWhite = (rgb) => 1.05 / (luminance(rgb) + 0.05);

// --- klustring ------------------------------------------------------------

async function pixels(input) {
  const { data, info } = await sharp(input)
    .resize(80, null, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const px = [];
  for (let i = 0; i < data.length; i += info.channels) {
    const rgb = [data[i], data[i + 1], data[i + 2]];
    px.push({ rgb, lab: rgbToLab(...rgb) });
  }
  return px;
}

function kmeans(px, k) {
  const byLightness = [...px].sort((a, b) => a.lab[0] - b.lab[0]);
  let centroids = Array.from({ length: k }, (_, i) =>
    byLightness[Math.floor(((i + 0.5) / k) * byLightness.length)].lab.slice(),
  );

  let groups = [];
  for (let iteration = 0; iteration < 40; iteration++) {
    groups = Array.from({ length: k }, () => []);
    for (const p of px) {
      let best = 0;
      let bestDistance = Infinity;
      for (let c = 0; c < k; c++) {
        const d =
          (p.lab[0] - centroids[c][0]) ** 2 +
          (p.lab[1] - centroids[c][1]) ** 2 +
          (p.lab[2] - centroids[c][2]) ** 2;
        if (d < bestDistance) { bestDistance = d; best = c; }
      }
      groups[best].push(p);
    }

    let moved = 0;
    for (let c = 0; c < k; c++) {
      if (!groups[c].length) continue;
      const n = groups[c].length;
      const next = [0, 1, 2].map((i) => groups[c].reduce((s, p) => s + p.lab[i], 0) / n);
      moved += next.reduce((s, v, i) => s + Math.abs(v - centroids[c][i]), 0);
      centroids[c] = next;
    }
    if (moved < 0.4) break;
  }

  return groups
    .filter((g) => g.length)
    .map((g) => {
      const n = g.length;
      const rgb = [0, 1, 2].map((i) => g.reduce((s, p) => s + p.rgb[i], 0) / n).map(Math.round);
      return { rgb, hex: hex(rgb), hsl: rgbToHsl(...rgb), share: n / px.length };
    })
    .sort((a, b) => b.share - a.share);
}

// --- härledning -----------------------------------------------------------

export async function derive(file) {
  const { width, height } = await sharp(file).metadata();

  const bottomZone = await sharp(file)
    .extract({
      left: 0,
      top: Math.round(height * 0.55),
      width,
      height: Math.round(height * 0.45),
    })
    // sharp.stats() och raw() läser INDATA, inte pipelinen — zonen måste
    // materialiseras till en buffert innan den kan klustras.
    .png()
    .toBuffer();

  const whole = kmeans(await pixels(file), 6);
  const bottom = kmeans(await pixels(bottomZone), 4);

  let x = 0;
  let y = 0;
  let weight = 0;
  let saturation = 0;
  for (const c of bottom) {
    const w = c.share * (c.hsl[1] / 100 + 0.05);
    x += Math.cos((c.hsl[0] * Math.PI) / 180) * w;
    y += Math.sin((c.hsl[0] * Math.PI) / 180) * w;
    saturation += c.hsl[1] * c.share;
    weight += w;
  }
  let hue = (Math.atan2(y / weight, x / weight) * 180) / Math.PI;
  if (hue < 0) hue += 360;
  const sat = Math.min(saturation * 0.75, 34);

  // Accent: mest kromatiska klustret i mellanljushet — den färg man minns
  // från bilden, inte den som täcker mest yta.
  const accent =
    [...whole]
      .filter((c) => c.hsl[2] > 38 && c.hsl[2] < 78)
      .sort((a, b) => b.hsl[1] - a.hsl[1])[0] ?? whole[0];

  return {
    whole,
    bottom,
    hue: Math.round(hue),
    saturation: Math.round(sat),
    deep: hslToRgb(hue, sat, 12),
    mid: hslToRgb(hue, sat * 0.9, 24),
    accent: accent.rgb,
  };
}

// --- CLI ------------------------------------------------------------------

// pathToFileURL, inte stränginterpolation: sökvägen kan innehålla mellanslag
// och åäö, som måste URL-kodas för att jämförelsen ska gå ihop.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const file of process.argv.slice(2)) {
    const p = await derive(file);
    console.log('\n=== ' + file.split('/').pop() + ' ===');
    console.log('hela bilden');
    for (const c of p.whole) {
      console.log(`  ${c.hex}  ${(c.share * 100).toFixed(1).padStart(5)} %  hsl(${c.hsl.map((v) => v.toFixed(0)).join(', ')})`);
    }
    console.log('nedre 45 %');
    for (const c of p.bottom) {
      console.log(`  ${c.hex}  ${(c.share * 100).toFixed(1).padStart(5)} %  hsl(${c.hsl.map((v) => v.toFixed(0)).join(', ')})`);
    }
    console.log('härlett');
    console.log(`  kulör ${p.hue}°, mättnad ${p.saturation} %`);
    console.log(`  deep   ${hex(p.deep)}  rgb(${p.deep.join(' ')})  vit text ${contrastWithWhite(p.deep).toFixed(1)}:1`);
    console.log(`  mid    ${hex(p.mid)}  rgb(${p.mid.join(' ')})  vit text ${contrastWithWhite(p.mid).toFixed(1)}:1`);
    console.log(`  accent ${hex(p.accent)}  rgb(${p.accent.join(' ')})`);
  }
}
