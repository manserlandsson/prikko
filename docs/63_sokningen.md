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

**Matkategorierna går fortfarande inte att söka på.** `pizzeria odenplan` ger
noll exakta träffar. Kartan filtrerar redan på tjugo matkategorier ur OSM, och
verksamhetssidan skriver redan ut stadsdelen, men ingen av dem når
fritextsökningen. Det som räddar frågan i dag är avfallet: de 600 delvisa
raderna är alla vid Odenplan, alltså får den som söker något användbart i
stället för ingenting. **Det är en mildring och inte en lösning.**

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
