# 26. SEO bortom hygienordet

**Datum:** 2026-08-12
**Föregångare:** `research/R3_seo_dimensionering.md`, som slog fast att `hygienbetyg`
och `restaurang hygien` ligger på noll i 262 av 262 veckor. Det här dokumentet
motsäger inte R3. Det letar reda på vart efterfrågan tog vägen i stället.

---

## 1. Slutsatsen först

R3 mätte hygienorden och fann nollor. Felet var inte mätningen utan frågan. Det
finns gott om folk som undrar precis det vi svarar på. De skriver bara aldrig
ordet hygien.

Tre ord bär efterfrågan, och alla tre är belagda nedan:

1. **Skadedjur.** Folk skriver `råttor` och `kackerlackor`, aldrig `hygien`.
   Ordet bär både pressens rubriker och Flashbacks trådtitlar, och vi har 5 322
   granskade kontrollpunkter som svarar på det.
2. **Plats med kvalitetsfilter.** `restauranger [stad] högst betyg`
   kompletteras av Google för varje stad vi har, med tio led i svansen.
   `fräscha restauranger [stad]` finns också, men bara i Stockholm, Malmö och
   Göteborg.
3. **Anmälan med ortsnamn.** `anmäla matförgiftning [stad]` kompletteras för
   Uppsala, Örebro, Linköping och Jönköping, alltså fyra av våra tolv kommuner.
   Det är det enda geografiska mönstret i hela undersökningen som träffar våra
   mindre kommuner.

Och ett fjärde som är värt mer än det låter: **ägarspåret**. `registrera
livsmedelsverksamhet [stad]` kompletteras för åtta städer. Vi har noll sidor
riktade dit och en företagsyta som redan är byggd.

Det viktigaste enskilda fyndet är negativt: **`matsnusk [stad]` ger noll
kompletteringar för samtliga tolv kommuner.** Ordet lever, men det lever fäst
vid en händelse och aldrig vid en plats. Det får konsekvenser för hur
`/[kommun]/matsnusk/` ska värderas, och de står i §4.6.

---

## 2. Metod, och vad belägget är värt

Semrush har fortfarande slut på API-enheter. Google Trends svarade 429 på varje
försök från den här maskinen, så R3:s tidsserier står kvar oemotsagda men har
inte kunnat utökas.

Huvudmetoden är i stället **Googles egen autocomplete**, hämtad direkt från
förslagsslutpunkten med `hl=sv` och `gl=se`, 500 frågor i tio svep. Metoden är
värd att förstå innan talen läses:

- Ett förslag visas för att frågan **faktiskt ställs**. Listan är byggd ur
  Googles loggar, inte ur en ordbok. Ett förslag är alltså ett positivt belägg
  för att någon skriver frasen.
- Ett uteblivet förslag är ett **svagare** belägg. Det betyder att frasen ligger
  under Googles tröskel, inte att den är noll. Behandla noll förslag som "under
  mätgolvet", precis som R3 behandlar sina nollveckor.
- Metoden ger **ingen volym**. Den ger rangordning och existens. Varje gång ett
  tal behövs i det här dokumentet kommer det från R3, från vårt eget bestånd
  eller från en namngiven källa.

Kompletterande källor: DuckDuckGos förslagsslutpunkt som oberoende kontroll,
och en genomgång av SVT, Sveriges Radio, lokalpress och Flashback för att se
vilka ord som faktiskt används i rubriker och trådtitlar.

Reddit gick inte att nå. Det är obelagt och ska göras om med webbläsartillgång.

---

## 3. Två vokabulär som aldrig möts

Genomgången av pressen och forumen gav ett tydligare svar än väntat. Det finns
två helt skilda ordförråd för samma sak, och `hygienbetyg` tillhör inget av dem.
Där ligger nollan.

| | Pressens och folkets ord | Myndighetens ord |
|---|---|---|
| Om fyndet | snusk, matsnusk, ingrodd smuts, musbajs | brister, avvikelser |
| Om djuren | kackerlackor, råttor, insekter, flugor | bekämpning av skadedjur |
| Om följden | tvingas stänga, stängde akut | verksamhetsförbud, föreläggande |
| Om besöket | slog till, avslöjade | offentlig kontroll |
| Om tjänsten | (saknas) | kollen, Smiley |

Belagda rubriker ur den vänstra kolumnen:

- "Kackerlackor och råttor. Här är matställena som stängts i Stockholm", SVT
  Nyheter Stockholm, 19 juni 2025.
- "Insekter, ingrodd smuts och råttor. Så såg matsnusket ut på Malmös
  restauranger", SVT Nyheter Skåne, 25 februari 2020.
- "Matsnusk på restauranger i Karlstad", SVT Nyheter Värmland, 21 juli 2014.
- "Musbajs upptäckt på restaurang. Åre kommun förbjuder livsmedelshantering",
  SVT Nyheter Jämtland.
- "Inspektörer slog till mot snuskig restaurang", Sveriges Radio P4 Skaraborg,
  10 december 2024.

Ordningen är densamma i varje rubrik: **fyndet först, följden sedan.** Djuret
före stängningen. Det är en konkret skrivregel att ta med sig till våra egna
rubriker.

Ingen kommun kallar det matsnusk om sig själv. Det ordet är pressens.
Konsumentordet som faktiskt är i bruk är i stället `kollen`: Stockholms och
Uppsalas app heter båda Livsmedelskollen. Enköping kallar sin dekal `Smiley`,
liksom Alingsås och Sjöbo. Livsmedelsverket har inget konsumentord alls, utan
skriver "offentlig kontroll" och "det här visade kontrollen".

Flashbacks trådtitlar följer pressens ordval, eftersom de flesta trådar startar
med en tidningslänk. Det som ändå är folkets eget är frågan som ställs i tråden:
**vilken restaurang var det?** Det är den frågan sajten är byggd för att svara
på, och det är en bättre positionering än något hygienord.

---

## 4. Spåren, ett i taget

### 4.1 Platsspåret. Starkast, och nästan obrukat

`restauranger [stad]` var redan i R3 den näst största termen i hela
undersökningen, uppskattat till omkring 8 600 sökningar i månaden bara för
Stockholm. Det nya är vad folk lägger till efter ortsnamnet.

`restauranger [stad] högst betyg` kompletteras för **varje stad som prövades**,
och med full svans. För Örebro: `öppet nu`, `centrum`, `italiensk`, `mysig`,
`indisk`, `asiatisk`, `kött`, `nya`, `bra`. Samma mönster i Linköping,
Jönköping, Karlstad, Uppsala, Malmö, Göteborg och Stockholm.

Läs det rätt. `högst betyg` betyder nästan säkert Googles eget stjärnbetyg, och
det ska vi aldrig låtsas ha. Men mönstret säger något viktigare än ordet: den
sida folk letar efter är **en lista över matställen på en ort, ordnad efter ett
kvalitetsmått och filtrerbar på typ och stadsdel.** Det är exakt formen på
`/[kommun]/`, `/[kommun]/kategori/` och `/[kommun]/omrade/`. Sidorna finns. Det
som fattas är ordningen och rubriken.

`fräscha restauranger [stad]` finns också, och det är ägarens uppslag. Utfallet,
stad för stad:

| Fras | Kompletteras |
|---|---|
| `fräscha restauranger stockholm` | ja |
| `fräscha restauranger malmö` | ja |
| `fräsch restaurang göteborg` | ja |
| `fräscha restauranger uppsala` | nej |
| `fräscha restauranger örebro` | nej |
| `fräscha restauranger linköping` | nej |
| `fräscha restauranger jönköping` | nej |
| `fräscha restauranger karlstad` | nej |

Uppslaget håller alltså, men bara i de tre största städerna, och av dem har vi
en. Det är en ärlig begränsning och den avgör sidtypsfrågan i §5.

En andra varning om ordet självt. Söker man bara på `fräsch`, `fräscha` eller
`fräscht` handlar samtliga tio förslag om mat och recept: `fräsch efterrätt`,
`fräsch sallad`, `fräsch sommarmat`, `fräscht tilltugg`. Ordets huvudbetydelse i
svensk sökning är **lätt och syrlig mat**, inte rena lokaler. Fräsch fungerar
bara med `restaurang` eller `restauranger` bredvid sig, aldrig ensamt, och
aldrig som varumärkesord.

Prövade och tomma: `rena restauranger`, `bra hygien restaurang`, `säker
restaurang`, `fräscht ställe`, `kolla restaurang innan`, `smutsigt kök
restaurang`. Inga kompletteringar alls.

**Dom: bygg här.** Se §5 för sidtypen.

### 4.2 Skadedjursspåret. Starkt, helt obrukat, och vi äger svaret

Ingen av våra tretton artiklar nämner skadedjur. Det är den tydligaste luckan i
hela beståndet.

Belägg för efterfrågan:

- `kackerlackor restaurang`, `kackerlackor restaurang södertälje`, `kackerlackor
  restaurang vasastan`, `kackerlacka restaurang stockholm`, `kackerlackor
  vasastan flashback`, `kackerlackor malmö flashback`.
- `råttor restaurang luleå`, `råttor restaurang luleå flashback`, `råtta
  restaurang borås`, `råttor i restaurang`, `anmäla råttor på restaurang`.
- `råttor mcdonalds`, `råttor burger king`, `råttor på max`, `råttor max
  karlskrona`, `råttor gröna lund`, `råttor willys botkyrka`. Kedjenamn plus
  djur, alltså entitetsspåret som faktiskt fungerar.
- `skadedjur restaurang`, `flugor i restaurangkök`, `möss i restaurang`, `vad
  ska man göra om man ser en råtta`.

Och rubrikbelägget: SVT Nyheter Stockholms granskning från juni 2025 heter
ordagrant "Kackerlackor och råttor. Här är matställena som stängts i Stockholm".
Det är vår data, i deras ord, på deras plattform.

Vad vi har att svara med, räknat ur beståndet i augusti 2026: rapporteringspunkt
J06, bekämpning av skadedjur, är granskad 5 320 gånger i Linköping och Örebro,
som är de två kommuner som redovisar samtliga kontrollpunkter och inte bara
bristerna. Utfallet är kontraintuitivt på ett sätt som gör en bra artikel, och
det står i §7.1.

**Dom: skriv. Gjort.**

### 4.3 Handlingsspåret. Starkt, men till hälften redan besvarat

`anmäla restaurang` har den djupaste svansen i hela undersökningen, och den
avslöjar samma sak om och om igen: **folk vet inte vem som tar emot anmälan.**

- `anmäla restaurang till hälsovårdsnämnden`. Hälsovårdsnämnderna avvecklades
  1991. Frasen kompletteras ändå, och den kompletteras hos **både Google och
  DuckDuckGo**, vilket är det enda oberoende dubbelbelägget i hela materialet.
- `anmäla restaurang till livsmedelsverket`. Fel myndighet.
- `anmäla restaurang till miljö och hälsa`. Rätt, men osäkert formulerat.
- Vidare: `anmäla restaurang hygien`, `anmäla restaurang hygien göteborg`,
  `anmäla restaurang matförgiftning`, `anmäla restaurang magsjuka`, `anmäla
  smutsig restaurang`, `anmäla dålig mat`, `kan man anmäla en restaurang`.
- `vem kontrollerar restauranger` och `vem kontrollerar hygien på restauranger`
  kompletteras båda.

Det starkaste geografiska fyndet i hela dokumentet ligger här: **`anmäla
matförgiftning [stad]` kompletteras för Uppsala, Örebro, Linköping, Jönköping,
Malmö, Göteborg, Stockholm och Gävle.** Fyra av våra tolv kommuner, och de fyra
är inte storstäder. Inget annat mönster når så långt ner i kommunlistan.

Här kommer dock en ärlig invändning mot att skriva mer. Myndighetskartan står
redan i fyra artiklar:

- `sa-laser-du-en-hygienkontroll.mdx` rad 18, hela ansvarsfördelningen inklusive
  Länsstyrelsen och slakterierna.
- `matforgiftning-fran-restaurang.mdx` rad 54, under egen rubrik.
- `vad-hander-nar-du-anmaler-en-restaurang.mdx` rad 17, i fet stil.
- `vad-hander-efter-en-anmarkning.mdx` rad 98.

En femte artikel om vem som kontrollerar restauranger vore kannibalisering.
Svaret finns, det är rubrikerna som inte matchar frågan.

**Dom: skriv ingen ny artikel. Ändra rubriker och lägg till ortsledet.** Konkret
i §6.

### 4.4 Symtomspåret. Redan byggt, låt det vara

`matförgiftning` är enligt R3 den enda termen med kontinuerlig volym, omkring
5 300 i månaden. Svansen är djup och delvis obrukad: `magsjuk efter
restaurangbesök`, `magsjuk efter sushi`, `magsjuk efter räkor`, `magsjuk efter
ostron`, `magsjuk efter råbiff`, `magsjuk efter julbord`, `matförgiftning eller
magsjuka`, `matförgiftning inkubationstid`.

Tre artiklar täcker klustret redan: `matforgiftning-fran-restaurang`,
`inkubationstid-matforgiftning` och `kylkedjan-brister-oftast-pa-sommaren`.
Uppdraget var att bygga vidare i stället för att göra om, och den ärliga
bedömningen är att den fjärde artikeln i samma kluster ger mindre än den första
artikeln i ett tomt kluster.

Ett undantag är värt att notera för framtiden: `matförgiftning eller magsjuka`
är en avgränsningsfråga som ingen av de tre svarar rakt på.

**Dom: rör inte nu. En artikel om skillnaden mellan matförgiftning och magsjuka
är nästa i tur, om klustret ska byggas ut.**

### 4.5 Ägarspåret. Helt obrukat, och en annan målgrupp

Det här är den största luckan efter platsspåret, och den enda som vänder sig åt
ett annat håll.

- **`registrera livsmedelsverksamhet [stad]` kompletteras för Stockholm,
  Göteborg, Malmö, Uppsala, Linköping, Örebro, Helsingborg och Norrköping.** Tre
  av våra kommuner, och ett geografiskt mönster lika starkt som anmälningsspåret.
- `egenkontroll restaurang mall gratis`, `egenkontroll restaurang mall`,
  `egenkontrollprogram restaurang`, `egenkontroll på restaurang lag sverige`.
  Notera att `egenkontrollprogram` ensamt domineras av el, tobak och folköl.
  Ordet måste ha `livsmedel` eller `restaurang` bredvid sig för att bli vårt.
- `haccp`, `haccp utbildning`, `haccp betyder`, `haccp livsmedelsverket`,
  `haccp principer`, `haccp utbildning gratis`.
- `livsmedelshygien utbildning`, `livsmedelshygien utbildning gratis`.
- `riskklassning livsmedel`, `riskklassning livsmedelsanläggning`.
- `efterhandsdebitering livsmedelskontroll`.
- `hur går en livsmedelskontroll till`. Kompletteras hos både Google och
  DuckDuckGo.
- `starta restaurang` med svansen `checklista`, `tillstånd`, `kostnad`, `budget`.

Målgruppen är restaurangägaren, inte gästen. Vi har en företagsyta på
`/konto/verksamhet/` och ingen enda sida som en ägare skulle kunna hitta genom
en sökning.

Två saker skiljer spåret från de andra och gör det svårare, inte lättare:

1. **Konkurrensen är verklig.** Kommunernas egna sidor och Livsmedelsverket äger
   registrerings- och regelfrågorna, och de har rätt att göra det.
2. **Etikregeln i doc 21 §1 gäller.** Sälj aldrig förbättringstjänster till
   ställen vi gett dåligt betyg. En ägartext får informera, aldrig erbjuda att
   putsa ett omdöme.

Det vi ändå har och ingen annan har: **vad inspektören faktiskt anmärker på, per
kontrollpunkt, räknat på riktiga kontroller.** Livsmedelsverket beskriver
kraven. Vi kan säga vilka krav som brister och hur ofta. Det är en artikel bara
vi kan skriva, och den är skriven, se §7.3.

**Dom: skriv en artikel nu, bygg inga sidor än.** En landningssida för ägare
behöver ett beslut om företagsytans riktning som ligger utanför det här
uppdraget.

### 4.6 Incidentspåret. PR-tillgång, inte sökordstillgång

Hit hör `matsnusk`, `restaurang stängd` och skadedjur plus ortsnamn. Mönstret är
entydigt och det är viktigt att beskriva rätt.

`matsnusk` kompletteras, men bara med händelser och namn: `matsnusk gröna lund`,
`matsnusk max`, `matsnusk hässleholm`, `matsnusket i kristianstad`, `matsnusk i
jakobstad`. **Det kompletteras för ingen enda av våra tolv kommuner.** Vi prövade
alla tolv plus Malmö och Göteborg. Noll av fjorton.

`restaurang stängd` kompletteras för Stockholm, Jönköping, Östermalm, Borlänge,
Timrå, Växjö och Helsingborg, samt med `listeria` och `sepsis`. Också det ett
händelsemönster: orterna är de där något har hänt, inte de största.

Slutsatsen ändrar inte att `/[kommun]/matsnusk/` ska finnas. Den ändrar vad
sidan är. **Den kommer aldrig att rankas in på sitt eget namn.** R3 §6 sa redan
det om topplistorna och hade rätt. Sidan är en PR-tillgång och en
navigationsyta, och den ska mätas på mediegenomslag och länkar, aldrig på
organisk ingång. Att SVT bygger samma lista för hand vartannat år är hela
argumentet för att den ska finnas.

**Dom: behåll, omvärdera inte som trafikkälla, mät som PR.**

### 4.7 Jämförelsespåret. Återvändsgränd

Uppdraget bad om danska smileys och brittiska Food Hygiene Rating. Utfallet:

- `smiley danmark` kompletteras, men förslagen är `denmark emoji`, `smile
  danmark`, `denmark flag emoji`, `happy danmark`. Frasen är kapad av emoji.
- `danska smiley system`: inga förslag.
- `kontrollrapport restaurang danmark`: inga förslag.
- `hygienbetyg england`: inga förslag.
- `food hygiene rating` kompletteras rikt, men uteslutande på engelska och med
  brittisk avsikt: `check uk`, `checklist`, `search`, `sticker`, `in my area`.
  Det är britter i det globala indexet, inte svenskar.

Ingen svensk formulerar frågan som en jämförelse mellan länder. Antagandet i
uppdraget att "svenskar söker på dem" håller inte.

**Dom: skriv inte. Sparas som ett stycke i en metodiktext, aldrig som egen
sida.**

### 4.8 Entitetsspåret. Bekräftat dött i sin hygienform, levande i sin snuskform

R3 §5 visade att `nandos food hygiene rating` och `greggs food hygiene rating`
ligger under 0,1 procent av huvudtermen i Storbritannien, alltså att mönstret
`[kedja] hygien` inte finns ens på världens mognaste marknad. Ingenting i den
här undersökningen motsäger det. `hygien restaurang [stad]` gav noll
kompletteringar för samtliga åtta prövade städer.

Men kedjenamnen dyker upp så fort ordet byts: `råttor mcdonalds`, `råttor burger
king`, `råttor på max`, `matsnusk max`, `matsnusket på max`, `råttor gröna lund`,
`matsnusk gröna lund`. Det är samma entiteter, samma avsikt, andra ord.

Reservationen är att det också är ett händelsemönster. Aftonbladets
Max-granskning i februari 2025 syns i förslagen, och `matsnusk gröna lund` är en
nyhetstopp. Kedjesidorna ska alltså inte byggas om för att jaga de orden.

**Dom: rör inte kedjesidorna för det här. Notera bara att kedja plus djur är den
enda entitetsformen som lever.**

---

## 5. Sidtypsfrågan: fräscha restauranger per kommun

Frågan är ställd rakt och förtjänar ett rakt svar: ska den positiva halvan bli
en egen sidtyp, eller kan kommunsidan svara?

**Svaret är nej till en ny sidtyp, och ja till att kommunsidan svarar.** Det går
mot magkänslan i beställningen, så här är hela härledningen.

### Regeln

En ny sida byggs bara om någon skulle söka på något för att hamna där.

### Vad sökningen faktiskt är

`fräscha restauranger [stad]` kompletteras i tre städer, varav vi har en. Det är
inte noll, men det är ett tunt underlag för en sidtyp i tolv kommuner, och det
blir elva sidor byggda för en sökning som inte finns i deras städer. R3 §6
beskrev exakt samma fälla för `livsmedelskontroll [stad]`.

`restauranger [stad]` och `restauranger [stad] högst betyg` finns däremot i
varenda stad. Och den sökningen har redan en sida: `/[kommun]/`.

### Vad som redan finns

- `/[kommun]/` är listan över ortens verksamheter.
- `/[kommun]/kategori/` skär den på typ, vilket är `italiensk`, `asiatisk`,
  `kött` i svansen ovan.
- `/[kommun]/omrade/` skär den på stadsdel, vilket är `centrum`, `city`.
- `/utmarkelser/[year]/[kommun]/` är redan den positiva listan, per kommun,
  frusen i årsutgåvor.

Den positiva halvan finns alltså. Den heter bara utmärkelse och inte fräsch, och
den ligger under en adress som ingen söker på.

### Vad som faktiskt fattas

Inte en sida. Tre saker på sidor som redan finns:

1. **Ordningen.** Kommunsidan listar verksamheter. Den som skriver `restauranger
   [stad] högst betyg` vill se de bästa först. Ingen ny URL behövs för att
   sortera en lista som redan är byggd.
2. **Rubriken och beskrivningen.** `/utmarkelser/2026/stockholm/` bör bära orden
   restaurang och Stockholm i sin `<title>`, inte bara utmärkelse och årtal.
3. **En ingång i ord som folk använder.** Där gör en artikel mer nytta än en
   sida, eftersom en artikel kan förklara varför vår ordning inte är samma sak
   som stjärnbetyg. Det är den artikeln som är skriven, se §7.2.

### Undantaget

Om `fräscha restauranger stockholm` visar sig ge klick i Search Console när
artikeln legat uppe ett halvår, är Stockholm ensamt ett försvarbart fall för en
egen ingång. Bygg den då, för en kommun, på mätning. Inte tolv nu, på gissning.

---

## 6. Urvalsregeln för "de bästa"

Beställningen ställde rätt fråga: antal kontroller utan anmärkning räcker inte,
eftersom en verksamhet med en enda kontroll ser perfekt ut. Ingen ny regel
behöver uppfinnas. Det finns redan två, och skillnaden mellan dem är hela svaret.

**Bedömningen `clean`** betyder att senaste kontrollen saknade anmärkning. Den
duger inte som urval, och beståndet visar exakt varför:

| | Antal | Andel |
|---|---|---|
| Verksamheter totalt | 15 983 | |
| Med tillräckligt underlag för en bedömning | 13 579 | 85,0 % av alla |
| Bedömda utan anmärkning | 11 976 | **88,2 % av de bedömda** |

Ett urval som släpper in 88,2 procent är ingen lista över de bästa. Det är
listan. Och kvaliteten på den skulle vara sämre än talet antyder: **3 223 av de
11 976, alltså 26,9 procent, har exakt en kontroll bakom sig.** Var fjärde
plats på en fräschlista byggd på `clean` vore ett ställe kommunen tittat på en
enda gång.

**Ren historik** är den regel som redan löser det. Den kräver minst tre
kontroller inom ett treårsfönster, samtliga utan anmärkning
(`HISTORY_DEPTH = 3` i `pipeline/prikko/grading.py` och `site/src/lib/data.ts`).
Den uppfylls av 1 537 verksamheter, alltså 11,3 procent av de bedömda, och per
definition av noll verksamheter med färre än tre kontroller.

**Utmärkelsen** är den hårdare, frysta årsutgåvan: kontroller i rad utan
anmärkning, med en ribba härledd ur varje kommuns egen fördelning så att märket
träffar ungefär de tre översta procenten. Motiveringen står utförligt i
`site/src/lib/utmarkelser.ts` och ska inte skrivas om här.

**Rekommendation: ren historik är rätt ribba för en positiv lista på
kommunsidan, utmärkelsen är rätt ribba för ett märke.** Ren historik räknas om
vid varje bygge och är därför ärlig mot en verksamhet som nyss förbättrat sig.

En sak som måste stå på varje sådan lista: **ren historik är omöjlig i fyra av
våra kommuner.** I Karlstad, Lomma och Oskarshamn finns aldrig mer än en kontroll
per verksamhet i det som lämnas ut, alltså `maxHistory = 1`, och kravet på tre
kan därför aldrig uppfyllas. I Höganäs är `maxHistory` tre, men bara en enda
verksamhet i kommunen har så många kontroller i historiken. Utfallet blir noll i
alla fyra.

Det är inte ett omdöme om deras kök utan om deras utlämnande, och en lista som
inte skriver ut det ställer kommuner mot varandra utan att säga det.

---

## 7. Vad som skrevs

Tre artiklar, ur de tre spår som var både starka och obrukade. Alla följer formen
i `site/src/content/artiklar/`, med `Diagram` som ram.

### 7.1 `skadedjur-ar-den-ovanligaste-anmarkningen.mdx`

Spår 4.2. Svarar på `råttor restaurang`, `kackerlackor restaurang`, `skadedjur
restaurang`, `vad ska man göra om man ser en råtta`.

Fyndet som bär texten är att de tre talen pekar åt olika håll, vilket är precis
varför den är värd att skriva:

| | J06, skadedjur | Jämförelse |
|---|---|---|
| Andel granskningar som gav brist | **4,6 %** | lägst av åtta hygienpunkter |
| Andel av bristerna som kvarstod vid uppföljning | **9,3 %** | högst av åtta |
| Övriga brister vid samma kontroll | **1,74** | mot 0,68 när skadedjur var i ordning |

Alltså: ovanligast att få, svårast att bli av med, och kommer nästan aldrig
ensam. 195 av 247 skadedjursanmärkningar hade sällskap av minst en annan brist.

### 7.2 `sa-hittar-du-de-frascha-stallena.mdx`

Spår 4.1 och ägarens uppslag. Svarar på `fräscha restauranger stockholm` och på
avståndet mellan `högst betyg` och det vi faktiskt mäter.

Texten bär hela §6:s härledning i läsbar form: varför 88,2 procent inte är ett
urval, vad de 26,9 procenten med en enda kontroll gör med en lista, och varför
tre kontroller är ribban. Den ställer aldrig kommuner mot varandra och skriver
ut varför fyra kommuner saknar listan.

### 7.3 `det-har-anmarker-inspektoren-pa.mdx`

Spår 4.5, riktad till den som driver stället. Svarar på `hur går en
livsmedelskontroll till` och på svansen kring egenkontroll och HACCP.

Innehållet är rangordningen av kontrollpunkterna efter hur ofta de faktiskt ger
brist, räknat på 14 588 kontroller med redovisade punkter i Linköping och
Örebro. Ingen annan kan publicera den listan, eftersom den kräver att man har
både nämnare och täljare för varje punkt.

### Bilderna

De tre artiklarna saknar bild, av samma skäl som föregångarens tre: det finns
inga obrukade original i `brand/`. Motivbeskrivning och sökord är införda i
`site/src/content/artiklar/README.md` under samma rubrik som de tidigare.

---

## 8. Vad som inte ska göras

Samlat, så att nästa läsare slipper härleda om det.

1. **Bygg inte elva fräschsidor.** §5. Ett underlag i tre städer bär inte tolv
   sidtyper.
2. **Skriv inte en femte artikel om vem som kontrollerar restauranger.** §4.3.
   Svaret står redan i fyra artiklar. Ändra rubrikerna i stället.
3. **Bygg inte en jämförelsesida om danska smileys.** §4.7. Ingen svensk söker
   på det.
4. **Värdera inte om `/[kommun]/matsnusk/` som trafikkälla.** §4.6. Noll
   kompletteringar i fjorton städer. Sidan är en PR-tillgång och ska mätas som
   en.
5. **Skriv aldrig `högst betyg` i en rubrik.** Det är Googles stjärnbetyg i
   läsarens huvud, och vi har inga stjärnor. Ordet finns i det här dokumentet som
   belägg, aldrig som förlaga.
6. **Låt aldrig ordet fräsch stå ensamt.** §4.1. Utan `restaurang` bredvid sig
   betyder det sallad.

---

## 9. Nästa steg, i ordning

1. **Ortsledet i anmälningstexterna.** `anmäla matförgiftning [stad]`
   kompletteras för fyra av våra kommuner. `matforgiftning-fran-restaurang.mdx`
   länkar redan till tre kommuners anmärkningslistor. Nästa steg är att varje
   kommunsida bär en rad om vart en anmälan går i just den kommunen, med
   miljöförvaltningens namn utskrivet. Det är en rad på en sida som redan finns,
   inte en ny sida.
2. **Ordningen på kommunsidan.** §5. Låt de med ren historik ligga först, eller
   ge listan en sorteringsväxel. Ingen ny URL.
3. **Titlarna på utmärkelsesidorna.** `/utmarkelser/2026/[kommun]/` bör bära
   ortsnamnet och ordet restaurang.
4. **Mät innan Stockholm får en egen fräschsida.** §5, undantaget.
5. **Gör om Reddit-genomgången.** §2. Obelagd och därför inte använd någonstans
   i det här dokumentet.
6. **Verifiera volymerna när Semrush har enheter.** Rangordningen mellan spåren
   bygger på förekomst i autocomplete, inte på tal. Ordningen inom §1 är den
   enskilt viktigaste slutsatsen att kontrollera.
