/**
 * Bygggrind: den härledda slugen får aldrig avvika utan att bli undantag.
 *
 * Skriptet mäter hur stor andel av beståndet som går att härleda, och visar
 * de avvikelser som därför måste skickas med som undantag i kartdatan.
 * Se src/lib/slug.ts.
 */
import { readFileSync, globSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugify } from '../src/lib/slug.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let tot = 0, miss = 0;
const ex = [];
for (const f of globSync('src/data/*.json', { cwd: root })) {
  const d = JSON.parse(readFileSync(join(root, f), 'utf8'));
  for (const e of d.establishments) {
    tot++;
    if (slugify(e.name) !== e.slug) {
      miss++;
      if (ex.length < 8) ex.push([e.name, e.slug, slugify(e.name)]);
    }
  }
}
console.log(`totalt ${tot}, avviker ${miss} (${(100 * miss / tot).toFixed(1)} %)`);
for (const [n, s, g] of ex) console.log(`  ${JSON.stringify(n)}  pipeline=${s}  härledd=${g}`);
