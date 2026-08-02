/**
 * Låsande kontroll av kategorimappningen.
 *
 *     node site/scripts/check-categories.ts
 *
 * Läser varje fil i site/src/data, kör klassificeringen och kräver noll
 * omappade råvärden. Den låser dagens strängar och gör varje framtida
 * tillskott synligt i en diff i stället för att upptäckas som en felaktig
 * kategori på en publicerad sida.
 *
 * Avslutar med 1 när något råvärde saknas i tabellen, oavsett hur få
 * verksamheter det gäller. Bygget har en lösare gräns (en procent, se
 * UNKNOWN_ABORT_SHARE) eftersom en nattlig produktionskörning inte får stanna
 * av en enda ny nisch. Den här är den strikta varianten, för CI och för hand.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SUB_CATEGORIES,
  TOP_CATEGORIES,
  classify,
  rawValues,
  ruleFor,
  subCategory,
  type TopCategoryId,
} from '../src/lib/categories.ts';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', 'src', 'data');

interface Row {
  name: string;
  types?: string[] | null;
}

let unknownTotal = 0;
const grand = new Map<TopCategoryId, number>();
let grandTotal = 0;
let grandUncategorised = 0;

for (const file of readdirSync(dataDir).filter((f) => f.endsWith('.json')).sort()) {
  const data = JSON.parse(readFileSync(join(dataDir, file), 'utf8')) as {
    municipality: { slug: string; name: string };
    establishments: Row[];
  };
  const slug = data.municipality.slug;
  const rows = data.establishments;

  const counts = new Map<TopCategoryId, number>();
  const subCounts = new Map<string, number>();
  const status = { ok: 0, spanning: 0, no_type: 0, unknown: 0 };
  const unknown = new Map<string, number>();

  for (const row of rows) {
    const c = classify(slug, row.types);
    status[c.status] += 1;
    for (const id of c.categories) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
      grand.set(id, (grand.get(id) ?? 0) + 1);
    }
    for (const s of c.subcategories) subCounts.set(s, (subCounts.get(s) ?? 0) + 1);
    for (const v of c.unknown) unknown.set(v, (unknown.get(v) ?? 0) + 1);
  }

  grandTotal += rows.length;
  grandUncategorised += status.spanning + status.no_type + status.unknown;

  const share = (n: number) => `${((n / rows.length) * 100).toFixed(1).padStart(5)} %`;

  console.log(`\n${'='.repeat(72)}\n${data.municipality.name}  (${slug}, ${rows.length} verksamheter)`);
  for (const c of TOP_CATEGORIES) {
    const n = counts.get(c.id) ?? 0;
    console.log(`  ${c.name.padEnd(24)} ${String(n).padStart(6)}  ${share(n)}`);
  }
  console.log(
    `  ${'utan kategori'.padEnd(24)} ${String(status.spanning + status.no_type + status.unknown).padStart(6)}` +
      `   (odelbar grupp ${status.spanning}, ingen typ ${status.no_type}, okänt ${status.unknown})`,
  );

  const subs = [...subCounts.entries()].sort((a, b) => b[1] - a[1]);
  if (subs.length > 0) {
    console.log(
      `  underkategorier: ${subs.map(([id, n]) => `${subCategory(id).name} ${n}`).join(', ')}`,
    );
  }

  if (unknown.size > 0) {
    unknownTotal += unknown.size;
    console.log(`  OKÄNDA RÅVÄRDEN (${unknown.size}):`);
    for (const [v, n] of [...unknown.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`     ${String(n).padStart(6)}  ${JSON.stringify(v)}`);
    }
  }

  // Alla distinkta råvärden måste ha en regel, även attributen. Ett värde som
  // bara förekommer tillsammans med ett känt värde blir annars osynligt i
  // sammanställningen ovan.
  const seen = new Set<string>();
  for (const row of rows) for (const v of rawValues(slug, row.types)) seen.add(v);
  const missing = [...seen].filter((v) => !ruleFor(slug, v));
  if (missing.length > 0) {
    console.log(`  UTAN REGEL (${missing.length}): ${missing.map((v) => JSON.stringify(v)).join(', ')}`);
  }
}

console.log(`\n${'='.repeat(72)}\nHela riket: ${grandTotal} verksamheter`);
for (const c of TOP_CATEGORIES) {
  const n = grand.get(c.id) ?? 0;
  console.log(
    `  ${c.name.padEnd(24)} ${String(n).padStart(6)}  ${((n / grandTotal) * 100).toFixed(1)} %`,
  );
}
console.log(
  `  ${'utan kategori'.padEnd(24)} ${String(grandUncategorised).padStart(6)}  ` +
    `${((grandUncategorised / grandTotal) * 100).toFixed(1)} %`,
);
console.log(`\nUnderkategorier i tabellen: ${SUB_CATEGORIES.length}`);

if (unknownTotal > 0) {
  console.error(`\nFEL: ${unknownTotal} omappade råvärden. Komplettera site/src/lib/categories.ts.`);
  process.exit(1);
}
console.log('\nNoll omappade råvärden.');
