# 50. Begär ut kontrollen: förstudie av punkt H1

**Datum:** 2026-08-31.
**Beställning:** avgöra om H1 i `45_entreprenorslistan.md` ska byggas. Punkten
står som nummer fem i den omprövade vågen 1 och beskrivs där som "täckningsmaskin
driven av efterfrågan", alltså den enda vägen till täckning som skalar utan oss.
**Metod:** förlagan är läst mot foodwatch, FragDenStaat och tyska domstolar.
Svensk rätt är läst mot lagtext, förarbeten och JO. Kapaciteten är läst ur
Livsmedelsverkets egen årsrapport och ur SOU 2025:64. Efterfrågan är mätt i vår
egen databas i dag. Ingenting är byggt, ingenting är skickat, `site/` och
`pipeline/` är orörda.
**Utfall:** idén är laglig, den är tekniskt lättare i Sverige än i Tyskland, och
den är ändå fel sak att bygga nu. Tre av premisserna i `docs/45` avsnitt H
visade sig behöva rättas.

---

## 1. Slutsatsen först

**Rekommendationen är: bygg i mindre form.** Bygg brevet, ge det till besökaren,
och skicka det aldrig själva. Bygg inte maskinen som skickar, tar emot och läser.

Fem slutsatser, i fallande ordning av vad de betyder.

1. **Räknat per nedlagd timme är A2 ungefär femhundra gånger bättre än H1.**
   250 brev ger omkring 215 nya verksamheter per arbetad timme. Knappen ger
   omkring 0,4 vid vår uppmätta efterfrågan, och omkring 2,7 om vi hade
   foodwatchs räckvidd. Uträkningen står i §8.
2. **Efterfrågan finns inte än, och det är mätt och inte antaget.** Prikko har
   i dag 9 konton och 21 bevakningar från 5 personer, den första 2026-08-04
   och den senaste 2026-08-30. En maskin som drivs av efterfrågan har ingen
   motor. §8.2.
3. **Förlagan lyckades rättsligt och misslyckades med datan.** Av över 50 000
   framställningar blev drygt 10 000 en publicerad rapport, alltså omkring
   20 procent, och foodwatch och FragDenStaat har aldrig publicerat ett
   aggregerat dataset av materialet. Det de sitter på är inskannade,
   OCR-tolkade, delvis handskrivna och manuellt svärtade PDF:er, en per
   framställning. §3.5 och §5.
4. **Juridiken är däremot inte hindret, och det är värt att skriva rakt ut.**
   Sverige har ingen avslagsgrund för mängd, frekvens eller syfte, och
   avsaknaden är ett tre gånger omprövat lagstiftningsval, senast i
   prop. 2019/20:179. Det tyskarna vann i domstol 2019 har vi aldrig behövt
   fråga om. §3.
5. **Tidsargumentet i beställningen är svagare än det såg ut.** SOU 2025:64:s
   ikraftträdande 1 januari 2028 är i praktiken övergivet: regeringen tillsatte
   2026-05-15 en ny utredning som ska redovisa fyra alternativ den 5 januari
   2027. Hotet mot båda vägarna ligger alltså längre bort, vilket gör A2 mer
   värt och inte mindre. §8.4.

| Fråga | Svar | Var det står |
|---|---|---:|
| Får vi skicka i besökarens namn? | Ja, men gör det inte | 3, 6 |
| Får vi skicka massgenererat i eget namn? | Ja. Ingen volymventil finns i svensk rätt | 3.1 |
| Kan en kommun avslå på grund av mängd? | **Nej.** Ds 2017:37 avvisade det uttryckligen | 3.1 |
| Vad kostar en begäran hos kommunen? | 2 till 3 timmar, tysk myndighets egen räkning | 4.1 |
| Går svaret att läsa maskinellt? | Ja, bättre än i Tyskland. Textbaserad PDF, nationell mall | 5.1 |
| Vem ska stå som avsändare? | Besökaren, i sin egen mejlklient. Inte vi | 6 |
| Vilken spärr håller utan konto? | Tak per verksamhet. Ingen lagring hos besökaren alls | 7 |
| Är det värt det? | Nej i full form. Ja i den lilla | 8, 9 |

---

## 2. Tre rättelser till `docs/45` avsnitt H

Beställningen bygger på avsnitt H i entreprenörslistan, som i sin tur anger
`docs/44_marknaden_2026.md` som källa. **Den källan innehåller ingenting om
Tyskland.** `grep -i "tysk\|topf\|foodwatch"` över hela `docs/` ger träff bara i
`45_entreprenorslistan.md`. Talen i H1, H4 och H5 har alltså aldrig haft en
skriven källa i projektet. De är nu prövade var för sig, och tre av dem behöver
rättas.

**H1 håller.** Över 56 000 framställningar stämmer, och det är foodwatchs egen
siffra i pressmeddelandet 2022-07-14. Omkring 400 myndigheter stämmer, det är
FragDenStaats eget tal i kampanjens FAQ. Januari 2019 stämmer, foodwatchs
pressmeddelande är daterat 2019-01-14 och FragDenStaats blogg 2019-01-15.

**Rättelse 1: BVerwG 7 C 29.17 gällde inte en Topf Secret-framställning.**
Domen 2019-08-29 gällde ett fjäderfäslakteri i Wiesenhof-koncernen. Den blev
prejudikatet som kampanjen vilade på, men den handlade om räckvidden av § 2
Abs. 1 VIG och om att en konstaterad avvikelse inte kräver ett förvaltningsbeslut.
Frågan om rättsmissbruk vid vidarebefordran avgjordes i stället i en våg av
OVG-avgöranden 2019 och 2020, bland andra OVG NRW 15 B 814/19 (2020-01-16),
OVG Bremen 1 B 2/20 (2020-07-14) och VGH Hessen 8 B 1355/19 (2020-09-18).
Källa: BVerwG pressmeddelande 60/2019, och FragDenStaats egen måltabell på
`fragdenstaat.de/kampagnen/lebensmittelkontrolle/klagen/`, läst 2026-08-31.

**Rättelse 2: H5 blandar ihop två händelser.** Berlins
Lebensmittelüberwachungstransparenzgesetz upphävdes, kungjort i GVBl
2026-02-16 s. 67, och det stämmer. Men **det finns ingen dom från
Verwaltungsgericht Berlin i februari 2026 som förbjuder Pankow att publicera sin
smileylista.** Det avgörande som finns är VG Berlin 2024-12-16, VG 14 L 228/24,
det är interimistiskt, och det gällde en enda namngiven verksamhet. Pankows
portal `pankow.lebensmittel-kontrollergebnisse.de` var i drift 2026-08-31.
Slutsatsen i H5 står ändå kvar, eftersom grunden för en myndighets egen
publicering visade sig svag på ett annat sätt: Berlins lag var i kraft från
2023-01-01, sju av tolv stadsdelar hade utfärdat noll barometrar under hela 2023,
och lagen upphävdes utan att någonsin ha tillämpats.

**Rättelse 3: `docs/43` avsnitt 5.5 åberopar JO dnr 384-2025, och det numret går
inte att belägga.** Genomsökning av JO:s beslutsdatabas, jo.se och hela
ämbetsberättelsen 2025/26:JO1 ger noll träffar. **Rättssatsen finns däremot**,
och den bärs av JO dnr 5301-2019, beslut 2020-10-22, JO Per Lennerbrant, mot
Sveriges generalkonsulat i Jerusalem. Numret i `docs/43` ska bytas, inte
meningen. Se §3.2.

---

## 3. Fråga 1: går det rättsligt?

Kort svar: ja, och med bredare marginal än beställningen antog. Det är den enda
av de sex frågorna där svaret är obetingat positivt.

### 3.1 Mängd är ingen avslagsgrund, och det är avgjort tre gånger

Departementspromemorian **Ds 2017:37** heter ordagrant *"Frekventa och omfattande
ärenden om utlämnande av allmän handling"*. Den är alltså skriven om exakt vår
fråga. Ur s. 34:

> "Det finns ingen begränsning i hur ofta en person får begära att få ta del av
> allmänna handlingar hos en myndighet. [...] Det saknar betydelse om handlingen
> redan har lämnats ut till honom eller henne."

Och på samma sida:

> "En myndighet kan med andra ord inte vägra att lämna ut handlingar med
> hänvisning till att det är mycket resurskrävande att pröva om handlingarna kan
> lämnas ut (se t.ex. RÅ 1976 ref. 122)."

Utredningens slutsats på s. 74 är att inga begränsningar ska införas. På s. 75
avvisas dessutom den engelska modellen med namns nämnande:

> "Av samma skäl saknas anledning att överväga sådana närliggande begränsningar
> rörande s.k. okynnesframställningar som finns i vissa andra rättsordningar
> (t.ex. i England och Wales)."

Och, med direkt bäring på ett verktyg som delar upp begäranden per verksamhet:

> "En spärr mot uttag av viss frekvens eller storlek skulle enkelt kunna kringgås
> t.ex. genom att en begäran delades upp på flera förfrågningar."

Kedjan bakåt och framåt: motion 2014/15:128 föreslog en undantagsbestämmelse för
uppenbart missbruk och **avslogs** i bet. 2014/15:KU15. Riksdagen begärde en
utredning i bet. 2014/15:KU11, utredningen blev Ds 2017:37, och regeringen sade
nej igen i **prop. 2019/20:179** (2020-06-11) med orden att "det inte finns
anledning att överväga sådana ändringar eller andra inskränkningar i den
grundläggande rätten att ta del av allmänna handlingar". Det enda som infördes
var förskottsbetalning, **OSL 6 kap. 1 a §**, lag (2020:961), i kraft 2021-01-01.

**Det finns alltså ingen svensk motsvarighet till tysk Rechtsmissbrauch, och
ingen motsvarighet till section 14 FOIA.** JO dnr 180-2014, beslut 2014-07-10,
kallade Kalmar kommuns principbeslut att inte pröva en viss persons
framställningar för **"uppenbart rättsstridigt"**, trots att kommunen i sitt
yttrande uppgav att personens syfte var att trakassera kommunen.

### 3.2 Turordning, och gränsen för den

Den enda ventil som finns är turordning, och den är snävare än den brukar
framställas. Ds 2017:37 s. 37 återger JO:s uttalande om att en myndighet "i stor
utsträckning" måste få hantera en framställning i taget. Men **JO dnr 5301-2019**,
beslut 2020-10-22, begränsade det uttryckligen:

> "Av det JO-beslut som generalkonsulatet hänfört sig till kan därför inte den
> kategoriska slutsatsen dras att en begäran om allmän handling kan vänta enbart
> på den grunden att myndigheten redan handlägger en begäran om
> handlingsutlämnande."

För oss är turordningsargumentet dessutom svagt av ett enkelt skäl: begärandena
skulle komma från olika personer till olika kommuner.

### 3.3 Två fällor som ska byggas bort, inte diskuteras bort

**Begär handlingen, aldrig uppgiften.** OSL 6 kap. 4 § säger att en myndighet ska
lämna uppgift ur en allmän handling "om inte uppgiften är sekretessbelagd eller
det skulle hindra arbetets behöriga gång". Den arbetsbelastningsventilen finns
alltså för uppgifter, men **inte** för själva handlingen enligt TF 2 kap. 15 och
16 §§. En knapp som skriver "vad blev resultatet av senaste kontrollen" öppnar
den dörren. En knapp som skriver "kontrollrapporten från senaste
livsmedelskontrollen av NN på adressen NN" stänger den.

**Kommunen får inte tvinga in oss i sin e-tjänst.** JO dnr 10735-2024, beslut
2025-06-10, Kristinehamns kommun:

> "En myndighet kan därför inte kräva att en enskild legitimerar sig som ett
> villkor för att framställa en begäran om allmän handling eller för att ta del av
> en sådan handling."

Samma beslut: "En begäran kan ställas till vem som helst inom en myndighet."
Det betyder att `pipeline/data/kommuner.json` och de 269 funktionsadresserna
räcker, och att ingen kommun kan kräva sitt eget formulär. Det ligger i linje med
att `pipeline/begaran.py` redan vägrar fylla i kommunernas e-tjänster.

### 3.4 Det som inte går att belägga

Det finns **inget svenskt uttalande alls** om framställningar som skickas av ett
program i stället för av en människa. Varken JO, domstol, förarbete eller
myndighetsvägledning behandlar avsändningsmetoden som en egen kategori.
Eftersom TF inte uppställer några formkrav (JO dnr 1274-2023, 2024-02-12: "Det
finns inte något formkrav för hur en begäran om att ta del av en allmän handling
ska göras") är den rimliga slutsatsen att metoden är rättsligt likgiltig. Det är
en slutsats, inte ett belägg, och den ska stå som en slutsats.

Det närmaste ett prejudikat vi har är **handlingar.se**, den svenska instansen av
Alaveteli, som 2026-08-31 visade 1 374 begäranden mot 2 478 myndigheter och som i
sin betalversion uttryckligen säljer funktionen att skicka samma begäran till
flera myndigheter samtidigt. Ingen JO-anmälan, inget domstolsärende och ingen
myndighet som blockerat plattformen gick att hitta. Deras egen transparensrapport
för 2021 redovisar **noll** modereringsfall av typen "inte en giltig begäran".
Detsamma gäller Jens Nylanders massbegäran mot 271 kommuner: ingen kritik, inget
JO-ärende, inget uttalande från SKR om belastningen.

---

## 4. Fråga 2: vad händer i praktiken hos kommunen?

### 4.1 Den enda hårda siffran i världen på vad en sådan begäran kostar

Den kommer ur ett tyskt mål, och den kommer ur myndighetens egen räkning.

**VG Berlin 2021-11-17, VG 14 K 153/20**, foodwatch mot Bezirksamt Pankow.
Pankow hade beviljat **0 av över 400** Topf Secret-framställningar. Myndighetens
egna tal, återgivna i domen:

| Post | Pankows egen uppgift |
|---|---:|
| Handläggningstid per framställning | **2 till 3 timmar** |
| Sammanlagd börda för de inkomna | upp till **1 800 arbetstimmar** |
| Motsvarar i utebliven kontroll | ungefär **900 livsmedelskontroller** |

Domstolen underkände resonemanget. Arbetet som andra personers framställningar
orsakar får inte tillräknas den enskilde sökanden, och myndigheten måste sprida
handläggningen över tid och skapa "zeitliche Kapazitäten und interne Strukturen".
Källa: rechtslupe.de och foodwatch 2021-12-17.

Sifforna säger två saker på en gång. Att myndigheten hade fel juridiskt, och att
räkningen ändå var riktig.

### 4.2 Vad tusen begäranden i veckan skulle göra i Sverige

Svensk kapacitet, ur **Livsmedelsverket, L 2025 nr 13 "Sveriges livsmedelskontroll
2024"**, tabell 13, 14 och 15:

| Mått 2024 | Tal |
|---|---:|
| Årsarbetskrafter i hela rikets livsmedelskontroll | **626** |
| Kontrollmyndigheter | 250 |
| Snitt per myndighet | **2,5 årsarbetskrafter** |
| Myndigheter med högst en årsarbetskraft | **111 av 250** |
| Verksamheter | 95 324 |
| Utförda kontroller | ca 78 000 |

SOU 2025:64 tabell 26.2 (s. 757) mäter samma sak från andra hållet: 1 037 personer
i 247 kommunala organisationer, drygt 700 årsarbetskrafter, och **147 kommuner
har 1 till 3 personer**.

Räkningen blir då enkel, med Pankows 2,5 timmar som ansats:

- 1 000 begäranden i veckan är **2 500 arbetstimmar i veckan**.
- Rikets 626 årsarbetskrafter är omkring 21 900 arbetstimmar i veckan.
- Det är **omkring elva procent av hela rikets livsmedelskontroll**, varje vecka,
  varaktigt.
- Träffar det i stället en kommun med tre handläggare, alltså det typiska fallet
  enligt SOU:ns egen tabell, tar en enda veckas begäranden **tjugoen veckor** av
  hela personalens arbetstid.

Talet tusen i veckan är beställningens tal och det är avsiktligt tilltaget. Vår
verkliga volym skulle bli mycket lägre, se §8.2. Men riktningen är det som spelar
roll: **kostnaden är helt asymmetrisk.** Falun tar inte betalt för de sex första
handläggningstimmarna och avgiftsförordningens tak ligger långt ovanför en
enskild rapport, så kommunen får arbetet och aldrig en krona. Till skillnad från
Storbritannien, där section 12 FOIA ger ett tak på 18 timmar och 450 pund för
andra än centralregeringen, finns i Sverige ingen kostnadsventil alls. Det är
samma sak som gör idén laglig som gör den skadlig.

### 4.3 Vad Tyskland faktiskt gjorde, och vad det ledde till

Kommunerna ändrade rutiner, men åt fel håll. Ur FragDenStaats och foodwatchs
egen dokumentation, 2019 till 2020:

- **Berlin-Neukölln** avslog först allt som missbruk, skickade sedan **helt
  svärtade** kontrollrapporter, och gav med sig först i juni 2020.
- **Berlin-Mitte** aviserade i november 2019 en handläggningstid på "minst 12 till
  15 veckor". En framställan från februari 2019 om personalmatsalen i det
  federala konsumentskyddsministeriet var obesvarad efter fjorton månader.
- **Magdeburg** krävde aktuellt folkbokföringsintyg. **Landkreis Harburg** krävde
  kopia av legitimation. **Landkreis Börde** vägrade ta emot per e-post.
  **Landkreis Mettmann** avslog med motiveringen att sökanden bara var
  fascinerad av portalen.
- **Landkreis Helmstedt** krävde 1 892 euro för en kontrollrapport om en
  Netto-butik och 1 757 euro för en Lidl-butik. Ingen annan av de omkring 380
  myndigheterna krävde jämförbara belopp, och **någon allmän avgiftsregim
  uppstod aldrig.** § 7 VIG ändrades inte.
- Berlin krävde tre stämningar från foodwatch, i september 2019, april 2020 och
  juni 2020, innan stadsdelarna började lämna ut.

**Ingen tysk myndighet gick över till proaktiv publicering på grund av trycket.**
Det var kampanjens uttalade mål och det uppnåddes inte. Pankow återstartade sin
smileyportal i november 2020, men motiverade det med EU:s kontrollförordning
2017/625 och inte med Topf Secret.

### 4.4 Goodwillen, vägd som bibeln säger

`docs/11` avsnitt 7b räknar upp goodwill mot myndigheter som ett värde, i
beskrivningen av anmälningsroboten. Beställningen ber om att det vägs. Här är
vägningen, och den faller åt ett håll.

**Projektets egen kod har redan avgjort frågan en gång.** `pipeline/begaran.py`
skriver i sin egen docstring:

> "**Skriptet skickar ingenting.** [...] Ett skript som både formulerar och
> skickar 249 myndighetsframställningar är ett massutskick oavsett vad det heter,
> och ett massutskick är precis vad den här kampanjen inte får vara."

H1 är ett skript som både formulerar och skickar, i mycket högre volym, utan att
någon läser vad som går ut. Om regeln var riktig för 249 brev är den inte mindre
riktig för tusen.

**Och de två maskinerna motarbetar varandra konkret.** Brevet i `docs/43`
avsnitt 7 ber en kommun om en fil med en rad per kontroll för hela beståndet, och
motiverar det med att ett ofiltrerat uttag är mer rutinbetonat än ett filtrerat.
Att samtidigt låta besökare skicka hundratals enskilda framställningar till samma
kommun om enskilda rapporter är att be samma handläggare göra samma arbete två
gånger, den dyra vägen. Om Stockholms 2 109 rader utan färsk kontroll skulle
begäras ut en i taget vore det, med Pankows 2,5 timmar, **5 270 arbetstimmar**,
alltså drygt tre av Stockholms 54 årsarbetskrafter under ett helt år. Samma
uppgifter finns i en enda fil.

**Slutsats: goodwillen är inte en abstrakt tillgång här, den är ingången till
A2.** Vi har skickat noll brev. `pipeline/data/utlamnanden.csv` innehåller en
rubrikrad och ingenting mer. Att bränna relationen innan det första brevet är
skickat är att betala för något vi ännu inte vet om vi behöver.

---

## 5. Fråga 3: hur ser svaret ut, och går det att läsa maskinellt?

### 5.1 Det svenska svaret är bättre än det tyska, och det är ett äkta fynd

Det tyska svaret, ur FragDenStaats egen FAQ:

> "Die Kontrollberichte sehen je nach Bundesland und zuständiger Behörde
> unterschiedlich aus. [...] Enthalten sind vorgefertigte Punkte, die jeweils
> angekreuzt werden, sowie in der Regel handschriftliche Anmerkungen der
> Kontrollierenden."

Alltså ikryssade blanketter med handskrivna anteckningar, oftast skickade per
post. FragDenStaats plattform ber användaren fotografera brevet, kör OCR, och
låter användaren svärta för hand innan publicering. Maskinläsbarheten är i
praktiken noll.

**Det svenska svaret är en textbaserad PDF på en till fem sidor efter en
nationell mall.** Livsmedelsverket publicerar mallen i Kontrollwiki artikel 623
(publicerad 2023-12-14) med fyra filer, med och utan avvikelser. Strukturen är
fast: rubrik, diarienummer, handläggare, verksamhet med organisationsnummer och
adress, kontrolldatum, kontrolltyp, och sedan två listor, "Kontrollerat utan
avvikelse" och "Avvikelser", där varje avvikelse bär tre underrubriker,
**Underlag för bedömning**, **Lagkrav** och **Uppföljning**.

Två faktiska publicerade rapporter, båda hämtade 2026-08-31:

| Rapport | Sidor | Storlek | Genererad | Text |
|---|---:|---:|---|---|
| Huddinge, dnr LIVS.2024.3588, kontroll 2024-12-09 | 2 | 257 kB | Aspose.PDF for .NET, alltså ur ärendesystemet | Ja, 3 440 tecken extraherbara |
| Svenljunga, dnr SBF-2026-567, kontroll 2026-05-19 | 5 | 307 kB | Digitalt | Ja |

Fem rapporter öppnades, samtliga var digitalt genererade och textbaserade, och
inte en enda var skannad. Urvalet är för litet för att generalisera till 250
myndigheter, och skannade rapporter kan mycket väl förekomma i äldre ärenden.

**Kostnaden per inläst rapport är alltså låg efter att en läsare är byggd**,
uppskattningsvis 20 till 40 timmar för mallen plus varianter, och sedan mest
noll per rapport. Men den är inte noll per svar, och det är den viktiga
skillnaden. Varje svar kommer som ett mejl med en bilaga som måste paras mot rätt
anläggnings-id, och rapporten bär handläggarens namn, telefon och e-post, alltså
personuppgifter som måste bort före publicering. Mallen anger dessutom att
verksamheten har rätt att yttra sig, och Internetstiftelsen anger att två veckors
publiceringsfördröjning är normen av det skälet.

### 5.2 Jämförelsen med A2, som är hela poängen

| | H1, en begäran per verksamhet | A2, en begäran per myndighet |
|---|---|---|
| Vad ett svar innehåller | 1 verksamhet, 1 kontroll | 1 000 till 9 456 verksamheter, flera års kontroller |
| Format | PDF, textbaserad, nationell mall | CSV, XML, JSON eller Excel enligt brevets önskan |
| Handläggning hos kommunen | 2 till 3 timmar, per rapport | ett uttag, en gång |
| Arbete hos oss per svar | mejl, bilaga, matchning, maskning | en adapter, sedan noll |
| Antal svar för Stockholm | 2 109 | **1** |

Och Tysklands utfall bekräftar riktningen. Av över 44 000 framställningar efter
ett år hade omkring 8 000 blivit publicerade resultat, alltså 18 procent. I
september 2021 var talen över 50 000 och över 10 000, alltså 20 procent.
**Fyra av fem framställningar blev aldrig ett publicerat dokument, och något
aggregerat dataset av de 56 000 har aldrig publicerats.** FragDenStaat kallar
samlingen Tysklands största publikt tillgängliga databas över
livsmedelskontrollresultat, och det är riktigt, men det är en samling dokument
och inte en databas.

Ett urvalsproblem ligger dessutom ovanpå. FragDenStaats mall begär rapporten
**bara om det fanns anmärkningar**, för att öka chansen att myndigheten svarar
alls. Den publicerade samlingen är därmed skev mot verksamheter med brister per
konstruktion, och foodwatchs "43 procent hade överträdelser" går inte att jämföra
med nationell statistik. Ett register som göds av en sådan kanal skulle ärva
skevheten, och det är oförenligt med `docs/44` avsnitt 7 punkt 2.

---

## 6. Fråga 4: vem ska stå som avsändare?

Tre vägar, och de har olika följder.

| Väg | Anonymitet | Klagorätt vid avslag | Vad vi får göra med svaret | Goodwillkostnad |
|---|---|---|---|---|
| **A. Besökaren i eget namn, egen mejl, egen klient** | Besökarens sak | Besökarens, och den fungerar | Ingenting. Svaret går till besökaren | Ingen. Vi är inte avsändare |
| **B. Vi i besökarens namn, svar till oss** | Illusorisk | Trasig, se nedan | Allt, men på oklar grund | Full |
| **C. Vi i eget namn, i mängd** | Ingen, och det är rätt | Vår, och den fungerar | Allt | Full, och riktad mot A2 |

**Väg B ska inte byggas, och skälet är HFD 2021 ref. 7.** Högsta
förvaltningsdomstolen slog fast att anonymitetsrätten enligt TF inte sträcker sig
till domstolsprocessen: namn måste anges när ett mål inleds, även i mål om
utlämnande, och kammarrätten fick avvisa ett anonymt överklagande. Lägg
OSL 6 kap. 7 § bredvid, där klagorätten tillkommer den som fått avslag, och
glappet blir tydligt: den som har klagorätten är besökaren, den som driver
ärendet är vi, och ingen av oss kan agera ensam. Det går att laga med fullmakt,
och det är precis den sortens konstruktion som gör att ingen förstår vem som gör
vad.

Väg B har dessutom en tyst följd som få tänker på. **En begäran om allmän handling
blir själv en allmän handling hos kommunen.** Skickar vi besökarens
mejladress dit blir adressen normalt offentlig och kan begäras ut av vem som
helst, och GDPR stoppar det inte, eftersom 1 kap. 7 § dataskyddslagen (2018:218)
föreskriver att förordningen inte tillämpas i den utsträckning det skulle strida
mot tryckfrihetsförordningen. Vi skulle alltså göra våra besökares adresser
offentliga som en biverkning av en knapp de tryckt på för att läsa en rapport.

**Väg C är juridiskt den renaste och strategiskt den dyraste.** Den löser
klagorätten, den håller besökarens uppgifter borta från kommunens diarium, och
den stämmer med R11 avsnitt 1.7 om att anonymitet är aktivt skadligt när en
sekretessprövning ska göras. Men den lägger vårt namn i 250 diarier som
avsändare av hundratals enskilda framställningar, samtidigt som samma namn står
under A2:s brev. Det är den kombination §4.4 avråder från.

**Rekommendation: väg A.** Besökaren skickar själv, i sitt eget namn, från sin
egen mejlklient. Vi skriver texten, vi fyller i rätt mottagaradress ur registret,
och vi trycker aldrig på skicka. Det ger tre saker på en gång: ingen
personuppgiftsbehandling hos oss att argumentera rättslig grund för, ingen
avsändarroll att förbruka goodwill med, och ingen spärrproblematik alls, eftersom
takethållandet ligger i besökarens egen brevlåda.

Priset är lika tydligt: **svaret göder inte registret.** Det är det som gör detta
till "mindre form" och inte till maskinen i H1. Se §9 för varför priset är rätt.

---

## 7. Fråga 5: spärren mot missbruk

Frågan gäller den fulla formen. Väljs väg A i §6 finns ingen spärr att bygga,
eftersom vi inte skickar något. Det som står här gäller om maskinen någon gång
ändå byggs, och det är också svaret på vad spärren skulle ha kostat.

### 7.1 Vad `docs/14` binder oss vid

Dokumentet är tydligt och det ska följas som det står. Bara två nycklar lagras,
`prikko.session` i localStorage och `prikko.next` i sessionStorage, båda på egen
origin, båda burna av undantaget för en tjänst användaren uttryckligen begärt.
Underhållsregeln är den skarpa gränsen:

> "läggs webbanalys, inbäddad video, delningsknappar, kartor från tredjepart som
> sätter kakor eller något annat tredjepartsskript till, är sidan osann samma dag,
> och då ska rutan byggas först."

**Det utesluter Cloudflare Turnstile och Friendly Captcha**, eftersom bägge är
tredjepartsskript. Det är inte ett juridiskt hinder, det är projektets eget löfte,
och `docs/45` avsnitt 5 säger att en funktion aldrig får kosta det som redan
fungerar.

### 7.2 Två rättelser till `docs/14` som förstudien tog med sig

Bägge gäller oavsett om H1 byggs.

**Parafrasen är strängare än lagen.** 9 kap. 28 § lagen (2022:482) om elektronisk
kommunikation, verifierad ordagrant mot riksdagens konsoliderade text 2026-08-31,
säger "**nödvändig** för tillhandahållande av en tjänst på uttrycklig begäran av
användaren". `docs/14` skriver "absolut nödvändigt". Paragrafnumret stämmer, och
den öppna punkten om att advokaten skulle verifiera lydelsen är därmed stängd.

**Undantaget är tjänstecentrerat, inte ändamålscentrerat.** Det finns inget
säkerhetsundantag i den svenska texten. EDPB:s Guidelines 2/2023 om den tekniska
räckvidden av art. 5.3 ePrivacy, antagna 2024-10-07, säger uttryckligen i punkt 4,
40 och 56 att de **inte** behandlar undantagen. Det enda europeiska stödet för ett
säkerhetsundantag är fortfarande WP29:s yttrande 04/2012 (WP194), som erkänner
användarcentrerade säkerhetskakor men uttryckligen inte tillåter dem på
"passing visitors". Det träffar `__cf_bm`, som sätts på varje verksamhetssida före
all interaktion. Det ändrar inte slutsatsen i `docs/14`, men det gör den tekniska
åtgärden dokumentet redan föreslår, att skjuta upp `publishedReviews()` till
första interaktion, till den enda som gör frågan hypotetisk. **Den bör prioriteras
upp oberoende av H1.**

### 7.3 Spärren som faktiskt håller

Fyra lager, i den ordning de ska byggas, sorterade efter nytta per juridisk
kostnad.

1. **Tak per verksamhet.** "Verksamhet X kan bli föremål för högst en begäran per
   trettio dagar" är en räknare på verksamhetens egen rad. Ingen IP, ingen kaka,
   ingen localStorage, ingen personuppgift, ingen rättslig grund att försvara,
   ingen policytext att skriva. 9 kap. 28 § är inte ens tillämplig. **Och den
   skyddar exakt det som behöver skyddas**, alltså den enskilda verksamheten mot
   att bli utpekad genom upprepning, oavsett vem som klickar, oavsett nät och
   oavsett hur många engångsadresser en angripare har.
2. **Globalt tak per period**, eftersom lager 1 inte hindrar någon från att
   trycka en gång på tiotusen olika verksamheter.
3. **Hastighetsbegränsning på servern med saltad hash av IP och kort fönster.**
   Detta är en GDPR-fråga och inte en kakfråga: serverns egen logg är inte lagring
   i terminalutrustningen. Men Breyer (C-582/14) gör en dynamisk IP till
   personuppgift, så grunden är berättigat intresse, salt roteras, rå adress
   lagras aldrig, och räknaren raderas när fönstret löper ut. Det kräver en rad i
   integritetspolicyn, som i dag inte nämner det.
4. **Altcha, självhostad**, om volymen ändå blir ett problem. Öppen källkod,
   proof of work, sätter ingenting i webbläsaren, ingen tredjepart, alltså det
   enda botskyddet som inte bryter underhållsregeln.

E-postbekräftelse hamnar sist. Infrastrukturen finns redan i form av
engångskoden, men den kostar 15 till 40 procent av de påbörjade inlämningarna
enligt branschsiffror, och den flyttar bara spärren från vem som helst till vem
som helst med en mejladress.

**En hård gräns som ofta glöms:** Resends gratisnivå ger 100 mejl per dygn och
3 000 per månad, och det står redan som skäl nummer två i
`pipeline/schema_community.sql` för att notisloggen finns. Hundra begäranden om
dagen är alltså taket på nuvarande stack, och de skulle konkurrera med
notismejlen.

---

## 8. Fråga 6: är det värt det?

### 8.1 Vad ett brev är värt

Räknat ur `pipeline/data/kommunregister.csv`, 250 rader, summa 92 746
anläggningar:

| Ett brev till | Anläggningar i svaret |
|---|---:|
| Stockholm | 9 456 |
| Göteborg | 5 418 |
| Malmö | 3 150 |
| Miljösamverkan östra Skaraborg, sex kommuner | 1 105 |

`docs/20` avsnitt 6.1 räknar utfallet av hela kampanjen: 238 brev ger 100 procents
täckning om alla svarar, och 67,5 procent vid 60 procents svarsfrekvens, mot
dagens 18,8 procent. Nettot är alltså **omkring 45 200 nya anläggningar**.

Arbetet: breven skrivs redan av `pipeline/begaran.py`, så kostnaden är att skicka,
spåra, påminna och läsa in. Med en kvart per brev för utskick och uppföljning
blir det 62 timmar, och med 150 timmar för adaptrarna i A4 landar hela A2 på
**omkring 210 timmar**.

> **45 200 verksamheter delat på 210 timmar är omkring 215 verksamheter per
> nedlagd timme.** Även vid en fördubblad tidsuppskattning är det 108.

### 8.2 Vad en knapp är värd

Efterfrågan är mätt i vår egen databas 2026-08-31, inte uppskattad:

| Mått | Tal |
|---|---:|
| Konton | 9 |
| Bevakningar | 21 |
| Personer som lagt en bevakning | 5 |
| Period | 2026-08-04 till 2026-08-30 |
| Notismejl som någonsin gått ut | **0** |

Det är **0,78 engagemangshandlingar per dygn på hela sajten**. En bevakning är
dessutom en billigare handling än att begära ut ett myndighetsdokument. Antag
ändå samma frekvens, och antag Tysklands egen genomförandegrad om 20 procent:

| Scenario | Begäranden per år | Användbara rapporter per år |
|---|---:|---:|
| **Vår uppmätta efterfrågan** | ca 285 | ca 57 |
| **Tysk intensitet, per capita** | ca 2 000 | ca 400 |

Det andra talet kommer ur att 56 000 framställningar över 3,5 år i ett land med
84,6 miljoner invånare motsvarar omkring 7 000 i Sverige med 10 605 520 invånare
(Kolada N01951 för 2025), alltså omkring 2 000 om året. Det förutsätter foodwatchs
räckvidd, nationell press och tio års varumärke. Vi har enligt `docs/49`
uppskattningsvis 1 400 indexerade sidor av 14 260 och ingen kopplad Search
Console.

Bygget: formulär, utskick med korrekt SPF, DKIM och DMARC, svarsinkorg, matchning
mot anläggnings-id, läsare för rapportmallen, maskning av handläggaruppgifter,
fyra spärrlager, villkorstext och policytext. **Uppskattningsvis 150 timmar**,
och den siffran är snäll.

> **57 delat på 150 är 0,38 verksamheter per nedlagd timme vid vår uppmätta
> efterfrågan. 400 delat på 150 är 2,7 vid tysk intensitet.**

### 8.3 De två vägarna bredvid varandra

| | A2, 250 brev | H1, knappen |
|---|---:|---:|
| Arbetstimmar | ca 210 | ca 150 |
| Nya verksamheter, år 1 | ca 45 200 | 57 till 400 |
| **Per nedlagd timme** | **ca 215** | **0,38 till 2,7** |
| Kvoten | 1 | **1/80 till 1/570** |

Ett annat sätt att säga samma sak: **ett enda brev till Göteborgs miljöförvaltning
är värt mer än allt knappen skulle producera på tio år vid tysk intensitet, och
mer än den skulle producera på nittio år vid vår.**

### 8.4 Tidsfönstret, som beställningen bad om och som ser annorlunda ut

Beställningen utgår från att SOU 2025:64 flyttar kontrollen till två myndigheter
den 1 januari 2028, alltså att båda vägarna kan bli onödiga inom två år. **Den
tidplanen är i praktiken övergiven.**

- Betänkandet överlämnades 2025-06-04. Remissen har diarienummer LI2025/01164,
  publicerades 2025-06-05 och hade sista svarsdatum **2025-10-06**. Därmed är den
  öppna punkten i `docs/44` avsnitt 9.1 besvarad.
- **2026-05-15 tillsatte regeringen en ny utredning.** Lagmannen Eva-Lotta Hedin
  ska med SOU 2025:64 och remissvaren som utgångspunkt analysera fyra alternativ,
  från total centralisering till ökad kommunal koncentration, och redovisa
  **5 januari 2027**.
- Ingen proposition finns, och ingen ny ikraftträdandedag går att belägga.

Att staten i maj 2026 startar om utredningen betyder att en kommunal motpart
finns kvar i minst tre till fyra år till. **Det gör A2 mer värt, inte mindre**,
och det tar bort det enda argument som hade kunnat tala för att bygga H1 snabbt.

---

## 9. Rekommendation

**Bygg i mindre form.** Preciserat, eftersom "mindre form" annars betyder vad
som helst:

**Bygg detta.** På en verksamhetssida där senaste kontrollen är äldre än två år,
eller saknas, står en rad som säger att uppgiften går att begära ut, med en länk
som öppnar besökarens egen mejlklient med rätt mottagaradress ur registret, en
färdig ämnesrad och en färdig text i besökarens eget namn. Texten ber om
handlingen och aldrig om uppgiften, den nämner ingen frist och inget lagrum utöver
2 kap. tryckfrihetsförordningen, och den bär inte vårt namn. Räkna klicken. Det
är uppskattningsvis fyra till åtta timmars arbete och det rör inte
`pipeline/` alls.

**Bygg inte detta.** Utskick från oss, svarsinkorg hos oss, matchning, inläsning,
maskning, spärrlager och den villkorstext som allt det kräver.

**Skälen, i ordning:**

1. **Avkastningen per timme skiljer med två tiopotenser**, och den mätningen är
   inte känslig för antaganden. Även om varje tal i §8 vore fel med en faktor tre
   åt det håll som gynnar H1 skulle A2 fortfarande vinna med marginal.
2. **Maskinen saknar sin motor.** 21 bevakningar från 5 personer är inte en
   efterfrågan som kan driva täckning. Den lilla formen är samtidigt
   mätinstrumentet: om klickräknaren passerar, säg, 200 klick i månaden är den
   här förstudien fel och ska göras om med riktiga tal i stället för
   uppskattningar.
3. **Priset skulle betalas i den valuta A2 behöver.** Vi har skickat noll brev.
   `utlamnanden.csv` har en rubrikrad. Att lägga vårt namn i 250 diarier som
   avsändare av hundratals enskilda framställningar innan det första brevet gått
   iväg är att sälja ingången till A2 för mindre än den är värd.
4. **Förlagan lyckades med det vi redan har och misslyckades med det vi behöver.**
   Topf Secret vann varje rättsfråga och fick aldrig ihop ett dataset. Vi behöver
   inte vinna rättsfrågan, vi har haft den sedan 1766. Vi behöver datan.
5. **Den lilla formen tjänar läsaren ändå.** 2 501 publicerade verksamheter har
   ingen kontroll nyare än två år och 1 565 har ingen alls (`docs/35` §3.3). I dag
   är det bara en tystnad på sidan. En rad som säger vad man kan göra åt saken är
   ärligare än tystnaden, den kostar inget, och den bryter ingen regel i
   `docs/45` avsnitt 5.

**H1 ska därmed strykas ur våg 1 och skrivas om.** Den nya lydelsen är: skriv
brevet åt besökaren, mät efterfrågan, och ompröva när det finns en efterfrågan att
tala om.

---

## 10. Vad som inte gick att belägga

| Fråga | Läge |
|---|---|
| Något BVerfG-avgörande om Topf Secret eller VIG 2019 till 2021 | Hittas inte. De som finns, 1 BvF 1/13 från 2018-03-21 och 1 BvR 1949/24 från 2025-07-28, gäller § 40 Abs. 1a LFGB, alltså myndighets egen publicering |
| Dom från VG Berlin i februari 2026 mot Pankows smileylista | Finns inte. Se §2, rättelse 2 |
| JO dnr 384-2025, åberopad i `docs/43` §5.5 | Numret går inte att belägga. Rättssatsen bärs av JO dnr 5301-2019 |
| Totalsiffra för Topf Secret efter juli 2022 | Ingen. Varken foodwatch eller FragDenStaat har uppdaterat sedan 56 000 |
| Uttalande från Bundesrat eller Länder om Topf Secrets administrativa börda | Hittas inte |
| Svensk officiell siffra på handläggningstid per utlämnandeärende | Finns inte. Därför används Pankows egna 2 till 3 timmar, som är tyska |
| Svenskt uttalande om automatiserat skickande som egen kategori | Finns inte, varken för eller emot |
| IMY-praxis om privata mellanhänder som förmedlar begäranden | Finns inte |
| Ny ikraftträdandedag efter att SOU 2025:64 omprövas | Okänd. Nästa hållpunkt är 2027-01-05 |
| Om skannade kontrollrapporter förekommer i Sverige | Fem av fem öppnade var textbaserade. Urvalet är för litet för att generalisera |
| SKR:s remissvar på SOU 2025:64 | Gick inte att lokalisera |

---

## 11. Två fynd som hör hemma någon annanstans

De föll ut av researchen, de gäller inte H1, och de ska inte glömmas bort här.

**Stockholms stad publicerar kontrolldata som öppna data, CC0, ur Ecos 2.**
Lagret `Livsmedelstillsyn` på `services-eu1.arcgis.com` gav 2026-08-31
**289 742 rader, en per kontrollpunkt, på 8 146 anläggningar**, med datum från
2018-01-02 till 2025-10-21, koordinater, riskklass och avvikelsestatus per
rapporteringspunkt. `docs/42` avsnitt 1 anger noll kommuner i grupp A och en i
grupp B. Det talet är fel, eller åtminstone ofullständigt. Vi läser redan
Stockholm på annan väg, så det är inte ny täckning, men det är historik och
avvikelser per punkt som vi kanske inte har. **Detta ska verifieras och föras in i
`docs/42`.**

**Den nationella specifikationen kan aldrig ersätta rapporten.**
"Livsmedelskontroller som öppna data" v2.0 bär bara rapporteringspunkternas koder
i två listor, godkända och anmärkta. Den bär inte fälten "Underlag för bedömning"
eller "Lagkrav", alltså inte den fritext som säger *varför*. Det är ett argument
för att A7, papperskommunerna, är värd mer än den ser ut, och det är en gräns som
hör hemma i `docs/11` avsnitt 11 om normaliseringen.

---

## 12. Källor

Allt hämtat 2026-08-31 om inget annat anges.

**Förlagan.** foodwatch pressmeddelande 2019-01-14 om lanseringen, 2022-07-14 om
56 000 framställningar, 2021-12-17 om VG Berlin 14 K 153/20, 2024-02-09 och
2024-04-17 om Berlins misslyckade transparenslag, `foodwatch.org`. FragDenStaats
kampanjsida, FAQ, måltabell och teknikblogg 2019-01-30,
`fragdenstaat.de/kampagnen/lebensmittelkontrolle/`. BVerwG pressmeddelande
60/2019 och `bverwg.de/290819U7C29.17.0`. VG Berlin 2024-12-16, VG 14 L 228/24,
refererat hos cibus Rechtsanwälte 2024-12-19. Berlins GVBl, upphävandet kungjort
2026-02-16 s. 67.

**Svensk rätt.** Tryckfrihetsförordningen 2 kap., `riksdagen.se`. Ds 2017:37
"Frekventa och omfattande ärenden om utlämnande av allmän handling",
Justitiedepartementet, PDF hos `regeringen.se`, s. 34, 37, 74 och 75. Motion
2014/15:128 och bet. 2014/15:KU15. Prop. 2019/20:179. OSL 6 kap. 1 a §, 6 kap.
4 § och 6 kap. 7 §. JO dnr 180-2014 (2014-07-10), JO dnr 5301-2019 (2020-10-22),
JO dnr 2939-2021 (2021-12-20), JO dnr 1274-2023 (2024-02-12), JO dnr 10735-2024
(2025-06-10). HFD 2021 ref. 7. Dataskyddslagen (2018:218) 1 kap. 7 §.
Lag (2022:482) om elektronisk kommunikation 9 kap. 28 §, konsoliderad text på
`data.riksdagen.se`.

**Kapacitet och format.** Livsmedelsverket, L 2025 nr 13, "Sveriges
livsmedelskontroll 2024", tabell 13, 14, 15 och 24 samt s. 22, 23, 36 och 37.
SOU 2025:64, s. 26, 42, 426, 757 och 758. Regeringens remiss LI2025/01164,
publicerad 2025-06-05, svarsdatum 2025-10-06. Regeringens pressmeddelande
2026-05-15 om den nya utredningen med redovisning 2027-01-05. Livsmedelsverkets
Kontrollwiki artikel 623 "Kontrollrapport", publicerad 2023-12-14. Faluns taxa
för utlämnande av allmän handling, beslutad 2025-04-15 § 56. ICO om section 12
FOIA. Internetstiftelsen, Dataverkstaden, "Livsmedelskontroller", 2025-06-17.

**Samtycke och spärrar.** PTS, "Kakor (cookies)", uppdaterad 2024-05-14. EDPB
Guidelines 2/2023 on the Technical Scope of Art. 5(3) ePrivacy Directive, v2.0,
antagna 2024-10-07, punkt 4, 40, 44, 52 till 56. WP29 Opinion 04/2012 (WP194).
EU-domstolen C-582/14 Breyer. Altcha, `altcha.org/docs/gdpr/`.

**Eget material.** `pipeline/data/kommunregister.csv`, 250 rader, summa 92 746
anläggningar, räknat 2026-08-31. `pipeline/data/utlamnanden.csv`, en rubrikrad
och noll poster. `pipeline/begaran.py`, docstring. `pipeline/schema_community.sql`.
Supabase, community-schemat, räknat 2026-08-31: 9 konton, 21 bevakningar,
5 personer med bevakning, 20 omdömen, 3 anspråk, 0 skickade notismejl.
`docs/20` §6.1, `docs/35` §3.3, `docs/42` §1, `docs/43` §5 och §7, `docs/44` §2.1
och §9, `docs/45` §H och §6, `docs/49` §1.
