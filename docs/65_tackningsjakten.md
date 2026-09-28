# 65. Täckningsjakten: systemens fingeravtryck mot alla 290

**Datum:** 2026-09-28
**Vad det här är:** ett svep, inte en hämtare. Ingen rad i `site/` är rörd, och
den enda kodändringen i `pipeline/` är en mätning inskriven i `ecos.py`:s
inledning. Se avsnitt 8.
**Metod:** varje påstående nedan bär ett faktiskt HTTP-svar från den här dagen,
med statuskod och storlek. **24 060 anrop mot 1 539 värdnamn.** Alla gjordes med
`User-Agent: PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)`, högst
ett anrop i sekunden mot samma värd, `robots.txt` läst först, och varje värd som
svarade 403 eller 429 svartlistades direkt och rördes inte mer. Se avsnitt 2.3.
**Förhållande till `docs/42`:** det svepet sökte i **kataloger**. Det här söker
efter **systemens fingeravtryck**, alltså efter de adresser en viss produkt
alltid lägger sina data på, oavsett vilken kommun som kör den.

---

## 1. Slutsatsen först

**Noll nya kommuner har maskinläsbara kontrollresultat. Det är en mätning och
inte en lucka, och den är den mest kostsamma mätningen vi gjort, för den stänger
hela den väg som inte kräver ett brev.**

| Vad som prövades | Kommuner | Nya bestånd med kontrollresultat |
|---|---:|---:|
| Sveriges dataportal, 16 sökord | 290 | **0** |
| Kommunernas egna öppna data-portaler, 6 mönster | 290 | **0** |
| ArcGIS Online, 24 sökord, hela världen | alla | **0** |
| Kommunernas egna ArcGIS Server, tjänstenamn | 102 kataloger | **0** |
| Samma, men **lagernamnen inuti tjänsterna** | 6 306 tjänster | **0** |
| ArcGIS Enterprise Portal, postsökning | 92 portaler | **0** |
| GeoServer WFS GetCapabilities | 318 värdnamn | **0** |
| Origo-konfigurationer | 318 värdnamn | **0** |
| Sitevision-modulen `foodreport` | 290 | **0** |
| Stockholms e-tjänstväg `/livsmedelsinspektioner/` | 227 värdnamn | **0** |
| Sitemapsvep, **1 507 531 lästa URL:er** | 290 | **0** |
| Förbundens egna webbplatser | 9 förbund | **0** |
| NSÖD-specen, följer någon den nu? | hela landet | **0** |

Fem saker är värda att säga rakt ut.

**Varje fingeravtryck vi känner igen pekar tillbaka på en kommun vi redan
läser.** Det här är jaktens starkaste enskilda resultat, och det syns tydligast
i ArcGIS-svepet: av 6 306 tjänster hos 102 kommunala kartservrar bär **tre**
kommuner ett livsmedelslager med kontrollresultat, Linköping, Jönköping och
Oskarshamn, och alla tre är inlästa sedan tidigare. Portalsökningen lägger till
Kristinehamn, inläst. GeoServer-svepet ger Karlstad och Jönköping, bägge
inlästa. `foodreport`-svepet ger Örebro, inläst. De tretton vi har är alltså
inte tretton av många, de är **tretton av tretton**.

**Norrköping hittades om, av samma metod, vilket gör nolltalet trovärdigt.**
Sitemapsvepet mot alla 290 hittade `ecos.xml` på `norrkoping.se` utan att ha
fått adressen i förväg. Metoden fungerar alltså. Den hittade ingenting mer på
1 507 531 URL:er.

**Tre nya bestånd finns, och inget av dem bär ett betyg.** Smedjebackens
`Livsmedelsanläggningar (Ecos)` med 88 rader, Laholms `Livsmedelsbutiker` med
11, och tre butikslager på Tranås delade GeoServer med 3, 4 och 8 rader. Alla
är nållistor utan bedömning, och `docs/42` §7.3 säger varför en sådan inte ska
byggas. Se avsnitt 6.

**NSÖD är inte långsamt, det är nedlagt.** Specen på `sambruk.github.io` svarar
200 men bär `Last-Modified: Wed, 16 Feb 2022 07:54:36 GMT`. GitHub-förrådet
`Sambruk/livsmedel` har `pushed_at: 2022-02-16`, **noll förgreningar och två
stjärnor**, och den senaste ändringen med innehåll är från 2020-11-04.
Uppföljningsfilen svarar 200 med 24 506 byte och `Last-Modified: Thu, 28 Apr
2022`, alltså **exakt samma fil som `docs/42` §3.2 läste**, fortfarande med
LUND som enda kommunflik och räknaren på 0 klara, 0 påbörjade, 13 ej påbörjade.
Fyra och ett halvt år utan en rad. Se avsnitt 7.

**Vad det betyder för planen.** `docs/59` §9.2 rankar täckningen som kanal två
och som villkoret för nästan allt annat. Den här jakten säger att det inte finns
någon täckning kvar att hämta utan att fråga. Breven i `pipeline/data/begaran/`
är alltså inte en av två vägar, de är **vägen**, och varje dag de ligger
oskickade är en dag utan rörelse på kanal två.

---

## 2. Metoden

### 2.1 Varför fingeravtryck och inte kataloger

`docs/42` sökte i Sveriges dataportal, i kommunernas egna portaler och i
kommunernas sitemaps. Alla tre frågar **kommunen** vad den publicerar. Det
svepet slutade på att tre kommuner av 290 har en livsmedelsdatamängd i en
katalog, och det talet är oförändrat i dag.

Den här jakten vänder på frågan. Vi vet vilka format vi redan läser, och varje
format kommer ur en **produkt**, inte ur en kommun. En produkt lägger sina data
på samma adress hos alla sina kunder. Åtta sådana adresser gick att läsa ur vår
egen kod:

| Fingeravtryck | Var det kommer ifrån | Adressform |
|---|---|---|
| Ecos-utdrag | `sources/ecos.py`, Norrköping | `<dom>/download/<nod>/<tid>/ecos.xml` |
| ArcGIS REST | `sources/linkoping.py`, `oskarshamn.py`, `kristinehamn.py`, `jonkoping.py` | `<vård>/arcgis/rest/services` |
| ArcGIS Portal | `sources/kristinehamn.py` | `<vård>/portal/sharing/rest/search` |
| GeoServer WFS | `sources/karlstad.py` | `<vård>/geoserver/ows?request=GetCapabilities` |
| Origo | `sources/karlstad.py` | `<vård>/origo/index_ssl.json` |
| Sitevision `foodreport` | `sources/orebro.py` | `<dom>/rest-api/foodreport/search` |
| E-tjänst | `sources/stockholm.py` | `<vård>/livsmedelsinspektioner/` |
| Sitevision-filarkiv | `sources/svenljunga.py` | `<dom>/download/<nod>/<tid>/<fil>` |

Metodlärdomen i `docs/42` §10 var "leta efter datafilen och inte efter sidan".
Den här jaktens lärdom ligger ett steg till: **leta efter produkten och inte
efter kommunen.** En kommun döljer sin datafil av misstag. En produkt kan inte
dölja sin adressform, för den är samma hos alla kunder.

### 2.2 Värdnamnen, och varför DNS kommer först

Ett fingeravtryck är en väg, och en väg behöver en värd. `kommuner.json` bär
bara kommunens huvuddomän, så 36 värdnamnsmönster slogs upp för var och en av de
290, alltså **12 180 uppslag**. DNS är gratis och rör ingens webbserver, så det
steget går först och HTTP provas bara mot de värdnamn som faktiskt går att slå
upp.

| Omgång | Mönster | Uppslag | Svarade | Efter jokerfilter |
|---|---:|---:|---:|---:|
| Portaler och GIS | 22 | 6 380 | 586 | **366** |
| Ur våra egna adaptrar | 20 | 5 800 | 556 | **356** |

**Jokerfiltret är nödvändigt och det är lätt att missa.** Tio kommunala domäner
svarar på varje tänkbart värdnamn. Kontrollen är ett uppslag av
`zqx7prikkotest.<dom>`: går det att slå upp är domänen en jokerdomän och alla
dess träffar kastas. Utan det steget hade jakten trott att tio kommuner har
`smiley.<dom>`, `matkoll.<dom>` och `livsmedelskoll.<dom>`. Ingen har det.

Ett värdnamn överlevde filtret och såg ut som ett fynd: **`livsmedel.vasteras.se`
går att slå upp och pekar på 91.195.33.130**. Det är en parkeringsadress, och
anropet svarar aldrig, `ConnectTimeout` efter 25 sekunder mot port 443. Namnet är
registrerat och oanvänt.

### 2.3 Artigheten, och de 35 som sa nej

Sonden i scratchpad bär fyra regler, och de är villkor och inte önskemål:

1. Egen user-agent på varje anrop.
2. En lås per värdnamn som håller minst 1,1 sekund mellan två anrop till samma
   värd. Parallelliteten ligger på olika värdar, aldrig på samma.
3. `robots.txt` läses en gång per värd och respekteras. **15 värdar sa nej den
   vägen** och 28 anrop stoppades innan de gjordes: `angelholm.se`,
   `bastad.se`, `e-tjanster.harnosand.se`, `etjanst.surahammar.se`,
   `etjanster.lidingo.se`, `gellivare.se`, `hogsby.se`, `karlskrona.se`,
   `livsmedel.vasteras.se`, `minasidor.gnosjo.se`, `motala.se`, `osteraker.se`,
   `prod.sagolikasunne.se`, `vadstena.se`, `www.karlskrona.se`.
4. En värd som svarar 403 eller 429 svartlistas för hela körningen.
   **20 värdar gjorde det:** `geodata.haninge.se`, `geoserver.lomma.se`,
   `gis.karlskrona.se`, `gis.mark.se`, `hultsfred.se`, `karta.essunga.se`,
   `karta.falkoping.se`, `karta.grastorp.se`, `karta.hallstahammar.se`,
   `karta.karlstad.se`, `karta.sorsele.se`, `kartor.sandviken.se`,
   `portal.boden.se`, `portal.flen.se`, `portal.kil.se`, `portal.ljungby.se`,
   `portal.torsas.se`, `portal.torsby.se`, `portal.vilhelmina.se`,
   `portal.ystad.se`.

Ingen inloggning prövades, ingen spärr kringgicks, ingen CAPTCHA rördes. Varje
adress är en adress en webbläsare skulle ha hämtat.

**Statuskoderna över hela jakten:**

| Kod | Antal |
|---|---:|
| 200 | 13 760 |
| 404 | 6 651 |
| inget svar, tidsgräns eller DNS | 2 707 |
| 400 | 620 |
| 503 | 165 |
| 403 | 56 |
| 500 | 53 |
| 409 | 30 |
| 401 | 11 |
| 502 | 6 |
| 462 | 1 |

---

## 3. ArcGIS, tre vägar och 0 nya kommuner

### 3.1 ArcGIS Online, hela världen

`https://www.arcgis.com/sharing/rest/search` frågades på 24 svenska sökord med
sidbrytning. **470 unika poster** hämtades, varav 46 bär ett svenskt
livsmedels-, tillsyns- eller inspektionsord i titel, sammanfattning eller
etiketter.

| Sökord | Träffar | Sökord | Träffar |
|---|---:|---|---:|
| `livsmedel` | 41 | `livsmedelsverksamheter` | 3 |
| `restauranger kommun` | 17 | `miljötillsyn` | 3 |
| `livsmedelskontroll` | 11 | `livsmedelsinspektioner` | 2 |
| `livsmedelskontroller` | 11 | `hälsoskydd` | 2 |
| `miljöreda` | 5 | `livsmedelstillsyn` | 1 |
| `kontrollrapport` | 4 | `livsmedelsanlaggningar` | 1 |
| `livsmedelsinspektion` | 3 | `kontrollresultat` | **0** |
| `livsmedelsanläggningar` | 2 | `smiley kontroll` | **0** |

`ecos` ger 10 000 träffar och är oanvändbart som sökord, eftersom det är ett
vanligt engelskt ordled. Termerna `livsmedelsobjekt`, `tillsynsobjekt`,
`halsoskydd`, `matkontroll`, `livsmedelskoll`, `castor tillsyn` och
`kontrollresultat` gav noll.

Tio ägare med livsmedelsposter följdes in i sina egna postlistor, och varje
webbkarta och app öppnades på sin `/data`-form så att lagren bakom gick att
läsa. Resultatet:

| Ägare | Kommun | Vad lagren är | Nytt? |
|---|---|---|---|
| `sthlm_miljo2023` | Stockholm | `Livsmedelstillsyn`, mätt i `docs/52` | Nej |
| `mattias_j` | Oskarshamn | `Livsmedelskontroller_2024`, inläst | Nej |
| `yzdjo_jonkoping` | Jönköping | `DB_webvy/MapServer/38`, inläst | Nej |
| `frta9628_`, `kals9017` | **Kristinehamn** | organisationen heter `khamn`, inte Karlshamn | Nej |
| `JonasLundgren` | okänd | `services3.arcgis.com/5WHoNp62stHFcGAU/.../Livsmedelskontroll/FeatureServer` svarar **HTTP 200 med 102 byte**: `{"error":{"code":499,"message":"Token Required"}}` | Bakom inloggning |
| `ezgi.guler.tozluoglu` | okänd | `services2.arcgis.com/4HwpcMJ2Ty5JLU5R/.../Livsmedelsverksamheter/FeatureServer`, samma svar, 102 byte, kod 499 | Bakom inloggning |
| `fo@linde` | Lindesberg | Survey123-resultat, **11 rader**, fälten är `fyll_i_ditt_namn` och `hur_gick_bes_ket` | Arbetsmaterial |
| `FredrikEkefjard` | Skellefteå | `Miljötillsyn_ext/MapServer`, 19 lager, inget livsmedel | Nej |

**De två bakom `Token Required` är det enda i hela jakten som skulle kunna vara
ett kontrollbestånd och som vi inte kan se.** De hämtades inte, de prövades inte
med någon nyckel och ingen inloggning försöktes. Att titeln lyder
`Livsmedelskontroll` respektive `Livsmedelsverksamheter` är allt vi vet, och
ägarnamnen säger inte vilken kommun det är. Det noteras som overifierat i
avsnitt 9 och som ett nej i dag.

### 3.2 Kommunernas egna ArcGIS Server

Det här är jaktens tyngsta enskilda svep, och skälet står i Jönköping:
kommunens livsmedelslager heter `Livsmedelsinspektioner` men ligger i en tjänst
som heter `DB_webvy`. **Ett svep som bara läser tjänstenamn hade missat det.**

| Steg | Tal |
|---|---:|
| GIS-värdnamn som gick att slå upp | 318 |
| Värdar med en **öppen** tjänstekatalog (`/arcgis/rest/services` eller `/server/rest/services`) | **102** |
| Tjänsteposter i mapparna | 7 674 |
| Unika tjänster efter att MapServer och FeatureServer slagits ihop | **6 306** |
| Tjänster vars **lagerlista** lästes | 6 306 |
| Lager med livsmedelsord | **16** |

De sexton, och vad de är:

| Kommun | Lager | Vad det är |
|---|---|---|
| Linköping | `ecos/Livsmedelkoll_anlaggningar`, `ecos/LIVSMEDELKOLL_TILLSYNER`, `ecos/LIVSMEDELKOLL_LAGSTIFTNINGSOMRADE` | **Inläst.** Mappen heter bokstavligen `ecos` |
| Jönköping | `DB_webvy/MapServer/38` och `kommunatlas/.../4`, bägge `Livsmedelsinspektioner` | **Inläst.** 1 148 rader, fälten `senaste_kontroller`, `status`, `har_avvikelse` |
| Smedjebacken | `Karta/Miljö_Energi/FeatureServer/10`, `Livsmedelsanläggningar (Ecos)` | **Nytt. 88 rader, ingen bedömning.** Se 6.1 |
| Laholm | `gis/Extern_service_pro/FeatureServer/0`, `Livsmedelsbutiker` | **11 rader**, fälten `Id`, `ort`, `sen_uppdat`. Inget |
| Västerås | 8 lager `Livsmedelsförsörjning` i översiktsplanerna | Planunderlag. Inget |
| Borlänge | `Befintlig livsmedelsaffär` i ett FÖP-underlag | Inget |

Oskarshamns `Livsmedelskontroller_2024` och Kristinehamns `Miljo/Livsmedel_ext`
syns inte i tabellen av två olika skäl som bägge är värda att notera.
Oskarshamns tjänst heter redan `Livsmedelskontroller_2024` och fångades av
tjänstenamnsfiltret i stället. Kristinehamns svarar **HTTP 200 med 62 byte** och
`{"error":{"code":499,"message":"Token Required"}}` på den öppna vägen; kommunen
läses via sin Portal, se 3.3.

### 3.3 ArcGIS Enterprise Portal

Kristinehamns adapter pekar på `portal.kristinehamn.se`. En Portal bär en egen
postsökning på `/portal/sharing/rest/search`, och den hittar hostade lager som
**inte** syns i tjänstekatalogen. **92 värdar svarade** på frågan `q=livsmedel`,
och **88 av dem svarade `total=0`**. De fyra som svarade något:

| Kommun | Träffar | Vad de är |
|---|---:|---|
| Linköping | **9** | `Livsmedelskollen` som instrumentpanel plus de sex tjänsterna i mappen `ecos`. **Inläst** |
| Kristinehamn | **4** | `Handla och äta`, `Livsmedel`, `Livsmedelsprotokoll`, en kodbilaga. **Inläst** |
| Trelleborg | 1 | en berättelsekarta som heter `Vattenförsörjning` |
| Hässleholm | 1 | en berättelsekarta som heter `Inledning` |

Den här vägen är alltså den enda i hela jakten som hittade en post vi inte redan
nådde på en annan väg, Linköpings instrumentpanel, och den pekar på tjänster vi
redan läser.

---

## 4. GeoServer, Origo och Sitevision

### 4.1 GeoServer WFS

`sources/karlstad.py` skriver i sin egen inledning att Origo är "den första som
bygger på ett ramverk flera kommuner delar" och att mönstret är "värt att pröva
mot fler Origo-kommuner innan fler enskilda adaptrar skrivs". Det är nu prövat.

318 GIS-värdnamn frågades på `?service=WFS&request=GetCapabilities` mot fyra
vägar. **20 värdar svarade med en WFS-katalog.**

| Kommun | Värd | Lager | Livsmedelsträff |
|---|---|---:|---|
| Karlstad | `gi.karlstad.se` | 624 | **12**, alla inlästa. Se nedan |
| Karlstad | `karta.karlstad.se` | 624 | samma tjänst |
| Jönköping | `karta.jonkoping.se` | 238 | **5** `HAJK:`-lager, kommunen inläst via ArcGIS |
| Tranås | `karta.tranas.se` | 1 524 | **3** butikslager åt Boxholm, Ydre och Ödeshög. Se 6.2 |
| Ale, Ånge, Hallstahammar, Köping, Kungsbacka, Leksand, Nacka, Ronneby, Sigtuna, Strängnäs (två värdnamn), Sundsvall, Tomelilla, Uddevalla, Värmdö, Gagnef | | 0 till 910 | **0** |

**Karlstads tolv är inte tolv bestånd.** Fyra är de lager `karlstad.py` redan
läser (`livsmedelskontroller_restaurang`, `_skolaomsorg`, `_butikhandel`,
`_ovrigt`, tillsammans 694 verksamheter, och beståndet i `karlstad.json` står på
696). Resten är `vy_mi_miljo_`-familjen, som adaptern beskriver som "det
avställda lagret, 705 poster, bestånd 2019 till 2024" och som den bara läser
adressen ur. Två av dem, `_mobilanlaggning` och `_okontrollerade`, är alltså inte
nya verksamheter utan delmängder av samma avställda bestånd.

### 4.2 Origo

Samma 318 värdnamn frågades på fyra Origo-konfigurationsvägar. **Tre svarade:**
`gis.hudiksvall.se/origo/index.json` och `kartor.hudiksvall.se/origo/index.json`
med 7 lager var, och `karta.ale.se/origo/index.json` med 37. Inget livsmedel i
någon av dem. Karlstads egen konfiguration ligger bakom en värd som svartlistades
på 403 under körningen, men dess GeoServer nåddes via `gi.karlstad.se` i stället.

### 4.3 Sitevision-modulen `foodreport`, och vad den säger om hela branschen

Det här är jaktens renaste mätning, för svaret är binärt och entydigt.

`sources/orebro.py` anropar `https://www.orebro.se/rest-api/foodreport/search`.
Det är inte en kommunlösning, det är en **Sitevision-modul**, och Sitevision
svarar alltid likadant när modulen inte finns:

    {"success":false,"type":"invalidParameter",
     "description":"An invalid parameter (query or request body) was specified",
     "message":"No RestApp found for /rest-api/foodreport/search"}

Tre vägar provades mot alla 290 huvuddomäner, `search`, `reports` och
`facilities`.

| Utfall | Kommuner |
|---|---:|
| Svarar Sitevisions `No RestApp found`, alltså **kör Sitevision** | **218** |
| Svarar 404 eller inget, alltså kör något annat | 71 |
| **Svarar med data** | **1** |

Den enda är Örebro: **HTTP 200, 204 718 byte**, en JSON-lista som börjar
`[{"Registrerades":"2009-01-19","Objektsnamn":"1 Rum och Kök","Typ":"Restaurang",
"AnlaggningId":"d463a4c7-...","Adress":"Stortorget 16"}]`.

Elva andra kommuner svarar 200 på samma väg, och **alla elva är falska träffar**.
Danderyd, Sollentuna, Svedala, Karlshamn, Hörby, Skinnskatteberg, Oskarshamn,
Torsås, Borgholm, Gävle och Skövde returnerar `text/html` med sin egen 404-sida
eller sin startsida under statuskod 200. Svedalas svar bär till och med
`<title>404 - Page not found</title>` i en 200. Att skilja dem åt krävde att
innehållstypen lästes och inte bara statuskoden, och det är en fälla värd att
skriva ut: **på kommunala webbplatser är 200 inte ett svar, det är en gissning.**

Kontrollen att metoden är giltig gjordes mot en väg som inte finns:
`https://www.orebro.se/rest-api/finnsinte/search` svarar 400 med exakt samma
`No RestApp found`-kropp. Modulnamnet är alltså det som avgör, inte värden.

**Den här mätningen är värd mer än sitt nolltal.** 218 av 290 kommuner kör samma
publiceringsverktyg, och en enda av dem har installerat modulen som visar
livsmedelsresultat. Om Örebros modul är en produkt någon kan köpa, och inte ett
egenbygge, är det den billigaste tekniska vägen till täckning som finns i landet.
Vem som byggt den är **overifierat**, se avsnitt 9.

### 4.4 Stockholms e-tjänstväg

`sources/stockholm.py` läser
`etjanster.stockholm.se/Livsmedelsinspektioner/.../SearchFacilitiesMap`. Vägen
`/livsmedelsinspektioner/` provades mot 227 värdnamn av formen
`etjanster.<dom>`, `e-tjanster.<dom>`, `etjanst.<dom>` och `minasidor.<dom>`.

**Tre svarade 200, och alla tre är fångstalla-sidor i Open ePlatform.**

| Värd | Byte | Vad som faktiskt kom |
|---|---:|---|
| `etjanster.malmo.se` | 579 098 | omdirigering till `sjalvservice.malmo.se`, `<title>Alla tjänster</title>` |
| `minasidor.habokommun.se` | 188 267 | omdirigering till `service.habokommun.se`, `<title>Tjänster</title>` |
| `minasidor.sundsvall.se` | 43 017 | `<title>Mina sidor</title>`, inloggningssida |

Malmös 579 kilobyte såg i sökloggen ut som jaktens största fynd. Det är en
tjänstekatalog som svarar likadant på varje sökväg. Open ePlatform står med i
`docs/43` §6, och svepet bekräftar att det finns i drift, men det bär inga
kontrollresultat.

---

## 5. Sitemapsvepet, och en rättelse till `docs/42` §9

### 5.1 Talen

`docs/42` §5.1 läste 249 995 sidor hos 20 kommuner och §9 noterade att de övriga
270 aldrig sveptes. Den luckan är nu stängd.

| Mått | Tal |
|---|---:|
| Kommuner | 290 |
| Sitemapfiler lästa | 798 |
| **URL:er lästa** | **1 507 531** |
| Kommuner med minst en livsmedelsträff | 211 |
| Träffar på `livsmedel\|smiley\|matkontroll\|hygien` | 3 446 |
| Därav kvar efter steg två, `resultat\|kontroll\|inspektion\|tillsyn\|rapport` | 1 075 i 183 kommuner |
| **Datafiler** (`.xml`, `.json`, `.csv`, `.xlsx`) med systemord i namnet | **33** |
| PDF:er med kontroll- eller resultatord i namnet | 145 |

Kontrollen att svepet verkligen läser hela sitemapen gjordes mot `docs/42`:s egna
tal. Göteborg 44 463 mot 44 268, Malmö 9 430 mot 9 419, Lund 8 599 mot 8 414,
Norrköping 10 260 mot 10 390. Samma storleksordning, en månad senare.

### 5.2 Nyköping är inte längre okänd, och det var vårt fel

`docs/42` §8 rad 4 och §9 rad 1 lämnar Nyköping oavgjord med motiveringen att
`sitemap_index.xml` svarar 404. Det gör den fortfarande: **HTTP 404, 7 876 byte
`text/html`**. Men kommunens `robots.txt` svarar 200 med 115 byte och pekar bara
på den trasiga adressen, medan

    https://www.nykoping.se/sitemap.xml

svarar **HTTP 200 med 889 985 byte `application/xml`**. Första passet härinne
ärvde samma fel som augustisvepet: det gissade en adress bara när `robots.txt`
var tyst, aldrig när den pekade fel. Andra passet gissar alltid.

Nyköping har **5 040 URL:er, 35 livsmedelssidor och 22 efter steg två**. Samtliga
22 är vägledning: avgifter, egenkontroll, märkning, mobil verksamhet,
allergener, `kontroll-av-livsmedelsverksamhet/`. **Ingen sida med resultat, ingen
datafil.** Nyköping är ett nej, och `docs/42` §9 rad 1 är därmed avförd.

### 5.3 De 59 som inte har någon sitemap alls

Efter två pass med fjorton gissade adresser, `wp-sitemap.xml` inräknad, har
**59 kommuner ingen sitemap som går att hitta**. De bär tillsammans 13 634
anläggningar, alltså **12,1 procent** av de 112 748 i `kommuner.json`. Det är
jaktens största kvarvarande blinda fläck och den enda av dem som är billig att
stänga, en kommun i taget, för hand.

Sju kommuner hittades först i andra passet och är alltså inte med i de 59:
Motala, Vadstena, Oskarshamn, Borgholm, Hörby, Eda och Skinnskatteberg. Den enda
livsmedelsträffen bland dem är Borgholms
`https://www.borgholm.se/resultat-livsmedelskontroller/`, som redan är inläst.

### 5.4 De 33 datafilerna, och varför bara två av dem är data

Av 33 filer är **två** ett kontrollbestånd, och bägge är Norrköpings:
`ecos.xml` och `out_Ecos.xml`, med precis de adresser `ecos.py` redan bär.
Resten är kontrollplaner för bygglov, egenkontrollmallar,
upphandlingsförteckningar och nyckeltal.

Två såg ut att vara ett fynd och var det inte:

| Fil | Svar | Vad den är |
|---|---|---|
| `tanum.se/.../Indikator Livsmedelsinspektioner.xlsx` | **200**, 17 045 byte, `Last-Modified: Wed, 17 Jun 2026` | Ett enda nyckeltal, "Genomförda livsmedelsinspektioner i verksamheter inom välfärden, följsamhet mot kontrollplan, %". Fem strängar i hela filen |
| `tanum.se/.../Livsmedel.xlsx` | **200**, 9 328 byte, `Last-Modified: Mon, 18 Aug 2025` | "Andel ekologiska livsmedel (%)" och "Andel närproducerade livsmedel* (%)". Fyra strängar |

### 5.5 De sidor som lovade mest, lästa en och en

Elva sidor filtrerades fram som möjliga resultatsidor och hämtades. **Alla utom
de redan inlästa visar årssammanställningen till Livsmedelsverket**, alltså
summan av kontroller, inte utfallet per verksamhet.

| Kommun | Sida | Vad den innehåller |
|---|---|---|
| Nacka | `resultat-av-livsmedelskontrollen-i-nacka/` | 647 registrerade verksamheter, 470 kontroller, 228 med anmärkning, 3 förbud. **Per kommun** |
| Ljusdal | `resultatlivsmedelskontrollen2025.4...html` | 276 verksamheter, 316 kontroller, 181 med anmärkning. **Per kommun** |
| Huddinge | `resultat-livsmedelskontroll-2020.pdf`, **200, 228 953 byte** | En sida, 2021-04-01, samma årssammanställning för 2020 |
| Örnsköldsvik | `kontrollbesok-livsmedelsverksamhet` | Beskriver kontrollen och att handlingar är offentliga på begäran |
| Hallstahammar | `livsmedelskontroller` | Se nedan |
| Malmö, Bollnäs, Södertälje, Sotenäs, Älvsbyn | nyheter och artiklar | Årssiffror i löptext |

**Hallstahammar förtjänar en egen rad, för en webbsökning påstod något annat.**
En sökmotorsammanfattning uppgav att Hallstahammar "publicerar resultatet av
livsmedelskontroller i ett kartlager". Sidan hämtades och lästes: **HTTP 200,
79 125 byte**. Ordet kartlager finns inte i den. Avsnittet "Resultat av
livsmedelskontroller" säger att **företagaren** får en skriftlig kontrollrapport
efter besöket. Kommunens GeoServer, `karta.hallstahammar.se`, bär tre lager och
inget av dem är livsmedel, och dess ArcGIS-rot har fyra mappar och noll tjänster.
Hallstahammar publicerar inte. Att en sökmotorsammanfattning sade motsatsen är
skälet att varje påstående i det här dokumentet bär sitt eget HTTP-svar.

### 5.6 Förbunden, som föll helt utanför augustisvepet

`kommuner.json` bär kommunens domän, aldrig förbundets. De 23 gemensamma
kontrollmyndigheterna i `docs/43` §4 bär 63 kommuner och sveptes därför aldrig.
Nio egna webbplatser prövades.

| Förbund | Svar | Livsmedelssidor | Utfall |
|---|---|---:|---|
| Miljösamverkan östra Skaraborg | 200 | många | Bara vägledning och en frågelåda |
| Ystad-Österlenregionens miljöförbund | 200 | 18 | Ligger på `ystad.se`. Bara vägledning |
| Söderåsens miljöförbund | 200, 68 251 byte | 0 | Nej |
| Dalslands miljö- och energiförbund | 200, 38 215 byte | 0 | Nej |
| Miljöförbundet Blekinge Väst | 200, 56 106 byte | 0 | Nej |
| Västra Mälardalens Myndighetsförbund | 200, 77 133 byte | 0 | Nej |
| Södertörns miljö- och hälsoskyddsförbund | 200, 25 440 byte | 0 | Nej. Upplöst, se `docs/43` §4.1 |
| Samhällsbyggnad Bergslagen | **inget** | | Certifikatet gäller `*.sitevision-cloud.se` och inte `sbbergslagen.se` |
| Sydnärkes miljöförvaltning | **inget** | | `sydnarkemiljo.se` går inte att nå |

---

## 6. De tre nya bestånden, mätta

Inget av dem bär ett betyg, och inget av dem ska byggas. Talen står här så att
ingen behöver mäta om dem.

### 6.1 Smedjebacken, `Livsmedelsanläggningar (Ecos)`

    https://geodata.smedjebacken.se/arcgis/rest/services
      /Karta/Miljö_Energi/FeatureServer/10

Svar **HTTP 200, 9 400 byte** på metadatan.

| Fråga | Svar |
|---|---|
| Rader | **88** |
| Fält | `Nr`, `Objektnamn`, `Fastighetsbeteckning`, `Anläggningstyp`, `Anläggningens_adress`, `Anläggningens_status`, `Verksamhetsutövare`, `Kontrollerad`, `Datum` |
| **Kontrollresultat** | **Nej.** `Kontrollerad` står på 1 för alla 88, och `Datum` är tomt för alla 88 |
| Bedömning | Finns inte som fält |
| Avvikelser | Finns inte som fält |
| Koordinater | Ja, SWEREF 99 13 30 (`wkid` 3009) |
| Verksamhetsutövare | Ja, 84 av 88 |
| Adress | 74 av 88 |
| Typer | `Sista led` 72, `Dricksvattenanläggning` 8, `Huvudkontor` 2, `Tidigare led` 2, övriga 4 |
| Senast ändrad rad | 2025-04-30 |
| Licens | **Ingen.** `copyrightText` är tomt, ingen katalogpost finns |

Två fält gör det här värt att notera trots nolltalet. Namnet säger **`(Ecos)`**
rakt ut, vilket gör Smedjebacken till den tredje kommun i landet där
verksamhetssystemet går att läsa ur ett publikt fingeravtryck. Och
`Verksamhetsutövare` bär det juridiska bolagsnamnet, alltså precis den brygga
`docs/12_datapairing_och_orgnr.md` saknar, för 84 anläggningar.

**Varför den inte byggs.** Ingen bedömning och ingen licens. Att beståndet i
praktiken är komplett gör det inte bättre, snarare tvärtom: registret ger
Smedjebacken **82 anläggningar** och lagret har 88 rader, så det här är hela
kommunen utan ett enda betyg. `docs/42` §7.3 säger vad en sida utan betyg är
värd, och `docs/prikko-licens-lasas-som-den-star` säger att tystnad inte är ett
ja.

### 6.2 Tranås delade GeoServer, tre butikslager

`karta.tranas.se` är värd åt fler kommuner än Tranås. Tre arbetsytor bär
`karta_livsmedelsbutik`, och alla tre svarar 200:

| Arbetsyta | Rader | Fält | Vad det är |
|---|---:|---|---|
| `boxholm_kommunkarta` | **3** | `id`, `namn`, `beskr`, `link`, `adress`, `kontakt` | Servicekarta, `Coop, Storgatan 12f, 59570 Boxholm` |
| `ydre_kommunkarta` | **4** | samma | `Rydsnäs lanthandel` med en Facebooklänk |
| `odeshogext` | **8** | samma utan `id` | Bland dem en bensinstation |

Femton rader tillsammans. Det är en servicekarta för glesbygd och inte ett
register.

### 6.3 Laholm, `Livsmedelsbutiker`

`kartor.laholm.se/arcgis/rest/services/gis/Extern_service_pro/FeatureServer/0`
svarar 200. **11 rader**, och fälten är `OBJECTID`, `Id`, `ort`, `sen_uppdat`.
Ingen verksamhet går ens att namnge ur det.

---

## 7. NSÖD, prövat en gång till

`docs/42` §4 och §3.2 rad 10 slog fast att specen finns och att ingen följer den.
Uppdraget bad om att pröva om någon gör det nu. Tre mätningar, alla i dag:

| Adress | Svar | Vad det säger |
|---|---|---|
| `https://sambruk.github.io/livsmedel/` | **200**, 8 242 byte, `Last-Modified: Wed, 16 Feb 2022 07:54:36 GMT` | Specen har inte rörts på fyra och ett halvt år |
| `https://api.github.com/repos/sambruk/livsmedel` | **200** | `pushed_at: 2022-02-16`, **0 förgreningar**, 2 stjärnor, 1 öppen fråga. Senaste ändringen med innehåll: **2020-11-04**, "New version of the technical spec" |
| `https://editera.dataportal.se/store/41/resource/13` | **200**, 24 506 byte, `Last-Modified: Thu, 28 Apr 2022 17:29:20 GMT` | **Byte för byte samma fil som augustisvepet läste.** Fyra blad, en enda kommunflik, `LUND`, räknaren på 0 klara, 0 påbörjade, **13 ej påbörjade** |

Dessutom söktes Sveriges dataportal om på sexton termer, `NSÖD` och `Sambruk`
inräknade. Posterna är desamma: specen själv, vägledningen, JSON-exemplet,
DCAT-AP-SE-rekommendationen och uppföljningsfilen. **Ingen implementation.**

**Slutsats.** `ecos.py`:s bedömning att en generell NSÖD-läsare i dag skulle ha
noll källor står kvar, och den är starkare nu än i augusti: förrådet är inte
långsamt, det har noll förgreningar och ingen innehållsändring sedan 2020.
Specen är fortfarande rätt sak att be om i ett brev, eftersom den är den enda
flera myndigheter kan landa på samtidigt, men den är ingen väg som går att gå
själv.

---

## 8. Vad som byggdes

**Ingen ny inläsare, och det är beslutet och inte en försummelse.** Uppdraget
säger att en adapter inte ska byggas för ett bestånd utan kontrollresultat, och
inget av de tre nya bestånden bär ett. Att skriva en `smedjebacken.py` för 88
rader utan bedömning och utan licens hade brutit mot både `docs/42` §7.3 och
`docs/prikko-licens-lasas-som-den-star`.

`MUNICIPALITIES` i `pipeline/prikko/sources/ecos.py` har alltså kvar sin enda
rad, Norrköping. Det som ändrades är modulens inledning, som nu bär den mätning
som saknades. Inledningen skrev att återanvändbarheten är "en hypotes och inte
ett mätt faktum" och att kartan över verksamhetssystem är okänd för samtliga
290. Bägge meningarna var sanna i augusti och den första är sann än. Skillnaden
är att vi nu vet **varför** hypotesen inte går att pröva: det finns inget andra
Ecos-utdrag publikt, och det är uppmätt och inte antaget.

Tre kommuner bär i dag ett publikt Ecos-fingeravtryck, och det är första gången
fältet `verksamhetssystem` går att fylla ur något annat än en gissning:

| Kommun | Fingeravtryck | Belägg |
|---|---|---|
| Norrköping | filen heter `ecos.xml` | `docs/42` §6.2 |
| Linköping | ArcGIS-mappen heter `ecos` | `kartor.linkoping.se/arcgis/rest/services/ecos/`, avsnitt 3.2 |
| Smedjebacken | lagret heter `Livsmedelsanläggningar (Ecos)` | avsnitt 6.1 |

**Raderna som ska in i `pipeline/data/kommuner.json`**, om ägaren vill, och de är
inte skrivna härifrån eftersom filen delas med andra: `verksamhetssystem` sätts
till `Ecos` för `0581` Norrköping, `0580` Linköping och `2061` Smedjebacken, med
käll-URL enligt tabellen ovan. Det tar kartan från 0 av 290 till 3 av 290. Det är
lite, men det är mätt, och `docs/43` §6 säger att resten kommer med svaret på
genväg A.

**Ingen rad ska in i matrisen i `.github/workflows/`.** Nattjobbet ska inte bygga
något nytt, eftersom ingenting nytt går att läsa.

---

## 9. Rangordningen: vad som kopplas in först

Ordningen är en annan än `docs/42` §8, eftersom den ordningen nu är prövad.

### Först: breven. De är inte en av två vägar, de är vägen

`docs/59` §9.2 sätter täckningen på plats två och kallar den villkoret för
nästan allt annat. Den här jakten mätte hela den andra vägen till täckning, den
som inte kräver ett brev, och den är tom. Tjugo brev ligger skrivna i
`pipeline/data/begaran/`. De är ägarens att skicka, och efter i dag finns ingen
teknisk åtgärd som kan ersätta dem.

### Andra: de två ArcGIS-lagren bakom `Token Required`

De enda två bestånd i hela jakten som skulle kunna bära kontrollresultat och som
vi inte kan se. `Livsmedelskontroll` hos ägaren `JonasLundgren` och
`Livsmedelsverksamheter` hos `ezgi.guler.tozluoglu`. Bägge svarar **HTTP 200 med
102 byte** och felkod 499. Nästa steg är **inte** teknik: det är att ta reda på
vilken kommun de tillhör genom att titta på webbkartorna som pekar på dem, och
sedan skriva till den kommunen. Kostnad: en halvtimme.

### Tredje: de 59 kommunerna utan sitemap

12,1 procent av landets anläggningar ligger i kommuner vars webbplats inte går
att svepa maskinellt. Ingen av dem är stor, men tillsammans är de större än
Göteborg. En manuell titt per kommun, ungefär som `docs/42` gjorde med Nyköping,
kostar en dag och stänger den sista blinda fläcken i kartan.

### Fjärde: ta reda på vem som byggde Örebros `foodreport`

218 kommuner kör Sitevision. En av dem har modulen. Är den en produkt går den att
köpa eller att be om, och då är den den billigaste vägen till täckning i landet.
Är den ett egenbygge är svaret ett brev till Örebro med frågan om koden får
delas. Frågan kostar ett mejl och svaret kan vara värt tvåhundra kommuner.

### Femte: Göteborg, som fortfarande väntar på ett produktbeslut

Oförändrat sedan `docs/42` §8. `sources/goteborg.py` finns, beståndet är CC0 och
dagsfärskt, och det saknar betyg. Beslutet i §7.3 är ägarens och det är inte
fattat.

---

## 10. Det som inte är verifierat

| Fråga | Läge |
|---|---|
| De två ArcGIS-lagren bakom `Token Required` | Titlarna lyder `Livsmedelskontroll` och `Livsmedelsverksamheter`. Vad de innehåller och vilken kommun de tillhör är **okänt**. Ingen inloggning prövades |
| Vem som byggde Örebros `foodreport`-modul | **Okänt.** Att den är en Sitevision-modul är mätt, att den går att köpa är inte |
| De 59 kommunerna utan sitemap | Täckta via dataportal, portalsvep, ArcGIS, GeoServer och `foodreport`, men **inte** via sitemap |
| De 20 värdar som svarade 403 | Svepet avbröts mot dem enligt regeln i 2.3. Karlstad och Jönköping nåddes via andra värdnamn, de övriga arton inte |
| Kommuner vars kartserver ligger på ett värdnamn vi inte gissade | 36 mönster prövades. Ett värdnamn utanför dem är osynligt för jakten |
| ArcGIS-organisationer utan publika poster | AGOL-sökningen ser bara det som är delat publikt. Ett lager delat inom organisationen syns inte, och ska inte heller ses |
| Samhällsbyggnad Bergslagen och Sydnärkes miljöförvaltning | Bägge värdarna svarade inte. Overifierade |
| Smedjebackens licens | Ingen uppgift finns någonstans. Bara ett brev kan svara |
| Om något publicerades efter 2026-09-28 | Jakten är en ögonblicksbild. Avsnitt 11 säger hur den körs om |

---

## 11. Så här körs jakten om

Skripten ligger i sessionens scratchpad och är inte incheckade, av samma skäl som
`docs/42` §10 anger. De är sju steg, och vart och ett går att köra för sig:

1. **Värdnamnen.** Slå upp 36 mönster mot alla 290 domäner med DNS först.
   Filtrera bort jokerdomäner med ett uppslag av `zqx7prikkotest.<dom>`.
2. **ArcGIS Online.** `www.arcgis.com/sharing/rest/search` på termlistan i 3.1,
   följ varje intressant ägare till `?q=owner:"<namn>"`, och öppna varje
   webbkarta på `/sharing/rest/content/items/<id>/data` för att se lagren.
3. **ArcGIS Server.** `/arcgis/rest/services?f=json` och
   `/server/rest/services?f=json` på varje GIS-värd, gå mapparna, och **gå in i
   varje tjänst och läs lagernamnen**. Det sista steget är det som hittar
   Jönköpings lager 38.
4. **ArcGIS Portal.** `/portal/sharing/rest/search?q=livsmedel` på varje
   portalvärd.
5. **GeoServer och Origo.** `?service=WFS&request=GetCapabilities` mot fyra
   vägar, och `/origo/index*.json` mot fyra.
6. **Sitevision.** `/rest-api/foodreport/{search,reports,facilities}` mot alla
   290 huvuddomäner. **Läs innehållstypen, inte statuskoden.**
7. **Sitemap.** `robots.txt` **plus** fjorton gissade adresser, alltid bägge.
   Filtrera på `livsmedel|smiley|matkontroll|hygien`, sedan på
   `resultat|kontroll|inspektion|tillsyn|rapport`, och håll datafilerna i en egen
   hög.

Tre fällor är värda att bära med sig, och alla tre kostade tid här:

**Jokerdomäner.** Tio kommuner svarar på varje värdnamn. Utan kontrollen tror
svepet att tio kommuner har `smiley.<dom>`.

**200 betyder inte data.** Elva kommuner svarar 200 med HTML på en REST-väg som
inte finns, och en av dem har `404 - Page not found` i titeln. Läs
`Content-Type`.

**`robots.txt` kan peka fel.** Nyköpings pekar på en sitemap som svarar 404
medan den riktiga ligger på standardadressen. Gissa alltid, inte bara när
`robots.txt` är tyst.
