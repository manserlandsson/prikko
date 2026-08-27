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
 * ── DETALJNIVÅERNA ÄR AVSTÄLLDA. RIK GÄLLER ÖVERALLT ────────────────────
 * Ägaren, efter att ha sett märket live: "använd inte den basic grävlingen det
 * ser inte bra ut". Och sedan, som beslut: "använd samma för nål, det ska vara
 * inramat rikt hela tiden."
 *
 * Det var rätt dom, och den går att se. Nal-nivån ritade huvudet som en rundad
 * rektangel utan öron och utan nos, banden som två piller och brynen som två
 * ellipser så tjocka att de läste som ett andra par ögonlock. Den var byggd
 * för att fyra LÄGEN skulle gå att skilja åt i 16 px, och det gjorde den. Men
 * den var inte längre samma figur, och en maskot som byter utseende mellan
 * listan och verksamhetssidan är inte en maskot utan två.
 *
 * Nivåerna fanns:
 *
 *   rik    hela ansiktet med pupill, ögonlock, bryn och pälsnyanser
 *   enkel  ögonvitans modulering, munhålan och örontipparna offrade
 *   nal    plattan, ögonen, brynen och munnen, ingenting annat
 *
 * Ritningarna för `enkel` och `nal` ligger kvar i face-geometri.ts och
 * genereras fortfarande. De är AVSTÄLLDA, inte borttagna, av samma skäl som
 * det klassiska märket ligger kvar bakom `MASKOT = false`: den som vill väga
 * dokumentstorlek mot utseende en gång till ska kunna göra det på en rad i
 * stället för att gräva i git.
 *
 * Priset är mätt och inte gissat, se faceDetalj nedan.
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
 *  STRÖMBRYTAREN mellan de två ritningarna.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * true   Prikkos grävling, beskuren till ansiktet.
 * false  Två prickar och en båge, alltså det klassiska märket. GÄLLER NU.
 *        Ägarens val 2026-08-27, sagt två gånger: "D, det klassiska märket."
 *        Underlaget är brand/_prov-marken.html, som mätte fyra alternativ.
 *
 * ── VAD FLAGGAN FAKTISKT KRÄVER ─────────────────────────────────────────
 *
 * Här stod förut att det var "den ENDA raden som behöver ändras" och att
 * ingen komponent, ingen sprite och ingen kartnål behövde röras. DET VAR
 * FEL, och det var fel redan när det skrevs. Raden räcker för GEOMETRIN,
 * eftersom alla 21 ritställen läser FACE_MARKUP och FACE_PLATE härifrån. Den
 * räcker inte för RÖRELSEN, som tillkom efter att strömbrytaren skrevs och
 * som är riggad mot grävlingens leder.
 *
 * Byggen faller på lib/marke-rorelse.ts: riggen letar efter lock, bryn,
 * pupiller, band och öron, och det klassiska märket har inget av det. Att
 * lätta på riggens spärr hade gett ett märke där halva ansiktet lever, och
 * riggens egen princip säger att ett märke som står still är bättre. Därför
 * finns MARKE_ROR_SIG nedan, och därför säger den nej för det klassiska.
 *
 * Den som vänder tillbaka till true får alltså tillbaka rörelsen av sig
 * själv. Ingen annan fil bär ett antagande om vilken ritning som gäller.
 *
 * Skälet till att strömbrytaren finns: ett märke ska kunna ses live i en dag
 * innan det är oåterkalleligt. Att ritningen ligger i git-historiken räcker
 * inte, eftersom den som vill jämföra då måste veta vilken commit och hur man
 * plockar ut en fil ur den, och det gör ingen en tisdag när något känns fel.
 */
export const MASKOT = false;

const RITNING = MASKOT ? MASKOTRITNING : KLASSISK;

/**
 * KAN MÄRKET RÖRA SIG? Följer av vilken ritning som gäller.
 *
 * Rörelsen är inte skriven mot "ett märke" utan mot GRÄVLINGENS ansikte.
 * lib/marke-rorelse.ts riggar sex leder ur ritningen, blinkningen läser
 * ögonlockens viloläge ur markupen och brynlyftet flyttar bryn som bara
 * grävlingen har. Det klassiska märket är en platta, två cirklar och en båge:
 * det finns ingenting där att rigga.
 *
 * Två vägar fanns, och den ena är fel. Att låta riggen stå över de delar den
 * inte hittar ger ett märke där munnen ritas upp medan ögonen står still,
 * alltså precis det halvlevande ansikte som riggens spärr finns för att
 * förhindra. Den andra är att inte rita rörelse alls, och den är rätt: ett
 * märke som står still är ett helt märke.
 *
 * Flaggan läses av FaceMark.astro, som är den enda komponent som någonsin
 * animerar ett märke. FaceRef och FaceSprite ritar via <use> och har aldrig
 * kunnat röra sig, se noten om de 240 märkena på en kedjesida.
 *
 * Propen `liv`, `animate` och `blick` får fortsätta sättas av anropsplatserna.
 * De blir verkningslösa och inte felaktiga, alltså behöver verksamhetssidan
 * inte veta vilket märke som gäller. Det är hela poängen med strömbrytaren.
 */
export const MARKE_ROR_SIG = MASKOT;
const { FACE_MARKUP, FACE_PLATE } = RITNING;

export type FaceKey = 'clean' | 'minor' | 'major' | 'none';
export type FaceDetalj = 'rik' | 'enkel' | 'nal';

export function faceKey(verdict: VerdictOrNone): FaceKey {
  return verdict ?? 'none';
}

export const FACE_KEYS: FaceKey[] = ['clean', 'minor', 'major', 'none'];

/**
 * NIVÅVALET, som numera inte väljer.
 *
 * Funktionen står kvar och svarar `rik` för varje storlek. Den är kvar av två
 * skäl och inte av tröghet: den är den enda platsen där frågan "vilket ansikte
 * ritas här" besvaras, och att riva ut den ur ett fyrtiotal anropsplatser hade
 * spritt beslutet i stället för att samla det. Ska nivåerna någon gång tillbaka
 * är det den här funktionen som ändras, och ingenting annat.
 *
 * ── Vad avställningen kostade, mätt och inte gissat ─────────────────────
 * Byggt före och efter på hela sajten, samma maskin, samma innehåll. Sidorna
 * är de tre med flest märken, och HTML mäts både rått och gzippat eftersom det
 * är gzip som faktiskt går över tråden:
 *
 *                          FÖRE              EFTER            gzip
 *   /stockholm/          153 478 B         185 828 B       23 412 → 24 861 B
 *   /sok/                 44 852 B          77 202 B        8 411 →  9 674 B
 *   /kedja/ica/          283 328 B         315 678 B       23 782 → 25 254 B
 *
 * Alltså exakt 32 350 byte rått per sida, vilket är precis vad fyra symboler i
 * rik kostar mot fyra i nal. Kostnaden är KONSTANT och inte proportionell mot
 * antalet rader: Stockholms hubb har 8 511 verksamheter och betalar samma
 * 32 kB som en sida med tio. Det är spritens hela poäng, och det är skälet
 * till att beslutet är billigt.
 *
 * Gzippat är påslaget 1,3 till 1,5 kB, alltså 5 till 15 procent. Fyra ansikten
 * som skiljer sig på ett par tal komprimerar mot varandra.
 *
 * Kvar att veta för den som en dag mäter igen: de riktigt dyra märkena var
 * aldrig spriten utan de INLINADE. Ett inlinat rikt ansikte är omkring 8 600
 * tecken mot nålens 886, och en tidigare mätning visade fem inlinade märken
 * kosta 34 990 tecken medan hundra via spriten kostade 5 683. Blir en sida
 * någon gång dyr igen är åtgärden att gå via spriten, inte att sänka nivån.
 */
export const FACE_DETALJ_GRANS = { rik: 0, enkel: 0 } as const;

/**
 * Ansiktets detaljnivå. Alltid `rik`, se noten ovan.
 *
 * `size` står kvar i signaturen med flit. Anropsplatserna skickar den redan,
 * och den dagen frågan prövas igen ska den prövas här och inte hos den som
 * råkar rita ett märke.
 */
export function faceDetalj(_size: number): FaceDetalj {
  return 'rik';
}

/**
 * RINGEN: den tunna linjen längs kartnålens kant, innanför den vita konturen.
 *
 * Den enda kvarvarande konsumenten är lib/kartnal.ts. Den runda varianten som
 * namnet syftar på är borta, se FACE_RAM_RADIE längre ned.
 *
 * RINGEN FÖLJER RITNINGEN, och det är inte kosmetik. En ring finns för att ge
 * droppen en egen kant, alltså måste den skilja sig från plattan. Maskotens
 * plattor är pastell och ringen mättad. Det klassiska märkets plattor ÄR de
 * mättade tonerna, så samma fyra tal hade gett en ring i plattans egen färg
 * på tre nålar av fyra. Den klassiska ritningen bär därför sina egna,
 * mörkare toner, och de står i face-klassisk.ts.
 *
 * Gradienten är borta ur båda ritningarna. Den fanns aldrig av en anledning,
 * och märkets regel är noll gradienter, verifierat i fyra av Duolingos
 * officiella filer. En gradient som är läsbar i 200 px är brus i 13.
 */
const MASKOT_RING: Record<FaceKey, string> = {
  clean: '#00B92B',
  minor: '#FECB00',
  major: '#EB0000',
  none: '#C7C7CC',
};

export const FACE_RING: Record<FaceKey, string> = MASKOT ? MASKOT_RING : KLASSISK.FACE_RING;

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
