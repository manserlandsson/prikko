/**
 * Kopplingen mellan en knapp som vill skriva ett omdöme och omdömesrutan.
 *
 * Samma lösning som signin-dialog.ts, och av samma skäl: Astro paketerar varje
 * komponents `<script>` för sig men delar moduler mellan dem på samma sida.
 * ActionPanel och Reviews får alltså samma instans utan att någon skriver till
 * `window` och utan att ordningen mellan skripten spelar roll.
 *
 * Rutan bor i Reviews eftersom formuläret, listan och kvittensen är samma sak
 * sedd från tre håll. Sidopanelen ska bara kunna öppna den, inte känna till
 * hur den fungerar.
 *
 * Rutan öppnas ALDRIG av sidladdning. `openReviewDialog` finns bara för att
 * kallas ur en klickhanterare.
 */

type Opener = (trigger: HTMLElement | null) => void;

let opener: Opener | null = null;

/** Kallas av Reviews när rutan finns i DOM:en och är kopplad. */
export function registerReviewDialog(fn: Opener): void {
  opener = fn;
}

/**
 * Öppnar rutan. `trigger` är knappen som fokus ska gå tillbaka till.
 *
 * Svaret säger om det fanns någon ruta att öppna, inte om något skrevs. Den
 * som frågar kan då göra något annat vettigt i stället för ingenting.
 */
export function openReviewDialog(trigger: HTMLElement | null = null): boolean {
  if (!opener) return false;
  opener(trigger);
  return true;
}

/** Finns rutan på den här sidan? Omdömen kan vara avstängda. */
export function reviewDialogAvailable(): boolean {
  return opener !== null;
}
