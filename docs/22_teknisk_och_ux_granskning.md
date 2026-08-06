# 22. Teknisk redovisning, UX och vad som ger moat

Skriven 2026-08-07 på begäran av ägaren. Allt som står som mätt är mätt i den
här sessionen; allt som är en bedömning är märkt som en bedömning.

## Del A. Var vi står tekniskt

**Stacken.** Astro 7 som statisk generator, 16 396 sidor byggda på 2 minuter
och 9 sekunder. Fem beroenden totalt: astro, sitemap-tillägget, två
teckensnitt och maplibre-gl. Ingen React, inget diagrambibliotek, ingen
byggkedja utöver Astros egen. Diagrammen ritas som SVG i komponenterna.
Kartan är MapLibre mot OpenFreeMap, gratis, utan nyckel och utan tak, med en
egen kartstil byggd ur OSM Liberty. Gemenskapslagret, alltså konto,
bevakningar, omdömen och bilder, ligger i Supabase och når aldrig ett bygge.
Pipelinen är Python med omkring 550 tester.

**Det håller.** Noll API-anrop per besökare, cache i ett år på allt som är
innehållsadresserat, och en sida som fungerar utan JavaScript.

### Fyra risker, i storleksordning

**1. Filtaket på Cloudflare Pages är den verkliga väggen.**
Taket är 20 000 filer. Bygget ligger nu på 16 517 för TOLV kommuner, alltså
83 procent av budgeten. Vid 290 kommuner talar vi om storleksordningen
400 000 filer. Sajten kan inte växa till riket i sin nuvarande form, och det
är inte en optimering utan ett arkitekturbeslut som måste fattas innan
kommun nummer tjugo. Vägarna är i praktiken tre: server-renderade sidor på
Cloudflare Workers, en hybrid där bara de mest besökta sidtyperna är statiska,
eller en annan värd. Ingen av dem är gratis i arbete, och den som väljs sent
kostar mest.

**2. Nattkörningen har fallit sedan 6 augusti.**
`Uppdatera data` stannar på en dubblettnyckel: en verksamhet i Stockholm har
fått ett nytt id från kommunen medan den gamla raden ligger kvar och håller
slugen. Datan står alltså stilla. En agent arbetar på det. Färskhet är inte
kosmetik här, den är en rankningssignal och en trovärdighetsfråga.

**3. Testgrinden har slutat gå.**
Repot är privat, och GitHub Actions har inte startat en enda körning på de
fyra senaste commiterna. Arbetsflödena är aktiva och YAML:en är giltig, så
den troliga orsaken är slut på gratisminuter. Just nu pushas alltså kod utan
att testerna körs, och det är särskilt illa i ett projekt som publicerar
omdömen om namngivna verksamheter.

**4. Schemat i Supabase släpar efter filen i repot.**
Bilduppladdningen föll på en kolumn som finns i `schema_community.sql` men
inte i databasen. Det kommer att hända igen så länge schemat körs för hand.
En migrationslogg med versionsnummer, eller Supabase CLI, löser det.

Utöver det: ingen felövervakning i produktion, och ingen mätning av vad folk
faktiskt söker efter. Vi bygger alltså sökfunktioner i blindo.

## Del B. UX och UI

**Det som sitter.** Bedömningen ligger högst upp på verksamhetssidan, ett
ansikte och en mening, utan låda. Huvudkolumnen skiljer sektioner med hårlinje
och luft i stället för kort, vilket är Boolis grepp och skälet till att sidan
är lugn. Sidopanelens paneler är kort, och kontrasten mot huvudkolumnen är det
som gör att panelen läser som verktyg.

**Det som saknas, i fallande ordning av hur mycket det märks.**

1. **Bilder.** Verksamhetssidorna är text och en karta. Gatubilderna är
   byggda men blockerade av två saker ägaren måste göra: R2-hinken och
   Mapillarys logotyp. Besökarbilder är byggda men schemat är inte kört.
   En sida utan bild ser tunn ut bredvid vilken restaurangsajt som helst.
2. **Ingen filtrering på verksamhetstyp** i listorna. Den som vill se bara
   restauranger i Uppsala kan inte det utan att gå via en kategorisida.
3. **Kommunsidans karta ligger bakom ett klick** i stället för att synas.
4. **Ingen jämförelse.** Två ställen kan inte ställas bredvid varandra, vilket
   är den vanligaste handlingen på varje sajt som visar många objekt.
5. **Sidbredden varierar** mellan sidtyper. Ägaren har påpekat det, och det
   är fortfarande inte helt löst.
6. **Sidfoten** är underkänd sedan länge och står kvar på listan.

## Del C. Vad som gör oss bättre än en kommunal livsmedelskarta

En kommunal karta ger en nål, ett datum, en smiley och ibland en PDF. Den
stannar vid kommungränsen, den har inget minne, och den hör aldrig av sig.
Där ligger hela öppningen.

**Redan byggt, och det är detta som skiljer oss:**

- **Historik per lokal.** De visar den senaste kontrollen. Vi visar varje
  kontroll sedan 2018 och om samma brist återkommer. Detta är den enskilt
  största skillnaden.
- **Sökning över kommungränser.** Deras karta slutar vid gränsen.
- **Bevakning med mejl** när något händer på ett ställe du följer. Ingen
  kommun gör det. Kräver bara att Resend-nyckeln läggs in.
- **Utmärkelsen.** Ett positivt märke som verksamheten själv vill visa upp,
  alltså marknadsföring som går av sig själv, och vår väg in till företagen.

**Inte byggt, rangordnat efter värde per arbetstimme. Detta är min
bedömning, och en agent granskar den just nu mot faktiska förebilder:**

1. **Kedjesidor.** Alla Espresso House, MAX eller Sushi Yama samlade över
   kommungränserna, med hur kedjan står sig. Ingen annan kan bygga det, det
   kräver bara vår data, och det är en söksida som ingen konkurrerar om.
2. **Områdessidor.** Södermalm, Gamla stan, Luthagen. Koordinaterna finns
   redan. Det är den största outnyttjade SEO-ytan vi har, och det är exakt
   det Zillow och Redfin lever på.
3. **Nyöppnat och stängt.** Rörelsen i beståndet, per kommun och månad. Ger
   återkommande trafik i stället för engångsbesök.
4. **Jämför två ställen.** Billigt att bygga, och en handling folk redan
   försöker göra genom att öppna två flikar.

**Detta bygger vi aldrig:** ett robotombud som lämnar in ärenden till
kommunala e-tjänster åt någon, och ingen rangordning av kommuner på
kontrollresultat.
