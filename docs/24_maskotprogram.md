# 24. Maskotprogrammet

Prikko har en maskot. Det här dokumentet säger vem han är, var han får synas,
var han aldrig får synas, och hur han rör sig. Det är inte en stilguide för hur
han ritas, den bor i `brand/maskot/gravling.mjs` och i förslagsarket
`brand/maskot-forslag.html`. Det här är programmet: hur figuren bärs genom
produkten.

Skälet till att det behövs står i ägarens egen formulering av uppdraget: "nu
har vi en maskot, nu måste vi göra en deep task att faktiskt göra den till vår
maskot". En figur som bara finns som ett litet ansikte i en lista är inte en
maskot, det är en ikon.

---

## 1. Vem han är

**Han heter Prikko.** Samma namn som tjänsten, precis som Duo hos Duolingo.
Det är inte lättja utan grammatik: det gör att meningen "Prikko säger inga
anmärkningar" går att skriva. Hette han något annat vore han en tredje part som
råkade stå bredvid ett resultat.

**Han är en grävling.** Valet är inte estetiskt. Ordet *gräva* är svenskans
etablerade ord för granskning, genom Föreningen Grävande Journalister sedan
1990 och priset Guldspaden sedan 1991. Arten håller dessutom bevisligen sitt
gryt rent, med latringropar utanför och utbytt bäddmaterial. En tjänst som
gräver fram kommunernas kontrollrapporter har svårt att hitta en mer träffande
bild, och den är dessutom vår egen: ingen känd digital tjänst har en grävling.

**Vad han gör.** Han ser efter. Han tittar på det som andra inte orkade läsa,
och han säger vad han hittade. Han letar inte efter fel, han letar efter vad
som står i rapporten.

**Vad han bryr sig om.** Att det blir rätt. Inte att någon får skämmas.

**Hur han reagerar.** Nyfiket när han söker, uppmärksamt när han hittar,
bekymrat när något är illa. **Aldrig skadeglatt, aldrig triumferande, aldrig
förebrående.** Det är den viktigaste meningen i hela dokumentet, och den styr
varje senare ritning: vi rapporterar en myndighets kontroll, vi anklagar ingen.

**Tonläget i text runt honom** följer `18_sprakregler.md` oförändrat. Maskoten
ändrar inte hur vi skriver. Han pratar inte, han har inga repliker, och han får
aldrig lägga ord i munnen på tjänsten.

---

## 2. Var han får synas, och var han aldrig får synas

Det senare är den viktigare halvan. Ett system utan förbud glider.

### Den bärande gränsen

**Maskoten får aldrig stå bredvid en bedömning av en namngiven verksamhet.**

Vi publicerar myndighetsbeslut om enskilda företag. En figur bredvid "brister
som kvarstår" hos en namngiven restaurang gör en myndighetsuppgift till ett
skämt, och läses lätt som att vi hånar någon. Där står **bedömningsmärket**, som
är ett neutralt tecken och inte en karaktär.

Det ger en enkel delning som avgör varje enskilt fall:

| | Bedömningsmärket | Maskoten |
|---|---|---|
| Vad det är | DATA om en verksamhet | AVSÄNDARE, alltså sajten själv |
| Färg | Grön, gul, röd eller grå | **Alltid Prikkoblå** |
| Form | Ansiktet beskuret i rundad kvadrat | Hela figuren med kropp |
| Var | Listor, kartnålar, sökträffar, verksamhetssidan | Där ingen verksamhet bedöms |
| Antal per sida | Tusentals | **Ett** |
| Komponent | `FaceMark.astro` | `Maskot.astro` |

Att maskoten alltid är blå är en del av samma regel. Bedömningsfärgerna betyder
något om ett företag, och den betydelsen får inte smitta av sig på en figur som
bara säger att en sida är tom.

### Får synas

| Yta | Läge | Skäl |
|---|---|---|
| **404** | `fyrafyra` | Ingen verksamhet finns. Sajten talar i eget namn. Byggd. |
| **Favicon och app-ikon** | Ansiktet i rundad kvadrat, blå | Ikonen säger vem sajten är. Byggd. |
| **Tomma lägen** | `tom` | Sökning utan träffar, konto utan bevakningar, kö utan poster. |
| **Startsidans hero** | `soker` eller `clean` | Sajten presenterar sig. Ingen enskild verksamhet på skärmen. |
| **Om, metod, kontakt** | `clean` | Sidor där tjänsten talar om sig själv. |
| **Delningsbilder** | Valfritt | Kommunikation, inte produkt. Se nedan. |

### Får aldrig synas

1. **Bredvid en bedömning av en namngiven verksamhet.** Verksamhetssidans
   märke, listrader, kartnålar, sökträffar, jämförelserutan. Utan undantag.
2. **I en lista, i mängd.** Maskoten är ett per sida. En figur som upprepas
   femtio gånger på en skärm slutar vara en karaktär och blir ett mönster.
3. **I en bedömningsfärg.** Aldrig grön, gul eller röd. Se ovan.
4. **På granskningslistan** eller någon annan yta som pekar ut ett företag som
   misskött. Där är figuren inte bara olämplig, den är ett omdöme.
5. **I felmeddelanden som beror på användaren**, till exempel ett formulär som
   inte gick igenom. En figur som ser bekymrad ut när någon skrivit fel läser
   som att den tycker något om personen.
6. **I sidhuvud och sidfot.** Där bor ordmärket. En maskot som alltid syns
   slutar betyda något.

---

## 3. Uttrycksregistret

Figuren har elva lägen. Sju är poser för det fria läget, fyra är
bedömningsmärkets lägen.

| Läge | Vad det säger | Var det används |
|---|---|---|
| `clean` | Öppet viloläge | Märket: inga anmärkningar. Figuren: neutralt. |
| `minor` | Tveksamhet | Märket: brister. |
| `major` | Bekymrat och bestämt | Märket: brister som kvarstår. |
| `none` | Neutralt, obedömt | Märket: ingen kontroll. |
| `soker` | Letar, blicken bortåt | Hero, laddlägen. |
| `hittat` | Uppmärksamt, lutar in | Ännu oanvänt. Kandidat: när en sökning ger många träffar. |
| `vantar` | Väntar på någon annan | Kö, obehandlad rättelse. |
| `nojd` | En handling gick igenom | Kvittens efter skickad rättelse eller sparad bevakning. |
| `tom` | Här finns ingenting | Tomma listor och resultat. |
| `fyrafyra` | Adressen leder ingenstans | 404. Byggd. |

**Vad som saknas.** Registret har inget läge för *tack*, alltså när någon
bidragit med en uppgift, och inget för *arbete pågår* som är längre än `vantar`.
Båda är kandidater, men ingen av dem ska ritas förrän det finns en yta som
behöver dem. Ett uttryck utan plats är dekoration.

**Vad som aldrig ska ritas:** gråtande, arg mot betraktaren, pekande finger,
tummen ned. Alla fyra läser som omdömen om en person.

---

## 4. Rörelsen

Sajten har tre rörelser totalt och alla är korta. Maskoten ändrar inte det.

### Regler

1. **Rörelse bara där figuren är ensam på ytan.** Aldrig i en lista, aldrig i
   ett märke bredvid en verksamhet.
2. **Aldrig bredvid en bedömning.** En figur som rör sig bredvid "brister som
   kvarstår" är värre än en som står still där, eftersom rörelse drar blicken.
3. **`prefers-reduced-motion` gäller alltid**, och regeln är global i
   `tokens.css`. Varje pose är dessutom ritad som ett giltigt stillbildsläge,
   så det som blir kvar när rörelsen stängs av är korrekt och inte halvfärdigt.
4. **Loopar hålls under en sekund** och står stilla däremellan, eller loopar
   inte alls. Gångcykeln är 0,68 sekunder.

### Vad som finns

**Gångcykeln.** Åtta bildrutor med ojämna hålltider, 90, 70, 70, 110, 90, 70,
70, 110 ms. Kontaktlägena ligger kvar längre än passeringarna, och det är
skillnaden mellan billigt och dyrt: en ren `steps(8)` håller varje ruta lika
länge och den jämnheten läser ögat som mekanisk. Squash och stretch i kroppen,
och ansiktet släpar en ruta efter kroppen.

Den ligger som **egen fil**, `site/public/maskot/gang.svg`, och inte i HTML:en.
Åtta rutor är omkring 118 kB, vilket är oförsvarbart inlinat och gratis som
cachad fil som bara laddas där den används.

**Bedömningsmärkets två rörelser** lever kvar men är omritade mot grävlingens
geometri: munnens uppritning använder nu `pathLength="1"` i stället för ett
hårdkodat streckmönster, och blinkningen animerar ögonlockets egen geometri i
stället för att skala ett lock vars båda kanter rör sig åt olika håll.

Blinkningen gäller **bara vid `clean`**. Att låta en verksamhet med brister
blinka vore att sockra ett underkännande.

---

## 5. Produkt och kommunikation är två discipliner

Den vanligaste missen med en maskot är att blanda dem.

**I produkten** är figuren återhållsam, står stilla, och finns bara där ingen
verksamhet bedöms. Reglerna ovan gäller utan undantag.

**I kommunikationen**, alltså delningsbilder, sociala medier och material om
tjänsten, är utrymmet större. Där finns ingen namngiven verksamhet på skärmen,
och därmed faller den bärande gränsen bort.

Men två regler följer med även dit: figuren bär aldrig en bedömningsfärg, och
han uttalar sig aldrig om en enskild verksamhet. En delningsbild där Prikko står
bredvid ett företagsnamn är samma fel som i produkten, bara i ett annat format.

---

## 6. Vad som återstår

- Tomma lägen är ännu inte byggda. Sökningen utan träffar renderas i
  webbläsaren och behöver en egen lösning.
- Startsidans hero är beslutad i princip men inte byggd.
- Utmärkelsen och matsnuskmärket bär i dag ordmärkets smiley. Om grävlingen är
  maskoten hör han troligen hemma där också, men det är ett större beslut och
  ett eget uppdrag: båda märkena laddas ner och sätts i fönster av verksamheter,
  alltså lämnar de sajten och kan inte ändras i efterhand.
