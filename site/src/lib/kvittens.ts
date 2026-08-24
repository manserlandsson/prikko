/**
 * Kvittensen: en ruta i sidans hörn som säger att något faktiskt hände, och
 * som bär vägen vidare till stället där resultatet ligger.
 *
 * Varför en modul och inte ett globalt objekt på `window`: exakt samma skäl
 * som i signin-dialog.ts. Astro paketerar varje komponents `<script>` för
 * sig men delar moduler mellan dem på samma sida, så två komponenter som
 * importerar den här filen får samma instans utan att någon skriver till
 * `window` och utan att ordningen mellan skripten spelar roll.
 *
 * Rutan visas ALDRIG av sidladdning. `visaKvittens` finns bara för att
 * kallas efter en handling som lyckades, och Kvittens.astro registrerar sig
 * först när dess eget skript kört. Hinner någon klicka innan dess händer
 * ingenting, i stället för att en ruta poppar upp senare av sig själv.
 *
 * Förlagan är ednia.se, uppmätt 2026-08-24 i deras egen kod (deras spara
 * kräver konto, så rutan gick inte att framkalla utan inloggning):
 * sonner-toast nere till höger, 344 px bred, 63 px hög, radie 12, kant
 * 1 px #EBEBEB, skugga 0 4px 16px rgba(0,0,0,.16), texten "Gymnasiet sparat"
 * i 16/24 vikt 400 och åtgärden "Visa sparade" i 14 vikt 600, som leder till
 * /profil/sparade. Den står 4 000 ms och glider in på 400 ms.
 */

export interface Kvittens {
  /**
   * Meningen i rutan. EN rad, ingen punkt, ingen förklaring av vad knappen
   * gjorde. Ägaren har redan rivit ut en sådan mening en gång: "ta bort den
   * där jävla texten när man följer".
   */
  text: string;
  /** Vägen vidare. Utelämnas den blir rutan bara en notis. */
  href?: string;
  /**
   * Länkens ord. Ska NAMNGE det den leder till, inte säga "här" eller
   * "visa". Ednias "Visa sparade" leder till en sida som heter "Sparade
   * skolor"; vår "Visa dina bevakningar" leder till avsnittet "Bevakningar".
   */
  lank?: string;
}

type Visare = (kvittens: Kvittens) => void;

let visare: Visare | null = null;
let doljare: (() => void) | null = null;

/** Kallas av Kvittens.astro när lagret finns i DOM:en. */
export function registerKvittens(visa: Visare, dolj: () => void): void {
  visare = visa;
  doljare = dolj;
}

/** Visar en kvittens. Ersätter den som redan står, se Kvittens.astro. */
export function visaKvittens(kvittens: Kvittens): void {
  visare?.(kvittens);
}

/**
 * Tar bort rutan i förtid.
 *
 * Finns för handlingar som ÅNGRAR den handling kvittensen kvitterade. Två
 * snabba klick på Följ är följ och sedan avfölj, och en ruta som står kvar
 * och säger "Bevakningen är igång" efter det andra klicket ljuger.
 */
export function doljKvittens(): void {
  doljare?.();
}
