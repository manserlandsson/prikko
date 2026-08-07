/**
 * Kopplingen mellan en knapp som vill jämföra och jämförelserutan.
 *
 * Samma lösning som review-dialog.ts och signin-dialog.ts, och av samma skäl:
 * Astro paketerar varje komponents `<script>` för sig men delar moduler mellan
 * dem på samma sida. Verksamhetssidans två knappar, den under nyckeltalen och
 * den i närliggande-panelen, får alltså samma instans utan att någon skriver
 * till `window` och utan att ordningen mellan skripten spelar roll.
 *
 * Rutan öppnas ALDRIG av sidladdning. `openCompareDialog` finns bara för att
 * kallas ur en klickhanterare.
 */

type Opener = (trigger: HTMLElement | null) => void;

let opener: Opener | null = null;

/** Kallas av JamforRuta när rutan finns i DOM:en och är kopplad. */
export function registerCompareDialog(fn: Opener): void {
  opener = fn;
}

/**
 * Öppnar rutan. `trigger` är knappen som fokus ska gå tillbaka till.
 *
 * Svaret säger om det fanns någon ruta att öppna. Knapparna är länkar till
 * jämförelsesidan i grunden, så ett `false` betyder att länken får gå sin väg
 * i stället, vilket är precis vad som ska hända utan JavaScript.
 */
export function openCompareDialog(trigger: HTMLElement | null = null): boolean {
  if (!opener) return false;
  opener(trigger);
  return true;
}
