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
| **Bevakningsmejlets huvud** | `soker` | Ett mejl är inte en offentlig lista. Byggd, se noten nedan. |
| **Delningsbilder** | Valfritt | Bara kommun-, kategori- och kedjesidor. Aldrig en enskild verksamhet, av samma skäl som matsnusk. |

### Mejlet, som är den placering som ligger närmast gränsen

Bevakningsmejlet innehåller rader om namngivna verksamheter och deras
bedömning. Figuren står ändå i mejlets huvud, och avvägningen ska stå skriven.

Skillnaden som gör det försvarbart: ett mejl är inte en offentlig lista. Vi
talar till EN mottagare om hens egen bevakning, och figuren står i
avsändarraden, inte intill ett företagsnamn. Duolingos egen manual nämner
uttryckligen notiser och e-post som platser där Duo hör hemma.

**Villkoret är hårt: figuren stannar i huvudet.** Kommer den någonsin ned bland
raderna är regeln bruten. Det är också skälet till att den här noten finns: en
gränsdragning som bara lever i någons huvud flyttar sig.

Tekniskt: Gmail rensar bort SVG och Outlook renderar den inte alls, så mejlet
använder en PNG på en publik adress. Den rasteriseras ur samma figur som allt
annat av `brand/bygg-appikon.mjs`, eftersom en figur som ritas för hand vid
sidan av slutar likna produkten.

### Frekvensregeln

**Ju fler gånger en användare ser figuren, desto starkare skäl krävs för att
behålla den.** En yta som återkommer på mer än ett par hundra av våra 15 916
sidor är per definition högfrekvent och ska ha korthet före charm.

Regeln är inte en åsikt. Intuit om tomma lägen: "Repeated exposure to the same
message may result in delightful content becoming irritating over time." NN/g om
felmeddelanden: "Avoid humor since it can become stale if users encounter the
error frequently."

Regeln har redan kostat en yta. **Sidfoten var beställd som en liten signatur och
byggdes, men togs bort igen**, eftersom sidfoten ligger på samtliga 15 916 sidor
och därmed är den mest högfrekventa ytan som finns. Wordmarken gör redan
signaturens jobb där. Beslutet står öppet för ägaren, men figuren ska i så fall
tas in med öppna ögon om vad den kostar i uttröttning.

### Får aldrig synas

1. **Bredvid en bedömning av en namngiven verksamhet.** Verksamhetssidans
   märke, listrader, kartnålar, sökträffar, jämförelserutan. Utan undantag.
2. **I en lista, i mängd.** Maskoten är ett per sida. En figur som upprepas
   femtio gånger på en skärm slutar vara en karaktär och blir ett mönster.
3. **I en bedömningsfärg.** Aldrig grön, gul eller röd. Se ovan.
4. **På matsnusklistan.** Ett namngivet undantag, eftersom frågan ställdes och
   kommer att ställas igen. Matsnusk är en bedömning av namngivna verksamheter
   och den hårdaste vi gör: den listar ställen där brister kvarstod efter
   kommunens uppföljning. En grävling bredvid namnet på en sådan restaurang gör
   vårt allvarligaste påstående till ett skämt, och det är exakt den invändning
   en verksamhet skulle använda mot oss den dagen de hör av sig. Ingen figur på
   matsnusk, i helfigur eller på annat sätt.
5. **I felmeddelanden som beror på användaren**, till exempel ett formulär som
   inte gick igenom. En figur som ser bekymrad ut när någon skrivit fel läser
   som att den tycker något om personen.
6. **I sidhuvud och sidfot.** Där bor ordmärket. Regeln ifrågasattes för
   sidfoten och prövades i bygget, men föll på frekvensregeln ovan.

7. **Som avsändare av text i första person.** Han talar inte. Ingen "Hej, jag
   är Prikko och jag har grävt fram". Behöver något sägas är det tjänsten som
   säger det, i redaktionell text. Alla tre förebilderna har samma regel
   skriven: Mailchimp "he does not talk. Don't write in his voice", Reddit "Do
   not put words in Snoo's mouth", Duolingo "Duo doesn't talk or make sounds".

8. **I feltillstånd.** Serverfel, misslyckad inskickning, trasig data: ikon och
   text, ingen figur, inget skämt, inget hoppsan, inget utropstecken. GitHubs
   eget produktdesignsystem är entydigt: "If a Blankslate is being used to
   convey an error state, the graphic should not attempt to bring delight or be
   playful. Instead, the graphic should reinforce that something went wrong."
   Google skriver rakt ut: "Don't attempt to make error messages humorous."

   Skillnaden mot ett tomt läge är vem som orsakat det. "Du har inga notiser
   än" är ett normalläge och får figur. "Det gick inte att spara" är ett fel och
   får ikon.

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

Sajten har tre rörelser totalt och alla är korta. Maskoten ändrar inte det, och
efter research ändrades den här delen i grunden.

### Den regel som styr allt annat: WCAG 2.2.2

**Ingen loopande rörelse får finnas på en yta där annat innehåll syns
samtidigt.** Det är inte en smakfråga utan ett krav på nivå A.

WCAG 2.2.2 Pause, Stop, Hide säger att allt som rör sig, startar automatiskt,
varar mer än fem sekunder och visas parallellt med annat innehåll måste ha en
mekanism för att pausa, stoppa eller dölja. En loop uppfyller aldrig
femsekundersvillkoret, eftersom den aldrig tar slut.

Två vägar ut, och vi använder båda:

1. **Låt rörelsen ta slut.** Alla våra rörelser är engångsrörelser utlösta av
   något som hänt. Ingen loopar.
2. **Eller visa den ensam på ytan.** W3C:s eget exempel är en laddningsindikator
   som ligger ensam på skärmen och därför inte behöver pausknapp. Det är enda
   stället där en loop är tillåten hos oss.

En enda ospelbar loop kan underkänna hela sidan. Kostnaden för att ha fel här är
alltså inte proportionell mot hur kul rörelsen är.

### Vad Duolingo faktiskt säger om rörelse

Deras varumärkesguide har ingen rörelsesektion alls. Reglerna ligger i
skrivguiden, under Duos And Duon'ts, och lyder ordagrant: "Duo mostly stands
still", "Duo makes slight, expressive movements, like waving or pumping his
fist", "Duo doesn't make any sudden or quick movements".

Deras egen produkt bekräftar det. På lärvägen, alltså huvudytan, laddas noll
canvaselement och inga riggade figurfiler: varje figur där är en statisk SVG.
Rive går in på lektionsytan, inte på navigationsytan.

### Rörelserna

Åtta namngivna, alla engångs utom en. Längderna ligger inom det spann Material,
Carbon, Atlassian och NN/g är överens om, alltså 200 till 500 ms för synlig men
inte stor rörelse.

| Namn | Roll | Längd | Var |
|---|---|---|---|
| `arrive` | Ankomst, sätter sig | 420 ms | Enbart startsidans hero, en gång per session |
| `blink` | Livstecken | 120 ms | Enbart hero, max tre inom 4,5 s, sedan stilla |
| `perk` | Spetsar öron | 380 ms | Hover och fokus på figuren själv eller sökknappen |
| `nod` | Bekräftelse | 260 ms | När en sökning gett träffar. En gång per handling |
| `dig` | Väntan, gräver | 900 ms, **enda tillåtna loopen** | Enbart laddyta där inget annat visas |
| `wince` | Bekymmer | 480 ms | Tomt resultat eller fel. En gång |
| `cheer` | Glädje | 650 ms | Sällsynt positiv händelse |
| `wave` | Avsked | 520 ms | 404 och slutet på en lång lista. En gång |

Gemensamt: efterföljning på två bildrutor, alltså 83 ms vid 24 fps, för öron och
svans mot kroppen. Ingen översläng på färg eller opacitet, bara på position och
skala, vilket är Material 3:s enda auktoritativa regel om översläng.

**Samma rörelse spelas aldrig två gånger på samma sidvisning.** NN/g:s
testdeltagare, ordagrant: "this was nice the first time, but now it's getting
annoying".

Vid `prefers-reduced-motion: reduce`: behåll `nod`, `wince` och `cheer` som ren
opacitetsväxling med samma timing, eftersom WCAG uttryckligen undantar färg och
opacitet från motion animation. Ta bort `arrive`, `perk` och `wave` helt. Ersätt
`dig` med en stillbild. Använd `0.001ms` plus `animation-iteration-count: 1`, och
inte `animation: none`, som bryter `animationend`-lyssnare.

### Gångcykeln, och varför den inte används ännu

Åtta bildrutor med ojämna hålltider, 90, 70, 70, 110, 90, 70, 70, 110 ms.
Kontaktlägena ligger kvar längre än passeringarna, och det är skillnaden mellan
billigt och dyrt: en ren `steps(8)` håller varje ruta lika länge och den
jämnheten läser ögat som mekanisk.

Summan är 680 ms. Richard Williams tabell säger 16 bildrutor vid 24 fps för
tecknad gång, alltså 667 ms. Cykeln ligger på 16,3 rutor och är därmed rätt
timad mot den klassiska normen.

Den ligger som egen fil, `site/public/maskot/gang.svg`, och används **ingenstans
än**. Skälet är regeln överst: en gående grävling bredvid innehåll är precis den
ambient loop som utlöser WCAG 2.2.2. Den hör hemma i en laddyta där den ligger
ensam, och den ytan finns inte byggd ännu.

### Tekniken, och varför inte Rive

Bildrutor med CSS `steps()`. Det är den enda tekniken som samtidigt ger fri
formändring, noll körtid och fungerande `prefers-reduced-motion`.

Rive utreddes på riktigt den här gången, eftersom det tidigare valdes bort på en
princip i stället för på ett tal. Talen: canvas-lite kostar 412 kB gzip, alltså
87 kB JavaScript plus 325 kB WebAssembly. Det är 1,5 gånger hela vår
MapLibre-installation på 271 kB gzip, och kartan finns bara på kartsidorna medan
maskoten finns överallt. Därtill 150 till 400 ms kompilering på en snabb dator,
mer på mobil, och figuren är osynlig tills skriptet kört om vi inte bygger en
egen fallback.

Principen om lite JavaScript avgjorde alltså inte. Talet gjorde det. Hade Rive
kostat 40 kB vore svaret ett annat.

Vad bildrutor inte klarar, och som Duolingo faktiskt använder Rive till: blanda
två tillstånd samtidigt, kombinera åtta huvuden med åtta kroppar till 64
varianter, reagera kontinuerligt på indata, och läppsynka mot tal. Inget av det
finns i vårt behov. Åtta diskreta engångsrörelser är precis vad bildrutor är bra
på.

Två fällor att undvika: CSS-egenskapen `d` ser ut att lösa formändring utan
skript men har ingen effekt i Safari, och SMIL fungerar överallt men kan inte
stängas av vid reduced motion utan JavaScript.

### Bedömningsmärkets två rörelser

De lever kvar och är omritade mot grävlingens geometri. Munnens uppritning
använder `pathLength="1"` i stället för ett hårdkodat streckmönster, och
blinkningen animerar ögonlockets egen geometri i stället för att skala ett lock
vars båda kanter rör sig åt olika håll.

Blinkningen gäller bara vid `clean`. Att låta en verksamhet med brister blinka
vore att sockra ett underkännande.

## 4b. Vad forskningen säger emot oss

Det starkaste motargumentet mot en maskot i vår kategori är inte estetiskt.

Puzakova, Kwak och Rocereto, *When Humanizing Brands Goes Wrong*, Journal of
Marketing 77: en förmänskligad varumärkesfigur kan **försämra** bedömningen när
något gått fel, eftersom en levande figur uppfattas ha avsikter och felet därmed
läses som avsiktligt. En senare studie i European Journal of Marketing pekar på
att effekten slår till vid moraliska fel men inte vid kompetensfel.

Det är precis vår situation: vi rapporterar andras fel. Slutsatsen är inte att
maskoten ska bort, utan att den bärande gränsen i §2 är den rätta gränsen, och
att den inte får förhandlas bort yta för yta.

Ett varningsexempel som är värt att känna till: en dansk kro gjorde en
satirvideo av sin neutrala smiley och fick över 350 000 visningar, med budskapet
att märkningen inte skiljer på matsäkerhet och administrativa krav. **Figuren
blir själv skämtobjektet när bedömningen upplevs som orättvis.** Vår metodik
skiljer redan på administrativa avvikelser och brister, se `docs/11` och
metodiksidan, och det är också vårt bästa skydd mot samma sak.

## 4c. Kontrollen: så här ser andra på samma gräns

Uppmätt i deras egna produkter och manualer.

**Duolingo.** Duo finns i onboarding, i interstitials mellan uppgifter, i
notiser och i app-ikonen. Han finns **inte** inne i själva övningen, inte vid
rätt svar, inte vid fel svar, inte på laddskärmen, inte i hjälpcentret och inte
på villkorssidan. Rätt och fel svar bärs av en bock och ett kryss, inte av
figuren.

**Mailchimp**, ur deras designpersona: "Freddie does not ever give application
feedback, stats, or help a user with a task." Och: "In critical situations like
when a server goes down, or a credit card is declined, MailChimp drops the humor
and speaks directly."

**GitHub**, publikt: "Don't use mascots to explain, interrupt, or sell." Och:
"Don't use mascots for serious topics. Money, security, sales, enterprise
offerings, apologies, politics or crises should have proper copywriting,
illustration, and visuals."

**Reddit**: märket är Snoos huvud och det är "always blank, like a canvas".
Maskoten själv är ett separat, uttrycksfullt material.

Mönstret är detsamma hos alla fyra, och det är exakt vår delning: **märket är en
uttryckslös abstraktion, maskoten är ett separat material med miner.**

**Danska smileyordningen**, som är närmast oss: tre ansikten i minimal linjekonst,
ingen kropp, inga armar, ingen personlighet, ingen maskot. Grossistledet får
siffror i stället för ansikten. Verksamhet utan kontroll får ett neutralt
registreringsmärke, inte en fjärde min. De tog dessutom bort ett av fyra ansikten
2022 eftersom konsumenter inte kunde avkoda dem.

**Svenska och nordiska myndigheters designsystem** reglerar färg, ikon och
typografi men inte illustration, av det enkla skälet att de inte har någon.
Frånvaron är svaret. Brittiska ONS är den enda som skriver ut principen: "Where
more sensitive topics are being presented, icons would be best to use as
supporting imagery over illustrations."

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
- **Utmärkelsen är ett öppet val, och det är ägarens.** Den är gränsfallet åt
  andra hållet: en glad grävling bredvid någon som klarat sig är beröm och inte
  hån, så den bärande regeln stoppar den inte.

  *För:* det är den enda ytan där en verksamhet frivilligt sätter upp vårt märke
  i sitt fönster, alltså vår mest spridda yta. En figur är mer minnesvärd än ett
  ordmärke, och beröm är det enda sammanhang där en maskot är oantastlig.

  *Emot:* märket laddas ner och lämnar sajten, så det går inte att ändra i
  efterhand. Det som sitter i ett fönster sitter kvar i åratal, även om vi ritar
  om figuren. Utmärkelsen är dessutom ett formellt erkännande, och ju mer den
  liknar ett institutionellt intyg desto mer väger den. En figur drar åt andra
  hållet. Och märket blir svårare att göra i tryck och i en färg.

  Byggs inte förrän beslutet är fattat.

- Matsnuskmärket bär i dag ordmärkets smiley och ska fortsätta göra det. Se
  förbudet ovan.
