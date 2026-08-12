/**
 * PROVARK: VARENDA RITNING AV GRÄVLINGEN, SIDA VID SIDA.
 *
 * Kör:  node brand/prov-alla-gravlingar.mjs
 * Skriver: brand/_prov-alla-gravlingar.html
 *
 * ── Varför arket finns ────────────────────────────────────────────────────
 *
 * Ägaren: "fortfarande den enkla prikko grävlingen på många ställen". Domen
 * gick inte att kontrollera, eftersom ingen enda yta visade alla ritningar
 * samtidigt. `faceDetalj()` svarar `rik` för varje storlek, alltså SÅG sajten
 * rätt ut i den enda fil någon hade läst, medan ikonerna satt kvar på sina egna
 * nivåer i en generator som ingen tittade i.
 *
 * Arket löser just det. Det visar två sorters bild och blandar dem aldrig:
 *
 *   PÅ DISK   filen som faktiskt serveras just nu, inläst och inbäddad som den
 *             är. Det är den enda bilden som säger vad en besökare ser.
 *   UR KÄLLAN  samma yta ritad ur brand/maskot/gravling.mjs vid körningen. Det
 *             är vad ytan BLIR nästa gång bygg-face-geometri.mjs körs.
 *
 * Skiljer de två sig är den genererade filen inte omkörd, och det syns då som
 * två olika grävlingar bredvid varandra i stället för som en glömd rad.
 *
 * ── Vad arket prövar, i den ordning frågorna ställdes ────────────────────
 *
 *   1  Alla fyndplatser i sina egna storlekar. Är någon av dem en förenkling
 *      syns det direkt, eftersom den rika står bredvid.
 *   2  Nivåerna mot varandra i sex storlekar, alltså underlaget för frågan om
 *      en favicon i 16 px tekniskt MÅSTE förenklas.
 *   3  Brynen. Major ska vara nära platt, och samma nära platt i varje väg
 *      genom koden.
 *   4  Munnen ensam, `isolera: 'mun'`, i färg och i gråskala. Provet som avgör
 *      om munnen ensam skiljer de tre lägena åt.
 *   5  Munnen mot mulen, uppförstorad, med mulens underkant utritad som en
 *      linje. Talen i figuren såg alla riktiga ut medan felet var uppenbart i
 *      bild, och det är skälet till att linjen ritas i stället för skrivs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HAR = dirname(fileURLToPath(import.meta.url));
const ROT = join(HAR, '..');
const UT = join(HAR, '_prov-alla-gravlingar.html');

const m = await import(`./maskot/gravling.mjs?v=${Date.now()}`);

const LAGEN = ['clean', 'minor', 'major', 'none'];
const NIVAER = ['rik', 'enkel', 'nal'];
const TRE = ['clean', 'minor', 'major'];

/** Läser en fil på disk, eller ger en läsbar platshållare i stället för att dö. */
function disk(rel) {
  try {
    return readFileSync(join(ROT, rel), 'utf8');
  } catch {
    return `<p class="saknas">saknas: ${rel}</p>`;
  }
}

/**
 * Sätter bredd och höjd på ett inläst svg-dokument utan att röra dess viewBox.
 *
 * BARA på rotelementet, och det är inte en detalj. Första försöket plockade
 * bort width och height överallt med ett globalt uttryck, och det åt upp
 * `<rect width="100" height="100">` inne i faviconen. Ikonen blev då helt tom
 * i arket medan app-ikonen bredvid såg riktig ut, eftersom nal-nivån ritar
 * plattan som en rect och enkel-nivån ritar den som en path. Ett prov som tyst
 * ritar fel figur är värre än inget prov.
 */
function skala(svg, px) {
  return svg.replace(/<svg\b[^>]*>/, (rot) =>
    rot.replace(/\s(width|height)="[^"]*"/g, '').replace(/<svg\b/, `<svg width="${px}" height="${px}"`),
  );
}

const cell = (svg, etikett, klass = '') =>
  `<figure class="${klass}"><div class="yta">${svg}</div><figcaption>${etikett}</figcaption></figure>`;

const avsnitt = (nr, rubrik, ingress, kropp) =>
  `<section><h2><span class="nr">${nr}</span>${rubrik}</h2>` +
  `<p class="ingress">${ingress}</p>${kropp}</section>`;

/* ══ 1. FYNDPLATSERNA ═══════════════════════════════════════════════════ */

/** Kartnålen, ritad med samma recept som site/src/lib/kartnal.ts. */
function kartnal(key) {
  const inre = m
    .figur({ size: 100, ton: key, uttryck: key, ansikte: true, detalj: 'rik', platta: 3 })
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
  const platta = (m.PLATTA_TONER[key] || m.PLATTA_TONER.blue)[3];
  const ring = { clean: '#00B92B', minor: '#FECB00', major: '#EB0000', none: '#C7C7CC' }[key];
  const droppe = 'M50 124C50 124 87 74 87 46A37 37 0 1 0 13 46C13 74 50 124 50 124Z';
  return (
    `<svg width="54" height="71" viewBox="0 0 100 132" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><clipPath id="h-${key}"><circle cx="50" cy="46" r="37"/></clipPath></defs>` +
    `<path d="${droppe}" fill="${platta}" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>` +
    `<g clip-path="url(#h-${key})"><g transform="translate(50 46) scale(.74) translate(-50 -50)">${inre}</g></g>` +
    `<path d="${droppe}" fill="none" stroke="${ring}" stroke-width="2" stroke-linejoin="round"/>` +
    `</svg>`
  );
}

const fyndplatser = [
  {
    fil: 'site/public/favicon.svg',
    vad: 'Faviconen. Flikraden, 16 till 32 px.',
    storlekar: [64, 32, 16],
    disk: () => disk('site/public/favicon.svg'),
    kalla: () => m.figur({ size: 100, ton: 'blue', uttryck: 'clean', ansikte: true, detalj: 'rik', platta: 3 }),
  },
  {
    fil: 'site/public/maskot/appikon.svg',
    vad: 'App-ikonen. Underlag för apple-touch-icon.png, 180 px.',
    storlekar: [120, 60, 32],
    disk: () => disk('site/public/maskot/appikon.svg'),
    kalla: () => m.figur({ size: 100, ton: 'blue', uttryck: 'clean', ansikte: true, detalj: 'rik', platta: 3 }),
  },
  {
    fil: 'site/public/maskot/mejl.svg',
    vad: 'Bevakningsmejlets huvud. Helfigur, 72 logiska px.',
    storlekar: [120, 72],
    disk: () => disk('site/public/maskot/mejl.svg'),
    kalla: () => m.figur({ size: 120, ton: 'blue', uttryck: 'soker' }),
  },
];

const fyndKropp = fyndplatser
  .map((f) => {
    const pa = f.storlekar.map((px) => cell(skala(f.disk(), px), `${px} px`)).join('');
    const ur = f.storlekar.map((px) => cell(skala(f.kalla(), px), `${px} px`)).join('');
    return (
      `<div class="fynd"><h3><code>${f.fil}</code></h3><p class="vad">${f.vad}</p>` +
      `<div class="par">` +
      `<div class="halva"><h4>På disk, alltså vad som serveras nu</h4><div class="rad">${pa}</div></div>` +
      `<div class="halva"><h4>Ur källan, alltså vad rik ger</h4><div class="rad">${ur}</div></div>` +
      `</div></div>`
    );
  })
  .join('');

const marketRad = LAGEN.map((l) =>
  cell(m.figur({ size: 52, ton: l, uttryck: l, ansikte: true, detalj: 'rik', platta: 3 }), l),
).join('');
const nalRad = LAGEN.map((l) => cell(kartnal(l), l)).join('');
const friRad = ['clean', 'soker', 'tom', 'fyrafyra']
  .map((p) => cell(m.figur({ size: 96, ton: 'blue', uttryck: p }), p))
  .join('');

const del1 =
  fyndKropp +
  `<div class="fynd"><h3><code>lib/face-geometri.ts</code> via FaceMark, FaceSprite och FaceRef</h3>` +
  `<p class="vad">Bedömningsmärket. Listor, sökträffar och verksamhetssidan.</p>` +
  `<div class="rad">${marketRad}</div></div>` +
  `<div class="fynd"><h3><code>lib/kartnal.ts</code></h3>` +
  `<p class="vad">Kartnålen. Ritas en gång per läge, inte en gång per verksamhet.</p>` +
  `<div class="rad">${nalRad}</div></div>` +
  `<div class="fynd"><h3><code>lib/face-geometri.ts</code> via Maskot.astro</h3>` +
  `<p class="vad">Det fria läget. Helfigur, ett per sida, aldrig i en lista.</p>` +
  `<div class="rad">${friRad}</div></div>`;

/* ══ 2. NIVÅERNA MOT VARANDRA ═══════════════════════════════════════════ */

const STORLEKAR = [96, 52, 32, 24, 16];

const del2 = NIVAER.map((niva) =>
  `<div class="fynd"><h3>${niva}</h3><div class="rad">` +
  STORLEKAR.map((px) =>
    cell(
      TRE.map((l) =>
        m.figur({ size: px, ton: l, uttryck: l, ansikte: true, detalj: niva, platta: 3 }),
      ).join(''),
      `${px} px`,
    ),
  ).join('') +
  `</div></div>`,
).join('');

/* ══ 3. BRYNEN ══════════════════════════════════════════════════════════ */

const brynTal = TRE.map((l) => {
  const b = m.BRYN_LAGE[l];
  const v = b.vinkel.map((x) => (x * m.AMP.vald).toFixed(1));
  return `<tr><td>${l}</td><td>${b.vinkel.join(', ')}</td><td>${v.join(', ')}</td><td>${b.dy.map((x) => x.toFixed(4)).join(', ')}</td></tr>`;
}).join('');

const del3 =
  `<table><thead><tr><th>läge</th><th>grundvinkel</th><th>vid amplitud 1,5</th><th>höjd över ögat</th></tr></thead><tbody>${brynTal}</tbody></table>` +
  NIVAER.map((niva) =>
    `<div class="fynd"><h3>${niva}, enbart brynen skiljer</h3><div class="rad">` +
    TRE.map((l) =>
      cell(
        m.figur({ size: 96, ton: 'blue', uttryck: l, ansikte: true, detalj: niva, platta: 3, isolera: 'bryn' }),
        l,
      ),
    ).join('') +
    `</div></div>`,
  ).join('');

/* ══ 4. MUNNEN ENSAM ════════════════════════════════════════════════════ */

const munRad = (niva, gra) =>
  `<div class="fynd"><h3>${niva}${gra ? ', gråskala' : ''}</h3><div class="rad${gra ? ' gra' : ''}">` +
  STORLEKAR.map((px) =>
    cell(
      TRE.map((l) =>
        m.figur({ size: px, ton: l, uttryck: l, ansikte: true, detalj: niva, platta: 3, isolera: 'mun' }),
      ).join(''),
      `${px} px`,
    ),
  ).join('') +
  `</div></div>`;

const del4 = NIVAER.map((n) => munRad(n, false)).join('') + NIVAER.map((n) => munRad(n, true)).join('');

/* ══ 5. MUNNEN MOT MULEN ════════════════════════════════════════════════ */

/* Mulens underkant, ur figurens egen punktlista.
 *
 * Linjen måste ritas INUTI ansiktets egen grupp och inte ovanpå den färdiga
 * rutan. Det inramade läget bär `translate(50 50)scale(1.2)translate(-51 -55)`,
 * alltså ligger ansiktets y 74,5 på rutans y 73,4. Första försöket ritade
 * linjen i rutans koordinater och lade den därmed tvärs genom mulen, vilket
 * såg ut som exakt den kollision arket är byggt för att upptäcka. Ett prov som
 * hittar ett fel som inte finns är lika värdelöst som ett som missar ett som
 * finns. */
const NOS_UNDER = 74.5;

const del5 = LAGEN.map((l) => {
  const svg = m
    .figur({ size: 100, ton: l, uttryck: l, ansikte: true, detalj: 'rik', platta: 3 })
    .replace(
      '</svg>',
      `<g transform="translate(50 50)scale(1.2)translate(-51 -55)">` +
        `<line x1="0" y1="${NOS_UNDER}" x2="100" y2="${NOS_UNDER}" stroke="#EB0000" stroke-width="0.35"/>` +
        `</g></svg>`,
    );
  return cell(skala(svg, 300), `${l}, röd linje är mulens underkant y ${String(NOS_UNDER).replace('.', ',')}`);
}).join('');

/* ══ DOKUMENTET ═════════════════════════════════════════════════════════ */

const hash = (await import('node:crypto'))
  .createHash('sha256')
  .update(readFileSync(join(HAR, 'maskot', 'gravling.mjs')))
  .digest('hex')
  .slice(0, 12);

const html = `<!doctype html>
<html lang="sv">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prikko: varenda ritning av grävlingen</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; padding: 40px clamp(16px, 4vw, 64px) 120px;
         font: 15px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
         color: #1D1D1F; background: #fff; }
  h1 { font-size: 28px; margin: 0 0 4px; letter-spacing: -0.02em; }
  .meta { color: #6E6E73; margin: 0 0 48px; font-size: 13px; }
  section { margin: 0 0 64px; border-top: 1px solid #E5E5EA; padding-top: 24px; }
  h2 { font-size: 19px; margin: 0 0 6px; display: flex; align-items: baseline; gap: 10px; }
  .nr { display: inline-flex; align-items: center; justify-content: center;
        width: 24px; height: 24px; border-radius: 6px; background: #0A2540; color: #fff;
        font-size: 12px; font-weight: 600; }
  .ingress { color: #6E6E73; margin: 0 0 24px; max-width: 62ch; }
  h3 { font-size: 14px; margin: 0 0 2px; font-weight: 600; }
  h4 { font-size: 12px; margin: 0 0 8px; font-weight: 600; color: #6E6E73;
       text-transform: uppercase; letter-spacing: 0.04em; }
  code { font: 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
         background: #F2F2F7; padding: 2px 5px; border-radius: 4px; }
  .vad { color: #6E6E73; font-size: 13px; margin: 0 0 14px; }
  .fynd { margin: 0 0 34px; }
  .par { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: start; }
  .halva { min-width: 0; }
  .rad { display: flex; flex-wrap: wrap; gap: 22px; align-items: flex-end; }
  .rad.gra { filter: grayscale(1); }
  figure { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .yta { display: flex; align-items: flex-end; gap: 6px; }
  .yta svg { display: block; }
  figcaption { font-size: 11px; color: #8A8A8F; }
  table { border-collapse: collapse; font-size: 13px; margin: 0 0 28px; }
  th, td { text-align: left; padding: 5px 18px 5px 0; border-bottom: 1px solid #E5E5EA; }
  th { color: #6E6E73; font-weight: 600; font-size: 11px;
       text-transform: uppercase; letter-spacing: 0.04em; }
  .saknas { color: #EB0000; font-size: 12px; }
</style>
<h1>Varenda ritning av grävlingen</h1>
<p class="meta">Genererad av <code>brand/prov-alla-gravlingar.mjs</code>.
  Figurens hash: <code>${hash}</code>.
  Vänster halva är filen på disk, alltså vad som serveras nu. Höger halva är
  samma yta ritad ur källan i nivån <code>rik</code>.</p>

${avsnitt(1, 'Fyndplatserna', 'Varje ställe i repot som ritar grävlingen, i den storlek platsen faktiskt kräver. Är en ritning en förenkling syns det som två olika figurer bredvid varandra.', del1)}
${avsnitt(2, 'Nivåerna mot varandra', 'Underlaget för frågan om en favicon i 16 px tekniskt måste förenklas. Tre lägen per ruta, fem storlekar per nivå.', del2)}
${avsnitt(3, 'Brynen', 'Major ska vara nära platt och inte arg. Tabellen visar grundvinklarna och vad amplituden gör med dem, bilderna visar brynen isolerade med allt annat låst till clean.', del3)}
${avsnitt(4, 'Munnen ensam', 'Provet som avgör. Samma ansikte tre gånger där endast munnen skiljer, i färg och i gråskala. Går bedömningen att läsa här bär munnen den.', del4)}
${avsnitt(5, 'Munnen mot mulen', 'Den röda linjen är mulens underkant. Rör munnens bläck linjen läser mun och mule som en form, och då är felet tillbaka.', del5)}
</html>
`;

writeFileSync(UT, html);
console.log(`Skrev ${UT}`);
console.log(`Figurens hash: ${hash}`);
