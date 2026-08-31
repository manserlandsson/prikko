# 56. Nästa vertikal: vad av maskinen som går att lyfta

**Datum:** 2026-08-31
**Beställning:** `docs/45_entreprenorslistan.md` pelare F. Bibeln kallar
slutmålet "förtroendelagret på svensk offentlig data" och räknar upp
äldreomsorg och andra inspektioner som nästa steg. Det hade aldrig utretts.
**Status:** ofullständig. Kodinventeringen nedan är klar och mätt.
Marknadsdelen, alltså vilken vertikal som faktiskt är värd att välja, avbröts
av en användningsgräns och ska köras om. Se avsnitt 7.

---

## 1. Slutsatsen först

**Ungefär hälften av maskinen är generisk "offentlig kontrolldata till
konsumentsajt".** Mätt rad för rad över 87 686 rader i `pipeline/`,
`site/src/lib/` och `site/src/pages/`:

| Klass | Rader | Andel |
|---|---:|---:|
| **GENERISK**, lyfts oförändrad | 43 434 | 49,5 % |
| **PARAMETRISERBAR**, lyfts med konfiguration | 15 768 | 18,0 % |
| **LIVSMEDELSSPECIFIK**, skrivs om | 16 403 | 18,7 % |
| **KÄLLSPECIFIK**, kastas | 12 081 | 13,8 % |

**Det avgörande svaret: bedömningsmodellen är inte hindret.**
`pipeline/prikko/grading.py` är 418 rader varav 173 är prosa i modulhuvudet.
Den rena beslutslogiken är tre funktioner och **ungefär 90 rader**.

**Hindret ligger uppströms.** Modellen räknar inte avvikelser. Den ärver
kommunens eget `assessment`-heltal, noll ett eller två, och skärper det ett
steg när mönstret visar att problemet överlevt. IVO och Skolinspektionen
levererar inte ett heltal, de levererar beslut i fritext. **Ingenstans i
kodbasen finns en komponent som gör fritext till ett ordinalt utfall.** Det är
ny kod och inte lyft kod, och det är den enda genuint nya komponent en andra
vertikal kräver.

**Två varningar om täckningen.** `site/src/components/`, 81 filer och 37 551
rader, ingick inte i inventeringen och är sannolikt det mest
livsmedelsfärgade lagret efter `pages/`. `pipeline/tests/`, 46 filer och
15 291 rader, är inte heller medräknat, och 13 av 46 testfiler är per kommun.

---

## 2. Det som lyfts oförändrat

Hela geokodningen med sin cache på 649 kB och SWEREF99-projektionerna, som
behövs för vilken svensk kommunal geodatakälla som helst. Hela kartlagret
inklusive den egenskrivna PMTiles-skrivaren. Hela söklagret med vikning och
avståndspass. Områdesmaskineriet mot OSM och SCB RegSO. Sjögränsen.
Närhetsmåtten. Bildpipelinen. Öppettider och kontaktuppgifter ur OSM. Hela
community-, konto- och modereringslagret. Brevkodsmaskineriet.
Rörelsespårningen. Slugifiering, paginering, URL-bygge, sitemap,
juridiksidorna, maskoten.

**Kartan är den mest återanvändbara delen av hela projektet.** 1 585 rader med
sammanlagt tre träffar på ett livsmedelsord, alla i kommentarer.
`lib/pmtiles.ts` är en egenskriven PMTiles-skrivare med noll domänord.
`lib/kartrutor.ts` har exakt två rader som binder den till verksamheterna:
bedömningen till ett index, och utmärkelsen till en flagga. Bytet är att
ersätta `MAP_VERDICTS` och ansiktet.

**Söklagret lyfts i stort sett oförändrat**, 1 584 rader. Radformatet är namn,
adress, slug, kommunindex och bedömningsindex, och bara det sista är
domänbundet. Det är ett heltal.

**Trettioen av 66 filer i `site/src/lib/` har noll träffar** på något
livsmedelsord.

## 3. Det som lyfts med konfiguration

Kategoritabellen, som är byggd som en tabell just för detta och säger det
uttryckligen i sitt modulhuvud. Bedömningsansiktets fyra lägen. Märket och
dekalen. Kommunregistret. Brevmallarna. Typerna i `db.ts`. Kedjeregistret.
Utmärkelsetrösklarna.

**Kommunregistret är den bästa återanvändningen räknat på nytta per rad.**
290 kommuner med verifierade mottagaradresser och namngiven källa per fält.
**Exakt ett fält är livsmedelsbundet**, antalet anläggningar. Allt annat är
ren offentlig-Sverige-infrastruktur: kommunkoder, län, invånare ur Kolada,
e-postadresser hämtade ur kommunernas egna sidor, och strukturen som kodar att
290 kommuner bara har 249 kontrollmyndigheter.

## 4. Det som skrivs om

Verksamhetssidan, startsidan, metodiksidan, de åtta rapportsidorna,
matsnusklistan, `punktstatistik.ts`, `rapporter.ts`, områdestabellen i
`data.ts`, matkategorierna, anmälningsformulären, och områdesviktningen i
`grading.py`.

**Tre riktiga knutar, och resten är etiketter.** Fördelningen är starkt
högersvansad: fem filer står för 279 av 908 träffar, och medianfilen med en
träff har två. De tre som sitter djupt:

1. `lib/data.ts` rad 159 till 181, tolv livsmedelsområden med
   konsumentförklaringar, som speglar samma tabell i `grading.py`. Två
   ställen, en sanning, måste bytas ihop.
2. `lib/punktstatistik.ts` och `lib/rapporter.ts`, 2 927 rader som räknar
   kontrollpunkter per lagstiftningsområde. **Mot fritextbeslut finns
   ingenting att räkna.** Den delen skrivs om från grunden eller utgår.
3. `pages/metodik.astro`, 1 308 rader, som per konvention är låst till
   `grading.py` i samma commit.

Schemat är däremot nästan rent: kolumnerna heter `establishments`,
`inspections`, `control_areas` och `assessments`, inte `restaurants` eller
`hygiene_checks`.

## 5. Det som kastas, och varför det inte gör ont

Alla fjorton kommunhämtare, 12 081 rader. De ersätts inte, och det är
poängen: **IVO och Skolinspektionen är nationella myndigheter och inte 290
kommuner.** I stället för fjorton skrapor mot fjorton kommuner blir det en
eller två mot ett eller två register. Det är dramatiskt mycket mindre arbete,
inte mer.

**Ett arkitekturfynd på vägen.** Det finns ingen basklass och ingen delad
hämtare: sökning efter `class Base`, `BaseFetcher` och `abstractmethod` i hela
pipeline ger noll träffar. CLI-skripten är till 45 till 56 procent ordagrant
identiska med varandra, och `USER_AGENT` deklareras i tjugo av tjugo filer,
`class UnknownSourceValue` i fjorton av arton, `normalize_establishment` i
fjorton. Parsermodulerna är däremot i praktiken hundra procent unika, vilket
är rimligt.

Per kommun: ungefär 675 rader, varav 120 är upprepning och 555 är källunik
logik. En ny vertikal skriver om de 120 raderna från grunden. Det är en dags
arbete och inte en risk.

## 6. Bedömningsmodellen, i detalj

Den bygger på fem saker: en treställig heltalsskala ur Sambruks specifikation,
kontrolltypen, ett mönster i stället för en etikett, Livsmedelsverkets
lagstiftningsområden, och två tal, alltså fönstret på fem år och historikdjupet
tre.

Modellen är i praktiken: **ta myndighetens egen tregradiga slutsats om senaste
tillsynen, skärp den ett steg om mönstret visar att problemet överlevt, och ge
en märkning vid tre rena i rad.**

**Vad som passar en fritextvertikal:** skärpningsregeln, färskhetsfönstret,
historikmärkningen, vägran att gissa, versioneringen, och renheten. IVO har
dessutom riktiga motsvarigheter till uppföljning och klagomål, och
Skolinspektionen har uppföljning av föreläggande. Skärpningsregeln skulle
fungera nästan ordagrant för båda.

**Vad som brister:** modellen har ingen egen bedömningsförmåga. Utfallen "inga
brister", "föreläggande", "föreläggande med vite" och "återkallelse" är
ordinala och skulle gå att mappa till tre nivåer, precis som varje hämtare
redan gör. **Men den mappningen är i dag hämtarens ansvar**, och för fritext
finns ingen hämtare som kan läsa den.

Bara ungefär fyrtio rader i `grading.py` är ordagrant livsmedel, alltså
områdesbokstäverna och uppslagstabellen med de 27 svenska områdesnamnen.

## 7. Det som återstår att utreda

Marknadsdelen avbröts. Frågan som inte är besvarad är vilken vertikal som
faktiskt är värd att välja, alltså om det finns offentlig kontrolldata som går
att komma åt, spridd över många huvudmän, och en konsument som söker på den.

Agenten hann rapportera en sak innan den föll: **den starkaste kandidaten var
en som inte stod i beställningens lista.** Vilken framgår inte. Underuppdrag om
IVO och vård, om skola och förskola, och om ytterligare kandidater avbröts
alla utan att rapportera.

Ett spår som ska prövas när det körs om: `docs/54_affarsmodellen.md` säger att
de närmaste sex månaderna ska gå till täckning, och att "ingen ny vertikal på
tre år" är ett fullt giltigt svar. Inventeringen ovan säger att en andra
vertikal är billigare än den ser ut. Det är två olika frågor och båda svaren
kan vara rätt samtidigt.
