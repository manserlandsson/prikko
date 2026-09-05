/**
 * Spärr: varje mottagaradress ska fortfarande stå på den sida vi läste den på.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR DET HÄR INTE ÄR EN BYGGGRIND
 * ---------------------------------------------------------------------------
 * Skriptet gör tretton nätverksanrop mot tretton kommuners webbplatser. Ett
 * bygge ska vara offline och deterministiskt, alltså körs det för hand eller på
 * schema, precis som scripts/kontrollera-anmalan.mjs:
 *
 *     node scripts/kontrollera-begaran.mjs
 *
 * Utfallet är en rad per kommun och exitkod 1 om något fällde.
 *
 * ---------------------------------------------------------------------------
 * VAD SOM GÅR ATT MÄTA MASKINELLT, OCH VAD SOM INTE GÖR DET
 * ---------------------------------------------------------------------------
 * EN E-POSTADRESS GÅR INTE ATT PRÖVA SOM EN LÄNK. Systerskriptet kan hämta en
 * URL och se en 200; här finns ingen resurs att hämta. Att skicka ett provbrev
 * vore att skicka en begäran till en myndighet, alltså precis det den här
 * funktionen aldrig gör. En SMTP-fråga mot mottagarens server är inte heller
 * ett svar: kommunernas mejlbrandväggar svarar 250 på i stort sett vad som
 * helst och avvisar först efteråt.
 *
 * Det som DÄREMOT går att mäta är hela skälet till att adressen står i
 * tabellen: att kommunen fortfarande publicerar den. Skriptet hämtar `kalla`,
 * kräver 200, och kräver att `epost` står ordagrant i sidans markup. Byter
 * kommunen brevlåda, lägger ner enheten eller flyttar sidan, fäller körningen.
 * Det är ett svagare bevis än en levande länk och ett äkta bevis, till skillnad
 * från en 200 som varje sökväg får.
 *
 * TVÅ SAKER KONTROLLERAS INTE, OCH DET SKA STÅ RAKT UT:
 *
 * 1. `etikett` jämförs inte. Rubriken adressen står under är vårt bevis för att
 *    brevlådan tillhör rätt myndighet, men den bär å, ä och ö, och kommunerna
 *    skriver dem än som tecken och än som `&aring;`. En jämförelse hade fällt
 *    på kodningen i stället för på sakfrågan. Etiketten är alltså läst av en
 *    människa den dag som står i `kontrollerad` och läses om av en människa.
 * 2. Att adressen tas emot av rätt enhet inne i kommunen. Det syns först i ett
 *    svar, och ett svar kräver ett brev vi aldrig skickar.
 *
 * ---------------------------------------------------------------------------
 * KOMMUNER UTAN ADRESS
 * ---------------------------------------------------------------------------
 * Skriptet läser också vilka kommuner sajten har data för och skriver ut de som
 * saknar rad i tabellen. Det är ingen fällning: `null` är ett fullgott svar och
 * en kommun utan verifierad adress ska inte få någon länk. Men en ny kommun som
 * lagts till i src/data utan att någon läst dess registratorsadress ska synas,
 * inte försvinna i tystnad.
 */

import { readdirSync, openSync, readSync, closeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { UTLAMNARE, KONTROLLERAD } from '../src/lib/begaran.data.ts';

const UA = 'PrikkoBot/0.1 (+https://prikko.se)';

const HAR = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(HAR, '..', 'src', 'data');

let fallda = 0;

function fall(rad, skal) {
  fallda++;
  console.log(`  FEL  ${rad}\n       ${skal}`);
}

/**
 * Kommunkod och namn ur en beståndsfil, utan att läsa hela filen.
 *
 * stockholm.json är 40 MB och skulle ta någon sekund att tolka för två fält
 * som ligger i de första hundra tecknen. `municipality` är alltid först i
 * filen, se pipeline/export_site.py.
 */
function kommunUrFil(fil) {
  const fd = openSync(fil, 'r');
  const buf = Buffer.alloc(4096);
  const n = readSync(fd, buf, 0, buf.length, 0);
  closeSync(fd);
  const huvud = buf.subarray(0, n).toString('utf8');
  const kod = /"code":\s*"(\d{4})"/.exec(huvud)?.[1] ?? null;
  const namn = /"name":\s*"([^"]+)"/.exec(huvud)?.[1] ?? path.basename(fil, '.json');
  return { kod, namn };
}

async function hamta(url) {
  const svar = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
  return { status: svar.status, url: svar.url, text: await svar.text() };
}

console.log(`Tabellen säger kontrollerad ${KONTROLLERAD}. Mäter om.\n`);

for (const [kod, m] of Object.entries(UTLAMNARE)) {
  const rad = `${kod} ${m ? m.epost.padEnd(32) : ''}`;

  if (!m) {
    console.log(`  obs  ${kod} ingen adress, ingen länk visas`);
    continue;
  }

  let svar;
  try {
    svar = await hamta(m.kalla);
  } catch (err) {
    fall(rad, `${m.kalla}\n       ${err.message}`);
    continue;
  }

  if (svar.status !== 200) {
    fall(rad, `${m.kalla}\n       status ${svar.status}`);
    continue;
  }

  // Adressen är ren ASCII, alltså behöver svaret inte avkodas. En mailto skrivs
  // ibland som `mailto:x@y.se` och ibland som ren text; båda innehåller
  // strängen, och det är det enda som ska bevisas.
  if (!svar.text.includes(m.epost)) {
    fall(
      rad,
      `${m.kalla}\n       adressen står inte längre på sidan. Kommunen har bytt\n` +
        '       brevlåda eller byggt om sidan. Läs om posten för hand.',
    );
    continue;
  }

  console.log(`  ok   ${rad} ${String(svar.text.length).padStart(7)} tecken`);
}

/* Kommuner i beståndet som saknar rad. Ingen fällning, se rubriken. */
const utan = readdirSync(DATA)
  .filter((f) => f.endsWith('.json'))
  .map((f) => kommunUrFil(path.join(DATA, f)))
  .filter((k) => k.kod && !(k.kod in UTLAMNARE));

if (utan.length > 0) {
  console.log('\n  obs  kommuner i beståndet utan mottagaradress, alltså utan länk:');
  for (const k of utan) console.log(`       ${k.kod} ${k.namn}`);
}

console.log(fallda === 0 ? '\nAlla adresser står kvar.' : `\n${fallda} fällde.`);
process.exit(fallda === 0 ? 0 : 1);
