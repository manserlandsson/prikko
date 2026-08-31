# 52. Stockholmslagret Livsmedelstillsyn: 289 742 rader som svepet missade

**Datum:** 2026-08-31
**Vad det här är:** en verifiering, inte en hämtare. Ingen kod i `pipeline/`
eller `site/` är rörd, ingenting är skrivet till `site/src/data/`.
**Metod:** hela lagret hämtades, alla 289 742 rader, och ställdes rad för rad
mot `site/src/data/stockholm.json`. Alla tal nedan är räknade, inga är
uppskattade. Där något inte gick att belägga står det som overifierat.
**Anledning:** `docs/50_begar_ut_kontrollen.md` avsnitt 11 rapporterade fyndet
som ett bifynd och bad om att det skulle prövas.

---

## 1. Slutsatsen först

**Talen i `docs/50` stämmer. Slutsatsen som drogs av dem gör det inte.**

Lagret finns, det innehåller precis det som rapporterades, och det är CC0. Men
det slutade uppdateras **2025-10-22**, det saknar varje anläggnings-id som går
att para mot vårt, och 95,5 procent av dess kontrolltillfällen har vi redan.
Det enda det bär som vi saknar helt, **rapporteringspunkten i klartext**, hör
till just de kontroller som är för gamla för att synas överst på en sida.

| Fråga | Svar |
|---|---|
| Finns 289 742 rader? | **Ja**, exakt |
| 8 146 anläggningar? | **Ja**, exakt |
| 2018-01-02 till 2025-10-21? | **Ja**, exakt |
| CC0? | **Ja**, men inte där `docs/50` säger. Se avsnitt 3 |
| Ny täckning? | **Nej.** 94,5 procent av deras anläggningar har vi redan |
| Nya kontroller? | **1 764 av 40 708**, alltså 4,3 procent |
| Något vi saknar helt? | **Ja.** Rapporteringspunkt, riskklass och godkända punkter |
| Färskt? | **Nej.** Stilla sedan 2025-10-22. Vi har 4 058 kontroller det saknar |

**Rekommendationen är att inte hämta lagret, och att skriva brevet i stället.**
Skälet står i avsnitt 8, med talen.

---

## 2. Lagret, verifierat

### 2.1 Var det ligger

    https://services-eu1.arcgis.com/81H0sgjoIWj6WxIM/arcgis/rest/services
        /Livsmedelstillsyn/FeatureServer/41

| Uppgift | Värde |
|---|---|
| ArcGIS Online-post | `8447f7af7135442f82182c8001ad78b6` |
| Ägare | `sthlm_miljo2023`, Miljöförvaltningen, Stockholms stad |
| Organisation | `81H0sgjoIWj6WxIM`, 157 poster totalt |
| Öppna data-hubb | `https://open-data-sthlm-miljo.hub.arcgis.com` |
| Kontakt i metadatan | `miljodata@stockholm.se` |
| Beskrivning | "Livsmedelstillsyn, utförd av miljöförvaltningen, Stockholms stad. Uppgifter hämtade från miljöförvaltningens verksamhetssystem." |
| Upphovsrättstext på tjänsten | "Stockholms stad, miljöförvaltningen" |
| Projektion | SWEREF 99 18 00, `wkid 3011`, samma lokala zon som e-tjänsten |
| Takgräns per svar | 2 000 rader, med `resultOffset` som sidbrytning |
| Nedladdning som helhet | CSV, GeoJSON, XLSX, GPKG, shapefil, filgeodatabas |

Lagret ligger som **lager 41** i en tjänst som bara har det enda lagret. Det
har betydelse, se avsnitt 6.1.

### 2.2 Talen

Hämtningen tog 145 anrop och gav:

| Mått | Tal | `docs/50` sa |
|---|---:|---|
| Rader | **289 742** | 289 742. **Rätt** |
| Unika `ObjektId` | **8 146** | 8 146. **Rätt** |
| Unika `GlobalID` | 289 742 | inte nämnt |
| Tidigaste `TillsynsDatum` | **2018-01-02** | 2018-01-02. **Rätt** |
| Senaste `TillsynsDatum` | **2025-10-21** | 2025-10-21. **Rätt** |
| Unika par av anläggning och datum | **40 708** | inte nämnt |

En rad är alltså **en rapporteringspunkt vid ett kontrolltillfälle**, precis
som rapporterat. 289 742 punkter fördelade på 40 708 kontrolltillfällen på
8 146 anläggningar, alltså i snitt 7,1 punkter per kontroll och 5,0 kontroller
per anläggning.

### 2.3 Fälten, med ifyllnadsgrad

Nitton fält. Nämnaren är 289 742 rader.

| Fält | Ifyllt | Andel | Vad det är |
|---|---:|---:|---|
| `ObjektId` | 289 742 | 100 % | Guid, **inte** e-tjänstens. Se avsnitt 4.1 |
| `AnlaggningsNamn` | 289 742 | 100 % | Verksamhetens namn |
| `Nr` | 289 742 | 100 % | **Rapporteringspunktens kod**, `J03`, `B02`, `A01` |
| `TillsynsDatum` | 289 742 | 100 % | Datum som text, `2025-10-21` |
| `Fastighet` | 285 163 | 98,4 % | Fastighetsbeteckning. Vi har den inte |
| `GeoPositionNorr` och `-Ost` | 285 250 | 98,4 % | SWEREF 99 18 00 |
| `Anmarkning` | 285 132 | 98,4 % | "Utan avvikelse" eller "Avvikelse" |
| `Adress` | 280 760 | 96,9 % | Besöksadress |
| `Riskklass` | 273 038 | 94,2 % | **Heltal 2 till 8.** Vi har den inte |
| `VerksamhetsTyp` | 85 353 | 29,5 % | Livsmedelsverkets verksamhetstyp |
| `Kontrollorsak` | 85 353 | 29,5 % | Planerad, Uppföljande, Händelsestyrd |
| `Typ` | 85 353 | 29,5 % | Oanmäld eller Föranmäld |
| `Kontrollomrade` | 85 353 | 29,5 % | "Grundförutsättningar, hygien" |
| `Beskrivning` | 85 353 | 29,5 % | **Punkten i klartext** |
| `AnlaggningsTyp` | **0** | 0 % | Tomt i hela lagret |
| `TillsynsDatumTid` | **0** | 0 % | Tomt i hela lagret, trots datumtyp |

**De fem fälten på 29,5 procent är inte slumpvis glesa, de är en skarp gräns i
tiden.** Rader med `Kontrollomrade` ifyllt spänner 2024-01-02 till 2025-10-21.
Rader utan spänner 2018-01-02 till 2024-01-19. Skiftet sammanfaller med
Livsmedelsverkets nya riskklassningsmodell från 2024. Före den finns bara kod,
utfall och datum. Efter den finns hela sammanhanget.

Detta är viktigt: **de 204 389 äldsta raderna bär kod men ingen beskrivning,
ingen kontrollorsak och ingen anmäld- eller oanmäldmarkering.**

### 2.4 Utfall och riskklass

| `Anmarkning` | Rader |
|---|---:|
| Utan avvikelse | 264 415 |
| Avvikelse | **20 717** |
| Tomt | 4 610 |

| `Riskklass` | Rader |
|---:|---:|
| 2 | 107 |
| 3 | 5 267 |
| 4 | 35 133 |
| 5 | 74 612 |
| 6 | 69 841 |
| 7 | 66 108 |
| 8 | 21 970 |
| Tom | 16 704 |

Räknat per anläggning bär **6 573 av 8 146** minst en riskklass.

`Kontrollorsak` över de 85 353 fylliga raderna: Planerad 76 671, Uppföljande
4 131, Händelsestyrd 3 278, Uppföljande tidigare avvikelse 1 273.
`Typ`: Oanmäld 68 996, Föranmäld 16 357.

---

## 3. Licensen, läst som den står

**`docs/50` skrev CC0, och det stämmer, men beviset ligger inte där man först
tittar.**

På ArcGIS Online-posten är fältet `licenseInfo` **tomt**. Det är värt att
notera, eftersom flera av samma förvaltnings andra lager, till exempel
ArtArken och Naturvärdesinventeringar, bär full CC0-text i just det fältet.
Också hubbens DCAT-flöde ger `"license": ""` för Livsmedelstillsyn. Läser man
bara ArcGIS hade slutsatsen blivit "ingen angiven licens", alltså samma läge
som Norrköping i `docs/42` avsnitt 6.4.

**Villkoren står i stadens egen metadatapost i stället.** Datamängden heter där
*Tillsynsverksamheter - Livsmedel* och ligger i Stockholms
GeoNetwork-katalog:

    https://dataportalen.stockholm.se/dataportalen/srv/api/records
        /003c9649-91fd-4ae0-9958-a335c6b77b13

HTTP 200, 25 505 byte ISO 19139. Två `MD_LegalConstraints`, ordagrant:

    accessConstraints  otherRestrictions
    otherConstraints   "Inga begränsningar"
                       resources.geodata.se/.../atkomstrestriktioner.xml
                       #ingaTillampligaVillkor

    useConstraints     otherRestrictions
    otherConstraints   "DU HAR TILLSTÅND ATT: Personen som associerat ett verk
                       med detta dokument har dedikerat verket till public
                       domain ... Du får kopiera, modifiera, distribuera och
                       framföra verket, även i kommersiellt syfte, utan att
                       fråga om lov."
                       creativecommons.org/publicdomain/zero/1.0/legalcode.sv

Att posten gäller **exakt det här lagret** går att belägga och inte bara anta.
Postens enda datadistribution är:

    HTTP:ESRI Portal-URL, "Miljöförvaltningens öppna data-hub"
    https://open-data-sthlm-miljo.hub.arcgis.com/datasets
        /8447f7af7135442f82182c8001ad78b6_0/explore

Postnumret `8447f7af7135442f82182c8001ad78b6` är Livsmedelstillsyns ArcGIS-post.
Samma kedja finns på Sveriges dataportal, som harvestar posten.

**Slutsatsen enligt `docs/prikko-licens-lasas-som-den-star`:** utgivarens egen
metadatapost säger CC0 1.0 med full licenstext och åtkomst utan begränsningar.
Det är villkoret. Ett tomt fält i ett tredjepartssystem är inte ett villkor och
väger inte mot det. **Lagret är CC0 och får användas kommersiellt.**

**En avvikelse ska ändå skrivas ut.** Sveriges dataportals harvestade DCAT ger
posten `accessRights: RESTRICTED` och licenskategorin `otherlicense`. Källposten
säger "Inga begränsningar". Källan väger tyngst, men skillnaden är sannolikt en
del av varför svepet i `docs/42` inte gick vidare. Se avsnitt 6.1.

---

## 4. Vad vi redan har, mätt mot deras

Räknat ur `site/src/data/stockholm.json`, hämtad 2026-08-19.

| Mått | Vårt | Deras |
|---|---:|---:|
| Anläggningar | **8 520** | 8 146 |
| Kontrolltillfällen | 47 330 rader, **42 599** unika par av anläggning och datum | **40 708** |
| Datumspann | **2018-01-02 till 2026-08-17** | 2018-01-02 till 2025-10-21 |
| Avvikelsepunkter | **16 268** | 20 717 |
| Godkända punkter | **0** | **264 415** |
| Unika avvikelsekoder | **15** | **114** |
| Rapporteringspunkter totalt | 15 | **179** |
| Riskklass | **nej** | ja, 6 573 anläggningar |
| Organisationsnummer | **ja**, 8 016 rader | nej |
| Postnummer, företagsform, aktivitetslista | **ja**, ur registreringsintyget | nej |
| Fastighetsbeteckning | nej | ja, 98,4 % |

### 4.1 Nyckeln som inte finns

`stockholmsintyg.py` slår upp registreringsintyget på vårt eget id med
prefixet `F-0180-` avklippt, alltså e-tjänstens guid. Frågan var om lagrets
`ObjektId` är samma guid. **Det är den inte.**

    deras 8 146 ObjektId  ∩  våra 8 520 id  =  0

Noll. Inte några få, inte hälften. Ingen enda. `ObjektId` är Ecos 2:s interna
id för tillsynsobjektet, e-tjänstens guid är ett annat. **Det finns alltså
ingen id-nyckel mellan lagret och oss**, och all parning måste ske på namn,
adress och läge.

Att detta inte är en egenskap hos ArcGIS utan hos just det här lagret framgår
av avsnitt 7: två andra av förvaltningens lager bär `AnlaggningId` som **är**
vårt id, med 7 316 respektive 5 416 träffar.

### 4.2 Parningen, i tre steg

| Steg | Nyckel | Parade | Kvar |
|---|---|---:|---:|
| 1 | Exakt namn och adress, normaliserade | **7 214** | 932 |
| 2 | Enbart namn, unik träff | 74 | 858 |
| 3 | Läge inom 25 m **och** samma adress | 414 | **444** |
| | **Summa** | **7 702** | |

**7 702 av 8 146, alltså 94,5 procent.** Steg 1 och 3 är starka nycklar. Steg 2
är svagare och gäller 74 anläggningar, knappt en procent.

**De 444 oparade är i huvudsak nedlagda och mobila.** 244 av dem saknar adress
helt och heter sådant som "El Arepazo, Food Truck" och "Pizza Popolo, Food
truck". Sista kontrollår för de 444: 2025 för 213, 2024 för 137, tidigare för
resten. E-tjänsten släpper avregistrerade verksamheter, lagret behåller dem.
Det är arkiv, inte täckning.

**979 av våra 8 520 har ingen motpart i lagret. 882 av dem registrerades
2025-01-01 eller senare**, alltså efter att lagret slutade uppdateras. 463
saknar kontroll också hos oss.

### 4.3 Djupet, på de parade

7 541 parade anläggningar har kontroller på båda sidor. Avgränsat till lagrets
egen sista dag, 2025-10-21:

| Mått | Tal |
|---|---:|
| Deras kontrolltillfällen | 39 295 |
| Våra kontrolltillfällen | 37 629 |
| **Samma anläggning och samma datum** | **37 531**, alltså **95,5 % av deras** |
| Bara deras | **1 764** |
| Bara våra | 98 |
| Våra kontroller efter 2025-10-21 som lagret saknar | **4 058** |
| Parade anläggningar där vi saknar kontroller helt | 115 |

De 1 764 kontroller bara de har fördelar sig jämnt över åren, mellan 161 och
314 per år, och 612 av dem bär minst en avvikelse.

### 4.4 De stämmer överens, och det är ett kvitto på vår pipeline

På de 37 531 gemensamma kontrolltillfällena:

| Deras utfall | Vår `assessment` ren | Vår `assessment` anmärkt |
|---|---:|---:|
| Utan avvikelse | **25 727** | 319 |
| Avvikelse | 7 | **11 478** |

**37 205 av 37 531 överens, alltså 99,1 procent.** De 326 som skiljer sig är
värda en egen titt någon gång, men de är inte ett hinder.

Anmäld eller oanmäld, där båda har uppgiften: 11 167 av 11 212 överens, alltså
**99,6 procent**. `Kontrollorsak` faller rakt på vår `REASON_MAP`: Planerad ger
vår `ROUTINE` i 8 678 fall, Uppföljande ger `FOLLOWUP` i 1 513, Händelsestyrd
ger `COMPLAINT` i 807.

**Det är den viktigaste sidoeffekten av hela mätningen.** Två oberoende utdrag
ur samma Ecos-databas, lästa genom två helt olika gränssnitt och två helt olika
normaliseringar, säger samma sak om nästan varje kontroll. `fetch_stockholm.py`
och `prikko/sources/stockholm.py` gör rätt.

---

## 5. Det enda de har som vi saknar: punkten i klartext

Vår adapter läser `ControlAreaList` ur e-tjänsten. Den listan bär bara
**bokstavsgruppen**. Lagret bär **hela rapporteringspunkten**. Skillnaden syns
bäst på en rad:

    Ålstens pizzeria, 2024-05-28

    DERAS                                        VÅRA
    A01 Godkännande och registrering av          A  Administration
        anläggningar och verksamheter
    B04 Frivillig livsmedelsinformation          B  Information om livsmedel
    J03 Hygien före, under och efter processen   J  Hygien

Vi har **15 koder**, alla enbokstaviga, med en generisk beskrivning var:

    J 8 387 Hygien              B 4 369 Information om livsmedel
    K 1 615 Riskhantering       H   714 Spårbarhet
    A   458 Administration      C   432 Specialinformation
    resten under 100 vardera

Fältet `group` är dessutom **tomt på alla 16 268** av våra punkter.

De har **114 avvikelsekoder** och 179 rapporteringspunkter totalt, var och en
med sin egen text:

    J03 3 811 Hygien före, under och efter processen
    J08 2 376
    J02 2 306 Utformning och underhåll av lokaler och utrustning
    B02 2 102
    K01 1 486
    B01   990 · J04 905 · B04 830 · B99 762 · J01 618 ...

På de 37 531 gemensamma kontrollerna: deras 18 892 avvikelsepunkter mot våra
14 661. Lika många på 34 467 kontroller, fler hos dem på 3 057, fler hos oss på
7. Skillnaden är alltså inte att de hittat fler avvikelser, utan att vi lägger
ihop `J02` och `J03` till ett enda `J`.

De har dessutom **264 415 godkända punkter**, som vi inte har alls. Det är
uppgiften "vad kontrollerades och var utan anmärkning", och den finns inte i
e-tjänsten.

---

## 6. Färskheten, som avgör allt

### 6.1 Lagret ligger stilla

    editingInfo.dataLastEditDate    1761124014966
                                    = 2025-10-22 09:06:54 UTC

    hubbens DCAT, modified          2025-10-22T09:06:54.966Z
    ArcGIS-postens metadata         2025-03-03
    ArcGIS-posten skapad            2024-04-22
    senaste TillsynsDatum i data    2025-10-21

**Lagret uppdaterades senast för 313 dagar sedan.** Datat slutar dagen före.

Katalogen lovar något annat. Stockholms egen post säger "Data uppdateras
veckovis" i beskrivningen och `MD_MaintenanceFrequencyCode = daily` i
underhållsfältet. DCAT-harvesten på dataportal.se säger
`accrualPeriodicity: DAILY`. **Ingen av dessa stämmer.**

Vi kan inte veta varför. Två sakförhållanden är ändå värda att skriva ned,
eftersom de pekar åt samma håll:

1. **Katalogens länk till lagret är trasig.** Metadataposten pekar på
   `.../datasets/8447f7af7135442f82182c8001ad78b6_0/explore`, alltså
   **sublager 0**. Tjänsten har bara **lager 41**. URL:en svarar HTTP 404 och
   `/FeatureServer/0` svarar "The requested layer (layerId: 0) was not found".
   Den som följer katalogens egen länk kommer alltså inte fram.
2. Fältet `TillsynsDatumTid`, av datumtyp, är tomt på alla 289 742 rader,
   medan strängfältet `TillsynsDatum` är ifyllt. Det ser ut som en export som
   aldrig fyllde i den ena halvan.

Ett lager vars publiceringsflöde stannat i tio månader utan att någon märkt
det är historik. **Det är inte en färsk källa, och det ändrar vad det är
värt.** Overifierat: om det ligger stilla för att flödet gått sönder eller för
att någon beslutat att sluta. Bara ett brev kan svara.

### 6.2 Vad stillaståendet kostar i praktiken

Det avgörande talet är inte hur mycket historik lagret täcker, utan hur ofta
det täcker **den kontroll som står överst på verksamhetssidan**.

| Mått | Tal | Andel |
|---|---:|---:|
| Våra anläggningar med minst en kontroll | 7 942 | |
| Vars **senaste** kontroll finns i lagret | **4 564** | **57,5 %** |
| Anläggningar vars senaste kontroll bär avvikelser | 798 | |
| Varav lagret täcker just den kontrollen | **436** | **54,6 %** |

Senaste kontrollens år över våra 7 942: 2026 för 2 746, 2025 för 3 182, 2024
för 1 103, tidigare för 911.

**Alltså: berikar vi med lagret som det ligger får ungefär 45 procent av
sidorna en färsk kontroll med grovkod högst upp och äldre kontroller med
finkod under.** Det är ett synligt fel av precis den sorten
`docs/prikko-slack-trasigt-direkt` handlar om, och det går inte att laga med
kod, eftersom uppgiften inte finns.

---

## 7. Två lager till hos samma förvaltning

Svepet av förvaltningens 157 ArcGIS-poster gav två lager till som rör
livsmedel. **Ingen av dem finns i någon katalog och ingen bär licens.**

### 7.1 Rätt skylt 2026

    .../services/Rätt_skylt_2026_vy/FeatureServer/0

| Mått | Värde |
|---|---|
| Rader | **5 847** |
| Senast ändrad | **2026-07-24**, alltså fem veckor sedan |
| Fält | `AnlaggningId`, `AllaInriktningar`, `AnlaggningsNamn`, `Adress`, `Status`, `StatusInventering`, `ratt_skylt`, `omrade` |
| `ratt_skylt` | ok 4 096, fel 237, ny 38, tomt 1 476 |
| `StatusInventering` | kontrollerad 4 302, ej_kontrollerad 1 477, ny_anlaggning 67 |
| Katalogpost | **ingen** |
| Licens | **ingen angiven någonstans** |

**`AnlaggningId` ÄR e-tjänstens guid, alltså vårt id.** 5 416 av lagrets 5 792
unika id finns i `site/src/data/stockholm.json`. Fältet `AllaInriktningar` bär
dessutom samma sorteringsprefix, "1. Restaurang", som `_clean_type` i
`prikko/sources/stockholm.py` redan skalar bort.

Det är alltså den nyckel Livsmedelstillsyn saknar, i ett lager som lever.

### 7.2 Inventering av livsmedelsanläggningar

    .../services/Visning_Inventering_Livsmedelsanlaggningar_250610
        /FeatureServer/0

13 095 rader, senast ändrad 2025-07-20, samma fältuppsättning plus
`Kommentar`. `Status`: Aktiv 8 491, Upphörd/Skrotad 4 252, Inaktiv 148,
Makulerad 104, Anmäld/Ansökt 33. 7 316 av 13 025 unika `AnlaggningId` finns hos
oss. Ingen katalogpost, ingen licens.

### 7.3 Vad de är och inte är

Bägge ser ut att vara **arbetsmaterial för fältinventering**, inte publicerade
öppna data. De är läsbara utan inloggning, men de finns inte i någon katalog,
ingen har skrivit några villkor för dem, och innehållet är operativt: vilka
skyltar som är fel, vilka objekt som är kontrollerade.

**Vi hämtar dem inte.** Enligt `docs/prikko-licens-lasas-som-den-star` läser vi
villkoren som de står, och här står ingenting, precis som för Norrköpings
`ecos.xml` i `docs/42` avsnitt 6.4. Frånvaro av licens är inte ett ja.

Att de finns är däremot ett argument i brevet: förvaltningen har **redan**
export från Ecos med e-tjänstens anläggnings-id i, och kör den så sent som i
juli 2026.

### 7.4 Resten av portalen, sveptes

Förvaltningens öppna data-hubb ger 109 datamängder via
`/api/feed/dcat-us/1.1.json`. ArcGIS-organisationen har 157 poster. Sjutton
sökningar mot Sveriges dataportal filtrerade på Stockholm. Kartapplikationen
som metadataposten pekar på laddar 20 poster, alla redan kända.

**Resultat: Stockholms enda katalogförda livsmedelsdatamängd är
Tillsynsverksamheter - Livsmedel.** De två lagren i 7.1 och 7.2 är de enda
ytterligare livsmedelsbestånden hos förvaltningen, och de är okatalogförda.
Inget annat finns.

---

## 8. Vad vi ska göra

### 8.1 Ersätta vår Stockholmskälla: nej

Lagret saknar organisationsnummer, postnummer, företagsform, aktivitetslista,
registreringsdatum och aktivstatus, alltså allt registreringsintyget ger. Det
saknar 979 av våra anläggningar och 4 058 av våra kontroller. Det slutar tio
månader före i dag. Det har ingen nyckel att para på. Frågan är inte nära.

### 8.2 Berika med djupet: rätt tanke, fel tillfälle

Vad det skulle ge, räknat:

| Vad | Tal |
|---|---:|
| Avvikelserader som byter grovkod mot finkod | **17 772** |
| Berörda anläggningar | **4 487** av 8 520 |
| Anläggningar som skulle få riskklass | **6 193**, alltså 72,7 % |
| Tillväxt i `stockholm.json` | ca 1,19 MB som ersätter ca 1,05 MB, alltså +0,14 MB på 24,9 MB |

Vad det kostar, räknat:

- **Bara 57,5 procent av sidorna får finkod på sin senaste kontroll**, och
  bara 54,6 procent av dem vars senaste kontroll har avvikelser. Resten står
  kvar på "Hygien" medan grannen står på "J03 Hygien före, under och efter
  processen".
- **Andelen faller varje vecka.** Varje ny kontroll Stockholm gör hamnar
  utanför lagret så länge det ligger stilla.
- **Parningen är namn och adress, inte id.** 94,5 procent, varav 74
  anläggningar på enbart namn. På en sida som namnger en verksamhet är en
  felparad avvikelse den dyraste sortens fel vi kan göra.
- Riskklassen går **inte** att härleda ur det vi redan har. Vår
  `registration.frequency` korrelerar men bestämmer inte: frekvens 2 fördelar
  sig över sex olika riskklasser, och riskklass 7 finns på allt från frekvens 1
  till 25. Den är alltså genuint ny uppgift. Den är samtidigt en
  kontrollfrekvensklass och inte ett hygienbetyg, och den skulle sakna värde
  för 27 procent av beståndet.

### 8.3 Rekommendationen: låt lagret ligga, och skriv brevet

**Lagret är inte en hämtare, det är ett bevis.** Det bevisar tre saker som
tillsammans gör ett brev till Stockholm svårt att säga nej till:

1. Miljöförvaltningen **har redan publicerat** rapporteringspunkt för
   rapporteringspunkt ur Ecos 2, 289 742 rader, under CC0. Det är ingen ny
   fråga, det är en fråga om att återuppta.
2. Publiceringen **har stannat** 2025-10-22, medan förvaltningens egen
   metadatapost fortfarande lovar veckovis uppdatering och katalogens länk
   till lagret svarar 404. Det är sannolikt ett fel de själva vill veta om.
3. Förvaltningen **har `AnlaggningId` i sina exporter**, bevisat av lagren i
   avsnitt 7 som kördes senast 2026-07-24. Att be om det fältet i
   Livsmedelstillsyn är att be om något som redan finns i systemet.

Brevet ska alltså be om tre saker, i den ordningen: att lagret börjar
uppdateras igen, att `AnlaggningId` följer med som fält, och att den trasiga
katalogslänken rättas.

**Det är INTE en begäran enligt offentlighetsprincipen och ska inte skrivas med
`pipeline/begaran.py`.** Den generatorn skriver utlämnandebegäranden, alltså
ett krav med en frist. Det här är motsatsen: förvaltningen har redan valt att
publicera, publiceringen har stannat av vad som ser ut som ett tekniskt fel,
och vi hör av oss som en användare av deras data. Ett brev med lagrumshänvisning
i den situationen läser som ett hot och gör en enkel sak svår.

Lydelsen nedan är färdig att kopiera. Den är kort med avsikt, den ber om tre
saker som var och en är ett litet handgrepp, och den nämner ingen frist.

### 8.3.1 Färdig lydelse

Mottagare: `miljodata@stockholm.se`
Ämne: Livsmedelstillsyn som öppna data har slutat uppdateras

> Hej,
>
> Vi driver prikko.se, som samlar kommunernas offentliga livsmedelskontroller
> och visar dem för konsumenter. Vi använder stadens öppna data och hör av oss
> om tre saker i datamängden Tillsynsverksamheter Livsmedel, alltså lagret
> Livsmedelstillsyn hos services-eu1.arcgis.com.
>
> **1. Lagret har inte uppdaterats sedan 22 oktober 2025.** Metadataposten
> anger uppdatering varje vecka, och tjänstens eget fält `dataLastEditDate`
> står på 2025-10-22. Vi vet inte om det är ett medvetet beslut eller ett fel i
> exporten, och skriver därför hellre än gissar. Om det är ett fel vill vi
> gärna veta när det kan vara åtgärdat.
>
> **2. Katalogens länk till lagret svarar 404.** Posten pekar på sublager 0,
> och tjänsten har bara lager 41. Den som följer länken från dataportalen når
> alltså aldrig datan.
>
> **3. Kan anläggningens id följa med som fält?** Lagret bär `ObjektId`, som är
> Ecos interna id, och det går inte att koppla mot det anläggnings-id staden
> använder i sina e-tjänster. Vi ser att fältet `AnlaggningId` redan följer med
> i andra av förvaltningens exporter, till exempel Rätt skylt. Följde det med
> även här skulle uppgifterna gå att koppla ihop utan att någon behöver para på
> namn och adress, vilket blir fel i enstaka fall och kräver handpåläggning.
>
> Vi vill understryka att datamängden är ovanligt bra. Den bär
> rapporteringspunkten i klartext, alltså 114 punkter i stället för en
> sammanfattning, och det är mer än någon annan kommun i landet publicerar.
> Den är också den enda källa vi känner till som redovisar vilka punkter som
> var utan anmärkning och inte bara vilka som avvek.
>
> Vänliga hälsningar,
> [FYLL I NAMN]
> Magoed AB, prikko.se

**Vad som INTE står i brevet, och varför.** Ingen frist, inget lagrum, ingen
antydan om att vi har rätt till något. Vi har det förmodligen, men den som
åberopar en rättighet mot någon som redan frivilligt gjort mer än de behöver
har missförstått vem som gör vem en tjänst. Sista stycket är inte artighet, det
är det enda i brevet som ger dem ett skäl att prioritera det.

**Blir svaret ja är det den enskilt största datauppgraderingen i projektet:**
114 rapporteringspunkter i klartext i stället för 15 bokstäver, på alla 8 520
anläggningar, med id-nyckel och färskt. Blir svaret nej är fallbacken i 8.4
kvar och kostar en dag.

### 8.4 Om brevet inte ger något: vad som då ska byggas

Beslutet ska gå att ta på det här, så här är bygget beskrivet färdigt. **Det
ska inte byggas nu.**

**Ny fil, `pipeline/prikko/sources/stockholmtillsyn.py`.** Sidbrytande hämtare
mot lager 41 med `resultOffset` om 2 000, plus normalisering. Ingen ny
`fetch_*.py` på toppnivå: lagret är en berikning av Stockholm och inte en egen
kommun, så det hör hemma som ett steg i `fetch_stockholm.py`.

**Parningsmodul, i samma fil.** Tre steg enligt 4.2, med kravet att steg 2 och
3 **loggar varje parning** och att steg 2 stängs av som förval. Parningen ska
inte gissa. Resultatet cachas som `pipeline/data/stockholmtillsyn_parning.json`
så att den inte behöver köras om, och så att den går att granska.

**Ändring i `pipeline/prikko/sources/stockholm.py`.** `ControlArea` bär redan
`code`, `group` och `description`. Fälten finns alltså, `group` är bara tomt i
dag. Berikningen fyller `code` med `Nr`, `group` med `Kontrollomrade` och
`description` med `Beskrivning`, men **bara** när parningen är säker och
kontrollen finns på båda sidor. Annars står grovkoden kvar. `UnknownSourceValue`
gäller som vanligt: en kod vi inte känner igen får aldrig tolkas bort.

**Ändring i `fetch_stockholm.py`.** Ett steg efter `collect()` och före
`assess()`, så att bedömningsmodellen ser samma punkter som i dag. Berikningen
får **aldrig** ändra ett omdöme, bara texten som beskriver det.

**Ändring i `site/`.** Ingen, om sidan redan skriver ut `description` per
punkt. Måste kontrolleras. Om `group` börjar bli ifyllt på en del punkter men
inte alla måste komponenten tåla båda, alltså en visuell granskning enligt
`docs/prikko-slack-trasigt-direkt`.

**Riskklassen byggs inte.** 72,7 procent täckning på en uppgift som är en
kontrollfrekvensklass och inte ett betyg, från ett fruset lager, är inte värt
ett fält på sidan. Den hör hemma i mätningen och inte i produkten.

**Kostnad:** en dag för hämtare och parning, en halv för berikningen, en halv
för granskningen av de blandade punkterna. Prislappen är låg. Det som är dyrt
är att beståndet blir ett tvåskiktat lapptäcke som åldras, och det är därför
brevet går först.

---

## 9. Det som inte är verifierat

| Fråga | Läge |
|---|---|
| Varför lagret stannade 2025-10-22 | Okänt. Trasigt flöde eller beslut. Bara ett brev svarar |
| Om `_0` i katalogens länk är orsaken eller en följd | Okänt |
| De 326 kontroller där utfallen skiljer sig | Inte utredda. 0,9 procent |
| Om `ObjektId` går att översätta till e-tjänstens guid via någon tredje källa | Inte prövat |
| Om de två lagren i avsnitt 7 är avsedda att vara publika | Okänt. Ingen katalogpost, ingen licens |
| Lagrets 431 anläggningar vi inte känner igen alls | Antagligen avregistrerade. Inte prövat mot registret |

---

## 10. Så här körs mätningen om

1. `https://www.arcgis.com/sharing/rest/search?q=Livsmedelstillsyn&f=json` ger
   tjänstens URL.
2. `.../FeatureServer/41/query` med `where=1=1`, `outFields=*`,
   `returnGeometry=false`, `orderByFields=OBJECTID ASC` och `resultOffset` i
   steg om 2 000. 145 anrop, ungefär 16 minuter, 163 MB JSON.
3. `.../FeatureServer/41?f=json` ger `editingInfo.dataLastEditDate`, som är det
   enda tillförlitliga färskhetsmåttet. Katalogens uppdateringslöfte är det
   inte.
4. Licensen läses ur GeoNetwork-posten, inte ur ArcGIS-posten. Se avsnitt 3.
5. Parningen enligt 4.2 mot `site/src/data/stockholm.json`.

Skripten låg i sessionens scratchpad och är inte incheckade, eftersom de är
engångsverktyg. Stegen ovan räcker för att göra om allt.

**Metodlärdomen, som är den samma som i `docs/42` avsnitt 10 fast spegelvänd:**
där gällde "leta efter datafilen och inte efter sidan". Här gäller **följ
distributionslänken även när titeln säger att du redan har beståndet.** Se
`docs/42` avsnitt 0.
