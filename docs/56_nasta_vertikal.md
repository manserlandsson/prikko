# 56. Nästa vertikal: vad av maskinen som går att lyfta, och vart

**Datum:** 2026-08-31
**Beställning:** `docs/45_entreprenorslistan.md` pelare F. Bibeln kallar
slutmålet "förtroendelagret på svensk offentlig data" och räknar upp
äldreomsorg och andra inspektioner som nästa steg. Det hade aldrig utretts.
**Metod, kod:** klassning rad för rad över 87 686 rader i `pipeline/`,
`site/src/lib/` och `site/src/pages/`, körd 2026-08-31.
**Metod, efterfrågan:** identisk med `docs/26` §2 och `docs/30` §2, alltså
Googles förslagsslutpunkt med stamkontroll. 203 frågor, 2026-08-31. Se §7.
**Metod, källor:** varje externt tal är hämtat mot källans egen adress med
datum i texten. Det som inte gick att belägga står i §14.
**Ingenting i `site/` eller `pipeline/` är rört.**

---

## 1. Slutsatsen först

Sju slutsatser, i fallande ordning av vad de betyder.

1. **Maskinen går att lyfta, men den ska inte lyftas till en andra vertikal.
   Den ska breddas inom den första.** De objekt som bäst uppfyller
   beställningens tre krav ligger hos samma nämnd, i samma ärendesystem och
   under samma brev som livsmedelskontrollen: **förskolor, skolor, bassängbad
   och hygienlokaler är anmälningspliktiga till kommunens miljönämnd enligt
   38 § förordningen (1998:899)**. Det är inte en ny vertikal. Det är ett
   stycke till i ett brev vi redan skriver. §10.
2. **Efterfrågan avgör ingenting, och det var en överraskning.** 149 av 203
   mätta fraser gav träff. Livsmedel hamnar på elfte plats av tretton, och
   fyra kandidater mäter högre än den vertikal vi valde. På den här
   mätningens upplösning finns efterfrågan överallt. Egenskap tre skiljer
   alltså inte kandidaterna åt, och beslutet måste tas på de två andra. §8.
3. **De tre egenskaperna är i praktiken motsatta varandra.** Där datan är
   publicerad per objekt är huvudmannen en enda, och då finns ingen vallgrav.
   Där huvudmännen är många är datan inte publicerad. Livsmedel är det enda
   fall vi hittat där alla tre sammanfaller, och det är en tillfällighet och
   inte ett mönster som går att leta rätt på igen. §9.
4. **Skolan är det tydligaste exemplet, och den ska inte byggas.**
   Skolverket publicerar redan **5 115 grundskolesidor och 1 479
   gymnasiesidor** i sina egna sitemaps, en per enhet, med betyg och
   provresultat (hämtat 2026-08-31). Livsmedelsverket samlar in
   kontrolluppgifterna men publicerar dem inte. Skillnaden mellan de två
   vertikalerna är inte datan, det är att staten redan gjort jobbet i den
   ena. §9.2.
5. **Förskolan är motsatsen, och den är fyndet.** Riksrevisionen skriver
   ordagrant i RiR 2025:15: **"Det saknas ett aktuellt register över vilka
   förskolor som finns i Sverige."** Regeringen avstod från åtgärd i
   november 2025 och utredningen som skulle lösa det levererade i juni 2026
   utan att nämna registret. **Vi har redan 1 604 av landets drygt 8 850
   förskolor med namn, adress och koordinat, alltså 18,1 procent, ur tolv
   kommuner och som en biprodukt av att förskolekök är
   livsmedelsanläggningar.** Vi bygger oavsiktligt det register staten säger
   sig sakna. §10.
6. **Bedömningsmodellen är inte hindret, men dess indata är det, och det
   gäller varje kandidat utom en.** Modellen ärver myndighetens eget
   heltal och skärper det på ett mönster, se §6. IVO, Skolinspektionen och
   den kommunala hälsoskyddstillsynen levererar alla fritext utan nationell
   kodlista. Livsmedelskontrollens jämförbarhet vilar på Livsmedelsverkets
   kontrollområden, och **ingen av kandidaterna har någon motsvarighet**.
   Det är den enda genuint nya komponent en breddning kräver. §9.
7. **Ordningen mellan det här dokumentet och `docs/54` är inte en konflikt.**
   `docs/54` §9.2 säger att de närmaste sex månaderna går till täckning och
   att ingenting säljs. Rekommendationen här kostar inga sex månader, den
   kostar ett stycke i det brev täckningsarbetet ändå skickar. De två går
   ihop, och §13 skriver ut när var sak gäller.

**Rekommendationen i tre rader står i §13.4.**

---

## 1b. Kodinventeringen, sammanfattad

**Ungefär hälften av maskinen är generisk "offentlig kontrolldata till
konsumentsajt".** Mätt rad för rad över 87 686 rader:

| Klass | Rader | Andel |
|---|---:|---:|
| **GENERISK**, lyfts oförändrad | 43 434 | 49,5 % |
| **PARAMETRISERBAR**, lyfts med konfiguration | 15 768 | 18,0 % |
| **LIVSMEDELSSPECIFIK**, skrivs om | 16 403 | 18,7 % |
| **KÄLLSPECIFIK**, kastas | 12 081 | 13,8 % |

`pipeline/prikko/grading.py` är 418 rader varav 173 är prosa i modulhuvudet.
Den rena beslutslogiken är tre funktioner och **ungefär 90 rader**.

**Två varningar om täckningen.** `site/src/components/`, 81 filer och 37 551
rader, ingick inte i inventeringen och är sannolikt det mest
livsmedelsfärgade lagret efter `pages/`. `pipeline/tests/`, 46 filer och
15 291 rader, är inte heller medräknat, och 13 av 46 testfiler är per kommun.

**Ett tal som inventeringen inte fångade och som hör hit.** Det dyraste lagret
är inte kod. `site/src/` bär **24 MDX-artiklar om 31 570 ord**, alla om
livsmedel, och projektets egen regel förbjuder AI-skriven text som innehåll.
En breddning som kräver en egen redaktionell yta kräver alltså ungefär lika
många ord skrivna för hand. Det är skälet till att §13 rekommenderar en
breddning inom samma sajt och inte en andra sajt.

---

## 2. Det som lyfts oförändrat

Hela geokodningen med sin cache på 649 kB och SWEREF99-projektionerna, som
behövs för vilken svensk kommunal geodatakälla som helst. Hela kartlagret
inklusive den egenskrivna PMTiles-skrivaren. Hela söklagret med vikning och
avståndspass. Områdesmaskineriet mot OSM och SCB RegSO. Sjögränsen.
Närhetsmåtten. Bildpipelinen. Öppettider och kontaktuppgifter ur OSM. Hela
community-, konto- och modereringslagret. Brevkodsmaskineriet.
Rörelsespårningen. Slugifiering, paginering, URL-bygge, sitemap,
juridiksidorna, maskoten.

**Kartan är den mest återanvändbara delen av hela projektet.** 1 585 rader med
sammanlagt tre träffar på ett livsmedelsord, alla i kommentarer.
`lib/pmtiles.ts` är en egenskriven PMTiles-skrivare med noll domänord.
`lib/kartrutor.ts` har exakt två rader som binder den till verksamheterna:
bedömningen till ett index, och utmärkelsen till en flagga. Bytet är att
ersätta `MAP_VERDICTS` och ansiktet.

**Söklagret lyfts i stort sett oförändrat**, 1 584 rader. Radformatet är namn,
adress, slug, kommunindex och bedömningsindex, och bara det sista är
domänbundet. Det är ett heltal.

**Trettioen av 66 filer i `site/src/lib/` har noll träffar** på något
livsmedelsord.

## 3. Det som lyfts med konfiguration

Kategoritabellen, som är byggd som en tabell just för detta och säger det
uttryckligen i sitt modulhuvud. Bedömningsansiktets fyra lägen. Märket och
dekalen. Kommunregistret. Brevmallarna. Typerna i `db.ts`. Kedjeregistret.
Utmärkelsetrösklarna.

**Kommunregistret är den bästa återanvändningen räknat på nytta per rad.**
290 kommuner med verifierade mottagaradresser och namngiven källa per fält.
**Exakt ett fält är livsmedelsbundet**, antalet anläggningar. Allt annat är
ren offentlig-Sverige-infrastruktur: kommunkoder, län, invånare ur Kolada,
e-postadresser hämtade ur kommunernas egna sidor, och strukturen som kodar att
290 kommuner bara har 249 kontrollmyndigheter.

## 4. Det som skrivs om

Verksamhetssidan, startsidan, metodiksidan, de åtta rapportsidorna,
matsnusklistan, `punktstatistik.ts`, `rapporter.ts`, områdestabellen i
`data.ts`, matkategorierna, anmälningsformulären, och områdesviktningen i
`grading.py`.

**Tre riktiga knutar, och resten är etiketter.** Fördelningen är starkt
högersvansad: fem filer står för 279 av 908 träffar, och medianfilen med en
träff har två. De tre som sitter djupt:

1. `lib/data.ts` rad 159 till 181, tolv livsmedelsområden med
   konsumentförklaringar, som speglar samma tabell i `grading.py`. Två
   ställen, en sanning, måste bytas ihop.
2. `lib/punktstatistik.ts` och `lib/rapporter.ts`, 2 927 rader som räknar
   kontrollpunkter per lagstiftningsområde. **Mot fritextbeslut finns
   ingenting att räkna.** Den delen skrivs om från grunden eller utgår.
3. `pages/metodik.astro`, 1 308 rader, som per konvention är låst till
   `grading.py` i samma commit.

Schemat är däremot nästan rent: kolumnerna heter `establishments`,
`inspections`, `control_areas` och `assessments`, inte `restaurants` eller
`hygiene_checks`.

## 5. Det som kastas, och varför det inte gör ont

Alla fjorton kommunhämtare, 12 081 rader. De ersätts inte, och det är
poängen: **IVO och Skolinspektionen är nationella myndigheter och inte 290
kommuner.** I stället för fjorton skrapor mot fjorton kommuner blir det en
eller två mot ett eller två register. Det är dramatiskt mycket mindre arbete,
inte mer.

**Ett arkitekturfynd på vägen.** Det finns ingen basklass och ingen delad
hämtare: sökning efter `class Base`, `BaseFetcher` och `abstractmethod` i hela
pipeline ger noll träffar. CLI-skripten är till 45 till 56 procent ordagrant
identiska med varandra, och `USER_AGENT` deklareras i tjugo av tjugo filer,
`class UnknownSourceValue` i fjorton av arton, `normalize_establishment` i
fjorton. Parsermodulerna är däremot i praktiken hundra procent unika, vilket
är rimligt.

Per kommun: ungefär 675 rader, varav 120 är upprepning och 555 är källunik
logik. En ny vertikal skriver om de 120 raderna från grunden. Det är en dags
arbete och inte en risk.

## 6. Bedömningsmodellen, i detalj

Den bygger på fem saker: en treställig heltalsskala ur Sambruks specifikation,
kontrolltypen, ett mönster i stället för en etikett, Livsmedelsverkets
lagstiftningsområden, och två tal, alltså fönstret på fem år och historikdjupet
tre.

Modellen är i praktiken: **ta myndighetens egen tregradiga slutsats om senaste
tillsynen, skärp den ett steg om mönstret visar att problemet överlevt, och ge
en märkning vid tre rena i rad.**

**Vad som passar en fritextvertikal:** skärpningsregeln, färskhetsfönstret,
historikmärkningen, vägran att gissa, versioneringen, och renheten. IVO har
dessutom riktiga motsvarigheter till uppföljning och klagomål, och
Skolinspektionen har uppföljning av föreläggande. Skärpningsregeln skulle
fungera nästan ordagrant för båda.

**Vad som brister:** modellen har ingen egen bedömningsförmåga. Utfallen "inga
brister", "föreläggande", "föreläggande med vite" och "återkallelse" är
ordinala och skulle gå att mappa till tre nivåer, precis som varje hämtare
redan gör. **Men den mappningen är i dag hämtarens ansvar**, och för fritext
finns ingen hämtare som kan läsa den.

Bara ungefär fyrtio rader i `grading.py` är ordagrant livsmedel, alltså
områdesbokstäverna och uppslagstabellen med de 27 svenska områdesnamnen.

## 7. Marknadsdelen: metod, och varför den mätta efterfrågan inte avgör

Metoden är identisk med `docs/26` §2 och `docs/30` §2, så att utfallen går att
lägga bredvid varandra. Googles förslagsslutpunkt med `client=chrome`, `hl=sv`
och `gl=se`, och stamkontrollen ur `docs/30` §2.1, som självtestas mot de kända
utfallen "alternativ till maxxfan" och "restauranger stockholm" före varje
körning. **203 frågor i åtta omgångar, 2026-08-31.** Rådatan ligger i sessionens
scratchpad som `matning_2026-08-31.csv`.

Läsanvisningen är densamma och upprepas för att den avgör allt. Ett förslag är
ett positivt belägg för att frasen skrivs. Ett uteblivet förslag betyder att
frasen ligger under mätgolvet, inte att den är noll. Metoden ger ingen volym.

**Semrush prövades om och svarar fortfarande att kontot saknar API-enheter,
alltså exakt samma svar som `docs/26` fick. Google Trends svarar fortfarande
429.** Det finns därför inget volymtal i det här dokumentet heller, och det är
en verklig begränsning som ska sägas rakt ut i stället för gömmas.

Kalibreringen mot livsmedelsspåret gick igenom: `hygienbetyg` ger noll
träffande förslag av fyra, precis som `docs/26` §4.8 rapporterade, och
`restauranger stockholm` ger femton av femton.

## 8. Efterfrågan, mätt, och den är inte skiljelinjen

**149 av 203 frågor, alltså 73 procent, gav minst ett träffande förslag.**
Fördelat per kandidat:

| Kandidat | Frågor | Med träff | Andel | Starkaste frasen |
|---|---:|---:|---:|---|
| Vård och tandvård | 20 | 18 | 90 % | `vårdcentral omdöme` |
| Hantverk och mäklare | 9 | 8 | 89 % | `anmäla mäklare` |
| **Förskola** | 16 | 14 | **88 %** | `välja förskola` |
| Skola | 22 | 18 | 82 % | `välja skola` |
| Äldreomsorg | 32 | 25 | 78 % | `äldreboende stockholm` |
| Bilbesiktning | 9 | 7 | 78 % | `bilbesiktning priser` |
| Djur och veterinär | 11 | 8 | 73 % | `veterinär stockholm` |
| Hyresvärd och bostad | 7 | 5 | 71 % | `ovk besiktning` |
| Hygienlokaler | 22 | 15 | 68 % | `fotvård stockholm` |
| Hiss | 3 | 2 | 67 % | `hissbesiktning` |
| **Livsmedel, baslinjen** | 19 | 12 | **63 %** | `restauranger vasastan` |
| Miljötillsyn | 5 | 3 | 60 % | `miljötillsyn` |
| Brandskydd | 3 | 1 | 33 % | `brandskyddskontroll` |

**Det viktigaste i tabellen är att livsmedel ligger på elfte plats av tretton.**
Fyra kandidater mäter högre än den vertikal vi faktiskt valde.

Två förbehåll, och de ska stå före slutsatsen. Baslinjen innehåller med avsikt
`docs/26`:s kända nollor, alltså `hygienbetyg` och `smiley restaurang`, så
urvalet är inte rättvist mot livsmedel. Och andelen mäter bredd och inte volym.

Men slutsatsen håller ändå, och den är metodisk: **på den här mätningens
upplösning finns efterfrågan överallt, och metoden kan därför inte skilja
kandidaterna åt.** Egenskap tre i beställningen är uppfylld av nästan varje
kandidat vi prövat. Den avgör ingenting.

Två fynd ur mätningen är ändå värda att bära vidare.

**Områdesaxeln, som `docs/30` §5.1 mätte som starkast för livsmedel, håller för
flera kandidater.** `förskolor södermalm` ger fjorton träffande förslag av
femton, `skolor södermalm` åtta av åtta, `tandläkare södermalm` femton av
femton, `äldreboende hisingen` sju av nio. Sidtypen område gånger objekt, som
är den vi redan byggt, har alltså efterfrågan bakom sig i mer än en vertikal.

**Entitetsaxeln håller också.** Mönstret namn plus omdöme finns i bruk:
`kunskapsskolan uppsala omdöme`, `folktandvården fruängen omdöme`,
`anicura hässleholm omdöme`, `capio vårdcentral kungsholmen omdöme`. Det är
precis den form vår verksamhetssida svarar på.

Och ett fynd som pekar åt andra hållet: **det starkaste enskilda äckelordet i
hela mätningen tillhör ingen kandidat med data.** `vägglöss hotell` ger femton
av femton, med `vägglöss hotell sverige` och `vägglöss hotell stockholm` som
egna förslag. Ingen svensk myndighet publicerar något om vägglöss per hotell.

## 9. Datan och huvudmännen, kandidat för kandidat

Kolumnen som avgör är den tredje. Ett register över att objektet finns är inte
kontrolldata. Aggregerad statistik är inte kontrolldata. Bara ett resultat
knutet till det namngivna objektet är det vi behöver.

| Kandidat | Publikt resultat per objekt | Huvudmän | Objekt i Sverige |
|---|---|---:|---:|
| **Livsmedel**, vår egen | Nej nationellt, ja hos enstaka kommuner | 250 kontrollmyndigheter | ca 92 700 |
| Grundskola och gymnasium | **Ja**, Skolverket publicerar per enhet | **1** | 4 630 + gymnasier |
| **Förskola** | **Nej**, och register saknas helt | **290**, drygt 2 130 huvudmän | drygt 8 850 |
| Äldreomsorg och vård | Delvis, se §9.3 | 1 plus 290 plus 21 | se §9.3 |
| Hygienlokaler | **Nej**, noll dataset i landet | **ca 250**, samma som vår | drygt 8 000 |
| Djurskydd | **Nej**, bara genom utlämnande | 21 länsstyrelser | ej publicerat |
| Veterinär | **Nej**, och tillsynen gäller individ | 21 plus en nämnd | 274 kliniker |
| Bilbesiktning | Per fordon delvis, per station nej | 1 | 13 företag |
| Hotell och vandrarhem | **Nej**, och anmälningsplikt saknas | 290 | 2 242 hotell |
| Alkohol, brand, miljö, hiss | Ej utrett, se §14 | | |

### 9.1 Förskola: alla tre egenskaperna, och den enda som har dem

**Datan.** Riksrevisionen, RiR 2025:15, *Likvärdighet i förskolan*, beslutad
2025-05-12 och publicerad 2025-05-27, avsnitt 4.2.3 s. 38: "Det saknas ett
aktuellt register över vilka förskolor som finns i Sverige." Och i samma
stycke: "För skolor finns skolenhetsregistret som innehåller information om
vilka skolenheter som finns, men en motsvarighet för förskolan saknas."

Vi har verifierat det mot källan. Skolverkets skolenhetsregister svarar
`HTTP 200` på `api.skolverket.se/skolenhetsregistret/v1/skolenhet` med
uttagsdatum 2026-08-31 och **10 647 enheter, varav 7 465 aktiva**. Ett
stickprov på 80 slumpvalda aktiva enheter gav **noll förskolor**, och
aritmetiken bekräftar det oberoende: 7 465 aktiva enheter är färre än de
8 541 förskolorna ensamma.

Skolverket fick rätten att föra in förskolor i registret 2 april 2024,
5 a § 1 förordningen (2020:833), och har inte gjort det. Regeringen bedömde i
skr. 2025/26:67, publicerad 2025-11-25, att det "för närvarande inte finns
skäl att vidta ytterligare åtgärder". Utredningen regeringen hänvisade till
levererade som **SOU 2026:37** i juni 2026, 504 sidor, med **noll träffar på
"skolenhetsregist"**. Luckan är oåtgärdad och ingen har föreslagit att den
ska täppas till.

**Huvudmännen.** Drygt 8 850 förskoleenheter, varav cirka 5 880 kommunala och
cirka 2 660 enskilda, under **drygt 2 130 huvudmän**, varav 290 kommunala och
drygt 1 840 enskilda. Drygt 94 procent av de enskilda huvudmännen driver bara
en eller två förskolor. Fristående förskolor finns i 244 av 290 kommuner.
Källa: Skolverket, *Barn och personal i förskola. Hösten 2025*, dokumentdatum
2026-04-16, dnr 2025:3998. **Tillsynsmyndigheten är kommunen**, skollagen
26 kap. Det är den mest utspridda strukturen i hela genomgången, alltså den
största vallgraven.

**Efterfrågan.** Högst av alla mätta kandidater, 14 av 16 fraser, 88 procent.
`välja förskola` femton av femton, `anmäla förskola` femton av femton,
`jämför förskolor` tretton av femton, `förskolor södermalm` fjorton av femton.

**Och tillsynen är svag, vilket är ett skäl och inte ett hinder.**
Skolinspektionen "har knappt bedrivit någon tillsyn av förskolan sedan 2020",
RiR 2025:15 avsnitt 5.2 s. 43, och förskolan utgjorde knappt tre procent av
besluten inom riktad tillsyn 2018 till 2023. Av elva slumpvalda kommuner som
Riksrevisionen intervjuade var det vanligaste vart tredje år, och **en kommun
hade inte utövat tillsyn sedan 2016**.

### 9.2 Skola: den motsatta lärdomen, och den ska skrivas ut

Skolan uppfyller egenskap ett och tre men inte två, och det räcker för att
stryka den.

**Skolverket publicerar redan sidan.** Deras sitemaps innehåller
**5 115 grundskoleenheter** och **1 479 gymnasieenheter** som egna sidor,
räknat 2026-08-31 mot
`utbildningsguiden.skolverket.se/webdav/files/Sitemaps/`. Varje sida bär betyg,
nationella provresultat, elever per lärare och skolbibliotek. Adressformen är
en frågeparameter, `?schoolUnitID=`, vilket är svagt byggt, men sidan finns och
den är statens.

**Livsmedelsverket gör inte det.** De samlar in kommunernas kontrolluppgifter
men publicerar dem varken som statistik eller som öppna data. Det är hela
skillnaden mellan de två vertikalerna, och den handlar inte om datans natur.

Ett litet frågetecken som ska stå: 5 115 publicerade grundskolesidor mot
knappt 4 630 faktiska grundskoleenheter enligt Skolverkets egen statistik
(*Elever och skolenheter i grundskolan. Läsåret 2025/26*, dokumentdatum
2026-03-25). Differensen är sannolikt anpassad grundskola, sameskola och
vilande enheter, men den är inte verifierad.

### 9.3 Äldreomsorg och vård: delvis utrett

Utredningen av IVO och Kolada återkom inte innan det här dokumentet skrevs, och
raden ska läsas därefter. Två saker är ändå belagda av oss direkt.

**Kolada bär enhetsnivå, och den är befolkad.** `api.kolada.se/v3/ou` svarar
`HTTP 200` och innehåller **34 789 organisationsenheter i 311 kommuner och
regioner**, hämtat 2026-08-31. Namnräknat: 7 129 med "förskol" i namnet, 4 911
med "skol", 3 439 som är äldreomsorg eller vård. Enheterna bär namn och ofta
gatuadress i namnfältet, exempelvis "Förskolan Svängen, Rinkebysvängen 20 A".
**Om värdena per enhet är ifyllda är obesvarat**: `v3/oudata?ou=` svarade
`HTTP 504` och `v3/oudata/ou/` svarade `HTTP 404`. Den frågan ska köras om, och
den är den enskilt viktigaste öppna punkten i dokumentet. §14.

**Den demografiska motvikten är belagd.** Medianåldern vid flytt till särskilt
boende är drygt 86 år, väntetiden från beslut till erbjuden plats var i
genomsnitt två månader 2025, och andelen av dem över 80 som bor i särskilt
boende har fallit från knappt 13 till omkring 9 procent mellan 2015 och 2025.
Socialstyrelsen, *Vård och omsorg för äldre, Lägesrapport 2026*, artikelnummer
2026-3-10088, pressmeddelande 2026-03-30. Målgruppen krymper, beslutet fattas
en gång, och platsen erbjuds oftare än den väljs.

### 9.4 Kandidater som faller, och på vad

**Djurskydd.** Länsstyrelsen för in resultatet i djurskyddskontrollregistret,
som inte är publikt sökbart. Publikt finns bara aggregerad statistik. I
praktiken bara genom begäran om utlämnande hos var och en av 21 länsstyrelser.
Volym 2025: 8 713 fysiska kontroller och 3 629 beslut. Antalet kontrollobjekt
publiceras inte som en siffra. Efterfrågan är dessutom svag i mätningen.

**Veterinär.** Tillsynen gäller den legitimerade individen, aldrig kliniken.
Ansvarsnämnden för djurens hälso- och sjukvård publicerar inga beslut och
beslutade 2025-01-23 att ta ut avgift vid utlämnande. Volymen är liten, cirka
167 ärenden om året, och 87 procent slutar utan påföljd. Branschen är 274
kliniker under 165 företag. En sajt byggd på adresser och en karta passar
illa på ett yrkesregister.

**Hotell.** Inte anmälningspliktiga enligt 38 §, bara tillsynsobjekt enligt
45 § p. 4, alltså föds inget objektregister automatiskt. Noll inspektionsdata
i Stockholm, Göteborg och Malmö. Detta trots att `vägglöss hotell` är den
starkaste äckelfrasen i hela mätningen. New York publicerar visserligen
720 493 rader vägglössrapporter över 134 579 byggnader sedan 2020, men grunden
är Local Law 69 of 2017 som gäller hyresbostäder, **och hotell ingår inte**.

**Bilbesiktning.** Per fordon finns senast godkända besiktning publikt hos
Transportstyrelsen. Per station eller företag publiceras bara marknadsandelar,
och bara som PDF. Det finns ingen konsumentfråga som en sida per station
svarar på.

### 9.5 Hygienlokaler: nästan rätt, och därför lärorik

Detta var kandidaten utanför beställningens lista som mätningen pekade ut, och
den prövades ordentligt. Utfallet är att den är rätt på allt utom två saker.

**Rätt:** samma nämnd, samma kontor, samma ärendesystem och **samma cirka 250
mottagare som vår brevmall redan är skriven till**. Anmälningsplikten i 38 § 1
gör att objekten faktiskt finns registrerade i kommunens system. 81 procent av
kommunerna bedriver återkommande tillsyn på dem.

**Fel, punkt ett: ingen publicerar något.** Sökningar i Sveriges dataportals
eget sök-API 2026-08-31 gav noll träffar på `hygienlokal`, noll på `hygienisk`
och noll på `vägglus`. `hälsoskydd` gav 21 träffar, samtliga Kolada-nyckeltal
och radonmätningar. Göteborgs egen katalog gav noll på `hygien`, noll på
`hälsoskydd` och noll på `tillsyn`. Det närmaste som finns är Malmös namnlista
på drygt 200 registrerade tatuerare, uppdaterad 2026-03-24, utan
inspektionsdatum och utan avvikelser.

**Fel, punkt två: ingen nationell kodlista.** Livsmedelskontrollens
jämförbarhet vilar på Livsmedelsverkets kontrollområden. Hälsoskyddstillsynen
har ingen sådan. Styrningen sker via allmänna råd, SOSFS 2006:4, under
omarbetning sedan 2024-06-11. Resultatet är fritext plus eventuella
förelägganden, och bedömningsmodellen i §6 har då ingenting att ärva.

Och beståndet är litet: kommunerna uppskattade 2022 antalet anmälningspliktiga
stickande och skärande verksamheter till **drygt 8 000** (Naturvårdsverkets
lägesbild hälsoskydd, avsnitt 2.9). Socialstyrelsens egen konsekvensutredning,
dnr 4.1-43672/2024 daterad 2024-06-11, skriver rakt ut att "det finns inte
någon statistik på hur många tatuerare eller piercare som finns i Sverige".

Slutsatsen är att hygienlokaler inte bär en egen sajt. Men de bär ett stycke i
ett brev, och det är §10.

## 10. Fyndet: registret staten saknar ligger hos de myndigheter vi redan skriver till

Det här avsnittet bär rekommendationen och ska läsas i sin helhet.

### 10.1 Förskolor och skolor är anmälningspliktiga till kommunens miljönämnd

38 § förordningen (1998:899) om miljöfarlig verksamhet och hälsoskydd, i
lydelsen enligt Förordning (2022:1611), hämtad ur regeringens rättsdatabas
2026-08-31, förbjuder att utan anmälan driva:

> 1. verksamhet där allmänheten yrkesmässigt erbjuds hygieniska behandlingar
>    som innebär risk för blodsmitta eller annan smitta på grund av
>    användningen av skalpeller, akupunkturnålar, piercningsverktyg eller
>    andra liknande skärande eller stickande verktyg,
> 2. bassängbad för allmänheten eller som på annat sätt används av många
>    människor, eller
> 3. förskola, öppen förskola, fritidshem, öppen fritidsverksamhet,
>    förskoleklass, grundskola, anpassad grundskola, gymnasieskola, anpassad
>    gymnasieskola, specialskola, sameskola eller internationell skola.

**Punkt tre är fyndet.** Sveriges förskolor är anmälningspliktiga objekt hos
samma kommunala miljönämnd som bedriver livsmedelskontrollen, i samma
ärendesystem, med samma handläggare och samma diarium. De tre systemen Ecos,
EDP Vision och Castor säljs uttryckligen som system för miljö- och
hälsoskyddstillsyn i sin helhet, inte som livsmedelssystem.

Riksrevisionen säger att staten saknar ett register över landets förskolor.
Registret finns. Det ligger i 290 kommunala ärendesystem, hos exakt de
myndigheter vår brevmall redan är adresserad till.

### 10.2 Vi har redan arton procent av det, av misstag

Räknat mot `site/src/data/*.json` 2026-08-31:

| Mått | Tal |
|---|---:|
| Förskolor i vårt bestånd | **1 604** av 17 066, alltså 9,4 % |
| ...med adress | 1 516, alltså 94,5 % |
| ...med koordinat | 1 369, alltså 85,3 % |
| ...med en bedömning | 1 471, alltså 91,7 % |
| Kontroller på dem | 6 932, alltså 4,32 per förskola |
| Kommuner de kommer ur | 13 |
| **Andel av landets drygt 8 850 förskolor** | **18,1 %** |

De ligger där för att förskolekök är livsmedelsanläggningar. Vi har alltså
byggt arton procent av det register Riksrevisionen efterlyser, ur tolv
kommuner, utan att veta om det och utan att ha försökt.

Vi har dessutom 470 äldreomsorgsobjekt och 360 skolobjekt på samma sätt.
Sammanlagt **2 436 objekt, alltså 14,3 procent av beståndet, är redan skola,
förskola eller omsorg**. Norrköpings Ecos-uttag börjar bokstavligen med
"Valhallavägen 1a Äldreboende".

### 10.3 Vad breddningen skulle kosta, och varför det inte är sex månader

Kostnadsbilden är osedvanligt god, och skälen är fyra.

1. **Objekten finns redan på sajten.** 2 436 av dem har redan en sida, en
   kartnål, en slug och en plats i sökregistret. Ingen ny sidtyp behövs, och
   §13 i `docs/45` förbjuder ändå nya sidtyper för funktioners skull.
2. **Brevet är redan skrivet och mottagaren är redan verifierad.**
   `pipeline/data/kommuner.json` bär 290 kommuner, 250 distinkta
   kontrollmyndigheter, 63 via förbund och e-postadress till 270 av dem. Och
   adresserna är i huvudsak förvaltningsagnostiska: av 775 adresser är 352
   kommunens allmänna och 314 övriga, mot bara 55 uttalade miljöadresser.
   **En begäran om hälsoskyddstillsyn går till samma inkorg som en begäran om
   livsmedelskontroll.** Det är ett stycke till i `pipeline/begaran.py`, inte
   en ny utskicksomgång.
3. **Hämtarlagret behöver inte skrivas om, bara utökas.** Ecos-läsaren är
   redan skriven mot systemets egen utdragsform och inte mot en kommun, och
   dess modulhuvud säger det uttryckligen. Vad som saknas är en exportprofil
   för hälsoskydd, och den frågan ställs i samma brev.
4. **Ingen ny redaktionell yta.** Den dyraste delen av maskinen är de 31 570
   orden handskriven svenska. En breddning inom samma sajt ärver dem.

### 10.4 Och vad som ärligt talar emot

Fyra saker, och de är verkliga.

1. **Ingen nationell kodlista för hälsoskydd.** Bedömningsmodellen ärver
   myndighetens heltal, se §6. Hälsoskyddstillsynen ger fritext. Antingen
   publiceras objekten utan bedömning, vilket sajten redan kan, eller så byggs
   den fritexttolkande komponent §1 punkt 6 pekar ut.
2. **Kökshygien är inte förskolekvalitet.** En förälder som väljer förskola
   frågar om barngruppens storlek och personaltätheten, inte om kylkedjan. Att
   påstå något om en förskola på grundval av dess kök vore precis den
   glidning `docs/17` finns till för att förhindra. Om vi publicerar en
   förskolesida ska den säga vad den vet och inget mer.
3. **Nyttan hänger på en ihopparning vi inte prövat.** Skolverket publicerar
   statistik per förskoleenhet, alltså antal barn, barngruppsstorlek,
   personaltäthet och andel med förskollärarlegitimation, men **utan adress,
   koordinat eller identitet**. Vi har identiteten och saknar kvaliteten. De
   två halvorna passar ihop, men hopparningen skulle ske på namn och kommun,
   och den träffsäkerheten är omätt.
4. **Efterfrågan är mätt på bredd, inte på volym.** Semrush och Trends svarar
   fortfarande inte. Se §14.

## 11. Den tredje egenskapen, som beställningen bad mig väga in ärligt

Beställningen säger att livsmedel har tre saker som inte syns i en
sökordstabell: en konsument som ska äta i kväll, en påtaglig känsla av äckel,
och ett resultat som är begripligt utan förkunskap. Frågan var vilka kandidater
som saknar den motorn. Svaret, kandidat för kandidat.

**Beslutet upprepas, eller så gör det inte det.** Vår egen data mäter vad ett
återkommande beslut ger: **73 335 kontroller på 17 066 verksamheter, alltså
4,30 per verksamhet, och 12 321 nya kontroller under 2025** (räknat mot
`site/src/data/*.json` 2026-08-31). Det är en sajt som förnyar sig själv utan
att någon skriver något. En anhörig som väljer äldreboende gör det en gång,
vid en medianålder på drygt 86 år hos den som flyttar in, och väntetiden från
beslut till erbjuden plats var i genomsnitt två månader 2025 (Socialstyrelsen,
*Vård och omsorg för äldre, Lägesrapport 2026*, artikelnummer 2026-3-10088,
pressmeddelande 2026-03-30). Andelen av dem över 80 som bor i särskilt boende
har samtidigt fallit från knappt 13 till omkring 9 procent mellan 2015 och
2025, alltså krymper målgruppen. Ett beslut
som fattas en gång, ofta under tidspress och ofta genom att en plats erbjuds
snarare än väljs, ger inte återkommande trafik och ger inte återkommande data.

**Resultatet är begripligt, eller så är det det inte.** Vår bedömning är tre
ord: inga anmärkningar, brister, brister som kvarstår. Den vilar på att källan
levererar ett heltal, se §6. Ett tillsynsbeslut från IVO eller Skolinspektionen
är fritext på flera sidor, och att göra den fritexten till tre ord är precis den
komponent §1 säger saknas. Skillnaden är alltså inte bara teknisk. **Ett
föreläggande som vi själva har tolkat till "allvarliga brister" är ett mycket
större påstående om en namngiven skola än vad vi i dag gör om en restaurang,
där vi ärver kommunens egen slutsats och bara skärper den på ett mönster.**
Den juridiska exponeringen växer i samma steg som tolkningsarbetet.

**Äckelmotorn finns, men den sitter sällan där datan sitter.** Mätningen visar
att den starkaste enskilda äckelfrasen i hela materialet är `vägglöss hotell`,
femton av femton, och att `smitta förskolan` ger fjorton av femton och
`löss förskolan` nio av nio. Ingen av dem har en offentlig kontrollkälla per
objekt. Motorn och datan sammanfaller i livsmedel. Det är ovanligt, inte
typiskt.

**Kandidater som helt saknar motorn:** brandskyddstillsyn, hissbesiktning och
miljötillsyn. Ingen konsument väljer mellan två hissar. Mätningen bekräftar
det: brandskydd ger en träff av tre, och de fraser som träffar är
`brandskyddskontroll pris`, alltså en fastighetsägare som ska köpa en tjänst
och inte en konsument som ska välja.

**Kandidater där motorn finns men riktas mot personen och inte platsen:**
fastighetsmäklare, veterinär och tandvård. `anmäla mäklare` ger elva av elva
och `anmäla veterinär` sju av sju. Men tillsynen där gäller ofta den
legitimerade individen, inte lokalen, och en sajt byggd på adresser och en
karta passar sämre på ett yrkesregister än på en byggnad.

## 12. Tidsläget, och om vallgraven hotas på fler ställen

`docs/45` §6.1 och `docs/54` §9.1 bygger på att fönstret där utspridd data är en
vallgrav är ungefär 2026 till 2028. Det är verifierat om och preciserat här.

**Livsmedel.** Regeringen gav 15 maj 2026 lagmannen Eva-Lotta Hedin i uppdrag
att utreda centralisering av offentlig kontroll av livsmedel, foder och
animaliska biprodukter. Uppdraget ska redovisas **5 januari 2027** och drivs som
en bokstavsutredning inom landsbygds- och infrastrukturdepartementet
(regeringen.se, pressmeddelande 2026-05-15, hämtat 2026-08-31).

**Det viktiga är att uppdraget rymmer fyra alternativ och att bara ett av dem
tar bort vallgraven.** De fyra är total centralisering till en myndighet,
partiell centralisering för vissa branscher, delvis centralisering till
länsstyrelserna, och ökad koncentration av de kommunala myndigheterna. Tre av
fyra lämnar kvar en struktur med många huvudmän, och alternativ tre skulle ge
21 huvudmän i stället för 250, alltså en mindre vallgrav men inte ingen.
`docs/45` §6.1 läser reformen som ett hot mot åtkomsten. Den läsningen är rätt
bara i det första av fyra fall.

**Öppna data-lagen hjälper oss inte.** Sveriges öppna data-lag (2022:818) och
EU:s genomförandeförordning 2023/138 om värdefulla datamängder omfattar sex
teman: geodata, jordobservation och miljö, meteorologi, statistik, företag och
företagsägande, samt mobilitet (Digg, vägledning om värdefulla datamängder,
hämtad 2026-08-31). **Tillsyns- och kontrolldata ingår inte i något av dem.**
Ingen kandidat i det här dokumentet kommer alltså att tvingas publicera av den
lagstiftningen. Det är dåliga nyheter för täckningen och goda nyheter för
vallgraven, och det gäller livsmedel lika mycket som allt annat.

**Och det viktigaste för rekommendationen i §13:** Hedins uppdrag gäller
livsmedel, foder och animaliska biprodukter. **Det gäller inte
hälsoskyddstillsynen.** Kommunernas tillsyn av förskolor, skolor, bassängbad
och hygienlokaler enligt 38 § berörs inte av någon utredning vi har hittat.
Vallgraven kring de objekten är alltså den enda i det här dokumentet som
ingen har föreslagit att ta bort.

**Övriga kandidater.** Ingen pågående centralisering hittad för
hälsoskyddstillsyn, kommunernas förskoletillsyn eller djurskyddskontrollen.
För förskolan går rörelsen tvärtom åt fel håll: SOU 2026:37 lämnades i juni
2026 utan att föreslå det register Riksrevisionen efterlyste. Alkohol,
brandskydd, miljötillsyn och hiss är inte utredda på den här punkten, §14.

---

## 13. Rekommendationen

### 13.1 Ingen andra vertikal, och skälet är mätt och inte principiellt

Beställningen tillät svaret "ingen på tre år, fokusera". Det svaret är nästan
rätt, och det ska preciseras i stället för att upprepas.

**Ingen av de tolv prövade kandidaterna bär en egen sajt.** Var och en faller
på egenskap ett eller två, och de faller åt olika håll: skolan för att staten
redan gjort jobbet, förskolan och hygienlokalerna för att ingen publicerar,
djurskyddet och veterinären för att datan bara går att begära ut, hotellet för
att objektregistret inte finns. Efterfrågan finns hos nästan alla, §8, och den
räddar ingen av dem.

**Att kalla projektet en plattform vore alltså fel just nu.** Beställningens
egen tumregel var att vertikal två på en månad gör det till en plattform och
sex månader gör det till en sajt. Kodinventeringen säger att koden skulle
klara en månad. Marknaden säger att det inte finns någon andra vertikal att
peka den mot. **Maskinen är byggd som en plattform och används som en sajt,
och det är rätt användning i dag.**

### 13.2 Det som ska göras i stället, och det kostar nästan ingenting

**Lägg till hälsoskyddstillsynen i begäran om utlämnande.** `docs/45` H1 och
`docs/50` skickar ändå brev till 250 kontrollmyndigheter. Samma nämnd handlägger
38 §. Ett stycke till i brevet ber om tillsynen av förskolor, skolor,
bassängbad och hygienlokaler ur samma system.

Utfallet är billigt oavsett vad det ger. Får vi noll svar har det kostat ett
stycke. Får vi svar från tjugo kommuner har vi ett objektregister över deras
förskolor som staten inte har, med adress och koordinat, och vi har det för
objekt som i tolv kommuner redan står på sajten.

**Två villkor som ska stå i beslutet.**

1. **Förskolesidan får aldrig påstå något om förskolans kvalitet på grundval
   av kökets hygien.** Det som visas är det vi vet, med källan skriven ut, och
   ingenting mer. Samma regel som `docs/17` sätter för kommunsidorna.
2. **Ingenting av detta går före täckningen.** `docs/54` §9.2 äger de närmaste
   sex månaderna. Det här är ett stycke i ett brev som täckningsarbetet ändå
   skickar, inte en punkt som konkurrerar med det.

### 13.3 Vad som ska prövas, i ordning, och vad var sak kostar

| # | Vad | Kostnad | Villkor |
|---|---|---|---|
| 1 | Stycket om hälsoskydd i `begaran.py` | En timme | Ingen, rider på H1 |
| 2 | Kolada `oudata` körd om, se §14 | En timme | Ingen |
| 3 | Ihopparning Skolverkets förskolestatistik mot våra 1 604 | En dag, mätning | Att 2 gav värden |
| 4 | Förskolesidan som egen yta | Vänta | Att 1 eller 3 gav data |
| 5 | Fritexttolkande komponent | Vänta, antagligen länge | Att 4 är motiverad |

### 13.4 Sammanfattat i tre rader

**Bygg ingen andra vertikal.** Ingen av tolv kandidater har alla tre
egenskaperna, och skolan visar varför: där datan är lätt att nå har staten
redan byggt sidan.
**Bredda den första i stället**, med ett stycke om hälsoskyddstillsyn i brevet
täckningsarbetet ändå skickar, mot förskolor och skolor som redan är
anmälningspliktiga hos samma nämnd och redan står på sajten.
**Och håll ordningen:** täckning i sex månader enligt `docs/54`, det här som
en rad i den, och frågan om en egen förskoleyta omprövad först när det finns
data att lägga på den.

---

## 14. Vad som inte gick att belägga

1. **Volymtal för sökning.** Semrush svarar att kontot saknar API-enheter,
   alltså samma svar som `docs/26` fick, och Google Trends svarar fortfarande
   429. Hela §8 är därför bredd och rangordning, aldrig volym. Detta är den
   allvarligaste luckan i dokumentet.
2. **Kolada på enhetsnivå.** Att katalogen finns är belagt, 34 789 enheter i
   311 kommuner och regioner. **Om värdena per enhet är ifyllda är okänt.**
   `v3/oudata?ou=` gav `HTTP 504` och `v3/oudata/ou/` gav `HTTP 404`. Frågan
   är den enskilt viktigaste öppna punkten, eftersom ett ja skulle ge
   kvalitetsdata per namngiven förskola utan en enda begäran.
3. **IVO.** Utredningen av IVO:s öppna data, vårdgivarregistret och om
   enskilda tillsynsbeslut går att hämta per namngiven enhet återkom inte.
   Raden i §9 är därför delvis tom, och äldreomsorgen är inte färdigprövad.
4. **Alkohol- och serveringstillstånd, brandskyddstillsyn enligt LSO,
   miljötillsyn enligt miljöbalken, hissbesiktning, hyresvärdar och OVK,
   tandvård, fastighetsmäklare och elinstallatörer.** Ej utredda på datafrågan.
   Efterfrågan är mätt för samtliga, §8, och ingen av dem mäter högre än
   förskolan. Brandskydd och miljötillsyn faller dessutom på §11.
5. **Kommunernas publicering av tillsynsbeslut per fristående förskola.** Inte
   verifierad mot enskilda kommuner. Riksrevisionen säger ingenting om saken.
   Utgångspunkten är att den inte sker, men det är ett antagande.
6. **Ihopparningen mellan Skolverkets förskolestatistik och våra 1 604
   förskolor.** Helt oprövad. Den skulle ske på namn och kommun, och
   träffsäkerheten är okänd.
7. **Antalet gymnasieenheter i riket.** Skolverkets beskrivande statistik för
   gymnasieskolan redovisar elevantal men inget antal skolenheter, så de
   1 479 gymnasiesidorna i Utbildningsguiden är inte avstämda mot en officiell
   enhetssiffra.
8. **Differensen 5 115 publicerade grundskolesidor mot knappt 4 630 faktiska
   grundskoleenheter.** Sannolikt anpassad grundskola, sameskola och vilande
   enheter, men inte verifierat.
9. **Antal besiktningsstationer i Sverige.** En sökträff angav 629 för 2025.
   Talet är inte verifierat i primärkälla och används inte.
10. **Hur ofta svenskar äter ute.** Visitas undersökning citeras i andrahand av
    flera källor men förstahandskällan svarade `HTTP 403`. Frekvensargumentet
    i §11 vilar därför på strukturen och på Socialstyrelsens tal, inte på ett
    restaurangtal.
11. **Sokigos och EDP:s exportprofiler för hälsoskydd.** Att systemen hanterar
    hälsoskydd är belagt ur leverantörens egen produktbeskrivning. Att det
    finns en färdig exportform motsvarande livsmedelsuttaget är det inte, och
    Stockholms enda publicerade Ecos-dataset omfattar bara livsmedel.
