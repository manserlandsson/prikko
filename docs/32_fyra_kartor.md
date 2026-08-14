# 32. Varför sajten har fyra kartor

Ägarens fråga, ordagrant: **"varför har vi olika kartor?"**

Det här dokumentet svarar med belägg och inte med en åsikt. Det går igenom vad
var och en av de fyra faktiskt gör, vad de redan delar, vad de duplicerar, och
föreslår sedan vad som borde slås ihop och vad som har ett verkligt skäl att
vara eget.

## Hur talen är framtagna

Räknade i filerna 2026-08-14, efter den här omgångens ändringar. Radantal med
`wc -l`. Kolumnen "kod" räknar rader som varken är blanka eller inleds med
`*`, `//`, `/*` eller `{/*`, alltså allt utom prosa och luft.

| Fil | Rader | Varav kod | Kommentar och luft |
|---|---:|---:|---:|
| `Karta.astro` | 3 491 | 1 973 | 1 518 |
| `KartaPuff.astro` | 674 | 410 | 264 |
| `OmradeKarta.astro` | 1 066 | 539 | 527 |
| `Platskarta.astro` | 388 | 242 | 146 |
| **Summa** | **5 619** | **3 164** | **2 455** |

Det delade ligger dessutom i tre filer till: `lib/kartbas.ts` 181 rader,
`lib/kartrutor.ts` 600 och `styles/kartram.css` 501.

**Första rättelsen av frågeställningen.** Talet 5 206 som cirkulerat är
råa radantal, och 44 procent av dem är kommentarer. Det är husets stil och
inte svammel, men det betyder att "fyra filer på 5 200 rader" överdriver hur
mycket kod som faktiskt är i omlopp. Den riktiga siffran är 3 164 rader kod,
och `Karta.astro` ensam är 62 procent av den.

**Andra rättelsen.** Frågan lyder "varför har vi olika kartor?", och den
förutsätter att fyra är många. Räknat per sidtyp har sajten fem ytor som visar
en karta och fyra komponenter som ritar dem, alltså nästan en per yta. Det som
gör talet högt är inte att kartorna är många utan att de återanvänder för lite
av varandra, och det är den delen resten av dokumentet mäter.

---

## Vad de fyra gör

### `Karta.astro`, den delade vyn

Sajtens enda helskärmsyta. Listspalt till vänster, levande karta till höger.

Används av `pages/karta.astro` (rikskartan) och `pages/[kommun]/karta.astro`.

Den är stor för att den är en **applikation** och inte en kartruta. Utöver
kartan bär den textfilter, kategorifilter, ett nålkort med bläddring mellan
verksamheter på samma adress, ett mobilark i tre lägen, läsning och skrivning
av fragmentet `#map=z/lat/lng&typ=&q=`, en "du är här"-ring, sextio
serverrenderade listrader och nio kartlager. Den laddar MapLibre omedelbart,
utan uppvakningsvillkor, eftersom kartan ÄR sidan.

### `KartaPuff.astro`, kommunhubbens ruta

En kartruta på 328 px i kommunsidans flöde. Samma rutarkiv, samma nålar och
kluster, fyra av den delade vyns nio lager. Ingen lista, inga filter, inget
kort, inget ark. Lat laddad bakom tre villkor.

Används bara av `KommunHub.astro`.

### `OmradeKarta.astro`, områdessidans karta

Sidbred karta med områdets gräns ovanpå och allt utanför under en mask. Läser
samma rutarkiv, men ritar dessutom en stillbild vid bygget ur `establishments()`
och delar punkterna i innanför och utanför med ett `within`-filter.

Används bara av `OmradeHub.astro`.

### `Platskarta.astro`, verksamhetssidans karta

En nål på en karta. Ingen punktkälla alls, bara ett GeoJSON med en koordinat.
Platshållaren är kartstilens egen markfärg, inte en bild.

Används bara av `pages/[kommun]/[slug].astro`, alltså av sajtens vanligaste
sidtyp.

---

## Vad de redan delar

`lib/kartbas.ts` bär sju exporter:

| Export | Karta | KartaPuff | OmradeKarta | Platskarta |
|---|:-:|:-:|:-:|:-:|
| `KARTSTIL` | nej | ja | ja | ja |
| `KART_SPRAK` | ja | via nästa | via nästa | via nästa |
| `KARTA_I_DOKUMENT` | **nej, avsiktligt** | ja | ja | ja |
| `laddaMaplibre` | nej | ja | ja | ja |
| `laddaMaplibreCss` | nej | ja | ja | ja |
| `faceBitmap` | nej | ja | nej | ja |
| `faceSvg` / `PIN_W` / `PIN_H` | nej | nej | nej | ja |

**Karta.astro använder en enda av de sju.** Filens egen modulkommentar erkänner
det redan: "Karta.astro har egna kopior av samma konstanter". Att den inte
använder `KARTA_I_DOKUMENT` är däremot ett taget beslut med motivering på plats:
samarbetande gester hör hemma i en karta man rullar förbi, inte i en karta som
är hela sidan.

`lib/kartrutor.ts` är den gemensamma datavägen och används av alla fyra plus
åtta filer till. Där finns ingen splittring att laga.

`styles/kartram.css` bär ramen och allt MapLibre ritar inuti den, för alla fyra.
Den filen är föredömet: formen bor på ETT ställe och kan inte glida isär.

---

## Vad som är duplicerat och inte delat

Uppmätt per block, med ungefärliga radintervall.

| Sak | Karta | KartaPuff | OmradeKarta | Platskarta |
|---|---|---|---|---|
| MapLibre-adresser och `laddaCss` | 502–503, 1948–1956 | via kartbas | via kartbas | via kartbas |
| `faceBitmap` och nålmåtten | 1697–1733 | via kartbas | saknas | via kartbas |
| `rutkalla()` med Range-reserven | 1979–2039 | 214–249 | i skriptet | saknas |
| `__prikkoPmtiles`-registreringen | 2041–2050 | 251–257 | i skriptet | saknas |
| Namnbytet `Map: MapLibreKarta` | 2052–2071 | 203–212 | i skriptet | saknas |
| Bedömningens fyra hexfärger | 507 | 186–188 | i skriptet | saknas |
| Klusterlagren (skugga, cirkel, antal) | 2197–2267 | 304–354 | i skriptet | saknas |
| Klusterzoomen (`ez` + `bx` + `cameraForBounds`) | 2545–2613 | 399–454 | i skriptet | saknas |
| `SAMMA_PLATS = 3e-5`, `STAPELZOOM = 18` | 534–544, 2577 | 413–414 | i skriptet | saknas |
| Uppvakningsvillkoren | saknas, avsiktligt | 491–562 | i skriptet | 244–261, **avvikande** |
| Markörbytet vid hovring | 2682–2685 | 472–475 | i skriptet | saknas |

Tre observationer väger mer än de andra.

**1. `rutkalla()` finns i tre exemplar.** Det är reserven för en värd som
struntar i `Range` och besvarar en pmtiles-förfrågan med 200 och hela kroppen.
Den är trettiofem rader kod med sextio raders motivering ovanför sig, och den
är identisk i alla tre. Går den sönder går den sönder på tre ställen, och
lagas den lagas den på ett.

**2. `TILE_LAYER = 'punkter'` exporteras men används inte.** Konstanten finns i
`lib/kartrutor.ts` rad 61 och används bara av `scripts/kartrutegrind.mjs`.
Alla fyra komponenterna skriver strängen `'punkter'` för hand i varje
`source-layer`, sammanlagt tjugo gånger. Det är ett delat värde som redan finns
och som ingen pekar på.

**3. Platskartans uppvaknande är en faktisk divergens, inte en kopia.**
KartaPuff och OmradeKarta grindar på `saveData`, `effectiveType` och
`prefers-reduced-data` innan kartan får laddas. Platskarta gör det inte: den
har bara en `IntersectionObserver` med tröskel 0,2. Verksamhetssidan är
sajtens vanligaste sidtyp, och det är alltså just där en besökare med dålig
uppkoppling betalar 231 kB brotlat som de andra tre sidtyperna skyddar honom
från. Det är sannolikt ett förbiseende och inte ett beslut, för ingen
motivering står skriven.

Grovt räknat ligger 230 av KartaPuffs 410 kodrader i block som har en
tvilling i `Karta.astro`.

---

## Svaret på frågan

**Fyra kartor är inte fyra av misstag, men det är inte heller fyra av
nödvändighet.**

De skiljer sig i tre dimensioner, och bara två av dem är verkliga.

1. **Vad de ritar.** En nål, en kommun, ett område, hela riket. Verklig
   skillnad, och den bor i lagren.
2. **När de laddas.** Omedelbart eller bakom uppvakningsvillkor. Verklig
   skillnad, och den bor i tre kopior som borde vara en.
3. **Hur de startar MapLibre.** Range-reserven, protokollregistreringen,
   namnbytet, färgerna, kontrollerna. **Ingen verklig skillnad alls.** Det är
   samma trettio rader tre gånger.

Punkt tre är hela svaret på varför filerna känns som fyra kartor i stället för
en karta i fyra skepnader.

---

## Vad som borde göras

### Gjort i den här omgången

- **Områdeskartans klick.** Nålar leder till verksamheten, bubblor delar sig,
  markören säger vad som går att trycka på. Mönstret är hämtat rakt ur
  KartaPuff i stället för uppfunnet igen, och avvikelserna står utskrivna i
  filen.
- **Upphovsraden.** `OmradeKarta` kör `compact: false` som `Karta`, och
  fritextraden under kartan är borta.

### Lågrisk, kan tas av vem som helst

1. **Flytta `rutkalla()` och protokollregistreringen till `lib/kartbas.ts`.**
   En funktion, tre anropsplatser, identisk kod. Omfattning: en halvdag,
   ungefär 105 rader kod bort ur komponenterna. Risken är låg eftersom
   funktionen är ren och inte rör DOM.
2. **Flytta uppvakningsvillkoren till `lib/kartbas.ts`.** Något i stil med
   `vakna(element, start)`. Tre kopior blir en, och Platskartans divergens
   blir omöjlig att göra om av misstag. Omfattning: en halvdag, ungefär 90
   rader. **Detta lagar samtidigt punkt 3 ovan**, och det är den enda posten i
   listan som rättar ett verkligt fel för en besökare och inte bara städar.
3. **Peka på `TILE_LAYER` i stället för att skriva `'punkter'`.** Tjugo
   ställen, mekaniskt. Omfattning: en timme.
4. **Flytta de fyra bedömningsfärgerna och `BRAND` till `lib/kartbas.ts`.**
   De står i dag i tre komponenter med en kommentar var som säger att de är
   samma tal som `tokens.css`. Omfattning: en timme.

Punkt 1 till 4 tar bort ungefär 250 rader kod utan att en enda pixel ändras.

### Kräver ägarens beslut

5. **Slå ihop `KartaPuff` och `OmradeKarta` till en komponent.** De gör nästan
   samma sak: en lat laddad kartruta i ett sidflöde, samma arkiv, samma
   kluster, samma klickbeteende efter den här omgången. Skillnaderna är att
   områdeskartan har en gräns, en mask, ett innanför-och-utanför-filter och en
   stillbild ritad vid bygget. Det är fyra egenskaper, och de går att göra
   valfria.

   Omfattning: två till tre dagar, och risken är inte i koden utan i att två
   sidtyper därefter delar öde. Ändrar någon rutan för kommunsidan ändras
   områdessidan med. Det är precis vad `styles/kartram.css` redan gör för
   formen och det har fungerat, men det är ett beslut och inte en städning.

6. **Bryta ut nålkortet och filtren ur `Karta.astro`.** Filen är 1 973 rader
   kod och gör sex saker. Den skulle må bra av att bli tre eller fyra filer.
   Omfattning: en vecka, och risken är hög: det är sajtens mest interaktiva yta
   och den har inga tester.

### Vad som ska förbli eget

- **`Platskarta.astro`.** Den delar redan allt som går att dela genom
  `kartbas.ts`, den har ingen punktkälla, inga kluster och inga filter, och
  dess enda nål är sidan man står på. Att tvinga in den i en gemensam
  kartkomponent hade betytt att den bär med sig ett rutarkiv den aldrig läser.
  Kvar står bara uppvakningsvillkoren, punkt 2 ovan.
- **`Karta.astro` som egen fil.** Den är en applikation, inte en kartruta.
  Punkt 6 handlar om att dela upp den, inte om att slå ihop den med de andra.
- **`styles/kartram.css` och `lib/kartrutor.ts`.** De är redan rätt byggda och
  ska inte röras.
