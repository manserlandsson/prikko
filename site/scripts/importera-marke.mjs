/**
 * NYTT ÅR, NYTT MÄRKE. Så här gör du.
 *
 *   1. Rita om märket med det nya årtalet. Utgå från förra årets fil i brand/.
 *      Årtalet måste vara konverterat till kurvor, alltså INTE en textruta.
 *      Skriptet vägrar filen annars.
 *   2. Spara den i brand/ med ett filnamn utan å, ä och ö, till exempel
 *      brand/prikko-utmarkelse-2027.svg
 *   3. Stå i site/ och kör:
 *
 *        node scripts/importera-marke.mjs ../brand/prikko-utmarkelse-2027.svg 2027
 *
 *   4. Klart. Skriptet lägger märket i src/marks/ och sidorna hittar det
 *      själva. Committa både din ritning i brand/ och filen skriptet skrev.
 *
 * Glömmer du steg 3 stannar bygget och säger vilket år som saknar sitt märke.
 * En lista kan alltså aldrig gå ut med fel årtal bredvid sig.
 *
 * ## Varför ett nytt märke varje år
 *
 * Årtalet i ritningen är kurvor och går inte att byta med en variabel. Ägaren
 * har valt att du ritar en ny fil per år, och det är rätt val: alternativet var
 * att lägga årtalet som riktig text ovanpå en krans utan årtal, men märket
 * laddas ner och hamnar i ett fönster, på en meny eller i ett
 * trycksaksprogram, alltså på maskiner utan Instrument Sans. Årtalet hade då
 * fallit tillbaka på Helvetica rakt under en wordmark som är kurvor.
 *
 * Årtalet bär dessutom hela konstruktionen: märket får sitta kvar i ett fönster
 * just för att det säger 2026 och ingenting om nuläget. Det är den sista
 * detaljen som får rendera olika på olika maskiner.
 *
 * ## Vad skriptet gör
 *
 * Färgen byts mot `currentColor`. Ritningen bär då ingen egen färg, och den
 * som visar den bestämmer. Det var också vad som gjorde två filer till en:
 * blå och grå var samma ritning med tjugo enheters skillnad i sidmarginal,
 * verifierat koordinat för koordinat.
 *
 * `width` och `height` tas bort och bara `viewBox` står kvar, så att märket
 * skalar med sin behållare i stället för att slåss med den.
 *
 * MATSNUSKLÄGET ÄR BORTTAGET. Skriptet hade ett andra mål, `matsnusk`, som
 * skrev src/marks/matsnusk.ts utan årtal. Ägaren tog bort matsnuskmärket
 * 2026-08-22: "ta bort matsnusk märket helt, vill inte köra det." Läget är
 * struket och inte lämnat kvar oanvänt, för ett läge som ingen kör är ett läge
 * ingen märker är trasigt den dag någon råkar köra det.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'src', 'marks');

const [sourceArg, malArg] = process.argv.slice(2);
if (!sourceArg || !malArg) {
  throw new Error('Kör: node scripts/importera-marke.mjs <källa.svg> <år>');
}

const year = Number(malArg);
if (!Number.isInteger(year) || year < 2020 || year > 2100) {
  throw new Error(`Orimligt årtal: ${malArg}`);
}

const source = resolve(process.cwd(), sourceArg);
const raw = readFileSync(source, 'utf8');

/*
 * En färg, inte flera.
 *
 * Hela poängen med `currentColor` är att märket bär EN färg som sammanhanget
 * sätter. Kommer det en ritning med två färger går den inte att byta färg på
 * det här sättet, och då ska skriptet säga det i stället för att tysta göra
 * halva jobbet.
 */
const colors = [...new Set([...raw.matchAll(/#[0-9A-Fa-f]{3,8}\b/g)].map((m) => m[0].toUpperCase()))]
  // Vit används av Figmas exportmasker och är aldrig en färg i ritningen.
  .filter((c) => c !== '#FFF' && c !== '#FFFFFF');

if (colors.length !== 1) {
  throw new Error(
    `Ritningen har ${colors.length} färger (${colors.join(', ')}). ` +
      'Märket måste bära exakt en för att kunna färgsättas av sammanhanget.',
  );
}

/*
 * svgo körs via npx och är alltså ingen byggberoende.
 *
 * Det här skriptet körs för hand när en ny ritning kommer, inte vid varje
 * bygge. Måns export är 18,8 kB Figma-utdata med masker som visade sig vara
 * ren exportkrafs: kontrollerat med en pixeljämförelse renderade filen
 * likadant utan dem. Efter svgo på två decimalers precision är den 10,4 kB,
 * och 17 av 490 000 pixlar skiljer sig, alltså kantutjämning.
 */
const optimised = execFileSync(
  'npx',
  ['--yes', 'svgo', '--precision=2', '--multipass', '-i', source, '-o', '-'],
  { encoding: 'utf8' },
);

let out = optimised.replace(new RegExp(colors[0], 'gi'), 'currentColor');

if (!/viewBox="[^"]+"/.test(out)) {
  throw new Error('Ritningen saknar viewBox och kan inte skala.');
}

/*
 * Bara ROTTAGGENS width och height, inte allas.
 *
 * Raden var en global ersättning och tog `width` och `height` var den än stod.
 * Det gick obemärkt förbi utmärkelsen därför att svgo råkar skriva om dess
 * enda rektangel till en bana, alltså fanns inga attribut kvar att förstöra.
 * Matsnuskmärket ÄR två rektanglar, och de kom ut som `<rect x="3.5" y="3.5"
 * stroke-width="7"/>`, alltså utan storlek och osynliga i bygget.
 *
 * Sensmoralen är samma som skuggan i maskotprogrammet §4e: det som aldrig
 * mäts driver, och ett steg som råkar ha rätt på en fil har inte rätt.
 *
 * Utmärkelsen är omgenererad med rättelsen och växte 138 byte, alltså de
 * `width` och `height` svgo sätter på tre `<mask>`. Att det renderar likadant
 * är MÄTT och inte antaget: de två filerna ritades i 900 px och jämfördes
 * pixel för pixel, 0 av 1 508 400 delpixlar skiljer. Skälet är att maskernas
 * banor ligger innanför både det gamla förvalet, 120 procent av ytan, och den
 * nya uttryckliga rutan.
 */
out = out.replace(/^(<svg\b[^>]*?)\s*>/, (_, tagg) =>
  tagg.replace(/\s(width|height)="[^"]*"/g, '') + '>',
);

if (out.includes('<text')) {
  throw new Error(
    'Ritningen innehåller <text>. Typsnittet måste vara konverterat till kurvor, ' +
      'annars renderar märket olika på en maskin utan Instrument Sans.',
  );
}

/*
 * Ritningen skrivs som en TS-modul, inte som en .svg i src/.
 *
 * Astro behandlar varje .svg under src/ som en tillgång och gör om den till en
 * komponent. Vill man i stället åt filens innehåll som text krockar de två:
 * bygget snurrade i Vites transformsteg och tog aldrig slut, både med
 * `import.meta.glob(..., { query: '?raw' })` och med en rak `?raw`-import.
 * Utspårad med `sample` på den hängande processen, som stod och körde
 * microtasks i fillagret.
 *
 * En genererad modul går förbi hela den apparaten och är dessutom samma mönster
 * som resten av datalagret: `import.meta.glob` över vanliga moduler, precis som
 * kommunerna i db.ts och utgåvorna i utmarkelser.ts. Den fungerar också om
 * sajten en dag renderas på edge, där det inte finns något filsystem att läsa
 * ifrån.
 *
 * Måns original ligger kvar orört i brand/. Filen här är kompilatet.
 */
mkdirSync(OUT, { recursive: true });
const target = join(OUT, `utmarkelse-${year}.ts`);
const viewBox = out.match(/viewBox="([^"]+)"/)[1];

const huvud =
  ` * Utmärkelsemärket ${year}. GENERERAD FIL, redigera den inte för hand.\n` +
  ` *\n` +
  ` * Skriven av scripts/importera-marke.mjs ur ${sourceArg}.\n` +
  ` * Färgen är utbytt mot currentColor, se lib/marke.ts för varför.\n`;

writeFileSync(
  target,
  `/**\n${huvud} */\n` +
    `export const year = ${year};\n` +
    `export const viewBox = '${viewBox}';\n` +
    `export const source =\n  ${JSON.stringify(out.trim())};\n`,
);

console.log(
  `${malArg}: ${(raw.length / 1024).toFixed(1)} kB in, ${(out.length / 1024).toFixed(1)} kB ut, ` +
    `färgen ${colors[0]} utbytt mot currentColor.`,
);
console.log(`Skrev ${target}`);
