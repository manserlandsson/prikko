# Källinventering — svenska kommuners livsmedelskontroll

**Verifierat 2026-08-02** genom faktiska anrop, inte genom att läsa vad
kommunerna säger att de publicerar.

Huvudslutsats: **inget gemensamt format finns.** Sambruk/NSÖD-specen existerar
men följs inte av någon av de källor vi hittills mött. Varje kommun kräver en
egen adapter. Det är dyrt — och det är precis därför ingen byggt det här förut.

## Inlästa

| Kommun | Verksamheter | Åtkomst | Format | Koordinater | Kvarstår-etikett | Avvikelser specificerade |
|---|---:|---|---|---|---|---|
| Linköping | 1 241 | Öppet API | JSON, egen modell | SWEREF 99 15 00 | Ja | Ja |
| Stockholm | 8 511 | E-tjänstens gränssnitt | JSON, egen modell | SWEREF 99 18 00 | **Nej** | Ja |
| Uppsala | 1 843 | E-tjänstens gränssnitt | **HTML** | **Saknas** | Ja | Ja |
| Jönköping | 1 120 | ArcGIS REST | JSON + fritext | **WGS84 färdigt** | **Nej** | **Nej** |
| Karlstad | 694 | GeoServer WFS | JSON | SWEREF 99 13 30 | **Nej** | **Nej** |
| Örebro | 1 234 | REST + inbäddad JS | JSON + HTML | **Saknas** | Ja | **Ja, båda utfallen** |
| Oskarshamn | 239 | ArcGIS REST | JSON | SWEREF 99 16 30 | **Nej** — ordet finns, betyder annat | **Nej** |
| Lomma | 153 | Öppen webbsida | **HTML, handredigerad** | **Saknas** | **Nej** | **Ja, fritext per område** |
| Höganäs | 310 | Öppet filarkiv | **Filnamn** | **Saknas** | **Nej** | **Nej** (bara i PDF) |
| Svenljunga | 99 | Öppen webbsida | **PDF-rapporter** | **Saknas** | **Nej** | Ja i rapporten, ej utvinnbart |
| Kristinehamn | 170 | ArcGIS REST | JSON + **PDF-bilagor** | SWEREF 99 13 30 | **Nej** — men kontrolltyp finns | Ja i rapporten, ej utvinnbart |

Nästa att bygga: **Borgholm**, som kräver tolkning av en PDF-TABELL. Se R6. Västerås och Hallstahammar publicerar inte längre
trots vad deras egna sidor påstår, och Sjöbos HTML motsäger sig själv i 19 %
av fallen — ingen av de tre är byggbar.

Stockholms, Jönköpings, Karlstads och Oskarshamns avsaknad av "kvarstår" är
skälet till att bedömningsmodellen härleder allvarsgraden ur mönstret i
stället för ur etiketten (se `grading.py`). **Fyra av sju källor saknar
etiketten** — det var inget undantag, det är normalläget. Hade modellen byggt
på etiketten hade bara Linköping, Uppsala och Örebro någonsin kunnat visa
allvarliga brister, och jämförbarheten mellan kommuner — hela poängen med
Prikko — hade fallit.

Oskarshamn visar dessutom varför etiketten inte går att lita på ens när den
ser ut att finnas: kommunen har ett värde som *heter* "Kvarstående
avvikelser", men som betyder "det finns öppna avvikelser" — inte Linköpings
"avvikelsen överlevde en uppföljning". Ord som ser lika ut betyder olika
saker i olika kommuner. Se avsnittet nedan.

## Inlästa i detalj

### Jönköping — 1 120 verksamheter, BILLIGASTE KÄLLAN
```
https://gis.jonkoping.se/arcgis/rest/services
  /kommunatlas/Kommunatlas_Naringsliv_och_Arbete/MapServer/{10,11,12,13,14}
  /query?where=1=1&outFields=*&outSR=4326&f=json
```
Fem underlager: Restaurang och servering (526), Skola och omsorg (308),
Butik och handel (198), Övrigt (48), Tillverkare (40). Hela beståndet i fem
anrop, och koordinaterna kommer färdiga i WGS84 — ingen SWEREF-transform.

Utfall vid inläsningen: 1 118 av 1 120 bedömda, 2 007 kontroller, 121 med
utmärkelse, 3 med kvarstående brister, 0 överhoppade.

Historiken ligger som fritext i `senaste_kontroller`:
```
2026-04-21 Planerad kontroll <br>Kontrollresultat: Utan avvikelse<br>
2025-08-14 Uppföljande kontroll <br>Kontrollresultat: Utan avvikelse<br>
```

Tre saker som var värda att verifiera i stället för att anta:

- **Fältet rymmer högst tre kontroller.** Uppmätt historikdjup: 538
  verksamheter har en, 266 har två, 314 har tre, ingen har fler. Det
  sammanfaller med modellens `HISTORY_DEPTH`, så bedömningen påverkas inte —
  men "ingen historik före detta" är inte samma sak som "inga kontroller före
  detta" och sidan får inte påstå det senare.
- **`har_avvikelse` är oberoende facit.** Flaggan stämde med vår tolkning av
  senaste raden i 1 120 fall av 1 120. Adaptern kontrollerar den vid varje
  körning; slutar den stämma har formatet ändrats och vi ska få veta det i
  stället för att publicera vidare.
- **`OBJECTID` duger inte som identitet.** Den är unik i stunden (noll
  krockar över de fem lagren) men ArcGIS numrerar om vid ompublicering, vilket
  är precis hur tjänsten uppdateras. Identiteten hashas därför ur namn+adress,
  verifierat unikt över alla 1 120.

Avvikelserna specificeras däremot inte alls — `har_avvikelse` är 0/1 och det
finns ingen uppdelning per kontrollområde. Sidorna kan visa ATT en avvikelse
noterats men inte VAD den gällde. Det är den sämsta detaljnivån av de fyra
inlästa källorna.

### Karlstad — 694 verksamheter
Tidigare avskriven som "avstängd under systembyte". **Det var fel** — kartan
fungerar, och avskrivningen byggde på en sökträff i stället för ett anrop.

Karlstad kör **Origo**, ett öppet svenskt kartramverk. Konfigurationen ligger
på `https://gi.karlstad.se/origo/index_ssl.json` (243 kB). Filen är
handredigerad och går **inte** att JSON-parsa — den innehåller
`//`-kommentarer, utkommenterade `/* … */`-block och avslutande kommatecken.
Lagren måste plockas ut med riktad textsökning, inte med `json.loads`.

Datat ligger i en GeoServer:
```
https://gi.karlstad.se/geoserver/ows
  ?service=WFS&version=1.1.0&request=GetFeature
  &typeName=webbkartan:livsmedelskontroller_{restaurang|skolaomsorg|butikhandel|ovrigt}
  &outputFormat=application/json
```
Restaurang och servering (338), Skola och omsorg (150), Butik och handel
(109), Övrigt (97) — 694 totalt, varav 601 har kontrollresultat.

Fält: `namn, kategori, inriktning, senaste_tillsyn_datum, kontroll,
avvikelser, arendenummer`. Resultatet är `avvikelser: Ja/Nej` och
kontrolltypen `Ordinarie kontroll` / `Extra kontroll`.

Utfall vid inläsningen: 601 av 694 bedömda, 474 utan anmärkningar, 92 med
brister, 35 med kvarstående brister, 0 överhoppade.

Fyra saker som avgjorde bygget:

- **Begär inte `srsName=EPSG:4326`.** Servern avrundar då till två decimaler,
  alltså ungefär en kilometers fel. I inhemsk projektion (EPSG:3008 =
  SWEREF 99 13 30) kommer full precision, och `geo.py` klarar zonen. Vår
  transform validerades mot `pyproj` — 0,000 m skillnad — och mot serverns
  egen WGS84 över 338 punkter, där största avvikelsen var 621 m mot ett
  teoretiskt avrundningsmax på 624 m.
- **"Extra kontroll" är uppföljningen**, och det är kommunens egen
  definition, inte vår tolkning: *"När verksamheten har fått en eller fler
  avvikelser som behöver följas upp kan det behövas extra kontrollbesök"*
  (karlstad.se). En extrakontroll som ändå finner avvikelser beskriver
  alltså per kommunens definition brister som inte åtgärdats. Det är grunden
  för de 35 med kvarstående brister.
- **Bara senaste kontrollen publiceras**, och bara kontroller efter
  1 januari 2024. Ingen historik alls, inga specificerade avvikelser.
  Utmärkelsen (tre rena i rad) blir därmed omöjlig att nå i Karlstad — 0 av
  694. Det är en verklig asymmetri mot Linköping och ska framgå av
  metodiksidan, inte döljas.
- **Ingen adress publiceras** — bara namn och position. Sajtens listor måste
  därför tåla att adressfältet är tomt; separatorerna hängde löst tills det
  rättades.

Ett fynd om källans kvalitet: `Skutbergets Motionscentral` ligger enligt
kommunens data 13,545 °Ö, medan verkliga Skutberget ligger väster om centrum.
Beståndet i övrigt är rumsligt korrekt — 209 verksamheter inom en kilometer
från Stora torget, och ett tydligt kluster vid Bergviks köpcentrum. Det är
alltså en enskild felregistrering hos kommunen. **Vi återger källan, vi
rättar den inte** — men det är ett argument för att låta verksamheter
korrigera sin position via rättelsefunktionen.

### Oskarshamn — 239 verksamheter, HELA BESTÅNDET I SEX ANROP
```
https://gisrest.oskarshamn.se/server/rest/services/Externt
  /Livsmedelskontroller_2024/MapServer/{0,2,3,4,5,6}
  /query?where=1=1&outFields=*&outSR=3010&f=json
```
Restauranger (62), Caféer och bagerier (16), Kiosker (10), Butiker (41),
Skolkök (21), Övriga (91) — 241 rader. Lager-id 1 finns inte; luckan är
kommunens egen. Ingen token krävs, `maxRecordCount` är 2 000 och räcker.

**Varning:** kommunens webbkarta pekar även på en tjänst
`Externt/Livsmedelskontroller2`, som svarar `{"error":{"code":499,"message":
"Token Required"}}`. Rätt tjänst är `Livsmedelskontroller_2024`, som trots
årtalet innehåller kontroller in i juli 2026.

Utfall vid inläsningen: 239 anläggningar (241 rader minus två som publicerats
i två lager var), 214 kontroller, 208 bedömda — 151 utan anmärkningar, 57 med
brister, 0 med kvarstående brister, 0 utmärkelser, 0 överhoppade.

Fem saker som avgjorde bygget:

- **`Bedomning` bär två skalor samtidigt.** Kommunen bytte kontrollmodell
  1 januari 2024 och skriver det själv i kartan: före 2024 gavs
  `Godtagbar` / `Ej godtagbar`, efter 2024 `Inga avvikelser` / `Kvarstående
  avvikelser`. Uppdelningen syns i datan utan undantag — alla 7 `Godtagbar`
  har tillsynsdatum före 2024-01-01, alla 209 av den nya modellen efter.
- **"Godtagbar" betyder godkänd**, precis som i Linköping. Tre oberoende
  belägg: lagrets egen ArcGIS-renderer grupperar `Godtagbar` och `Inga
  avvikelser` i samma klass ("Inga avvikelser | Godtagbar"); oskarshamn.se
  beskriver båda som blå symbol, *"Företaget är godtagbart eller eventuella
  brister är inte allvarliga"*; och alla 7 har `AntalKvarstAvvikelser = 0`.
- **"Kvarstående avvikelser" är INTE Linköpings "Kvarstår".** Det betyder
  "det finns öppna avvikelser", inte "avvikelsen överlevde en uppföljning".
  Kommunens läsanvisning ställer värdet mot "inte finns några avvikelser" som
  ett tvåvärt val, och de två delar hela den kontrollerade populationen
  (152 + 57 = 209 av 209) — fanns ett tredje tillstånd skulle det synas.
  Andelen säger samma sak: 27 %, mot under en procent i kommuner som verkligen
  mäter kvarstående efter uppföljning (Linköping: 4 av 1 241). Värdet mappas
  därför till *mindre* anmärkning. Källan saknar både historik och
  kontrolltyp, så `grading.py` kan aldrig skärpa till allvarlig i
  Oskarshamn — samma asymmetri som i Karlstad, och den hör hemma på
  metodiksidan.
- **`Bedomning = null` betyder ALDRIG KONTROLLERAD**, inte godkänd. Exakt de
  25 rader som saknar värdet saknar också `TillsynsDatum`. De blir obedömda
  och no-indexerade. Ytterligare 6 föll ur treårsfönstret (gamla modellens
  `Godtagbar`, äldst 2019-03-19).
- **`AnlaggningId` är en riktig identitet** — ett GUID ur ärendesystemet, 239
  distinkta. Det behövs: `Ik Oskarshamn` förekommer två gånger på
  Döderhultsvägen 5A med skilda GUID, så Jönköpings hash av namn+adress hade
  slagit ihop två verksamheter till en. ArcGIS `ESRI_OID` duger inte alls —
  det är unikt per lager, bara 91 distinkta värden för 241 rader.

**Unikt för källan: `AntalKvarstAvvikelser` är ett numeriskt mått**, 0–5, och
den första källa vi sett som anger HUR MÅNGA avvikelser som är öppna:

| Öppna avvikelser | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---:|---:|---:|---:|---:|---:|
| Verksamheter | 183 | 38 | 12 | 5 | 2 | 1 |

Sambandet mot etiketten är exakt och används som oberoende facit i adaptern,
på samma sätt som Jönköpings `har_avvikelse`: `Inga avvikelser` / `Godtagbar`
har alltid 0, `Kvarstående avvikelser` alltid minst 1. Gällde i 241 fall av
241. Ett känt undantag finns — `Mäster palm enhet 2` har 2 kvarstående
avvikelser men varken datum eller bedömning, och blir obedömd.

Datamodellen har ingen kolumn för måttet. Det bärs vidare i JSON-utdatan som
`openDeviations` per kontroll så att det inte tappas, och förslaget är en
nullbar `open_deviations integer` på `inspections`. Ändringen är medvetet inte
gjord: den berör alla kommuner och bör tas när en andra källa levererar samma
mått, så att kolumnen betyder samma sak tvärs över källor.

Två begränsningar: **ingen historik** (en rad per anläggning, senaste
kontrollen) och **avvikelserna specificeras inte** — fältet
`AvvikelseAnteckningar` finns i schemat men är null i samtliga 241 rader.

Koordinaterna kommer i SWEREF 99 16 30 (EPSG:3010), en zon `geo.py` inte hade
sedan tidigare. Transformen validerades mot serverns egen omprojicering: hämtas
samma lager med `outSR=4326` skiljer vår beräkning på nionde decimalen, cirka
en tiondels millimeter över alla 62 punkter i lager 0. En verksamhet
(`Klintemåla vattenverk`) har `x=16, y=57` — någon har skrivit WGS84-grader i
ett SWEREF-fält — och fångas av `looks_like_sweden()`.

### Lomma — 153 verksamheter, FYRA ANROP, men helt handredigerad
```
https://lomma.se/jobbochforetagande/tillstandreglerochtillsyn/livsmedel
  /livsmedelsinspektioner/{restaurangerochcafeer.1220, butiker.1219,
   skolorforskolorochannanomsorg.1221, ovrigaverksamheter.1222}.html
```
Restauranger och caféer (60), Butiker (19), Skolor och omsorg (40), Övriga
(38) — 157 poster, 154 distinkta namn. R6 räknade 156 i juli; sidorna
redigeras för hand och beståndet rör sig.

Utfall vid inläsningen: 153 anläggningar, 150 kontroller, 128 bedömda — 57
utan anmärkningar, 69 med brister, 2 med kvarstående brister, 0 utmärkelser,
1 överhoppad.

Fem saker som avgjorde bygget:

- **Grön prick betyder INTE felfri.** Kommunens egen läsanvisning säger
  "inga eller ett fåtal avvikelser som inte leder till en extra kontroll",
  och 67 av 143 gröna poster räknar upp avvikelser i texten. Omdömet inom
  grönt avgörs därför av avvikelsetexten, inte av färgen. Annars hade sidan
  skrivit "inga anmärkningar" ovanför en lista med anmärkningar.
- **Följden är att Lomma ser sämre ut än alla andra inlästa kommuner:**
  54 % med anmärkning, mot Jönköpings 14 %, Karlstads 21 % och Oskarshamns
  27 %. Det är samma REGEL som i de andra kommunerna — varje noterad
  avvikelse ger mindre anmärkning — men Lomma redovisar avvikelser mer
  finkornigt. Skillnaden är alltså troligen redovisningspraxis, inte hygien,
  och den hör hemma på metodiksidan tillsammans med Karlstads och
  Oskarshamns motsatta asymmetri. Skulle vi i stället låta färgen ensam
  bestämma landade Lomma på 8 % och såg konstlat rent ut.
- **Gul prick är MINDRE anmärkning.** "Avvikelser som leder till en extra
  kontroll" beskriver en uppföljning som ska ske, inte en avvikelse som
  överlevt en. Samma fälla som Oskarshamns "Kvarstående avvikelser". Röd är
  däremot strängare definierad än de flesta källors högsta nivå: den kräver
  myndighetsåtgärd, föreläggande eller förbud.
- **Läsanvisningen kontrolleras vid varje körning.** Färgen är hela omdömet,
  och det enda som binder färgen till en betydelse är texten överst på
  sidan. Ändras den stoppar inläsningen. Antalet poster stäms dessutom av
  mot antalet "Senaste inspektion" i innehållet, så att en post som hamnar
  utanför en färgrubrik räknas i stället för att tappas tyst. Det är den
  konsistenskontroll R6 efterlyste för handredigerade källor.
- **Identiteten hashas ur namnet**, eftersom kommunen varken publicerar id
  eller adress. Sidans rubrik ingår inte i nyckeln: flyttas en verksamhet
  mellan sidorna ska URL och historik följa med. Tre namn står på två sidor
  var; de slås ihop till en verksamhet med alla sidors typer, och den
  senast daterade posten avgör omdömet. Att i stället bygga en historik av
  två poster hade varit farligt — `grading.py` läser föregående kontroll som
  tecken på kvarstående brist, och Lomma publicerar bara senaste kontrollen.

Handredigeringen syns i datan: 20 textformer för 15 kontrollområden med
stavfelen `tempratur`, `persolig hygien`, `personlig hygie`, `utforming av
lokal` och tre stavningar av `separering allergener`; åtta former av "inga
avvikelser"; tre poster under en färgrubrik utan datum; en post med
`2025-11-?` som datum (skippas — ett kontrolldatum får inte avrundas fram);
och en gul post där frasen "inga avvikelser" står kvar hopskriven med nästa
område (`inga avvikelserseparering avfall, svårstädad lokal, förvaring`).
Den sista behåller sitt omdöme, eftersom färgen är entydig, men märks
`uncertain` för att områdeslistan är ofullständig.

**Ingen adress publiceras**, bara namn. Därmed går inte heller
`pipeline/geocode.py` att använda: Lomma får inga kartnålar alls. Ingen
historik och ingen kontrollorsak heller, så utmärkelsen kan aldrig nås och
`grading.py` kan aldrig skärpa ett gult till allvarligt.

### Höganäs — 310 verksamheter, TRE ANROP, ingen PDF öppnad
```
https://www.hoganas.se/boende-trafik--miljo/boendemiljo/livsmedel
  /livsmedelskontroller.html?folder=<mapp>&sv.url=12.33c1739617a7615ad6625ea9
```
Tre mappar i ett SiteVision-filarkiv: Butiker/restauranger/serveringar/övrigt
(228 filer), Livsmedelstillverkare och grossister (25), Barnomsorg, skolkök,
vård och omsorg (80). 333 PDF-filer, och hela resultatet står i filnamnet:
`<namn>, <ort>, <ÅÅÅÅ-MM-DD>, <färg>.pdf`.

Utfall vid inläsningen: 310 anläggningar, 330 kontroller, 290 bedömda — 264
utan anmärkningar, 25 med brister, 1 med kvarstående brister, 0 utmärkelser,
2 överhoppade filnamn.

Fem saker som avgjorde bygget:

- **Källan HAR historik**, tvärtemot vad R6 antog. 19 verksamheter har fler
  än en rapport, och 15 av dem är en gul rapport följd av en grön 7 till 55
  dagar senare — alltså återbesöket. Höganäs publicerar uppföljningen.
- **Därför är Höganäs den enda tunna källan där modellen kan härleda en
  kvarstående brist.** `Rewi AB` har gul 2025-12-12, gul 2026-01-21 och gul
  2026-02-27. Kommunen har inget ord för "kvarstår", men tre gula i rad ÄR en
  brist som överlevt två besök, och `grading.py` läser det ur mönstret. Det
  är precis det fall modellen byggdes för.
- **Röd är mappad till allvarlig, men förekommer inte** (0 av 333). Ordet
  ("kräver återbesök") liknar Lommas GULA nivå, så mappningen vilar inte på
  formuleringen utan på tre andra saker: röd är toppen av kommunens egen
  tregradiga skala vars mellansteg redan täcker varje avvikelse; gul ligger
  på 13 % vilket är Jönköpings "med avvikelse"-nivå; och gula rapporter får
  redan återbesök i praktiken, så röd måste betyda något utöver det. Det är
  ändå den enda mappning i projektet som inte gått att pröva mot verklig
  data. Dyker en röd rapport upp bör den läsas innan omdömet publiceras.
- **Orten får inte ingå i identiteten.** `Jonstorpsskolans kök` har tre
  rapporter med tre olika orter (`Höganäs`, `Jonstorp`, `Högnäs` — och skolan
  ligger i Jonstorp) och `Ingelsträde Gård` två. Med orten i nyckeln blev en
  skolmatsal tre verksamheter med tre olika omdömen, två av dem publicerade
  under samma namn. Namnet ensamt räcker: 310 distinkta namn på 332 läsbara
  rapporter, och samtliga 20 namn som återkommer är verkligen samma
  verksamhet. Filens SiteVision-nyckel duger inte heller — den hör till
  dokumentet och byts vid varje uppladdning.
- **Fältordningen i filnamnet är inte pålitlig.** 12 av 333 avviker: färgen
  före datumet, ort och datum ihopskrivna, komma saknas mellan datum och
  färg, orten utelämnad, ett extra led mellan namn och ort (`City Food,
  mobil`), ett diarienummer där orten skulle stå, komma inuti namnet
  (`Nyhamnsskolan (hemkunskap, fritids)`), en punkt i datumet (`2025-11.10`).
  Datum och färg plockas därför ut på mönster och resten läses positionellt.
  Färgordet måste matchas med ordgräns: utan den träffar "röd" inne i
  `Heljarödsgården` och `Långarödsvägen`, och två filer hade fått fel omdöme.

Två filnamn går inte att läsa och hoppas över med utskrivet skäl:
`cReal Food, Höganäs, 14 nov 20204, grön.pdf` (årtalet kan vara 2024 eller
2020) och `Cake & Bake, Höganäs, 2024-00-05, grön.pdf` (månad 00). Cake & Bake
finns kvar via sin andra rapport; cReal Food försvinner tills kommunen rättar
filnamnet.

**PDF:erna hämtas medvetet inte.** Avvikelserna står bara inne i dem, och 333
extra anrop varje natt mot en kommunwebbplats är inte värt en detalj sidan
klarar sig utan. Länken bärs i stället vidare per kontroll som `reportUrl`,
så att besökaren kan läsa originalet och en senare PDF-tolkning har adressen
kvar. Ingen gatuadress publiceras, bara ort, så `geocode.py` kan inte ge
Höganäs några kartnålar.

### Svenljunga — 99 verksamheter, hela rapporten men en femtedel inskannad
```
https://www.svenljunga.se/naringsliv--arbete/tillstand-regler-och-tillsyn
  /livsmedel/livsmedelskontroll-och-avgifter/resultat-fran-livsmedelskontrollen
https://www.svenljunga.se/download/<id>/<tid>/<filnamn>.pdf
```
Ett anrop för listan, ett per rapport. Sex kategorier, 107 rubriker, 224
PDF-rapporter från 2016 till 2026. Rapportlistan ligger som JSON i sidans
egen JavaScript (SiteVisions `AppRegistry.registerInitialState`).

Utfall vid inläsningen: 99 anläggningar, 146 kontroller, 62 bedömda — 28 utan
anmärkningar, 23 med brister, 11 med kvarstående brister, 1 utmärkelse, 68
olästa rapporter.

Först källan där omdömet bara finns inuti PDF:en. Det krävde en egen
textutvinning, `prikko/pdf.py`, ren Python utan beroenden av samma skäl som
`geo.py`: pipelinen ska kunna köras i en tom container. Modulen betalar sig
igen på Kristinehamn och Borgholm.

Sex saker som avgjorde bygget:

- **En femtedel av rapporterna är inskannade papper.** 45 av 224 saknar
  textlager helt, 17 är för gamla mallar eller teckensnitt vi inte kan
  avkoda, och 11 saknar resultatmening eller kontrolldatum. Det finns ingen
  väg runt det utan OCR, och OCR går inte att köra i en tom container.
- **Är den NYASTE rapporten oläsbar publiceras inget omdöme alls**, trots att
  en äldre rapport finns tolkad. Att visa den vore att påstå ett nuläge
  kommunen redan har kontrollerat om. Gäller åtta verksamheter. Tillsammans
  med 21 utan någon läsbar rapport och 16 utanför treårsfönstret blir 37 av
  99 obedömda.
- **Resultatmeningen förekommer i sju formuleringar** och de delar beståndet
  rent: 82 rapporter säger inga avvikelser, 77 säger avvikelser, ingen säger
  båda. Skalan är alltså tvågradig, och Svenljunga blir femte källan utan
  kvarstår-etikett. Men källan har historik — 45 verksamheter har två eller
  fler kontroller — så `grading.py` kan härleda kvarstående brister ur
  mönstret. Elva verksamheter når allvarlig nivå på det sättet, och en når
  utmärkelsen.
- **Den FÖRSTA resultatmeningen gäller.** Rapportens standardtext längre ned
  innehåller meningen "Inga avvikelser kunde konstateras" om något helt
  annat — i en rapport handlar den om rökförbudet. Samma sak med
  förhandsbeskedet: standardtexten säger "oanmälda inspektioner samt
  föranmälda revisioner" i 77 av 176 läsbara rapporter, så det får bara
  läsas ur inledningsmeningen.
- **Kontrolldatumet är förankrat i "gjorde vi", inte i ordet "Den".** Varje
  rapport bär sitt brevhuvuddatum högre upp på sidan, och det är datumet
  rapporten skrevs, upp till nitton dagar efter kontrollen. Ett omankrat
  mönster hade daterat kontrollen fel. 24 rapporter utelämnar årtalet; då
  hämtas året ur filnamnets datum, aldrig hela datumet.
- **Åtta rubriker bär två fildelningsmoduler**, verksamheten och dess
  dricksvattenanläggning (`Backa Loge Café` och `Backa Loge
  Dricksvattenanläggning`). Kommunen grupperar dem själv under ett namn, så
  de blir en verksamhet. Kontrolleras båda samma dag slås de ihop till en
  kontroll med det sämre utfallet, samma regel som i Linköping.

**Avvikelserna specificeras i rapporten men tas inte med.** Texten kommer ur
PDF:en styckad i korta löpor, ofta mitt i ett ord ("åtgärda t s", "La gkrav").
Det duger för att leta efter kända fraser och inte alls för att återge en
mening ordagrant på en sida om en namngiven restaurang. Kontrollområdenas
namn skulle dessutom kräva en sluten ordlista, och rapporterna använder minst
40 olika områdesnamn. Länken till originalrapporten bärs i stället vidare per
kontroll som `reportUrl`. Ingen gatuadress publiceras, bara ort, så
`geocode.py` kan inte ge Svenljunga några kartnålar.

Sidan säger själv att "dokumentationen av uppföljning publiceras inte alltid
här". Historiken är alltså ofullständig även bortsett från de inskannade
rapporterna, och får inte presenteras som komplett.

### Kristinehamn — 170 verksamheter, register i ArcGIS och rapporter som bilagor
```
https://portal.kristinehamn.se/arcgis/rest/services/Portal/Livsmedelsprotokoll
  /MapServer/14/query?where=1=1&outFields=*&outSR=3008&f=json          180 rader
  /MapServer/14/queryAttachments?objectIds=1,2,3,…                     354 bilagor
  /MapServer/14/<objectid>/attachments/<attachmentid>                  en rapport
```
Ett anrop för registret, fyra för bilagsförteckningen, ett per rapport.
Attributen innehåller **inget resultatfält** — bedömningen finns bara inuti
PDF:en.

Utfall vid inläsningen: 170 anläggningar, 220 kontroller, 99 bedömda — 83
utan anmärkningar, 15 med brister, 1 med kvarstående brister, 1 utmärkelse,
9 överhoppade rader, 95 olästa rapporter.

Sex saker som avgjorde bygget:

- **Rapporterna krävde att `pdf.py` lärde sig ToUnicode.** Kristinehamns
  ärendesystem skriver all text med Type0-teckensnitt och hexsträngar, alltså
  glyfnummer i stället för bokstäver. Utan teckensnittets egen tabell kommer
  "Dnr LIV" ut som "'QU/,9". Tabellerna slås ihop till en per dokument, och
  krockar två koder kasseras hela tabellen — sju bilagor blir tomma i stället
  för halvrätt lästa.
- **Källan har både historik och kontrolltyp**, vilket gör den till den bästa
  av de fem nya. 54 rapporter säger "Det var en extrakontroll för att följa
  upp om avvikelser från livsmedelslagstiftningen åtgärdats". En sådan
  kontroll som ändå finner avvikelser beskriver per kommunens egen definition
  en brist som inte åtgärdats, precis som Karlstads extrakontroll, och
  `grading.py` läser den som kvarstående. Kommunen anger dessutom om besöket
  var oanmält (145) eller föranmält (73).
- **Ordet "extrakontroll" står också i standardtexten** ("Avvikelsen kommer
  att följas upp vid en extrakontroll"), i 164 av 258 rapporter. Frasen måste
  därför vara förankrad i "Det var en", annars blir varannan planerad
  kontroll en uppföljning och allvarsgraden skjuter i höjden.
- **Nio bilagor är förelägganden, inte kontrollrapporter.** De känns igen
  både på rubriken DELEGATIONSBESLUT och på filnamnet — filnamnet behövs
  eftersom ett inskannat föreläggande inte har någon text att läsa rubriken
  ur, och annars skulle spärra verksamhetens omdöme som en oläsbar senaste
  rapport. Kontrollen som ledde fram till beslutet publiceras som en egen
  rapport, så uppgiften går inte förlorad.
- **`EcosOBJID` duger inte som identitet** trots att det är ärendesystemets
  eget nyckelfält: det är `null` i 108 av 180 rader. ArcGIS `OBJECTID`
  numreras om vid ompublicering. Identiteten hashas därför ur namn och
  adress, verifierat unikt över beståndet. `Nock` ligger två gånger utan
  adress, en gång som Restaurang och en gång som Övrigt, och slås ihop med
  bilagorna från båda raderna.
- **Tre rader är avregistrerade** (`Aktiv = 0`) och publiceras inte, en av dem
  med sex bilagor. Ett hygienomdöme om en restaurang som har lagt ned är fel
  oavsett vad rapporten säger. Sex rader saknar namn och kan inte publiceras
  alls. `Aktiv = null` (21 rader) betyder att fältet inte fyllts i, inte att
  verksamheten är borta.

78 av 354 bilagor är inskannade bilder utan textlager, och nio till är i en
mall vi inte känner igen. Samma regel som i Svenljunga gäller: är den senast
publicerade rapporten oläsbar publiceras inget omdöme alls. Kontrollområdena
räknas upp i rapporten, både de utan och de med avvikelse, men de tas inte
med av samma skäl som i Svenljunga — texten kommer styckad ur PDF:en och
områdesnamnen skulle kräva en sluten ordlista källan inte håller sig till.

Koordinaterna kommer i SWEREF 99 13 30 (EPSG:3008), samma zon som Karlstad,
och samtliga 170 verksamheter får en kartnål. 103 har dessutom gatuadress.

## Kartlagd, ej inläst

### Örebro — 1 234 verksamheter, NÄSTA ATT BYGGA — RIKASTE KÄLLAN

Kartlagd i sin helhet 2026-08-02. Tre steg:

```
1) GET /rest-api/foodreport/search        hela listan, utan parametrar
     → [{Registrerades, Objektsnamn, Typ, AnlaggningId, Adress}]   1 234 st

2) GET …/resultat-fran-livsmedelskontroller---verksamhet.html?facility=<id>
     → HTML med "const INSPECTIONS = [{id, reason, date, recent}]" inbäddat

3) GET /rest-api/foodreport/reports/<inspectionId>
     → [{Nr, Beskrivning, Kontrollomrade, Anmarkning,
         TillsynsDatum, "Anmald-oanmald"}]
```

**Steg 3 är inte gissad.** Den står i kommunens egen `food-report-page.js`.
Sökvägen `/rest-api/foodreport/inspection/<id>` finns också, svarar 200 och
returnerar alltid en tom lista — 0 av 52 testade kontroller gav något. Den
ser ut att fungera och gör det inte. Använd `/reports/`.

Varför källan är den bästa hittills:

- **Både godkända och brustna kontrollpunkter redovisas.** Stockholm listar
  bara avvikelser; Örebro ger hela den kontrollerade ytan, vilket gör det
  möjligt att visa vad som faktiskt granskats.
- **Kontrollområde och punktkod följer Livsmedelsverkets A–Q**, samma
  indelning som `LEGISLATION_AREAS` i sajten redan använder.
- **Kvarstår-etikett finns**, tillsammans med `Åtgärdad` och `Avskriven`.
  Örebro blir därmed tredje källan med etiketten, efter Linköping och Uppsala.
- `Anmald-oanmald` fyller fältet `prenotified`, som annars mest står tomt.

Observerade värden i `Anmarkning`: `Utan avvikelse`, `Avvikelse`, `Åtgärdad`,
`Kvarstår`, `Avskriven`. Legenden på kommunens sida beskriver dessutom
`Handläggning pågår` — men det är inget källvärde utan något sidans kod
räknar fram: kontroller nyare än 30 dagar döljs och märks så. **Vår adaptern
måste göra samma sak**, annars publicerar vi resultat innan verksamheten
hunnit yttra sig, vilket är hela skälet till fördröjningen.

Kostnad: 1 anrop för listan, 1 234 för verksamhetssidorna och cirka 8 000 för
kontrollpunkterna. Det är den dyraste källan hittills — men också den enda
utanför Linköping som ger full detaljnivå.

Koordinater saknas; adress finns.

### Göteborg — 4 786 verksamheter, MEN INGA RESULTAT
```
GET https://catalog.goteborg.se/rowstore/dataset/3bf3fca5-617d-4687-ac8d-c3ab5b17a4b6
    → {namn, adress, postnummer, ort, typ, lat, lon, x/y_sweref991200}
```
Öppen data, uppdateras varje dygn, **och har färdiga WGS84-koordinater**. Men
datamängden innehåller **enbart registret** — inga kontrolldatum, inga
omdömen, inga avvikelser.

Att lägga in Göteborg nu vore 4 786 sidor där varenda en säger "ingen
bedömning": exakt den tunna massproduktion Google straffar och som vår egen
kvalitetsgrind finns för att stoppa. Bibelns §13 hade alltså rätt — Göteborgs
resultat kräver offentlighetsprincipen.

Datamängden är däremot värdefull senare: som ryggrad när resultaten kommit in,
och som koordinatkälla.

### Malmö, Helsingborg — publicerar, format ej kartlagt
- **Malmö** publicerar godkänd/underkänd för en delmängd (kaféer, mindre
  restauranger, skolor).
- **Helsingborg** publicerar listor över verksamheter **utan** anmärkning —
  alltså motsatt urval, vilket gör att en frånvaro i listan inte säkert
  betyder brist. Kräver eftertanke innan publicering.

## Vad inventeringen säger om planen

Fem kommuner inlästa täcker 13 306 verksamheter. De återstående
webbpublicerande ger kanske 8 000 till. Därefter tar de lätta källorna slut
och resten av landets 290 kommuner kräver framställan enligt
offentlighetsprincipen.

Arbetet per kommun ligger på några timmar: hitta gränssnittet, räkna ut de
faktiska värdena, skriva adapter, verifiera. Det låter mycket, men det är
själva moaten — varje adapter är arbete en konkurrent också måste göra.

**Origo är den enda hävstången vi hittat, och den är nu bevisad.** Karlstad
är inläst via mönstret: läs `index_ssl.json`, hitta GeoServer-URL:en, hämta
lagret via WFS. Origo används av flera svenska kommuner, och adaptern för
nästa Origo-kommun blir i huvudsak ett byte av lagernamn och projektionszon.
Det är värt att kontrollera mot Västerås, Oskarshamn, Hallstahammar och Sjöbo
innan fler enskilda adaptrar skrivs.

**Detaljnivån varierar mer än antalet.** Linköping, Stockholm och Uppsala
anger vilka kontrollområden som brustit; Jönköping och Karlstad gör det inte,
och Karlstad publicerar varken historik eller adress. Modellen hanterar det,
men verksamhetssidorna blir tunnare i de kommunerna. Det talar för att
kvalitet per kommun ska vägas mot antalet nya sidor — inte bara mot antalet
verksamheter vi kan räkna.

En kolumn i tabellen ovan är värd att bevaka: **utmärkelsen kräver tre rena
kontroller i rad**, alltså en historik. Karlstad kan aldrig nå den. Om fler
tunna källor läggs till blir "ingen utmärkelse" ett tecken på källans
begränsningar snarare än på verksamheten, och då behöver utmärkelsen
antingen villkoras på tillgänglig historik eller redovisas per kommun.

### En läxa om metod

Karlstad avskrevs en gång som "avstängd under systembyte". Det byggde på en
sökträff. När kartan faktiskt anropades fungerade den, och kommunen visade sig
ha 694 verksamheter bakom ett rent WFS-gränssnitt. Inventeringens grundregel —
verifiera genom anrop, aldrig genom att läsa vad någon säger sig publicera —
gäller även när svaret verkar vara att det inte finns något att hämta.
