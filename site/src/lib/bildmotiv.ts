import type { Establishment } from './db';
import rader from './bildmotiv.data.json';

/**
 * VAD FOTOGRAFIET FAKTISKT VISAR.
 * ──────────────────────────────────────────────────────────────────────────
 * Ägaren 2026-08-22: "restaurangerna med bilder på restaurangen istället för
 * ett stort palats vill vi visa långt uppe i populära lista, så tex: riche,
 * sushi sho, dashi, rolfs kök, den gröne jägaren, tudor arms, prinsen, etc
 * inga palats, annars ok."
 *
 * Ingenting i vår data svarar på den frågan. `amenity=restaurant` sitter på
 * både Riche och Operakällaren, och namnet ljuger åt båda håll: Herrängens
 * Gård är en krog fotograferad med skylten i bild, medan Wedholms Fisk är ett
 * hörnhus över ett torg där krogen knappt syns. En namnregel provades och
 * hade fel om sex av trettiotre.
 *
 * Fältet är därför BEDÖMT, inte härlett. Varje bild har öppnats och setts på,
 * och `vad` skriver ned motivet så att nästa läsare kan pröva omdömet utan
 * att gissa vad som menades. Trettiotre bilder är en mängd man orkar titta
 * på, och det gör det bedömda fältet billigare än en regel som har fel.
 *
 * - `stallet`  fasad med skylt, entré, uteservering, matsal, disk eller bar.
 * - `byggnad`  hus, palats, museum eller anläggning på håll, flygbild, vy.
 * - `annat`    varken det ena eller det andra: en maträtt, en logotyp, ett
 *              porträtt, en karta. Restaurang Leijontornet är hela beståndet
 *              i dag, en närbild på enbart smidesskylten.
 *
 * Bedömningen styr ORDNING, och sedan 2026-08-27 på två ställen. På startsidan
 * avgör den vilka verksamheter som visas högt upp; i verksamhetens egen
 * bildlista avgör den vilken bild som blir förstabild. Den säger fortfarande
 * ingenting om verksamheten, bara om fotografiet. Hur ett obedömt ställe
 * placeras på startsidan avgörs av `bildrang` i pages/index.astro, som väger
 * domen mot OSM-taggen: filen här svarar bara på vad bilden visar.
 *
 *
 * ══ TVÅ SORTERS RAD, OCH VARFÖR DET BLEV TVÅ ═══════════════════════════════
 *
 * Fram till 2026-08-27 bar varje verksamhet EN bild, så en rad per verksamhet
 * räckte och nyckeln var `kommun/slug`. Nu bär en verksamhet en LISTA, se
 * `Establishment.images`, och ägarens tolv foton på Holy Smoke är tolv olika
 * motiv: fasaden med flaggorna, gården med eldstaden, röksskjulet, och en
 * bricka med revben.
 *
 * En rad MED `bild` gäller alltså en enskild fil och pekas ut med bildens
 * `id`, som för ett eget foto är ursprungsfilens namn och för en
 * Commons-bild är filens namn på Commons. En rad UTAN `bild` gäller
 * verksamheten och är formen de 189 äldre raderna har.
 *
 * Uppslagningen provar den smalare först. Det gör att de gamla raderna
 * fortsätter svara precis som förut, utan att en enda av dem behövde skrivas
 * om, och att en verksamhet kan ha både en allmän rad och en rad för en
 * enskild fil utan att de slår ut varandra.
 */
export type Bildmotiv = 'stallet' | 'byggnad' | 'annat';

interface Rad {
  kommun: string;
  slug: string;
  motiv: string;
  /** Bildens `id`. Saknas på de rader som gäller verksamheten i stort. */
  bild?: string;
}

/* En tyst tom tabell är det farliga utfallet: varje uppslagning blir null,
   ordningen ser rimlig ut och ingenting går sönder. Bygget ska falla i
   stället. */
if (!Array.isArray(rader) || rader.length === 0) {
  throw new Error('bildmotiv.json lästes tom, ordningen på startsidan går inte att lita på');
}

const alla = rader as Rad[];

/* Raden utan `bild`: gäller verksamheten. Första raden vinner, så att en
   dubblett inte tyst byter svar beroende på filens ordning. */
const karta = new Map<string, Bildmotiv>();
for (const r of alla) {
  if (r.bild) continue;
  const nyckel = `${r.kommun}/${r.slug}`;
  if (!karta.has(nyckel)) karta.set(nyckel, r.motiv as Bildmotiv);
}

/* Raden med `bild`: gäller en enskild fil. */
const perBild = new Map<string, Bildmotiv>();
for (const r of alla) {
  if (!r.bild) continue;
  const nyckel = `${r.kommun}/${r.slug}/${r.bild}`;
  if (!perBild.has(nyckel)) perBild.set(nyckel, r.motiv as Bildmotiv);
}

/** Vad EN namngiven bild föreställer, eller null när ingen sett på den. */
export function bildmotivFor(
  kommun: string,
  slug: string,
  bildId: string | null | undefined,
): Bildmotiv | null {
  if (!bildId) return null;
  return perBild.get(`${kommun}/${slug}/${bildId}`) ?? null;
}

/**
 * Vad verksamhetens FÖRSTABILD föreställer.
 *
 * Förstabilden är den som visas i listor, på kort och i kartnålens popup,
 * alltså är det den och ingen annan som ska styra var stället hamnar på
 * startsidan. Bilden slås upp på sitt eget id först och faller sedan tillbaka
 * på verksamhetsraden, se kommentaren om de två sorternas rader ovan.
 */
export function bildmotiv(e: Establishment): Bildmotiv | null {
  const forsta = e.images?.[0] ?? e.image ?? null;
  return (
    bildmotivFor(e.municipality.slug, e.slug, forsta?.id) ??
    karta.get(`${e.municipality.slug}/${e.slug}`) ??
    null
  );
}

/** Antal bedömda rader. Används av bygget för att bevisa att tabellen laddats. */
export const bildmotivAntal = karta.size + perBild.size;
