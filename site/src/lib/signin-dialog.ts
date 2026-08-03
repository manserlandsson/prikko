/**
 * Kopplingen mellan en knapp som kräver konto och inloggningsrutan.
 *
 * Varför en modul och inte ett globalt objekt på `window`: Astro paketerar
 * varje komponents `<script>` för sig, men delar moduler mellan dem på samma
 * sida. Två komponenter som importerar den här filen får alltså samma
 * instans, utan att någon behöver skriva till `window` och utan att ordningen
 * mellan skripten spelar roll.
 *
 * Rutan öppnas ALDRIG av sidladdning. `openSignIn` finns bara för att kallas
 * ur en klickhanterare, och SignInDialog registrerar sig först när dess eget
 * skript kört. Hinner någon klicka innan dess svarar vi nej i stället för att
 * köa upp en ruta som poppar upp senare av sig själv.
 */

type Opener = (trigger: HTMLElement | null, done: (ok: boolean) => void) => void;

let opener: Opener | null = null;

/** Kallas av SignInDialog när rutan finns i DOM:en och är kopplad. */
export function registerSignInDialog(fn: Opener): void {
  opener = fn;
}

/**
 * Öppnar rutan och lovar ett svar.
 *
 * `trigger` är knappen som öppnade den. Fokus går tillbaka dit när rutan
 * stängs, oavsett om det var Esc, krysset eller en lyckad inloggning som
 * stängde den.
 *
 * Svaret är `true` bara när någon faktiskt loggade in.
 */
export function openSignIn(trigger: HTMLElement | null = null): Promise<boolean> {
  if (!opener) return Promise.resolve(false);
  return new Promise((resolve) => opener!(trigger, resolve));
}

/** Finns rutan på den här sidan? */
export function signInAvailable(): boolean {
  return opener !== null;
}
