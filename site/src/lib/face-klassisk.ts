/**
 * DET KLASSISKA MÄRKET. Två prickar och en båge.
 *
 * Det här är märket som Prikko bar fram till att maskoten togs in: Måns egna
 * banor, ritade i Figma och levererade som SVG i brand/, alltså
 * green/yellow/red-smiley-box.svg och -round.svg.
 *
 * Filen finns kvar för att bytet ska gå att ångra utan att någon behöver leta
 * i git-historiken. Att en ritning ligger i historiken betyder i praktiken att
 * den är borta: den som vill jämföra måste veta vilken commit och hur man
 * plockar ut en fil ur den, och det gör ingen en tisdag när något känns fel.
 *
 * ── SÅ HÄR GÅR DU TILLBAKA ──────────────────────────────────────────────
 *
 * Öppna lib/face.ts och ändra EN rad:
 *
 *     export const MASKOT = true;    ->    export const MASKOT = false;
 *
 * Det är allt. Ingen komponent, ingen sida och ingen sprite behöver röras.
 * Kartnålen, sökförslagen och listorna följer med automatiskt, eftersom alla
 * läser samma modul.
 *
 * ── Vad som skiljer ─────────────────────────────────────────────────────
 *
 * Det klassiska märket har GRADIENT i den fyllda varianten, vilket maskotens
 * regel förbjuder. Gradienten är därför kvar HÄR och bara här, som en trogen
 * kopia av det som var. Ändra inget i den här filen: den ska vara en exakt
 * bild av utgångsläget, annars är det inte längre en väg tillbaka.
 *
 * Måtten, för den som jämför: ögonen är solida vita cirklar med radie 6,12 på
 * 96-rutan, alltså 12,8 procent av bredden. Munnen är en båge med tjocklek
 * 7,87, alltså 8,2 procent. Maskotens ögon är omkring fem gånger större.
 */

export type FaceKeyG = 'clean' | 'minor' | 'major' | 'none';
export type FaceDetaljG = 'rik' | 'enkel' | 'nal';

/** Gradientstopp ur originalfilerna. Det ljusa stoppet bär plattan. */
const FILL: Record<FaceKeyG, [string, string]> = {
  clean: ['#00B92B', '#009523'],
  minor: ['#FECB00', '#DEB201'],
  major: ['#FF0000', '#C50000'],
  none: ['#C7C7CC', '#AEAEB2'],
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
 * face-geometri.ts form exakt. Gradienten får ett id härlett ur nyckeln, så
 * att fyra märken i samma sprite inte delar id.
 *
 * Alla tre detaljnivåerna är identiska. Det klassiska märket hade aldrig några
 * nivåer, och det behövde det inte: två prickar och en båge överlever 16 px
 * utan hjälp. Det var också hela poängen med det, och priset var att figuren
 * inte kunde säga något mer än tre saker.
 */
function ansikte(key: FaceKeyG): string {
  const [fran, till] = FILL[key];
  const id = `pk-klassisk-${key}`;
  return (
    `<defs><linearGradient id="${id}" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">` +
    `<stop stop-color="${fran}"/><stop offset="1" stop-color="${till}"/></linearGradient></defs>` +
    `<rect width="100" height="100" fill="url(#${id})"/>` +
    `<path d="${EYE_LEFT}" fill="#fff"/><path d="${EYE_RIGHT}" fill="#fff"/>` +
    `<path class="mun" d="${MOUTH[key]}" stroke="#fff" stroke-width="${MOUTH_WIDTH}"` +
    ` stroke-linecap="round" fill="none"/>`
  );
}

export const FACE_PLATE: Record<FaceKeyG, string> = Object.fromEntries(
  NYCKLAR.map((k) => [k, FILL[k][0]]),
) as Record<FaceKeyG, string>;

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
