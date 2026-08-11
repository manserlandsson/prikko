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
import { type FaceKey } from './face';

/*
 * Nålen importeras OCH återexporteras, inte bara återexporteras.
 *
 * `export { faceSvg, PIN_W, PIN_H } from './kartnal'` skickar vidare namnen
 * utan att binda dem här i modulen. `faceBitmap` nedan använder alla tre, och
 * de blev då fria variabler: paketeraren skrev ut dem ordagrant och
 * `new Image(PIN_W, PIN_H)` kastade ReferenceError första gången någon rullade
 * ner till verksamhetssidans karta. Felet fångades av `catch` i
 * Platskarta.astro, så kartan aldrig vaknade och sidan stod kvar med
 * platshållaren och sin enda nål. Karta.astro har egna kopior av samma
 * konstanter och märkte därför ingenting.
 */
import { faceSvg, PIN_W, PIN_H } from './kartnal';
export { faceSvg, PIN_W, PIN_H };

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
