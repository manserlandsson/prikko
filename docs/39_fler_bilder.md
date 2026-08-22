# 39. Fler bilder, och vilka spår som bar

**Datum:** 2026-08-19
**Föregångare:** `docs/37_osm_taggar.md` §5 byggde de 27 bilderna ur Wikimedia
Commons, utpekade av Wikidata P18 via OSM-taggen `wikidata` och spärrade mot
150 meter. `docs/28_gatubilder.md` är gatubildsspåret som ägaren skrotade.
**Beställning:** ägaren frågade om vi kan få fler bilder än 27, och bad om
mätning i stället för gissning.
**Utfall:** byggt. **27 bilder blir 210**, alla fritt licensierade, alla
belagda på namn OCH avstånd OCH motiv. Ett spår mättes och byggdes INTE, och
skälet står i §4.

---

## 1. Slutsatsen först

1. **Ja, det finns många fler, och de ligger i Wikidata och inte i Commons
   geosökning.** OSM-taggen `wikidata` står på 33 av 3 927 hopparade, och det
   är hela skälet att skörden stannade på 27. Objekten finns ändå: **8 711
   Wikidata-objekt** har både en P18-bild och en koordinat innanför våra tolv
   kommuners lådor. Att leta upp dem på NAMN och KOORDINAT i stället för via
   OSM ger **183 nya bilder**, alltså 210 av 16 047. §3.
2. **Priset för att OSM:s människa försvinner ur kedjan är fyra grindar.**
   Ingen har längre intygat att objektet ÄR stället, så beviset byggs i koden:
   namnen ska vara lika ordmängder, objektets slag ska stå i en
   tillåtelselista, licensen ska vara fri, och verksamhetens namn ska stå i
   filnamnet eller i filens beskrivning. 254 kandidater klarar de två första
   grindarna, 15 av dem har redan en bild via OSM-vägen, och av de 239 som slås
   upp faller 56 på licensen eller på motivet. Varje grind fäller ett eget
   slags fel med ett verkligt exempel bakom sig. §3.2.
3. **Commons geosökning bär inte, och det är inte närheten som fäller den.**
   Det finns 49 305 geotaggade Commons-filer i våra områden och 43 295 av dem
   ligger inom 150 meter av någon verksamhet. Namnkravet skalar ned det till
   76 verksamheter som Wikidata-spåret inte redan når. Men **felet byter
   skepnad i stället för att försvinna**: filerna föreställer rätt PLATS och
   fel SAK. Ett utegym vid Husby gård, en skulptur vid Skärholmens gård, en
   parkeringsplats framför Ica Kvantum. Mellan 4 och 9 procent fel mot under 1
   procent för Wikidata-spåret. Byggs inte. §4.
4. **`brand:wikidata` är fortfarande dött, och ska inte prövas en tredje
   gång.** Den står på 762 OSM-punkter och pekar på KEDJANS objekt. En bild på
   vilken McDonald's som helst är inte en bild på DEN här. §5.
5. **Det skalbara svaret är fortfarande uppladdningarna, och de har hittills
   gett noll bilder från någon utomstående.** Elva bilder finns, alla från
   ägarens eget konto och en bekant, alla från samma dag. Inget är trasigt.
   Ingen har varit på sidan, och den som är där ser aldrig att det GÅR att
   lägga upp en bild: rutan är gömd inuti omdömesformuläret bakom en knapp som
   säger "Skriv ett omdöme". §6.

---

## 2. Nämnaren, och varför den inte är öppettidernas

`docs/37` räknade mot de **9 995 konsumentvända**, alltså restaurang, café och
butik. Det var rätt där, för OSM kartlägger inte ett tillagningskök på en
skola och en matpunkt som inte finns i OSM kan inte paras.

**Här är nämnaren alla 16 047.** Wikidata har skolan, kyrkan, äldreboendet och
förskolan, och en bild av skolhuset på skolkökets sida är en riktig bild av det
stället. 101 av de 183 nya bilderna är just sådana, alltså mer än hälften av
vinsten. Sidmallen behövde ingen ändring: `[kommun]/[slug].astro` visar
`Commonsbild` för varje rad som har ett `image`, oavsett kategori.

Vad som ändå aldrig kan nås:

| | Antal | Andel |
|---|---:|---:|
| Verksamheter | 16 047 | |
| **Utan koordinat, alltså utan spärr att pröva** | **2 431** | 15,1 % |
| Med koordinat på gatunivå (`approximate`) | 237 | 1,5 % |
| Kvar att pröva | 13 379 | 83,4 % |

De 2 431 är Borgholm (406), Höganäs (316), Lomma (153) och Svenljunga (99),
som saknar koordinat helt, plus 588 i Örebro, 868 i Uppsala och en i
Oskarshamn. Utan koordinat finns ingen spärr att pröva mot, och en bild vi inte
kan pröva är en bild vi inte visar. Det är samma besked som `commons.py` redan
ger när Wikidata-objektet saknar P625.

De 237 med `approximate` hoppas över med avsikt. Koordinaten är härledd till
gatunivå och kan ligga hos grannporten, och då säger 150-metersspärren
ingenting.

---

## 3. Spår 1: Wikidata utan OSM-taggen. BYGGT

### 3.1 Varför det finns något att hämta

Kedjan i `docs/37` §5.4 har ett smalt led, och det är OSM:

```
verksamhet  →  OSM-punkt  →  taggen `wikidata`  →  P18  →  Commons-fil
                             33 av 3 927
```

Taggen `wikidata` är sällsynt i OSM och kommer att förbli det. Men
Wikidata-objektet finns oberoende av om någon skrivit in det i OSM. En fråga
till Wikidatas SPARQL-tjänst, en per kommun, mot kommunens omslutande låda:

```sparql
SERVICE wikibase:box { ?item wdt:P625 ?coord . ... }
?item wdt:P18 ?img .
```

ger **8 711 objekt** med både bild och koordinat i våra tolv lådor. Kedjan blir
kortare och OSM faller bort helt:

```
verksamhet  →  namn + koordinat  →  Wikidata-objekt  →  P18  →  Commons-fil
```

Ingen Overpass-fråga alls. Kommunerna där hopparningen mot OSM är mager
behandlas därmed likadant som Stockholm.

### 3.2 De fyra grindarna, och felet var och en fäller

Priset för att OSM försvinner är att INGEN människa längre har intygat att
objektet är stället. Beviset byggs i stället i `pipeline/prikko/wikidatanamn.py`.
Utfallet av hela trattens skarpa körning 2026-08-19:

| | Antal |
|---|---:|
| Verksamheter | 16 047 |
| Med koordinat som får prövas | 13 379 |
| **Objekt med samma namn, tillåten klass och inom 150 m** | **254** |
| Varav redan har en Commons-bild via OSM-vägen | 15 |
| Faller på licens eller filformat | 5 |
| Kvar med en fritt licensierad fil | 234 |
| Faller på motivet | 51 |
| **Bilder hämtade** | **183** |

**Grind 1: namnen ska vara LIKA ordmängder, inte överlappa.**
`oppettider.names_agree` godtar att den ena ordmängden är en delmängd av den
andra. Det duger mot OSM, där båda namnen är namn på en verksamhet. Det duger
inte här, för Wikidata-objektet kan vara en stadsdel, ett torg eller en gata
som verksamheten bara LÅNAR sitt namn av. Delmängdsregeln gav 531 par. 250 av
dem försvann när kravet skärptes till likhet, och de var genomgående dessa:

| Verksamhet | Objekt | Bilden hade blivit |
|---|---|---|
| Gränna Chokladfabrik | Gränna | `View of Gränna.jpg` |
| Coop Östra Torget 07-5900 | Östra torget | torgbilden |
| Sushi Yama Mitt I City | Mitt i city | köpcentrets fasad |
| Kronans Apotek Drottninggatan | Drottninggatan | gatubilden |
| Max Hamburgerrestaurang Behrn Arena | Behrn Arena | arenan utifrån |

Likheten prövas efter att de generiska orden strukits ur BÅDA namnen, annars
faller "Restaurang Cassi" mot "Cassi" och "Fåfängan Restaurang & Cafe" mot
"Fåfängan".

**Grind 2: objektet ska vara ett slags ting vi godtar.** Likheten räcker inte,
för verksamheten heter ibland precis vad platsen heter. Dessa fem passerade
grind 1 och är alla fel:

| Verksamhet | Objekt | Bilden hade blivit |
|---|---|---|
| Rinkeby Livs | Rinkeby, stadsdel | flygbild från 1988 |
| Hagis Handel | Hagsätra, stadsdel | stadsdelsbilden |
| Gröndal Sushi Kök | Gröndal, spårvagnshållplats | en spårvagn |
| Restaurang Trekanten | Trekanten, hållplats | hållplatsen |
| Restaurang Lövholmen | Lövholmen, gata | gatan |

`ALLOWED_CLASSES` är en **tillåtelselista** av exakt samma skäl som
`commons.FREE_LICENCES` är det: en förbudslista hade behövt känna till varenda
klass Wikidata har, och en okänd klass ska betyda ingen bild och aldrig
"förmodligen ett hus". Gränsen går vid om en bild av tinget rimligen visar
STÄLLET. Ett vattentorn och en väderkvarn står med, för Svampen i Örebro och
Restaurang Skanskvarn ÄR tornet och kvarnen. En park står inte med, för en bild
av en park är en bild av gräs och inte av kaféet i den.

Priset är mätt: elva objekt saknar P31 helt och faller därför, bland dem
Wedholms Fisk och Restaurang Pelikan. Att de faller är samma besked som när
P625 saknas i `commons.within_reach`.

**Grind 3: licensen och formatet.** Oförändrat `commons.lookup`, alltså
Commons egen maskinkod `extmetadata.License` och samma tillåtelselista som
förut. Fem av 239 föll här, fyra på en licenskod vi inte känner igen och en på
att filen är en TIFF-ritning från 1912. Det är precis vad en tillåtelselista
ska göra.

**Grind 4: verksamhetens namn ska stå i filnamnet eller i beskrivningen.** P18
är Wikidatas eget val av bild, men Wikidata har fel ibland, och felet syns inte
i objektets namn. 51 av 234 föll här:

| Verksamhet | Filen P18 pekar på | Vad den föreställer |
|---|---|---|
| Kristinagården | `Kristine kyrka från luften.jpg` | kyrkan intill |
| Sturehof | `Sturegallerian.jpg` | gallerian omkring |
| Dalahöjdens Äldreboende | `Grötlunken 2.JPG` | kvarteret |
| Karla Cafe | `Karla-biografen.jpg` | biografen som lånat namn |
| Tellus Pizza | `Biografen Tellus.jpg` | samma sak igen |

Grinden kostar noll extra anrop: beskrivningen ligger i samma `extmetadata` som
licensen redan hämtas ur. `commons.CommonsImage` bär den nu i fältet
`description`, som ALDRIG visas: bildtexten byggs fortfarande enbart av
`credit_line`.

**De generiska orden räknas MED i grind 4, till skillnad från i grind 1.** Det
är avsiktligt, och det är vad som fäller Karla och Tellus: båda är ställen som
lånat sitt namn av en biograf intill, och det är just orden café och pizza som
skiljer dem åt. Priset är åtta riktiga träffar som faller med dem, bland andra
"Cafe Östasiatiska museet" och "Bonniers Konsthall cafe". Åtta saknade mot två
felaktiga är rätt håll att fela åt.

### 3.3 Vad ögonen såg

Alla 183 lästes rad för rad. Det som återstår är **en** tveksam träff:

- **Filmstaden Sergel → `Hotorget 2008a.jpg`**, 29 meter. Bilden är av Hötorget
  med biografen i, inte av biografen. Beskrivningen säger "Hötorget och
  Filmstaden Sergel i Stockholm", alltså är motivet belagt men inte ensamt.

Tre till förtjänar att nämnas, och alla tre är rätt:

- **Djurgårdsskolan → `Djurgården villa 2007.jpg`.** Skolan ligger i villan.
  Beskrivningen säger det, och det är beskrivningen som släppte igenom den.
- **Globala gymnasiet → `Zinkendammsskolan2010c.JPG`.** Samma hus, gammalt namn.
- **Torpaskolan → `Södra folkskolan Jönköping 02.jpg`.** Detsamma.

Några är historiska, precis som bland de 27: `Apoteket Korpen 1945.jpg`,
`Paraden 1930-tal.jpg`, `Lunnevads Folkhögskola 1949.jpg`. Bildtexten skriver
ut årtalet, vilket är ett ÄRLIGHETSkrav och inte ett licenskrav, se
`commons.year_text`.

### 3.4 Ett litet fel som var värt att laga

Nio riktiga träffar föll först på att Commons klistrar löpnumret direkt på
namnet: `Vikenkyrkan3.JPG`, `Eriksdalsskolan2010c.jpg`,
`Molkomsfolkhögskola1.JPG`. `fold` delar bara på skiljetecken, så
"vikenkyrkan3" blir ETT ord och "vikenkyrkan" står inte i mängden.
`wikidatanamn._ord_i` lägger därför till bokstavsdelen av varje ord som slutar
i siffror, men aldrig siffrorna själva: "Pizzeria 2" och "Pizzeria 4" är olika
ställen på samma gata.

---

## 4. Spår 2: Commons geosökning. MÄTT OCH INTE BYGGT

### 4.1 Vad som mättes

Commons API har `list=geosearch`, som ger filer med koordinat inom en radie.
Det finns långt fler geotaggade bilder än de som råkar vara P18 på ett
Wikidata-objekt. Hela beståndet runt våra verksamheter hämtades: verksamheternas
koordinater lades i ett rutnät om 0,002 grader latitud, och varje ruta frågades
med 320 meters radie, `gslimit=500` och `gsprimary=all`.

| | Antal |
|---|---:|
| Rutor att fråga | 4 152 |
| **Unika geotaggade Commons-filer i våra områden** | **49 305** |
| Filer inom 150 m från minst en verksamhet | 43 295 |
| Par (verksamhet, fil) inom 150 m | 777 973 |

**Närhet ensam är alltså värdelös som belägg.** 777 973 par mot 16 047
verksamheter är 48 filer per verksamhet i snitt, och i Gamla stan är det
hundratals. Det var exakt fällan som skrotade Mapillary, se `docs/28`.

### 4.2 Namnkravet, och vad som blev kvar

Kravet var namn OCH närhet, aldrig närhet ensam, med samma stränghet som
`oppettider.names_agree`:

| | Par | Verksamheter |
|---|---:|---:|
| Inom 150 m | 777 973 | 13 379 |
| Verksamhetens namn står i filnamnet | 1 843 | 337 |
| varav på ett ensamt huvudord | 1 360 | |
| varav på minst två distinkta ord | 483 | 154 |
| Namnet INLEDER dessutom filnamnet | 376 | 135 |
| **Som Wikidata-spåret inte redan når** | | **76** |

Det ensamma huvudordet visade sig vara oanvändbart här och inte bara svagt.
"The-huset" parades med `PK-huset, höst.JPG` och "Restaurang Ulva" med
`Ulva kvarn Fyrisån, juli 2022a.jpg`. Kravet att namnet ska INLEDA filnamnet
kom av att en fil som bara NÄMNER stället nästan aldrig föreställer det:
`Man smoking at the entrance to the Lady Hamilton Hotel`,
`Julgran utanför Hotel Reisen`, `Hyenorna vid Stureplan 1`.

### 4.3 Varför det ändå inte byggs

De 76 lästes rad för rad. Felet har inte försvunnit, det har **bytt skepnad**:
filen föreställer rätt PLATS och fel SAK.

| Verksamhet | Filen | Vad den föreställer |
|---|---|---|
| Husby Gård Cafe | `Husby gård utegym 2025.jpg` | ett utegym |
| Skärholmens Gård | `Skärholmens gård, skulptur, 2019.jpg` | en skulptur |
| Skärholmens gård AB | samma fil | samma skulptur |
| Ica Kvantum Värtan | `Стоянка перед магазином ICA Kvantum…` | parkeringsplatsen |
| Apoteket Falken | `Apoteket Falken, skylt.JPG` | en skylt |
| Restaurang Birger Jarls torg | `Birger Jarls Torg, Gamla Stan…` | torget |
| Norra Sanna Bageri | `Norra Sanna 105 Karlstad…` | ett hus vid adressen |

**Tre är klart fel och fyra är tveksamma: mellan 4 och 9 procent av 76.**
Wikidata-spåret ligger på under 1 procent av 183. Skillnaden är strukturell och
går inte att regla bort: **Commons har ingen markering för "det här är BILDEN
på det stället". P18 är precis den markeringen**, alltså en människa som valt,
och det är hela skälet att spår 1 bär och spår 2 inte gör det.

Skärper man till att inget annat än siffror får följa namnet i filnamnet blir
det 34 verksamheter kvar och en tveksam (Birger Jarls torg). 34 bilder mot 4 152
extra anrop mot Commons, en andra skördepipeline att underhålla och en regel
vars beteende på ny data ingen har sett. **Det är inte värt det, och en enda
felaktig bild på en namngiven verksamhet är värre än hundra saknade.**

Filerna är fritt licensierade i samma utsträckning som de andra, så det är
inte licensen som fäller spåret den här gången. Det är motivet.

---

## 5. Spår 3: `brand:wikidata`. PRÖVA INTE IGEN

`brand:wikidata` står på **762** av de 3 927 hopparade OSM-punkterna, alltså
23 gånger fler än `wikidata`. Det ser ut som den stora skörden och är det inte.

Taggen pekar på **kedjans** objekt: McDonald's Corporation, Espresso House,
Pressbyrån. P18 på ett sådant objekt är kedjans logotyp eller ett godtyckligt
kontor någonstans i världen. En bild på vilken McDonald's som helst är inte en
bild på DEN här, och felet ser rätt ut hela vägen: id:t finns, objektet finns,
bilden finns, licensen är fri.

Nyckeln står därför ensam i konstanten `oppettider.WIKIDATA_KEY` i stället för
i en tupel som `_PHONE_KEYS`, just för att en tupel bjuder in nästa läsare att
lägga till en till. Den här är tredje gången spåret avfärdas. Det finns ingen
variant av det som bär.

---

## 6. Det andra svaret: uppladdningarna

### 6.1 Vad som faktiskt kommit in

Båda vägarna är byggda. Besökarens går genom `community.image_uploads` och
`Bilder.astro`; verksamhetens genom `community.business_images`,
`Foretagsbilder.astro` och företagsytan. Räknat i databasen 2026-08-19:

| Tabell | Rader | Läge |
|---|---:|---|
| `public.images` | 27 | alla `wikimedia`, alltså pipelinens egna |
| `community.image_uploads` | 11 | alla publicerade |
| `community.business_images` | 2 | båda väntar på granskning |
| `community.establishment_claims` | 3 | 2 godkända, 1 avslaget |
| `community.verification_letters` | 0 | inget brev har någonsin skickats |
| `community.reviews` | 18 | alla publicerade |

De elva besökarbilderna kommer från **två konton**, ägarens eget och en bekants,
gäller **fem verksamheter** och laddades upp **samma dag, 2026-08-07**.

**Noll bilder har kommit från någon som inte fick länken av ägaren.** Kedjan
fungerar hela vägen, från formulär till hink till granskningskö till publicerad
vy. Det är inte tekniken som saknas.

### 6.2 Vad som hindrar fler, i ordning efter hur mycket det kostar att laga

**1. Ingen vet att det går, för sidan säger det aldrig.** `Bilder.astro` är
dold när det inte finns någon bild, vilket är rätt för formen och fatalt för
tillväxten: 16 020 av 16 047 sidor har ingen bild, alltså är avsnittet dolt på
99,8 procent av sajten och nämner aldrig att en bild går att lämna. Vägen in
går i stället genom en knapp som säger **"Skriv ett omdöme"**. Bildfältet
ligger inuti det formuläret. Etiketten "Lägg till bild" finns i koden men visas
bara för den som REDAN skrivit ett omdöme om just det stället, alltså för 18
personer i hela landet.

**2. Det kräver inloggning innan man ser vad man får ut.** Rutan öppnar
inloggningsrutan först. Det är rätt av tre skäl som redan står i
`schema_community.sql`, och det ska inte ändras. Men det betyder att avståndet
från "jag har ett foto" till "det är uppladdat" är: hitta knappen som handlar
om något annat, logga in med magisk länk, byta till mejlen, tillbaka, välja fil,
kryssa i rättighetsrutan, skicka, vänta på granskning.

**3. Företagsvägen kräver ett brev.** En verksamhet måste skapa konto, göra
anspråk, få ett verifieringsbrev på posten, lösa in koden och sedan ladda upp.
Noll brev har skickats. De två väntande `business_images`-raderna ligger bakom
den kön.

### 6.3 Vad som skulle behöva ändras, med tal

Det här är mätt och redovisat, inte byggt. Ägaren avgör.

1. **En egen ingång för bilden, vid sidan av omdömesknappen.** Ordet "bild" ska
   stå på sidan även när det inte finns någon. Det rör `Handlingsrad.astro`
   eller `ActionPanel`, alltså 16 047 sidor, och det är den enda ändringen som
   ändrar nämnaren från 18 till alla besökare.
2. **Avsnittet ska inte vara helt tomt när det är tomt.** Booli-formen säger
   att bilderna bär sig själva, och den är rätt när det finns bilder. Med noll
   bilder på 99,8 procent av sidorna är en tyst yta ingen form utan en gömma.
3. **Kostnaden att inte göra något är känd och den är noll i dag**, för det
   finns ingen trafik. Sajten är inte lanserad, det finns 18 omdömen och 8
   konton, varav 4 är ägarens egna eller provkonton. **Uppladdningsvägen kan
   inte mätas förrän det finns besökare**, och att bygga om den innan dess är
   att gissa om vad som hindrar folk vi ännu inte haft.

Det är också svaret på frågan i beställningen: **det är inte att uppmaningen är
otydlig, och inte att det kräver inloggning. Det är att ingen har varit här.**
Det som ändå går att göra i förväg är punkt 1, för den kostar en knapp och
rättar ett fel som är sant oavsett trafik: en funktion som bara syns för den
som redan använt en annan funktion är inte en väg in.

---

## 7. Vad som byggdes, och hur det körs om

| Fil | Vad |
|---|---|
| `pipeline/prikko/wikidatanamn.py` | Lådfrågan, de fyra grindarna, rutnätet |
| `pipeline/prikko/commons.py` | `description` på `CommonsImage`, `store_image` bruten ur `capture` |
| `pipeline/hamta_commonsbilder.py` | `--namnspar` och `process_namnspar` |
| `pipeline/tests/test_wikidatanamn.py` | 40 prov, varje fall hämtat ur körningen |

```sh
# mäter, hämtar ingenting, skriver ingenting
python3 pipeline/hamta_commonsbilder.py --namnspar --matt site/src/data/*.json

# skarpt
set -a && . ~/.prikko-env && set +a
python3 pipeline/hamta_commonsbilder.py --namnspar site/src/data/*.json
```

`--matt` skriver ut varje träff med avstånd och Q-nummer, och varje fall som
faller med skälet. Det är den listan som ska läsas med ögonen innan en skarp
körning, och det är så de 183 granskades.

OSM-vägen är oförändrad och körs utan `--namnspar` som förut. **De två vägarna
krockar inte:** en verksamhet som redan har en `wikimedia`-bild hoppas över av
namnspåret, för OSM-vägens bild är belagd av en människa i OSM OCH en i
Wikidata, medan namnspårets bara är belagd på namnet. 15 verksamheter hoppades
över på den grunden.

**Vad det kostar i filer: noll.** Bilderna ligger i objektlagringen och aldrig i
bygget, se `prikko/imagestore.py`. Grinden i `site/astro.config.mjs` fäller vid
19 500 filer.

**Vad det kostar i anrop:** 24 frågor till Wikidatas SPARQL-tjänst, alltså två
per kommun, plus ett `extmetadata`-anrop per kandidat och en hämtning per bild.
Hela riket blev 24 + 239 + 183 anrop. Ingenting behöver cachas och ingenting
behöver köras ofta.

---

## 8. Efterskrift 2026-08-22: beskrivningsgrinden, lådedelningen och motivet

Tre saker tillkom när skörden kördes skarpt och startsidan skulle visa
bilderna. De hör ihop och står därför samlade.

### 8.1 Beskrivningen som tredje väg förbi P31

`ALLOWED_CLASSES` fäller ett objekt utan P31, och det kostade riktiga träffar:
Rolfs kök, Restaurang Kvarnen och Skärholmens gård saknar alla klass.
`UTAN_P31_MAX_M = 40` släppte igenom dem på avstånd i stället.

Mätt över alla tolv kommunerna finns **15 namnlika par utan P31 inom en
kilometer, och bara sex bär en svensk beskrivning alls**. Beskrivningen lades
till i lådfrågan och prövades som grind:

| Gräns | Par inom | Passerar | Nya utöver 40 m |
|---|---|---|---|
| 40 m | 10 | 5 | 0 |
| 80 m | 11 | 6 | 1 |
| 150 m | 12 | 6 | 1 |
| 500 m | 14 | 6 | 1 |

Hela vinsten är **en** träff: Hägerstensåsens Skola mot Q31866510 på 75,4 m,
"skola i Hägerstensåsen, Stockholm". Nästa par som passerar ligger bortom en
kilometer, så grinden ger identiskt utfall från 76 m till 1 000 m.

**Grinden ersätter INTE avståndsregeln.** Rolfs kök har varken P31 eller
beskrivning, och fyra av tio par inom 40 m är av den sorten. En beskrivningsgrind
i stället för `UTAN_P31_MAX_M` hade kostat tre av fem bilder.

De två fällorna, Gamla Östberga på 321 m och Långpannan på 520 m, faller på
FRÅNVARO och inte på ordet stadsdel: den ena har bara en engelsk beskrivning,
den andra ingen alls. Ordlistan är en tillåtelselista, så en påhittad "stadsdel
i Stockholms kommun" faller också.

### 8.2 WDQS klipper strömmen på täta lådor

Stockholms lådfråga gav **917 504 bytes, alltså jämnt 896 KiB**, med sista
strängen oavslutad. Uppsala gav 940 965 bytes helt. Det är alltså ingen
storleksgräns: tjänsten strömmar resultatet och slår i sin egen tidsgräns mitt
i utskicket, varpå förbindelsen stängs på en jämn buffertkant.

De fem inbyggda omförsöken i `_ask` hjälper inte, för frågan tar lika lång tid
varje gång: fem försök i rad föll på exakt samma teckenposition.

`objects_in_box` fångar därför `AvhuggetSvar` och delar lådan i fyra
kvadranter, rekursivt till `MAX_DELNINGAR = 3`. Objekt slås ihop på qid med
union av punkter, klasser och alias, precis som slingan gör inom en fråga.
Stockholm ger då **5 865 objekt på 20 sekunder**. Tre prov i
`test_wikidatanamn.py` täcker delningen, sammanslagningen och taket.

### 8.3 Vad bilden visar är ett BEDÖMT fält

Ägaren 2026-08-22: "restaurangerna med bilder på restaurangen istället för ett
stort palats vill vi visa långt uppe i populära lista."

Ingenting i datan svarar på det. `amenity=restaurant` sitter på både Riche och
Operakällaren. En namnregel provades och **hade fel om sex av trettiotre**:
Herrängens Gård är en krog med skylten i bild, Wedholms Fisk ett hörnhus där
krogen knappt syns, och Hasselbacken bär inget byggnadsord alls trots att
bilden är ett rosa palats med staty framför.

Varje bild öppnades därför och sågs på. `site/src/lib/bildmotiv.data.json` bär
189 rader med `motiv` och en mening om vad bilden faktiskt visar:

| motiv | antal | vad |
|---|---|---|
| `stallet` | 66 | fasad med skylt, entré, uteservering, matsal, disk, bar |
| `byggnad` | 115 | hus, palats, museum, kyrka, arena på håll, flygbild, vy |
| `annat` | 8 | maträtt, logotyp, porträtt, karta, enbart en skylt |

Fältet styr ORDNING på startsidan och ingenting annat, se `bildrang` i
`site/src/pages/index.astro`. Ett obedömt ställe hamnar i mitten om OSM säger
matplats, aldrig överst, så en ny bild kan inte smyga sig upp innan någon
tittat på den.

Kalibreringsval värda att minnas: fartyg blev `byggnad` när bilden är en
hamnvy utan servering; herrgårdar med enstaka utemöbler blev `byggnad`;
hotellobbyer och salonger räknades som tydlig interiör och alltså `stallet`.

### 8.4 Fällan i mappen

`site/src/data/*.json` är ett glob, och globet fångar allt som ligger där.
Bedömningsfilen lades först i den mappen, är en lista och inte ett
kommunobjekt, och fällde en skarp körning på `payload["municipality"]`. Filen
ligger nu i `site/src/lib/`, och `ar_kommunfiler` i
`pipeline/hamta_commonsbilder.py` känner igen en kommunfil på FORMEN och inte
på sökvägen. Nästa fil någon lägger i den mappen ska inte kunna fälla en
körning som skriver skarpt.
