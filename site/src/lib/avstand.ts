/**
 * Avstånd, och kommunen som ligger närmast en punkt.
 *
 * ══ VARFÖR MODULEN FINNS ══════════════════════════════════════════════════
 *
 * Formeln stod som en lokal hjälpfunktion inuti sökpanelens skript i
 * SiteSearch.astro. Den fick sällskap när Var-listan skulle kunna svara på
 * "nära mig" utan att lämna startsidan, och två kopior av samma slinga i
 * samma fil är en kopia för mycket: den dagen den ena får ett tak eller ett
 * avrundningsfel rättat följer den andra inte med, och felet syns bara som
 * att en av de två knapparna pekar på fel stad.
 *
 * `lib/data.ts` har en tredje kopia, och den ska den ha. Den räknar vid
 * BYGGET över hela beståndet och den här räknar i webbläsaren över tretton
 * punkter; att importera datalagret in i ett `<script>` hade dragit med
 * node:crypto, hela kommunregistret och 60 MB JSON till besökarens telefon.
 * Skillnaden är motiverad, dubbleringen inne i SiteSearch var det inte.
 *
 * ══ VAD SOM ALDRIG FÅR HÄNDA HÄR ══════════════════════════════════════════
 *
 * INGEN POSITION LÄMNAR WEBBLÄSAREN. Funktionerna tar koordinater som
 * argument, returnerar en kommun och ett avstånd, och gör ingenting annat:
 * ingen hämtning, ingen lagring, ingen logg. Anroparen får aldrig skriva
 * `lat` eller `lng` till en adress, en fråga eller en rad i konsolen.
 */

/** En kommun som en position kan mätas mot. */
export interface Plats {
  slug: string;
  city: string;
  lat: number;
  lng: number;
  /** Har kommunen en kartsida att landa på? Fyra av tretton har det inte. */
  karta: boolean;
}

/**
 * Avstånd i meter, haversine.
 *
 * Jordens radie som en sfär och inte som ellipsoid. Felet är under en halv
 * procent, alltså under 200 m på de 40 km som är närhetsgränsen, och det
 * enda talet spelar roll för är vilken av tretton punkter som ligger
 * närmast. Två kommunpunkter som ligger 200 m från varandra finns inte.
 */
export function avstandMeter(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Kommunen som ligger närmast, och hur långt bort den är.
 *
 * Punkten är verksamheternas median eller en uppslagen ortskoordinat, se
 * `municipalityPoints` i lib/data.ts. Den duger till att välja kommun och
 * till ingenting annat: en median är inte ett centrum, och avståndet till
 * den är inte avståndet till kommungränsen.
 *
 * `null` när listan är tom, alltså när bygget inte gav några kommunpunkter.
 * Anroparen ska då inte visa någon platsfunktion alls.
 */
export function narmast(
  lat: number,
  lng: number,
  platser: readonly Plats[],
): { plats: Plats; meter: number } | null {
  let plats: Plats | null = null;
  let meter = Infinity;
  for (const p of platser) {
    const d = avstandMeter(lat, lng, p.lat, p.lng);
    if (d < meter) {
      meter = d;
      plats = p;
    }
  }
  return plats ? { plats, meter } : null;
}

/**
 * Inom den här radien räknas kommunen som besökarens egen.
 *
 * 40 km. Talet är sökpanelens sedan tidigare och står kvar: en kommun vars
 * mittpunkt ligger längre bort än så är inte där man är, den är dit man
 * skulle kunna åka.
 */
export const NARA_METER = 40000;

/**
 * Längre bort än så och vi täcker inte besökarens del av landet alls.
 *
 * 200 km. Mellan de två talen finns den som bor i en kommun vi ännu inte
 * har, med en täckt kommun inom räckhåll.
 */
export const RACKHALL_METER = 200000;
