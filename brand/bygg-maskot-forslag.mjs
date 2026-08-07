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
import { INGRESS, RESEARCH, FALTET, LAGEN, DETEKTIV, BETYDELSE, VARUMARKE, NAMN, REGLER } from './maskot-ark-text.mjs';
import { ritning } from './maskot-ark-ritning.mjs';
import { RECEPT, omfarga, BAKGRUND } from './maskot-ark-marke.mjs';
import { GANG_STANDARD, gangKeyframes, blinkSmil, remsa, REMSA_CSS } from './maskot-ark-rorelse.mjs';
import { baraMunnen, BREDD, TJOCKLEK, PILHOJD, mun as munform, ogon as ogonform } from './maskot-mun.mjs';

const HAR = dirname(fileURLToPath(import.meta.url));

/* Fem tolkningar ritades oberoende av varandra. Ägaren har sedan valt:
   grävlingen och hunden går vidare, de tre andra faller. De kvarvarande får
   hela provbatteriet, de fallna en kort ruta var med skälet, eftersom ett
   bortval är värt att kunna gå tillbaka till. */
const ARTER = ['gravling', 'hund'];
const FALLNA = ['kameleont', 'tvattbjorn', 'vatte'];
const FALLSKAL = {
  kameleont: 'Ägarens eget uppslag, och det enda djur där färgbytet är artens egenskap. Föll på språket: SAOB ger kameleont om en person som "person som, med egen fördel för ögonen, ändrar mening", alltså anpassling och opportunist. Vår tjänst går ut på motsatsen. Dessutom använder Singapores bankförening sedan 2024 en kameleont som BEDRAGAREN i sin antibedrägerimaskot, alltså i vår kategori med omvänd symbolik, och SUSE äger kameleonten i teknikvärlden sedan 2000.',
  tvattbjorn: 'Tekniskt tydligast av alla fem i 24 px, och den enda som klarade gråskaleprovet i båda lägena. Föll ändå på tre saker som inte går att rita bort: Naturvårdsverket och Havs- och vattenmyndigheten säger uttryckligen att tvättbjörnen INTE tvättar sin mat, arten är EU-listad invasiv och förbjuden i Sverige, och figuren blev den mest generiskt söta på arket, alltså exakt den AI-arketyp vi ska undvika.',
  vatte: 'Bäst betydelse av alla. Institutet för språk och folkminnen beskriver tomtegubben som ett väsen som sopade, höll ordning, KRÄVDE renlighet och straffade slarv, alltså Prikkos affärsidé som svensk folktro. Luvspetsen som visare var arkets enda idé granskaren sa sig komma ihåg om en vecka. Föll på två ting: det är inte ett djur, och i rött läge, som är det argaste uttrycket, är den närmast jultomten.',
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

function inramat(m, { size = 64, ton = 'clean', uttryck = 'clean', siluett = false } = {}) {
  const inre = m.figur({ size: 100, ton, uttryck, ansikte: true, siluett });
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
  const rad = (nyckel, size, gra = false) => TONER.map((t) => {
    const r = omfarga(m.figur({ size: 100, ton: t, uttryck: t, ansikte: true }), t, nyckel);
    return ramad(r.svg, t, r.ram, size);
  }).join('');

  const kort = recept.map((nyckel) => {
    const r = RECEPT[nyckel];
    const matt = TONER.map((t) => {
      const o = omfarga(m.figur({ size: 100, ton: t, uttryck: t, ansikte: true }), t, nyckel);
      return `${TON_ETIKETT[t]}: figur mot ram ${o.kFigurRam.toFixed(2)}:1, drag mot figur ${o.kDragFigur.toFixed(2)}:1`;
    }).join('<br>');
    return `<div class="kort" style="margin:16px 0">
    <h4 style="margin-bottom:4px">${r.namn}</h4>
    <p class="note" style="margin:0 0 14px">${r.kort}<br><b>Ger:</b> ${r.varde} <b>Kostar:</b> ${r.pris}</p>
    <div class="ruta">
      <div class="rad mitt">
        <span style="display:flex;gap:10px;align-items:center;margin-right:22px">${rad(nyckel, 56)}</span>
        <span style="display:flex;gap:8px;align-items:center;margin-right:22px">${rad(nyckel, 32)}</span>
        <span style="display:flex;gap:6px;align-items:center">${rad(nyckel, 24)}</span>
      </div>
      <div class="rad mitt" style="filter:grayscale(1);margin-top:14px">
        <span style="display:flex;gap:10px;align-items:center;margin-right:22px">${rad(nyckel, 56)}</span>
        <span style="display:flex;gap:8px;align-items:center;margin-right:22px">${rad(nyckel, 32)}</span>
        <span style="display:flex;gap:6px;align-items:center">${rad(nyckel, 24)}</span>
      </div>
      <p class="note" style="margin:12px 0 0">Övre raden i färg, undre i gråskala. Storlekar
      56, 32 och 24 px.<br>${matt}</p>
    </div>
    <div class="rad" style="margin-top:12px">
      ${BAKGRUND.map(([bg, namn]) => `<div class="cell" style="background:${bg};padding:14px 16px;border-radius:10px;border:1px solid var(--hairline)">
        <div style="display:flex;gap:8px">${rad(nyckel, 32)}</div><span style="margin-top:8px">${namn}</span>
      </div>`).join('')}
    </div>
  </div>`;
  }).join('');

  return `<div class="block">
  <h4>Kontrastprovet. Fem vägar ur klumpproblemet</h4>
  <p class="note" style="max-width:680px">Problemet är att figurens huvud och märkets fält
  har samma färg, och då finns ingen kant. Duo klarar samma upplägg för att hans ansikte har
  fyra värden inuti det gröna fältet: ljusare ögonmask, vit ögonvita, mörk pupill och gul näbb.
  Vår figur har ett värde plus vitt. Nedan fem svar, mätta i stället för tyckta.</p>
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

<h4 style="margin-top:26px">Provet: endast munnen skiljer</h4>
<p class="note">Samma ansikte tre gånger, samma ögon, samma färg, samma allt. Bara bågen
byter riktning. Går bedömningen att läsa här är munnen bärande, och då är resten omgivning.
Går den inte det är allt annat vi har ritat kosmetika.</p>
${['dagens', 'storre', 'storst'].map((b) => `
<div class="ruta" style="margin-top:14px">
  <div class="rad mitt">
    <span style="width:130px" class="note"><b>${(BREDD[b] * 100).toFixed(1)} %</b> bredd${b === 'dagens' ? '<br>dagens märke' : ''}</span>
    ${[64, 40, 24, 16].map((s) => `<span style="display:flex;gap:8px;align-items:center;margin-right:18px">${baraMunnen({ size: s, bredd: b })}</span>`).join('')}
    <span style="display:flex;gap:8px;align-items:center;filter:grayscale(1)">${baraMunnen({ size: 24, bredd: b })}</span>
  </div>
</div>`).join('')}

<h4 style="margin-top:26px">Tjockleken</h4>
<div class="ruta">
  <div class="rad mitt">
    ${Object.entries(TJOCKLEK).map(([k, v]) => `<div class="cell">
      <div style="display:flex;gap:8px">${baraMunnen({ size: 40, bredd: 'storre', tjocklek: k })}</div>
      <span>${k}, ${(v * 100).toFixed(1)} %</span></div>`).join('')}
  </div>
</div>

<h4 style="margin-top:26px">Två ändringar mot dagens mun, båda små och båda med skäl</h4>
<p><b>Mellanläget är inte längre en rak linje.</b> Dagens raka mun har pilhöjd exakt noll,
och en rak linje mellan en glad och en ledsen båge läser som frånvaro snarare än som
mellanläge. Danska smileyordningen har samma tre lägen och samma svaghet. Vår minor har nu
pilhöjd ${(PILHOJD.minor * 100).toFixed(1)} procent, alltså en nästan omärkligt nedåtböjd
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

function kort(m, nr) {
  const e = m.META;
  return `<section class="kort" id="${m.art}">
  <h3 style="margin-top:0">${nr}. ${e.namn}</h3>
  <p class="lead" style="font-size:17px;line-height:26px">${e.koncept}</p>
  <div class="taggar">
    <span class="tagg">${e.former} former</span>
    <span class="tagg">${e.farger} färger</span>
    <span class="tagg ok">Egenhet: ${e.egenhet}</span>
    <span class="tagg varning">Svaghet: ${e.svaghet}</span>
  </div>
  <div class="block">
    <h4>Grundposen. Figuren mitt i sitt yrke, inte i givakt</h4>
    <div class="ruta"><div class="rad mitt">
      ${[240, 160, 96].map((s) => m.figur({ size: s })).join('')}
    </div></div>
  </div>
  ${kontrastprov(m)}
  ${ansiktsprov(m)}
  ${tillstandsprov(m)}
  ${siluettprov(m)}
  ${ritning(m)}
  ${uttrycksprov(m)}
  ${rorelseprov(m)}
  ${pasidan(m)}
</section>`;
}

/* ── Bygget ──────────────────────────────────────────────────────────── */

const moduler = (await Promise.all(ARTER.map(las))).filter(Boolean);
const fallna = (await Promise.all(FALLNA.map(las))).filter(Boolean);

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

const fallnaSektion = fallna.length ? `<h2>De tre som föll</h2>
<p class="read">Alla fem ritades färdigt innan någon valde. Det är hela poängen med att
gå brett först: ett bortval som är gjort mot en färdig ritning är värt något, ett bortval
som är gjort mot en beskrivning är det inte. Här är de tre, med skälet.</p>
${fallna.map(fallkort).join('')}` : '';
if (!moduler.length) {
  console.error('Inga figurmoduler hittades i brand/maskot/. Inget att bygga.');
  process.exit(1);
}

/* Korten renderas FÖRE dokumentet. Gång-keyframesen genereras nämligen inne
   i rorelseprov(), och en template literal evalueras vänster till höger, så
   ett style-block som skrivs före korten hade blivit tomt. */
const korten = moduler.map((m, i) => kort(m, i + 1)).join('');

const html = `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Prikkos maskot, fem tolkningar</title>
<style>${STIL}${REMSA_CSS}${GANG_CSS.join('\n')}</style>
<div class="wrap">
  <div class="read">
    <h1>Prikkos maskot, ${moduler.length} tolkningar</h1>
    ${INGRESS}
  </div>
  ${RESEARCH}
  ${FALTET}
  ${LAGEN}
  ${MUNSEKTION}
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
