/**
 * Bedömningsmärkets kontrast. Fem vägar, mätta i stället för tyckta.
 *
 * Diagnosen är ägarens egen och den är riktig: "jag tror varför
 * bedömnigsmärkena ser katastrof ut är för deras huvud sätts mot samma
 * bakgrund som märket, något måste ändra lite i nyans, eller ngt för att
 * kunna se".
 *
 * Precis så. I det första inramade förslaget fyllde vi ramen med figurens
 * EGEN grundton, för att härma Duolingos app-ikon. Det fungerar för Duo
 * eftersom Duos ansikte har en ljusare ögonmask, en gul näbb och en mörk
 * pupill inuti det gröna fältet, alltså fyra värden i rutan. Vår figur har
 * i det läget ett enda värde plus vitt, och då blir märket en klump.
 *
 * Dagens FaceMark löser det med brutal enkelhet: rutan bär bedömningsfärgen
 * som ETT helt fält och ansiktet är urstansat i vitt. Två värden, maximal
 * kontrast, läsbart i vilken storlek som helst. Frågan är om det går att
 * behålla den kontrasten och ändå få plats med ett djur.
 *
 * Den här modulen ritar fem svar på den frågan ur samma figurmodul, utan att
 * veta något om figuren. Den läser ut fyllningarna ur den färdiga
 * SVG-strängen, sorterar dem på ljushet, och färgar om dem enligt varje
 * recept. Ändrar figuren sig ritas jämförelsen om av sig själv.
 */

/* Sajtens egna värden. Ur tokens.css och face.ts, inga nya färger. */
export const BAS  = { blue: '#007BE0', clean: '#00B92B', minor: '#FECB00', major: '#EB0000' };
export const MORK = { blue: '#0063B4', clean: '#009523', minor: '#DEB201', major: '#C50000' };

export const BAKGRUND = [
  ['#FFFFFF', 'Vitt kort'],
  ['#FCFCFD', 'Canvas'],
  ['#EBF4FD', 'Tonad blå'],
];

/* ── Färghjälp ───────────────────────────────────────────────────────── */

const tal = (h) => {
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const n = parseInt(s.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hex = (a) =>
  '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

export const blanda = (a, b, t) => hex(tal(a).map((v, i) => v + (tal(b)[i] - v) * t));

/** Relativ luminans enligt WCAG. Används både för att sortera tonerna och
 *  för att räkna ut kontrastkvoter, så att arket kan visa tal och inte tyckande. */
export function luminans(h) {
  const [r, g, b] = tal(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function kontrast(a, b) {
  const [x, y] = [luminans(a), luminans(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/* ── Omfärgning ──────────────────────────────────────────────────────── */

/** Alla fyllningar i en svg-sträng, i den ordning de dyker upp. */
function fyllningar(svg) {
  const ut = new Set();
  const re = /fill="(#[0-9a-fA-F]{3,8})"/g;
  let m;
  while ((m = re.exec(svg))) ut.add(m[1].toLowerCase());
  return [...ut];
}

function byt(svg, karta) {
  let ut = svg;
  for (const [fran, till] of Object.entries(karta)) {
    ut = ut.replaceAll(`fill="${fran}"`, `fill="${till}"`);
    ut = ut.replaceAll(`fill="${fran.toUpperCase()}"`, `fill="${till}"`);
    ut = ut.replaceAll(`stroke="${fran}"`, `stroke="${till}"`);
    ut = ut.replaceAll(`stroke="${fran.toUpperCase()}"`, `stroke="${till}"`);
  }
  return ut;
}

/* ── De fem recepten ─────────────────────────────────────────────────── */

export const RECEPT = {
  ingenplatta: {
    namn: 'A. Ingen platta',
    kort: 'Figuren i tillståndets färg, genomskinlig botten. Färgen sitter på det man tittar på, inte bakom det.',
    varde: 'Karaktären helt kvar. Ingen krock mellan figurens färg och plattans.',
    pris: 'Ingen yta som bär färgen på håll, och ingen ram som håller ihop märket i en tät lista.',
  },
  tonadplatta: {
    namn: 'B. Tonad platta',
    kort: 'Figuren i tillståndets färg på en mycket ljus ton av samma färg, 10 procent.',
    varde: 'Märket får en kropp i en lista utan att plattan slåss med figuren.',
    pris: 'Den tonade plattan syns knappt mot vitt kort, och tappar nästan helt i gråskala.',
  },
  duo: {
    namn: 'C. Duos väg',
    kort: 'Fylld platta i tillståndets färg, figuren i en LJUSARE ton av samma färg.',
    varde: 'Figur och platta är alltid samma kulör, så krocken kan inte uppstå. Närmast Duo.',
    pris: 'Kontrasten mellan figur och platta är per definition liten, eftersom de är samma färg.',
  },
  duomork: {
    namn: 'D. Duos väg, omvänd',
    kort: 'Fylld platta i tillståndets färg, figuren i en MÖRKARE ton av samma färg.',
    varde: 'Samma logik som C men med större valörskillnad, eftersom mörkt mot mättat skiljer sig mer än ljust mot mättat i gult och grönt.',
    pris: 'I rött blir figuren nästan svart.',
  },
  urstans: {
    namn: 'E. Urstans, dagens recept',
    kort: 'Fältet helt i bedömningsfärgen, bara ögon och mun urstansade i vitt. Referensen.',
    varde: 'Två värden, maximal kontrast, läsbart i vilken storlek som helst.',
    pris: 'Djuret finns inte. Detta är dagens märke med ett djur som inte syns.',
  },
};

/**
 * Färgar om en ansiktssvg enligt ett recept.
 * Returnerar { svg, ram, kontrastFigurRam, kontrastDragRam }.
 */
export function omfarga(ansiktssvg, ton, recept) {
  const bas = BAS[ton] ?? BAS.blue;
  const mork = MORK[ton] ?? MORK.blue;
  const alla = fyllningar(ansiktssvg);

  // Dela upp i drag (nästan vitt) och päls (allt annat), pälsen sorterad ljust till mörkt.
  const drag = alla.filter((c) => luminans(c) > 0.85);
  const pals = alla.filter((c) => luminans(c) <= 0.85).sort((a, b) => luminans(b) - luminans(a));

  const karta = {};
  let ram = 'none';
  let figurfarg = bas;
  let dragfarg = '#ffffff';

  if (recept === 'ingenplatta') {
    // Figuren bär färgen. Ljusaste pälstonen blir grundfärgen, de mörkare
    // blir mörkare släktingar. Dragen står kvar vita och läser mot figuren.
    pals.forEach((c, i) => { karta[c] = i === 0 ? bas : blanda(bas, '#000000', 0.22 + (i - 1) * 0.14); });
    ram = 'none';
    figurfarg = bas;
  } else if (recept === 'tonadplatta') {
    pals.forEach((c, i) => { karta[c] = i === 0 ? bas : blanda(bas, '#000000', 0.22 + (i - 1) * 0.14); });
    ram = blanda(bas, '#ffffff', 0.90);
    figurfarg = bas;
  } else if (recept === 'duo') {
    // Duos eget upplägg: plattan i grundfärgen, figuren i en ljusare ton av
    // SAMMA färg. Figur och platta kan därför aldrig krocka i kulör.
    pals.forEach((c, i) => { karta[c] = blanda(bas, '#ffffff', 0.34 - i * 0.17); });
    ram = bas;
    figurfarg = blanda(bas, '#ffffff', 0.34);
  } else if (recept === 'duomork') {
    pals.forEach((c, i) => { karta[c] = blanda(bas, '#000000', 0.30 + i * 0.14); });
    ram = bas;
    figurfarg = blanda(bas, '#000000', 0.30);
  } else if (recept === 'urstans') {
    for (const c of pals) karta[c] = bas;
    ram = bas;
    figurfarg = bas;
  }

  return {
    svg: byt(ansiktssvg, karta),
    ram,
    kFigurRam: ram === 'none' ? kontrast(figurfarg, '#ffffff') : kontrast(figurfarg, ram),
    kDragFigur: kontrast(dragfarg, figurfarg),
  };
}
