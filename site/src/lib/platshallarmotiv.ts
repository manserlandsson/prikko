/**
 * PLATSHÅLLARENS MOTIV, ETT PER VERKSAMHETSSORT.
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Ägaren 2026-08-28: "kanske olika ikoner, samma stil beroende på om det är
 * restaurang, butik, eller vilka filter vi nu har? ser ju att det står olika
 * liksom."
 *
 * Bildytan ritar i dag EN markis på varje rad utan foto, alltså 13 333 av
 * kartans 13 692 rader med koordinat. Den här filen håller motiven som gör
 * att ritningen i stället följer radens kategori.
 *
 * FILEN ÄR ETT FÖRSLAG OCH ÄR INTE INKOPPLAD. Motiven står här färdiga att
 * läsa, ritas i brand/_prov-bildyta.html och väntar på ägarens val, precis
 * som markisen och utförande C gjorde. Varken Bildyta.astro eller Karta.astro
 * importerar filen ännu, alltså kostar den noll byte i bygget.
 *
 * VARFÖR EN EGEN FIL OCH INTE lib/bildmotiv.ts. Det ordet är upptaget. Där
 * betyder "motiv" VAD ETT FOTOGRAFI FÖRESTÄLLER, alltså en bedömning som en
 * människa gjort om en enskild bild, och den styr ordning. Här betyder motiv
 * VAD PLATSHÅLLAREN RITAR när det inte finns något fotografi alls. Två helt
 * olika frågor som råkar dela ord, och att lägga dem i samma fil hade gjort
 * varje framtida läsning tvetydig.
 *
 *
 * ══ DATAN FINNS REDAN, OCH DEN KOSTAR NOLL NYA BYTE ═════════════════════
 *
 * Fältet är `props.c` i vektorrutan, satt av `KATEGORI_BIT` i lib/kartrutor.ts
 * och läst till radens `kat` i Karta.astro. Det är en bitmask över
 * TOP_CATEGORIES i deras ordning, alltså restaurang, café, butik, skola,
 * övrigt. Kategoriraden i kolumnen filtrerar redan på precis den masken, så
 * rutarkivet behöver inte en enda ny byte för att bära det här.
 *
 * EN RAD KAN BÄRA FLERA BITAR. 238 av 16 044 verksamheter hör hemma i två
 * toppkategorier, främst Stockholm där "1. Café" och "1. Restaurang" står på
 * samma verksamhet. Motivet följer den FÖRSTA satta biten, alltså samma
 * företräde som `displayCategory` i lib/categories.ts redan ger etiketten.
 * Ritningen och ordet säger då samma sak i stället för två.
 *
 * MASK 0 ÄR OKÄNT OCH INTE ÖVRIGT, se noten vid `kategoriBitar`. De raderna
 * faller tillbaka på markisen, alltså på det motiv som står på varje rad i
 * dag. 155 av 13 692 rader med koordinat, 1,1 procent.
 *
 *
 * ══ VARFÖR DET HÄR INTE ÄR SAMMA FEL SOM ÅTERTOGS ═══════════════════════
 *
 * Bildyta.astro har en not som säger att motivet INTE får säga något om
 * verksamheten. Den skrevs om en tidigare yta, matkategorins ikon på 16
 * procents opacitet, och den räknade upp tre fel. Två av dem gäller inte här:
 * opaciteten och de tre bakgrundstonerna är borta sedan markisen. Det tredje
 * var att påståendet vilade på en OSM-kategori som saknades för 12 120 av
 * 16 047 rader.
 *
 * DET TALET GÄLLER INTE DET HÄR FÄLTET. Kategorin här kommer ur kommunernas
 * egna verksamhetstyper genom tabellen i lib/categories.ts, och den saknas
 * för 155 av 13 692 rader med koordinat, alltså 1,1 procent i stället för
 * 75,5. Raden VISAR dessutom redan typen i klartext i sin metarad, se `.k-typ`
 * i Karta.astro, och kategoriraden ovanför listan visar vilken kategori som
 * filtrerar. En ritning som följer samma fält lägger alltså inte till ett
 * påstående, den upprepar det som redan står skrivet på raden.
 *
 * KVAR STÅR ATT MOTIVEN ÄR NEUTRALA FÖREMÅL. Fyra av fem är fronter man går
 * fram till, ritade i markisens familj, och ingen av dem bedömer något.
 *
 * MASKOTEN FÅR ALDRIG VARA ETT AV DEM, docs/24_maskotprogram.md §2. Varje rad
 * bär både ett namn och en bedömning, och det är mitten av det regeln finns
 * för. Inget motiv nedan är figuren och inget är ett djur.
 *
 *
 * ══ STILEN ÄR MARKISENS, OCH DEN ÄR RÄKNAD OCH INTE TITTAD PÅ ═══════════
 *
 * Den befintliga ritningen mättes innan de nya ritades, och varje egenskap
 * nedan är hämtad ur den:
 *
 *   rutnätet          48 x 48, inte sajtens 24 för ikoner
 *   streck            noll. Varje kant är en tonskarv.
 *   toner             fem, ur tokens.css, i fast ordning från ljus till mörk
 *   former            sex paths, alla fyllda
 *   koordinater       heltal, eller tredjedelar: 5,333 och 10,667
 *   bläckets bredd    x 7 till 41, alltså 34 av 48 enheter
 *   bläckets höjd     y 12 till 41,2, alltså 29,2 enheter
 *   marklinjen        x 7..41, y 39,4, höjd 1,8, radie 0,9
 *   volymen           mittformen ljusare än ytterformerna
 *
 * DE FYRA SISTA ÄR VILLKOR OCH INTE SMAK.
 *
 * Bläckets bredd 34 av 48 är talet hela storleken hänger på. Motivet ritas i
 * 96 procent av rutan, och det talet valdes för att sidoluften då blir 10,2 px
 * i den breda formens 64 px ruta, alltså precis utanför rutans hörnbåge på
 * --r-control. Ett motiv som är bredare än 34 enheter tuschar hörnet. Varje
 * ritning nedan håller sig därför innanför x 7..41, och marklinjen är den enda
 * form som når hela vägen ut.
 *
 * Bläckets höjd 29,2 med mitten på y 26,6 är talet som gör att motiven ser
 * LIKA STORA ut. Kartans data-URI flyttar rutan till `viewBox='0 2.6 48 48'`
 * just för att bläckets mitt ska bli rutans mitt. Ett motiv med annan höjd
 * hade sett mindre ut bredvid markisen utan att någon kunde peka på varför.
 * Spannet nedan är 28,2 till 29,2 enheter, alltså inom en enhet.
 *
 * Marklinjen är gemensam för alla. Den är familjens starkaste band: fem motiv
 * som står på samma mark läser som en uppsättning även när formerna ovanför
 * skiljer sig.
 *
 * MINSTA STORLEK ÄR INTE 44 PX. Den breda formen ritar rutan 64 px och
 * bläcket 43,5, men den kompakta formen ritar rutan 48 px och bläcket 32,6,
 * och det är den som avgör. En detalj under omkring tre enheter blir under
 * 2,8 px där och finns inte. Varje detalj nedan är därför minst 3 enheter, de
 * flesta 4,5 eller mer.
 *
 * FÅR INTE LÄSA SOM ETT LADDNINGSSKELETT. Ett skelett är en TOM rundad
 * rektangel i en enda ton; det som gör den till ett skelett är avsaknaden av
 * detalj. Varje motiv nedan bär minst fyra former i minst fyra toner.
 *
 *
 * ══ SKILJBARA I GRÅSKALA, ALLTSÅ PÅ SILUETT ════════════════════════════
 *
 * Alla fem är grå. Skillnaden måste därför ligga i formen och inte i tonen,
 * och den ligger i motivets ÖVERKANT, som är det ögat läser först:
 *
 *   restaurang   markis: brett utsprång med tre runda kappor
 *   café         kopp: rund siluett, öra åt höger, fat på marken
 *   butik        skyltband: rakt och grunt utsprång, brett mörkt skyltfönster
 *   skola        sadeltak: triangel, ingen utskjutande list
 *   övrigt       sågtandstak: tre spetsar, ingen utskjutande list
 *
 * Även den MÖRKA MASSAN i nedre halvan skiljer sig, vilket är det andra ögat
 * läser: en smal hög dörr, en bred liggande skyltruta, två fönster kring en
 * dörr, och en bred lastport.
 */

/** Nyckeln är TopCategoryId, plus `okand` för mask 0. */
export type MotivNyckel = 'restaurang' | 'cafe' | 'butik' | 'skola' | 'ovrigt' | 'okand';

/**
 * Palettens fem toner.
 *
 * Nyckeln är CSS-klassen som Bildyta.astro sätter; värdet är samma tal som
 * tokens.css, hårdkodat, eftersom kartans data-URI är ett eget dokument som
 * varken kan läsa en variabel eller ärva en klass. Se noten vid `.k-bild` i
 * Karta.astro, som säger samma sak åt andra hållet.
 *
 * Ordningen är från ljus till mörk, med uppmätt kontrast mot --bild-tom:
 *
 *     fasad         #D0D0D8   1,36:1
 *     markis-ljus   #C6C6CE   1,50:1
 *     bas           #BCBCC4   1,67:1
 *     markis        #ADADB5   1,98:1
 *     dorr          #9E9EA7   2,36:1
 */
export const TONER = {
  fasad: '#D0D0D8',
  'markis-ljus': '#C6C6CE',
  bas: '#BCBCC4',
  markis: '#ADADB5',
  dorr: '#9E9EA7',
} as const;

export type Ton = keyof typeof TONER;

export interface Form {
  /** Tonen, alltså CSS-klassen `m-<ton>` och fill-värdet i data-URI:n. */
  ton: Ton;
  d: string;
  /** Sant på ringar, alltså den enda form som har ett hål. */
  evenodd?: boolean;
}

/**
 * MARKLINJEN, gemensam för varje motiv och alltid sist i ritordningen.
 *
 * Bredare än allt annat, så att figuren står PÅ något i stället för att sluta
 * i luften. Samma tal som markisen redan bär: x 7..41, y 39,4, höjd 1,8,
 * radie 0,9. Skriven som en path och inte som ett <rect>, så att varje motiv
 * är en lista av samma sorts form.
 */
const BAS: Form = {
  ton: 'bas',
  d: 'M7.9 39.4h32.2a.9.9 0 0 1 0 1.8H7.9a.9.9 0 0 1 0-1.8z',
};

/**
 * MARKISEN, ÄGARENS VAL 2026-08-27 OCH OFÖRÄNDRAD.
 *
 * "kör på illustret utan kontur (b)". Formerna är kopierade tecken för tecken
 * ur Bildyta.astro och får inte ritas om här: det är samma ritning på tre
 * ställen, och den dagen de tre glider isär är det den här noten som ska ha
 * sagt varför.
 *
 * Den bär restaurangerna, alltså 5 356 av 13 692 rader med koordinat, 39,1
 * procent. Den är också reserven för de 155 rader vars kategori är okänd.
 */
const MARKIS: Form[] = [
  { ton: 'fasad', d: 'M12 12h24v28H12z' },
  { ton: 'markis', d: 'M8 20 L12 12 L20 12 L18.667 20a5.333 5.333 0 0 1-10.667 0z' },
  { ton: 'markis-ljus', d: 'M18.667 20 L20 12 L28 12 L29.333 20a5.333 5.333 0 0 1-10.667 0z' },
  { ton: 'markis', d: 'M29.333 20 L28 12 L36 12 L40 20a5.333 5.333 0 0 1-10.667 0z' },
  { ton: 'dorr', d: 'M19 29h10v11H19z' },
  BAS,
];

/**
 * BUTIKEN: skyltbandet och skyltfönstret. 1 871 rader, 13,7 procent.
 *
 * Samma front som markisen, med två skillnader och båda är avsiktliga:
 *
 *   ÖVERKANTEN ÄR RAK OCH GRUND. Bandet är 5 enheter djupt mot markisens 13,
 *   och skjuter ut 2 enheter åt vardera hållet mot markisens 4. Siluetten blir
 *   en tunn rak axel mot markisens djupa vågiga, alltså skiljer de sig i BÅDE
 *   form och massa. Vågens djup är 5,333 enheter, alltså 4,9 px i den
 *   kompakta formen, och det är sådant man ser bara om något ligger bredvid.
 *   Två skillnader i stället för en är därför inte överflöd.
 *
 *   MASSAN I NEDRE HALVAN LIGGER NER. Ett skyltfönster på 20 x 11 enheter mot
 *   markisens dörr på 10 x 11: lika hög, dubbelt så bred. I den kompakta
 *   formen är det 18,3 px mot 9,2, och det är den skillnad som bär motivet
 *   när bandet uppe blir svårt att skilja.
 *
 * Den ljusa remsan överst i glaset är 4 enheter, alltså 3,7 px i den kompakta
 * formen. Den är motivets volym, samma roll som markisens ljusa mittkappa:
 * utan den är fönstret en platt mörk rektangel.
 */
const BUTIK: Form[] = [
  { ton: 'fasad', d: 'M11 17h26v23H11z' },
  { ton: 'markis', d: 'M9 12h30v5H9z' },
  { ton: 'dorr', d: 'M14 22h20v11H14z' },
  { ton: 'markis-ljus', d: 'M14 22h20v4H14z' },
  BAS,
];

/**
 * SKOLAN OCH OMSORGEN: sadeltaket. 2 837 rader, 20,7 procent.
 *
 * KATEGORIN ÄR "Skolor och omsorg" OCH INTE "Skolor". Den rymmer förskolor,
 * skolor, äldreboenden och annan omsorg, och det utesluter varje motiv som
 * bara handlar om undervisning: en bok, en studentmössa, en griffeltavla. Ett
 * äldreboende är inte en skola, och en studentmössa på ett äldreboende är
 * fel på ett sätt som syns.
 *
 * Kvar står byggnaden som är gemensam för hela kategorin, alltså den lilla
 * institutionen: sadeltak, fönster på båda sidor om en mittdörr.
 *
 * TAKET ÄR MOTIVETS HELA SKILLNAD och det är därför det är det bredaste
 * elementet, x 7..41, alltså precis bläckets tillåtna bredd. En triangel går
 * inte att förväxla med ett utsprång.
 *
 * Taket är delat i två toner vid nocken, den vänstra mörkare. Det är samma
 * ljus som markisens ljusa mittkappa påstår, alltså ljus uppifrån höger, och
 * det kostar noll extra former.
 *
 * TRE MÖRKA FORMER I NEDRE HALVAN, den mittersta högre och bredare. Fönstren
 * är 5 enheter breda med 3 enheters mellanrum, alltså 4,6 px och 2,8 px i den
 * kompakta formen. Under det blir en fönsterrad ett raster i stället för
 * fönster, och det är därför fasaden är 28 enheter bred här och 24 i markisen:
 * tre former behöver mer mellanrum än en.
 */
const SKOLA: Form[] = [
  { ton: 'markis', d: 'M7 22.5 L24 12 L24 22.5z' },
  { ton: 'markis-ljus', d: 'M24 12 L41 22.5 L24 22.5z' },
  { ton: 'fasad', d: 'M10 22.5h28v17.5H10z' },
  { ton: 'dorr', d: 'M13 26h5v5h-5zM21 26h6v14h-6zM30 26h5v5h-5z' },
  BAS,
];

/**
 * ÖVRIGT: sågtandstaket. 2 002 rader, 14,6 procent.
 *
 * Kategorins egen text säger vad den är: "Tillverkare, grossister, lager och
 * annat du inte besöker". Sågtandstaket är den byggnaden, och det är den enda
 * takform i uppsättningen som ingen förväxlar med ett hus.
 *
 * TRE TÄNDER OCH INTE FYRA, av exakt samma skäl som markisen har tre kappor:
 * en tand är 9,333 av 48, alltså 8,6 px i den kompakta formen. Fyra hade gett
 * 6,4 och fem 5,2, och under omkring 6 px slutar en spets vara en spets.
 *
 * MITTENTANDEN ÄR LJUSARE ÄN YTTERTÄNDERNA, alltså exakt markisens rytm. Det
 * är avsiktligt: de två motiven som bär tre upprepade former ska bära dem på
 * samma sätt, annars ser uppsättningen slumpad ut.
 *
 * Lastporten är 16 enheter bred, alltså bredare än varje annan öppning i
 * uppsättningen. En byggnad man kör in i och inte går in i.
 */
const OVRIGT: Form[] = [
  { ton: 'fasad', d: 'M10 20h28v20H10z' },
  { ton: 'markis', d: 'M10 20 L19.333 13 L19.333 20z' },
  { ton: 'markis-ljus', d: 'M19.333 20 L28.667 13 L28.667 20z' },
  { ton: 'markis', d: 'M28.667 20 L38 13 L38 20z' },
  { ton: 'dorr', d: 'M16 26h16v14H16z' },
  BAS,
];

/**
 * CAFÉET, FÖRSLAG 1: koppen. 1 471 rader, 10,7 procent.
 *
 * DET HÄR ÄR UPPSÄTTNINGENS ENDA FÖREMÅL OCH DET SKA STÅ SKRIVET. De fyra
 * andra är fronter man går fram till; den här är en kopp på ett fat. Skälet är
 * att caféet saknar egen arkitektur: ett kafé har markis precis som en
 * restaurang, och de två kategorierna hade blivit samma bild.
 *
 * Priset är att ett rutnät med tolv rader bär elva byggnader och en kopp, och
 * det syns. Vinsten är att den är den enda ritningen i hela uppsättningen som
 * ingen behöver jämföra för att läsa: en rund siluett med ett öra bland fyra
 * kantiga fronter.
 *
 * FÖRSLAG 2 nedan är det arkitektoniska alternativet, och det tredje utfallet
 * är att caféet behåller markisen. Ägaren väljer på bild.
 *
 * Örat är en ring med centrum (33, 25), ytterradie 6,5 och innerradie 2,5,
 * alltså 4 enheters gods, 3,7 px i den kompakta formen. Ritad FÖRST, så att
 * koppen täcker dess vänstra arm och bara den högra syns. Ytterkanten når
 * x 39,5, alltså innanför bläckets 41.
 */
const CAFE_KOPP: Form[] = [
  {
    ton: 'markis',
    d: 'M33 18.5a6.5 6.5 0 1 1 0 13a6.5 6.5 0 1 1 0-13zM33 22.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z',
    evenodd: true,
  },
  { ton: 'fasad', d: 'M14 13h20l-2.5 22h-15z' },
  { ton: 'dorr', d: 'M14 13h20v4.5H14z' },
  { ton: 'markis-ljus', d: 'M8 35h32l-3 4.4h-26z' },
  BAS,
];

/**
 * CAFÉET, FÖRSLAG 2: valvet.
 *
 * Alternativet som stannar i familjen. En front med rakt skyltband och en
 * VALVAD öppning i stället för en rak dörr, alltså bageriets ugnsmun och den
 * äldre kaféfrontens portal.
 *
 * SVAGHETEN SKA STÅ SKRIVEN. Siluetten är en rektangel, precis som butikens,
 * och hela skillnaden mot butiken ligger i den mörka massans form: ett stående
 * valv på 11 enheter mot en liggande ruta på 20. I 32,6 px bläck är det en
 * verklig skillnad men inte en självklar, och två motiv som måste jämföras för
 * att skiljas är sämre än ett som läses direkt.
 *
 * Den ljusa valvringen är 4,5 enheter i sidled och 6,5 vid hjässan, alltså
 * 4,1 och 6,0 px i den kompakta formen.
 */
const CAFE_VALV: Form[] = [
  { ton: 'fasad', d: 'M12 13h24v27H12z' },
  { ton: 'markis', d: 'M12 13h24v4.5H12z' },
  { ton: 'markis-ljus', d: 'M14 40v-10a10 10 0 0 1 20 0v10z' },
  { ton: 'dorr', d: 'M18.5 40v-8a5.5 5.5 0 0 1 11 0v8z' },
  BAS,
];

/**
 * Uppsättningen som föreslås, med koppen som caféets motiv.
 *
 * `okand` är markisen, alltså dagens ritning: en rad vars kategori vi inte
 * känner ska se ut precis som varje rad gör i dag.
 */
export const MOTIV: Record<MotivNyckel, Form[]> = {
  restaurang: MARKIS,
  cafe: CAFE_KOPP,
  butik: BUTIK,
  skola: SKOLA,
  ovrigt: OVRIGT,
  okand: MARKIS,
};

/** De två utfallen provsidan ställer mot koppen. */
export const CAFE_ALTERNATIV = { valv: CAFE_VALV, markis: MARKIS };

/**
 * Motivet som en fristående SVG-sträng, för kartans data-URI.
 *
 * `viewBox` är flyttad 2,6 enheter ned av samma skäl som i dag: bläckets mitt
 * ligger på y 26,6 och inte på 24, och `background-position: center` centrerar
 * rutan och inte ritningen. Se noten vid `.k-bild` i Karta.astro.
 */
export function motivSvg(former: Form[]): string {
  const paths = former
    .map((f) => {
      const regel = f.evenodd ? " fill-rule='evenodd'" : '';
      return `<path fill='${TONER[f.ton]}'${regel} d='${f.d}'/>`;
    })
    .join('');
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 2.6 48 48'>${paths}</svg>`;
}

/**
 * Samma sträng som en data-URI, kodad som den redan står i Karta.astro:
 * bara `<`, `>`, `#` och `"` kodas, eftersom en URI i CSS klarar resten och
 * varje onödigt procenttecken är tre byte i stilmallen.
 */
export function motivDataUri(former: Form[]): string {
  const svg = motivSvg(former)
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/#/g, '%23')
    .replace(/"/g, "'");
  return `url("data:image/svg+xml,${svg}")`;
}

/**
 * Kategorislugen som Karta.astro och Bildyta.astro sätter som `data-kat`.
 *
 * SLUGEN OCH INTE ETT EGET NAMN, och det är hela poängen. Kartans klient har
 * redan kategoriernas ordbok i `KATEGORIER`, byggd ur `TOP_CATEGORIES` och
 * med bygget egna bitar i sig, och den tabellen kan alltså svara på "vilken
 * kategori har den här masken" utan att någon skriver en andra tabell. En
 * andra tabell hade varit ett tal som kan glida isär från det första.
 *
 * `restauranger` saknas med flit: markisen är stilmallens grundvärde, alltså
 * behöver varken den eller en okänd kategori en egen regel. Fyra regler i
 * stället för sex, och de två raderna som inte har en regel är de två som ska
 * rita det som redan står där.
 */
export const MOTIV_PER_SLUG: Record<string, Form[]> = {
  'cafeer-och-bagerier': CAFE_KOPP,
  butiker: BUTIK,
  'skolor-och-omsorg': SKOLA,
  ovrigt: OVRIGT,
};

/** Motivet för en kategorislug, med markisen som fall tillbaka. */
export function motivForSlug(slug: string | null | undefined): Form[] {
  return (slug && MOTIV_PER_SLUG[slug]) || MARKIS;
}
