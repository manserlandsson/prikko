/**
 * Bedömningsmärkets geometri — en enda sanning.
 *
 * Den här modulen ÄR märket. FaceMark.astro, FaceSprite.astro, kartbas.ts och
 * sokforslag.ts hämtar allt härifrån och har inga egna kopior.
 *
 * Historik värd att spara: FaceMark.astro bar länge en egen kopia av samma
 * banor, med en kommentar om att den borde importera härifrån. Två kopior av
 * en sanning divergerar alltid, och den enda anledningen till att de inte hann
 * göra det var att ingen rörde märket på ett tag. Ett maskotbyte mot två
 * divergerande kopior är hur man får ett halvbytt märke.
 *
 * ── Vad märket är nu ────────────────────────────────────────────────────
 * Märket är Prikkos grävling, beskuren till ansiktet. Figuren är ritad fri i
 * brand/maskot/gravling.mjs och märket HÄRLEDS ur den genom beskärning, inte
 * genom att ett eget ansikte ritats för små storlekar. Det fria ansiktet är
 * facit, precis som Duolingos app-ikon är Duo beskuren och inte Duo förminskad.
 *
 * Markupen genereras därför av brand/bygg-face-geometri.mjs och landar i
 * face-geometri.ts bredvid. Kör om den efter varje ändring i figuren:
 *
 *     node brand/bygg-face-geometri.mjs
 *
 * ── Tre detaljnivåer ────────────────────────────────────────────────────
 * Att ha flera nivåer är inte en genväg utan hur ikoner byggs. Duolingo offrar
 * kropp, vingar, öron, fötter och en färgnyans i sin app-ikon. Våra nivåer:
 *
 *   rik    hela ansiktet med pupill, ögonlock, bryn och pälsnyanser.
 *          Över 32 px, där detaljerna bevisligen syns.
 *   enkel  pupillen och de finaste nyanserna borta. 24 till 32 px.
 *   nal    plattan, ögonen, brynen och munnen. Ingenting annat.
 *          Kartnålar, och allt under 24 px.
 *
 * Brynen finns kvar i ALLA tre nivåerna, och det är avsiktligt. De är den
 * enda bäraren som klarar 24 px i gråskala, och ett bryn är dessutom en tjock
 * lutande stapel, alltså den formtyp som överlever nedskalning bäst av allt i
 * ett ansikte. Det som dör först är tunna linjer och små ytskillnader.
 *
 * Gränsen är en REGEL I KOD och inte en kommentar: komponenten väljer nivå ur
 * `size`, så att ingen anropsplats behöver veta något. Annars renderar någon
 * det rika ansiktet i 16 px, och det är bara en fråga om tid.
 *
 * ── Tillgänglighet ──────────────────────────────────────────────────────
 * Ansiktet är förstärkning. Betydelsen bärs alltid av texten bredvid, aldrig
 * av färgen eller minen ensam. Skillnaden mellan de tre bedömningarna sitter i
 * brynens vinkel och munnens båge, och båda är prövade ensamma i 24 px i
 * gråskala.
 */
import type { VerdictOrNone } from './site';
import * as MASKOTRITNING from './face-geometri';
import * as KLASSISK from './face-klassisk';

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  STRÖMBRYTAREN. Sätt till false för att få tillbaka det klassiska märket.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * true   Prikkos grävling, beskuren till ansiktet. Nuvarande märke.
 * false  Två prickar och en båge, alltså märket som var. Ritningen ligger
 *        kvar i sin helhet i face-klassisk.ts och är oförändrad.
 *
 * Det är den ENDA raden som behöver ändras. Ingen komponent, ingen sida,
 * ingen sprite och ingen kartnål behöver röras: alla läser den här modulen.
 * Bygg om och märket är tillbaka.
 *
 * Skälet till att strömbrytaren finns: ett märke ska kunna ses live i en dag
 * innan det är oåterkalleligt. Att ritningen ligger i git-historiken räcker
 * inte, eftersom den som vill jämföra då måste veta vilken commit och hur man
 * plockar ut en fil ur den, och det gör ingen en tisdag när något känns fel.
 */
export const MASKOT = true;

const RITNING = MASKOT ? MASKOTRITNING : KLASSISK;
const { FACE_MARKUP, FACE_PLATE } = RITNING;

export type FaceKey = 'clean' | 'minor' | 'major' | 'none';
export type FaceDetalj = 'rik' | 'enkel' | 'nal';

export function faceKey(verdict: VerdictOrNone): FaceKey {
  return verdict ?? 'none';
}

export const FACE_KEYS: FaceKey[] = ['clean', 'minor', 'major', 'none'];

/**
 * Gränserna mellan detaljnivåerna, i px.
 *
 * Mätta två gånger, och andra gången ändrade svaret.
 *
 * Första försöket satte gränserna där detaljerna SLUTAR SYNAS: pupillen bär
 * ned till 32 px, och under 24 px gör bara plattan, ögonen, brynen och munnen
 * något. Det gav rik över 32 och enkel mellan 24 och 32.
 *
 * Sedan mättes dokumentet. Stockholms kommunsida växte 22 procent, och nästan
 * allt kom från FEM märken i 30 px som föll i enkel-spannet: de kostade 34 990
 * tecken tillsammans, alltså 7 000 var, medan hundra märken i 38 px kostade
 * 5 683 totalt eftersom de går via spriten. Fem märken vägde sex gånger så
 * mycket som hundra.
 *
 * Rätt fråga är alltså inte var detaljen slutar synas utan var den slutar vara
 * VÄRD sitt pris. Vid 30 px är skillnaden mellan enkel och nal knappt synlig
 * och kostar 6 100 tecken per märke. Vid 56 px och uppåt syns den, och där
 * står det sällan mer än ett eller två märken på en sida.
 *
 *   rik    56 px och uppåt. Verksamhetssidans stora märke, artiklarnas.
 *   enkel  32 till 56 px. Kort och puffar.
 *   nal    under 32 px. Listor, kartnålar, sökförslag, favicon.
 */
export const FACE_DETALJ_GRANS = { rik: 56, enkel: 32 } as const;

/** Väljer detaljnivå ur storleken. Anropsplatser ska aldrig göra det själva. */
export function faceDetalj(size: number): FaceDetalj {
  if (size >= FACE_DETALJ_GRANS.rik) return 'rik';
  if (size >= FACE_DETALJ_GRANS.enkel) return 'enkel';
  return 'nal';
}

/**
 * Ringfärg i den runda varianten, och plattans färg i den fyllda.
 *
 * Gradienten är borta. Den fanns aldrig av en anledning, och maskotens regel
 * är noll gradienter, verifierat i fyra av Duolingos officiella filer. En
 * gradient som är läsbar i 200 px är dessutom bara brus i 16.
 */
export const FACE_RING: Record<FaceKey, string> = {
  clean: '#00B92B',
  minor: '#FECB00',
  major: '#EB0000',
  none: '#C7C7CC',
};

/**
 * Plattans ton bakom ansiktet i den fyllda varianten.
 *
 * Ägaren bad om "lite lite starkare av originalfärgen men samtidigt ljus".
 * Steg 3 av fem valdes, och villkoret var inte smak utan kontrast: huvudets
 * kontur måste synas mot plattan också i gråskala och också i 16 px. Steg 3
 * ger 45 till 55 gråsteg mellan platta och huvud, vilket håller hela vägen ned.
 */
export { FACE_PLATE };

/**
 * Ansiktets markup per läge och detaljnivå, utan omslutande svg.
 * Innehåller plattan, så den som bäddar in behöver bara ramen.
 */
export { FACE_MARKUP };

/** id-prefix för sprite-symbolerna. Måste vara unikt nog att inte krocka. */
export const FACE_SPRITE_ID = 'pk-face';

/**
 * RAMEN ÄR EN RUNDAD KVADRAT. ÖVERALLT.
 *
 * Ägarens beslut, ordagrant: "den ska inte va helt runda den ska va en kvadrat
 * med rundade hörn right." Det gäller verksamhetssidan, listorna, sökträffarna,
 * kartnålarna och Närliggande. En cirkel och en rundad kvadrat sida vid sida på
 * samma sajt läser som två olika märken.
 *
 * Det finns ett juridiskt skäl som pekar åt samma håll, och det skrivs ned här
 * så att det finns kvar när någon senare undrar. I Buc-ee's mot Mickey's 2026
 * stämde en bäver en älg, alltså två helt olika djur, och fick gehör. Grunden
 * var att båda var "a cartoon animal facing right with wide eyes and a smile,
 * overlaying a ROUND background". Det är inte arten som fäller, det är posen,
 * inramningen och paletten tillsammans. Vår maskot har numera stora ögon med
 * ögonvita och pupill, alltså är två av de tre punkterna uppfyllda. Den rundade
 * kvadraten är den tredje.
 *
 * Propen `variant` finns kvar i FaceMark, men båda värdena ritar numera samma
 * rundade kvadrat. Skillnaden är bara vikten: `round` var förr en lättare form
 * för listor, och den skillnaden bärs nu av storleken i stället för av formen.
 *
 * NÅLENS form är en annan fråga än MÄRKETS. En kartnål är en droppe, eftersom
 * en droppe PEKAR: spetsen ligger på koordinaten medan en kvadrat tvingar
 * ögat att gissa mittpunkten. Droppens huvud är därför runt, och ansiktet
 * ligger urklippt i det. Det är inte märkets form, det är nålens.
 */
export const FACE_RAM_RADIE = 17;
