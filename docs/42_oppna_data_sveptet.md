# 42. Öppna data-svepet: vad som redan går att äta utan att fråga

**Datum:** 2026-08-30
**Vad det här är:** ett svep, inte en hämtare. Ingen kod i `pipeline/` eller
`site/` är rörd.
**Metod:** varje påstående nedan bygger på ett faktiskt HTTP-svar den här
dagen, med statuskod och storlek utskriven. Alla anrop gjordes med
`User-Agent: PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)`.
Där något inte gick att belägga står det som overifierat.

---

## 1. Slutsatsen först

**Två källor finns, ingen av dem är den vi hoppades på, och tillsammans är de
värda 5 895 verksamheter.**

| Grupp | Vad det är | Kommuner | Verksamheter |
|---|---|---:|---:|
| **A** | NSÖD-format, kontrollresultat, fri licens | **0** | **0** |
| **B** | Eget format, kontrollresultat | 1 (Norrköping) | 1 022 |
| **C** | Bara anläggningslista, inga kontroller | 1 (Göteborg) | 5 076 |
| **D** | Finns, men licensen hindrar oss | 0 | 0 |

Tre saker är värda att säga rakt ut.

**Grupp A är tom, och det är en mätning och inte en lucka.** Den nationella
specifikationen finns, den är färdig, den heter *Livsmedelskontroller som
öppna data v2.0* och den togs fram av NSÖD och ÖDIS ovanpå Sambruks och SKL:s
arbete från 2016. Noll svenska kommuner publicerar i den. NSÖD:s **egen**
uppföljningsfil på dataportal.se har en enda kommunflik, LUND, och där står
0 klara, 0 påbörjade och 13 ej påbörjade frågor (avsnitt 3.2). Specen är
skriven, ingen har implementerat den, och det gäller även de tolv kommuner
vi redan läser: allihop har eget format.

**Det enda nya kontrollbeståndet är Norrköpings, och det ligger kvar av
misstag.** Söksidan är borta sedan minst 2026-08-03 (R9), men datafilen
`ecos.xml` svarar HTTP 200 med 7 434 345 byte och innehåller 4 451
inspektioner på 1 022 verksamheter. Den är samtidigt **inaktuell**: senaste
kontrollen är daterad 2024-01-03 och filen ändrades 2024-03-17. Vi kan alltså
inte publicera den som den är, men vi vet nu exakt vad Norrköping har och i
vilket format, vilket gör begäranbrevet till dem till det vassaste i hela
kampanjen.

**Göteborg är stort men grunt.** 5 076 verksamheter, CC0, koordinater,
uppdaterad i går. Men inte ett enda kontrollresultat. Det är en nållista utan
betyg, och sajtens hela premiss är betyget.

Slutsatsen från `docs/20_kommunexpansion.md` avsnitt 2.1 står därför kvar,
med en rättelse: gruppen `oppen_data` är inte tom, den innehåller Norrköping
och Göteborg, men ingen av dem går att publicera utan ett brev först.
Mejlvägen är fortfarande hela återstoden.

---

## 2. Vad vi har i dag, mätt

Räknat ur `site/src/data/*.json` 2026-08-30:

| Kommun | Verksamheter |
|---|---:|
| Stockholm | 8 520 |
| Uppsala | 1 854 |
| Linköping | 1 246 |
| Örebro | 1 233 |
| Jönköping | 1 114 |
| Karlstad | 694 |
| Borgholm | 406 |
| Höganäs | 316 |
| Oskarshamn | 239 |
| Kristinehamn | 170 |
| Lomma | 153 |
| Svenljunga | 99 |
| **Summa** | **16 044** |

Talet 16 047 i uppdraget är alltså tre för högt. Skillnaden är inte utredd
och är sannolikt en äldre körning.

Mätt mot Livsmedelsverkets register (`pipeline/data/kommunregister.csv`,
92 746 anläggningar) bär de tolv 17 459 anläggningar, alltså 18,8 procent.

---

## 3. Dataportal.se, systematiskt

### 3.1 Så här söktes det, och det går att göra om

Sveriges dataportal har inget CKAN-API. Den kör EntryStore, och sökningen
ligger på:

    https://admin.dataportal.se/store/search?type=solr&query=all:<term>&limit=100&offset=<n>

SPARQL-endpointen `https://admin.dataportal.se/sparql` svarar **404** och
finns inte. Sökskriptet paginerar och plattar ut DCAT-grafen till titel,
utgivare, licens, format och distributions-URL.

Trettiosju sökningar kördes i två omgångar. Antal träffar per term:

| Term | Träffar | Term | Träffar |
|---|---:|---|---:|
| `livsmedelskontroll` | 10 | `livsmedelsinspektioner` | 7 |
| `livsmedelskontroller` | 10 | `livsmedelsverksamheter` | 6 |
| `livsmedel` | 69 | `livsmedelsanläggningar` | 1 |
| `title:livsmedel` | 127 | `livsmedelstillsyn` | 1 |
| `Sambruk` | 13 | `inspektionsresultat` | 1 |
| `hälsoskydd` | 16 | `NSÖD` | 2 |
| `kontrollresultat` | **0** | `smiley` | **0** |
| `kontrollrapport` | **0** | `matkontroll` | **0** |

Termen `miljö- och hälsoskydd` tokeniseras till en ELLER-fråga och ger
19 851 träffar. Den är därför oanvändbar som filter och sorterades bort på
titel och beskrivning i stället.

Andra omgången sökte på systemnamn och angränsande ord i stället för på
livsmedel: `inspektion`, `inspektioner`, `tillsyn`, `miljötillsyn`,
`tillsynsobjekt`, `restauranger`, `serveringstillstånd`, `hygienisk`,
`kontrollmyndighet`, `Ecos`, `Castor`, `Miljöreda`, `livsmedelskoll`,
`matkoll`. Den gav **noll nya bestånd**. Det är svepets starkaste negativ:
även när man söker på verksamhetssystemen i stället för på ämnet finns
ingenting mer.

19 742 unika poster hämtades. Efter filtrering på titel, beskrivning och
nyckelord återstår **22 poster** som nämner livsmedelskontroll,
livsmedelsinspektion, livsmedelsanläggning eller kontrollresultat.

### 3.2 Varje träff, och vad den är

| # | Titel | Utgivare | Vad det faktiskt är | Värde |
|---|---|---|---|---|
| 1 | Livsmedelskontroller | Linköpings kommun | **Kontrolldata per verksamhet.** Redan inläst | Inget nytt |
| 2 | Livsmedelsverksamheter | Göteborgs Stad | **Anläggningslista, CC0.** Se 3.3 | Grupp C |
| 3 | Tillsynsverksamheter - Livsmedel | Stockholms stad | Ecos 2, veckovis. Redan inläst via annan väg | Inget nytt |
| 4 | Restauranger med serveringstillstånd | Göteborgs Stad | Alkoholtillstånd, CC0. Se 3.4 | Sidokälla |
| 5 | Livsmedelskontroller som öppna data, specifikation | Sambruk | **NSÖD-specen själv.** Se avsnitt 4 | Format |
| 6 | Specifikation för Livsmedelsinspektioner | Sambruk | Dokumentation på GitHub | Format |
| 7 | Vägledning Livsmedelsinspektioner | NSÖD | Hur kommuner *bör* publicera | Format |
| 8 | JSON-exempel Livsmedelsinspektioner | NSÖD | Exempelfil | Format |
| 9 | DCAT-AP-SE | NSÖD | Metadatarekommendation | Format |
| 10 | Livsmedelsinspektioner, steg för att publicera data | NSÖD | **Uppföljningsfilen.** Se nedan | Bevis |
| 11 | Kodverk för riskklassning | Livsmedelsverket | CC0, kodverk för riskklass | Sidokälla |
| 12 | API Riskklassning kodverk | Livsmedelsverket | Samma, som API | Sidokälla |
| 13 | Information från Livsmedelsverket | Stockholms stad | Länk till Kontrollwiki | Inget |
| 14 till 22 | Företagsklimat Insikt (7 st) och Kolada-mått | SKR och Kolada | **Enkätindex per kommun**, inte per verksamhet | Inget |

**Nolltalet som betyder mest:** ingen av de 290 kommunerna utom Linköping,
Göteborg och Stockholm har en enda datamängd om livsmedelskontroll på
Sveriges dataportal.

**Uppföljningsfilen (rad 10) är svepets viktigaste enskilda fynd om NSÖD.**
`https://editera.dataportal.se/store/41/resource/13` svarar HTTP 200 med
24 506 byte XLSX. Den är NSÖD:s eget verktyg för att följa deltagande
kommuners publiceringsarbete. Fyra blad: Instruktioner, Status, Data,
Frågor. Bladet Status har en enda kommun, **LUND**, och räknaren står på:

    Klar          0
    Påbörjad      0
    Ej påbörjad  13
    Progress      0

Frågebladet är tomt. Ingen kommun har alltså någonsin fyllt i verktyget.
Det förklarar varför grupp A är tom, och det är ett starkare belägg än
frånvaron av datamängder, eftersom det är projektets egen dokumentation.

### 3.3 Göteborg, verifierad

| Fält | Mätning |
|---|---|
| Datamängd | Livsmedelsverksamheter, `catalog.goteborg.se/store/6/resource/35` |
| CSV | `https://catalog.goteborg.se/store/6/resource/57478` |
| JSON | `https://catalog.goteborg.se/rowstore/dataset/3bf3fca5-617d-4687-ac8d-c3ab5b17a4b6` |
| Svar | **HTTP 200**, 670 635 byte, `text/csv` |
| Rader | **5 076** datarader, 5 063 unika par av namn och adress, 4 873 unika namn |
| Färskhet | `Last-Modified: Sat, 29 Aug 2026 16:31:15 GMT`, alltså **i går** |
| Uppdateringstakt | `frequency/DAILY` i DCAT, och headern bekräftar den |
| **Licens** | **`http://creativecommons.org/publicdomain/zero/1.0/`**, alltså CC0 1.0 |
| Fält | `namn;adress;postnummer;ort;typ;y_sweref991200;x_sweref991200;lat;lon` |
| Koordinater | **Ja**, WGS84 och SWEREF 99 12 00. 184 rader av 5 076 saknar dem |
| Org.nr | **Nej** |
| **Kontrollresultat** | **Nej. Inte ett fält, inte en kolumn** |
| Följer NSÖD | Nej, eget format. Inget av spec-namnen finns |

Källa är Miljöförvaltningens verksamhetssystem **Miljöreda**. Fältet `typ`
har 47 värden, de största RESTAURANG 1 599, LIVSMEDELSBUTIK 685, KAFÉ 490,
tomt 291, FÖRSKOLA tillagning 265. Den taxonomin ligger nära den vi byggde i
`docs/prikko-filtrering-verksamhetstyp` och är i sig användbar.

JSON-varianten svarar `resultCount: 4786`, alltså 290 färre än CSV:n.
Skillnaden är **overifierad** och bör kontrolleras innan någon bygger på
rowstore-vägen. CSV:n är den färskare av de två.

### 3.4 Göteborgs serveringstillstånd, en sidokälla värd att notera

`https://catalog.goteborg.se/store/6/resource/49543` svarar **HTTP 200**,
404 585 byte, 1 043 rader, CC0. Kolumnerna:

    recTillsynsobjektId;Namn;Besöksadress;strVerksamhetsutoevareNamn;
    Restaurangnummer;strVerksamhetNamn;Fakturaadress;TypAvTillstaand;
    ServeringTill;Alkoholdrycker;Serveringstyper;Serveringstider;Villkor;
    swereff991200_x;swereff991200_y;long;lat

Den bär **verksamhetsutövarens juridiska namn**, vilket
anläggningslistan inte gör. Det är precis den bryggan `docs/12_datapairing_och_orgnr.md`
saknar. Ingen kontrolldata, men den parar ihop 1 043 göteborgska
restauranger med ett bolagsnamn som går att slå mot org.nr.

---

## 4. NSÖD-formatet, för den dag någon börjar följa det

Specen ligger på `https://sambruk.github.io/livsmedel/` (HTTP 200,
8 242 byte) och heter v2.0. Den tekniska fältlistan finns som XLSX på
`/livsmedel/assets/Livsmedelsinspektioner - Teknisk specifikation v2.xlsx`.
JSON-exemplet, ordagrant hämtat 2026-08-30, har den här formen:

    { lang, generator, inspecOrg{ name, id, sweref99local },
      facilities[ organizationNumber, name, type[], expClass, riskClass,
                  inspecTime, idLocal, idNational, active, created, modified,
                  address{ streetAddress, postalCode, locality, region, country },
                  location{ wgs84, sweref99, sweref99local } ],
      inspections[ idLocal, idNational, prenotified, type,
                   inspectionPoints{ passed[], remark[] },
                   assessment, ownerComment, date, modified ] }

Formatet är bra för oss. Det har **org.nr** (`organizationNumber`),
**koordinater i tre system**, **riskklass**, och en bedömning per kontroll
med godkända och anmärkta kontrollpunkter var för sig. Exemplet är skrivet
med Malmö stad och `generator: "Castor"`, men det är just ett exempel och
inte ett belägg för att Malmö publicerar. Malmö gör inte det (avsnitt 5.1).

**Slutsatsen för kodbygget:** en generell NSÖD-läsare i
`pipeline/prikko/sources/` skulle i dag ha **noll** källor att läsa. Varje
adapter vi har är egenskriven, och det är rätt beslut så länge grupp A är
tom. Den dagen ett svar på ett begäranbrev kommer i NSÖD-format är det
däremot den läsare som ska byggas först, eftersom specen är den enda som
flera myndigheter kan tänkas landa på samtidigt.

---

## 5. Utanför dataportal.se

### 5.1 De tjugo som uppdraget namngav

För varje kommun lästes `robots.txt`, därifrån sitemapen, därifrån
sitemapindexets barn, och alla URL:er filtrerades på
`livsmedel|smiley|matkontroll|hygien` och sedan på
`resultat|kontroll|inspektion|tillsyn|rapport`.

| Kommun | Sidor i sitemap | Livsmedelsträffar | Utfall |
|---|---:|---:|---|
| Göteborg | 44 268 | 0 | Publicerar via katalogen, inte via webben. Se 3.3 |
| Malmö | 9 419 | 66 | **Nej.** Se nedan |
| Helsingborg | 3 668 | 7 | **Nej.** Smiley borttagen. Se nedan |
| Norrköping | 10 390 | 22 | **Ja, av misstag.** Se avsnitt 6 |
| Lund | 8 414 | 19 | Nej. Bara regler och tillstånd |
| Umeå | 23 714 | 41 | Nej. Bara hälsoskydd och gymnasieprogram |
| Gävle | 5 049 | 9 | Nej |
| Borås | 24 982 | 56 | **Nej.** Se nedan |
| Södertälje | 7 703 | 44 | Nej. Bara två pressmeddelanden från 2018 |
| Eskilstuna | 3 536 | 8 | Nej. En nyhet om en stängd butik |
| Halmstad | 4 044 | 41 | Nej |
| Växjö | 14 360 | 9 | Nej. Bara taxan |
| Karlskrona | 2 134 | 8 | Nej. Bara taxa, registrering, gymnasieprogram |
| Sundsvall | 9 725 | 25 | Nej |
| Östersund | 17 655 | 11 | Nej. Två PDF:er om kontrollen som helhet, 2020 |
| Luleå | 14 592 | 16 | Nej. Bara taxan |
| Trollhättan | 3 230 | 20 | Nej. En nyhet om NKI-placering |
| Kalmar | 22 206 | 58 | Nej. Bara taxa och en pressbild |
| Falun | 24 896 | 25 | Nej |
| Nyköping | 0 | 0 | `sitemap_index.xml` svarar **404**. Overifierad |

Summa lästa sidor: **249 995**. Nyköping är den enda av de tjugo som inte
gick att avfärda med sitemapmetoden, eftersom sitemapen som `robots.txt`
pekar ut inte finns.

**Malmö.** Sidan `Livsmedelsrapporter.html` svarar HTTP 200 med 100 544 byte
och ser lovande ut på namnet. Den är det inte. Texten säger att förvaltningen
"från år 1991 fram till 2015 gjordes över 150 rapporter" om projekt som
julbord, salladsbarer och falafelställen. Det är tematiska projektrapporter,
inte resultat per verksamhet. Registret har Malmö som `sammanfattning`, och
det stämmer.

**Helsingborg.** Sidan `smileysymbolen/` svarar HTTP 200, och rubriken är
"Smiley-märkningen tas bort i Helsingborg". Märkningen fanns sedan 2004 och
togs bort **1 januari 2023**, med motiveringen att den inte fick önskad
effekt och inte gick att förena med Livsmedelsverkets nya
riskklassningsmodell. Sidan uppdaterades 4 juli 2024. Helsingborg är alltså ett definitivt
nej, och det är den enda av de tjugo där kommunen själv skriver ut varför.

**Borås.** Sidan `livsmedelsinspektioner...html` lever, HTTP 200, senast
ändrad **19 mars 2026**. Den innehåller inga resultat. Den säger i stället
att den som vill ta del av inspektionerna är välkommen att kontakta
Miljöförvaltningen. Det bekräftar `docs/20` avsnitt 2.1: Borås tog ned sina
inspektionssidor, och hänvisar nu uttryckligen till begäranvägen. Ett brev
till Borås har alltså en sida på kommunens egen webbplats som stöd.

### 5.2 Egna öppna data-portaler, 38 kommuner

Sju värdnamnsmönster slogs upp för 38 kommuner:
`oppnadata.<k>.se`, `opendata.<k>.se`, `data.<k>.se`, `catalog.<k>.se`,
`oppendata.<k>.se`, `<k>.entryscape.net`, `oppnadata.<k>.com`.

**23 värdnamn hos 20 kommuner** svarade: Göteborg (två), Malmö, Umeå, Gävle,
Borås, Södertälje, Eskilstuna, Sundsvall, Trollhättan, Kalmar, Västerås,
Solna, Nacka, Tyresö, Haninge (två), Botkyrka, Sollentuna, Mölndal (två),
Partille, Sigtuna. Var och en frågades på `all:livsmedel` mot sitt eget
EntryStore eller rowstore.

**Exakt en portal har en livsmedelsdatamängd: Göteborgs.**

Södertälje gav elva träffar, men samtliga är inköpsstatistik
("Livsmedelsinköp Telgebolagen 2026", "Transportdata livsmedel") och en
handlar om skolmatens vikt, inte om kontroll. Malmös portal svarade 33 637
byte utan en enda livsmedelsträff.

### 5.3 Vad som inte gjordes

Webbsökning kunde inte användas: sessionens sökbudget var slut vid uppdragets
början (200 av 200 anrop). Hela svepet vilar därför på direktanrop, vilket är
det bevisvärde projektet ändå kräver, men det betyder att en kommun som bara
går att hitta via en nyhetsartikel kan ha missats. Sitemapsvepet och
portalsvepet täcker den luckan för de 20 namngivna kommunerna men inte för
de övriga 270.

ArcGIS Online genomsöktes inte om, eftersom R9 gjorde det uttömmande
2026-08-03 och fann exakt fyra svenska livsmedelskällor, alla redan inlästa.

---

## 6. Norrköping: beståndet som ligger kvar

Det här är svepets enda nya kontrolldata, och det förtjänar egen plats.

### 6.1 Hur det hittades

R9 slog fast att söksidan är död men att "infrastrukturen ligger kvar". Det
som saknades var filerna. De ligger i Sitevisions filarkiv och **finns med i
kommunens sitemap**, vilket gör att de går att hitta utan att gissa. Tio
träffar på `livsmedelskontroll` i sitemapen, varav sju är appens
front-endfiler (`.js`, `.vm`, `.css`) och tre är data.

`Livsmedelskontrollen.js` är ett Sitevision-serverskript som läser en
XML-mapp via `scriptVariables.xmlMapp` och `scriptVariables.filNamn`.
Mallen `Livsmedelskontrollen.vm` refererar `$insp.name`, `$insp.address`,
`$insp.dnrs`, `$dnr.controls`, `$dnr.date`, `$dnr.deviant` och
`$dnr.control_type`. Fältnamnen sa vad som skulle finnas i filen, och
filen fanns.

### 6.2 De tre filerna, verifierade

| Fil | Svar | Storlek | Senast ändrad |
|---|---|---:|---|
| `ecos.xml` | **HTTP 200** | 7 434 345 byte | **2024-03-17 19:44:35 GMT** |
| `out_Ecos.xml` | **HTTP 200** | 3 527 868 byte | 2017 (ur URL:en) |
| `extens.xml` | HTTP 200 | 249 709 byte | Skolregister, **inte livsmedel** |

Full URL till den levande:

    https://norrkoping.se/download/18.5ff942e1184b3f255e22527f/1710704675524/ecos.xml

Anropet utan tidsstämpel omdirigerar till samma tidsstämpel, alltså finns
ingen nyare version bakom samma nod.

### 6.3 Vad `ecos.xml` innehåller

| Mått | Tal |
|---|---:|
| Inspektioner | **4 451** |
| Unika verksamheter (namn och besöksadress) | **1 022** |
| Varav med kontroll 2021 eller senare | 1 005 |
| Median inspektioner per verksamhet | 4 |
| Kontrollpunkter totalt | **25 083** |
| Varav med avvikelse | 2 309 |
| Datumintervall | 2018-08-31 till **2024-01-03** |
| Bedömning "Godtagbar" | 3 289 |
| Bedömning "Ej godtagbar" | 1 162 |

Strukturen, ordagrant ur filen:

    <insp>
      <inspid>ecfa75cb-...</inspid>
      <dnr>2023-6194</dnr>
      <namn>Valhallavägen 1a Äldreboende</namn>
      <besadr>Valhallavägen 1A</besadr>
      <hdatum>2024-01-03</hdatum>
      <anmald>Oanmäld</anmald>
      <bedomning>Godtagbar</bedomning>
      <kontroller>
        <kontroll>
          <status>Utan avvikelse</status>
          <chklistrubrik_text>Grundförutsättningar, hygien</chklistrubrik_text>
          <kontrollpunkt>Upprätthållande av kylkedjan och ...</kontrollpunkt>
        </kontroll>
      </kontroller>
    </insp>

| Fråga | Svar |
|---|---|
| Kontrollresultat | **Ja**, både samlad bedömning och per kontrollpunkt |
| Avvikelser specificerade | **Ja**, med rubrik och kontrollpunkt i klartext |
| Historik | **Ja**, i median 4 inspektioner per verksamhet |
| Anmäld eller oanmäld | Ja |
| Diarienummer | Ja |
| Koordinater | **Nej.** Bara besöksadress |
| Org.nr | **Nej** |
| Följer NSÖD | Nej. Eget Ecos-utdrag |
| **Licens** | **Ingen angiven någonstans** |

Arkivfilen `out_Ecos.xml` täcker 2009-05-19 till 2017-04-11 med 5 611
inspektioner på 1 131 verksamheter, men bara 8 265 kontrollpunkter och
inget `bedomning`-fält. Den har historiskt intresse och inget mer.

### 6.4 Varför vi ändå inte hämtar den i dag

Tre skäl, och det första räcker.

1. **Ingen licens.** Filen ligger kvar i ett filarkiv vars sida är
   nedmonterad. Ingen sida säger vad som gäller för vidareutnyttjande. Enligt
   `docs/prikko-licens-lasas-som-den-star` läser vi villkor som de står, och
   här står ingenting. Det är inte samma sak som ett ja.
2. **Den är två och ett halvt år gammal.** Senaste kontrollen 2024-01-03.
   Sajten säger till besökaren vad som gäller nu. Att visa Norrköping med
   2023 års kontroller vore ett synligt fel, och `docs/prikko-slack-trasigt-direkt`
   säger att sådant släcks och inte publiceras.
3. **Den saknar koordinater och org.nr.** Bägge går att lösa med
   `pipeline/geocode.py` och belägenhetsadresserna, men det är arbete som
   inte ska göras innan de två första punkterna är avklarade.

**Vad fyndet är värt i stället:** brevet till Norrköping kan nu be om exakt
rätt sak. Inte "har ni öppna data", utan "ni har ett Ecos-utdrag med
fälten inspid, dnr, namn, besadr, hdatum, anmald, bedomning och kontroller,
som senast producerades 2024-03-17. Vi ber om en aktuell körning av samma
utdrag, och om besked om villkoren för vidareutnyttjande." Det är den sortens
brev en handläggare kan säga ja till samma dag, eftersom exporten redan finns
i systemet och någon har kört den förut.

---

## 7. Vad det är värt, räknat

### 7.1 Sidor och nålar

| Källa | Verksamheter | Nytt beståndstal | Ökning |
|---|---:|---:|---:|
| I dag | 16 044 | 16 044 | |
| Norrköping (grupp B) | 1 022 | 17 066 | **+6,4 %** |
| Göteborg (grupp C) | 5 076 | 21 120 | **+31,6 %** |
| Bägge | 6 098 | **22 142** | **+38,0 %** |

### 7.2 Andel av landets anläggningar

Räknat mot registrets 92 746, där de tolv inlästa bär 17 459:

| Läge | Anläggningar | Andel |
|---|---:|---:|
| I dag | 17 459 | 18,8 % |
| Med Norrköping | 18 701 | 20,2 % |
| Med Göteborg | 22 877 | 24,7 % |
| Med bägge | 24 119 | **26,0 %** |

Göteborg ensam är alltså värd mer i täckning än allt utom Stockholm. Det är
skälet att inte avfärda en anläggningslista helt, trots att den saknar
betyg.

### 7.3 Vad ett kontrollöst bestånd faktiskt kostar

Göteborgs 5 076 verksamheter skulle bli 5 076 sidor och 5 076 nålar där
bedömningsmärket står på "ingen bedömning". Det är en fjärdedel av sajten
utan det enda besökaren kom för. `docs/41_kontrast_pa_bedomningsmarket.md`
visar att vi redan har ett grått läge för just det, så det går tekniskt.
Frågan är om det ska göras, och den är ägarens. Två invändningar väger tungt:
det ändrar sajtens löfte från "vi visar betyget" till "vi visar var stället
ligger", och `docs/prikko-sidor-bara-for-seo` säger att en sida ska bära en
funktion. En sida utan betyg bär ingen.

Ett mellanläge finns: läsa in Göteborg som **adress- och typunderlag** utan
egna sidor, och använda det till kartan, till kategorifiltret och till
org.nr-parningen via serveringstillståndsfilen. Då kostar det inga tomma
sidor och ger ändå 5 076 verifierade adresser i landets näst största stad.
Det är den vägen jag skulle rekommendera, men det är **inte utrett** hur den
förhåller sig till `docs/23_rikskartan.md`.

---

## 8. Rangordningen: vad som kopplas in först

### Först: Norrköping, men som ett brev och inte som en hämtare

**Varför först.** Det är den enda nya källan med kontrollresultat i hela
svepet, den är rikare än flera av de tolv vi har (avvikelser i klartext,
median fyra inspektioner per verksamhet, anmäld eller oanmäld), och vi vet nu
exakt vilket utdrag ur Ecos som ska begäras. 1 022 verksamheter, 1,34 procent
av landets anläggningar.

**Vad som ska göras.** Ett brev via `python3 pipeline/begaran.py skriv` med
den tekniska specifikationen i avsnitt 6.3 inklistrad, och två frågor:
en aktuell körning, och villkoren för vidareutnyttjande. Inte hämta filen.

### Andra: Göteborg, men först som ett beslut och sedan som kod

**Varför andra.** Störst av allt som återstår i landet efter Stockholm,
5,84 procent av anläggningarna, CC0 utan minsta tvetydighet, uppdaterad
dagligen och verifierat färsk i går. Ingen juridisk fråga behöver ställas
till någon. Den kan hämtas i dag.

**Varför inte först.** Den har inga kontrollresultat, och därmed hänger det
på ett produktbeslut som inte är fattat (avsnitt 7.3). Koden är billig, en
CSV med nio kolumner och färdiga WGS84-koordinater, kanske en halvdag. Det
dyra är beslutet.

**Vad som ska göras.** Ägaren svarar på frågan i 7.3. Blir svaret
"underlag men inga sidor" är det ett litet och riskfritt bygge. Blir svaret
"egna sidor" bör ett brev till Göteborg om kontrollresultaten gå först, så
att sidorna föds med betyg i stället för att stå grå i väntan.

### Tredje: Borås, för att kommunen själv pekar på brevet

**Varför tredje.** Ingen data att hämta, men den bästa mottagaren i landet
just nu. Kommunens egen sida, uppdaterad 19 mars 2026, säger att den som
vill ta del av inspektionerna ska kontakta Miljöförvaltningen. Det är en
inbjudan, skriven av dem, med adress och telefonnummer på samma sida. 931
anläggningar. Ett brev som citerar deras egen mening är svårt att lägga i
högen.

### Sedan, i tur och ordning

4. **Nyköping**, 584 anläggningar. Den enda av de tjugo som svepet inte
   kunde avfärda, eftersom sitemapen som `robots.txt` pekar ut svarar 404.
   Billig att stänga: en manuell titt på webbplatsen.
5. **Lund**, 1 051 anläggningar. Den enda kommun som någonsin öppnade
   NSÖD:s uppföljningsverktyg. Att de började och slutade är ett skäl att
   fråga, inte att avstå. Frågan i brevet bör vara vad som hände.
6. **Malmö**, 3 150 anläggningar, status `sammanfattning`. Stort, och de har
   bevisligen förmågan att sammanställa. NSÖD:s eget JSON-exempel är
   dessutom skrivet med Malmö stad och `generator: "Castor"`, vilket gör det
   **sannolikt men overifierat** att Malmö kör Castor. Om det stämmer är
   Malmö den mest sannolika kandidaten i landet för ett riktigt
   NSÖD-utlämnande, och den frågan är värd att ställa rakt ut i brevet.

---

## 9. Det som inte är verifierat

| Fråga | Läge |
|---|---|
| Nyköpings publicering | Sitemapen svarar 404. Enda av de tjugo som inte gick att avfärda |
| Göteborgs JSON mot CSV | 4 786 mot 5 076 rader. Skillnaden är inte utredd |
| Norrköpings licens | Ingen sida säger något. Bara ett brev kan svara |
| Finns nyare `ecos.xml` | Nod utan tidsstämpel ger samma fil. Andra noder inte genomsökta |
| Malmö kör Castor | Slutsats dragen ur ett exempel i specen. **Spekulation** |
| De 270 kommuner uppdraget inte namngav | Endast täckta via dataportal.se och portalsvepet, inte via sitemap |
| Webbsökning | Kunde inte köras, budgeten var slut. Se 5.3 |
| Stockholms datamängd på `resources.stockholm.se` | Anropet svarade inte. Saknar betydelse, Stockholm är redan inläst |

---

## 10. Så här körs svepet om

Skripten ligger i sessionens scratchpad och är inte incheckade, eftersom de
är engångsverktyg. De tre stegen är:

1. **Dataportal.se.** Paginera
   `https://admin.dataportal.se/store/search?type=solr&query=all:<term>` över
   termlistan i 3.1, platta ut DCAT-grafen, filtrera på titel, beskrivning
   och nyckelord.
2. **Portalsvep.** Slå upp de sju värdnamnsmönstren i 5.2 för varje kommun,
   fråga varje levande portal på `all:livsmedel`.
3. **Sitemapsvep.** `robots.txt` till sitemap till sitemapindex, filtrera på
   `livsmedel|smiley|matkontroll|hygien`, sedan på
   `resultat|kontroll|inspektion|tillsyn|rapport`.

Steg 3 är det som hittade Norrköping, och det hittade det för att kommunens
filarkiv indexeras. Det är svepets metodlärdom: **leta efter datafilen och
inte efter sidan.** En nedlagd tjänst tar bort sidan och glömmer filen.
