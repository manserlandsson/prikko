# R11. Plan för att begära ut kontrolldata från kommuner som inte publicerar

**Verifierat 2026-08-03.** Varje lagcitat nedan är hämtat ur Regeringskansliets
rättsdatabas (`rkrattsbaser.gov.se`) eller ur propositionen i riksdagens
dokumentbas, inte ur minnet. Varje uppgift om Livsmedelsverkets rapportering är
läst i Kontrollwikis anvisningar för 2026 och 2027. Där jag inte kunnat
verifiera något står det uttryckligen att det är overifierat.

**Detta är research, inte juridisk rådgivning.** Undertecknad är inte jurist.

---

## 0. Sammanfattning

Planen som beställdes var 275 mejl. Researchen ändrar den på fem punkter, och
fyra av dem gör arbetet mindre.

**1. Det är inte 275 mottagare, det är cirka 237.** Sverige har 290 kommuner men
bara omkring 249 kommunala kontrollmyndigheter, eftersom 25 av dem består av
flera kommuner (gemensam nämnd eller kommunalförbund). Att mejla Arboga, Kungsör,
Köping och Surahammar var för sig är fyra mejl till samma handläggare, och den
handläggaren blir irriterad. Mottagarlistan ska byggas på myndighet, inte på
kommun.

**2. Varje kommun producerar redan en fil med nästan exakt det vi vill ha.**
Alla kontrollmyndigheter ska varje år ladda upp en XML-fil till Livsmedelsverkets
myndighetsrapportering. Filen tas normalt ut ur verksamhetssystemet med ett
knapptryck. Den innehåller per verksamhet: verksamhets-id, kommunkod,
verksamhetstyp, riskklassning, och per kontroll: kontrolldatum, kontrollorsak,
föranmäld eller oanmäld, resultat per rapporteringspunkt, avvikelse-id och
bedömningen "Åtgärdad", "Kvarstår" eller "Avskriven".

Det är i praktiken hela vår datamodell, inklusive kvarstår-etiketten som
`grading.py` bygger hela jämförbarheten på.

**3. Den filen saknar en enda sak: namn och adress.** Livsmedelsverket vill inte
veta vad restaurangen heter, bara vilket id den har. Det betyder att en begäran
som frågar efter XML-filen måste ha en andra del: en lista som kopplar
verksamhets-id till namn och besöksadress. Den listan är ett registerutdrag och
är billigare att ta fram än en kontrollrapport.

Uppdelningen är hela poängen. Vi ber inte om en rapport som någon måste hitta på.
Vi ber om en fil som redan finns plus en adresslista.

**4. Utskriftsundantaget går att komma runt, men bara om begäran formuleras
rätt.** Tryckfrihetsförordningen ger ingen rätt till digitalt format. Öppna
data-lagen (2022:818) gör det, men bara om begäran uttryckligen är en begäran om
tillgängliggörande för vidareutnyttjande. Formuleringen måste stå i mejlet.
Utan den kan kommunen lagligt skicka 400 papperssidor.

**5. Kampanjen kan inte starta förrän sajten är publik.** Mejlets trovärdighet
vilar på meningen "vi har redan tolv kommuner, se själva". `README.md` säger att
sajten körs med `noindex` tills namn, domän och utgivningsbevis är på plats. Ett
mejl med en död länk är sämre än inget mejl, för första intrycket går inte att
göra om hos en myndighet som diarieför allt.

Utöver detta: det finns en genväg värd att pröva innan de 237 mejlen skickas.
Livsmedelsverket förvarar samtliga kommuners inrapporterade XML. En begäran till
en enda myndighet kan ge kontrolldatan för hela landet. Den skulle inte lösa
namnproblemet, men den skulle vända på hela arbetet: i stället för att be 237
kommuner om allt ber vi dem bara om adresslistan. Se avsnitt 2.4, inklusive
varför det kan misslyckas.

---

## 1. Juridiken, verifierad mot källa

### 1.1 Rätten finns, och den gäller kommunala nämnder

> **TF 2 kap. 1 §:** "Till främjande av ett fritt meningsutbyte, en fri och
> allsidig upplysning och ett fritt konstnärligt skapande ska var och en ha rätt
> att ta del av allmänna handlingar."

> **TF 2 kap. 4 §:** "En handling är allmän, om den förvaras hos en myndighet och
> enligt 9 eller 10 § är att anse som inkommen till eller upprättad hos en
> myndighet."

Myndigheten är miljönämnden eller motsvarande nämnd, inte kommunen som sådan.
Det spelar roll för adresseringen (avsnitt 3) och för att en gemensam nämnd är
**en** myndighet även när den täcker fyra kommuner.

Två handlingstyper är särskilt intressanta:

- **Den inrapporterade XML-filen.** Den har expedierats till Livsmedelsverket och
  är därmed upprättad enligt TF 2 kap. 10 § första stycket. Allmän handling utan
  vidare diskussion.
- **Verksamhetsregistret.** Ett fortlöpande fört register anses upprättat redan
  när det färdigställts för införing, enligt TF 2 kap. 10 § andra stycket 1.
  Alltså allmän handling även om ingen rapport någonsin skrivits ut ur det.

### 1.2 Sammanställningen ur verksamhetssystemet, och var gränsen går

Detta är den formulering som gör hela projektet möjligt, och den är snävare än
man skulle vilja.

> **TF 2 kap. 6 § andra stycket:** "En sammanställning av uppgifter ur en
> upptagning för automatiserad behandling anses dock förvarad hos myndigheten
> endast om myndigheten kan göra sammanställningen tillgänglig med rutinbetonade
> åtgärder och inte annat följer av 7 §."

Två saker att förstå:

**Vad "rutinbetonade åtgärder" betyder.** Förarbetena (prop. 1975/76:160 s. 90
och prop. 2001/02:70 s. 37) beskriver det som en begränsad arbetsinsats utan
nämnvärda kostnader. Praxis har satt en användbar övre gräns: i **HFD 2015 ref.
25** ansågs fyra till sex timmars arbete **inte** vara rutinbetonat. Vår begäran
måste alltså rymmas under några timmar, annars är sammanställningen juridiskt
sett inte ens en handling som förvaras hos myndigheten, och då finns inget att
neka och inget att överklaga.

Det är exakt därför begäran ska peka på en fil som redan tas fram och på ett
standardutdrag ur registret. Ju mer specialsydd fråga, desto större risk att
svaret blir "det kräver mer än rutinbetonade åtgärder", vilket är ett fullt
lagligt nej.

**Begränsningsregeln.** TF 2 kap. 7 §: en sammanställning anses inte förvarad om
den innehåller personuppgifter och myndigheten "enligt lag eller förordning
saknar befogenhet att göra sammanställningen tillgänglig". Detta är ingen risk
för vanlig livsmedelskontroll, men det är därför mejlet uttryckligen ska avstå
från organisationsnummer och personnummer.

### 1.3 Skyndsamhet

> **TF 2 kap. 15 § första stycket:** "Den som begär ut en allmän handling som får
> lämnas ut ska genast eller så snart det är möjligt och utan avgift få ta del av
> handlingen på stället..."

> **TF 2 kap. 16 § andra stycket:** "En begäran att få en avskrift eller kopia av
> en allmän handling ska behandlas skyndsamt."

Praxis från JO är att besked normalt ska lämnas inom någon eller några dagar, och
att dröjsmål över en vecka kräver förklaring. Det gäller **beskedet**, inte
nödvändigtvis leveransen av en stor sammanställning.

Kompletterande: **OSL 4 kap. 1 §** ålägger myndigheten att organisera sin
handlingshantering så att handlingar kan lämnas ut med den skyndsamhet TF kräver.
Den paragrafen är bra att känna till men hör inte hemma i ett första mejl.

### 1.4 Elektroniskt format: det kritiska hindret och hur det passeras

**Problemet, ordagrant:**

> **TF 2 kap. 16 § första stycket:** "Den som önskar ta del av en allmän handling
> har även rätt att mot en fastställd avgift få en avskrift eller kopia av
> handlingen till den del handlingen får lämnas ut. **En myndighet är dock inte
> skyldig att i större utsträckning än vad som följer av lag lämna ut en
> upptagning för automatiserad behandling i annan form än utskrift.**"

Detta är utskriftsundantaget. Offentlighetsprincipen ensam ger alltså ingen rätt
till en fil. En kommun får svara med en pappersutskrift och har då gjort rätt.
Det finns heller inget förbud mot digitalt utlämnande, så det mesta i praktiken
avgörs av välvilja.

**Lösningen ligger i orden "än vad som följer av lag".** Vanlig lag kan alltså
skapa en skyldighet som grundlagen själv hänvisar bort till.

Öppna data-lagen (2022:818) är en sådan lag.

> **1 kap. 8 §:** "Lagen ska tillämpas 1. när någon som har rätt att få tillgång
> till data eller skyddade data enligt någon annan lag eller förordning
> framställer en begäran om tillgängliggörande av data för vidareutnyttjande..."

> **2 kap. 2 §:** "Data ska tillgängliggöras i det befintliga formatet eller, om
> sökanden begär det och det är lämpligt samt praktiskt och tekniskt möjligt, i
> ett format som är öppet, maskinläsbart, och i förekommande fall, tillgängligt
> och sökbart, tillsammans med tillhörande metadata."

Att detta faktiskt tar sikte på utskriftsundantaget är inte min tolkning, utan
uttalat i förarbetena. Regeringen i **prop. 2021/22:225**, huvudtexten:

> "I den nya lagen om den offentliga sektorns tillgängliggörande av data kan det
> alltså regleras att data i form av en allmän handling som omfattas av lagen ska
> göras tillgängliga i sitt befintliga digitala format. Eftersom skyldigheten om
> tillgängliggörande i befintligt format endast avser data som omfattas av den
> nya lagen och enbart i ärenden om tillgängliggörande av data för
> vidareutnyttjande, är den inte en huvudregel i förhållande till
> utskriftsundantaget i 2 kap. 16 § första stycket TF."

Utredningen bakom lagen, återgiven i samma proposition (bilaga 2), är skarpare:

> "Formatkraven i lagen utgör en sådan särskild reglering i lag som anges i det
> s.k. utskriftsundantaget i 2 kap. 16 § TF. Utrymmet för en myndighet att
> bestämma att information inte ska tillhandahållas i digitala format inskränks
> således starkt."

**Praktisk följd, och den är hela poängen:** formatskyldigheten inträder bara i
ett ärende om tillgängliggörande för vidareutnyttjande. Den inträder alltså inte
automatiskt bara för att man begär ut en handling. **Meningen måste stå i
mejlet.** Skriv den ordagrant:

> "Begäran görs som en begäran om tillgängliggörande av data för
> vidareutnyttjande enligt lagen (2022:818) om den offentliga sektorns
> tillgängliggörande av data."

Tre begränsningar att vara ärlig om internt: kravet gäller bara om det är
"lämpligt samt praktiskt och tekniskt möjligt", det gäller bara om handlingen
faktiskt finns lagrad digitalt, och bestämmelser som begränsar utlämnande av
personuppgifter går före (öppna data-lagen 1 kap. 2 § och 2 kap. 1 §). Digg:s
vägledning beskriver de tre gränserna som proportionalitet, verksamhetspåverkan
och teknisk kapacitet.

**Bonusen med samma formulering:** öppna data-lagen ger också handläggningsregler
som TF saknar.

> **5 kap. 1 §:** "En myndighet ska inom fyra veckor avgöra ett ärende till följd
> av en begäran om tillgängliggörande av data för vidareutnyttjande." Förlängning
> med fyra veckor är möjlig om begäran är omfattande eller komplicerad, men då
> ska sökanden underrättas inom tre veckor.

> **5 kap. 2 §:** "En myndighet ska lämna ett skriftligt och motiverat beslut om
> sökanden begär det."

> **5 kap. 4 §:** beslut får överklagas till allmän förvaltningsdomstol.

En hård fyraveckorsfrist och en överklagbar formatvägran är väsentligt bättre
verktyg än TF:s "skyndsamt", och de kostar en mening i mejlet.

### 1.5 Avgifter

Här finns ett vanligt missförstånd som är värt pengar.

**Avgiftsförordningen (1992:191) gäller inte kommuner.**

> **1 a §:** "Förordningen gäller för myndigheter under regeringen."

De 50 kronorna för tio sidor och 2 kronor per sida därutöver (16 §) är alltså en
**statlig** taxa. Kommuner kan inte åberopa den. Vad som gäller för en kommun:

- Avgift förutsätter en i förväg fastställd taxa, beslutad av
  kommunfullmäktige. Saknas taxa får kommunen inte ta betalt. Grunden är gammal
  JO-praxis (JO 1989/90 s. 392) och framgår indirekt av TF 2 kap. 16 § som talar
  om "fastställd avgift".
- Kommunallagens självkostnadsprincip begränsar nivån.
- Avgift får bara tas ut för kopia eller avskrift, aldrig för att ta fram
  handlingen eller för att låta någon läsa den på plats (TF 2 kap. 15 §: "utan
  avgift").
- Många kommunala taxor är skrivna för papper och saknar post för digital fil.
  Då finns ingen fastställd avgift att ta ut för det vi begär.

**Och om begäran görs enligt öppna data-lagen sätts ett tak oavsett taxa:**

> **4 kap. 2 § första stycket:** "En avgift får inte sättas till ett högre belopp
> än vad som behövs för att täcka kostnaderna för att reproducera, tillgängliggöra
> och sprida data och för att avidentifiera personuppgifter."

Kostnaden för att bifoga en fil i ett mejl är noll. Det är den enskilt starkaste
praktiska anledningen att alltid ta med öppna data-formuleringen.

### 1.6 Sekretess: vad de kan neka med, och vad de inte kan

**Företagsuppgifter är i princip oskyddade i kommunal miljötillsyn.** Den
statliga tillsynssekretessen i OSL 30 kap. 23 § gäller uttryckligen bara "en
statlig myndighets verksamhet". För andra än statliga myndigheter gäller 27 §,
och den har ett undantag skrivet som om det vore skrivet för Prikko:

> **OSL 30 kap. 27 § andra stycket:** "Sekretess enligt första stycket 1 gäller
> inte för uppgift i tillsynsverksamhet som bedrivs av den eller de kommunala
> nämnder som fullgör uppgifter inom miljö- och hälsoskyddsområdet, om intresset
> av allmän kännedom om förhållande som rör människors hälsa, miljön eller
> redligheten i handeln eller ett liknande allmänintresse har sådan vikt att
> uppgiften bör lämnas ut."

Lagstiftaren har alltså redan vägt allmänhetens kännedom om hygien mot
företagens affärsintresse och låtit allmänintresset vinna. Detta är värt att
känna till, men **hör inte hemma i det första mejlet**. Att preventivt bemöta ett
nej man inte fått är att göra mejlet längre och mer konfrontativt. Spara det till
en eventuell överklagan.

**Det verkliga hindret är GDPR, inte affärssekretess.**

> **OSL 21 kap. 7 § första stycket:** "Sekretess gäller för personuppgift, om det
> kan antas att uppgiften efter ett utlämnande kommer att behandlas i strid med
> [dataskyddsförordningen]..."

Det är denna paragraf en kommun kommer att använda om de vill säga nej. Den blir
tillämplig eftersom en enskild firmas namn är en personuppgift (se R1 och R4).
Prövningen är "kan antas", alltså en bedömning av **mottagaren**, vilket är
exakt varför vi inte ska vara anonyma och varför mejlet ska vara öppet med vad
datan ska användas till. En sökande som beskriver en publicerad metodik, en
rättelserutin och verksamhetens replikrätt är svårare att antas bryta mot GDPR än
en anonym adress som inte vill säga något.

Se R4 för hur Lexbase-domen (C-199/24, 9 juli 2026) påverkar det ledet. Kort:
utgivningsbeviset ensamt räcker inte längre som svar på den frågan, men den
redaktionella linjen och faktakontrollen gör det starkare.

### 1.7 Anonymitet

> **TF 2 kap. 18 §:** "En myndighet får inte på grund av att någon begär att få ta
> del av en allmän handling efterforska vem denne är eller vilket syfte han eller
> hon har med sin begäran i större utsträckning än vad som behövs för att
> myndigheten ska kunna pröva om det finns hinder mot att handlingen lämnas ut."

Rätten att vara anonym finns alltså, men undantaget är just vår situation:
när utlämnandet kräver en sekretessprövning enligt OSL 21 kap. 7 § **behöver**
myndigheten veta vem som frågar och varför, och då får den fråga.

**Slutsats: var inte anonym.** Anonymitet skulle här vara aktivt skadligt. Det
tvingar fram en prövning där myndigheten saknar underlag att säga ja, och det
motverkar friktionsfrihet, eftersom en okänd avsändare kräver eftertanke medan en
identifierbar avsändare med en sajt bakom sig kräver ett svar.

### 1.8 Om det blir nej

- Begär ett skriftligt beslut. Vid TF-vägran följer det av OSL 6 kap. 3 §: den
  anställde ska hänskjuta frågan till myndigheten om den enskilde begär det, och
  den enskilde ska informeras om att det krävs ett skriftligt beslut för att
  kunna överklaga.
- Ett myndighetsbeslut om att inte lämna ut överklagas enligt TF 2 kap. 19 § till
  kammarrätten, och "ett överklagande ska alltid prövas skyndsamt".
- Ett beslut om format eller avgift enligt öppna data-lagen överklagas enligt
  5 kap. 4 § till förvaltningsrätten.

Notera skillnaden: TF-vägran går direkt till kammarrätt, format och avgift går
till förvaltningsrätt. Två spår, och det är en anledning att hålla isär de två
frågorna i korrespondensen.

---

## 2. Verksamhetssystemen, och den fråga som redan har en knapp

### 2.1 De tre systemen

Tre leverantörer dominerar kommunal miljö- och hälsoskyddshandläggning, enligt
Sambruk/NSÖD:s egen bakgrundsbeskrivning till livsmedelsspecifikationen:

| System | Leverantör | Not |
|---|---|---|
| **Ecos** (Ecos 2.x) | Sokigo | Bekräftat i R1: fältet `generator` i Sambruk-specen har "Ecos 2.0" som exempelvärde. Oskarshamns ArcGIS-lager har fältet `EcosOBJID` (R6) |
| **EDP Vision Miljö** | VertiGIS (tidigare EDP Consult) | Sokigo säljer integrationer mot det, äger det inte |
| **Castor** | Prosonagruppen | Sambruk-specen har "Castor" som andra exempelvärde för `generator` |

**Overifierat:** exakta marknadsandelar. Ingen av leverantörerna publicerar antal
kommuner, och jag hittade ingen sammanställning. Gissa inte i mejlet.

**Men vi behöver inte gissa,** och det är det viktigaste fyndet i avsnittet:

### 2.2 Varje kommun rapporterar redan vilket system den kör

Bland uppgifterna som varje kontrollmyndighet fyller i i Livsmedelsverkets
webbformulär finns, ordagrant ur Kontrollwikis anvisning "Information om
myndigheten 2027":

- "Verksamhetssystem som myndigheten rapporterar med"
- "Version av verksamhetssystem"

Livsmedelsverket förvarar alltså en aktuell förteckning över vilket
verksamhetssystem varje kommun i landet använder. Ett mejl till en myndighet ger
systemkartan för alla 249. Det är den billigaste möjliga första åtgärden i hela
planen, och den avgör vilken mallvariant varje kommun ska få.

### 2.3 Filen som redan finns

Ur "Anvisning Myndighetsrapportering 2027":

> "Rapporteringen sker genom att en XML-fil laddas upp på Myndighetsrapporteringens
> webbplats [...] XML-filen tas normalt ut från verksamhetssystemet eller från ett
> tilläggsprogram. Om du inte vet hur du ska få ut XML-filen, kontakta din
> systemleverantör."

Rapporteringen sker med stöd av LIVSFS 2009:13 och används för EU-rapportering
enligt artikel 113 i förordning (EU) 2017/625. Deadline är 31 januari året efter
kontrollåret.

**Vad filen innehåller** (läst i anvisningarna för 2026, artiklarna om
verksamheter, utförda kontroller och kontrollresultat):

*Per verksamhet:* Verksamhets-id, Registrerad/godkänd, Registrerad/godkänd datum,
Upphörd verksamhet, Kommunkod, Mobil anläggning, Verksamhetstyp,
Verksamhetstyp-id, Skapad och Upphörd verksamhetstyp, plus riskklassningsuppgifter.

*Per kontroll:* Kontrolldatum, Utförande myndighet, Föranmäld eller oanmäld,
Distanskontroll, Provtagning, 9.2-kontroll, och Kontrollorsak med värdena
"Planerad kontroll", "Uppföljande kontroll", "Uppföljning av avvikelser som saknar
id" och "Händelsestyrd kontroll".

*Per kontrollresultat:* Rapporteringspunkt (lagstiftningsområde A till Q),
Resultat ("Utan avvikelse" eller "Avvikelse"), BeVA-utredning, Avvikelse-id, och
för uppföljande kontroller **Bedömning** med värdena "Åtgärdad", "Kvarstår" och
"Avskriven".

Jämför med vad `pipeline/prikko/grading.py` behöver: `assessment` i tre steg,
`type` (rutin, uppföljning, händelse), datum, och framför allt en kvarstår-signal.
Allt finns. Kvarstår finns till och med som ett explicit värde med ett
avvikelse-id som binder ihop uppföljningen med ursprungsavvikelsen, vilket är
bättre än det mönstermatchande vi tvingas göra i dag för Stockholm.

**Vad filen inte innehåller: namn, adress, organisationsnummer, koordinater.**
Livsmedelsverket efterfrågar dem inte. Detta är verifierat mot fältlistan i
"Information om verksamheter 2026" och är inte en gissning.

### 2.4 Två genvägar via Livsmedelsverket, och riskerna

**Genväg A, systemkartan.** Begär förteckningen över rapporterat
verksamhetssystem och version per kontrollmyndighet, senaste
rapporteringsomgången. Låg risk, inga personuppgifter, litet uttag. Gör detta
först oavsett vad man beslutar om resten.

**Genväg B, hela den nationella kontrolldatan.** Begär de inrapporterade
uppgifterna för samtliga kontrollmyndigheter för de tre senaste rapporteringsåren.
Om det lyckas vänds hela projektet: vi behöver då bara namn- och adresslistan från
varje kommun, vilket är en väsentligt lättare fråga att ställa 237 gånger.

Fyra risker med genväg B, i fallande sannolikhet:

1. **Sammanställningsinvändningen.** Livsmedelsverket kan hävda att ett uttag
   över alla myndigheter och år kräver mer än rutinbetonade åtgärder (TF 2 kap.
   6 §, HFD 2015 ref. 25). Motmedel: be i första hand om de inlämnade filerna som
   de kom in, en per myndighet och år. Då är det inkomna handlingar, inte en
   sammanställning, och invändningen faller.
2. **Statistiksekretess.** Om uppgifterna skulle anses insamlade för
   statistikframställning gäller absolut sekretess enligt OSL 24 kap. 8 §.
   Jag bedömer att den inte är tillämplig, eftersom insamlingen sker enligt LIVSFS
   2009:13 för EU-rapportering och kontrollstyrning och inte inom den officiella
   statistiken. **Detta är overifierat och är den största enskilda juridiska
   osäkerheten i planen.**
3. **Sekretess enligt OSL 30 kap. 23 §.** Livsmedelsverket **är** en statlig
   myndighet, så till skillnad från kommunerna kan de åberopa 23 §. Skaderekvisitet
   är rakt ("om det kan antas att den enskilde lider skada"), alltså presumtion för
   offentlighet, och uppgifterna saknar dessutom företagsnamn. Men invändningen
   finns.
4. **Datan blir svårbunden till verkligheten.** Verksamhets-id är kommunens eget.
   Anvisningen varnar uttryckligen: "Observera att det ska vara verksamhets-id och
   inte objekts-id, om dessa är olika." Kommunens registerutdrag måste därför
   innehålla **båda** id-fälten, annars går de två halvorna inte att foga ihop. Det
   ska stå i mallen.

Kostnaden för att pröva båda genvägarna är två mejl. Gör det innan kampanjen,
inte efter.

---

## 3. Vem mejlet ska gå till

Rättsligt: **den myndighet som förvarar handlingen** (TF 2 kap. 17 § första
stycket), alltså miljönämnden eller den gemensamma nämnden. I andra hand:
"Om en anställd vid en myndighet [...] har ansvar för vården av en handling, är det
i första hand han eller hon som ska pröva om handlingen ska lämnas ut" (OSL 6 kap.
3 §).

**Rekommendation: skicka till miljöförvaltningens funktionsbrevlåda, med
registrator som kopia.** Skälen:

- **Registrator ensam är fel.** Registrator diarieför och vidarebefordrar. Ett
  mejl dit blir ett ärende som ska fördelas, vilket kostar en dag och en
  handpåläggning innan någon som förstår frågan ens läser den. Registrator kan
  inte heller svara på om Ecos har rapporten.
- **Namngiven inspektör ensam är också fel.** Personen kan vara på semester,
  föräldraledig eller ha slutat, och mejlet dör tyst. Dessutom får den enskilde
  handläggaren ett formellt ansvar den inte bett om.
- **Funktionsbrevlådan är rätt.** Den bemannas, den är avsedd för utifrån
  kommande frågor, och de flesta kommuner har en (miljo@, miljokontoret@,
  bygg-miljo@). Kopian till registrator ger diarieföring och därmed ett
  diarienummer att följa upp mot, utan att registrator behöver göra något.

Undantag: där kommunen har en e-tjänst för att begära ut allmän handling ska den
användas i stället. Den går till rätt ställe per definition och ger ofta
automatiskt diarienummer.

**Bygg mottagarlistan i denna ordning:** kontrollmyndighet (inte kommun), sedan
myndighetens e-postadress för miljöfrågor, sedan registrator. Livsmedelsverkets
rapport "Sveriges livsmedelskontroll 2024" (L 2025 nr 13) innehåller underlaget
för myndighetsindelningen.

---

## 4. Har någon gjort det här förut

Kort svar: ja, men ingen som lämnat efter sig ett återanvändbart spår för just
livsmedelskontroller.

- **allmanhandling.se** är den bästa praktiska källan på svenska om
  handlingsoffentlighet: separata genomgångar av elektroniskt utlämnande,
  avgifter, potentiella handlingar och överklagande, med hänvisningar till JO- och
  domstolsavgöranden. Ingen tjänst för massutskick, men den referens jag skulle
  slå upp när ett svar blir konstigt.
- **Journalistförbundets guide** ("Så får du ut handlingar från myndigheter")
  täcker avgiftsfrågan konkret.
- **Handlingar.se** hittade jag ingen fungerande tjänst bakom. Den brittiska
  motsvarigheten WhatDoTheyKnow har ingen svensk klon i drift såvitt jag kunde se.
  **Overifierat i negativ riktning**, alltså: jag hittade den inte, vilket inte är
  samma sak som att den inte finns.
- **Företagarna** publicerade 2020 en jämförelse av kommunernas livsmedelskontroll
  ("Svindlande skillnader"). Bygger på Livsmedelsverkets aggregerade rapportering,
  inte på egna utlämnanden, vilket är ännu ett indicium för att genväg B i
  avsnitt 2.4 är värd att pröva.
- **Annie Sääf** granskade hur cirka 250 statliga förvaltningsmyndigheter hanterar
  utlämnandebegäranden och fann stora skillnader och bristande efterlevnad. Slutsats
  att ta med sig: räkna med att en tredjedel inte svarar utan påminnelse, och bygg
  arbetsordningen efter det i stället för att bli förvånad.

Ingen av dessa har publicerat en mall som är bättre än den nedan, eftersom ingen
av dem hade tillgång till observationen att myndighetsrapporteringens XML redan
finns.

---

## 5. Leverabler

### A. Grundmall

Designprinciper: ärendet ska gå att förstå ur ämnesraden, hela frågan ska rymmas
över vikningen, den juridiska hänvisningen ligger sist och är formulerad som
upplysning och inte som hot, och det ska vara uttryckligen tillåtet att skicka
något halvdant.

```
Ämne: Begäran om utlämnande: lista över livsmedelskontroller 2023-2026

Hej,

Jag begär ut uppgifter om utförd livsmedelskontroll i kommunen. Vi samlar
kommunernas offentliga kontrollresultat till en jämförbar sajt för
konsumenter, och har hittills läst in tolv kommuner: [LÄNK].

Det vi behöver är två filer:

1. Kontrollerna. Enklast för er är sannolikt samma XML-fil som ni laddade
   upp till Livsmedelsverkets myndighetsrapportering (imyr) för 2025, och
   gärna även 2024 och 2023. Den tas normalt ut ur ert verksamhetssystem
   och innehåller allt vi behöver om kontrollerna.

2. Verksamheterna. En lista med verksamhets-id, objekts-id om de skiljer
   sig åt, verksamhetens namn och besöksadress. Denna behövs eftersom
   rapporteringen till Livsmedelsverket inte innehåller namn eller adress.

Om det är enklare att exportera hela beståndet än att filtrera på datum,
gör gärna det. Vi sorterar själva.

Format spelar ingen roll. XML, CSV, Excel, JSON eller en PDF-utskrift
fungerar lika bra. Vi konverterar själva och ber er inte göra om något.

Vi behöver inte organisationsnummer och inte heller några personuppgifter
utöver det företagsnamn och den adress som redan är offentliga.

Om ni hellre lämnar ut på annat sätt, till exempel via er e-tjänst eller
en filöverföringstjänst, går det utmärkt. Säg bara till.

Vad uppgifterna används till: de publiceras på en öppen sajt tillsammans
med källhänvisning till kommunen och kontrolldatum. Metoden bakom
bedömningen publiceras i sin helhet, verksamheter kan publicera ett eget
svar vid varje kontroll, och vi rättar fel så fort de påtalas. Vi
publicerar inte dricksvattenanläggningar.

Rättslig grund: 2 kap. tryckfrihetsförordningen. Begäran görs också som
en begäran om tillgängliggörande av data för vidareutnyttjande enligt
lagen (2022:818) om den offentliga sektorns tillgängliggörande av data,
och jag ber därför att uppgifterna lämnas i befintligt digitalt format.

Hör gärna av er om något är oklart eller om uttaget blir omfattande, så
avgränsar vi det tillsammans.

Vänliga hälsningar
[NAMN]
Prikko
[TELEFON] · [E-POST] · [LÄNK]
```

Anmärkningar till mallen:

- **Tolv kommuner med länk ligger i tredje meningen.** Det är det enda som
  skiljer oss från en okänd person som mejlar, och det ska läsas innan
  handläggaren bestämmer sig.
- **"Om det är enklare att exportera hela beståndet, gör gärna det"** är den
  mening som sparar mest tid åt handläggaren. Datumfilter är ofta merjobb, inte
  mindre jobb, och vi bryr oss inte.
- **"Vi behöver inte organisationsnummer"** avväpnar GDPR-invändningen innan den
  formuleras, utan att nämna GDPR.
- **Ingen hänvisning till skyndsamhet, överklagande eller sekretessbrytande
  regler i första mejlet.** Det signalerar konflikt. Spara till påminnelse två.
- **Ingen precisering av vilka fält vi vill ha i kontrollfilen.** Att räkna upp
  fjorton fältnamn får mejlet att se ut som ett projekt. Fältspecifikationen
  ligger i mallvarianten för kommuner som svarar "vad vill ni ha exakt?".

### A2. Fältspecifikation, skickas bara på fråga

**Minimum, per verksamhet:**

| Fält | Varför |
|---|---|
| Verksamhets-id (och objekts-id om de skiljer sig) | Nyckel mot kontrollerna |
| Namn | Utan det finns ingen produkt |
| Besöksadress med postort | Kartnål och matchning |
| Status, aktiv eller upphörd | Nedlagda verksamheter får inte publiceras |

**Minimum, per kontroll:**

| Fält | Varför |
|---|---|
| Verksamhets-id | Kopplingen. Sambruk-specen saknar den, se R1 |
| Kontrolldatum | Färskhetsfönstret är fem år |
| Resultat eller bedömning i er egen skala | Blir `assessment` |
| Kontrollorsak: planerad, uppföljande eller händelsestyrd | Blir `type` |

**Önskvärt men inte nödvändigt:**

| Fält | Värde för oss |
|---|---|
| Bedömning vid uppföljning: åtgärdad, kvarstår, avskriven | Störst av alla. Det är kvarstår-signalen hela jämförbarheten bygger på |
| Avvikelse-id | Binder uppföljning till ursprunglig avvikelse |
| Rapporteringspunkt eller lagstiftningsområde A-Q | Ger "Brister och Godkänt"-uppdelningen per kontrollområde |
| Föranmäld eller oanmäld | Kontext i historiken |
| Verksamhetstyp och riskklass | Kategorisering och filtrering |
| Koordinater | Sparar geokodning, men vi klarar oss utan (se `pipeline/geocode.py`) |

**Vill uttryckligen inte ha:** organisationsnummer, personnummer,
kontaktpersoner, e-postadresser, uppgifter om dricksvattenanläggningar.

### B. Varianter per verksamhetssystem

Systemvarianterna är sekundära, och det är ett resultat av researchen snarare än
en lucka i den. Den systemoberoende XML-frågan i grundmallen är starkare än en
systemspecifik rapportfråga, eftersom myndighetsrapporteringen är obligatorisk för
alla och en produktrapport bara finns om leverantören byggt den.

Varianterna är därför **tillägg på en rad**, inte egna mejl. Byt ut punkt 1 i
grundmallen:

**Ecos (Sokigo):**
> "1. Kontrollerna. Ni kör Ecos, så enklast är sannolikt samma XML som
> exporteras för myndighetsrapporteringen till Livsmedelsverket. Finns
> uttaget kvar från januari räcker det att bifoga filen."

**EDP Vision Miljö (VertiGIS):**
> "1. Kontrollerna. Ni kör EDP Vision, så enklast är sannolikt samma XML som
> exporteras för myndighetsrapporteringen till Livsmedelsverket. Finns
> uttaget kvar från januari räcker det att bifoga filen."

**Castor (Prosona):**
> "1. Kontrollerna. Ni kör Castor, så enklast är sannolikt samma XML som
> exporteras för myndighetsrapporteringen till Livsmedelsverket. Finns
> uttaget kvar från januari räcker det att bifoga filen."

Effekten av att nämna systemet vid namn är inte teknisk utan social: det visar att
avsändaren vet hur deras arbetsdag ser ut. Använd bara namnet om det är
**verifierat** via genväg A i avsnitt 2.4. Att gissa fel gör motsatt verkan.

**För kommuner där systemet är okänt:** använd grundmallen oförändrad. Den nämner
inget system.

**Extravariant för kommuner som redan publicerar öppna data** (de som har
DCAT-poster på Sveriges dataportal men inte för livsmedel), lägg till sist:
> "Om ni hellre publicerar uppgifterna som öppna data i stället för att skicka
> dem till mig går det lika bra. Det finns en nationell specifikation för just
> livsmedelsinspektioner framtagen av Sambruk, NSÖD och ÖDIS."

Det är det bästa möjliga utfallet: då behöver vi aldrig fråga igen.

### C. Arbetsordning

**Grind noll: sajten måste vara publik.** Mallen bygger på en fungerande länk.
Skicka ingenting innan tolv kommuner går att se. Detta är den enda hårda
förutsättningen i planen.

**Steg 1, vecka 1. Två mejl till Livsmedelsverket.**
Genväg A (systemkartan) och genväg B (den nationella datan), skickade separat så
att ett nej på den ena inte drar med sig den andra. Utfallet avgör resten.

**Steg 2, vecka 1. Bygg mottagarlistan.**
249 kontrollmyndigheter, inte 290 kommuner. Kolumner enligt avsnitt D. Detta är
några timmars arbete och sparar dubbelutskick, felskick och pinsamheter.

**Steg 3, vecka 2. Pilot om tio.**
Blandad: tre stora städer, tre medelstora, två små, två gemensamma nämnder.
Syftet är inte data utan att mäta mallen. Följ upp: svarsfrekvens, svarstid,
andel som frågar efter förtydligande, andel som skickar PDF, andel som nämner
avgift. Justera mallen. En mall som skickats till 237 mottagare går inte att
ändra i efterhand.

**Steg 4, vecka 3 och framåt. Utrullning, 25 myndigheter i veckan.**

Ordningsprincip, och skälet till varje:

1. **Störst först.** Malmö, Göteborg, Helsingborg, Norrköping, Västerås, Umeå.
   Skälen är två. Volym: de trettio största kommunerna innehåller en oproportionerlig
   andel av landets restauranger, och SEO-avkastningen per svar är därmed högst.
   Och kompetens: stora förvaltningar har rutin för utlämnanden och egna jurister,
   vilket paradoxalt nog gör dem snabbare och mer förutsägbara än en liten kommun
   där frågan är ny.
2. **Sedan de som redan publicerar öppna data i övrigt.** De har redan tagit
   ställning principiellt och har ofta en dataansvarig. Sveriges dataportal ger
   listan.
3. **Sedan gemensamma nämnder och kommunalförbund.** Ett svar ger flera kommuner.
   Bäst avkastning per mejl i hela kampanjen efter de största städerna.
4. **Sedan regionvis.** Ett län i taget, inte slumpmässigt. Kommuner i samma län
   samverkar i miljösamverkan och pratar med varandra. Får den första kommunen i
   länet ett bra bemötande sprids det. Det gör också det motsatta, vilket är
   ytterligare ett skäl att inte skicka innan piloten är utvärderad.
5. **Sist de minsta.** Minst data, längst svarstid, störst risk att den enda
   inspektören är sjukskriven.

**Varför 25 i veckan och inte 250 på en gång:** svaren måste hinna hanteras.
Varje svar innebär en fil att granska, en kolumnmappning att skriva och ibland ett
förtydligande att skicka. Kommer 250 svar samtidigt tappar man tråden, missar
fristerna för påminnelse och får ett rykte om att inte svara på sina egna mejl.
25 i veckan ger cirka tio veckor för utrullningen, vilket också sprider ut
arbetet med intaget.

**Uppföljning, fast schema:**

| Tidpunkt | Åtgärd |
|---|---|
| Dag 0 | Mejl skickat |
| Dag 7 | Ingen bekräftelse: vänlig påminnelse i samma tråd, två meningar |
| Dag 21 | Fortfarande tyst: påminnelse med hänvisning till fyraveckorsfristen i 5 kap. 1 § öppna data-lagen |
| Dag 30 | Begär skriftligt och motiverat beslut enligt 5 kap. 2 §, och begär myndighetens prövning enligt OSL 6 kap. 3 § |
| Dag 45 | Beslut om överklagande. Se avsnitt E |

Påminnelserna ska ligga i samma mejltråd. Ett nytt mejl blir ett nytt ärende.

### D. Spårningsunderlag

Ligger som `pipeline/data/utlamnanden.csv`, en rad per kontrollmyndighet. CSV
och inte kalkylark, så att den kan versionshanteras och diffas. Filen skrivs
av `pipeline/begaran.py`, se `docs/20_kommunexpansion.md`.

| Kolumn | Innehåll |
|---|---|
| `myndighet` | Kontrollmyndighetens namn |
| `kommuner` | Kommunerna den täcker, semikolonseparerat |
| `kommunkoder` | SCB REGINA, semikolonseparerat. Nyckel mot pipelinen |
| `verksamhetssystem` | Ecos, EDP Vision, Castor, okänt |
| `mottagare` | E-postadress eller URL till e-tjänst |
| `mottagartyp` | funktionsbrevlada, registrator, etjanst |
| `mall` | Vilken variant som skickades |
| `skickat` | ISO-datum |
| `diarienummer` | Kommunens beteckning. Måste med i varje påminnelse |
| `paminnelse_1`, `paminnelse_2` | ISO-datum |
| `svar` | ISO-datum för första substantiella svar |
| `svarstid_dagar` | Beräknas. Mät kampanjen, inte bara kommunerna |
| `utfall` | vantar, delvis, komplett, avslag, avgiftskrav, hanvisad |
| `format` | xml, csv, xlsx, json, pdf, papper |
| `omfattning` | Antal verksamheter och kontroller i det som levererats |
| `period_fran`, `period_till` | Vilken tidsperiod filen faktiskt täcker |
| `avgift_kr` | Begärt belopp, 0 om inget |
| `avgift_status` | ingen, begard, bestridd, betald |
| `fil` | Sökväg till råfilen som den kom |
| `villkor` | Eventuella villkor för publicering som kommunen ställt |
| `overklagat` | ISO-datum eller tomt |
| `anteckning` | Fritext |

`villkor` är den kolumn som är lätt att glömma och dyrast att sakna. Om en kommun
lämnar ut med förbehåll enligt TF 2 kap. 19 § måste det gå att se innan
publicering, inte efter.

### E. När svaret är nej, eller kostar pengar, eller är en PDF

**Nej på grund av GDPR (OSL 21 kap. 7 §).** Det troligaste avslaget.
Svara med en beskrivning av behandlingen, inte med en paragraf: publicerad
metodik, källhänvisning per uppgift, verksamhetens replikrätt, rättelserutin,
och att uppgifterna redan är offentliga och publiceras öppet av tolv andra
kommuner. Erbjud att ta emot datan utan organisationsnummer. Om avslaget
kvarstår: begär skriftligt beslut och överväg överklagande, men bara efter att
utgivningsbevisfrågan i R4 är avgjord. Att förlora ett mål i kammarrätten skapar
ett prejudikat som alla andra kommuner kan hänvisa till, och det är den enda
åtgärden i hela planen som kan göra aktiv skada.

**Nej på grund av att det inte är rutinbetonat (TF 2 kap. 6 §).**
Krymp begäran, överklaga inte. Be om den redan producerade XML-filen ensam, eller
bara verksamhetsregistret, eller ett enda år. En sammanställning som inte kan tas
fram rutinbetonat är inte en allmän handling, så överklagande leder ingenstans.
Här vinner man genom att fråga om mindre.

**Nej på grund av att uppgifterna är sekretessbelagda som affärsuppgifter.**
Ovanligt, och svagt grundat för en kommun. Svara med OSL 30 kap. 27 § andra
stycket, som uttryckligen undantar kommunal miljö- och hälsoskyddstillsyn när
allmänintresset av kännedom om människors hälsa eller redligheten i handeln väger
tillräckligt tungt. Detta är den enda situationen där paragrafen ska citeras.

**Avgiftskrav.** Fråga tre saker, vänligt och i denna ordning: vilken av
kommunfullmäktige fastställd taxa avgiften bygger på, vilken post i taxan som
avser digital fil, och hur beloppet förhåller sig till taket i 4 kap. 2 § öppna
data-lagen. Erfarenhetsmässigt försvinner de flesta avgiftskrav på digitala filer
vid första frågan, eftersom taxan är skriven för papperskopior. **Betala aldrig
för papper.** Att ta emot en pappersutskrift mot avgift är att betala för att få
ett sämre format.

Sätt en intern gräns i förväg, till exempel 500 kronor per kommun, och håll den.
Utan gräns blir varje avgiftskrav ett eget beslut.

**PDF.** Ta emot den, tacka och läs den. `pipeline/prikko/pdf.py` finns redan och
tre adaptrar (Borgholm, Svenljunga, Kristinehamn) lever på PDF-tolkning. En PDF
med en tabell är fullt användbar. En PDF som är en inskannad bild är det inte.
I det senare fallet: mejla tillbaka och fråga om samma uppgifter kan skickas som
Excel eller CSV, med hänvisning till formatkravet i 2 kap. 2 § öppna data-lagen.
Den frågan är oftast obesvärad, eftersom PDF:en genererades ur samma system.

**Hänvisning vidare.** Om kommunen svarar att uppgifterna finns hos
Livsmedelsverket: notera det som stöd för genväg B och svara att vi behöver namn
och adress, som Livsmedelsverket inte har.

**Tystnad.** Följ schemat i avsnitt C. Efter dag 45 utan svar är påminnelser
slöseri. Lägg kommunen i `utfall: vantar` och gå vidare. Ett halvår senare är
handläggaren en annan och frågan ny igen.

### F. Vad vi gör med datan när den kommer

**Vad en adapter kostar i dag.** Mätt i `pipeline/`:

| Kommun | `sources/*.py` | `fetch_*.py` | Summa | Vad som gör den dyr |
|---|---:|---:|---:|---|
| Uppsala | 8,3 kB | 6,4 kB | 14,7 kB | AJAX-paginering, HTML-parsning |
| Stockholm | 8,7 kB | 7,0 kB | 15,7 kB | ArcGIS-paginering |
| Örebro | 11,6 kB | 8,0 kB | 19,6 kB | HTML |
| Linköping | 11,5 kB | 8,7 kB | 20,2 kB | API |
| Höganäs | 19,8 kB | 7,5 kB | 27,3 kB | Filnamnstolkning, filarkiv |
| Kristinehamn | 21,1 kB | 9,7 kB | 30,8 kB | PDF-bilagor per verksamhet |
| Lomma | 23,8 kB | 6,8 kB | 30,6 kB | Handredigerad HTML |

Alltså 15 till 31 kB kod per kommun, plus en testfil. Vid 237 kommuner blir det
mellan fyra och sju megabyte adapterkod. Det är inte en produkt, det är ett
underhållsåtagande som växer snabbare än nyttan.

**Men den kostnaden är nästan uteslutande transportlager, inte översättning.**
Läs adaptrarna: `fetch_*.py` är paginering, artighetspauser, felhantering och
retries. Det försvinner helt när filen kommer som en bilaga i ett mejl. Kvar blir
kolumnmappning och värdeöversättning, och det är två ordböcker, inte kod.

**Förslaget: en generisk `sources/levererad.py` plus en manifestfil per kommun.**

Manifestet är data, inte kod. Ungefär:

```yaml
kommun: 1280
namn: Malmö stad
kalla:
  typ: utlamnande
  mottaget: 2026-09-14
  diarienummer: MN-2026-01234
  filer:
    verksamheter: raw/1280/verksamheter.xlsx
    kontroller:    raw/1280/imyr-2025.xml
kolumner:
  verksamhet_id: "VerksamhetsID"
  namn: "Anläggningens namn"
  adress: "Besöksadress"
kontroll_kolumner:
  verksamhet_id: "VerksamhetsID"
  datum: "Kontrolldatum"
  resultat: "Bedömning"
  orsak: "Kontrollorsak"
varden:
  resultat:
    "Utan avvikelse": 0
    "Avvikelse": 1
    "Avvikelse kvarstår": 2
  orsak:
    "Planerad kontroll": 0
    "Uppföljande kontroll": 1
    "Händelsestyrd kontroll": 2
```

Tre lager, i fallande generalitet:

1. **Läsaren.** En funktion per filformat, inte per kommun: XML enligt
   Livsmedelsverkets schema, CSV, Excel, JSON, och PDF-tabell via befintliga
   `pdf.py`. Fem läsare totalt, för evigt.
2. **Mappningen.** Manifestet ovan. Skrivs för hand per kommun, tar minuter, och
   kräver ingen Python.
3. **Normaliseringen.** Befintlig `grading.py` och `geocode.py`, oförändrade.

**Den avgörande designregeln:** manifestet måste vara uttömmande. Ett värde i
källan som saknas i `varden` ska kasta `UnknownSourceValue`, precis som
`sources/uppsala.py` redan gör. Alternativet, att tyst mappa okända värden till
"inga anmärkningar", publicerar ett falskt godkänt, vilket är den enskilt värsta
sak produkten kan göra.

**Vad som ändå kräver riktig kod:** kommuner som skickar ett format ingen annan
skickat, eller där kopplingen mellan kontroll och verksamhet saknas helt (samma
problem som R1 identifierade i Sambruk-specen). Räkna med att det gäller kanske
var tionde kommun. 24 riktiga adaptrar är hanterbart. 237 är det inte.

**En sak till, som är gratis att införa nu och dyr att införa senare:** spara
råfilen exakt som den kom, tillsammans med mejlet och diarienumret. När någon om
två år hävdar att en uppgift är fel ska frågan "vad fick vi, av vem, och när"
kunna besvaras på trettio sekunder. Det är också vad utgivningsbevisets
faktakontrollskrav i R4 i praktiken kräver.

---

## 6. Risker och det som inte är verifierat

| Risk | Bedömning |
|---|---|
| **Statistiksekretess hos Livsmedelsverket (OSL 24 kap. 8 §)** | Overifierat. Största enskilda osäkerheten. Avgör om genväg B fungerar |
| **XML-filens faktiska struktur** | Jag har läst anvisningarna, inte XML-schemat. Schemat publiceras på Livstecknet, som kräver inloggning för kontrollmyndigheter. Fältlistan är alltså verifierad, filens uppbyggnad inte |
| **Kopplingen kontroll till verksamhet i XML:en** | Anvisningen förutsätter att varje kontroll hör till en verksamhet men jag har inte sett hur relationen uttrycks. Samma öppna fråga som R1 lämnade för Sambruk-specen |
| **Om kommunerna sparat sin uppladdade fil** | Okänt. Den är expedierad och därmed allmän handling, men kan ha gallrats. Fallback är att ta ut den på nytt, vilket är samma knapp |
| **Marknadsandelar per verksamhetssystem** | Overifierat. Ingen leverantör publicerar siffror. Lös via genväg A i stället för att gissa |
| **Om avvikelse-id är stabila över år** | Anvisningen kräver en översättningsnyckel vid systembyte, vilket antyder att de inte alltid är det |
| **GDPR-avslag i skala** | Om de första tio kommunerna avslår med OSL 21 kap. 7 § måste utgivningsbevisfrågan i R4 avgöras innan kampanjen fortsätter |
| **Svarsfrekvens** | Okänd. Anta 40 till 60 procent utan påminnelse och planera för resten |

---

## 7. Vad som ska göras först

1. Skicka de två mejlen till Livsmedelsverket (genväg A och B). De kan skickas i
   dag, oberoende av sajtens status, eftersom de inte innehåller någon länk.
2. Bygg mottagarlistan över 249 kontrollmyndigheter.
3. Bygg `sources/levererad.py` och manifestformatet mot en fil vi redan har, till
   exempel Borgholms PDF-tabell, så att intaget är färdigt när svaren kommer.
4. Skicka piloten om tio, den dagen sajten är publik.

Punkt 1 till 3 kan alla göras innan sajten lanseras. Bara punkt 4 är låst.

---

## Källor

Lagtext, hämtad ur Regeringskansliets rättsdatabas 2026-08-03:

- Tryckfrihetsförordning (1949:105), 2 kap. `rkrattsbaser.gov.se/sfst?bet=1949:105`
- Offentlighets- och sekretesslag (2009:400), 4 kap. 1 §, 6 kap. 3 till 6 §§,
  21 kap. 7 §, 30 kap. 23 och 27 §§. `rkrattsbaser.gov.se/sfst?bet=2009:400`
- Lag (2022:818) om den offentliga sektorns tillgängliggörande av data, 1 kap.
  2, 8 §§, 2 kap. 1 till 2 §§, 4 kap. 2 §, 5 kap. 1, 2 och 4 §§.
  `rkrattsbaser.gov.se/sfst?bet=2022:818`
- Avgiftsförordning (1992:191), 1 a §, 3 till 5 §§, 15 till 19 §§.
  `rkrattsbaser.gov.se/sfst?bet=1992:191`

Förarbeten och praxis:

- Prop. 2021/22:225, Den offentliga sektorns tillgängliggörande av data.
  Huvudtextens avsnitt om formatkrav samt bilaga 2 (utredningens sammanfattning).
  `riksdagen.se/.../den-offentliga-sektorns-tillgangliggorande-av_H903225/html/`
- HFD 2015 ref. 25 (fyra till sex timmar är inte rutinbetonade åtgärder)
- Prop. 1975/76:160 s. 90 och prop. 2001/02:70 s. 37 (innebörden av rutinbetonade
  åtgärder), citerade i andra hand via allmanhandling.se
- JO 1989/90 s. 392 (krav på i förväg fastställd taxa), citerad i andra hand

Livsmedelsverket, Kontrollwiki, läst 2026-08-03:

- Anvisning Myndighetsrapportering 2027, artikel 1050
- Information om myndigheten 2027, artikel 1051
- Information om verksamheter 2026, artikel 1001
- Information om utförda kontroller 2026, artikel 1003
- Information om kontrollresultat 2026, artikel 1004
- LIVSFS 2009:13, föreskrifter om rapporteringsskyldighet för kontrollmyndigheter
- Rapport L 2025 nr 13, Sveriges livsmedelskontroll 2024 (antal kontrollmyndigheter)

Övrigt:

- Sambruk/NSÖD, Livsmedelskontroller som öppna data. `sambruk.github.io/livsmedel/`
- Digg, Vägledning om öppna datalagen, avsnittet Krav på format
- allmanhandling.se, avsnitten om elektronisk form, avgift och potentiella
  handlingar
- Journalistförbundet, Vad kostar det att få ut handlingar

Internt: R1 (datamodellen), R4 (utgivningsbevis och GDPR), R5, R6 och R9
(källinventering och kommunsvep), `pipeline/prikko/grading.py`,
`pipeline/prikko/sources/`.
