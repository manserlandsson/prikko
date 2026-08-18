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
 *
 * ## Kartbildens upphovsrad kommer härifrån, och den kommer sent
 *
 * Stilen har en enda källa, `openmaptiles`, och den bär ingen egen
 * `attribution`. Strängen hämtas i stället ur OpenFreeMaps TileJSON på
 * tiles.openfreemap.org/planet: 239 tecken HTML som blir de 50 tecken
 * MapLibre skriver ut, "OpenFreeMap © OpenMapTiles Data from OpenStreetMap".
 *
 * MapLibre räknar bara upphov för källor vars tileManager är märkt `used`,
 * och `used` sätts av `Style.update()`, som körs ur `Map._render()`, alltså
 * på en ANIMATIONSBILDRUTA. En flik som inte målar får inga bildrutor, och då
 * står `used === undefined` hur länge man än väntar.
 *
 * Uppmätt i det byggda utfallet 2026-08-18, en karta, samma flik: kontrollen
 * tillagd vid 45 ms, stilen laddad vid 1 515 ms, TileJSON:en framme vid
 * 2 818 ms med sina 239 tecken redan lagda på källan, första bildrutan vid
 * 11 482 ms eftersom fliken låg i bakgrunden fram till dess, upphovsraden
 * fylld vid 11 482 ms. Alltså 8 664 ms med strängen tillgänglig och rutan
 * tom, och sedan fylld i samma millisekund som första bildrutan.
 *
 * Läser man DOM:en före den bildrutan står det `maplibregl-attrib-empty` och
 * `innerText === ''`, vilket ser ut som ett licensfel men är en mätning gjord
 * i en flik som aldrig målade. Ingen besökare kan hamna där: samma bildruta
 * som ritar kartbilden fyller raden, så det finns ingen bildruta där OSM:s
 * data syns utan sitt upphov.
 *
 * Skriv därför INTE en egen `attribution` på källan i scripts/kartstil.mjs
 * för att laga det. `loadTileJson` låter stilens fält vinna över TileJSON:ens,
 * så en handskriven rad tystar leverantörens och glider isär från den första
 * gången OpenFreeMap ändrar sin.
 */
export const KARTSTIL = '/kartstil/prikko.json';

/**
 * Rutarkivets lager, alltså `source-layer` i varje kartlager som läser
 * punkterna.
 *
 * Namnet bor HÄR fastän det är lib/kartrutor.ts som skriver lagret, och den
 * ordningen är inte godtycklig: värdet behövs i WEBBLÄSAREN av alla fyra
 * kartorna, och kartrutor.ts importerar node:crypto, supercluster, vt-pbf och
 * hela datalagret. En statisk import därifrån in i ett <script> hade dragit
 * bygget in i besökarens paket. Kartbas har inga sådana beroenden, så
 * beroendet går åt det hållet i stället: kartrutor.ts läser namnet härifrån.
 *
 * Konstanten fanns och ingen pekade på den. Strängen 'punkter' stod
 * handskriven på tjugo ställen i de fyra kartorna, alltså tjugo tillfällen att
 * stava fel på ett namn som bara syns som en tom karta när det är fel.
 */
export const TILE_LAYER = 'punkter';

/**
 * Bedömningens fyra ytfärger, i den ordning `v` i rutorna använder dem:
 * 0 inga anmärkningar, 1 brister, 2 brister som kvarstår, 3 ingen bedömning.
 *
 * Samma tal som `--verdict-*` i styles/tokens.css. De står som hexvärden och
 * inte som token därför att MapLibre målar i WebGL och inte kan läsa en
 * CSS-variabel. Ändras tokens.css ändras de här.
 *
 * De stod i tre komponenter med var sin kommentar som sa just det, alltså tre
 * löften om att hålla samma fyra tal synkroniserade för hand. Nu är det ett.
 *
 * Färgerna gäller NÅLAR och PRICKAR, aldrig kluster: en klusterfärg efter
 * andel anmärkningar vore en värmekarta över vilka kvarter som sköter sig
 * sämst. Kluster bär antal och målas i KART_BRAND.
 *
 * De är inte heller textfärger. Som text på vitt är gult i praktiken oläsligt
 * och grått nästan osynligt; för text finns `--verdict-*-ink` i tokens.css.
 */
export const KART_FARG: string[] = ['#00B92B', '#FECB00', '#FF0000', '#C7C7CC'];

/** `--brand` i tokens.css, alltså klustrens och "du är här"-ringens blå.
 *  Skriven som tal av samma skäl som KART_FARG: WebGL läser ingen variabel. */
export const KART_BRAND = '#007BE0';

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

/**
 * Källan som läser rutarkivet, MED RESERV FÖR EN VÄRD SOM STRUNTAR I RANGE.
 *
 * Funktionen bor HÄR och inte i en komponent, och det är hela poängen med
 * den här flytten. Den låg i tre identiska exemplar, ett i Karta.astro, ett i
 * KartaPuff.astro och ett i OmradeKarta.astro, alltså 105 rader kod som gick
 * sönder på tre ställen och lagades på ett. Kopiera inte tillbaka den.
 *
 * ## Vad reserven är till för
 *
 * Det här kostade en tom karta i produktion 2026-08-08. Måns:
 * "inga restauranger på kartvyn". Kartbladen ritades, teckenförklaringen hade
 * rätt tal, och det fanns noll nålar.
 *
 * Orsaken låg inte i arkivet utan i värdens beteende. Cloudflare Pages
 * besvarar räckviddsförfrågningar ur sin EDGE-CACHE, och filen låg utanför
 * den: ett statiskt Astro-bygge kastar de huvuden en rutt sätter, så vårt
 * `max-age=31536000, immutable` nådde aldrig fram och Pages standard
 * `max-age=0, must-revalidate` gällde i stället. Varje förfrågan blev DYNAMIC,
 * och en DYNAMIC-förfrågan svarar 200 med HELA filen även när man bett om
 * 128 byte. PMTiles hittar då ingen ruta, och kartan blir tom utan ett ord i
 * konsolen.
 *
 * `public/_headers` rättar orsaken. Den här källan ser till att samma fel
 * aldrig mer kan TÖMMA kartan: går räckvidd inte att lita på behålls kroppen
 * vi ändå fick och allt vidare läses ur den. Priset blir en hämtning av hela
 * arkivet, alltså bandbredd, i stället för en karta utan punkter.
 *
 * Ett bygge kan inte fånga det här. Felet finns i värden, inte i filen. Se
 * scripts/kontrollera-rackvidd.mjs, som frågar den PUBLICERADE filen.
 *
 * Funktionen är ren och rör ingen DOM, vilket är skälet till att den kunde
 * flyttas hit utan att någon karta märkte det.
 */
export function rutkalla(url: string) {
  let hel: Promise<ArrayBuffer> | null = null;

  return {
    getKey: () => url,
    async getBytes(offset: number, length: number) {
      if (hel) {
        const buf = await hel;
        return { data: buf.slice(offset, offset + length) };
      }

      const svar = await fetch(url, {
        headers: { Range: `bytes=${offset}-${offset + length - 1}` },
      });
      if (!svar.ok) throw new Error('rutarkivet svarade ' + svar.status);

      /*
       * 206 är det vi bad om. 200 betyder att värden struntade i räckvidden
       * och skickade allt: behåll det i stället för att kasta bort en megabyte
       * och läs vidare ur minnet.
       */
      if (svar.status === 200) {
        const buf = await svar.arrayBuffer();
        hel = Promise.resolve(buf);
        return { data: buf.slice(offset, offset + length) };
      }

      return { data: await svar.arrayBuffer() };
    },
  };
}

/**
 * Lär MapLibre läsa `pmtiles://`, en gång per sida.
 *
 * Grinden på `window` är inte försiktighet utan ett krav: kommunhubbens puff
 * och den delade vyn kan båda ligga på samma dokument, och MapLibre kastar om
 * samma protokollnamn registreras två gånger. Den som hinner först registrerar
 * arkivet; alla tre läser samma fil, så det spelar ingen roll vem det blir.
 *
 * `maplibre` och `pmtiles` skickas in i stället för att importeras. MapLibre
 * kommer från /maplibre/ som statiska filer, se modulkommentaren, och en
 * statisk import härifrån hade dragit in hela kartmotorn i modulgrafen.
 */
export function registreraRutprotokoll(maplibre: any, pmtiles: any, url: string): void {
  if ((window as any).__prikkoPmtiles) return;
  const protokoll = new pmtiles.Protocol();
  protokoll.add(new pmtiles.PMTiles(rutkalla(url) as any));
  maplibre.addProtocol('pmtiles', protokoll.tile);
  (window as any).__prikkoPmtiles = true;
}

/**
 * Tål uppkopplingen en karta?
 *
 * Villkoren är hårda och inte mjuka, och det är hela svaret på frågan om den
 * som kommer från Google på en telefon med dålig uppkoppling. Var och en av
 * dem stoppar uppvaknandet HELT; besökaren får platshållaren och betalar noll
 * extra byte av MapLibres 231 kB brotlade.
 *
 * `saveData` är besökarens uttryckliga önskan och väger tyngst.
 * `effectiveType` är webbläsarens egen mätning av verklig genomströmning och
 * rundtid, inte en gissning ur radiotypen. `prefers-reduced-data` är samma
 * önskan uttryckt i systemet i stället för i webbläsaren.
 *
 * Signalen finns bara i Chromium. I Safari och Firefox är `connection`
 * odefinierad, och då vaknar kartan: sidan är redan färdigladdad, och
 * alternativet vore att aldrig ge kartan till någon på de webbläsarna.
 */
function uppkopplingenTal(): boolean {
  const c = (navigator as any).connection;
  if (c) {
    if (c.saveData) return false;
    if (c.effectiveType && c.effectiveType !== '4g') return false;
  }
  return !window.matchMedia('(prefers-reduced-data: reduce)').matches;
}

/**
 * Uppvaknandet för en kartruta som ligger i ett sidflöde man rullar.
 *
 * Villkoren bor HÄR och inte i komponenterna. De låg i två ordagrant lika
 * kopior, en i KartaPuff.astro och en i OmradeKarta.astro, och en kopia av en
 * sanning divergerar alltid: sajtens fjärde karta, verksamhetssidans
 * platskarta, har redan glidit ifrån och saknar uppkopplingsgrinden helt.
 * Kopiera inte tillbaka villkoren, importera dem.
 *
 * Ordningen är: uppkopplingen ska tåla det, rutan ska synas, sidan ska vara
 * klar, huvudtråden ska vara ledig.
 *
 * IntersectionObserver först, så att den som landar på sida 47 av Stockholm
 * och aldrig rullar ner slipper hämtningen. `load` sedan, så att kartbladen
 * aldrig konkurrerar med sidans egna resurser. Tomgångsluckan sist, så att
 * MapLibres halva megabyte tolkas när ingen väntar på svar. Timeouten på tre
 * sekunder är ryggraden: en sida som aldrig blir riktigt tom i huvudtråden ska
 * ändå få sin karta.
 *
 * `requestIdleCallback` saknas i äldre Safari, därav reservutgången.
 * Marginalen på 200 px gör att kartan hinner vakna precis innan rutan når vyn
 * i stället för precis efter.
 *
 * Returnerar `false` när uppkopplingen sa nej och ingenting alls armerades.
 * Den som har en knapp att gömma när kartan ändå kommer av sig själv gömmer
 * den på ett `true`.
 */
export function vakna(element: Element, start: () => void): boolean {
  if (!uppkopplingenTal()) return false;

  const nar = (fn: () => void) => {
    const idle = (window as any).requestIdleCallback;
    if (idle) idle(fn, { timeout: 3000 });
    else setTimeout(fn, 200);
  };

  const efterLoad = (fn: () => void) => {
    if (document.readyState === 'complete') nar(fn);
    else window.addEventListener('load', () => nar(fn), { once: true });
  };

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
      (poster) => {
        if (!poster.some((p) => p.isIntersecting)) return;
        obs.disconnect();
        efterLoad(start);
      },
      { rootMargin: '200px' },
    );
    obs.observe(element);
  } else {
    efterLoad(start);
  }

  return true;
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
