# 48. Märket som spridningsmaskin

**Datum:** 2026-08-31
**Föregångare:** `docs/45_entreprenorslistan.md` § 6.5 belade att Danmark strök
elitesmileyn och byggde en kanal i stället, och flyttade upp B2 till B4 med en
QR-kod. `site/src/lib/emblem.ts` avsnitt 2 avgjorde att emblemet ska vara fryst
och inte dynamiskt. `site/src/pages/utmarkelser/[year]/marke.svg.ts` avgjorde
att märket ska vara generiskt. `docs/24_maskotprogram.md` § 2 drar gränsen mot
figurer bredvid en bedömning. `docs/46_filtaket.md` gav 100 000 som filtak.
**Beställning:** gör märket till det som får datan att lämna sajten.
**Utfall:** en egen QR-kodare utan beroenden och utan nätanrop, tre tryckfärdiga
format som byggs vid begäran och kostar noll filer i bygget, och ett andra märke
som alla får hämta.

---

## 1. Slutsatsen först

1. **QR-koden är egen kod, och den är verifierad avläst.** `site/src/lib/qr.ts`
   är en fullständig kodare enligt ISO/IEC 18004 för byte-läge, version 1 till
   10, alla fyra felkorrigeringsnivåer och alla åtta masker. Noll beroenden,
   noll anrop, varken vid bygget eller vid visningen. Verifieringen är gjord på
   tre oberoende sätt och står i § 2.
2. **Ett årtal och en länk är inte samma sak, och det är hela nyckeln.**
   `emblem.ts` avsnitt 2 förbjöd ett dynamiskt märke med fyra skäl. Alla fyra
   gäller fortfarande. Men de gäller BEDÖMNINGEN: "2026" påstår något om en
   verksamhet och kan bli osant. `/stockholm/ag/` är adressen till en sida och
   kan aldrig bli osann. Filerna som byggs här är dessutom NEDLADDNINGAR och
   inte inbäddningar, alltså blir vi ingen tredje part på någons webbplats och
   binder ingens sida till vår drifttid. § 6.
3. **Fönsterdekalen är 100 × 100 mm skuret, 110 × 110 med 5 mm utfall.**
   Danmark valde A5 stående, Storbritannien tre olika liggande mått. Vi valde
   ingetdera, och skälen med källor står i § 3.
4. **Certifikatet är A4 stående med 20 mm marginal.** Storbritannien slutade
   dela ut certifikat 2014. Vi delar ut ett ändå, och § 4 säger varför.
5. **Den andra märkesformen ska finnas, den heter hänvisningsmärke, och den är
   byggd.** Rekommendationen med motivering står i § 5. Kort: 254 av 17 066 är
   1,5 procent, och ett märke som bara toppen får är per konstruktion ett märke
   vars frånvaro säger något om alla andra.
6. **Hänvisningsmärket bär inget ansikte.** Första utkastet satte
   organisationens logotyp på det, alltså grävlingen. Det är fel enligt
   `docs/24` § 2, och det är fel av ett tyngre skäl: ett ansikte i ett
   restaurangfönster ÄR ett betyg, eftersom Danmark har lärt Europa att det är
   det. § 5.3.
7. **All text i filerna är KONTURER, inte text.** Första versionen satte
   texten som `<text>` med Instrument Sans först i en reservlista. Rastrerad på
   en maskin utan typsnittet installerat blev varenda rad Helvetica, alltså
   vårt ordmärke satt i någon annans typsnitt, på en dekal i ett skyltfönster.
   Nu ritas ordmärket ur `lib/wordmark.ts` och texten ur en genererad
   glyftabell. Priset är att bara vikt 400 finns, och varför står i § 8.
8. **Bygget kostar två filer, inte 34 386.** Dekalerna sätts ihop av
   `site/functions/api/marke.ts` vid begäran. Det enda som tillkommer i bygget
   är `/utmarkelser/senaste.json` och sidan `/dekal/`. § 6.2.

---

## 2. QR-koden

### 2.1 Kravet, och varför det uteslöt de vanliga vägarna

Kravet var hårt: ingen tredjepartstjänst och inget externt anrop, varken vid
bygget eller vid visningen.

Det utesluter bildtjänsterna av två skäl. En bild från `api.qrserver.com` eller
Googles gamla chart-API skickar adressen till en enskild verksamhet till någon
annan varje gång ett märke skapas, och tjänsten kan läggas ned. Det senare har
hänt: Google Infographics stängdes.

Det utesluter också npm-paketen, fast av ett mildare skäl. Ett paket hade klarat
båda kraven. Men de vanliga paketen drar in en canvas-renderare, en PNG-skrivare
och en Node-beroende filskrivare, och ingen av de tre går att köra i en
Cloudflare-funktion. Vi behöver modulmatrisen och ingenting annat, och det är
320 rader.

### 2.2 Vad som är byggt

`site/src/lib/qr.ts`. Byte-läge, version 1 till 10, nivåerna L, M, Q och H, alla
åtta masker med den fullständiga straffuträkningen, Reed-Solomon i GF(256) med
primitivpolynomet 0x11D, BCH för både format- och versionsinformation.

Taket på version 10 är mätt och inte godtyckligt. Den längsta adressen i
beståndet är 149 tecken, medianen 46, och 692 av 17 066 är längre än 62. Version
10 på nivå M rymmer 213 byte, alltså 64 byte marginal till den längsta adress vi
har. Går en adress ändå inte in kastar kodaren ett fel med talen i; den ritar
aldrig en kod utan plats för sitt innehåll.

Nivån är M, alltså 15 procents felkorrigering. Det är branschens normalval för
tryck, och varje steg uppåt gör koden tätare och därmed modulerna mindre vid en
given fysisk storlek. Det är fel väg för något som ska läsas genom ett fönster.
Noterat och accepterat: nivå H rymmer bara 122 byte och hade alltså inte klarat
den längsta adressen i beståndet.

Alfanumeriskt läge är bortvalt, och det är ingen förlust. Det packar 5,5 bitar
per tecken i stället för 8, men dess teckenuppsättning är versaler och våra
adresser är gemener. `/STOCKHOLM/AG/` är en annan sida än `/stockholm/ag/`, så
vinsten hade varit noll och risken en trasig länk.

### 2.3 Verifieringen, och vad den bevisar

**Den är verifierad avläst. Tre oberoende sätt, i stigande styrka.**

**Ett: jämförelse mot en mogen referens.** 865 koder genererades ur verkliga
adresser ur beståndet, i fyra nivåer, med minst en kod per version 1 till 10.
Matriserna jämfördes modul för modul mot `segno`, ett etablerat pythonbibliotek,
tvingat till samma version, nivå och mask.

Det var den jämförelsen som hittade den enda allvarliga buggen. Formatfältets
femton bitar skrevs **transponerat**: `cells[8 * size + i]` där det skulle stå
`cells[i * size + 8]`. Koden såg ut som en QR-kod, ritade sina sökmönster och
sin data rätt, och gick inte att läsa en enda gång av 865 försök. Efter
rättningen skiljer sig matriserna bara i utfyllnadskodorden, alltså i den del
som ligger efter datan och som varje avkodare hoppar över. Vår ordning följer
§ 8.4.9 i standarden; segno lägger en extra nollbyte före utfyllnaden. Båda är
läsbara, och skillnaden är noterad i stället för bortförklarad.

Funktionen skriver nu sina koordinater genom en namngiven `put(x, y)` i stället
för att räkna index för hand, så att just det felet inte går att skriva igen.

**Två: en avkodare skriven för ändamålet.** En fristående avkodare i Python
läser matrisen som en avkodare gör det, alltså utan att veta hur den kodades:
formatfältet ur bilden med BCH-kontroll, blockstrukturen ur tabellen,
Reed-Solomon-syndromen räknade i GF(256), och nyttolasten ur bitströmmen.

> **865 av 865 rätt.** Formatets BCH stämmer, samtliga RS-syndrom är noll,
> läget är byte-läge, och texten är exakt den som kodades.

Nollställda syndrom är det starka i det svaret: de säger att felkorrigeringen är
matematiskt konsistent med datan, inte bara att en avkodare råkade gissa rätt.

**Tre: en riktig scanner på den färdiga filen.** OpenCV:s `QRCodeDetector`,
samma sorts avkodare som sitter i en telefon, kördes på bilder av koderna.

| Vad | Utfall |
|---|---|
| 865 genererade koder, 8 px per modul | 846 rätt, 19 missar |
| Samma 865 adresser genom `segno`, samma bilder, samma detektor | 844 rätt, **21** missar |

Alltså: vår kodare läses **något bättre** än ett moget referensbibliotek av
samma detektor. Missarna är detektorns och inte kodarens, vilket den oberoende
avkodaren i steg två bevisar oberoende.

**Och slutligen på det som faktiskt levereras.** De sju färdiga filerna
byggdes genom funktionen, rastrerades med sharp, skalades ned till fem
upplösningar mellan 600 och 2 000 pixlars bredd, och lästes:

| Fil | Avkodad till exakt rätt adress |
|---|---|
| Hänvisningsdekal | ja |
| Hänvisningsark, A4, två koder | ja, båda |
| Utmärkelsedekal | ja |
| Utmärkelseark, A4, två koder | ja, båda |
| Certifikat | ja |
| Certifikat med beståndets längsta namn | ja |
| Dekal med beståndets längsta adress, 149 tecken, version 10 | ja |

**Det som INTE är verifierat, och som ska stå:** ingenting av det här är gjort
med en telefon på en tryckt dekal bakom glas. Rastreringen är en simulering av
en kamerabild, inte en kamerabild. Ingen normgivande källa säger heller något
alls om avläsning genom glas. Innan måtten låses för en riktig tryckeriorder ska
ett provexemplar tryckas och skannas på 30, 40 och 50 centimeters håll med både
en iPhone och en billig Android. Det är den enda mätning som återstår, och den
kräver papper.

---

## 3. Fönsterdekalen

### 3.1 Vad Danmark och Storbritannien faktiskt använder

**Danmark.** Smileymærket är **A5 stående, 148 × 210 mm**, i färg på vit botten.
Uppvisningsplikten står i **BEK nr 1225 af 25/11/2024 § 20 stk. 2**: märket ska
hängas vid entrén "så det til stadighed er let synligt og læsbart for
forbrugerne, inden de betræder virksomhedens forretningsområde". § 20 stk. 1
säger att märket bär "kontrolhistorik og QR-kode til virksomhedens side på
www.findsmiley.dk". § 24 stk. 1 kräver länk från egen webbplats "eller andre
digitale platforme", och § 26 gör underlåtenhet bötesbelagd.

En rättelse mot beställningens premiss: **kontrolrapporten ska inte längre
hängas upp.** Sedan oktober 2023 ersätter smileymærket den fullständiga
rapporten, och BEK 1225 innehåller ingen uppvisningsplikt för rapporten alls.

QR-kodens mått är **inte publicerat**. Mätt på Fødevarestyrelsens egen pressbild
är den 72 av 512 pixlar bred, alltså 14 procent av märkets bredd eller ungefär
20 till 21 mm vid A5, och 21 moduler bred, vilket är version 1. Den siffran är
vår egen mätning på en pressbild och ingenting annat.

**Storbritannien.** Tre olika mått, varav två i lag:

| Var | Mått | Källa |
|---|---|---|
| England, FSA:s eget tryckoriginal | 195 × 132 mm liggande | "Actual dimensions: Awaiting Inspection: 195mm x 101mm, Sticker: 195mm x 132mm" |
| Wales | 190 × 158 mm | Food Hygiene Rating (Wales) Regulations 2013, Schedule 1 |
| Nordirland | 195 × 136 mm | Food Hygiene Rating Regulations (NI) 2016, Schedule 1 |

Ingen av dem bär en QR-kod. Dekalen bär FSA-logotypen, adressen
`food.gov.uk/ratings` i klartext, och sifferraden noll till fem med det aktuella
betyget ifyllt.

### 3.2 Vårt val, och varför det blev ett tredje mått

**100 × 100 mm skuret. 110 × 110 mm med 5 mm utfall. 4 mm skyddsmarginal.
QR-koden 42 mm på hänvisningsdekalen och 38 mm på utmärkelsedekalen, tyst zon
inräknad.**

Varför inte Danmarks A5: deras märke bär en kontrollhistorik i klartext och
måste vara stort nog att läsa. Vårt bär en länk. Ett A5 med en QR-kod och tre
rader text är mest tomt papper.

Varför inte de brittiska liggande måtten: de är byggda kring sifferraden noll
till fem, som är själva innehållet i den dekalen. Vi har ingen sådan skala och
ska aldrig ha en. Utan raden finns ingen anledning till ett liggande format.

Varför 100 × 100: det är det enda kvadratiska mått som är belagt som en
uttrycklig **fönsterdekalstorlek** och inte bara som klistermärke, hos
leverantörer som levererar till Sverige.

| Leverantör | Kvadratiska mått | 100 × 100 |
|---|---|---|
| Helloprint, raamstickers | 70×100, 100×100, 300×300, 400×400 och uppåt | ja |
| Helloprint, vierkante stickers | 20, 30, 40, 45, 50, 60, 80, 100, 150 mm | ja |
| Sticker Mule EU | 50, 75, 100, 125 mm | ja |
| Vistaprint UK | 38, 50, 76 mm | nej |

Utfallet är 5 mm och inte ett snitt: Helloprint kräver 5 mm runt om och 3 mm ned
till viktiga element, Sticker Mule nöjer sig med en sextondels tum, alltså cirka
1,6 mm. En fil med 5 mm fungerar hos båda. En med 1,6 mm gör det inte.
Skyddsmarginalen är 4 mm, alltså en millimeter mer än Helloprints krav: en text
som slutar en millimeter från kanten ser felskuren ut även när den inte är det.

### 3.3 QR-kodens storlek, med de tal som finns

| Källa | Vad den säger | Vårt läge |
|---|---|---|
| GS1, X-dimension | minst 0,396 mm, mål 0,495 mm, max 0,990 mm | 38 mm och beståndets längsta adress, alltså version 10 med tyst zon: 38/65 = **0,58 mm**. Medianadressen, version 4: 38/41 = **0,93 mm**. |
| GS1, tyst zon | fyra moduler runt om | fyra, ritade i filen |
| GS1, provtabell feb 2025 | kod med logotyp i mitten föll vid 26 mm, klarade sig vid 37 mm | 38 och 42 mm, utan logotyp i mitten |
| Nielsen Norman Group | minst 2 × 2 cm, plus 1 cm per 10 cm läsavstånd | 3 till 5 cm vid en dörr; vi ligger på 3,8 till 4,2 |
| Denso Wave | minst fyra skrivarpunkter per modul; 0,5 mm på termo 200 dpi | 0,58 mm i värsta fall |

En ärlig avvikelse: beståndets **kortaste** adress ger version 3 och därmed
38/37 = 1,03 mm per modul, alltså strax över GS1:s tak på 0,990. Det taket
handlar om kassascannerns synfält och inte om en telefonkamera. Noterat och
accepterat.

Tre saker som **inte** är belagda och som därför inte används som argument
någonstans i koden: regeln "läsavstånd delat med tio" har ingen standard bakom
sig, ISO/IEC 18004 har inte lästs och sätter så vitt vi vet inget fysiskt
minimimått, och ingen källa säger något om avläsning genom glas.

### 3.4 Färgrymden

**SVG kan inte bära CMYK.** Formatet har ingen färgrymd utöver sRGB. Att kalla
en SVG tryckfärdig i CMYK vore att skicka ett tryckeri en fil som ser rätt ut
och separeras fel.

Det som görs i stället är det ett tryckeri faktiskt vill ha:

1. Färgen står som sRGB-hexadecimal, `#007BE0`, exakt samma värde som allt annat
   märkesblått.
2. Filens huvud bär måtten, utfallet och uppmaningen att separera med
   tryckeriets egen profil. Vilken CMYK-blandning som är rätt beror på papperet,
   och ett tal vi hittar på blir fel på hälften av jobben.
3. **QR-koden är ren svart**, aldrig djupsvart. Det är den enda hårda
   tryckregeln i filen: en fyrfärgssvart kod blir suddig i kanterna så fort
   passningen glider en hårsmån, och en QR-kod lever på sina kanter.
4. Den vita plattan under koden ritas alltid, även mot vit botten, eftersom GS1
   uttryckligen kräver en matt ogenomskinlig vit yta när koden trycks på
   genomskinligt material. Fönsterdekaler är ofta genomskinlig film.

### 3.5 A4-arket, för den som inte beställer tryck

Samma dekal i verklig storlek, två stycken stående på ett A4, med streckad
klipplinje och utan utfall och skärmärken. En kontorsskrivare kan inte trycka
till kanten och ingen klipper efter skärmärken hemma.

Två och inte fyra: fyra hade krävt 200 mm bredd på ett papper som är 210, alltså
5 mm marginal, vilket ligger innanför vad de flesta kontorsskrivare klarar. Två
stående ligger mitt på arket med 55 mm luft på sidorna.

---

## 4. Certifikatet

A4 stående, 210 × 297 mm, 20 mm marginal. Kransen 120 mm bred överst,
verksamhetens namn, meningen om vad utmärkelsen avser med datumet utgåvan
frystes, en QR-kod på 36 mm, adressen i klartext under den, och längst ned
förbehållet att utmärkelsen är ett erkännande från Prikko och inte ett
myndighetsbeslut.

**20 mm marginal och inte 10.** De flesta kontorsskrivare vägrar trycka de
yttersta fem till sex millimetrarna. Med 20 mm kan ingenting hamna i det
otryckbara fältet oavsett skrivare, och det ser dessutom ut som en marginal på
ett diplom.

**Certifikatet är det enda av de tre formaten som bär ett NAMN, och det enda som
bara 254 kan hämta.** De två sakerna hänger ihop. Ett papper med ett företagsnamn
och en lagerkrans PÅSTÅR något, alltså måste påståendet gå att slå upp. Namnet
hämtas därför ur `/utmarkelser/senaste.json` och aldrig ur frågesträngen; annars
hade vem som helst kunnat be om ett Prikko-certifikat med vilket företagsnamn
som helst på.

**Storbritannien slutade dela ut certifikat 2014.** FHRS Brand Standard v8 säger
att policyn ändrades och att intyg inte längre ingår. Vi delar ut ett ändå, och
skälet är att våra två program inte är samma sak. FHRS ger ett betyg till alla,
och då är ett papper med betyget på bara en andra kopia av dekalen. Vår
utmärkelse går till 254 av 17 066, alltså 1,5 procent, och den sortens sällsynt
erkännande är precis vad ett diplom är till för. Michelin trycker fortfarande
sina.

Meningen mitt på sidan är samma mening som emblemsidan skriver, ord för ord, i
förfluten tid och med ett datum i. Ett diplom som säger "är en av de bästa"
åldras till en lögn. Ett som säger vad som gällde en namngiven dag gör det
aldrig.

---

## 5. Den andra märkesformen

### 5.1 Rekommendationen

**Ja, den ska finnas. Den heter hänvisningsmärke, den får alla, och den är
byggd.** `/dekal/`, `typ=hanvisning`.

### 5.2 Motiveringen

**Räkningen.** 254 av 17 066 är 1,5 procent. De övriga 16 812 har ingenting att
sätta upp, och merparten av dem har inte en enda anmärkning: de har bara inte
den längsta obrutna raden i sin kommun, vilket är en jämförelse mot grannen och
inte ett omdöme om dem. Ett program som bara belönar toppen når inte ut, och
spridning är hela poängen.

**Regeln, och varför den kräver just den här formen.** Den absoluta regeln är
att vi aldrig delar ut ett märke som säger att någon är dålig, och att märkets
frånvaro aldrig får bli ett påstående. Se `docs/24` § 2.

Andra halvan är den svåra. Så fort ett märke har ett kvalitetsvillkor blir
grannen utan märke en verksamhet som inte kvalificerade sig, och då har vi
publicerat ett negativt omdöme genom att inte publicera något. Det är exakt den
mekanism som gjorde det dynamiska emblemet omöjligt i `emblem.ts` avsnitt 2.

Hänvisningsmärket klarar regeln därför att det **inte har något villkor alls**.
Varje verksamhet med en sida hos oss kan hämta det, oavsett vad kontrollen
visade, och det står uttryckligen på sidan. Då säger frånvaron bara att någon
inte hämtat det, vilket är ett påstående om en nedladdning och inte om en
verksamhet.

Det gör den dessutom fri från hela problemet med negativa märken på ett sätt
utmärkelsen aldrig kan bli: den påstår ingenting alls.

### 5.3 Formen, och den ändring som gjordes efter första ritningen

Första utkastet satte organisationens logotyp överst på hänvisningsdekalen,
alltså grävlingen ur `public/prikko-mark.svg`. Det ritades, rastrerades och
tittades på, och det var fel.

**Fel enligt vår egen regel.** `docs/24` § 2 säger att maskoten aldrig får stå
bredvid en bedömning av en namngiven verksamhet. En dekal på en namngiven
restaurangs dörr, ett skann från "brister som kvarstår", är det läget. Figuren
läses som att hon går i god för stället.

**Fel av ett tyngre skäl.** Ett ansikte i ett restaurangfönster ÄR ett betyg.
Danmark har i tjugo år lärt hela Europa att en smiley på en dörr är
myndighetens omdöme, och deras smileymærke bär både symbolen och QR-koden. Vårt
märke säger ingenting om resultatet. Med ett ansikte på läser förbipasserande
ett betyg som inte finns, och då blir märkets frånvaro hos grannen också ett
betyg. Det är precis den mekanism hela hänvisningsmärket byggdes för att slippa.

Det gäller vilket ansikte som helst, också vår egen blå. Att blått betyder
avsändare och färgat betyder bedömning är vårt interna system, och ingen utanför
huset känner till det.

**Alltså är hänvisningsmärket rent typografiskt:** ordet `prikko.se`, meningen
"Se kommunens kontroller av oss", koden, och underst "Alla kontroller, som de
står i kommunens rapport." Det ska läsas som en hänvisning, och en hänvisning
ser ut som en adress.

**Märket bär heller inget namn.** Det behöver inget: det sitter på dörren till
den verksamhet det gäller, och koden leder dit. Ett märke utan namn kan dessutom
inte bli fel den dag stället byter ägare. Det är också skälet till att
hänvisningsmärket inte behöver slå upp någonting alls, alltså till att
`/utmarkelser/senaste.json` bara innehåller de 254 och aldrig alla 17 066: den
som saknas i en lista över utmärkta ska inte gå att räkna fram ur en fil.

### 5.4 Vägen in

Ingen `<select>` med 17 066 rader. Vägen är verksamhetens egen sida:
`ActionPanel.astro`, alltså ägarens ruta, bär raden **"Sätt upp märket i
fönstret"** med adressen i länken. Det följer principen att en funktion sker där
man står och aldrig kostar en egen sida.

`/dekal/` finns ändå som sida, och den är motiverad på samma grund som
emblemsidan: den svarar på en sökning vi annars inte har någon sida för, och den
måste finnas för att villkoren ska gå att läsa innan filen hämtas. Ett märke som
laddas ner utan att någon läst villkoren hamnar förr eller senare i ett fönster
med ordet "godkänd" bredvid sig.

---

## 6. Arkitekturen

### 6.1 Varför emblem.ts avsnitt 2 inte behövde rivas

`emblem.ts` avsnitt 2 gav fyra skäl mot ett dynamiskt märke. Alla fyra står
kvar. Skillnaden som gör det här bygget tillåtet ska vara utskriven, och den är
tvådelad.

**Ett årtal kan bli osant. En länk kan inte det.** "2026" påstår något om en
verksamhet. Räknades siffran om vid varje visning blir märkets försvinnande ett
offentligt påstående om att något hänt, publicerat av oss på någon annans
fönster. `/stockholm/ag/` är adressen till en sida. Den pekar på samma sida i
dag och om tre år, och det den sidan visar är dagens bedömning.

**En nedladdning är inte en inbäddning.** De tre andra skälen i avsnitt 2 gäller
en `<img>` som hämtas från oss vid varje sidvisning hos verksamheten:
spårpixeln, bindningen till vår drifttid. Filerna här skapas en gång och lever
sedan utan oss. En dekal i ett fönster hämtar ingenting från oss, och den som
skannar koden väljer det själv.

**Kodsnutten till webben är oförändrad.** Den pekar fortfarande på den generiska
`/utmarkelser/2026/marke.svg`, av exakt de skäl som står i `emblem.ts`.

### 6.2 Varför filerna byggs vid begäran

`marke.svg.ts` säger att märket är generiskt med skälet att ett märke med namn i
hade krävt 1 541 filer. En QR-kod per verksamhet är samma problem i värre skala:
17 066 dekaler plus 17 066 ark plus 254 certifikat är **34 386 filer** i ett
bygge som mätt 2026-08-31 ligger på 18 050 av 100 000. `docs/46` mätte 17 011
dagen innan; beståndet har vuxit sedan dess, och taket är detsamma.

Alltså byggs de inte. `site/functions/api/marke.ts` är en Cloudflare Pages
Function bredvid den som redan finns för rättelser, och den sätter ihop filen
när någon ber om den.

Två saker gör att den kan det utan att duplicera något:

**Ritningarna hämtas ur vårt eget statiska bygge.** `lib/marke.ts` upptäcker
sina ritningar med Vites `import.meta.glob` och går inte att importera in i en
Pages Function, som bundlas av esbuild utan Vite. Funktionen hämtar i stället
`/utmarkelser/2026/marke.svg` via `env.ASSETS`. Det är bättre än en import och
inte en nödlösning: `marke.svg.ts` skriver själv att bilden sidan visar och
filen verksamheten laddar ner måste vara samma URL, annars glider de isär. Den
regeln gäller nu också dekalen.

**Ritandet ligger i `src/` och delas.** `lib/qr.ts` och `lib/dekal.ts` är ren
TypeScript utan Vite-beroenden. Funktionen importerar dem över kataloggränsen,
och emblemsidan och `/dekal/` ritar sina förhandsvisningar ur samma två moduler.
Det man ser på sidan är alltså det man laddar ner.

Att importen över gränsen fungerar är kontrollerat och inte antaget: filen
bundlades med `esbuild --bundle --format=esm --platform=neutral`, samma bundlare
Pages använder, och landar på 26 kB utan varningar.

**Existenskontrollen kostar ingen datafil.** Funktionen frågar inte en lista om
verksamheten finns, den hämtar verksamhetens egen sida och läser statuskoden.
Finns sidan finns verksamheten, och koden pekar på just den sidan. En lista över
17 066 nycklar hade varit en halv megabyte som dessutom måste hållas i takt.

### 6.3 Vad som tillkom i bygget

| Fil | Vad | Storlek |
|---|---|---|
| `/utmarkelser/senaste.json` | de 254 innehavarna, namn och kommun | omkring 20 kB |
| `/dekal/` | sidan för hänvisningsmärket | en sida |

Två filer. Inte 34 386.

---

## 7. Vad som valdes bort

**Ett npm-paket för QR.** Klarade kraven men går inte att köra i en Worker utan
att först skala bort tre fjärdedelar. § 2.1.

**Alfanumeriskt QR-läge.** Kortare kod, men kräver versaler, och sökvägen efter
domänen är skiftlägeskänslig. § 2.2.

**Nivå Q eller H på felkorrigeringen.** Tätare kod, mindre moduler vid samma
fysiska storlek, och H rymmer inte ens beståndets längsta adress. § 2.2.

**En bild per verksamhet i bygget.** 34 386 filer. § 6.2.

**En lista över alla 17 066 i funktionen.** En halv megabyte som måste hållas i
takt med datan, när en statuskod räcker. § 6.2.

**Verksamhetens namn på dekalen.** Behövs inte, eftersom dekalen sitter på
dörren till den verksamhet den gäller, och blir fel den dag stället byter ägare.
§ 5.3.

**Ett ansikte på hänvisningsmärket.** Ritat, rastrerat, tittat på och förkastat.
§ 5.3.

**Ett certifikat till alla.** Ett diplom för att man existerar är inte ett
diplom, och det vore precis det slags påstående hänvisningsmärket finns till för
att slippa. Funktionen avvisar `form=certifikat` med `typ=hanvisning`.

**Vår egen CMYK-blandning i filen.** Vilken som är rätt beror på profilen, och
ett tal vi hittar på blir fel på hälften av jobben. § 3.4.

**Instrument Sans inbakad som base64 i varje fil.** Hela fontfilen i varje
dekal är över hundra kilobyte, och rätt avvägt att avvisa. Men det var fel
SLUTSATS, se § 8: den väg tryckerier faktiskt använder prövades aldrig.

**`textLength` som skydd mot att texten växer ut ur dekalen.** Det var den
första lösningen, och den var mätt fel. **librsvg ignorerar `textLength` helt**,
och librsvg är renderaren i sharp och i en mängd tryckeriverktyg. Mätt
2026-08-31 på fem rader ur de här filerna, renderade i 300 dpi och uppmätta på
bläckets utbredning:

| Deklarerad `textLength` | Faktiskt ritad bredd |
|---|---|
| 86 mm | 59,6 mm |
| 58 mm | 54,2 mm |
| 74 mm | 68,4 mm |
| 74 mm | 63,4 mm |

Attributet hade alltså skyddat i en webbläsare och inte i det program filen
faktiskt hamnar i, vilket är sämre än inget skydd eftersom det ser ut som ett
skydd. Det är dessutom ett skydd som kan bli fel åt andra hållet: `textLength`
tvingar EXAKT bredd, alltså sträcker det ut en kort rad lika gärna som det
klämmer ihop en lång.

**Den uppskattade radbredden som ersatte den.** Den räknade teckenantal gånger
teckengrad gånger 0,52, med tolv procents påslag för att inte underskatta. Den
fungerade, men den löste fel problem och den kostade läsbarhet: certifikatets
längsta namn uppskattades till 277 mm när det i verkligheten är 176, alltså
krympte raden till nästan hälften av vad som fick plats. Ersatt av en exakt
bredd ur fontens egna teckenbredder, se § 8.

**Att stödja bara SVG utan A4-ark.** En verksamhet med en kontorsskrivare och
ingen tryckeribudget är merparten av beståndet.

---

## 8. Typsnittet: konturer, och vad det kostade

### 8.1 Felet

Filerna satte all text som `<text>` med
`font-family="'Instrument Sans','Helvetica Neue',Helvetica,Arial,sans-serif"`,
och § 7 kallade det "att välja utbytet själv i stället för att låta tryckeriet
göra det". **Det stämde inte.** Vi valde inte utbytet, vi valde bara
reservlistan, och den listan ger Helvetica på varje maskin som inte har
Instrument Sans installerad som systemfont. Rastrerat med sharp på ägarens
maskin: Helvetica, varje rad.

Värst av allt gällde det ORDMÄRKET. Hänvisningsdekalen satte "prikko.se" som en
`<text>` i 10 mm fetstil. Ett ordmärke ÄR sin form. Ett ordmärke satt i
Helvetica är inte vårt ordmärke i fel typsnitt, det är ett annat ordmärke, och
den filen är gjord för att sitta i ett skyltfönster.

### 8.2 Ordmärket

Ritningen fanns redan i repot, som `<path>` i
`site/src/components/Wordmark.astro`. Den ligger nu i `site/src/lib/wordmark.ts`
i stället, och komponenten läser därifrån. Flytten var nödvändig och inte
kosmetisk: dekalen sätts ihop av `functions/api/marke.ts`, som Cloudflare Pages
bundlar för sig med esbuild, och en `.astro`-fil går inte att importera dit.
Alternativet hade varit att skriva av kurvorna, alltså två ordmärken så fort
någon rättar det ena.

Komponenten är oförändrad utåt: samma props, samma DOM, samma klass `eye-right`
som sidhuvudets blinkning hakar i.

### 8.3 Brödtexten

Vägen som aldrig prövades är den tryckerier faktiskt använder: **gör om texten
till konturer.** Bara de glyfer som används, inte hela fonten.

Tre frågor skulle besvaras, och svaren är:

**Finns fontfilen i repot?** Ja. `@fontsource-variable/instrument-sans` ligger
i beroendena och levererar tolv `.woff2`, varav
`instrument-sans-latin-wght-normal.woff2` täcker U+0000 till U+00FF, alltså å,
ä, ö och é. Licensen är SIL OFL 1.1, som uttryckligen tillåter att glyfer bakas
in i ett dokument.

**Går glyferna att läsa utan ett nytt beroende?** Ja, och det var en
överraskning. `fontkitten` ligger redan i `node_modules`, inte för att vi bett
om den utan för att **Astro** drar in den genom `@capsizecss/unpack` och
`fontace`. Den packar upp woff2, läser cmap, glyf och hmtx, och ger både
`glyph.path.toSVG()` och `glyph.advanceWidth`.

**Vid bygget eller i funktionen?** Ingetdera. Utdraget sker EN gång, av
`site/scripts/importera-typsnitt.mjs`, och resultatet checkas in som
`site/src/typsnitt/instrument-sans-400.ts`. Exakt samma mönster som
`scripts/importera-marke.mjs` och `src/marks/`. Skälen:

* I funktionen finns ingen fontparser och ingen anledning att packa upp en
  woff2 vid varje hämtning av en dekal.
* Vid bygget vore det arbete för ett resultat som är identiskt varje gång.
* Som incheckad modul är den granskningsbar, den kan inte fälla ett bygge, och
  den fortsätter fungera även om Astro byter bibliotek. Det sista är hela
  skälet till att lånet av `fontkitten` är försvarbart: **bara skriptet slutar
  gå att köra, aldrig sajten.** Först den dag någon vill dra ut nya tecken
  behöver frågan lösas, och då är svaret en rad i `package.json`.

Tabellen är 321 glyfer och 90 kB, alltså hela latin plus latin-ext. Bara 78
tecken behövs för dagens 254 vinnare, 13 kommunnamn och samtliga fasta rader,
men ett framtida verksamhetsnamn med ett Č i ska inte bli ett hål i ett
diplom.

### 8.4 Vad det kostade: bara vikt 400

**Det här är den punkt där ett beslut behöver fattas av ägaren.**

Instrument Sans levereras från fontsource bara som VARIABEL font, med en
viktaxel från 400 till 700. Att läsa vikt 500 eller 700 ur den kräver att
fontens `gvar`-deltan appliceras.

`fontkitten` har ett `getVariation()`, och **det fungerar inte för woff2**.
Mätt 2026-08-31: metoden bygger en ny `TTFFont` ur `this.stream.buffer`, vilket
för en woff2 är den brotlipackade behållaren och inte en TTF. Fonten som kommer
tillbaka saknar `maxp`, `cmap` och `glyf`, och varje uppslag kastar. Att i
stället konstruera den interna klassen direkt med variationskoordinater kastar
på privata fält. Fonten har `fvar`, `gvar` och `HVAR`, alltså är det biblioteket
som saknar förmågan och inte filen som saknar datan.

Alltså finns bara standardinstansen, alltså vikt 400.

**Följden är gjord till en formfråga i stället för en brist:** hierarkin sätts
med STORLEK och FÄRG i stället för med fetstil. Certifikatets namn står i 12 mm
brandblått med luft omkring i stället för 11 mm fetstil, vilket är så de flesta
graverade diplom faktiskt ser ut. Dekalernas rubriker är en halv millimeter
större än förut.

**Vill vi ha riktig fetstil krävs ett nytt beroende, och det är ett val:**

| Alternativ | Vad det är | Kostnad |
|---|---|---|
| `fontkit` | fontkittens stora syskon, riktigt stöd för variabla fonter | ett nytt paket, omkring 1 MB, bara som devDependency eftersom utdraget sker offline |
| `@fontsource/instrument-sans` | den statiska varianten, en fil per vikt | ett nytt paket, men då kan `fontkitten` läsa varje viktfil direkt eftersom problemet bara gäller instansiering av variabla fonter |

Den andra raden är den billigare och den mer robusta: den tar bort behovet av
variabelstöd helt i stället för att lägga till det. Ingen av dem hamnar i
Workern, eftersom utdraget sker i skriptet.

### 8.5 Vad konturerna gav gratis

**Radbredden är nu exakt.** `textWidth` summerar glyfernas egna teckenbredder
ur samma tabell som sedan ritar raden, alltså kan talet inte skilja sig från
ritningen. Krympningen finns kvar men bara för certifikatets namnrad, och den
är inte längre grov: beståndets längsta namn är 176,4 mm i 12 mm och krymps
till 10,2 mm. Den gamla uppskattningen sa 277 mm och hade krympt samma namn
till 6.

**Filen ser likadan ut överallt.** Det finns ingen font att sakna.

### 8.6 Priset i byte

| Fil | Före, med `<text>` | Efter, med konturer |
|---|---:|---:|
| Hänvisningsdekal | 4 567 B | 29 144 B |
| Hänvisningsark, A4 | 5 001 B | 49 412 B |
| Utmärkelsedekal | 15 958 B | 43 221 B |
| Certifikat | 17 261 B | 144 085 B |
| Funktionens bunt | 25,8 kB | 119,7 kB |

Certifikatet är åtta gånger större, och det är den enda siffran som är värd att
tänka på. Den är ändå försvarbar: ett tryckfärdigt A4 som PDF ligger normalt på
200 kB till ett par megabyte, alltså är 144 kB i underkant för vad ett tryckeri
förväntar sig. Vill vi ned finns en känd väg som inte är tagen: lägga varje unik
glyf en gång i `<defs>` och instansiera med `<use>`. Den skulle ungefär tredela
certifikatet men gör filen svårare att öppna i program med svagt `<use>`-stöd,
och den ska inte tas förrän någon klagat på storleken.

**Varken kerning eller ligaturer läses.** Fonten har en `GPOS`-tabell med
parvisa justeringar som den här koden hoppar över, så par som "Av" och "To" står
någon tusendels em glesare än i en webbläsare. Det syns inte i de storlekar
filerna använder, men det ska stå skrivet och inte upptäckas.

---

## 9. Det som inte är mätt

1. **Ingen tryckt dekal har skannats med en telefon.** All avläsning är gjord på
   rastrerade filer. Ett provexemplar ska tryckas och skannas på 30, 40 och 50
   centimeters håll, genom glas, med både iPhone och en billig Android. § 2.3.
2. **Funktionen har inte körts i drift.** Den är bundlad med Pages egen bundlare
   och körd lokalt mot ett efterliknat `env.ASSETS` som läser ur ett verkligt
   bygge, med alla sju formaten och fyra felfall. Men `env.ASSETS` i skarpt läge
   är inte provat, och det är den enda punkten där beteendet kan skilja sig.
3. **Danmarks QR-mått i millimeter är vår egen mätning på en pressbild**, inte
   en publicerad siffra. § 3.1.
4. **A5-uppgiften för det danska märket** vilar på Dansk Erhvervs sida och på
   sökträffar mot en PDF hos Fødevarestyrelsen som just nu svarar 404.
5. **Ingen källa alls finns om avläsning genom glas.** § 3.3.
6. **Fetstil finns inte i filerna, och det är ett öppet beslut.** Hierarkin
   bärs av storlek och färg. Vill vi ha vikt 500 och 700 krävs ett nytt
   beroende, och de två alternativen med sina kostnader står i § 8.4. Beslutet
   är ägarens.
7. **Kerning läses inte.** Fonten har `GPOS`, koden hoppar över den. Några
   tusendels em per par, osynligt i de här storlekarna, men det är en
   avvikelse mot hur samma text ser ut på sajten. § 8.6.
8. **Tryckeriernas storlekstabell i § 3.2 vilar på fyra hämtade produktsidor
   och ingenting mer.** Den första versionen av den utredningen innehöll en
   uppdiktad leverantörstabell som drogs tillbaka av den som skrev den, och
   siffrorna som står kvar är de som hämtades om, en sida i taget. Det är
   tillräckligt för att välja ett mått, men det är fyra sidor och inte en
   marknadsöversikt. Innan en riktig order läggs ska den tryckerioffert som
   faktiskt ska användas läsas i original.
9. **Ingen har frågat en verksamhet om de vill ha det här.** Hela bygget vilar
   på att två länder oberoende av varandra valde samma grepp, vilket är ett
   argument om vad som fungerar och inte ett belägg för att svenska
   restaurangägare vill ha ett frivilligt märke. Den mätningen är billig och
   borde göras: tio samtal.


---

## 10. Fetstilsbeslutet, avgjort 2026-08-31

**Inget nytt beroende. Vikt 400 räcker, och hierarkin bärs av storlek och
färg.**

Frågan uppstod för att `fontkitten`, som redan ligger i `node_modules` genom
Astro, inte kan läsa variationsaxlar ur en woff2. Fonten har `fvar`, `gvar` och
`HVAR`, så bristen är bibliotekets och inte filens. Två vägar fanns: `fontkit`
på omkring en megabyte, eller `@fontsource/instrument-sans` med statiska
viktfiler, som `fontkitten` läser utan problem. Ingen av dem hade hamnat i
Workern, eftersom utdraget sker i importskriptet.

**Skälet att avstå är att felet inte syns i artefakten.** Certifikatet
renderades och betraktades: kransen bär blicken, "Utmärkelse för genomgående
skötsamhet" står i grått, verksamhetens namn i 12 mm brandblått, och
brödtexten i svart. Hierarkin är läsbar utan att en enda rad är fet. Att lägga
till ett paket för en vikt på ett dokument är fel pris för det.

**Vad som ändrar beslutet.** Ett långt namn krymps till 10,2 mm, och vid den
graden kan blått i vikt 400 bli tunt på papper. Ser ägaren det på en utskrift
är beslutet ett paket bort, och paketet är `@fontsource/instrument-sans`, inte
`fontkit`: det är billigare, det tar bort behovet av variabelstöd helt, och det
är samma utgivare som den variabla font vi redan beror på.
