# 59. Hur Prikko får användare

**Datum:** 2026-09-05.
**Beställning:** skriv planen för hur Prikko får användare, grundad i mätning
och inte i tyckande. Tre frågor skulle besvaras: hur jämförbara tjänster
faktiskt fick sina användare, vilka kanaler som är värda vår tid, och om det
saknas något i produkten som är själva anledningen att ingen kommer.
**Föregångare:** `45_entreprenorslistan.md` är arbetsordningen,
`49_indexeringen.md`, `51_klickdjupet.md` och `53_egen_text_per_sida.md` är
diagnosen av sökkanalen, `54_affarsmodellen.md` bär förbuden och
halvårsregeln, `44_marknaden_2026.md` och `26_seo_bortom_hygienordet.md` bär
marknaden och efterfrågan, `30_programmatisk_seo.md` bär filtaket.
`17_produktfunktioner.md` och `31_vad_far_folk_att_valja_oss.md` bär
bevakningen och områdesbevakningen. `research/R3_seo_dimensionering.md` bär
trafikmodellen och FSA:s egen trafikdata, och den räknas inte om här.
**Metod:** varje tal om vårt eget bestånd är räknat 2026-09-05 mot
`site/src/data/*.json`, mot `site/dist` och mot produktionsdatabasen i
Supabase. Varje externt tal har källa och datum bredvid sig. Det som inte gick
att belägga står i §12 i stället för att gissas.
**Utfall:** sökkanalen är omogen och inte trasig, det saknas ingen funktion som
skulle göra Prikko till en tjänst man öppnar varje vecka, och den kanal som
fungerat i Sverige för en datatjänst utan distribution är press. Ordningen
avgörs av tre tal och står i §13.

---

## 1. Slutsatsen först

Nio slutsatser, i fallande ordning av vad de betyder.

1. **Sökkanalen är inte trasig, den är 33 dagar gammal.** `prikko.se` skapades
   2026-08-03 enligt Internetstiftelsens whois, avläst 2026-09-05.
   `49_indexeringen.md` §1.5 skriver "ungefär två månader" och det är fel med
   en faktor två. Ahrefs analys av 1,3 miljoner sökord, data insamlad hösten
   2023, ger att **1,74 procent av nypublicerade sidor når topp tio inom ett
   år** och att **72,9 procent av sidorna i topp tio är äldre än tre år**. Att
   omkring en sida av tio är inne efter 33 dagar är alltså ungefär vad en ny
   domän gör. **Följden är att planen ska handla om vad vi gör medan vi
   väntar, inte om att forcera sökningen.** §8.
2. **Ingen fristående privat sajt på hygiendata har fått publik, i något av
   fyra länder.** Frankrikes Alim'confiance fick 800 000 anslutningar på ett år
   av en statlig lansering och förföll sedan. Yelps öppna standard dog och
   ersattes av en kommersiell mellanhand som levererar omkring 450 av 470
   flöden. De två vägar som faktiskt fungerat är att bli datarör in i någon
   annans plattform, eller att täcka varje verksamhet i landet och leva på
   söktrafik på namn. **Båda kräver täckning först, ingen av dem kräver en
   funktion vi saknar.** §6.
3. **Press är den kanal som fungerat i Sverige för en datatjänst utan
   distribution, och den fungerar på dagar.** Ratsit fick **600 000 till
   800 000 besök per dygn** på en enda presslansering 2006 och lämnade ut 14
   miljoner rapporter på fyra månader. Booli växte i stället långsamt på ett
   datamonopol och en pressmaskin, och **köpte sin första annons efter tretton
   år**. Ingen av dem växte på organisk sök i början. §7.
4. **Frågan "varför skulle någon komma tillbaka" har ett svar, och svaret är
   att det inte finns någon återkommande anledning.** Beståndet ger 0,189 nya
   kontroller med anmärkning per verksamhet och år, alltså säger en bevakning
   ifrån **en gång vart femte år**. Av 24 bevakningar har exakt en fått en ny
   kontroll sedan den lades. Behovet är dessutom episodiskt: man slår upp ett
   matställe när man ska äta där. **Ingen funktion saknas som skulle ändra
   det. Återkommande besök är fel mått, och all tillväxt måste komma ur nya
   besökare.** §4.
5. **Med ett undantag, och det är byggt och osynligt.** Ett enda flöde i vår
   data rör sig i en takt en människa kan läsa: **112 verksamheter tillkom och
   sju försvann på 28 dagar**, varav 61 i Stockholm. Sidtypen
   `/[kommun]/nytt-och-borta/` finns, efterfrågan är belagd, `nya restauranger
   [stad]` kompletteras 6 av 6 städer, och sidan **länkas från 4 av 16 767
   sidor**. Samma material är dessutom det enda vi kan skicka till press varje
   månad utan att peka ut någon. §4.4 och §10.
6. **Täckningen är 19,8 procent av befolkningen, inte 4,5 procent av
   kommunerna.** Våra 13 myndigheter bär 2 095 189 invånare av 10 605 520, och
   inuti dem har vi 91,7 procent av registrets anläggningar. Räknat i
   anläggningar är täckningen 20,2 procent, och de tjugo färdigskrivna breven
   tar det talet till 47,3 procent. §3.2.
7. **Fönsterdekalen är inte en tillväxtkanal för oss.** Den kanal som bar
   beteendeeffekten i Los Angeles, New York och Wales är en obligatorisk dekal
   utfärdad av myndigheten. Sverige har ingen, och i det mognaste systemet är
   en privat part uttryckligen förbjuden att dela ut dem. §6.2.
8. **Delningen var trasig och lagas nu, men den är inte förklaringen.**
   16 742 av 16 767 byggda sidor bar samma förhandsvisningsbild, mätt
   2026-09-05, och åtgärden är under arbete i ett parallellt spår. Men
   `hitta.se` och `ratings.food.gov.uk` saknar bilden helt på sina
   objektsidor och har ändå publik. §5.
9. **Två saker på ägarens lista blockerar mer än allt vi kan bygga.**
   `prikko.pages.dev` svarade 200 med `Allow: /` när det mättes 2026-09-05,
   alltså erbjuds Google dubbelt så många adresser som sajten har, och de tjugo
   breven ligger oskickade. Och vi säljer ingenting på ett halvår,
   `54_affarsmodellen.md` §9.5, vilket den här planen inte ändrar.

**Ordningen står i §13. Tre av de fem första stegen kräver ingenting av
ägaren, och de två som gör det kräver tillsammans ungefär en timme och tio
minuter.**

---

## 2. Metoden, och vad den är värd

**Vårt eget bestånd.** Alla tal om kontroller, verksamheter och takt är
räknade med Python direkt mot de tretton filerna i `site/src/data/`, byggets
datum 2026-09-05. Alla tal om sidor och märkning är räknade mot `site/dist`,
alltså den byggda sajten och inte källkoden. **Det bygget är daterat
2026-08-28**, alltså åtta dagar äldre än mätningen, och det ska läsas som en
reservation på varje sidtal: sajten kan ha vuxit sedan dess, men inget i
mönstren nedan hänger på de åtta dagarna. Alla tal om konton, bevakningar
och omdömen är körda som SQL mot produktionsdatabasen samma dag.

**Externa tal.** Varje tal utanför vårt eget material bär källa och datum i
texten. Där ett tal redan är mätt i ett tidigare dokument citeras det med
hänvisning i stället för att mätas om, och det gäller särskilt
`research/R3_seo_dimensionering.md`, `44_marknaden_2026.md` och
`49_indexeringen.md`.

**Vad metoden inte klarar.**

- **Semrush går fortfarande inte att använda.** Kontot har prenumeration men
  slut på API-enheter, samma svar 2026-09-05 som i R3 2026-08-02 och i
  `26_seo_bortom_hygienordet.md` 2026-08-12. Det betyder att vi inte kan mäta
  vår egen länkprofil, inte kan mäta förlagornas trafik med förstahandsdata,
  och inte kan verifiera volymtalen bakom kanalordningen i §8. Fler API-enheter
  krävs, och de kan beställas på `semrush.com/mcp-access`.
- **Vi har ingen egen trafikmätning.** Det finns ingen webbanalys på sajten
  och inget tal på hur många som besöker den. Allt som sägs om vår trafik i
  det här dokumentet är härlett ur indexering och konton, inte avläst.
  Search Console är den enda källan som finns, och den är inte läst än.
- **En sökning på det exakta domännamnet gav noll träffar som gäller oss**,
  gjord 2026-09-05 i en amerikansk sökmotor. Det stödjer att inga inlänkar
  finns, men det är ett svagt belägg: sökningen är inte svensk och
  varumärkesnamnet krockar med en strömmare och en koreansk app.

---

## 3. Läget, räknat i dag

### 3.1 Sajten

| Mått | Värde | Räknat |
|---|---:|---|
| Verksamheter | 17 146 | `site/src/data/*.json`, 2026-09-05 |
| Kommuner | 13 av 290 | samma |
| Kontroller i beståndet | 73 686 | samma |
| HTML-sidor i bygget | 16 767 | `site/dist`, byggt 2026-08-28, räknat 2026-09-05 |
| Filer i bygget | 17 011 av 20 000 | samma |
| Indexerade sidor | omkring 1 400 av 14 260 | `49_indexeringen.md`, 2026-08-31 |
| Domänens ålder | **33 dagar** | whois `prikko.se`, skapad 2026-08-03 |

**Filtaket är inte uppgraderat och ska inte räknas med.** Ägaren har sagt att
Cloudflare får klaga först. Vi ligger på 17 011 filer av 20 000, alltså 2 989
filer kvar. Varje förslag i det här dokumentet är därför prövat mot om det
kostar filer, och inget av dem gör det i någon storlek som märks.

### 3.2 Täckningen är fem gånger större än kommunräkningen låter

`45_entreprenorslistan.md` §1 skriver "en färdig produkt på fyra procent av
marknaden", räknat som kommuner. Det är rätt tal om fel nämnare.

Räknat mot `pipeline/data/kommunregister.csv` 2026-09-05:

| Mått | Vi | Riket | Andel |
|---|---:|---:|---:|
| Kontrollmyndigheter | 13 | 250 | 5,2 % |
| Invånare | 2 095 189 | 10 605 520 | **19,8 %** |
| Anläggningar | 18 701 | 92 746 | **20,2 %** |

**Var femte svensk bor i en kommun vi täcker.** Och inuti de kommunerna är
beståndet i stort sett komplett: vi har 17 146 rader mot registrets 18 701,
alltså **91,7 procent**, med Uppsala på 98,7 och Stockholm på 90,6. Talet över
hundra i Borgholm och Höganäs beror på att vi bär rader registret inte räknar,
till exempel underobjekt.

Det betyder att produkten fungerar när någon behöver den, inom sitt område:
slår man upp ett ställe i en av våra tretton kommuner finns det där nio gånger
av tio. Bristen är inte djupet, den är att bara var femte svensk kan ha nytta
av oss över huvud taget.

### 3.3 Kontona

Kört som SQL mot produktionsdatabasen 2026-09-05.

| Mått | Värde |
|---|---:|
| Konton i `auth.users` | 10, varav 2 är testkonton |
| Konton som loggat in en annan dag än de skapades | 6 |
| Konton inloggade senaste sju dagarna | 2 |
| Bevakningar | 24, från 5 personer, på 23 verksamheter |
| Omdömen | 20, från 5 personer |
| Bilder | 11 |
| Anspråk på en verksamhetsyta | 3 |
| Notiser skrivna på ett konto | **1**, den 2026-09-05 |
| Notismejl någonsin skickade | **0** |

Första bevakningen lades 2026-08-04, den senaste 2026-08-31. Ägaren står för
17 av 24 bevakningar och 14 av 20 omdömen, och ingen utomstående har gjort
något sedan 25 augusti.

---

## 4. Frågan som avgör planens form: finns en återkommande anledning?

Det här är beställningens viktigaste fråga, och svaret är obekvämt.

### 4.1 En bevakning kan matematiskt inte bli motorn

Räknat mot hela beståndet 2026-09-05, med ett rullande år bakåt från i dag:

| Mått | Värde |
|---|---:|
| Kontroller senaste 365 dagarna | 11 638 |
| varav med anmärkning | 3 248, alltså 27,9 % |
| Kontroller per verksamhet och år | **0,679** |
| Kontroller med anmärkning per verksamhet och år | **0,189** |
| Mediantid mellan två kontroller på samma ställe | 223 dagar |

En bevakning säger i dag bara ifrån vid en **ny kontroll med anmärkning**,
`pipeline/notify.py` och `17_produktfunktioner.md`. Med 0,189 sådana per
verksamhet och år betyder det att ett bevakat ställe hör av sig i snitt
**en gång vart femte år**, och att halva väntetiden är passerad först efter
3,7 år.

Med dagens 24 bevakningar väntas alltså **4,5 notiser om året för samtliga
användare tillsammans**, alltså en var åttionde dag.

**Och utfallet stämmer med räkningen.** Av de 24 bevakningarna har exakt **en**
fått en ny kontroll sedan den lades, och den hade anmärkning. Den blev också
den första notis som någonsin skrivits, 2026-09-05. Bevakningarna har legat
mellan 5 och 32 dagar, och den väntade skörden på den tiden är ungefär en.

**Slutsatsen är alltså inte att bevakningen är trasig.** Den fungerar precis
som den ska. Den saknade mejlnyckeln har kostat noll utskick, eftersom det inte
fanns något att skicka. Bevakningen är rätt byggd på en händelse som är för
sällsynt för att bära ett besöksmönster, och ingen kodändring rättar det.

### 4.2 Områdesbevakningen är redan prövad och avförd

`17_produktfunktioner.md`, sista avsnittet, mätte den 2026-09-01 mot Stockholms
87 områdespolygoner: medianområdet får fem nya anmärkningar på ett år, fjorton
av 87 får noll, medan Norrmalm får 190 och Södermalm 175. Antingen tystnad i
ett år, eller en månatlig lista med namngivna kök som misslyckats, alltså den
värstinglista som är förbjuden. Det finns ingen tredje formulering.

**Frågan ska inte tas upp igen**, och den står här bara för att nästa läsare
inte ska härleda om den.

### 4.3 Behovet är episodiskt, och det är inte vårt fel

Frågan "varför skulle någon komma tillbaka" har ett svar som ligger utanför
produkten. Man slår upp ett matställe när man ska äta där, inte annars.
Visita, `Restaurangvanor 2025`, uppger att knappt hälften av svenskarna äter
middag ute minst en gång i månaden och drygt var åttonde minst en gång i
veckan. **Andrahandsuppgift**, se §12: primärkällans PDF svarade 404 vid
hämtning 2026-09-05.

Ett behov som infaller några gånger i månaden och en datamängd som ändrar sig
en gång vartannat år per rad går inte att synkronisera. Ingen funktion löser
det.

**Därför är svaret på beställningens fråga: nej, det saknas ingen funktion som
skulle göra Prikko till en tjänst man öppnar varje vecka. Prikko är en tjänst
man använder när man behöver den.** Återkommande besök är fel mått på det här
stadiet, och den slutsatsen ska stå kvar även när den är trist, eftersom den
avgör vad allt annat mäts mot: **all tillväxt måste komma ur nya besökare.**

### 4.4 Men en sak i vår data rör sig varje månad, och den är osynlig

Det finns exakt ett flöde i beståndet som ändrar sig i en takt en människa kan
läsa, och som varken är en skamlista eller en rangordning.

Räknat ur `site/src/data/rorelse/*.json` 2026-09-05, ett fönster på 28 dagar
från 2026-08-08:

| Kommun | Tillkommit | Försvunnit |
|---|---:|---:|
| Stockholm | 54 | 7 |
| Jönköping | 25 | 0 |
| Uppsala | 13 | 0 |
| Höganäs | 7 | 0 |
| Linköping | 7 | 0 |
| Karlstad | 5 | 0 |
| Svenljunga | 1 | 0 |
| **Summa, 13 kommuner** | **112** | **7** |

Alltså **119 händelser på 28 dagar**, varav 61 i Stockholm. Det är ungefär två
om dagen i Stockholm och drygt tjugo i månaden i Jönköping. De sex kommuner som
saknas i tabellen hade noll händelser i fönstret.

**Tabellen är ingen jämförelse mellan kommuner.** Talen följer kommunens
storlek och kommunens utlämningstakt, ingenting annat, och de säger ingenting
om hur kommunen sköter sin kontroll. Samma regel gäller när materialet lämnar
sajten, §10.2.

Tre saker gör det till det bästa svaret vi har på återkomstfrågan.

1. **Efterfrågan är belagd.** `31_vad_far_folk_att_valja_oss.md` §5.4 mätte att
   `nya restauranger [stad]` kompletteras **6 av 6** prövade städer, medan
   `nyöppnade restauranger [stad]` ger noll av tre. Svansen bär `city`,
   `slussen`, `östermalm`, `södermalm` och `högst betyg`.
2. **Blockeraren är borta.** Samma avsnitt avförde spåret med motiveringen att
   `site/src/data/rorelse/` inte fanns. Katalogen finns nu, med tretton filer
   och en logg som började 2026-08-08.
3. **Det kostar inga nya sidor.** Sidtypen `/[kommun]/nytt-och-borta/` är redan
   byggd, `site/src/pages/[kommun]/nytt-och-borta/index.astro`, med tröskeln
   `MIN_MOVEMENT_PAGE = 12`. Stockholm, Jönköping och Uppsala ligger över den i
   dag, och de övriga fyller på av sig själva.

**Och här är felet.** I bygget från 2026-08-28 finns sidan för **en** kommun,
Stockholm, och den länkas från **4 av 16 767 sidor**. Med dagens data ligger
tre kommuner över tröskeln. Den enda återkommande anledningen vi
har att öppna Prikko är alltså byggd, korrekt, försiktigt formulerad, och i
praktiken omöjlig att hitta.

**Regeln som måste hålla när den lyfts fram:** modulen säger "tillkommit" och
"försvunnit", aldrig "nyöppnat" och "stängt", och det står i huvudet på
`site/src/lib/rorelse.ts`. Ett register som läggs om skulle annars se ut att
öppna trehundra restauranger på en dag. Ordet får inte bytas för att ett
autocompletefynd säger `nya`.

---

## 5. Frågan om delning: vad är värt att skicka till en kompis?

### 5.1 Knappen finns, förhandsvisningen finns inte

Delning är byggd. `site/src/components/Handlingsrad.astro` rad 526 använder
`navigator.share` där webbläsaren har det, och `JamforRuta.astro` rad 742 ger
"Kopiera länk". Det saknas alltså ingen knapp.

Det som saknas är vad mottagaren ser. Räknat 2026-09-05 i bygget från
2026-08-28:

| Mått | Värde |
|---|---:|
| HTML-sidor totalt | 16 767 |
| Sidor med `og:image` satt till `og-default.png` | **16 742** |
| Sidor med en egen bild | 25, samtliga artiklar |

Titel och beskrivning är unika per sida och de är bra: `Hygienkontroll på
Tonari Ramen, Stockholm` respektive en mening som säger vad kontrollen visade.
**Bilden är samma på 99,85 procent av sajten.** En länk till ett enskilt
matställe och en länk till startsidan ser likadana ut när någon klistrar in dem
i en chatt.

**Åtgärden är under arbete i ett parallellt spår och räknas som gjord i §13.**
Villkoret som måste hålla: den får inte kosta filer i någon storlek som märks.
En bild per verksamhet vore 16 044 nya filer på ett bygge som ligger på 17 011
av 20 000, alltså omöjligt utan filtaket. En bild per kommun och bedömning är
52 filer och gör hela jobbet.

### 5.2 Men förlagorna har det inte heller, och det ska sägas rakt ut

Mätt själv 2026-09-05, rå HTML hämtad som vanlig webbläsare:

| Sajt | `og:image` på en objektsida |
|---|---|
| `hitta.se`, företagssida | **saknas helt** |
| `ratings.food.gov.uk`, verksamhetssida | **saknas helt** |
| Prikko, verksamhetssida | finns, men samma på alla |

Slutsatsen är obekväm och nödvändig: **den saknade delningsbilden är inte
förklaringen till att ingen kommer.** Den är billig, den gör sajten bättre, och
den ska göras. Men ingen av förlagorna har löst det, och de har ändå publik.
Att sätta den först vore att laga det som syns i stället för det som väger.

### 5.3 Vad som faktiskt är delbart hos oss

Delning kräver att det finns något att säga med länken. Vår starkaste
kandidat är inte en funktion utan ett faktum: **vi har stället.** 91,7 procent
av registrets anläggningar i våra tretton kommuner finns hos oss, §3.2, och
verksamhetssidan svarar på en fråga som annars kräver att man ringer
miljöförvaltningen.

Det som saknas för att någon ska vilja skicka den är alltså inte grafik. Det
är att mottagaren ska bo i en av tretton kommuner. **Delbarheten är en
funktion av täckningen**, och det är samma flaskhals som allt annat i det här
dokumentet mynnar ut i.

---

## 6. Hur jämförbara tjänster på samma sorts data faktiskt fick sina användare

Allt i avsnittet är hämtat 2026-09-05 om inget annat står.

### 6.1 Ingen fristående privat sajt på hygiendata har fått publik

Det är genomgångens tyngsta fynd, och det gäller fyra länder.

**Frankrike, Alim'confiance.** Lanserad 3 april 2017. Efter ett år uppger
ministeriet **över 800 000 anslutningar** till sajten, **omkring 230 000
nedladdningar** av appen och **över 40 000 publicerade kontrollresultat**,
[agriculture.gouv.fr](https://agriculture.gouv.fr/securite-sanitaire-alimconfiance-fete-ses-un),
2018-04-03. Volymen kom av en statlig lansering med presstäckning, inte av att
datan var öppen. Sedan förfall: under 2025 har kartan inte gått att nå och
apparna inte gått att ladda ner, med klagomål på regeringens egen portal,
[plus.transformation.gouv.fr](https://www.plus.transformation.gouv.fr/experiences/4949002_site-web-et-application-mobile-alim-confiance-indisponible).
Datasetet på data.gouv.fr har **19 återanvändningar**, och den mest synliga
privata, iOS-appen "Alim Contrôle" från 2025-07-01, har **3 000 visningar** på
sin sida, [data.gouv.fr](https://www.data.gouv.fr/reuses/alim-controle).

**USA, Yelp LIVES.** Standarden som skulle låta kommunerna publicera själva
lanserades i januari 2013 med San Francisco och New York. Specifikationen står
kvar på version 2.0 från 2015-08-10, [yelp.com/healthscores](https://www.yelp.com/healthscores).
Yelps feedlista bär i dag omkring **470 jurisdiktioner, varav ungefär 450
levereras av Hazel Analytics**, numera Ecolab, och bara ett tiotal av
kommunerna själva, [yelp.com/healthscores/feeds](https://www.yelp.com/healthscores/feeds).
Det bekräftar `44_marknaden_2026.md` §6.5 och skärper den: den öppna
standarden var inte kanalen, kanalen var att datan hamnade där folk redan var,
och den logistiken sköttes till slut av en kommersiell mellanhand.

**Storbritannien.** Den enda privata sajt som ser ut att ha reell publik är
`scoresonthedoors.org.uk`, som täcker samtliga **616 330** brittiska
verksamheter och uppdateras dagligen. `research/R3_seo_dimensionering.md` §4
mätte att varumärket har omkring **18 procent av huvudtermens sökvolym** i
Google Trends UK, med noll nollveckor på fem år. **Trafiktal är fortfarande
obelagda**, se §12.

### 6.2 Det som bar effekten var dekalen, och den finns inte i Sverige

**Los Angeles.** Obligatoriska bokstavskort i fönstret från januari 1998. Före
korten hade hygienpoängen ingen mätbar effekt på intäkterna. Efter dem gav ett
A **5,7 procent högre intäkter**, ett B 0,7 procent och ett C 1 procent lägre.
Jin och Leslie, sammanfattat av författarna själva i
[Choices Magazine 2005](https://www.choicesmagazine.org/2005-2/safety/2005-2-02.pdf),
originalet i Quarterly Journal of Economics 118(2), 2003.

Samma studie rapporterade **20 procent färre sjukhusinläggningar** för matburen
sjukdom. **Den delen är omtvistad:** Ho, Ashwood och Handan-Nader replikerade i
American Economic Journal: Economic Policy 2019 och fann att talet inte håller
med bättre data, bland annat för att placebotester ger samma effekt i counties
som aldrig införde betyg, [aeaweb.org](https://www.aeaweb.org/articles?id=10.1257/pol.20180230).
**Intäktseffekten är den robusta delen. Hälsoeffekten ska inte citeras.**

**New York.** Bokstavsbetyg i fönstret sedan juli 2010. **88 procent** av
tillfrågade konsumenter 2012 uppgav att de vägde in betyget vid val av
restaurang, och salmonellafallen låg **5,3 procent** lägre per år än i resten
av delstaten, CDC Emerging Infectious Diseases 24(12), december 2018,
[wwwnc.cdc.gov](https://wwwnc.cdc.gov/eid/article/24/12/18-0544_article).

**Toronto DineSafe** är motexemplet. En utvärdering i BCIT Environmental Health
Journal, mars 2015, jämförde överträdelser 2004 till 2006 mot 2012 till 2014
för verksamheter med gult besked och fann **ingen signifikant minskning**,
medel 3,83 mot 3,71 med p = 0,85, medan andelen som fick gult två gånger steg
från 59 till 68 procent,
[journals.bcit.ca](https://journals.bcit.ca/index.php/ehj/article/download/117/103/108).
Slutsatsen där är att skyltens innebörd måste vara begriplig, inte bara
finnas.

**Wales**, tio år efter att uppvisning blev lag 2013: **71 procent** av
verksamheterna har högsta betyg och 96 procent ligger på tre eller högre,
[gov.wales](https://www.gov.wales/record-number-food-businesses-achieving-top-hygiene-ratings-across-wales-mandatory-display-turns-10).

**Vad det betyder för oss.** Den kanal som faktiskt bar beteendeförändringen i
LA, New York och Wales är en **obligatorisk dekal utfärdad av myndigheten**.
Den finns inte i Sverige, och vi kan inte skapa den. `44_marknaden_2026.md`
§3.6 slår dessutom fast att en privat part i det mognaste systemet uttryckligen
är förbjuden att dela ut dekaler. **Fönsterdekalen, punkt B3 i
`45_entreprenorslistan.md`, är alltså inte en tillväxtkanal för oss.** Den kan
vara en förtroendegest mot en enskild verksamhet, men den bär ingen räckvidd.

### 6.3 Det som bar räckvidden var inbäddning där publiken redan fanns

Och effekten av det är mätt. Dai och Luca, "Digitizing Disclosure", American
Economic Journal: Microeconomics 12(2), maj 2020, sidorna 41 till 59: att visa
hygienpoäng på Yelp gav **13 procent lägre köpintention** för restauranger med
låga poäng, och en tydligare varning ökade responsen ytterligare,
[aeaweb.org](https://www.aeaweb.org/articles?id=10.1257%2Fmic.20180293).

Yelp expanderade 2018 via Hazel till hälsomyndigheter i **48 delstater** plus
Toronto och Vancouver,
[engadget.com](https://www.engadget.com/yelp-widens-its-push-to-list-health-inspection-grades-for-restaurants-110024684.html).

**Sverige har ingen sådan plattform att bäddas in i.** `44_marknaden_2026.md`
§6.3 mätte att Foodora och Wolt inte visar något hygienmått, och att orsaken är
strukturell: det finns inget nationellt jämförbart mått att visa. Kanalen
existerar alltså inte i dag, och den kan bara existera efter täckning.

### 6.4 Sammanfattat: två vägar, och vi är på den ena

| Väg | Vad den kräver | Vem som gått den |
|---|---|---|
| Bli datarör in i någon annans plattform | ett nationellt mått, alltså täckning | Hazel Analytics, cirka 450 av Yelps 470 flöden, uppköpt av Ecolab |
| Täck varje verksamhet i landet och lev på söktrafik på verksamhetsnamn | täckning plus tid | Scores on the Doors, 616 330 objekt |
| Vara en fristående sajt med bra data i ett litet område | ingenting | **ingen, och det är fyndet** |

Båda de vägar som fungerat kräver **täckning** före allt annat. Ingen av dem
kräver en funktion vi saknar.

---

## 7. Hur svenska datatjänster fick sina första användare

Hämtat 2026-09-05. Frågan var vilken kanal som bar tillväxten, hur lång tid det
tog och vad det kostade.

### 7.1 Ratsit: en presslavin dag ett

Lanserad 2006-11-23. **I stort sett all svensk massmedia rapporterade om
tjänsten samma dag.** Utfallet de första dagarna var **600 000 till 800 000
besök per dygn**, servrarna gick i knä, och **14 miljoner personrapporter
lämnades ut på fyra månader**. Efter anstormningen låg de på 300 000 till
400 000 unika besök i veckan. Computer Sweden,
[Ratsit-vd räds inte hetluften](https://computersweden.se/article/1280447/ratsit-vd-rads-inte-hetluften.html),
publicerad 2009-01-22.

**Tid från start till relevant trafik: noll år.** Kanalen var press, inte sök.

Och en rättelse till en vanlig föreställning som stod i beställningen till det
här dokumentet: **notismekaniken byggde inte trafiken, den sänkte den.** Från
2007-06-11 skickas en kopia till den som blivit omfrågad. Efter den
regeländringen föll besöken till 150 000 i veckan och omsättningen från en
miljon kronor i månaden till 150 000. Samma källa, och samma sak beskrivs av
[Internetmuseum](https://www.internetmuseum.se/tidslinjen/offentlighetsprincipen-moter-internet-med-ratsit-och-lexbase/)
som ett medel mot slentriansökningar.

### 7.2 Hemnet: distributionen var startvillkoret, inte en kanal

**1 400 mäklare var med redan vid starten 1998**, och ägarna var
mäklarorganisationerna själva,
[sv.wikipedia.org/wiki/Hemnet](https://sv.wikipedia.org/wiki/Hemnet). Utbudet
fanns ingen annanstans från dag ett. I dag över 40 miljoner besök i månaden och
9 av 10 sålda bostäder annonserade hos dem,
[hemnetgroup.se](https://www.hemnetgroup.se/om-hemnet/).

**Hemnet är inte en förlaga för oss.** Deras distribution var given innan
sajten fanns. Vi har ingen bransch som äger oss och ingen som är skyldig att
lämna sitt material till oss.

### 7.3 Booli: ett datamonopol plus en pressmaskin, och tretton år utan en enda annons

Det här är den enda av de tre som liknar vår situation, och kurvan är obekväm
men ärlig.

| Datum | Läge | Källa |
|---|---|---|
| 2007 | grundas | |
| maj 2012 | drygt **140 000 unika besökare i veckan** | [Mynewsdesk](https://www.mynewsdesk.com/se/booli.se/pressreleases/haer-saaldes-sveriges-dyraste-villor-2011-761119) |
| 2013-03-20 | över **210 000 unika i veckan**, **14 medarbetare** | [Mynewsdesk](https://www.mynewsdesk.com/se/booli.se/news/booli-vaexer-i-trafik-och-i-antalet-medarbetare-56044) |
| 2014 | SBAB köper bolaget | |
| 2020-10-09 | **"Booli i sin första kampanj någonsin"**, omkring 500 000 unika i veckan | [Mynewsdesk](https://www.mynewsdesk.com/se/booli.se/pressreleases/booli-i-sin-foersta-kampanj-naagonsin-3040996) |

**Fem år till 140 000 unika i veckan. Tretton år innan de köpte en enda
annons.** Det som bar dem fram dit var två saker: att de var först i Sverige
med öppna slutpriser, alltså ett datamonopol, och en tung ström av
pressmeddelanden med statistik som medierna citerade.

**Att organisk sök var motorn är obelagt.** Det som är belagt är negationen:
ingen betald marknadsföring alls under tretton år.

### 7.4 Mönstret, och vad det betyder för oss

**Ingen av de tre växte på organisk sök på nakna entitetsnamn i början.** Två
av tre hade distributionen ordnad innan sajten fanns. Den tredje växte
långsamt på data ingen annan hade, buren av press.

Vi har inte distributionen. Vi har data ingen annan har. **Alltså är Boolis
väg den enda av de tre som är öppen för oss, och Ratsit visar vad den
snabbaste versionen av den kan ge.**

Ingen av källorna innehåller något tal på hur lång tid det tog innan sajten
syntes i Google. Det talet finns inte i pressmaterial eller årsredovisningar
för någon av tjänsterna, och det ska inte gissas fram. Se §12.

---

## 8. Sökkanalen är inte trasig, den är 33 dagar gammal

Det här avsnittet ändrar planens form, och det står separat av det skälet.

`49_indexeringen.md`, `51_klickdjupet.md` och `53_egen_text_per_sida.md` har
tillsammans letat efter defekten som förklarar att bara en sida av tio är
indexerad. Klickdjupet frikändes, sidindelningen frikändes, navigationen
frikändes, och kvar stod innehållet och åldern. **Åldern har hela tiden räknats
fel.**

`prikko.se` skapades 2026-08-03 enligt Internetstiftelsens whois, avläst
2026-09-05, och första commiten i repot är 2026-08-02. **Domänen är 33 dagar
gammal**, inte de två månader `49` §1.5 skriver.

Ställ det mot vad som är känt om hur lång tid nya sidor tar. Ahrefs analys av
1,3 miljoner slumpade sökord i USA, data insamlad i september och oktober 2023,
[ahrefs.com](https://ahrefs.com/blog/how-long-does-it-take-to-rank-in-google-and-how-old-are-top-ranking-pages/):

| Mått | Värde |
|---|---:|
| Nypublicerade sidor som når topp tio inom ett år | **1,74 %** |
| Sidor i topp tio som är äldre än tre år | **72,9 %** |
| Genomsnittsåldern på sidan som ligger etta | **5 år** |
| Av de sidor som ändå tar sig in, andel som gör det inom en månad | 40,8 % |

**Att omkring tio procent av 14 260 sidor är i Google efter 33 dagar är alltså
inte ett haveri. Det är ungefär vad en ny domän gör.**

Tre följder, och de är hela skälet till att planen ser ut som den gör.

1. **Det finns inget att forcera.** Varje timme som läggs på att göra sidorna
   marginellt bättre för Google betalar sig tidigast om ett år. `53` byggde
   redan den billiga delen och flyttade andelen eget innehåll från 14,7 till
   16,5 procent, och skrev själv i §1.8 att det inte är belagt som orsaken.
2. **Planen ska handla om vad vi gör medan vi väntar.** Det är en annan plan
   än att laga sökkanalen, och den ska mätas på andra tal.
3. **Det som ska göras i sökkanalen nu är att sluta slösa och att börja
   mäta.** Två saker: släck den dubbla sajten, och läs Search Console.
   Ingenting annat.

---

## 9. Kanalerna, rangordnade

### 9.1 En ärlig varning om måttet

Beställningen bad om besökare per nedlagd timme. **Det talet går inte att
räkna, och det ska inte hittas på.** Vi har ingen webbanalys, `docs/14` slår
fast att det är ett medvetet val och att den dagen den införs måste `/cookies`
och `/integritetspolicy` skrivas om. Search Console är den enda mätning som
finns, den är gratis, den rör inte besökarens webbläsare, och den ser bara
Google.

Rangordningen nedan är därför ordinal, och varje rad bär skälet och det
tidigaste datum den kan visa något.

### 9.2 Rangordningen

| # | Kanal | Vad den kan ge | När det syns | Beror på domänens ålder | Belägg |
|---|---|---|---|---|---|
| 1 | **Press på egen återkommande statistik** | Ratsit fick 600 000 till 800 000 besök per dygn på en lansering. Boolis pressmaskin bar dem i tretton år utan annonser | **dagar** | nej | §7.1, §7.3 |
| 2 | **Täckningen**, alltså fler kommuner | Förutsättningen för båda de vägar som fungerat internationellt, §6.4. Breven tar täckningen från 20,2 till 47,3 procent av anläggningarna | veckor till månader | nej | §3.2, `docs/25` |
| 3 | **Sök på verksamhetsnamn** | Den enda kanal som skalar till hela beståndet. R3 §2 modellerar omkring 4 150 besök i månaden vid månad 12 | **12 till 36 månader** | **ja, helt** | R3 §2 och §5 |
| 4 | **Sök på `nya restauranger [stad]`** | Belagd efterfrågan 6 av 6 städer, sidan finns, konkurrensen är tunn | månader | ja, men mindre | `docs/31` §5.4, §4.4 |
| 5 | **Kommunernas egna länkar** | 13 mejl, 13 backlänkar från myndighetsdomäner. Den billigaste legitima länkkällan vi har | månader | nej | `docs/45` B12 |
| 6 | **Att bli citerad av AI-svar** | `44_marknaden_2026.md` §6.6 mätte att Bing citerar aggregatorn och inte myndigheten, och att positionen är **ledig på svenska**. `llms.txt`, `/api/v1/` och flödena svarar 200 i dag | okänt | delvis | `docs/44` §6.6, mätt live 2026-09-05 |
| 7 | **Inbäddningar och märken** | En inbäddning är en backlänk och en gratis annons. Men emblemet finns bara för tre kommuners vinnare och ingen har någonsin satt upp det | månader till år | nej | `docs/45` B2, räknat i `site/dist` |
| 8 | **Sociala kanaler** | Behovet är episodiskt, §4.3, och ett flöde passar illa för något man behöver några gånger i månaden. Att bygga publik från noll kostar många timmar per besökare | månader | nej | §4.3 |
| 9 | **Partnerskap med matleverans** | Kanalen finns inte i Sverige och kan bara finnas efter att någon äger ett nationellt mått | **år** | nej | `docs/44` §6.3 |
| 10 | **Fönsterdekalen** | **Noll.** Den kanal som bar effekten i Los Angeles, New York och Wales är en obligatorisk dekal utfärdad av myndigheten. Sverige har ingen, och i det mognaste systemet är en privat part uttryckligen förbjuden att dela ut dem | aldrig | nej | §6.2, `docs/44` §3.6 |

### 9.3 Det som avgör ordningen, i tre tal

1. **1,74 procent av nya sidor når topp tio inom ett år, och vår domän är 33
   dagar gammal.** Det diskvalificerar sökningen som svar på frågan "vad gör vi
   nu" och flyttar ned den till plats tre.
2. **Ratsit fick 600 000 till 800 000 besök per dygn på en enda presslansering,
   och Booli köpte sin första annons efter tretton år.** Det gör press till
   plats ett, och det är belagt i svensk kontext och inte lånat.
3. **Ingen fristående privat sajt på hygiendata har fått publik i något av
   fyra länder.** De två vägar som fungerat kräver båda täckning först. Det gör
   täckningen till plats två och till villkoret för nästan allt annat.

---

## 10. Pressmaskinen, och hur den byggs utan att bryta mot något

Press är plats ett i §9, och den är också den kanal som lättast bryter mot
projektets hårdaste regler. Därför har den ett eget avsnitt med formen skriven
i förväg.

### 10.1 Vad som skickas

**Boolis form, inte SVT:s.** Booli skickade återkommande statistik ur data
ingen annan hade, och medierna citerade den. De skickade inte anklagelser.

Vårt motsvarande material är **rörelsen**, §4.4, och den är den enda uppgift
vi har som är ny varje månad, lokal, och helt fri från omdöme:

> Mellan den 8 augusti och den 5 september tillkom 54 livsmedelsverksamheter
> i Stockholms register och sju försvann. Underlaget är kommunens egen
> utlämning, och Prikko läser den varje natt.

Det är en uppgift ingen annan i Sverige publicerar, den är sann, den nämner
ingen verksamhet vid namn, och den kommer igen nästa månad.

### 10.2 Fyra regler i formen, och de är villkor och inte önskemål

1. **Varje redaktion får bara sin egen kommuns tal.** Aldrig en tabell med
   flera kommuner bredvid varandra, aldrig en rangordning, aldrig ett
   "sämst i landet". Regeln följer av `docs/17` och `54_affarsmodellen.md`
   §9.4.6, och den blir enkel att hålla när utskicket byggs per kommun från
   början. `44_marknaden_2026.md` §3.8 förklarar varför: FHRS är ett enda mått
   framtaget efter en gemensam standard, våra kommuner bedömer olika, och en
   jämförelse mellan dem vore inte en jämförelse utan en osanning.
2. **Ingen verksamhet nämns vid namn i ett utskick.** Inte som exempel, inte
   som illustration, inte ens som ett gott exempel, eftersom nästa fråga från
   redaktionen då blir vilka de dåliga är.
3. **Orden är "tillkommit" och "försvunnit", aldrig "nyöppnat" och "stängt".**
   Skälet står i huvudet på `site/src/lib/rorelse.ts`: det som observeras är
   att ett anläggnings-id dök upp eller slutade lämnas ut. En redaktion som
   skriver "sju restauranger stängde" har fått fel av oss, och det är vårt fel
   och inte deras. Reservationen ska stå i utskicket, inte i en fotnot.
4. **Ingen text och ingen bild i utskicket får vara maskinskriven prosa.**
   Mallen fylls med kommunens egna tal, precis som `Kontrollserien.astro` i
   `53_egen_text_per_sida.md` §6, och den som skickar läser den först.

### 10.3 Varför det inte blir matsnuskgranskningen

`26_seo_bortom_hygienordet.md` §4.6 mätte att `matsnusk [stad]` ger noll
kompletteringar i fjorton städer och slog fast att `/[kommun]/matsnusk/` är en
PR-tillgång och inte en trafikkälla. Det står fast, men det är inte den
tillgången som ska skickas ut. **Skillnaden är att rörelsen kan skickas varje
månad utan att någon pekas ut, medan en granskning bara går att göra en gång
och bara genom att peka ut någon.** Boolis maskin gick i tretton år just för
att den var av den första sorten.

---

## 11. Vad som inte ska göras

Samlat, med skälet och mätningen bredvid, så att nästa läsare slipper härleda
om det.

1. **Bygg inte områdesbevakning.** Prövad och avförd med tal 2026-09-01,
   `17_produktfunktioner.md`. Medianområdet får fem anmärkningar på ett år,
   fjorton av 87 får noll, Norrmalm får 190. Antingen tystnad eller en
   förbjuden värstinglista.
2. **Bygg inte fönsterdekalen som tillväxtkanal.** §6.2. Den kanal som bar
   effekten utomlands är myndighetens monopol, och Sverige har inget märke.
3. **Bygg inga sociala kanaler nu.** §4.3. Behovet är episodiskt och publiken
   ska byggas från noll.
4. **Köp ingen annonsering.** Booli väntade tretton år, §7.3, och vi har
   dessutom bara nitton procent av befolkningen att skicka trafik om.
5. **Bygg inga nya sidtyper.** `49_indexeringen.md` §5 säger att inga fler
   sidor ska byggas förrän de vi har är inne, och bygget ligger på 17 011
   filer av 20 000 utan att filtaket är uppgraderat.
6. **Skriv inte om innehållet igen för indexeringens skull.**
   `53_egen_text_per_sida.md` §1.8 skrev själv att åtgärden inte är belagd som
   orsaken, och §8 här ger orsaken ett enklare namn: åldern.
7. **Sälj ingenting.** `54_affarsmodellen.md` §9.5, ingenting på ett halvår.
   Ingenting i den här planen ändrar det.
8. **Publicera aldrig en rangordning av kommuner, en lista på de sämsta eller
   en namngiven verksamhet som något att undvika**, i något sammanhang, och
   allra minst i press där det skulle ge mest räckvidd. §10.2.

---

## 12. Vad som inte gick att belägga

1. **Vår egen trafik.** Det finns ingen webbanalys på sajten, `docs/14`, och
   Search Console är inte läst. Allt som sägs om vår trafik i det här
   dokumentet är härlett, inte avläst. Det är också skälet till att §9 ger en
   ordinal rangordning och inte besökare per timme.
2. **Vår egen länkprofil.** Semrush har prenumeration men slut på API-enheter,
   samma svar 2026-09-05 som i R3 2026-08-02. Fler enheter går att beställa på
   `semrush.com/mcp-access`. Påståendet att vi saknar inlänkar utifrån vilar
   därför på att ingen någonsin länkat oss såvitt vi vet, inte på en mätning.
3. **Hur lång tid det tog innan förlagorna syntes i Google.** Talet finns inte
   i pressmaterial eller årsredovisningar för Booli, Hemnet eller Ratsit.
   Boolis trafikkurva i §7.3 är det närmaste ett svar går att komma, och den
   är en trafikkurva och inte en indexeringskurva.
4. **Scores on the Doors trafik.** Bara en värdering från en sökmotorskrapa
   som inte går att lita på. Varumärkets andel av sökvolymen i R3 §4 står kvar
   som det enda belägget.
5. **Booli-affärens belopp.** Rubriken hos Breakit säger omkring 100 miljoner
   kronor. Brödtexten gick inte att läsa, alltså är beloppet rubrikbelagt.
6. **Visitas restaurangvanor.** Talen om hur ofta svenskar äter ute är
   andrahandsuppgifter. Primärkällans PDF och pressmeddelande svarade 404
   respektive 403 vid hämtning 2026-09-05.
7. **Ratsits dagsaktuella tal.** Omkring 800 000 medlemmar och 150 000
   betalande kommer ur ett sökmotorutdrag av `ratsit.se/info/om-ratsit`, som
   svarade 403 vid direkthämtning. Talen från 2006 och 2009 är däremot lästa
   ur Computer Swedens artikel.
8. **Hälsoeffekten av hygienbetyg.** Jin och Leslies 20 procent färre
   sjukhusinläggningar är ifrågasatt av Ho med flera 2019, §6.2, och ska inte
   citeras. Intäktseffekten på 5,7 procent står.
9. **Om en delningsbild ökar klicken på en delad länk.** Ingen mätning
   söktes fram som belägger det. Åtgärden i §5.1 görs för att sajten ska se
   riktig ut, inte för att effekten är belagd.

---

## 13. Ordningen: de fem första sakerna

Tre av de fem kräver ingenting av ägaren. De två som gör det kräver
tillsammans ungefär en timme och tio minuter.

### 1. Tio minuter i två flikar: exportera Search Console och släck `prikko.pages.dev`

**Vad:** exportera sidrapporten ur Search Console, som redan är kopplat, och
släck `prikko.pages.dev` i Cloudflares kontrollpanel.

**Vad det väntas ge:** för första gången ett facit i stället för en
uppskattning. Hela indexeringsbilden vilar i dag på ett stickprov om 28 sidor
med ett Wilson-intervall mellan 200 och 4 700 sidor, `49` §4. Och skillnaden
mellan "Crawled, currently not indexed" och "Discovered, currently not
indexed" avgör om §8:s slutsats håller: det första betyder att vi ska vänta,
det andra att genomsökningen är begränsad och att den dubbla sajten kostar
riktigt. `prikko.pages.dev` svarade 200 med `Allow: /` när det mättes
2026-09-05, alltså erbjuds Google 28 520 adresser i stället för 14 260.

**Hur vi mäter om det funkade:** andelen indexerade sidor per sidtyp, och
fördelningen mellan de två statusarna. Genomsökningsstatistiken i Search
Console ska falla efter att den dubbla sajten släckts.

**Vad det kräver av ägaren:** en export och ett klick. Under tio minuter.

### 2. Rörelsen görs synlig

**Vad:** länka `/[kommun]/nytt-och-borta/` från kommunsidan, från startsidan
och från sidfoten. Sidtypen finns, tröskeln `MIN_MOVEMENT_PAGE = 12` är
passerad i Stockholm, Jönköping och Uppsala, och de övriga fyller på av sig
själva.

**Vad det väntas ge:** den enda återkommande anledningen vi har att öppna
Prikko blir möjlig att hitta. I dag länkas sidan från 4 av 16 767 sidor.
Efterfrågan är belagd: `nya restauranger [stad]` kompletteras 6 av 6 prövade
städer, `31_vad_far_folk_att_valja_oss.md` §5.4.

**Hur vi mäter om det funkade:** antalet interna länkar till sidtypen, och
efter 60 dagar visningar och klick på `/nytt-och-borta/` i Search Console.

**Vad det kräver av ägaren:** ingenting. Inga nya sidor, inga nya filer.

### 3. Pressmaskinen byggs klar och ligger redo

**Vad:** ett utskick per kommun, byggt på rörelsen, med de fyra reglerna i
§10.2 inbyggda i mallen och en mottagarlista över lokalredaktionerna i de
tretton kommunerna.

**Vad det väntas ge:** att den kanal som är plats ett i §9 går att använda när
ägaren har tio minuter, i stället för att kräva en dags arbete just då.
Belägget för att kanalen är rätt: Ratsit fick 600 000 till 800 000 besök per
dygn på en lansering, §7.1, och Boolis pressmaskin bar dem i tretton år utan
en enda annons, §7.3.

**Hur vi mäter om det funkade:** ingenting förrän steg 5. Det här steget mäts
bara på att materialet finns och att formen håller mot §10.2.

**Vad det kräver av ägaren:** ingenting.

### 4. Skicka de tjugo breven

**Vad:** de tjugo begäranden som ligger färdiga i `pipeline/data/begaran/`, en
per fil, i sändordning. Steg noll är att kontrollera att `mans@prikko.se` tar
emot post.

**Vad det väntas ge:** täckningen går från **20,2 till 47,3 procent av
rikets anläggningar**, alltså 25 117 anläggningar till i 27 kommuner,
`docs/25`. Det är det enskilt största talet i hela dokumentet,
och §6.4 visar att täckning är villkoret för båda de vägar som fungerat
internationellt. Det gör också rörelsen och pressmaskinen större varje månad,
eftersom fler kommuner betyder fler redaktioner.

**Hur vi mäter om det funkade:** antal kommuner som svarat inom 30 dagar, och
antal anläggningar inlästa inom 60.

**Vad det kräver av ägaren:** ungefär en timme, en gång.

### 5. Skicka det första pressutskicket

**Vad:** ett utskick till lokalredaktionerna i en kommun, inte tretton.
Stockholm eller Jönköping, eftersom de har flest händelser att berätta om.

**Vad det väntas ge:** det första besöket som inte kommer från oss själva. Det
är också det enda av de fem stegen som kan ge trafik inom dagar, eftersom det
är det enda som inte går genom en sökmotor som inte känner oss än.

**Hur vi mäter om det funkade:** antal publiceringar, antal hänvisande domäner,
och klick i Search Console på varumärkessökningen `prikko` under de sju dagar
som följer. Varumärkessök är det renaste måttet på om ett pressgenomslag nådde
någon, och det är det mått R3 §4 använde för Scores on the Doors.

**Vad det kräver av ägaren:** ett utskick. Han läser materialet och trycker
skicka.

---

## 14. Vad som byggdes, 2026-09-05

Steg 2 och steg 3 i §13 är utförda. Båda är de steg som inte kräver något av
ägaren, och ingenting av det som byggts skickar något.

### 14.1 Rörelsen är synlig: från 8 sidor till 17 881

**Talen är räknade i två riktiga byggen av samma data**, inte uppskattade. Ett
bygge på oförändrad kod och ett på den nya, båda 2026-09-05, båda med
`--outDir` i en worktree.

| Mått | Före | Efter |
|---|---:|---:|
| HTML-sidor i bygget | 17 893 | 17 893 |
| Filer i utgåvan | 18 171 | 18 171 |
| **Sidor som länkar `/nytt-och-borta/`** | **8** | **17 881** |

**Talet 4 av 16 767 i §1.5 och §4.4 var rätt när det mättes** mot bygget från
2026-08-28. I dag är utgångsläget 8 av 17 893: tre kommuner ligger över
`MIN_MOVEMENT_PAGE` i stället för en, och tre av de åtta länkarna var
rörelsesidorna själva. Talet i §4.4 står kvar som en mätning av det bygget och
räknas inte om.

De tolv sidor som inte länkar rörelsen efter ändringen är kartsidorna och
`/konto/notiser/`, alltså de sidor som inte bär sidfot.

**Tre ytor, och ingen ny sida.**

1. **Sidfoten**, `site/src/components/Footer.astro`. Raden "Nytt och borta i
   registren" i Prikkokolumnen, mellan Utmärkelser och Källor. Villkoret är
   riksvyns eget `hasNationalPage()`, så länken kan inte peka på en sida som
   inte byggts. **17 881 sidor.**
2. **Kommunsidan**, `site/src/components/KommunHub.astro`. En panel i
   sidospalten efter "Senast kontrollerade", med kommunens två tal och
   perioden, och länken under. Panelen ligger i spalten och inte sist i bandet
   "{stad} i siffror", vilket är skillnaden mellan att synas på sida 1 och att
   synas på hela den sidindelade serien: **117 sidor** i stället för 3, varav
   86 i Stockholm.
3. **Startsidan**, `site/src/pages/index.astro`. Ett block mellan korten och
   "Att läsa", med rikets två tal och en länk per kommun som har en sida.
   **1 sida.**

**Villkoret att en funktion aldrig får kosta en sida är hållet.** Inga nya
rutter, inga nya filer, samma 18 171 filer i utgåvan före och efter.
Byggrindarna passerade: inga döda interna länkar bland 17 892 byggda sidor.

**Hållningen i länktexterna är sidans egen.** Modulen säger "tillkommit" och
"försvunnit", aldrig "nyöppnat" och "stängt", och skälet står i huvudet på
`site/src/lib/rorelse.ts`. Startsidans block skriver dessutom ut reservationen
i klartext: uppgiften är att ett anläggnings-id dök upp eller slutade lämnas
ut, inte att någon öppnat eller stängt.

**Ingen av ytorna bär ett tal per kommun bredvid ett annat.** Startsidans
lista är namn utan tal, i bokstavsordning och aldrig i storleksordning, och
kommunens tal står på kommunens egen sida. Skälet är samma som huvudet på
`site/src/pages/nytt-och-borta/[...riket].astro` redan skriver ut: talen
speglar kommunens utlämningstakt minst lika mycket som vad som händer i
lokalerna, så en tabell över dem vore en rangordning av registerskötsel.

Verifierat i bild vid 1440 och 375 på alla tre ytorna, samt på sida 5 av
Stockholmsserien för att se att panelen följer med.

### 14.2 Pressmaskinen är byggd och oskickad

`pipeline/press.py`, byggd på mönstret i `pipeline/begaran.py`.

```
python3 pipeline/press.py status                       # vilka kommuner har material
python3 pipeline/press.py --epost <adress> granska     # formkontrollen, utan filer
python3 pipeline/press.py --epost <adress> utskick     # skriv filerna
```

**Skriptet kan inte skicka.** Det importerar inget nätverksbibliotek, det slår
inte upp någon adress, och det har ingen mottagarlista. Det skriver textfiler
till `pipeline/data/press/`, en per kommun, plus `00-las-mig.txt`. Katalogen är
gitignorerad av samma skäl som `begaran/`: filerna ska skrivas om mot färsk
data varje gång, och ett utskick med gamla tal hör inte hemma i historiken.
Till-raden är ofylld i varje fil, och `SENDER_EMAIL` är tom, så ett utskick
går inte ens att skriva färdigt utan att ägaren anger sin adress.

**Ett utskick i dag: tre kommuner.** Stockholm, Jönköping och Uppsala, alltså
exakt de som har en publicerad rörelsesida. Urvalet är inte en bedömning utan
en följd av regel fyra: utan sida finns ingen adress där redaktionen kan slå
upp talen.

**Vad ett utskick innehåller.** Rörelsen i perioden med reservationen i
brödtexten och inte i en fotnot, kontrollbilden i perioden räknat som de
verksamheter vars senaste kontroll ligger i fönstret och vad de kontrollerna
visade, kontrollbilden i hela registret som kommunsidan visar den, en lista
med tolv tal och en adress till vart och ett, ett avsnitt som säger vad
utskicket inte är, och vägarna vidare till rättelse och till API:et. För
Stockholm 2026-09-05: 54 tillkomna och sju försvunna, 411 verksamheter
kontrollerade i perioden varav 397 utan anmärkningar och 14 med, och 8 567
verksamheter i registret.

**Talen läses ur `site/src/data/`, alltså exakt de filer sajten byggs av.** Det
är hela grunden för regel fyra: räknade skriptet själv ur databasen skulle
utskicket och sajten kunna säga olika saker samma dag. Följden står som steg
noll i läs-mig-filen: bygg och lägg ut sajten först, skriv utskicken sedan.

**De fyra reglerna är byggda i koden och inte skrivna i en instruktion.**

1. **Ingen rangordning av kommuner.** Ett utskick bär bara sin egen kommuns
   tal, och `granska()` fäller ett utskick som nämner en annan kommun, med
   både ortnamn och myndighetsnamn prövade. Urvalet är mekaniskt och går inte
   att handplocka. Innehållsförteckningen i `00-las-mig.txt` bär medvetet inga
   tal alls: tre kommuner med varsitt tal under varandra är en jämförelse även
   när den ligger i ägarens egen katalog.
2. **Ingen lista sorterad på utfall och ingen namngiven verksamhet.**
   `granska()` prövar texten mot varje verksamhetsnamn i kommunen, och en
   ordlista fäller "sämst", "värst", "topplista", "värsting", "matsnusk" och
   deras släktingar. Ordlistan fällde det första utkastet på sex ord i just
   det avsnitt som skulle förklara att materialet inte är en skamlista, och
   meningarna skrevs om i stället för att ordet ströks ur listan.
3. **Ingen verksamhet i rubriken.** Ämnesraden byggs av en mall som bara
   känner ortnamnet, perioden och ett tal: "Så ser livsmedelskontrollen ut i
   Stockholm: 54 verksamheter har tillkommit sedan 8 augusti". Formkontrollen
   prövar att raden följer mallen och kör namnkontrollen på hela texten,
   ämnesraden inräknad.
4. **Varje tal går att slå upp, med länk.** Talen bor i en lista av `Fakta`
   med etikett, värde och adress, och både brödtexten och avsnittet "Så
   kontrollerar ni varje tal" renderas ur samma lista. Ett tal utan adress går
   alltså inte att skriva. Utöver det letar `granska()` upp varje siffergrupp
   i brödtexten och kräver att den finns bland fakta. Adresserna är
   `/[kommun]/nytt-och-borta/` för rörelsen, `/[kommun]/` för fördelningen,
   `/api/v1/kommun/<kommun>.json` för kontrollerna i perioden och `/kallor/`
   för utlämningarna.

**Ingenting är skickat**, och `00-las-mig.txt` säger att första utskicket ska
gå till en enda kommun, i enlighet med §13 steg 5.

### 14.3 Vem mottagaren är

Utrett 2026-09-05 med sökningar, utan att hämta en enda kontaktuppgift och
utan att kontakta någon. Slutsatsen ligger i `00-las-mig.txt` i kort form.

**Det är två olika redaktioner på samma tidning, och vårt material hör till
den ena.** Hygienkontroller ligger på **nyhetsdesken**, hos den som bevakar
kommunen och begär ut handlingar. Öppningar och nedläggningar ligger på
**näringslivs- eller företagsdesken**, som ofta redan har ett veckoformat för
nya bolag ur Bolagsverket. Ett utskick som blandar de två hamnar hos fel
person.

**Formatet finns redan, och redaktionerna gör arbetet för hand.** Bonnier News
Locals titlar driver stående ämnessidor på materialet: Hudiksvalls Tidnings
"Restaurangkollen" har löpt från åtminstone 2024 till augusti 2026, och
Arbetarbladet har en motsvarande samlingssida med artiklar från 2018 och
framåt. NWT Media gör samma sak i Värmland och Skaraborg, och
Mariestads-Tidningen beskrev 2025-05-05 öppet sin metod: samtliga
förelägganden 2020 till mars 2025 utbegärda för tre kommuner.
**Tidsserien är alltså den dyra delen för dem och den billiga delen för oss.**

**Den lucka vi kan äga är etableringslistan, inte kontrollistan.**
Jönköpings-Posten publicerar veckovis nya företagare och konkurser ur
Bolagsverket, och Folkbladet gör "hela listan" på nystartade företag i en
kommun. Ingen svensk redaktion hittades som gör motsvarande återkommande lista
på **nyregistrerade livsmedelsanläggningar hos kommunens miljökontor**.
Bolagsverkets lista fångar bolag och inte matställen, missar verksamhetsbyten
inom samma bolag, och en livsmedelsverksamhet ska dessutom anmälas till
kommunen innan den startar.

**Mottagaren är en funktion och inte en person.** Tidningarnas egna tipssidor
anvisar i tur och ordning ett tipsformulär, en allmän tipsadress till
redaktionen och nyhetschefen per telefon på vardagar. Skriv därför till
nyhetschefen eller redaktionens tipsfunktion. En namngiven reporter som är
ledig läser inte mejlet på tre veckor.

**Ett skäl att vara försiktig med en mottagartyp.** SVT:s regionala
redaktioner gör samma material men som jämförelse mellan kommuner, till
exempel Skåneredaktionens artikel 2025-04-25 om Malmö, som själv landar i att
skillnaden mot Göteborg och Stockholm delvis förklaras av olika arbetssätt och
inte av smutsigare kök. Det är precis den formen vi inte levererar. Skicka
gärna, men säg nej till att ta fram jämförelsen åt dem.

**Skamlisterisken är dokumenterad i formaten själva.** Nya
Kristinehamns-Posten har publicerat både "här är alla som klarade
livsmedelskontrollerna" och "alla restauranger som inte klarade
livsmedelskontrollen", alltså samma dataset i två motsatta vinklar. En
granskande desk vill ha en utpekad verksamhet, och levererar vi en färdig
sortering blir produkten en värstinglista med vårt namn på.
**Slutsatsen är att skicka förändringen och aldrig domen.**

Två invändningar till som en påläst reporter kommer att göra, och som därför
ska besvaras innan de ställs. Jämförbarheten mellan kommuner håller inte:
prop. 2005/06:214 slår fast att omdömena måste betyda samma sak i Ystad som i
Haparanda och att bedömningsgrunderna måste vara enhetliga, vilket de inte är
i dag. Och pressetiken skyddar personen men inte bolaget: Medieombudsmannen
prövar juridiska personers anmälningar bara i fråga om genmäle och rättelse,
medan en enskild firma med en ägare i en liten kommun ligger nära gränsen för
oförsvarlig publicitetsskada. Risken bärs av redaktionen, men ryktesdelen bärs
av källan.

**Inga kontaktuppgifter är hämtade och ingen är kontaktad.** Det finns ingen
adressbok i repot, och ägaren slår upp adressen själv på redaktionens egen
tipssida.
