# 23. Rikskartan: en kartyta, många ingångar

Skriven 2026-08-08 på ägarens beställning. Allt som står som mätt är mätt i den
här sessionen, med kommandot eller skriptet angivet. Allt som är en
uppskattning är märkt som en uppskattning och bär sitt antagande.

Ägarens ord: "hela kartvyn är skum ... kartvyn är väl för hela sverige ... nu
har vi så mycket olika platssidor känns det som", och "söker man på en kommun
tex i sök ska man komma till split screen på karta och lista".

Och principen som avgör var gränsen går: **"jag köper sidor för SEO men inte
för funktioner."** En sida får finnas för att den kan rankas. En funktion får
aldrig kosta en sida, och den delade vyn är en funktion.

---

## Del 1. Mätningen

### Var vi står i dag

| | Tal | Källa |
|---|---|---|
| Verksamheter i beståndet | 15 983 | `site/src/data/*.json` |
| Med känd plats, alltså nål | 13 544 | summan av `x.length` i `dist/kartdata/*.json` |
| Kommuner med kartsida | 8 av 12 | fyra lämnar inga koordinater alls |
| Kartdata, okomprimerat | 523 961 byte | `dist/kartdata/` |
| Kartdata, gzip -9 | 208 049 byte | 15,4 byte per punkt |
| Största enskilda fil | Stockholm, 125 082 byte gzip | 8 511 punkter |
| Filer i bygget | 16 534 | `find dist -type f \| wc -l` |
| Kvar till Cloudflare Pages tak | 3 466 | taket är 20 000 |

Kolumnformatet i `map-data.ts` är alltså mycket bra på det det gör. 15,4 byte
per punkt inklusive namn, typ, bedömning, datum, kontrollantal och utmärkelse
är ungefär hälften av vad en vektorruta klarar för samma innehåll. Det ska
sägas rakt ut, för det betyder att bytet nedan inte görs för att formatet är
dåligt.

### Vad som faktiskt går sönder vid 290 kommuner

Inte totalen. 90 000 punkter i samma format är omkring 1,4 MB gzippat, vilket
är mycket men inte omöjligt att lägga i objektlagring.

Det som går sönder är att **det inte finns någon fil som svarar på frågan "vad
finns i den här rektangeln".** En fil per kommun kan bara svara på "vad finns i
Linköping". En rikskarta som står över Skåne behöver punkterna i trettiotre
kommuner, och en rikskarta som står över hela landet behöver inga punkter alls
utan sammanslagna tal. Ingen kommunfil ger något av det.

Den andra halvan är filtaket. Delar man i stället upp datan geografiskt som
vanliga filer, en per ruta, blir det så här många rutor. Räknat på de riktiga
koordinaterna, alltså bara rutor som innehåller minst en punkt:

```
z 0       1 rutor      z10      54      z13     448
z 5       1            z11     108      z14     813
z 8      13            z12     237      kumulativt 1 719
```

1 719 filer för tolv kommuner ryms i de 3 466 vi har kvar. Fortsättningen gör
det inte. Antalet rutor på z13 och z14 följer YTAN vi täcker och inte antalet
punkter: en ny kommun med 300 verksamheter i en tätort lägger till ungefär lika
många z14-rutor som en kommun med 3 000. Vi täcker i dag ett sextiotal tätorter
av landets omkring 2 000. Tio till tjugo gånger dagens rutantal ger 8 000 till
16 000 rutor bara på z14, och 15 000 till 30 000 kumulativt. Det är två till
åtta gånger hela filbudgeten, för enbart kartan.

**Slutsats: rutorna får inte vara filer. De måste ligga i EN fil.**

### Sidoanteckning som inte är den här planens problem

Bygget ligger på 16 534 filer för tolv kommuner. Vid 290 talar vi om
storleksordningen 400 000. Kartan är alltså inte det som fäller filbudgeten,
verksamhetssidorna är det, och `docs/adr/0001-rendering-strategi.md` säger att
bytet till hybrid ska ske vid omkring 15 000 sidor. Den gränsen är redan
passerad. Se risk 1 i `docs/22_teknisk_och_ux_granskning.md`. Rikskartan löser
inte det och gör det inte värre: den lägger till en fil, inte tusen.

---

## Del 2. Ruthierarkin

### Kravlistan, och vad den utesluter

1. Allt sker vid bygget. Ingen server hos oss.
2. Inga anrop till en betaltjänst per besökare. Kartbladen kommer från
   OpenFreeMap, gratis och utan nyckel, och gör det även efter det här.
3. En fil, inte tusentals.
4. **Bygget kör på Cloudflare Pages byggbild och i GitHub Actions.** Det är det
   villkoret som gör mest. Ett verktyg som kräver `brew install`, en
   kompilator eller root går inte att lägga i `npm run build`. Tippecanoe är
   det uppenbara verktyget för jobbet och faller på just det: det är C++, det
   finns inte i Ubuntus paketkällor, och Pages byggbild ger ingen root. Att
   bygga arkivet i nattkörningen och checka in en binärfil på flera megabyte
   varje natt är inget alternativ, det sväller repot.

Kvar står: **hela pyramiden byggs i Node, med rena JavaScript-paket, i ett
prebuild-steg vid sidan av `kopiera-maplibre.mjs`.**

### Kedjan, och varför varje led är valt

```
verksamheter med koordinat
        │
        ▼
  supercluster 8.0.1        SAMMA bibliotek MapLibre redan använder, men
        │                   kört en gång vid bygget i stället för i varje
        │                   besökares webbläsare
        ▼
  index.getTile(z,x,y)      ger färdiga rutobjekt, både klusterpunkter och
        │                   lösa nålar, per zoomnivå
        ▼
  vt-pbf 3.1.3              kodar rutobjektet som Mapbox Vector Tile
        │
        ▼
  gzip -9
        │
        ▼
  PMTiles v3                en enda fil med egen katalog, läst av
                            webbläsaren med HTTP-räckviddsförfrågningar
```

Att klustringen görs av **samma bibliotek som i dag** är hela poängen med
valet. `cluster: true` på en GeoJSON-källa i MapLibre ÄR supercluster i en
arbetare. Vi flyttar alltså inte klustringen till ett annat verktyg med ett
annat utseende, vi flyttar den från besökarens telefon till byggservern med
samma parametrar. Kartan ska se likadan ut efter bytet, och det är ett krav och
inte en förhoppning.

**En detalj som kostade en felmätning och måste stå här.** MapLibre skalar
`clusterRadius` innan den skickas till supercluster:

```js
radius = clusterRadius * (EXTENT / tileSize)   // maplibre-gl-dev.mjs rad 3303
```

`EXTENT` är 8192 och `tileSize` 512, alltså faktor 16. Vår `clusterRadius: 38`
blir därmed `radius: 608` vid `extent: 8192`, alltså kvoten 0,0742. Sätter man
`radius: 38` rakt av mot `extent: 4096` klustrar man **åtta gånger för hårt**,
och första mätningen gav 2 443 oklustrade namngivna punkter i en enda z11-ruta
och ett arkiv på 2,25 MB. Rätt kvot ska räknas fram ur den extent pipelinen
använder, inte skrivas av.

### PMTiles-skrivaren skriver vi själva

Det finns ingen etablerad PMTiles-skrivare för Node. `pmtiles` på npm är en
LÄSARE, och `s2-pmtiles` har visserligen en skrivare men bygger upp filen genom
att trycka in en byte i taget i en JavaScript-array, vilket inte håller för ett
arkiv på nio megabyte.

Formatet är däremot publicerat och stabilt, och skrivsidan är omkring 150 rader:
ett huvud på 127 byte, en katalog i fyra varint-kolumner, valfria lövkataloger
när roten inte ryms i 16 384 byte, och rutdatan efter. `tileId`-beräkningen
längs Hilbert-kurvan **importeras från läsaren** (`zxyToTileId` ur `pmtiles`),
så skrivare och läsare kan per definition inte bli oense om vilken ruta ett tal
betyder.

Det ger tre beroenden totalt: `supercluster` och `vt-pbf` vid bygget, `pmtiles`
i webbläsaren för MapLibres protokollhandtag.

### Mätningen på riktig data

Prototypen kör hela kedjan på beståndets 13 544 punkter och läser sedan
tillbaka arkivet med **det officiella `pmtiles`-paketet**, alltså exakt den kod
webbläsaren kommer att köra:

```
punkter         13 544
rutor            1 719
lövkataloger         0   (allt ryms i rotkatalogen)
rotkatalog       3 799 byte
arkiv        1 447 378 byte = 1,38 MB
byggtid            242 ms

officiella läsaren: specVersion 3, tileType 1, zoom 0-14, clustered true
1 719 rutor lästes tillbaka byte för byte identiska, 0 fel
tom ruta ger undefined
```

Vikten per ruta, som är det enda besökaren betalar:

| | byte gzip |
|---|---|
| Typisk ruta | under 1 000 |
| Största ruta i landet (z14 över Norrmalm, 862 punkter) | 27 525 |
| Utsnitt över Sergels torg, kartruta 752 × 836 px, z10 | 2 600 |
| samma utsnitt, z12 | 26 300 |
| samma utsnitt, z14 | 83 700 |

**Jämförelsetalet som avgör saken:** i dag kostar Stockholms kartsida 125 kB
gzippat innan en enda nål ritas, oavsett var man tittar. Med rutor kostar samma
första vy 2,6 kB. Den dyraste tänkbara vyn i landet, maxzoom mitt på Norrmalm,
kostar 84 kB, alltså fortfarande mindre än vad Stockholm kostar i dag för att
bara öppna kartan.

### Byggt och kört i webbläsaren

Pipelinen ligger nu i `src/lib/kartrutor.ts` och `src/lib/pmtiles.ts`, och
arkivet skrivs av rutten `pages/kartrutor/[file].pmtiles.ts`. Bygget säger:

```
Rutarkivet kartrutor/punkter-6646b77a6cfe.pmtiles går att läsa: 1,31 MB,
1 720 rutor, z0-14. Tyngsta provade rutan z14/9014/4817 är 50,3 kB uppackad
med 856 features.
```

Grinden i `scripts/kartrutegrind.mjs` öppnar den färdiga filen med det
officiella `pmtiles`-paketet, packar upp pyramidens topp och landets tätaste
ruta, och kräver att varje bubbla bär `ez` och `bx`. En egen skrivare utan en
mätning är ett löfte.

Arkivet är sedan laddat i MapLibre 6 i en riktig webbläsare, mot vår egen
kartstil, över en server som svarar `206 Partial Content`:

| | Utfall |
|---|---|
| z4 över Sverige | 5 bubblor, 0 nålar, 13 577 verksamheter summerade |
| z15 över Sergels torg | 691 nålar, noll bubblor |
| Attribut på en nål | `{i, v, m, nm: "Stockholm Inn Hotel & Cafe", ty: "Café", dt, k}` |
| Attribut på en bubbla | `{point_count: 9465, point_count_abbreviated: "9.5k", ez: 5, bx: "17.19714,59.23140,18.20097,60.02940"}` |
| Fel i konsolen | inga |
| Överfört under hela sessionen | nio räckviddssvar, 655 byte till 26 kB styck, omkring 165 kB totalt |

Den sista raden är hela poängen. Arkivet är 1,31 MB och webbläsaren hämtade
aldrig det: den läste huvudet, katalogen och de rutor den behövde.

`pmtiles`-läsaren väger 18,4 kB minifierad, alltså ungefär 7 kB brotlad, och
laddas bara på kartsidan.

### Maxzoom 14, och varför inte högre

| maxzoom | arkiv | rutor | största ruta |
|---|---|---|---|
| 14 | 1,38 MB | 1 719 | 26,9 kB |
| 15 | 2,27 MB | 3 370 | 26,9 kB |
| 16 | 3,36 MB | 6 588 | 26,9 kB |

Den största rutan krymper inte av en högre maxzoom, eftersom z14-rutorna finns
kvar och det är de som är tunga. Över maxzoom överzoomar MapLibre den ruta den
redan har, gratis och ur cachen. Högre maxzoom kostar alltså 2,4 gånger
lagringen för noll nytta åt besökaren. **Maxzoom 14.**

### Vid 290 kommuner

Uppskattning, med antagandet utskrivet: z12 till z14 står för 1,29 MB av 1,38,
och de nivåerna skalar i stort sett linjärt med antalet punkter, eftersom varje
punkt förekommer en gång per nivå. 90 000 punkter är 6,6 gånger dagens 13 544.

- **Arkivet: storleksordningen 9 MB.** En fil.
- **Filbudgeten: oförändrad.** Kartan är en fil vid 12 kommuner och en fil vid
  290. Det är hela skälet till att kartan blir bättre av fler kommuner i
  stället för fler.
- **Sidvikten: oförändrad.** Besökaren hämtar sitt utsnitt, inte arkivet.

Taket att hålla ögonen på är Cloudflare Pages gräns på 25 MiB per fil. Nio
megabyte är omkring 37 procent av den. Skulle beståndet växa väsentligt utöver
riket delas arkivet per landsdel, vilket är ett par filer och inte tusen.

### Vad rutorna bär

Rutorna bär ALLA attribut som listan och kortet behöver. Det är ett val mot
alternativet att bara bära ett id och hämta resten.

Skälet är att rutan bara hämtas för det utsnitt man tittar på. Att i stället
skicka id och sedan hämta namnen hade lagt en andra rundtur mitt i en
panorering, vilket är precis den väntan `map-data.ts` beskriver som skälet till
att inte fråga en server per panorering. Listan ska följa med medan man drar,
och det kan den bara om allt den behöver redan ligger i rutan.

Två saker skickas ändå inte:

- **Slugen.** Den härleds ur namnet med `lib/slug.ts` för 8 246 av Stockholms
  8 511 rader. Undantagen bär en egen egenskap. Samma grind som i dag: bygget
  jämför alltid härledningen mot den slug pipelinen satte, så en felräknad slug
  kan inte nå klienten.
- **Kommunens namn.** Nålen bär ett kommunindex, och ordboken står i sidans
  HTML. Den behövs för länken `/<kommun>/<slug>/`, som i en rikskarta inte
  längre har en enda kommun att utgå från.

### Det klustringen kostar, och vad vi får igen

En vektorrutekälla i MapLibre kan **inte** klustras. `cluster: true` finns bara
på GeoJSON-källor, och med den försvinner också `getClusterExpansionZoom()` och
`getClusterLeaves()`, som `delaKluster()` i `Karta.astro` bygger hela sitt
beteende på.

Det låter som en förlust och är det motsatta. De två anropen är asynkrona i
dag, alltså en väntan mitt i ett klick. Vid bygget kan vi fråga supercluster om
samma saker och **baka in svaren i klusterpunkten**:

| Egenskap | Innehåll | Ersätter |
|---|---|---|
| `n` | antal verksamheter | `point_count` |
| `ez` | expansionszoom | `getClusterExpansionZoom()` |
| `bx` | lövens utbredning, fyra tal | `getClusterLeaves()` plus min/max |

`delaKluster()` blir därmed synkron och gör exakt samma sak som i dag: lägg
kameran på `bx`, dock minst `ez`. Väntan försvinner.

Det enda fall som blir sämre är klustret vars löv ligger på SAMMA ADRESS,
alltså Sturegallerian. I dag öppnas stapelkortet direkt ur löven. Efter bytet
flyger kameran i stället in till den zoom där nålarna finns, och stapelkortet
öppnas när rutan landat. Ett steg till i maskineriet, samma resultat på
skärmen, och grinden mot återvändsgränd står kvar: en bubbla kan aldrig sluta i
ingenting.

### Risken med räckviddsförfrågningar

PMTiles bygger på att servern svarar på `Range`. Cloudflare Pages gör det för
statiska filer, men det är ett antagande vi inte får bygga på utan att mäta i
drift:

```
curl -s -o /dev/null -D - -H 'Range: bytes=0-127' https://prikko.se/kartrutor/<fil>.pmtiles
```

Svaret ska vara `206 Partial Content` med `Content-Range`. Läsaren felar
dessutom högljutt av sig själv om servern skickar hela filen på en
räckviddsbegäran, alltså kan felet inte passera obemärkt.

Faller det, är reservvägen att skriva rutorna som vanliga filer men bara ned
till z11, alltså 221 filer i dag och kanske 2 000 vid full täckning, och låta
MapLibre överzooma därifrån. Det ryms i filbudgeten, ger sämre precision i
nålarnas placering vid hög zoom, och är en försämring vi tar bara om vi tvingas.

---

## Del 3. Den delade vyn

### Vad Booli faktiskt gör

**Källkritik först, eftersom det är en stående regel här.** Raderna nedan är av
två slag, och de får inte blandas ihop.

MÄTT i webbläsaren vid ett tidigare tillfälle, och nedskrivet i
`KartaPuff.astro` där mätningen gjordes:

| | Booli | Vi |
|---|---|---|
| Vid 1440 px | kartan är ett FAST lager på hela högra halvan, 752 × 836 px | Samma mått. Vår lista ligger redan till vänster. |
| Listspalten | 688 px, rullar bredvid | Samma bredd |
| Vid 390 px | listan och kartan byter plats via knappen "Visa karta" i kontrollraden överst, 40 px hög med 4 px radie, inte en svävande knapp ovanpå innehållet | **Vi avviker: ark i tre lägen, se nedan** |

ÄNNU INTE MÄTT av oss, och därför inte talat om som fakta. En mätning är
beställd och tabellen fylls i när den kommer. Ingen av punkterna blockerar
arbetet, eftersom de rör kortens form och inte arkitekturen:

- Exakt `grid-template-columns` och var brytpunkterna ligger.
- Sidhuvudets höjd och om det ligger kvar när listan rullar.
- Hur högt filterhuvudet över listan är och vad det består av.
- Kortens mått, om de ligger i en eller två spalter, och bildstorleken.
- Om det är sidindelning eller oändlig rullning i listan.
- Om URL:en bär kartans utsnitt, och om panorering gör nätverksanrop.

Det vi däremot vet om oss själva och som avgör de tre avvikelserna nedan står i
våra egna filer: `pages/[kommun]/karta.astro` för app-ytan, `Karta.astro` för
fragmentet och arket, `Header.astro` för sidhuvudets 58 px.

### De tre ställen vi avviker, och varför

**1. App-yta, inte dokument.** Boolis karta är ett FAST lager, alltså ligger
den still medan dokumentet rullar under den. Vår sida fyller i stället exakt
höjden under sidhuvudet och skrollar aldrig på sidnivå; listan skrollar i sin
egen spalt.
Det är ett avgjort ärende och inte en smakfråga: det var ägarens andra klagomål
på raken om skroll på den här sidan, och en sticky karta löste det aldrig
eftersom teckenförklaring och sidfot låg kvar under och gav sidan en svans.
Motiveringen står redan i `pages/[kommun]/karta.astro` och ändras inte här.

**2. Adressen bär utsnittet.** Om Booli gör det är ännu inte mätt, och det
spelar mindre roll: ägaren har begärt att adressen gör det hos oss, och han har
rätt. En delad vy som inte går att dela är en app och inte en sida. `#map=zoom/lat/lng` finns redan, läses redan av
`Karta.astro`, och är OpenStreetMaps form. Det utvidgas till att bära filter,
med `&` mellan nycklarna precis som OSM gör:

```
#map=15/59.331/18.065
#map=15/59.331/18.065&typ=restauranger
#map=12/58.410/15.621&q=sushi
```

FRAGMENT och inte frågesträng, och det är ett redan fattat integritetsbeslut:
enligt HTTP skickas fragmentet aldrig med i en begäran, så en position lämnar
aldrig enheten. Avrundningen till tre decimaler, omkring 110 meter, är den
siffra integritetspolicyn anger och MÅSTE behållas när kartan börjar skriva
tillbaka till fragmentet själv.

Skrivningen sker med `history.replaceState`, aldrig `location.hash =`, annars
fyller varje panorering historiken så att bakåtknappen slutar fungera.

**3. Kartan finns kvar på smal skärm.** Booli växlar mellan lista och karta med
knappen "Visa karta" vid 390 px, alltså två vyer man hoppar emellan och aldrig
ser samtidigt. Vi har ett ark i tre lägen som redan är byggt, redan godkänt och
redan låser dokumentet med `lib/page-lock.ts`. Det byggs inte om.

### Beteendet per skärm

| | Karta | Lista | Filter |
|---|---|---|---|
| **Skrivbord, 1280 px och uppåt** | höger, 752 px vid 1440, fyller höjden under sidhuvudet, skrollar aldrig | vänster, 688 px vid 1440, skrollar i egen spalt, två kortspalter | fält i listhuvudet |
| **Surfplatta, 1024 till 1279 px** | höger, listan krymper till omkring 512 px och kartan tar resten | vänster, EN kortspalt, annars blir korten smalare än sin egen text | samma fält |
| **Under 1024 px** | hela ytan, bakom arket | ark underifrån i tre lägen: remsa, halv, hel. `page-lock` låser dokumentet så länge arket är uppe | i arkets huvud, följer med när arket dras |
| **Utan JavaScript** | ingenting | vanligt dokument: rubrik, sextio serverrenderade rader, länk till hela listan | inget |

Talen för surfplattan är satta av oss och inte hämtade från någon, eftersom
Boolis brytpunkter ännu inte är mätta. De ska mätas innan de skrivs in i CSS.

Kortens form, en spalt mot två och bild mot ingen bild, är formgivningsarbete
och ligger utanför den här planen.

---

## Del 4. Sidorna

Här gäller ägarens princip ordagrant: sidor köps för SEO, inte för funktioner.

### En kartyta, många dörrar

"En yta, inte tolv" betyder **en komponent, en datamängd, ett beteende.** I dag
finns tolv kartytor i den meningen som spelar roll: varje kommun har sin egen
datafil, sitt eget utsnitt och sin egen instans, och ingen av dem vet att de
andra finns. Efter bytet finns ett arkiv, en komponent och ett beteende.

Att den ytan går att nå på flera adresser gör den inte till flera ytor, lika
lite som att `/stockholm/` och `/uppsala/` är samma sidmall gör dem till samma
sida. Dörrarna finns för att de kan rankas. Ytan bakom är en.

| Adress | Vad den är efter bytet |
|---|---|
| `/karta/` | NY. Rikskartan, öppnar på hela Sverige. Serverrenderar kommunlistan med tal, alltså en riktig ingång till varje kommunsida och inte en tom app. |
| `/<kommun>/karta/` | **Står kvar med sin adress.** Samma komponent, samma arkiv, men öppnar på kommunens utsträckning och serverrenderar kommunens sextio första rader precis som i dag. |
| `/<kommun>/` | Kommunhubben. Oförändrad som sidtyp. |
| `/<kommun>/omrade/<omrade>/` | Områdessidan. Se nedan, den är redan byggd. |
| `/<kommun>/kategori/<...>/` | Kategorisidan. Länkar in i kartan med kategorifiltret satt. |

Exakt EN sida tillkommer, `/karta/`, och den tillkommer för att "karta över
restauranger i Sverige" är en sökning och inte för att funktionen behöver den.
Det är en bedömning och inte en mätning.

### Varför `/<kommun>/karta/` inte omdirigeras

Tre skäl, i storleksordning.

1. **Adressen är publicerad.** `docs/adr/0003-slugen-ar-permanent.md` slår fast
   att en URL som behöver flyttas kräver ett omdirigeringsregister, och att ett
   sådant inte finns. Åtta kartsidor ligger i sitemapen och är crawlade.
2. **Frågan finns.** "Karta över hygienkontroller i Linköping" är en sökning
   med en adress som svarar exakt på den. En 301 till `/karta/#map=...` svarar
   med en sida vars titel säger Sverige, och fragmentet läser Google inte alls,
   så det som indexeras blir rikskartan tolv gånger. Det är dubblettinnehåll
   skapat med flit.
3. **Sidan blir inte tunn.** Den serverrenderar kommunens rubrik, sextio rader,
   teckenförklaring med riktiga tal och sin egen brödsmula.

Regeln som styr vilka kommuner som får en kartsida ändras inte: den som saknar
koordinater helt får ingen sida och ingen länk. Fyra av tolv i dag.

### Vad landningssidorna slutar göra

- **Områdessidan är redan omgjord** i commit `6129791`. `OmradeKarta.astro`
  ritar nu MapLibre mot vår egen stil med gränsen som ett lager ovanpå,
  omgivningen synlig och panorerbar, och verksamheter utanför gränsen nedtonade
  med storlek och opacitet men med behållen bedömningsfärg, eftersom grått
  betyder "ingen bedömning" överallt annars. Gamla stan väger 17,5 kB gzippat.
  Den lösningen är rätt och rivs inte. Den enda ändring den behöver av det här
  arbetet är att byta datakälla från kommunfilen till arkivet, i steg 7 nedan.
- **`KartaPuff.astro`** på kommunhubben ritar en punktbild vid bygget och
  väcker sedan MapLibre mot kommunens egen datafil. Punktbilden står kvar
  oförändrad: den kostar noll JavaScript och är vad den utan skript och
  Googlebot ser. Den levande kartan byter datakälla till arkivet, så att det
  inte finns två datavägar. Villkoren för uppvaknandet, `saveData`,
  `effectiveType` och tomgångsluckan efter `load`, står kvar ordagrant. Den som
  kommer från Google på telefon med dålig uppkoppling får punktbilden och
  betalar noll extra byte, precis som i dag.

Ägarens formulering var att landningssidorna ska sluta rita egna kartor. Den
läses här som att det inte får finnas en andra datakälla och en andra
kartimplementation, inte som att en godkänd karta ska rivas ut veckan efter att
den byggdes.

### Sökningen

I dag leder ett kommunförslag i sökpanelen till `/<kommun>/`. Ägaren: "söker
man på en kommun tex i sök ska man komma till split screen på karta och lista".
Kommunförslaget pekas alltså om till `/<kommun>/karta/` för de kommuner som har
en karta, och står kvar på hubben för de fyra som inte har det.

---

## Del 5. Ordningen arbetet görs i

Varje steg ska kunna pushas ensamt utan att sajten går sönder.

1. ~~**Pipelinen.**~~ KLAR. `src/lib/kartrutor.ts` bygger arkivet, `src/lib/pmtiles.ts`
   skriver det, och `pages/kartrutor/[file].pmtiles.ts` lägger ut det på en
   innehållsbaserad adress. `scripts/kartrutegrind.mjs` öppnar den färdiga
   filen med den läsare webbläsaren kör och stoppar bygget om något inte går.
2. ~~**Klienten byter källa.**~~ KLAR. `punktKalla()` läser rutorna,
   `delaKluster()` läser `ez` och `bx`, och antalsbrickan läser `h` och `n`.
   Kommunfilerna ligger kvar orörda som reserv.
3. **`/karta/`** byggs som ny sida.
4. **Adressen bär filter.** Fragmentet utvidgas, `history.replaceState` skriver
   tillbaka utsnittet.
5. **Landningssidorna** pekas in i kartan på rätt utsnitt.
6. **Sökningen** pekas om.
7. **Städningen.** `KartaPuff` och `OmradeKarta` byter datakälla. Först därefter
   tas `map-data.ts` och `pages/kartdata/[file].json.ts` bort. Båda
   komponenterna läser `data.body` för sina byggtidsbilder, så modulen kan inte
   bara raderas; punktbilderna behöver en egen liten datakälla.

## Tre saker som beter sig annorlunda efter steg 2

Ingen av dem är en bugg, alla tre följer av att punkterna inte längre ligger i
minnet, och alla tre är värda ägarens ögon.

**1. Rubriken räknar utsnittet, listan visar nålarna.** Förut var varje punkt
en rad, oavsett om kartan råkade rita den som en bubbla. Nu ligger nästan allt
i bubblor på kommunens öppningszoom: Stockholm har 8 488 verksamheter i vyn och
ett femtontal lösa nålar. Rubriken säger därför 8 488 och foten säger "Visar 14
av 8 488. Zooma in för att se resten." Alternativet, att låta rubriken säga 14,
hade varit falskt.

**2. Filtret gäller det man ser.** Fältet sökte förut igenom hela kommunen. En
rikskarta har ingen sådan mängd, och det var hela skälet till rutorna. Fältets
etikett har alltid lovat att det filtrerar vyn, och det är vad det gör. Den som
vill söka i hela landet gör det i sidhuvudets sökfält, som har hela registret.

**3. Bubblorna och brickorna göms medan ett filter är på.** De är räknade vid
bygget och kan inte räknas om i webbläsaren. En bubbla som säger 300 bredvid en
lista med fyra träffar påstår något som inte stämmer, och en bricka som säger
tolv likaså. Att gömma dem säger i stället sanningen: det här matchar, zooma in
för att se mer.

Mätt i webbläsaren mot det byggda utfallet: Stockholms kartsida kostade 125 kB
kartdata innan en nål ritades. Samma vy kostar nu 21,7 kB i fem
räckviddssvar. Två klick på bubblor tar 8 488 till 3 132 till 144, filtret ger
tre träffar på apotek, och arket på smal skärm fungerar som förut.

## Vad som INTE ändras

- Kommuner rangordnas aldrig på kontrollresultat. Ett kluster bär ANTAL, aldrig
  bedömning. En klusterfärg efter andel anmärkningar vore en värmekarta över
  vilka kvarter som sköter sig sämst, alltså exakt den rangordning sajten
  aldrig publicerar.
- Attributionen till OpenStreetMap står kvar både i kartans hörn och under
  kartan. Det är ett licenskrav, och ett kontrollelement som kan fällas ihop
  räknas inte som uppfyllt.
- Ingen förklarande brödtext, ingen text om varifrån datan kommer. Se
  `docs/18_sprakregler.md`.
- Kartbladen kommer från OpenFreeMap, gratis och utan nyckel. Rutorna med våra
  punkter ligger hos oss. Ingen tredje part får ett anrop per besökare.
- Astros scopeade stilar når inte element skapade med `createElement`. Kortens
  stilar ligger under `:global()` med en serverrenderad rot. Det har bitit fyra
  gånger.
- `feature-state` fungerar bara i paint-egenskaper. Den lyfta nålen har därför
  ett eget lager med ett filter, eftersom `icon-size` är en layout-egenskap.
