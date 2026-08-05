# 20. Kommunexpansionen: kartläggning, begäranden och takt

*Byggt 2026-08-05. Kartläggningen är genererad ur källor, inte skriven för
hand, och går att bygga om med ett kommando. Det som är verifierat för hand
bär datum och källa. Det som inte är verifierat står som overifierat.*

Grunden är `research/R11_utlamnandeplan.md`, som utredde juridiken mot
lagtext och Livsmedelsverkets anvisningar. Det här dokumentet bygger
verktygen R11 beställde och lägger till kartläggningen R11 saknade.

---

## 1. Läget, mätt i verksamheter i stället för i kommuner

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
