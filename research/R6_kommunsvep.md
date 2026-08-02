# R6 — Kommunsvep: vilka fler kommuner publicerar livsmedelskontroll?

**Verifierat 2026-08-02.** Varje påstående nedan bygger på ett faktiskt HTTP-svar,
inte på en sökträff. Där ett anrop gjorts återges statuskod, storlek eller
faktiskt innehåll. Alla anrop gjordes med `User-Agent: PrikkoBot/0.1
(+https://prikko.se)` och paus mellan anropen.

## Sammanfattning

Fem nya källor med per-verksamhet-data hittades. Ingen av dem är stor. Den
enda som liknar de källor vi redan läst in — strukturerad, maskinläsbar,
med resultatfält och kvarstår-etikett — är **Oskarshamn**.

| Kommun | Kod | Verksamheter | Format | Koordinater | Resultatfält | "Kvarstår" | Avvikelser specificerade | Historik |
|---|---|---:|---|---|---|---|---|---|
| **Oskarshamn** | 0882 | 241 | ArcGIS REST (MapServer) | SWEREF 99 16 30 | Ja, 3 värden | **Ja** | Nej (fält finns men tomt) | Nej |
| **Kristinehamn** | 1781 | 180 | ArcGIS REST + PDF-bilagor | SWEREF 99 13 30 | Nej — bara i PDF | Okänt (i PDF) | Endast i PDF | **Ja**, flera PDF/verksamhet |
| **Höganäs** | 1284 | 333 | HTML-filarkiv, färg i **filnamnet** | Saknas | Ja, 3 nivåer (2 använda) | Nej | Endast i PDF | Nej (endast senaste) |
| **Lomma** | 1262 | 156 | HTML, handredigerad | Saknas | Ja, 3 nivåer | Nej | **Ja, fritext per område** | Nej |
| **Svenljunga** | 1465 | 103 | HTML + PDF-rapporter | Saknas | Nej — bara i PDF | Okänt (i PDF) | Endast i PDF | **Ja**, 1–7 rapporter |
| **Sjöbo** | 1265 | 108 | HTML, handredigerad | Saknas | Ja, 3 nivåer — **men opålitlig** | Nej | Nej | Nej |
| **Borgholm** | 0885 | ~422 kontrollrader | **PDF-tabell** | Saknas | Ja (avvikelsetext eller `0`) | Nej | **Ja, fritext per område** | Delvis |

Prioriterad ordning för adapterbygge: **Oskarshamn** (billig, strukturerad,
har kvarstår-etikett), sedan **Lomma** (bara 4 HTML-sidor, avvikelser
specificerade), sedan **Höganäs** (färg direkt ur filnamn, ingen PDF-parsning
behövs för betyget). Kristinehamn, Svenljunga och Borgholm kräver
PDF-tolkning och bör vänta.

Av de fyra kommuner du namngav gav **en** användbar data (Oskarshamn), en gav
en liten men opålitlig HTML-källa (Sjöbo), och två visade sig **inte** publicera
alls längre (Hallstahammar, Västerås) trots att deras egna webbsidor respektive
en nyhetsartikel säger att de gör det.

---

## Prioriterade kommuner

### Hallstahammar (1961) — publicerar INTE. Kartan är trasig.

Kommunens egen sida
`https://www.hallstahammar.se/foretagare/regler-tillstand-och-tillsyn/livsmedelsverksamhet/livsmedelskontroller`
(HTTP 200) säger att resultaten ligger i kartlagret "Livsmedelsinspektioner".
Sidan innehåller **en** inbäddad karta:

```html
<iframe src="https://arcg.is/1Lyvz11" height="800" width="100%">
```

Kortlänken löser upp till
`https://experience.arcgis.com/experience/3486999b008247dcbd7202ea6e35f165?org=hallstahammar`.
Den appen **går inte att öppna**. Renderad i webbläsare visar den enbart texten:

> Item does not exist or is inaccessible.

Samma svar via API: `https://www.arcgis.com/sharing/rest/content/items/3486999b008247dcbd7202ea6e35f165/data?f=json`
→ `{"error":{"code":400,"messageCode":"CONT_0001","message":"Item does not exist or is inaccessible."}}`.

Kontrollerat att lagret inte finns någon annanstans heller:

- Org-id: `vkGU9ZuRu3qDJH0t` (via `https://hallstahammar.maps.arcgis.com/sharing/rest/portals/self?f=json`).
  Sökning på hela organisationens publika innehåll (`/sharing/rest/search?q=orgid:vkGU9ZuRu3qDJH0t`)
  ger **40 objekt** — inget med livsmedel eller inspektion i namnet.
- Alla publika feature-tjänster: `https://services-eu1.arcgis.com/vkGU9ZuRu3qDJH0t/arcgis/rest/services?f=json`
  → 23 tjänster, ingen livsmedelstjänst.
- `karta.hallstahammar.se` → 302 → Hallstakartan
  (`experience/22198cc0f3e3461b8375b285ad941e7c`). Dess konfiguration och den
  underliggande webbkartan `09fbf0345fc543b2823b2d4597af2727` innehåller
  14 lager — inget livsmedelslager.
- Egen GeoServer finns: `https://karta.hallstahammar.se/geoserver/ows?service=WFS&version=1.1.0&request=GetCapabilities`
  (HTTP 200, 25 kB) — men publicerar bara **fyra** lager, alla detaljplanemosaik
  (`Hallstahammar:db_v_mosaik_*`).
- `https://karta.hallstahammar.se/origo/index.json` → **HTTP 403** med
  kommunens egen sida "Åtkomst saknas". Rotens `/index.json` ger 404, så
  `/origo/` finns men är åtkomstspärrad — sannolikt en intern Origo-instans.

**Slutsats:** Hallstahammar har byggt kartan, tagit bort eller avpublicerat
ArcGIS-objektet, och glömt att uppdatera informationssidan. Inget att hämta.
Värt att kontrollera igen om något halvår — infrastrukturen finns, bara inte
datat.

### Västerås (1980) — publicerar INTE längre. 2019 års karta är borta.

Genomsökt tre kompletta tjänstekataloger utan en enda träff på "livsmedel":

- **ArcGIS Enterprise:** `https://gisportal.vasteras.se/server/rest/services?f=json`
  → 12 mappar. Rekursivt genomsökta: **304 tjänster totalt**. Träffar på
  livs/miljö/inspektion/kontroll: fem stycken, samtliga irrelevanta
  (`Miljonprogrammet_1965_1975`, `Skisslager_friluftslivsområden`,
  `Skisslager_kulturmiljö`, `Arkitektur_och_kulturmiljö_NY`).
- **Publik ArcGIS-katalog:** `https://kartor.vasteras.se/arcgis/rest/services/ext?f=json`
  → 83 tjänster, ingen livsmedelstjänst.
- **GeoServer:** `https://kartserver.vasteras.se/geoserver/ows?service=WFS&version=1.1.0&request=GetCapabilities`
  (HTTP 200, 138 kB) → 244 lager, inget med livsmedel.
- **POI-lagret** `ext/webbobjekt_dyn/MapServer/0` (WEBBOBJEKT_PKT) har fältet
  `CATEGORY`. Distinkta värden hämtade med
  `?where=1=1&outFields=CATEGORY&returnDistinctValues=true&returnGeometry=false&f=json`
  → **44 kategorier** (Badplats, Bibliotek, Förskola, Lekplats, Park …).
  Ingen livsmedels- eller inspektionskategori.
- ArcGIS Online-org `vasteras`: sökning på livsmedel/inspektion → 0 träffar.
- Näringslivskartan (`https://kartor.vasteras.se/naringsliv/`, Origo,
  konfig på `https://kartor.vasteras.se/naringsliv/index.json`, 12 kB) har
  sex lagergrupper — inget livsmedelslager.

**Slutsats:** kartan med ~600 inspektioner från 2019 existerar inte längre i
någon publik tjänst. Skriv av Västerås.

### Oskarshamn (0882) — PUBLICERAR. Bästa nya källan.

Medborgarsida:
`https://www.oskarshamn.se/bygga-bo-miljo/kartor-och-mattjanster/kartor/`
→ länk till `https://experience.arcgis.com/experience/27414acd729747caa686c53857427b74/page/Livsmedelskontroller/`

**Endpoint (kopieringsbar):**

```
https://gisrest.oskarshamn.se/server/rest/services/Externt/Livsmedelskontroller_2024/MapServer/{0,2,3,4,5,6}/query?where=1%3D1&outFields=*&outSR=3010&f=json
```

Format: **ArcGIS REST, JSON**. Tjänsten är en MapServer, ingen token krävs.
`maxRecordCount` räcker (alla lager under 2 000). Notera lagerlistan hoppar
över id 1.

| Lager-id | Namn | Antal |
|---:|---|---:|
| 0 | Restauranger | 62 |
| 2 | Caféer och Bagerier | 16 |
| 3 | Kiosker | 10 |
| 4 | Butiker | 41 |
| 5 | Skolkök | 21 |
| 6 | Övriga | 91 |
| | **Totalt** | **241** |

**Hela beståndet i sex anrop.** 239 distinkta `AnlaggningId`, 238 distinkta
namn+adress (två anläggningar har två rader).

**Fält:**

```
RadId (double)               AnlaggningId (GUID, stabil identitet)
Objektsnamn (str)            AnlaggningsNamn (str)
Inriktning (str)             Adress, PostNr, PostOrt, Fastighet (str)
StartDatum (str, ÅÅÅÅ-MM-DD) TillsynsDatum (str, ÅÅÅÅ-MM-DD)
AntalKvarstAvvikelser (int)  AvvikelseAnteckningar (str)
Bedomning (str)              geom (punkt)
```

Två namnfält: `Objektsnamn` är det utåtriktade namnet ("The Corner"),
`AnlaggningsNamn` är juridisk person ("Mat i Söder AB"). Prikko ska visa
`Objektsnamn`.

**Koordinater:** `spatialReference.wkid = 3010` = **SWEREF 99 16 30**.
Begär `outSR=3010` (inhemsk projektion) och transformera själva — samma
regel som för Karlstad.

**KRITISKT — resultatfältets distinkta värden** (räknade över alla 241 rader):

| `Bedomning` | Antal |
|---|---:|
| Inga avvikelser | 152 |
| **Kvarstående avvikelser** | **57** |
| Godtagbar | 7 |
| `null` | 25 |

De 25 `null` är verksamheter helt utan `TillsynsDatum` — aldrig kontrollerade,
inte "bedömda som OK". De ska hoppas över, inte tolkas som gröna.

Dessutom finns `AntalKvarstAvvikelser` som **numeriskt** mått, inte bara en
etikett:

| Antal kvarstående avvikelser | Verksamheter |
|---:|---:|
| 0 | 183 |
| 1 | 38 |
| 2 | 12 |
| 3 | 5 |
| 4 | 2 |
| 5 | 1 |

Det här är den enda källa vi sett som anger **hur många** avvikelser som
kvarstår. Värdefullt för att kalibrera bedömningsmodellens allvarsgrad mot en
oberoende skala.

Obs: `Bedomning = "Kvarstående avvikelser"` och `AntalKvarstAvvikelser > 0`
är inte samma population (57 mot 58). Kontrollera relationen vid inläsning,
precis som Jönköpings `har_avvikelse` används som facit.

**Avvikelser specificeras inte.** Fältet `AvvikelseAnteckningar` finns i
schemat men är `null` i **samtliga 241** rader. Ingen uppdelning per
kontrollområde.

**Ingen historik.** En rad per anläggning, senaste kontrollen.
`TillsynsDatum` spänner 2019-03-19 till 2026-07-01, 138 distinkta datum.

Varning: webbkartan pekar även på
`.../Externt/Livsmedelskontroller2/MapServer`, som svarar
`{"error":{"code":499,"message":"Token Required"}}`. Använd inte den —
använd `Livsmedelskontroller_2024`, som trots namnet innehåller färska
kontroller in i juli 2026.

### Sjöbo (1265) — publicerar, men datat går inte att lita på

`https://www.sjobo.se/naringsliv-och-foretag/tillstand-regler-och-tillsyn/livsmedel/smiley-livsmedelskontroll.html`
(HTTP 200, 184 kB). Ren HTML, ingen iframe, ingen tabell, inget API.
**108 poster** med datum + namn + adress, datum 2023-05-05 till 2026-06-05.
Inga koordinater. Ingen historik. Avvikelser specificeras inte.

Skalan är tre nivåer, knuten till antal avvikelser:

- Glad gubbe — godkänd inspektion, högst en avvikelse
- Likgiltig gubbe — godkänd med anmärkning, 2–4 avvikelser
- Sur gubbe — underkänd, fem eller fler avvikelser

**Problemet:** omdömet finns på två ställen i markupen — bildens `src` och
dess `alt` — och de motsäger varandra i 22 av 116 fall (19 %):

| `alt` | filnamn i `src` | antal |
|---|---|---:|
| Glad gubbe | Glad_gubbe_webb.png | 80 |
| **Likgiltig gubbe** | **Glad_gubbe_webb.png** | **17** |
| (tom) | Glad_gubbe_webb.png | 9 |
| Likgiltig gubbe | Likgiltig_gubbe_webb.png | 2 |
| **Glad gubbe** | **Likgiltig_gubbe_webb.png** | **2** |
| glad gubbe | Glad_gubbe_webb.png | 2 |
| Sur gubbe | Sur-gubbe_webb.png | 1 |
| **sur gubbe** | **Glad_gubbe_webb.png** | **1** |
| **Röd** | **Glad_gubbe_webb.png** | **1** |
| **Sur gubbe** | **Glad_gubbe_webb.png** | **1** |

Sidan är handredigerad i ett CMS och redaktören har kopierat block och bytt
det ena attributet men inte det andra. Det går **inte** att avgöra vilket som
är rätt. En verksamhet som i alt-texten är "sur gubbe" (underkänd) visar en
glad gubbe för besökaren.

**Rekommendation: läs inte in Sjöbo.** 108 verksamheter är inte värt risken
att publicera fel omdöme om en namngiven restaurang. Om den ändå ska tas in
måste bara de poster där `alt` och `src` uttryckligen är överens användas
(85 av 116), och resten hoppas över — inklusive de 9 där `alt` är tom och
alltså varken bekräftar eller motsäger bilden.

---

## Övriga nya fynd

### Kristinehamn (1781) — publicerar hela kontrollrapporter som PDF-bilagor

Medborgarsida: `https://www.kristinehamn.se/naringsliv-och-arbete/livsmedel/livsmedelsrapporter/`
→ kartan "Handla och ät":
`https://portal.kristinehamn.se/portal/apps/webappviewer/index.html?id=433ed9bb9dd44830a7784459f54c5823`

**Endpoints:**

```
https://portal.kristinehamn.se/arcgis/rest/services/Portal/Livsmedelsprotokoll/MapServer/14/query?where=1%3D1&outFields=*&outSR=3008&f=json
https://portal.kristinehamn.se/arcgis/rest/services/Portal/Livsmedelsprotokoll/MapServer/14/queryAttachments?objectIds=1,2,3&f=json
```

- **180 verksamheter** (`returnCountOnly=true` → `{"count":180}`).
- Koordinater: `wkid 3008` = **SWEREF 99 13 30**.
- Fält: `OBJECTID`, `EcosOBJID` (nyckel i ärendesystemet Ecos), `Namn`,
  `Adress`, `Verksamhetstyp` (kodad 1–10), `Aktiv` (1/0/null).
- **Inget resultatfält i attributen.** Bedömningen finns bara inuti PDF:erna.
- `hasAttachments: true`. Varje verksamhet har 0–7 PDF-kontrollrapporter,
  filnamn med datum, t.ex. `Stora Coop 2026-05-19.pdf`, `Coop, 2024-11-18.pdf`.
  Filnamnsformatet är inkonsekvent (`13 augusti 2025`, `(1)`-suffix).
- `queryAttachments` fungerar och tar en lista `objectIds` → hela
  bilagsregistret i några få anrop. **Två till fem anrop** för metadatat,
  därefter ett anrop per PDF om rapporterna ska tolkas.

**Bedömning:** rikaste källan i sak (fulla rapporter, flera år), men kräver
PDF-parsning för att ge ett omdöme. Verksamhetsregistret är dock gratis
och kan användas direkt.

### Höganäs (1284) — färgomdömet ligger i PDF:ens filnamn

`https://www.hoganas.se/boende-trafik--miljo/boendemiljo/livsmedel/livsmedelskontroller.html`

Ett SiteVision-filarkiv med tre mappar, adresserade med `folder`-parameter:

```
https://www.hoganas.se/boende-trafik--miljo/boendemiljo/livsmedel/livsmedelskontroller.html?folder=19.33c1739617a7615ad6625e1a&sv.url=12.33c1739617a7615ad6625ea9   # Butiker, restauranger, serveringar och övrigt — 228 filer
https://www.hoganas.se/boende-trafik--miljo/boendemiljo/livsmedel/livsmedelskontroller.html?folder=19.33c1739617a7615ad6625e8a&sv.url=12.33c1739617a7615ad6625ea9   # Livsmedelstillverkare/grossister — 25 filer
https://www.hoganas.se/boende-trafik--miljo/boendemiljo/livsmedel/livsmedelskontroller.html?folder=19.33c1739617a7615ad6625e93&sv.url=12.33c1739617a7615ad6625ea9   # Barnomsorg, skolkök, vård och omsorg — 80 filer
```

**Hela beståndet i tre anrop. 333 filer = 333 verksamheter** (en fil per
verksamhet, senaste rapporten).

Filnamnsmönstret bär hela informationen — **ingen PDF behöver öppnas**:

```
<Namn>, <Ort>, <ÅÅÅÅ-MM-DD>, <färg>.pdf
```

Exempel: `Adams kök & bar, Höganäs, 2026-03-30, gul.pdf`

Distinkta färgvärden, räknade över alla 333 filer:

| Färg | Antal |
|---|---:|
| grön (godkänd inspektion) | 278 |
| gul (inspektion med avvikelse) | 44 |
| röd (kräver återbesök) | **0** |
| ej parsebart filnamn | 11 |

De 11 avvikande har omkastad ordning (`…, grön, 2022-11-10.pdf`) eller saknar
ort — en tolerant regex fångar dem. Datum spänner 2021-06-09 till 2026-07-01.

Röd finns i skalan enligt sidan men förekommer inte i det aktuella
beståndet — tolka inte det som att skalan bara har två nivåer.

**Ingen kvarstår-etikett.** Röd = "kräver återbesök", inte "brist kvarstår".
Inga koordinater. Ingen historik (bara senaste). Avvikelserna specificeras
bara inne i PDF:en.

### Lomma (1262) — bäst detaljnivå av de nya HTML-källorna

Fyra sidor, **fyra anrop för hela beståndet**:

```
https://lomma.se/jobbochforetagande/tillstandreglerochtillsyn/livsmedel/livsmedelsinspektioner/restaurangerochcafeer.1220.html   # 60
https://lomma.se/jobbochforetagande/tillstandreglerochtillsyn/livsmedel/livsmedelsinspektioner/butiker.1219.html                 # 19
https://lomma.se/jobbochforetagande/tillstandreglerochtillsyn/livsmedel/livsmedelsinspektioner/skolorforskolorochannanomsorg.1221.html  # 40
https://lomma.se/jobbochforetagande/tillstandreglerochtillsyn/livsmedel/livsmedelsinspektioner/ovrigaverksamheter.1222.html      # 37
```

**Totalt 156 verksamheter.** HTML, inga koordinater, ingen historik.

Poster ser ut så här (grupperade under rubriker per färg):

```
Alnarp 9
Senaste inspektion: 2026-02-18
Avvikelser: svårstädad lokal, livsmedelsinformation, tempratur
```

Färgskalan är **treställig och definierad i termer av uppföljning**:

- Grön — inga eller ett fåtal avvikelser som inte leder till extra kontroll
- Gul — en eller ett fåtal avvikelser som leder till extra kontroll
- Röd — en eller flera allvarliga avvikelser som kräver myndighetsåtgärd
  (föreläggande eller förbud)

Fördelning räknad över alla fyra sidor: **grön 142, gul 12, röd 2.**

Ingen kvarstår-etikett — men rödnivån är starkare definierad än i de flesta
andra källor (myndighetsåtgärd, inte bara återbesök).

**Avvikelserna specificeras per kontrollområde**, som fritext. 34 distinkta
strängar över hela beståndet. De vanligaste:

| Text | Antal |
|---|---:|
| inga avvikelser | 65 |
| rengöring | 25 |
| temperatur | 24 |
| svårstädad lokal | 17 |
| livsmedelsinformation | 9 |
| personlig hygien | 9 |
| kontaktmaterial | 8 |
| förvaring | 8 |
| märkning | 5 |
| skadedjurssäkring | 3 |

Fritexten är handskriven och innehåller stavfel som måste normaliseras:
`tempratur`, `persolig hygien`, `personlig hygie`, `utforming av lokal`,
`separering alergener`. En post har fått verksamhetsnamnet i avvikelsefältet
(`bjärehovskolans elevcafé`). Räkna med en normaliseringstabell, inte exakt
strängmatchning.

### Svenljunga (1465) — publicerar hela kontrollrapporterna, med historik

```
https://www.svenljunga.se/naringsliv--arbete/tillstand-regler-och-tillsyn/livsmedel/livsmedelskontroll-och-avgifter/resultat-fran-livsmedelskontrollen
```

**En enda sida, ett anrop** (365 kB). Sex kategorier: Restauranger och
pizzerior, Caféer och gatukök, Butiker, Skolor och förskolor, Vård och
omsorgsverksamheter, Övriga verksamheter.

**103 verksamheter, ~221 PDF-kontrollrapporter.** Rapportlistan ligger som
JSON inbäddad i sidans JavaScript (SiteVision `AppRegistry.registerInitialState`):

```json
{"files":[{"id":"18.3f4e20b1196d0a6eb0ca07",
  "name":"Apelkvistens Wärdshus och Logi 2025-05-14.pdf",
  "url":"https://www.svenljunga.se/download/18.3f4e20b1196d0a6eb0ca07/1748840483454/…",
  "fileSize":"212 kB"}, …]}
```

**Historikdjup** (rapporter per verksamhet): 1 st → 32 verksamheter,
2 st → 48, 3 st → 20, 4 st → 3, 5 st → 2, 7 st → 2. Datumspann i filnamnen
2016-08-24 till 2026-07-01.

Inget färgomdöme, ingen sammanfattning, inga koordinater — allt utom namn och
datum kräver att PDF:en tolkas. Sidan säger uttryckligen att
"dokumentationen av uppföljning publiceras inte alltid här", så historiken
är ofullständig och får inte presenteras som komplett.

### Borgholm (0885) — en PDF-tabell över hela beståndet

```
https://www.borgholm.se/resultat-livsmedelskontroller/
https://www.borgholm.se/wp-content/uploads/2025/07/Kontrollresultat2025_v42.pdf   (510 kB, 32 sidor)
```

Ett anrop för hela beståndet — men det är en PDF. Tabellkolumner:
**Ort | Typ | Namn | Datum | Kontrollorsak | Avvikelse**.

- ~422 rader med kontrolldatum; ytterligare 217 förekomster av `EA`
  ("ej aktuell" = ingen kontroll utförd det senaste året).
- `Kontrollorsak`: Planerad (411), Uppföljning (61), Händelsestyrd (2).
- `Avvikelse`: **`0` betyder inga avvikelser**, annars fritext som beskriver
  området, t.ex. "Upprätthållande av kylkedjan och uppfyllande av
  temperaturkriterier". Alltså **avvikelser specificerade per kontrollområde**.
- Typindelning i tabellen: B&B, Bageri/konditori, Butik, Restaurang, Café,
  Gatukök, Kiosk m.fl.
- Ingen kvarstår-etikett, inga koordinater.
- Kommunen anger själv rättsgrunden: EU 2017/625 art. 11 och allmänintresset.

Varning: filnamnet är versionerat (`_v42`) och ligger under
`/wp-content/uploads/ÅÅÅÅ/MM/`. URL:en byts vid varje uppdatering — adaptern
måste skrapa länken från sidan, inte hårdkoda PDF-adressen.

---

## Kontrollerade och avskrivna — publicerar INTE per verksamhet

Alla rader nedan bygger på faktiska anrop. Leta inte igen utan skäl.

| Kommun | Kod | Vad som kontrollerades | Utfall |
|---|---|---|---|
| Hallstahammar | 1961 | Iframe, ArcGIS-org (40 objekt), 23 feature-tjänster, GeoServer WFS (4 lager), Origo | Kartan svarar "Item does not exist or is inaccessible" |
| Västerås | 1980 | 304 ArcGIS-tjänster, 244 GeoServer-lager, 83 publika tjänster, 44 POI-kategorier, Origo-konfig | Inget livsmedelslager kvar |
| Göteborg | 1480 | `https://catalog.goteborg.se/rowstore/dataset/3bf3fca5-617d-4687-ac8d-c3ab5b17a4b6` | **Oförändrat.** 4 786 rader, kolumner: namn, adress, postnummer, ort, typ, lat/lon, SWEREF 99 12 00. **Inga kontrolldatum, inga omdömen.** Enbart register |
| Malmö | 1280 | Livsmedelskontroll- och Livsmedelsrapporter-sidorna | Endast projektrapporter (t.ex. hamburgerställen), aldrig per verksamhet |
| Helsingborg | 1283 | `foretagare.helsingborg.se/.../livsmedelskontroll/`, kartor.helsingborg.se, kartportal.helsingborg.se, geodata.helsingborg.se | Ingen publicerad lista, inget kartlager |
| Borås | 1490 | `boras.se/.../livsmedelsinspektioner…` | Sidan säger uttryckligen: "Om ni vill ta del av inspektionerna är ni välkomna att kontakta Miljöförvaltningen" |
| Eskilstuna | 0484 | Origo-konfig `https://karta.eskilstuna.se/x/index.json` + GeoServer-workspace `etuna` (fullständig WFS-katalog) | Träffar på "livs" är livsmiljöer/habitat. `sokvyx_vof_eko_vuxen_restauranger` = äldreomsorgens restauranger, inte kontroller |
| Södertälje | 0181 | Origo-konfig `https://karta.sodertalje.se/index.json` (152 kB) + `sodertalje.se/.../livsmedelskontroll/` | Inget livsmedelskontrollager, ingen publicering |
| Enköping | 0381 | Tidigare "Smiley – kontrollerad verksamhet"-sidan | **HTTP 404.** Sidan är borttagen; livsmedelsavsnittet har bara två kvarvarande undersidor |
| Nacka | 0182 | `nacka.se/.../livsmedelskontroll-i-nacka/` | Ingen publicering |
| Ljusdal | 2161 | `ljusdal.se/.../resultatlivsmedelskontrollen2025…` | Endast **aggregerad statistik** (316 kontroller, 181 med anmärkning). Ingen verksamhetsnivå |
| Ängelholm | 1292 | `engelholm.se/.../livsmedelskontroll.html` | Ingen publicering |
| Skellefteå | 2482 | Livsmedelssidan + ArcGIS-org (2 irrelevanta träffar) + kartor/gis/geodata-värdar | Ingen publicering |
| Nyköping | 0480 | `nykoping.se/.../kontroll-av-livsmedelsverksamhet/` | Ingen publicering |
| Vilhelmina | 2462 | `vilhelmina.se/.../livsmedelskontroll/` | Ingen publicering |

**Kartservrar svepta utan livsmedelsträff** (GeoServer WFS GetCapabilities,
ArcGIS `rest/services?f=json`, Origo `index.json`):
`karta.sundsvall.se` (507 kB WFS-katalog), `kartportal.lulea.se`,
`kartor.umea.se` (403), `kartor.vaxjo.se`, `kartor.norrkoping.se`,
`karta.lund.se`, `karta.halmstad.se` (Hajk), `gis.malmo.se`,
`kartor.kristianstad.se`, `kartor.skelleftea.se`, `gis.skelleftea.se`,
`geodata.skelleftea.se`, `gis.ostersund.se`, `gis.falun.se`,
`kartor.nykoping.se`, `karta.molndal.se`, `karta.kalmar.se`,
`geodata.borlange.se`, `karta.uddevalla.se` (413 kB WFS-katalog),
`geodata.vastervik.se`, `geodata.trelleborg.se`, `karta.angelholm.se`,
`kartportal.eslov.se`, `geodata.hassleholm.se`.

Reservation: för `kartor.skelleftea.se` och `gis.ostersund.se` returnerade
samtliga fyra provade sökvägar identiskt svar (SPA-fallback), så det är ett
svagare negativ än de övriga — deras kartkonfiguration ligger någon
annanstans. Ingen av dem nämner dock "livsmedel" i det som gick att nå.

**ArcGIS Online-organisationer genomsökta** (`/sharing/rest/search?q=orgid:…`
med livsmedel/inspektion): Helsingborg, Norrköping, Gävle, Eskilstuna, Växjö,
Västerås, Skellefteå, Falun, Varberg, Solna, Kalmar, Borlänge, Uddevalla,
Huddinge — samtliga noll relevanta träffar. Malmö, Umeå, Lund, Södertälje,
Halmstad, Borås, Sundsvall, Luleå, Göteborg, Kristianstad, Karlskrona,
Trollhättan, Östersund, Nyköping, Mölndal, Västervik, Motala, Landskrona,
Trelleborg, Ystad, Sigtuna, Täby, Haninge, Botkyrka, Järfälla har **ingen**
ArcGIS Online-organisation på `<kommun>.maps.arcgis.com`.

**Nationella öppna data:** `https://admin.dataportal.se/store/search?type=solr&query=title:livsmedel*&limit=100`
→ hela Sveriges dataportal. De enda dataset som rör kontrollen av enskilda
verksamheter är **Linköpings** (`linkoping.entryscape.net/store/1/resource/66`,
`www.linkoping.se/open/data/livsmedelskontroll2`) och **Stockholms**
("Tillsynsverksamheter – Livsmedel", Ecos 2, uppdateras veckovis). Båda är
redan inlästa. Slutsats: **ingen ytterligare kommun publicerar
livsmedelskontroll som öppna data i Sverige.** Alla nya källor är
webbsidor och kartor, inte dataset.

---

## Vad svepet lär oss om beståndet

1. **Etiketten "kvarstår" är fortfarande undantaget.** Av sju nya källor har
   exakt en (Oskarshamn) ett explicit kvarstår-värde. Det bekräftar valet i
   `grading.py` att härleda allvarsgraden ur mönstret i stället för ur
   etiketten.

2. **Tre nya källor specificerar avvikelser per kontrollområde**
   (Lomma, Borgholm, och via PDF: Kristinehamn/Svenljunga/Höganäs) — men
   alltid som fritext, aldrig som kodade områden. Sambruk-specens
   kontrollområden finns fortfarande ingenstans i verkligheten.

3. **Ingen ny källa utom Oskarshamn och Kristinehamn har koordinater.**
   Geokodning ur adress blir nödvändigt för Lomma, Höganäs, Svenljunga,
   Sjöbo och Borgholm.

4. **Handredigerad HTML är en riskklass för sig.** Sjöbos alt/src-konflikt i
   19 % av posterna är inte ett skrivfel — det är vad som händer när ett
   omdöme underhålls manuellt i ett CMS. Lommas 34 fritextsträngar med fem
   stavfel är samma fenomen i mildare form. Alla HTML-källor behöver en
   inbyggd konsistenskontroll som stoppar inläsningen när formatet glider,
   på samma sätt som Jönköpings `har_avvikelse` används som facit.

5. **Kommuner slutar publicera.** Västerås 2019 och Hallstahammar (odaterat)
   hade båda kartor som inte finns kvar; Enköpings smiley-sida är borttagen.
   Adaptrar måste tåla att en källa försvinner, och sidor får inte visa
   inaktuella omdömen från en död källa.
