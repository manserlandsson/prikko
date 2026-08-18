# 36. Händelser på verksamhetssidan

**Datum:** 2026-08-18
**Föregångare:** `research/R4_juridik_utgivningsbevis.md` äger juridiken och gäller
oförändrad. `research/R11_utlamnandeplan.md` §1.6 äger sekretessfrågan.
`docs/15_vad_sidorna_blir.md` §6 äger den redaktionella gränsen och klassindelningen.
`site/src/pages/metodik.astro` §lokalen äger frågan om vad en verksamhetssida är.
**Beställning:** ett nytt avsnitt "Händelser", skilt från kontrollhistoriken, med
bekräftade sjukdomsutbrott, misstänkta matförgiftningar, återkallelser, tillfälliga
stängningar och förelägganden. Bedömningen ska aldrig ändras av en händelse.
**Utfall:** avsnittet ska inte byggas. Fyra av de fem posterna saknar data som går
att koppla till en verksamhet, och den femte finns redan på sidan under ett annat
namn. Ett spår rekommenderas i stället, och det är ett tillägg till en begäran vi
ändå ska skicka.

---

## 1. Slutsatsen först

**1. Beställningen är inte en sak utan fem, och de har fem olika svar.** Att lägga
dem i samma ruta är det enda beslutet som är säkert fel, eftersom rutan då bär
myndighetsbeslut och obekräftade konsumentpåståenden under samma rubrik. §2.

**2. Bekräftade sjukdomsutbrott går inte att koppla till en verksamhet. Ingen
källa i Sverige gör det.** Livsmedelsverkets nationella sammanställning för 2024
bygger på 381 rapporter med 2 312 sjukdomsfall och namnger ingen enda verksamhet.
Smittämnet var okänt i 85 procent av rapporterna. Folkhälsomyndigheten har inget
publikt utbrottsregister, och regionernas smittskyddsrapporter innehåller varken
ordet restaurang eller ordet matförgiftning. §4.1 och §4.2.

**3. Misstänkta matförgiftningar är den juridiskt farligaste posten och den
tunnaste.** För våra tolv kommuner rapporterades sammanlagt **283 misstänkta
matförgiftningar under fem år**, alltså ungefär 57 per år fördelat på 16 047
verksamheter. Tre av våra kommuner står inte ens i tabellen. Och talet mäter inte
maten: Stockholm rapporterade 39 på fem år, Göteborg 222. §4.2.

**4. Återkallelser handlar om produkter och tillverkare, aldrig om
serveringsställen.** 61 till 63 återkallanden i Sverige 2023. En restaurang som
serverat en återkallad vara syns ingenstans. Det är rätt sorts data om fel objekt.
§4.4.

**5. Förelägganden och stängningar är det enda spår som bär, och det är också det
enda som är billigt.** Kommunerna rapporterar varje myndighetsbeslut per
verksamhet till Livsmedelsverket. Nationellt 2024: 3 889 förelägganden mot
verksamheten, 118 stängningar, 251 sanktionsavgifter, 5 åtalsanmälningar. För våra
tolv kommuner: **599 verksamheter fick ett beslut med krav på verksamheten under
2024.** Uppgiften finns per verksamhet hos kommunen, den är offentlig handling, och
den saknas i den nationella öppna data-specifikationen. Det är samma väg vi redan
går för kontrollerna. §4.5.

**6. Den femte posten finns redan på sidan.** `type = 2` i vår datamodell betyder
händelsestyrd kontroll, och `InspectionHistory.astro` skriver redan ut etiketten
"Händelsestyrd kontroll" i kontrollhistoriken. Ett avsnitt "Händelser" byggt på
den uppgiften vore samma fakta i en skarpare inramning. §4.6.

**7. Den inramningen skulle vara falsk för fyra av fem sidor.** Av de 1 175
konsumentvända verksamheter som haft en händelsestyrd kontroll de senaste tre åren
har **955, alltså 81,3 procent, bedömningen "inga anmärkningar" i dag**, och 341 av
dem bär utmärkelsen ren historik. **62,3 procent av de händelsestyrda besöken hittade
ingenting alls.** §4.6 och §5.

**8. Det tomma fallet går inte att skriva.** "Inga kända händelser" är ett påstående
om vår kunskap, och vi vet demonstrativt inte. Livsmedelsverket säger att våra tolv
kommuner gjorde 1 046 händelsestyrda kontroller under 2024. Vi ser 567 av dem,
**54,2 procent**. Uppsala rapporterade 62, vi ser noll. Karlstad rapporterade 70, vi
ser noll. §6.

**9. Juridiskt går skiljelinjen inte mellan kontroll och händelse, utan mellan att
återge och att påstå.** Att skriva att en myndighet fattat ett beslut ett visst
datum är ett faktapåstående vars sanning är trivial att bevisa. Att skriva att en
verksamhet orsakat ett utbrott är ett eget orsakspåstående där vi bär bevisbördan
för själva sambandet. Utgivningsbeviset ändrar inte det, för förtal är
uttryckligen ett yttrandefrihetsbrott. §3.

**10. Rekommendationen är därför ett nej till avsnittet och ett ja till en rad i
mejlet.** Lägg förelägganden, förbud och stängningsbeslut i
utlämnandebegäran till de 275 kommunerna. Bygg ingenting förrän en kommun faktiskt
har lämnat ut ett sådant beslut. §7 och §8.

---

## 2. Beställningen är fem olika saker

Ägaren räknar upp fem poster. De ser ut att höra ihop därför att de alla handlar om
att något inträffat. De hör inte ihop i något av de avseenden som avgör om de får
publiceras.

| Post | Vem har uppgiften | Vad uppgiften är | Namnger källan verksamheten |
|---|---|---|---|
| Bekräftat utbrott | Smittskydd, Folkhälsomyndigheten, Livsmedelsverket | Epidemiologisk slutsats | Nej |
| Misstänkt matförgiftning | Kommunens miljöförvaltning | Ett påstående från en konsument | Nej, publikt |
| Återkallelse | Företaget själv, spritt via Livsmedelsverket | Företagets eget beslut om en produkt | Ja, men om produkten |
| Tillfällig stängning | Kommunens nämnd | Myndighetsbeslut | Ja, i beslutet |
| Föreläggande | Kommunens nämnd | Myndighetsbeslut | Ja, i beslutet |

Tre skillnader gör att posterna inte kan dela ruta.

**Avsändaren skiljer sig.** Ett föreläggande är kommunens eget beslut om en namngiven
anläggning. En anmälan om misstänkt matförgiftning är en enskild persons uppfattning
som kommunen registrerat. Ett bekräftat utbrott är en epidemiologisk slutsats som
någon annan än den som äger anläggningsregistret har dragit. Att sätta dem i samma
lista är att låta det starkaste beviset låna trovärdighet åt det svagaste, och
tvärtom.

**Bevisbördan skiljer sig.** För beslutet räcker det att beslutet finns. För utbrottet
måste orsakssambandet hålla. §3.4.

**Objektet skiljer sig.** Fyra av posterna gäller anläggningen. Återkallelsen gäller
en produkt hos en tillverkare. En restaurang är i det sammanhanget en kund, inte en
part.

Det finns dessutom en namnkollision som är värd att avgöra en gång: **ordet
"händelser" är redan upptaget i huset.** `pipeline/rorelse.py` och
`schema_rorelse.sql` kallar tillkomna och försvunna verksamheter för händelser,
tabellen heter `roster_events`, och `/nytt-och-borta/` är sidan som visar dem. Ett
andra "Händelser" med en helt annan betydelse ska inte införas.

---

## 3. Juridiken

**Jag är inte jurist.** Allt nedan är avläst ur lagtext, förarbeten, domar och
myndighetssidor, eller ur `research/R4`, som säger samma sak om sig själv. Där jag
gör en egen bedömning står det utskrivet.

### 3.1 Det som redan är avgjort i huset

`research/R4` är fortfarande giltig och behöver inte göras om. Tre punkter ur den
bär hela det här avsnittet.

**Juridiska personer kan inte förtalas.** Positionen är över hundra år gammal, NJA
1904 s. 483, och så kallat ekonomiskt förtal är inte kriminaliserat i Sverige. Ett
aktiebolag som driver en restaurang kan i praktiken inte förtalas av oss.

**Enskild firma bryter igenom skyddet.** Näringsidkaren ÄR den fysiska personen.
NJA 1950 s. 250 sträcker det ett steg till: ett nedsättande uttalande om ett
aktiebolag kan vara förtal av en fysisk person när personens namn ingår i firman.
Åklagarmyndighetens RättsPM 2022:2 bekräftar att 5 kap 1 § kan omfatta uppgifter om
ohederliga affärsmetoder eller vanskötsel av ett företag.

**Utgivningsbeviset är inte en GDPR-sköld.** EU-domstolen, mål C-199/24, dom 9 juli
2026, Lexbase-målet. Det journalistiska undantaget kräver bearbetning, redaktionell
linje och faktakontroll före publicering.

En rättelse till tre av våra egna dokument: **avgiften är 4 000 kronor, inte 3 000.**
Den regleras i förordning (2024:1170) om avgifter i ärenden om utgivningsbevis, i
kraft 1 januari 2025. Namnändring i efterhand kostar 2 000 kronor, byte av utgivare
1 000 kronor. `docs/12` E4, `docs/15` §9 och `docs/25` säger alla 3 000 och ska
rättas. Handläggningstiden publiceras inte av Mediemyndigheten och är okontrollerad.

### 3.2 Vad utgivningsbeviset ger, och vad det inte ger mot en händelse

Det ger fyra saker som är verkliga: ensamansvar för utgivaren, en uttömmande
brottskatalog, JK som ensam allmän åklagare, och en jury på nio som prövar
skuldfrågan där ett friande utslag inte kan ändras i högre rätt.

**Det ger inte skydd mot förtal.** TF 7 kap 3 § gör förtal till tryckfrihetsbrott,
och YGL 5 kap 1 § för över samma gärningar till yttrandefrihetsbrotten. Förtal är
alltså fullt prövbart med utgivningsbevis. Det som ändras är vem som svarar och hur
processen ser ut.

**Och den viktigaste luckan: målsäganden kan väcka enskilt åtal utan JK.** TF 9 kap
7 § behåller målsägandens rätt att själv väcka åtal, och BrB 5 kap 5 § gör förtal
till ett målsägandebrott. En restaurangägare som är fysisk person behöver alltså
inte övertyga JK om någonting. Det är den verkliga riskkanalen, och juryn står
mellan henne och oss först i sista ledet.

Två saker till som träffar just en händelsedatabas.

**Preskriptionen löper aldrig så länge posten ligger kvar.** YGL 7 kap 3 §: för
databaser räknas tiden för allmänt åtal från när informationen inte längre
tillhandahölls. En permanent sida med ett utbrott från 2019 preskriberas alltså
inte 2021, utan tidigast sex månader efter att vi tagit bort den.

**Motvikten är notice-and-takedown, men bara för gammalt material.** YGL 6 kap 6 §:
tar utgivaren bort informationen inom två veckor efter underrättelse kan hon inte
hållas ansvarig, men bara om informationen började tillhandahållas tidigare än ett
år före underrättelsen. Färskt material har inget sådant skydd, och en händelserad
är per definition färsk när den betyder något.

### 3.3 Att uppgiften är sann räcker inte

BrB 5 kap 1 § andra stycket är kumulativ. Det ska ha varit **försvarligt** att lämna
uppgiften, OCH uppgiften ska ha varit sann eller skäligt grundad. Två prövningar,
inte en.

Vår försvarlighetsställning är stark på kontrolldata och blir svagare ju längre från
myndighetens eget konstaterande vi går. BrB 5 kap 2 § anger dessutom att sättet för
och omfattningen av spridningen särskilt ska beaktas vid gradering. En indexerad
sida som rankar på verksamhetens namn är spridning i lagens mening.

### 3.4 Skiljelinjen som avgör hela beställningen

**Det finns inget referatprivilegium i svensk rätt.** Termen ger inga träffar i
svenska rättskällor, och det finns ingen motsvarighet till common law:s reporting
privilege. Vi kan alltså inte luta oss mot en regel som säger att ett korrekt
referat av en offentlig handling är immunt.

**Men effekten uppnås via skälig grund.** NJA 2006 s. 16, Aftonbladet publicerade
uppgifter hämtade ur ett statligt utredningsbetänkande. HD:

> "Sakuppgifter som lämnas i ett sådant sammanhang [kan] normalt kunna tas för goda
> utan närmare källkontroll, särskilt om uppgifterna inte är av bakgrundskaraktär
> utan redovisas som underlag för bedömningar och slutsatser."

Det ger den enda designprincip som betyder något här, och den är enkel nog att
skrivas som en regel:

> **Publicera aldrig ett eget orsakspåstående. Publicera bara vad en myndighet har
> beslutat eller registrerat, med datum och beteckning.**

"Miljö- och hälsoskyddsnämnden i X beslutade den 4 mars 2026 om föreläggande mot Y,
dnr Z" är sant om beslutet finns. "Y orsakade ett listeriautbrott" är sant bara om
orsakssambandet håller, och det är vi som ska visa det.

Den principen skiljer inte mellan kontroll och händelse. Den skiljer mellan
myndighetsbeslut och epidemiologisk slutsats, och den lägger fyra av de fem posterna
på olika sidor om linjen.

### 3.5 Sekretessen talar för oss, och det står i lagtexten

`research/R11` §1.6 har redan fyndet, och det tål att upprepas eftersom det är det
enda stället där lagstiftaren själv har vägt vårt ämne mot företagens intresse.

OSL 30 kap 23 § gäller uttryckligen bara "en statlig myndighets verksamhet". För
kommunal tillsyn gäller 27 §, och andra stycket lyder:

> "Sekretess enligt första stycket 1 gäller inte för uppgift i tillsynsverksamhet
> som bedrivs av den eller de kommunala nämnder som fullgör uppgifter inom miljö-
> och hälsoskyddsområdet, om intresset av allmän kännedom om förhållande som rör
> människors hälsa, miljön eller redligheten i handeln eller ett liknande
> allmänintresse har sådan vikt att uppgiften bör lämnas ut."

Att en handling är offentlig gör inte vidarespridningen förtalsfri. Men det ger
försvarlighetsprövningen i 5 kap 1 § andra stycket ett fäste i lagstiftarens egna
ord, och det gäller förelägganden och stängningsbeslut lika mycket som
kontrollrapporter.

**Motvikten:** regeringen har uttalat att kommuners utredningar av
matförgiftningsutbrott är tillsynsverksamhet som omfattas av tillsynssekretessen och
att sekretessprövning ska ske i varje enskilt fall. Svar på skriftlig fråga
2020/21:642. Det svaret gäller skyddet för den anmälande konsumenten, inte för
restaurangen, men det visar att just utbrottsutredningar prövas striktare än
kontrollrapporter.

### 3.6 Vad myndigheterna själva gör

**Livsmedelsverket namnger vid återkallelser.** Företags- och produktnamn står
utskrivna, och underlaget är företagens egna pressmeddelanden som verket sprider
vidare. Det är den minst riskfyllda av de fem posterna, av det enkla skälet att
verksamheten själv är avsändare.

**Ingen namnger vid utbrott.** Folkhälsomyndighetens egen sjukdomsinformation
skriver anonymiserat, ordagrant: "Över 700 personer insjuknade i magsjuka i
Jönköping 2010. Smittan var calicivirus och samtliga hade ätit på en lokal
pizzeria." Livsmedelsverkets årliga sammanställning namnger ingen verksamhet.
Regionernas smittskyddsrapporter namnger ingen verksamhet. §4.

**Varför de inte namnger är okontrollerat.** Jag har inte hittat något publicerat
ställningstagande från Folkhälsomyndigheten, Livsmedelsverket eller smittskyddet om
saken. Min bedömning är att det beror på tillsynssekretessens första stycke, på att
orsakssambandet sällan är fastställt när uppgiften vore som mest användbar, och på
att utbrottsutredningar bygger på verksamheternas samarbetsvilja. Det är en hypotes.

**Att kommunerna publicerar kontrollresultat med namn är däremot prövat.** Prop.
2005/06:214 redovisar att Datainspektionen bedömt att publicering av kontrollresultat
på internet är tillåten efter intresseavvägning, eftersom "intresset av att de
aktuella uppgifterna kom till allmän kännedom måste anses som stort". Propositionen
återkallades och är inte gällande rätt, men resonemanget står kvar och drar två
gränser vi redan följer: inga personuppgifter om personalen, och personnummer bara
när det behövs för att identifiera en enskild firma.

### 3.7 Pressetiken, som är det billigaste svaret på hela frågan

Mediernas Etiknämnd friade Aftonbladet för tio artiklar i februari 2025 om
hygienbrister hos en namngiven snabbmatskedja, byggda på anonyma före detta
anställda. Det avgörande var att företaget "genomgående fått ett stort utrymme att
få ge svar på de kritiska uppgifterna".

Motfallet är lika lärorikt. Eskilstuna-Kuriren klandrades för rubriker om en
namngiven restaurangägare, och nämnden konstaterade att anmälaren "inte hade en
sådan ställning att han behövde tåla en mer intensiv granskning".

Två slutsatser, båda direkt användbara. **Bemötanderätten är det som avgör.** Den
finns redan i huset som replikrätt, `OwnerReply.astro`, men den är i dag bunden till
en kontroll. **Och en enskild krögare tål mindre än en kedja**, vilket är samma
gränsdragning som i förtalsrätten och samma riskgrupp som `R4` pekade ut.

För företag och organisationer prövar Medieombudsmannen bara rätten till rättelse
eller genmäle, inte publicitetsskada. Undantag görs när de klagande som individer är
så intimt förknippade med företaget att anklagelserna främst drabbar dem
personligen. Systemet är frivilligt och vi omfattas inte om vi inte ansluter oss.
Anslutning kräver registrerad databas eller ansvarig utgivare hos Mediemyndigheten
och kostar 13 000 kronor per år för fristående nättidningar.

### 3.8 Frågorna som ska ställas till en jurist

Inte "får vi publicera händelser". Den frågan går inte att svara på. Dessa sex, i
den ordning de påverkar produktbeslut.

1. **Formuleringsstandarden.** Håller regeln i §3.4, att vi bara återger vad en
   myndighet beslutat eller registrerat, med datum och beteckning, och aldrig gör ett
   eget orsakspåstående? Be om konkreta meningsexempel som är säkra respektive
   osäkra, inte om principer.
2. **Misstänkt matförgiftning.** Får en registrerad konsumentanmälan publiceras
   bredvid ett verksamhetsnamn över huvud taget? Om ja, under vilka villkor:
   tröskelvärde, tidsfördröjning, aggregering, uttrycklig upplysning om att anmälan
   inte är prövad? Om nej, ska posten utgå helt?
3. **Enskild firma.** Ska vi köra en bolagsformskontroll och tillämpa striktare
   regler för enskilda firmor och för bolag där ägarens namn ingår i firman? Räcker
   NJA 1950 s. 250 för att motivera det, och är den gränsen praktiskt dragbar?
4. **Bemötande före publicering.** Måste verksamheten få kommentera innan en
   händelse publiceras, och med vilken frist? Räcker den publicerade
   rättelse- och genmälesvägen vi redan har? Aftonbladet-avgörandet tyder på att
   det är den fråga som avgör.
5. **Gallring och preskription.** Eftersom preskriptionen enligt YGL 7 kap 3 § inte
   börjar löpa förrän posten tas bort, ska en händelse avpubliceras automatiskt
   efter en viss tid? Vilken? Det är lika mycket en produktfråga som en juridisk.
6. **Takedown-rutinen.** Hur ska en rutin enligt YGL 6 kap 6 § se ut i praktiken,
   och hur dokumenteras en underrättelse så att tvåveckorsfristen går att bevisa?
   Se RH 2021:51 om hur underrättelser ska vara utformade.

Två frågor som INTE ska ställas, eftersom de redan är besvarade i `R4` och bara
kostar pengar att ställa om: om ett aktiebolag kan förtalas, och om utgivningsbeviset
undantar oss från GDPR.

---

## 4. Källkartläggningen

Varje spår prövas mot en enda fråga: **går uppgiften att koppla till EN verksamhet
med tillräcklig säkerhet?** En felaktig koppling är värre än ingen koppling.

### 4.1 Folkhälsomyndighetens utbrottsdata

**Det finns inget publikt utbrottsregister och inget utbrottsarkiv.**
Sjukdomsstatistiken ur SmiNet redovisas per region, år, ålder, kön och smittland.
Aldrig per plats, aldrig per verksamhet. Individdata är sekretessbelagd och kräver
databeställning.

Myndighetens egen sjukdomsinformation om livsmedelsburna utbrott skriver
anonymiserat och gör det uppenbart att anonymiseringen är avsiktlig: "samtliga hade
ätit på en lokal pizzeria", "på ett företag i Stockholm insjuknade 2015 omkring 500
personer". Samma sida anger att det inträffar ungefär 250 utbrott och 2 000 till
3 000 sjukdomsfall årligen.

Den årliga sammanställningen ges inte ut av Folkhälsomyndigheten utan av
Livsmedelsverket. Folkhälsomyndigheten bidrar med uppgifter via smittskyddsläkare
och laboratorier. Se §4.2.

**På dataportal.se finns en enda träff på ordet matförgiftning i hela den nationella
dataportalen**, och det är Nationella miljöhälsoenkäten 1999. Noll träffar på
föreläggande, förelägganden, vite och tillsynsbeslut.

**Dom: nej.** Ingen strukturerad data, inga namn, ingen väg vidare.

### 4.2 Livsmedelsverkets matförgiftningsrapportering

Det här är den bästa källan som finns, och den räcker inte. Båda rapporterna nedan
är hämtade och lästa i original med `pipeline/prikko/pdf.py`.

**L 2025 nr 11, Rapporterade misstänkta matförgiftningar 2024.** Sammanställningen
bygger på **381 rapporter med sammanlagt 2 312 sjukdomsfall**. 374 av rapporterna kom
från kommunal kontroll, 7 från Folkhälsomyndigheten och Livsmedelsverket i samråd.
354 av rapporterna gällde två eller fler personer med gemensam smittkälla, 27 gällde
enstaka fall.

Rapporten är ovanligt öppen med sina egna svagheter, och två meningar ur den
avgör hela spåret:

> "Ingen uppföljning har gjorts av hur konsekvent resultat av utredningar har
> rapporterats in till Livsmedelsverket. Det finns även data som pekar på att endast
> en mindre andel av de personer som drabbas av matförgiftning anmäler detta till
> aktuell kommun."

**Smittämnet var okänt i 85 procent av rapporterna, 325 av 381.** Bara 32 rapporter
hade både smittämne och misstänkt livsmedel identifierat. 64 procent av de rapporter
som angav kontamineringsplats pekade på "storhushåll såsom restauranger, skolor,
vårdinrättningar och liknande serveringsmiljöer", vilket är en kategori och inte en
anläggning. Ett dödsfall rapporterades, kopplat till listeria i ost. Nio rapporter
angav sjukhusvård, med nio personer.

**Ingen verksamhet namnges någonstans i rapporten.** Den finaste platsangivelsen är
kommun, och för de fyra utbrotten i Bilaga I står det "ett nationellt utbrott utrett
av SUBU". Rapporten finns bara som PDF, utan API och utan öppna data.

**L 2025 nr 03, Analys av rapporterade matförgiftningar 2019 till 2023**, är den som
avgör frågan, för den har en tabell per kommun. Ordagrant:

> "Under 2019 till 2023 rapporterade 142 av Sveriges 290 kommuner matförgiftningar
> till Livsmedelsverket. Rapporterna gällde sammanlagt 1 621 händelser, med 10 139
> sjukdomsfall. I genomsnitt blir det 324 rapporter och 2 027 sjukdomsfall per år."

Tabell B3 ger talen per kommun. Våra tolv, rapporter över fem år med sjukdomsfall
inom parentes:

| Kommun | Rapporter 2019 till 2023 |
|---|---|
| Uppsala | 71 (488) |
| Jönköping | 57 (477) |
| Örebro | 54 (399) |
| Karlstad | 51 (239) |
| Stockholm | 39 (230) |
| Linköping | 8 (22) |
| Kristinehamn | 1 (1) |
| Lomma | 1 (5) |
| Oskarshamn | 1 (1) |
| Borgholm | står inte i tabellen |
| Höganäs | står inte i tabellen |
| Svenljunga | står inte i tabellen |
| **Summa** | **283 på fem år** |

Tre tal ur den tabellen bär hela avsnittet.

**283 rapporter på fem år, alltså ungefär 57 per år, mot 16 047 verksamheter.** Även
i det omöjliga fallet att vi fick veta vilken verksamhet varje rapport gällde skulle
det röra 0,35 procent av sidorna per år.

**Stockholm 39, Göteborg 222.** Stockholm har nästan dubbelt så många
livsmedelsverksamheter som Göteborg och rapporterar en sjättedel så många
matförgiftningar. Talet mäter förvaltningens utredningsvilja, inte maten. Rapporten
säger det själv: skillnaderna beror delvis "på att kommuner lägger olika mängd
resurser på att utreda och rapportera matförgiftningar".

**Tre av våra tolv kommuner står inte i tabellen alls.** En nolla där betyder inte
att ingen blivit sjuk. Det är exakt samma fälla som metodiksidan redan varnar för i
avsnittet om att vissa utfall är omöjliga i vissa kommuner.

Rapporteringen sker via webbformulär i systemet Imyr sedan januari 2020. Inget öppet
gränssnitt, ingen CSV.

**Dom: nej.** Rätt sorts uppgift, fel upplösning, och ett tal som mäter något annat
än det ser ut att mäta.

### 4.3 Regionernas smittskyddsenheter

Årsrapport Smittskydd Västra Götaland 2025, 93 sidor, lästes igenom. Ordet
restaurang förekommer noll gånger. Ordet matförgiftning förekommer noll gånger.
Ordet utbrott förekommer sex gånger, samtliga i förbigående. Rapporten är byggd
sjukdom för sjukdom med fallantal per ålder, kön och smittland.

Region Stockholm och Region Skåne publicerar motsvarande årsrapporter i samma
format. Ingen strukturerad data, inget API, inga namn.

**Namngivna fall finns, men i pressen och inte hos myndigheten.** Två exempel från
2025: en restaurang på Östermalm som stängde självmant efter ett listeriautbrott med
ett tjugotal sjukhusvårdade och omkring 80 anmälningar till Stockholms stad, och två
sushirestauranger i Lerum med över 300 respektive 340 insjuknade. Storleksordningen
är en handfull namngivna fall per år mot 381 rapporterade. Under två procent, och
urvalet styrs av medieintresse.

Att bygga en händelsedatabas på tidningsartiklar vore att göra pressens
nyhetsvärdering till vår urvalsprincip, och att göra ett eget orsakspåstående i
andra hand. Det faller på §3.4.

**Dom: nej.**

### 4.4 Livsmedelsverkets återkallelser

Här finns faktiskt fungerande teknik. RSS-flödet på
`livsmedelsverket.se/rss/rss-aterkallanden/` svarar och är maskinläsbart. Volymen är
61 till 63 återkallanden under 2023, som var ett rekordår med en ökning på 41
procent mot 2022. Motsvarande tal för 2024 är okontrollerat.

Problemet är objektet. Posterna ser ut så här: "Spendrups återkallar
kartongförpackning med Trocadero Zero, kan innehålla öl", "Ica återkallar
hamburgerost, kan innehålla metallbitar". Avsändaren är företaget, uppgiften gäller
en produkt, och den verksamhet som namnges är tillverkaren eller kedjan.

**En restaurang som serverat en återkallad vara syns ingenstans.** Det finns ingen
koppling från produkt till serveringsställe i någon källa, och att göra den kopplingen
själv vore att uppfinna ett samband. RASFF Window har ingen fungerande publik API,
och notifieringarna avslöjar per konstruktion inte varumärke eller företag.

Återkallelser skulle möjligen kunna visas på en dagligvarukedjas sidor. Men det är en
annan produkt än den beställda, det är den yta där vi står svagast mot en betalande
part, och det löser inte den fråga ägaren ställde.

**Dom: nej för verksamhetssidan.** Rätt sorts data om fel objekt.

### 4.5 Tillfälliga stängningar och förelägganden

Det här är det enda spåret som bär, och det finns tre saker att veta om det.

**Kommunerna samlar in uppgiften per verksamhet.** Livsmedelsverkets
myndighetsrapportering kräver att varje myndighetsbeslut rapporteras för sig, kopplat
till avvikelse och verksamhet, med sju svarsalternativ: föreläggande avseende visst
livsmedel, föreläggande avseende verksamheten, förbud avseende visst livsmedel,
förbud avseende del av verksamheten, stängning och förbud mot hela verksamheten,
sanktionsavgift, anmälan för åtal. Plus beslutsdatum och vite.

**Nationellt, 2024.** Ur L 2025 nr 13, Sveriges livsmedelskontroll 2024, hämtad och
läst i original. Nämnaren är drygt 95 000 verksamheter i leden efter
primärproduktionen. 48 773 verksamheter kontrollerades, 19 918 fick minst en
avvikelse, och 3 764 fick ett beslut med krav på verksamheten.

| Åtgärd | Antal 2024 |
|---|---|
| Föreläggande avseende verksamheten eller anläggningen | 3 889 |
| Förbud avseende visst livsmedel | 520 |
| Föreläggande avseende visst livsmedel | 489 |
| Förbud avseende del av verksamheten | 225 |
| Stängning eller förbud mot hela verksamheten | **118** |
| Sanktionsavgift | 251 |
| Åtalsanmälan | 5 |

**118 stängningar på drygt 95 000 verksamheter är 0,12 procent på ett år.** Det är
den starkaste händelse som existerar i svensk livsmedelskontroll, och den är
osynlig.

Andelen verksamheter med avvikelse som får ett beslut har stigit från 12 procent
2021 till 20 procent 2024. Tillämpningen är extremt ojämn: Göteborg fattade beslut
vid 687 av 777 verksamheter med avvikelse, alltså 88 procent, medan **65
kontrollmyndigheter inte fattade ett enda beslut under 2024** trots att de noterat
minst en avvikelse vid nästan 1 400 verksamheter.

**Våra tolv kommuner, ur Bilaga 11.**

| Myndighet | Verksamheter | Kontrollerade | Med avvikelse | Med beslut |
|---|---|---|---|---|
| Stockholm | 9 400 | 5 324 | 1 570 | 228 |
| Uppsala | 1 888 | 942 | 516 | 118 |
| Jönköping | 1 345 | 737 | 218 | 19 |
| Linköping | 1 311 | 822 | 356 | 78 |
| Örebro | 1 289 | 714 | 401 | 109 |
| Karlstad | 714 | 466 | 293 | 32 |
| Borgholm | 353 | 206 | 31 | 0 |
| Höganäs | 310 | 172 | 52 | 1 |
| Oskarshamn | 273 | 126 | 58 | 3 |
| Kristinehamn | 234 | 118 | 56 | 9 |
| Lomma | 158 | 99 | 70 | 1 |
| Svenljunga | 110 | 35 | 17 | 1 |
| **Summa** | **17 385** | **9 761** | **3 638** | **599** |

**599 verksamheter i våra kommuner fick ett beslut med krav på verksamheten under
2024.** Det är en volym som bär ett avsnitt. Den är dessutom av rätt sort: ett
myndighetsbeslut om en namngiven anläggning, som faller under §3.4:s säkra sida och
under allmänintresseventilen i OSL 30 kap 27 § andra stycket.

**Men uppgiften finns inte i någon öppen data.** Den nationella specifikationen från
Sambruk har 44 fält, och inget av dem heter beslut, föreläggande, förbud, stängning,
sanktionsavgift eller vite. Kommunerna sitter på uppgifterna i sina
ärendehanteringssystem, rapporterar dem till Livsmedelsverket, och specen ber inte
om dem. Livsmedelsverkets Bilaga 11 ger antal per myndighet, aldrig per verksamhet.

**Vad vår egen data säger.** Ingen av de tolv källmodulerna har ett fält för
föreläggande, förbud, vite, sanktionsavgift eller stängning. Sökt på samtliga.
Två undantag finns och båda är små:

- **Kristinehamn** publicerar sina delegationsbeslut som PDF-bilagor på samma lager
  som kontrollrapporterna. **9 av 354 bilagor är förelägganden**, och de utesluts
  uttryckligen i `kristinehamn.py`, eftersom ett beslut inte är en kontroll och den
  kontroll som ledde fram till beslutet redan publiceras som en egen rapport. Det är
  rätt beslut för kontrollhistoriken. Det är också det enda stället i beståndet där
  förelägganden faktiskt finns i maskinläsbar form.
- **Lomma** har en röd prick som per kommunens egen läsanvisning betyder "allvarliga
  avvikelser som kräver myndighetsåtgärder, till exempel föreläggande eller förbud".
  Det är skalans villkor, inte ett redovisat beslut. **2 poster av 157.** Höganäs har
  0 röda av 333.

**Dom: ja, men bara via begäran.** Förelägganden och stängningsbeslut är
förvaltningsbeslut och därmed offentliga handlingar. De går att begära ut per kommun.
Det är 290 manuella processer utan maskinellt gränssnitt, vilket är exakt den väg vi
redan går för kontrollerna, och kampanjen till 275 kommuner ligger ändå i kön. Se
`docs/25`.

### 4.6 Vad som redan finns i vår egen data

Beställningen ber oss kolla i vår egen data först. Det gav det mest överraskande
fyndet i hela dokumentet.

**Kontrollsorten finns redan, och den visas redan.** `grading.py` har tre värden:
`ROUTINE = 0`, `FOLLOWUP = 1`, `COMPLAINT = 2`. `data.ts` översätter dem till
"Planerad kontroll", "Återbesök" och **"Händelsestyrd kontroll"**, och
`InspectionHistory.astro` skriver ut etiketten på varje rad. Att ett anmälningsdrivet
besök har skett står alltså redan på verksamhetssidan.

Sex av tolv källmoduler kan producera värdet. Fem gör det i dag.

| Kommun | Verksamheter | Kontroller | Händelsestyrda | Verksamheter med minst en |
|---|---|---|---|---|
| Stockholm | 8 520 | 47 330 | 1 373 | 1 050 |
| Örebro | 1 233 | 5 488 | 329 | 213 |
| Linköping | 1 246 | 9 131 | 298 | 164 |
| Jönköping | 1 115 | 2 003 | 157 | 129 |
| Borgholm | 406 | 413 | 1 | 1 |
| Uppsala | 1 854 | 2 894 | 0 | 0 |
| Karlstad | 696 | 610 | 0 | 0 |
| Höganäs | 316 | 339 | 0 | 0 |
| Oskarshamn | 239 | 215 | 0 | 0 |
| Kristinehamn | 170 | 221 | 0 | 0 |
| Lomma | 153 | 150 | 0 | 0 |
| Svenljunga | 99 | 164 | 0 | 0 |
| **Totalt** | **16 047** | **68 958** | **2 158** | **1 557** |

Uppsala kan producera värdet, `uppsala.py` har både "Händelsestyrd kontroll" och
"Klagomål" i sin tabell, men beståndet innehåller noll. De sex nedersta kommunerna
kan inte producera det alls.

**Räknat på konsumentvända verksamheter**, alltså restauranger, caféer och butiker
enligt `categories.ts`, är nämnaren **9 769**. Av dem har **1 245 minst en
händelsestyrd kontroll**, och **1 175 en de senaste tre åren**, alltså 12,0 procent.

Och sedan kommer talet som avgör om det här får bli ett eget avsnitt.

**Av de 1 175 verksamheterna har 955, alltså 81,3 procent, bedömningen "inga
anmärkningar" i dag. 341 av dem bär utmärkelsen ren historik.**

De 1 495 händelsestyrda kontrollerna hos dessa verksamheter de senaste tre åren
utföll så här:

| Utfall vid det händelsestyrda besöket | Antal | Andel |
|---|---|---|
| Inga anmärkningar | 931 | 62,3 % |
| Mindre anmärkning | 562 | 37,6 % |
| Allvarlig anmärkning | 2 | 0,1 % |

**669 verksamheter, 56,9 procent av dem som haft ett händelsestyrt besök, fick inte
en enda anmärkning vid något av besöken.**

Ett avsnitt som lyfter ut den uppgiften ur kontrollhistoriken och ger den egen
rubrik skulle alltså sätta ett larm på 1 175 sidor, varav fyra av fem har rent
mjöl i påsen enligt vår egen modell, och där besöket i sex fall av tio inte hittade
någonting. Det är inte att visa data. Det är att byta inramning på data som redan
står på sidan.

Och innehållet i händelsen får vi ändå inte veta. Ett tips om skadedjur, ett
klagomål på ljudnivå och en matförgiftningsanmälan med fyrtio sjuka ser identiska ut
i fältet.

**Dom: uppgiften ska stå kvar där den står, i kontrollhistoriken, med den etikett
den redan har.**

### 4.7 Vad andra länder gör

Frågan är värd att ställa eftersom den avgör om vår slutsats är svensk försiktighet
eller en egenskap hos ämnet.

| Land | Per verksamhet | Händelser | Namnger händelsen en verksamhet |
|---|---|---|---|
| Storbritannien, FSA | FHRS med öppet API | Food Alerts API | Nej |
| USA, CDC | Inget nationellt | NORS, 66 713 rader | Nej i datan |
| Danmark, Fødevarestyrelsen | Smiley, XML med 58 781 verksamheter | Inget | Nej |

Brittiska FSA:s Food Alerts, 1 348 varningar totalt och 160 under 2024, har fältet
`reportingBusiness`, och det innehåller tillverkaren eller kedjan: Reckitt, Lidl GB,
Co-op. Aldrig en enskild restaurang.

CDC:s NORS-dataset har fältet `setting`, som kan vara "Restaurant", men **det finns
inget namnfält**. CDC namnger i sina redaktionella utredningsnotiser, mest känt
McDonald's Quarter Pounder hösten 2024, men det är kedjor och det är journalistik i
myndighetsform, inte data.

Danmarks smiley-fil har 26 fält och 58 781 verksamheter. **Inget fält för bøde,
påbud, forbud eller lukning.** Även vår förebild publicerar rena kontrollresultat.

**Slutsats: det är ämnet, inte Sverige.** Ingen av de tre länder som gjort mest av
livsmedelskontroll som konsumentinformation kopplar händelser till enskilda
serveringsställen. Det är en upplysning som är värd mer än den ser ut: det finns
ingen förebild att kopiera, och den som bygger det först får också vara den som
prövar det juridiskt.

---

## 5. De tre allvarlighetsgraderna

Ägaren har sett problemet rätt. Tre nivåer som aldrig får glida ihop. Fyra regler
följer, och de gäller oavsett vilket spår som byggs.

**Regel 1. Källan avgör ordvalet, inte allvaret.** Skriv aldrig vad som hände. Skriv
vad någon gjorde med uppgiften. Det är §3.4 formulerat som en skrivregel.

| Nivå | Vad raden faktiskt vet | Formuleringen |
|---|---|---|
| Myndighetsbeslut | Beslutet finns, med datum och beteckning | "Föreläggande, 4 mars 2026" |
| Anmälningsdrivet besök | Kommunen kom på grund av något | "Händelsestyrd kontroll, 4 mars 2026" |
| Anmälan utan besök | Någon har anmält | Publiceras inte, se §7 |

**Regel 2. Ordet "matförgiftning" får inte stå på en verksamhetssida.** Vi har inte i
något av spåren en uppgift som binder en matförgiftning till en verksamhet. Ordet i
sig gör kopplingen i läsarens huvud oavsett vilka förbehåll som står runt det. Detta
är den enda absoluta språkregeln i dokumentet.

**Regel 3. Ett antal är ett påstående, och det starkaste vi kan göra.** "Sju
anmälningar" läses som sju bekräftelser. Om ett tal någon gång ska visas ska
nämnaren stå bredvid, och nämnaren ska vara den som gör talet ärligt: hur stor andel
av besöken som ledde till en notering. Den meningen finns redan skriven, i
`vad-hander-nar-du-anmaler-en-restaurang.mdx`, och den hör hemma i en artikel med
sitt underlag utskrivet. På en verksamhetssida finns ingen plats där ett sådant tal
kan stå utan att nämnaren trängs bort.

**Regel 4. Ingen färg, inget märke, ingen ruta som liknar bedömningsblocket.**
`docs/15` §6 säger redan detta om varje klass 3-uppgift, och en händelse vore klass 3
med råge. Grönt, gult och rött är bedömningens språk och lånas inte ut. Ett larm i
rött bredvid ett grönt ansiktsmärke är inte två uppgifter, det är en motsägelse som
läsaren löser genom att lita på den skarpaste.

**Och den bindande regeln som ägaren själv satt: bedömningen ändras aldrig av en
händelse.** Den behöver ingen ny motivering, men den har en teknisk konsekvens som
ska skrivas ned: `docs/15` §6 tillåter att en klass 3-uppgift **tonar ned** en
klass 2-uppgift, aldrig att den skärper den. En bekräftad stängning skulle alltså få
flytta en sida från aktuellt besked till historik, precis som en bekräftad konkurs
får göra i dag. Det är att dämpa ett påstående, och att dämpa är alltid ofarligt.

---

## 6. Det tomma fallet, som är det verkliga hindret

Nästan alla sidor skulle sakna innehåll. Med dagens data: **14 490 av 16 047
verksamheter, 90,3 procent, har ingen händelse alls.** Räknat på konsumentvända blir
det 8 524 av 9 769, alltså 87,3 procent.

Frestelsen är att skriva "Inga kända händelser". Den meningen får inte skrivas, och
skälet är mätt.

**Vi ser 54,2 procent av de händelsestyrda kontroller som faktiskt gjordes.**
Livsmedelsverkets myndighetsrapportering för 2024 säger vad varje kommun gjorde. Vi
har den datan redan, i `site/src/data/riket/kontrollen.json`. Jämförelsen ser ut så
här:

| Kommun | Kontroller 2024 enligt LV | Vi ser | Händelsestyrda enligt LV | Vi ser |
|---|---|---|---|---|
| Stockholm | 7 921 | 6 057 | 563 | 407 |
| Uppsala | 1 954 | 573 | 62 | **0** |
| Linköping | 1 430 | 1 193 | 60 | 65 |
| Örebro | 1 353 | 802 | 120 | 56 |
| Jönköping | 1 197 | 577 | 157 | 39 |
| Karlstad | 903 | 140 | 70 | **0** |
| Höganäs | 250 | 65 | 1 | 0 |
| Borgholm | 252 | 229 | 0 | 0 |
| Oskarshamn | 200 | 21 | 4 | 0 |
| Kristinehamn | 182 | 22 | 4 | 0 |
| Lomma | 174 | 19 | 5 | 0 |
| Svenljunga | 53 | 34 | 0 | 0 |
| **Summa** | **15 869** | **9 732** | **1 046** | **567** |

Uppsala gjorde 62 händelsestyrda kontroller under 2024 och vi ser noll. Karlstad
gjorde 70 och vi ser noll. **En sida i Uppsala som säger "inga kända händelser" ljuger
inte om verksamheten, den ljuger om oss.**

Linköping visar 65 mot Livsmedelsverkets 60, alltså fler än myndighetens eget tal.
Skillnaden är oförklarad och ska utredas innan någon av raderna används på en sida.
Sannolikt beror den på hur datum tillskrivs år, men det är en gissning.

Huset har redan svaret på den här frågan, och det står på metodiksidan:

> "En nolla där betyder inte att det aldrig hänt, utan att det aldrig kunde synas."

Samma sida har också regeln om varför ett förbehåll inte får dyka upp ibland: "Ett
förbehåll som bara dyker upp ibland lär läsaren att frånvaron betyder att historiken
är säker, och det vore en falsk trygghet på just de sidor där risken är störst."

**Praktisk regel: ett händelseblock renderas bara när det har innehåll. Det finns
ingen tom variant, ingen etikett, ingen rubrik som står kvar utan rader.** Det är
samma regel som `docs/15` §2 redan satt för panelblocken och som `docs/33` §7 använde
för att inte bygga ett filter på öppettider.

---

## 7. Domen

### 7.1 Vad som inte ska byggas

**Ett avsnitt som heter "Händelser" ska inte byggas.** Fem skäl, i fallande ordning
av tyngd.

1. **Fyra av de fem posterna har ingen data som pekar på en verksamhet.** §4.1 till
   §4.4.
2. **Den femte posten finns redan på sidan** som "Händelsestyrd kontroll" i
   kontrollhistoriken. §4.6.
3. **Att flytta ut den till ett eget avsnitt ändrar inte fakta utan bara
   inramningen**, på 1 175 sidor varav 81,3 procent har rent besked. §4.6.
4. **Det tomma fallet går inte att skriva ärligt** när vi ser 54,2 procent av det
   som hänt. §6.
5. **Ordet är upptaget** av rörelseloggen. §2.

**Historiken följer lokalen, inte företaget, och det slår hårdare mot en händelse än
mot en kontroll.** Metodiksidan säger redan att ingen källa har ett fält för när en
verksamhet startade eller om ägaren bytt. En kontroll som hör till en tidigare
innehavare är en olycklig men förklarlig fläck. Ett utbrott som hör till en tidigare
innehavare är en anklagelse mot fel person, och den mildras inte av att vi skriver ut
förbehållet. Detta är i sig ett tillräckligt skäl att inte bygga något som binder en
allvarlig händelse till en lokal.

### 7.2 Vad som ska byggas i stället, och inte förrän data finns

**Ett spår, och det kostar en rad i ett mejl.**

Lägg till förelägganden, förbud och beslut om stängning i utlämnandebegäran till de
275 kommunerna. Kampanjen ligger ändå i kön, se `docs/25`, och begäran har redan
rätt juridiska fäste: OSL 30 kap 27 § andra stycket, som är skriven för precis den
här sortens uppgift hos precis den här sortens nämnd. `R11` §1.6 har formuleringen,
och rådet där gäller fortfarande: ta inte upp paragrafen i det första mejlet, spara
den till ett eventuellt nej.

När, och bara när, minst en kommun lämnat ut beslut i maskinläsbar form gäller
följande:

**Beslutet visas i kontrollhistoriken, inte i ett eget avsnitt.** Det hör hemma
bredvid den kontroll som utlöste det, och de flesta kommuner levererar sannolikt
ärendenumret som binder dem. En egen ruta gör beslutet till en anklagelse. En rad i
tidslinjen gör det till vad det är: nästa steg efter en avvikelse.

**Raden bär beslutets ordalydelse, inget mer.** Beslutstyp, datum, beteckning. Inget
sammandrag, ingen tolkning, ingen färg ur bedömningsskalan. §5 regel 1 och 4.

**Replikrätten utökas till att gälla beslut.** `OwnerReply.astro` är i dag bunden till
en kontroll. Ett beslut ska kunna besvaras på samma sätt, med samma löfte om att
svaret publiceras oredigerat. Aftonbladet-avgörandet i §3.7 gör det till den
billigaste riskdämpningen som finns.

**Bedömningen rörs inte.** Ett föreläggande får inte skärpa en bedömning. Modellen
läser redan allvaret ur kommunens egen `assessment`, och den kontroll som ledde till
beslutet finns redan i underlaget. Att räkna beslutet också vore att räkna samma sak
två gånger.

Förväntad volym om spåret fungerar: 599 verksamheter i våra tolv kommuner fick ett
beslut under 2024, mot 17 385 verksamheter i registret. Ungefär 3,4 procent på ett
år. Det är i samma storleksordning som en anständig panelfunktion, och långt över
tröskeln i `docs/15` §2.

### 7.3 Vad som ska göras nu, som inte kostar något

**Ingenting på verksamhetssidan.**

Materialet i §4.2 är däremot ovanligt bra artikelstoff, och det finns redan
artiklar som äger ämnet. `matforgiftning-fran-restaurang.mdx` och
`vad-hander-nar-du-anmaler-en-restaurang.mdx` bygger på vårt eget bestånd. De två
talen som gör mest nytta i dem är nya:

- **142 av Sveriges 290 kommuner rapporterade en enda matförgiftning under fem år**,
  och Stockholm rapporterade 39 mot Göteborgs 222. Det förklarar för en läsare varför
  hon inte ska läsa ett kommuntal som ett mått på maten.
- **Smittämnet var okänt i 85 procent av rapporterna.** Det är det ärligaste svaret
  som finns på frågan "vad var det jag blev sjuk av".

Det är den tillåtna versionen av den berättelse vi annars inte får berätta, exakt som
`docs/12` beskrev Kolada-spåret. Aggregat, med namngiven källa och attribution enligt
`docs/18`. Ingen ny sida, ingen ny funktion, ingen ny risk.

---

## 8. Vad som måste vara på plats innan en rad kod skrivs

I ordning. Punkt 1 och 2 är blockerande.

1. **En kommun har faktiskt lämnat ut ett beslut.** Utan ett verkligt beslut i handen
   är varje designbeslut en gissning om fältnamn, ordalydelse och koppling till
   kontroll. Detta är samma regel som `docs/29` följde när den mätte noll innan den
   skrev något.
2. **Juristen har svarat på fråga 1, 2 och 4 i §3.8**, alltså
   formuleringsstandarden, statusen för misstänkt matförgiftning, och om bemötande
   krävs före publicering. De tre avgör om spåret alls är byggbart och hur raden ska
   låta.
3. **Utgivningsbevis ansökt, eller ett medvetet beslut att avstå.** 4 000 kronor,
   en utsedd utgivare, tio års giltighet. Det skyddar inte mot förtal, se §3.2, men
   det ger ensamansvar, jury och takedown-regeln, och handläggningstiden är
   okontrollerad vilket gör det till det som ska startas först. Utgivaren tar ett
   personligt straffrättsligt ansvar, och det är den enda punkten i hela dokumentet
   som inte går att koda bort.
4. **Sexmånadersarkiveringen av publicerade sidor finns i CI.** Det är ett formkrav
   för databaser med utgivningsbevis och det står redan som punkt 5 i `R4` §6. Det är
   billigt nu och omöjligt att rekonstruera senare.
5. **Replikrätten är utbyggd till att gälla beslut**, inte bara kontroller.
6. **Gallringspolicyn är bestämd.** Hur länge en händelse står kvar. Frågan är både
   juridisk, YGL 7 kap 3 §, och redaktionell, och den ska besvaras innan den första
   raden publiceras, inte efter.
7. **Fältet är inbyggt så att det kan släckas enskilt.** `docs/15` §6 kräver det av
   varje anrikat fält, och för en händelse är kravet skarpare än för en öppettid.

Och en punkt som inte är ett krav men som ändå ska övervägas när spåret lyckas:
**be Sambruk lägga in beslutsfältet i specifikationen.** Kommunerna rapporterar redan
uppgiften till Livsmedelsverket i strukturerad form. Att den saknas i den nationella
öppna data-specifikationen är ett förbiseende och inte ett ställningstagande. Det är
den enda åtgärd i dokumentet som skulle lösa problemet för alla 290 kommuner samtidigt
i stället för en i taget.

---

## 9. Vad som är okontrollerat

Skrivs ut så att nästa läsare vet var golvet slutar.

**Tre rapporter är hämtade och lästa i original** med `pipeline/prikko/pdf.py`, och
varje tal ur dem i det här dokumentet är avläst ur texten: L 2025 nr 11, L 2025
nr 03 och L 2025 nr 13. **Alla tal om det egna beståndet är räknade 2026-08-18** mot
`site/src/data/*.json` med `categories.ts` som kategoritabell. Övriga uppgifter är
avlästa ur lagtext, domar och myndighetssidor, eller ur `research/R4` och `R11`.

| Fråga | Status |
|---|---|
| Varför myndigheterna inte namnger verksamheter vid utbrott | Ingen publicerad policy funnen. Hypotesen i §3.6 är min egen. |
| Antal återkallanden per år | 61 till 63 för 2023 kommer ur en branschtidning, inte ur Livsmedelsverket. Talet för 2024 är inte kontrollerat. RSS-flödet är däremot prövat och svarar. |
| Om någon kommun redan publicerar förelägganden som öppna data | Sökt på dataportal.se med noll träffar. Inte prövat mot varje enskild kommuns egen webbplats. |
| Varför Linköping visar 65 händelsestyrda mot Livsmedelsverkets 60 | Oförklarat. §6. |
| Skillnaden mellan 9 769 konsumentvända här och 9 961 i `docs/33` | Uppmätt med samma tabell men annat urval eller annan ögonblicksbild. Ska mätas om innan något av talen citeras vidare. 226 poster i Höganäs och Kristinehamn kan inte placeras alls, och 86 i Linköping saknar typ. |
| Om beslut går att koppla till rätt kontroll när en kommun väl lämnar ut dem | Okänt tills vi sett ett riktigt utlämnande. Avgör om beslutet kan bo i tidslinjen. |
| Om Mediemyndighetens handläggningstid för databasärenden | Publiceras inte. Ska frågas per mejl. |
| Vad SOU 2024:75 leder till | Remisstiden gick ut 10 mars 2025. Utfallet är okänt. `R4` §2 har bevakningslistan. |
| Om anslutning till Medieombudsmannen är värd 13 000 kronor per år | Inte utvärderad. Nämns här för att den dök upp i researchen. |
| L 2025 nr 11 är internt inkonsekvent för 2023 | Figur 1 och Bilaga III anger 410 mot 406 utbrott och 2 147 mot 2 026 fall. Använd inte 2023 års tal utan att välja källa. |

---

## 10. Sammanfattning i en tabell

| Post i beställningen | Finns datan | Namnger den en verksamhet | Volym | Dom |
|---|---|---|---|---|
| Bekräftat sjukdomsutbrott | Nej, bara aggregat i PDF | Nej | 381 rapporter i hela landet 2024 | Bygg inte |
| Misstänkt matförgiftning | Nej publikt | Nej | 283 på fem år i våra kommuner | Bygg inte |
| Återkallelse | Ja, RSS | Produkten och tillverkaren | 61 till 63 år 2023 | Fel objekt |
| Tillfällig stängning | Hos kommunen, ej publicerad | Ja, i beslutet | 118 i hela landet 2024 | Begär ut |
| Föreläggande | Hos kommunen, ej publicerad | Ja, i beslutet | 599 verksamheter i våra kommuner 2024 | Begär ut |
| Händelsestyrd kontroll | Ja, redan i beståndet | Ja | 2 158, varav 1 975 senaste tre åren | Står redan på sidan |
