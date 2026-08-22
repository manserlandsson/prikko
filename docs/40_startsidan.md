# 40. Startsidan

Uppmätt i webbläsaren 2026-08-21 på airbnb.se och ednia.se. Varje tal här är
läst ur `getComputedStyle` eller `getBoundingClientRect`, inte uppskattat ur en
skärmbild och inte skrivet ur minnet. Där ett tal är hämtat vid en annan
fönsterbredd står bredden intill.

Skärmbilderna ligger i `research/forlagor/` och räknas upp i §7.

---

## 1. Ingen av förlagorna har en rubrik

| | `h1` | hjälte | värdetext |
|---|---|---|---|
| airbnb.se | `1 × 1 px`, texten "Airbnbs hemsida", `font-size: 28px` | nej | nej |
| ednia.se | ingen alls | nej | nej |

Airbnbs `body` har `background-color: rgb(255, 255, 255)`, alltså ren vit.

Deras avsnittsrubriker är inte heller rubrikgrad. `h2` över kortraden mäter
**14 px / 20,02 px / vikt 400** i `rgb(34, 34, 34)`, och ligger på y = 254 vid
1512 px bredd. Tre rader mättes, alla identiska.

**Vad vi tog:** en `h1` i `.visually-hidden`, och avsnittsrubriker i
`--fs-body-s` (14/24) halvfet. Vår är halvfet och deras är 400, eftersom deras
`h2` har en större synlig rad ovanför sig som bär avsnittets namn och vår inte
har det.

---

## 2. Kategoriraden och dess ikoner

### Airbnb

Raden ligger i sidhuvudet på y = 8 till 102, alltså ett band på **94 px**, med
länkarna på y = 30 och **36 px** höga.

**Ikonerna är videor, inte bilder och inte SVG.** Varje kategori bär två
`<video>`-element med `<source>` i både `webm` och `hevc/mov`:

```
.../search-bar-icons/unified/webm/Globe_Twirl_On_180px_01.webm     opacity 1
.../search-bar-icons/unified/webm/Globe_Selected_180px_01.webm     opacity 0
```

Källan är 180 px. Ikonplatsen är **36 × 36** och innehåller två absolut
positionerade spann på 32,5 px med `transform: matrix(2, 0, 0, 2, 0, 0)`, alltså
uppskalade till 65 px. Vilo- och valt läge korsfadar mellan de två videorna.

Etiketten är **14 px / 18 px / vikt 500**. Aktiv `rgb(34, 34, 34)`, inaktiv
`rgb(108, 108, 108)`. Luft mellan ikon och etikett: 7 px.

**Markören under det aktiva valet** är ett eget `span`:

```
höjd            3 px
färg            rgb(34, 34, 34)
bredd           10 px grundbredd, transform: scaleX(6.593) → 66 px
transition      transform, height  0.3s, 0.3s
                cubic-bezier(0.2, 0, 0, 1)
```

### Ednia

Item **74 × 69 px**, ikon **24 × 24** med `viewBox="0 0 512 512"`, fylld bana
(`stroke: none`). Etikett **12 px / 16 px / vikt 600**. Aktiv `rgb(34, 34, 34)`,
inaktiv `rgb(113, 113, 113)`. Markeringen är färg plus ett svart understreck
under det valda, se `ednia-1280-kategorirad.png`.

Raden rullar på riktigt: tretton val syns och fler ligger utanför, med en rund
pilknapp och en uttoning vid högerkanten, plus en fristående "Filter"-knapp
längst till höger. Efter det första valet står en lodrät hårlinje som skiljer
hemläget från kategorierna.

Ikonens omslag bär `transition: transform, translate, scale, rotate 0.1s
cubic-bezier(0.4, 0, 0.2, 1)`, alltså en kort tryckrörelse.

**Vad vi tog:** Ednias form, alltså ikon och etikett utan ram och utan
fyllning, men i rad i stället för staplade, eftersom våra etiketter är längre
("Caféer och bagerier", "Skolor och omsorg") och staplat hade gett en dubbelt så
hög rad. Understrecket är Airbnbs rörelse i vår blå och 2 px, samma regel som
`Filterrad.astro` och `Kategorival.astro` redan följer.

**På telefon vänder Airbnb själva raden.** Vid 390 px ligger ikonen till
VÄNSTER om etiketten i ett piller med kant, inte över den, se
`airbnb-390-topp.png`. Vår vågräta form är alltså deras egen mobilform, inte en
avvikelse från förlagan.

**Vad vi inte tog:** videorna. Fyra videor à 180 px för en rad med sex val är
inte ett formval utan en budget, och våra ikoner finns redan ritade i
`Kategoriikon.astro` på 24-rutnätet med 1,6 px streck.

---

## 3. Sökfältet, före och efter rullning

Uppmätt vid 1512 px.

| | utfällt | ihopfällt |
|---|---|---|
| bredd × höjd | 850 × 66 | 458 × 46 |
| radie | 100 px | 40 px |
| fyllning | `rgb(255, 255, 255)` över `rgb(235, 235, 235)` | `rgb(255, 255, 255)` |
| skugga | `0 0 0 1px rgba(0,0,0,.02), 0 8px 24px rgba(0,0,0,.10)` | `0 1px 2px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.05)` |

850 px är ett fast tak: fältet mäter 850 både vid 1280 och vid 1512.

**Övergången.** Hela sidhuvudsblocket, 1512 × 96, bär:

```
transition-property         transform
transition-duration         0.451754s
transition-timing-function  linear(0 0%, 0.185572 10%, 0.465306 20%,
                                   0.682334 30%, 0.822325 40%, 0.904974 50%,
                                   0.951289 60%, 0.976364 70%, 0.989612 80%,
                                   0.996485 90%, 1 100%)
```

Alltså **452 ms** med en fjäder samplad i elva steg. Kategoriraden translateras
från y = 30 till y = −51 och tonas samtidigt ut med `opacity 0.175s
cubic-bezier(0, 0, 1, 1)`, alltså linjärt. Den kompakta pillrets skugga byter
med `box-shadow 0.175s cubic-bezier(0.2, 0, 0, 1)`, och dess text med
`opacity 0.15s` linjärt.

Sidhuvudet är `position: sticky; top: 0; z-index: 100` och står kvar hela vägen
ned.

**Kurvan `cubic-bezier(0.2, 0, 0, 1)` är Airbnbs genomgående.** Den ligger på
varje knapp de har:

```
box-shadow 0.2s, transform 0.25s, background-color 0.3s,
border-color 0.3s, color 0.3s     alla cubic-bezier(0.2, 0, 0, 1)
```

Hamburgerknappen: 40 × 40, `border-radius: 50%`, `rgb(242, 242, 242)`,
`transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1)`.

**Vad vi tog:** kurvan, på understrecket i filterraden. Inte ihopfällningen.
Vårt sökfält är ETT fält på 44 px i en rad på 64, inte ett trepartsformulär på
850 × 66, och det finns ingenting att fälla ihop.

---

## 4. Korten

### Airbnb

Kortbild **182 × 173 px** vid 1512, alltså kvoten **1,053**. `object-fit:
cover`, ingen radie på bilden själv (den sitter i ett omslag med radie).
Korttitel och metatext **14 px / 18 px / vikt 500** i `rgb(34, 34, 34)`.

**Kortet har ingen hovringseffekt alls.** Mätt genom att hovra och sedan gå
igenom varje ättling till kortets länk: samtliga svarade
`transition-duration: 0s`, `transform: none`, `box-shadow: none`, och bilden
hade ingen `transition`. Ingen skugga, inget lyft, ingen skalning, inget
understreck.

Det är värt att skriva ned tydligt, eftersom "kortet lyfter och skuggar på
hovring" är det som varje genererad sida gör och som vi trodde var förlagans
grepp.

### Karusellen

```
overflow-x            scroll
scroll-snap-type      inline mandatory
gap                   12px
clientWidth           1352   (vid 1512 px fönster)
scrollWidth           1739
barn                  9
```

1352 − 6 × 12 = 1280, delat på 7 ger 182,86, alltså exakt kortbredden. Sju kort
i bredd, nio renderade.

Pilknapparna: **28 × 28**, `border-radius: 50%`, `rgb(242, 242, 242)`, ingen
ram, ingen skugga, `transition: transform 0.25s`. Släckt läge sätter
`disabled` och en ljusare ikon.

**Vad vi tog:** ingenting av karusellen. Ett rutnät i stället, av samma skäl som
`Kategorival.astro` redan skrivit ned: en rullrad som inte rullar är sämre än en
rad som bryter. Vårt kort bär ett namn som ska läsas, inte ett fotografi som tål
att vara litet, och fyra i bredd ger 250 px per kort i `--w-wide`.

**Vad vi också tog:** hovringen, alltså nästan ingen. Bara namnet stryks under.

---

## 5. Menyn

Airbnbs hamburgerpanel, utfälld: vit yta, radie omkring 12, tydlig skugga,
hårlinjer mellan grupperna. **Bara en rad bär en ikon**, "Hjälpcenter" med ett
frågetecken i cirkel. "Bli en värd" bär en liten illustration till höger. De
övriga fem raderna är ren text.

Det är alltså inte "ikoner per rad" utan en ikon plus en illustration i en
panel med sju rader.

---

## 6. Vad sidan blev, och vilka tal som avgjorde

Avsnittet skrevs om 2026-08-21 efter ägarens dom över första försöket. Tre
saker underkändes, och alla tre hade fel i den här filen som grund. De gamla
slutsatserna står kvar i kursiv, eftersom en fil som bara bär det slutgiltiga
svaret inte hindrar någon från att gå tillbaka samma väg.

### Fotot på kortet

*Gammal slutsats: inget verksamhetskort bär ett foto, eftersom 187 av de 210
bilderna bär en licens som kräver att fotografen namnges där bilden visas, och
ett kort på 250 px inte rymmer "Foto: Balazs Szanto, 2013, CC BY-SA 2.0".*

Ägaren: "vi kör bilder på dom som finns ... bildens attribution visas ju när
man väl klickar in, vilket var deras krav."

Han har rätt, och licenstexten säger det. CC BY-SA 4.0 §3(a)(2): villkoren i
3(a)(1) får uppfyllas "in any reasonable manner based on the medium, means, and
context", och stycket nämner uttryckligen att det kan vara rimligt att uppfylla
dem "by providing a URI or hyperlink to a resource that includes the required
information". 3.0 §4(c) och 2.0 §4(b) har samma öppning.

Resursen finns redan: verksamhetssidan, där `Commonsbild.astro` skriver ut
fotograf, licens med länk och ändringsangivelsen "nedskalad". Två villkor
följer, och båda är uppfyllda: **hela kortet är länken dit**, och bildtexten
får aldrig försvinna från verksamhetssidan.

Fördelningen över de 210, mätt 2026-08-21:

| licens | antal |
|---|---|
| CC BY-SA 3.0 | 104 |
| CC BY-SA 4.0 | 63 |
| public domain | 20 |
| CC BY 3.0 | 7 |
| CC BY-SA 2.0 | 6 |
| övriga fem koder | 10 |

### Kort utan foto: bandet har en andra form

1,3 procent har en bild, så bandet måste ha en andra form, och ägaren har
pekat ut risken: en tom ruta läses som ett foto som inte laddat.

Rutan bär därför en av tre lugna toner och en ikon i 64 px med 16 procents
opacitet. Ingen av tonerna ligger nära en bedömningsfärg; grönt är uteslutet i
synnerhet, eftersom en grön platta bakom ett märke som också kan vara grönt
hade gjort ytan till en andra bedömning.

```
ton-blast   #EDF4FC → #E2ECF8      ton-sand   #F7F2E9 → #EFE7D9
ton-dis     #F2F1F6 → #E9E8F0
```

**Ikonen har två nivåer, och den andra är ett krav och inte en reservutgång.**
12 120 av 16 047 har ingen OSM-träff och alltså ingen matkategori. Ritade de
alla `alla`-ikonen blev raden "Senast kontrollerade" åtta identiska rutor med
samma staplade lager i, vilket är precis den platshållarkänsla bandet finns
till för att undvika. Toppkategorin finns på 15 961 av 16 047, och dess fem
former är redan ritade: bestick, kopp, kasse, byggnad, låda.

### Kategoriraden: tjugo, inte fem

*Gammal slutsats: sex val, alltså hemläget plus de fem toppkategorierna.*

Ägaren: "vi måste bygga egna kategorier själva, för vi har för få nu, så det
blir liksom en dålig skroll och restauranger säger ingenting."

Han har rätt i båda leden. Sex val ger en rad som inte går att rulla, och
"Restauranger" är 8 000 rader, alltså ingen valmöjlighet alls.

Tabellen ligger i `lib/matkategori.ts` och bygger på tre OSM-taggar ur samma
hopparning som redan bär öppettider och kontaktuppgifter. **`amenity` och
`shop` hämtades inte förrän 2026-08-21**, och det var hela skillnaden: med
bara `cuisine` saknade café, snabbmat, bageri, bar och livsmedelsbutik
kategori, alltså de fem vanligaste ställena i landet.

| tagg | verksamheter |
|---|---|
| `cuisine` | 1 674 |
| `amenity` | 3 005 |
| `shop` | 962 |
| minst en | 3 927 |

Antal per kategori, mätt över de 3 927:

```
livsmedel 625   snabbmat 549   cafe-fik 484   pizza 311   asiatiskt 236
bar 221         sushi 172      burgare 160    italienskt 136   kiosk 135
bageri 117      kebab 91       medelhav 87    sallad 77    thai 76
indiskt 72      konditori 63   grill 61       mellanostern 48   glass 31
```

En kategori under 30 tas inte med, och en som inte fyller fyra rutor ritas
inte i raden: fyra kort under en flik som utlovar en hel sorts mat läser som
ett fel.

**Ingen språkmodell och ingen strängmatchning på namn.** Det var det andra
alternativet ägaren nämnde, och det duger inte: en gissning ur namnet är
osynlig när den är fel. "Kina Palatset" kan vara en thairestaurang och
"Bagarstugan" en pub. OSM-taggen är någons faktiska iakttagelse på plats, den
bär licens och den går att rätta vid källan.

**Ordningen inom en verksamhets kategorier är efter SKÄRPA, inte efter
tabellens storleksordning.** Ett `cuisine` säger vad stället lagar, ett
`amenity` bara vad det är. Pizzeria Peppar bär `cuisine=pizza` och
`amenity=fast_food`; med tabellordningen vann Snabbmat, och kortet fick en
pommesstrut medan man stod på fliken Pizza. Tre av åtta kort under Pizza gjorde
det innan rättningen.

### En pool, inte tjugoen listor

Filtret kör `:has()` på radioknappar, alltså utan skript och utan sidladdning.
Priset är att allt som kan visas måste stå i markupen, och tjugoen grupper à
tolv kort vore 252.

Varje verksamhet renderas därför EN gång och bär sina grupper i `data-kat`. Ett
ställe som är både Pizza och Italienskt står i markupen en gång och syns under
båda. Unionen mätte **154 kort** vid bygget 2026-08-21.

Faller `:has()` bort visas hemgruppen, vilket är sidans grundläge ändå.

En kategori kan inte länka någonstans i stället: kategorisidorna finns per
kommun och det finns ingen nationell. Tjugo nya nationella sidor för en
filterrad är precis det bibeln förbjuder, och filtaket ligger på 19 500.

### Hemgruppen heter "Kända ställen" och inte "Populära"

Ägaren föreslog "populära". Ordet går inte att använda: vi mäter ingen
popularitet, har inga besöksdata och ingen betygsvolym, och en rubrik som
påstår något vi inte vet är samma fel som en rangordning fast i mjukare form.

Det de tolv faktiskt delar är att någon lagt ett fotografi av dem på Wikimedia
Commons och knutit det till ett Wikidata-objekt, vilket kräver att stället är
omskrivet någonstans. "Kända ställen" beskriver alltså urvalet och är inte en
komplimang till verksamheterna.

Tre grindar, alla tre räknade:

| grind | kvar |
|---|---|
| bär en bild med känd licens | 210 |
| konsumentvänd, alltså inte skolkök | **127** |
| av dem, med en OSM-tagg som säger vad de ÄR | 13 |

81 av de 210 bilderna sitter på ett skolkök, eftersom skolbyggnader är flitigt
fotograferade på Commons. Utan den grinden blev raden Torpaskolan, Nyeds Skola
och Katedralskolan, alltså sex av tolv kort på en matsajts förstasida. De 13
med OSM-tagg ställs främst, men elva av dem ligger i Stockholm och kan inte
bära raden ensamma; taket per kommun håller dem på tre.

### Senast kontrollerade, och taket på två per kommun

Av de 60 senast kontrollerade verksamheterna i landet ligger

```
stockholm 42   uppsala 9   jonkoping 6   oskarshamn 2   hoganas 1
```

alltså 70 procent i en kommun. Det följer av att Stockholm är 8 520 av 16 047
verksamheter och publicerar oftast. Taket sprider korten över minst sex
kommuner.

**Raden är kronologisk och går inte att vända.** Det är villkoret som gör den
tillåten enligt regeln om att en namngiven verksamhet aldrig får framställas som
något att undvika: det finns ingen sorteringskontroll, ingen "sämst först", och
kommunerna ställs aldrig mot varandra på kontrollresultat. Ett datum rangordnar
ingenting.

Raden väljer inte bort dåliga bedömningar heller. Beståndet är 11 966 rena,
1 219 med brister, 373 med brister som kvarstår och 2 489 utan bedömning, och en
"senast kontrollerade" som tyst strök de dåliga vore en annan lista med samma
namn.

### Bedömningsmärket får stå på kortet

`docs/24_maskotprogram.md` §2 förbjuder **maskoten** bredvid en bedömning av en
namngiven verksamhet, och samma stycke pekar ut bedömningsmärket som det som ska
stå där i stället: "Där står bedömningsmärket, som är ett neutralt tecken och
inte en karaktär." Tabellen sätter märkets plats till "Listor, kartnålar,
sökträffar, verksamhetssidan" och antalet per sida till "Tusentals".

På kortet sitter det i en **rund vit bricka på 44 px nedsänkt i bandets nedre
vänstra hörn**, alltså exakt där Ednia sätter lärosätets sigill. Plattan är
inte dekor: utan den är ett märke i 30 px inte läsbart mot ett fotografi.

Kortet använder `FaceRef` och inte `FaceMark`: 162 märken på sidan ritas som
`<use>` mot fyra symboler i sidans sprite. Ingen rörelseflagga sätts.

### Ihopfällningen, som förra försöket mätte men aldrig byggde

Ägaren: "du gjorde ju inte animationen som airbnb har, det ser seriöst sämst
ut." Måtten i §3 var uppmätta och nedskrivna, och sedan lämnade filen dem med
raden "Vad vi tog: kurvan ... Inte ihopfällningen."

Den ligger nu i `Header.astro` med Airbnbs egen fjäder, samplad i elva steg.

| | utfällt | ihopfällt |
|---|---|---|
| Prikko, uppmätt | 680 × 56 vid `top: 88` | 380 × 44 vid `top: 10` |
| Airbnb, uppmätt | 850 × 66 | 458 × 46 |

**Höjden animeras aldrig.** Att låta sidhuvudet krympa från 236 till 64 px hade
varit den uppenbara lösningen och den är fel: 172 px omflödning per bildruta i
452 ms, på en sida med 162 kort. Docken är i stället `position: absolute` i ett
sidhuvud som alltid är 64 px högt, och det stora läget hänger ut nedanför över
sidans egna 96 px tomrum (`.storsok`). Ihopfällningen rör därmed bara `top`,
`width` och `height` på ETT element, och sidan under står helt stilla.

Läget styrs av en **IntersectionObserver på en vaktpost** och inte av en
rullhanterare. En `scroll`-hanterare körs vid varje rullsteg, på en sida med
154 kort, för att svara på en fråga som ändrar svar två gånger per besök.

Vaktposten är en pixel stor och ligger absolut på y = 24 i dokumentet. Ingen
hysteres behövs: gummibandet på iOS drar scrollY under noll, vilket gör
vaktposten mer synlig och alltså aldrig kan vända läget av misstag. Den första
versionen lyssnade på `scroll` och behövde två trösklar, 24 ned och 8 upp, av
just det skälet.

**Mät aldrig det här i en dold flik.** En observatör körs när sidan ritas, och
en bakgrundsflik ritas aldrig; den svarar då noll gånger och slutsatsen blir
att ihopfällningen är trasig. Det inträffade under arbetet 2026-08-21, och
samma fälla står redan nedskriven för kartans attributionskontroll.

`.storsok` är 96 px och inte 144. Vid 144 började kategoriraden på 208, och
mellan fältets underkant och raden stod 64 px vitt intet. Ednias första kort
börjar 240 px ned och Airbnbs 297; vårt låg på 290 med ett hål i mitten.

### Tredje uppsättningen kategoriikoner är borta

`index.astro` bar en egen `COLUMN_ICONS` på 20 × 20 med 1,5 px streck, alltså
sajtens tredje uppsättning kategoriikoner. Den är struken. `Matikon.astro` är
inte en fjärde: den ritar tjugo motiv som inte fanns, på samma 24-rutnät med
samma 1,6 px streck som de två som finns.

---

## 8. Omgång tre, 2026-08-22

Ägaren gick igenom omgång två och tog upp åtta saker. Alla mått nedan är
uppmätta samma dag, i webbläsaren, på ednia.se respektive vår egen sida.

### Sidans bredd

| | vid 1280 px fönster | vid 1680 px fönster |
|---|---|---|
| ednia.se | 1184 innehåll, 48 marginal | 1584 innehåll, 48 marginal |
| Prikko, före | 1080 innehåll, 200 marginal | 1080, 300 marginal |
| Prikko, efter | **1184, 48 marginal** | 1400, tak |

Ednia har alltså **inget tak alls**: behållaren är fönstret minus 96. Deras
rutnät lägger till spalter i stället för att svälla, tre à 384 vid 1280 och
fem à 304 vid 1680, med 16 px mellan.

Bara startsidan är breddad, och det är avsiktligt. `--w-wide` styr kommunsidan,
verksamhetssidan och varje lista, och `docs/27_booli_genomgang.md` punkt 9 slår
fast att den bredden "kräver ägarens beslut, rättas inte av en agent". Regeln
gäller åt båda hållen. Startsidan är en skyltyta, och sajten har redan en bredd
för sådana: `--w-full` på 1400, som kartan använder.

**Fyra spalter, inte fem.** En femspaltsregel provades och gav kort på 224 px,
alltså smalare än de 250 vi hade FÖRE breddningen. Fyra ger 284 vid 1280 och
314 vid taket, vilket ligger inom Ednias eget spann på 304 till 384.

### Kategoriraden

| | Ednia | Prikko före | Prikko efter |
|---|---|---|---|
| radhöjd | 69 | 67 | 68 |
| ikon | 24, fylld | 22, streck | 24, streck |
| etikett | 12/16 vikt 600 | 12/16 vikt 500 | 12/16 vikt 600 |
| mellanrum | 28 | 24 | 28 |
| avdelare efter hemläget | 1 × 48 px | ingen | **1 × 48 px** |

Avdelaren är det som gör "Alla" till ett eget läge i stället för radens första
kategori. Ikonen förblir streck och inte fylld: `Kategoriikon.astro` och
`AreaIcon.astro` är streck på 1,6 px, och en fylld uppsättning i en rad hade
varit sajtens andra ikonspråk.

### Sökknappen satt inte snett, den var för stor

Uppmätt: fältet 44 px högt, knappen 44 px, alltså **noll luft över och under
men sex på höger sida**. Ögat läser det som snedhet eftersom luften finns på
ena ledden och inte på den andra.

SiteSearch sätter 44 px på knappen i sitt hero-läge, vilket stämmer i ett 56 px
fält: (56 − 44) / 2 = 6, samma som högerfyllningen. Docken krympte fältet till
44 utan att röra knappen. 34 i ett 44 px fält ger 5 runt om. Airbnbs kompakta
piller är 46 högt med en 32 px knapp, alltså samma princip.

### Sökfältet låg över menyn

Menypanelen är `position: fixed` med `z-index: 1`, docken hade 2. Bara
startsidan visade felet, eftersom bara den har en dock som hänger ned över
sidan. Docken tonas nu bort helt medan menyn står öppen; en z-index-rättning
hade lämnat ett halvt skymt fält ovanpå en yta som tar hela mitten av skärmen.

### Märkets platta är kvadratisk, och radien är räknad

Plattan var först en vit CIRKEL på 44 px, avritad från Ednias sigill. Ägaren:
"det ser också fult ut med märket på en rund cirkel sådår." Felet var
geometriskt: deras sigill är runt, så en rund platta ger två koncentriska
cirklar, medan vårt märke är en rundad KVADRAT som då slåss med cirkeln om
samma hörn.

Plattan togs då bort helt, och ägaren svarade: "du kan ju ha märket med en vit
bakgrund." Den behövdes: mot en ljus himmel eller en vit fasad tappar ett
ljusgrönt märke sin kontur.

Radien följer märkets egen. `FACE_RAM_RADIE` är 17 av 100, alltså 17 procent av
sidan. Märket är 32 px och har därmed 5,4 px radie. Plattan är 42 px, alltså
5 px fyllning, och för parallella kurvor måste dess radie vara 5,4 + 5 = 10,4.
`--r-control` är 10.

| | |
|---|---|
| platta | 42 × 42, radie 10, vit |
| märke | 32, radie 5,4 |
| ring och skugga | `0 0 0 1px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.16)` |

### Menyns ikoner

Airbnbs panel har sju rader och EN ikon, se §5. Regeln blev: en ikon markerar en
rad som GÖR något, inte en som berättar något. Metodik, Källor, Om Prikko och
Webbkarta står som text; Hjälp, Kontakt och Logga in bär ikon på 18 px. De
ligger i skilda grupper, eftersom en lista där somliga rader har ikon får två
vänsterkanter och läser som att ikoner saknas.

### Kategorierna: kommunernas egna typer

Den största ändringen, och den kom ur ägarens fråga "har du lagt in alla
restauranger i olika filter, för open street map fanns ju ej för alla".

Svaret var nej. OSM täckte 3 927 av 16 047. Kommunernas EGNA typvärden täcker
15 961, och flera av dem är otvetydiga klassningar av lokalen, inte gissningar
ur namnet:

```
Café 1 429 (6 kommuner)   Snabbmatsrestaurang 495   Pizzeria 203 (5 kommuner)
Bageri 203 (5 kommuner)   Kiosk 75                  Glass 24
```

Utfallet:

| kategori | före | efter |
|---|---:|---:|
| Café | 484 | **1 710** |
| Livsmedel | 625 | 749 |
| Pizza | 311 | 455 |
| Bageri | 117 | 305 |
| Kiosk | 135 | 195 |
| Konditori | 63 | 102 |
| Snabbmat | 549 | **429** |

Täckningen gick från 3 927 till 4 824, alltså 30,1 procent. **11 223
verksamheter har fortfarande ingen matkategori och syns bara under "Alla".**
Raden är ett urval och inte en fullständig lista.

Bara otvetydiga ord är med. `categories.ts` §3 varnar för att samma ord betyder
olika saker i olika kommuner, `Mottagningskök` är skolmat i Jönköping och
restaurangservering i Linköping. Varje ord i tabellen är kontrollerat per
kommun.

### Snabbmat är en restpost

Ägaren: "snabbmat, hur kan det va en egen kategori om vi har pizza osv?"

Tabellen blandade två axlar. Pizza säger VAD man äter, Snabbmat säger HUR det
serveras, och en pizzeria är nästan alltid `amenity=fast_food` OCH
`cuisine=pizza`. Ett ställe faller nu ur Snabbmat så fort någon källa säger vad
det faktiskt lagar. Café, Bar och pub, Livsmedel och Kiosk står utanför regeln:
de beskriver också ett ställe och inte en maträtt, så de kan inte krocka på
samma sätt.

### Kända ställen i Stockholm

Rubriken namnger staden och staden väljs ur datan. Tre grindar, se
`index.astro`: konsumentvänd och inte skola, måste bära en matkategori, och
fotot får vara högst tjugo år gammalt. Den sista tog bort Wirströms Pub från
1959 och Blå Porten från 1912 till 1920, båda svartvita, båda kända ställen och
usla fotografier av hur det ser ut i dag.

Kommunkorten är borta, på ägarens beslut.

---

## 9. Omgång fyra, 2026-08-22 eftermiddag

### Söket i två delar

Ägaren: "vad fyller sökbarens animationen för funktion nu? det ska ju vara som
airbnb att söket blir mer utevecklat eller?"

Han hade rätt. Fältet blev bara STÖRRE, och storlek är ingen funktion. Airbnbs
utfällda läge är ett trepartsformulär, Var / När / Vem.

Vårt utfällda läge är nu **Vad** och **Var** i ett piller med en hårlinje
emellan. Ihopfällt försvinner Var-delen. Sidan frågar alltså mer i det utfällda
läget, vilket är det som gör rörelsen till en funktion.

Två delar och inte tre: något "När" finns inte att fråga om. Vi har öppettider
på 2 747 av 16 047 och kan inte söka på dem.

**Målet avgörs vid skick**, och det är det som gör Var till mer än ett filter:

```
bara kommun   → /<kommun>/          kommunens egen sida
bara text     → /sok/?q=…
både och      → /sok/?q=…&kommun=…
```

`/sok/` filtrerar på `href`-prefixet och inte på en ny kolumn i registret:
varje förslag bär redan `/<kommun>/<slug>/`, och registret ligger på varje
sidvisning, så en extra kolumn hade kostat 16 047 strängar för en uppgift som
redan står där. Filtret gäller bara verksamheter; kommunträffarna står kvar, så
den som filtrerat på Karlstad och söker "Uppsala" hittar Uppsala.

Uppmätt: Karlstad plus "pizza" ger 2 träffar mot 135 i fem kommuner utan
filtret.

**Ett fel på vägen.** Ortnamnet slås upp i sökregistret, som hämtas över nätet,
och första versionen satte upp filterremsan innan svaret kommit. Uppslaget gav
null, koden tolkade det som okänd kommun och nollade filtret.

### Grinden till "Populära ställen" var trasig

Ägaren: "för närvarande har vi typ inga med brister som kvarstår på homepage,
trots att tex riche har det."

Grinden krävde en MATKATEGORI. Riche bär `amenity=restaurant`, ingen `cuisine`,
och kommunens typ är `Restaurang`. Ingen av de tre finns i kategoritabellen, och
det är avsiktligt: "Restaurang" är 8 000 rader och duger inte som filterval.

Följden var att grinden sållade bort precis de bästa krogarna medan kyrkor med
kyrkfik slank igenom på kommunens typ `Café`.

| grind | kandidater | rena | brister | kvarstår | ingen |
|---|---:|---:|---:|---:|---:|
| krav på matkategori | 24 | 23 | 2 | **0** | 3 |
| krav på OSM-matplats | 33 | 29 | 2 | **1** | 1 |

Med den rätta grinden kommer Operakällaren, Ekstedt, Wedholms Fisk, Mäster
Anders, Den Gyldene Freden, Sturehof och Riche in, och kyrkorna försvinner. Se
`arMatplats` i lib/matkategori.ts.

Raden är nu 8 rena, 2 med brister, 1 med brister som kvarstår och 1 utan
aktuell kontroll.

### Rubriken heter "Populära"

Ägarens beslut efter att ha bett om ordet två gånger. Invändningen står kvar i
`index.astro` som en beskrivning av vad ordet betyder: vi mäter ingen
popularitet, har inga besöksdata och ingen betygsvolym. Gränsen går vid
bedömningen. Raden får heta populär; ingen verksamhet får framställas som bättre
eller sämre än en annan på kontrollresultat, och raden är fortfarande
kronologisk.

### Sidbredden gäller hela sajten

`--w-wide` 1080 → 1400, och `.container` fick `clamp(16px, 4vw, 48px)`. Vid
1280 blir innehållet 1184, alltså Ednias mått.

**Och den avslöjade en regression.** Verksamhetssidan är en flytande
huvudkolumn plus en fast 300 px panel, så hela breddningen landade i löptexten:
meningen om avvikelsen mätte 836 px, omkring 119 tecken per rad. Brödtext i
huvudkolumnen är nu låst till `--w-read`, medan diagram och tabeller behåller
hela bredden. Det är vinsten med den bredare sidan: siffrorna får plats, texten
behåller sitt mått.

Rättningen krävde `:global`. Styckena bor i egna komponenter, till exempel
`.answer` i FollowUp.astro, och Astros stilomfång sätter sin attributnyckel bara
på element i samma fil. Utan `:global` träffade regeln noll av fyra breda
stycken.

### Menyns ikoner: alla rader, inte några

Första försöket gav tre av sju rader ikon, efter Airbnbs förlaga. Ägaren: "ser
typ halvdant fixat ut."

Felet var att jag lånade Airbnbs ANTAL utan deras layout. Deras rader ligger i
en smal rullgardin där en ensam ikon läser som en markering. Våra ligger i en
bred panel som redan har sju ikonplattor i avsnitten nedanför, och där läser tre
av sju som fyra rader där ikonen inte hunnit fram.

### Bilder ur Wikipedia: mätt, och inte byggd

Ägaren pekade på Frantzén och Max Hammarby Sjöstad. Orsaken till att de saknas
är att kedjan är Etablering → OSM-punkt → `wikidata` → P18 → Commons, och
Frantzén har ingen OSM-träff alls.

Tre regelvarianter provade:

| regel | utfall |
|---|---|
| namnlikhet | 10 träffar av 50, **sju fel ställe** |
| alla våra namnord i filnamnet | Bank Hotel och Siam Square överlever ändå |
| alla ord plus tre ord eller sv.wikipedia | 5 av 70 godkända, 10 korrekt avvisade, **cirka två av fem ändå fel** |

Geosökning duger inte: Max-filen har inga koordinater. Globalusage duger inte
ensamt: Max-filen används på KEDJANS artikel.

Utbytet är omkring sju procent fler bilder till tjugo till fyrtio procents
felrisk. Ett fel foto på en namngiven restaurang går inte att ta tillbaka när
sidan är indexerad. **Rekommendationen är en kandidatlista för granskning, inte
automatisk publicering.** Kräver ägarens beslut.

---

## 10. Omgång fem, 2026-08-22 kväll

### Senast kontrollerade är borta

Ägarens beslut. Raden bar åtta kort utan foto direkt under tolv med foto,
alltså samma sorts innehåll i sämre skick. Färskheten finns kvar på varje kort
i datumraden under namnet.

### Visa fler, tolv kort i taget

Ägaren: "jag gillar laddiden, kanske inte oändlig laddning men ändå lite."

Ingen oändlig skroll och inget anrop: sajten är statisk, så det finns ingen
tjänst att fråga. Nästa vända står i markupen och avslöjas av en kryssruta,
samma grepp som kategoriraden. Priset är att poolen växer från 154 till 255
kort.

**Kortet bär en ORDLISTA över de grupper där det ligger efter första vändan**,
inte en enda flagga. Ett ställe kan vara nummer tre under Pizza och nummer
tjugo under Café, och med en enda flagga fick jag välja mellan att dölja det
där det hör hemma tidigt eller visa det där det hör hemma sent. Utfallet av
det andra var att Café visade sexton kort i första vändan i stället för tolv.

Uppmätt efter rättningen: varje flik börjar på tolv, och Visa fler ger Café 20,
Pizza 18, Livsmedel 16, Bar 13. Sushi stannar på elva, för fler finns inte i
beståndet, och då döljs knappen.

### Kartknappen

Uppmätt på Airbnbs sökresultat 2026-08-22:

| | Airbnb | Prikko |
|---|---|---|
| mått | 129 × 48 | 146 × 48 |
| radie | 24 | 24 |
| platta | `rgb(34, 34, 34)` | `var(--text)` |
| etikett | 14 px / 500 | samma |
| avstånd till nederkant | 48 | 24 |

Vår är bredare eftersom "Visa på karta" är längre än "Visa karta".

**Klistrad och inte fast**, vilket är skillnaden mot deras. En fast knapp följer
med över sidfoten och ligger i vägen där den inte har något att erbjuda. Inuti
`.upptack` svävar den så länge rutnätet syns och rullar bort med det, utan
skript.

En LÄNK och inte en knapp: kartan är en egen sida, och en knapp som byter sida
går inte att öppna i ny flik eller mellanklicka.

### Menylänkarna är svarta

Ägaren: "varför är länkarna i en grå och inte vår svarta färg?"

Det fanns inget skäl. `--text-secondary` är sajtens dämpade ton och hör hemma
på underrader och metatext, inte på det enda man kommit till menyn för att
klicka på. Ikonen bredvid är fortsatt dämpad, för den ÄR underordnad ordet.

### Luften mellan kategoriraden och rubriken

Ägaren: "populära ställen sitter nästan limmad mot toppen."

Första försöket la 24 px som `padding-block` på hela `.upptack` och sköt därmed
ned kategoribandet, medan rubriken satt kvar dikt an mot dess hårlinje.
Luften ligger nu som fyllning på rubrikblocket. En marginal på rubriken hade
kollapsat ut genom `.container`, som bara har fyllning i sidled, och hamnat
ovanför bandet igen.

### Wikidata utan P31 får en andra chans

Ägaren pekade på Rolfs kök, som har en bild på Wikipedia men ingen hos oss.

Objektet Q10656465 heter "Rolfs kök", bär "Rolfs kök.JPG" och en koordinat
**0,77 meter** från vår rad, men har `P31: []`. Klassgrinden avvisade allt utan
P31, alltså läste den tomrummet som "fel sorts sak".

**Att sakna P31 och att ha fel P31 är två olika saker.** Det ena är en lucka i
Wikidata, det andra ett besked. Bara det första får en andra chans, och bara
inom 40 meter. Se `UTAN_P31_MAX_M` i `pipeline/prikko/wikidatanamn.py`.

Mätt över 11 577 rader i fyra kommuner. Av 7 459 objekt i lådorna saknar 238
P31, och tolv är namnlika inom 150 meter.

**Fyra av de tolv har redan bild via OSM-vägen, och regeln pekar på exakt samma
fil i alla fyra:** Sundbergs Konditori 0,6 m, Restaurang Kvarnen 0,9,
Restaurang Pelikan 1,1, Wedholms Fisk 4,2. Två oberoende personer har pekat på
samma bild.

```
  <= 10 m: 2 nya      <= 30 m: 6 nya
  <= 20 m: 3 nya      <= 40 m: 6 nya   <- valt
  <= 80 m: 7 nya      <= 150 m: 8 nya
```

Träffarna slutar vid 27,1 meter och nästa ligger på 75,4, så gränsen ligger i
ett glapp och inte mitt i en hög.

**Varför inte vidare.** Avståndet skyddar inte mot stadsdelsfelet: vid en
kilometer paras "Gamla Östberga Bageri AB" med stadsdelen på 321 meter och
"Långpannan Pizzeria" med platsen på 520. Att bageriet hamnade på 321 är en
slump; hade det legat mitt i stadsdelen hade centroiden legat femtio meter bort
och sluppit igenom vilken spärr som helst under 150.

Vinsten är fem rader av 11 577: Norra Brunn, Rolfs Kök, Restaurang Syster o
Bror och Skärholmens gård, som står två gånger i registret. De tre kommunerna
utanför Stockholm gav noll, för Wikidata har bara stockholmskrogar som objekt
utan P31.

**Nästa steg, inte byggt:** åtta av de elva objekten bär en svensk beskrivning
som säger vad tinget är, "restaurang i Stockholm", "skola i Hägerstensåsen". En
grind på beskrivningen vore ett riktigt substitut för P31 i stället för ett
ombud, och skulle antagligen tillåta ett vidare avstånd med bättre säkerhet än
40 meter ger.

---

## 7. Skärmbilderna

I `research/forlagor/`, tagna 2026-08-21.

| fil | vad |
|---|---|
| `airbnb-1280-topp-utfallt.png` | sidhuvudet i utgångsläget, 1280 |
| `airbnb-1280-1-sok-utfallt.png` | samma, via CDP, 1280 |
| `airbnb-1280-2-sok-ihopfallt.png` | efter rullning: kompakt piller i raden, kategoriraden borta |
| `airbnb-1280-3-kategori-hovring.png` | hovring över en kategori |
| `airbnb-1280-4-kort-hovring.png` | utloggat läge, där kortraderna ersätts av en länklista. Hovringsmätningen i §4 är gjord i den inloggade sessionen, där korten finns |
| `airbnb-1280-5-meny-utfalld.png` | hamburgermenyn utfälld, plus aktivt understreck i kategoriraden |
| `airbnb-390-topp.png` | mobil: sökpille över hela bredden, kategorichip under, flikrad i botten |
| `ednia-1280-topp.png` | sidhuvud med sökfält, ikonrad, kort direkt |
| `ednia-1280-kategorirad.png` | kategoriraden i närbild |
| `ednia-1280-kategori-hovring.png` | hovring över en kategori |
| `ednia-390-topp.png` | mobil |

Airbnbs mobilbild och CDP-bilderna på 1280 bär deras kakruta. Den är inte
bortklickad, eftersom samtycke lämnas av ägaren och inte av ett verktyg.

CDP-bilderna är dessutom tagna UTLOGGADE, och Airbnb visar då en länklista
("Inspiration för framtida resor") i stället för kortkaruseller. Alla mått på
kort och karusell i §4 är därför tagna i den inloggade sessionen, där korten
finns, och de talen står i den paragrafen.
