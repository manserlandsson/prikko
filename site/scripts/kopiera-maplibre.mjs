/**
 * Kopierar MapLibre GL ur node_modules till public/maplibre/.
 *
 * ## Varför biblioteket inte paketeras med resten
 *
 * MapLibre läser vektorkakel i en webbarbetare, och den arbetaren startar den
 * själv med
 *
 *     new URL('./maplibre-gl-worker.mjs', import.meta.url)
 *
 * `import.meta.url` blir adressen till den fil koden ligger i. Paketerar Vite
 * biblioteket till /_astro/maplibre-gl.<hash>.js pekar alltså arbetaren på
 * /_astro/maplibre-gl-worker.mjs, och den filen finns inte: Vite har inget sätt
 * att veta att strängen är en filreferens. Arbetaren blir 404.
 *
 * Felet syns inte. Stilen laddas, kontrollerna ritas, attributionen står där,
 * inget fel kastas, och kartytan förblir vit i all evighet. Rasterkällor
 * fungerar samtidigt, eftersom bilder avkodas på huvudtråden — det var den
 * skillnaden som avslöjade orsaken: `ne2_shaded` laddade, `openmaptiles`
 * gjorde det aldrig.
 *
 * ## Varför just den här lösningen
 *
 * Filerna serveras som de är, ur public/, och hämtas med sin egen adress. Då
 * stämmer `import.meta.url` med var filerna faktiskt ligger, och arbetaren
 * hittar sig själv.
 *
 * Det är dessutom den BILLIGASTE varianten. maplibre-gl.mjs och
 * maplibre-gl-worker.mjs delar maplibre-gl-shared.mjs, som är 479 kB rått och
 * den största delen av biblioteket. Som statiska filer laddas den en gång och
 * återanvänds av arbetaren ur webbläsarens cache. Låter man i stället Vite
 * paketera huvudtråden och pekar arbetaren på en egen kopia hämtas den koden
 * två gånger: 318 kB brotlat i stället för 231.
 *
 * Och det tar bort hela klassen av fel som sänkte det förra försöket: filerna
 * är identiska i dev och i bygget, så exportformen kan inte skilja sig åt.
 *
 * ## Varför de inte checkas in
 *
 * Det är en megabyte kompilat som redan finns i node_modules och som måste
 * bytas i takt med paketet. Skriptet körs av `predev` och `prebuild`, alltså
 * även i Cloudflare Pages bygg, och katalogen är gitignorerad.
 */
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const from = join(here, '..', 'node_modules', 'maplibre-gl', 'dist');
const to = join(here, '..', 'public', 'maplibre');

/**
 * maplibre-gl.mjs importerar shared, arbetaren importerar samma shared. Alla
 * tre måste ligga i samma katalog för att de relativa importerna ska gå ihop.
 * CSS:en följer med så att stilmallen kommer från samma version som koden.
 */
const FILES = [
  'maplibre-gl.mjs',
  'maplibre-gl-shared.mjs',
  'maplibre-gl-worker.mjs',
  'maplibre-gl.css',
];

mkdirSync(to, { recursive: true });

for (const file of FILES) {
  copyFileSync(join(from, file), join(to, file));
}

const { version } = JSON.parse(
  readFileSync(join(here, '..', 'node_modules', 'maplibre-gl', 'package.json'), 'utf8'),
);

console.log(`maplibre-gl ${version} → public/maplibre/ (${FILES.length} filer)`);
