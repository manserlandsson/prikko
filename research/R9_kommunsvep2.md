# R9. Kommunsvep 2: andra vändan efter R6

**Verifierat 2026-08-03.** Varje påstående nedan bygger på ett faktiskt
HTTP-svar. Där ett anrop gjorts återges statuskod, storlek eller faktiskt
innehåll. Alla anrop gjordes med
`User-Agent: PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)`
och paus mellan anropen. Inga bestånd hämtades i sin helhet.

Svepet utgick från R6 och R5. Redan inlästa, byggda eller avskrivna kommuner
rördes inte.

## Sammanfattning

**Inget nytt levande bestånd hittades.** Svepet täckte cirka 110 kommuners
webbplatser via deras sitemaps, 280 kartservrar, hela ArcGIS Onlines publika
innehåll för Sverige och Sveriges dataportal. Resultatet är entydigt: de
källor R5 och R6 redan känner till är i praktiken hela beståndet.

Tre fynd ändrar ändå bilden:

| Fynd | Kommun | Kod | Betydelse |
|---|---|---|---|
| Nedlagd söksida, appfilerna finns kvar | Norrköping | 0581 | Publicerade per verksamhet så sent som förra indexeringen. Sidan svarar nu 404 och saknas i sajtens egen sitemap. Infrastrukturen ligger kvar |
| Andra ArcGIS-organisation, med ett `Livsmedelskontroll`-lager | Hallstahammar | 1961 | R6 hittade fel organisation. Lagret finns, är listat publikt, men varje läsning svarar `Token Required` |
| Hela ArcGIS Onlines publika innehåll genomsökt | (ingen) | (ingen) | Exakt fyra svenska livsmedelskontrollkällor finns i AGOL: Jönköping, Stockholm, Oskarshamn, Kristinehamn. Alla fyra är redan kända |

Den viktigaste slutsatsen för planen: **letandet efter fler kommuner ger inte
längre avkastning.** Två oberoende, uttömmande kanaler (nationell dataportal
i R6, ArcGIS Online här) är nu bottenskrapade, och ett sitemap-svep över
110 kommuner gav noll nya resultatsidor. Arbetet bör flyttas från upptäckt
till att bygga adaptrar för de källor som redan är kartlagda.

---

## Metod, så att nästa svep inte gör om detta

Fyra kanaler användes. Alla fyra är reproducerbara.

### 1. Sitemap-svep (bäst avkastning per anrop)

För varje kommun: `robots.txt` → `Sitemap:` → följ eventuell sitemapindex →
plocka ut alla `<loc>` → filtrera på `livsmedel|smiley|matkontroll` i URL:en →
titta manuellt på träffar som också innehåller
`resultat|kontroll|inspektion|tillsyn`.

Det är ett starkt negativ: en kommun med 10 000 indexerade sidor och noll
resultatsidor publicerar inte. Det var så Norrköpings nedlagda sida
kunde bevisas vara nedlagd och inte bara omflyttad.

Fallgrop: en del kommuner returnerar en sitemap med 0 eller 1 URL
(SPA-fallback eller sitemap bakom brandvägg). De måste kontrolleras för hand
och står separat nedan.

### 2. Global sökning i ArcGIS Online

```
https://www.arcgis.com/sharing/rest/search?q=livsmedel&f=json&num=100&sortField=modified&sortOrder=desc
```

Detta söker **hela** ArcGIS Online, inte en organisation i taget. R6 gick
igenom organisation för organisation, vilket både är dyrare och missar
organisationer man inte gissat. Sökord som provades: `livsmedel` (42 träffar),
`livsmedelskontroll` (11), `livsmedelskontroller` (11), `livsmedelsinspektion`
(3), `livsmedelsanläggningar` (3), `livsmedelsverksamheter` (3),
`livsmedelstillsyn` (1), `kontrollrapport` (4), `smiley kommun` (0),
`matkontroll` (0), `restauranger inspektion` (0), `hygien kontroll kommun` (0),
`kontrollresultat` (0), `miljötillsyn restaurang` (0).

Efter bortsortering av irrelevant innehåll (butiksregister, gymnasiearbeten,
Stockholms skyltinventering, WSP- och Sweco-konsultlager) återstår:

| Ägare/organisation | Objekt | Kommun | Status |
|---|---|---|---|
| `yzdjo_jonkoping` | `Livsmedelsinspektioner`, `gis.jonkoping.se/arcgis/rest/services/DB_webvy/MapServer/38` | Jönköping | **Redan inläst** |
| `sthlm_miljo2023` | `Livsmedelstillsyn` | Stockholm | **Redan inläst** |
| `mattias_j` | `Livsmedelskontroller`, `Livsmedelskontroller 2024`, `Livsmedelskontroller_2`, `Förslag Livsmedelskontroller` | Oskarshamn | **Redan inläst** |
| `frta9628_`, `kals9017` | `Livsmedelskontroller App`, `Kontrollrapporter för Livsmedelsverksamheter` | Kristinehamn (`khamn`) | Byggs av annan agent |
| `JonasLundgren` | `Livsmedelskontroll` FeatureServer | Hallstahammar | **Token krävs**, se nedan |
| `fo@linde` | `Livsmedelsinspektion_results` | Samhällsbyggnad Bergslagen | **11 testposter**, se nedan |
| `ezgi.guler.tozluoglu` | `Livsmedelsverksamheter` | okänd, org `4HwpcMJ2Ty5JLU5R` | Token krävs, organisationen vägrar identifiera sig |

Notera Kristinehamns **andra** app, som R6 inte nämner:

```
https://khamn.maps.arcgis.com/apps/webappviewer/index.html?appid=a24c2902f72448e4a98ecad1fc648c40
```

("Kontrollrapporter för Livsmedelsverksamheter", ägare `kals9017`,
webbkarta `4a61da0dc94a4de5acb81b2415ac1298`.) R6 dokumenterar
`433ed9bb…` på `portal.kristinehamn.se`. De kan peka på samma
`Livsmedelsprotokoll/MapServer/14` men det är inte verifierat här. Värt en
kontroll innan Kristinehamn-adaptern låses.

### 3. Kartserversvep

Värdnamnen `karta|kartor|gis|geodata|kartportal|gisrest|portal|karttjanst|kartan|extkarta.<kommun>.se`
DNS-slogs upp för cirka 190 kommuner. De 280 som svarade på DNS provades mot
fem sökvägar:

```
/arcgis/rest/services?f=json
/server/rest/services?f=json
/geoserver/ows?service=WFS&version=1.1.0&request=GetCapabilities
/origo/index.json
/index.json
```

70 värdar svarade med en riktig katalog. För ArcGIS-katalogerna med
undermappar gjordes en rekursion ett steg ned (upp till 281 tjänster per
värd). **Noll livsmedelskontrollager.**

Enda "livsmedel"-träffen i hela svepet:

```
https://karta.tranas.se/geoserver/ows?service=WFS&version=1.1.0&request=GetCapabilities
→ 823 kB, lagren boxholm_kommunkarta:karta_livsmedelsbutik,
  odeshogext:karta_livsmedelsbutik, ydre_kommunkarta:karta_livsmedelsbutik
```

Det är butiks-POI för Boxholm, Ödeshög och Ydre. Ingen kontrolldata.
(Tranås GeoServer är alltså delad med grannkommunerna, vilket är värt att
minnas: en kommuns kartserver kan bära flera kommuners lager.)

### 4. Örebro-mönstret provat brett

Örebros egna REST-gränssnitt

```
https://www.orebro.se/rest-api/foodreport/search
```

provades som `/rest-api/foodreport/search` och `/api/foodreport/search` mot
30 kommundomäner. **Enda träffen är Örebro själv** (svarar med 1 234 poster,
fälten `Registrerades`, `Objektsnamn`, `Typ`, `AnlaggningId`, `Adress`,
oförändrat sedan R5). Gränssnittet är alltså inte en produkt som flera
kommuner kör, utan Örebros egenbygge.

### 5. Nationella dataportalen, kompletterande sökningar

R6 sökte `title:livsmedel*`. Här kompletterades med `title:inspektion*`,
`title:kontroll*`, `title:restaurang*` och `title:hygien*` mot
`https://admin.dataportal.se/store/search?type=solr&query=…&limit=100`.
De enda livsmedelsrelaterade posterna är Sambruks specifikationsdokument
(`Specifikation för Livsmedelsinspektioner`, `Vägledning Livsmedelsinspektioner`,
`JSON-exempel Livsmedelsinspektioner`, `Livsmedelsinspektioner - steg för att
publicera data`). Inga nya dataset. **R6:s slutsats står.**

Sambruks egen specsajt (`https://sambruk.github.io/livsmedel/`) innehåller
ingen förteckning över deltagande kommuner. Specen finns, implementationerna
gör det inte.

---

## Fynd 1. Norrköping (0581): publicerade per verksamhet, sidan är borttagen

Detta är det närmaste svepet kom en ny stor källa. Norrköping hade en
söksida med **resultat per verksamhet**, inte bara ett register:

```
https://norrkoping.se/boende-trafik-och-miljo/miljo-och-halsa/sok-resultat-fran-livsmedelskontroll?view=list&letter=S&sort=name&page=3
```

Sidan hade bokstavsnavigering (`letter=`), listvy (`view=list`), sortering på
namn och adress (`sort=-address`) och paginering, alltså ett komplett
alfabetiskt register över kontrollerade verksamheter.

**Den finns inte längre.** Bevis, tre oberoende:

1. `GET .../sok-resultat-fran-livsmedelskontroll` → **HTTP 404**, 59 953 byte
   (Norrköpings egen felsida). Samma svar med och utan `www`, med och utan
   frågesträng.
2. Sajtens sitemap `https://norrkoping.se/sitemap1.xml.gz` innehåller
   **10 440 URL:er**. Sidan finns inte bland dem. Ingen sida under
   `/boende-trafik-och-miljo/miljo-och-halsa/` handlar om livsmedel.
3. Sajtens egen sökfunktion `https://norrkoping.se/verktyg/sok?query=livsmedelskontroll`
   ger en enda sidträff: `/arbete-och-naringsliv/livsmedel-alkohol-tobak-med-mera/livsmedelsverksamhet`,
   som bara är informationstext (kontrollens syfte, taxa 2026, dricksvatten).

**Men appfilerna ligger kvar** och finns i sitemapen:

```
https://norrkoping.se/download/18.5ff942e1184b3f255e2417b/1664551481867/Livsmedelskontrollen.js    (10 422 B)
https://norrkoping.se/download/18.5ff942e1184b3f255e2417e/1707912652486/Livsmedelskontrollen.vm    (7 604 B)
https://norrkoping.se/download/18.5ff942e1184b3f255e249c74/1711465951727/Livsmedelskontrollen.css
```

Det är en SiteVision-webbapp (Velocity-mall plus JS). JS-filen innehåller
**ingen** anrops-URL till någon datakälla. Enda URL:en i den är
`?view=result&returnUrl=?&safeName=`, alltså en intern parameter till
`.vm`-mallen. Datat hämtas serverside i Velocity-mallen, vilket betyder att
det inte finns något gränssnitt att anropa utifrån även om sidan återkommer.
En framtida adapter måste skrapa HTML.

`.vm`-filen är daterad 2024-02-14 (`1707912652486`), CSS:en 2024-03-26.
Sidan togs alltså bort efter mars 2024.

**Rekommendation:** sätt Norrköping på bevakning. Prova
`sok-resultat-fran-livsmedelskontroll` igen om ett halvår. Norrköping är en av
Sveriges tio största kommuner; om sidan kommer tillbaka är det den största nya
källan som finns att hämta.

## Fynd 2. Hallstahammar (1961): R6 hittade fel organisation

R6 avskrev Hallstahammar efter att ha sökt igenom organisationen
`vkGU9ZuRu3qDJH0t` (40 objekt, 23 feature-tjänster) utan livsmedelsträff.

**Det finns en andra organisation.** Den globala AGOL-sökningen hittade ett
publikt objekt som pekar hit:

```
https://www.arcgis.com/sharing/rest/portals/5WHoNp62stHFcGAU?f=json
→ {"name":"Hallstahammars kommun","urlKey":"hallstahammar-us","region":"SE"}
```

Organisationen har 23 objekt, varav ett är:

```
Feature Service | Livsmedelskontroll | access: public
https://services3.arcgis.com/5WHoNp62stHFcGAU/arcgis/rest/services/Livsmedelskontroll/FeatureServer
```

Tjänsten är dessutom **listad i den publika tjänstekatalogen**:

```
https://services3.arcgis.com/5WHoNp62stHFcGAU/arcgis/rest/services?f=json
→ 12 tjänster: Detaljplan, Upptagningsområde, Servicelinjen, Skola,
  Ledig_mark, Lekplats, Kommunal mark, Mask, Livsmedelskontroll,
  Skolplanering, Översiktsplan, Tekniska_vy
```

Men varje läsning nekas:

```
.../Livsmedelskontroll/FeatureServer?f=json          → {"error":{"code":499,"message":"Token Required"}}
.../Livsmedelskontroll/FeatureServer/0?f=json        → {"error":{"code":499,"message":"Token Required"}}
.../Livsmedelskontroll/FeatureServer/0/query?...     → {"error":{"code":499,"message":"Token Required"}}
```

**Rättelse till R6:** Hallstahammar har inte tagit bort datat. Katalogposten
är publik, lagret finns, men själva tjänsten är inte delad publikt. Det är
skillnad på "finns inte" och "är inte delad". Det senare kan ändras med ett
klick i förvaltningens gränssnitt. Kommunens informationssida är alltså inte
inaktuell i sak, bara i praktiken.

Fortfarande ingen data att hämta. Men om Prikko någon gång kontaktar
kommuner är Hallstahammar den billigaste frågan att ställa: det behövs ingen
utveckling hos dem, bara en delningsinställning.

## Fynd 3. Samhällsbyggnad Bergslagen: en testenkät, inte en källa

```
https://services8.arcgis.com/UcAfAWomr5olCY5J/arcgis/rest/services/survey123_f15d73746d514b9dba9f017d11c337d9_results/FeatureServer/0
```

Organisationen är `Samhällsbyggnadsförvaltningen` (`sb-bergslagen`, region SE),
den gemensamma förvaltningen för Lindesberg (1885), Nora (1884), Hällefors
(1863) och Ljusnarsberg (1864). Tjänsten är publikt läsbar, till skillnad från
Hallstahammars.

Den är dock värdelös:

- `?returnCountOnly=true` → **`{"count":11}`**
- Fält: `fyll_i_ditt_namn` (kodad lista över inspektörer),
  `datum_och_klockslag_vid_inspekt`, `vilken_status_fick_inspektionen`,
  `skriv_valfri_kommentar_om_bes_k`, `hur_gick_bes_ket`
- Skapad 2022-11-03, senast ändrad 2022-11-04, ett dygns liv

Det är en Survey123-övning från en utbildning, inte publicerad kontrolldata.
Hela organisationen har tre objekt totalt (`Fastighetskarta_Portal`,
`Fastighetskarta`, `Livsmedelsinspektion_results`).

**Avskriven.** Men mönstret är värt att notera: kommunala förvaltningar lämnar
kvar publika Survey123-vyer. Om en sådan någon gång innehåller riktig
kontrolldata är den direkt läsbar utan token.

---

## Kontrollerade och avskrivna: publicerar INTE

Alla rader bygger på faktiska anrop. Leta inte igen utan skäl.

### Enskilt undersökta

| Kommun / organ | Kod | Vad som kontrollerades | Utfall |
|---|---|---|---|
| **Norrköping** | 0581 | Söksidan (404), sitemap 10 440 URL:er, sajtens egen sökfunktion, appfilerna `Livsmedelskontrollen.js/.vm/.css` | Publicerade tidigare, sidan borttagen efter mars 2024 |
| **Kristianstad** | 1290 | `livsmedelskontrollhosverksamheter.1000.html` (200, 187 kB) plus 17 livsmedelssidor i sitemapen | Ren informationstext. Noll `<iframe>`, noll arcgis-referenser, ingen lista |
| **Ronneby** | 1081 | `livsmedelskontroll.html` (200, 78 kB) | Ren informationstext. Ingen lista, ingen karta |
| **Karlshamn, Sölvesborg, Olofström** | 1082, 1083, 1060 | `miljovast.se/.../livsmedelskontroll.html` (200, 76 kB). Miljöförbundet Blekinge Väst är kontrollmyndighet för alla tre | Beskriver kontrollens gång och avvikelsehantering. Publicerar inga resultat, inga länkar till resultat |
| **Bollnäs** | 2183 | `.../2024-04-04-resultat-av-livsmedelskontrollerna-2023` (200, 66 kB) | Endast **aggregerad statistik**: 122 planerade kontroller, 90 uppföljande, 42 utan avvikelse, 80 med avvikelse, 12 förelägganden, 240 registrerade verksamheter. Ingen verksamhetsnivå. Samma mönster som Ljusdal |
| **Miljösamverkan östra Skaraborg** | Skövde 1496 m.fl. (medlemslistan ej verifierad i detta svep) | `miljoskaraborg.se`, projektrapportarkivet under `/globalassets/projektrapporter/livsmedel/` | Endast **projektrapporter** per bransch (pizzerior, butiker, skolor) i PDF. Samma mönster som Malmö: aggregat, inte per verksamhet |
| **Karlskrona** | 1080 | Den inbäddade ArcGIS-appen på livsmedelssidorna, `80b866c6c09941668eaa87085a074ff2` | Appen heter `Planmosaik (DPkoll)`, alltså detaljplaner. Sidmallen bäddar in samma karta överallt. Falskt spår |
| **Falun** | 2080 | Den inbäddade ArcGIS-kartan `957ea6b2b13f40c2825e8d0023a5c68e` | Webbkartan heter `Skolor Falu kommun` och har två lager: adresser och utbildning/barnomsorg. Falskt spår |
| **Hallstahammar** | 1961 | Andra AGOL-organisationen `5WHoNp62stHFcGAU` | Lagret finns, tjänsten kräver token. Se Fynd 2 |
| **Samhällsbyggnad Bergslagen** | 1885, 1884, 1863, 1864 | Survey123-vyn, 11 poster från 2022 | Testenkät. Se Fynd 3 |

### Sitemap-svepta utan en enda resultatsida

Metoden är beskriven ovan. Kolumnen visar antal indexerade URL:er och antal
sidor med `livsmedel` i URL:en. Ingen av dem innehöll en lista, en karta eller
ett gränssnitt med resultat per verksamhet.

| Domän | URL:er i sitemap | Livsmedelssidor |
|---|---:|---:|
| umea.se | 23 780 | 17 |
| falun.se | 24 820 | 9 |
| kalmar.se | 21 508 | 3 |
| ostersund.se | 17 564 | 4 |
| gallivare.se | 17 711 | 7 |
| saffle.se | 16 659 | 38 |
| uddevalla.se | 15 802 | 20 |
| lulea.se | 14 646 | 5 |
| strangnas.se | 14 196 | 20 |
| vaxjo.se | 14 138 | 2 |
| botkyrka.se | 13 424 | 12 |
| harnosand.se | 12 910 | 9 |
| varnamo.se (kommun.varnamo.se) | 12 530 | 12 |
| borlange.se | 12 325 | 10 |
| ovanaker.se | 12 037 | 16 |
| tyreso.se | 11 556 | 9 |
| huddinge.se | 10 848 | 7 |
| gotland.se | 10 844 | 11 |
| kristianstad.se | 10 497 | 17 |
| katrineholm.se | 10 180 | 18 |
| hudiksvall.se | 10 014 | 15 |
| sundsvall.se | 9 538 | 14 |
| sigtuna.se | 9 100 | 24 |
| upplandsvasby.se | 9 082 | 7 |
| svalov.se | 9 055 | 2 |
| kiruna.se | 9 020 | 10 |
| osby.se | 9 007 | 10 |
| knivsta.se | 8 865 | 17 |
| nordanstig.se | 8 786 | 2 |
| ludvika.se | 8 694 | 13 |
| hylte.se | 8 641 | 8 |
| lund.se | 8 430 | 15 |
| boden.se | 8 315 | 8 |
| molndal.se | 8 242 | 15 |
| jarfalla.se | 8 044 | 15 |
| varmdo.se | 7 620 | 10 |
| vaxholm.se | 7 440 | 5 |
| varberg.se | 6 952 | 14 |
| kramfors.se | 6 677 | 11 |
| upplands-bro.se | 6 386 | 17 |
| tomelilla.se | 6 156 | 0 |
| nykvarn.se | 5 990 | 2 |
| vetlanda.se | 5 932 | 11 |
| orkelljunga.se | 5 842 | 0 |
| soderhamn.se | 5 831 | 17 |
| lindesberg.se | 5 486 | 2 |
| timra.se | 4 996 | 19 |
| ekero.se | 4 746 | 2 |
| ornskoldsvik.se | 4 622 | 9 |
| simrishamn.se | 4 263 | 4 |
| arvika.se | 4 042 | 15 |
| kavlinge.se | 4 002 | 1 |
| halmstad.se | 3 955 | 39 |
| heby.se | 3 944 | 3 |
| sala.se | 3 750 | 0 |
| tierp.se | 3 725 | 13 |
| taby.se | 3 688 | 6 |
| solleftea.se | 3 181 | 12 |
| karlskoga.se | 3 057 | 6 |
| ostragoinge.se | 2 809 | 10 |
| salem.se | 2 760 | 2 |
| bollnas.se | 2 730 | 9 |
| kungsbacka.se | 2 629 | 13 |
| falkenberg.se | 2 204 | 0 |
| ystad.se | 2 188 | 16 |
| eslov.se | 1 999 | 2 |
| horby.se | 1 774 | 13 |
| hoor.se | 1 464 | 7 |
| astorp.se | 1 360 | 1 |
| sandviken.se | 1 273 | 6 |
| hedemora.se | 1 056 | 8 |
| motala.se | 976 | 3 |
| vellinge.se | 917 | 12 |
| trelleborg.se | 501 | 2 |
| mora.se | 217 | 0 |
| gavle.se | 8 (sitemap ofullständig) | 6 |

Följande hade sitemap med 0 eller 1 URL och kontrollerades i stället via
sidträffar och riktade sökningar mot domänen. Även dessa saknar resultatsidor:
Solna, Sollentuna, Lidingö, Norrtälje, Österåker, Nynäshamn, Danderyd,
Vallentuna, Håbo, Östhammar, Landskrona, Staffanstorp, Burlöv, Bjuv, Klippan,
Perstorp, Båstad, Skurup, Laholm, Bromölla, Svedala, Köping, Kalix, Avesta,
Piteå, Trollhättan, Skövde, Haninge, Karlskrona.

Även dessa gemensamma förvaltningar/förbund saknar publicerade resultat på sin
webbplats: Söderåsens miljöförbund, Södra Roslagens miljö- och
hälsoskyddskontor (srmh.se), Västra Mälardalens myndighetsförbund (vmmf.se),
Samhällsbyggnad Bergslagen (sbbergslagen.se), Miljöförbundet Blekinge Väst,
Miljösamverkan östra Skaraborg.

### Kartservrar svepta utan livsmedelsträff

Ny lista, utöver R6:s. ArcGIS-katalogerna genomsöktes rekursivt ett steg ned i
mappstrukturen.

`geodata.almhult.se` (13 mappar, ~150 tjänster), `kartor.gotland.se`
(30 mappar, ~281 tjänster), `gis.arvika.se` (10 mappar, ~209 tjänster),
`gis.mjolby.se` (15 mappar, ~122 tjänster), `geodata.koping.se` (11 mappar,
~80 tjänster), `gis.vellinge.se` (25 mappar, ~73 tjänster), `gis.sandviken.se`
(13 mappar, ~59 tjänster), `gis.tjorn.se` (13 mappar, ~41 tjänster),
`karta.kungsbacka.se` (GeoServer, 505 kB katalog), `karta.ale.se`
(GeoServer 110 kB + Origo-konfig 24 kB), `karta.koping.se` (GeoServer 153 kB +
Origo-konfig 136 kB), `karta.leksand.se` (GeoServer 47 kB + konfig 27 kB),
`karta.skinnskatteberg.se` (GeoServer 24 kB + konfig 132 kB),
`karta.haninge.se` (Origo-konfig 127 kB), `karta.rattvik.se` (konfig 41 kB),
`gis.hudiksvall.se` och `kartor.hudiksvall.se` (Origo-konfig 7 kB),
`geodata.arboga.se`, `geodata.filipstad.se`, `geodata.partille.se`,
`geodata.sala.se`, `geodata.smedjebacken.se`, `geodata.tanum.se`,
`geodata.tidaholm.se`, `geodata.varnamo.se`, `geodata.vaggeryd.se`,
`geodata.kungsor.se`, `geodata.mullsjo.se`, `gis.falun.se`, `gis.gavle.se`,
`gis.hjo.se`, `gis.mark.se`, `gis.soderhamn.se`, `gis.varnamo.se`,
`gis.arjang.se`, `gis.bollebygd.se`, `gis.flen.se`, `gis.lessebo.se`,
`gis.monsteras.se`, `gis.surahammar.se`, `karta.alvesta.se`, `karta.kumla.se`,
`karta.mark.se`, `karta.varnamo.se`, `karta.vellinge.se`,
`karta.atvidaberg.se`, `karta.morbylanga.se`, `karta.vingaker.se`,
`kartor.harryda.se`, `kartor.laholm.se`, `kartor.mark.se`,
`kartor.gislaved.se`, `kartportal.ystad.se`.

Följande värdnamn svarade inte alls på någon av de fem sökvägarna (DNS fanns,
men ingen katalog): `karta.botkyrka.se`, `karta.huddinge.se`,
`karta.solna.se`, `karta.taby.se`, `karta.sollentuna.se` (503),
`kartor.jarfalla.se`, `portal.trollhattan.se`, `karta.skovde.se`,
`gis.karlskrona.se`, `karta.landskrona.se`, `portal.motala.se`,
`karta.katrineholm.se`, `kartor.ostersund.se`, `kartor.varberg.se`,
`geodata.haninge.se`, `geodata.solna.se`, `geodata.landskrona.se`,
`geodata.skovde.se`, `geodata.falun.se`, `portal.huddinge.se`,
`portal.haninge.se`, `portal.jarfalla.se`, `portal.taby.se`,
`portal.karlskrona.se`, `portal.falun.se`, `portal.skovde.se`,
`portal.katrineholm.se`. Deras publika kartor ligger bakom SPA-ramverk
(`spatialmap`, `mycartawebmap`, `clientapi/minimap2`) som inte exponerar någon
katalog. Ingen av dem nämner livsmedel på sina livsmedelssidor, så det är ett
svagare men samstämmigt negativ.

---

## Vad andra vändan lär oss

1. **Upptäcktsfasen är slut.** Två uttömmande nationella kanaler
   (dataportalen, ArcGIS Online) och ett sitemap-svep över 110 kommuner ger
   noll nya levande källor. Fler kommuner hittas nu bara en och en, av en
   människa som råkar se dem. Prioritera adaptrarna som redan är kartlagda:
   Örebro, sedan Lomma och Höganäs.

2. **Källor försvinner snabbare än de tillkommer.** R6 dokumenterade tre
   döda källor (Västerås, Hallstahammar, Enköping). R9 lägger till en fjärde
   som var levande så sent som 2024 och den största av dem alla,
   **Norrköping**. Noll nya har tillkommit. Adaptrarna måste tåla att en
   källa dör, och sajten får aldrig visa ett omdöme från en källa som inte
   längre svarar.

3. **Bevakningslista i stället för svep.** Tre kommuner har infrastrukturen
   men inte publiceringen: Norrköping (appfilerna kvar), Hallstahammar
   (lagret finns, delas inte), Västerås (kartservrar och GeoServer i drift).
   Ett billigt månatligt skript som anropar de tre kända adresserna är mer
   värt än ännu ett svep.

4. **Gemensamma miljöförbund är ingen genväg.** Sex av dem kontrollerades.
   Ingen publicerar per verksamhet, trots att de täcker 15+ kommuner
   tillsammans och trots att en enda publicering hos dem hade gett flera
   kommuner på en gång.

5. **Aggregat är standardsvaret.** Ljusdal, Bollnäs, Malmö och Miljösamverkan
   östra Skaraborg publicerar alla siffror på förvaltningsnivå eller
   branschrapporter. Det ser ut som transparens och är oanvändbart för
   Prikko. Räkna med att varje ny träff på "resultat från livsmedelskontroll"
   är ett aggregat tills motsatsen är bevisad med ett faktiskt anrop.

6. **Falska spår kommer från sidmallar.** Karlskrona och Falun bäddar in en
   ArcGIS-karta på sina livsmedelssidor. Båda visar något helt annat
   (detaljplaner respektive skolor). En inbäddad karta på en livsmedelssida
   är en hypotes, inte ett fynd. Objektets titel måste slås upp innan den
   räknas.
