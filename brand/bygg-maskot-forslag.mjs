/**
 * Bygger maskotarket: fem tolkningar av Prikkos maskot.
 * Kör:  node brand/bygg-maskot-forslag.mjs   ->  brand/maskot-forslag.html
 *
 * Bakgrund. Fem tidigare förslag är underkända. Det senaste beskedet var
 * "det är på god väg men fortsatt ej bra, det ska vara tydligt men också
 * supersnyggt eller kul liksom", plus preciseringen att munnen och ögonen
 * är maskotens kärna.
 *
 * Arbetssättet den här gången: research först i Duolingos egna publicerade
 * SVG-filer och i USPTO:s register, sedan fem tolkningar ritade OBEROENDE av
 * varandra av var sin agent som inte såg de andras arbete, sedan urval.
 * Bredd först, förfining sedan. Att förfina en enda idé som inte bär är det
 * som gjorde de tidigare omgångarna medelmåttiga.
 *
 * Varje figur bor i brand/maskot/<art>.mjs och följer samma kontrakt:
 *   META, UTTRYCK och figur({ size, ton, uttryck, siluett, ansikte, klass }).
 * Byggskriptet vet därför ingenting om enskilda figurer och kan visa vilken
 * som helst av dem i alla prov.
 */
import { writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STIL } from './maskot-ark-stil.mjs';
import { INGRESS, RESEARCH, FALTET, LAGEN, DETEKTIV, BETYDELSE, VARUMARKE, NAMN, REGLER, DUOJAMFORELSE, OGONEN, INKOPPLING } from './maskot-ark-text.mjs';
import { ritning } from './maskot-ark-ritning.mjs';
import { RECEPT, omfarga, BAKGRUND, kontrast } from './maskot-ark-marke.mjs';
import { GANG_STANDARD, gangKeyframes, blinkSmil, remsa, REMSA_CSS } from './maskot-ark-rorelse.mjs';
import { baraMunnen, BREDD, TJOCKLEK, RADIE, RIKTNING, pilhojd } from './maskot-mun.mjs';

const HAR = dirname(fileURLToPath(import.meta.url));

/* Urvalet är öppnat på nytt. Kameleonten är den enda som är död, och den föll
   på betydelse och inte på form: SAOB ger kameleont om en person som "med egen
   fördel för ögonen, ändrar mening", alltså anpassling, och Singapores
   bankförening använder sedan 2024 en kameleont som BEDRAGAREN i sin
   antibedrägerimaskot, alltså i vår kategori med omvänd symbolik.

   Ordningen här är inte en rangordning. Den figur som ritats om enligt den nya
   metoden, alltså med riktiga ögon, står först. */
/* Ägaren har valt. Grävlingen är maskoten, allt annat är historik och raderas
   inte men får ingen mer tid. */
const ARTER = ['gravling'];
const HISTORIK = ['utter', 'vatte', 'tvattbjorn', 'hund', 'kameleont'];
/* Kandidater delas automatiskt: den som har META.raka är omritad enligt den
   omvända metoden, alltså med riktiga ögon, och tävlar på nya villkor. Den
   som saknar fältet är kvar i sin gamla form och visas kort, eftersom den
   inte är jämförbar förrän den fått ögon. */
const arOmritad = (m) => typeof m.META?.raka === 'number';
const FALLNA = [];
const FALLSKAL = {
  kameleont: 'Ägarens eget uppslag, och det enda djur där färgbytet är artens egenskap. Föll på språket och inte på formen: SAOB ger kameleont om en person som "med egen fördel för ögonen, ändrar mening eller uppträder helt olika allt efter omständigheterna", alltså anpassling och opportunist. Vår tjänst går ut på motsatsen. Dessutom lanserade Singapores bankförening 2024 antibedrägerimaskoten Leon the Skameleon, där kameleonten står för BEDRAGAREN som byter färg för att smälta in. Det är konsumentskydd, alltså vår kategori, med rakt motsatt symbolik. SUSE äger dessutom kameleonten i teknikvärlden sedan 2000.',
};

const TONER = ['clean', 'minor', 'major'];
const TON_ETIKETT = {
  clean: 'Inga anmärkningar',
  minor: 'Brister',
  major: 'Brister som kvarstår',
};

async function las(art) {
  const fil = join(HAR, 'maskot', `${art}.mjs`);
  if (!existsSync(fil)) return null;
  try {
    const m = await import(`./maskot/${art}.mjs`);
    if (typeof m.figur !== 'function' || !m.META || !m.UTTRYCK) {
      console.warn(`  ${art}: uppfyller inte kontraktet, hoppas över`);
      return null;
    }
    return { art, ...m };
  } catch (e) {
    console.warn(`  ${art}: gick inte att läsa, ${e.message}`);
    return null;
  }
}

/* ── De två lägena ───────────────────────────────────────────────────────
 *
 * Ägaren: "vår nuvarande maskot är ju bara en ruta med rundade hörn och en
 * smiley på, vi hade ju fortsatt kunna hålla oss till den strukturen, lite
 * som duolingo också gör".
 *
 * Det är precis rätt, och det är också vad Duolingo bevisligen gör: deras
 * app-ikon är inte Duo förminskad, den är ANSIKTET beskuret i en rundad
 * kvadrat tills ögonmasken går kant i kant, medan hela figuren lever fritt
 * inne i appen. Kropp, vingar, öron, fötter och en färgnyans offras.
 *
 * Alltså två lägen av samma karaktär, inte två figurer:
 *
 *   INRAMAT LÄGE  ansiktet beskuret i den rundade kvadraten. Det HÄR är
 *                 bedömningsmärket. Listor, kartnålar, sökträffar, favicon.
 *                 Ramen är FaceMark.astro:s egen: 100-ruta, rx 17.
 *   FRITT LÄGE    hela figuren, ingen ram, kropp och lemmar. Den som springer,
 *                 står på tomma sidor och på 404. Här bor personligheten.
 *
 * Tricket som får det inramade läget att sitta ihop är samma som Duolingos:
 * ramens fyllning är figurens EGEN grundton, så huvudets kontur försvinner
 * in i bakgrunden och det som syns är bara dragen. Därmed är märket
 * strukturellt identiskt med dagens: färgad rundad kvadrat, två vita
 * prickögon, en vit munbåge. Det som tillkommer är artens tecken.
 *
 * Ramen byggs HÄR och inte i figurmodulerna, så att alla fem får exakt samma
 * ram och går att jämföra rakt av.
 */

const RAM_R = 17;   // FaceMark.astro rx på 100-rutan
const BAS = { blue: '#007BE0', clean: '#00B92B', minor: '#FECB00', major: '#EB0000' };

let idRaknare = 0;

function inramat(m, { size = 64, ton = 'clean', uttryck = 'clean', siluett = false, detalj } = {}) {
  const inre = m.figur({ size: 100, ton, uttryck, ansikte: true, siluett, ...(detalj ? { detalj } : {}) });
  const vb = (inre.match(/viewBox="([^"]+)"/) || [null, '0 0 120 120'])[1];
  const kropp = inre.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const id = `pkram${idRaknare++}`;
  const fyll = siluett ? '#111' : (BAS[ton] ?? BAS.blue);
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
  <defs><clipPath id="${id}"><rect width="100" height="100" rx="${RAM_R}"/></clipPath></defs>
  <rect width="100" height="100" rx="${RAM_R}" fill="${fyll}"/>
  <g clip-path="url(#${id})"><svg width="100" height="100" viewBox="${vb}">${kropp}</svg></g>
</svg>`;
}

/* ── Kontrastprovet. Fem vägar ur märkets klumpproblem ────────────────
 *
 * Ägarens diagnos, ordagrant: "jag tror varför bedömnigsmärkena ser
 * katastrof ut är för deras huvud sätts mot samma bakgrund som märket,
 * något måste ändra lite i nyans, eller ngt för att kunna se".
 *
 * Rätt analys. Recepten och färgmatematiken bor i maskot-ark-marke.mjs,
 * uppställningen här. Varje variant renderas i 56, 32 och 24 px, i färg och
 * i gråskala, och mot sajtens tre bakgrunder. Kontrastkvoterna är räknade
 * enligt WCAG och skrivs ut, så att valet kan göras på tal och inte på tycke.
 */
function ramad(inre, ton, ramfarg, size) {
  const vb = (inre.match(/viewBox="([^"]+)"/) || [null, '0 0 100 100'])[1];
  const kropp = inre.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const id = `pkr${idRaknare++}`;
  // ram === 'none' betyder genomskinlig botten: ingen platta, ingen beskärning.
  // Figuren ska då stå fritt på sidan och får inte klippas av en ram som
  // inte finns.
  if (ramfarg === 'none') {
    return `<svg width="${size}" height="${size}" viewBox="${vb}">${kropp}</svg>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
  <defs><clipPath id="${id}"><rect width="100" height="100" rx="${RAM_R}"/></clipPath></defs>
  <rect width="100" height="100" rx="${RAM_R}" fill="${ramfarg}"/>
  <g clip-path="url(#${id})"><svg width="100" height="100" viewBox="${vb}">${kropp}</svg></g>
</svg>`;
}

function kontrastprov(m) {
  const recept = Object.keys(RECEPT);
  const rad = (nyckel, size) => TONER.map((t) => {
    const r = omfarga(m.figur({ size: 100, ton: t, uttryck: t, ansikte: true }), t, nyckel);
    return ramad(r.svg, t, r.ram, size);
  }).join('');

  // Bantad med flit. Arket leder nu med figurerna, och mätsektionerna ska
  // finnas och gå att lita på utan att svälla filen. Två storlekar och EN
  // gråskalerad räcker för att välja recept, resten var upprepning.
  const kort = recept.map((nyckel) => {
    const r = RECEPT[nyckel];
    const matt = TONER.map((t) => {
      const o = omfarga(m.figur({ size: 100, ton: t, uttryck: t, ansikte: true }), t, nyckel);
      return `${TON_ETIKETT[t]} ${o.kFigurRam.toFixed(2)}:1`;
    }).join(' · ');
    return `<div class="ruta" style="margin:12px 0">
    <div class="rad mitt">
      <span style="width:150px" class="note"><b>${r.namn}</b></span>
      <span style="display:flex;gap:10px;align-items:center;margin-right:22px">${rad(nyckel, 48)}</span>
      <span style="display:flex;gap:6px;align-items:center;margin-right:22px">${rad(nyckel, 24)}</span>
      <span style="display:flex;gap:6px;align-items:center;filter:grayscale(1)">${rad(nyckel, 24)}</span>
    </div>
    <p class="note" style="margin:10px 0 0">${r.kort} <b>Ger:</b> ${r.varde}
    <b>Kostar:</b> ${r.pris}<br>Figur mot platta: ${matt}</p>
  </div>`;
  }).join('');

  return `<div class="block">
  <h4>Kontrastprovet. Fem vägar ur klumpproblemet</h4>
  <p class="note" style="max-width:680px">Problemet uppstod när figurens huvud och plattan
  fick samma färg, alltså fanns ingen kant. Kolumnerna: 48 px i färg, 24 px i färg, 24 px i
  gråskala. Klarar receptet inte den sista kolumnen bär färgen betydelsen ensam, och det är
  underkänt oavsett hur bra det ser ut i färg.</p>
  ${kort}
</div>`;
}

/* ── Provrutorna ─────────────────────────────────────────────────────── */

const cell = (svg, etikett) => `<div class="cell">${svg}<span>${etikett}</span></div>`;

/** Ansiktet ensamt, i tre tillstånd. Den rad ägaren kommer titta mest på:
 *  går bedömningen inte att läsa ur enbart ansiktet är designen fel. */
function ansiktsprov(m) {
  const fritt = (size) =>
    TONER.map((t) => m.figur({ size, ton: t, uttryck: t, ansikte: true })).join('');
  const ram = (size) =>
    TONER.map((t) => inramat(m, { size, ton: t, uttryck: t })).join('');
  return `<div class="block">
  <h4>Inramat läge. Detta ÄR bedömningsmärket. 96, 64, 40, 24 och 16 px</h4>
  <div class="ruta">
    ${[96, 64, 40, 24, 16].map((s) => `<div class="rad mitt" style="margin-bottom:14px">${ram(s)}</div>`).join('')}
    <p class="note" style="margin:6px 0 0">Ramen är FaceMark.astro:s egen, 100-ruta med
    rx 17, oförändrad. Ramens fyllning är figurens grundton, så huvudets kontur försvinner
    in i bakgrunden och det som syns är bara dragen. Märket är därmed strukturellt
    identiskt med dagens: färgad rundad kvadrat, två vita prickögon, en vit munbåge.
    Det som tillkommer är artens tecken. Samma grepp som Duolingos app-ikon.</p>
  </div>
</div>

<div class="block">
  <h4>Ansiktet utan ram, för det fria läget. 64 och 24 px</h4>
  <div class="ruta">
    <div class="rad mitt">${fritt(64)}</div>
    <div class="rad mitt" style="margin-top:14px">${fritt(24)}</div>
  </div>
</div>

<div class="block">
  <h4>Provet som avgör: samma märken i gråskala</h4>
  <div class="ruta">
    <div class="rad mitt" style="filter:grayscale(1)">${ram(64)}</div>
    <div class="rad mitt" style="filter:grayscale(1);margin-top:14px">${ram(24)}</div>
    <p class="note" style="margin:10px 0 0">Skillnaden mellan de tre måste synas här,
    annars bär färgen betydelsen ensam. 8 procent av männen är färgblinda, och tokens.css
    säger redan att färg aldrig får vara ensam informationsbärare. Går de tre inte att
    skilja åt i den här raden är figuren underkänd, hur bra den än ser ut i färg.</p>
  </div>
</div>`;
}

function tillstandsprov(m) {
  return `<div class="block">
  <h4>Fritt läge. Hela figuren som bedömning, 96 px</h4>
  <div class="ruta"><div class="rutnat">
    ${TONER.map((t) => cell(m.figur({ size: 96, ton: t, uttryck: t }), TON_ETIKETT[t])).join('')}
  </div></div>
</div>

<div class="block">
  <h4>De två lägena bredvid varandra</h4>
  <div class="ruta"><div class="rad mitt">
    ${TONER.map((t) => `<span style="display:flex;gap:12px;align-items:center;margin-right:26px">
      ${m.figur({ size: 72, ton: t, uttryck: t })}${inramat(m, { size: 56, ton: t, uttryck: t })}
    </span>`).join('')}
  </div>
  <p class="note" style="margin:12px 0 0">Samma karaktär, två lägen. Det fria läget
  springer, står på tomma sidor och på 404. Det inramade står i listor, på kartnålar och
  i sökträffar. Ansiktet måste alltså fungera BÅDE beskuret i kvadraten och som del av en
  hel kropp, och det är ritat så från början, inte anpassat i efterhand.</p>
  </div>
</div>`;
}

function siluettprov(m) {
  return `<div class="block">
  <h4>Siluettprovet. Går figuren att känna igen helsvart?</h4>
  <div class="ruta"><div class="rad mitt">
    ${[200, 64, 24].map((s) => m.figur({ size: s, siluett: true })).join('')}
  </div></div>
</div>`;
}

function uttrycksprov(m) {
  const nycklar = Object.keys(m.UTTRYCK);
  return `<div class="block">
  <h4>Uttrycken, ${nycklar.length} stycken</h4>
  <div class="ruta"><div class="rutnat">
    ${nycklar.map((k) => cell(
      m.figur({ size: 108, ton: TONER.includes(k) ? k : 'blue', uttryck: k }),
      m.UTTRYCK[k]
    )).join('')}
  </div></div>
</div>`;
}

/* Samlar de genererade gång-keyframesen, en per figur, och skriver ut dem
   i arkets style-block. Keyframes är globala i CSS, alltså måste namnen vara
   unika per figur. */
const GANG_CSS = [];

function rorelseprov(m) {
  const g = m.GANG ?? GANG_STANDARD;
  const size = 120;

  // Bildrutorna. Har figuren en riktig gångcykel används den. Saknas den
  // faller vi tillbaka på poserna, vilket är sämre och sägs rakt ut.
  const harCykel = typeof m.figur === 'function' && (() => {
    try { return m.figur({ size, steg: 0 }) !== m.figur({ size, steg: 3 }); }
    catch { return false; }
  })();

  const rutor = harCykel
    ? Array.from({ length: g.rutor }, (_, i) => m.figur({ size, steg: i }))
    : ['clean', 'soker', 'hittat', 'nojd'].map((u) => m.figur({ size, uttryck: u }));

  const namn = `gang-${m.art}`;
  GANG_CSS.push(gangKeyframes(
    namn,
    harCykel ? g : { rutor: rutor.length, halltid: Array(rutor.length).fill(140) },
    size
  ));

  const blinkande = blinkSmil(m.figur({ size: 132 }));

  return `<div class="block">
  <h4>Rörelse. Bildrutor, inte transformer</h4>
  <div class="ruta">
    <p class="note" style="margin:0 0 16px">En CSS-transform kan flytta, skala och rotera
    former som redan finns. Den kan inte ÄNDRA en form, och det är formändringen som gör
    att en figur läser som levande i stället för som en pappersdocka på en pinne. Därför
    ligger figurens egen rörelse i bildrutor, som klassisk tecknad film, och bara
    förflyttningen över ytan i CSS.${harCykel ? '' : ' <b>Den här figuren har ännu ingen ritad gångcykel, så remsan nedan växlar mellan poser i stället. Det är sämre och syns.</b>'}</p>

    <div class="rad mitt">
      <div class="cell">${remsa(rutor, { size, namn })}<span>Loopen, ${rutor.length} rutor</span></div>
      <div class="cell">${blinkande}<span>Blinkning i SMIL</span></div>
    </div>

    <h4 style="margin:26px 0 8px">Rutorna en och en</h4>
    <div class="rad mitt" style="gap:6px">
      ${rutor.map((r, i) => `<div class="cell">${r.replace(/width="\d+" height="\d+"/, 'width="76" height="76"')}<span>${i}</span></div>`).join('')}
    </div>
    <p class="note" style="margin:12px 0 0">Kroppens höjd ska gå ned och upp två gånger per
    cykel, och huvudet ska följa med EN ruta senare än kroppen. Det är eftersläpningen som
    ger tyngd. Ser alla rutor likadana ut är cykeln för försiktig.</p>

    <h4 style="margin:26px 0 8px">Tajmingen, som är det som avgör om det ser dyrt ut</h4>
    <p class="note" style="margin:0 0 10px">En ren <code>steps(8)</code> håller varje ruta
    exakt lika länge, och den jämnheten läser ögat som mekanisk. Här får varje ruta sin egen
    hålltid, så att kontaktlägena ligger kvar längre än passeringarna:
    <b>${(harCykel ? g.halltid : Array(rutor.length).fill(140)).join(', ')} ms</b>.
    Loopen är ${((harCykel ? g.halltid : Array(rutor.length).fill(140)).reduce((a, b) => a + b, 0) / 1000).toFixed(2)} sekunder.</p>

    <h4 style="margin:26px 0 8px">Springrundan</h4>
    <div class="spring-yta">
      <span class="lopare">${remsa(rutor, { size: 96, namn })}</span>
    </div>
    <p class="note" style="margin:12px 0 0">Två animationer på två element: bildruteloopen
    inuti, förflyttningen utanpå. Aldrig på samma element, då slåss de om
    <code>transform</code>. Allt stannar under <code>prefers-reduced-motion</code>, som
    redan är global i tokens.css, och varje ruta är ritad som ett giltigt stillbildsläge.</p>

    <h4 style="margin:26px 0 8px">Varför inte Rive</h4>
    <p class="note" style="margin:0">Rive är byggt för precis det här och ger högre kvalitet
    än bildrutor. Det valdes ändå bort: det lägger en körtid på en sajt vars bärande princip
    är att inte skicka JavaScript, och bildrutor plus SMIL räcker för det vi behöver. Lottie
    var aldrig aktuellt, det är tyngre än Rive och löser inget Rive inte löser bättre. Skulle
    figuren senare behöva läppsynk eller tillståndsmaskiner är Rive rätt svar, och då är
    bildrutorna här inte bortkastade, de är nyckelramarna.</p>
  </div>
</div>`;
}


/* ── Munnen ──────────────────────────────────────────────────────────────
 * Ägaren, tre gånger: "munnen är viktigast, det är det allt hänger på".
 * Geometrin och mätvärdena bor i maskot-mun.mjs, uppställningen här. */
const MUNSEKTION = `
<h2>Munnen. Provet som avgör resten</h2>

<p class="read">Bedömningen ÄR bågens riktning. Allt annat i figuren är omgivning kring
den bågen. Här är munnen uppmätt, jämförd med Duos, och prövad ensam.</p>

<div class="kort">
<h4>Uppmätt nuläge, ur face.ts</h4>
<table>
<tr><th>Mått</th><th>Dagens märke</th><th>Som andel</th></tr>
<tr><td>Bredd</td><td>36,74 av 96 enheter</td><td>38,3 % av märkets bredd</td></tr>
<tr><td>Tjocklek</td><td>7,87 enheter</td><td>8,2 % av bredden</td></tr>
<tr><td>Pilhöjd, glad</td><td>6,15 enheter</td><td>16,7 % av munnens bredd</td></tr>
<tr><td>Mittlinje</td><td>y 61 av 96</td><td>63,5 % ned i rutan</td></tr>
<tr><td>Ögonen</td><td>r 6,12, centrum ±11,3 från mitten</td><td>6,4 % av bredden i radie</td></tr>
</table>

<h4 style="margin-top:26px">Jämförelsen med Duo, och slutsatsen som följer</h4>
<p>Duos motsvarighet är näbben. Uppmätt i Duolingos publicerade lockup-SVG är kroppen
134,6 enheter bred och den övre näbben 16 enheter, alltså <b>11,9 procent</b>. Vår mun är
<b>38,3 procent</b>, alltså över tre gånger så bred relativt figuren.</p>
<p>Slutsatsen är därför inte den man först tror. Vår mun är inte mindre än Duos, den är
mycket större. Det verkliga fyndet är att <b>Duo inte bär sitt uttryck i munnen alls.</b>
Han bär det i ögonen: ögonvitan, pupillens placering och ögonlockets vinkel gör nästan
hela arbetet, och näbben är en accent.</p>
<p>Vi har valt bort ögonvita och pupill, av skäl som står i regellistan längre ned. Då har
vi inte den kanalen, och då MÅSTE munnen göra hela arbetet. Den ska alltså vara större än
den är i dag, inte lika stor som Duos.</p>

<h4 style="margin-top:26px">Varför munnen såg rak ut, och vad som ändrades</h4>
<p>Invändningen var att munnen läser som ett streck och att figuren ser kantig och overklig
ut jämfört med Duo. Orsaken var räknebar och felet var vårt: vi höll <b>pilhöjden</b>
konstant som andel av bredden och ökade bredden. En båge med samma pilhöjd utdragen över
nästan dubbla bredden blir flackare, inte gladare. Vi gjorde alltså munnen rakare genom att
göra den större.</p>
<p>Rätt storhet att hålla fast är <b>radien</b>. Håller man radien och ökar bredden så ökar
pilhöjden av sig själv, precis som på en riktig cirkel. Radien är inte påhittad: räknad ur
dagens märke, bredd 36,74 och pilhöjd 6,15, blir den 30,5 av 96 enheter, alltså
<b>31,8 procent av bredden</b>. Det är den radie munnen redan har.</p>
<table style="margin-bottom:16px">
<tr><th>Bredd</th><th>Pilhöjd med konstant radie</th><th>Pilhöjd i den gamla, felaktiga modellen</th></tr>
${['dagens', 'storre', 'storst'].map((b) => {
  const bb = BREDD[b] * 100;
  const h = pilhojd(bb, RADIE.dagens * 100);
  return `<tr><td>${bb.toFixed(1)} %</td><td><b>${(h / bb * 100).toFixed(1)} %</b> av bredden</td><td>16,7 % oavsett bredd, alltså allt flackare</td></tr>`;
}).join('')}
</table>
<p class="note">Munnen ritas nu dessutom som en <b>riktig cirkelbåge</b>, alltså ett
A-kommando, och inte som en bezier som nästan är en cirkel. Det är samma sak som skiljer en
rund figur från en som läser som polygon.</p>

<h4 style="margin-top:26px">Provet: endast munnen skiljer</h4>
<p class="note">Samma ansikte tre gånger, samma ögon, samma färg, samma allt. Bara bågen
byter riktning. Går bedömningen att läsa här är munnen bärande, och då är resten omgivning.
Går den inte det är allt annat vi har ritat kosmetika.</p>
${['dagens', 'storre', 'storst'].map((b) => `
<div class="ruta" style="margin-top:14px">
  <div class="rad mitt">
    <span style="width:150px" class="note"><b>${(BREDD[b] * 100).toFixed(1)} %</b> bredd${b === 'dagens' ? '<br>dagens märke' : ''}${b === 'storre' ? '<br>förordas' : ''}<br>pilhöjd ${(pilhojd(BREDD[b] * 100, RADIE.dagens * 100) / (BREDD[b] * 100) * 100).toFixed(1)} %</span>
    ${[64, 40, 24, 16].map((s) => `<span style="display:flex;gap:8px;align-items:center;margin-right:18px">${baraMunnen({ size: s, bredd: b })}</span>`).join('')}
    <span style="display:flex;gap:8px;align-items:center;filter:grayscale(1)">${baraMunnen({ size: 24, bredd: b })}</span>
  </div>
</div>`).join('')}

<h4 style="margin-top:26px">Radien, tre val vid samma bredd</h4>
<div class="ruta">
  <div class="rad mitt">
    ${Object.entries(RADIE).map(([k, v]) => `<div class="cell">
      <div style="display:flex;gap:8px">${baraMunnen({ size: 56, bredd: 'storre', radie: k })}</div>
      <div style="display:flex;gap:6px;margin-top:8px">${baraMunnen({ size: 24, bredd: 'storre', radie: k })}</div>
      <span>${k}, radie ${(v * 100).toFixed(1)} %</span></div>`).join('')}
  </div>
  <p class="note" style="margin:12px 0 0">Mindre radie ger rundare mun. "rundare" på 27
  procent är den gladaste, men mungiporna börjar krypa in mot den rundade kvadratens hörn.</p>
</div>

<h4 style="margin-top:26px">Pupiller. Provet, inte argumentet</h4>
<p class="note">Förbudet mot pupiller är upphävt, och detta är provet i stället för
resonemanget. Övre raden utan pupill, undre med. Pupillen är 42 procent av prickens bredd,
förskjuten uppåt och inåt, alltså aldrig vertikalt centrerad, vilket är Duolingos egen regel.
Deras pupill är 47,5 procent av ögats bredd.</p>
<div class="ruta">
  <div class="rad mitt">
    ${[56, 32, 24, 16].map((s) => `<span style="display:flex;gap:8px;align-items:center;margin-right:20px">${baraMunnen({ size: s, bredd: 'storre' })}</span>`).join('')}
  </div>
  <div class="rad mitt" style="margin-top:14px">
    ${[56, 32, 24, 16].map((s) => `<span style="display:flex;gap:8px;align-items:center;margin-right:20px">${baraMunnen({ size: s, bredd: 'storre', pupill: '#1D1D1F' })}</span>`).join('')}
  </div>
  <div class="rad mitt" style="margin-top:14px;filter:grayscale(1)">
    ${[24, 16].map((s) => `<span style="display:flex;gap:8px;align-items:center;margin-right:20px">${baraMunnen({ size: s, bredd: 'storre', pupill: '#1D1D1F' })}</span>`).join('')}
  </div>
  <p class="note" style="margin:12px 0 0">Gränsen syns i raden: pupillen bär ned till 32 px.
  Vid 24 px är den under en pixel bred och blir ett grumligt hack i pricken i stället för en
  blick, och vid 16 px är den borta. Slutsatsen är därför inte att pupiller är fel, utan att
  <b>de hör hemma i det fria läget och inte i märket</b>. Två detaljnivåer, precis som en
  appikon har, med gränsen vid 32 px.</p>
</div>

<h4 style="margin-top:26px">Två ändringar mot dagens mun, båda små och båda med skäl</h4>
<p><b>Mellanläget är inte längre en rak linje.</b> Dagens raka mun har pilhöjd exakt noll,
och en rak linje mellan en glad och en ledsen båge läser som frånvaro snarare än som
mellanläge. Danska smileyordningen har samma tre lägen och samma svaghet. Vår minor har nu
pilhöjd ${(RIKTNING.minor * -100).toFixed(0)} procent av den glada bågens, alltså en nästan omärkligt nedåtböjd
linje, vilket läser som tveksamhet i stället för som ingenting.</p>
<p><b>Munnen lutar två grader.</b> Duolingos egen regel: munnen är den minst geometriska
formen i hela stilen och ska vara asymmetrisk och favorisera ena sidan, eftersom det ger
mer liv. Vår är i dag perfekt symmetrisk. Två grader är avsiktligt så lite att ingen ser
det medvetet.</p>
</div>
`;

/* ── Figuren PÅ en sida ──────────────────────────────────────────────────
 *
 * Ägaren har bett om det här flera gånger: ett vitt ark ljuger. Ett märke som
 * ser starkt ut ensamt i 96 px kan försvinna helt i en lista där det står
 * bredvid en rubrik i 17 px och en grå bildtext.
 *
 * Uppställningen nedan är sajtens egen: kort på canvas, hårlinje, rubrik i
 * --fs-h-xs, sekundärtext i --fs-caption, och märket där FaceMark står i dag.
 */
const RADER = [
  ['Restaurang Blå Dörren', 'Stockholm · Kontroll 12 mars 2026', 'clean'],
  ['Pizzeria Vesuvio', 'Linköping · Kontroll 4 mars 2026', 'minor'],
  ['Café Hörnan', 'Karlstad · Uppföljning 27 februari 2026', 'major'],
];

function pasidan(m, recept = 'duomork') {
  const rad = ([namn, meta, ton]) => {
    const o = omfarga(m.figur({ size: 100, ton, uttryck: ton, ansikte: true }), ton, recept);
    return `<li>
      ${ramad(o.svg, ton, o.ram, 40)}
      <span><b>${namn}</b><em>${meta}</em></span>
      <span class="etikett">${TON_ETIKETT[ton]}</span>
    </li>`;
  };
  const karta = TONER.map((t) => {
    const o = omfarga(m.figur({ size: 100, ton: t, uttryck: t, ansikte: true }), t, recept);
    return `<span class="nal">${ramad(o.svg, t, o.ram, 30)}</span>`;
  }).join('');
  return `<div class="block">
  <h4>På en riktig sida, inte på ett vitt ark</h4>
  <div class="sidprov">
    <div class="skarm">
      <div class="topp">${m.figur({ size: 30 })}<b>prikko</b><span class="sok">Sök verksamhet, kommun eller adress</span></div>
      <ul class="traffar">${RADER.map(rad).join('')}</ul>
      <div class="kartyta">${karta}</div>
      <div class="tomt">
        ${m.figur({ size: 88, uttryck: 'tom' })}
        <div><b>Inga träffar här</b><em>Prikko hittade ingen verksamhet på den adressen. Pröva ett kommunnamn i stället.</em></div>
      </div>
    </div>
  </div>
  <p class="note" style="margin:10px 0 0">Märkena här använder recept D, alltså fylld platta
  i bedömningsfärgen med figuren i en mörkare ton av samma färg. Byt <code>recept</code> i
  <code>pasidan()</code> för att se en annan variant i samma sammanhang. Ett vitt ark ljuger:
  ett märke som ser starkt ut ensamt i 96 px kan försvinna helt i en lista där det står
  bredvid en rubrik i 17 px och en grå bildtext.</p>
</div>`;
}


/* ── Härledningen ────────────────────────────────────────────────────────
 *
 * Det andra ledet i den omvända metoden. Figuren ritas fri, och märket
 * HÄRLEDS ur den i fyra steg, precis som Duolingo gör: app-ikonen är inte Duo
 * förminskad, den är ansiktet beskuret tills ögonmasken går kant i kant, och
 * kropp, vingar, öron, fötter och en färgnyans offras på vägen.
 *
 * Kedjan visas i sin helhet, med varje steg namngivet, så att det går att se
 * VAR något går förlorat i stället för att bara konstatera att märket blev
 * sämre eller bättre.
 */
function harledning(m) {
  const stodjerDetalj = (() => {
    try { return m.figur({ size: 100, ansikte: true, detalj: 'rik' }) !== m.figur({ size: 100, ansikte: true, detalj: 'enkel' }); }
    catch { return false; }
  })();

  const steg = [
    ['1. Figuren fri', m.figur({ size: 150 }),
     'Ritad utan en tanke på 24 px. Ögonvita, pupill, ögonlock, bryn.'],
    ['2. Ansiktet beskuret', m.figur({ size: 150, ansikte: true, detalj: 'rik' }),
     'Beskuret tills ögonpartiet går kant i kant. Kropp, lemmar och svans offras.'],
    ['3. Förenklat', m.figur({ size: 150, ansikte: true, detalj: stodjerDetalj ? 'enkel' : 'rik' }),
     stodjerDetalj
       ? 'Det som inte överlever nedskalning är omritat, inte bortplockat.'
       : 'Figuren har ännu ingen egen förenklad ritning, så steget visar samma bild som steg 2.'],
    ['4. Inramat märke', inramat(m, { size: 150, ton: 'clean', uttryck: 'clean' }),
     'Lagt i FaceMark.astro:s egen ram, 100-ruta med rx 17.'],
  ];

  const storlekar = [96, 56, 32, 24, 16];
  return `<div class="block">
  <h4>Härledningen. Från fri figur till märke, i fyra steg</h4>
  <div class="ruta">
    <div class="rad" style="align-items:flex-start;gap:22px">
      ${steg.map(([namn, svg, text]) => `<div class="cell" style="max-width:170px">
        ${svg}<span style="margin-top:8px"><b>${namn}</b><br>${text}</span>
      </div>`).join('')}
    </div>
    <p class="note" style="margin:16px 0 0">Blir märket sämre än förut är det ett problem
    vi löser i steg 3, med en egen förenklad ritning, och inte genom att förlama figuren i
    steg 1. Två detaljnivåer är helt normalt. Gränsen är mätt: pupillen bär ned till 32 px,
    vid 24 px blir den ett grumligt hack i ögonvitan och vid 16 px är den borta.</p>
  </div>

  <div class="ruta" style="margin-top:12px">
    <h4 style="margin:0 0 10px">Var gränsen faktiskt går</h4>
    <div class="rad mitt">
      <span style="width:110px" class="note"><b>Rik</b><br>ögonvita, pupill, lock</span>
      ${storlekar.map((z) => `<span style="margin-right:14px">${inramat(m, { size: z, ton: 'clean', uttryck: 'clean', detalj: 'rik' })}</span>`).join('')}
    </div>
    <div class="rad mitt" style="margin-top:12px">
      <span style="width:110px" class="note"><b>Enkel</b><br>omritad för litet format</span>
      ${storlekar.map((z) => `<span style="margin-right:14px">${inramat(m, { size: z, ton: 'clean', uttryck: 'clean', detalj: stodjerDetalj ? 'enkel' : 'rik' })}</span>`).join('')}
    </div>
    <p class="note" style="margin:12px 0 0">96, 56, 32, 24 och 16 px. Punkten där den övre
    raden slutar vara läsbar och den undre fortfarande är det, där går gränsen mellan
    detaljnivåerna.</p>
  </div>
</div>`;
}


/* ── Bevisproven för grävlingen ──────────────────────────────────────────
 *
 * Ägaren valde märket, inte figuren: "speciellt den enkla med, så denna:
 * Inramat läge. Detta ÄR bedömningsmärket. 96, 64, 40, 24 och 16 px."
 *
 * De fem storlekarna är därför hans lista och måttet i varje prov här. Något
 * som bara fungerar i 96 är inte klart.
 */
const STORLEKAR = [96, 64, 40, 24, 16];

/** Stödjer modulen en parameter? Prövas genom att jämföra två utfall. */
function stodjer(m, nyckel, a, b) {
  try {
    return m.figur({ size: 100, ansikte: true, [nyckel]: a })
        !== m.figur({ size: 100, ansikte: true, [nyckel]: b });
  } catch { return false; }
}

/** En rad med de tre bedömningarna i alla fem storlekarna. */
function femRad(m, extra = {}, gra = false) {
  return `<div class="rad mitt"${gra ? ' style="filter:grayscale(1)"' : ''}>
    ${STORLEKAR.map((z) => `<span style="display:flex;gap:${Math.max(4, z / 8)}px;align-items:center;margin-right:22px">
      ${TONER.map((t) => inramat(m, { size: z, ton: t, uttryck: t, ...extra })).join('')}
    </span>`).join('')}
  </div>`;
}

/**
 * PLATTANS TON. Ägaren: "kanske den ska ha bakgrund som är lite lite starkare
 * av originalfärgen men samtidigt ljus".
 *
 * Villkoret som avgör är inte smak utan kontrast: huvudets kontur måste synas
 * mot plattan, också i gråskala, också i 16 px. Blir plattan för ljus smälter
 * konturen in, vilket är samma fel som gjorde det första inramade förslaget
 * till en klump. Blir den för mättad slutar den läsa som bakgrund.
 */
function plattprov(m) {
  if (!stodjer(m, 'platta', 0, 4)) {
    return `<div class="block"><h4>Plattans ton</h4><div class="ruta">
      <p class="note" style="margin:0">Figuren har ännu ingen <code>platta</code>-parameter,
      så stegen kan inte visas. Provet byggs så fort modulen exponerar den.</p></div></div>`;
  }
  const steg = [0, 1, 2, 3, 4];
  const matt = m.PLATTA_TONER
    ? `<table style="margin-top:14px"><tr><th>Steg</th>${TONER.map((t) => `<th>${TON_ETIKETT[t]}</th>`).join('')}</tr>
       ${steg.map((i) => `<tr><td>${i}${i === 0 ? ', dagens' : ''}</td>${TONER.map((t) => {
         const platta = m.PLATTA_TONER[t]?.[i];
         const huvud = m.PALETT?.[t]?.bas;
         if (!platta || !huvud) return '<td>saknas</td>';
         return `<td><code>${platta}</code><br>${kontrast(platta, huvud).toFixed(2)}:1 mot huvudet</td>`;
       }).join('')}</tr>`).join('')}</table>`
    : '';
  return `<div class="block">
  <h4>Plattans ton. Fem steg, valet görs i 24 px</h4>
  <div class="ruta">
    ${steg.map((i) => `<div style="margin-bottom:16px">
      <span class="note" style="display:block;margin-bottom:6px"><b>Steg ${i}</b>${i === 0 ? ', dagens ljusa' : ''}</span>
      ${femRad(m, { platta: i })}
      ${femRad(m, { platta: i }, true)}
    </div>`).join('')}
    <p class="note" style="margin:8px 0 0">Övre raden i färg, undre i gråskala. Villkoret är
    inte smak utan kontrast: huvudets kontur måste synas mot plattan också i gråskala och
    också i 16 px. För ljus platta ger en klump, för mättad slutar läsa som bakgrund.</p>
    ${matt}
  </div>
</div>`;
}

/**
 * ISOLERINGSPROVEN. Det prov som begärts tre gånger och aldrig levererats.
 *
 * Med bara EN bärare aktiv i taget syns det svart på vitt om bäraren faktiskt
 * bär. Går de tre bedömningarna inte att skilja åt när enbart brynen ändras,
 * är brynsystemet inte färdigt, oavsett hur bra hela ansiktet ser ut.
 */
function isoleringsprov(m) {
  const har = stodjer(m, 'isolera', 'bryn', 'mun');
  if (!har) {
    return `<div class="block"><h4>Isoleringsproven</h4><div class="ruta">
      <p class="note" style="margin:0">Figuren har ännu ingen <code>isolera</code>-parameter.
      Provet byggs så fort modulen exponerar den.</p></div></div>`;
  }
  const block = (nyckel, rubrik, text) => `<div style="margin-bottom:22px">
    <span class="note" style="display:block;margin-bottom:6px"><b>${rubrik}</b> ${text}</span>
    ${femRad(m, { isolera: nyckel })}
    ${femRad(m, { isolera: nyckel }, true)}
  </div>`;
  return `<div class="block">
  <h4>Isoleringsproven. Bär bäraren?</h4>
  <p class="note" style="max-width:680px">Allt utom en bärare låses till clean-läget. Går de
  tre bedömningarna att skilja åt ändå, bär den bäraren. Går de inte det gör den det inte,
  hur bra hela ansiktet än ser ut tillsammans. Övre raden i färg, undre i gråskala.</p>
  <div class="ruta">
    ${block('bryn', 'Endast brynen skiljer.', 'Mun, ögonlock, pupiller och huvudlutning är identiska i alla tre.')}
    ${block('mun', 'Endast munnen skiljer.', 'Bryn, ögonlock, pupiller och huvudlutning är identiska i alla tre.')}
    <div>
      <span class="note" style="display:block;margin-bottom:6px"><b>Allt samverkar.</b> Så här ser märket ut i drift.</span>
      ${femRad(m)}
      ${femRad(m, {}, true)}
    </div>
  </div>
</div>`;
}

/**
 * AMPLITUDEN. Ägaren: "vi ska göra det tydligare att han är arg med munnen och
 * ögonbrynen".
 *
 * Grundregeln i karaktärsdesign är att överdriva och sedan mäta, eftersom små
 * storlekar äter nyans. Ett bryn som ser lagom argt ut i 96 px är osynligt i 24.
 * Valet görs därför i 24-pixelsraden och kontrolleras sedan i 96.
 */
function amplitudprov(m) {
  if (!stodjer(m, 'amp', 1, 2)) {
    return `<div class="block"><h4>Amplituden i det röda uttrycket</h4><div class="ruta">
      <p class="note" style="margin:0">Figuren har ännu ingen <code>amp</code>-parameter.
      Provet byggs så fort modulen exponerar den.</p></div></div>`;
  }
  const steg = [1, 1.5, 2];
  return `<div class="block">
  <h4>Amplituden. Överdriv, och mät sedan</h4>
  <p class="note" style="max-width:680px">Tre steg på brynvinkel och munnens bågdjup.
  <b>Välj i 24-pixelsraden, inte i 96.</b> Det är den storlek märket oftast visas i, i listor
  och sökträffar, och det minsta värde som fortfarande läser tydligt argt där är rätt värde.
  Blir samma värde grotesk i 96 är svaret två detaljnivåer, inte ett svagare uttryck i båda.</p>
  <div class="ruta">
    ${steg.map((a) => `<div style="margin-bottom:16px">
      <span class="note" style="display:block;margin-bottom:6px"><b>amp ${a}</b>${a === 1 ? ', dagens' : ''}</span>
      ${femRad(m, { amp: a })}
      ${femRad(m, { amp: a }, true)}
    </div>`).join('')}
    <p class="note" style="margin:8px 0 0">Gränsen: argt, inte elakt. Vi rapporterar en
    kontroll, vi anklagar ingen. Inga tänder, ingen sned mun, inga smala rovdjursögon. Och
    gult är det svåra fallet: när rött blir kraftigare måste gult fortfarande vara entydigt
    skilt från både grönt och rött, och läsa som tveksamhet snarare än som glad eller arg.</p>
  </div>
</div>`;
}

function kort(m, nr) {
  const e = m.META;
  const ny = typeof e.raka === 'number';
  return `<section class="kort" id="${m.art}">
  <h3 style="margin-top:0">${nr}. ${e.namn}</h3>
  <p class="lead" style="font-size:17px;line-height:26px">${e.koncept}</p>
  <div class="taggar">
    ${ny ? '<span class="tagg ok">Ritad om med riktiga ögon</span>' : '<span class="tagg varning">Ännu inte omritad, gamla prickögon</span>'}
    <span class="tagg">${e.former} former</span>
    <span class="tagg">${e.farger} färger</span>
    ${ny ? `<span class="tagg ${e.raka < 10 ? 'ok' : 'varning'}">${e.raka} raka linjekommandon</span>` : ''}
  </div>
  <p class="note" style="max-width:680px"><b>Egenhet:</b> ${e.egenhet}<br><b>Svaghet:</b> ${e.svaghet}</p>

  <div class="block">
    <h4>Figuren fri. 320 och 200 px</h4>
    <div class="ruta"><div class="rad mitt">
      ${m.figur({ size: 320 })}
      ${m.figur({ size: 200, uttryck: 'soker' })}
      ${m.figur({ size: 200, uttryck: 'hittat' })}
    </div></div>
  </div>

  ${plattprov(m)}
  ${amplitudprov(m)}
  ${isoleringsprov(m)}
  ${rorelseprov(m)}
  ${uttrycksprov(m)}
  ${ritning(m)}
  ${harledning(m)}
  ${pasidan(m)}
  ${kontrastprov(m)}
  ${ansiktsprov(m)}
  ${tillstandsprov(m)}
  ${siluettprov(m)}
</section>`;
}

/* Galleriet högst upp: alla kandidater bredvid varandra i stor storlek, innan
   ett enda mätvärde. Ägaren dömer på hur figuren KÄNNS, och tidigare ark ledde
   med märken och tabeller, vilket är rätt ordning för den som bygger och fel
   för den som väljer. */
function galleri(moduler) {
  return `<div class="ruta" style="margin:28px 0 8px">
  <div class="rad mitt" style="gap:36px;justify-content:center">
    ${moduler.map((m) => `<div class="cell">
      ${m.figur({ size: 240, klass: 'a-vagga' })}
      <span style="font-size:14px;margin-top:10px"><b>${m.META.namn}</b></span>
    </div>`).join('')}
  </div>
  <p class="note" style="margin:18px 0 0;text-align:center">Kandidaterna sida vid sida,
  i den storlek de faktiskt är ritade för. Mätningarna kommer längre ned.</p>
</div>`;
}

/* ── Bygget ──────────────────────────────────────────────────────────── */

const alla = (await Promise.all(ARTER.map(las))).filter(Boolean);
const historik = (await Promise.all(HISTORIK.map(las))).filter(Boolean);
const moduler = alla;

/** Kort ruta för en tolkning som valts bort. Grundpose, tre tillstånd, skälet. */
function fallkort(m) {
  return `<div class="kort" style="margin:16px 0">
  <h4 style="margin-bottom:6px">${m.META.namn}</h4>
  <div class="ruta"><div class="rad mitt">
    ${m.figur({ size: 96 })}
    ${TONER.map((t) => m.figur({ size: 56, ton: t, uttryck: t })).join('')}
    ${TONER.map((t) => inramat(m, { size: 40, ton: t, uttryck: t })).join('')}
  </div></div>
  <p class="note" style="margin:12px 0 0">${FALLSKAL[m.art] ?? ''}</p>
</div>`;
}

const HISTSKAL = {
  utter: 'Kom längst av utmanarna. Betydelsen är sann och stark: uttern måste putsa pälsen konstant för att överleva, alltså ett djur där renlighet är ett livsvillkor och inte en vana. Ögonen bar de nio uttrycken bäst av alla. Föll på siluetten: i ren kontur läser den som björnunge eller murmeldjur, eftersom arten bärs av morrhår, mule och svans, alltså av det som försvinner först vid nedskalning.',
  vatte: 'Bäst betydelse av alla, och den enda idé en oberoende granskare sa sig minnas en vecka senare, luvspetsen som visare. Institutet för språk och folkminnen beskriver tomtegubben som ett väsen som sopade, höll ordning, krävde renlighet och straffade slarv. Föll på tre ting: den är inte ett djur, den läser som troll eller liten djävul i rött läge, och dess ögon var två koncentriska perfekta cirklar, alltså Duos ögonkonstruktion rakt av, med ett ögonpar på 74 procent av märkets bredd mot Duos 63.',
  tvattbjorn: 'Tekniskt tydligast av alla i 24 px och den enda som klarade gråskaleprovet i båda lägena. Föll på tre saker som inte går att rita bort: Naturvårdsverket och Havs- och vattenmyndigheten säger uttryckligen att tvättbjörnen INTE tvättar sin mat, arten är EU-listad invasiv och förbjuden i Sverige, och figuren blev den mest generiskt söta på arket. Mäter dessutom 300 raka linjekommandon.',
  hund: 'Det mest ritade djuret som finns, och metaforen är bokstavlig på samma sätt som Dockers val med containrar på ryggen. Bortvalet av nosknappen var en riktig idé, hela mulen är nosen. Föll på läsbarheten: ansiktet satt felplacerat i märkets ruta, grönt och gult gick inte att skilja åt i gråskala i 16 px, och figuren läser som krokodil. Mäter 90 raka linjekommandon.',
  kameleont: 'Ägarens eget uppslag, och det enda djur där färgbytet är artens egenskap. Föll på betydelsen och inte på formen: SAOB ger kameleont om en person som "med egen fördel för ögonen, ändrar mening eller uppträder helt olika allt efter omständigheterna", alltså anpassling och opportunist, vilket är motsatsen till vårt löfte. Singapores bankförening lanserade dessutom 2024 antibedrägerimaskoten Leon the Skameleon, där kameleonten står för BEDRAGAREN. Det är vår kategori med omvänd symbolik. SUSE äger kameleonten i teknikvärlden sedan 2000.',
};

/* Historiken sparas i sin helhet. Ett bortval som går att gå tillbaka till är
   värt något, ett som bara finns i ett chattflöde är det inte. */
const historikSektion = historik.length ? `<h2>Historiken. De fem som inte blev det</h2>
<p class="read">Sparade, inte raderade. Alla ritades färdigt innan någon valde, vilket var
hela poängen med att gå brett: ett bortval mot en färdig ritning är värt något, ett mot en
beskrivning är det inte. Här är de med skälet, och de får ingen mer tid.</p>
${historik.map((m) => {
  const raka = (m.figur({ size: 120 }).match(/[LHVlhv]\s*[-\d.]/g) || []).length;
  return `<div class="kort" style="margin:16px 0">
  <h4 style="margin-bottom:6px">${m.META.namn}</h4>
  <div class="taggar">
    <span class="tagg ${raka < 10 ? 'ok' : 'varning'}">${raka} raka linjekommandon</span>
    <span class="tagg">${m.META.former} former</span>
  </div>
  <div class="ruta"><div class="rad mitt">
    ${m.figur({ size: 130 })}
    ${TONER.map((t) => m.figur({ size: 64, ton: t, uttryck: t })).join('')}
    ${TONER.map((t) => inramat(m, { size: 40, ton: t, uttryck: t })).join('')}
  </div></div>
  <p class="note" style="margin:12px 0 0">${HISTSKAL[m.art] ?? ''}</p>
</div>`;
}).join('')}` : '';

const gamlaSektion = '';
const fallnaSektion = '';

const korten = moduler.map((m, i) => kort(m, i + 1)).join('');

const html = `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Prikkos maskot, fem tolkningar</title>
<style>${STIL}${REMSA_CSS}${GANG_CSS.join('\n')}</style>
<div class="wrap">
  <div class="read">
    <h1>Prikkos maskot, ${moduler.length} tolkningar</h1>
  </div>
  ${galleri(moduler)}
  <div class="read">
    ${INGRESS}
  </div>
  ${RESEARCH}
  ${DUOJAMFORELSE}
  ${FALTET}
  ${LAGEN}
  ${MUNSEKTION}
  ${OGONEN}
  <h2>Tolkningarna</h2>
  <p class="read">Ritade oberoende av varandra, var och en av en egen agent som inte
  såg de andras arbete. Alla följer samma kontrakt och visas i samma prov, så de går
  att jämföra rakt av.</p>
  ${moduler.map((m, i) => kort(m, i + 1)).join('')}
  ${DETEKTIV}
  ${BETYDELSE}
  ${VARUMARKE}
  ${REGLER}
  ${NAMN}
</div>
`;

const ut = join(HAR, 'maskot-forslag.html');
writeFileSync(ut, html);
console.log(`Skrev ${ut}`);
console.log(`Figurer med: ${moduler.map((m) => m.META.namn).join(', ')}`);
