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

### Ingen bild på verksamhetskorten

| | |
|---|---|
| verksamheter med bild | **210 av 16 047 = 1,3 %** |
| kommuner med noll bilder | 6 av 12 |
| källa | 210 av 210 Wikimedia Commons |
| licens som kräver attribution | 187 av 210 |

`Commonsbild.astro` har redan avgjort att attributionen ska vara en **synlig
bildtext** och inte en (i)-knapp, och att även de 20 public domain-bilderna får
bildtext eftersom årtalet är ett ärlighetskrav: Grand Hotel är fotograferat 2013
och Rosenlunds Herrgård 2019.

Ett kort på 250 px kan inte bära "Foto: Balazs Szanto, 2013, CC BY-SA 2.0" utan
att bildtexten blir kortets största textmassa. Alltså bär inget verksamhetskort
på startsidan ett foto.

Vinsten är att kortet får EN form i stället för två, och att ansiktsrutan inte
kan läsas som en platshållare för ett foto som saknas, eftersom inget kort på
sidan har ett foto.

### Senast kontrollerade, och taket på två per kommun

Av de 60 senast kontrollerade verksamheterna i landet ligger

```
stockholm 42   uppsala 9   jonkoping 6   oskarshamn 2   hoganas 1
```

alltså 70 procent i en kommun. Det följer av att Stockholm är 8 520 av 16 047
verksamheter och publicerar oftast. Taket på två per kommun sprider tolv kort
över minst sex kommuner.

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

Kortet använder `FaceRef` och inte `FaceMark`: 72 märken på sidan ritas som
`<use>` mot fyra symboler i sidans sprite. Ingen rörelseflagga sätts, av samma
skäl som listorna aldrig får dem.

### Filtret utan skript

Sex grupper ritas i markupen och urvalet görs i CSS med `:has()` på
radioknappar, exakt som artikellistans sortering i `pages/artiklar/index.astro`
redan gör. Ingen adress, ingen sidladdning, inget skript. Faller `:has()` bort
visas hemgruppen, alltså tolv kort i stället för 72, vilket är sidans grundläge
ändå.

En kategori kan inte länka någonstans i stället: kategorisidorna finns per
kommun och det finns ingen nationell. Fem nya nationella sidor för en filterrad
är precis det bibeln förbjuder, och filtaket ligger på 19 500.

### Tredje uppsättningen kategoriikoner är borta

`index.astro` bar en egen `COLUMN_ICONS` på 20 × 20 med 1,5 px streck, alltså
sajtens tredje uppsättning kategoriikoner efter `Kategoriikon.astro` och
`AreaIcon.astro`. Den är struken. Samma fem former står nu i filterraden en
skärm längre upp.

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
