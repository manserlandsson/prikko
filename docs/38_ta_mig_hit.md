# 38. Ta dig hit: restid, hållplats och parkering

**Datum:** 2026-08-18
**Föregångare:** `docs/33_oppettider.md` äger nämnaren och tröskelresonemanget.
`docs/37_osm_taggar.md` äger vilka OSM-taggar vi läser och vilka vi valt bort.
`docs/10_teardown_och_designreferens.md` äger designreferenserna.
**Beställning:** ägaren skickade en skärmbild från **ednia.se**, en av sajtens
namngivna designreferenser, med en vit pille nere till höger på kartan: en
gående figur och texten "Beräkna restid". Plus två egna önskemål,
kollektivtrafik och parkering.
**Utfall:** byggt, men INTE som beställningen först lät. Ednia räknar
ingenting. Se §2, som är hela dokumentets gångjärn.

---

## 1. Slutsatsen först

1. **Ednias "Beräkna restid" räknar ingen restid.** Uppmätt i deras DOM
   2026-08-18 är knappen ett rent `<a href="https://maps.google.com/?daddr=…">`
   som öppnas i ny flik. Ingen restid står på deras sida, ingen tjänst anropas,
   ingen position efterfrågas. Etiketten är ett löfte om vad som händer EFTER
   klicket. §2.
2. **Alltså är restidsdelen en omformulering, precis som beställningen
   förutsåg.** Vi hade redan länken, i Platskarta.astro, under etiketten
   "Vägbeskrivning". Det som byggdes är samma sorts länk under Ednias etikett
   och med Ednias ikon, i en egen komponent. §4.
3. **Att räkna restid själva föll på tre mätta hinder, inte på smak.** Google
   får inte lagras, den fria ruttjänsten räcker inte till en tiondel av
   beståndet, och en egen ruttmotor över Sverige är fel storlek på problemet.
   §3.
4. **Det som FAKTISKT gick att lägga till är två tal vi räknar själva i
   förväg**: avståndet till närmaste hållplats och antalet parkeringar inom
   200 meter. Båda är fågelvägen, och det ordet står på sidan. §5 och §6.
5. **Täckningen är hög där vi har en koordinat.** Se tabellen i §8. Att den är
   noll i fyra kommuner har ingenting med hållplatser att göra: de kommunerna
   publicerar inga koordinater alls, se `docs/33` §10.1.

---

## 2. Vad Ednias knapp gör, mätt och inte gissad

Frågan avgjorde hela bygget, så den ställdes till källan i stället för till
skärmbilden. Sidan `ednia.se/gymnasium/vrg-campus-viktor-rydberg` öppnades
2026-08-18 och knappen lästes ur DOM:en. Ordagrant:

```html
<a target="_blank"
   class="btn-small absolute z-10 bottom-12 items-center right-12"
   href="https://maps.google.com/?daddr=59.34581250000001,18.04981250000002">
  <svg data-icon="person-walking" …/>Beräkna restid</a>
```

Tre saker faller ut av det.

**De räknar ingenting.** Det finns ingen restid på deras sida. Länken saknar
dessutom startpunkt: bara `daddr`, alltså destinationen. Google fyller i
"din plats" när man kommer fram. Etiketten beskriver vad Google ska göra, inte
vad Ednia har gjort.

**Ikonen är en gående figur**, `person-walking` ur Font Awesome, men färdsättet
tvingas inte i länken. Figuren är en bild av att ta sig någonstans, inte ett
påstående om att man ska gå.

**Måtten**, uppmätta på samma sida:

| | |
|---|---|
| pille | 139,9 × 33 px, vit botten, radie 12 px |
| innermått | 4 px över, 11 px vid sidorna, 6 px under |
| text | 14/21 halvfet, 8 px gap till ikonen |
| läge | `position: absolute`, 12 px från höger och nederkant |
| karta | kvoten 657/328 på skrivbord, 328/246 på telefon |
| hörnen | expandera uppe till höger, upphovsraden nere till VÄNSTER, pillen nere till höger |

Ett föremål per hörn, och inget som krockar. Det sista är det som inte går att
kopiera rakt av hos oss, se §7.

---

## 3. Vad "restid" ens betyder på en statisk sajt, och de tre vägarna

Sajten är statisk med 17 000 sidor byggda i förväg. Det finns ingen "härifrån"
vid byggtillfället, alltså finns det ingen restid att skriva in i filen. Det
lämnar tre vägar, och de prövades alla tre.

### 3.1 Vald: länka ut och låta kartappen räkna

Det är vad Ednia gör, det är vad vår `geo:`-länk redan gjorde, och det är vad
som byggdes. Kostnad: noll anrop, noll nycklar, noll lagring, noll samtycke.

Att länka till Google är inte att använda Googles API. Vi anropar ingenting, vi
får inget svar tillbaka, och vi lagrar inget svar. Hela problemet i §3.2 handlar
om lagring, och det uppstår inte i ett `<a href>`.

### 3.2 Bortvald: fråga om besökarens position och anropa en ruttjänst live

Faller på tre skäl som var för sig räcker.

**Google får inte lagras, och vi lagrar allt.** Google Maps Platform Service
Specific Terms §3.2.3 förbjuder att Maps Content cachas eller lagras, med ett
smalt undantag: latitud och longitud ur Directions API får hållas i högst 30
sammanhängande kalenderdagar och måste sedan raderas. Vår sajt är statisk;
allt vi räknar hamnar i en fil i git och ligger där för alltid. Det är exakt
den kollision som stoppade oss förut.

**Den fria ruttjänsten räcker inte till en tiondel av beståndet.**
openrouteservice fria nivå ger 2 000 ruttanrop per dygn och 40 per minut. Vi
har 13 379 verksamheter med användbar koordinat. Ett enda tal per verksamhet
hade tagit **6,7 dygn av hela dygnskvoten** per omkörning, och pipelinen körs
oftare än så. Att i stället anropa live i webbläsaren flyttar bara kvoten till
besökarna och lägger en nyckel öppet i HTML på 17 000 sidor, vilket är precis
det fel Platskarta.astro redan rättat en gång med Mapbox statiska bild-API.

**OSRM:s demoserver får inte användas så här.** Dess egen policy: användningen
är begränsad till "reasonable, non-commercial use-cases", högst ett anrop per
sekund, inga garantier om drift, och tillgången kan dras in när som helst utan
skäl. Att bygga en publik funktion på den är att bygga på något som kan
försvinna en tisdag.

Därtill kommer det som gäller oavsett tjänst: en position kräver samtycke,
och sidan får inte gå sönder när någon säger nej. En knapp som bara fungerar
för dem som delat sin plats är en knapp som ser trasig ut för alla andra.

### 3.3 Bortvald: en egen ruttmotor över Sverige

Tekniskt görligt. En Valhalla- eller OSRM-instans över Sveriges OSM-utdrag
räknar gångavstånd offline utan kvot och utan villkor, och den hade gett
RIKTIGT gångavstånd i stället för fågelvägen.

Den föll ändå, och skälet är storlek och inte princip. Pipelinen ska kunna köras
i en tom GitHub Actions-container utan att bygga geospatiala C-bibliotek; det
är samma krav som gjorde att `prikko/geo.py` implementerar Gauss–Krügers
projektion för hand i stället för att dra in proj. En ruttmotor med ett
förberäknat Sverigeutdrag är flera gigabyte och tiotals minuter per byggning,
och den hade förbättrat ETT tal på sidan från "80 m fågelvägen" till "110 m att
gå".

**Vad som skulle ändra domen:** om vi ändå kommer att köra en ruttmotor för
något annat. Då är gångavstånden nästan gratis, och då ska §5 räknas om.

---

## 4. Knappen

Etiketten är Ednias, ikonen är Ednias gående figur ritad om i vår streckvikt,
och länken går till Google Maps dokumenterade URL-form:

```
https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>
```

`api=1`-formen och inte Ednias äldre `?daddr=`: båda fungerar, men den här är
den Google dokumenterar och lovar framåt. Ingen startpunkt anges, alltså fyller
Google i besökarens egen. Inget färdsätt tvingas heller: den gående figuren är
förlagans, men den som ska ta bilen ska inte behöva byta tillbaka.

### 4.1 Varför inte `geo:` i den här knappen

`Platskarta.astro` har en `geo:`-länk, och den är rätt DÄR: `geo:` lämnar valet
av kartapp till telefonen i stället för att välja åt användaren, och det finns
en "Öppna i karta"-länk bredvid som bär skrivbordet.

Men den HÄR knappen bär ett löfte om en beräkning, och `geo:` gör ingenting
alls på en dator. En knapp som säger "Beräkna restid" och sedan inte händer
för halva trafiken är sämre än ingen knapp. Alltså en https-länk som fungerar
överallt, precis som förlagans.

**Följden är att sidan i dag har två vägar till en vägbeskrivning**, den nya
pillen och Platskartas rad med `geo:` plus "Öppna i karta". Det är en dubblering
och den ska bort. Platskarta.astro ägs av en annan agent i den här omgången och
rördes därför inte; se §7 för vad som ska hända där.

---

## 5. Hållplatsen

### 5.1 Talet är fågelvägen, och det ordet står på sidan

Åttio meter fågelvägen kan vara fyrahundra runt ett kvarter, över ett spår
eller längs en kaj. Vi räknar inte gångavstånd, av skälen i §3.3. Alltså står
det under raderna, ordagrant på sidan:

> Avstånden är fågelvägen, inte gångväg.

Den meningen är inte utsmyckning och får inte trimmas bort för att raden blir
kortare utan den. Utan den påstår talet ett gångavstånd vi inte har räknat, och
läsaren har inget sätt att upptäcka skillnaden förrän hon står vid ett stängsel.

### 5.2 Avrundningen

**Hela tiotal meter, aldrig under tio.** Vår egen koordinat är i 1 394 fall
härledd ur adressen och ligger på fastigheten snarare än i dörren, och OSM:s
hållplatsnod är stolpen och inte plattformskanten. "83 m" påstår en skärpa som
ingen av de två sidorna har. Noll skrivs aldrig: det är inget avstånd utan ett
påstående om att man står inuti hållplatsen.

**Verksamheter med `geoPrecision: approximate` får inget tal alls.** Den
koordinaten kan ligga hos grannporten, vilket är just varför hopparningen i
`docs/33` §4 vidgar sin radie till 250 meter för dem. Ett avstånd på tiotals
meter räknat från en punkt med hundratals meters fel är en uppfinning. Det
gäller 237 verksamheter, 158 i Uppsala och 79 i Örebro.

### 5.3 Radien: 500 meter

500 meter fågelvägen är runt 600 till 800 meter att gå, alltså en kvart för den
som inte skyndar sig. Bortom det svarar talet inte längre på frågan "kan jag åka
kollektivt hit", det svarar "det finns en hållplats i kommunen", och det gör det
alltid.

Radien är mätt och inte gissad. `pipeline/narhet.py --matt` skriver ut
täckningen vid 100, 200, 300, 500, 800 och 1 200 meter, se §8.2.

### 5.4 Vilka OSM-objekt som räknas som hållplats

`highway=bus_stop`, `railway=station`, `railway=halt`, `railway=tram_stop`,
`amenity=ferry_terminal`, och `public_transport=platform` **bara när något
annat på objektet säger vilket trafikslag det är**.

Det sista kravet är det viktigaste i hela §5. En bar `public_transport=platform`
utan trafikslag kan vara en taxificka, och en rad som säger "Busshållplats" om
en taxificka är ett fel läsaren inte har någon möjlighet att upptäcka. Hellre
ingen rad.

`public_transport=stop_position` hämtas **avsiktligt inte**. Den ligger mitt i
vägbanan eller på spåret, alltså på en punkt ingen människa står på, och den
hade systematiskt gett kortare avstånd än den plattform man faktiskt går till.

Tunnelbana prövas FÖRE tåg, eftersom en tunnelbanestation i OSM är
`railway=station` plus `station=subway`. Prövas `railway` först blir varje
tunnelbanestation i Stockholm en "Tågstation".

### 5.5 Dubbelkartläggningen behöver inte städas, och varför

Samma hållplats finns ofta som både en `highway=bus_stop`-nod (stolpen) och en
`public_transport=platform` (plattformen). I Kristinehamns uttag är 90 noder
bus_stop och 101 plattformar, av 180 objekt.

Det gör ingenting, eftersom **vi räknar aldrig hållplatser, vi tar den
närmaste**. Två objekt som är samma hållplats ger samma svar. Hade vi skrivit
"4 hållplatser inom 300 m" hade dubbletterna gjort det talet falskt, och det är
ett av skälen till att den raden inte finns.

En sak följer ändå av det: plattformen är ofta namnlös medan stolpen bär
namnet, och plattformen kan ligga några meter närmare. Är den närmaste
hållplatsen namnlös får därför en NAMNGIVEN inom 25 meter ta över, för på det
avståndet är det samma hållplats. En namngiven tvåhundra meter bort är en annan
hållplats och lånas aldrig ut.

En namnlös hållplats visas ändå: avståndet till den är lika sant, och raden blir
"Busshållplats · 80 m". Att hitta på ett namn ur gatan intill hade varit en
gissning läsaren inte kan avslöja.

---

## 6. Parkeringen

### 6.1 Parkeringarna räknas, platserna gör det inte

`amenity=parking` bär `capacity` på **16 av 174 parkeringar i Kristinehamns
uttag, alltså 9,2 procent**. Att summera platser över de parkeringar som råkar
bära ett tal ger en siffra som ser fullständig ut och inte är det: "142
platser" när nio av tio parkeringar inte är räknade alls.

Raden är därför **"3 parkeringar inom 200 m · närmast 40 m"**, två tal vi kan
stå för var för sig. `capacity`, `fee` och `parking` läses inte ens in.

### 6.2 Vilka parkeringar som räknas

Alla utom de vars `access` är `private`, `no`, `permit`, `military` eller
`employees`. En parkering bakom en bom är ingen parkering för den som läser
sidan.

Ett uttryckligt `access=yes` krävs INTE, och det är ett mätt val: 134 av 174
parkeringar i Kristinehamns uttag saknar `access` helt. Ett sådant krav hade
kastat tre fjärdedelar av beståndet på en tagg som mappare sällan sätter.

### 6.3 Noll skrivs aldrig ut

"0 parkeringar inom 200 m" är ett påstående om att det inte finns några, och
det vi vet är bara att OpenStreetMap inte har kartlagt några. Pipelinen skriver
inget fält alls i det läget, och sidan visar ingen rad.

---

## 7. Var pillen sitter, och var de andra tog vägen

Ednia har ett föremål per hörn. Vi har inte det.

| Hörn | Ednia | Vi, i dag |
|---|---|---|
| uppe till höger | expandera | helskärm PLUS zoomstapel |
| nere till vänster | upphovsraden | tomt |
| nere till höger | **pillen** | upphovsraden (`AttributionControl`, `compact: false`) |
| underkantens mitt | tomt | platshållarknappen "Utforska kartan" |

Upphovsraden ligger på `bottom-right` i alla tre kartorna på sajten:
`Karta.astro` rad 2087, `OmradeKarta.astro` rad 693 och `Platskarta.astro`.

**Domen: pillen står under kartan i den här omgången, inte i hörnet.**
`Platskarta.astro` ägs av en annan agent och rördes inte. Avsnittet
"Ta dig hit" ligger därför direkt under kartan, mellan den och öppettiderna,
vilket också är rätt ordning för läsaren: kartan svarar på VAR, avsnittet på
HUR, öppettiderna på NÄR.

**Vad som krävs för att flytta in den i hörnet**, när `Platskarta.astro` är
ledig, och det är tre ändringar och inte en:

1. **Upphovsraden flyttar till `bottom-left`**, som hos Ednia. Ett argument i
   `karta.addControl(new AttributionControl({ compact: false }), 'bottom-left')`.
   ODbL bryr sig om att upphovet är rimligt synligt, inte om vilket hörn.
2. **Platshållarknappen "Utforska kartan" måste lämna underkantens mitt.**
   Uppmätt i 390 px är kartan 358 px bred och knappen omkring 140 px, alltså
   109–249. En pille på 140 px i höger hörn tar 206–346. De överlappar med
   43 px så länge kartan inte vaknat.
3. **Platskartas egen rad `.vagbeskrivning` ska bort**, annars har sidan två
   knappar som gör samma sak. Det är den dubblering §4.1 beskriver.

Fram till dess står pillen där den står, och det är inte ett provisorium som
måste rättas: en knapp under kartan är fullt läsbar, och Platskartas egen
kommentar räknade redan fram samma svar av samma skäl.

---

## 8. Täckningen

### 8.1 Nämnaren

Nämnaren är **verksamheter med en användbar koordinat**, alltså inte alla
15 983 rader. 2 431 saknar koordinat helt och 237 har en som bara är gatunivå;
ingen av dem kan få ett avstånd av något skäl som har med hållplatser att göra,
och att räkna dem i nämnaren mäter geokodningen och inte det här.

Nämnaren är alltså **13 379** rader av 16 047.

Det är en ANNAN nämnare än öppettidernas i `docs/33`, och det är avsiktligt.
Öppettider mäts mot de konsumentvända, eftersom ett förskolekök inte har
några. En hållplats åttio meter från ett förskolekök ligger däremot verkligen
åttio meter därifrån, och uppgiften skrivs på alla rader med koordinat.

### 8.2 Talen per kommun

Mätt 2026-08-18 mot Overpass-uttag hämtade samma dag. "Med koordinat" är
nämnaren i §8.1: rader med en koordinat som inte bara är gatunivå.

| Kommun | Rader | Med koordinat | Hållplats inom 500 m | Andel | Parkering inom 200 m | Andel |
|---|---:|---:|---:|---:|---:|---:|
| Stockholm | 8 520 | 8 520 | **8 481** | **99,5 %** | **6 610** | **77,6 %** |
| Uppsala | 1 854 | 828 | **821** | **99,2 %** | **760** | **91,8 %** |
| Örebro | 1 233 | 566 | **543** | **95,9 %** | **519** | **91,7 %** |
| Karlstad | 696 | 696 | **649** | **93,2 %** | **597** | **85,8 %** |
| Linköping | 1 246 | 1 246 | **1 134** | **91,0 %** | **1 042** | **83,6 %** |
| Jönköping | 1 115 | 1 115 | **984** | **88,3 %** | **808** | **72,5 %** |
| Kristinehamn | 170 | 170 | **118** | **69,4 %** | **120** | **70,6 %** |
| Oskarshamn | 239 | 238 | **140** | **58,8 %** | **150** | **63,0 %** |
| Borgholm | 406 | 0 | 0 | – | 0 | – |
| Höganäs | 316 | 0 | 0 | – | 0 | – |
| Lomma | 153 | 0 | 0 | – | 0 | – |
| Svenljunga | 99 | 0 | 0 | – | 0 | – |
| **Summa** | **16 047** | **13 379** | **12 870** | **96,2 %** | **10 606** | **79,3 %** |

Tre saker är värda att stanna vid.

**Täckningen är mycket högre än öppettidernas**, 96,2 mot 27,6 procent, och
skälet är att hållplatsen inte kräver någon hopparning. Öppettiden måste
tillhöra RÄTT verksamhet, alltså måste namnen stämma; avståndet till en
hållplats kräver bara att vi vet var verksamheten ligger. Hela §4 i `docs/33`,
med sina namnregler och sin tvetydighetsprövning, har ingen motsvarighet här.

**De fyra nollorna är samma fyra som i `docs/33`, och av samma skäl.**
Borgholm, Höganäs, Lomma och Svenljunga publicerar ingen gatuadress att
geokoda, alltså har de inga koordinater alls. Deras uttag innehåller 927
hållplatser och 723 parkeringar som vi inte kan nå. Se `docs/33` §10.1: det som
öppnar dem är att kommunen börjar lämna ut adressen, ingenting annat.

**Uppsalas och Örebros nämnare är mycket mindre än deras radantal**, 828 av
1 854 och 566 av 1 233. Det är samma geokodningslucka: 868 respektive 588 rader
saknar nål, och 158 respektive 79 har en som bara är gatunivå.

### 8.3 Vilka radier som mättes, och varför 500 och 200 valdes

`--matt` skriver ut täckningen vid sex radier. Ur körningen 2026-08-18:

| Radie | Hållplats | Parkering |
|---|---:|---:|
| 100 m | Stockholm 53,3 %, Linköping 26,2 %, Kristinehamn 21,2 % | 41,9 %, 54,3 %, 53,5 % |
| 200 m | 87,1 %, 60,2 %, 48,2 % | **77,6 %, 83,6 %, 70,6 %** |
| 300 m | 96,9 %, 79,8 %, 60,6 % | 91,5 %, 90,2 %, 81,8 % |
| **500 m** | **99,5 %, 91,0 %, 69,4 %** | 99,2 %, 94,3 %, 87,6 % |
| 800 m | 99,9 %, 93,8 %, 80,6 % | 99,9 %, 96,2 %, 90,0 % |
| 1 200 m | 100 %, 95,4 %, 88,8 % | 100 %, 97,4 %, 92,9 % |

**Hållplatsen: 500 meter.** Steget från 300 till 500 ger fortfarande riktiga
träffar i glesa kommuner, Kristinehamn går 60,6 till 69,4. Steget därefter, 500
till 800, köper 11 procentenheter i Kristinehamn men bara 0,4 i Stockholm, och
det som köps är hållplatser man inte längre skulle gå till. Vid 800 meter
fågelvägen är gångvägen närmare en kilometer.

**Parkeringen: 200 meter.** Här är resonemanget det motsatta, för raden är ett
ANTAL och inte ett avstånd. Ju vidare radie desto större tal, och ett stort tal
är inte ett bättre besked: "23 parkeringar inom 500 m" säger ingenting till den
som letar plats. 200 meter är en gångväg på ett par minuter även när kvarteret
tvingar en runt, och det är den radie där talet fortfarande betyder "här kan du
ställa bilen".

### 8.4 Trafikslagen och namnen

| Trafikslag | Antal av 12 870 |
|---|---:|
| Buss | 11 501 |
| Tunnelbana | 752 |
| Spårvagn | 234 |
| Färja | 198 |
| Tåg | 185 |

**12 706 av 12 870 hållplatser har ett namn, 164 saknar det.** De namnlösa
visas ändå, som "Busshållplats · 80 m": avståndet är lika sant, och att hitta
på ett namn ur gatan intill hade varit en gissning läsaren inte kan avslöja.
Att andelen namnlösa är så låg som 1,3 procent beror på namnlånet i §5.5.

---

## 9. Hur det körs om

```
python3 pipeline/narhet.py --matt site/src/data/*.json      # mäter, skriver inget
python3 pipeline/narhet.py site/src/data/*.json             # skriver stop och parking
python3 pipeline/narhet.py --refresh site/src/data/*.json   # hämtar OSM på nytt
```

Uttaget cachas i `pipeline/data/interim/osm_narhet_<kommunkod>.json`, utanför
versionshanteringen precis som matpunkterna i `oppettider.py` och adresserna i
`geocode.py`. Utan `--refresh` görs inga nätanrop för en kommun som redan har
sitt uttag.

**Hållplatser och parkeringar hämtas i EN fråga per kommun**, alltså tolv anrop
och inte tjugofyra. Overpass svarade 504 på sju av tolv kommuner i
öppettidskörningen 2026-08-17 och betedde sig likadant här; klienten lånas
därför rakt av ur `oppettider.py`, med dess två speglar och dess avbackning.
Den skrivs inte av: en andra kopia hade glidit isär från den första första
gången någon lagar en bugg i den ena.

**Noll objekt är ett fel och inte ett utfall.** Samma dom som matpunkterna
redan lyder under, och av samma skäl: Overpass svarar 200 med en TOM lista när
områdesuppslaget inte gått fram, och Örebro drabbades av just det 2026-08-17.
Skrevs den tomma listan till disk hade nästa körning läst den ur cachen och
tyst tagit bort uppgiften i hela kommunen.

Proven:

```
python3 pipeline/tests/test_narhet.py     # 27 prov
```

---

## 10. Vad det kostade i filer och i rader

**Noll nya sidor.** Inga nya routes, ingen ny sidtyp. Avsnittet ritas på sidor
som redan finns. Filtaket är hårt: grinden i `astro.config.mjs` fäller bygget
vid 19 500 filer och vi ligger på 17 000.

**Två rader per verksamhet i datafilerna**, och det är ett mätt val. Formen är
två packade strängar och inte två objekt:

```json
 "stop": "Stadshuset|bus|80",
 "parking": "3|40",
```

Ett nästlat `narhet`-objekt med namn, trafikslag, avstånd, antal och datum hade
med `indent=1` blivit sju rader gånger elva tusen verksamheter, alltså över
70 000 rader, och gjort varje framtida diff oläsbar. Samma dom som veckoschemat
fick i `docs/33` §8. Uppackningen är en `split` i `site/src/lib/narhet.ts`.

**Datumet står en gång per fil** och inte på varje verksamhet, i
`narhet`-blocket bredvid `source`. Det är samma datum för hela uttaget. Att
`hours.checkedAt` och `contact.checkedAt` upprepas per verksamhet är ett arv
och inte en förebild; de kostar tillsammans dryga 6 000 rader som inte säger
något nytt.

---

## 11. Vad som INTE byggdes, och varför

**Inget filter på "nära kollektivtrafik".** Ett filter DÖLJER, och det som döljs
här hade varit de verksamheter vi inget vet om. Samma dom och samma tröskel som
`docs/33` §7. En visning har ingen nedsida; ett filter har det.

**Ingen sortering på avstånd till hållplats**, av samma skäl.

**Inget tal som påstår fullständighet.** Ingen "12 procent av restaurangerna i
Jönköping ligger nära buss": nämnaren i ett sådant tal är vår datalucka och inte
verkligheten.

**Inget antal hållplatser.** Se §5.5: dubbelkartläggningen hade gjort talet
falskt.

**Inget platsantal på parkeringarna.** Se §6.1.

**Ingen JSON-LD.** Samma dom som öppettiderna fick i `docs/33` §6.6.
`schema.org` har ingen egenskap för "närmaste hållplats fågelvägen enligt
OpenStreetMap", och den som skulle tvinga in det i `publicAccess` eller
`amenityFeature` hade tappat förbehållet precis där maskinen läser.

---

## 12. Vad som återstår

1. **Flytta in pillen i kartans hörn** när `Platskarta.astro` är ledig. Tre
   ändringar, se §7.
2. **Ta bort dubbleringen.** Platskartas `.vagbeskrivning` och den nya pillen
   gör samma sak. §4.1.
3. **Kör om uttagen med jämna mellanrum.** OSM ändras, och `narhet.checkedAt`
   står i filen så att en gammal uppgift åtminstone är märkt som gammal.
4. **Räkna om §5 om vi någonsin kör en egen ruttmotor för något annat.** Då är
   riktigt gångavstånd nästan gratis, och då ska fågelvägen bytas ut. §3.3.
5. **Rör inte de fyra kommunerna med noll.** Det är inte hållplatsspåret som är
   stoppat där, det är att kommunen inte publicerar en adress att geokoda. Se
   `docs/33` §10.1.
