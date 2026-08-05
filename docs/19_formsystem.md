# 19. Formsystem: bredder, rubriker och sektioner

Reglerna finns för att formen inte ska glida isär igen. De gäller varje
sidmall och varje komponent i `site/src`.

Bakgrunden är en mätning, inte ett tycke. Ägaren såg problemet först:
"bredden på hemsidan är väldigt annorlunda hela tiden." När sajten mättes
sida för sida stämde det. Sju innehållsbredder och sex h1-grader, nästan
alla skrivna som tal i sidmallarna trots att tokens fanns.

Referensen är booli.se, mätt i webbläsaren över sex sidtyper: startsidan,
sökresultatet med karta, en objektsida, en föreningssida med mycket data,
en artikel och räntekartan. Alla siffror nedan är uppmätta värden, inga
uppskattningar.

## De två reglerna

1. **Skriv aldrig en bredd eller en grad som tal i en sidmall.** Alla bor i
   `site/src/styles/tokens.css`.
2. **Saknas nivån du behöver finns den inte, och då läggs den i tokens.**
   Den skrivs inte lokalt "bara den här gången". Det är precis så de sju
   bredderna uppstod.

## Vad Booli faktiskt gör

### Bredder

| Roll | Booli | Uppmätt på |
|---|---|---|
| Helbredd | 1440 (hela fönstret) | räntekartan, sökresultatets karta |
| Sidbehållare | 980 | startsida, objektsida, föreningssida, artikel |
| Listspalt | 688 | sökresultatet |
| Brödtext | 620 | artikeln |

Tre bredder plus helbredd, på hela sajten. Sidbehållaren är 980 på varenda
sidtyp utom kartan. Sidmarginalen i mobil är 16 px överallt.

### Typografi

Instrument Sans hos oss, sbabFont hos dem, men skalan är det intressanta.
Uppmätt i px, grad/radhöjd/vikt:

| Nivå | Desktop | Mobil |
|---|---|---|
| Sidtitel, läsesida | 48/62,4/600 | 40/52/600 |
| Marknadsföringspåstående | 40/52/600 | oförändrad |
| Sidtitel, objektsida | 32/43,2/600 | oförändrad |
| Sektionsrubrik | 24/32,4/600 | 20/26/600 |
| Underrubrik | 18/24,3/600 | oförändrad |
| Kortrubrik | 16/21,6/600 | oförändrad |
| Brödtext | 16/24/400 | oförändrad |
| Artikelbrödtext | 18/27/400 | oförändrad |
| Metatext | 14/24/400 | oförändrad |
| Kontrolletikett | 14/18,9/600 | oförändrad |
| Mikrotext | 12/16/400 | oförändrad |

Tre saker att ta med sig:

- **Radhöjden följer två tal.** Rubriker ligger på ungefär 1,35 och sjunker
  till 1,30 vid 40 px och uppåt. Brödtext ligger på 1,5. Inget däremellan.
- **Varje rubrik har vikt 600.** Inte en enda undantag på någon sidtyp. Det
  är en stor del av varför deras sidor läser som samma produkt.
- **Bara de två översta graderna krymper i mobil.** Brödtext, kortrubriker
  och etiketter står still hela vägen ner.

Booli delar dessutom sina titlar efter sidans ärende, inte efter mallen:
48 på en sida man läser, 32 på en sida man slår upp. På sökresultatsidan
går de så långt att h1 renderas i 14 px, alltså som apphuvud och inte som
titel.

### Färg

Uppmätt antal textfärger per sida, på fyra sidtyper: 3, 5, 3 och 4. På
föreningssidan användes exakt två, `#1A1A1A` och vitt.

| Roll | Värde | Förekomster |
|---|---|---|
| Bläck | `#1A1A1A` | 110 till 690 element per sida |
| Tyst text | `#767676` | 1 till 42 |
| Accent (orange) | `#FF610D` | 1 till 4 per sida |
| Hårlinje | `#E6E6E6` | 15 till 66 |
| Kontrollkant | `#CCCCCC` | 4 till 39 |
| Fyllnadsgrå | `#F0F0F0` | 89 till 144 |

Accentfärgen förekommer alltså en till fyra gånger på en hel sida. Den bär
aldrig dekor; den märker ut en aktiv flik eller en asterisk.

### Kort, sektioner och kartkontroller

- **Radie 4 px.** 209 element på sökresultatsidan, 88 på objektsidan. Bilder
  får 6 px, piller 9999. Radie 12 förekom en gång på hela sajten.
- **Träffkorten är inga kort.** Uppmätt på sökresultatsidan: genomskinlig
  bakgrund, ingen ram, ingen skugga, radie 0, padding 24. Bara miniatyren
  har radie. Raderna hålls isär av hårlinjer och luft.
- **Sektioner skiljs av en 1 px `#E6E6E6` och 32 respektive 64 px luft.**
  Aldrig av en ruta.
- **Datatabeller** har radhöjd 57 px och en hårlinje under varje rad. Ingen
  zebra, ingen ram runt tabellen.
- **Kartkontrollerna** (Fullskärm, Kartval) är `#1A1A1A` fyllning, 2 px kant
  i samma färg, vit text 14/600, radie 4, höjd 44, padding 8. Alltså inte
  piller, och inte en ljus knapp på mörk karta.
- **Mellanrum** följer 4 och 8: 8 och 16 dominerar, 24 och 32 bär avstånd
  inom en sektion, 64 mellan sektioner.

## Vad Prikko hade, mätt

Uppmätt i webbläsaren på tolv sidor i 1440 och 390 px bredd, före ändringen.

### Bredder: sju

| Sida | Före | Efter |
|---|---|---|
| Kartan | 1400 | `--w-full` (1400) |
| Startsidan, kommun, verksamhet | 1080 | `--w-wide` (1080) |
| Anmärkningshubben, matsnusk | 820 | `--w-page` (760) |
| Kategorihubben | 780 | `--w-page` (760) |
| Sök | 720 | `--w-page` (760) |
| Verksamhetssidans huvudspalt | 700 | 700 (1080 minus panel och glugg) |
| Textsidor, artiklar, utmärkelser | 680 | `--w-read` (680) |
| 404 | 736 (46rem) | `--w-page` (760) |

Sju blev fyra.

### Rubriker: sex h1-grader

48, 36, 34, 32, 28 och 27 px, plus tre olika mobilsteg i tre olika filer.
Fyrtiotalet ställen definierade om h1, h2 eller h3 lokalt. 42 hårdkodade
`font-size` i px låg i 32 filer.

| Sidtyp | Före | Efter |
|---|---|---|
| Textsidor, artiklar, rapporter, utmärkelser, metodik, källor | 36/40 och 36/42 | `--fs-display` 40/46 |
| Sök, kommun, verksamhet, matsnusk, anmärkningshubb, konto | 34/38 och 34/40 | `--fs-title` 32/38 |
| Kategorihubben | 32/36 | `--fs-title` 32/38 |
| Startsidans hero | 48/54 serif | oförändrad, se undantag |
| Kartan | 21/25 | oförändrad, se undantag |

Mobilstegen 27/32, 27/31 och 28/32 låg i tre filer och är borta. Steget
sker nu i en enda mediafråga i tokens.

Kvar av px-literaler är fem, alla motiverade: sökfältets 16 px (iOS zoomar
in på mindre fält och zoomar aldrig ut igen), stjärnbetygens 14 och 15 px
(glyfmått, inte textgrad), kartans 10 och 11 px attributionstext.

## Skalan

Grad och radhöjd hämtas alltid tillsammans. De hör ihop.

| Token | Värde | Används till |
|---|---|---|
| `--fs-hero` | 48/54 | startsidans serifrubrik, bara där |
| `--fs-display` | 40/46 (mobil 32/38) | titel på en sida man LÄSER |
| `--fs-title` | 32/38 (mobil 27/32) | titel på en sida man SLÅR UPP |
| `--fs-h` | 24/28 | sektionsrubrik |
| `--fs-h-s` | 21/25 | underrubrik, och hetsiffran i statistikblock |
| `--fs-h-xs` | 17/22 | kort- och panelrubrik |
| `--fs-body` | 17/26 | brödtext |
| `--fs-body-s` | 14/20 | metatext, kontrolletiketter |
| `--fs-caption` | 13/18 | bildtext, smulor |
| `--fs-eyebrow` | 12/16 | ögonbryn, versalt |
| `--fs-micro` | 11/15 | avstånd, fotobyline |

Vikt är 400 eller 600. Aldrig 700, aldrig 500.

### Vilken titel väljer jag?

Frågan är vad besökaren gör på sidan, inte hur mallen ser ut.

- **Läser** hen en sammanhängande text från början till slut? Om, metodik,
  villkor, artiklar, rapporter, utmärkelser. Då `--fs-display`.
- **Slår** hen upp något och skannar? Kommun, verksamhet, sök, matsnusk,
  kategorier, konto. Då `--fs-title`.

Åtta pixlar isär är avsiktligt. 34 och 36 sida vid sida, som sajten hade,
läser inte som två nivåer utan som slarv.

## Bredderna

| Token | Värde | Används till |
|---|---|---|
| `--w-full` | 1400 | kartappen, sajtens enda helskärmsyta |
| `--w-wide` | 1080 | rutnät och hubbar med sidopanel |
| `--w-page` | 760 | enkelspaltiga datasidor: sök, listor, kategorier |
| `--w-read` | 680 | brödtext, aldrig bredare |

`--container` och `--readcol` finns kvar som gamla namn och pekar på
`--w-wide` respektive `--w-read`. Ny kod skriver de nya namnen.

Väljer du fel av de fyra är det en diskussion. Hittar du på en femte är det
ett fel.

Måtten som INTE är sidbredder får stå kvar som tal i komponenten: en
sökpanels 380, ett verktygstips 260, ett kontokorts 460. De är komponentens
egen storlek, inte sidans. Detsamma gäller `ch`-mått som begränsar en
radlängd; de är bättre än px för just det.

## Sektioner och kort

Vi gör redan Booli-greppet på verksamhetssidan och det är förlagan:
huvudkolumnen ligger öppet på sidan, sektionerna skiljs av en hårlinje och
luft, och ingenting är inramat. Sidopanelens paneler ÄR kort, och det är
kontrasten däremellan som gör att panelen läser som verktyg.

- Huvudinnehåll får inte ligga i en ruta. Hårlinje och luft, inget annat.
- En panelrubrik är `--fs-h-xs`. Den låg på `--fs-body-s` och blev då lika
  stor som texten under sig, vilket är ingen rubrik alls.
- En rubrik i huvudkolumnen får aldrig väga mindre än en rubrik i
  sidopanelen. Kommunhubben hade det felet: chipsraden låg på 14 medan
  "Senast kontrollerade" i panelen låg på 17.

## Skillnader mot Booli som är medvetna

Alltså inte att rätta utan att fråga ägaren först.

- **Kortradien.** Booli kör 4 px, vi kör 12 (`--r-card`). Vår radie är ett
  taget beslut och sitter ihop med hela kortsystemet.
- **Brödtexten.** Booli kör 16, vi kör 17. Vår kommer ur bibeln §14.
- **Tre bläcknivåer mot deras två.** Vi har `--text`, `--ink-quiet` och
  `--ink-faint`. Booli klarar sig på två. Den tredje är värd att ifrågasätta
  när någon ändå går igenom färgerna.
- **Bedömningsfärgerna.** Vi har tio färgtokens för bedömningsnivåerna där
  Booli har en accent. De bär betydelse och kan inte skäras ner.

## Undantagen, med skäl

- **Startsidans hero**, `index.astro`: Instrument Serif 48/54 i vikt 400.
  Sajtens enda serif och sajtens enda plats för den. Värdet finns som
  `--fs-hero` i tokens men regeln står kvar i filen, som är låst för
  SEO-arbete. Den som får filen fri pekar om de två raderna.
- **Kartsidans h1** på 21 px. Det är apphuvud, inte sidtitel, och Booli gör
  exakt samma sak: deras h1 på sökresultatsidan renderas i 14 px.
- **Sökfältets 16 px** i `SiteSearch.astro`. Står redan förklarat i filen.

## Sådant som inte hanns med

- `Footer.astro` har `max-width: 34em` på sin beskrivningstext. Filen var
  låst under arbetet. Måttet är en radlängdsbegränsning och inte en
  sidbredd, så det är inte fel, men det bör bli `--w-read` eller ett
  `ch`-mått för konsekvensens skull.
- `index.astro` har 700 och 600 som mått på herokortet och sökfältet. De är
  komponentmått och inte sidbredder, men de är värda ett beslut när filen
  är fri.
