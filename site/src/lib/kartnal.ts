/**
 * Kartnålen. Egen modul, och det är avsiktligt.
 *
 * Nålen ritas på tre ställen: av kartbas.ts, av Karta.astro och av
 * verksamhetssidans statiska bild. Den låg tidigare i TVÅ kopior, en i
 * kartbas.ts och en i Karta.astro, alltså samma fel som FaceMark bar mot
 * lib/face. En kopia av en sanning divergerar alltid till slut, och de här två
 * hade redan hunnit glida isär i kommentarerna.
 *
 * Varför en EGEN fil och inte kartbas.ts: kartbas.ts importerar maplibre från
 * /maplibre/maplibre-gl.mjs, som ligger i public och kopieras som den är vid
 * bygget. Den får därför inte importeras från källkod, bara laddas dynamiskt i
 * webbläsaren. Att hämta nålen därifrån drog in hela kartmotorn i modulgrafen
 * och sänkte dev-servern med "Failed to load url /maplibre/maplibre-gl.mjs".
 *
 * Den här filen importerar bara lib/face och kan därför läsas av vem som helst.
 */
import { FACE_MARKUP, FACE_PLATE, FACE_RING, type FaceKey } from './face';

/**
 * Nålen: droppe, färgad fyllning, VIT KONTUR, mjuk skugga, vit min inuti.
 *
 * Formen är den som Google, Apple och Ednia använder, och den valdes av ett
 * skäl som inte är smak: en droppe PEKAR. En kvadrat måste man gissa
 * mittpunkten på, medan spetsen säger exakt vilken adress det gäller.
 * Därför ska nålen alltid ankras i underkanten — spetsen ska ligga på
 * koordinaten, inte märkets mitt.
 *
 * Den vita konturen är inte dekoration. Kartbotten är färgad, och utan
 * kontur drunknar en gul nål i en gul gata och en grön i en park. Konturen
 * ger varje nål en egen kant mot vad som helst under sig, vilket är exakt
 * varför de tre nämnda kartorna alla har den.
 *
 * Ansiktet kommer ur lib/face.ts, samma modul som FaceSprite och FaceRef
 * läser, så nålen på kartan är samma tecken som märket i listan.
 *
 * NIVÅN ÄR RIK, och nal-nivån som stod här är avställd. Ägaren: "använd samma
 * för nål, det ska vara inramat rikt hela tiden."
 *
 * Invändningen som stod här var att nålen serialiseras till en data-URI och
 * att det rika ansiktet är omkring 8 600 tecken mot nålnivåns 886. Den
 * invändningen håller inte, och det är värt att skriva ned varför, eftersom
 * den ser riktig ut: nålen ritas EN GÅNG PER LÄGE och inte en gång per
 * verksamhet. Kartan registrerar fyra bilder hos kartmotorn, eller åtta med
 * den streckade varianten, och varje nål på kartan pekar sedan på en av dem.
 * Kostnaden är alltså 4 gånger 7 700 tecken i en sträng som byggs i
 * webbläsaren och aldrig går över tråden, eftersom banorna redan ligger i
 * bunten. Tusen nålar kostar exakt lika mycket som fyra.
 *
 * Det är en annan sak än märket i en LISTA, där varje rad hade betalat.
 * Den kostnaden bärs av spriten, se FaceSprite.astro.
 *
 * GRADIENTEN ÄR BORTA. Den fanns aldrig av en anledning, och maskotens regel
 * är noll gradienter. Droppen bär numera plattans färg som en platt yta, och
 * ansiktet ligger urklippt i droppens cirkel.
 *
 * `streckad` ritar den vita konturen streckad i stället för hel. Det är
 * konventionen för en HÄRLEDD koordinat, geokodad ur adressen i stället för
 * lämnad av kommunen: samma grepp som kartors streckade preliminära gränser,
 * och samma konvention som verksamhetssidans nål har haft sedan den var en
 * statisk bild. En streckad kant säger "punkten är inte fastställd" utan att
 * påstå hur långt fel den kan vara.
 */
export function faceSvg(key: FaceKey, streckad = false): string {
  const kontur = streckad ? ' stroke-dasharray="13 9"' : '';

  // Ansiktet är ritat i sin egen 100-ruta och krymps till droppens huvud,
  // vars cirkel har mittpunkt (50, 46) och radie 37. Skalan 0,74 lämnar en
  // hårfin marginal mot den vita konturen, så ansiktet aldrig skär i kanten.
  const ansikte =
    `<g clip-path="url(#h)">` +
    `<g transform="translate(50 46) scale(.74) translate(-50 -50)">` +
    FACE_MARKUP[key].rik +
    `</g></g>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="132" viewBox="0 0 100 132">` +
    `<defs>` +
    `<clipPath id="h"><circle cx="50" cy="46" r="37"/></clipPath>` +
    `<filter id="s" x="-50%" y="-20%" width="200%" height="160%">` +
    `<feGaussianBlur in="SourceAlpha" stdDeviation="3"/>` +
    `<feOffset dy="3"/><feComponentTransfer><feFuncA type="linear" slope="0.35"/>` +
    `</feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/>` +
    `</feMerge></filter>` +
    `</defs>` +
    `<path filter="url(#s)" d="M50 124C50 124 87 74 87 46A37 37 0 1 0 13 46C13 74 50 124 50 124Z" ` +
    `fill="${FACE_PLATE[key]}" stroke="#fff" stroke-width="7" stroke-linejoin="round"${kontur}/>` +
    ansikte +
    `<path d="M50 124C50 124 87 74 87 46A37 37 0 1 0 13 46C13 74 50 124 50 124Z" ` +
    `fill="none" stroke="${FACE_RING[key]}" stroke-width="2" stroke-linejoin="round"/>` +
    `</svg>`
  );
}

/** Droppens proportion är 100×132. Vid pixelRatio 2 blir nålen 36×47
 *  CSS-pixlar, alltså i nivå med märket i listan. */
/** Droppens proportion är 100×132. Vid pixelRatio 2 blir nålen 36×47
 *  CSS-pixlar, alltså i nivå med märket i listan. */
export const PIN_W = 72;
export const PIN_H = 95;
