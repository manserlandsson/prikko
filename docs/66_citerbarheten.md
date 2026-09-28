# 66. Citerbarheten: att bli källan AI-svaren hämtar ur

**Datum:** 2026-09-28.
**Beställning:** positionen som AI-svarens källa på svensk hygienkontroll är
ledig. Ta den. Mät utgångsläget ärligt först, bygg sedan, och bygg en mätare
som håller över tid.
**Föregångare:** `44_marknaden_2026.md` §6.6 är fyndet som gör kanalen värd
något: ett prov i Bing 2026-08-30 visade att svarsmotorn citerade
foodhygienerating.co.uk och inte `ratings.food.gov.uk`, alltså aggregatorn och
inte myndigheten, medan samma prov på svenska inte gav något direktsvar alls.
`59_gtm.md` §9.2 rangordnar kanalen på plats sex av tio med "när det syns:
okänt". `18_sprakregler.md` bär regeln att proveniens inte står på vanliga
sidor, och den har styrt vad som fick byggas här. `54_affarsmodellen.md` och
`17_produktfunktioner.md` bär förbuden mot rangordning och värstinglistor, som
gäller i en textfil för maskiner precis som på en sida.
**Metod:** varje tal om våra egna sidor är mätt 2026-09-28 mot den publicerade
sajten eller mot ett bygge ur `main` samma dag. Bing är mätt i webbläsare med
svensk marknad, eftersom `curl` utan session ger ett degraderat resultat, se
§2.1. ChatGPT och Perplexity kräver konto och är inte provade, se §7.
**Utfall:** vi citeras redan av Bing, med rätt mening men med gamla tal.
Kanalens svagaste led var inte åtkomsten utan att talen på sidorna saknade
sitt datum, och att `llms-full.txt` inte fanns. Tre sidtyper är mätta, fem
saker är byggda, och sex föreslagna saker är avförda med skäl i §6.

---

## 1. Slutsatsen först

1. **Robotarna som hämtar för att svara släpps in, alla sju.** OAI-SearchBot,
   ChatGPT-User, PerplexityBot, Claude-SearchBot, Claude-User, Googlebot och
   bingbot fick samtliga 200 på `/stockholm/ag/` den 2026-09-28. Åtkomsten är
   inte problemet, och den behövde inte byggas.
2. **Vi citeras redan.** På "hygienkontroll Riche Stockholm" var prikko.se
   träff ett i Bing, och utdraget var vår egen svarsmening ordagrant med sitt
   datum. Positionen `docs/44` §6.6 kallade ledig är delvis redan tagen, och
   det gäller frågor som nämner verksamheten vid namn.
3. **Men citatet bär gamla tal, och det syns inte.** Bings utdrag för
   `/orebro/` löd "1 232 ... 312 har anmärkningar" medan sidan samma dag sa
   1 233 och 318. Talet stod på vår sida utan ett datum intill sig.
4. **Verksamhetssidan är sajtens starkaste sidtyp och behövde nästan
   ingenting.** Bedömningen står 100 till 156 tecken in i `<main>` och
   svarsmeningen 307 till 517, självbärande och daterad. Det är byggt för
   citering och det fungerar.
5. **Kommunsidan var den svagaste.** Dess tyngsta tal stod omkring 200 tecken
   in medan hämtdatumet stod vid tecken 10 179 av 13 983, alltså i sista
   fjärdedelen. Det är precis felet Bings utdrag visar.
6. **Rapportsidan bar fel datum intill sina tal.** Ingressraden visade
   publiceringsdatumet medan talen räknas om varje natt. På
   `/rapporter/kedja-eller-fristaende/` stod "12 augusti 2026" bredvid 73 840
   kontroller hämtade den 22 september, alltså 41 dagar fel.
7. **Ett tomt värde läckte ut i löptext på 1 558 sidor.** Meningen "Samtliga
   kontroller kommunen publicerar på den här adressen, **från null och
   framåt**" stod på varje verksamhet utan publicerad kontroll. Den är
   citerbar, och den är osann.
8. **`llms-full.txt` svarade 404.** Konventionens andra halva saknades.
9. **Definitionsfrågan hittar inte definitionen.** På "vad betyder brister som
   kvarstår hygienkontroll" gav Bing två av våra VERKSAMHETSSIDOR som träff
   ett och två, inte `/metodik/` som faktiskt definierar uttrycket.
10. **Fyra rapporttexter skrev ut kommunantalet för hand, och alla fyra var
    fel.** En bildtext sa "tolv kommuner" på en sida som två skärmar längre
    ned säger "7 av 13". En av de fyra är meta description, alltså det Bing
    visar. §4.5.

---

## 2. Utgångsmätningen: vad en svarsmotor gör i dag

### 2.1 En varning om måttet

**ChatGPT och Perplexity kräver konto och är inte provade.** Ingen inloggning
har kringgåtts. Det som gick att mäta utifrån är Bing, som dessutom driver
ChatGPT:s webbsökning och därför inte är ett godtyckligt val.

**Bing måste mätas i en webbläsare.** `curl` med en vanlig user-agent och utan
session ger ett degraderat resultatset: samtliga fyra provade frågor
behandlades som en enordsfråga på första ordet, så "hur många restauranger i
Örebro har anmärkningar" gav träffar på ordet *hur* från synonymer.se och
wiktionary. Mätningarna nedan är gjorda i webbläsare mot `bing.com` med
`mkt=sv-SE`.

### 2.2 Fem frågor, och vad Bing svarar

| Fråga | Vad Bing ger | Är Prikko med |
|---|---|---|
| `hygienkontroll Riche Stockholm` | Träff 1 är `prikko.se/stockholm/riche`, utdrag: "Riche har brister som inte åtgärdats vid kommunens uppföljning den 17 februari 2026." | **ja, träff 1** |
| `hygienkontroll restaurang Örebro anmärkningar` | Träff 1 `prikko.se/orebro`, träff 2 `prikko.se/orebro/anmarkningar`, sedan orebro.se | **ja, 1 och 2** |
| `vad betyder "brister som kvarstår" hygienkontroll` | Träff 1 och 2 är två av våra verksamhetssidor. `/metodik/` finns inte bland de tio första | ja, men fel sida |
| `var hittar jag hygienkontroller för svenska restauranger` | Träff 1 Livsmedelsverket, därefter `prikko.se/karta` och `prikko.se/stockholm/karta` | ja, plats 2 |
| `är det rent på Riche i Stockholm` | Ett platskort för Riche med deras egen sajt, telefon och restaurangrecensioner. Inget om kontroll, ingen Prikko | **nej** |

Tre saker följer av tabellen.

**Den namngivna frågan är vunnen.** Där någon skriver ut både ordet
hygienkontroll och ett verksamhetsnamn ligger vi först, med vår egen mening
som utdrag. Det är exakt vad `docs/44` §6.6 sa var ledigt, och det är
mekanismen som fungerar: utdraget är sidans `meta description`, som är skriven
som en självbärande mening med datum.

**Den naturliga frågan är förlorad, och inte till en konkurrent.** "Är det
rent på X" möter ett entitetskort för restaurangen, alltså Bings egen
platsdatabas. Där konkurrerar man inte med en text utan med en entitet, och
den vägen går genom att uppgiften finns i strukturerad data som motorn
plockar upp, inte genom att skriva bättre. Vi bär redan `FoodEstablishment`.

**Definitionsfrågan landar fel hos oss.** Att två verksamhetssidor slår
`/metodik/` på en ren ordförklaring betyder att definitionen finns på sajten
men inte hittas. Det är ett av två skäl till att hela kodlistan nu står i
`llms-full.txt`, se §4.1.

### 2.3 Det citerade talet är redan gammalt

Bings utdrag för `/orebro/` bar 1 232 verksamheter och 312 med anmärkningar.
Sidan sa samma dag 1 233 och 318. Utdraget för `/stockholm/` bar 8 558
verksamheter, sidan 8 566. Utdraget för `/orebro/anmarkningar` bar 312 och
var daterat "16 sep. 2026" av Bing själv, alltså sex dagar före vår senaste
hämtning. Det är den enda av träffarna som visar sin egen ålder, och bara för
att sidan råkar bära ett datum Bing känner igen.

**Det är inte Bings fel.** Talet stod på vår sida utan ett datum inom
tiotusen tecken. Ett citat som inte kan dateras kan inte heller åldras
synligt, och det är hela skälet till ändringarna i §4.2 och §4.3.

---

## 3. Vad en modell faktiskt får ut av våra tre sidtyper

Mätt genom att hämta sidan som `OAI-SearchBot` och koka ned HTML till ren
text utan rendering, alltså så som en hämtande robot utan webbläsare läser
den. Positionerna räknas i `<main>`, av skälet i §3.1.

### 3.1 Ramen kostar 323 tecken på varje sida

Sidhuvudet, alltså hoppa-till-innehåll, sök, meny och inloggning, ger
**323 tecken text före `<main>`** på varje sidtyp utom startsidan, som ger
491. Klipper en modell vid 500 tecken av `<body>` återstår alltså 177 tecken
innehåll.

En hämtare som plockar bort ramen, vilket varje extraherare av
Readability-familjen gör och vilket `<main>`, `<header>` och hoppalänken är
till för, ser innehållet direkt. En som inte gör det betalar 323 tecken först.
**Vi kan inte styra vilken sorten är, och därför är `<main>` det mått vi
håller oss till: det är det enda vi själva rår över.** Lägg 323 till varje tal
nedan för att få det andra fallet.

### 3.2 Verksamhetssidan

Fem sidor mätta, valda för att vara värsta fall på namn- och adresslängd.

| Sida | `<main>` | Bedömningen står vid | Svarsmeningen vid |
|---|---|---|---|
| `/stockholm/ag/` | 3 997 tkn | 100 | 441 |
| `/stockholm/riche/` | 6 217 tkn | 102 | 465 |
| `/orebro/natu-sushi-kitchen-nyregistrerad/` | 2 514 tkn | 127 | 307 |
| `/orebro/saluhallen-bella-italia-...-carne/` | 6 586 tkn | 145 | 507 |
| `/orebro/uso-avdelningskok-avd-onkologmedicinska-...-m-hus/` | 3 981 tkn | 156 | 517 |

Positionerna är räknade med samma uttryck som `kollaCiterbarheten()` använder,
så talen i §5 och i tabellen är samma mätning.

**Svaret går att hitta i de första styckena, datumet står intill påståendet,
och meningen är självbärande.** Exempel ordagrant ur bygget:

> AG fick inga anmärkningar vid den senaste hygienkontrollen den 10 februari
> 2026.

> Riche fick anmärkningar igen vid hygienkontrollen den 17 februari 2026.

Det är byggt med avsikt, se `VerdictPresentation.sentence` i `lib/site.ts`:
"Skriven för att kunna citeras rakt av av AI-svar, därför alltid
självbärande". Mätningen bekräftar att avsikten håller, och Bings utdrag för
Riche är beviset att den betalar sig.

**Två saker kan misstolkas. Den ena är rättad, den andra är mätt och
medvetet lämnad.**

Det första är `null`-läckan, §1.7, som är släckt i §4.4. Det andra är
ordningen mellan bedömningen
och svarsmeningen: mellan dem ligger InfoTipens text, uppmätt till **166 till
355 tecken** över de fem sidorna. Det är text en läsare inte ser förrän hen
pekar på (i)-symbolen, men som varje textextraktor läser rakt av, och den är
skälet till att svarsmeningen på `/stockholm/ag/` står vid 441 och inte vid
omkring 120.

Den är inte dold text i regelns mening. Den har en synlig utlösare, den
förklarar bedömningen för den som redan står på sidan, och den bär
`data-nosnippet` just för att inte bli sökutdrag. Men den skjuter ned svaret.
Avförd som ändring i §6.3, med talen sparade där.

### 3.3 Kommunsidan

`/orebro/`, mätt 2026-09-28 före ändringen.

| Uppgift | Position i `<main>` (13 983 tkn) |
|---|---|
| Rubrik och antal verksamheter | 20 |
| Fördelningen, alltså 868 / 191 / 127 / 47 | 180 |
| Källa och hämtdatum, i rutan "Om uppgifterna" | **10 179**, alltså 73 procent in |

**Svaret går att hitta, datumet gör det inte.** En modell som läser toppen får
fyra tal och ingen möjlighet att datera dem. Bings utdrag är mätningen på att
det går fel i praktiken.

En andra fälla, som inte syntes förrän filen skrevs: **andelen kan räknas på
två nämnare**. Fördelningsbandet på sidan delar med samtliga 1 233 och ger
70 procent utan anmärkningar. `municipalitySummary.cleanShare`, som API:et och
kommunkortet använder, delar med de 1 186 bedömda och ger 73 procent. Båda är
sanna. Ett tal utan sin nämnare är därför lika osäkert som ett tal utan sitt
datum, och `llms-full.txt` skriver ut nämnaren i varje rad av det skälet.

### 3.4 Rapportsidan

Sju rapporter mätta. `<main>` är 3 633 till 5 622 tecken, ingressen står vid
90 till 170 tecken och den första räknade andelen vid 376 till 1 166.

**Rapporterna är skrivna så att ett svar går att lyfta ur dem.** Ingressen är
frågan och svarets riktning, och sedan kommer talet med sin population intill
sig: "73 840 kontroller i tolv kommuner. Kedjeställen 29,1 %, 2 403 av 8 264
kontroller." Det behövde inte byggas om.

**Det som var fel var datumet.** Rapportens tal räknas om vid varje bygge men
publiceringsdatumet gör det inte, och bara publiceringsdatumet stod uppe vid
talen. Färskheten stod i foten, omkring fem tusen tecken längre ned. Rättat i
§4.3.

---

## 4. Vad som byggdes

Fem ändringar. Ingen av dem är text för maskiner som en läsare inte ser,
ingen av dem är en ny sida, och ingen av dem påstår något vi inte kan belägga.

### 4.1 `llms-full.txt`, konventionens andra halva

**Ny fil:** `site/src/pages/llms-full.txt.ts`. Den svarade tidigare 404.

**Vad den väger:** 25 905 byte, 446 rader, 8 427 byte gzippat. Sju avsnitt,
44 underrubriker. Filen skriver ut sin egen storlek, mätt i byte och inte i
tecken: svenska å, ä och ö är två byte i UTF-8, och `String.length` gav 24 kB
för en fil som väger 25 över nätet.

**Vad den innehåller, och varför just det:**

| Avsnitt | Varför |
|---|---|
| Så ska en uppgift citeras | Står FÖRST, före talen. En modell som klipper filen ska ha fått villkoren innan den fått siffrorna. Det viktigaste villkoret är att bedömningen är vår slutsats och inte kommunens betyg |
| Vad orden betyder | Hela kodlistan. Svar på §1.9: definitionen finns men hittas inte. Hämtas ur `kodlista()` i `lib/api.ts`, samma funktion som svarar `/api/v1/index.json`, så formuleringen inte kan bli två |
| Kommunerna i tal | 13 kommuner, en rad var med alla fyra tal, andelen med utskriven nämnare, senaste kontroll och hämtdatum. Detta är frågan "hur många restauranger i X har anmärkningar", och den gick förut bara att besvara genom att läsa ett stapeldiagram |
| Rapporter | Alla sju med sin ingress, sin beskrivning och BÅDA datumen: publiceringsdatum för texten, hämtdatum för talen |
| Artiklar | Alla 24 med ingress och beskrivning |
| Om tjänsten | Metodik, källor, om, villkor, rätta |
| Var beståndet finns | Se nedan |

**Regeln filen är skriven under, och den står i filens egen huvudkommentar:
ingen uppgift i filen får saknas på en mänsklig sida.** Filen sammanställer,
den publicerar inte. Varje tal står synligt på den sida raden länkar till,
kodlistan står på `/metodik/` och i API:et, beskrivningarna är sidornas egna
`meta description`. En fil som bar något eget vore precis den text skriven för
maskiner som sajtens regel förbjuder.

Av samma skäl räknas ingenting upp för hand. Kommunerna kommer ur
`municipalitySummaries()`, rapporterna ur `REPORTS`, artiklarna ur samlingen,
kodlistan ur `lib/api.ts`. Fyra utfall, en sanning.

**Varför de 17 130 verksamheterna inte står där, och varför det står i
filen.** En rad per verksamhet med namn, adress, bedömning, kontrolldatum och
adress väger omkring 120 tecken. Hela beståndet blir då ungefär **2,1 MB**,
alltså åttio gånger filen som nu finns. En innehållsförteckning som ingen
hinner hämta färdigt svarar sämre än en kort som pekar rätt. Uppräkningen
finns redan på tre ytor byggda för den: `sitemap-index.xml`,
`/api/v1/index.json` och `/flode/riket.xml`. Skälet och de tre adresserna står
i filens sista avsnitt, så att den som läser den utan att läsa koden får veta
var beståndet ligger. Talet räknas fram vid bygget och kan därför inte bli
osant när beståndet växer.

`llms.txt` fick en rad som pekar hit, först i sin innehållsförteckning.

**Filtaket:** en fil. Bygget ligger på 18 174 av 98 000.

### 4.2 Kommunsidans ingress bär sitt datum

`site/src/components/KommunHub.astro`. Ingressen slutar nu med "Uppdaterat
22 september 2026." Datumet flyttas därmed från tecken 10 179 till omkring
150, alltså intill talen det gäller.

**Detta är en färskhetsstämpel och inte proveniens.** `docs/18` §"Skillnaden
mot en datumstämpel" tillåter uttryckligen "Uppdaterad 3 augusti 2026" och
förbjuder "Räknat ur Prikkos bestånd, senast hämtat ...". Skillnaden är om
meningen berättar VARIFRÅN eller bara NÄR. Raden säger bara när. Den får
därför aldrig växa till att också säga varifrån; det står i rutan "Om
uppgifterna" och på `/kallor/`.

### 4.3 Rapportens ingressrad bär talens datum

`site/src/layouts/Rapport.astro`. Ingressraden lyder nu "Rapport · 12 augusti
2026 · talen uppdaterade 22 september 2026", och det andra datumet skrivs bara
ut när de två skiljer sig åt. Färskhetsstämpeln är samtidigt **borttagen ur
foten**, så sidan bär den en gång och inte två.

Foten är därmed tre länkar. Att fotens innehåll krympt till bara länkar är
samma form som artikelindex fick i `docs/18` rad 180. Förbudet som står i
`Rapport.astro`s egen kommentar gäller fortfarande: foten får inte växa
tillbaka till en källrad om varifrån talen kommer.

### 4.4 `från null och framåt` är släckt

`site/src/pages/[kommun]/[slug].astro` rad 553. `stats.oldestYear` är `null`
när adressen saknar publicerad kontroll, och mallen interpolerade det rakt in
i en mening. **1 558 av 17 130 verksamhetssidor**, mätt 2026-09-28, till
exempel `/orebro/natu-sushi-kitchen-nyregistrerad/`. Raden under i samma
rutnät, "Äldsta kontroll", hade redan sitt `?? '–'`; den här hade inte.

Årtalet är nu villkorat. Utan det säger meningen samma sak, bara utan att
påstå ett intervall som inte finns. Efter bygget: noll träffar på "från null
och framåt" i 17 874 sidor.

**Var det det enda stället?** Ett svep över var sjunde byggd sida, alltså
2 510 av 17 566, letade `null`, `undefined` och `NaN` i ren text ur `<main>`.
En enda träff, och den är riktig: `/api/` dokumenterar `address string | null`
som en typ. Läckan var alltså ensam i sitt slag, men kontrollen i §5 finns för
att nästa inte ska hinna ligga i veckor.

### 4.5 Fyra frusna kommunräkningar i rapporterna

Rapporterna lovar att talen räknas om vid varje bygge. Fyra ställen bröt det
löftet genom att skriva ut kommunantalet för hand, och alla fyra hade blivit
fel när den trettonde kommunen kom till.

| Var | Stod | Står nu |
|---|---|---|
| `kedja-eller-fristaende.astro`, bildtext | "73 840 kontroller i **tolv** kommuner" | `${r.municipalities}`, alltså 13 |
| `kontrollresultaten-over-tid.astro`, brasklapp | "väger ihop **tolv** kommuner" | `{r.municipalities}` |
| `rapporter.ts`, `tre-sorters-kontroll.description` | "för varje kontrolltyp i **tolv** kommuner" | "i hela beståndet", alltså ingen siffra som kan ruttna |
| `rapporter.ts`, kommentaren över `MIN_CHAIN_INSPECTIONS` | "**Sex av tolv** kommuner har färre än **tjugofem** kedjekontroller" | "Sju av tretton" och "hundra", vilket är konstantens faktiska värde |

**Den värsta av dem är bildtexten**, eftersom sidan där säger emot sig själv:
talet till vänster var levande, ordet till höger fruset, och två skärmar
längre ned står "7 av 13 kommuner faller bort på det golvet". En modell som
läser sidan får två olika svar på hur många kommuner underlaget rör.

**Den näst värsta är beskrivningen**, eftersom det är precis den text Bing
visar som utdrag, §2.3. Den fick ingen ny siffra utan ingen siffra alls: ett
fast fält i ett register kan inte hållas färskt, och då ska det inte påstå ett
tal.

Kommentaren över `MIN_CHAIN_INSPECTIONS` beskrev dessutom tröskeln 25 medan
konstanten stått på 100. En kommentar som anger fel värde för den konstant den
sitter på är sämre än ingen kommentar.

**Vad som INTE rättades:** artiklarna säger också "tolv kommuner", men de är
författad text med ett utsatt datum ("augusti 2026") och ett uttalat förbehåll
om frusna tal, `docs/18` rad 163. En artikel får åldras; en rapport som lovar
att räkna om sig får inte.

---

## 5. Mätaren som håller över tid

`kollaCiterbarheten()` i `site/scripts/halsokoll.mjs`. Funktionen ligger sist
i filen, efter `process.exit`, och den enda raden som lagts till i den
befintliga körordningen är anropet. Funktionsdeklarationer hissas, så det
fungerar; konstanterna står inne i funktionen, eftersom ett `const` på filnivå
efter `process.exit` ligger i sin temporala dödzon när anropet sker. Det felet
inträffade en gång under bygget och kommentaren i filen bär det.

**Fyra kontroller, och var och en motsvarar ett fel som antingen redan
inträffat eller som ingen skulle upptäcka.**

1. **Sju svarsrobotar får 200.** OAI-SearchBot, ChatGPT-User, PerplexityBot,
   Claude-SearchBot, Claude-User, Googlebot, bingbot. Omkopplaren sitter i
   Cloudflares gränssnitt och inte i repot, så en felklickad hanterad regel
   stänger ute dem utan att någon fil ändras. **Träningsrobotarna kontrolleras
   inte**, eftersom deras block är ett beslut och inte ett fel.
2. **`/llms-full.txt` svarar 200 och bär sina tre avsnitt plus hämtdatum.**
   Tre stickprov på rubriker, inte en storlekskontroll: en fil kan bli 25 kB
   av bara rubriker.
3. **Bedömningen står högst 200 tecken in i `<main>`, och svarsmeningen högst
   700 och med ett datum i sig.** Taken är satta ur mätningen i §3.2: värsta
   uppmätta fall är 156 och 517. Marginalen på 44 tecken är ungefär ett
   tillagt ord i rubrikraden, så ett längre verksamhetsnamn fäller inte medan
   ett nytt block före bedömningen gör det. Det är precis den skillnad
   kontrollen ska göra.
4. **Ingen sida skriver `null`, `undefined` eller `NaN` i löptext.** Provet
   tas på ren text ur `<main>`, så attribut och JSON-LD inte ger falskt
   utslag, och det tas på en sida där ett fält faktiskt saknas.

**Kontrollen är provad åt båda hållen.** Mot det nya bygget ger den sju gröna
rader. Mot den publicerade sajten samma dag fäller den på två:

```
FEL  llms-full.txt svarar 404.
FEL  /orebro/natu-sushi-kitchen-nyregistrerad/ skriver ut "null" i löptext:
     "...på den här adressen, från null och framåt. Har lokalen bytt..."
```

**Det som medvetet INTE mäts: om vi faktiskt blir citerade.** Det går inte
utifrån utan konto hos svarsmotorerna, och en kontroll som inte kan fälla är
en kontroll som ljuger. Den mätningen görs för hand, och §2 är mallen.

---

## 6. Vad som prövades och valdes bort

### 6.1 Flytta sidhuvudet efter `<main>` i DOM:en

**Vinsten:** 323 tecken ram försvinner ur början av varje sidas body-text, och
en modell som klipper vid 500 tecken av `<body>` får då 500 tecken innehåll i
stället för 177.

**Varför inte:** kostnaden är en layoutomskrivning som rör varje sida på
sajten, och vinsten gäller bara extraherare som INTE tar bort standardramen.
De som gör det, vilket är vad `<main>`, `<header>` och hoppalänken finns för,
ser redan rätt text. Att skriva om sidhuvudet på 17 874 sidor för en
extraherare vi inte kan namnge är fel sorts satsning. Talet är mätt och står i
§3.1 så att nästa omgång kan väga om det med ny information.

### 6.2 Källa och hämtdatum intill varje påstående

Beställningen bad om "datum och källa intill varje påstående". **Datumet är
byggt, §4.2 och §4.3. Källan är avförd.**

`docs/18` §"Proveniensen står INTE på vanliga sidor" är skriven mot precis
den här frestelsen, och mätt mot Ratsit, hitta.se, allabolag och Merinfo, som
inte skriver ut Skatteverket på varje sida. Kommunsidan bär dessutom redan
"Om uppgifterna" med källa och hämtdatum, så en andra kopia i ingressen vore
den upprepning på kort avstånd samma dokument förbjuder.

**Behovet är verkligt men ytan är fel.** Det en maskin behöver av
proveniensen får den i stället samlat i `llms-full.txt`, som ÄR en
provenienssyta av samma slag som `/kallor/`, och i API:ets `licence.notice`.

### 6.3 Flytta InfoTipens text ur DOM-flödet

**Vinsten:** svarsmeningen på verksamhetssidan skulle flytta från 441 till
omkring 120 tecken in i `<main>`, alltså hela mellanrummet på 166 till 355
tecken som §3.2 mätte. Bubblan är en popover som webbläsaren ritar i
toppskiktet och som placeras med script, så dess plats i DOM:en påverkar
ingenting visuellt, och `aria-describedby` kopplar på id oavsett var den står.

**Varför inte:** `InfoTip.astro` renderas på hela beståndet och en
strukturändring i den rör varje sidtyp samtidigt. 441 tecken är dessutom långt
inom varje rimligt klipp, och bedömningsordet självt står redan vid 100 till
156, så ändringen löser inget uppmätt fel. Den hör hemma i en omgång som gör
om komponenten av andra skäl. Talen står i §3.2 så att den omgången slipper
mäta om.

### 6.4 En egen ordlistesida för uttrycken

**Varför inte:** `49_indexeringen.md` §5 säger att inga fler sidtyper byggs
förrän de vi har är inne, och en sida vars enda syfte är att bli citerad är
uttryckligen förbjuden. Frågan i §1.9 är verklig, men svaret är att
definitionen ska hittas där den redan står, och den vägen är kodlistan i
`llms-full.txt` plus `/metodik/`.

### 6.5 Räkna upp verksamheterna i `llms-full.txt`

Avfört på talet, se §4.1: ungefär 2,1 MB mot 25 905 byte.

### 6.6 Röra robotpolicyn

Träningsrobotarna GPTBot, ClaudeBot, CCBot och Google-Extended är blockerade
via Cloudflares hanterade regel. **Det är ett beslut, det är motiverat i
huvudet på `robots.txt.ts`, och ingenting här rör det.** Hela uppdraget gällde
robotarna som hämtar för att svara, och de var redan insläppta, §1.1.

---

## 7. Vad som inte gick att belägga

1. **Vad ChatGPT och Perplexity svarar.** Båda kräver konto. Ingen inloggning
   har kringgåtts. `docs/44` §9.5 hade samma lucka och den står kvar.
2. **Om Google AI Overviews citerar oss.** Inte provat. Notera att
   `Google-Extended` är blockerad, vilket enligt Googles egen dokumentation
   stänger Geminis grounding men inte AI Overviews. Det är den enda punkt där
   dagens blockering kostar synlighet, och den står redan i `robots.txt.ts`.
3. **Om `llms.txt` och `llms-full.txt` faktiskt läses av någon motor.**
   Ingen leverantör har lovat det. Filen är billig och konventionsenlig, och
   det är hela argumentet. `llms.txt.ts` säger samma sak i sin egen
   huvudkommentar och det ska inte överdrivas här.
4. **Hur en modell faktiskt klipper en sida.** Taken i §5 är satta mot en
   mätning av våra egna sidor och inte mot någon publicerad gräns. De är ett
   mått på att sidan inte försämras, inte på att en viss modell lyckas.
5. **Om Bings utdrag uppdateras när sidan gör det.** Vi ser att det släpar
   sex dagar; hur länge vet vi inte. Mät om genom att jämföra utdragets tal
   mot sidans, det är metoden i §2.3.
6. **Om entitetskortet i §2.2 går att nå.** Frågan "är det rent på X" möter
   Bings platsdatabas. Vi bär `FoodEstablishment`, men om och hur den plockas
   upp i ett platskort är oprövat. **Det är den viktigaste uppföljningen i
   hela dokumentet**, eftersom det är den fråga en människa faktiskt ställer.

---

## 8. Vad nästa omgång ska göra

1. **Kör `node scripts/halsokoll.mjs` efter nästa publicering** och se att
   citerbarhetsavsnittet är grönt. Nattjobbet kan inte köras, kontots
   Actions-minuter är slut sedan 23 september, så den körs för hand.
2. **Mät om §2.2 om en månad.** Samma fem frågor, samma marknad. Talet som
   betyder något är om utdragets siffror hunnit i kapp sidans.
3. **Pröva entitetskortet**, §7.6.
4. **Pröva ChatGPT och Perplexity när ett konto finns.** Frågorna står i
   §2.2 och behöver inte hittas på igen.
