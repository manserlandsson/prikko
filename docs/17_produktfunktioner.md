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
- **Delningsbilder per verksamhet.** Blockerad av filbudgeten, se punkt 8.
- **Aggregerade omdömesbetyg.** Avgjort i rapport 15: inte förrän volymen
  betyder något, och aldrig bredvid hygienbedömningen.

## Föreslagen ordning

Punkt 1 och 5 först: båda är ren rendering av färdig data, syns direkt och
etablerar SVG-mönstret som punkt 3 sedan återanvänder. Därefter punkt 2, som
är den enda med löpande drift och därför ska sättas i gång tidigt så att den
hinner gå fel i det tysta innan någon är beroende av den. Punkt 4 är en
mellandag när som helst. Punkt 6 till 8 efter det, i den ordning designfasen
ger.
