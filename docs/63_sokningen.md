# 63. Sökningen: fler ord ska smalna av, inte utplåna

*Mätt och byggt 2026-09-05. Talen i kolumnen "Före" är lästa på `prikko.se`
samma dag, talen i "Efter" ur ett lokalt bygge av den här ändringen, serverat
över http och drivet i en webbläsare, alltså den väg besökaren möter och inte
en modul i isolering.*

---

## 1. Slutsatsen först

Sökmotorn var i grunden bra och är inte omskriven. Vikningen, prefixavståndet,
stavningsreparationen och menade-du fungerade och fungerar fortfarande.

**Felet var att flera ord krävde att raden bar alla, bokstavligen.** Det gjorde
att den vanligaste förfiningen en människa gör, att lägga till staden eller
kedjans vardagsnamn, tömde resultatet i stället för att smalna av det.

**Och vid noll träffar ljög sidan.** Den svarade "Inga träffar. Verksamheten
kan sakna registrerad kontroll." Det är ett påstående om kommunens register,
och vi visste ingenting om kommunens register. Vi visste att vår sökning
missade. Tre av frågorna i tabellen nedan utlöste den meningen om verksamheter
vi har kontroller på.

---

## 2. Tabellen

| Fråga | Före | Efter |
|---|---|---|
| `max` | 70 | 70, men **Maxim flyttar från plats 3 till plats 35** och alla 34 MAX ligger först |
| `max hamburgare` | **2** av 34 | **4 exakta** plus 224 delvisa, med de 34 MAX överst |
| `max stockholm` | **0**, med det falska påståendet | **23**, alla MAX i Stockholm |
| `espresso house` | 56 | 56 |
| `espresso house uppsala` | **0**, med det falska påståendet | **3 exakta**, alla tre i Uppsala, plus 2 008 delvisa |
| `ica maxi örebro` | **0**, med det falska påståendet | **4 exakta** plus 1 616 delvisa |
| `pizzeria odenplan` | **0**, med det falska påståendet | 0 exakta plus **600 delvisa**, alla vid Odenplan |
| `mcdonalds` | 45 | 45 |
| `waynes coffee` | 12 | 12 |
| `birger jarlsgatan 4` | 16 | 22, med Riche först |
| `sturehov` | 1, "Menade du Sturehof?" | oförändrat |
| `sturehof` | 1 | 1 |
| `qzxvwk flurbentz` | inte prövad | **0**, med ett svar som säger vad vi vet |

Två rader förtjänar en anmärkning.

**`max` gav 70 både före och efter, och det är inte samma 70.** Före låg
`Maxim`, `Maxim`, `MAXOS`, `Maxmat` och `Maxi Elit` på plats tre till åtta,
alltså före nästan varje MAX-restaurang. Ett exakt ord slår numera ett ord som
bara börjar likadant, så de faller till plats 35, 37 och 39. Antalet är ett
dåligt mått på en sökning; ordningen är måttet.

**`birger jarlsgatan 4` växte från 16 till 22.** Det är en gatumatchning som
blivit bredare, och den exakta träffen Riche ligger fortfarande först. Priset
är sex rader från samma gata; vinsten är att adressökningar inte längre faller
sönder på ett husnummer.

---

## 3. Det som INTE blev gjort

*Rättat 2026-09-14, se §6. Här stod att matkategorierna inte gick att söka
på. Det var fel: de gick in i registret i samma ändring som det här
dokumentet, och ett bygge samma dag bär kategoritexten på 4 809 av 17 131
rader. `pizzeria` ensamt ger 583 träffar, `kebab uppsala` 10 och
`thai linköping` 4.*

**Det som saknades var platsordet, inte kategorin.** `pizzeria odenplan` gav
noll exakta träffar därför att ordet "odenplan" stod i 16 namn, i noll
adresser och i inget område: Odenplan är en hållplats och inte en
RegSO-stadsdel. Ingen rad bar alltså båda orden utom om ett ställe råkade heta
så. Avfallet mildrade det, men de 599 delvisa raderna leddes av ställen som
HETER Odenplan, 7-Eleven, Max och Hemköp, och inte av pizzerior vid Odenplan.
**Det var en mildring och inte en lösning.** Lösningen står i §6.

---

## 4. Kostnaden

| | Rått | Gzip |
|---|---:|---:|
| Före | 1 169 560 byte | 385 237 byte |
| Efter | 1 219 276 byte | 405 997 byte |
| Skillnad | +49 716, **+4,3 %** | +20 760, **+5,4 %** |

Tjugo kilobyte komprimerat för att laga två av tre hål. Registret laddas av
varje besökare som skriver i sökrutan, så talet är värt att bevaka den dag
kategorierna ska in.

---

## 5. Hur mätningen görs om

Bygg med `--outDir dist-sok`, servera utgåvan över http med en server som
skickar `text/javascript` för `.mjs`, och navigera till
`/sok/?q=<frågan>` en fråga i taget. **Läs rubriken över resultatet och inte
bara antalet**, för den skiljer numera på exakta träffar och rader som bara
bär en del av orden.

**Kör aldrig frågorna mot modulen i isolering.** Sökningen laddar sitt register
över nätet och rangordnar i webbläsaren, och det är den vägen som ska mätas.

Två frågor är kontrollprov och ska aldrig ändras: `qzxvwk flurbentz` ska ge
noll, och `sturehof` ska ge exakt en. Ger den första något har avfallet blivit
för generöst, och ger den andra fler har precisionen gått förlorad.

---

## 6. Platsordet: hållplatsen blir sökbar

*Mätt 2026-09-14. Både "Före" och "Efter" är lästa ur lokala byggen serverade
över http, med rubriken över resultatet och placeringen av den avsedda
träffen, en fråga i taget. "Före" är huvudgrenen utan ändringar, "Efter" är
den här ändringen.*

### 6.1 Vad som gjordes

Närmaste hållplats ur `lib/narhet.ts` blir ett sökord, samma uppgift som
verksamhetssidans "Ta mig hit" visar och packad med samma funktion. Tre
villkor, alla motiverade i `lib/search-index.ts`:

- **Bara hållplatser som minst tio ställen delar.** 285 namn av 1 805.
- **Bara när namnet eller adressen inte redan säger det.** "Hemköp Odenplan"
  bär inte ordet två gånger.
- **Minst tre bokstäver.** Första bygget hade "A" och "B" överst i listan,
  lägesbokstäver vid resecentrum som stod på 255 rader.

Ordet läggs sist i radens söksträng, efter kategorin och området, och räknas
därför aldrig som ett namnord.

### 6.2 Tabellen

| Fråga | Före | Efter |
|---|---|---|
| `pizzeria odenplan` | **0 exakta**, 599 delvisa, ledda av 7-Eleven, Max och Hemköp | **1 exakt**, Brillo Pizza på Norrtullsgatan 10, plus 655 delvisa |
| `sushi odenplan` | 1 exakt, MGL Sushi Odenplan | **4 exakta**, MGL Sushi Odenplan först, sedan Sushi Express, Itamae Sushi Bar och Sushi Yama |
| `max odenplan` | 1 exakt, Max Odenplan på plats 1 | oförändrat, Max Odenplan på plats 1 |
| `sushi södermalm` | 35 | 35, alla som bär ordet i namnet ligger först (plats 1 till 31) |
| `kebab uppsala` | 10, Holy Kebab Gränby 3, Amandas & Kebab house 4 | oförändrat, se 6.3 |
| `café örebro` | 148 | 148, samma ordning |
| `thai linköping` | 4 exakta plus 1 422 delvisa | oförändrat |
| `max` | 70, Maxim på plats 35 | oförändrat |
| `max hamburgare` | 4 exakta plus 224, första rad utan MAX på plats 35 | oförändrat |
| `max stockholm` | 23 | 23, samma ordning |
| `espresso house` | 55 | 55 |
| `espresso house uppsala` | 3 exakta plus 2 000 | oförändrat |
| `ica maxi örebro` | 4 exakta plus 1 616 | oförändrat |
| `mcdonalds` | 45 | 45 |
| `waynes coffee` | 12 | 12 |
| `birger jarlsgatan 4` | 22, Riche på plats 1 | oförändrat |
| `pizzeria` | 583, de 40 första bär ordet i namnet | oförändrat |
| `grill` | 245, de 40 första bär ordet i namnet | oförändrat |
| `bar` | 1 018, de 40 första bär ordet i namnet | 1 032, de 40 första bär ordet i namnet |

**Kontrollproven:** `qzxvwk flurbentz` ger noll, `sturehof` ger exakt en och
`sturehov` ger "Menade du Sturehof?". Oförändrat före och efter.

`pizzeria odenplan` ger EN exakt träff, och det är rätt svar och inte ett
magert. Brillo Pizza är den enda verksamhet i registret som både bär
kategorin Pizza och har Odenplan som närmaste hållplats. En pizzeria 150
meter bort vars närmaste hållplats heter Vasaparken hittas inte som exakt
träff, se 6.5.

### 6.3 Ett fel som hittades på vägen

Första bygget med hållplatserna flyttade Döner & Co och Stations Grillen
förbi Holy Kebab Gränby och Amandas & Kebab house på `kebab uppsala`. Ingen
av de två bär ordet i namnet. Skälet var frasbonusen: Döner & Co har
kategoritexten "Pizza pizzeria pizzor Kebab" och hållplatsen "Uppsala
Centralstation", alltså stod "kebab uppsala" i följd över skarven mellan två
fält, och raden fick bonusen för hela frågan i följd.

Samma skarv fanns redan mellan kategori och område. Före ändringen låg Sea
sushi och Hana Sushi först på `sushi södermalm` av just det skälet: de bär
kategorin Sushi och området Södermalm i följd. Frasbonusen räknas numera bara
inom namn, adress och ort, se `extraStart` i `lib/sokforslag.ts`. Efter
rättningen står `kebab uppsala` exakt som före, och `sushi södermalm` leds av
ställen vars namn börjar med Sushi.

### 6.4 Kostnaden

| | Rått | Gzip |
|---|---:|---:|
| Före | 1 218 074 byte | 405 539 byte |
| Efter | 1 247 304 byte | 419 419 byte |
| Skillnad | +29 230, **+2,4 %** | +13 880, **+3,4 %** |

Gzip på standardnivå, samma som i §4. Tröskeln är det som håller talet nere:
alla 1 805 namngivna hållplatser hade kostat ungefär 36 kB, och det mesta av
den summan är nummer på rader vars hållplats bara ett eller två ställen har.

Rättningen i 6.3 kostar ingenting över tråden. Den ligger i klienten och gör
en andra vikning av den korta extratexten när registret landar.

### 6.5 Vad som valdes bort

- **Radien.** "Vid Odenplan" betyder här att Odenplan är den NÄRMASTE
  hållplatsen, inte att stället ligger inom ett visst avstånd från den. Ett
  verkligt avstånd hade krävt koordinater per hållplats i registret, alltså
  en andra sanning bredvid `narhet.ts`, och betydligt fler byte.
- **Ett "nära Odenplan" i raden.** En träff som bara står där för hållplatsen
  skrivs som "Norrtullsgatan 10 · Stockholm" under rubriken "1 träff".
  Raden påstår alltså inte att stället ligger på Odenplan, och ordet står
  inte i fetstil. Det är ett tyst svar men inte ett falskt, så det ändrades
  inte.
- **Hållplatser under tio ställen.** Tjugotvå kilobyte till för gathörn som
  ingen använder som platsnamn.
- **Ordningen på `café örebro`.** Den leds av ställen vars namn börjar med
  Örebro, före dem som heter Café något. Så var det före ändringen också, och
  det hör till hur orden viktas mot varandra, inte till platsordet.
