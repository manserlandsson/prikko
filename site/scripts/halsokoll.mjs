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

/**
 * Hur ofta varje kommun HÄMTAS, i dygn, och därmed hur gammal den får bli.
 *
 * Talen ovan gäller helheten. Den här tabellen gäller en enskild kommun, och
 * den finns för att trösklarna ska FÖLJA MED av sig själva om vi någon gång
 * hämtar en kommun mer sällan. Annars byter en sådan ändring ett larm mot
 * tystnad: kommunen blir per definition äldre än tre dygn, varningen skriker
 * varje natt, någon höjer tröskeln för hand, och då varnar ingenting alls den
 * dag kommunen verkligen fryser.
 *
 * I DAG HÄMTAS ALLA TRETTON KOMMUNER VARJE NATT, alltså är undantagen tomma
 * och trösklarna exakt de gamla tre och tio. Kostnadssänkningen i september
 * 2026 togs med ett arkiv och med färre jobb, inte med rotation, just för att
 * slippa den avvägningen. Se .github/workflows/uppdatera-data.yml.
 *
 * Läggs en kommun in här ska den också stå i matrisen i nattjobbet med samma
 * takt. De två talen är samma beslut på två ställen, och det ena utan det
 * andra är ett fel.
 */
const HAMTTAKT_DYGN = 1;
const HAMTTAKT_UNDANTAG = {
  // 'exempelkommun': 3,
};

/** Trösklar för en enskild kommun, härledda ur dess hämttakt.
 *
 *  Samma regel som de tre och tio ovan, bara utskriven: VARNING när två
 *  hämtningar i rad kan ha missats plus ett dygns slack för en sen start,
 *  FEL när det gått tre missade hämtningar plus en vecka och det därför inte
 *  kan vara annat än trasigt.
 *
 *  Med takten ett dygn ger regeln 1·2+1 = 3 och 1·3+7 = 10, alltså exakt de
 *  tal som gällde innan tabellen fanns. Med takten tre dygn ger den 7 och 16. */
function troskar(slug) {
  const takt = HAMTTAKT_UNDANTAG[slug] ?? HAMTTAKT_DYGN;
  return {
    varning: takt * 2 + (FARSKHET_VARNING_DAGAR - 2),
    fel: takt * 3 + (FARSKHET_FEL_DAGAR - 3),
  };
}

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
/**
 * Datans ålder KOMMUN FÖR KOMMUN.
 *
 * kollaFarskhet ovan läser llms.txt, som bär det FÄRSKASTE hämtdatumet över
 * alla källor. Det talet kan inte se en enskild kommun som fryser, och det
 * hände: Lomma stod still från 11 september 2026 och Höganäs från 13
 * september, medan hälsokollen sa "datan är 0 dagar gammal" varje natt. Deras
 * jobb var dessutom gröna, eftersom de tre kommunerna på samma webbhotell har
 * continue-on-error i nattjobbet och en tom hämtning därför färgas grön.
 *
 * Här läses i stället `source.fetchedAt` per kommun ur det publika
 * indexet, alltså samma uppgift som varje kommunsida redovisar. Trösklarna
 * kommer ur `troskar()`, som räknar dem ur kommunens egen hämttakt.
 */
async function kollaKommunernasFarskhet() {
  console.log('\nDatans ålder per kommun');
  const svar = await hamta('/api/v1/index.json');
  if (svar.status !== 200) return trasigt(`/api/v1/index.json svarar ${svar.status}`);
  const index = await svar.json();
  const kommuner = index.municipalities ?? [];
  if (kommuner.length === 0) return trasigt('/api/v1/index.json saknar kommuner');

  const nu = Date.now();
  let farska = 0;
  for (const k of kommuner) {
    const hamtad = k.source?.fetchedAt;
    if (!hamtad) {
      trasigt(`${k.city} saknar hämtdatum i indexet`);
      continue;
    }
    const dagar = Math.floor((nu - Date.parse(hamtad)) / 86400000);
    const datum = hamtad.slice(0, 10);
    const t = troskar(k.slug);
    /* Takten står i meddelandet när den inte är varje natt, så att den som
       läser larmet ser vilken tröskel som gällde och varför. */
    const takt = HAMTTAKT_UNDANTAG[k.slug]
      ? ` (hämtas var ${HAMTTAKT_UNDANTAG[k.slug]}:e dygn, tröskel ${t.fel})`
      : '';
    if (dagar >= t.fel) {
      trasigt(`${k.city} har inte hämtats på ${dagar} dagar, senast ${datum}${takt}`);
    } else if (dagar >= t.varning) {
      varna(`${k.city} har inte hämtats på ${dagar} dagar, senast ${datum}${takt}`);
    } else {
      farska++;
    }
  }
  if (farska > 0) {
    ok(`${farska} av ${kommuner.length} kommuner hämtade inom sin egen takt`);
  }
}

/**
 * Förkopplingen till lagringens värd.
 *
 * Taggen renderas bara när PUBLIC_SUPABASE_URL finns vid bygget, och den är
 * TOM i repots egen .env medan Cloudflare har den satt. En inställning som
 * försvinner tar alltså bort raden utan att något går sönder, och sidan blir
 * några hundra millisekunder långsammare på mobil utan att någon märker det.
 * Därför kontrolleras den utifrån, på den publicerade sidan.
 */
async function kollaForkoppling() {
  console.log('\nFörkopplingen till bildernas värd');
  const svar = await hamta('/');
  if (svar.status !== 200) return trasigt(`startsidan svarar ${svar.status}`);
  const html = await svar.text();
  const tagg = /<link[^>]*rel="preconnect"[^>]*>/i.exec(html);
  if (!tagg) {
    return trasigt('startsidan saknar preconnect till lagringen. Är PUBLIC_SUPABASE_URL satt i bygget?');
  }
  const vard = /href="(https:\/\/[^"]+)"/i.exec(tagg[0])?.[1];
  const bilder = /https:\/\/[a-z0-9]+\.supabase\.co/i.exec(html)?.[0];
  if (vard && bilder && !vard.startsWith(bilder)) {
    return trasigt(`förkopplingen pekar på ${vard} men bilderna hämtas från ${bilder}`);
  }
  ok(`förkopplar till ${vard}`);
}

await kollaFarskhet();
await kollaKommunernasFarskhet();
await kollaForkoppling();
await kollaKartarkivet();
await kollaSitemapen();
await kollaRobots();
await kollaVerksamhetssida();
await kollaDubbletten();
await kollaCiterbarheten();

console.log(`\n${fel} fel, ${varning} varningar.`);
process.exit(fel > 0 ? 1 : 0);

/* ── 9. Citerbarheten ───────────────────────────────────────────────────────
 *
 * Funktionen står EFTER process.exit och det är avsiktligt. Raden ovan är den
 * enda som lagts till i den befintliga körordningen, så två grenar som båda
 * utökar den här filen kan slås ihop utan att röra varandras kod.
 * Funktionsdeklarationer hissas, så anropet ovan når den här ändå.
 *
 * ── VARFÖR DEN FINNS ──────────────────────────────────────────────────────
 *
 * `44_marknaden_2026.md` §6.6 mätte att svarsmotorerna citerar aggregatorn
 * och inte myndigheten, och att positionen är ledig på svenska. Mätningen i
 * `docs/66_citerbarheten.md` visar att vi redan står där: 2026-09-28 var
 * prikko.se träff ett i Bing på "hygienkontroll Riche Stockholm" med vår egen
 * svarsmening som utdrag.
 *
 * Den positionen kan gå förlorad utan att något ser trasigt ut. Sajten svarar
 * 200 hela tiden, precis som när nattjobbet stod stilla i tretton dagar utan
 * att någon märkte det. Samma sort av fel, samma sort av kontroll.
 *
 * ── VAD SOM KONTROLLERAS, OCH INGET ANNAT ─────────────────────────────────
 *
 * Fyra saker, och var och en motsvarar ett fel som antingen redan inträffat
 * eller som ingen skulle upptäcka:
 *
 *   1. Robotarna som hämtar för att SVARA får 200. De släpps in i dag, men
 *      omkopplaren sitter i Cloudflares gränssnitt och inte i repot, se
 *      huvudet i src/pages/robots.txt.ts. En felklickad hanterad regel
 *      stänger ute dem tyst, och robots.txt i repot ser oförändrad ut.
 *      Träningsrobotarna (GPTBot, ClaudeBot, CCBot, Google-Extended) ska
 *      vara blockerade och kontrolleras därför INTE här. Deras block är ett
 *      beslut, inte ett fel.
 *
 *   2. /llms-full.txt svarar 200 och bär sitt innehåll. Den svarade 404 fram
 *      till 2026-09-28, alltså är det dokumenterat att den kan saknas. En
 *      tom eller trasig fil är värre än ingen: den ser ut att svara.
 *
 *   3. Bedömningen står i början av verksamhetssidans <main>. Det är den enda
 *      uppgift hela kanalen vilar på. Skjuts den ned av ett nytt block får en
 *      modell som klipper tidigt fel svar utan att någon sida går sönder.
 *
 *   4. Ingen sida skriver ut "null", "undefined" eller "NaN" i löptext. Det
 *      är inte en teoretisk kontroll: 2026-09-28 stod "från null och framåt"
 *      på 1 558 verksamhetssidor, i en mening som en modell mycket väl kan
 *      citera. Felet fanns i veckor och ingen kontroll kunde se det.
 *
 * Det som INTE kontrolleras: om vi faktiskt blir citerade. Det går inte att
 * mäta utifrån utan konto hos svarsmotorerna, och en kontroll som inte kan
 * fälla är en kontroll som ljuger. Den mätningen görs för hand, och hur den
 * går till står i docs/66.
 */

/** HTML till ren text, ungefär som en modell utan renderare läser sidan. */
function rentext(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function kollaCiterbarheten() {
  console.log('\nCiterbarheten');

  /* Konstanterna står INNE i funktionen och inte ovanför den. Hela blocket
     ligger efter process.exit för att inte röra körordningen, och där hissas
     bara funktionsdeklarationer. Ett `const` på filnivå här hade legat i sin
     temporala dödzon när anropet ovan sker, vilket det också gjorde en gång:
     "Cannot access 'SVARSROBOTAR' before initialization". */

  /** Robotar som hämtar för att SVARA. Strängarna är leverantörernas egna, se
   *  robots.txt.ts. Träningsrobotarna står medvetet inte här: att de är
   *  blockerade är ett beslut och inte ett fel. */
  const SVARSROBOTAR = [
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +Claude-SearchBot@anthropic.com)',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  ];

  /** Sidan som provas. Samma som kollaVerksamhetssida använder, så att ett fel
   *  går att jämföra mellan de två kontrollerna. */
  const PROVSIDA = '/stockholm/ag/';

  /**
   * Hur långt in i <main> bedömningen får stå, i tecken.
   *
   * Uppmätt 2026-09-28 över fem sidor valda för långa namn och adresser:
   * /stockholm/ag/ 100, /stockholm/riche/ 102, Örebros längsta namn 156.
   * Taket 200 ger 44 tecken marginal mot det värsta uppmätta fallet, alltså
   * ungefär ett tillagt ord i rubrikraden. Ett nytt BLOCK före bedömningen
   * fäller, ett längre verksamhetsnamn gör det inte, och det är precis den
   * skillnad kontrollen ska göra.
   */
  const BEDOMNING_SENAST = 200;

  /** Samma sak för den självbärande svarsmeningen, alltså den rad ett citat
   *  faktiskt lyfter. Uppmätt samma dag: 307 till 517 tecken in. */
  const SVARSMENING_SENAST = 700;

  /* ── 1. Släpps de robotar in som hämtar för att svara? ─────────────────── */
  let stangda = 0;
  for (const ua of SVARSROBOTAR) {
    const namn = /compatible;?\s*([A-Za-z-]+)\//.exec(ua)?.[1] ?? ua.slice(0, 20);
    const svar = await hamta(PROVSIDA, { headers: { 'User-Agent': ua } });
    if (svar.status !== 200) {
      stangda += 1;
      trasigt(
        `${namn} får ${svar.status} på ${PROVSIDA}. Robotar som hämtar för att SVARA ska ` +
          'släppas in. Omkopplaren sitter i Cloudflare, AI Crawl Control.',
      );
    }
  }
  if (stangda === 0) ok(`${SVARSROBOTAR.length} svarsrobotar får 200 på ${PROVSIDA}`);

  /* ── 2. Bär llms-full.txt sitt innehåll? ───────────────────────────────────
   *
   * Tre stickprov och inte en storlekskontroll. En fil kan bli 25 kB av bara
   * rubriker. Det som ska finnas är citeringsvillkoren, kodlistan och
   * kommunernas tal, alltså de tre avsnitt filen byggdes för, plus att talen
   * bär sina hämtdatum. */
  const full = await hamta('/llms-full.txt');
  if (full.status !== 200) {
    trasigt(`llms-full.txt svarar ${full.status}. Filen svarade 404 fram till 2026-09-28.`);
  } else {
    const text = await full.text();
    const saknas = [
      '## Så ska en uppgift härifrån citeras',
      '## Vad orden betyder',
      '## Kommunerna i tal',
    ].filter((rubrik) => !text.includes(rubrik));
    if (saknas.length > 0) {
      trasigt(`llms-full.txt saknar ${saknas.join(', ')}`);
    } else if (!/Uppgifterna hämtade \d/.test(text)) {
      trasigt('llms-full.txt saknar hämtdatum vid kommunernas tal');
    } else {
      ok(`llms-full.txt svarar 200, ${(text.length / 1024).toFixed(0)} kB, alla avsnitt på plats`);
    }
  }

  /* ── 3. Står bedömningen först i <main>? ──────────────────────────────── */
  const sida = await hamta(PROVSIDA);
  if (sida.status !== 200) {
    trasigt(`${PROVSIDA} svarar ${sida.status}`);
  } else {
    const main = /<main[^>]*>([\s\S]*?)<\/main>/i.exec(await sida.text())?.[1];
    if (!main) {
      trasigt(`${PROVSIDA} har ingen <main>, så innehållet går inte att skilja från ramen`);
    } else {
      const t = rentext(main);
      const ord =
        /(Inga anmärkningar|Brister som kvarstår|Brister|Ingen aktuell kontroll|Ingen kontroll)/.exec(
          t,
        );
      if (!ord) {
        trasigt(`${PROVSIDA} säger ingenting om bedömningen i <main>`);
      } else if (ord.index > BEDOMNING_SENAST) {
        trasigt(
          `bedömningen står ${ord.index} tecken in i <main> på ${PROVSIDA}, taket är ` +
            `${BEDOMNING_SENAST}. En modell som klipper tidigt får fel svar.`,
        );
      } else {
        ok(`bedömningen står ${ord.index} tecken in i <main>`);
      }

      /* Svarsmeningen ska bära både verksamheten och ett datum. Ett citat utan
         datum blir gammalt utan att synas, och det är hela skälet till att
         meningen är skriven självbärande. Se VERDICT i lib/site.ts. */
      const mening = /[^.!?]*hygienkontroll[^.!?]*\./i.exec(t.slice(0, 1500));
      if (!mening) {
        trasigt(`${PROVSIDA} saknar en självbärande mening om bedömningen i början av <main>`);
      } else if (mening.index > SVARSMENING_SENAST) {
        trasigt(
          `svarsmeningen står ${mening.index} tecken in i <main>, taket är ${SVARSMENING_SENAST}`,
        );
      } else if (!/\d{1,2} [a-zåäö]+ \d{4}/.test(mening[0])) {
        trasigt(`svarsmeningen på ${PROVSIDA} bär inget datum: "${mening[0].trim()}"`);
      } else {
        ok(`svarsmeningen står ${mening.index} tecken in i <main> och bär sitt datum`);
      }
    }
  }

  /* ── 4. Läcker ett tomt värde ut i löptexten? ──────────────────────────────
   *
   * Provet tas på en sida där ett fält SAKNAS, eftersom det är där en
   * oskyddad interpolation syns. Verksamheten utan publicerad kontroll är
   * fallet som faktiskt gick sönder. Sökningen gäller ren text ur <main> och
   * inte HTML, så attribut, klassnamn och JSON-LD inte ger falskt utslag. */
  for (const sokvag of ['/orebro/natu-sushi-kitchen-nyregistrerad/', PROVSIDA, '/orebro/']) {
    const svar = await hamta(sokvag);
    if (svar.status !== 200) {
      varna(`${sokvag} svarar ${svar.status}, kunde inte provas för tomma värden`);
      continue;
    }
    const main = /<main[^>]*>([\s\S]*?)<\/main>/i.exec(await svar.text())?.[1] ?? '';
    const t = rentext(main);
    const tom = /\b(null|undefined|NaN)\b/.exec(t);
    if (tom) {
      trasigt(
        `${sokvag} skriver ut "${tom[1]}" i löptext: ` +
          `"...${t.slice(Math.max(0, tom.index - 60), tom.index + 60)}..."`,
      );
    } else {
      ok(`${sokvag} skriver inget tomt värde i löptext`);
    }
  }
}
