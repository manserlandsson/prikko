/**
 * Kommunen besökaren senast valde, ihågkommen i hennes egen webbläsare.
 *
 * ══ VARFÖR DET HÄR FINNS ══════════════════════════════════════════════════
 *
 * Startsidan visade Stockholm för alla. Sajten är statiskt byggd och HTML:en
 * cachas för hela världen, så SERVERN FÅR ALDRIG VETA något om besökaren:
 * ett svar som skiljer sig per besökare kan inte cachas, och en cachad sida
 * som ändå skiljer sig är fel för någon. Allt som är personligt sker därför i
 * webbläsaren, ovanpå en sida som redan är hel utan det.
 *
 * ══ VAD SOM LAGRAS, OCH VAD SOM INTE GÖR DET ══════════════════════════════
 *
 * EN KOMMUNSLUG. "orebro". Ingenting annat.
 *
 * INGEN KOORDINAT LAGRAS NÅGONSIN, och det är inte en försiktighet utan
 * projektets hårda gräns. Positionen finns i en variabel så länge det tar att
 * räkna ut vilken kommunpunkt som ligger närmast, och sedan är den borta. Den
 * skrivs inte till lagring, inte till adressfältet, inte till en fråga och
 * inte till en logg. Se cookies.astro, avsnittet Platstjänsten, som lovar
 * exakt det utåt.
 *
 * En kommun är inte heller en position. Örebro kommun är 1 373 km², och att
 * någon bryr sig om den är samma sorts uppgift som att någon sökt på den.
 * Det är också precis vad förlagan lagrar: hemnet.se håller `previousSearches`
 * i localStorage, uppmätt 2026-09-05 till
 * `[{"string":"Bostäder, Stockholms län","params":{"location_ids":"17744"}}]`,
 * och visar den som raden "Senaste:" under sitt sökfält.
 *
 * ══ LOCALSTORAGE OCH INTE EN KAKA ═════════════════════════════════════════
 *
 * En kaka hade följt med varje anrop till varje bild och varje ruta i kartan,
 * alltså skickat valet till servern hundratals gånger per besök utan att
 * någon där har användning för det. localStorage lämnar aldrig webbläsaren.
 *
 * Lagringen kräver samtycke enligt 9 kap. 28 § lagen (2022:482) om elektronisk
 * kommunikation, och samtycket ÄR handlingen: värdet skrivs bara när besökaren
 * själv valt en kommun, aldrig vid inladdning och aldrig av sig självt.
 */

/**
 * Nyckeln i localStorage.
 *
 * Prefixet `prikko.` är avsiktligt: localStorage delas av allt som ligger på
 * domänen, och en naken nyckel som `kommun` är en kollision som väntar.
 */
export const PLATS_NYCKEL = 'prikko.kommun';

/**
 * Händelsen som säger att valet ändrats i DEN HÄR fliken.
 *
 * `storage`-händelsen duger inte och det är inte en smaksak: webbläsaren
 * skickar den till ANDRA flikar på samma ursprung, aldrig till den flik som
 * skrev värdet. Väljer man en kommun i sökpanelen på startsidan är det just
 * den fliken som ska märka det.
 *
 * `detail` bär slugen, eller null när valet tagits bort.
 */
export const PLATS_HANDELSE = 'prikko:kommun';
