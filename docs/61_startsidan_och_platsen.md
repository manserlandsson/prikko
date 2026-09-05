# Startsidan och platsen

Startsidan visade Stockholm för alla. Det här dokumentet är vad förlagorna
gör åt samma problem, vad som mättes, och vad som byggdes.

Allt är mätt 2026-09-05, i webbläsaren för förlagorna och i bygget för vår
egen data. Ingenting här är skrivet ur minnet.

## Vad som var trasigt

Raden **Populära ställen** har 30 kort. Räknat över hela poolen i det byggda
`index.html`:

| Kommun | Kort i poolen |
|---|---:|
| Stockholm | 248 |
| Linköping | 55 |
| Jönköping | 45 |
| Uppsala | 36 |
| Örebro | 33 |
| Karlstad | 30 |
| Oskarshamn | 16 |
| Kristinehamn | 15 |
| Svenljunga | 4 |
| Lomma | 2 |
| Borgholm | 2 |
| Norrköping | 0 |
| Höganäs | 0 |

248 av 486 kort ligger i Stockholm. Hemgruppens sextio är 56 Stockholm,
2 Karlstad, 1 Jönköping och 1 Oskarshamn. Den som bor i Örebro möttes av
Scandic Hotel Malmen.

## Vad förlagorna gör

Fyra sajter, öppnade vid 1440 och 375 med pekskärmsemulering påslagen.

### booli.se

Frågar aldrig om position, någonstans. Startsidan är ett sökfält med
platshållaren "Sök på en gata, ort eller kommun", och fältet öppnar en tom
förslagslista. Inget "nära dig" finns i navigationen eller i brödtexten.

Deras enda minne är `booli.mapSettings` i localStorage, som håller kartans
utsnitt. Startsidan i sig minns ingenting.

Vid 375: samma sida, samma fält, ingen platsfråga.

### hemnet.se

Frågar aldrig heller, men **minns**. Två saker på startsidan:

* Under sökknappen står raden `Senaste: Bostäder, Stockholms län`. Etiketten
  är 16 px i vikt 400 i rgb(22,22,22), länken 16 px i vikt 400 och
  understruken, hela raden 252 × 24 px. Det är en LÄNK, inte ett tillstånd
  sidan gått in i.
* Under formuläret ligger avsnittet **Rekommenderat för dig** med undertexten
  "Bostäder som matchar din senaste sökning".

Minnet ligger i localStorage under `previousSearches`, och innehållet var
ordagrant:

```json
[{"string":"Bostäder, Stockholms län","params":{"location_ids":"17744"},"searchSegment":"","timestamp":1788621047}]
```

Alltså: **en sökning, inte en position.** Sökfältet självt står tomt.

Vid 375: raden "Senaste" och avsnittet "Rekommenderat för dig" är kvar och
ligger på samma plats.

### hitta.se

Startsidan frågar inte om position och nämner den inte. Kategorisidan
**gissar** i stället, utan att fråga: `/verksamheter/elektriker` öppnade som
"Elektriker i Stockholm, 692 verksamheter".

Gissningen står utskriven i en bricka uppe till höger: 126 × 40 px, radie 8,
vit platta, hårlinje rgb(224,224,224), etikett 14 px i vikt 500, nål till
vänster. Ett klick öppnar rutan **Område**, med ett sökfält och sedan en lista
vars **första rad är "Nära mig"** med en navigeringspil, följd av "Hela
Sverige", "Stockholm", "Göteborg", "Malmö".

Ingenting i localStorage, sessionStorage eller kakorna rörde plats. De minns
alltså inte, de gissar om varje gång.

### airbnb.se

Frågar aldrig. Raderna heter **"Populära boenden i Sälen"**, "Fantastiska
hotell för din nästa resa" och "Tillgängligt nästa månad i Åre". Platsen står
alltså i rubriken när innehållet har en plats.

Klickar man i fältet "Var" öppnas "Förslag på destinationer", och första raden
är **"I närheten"** med undertexten "Hitta allt som finns i närheten", före
Sälen, Åre, Stockholm och Göteborg. Raden mäter 366 × 72 px, titeln 14 px i
vikt 500 i rgb(34,34,34), undertiteln 14 px i vikt 400 i rgb(108,108,108).

### De fyra svaren på de fyra frågorna

| | frågar de vid inladdning? | vad står i rutan innan de vet något? | vad händer vid nej? | minns de? |
|---|---|---|---|---|
| booli | nej | "Sök på en gata, ort eller kommun" | inget att neka | kartans utsnitt |
| hemnet | nej | tomt fält, plus raden "Senaste" | inget att neka | ja, senaste sökningen |
| hitta.se | nej | på kategorisidan: gissningen "Stockholm" | listan står kvar, man väljer stad | nej, gissar om |
| airbnb | nej | "Sök destinationer" | listan står kvar | platsen står i rubriken |

**Ingen av de fyra frågar vid inladdning. Ingen av de fyra byter sidans
innehåll av sig själv när de minns.** Hemnet, som är den enda som minns en
plats, visar sitt minne som något man trycker på.

## Vad som mättes hos oss

### Bildbeståndet, alltså varför hemgruppen inte går att byta

Verksamheter som klarar hemgruppens grindar, alltså konsumentvänd, inte skola,
och ett daterat fotografi som är högst tjugo år:

| Kommun | Verksamheter | Med bild | Efter konsumentgrinden | Klarar hela raden |
|---|---:|---:|---:|---:|
| Stockholm | 8 567 | 265 | 188 | 167 |
| Uppsala | 1 863 | 31 | 29 | 25 |
| Linköping | 1 247 | 33 | 12 | 7 |
| Örebro | 1 231 | 9 | 8 | 3 |
| Jönköping | 1 136 | 20 | 17 | 15 |
| Norrköping | 1 022 | 0 | 0 | 0 |
| Karlstad | 697 | 11 | 8 | 7 |
| Borgholm | 406 | 0 | 0 | 0 |
| Höganäs | 316 | 1 | 0 | 0 |
| Oskarshamn | 238 | 1 | 1 | 1 |
| Kristinehamn | 170 | 0 | 0 | 0 |
| Lomma | 153 | 0 | 0 | 0 |
| Svenljunga | 100 | 0 | 0 | 0 |

Totalt 17 146 verksamheter, 371 med en bild, 225 som klarar raden.

**Nio av tretton kommuner har noll kort i hemgruppen.** En hemgrupp som bytte
till Örebro hade blivit tom på tre kort, och till Norrköping helt tom.

Det svarar på bonusfrågan om hemgruppen: en bildlös form av DEN raden byggs
inte, för det är inte formen som saknas utan innehållet. En rad utan bilder är
inte raden "Populära ställen" i en annan skepnad, den är en annan rad.
Rubriken och urvalsregeln är dessutom ägarens beslut 2026-08-22 och rörs inte.

### Behöver kommunbrickans rad en bildlös form? Nej, den har redan en

Mätt i webbläsaren på den byggda sidan med Örebro valt: av gruppens 30 kort
har **0 en `<img>` alls**, och inget kort står tomt. `Verksamhetskort.astro`
ritar i stället ett eget motiv per sort, `.bildyta .motiv` med klasserna
`m-markis`, `m-fasad` och `m-dorr`, alltså en kopp för caféet och en butiksfront
för butiken.

Formen finns alltså redan, den är ritad och inte en tonplatta, och den varierar
med vad stället är. En ny bildlös form hade blivit en tredje variant bredvid
två som fungerar. Den byggdes inte.

### Vad de två nivåerna kostar

| | överfört, gzip |
|---|---:|
| index.html utan brickan | 47,0 kB |
| **billig:** `data-kommun` på 486 kort | **+0,28 kB** (11,2 kB rått) |
| dyr: bara koordinatparen för 14 384 verksamheter, JSON | +77 kB |
| dyr: samma som heltal med fyra decimaler, 11 m upplösning | +61 kB |
| dyr: samma binärt som int32-par | +67 kB (112 kB rått) |
| dyr: hela raden med namn, slug, kommun och dom | +330 kB |
| och koordinaterna behöver sökregistret för att veta vad de heter | +373 kB |

Bara 14 384 av 17 146 verksamheter HAR en koordinat, så den dyra nivån hade
dessutom haft ett hål på 2 762 rader.

**Den dyra nivån är ungefär trehundra gånger dyrare för samma svar**, alltså
"vad finns nära mig". Den byggdes inte.

Kartrutorna kan inte bära det. De ligger som ett enda PMTiles-arkiv på 3,1 MB
som läses med räckviddsanrop, och att läsa det från startsidan hade krävt
pmtiles-läsaren på en sida som i dag inte laddar någon karta alls.

## Vad som byggdes

En **kommunbricka först i kategoriraden**, alltså hitta.ses platsbricka flyttad
in i den brickrad vi redan har.

* Servern renderar brickan tom och `hidden`. **Servern vet ingenting om
  besökaren och får inte veta något:** sidan är statiskt byggd och HTML:en
  cachas för alla.
* Skriptet läser en kommunslug ur localStorage och skriver kommunens namn i
  brickan. Finns ingen slug finns ingen bricka.
* Brickan är **inte förvald**. Ett klick filtrerar rutnätet till kommunens
  kort och rubriken byter till "Ställen i Örebro".

Filtret kostar noll extra kort. Korten finns redan i markupen: kategorierna
plockar med tak två per kommun, se `plocka` i `index.astro`, så poolen bär
hela landet även när ingen enskild flik gör det. Brickan samlar bara ihop en
kommuns kort ur alla flikar.

### Varför brickan inte är förvald

Tre skäl, i den ordningen.

1. **Ingen av de fyra förlagorna byter innehåll av sig själv.** Hemnet, den
   enda som minns en plats, visar minnet som en länk.
2. **Annars hoppar sidan.** Skriptet kan inte köra före rutnätet: markupen är
   483 kort och nästan en megabyte, så webbläsaren målar hemgruppen långt
   innan sista `</li>` är läst. Ett urval som byts efter det är precis den
   blinkning som är förbjuden. En bricka som dyker upp i en rad som rullar i
   sidled kostar däremot noll pixlar i höjd, och dokumenthöjden är densamma
   med och utan den.
3. **Rubriken måste namnge kommunen**, vilket är Airbnbs regel och redan
   citerad i hemgruppens egen kommentar. En rad som tyst bytt innehåll men
   behållit rubriken "Populära ställen" ljuger.

### Tröskeln

Brickan visas bara för kommuner med minst **fem** kort i poolen, för rutnätet
är fem spalter i `--w-wide`. Under fem fyller gruppen inte en enda rad.

Det fäller Norrköping, Höganäs, Lomma, Borgholm och Svenljunga. De fem får
ingen bricka, och det är rätt svar: sökpanelens platsrad tar besökaren till
kommunens egen sida i stället, vilket är där deras innehåll faktiskt finns.

### Nära mig

Först i sökfältets Var-lista, alltså exakt där hitta.se och airbnb.se lägger
sin. Ordet är en plats och inte en behörighet, av samma skäl som hos dem.

Raden finns bara om webbläsaren har `navigator.geolocation` och bygget gav
kommunpunkter. Positionen hämtas först vid klick, aldrig vid inladdning, och
går in i `narmast` och ut som en kommun.

**Ingen position lämnar webbläsaren.** Inte till adressfältet, inte till en
fråga, inte till en logg och inte till lagring. Avståndsformeln och
närhetsgränserna ligger i `lib/avstand.ts`, som ersatte den kopia som stod
inuti sökpanelens skript.

Ingen tredjepartstjänst och ingen IP-uppslagning används.

### Vad som minns

`prikko.kommun` i localStorage, med **en kommunslug och ingenting annat**.

Skrivs bara när besökaren själv valt en kommun: i Var-listan, med "Nära mig",
eller när sökpanelens platsrad landar inom 40 km. Väljer man "Var som helst"
raderas den.

En kommun är inte en position. Örebro kommun är 1 373 km², och att någon bryr
sig om den är samma sorts uppgift som att någon sökt på den. Det är också
precis vad hemnet lagrar.

`cookies.astro` är uppdaterad: tabellen "Det som faktiskt lagras" har fyra
rader i stället för tre, posten `prikko.kommun` står med, och avsnittet
Platstjänsten säger nu rakt ut att positionen aldrig lämnar webbläsaren och
att det som blir kvar på sin höjd är kommunens namn.

## De tre lägena

| | vad besökaren ser |
|---|---|
| aldrig tillfrågad | sidan som byggdes, raden börjar på "Alla". "Nära mig" finns i Var-listan som ett alternativ bland kommunerna. |
| kommun vald | brickan står först i raden med kommunens namn och en nål. Ett klick ger kommunens kort under rubriken "Ställen i \<kommun\>". |
| nekad | samma som aldrig tillfrågad. Raden i listan svarar "Du delade inte din plats", eller "Platsdelning är blockerad för sidan" om webbläsaren nekade utan att fråga, och går tillbaka efter fem sekunder. Ingen bricka, ingen andra fråga, inget spår på sidan. |

## Mätt i webbläsaren på det byggda bygget

Positionen satt till Örebro rådhus, 59,2741 N 15,2066 E. Vid 1440 × 900 och
vid 375 × 812 med pekskärmsemulering.

| | aldrig tillfrågad | kommun vald | nekad |
|---|---|---|---|
| `prikko.kommun` | `null` | `"orebro"` | `null` |
| brickans bredd | 0 px | 56 × 70 px | 0 px |
| vald grupp | `kat-hem` | `kat-hem` | `kat-hem` |
| rubrik | Populära ställen | Populära ställen | Populära ställen |
| synliga kort | 30 | 30 | 30 |
| **dokumenthöjd** | **3 748 px** | **3 748 px** | **3 748 px** |

**Samma dokumenthöjd i alla tre lägena.** Brickan kostar noll pixlar i höjd,
och den som säger nej får en sida som är px för px den som byggdes.

Efter ett klick på brickan: gruppen `kat-plats`, rubriken "Ställen i Örebro",
30 synliga kort varav **30 av 30 i Örebro**, och "Visa fler (3)" för kommunens
återstående tre av 33. Vid 375 samma sak i två spalter.

## Två saker som inte blev som beställt

### "Nära mig" finns inte under 768 px

Var-delen i sökfältet är `display: none` på smala skärmar, och det är ett
befintligt beslut i `SiteSearch.astro` som inte är mitt att riva. Uppmätt vid
375: `.var` finns i markupen men ritas inte.

Vägen till en kommun på telefonen är därför sökpanelens egen platsrad, "Använd
min plats", som nu MINNS kommunen innan den byter sida. Uppmätt: klicket
landade på `/orebro/karta/#map=14/59.274/15.207` och skrev `orebro`, och
brickan stod på startsidan vid nästa besök. Det fungerar, men det kostar en
sidladdning som skrivbordet slipper.

### Koordinaterna står i adressfältets fragment

`platsMal` i `SiteSearch.astro` skriver besökarens position med tre decimaler,
ungefär 110 m, i fragmentet: `/orebro/karta/#map=14/59.274/15.207`.

Det är BEFINTLIG kod med en utskriven motivering på plats: ett fragment skickas
aldrig med i ett HTTP-anrop, så positionen lämnar faktiskt inte webbläsaren.
Men den STÅR i adressfältet, och den syns i historiken och i en delad länk.

Jag har inte ändrat det. Att ta bort talen hade tagit bort det enda skälet att
kartan öppnas centrerad på besökaren, och det är ägarens avvägning att göra,
inte min.
