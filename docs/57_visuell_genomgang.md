# 57. Visuell genomgång

Inventering, inte lagning. Ingenting i listan var rättat när den skrevs.

ÖVERSTRUKNA RUBRIKER ÄR LAGADE 2026-09-05, och under var och en står vad som
gjordes och vad det mättes till efter bygget. Punkt 1 till 6, 10 till 16, 19
och 20 är hela, punkt 8 och 17 till hälften. Kvar står 7, 9 och 18, som alla
tre är ägarens att avgöra, plus kategorisidans halva av 17. Fynden står kvar
oredigerade under rättelsen: de är mätningen som fanns, och den ska gå att läsa
om igen.

TVÅ FYND VAR FELDIAGNOSTISERADE, och rättelsen står under dem: punkt 19 utgick
från att den fulla kartsidan har en platta bakom attributionen, vilket den inte
har, och punkt 20 pekade ut menypanelen, som inte var källan.

EN RÄTTELSE TILL SJÄLVA MÄTNINGEN, punkt 3. Genvägsmärket var redan släckt på
en riktig pekskärm, för villkoret `(hover: hover) and (pointer: fine)` faller
där. De 62 px mättes alltså i en vy på 375 px som ändå rapporterar en fin
pekare, alltså en smal datorruta eller en emulering utan pekskärm. Felet finns,
men det gällde inte telefonen; det gällde varje smal ruta med tangentbord. Nästa
genomgång bör slå på pekskärmsemulering innan den fotograferar 375, annars mäter
den ett läge ingen telefon har.

## Hur den är gjord

Bygge ur `.claude/worktrees/syn-genomgang` med `--outDir dist-syn`, 17 872 sidor,
med `site/.env` kopierad in så att bevakning, inloggning och omdömen byggdes i
sitt riktiga läge. Kopian serverades lokalt och fotograferades med Chrome över
felsökningsprotokollet, alltså riktig vy 1440×900 och 375×812 med helsidesbild,
inte en 6 000 pixlar hög vy. Det spelar roll: en 6 000 hög vy laddar fler kort i
startsidans rutnät och lägger in en tom yta på 940 px före sidfoten som inte
finns i en riktig webbläsare.

Två saker kostade tid och står här för nästa gång. Kartan kräver att den lokala
servern skickar `text/javascript` för `.mjs`, annars faller `maplibre-gl.mjs`
och varje kartruta visar "Kartan gick inte att ladda" utan att något är fel på
sajten. Och `.env` ligger inte i en worktree, så ett bygge därifrån stänger av
allt som hänger på Supabase; "Följ"-knappen blir avstängd och faller till
1,87:1, vilket ser ut som ett grovt fel men inte är sajtens.

Skärmbilderna ligger i sessionens scratchpad under `bilder/`. Sidtypsbilderna
heter `<sidtyp>-1440.png` och `<sidtyp>-375.png`, utsnitten `z-*.png`.

Sidtyper som tittats på: startsidan, kommunhubb, verksamhet med 113 kontroller,
verksamhet utan bedömning, avregistrerad verksamhet, kommunkarta, rikskarta,
kategorisida, områdessida, kedjesida, topplista, anmärkningslista, söksidan,
artikel, rapport, utmärkelser, dekal, `/api/`, `/metodik/`, `/kallor/`,
`/jamfor/`, `/konto/`, `/ratta/`, `/nytt-och-borta/` och 404.

---

## ~~1. Kommunkartan är en enda klump, vid båda bredderna~~

**LAGAD 2026-09-05, samma rot som punkt 2.** Klusterradien gick från 12 till
40 px, och nålen ritas som en prick tills märket får plats. Övertäckningen i
hubbens ruta vid 1440 gick från 20 gånger till 0,7, och märkesgrönt från
22,5 till 6,1 procent av rutans pixlar. Vid 375 gick rutan från 46 bubblor
till 7. Se `23_rikskartan.md`, avsnittet om att märkena blev fler än rutan
rymde.

**Sidtyp** kommunhubbens kartruta och `/stockholm/karta/`
**Bild** `z-kommun-kartruta.png`, `z-nal.png`, `z-mobilkarta.png`, `kommunkarta-1440.png`

Vid 1440 är kartrutan på kommunhubben 398×458 px och ritar alla 8 567 nålar råa,
utan klustring. Nålen är omkring 19 px bred, så nålarna täcker ungefär 24 gånger
rutans yta. Mätt på bilden är **27 procent av rutans pixlar märkesgrönt**, och
innerstaden blir en vit-grå smet där nålarna ritar över varandra så många gånger
att bilden bleknar. Den fulla kommunkartan har samma problem, 751×747 px och
samma 8 567 nålar, alltså ungefär åtta gångers övertäckning.

Vid 375 blir öppningszoomen lägre och rutan visar kluster i stället, och då
ligger de i en hög: i en ruta på 341×198 px ligger minst 25 bubblor ovanpå
varandra och inte ett enda tal går att läsa helt.

Det här är följden av beslutet i `Karta.astro` från i dag, att öppna på z≥9 så
att man slipper klumparna. Beslutet är rätt tänkt men utfallet i bild är sämre
än det som byttes bort. **Vad det borde vara:** en kartruta där man kan se en
stad. Antingen klustring även över z9, eller mindre punkter i stället för nålar
i den lilla rutan.

## ~~2. Rikskartans kluster ligger ovanpå varandra i öppningsvyn~~

**LAGAD 2026-09-05.** Samma rot som punkt 1: varken klusterradien eller
glesningen visste hur stort märket är som ritas. `/karta/` gick från 30
bubblor med 44 krockande par, varav 24 med mitten täckt och minsta avstånd
5,8 px, till 10 bubblor med noll krock och 41,5 px minsta avstånd.

**Sidtyp** `/karta/` **Bredd** 1440 **Bild** `z-kluster.png`, `rikskarta-1440.png`

I öppningsvyn över Sverige är Mälardalen en hög av bubblor. "635" ligger till
hälften bakom "195" och "25", "960" bakom "10" och "13", och nere till vänster
staplas "133", "53", "18" och "12" så att tre av fyra tal är avskurna mitt itu.
Enskilda nålar ritas dessutom ovanpå bubblorna, så en grön nål sitter mitt i
"636".

**Vad det borde vara:** klusterradien måste vara större än bubblans egen
diameter, annars kan två kluster aldrig undvika varandra. Bubblan är upp till
56 px vid "8.6k" och kluster ritas i dag med mindre avstånd än så.

## ~~3. Sökrutan på mobil: 62 px att skriva i, 48 px åt en tangentbordsgenväg~~

**Sidtyp** alla, sidhuvudet **Bredd** 375 **Bild** `z-mobilhuvud.png`

**RÄTTAT 2026-09-05.** Genvägsmärket krävde bara `(hover: hover) and (pointer:
fine)`, alltså ett svar på vad man pekar med och inte på om fältet har råd med
märket. Villkoret i `SiteSearch.astro` fick `and (min-width: 640px)`, samma tal
som platshållaren redan byter vid. Startsidans dock i `Header.astro` hade
dessutom hårda `inset-inline-start: 132px` mot fältets 121 på varje annan sida,
och är nu skriven som högerkantens formel. Uppmätt vid 375 efter bygget:
inmatningen 133 px mot 62, platshållaren "Sök ställe eller ort" mäter 129 och
ryms hel. Vid 1440 syns märket som förut, med 257 px kvar åt texten.

Formuläret är 183 px brett. Av det får själva inmatningsfältet **62 px**, medan
`.palette-hint` med ⌘ och K tar **48 px** och sökknappen 34. Platshållaren
"Sök ställe eller ort" kapas till "Sök stäl". En telefon har inget ⌘, så nästan
en fjärdedel av sidhuvudets sökruta går åt till en genväg som inte kan användas.

**Vad det borde vara:** dölj `.palette-hint` under touchbrytpunkten. Fältet växer
då från 62 till omkring 110 px, alltså 77 procent mer, utan att något annat
flyttar sig. Det här är listans billigaste rättelse.

## ~~4. Områdeskartans mask dämpar underlaget men inte nålarna~~

**LAGAD 2026-09-05.** Masken ligger nu över utsidans punkter, i både den
levande kartan och stillbilden. Utanför gränsen gick prickens färgstyrka från
85 till 41 och andelen gröna pixlar från 17,3 till 10,4 procent. Innanför
gränsen är varje tal oförändrat in på decimalen. Attributionen löstes utan
något nytt: gränsens upphov flyttades ut ur MapLibres kontroll och står som
egen rad under kartan, varpå MapLibres rad gick från 549 px på två rader till
307 px på en, vid båda bredderna.

**Sidtyp** områdessida **Bredd** 1440 och 375
**Bild** `z-omradeskarta.png`, `z-omradeskarta-mobil.png`

Kartan mörklägger allt utanför områdesgränsen för att lyfta fram Södermalm. Men
punkterna utanför ritas ovanpå masken i full mättnad, och eftersom de ligger på
mörk botten syns de bättre än punkterna inne i området. Strålkastaren pekar åt
fel håll: sidans eget område är den lugnaste delen av sin egen karta.

På 375 tillkommer att attributionen bryter till **två rader och lägger sig rakt
över södra Södermalm** utan platta bakom, alltså över just det området sidan
handlar om. Attributionen tar 40 av kartans 229 px höjd, 17 procent.

**Vad det borde vara:** masken ska ligga över punktlagret också, eller så ska
punkterna utanför området tonas ned med samma opacitet som underlaget. Och
attributionen behöver en platta, som den har på den fulla kartsidan.

## ~~5. Åtta lässidor, två spaltbredder~~

**Sidtyp** alla lässidor **Bredd** 1440

**RÄTTAT 2026-09-05.** Bredden är 680 och inte 584, och den bor nu på ett enda
ställe: `.container.read` i `tokens.css`, byggd av det nya måttet
`--w-read-behallare`. Tretton sidor satte den var för sig och alla tretton satte
den fel, alltså de åtta uppmätta plus `/cookies/`, `/integritetspolicy/`,
`/dekal/`, `/rapporter/` och utmärkelsernas kommun- och emblemsidor. Var och en
har tappat sin egen `max-width` och skriver klassen i stället. Uppmätt vid 1440
efter bygget: brödtexten 680 px vid x = 380 på samtliga, mot metodiksidans 680.
`/api/` och `/konto/` är inte rörda, se punkt 15 och filhuvudet i `api/index.astro`.

Uppmätt brödtextbredd:

| Sida | Bredd | Vänsterkant |
|---|---|---|
| `/metodik/` | **680 px** | x=520 |
| `/kallor/` | 584 px | x=428 |
| `/utmarkelser/` | 584 px | x=428 |
| `/om/` | 584 px | x=428 |
| `/villkor/` | 584 px | x=428 |
| artikelmallen | 584 px | x=428 |
| rapportmallen | 584 px | x=428 |
| `/api/` | 584 px | x=428 |

`tokens.css` beskriver fällan vid `--container-luft`: `.container` är border-box,
så en sida som sätter `max-width: var(--w-read)` på behållaren får 680 minus två
gutters, alltså 584. `metodik.astro` rad 28 och `api/index.astro` rad 43 har
skrivit ner att de gick i den och rättat det. De övriga sex sitter kvar.

**Vad det borde vara:** en bredd, inte två. 96 px är synligt om man växlar mellan
`/metodik/` och `/kallor/`. (`/api/` bearbetas just nu och räknas inte som ett
eget fynd.)

## ~~6. Dekalsidan sätter brödtext i tre grader på en skärm~~

**Sidtyp** `/dekal/` **Bredd** 1440 **Bild** `z-dekal-jamforelse.png`

**RÄTTAT 2026-09-05.** Mittblockets egna `.parad h2` och `.parad p` är borta, så
blocket ärver sidans `section h2` och `section p`. Regeln som avgör står i
`Kontrollserien.astro`: en komponent ärver graden från den komponent den står
inuti, och det här blocket står inte inuti något. Uppmätt vid 1440 efter bygget:
rubriken 24 px som grannarna, prosan 17 px som ingressen, och spalten 396 px i
stället för 300 eftersom punkt 5 gav sidan sina 680.

Ovanifrån och ned: ingressen 17 px i 584 px spalt, sedan mittblockets prosa
**14 px i 300 px spalt**, sedan "Måtten" tillbaka på 17 px i 584 px. Samma nivå i
dokumentet, tre olika grader. Mittblockets rubrik är dessutom `h2` på **21 px**
medan grannrubrikerna "Hämta" och "Måtten" är `h2` på **24 px**.

Radlängden i mittblocket är omkring **38 tecken**, ungefär halva sajtens vanliga
mått. Det ger en väldigt hackig högerkant över tolv rader.

**Vad det borde vara:** mittblocket är inte inneslutet i något, det har varken
kort, ram eller bottenplatta, så regeln i `Kontrollserien.astro` ger det sidans
grad. 17 px och 24 px rubrik, eller så ska blocket faktiskt bli ett kort.

## 7. Den gula etiketten syns värst i kontrollhistoriken

**Sidtyp** verksamhetssida **Bredd** 1440 **Bild** `z-gul-kontrollrad.png`

Uppmätt mot vitt: `#008920` 4,57:1, `#EB0000` 4,63:1, `#6E6E73` 5,07:1 och
`#FECB00` **1,53:1**.

Värst är kontrollhistorikens rader. Där är ordet den enda bäraren av utfallet i
den högra spalten, och den enda hjälpen är en 8 px prick 700 px längre till
vänster, i samma gula och därmed samma 1,53:1. Två rader upp står "Inga
anmärkningar" i grönt och läses direkt. Skillnaden mellan raderna är påfallande
i bild.

Ingen ny färg föreslås här, den frågan är avgjord två gånger. Det här är bara
platsen där den kostar mest.

## ~~8. Kedjesidans fördelning saknar prickar~~, och nämner inte den gröna delen

**Sidtyp** kedjesida **Bredd** 1440 **Bild** `z-kedja-tabell.png`

**HALVT RÄTTAT 2026-09-05.** `FactGrid.astro` har fått en valfri `dot`, med
Fordelning.astro:s exakta mått, och kedjesidan skickar in stapelns tre färger.
Uppmätt efter bygget: gul prick vid "Brister", röd vid "Brister som kvarstår",
grå vid "Ingen bedömning". Verksamhetssidans faktarad skickar ingen prick och
ser ut precis som förut.

**Den gröna kategorin är INTE tillagd, och det kräver ägarens beslut.**
`kedja/[kedja].astro` motiverar i skrift varför den saknas: huvudtalet ovanför
stapeln ÄR den gröna mängden, och "ett tal som redan står på sidan ska inte stå
två gånger". Att lägga in den fjärde posten motsäger alltså en skriven
motivering, och det är inte en lagning utan en omprövning.

Stapeln är 82 procent grön och 18 procent gul. Legenden under den listar
"Brister 6", "Brister som kvarstår 0" och "Ingen bedömning 0", alltså tre
etiketter varav två är noll, **utan färgprickar** och **utan att den gröna
kategorin nämns alls**. Det går inte att koppla stapelns färger till texten, och
den kategori som utgör fyra femtedelar av stapeln har ingen etikett.

Överallt annars på sajten, kommunhubben och verksamhetspanelen, har legenden
färgprick och alla fyra kategorierna.

**Vad det borde vara:** samma legend som resten av sajten.

## 9. Kedjetabellens "Ställen"-stapel läser som ett understreck

**Sidtyp** kedjesida **Bredd** 1440 och 375 **Bild** `z-kedja-tabell.png`, `z-mob-a.png`

Talet är högerställt medan stapeln under det är centrerad i sitt spår, så "15",
"5" och "4" hamnar på olika x och stapeln hänger snett under. Stapeln är 145 px
för "15" men **33 px för "4" och 44 px för "5"**, och vid de längderna läser den
inte som en stapel utan som ett understreck av slumpmässig längd. Kolumnrubriken
"Ställen" står centrerad över spåret, inte över talen.

På 375 blir det värre: stapeln löper från mitten ut till högerkanten och ser ut
som en avdelare mellan raderna.

## ~~10. Söksidans kommunlista har inga spalter~~

**Sidtyp** `/sok/` **Bredd** 1440

**RÄTTAT 2026-09-05.** `flex-wrap` bytt mot `repeat(auto-fill, minmax(min(100%,
200px), 1fr))`. Talet 200 är den längsta etiketten, "Hygienkontroller i
Kristinehamn", som mäter omkring 195 px i 14 px. Uppmätt vid 1440 efter bygget:
tre spår på 205,33 px, och alla tretton raderna börjar på x = 388, 617 och 847.
Spridningen är noll där den var omkring 20 px.

Tretton nästan identiska länkar, "Hygienkontroller i …", flödar med `flex-wrap`
i stället för ett rutnät. Andra kolumnen börjar på x = **592, 582, 578, 598** och
tredje på **789, 809, 791, 810**. Ingen rad linjerar med någon annan, och
spridningen är omkring 20 px.

**Vad det borde vara:** `display: grid` med tre lika spår. Länkarna är lika långa
i innehåll och ska se ut som en tabell.

## ~~11. "Återkommande brister" upprepar samma datum~~

**LAGAD 2026-09-05. Kontroller räknas, inte noteringar.** Av de två vägar
beslutet lämnade öppna valdes den som gör raden sannare och inte bara kortare,
och valet avgjordes med mätning.

Svepet i `recurringIssues` lade en rad per NOTERING, och en kontroll kan bära
flera rader som normaliseras till samma brist. Alternativet "10 juni 2026 (3)"
hade skrivit ut upprepningen men behållit ett värre fel: `count` var antalet
noteringar medan både rubrikens räknare och tipset säger "vid mer än en
kontroll". På **46 rader, spridda över 43 sidor, låg SAMTLIGA noteringar på ett
enda kontrolltillfälle**, och där påstod sidan alltså något som inte stämde. En
parentes hade lämnat de 46 kvar och dessutom lagt ett tal utan enhet intill ett
datum.

Datumen är nu kontrolltillfällen och `count` antalet av dem, vilket är exakt
vad fältet redan säger att det är. Talen är räknade över datafilerna med samma
grind som sidorna byggs med.

Före: 727 av 5 881 rader, 12,4 procent, upprepade minst ett datum, som mest sex
gånger, och de låg på 652 av 3 609 sidor; räknat på bara de fyra datum raden
hinner visa blir det 609 rader på 555 sidor. Efter faller 46 rader på 43 sidor
bort, varav 24 sidor tappar hela blocket. Ingen av dem hade en brist som
återkom, de hade en kontroll som noterat samma sak flera gånger.

Uppmätt i det byggda utfallet: **3 588 sidor bär blocket, 5 838 rader, och noll
rader upprepar ett datum**. Gröna Lund läser nu "10 juni 2026 · 4 juni 2025 ·
11 juni 2024 · 7 juni 2023 · +6 till".

**Sidtyp** verksamhetssida **Bredd** båda

På Gröna Lund står "Information om livsmedel: 10 juni 2026 · 10 juni 2026 ·
10 juni 2026 · 4 juni 2025 · +20 till". Samma datum tre gånger i följd läser som
ett fel även när det är sant, alltså tre avvikelser noterade vid samma kontroll.

Räknat över hela bygget: **557 av 3 609 sidor med blocket, 15 procent**, har
minst en rad där samma datum står två gånger i följd, och som mest tre gånger.

**Vad det borde vara:** slå ihop datum som återkommer, exempelvis "10 juni 2026
(3)", eller räkna kontroller i stället för noteringar.

## ~~12. "Nära dig" visar "0 m"~~

**LAGAD 2026-09-05. Tröskeln är 1 meter, och ordet avgörs av adressen.**

Premissen i beställningen stämde inte och det ändrar svaret: koordinaterna är
avrundade till en MILJONDELS grad och inte en hundratusendels. Samtliga 14 384
koordinater i beståndet är jämna miljondelar och 14 234 av dem är inte jämna
hundratusendelar, alltså är rutnätet 0,11 m i latitud och 0,06 m i longitud.
Noll meter betyder därför samma PUNKT och inte samma avrundning.

Fördelningen över de 13 160 sidor som har en grannlista, 52 640 rader, är en
klippa och inte en sluttning: 7 050 rader på 0 m, 412 på 1 m, sedan 46, 46, 56,
51, 81, 51, 110, 120 och 123 upp till 10 m. Efter 1 m faller antalet nio gånger
och planar ut. Tröskeln är alltså **1 meter**, inte 5 och inte 10: allt däröver
är riktiga avstånd mellan riktiga adresser och ska stå kvar som tal.

Ordet kan däremot inte vara "samma adress" på alla. Av de 7 462 raderna på
1 m eller mindre delar 6 141 adress efter normalisering (82,3 procent), 655
ligger på samma gata med olika nummer, 325 på olika gata och 341 saknar minst
en adress. Koordinaten är en BYGGNAD och adresserna dess entréer:
Hötorgshallen har 21 verksamheter på samma punkt, Kista galleria 20 med
ingångar både från Hanstavägen och Brandesgången, Östermalmshallen 13. Att
skriva "samma adress" på de 1 321 hade bytt ett tal som LÄSER fel mot ett
påstående som ÄR fel. De får "samma plats", vilket är precis vad noll meter
betyder och ingenting mer.

Uppmätt i bygget efteråt: **noll "0 m" kvar på hela sajten**, "samma adress" på
3 736 sidor och "samma plats" på 872. `/stockholm/irems-kok-ab/` läser nu
"Trofo Catering Vinsta samma adress · Bromma Kebab samma adress · Livington
hotel, roboton 40 m". Ordet sätts i `distanceLabel` i `lib/data.ts` och gäller
grannpanelen, "Bäst i närheten" och jämförelserutan, alltså sajtens tre ställen
som skriver ut ett avstånd.

**Sidtyp** verksamhetssida **Bredd** båda

På `/stockholm/irems-kok-ab/` står "Trofo Catering Vinsta 0 m" och "Bromma Kebab
0 m". Talet är sant, det är samma adress, men noll meter läser som saknad data.
Det förekommer på **2 629 sidor bara i Stockholm**.

**Vad det borde vara:** "samma adress" under någon tröskel, eller "under 10 m".

## ~~13. Anmärkningssidan: tretton rader med samma röda etikett~~

**LAGAD 2026-09-05.** Bedömningen har flyttat från en egen spalt i högerkanten
till metaraden, i samma grå som resten av den, och det röda bandet är därmed
borta. Ordet är inte struket: listan är sorterad allvarligast först, så
etiketten byter värde exakt en gång i hela listan, och den skillnaden är värd
att kunna se. Färgen bärs av bedömningsmärket, som ligger kvar, alltså samma
ordning som på resten av sajten där färgen aldrig är ensam bärare.

Ordet VANN på flytten. Spalten doldes under 560 px, så bedömningen fanns inte
alls i text på telefon, och märket till vänster är `aria-hidden`. Nu står den i
klartext vid varje bredd och för varje skärmläsare, till priset av en andra
textrad i listraden vid 375.

Adressraden är samma ändring: **datumet står först**. Uppmätt över de tolv
kommunernas 1 730 listrader saknar 181, alltså 10,5 procent, adress medan 0
saknar datum, och Karlstad och Lomma publicerar knappt någon alls. Raden utan
adress började därför med ett datum medan grannraderna började med en gata.
Nu är radens första uppgift av samma slag på varenda rad och den sista också:
`17 juni 2026 · Blockgatan 9 · Brister som kvarstår` bredvid `17 juni 2026 ·
Brister som kvarstår`, båda ur Karlstads byggda sida.

**Sidtyp** `/stockholm/anmarkningar/` **Bredd** 1440

Varenda synlig rad har "Brister som kvarstår" i rött halvfett i högerkanten,
tretton gånger i rad. Kolumnen bär ingen information, den skapar bara ett rött
band längs sidans högra kant, och det är sidans starkaste grafiska element.
Ingressen har redan sagt vad listan är.

I samma vy saknar rad 9, "Cafe Mito / Nutello House", adress, så dess metarad
börjar med ett datum medan alla andra börjar med en gata. Kolumnen av adresser
bryts på den raden.

## ~~14. Topplistans faktablock är tre layouter staplade~~

**LAGAD 2026-09-05. En layout, och det är sajtens egen.** Båda blocken bär nu
`FactGrid`, alltså samma faktarad som verksamhetssidan och kedjesidan: etikett
över värde, kolumner skilda av luft. Sidans egna två uppsättningar regler är
borta, definitionslistan med talet halvfett inne i en mening likaså.

Den föräldralösa fjärde posten följde av rutnätet. Sidan är `--w-page`, alltså
664 px innehåll vid 1440: fyra spår hade krävt 170 px och fått 154, så spåren
blev tre och den fjärde posten stod ensam i ett spår lika brett som de andra,
vilket läser som en trasig tabell. FactGrid har inga spår att bli ensam i.
Uppmätt vid 1440 efter bygget: tratten 2 + 2 rader vid x = 388 och 595, ribban
2 + 1 vid x = 388 och 605, allt i 13 px etikett över 21 px värde. Vid 375
staplas båda till en post per rad, samma grader.

Den dubblerade rubriken är också borta: `h2` läser "Hela listan" i stället för
`h1`:s egen sträng. Avsnittets `h3`:or säger redan vad raderna är grupperade
efter.

**Sidtyp** `/stockholm/utan-anmarkning/restauranger/` **Bredd** 1440

Blocket "Från kategorin till listan" innehåller i tur och ordning ett rutnät med
tre spalter där den fjärde posten blir ensam på rad två, sedan ett par i två
spalter med ett annat sätt att sätta tal, och sedan en ensam post i full bredd
med ett tredje sätt. I toppen sätts talet på egen rad över en 13 px etikett, i
de nedre delarna sitter det halvfett inne i en löpande mening.

På samma skärm står dessutom `h1` "Restauranger i Stockholm utan anmärkning" och
560 px längre ned `h2` med **exakt samma sträng**.

## ~~15. `/konto/`: ingress i 13 px direkt under en 32 px rubrik~~

**LAGAD 2026-09-05, och rättelsen ligger i `styles/konto.css` och ingen
annanstans.** Regeln som avgör är Kontrollserien.astro:s, att en komponent
ärver graden från den komponent den står INUTI. `.konto-sub` är rätt klass på
fel plats: inuti ett avsnitt bär den ett villkor under en `h2` och gör rätt,
under sidans egen rubrik står den inte inuti något. Regeln
`.konto-head .konto-sub` ger den därför sidans ingressgrad. Uppmätt vid 1440
efter bygget: `h1` 32/43 och underraden **17/26** mot 13 px, med samma rättelse
på `/konto/granska/`, som hade samma par.

Blocket centreras nu också: `.konto-enkel` fick `margin-inline: auto` och
ligger vid x = 340 med 760 px bredd, mot x = 48 och 205 px innehåll i en
1 344 px behållare. Samma enkelspalt som `/sok/` och `/jamfor/`.

`.konto-wide` är rättad i samma ändring, från `--w-read` till
`--w-read-behallare`. Den satt i den border-box-fälla tretton lässidor rättades
ur i punkt 5. Ingenting syns av det i dag: `.granska` sätter `--w-wide` på
samma element och vinner, uppmätt till 1 344 px innehåll före och efter. Talet
var ändå fel och är nu rätt.

**Sidtyp** kontots inloggningsvy **Bredd** 1440 **Bild** `konto-1440.png`

`h1` är 32 px och underraden `.konto-sub` **13 px**, alltså sajtens minsta grad
direkt under sidans rubrik. Varje annan sidtopp går 32 eller 40 ned till 17.

Blocket ligger dessutom vänsterställt vid x=48 i en 1344 px behållare, alltså
205 px innehåll och 1 235 px tomt, medan `/sok/` och `/jamfor/` centrerar sin
enkelspalt. Sidan ser oavslutad ut.

*En annan agent arbetar i kontosidorna, så det här är deras yta.*

## ~~16. Hängande brödsmulepil~~

**Sidtyp** `/jamfor/`, `/nytt-och-borta/`, `/stockholm/nytt-och-borta/`
**Bredd** båda **Bild** `z-jamfor-brodsmula.png`

**RÄTTAT 2026-09-05.** Den avslutande pilen är borta på alla tre sidorna. Formen
är nu KommunHub.astro:s, där pilen hör till smulan EFTER sig och därför aldrig
kan bli sist. Uppmätt i bygget: `/jamfor/` och `/nytt-och-borta/` läser "Prikko",
`/stockholm/nytt-och-borta/` läser "Prikko › Stockholm".

Markupen är `<a>Prikko</a> <span>›</span>` och pilen pekar på ingenting. Tre
sidor av 17 872, kontrollräknat över hela bygget.

## 17. Föräldralösa piller på sista raden

**HALVT RÄTTAT 2026-09-05. 404 är lagad, kategorisidan står kvar, och skälet
är mätt.**

404:ans tretton kommunpiller flödade med `flex-wrap` och `justify-content:
center`, alltså sex, sex och en centrerad ensam med 280 px tomt på var sida. De
ligger nu i spår, samma rättelse som söksidans kommunlista fick i punkt 10 och
av samma skäl: tretton stadsnamn av ungefär samma längd ska se ut som en
tabell. Talet 124 är den längsta pillen, "Kristinehamn", uppmätt till 120,4 px,
plus fyra. Uppmätt vid 1440 efter bygget: fem spår på 126,4 px och raderna
5 + 5 + 3, alla tre med första pillen på x = 388. Vid 375 blir det två spår och
sista raden börjar i det första. Pillen fyller sitt spår, annars är det pillens
kant man ser och inte spårets.

KATEGORISIDANS FILTERRAD FÅR INGEN SÅDAN RÄTTELSE, och det är mätt och inte
utelämnat. Chipsen är olika breda, från 83 till 213 px, och 44 sidor har en
sådan rad: 22 med två chips, 3 med tre, 8 med fyra, 5 med fem och 6 med sex.
Ett rutnät måste ha ett spår som rymmer det bredaste, alltså 213 px, vilket ger
tre spår på 216 i sidans 664. Då blir de åtta sidorna med FYRA chips 3 + 1, och
de ligger i dag på en enda rad: rättelsen hade alltså skapat fler föräldralösa
piller än den tog bort. De 22 sidorna med två chips hade dessutom fått två
216 px lådor i en 664 px rad. Att i stället krympa chipsen räcker inte:
`/stockholm/kategori/restauranger/` behöver 733 px för sina fem och har 664.

Kvar står alltså en rad där ett chip kan hamna ensamt på rad två. Den läser som
ett radbrytningsfel, men varje utväg som mätts kostar mer än den ger, och en
remsa är punkt 18 och ägarens beslut.

**Sidtyp** 404 och kategorisida **Bredd** 1440

På 404 ryms tolv kommunpiller på två rader och "Örebro" hamnar ensam och
centrerad på en tredje. På kategorisidan hamnar "Enklare servering 58" ensam på
rad två efter fyra piller på rad ett. Båda ser ut som ett radbrytningsfel.

## 18. Remsorna klipps mitt i ord, och olika remsor har olika hjälp

**Sidtyp** kommunhubb och områdessida **Bredd** 1440 och 375
**Bild** `z-mob-a.png`, `kommun-1440.png`

På kommunhubben har områdesremsan toning och en chevron i högerkanten. På
områdessidan har typremsan varken toning eller chevron och klipps hårt mitt i
"Skolor och oms", medan områdesremsan under den har chevroner men ändå klipps
mitt i "Vårb". På 375 börjar områdesremsan mitt i ett ord, "tora Essingen", för
att den rullat till det valda området utan toning i vänsterkanten.

Två remsor bredvid varandra på samma sida med olika affordans.

## ~~19. Kartattributionen saknar platta i de inbäddade rutorna~~

**LAGAD 2026-09-05, men inte med en platta, och fyndets premiss var fel.**

Den fulla kartsidan har ingen ljus platta bakom attributionen. Uppmätt i
bygget: `background-color` är `rgba(0, 0, 0, 0)` på `/karta/`, på områdessidan,
på platskartan och på hubbens ruta, alla fyra. Plattan är MapLibres egen och
togs bort på ägarens uttryckliga besked, och läsbarheten bärs i stället av
bläcket och en vit gloria. Skälet och kontrasttalen mot varje yta i kartstilen
står vid upphovsraden i `styles/kartram.css`, och `docs/23_rikskartan.md`
ändring 4 räknar upp plattan bland det som valdes bort. Att bygga en här hade
varit att bygga om en fråga som redan är avgjord två gånger.

Det som VAR fel stod redan uppskrivet i `docs/23` under "Kvar att göra":
hubbens ruta körde `compact: true`. Uppmätt vid 375 före: lådan 317 x **34 px**,
alltså två våningar som tog 17 procent av rutans 200 px höjd, och texten låg
bakom en hopfällarknapp som en attribution aldrig får ligga bakom. Motiveringen
i koden byggde dessutom på fel tal, att rutan är 328 px bred.

Rutan är 343 px vid 375 och 400 vid 1440, och kartbladens rad är 307,3 px, samma
rad som `/karta/` och områdeskartan redan bär. Innanför hörnets 2 x 12 px luft
finns 319 px. Kontrollen kör därför `compact: false` som sajtens tre andra
kartor, och uppmätt efteråt är lådan **307,3 x 15 px på en rad vid båda
bredderna**. Ingen extra upphovsrad behövs under rutan, eftersom raden nu står
utfälld i alla lägen; det är samma villkor som Karta.astro och OmradeHub.astro
redan skrivit ned.

**Sidtyp** kommunhubb, områdessida, platskartan **Bredd** båda

I den fulla kartsidan ligger attributionen på en ljus platta. I de inbäddade
rutorna ligger samma text direkt på kartan, alltså grå 11 px ovanpå gröna nålar
och blått vatten. På områdessidan är strängen 96 tecken lång och bryter till två
rader.

## ~~20. En pixels sidledsöverflöde på kommunhubben vid 375~~

**LAGAD 2026-09-05. Källan var inte menypanelen.**

Den stängda panelens kort och länkar mäter mycket riktigt till x = 387 och 426,
men de ligger i en `<details>` som webbläsaren inneslutit, och att dölja hela
menyn med `display: none` ändrade ingenting: `scrollWidth` stod kvar på 376.
Källan hittades genom att stänga av ett delträd i taget nedåt genom sidan.

Det är kontrolltaktens tidslinje. Talet vid en punkt är centrerat över den med
`translate(-50%)`, och sista punkten ligger i rutans högerkant, så halva talet
hamnade utanför. Uppmätt vid 375: rutan slutar på x = 359, "6 923" är 33,72 px
brett och låg 342,14 till **375,86**, mot sidans clientWidth 375. Prickarna var
redan klamrade in i rutan, talen var det inte. Vid 1440 stack talet ut lika
mycket men ryms i behållarens 48 px luft, och därför syntes felet bara på
telefon.

Första och sista talet ankras nu i sin egen kant i stället för i mitten, med
samma clamp som pricken bär. Uppmätt efter bygget: vid 375 ligger talen 20 till
53,72 och 321,28 till 355 i en ruta 16 till 359, vid 1440 52 till 85,72 och
770,28 till 804 i en ruta 48 till 808, alltså innanför i båda ändarna. Sidans
`scrollWidth` är 375 mot `clientWidth` 375, och samma kontroll är gjord på
startsidan, söksidan, anmärkningslistan, kategorisidan, topplistan, kontot och
404, alla på 375 jämnt.

**Sidtyp** kommunhubb **Bredd** 375

`document.scrollWidth` är 376 mot `clientWidth` 375. Källan är den stängda
menypanelen, vars kort och länkar mäter till x=387 respektive x=426. Ingen
synlig sidledsrullning, men det är enda sidan av de 23 mätta som inte ligger
exakt på 375.

---

## Kollat och friat

Sådant som såg fel ut men har ett skrivet skäl, och därför inte är fynd:

- **Stapelns tal i 13 px grått mot etikettens 14 px bläck.** `Stapel.astro`
  rad 117 och 131 motiverar det med att stapeln redan sagt hur stort talet är,
  och hänvisar till ednia. Medvetet.
- **"Följ"-knappen avstängd och blek, 1,87:1.** Bara i ett bygge utan `.env`.
  Med nycklarna på plats är knappen full blå med vit text.
- **Verksamhetssidans glugg på 184 px mellan spalterna vid 1440.** Följer av det
  dokumenterade beslutet i `tokens.css` att panelen växte till 480.
- **Reglerna i skalan.** Ingen sidtyp sätter en textgrad utanför 11, 12, 13, 14,
  17, 21, 24, 32, 40 och 48. Undantaget är informationsprickens "i" på 10 px,
  som är en ikon.
