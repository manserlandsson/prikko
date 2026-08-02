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

Nästa att bygga: **Karlstad** (kartlagd, se nedan) och **Örebro**.

Stockholms och Jönköpings avsaknad av "kvarstår" är skälet till att
bedömningsmodellen härleder allvarsgraden ur mönstret i stället för ur
etiketten (se `grading.py`). Två av fyra källor saknar etiketten — det var
inget undantag, det är normalläget.

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

## Kartlagd, ej inläst

### Karlstad — 694 verksamheter, NÄSTA ATT BYGGA
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

Två varningar inför bygget:
- **Begär inte `srsName=EPSG:4326`.** Servern avrundar då till två decimaler,
  alltså ungefär en kilometers fel. I inhemsk projektion (EPSG:3008 =
  SWEREF 99 13 30) kommer full precision, och `geo.py` klarar den zonen.
- **Bara senaste kontrollen publiceras.** Ingen historik alls, och inga
  specificerade avvikelser. Modellen kan då bara härleda kvarstående brister
  ur att senaste kontrollen är en extrakontroll med avvikelse, och
  utmärkelsen (tre rena i rad) blir omöjlig att nå. Det är en verklig
  asymmetri mot Linköping och ska framgå av metodiksidan.

### Örebro — 1 234 verksamheter
```
GET /rest-api/foodreport/search          hela listan, utan parametrar
    → [{Registrerades, Objektsnamn, Typ, AnlaggningId, Adress}]
Resultat per verksamhet:
    https://www.orebro.se/foretag--naringsliv/driva-foretag/livsmedelsverksamhet
    /resultat-fran-livsmedelskontroller/resu…?facility=<AnlaggningId>
```
Listan är ren JSON och kräver inga parametrar. Kontrollresultaten renderas på
en separat sida per verksamhet, alltså ett anrop per objekt som i Linköping
och Uppsala. Adress finns; koordinater inte kontrollerade.

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

Fyra kommuner inlästa täcker ungefär 12 700 verksamheter. De återstående
webbpublicerande ger kanske 9 000 till. Därefter tar de lätta källorna slut
och resten av landets 290 kommuner kräver framställan enligt
offentlighetsprincipen.

Arbetet per kommun ligger på några timmar: hitta gränssnittet, räkna ut de
faktiska värdena, skriva adapter, verifiera. Det låter mycket, men det är
själva moaten — varje adapter är arbete en konkurrent också måste göra.

**Origo är den enda hävstången vi hittat.** Karlstads karta bygger på det
öppna ramverket, som används av flera svenska kommuner. Mönstret därifrån —
läs `index_ssl.json`, hitta GeoServer-URL:en, hämta lagret via WFS — är
återanvändbart. Det är värt att kontrollera mot Västerås, Oskarshamn,
Hallstahammar och Sjöbo innan fler enskilda adaptrar skrivs.

**Detaljnivån varierar mer än antalet.** Linköping, Stockholm och Uppsala
anger vilka kontrollområden som brustit; Jönköping och Karlstad gör det inte,
och Karlstad publicerar inte ens historik. Modellen hanterar det, men
verksamhetssidorna blir tunnare i de kommunerna. Det talar för att kvalitet
per kommun ska vägas mot antalet nya sidor — inte bara mot antalet
verksamheter vi kan räkna.

### En läxa om metod

Karlstad avskrevs en gång som "avstängd under systembyte". Det byggde på en
sökträff. När kartan faktiskt anropades fungerade den, och kommunen visade sig
ha 694 verksamheter bakom ett rent WFS-gränssnitt. Inventeringens grundregel —
verifiera genom anrop, aldrig genom att läsa vad någon säger sig publicera —
gäller även när svaret verkar vara att det inte finns något att hämta.
