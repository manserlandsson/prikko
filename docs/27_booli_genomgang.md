# 27. Samlad genomgång mot Booli

Ägaren har sagt genom hela projektet att booli.se är designriktningen för
HELA sajten, och att hemnet är förkastat. Ingen har någonsin ställt sajten mot
Booli i ett svep. Ytor har gjorts om en och en när han klagat på dem, och det
är därför sajten känns lappad i stället för gjord. Det här dokumentet är den
genomgången.

## Ommätt 2026-08-18

Booli har flyttat sig sedan den 13, så talen nedan är inte längre sanna rakt
av. Ommätt i webbläsaren på deras sidor i 1280×900 och 390×844, samma mätkod
på båda bredderna:

| Deras kontroll | 13 aug | 18 aug |
|---|---|---|
| Sökfältet `.bui-input-search` | 50 | **50**, radie 4, kant 1 px `#F0F0F0`, ingen skugga |
| Sidhuvudets rad `nav.h-16` | ej mätt | **64**, båda bredderna |
| Filterknapp och sorteringsväljare | 46 | **40**, radie 4, kant 1 px `#CCCCCC`, text 14/24 |
| `select` på startsidan | 48 | **48**, åtta stycken |
| Områdeschippet i filterraden | ej mätt | **26,9** |
| Runda sparknappen i kortet | ej mätt | **32** |
| Paginering, "Nästa sida" | ej mätt | **48** |

Alltså: **påståendet "kontroller är 44 till 50 px höga" står inte längre.**
Deras knappmått är 40 i dag, och de har kontroller på 27 och 32. Golvet på
44 px som gäller hos oss är WCAG 2.5.5 och Apples riktlinje, inte Boolis
praxis, och det ska stå skrivet så i stället för att lånas ur förlagan.

Textfärgerna står däremot kvar: `#1A1A1A` bär 415 element på startsidan mot
`#767676`:s 1, och på sökresultatet 448 mot 43. En grå, och den bär lite.

## Hur talen är framtagna

Uppmätt i webbläsaren 2026-08-13, aldrig ur minnet. Chrome via Playwright,
1280×900 och 390×844, samma mätkod på båda sajterna så att talen går att
ställa mot varandra. Skriptet ligger i sessionens scratchpad och räknar per
sida: textgrader med radhöjd och vikt, textfärger, radier, skuggor,
blockbredder, hårlinjer, kortmått, rubriknivåer, kontrollhöjder och avstånd
mellan sektioner.

Booli-sidorna som mättes, med vår motsvarighet:

| Vår sidtyp | Boolis motsvarighet |
|---|---|
| Startsidan | `booli.se/` |
| Kommunsidan | `/sok/till-salu?areaIds=115349` |
| Verksamhetssidan | `/bostad/804457` (objektsidan) |
| Kategorisidan | `/kunskap/kategori/bostadsmarknaden` |
| Kedjesidan | `/maklarbyraer` |
| Kartvyn | `/rantekartan` |
| Sökresultatet | `/sok/till-salu` |
| Artikeln | `/kunskap/<slug>` |
| Rapporten | `/vardera` |
| Kontot | `/logga-in` |
| Områdessidan | ingen motsvarighet, se nedan |

**Förbehåll om våra tal.** Mätningen av våra sidor kördes mot en statisk
server på `site/dist-riket`, alltså ett bygge som är någon dag gammalt.
Designsystemet i `tokens.css` och komponenternas form har inte ändrats under
tiden, så grader, radier, skuggor och färger står. Det som INTE syns i talen
är commit `27318562`, som gjorde kommunsidans fördjupningsband vitt. Den
punkten är därför skriven ur commiten och inte ur mätningen.

## Boolis system, mätt

Det som slår en när man mäter dem är hur få värden de har.

- **Radier: tre.** 4 px bär allt (18 till 245 element per sida), 6 px är kort
  och bilder, 9999 är piller. Radie 12 förekom EN gång på hela sajten.
- **Skuggor: i praktiken en.** `0 2px 8px rgba(0,0,0,.05)`, plus en svagare
  `0 1px`-variant. Ingen sida hade något kraftigare.
- **Textfärger: två till fyra per sida.** `#1A1A1A` bär 79 till 408 element,
  `#767676` 1 till 42, accenten `#FF610D` 1 till 3 gånger och aldrig som dekor.
- **Textgrader: 14/24/400 dominerar varje sida**, 27 till 250 förekomster.
  Sedan 16/24/400 och 16/22/600.
- **Rubrikernas radhöjd ligger på 1,30 till 1,35.** 48/62,4. 40/52. 32/43,2.
  24/32,4. 18/24,3. 16/21,6. Utan undantag, på varje sidtyp.
- **Vikt 600 på varenda rubrik.** Inget annat värde förekom.
- **Bredder: 980 sidbehållare, 688 listspalt, 620 brödtext.**
- **Kontroller är 44 till 50 px höga.** Sökfältet 50, knappen 48, chipsen 46,
  väljaren 48. **Överspelat, se ommätningen överst:** den 18 augusti ligger
  deras knapp på 40 och deras chip på 27, och sidhuvudsraden är 64.
- **Hårlinjer: 9 till 37 per sida.** Sektioner skiljs av linje och luft.

---

# Prioriterad lista

Ordnad efter avvikelsens storlek delat med vad den kostar att rätta. Det
längst upp ger mest per nedlagd timme.

## 1. Heron var sajtens största avvikelse (RÄTTAD)

**Mätt.** Boolis hero är 1280×648 och HELT VIT. Ingen bild, inget färgfält,
ingen toning. Sidbehållaren 980 bär två kort: sökkortet 560×552 till vänster
och påståendekortet 380×270 till höger, 40 px mellan. Båda vita, 1 px
`#E6E6E6`, radie 6, skugga `0 2px 8px rgba(0,0,0,.05)`. Påståendet är
40/52/600. I 375 px blir bandet 676 högt, sökkortet 343 brett med 16 px
marginal, och påståendekortet tas bort helt med `display: none`.

**Vår.** Ett mättat märkesblått fält (`#007BE0`) kant i kant med en tecknad
illustration i båda kanterna, och ett centrerat kort med skuggan
`0 1px 2px rgba(0,0,0,.06), 0 24px 60px rgba(0,0,0,.22)`. Den skuggan har
**7,5 gånger Boolis spridning och 4,4 gånger dess alfa**. Heron var dessutom
låst till `min-height: 520px`, vilket gav 250 px tom yta över och under två
kort på 270.

**Gjort.** Vitt band, två kort i Boolis proportion, `--shadow-sm` i stället
för teaterskuggan, vänsterställt sökkort och ett faktakort med tre tal som
döljs under 900 px precis som Boolis. Vektorn är ägarens egen beställning
från 7 augusti och är INTE raderad: den ligger kvar som `HeroVektor.astro`
och väljs med en rad i `index.astro` (`heroBakgrund`), tillsammans med fotot.

## 2. Grå text bär för mycket, och vi har tre gråa där Booli har en (HALVT RÄTTAD)

**Gjort 2026-08-18: tre nivåer blev en.** `--ink-faint` (#A1A1A6) är borta som
textfärg. Den låg på 2,6:1 mot vitt, alltså under WCAG för både brödtext och
stor text, och bar 8 element på verksamhetssidan och 25 på kommunsidan, mätt i
bygget samma dag. `--text-muted` pekar nu på `--ink-quiet` (#6E6E73, 5,4:1),
alltså samma grå som `--text-secondary`. Hierarkin under bläcket bärs av
storlek och vikt, exakt som glaslagret redan slagit fast.

Den ljusa grå är kvar under namnet `--tone-quiet`, men BARA som yta: en
stapel, en prick, en ram. Tre ställen pekades om dit (`Stapel.astro`,
`Parstapel.astro`, `kedja.css`), plus hovringens ramar i `SiteSearch.astro`,
`PlacePicker.astro`, `Filterrad.astro` och `Kategorival.astro`. Skriv aldrig
`color: var(--tone-quiet)`.

Namnen `--text-muted` och klassen `.text-muted` står kvar och pekar på samma
värde som `--text-secondary`. Klassen finns i 53 filer, och att byta namn i
alla på en gång är en ändring i ordval och inte i form.

**Kvar: kartvyns 61 procent.** Bärarna är `SPAN.k-typ.text-secondary` och
`SPAN.k-meta` i `Karta.astro`, alltså en kartkomponent, och de ägs av en
annan agent. Sammanslagningen ovan gör tonen läsbar men ändrar inte ANDELEN
gråa element, och det är andelen som är felet där.

## 2b. Andelen grå, oförändrad

**Mätt**, andel textelement i grå mot totalt antal textelement:

| Sidtyp | Booli | Prikko |
|---|---|---|
| Startsidan | **1 %** (1/87) | **29 %** (40/139) |
| Verksamhets-/objektsidan | **5 %** (6/113) | **30 %** (45/152) |
| Artikeln | **4 %** (4/114) | **12 %** (20/169) |
| Sökresultatet | 9 % (42/491) | 23 % (47/201) |
| Kommunsidan | 9 % | 42 % (206/490) |
| Kedjesidan | ingen mätpunkt | 38 % (138/367) |
| Kategorisidan | ingen mätpunkt | 36 % (139/386) |
| Områdessidan | ingen mätpunkt | 36 % (98/273) |
| **Kartvyn** | ingen mätpunkt | **61 %** (130/214) |

**Var ärlig om jämförelsen.** På listsidor använder Booli också grå för sin
radmeta: 35 av deras 42 gråa på sökresultatet är `object-card__preamble`, och
vår `EstablishmentList` gör exakt samma sak med adress och kontrolldatum. Den
delen av skillnaden är listlängd, inte smak. Den rena jämförelsen är sidor
UTAN långa listor, och där är skillnaden 29 mot 1 och 30 mot 5, alltså en
faktor på fem till trettio.

**Grundfelet var inte andelen utan antalet nivåer, och det är rättat**, se
punkt 2 ovan. Kvar av den här punkten är alltså bara andelen, som fortfarande
är fem till trettio gånger Boolis på sidor utan långa listor.

**Största enskilda bärare:** `SPAN.antal` på startsidan (20 element, alltså
kommunkortens "verksamheter"), `SPAN.meta.text-secondary` på kommun- och
kategorisidan (95 respektive 98), `SPAN.k-typ` plus `SPAN.k-meta` i kartans
träfflista (60 + 60).

## 3. Sajtens vanligaste textstil har fyra pixlar för tight radavstånd

**Mätt.** Den grad som dominerar VARJE sida på båda sajterna är 14 px.

- Booli: **14/24/400**, alltså 1,71. Mellan 27 och 250 förekomster per sida.
- Prikko: **14/20/400**, alltså 1,43. Mellan 50 och 109 förekomster per sida.

`docs/19_formsystem.md` har redan skrivit ner Boolis värde korrekt i sin
tabell ("Metatext 14/24/400"), men `--lh-body-s` sattes till 20 px och ingen
har gått tillbaka. Det är fyra pixlar per rad på den textstil som förekommer
oftast på hela sajten, och det är en av de starkaste anledningarna till att
våra sidor läser tätare och billigare än deras.

**Kostnad: en rad i `tokens.css`.**

## 4. Rubrikernas radavstånd är systematiskt för tight

**Mätt**, grad genom radhöjd:

| Grad | Booli | Prikko | Boolis kvot | vår kvot |
|---|---|---|---|---|
| 48 | 48/62,4 | 48/54 | 1,30 | 1,13 |
| 40 | 40/52 | 40/46 | 1,30 | 1,15 |
| 32 | 32/43,2 | 32/38 | 1,35 | 1,19 |
| 24 | 24/32,4 | 24/28 | 1,35 | 1,17 |
| 21 mot 18 | 18/24,3 | 21/25 | 1,35 | 1,19 |
| 17 mot 16 | 16/21,6 | 17/22 | 1,35 | 1,29 |

**Det finns en motsägelse i våra egna papper här.** `tokens.css` skriver
"Mätt mot booli.se ... rubriker har radhöjd omkring 1,2", medan
`docs/19_formsystem.md` skriver 1,30 till 1,35 och har rätt. Implementationen
följde kommentaren i tokens och inte bibeln.

**Kostnad: fyra värden i `tokens.css`.** Risken är att tighta komponenter
växer några pixlar, så den som gör det ska titta på kommunsidan och
verksamhetssidan efteråt.

**`--lh-hero` rörs inte.** Startsidans 48/54 bär Instrument Serif i vikt 400,
och en displayserif sätts tight med avsikt. Den är redan ett dokumenterat
undantag i `docs/19_formsystem.md` och står kvar på 1,13.

## 5. Fyra skuggor där Booli har en

**Mätt på startsidan före rättningen:** fyra olika skuggvärden i bruk.

1. ringen `0 0 0 1px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.05)`, 7 element
2. glaslyftet `0 10px 34px rgba(0,0,0,.14), inset 0 1px 0`
3. herokortet `0 1px 2px rgba(0,0,0,.06), 0 24px 60px rgba(0,0,0,.22)`
4. sökfältet `0 1px 2px rgba(0,0,0,.05), 0 6px 20px rgba(0,0,0,.06)`

Boolis kraftigaste skugga på HELA sajten är 8 px spridning vid 5 procent.
Punkt 3 är rättad i och med heron.

**Punkt 3 i listan ovan, hero-sökfältets `0 6px 20px` vid 6 procent, är
rättad 2026-08-18.** Fältet bär `--shadow-sm` som allt annat. Motiveringen
som stod i filen, att fältet ska lyfta mer än korten under, höll så länge
heron var ett mättat blått band; sedan heron blev vit ligger fältet på samma
vita som korten. Boolis eget sökfält har ingen skugga alls, utan en 1 px kant
i `#F0F0F0`, uppmätt 2026-08-18.

Kvar är glaslyftets 34 px vid 14 procent (`.glass` i `tokens.css`). Glaset är
ett taget beslut för svävande lager och ska inte skäras utan ägaren.

## 6. Kontrollerna är för låga, och några under träffytekravet (RÄTTAD)

**Ommätt 2026-08-18.** Booli: sökfältet 50, sidhuvudets rad 64, knappen 40,
`select` 48. Se avsnittet överst: deras 46 px chips är 40 i dag, och de har
själva kontroller på 27 och 32. Golvet på 44 px är alltså VÅRT, ur WCAG 2.5.5
och Apples riktlinje, inte lånat ur förlagan.

**Prikko före, mätt i bygget 2026-08-18:** sidhuvudets rad 58, sökfältet 40 i
sidhuvudet och 36 på telefon, hero-fältet 56 och 52, sökknappen 32 och 30,
genvägsmärket 22, informationspricken **16**, menyknappen 36, knapparna 42,
jämförknappen 34,5, pagineringen 40, kategorivalet 40. Filterradens val
mättes till **52** och var alltså aldrig 32; det talet gällde chipsen som
commit `a5dbfb47` redan tagit bort.

Informationspricken på 16 px var sajtens grövsta brott: under WCAG 2.5.8:s
24 px, och det fanns fyra till sex per sida.

**Gjort.** Skalan bor nu i `tokens.css` som fyra tal och inte i tolv filer:

| Token | Värde | Varifrån |
|---|---|---|
| `--h-bar` | 64 | Boolis `nav.h-16`, båda bredderna |
| `--h-field` | 50 | Boolis `.bui-input-search`, båda bredderna |
| `--h-control` | 40 | Boolis filterknapp och sorteringsväljare |
| `--h-tap` | 44 | WCAG 2.5.5, inte Booli |

Rättade ytor: sidhuvudets rad till `--h-bar`; sökfältet till `--h-field` i
båda bredderna, alltså slut på 36 px på telefon; sökknappen och `.btn-primary`,
`.btn-ghost`, `.btn-quiet` och pagineringen till `--h-tap`; `.btn-tight` och
jämförknappen till `--h-control` med `::after`; genvägsmärket, menyknappen,
kategorivalet och informationspricken behåller sitt utseende och bär
träffytan i ett `::after`, receptet ur `kartram.css`.

Informationspricken får 24 px för mus och 44 för finger, och det är räknat:
pricken står inuti löpande text med rader 28 px isär, och en osynlig
44-cirkel hade fällt ut bubblan när pekaren låg på talet under.
`pointer: coarse` har ingen hovring att stjäla.

**Kvar:** kartpuffens knapp på 34 px (`Platskarta.astro`) och kartans egna
kontroller. De ägs av kartans agent.

## 7. Vi skiljer sektioner med rutor där Booli skiljer med linje och luft

**Mätt**, antal hårlinjer per sida:

| Sidtyp | Booli | Prikko |
|---|---|---|
| Startsidan | 12 | **1** |
| Sökresultatet | 9 | **3** |
| Kategorisidan | 11 | **3** |
| Verksamhetssidan | 14 | 5 |
| Kommunsidan | 9 | 5 |
| Artikeln | 11 | (ej mätt) |
| Kedjesidan | 37 | 18 |

`docs/19_formsystem.md` föreskriver redan Boolis grepp ("Sektioner skiljs av
en 1 px `#E6E6E6` och 32 respektive 64 px luft. Aldrig av en ruta"), men det
är inte genomfört på startsidan, kategorisidan eller sökresultatet.

**Detta är ett MÖNSTER och inte ett enskilt fall.** Commit `27318562` tog
bort kommunsidans ljusblå fördjupningsband för att staplarna ritas i
märkesblått mot ett spår som räknar med vit botten. Samma konstruktion fanns
kvar på ett ställe till: `ArtikelBanner.astro` la ett band på `--brand-wash`
och ställde sedan ett VITT kort på det, kontrast 1,11:1.

**Rättad 2026-08-18.** Bandet har vit botten, en 1 px hårlinje över sig och
64 px luft på var sida om linjen, 32 under 900 px. Kortet avgränsas av ringen
i `--shadow-sm`, alltså samma grepp som kommunkorten. Komponenten används
bara på verksamhetssidan.

Kvar av punkt 7 är hårlinjeräkningen som helhet: startsidan, kategorisidan
och sökresultatet skiljer fortfarande sektioner med för lite linje och luft.

## 8. Filterradens rulltröskel

Commit `27318562` flyttade tröskeln från 1 px till 84 px. En pixels
överskott räckte förut för att raden skulle bli rullbar och få sina pilar,
vilket är rätt för Stockholms 53 områden och fel för de sex
verksamhetstyperna som nätt och jämnt inte får plats. Punkten är redan
rättad och står här för att mönstret ska vara sökbart: **en affordans som
bara flyttar innehållet några pixlar ska inte visas alls.**

## 9. Sidbehållaren är tio procent bredare än Boolis

Booli 980, vi 1080 (`--w-wide`). Deras listspalt är 688 och brödtext 620; vi
kör 760 och 680. Ingen av våra fyra bredder är felaktig i sig, och
`docs/19_formsystem.md` fick ner sju bredder till fyra, vilket var den stora
vinsten. Men 1080 är inte markerad som ett medvetet avsteg någonstans, och
den som en dag vill komma närmare Booli börjar där. **Kräver ägarens beslut,
rättas inte av en agent.**

## 10. Sektionsavstånd som är för små

**Mätt**, avstånd mellan h2-rubriker. Boolis minsta värde på någon sida är
**153 px**, typiskt 243 till 554. Våra sidor har **52, 75 och 90 px** (52 och
90 på kommunsidan, 75 på verksamhetssidan). Bibeln säger 32 inom en sektion
och 64 mellan sektioner, så värdena under 64 är avvikelser även mot vårt eget
system.

## 11. Radiesprawl

Booli har tre radier. Vi har sju i bruk: 12, 10, 6, 4, 2, 50 % och 999.

Radie 12 (`--r-card`) är ett taget beslut i bibeln och ska stå. Men 10
(`--r-control`), 6, 4 och 2 är fyra nivåer utöver beslutet, och 2 px radie
gör ingenting som 0 inte gör. Den som städar bör slå ihop 2, 4 och 6 till ett
värde.

---

# Där vi redan är bättre, eller där Booli inte hjälper

Skrivet så att ingen av misstag "rättar" det här.

- **Träfflistan.** `EstablishmentList.astro` gör redan Boolis grepp rakt av:
  raderna är inga kort, utan genomskinlig bakgrund, ingen ram, ingen skugga
  och en hårlinje per rad. Den ändringen är gjord och den håller.
- **Bedömningsfärgerna.** Vi har tio färgtokens för bedömningsnivåerna där
  Booli har en accent. De BÄR betydelse och kan inte skäras ner. Booli har
  inget att säga om en tjänst som återger myndighetsbeslut.
- **Brödtexten 17/26 mot deras 16/24.** Vårt värde kommer ur bibeln §14 och
  är ett taget beslut.
- **Vikt 400 och 600, aldrig 700.** Samma disciplin som deras.
- **Kartsidans h1 på 21 px.** Booli gör exakt samma sak: deras h1 på
  sökresultatsidan renderas i 14/24/400. Bägge är apphuvud, inte sidtitel.
- **Områdessidan har ingen motsvarighet hos Booli.** De har områdesfilter
  inuti sökningen, inte en egen områdessida med statistik. Vår form får
  hämtas från kommunsidan i stället, och den ska inte tvingas in i en Booli-
  mall som inte finns.
- **Rapporterna har ingen riktig motsvarighet.** `/vardera` är ett verktyg,
  inte en rapport. Vår rapportform (40/46 rubrik, 648 spalt, 12 hårlinjer) är
  närmare Boolis ARTIKEL än deras verktyg, och det är rätt ställe att hämta
  form ifrån.
- **Maskoten.** Booli har ingen. Regeln att maskoten aldrig får stå bredvid
  en bedömning av en namngiven verksamhet är vår egen och står över varje
  formfråga här.

# Ytor som ägs av andra agenter just nu

Skrivna med tal så att de kan rättas av den som står i filen.

| Yta | Fil | Avvikelse i tal |
|---|---|---|
| Sökfältet | `SiteSearch.astro` | radie 999 mot Boolis 4. Höjd och skugga rättade 2026-08-18 |
| Artikelbandet | `ArtikelBanner.astro` | rättad 2026-08-18 |
| Filterraden | `Filterrad.astro` | ingen avvikelse kvar: valen mättes till 52 px 2026-08-18, och chipsen på 32 togs bort av commit `a5dbfb47` |
| Kartans träfflista | kartvyns komponenter | 61 % av textelementen gråa, sajtens högsta. Öppen |
| Kartpuffen | `Platskarta.astro` | knappen 34 px mot träffytegolvets 44. Öppen |
| Sidhuvudet | `Header.astro` | rättad 2026-08-18, raden är 64 px |

# Vad som rättades i omgång ett (2026-08-13)

1. Heron, punkt 1.
2. `--lh-body-s` 20 till 24, punkt 3.
3. Rubrikernas radavstånd till Boolis kvot, punkt 4.

Kontrollmätt i bygget efteråt: den dominerande textgraden är 14/24 på varje
sidtyp där den var 14/20, och rubrikerna ligger nu på 32/43, 40/52, 24/32,
21/28 och 17/23, alltså Boolis kvot. Startsidans serif står kvar på 48/54.

# Vad som rättades i omgång två (2026-08-18)

1. **Punkt 7, artikelbandet.** Vit botten med hårlinje och luft i stället för
   ett vitt kort på `--brand-wash`.
2. **Punkt 2, gråskalan.** Tre textgråa blev en. `--ink-faint` lever vidare
   som ytton `--tone-quiet` och aldrig som text.
3. **Punkt 6, kontrollhöjderna, och punkt 5, sökfältets skugga.** Fyra
   höjdtokens i `tokens.css` och 44 px träffyta överallt utom i
   kartkomponenterna.

Före mätningen ommättes booli.se, se avsnittet överst: deras chips är 40 i
dag och inte 46, och deras sidhuvud är 64.

Resten står kvar i listan och tas nästa omgång.

# Vem tar vad härnäst

Punkterna ovan sorterade efter vems yta de ligger på, så att nästa omgång kan
plockas direkt utan att någon läser hela dokumentet.

**Punkterna 5, 6 och 7 är tagna 2026-08-18**, se "Vad som rättades i omgång
två" ovan. Det som stod här om artikelbandet, kontrollhöjderna och
sökfältets skugga är gjort.


**Ligger på kartans agent:**

- **Områdeskartans utsida är rättad, se docs/32.** Ägaren jämförde
  områdessidan med Booli: "på booli har dom gjort såhär med kartan, det är
  liksom mörkt runt om kring också". Uppmätt hos dem 2026-08-14, på
  `booli.se/sok/till-salu?areaIds=115349`: `maskLayer` med `fill-color`
  `#878787`, `fill-opacity` 0,6 och en maskkälla som är världen med området
  som hål. Samma konstruktion och samma tal ligger nu i `OmradeKarta.astro`.
  Det är en punkt till där Booli har rätt och vi hade fel, och den fanns inte
  i listan ovan eftersom områdessidan saknar Booli-motsvarighet och därför
  aldrig mättes mot dem.
- **Frågan "varför har vi olika kartor?" är besvarad i docs/32.** Fyra
  kartkomponenter på sammanlagt 3 159 rader kod, vad de delar, vad de
  duplicerar och vad som borde slås ihop.
- **Punkt 2, kartvyns gråa.** 61 procent av textelementen i kartvyn är gråa,
  sajtens högsta värde. Bärarna är `SPAN.k-typ.text-secondary` och
  `SPAN.k-meta`, 60 element vardera i träfflistan. Booli har ingen
  motsvarande vy, så jämförelsen får hämtas från deras sökresultat, som
  ligger på 9 procent.

**Ligger på ingen, kräver ägarens beslut:**

- **Punkt 9, sidbehållarens 1080 mot Boolis 980.**
- **Punkt 2, den tredje gråa.** `--ink-faint` bär 7 till 56 element per sida
  och ligger på 2,6:1 mot vitt. Booli klarar sig på en grå. Att gå från tre
  nivåer till två är ett systembeslut, inte en agentfix.

**Ligger löst, kan tas av vem som helst:**

- **Punkt 10, sektionsavstånden på 52, 75 och 90 px.** De bryter mot vårt
  eget system, som säger 32 inom en sektion och 64 mellan.
- **Punkt 11, radiesprawlen.** Slå ihop 2, 4 och 6 till ett värde. Radie 12
  (`--r-card`) och 999 (`--r-pill`) står kvar.
