# 17. Nästa produktfunktioner: rangordnat, med diagram som eget spår

Datum: 2026-08-04. Frågan från ägaren: vilka funktioner andra byggt som vi
saknar och som ökar värdet för besökaren, särskilt grafer och annan användning
av datan vi redan sitter på.

Rapporten föreslår, den bygger ingenting. Rapport 15 har redan ritat
verksamhets- och kommunsidan och rangordnat berikningskällorna (OSM, Kolada,
myndighetsrapporteringen, orgnr-bryggan); det upprepas inte här. Det här är
listan över *funktioner*, alltså sådant som ändrar vad en besökare kan göra
eller se, byggt på data vi redan har i beståndet.

## Bindande, före allt annat

Fyra gränser gäller varje punkt nedan och varje framtida idé:

- Vi rangordnar aldrig kommuner. En kommuns tal visas på kommunens egen sida,
  enda jämförelsen är riksmedianen.
- Vi publicerar aldrig en värstinglista, oavsett hur många som skulle klicka.
- Vi använder aldrig kommunvapen.
- Vi bygger aldrig något som skickar anmälningar till kommunernas e-tjänster
  åt användaren.

Dessutom ärvs två regler från rapport 15 in i allt visuellt: ingen tom etikett
någonsin, och en klass får aldrig låna en annan klass formspråk. Den andra
regeln är den som avgör hur diagrammen får se ut, se nästa avsnitt.

## Grundregler för diagram på en noll-JS-sajt

Sajten skickar ingen JavaScript för innehåll, och ett diagram är innehåll.
Alltså: **server-renderad SVG, byggd i Astro-komponenten vid bygget, utan
bibliotek.** Det är inte en begränsning utan en fördel: vår data är liten
(som mest några hundra punkter per sida), färdigräknad vid bygget och ändras
aldrig i webbläsaren. Ett diagrambibliotek löser problem vi inte har.

Reglerna, så att diagrammen tillför i stället för att dekorera:

1. **Ett diagram ska besvara en fråga som listan bredvid inte besvarar.**
   Kan frågan besvaras med tre tal i en rad är tre tal i en rad rätt svar.
2. **Färger ur tokens.css, och bedömningens färgskala bara på bedömningsdata.**
   Grönt är bedömningens språk och lånas aldrig ut, samma regel som stoppade
   den gröna "öppet nu"-pillen i rapport 15.
3. **Inga trendlinjer, ingen interpolation, inga prognoser.** Vi visar punkter
   som hänt. En linje mellan två kontroller påstår något om tiden däremellan,
   och det påståendet har vi inte täckning för.
4. **SVG:n är illustration, texten är sanningen.** Diagrammet får aria-hidden
   och den befintliga listan eller en tabell står kvar som det tillgängliga
   och maskinläsbara alternativet. Det håller också AEO-sidan skadeslös:
   språkmodeller citerar text, inte path-element.
5. **Vikten räknas.** En tidslinje ska väga ett par kB, inte femtio. Väger
   den mer är den fel byggd.

---

## Rangordningen

### 1. Kontrollhistoriken som tidslinje på verksamhetssidan

**Vad den löser.** Historiken är i dag en lista, och en lista svarar dåligt på
de frågor en besökare faktiskt ställer till den: hur tätt kom kontrollerna,
var anmärkningarna en klunga för tre år sedan eller pågår de nu, kom
uppföljningen snabbt? En tidsaxel med en prick per kontroll, färgad efter
utfall och med uppföljningskontroller kopplade till kontrollen de följer upp,
visar mönstret på en blick. Det är samma grepp som gör Görlitz-mönstret i
brittiska Food Hygiene-aggregatorer och CVE-tidslinjer läsbara: avstånd i tid
blir avstånd på skärmen.

**Data.** Finns helt: `inspections` per verksamhet med datum, bedömning och
typ, uppföljningskopplingen i `followUp()` och historikbrottet
`HISTORY_GAP_DAYS` i `site/src/lib/data.ts`.

**Insats.** Två till tre dagar. Komponenten är ren rendering; kanterna är
jobbet (en ensam kontroll, tjugo kontroller, historikbrottet när lokalen
sannolikt bytt verksamhet, som redan är utrett i data.ts).

**Risk.** Låg till medel. Fällan är att tidslinjen börjar läsa som en
betygskurva över tid, alltså punkt 3 ovan: bara prickar, ingen linje.
Listan står kvar under, tidslinjen är en sammanfattning av den, inte en
ersättning.

### 2. Bevakningsmejlet: ny kontroll på ett ställe du bevakar

**Vad den löser.** Bevakningar finns, inloggning finns, avregistreringssidan
`/sluta-bevaka` finns till och med redan. Det som saknas är själva löftet:
att den som bevakar sitt kvarterscafé får ett mejl när kommunen varit där.
Det är den enda funktionen i listan som ger ett skäl att komma tillbaka utan
att googla, och det är mönstret som gjort bevakningar meningsfulla överallt
annars (Allabolag, Booli, Kamerad). För en sajt vars data uppdateras varje
natt är det dessutom den billigaste formen av färskhetsbevis.

**Data.** Finns: bevakningarna i kontodatabasen, nattens diff i pipelinen.
Mejlinfrastrukturen på prikko.se är utredd i rapport 13 om e-post.

**Insats.** Tre till fem dagar: diffa nya kontroller mot bevakningslistan,
ett utskicksjobb efter pipelinekörningen, en mejlmall.

**Risk.** Låg tekniskt. Tonen är risken: mejlet återger kommunens uppgift
neutralt, med samma ordval som sajten, och skandaliserar aldrig. Ett mejl
med rubriken "Anmärkning på ditt café!" är en värstinglista med ett enda
namn på.

### 3. Kommunens kontroller över tid, som diagram på kommunsidan

**Vad den löser.** Kommunsidan bär trafiken (rapport 15) och säger i dag bara
hur läget är nu. Vår egen kontrolldata sträcker sig flera år bakåt, så sidan
kan visa: antal kontroller per år som staplar, och andelen utan avvikelse per
år som prickar. Det besvarar "hur brukar det se ut här" och gör kommunsidan
till något att återvända till, inte bara landa på.

**Data.** Finns i beståndet, med en viktig reservation: källornas historiska
täckning är ojämn och `sourceLimits()` vet var gränserna går. Ett år där
källan bara lämnar delar av historiken får inte ritas som ett svagt år.

**Insats.** Två till tre dagar, varav hälften är grinden: rendera bara år med
full täckning, och skriv ut vilket spann som visas.

**Risk.** Medel. Diagrammet jämför kommunen med sig själv över tid, vilket är
tillåtet; gränsen som inte får korsas är att samma serie ställs bredvid en
annan kommuns. Ingen kommunjämförelse, ingen export av serierna sida vid
sida. Riksmedianen per år är tillåten som referens om den kan räknas
hederligt, annars utelämnas den.

### 4. Nyss kontrollerade i kommunen

**Vad den löser.** Färskhet som syns. En lista på kommunsidan med de senaste
kontrollerna i kommunen, alla utfall, inte bara anmärkningar: "Kontrollerade
senaste veckan: 14 verksamheter". Besökaren ser att sajten lever, sökmotorn
ser att sidan ändras, och den som är nyfiken på sitt kvarter får en ingång
som inte kräver en sökning.

**Data.** Finns helt, `latestInspectionDate` och beståndet.

**Insats.** En dag.

**Risk.** Låg, med en regel: listan sorteras på datum och ingenting annat.
Sorterad eller filtrerad på utfall är den en skampåle med veckans namn.

### 5. Medianprickar i Kontrollen-blocket

**Vad den löser.** Blocket "Så bedrivs kontrollen" visar kommunens tal med
riksmedianen som text i etiketten. En rad per nyckeltal med två markörer på
en tunn axel, kommunens värde och medianen, gör jämförelsen läsbar utan att
läsa siffror. Det är den minsta möjliga grafiken och den gör exakt det
rapport 12 hoppades: förvandlar den förbjudna rangordningen till en tillåten
förklaring.

**Data.** Finns: `kontrollen()` i `site/src/lib/kontrollen.ts` bär redan
värde och median per nyckeltal.

**Insats.** En till två dagar.

**Risk.** Låg, med två regler: neutrala färger (ingen grön-röd skala, ett
nyckeltal har ingen riktning, se kommentaren i kontrollen.ts), och axeln
utan skala mellan kommuner, alltså aldrig en vy där flera kommuners prickar
möts.

### 6. Filter på kartan: verksamhetstyp och bedömning

**Vad den löser.** Kartsidan är sajtens enda app-yta och har redan JS.
"Visa bara caféer" och "visa bara ställen utan anmärkning" är de två filter
en karta över matställen behöver, och uteserveringsfältet från OSM-körningen
är enligt rapport 15 bara meningsfullt just här.

**Data.** Kategorinormaliseringen i `categories.ts` finns; typerna är inte
normaliserade mellan alla kommuner än, vilket är exakt varför filtrering på
listsidorna är parkerad till designfasen. Kartan kan gå före eftersom den
redan är per kommun: inom en kommun är källans typer konsekventa.

**Insats.** Två till fyra dagar i kartkomponenten.

**Risk.** Medel. Ett filter som visar noll nålar i en kommun vars källa
saknar kategorin ser trasigt ut; chips renderas bara för kategorier som
finns i kommunens data, samma regel som `MunicipalityCategories` redan
tillämpar.

### 7. Inloggad översikt: dina bevakningar med senaste status

**Vad den löser.** Kontosidan listar i dag vad man bevakar; den borde visa
läget: varje bevakat ställe med bedömning och senaste kontrolldatum, sorterat
på senaste händelse. Tillsammans med punkt 2 blir kontot en produkt i stället
för en inställningssida.

**Data.** Finns: bevakningarna plus beståndet.

**Insats.** Två dagar, i kontosidans befintliga klientkod.

**Risk.** Låg.

### 8. Delningsbilder per kommun

**Vad den löser.** En länk till en kommunsida delad i chatt eller press visar
i dag sajtens standardbild. En genererad og-bild per kommun med nyckeltalen
(antal verksamheter, andel utan anmärkning, senaste uppdatering) gör varje
delning till ett faktablad.

**Data.** Finns, `municipalitySummary()`.

**Insats.** En till två dagar (SVG till PNG vid bygget, tolv filer).

**Risk.** Låg. Den viktiga gränsen är filbudgeten: per verksamhet vore det
över 14 000 nya filer mot Cloudflare Pages-taket på 20 000, där vi ligger på
15 500. Per kommun är det tolv. Verksamhetsnivån är blockerad tills
filbudgeten är löst, inte tills någon orkar.

---

### 8b. Byggt 2026-09-05: ett kort per SIDA, ritat i kanten

Punkten ovan står kvar oredigerad eftersom den var rätt ställd fråga med fel
avgränsning. Den föreslog tolv bilder, en per kommun, och skrev att
verksamhetsnivån var blockerad av filbudgeten. Filbudgeten var verklig.
Slutsatsen var det inte: den förutsatte att en bild måste vara en fil.

**Vad som mättes först.** I `site/dist` 2026-09-05 bar **16 742 av 16 767
byggda sidor exakt samma `og-default.png`**. De 25 som hade en egen bild var
artiklarna med sina illustrationer. Titel och beskrivning var unika per sida,
bilden var det inte. Per sidtyp:

| Sidtyp | Sidor med standardbilden |
|---|---:|
| Verksamhet | 16 044 |
| Kommunens kategorisidor | 256 |
| Kommunens listsidor (`/sida/n`) | 154 |
| Områdessidor | 148 |
| Kedjesidor | 53 |
| Anmärkningslistor | 22 |
| Kommunhubbar | 12 |
| Kartsidor | 9 |
| Rapporter | 8 |
| Utmärkelser | 6 |
| Övrigt (statiska sidor, konto, start) | 30 |

Standardbilden är 1 200 x 630 och väger 23 031 byte, skriven av
`scripts/brand-images.mjs`. Måtten var alltså redan rätt, se nedan. Det som
saknades var att bilden sa något om SIDAN.

**Formen: `/dela/<sidans sökväg>.png`, en Pages Function.** Sidan sätter
`og:image` till sin egen sökväg under `/dela/`, och
`functions/dela/[[vag]].ts` ritar bilden när någon ber om den. Ritverket står
i `src/lib/delningsbild.ts`: en egen rasterare för bokstavskonturer och en
egen PNG-skrivare, båda i ren TypeScript utan beroenden, eftersom en
Workers-isolat varken har sharp, canvas eller systemtypsnitt.

**Filkostnaden, som var hela frågan.**

| Väg | Nya filer | Utgåvan blir | Mot taket 20 000 |
|---|---:|---:|---|
| Ingenting (läget före) | 0 | 18 171 | 91 % |
| En PNG per verksamhet vid bygget | 17 146 | 35 317 | **177 %** |
| En bild per sida vid bygget | 17 868 | 36 039 | **180 %** |
| En bild per kommun och kategori | 257 | 18 428 | 92 % |
| **Ritad i kanten, valt** | **1** | **18 172** | **91 %** |

Den enda filen är `public/delningsbild/underlag.json`, 92 kB, som bär
bokstävernas konturer i vikt 400 och 600 plus ordmärket som täckningsmask.
Bygget gick från 18 171 till 18 172 filer, kontrollerat i `dist-og`.

**SVG i stället för PNG hjälper inte, och det är inte en åsikt om storlek.**
Taket räknar filer och inte byte, alltså kostar en SVG per verksamhet exakt
lika mycket som en PNG per verksamhet. Dessutom ritar ingen av de sex ytor
sajten faktiskt delas på en SVG i en förhandsvisning: Slacks egen formatlista
är png, jpg, jpeg och gif, och Meta, LinkedIn, Apple och WhatsApp nämner den
inte heller. SVG var aldrig ett alternativ.

**Vad kortet bär.** Ögonbryn "HYGIENKONTROLL" i märkesblått, verksamhetens
namn i 74 px halvfet, adress och ort under, en hårlinje, och nederst
"SENASTE KONTROLLEN" över datumet. Ordmärket uppe till vänster, den
brandblå listen nederst som standardbilden redan har. Sidor som inte är
verksamheter, alltså kommunhubbar, kategorier, områden, kedjor och rapporter,
får sin egen titel och beskrivning i samma form. Samma kod, samma kostnad,
och därför fick alla 17 868 sidor kort och inte bara de 17 146
verksamheterna.

**Orden hämtas ur sidan, aldrig ur adressen.** Funktionen läser verksamhetens
egen byggda sida och plockar namn och adress ur dess JSON-LD, datumet ur dess
`last-modified`. Samma regel som `functions/api/marke.ts` redan skriver ut,
och av samma skäl: kunde texten skickas in i frågesträngen hade vem som helst
kunnat beställa ett Prikkokort med vilket företagsnamn och vilket påstående
som helst på, och den bilden hade burit vårt ordmärke.

**BEDÖMNINGSMÄRKET ÄR INTE MED, och det var kortets svåraste beslut.**

Kortet säger inte hur det gick. Det bär namn, plats och datum, alltså
uppgifter som är sanna oavsett bedömning. Fyra skäl, i fallande ordning:

1. **Bilden lämnar sidan.** På verksamhetssidan står märket bland
   kontrollhistoriken, avvikelsernas ordalydelse, kommunens besked och
   verksamhetens eget svar. I en chatt står det ensamt. Ett rött märke som
   säger "Brister" utan en enda av de raderna intill är ett negativt
   påstående om ett namngivet företag, publicerat av oss på en yta där ingen
   kan läsa vidare.
2. **Sajten har redan erkänt problemet på en annan yta.** `docs/24` § 2
   skriver att undantaget från WCAG 1.4.11 håller därför att bedömningens
   TEXT står intill märket på 19 av 21 ritställen. Kartnålen är det ena
   undantaget. En delningsbild hade blivit det andra, och det värre: den
   visas nedskalad till några hundra pixlar.
3. **Maskotgränsen.** `docs/24` § 2: maskoten får aldrig stå bredvid en
   bedömning av en namngiven verksamhet. Kortet bär ordmärket, alltså
   avsändaren. Med en bedömning på samma yta hade avsändaren stått bredvid en
   bedömning av ett namngivet företag. Utan bedömning finns frågan inte, och
   maskoten står ändå aldrig här: ordmärket är inte figuren.
4. **Frånvaron hade börjat betyda något.** Ett kort med grönt märke som delas
   och ett kort utan märke som inte delas blir en rangordning byggd av
   delningsstatistik. Samma fälla som `lib/emblem.ts` avsnitt 2 beskriver för
   det dynamiska emblemet.

Priset är att kortet inte lockar lika hårt. Det är avsiktligt: kortet ska få
någon att öppna en länk om ett bestämt ställe, inte ersätta sidan.

**Vad som valdes bort, med skäl.**

- **En bild per kommun, alltså punkt 8 som den skrevs.** Tolv filer och
  billigt, men det löser bara 12 sidor av 16 742. Verksamhetssidan är den
  sidtyp som faktiskt delas.
- **En bild per kommun och kategori, 257 filer.** Ryms i budgeten, men två
  restauranger i samma stadsdel hade fått exakt samma bild. Då är bilden
  fortfarande inte unik per sida, och det var hela bristen.
- **Bedömningen i färg eller ord.** Se de fyra skälen ovan.
- **Antal kontroller på kortet.** Neutralt och intressant, men det står inte
  i sidans huvud och hade krävt en egen datafil eller en ny metatagg. Namn,
  plats och datum räcker för att göra kortet unikt.
- **Ett foto av stället.** Booli, Hemnet och Yelp skickar alla ett rått foto.
  Vi kan inte: bara 366 av 16 044 verksamheter har en bild, och de vi har är
  Commonsbilder med attributionskrav som inte går att bära i en
  förhandsvisning.
- **Verksamhetens namn i frågesträngen.** Enkelt och förbjudet, se ovan.
- **Halvfet ur den variabla typsnittsfilen.** `fontkitten` läser konturer ur
  en woff2 men bara i axelns förvalsläge; `getVariation()` bygger en TTFFont
  ur en woff2-ström och den fonten kastar direkt. Stammen är 82 enheter vid
  vikt 400 och 130 vid 600, alltså 6,1 mot 9,6 px i rubrikstorlek, och
  tokens.css säger uttryckligen att Booli kör 600 på varje rubrik. Därför
  ligger `@fontsource/instrument-sans` som devDependency: den bär de statiska
  vikterna och körs bara vid bygget.

**Måtten, mot vad plattformarna faktiskt kräver.** Hämtat 2026-09-05.

| Plattform | Krav | 1 200 x 630 PNG |
|---|---|---|
| Meta | rek. 1200 x 630, minst 600 x 315 för stort kort, max 8 MB | klarar |
| LinkedIn | minst 1200 x 627, 1,91:1, max 5 MB | klarar |
| iMessage | minst 900 px bred, huvudresurs max 1 MB | klarar |
| WhatsApp | minst 300 px bred, högst 4:1, under 600 kB | klarar |
| Slack | inget mått dokumenterat, format png/jpg/jpeg/gif | klarar |
| X | 2:1 och under 5 MB enligt andrahandskällor | klarar |

X gick inte att belägga vid källan: `developer.x.com` svarar 402 och
`docs.x.com` har ingen kvarvarande Cards-sida. Talen kommer från
andrahandskällor och ska läsas som sådana.

Uppmätt över hundra slumpade sidor ur bygget väger kortet 13,7 till 32,9 kB,
19,9 kB i medel. Apples TN3156 avråder från text i förhandsvisningsbilder
eftersom de skalas olika. Kortet svarar med få ord i stor grad: namnet är
74 px på 1 200, alltså omkring 22 px när Slack ritar kortet på 360.

**Vad som är verifierat, och vad som inte är det.** Bygget kördes till
`dist-og` och funktionen kördes lokalt i workerd via `wrangler pages dev`,
alltså i samma motor som i drift. Hundra slumpade sidor ur bygget hämtades:
100 procent svarade 200 med `Content-Type: image/png`, och alla hundra
avkodades av libvips som 1200 x 630 sRGB. Sidorna kontrollerades i bild vid
1440 och 375 och taggarna lästes ur den renderade DOM:en:

    og:image        https://prikko.se/dela/stockholm/ag.png
    og:image:width  1200
    og:image:height 630
    og:image:type   image/png
    og:image:alt    Hygienkontroll på AG, Stockholm
    twitter:card    summary_large_image

Måtten skrivs bara ut för vårt eget kort. Artiklarnas egna illustrationer har
egna mått, och en tagg som ljuger om dem är värre än ingen tagg: Yelp
deklarerar 2000 x 1500 för en fil som är 1000 x 750, uppmätt 2026-09-05.
`og:image:alt` var GitHubs enda tillägg som ingen av de fyra jämförbara
sajterna hade.

**Det som INTE gick att verifiera: Facebooks Sharing Debugger, LinkedIns Post
Inspector och en riktig Slack-unfurl.** Alla tre kräver en publik adress, och
rutten finns bara lokalt. Det som återstår efter utrullning är att klistra in
en verksamhets-URL i vart och ett av de tre och se att kortet dyker upp.

**Två risker som är kända och hanterade.**

1. **En trasig rutt hade varit värre än ingen rutt**, eftersom taggen nu står
   på 17 868 sidor. Varje väg ut som inte är en färdig bild är därför en
   302 till `/og-default.png` med `Cache-Control: no-store`, alltså exakt det
   läge sajten hade före, och aldrig cachad.
2. **Processorbudgeten.** Gratisplanen ger 10 ms per anrop. Ritningen tar 1
   till 4 ms och PNG-skrivningen 3 till 5, uppmätt på det längsta namnet i
   beståndet. Marginalen finns men är inte stor, och det är skälet till att
   bilden är indexerad med 256 färger i stället för fullfärg: fullfärg är
   2,27 MB rådata i stället för 756 kB. Svaret läggs dessutom i
   `caches.default`, så att omhämtningar från Facebook, Slack och Apple inte
   kostar en ny ritning.

---

## Diagram som INTE ska byggas

Prövade mot regel 1 (besvarar diagrammet en fråga listan inte besvarar?) och
avförda:

- **Cirkeldiagram över avvikelsekategorier.** ControlBreakdown-listan med
  antal är mer läsbar än varje paj. Andelar av ett litet antal är text.
- **Mätare och gauges för andelar.** En procentsiffra är sitt eget diagram.
- **Radardiagram över kontrollområden.** Ser analytiskt ut, säger ingenting
  som listan inte säger, och antyder en poängrymd som inte finns.
- **Betygskurva per verksamhet.** En linje genom tre bedömningar påstår en
  utveckling ur tre nedslag. Tidslinjen i punkt 1 visar samma data utan
  påståendet.
- **Kartfärgning per kommun på nyckeltal.** Uttryckligen förbjuden i
  kontrollen.ts; en färgad Sverigekarta är en rangordning i kartform.
- **Animerade räknare och allt annat som kräver JS för att visas.** Sajten
  är noll-JS av princip och ett tal som tickar upp är dekor per definition.

## Parkerat, med skäl

- **Filtrering på verksamhetstyp på listsidor.** Parkerad till designfasen,
  typerna är inte normaliserade mellan kommuner. Kartfiltret (punkt 6) är
  undantaget eftersom det arbetar inom en kommun.
- **Lokalens historik uppdelad per verksamhet.** Kräver bekräftat orgnr,
  ligger i rapport 15 som fas två. Största kända kvalitetslyftet, men
  bryggan byggs först.
- **Kedjesidor.** Samma orgnr-beroende, rapport 15 avsnitt 3.
- ~~**Delningsbilder per verksamhet.** Blockerad av filbudgeten, se punkt 8.~~
  Avparkerad och byggd 2026-09-05, se punkt 8b. Filbudgeten var verklig och
  slutsatsen fel: bilden ritas i kanten och kostar en fil i stället för
  17 146.
- **Aggregerade omdömesbetyg.** Avgjort i rapport 15: inte förrän volymen
  betyder något, och aldrig bredvid hygienbedömningen.

## Föreslagen ordning

Punkt 1 och 5 först: båda är ren rendering av färdig data, syns direkt och
etablerar SVG-mönstret som punkt 3 sedan återanvänder. Därefter punkt 2, som
är den enda med löpande drift och därför ska sättas i gång tidigt så att den
hinner gå fel i det tysta innan någon är beroende av den. Punkt 4 är en
mellandag när som helst. Punkt 6 till 8 efter det, i den ordning designfasen
ger.

---

## Vad en bevakning gör

Tillagt 2026-08-12. Punkt 2 och punkt 7 ovan beskrev var sin halva av samma
funktion utan att någon sagt vilken av dem som ÄR bevakningen. Frågan har
stått öppen i `25_oppna_punkter.md` sedan knappen byggdes, och den kostade mer
än den såg ut att göra: eftersom mejlet räknades som funktionen låg också
listan bakom mejlflaggan i `notify.py`, och `RESEND_API_KEY` är inte inlagd.
En bevakning gjorde alltså ingenting alls. 22 rader låg i `community.follows`,
klockan i sidhuvudet stod på noll, och `/konto/notiser/` var tom.

**Förslaget, och det som nu är byggt: en bevakning är en LISTA på kontot.
Mejlet är en påminnelse om listan, inte funktionen.**

Ordningen är avgörande och inte en smaksak:

- **Listan går att bygga i dag.** Den kräver ingen nyckel, ingen leverantör
  och inget avtal. Mejlet kräver Resend, ett DNS-arbete och ett biträdesavtal,
  se `13_epost_pa_prikko_se.md`.
- **Listan kan inte gå fel utåt.** Ett mejl som går till fel person, med fel
  ton eller vid fel tillfälle går inte att ta tillbaka. En rad på ett konto
  kan alltid rättas.
- **Listan är beviset mejlet pekar på.** Ett mejl om något som inte står på
  kontot är ett besked man inte kan gå tillbaka till. Därför innebär
  `--skicka` numera `--notiser` i `notify.py`, aldrig tvärtom.

Vad en bevakning betyder, uttryckt så det går att pröva:

> Du bevakar ett ställe. När kommunen registrerar en NY kontroll där som
> slutar i anmärkningar, står det på ditt konto nästa gång du tittar. Har du
> mejl påslaget kommer det dessutom ett mejl samma natt.

Gränserna, som gäller båda vägarna in:

- Bara nya kontroller MED anmärkningar. Inte utmärkelser, inte namnbyten, inte
  kontroller som gick bra. Skälet står i huvudet på `notify.py` och ändras
  inte av att listan nu bär funktionen.
- Ordagrant kommunens uppgift, aldrig en rubrik som skandaliserar.
- Att sluta bevaka och att sluta få mejl är samma sak. Ett halvläge där raden
  ligger kvar men är tyst ser ut som en bevakning utan att vara det.

Kvar att göra, i den ordningen:

1. **Bevakningslistan på `/konto/` visar läget**, alltså bedömning och
   senaste kontrolldatum per bevakat ställe, och länkar till verksamheten i
   stället för till en sökning. Punkt 7 ovan. Kräver ingen ny tabell:
   `publishable_establishments` bär `verdict` och `slug`, och namnet slås
   redan upp av `placeNames()` i `site/src/lib/community.ts`.
   GJORD 2026-09-01, se avsnittet sist i filen.
2. **Mejlet slås på** den dag `RESEND_API_KEY` ligger i GitHub-hemligheterna.
   Ingen kodändring behövs; nattjobbet väljer gren på om nyckeln finns.

---

## Bevakningsraden bär läget, och områdesbevakningen byggdes inte

Tillagt 2026-09-01. Punkt 1 i listan ovan är gjord. Punkt 2 väntar fortfarande
på nyckeln.

### Vad raden bär nu

Namn, stad, senaste kontrolldatum, kommunens bedömning som etikett, och en
länk till verksamheten i stället för till en sökning. Ordningen är senaste
kontroll först, alltså det listan är till för.

Det som saknades och som byggdes i den här omgången är FALLET UTAN BEDÖMNING.
`verdict: null` är två besked och inte ett, och det är inte ett kantfall:
i ögonblicksbilden 2026-09-01 har 1 602 av 17 129 rader ingen registrerad
kontroll alls och 147 har bara kontroller äldre än femårsfönstret i
`pipeline/prikko/grading.py`. Var tionde verksamhet i beståndet går alltså att
bevaka utan att ha en bedömning, och för dem stod raden kvar med enbart namn
och stad, alltså precis den tomma rad som skulle bort.

Raden hämtar därför `assessment_reason` ur vyn och skriver ut skälet med
verksamhetssidans egna ord, `Ingen kontroll` eller `Ingen aktuell kontroll`, i
grått bläck utanför den tregradiga skalan. Avsaknad av underlag får aldrig
läsas som ett dåligt betyg. Saknas assessments-raden helt räknas den som
`no_inspections`, samma förval som exporten sätter på rad 668 i
`pipeline/export_supabase.py`, så att de två vägarna från samma databas inte
gissar olika.

Verifierat i bild mot ett bygge, sex rader som täcker varje fall: `clean`,
`minor`, `major`, utanför femårsfönstret med datum 2018, utan kontroll och
utan datum, samt en avregistrerad som faller tillbaka på sökningen.

### Var bedömningen läses ifrån, och varför

**Ur Supabase, inte ur den byggda sajten.** Kontot läser i realtid medan
sidorna byggs statiskt, så frågan måste besvaras och inte antas. Tre skäl, i
fallande vikt:

1. **Snapshoten är en kopia av databasen, inte en andra källa.** Nattjobbet
   `.github/workflows/uppdatera-data.yml` skriver Supabase och exporterar
   `site/src/data/*.json` i samma körning, stegen "Skriv till Supabase" och
   "Exportera ögonblicksbild till bygget". De kan skilja sig med högst ett
   bygge, och där de skiljer sig är databasen den färskare.
2. **Det finns inget statiskt dokument att läsa.**
   `/api/v1/verksamhet/<kommun>/<slug>.json` är avstängd, `PER_VERKSAMHET` är
   `false`, eftersom rutten kostar 17 066 filer mot Cloudflare Pages tak på
   20 000 där vi ligger på 15 500. Alternativet vore att baka in beståndet i
   kontosidans paket: 17 000 rader byggdata på en sida som är `noindex` och
   kräver inloggning.
3. **Uppslagningen sker ändå.** Bevakningsraden bär `establishment_id` och
   ingen slug, och slugen finns bara i den redaktionella databasen. Anropet
   måste göras för att raden ska kunna länka till stället, och bedömningen är
   gratis i samma svar.

Den enda kända glipan är mätt: vyn filtrerar på `coalesce(active, 2) = 2`
medan exporten behåller de avregistrerade rader som bär noten om att kommunen
svarat Inaktiv, 30 stycken i Stockholm 2026-09-01. En bevakning av en sådan rad
får inget läge och faller tillbaka på namn, stad och sökningen. Att i stället
läsa `establishments` direkt vore att gå förbi vyn som väljer sina kolumner
uttryckligen, och den vyn finns just för att en ny kolumn aldrig ska bli publik
av misstag. 0,18 procent av beståndet är ett lägre pris än det.

### Ett ägarbeslut som blottas av raden, och som inte rörts

Etiketten `Brister` ligger på 1,53:1 mot vitt, eftersom `--verdict-minor-ink`
ÄR märkets `#FECB00`. Grönt och rött ligger på 4,6:1 och den grå på 5,07:1.
Följden syns i bilden på listan: **"Ingen aktuell kontroll", som betyder att vi
inte vet något, är läsbarare än "Brister", som betyder något.**

`tokens.css` accepterar talet med skälet att ansiktet alltid står intill och
att färgen aldrig bär betydelsen ensam. På bevakningsraden står inget ansikte,
alltså är det skälet inte uppfyllt här. Det är samma undantag som
`lib/face-klassisk.ts` redan noterar för kartnålen ovald och vald.

Inte rättat, och det är avsiktligt. Den gula är ägarens beslut taget två
gånger, `#8E7200` och `#A4560B` är redan underkända, och att välja en tredje
gul åt honom i en CSS-fil vore att riva ett designbeslut i tysthet. Talen för
en väg finns om han vill gå den: en mörk bärnsten omkring `#BE8A00` ger 3,08:1.
Alternativet utan ny färg är att sätta märket intill ordet på den här raden,
alltså återställa villkoret `tokens.css` skrev ned.

### Områdesbevakning: byggd nej, och skälet är mätt

`docs/31` §6.4 föreslår att man bevakar ett område i stället för ett ställe.
Prövad mot tre frågor och avförd på den första.

**1. Vad skulle notisen säga? Den kan inte skrivas.** Uppmätt på Stockholms 87
områdespolygoner mot kontrolldatan, nya kontroller MED anmärkningar:

    fönster        totalt   områden med minst en   median   störst
    30 dagar            8            6 av 87            1        2  (Vasastaden)
    90 dagar          198           41 av 87            2       40  (Norrmalm)
    365 dagar       1 352           73 av 87            5      190  (Norrmalm)

Södermalm ger 175 på ett år, alltså omkring femton namngivna verksamheter i
månaden. Med namn är det en månatlig lista över andra människors kök som
misslyckats, alltså exakt den värstinglista som är förbjuden och som `docs/31`
§6.4 varnade för i samma stycke som den föreslog funktionen. Utan namn blir det
"femton nya kontroller med anmärkningar på Södermalm", ett tal ingen kan handla
på och som dessutom uttalar sig om stadsdelen. Det finns ingen tredje
formulering. Och för resten av staden faller den åt andra hållet: medianområdet
får fem på ett år, fjorton områden får noll, alltså tiger funktionen i ett år
för de flesta. Antingen spam eller tystnad, inget däremellan.

**2. Vad kostar den?** Mer än `docs/31` §6.4 räknade. Bevakningar lagras per
verksamhet, så ett område kräver en migrering på produktionsdatabasen och en
gren i `notify.py`, vilket §6.4 sade. Det som inte stod där är att
`notify.py` inte kan veta vilket område en verksamhet ligger i:
`establishments.district` är tom i alla 15 921 rader, och punkt-i-polygon körs
i dag bara vid bygget, i `site/src/lib/omraden.ts`. Nattjobbet skulle alltså
behöva polygonfilerna och prövningen på sin sida också. Täckningen är dessutom
ojämn: 1 340 av 8 567 stockholmsverksamheter, 15,6 procent, ligger utanför varje
polygon, och bara 64 områden i 6 av 13 kommuner når `MIN_AREA_PAGE = 25`. Den
som bevakar sitt kvarter kan alltså få tystnad för att hans ställe ligger i
glappet, utan att kunna se det.

**3. Finns efterfrågan?** 21 bevakningar från fem personer på 27 dagar, nio
konton, noll utskickade notismejl. Den bevakning vi HAR har aldrig levererat
sitt löfte en enda gång, eftersom `RESEND_API_KEY` inte är inlagd. Att bygga en
andra bevakningstyp innan den första fått fyra rätt är fel ordning.

**Rekommendationen: bygg den inte.** Gör i stället ordningen i punkt 2 färdig,
alltså lägg in nyckeln och låt bevakningen per verksamhet mejla en gång. Faller
det ut väl och ber någon om ett område, tas frågan upp igen med tal på hur ofta
listan faktiskt lästes. `docs/31` §6.4 skrivs inte om, den får en hänvisning
hit.
