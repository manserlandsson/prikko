# 44. Marknaden 2026: vad som ändrats, och vad vi inte har tänkt på

**Datum:** 2026-08-30
**Föregångare:** `docs/31_vad_far_folk_att_valja_oss.md` är den förra
konkurrentgenomgången och upprepas inte. `docs/11` avsnitt 2, 5, 9 och 10 är
den bild som prövas här. `docs/42_oppna_data_sveptet.md` mätte de svenska
källorna samma dag och det som står där räknas inte om.
**Beställning:** en marknads- och konkurrentgenomgång som är färsk i dag och
som letar efter det vi inte tänkt på.
**Utfall:** ett fynd som gör om förutsättningarna för hela projektet, tre
rättelser till bibeln, och en affärsmodell som är den motsatta mot den vi
skrivit ned.
**Metod:** varje tal är hämtat 2026-08-30, med `curl`, `dig` eller i
webbläsaren, mot källans egen adress. Där ett tal är avläst hos en tredje part
står det i texten. Där något inte gått att belägga står det i §9 i stället för
att gissas.

---

## 1. Slutsatsen först

Sex slutsatser, i fallande ordning av vad de betyder.

1. **Staten föreslår att kommunerna slutar med livsmedelskontroll den
   1 januari 2028.** SOU 2025:64 vill flytta all livsmedelskontroll från 270
   kontrollmyndigheter till två, Livsmedelsverket och Jordbruksverket.
   Utredningen skriver rakt ut att kommunerna "inte längre ska utföra
   livsmedelskontroll". Det är inte en risk i marginalen, det är den enda
   nyheten i Sverige på tjugo år, och den träffar både vår datainsamling och
   vår vallgrav. §2.1.
2. **Danmark har avskaffat elite-smileyn.** Beställningen till det här
   dokumentet utgick från att den finns. Fødevarestyrelsen skriver ordagrant:
   "Elitesmiley'en udgik, og er ikke længere en del af smileyordningen."
   Beslutet togs 2020 och genomfördes 2022 och 2023. Det de satsade på i
   stället är **länkkrav och QR-kod**: verksamheten måste länka till sin sida
   från all digital marknadsföring, och entrémärket bär en QR-kod. Belöningen
   ströks, distributionen infördes. §4.1.
3. **Vår affärsmodell för verksamheten är troligen fel sort.** De privata
   sajter som lever på Storbritanniens hygiendata tar inte betalt av
   restaurangen för en profil. De säljer efterlevnadsverktyg och utbildning,
   och de riktar sig mot de **låga** betygen, inte de höga. Forkto skriver rakt
   ut på sin prissida: gratis tills du har femman. §6.2.
4. **Exakt vår affär är redan byggd, såld och uppköpt.** Hazel Analytics
   skördade amerikanska hälsomyndigheters inspektioner, normaliserade dem och
   sålde till kedjor. Ecolab köpte bolaget 2023. Samma data driver i dag
   nästan 700 000 Yelp-sidor, och där myndigheten inte ger något betyg räknar
   de fram ett eget och märker det "estimated by Health Department
   Intelligence". Det är prejudikat för vår svåraste fråga. §6.1.
5. **Bibeln har tre fel som är mätta i dag.** FHRS har **ingen** schema.org på
   sina verksamhetssidor, tvärtemot `docs/11` §5. Deras "right to reply" finns
   i schemat men används nästan aldrig, 8 av 36 273 rader. Och
   Livsmedelskollen har ett sämre betyg än vi trott: **2,0 av 5 i 82
   recensioner** hos Google Play, inte bara 2,6 i 17 hos Apple. §3.3, §3.5,
   §2.2.
6. **Prisspannet för en betald företagsprofil i Sverige är 250 till 750 kronor
   i månaden, och det som säljs är placering, inte innehåll.** Ratsit 2 995 kr
   per år, hitta.se från 399 kr per månad med tolv månaders bindning,
   Bokadirekt 295 till 695 kr per månad där enda skillnaden mellan nivåerna är
   tredje, andra och första plats i sökresultatet. Placering är samtidigt det
   enda vi aldrig kan sälja. §5.1.

---

## 2. Sverige, tolv månader

Allt i avsnittet är läst 2026-08-30.

### 2.1 Det som faktiskt hänt: SOU 2025:64

Betänkandet **SOU 2025:64, "En ny kontrollorganisation i livsmedelskedjan"**,
överlämnades 2025-06-04 av särskild utredare Magnus Oscarsson.
[regeringen.se](https://www.regeringen.se/rattsliga-dokument/statens-offentliga-utredningar/2025/06/sou-202564/),
PDF på 878 sidor, hämtad och läst i sin helhet här.

Ur sammanfattningen, ordagrant:

> Den största omställningen i fråga om kontrollansvar och antalet kontrollobjekt
> kommer ske för kommunerna, som inte längre ska utföra livsmedelskontroll, och
> Livsmedelsverket, vars kontrollverksamhet kommer utökas väsentligt.

Och:

> Såväl kommunerna som länsstyrelsernas ansvar för offentlig kontroll inom
> livsmedel, foder och ABP kommer att upphöra. Vår bedömning är att det
> minskade antalet kontrollmyndigheter från 270 till två kommer att underlätta
> [...]

**Ikraftträdande: huvuddelen 1 januari 2028**, uppgiftsskyldigheten mellan
kontrollmyndigheter 1 januari 2027. Utredningen skriver också att
"[f]örberedelse för överföring av information och data samt ärenden och därtill
hörande handlingar till Livsmedelsverket och Jordbruksverket bör påbörjas redan
innan organisationsförändringen träder i kraft".

Vad det betyder för oss, i tre led.

- **Datainsamlingen blir enklare, och samtidigt värdelös som vallgrav.** Hela
  `docs/20_kommunexpansion.md` bygger på att 275 kommuner är 275 separata
  utlämningar och att ingen annan orkar. Efter 2028 finns en enda myndighet med
  ett enda register, och den tröskeln finns inte längre.
- **En svensk FHRS blir för första gången tekniskt möjlig.** Det som stoppat en
  nationell märkning i Sverige är inte bara branschmotståndet i `docs/11` §2
  utan att det inte finns någon som äger datan nationellt. Efter 2028 finns det.
- **Vår historik blir det som ingen annan har.** Utredningen talar om
  överföring av handlingar, inte om att kommunernas publika sidor lever vidare.
  Uppsalas Livsmedelskollen, Linköpings API och de nio andra källor vi läser i
  dag har ett slutdatum. Det vi redan hämtat är den enda löpande serien över
  skarven.

**Vad jag inte kunnat belägga:** remissens status och sista svarsdatum.
Regeringens remissida gav ingen träff på betänkandet 2026-08-30, och sökningen
på regeringen.se renderas i webbläsaren. Det ska kontrolleras innan någon
räknar på datumet 2028-01-01 som säkert. Ett betänkande är ett förslag, inte
en lag.

Smiley-frågan i sig är fortsatt död. Betänkandet nämner Danmarks smiley på
sidan 309, men enbart som beskrivning av **dansk** kontrollorganisation i
kapitel 10 om andra länder, och föreslår ingen svensk motsvarighet. Sökning i
riksdagens öppna data på "smiley" i riksmötet 2025/26 ger **noll träffar**
([data.riksdagen.se](https://data.riksdagen.se/dokumentlista/?sok=smiley&rm=2025%2F26&utformat=json),
2026-08-30). Sex motioner om livsmedelskontroll väcktes hösten 2025, samtliga
om fusk, avgifter eller tillsynsresurser, ingen om offentliggörande.
Proposition 2025/26:206 "Stärkt kontroll av fusk i livsmedelskedjan"
(lämnad 2026-03-17, riksdagsbeslut 2026-06-03) innehåller ingenting om
offentliggörande, smiley eller konsumentinsyn.

EU-rätten står stilla. Förordning (EU) 2017/625 artikel 11 i konsoliderad
lydelse per 2025-01-05 säger fortfarande att myndigheter **får** offentliggöra
klassning av enskilda aktörer, inte att de ska.
[eur-lex.europa.eu](https://eur-lex.europa.eu/legal-content/SV/TXT/HTML/?uri=CELEX:02017R0625-20250105).

### 2.2 Livsmedelskollen, mätt i båda butikerna

`docs/31` §2.1 mätte bara App Store. Google Play är den större och den sämre.

| | App Store | Google Play |
|---|---|---|
| Betyg | **2,6 av 5** | **2,0 av 5** |
| Antal | 17 betyg | **82 recensioner** |
| Nedladdningar | anges ej | **10 tn+** |
| Senast uppdaterad | 2025-11-20, version 1.3.2 | 2026-02-06 |
| Utgivare | Stockholms stad | Stockholms Stad |

Källor:
[apps.apple.com](https://apps.apple.com/se/app/livsmedelskollen/id1200375678) och
[play.google.com](https://play.google.com/store/apps/details?id=com.vismaconsultingapp.Livsmedelskollen&hl=sv),
båda avlästa 2026-08-30. Play-sidan är hämtad med `curl` och talen är lästa ur
sidans egen text, inte ur ett sökresultat.

Släppnoten till iOS-versionen lyder ordagrant "Uppdaterad app-beskrivning och
bilder". Nio år efter lanseringen är den enda uppdateringen inom tolv månader
alltså en bildväxling. Beskrivningen säger fortfarande ordagrant: "Observera:
gäller endast för Stockholms stad, inte andra kommuner."

Klagomålen är samma sak om och om igen. Ordagrant ur Google Play:

> "När appen fungerar är det lätt att undvika hälsofarliga restauranger. Men 9
> gånger av 10 kan man inte söka på vare sig området eller restaurangen."
> (ALF, 22 februari 2024)

> "Sökfunktionen funkar inte" (Johan Östman, 7 december 2024)

Det är sökningen som är trasig hos konkurrenten. Det är samma yta som `docs/31`
§6.2 pekade ut som vårt näst bästa obyggda drag.

### 2.3 De negativa fynden, och de är de viktigaste

- **Ingen ny aktör.** Ingen ny svensk sajt och ingen ny app som visar
  livsmedelskontroller har hittats.
- **Ingen våg av öppna data.** Sökning på "livsmedelskontroll" hos
  [dataportal.se](https://www.dataportal.se/datasets?q=livsmedelskontroll)
  (2026-08-30) ger åtta träffar, varav **exakt en** är faktiska kontrolldata,
  Linköpings kommun. De sju övriga är SKR:s Insikt-enkät om företagsklimat.
  Kontrollerat oberoende mot portalens egen slutpunkt
  `admin.dataportal.se/store/search` med `title:livsmedelskontroll`, som ger
  fyra datamängder plus Sambruks specifikation. `docs/42_oppna_data_sveptet.md`
  mätte samma sak samma dag med anrop mot varje källa och kom till samma
  slutsats från andra hållet: noll kommuner publicerar i den nationella
  specifikationen. Det är alltså två oberoende mätningar med samma utfall.
- **Sambruks specifikation är övergiven.** "Livsmedelskontroller som öppna
  data" står kvar på **version 2.0 från 2020-10-21**,
  [sambruk.github.io/livsmedel](https://sambruk.github.io/livsmedel/). Snart sex
  år utan uppdatering.
- **Den nationella databasen publiceras inte.** Internetstiftelsens dataverkstad
  skriver rakt ut att "denna data inte publiceras i form av öppna data eller
  statistik",
  [internetstiftelsen.se](https://internetstiftelsen.se/dataverkstaden/datamangder/livsmedelskontroller/).
  Samma sida bekräftar leverantörsbilden: Ecos från Sokigo, EDP Vision Miljö
  från Vertigis och Castor från Prosona. Ingen av dem har lanserat någon publik
  visningstjänst.
- **Livsmedelsverket har inte startat något åt konsumentens håll.** De nya
  fokusområdena för 2026 till 2029, beslutade 2025-06-19, handlar om
  riskbaserad kontroll, effektivitet, spårbarhet och beredskap. Regeringens
  uppdrag 2026-03-20 om "en mer effektiv och likvärdig kontroll" handlar om
  revision och likvärdighet mellan myndigheter. Ingenting om publicering.
- **Göteborg och Malmö publicerar fortfarande inte** per anläggning. Göteborg
  lämnar ut på begäran. Malmö publicerar bara aggregat, senast 2026-02-12: cirka
  3 100 kontroller på cirka 2 150 verksamheter under 2025, 85 procent utan
  uppföljande kontroll.
- **Ingen stor nationell granskning av restauranghygien** mellan september 2025
  och augusti 2026. Den som fortfarande formar bilden är Aftonbladets
  Max-granskning 2025-02-18, byggd på 99 kontrollrapporter som redaktionen
  begärde ut för hand, och SVT Skånes "Malmö toppar matsnuskligan" 2025-04-25.

Den sista punkten är värd en rad till. SVT Västernorrlands uppföljning
2025-02-24 bygger på kontrollrapporter redaktionen själv begärt ut, och
**hänvisar inte läsaren vidare till någon sökbar tjänst**, för det finns ingen.
Det är fortfarande sant, och det är fortfarande hela gapet.

### 2.4 Vår egen färskhet, en rad

`docs/31` §4 mätte åtta dagars eftersläpning mot Uppsalas egen sida. Datan har
hämtats sedan dess: Uppsala i vår `uppsala.json` har nu sin senaste kontroll
**2026-08-17**, medan Uppsalas egen lista 2026-08-30 visar kontroller från den
**26 till 28 augusti**. Eftersläpningen är alltså elva dagar i stället för åtta.
Punkten står kvar oförändrad från `docs/31` §9 och upprepas inte här.

---

## 3. Storbritannien, som produkt

Allt i avsnittet är mätt 2026-08-30 mot `api.ratings.food.gov.uk` och
`ratings.food.gov.uk` med `curl`, inte återgivet ur minnet.

### 3.1 Skalan, färsk i dag

| | Mätt värde |
|---|---:|
| Verksamheter i API:et | **612 401** |
| Kontrollmyndigheter | **363** |
| varav FHRS (England, Wales, Nordirland) | 331 |
| varav FHIS (Skottland) | 32 |
| Nationell CSV | **144,6 MB**, `Last-Modified` 2026-08-30 00:53 GMT |

`docs/31` §2.6 mätte 607 303 den 14 augusti. Tillväxten på sexton dagar är
alltså cirka 5 100 poster, vilket i sig är ett bevis på att filen lever.

### 3.2 Vad API:et faktiskt ger

Ingen registrering, ingen nyckel, ingen inloggning. Enda kravet är ett
huvudfält, `x-api-version: 2`.
[api.ratings.food.gov.uk/help](https://api.ratings.food.gov.uk/help), läst
2026-08-30, ordagrant: "there are no registration requirements for developers
[...] No sign-up process, API keys, or login details are required at this time."

Licensen är **Open Government Licence v3**,
[ratings.food.gov.uk/terms-and-conditions](https://ratings.food.gov.uk/terms-and-conditions).
Bilderna är däremot inte fria: "The Imagery must not be altered or amended
without our prior written permission" och "Only the actual rating issued under
the FHRS may be used".

Datan finns i tre former, och det är formerna som är lärdomen, inte fälten.

| Form | Adress | Vad den är bra för |
|---|---|---|
| Hela riket | `.../FHRS_All_en-GB.csv` | forskning, en fil |
| Per myndighet | `/api/open-data-files/FHRS{kod}en-GB.xml` | en fil per kommun |
| Per verksamhet | `/api/download-data/xml/establishments/{id}` | en knapp på objektsidan |

Den mellersta är den vi saknar och den billigaste att bygga. Varje myndighet har
dessutom en **`LastPublishedDate`** i sitt metadata-svar, exempelvis Welwyn
Hatfield 2026-08-28. Det är precis den uppgift som `docs/31` §4 gjorde till
dokumentets viktigaste fynd, publicerad av källan själv, per kommun, som ett
löfte man kan mätas mot.

Ett fält till som är värt att stjäla: **`NewRatingPending`**, en boolesk flagga
som säger att en ny kontroll har skett men att betyget inte publicerats än. I
Cambridge var den sann på 5 av 1 486 verksamheter. Det är ett hederligt sätt att
säga "det finns nyare information än den du ser" utan att påstå något om vad den
säger.

### 3.3 Rättelse till bibeln: FHRS har ingen schema.org

`docs/11` §5 skriver att FHRS har "schema.org". Det stämmer inte.

Verksamhetssidan `ratings.food.gov.uk/business/1472773`, hämtad med `curl`
2026-08-30, 69 596 tecken, serverrenderad:

| | Antal |
|---|---:|
| `application/ld+json` | **0** |
| `itemprop=` | **0** |
| Träffar på strängen `schema.org` | **0** |
| `<meta name="description">` | **0** |
| `<meta property="og:...">` | **0** |

Vår egen sajt har i stället 16 `Organization`, 15 `BreadcrumbList`, 8
`ItemList`, 8 `CollectionPage`, 3 `Dataset`, 2 `FoodEstablishment` och 2
`OpeningHoursSpecification`, räknat i `site/src` samma dag.

Slutsatsen är inte att vi är bättre än FSA. Den är att **det mognaste systemet i
världen har lämnat maskinläsbarheten på objektsidan öppen**, och att den luckan
är vår att fylla på svenska. Se `docs/11` §6b om att bli citerad av AI-svar.

### 3.4 Widgeten, exakt

Varje verksamhet har en egen sida `/business/{id}/{slug}/online-ratings` med
färdig kod. Ordagrant, för verksamhet 1844803:

```html
<script src="https://ratings.food.gov.uk/embed/embed-badge.js"
        data-business-id="1844803" data-rating-style="3" data-welsh="null"></script>
```

Tre format erbjuds, `data-rating-style` 3 (291 × 162 px), 2 (540 × 112 px) och
1 (481 × 115 px), plus samma tre som SVG att ladda ned. Argumentet på sidan är
det som säljer den: koden "is developed to update automatically if your score
changes", medan en nedladdad bild måste bytas för hand.

Det viktiga är villkoret som följer med. Terms and conditions säger att om
betyget ändras "only images of the new rating must be used and any images of
previous ratings must be immediately updated or removed". En självuppdaterande
widget är alltså inte en marknadsföringsfiness, den är det enda sättet en
verksamhet kan följa reglerna utan att tänka på det.

**Vi har `/utmarkelser/emblem/` men ingen självuppdaterande variant.** Det är
en `.js`-fil och en `.svg.ts`-rutt, alltså nära noll filer mot Pages-taket.

### 3.5 Rätten att svara, och varför den nästan inte används

`RightToReply` finns som fält både i API:et och i XML-filerna. Verksamheten
skriver en kommentar som publiceras bredvid betyget. Enligt vägledningen på
GOV.UK, uppdaterad 30 juni 2026, finns "no deadline for this so you can submit
your 'right to reply' at any time up until your next inspection".
[gov.uk](https://www.gov.uk/government/publications/food-hygiene-rating-scheme-fhrs-guidance-for-businesses/food-hygiene-rating-scheme-fhrs-guidance-for-businesses).

Sedan kommer mätningen. Jag laddade ned **sexton** myndigheters öppna datafiler
2026-08-30 och räknade förekomsten av ett ifyllt `RightToReply`:

| Verksamheter genomsökta | Med ifyllt svar |
|---:|---:|
| **36 273** | **8** |

Alltså **0,02 procent**. Och samtliga jag öppnat sitter på verksamheter med
betyg **1 eller 2**. Exempel, ordagrant ur XML-filen för
myndighet 510:

> "I have since cleaned and replace the necessary items required for the
> standard and it's still undergoing maintenance but is not open for people. I
> am aware of food standards and what needed to be done."

Läsningen: **rätten att svara används bara av den som fått ett dåligt betyg, och
nästan ingen av dem använder den.** Det är en billig funktion att bygga och en
dyr att sälja in. Den ska byggas för legitimiteten, inte för volymen, och
förväntningarna ska ligga på sju svar per trettio tusen.

Bredvid den finns två mekanismer till som vi inte har någon motsvarighet till,
båda ur samma GOV.UK-sida:

- **Överklagande inom 21 dagar** från underrättelsen om betyget, skriftligt,
  prövat av en annan chefsinspektör.
- **Omprövningskontroll** efter åtgärd. I England är den avgiftsfri en gång
  mellan planerade kontroller, och ska ske "within six months" om den begärs
  inom tre månader. I Wales och Nordirland tar alla myndigheter betalt, men
  antalet är obegränsat.

Det är den strukturen som gör ett offentligt betyg uthärdligt för den som fått
ett dåligt. Vi har ingen av delarna och kan inte bygga dem, eftersom vi inte är
myndigheten. **Det vi kan bygga är att visa att de finns**, alltså en rad på
verksamhetssidan som talar om för ägaren hur man i Sverige begär omprövning och
till vem. Se §7.

### 3.6 Dit systemet är på väg: beställningsflödet, inte fönstret

Visning i lokalen är obligatorisk i Wales sedan 2013 och Nordirland sedan 2016,
frivillig i England,
[cieh.org](https://www.cieh.org/policy/campaigns/mandatory-display-of-food-hygiene-ratings/).

FSA:s egen revision av visningen 2024, publicerad 2025-06-12, mätte båda
kanalerna. Talen är observerade, alltså inte självrapporterade:

| | I lokalen | **Online** | Vill ha krav online |
|---|---:|---:|---:|
| England | 72 % | **3 %** | 96 % |
| Wales | 94 % | **4 %** | 93 % |
| Nordirland | 90 % | **2 %** | 95 % |

[science.food.gov.uk](https://science.food.gov.uk/article/138241-food-hygiene-rating-scheme-audit-of-display-and-business-survey-2024).

Skillnaden mellan 72 och 3 procent i England är hela poängen. **Tvånget gäller
dörren, och dörren är den kanal som betyder minst.** Även i Wales, där visning
i lokalen är lag och efterlevs av 94 procent, visar bara 4 procent betyget
online.

Och så den formulering som är hela poängen. Vägledningen "FHRS: Displaying your
rating", **publicerad 10 juli 2026**, säger att betyget online ska "appear
anywhere prior to the point where your customer selects food or places an
order".
[gov.uk](https://www.gov.uk/government/publications/fhrs-displaying-your-rating/fhrs-displaying-your-rating).

Två saker följer.

1. **Kravet är formulerat för en app, inte för en dörr.** "Innan kunden väljer
   maten" är en beskrivning av ett beställningsflöde.
2. **Dekalen är myndighetens monopol.** Samma sida: fysiska dekaler får bara
   komma från den lokala myndigheten, och att skaffa dem någon annanstans
   bryter mot reglerna. `docs/11` §9 vill dela ut fönsterdekaler till bra
   ställen. Det är fritt fram i Sverige eftersom ingen myndighet äger märket
   här, men det ska göras med vetskapen att det i det mognaste systemet är
   uttryckligen förbjudet för en privat part.

### 3.7 Vad FSA har som vi inte har, och vad vi får bygga

Sammanställt av allt ovan.

| Vad de har | Får vi bygga utan tillstånd? |
|---|---|
| Öppen fil per myndighet, daglig | **Ja.** En `.json.ts`-rutt per kommun. |
| Publicerat `LastPublishedDate` per myndighet | **Ja.** Vi har uppgiften redan. |
| `NewRatingPending`-flagga | **Ja**, om källan bär det. Annars nej. |
| Nedladdning per verksamhet från objektsidan | **Ja.** En rutt. |
| Självuppdaterande inbäddningskod | **Ja.** Ett skript och en SVG-rutt. |
| Rätt att svara, publicerad bredvid betyget | **Ja**, men det är vår text och inte myndighetens. Se §7 om gränsen. |
| Överklagande inom 21 dagar | **Nej.** Kräver att man är kontrollmyndighet. |
| Avgiftsfri omprövningskontroll | **Nej.** Samma skäl. |
| Officiell dekal | **Nej i Storbritannien, ja i Sverige.** Ingen äger märket här. |
| Delbetyg i tre rader | **Nej.** Svenska kommuner lämnar inte ut den nedbrytningen. |
| Range-operator i filtret | **Ja.** Redan noterat i `docs/31` §2.6. |
| schema.org på objektsidan | **De har det inte. Vi har det.** §3.3. |

### 3.8 Tredjepartsledet, som är beviset på modellen

Fyra privata sajter på FHRS-data svarade 200 vid ett anrop 2026-08-30:
`foodhygieneratings.org.uk`, `scoresonthedoors.org.uk`, `hygienewatch.uk` och
`forkto.com`. Den öppna filen bär alltså en hel liten bransch, vilket är precis
argumentet i `docs/11` §5.

**hygienewatch.uk** är den som ligger närmast oss i form: karta färgad per
kommun, månad för månad med "biggest movers", jämförelse av **59 kedjor** efter
snittbetyg, äldsta ännu gällande betyg, och e-postavisering vid ändringar. Den
bygger på 611 658 ställen i 2 374 orter och 363 råd, uppdaterat månadsvis.

Två av dess funktioner är förbjudna hos oss och det är värt att skriva ut varför
de ändå finns hos honom: han rangordnar kommuner och han rangordnar kedjor.
Det får han göra i Storbritannien eftersom FHRS är ett enda mått framtaget efter
en gemensam standard. **I Sverige bedömer kommunerna olika**, och samma bild
skulle därför inte vara en jämförelse utan en osanning. Skillnaden är inte
smakfråga, den är faktisk, och det är den som gör `docs/17`:s förbud riktigt och
inte bara försiktigt.

Den som vill se vad den svenska motsvarigheten skulle sakna kan läsa
`highspeedtraining.co.uk`s årliga rapport, byggd på API:et med data hämtad i
juni 2026: 4,58 i snittbetyg, 72,33 procent med femma, 501 verksamheter med
noll.

---

## 4. Danmark och Norge

### 4.1 Danmark har avskaffat elite-smileyn

Beställningen till det här dokumentet utgick från att Danmarks elite-smiley är
ett belöningssystem och den raka motsatsen till en skamlista. Premissen är inte
längre sann.

Fødevarestyrelsens egen sida om ordningen säger ordagrant, läst 2026-08-30 på
[findsmiley.dk/om-smiley](https://www.findsmiley.dk/om-smiley):

> Elitesmiley'en udgik, og er ikke længere en del af smileyordningen.

Beslutet togs politiskt **2020** för att förenkla den då tjugo år gamla
ordningen, och genomfördes under **2022 och 2023** i fyra delar:

1. **Elite-smileyn togs bort.**
2. **Skalan gick från fyra till tre**, en glad mun, en rak mun och en sur mun.
   Det lilla leendet försvann.
3. **Marknadsföring blev ett krav**: "Virksomheder skal linke til deres side på
   findsmiley.dk fra alle deres digitale platforme tiltænkt markedsføring af
   fødevarer."
4. **Smileymärket ersatte kontrollrapporten i entrén.** Märket bär en stor
   smiley med datum, de två föregående resultaten med datum, och en **QR-kod**
   som leder till verksamhetens sida på findsmiley.dk.

Tre av de fyra ändringarna går åt ett håll: **bort från belöning, mot
distribution.** Danmark slutade dela ut en guldstjärna och började i stället
tvinga in en länk i varje verksamhets egen marknadsföring och en QR-kod i varje
entré. Det är den enskilt viktigaste designlärdomen i det här dokumentet.
Kanalen är verksamhetens egna ytor, inte vår sajt.

Effekttalet som Danmark själv anger står på samma sida:

> I dag er der ingen anmærkninger på over 80 procent af alle kontroller [...]
> I 2001 ved starten på smileyordningen var det kun omkring 70 procent.

Alltså cirka tio procentenheters förbättring över tjugofem år, uppgiven av
myndigheten själv och utan angiven metod. **Bedömning, inte mätning:** talet är
en myndighets egen självvärdering och ska inte citeras som forskning.

Kvartalsstatistiken 2026, senast uppdaterad 3 juli 2026, för Q1 och Q2:
11 998 glada, 2 785 neutrala och 545 sura smileys av 15 328 kontroller,
[findsmiley.dk/om-smiley/statistik-og-data](https://www.findsmiley.dk/om-smiley/statistik-og-data).

### 4.2 Den danska öppna filen, mätt här

Nedladdad och räknad 2026-08-30 från
[pub.fvst.dk/publikationer/Smileydata.xml](https://pub.fvst.dk/publikationer/Smileydata.xml).

| | Mätt värde |
|---|---:|
| Filstorlek | **59,8 MB** |
| `Last-Modified` | **2026-08-30 13:24 GMT**, alltså samma dag |
| Rader | **58 721** |
| varav detaljhandel | 48 755 |
| varav grossist | 9 966 |
| **Med CVR-nummer** | **57 656, alltså 98,2 procent** |
| **Med P-nummer (arbetsställe)** | **57 125, alltså 97,3 procent** |
| Med fyra utlämnade kontroller | 33 330 |
| `Reklamebeskyttelse` satt | 23 419 |

Två fält är värda mer än resten.

**CVR-numret ligger i den öppna filen på 98,2 procent av raderna.** Det är
organisationsnumret, och P-numret är arbetsstället. `docs/12_datapairing_och_orgnr.md`
finns till för att vi inte har den uppgiften i de svenska utlämningarna.
Danmark ger bort den. Det är inte något vi kan kopiera, men det är exakt vad vi
ska begära av Livsmedelsverket när kontrollen samlas där, se §2.1.

**`Reklamebeskyttelse` är en avanmälningsflagga**, satt på 23 419 rader, alltså
knappt fyra av tio. Uppgifterna publiceras ändå, men flaggan följer med i filen
så att den som återanvänder datan kan låta bli att använda verksamheten i
marknadsföring. Det är en modell för hur man kan bära verksamhetens vilja i
datan utan att censurera den.

Villkoren är korta och tydliga, ur
[hent-smileydata](https://www.findsmiley.dk/om-smiley/statistik-og-data/hent-smileydata):
ange Fødevarestyrelsen som källa, använd inte deras logotyp, och om smileys
visas för enskilda verksamheter "skal disse til enhver tid svare til
virksomhedens aktuelle smiley". Samma krav på färskhet som FSA ställer, §3.4.

### 4.3 Norge, och en trasig kran

Mattilsynets `smilefjes.mattilsynet.no` lever och bär alla smilefjestillsyn
sedan 2016. Sajten länkar själv till "API for smilefjesdata", som pekar på
datasetet **"Smilefjestilsyn på serveringssteder"** i Norges
datakatalog, licens **CC BY 4.0**, formaten CSV, XML, JSON, YAML och JSONP,
uppdateringsfrekvens daglig, senast ändrad **30 juli 2025**.
[data.norge.no](https://data.norge.no/datasets/288aa74c-e3d3-492e-9ede-e71503b3bfd9).

Datasetets båda distributionsadresser pekar på värden `hotell.difi.no`. Den
värden **finns inte längre**. Mätt 2026-08-30:

```
dig +short hotell.difi.no @8.8.8.8   -> inget svar
dig +short hotell.difi.no @1.1.1.1   -> inget svar
curl https://hotell.difi.no/         -> http=000
```

Domänen `difi.no` har namnservrar och lever, men underdomänen har inget
A-svar. Norges officiellt katalogiserade öppna data om smilefjes går alltså
inte att hämta.

Det är ett fynd med två sidor. **Sidan som är en varning:** ett dataset som står
i en nationell katalog med "daglig uppdatering" kan ändå vara dött, och vår egen
öppna fil måste därför ha en adress vi själva äger och kan flytta. **Sidan som
är en möjlighet:** om vi någon gång vill visa nordiska tal är Norge i dag den
svåraste av de tre, och det är inte vårt fel.

Ordningen i sig är den vi redan beskrivit i `docs/11` §5, tre ansikten där den
sämsta punkten avgör. Norge har inget belöningssteg, alltså ingen motsvarighet
till det Danmark just tagit bort.

### 4.4 Vad som svarar på beställningens fråga

Frågan var om det finns en svensk motsvarighet till elite-smileyn som vi kan
bygga, som varken är en rankning av kommuner eller en lista på de sämsta.

Svaret är att **vi redan har byggt den**, och att Danmarks avveckling är ett
argument för att den är rätt konstruerad och inte fel.

`docs/31` §7 byggde `RenHistorik.astro` med fyra regler: sorterat på datum och
ingenting annat, registret rörs inte, ritas bara där märkningen är nåbar, och
ordet är "ren historik". Det är en belöningsmärkning utan inbördes rangordning.

**Bedömning, inte mätning:** Fødevarestyrelsen anger förenkling som skäl och
skriver inte varför just elite-smileyn ströks först. Läsningen här är att den
var en **fjärde nivå på samma skala**, alltså en rangordning, och att den därför
föll när skalan skulle kortas. Vår märkning ligger inte på skalan.
Den är ett urval ovanför registret som byter innehåll vid varje
datauppdatering.

Det som återstår att stjäla från Danmark är alltså inte belöningen. Det är
**QR-koden och länkkravet**, alltså att märket lever i verksamhetens entré och i
verksamhetens egen marknadsföring, inte på vår sajt. Se §8.

---

## 5. Affärsmodellen hos jämförbara sajter

Allt i avsnittet är avläst 2026-08-30 på respektive sajts egna prissidor.

### 5.1 Vad en företagsprofil kostar i Sverige

| Sajt | Produkt | Pris | Bindning |
|---|---|---:|---|
| hitta.se | HittaBasic | **399 kr/mån** | 12 mån, automatisk förnyelse |
| hitta.se | HittaConnect | **749 kr/mån** | 12 mån |
| hitta.se | HittaConnect+ | **1 199 kr/mån** | 12 mån |
| hitta.se | Enterprise | från **2 499 kr/mån** | 12 mån |
| Ratsit | Företagspresentation | från **2 995 kr / 12 mån** | 12 mån |
| Bokadirekt | Mini | **295 kr/mån** | 3 mån uppsägning |
| Bokadirekt | Plus | **395 kr/mån** | 3 mån |
| Bokadirekt | Premium | **695 kr/mån** | 3 mån |
| allabolag.se | Marknadspaket | **pris ej publikt** | okänd |
| Reco.se | företagsplan | **pris ej publikt** | ingen bindning uppges |
| Google Företagsprofil | grundprofil | **0 kr** | ingen |

Källor: [annonsera.hitta.se](https://annonsera.hitta.se/) (verifierad två
gånger, fotnoten lyder ordagrant "Allmänna villkor gäller. Avtalsperiod 12
månader, automatisk förnyelse."),
[ratsit.se/foretagspresentation](https://www.ratsit.se/foretagspresentation),
[business.bokadirekt.se](https://business.bokadirekt.se/paket-och-moduler),
[allabolag.se/info/marknadspaket](https://www.allabolag.se/info/marknadspaket/),
[reco.se/foretag/priser](https://www.reco.se/foretag/priser),
[support.google.com](https://support.google.com/business/answer/2911778?hl=sv).

**Tre mönster som håller över samtliga.**

1. **Det som säljs är placering, inte innehåll.** Bokadirekts tre nivåer skiljer
   sig på exakt en punkt: tredje, andra respektive första prioritet i
   sökresultatet. Hemnets fyra nivåer skiljer sig på fjärde, tredje, andra och
   första prioritet plus annonsstorlek. Hitta.se har HittaPriority som separat
   tillägg. Innehållsfälten, alltså logotyp, bilder och beskrivning, ligger
   genomgående på den billigaste nivån och är i praktiken gratis.
2. **Tolv månader är normen.** Hitta.se har tolv månaders avtalsperiod med
   automatisk förnyelse, Ratsit säljer per tolvmånadersperiod, Bokadirekt har
   tre månaders uppsägning. Bara de produkter som riktar sig till
   privatpersoner säljs utan bindning.
3. **Priset göms så fort en säljare är inblandad.** De som publicerar pris,
   alltså Bokadirekt, hitta.se och Ratsit, säljer också självbetjänat eller
   nästan. De som kräver kontaktformulär, alltså Reco, allabolag, Booli Pro och
   TheFork, publicerar inget. Det är ett val som avgör hela säljorganisationen
   och det måste göras tidigt.

**Placeringsmönstret är samtidigt förbjudet för oss.** `docs/17` under Bindande
förbjuder att bedömningen påverkas av pengar, och en betald förstaplats i
sökresultatet på en hygiensajt är precis den sortens sammanblandning som gör
förtroendet värdelöst. Det är därför den vanligaste intäktsformen i branschen
inte är tillgänglig för oss, och det är ett problem som måste lösas explicit och
inte glömmas bort.

### 5.2 Vad sajterna själva tjänar

| Bolag | Omsättning senaste bokslut | Resultat | Anställda |
|---|---:|---:|---:|
| hittapunktse AB | 258,6 MSEK (2025) | +75,4 MSEK | 41 |
| Booli Search Technologies AB | 75,0 MSEK (2025) | **−16,8 MSEK** | |
| Hemnet Group | 1 526,8 MSEK (2025) | EBITDA-marginal 50,3 % | |
| Ratsit AB | anges ej | | **6** |

Källor: [allabolag.se](https://www.allabolag.se/) för hittapunktse och Booli,
[hemnetgroup.se](https://www.hemnetgroup.se/) kvartalsrapport Q2 2026 och Q4
2025, [ratsit.se/info/om-ratsit](https://www.ratsit.se/info/om-ratsit), alla
lästa 2026-08-30.

Två tal som är värda att stanna vid.

**Ratsit har sex heltidsanställda och 150 000 betalande kunder.** Det är den
bästa jämförelsepunkten i hela materialet för ett soloprojekt: en svensk
registersajt kan bära hundratusen betalande på en handfull personer, eftersom
datan gör arbetet.

**Booli går med förlust och omsätter två procent av Hemnet.** `docs/27` gjorde
Booli till designriktningen för hela sajten, och det står fast, men Booli är
inte en affärsmodell att kopiera. Den överlever för att SBAB äger den och får
bolåneleads.

### 5.3 Hemnets lärdom, som inte handlar om bostäder

Ur Hemnets egen not 2, MSEK:

| Kundkategori | Helår 2025 | Andel |
|---|---:|---:|
| Bostadssäljare | 1 314,8 | **86,1 %** |
| Mäklare | 103,2 | 6,8 % |
| Bostadsutvecklare | 48,1 | 3,1 % |
| Annonsörer och media | 60,7 | 4,0 % |

Motflödet: Hemnet **betalade** mäklarkontoren 403,7 MSEK helår 2025 i
"administration and commission compensation to real estate agents". Mäklarna
betalade alltså in drygt hundra miljoner och fick tillbaka drygt fyrahundra.

Läsningen som gäller oss: **den som betalar behöver inte vara den som syns.**
Hemnets pengar kommer från säljaren, inte från mäklaren vars varumärke står på
annonsen. Ren annonsförsäljning är under fem procent, alltså den intäktsström
`docs/11` §10 punkt 1 sätter först.

Frågan för Prikko blir därmed inte "vill restaurangen betala för sin profil",
utan **vem har ett akut, tidsbestämt intresse av att just den här verksamheten
syns rätt just nu**. §6.2 ger ett svar som inte står i bibeln.

### 5.4 Data som produkt, priser

| Aktör | Produkt | Pris |
|---|---|---|
| Yelp | Fusion Base | **229 USD/mån**, 5,91 USD per extra 1 000 anrop |
| Yelp | Fusion Enhanced | 299 USD/mån |
| Yelp | Fusion Premium | 643 USD/mån |
| hitta.se | Map API | 0,25 kr/anrop vid 5 000, ned till 0,03 vid 1 miljon, minimum **600 kr/mån** |
| Tripadvisor | Content API | 5 000 anrop/mån gratis, därefter pris ej publikt |

Källor: [business.yelp.com/data/resources/pricing](https://business.yelp.com/data/resources/pricing/),
[hitta.se/api](https://www.hitta.se/api),
[tripadvisor-content-api.readme.io](https://tripadvisor-content-api.readme.io/reference/faq),
lästa 2026-08-30. Yelp avskaffade sin gratisnivå 2024.

Hitta.se är den enda svenska aktören i urvalet med publik, självbetjänad
API-prislista, och den gäller bara kartor. **Ingen svensk registersajt säljer
företagsdata till publikt pris.** Det är ett tomt fält, och `docs/31` §6.5 hade
redan pekat på att en öppen fil hos oss inte skulle ha någon konkurrent.

---

## 6. Det som ingen frågat om

Fem angreppssätt som inte står i något av våra dokument. De är ordnade efter hur
mycket de ändrar bilden.

### 6.1 Vår affär är redan byggd, såld och uppköpt, i USA

**Hazel Analytics** samlade in amerikanska hälsomyndigheters inspektioner
automatiskt, normaliserade dem till en gemensam poäng och sålde till kedjor.
**Ecolab köpte bolaget i april 2023.** Produkten heter i dag Health Department
Intelligence och används enligt Ecolab av "more than 250 leading food service
and retail brands across more than 100,000 locations", ur en databas på över 25
miljoner inspektioner och över 4 miljoner anläggningar.
[ecolab.com/offerings/ecolab-hdi](https://www.ecolab.com/offerings/ecolab-hdi),
läst 2026-08-30.

Det är samma maskin som vår, med tre skillnader som är hela lärdomen.

**De säljer samma data två gånger.** Sedan 31 mars 2022 driver de
hygieninspektionsdata på **nästan 700 000 Yelp-sidor** i 48 delstater plus
Toronto och Vancouver, jurisdiktioner som täcker nära 70 procent av USA:s
befolkning.
[blog.yelp.com](https://blog.yelp.com/news/yelp-partners-with-hazel-analytics-to-display-health-inspection-data-across-the-us-and-canada/),
2022-03-31, verifierad här. Kedjorna betalar för sin egen vy, plattformen
betalar för konsumentvyn, och underlaget är hämtat en gång.

**De sätter ett eget betyg där myndigheten inte har något.** Ecolabs egen
frågesida beskriver metoden ordagrant: de räknar antalet avvikelser i en
kontroll, "giving double weight to critical violations over non-critical
violations, then assigns a score out of 100 points", och bara kontroller helt
utan avvikelse får hundra. På Yelp märks det ut som "estimated by Health
Department Intelligence".
[ecolab.com/pages/hdi-yelp-faq](https://www.ecolab.com/pages/hdi-yelp-faq),
verifierad 2026-08-30.

Det är ett prejudikat värt mer än det låter. Vår svåraste fråga är att
kommunerna bedömer olika, och `docs/11` §11 har den som en risk med motdraget
"transparent, publicerad normalisering". Här finns en privat aktör som gjort
exakt det, publikt, på 700 000 sidor, med en märkning som säger vem som räknat.
Metoden är dessutom öppet beskriven, och den är enkel: räkna avvikelser, dubbel
vikt åt de allvarliga.

**De erkänner sin egen fördröjning offentligt.** Samma sida säger att när allt
går bra syns en kontroll "within a week", att myndigheten själv kan dröja
"hours, days, or even weeks" och att deras eget hämtningssteg tar 24 till 48
timmar. Det är samma problem som `docs/31` §4, hanterat genom att skrivas ut i
stället för att döljas.

### 6.2 De som lever på hygiendata säljer inte profiler, de säljer efterlevnad

Det här är fyndet som träffar `docs/11` §10 punkt 2 rakast.

De privata sajterna på brittisk FHRS-data tar inte betalt av restaurangen för
en profil. De tar betalt för att hjälpa restaurangen att bli av med sitt dåliga
betyg.

| Aktör | Vad som säljs | Pris |
|---|---|---|
| Scores on the Doors | SFBB+, digital egenkontroll | **4,99 GBP/mån per lokal**, tre månader gratis |
| Scores on the Doors | Utbildning via High Speed Training | från **20 GBP + moms** |
| Scores on the Doors | Leads till Food Alert, Safer Food Scores, HACCP | provision, pris ej publikt |
| Forkto | Efterlevnads-SaaS | **från 13 GBP/mån per enhet** |

Källor: [scoresonthedoors.org.uk](https://www.scoresonthedoors.org.uk/) och
[scoresonthedoors.org.uk/for-food-business.php](https://www.scoresonthedoors.org.uk/for-food-business.php),
[sfbbplus.co.uk](https://www.sfbbplus.co.uk/),
[forkto.com/pricing](https://forkto.com/pricing), lästa 2026-08-30. Scores on
the Doors uppger själv 616 152 verksamheter, uppdaterat 29 augusti 2026.

Forktos erbjudande står ordagrant på deras prissida och är det som vänder på
hela vår tanke:

> "Hygiene rating 3 or below? Forkto is free until you get your 5"

**Målgruppen är alltså den som har ett dåligt betyg, inte den som har ett bra.**
Vi har tänkt tvärtom: en verifierad profil och ett märke till de bra ställena.
Men den som har ren historik har inget problem att lösa, medan den som fått
anmärkningar har ett akut sådant, och betalningsviljan sitter i problemet.

Kretsloppet är dessutom slutet. High Speed Training, som Scores on the Doors
skickar leads till, bygger själva en årlig FHRS-rapport ur samma öppna API som
innehållsmarknadsföring, senast med data hämtad i juni 2026.
[highspeedtraining.co.uk](https://www.highspeedtraining.co.uk/hub/food-hygiene-ratings-report/).
Rapporten drar länkar och trafik, sajten skickar leads, utbildningen betalar.
Ingen tar en krona av restaurangen för en profil.

Och taket är mätt. Scores on the Doors upphovsrättsrad namnger **Afterburner
Consulting Ltd**, org.nr 12321570. Det bolaget lämnar **mikroföretagsbokslut**,
senast för räkenskapsåret till 30 juni 2025.
[find-and-update.company-information.service.gov.uk](https://find-and-update.company-information.service.gov.uk/company/12321570/filing-history).
Gränsen för mikroföretag i Storbritannien är från 6 april 2025 en omsättning på
högst 1 miljon pund, dessförinnan 632 000 pund.
[gov.uk](https://www.gov.uk/government/publications/life-of-a-company-annual-requirements/life-of-a-company-part-1-accounts).
Den största privata FHRS-sajten i Storbritannien är alltså ett mikroföretag.
Det bekräftar takrisken i `docs/11` §11 med ett tal i stället för en känsla, och
det är ett skäl att inte bygga affären på konsumentsajten ensam.

### 6.3 Beställningsportalerna är en reglerad kanal i UK, och en tom i Sverige

Deliveroo, Uber Eats och Just Eat har alla tre skrivit under FSA:s
Aggregator Food Safety Charter,
[food.blog.gov.uk](https://food.blog.gov.uk/2022/10/18/emily-miles-stakeholder-update-safer-takeaways-and-the-power-of-online-platforms/),
2022-10-18. Tröskelbetygen skiljer sig: Deliveroo och Uber Eats kräver minst 2
för att en verksamhet ska få listas, Just Eat minst 3.

Deliveroos egna partnervillkor är exakta: "Minimum rating ≥ 2", betyget visas
under "Restaurant Notes", och "We source and maintain this information directly
from the UK Food Standards Agency".
[merchants.deliveroo.com](https://merchants.deliveroo.com/en-GB/legal/policies).

Sedan kommer den delen som är intressantare än att det finns.

FSA:s egen forskning säger att lösningen är dålig. I en studie med 40 deltagare,
publicerad 2024-09-19, hade de flesta aldrig sett betyget vid en
onlinebeställning och beskrev placeringen som gömd: "It looks a bit sneaky. They
shouldn't hide it." [science.food.gov.uk](https://science.food.gov.uk/article/123520).
Talen ur samma revision står i §3.6 och upprepas inte: 3 procent visar betyget
online i England, 96 procent tycker att det borde vara ett krav.

Att 96 procent av verksamheterna vill ha ett tvång är inte den siffra man
väntar sig från en bransch. Förklaringen är att den som gör rätt förlorar på
frivillighet, eftersom bara den som har något att dölja tjänar på att låta bli.

**I Sverige finns ingenting av detta, och orsaken är strukturell.** Det finns
inget nationellt jämförbart mått att koppla in i Foodora eller Wolt, alltså
finns det inget att visa. Det är samma lucka som hela projektet finns för att
fylla, och den formulerar en långsiktig position: den som äger det nationella
måttet blir den som beställningsportalerna måste hämta ifrån.

### 6.4 Försäkringsspåret är verkligt i UK och outnyttjat i Sverige

I Storbritannien används hygienbetyget redan i tecknandet. Brittiska mäklare
skriver rakt ut att "Most mainstream providers look for a Food Hygiene Rating
Scheme score of 3 or above" och att "A score of 4 or 5 typically secures better
rates",
[justquoteme.co.uk](https://justquoteme.co.uk/2026-restaurant-and-takeaway-insurance-checklist-protecting-your-hospitality-business/),
2026-04-20. En annan mäklare: betygen "often have a direct impact on any
premiums you are offered",
[fsb-insurance-service.com](https://fsb-insurance-service.com/fsb-insurance-service-blog/specialist/insurance-advice-for-food-businesses/).
**Reservation: samtliga belägg är mäklare, inte försäkringsgivare.** Ingen
försäkringsgivares egna villkor har kunnat läsas som säger detta.

I Sverige finns kopplingen redan i villkorstexten, fast utan att någon ser den.
Dina Försäkringars företagsförsäkring DF20:7 avsnitt 2.9 säger att "[f]ör
försäkringen gäller föreskrifter som meddelas i lag, i förordning, av myndighet,
tillverkare, leverantör, besiktningsman eller motsvarande", och att om de inte
följs "medför det normalt ett avdrag från skadeersättningen".
[dina.se](https://www.dina.se/download/18.23f3e963195d377056ae8d/1743517590981/F%C3%B6retagsf%C3%B6rs%C3%A4kring%20DF20_7.pdf).
Livsmedelslagstiftningen faller in där utan att nämnas vid namn.

Samtidigt är prissättningen tom på hygien. If:s branschsida för hotell och
restaurang nämner varken livsmedelskontroll, egenkontroll, hygien eller HACCP,
bara brandskydd och larm,
[if.se](https://www.if.se/foretag/forsakringar/bransch/hotell-restaurang).
Söderberg och Partners anger prisfaktorerna som storlek, omsättning, utrustning
och tillägg,
[soderbergpartners.se](https://www.soderbergpartners.se/forsakringar/foretagsforsakringar/forsakring-for-restaurang-cafe/).

**Varning som ska stå kvar:** flera sidor på nätet påstår att restauranger med
allvarliga avvikelser betalar 15 till 25 procent mer i premie. Spåret leder till
en produktblogg utan källhänvisning. De talen får inte användas.

### 6.5 LIVES visar vilken väg som inte fungerar

Yelp och Code for America tog 2013 fram **LIVES**, en gemensam
standard för kommuner att publicera inspektionsdata som Yelp kan visa direkt.
Specifikationen står kvar på "version 2.0 of LIVES. It was last updated on
August 10, 2015", [yelp.com/healthscores](https://www.yelp.com/healthscores).
Elva år utan uppdatering.

Det som avgör läsningen står i feed-listan. Av de omkring 350 poster som listas
går de allra flesta i dag via Ecolab, med kontaktadressen `HDISupport@ecolab.com`,
och bara ett fåtal är direkta kommunfeeder,
[yelp.com/healthscores/feeds](https://www.yelp.com/healthscores/feeds).

**Alltså: "kommunerna publicerar själva i ett standardformat" fungerade inte.
Det som fungerade var att ett privat bolag skördade kommunerna och blev enda
leverantör in i plattformen.**

Sverige har exakt samma historia i miniatyr. Sambruks specifikation
"Livsmedelskontroller som öppna data" är en färdig nationell specifikation med
JSON som rekommendation. Versionslistan står kvar på **2.0 från 2020-10-21**,
och repots senaste push är **2022-02-16**, båda avlästa 2026-08-30 hos
[sambruk.github.io/livsmedel](https://sambruk.github.io/livsmedel/misc/versioner.html)
och [GitHubs API](https://api.github.com/repos/sambruk/livsmedel).
Ingen kommun namnges som följer den. §2.3 mätte att exakt en kommun i hela
landet har lagt upp kontrolldata på dataportal.se.

Slutsatsen är obekväm men tydlig: satsa inte en timme på att få svenska
kommuner att standardisera sig frivilligt. Det har prövats i två länder och
misslyckats i båda. Skördandet är arbetet, och skördandet är också positionen.

### 6.6 Två mindre fynd som ändå ska stå

**Svarsmotorerna citerar aggregatorn, inte myndigheten.** Ett prov i Bing
2026-08-30 på "what is the food hygiene rating of Dishoom Covent Garden" gav ett
direktsvar högst upp, betyg 5, inspektionsdatum 22 juli 2025, med
**foodhygienerating.co.uk** som citerad källa, trots att `ratings.food.gov.uk`
låg bland de organiska träffarna längre ned. Samma prov på svenska gav inget
direktsvar alls. Belagt för Bing, inte prövat i Google AI Overviews eller
Perplexity. Det stödjer `docs/11` §6b, och det pekar på att positionen är ledig
på svenska.

**Bevakningsmarknadens prislapp sätter ett tak vi ska undvika.** Calculate tar
199 kr per månad för fem bolagsbevakningar upp till 995 kr per månad
obegränsat, [calculate.se](https://www.calculate.se/bolagsbevakning/), alltså
ungefär tolv till fyrtio kronor per objekt och månad. Blendow Lexnova, som
säljer redaktionellt bearbetad juridisk bevakning, tar 899 till 3 750 kr per
användare och månad, [lexnova.se](https://www.lexnova.se/vara-priser/).
Paketeras vår B2B som "vi mejlar när din rapport publiceras" hamnar den i
tolvkronorsfacket. Paketeras den som normaliserat mått, jämförelse mot
branschen och ett åtgärdsflöde ligger den i det andra. **Ingen kommersiell
svensk bevakningstjänst täcker kommunal livsmedelskontroll.** Creditsafe,
Calculate, Syna och D&B InfoTorg bevakar samtliga bara Bolagsverket,
Skatteverket och Kronofogden.

---

## 7. Gränser som gäller allt ovan

Regler ur `docs/17` och tidigare dokument som varje förslag i §8 har prövats
mot. De upprepas här för att flera av de mest lockande idéerna faller på dem.

1. **Ingen rankning av kommuner.** Det gäller även när datan gör den trivial,
   och det är exakt vad hygienewatch.uk gör i Storbritannien.
2. **Ingen värstinglista.** Det gäller även i mejlform och även som ett
   nyhetsbrev, `docs/31` §6.4.
3. **Ingen betald placering och inget betalt betyg.** §5.1. Det stänger
   branschens vanligaste intäktsform.
4. **Grönt är bedömningens språk.** `docs/31` §6.3.
5. **Skriv aldrig "högst betyg" i en rubrik.** Femte dokumentet i rad.
6. **En funktion får aldrig kosta en sida.** Cloudflare Pages tak.

En sjunde som är ny och som kommer ur §3.5: **om vi bygger en yta där
verksamheten får svara, får den ytan aldrig se ut som en myndighetsprocess.**
FSA:s "right to reply" bärs av att FSA är den som satt betyget. Vi har inte satt
något betyg, vi speglar kommunens. En svarsruta hos oss måste därför säga vad
den är, alltså verksamhetens egen kommentar hos Prikko, och samtidigt peka på
den riktiga vägen, som är kommunen.

---

## 8. Vad vi borde göra som vi inte gör i dag

Rangordnat efter (värde delat med svårighet). Svårigheten anges i vad den kostar
i arbete och i filer mot Cloudflare Pages tak, som `docs/31` §6 mätte till
16 898 av 20 000. Värdet anges i vad det ändrar, inte i kronor, eftersom ingen
av punkterna har en mätbar intäkt i dag.

### 1. Skriv ut färskheten per kommun, med källans eget datum bredvid

**Svårighet: liten.** Uppgiften finns redan i varje datafil. Noll nya filer, ett
inslag på kommunsidan och en rad på verksamhetssidan.

**Värde: högt.** FSA publicerar `LastPublishedDate` per myndighet (§3.2) och
Ecolab skriver ut sin egen fördröjning på Yelps hjälpsida (§6.1). Båda de
mognaste aktörerna gör alltså det vi inte gör. `docs/31` §4 slog fast att en
besökare som ser ett äldre datum hos oss än hos kommunen inte kommer tillbaka.
Att skriva ut datumet gör inte datan färskare, men det gör skillnaden hederlig
i stället för dold, och det är skillnaden mellan en eftersläpning och ett
förtroendetapp. Kravet på att nattjobbet faktiskt startar står kvar oförändrat
från `docs/31` §9 punkt 1 och är fortfarande punkt noll.

### 2. Öppen fil per kommun, inte bara en för riket

**Svårighet: liten.** `docs/31` §6.5 föreslog en fil. FHRS-mönstret är tre
nivåer: hela riket, en per myndighet, en per verksamhet (§3.2). Alla tre är
`.json.ts`-rutter på samma mönster som `/sok-index/[hash].json.ts` redan
använder. Tolv kommunfiler plus en riksfil plus en rutt per verksamhet.

**Värde: högt, och det är inte trafik.** Det är argumentet i mejlet till
kommunerna, det är det journalisten länkar till, och det är den enda punkten som
ändrar hur andra ser på oss. Danmark ger CVR-nummer i sin fil (§4.2) och FSA
ger myndighetens e-postadress i sin. **Gränsen från `docs/31` §6.5 står kvar:**
filen får inte innehålla något som gör en kommunrankning trivial utan att
förbehållet om olika kontrollintensitet ligger i samma svar.

### 3. Självuppdaterande märke, och en QR-kod till entrén

**Svårighet: liten till medel.** Ett skript och en SVG-rutt, alltså nära noll
filer. `/utmarkelser/emblem/` finns redan och saknar bara den självuppdaterande
formen. QR-koden är en till rutt.

**Värde: högt, och det är det bäst belagda i hela dokumentet.** Danmark
avskaffade sin belöningsnivå och satsade i stället på länkkrav och QR-kod i
entrén (§4.1). FSA:s inbäddningskod säljs på att den uppdaterar sig själv, och
deras villkor gör den till det enda praktiska sättet att inte visa ett gammalt
betyg (§3.4). Och i Storbritannien visar bara 3 procent av verksamheterna sitt
betyg online medan 96 procent vill att det ska bli obligatoriskt (§6.3).
Distributionen ligger alltså i verksamhetens egna ytor, inte i vår sajt, och
den är gratis för oss.

**Gränsen:** i Storbritannien är dekalen myndighetens monopol (§3.6). I Sverige
äger ingen märket, så vi får. Men märket måste bära vad det är, alltså Prikkos
återgivning av kommunens kontroll med datum, aldrig något som ser ut som ett
myndighetsintyg.

### 4. Bedömningsfilter i sökningen

**Svårighet: liten.** Oförändrad från `docs/31` §6.2, noll filer, datan ligger
redan i klienten.

**Värde: höjt sedan förra omgången.** Det nya belägget är att konkurrentens
sökning är trasig och att det är just det användarna klagar på i båda
appbutikerna, ordagrant "Sökfunktionen funkar inte" (§2.2). Vi vinner inte på
att ha ett filter de saknar, vi vinner på att ha en sökning som fungerar.

### 5. En rad om vad verksamheten kan göra åt sitt resultat

**Svårighet: medel.** Ingen ny sida, ett stycke på verksamhetssidan plus text
per kommun om vem man vänder sig till. Kräver research per kommun, inte kod.

**Värde: medel till högt, och det är legitimitet snarare än trafik.** FSA har
överklagande inom 21 dagar och avgiftsfri omprövning (§3.5). Vi kan inte bygga
någon av delarna eftersom vi inte är myndigheten, men vi kan tala om att de
finns. Det är också det som avväpnar den enda invändning som kan skada oss, att
vi hänger ut någon utan väg tillbaka.

**Räkna inte med volym.** FSA:s eget svarsfält används av 8 verksamheter av
36 273, och samtliga jag öppnat har betyg 1 eller 2 (§3.5).

### 6. Vänd affärshypotesen: sälj till den som har ett problem

**Svårighet: hög, och det är en affärsfråga och inte en byggfråga.**

**Värde: potentiellt det största i dokumentet, och helt oprövat.** `docs/11` §10
punkt 2 säger att pengarna finns i att restauranger betalar för att hantera sin
profil. Ingen av de fyra brittiska aktörer som lever på hygiendata gör så. De
säljer efterlevnadsverktyg och utbildning, till 4,99 respektive 13 pund per
månad och enhet, och Forkto riktar sig uttryckligen till den som har ett dåligt
betyg: gratis tills du har femman (§6.2). Samtidigt visar Hemnet att den som
betalar inte behöver vara den som syns (§5.3).

**Vad som ska göras nu är inte att bygga något.** Det är att skriva ned
hypotesen som en fråga och pröva den: har den verksamhet som just fått en
anmärkning en betalningsvilja som den med ren historik inte har? Prisankarna
finns: 250 till 750 kr per månad för en profil i Sverige (§5.1), tolv till
fyrtio kronor per objekt för ren bevakning (§6.6).

**Gränsen är hård och måste stå i samma mening som idén:** vi säljer aldrig
något som påverkar bedömningen, och vi säljer aldrig placering (§7 punkt 3).
Att sälja hjälp till den vi just bedömt är den farligaste produkt vi kan
tänka oss, och den får bara byggas om den är helt frikopplad från vad som står
på sidan.

### 7. Bevaka SOU 2025:64 som en kalenderpost, inte som en nyhet

**Svårighet: ingen.** Det är en påminnelse i en kalender.

**Värde: högt, och det är den enda punkten där tiden arbetar mot oss.**
Betänkandet vill flytta all livsmedelskontroll från kommunerna till
Livsmedelsverket den 1 januari 2028 (§2.1). Tre saker ska följas: remissvarens
utfall, om en proposition kommer, och vad som händer med kommunernas publika
sidor i övergången. **Och en sak ska göras oavsett utfall:** fortsätt hämta.
Kommunernas egna sidor har ett slutdatum, och den serie vi bygger nu är den enda
som går att lägga över skarven.

### 8. Begär CVR-motsvarigheten när tillfället kommer

**Svårighet: låg i arbete, men den beror på någon annan.**

**Värde: löser `docs/12` helt, i ett slag.** Danmark lämnar ut CVR-nummer på
98,2 procent av raderna och P-nummer på 97,3 (§4.2). Det är exakt den uppgift
våra svenska utlämningar saknar. När kontrollen samlas hos Livsmedelsverket
finns för första gången en motpart som både har uppgiften och kan lämna ut den
nationellt. Den begäran ska vara skriven innan den behövs.

### 9. schema.org på verksamhetssidan är redan vår, håll den

**Svårighet: ingen, den är byggd.**

**Värde: en rättelse och en bekräftelse.** FHRS har noll strukturerad data på
sin objektsida (§3.3), och ett prov i Bing visar att svarsmotorn hellre citerar
en tredjepartsaggregator än myndigheten (§6.6). Positionen är alltså ledig, den
är vår, och `docs/11` §5 ska rättas så att ingen framtida omgång bygger på att
FSA har något de inte har.

### Vad som prövades och inte ska göras

1. **Bygg ingen belöningsnivå ovanpå bedömningsskalan.** §4.4. Danmark tog bort
   sin efter tjugo år, och den föll för att den var en fjärde nivå på samma
   skala. Vår ren historik ligger inte på skalan och ska inte flyttas dit.
2. **Satsa inte en timme på att få kommunerna att standardisera sig
   frivilligt.** §6.5. LIVES i USA och Sambruk i Sverige är samma historia med
   samma slut. Skördandet är arbetet och skördandet är positionen.
3. **Bygg ingen kedjejämförelse och ingen kommunkarta med snittbetyg.** §3.8.
   Den finns i Storbritannien och fungerar där, eftersom FHRS är ett mått. I
   Sverige vore samma bild inte en jämförelse.
4. **Använd inte försäkringstalen som cirkulerar.** §6.4. Påståendet om 15 till
   25 procent högre premie leder till en produktblogg utan källa.
5. **Bygg ingen betald placering i sökresultatet.** §5.1. Det är branschens
   vanligaste intäktsform och den enda vi aldrig kan ta.

---

## 9. Vad som inte gick att belägga

Punkterna står här för att nästa omgång ska veta var hålen finns.

1. **Remissens status för SOU 2025:64.** Regeringens remissida gav ingen träff
   2026-08-30 och sökningen renderas i webbläsaren. Sista svarsdatum och
   eventuell kommande proposition är okända. Det är den viktigaste
   uppföljningen i hela dokumentet.
2. **Vilka svenska kommuner som följer Sambruks specifikation.** Kräver en
   inventering av dataportal.se. Mätningen här visar en enda kommun med
   kontrolldata publicerade, men specifikationen kan följas utan att datan
   ligger i katalogen.
3. **Priser i hela revisions- och bevakningsledet.** Steritech, Ecolab EcoSure,
   Ecolab HDI, Anticimex, Creditsafe, Retriever och D&B InfoTorg säljer alla via
   offert. Ingen trovärdig prisuppgift finns för en restaurangrevision per
   enhet, varken i Sverige eller USA.
4. **Ecolab HDI:s geografiska täckning.** Ingen av deras sidor nämner geografi,
   och `hazelanalytics.com` svarade inte. Om Norden ingår är obekräftat.
5. **Google AI Overviews och Perplexity.** Bara Bing kunde provas (§6.6).
6. **Nederländerna, Irland, Nya Zeeland, NYC och Vancouver** hanns inte med.
7. **Om Livsmedelskollens 82 recensioner hos Google Play innehåller något efter
   december 2024.** Sorteringen på senaste gick inte att få fram.
8. **Om Västerås karttjänst från 2019 finns kvar** på en adress som inte är
   länkad från kommunens egen livsmedelssida.
