/**
 * Det gemensamma mellan kartsöksidans karta (Karta.astro) och verksamhets-
 * sidans platskarta (Platskarta.astro): var MapLibre bor, var kartstilen bor
 * och hur nålen ritas. En sanning, två kartor, så att de ser likadana ut och
 * fortsätter göra det när något av dem ändras.
 *
 * ## Hur MapLibre laddas
 *
 * Från /maplibre/, alltså som statiska filer, INTE genom paketeraren.
 *
 * MapLibre startar sin vektorarbetare med
 * `new URL('./maplibre-gl-worker.mjs', import.meta.url)`. Paketerar Vite
 * biblioteket pekar den adressen in i /_astro/ där ingen sådan fil finns,
 * arbetaren blir 404, och kartan går sönder UTAN att säga något: stilen
 * laddas, kontrollerna ritas, attributionen står där, och kartytan förblir
 * vit. Rasterkällor fungerar samtidigt, eftersom bilder avkodas på
 * huvudtråden — det var den skillnaden som avslöjade orsaken.
 *
 * Som statiska filer stämmer `import.meta.url` med var filerna ligger,
 * arbetaren hittar sig själv, och huvudtråd och arbetare DELAR
 * maplibre-gl-shared.mjs i stället för att ladda var sin kopia. Se
 * scripts/kopiera-maplibre.mjs.
 *
 * `@vite-ignore` krävs för att Vite inte ska försöka lösa upp adressen vid
 * bygget. Formen blir därmed exakt densamma i dev som i bygget, vilket är
 * vad som sänkte det förra försöket.
 *
 * maplibre-gl 6 har ingen default-export. Destrukturera namn ur modulen,
 * skriv aldrig `mod.default`.
 */
import {
  FACE_EYE_LEFT,
  FACE_EYE_RIGHT,
  FACE_FILL,
  FACE_MOUTH,
  FACE_MOUTH_WIDTH,
  type FaceKey,
} from './face';

/**
 * Vår egen kartstil, byggd av scripts/kartstil.mjs och utlagd som statisk
 * fil. Skälen står i skriptet: positron är CARTO:s och grå rakt igenom,
 * liberty och bright är för mättade för att nålarna ska synas. Vår version
 * är liberty med nedskruvad mättnad i landskapet och uppskruvad kontrast i
 * vägnätet.
 *
 * Att den ligger hos oss betyder också att kartans utseende inte kan ändras
 * av någon annan mellan två besök.
 */
export const KARTSTIL = '/kartstil/prikko.json';

const MAPLIBRE_URL = '/maplibre/maplibre-gl.mjs';
const MAPLIBRE_CSS = '/maplibre/maplibre-gl.css';

/** Stilmallen läggs in som <link> och inte som import, av samma skäl som
 *  koden: adressen ska vara densamma i dev och i bygget. */
export function laddaMaplibreCss(): void {
  if (document.querySelector(`link[href="${MAPLIBRE_CSS}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = MAPLIBRE_CSS;
  document.head.appendChild(link);
}

/** Själva biblioteket. Se modulkommentaren för varför formen ser ut så här. */
export function laddaMaplibre(): Promise<any> {
  return import(/* @vite-ignore */ MAPLIBRE_URL);
}

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
 * Minen är vit. Det är inte ett val här utan en regel som redan står i
 * tokens.css: symbolen på märket är alltid vit. Banorna kommer ur
 * lib/face.ts, samma modul som FaceSprite och FaceRef läser, så nålen på
 * kartan är samma tecken som märket i listan.
 *
 * `streckad` ritar den vita konturen streckad i stället för hel. Det är
 * konventionen för en HÄRLEDD koordinat, geokodad ur adressen i stället för
 * lämnad av kommunen: samma grepp som kartors streckade preliminära gränser,
 * och samma konvention som verksamhetssidans nål har haft sedan den var en
 * statisk bild. En streckad kant säger "punkten är inte fastställd" utan att
 * påstå hur långt fel den kan vara.
 */
export function faceSvg(key: FaceKey, streckad = false): string {
  const [from, to] = FACE_FILL[key];
  // Ansiktets innehåll spänner x 33,7–68,7 och y 33–69 i sin egen 100-ruta.
  // Mitten ligger alltså på (51,2, 51), och den punkten flyttas till
  // droppens cirkelmitt (50, 46) och skalas till 72 procent.
  const face =
    `<g transform="translate(50 46) scale(.72) translate(-51.2 -51)">` +
    `<path d="${FACE_EYE_LEFT}" fill="#fff"/><path d="${FACE_EYE_RIGHT}" fill="#fff"/>` +
    `<path d="${FACE_MOUTH[key]}" stroke="#fff" stroke-width="${FACE_MOUTH_WIDTH}" ` +
    `stroke-linecap="round" fill="none"/></g>`;

  const kontur = streckad ? ' stroke-dasharray="13 9"' : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="132" viewBox="0 0 100 132">` +
    `<defs>` +
    `<linearGradient id="g" x1="50" y1="4" x2="50" y2="120" gradientUnits="userSpaceOnUse">` +
    `<stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>` +
    `<filter id="s" x="-50%" y="-20%" width="200%" height="160%">` +
    `<feGaussianBlur in="SourceAlpha" stdDeviation="3"/>` +
    `<feOffset dy="3"/><feComponentTransfer><feFuncA type="linear" slope="0.35"/>` +
    `</feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/>` +
    `</feMerge></filter>` +
    `</defs>` +
    `<path filter="url(#s)" d="M50 124C50 124 87 74 87 46A37 37 0 1 0 13 46C13 74 50 124 50 124Z" ` +
    `fill="url(#g)" stroke="#fff" stroke-width="7" stroke-linejoin="round"${kontur}/>` +
    face +
    `</svg>`
  );
}

/** Droppens proportion är 100×132. Vid pixelRatio 2 blir nålen 36×47
 *  CSS-pixlar, alltså i nivå med märket i listan. */
export const PIN_W = 72;
export const PIN_H = 95;

/** Nålen som bitmapp, för MapLibres addImage. Symbol-lager kan inte rita
 *  SVG direkt, så droppen rasteriseras via en canvas. `streckad` följer med
 *  till faceSvg, så att en härledd koordinat behåller sin konvention även
 *  som nål i ett symbol-lager. */
export function faceBitmap(key: FaceKey, streckad = false): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image(PIN_W, PIN_H);
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = PIN_W;
      c.height = PIN_H;
      const ctx = c.getContext('2d');
      if (!ctx) return reject(new Error('ingen 2d-kontext'));
      ctx.drawImage(img, 0, 0, PIN_W, PIN_H);
      resolve(ctx.getImageData(0, 0, PIN_W, PIN_H));
    };
    img.onerror = () => reject(new Error('kunde inte rita ' + key));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(faceSvg(key, streckad))}`;
  });
}
