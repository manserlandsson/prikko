/**
 * Spärr: varje anmälningslänk ska leva, och varje förifyllning ska bita.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR DET HÄR INTE ÄR EN BYGGGRIND
 * ---------------------------------------------------------------------------
 * Skriptet gör tjugo nätverksanrop mot tolv kommuners e-tjänstplattformar.
 * Ett bygge ska vara offline och deterministiskt, alltså körs det för hand
 * eller på schema, inte i `npm run build`. Kör det när tabellen ändras och när
 * `KONTROLLERAD` i src/lib/anmalan.data.ts börjar kännas gammal:
 *
 *     node scripts/kontrollera-anmalan.mjs
 *
 * Utfallet är en rad per länk och exitkod 1 om något fällde.
 *
 * ---------------------------------------------------------------------------
 * DE TRE SAKER SOM MÄTS, OCH VARFÖR JUST DE
 * ---------------------------------------------------------------------------
 * 1. SVARAR ADRESSEN? En död länk i en anmälningsruta är värre än ingen ruta.
 *
 * 2. ÄR 200 VERKLIGEN 200? Jönköpings portal renderas i klienten. ALLT under
 *    etjanst.jonkoping.se svarar 200 med samma skal på 4 652 tecken, även
 *    /sitemap.xml och en påhittad sökväg som sedan skickas till /404 i
 *    webbläsaren. Formulären hämtas över socket.io, alltså finns ingen
 *    HTTP-resurs att fråga. En status därifrån bevisar ingenting.
 *
 *    I stället kontrolleras KOMMUNENS EGEN SIDA: står adressen kvar i markupen
 *    på jonkoping.se/bygga-bo--miljo/miljo-och-halsa/livsmedel-matforgiftning-och-klagomal
 *    så publicerar kommunen den fortfarande. Det är ett svagare bevis än ett
 *    renderat formulär, men det är ett ÄKTA bevis, till skillnad från en 200
 *    som alla sökvägar får. Att sidorna faktiskt renderar rätt formulär är
 *    kontrollerat i webbläsare 2026-08-27.
 *
 * 3. BITER FÖRIFYLLNINGEN? SiteVisions fältnamn är nodid:n i kommunens CMS.
 *    Bygger kommunen om formuläret byter de värde, och en okänd parameter
 *    kastas då bort UTAN felmeddelande. Skriptet skickar ett provnamn och
 *    kräver att det kommer tillbaka i svaret. Kommer det inte det har
 *    förifyllningen tystnat, och det syns inte på någon status.
 *
 *    För SiteVision jämförs dessutom fältets etikett mot `namnEtikett` i
 *    tabellen. Skulle kommunen flytta id:t till ett ANNAT fält skulle
 *    provnamnet komma tillbaka ändå, i fel ruta.
 *
 * Provnamnet är avsiktligt fult: snedstreck, plus, ampersand och å-ä-ö i ett
 * och samma ord, för det är de tecknen som brukar tappas i en kodningskedja.
 */

import https from 'node:https';
import tls from 'node:tls';

import { ANMALAN, KONTROLLERAD } from '../src/lib/anmalan.data.ts';
import { anmalningsvagar } from '../src/lib/anmalan.ts';

const UA = 'PrikkoBot/0.1 (+https://prikko.se)';

/** Ett namn som provar hela teckenkedjan på en gång. */
const PROVNAMN = 'M/s Ballerina + Café Lödde Å & Co';
const PROVADRESS = 'Provgatan 1';
/** Stockholm binder på sitt eget guid; det här är M/s Ballerina. */
const PROVID = 'F-0180-00b1cf0a-aa70-4533-bbe0-2e19cb88a9a7';

/**
 * Kommunens egen sida, den som länkar båda jönköpingstjänsterna. Se punkt 2.
 */
const JONKOPING_KALLSIDA =
  'https://www.jonkoping.se/bygga-bo--miljo/miljo-och-halsa/livsmedel-matforgiftning-och-klagomal';

let fallda = 0;

function fall(rad, skal) {
  fallda++;
  console.log(`  FEL  ${rad}\n       ${skal}`);
}

/**
 * Mellancertifikat som servern glömt skicka, hämtade som en webbläsare gör.
 *
 * JÖNKÖPING SKICKAR EN OFULLSTÄNDIG KEDJA. `etjanst.jonkoping.se` levererar
 * bara sitt eget certifikat och utelämnar Sectigos mellancertifikat.
 * Webbläsare lagar det själva genom att följa `CA Issuers`-adressen i
 * certifikatets Authority Information Access, och därför märker ingen besökare
 * något. Strikta klienter, curl och Node bland dem, fäller i stället med
 * "unable to get local issuer certificate".
 *
 * Att stänga av certifikatkontrollen hade dolt felet. I stället gör skriptet
 * samma sak som webbläsaren: läser adressen ur certifikatet, hämtar
 * mellancertifikatet och provar om. Då mäter vi det besökaren faktiskt möter,
 * utan att sluta verifiera.
 */
const mellanCache = new Map();

async function mellancertifikat(host) {
  if (mellanCache.has(host)) return mellanCache.get(host);

  const uri = await new Promise((resolve, reject) => {
    const sock = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false }, () => {
      const info = sock.getPeerCertificate()?.infoAccess ?? {};
      sock.destroy();
      resolve(info['CA Issuers - URI']?.[0] ?? null);
    });
    sock.on('error', reject);
  });
  if (!uri) {
    mellanCache.set(host, null);
    return null;
  }

  const der = Buffer.from(await (await fetch(uri, { headers: { 'user-agent': UA } })).arrayBuffer());
  const pem =
    '-----BEGIN CERTIFICATE-----\n' +
    (der.toString('base64').match(/.{1,64}/g) ?? []).join('\n') +
    '\n-----END CERTIFICATE-----\n';
  mellanCache.set(host, pem);
  return pem;
}

/** Sant för de felkoder som betyder "kedjan är ofullständig", inte "fel cert". */
function saknarMellancert(err) {
  const kod = err?.cause?.code ?? err?.code;
  return kod === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || kod === 'SELF_SIGNED_CERT_IN_CHAIN';
}

async function hamta(url) {
  const begaran = { headers: { 'user-agent': UA }, redirect: 'follow' };
  let svar;
  try {
    svar = await fetch(url, begaran);
  } catch (err) {
    if (!saknarMellancert(err)) throw err;
    const host = new URL(url).hostname;
    const pem = await mellancertifikat(host);
    if (!pem) throw err;
    svar = await hamtaMedCa(url, [...tls.rootCertificates, pem]);
    lagadKedja.add(host);
    return svar;
  }
  return { status: svar.status, url: svar.url, text: await svar.text() };
}

/**
 * En GET med egen rotlista, för fallet ovan.
 *
 * `node:https` och inte `fetch`, eftersom fetch inte tar emot en CA-lista utan
 * en dispatcher ur undici, och undici är inget beroende sajten har. Omdirigering
 * följs för hand; tio hopp är fler än någon av kommunerna använder.
 */
function hamtaMedCa(url, ca, hopp = 0) {
  return new Promise((resolve, reject) => {
    if (hopp > 10) return reject(new Error('för många omdirigeringar'));
    https
      .get(url, { ca, headers: { 'user-agent': UA } }, (res) => {
        const plats = res.headers.location;
        if (plats && res.statusCode >= 300 && res.statusCode < 400) {
          res.resume();
          return resolve(hamtaMedCa(new URL(plats, url).href, ca, hopp + 1));
        }
        const bitar = [];
        res.on('data', (b) => bitar.push(b));
        res.on('end', () =>
          resolve({ status: res.statusCode, url, text: Buffer.concat(bitar).toString('utf8') }),
        );
      })
      .on('error', reject);
  });
}

/** Värdar vars kedja vi fick laga åt dem. Skrivs ut sist som en anmärkning. */
const lagadKedja = new Set();

/**
 * Kommer provnamnet tillbaka?
 *
 * SiteVision lägger det i ett `value="..."` med HTML-escapade entiteter,
 * Stockholm i ett `urlParameters`-objekt i sidans skript med apostrofer runt.
 * I stället för att modellera båda formaten avkodas svaret grovt och söks som
 * text: det som ska bevisas är att värdet ÖVERLEVDE resan, inte var det står.
 */
function barNamnet(text, namn) {
  const avkodat = text
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
  return avkodat.includes(namn);
}

/** Etiketten för ett fält, ur `<label for="...">`. */
function etikettFor(text, faltnamn) {
  const m = new RegExp(`<label[^>]*for="${faltnamn}"[^>]*>([\\s\\S]*?)</label>`).exec(text);
  if (!m) return null;
  return m[1]
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    // SiteVision hänger på en obligatoriemarkering i etiketten. Den säger
    // något om fältet, inte om vad fältet frågar efter, och den ändras när
    // kommunen gör ett fält valfritt. Bort med den.
    .replace(/\*\s*\(obligatorisk\)\s*$/, '')
    .trim();
}

console.log(`Tabellen säger kontrollerad ${KONTROLLERAD}. Mäter om.\n`);

/** Kommunens egen sida, hämtad en gång och läst två. */
let jonkopingsKallsida = null;

for (const [kod, kommun] of Object.entries(ANMALAN)) {
  for (const [arende, lank] of Object.entries(kommun)) {
    if (!lank) continue;

    // Bygg adressen precis som sidan gör det, med provverksamheten.
    const [vag] = anmalningsvagar(
      kod,
      { id: PROVID, name: PROVNAMN, address: PROVADRESS },
      arende === 'matforgiftning',
    ).filter((v) =>
      arende === 'matforgiftning'
        ? v.etikett === 'Misstänkt matförgiftning'
        : v.etikett === 'Brister i livsmedelshanteringen',
    );

    // Borgholm har en enda tjänst för båda ärendena, och rutan visar den bara
    // en gång. Då finns ingen andra väg att mäta, och det är inte ett fel.
    const url = vag ? vag.href : lank.url;
    const rad = `${kod} ${arende.padEnd(15)}`;

    let svar;
    try {
      svar = await hamta(url);
    } catch (err) {
      fall(rad, `${url}\n       ${err.message}`);
      continue;
    }

    if (svar.status !== 200) {
      fall(rad, `${url}\n       status ${svar.status}`);
      continue;
    }

    // Jönköpings klientrenderade portal: 200 bevisar ingenting, alltså frågar
    // vi kommunens egen sida i stället. Se punkt 2 överst.
    if (url.startsWith('https://etjanst.jonkoping.se/')) {
      jonkopingsKallsida ??= await hamta(JONKOPING_KALLSIDA);
      if (jonkopingsKallsida.status !== 200) {
        fall(rad, `${JONKOPING_KALLSIDA}\n       källsidan svarar ${jonkopingsKallsida.status}.`);
        continue;
      }
      if (!jonkopingsKallsida.text.includes(lank.url)) {
        fall(
          rad,
          `${lank.url}\n       kommunen länkar inte längre adressen från\n       ` +
            `${JONKOPING_KALLSIDA}. Tjänsten är sannolikt flyttad eller borttagen.`,
        );
        continue;
      }
      console.log(`  ok   ${rad} allmän       200 länkad från kommunens egen sida`);
      continue;
    }

    const f = lank.forifyllning;
    if (!f) {
      console.log(`  ok   ${rad} allmän       ${svar.status} ${String(svar.text.length).padStart(7)} tecken`);
      continue;
    }

    if (!barNamnet(svar.text, PROVNAMN)) {
      fall(
        rad,
        `${url}\n       provnamnet kom inte tillbaka. Förifyllningen har tystnat, ` +
          `sannolikt för att fältet ${f.namn} bytt namn.`,
      );
      continue;
    }

    if (f.namnEtikett) {
      const etikett = etikettFor(svar.text, f.namn);
      if (etikett !== f.namnEtikett) {
        fall(
          rad,
          `${url}\n       fältet ${f.namn} heter nu ${JSON.stringify(etikett)}, ` +
            `tabellen säger ${JSON.stringify(f.namnEtikett)}.`,
        );
        continue;
      }
    }

    console.log(`  ok   ${rad} förifylld    ${svar.status} ${String(svar.text.length).padStart(7)} tecken`);
  }
}

for (const host of lagadKedja) {
  console.log(
    `\n  obs  ${host} skickar en ofullständig certifikatkedja. Webbläsare lagar den\n` +
      '       själva via AIA, så besökaren märker inget, men curl och Node fäller.\n' +
      '       Mätningen ovan gjordes efter att skriptet hämtat mellancertifikatet.',
  );
}

console.log(fallda === 0 ? '\nAlla länkar lever.' : `\n${fallda} fällde.`);
process.exit(fallda === 0 ? 0 : 1);
