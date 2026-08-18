# 37. Vad mer OpenStreetMap redan gav oss

**Datum:** 2026-08-18
**Föregångare:** `docs/33_oppettider.md` byggde hopparningen mot OSM och tog
öppettiden ur den. Det här dokumentet mäter vad ANNAT som låg i samma svar.
**Beställning:** ägaren såg själv i OSM att en restaurang bär `contact:phone`,
`contact:website` och `email` vid sidan av `opening_hours`, och frågade varför
vi inte visar det. Han hade rätt, och jag hade fel när jag sa att vi saknar
telefon och webbplats.
**Utfall:** byggt. **3 274 av 9 995 konsumentvända verksamheter (32,8 procent)**
får minst ett nytt fält, alltså FLER än de 2 747 som får en öppettid. Inga nya
anrop, inga nya sidor.

---

## 1. Slutsatsen först

1. **Uppgifterna har alltid legat i svaret, och vi slängde dem.**
   Overpass-frågan i `pipeline/prikko/oppettider.py` har alltid bett om
   `out center tags`, alltså HELA taggmängden. `Poi`-klassen behöll
   `opening_hours` och kastade de andra 278 nycklarna. Kostnaden för att sluta
   kasta dem är noll nätanrop. §3.
2. **Skörden är större än öppettidernas.** 3 274 mot 2 747, och skälet är att
   kontakten hänger på HOPPARNINGEN medan öppettiden dessutom kräver att
   OSM-objektet bär ett `opening_hours` vi kan tolka helt. De 1 097
   verksamheter som står som `matched_without_hours` i `docs/33` §3.3 vet vi
   precis vilket OSM-objekt de är. §2.
3. **Ingen täckningsgräns styr vad som visas.** Det var min feltolkning, och
   ägaren rättade den: "har vi datan bara på få så är det fortfarande bättre?
   kan vi visa telefonnummer på 10 av 10000 så är det värt det." §6.
4. **Bilder finns, och svaret jag gav förut var fel.** 27 verksamheter HAR nu
   en fotograferad bild med FRI licens, curerad per objekt och spärrad mot
   avstånd. Ingen av dem kommer ur `image`-taggen, som är ett spår som inte
   bär. Bilderna ligger hos oss och kostar noll filer av taket. §5.
5. **Uppgifterna står som ett kort överst i högerspalten, inte i
   huvudkolumnen.** Spalten är "det man gör", huvudkolumnen är
   kontrollberättelsen, och ett telefonnummer är inte en del av bedömningen.
   "Öppet nu" flyttar däremot INTE dit, och skälet är mätt. §7.1.

---

## 2. Nämnaren, och varför den inte är öppettidernas

Nämnaren är densamma som i `docs/33` §2: de **9 995 konsumentvända**
verksamheterna, alltså restaurang, café och butik enligt
`site/src/lib/categories.ts`. En telefonrad på ett tillagningskök på ett
äldreboende är lika meningslös som en öppettid där, och OSM kartlägger dem
inte heller.

Mellanledet är nytt och det är det som avgör allt nedan:

| | Verksamheter |
|---|---:|
| Konsumentvända | 9 995 |
| Utan koordinat, alltså omöjliga att para | 1 275 |
| **Hopparade med ett OSM-objekt på både namn och närhet** | **3 927** |
| Varav OSM-objektet dessutom bar en tolkbar `opening_hours` | 2 747 |

**De 3 927 är den riktiga nämnaren för allt utom öppettiden.** Skillnaden mot
2 747 är de 1 097 där hopparningen är belagd men OSM-objektet saknar
öppettider. Deras telefonnummer är precis lika belagda som de andras, och att
kräva `opening_hours` för att skriva ut ett telefonnummer hade kastat en
fjärdedel av skörden av ett skäl som inte har med telefon att göra.

Talen i tabellerna nedan står ändå mot **9 995** och inte mot 3 927. Det är
det ärliga talet: det säger hur stor andel av sidorna som faktiskt får raden,
vilket är vad frågan "har vi den här uppgiften" betyder.

---

## 3. Frekvenstabellen, hela

Mätt 2026-08-18 mot samma Overpass-uttag som `docs/33` använde, hämtade
2026-08-17 och cachade i `pipeline/data/interim/`. Uttaget behövde inte hämtas
om: det bar redan alla taggar, och antalet namngivna matpunkter stämmer exakt
med `docs/33` §3 i alla tolv kommunerna (Stockholm 4 631, Linköping 485,
Jönköping 301, och så vidare). Det som drivit sedan dess är vårt EGET
register, från 15 983 till 16 047 rader.

Kolumnen "av 3 927" är andelen av de hopparade, alltså hur ofta OSM bryr sig
om att fylla i fältet. Kolumnen "av 9 995" är andelen av alla konsumentvända,
alltså hur stor del av sidorna som faktiskt får raden.

### 3.1 De taggar beställningen räknade upp

| Tagg | Hopparade med värde | av 3 927 | av 9 995 | Byggd? |
|---|---:|---:|---:|---|
| `contact:phone` | 1 055 | 26,9 % | 10,6 % | ja, slås ihop med `phone` |
| `phone` | 948 | 24,1 % | 9,5 % | ja, slås ihop med `contact:phone` |
| **telefon, sammanslaget** | **2 002** | **51,0 %** | **20,0 %** | **ja** |
| `website` | 1 276 | 32,5 % | 12,8 % | ja, slås ihop |
| `contact:website` | 1 105 | 28,1 % | 11,1 % | ja, slås ihop |
| **webbplats, sammanslaget** | **2 374** | **60,5 %** | **23,7 %** | **ja** (4 trasiga kastas) |
| `contact:email` | 837 | 21,3 % | 8,4 % | ja, slås ihop |
| `email` | 197 | 5,0 % | 2,0 % | ja, slås ihop |
| **e-post, sammanslaget** | **1 027** | **26,2 %** | **10,3 %** | **ja** |
| `cuisine` | 1 674 | 42,6 % | 16,7 % | ja |
| `wheelchair` | 959 | 24,4 % | 9,6 % | ja |
| `outdoor_seating` | 883 | 22,5 % | 8,8 % | ja, 22 oöversättbara kastas |
| `takeaway` | 652 | 16,6 % | 6,5 % | ja |
| `payment:*` | 624 | 15,9 % | 6,2 % | ja, slås ihop till kort och kontant |
| `diet:*` | 562 | 14,3 % | 5,5 % | ja, bara det som erbjuds |
| `brand` | 781 | 19,9 % | 7,8 % | **nej**, se §4 |
| `operator` | 306 | 7,8 % | 3,1 % | **nej**, se §4 |
| `smoking` | 162 | 4,1 % | 1,6 % | ja |
| `internet_access` | 124 | 3,2 % | 1,2 % | ja |
| `delivery` | 47 | 1,2 % | 0,5 % | ja |
| `wikimedia_commons` | 19 | 0,5 % | 0,2 % | se §5 |
| `image` | 2 | 0,05 % | 0,02 % | **nej**, se §5 |

**`image` och `wikimedia_commons` är alltså inte tomma, men de är nästan
tomma, och de två är helt olika saker.** Hela §5 handlar om det.

### 3.2 Övriga taggar på de hopparade

Allt som står på minst åtta av de 3 927. Tabellen finns här så att ingen
behöver mäta om, inte för att allt i den ska byggas.

| Tagg | Antal | av 3 927 | Kommentar |
|---|---:|---:|---|
| `name` | 3 927 | 100,0 % | hopparningen kräver det |
| `amenity` | 3 005 | 76,5 % | vår egen kategori är bättre, se §4 |
| `opening_hours` | 2 830 | 72,1 % | `docs/33`, 2 747 efter syntaxfiltret |
| `check_date` | 1 990 | 50,7 % | när en kartläggare senast var på plats |
| `check_date:opening_hours` | 1 372 | 34,9 % | samma, för öppettiden |
| `addr:street` | 1 103 | 28,1 % | vi har kommunens adress, se §4 |
| `addr:housenumber` | 1 080 | 27,5 % | samma |
| `shop` | 962 | 24,5 % | samma som `amenity` |
| `addr:city` | 862 | 22,0 % | samma |
| `addr:country` | 838 | 21,3 % | |
| `brand:wikidata` | 762 | 19,4 % | kedjans id, inte ställets |
| `addr:postcode` | 762 | 19,4 % | |
| `indoor_seating` | 637 | 16,2 % | "har stolar" är inget besked |
| `payment:cash` | 538 | 13,7 % | ingår i `payment:*` |
| `diet:vegetarian` | 516 | 13,1 % | ingår i `diet:*` |
| `brand:wikipedia` | 374 | 9,5 % | |
| `diet:vegan` | 333 | 8,5 % | ingår i `diet:*` |
| `level` | 328 | 8,4 % | våningsplan i ett köpcentrum |
| `building` | 225 | 5,7 % | |
| `payment:credit_cards` | 192 | 4,9 % | ingår i `payment:*` |
| `payment:debit_cards` | 182 | 4,6 % | ingår i `payment:*` |
| `source` | 99 | 2,5 % | kartläggarens egen källa |
| `toilets` | 93 | 2,4 % | byggd |
| `opening_hours:signed` | 73 | 1,9 % | |
| `contact:instagram` | 73 | 1,9 % | se §4 |
| `drive_through` | 65 | 1,7 % | |
| `toilets:wheelchair` | 59 | 1,5 % | |
| `building:levels` | 58 | 1,5 % | |
| `contact:facebook` | 54 | 1,4 % | se §4 |
| `branch` | 50 | 1,3 % | |
| `website:menu` | 50 | 1,3 % | matsedeln, se §4 |
| `indoor` | 49 | 1,2 % | |
| `check_date:diet:vegetarian` | 49 | 1,2 % | |
| `internet_access:fee` | 41 | 1,0 % | |
| `payment:visa` | 39 | 1,0 % | ingår i `payment:*` |
| `payment:mastercard` | 38 | 1,0 % | ingår i `payment:*` |
| `description` | 37 | 0,9 % | fritext, se §4 |
| `reservation` | 35 | 0,9 % | byggd |
| `bulk_purchase` | 35 | 0,9 % | |
| `healthcare` | 34 | 0,9 % | |
| `room` | 34 | 0,9 % | |
| `wikidata` | 33 | 0,8 % | **bär bilderna, se §5** |
| `air_conditioning` | 33 | 0,8 % | |
| `bar` | 32 | 0,8 % | |
| `website:stock` | 31 | 0,8 % | |
| `diet:gluten_free` | 31 | 0,8 % | ingår i `diet:*` |
| `alt_name` | 28 | 0,7 % | |
| `addr:floor` | 28 | 0,7 % | |
| `capacity` | 27 | 0,7 % | |
| `wikipedia` | 25 | 0,6 % | |
| `changing_table` | 20 | 0,5 % | skötbord |
| `wikimedia_commons` | 19 | 0,5 % | **se §5** |
| `name:sv`, `name:en` | 17, 15 | 0,4 % | vi har redan namnet |
| `old_name` | 17 | 0,4 % | |
| `contact:mobile` | 15 | 0,4 % | ingår i telefon |
| `highchair` | 13 | 0,3 % | barnstol |
| `payment:cards` | 13 | 0,3 % | ingår i `payment:*` |
| `wheelchair:description` | 13 | 0,3 % | fritext |
| `payment:contactless` | 12 | 0,3 % | ingår i `payment:*` |
| `food` | 11 | 0,3 % | |
| `organic` | 10 | 0,3 % | |
| `url` | 9 | 0,2 % | ingår i webbplats |
| `panoramax` | 3 | 0,08 % | **se §5** |
| `photo` | 1 | 0,03 % | **se §5** |

### 3.3 Kvaliteten på värdena

| | Antal | Vad vi gör |
|---|---:|---|
| Telefonnummer i ren `+46`-form | 1 998 av 2 002 (99,8 %) | lagras som bara siffror, se §7 |
| Telefonnummer som lista med semikolon | 4 | första numret tas |
| Telefonnummer som är en URL (`https://91matbar.se/`) | 1 | kastas |
| Webbadresser med `https` | 2 138 av 2 374 | oförändrade |
| Webbadresser med `http` | 232 | oförändrade, se §7 |
| Trasiga webbadresser | 4 | kastas |

De fyra trasiga står ordagrant så i OSM: `www.subway.se`,
`www.pizzatrekronor.se`, `Japanskatorget.com` och `htttp://heylucie.se`. Att
sätta dit ett schema själv hade varit en gissning om huruvida värden svarar
på https, och fyra fall är inte värda den risken.

---

## 4. Vad som mättes och ändå inte byggdes

Ingen av posterna nedan valdes bort för att den är för sällsynt. §6 säger
varför det aldrig är ett skäl. De valdes bort för att uppgiften är fel,
dubblerad eller obegriplig.

| Tagg | Antal | Varför inte |
|---|---:|---|
| `brand`, `operator` | 781, 306 | **Vi har redan kedjan, och bättre.** `site/src/lib/kedjeregister.ts` är byggt på vårt eget bestånd och gäller alla 16 047 raderna, inte de 3 927 hopparade. En andra kedjeuppgift som gäller en femtedel så många hade blivit en andra sanning som glider isär från den första. |
| `addr:*` | ~1 100 | **Kommunens adress är förstahandsuppgiften.** Vi visar den redan. OSM:s adress är en avskrift av samma sak, ibland en annan port. |
| `amenity`, `shop` | 3 005, 962 | **`categories.ts` är sanningen om vad ett ställe är**, och den gäller hela beståndet. Samma skäl som `docs/33` §2.1 gav för att inte skriva av 228 råvärden till Python. |
| `check_date` | 1 990 | Säger när en KARTLÄGGARE var på plats, inte när uppgiften gäller från. Vår egen `checkedAt` säger när VI hämtade den, vilket är det läsaren behöver för att bedöma åldern. Två datum med olika betydelse bredvid varandra är sämre än ett. |
| `indoor_seating` | 637 | "Det finns stolar inne" på en restaurang är inget besked. |
| `description` | 37 | Fritext på blandade språk, oredigerad, av vem som helst. Sidan har redan en redigerad presentationsyta i `Foretagsuppgifter.astro`, och den är verksamhetens egen och släppt fram av redaktionen. |
| `contact:instagram`, `contact:facebook` | 73, 54 | Går att bygga och är inte bortvalt på täckning. De är utelämnade i den här omgången för att en utgående länk till en plattform bär andra frågor än en `tel:`-länk gör, och de bör tas när någon ställer dem. |
| `website:menu` | 50 | Samma. En "Se matsedeln"-länk är en bra idé och en egen beställning. |
| `level`, `building`, `room`, `indoor` | 328, 225, 34, 49 | Beskriver huskroppen, inte verksamheten. |

---

## 5. Bilderna, och svaret jag gav förut var fel

Ägaren har frågat om bilder flera gånger och fått nej. Nejet var fel, men
inte på det sätt frågan ställdes: det är inte `image`-taggen som bär.

### 5.1 `image` bär ingenting, och det är inte en täckningsfråga

**Två av 3 927.** Båda är URL:er till någon annans webbserver:

```
https://neverclosed.se/ws/media-library/…/jonkoping.webp
https://henkas.se/wp-content/uploads/2021/01/cropped-karta2.png
```

Den andra är dessutom en KARTBILD och inte ett foto av stället, vilket
filnamnet säger rakt ut.

**En `image`-tagg är inte en bild vi får visa.** OSM:s taggar ligger under
ODbL, men det gäller DATABASEN, alltså strängen. Bilden den pekar på ligger
på restaurangens egen server under restaurangens egen upphovsrätt, som
förvalt är ensamrätt. Att en URL står i en fritt licensierad databas ger oss
ingen rätt till det som ligger i andra änden. Detsamma gäller `photo`, som
förekommer en gång och pekar på `triton-logo.svg`, alltså en logotyp.

Samma sak om täckningen hade varit tusen i stället för två: **spåret faller
på licensen och inte på antalet.**

### 5.2 Wikimedia Commons är något helt annat, och det bär

`wikimedia_commons` står på 19 hopparade, alla i Stockholm, och alla 19 är
KATEGORIER och inte filnamn (`Category:Den gyldene freden`). En kategori är
en behållare, inte en bild.

De 19 kategorierna innehåller **249 filer**. Alla 249 hämtades och deras
licenser lästes ur Commons egen `extmetadata` 2026-08-18:

| Licens | Filer |
|---|---:|
| CC BY-SA 4.0 | 100 |
| Public domain | 67 |
| CC BY-SA 3.0 | 55 |
| CC BY 2.0 | 16 |
| CC BY 4.0 | 4 |
| CC BY 3.0 | 3 |
| CC0 | 2 |
| CC BY-SA 2.0 | 2 |
| **Icke-fri licens** | **0** |

Alla 249 är JPEG och alla 249 är fritt licensierade. **Det finns alltså inget
licenshinder.** Kravet är attribution: upphovsman, licensnamn och en länk,
vilket är exakt samma sorts krav som ODbL redan ställer på öppettiden.

### 5.3 Vilken bild som är RÄTT bild, och spärren som avgör det

En kategori med 37 filer ger ingen ledtråd om vilken som ska stå överst.
`wikidata`-taggen gör det: **P18 är den bild Wikidata utsett att föreställa
just det objektet.** 30 av de 33 hopparade med en `wikidata`-tagg har en P18.

Men en `wikidata`-tagg kan peka på KEDJAN i stället för stället, och då blir
P18 fel på ett sätt som ser rätt ut. Spärren är därför densamma som
hopparningen redan använder: **Wikidata-objektets egen koordinat (P625) måste
ligga inom 150 meter av OSM-punkten.** Utfall:

| | Antal |
|---|---:|
| Hopparade med `wikidata` | 33 |
| Varav med en P18-bild | 30 |
| **Varav inom 150 meter, alltså användbara** | **27** |
| Faller på spärren | 3 |

De tre som faller är precis de farliga, och det är beviset för att spärren
behövs:

| Verksamhet | Bilden P18 pekar på | Fel |
|---|---|---|
| City Gross | `Apotek Hjärtat öppnar apotek … City Gross Norrköping.jpg` | En annan stad, och ett apotek |
| Stadsmissionens Restaurang | `Linköping med domkyrkan, c. 1900.jpg` | En stadsvy från 1900 |
| Stångs Magasin | `Stångs magasin 4.JPG` | 177 meter bort |

### 5.4 Svaret till ägaren, i tal

**Ja, det finns bilder, och de är fritt licensierade. Det är 27 av 9 995.**

> **2026-08-19: talet är nu 210 av 16 047.** De 27 nedan är de som
> hittas via OSM-taggen `wikidata`, och den vägen står kvar oförändrad.
> 183 till hittas genom att Wikidata frågas på namn och koordinat utan
> att gå via OSM. Se `docs/39_fler_bilder.md`.
Alla 27 ligger i Stockholm utom Ryds Herrgård i Linköping, och de är
genomgående de gamla krogarna: Den Gyldene Freden, Operakällaren, Riche,
Ekstedt, Sturehof, Pelikan, Mäster Anders.

Två förbehåll som hör till svaret och inte ska döljas:

1. **Några är historiska.** `Wirströms, Stora Nygatan 13, sept 1959.jpg`,
   `Restaurang Blå porten ca 1915.jpg` och `Rosendals värdshus, 1966.jpg`
   föreställer rätt ställe fel årtionde. Commons filnamn bär årtalet, så en
   bildtext som skriver ut filens namn och år gör bilden ärlig i stället för
   vilseledande. En bild från 1915 utan årtal är ett påstående om hur det ser
   ut i dag.
2. **Attributionen är inte frivillig.** CC BY och CC BY-SA kräver upphovsman,
   licensnamn och länk VID BILDEN. Det är strängare än ODbL, vars notis knyts
   till hela det producerade verket och därför ryms i sidans källfot: en
   licens som kräver att upphovsmannen anges "på det sätt som är rimligt för
   mediet" kan inte täckas av en rad som talar om sidan.

**Byggt 2026-08-18.** Urvalet är helt bestämt av regler som redan finns i
koden, så det behöver ingen lista att underhålla. `pipeline/prikko/commons.py`
och `pipeline/hamta_commonsbilder.py`:

1. Para verksamheten som vanligt, `pipeline/prikko/oppettider.py`.
2. Läs `wikidata` ur OSM-taggarna. 33 hopparade bär den. Läs ALDRIG
   `brand:wikidata`, som står på 762 och är kedjans objekt.
3. Hämta P18 och P625 ur Wikidata. Faller P18 bort finns ingen bild.
4. Kasta den om P625 ligger mer än 150 meter från OSM-punkten, eller saknas.
   Det är spärren i tabellen ovan, och den fäller tre av trettio.
5. Hämta licens och upphovsman ur Commons `extmetadata` för den fil som blir
   kvar. Licensen läses ur `License`, alltså Commons EGEN maskinkod, och inte
   ur `LicenseShortName`, som är en text för människor och finns i flera
   stavningar. Listan över fria licenser är en TILLÅTELSELISTA: en okänd kod
   betyder ingen bild, aldrig "förmodligen fri".

### 5.4.1 De två val som stod öppna, och hur de föll

**Spegla eller länka.** Bilderna ligger hos oss. Att peka på
`upload.wikimedia.org` för 27 bilder är att lägga vår last på en stiftelses
infrastruktur, och en adress som ändras ger en trasig bild utan att något
bygge klagar. Frågan om vad speglingen kostar av filtaket i `docs/25` hade ett
felaktigt antagande i sig: **den kostar noll filer.** Bilderna ligger i
objektlagringen, samma väg som gatubilderna, och en bild där är ingen fil i
utgåvan. Bygget mätte 17 000 filer med de 27 bilderna på plats, alltså 2 500
kvar till grinden vid 19 500. De 27 väger 4,09 MB tillsammans, i snitt 151 kB,
omskrivna till WebP i 1 024 bildpunkters bredd.

Omskrivningen är inte en förbättring utan ett villkor. Commons originalfiler
bär fotografens EXIF, inklusive GPS, och den ska inte flytta till vår publika
hink. `prepare` i `imagery.py` returnerar originalbytesen oförändrade när
Pillow saknas, vilket är rätt för gatubilderna och fel här, så `commons.capture`
vägrar lagra i stället. Vi hämtar dessutom Commons egen miniatyr och inte
originalet: den bär noll EXIF-taggar redan när den kommer.

**Bildtextens form, och varför den står kvar vid bilden.** Ägaren har sagt att
källan inte ska stå utskriven ute i innehållet. Den regeln följs för
öppettiden, kontakten och närområdet, vars enda attribution numera är en rad i
sidans källfot, se § 7.4. Här bryts den, och skälet är licensen: OSM-data lyder
under ODbL, som knyter sin notis till hela det producerade verket, medan CC BY
och CC BY-SA är avtal med varje enskild FOTOGRAF om ett enskilt verk. 23 av de
27 bilderna bär `AttributionRequired = true` i Commons egna metadata.

En bild kan alltså inte täckas av sidans fot, hur väl den foten än är skriven:
foten säger var sidans uppgifter kommer ifrån, och CC BY-SA vill veta vem som
tog just den här bilden.

CC BY-SA 4.0 avsnitt 3(a)(2) säger att villkoren får uppfyllas "in any
reasonable manner based on the medium, means, and context", och nämner att en
länk till en resurs med uppgifterna kan räcka. En (i)-knapp skulle alltså
formellt kunna duga. **Vår tolkning är strängare**, och den står utskriven i
`site/src/components/Commonsbild.astro`: rimligt prövas mot mediet, och för en
liten bild i en spalt är en synlig bildtext den vedertagna formen och den
Commons själv rekommenderar sina återanvändare.

Bildtexten är två rader:

```
Foto: Holger.Ellgaard, 2013
Wikimedia Commons · CC BY-SA 3.0 · nedskalad
```

Den övre är den mänskliga uppgiften, den undre licensmaskineriet.
"Wikimedia Commons" länkar till filsidan, som är URI:n avsnitt 3(a)(1)(A)(v)
ber om; filsidan och inte bildfilen, för filsidan bär originalet, licensen,
fotografen och hela historiken. "nedskalad" är ändringsangivelsen enligt
3(a)(1)(B), och den gör dessutom länken meningsfull: den som vill ha
originalet vet nu att det finns ett och var. I panelens 268 px blir det två
rader om 15 px, alltså 32 px totalt och ingen radbrytning mitt i ett
fotografnamn.

**En form och inte två, trots att fyra av 27 är public domain och inte kräver
någonting.** De får samma bildtext, av två skäl som inte är juridiska. Årtalet
är ett ÄRLIGHETSkrav och inte ett licenskrav, och tre av de fyra public
domain-bilderna är just de historiska: Wirströms 1959, Blå porten 1912 till
1920, Rosendals värdshus 1966. Och Commons vet vem som tog dem, Lennart af
Petersens och Ingemar Gram; att stryka en fotograf ur bildtexten för att vi
juridiskt får hade gjort de fyra sidorna till de enda utan proveniens.

Årtalet skrivs som ett spann när källan anger ett spann. Commons säger "mellan
1912 och 1920" om Blå porten, och att avrunda det till 1912 vore en precision
vi inte har.

### 5.5 Panoramax

`panoramax` står på tre hopparade och bär bild-id:n i UUID-form. Panoramax är
gatubildsplattformen och dess bilder är fritt licensierade, men tre av 3 927
och en helt egen hämtningsväg är inte samma spår som §5.2. Sajten har
dessutom redan gatubilder, se `docs/28_gatubilder.md`.

---

## 6. Varför ingen täckningsgräns styr vad som visas

Det här stycket är en RÄTTELSE av något jag hade fel om, och det står här för
att nästa person inte ska göra om felet.

Jag läste `docs/33` §7, där ett öppettidsfilter valdes bort för att det i
Jönköping bara hade vetat något om 65 av 712 ställen, och drog av det
slutsatsen att ett fält under några procent inte ska byggas alls. Ägaren
rättade det, ordagrant:

> "har vi datan bara på få så är det fortfarande bättre? kan vi visa
> telefonnummer på 10 av 10000 så är det värt det"

Han har rätt, och skillnaden är den här:

**Ett FILTER som döljer är farligt vid låg täckning.** Det ser auktoritativt
ut, och besökaren kan inte skilja "stängt" från "vi vet inte". Nio av tio
ställen försvinner ur listan och ingen ser att de försvann.

**En VISNING är det inte.** Den som får ett telefonnummer blir hjälpt. Den som
inte får ett ser ingenting alls och är precis lika illa ute som innan. Det
finns ingen nedsida att väga mot.

Tröskeln gäller fortfarande, och bara, för tre saker:

1. **Filter och sortering.** Där döljer låg täckning.
2. **Tal som påstår fullständighet.** "12 av 190 har uteservering" är falskt
   när vi bara känner till uppgiften för 20 av de 190. Skriv aldrig ett sådant
   tal utan att nämnaren är sann.
3. **Listor och toppar.** "Bäst i närheten" över ett fält vi känner till för
   fem procent rangordnar vår datalucka, inte verkligheten.

Därför står `Bordsbokning` på sidan trots att den finns på 30 verksamheter av
9 995. Och därför finns det fortfarande inget filter.

**Saknas uppgiften visas ingenting.** Aldrig en rad som säger att vi inte vet.
Samma dom som `docs/33` §6.1 redan tagit.

---

## 7. Hur det visas

### 7.1 Var kortet står

**Överst i den klibbiga högerspalten, före "Något som inte stämmer?".**
`site/src/components/Kontaktuppgifter.astro`, i ett `.panel` som sidmallen
ritar, alltså samma vita ruta med samma radie och skugga som spaltens andra
kort.

Kortet stod först under öppettiderna i huvudkolumnen, och det var fel.
Högerspalten är "det man gör" och huvudkolumnen är kontrollberättelsen.
Telefon, webbplats och e-post är saker man AGERAR på och inte delar av
bedömningen, alltså hör de hemma i spalten och inte inklämda i berättelsen.
Samma indelning som booli har, se sidmallens egen kommentar.

**"Öppet nu" flyttar INTE hit, och det är viktigt.** Det står vid
verksamhetens namn, dit det flyttades efter att ha mätts till 2 333 px från
rubriken i sitt förra läge. Två skäl att det stannar där:

1. På mobil kollapsar högerspalten till BOTTEN, efter hela huvudkolumnen. Ett
   klockslag där hamnar längre bort från rubriken än det låg innan det
   flyttades, alltså tillbaka till samma fel.
2. "Öppet nu" svarar på "kan jag gå dit nu", vilket avgörs i samma ögonblick
   som man läser namnet. Kontakten svarar på "hur når jag dem", vilket är
   nästa steg. Det är därför kontakten tål att stå längre ned och klockslaget
   inte gör det.

### 7.1.1 Formen i kortet

Överst kontaktlänkarna med ikon, som är HANDLINGAR: telefon, webbplats,
e-post. Under dem egenskaperna som en definitionslista med etiketten till
vänster och beskedet till höger. Uppdelningen är inte kosmetisk: de översta är
länkar man klickar, resten är påståenden man läser.

Panelen är 300 px bred och lämnar 268 px innanför sin padding. Etikettspalten
framför länkarna ströks därför: den hade tagit drygt hundra av dem och lämnat
för lite åt "info@opizzicato.se". Etiketten står i stället i `aria-label`, och
ikonen bär den för seende.

**Egenskaperna är en lista och inte chips.** Ett chip kan bara säga att något
FINNS, och nästan hälften av beskeden är ett nej eller ett delvis: "Inte
tillgängligt", "Delvis tillgängligt", "Endast avhämtning". Som chip hade de
antingen fallit bort eller lästs som sin motsats av den som skummar.

### 7.1.2 Rubriken lovar aldrig mer än raderna håller

Rubriken över länkarna härleds ur vad som faktiskt står där. Bär kortet EN
länk heter rubriken det fältets eget namn; bär det två eller tre heter den
"Kontakt", som täcker dem utan att peka ut något.

Skälet är mätt. Av de 3 274 korten bär **705 exakt en länk**, fördelat på 495
webbplats, 206 telefon och 4 e-post. "Kontakt" över en ensam webbplatsrad hade
alltså på femhundra sidor antytt ett telefonnummer vi inte har, och läsaren som
kom för att ringa hade letat efter något som inte finns.

Egenskaperna får en egen rubrik, **"Bra att veta"**. "Kontakt" över raden
"Uteservering: Ja" är fel ord, och kortet kan dessutom bära egenskaper utan en
enda länk: 674 av de 3 274 gör det, och där är "Bra att veta" kortets enda
rubrik.

### 7.1.3 Kortet finns inte när det skulle bli tomt

Villkoret i sidmallen är dubbelt. `contact` finns på 3 274 sidor, men ett kort
utan en enda utskrivbar rad hade ändå blivit en tom vit ruta i spalten, så
`harNagot()` avgör.

Och en gång till i webbläsaren: har verksamheten själv skickat in precis de
fält vi hade ur OSM, och OSM inte gav några egenskaper, döljer
`Foretagsuppgifter.astro` hela kortet i stället för att lämna kvar en ruta med
bara en rubrik i.

### 7.2 Vad som aldrig avrundas

| OSM | På sidan | Varför inte "ja" eller "nej" |
|---|---|---|
| `wheelchair=limited` (162 st) | Delvis tillgängligt | Den som sitter i rullstol är just den läsare som inte ska behöva gissa vilket av dem vi menade |
| `takeaway=only` (19 st) | Endast avhämtning | Betyder att det inte GÅR att sitta ner |
| `payment:cash=no` + kort | Endast kort | Avgör om man behöver gå till en bankomat först |

Och tvärtom: 22 av 883 uteserveringar bär `sidewalk`, `rooftop` eller
`terrace`, och en `smoking` bär `Nein`. De kastas. En oöversatt kod i
gränssnittet är sämre än ingen rad alls.

### 7.3 Telefonnumret

Lagras som bara siffror, `+46855122812`, så att `tel:`-länken blir densamma
oavsett hur någon skrivit mellanslagen i OSM (`+46 8 551 228 12` och
`+468551228 12` är samma abonnent). På skärmen grupperas det som en svensk
läser det, `08-551 228 12`, eftersom numret ska gå att jämföra med det som
står på dörren. Riktnumret går inte att härleda ur numret självt; 07 och 08
känns igen, resten får tre siffror.

Webbplatsen visas som värdnamn utan `www.`, samma grepp som
`Foretagsuppgifter.astro` redan använder. Länken bär `rel="nofollow"`:
adressen är hämtad ur en öppen databas som vem som helst kan skriva i, och den
ska aldrig gå att använda för att bygga länkkraft genom oss.

### 7.4 Källan ligger i sidans fot, en gång för hela sidan

Kortet har ingen egen (i)-knapp. Attributionen står i `Sidupphov.astro`, i
källfoten längst ned, och räknar upp exakt de OSM-fält sidan visar.

**Historik, så att ingen bygger tillbaka den.** Kortet bar först en utskriven
källrad, sedan en (i)-knapp när ägaren sade "skriv inte ut openstreetmap, den
ska ligga i I-ikonen, HA INGET SÅNT där". Knappen föll på nästa granskning:
"i-ikonen på bra att veta, liksom hela den boxen där vi även har mejl sitter
liksom helt ensamt... måste vi ens ha det?"

Båda invändningarna gäller samma sak, att attributionen står INTILL uppgiften.
**ODbL 4.3 kräver inte det.** Villkoret gäller "the Produced Work", alltså
sidan, och en notis per sida räcker. Sidan bar tre knappar för en källa,
uppmätt i bygget 2026-08-18 till y 464, 2 491 och 2 898 i 1 200 px.

Knapparna bar dessutom ett mätfel: träffytan var 42 x 42 px och inte de 44 som
stod i kommentarerna, eftersom `inset` räknas från förälderns paddingruta och
en 16 px cirkel med hårlinje ger 14 + 2 * 14. En rad text har ingen träffyta.

Raden bär två länkar. `openstreetmap.org/copyright` är OSM:s upphovssida, som
tidigare inte fanns någonstans på sajten, och "Rätta uppgiften" går till
objektet.

**Commons-bilden och kartan är särfall och står kvar.** CC BY-SA är ett annat
avtal med en annan upphovsperson per bild och kräver namnet vid bilden, se
§ 5.2 och `Commonsbild.astro`. MapLibres attributionskontroll gäller
kakelleverantören och kartdatan bakom bilden och laddas av kartbiblioteket.

### 7.5 Verksamhetens egna uppgifter slår OSM:s

`Foretagsuppgifter.astro` visar telefon och webbplats som verksamheten SJÄLV
skickat in och redaktionen släppt fram. När de kommer hem döljs motsvarande
rad här, precis som avsnittet redan döljer OSM:s öppettider.

**Döljningen sker per FÄLT och inte per avsnitt.** Har någon skickat in ett
telefonnummer men ingen webbplats ska OSM:s webbplats stå kvar: den är
fortfarande den enda vi har, och att dölja den hade tagit bort en riktig
uppgift som svar på att en annan uppgift kom in.

### 7.6 Ingen JSON-LD

Samma dom som öppettiderna fick i `docs/33` §6.6, och den gäller ord för ord.
`telephone` och `sameAs` har ingen flagga för "härledd ur en annan källa", och
`Foretagsuppgifter.astro` skriver redan en nod med samma `@id` när
verksamhetens egna uppgifter kommit hem.

### 7.7 Vad det kostade i filer

**Noll.** Inga nya sidor, ingen ny route. Avsnittet ritas på sidor som redan
finns. Datafilerna växte med cirka 24 000 rader, av samma skäl och i samma
form som öppettiderna: `contact` är en platt ordbok och inte en nästlad, för
med `indent=1` kostar varje nivå en rad per verksamhet och fält.

---

## 8. Täckningen per kommun

Mätt ur de skrivna datafilerna 2026-08-18, alltså exakt vad som står på
sidorna. Nämnaren är de konsumentvända.

| Kommun | Konsumentvända | Minst ett fält | Telefon | Webbplats | E-post | Öppettid |
|---|---:|---:|---:|---:|---:|---:|
| Stockholms stad | 5 610 | **2 344** (41,8 %) | 1 573 (28,0 %) | 1 793 (32,0 %) | 909 (16,2 %) | 2 039 (36,3 %) |
| Linköpings kommun | 674 | **299** (44,4 %) | 173 (25,7 %) | 220 (32,6 %) | 50 (7,4 %) | 277 (41,1 %) |
| Uppsala kommun | 963 | **203** (21,1 %) | 104 (10,8 %) | 122 (12,7 %) | 40 (4,2 %) | 194 (20,1 %) |
| Karlstads kommun | 447 | **134** (30,0 %) | 47 (10,5 %) | 83 (18,6 %) | 11 (2,5 %) | 93 (20,8 %) |
| Örebro kommun | 687 | **132** (19,2 %) | 52 (7,6 %) | 67 (9,8 %) | 4 (0,6 %) | 59 (8,6 %) |
| Jönköpings kommun | 712 | **115** (16,2 %) | 33 (4,6 %) | 59 (8,3 %) | 5 (0,7 %) | 65 (9,1 %) |
| Oskarshamns kommun | 129 | **24** (18,6 %) | 9 (7,0 %) | 18 (14,0 %) | 4 (3,1 %) | 13 (10,1 %) |
| Kristinehamns kommun | 119 | **23** (19,3 %) | 11 (9,2 %) | 8 (6,7 %) | 3 (2,5 %) | 7 (5,9 %) |
| Borgholms kommun | 317 | **0** | 0 | 0 | 0 | 0 |
| Höganäs kommun | 217 | **0** | 0 | 0 | 0 | 0 |
| Lomma kommun | 78 | **0** | 0 | 0 | 0 | 0 |
| Svenljunga kommun | 42 | **0** | 0 | 0 | 0 | 0 |
| **Summa** | **9 995** | **3 274** (32,8 %) | **2 002** (20,0 %) | **2 370** (23,7 %) | **1 026** (10,3 %) | **2 747** (27,5 %) |

De fyra nollorna är samma fyra som i `docs/33` §3.2, och orsaken är
oförändrad: kommunerna publicerar ingen adress att geokoda, alltså finns ingen
koordinat att para mot. Öppnas de av att kommunen börjar lämna ut adressen
faller kontaktuppgifterna ut samtidigt, utan att en rad kod behöver ändras.

**Linköping ligger högre än Stockholm på "minst ett fält" (44,4 mot 41,8
procent)** trots färre uppgifter per verksamhet, och skälet är att en större
andel av Linköpings bestånd över huvud taget går att para.

### 8.1 Egenskaperna per kommun

| Kommun | Kök | Uteserv. | Avhämtn. | Leverans | Rullstol | Toalett | Kost | Betaln. | Wi-Fi | Rökning | Bokning |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Stockholms stad | 1 192 | 697 | 498 | 21 | 669 | 71 | 421 | 482 | 98 | 79 | 26 |
| Linköpings kommun | 177 | 23 | 71 | 14 | 74 | 4 | 23 | 30 | 7 | 10 | 1 |
| Uppsala kommun | 101 | 47 | 27 | 2 | 68 | 8 | 44 | 34 | 11 | 10 | 3 |
| Karlstads kommun | 61 | 63 | 15 | 3 | 59 | 5 | 44 | 60 | 5 | 54 | 0 |
| Örebro kommun | 61 | 8 | 19 | 3 | 62 | 1 | 8 | 2 | 0 | 0 | 0 |
| Jönköpings kommun | 59 | 18 | 18 | 3 | 21 | 4 | 7 | 10 | 2 | 6 | 0 |
| Oskarshamns kommun | 10 | 4 | 3 | 0 | 5 | 0 | 2 | 1 | 0 | 2 | 0 |
| Kristinehamns kommun | 13 | 1 | 1 | 1 | 1 | 0 | 1 | 2 | 1 | 0 | 0 |
| **Summa** | **1 674** | **861** | **652** | **47** | **959** | **93** | **550** | **621** | **124** | **161** | **30** |

Karlstad har 54 av landets 161 rökningsuppgifter och 60 av 621
betalningsuppgifter, alltså långt mer än sin storlek. Det är en kartläggare
som gått igenom kommunen systematiskt, och det är den vanligaste förklaringen
till att en kommun sticker ut i en enskild kolumn.

---

## 9. Hur det körs om

Samma kommandon som `docs/33` §9 för öppettider och kontakt:

```
python3 pipeline/oppettider.py --matt site/src/data/*.json   # mäter, skriver inget
python3 pipeline/oppettider.py site/src/data/*.json          # skriver hours OCH contact
python3 pipeline/oppettider.py --refresh site/src/data/*.json  # hämtar OSM på nytt
```

Körningen skriver ut kontakttäckningen per kommun och sammanlagt, med
nämnaren utsatt, precis som den redan gör för öppettiderna.

Bilderna har ett eget skript, eftersom de kostar anrop till två tjänster till
och bara berör 27 rader. Det läser samma uttag och gör samma hopparning:

```
python3 pipeline/hamta_commonsbilder.py --matt site/src/data/*.json   # mäter
set -a && . ~/.prikko-env && set +a
python3 pipeline/hamta_commonsbilder.py site/src/data/*.json          # hämtar
```

Körningen skriver ut hur många som bär `wikidata`, hur många som har en P18
och hur många som klarar spärren, och den NAMNGER var och en som spärras och
varför. Det är den enda gången någon får se att spärren gör sitt jobb.

Skriptet är idempotent: objektnyckeln är deterministisk och rader som redan
har en bild hoppas över. Det skriver BÅDE i datafilen och i tabellen `images`,
för `export_supabase.py` bygger om filen ur databasen varje natt och känner
bara till `image` genom den tabellen.

Proven:

```
python3 pipeline/tests/test_oppettider.py     # 75 prov, varav 25 nya
python3 pipeline/tests/test_commons.py        # 38 prov
node site/scripts/check-oppettider.ts         # 38 prov med inskickad klocka
```

De nya proven bygger på verkliga värden ur våra egna uttag, inklusive de fyra
trasiga webbadresserna, telefonfältet som innehåller en URL, de tre bilder
spärren fäller och den dolda dubblett Commons `Artist`-fält bär för Blå porten.

**Noll matpunkter är fortfarande ett fel och inte ett utfall.** Regeln i
`docs/33` §9 är oförändrad och blir viktigare nu: ett tomt svar som skrevs
till cachen hade tyst tagit bort både öppettider och kontaktuppgifter i en hel
kommun.

---

## 10. Vad som återstår

1. **Bilderna är byggda**, se §5.4. Det som återstår för dem är att köra om
   skriptet när Wikidata får fler P18 eller när fler verksamheter får en
   `wikidata`-tagg i OSM. Ingen bild byts av sig själv.
2. **Sociala medier och matsedel.** `contact:instagram` (73),
   `contact:facebook` (54) och `website:menu` (50) är mätta och byggbara. De
   är inte bortvalda på täckning, se §6, utan bara inte beställda.
3. **Kör om uttagen med jämna mellanrum.** OSM ändras. `checkedAt` står på
   varje post och skrivs ut i sidans källfot, se § 7.4, så en gammal uppgift är
   åtminstone märkt.
4. **Rör inte tröskeln i §6 utan att läsa hela stycket.** Den gäller filter,
   fullständighetstal och rangordningar. Den gäller inte en visning.
