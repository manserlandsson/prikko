# 15. Vad Prikko blir: verksamhetssidan och kommunsidan när källorna ligger på plats

Datum: 2026-08-04. Den här rapporten letar inga källor. Rapport 12 och 13 har
gjort det och deras slutsatser tas för givna här, inte om. Det som står nedan är
produktbeslut: var uppgifterna hamnar på sidan, vilken fråga var och en besvarar,
vad som ska bort för att göra plats, och var gränsen går mellan att berika och
att börja påstå.

Två siffror är räknade i den här rapporten, båda ur rapport 13:s mätningar, och
de är markerade som härledda där de står. Inga nya mätningar är gjorda.

---

## 1. Ednia-frågan, besvarad

Ednias värde var inte att de hade data. Det var att informationen låg utspridd
mellan Gymnasieantagningen, Skolverket, skolornas hemsidor och statistikdatabaser,
och den som ville ha hårda fakta fick öppna excelark. De samlade det som låg
utspritt.

Frestelsen är att läsa av parallellen fel och tro att vår motsvarighet är att
samla fler register om företaget. Bolagsverket, Skatteverket, Kolada,
Folkhälsomyndigheten. Fler ark, mindre spridning.

Det är inte vår motsvarighet, av ett enkelt skäl: **för restauranger är de
registren redan samlade.** Allabolag, Ratsit och hitta.se har gjort exakt det i
femton år, och de gör det bättre än vi någonsin kommer att göra. Att lägga
företagsform och F-skatt på en sida är att komma sist till ett bord som redan är
dukat.

Det som ligger utspritt hos oss är något annat. Det är **kontrollen själv, och
allt som gör den läsbar.**

I dag säger vår verksamhetssida: kommunen var här den 17 maj 2023 och noterade
inga avvikelser. Det är en sann uppgift och den finns ingen annanstans samlat.
Men den besvarar inte frågan besökaren faktiskt kom med, som är "ska jag äta här
i kväll". Mellan de två frågorna ligger fyra hål:

1. **Finns stället kvar?** Ett besked från 2023 om ett ställe som lade ned 2024
   är inte färskt, det är fel.
2. **Är det samma verksamhet som blev kontrollerad?** Vår egen metodiksida
   erkänner öppet att historiken följer lokalen och inte företaget. Det är
   sajtens största kända svaghet och den står utskriven i klartext.
3. **Kan jag gå dit nu?** En hygienbedömning utan öppettider är ett
   myndighetsutdrag, inte ett beslutsunderlag.
4. **Vad är det här för ställe?** I dag står det "1. Restaurang" på sidan,
   ordagrant som Stockholm skrev det. Det är inte ett svar, det är en radetikett
   ur någon annans system.

**Vår motsvarighet till Ednias excelark är alltså inte företagsregistren. Det är
de fyra hålen.** Varje källa i rapport 12 och 13 är värd exakt så mycket som den
fyller ett av dem, och ingenting alls om den inte gör det. Det är den
rangordningsprincip resten av rapporten använder.

Och en sak till, som ligger bredvid och är minst lika stor. Rapport 12 del D
pekar på den utan att dra slutsatsen: **kommunsidan är den sida som lyfts mest.**
Se avsnitt 5.

---

## 2. Layoutregeln som allting annat hänger på

Innan en enda ny uppgift landar måste en regel sitta, annars gör de nya källorna
sidorna sämre och inte bättre.

Räkningen som tvingar fram den, härledd ur rapport 13 del B1. Där mäts två saker
var för sig: hur stor andel av våra publikvända verksamheter som alls matchar en
OSM-punkt, och hur stor andel av de matchade som bär respektive tagg. Produkten
av de två är den andel av våra verksamhetssidor som faktiskt får fältet. Den
produkten står inte i rapport 13 och är räknad här:

| fält | Karlstad, andel av publikvända sidor | Jönköping |
|---|---|---|
| öppettider | 25,5 % | 8,9 % |
| webbplats | 24,2 % | 8,2 % |
| kök | 15,9 % | 9,6 % |
| tillgänglighet | 17,5 % | 2,8 % |
| telefon | 13,4 % | 6,9 % |
| uteservering | 17,9 % | 3,2 % |

Karlstad är bästa fallet i mätningen, och där får en sida av fyra öppettider. I
Jönköping är det en av elva. I Borgholm, Höganäs, Lomma och Svenljunga, 968
verksamheter utan koordinat, är det noll.

Det betyder att **inget OSM-fält någonsin kan bära en plats i huvudkolumnen.**
En rubrik som heter "Öppettider" och står tom på tre sidor av fyra är sämre än
ingen rubrik alls. Den läser som att sajten är trasig, inte som att uppgiften
saknas.

Regeln, som ska gälla varje ny uppgift utan undantag:

> **Full täckning i huvudkolumnen. Ojämn täckning i sidopanelen. Ingen tom
> etikett någonsin.**
>
> Ett panelblock renderas bara när minst tre rader är fyllda. Under tre rader
> renderas ingenting, inte ens rubriken. Panelen ovanför flyttar upp och tar
> platsen.

Den regeln har två konsekvenser som är värda att se direkt. Den första: kartan
och bilden i dagens panel följer redan mönstret, saknas bilden tar kartan dess
plats, så konstruktionen finns. Den andra, och den viktigare: **de enda nya
källorna med full täckning är kommunkällorna.** Kolada har varje kommun,
myndighetsrapporteringen lämnas av varje kontrollmyndighet. De är därmed de enda
som får plats i huvudkolumnen, och det är på kommunsidan de landar.

---

## 3. Verksamhetssidan, ritad

### Så ser den ut i dag

Huvudkolumn, uppifrån: brödsmula, namn, adressrad med rå typsträng, ansiktsmärke
plus nivå plus svarsmening, utmärkelsenotis, faktaruta med fyra tal,
kontrollområden, uppföljning, återkommande brister, kontrollhistorik, omdömen,
uppdaterat-datum. Sidopanel: bild, karta, tre åtgärdsknappar, närliggande,
kommunsammanfattning.

Sidan är välbyggd och den säger en sak väl. Den säger ingenting om de fyra hålen.

### Så ser den ut efteråt

**Överst, oförändrat i form men inte i innehåll.** Namnet, sedan adressraden.
Adressraden slutar i dag med `types[0]`, alltså kommunens egen etikett rakt av:
"1. Restaurang", "Restaurang och servering", "1. Snabbmatsrestaurang". Tre
stavningar av samma sak över 6 001 rader.

Den ska bort. I stället: normaliserad kategori, och när OSM bär `cuisine` den
specifika sorten.

    Nu:      Kungsgatan 12, Karlstad · 1. Restaurang
    Efteråt: Kungsgatan 12, Karlstad · Pizzeria

Det är den enskilt mest synliga förbättringen i hela rapporten och den kräver
ingen ny källa för sitt första steg. `site/src/lib/categories.ts` normaliserar
redan.

**Sedan, och bara när den behövs: statusnotisen.** En ruta ovanför bedömningen,
aldrig bredvid den. Den finns i ett enda utfall:

> Bolaget som drev verksamheten, Vesuvio Restaurang AB, försattes i konkurs den
> 12 mars 2025. Kontrollen nedan gjordes dessförinnan och beskriver inte något
> pågående. Uppgift från Bolagsverket, hämtad 2026-08-04.

När den rutan står ska bedömningen nedanför skrivas i förfluten tid, och sidan
ska markeras som historik i stället för som aktuellt besked. Det här är den enda
uppgift från tredje part som får ändra hur bedömningen läses, och den får det
bara därför att den **tonar ned** ett påstående. Se avsnitt 6.

**Bedömningen, oförändrad.** Ansiktsmärket, nivån, svarsmeningen. Betyget är
hjälten och ingen ny uppgift får konkurrera om den ytan. Svarsmeningen får inte
heller växa: den är den enda rad en språkmodell sannolikt citerar och den ska
handla om kontrollen, inte om öppettider.

**Faktarutan, ett byte.** I dag: Kontroller, Utan anmärkning, Återbesök, Äldsta
kontroll. Den fjärde cellen finns bara för att vi inte kan säga när verksamheten
startade, och tipset förklarar omständligt att årtalet inte är verksamhetens
ålder. Med ett **bekräftat** organisationsnummer kan cellen bli det den hela
tiden velat vara:

    Kontroller 14 · Utan anmärkning 79 % · Återbesök 2 · Registrerad 2019

Och då, först då, kan sidan säga det metodiksidan i dag bara kan varna för:

> Verksamheten registrerades 2019. Kontroller på adressen från 2016 och 2017
> gäller en tidigare verksamhet i lokalen.

**Det är den största kvalitetshöjningen orgnr kan ge, och den står inte i rapport
12.** Rapport 12 säljer organisationsnumret som nyckeln till registerlandskapet.
Sett från sidan är det något annat och bättre: det är det enda som kan laga
sajtens största erkända svaghet. Att veta vilken del av historiken som tillhör
vem är värt mer än varje företagsuppgift man kan slå upp med numret.

Två celler om årtal är en för mycket, så "Äldsta kontroll" viker för
"Registrerad" när numret finns, och står kvar oförändrat när det inte gör det.

**Resten av huvudkolumnen, oförändrad.** Kontrollområden, uppföljning,
återkommande brister, historik, omdömen. Det är sajtens argument och ingenting
ska in mellan dem.

### Sidopanelen

Tre paneler i stället för dagens tre, men med annat innehåll.

**Panel 1, oförändrad:** bild, karta, åtgärdsknappar.

**Panel 2, ny: "Om verksamheten".** Här bor allt med ojämn täckning. Raderna, i
den ordning de ska stå, och var och en visas bara när den finns:

    Öppettider
      Mån–tor    11–22
      Fre–lör    11–23
      Sön        stängt
      Öppnar 11.00 i morgon
    Kök           Pizza, italienskt
    Tillgänglighet Rullstolsanpassad
    Telefon       054-12 34 56
    Webbplats     vesuvio.se
    Servering     Stadigvarande serveringstillstånd till allmänheten, beviljat 2019

    Öppettider och kök från OpenStreetMap, senast ändrade 4 mars 2026.
    Serveringstillstånd från Folkhälsomyndigheten.

Fyra beslut ligger i den rutan och de är värda att skriva ut.

**Öppettiderna renderas som tabell, aldrig som en grön pill.** "Öppet just nu"
som färgad markör bredvid ansiktsmärket vore att låta en tredjepartsuppgift låna
bedömningens formspråk. En besökare som ser grönt bredvid grönt läser ihop dem.
Raden "Öppnar 11.00 i morgon" är däremot precis vad någon vill ha, så den står
kvar, i löptext och utan färg.

**Öppna-raden har ett färskhetsvillkor.** Den räknas fram ur OSM:s regelsträng,
och en regel som ingen rört sedan 2021 är en gissning om i morgon. Villkoret:
öppna-raden visas bara om OSM-objektet ändrats inom 24 månader. Tabellen står
kvar oavsett, för en gammal öppettid är fortfarande en uppgift, medan ett gammalt
"öppnar 11.00" är ett påstående.

**Serveringstillstånd är ett positivt-bara-fält.** Det finns eller så vet vi
inte. Raden får aldrig läsa "saknar serveringstillstånd", för frånvaron i vår
data betyder två helt olika saker och vi kan inte skilja dem åt.

**Källan står i panelen, inte på /kallor.** För återgivna och härledda uppgifter
räcker sajtnivån, det avgjordes redan när källfoten på verksamhetssidan
kortades ned. För anrikade uppgifter gör den inte det, eftersom vi svarar för
hopkopplingen och inte för innehållet. Se avsnitt 6.

**Panel 3: närliggande.** Oförändrad, med ett tillägg: dagens
kommunsammanfattningspanel avvecklas som egen panel. Dess enda mening flyttar
till huvudkolumnens fot, ovanför uppdaterat-datumet, där den läser bättre ändå,
och dess länkar hamnar i foten på närliggande-panelen. Fyra paneler i en sticky
kolumn är en för mycket och den nya panelen är viktigare än den gamla.

### Kedjeraden, senare

Med bekräftade organisationsnummer i mer än en kommun blir en rad möjlig som
ingen annan i Sverige kan skriva:

> Ingår i Espresso House. Vi har 71 av kedjans verksamheter, varav 63 utan
> anmärkning vid senaste kontrollen.

Kedjor är aktiebolag, alltså inga personuppgiftsfrågor, och det är en berättelse
konsumentredaktioner tar utan att vi behöver rangordna någon kommun. Men den
kräver orgnr i flera kommuner och där finns bara ett orakel, i Stockholm. Den
ligger därför i fas två, inte i topp tre.

---

## 4. Rangordning: vad som gör mest skillnad för en besökare

Ordnat efter vad besökaren märker, inte efter vad som är lätt att hämta. Kostnad
i arbete för en ensam utvecklare står i varje punkt.

**1. Rätt sorts ställe i rubrikraden.** Fyller hål 4. Träffar varje sida, i varje
kommun, utan täckningsproblem, och tar bort en synlig skavank ("1. Restaurang")
som får sajten att se ut som en export. Kostnad: några timmar för normaliseringen
som redan är byggd, plus två till tre dagar för `cuisine` när OSM-körningen ändå
görs.

**2. Är det samma verksamhet, och finns den kvar.** Fyller hål 1 och 2. Detta är
den enda punkten som gör en befintlig uppgift på sidan *sannare* i stället för
att lägga en till bredvid. Kostnad: hög, och den är inte i sidan utan i bryggan.
En helg för bulkfilsindexet, någon dag för Stockholms-verifieraren, tålmodig
körning. Ger 53 procent av beståndet och noll procent av de elva andra kommunerna.

**3. Öppettider.** Fyller hål 3. Bästa fallet en sida av fyra, sämsta noll.
Kostnad: två till tre dagar tillsammans med punkt 1, mot en Geofabrik-fil, plus
en timmes ögonkoll av femtio matchningar som ägaren måste göra själv.

**4. Kommunens nämnare.** Se avsnitt 5. Full täckning, inget orgnr-beroende,
ingen juridisk fråga. Kostnad: en dag för Kolada, två till tre för
myndighetsrapporteringen om den måste hämtas för hand.

**5. Webbplats och telefon.** Samma körning som punkt 3, alltså gratis när den är
gjord. Låg egen effekt på besökaren, men webbplatsen har en andrahandsvinst som
är värd mer än fältet: den gör domänmejlsverifiering av ägaranspråk möjlig, och
det är skillnaden mellan att ägaruppladdning kräver en manuell registerkontroll
per anspråk och att den skalar.

**6. Serveringstillstånd.** Neutral, stark, och en enda begäran mot en enda
myndighet i stället för 275 kommunbrev. Ligger här och inte högre bara för att
svarstiden inte går att styra. Skicka begäran nu, räkna med den om ett halvår.

**7. Tillgänglighet.** Liten publik, stort värde för den publiken, och svår att
hitta någon annanstans. 17,5 procent i Karlstad och 2,8 procent i Jönköping är
för tunt för att lova, men fältet kostar ingenting extra i samma körning och ska
med.

**8. Kedjegruppering.** Redaktionellt värde före besökarvärde. Fas två.

---

## 5. Kommunsidan, ritad, och varför den lyfts mest

Rapport 12 del D behandlar Kolada och myndighetsrapporteringen som två poster
bland tio. Sett från sidan är de något annat: **de enda nya källorna med full
täckning.** Varje kommun finns i Kolada. Varje kontrollmyndighet lämnar sin
XML senast 31 januari. Ingen matchningsfråga, ingen ojämn sida, inget
organisationsnummer i vägen.

Enligt layoutregeln i avsnitt 2 är de därför de enda nya uppgifter som förtjänar
huvudkolumnen. Och kommunhubben är, som koden själv konstaterar, den sidtyp som
bär trafiken.

### Hålet på kommunsidan

Dagens kommunsida säger vad kontrollen **gav**: andelar per nivå, vanligaste
bristerna, uppföljningsgrad, hur många som inte bedömts. Den säger ingenting om
vad kontrollen **var**. Metodiksidan tvingas därför skriva ut spannet från 0,3
procent i Jönköping till 23,7 procent i Oskarshamn och sedan be läsaren att inte
läsa det som en ranking, utan att kunna erbjuda något att läsa det som i stället.

Myndighetsrapporteringen är det som saknas.

### Blocket, och var det står

Ett nytt avsnitt i huvudkolumnen, mellan `FollowUpRate` och `Uncovered`, alltså
efter hur uppföljningen gick och före vad som inte hunnits med. Rubrik: **"Så
bedrivs kontrollen i Örebro"**.

    Anläggningar i kommunens register       1 411
    Kontrollerade under 2025                  861   (61 %)
    Uppföljande kontroller                    214
    Invånare per registrerad anläggning        112

    Riket i mitten: 54 procent kontrollerade, 9 procent uppföljande kontroller.

    Kontrolluppgifter: Livsmedelsverkets myndighetsrapportering för 2025.
    Befolkning: Kolada.

Och en mening under, som är hela poängen:

> Kommunerna kontrollerar olika ofta och följer upp olika ofta. Andelen
> verksamheter med kvarstående brister speglar därför både hygienen och
> arbetssättet, och de två går inte att skilja åt utifrån.

Det förvandlar den förbjudna rangordningen till en tillåten förklaring, vilket är
exakt vad rapport 12 hoppades på, och det gör det på den sida där läsaren står
när frågan uppstår i stället för på metodiksidan dit få klickar.

### Två regler som måste sitta samtidigt

**Aldrig en sorterad tabell över kommuner.** Kolada gör det trivialt att bygga
en, och det är precis den bindande gränsen. En kommuns tal visas på den kommunens
egen sida, och det enda jämförelsetalet är **medianen som referenslinje**. Ingen
sortering, ingen topplista, ingen kartfärgning per kommun på nyckeltalet.

**Mer kontroll är inte bättre kommun.** 61 procent kontrollerade kan betyda god
tillsyn, eller ett register fullt av avregistrerade anläggningar, eller en
riskklassning som styr om resurser. Texten ska visa talet och avstå från
riktningen. Vi ger nämnaren, inte omdömet.

**Uncovered skrivs om, inte bort.** I dag uppskattar den täckningen ur vår egen
data. Med anläggningsantalet ur myndighetsrapporteringen kan den säga det på
riktigt: hur många av kommunens registrerade anläggningar vi har, och hur många
som inte har någon publicerad kontroll. Det är samma ruta med ett riktigt tal i.

**Kommunvapen fortsatt aldrig.** Kommunsidans identitet kommer från stadsfotot i
banderollen, ingenting annat.

---

## 6. Den redaktionella gränsen

Frågan är riktigt ställd: i dag återger vi kommunens bedömning, och med
företagsstatus, öppettider och omdömen blir sidan något mer än en återgivning.
Var går gränsen?

Svaret är inte en gräns utan fyra klasser, och regeln är att en klass aldrig får
låna en annan klass formspråk.

**Klass 1, återgivet.** Kommunens uppgift, attribuerad till kommunen.
Kontrolldatum, avvikelser, kontrollområden, verksamhetens svar. Vi svarar för att
vi återgett rätt, inte för sakinnehållet.

**Klass 2, härlett.** Vår slutsats ur klass 1. Bedömningen, utmärkelsen,
statistiken, återkommande brister. Vi svarar för metoden. Metodiksidan är
försvaret, modellen är versionerad, och varje publicerad bedömning bär numret på
den version som räknade fram den.

**Klass 3, anrikat.** Uppgift från tredje part om verksamheten. Öppettider, kök,
webbplats, tillgänglighet, företagsform, registreringsår, status,
serveringstillstånd. **Vi svarar för hopkopplingen, inte för uppgiften.** Det är
den meningen hela avsnittet vilar på.

**Klass 4, andras åsikter.** Omdömen. Publiceras under vårt namn men är ingens
fakta.

Reglerna som följer:

**En klass 3-uppgift får aldrig bära klass 2:s form.** Ingen färg ur
betygsskalan, inget ansiktsmärke, ingen sigill, ingen ruta som liknar
bedömningsblocket. Det är därför "Öppet nu" inte får bli en grön pill. Grönt är
bedömningens språk på den här sajten och får inte lånas ut.

**En klass 3-uppgift bär sin källa och sitt datum på samma yta som den själv
står.** För klass 1 och 2 räcker /kallor och /metodik, och det avgjordes redan
när källfoten på verksamhetssidan kortades ned till en färskhetsrad. För klass 3
räcker det inte, eftersom vi inte svarar för innehållet. Källan i panelen är inte
prydnad, den är ansvarsfördelningen.

**En klass 3-uppgift får aldrig ändra en klass 2-uppgift uppåt.** En
`cuisine`-tagg får inte påverka bedömningen. Ett registreringsår får inte höja
eller sänka ett betyg. **Enda tillåtna undantaget är nedtoning:** en bekräftad
konkurs eller avregistrering får flytta sidan från aktuellt besked till historik.
Att dämpa ett påstående är alltid ofarligt, att skärpa det är det aldrig. Detta
är rapport 12:s "bygg det defensivt" formulerat som en redaktionell regel i
stället för som en teknisk.

**Osäker hopkoppling publiceras inte.** Huset har redan precedensen och den är
bra: verksamhetssidan publicerar inte `geo` i JSON-LD för koordinater vi
geokodat fram själva, eftersom schemat inte kan bära förbehållet och vi då hellre
avstår. Samma regel gäller varje anrikat fält. En felkopplad öppettid är sämre än
ingen öppettid, ett felkopplat organisationsnummer är i värsta fall förtal. Ett
sannolikt matchat orgnr duger till intern analys och till aggregat, aldrig till
en verksamhetssida.

**Varje klass 3-fält måste gå att stänga av enskilt.** Rättelseflödet på /ratta
är ett publicerat löfte, och ett löfte som bara kan uppfyllas genom att bygga om
hela hopkopplingen är inget löfte. Anrikade fält ska därför lagras per fält med
källa och en manuell överstyrning, så att en felaktig öppettid på en sida kan
släckas på en minut. Det är ett arkitekturkrav som följer direkt ur den
redaktionella regeln, och det är billigt att fatta nu och dyrt att backa senare.
Samma tabellindelning löser dessutom ODbL-gränsen mot OSM.

**Fysiska personer, tills vidare inget alls.** Utgivningsbeviset är föreslaget men
inte sökt. Till dess visas ingen företagsuppgift alls för en enskild firma, och om
företagsformen inte går att avgöra ur numret självt visas ingenting. Det är den
enkla säkra linjen, och den kostar oss lite eftersom företagsblocket ändå är
blockerat bakom organisationsnumret.

**Omdömen aggregeras inte.** Bibeln noterar riktigt att Google tillåter
`AggregateRating` för förstapartsomdömen. Vi ska ändå avstå tills volymen betyder
något. Ett medelbetyg på 4,5 ur tre omdömen, satt bredvid en hygienbedömning,
gör hygienbedömningen till en recension i läsarens ögon, och den separationen är
det metodiksidan lovar. Enskilda omdömen, sist på sidan, tydligt åtskilda, som i
dag.

**Svarsmeningen förblir om kontrollen.** Den är den enda rad ett AI-svar
sannolikt citerar. Öppettider, kök och företagsform hör inte hemma i den, hur
frestande det än är att fylla den. Anrikningen hör hemma i den strukturerade
datan, där `FoodEstablishment` redan tar `openingHoursSpecification`,
`telephone`, `url` och `servesCuisine`, och där regeln är enkel: det som visas på
sidan med sin källa får ligga i schemat, det som är släckt på sidan är släckt
även där.

---

## 7. Vad som INTE höjer sidan

Ärligheten som briefen ber om, och den kostar några poster som ser bra ut i en
källförteckning.

**F-skatt och moms.** Rapport 12 C2 föreslår en "seriositetsrad". Jag avråder.
För en besökare som väljer var hen ska äta bär "godkänd för F-skatt" noll
information, eftersom det är sant om i princip varje verksamhet som har öppet.
Och där det saknas är det oftast en administrativ eftersläpning och inte en
signal, medan raden "saknar F-skatt" bredvid en hygienbedömning är precis den
antydan vi inte kan stå för. Uppgiften kan ha ett värde i ägarpanelen eller på
B2B-sidan. På verksamhetssidan gör den skada eller ingenting.

**Panoramax som självständig bildkälla.** 5,8 procent inom 30 meter. En bild på
en sida av tjugo får de nitton andra att se trasiga ut. Andrahandskälla efter
Mapillary, aldrig grund.

**Uteservering.** 17,9 procent i Karlstad och 3,2 procent i Jönköping av de
publikvända sidorna, härlett som i avsnitt 2. Det är definitionen av ett ojämnt
fält och det är dessutom det minst intressanta av OSM-fälten. Hämta det, lagra
det, rendera det inte. Det får sitt värde först som filter på kartan.

**Prisklass.** Finns inte i någon fri källa. Härled den inte ur något annat.

**Wikimedia Commons och og:image.** Avgjorda i rapport 13. Nämns här bara för att
ingen ska ta upp dem igen.

**Betalningsförmåga, skulder, anmärkningar.** Tillståndspliktigt, känsligt för
enskilda firmor, och fel produkt. Vi är inte Ratsit och ska inte försöka bli det.

Och den generella regeln bakom listan: **en uppgift som finns på en femtedel av
sidorna gör fyra femtedelar sämre, om den får en egen rubrik.** Antingen bor den
i ett panelblock med tröskeln i avsnitt 2, eller så bor den bara i databasen tills
täckningen är löst. Ett tredje alternativ finns inte.

---

## 8. Vad som ska bort

Kort lista, eftersom briefen frågar.

- **`types[0]` ur adressraden på verksamhetssidan.** Kommunens råa etikett ska
  aldrig synas. Ersätts av normaliserad kategori, och av kök när det finns.
- **Kommunsammanfattningspanelen i sidopanelen.** Meningen flyttar till
  huvudkolumnens fot, länkarna till foten på närliggande-panelen. Panelen som
  egen enhet upphör, för att ge plats åt "Om verksamheten".
- **Faktarutans "Äldsta kontroll", men bara när "Registrerad" finns.** Två celler
  om årtal är en för mycket, och den nya säger det den gamla bara kunde
  reservera sig mot.
- **Ingenting på kommunsidan.** `Uncovered` skrivs om med ett riktigt
  anläggningsantal i stället för en uppskattning, men rutan står kvar.

---

## 9. De tre sakerna som ska göras först

**0. Skicka utgivningsbevisansökan i veckan.** Det är ingen av de tre, det är
något som ska ligga och handläggas medan de tre byggs. 3 000 kronor, tio års
giltighet, någon timmes formulär. **Vad det kräver av dig:** att du utser en
ansvarig utgivare, och det är sannolikt du själv. Det är ett verkligt
personligt ansvar för allt som publiceras, inte en formalitet, och det är den
enda punkten i rapporten där du tar på dig något som inte går att koda bort.
Rapport 12 del E4 har resonemanget. Fram till dess gäller den enkla säkra linjen:
ingen företagsuppgift alls för enskilda firmor.

Rapport 13:s förutsättning gäller fortfarande och är oberoende av det här: skaffa
en Mapillary-token och kör `pipeline/matt_bildtackning.py`. Tio minuter, och den
avgör om bildspåret är en helg eller ett nedlagt spår.

**1. Fatta layoutbeslutet och normalisera typraden. En dag.**

Det här är inte kod först, det är ett beslut först. Full täckning i
huvudkolumnen, ojämn täckning i sidopanelen, ett panelblock renderas bara med
minst tre fyllda rader, ingen tom etikett någonsin. Sedan tömningen av
`types[0]` ur adressraden och den normaliserade kategorin i stället.

**Vad det kräver av dig:** en timmes beslut och ett godkännande av att kommunens
egen typetikett försvinner från den synliga sidan. Inga pengar, ingen ny källa,
ingen juridisk fråga. Det ligger först därför att varje punkt efter den landar
fel utan den. Landar öppettiderna innan regeln sitter får du 8 802 sidor med en
halvtom faktaruta, och det är svårare att ta bort än att aldrig ha byggt.

**2. Koppla på Kolada och Livsmedelsverkets myndighetsrapportering på
kommunsidan. Tre till fyra dagar.**

Full täckning, ingen matchning, inget organisationsnummer i vägen, ingen juridisk
risk, och den lyfter den sidtyp som bär trafiken. Den ger dessutom metodiksidan
det den i dag saknar: något att läsa spannet mellan kommunerna **som**, i stället
för en uppmaning att inte läsa det som en ranking.

**Vad det kräver av dig:** en halvtimme framför Livsmedelsverkets Uttagswebb för
att avgöra om uttaget är maskinläsbart eller måste hämtas för hand. Rapport 12
listar det som overifierat. Är det manuellt är det ändå rätt beslut att hämta tolv
kommuner för hand nu och automatisera vid femtio. Dessutom ett uttalat beslut från
dig att talen aldrig sorteras mellan kommuner, bara jämförs mot en median.

**3. Anrika med OpenStreetMap. Kök först, sedan öppettider, webbplats, telefon och
tillgänglighet. En helg plus en dag.**

Mot en Geofabrik-utdragsfil för Sverige, aldrig mot Overpass. Namn plus koordinat
inom 75 meter. Egna tabeller för de OSM-härledda fälten, med källa och
överstyrning per fält, så att både ODbL-gränsen och rättelseflödet går att peka
på. "© OpenStreetMap contributors" i sidfoten.

**Vad det kräver av dig:** ungefär en timme med ögonen på femtio matchningar
innan något publiceras, och det måste vara du och inte pipelinen. Rapport 13
skriver ut att matchningen är mätt men inte granskad för hand. En felkopplad
öppettid är den billigaste tänkbara vägen att förlora det förtroende hela
produkten vilar på.

**Det som medvetet inte ligger i topp tre: organisationsnummerbryggan.** Rapport
12 har den som sin punkt 2 och den är rätt bedömd som infrastruktur. Men mätt mot
vad en besökare ser hör den till fas två, av tre skäl. Den når 53 procent av
beståndet och noll av elva kommuner. Dess bästa avkastning, att kunna säga vilken
del av historiken som tillhör den nuvarande verksamheten, kräver ett bekräftat
nummer, och ett felaktigt nummer är det dyraste felet sajten kan göra. Och den
kostar mest av allt i rapporten. Bygg den efter att de tre ovan står, och bygg
den då i den ordning rapport 12 anger: matcha offline, bekräfta med ett anrop,
publicera bara bekräftade nummer.
