/**
 * Bedömningsmärkets geometri — en enda sanning.
 *
 * Banorna är Måns egna, ritade i Figma och levererade som SVG i brand/:
 * green/yellow/red-smiley-box.svg och -round.svg. Ändras filerna i brand/ ska
 * den här modulen följa — den är inte en tolkning av logotypen, den ÄR
 * logotypen.
 *
 * OBS: FaceMark.astro bär i dag en egen kopia av samma banor. Den borde
 * importera härifrån, men filen redigerades av annan hand samtidigt som den
 * här modulen skrevs och lämnades därför orörd. Att slå ihop dem är ett
 * eget, litet uppdrag — se rapporten.
 */
import type { VerdictOrNone } from './site';

export type FaceKey = 'clean' | 'minor' | 'major' | 'none';

export function faceKey(verdict: VerdictOrNone): FaceKey {
  return verdict ?? 'none';
}

export const FACE_KEYS: FaceKey[] = ['clean', 'minor', 'major', 'none'];

/** Gradientstopp ur originalfilerna (box-varianten). */
export const FACE_FILL: Record<FaceKey, [string, string]> = {
  clean: ['#00B92B', '#009523'],
  minor: ['#FECB00', '#DEB201'],
  major: ['#FF0000', '#C50000'],
  none: ['#C7C7CC', '#AEAEB2'],
};

/** Ringfärg i den runda varianten. */
export const FACE_RING: Record<FaceKey, string> = {
  clean: '#00B92B',
  minor: '#FECB00',
  major: '#FF0000',
  none: '#C7C7CC',
};

/** Munnens bana. Glad, rak, ledsen — exakt som i originalen. */
export const FACE_MOUTH: Record<FaceKey, string> = {
  clean: 'M32 57.4883C44.2457 69.1509 56.4915 69.1509 68.7372 57.4883',
  minor: 'M32 61.0004C44.5 61 56.5 60.9995 68.7372 61.0004',
  major: 'M32 64.2196C44.5511 57.3262 56.6858 57.1944 68.7372 64.2196',
  none: 'M40 61.0004C46 61 54 61 60 61.0004',
};

export const FACE_EYE_LEFT =
  'M39.8719 45.2457C43.2535 45.2457 45.9948 42.5044 45.9948 39.1229C45.9948 35.7413 43.2535 33 39.8719 33C36.4903 33 33.749 35.7413 33.749 39.1229C33.749 42.5044 36.4903 45.2457 39.8719 45.2457Z';
export const FACE_EYE_RIGHT =
  'M62.6141 45.2457C65.9957 45.2457 68.737 42.5044 68.737 39.1229C68.737 35.7413 65.9957 33 62.6141 33C59.2325 33 56.4912 35.7413 56.4912 39.1229C56.4912 42.5044 59.2325 45.2457 62.6141 45.2457Z';

export const FACE_MOUTH_WIDTH = '7.87226';

/** id-prefix för sprite-symbolerna. Måste vara unikt nog att inte krocka. */
export const FACE_SPRITE_ID = 'pk-face';
