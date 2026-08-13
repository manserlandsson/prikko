# 29. Mönstret "alternativ till X"

**Datum:** 2026-08-13
**Föregångare:** `docs/26_seo_bortom_hygienordet.md`, vars metod används rakt av.
**Beställning:** artiklar på formen "bästa alternativet till X".
**Utfall:** mönstret bär inte i vår bransch. Inga artiklar skrevs.

---

## 1. Slutsatsen först

"Alternativ till X" är ett av de mest beprövade mönstren i SEO, och i svensk
sökning är det mycket levande. Det är bara inte levande för mat.

`alternativ till` kompletteras rikt, och svansen visar exakt vilka tre
kategorier ordet tillhör:

> chatgpt, trombyl, hemnet, bredbandskollen, ozempic, spotify, allabolag,
> betablockerare, chromecast, blocket, google, statiner, metformin, lenzetto,
> fjäril

Läkemedel, mjukvara och svenska registertjänster. Ingen restaurang, ingen
kedja, ingen mat. Det är inte en slump utan en egenskap hos ordet: man söker
alternativ till något man är **bunden** till och vill byta bort. Ingen är bunden
till en hamburgerkedja.

Tre fynd bär hela dokumentet:

1. **`alternativ till [kedja]` ger noll.** Prövat på femton kedjor ur snabbmat,
   kaffe, dagligvaror och trafikbutik. Bekräftat på både Google och DuckDuckGo.
2. **När ordet ändå dyker upp bredvid ett kedjenamn betyder det en maträtt.**
   `vegetariskt alternativ till mcdonalds` och `nyttigaste alternativet på
   mcdonalds` handlar om vad man beställer på McDonald's, inte om var man äter i
   stället. Det är samma fälla som `fräsch` i doc 26 §4.1, där ordet utan
   `restaurang` bredvid sig betyder sallad.
3. **`alternativ till [tjänst]` ger också noll för vår bransch**, alltså
   Tripadvisor, Yelp, The Fork, Trustpilot och Google-recensioner. Mönstret
   lever däremot för svenska registertjänster: `alternativ till hemnet och
   booli`, `alternativ till hitta`, `alternativ till eniro`. Det kräver alltså
   en inarbetad tjänst som läsaren redan kan vid namn, och där är vi inte än.

Det finns ett grannmönster som är enormt levande, och det redovisas i §4. Det
bär bara inte oss heller, av ett skäl som går att belägga: den axel vi mäter på
är den enda axeln som saknas i det.

---

## 2. Metod

Identisk med doc 26 §2, så att utfallen går att lägga bredvid varandra.
Googles förslagsslutpunkt med `client=chrome`, `hl=sv` och `gl=se`, samt
DuckDuckGos slutpunkt med `kl=se-sv` som oberoende kontroll. 149 frågor hos
Google och 8 hos DuckDuckGo.

Två saker måste läsas rätt i tabellerna nedan, och den andra är ny för det här
dokumentet.

- Ett förslag är ett **positivt belägg** för att frasen faktiskt skrivs. Ett
  uteblivet förslag betyder att frasen ligger **under mätgolvet**, inte att den
  är noll.
- Slutpunkten faller tillbaka på **luddig prefixmatchning** när den exakta
  frasen saknas, och den fällan är lätt att gå i. `alternativ till max` svarar
  med `alternativ till maxxfan`, `alternativ till maizena` och `alternativ till
  mandelmjölk`. Det ser ut som en träff och är en nolla: motorn har tappat
  kedjenamnet och fyllt på med andra ord som börjar på m. Varje rad nedan är
  läst med den kontrollen, och en rad räknas som träff bara när kedjenamnet står
  kvar i förslaget.

---

## 3. Utfallet, form för form

### 3.1 `alternativ till [kedja]`

Femton kedjor ur våra 52, valda för att täcka snabbmat, kaffe, dagligvaror och
trafikbutik.

| Fras | Kompletteras | Anmärkning |
|---|---|---|
| `alternativ till mcdonalds` | nej | tomt svar, noll förslag |
| `alternativ till max` | nej | luddig prefixmatchning, maxxfan och mandelmjöl |
| `alternativ till burger king` | nej | `alternative burger king` på engelska, resten hamburgerbröd |
| `alternativ till espresso house` | nej | faller till `alternativ till nespresso` |
| `alternativ till pressbyrån` | nej | tomt svar |
| `alternativ till sibylla` | nej | tomt svar |
| `alternativ till subway` | nej | tomt svar |
| `alternativ till kfc` | nej | tomt svar |
| `alternativ till pizza hut` | nej | faller till `alternativ till pizzadeg` |
| `alternativ till o'learys` | nej | tomt svar |
| `alternativ till texas longhorn` | nej | tomt svar |
| `alternativ till waynes coffee` | nej | tomt svar |
| `alternativ till ica` | nej | tomt svar |
| `alternativ till willys` | nej | tomt svar |
| `alternativ till 7-eleven` | nej | tomt svar |

Sex av dem svarar med **noll förslag över huvud taget**, vilket är ovanligt.
Slutpunkten brukar hitta på något. Att den inte gör det är ett starkare negativt
belägg än en luddig träff.

### 3.2 De tre varianterna av samma form

Alla tre prövades på McDonald's, MAX och Espresso House.

| Form | Kompletteras |
|---|---|
| `bästa alternativet till [kedja]` | nej, samtliga tre |
| `bästa alternativ till mcdonalds` | nej |
| `istället för [kedja]` | nej, samtliga tre |
| `i stället för mcdonalds` | nej |
| `liknande [kedja]` | nej, samtliga tre |

`liknande mcdonalds` svarar `similar mcdonalds`, `mcdonalds lik`, `mcdonalds
lista`, `mcdonalds olika länder`. Motorn har tappat ordet liknande och behållit
kedjan, alltså samma tillbakafall åt andra hållet.

### 3.3 Ortsledet

Det var den halvan av beställningen som hade blivit våra sidor, och den är den
tommaste av alla.

| Fras | Kompletteras |
|---|---|
| `alternativ till mcdonalds i stockholm` | nej |
| `liknande espresso house stockholm` | nej |
| `max eller mcdonalds stockholm` | nej |
| `max eller mcdonalds uppsala` | nej |

Ingen av de geografiska formerna finns. Det är samma sak som doc 26 §4.6 fann om
`matsnusk [stad]`, alltså noll av fjorton: **ordet lever men fäster aldrig vid en
plats.** Här lever inte ens ordet.

### 3.4 `alternativ till [tjänst]`

Där hade svaret varit vi själva, och det är därför den här raden är värd mest.

| Fras | Kompletteras |
|---|---|
| `alternativ till tripadvisor` | nej, och nej även hos DuckDuckGo |
| `alternativ till yelp` | nej |
| `alternativ till the fork` och `alternativ till thefork` | nej |
| `alternativ till google recensioner` | nej |
| `alternativ till trustpilot` | nej |
| `alternativ till reco` | nej |
| `alternativ till foursquare` | nej |
| `alternativ till livsmedelskollen` | nej |
| `alternativ till hygienbetyg` | nej, faller till handsprit och mjukmedel |
| `alternativ till hemnet` | **ja**: `alternativ till hemnet och booli`, `vilka alternativ finns till hemnet` |
| `alternativ till hitta.se` | **ja**: `alternativ till hitta` |
| `alternativ till eniro` | **ja**: `eniro se alternative` |

Mönstret att läsa ut: de tre som lever är svenska registertjänster som varit
inarbetade i tjugo år. Tripadvisor faller trots att det är den största tjänsten
i restaurangfältet, för svenskar söker inte alternativ till den på svenska.
`tripadvisor alternativ` kompletteras rikt men uteslutande på engelska, alltså
britter och amerikaner i det globala indexet, precis som `food hygiene rating` i
doc 26 §4.7.

**Konsekvensen är inte att spåret är stängt för alltid.** Det är att mönstret
kräver en känd tjänst att stå emot, och att frasen den dagen skrivs av någon
annan om oss, inte av oss om någon annan.

### 3.5 Kontrollen hos DuckDuckGo

Åtta frågor mot ett oberoende index. De fem som avgör:

| Fras | Google | DuckDuckGo |
|---|---|---|
| `alternativ till mcdonalds` | noll | noll |
| `alternativ till tripadvisor` | noll | noll |
| `max eller mcdonalds` | rik svans | noll |
| `restauranger som liknar` | rik svans | noll |
| `alternativ till hemnet` | ja | ja |

Dubbelbelägget för nollan är det viktigaste i tabellen. Det enda som håller i
båda indexen är hemnetraden, alltså registertjänsten.

---

## 4. Grannmönstret som lever, och varför det inte heller bär

Det här är det som gör dokumentet värt att spara i stället för att bara notera en
nolla. Svenskar ställer frågan hela tiden. De använder bara ordet `eller`.

Belagda kompletteringar, ordagrant:

- `max eller mcdonalds nära mig`, `närmaste max eller mcdonalds`, `är max eller
  mcdonalds störst i sverige`, `finns det fler max eller mcdonalds i sverige`,
  `är max eller mcdonalds nyttigast`, `är max eller mcdonalds billigare`, `är
  max eller mcdonalds bäst`, `vad är dyrast max eller mcdonalds`
- `vad är billigast mcdonalds eller max`, `vad är bäst mcdonalds eller max`,
  `vad är nyttigast mcdonalds eller max`, `max mcdonalds eller burger king`
- `pressbyrån eller 7 eleven`, `är pressbyrån eller 7 eleven billigast`
- `espresso house eller starbucks`, `waynes coffee eller espresso house`,
  `waynes coffee vs espresso house`
- `ica eller coop billigast`, `är ica eller coop störst`, `är ica eller coop
  bättre`, `willys eller lidl billigast`, `hemköp eller ica billigast`
- `är max bättre än mcdonalds`, `varför är max bättre än mcdonalds`, `är subway
  nyttigare än mcdonalds`
- `vilken snabbmatskedja är bäst`, `största snabbmatskedjan i sverige`, `bästa
  snabbmatskedjan i sverige`

Svansen är bland de djupaste som mätts i något av de tre SEO-dokumenten. Och den
är helt entydig om vilka axlar frågan ställs på: **billigast, störst, nyttigast,
bäst, dyrast.**

Vi har data på ingen av dem.

Den axel vi har prövades separat, och den finns inte:

| Fras | Kompletteras |
|---|---|
| `är max eller mcdonalds renast` | nej, faller till billigare och bättre |
| `vilken snabbmatskedja är renast` | nej, faller till bäst och billigast |
| `renaste snabbmatskedjan` | nej, faller till snabbaste recepten |
| `är mcdonalds rent` | nej, faller till `är mcdonalds ett franchise` |
| `är mcdonalds fräscht` | nej, faller till `är mcdonalds bra` |
| `hur rent är det på mcdonalds` | nej |

Det bekräftar doc 26 §4.8 från ett nytt håll. Entitetsspåret lever, men aldrig
på hygienaxeln.

Ett undantag ska noteras just för att det inte är ett undantag: `max hygien`
kompletteras rikt och på svenska, med `max hygien skandal`, `max
hygienproblem`, `max hygienbrister`, `max hygien aftonbladet` och `max hygien
flashback`. `mcdonalds hygien` kompletteras bara på engelska och med brittiska
orter. Alltså en kedja, en händelse, Aftonbladets granskning från februari 2025.
Det är ett nyhetsmönster och inte en stående efterfrågan, och doc 26 §4.6 har
redan skrivit regeln för hur sådant ska värderas.

---

## 5. Sidtypsfrågan, besvarad med tal

Beställningen bad om ett räknat svar innan en ny rutt byggs. Här är det.

Räknat ur beståndet 2026-08-13 med ett eget skript, som läser kedjeregistret ur
`site/src/lib/kedjeregister.ts` och matchar med samma `normalise` och
`chainIdFor` som sajten, och som räknar medlemskapet ur `site/src/data/*.json`:

| | Antal |
|---|---|
| Kommuner i beståndet | 12 |
| Verksamheter totalt | 15 983 |
| Kedjor i registret | 54 |
| Kedjor som klarar tröskeln och får en sida | 52 |
| Ställen som tillhör en kedja med sida | 1 564 |

De två som faller är Grekiska Grill & Bar med fem ställen och SATS med fem, mot
`MIN_LOCATIONS = 6` i `site/src/lib/kedjor.ts`.

En sida per kedja och kommun den finns i ger **298 sidor**. Det är summan av
varje kedjas antal kommuner, inte 52 gånger 12, eftersom ingen kedja finns
överallt. ICA finns i alla tolv, Joe & The Juice och Fabrique i en enda.

298 sidor för ett sökmönster som ger noll kompletteringar i samtliga trettio
formuleringar i §3 är inte ett gränsfall. Regeln i doc 26 §5 räcker: en ny sida
byggs bara om någon skulle söka på något för att hamna där.

Och urvalet hade inte gått att fylla. Svaret på "alternativ till X i Y" skulle
enligt beställningen vara närliggande ställen med **ren historik**, alltså minst
tre kontroller inom tre år, samtliga utan anmärkning. Den regeln är omöjlig i
fyra av tolv kommuner, av utlämnandeskäl och inte av hygienskäl. Räknat på samma
bestånd:

| Kommun | Djupaste historik | Ställen med minst tre kontroller |
|---|---|---|
| Karlstad | 1 | 0 |
| Lomma | 1 | 0 |
| Oskarshamn | 1 | 0 |
| Höganäs | 3 | 1 |

Karlstad, Lomma och Oskarshamn lämnar aldrig ut mer än en kontroll per
verksamhet. Höganäs lämnar ut upp till tre, men en enda verksamhet i hela
kommunen når dit. Talen bekräftar doc 26 §6 på dagsfärskt bestånd. Varje
kedjesida i de fyra kommunerna hade alltså blivit en sida med en tom lista, och
en läsare som jämför två kommuner hade dragit slutsatsen att den ena har färre
rena kök. Den slutsatsen vore fel och sidan hade bjudit in till den.

---

## 6. Varför ingen artikel skrevs, och inte bara att ingen sida byggdes

En artikel hade kunnat skrivas utan att en rutt byggs, och frågan förtjänar ett
eget svar.

Två skäl, i ordning.

**Efterfrågan.** Trettio formuleringar prövade, noll träffar, dubbelbelagt hos
två index. En artikel som heter "alternativ till" hade skrivits mot en fras som
ingen skriver, och det är precis det doc 26 §4.7 avrådde från när uppdraget bad
om danska smileys.

**Gränsen.** Även med efterfrågan hade texten varit svår att hålla ren. Titeln
"alternativ till X" bär en underförstådd anledning att söka alternativet, och
läsaren fyller i den själv. Vi återger myndighetsbeslut och rekommenderar aldrig
bort någon. Att lägga vår kontrolldata under den rubriken hade svarat på en
fråga läsaren aldrig ställde, med ett underlag som inte handlar om det.

Det är också värt att säga rakt ut att grannmönstret i §4 inte räddar saken.
`vad är bäst mcdonalds eller max` har volym, men ett svar från oss hade varit en
rangordning av två namngivna kedjor på kontrollresultat. Det är samma sak som
`kedjor.ts` redan förbjuder på kedjesidorna, och skälet är detsamma: kommunerna
publicerar olika mycket, kedjorna ligger i olika blandningar av kommuner, och
talet hade sett jämförbart ut utan att vara det.

---

## 7. Vad som ska göras i stället

Undersökningen gav ett positivt fynd som är värt mer än beställningen, och det
pekar på ytor som redan finns.

**`högst betyg` finns även i närhetsformen.** Doc 26 §4.1 fann `restauranger
[stad] högst betyg` för varje prövad stad. Samma led kompletteras nu i formen
utan ortsnamn, och för fyra olika ord för mat:

- `restaurang nära mig högst betyg`
- `snabbmat nära mig högst betyg`
- `hamburgare nära mig högst betyg`
- `mat nära mig högst betyg`

Svansen på `restaurang nära mig` är i övrigt `öppet nu`, `billigt`, `buffe`,
`pizza`, `lunch`, `kött`, `halal`, `italiensk`. Alltså kvalitetsfilter plus
kategori plus öppettid, utan ortsnamn, från en telefon.

Det är samma efterfrågan som doc 26 §5 redan besvarade med kommunsidan, men
uttryckt i den form som faktiskt skrivs. Det stärker två punkter som redan står
i doc 26 §9 och lägger inte till en enda ny:

1. **Ordningen på kommunsidan.** Låt de med ren historik ligga först. Ingen ny
   URL, och nu med belägg för att kvalitetsledet skrivs även utan ortsnamn.
2. **Kartan är den yta närhetsformen landar på.** `nära mig` är en kartfråga
   och `/karta/` finns.

Och en varning som doc 26 §8 punkt 5 redan gav, nu med förnyat belägg: skriv
aldrig `högst betyg` i en rubrik. Det är Googles stjärnbetyg i läsarens huvud.
Frasen står här som belägg, aldrig som förlaga.

---

## 8. Vad som inte ska göras

1. **Bygg inga kedjesidor per kommun.** §5. 298 sidor, noll efterfrågan, och
   fyra kommuner där listan hade varit tom av utlämnandeskäl.
2. **Skriv ingen artikel på formen "alternativ till", "istället för" eller
   "liknande".** §3. Trettio formuleringar, noll träffar, dubbelbelagt.
3. **Svara aldrig på `vad är bäst X eller Y` med kontrolldata.** §6. Det är en
   rangordning av namngivna kedjor och den är förbjuden av samma skäl som står
   i `site/src/lib/kedjor.ts`.
4. **Jaga inte `max hygien`.** §4. En kedja, en tidningsgranskning, ett
   nyhetsmönster.
5. **Pröva inte mönstret igen utan prefixkontrollen i §2.** Utan den ser
   `alternativ till max` ut som en träff, och det är en nolla.

---

## 9. Om mönstret ska prövas om

Den dagen tjänsten är känd vid namn ändras förutsättningen i §3.4, och först då
är mönstret värt att mäta om.

`alternativ till hitta.se` och `alternativ till eniro` kompletteras i dag, och
ingen av de två svarar på hur ett kök klarade sin senaste kontroll. Skulle
`alternativ till prikko` någon gång komma upp som förslag är det inte en artikel
vi ska skriva. Det är ett kvitto på att vi blev det som andra mäts mot.
