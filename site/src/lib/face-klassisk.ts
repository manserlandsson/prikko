/**
 * DET KLASSISKA MÄRKET. Två prickar och en båge. GÄLLER NU.
 *
 * Det här är märket som Prikko bar fram till att maskoten togs in: Måns egna
 * banor, ritade i Figma och levererade som SVG i brand/, alltså
 * green/yellow/red-smiley-box.svg och -round.svg.
 *
 * Filen var länge en väg tillbaka. Den är det inte längre: ägaren valde D,
 * det klassiska märket, 2026-08-27 efter provarket brand/_prov-marken.html,
 * och sa det två gånger. "Basic märket ska därför vara överallt. är du med?
 * inte bara på kartan." Strömbrytaren i lib/face.ts står alltså på false, och
 * DEN HÄR RITNINGEN ÄR DEN SOM RITAS PÅ ALLA 21 STÄLLEN.
 *
 * Här stod förut "ändra inget i den här filen: den ska vara en exakt bild av
 * utgångsläget". Den meningen gällde en reservritning och gäller inte ett
 * levande märke. Vad som ÄR ändrat och varför står nedan, och vägen tillbaka
 * till utgångsläget går genom git som för vilken annan levande fil som helst.
 *
 * ── TVÅ ÄNDRINGAR MOT UTGÅNGSLÄGET, BÅDA TAL OCH INGEN NY RITNING ───────
 *
 * 1. GRADIENTEN ÄR BORTA. Plattan är platt.
 *
 *    Gradienten kostade ett `id` per läge, och `id` måste vara unika i ett
 *    dokument. Uppmätt i bygget: `pk-klassisk-clean` förekom TOLV gånger på
 *    /stockholm/ och två gånger på en verksamhetssida, eftersom samma
 *    konstanta sträng skrivs av spriten och av varje inlinat FaceMark. Det
 *    renderade rätt bara för att dubbletterna var identiska, alltså ett fel
 *    som hade slagit till först den dag någon rörde en ton. Maskotritningen
 *    löser samma sak med unikaId() i generatorn; en konstant sträng kan inte.
 *
 *    Den ritade också ett SÖM på kartnålen. Droppen fylls med FACE_PLATE som
 *    en platt yta medan ansiktet klipps in i huvudcirkeln, alltså låg en
 *    gradient i cirkeln och en enfärgad ton i stjärten.
 *
 *    Och den fanns aldrig av en anledning: märkets regel är noll gradienter,
 *    och en gradient som är läsbar i 200 px är brus i 13. Plattan bär nu det
 *    ljusa stoppet, alltså exakt det värde FACE_PLATE redan exporterade och
 *    som kartnålen och FaceMark redan ritade under gradienten.
 *
 * 2. "INGEN BEDÖMNING" ÄR #6E6E73 OCH INTE #C7C7CC.
 *
 *    Två fel i samma tal, båda mätta i brand/_prov-marken.html:
 *
 *      Gråvärdet. #FECB00 ligger på 199,2 och #C7C7CC på 199,4, alltså är
 *      mindre brister och ingen bedömning OMÖJLIGA att skilja åt utan färg.
 *      Provarket mätte samma kollision på maskotens plattor, 196 mot 196.
 *      #6E6E73 ligger på 110,4, alltså 89 gråsteg från den gula.
 *
 *      Kontrasten. Vitt på #C7C7CC ger 1,68:1 och WCAG 1.4.11 kräver 3:1 för
 *      grafik som bär betydelse. #6E6E73 ger 5,07:1.
 *
 *    Talet är inte nytt i paletten: #6E6E73 är sajtens --ink-quiet och redan
 *    --verdict-none-ink. Etiketten och märket får därmed samma färg, vilket
 *    är ägarens egen regel för den gula.
 *
 *    tokens.css --verdict-none står KVAR på #C7C7CC. Det tokenet är en YTA i
 *    stapeldiagram och vänsterkanter, tolv ställen, och en ljus neutral är
 *    rätt där. Märkets platta är en annan fråga än en stapels fyllning.
 *
 * ── VAD SOM INTE ÄR ÄNDRAT, OCH VAD DET KOSTAR ──────────────────────────
 *
 * Symbolen är vit i alla fyra lägen. Det är Måns designbeslut, nedskrivet vid
 * --on-clean i tokens.css, och den gula är #FECB00 därför att etiketten ska
 * bära märkets färg. Två mörkare gula har provats och underkänts av ägaren,
 * #8E7200 som guld och #A4560B som brunt.
 *
 * Priset är mätt och det ska stå här:
 *
 *     inga anmärkningar  vitt på #00B92B   2,63:1
 *     mindre brister     vitt på #FECB00   1,53:1
 *     brister kvarstår   vitt på #FF0000   4,00:1
 *     ingen bedömning    vitt på #6E6E73   5,07:1
 *
 * Två av fyra ligger under WCAG 1.4.11:s 3:1. Undantaget i kravet är att
 * grafiken inte behöver bära betydelsen ensam, och på 19 av de 21 ritställena
 * står bedömningens text intill märket. På de två som återstår, kartnålen
 * ovald och vald, gör den inte det. Att laga dem kräver att en av två av
 * ägarens egna beslut rivs: den vita symbolen, eller den gula. Talen för båda
 * vägarna finns: #00AD28 ger grönt 3,00:1 och en mörk bärnsten omkring
 * #BE8A00 ger gult 3,08:1. Det är ett ägarbeslut och inte ett kodbeslut.
 *
 * ── Vad som skiljer mot maskotens ritning ───────────────────────────────
 *
 * Måtten, för den som jämför: ögonen är solida vita cirklar med radie 6,12 på
 * 96-rutan, alltså 12,8 procent av bredden. Munnen är en båge med tjocklek
 * 7,87, alltså 8,2 procent. Maskotens ögon är omkring fem gånger större.
 *
 * Märket kan inte RÖRA SIG. Rörelsen är riggad mot grävlingens leder och det
 * finns inget här att rigga, se MARKE_ROR_SIG i lib/face.ts.
 */

export type FaceKeyG = 'clean' | 'minor' | 'major' | 'none';
export type FaceDetaljG = 'rik' | 'enkel' | 'nal';

/**
 * Plattans färg per läge. En ton och inte två: gradienten är borta, se noten
 * överst. De tre första är originalfilernas ljusa gradientstopp, alltså exakt
 * de värden FACE_PLATE redan exporterade. Den fjärde är flyttad, och skälet
 * står i punkt 2 överst.
 */
const FILL: Record<FaceKeyG, string> = {
  clean: '#00B92B',
  minor: '#FECB00',
  major: '#FF0000',
  none: '#6E6E73',
};

/** Munnens bana. Glad, rak, ledsen, och en kort neutral för utan bedömning. */
const MOUTH: Record<FaceKeyG, string> = {
  clean: 'M32 57.4883C44.2457 69.1509 56.4915 69.1509 68.7372 57.4883',
  minor: 'M32 61.0004C44.5 61 56.5 60.9995 68.7372 61.0004',
  major: 'M32 64.2196C44.5511 57.3262 56.6858 57.1944 68.7372 64.2196',
  none: 'M40 61.0004C46 61 54 61 60 61.0004',
};

const EYE_LEFT =
  'M39.8719 45.2457C43.2535 45.2457 45.9948 42.5044 45.9948 39.1229C45.9948 35.7413 43.2535 33 39.8719 33C36.4903 33 33.749 35.7413 33.749 39.1229C33.749 42.5044 36.4903 45.2457 39.8719 45.2457Z';
const EYE_RIGHT =
  'M62.6141 45.2457C65.9957 45.2457 68.737 42.5044 68.737 39.1229C68.737 35.7413 65.9957 33 62.6141 33C59.2325 33 56.4912 35.7413 56.4912 39.1229C56.4912 42.5044 59.2325 45.2457 62.6141 45.2457Z';

const MOUTH_WIDTH = '7.87226';

const NYCKLAR: FaceKeyG[] = ['clean', 'minor', 'major', 'none'];

/**
 * Ansiktet utan omslutande svg, plattan inkluderad, för att matcha
 * face-geometri.ts form exakt.
 *
 * INGA id OCH INGA defs. Det är själva poängen med att gradienten är borta:
 * markupen är en KONSTANT sträng som skrivs av spriten en gång och av varje
 * inlinat FaceMark en gång till, alltså flera gånger i samma dokument, och en
 * konstant sträng kan inte bära ett unikt id. Maskotritningen slipper undan
 * genom att generatorn numrerar sina id vid bygget; den vägen finns inte här.
 * Läggs något id-bärande in igen är dubbletterna tillbaka, se noten överst.
 *
 * Alla tre detaljnivåerna är identiska. Det klassiska märket hade aldrig några
 * nivåer, och det behövde det inte: två prickar och en båge överlever 16 px
 * utan hjälp. Det var också hela poängen med det, och priset var att figuren
 * inte kunde säga något mer än tre saker.
 */
function ansikte(key: FaceKeyG): string {
  return (
    `<rect width="100" height="100" fill="${FILL[key]}"/>` +
    `<path d="${EYE_LEFT}" fill="#fff"/><path d="${EYE_RIGHT}" fill="#fff"/>` +
    `<path class="mun" d="${MOUTH[key]}" stroke="#fff" stroke-width="${MOUTH_WIDTH}"` +
    ` stroke-linecap="round" fill="none"/>`
  );
}

export const FACE_PLATE: Record<FaceKeyG, string> = { ...FILL };

/**
 * RINGEN, alltså den tunna linjen längs kartnålens kant.
 *
 * Den ligger i lib/face.ts för maskotritningen, där plattan är pastell och
 * ringen mättad, och där ger den nålen en egen kant mot vad som helst under
 * sig. Det klassiska märket har en MÄTTAD platta, alltså hade samma grepp
 * gett en ring i exakt plattans färg, och en linje man inte ser är ingen
 * linje. Uppmätt före den här raden: tre av fyra nålar ritade ringen i
 * plattans egen ton medan den fjärde, ingen bedömning, ritade #C7C7CC som en
 * LJUS hårlinje på en mörk droppe. Fyra nålar, tre osynliga ringar och en
 * som stack ut.
 *
 * Tonerna är originalfilernas MÖRKA gradientstopp, alltså samma fyra tal som
 * bar gradientens andra ände innan den togs bort. De är ritningens egna och
 * inte nya färger. `none` följer den nya grå på samma avstånd.
 */
export const FACE_RING: Record<FaceKeyG, string> = {
  clean: '#009523',
  minor: '#DEB201',
  major: '#C50000',
  none: '#4F4F53',
};

export const FACE_MARKUP: Record<FaceKeyG, Record<FaceDetaljG, string>> =
  Object.fromEntries(
    NYCKLAR.map((k) => {
      const a = ansikte(k);
      return [k, { rik: a, enkel: a, nal: a }];
    }),
  ) as Record<FaceKeyG, Record<FaceDetaljG, string>>;

export const FACE_TECKEN: Record<FaceKeyG, Record<FaceDetaljG, number>> =
  Object.fromEntries(
    NYCKLAR.map((k) => {
      const n = FACE_MARKUP[k].rik.length;
      return [k, { rik: n, enkel: n, nal: n }];
    }),
  ) as Record<FaceKeyG, Record<FaceDetaljG, number>>;
