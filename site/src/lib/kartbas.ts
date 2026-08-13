/**
 * Det gemensamma mellan sajtens fyra kartor: kartsöksidans (Karta.astro),
 * kommunsidans ruta (KartaPuff.astro), områdessidans (OmradeKarta.astro) och
 * verksamhetssidans platskarta (Platskarta.astro). Var MapLibre bor, var
 * kartstilen bor, hur nålen ritas, vad biblioteket säger på svenska och när
 * gesterna samarbetar med sidan. En sanning, fyra kartor, så att de beter sig
 * likadant och fortsätter göra det när någon av dem ändras.
 *
 * Formen bor på motsvarande sätt i styles/kartram.css.
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
 * huvudtråden, och det var den skillnaden som avslöjade orsaken.
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

/**
 * MapLibres egna ord, på svenska.
 *
 * Biblioteket skriver mer text än man tror: varje knapps titel och aria-label,
 * upphovsradens hopfällare, kartans och nålens roll för skärmläsare, och
 * hjälptexten i lagret som samarbetande gester lägger över kartan. Allt går
 * genom `_getUIString`, alltså genom den här tabellen, och utan den står
 * sajtens enda engelska mitt på kartan.
 *
 * Nycklarna är MapLibres, inte våra. De som saknas här faller tillbaka på
 * bibliotekets engelska förval.
 */
export const KART_SPRAK: Record<string, string> = {
  'AttributionControl.ToggleAttribution': 'Visa eller dölj upphov',
  'FullscreenControl.Enter': 'Helskärm',
  'FullscreenControl.Exit': 'Lämna helskärm',
  'Map.Title': 'Karta',
  'Marker.Title': 'Kartnål',
  'NavigationControl.ZoomIn': 'Zooma in',
  'NavigationControl.ZoomOut': 'Zooma ut',
  'Popup.Close': 'Stäng',

  /*
   * Gesttexterna. MapLibre väljer mellan de två första på `navigator.userAgent`
   * och visar den tredje när pekdonet är ett finger.
   *
   * Boolis egna, uppmätta ur deras paket 2026-08-13, är ordagrant
   * "Använd ctrl + scroll för att zooma i kartan.",
   * "Använd ⌘ + scroll för att zooma i kartan." och
   * "Använd två fingrar för att flytta kartan."
   *
   * Vi tar deras meningar, för de säger exakt det som behövs och inget mer,
   * med två ändringar: Ctrl med versal, eftersom det är tangentens namn och
   * inte ett ord, och ingen punkt, eftersom raden är en etikett mitt på en
   * karta och inte en mening i en text.
   */
  'CooperativeGesturesHandler.WindowsHelpText': 'Använd Ctrl + scroll för att zooma i kartan',
  'CooperativeGesturesHandler.MacHelpText': 'Använd ⌘ + scroll för att zooma i kartan',
  'CooperativeGesturesHandler.MobileHelpText': 'Använd två fingrar för att flytta kartan',
};

/**
 * Kartinställningarna för en karta som ligger INUTI en sida man rullar.
 *
 * Sprids in i `new Map({ ... })`. Två saker på en gång, för de hör ihop:
 * gesterna och orden som förklarar dem.
 *
 * ## Vad `cooperativeGestures` gör
 *
 * Med hjul: kartan zoomar bara när ⌘ (Mac) eller Ctrl (Windows) hålls nere.
 * Utan tangent rullar sidan vidare under pekaren, och lagret som säger varför
 * tonas in över kartan. Utan det här fastnar rullningen i kartan så fort
 * pekaren råkar passera den, vilket är hela ärendet.
 *
 * Med finger: ETT finger rullar sidan, TVÅ fingrar panorerar kartan. Det är
 * ett annat mönster än på datorn, och MapLibre gör det av sig själv, genom att
 * lägga `touch-action: pan-x pan-y` på duken i stället för `none`.
 *
 * Vi bygger alltså ingenting eget. Ett eget lager hade betytt egna
 * hjulhanterare, egen `touch-action`, egen tidsstyrning av in- och uttoning
 * och egen väg runt att MapLibre redan äger `wheel` på duken. Det inbyggda
 * gör allt det, och texten går att översätta genom `locale`, vilket var den
 * enda anledningen att fundera på ett eget.
 *
 * ## Var det INTE ska sättas
 *
 * Kartsöksidan (Karta.astro på /karta och /<kommun>/karta). Den sidan är en
 * app-yta utan sidskroll: `.page` är `100dvh` med `overflow: hidden`, och på
 * smal skärm ligger kartan `position: fixed` under ett ark. Det finns
 * ingenting att rulla i stället för att zooma. Gesterna hade där gjort två
 * skador: hjulet vägrar zooma och lämnar över till en sida som står still, och
 * ett finger kan inte längre panorera kartan, alltså sidans hela ärende.
 *
 * Regeln är därför inte "karta" utan "karta i ett dokument".
 */
export const KARTA_I_DOKUMENT = {
  cooperativeGestures: true,
  locale: KART_SPRAK,
} as const;

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
