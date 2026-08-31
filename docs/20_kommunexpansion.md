# 20. Kommunexpansionen: kartläggning, begäranden och takt

*Byggt 2026-08-05. Kartläggningen är genererad ur källor, inte skriven för
hand, och går att bygga om med ett kommando. Det som är verifierat för hand
bär datum och källa. Det som inte är verifierat står som overifierat.*

Grunden är `research/R11_utlamnandeplan.md`, som utredde juridiken mot
lagtext och Livsmedelsverkets anvisningar. Det här dokumentet bygger
verktygen R11 beställde och lägger till kartläggningen R11 saknade.

---

## 1. Läget, mätt i verksamheter i stället för i kommuner

*Talen i det här avsnittet är från 2026-08-05 och står kvar som de mättes.
Norrköping kopplades in 2026-08-31 och flyttade dem: tretton kommuner,
17 066 verksamheter och 20,2 procent av anläggningarna. Se §11.*

Tolv kommuner av 290 låter som fyra procent. Det är inte det måttet som
avgör om sajten svarar på besökarens fråga.

| Mått | Tal |
|---|---:|
| Kommuner vi publicerar | 12 av 290 |
| Kontrollmyndigheter i landet | 250 |
| Anläggningar i myndigheternas register | 92 746 |
| **Andel av anläggningarna vi har** | **18,8 procent** |

Tolv kommuner bär alltså nästan en femtedel av landets livsmedelsverksamheter,
eftersom Stockholm ensam är 9 456 av dem. Det är det talet kampanjen ska öka,
och det är det talet `pipeline/begaran.py status` skriver ut.

Talet 92 746 är summan av kolumnen "antal verksamheter i registret" i
Livsmedelsverkets rapport "Sveriges livsmedelskontroll 2024" (L 2025 nr 13),
alltså kommunernas egen rapportering.

---

## 2. Kartläggningen

### 2.1 Tre grupper, och vad var och en betyder för oss

| Grupp | Status i registret | Myndigheter | Andel av anläggningarna | Åtgärd |
|---|---|---:|---:|---|
| Redan inläst | `inlast` | 12 | 18,8 % | Ingen |
| Publicerar per verksamhet, ej inläst | `oppen_data` | 0 | 0 % | Bygg adapter |
| Publicerar sammanfattning | `sammanfattning` | 3 | 4,9 % | Mejla |
| Publicerar inget per verksamhet | `inget` | 26 | 28,6 % | Mejla |
| Ingen har kontrollerat | `okand` | 209 | 47,7 % | Kontrollera, sedan mejla |

**Gruppen `oppen_data` är tom, och det är ett resultat och inte en lucka.**
R6 sökte igenom Sveriges dataportal, R9 sökte igenom hela ArcGIS Onlines
publika innehåll för Sverige plus sitemaps för cirka 110 kommuner. Bägge
svepen fann noll nya levande bestånd. De tolv källor vi läser är i praktiken
allt som publiceras maskinläsbart per verksamhet i Sverige i dag. Därför är
mejlvägen inte ett komplement till skrapningen, den är hela återstoden.

Två kommuner till hade källor som gått sönder: Norrköping har kvar
infrastrukturen bakom en nedlagd söksida (R9), och Borås tog ned sina
inspektionssidor någon gång före augusti 2026. Bägge är värda en extra fråga
i mejlet, eftersom datan uppenbart finns i ett system som kunnat mata en
webbsida.

### 2.2 Registret, och varför det är byggt och inte skrivet

`pipeline/data/kommunregister.csv`, en rad per kontrollmyndighet. Byggs med:

    python3 pipeline/fetch_kommunregister.py

Det härleds ur två källor som redan är verifierade och underhåller sig själva:

- **Livsmedelsverkets rapport.** En rad per kontrollmyndighet med antal
  anläggningar. Talet är hela prioriteringsordningen.
- **Kolada.** Kommunkoder och invånarantal för hela riket.

Kopplingen myndighet till kommun görs på att gemensamma nämnder skriver ut
sina medlemskommuner i rapportens tabell. Matchningen sker på hela ord, så
att "Bergslagen" inte blir kommunen Berg, och tillåter genitiv-s, eftersom
rapporten skriver "Härjedalens". Metoden binder 289 av 290 kommuner. Den
sista är Klippan, vars myndighet fick namnet avhugget i PDF:en, och den är
nu ifylld för hand (Söderåsens miljöförbund, verifierat).

Rapportens tabell bryter dessutom långa namn över flera rader, olika i de två
bilagorna, så att samma myndighet kommer ut som två halva poster.
`pipeline/prikko/myndigheter.py` fogar ihop dem på kommunuppsättningen och
behåller det längsta namnet. Ett par namn förblir stympade
("byggnadsnämnd Norberg Fagersta Avesta"). De rättas när någon verifierar
dem, inte genom att gissa.

### 2.3 Det som är skrivet för hand

`pipeline/data/kommunkontakter.csv` läggs ovanpå det byggda registret. Där
står bara det som inte går att härleda: mottagaradress, publiceringsstatus,
myndighetens riktiga namn och verifierad medlemskrets. Varje rad bär datum
och käll-URL, och skriptet vägrar en adress utan verifieringsdatum.

33 myndigheter är verifierade så här långt, och de bär 34,2 procent av
landets anläggningar. Verifieringen gjordes genom att läsa kommunernas egna
sidor. Ingen adress är gissad ur ett mönster, och där adressen inte gick att
belägga står fältet tomt (Gävle är det fallet i dag).

### 2.4 Fyra organisationsförändringar rapporten inte känner till

Rapporten beskriver 2024. Sedan dess har fyra saker hänt som ändrar vem
mejlet ska gå till:

- **Södertörns miljö- och hälsoskyddsförbund upplöstes 2026-06-30.** Haninge,
  Tyresö och Nynäshamn är egna kontrollmyndigheter sedan 2026-07-01. En rad i
  rapporten har blivit tre mottagare, och förbundets 1 087 anläggningar går
  inte att dela upp ur rapporten. De tre står därför utan anläggningstal i
  registret tills nästa årgång kommer.
- **Miljösamverkan östra Skaraborg fick Essunga som sjätte medlem 2026-01-01.**
- **Söderåsens miljöförbund** täcker Klippan, Perstorp, Svalöv och
  Örkelljunga. Rapportens rad hade Klippan avhugget ur namnet, men
  anläggningstalet 457 avser alla fyra.
- **Lunds miljöförvaltning uppgick i samhällsbyggnadsförvaltningen 2025-01-01.**
  Adressen på äldre dokument går inte längre fram.

Sensmoralen är att registret måste byggas om varje år när ny rapport kommer,
och att kontaktfilen måste ha ett verifieringsdatum. En adress är färskvara.

---

## 3. Begäransverktyget

    python3 pipeline/begaran.py omgang --antal 10     # nästa omgång, störst först
    python3 pipeline/begaran.py skriv 1480 1280       # bestämda myndigheter
    python3 pipeline/begaran.py paminnelse 1480       # uppföljning i samma tråd
    python3 pipeline/begaran.py livsmedelsverket      # de två genvägsbreven
    python3 pipeline/begaran.py status                # täckning och uppföljning

Skriptet skriver textfiler till `pipeline/data/begaran/`. **Det skickar
ingenting.** Ägaren skickar ett brev i taget från sin egen adress.

### 3.1 Vad brevet innehåller

Kraven i uppgiften, och var de sitter i texten:

| Krav | Så här |
|---|---|
| Åberopa offentlighetsprincipen | "Rättslig grund: 2 kap. tryckfrihetsförordningen" |
| Maskinläsbart format i första hand | Egen mening, plus formuleringen som utlöser formatkravet i lagen (2022:818) |
| Fråga om avgift innan den utlöses | "Tar ni ut en avgift ber jag er meddela beloppet innan uttaget görs" |
| Identifiera avsändaren | Magoed AB, org.nr 559386-1015, prikko.se i signaturen |
| Kort och artigt | Ryms på en skärm, ingen paragraf som låter som ett hot |

Den juridiskt viktigaste meningen är den om vidareutnyttjande. Utan den får
kommunen lagligt skicka en pappersutskrift (utskriftsundantaget i TF 2 kap.
16 §). Med den inträder formatkravet i öppna data-lagen, en fyraveckorsfrist
och ett avgiftstak. Hela härledningen står i R11 avsnitt 1.4.

### 3.2 Vad som gör breven till brev och inte till en mall

Varje brev bär fyra uppgifter som bara gäller mottagaren, alla hämtade ur
registret: myndighetens namn, samtliga kommuner den är kontrollmyndighet för,
antalet anläggningar de själva rapporterat, och vad de publicerar i dag. Ett
brev till Miljöförbundet Blekinge Väst börjar med "livsmedelskontrollen i
Olofström, Karlshamn och Sölvesborg". Det är inte en variabel i en mall, det
är kunskap om mottagaren.

Juridiken och beskrivningen av vad datan ska användas till varieras däremot
aldrig. Den är prövad, och myndigheter i samma län läser varandras
handlingar.

### 3.3 Gränser som är inbyggda, inte påminda om

- **Ingen robot fyller i någon e-tjänst.** Där kommunen anvisar en e-tjänst
  skrivs brevet ändå, med e-tjänstens adress i Till-raden, så att ägaren kan
  klistra in texten för hand. Villkoren förbjuder oftast maskinell åtkomst,
  flera tjänster har CAPTCHA, och relationen till myndigheterna är värd mer
  än tiden det skulle spara.
- **Inget brev utan verifierad mottagare.** Saknas adressen kastar skriptet.
- **Inget brev till någon vars data vi redan har eller kan hämta själva.**
- **Inget brev utan avsändaradress.** `SENDER_EMAIL` är tom tills ägaren
  fyller i den, och skriptet vägrar dessförinnan.

---

## 4. Spårningen

`pipeline/data/utlamnanden.csv`, en rad per myndighet, kolumnerna enligt R11
avsnitt D. CSV och inte kalkylark, så att den kan versionshanteras och
diffas. `omgang` och `skriv` lägger in raden med `utfall: utkast`, ägaren
fyller i `skickat` och `diarienummer` när brevet gått.

`status` läser filen och svarar på tre frågor: hur stor täckning vi har, vad
som väntar, och vad som behöver följas upp i dag. Uppföljningsschemat är
R11:s: påminnelse dag 7, fristpåminnelse dag 21, begäran om skriftligt beslut
dag 30, och beslut om överklagande dag 45. Skriptet skriver ut vilken av dem
som är aktuell och `paminnelse`-kommandot skriver texten.

Kolumnen `villkor` är den lätta att glömma och dyra att sakna. Lämnar en
kommun ut med förbehåll enligt TF 2 kap. 19 § måste det gå att se före
publicering, inte efter.

---

## 5. Avsändarvägen

Avgjord av ägaren: kampanjen går via Resend. En framställan enligt
offentlighetsprincipen är inte marknadsföring, utan ett ärende hos en
myndighet, och Resends förbud mot kall utskicksmarknadsföring träffar den
därför inte. Risken att en avstängning skulle slå ut inloggningskoderna är
teoretisk så länge tjänsten inte har inloggade användare.

Frågan ska tas upp igen den dag Prikko har riktiga användare. Då är
inloggningen något som kan gå sönder för någon annan än ägaren, och då är en
separat avsändarväg för kampanjen billig försäkring. Migadu-adresserna på
prikko.se är den naturliga platsen för den.

---

## 6. Takten och ordningen

### 6.1 Vad varje omgång ger

Räknat ur registret, med de tolv inlästa som utgångsläge och myndigheterna
sorterade efter antal anläggningar:

| Brev skickade | Nytt om alla svarar | Total täckning | Vid 60 procents svarsfrekvens |
|---:|---:|---:|---:|
| 10 | 18,9 % | 37,7 % | 30,1 % |
| 25 | 31,5 % | 50,3 % | 37,7 % |
| 50 | 45,4 % | 64,2 % | 46,0 % |
| 100 | 62,1 % | 80,9 % | 56,1 % |
| 150 | 72,2 % | 91,0 % | 62,1 % |
| 238 | 81,2 % | 100 % | 67,5 % |

Två slutsatser. De tio första breven ger ungefär lika mycket som de hundra
sista tillsammans, och de hundra minsta myndigheterna bär tillsammans 11
procent av anläggningarna. Och även ett fullständigt utskick landar på
knappt 70 procent vid realistisk svarsfrekvens, vilket betyder att
påminnelserna är minst lika värdefulla som nya utskick.

### 6.2 Ordningen

1. **Störst först.** Volym, och rutin: en stor förvaltning har handlagt
   utlämnanden förut och ofta en egen jurist, vilket gör svaret snabbare och
   mer förutsägbart än i en kommun där frågan är ny. `omgang` gör detta av
   sig själv.
2. **Sedan gemensamma nämnder och förbund.** Ett svar ger flera kommuner.
3. **Sedan länsvis.** Kommuner i samma län samverkar i miljösamverkan och
   pratar med varandra. Det sprider både ett gott och ett dåligt bemötande,
   vilket är ett skäl att inte skicka innan piloten är utvärderad.
4. **Sist de minsta.** Minst data, längst svarstid.

### 6.3 Takten

**25 myndigheter i veckan, efter en pilot om tio.** Varje svar är en fil att
granska, en kolumnmappning att skriva och ibland ett förtydligande att
skicka. Kommer 250 svar samtidigt tappas tråden och fristerna, och ryktet
blir att vi inte svarar på våra egna mejl. 25 i veckan ger cirka tio veckor.

Den verkliga flaskhalsen är dock inte utskicken utan verifieringen av
mottagare. 33 av 250 myndigheter har en verifierad adress i dag. Varje
kommande omgång kräver att lika många adresser läses fram ur kommunernas
egna sidor först. Räkna det som veckans huvudarbete, inte som en förberedelse.

**Grind noll: sajten måste vara publik.** Brevet säger "vi har läst in tolv
kommuner" och länkar dit. Ett mejl med en död länk är sämre än inget mejl,
för första intrycket går inte att göra om hos en myndighet som diarieför
allt. De två breven till Livsmedelsverket är undantaget: de innehåller ingen
länk som måste visa något och kan skickas i dag.

---

## 7. Det som inte är verifierat

| Fråga | Läge |
|---|---|
| Statistiksekretess hos Livsmedelsverket (OSL 24 kap. 8 §) | Overifierat. Avgör om genväg B fungerar. Största enskilda osäkerheten, se R11 |
| XML-filens faktiska struktur | Fältlistan är läst i Kontrollwiki, schemat ligger bakom inloggning |
| Verksamhetssystem per kommun | Okänt för samtliga 250. Löses av genväg A, inte av gissningar |
| Publiceringsstatus för 209 myndigheter | Ingen har kontrollerat dem |
| `inget` för de 26 kontrollerade | Bygger nästan överallt på frånvaro av bevis. Ingen kommun skriver att den inte publicerar |
| Umeå och Borås | Äldre uppgifter antyder att bägge publicerat per verksamhet tidigare. Gick inte att bekräfta i dag |
| Kalmars kontrollmyndighet | Ingen sida säger ordagrant vilken nämnd det är. Kommunen har även en vatten- och miljönämnd |
| Anläggningstal för Haninge, Tyresö och Nynäshamn | Saknas tills nästa rapportårgång, se 2.4 |
| Två stympade myndighetsnamn | "byggnadsnämnd Norberg Fagersta Avesta" och "och räddningsnämnd Nordanstig Hudiksvall" behöver verifieras |
| Svarsfrekvens | Okänd. Antagandet 60 procent i tabellen ovan är en planeringssiffra, inte en mätning |

---

## 8. Vad ägaren gör först

1. **Fyll i `SENDER_EMAIL` i `pipeline/begaran.py`.** En prikko.se-adress.
   Skriptet vägrar skriva brev dessförinnan.
2. **Skicka de två breven till Livsmedelsverket.** `livsmedelsverket@slv.se`,
   verifierad på deras kontaktsida 2026-08-05.

       python3 pipeline/begaran.py livsmedelsverket --mottagare livsmedelsverket@slv.se

   Genväg A ger systemkartan för alla 250 myndigheter och är den billigaste
   åtgärden i hela planen. Genväg B kan i bästa fall ge landets kontrolldata
   i ett svep. Skicka dem var för sig, med några dagar emellan, så att ett
   nej på den ena inte drar med sig den andra. De kan gå i dag, oberoende av
   sajtens status.
3. **Läs igenom de tio första breven innan något skickas.**

       python3 pipeline/begaran.py omgang --antal 10

   Läs dem som en handläggare läser dem. Ändra det som skaver i
   `request_letter`, inte i de utskrivna filerna, så att ändringen följer med
   till de följande 240.
4. **Skicka piloten den dag sajten är publik**, ett brev i taget, och fyll i
   `skickat` i `pipeline/data/utlamnanden.csv`.
5. **Bygg `sources/levererad.py`** medan svaren kommer in. R11 avsnitt F har
   manifestformatet: en läsare per filformat och en ordbok per kommun, i
   stället för 237 adaptrar. Det arbetet kan börja i dag mot en fil vi redan
   har, till exempel Borgholms PDF-tabell.

---

## 9. Norrköping: Ecos-adaptern, och licensen utredd före publicering

*Tillagt 2026-08-31. Beställningen kom ur `docs/42_oppna_data_sveptet.md` §6,
som fann beståndet och rekommenderade ett brev i stället för en hämtare. Den
rekommendationen är omprövad här, och skälet står i 9.3.*

### 9.1 Vad som byggdes, och varför det heter `ecos`

Två filer:

    pipeline/prikko/sources/ecos.py     adaptern
    pipeline/fetch_ecos.py             hämtaren
    pipeline/tests/test_ecos.py        30 prov

Modulen är skriven för FORMATET och inte för kommunen. `ecos.xml` är Sokigos
ärendesystems egen utdragsform, inte något Norrköpings webbredaktion satt
ihop, så samma läsare bör passa varje kommun som kör Ecos och exporterar på
samma sätt. En ny Ecos-kommun är en rad i `MUNICIPALITIES` och ingen ny fil:

    python3 pipeline/fetch_ecos.py --kommun norrkoping --out site/src/data/norrkoping.json

**Talet 68 kommuner används inte, och det är med flit.** `docs/43` §6 slår
fast att fältet `verksamhetssystem` står tomt för samtliga 290 kommuner i
både `kommuner.json` och `kommunregister.csv`, eftersom leverantörerna inte
publicerar sina kundlistor. Vi vet alltså inte hur många kommuner som kör
Ecos. Att generalisera ändå kostar ingenting och betyder bara att
kommunspecifika antaganden aldrig hinner växa in i koden. Systemkartan kommer
med svaret på genväg A, begäran till Livsmedelsverket.

### 9.2 Vad utdraget bär, mätt över hela filen

| Mått | Tal |
|---|---:|
| Kontrolltillfällen i filen | 4 451 |
| Verksamheter (namn och besöksadress, gemener) | **1 022** |
| Kontroller efter sammanslagning av samma dag | 4 398 |
| Kontrollpunkter | 25 083 |
| Varav publicerade | 25 061 |
| Bedömning `Godtagbar` / `Ej godtagbar` | 3 289 / 1 162 |
| `Oanmäld` / `Anmäld` | 3 306 / 1 145 |
| Kontrollområden, alla med Livsmedelsverkets egna namn | 12 |
| Verksamheter utan besöksadress | 22 |
| Kontrollpunkter med tom status | 4 |
| Datumintervall | 2018-08-31 till 2024-01-03 |

Fyra beslut i adaptern är värda att kunna utan att läsa koden.

**`Ej godtagbar` blir `minor` och aldrig `major`.** Kommunens skala har två
steg, precis som Stockholms. Att läsa det översta som "allvarliga brister"
vore att uppfinna en nivå källan inte har. Den allvarligaste nivån härleds ur
mönstret i `grading.py`, som `docs/03` beskriver.

**Fyra kontrollpunkter har tom status, och de släcker hela sin kontrolls
punktlista.** En tom status får aldrig läsas som "utan avvikelse". Men att
kasta hela kontrolltillfället vore att kasta kommunens EGEN bedömning, som
står i `bedomning` och inte i punkterna. Lösningen är att bedömningen står
kvar, punktlistan töms och kontrollen märks `uncertain`. Skälet till att hela
listan töms och inte bara den oläsbara raden står i `grading.py` version 4:
viktningen av rent administrativa avvikelser får bara MILDRA, och bara när
hela underlaget är synligt. En halv lista kunde mildra en bedömning som
skulle stått kvar. Kostnaden är 22 punkter av 25 083.

**Ingen verksamhetstyp finns i filen.** `types` är tom för alla 1 022, alltså
får Norrköping inga kategorisidor och inget kategorifilter. Att härleda typen
ur namnet är inte ett alternativ: `docs/45_entreprenorslistan.md` underkände
namnet som kategorikälla efter mätning.

**Ingen kontrollorsak finns heller.** Filen skiljer inte planerad kontroll
från återbesök, så varje kontroll läses som rutin. Följden är att en
kvarstående brist bara kan härledas ur att FÖREGÅENDE kontroll också hade
avvikelser, aldrig ur att kommunen kom tillbaka. Samma läge som Stockholm.

### 9.3 Licensbedömningen, ordagrant

Frågan är ställd före publicering och inte efter, och den är ställd så här:
**får vi vidareutnyttja ett Ecos-utdrag som en kommun lagt i sitt filarkiv
utan en enda rad om villkor?**

Fem grunder, alla med lagtexten utskriven som den står. Lagtexten är hämtad
ur Regeringskansliets rättsdatabas 2026-08-31, `rkrattsbaser.gov.se`.

**1. Materialet är allmänna handlingar.** Innehållet är kontrollrapporter
från byggnads- och miljöskyddsnämnden i Norrköping, alltså handlingar
upprättade hos en myndighet. Rätten att ta del av dem följer av 2 kap.
tryckfrihetsförordningen och är inte omtvistad.

**2. Ingen upphovsrätt.** Upphovsrättslagen (1960:729) 9 § första stycket:

> "Upphovsrätt gäller inte till 1. författningar, 2. beslut av myndigheter,
> 3. yttranden av svenska myndigheter och 4. officiella översättningar av
> sådant som avses i 1-3."

En kontrollrapport är myndighetens skriftliga besked om vad kontrollen visade
och dess bedömning `Godtagbar` eller `Ej godtagbar`. Det är ett yttrande av
en svensk myndighet i paragrafens mening. Undantagen i andra stycket, kartor,
bildkonst, musik och diktverk, är inte i närheten av vad filen innehåller.

**3. Inget katalogskydd heller, och det är den avgörande punkten.** Den
verkliga frågan för en tabell med 25 083 rader är inte upphovsrätt utan
katalogskyddet i 49 § URL, som skyddar sammanställningen även när varje
enskild uppgift är fri. Första stycket:

> "Den som har framställt en katalog, en tabell eller ett annat dylikt arbete
> i vilket ett stort antal uppgifter har sammanställts eller vilket är
> resultatet av en väsentlig investering har uteslutande rätt att framställa
> exemplar av arbetet och göra det tillgängligt för allmänheten."

Men tredje stycket i samma paragraf säger vilka andra bestämmelser som gäller
för sådana arbeten:

> "Bestämmelserna i 2 § andra-fjärde styckena, **6-9 §§**, 11 § andra stycket,
> 12 § första, andra och fjärde styckena, 13-16 §§ [...] ska tillämpas på
> arbeten som avses i denna paragraf."

9 § ingår i uppräkningen. En sammanställning av en svensk myndighets beslut
och yttranden bär alltså inget katalogskydd, av samma skäl som de enskilda
handlingarna inte bär upphovsrätt. Kedjan är två paragrafer lång och står
utskriven i lagtexten.

**4. Öppna data-lagens undantag träffar bara TREDJE MANS rätt.** Lagen
(2022:818) om den offentliga sektorns tillgängliggörande av data, 1 kap. 10 §:

> "Lagen gäller inte för data som [...] 2. **tredje man** innehar rätt till
> enligt lagen (1960:729) om upphovsrätt till litterära och konstnärliga
> verk"

Ordet är "tredje man". Undantaget skyddar alltså inte en myndighets egen
rätt, och en kommun kan inte hålla inne data med hänvisning till en rätt den
själv skulle ha. Det är samma linje som artikel 1.6 i öppna data-direktivet
((EU) 2019/1024) uttrycker rakt ut för databasrätten.

**5. Ett villkor som inte är uttalat är inget villkor.** Samma lag, 2 kap. 5 §:

> "En myndighet eller ett offentligt företag får ställa villkor för att
> tillgängliggöra data för vidareutnyttjande bara om det är motiverat av ett
> allmänintresse. Ett villkor ska vara objektivt, proportionerligt och
> icke-diskriminerande för jämförbara slag av vidareutnyttjande. Ett villkor
> får inte begränsa konkurrensen eller i onödan inskränka möjligheterna att
> vidareutnyttja data."

Ett outtalat villkor kan omöjligt vara objektivt och icke-diskriminerande,
eftersom ingen kan känna till det. Frånvaron av licensmärkning är alltså
frånvaro av villkor, inte ett underförstått villkor.

**Slutsats: vi får publicera.** Det finns ingen ensamrätt som hindrar
vidareutnyttjande, och inget villkor har ställts.

**Fyra förbehåll, och de ska stå med.**

- **Tystnaden bär inte slutsatsen.** Att ingen licens är angiven är varken
  ett förbud eller ett tillstånd, precis som `docs/42` §6.4 skriver. Grunden
  ovan vilar på lagtexten, inte på att kommunen inte sagt något. Hade
  slutsatsen behövt tystnaden hade den inte hållit.
- **Öppna data-lagen kanske inte alls är tillämplig på just den här filen.**
  1 kap. 8 § punkt 2 gäller "när en myndighet [...] på eget initiativ
  tillgängliggör data som omfattas av lagen **i syfte att de ska kunna
  vidareutnyttjas**". Norrköping lade upp filen för att mata sin egen söksida,
  inte som en öppen datamängd, så syftesrekvisitet är tveksamt. Det ändrar
  ingenting: grunden för vidareutnyttjande är frånvaron av ensamrätt
  (punkt 2 och 3), inte ett tillstånd ur lagen. Punkt 4 och 5 är stöd, inte
  bärande.
- **Personuppgifter är samma fråga som i de tolv.** Namn och adress på
  enskilda firmor förekommer, och det är den fråga `research/R4` och
  `docs/47_utgivningsbevis.md` behandlar. Norrköping tillför ingenting nytt
  och avgörs inte här.
- **Overifierat: om filen fortfarande är avsedd att vara publik.** Söksidan
  är nedmonterad och filen ligger kvar i filarkivet. Det är en artighetsfråga
  och inte en rättslig, och det är den brevet i 9.5 ställer.

### 9.4 Åldern syns, och den syns i den form kommunerna redan har

Senaste kontrollen är från 2024-01-03 och filen skrevs 2024-03-17. Tre
befintliga mekanismer gör det synligt utan att besökaren klickar, och ingen
ny form uppfanns.

**Färskhetsfönstret får verka.** `grading.py` sätter ingen bedömning när
senaste kontrollen är äldre än `FRESHNESS_WINDOW_DAYS`, alltså tre år. Av
1 022 verksamheter får **272** en bedömning och **750** får
`stale_inspections`. De 750 no-indexeras av `isIndexable()` och räknas som
"Ingen bedömning" i fördelningsraden på kommunsidan. Det var inte en åtgärd
utan en mätning: sajtens egen mekanik gav rätt utfall utan att röras.

**Ett nytt fält i källblocket: `source.modifiedAt`.** `fetchedAt` säger när VI
läste filen och ingenting om hur gammalt materialet är. Skillnaden är noll i
en kommun vars tjänst svarar med dagens läge och den är allt i Norrköping.
Fältet skrivs av `fetch_ecos.py` och visas som en rad i panelen "Om
uppgifterna" på kommunhubben, i samma `dl` som redan bar källa, hämtdatum och
senaste kontroll. Panelen läser nu:

    Källa               Norrköpings kommun
    Hämtat              31 augusti 2026
    Källan uppdaterad   17 mars 2024
    Senaste kontroll    3 januari 2024
    Bedömda             272 av 1 022

**Histogrammet som redan fanns.** `Kontrollalder.astro` ritar antal
verksamheter per år för sin senaste kontroll, och för Norrköping blir det
2024: 2, 2023: 671, 2022: 267, 2021: 66, 2020: 16, 2019: 1. Komponenten
byggdes för Ednia-jämförelsen i augusti och behövde inte ändras.

**Fältet hade raderats efter en natt utan en rättelse i exporten.**
`export_supabase.py` bygger `source` från grunden med `url` och `fetchedAt`
ur Supabase, och `modifiedAt` har ingen kolumn där. Det är exakt samma fälla
som FILFALT och FILBLOCK finns för, en nivå längre in, och den slank förbi
provet eftersom `source` självt står i `EXPORTENS_EGNA_BLOCK`. Rättat med
`SOURCEFALT` och `filkallfalt()`, plus ett prov som ställer de incheckade
filernas `source`-nycklar mot listan.

### 9.5 Brevet till Norrköping, färdig lydelse

Brevet skickas ändå, och det av två skäl som inte är juridiska: en aktuell
körning är värd mer än 2023 års kontroller, och kommunens eget besked om
villkor är bättre än vår slutsats om deras tystnad.

Det går INTE genom `pipeline/begaran.py omgang`. Norrköping har status
`inlast` sedan datafilen finns, och skriptets regel "inget brev till någon
vars data vi redan har" är rätt regel. Det här är en annan sorts brev.
Mottagaren är verifierad i `kommunkontakter.csv` 2026-08-05:
`miljo@norrkoping.se`, registrator `kontakt@norrkoping.se`.

**Ägaren skickar. Ingenting här skickar något.** `SENDER_EMAIL` måste fyllas
i på samma sätt som för de övriga breven.

> **Till:** miljo@norrkoping.se
> **Kopia:** kontakt@norrkoping.se
> **Ämne:** Begäran om aktuellt utdrag ur Ecos samt besked om villkor för
> vidareutnyttjande
>
> Hej,
>
> Jag driver Prikko (prikko.se), en tjänst som samlar svenska kommuners
> offentliga livsmedelskontroller och visar hur varje verksamhet klarade sin
> senaste hygienkontroll. Vi publicerar i dag tretton kommuner.
>
> Norrköpings kommun har på norrkoping.se ett XML-utdrag ur Ecos, filen
> `ecos.xml`, som senast producerades den 17 mars 2024. Det innehåller
> 4 451 kontrolltillfällen på 1 022 verksamheter med fälten inspid, dnr,
> namn, besadr, hdatum, anmald, bedomning samt kontrollpunkter med status,
> checklistrubrik och kontrollpunkt.
>
> Jag har två frågor.
>
> **1. En aktuell körning av samma utdrag.** Den senaste kontrollen i filen är
> daterad den 3 januari 2024. Vi ber om en ny körning av samma export, med
> kontroller fram till i dag, och gärna med uppgift om hur ofta den kan
> köras. Exporten finns redan i systemet och har körts förut, så vår
> förhoppning är att detta är en liten åtgärd.
>
> Begäran görs som en begäran om tillgängliggörande av data för
> vidareutnyttjande enligt lagen (2022:818) om den offentliga sektorns
> tillgängliggörande av data. Rättslig grund för tillgången är 2 kap.
> tryckfrihetsförordningen.
>
> **2. Besked om villkor för vidareutnyttjande.** Filen bär i dag ingen
> licensuppgift, och den sida som tidigare visade uppgifterna är nedmonterad.
> Vår bedömning är att materialet får vidareutnyttjas: kontrollrapporter är
> yttranden av en svensk myndighet och omfattas därför inte av upphovsrätt
> (9 § upphovsrättslagen), och den paragrafen gäller enligt 49 § tredje
> stycket även för sammanställningar. Vi vill ändå gärna ha kommunens eget
> besked, och vi rättar oss efter det. Om ni önskar en viss formulering av
> källhänvisningen skriver vi in den.
>
> Om ni avser att ta ut en avgift ber jag er meddela beloppet innan uttaget
> görs.
>
> Vi anger alltid källa och hämtdatum på varje sida, och vi publicerar
> kommunens bedömning som den står. Den sammanvägda bedömning vi själva
> räknar fram är märkt som vår och förklaras på prikko.se/metodik.
>
> Med vänlig hälsning,
>
> Måns Erlandsson
> Magoed AB, org.nr 559386-1015
> prikko.se

---

## 10. Göteborg: varför 5 062 verksamheter blir noll sidor

*Tillagt 2026-08-31.*

`docs/42` §7.3 rekommenderade att läsa in Göteborg som adress-, koordinat-
och typunderlag utan egna sidor, och kallade det outrett hur den vägen
förhåller sig till `docs/23_rikskartan.md`. Rekommendationen är prövad mot
koden och mot `docs/15_vad_sidorna_blir.md`, och den följs. Men den
implementeras inte på det sätt beställningen antog, och skillnaden är hela
det här avsnittet.

### 10.1 Premissen som visade sig vara fel

Beställningen sa att sajten redan bygger inga sidor för verksamheter utan
registrerad kontroll, med `llms.txt` som stöd. Filen säger något annat, och
den säger det korrekt:

> "Verksamheter utan registrerad kontroll får ingen **indexerad** sida,
> eftersom det inte finns något att redovisa om dem."

Koden bekräftar den formuleringen. `getStaticPaths` i
`site/src/pages/[kommun]/[slug].astro` bygger en sida för VARJE verksamhet i
varje kommun, utan villkor. `isIndexable()` i `lib/data.ts` styr bara tre
saker: `noindex` i huvudet, uteslutning ur XML-sitemapen och uteslutning ur
webbkartan. Det befintliga mönstret är alltså **sida utan indexering**, inte
**ingen sida**. Något färdigt mönster för "en kommun i registret utan
verksamhetssidor" finns inte.

### 10.2 De tre vägarna, och vad var och en kostar

**A. Vanlig kommun i `site/src/data/`.** Billigast i kod, noll rader. Kostar
5 062 verksamhetssidor som alla säger "ingen bedömning" och som ingen får
indexera, plus en kommunhubb och en sidserie på 51 sidor som VISST indexeras.
Kommunhubben är enligt `docs/15` §5 den sidtyp som bär trafiken, uppmätt mot
brittiska FSA till 37,9 procent mot 5,8 för enskilda verksamheter. En
göteborgsk hubb vars fördelningsrad är hundra procent grå är alltså den mest
sedda sidan vi någonsin publicerat utan ett svar på den. Det bryter mot
`docs/42` §7.3 och mot regeln i `docs/prikko-sidor-bara-for-seo`: en sida ska
bära en funktion, och en sida utan betyg bär ingen.

**B. Ny flagga i datalagret: kommun utan verksamhetssidor.** Det som
beställningen beskriver. Mätt: `municipalities()` anropas på **44 ställen i
33 filer**, från `Footer.astro` och `Karta.astro` till sitemapen,
sökregistret, jämförelsen, kedjorna och `astro.config.mjs`. Varje anropare
måste granskas för om den ska se Göteborg eller inte, och en missad anropare
ger antingen en död länk eller en tom sida. Det är dessutom en flagga vars
enda användare i dag är en kommun som inte ska synas.

**C. Underlag utanför `site/src/data/`.** Hämtaren skriver samma form som en
sajtdatafil, men till `pipeline/data/underlag/goteborg.json`. Sajten är
orörd. Beståndet är hämtat, verifierat och redo, och den dag Göteborg lämnar
ut kontrollresultat är publicering en katalog och inte en omskrivning.

**Valt: C.** Den ger exakt det `docs/42` §7.3 bad om, "läsa in som adress-
och typunderlag utan egna sidor", till noll risk i sajten och utan en flagga
som ingen annan kommun behöver. Den dag flaggan i B faktiskt behövs, alltså
när mer än en kommun ska ligga i registret utan sidor, är det rätt tillfälle
att bygga den.

**Var ärlig om vad C inte är.** Underlaget gör ingenting i dag. Det syns inte
på sajten, det ger inga nålar på rikskartan och det driver inget filter.
Det är inventarie och inte funktion, och det blir funktion först när något av
tre inträffar: Göteborg lämnar ut kontrollresultat, org.nr-bryggan i
`docs/12_datapairing_och_orgnr.md` byggs mot serveringstillståndsfilen, eller
flaggan i B byggs för sin egen skull.

### 10.3 Vad som byggdes

    pipeline/prikko/sources/goteborg.py    adaptern
    pipeline/fetch_goteborg.py             hämtaren
    pipeline/tests/test_goteborg.py        17 prov

    python3 pipeline/fetch_goteborg.py --out pipeline/data/underlag/goteborg.json

| Mått | Tal |
|---|---:|
| Rader i CSV:n | 5 076 |
| Verksamheter efter sammanslagning | **5 062** |
| Med koordinat | 4 878 |
| Med verksamhetstyp | 4 775 |
| Med postnummer | 4 960 |
| Kontrollresultat | **0** |
| Licens | **CC0 1.0**, otvetydig |

**Koordinaterna är verifierade mot varandra och inte bara mot ögat.** Filen
bär samma punkt i två system. Alla 4 892 rader med koordinat räknades om från
SWEREF 99 12 00 med `prikko.geo` och jämfördes med filens egna WGS84: största
avvikelse **2,4e-11 grader**, alltså under en hundradels millimeter, och noll
punkter utanför Sverige. Kontrollen görs om vid varje hämtning och fäller
hämtningen om kommunen byter projektion i en av kolumnerna.

**Katalogfilen är inte incheckad.** 2,2 MB som uppdateras dagligen hos
kommunen skulle bli en daglig diff av en ögonblicksbild som ändå är
inaktuell, och `docs/46` §5 räknar arkivets tillväxt som en av tre gränser
som ligger före filtaket. `pipeline/data/underlag/` står därför i
`.gitignore`, bredvid `raw/` och `interim/`. Filen är ett kommando bort.

**De 47 typvärdena är INTE inmappade i `site/src/lib/categories.ts`.** Det är
ett medvetet val: tabellen är en tabell över råvärden i kommuner vi faktiskt
läser, och 47 rader för en kommun som inte finns i `site/src/data` är rader
ingen kan pröva. `check-categories.ts` ser dem inte, eftersom den läser
`site/src/data`. Att mappa dem är första uppgiften den dag Göteborg
publiceras, och taxonomin ligger nära den vi redan har: RESTAURANG 1 599,
LIVSMEDELSBUTIK 685, KAFÉ 490, FÖRSKOLA tillagning 265.

---

## 11. Talen efter, och vad som återstår

*Mätt 2026-08-31, efter Norrköping.*

### 11.1 Beståndet

| Mått | Före | Efter | Ändring |
|---|---:|---:|---:|
| Kommuner | 12 | **13** | +1 |
| Verksamheter | 16 044 | **17 066** | +1 022, +6,4 % |
| Kontroller | 68 937 | **73 335** | +4 398, +6,4 % |
| Verksamheter med bedömning | 13 546 | **13 818** | +272 |
| Andel av landets 92 746 anläggningar | 18,8 % | **20,2 %** | +1,4 p.e. |

Av Norrköpings 1 242 registrerade anläggningar publicerar vi 1 022, alltså
82,3 procent. De 272 med bedömning är 26,6 procent av vårt norrköpingsbestånd,
och skälet är åldern och ingenting annat. Kommer en aktuell körning på brevet
i 9.5 blir talet ett annat utan en rad ny kod.

Göteborg räknas inte in i något av talen ovan. Underlaget är 5 062
verksamheter som ligger i pipelinen och inte på sajten, se §10.

### 11.2 Bygget

    cd site && npm run build -- --outDir dist-nykommun

| Mått | Före (docs/46, 2026-08-30) | Efter |
|---|---:|---:|
| Filer i utgåvan | 17 011 | **18 048** |
| Byggda sidor | 16 766 | **17 801** |
| URL:er i sitemapen | | 14 545 |
| Verksamhetssidor i sitemapen | 13 546 | **13 818** |
| Kommunsidor i sitemapen | 192 | **204** |
| Byggtid | 2 min 36 s | 3 min 36 s |

Alla byggvakter gick igenom: sitemapgrinden (ingen URL motsäger sin egen
noindex, inga URL:er föll utanför grupperna), länkgrinden (noll döda interna
länkar bland 17 801 sidor), CSS-grinden och rutarkivsgrinden. Katalogen är
borttagen efter mätningen.

**Byggtiden säger mindre än den ser ut att göra.** Bygget kördes två gånger.
Den första tog 5 min 32 s och kördes medan en annan session skrev i
`site/src/data`; den andra tog 3 min 36 s ostört. Filantalet skilde sig med
en enda fil, och den kom ur den andra sessionens arbete och inte ur
Norrköping. `docs/46` §2.1 mätte exakt samma sak och drog samma slutsats:
byggtiden domineras av väntan på disk, alltså är filantalet det tal som är
jämförbart mellan körningar.

**Filtaket flyttades i samma ändring.** `FILTAK_VARNING` och `FILTAK_FEL` i
`site/astro.config.mjs` gick från 18 000 och 19 500 till **90 000 och
98 000**, enligt rekommendationen i `docs/46` §6. Utgåvan hade annars fällts
av en gräns som `docs/46` §4.1 redan mätt bort: Cloudflare Pages tar 100 000
filer på den betalda planen, samma tal som Workers Static Assets.

### 11.3 Kvalitetsgrinden

    node site/scripts/check-categories.ts     → Noll omappade råvärden

Norrköping tillför inga nya typsträngar eftersom utdraget inte bär någon
verksamhetstyp. De 1 022 räknas som "ingen typ" och inte som "okänt", vilket
är skillnaden mellan en lucka i källan och en lucka i vår tabell.
`assertKnown` fäller bara på okända värden, så bygget rörs inte.

    python3 -m pytest pipeline/tests -q     → 1 288 godkända

Varav 30 nya för Ecos och 17 för Göteborg.

### 11.4 Vad som återstår

1. **Skicka brevet i 9.5.** Det är den enda åtgärd som kan flytta Norrköpings
   272 bedömda uppåt.
2. **Kontrollera att Cloudflare-kontot faktiskt ligger på Workers Paid.**
   Filtaksgrinden i `astro.config.mjs` förutsätter det nu. Gör kontot inte
   det är det verkliga taket 20 000, och grinden fäller aldrig innan
   Cloudflare avvisar utgåvan. Uppgraderingen är steg ett i `docs/46` §6 och
   den här ändringen är steg två.
3. **`caseNumber` raderas av nattkörningen, och det är ett fynd bredvid
   uppdraget.** Norrköpings 4 398 diarienummer och Linköpings 2 519 skrivs
   till datafilen men saknar motpart i `export_supabase.py`, som bygger varje
   kontroll från grunden. Samma sak gäller Kristinehamns `report_url`. Felet
   fanns före det här arbetet och är inte lagat här, eftersom det ligger i
   exportens kontrollblock och inte i FILFALT.
4. **Geokoda Norrköping.** Besöksadresserna bär husnummer, så
   `pipeline/geocode.py` kan sätta nålar på samma sätt som för Örebro och
   Uppsala. Utan det får Norrköping inga kartnålar. Ett eget steg, inte en
   del av hämtningen.
5. **Mappa Göteborgs 47 typvärden**, den dag kommunen publiceras. Se §10.3.
6. **Göteborgs serveringstillståndsfil**, `catalog.goteborg.se/store/6/resource/49543`,
   1 043 rader under CC0 med verksamhetsutövarens juridiska namn. Det är den
   brygga `docs/12` saknar, och den är den mest närliggande användningen av
   underlaget i §10.
7. **Verifiera Ecos-adaptern mot en andra kommun.** Återanvändbarheten är i
   dag en hypotes byggd på en fil. Systemkartan kommer med genväg A.
