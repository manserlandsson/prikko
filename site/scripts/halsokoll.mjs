/**
 * Hälsokoll mot den PUBLICERADE sajten.
 *
 *     node scripts/halsokoll.mjs
 *     node scripts/halsokoll.mjs https://nagon-annan-vard.example
 *
 * ## Varför den finns
 *
 * 2026-08-31 upptäcktes två fel som båda hade legat tysta i veckor.
 *
 * Nattjobbet hade inte kört sedan 18 augusti och byggrinden inte sedan
 * 27 augusti, båda för att GitHub Actions var spärrat på en betalning. Inget
 * larmade. Sajten låg uppe och såg färsk ut, och datan blev en vecka äldre
 * varje vecka.
 *
 * `prikko.pages.dev` serverade samtidigt hela sajten en andra gång med
 * `Allow: /`, alltså dubbelt så många adresser åt Google som vi tror att vi
 * publicerar.
 *
 * Ingen av dem hade fångats av en pingkontroll. Sajten svarade 200 hela tiden.
 * Det som behövdes var en kontroll av att sajten är RÄTT, inte att den är UPPE.
 *
 * ## Vad den kontrollerar, och varför just det
 *
 * Varje kontroll här motsvarar ett fel som faktiskt har inträffat, eller ett
 * som skulle vara osynligt tills någon råkade titta. Lägg inte till en
 * kontroll som inte kan peka på ett sådant fel.
 *
 * Skriptet ändrar ingenting och kan köras hur ofta som helst. Det avslutar med
 * 1 när något är FEL, så att det kan bli en grind den dagen Actions går igen.
 */
const bas = (process.argv[2] ?? 'https://prikko.se').replace(/\/$/, '');
const UA = 'PrikkoHalsokoll/1.0 (+https://prikko.se)';

/** Hur gammal datan får vara innan det är ett fel. Nattjobbet kör varje natt,
 *  så tre dygn är två missade körningar plus marginal för en sen start. */
const FARSKHET_VARNING_DAGAR = 3;
const FARSKHET_FEL_DAGAR = 10;

let fel = 0;
let varning = 0;

function ok(text) {
  console.log(`  ok      ${text}`);
}
function varna(text) {
  varning += 1;
  console.log(`  VARNING ${text}`);
}
function trasigt(text) {
  fel += 1;
  console.log(`  FEL     ${text}`);
}

async function hamta(sokvag, init = {}) {
  const svar = await fetch(bas + sokvag, {
    ...init,
    headers: { 'User-Agent': UA, ...(init.headers ?? {}) },
    redirect: 'manual',
  });
  return svar;
}

/* ── 1. Svarar sajten alls ──────────────────────────────────────────────── */
async function kollaStartsidan() {
  console.log('\nStartsidan');
  const t0 = Date.now();
  const svar = await hamta('/');
  const ms = Date.now() - t0;
  if (svar.status !== 200) return trasigt(`startsidan svarar ${svar.status}`);
  const html = await svar.text();
  if (!html.includes('<html')) return trasigt('startsidan svarar 200 men innehåller ingen HTML');
  ok(`200 på ${ms} ms, ${(html.length / 1024).toFixed(0)} kB`);
}

/* ── 2. Hur gammal är datan ─────────────────────────────────────────────────
 *
 * `llms.txt` skriver ut hämtdatumet i klartext, och det är den enda publika
 * ytan som gör det. Går texten sönder märks det här, vilket också är ett fel
 * värt att veta om.
 */
async function kollaFarskhet() {
  console.log('\nDatans ålder');
  const svar = await hamta('/llms.txt');
  if (svar.status !== 200) return trasigt(`llms.txt svarar ${svar.status}`);
  const text = await svar.text();

  const m = /senast hämtat ([0-9]{1,2} [a-zåäö]+ [0-9]{4})/i.exec(text);
  if (!m) return trasigt('llms.txt saknar raden om när datan hämtades');

  const manader = [
    'januari', 'februari', 'mars', 'april', 'maj', 'juni',
    'juli', 'augusti', 'september', 'oktober', 'november', 'december',
  ];
  const [dag, manad, ar] = m[1].split(' ');
  const index = manader.indexOf(manad.toLowerCase());
  if (index < 0) return trasigt(`kunde inte tolka månaden "${manad}" i llms.txt`);

  const hamtat = new Date(Date.UTC(Number(ar), index, Number(dag)));
  const dagar = Math.floor((Date.now() - hamtat.getTime()) / 86400000);

  if (dagar >= FARSKHET_FEL_DAGAR) {
    trasigt(`datan är ${dagar} dagar gammal, hämtad ${m[1]}. Nattjobbet kör inte.`);
  } else if (dagar >= FARSKHET_VARNING_DAGAR) {
    varna(`datan är ${dagar} dagar gammal, hämtad ${m[1]}`);
  } else {
    ok(`datan är ${dagar} dagar gammal, hämtad ${m[1]}`);
  }

  const antal = /([0-9\s ]+) verksamheter i ([0-9]+) kommuner/.exec(text);
  if (antal) ok(`llms.txt uppger ${antal[1].trim()} verksamheter i ${antal[2]} kommuner`);
}

/* ── 3. Kartarkivet svarar på räckvidd ──────────────────────────────────────
 *
 * Det här är sajtens känsligaste beroende och det har gått sönder i skarpt
 * läge en gång. Se scripts/kontrollera-rackvidd.mjs för hela historien. Den
 * kontrollen är djupare; den här är den snabba versionen som hör hemma i en
 * daglig koll.
 */
async function kollaKartarkivet() {
  console.log('\nKartarkivet');
  const index = await hamta('/kartrutor/');
  /* Arkivets filnamn är innehållsbaserat, så det måste läsas ur en sida som
     pekar på det. Rikskartan bär adressen i sin markup. */
  const karta = await hamta('/karta/');
  if (karta.status !== 200) return trasigt(`/karta/ svarar ${karta.status}`);
  const html = await karta.text();
  const m = /\/kartrutor\/[a-z0-9-]+\.bin/i.exec(html);
  if (!m) return trasigt('hittar ingen adress till rutarkivet i /karta/');

  const svar = await hamta(m[0], { headers: { Range: 'bytes=0-127' } });
  const cache = svar.headers.get('cf-cache-status') ?? 'okänd';
  if (svar.status === 206) {
    ok(`${m[0]} svarar 206, cache ${cache}`);
  } else {
    trasigt(
      `${m[0]} svarar ${svar.status} i stället för 206, cache ${cache}. ` +
        'Kartan är då tom för besökaren. Se public/_headers.',
    );
  }
  void index;
}

/* ── 4. Sitemapen ───────────────────────────────────────────────────────── */
async function kollaSitemapen() {
  console.log('\nSitemapen');
  const svar = await hamta('/sitemap-index.xml');
  if (svar.status !== 200) return trasigt(`sitemap-index svarar ${svar.status}`);
  const xml = await svar.text();
  const filer = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]);
  if (filer.length === 0) return trasigt('sitemap-index är tom');

  let summa = 0;
  let tomma = 0;
  for (const fil of filer) {
    const del = await fetch(fil, { headers: { 'User-Agent': UA } });
    if (del.status !== 200) {
      trasigt(`${fil} svarar ${del.status}`);
      continue;
    }
    const n = [...(await del.text()).matchAll(/<loc>/g)].length;
    summa += n;
    if (n === 0) tomma += 1;
  }
  if (tomma > 0) trasigt(`${tomma} av ${filer.length} sitemapfiler är tomma`);
  else ok(`${filer.length} sitemapfiler, ${summa} adresser`);
}

/* ── 5. robots.txt ──────────────────────────────────────────────────────── */
async function kollaRobots() {
  console.log('\nrobots.txt');
  const svar = await hamta('/robots.txt');
  if (svar.status !== 200) return trasigt(`robots.txt svarar ${svar.status}`);
  const text = await svar.text();
  if (!/Sitemap:\s*https:\/\/prikko\.se\/sitemap-index\.xml/i.test(text)) {
    trasigt('robots.txt pekar inte på sitemap-index');
  } else {
    ok('pekar på sitemap-index');
  }
  /* En bred Disallow är det billigaste sättet att stänga av hela sajten av
     misstag, och det syns inte någon annanstans. */
  if (/^\s*Disallow:\s*\/\s*$/m.test(text.split('User-agent: *').pop() ?? '')) {
    trasigt('robots.txt stänger ute alla robotar från hela sajten');
  } else {
    ok('ingen generell Disallow mot hela sajten');
  }
}

/* ── 6. En verksamhetssida bär sin bedömning och sin strukturerade data ───── */
async function kollaVerksamhetssida() {
  console.log('\nEn verksamhetssida');
  const svar = await hamta('/stockholm/ag/');
  if (svar.status !== 200) return trasigt(`/stockholm/ag/ svarar ${svar.status}`);
  const html = await svar.text();
  if (!/application\/ld\+json/.test(html)) trasigt('sidan saknar JSON-LD');
  else ok('bär JSON-LD');
  if (!/FoodEstablishment/.test(html)) trasigt('JSON-LD saknar FoodEstablishment');
  else ok('JSON-LD bär FoodEstablishment');
  if (!/<link rel="canonical"/.test(html)) trasigt('sidan saknar canonical');
  else ok('bär canonical');
  if (/Ingen aktuell kontroll|Inga anmärkningar|Brister/.test(html)) ok('bär en bedömningstext');
  else trasigt('sidan säger ingenting om bedömningen');
}

/* ── 7. Dubbletten på pages.dev ─────────────────────────────────────────────
 *
 * Mätt 2026-08-31: prikko.pages.dev serverar hela sajten med `Allow: /` och
 * utan noindex, alltså 28 520 adresser i stället för 14 260. Sidorna bär rätt
 * canonical, vilket dämpar det mesta, men en kanonisk länk är en signal och
 * inte en spärr. Adressen släcks i Cloudflares kontrollpanel, och den här
 * raden finns för att påminna tills det är gjort.
 */
async function kollaDubbletten() {
  console.log('\nDubbletten på pages.dev');
  try {
    const svar = await fetch('https://prikko.pages.dev/robots.txt', {
      headers: { 'User-Agent': UA },
    });
    if (svar.status !== 200) return ok('prikko.pages.dev svarar inte längre, alltså släckt');
    const text = await svar.text();
    if (/Disallow:\s*\/\s*$/m.test(text)) ok('prikko.pages.dev stänger ute robotar');
    else varna('prikko.pages.dev serverar hela sajten en andra gång med Allow: /');
  } catch {
    ok('prikko.pages.dev svarar inte längre, alltså släckt');
  }
}

console.log(`Hälsokoll mot ${bas}`);
await kollaStartsidan();
await kollaFarskhet();
await kollaKartarkivet();
await kollaSitemapen();
await kollaRobots();
await kollaVerksamhetssida();
await kollaDubbletten();

console.log(`\n${fel} fel, ${varning} varningar.`);
process.exit(fel > 0 ? 1 : 0);
