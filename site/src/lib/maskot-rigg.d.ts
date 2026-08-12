/**
 * Typer för maskot-rigg.mjs.
 *
 * Riggen är skriven i ren JavaScript så att både Astro och `node` kan köra den
 * utan byggsteg, se modulkommentaren där. Den här filen ger den typer ändå, så
 * att en anropsplats i TypeScript inte tappar dem.
 */

/** Namnet på varje led riggen kan sätta. */
export const RIGGDELAR: readonly string[];

export interface Riggad {
  /** Figurens markup med en namngiven grupp runt varje led. */
  svg: string;
  /** Leder som faktiskt hittades, i den ordning de sattes. */
  delar: string[];
  /** Delar som INTE hittades. Tom lista är kravet; se bygg-maskot-rigg-prov. */
  saknas: string[];
}

export function rigga(indata: string, opt?: { klass?: string }): Riggad;
