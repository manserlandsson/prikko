# 53. Egen text per sida: den sista kvarvarande förklaringen, mätt och angripen

**Datum:** 2026-08-31.
**Beställning:** `docs/49_indexeringen.md` och `docs/51_klickdjupet.md` har
frikänt klickdjupet, inlänkarna och sidindelningen. Kvar står innehållet.
Uppdraget var att mäta om det block för block, skilja tre sorters upprepning
åt, räkna vad som finns att skriva med, och bygga åtgärden.
**Metod:** blockindelning av den renderade HTML:en ur ett eget bygge, samma
åttaordsmått som `51` §8, plus en census över site/src/data.
**Utfall:** de tre största blocken av ordagrant lika text måste stå kvar, två
av dem står ordagrant på de kedjesidor som är fyra av fyra indexerade, och
lyftet finns därför i täljaren. Andelen eget innehåll på verksamhetssidan går
från 14,7 till 16,5 procent. Taket ligger lågt och det är räknat i §5.

Varje tal nedan har sin mätning bredvid sig. Det som är en uppskattning heter
uppskattning, och §9 samlar det som inte gick att mäta.

---

## 1. Slutsatsen först

1. **De tre värsta blocken räknat i tecken är sajtens sidfot (1 105 tecken,
   100 procent ordagrant lika), omdömesrutan (776 tecken, 93 procent) och
   nyckeltalen med sina tips (652 tecken, 58 procent).** Tillsammans 2 533 av
   sidans 6 591 tecken brödtext. §3.
2. **Två av de tre står ordagrant på kedjesidorna också.** Sidfoten och
   sidhuvudet är samma text på alla 17 805 sidor, alltså också på de fyra
   kedjesidor som var fyra av fyra i Googles index enligt dokument 49. Att en
   sida bär mycket boilerplate är därför inte det som skiljer sidtyperna åt.
   Det som skiljer dem åt är hur mycket EGET de bär. §3.3.
3. **Åtgärden är byggd och den arbetar på täljaren.** Ett nytt stycke,
   `Kontrollserien.astro`, skriver kontrollserien i löpande text: period med
   båda datumen, takt, kontrollformer och anmälan. Median 232 tecken, allt
   byggt av mallar som fylls med kommunens egna värden, ingen mening
   formulerad per sida. §6.
4. **Utfallet, mätt med samma skript före och efter:** andelen eget innehåll
   på verksamhetssidan går från 14,7 till 16,5 procent, och unika
   åttaordssekvenser i medianen från 145 till 167. Kedjorna ligger på 43,2
   procent i samma mätning. Vi har alltså tagit igen ungefär en tiondel av
   avståndet. §7.
5. **Taket är lågt, och det är den viktigaste siffran i dokumentet.** Den
   bedömda medianverksamheten har 27 egna uppgifter att skriva av. Med 46
   tecken per uppgift, kalibrerat mot det block som just byggts, blir taket
   omkring 1 240 tecken egen text på en sida som bär 6 600. **Att skriva av
   varenda publicerad uppgift räcker inte för att nå kedjornas nivå.** §5.
6. **Därför pekar mätningen vidare mot att KORTA sidan, inte bara mot att
   skriva mer.** Kedjesidan når 43,2 procent på 731 ord; verksamhetssidan
   ligger på 24,4 procent på 1 093 ord i samma urval. Nämnaren är halva
   skillnaden. Den enda stora posten som går att korta utan att en läsare
   förlorar något är omdömesrutan på 776 tecken, och den kräver en omskrivning
   av 1 100 rader skript. §8.3.
7. **En sak till, och den är obekväm: måttet smickrar oss.** 241 tecken i
   medianen av det som räknas som sidans eget innehåll är fyra andra ställens
   namn och avstånd i panelerna "Nära dig" och "Bäst i närheten". De är unika
   för sidan men handlar inte om verksamheten sidan gäller. §2.2.
8. **Ingenting av detta är belagt som orsaken till att sidorna inte
   indexeras.** `docs/51` §9.4 skrev att den här åtgärden inte ska byggas
   förrän Search Console säger "Crawled, currently not indexed" och inte
   "Discovered". Den varningen står kvar och den gäller fortfarande. Det som
   byggts här är billigt, det gör sidan bättre för en läsare oavsett vad
   Search Console säger, och det är inte ett svar på diagnosfrågan. §9.

---

## 2. Metoden, och vad den är värd

### 2.1 Vad som mättes

Två bygg av samma träd, ett före och ett efter, i en egen git-worktree med
`--outDir dist-innehall`. Båda bär 17 805 sidor och 15 365 verksamheter i
sitemapen. Ur bygget drogs 200 verksamhetssidor med fast frö, och varje sida
delades i block ur den renderade DOM:en: sajtens sidhuvud och sidfot,
brödsmulorna, varje direkt barn till `main`, varje panel i `aside`, källfoten
och artikelbandet.

För varje block räknas tecken i den synliga texten, och hur stor andel av
blockets åttaordssekvenser som står på minst 90 procent av sidorna. Skript,
stil, SVG och `<template>` räknas inte. Det är samma åttaordsmått som
`docs/51` §8 använder, så talen går att ställa bredvid varandra, men **de är
inte identiska med 51:s** eftersom bygget är tre dagar yngre och 1 819
verksamheter större. 51 mätte 20,7 procent eget på 13 546 verksamheter; samma
skript på 15 365 ger 14,7. Fler sidor att vara lika betyder lägre andel eget,
och det är rätt beteende hos måttet.

Tabellen har två kolumner för lika text, och skillnaden mellan dem är viktig:

- **delad** räknas mot ALLA sidor i urvalet. Ett block som bara finns på 37
  procent av sidorna kan därför aldrig få ett högt tal, hur ordagrant lika det
  än är där det står.
- **inom** räknas bara mot de sidor som HAR blocket. Det är den kolumn som
  säger om blocket är en mall eller inte.

### 2.2 Vad måttet inte klarar

**Andra ställens namn räknas som sidans eget innehåll.** Panelerna "Nära dig"
och "Bäst i närheten" listar fyra plus fyra grannar med avstånd och antal
kontroller. Mätt över 200 sidor är de listorna 241 tecken i medianen, och varje
åttaordssekvens i dem är unik för sidan eftersom kombinationen av fyra grannar
är det. En sökmotor som bedömer vad sidan handlar om ser något annat: fyra namn
som hör hemma på fyra andra sidor. Måttet överskattar oss alltså med i
storleksordningen 240 tecken, och panelerna bär redan `data-nosnippet` av just
det skälet, se `JamforRuta.astro` och `docs/51` §8.1.

**Måttet mäter inte det Google mäter.** Google rabatterar boilerplate den känner
igen som mall, och vi vet inte var den gränsen går. Ett tal som rör sig från
14,7 till 16,5 procent är ett tal om vår egen text och inte ett tal om
indexering. Det ska läsas som det.

---

## 3. Mätningen, block för block

### 3.1 Sidan före åtgärden

Ur 200 slumpade verksamhetssidor i bygget 2026-08-31. "tecken" är medianen för
det block som faktiskt finns, "bidrag" är tecken gånger hur ofta blocket
förekommer, alltså blockets andel av en genomsnittlig sida.

| Block | Sidor | Tecken | Bidrag | Delad |
|---|---:|---:|---:|---:|
| Sidfot (hela sajten) | 100 % | 1 105 | 1 105 | 100 % |
| Omdömesrutan, "Lämna ett omdöme eller en bild" | 100 % | 776 | 776 | 93 % |
| Nyckelfakta med sina tips | 100 % | 652 | 652 | 58 % |
| Panel: Bäst i närheten | 78 % | 550 | 426 | 0 % |
| Bedömningen | 100 % | 461 | 461 | 5 % |
| Artikelbandet | 100 % | 368 | 368 | 34 % |
| Kontrollhistorik | 100 % | 344 | 344 | 0 % |
| Panel: Nära dig | 84 % | 315 | 265 | 0 % |
| Besökarnas omdömen | 100 % | 289 | 289 | 90 % |
| Sidhuvud (hela sajten) | 100 % | 287 | 287 | 100 % |
| Vad uppföljningen visade | 37 % | 646 | 239 | 0 % |
| Vad kontrollen visade | 34 % | 525 | 179 | 0 % |
| Källfot | 100 % | 150 | 150 | 0 % |
| Ta dig hit | 84 % | 163 | 137 | 0 % |
| Återkommande brister | 28 % | 466 | 133 | 0 % |
| Panel: Något som inte stämmer | 100 % | 112 | 112 | 100 % |
| Panel: Så ser det ut i kommunen | 100 % | 149 till 198 | 186 | 0 % |
| Om verksamheten, tom mall | 100 % | 92 | 92 | 100 % |
| Namn, adress och handlingsrad | 100 % | 76 | 76 | 0 % |
| Panel: Anmäl till kommunen | 90 % | 76 | 68 | 0 % |
| Karta | 84 % | 78 | 66 | 0 % |
| Panel: Företaget | 50 % | 96 | 48 | 0 % |
| Jämförelseknappen | 100 % | 33 | 33 | 0 % |
| Panel: Kontakt | 15 % | 58 till 101 | 14 | 0 % |
| Öppettider | 14 % | 144 | 21 | 0 % |
| Raden i följd | 26 % | 71 | 18 | 0 % |
| Brödsmulor | 100 % | 18 | 18 | 0 % |
| **En genomsnittlig sida** | | | **6 591** | |

### 3.2 De tre värsta, räknat i tecken

| Plats | Block | Tecken | Lika | Ordagrant lika tecken |
|---:|---|---:|---:|---:|
| 1 | Sajtens sidfot | 1 105 | 100 % | 1 105 |
| 2 | Omdömesrutan | 776 | 93 % | 722 |
| 3 | Nyckeltalen med sina tips | 652 | 58 % | 378 |

Därefter kommer sajtens sidhuvud (287, 100 procent), avsnittet "Besökarnas
omdömen" (289, 90 procent) och artikelbandet (368, 34 procent). Summerat är
omkring 3 100 av sidans 6 591 tecken ordagrant lika, alltså 47 procent räknat
i tecken. Dokument 51 mätte 61 procent räknat i ord med ett annat mått; talen
är inte samma sak och ska inte ställas mot varandra.

**Vad de tre faktiskt består av.**

- **Sidfoten** är tolv kommunlänkar gånger två rubriker, tolv kedjor och tolv
  Prikko-länkar. Den är sajtens interna länkgraf. `docs/51` §4.2 mätte att
  kommunsidorna får 16 755 av sina inlänkar därifrån.
- **Omdömesrutan** är ett `<dialog>` som är stängt tills någon klickar. Den
  innehåller formuläret, fältens hjälptexter och stycket om vad som händer med
  det man skickar in. Ingen läser den utan att be om den, och den står ändå i
  HTML:en på alla 15 365 sidor.
- **Nyckeltalen** är fyra tal med fyra etiketter, alltså ungefär 90 tecken som
  är sidans egna, plus omkring 560 tecken tips som förklarar vad talen får och
  inte får betyda. Tipsen är förbehållen som gör talen sanna.

### 3.3 Det som gör slutsatsen

Sidfoten och sidhuvudet, alltså 1 392 tecken eller 21 procent av sidans
brödtext, står ordagrant på var och en av sajtens 17 805 sidor. Det gäller
alltså också `/kedja/taco-bar/`, `/kedja/city-gross/`,
`/kedja/joe-and-the-juice/` och `/kedja/naked-juicebar/`, som enligt
`docs/49` §3 var fyra av fyra i Google.

**Samma boilerplate, motsatt utfall.** Det utesluter inte att mängden lika
text spelar roll, men det säger att den inte kan vara hela förklaringen, och
det flyttar frågan från nämnaren till täljaren: kedjesidan har 43,2 procent
eget innehåll på 731 ord, verksamhetssidan hade 22,3 på 1 070 i samma urval.

---

## 4. Tre sorters upprepning, sorterade

Beställningen bad om att skilja tre sorter åt, för de kräver olika svar.

### 4.1 Text som MÅSTE stå där

| Block | Tecken | Varför den stannar |
|---|---:|---|
| Sidfot och sidhuvud | 1 392 | Sajtens navigation och interna länkgraf. `docs/51` §9.3 rekommenderar uttryckligen att inte bygga om navigationen, och att ta bort den vore att bygga om den åt fel håll. |
| Nyckeltalens tips | ~560 | Varje tips är ett förbehåll som gör talet sant: att räkningen gäller adressen och inte företaget, att "Äldsta kontroll" inte är verksamhetens startår, att ett återbesök utan redovisat utfall inte säger något om hur det gick. Utan dem blir fyra tal fyra påståenden vi inte har täckning för. |
| Bedömningens tips | ~330 | Grenar per utfall och namnger kommunen, datumet och antalet områden. Bara 5 procent av det är ordagrant lika. |
| Avsnittet "Besökarnas omdömen" | 289 | Tre löften: att omdömen inte är kontrollresultat, att de aldrig påverkar bedömningen, och att redaktionen läser varje omdöme. Löften får inte försvinna för att de upprepas. |
| Källfoten | 150 | Vilken dag kommunens uppgifter hämtades och vilka fält som kommer ur OpenStreetMap. Licensvillkor, inte utsmyckning. |

### 4.2 Text som står där av slentrian

Två fynd, och bara det ena var värt att röra.

**Rört: tipset på "Bäst i närheten", kortat från fyra meningar till två.**
De två som gick bort:

- *"Båda talen står på varje rad, så ordningen går att pröva."* Meta om meningen
  före den. Raden VISAR båda talen, och att beskriva att den gör det säger inget
  en läsare inte redan ser.
- *"Listan visar bara de utan anmärkningar, och vi publicerar aldrig den
  omvända."* Ett löfte om vad Prikko aldrig gör, alltså policy och inte en
  förklaring av just den listan. **Det är flyttat till "Vad vi inte gör" på
  `/metodik/`**, inte struket. Att listan bara innehåller ställen utan
  anmärkningar står kvar i tipsets första mening.

Kostnad 133 tecken ordagrant lika, på de 78 procent av sidorna som bär panelen,
alltså omkring 104 tecken per sida i medel. Två procent av brödtexten.

**Inte rört: den tomma mallen "Om verksamheten", 92 tecken.** Rubriken plus sju
veckodagsnamn står i HTML:en på alla sidor, i ett `<section hidden>` som fylls i
webbläsaren när en verksamhet skickat in något. Det är verklig slentrian, men
92 tecken är 1,4 procent av sidan och ändringen ligger i en komponent vars hela
poäng är att skelettet finns före datan. Priset är högre än vinsten.

### 4.3 Text som är samma mening om olika saker

Det var här beställningen väntade sig mest, och den hade rätt. Sidan hade fram
till nu **en enda mening som varierar med verksamhetens egen data**, nämligen
svarsmeningen högst upp, plus ett tips vid bedömningen som gör detsamma. Allt
annat som är verksamhetens eget står som etiketter i listor: datum, prickar,
"Planerad kontroll · oanmäld", tal i en rad.

Kontrollhistoriken bar 344 tecken innan åtgärden, och noll av dem var prosa.
En sida som har elva kontroller sedan 2018 sade det med elva radetiketter och
inte med en mening. Det är precis den luckan §6 fyller.

---

## 5. Vad som finns att skriva med, och var taket ligger

Census över `site/src/data`, alla 17 066 poster, 2026-08-31.

### 5.1 Underlaget

| Mått | Utfall |
|---|---|
| Poster totalt | 17 066, varav 15 365 med bedömning och egen indexerbar sida |
| Poster med minst en publicerad kontroll | 15 492, alltså 1 574 utan |
| Kontroller per verksamhet | median 3, medel 4,30, max 113 |
| Kontroller totalt | 73 335 |
| Kontrollformer | 55 634 planerade, 15 543 återbesök, 2 158 händelsestyrda |
| Anmälan känd | 68 673 av 73 335 kontroller, alltså 93,6 procent |
| Verksamheter där anmälan är känd för VARJE kontroll | 12 168 av 15 492, alltså 78,5 procent |
| Historikens spann | median 2 år, medel 3,07, max 9 |
| Verksamheter med minst en publicerad områdesrad | 9 086, alltså 53,2 procent |
| Områdesrader per verksamhet | median 1, medel 7,5, max 389 |
| Verksamheter med minst en redovisad avvikelse | 7 953, alltså 46,6 procent |
| Distinkta avvikelseområden per sådan verksamhet | median 1, p90 2, max 7 |

Fältens utfyllnad: adress 92,5 procent, kategori 93,5, koordinat 83,9,
hållplats 75,4, parkering 62,1, registrering 49,9, kontakt 23,0, öppettider
16,1, egen bild 2,2.

### 5.2 Taket

Räknat som antalet uppgifter som är verksamhetens egna: fyra per kontroll
(datum, form, anmälan när den är känd, utfall), en per sammanslagen
områdesrad, en per ifyllt platsfält, och sex härledda aggregat för den som har
minst en kontroll (antal, andel, återbesök, äldsta år, spann, takt).

| Egna uppgifter per bedömd sida | Utfall |
|---|---:|
| p10 | 14 |
| Median | 27 |
| Medel | 38,1 |
| p90 | 77 |
| Max | 699 |

**Kalibreringen är mätt och inte gissad.** Blocket i §6 skriver fem uppgifter
(två datum, antalet, formfördelningen och anmälan) på 232 tecken i medianen,
alltså 46 tecken per uppgift i löpande text.

**27 uppgifter gånger 46 tecken ger omkring 1 240 tecken.** Det är taket för
hur mycket text på medianverksamhetens sida som kan vara enbart dess egen utan
att en enda mening hittas på. Sidan bär i dag 6 600 tecken brödtext.

**Slutsatsen som följer:** även ett perfekt utnyttjande av datan ger en sida
där omkring 19 procent av texten är verksamhetens egen. Kedjesidan ligger på
43,2 procent, och den gör det för att dess nämnare är mindre, inte bara för att
dess täljare är större. **Vägen till kedjornas nivå går genom att korta sidan,
och det är en annan beställning än den här.**

### 5.3 Vad som räknades bort under vägen

Ett femte mening om avvikelseområdena över hela historiken var med i utkastet
och föll på mätningen: medianverksamheten med avvikelser har **ett enda**
distinkt område, och de två vanligaste, "Hygien" och "Information om
livsmedel", täcker 6 037 av de 7 953 verksamheter som har någon avvikelse alls.
En sådan mening hade blivit en femte kopia av samma formulering på tusentals
sidor, alltså mer boilerplate och inte mindre. Dessutom hade den överlappat
både "Vad kontrollen visade" och "Återkommande brister", som redan står på
sidan.

En mening om utfallsfördelningen ("vid 4 av dem noterades inga anmärkningar")
föll av samma skäl: den upprepar nyckeltalet "Utan anmärkning" och tidslinjens
etiketter med små heltal som tusentals sidor delar.

---

## 6. Åtgärden som byggdes

`site/src/components/Kontrollserien.astro`, inkopplad som ingång till
kontrollhistoriken via en slot i `InspectionHistory.astro`.

### 6.1 Vad den skriver

Fyra meningar, var och en en mall som fylls med värden ur kontrollerna.

1. **Perioden.** "Stockholms stad har publicerat 5 kontroller på Folkungagatan
   67, den första den 2 juli 2021 och den senaste den 8 september 2025."
2. **Takten.** "Det blir i snitt en kontroll var 13:e månad." Bara vid minst
   tre kontroller och minst ett år mellan ändarna, och bara från två månader
   och uppåt.
3. **Formerna.** "Samtliga är planerade kontroller", eller "Av dem är 9
   planerade kontroller och 2 återbesök".
4. **Anmälan.** "Samtliga gjordes oanmälda", eller "10 av dem gjordes oanmälda
   och 1 föranmäld". Bara när uppgiften är känd för varje kontroll.

Placeringen är under rubriken "Kontrollhistorik" och över tidslinjen, alltså
som prosa-ingången till den lista den sammanfattar. Ett eget avsnitt hade
krävt en andra rubrik om kontroller tio centimeter från den första.

### 6.2 Hur hårda gränserna hålls

| Gräns | Hur den hålls |
|---|---|
| Ingen AI-genererad text | Fyra mallsträngar med interpolerade värden. Ingen språkmodell är inblandad vid byggtid eller vid körning. `/metodik/` lovar redan att "Vi skriver ingen text med AI", och det löftet gäller ordagrant här. |
| Ingenting får bli osant | Varje mening har ett villkor och uteblir hellre än gissar. En kontroll utan datum fäller hela blocket. Ett `prenotified` som är null på en enda kontroll tar bort mening 4 helt, i stället för att tyst räkna på en delmängd. Meningarna säger vad KOMMUNEN publicerat på ADRESSEN, aldrig något om verksamhetens ålder. |
| En funktion får aldrig kosta en sida | Noll nya URL:er. Bygget står på 18 051 filer, oförändrat. |
| Aldrig en rangordning, aldrig en jämförelse med grannen | Varje tal i blocket är räknat på verksamhetens egna kontroller. Ingen mening nämner en annan verksamhet, en median, ett snitt för kommunen eller en position i en lista. |

### 6.3 Utfallet över hela beståndet

Simulerat mot alla 17 066 poster innan mallen skrevs, och sedan verifierat i
bygget:

| Mått | Utfall |
|---|---:|
| Poster utan block | 1 574, alltså 9,2 procent, samtliga utan publicerad kontroll |
| Två meningar | 2 720 |
| Tre meningar | 5 106 |
| Fyra meningar | 7 666 |
| Tecken | median 232, medel 212, kortast 99, längst 312 |

Blocket är alltså kortast just där sidan har minst att säga, och det är rätt:
en verksamhet med en enda kontroll får en mening om vilken kontroll det var och
inget mer. Den gruppen är 4 113 poster, och `docs/51` §8.3 pekade ut den som
sajtens tunnaste.

### 6.4 Kontrollerat i det byggda

- `/stockholm/tonari-ramen/`: "Stockholms stad har publicerat 5 kontroller på
  Folkungagatan 67, den första den 2 juli 2021 och den senaste den 8 september
  2025. Det blir i snitt en kontroll var 13:e månad. Samtliga är planerade
  kontroller. 4 av dem gjordes oanmälda och 1 föranmäld."
- `/hoganas/kullagrill/`, en kontroll och ingen adress: "Höganäs kommun har
  publicerat en kontroll på adressen, den 16 mars 2026. Det var en planerad
  kontroll."
- `/linkoping/forskolan-skogsmyran/`, elva kontroller: "... Det blir i snitt en
  kontroll var 10:e månad. Av dem är 9 planerade kontroller och 2 återbesök. 10
  av dem gjordes oanmälda och 1 föranmäld."

Ritat kontrollerat i bild vid 1 440 och vid 375, på både en sida med fem
kontroller och en med en enda. Stycket ligger på 62ch, bryter inte, och skjuter
inte ned tidslinjen på mobil. Bygget passerar länkvakten (17 805 sidor, inga
döda interna länkar), sitemapvakten och filtaket.

---

## 7. Mätningen efter

Samma skript, samma frö, samma 200 sidor.

| Mått | Före | Efter |
|---|---:|---:|
| Ord i brödtexten, median | 1 004 | 1 020 |
| Unika åttaordssekvenser, median | 145 | 167 |
| **Andel eget innehåll** | **14,7 %** | **16,5 %** |
| Andel åttaordssekvenser på minst 90 procent av sidorna | 43,1 % | 42,6 % |

Blocken som ändrades:

| Block | Tecken före | Tecken efter | Lika inom blocket, efter |
|---|---:|---:|---:|
| Kontrollhistorik | 344 | 561 | 0 % |
| Panel: Bäst i närheten | 550 | 414 | 43 % |

Mätt med ett mindre urval, 54 sidor per sidtyp, så att verksamheterna går att
ställa mot kedjorna med samma nämnare:

| Sidtyp | Ord, median | Andel eget före | Andel eget efter |
|---|---:|---:|---:|
| Kommuner | 1 345 | 78,7 % | 78,7 % |
| Kategorier | 1 306 | 77,8 % | 77,8 % |
| Områden | 1 270 | 60,2 % | 60,2 % |
| **Kedjor** | 731 | **43,2 %** | **43,2 %** |
| **Verksamheter** | 1 093 | **22,3 %** | **24,4 %** |

De fyra andra sidtyperna är oförändrade på varje decimal, vilket är kontrollen
på att ändringen bara rörde verksamhetssidan och `/metodik/`.

**Avståndet till kedjorna var 20,9 procentenheter och är nu 18,8.** Vi har tagit
igen en tiondel av det med det block som fanns att bygga. §5.2 säger varför
resten inte finns i datan.

---

## 8. Vad jag lämnade, och skälet till varje

### 8.1 Sidfoten och sidhuvudet, 1 392 tecken

Sajtens navigation. `docs/51` §4.2 mätte att kommunsidorna får 16 755 inlänkar
ur sidfoten, och §9.3 rekommenderar att inte röra navigationen alls. Att korta
den för att sänka ett boilerplatetal vore att betala i det enda mätningen
faktiskt frikänt. Dessutom står den ordagrant på de indexerade kedjesidorna,
se §3.3.

### 8.2 Nyckeltalens tips, cirka 560 tecken

Varje mening är ett förbehåll som gör ett tal sant. Två av dem säger samma sak
med olika ord, att historiken följer lokalen och inte företaget, och det stod
en trimning nära. Den gjordes inte: `/metodik/` har ett helt avsnitt om det,
men det förbehållet är det enda som hindrar den vanligaste felläsningen på hela
sidan, att kontrollerna gäller den nuvarande verksamheten. Ett förbehåll som
måste stå kvar får stå två gånger.

### 8.3 Omdömesrutan, 776 tecken, 93 procent lika

**Det här är den största posten som faktiskt går att ta bort, och den lämnas
med öppna ögon.** Rutan är ett `<dialog>` som är stängt tills någon klickar,
alltså text ingen läser förrän den bes om, och avsnittet är JavaScript-drivet
i sin helhet. Rätt åtgärd är att lägga rutans innehåll i ett `<template>` och
klona det vid första öppningen, för `<template>` indexeras inte.

Priset är att `Reviews.astro` är 1 887 rader, varav omkring 1 100 skript som
hämtar element ur rutan vid init: `dialog.querySelector('[data-close]')`,
`.about`, formuläret, felrutan, betygsinmatningarna. Alla behöver byggas om
mot en klonad nod. Det är en dags arbete med verklig risk att ta sönder en
inskickningsväg, och beställningen sade att ingenting får bli trasigt. Den
ligger som en egen punkt i §9.

### 8.4 Tipsen på "Nära dig" och "Besökarnas omdömen"

"Nära dig" är 190 tecken i två meningar, och den andra säger att alla
bedömningar förekommer i listan. Utan den läser en besökare listan som filtrerad.
"Besökarnas omdömen" är 289 tecken i tre löften. Ett löfte kortas inte för att
spara tecken.

### 8.5 Svansen

`docs/51` §9.5 avgjorde att verksamheter med en enda kontroll förtjänar en
sida. Ingenting här ändrar det. De får tvärtom mest av åtgärden i relativa
termer: en sida som bar 344 tecken kontrollhistorik bär nu 344 plus omkring 100.

---

## 9. Vad som inte gick att mäta, och vad som står kvar

1. **Om något av det här flyttar indexeringen.** Det går inte att veta
   härifrån. `docs/51` §9.2 säger att skillnaden mellan "Crawled, currently not
   indexed" och "Discovered, currently not indexed" avgör vilken förklaring som
   gäller, och att Search Console ligger på ägaren. **Den punkten står över
   allt i det här dokumentet.**
2. **`prikko.pages.dev` svarar fortfarande 200.** Fynd B i `docs/14`, upprepat
   i `docs/49` §5 och `docs/51` §9.1. Det är fortfarande den enda mätbara
   defekten i hela utredningen och den kostar en halvtimme i Cloudflares
   kontrollpanel.
3. **Omdömesrutan i ett `<template>`.** 776 tecken per sida, alltså den
   enskilt största kvarvarande posten. Kräver att skriptet i `Reviews.astro`
   byggs om mot en klonad nod. §8.3.
4. **Nämnaren.** §5.2 visar att taket för egen text ligger omkring 1 240 tecken
   av 6 600. Vill man nå kedjornas 43 procent måste sidan bli kortare, inte
   bara rikare. Vilka 2 000 tecken som i så fall ska bort är en egen
   beställning, och den ska inte tas förrän punkt 1 är besvarad.
5. **Domänens ålder och inlänkarna utifrån.** `docs/51` §8.4 kallar
   genomsökningstakten den mest sannolika enskilda förklaringen, och den går
   inte att mäta utan Search Console eller Semrush-enheter.
