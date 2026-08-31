/**
 * Fönsterdekalen, arket och certifikatet: märket som fysisk sak.
 *
 * ============================================================================
 * 1. Vad det här är, och varför det inte bryter mot lib/emblem.ts avsnitt 2
 * ============================================================================
 *
 * `lib/emblem.ts` avsnitt 2 avgjorde att emblemet ska vara FRYST och inte
 * dynamiskt, med fyra skäl. De skälen gäller fortfarande, och den här filen
 * river dem inte. Men de gäller för BEDÖMNINGEN, alltså för påståendet om
 * verksamheten, och inte för adressen till en sida.
 *
 * Skillnaden är hela grunden för att bygga det här, så den ska stå utskriven:
 *
 *   ETT ÅRTAL KAN BLI OSANT. "2026" påstår något om en verksamhet. Skulle
 *   siffran räknas om vid varje visning blir märkets försvinnande ett
 *   offentligt påstående om att något hänt, publicerat av oss på någon annans
 *   fönster. Därför står årtalet i ritningen och räknas aldrig om.
 *
 *   EN LÄNK KAN INTE BLI OSANN. /stockholm/ag/ är adressen till en sida, inte
 *   ett omdöme. Den pekar på samma sida i dag och om tre år, och det den sidan
 *   visar är dagens bedömning, uträknad när sidan byggdes. En QR-kod är den
 *   länken i tryckt form och ingenting mer.
 *
 * De tre andra skälen i avsnitt 2 gäller den DYNAMISKA BILDEN, alltså en
 * `<img>` som hämtas från oss vid varje sidvisning hos verksamheten. Inget här
 * är en sådan. Filerna nedan skapas EN gång, laddas ner, och lever därefter
 * utan oss:
 *
 *   Ingen spårpixel: en dekal i ett fönster hämtar ingenting från oss, och
 *   ingen besökare hos restaurangen skickar en IP-adress någonstans. Den som
 *   skannar koden väljer det själv.
 *   Ingen bindning till vår drifttid: papperet i fönstret ser likadant ut om
 *   vi ligger nere.
 *
 * Kodsnutten till webben ändras alltså INTE. Den pekar fortfarande på den
 * generiska `/utmarkelser/2026/marke.svg`, av exakt de skäl som står i
 * emblem.ts. Det som byggs här är nedladdningar, inte inbäddningar.
 *
 * ============================================================================
 * 2. Varför filerna byggs vid begäran och inte vid bygget
 * ============================================================================
 *
 * `pages/utmarkelser/[year]/marke.svg.ts` säger att märket är GENERISKT och
 * nämner ingen verksamhet, med skälet att ett märke med namn i hade krävt
 * 1 541 filer. Det skälet är fortfarande giltigt, och en QR-kod per verksamhet
 * är exakt samma problem: 17 066 dekaler, 17 066 ark och 254 certifikat är
 * 34 386 filer i ett bygge som mätt 2026-08-31 ligger på 18 050 av 100 000, se
 * docs/46_filtaket.md.
 *
 * Alltså byggs de inte. `functions/api/marke.ts` är en Cloudflare Pages
 * Function bredvid den som redan finns för rättelser, och den sätter ihop
 * filen när någon ber om den. Kostnaden i bygget är noll filer.
 *
 * Den här modulen bär ritandet och funktionen bär hämtandet, så att
 * emblemsidan kan visa ett exempel som ritats vid bygget ur exakt samma kod
 * som funktionen kör. En förlaga som ritas på ett andra sätt slutar likna det
 * man laddar ner, och det är samma resonemang som `marke.svg.ts` för om att
 * skärmens bild och nedladdningen ska vara samma fil.
 *
 * ============================================================================
 * 3. Måtten, och var de kommer ifrån
 * ============================================================================
 *
 * Två länder har redan valt, och de valde olika. Talen är hämtade ur
 * föreskrifterna och ur myndigheternas eget tryckoriginal, inte ur en gissning.
 *
 *   DANMARK. Smileymærket är A5 stående, 148 x 210 mm, i färg på vit botten.
 *   Uppvisningsplikten står i BEK nr 1225 af 25/11/2024 § 20 stk. 2: märket
 *   ska hängas vid entrén "så det til stadighed er let synligt og læsbart for
 *   forbrugerne". Märket bär en QR-kod till verksamhetens sida på
 *   findsmiley.dk, § 20 stk. 1. Mätt på Fødevarestyrelsens egen pressbild är
 *   QR-koden 14 procent av märkets bredd, alltså omkring 20 mm vid A5, och 21
 *   moduler bred. Den mätningen är vår egen och inte en publicerad siffra.
 *
 *   STORBRITANNIEN. FSA:s eget tryckoriginal för FHRS anger "Actual
 *   dimensions: Awaiting Inspection: 195mm x 101mm, Sticker: 195mm x 132mm",
 *   alltså liggande. Wales har måttet i lag, The Food Hygiene Rating (Wales)
 *   Regulations 2013 Schedule 1: 190 mm brett gånger 158 mm högt. Nordirland
 *   har ett tredje mått i lag, 195 x 136 mm. Ingen av dem bär en QR-kod, bara
 *   texten food.gov.uk/ratings.
 *
 *   OCH: FHRS delar inte längre ut certifikat. Brand Standard v8 säger att
 *   policyn ändrades 2014 och att intyg inte längre ingår i programmet. Vi
 *   delar ut ett ändå, och skälet står i docs/48.
 *
 * VÅRT VAL ÄR 100 x 100 MM, alltså varken Danmarks eller Storbritanniens.
 * Skälen står i docs/48_market_som_lamnar_sajten.md avsnitt 3. Kort: A5 är
 * Danmarks mått därför att deras märke bär en kontrollhistorik i klartext och
 * vårt bär en länk, och de brittiska liggande måtten är byggda kring en
 * sifferrad från noll till fem som vi inte har och aldrig ska ha. 100 x 100 mm
 * är dessutom det enda kvadratiska mått som är belagt som en uttrycklig
 * FÖNSTERDEKALSTORLEK och inte bara som ett klistermärke: Helloprints
 * raamstickers listar 70x100, 100x100, 300x300 och uppåt, och Sticker Mule EU
 * listar 50, 75, 100 och 125 mm kvadrat. Vistaprint UK har det inte, deras
 * kvadrater är 38, 50 och 76 mm.
 *
 * UTFALLET ÄR 5 MM och skyddsmarginalen 4 mm, och båda talen är valda för att
 * passa den strängaste av leverantörerna i stället för att snitta dem.
 * Helloprint kräver 5 mm utfall runt om och 3 mm ned till viktiga element.
 * Sticker Mule nöjer sig med en sextondels tum, alltså cirka 1,6 mm. En fil
 * med 5 mm fungerar hos båda; en med 1,6 mm gör det inte.
 *
 * QR-KODENS STORLEK. 38 mm inklusive den tysta zonen på utmärkelsedekalen, där
 * kransen tar ytan, och 42 mm på hänvisningsdekalen, som inte har någon krans.
 * Talen nedan räknas på det MINDRE av de två, alltså på det sämsta fallet.
 * Certifikatet ligger på 36 mm, vilket är rundligt eftersom ett A4 läses på
 * armlängds håll och inte genom ett fönster. Tre belagda underlag:
 *
 *   GS1 anger som enda normgivare ett mått i millimeter. X-dimensionen, alltså
 *   modulens sida, ska vara minst 0,396 mm, helst 0,495 mm och som mest
 *   0,990 mm, och den tysta zonen fyra moduler runt om. Vår smalaste modul är
 *   den längsta adressen i beståndet på version 10, alltså 57 moduler plus åtta
 *   tysta: 38 / 65 = 0,58 mm, över både golvet och målvärdet. Medianadressen
 *   landar på version 4: 38 / 41 = 0,93 mm. Den kortaste adressen i beståndet
 *   ger version 3 och 38 / 37 = 1,03 mm, alltså strax ÖVER GS1:s tak. Det taket
 *   handlar om kassascannerns synfält och inte om en telefon, så det är
 *   noterat och accepterat och inte förbisett.
 *
 *   GS1:s egen provtabell i 2D Barcode Colour & Quality Guide, februari 2025,
 *   är det mest konkreta som finns: en kod med logotyp i mitten föll igenom vid
 *   26 x 26 mm och klarade sig först vid 37 x 37 mm. Våra koder har ingen
 *   logotyp i mitten, alltså bättre marginal än så, och 38 mm ligger över deras
 *   godkända fall ändå.
 *
 *   Nielsen Norman Group rekommenderar minst 2 x 2 cm plus en centimeter per
 *   tio centimeters läsavstånd, vilket för en dörr på tre till fem decimeters
 *   håll ger 3 till 5 cm. 38 mm ligger mitt i det spannet.
 *
 * Denso Wave, som äger formatet, anger inget mått i millimeter alls utan i
 * skrivarpunkter: minst fyra punkter per modul, alltså 0,17 mm på en laser i
 * 600 dpi och 0,5 mm på en termoskrivare i 200 dpi. Även vår smalaste modul
 * ligger över den grövsta raden i den tabellen.
 *
 * DET SOM INTE ÄR BELAGT ska stå med. Ingen normgivande källa säger något om
 * avläsning genom glas, och regeln "läsavstånd delat med tio" som cirkulerar
 * har ingen standard bakom sig. Det enda som finns om underlaget är GS1:s
 * uppmaning att undvika blanka ytor och att lägga en matt, ogenomskinlig vit
 * platta under koden när den trycks på genomskinligt material. Den plattan
 * ritas alltid, se `qrGroup`.
 *
 * ============================================================================
 * 4. Färgrymden, ärligt
 * ============================================================================
 *
 * SVG KAN INTE BÄRA CMYK. Formatet har ingen färgrymd utöver sRGB, och det
 * finns ingen ärlig väg att kalla en SVG tryckfärdig i CMYK. Att låtsas om
 * något annat vore att skicka ett tryckeri en fil som ser rätt ut och separeras
 * fel.
 *
 * Det som görs i stället, och som är det ett tryckeri faktiskt vill ha:
 *
 *  1. Färgen står som sRGB-hexadecimal i filen, #007BE0, exakt samma värde som
 *     allt annat märkesblått.
 *  2. Filen bär en XML-kommentar överst med måtten, utfallet och en uppmaning
 *     att separera med tryckeriets egen profil. Vilken CMYK-blandning som är
 *     rätt beror på profilen, alltså på papperet, och ett tal vi hittar på här
 *     blir fel på hälften av jobben.
 *  3. QR-KODEN ÄR REN SVART, alltså K ensam efter separationen och aldrig en
 *     djupsvart blandning. Det är den enda hårda tryckregeln i filen: en
 *     fyrfärgssvart QR-kod blir suddig i kanterna så fort passningen glider en
 *     hårsmån, och en QR-kod lever på sina kanter.
 */

/**
 * Märkesblått i de här filerna.
 *
 * MÅSTE STÄMMA med `MARK_INK` i lib/marke.ts och `--brand` i tokens.css.
 * Värdet står som literal och inte som en import av samma skäl som `TO` i
 * functions/api/ratta.ts: modulen bundlas också av Cloudflare Pages, för sig,
 * och lib/marke.ts går inte att importera dit eftersom den använder Vites
 * `import.meta.glob` som esbuild inte känner till.
 */
export const DEKAL_INK = '#007BE0';

/** Texten på dekalen. Nästan svart och inte svart: ren svart bränner i tryck. */
export const DEKAL_TEXT = '#1A1A1F';

/** Dämpad text, till den lilla raden. Mätt mot vitt: 4,83:1. */
export const DEKAL_MUTED = '#5B5B66';

/**
 * QR-kodens svarta. Ren svart, se avsnitt 4 i huvudet.
 *
 * Skrivet som `#000000` och inte som `black`, eftersom ett tryckeriprogram som
 * läser namngivna färger inte alltid mappar dem till samma värde.
 */
export const DEKAL_QR = '#000000';

/**
 * Typsnittsstacken i de nedladdade filerna.
 *
 * Instrument Sans först, för den som har den installerad, och sedan Helvetica
 * och Arial. Det är ett medvetet avsteg från sajtens typografi och skälet är
 * att filen lämnar oss: en SVG kan bara bära vårt typsnitt genom att ha hela
 * fontfilen inbakad som base64, vilket är över hundra kilobyte i en fil som
 * ska mejlas, och utan den byter mottagarens program ändå ut typsnittet mot
 * något det har. Då är det bättre att välja utbytet själv än att låta
 * tryckeriet göra det.
 *
 * Följden hanteras med automatisk storleksanpassning i `line()` och INTE med
 * `textLength`, som var den första lösningen. Skälet är mätt: librsvg, alltså
 * renderaren i sharp och i en mängd tryckeriverktyg, IGNORERAR `textLength`
 * helt. Mätning 2026-08-31 på fem rader ur de här filerna, renderade i 300 dpi
 * och uppmätta på bläckets utbredning:
 *
 *   deklarerad 86 mm  ->  59,6 mm ritade
 *   deklarerad 58 mm  ->  54,2 mm ritade
 *   deklarerad 74 mm  ->  68,4 mm ritade
 *   deklarerad 74 mm  ->  63,4 mm ritade
 *
 * Attributet hade alltså skyddat i en webbläsare och inte i det program filen
 * faktiskt hamnar i, vilket är sämre än inget skydd eftersom det ser ut som
 * ett skydd. Samma mätning gav teckenbredderna som `estimeradBredd` bygger på:
 * kvoten mellan ritad bredd och tecken gånger teckengrad låg på 0,441 till
 * 0,518 i den fallbackfont librsvg valde. Talen nedan är 0,52 och 0,56, alltså
 * med marginal uppåt för en bredare font som DejaVu Sans på en Linuxmaskin.
 */
const FONT = "'Instrument Sans','Helvetica Neue',Helvetica,Arial,sans-serif";

/* -------------------------------------------------------------------------- */
/* Måtten                                                                      */
/* -------------------------------------------------------------------------- */

export interface DekalMatt {
  /** Skärmåttet, alltså den färdiga dekalens sida i millimeter. */
  trim: number;
  /** Utfall per sida. Bilden går så långt utanför skärlinjen. */
  bleed: number;
  /** Skyddsmarginal innanför skärlinjen. Ingen text hamnar närmare kanten. */
  safe: number;
  /** QR-kodens sida i millimeter på utmärkelsedekalen, tysta zonen inräknad. */
  qr: number;
  /**
   * Samma sak på hänvisningsdekalen.
   *
   * Större, därför att den dekalen inte bär någon krans och alltså har ytan
   * över. En QR-kod ska vara så stor som det finns plats för: varje extra
   * millimeter är en bredare modul och en längre räckvidd, och det finns
   * ingen övre gräns som spelar roll för en telefon.
   */
  qrStor: number;
}

/**
 * Fönsterdekalen.
 *
 * 5 mm utfall är Helloprints krav på sina raamstickers, alltså den strängaste
 * av de två leverantörer som faktiskt säljer 100 x 100 mm. Bilden är därmed
 * 110 x 110 mm och skärlinjen ligger 5 mm in. Skärmärken ritas i utfallet så
 * att den som beställer ser var det ska klippas.
 *
 * 4 mm skyddsmarginal betyder att ingen text står närmare skärlinjen än så.
 * Helloprint kräver 3, och den fjärde millimetern är vår egen: en skärmaskin
 * träffar inte på tiondelen, och en text som slutar 1 mm från kanten ser
 * felskuren ut även när den inte är det.
 */
export const DEKAL: DekalMatt = { trim: 100, bleed: 5, safe: 4, qr: 38, qrStor: 42 };

/** A4, för både arket och certifikatet. */
export const A4 = { width: 210, height: 297 } as const;

/**
 * Certifikatets marginal.
 *
 * 20 mm och inte 10. Certifikatet skrivs ut på en kontorsskrivare, och de
 * flesta av dem vägrar trycka de yttersta fem till sex millimetrarna. En
 * marginal på 20 mm gör att ingenting kan hamna i det otryckbara fältet
 * oavsett skrivare, och den ser dessutom ut som en marginal på ett diplom.
 */
export const CERTIFIKAT = { margin: 20, qr: 36 } as const;

/**
 * Arket: dekalen i verklig storlek på ett A4, att skriva ut och klippa.
 *
 * Två stycken stående och inte fyra. Fyra hade krävt 200 mm bredd på ett
 * papper som är 210, alltså 5 mm marginal, och det är innanför gränsen för vad
 * en kontorsskrivare kan trycka. Två stående är 100 x 200 mm mitt på arket,
 * med 55 mm luft på sidorna och 48,5 mm över och under.
 */
export const ARK = { columns: 1, rows: 2 } as const;

/** Vad filen är. Två helt olika saker, se docs/48 avsnitt 5. */
export type MarkeTyp = 'utmarkelse' | 'hanvisning';

/** Vilket format filen har. */
export type MarkeForm = 'dekal' | 'ark' | 'certifikat';

/* -------------------------------------------------------------------------- */
/* Ritningen som kommer utifrån                                                */
/* -------------------------------------------------------------------------- */

export interface Ritning {
  /** Innehållet mellan `<svg>` och `</svg>`. */
  inner: string;
  viewBox: string;
  /** Bredd genom höjd. Sätter höjden när bredden är bestämd. */
  ratio: number;
}

/**
 * Plockar isär en serverad SVG till det som går att sätta in i en annan.
 *
 * Ritningen skickas in som text och läses aldrig ur filsystemet här. Det är
 * avsiktligt och det är vad som gör modulen körbar på båda ställena: vid
 * bygget skickar sidan in resultatet av `markDocument`, och i funktionen
 * skickas resultatet av en hämtning från `/utmarkelser/2026/marke.svg` in.
 * Bilden kan alltså inte glida isär mellan förhandsvisningen och filen, och
 * modulen behöver aldrig känna till vare sig Vite eller Cloudflare.
 */
export function ritning(svgText: string): Ritning {
  const open = svgText.indexOf('<svg');
  const close = svgText.lastIndexOf('</svg>');
  if (open < 0 || close < 0) {
    throw new Error('Ritningen ser inte ut som en SVG.');
  }

  const tagEnd = svgText.indexOf('>', open);
  const tag = svgText.slice(open, tagEnd);
  const box = /viewBox="([^"]+)"/.exec(tag)?.[1];
  if (!box) throw new Error('Ritningen saknar viewBox och går därför inte att skala.');

  const parts = box.trim().split(/\s+/).map(Number);
  if (parts.length !== 4 || !parts[2] || !parts[3]) {
    throw new Error(`Ritningens viewBox går inte att skala: ${box}`);
  }

  return {
    inner: svgText.slice(tagEnd + 1, close),
    viewBox: box,
    ratio: parts[2] / parts[3],
  };
}

/* -------------------------------------------------------------------------- */
/* Små byggstenar                                                              */
/* -------------------------------------------------------------------------- */

/** XML-flykt. Verksamhetsnamn innehåller & och citattecken, mätt i beståndet. */
export function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface LineOptions {
  /** Önskad teckengrad i millimeter. Krymps om raden inte får plats. */
  size: number;
  weight?: number;
  fill?: string;
  /** Ytan raden får uppta, i millimeter. Aldrig bredden den ska uppta. */
  max: number;
}

/**
 * Radens bredd, uppskattad ur teckenantal och teckengrad.
 *
 * Uppskattad och inte uppmätt, eftersom en exakt mätning kräver fontens
 * bredduppgifter och de finns inte i en Cloudflare-funktion. Talen kommer ur
 * mätningen som står i FONT-kommentaren ovan och ligger med marginal över det
 * uppmätta, alltså överskattar funktionen hellre än underskattar. En
 * överskattning kostar en aning mindre text; en underskattning kostar en text
 * som växer ut ur dekalen.
 */
function estimeradBredd(text: string, size: number, weight: number): number {
  return text.length * size * (weight >= 600 ? 0.56 : 0.52);
}

/**
 * En centrerad textrad som krymper i stället för att sticka ut.
 *
 * Får raden inte plats sänks teckengraden tills den gör det. Det är fulare än
 * att klämma ihop bokstäverna, men det är det enda som fungerar i ALLA
 * renderare: `textLength` ignoreras av librsvg, mätt, se FONT ovan.
 *
 * Det viktigaste fallet är certifikatets namnrad. Det längsta namnet i
 * beståndet är 45 tecken, och 45 tecken i 11 mm fetstil uppskattas till 277 mm
 * på ett papper som är 210. Utan krympningen hade det namnet ritats tvärs över
 * pappersgränsen i varje program som inte stöder `textLength`, alltså i det
 * program tryckeriet använder.
 */
function line(x: number, y: number, text: string, o: LineOptions): string {
  const weight = o.weight ?? 400;
  const est = estimeradBredd(text, o.size, weight);
  const size = est <= o.max ? o.size : round(o.size * (o.max / est));

  return (
    `<text x="${x}" y="${y}" text-anchor="middle" font-family="${FONT}" ` +
    `font-size="${size}" font-weight="${weight}" ` +
    `fill="${o.fill ?? DEKAL_TEXT}">${xml(text)}</text>`
  );
}

/** Ritningen insatt som en egen viewport, centrerad på `cx`. */
function drawing(r: Ritning, cx: number, y: number, width: number): string {
  const height = width / r.ratio;
  return (
    `<svg x="${round(cx - width / 2)}" y="${round(y)}" width="${round(width)}" ` +
    `height="${round(height)}" viewBox="${r.viewBox}" overflow="visible">${r.inner}</svg>`
  );
}

/** Två decimaler. Millimeter med fjorton decimaler gör filen oläsbar. */
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * QR-koden som en grupp, skalad till `side` millimeter inklusive tyst zon.
 *
 * Den vita plattan under koden ritas alltid, även när bakgrunden redan är vit.
 * Skälet är att filen kan hamna på ett färgat underlag eller tryckas på klar
 * film, och en QR-kod utan ogenomskinlig botten är inte en QR-kod utan ett
 * mönster.
 */
function qrGroup(path: string, modules: number, x: number, y: number, side: number): string {
  const quiet = 4;
  const total = modules + quiet * 2;
  const scale = side / total;
  return (
    `<g><rect x="${round(x)}" y="${round(y)}" width="${round(side)}" height="${round(side)}" fill="#FFFFFF"/>` +
    `<g transform="translate(${round(x + quiet * scale)} ${round(y + quiet * scale)}) ` +
    `scale(${round4(scale)})" fill="${DEKAL_QR}" shape-rendering="crispEdges">` +
    `<path d="${path}"/></g></g>`
  );
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/* -------------------------------------------------------------------------- */
/* Texterna                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Orden på dekalen, per typ.
 *
 * De två uppsättningarna får inte gå att blanda ihop, och det är den viktigaste
 * regeln i hela filen. Hänvisningsmärket säger vad man kan göra, aldrig hur det
 * gick. Utmärkelsedekalen säger vad utmärkelsen är, och att den inte är ett
 * myndighetsbeslut, eftersom en blå krans i ett fönster annars läses som en
 * kontrollskylt. Se docs/24_maskotprogram.md § 2 och emblemsidans villkor.
 */
const ORD: Record<MarkeTyp, { ovan?: string; rubrik: string; fot: string }> = {
  hanvisning: {
    /* Överst, i stället för en ritning. Se `dekalGroup`. */
    ovan: 'prikko.se',
    rubrik: 'Se kommunens kontroller av oss',
    fot: 'Alla kontroller, som de står i kommunens rapport.',
  },
  utmarkelse: {
    /* Ingen rad överst: där står kransen, och den bär redan ordet. */
    rubrik: 'Skanna och se kontrollerna bakom',
    fot: 'Ett erkännande från Prikko, inte ett myndighetsbeslut.',
  },
};

/* -------------------------------------------------------------------------- */
/* Dokumenten                                                                  */
/* -------------------------------------------------------------------------- */

export interface DekalArg {
  typ: MarkeTyp;
  /**
   * Utmärkelsemärket. Krävs för `utmarkelse` och används inte alls för
   * `hanvisning`, se `dekalGroup` för varför den senare är rent typografisk.
   */
  ritning?: Ritning;
  /** QR-kodens `d`, ur `qrPath`. */
  qrPath: string;
  /** Kodens sida i moduler, utan tyst zon. */
  qrModules: number;
  /** Adressen koden bär. Skrivs också i filhuvudet, se nedan. */
  url: string;
  /** Utgåvans årtal. Bara för utmärkelsedekalen. */
  year?: number;
}

/**
 * Filhuvudet.
 *
 * Samma tanke som XML-kommentaren i `markDocument`: filen hittas lös, utan
 * sidan omkring, och ska då kunna berätta vad den är. Här står dessutom det ett
 * tryckeri behöver och som ingen annanstans i filen kan uttrycka, alltså
 * skärmått, utfall och färgrymd.
 */
function head(title: string, mm: string, url: string, print: string): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    `<!-- ${title}\n` +
    `     Mått: ${mm}\n` +
    `     ${print}\n` +
    `     Färg: sRGB #007BE0. SVG kan inte bära CMYK. Separera med tryckeriets\n` +
    '     egen profil. QR-koden ska tryckas i ren svart, aldrig i djupsvart.\n' +
    `     Koden leder till ${url}\n` +
    '     Villkoren för att använda märket: https://prikko.se/utmarkelser/emblem/ -->\n'
  );
}

/**
 * Dekalen som ett `<g>`, i millimeterkoordinater med origo i skärlinjens hörn.
 *
 * Delad ut som en grupp och inte som ett färdigt dokument, eftersom arket
 * behöver samma ritning två gånger på ett A4. Arket sätter den i `<defs>` och
 * instansierar den med `<use>`, så att kransens mask-id, som heter a till g,
 * bara finns EN gång i dokumentet. Två identiska id i samma SVG är samma fel
 * som gjorde att kartnålen fick ett söm, se docs/24 § 2.
 */
function dekalGroup(arg: DekalArg, id?: string): string {
  const { trim, qr } = DEKAL;
  const cx = trim / 2;
  const ord = ORD[arg.typ];
  const parts: string[] = [];

  /* Vit botten. Dekalen sitter på glas och behöver en egen yta. */
  parts.push(`<rect width="${trim}" height="${trim}" fill="#FFFFFF"/>`);

  /*
   * Inramningen ligger 4,5 mm innanför skärlinjen och inte i den.
   * En ram som följer kanten avslöjar varje tiondels millimeter skärmaskinen
   * missar, och den missar alltid något. Talet är också golvet för hur långt
   * ned den understa raden får gå: den ska stå INNANFÖR ramen, vilket den inte
   * gjorde i första utkastet.
   */
  parts.push(
    `<rect x="4.5" y="4.5" width="${trim - 9}" height="${trim - 9}" rx="6" ` +
      `fill="none" stroke="${DEKAL_INK}" stroke-width="0.7"/>`,
  );

  if (arg.typ === 'utmarkelse') {
    if (!arg.ritning) throw new Error('Utmärkelsedekalen kräver märkets ritning.');
    /* Kransen är bred, 507 gånger 236, alltså 60 mm ger 27,9 mm höjd. */
    parts.push(drawing(arg.ritning, cx, 9.5, 60));
    parts.push(qrGroup(arg.qrPath, arg.qrModules, cx - qr / 2, 40.5, qr));
    parts.push(line(cx, 84, ord.rubrik, { size: 3.4, weight: 500, max: 84 }));
    parts.push(
      line(cx, 89.5, 'prikko.se', { size: 4.4, weight: 700, fill: DEKAL_INK, max: 84 }),
    );
    parts.push(line(cx, 93.2, ord.fot, { size: 2.5, fill: DEKAL_MUTED, max: 84 }));
  } else {
    /*
     * HÄNVISNINGSMÄRKET BÄR INGET ANSIKTE, OCH DET ÄR EN REGEL OCH INTE ETT
     * UTKAST.
     *
     * Första versionen satte organisationens logotyp här, alltså grävlingen ur
     * public/prikko-mark.svg. Det är fel av två skäl som båda står i
     * docs/24_maskotprogram.md § 2.
     *
     * FÖRST: maskoten får aldrig stå bredvid en bedömning av en namngiven
     * verksamhet. En dekal på en namngiven restaurangs dörr, ett skann från
     * "brister som kvarstår", är exakt det läget. Figuren skulle läsas som att
     * hon går i god för stället, eller som att hon säger något om det.
     *
     * SEDAN, och tyngre: ETT ANSIKTE I ETT RESTAURANGFÖNSTER ÄR ETT BETYG.
     * Danmark har i tjugo år lärt hela Europa att en smiley på en dörr är
     * myndighetens omdöme, och deras smileymærke bär både symbolen och
     * QR-koden. Vårt märke säger ingenting om resultatet. Sätter vi ett
     * ansikte på det, vår egen blå eller någon annan, läser förbipasserande
     * ett betyg som inte finns, och då är märkets FRÅNVARO hos grannen också
     * ett betyg. Det är precis den mekanism hela hänvisningsmärket byggdes för
     * att undvika.
     *
     * Alltså är märket rent typografiskt: ordet, meningen, koden. Det ska
     * läsas som en hänvisning och inte som en utmärkelse, och en hänvisning
     * ser ut som en adress.
     */
    const stor = DEKAL.qrStor;
    parts.push(
      line(cx, 24, ord.ovan ?? '', { size: 10, weight: 700, fill: DEKAL_INK, max: 84 }),
    );
    parts.push(line(cx, 36, ord.rubrik, { size: 4.4, weight: 700, max: 84 }));
    parts.push(qrGroup(arg.qrPath, arg.qrModules, cx - stor / 2, 42, stor));
    parts.push(line(cx, 91, ord.fot, { size: 2.9, fill: DEKAL_MUTED, max: 84 }));
  }

  return `<g${id ? ` id="${id}"` : ''}>${parts.join('')}</g>`;
}

/**
 * Skärmärkena, ritade i utfallet.
 *
 * Fyra hörn, två streck vardera, 0,25 mm breda och 2,5 mm långa, med en
 * millimeters lucka in mot skärlinjen. Det är den form varje digitaltryckeri
 * förväntar sig, och luckan finns för att ett märke som går ända fram till
 * skärlinjen kan hamna på den färdiga dekalen om maskinen glider utåt.
 */
function cropMarks(bleed: number, trim: number): string {
  const gap = 1;
  const len = 2.5;
  const o = bleed; // skärlinjens läge i dokumentets koordinater
  const e = bleed + trim;
  const d: string[] = [];
  for (const [x, sx] of [
    [o, -1],
    [e, 1],
  ] as const) {
    for (const [y, sy] of [
      [o, -1],
      [e, 1],
    ] as const) {
      d.push(`M${x + sx * gap} ${y}h${sx * len}`);
      d.push(`M${x} ${y + sy * gap}v${sy * len}`);
    }
  }
  return `<path d="${d.join('')}" stroke="#000000" stroke-width="0.25" fill="none"/>`;
}

/**
 * Dekalen som tryckfärdig fil: 100 x 100 mm skuret, 106 x 106 mm med utfall.
 *
 * `width` och `height` står i millimeter och inte i pixlar. Det är skillnaden
 * mellan en fil ett tryckeri kan öppna och en fil de måste fråga om storleken
 * på. En SVG utan enhet tolkas som pixlar, och 100 px är 26 mm.
 */
export function dekalDocument(arg: DekalArg): string {
  const { trim, bleed } = DEKAL;
  const size = trim + bleed * 2;

  return (
    head(
      arg.typ === 'utmarkelse'
        ? `Prikkos utmärkelse ${arg.year ?? ''}: fönsterdekal.`.replace('  ', ' ')
        : 'Prikko: fönsterdekal, hänvisning till verksamhetens kontrollhistorik.',
      `${trim} x ${trim} mm skuret, ${size} x ${size} mm med ${bleed} mm utfall.`,
      arg.url,
      `Skärlinjen ligger ${bleed} mm in från kanten och är utmärkt med skärmärken.`,
    ) +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}mm" height="${size}mm" ` +
    `viewBox="0 0 ${size} ${size}">` +
    /* Utfallet är vitt hela vägen ut, så att en glidning aldrig ger en grå rand. */
    `<rect width="${size}" height="${size}" fill="#FFFFFF"/>` +
    `<g transform="translate(${bleed} ${bleed})">${dekalGroup(arg)}</g>` +
    cropMarks(bleed, trim) +
    '</svg>\n'
  );
}

/**
 * Arket: två dekaler i verklig storlek på ett A4, för en kontorsskrivare.
 *
 * Ingen utfall och inga skärmärken, eftersom en kontorsskrivare inte kan trycka
 * till kanten och ingen klipper efter skärmärken hemma. I stället ritas
 * skärlinjen som en tunn grå ram runt varje dekal, alltså den linje man ska
 * följa med saxen.
 */
export function arkDocument(arg: DekalArg): string {
  const { trim } = DEKAL;
  const x = (A4.width - trim) / 2;
  const gap = (A4.height - trim * ARK.rows) / (ARK.rows + 1);
  const copies: string[] = [];

  for (let i = 0; i < ARK.rows; i++) {
    const y = gap + i * (trim + gap);
    copies.push(`<use href="#pk-dekal" x="${round(x)}" y="${round(y)}"/>`);
    copies.push(
      `<rect x="${round(x)}" y="${round(y)}" width="${trim}" height="${trim}" ` +
        'fill="none" stroke="#B9B9C0" stroke-width="0.2" stroke-dasharray="2 2"/>',
    );
  }

  return (
    head(
      'Prikko: fönsterdekal på A4, att skriva ut och klippa.',
      `A4, ${A4.width} x ${A4.height} mm. Två dekaler i verklig storlek, ${trim} x ${trim} mm.`,
      arg.url,
      'Skriv ut i 100 procent, aldrig med "anpassa till sidan". Klipp längs den streckade linjen.',
    ) +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${A4.width}mm" height="${A4.height}mm" ` +
    `viewBox="0 0 ${A4.width} ${A4.height}">` +
    `<rect width="${A4.width}" height="${A4.height}" fill="#FFFFFF"/>` +
    `<defs>${dekalGroup(arg, 'pk-dekal')}</defs>` +
    copies.join('') +
    line(A4.width / 2, A4.height - 12, 'Skriv ut i 100 procent, utan skalning. Klipp längs de streckade linjerna.', {
      size: 3,
      fill: DEKAL_MUTED,
      max: 170,
    }) +
    '</svg>\n'
  );
}

export interface CertifikatArg extends DekalArg {
  /** Verksamhetens namn, som det står i utgåvan. */
  name: string;
  /** Kommunens namn i bestämd form: "Stockholms kommun". */
  municipalityName: string;
  /** Datumet utgåvan frystes, färdigformaterat. */
  asOf: string;
  year: number;
}

/**
 * Certifikatet: A4 stående, att skriva ut och sätta i en ram.
 *
 * Det här är det enda av de tre formaten som bär ett NAMN, och det är också
 * det enda som bara 254 verksamheter kan hämta. De två sakerna hänger ihop:
 * ett papper med ett företagsnamn och en lagerkrans PÅSTÅR något, och då måste
 * påståendet gå att slå upp. Dekalen påstår ingenting om vem den sitter hos,
 * och behöver därför inget namn. Se docs/48 avsnitt 5.
 *
 * Meningen mitt på sidan är samma mening som emblemsidan skriver ut, ord för
 * ord, och den är formulerad i förfluten tid med ett datum i. Ett diplom som
 * säger "är en av de bästa" åldras till en lögn; ett som säger vad som gällde
 * en namngiven dag gör det aldrig.
 */
export function certifikatDocument(arg: CertifikatArg): string {
  const m = CERTIFIKAT.margin;
  const cx = A4.width / 2;
  const parts: string[] = [];

  parts.push(`<rect width="${A4.width}" height="${A4.height}" fill="#FFFFFF"/>`);
  parts.push(
    `<rect x="14" y="14" width="${A4.width - 28}" height="${A4.height - 28}" rx="3" ` +
      `fill="none" stroke="${DEKAL_INK}" stroke-width="0.6"/>`,
  );

  if (!arg.ritning) throw new Error('Certifikatet kräver märkets ritning.');
  /* Kransen, 120 mm bred, alltså 55,9 mm hög. */
  parts.push(drawing(arg.ritning, cx, 40, 120));

  parts.push(line(cx, 122, 'Utmärkelse för genomgående skötsamhet', {
    size: 5,
    weight: 500,
    fill: DEKAL_MUTED,
    max: 150,
  }));

  /*
   * Namnet. 150 mm är ytan det får ta, alltså ramens 182 minus 16 mm luft på
   * var sida, och `line` sänker teckengraden i stället för att låta namnet
   * växa ut ur ramen. Det längsta namnet i beståndet är 45 tecken, vilket i
   * 11 mm fetstil uppskattas till 277 mm och alltså krymps till omkring 6 mm.
   */
  parts.push(line(cx, 140, arg.name, { size: 11, weight: 700, fill: DEKAL_INK, max: 150 }));

  parts.push(line(cx, 158, 'hade den längsta obrutna raden av kontroller utan en enda', {
    size: 4.2,
    max: 150,
  }));
  parts.push(line(cx, 165, `anmärkning i ${arg.municipalityName} när ${arg.year} års utgåva`, {
    size: 4.2,
    max: 150,
  }));
  parts.push(line(cx, 172, `frystes ${arg.asOf}.`, { size: 4.2, max: 150 }));

  parts.push(
    qrGroup(arg.qrPath, arg.qrModules, cx - CERTIFIKAT.qr / 2, 188, CERTIFIKAT.qr),
  );

  parts.push(line(cx, 232, 'Skanna och se dagens bedömning', {
    size: 3.6,
    weight: 500,
    max: 150,
  }));
  parts.push(
    line(cx, 238.5, arg.url.replace(/^https:\/\//, ''), {
      size: 3.4,
      fill: DEKAL_MUTED,
      max: 150,
    }),
  );

  parts.push(line(cx, 264, 'Utmärkelsen säger vad som gällde det angivna datumet och', {
    size: 3.2,
    fill: DEKAL_MUTED,
    max: 150,
  }));
  parts.push(line(cx, 269, 'ingenting om nuläget. Den är ett erkännande från Prikko,', {
    size: 3.2,
    fill: DEKAL_MUTED,
    max: 150,
  }));
  parts.push(line(cx, 274, 'inte ett myndighetsbeslut.', {
    size: 3.2,
    fill: DEKAL_MUTED,
    max: 150,
  }));

  return (
    head(
      `Prikkos utmärkelse ${arg.year}: certifikat för ${arg.name}.`,
      `A4 stående, ${A4.width} x ${A4.height} mm, ${m} mm marginal.`,
      arg.url,
      'Skriv ut i 100 procent, aldrig med "anpassa till sidan".',
    ) +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${A4.width}mm" height="${A4.height}mm" ` +
    `viewBox="0 0 ${A4.width} ${A4.height}">` +
    parts.join('') +
    '</svg>\n'
  );
}

/**
 * Filnamnet nedladdningen får.
 *
 * Namnet bär verksamhetens slug och årtalet, eftersom filen hamnar i en mapp
 * med hundra andra hos den som beställer trycket. `marke.svg` säger ingenting
 * där; `prikko-dekal-ag-2026.svg` säger allt.
 */
export function filename(form: MarkeForm, slug: string, year?: number): string {
  const stem = form === 'ark' ? 'dekal-a4' : form;
  return `prikko-${stem}-${slug}${year ? `-${year}` : ''}.svg`;
}
