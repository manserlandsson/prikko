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
| Form | Två prickar och en båge i rundad kvadrat | Hela figuren med kropp |
| Var | Listor, kartnålar, sökträffar, verksamhetssidan | Där ingen verksamhet bedöms |
| Antal per sida | Tusentals | **Ett** |
| Komponent | `FaceMark.astro` | `Maskot.astro` |

Att maskoten alltid är blå är en del av samma regel. Bedömningsfärgerna betyder
något om ett företag, och den betydelsen får inte smitta av sig på en figur som
bara säger att en sida är tom.

#### Bedömningsmärket är INTE längre grävlingen, sedan 2026-08-27

Ägaren valde det klassiska märket, sagt två gånger: "D, det klassiska märket"
och "Basic märket ska därför vara överallt. är du med? inte bara på kartan,
detta är ett separat projekt." `MASKOT` i `site/src/lib/face.ts` står på
`false` och ritningen är `site/src/lib/face-klassisk.ts`.

Underlaget är `brand/_prov-marken.html`, som mätte fyra alternativ i de
storlekar märket faktiskt ritas i. Det som fällde grävlingen som MÄRKE var
inte att den är för detaljerad utan att de tre kanaler som bär mening är de
svagaste sakerna i ritningen: munnen är 0,87 px tjock på kartnålen och ligger
under WCAG 1.4.11:s gräns i två av fyra lägen.

**Delningen i §2 står oförändrad, och det är hela poängen med den.** Maskoten
är samma figur i samma lägen som förut. Det som bytte är det andra tecknet.
Att bytet kunde ske utan att röra en enda maskotyta är beviset för att
delningen var rätt dragen.

Två saker följer för läsningen av det här dokumentet:

* **§3b beskriver GRÄVLINGENS ansikte.** Munnens bredd, brynens vinkel och
  ögonens storlek gäller figuren och alltså maskoten. De är inte längre
  märkets regler, eftersom märket inte har några bryn.
* **Rörelsen i §5 gäller inte märket.** Riggen letar lock, bryn, pupiller,
  band och öron, och det klassiska märket har inget av det. Grinden heter
  `MARKE_ROR_SIG` och står i `lib/face.ts`. Ett märke som står still är
  bättre än ett där halva ansiktet lever.

Vad bytet ändrade i märkets egen palett, båda mätta och inga nya ritningar:

| | Före | Efter | Varför |
|---|---|---|---|
| Platta, ingen bedömning | `#C7C7CC` | `#6E6E73` | `#C7C7CC` har gråvärde 199,4 och den gula 199,2, alltså gick de inte att skilja åt utan färg. Vitt på den ljusa grå gav dessutom 1,68:1 mot WCAG:s 3:1. Nu 110,4 respektive 5,07:1. |
| Plattans gradient | två stopp | en ton | `id` måste vara unika i ett dokument, och `pk-klassisk-clean` förekom tolv gånger på `/stockholm/`. Gradienten ritade också ett söm på kartnålen. |

Vad bytet INTE ändrade, och vad det kostar: symbolen är vit och den gula är
`#FECB00`, båda ägarens egna beslut. Priset är att vitt ligger på 2,63:1 mot
grönt och 1,53:1 mot gult, alltså under WCAG 1.4.11. Undantaget i kravet är
att grafiken inte behöver bära betydelsen ensam, och på 19 av 21 ritställen
står bedömningens text intill märket. På kartnålen gör den inte det. Talen för
båda vägarna ut står i `face-klassisk.ts`; valet är ägarens.

### Får synas

| Yta | Läge | Skäl |
|---|---|---|
| **404** | `fyrafyra` + `m-spana` | Ingen verksamhet finns. Sajten talar i eget namn. Byggd. |
| **Favicon och app-ikon** | Ansiktet i rundad kvadrat, blå | Ikonen säger vem sajten är. Byggd. |
| **Tomt sökresultat** | `tom` + `m-spana` | Noll träffar betyder noll verksamheter på skärmen. Byggd, `sok.astro`. |
| **Tom notislista** | `tom` | Byggd, `konto/notiser.astro`. |
| **Tom granskningskö** | `tom` | Byggd, `konto/granska.astro`. |
| **Konto utan bevakningar** | `tom` | Byggd, `konto/index.astro`. Ett per sida: omdömesrutan strax under får ingen. |
| **Kartans tomma utsnitt** | `tom` | Ytan är definierad av att ingen verksamhet finns där. Byggd, `Karta.astro`, bara kommunernas kartor. Statisk, se nedan. |
| **Kvittens efter en handling** | `nojd` + `m-nick` | Byggd, `ratta.astro`. Reservvägen bredvid är ett fel och får ingen figur. |
| **Avsked** | `clean` + `m-vinka` | Byggd, `sluta-bevaka.astro`. Enda posen med tassen uppe. |
| **Startsidans hero** | `soker` eller `clean` | Sajten presenterar sig. Ingen enskild verksamhet på skärmen. Inte byggd, se §6. |
| **Metodiken** | `soker` | Tjänsten förklarar sin egen beräkning. Byggd, `metodik.astro`. |
| **Om** | `clean` | Tjänsten talar om sig själv. Byggd, `om.astro`. |
| **Källor** | `soker` | Var uppgifterna hämtas. Tabellen räknar KOMMUNER, inte verksamheter. Byggd, `kallor.astro`. |
| **Webbkartan** | `clean` | Innehållsförteckningen över sajten. Byggd, `webbkarta.astro`. |
| **Rapporternas index** | `hittat` | Vad hela beståndet visar. `hittat` får sin första yta här. Byggd, `rapporter/index.astro`. |
| **Utmärkelsens ingång** | `soker` | I avsnittet som förklarar ribban, inte i sidhuvudet. Byggd, `utmarkelser/index.astro`. |
| **De tre juridiska sidorna** | `clean` | Villkor, integritetspolicy, kakor. Avvägningen i §5d. Byggda. |
| **Bevakningsmejlets huvud** | `soker` | Ett mejl är inte en offentlig lista. Byggd, se noten nedan. |
| **Inloggningsmejlets huvud** | `soker` | Brevet nämner ingen verksamhet alls. Byggd, `pipeline/auth_magic_link_email.html`. |
| **Delningsbilder** | Valfritt | Bara kommun-, kategori- och kedjesidor. Aldrig en enskild verksamhet, av samma skäl som matsnusk. |

**Kartans tomma utsnitt är statiskt, och båda skälen är hårda.** Kartan ligger
bredvid och rör sig medan man drar, alltså skulle en rörelse där ligga
parallellt med annat innehåll, vilket är precis WCAG 2.2.2:s villkor. Och läget
kommer och går varje gång någon panorerar ut över vatten: en rörelse som
spelas om vid varje drag är NN/g:s testdeltagare ordagrant, trevlig första
gången och irriterande sedan.

**Rikskartan får ingen figur, och det är inte en glömska.** Dess listkolumn
faller tillbaka på kommunraderna så fort kartan inte gett några kort, alltså
står den kolumnen aldrig tom: drar man ut över Östersjön är rutan tom men
svaret på skärmen är tolv vägar vidare. En figur som säger "här finns
ingenting" ovanför den listan säger fel sak, och en figur som aldrig visas är
ren last, uppmätt till 3 150 B gzippat på en kartsida. Det är samma regel som
styr sökningen: **ger sidan ett svar står figuren still, hur tom rutan än ser
ut.**

**Avskedet ligger närmast gränsen av de nya ytorna, och avvägningen ska stå
skriven.** Raden ovanför figuren nämner en verksamhet vid namn, "Du bevakar
inte Pizzeria X längre". Den säger ingenting OM verksamheten: ingen bedömning,
ingen färg, inget märke. Regeln förbjuder figuren bredvid en bedömning, inte
bredvid ett namn, och det är samma skillnad som gör mejlets huvud försvarbart.
Kommer det någon gång en bedömning på den sidan ska figuren bort samma dag.

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

### Sidhuvudets ruta är samma tal som sidfoten, och den räknades

Inloggningsrutan stod på listan över ytor figuren skulle få, och det är rätt
ställe att fråga: rutan nämner ingen verksamhet, bedömer ingenting och är den
enda ytan på sajten där någon frivilligt stannar upp i tjugo sekunder.

Svaret är ändå nej, och skälet står i `layouts/Base.astro` och inte i den här
filen. **`SignInDialog` ligger i baslayouten**, alltså renderas den som ett
stängt `<dialog>` på samtliga 16 616 sidor, inklusive de 15 900
verksamhetssidorna. En figur i den rutan är därför inte en yta, det är hela
bygget: 16 616 gånger figurens 4 707 B gzippat är **78 MB**.

Det är exakt samma tal som sidfoten och sökpanelen ger, och det är därför den
här noten står här och inte i en kommentar i rutan: **frågan kommer att ställas
igen om varje ruta som ligger i layouten**, och svaret är alltid detsamma.
Ytan är inte fel, mängden är det.

Samma sak gäller omdömesrutan i `Reviews.astro` och jämförelserutan, med ett
skäl till: båda handlar om en namngiven verksamhet.

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

## 3b. Vem bär vad i ansiktet

Ansiktet har flera kanaler och de gjorde länge samma jobb samtidigt, vilket
gick att se men inte att mäta. Ägaren har satt arbetsdelningen och den gäller:

**Munnen bär BEDÖMNINGEN.** Ordagrant: "munnen ska såklart skilja på alla".
Den ska ensam skilja de tre lägena åt, i 24 px och i gråskala, och provet är
`isolera: 'mun'` i figuren. Tre former och inte tre grader av en form: båge
uppåt, praktiskt taget rak, båge nedåt. Pilhöjderna är 0,30, −0,05 och −0,27
av munnens egen bredd.

**Brynen bär TONEN.** De säger om figuren är bekymrad eller lugn, inte vilket
besked det är. Kravet att brynen ensamma skulle skilja de tre bedömningarna åt
är därför **struket**. `isolera: 'bryn'` finns kvar som mätning, inte som
godkännandevillkor.

Två saker följde av delningen, och båda kom ur att ägaren såg märket live.

**Munnen växte tillbaka**, från 22 till 30 procent av huvudets bredd. Den hade
krympt när grävlingens stora ögon tog över uttrycket, vilket var rätt för
ansiktet och fel för märket: alla fyra lägen har samma ögon, alltså kan ögonen
inte bära vilket besked det är. Vid 22 procent låg skillnaden mellan clean och
minor under strykets egen tjocklek i 24 px.

**Brynen i `major` gick från 21 grader till nära platt.** Ägaren: "gör inte
ögonbrynen på prikko grävlingen så arga liksom lite mer platta hållet på den
ledsna, den ser arg ut istället för ledsen". Skillnaden mellan argt och ledset
sitter i vilken ände som är låg, och 21 grader gånger amplituden 1,5 blev 31,5
grader inre änden ned, alltså en rynkad panna på ett märke vars mening är
"brister som kvarstår". Det är samma invändning som §4b beskriver i teorin: en
figur som ser ut att ha en avsikt får felet att läsas som avsiktligt. Det som
skiljer major i brynkanalen är numera HÖJDEN, alltså att brynen sitter lägst av
alla lägen, och låga platta bryn läser som allvar.

**En regel som kom ur ett fel.** När munnen fördjupades växte bågen in i mulen,
eftersom munnens mittlinje stod på ett fast tal. Ägaren såg det direkt: "munnen
går liksom upp i näsan". Mittlinjen räknas nu fram ur mulens underkant plus
strykets halva tjocklek plus munnens högsta punkt över sin egen mittlinje,
alltså flyttar munnen ned av sig själv när den fördjupas. Provarket ritar
dessutom ut mulens underkant som en linje, eftersom talen i den filen alla såg
riktiga ut medan felet var uppenbart i bild.

**Och samma regel höll inte hela vägen.** Reserven räknade munnens DJUP men inte
dess LUTNING. Munnen lutar två grader, vilket är Duolingos egen regel om att
munnen ska vara asymmetrisk och som ska vara kvar, men lutningen lyfter den ena
mungipan en halv enhet som ingen hade reserverat plats för. I det glada läget är
det just mungiporna som är munnens högsta punkt, alltså slog felet till exakt
där. I `rik` räckte marginalen ändå av en slump, i `enkel` med sitt 18 procent
grövre stryk gjorde den det inte, och app-ikonen ritades i den kombinationen:
uppmätt luftspalt 0,95 enheter mot de 1,2 regeln lovar, och i bild ett leende
som satt ihop med mulen till en enda mörk fläck. Reserven räknar nu djup och
lutning per mun, alltså kan felet inte komma tillbaka genom att ett djup ändras.

Det är samma sensmoral som sweep-flaggan i `maskot-mun.mjs` en gång gav: **en
reserv som stämmer av en slump är samma sak som ingen reserv.** Den håller precis
tills någon ändrar talet den råkade ha marginal mot.

## 3c. Detaljnivåerna är avställda

Märket ritades i tre nivåer, `rik`, `enkel` och `nal`, valda ur storleken. Nu
gäller `rik` överallt, inklusive kartnålen. Ägaren: "använd inte den basic
grävlingen det ser inte bra ut", och sedan "använd samma för nål, det ska vara
inramat rikt hela tiden".

Domen är riktig och den går att se. `nal` ritade inte samma ansikte enklare,
den ritade ett annat ansikte: rundad rektangel i stället för huvudkontur, inga
öron, ingen nos, banden som två piller och brynen som två ellipser tjocka nog
att läsa som ett andra par ögonlock. Den vann provet den var byggd för, alltså
att fyra lägen ska gå att skilja åt i 16 px, och förlorade det som inte mättes:
att det är samma figur.

Priset är mätt på en hel byggd sajt, före och efter:

| Sida | HTML före | HTML efter | gzip före | gzip efter |
|---|---|---|---|---|
| `/stockholm/` | 153 478 B | 185 828 B | 23 412 B | 24 861 B |
| `/sok/` | 44 852 B | 77 202 B | 8 411 B | 9 674 B |
| `/kedja/ica/` | 283 328 B | 315 678 B | 23 782 B | 25 254 B |

Påslaget är exakt 32 350 byte rått per sida med lista, alltså vad fyra
symboler i `rik` kostar mot fyra i `nal`, och det är **konstant**. Stockholms
hubb har 8 511 rader och betalar samma påslag som en sida med tio, eftersom
raderna pekar på spriten med `<use>`. Gzippat är det 1,3 till 1,5 kB.

Kartnålen kostar ingenting extra: den ritas en gång per läge och registreras
som fyra bilder hos kartmotorn, inte en gång per verksamhet.

Ritningarna för `enkel` och `nal` genereras fortfarande och ligger kvar i
`site/src/lib/face-geometri.ts`. De är avställda, inte borttagna, så att valet
ska gå att pröva om på en rad. `faceDetalj()` står kvar som den enda platsen
där frågan besvaras och svarar `rik` för varje storlek.

Hela stycket ovan gäller GRÄVLINGSRITNINGEN, som sedan 2026-08-27 inte är
märket. Den ligger kvar bakom `MASKOT = true` av samma skäl som nivåerna: ett
val ska gå att pröva om utan att någon gräver i git. Talen står kvar därför att
de är mätta och gäller den dag flaggan vänds tillbaka.

### Ikonerna var undantaget som överlevde, och varför det inte syntes

Avställningen gällde sajten och inte ikonerna. **Faviconen byggdes ur `nal` och
app-ikonen ur `enkel`** i ytterligare ett halvår efter att `faceDetalj()`
börjat svara `rik`, eftersom nivån för de två filerna står i
`brand/bygg-face-geometri.mjs` och inte i sajten. Den som läste `lib/face.ts`
såg alltså ett åtgärdat system. Ägaren såg något annat, i flikraden och på
hemskärmen: "fortfarande den enkla prikko grävlingen på många ställen".

Båda bygger nu ur `rik`. Priset är mätt: 2 588 B gzip mot nal-nivåns 503, alltså
2,1 kB en gång, för en fil som `site/public/_headers` ger fyra timmars max-age.
Invändningen som stod i koden räknade rätt men jämförde fel, eftersom den utgick
från att faviconen laddas på varje sidvisning.

**Lärdomen är värd mer än ytan, och den är generell.** Ett beslut som ska gälla
överallt måste kunna kontrolleras på ETT ställe. Här bodde det på två, en
funktion i sajten och ett par argument i en generator, och det andra stället
hade ingen anledning att någonsin läsas igen. Det som slutligen avgjorde saken
var inte en genomläsning utan ett provark som ritar varje fyndplats bredvid
samma yta i `rik`, `brand/prov-alla-gravlingar.mjs`: två olika grävlingar
bredvid varandra syns, en glömd rad i en generator gör det inte.

Två följdfel föll ut ur samma sak och är rättade:

- **Förvalet i `figur()` var `enkel` för inramat ansikte.** Varje anropsplats som
  glömde `detalj` fick tyst den förenklade. Förvalet är nu `rik` överallt, och
  den som vill ha en förenkling måste be om den vid namn.
- **`enkel` lät leendet växa ihop med mulen.** Se §3b: reserven under mulen
  räknade munnens djup men inte dess LUTNING, som lyfter ena mungipan. I den
  rika nivån räckte marginalen ändå, i den enkla nivåns grövre stryk gjorde den
  det inte, och app-ikonen ritades i just den kombinationen. Reserven räknar nu
  båda, alltså kan felet inte komma tillbaka genom att ett djup ändras.

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

## 4e. Skuggan var en ellips som stod skriven som ett piller

Duolingos illustrationsguide kräver att skuggan under en karaktär ritas som en
**pillerform och aldrig som en ellips**, eftersom en ellips är en cirkel sedd i
vinkel och därmed antyder ett perspektiv som resten av teckningen inte har. Vår
figur står i rak vy: kroppen, fötterna och marken har ingen flykt någonstans,
alltså gäller regeln oss.

Källan i `brand/maskot/gravling.mjs` PÅSTOD redan att skuggan var ett piller.
Meningen efter påståendet sa samtidigt att banan var ritad genom `mjuk`,
"alltså utan ett enda rakt parti", och **ett piller består av två raka
partier**. Påståendet motsade alltså sin egen andra mening, och ingen hade
någonsin mätt vilken av de två meningarna som var sann.

Mätningen: den gamla banan samplades i 32 punkter längs överkanten och
jämfördes med både formerna i samma ram, 48 × 12 enheter.

| | Medelavvikelse | Största avvikelse |
|---|---|---|
| mot en riktig pillerform | 0,738 enheter | 2,04 vid x 78 |
| mot en ren ellips | **0,233 enheter** | 0,41 |

Vid 120 px ritruta är en enhet en pixel. Skuggan låg alltså **tre gånger
närmare ellipsen än pillret den utgav sig för att vara**, och den syns på varje
förekomst av figuren.

Skuggan är nu en riktig pillerform, `M40 106H76A6 6 0 0 1 76 118H40A6 6 0 0 1
40 106Z`. Ramen är oförändrad, x 34..82 och y 106..118, alltså radie 6 och två
raka partier på 36 enheter. Ingenting flyttar sig av rättelsen, bara formen
mellan kapparna, och båda rörelserna som rör skuggan, `m-in-skugga` och
`m-hoppskugga`, är transformer och berörs inte.

Ett sidoresultat värt att skriva: en pillerbana är **320 tecken kortare** än
tolv kubiska segment, alltså blev varje figur i bygget mindre av rättelsen.

**Sensmoralen är den tredje i samma serie**, efter sweep-flaggan i
`maskot-mun.mjs` och munreserven i §3b: ett påstående i en kommentar är inte en
mätning. Det som aldrig mäts driver, och det driver tyst, eftersom en kommentar
som säger rätt sak får ingen att titta efter.

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

## 4d. Fyra sajter öppnade på riktigt, och vad som gick att låna

Uppmätt i webbläsaren den 12 augusti 2026, inte hämtat ur minnet. Ägaren pekade
ut hitta.se, ednia.se, booli.se och Duolingo, och de svarar på olika frågor.

### hitta.se: gränsen finns hos dem också, men de har ingen figur

Ingen maskot någonstans. Deras illustrationer är platta människofigurer i
märkesblått, och de förekommer **bara i korten som säljer in dem själva**,
alltså "Verifiera ditt företag" och "Dina uppgifter". Bredvid en företagsrad
står ingen illustration någonsin. Det är exakt vår delning mellan avsändare och
data, gjord av någon annan, i samma kategori och på svenska.

Deras 404 är den bästa lånade formen: ingen bild alls, en rad i en färgad
remsa, och **sökrutan överst i stället för meddelandet**. Vägen ut är det
dominerande elementet och budskapet är en bisats. Texten säger "Vi hittar det
mesta, men inte just den här sidan", alltså varumärkesnamnet som verb, vilket
är samma grepp som gör "Prikko säger inga anmärkningar" möjligt.

**Fyndet som var mest värt något:** deras sökning har inget tomt läge, eftersom
den aldrig blir tom. Nonsenssträngen `zzzzzzzzzzzzzzzzzzzzzzzz` gav 2 403
träffar. Det är den starkaste designen av alla: det bästa tomma läget är det
som aldrig inträffar. Vår sökning viker redan ihop stavningar och söker på
avstånd, och det arbetet är därför värt mer än figuren som står där när det
ändå tar slut.

**Vad som inte passar oss:** deras laddläge är ingenting alls, och deras karta
ligger som ett tomt grönt fält medan den laddar.

### ednia.se: skelettet, och ett tomt läge som är för torftigt

Laddningen är grå skelettblock i exakt kortets form. Sidhuvudet, kategoriflikarna
och filterknapparna ritas direkt och står stilla; bara innehållsytan skelettas.
Ingen spinner, ingen figur.

Deras tomma sökresultat är centrerat, med rubriken "Inga resultat" i **16 px
halvfet**, alltså brödtextstorlek och inte display, och en mening under med
ordet "filtret" som inline-länk. Under det ligger sedan sexhundra pixlar tomt.
Det är den svagaste av de fyra, och det är just den ytan ägaren vill förbättra.
Lärdomen som ändå håller: **rubriken i ett tomt läge ska vara liten.** Ett tomt
läge som skriker är värre än ett som viskar.

### booli.se: formen vi faktiskt lånade

Två saker, båda uppmätta.

**Det tomma sökresultatet.** Rubriken "Inga träffar i din sökning." i 24/32
halvfet, vänsterställd på x = 24. Under den en rad som säger vad man GÖR åt
det. Under den de aktiva filtren som avtagbara brickor med kryss, plus "Rensa
filter". Och till höger, på x = 536, en 128 px illustration på en rundad ljus
persikofärgad skiva: ett finger som drar i ett filterreglage. **Bilden
föreställer handlingen, inte känslan.** Ingen ledsen figur, ingen tom låda.

Det är den uppställning vårt tomma sökresultat nu har: text till vänster,
figuren till höger, och raden under rubriken bär åtgärden. Skillnaden är vad
bilden föreställer, och den skillnaden har vi råd med: de har ett bibliotek med
situationsbilder, vi har en avsändare.

**404:an.** Ett varmt tonat fält, `#F8F0E8`, rubriken "Åh nej!" i 40/52, ett
stycke, en svart knapp, och till höger en 490 × 373 illustration som är deras
egna siffror 404 i märkessvart, utspillda över ytan med logotypens orange prick
och triangel inbakade. Ingen karaktär, ingen lånad clipart: **bokstäverna är
bilden.** Vår 404 gör samma sak med en figur i stället, och båda lösningarna är
märkeseget material.

Kostnaden är värd att skriva: deras 404-illustration väger **2 427 B** och
ligger som egen fil på deras CDN, alltså cachad över sidor och gratis på sidor
som inte visar den. Vår figur väger 14 861 B och ligger inbakad i dokumentet.
Inbakad är rätt för EN figur på en sida, eftersom den slipper en förfrågan och
kan animeras av sidans CSS, vilket en `<img>` aldrig kan. Skulle figuren någon
gång behöva stå på hundratals sidor är en cachad fil den bättre affären, och då
faller rörelsen bort. **Rörelsen är alltså vad som betalar för inbakningen**,
och det är skälet till att statiska förekomster inte automatiskt hör hemma
inline.

**Deras laddlägen:** listan får grå skelettkort, kartan får en liten mörk
spinner och texten "Laddar karta…" på varm ton. Ingen illustration i något av
dem. Designriktningen sätter alltså inte en figur i ett laddläge, och det är ett
argument mot att vi gör det.

### Duolingo: placeringen, inte figuren

Ägarens fråga var VAR Duo står. Svaret är snävare än ryktet.

**Duolingos egen 404 har ingen Duo.** Den är serverns oformaterade standardsida
i Times New Roman: "404 Not Found. The resource could not be found." Företaget
som är mest förknippat med en maskot lägger honom inte på sin 404. Vi gör det,
och det är ett medvetet avsteg: vår 404 är en av trettiofyra sidor där han finns, hos
dem är den en av tiotusentals skärmar där han inte finns.

**Deras hjälpcenter har ingen Duo.** Bara ordmärket och en lista med frågor.

**På startsidan står han inte som helfigur.** Han står som ett ANSIKTE inuti en
telefonram, alltså samma beskurna huvud som deras app-ikon, inte en kropp med
armar.

Deras skrivguide, ordagrant hämtad samma dag: "Duo mostly stands still", "Duo
makes slight, expressive movements, like waving or pumping his fist", "Duo
doesn't make any sudden or quick movements". Och den mening som skiljer dem från
oss: **"Duo communicates through text. You know it's from Duo if the copy says
'Hi, it's Duo.'"** Duo får alltså vara avsändare av text i första person. Prikko
får det inte, se §2 punkt 7, och skillnaden är inte estetisk: de driver ett spel,
vi återger myndighetsbeslut.

En regel ur deras illustrationsguide som är värd att pröva mot vår figur:
skuggan under en karaktär ska vara en pillerform och aldrig en ellips, eftersom
en ellips antyder ett perspektiv som resten av teckningen inte har. Vår figur
har en skugga i `r-skugga`, och formen på den är inte prövad mot den regeln. Den
ligger som öppen punkt i §6.

**Sammanfattningen av hela researchen:** ingen av de fyra sätter en figur
bredvid en post i sin katalog. Tre av fyra sätter aldrig en figur alls i
produkten. Den enda som har en maskot håller honom borta från 404, hjälpcenter
och laddskärmar. Vår figur står därför på trettiofyra sidor och inte på 15 916, och
det är inte försiktighet utan vad kontrollen faktiskt visar.

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

## 5b. Delningsbilden är blockerad, och det är ett fynd

Delningsbilden stod på listan över ytor figuren skulle få, begränsat till
kommun-, kategori- och kedjesidor. Den byggdes inte, och skälet är strukturellt.

Sajten har **en enda delningsbild**, `site/public/og-default.png`, som används
av samtliga sidor. Enda undantaget är artiklarna, som kan sätta en egen. Det
betyder att en grävling i delningsbilden hamnar på **varje verksamhetssida**,
alltså precis där den bärande regeln säger att den aldrig får vara.

Det går inte att lösa med en bild. Det kräver **delningsbilder per sidtyp**,
alltså en för kommun, en för kategori, en för kedja och en neutral för
verksamheter. Det är ett eget uppdrag med egen kostnad, eftersom bilderna
antingen måste genereras vid bygget eller ritas för hand per typ.

Fyndet är värt mer än ytan: det säger att den bärande regeln har konsekvenser i
tekniken och inte bara i designen, och att sådana konsekvenser dyker upp där man
inte letar. Den som senare bygger delningsbilder per sidtyp ska läsa §2 först.

## 5c. Kostnaden är mätt i ett färdigt bygge, och den styr frekvensregeln

Talen nedan är mätta i ett bygge om 16 611 sidor den 12 augusti 2026. Ingenting
här är uppskattat.

### Vad delarna väger var för sig

| Vad | Rått | Noterat |
|---|---|---|
| Figurens svg | 14 864 till 15 635 B | Spannet är riggen: en figur med rörelse bär en namngiven led per del och väger 771 B mer |
| Rörelsekatalogen i dokumentet | 14 735 B | Identisk på varje sida som bär rörelse |

### Vad den faktiskt kostar på en sida, vilket är något annat

Ett gzippat dokument komprimeras som en helhet, alltså kostar en figur mindre
på en sida som redan är full av liknande svg-banor. Det verkliga påslaget är
sidan med figur mot samma sida med figuren urklippt:

| Sida | Påslag gzippat | Vad som ingår |
|---|---|---|
| `/stockholm/karta/` | **3 150 B** | figuren ensam, sidan är redan full av märken |
| `/konto/` | 6 048 B | figuren ensam |
| `/sok/` | 6 379 B | figur och rörelse |
| en artikel | 8 379 B | figur och rörelse |
| `/sluta-bevaka/` | 9 321 B | figur och rörelse, tunn sida |
| `/404` | 9 329 B | figur och rörelse, tunn sida |
| `/ratta/` | **9 408 B** | figur och rörelse, tunn sida |

Alltså: en figur kostar mellan tre och nio kilobyte beroende på vad som redan
står på sidan, och **den dyraste sidan är den tunnaste**. Hela programmet väger
846 597 B rått och 231 509 B gzippat över bygget, snitt 6 809 B per sida.

### De åtta nya ytorna kostade mindre än någon av de gamla, och skälet är rörelsen

Mätt med samma metod: den byggda sidan utan figur mot exakt samma dokument med
komponentens markup inklistrad där komponenten skriver den.

| Sida | Rått | Gzip med figur | Gzip utan | Påslag |
|---|---|---|---|---|
| `/integritetspolicy/` | 72 885 B | 19 801 B | 14 602 B | **5 199 B** |
| `/utmarkelser/` | 66 687 B | 17 331 B | 12 140 B | 5 191 B |
| `/webbkarta/` | 86 281 B | 18 356 B | 13 150 B | 5 206 B |
| `/kallor/` | 74 713 B | 19 114 B | 13 435 B | 5 679 B |
| `/om/` | 57 190 B | 15 055 B | 9 091 B | 5 964 B |
| `/villkor/` | 62 727 B | 16 773 B | 10 668 B | 6 105 B |
| `/cookies/` | 62 021 B | 16 636 B | 10 523 B | 6 113 B |
| `/rapporter/` | 59 507 B | 15 422 B | 9 255 B | **6 167 B** |

**Summa 45 624 B gzippat för åtta ytor, snitt 5 703 B.** Alla åtta ligger under
det gamla snittet 6 809 B och långt under de 9 408 B en tunn sida med rörelse
kostar, och skälet är att **ingen av de åtta bär rörelse.**

Spannet 5 199 till 6 167 bekräftar dessutom regeln §5c redan slagit fast, nu
med åtta nya mätpunkter: **den dyraste sidan är den tunnaste.**
Integritetspolicyn är den största av de åtta och den billigaste att sätta en
figur på, rapportindexet det minsta och det dyraste. Ju mer text som redan
finns att komprimera figuren mot, desto mindre kostar den.

Räknat på det gamla snittet hade åtta ytor kostat 54 472 B, alltså är de 45 624
ett val och inte tur: **de åtta är textsidor och inte händelser, och en
textsida ska inte betala 2 826 B för en rörelse ingen kommer tillbaka för att
titta på.** Rörelse hör till det som HÄNDER, alltså en kvittens, ett avsked, en
sökning som gick i tomma intet. Kontrollerat i bygget: rörelsekatalogen ligger
på 27 sidor, och ingen av de åtta nya är en av dem.

Skuggans rättelse i §4e drar tillbaka en del av kostnaden. Uppmätt i samma
bygge, genom att byta tillbaka den gamla banan i sju färdiga dokument: 137 till
198 B gzippat per figur, snitt 166 B, alltså **7,6 kB över de 47 sidorna**.

### Katalogen bar sina egna kommentarer ut i varje dokument

Det var en riktig bugg och inte en skönhetsfläck. `maskot-rorelse.css` skrivs in
i sidan som RÅ text, eftersom en riktig `<style>`-tagg hade scopats av Astro och
då aldrig nått delarna riggen lindat in. Rå text går förbi stilpipelinen, alltså
rörde ingen minifiering den, alltså följde 54 476 byte resonemang om Thomas och
Johnston med ut i HTML-dokumentet.

Vad det gjorde, mätt genom att byta tillbaka originalet i tre byggda sidor:

| Sida | Nu | Utan avskalningen |
|---|---|---|
| `/ratta/` | 19 539 B gzippat | 38 800 B |
| `/sok/` | 22 980 B gzippat | 42 182 B |
| `/404` | 17 914 B gzippat | 37 181 B |

**Sidan var mer än dubbelt så stor, och det som fördubblade den var
kommentarer.** 19 200 B gzippat per sida gånger de 22 sidor som bär rörelse är
423 kB över bygget, för text ingen webbläsare läser. Rörelsen kostade därmed
fyra gånger mer än grävlingen den animerar.

Kommentarerna skalas nu av i `Maskot.astro` vid inläsningen. Resultatet är byte
för byte identiskt med källan efter normaliserad blankrad, kontrollerat på 314
klamrar, 50 `@keyframes` och samtliga sjutton selektorer, och bygget bekräftar
att katalogen ligger i dokumenten på exakt de 14 735 B som skrivs.

Sensmoralen är generell och värd mer än de nitton kilobyten: **det som går förbi
ett byggsteg går också förbi byggstegets mätning.** Ingen hade sett talet,
eftersom ingen hade anledning att titta på storleken av något som "bara är CSS".

### Summan, och svaret på nästa fråga

Figuren står på **47 sidor av 16 616**, alltså 0,28 procent. Räknat i ett
färdigt bygge den 13 augusti 2026 genom att söka igenom hela `dist`, inte genom
att räkna upp vad någon minns. Ingen sida bär mer än EN figur, och ingen
verksamhetssida bär någon: de 33 sidorna på djup två är 23 artiklar, åtta
kommunkartor och två kontosidor, och ingenting annat.

| Yta | Sidor | Rörelse |
|---|---|---|
| Artikelfoten | 23 | ja |
| Kartans tomma utsnitt | 8 | nej |
| De tre juridiska sidorna | 3 | nej |
| Om, källor, webbkartan, rapporterna, utmärkelsen | 5 | nej |
| 404 | 1 | ja |
| Metodiken | 1 | nej |
| Tom notislista, tom granskningskö, konto utan bevakningar | 3 | nej |
| Tomt sökresultat | 1 | ja |
| Kvittensen på rättelsen | 1 | ja |
| Avskedet i sluta-bevaka | 1 | ja |

**Talet 34 i förra genomgången är inte samma sak som 47 minus åtta.**
Artiklarna gick från 18 till 23 medan det här arbetet pågick, alltså växte
figurens spridning med fem sidor utan att någon fattade ett beslut om det.
Artikelfoten är den enda ytan i tabellen som skalar med innehållet, och den är
därmed den enda som kan glida. Det är värt att veta nästa gång någon läser
listan och tror att den är statisk.

Därtill två mejlhuvuden, som inte är sidor: bevakningsmejlet och
inloggningsmejlet. Båda använder samma PNG på samma adress, alltså kostar det
andra brevet 577 byte markup och noll nya hämtningar.

Jämförelsen som avgör varje framtida fråga: figuren i sidfoten, i sökpanelen
eller i inloggningsrutan hade betytt 16 616 sidor gånger figurens 4 707 B,
alltså **78 MB gzippat**, och det är svaret nästa gång frågan ställs. Hela
programmets fyrtiosju sidor väger tre promille av det talet.

## 5d. De juridiska sidorna, och de fyra ytorna som prövades och föll

Ägaren har sagt "lägg till prikko maskoten överallt". Det är en beställning och
inte en fråga, alltså är arbetet nedan en genomgång av var "överallt" faktiskt
går, och inte en prövning av om figuren förtjänar plats.

### Villkor, integritetspolicy och kakor: figuren står där, och motargumentet ska ändå stå skrivet

De tre sidorna har figuren i `clean`, i sidhuvudet, utan rörelse.

*Vad som talar för:* den bärande regeln är orörd. Ingen verksamhet nämns,
ingenting bedöms, och sidorna är den renaste formen av "tjänsten talar i eget
namn" som finns i bygget. Tre sidor av 16 616 rör inte frekvensregeln.

*Vad som talar emot, och det ska inte skrivas bort:* GitHubs publika
designsystem säger "Don't use mascots for serious topics. Money, security,
sales, enterprise offerings, apologies, politics or crises should have proper
copywriting, illustration, and visuals." Och Duolingo har ingen Duo på sin
villkorssida, uppmätt 12 augusti 2026.

*Varför det ändå blev ja:* GitHubs regel handlar om att en maskot inte ska
BÄRA ett allvarligt budskap, alltså förklara, ursäkta eller sälja. Figuren gör
ingenting av det här. Den står i sidhuvudet, den har ingen replik, den är i
neutralt viloläge, och texten under den är ordagrant oförändrad. Skillnaden
mellan en avsändare på en sida och en figur inuti ett resonemang är densamma
som skiljer märket från maskoten i §2.

Villkoret är hårt och samma sort som mejlets: **figuren stannar i sidhuvudet.**
Kommer den någonsin ned bredvid en enskild bestämmelse, en ansvarsbegränsning
eller ett samtycke är det fel, och då ska den bort. `.meta { clear: right; }`
på alla tre sidorna finns just för det: datumraden, som är sidans juridiskt
verksamma uppgift, kan inte hamna i figurens flöde.

### Fyra ytor som prövades och föll, med skälen

**Kedjornas register, `/kedja/`.** Sidan är i sin helhet en tabell över
namngivna företag. Ingen bedömning finns där, bara antal ställen och kommuner,
alltså stoppar inte den bärande regeln den. Förbud nummer två gör det:
maskoten står inte i en lista, och en sida vars enda innehåll ÄR listan är
samma sak sedd uppifrån. Delningen i §2 säger att listor är märkets yta.

**Artiklarnas index, `/artiklar/`.** Inte byggd, och skälet är inte principiellt:
artiklarna byggs om av någon annan just nu. Ytan är i sig tillåten, artikelfoten
bär redan figuren på arton artikelsidor, och den som tar upp frågan igen ska
läsa den här raden och inte tro att den föll på en regel.

**Jämförelsen, `/jamfor/`.** Sidan finns för att ställa två namngivna
verksamheters bedömningar bredvid varandra. Att den är tom innan man valt gör
den inte till ett tomt läge, den är ett formulär före sin ifyllnad.
Jämförelserutan står redan uppräknad i §2 bland det som aldrig får ha figur.

**Landningssidan för tredjepartsinloggning, `konto/inloggad.astro`.** Den
enda äkta laddytan i bygget, alltså precis den yta där W3C tillåter en loop och
där gångcykeln i `maskot/gang.svg` hör hemma. Den föll på att sidans ANDRA
läge är ett feltillstånd: samma stycke som säger "Ett ögonblick" byts mot
"Inloggningen gick inte igenom", och §2 punkt 8 förbjuder figuren i
feltillstånd. En figur som står kvar och ser glad ut när en inloggning
misslyckats är exakt det Puzakova beskriver i §4b. Sidan visas dessutom i
några hundra millisekunder och bara för den som loggat in med Google eller
Apple, alltså skulle sex kilobyte betala för något nästan ingen hinner se.

## 6. Vad som återstår

- Startsidans hero är beslutad i princip men inte byggd. `HeroVektor.astro`
  arbetades på parallellt när ytorna byggdes, alltså lämnades index.astro
  orörd. Frågan är inte om figuren får stå där, den är beslutad, utan hur han
  och vektorheron delar plats.
- **Hjälpcentret är ett öppet val, och det är ägarens.** Sidan är byggd och
  ligger uppe. Ingen figur är införd där, med flit, eftersom beläggen pekar åt
  två håll och beslutet därför inte ska fattas i förbifarten av den som råkade
  bygga ytan.

  *Rekommendationen:* EN figur i `clean` på hjälpens ingångssida, ingen på de
  enskilda svaren. Ingången är en sida där tjänsten talar om sig själv, alltså
  samma sorts yta som om- och metodiksidan, och där hör avsändaren hemma. De
  enskilda svaren är innehåll man kommit till för att lösa ett problem, och en
  figur bredvid ett svar på "varför står det ingen kontroll" är precis
  Mailchimps förbud: figuren ger aldrig återkoppling på en uppgift.

  *Emot, och det är det tyngsta belägget i hela researchen:*
  `support.duolingo.com` har **ingen Duo alls**, varken på ingången eller på
  artiklarna. Uppmätt live den 12 augusti 2026: sidan bär ordmärket, rubriken
  "Frequently Asked Questions" och en lista med frågor, och ingenting annat.
  Samma sak gäller deras 404, som är serverns oformaterade standardsida. Det
  företag som är mest förknippat med en maskot håller alltså både hjälpen och
  404:an fria från honom.

  *Vad som ändå skiljer oss från dem:* Duo finns på tusentals skärmar i deras
  app, alltså är hjälpen en av många ytor där han är frånvarande. Vår figur
  finns på 32 sidor av 15 916. Frekvensargumentet som gör att de kan avstå är
  alltså det motsatta hos oss, och det är skälet till att vi redan gjort
  avsteget på 404. Frågan är om hjälpen är ett andra avsteg eller gränsen.

  **Beslutet är nu fattat, och det gick åt andra hållet.** Ägaren har sagt
  "lägg till prikko maskoten överallt", och hjälpens ingång är en sida där
  tjänsten talar om sig själv, alltså samma sorts yta som om- och
  metodiksidan. Duolingoargumentet ovan står kvar som det tyngsta belägget
  emot, och det ska läsas av den som en dag vill ta bort figuren igen: det
  faller på att deras frekvens är den motsatta, inte på att det är fel.

  **Byggd är den ändå inte, och skälet är tillfälligt.** `hjalp.astro` och
  `kontakt.astro` görs om i sin form just nu, eftersom ägaren kallat dem
  "otroligt fula, under all kritik". En figur som läggs in mitt i en
  formändring blir antingen överskriven eller ivägen. Beställningen till den
  som gör om formen:

  > EN figur på hjälpens ingångssida, `pose="clean"`, `size={88}`, klassen
  > `avsandare` och samma flytande form som `om.astro` och `kallor.astro`
  > redan bär. Ingen rörelse. Ingen figur på de enskilda svaren: ett svar man
  > kommit till för att lösa ett problem är precis Mailchimps förbud, figuren
  > ger aldrig återkoppling på en uppgift. Kontaktsidan får samma som om-sidan,
  > `clean` i sidhuvudet, eftersom §2 redan räknar upp kontakt bland de
  > tillåtna.

- ~~**Skuggans form är inte prövad.**~~ **Mätt och rättad.** Se §4e.
- **Utmärkelsens EMBLEM är ett öppet val, och det är ägarens.** Frågan gäller
  filen en verksamhet laddar ner och sätter i sitt fönster, inte
  utmärkelsens ingångssida: den har nu en figur i avsnittet om ribban, se
  tabellen i §2. Emblemet ritas i `lib/marke.ts` och har ingen grävling.

  Emblemet är gränsfallet åt andra hållet: en glad grävling bredvid någon som
  klarat sig är beröm och inte hån, så den bärande regeln stoppar den inte.

  *För:* det är den enda ytan där en verksamhet frivilligt sätter upp vårt märke
  i sitt fönster, alltså vår mest spridda yta. En figur är mer minnesvärd än ett
  ordmärke, och beröm är det enda sammanhang där en maskot är oantastlig.

  *Emot:* märket laddas ner och lämnar sajten, så det går inte att ändra i
  efterhand. Det som sitter i ett fönster sitter kvar i åratal, även om vi ritar
  om figuren. Utmärkelsen är dessutom ett formellt erkännande, och ju mer den
  liknar ett institutionellt intyg desto mer väger den. En figur drar åt andra
  hållet. Och märket blir svårare att göra i tryck och i en färg.

  Byggs inte förrän beslutet är fattat.

- ~~**Matsnuskmärket bär i dag ordmärkets smiley och ska fortsätta göra det.**~~
  ~~**Ritat.**~~ **BORTTAGET 2026-08-22.** Ägaren: "ta bort matsnusk märket
  helt, vill inte köra det." Komponenterna `MatsnuskSeal.astro` och
  `MatsnuskNote.astro`, ritningen `brand/matsnuskmarke.mjs`, den importerade
  `site/src/marks/matsnusk.ts`, provarken och importskriptets `matsnusk`-läge
  är alla borta ur repot, inte utkommenterade. Det som fanns i git finns i git.

  MatsnuskLISTAN lever kvar, se `site/src/lib/matsnusk.ts` och
  `site/src/pages/[kommun]/matsnusk.astro`. Det var MÄRKET ägaren tog bort,
  alltså sigillet bredvid en namngiven verksamhets bedömning, inte listan.

  Två lärdomar ur arbetet är värda att behålla, för de gäller nästa gång något
  ska ritas för en namngiven verksamhet:

  1. **Ansiktet i ett sådant märke är ordmärkets, inte figurens.** Den första
     versionen renderade `FaceMark` i rött, alltså GRÄVLINGENS ansikte, och
     stod därmed bredvid en bedömning av en namngiven verksamhet i strid med
     §2. Ägaren såg det två gånger: "Matsnusk ikonen ska fortsatt ej vara
     grävlingen liksom... är du med???"
  2. **Ett ansikte som fyller ett märke är inte längre ett tecken utan en MIN.**
     En av de sex uppställningarna satte ordmärkets ansikte uppförstorat där
     utmärkelsens årtal står. Den läste bäst av alla i provarket och ströks
     ändå, se §4b. Delningen i §2 mellan neutralt tecken och karaktär går
     alltså inte bara mellan två komponenter, den går också inuti en enda
     ritning.
