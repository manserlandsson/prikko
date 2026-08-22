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
 * Bedömningen styr ORDNING på startsidan och ingenting annat. Den säger
 * ingenting om verksamheten, bara om fotografiet. Hur ett obedömt ställe
 * placeras avgörs av `bildrang` i pages/index.astro, som väger domen mot
 * OSM-taggen: filen här svarar bara på vad bilden visar.
 */
export type Bildmotiv = 'stallet' | 'byggnad' | 'annat';

/* En tyst tom tabell är det farliga utfallet: varje uppslagning blir null,
   ordningen ser rimlig ut och ingenting går sönder. Bygget ska falla i
   stället. */
if (!Array.isArray(rader) || rader.length === 0) {
  throw new Error('bildmotiv.json lästes tom, ordningen på startsidan går inte att lita på');
}

const karta = new Map<string, Bildmotiv>(
  (rader as { kommun: string; slug: string; motiv: string }[]).map((r) => [
    `${r.kommun}/${r.slug}`,
    r.motiv as Bildmotiv,
  ]),
);

export function bildmotiv(e: Establishment): Bildmotiv | null {
  return karta.get(`${e.municipality.slug}/${e.slug}`) ?? null;
}

/** Antal bedömda rader. Används av bygget för att bevisa att tabellen laddats. */
export const bildmotivAntal = karta.size;
