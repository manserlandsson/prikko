/**
 * Granskning av kedjeregistret.
 *
 *     node site/scripts/kedjegranskning.ts            sammanställning
 *     node site/scripts/kedjegranskning.ts espresso-house   varje träff
 *     node site/scripts/kedjegranskning.ts --kandidater      vad vi kan missa
 *
 * Kedjorna identifieras ur ett handskrivet register (src/lib/kedjeregister.ts)
 * och inte ur en härledning, av skäl som står i src/lib/kedjor.ts. Ett
 * register är bara bättre än en gissning om det faktiskt granskas, och därför
 * finns den här filen: den skriver ut exakt vilka verksamheter varje mönster
 * fångar, utan att bygga sajten.
 *
 * `--kandidater` gör det omvända och är det som skyddar mot att registret
 * blir inaktuellt: den räknar fram namnprefix som ser ut som kedjor men inte
 * står i registret, så att en ny kedja i beståndet syns i stället för att
 * tyst saknas. Listan är RÅ och innehåller med flit skräp ("restaurang",
 * "forskolan", "taste"); det är hela argumentet för att registret är
 * handskrivet. Den ska läsas, inte klistras in.
 */
import { readFileSync, globSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { REGISTER, chainIdFor, normalise } from '../src/lib/kedjeregister.ts';

const MIN_LOCATIONS = 6;
const MIN_ASSESSED = 3;
const CANDIDATE_MIN = 7;

interface Row {
  municipality: string;
  name: string;
  verdict: string | null;
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const rows: Row[] = [];
for (const file of globSync('src/data/*.json', { cwd: root })) {
  const data = JSON.parse(readFileSync(join(root, file), 'utf8'));
  for (const e of data.establishments) {
    rows.push({ municipality: data.municipality.city, name: e.name, verdict: e.verdict });
  }
}

const arg = process.argv[2];

if (arg === '--kandidater') {
  kandidater();
} else if (arg) {
  enKedja(arg);
} else {
  sammanstallning();
}

/** Varje kedja i registret med antal, kommuner och om den klarar grinden. */
function sammanstallning(): void {
  console.log(`${rows.length} verksamheter i beståndet.\n`);

  let members = 0;
  let pages = 0;

  for (const entry of REGISTER) {
    const hits = rows.filter((r) => chainIdFor(r.name) === entry.id);
    const municipalities = new Set(hits.map((r) => r.municipality));
    const assessed = hits.filter((r) => r.verdict !== null).length;

    const gate =
      hits.length === 0
        ? 'SAKNAS I DATAN, bygget stannar'
        : hits.length < MIN_LOCATIONS
          ? `under gränsen (${MIN_LOCATIONS} ställen)`
          : assessed < MIN_ASSESSED
            ? `under gränsen (${MIN_ASSESSED} bedömda)`
            : 'sida';

    if (gate === 'sida') pages += 1;
    members += hits.length;

    console.log(
      `${String(hits.length).padStart(4)} ställen  ` +
        `${String(municipalities.size).padStart(2)} kommuner  ` +
        `${String(assessed).padStart(4)} bedömda  ` +
        `${entry.name.padEnd(24)} ${gate}`,
    );
  }

  console.log(
    `\n${pages} kedjor får en sida. ` +
      `${members} verksamheter hör till en registrerad kedja, ` +
      `${((100 * members) / rows.length).toFixed(1)} procent av beståndet.`,
  );
}

/** Varje träff för en kedja, kommun för kommun. Det som faktiskt ska granskas. */
function enKedja(id: string): void {
  const entry = REGISTER.find((c) => c.id === id);
  if (!entry) {
    console.error(`Okänd kedja: ${id}. Kända id: ${REGISTER.map((c) => c.id).join(', ')}`);
    process.exit(1);
  }

  const hits = rows.filter((r) => chainIdFor(r.name) === entry.id);
  console.log(`${entry.name}, mönster: ${entry.patterns.join(' | ')}`);
  console.log(`${hits.length} träffar.\n`);

  for (const r of [...hits].sort(
    (a, b) => a.municipality.localeCompare(b.municipality, 'sv') || a.name.localeCompare(b.name, 'sv'),
  )) {
    console.log(`  ${r.municipality.padEnd(14)} ${(r.verdict ?? '-').padEnd(6)} ${r.name}`);
  }
}

/**
 * Namnprefix som ser ut som kedjor men saknas i registret.
 *
 * Fångar det registret annars inte kan fånga: en kedja som växer in i
 * beståndet när en ny kommun läggs till. Utan den här listan hade registret
 * blivit exakt så gammalt som den dag det skrevs.
 */
function kandidater(): void {
  const counts = new Map<string, Map<string, number>>();

  for (const r of rows) {
    if (chainIdFor(r.name)) continue;
    const words = normalise(r.name);
    for (let k = 1; k <= 3 && k <= words.length; k++) {
      const key = words.slice(0, k).join(' ');
      const per = counts.get(key) ?? new Map<string, number>();
      per.set(r.municipality, (per.get(r.municipality) ?? 0) + 1);
      counts.set(key, per);
    }
  }

  const ranked = [...counts]
    .map(([key, per]) => ({
      key,
      total: [...per.values()].reduce((n, x) => n + x, 0),
      municipalities: per.size,
    }))
    .filter((c) => c.total >= CANDIDATE_MIN && c.municipalities >= 2)
    .sort((a, b) => b.municipalities - a.municipalities || b.total - a.total);

  console.log(
    `Namnprefix med minst ${CANDIDATE_MIN} förekomster i minst två kommuner som INTE\n` +
      'fångas av registret. Flest kommuner först, eftersom en kedja är det som\n' +
      'återkommer på flera håll. Listan är rå och innehåller skräp med flit.\n',
  );

  for (const c of ranked.slice(0, 60)) {
    console.log(`${String(c.total).padStart(4)} i ${String(c.municipalities).padStart(2)} kommuner  ${c.key}`);
  }
}
