# 54. Affärsmodellen, omskriven

**Datum:** 2026-08-31
**Beställning:** `docs/11` avsnitt 10 bygger på att restaurang-SaaS med "claim
och hantera profil" är där pengarna finns. `docs/44` mätte 2026-08-30 att det
inte stämmer, och `docs/45` §6.4 skrev in fyndet utan att räkna på det. Det här
dokumentet räknar på det och skriver om avsnitt 10.
**Föregångare:** `docs/44_marknaden_2026.md` §5 och §6 är mätningen som utlöste
omskrivningen och räknas inte om här, bara vidare.
`docs/21_foretagsyta_och_verifiering.md` är vad som redan är byggt.
`docs/47_utgivningsbevis.md` bär den juridiska gränsen som visar sig avgöra
frågan. `docs/17` och `docs/44` §7 bär förbuden.
**Metod:** varje tal om vårt eget bestånd är kört mot `site/src/data/*.json`
och `pipeline/data/` 2026-08-31. Varje externt tal är hämtat mot källans egen
adress, med datum i texten. Det som inte gick att belägga står i §11.

---

## 1. Slutsatsen först

Åtta slutsatser, i fallande ordning av vad de betyder.

1. **Bibelns punkt 2 är inte bara fel, den är förbjuden.** `docs/11` §10 vill
   sälja "claim och hantera profil" som betald nivå. Utgivningsbevisets
   databasregel kräver att innehållet inte kan ändras av någon annan än
   redaktionen, och blanketten skärper det: publiceras något utan redaktionens
   förhandsgodkännande kan bevis inte utfärdas. **En självbetjänad betald yta
   där kunden ändrar sidan kostar grundlagsskyddet.** Det är inte en avvägning,
   det är ett uteslutande villkor. Följden är exakt: värdet i en betald produkt
   måste ligga i vad kunden får skickat till sig, aldrig i vad kunden kan ändra
   på sidan. §7.1.
2. **Den brittiska förlagan var felläst, och rättelsen pekar åt ett annat
   håll.** Scores on the Doors, den största privata FHRS-sajten, säljer inte
   efterlevnadsverktyg till små verksamheter. De skriver själva: "Our business
   now focuses on helping commercial operators performance manage the
   compliance of their estate and benchmark themselves against their
   competitors", med JD Wetherspoon, Whitbread, Tesco och Greene King som
   namngivna kunder. Det är **kedjebevakning**, alltså exakt samma affär som
   Hazel Analytics byggde och Ecolab köpte. Av de tre aktörer i hela
   genomgången som över huvud taget tar betalt av någon säljer alltså två
   samma sak till samma sorts kund, oberoende av varandra, i två länder.
   §2.3 och §3.
3. **Intressekonflikten är tre konflikter, och bara en är löst.** Att sälja
   betyget är strukturellt stängt. Att välja vilka som pekas ut, och att göra
   sidan tillräckligt obehaglig för att verktyget ska vara värt att köpa, är
   varken stängda eller möjliga att designa bort. Det är den andra som är
   farlig, för den kräver inget uppsåt och skulle kännas som
   produktutveckling. §6.
4. **Målgruppen är mindre än den känns, och de flesta löser det själva.**
   1 774 verksamheter med brister av 15 365 bedömda, alltså 11,5 procent.
   Uppskattningsvis 8 800 i hela riket. Och 82,1 procent av de uppföljda
   kontrollpunkterna var åtgärdade vid återbesöket. Den brittiska
   betalningsviljan bygger dessutom på ett tryck som Sverige saknar: här sitter
   inget betyg i fönstret och styr ingen matleverans. §5.1, §5.7, §8.3.
5. **Kedjeköparna är däremot räknade och de finns redan i dagens data.**
   I Stockholm ensam har **90 privata innehavare fem enheter eller fler**, och
   de bär 1 063 verksamheter. Fyrtio har tio eller fler. Nittio kunder är en
   säljbar lista. Åttatusen är det inte. §5.5.
6. **Den svenska efterlevnadsmarknaden är knappt en marknad, och ingen kopplar
   ihop datan med hjälpen.** Konsolideringen har redan skett, Nomor är
   Rentokil sedan 2024, och de stora omsättningarna är skadedjur och inte
   matsäkerhet. Den största rena svenska mjukvaruaktören mot restauranger
   omsätter 3,1 miljoner kronor med noll anställda. Nästan ingen publicerar ett
   pris. Och ingen svensk aktör förenar offentlig kontrolldata med försäljning
   av åtgärden. Fältet är ledigt, och ingen före oss har lyckats ta betalt
   där. §4.
7. **Taket är nu mätt två gånger.** Den största brittiska aktören lämnar
   mikroföretagsbokslut, alltså högst en miljon pund. Ecolabs samlade
   förvärvsersättning för hela 2023, som rymmer både Hazel Analytics och ett
   förvärv till, var 175,8 miljoner dollar. Datamängden är en verklig tillgång
   och den är inte värd hundratals miljoner. §2.3, §3.3.
8. **Vi kan inte nå dem vi skulle sälja till, och vi ska inte försöka.** Vi
   lagrar varken telefon, e-post eller webbplats. Enda utgående kanalen är brev
   till 15,60 kronor styck, och ett brev som säger att vi publicerat era
   brister och säljer hjälp mot dem läser som utpressning även när det inte är
   det. Alltså är inbound inte den bästa kanalen utan den enda, och raden om
   vad man kan göra åt sitt resultat, `docs/44` §8.5, är inte en
   legitimitetsgest utan hela tratten. §7.2.

**Rekommendationen i tre rader står i §9.5.**

---

## 2. Vad de fyra brittiska aktörerna faktiskt säljer

`docs/44` §6.2 slog fast att ingen av dem tar betalt för en företagsprofil.
Det står sig, och det är verifierat om från källorna själva 2026-08-31. Men
tabellen i `docs/44` har två fel som ändrar slutsatsen, och de rättas här.

### 2.1 Tabellen, om

| Aktör | Drivs av | Vad som säljs | Pris | Köparen |
|---|---|---|---|---|
| foodhygieneratings.org.uk | "Dick Dolby" | **Ingenting** | | |
| hygienewatch.uk | anges inte | **Ingenting.** Märke gratis vid betyg 5, data fritt återanvändbar | | |
| scoresonthedoors.org.uk | Afterburner Consulting Ltd | Efterlevnadsuppföljning för **kedjor**, jämförelse mot konkurrenter | ej publikt, säljs mot offert | JD Wetherspoon, Whitbread, Tesco, Greene King |
| forkto.com | SlantedBox Ltd, SC865505 | Efterlevnads-SaaS | **från 13 GBP/mån per enhet** | från enskild verksamhet till kedja |

Två av fyra säljer alltså ingenting alls. Ingen av de fyra säljer annons,
betald placering eller en betald profil. Det söktes efter uttryckligen på varje
sajt, och fanns inte på någon.

### 2.2 Rättelse ett: SFBB+ är inte Scores on the Doors

`docs/44` §6.2 lägger raden "SFBB+, digital egenkontroll, 4,99 GBP/mån per
lokal" under Scores on the Doors. Det stämmer inte.

`sfbbplus.co.uk` bär i sin egen ansvarsfriskrivning namnet **All Environmental
Health Services ltd**, och det finns ingen länk mellan de två sajterna.
`for-food-business.php` hos Scores on the Doors länkar inte till SFBB+, och
SFBB+ länkar inte tillbaka. Läst 2026-08-31.

Priset stämmer däremot, ordagrant: "For a subscription of only GBP £4.99 per
month (inclusive) per premises (or equivalent cost in your territory) you can
have access to a digital SFBB solution, recognised by enforcement bodies and
food authorities." [sfbbplus.co.uk](https://www.sfbbplus.co.uk/), läst
2026-08-31. Fri provperiod tre månader.

**Och det är den viktigaste raden i hela genomgången, för vad de säljer är inte
innehållet.** SFBB, alltså Safer Food Better Business, är Food Standards
Agencys eget material och laddas ned gratis hos gov.uk. SFBB+ säger det själv i
sin fotnot: appen "contains ©Crown copyright material from Safer Food, Better
Business, Food Standards Agency, (reviewed April 2024, as amended) used under
the terms of the Open Government Licence v3". De tar 4,99 pund i månaden för
att digitalisera en gratis myndighetsblankett.

Det de säljer är journalföringsarbetet: att anteckningen är tidsstämplad,
delbar med personalen, finns kvar, och går att mejla till inspektören.
Innehållet är statens och gratis. Formen är deras och kostar pengar. Samma
förhållande gäller vår egen datamängd, och det är det närmaste en
affärsprincip den här genomgången ger: **betalt tas för arbetet som datan
sparar, aldrig för datan.**

### 2.3 Rättelse två: Scores on the Doors säljer till kedjor

Det här är den rättelse som flyttar mest.

Scores on the Doors beskriver sig själv så här på sin egen about-sida, läst
2026-08-31: "We provide the information free-of-charge to the Public." Och
sedan: "Our business now focuses on helping commercial operators performance
manage the compliance of their estate and benchmark themselves against their
competitors. Today many of the largest and most prestigious national chains use
our services."

Namngivna kunder i deras eget material: JD Wetherspoon, Whitbread, Tesco,
Greene King. Sajten har en **Client Login**. Priset publiceras inte och
hänvisas till en säljadress. Databasen anges till 364 kommuner och 612 864
verksamheter.

Med andra ord: den största privata FHRS-sajten i Storbritannien är inte en
konsumentsajt som säljer profiler, och den är inte heller en efterlevnadssäljare
mot små verksamheter. **Den är en bevakningstjänst för kedjor med många
enheter, och konsumentsajten är dess distributionskanal.**

Det är exakt samma affär som `docs/45` kallar **C3 Kedjebevakning**, som ligger
i våg 3, och det är exakt samma affär som Hazel Analytics byggde och Ecolab
köpte. Av de tre aktörer i genomgången som över huvud taget tar betalt av någon
säljer alltså två samma sak till samma sorts kund, oberoende av varandra, i två
länder.

Kvar står takrisken som `docs/44` mätte: Afterburner Consulting Ltd lämnar
mikroföretagsbokslut, alltså högst en miljon pund i omsättning. Modellen är
bevisad. Storleken är det inte.

### 2.4 Forkto, och det som faktiskt går att stjäla

Forkto är den enda av de fyra som säljer till den enskilda verksamheten, och
erbjudandet är verifierat ordagrant på deras egen sida
[forkto.com/free-until-five](https://forkto.com/free-until-five), läst
2026-08-31:

> "Rated 0, 1, 2 or 3? Use Forkto free until your next published rating is a 5,
> for up to 12 months. No card while you climb. We only get paid when you get
> your 5."

Villkoren är riktiga villkor och inte en slogan. Berättigad är den vars
publicerade FHRS-betyg är 0, 1, 2 eller 3, i England, Wales eller Nordirland.
Skottland är uteslutet eftersom det har ett annat system. Ett erbjudande per
lokal, bara nya kunder. Efter femman eller efter tolv månader, det som kommer
först, kostar det från 13 pund per månad och enhet.

Tre mekanismer i det är värda att skriva ned.

**Ett: myndighetens register är säljtratten.** "We check the Food Standards
Agency's public register live as you search." Verksamheten söker upp sitt eget
namn, systemet slår upp betyget hos FSA, och den som ligger lågt får
erbjudandet. Den offentliga datan gör kvalificeringen av leadet, gratis, i
realtid.

**Två: betalningen är knuten till utfallet.** Inte rabatt, inte provperiod,
utan risken flyttad till säljaren. Det är svaret på att betalningsviljan hos en
verksamhet med problem är oprövad: man tar inte betalt förrän problemet är
löst.

**Tre: deras egen diagnos är journalföring, inte hygien.** "Most rating drops
come down to Confidence in Management: records missing, out of date, or written
up the night before." Produkten är alltså tidsstämplade rutiner, inte renare
kök. Samma slutsats som SFBB+ i §2.2.

**Och här ligger den skillnad som hela §6 hänger på: Forkto publicerar inte
betyget.** FSA gör det. Forkto läser det. Forkto har därför ingen
intressekonflikt alls, eftersom de inte kan påverka det de säljer hjälp mot.
Vi skulle ha det. Det är inte en detalj, det är hela skillnaden mellan deras
läge och vårt.

### 2.5 Vidareledet, prövat

`docs/44` §6.2 skriver att Scores on the Doors skickar leads till Food Alert,
Safer Food Scores, HACCP-leverantörer och High Speed Training. Länklistan på
`for-food-business.php` lästes rå 2026-08-31. Utgående länkar finns till
**foodalert.com**, **saferfoodscores.co.uk**, **food-solutions.org**,
**foodprofitformulaforpubs.teachable.com** och UKHospitality.

Food Alert och Safer Food Scores stämmer alltså. **High Speed Training är inte
länkad därifrån**, och påståendet om det ledet ska strykas ur `docs/44` tills
någon hittar belägget. Att High Speed Training bygger en årlig FHRS-rapport ur
API:et står kvar, det är belagt på deras egen sida, men kopplingen till Scores
on the Doors är det inte.

Vad partnerna säljer, läst 2026-08-31:

| Partner | Produkt | Pris |
|---|---|---|
| High Speed Training | Level 1 Food Safety Awareness | 18 GBP + moms per deltagare |
| High Speed Training | Level 2 Food Hygiene and Safety | 20 GBP + moms |
| High Speed Training | Level 3 Supervising Food Safety | 130 GBP + moms |
| Food Alert | Alert65, revision, HACCP, rådgivning | ej publikt, demo mot förfrågan |
| Safer Food Scores | Revision, manualer, telefonrådgivning, hjälp vid omprövning | ej publikt, offert |

Safer Food Scores säljer uttryckligen det som ligger närmast en konflikt: "a
prediction of the food hygiene rating you would have received and an action
plan of how you can achieve 5 out of 5", plus hjälp i kontakten med kommunen
vid omprövning. De publicerar inget själva.

### 2.6 Vad mönstret säger

Fyra sajter på samma öppna data, och fyra olika svar på frågan hur man tjänar
pengar på den:

1. Ingenting. Två av fyra. Det är ett hobbyprojekt och det är också ett svar.
2. Kedjor betalar för uppföljning över hela beståndet. Scores on the Doors.
3. Enskilda verksamheter betalar för journalföring, och bara efter att
   problemet är löst. Forkto.
4. Vidareledet, alltså provision på någon annans utbildning eller revision.

**Ingen av dem säljer en profil, och ingen av dem säljer en placering.** Det
gör bara de svenska registersajterna, som inte har hygiendata. Skillnaden är
inte kulturell, den är strukturell: en hygiensajt som säljer placering har
inget kvar att sälja.

---

## 3. Hazel Analytics, prejudikatet

`docs/44` §6.1 slog fast att vår affär redan är byggd och såld. Här står vad
som faktiskt hände, eftersom det är det närmaste ett prejudikat vi har.

### 3.1 Bolaget började som forskning, inte som en affärsidé

**Hazel Analytics grundades 2014 av Ginger Zhe Jin, professor i nationalekonomi
vid University of Maryland, och Ben Bederson, professor emeritus i
datavetenskap där.** Medgrundare var Phillip Leslie och Arash Nasibi, som blev
vd. Bolaget finansierades bland annat av Maryland Innovation Initiative genom
TEDCO i två omgångar och stöddes av Alfred P. Sloan Foundation.
[research.umd.edu, publicerat i Maryland Today 2023-06-16](https://mpower.maryland.edu/hazel-analytics-a-food-safety-technology-company-co-founded-by-um-professors-acquired-by-ecolab/),
läst 2026-08-31.

**Och det där är inte en trivia.** Jin och Leslie är författarna till "The
Effect of Information on Product Quality: Evidence from Restaurant Hygiene
Grade Cards", Quarterly Journal of Economics, volym 118, nummer 2, maj 2003.
[academic.oup.com](https://academic.oup.com/qje/article-abstract/118/2/409/1899578).
Den mätte vad som hände när Los Angeles County 1998 införde hygienbetyg i
restaurangfönstren, och fann att kontrollpoängen steg, att efterfrågan blev
känslig för hygienkvalitet, och att antalet sjukhusinläggningar för
livsmedelsburen sjukdom minskade.

De skrev alltså först beviset för att publicerad hygieninformation ändrar
beteende, och byggde elva år senare bolaget på sin egen uppsats. Det är samma
tes som hela Prikko vilar på, och den är belagd i en av nationalekonomins mest
citerade tidskrifter.

### 3.2 Vad de byggde, och för vem

Enligt Maryland-artikeln byggde de "the largest database of food safety
inspection information in the United States" och betjänade "more than 200
global food service and retail brands and over half of the world's 100 largest
restaurant chains".

Ecolabs egen sida för produkten i dag, `ecolab.com/offerings/ecolab-hdi`, läst
2026-08-31, anger fler än 250 varumärken på fler än 100 000 enheter, och
beskriver vad produkten gör: den översätter "idiosyncratic data from thousands
of disparate sources into clear and actionable insights".

**Köparen är inte restaurangen. Köparen är kedjans huvudkontor**, och rollen
som köper är enligt Ecolabs egen formulering den som ansvarar för
livsmedelssäkerhet och varumärkesskydd. Ingressen på sidan säger vad de säljer
mot: "A single food safety incident has the potential to damage your brand, and
even more so when it's public record as part of a regulatory health
inspection."

De säljer alltså mot risken att den offentliga uppgiften syns. Det är exakt
samma sak som Scores on the Doors säljer i §2.3, formulerad av ett annat bolag
i ett annat land.

### 3.3 Köpeskillingen är inte offentlig, och taket går att räkna ut

Ecolab förvärvade Hazel Analytics i **april 2023**, och bolaget lades in i
divisionen **EcoSure**. Inga villkor för transaktionen offentliggjordes.

Det närmaste ett tal som går att komma är Ecolabs egen redovisning. I 10-K för
räkenskapsåret 2023 uppgår posten "Business Combination, Consideration
Transferred" till **175,8 miljoner dollar för hela året**. Källa: SEC:s
XBRL-API, CIK 0000031462, taggen `BusinessCombinationConsiderationTransferred1`,
avläst 2026-08-31.

**Det talet är ett tak och inte ett pris.** Ecolab gjorde minst två förvärv
2023: Hazel Analytics i april och Deloittes Brand Operations Services i juni,
[ecolab.com](https://www.ecolab.com/media-center/news/ecolab-acquires-deloittes-brand-operations-services).
Hazels andel av de 175,8 är okänd. Vad som går att säga är att den ligger under
det talet, alltså att hela värderingen är i tvåsiffriga miljoner dollar och
inte i miljarder.

### 3.4 De säljer samma data två gånger

Det här är den affärsmässiga poängen och den står redan i `docs/44` §6.1, men
den tål att sägas om med Yelp-sidan verifierad på nytt 2026-08-31.

Yelps eget tillkännagivande, daterat **2022-03-31**, säger att Hazel Analytics
"now powers the hygiene data on nearly 700,000 Yelp pages", från 48 delstater
plus Toronto och Vancouver, alltså jurisdiktioner som täcker nära 70 procent av
USA:s befolkning.
[blog.yelp.com](https://blog.yelp.com/news/yelp-partners-with-hazel-analytics-to-display-health-inspection-data-across-the-us-and-canada/).

Samma sida bekräftar bakgrunden i `docs/44` §6.5: "In 2013, Yelp created a new
open data standard called LIVES to digitize restaurant hygiene scores and make
them easily accessible to consumers." Standarden byggdes, kommunerna följde den
inte, och det som till slut fyllde Yelps sidor var ett privat bolag som skördat
kommunerna själv.

**Villkoren för Yelp-avtalet är inte offentliga.** Om Yelp betalar Ecolab, om
Ecolab betalar Yelp för räckvidden, eller om det är ett rent utbyte går inte
att läsa någonstans. Det står i §11.

Vad som ändå är säkert är formen: **samma insamling betalas av kedjorna och
syns hos konsumenten, och kostnaden för att hämta datan bärs en gång.** Det är
den enda kända modellen där ett skördat kontrollmaterial burit två kunder
samtidigt.

### 3.5 Vad fallet är värt att veta för oss

**Ett: normaliseringen är gjord förut, publikt, i stor skala.** Ecolab räknar
fram ett eget betyg där myndigheten saknar ett, med en öppet beskriven metod,
och märker ut det som uppskattat. `docs/44` §6.1 har metoden ordagrant.
`docs/11` §11 har "kommuner bedömer olika" som en risk med motdraget
"transparent, publicerad normalisering". Det motdraget är alltså prövat i
verkligheten på 700 000 sidor.

**Två: tidsplanen är nio år.** Grundat 2014, sålt 2023. Ett soloprojekt ska
inte räkna med annat.

**Tre: värderingen är blygsam.** Under 175,8 miljoner dollar för Amerikas
största databas över hygieninspektioner, i ett land med tio gånger Sveriges
befolkning, byggt av fyra grundare med universitetsfinansiering i ryggen.
Tillsammans med att den största brittiska aktören är ett mikroföretag, §2.3,
ger det två oberoende mätpunkter på taket. **Datamängden är en verklig
tillgång och den är inte en biljon kronor värd.** Det är det ärligaste
enskilda beskedet i hela dokumentet.

**Fyra: köparen var en tjänsteleverantör, inte ett mediehus.** Ecolab säljer
hygienkemikalier, revision och rådgivning till restaurangkedjor. De köpte datan
för att den gjorde deras befintliga tjänsteaffär bättre. Om Prikko någonsin
säljs är det troligaste hemmet detsamma: den svenska motsvarigheten heter
Anticimex, §4.4, som omsätter 1,37 miljarder kronor på tjänster till samma
kunder. `docs/11` §10 gissar "Visma, mediehus, försäkringsbolag, matleverans".
Mätningen pekar på en femte sort som inte står där.

---

## 4. Den svenska efterlevnadsmarknaden

Det här är den intäktsform mätningen pekar på, och den har aldrig undersökts i
något av våra dokument. Allt i avsnittet är hämtat 2026-08-31.

### 4.1 Utbildningen, den enda delen med publika priser

| Kurs | Leverantör | Pris | Form |
|---|---|---:|---|
| Livsmedelshygien och HACCP-principer | eSmiley | från 449 kr | online |
| Egenkontroll, god hygienpraxis | Gothia Logistics | från 750 kr | online, 4 till 5 h |
| Hygienkörkort | Rentokil | från 875 kr | online, 1,5 h |
| HACCP och egenkontroll | Krav Kompetens | 995 kr ex moms | online, 4 h |
| Heldagskurs i livsmedelshygien | MiljöCheck | 1 200 kr ex moms | lärarledd, en dag |
| E-utbildning HACCP | Rentokil | 1 450 kr | webb, 3 mån åtkomst |
| Grundläggande livsmedelshygien | Kiwa Sweden Academy | 1 900 kr ex moms | online, 3 h |
| Grundkurs livsmedelshygien och egenkontroll | Rentokil | 2 150 kr | lärarledd, Stockholm |
| Grundläggande livsmedelshygien | Diploma Utbildning | 2 395 kr ex moms | online, 1 h 16 min |
| Grundutbildning i HACCP | Bureau Veritas | från 7 000 kr | online, en dag |
| FSSC 22000 v7 | Intertek Academy | från 12 500 kr | två dagar |

Källor: leverantörernas egna sidor och kurssidorna hos
[utbildning.se](https://www.utbildning.se/kurs/livsmedel) och
[utbildning.se/kurs/haccp](https://www.utbildning.se/kurs/haccp), lästa
2026-08-31. Reservation: Rentokils sida för den lärarledda kursen anger
fortfarande "Datum: 27 oktober 2025", alltså kan priset vara gammalt.

**En grundkurs i livsmedelshygien kostar alltså 450 till 2 400 kronor per
person.** Med personalomsättningen i branschen är det en återkommande utgift,
men den är liten och den är redan väl försörjd.

**Anticimex publicerar tretton matsäkerhetskurser utan ett enda pris.** Allt
leds till "Kontakta oss",
[anticimex.se](https://www.anticimex.se/anticimex-utbildningar/matsaekerhet/).
Detsamma gäller Restaurangakademien. Mönstret från `docs/44` §5.1 punkt 3
upprepas alltså exakt: priset göms så fort en säljare är inblandad.

### 4.2 Egenkontrollen som produkt, där nästan inget pris finns

Två aktörer publicerar pris:

| Aktör | Produkt | Pris |
|---|---|---|
| EGNCTRL, App App App Sweden AB | digitalt egenkontrollprogram | anslutningsavgift 995 kr, sedan 250 kr/mån för tre användare, eller 90 kr/mån för en. Moms tillkommer, avtalet löper ett år i taget |
| SmartMate by Tingstad | temperaturövervakning som matar egenkontrollen | från 219 kr/mån plus 50 kr per givare, startkostnad 1 999 kr vid en till fyra givare, ingen bindningstid |

[egnctrl.se](https://egnctrl.se/) och
[tingstad.com](https://www.tingstad.com/se-sv/alla-kategorier/smartmate-by-tingstad/smartmate-temperaturkontroll).
**Reservation för EGNCTRL:** sidan renderas i webbläsaren och priset gick inte
att hämta om med ett andra anrop. Det ska verifieras innan det används i ett
beslut.

En restaurang med fyra givare landar på ungefär 419 kronor i månaden plus 1 999
i engångskostnad, alltså kring 7 000 kronor första året.

Alla andra gömmer priset: **Anticimex egenkontrollprogram**, **eSmiley**,
**Matilda FoodTech**, **Livsmedelskonsultens** tre nivåer och **Rentokils**
matsäkerhetstjänster. Samtliga har kontaktformulär och ingen prislista.

### 4.3 Rådgivningen efter en anmärkning, och varför den marknaden finns

**Livsmedelsverket har skrivit ned vår egen intressekonflikt, om sina egna
inspektörer.** Kontrollwiki, artikel 105, "Rådgivning till företag", läst
2026-08-31:

> "Om en inspektör har gett ett felaktigt råd eller ett råd som leder till en
> dyrare lösning än nödvändigt kan det uppstå krav på skadestånd. [...] Det kan
> också vara så att om inspektören är den som föreslagit en lösning, kan hen
> senare hamna i en jävssituation eller i en intressekonflikt när lösningen ska
> prövas eller på annat sätt granskas av myndigheten."

Och rakt ut om leverantörsledet:

> "Inspektören får inte heller rekommendera en viss hantverkare, ett visst
> fabrikat, en viss teknik eller liknande."

Samt: "rådgivning sker alltid inom ramen för myndighetsrollen. Rådgivning får
därför aldrig ske i sådana former att myndighetens opartiskhet och saklighet
kan ifrågasättas."
[kontrollwiki.livsmedelsverket.se/artikel/105](https://kontrollwiki.livsmedelsverket.se/artikel/105/radgivning-till-foretag).

**Rättelse till en vanlig missuppfattning:** inspektören får ge råd, och ska
göra det. Det hen inte får är att peka ut en leverantör eller förorda en viss
lösning. Skillnaden är viktig och ska inte överdrivas åt något håll.

Konsekvensen är ändå att det finns ett tomrum mellan kommunens krav och
verksamhetens åtgärd, och att det tomrummet fylls av en privat marknad.

**Den marknaden publicerar inga priser alls.** Anticimex livsmedelskonsultation
och hygieninspektion, Tingstads hygienbesiktning med åtgärdsplan och
uppföljning, Livsmedelskonsulten, QMS Consulting och de enskilda konsulterna:
inte en enda publicerar en timtaxa eller ett paketpris. Genomgången 2026-08-31
hittade noll.

### 4.4 Marknadsstrukturen: en hantel, inte en pyramid

| Bolag | Org.nr | Omsättning | Anställda |
|---|---|---:|---:|
| Anticimex Aktiebolag | 556032-9285 | 1 365 278 tkr (2025) | 528 |
| Rentokil Sverige AB, tidigare Nomor | 556526-3976 | 317 291 tkr (2024), resultat −14 188 tkr | 277 |
| Matilda FoodTech AB | 556650-8023 | 103 734 tkr (2024) | 53 |
| eSmiley AB, svenska bolaget | 556928-9530 | **3 085 tkr (2024)** | **0** |

Källa: [allabolag.se](https://www.allabolag.se/), lästa 2026-08-31.

Tre saker ur tabellen.

**Konsolideringen har redan skett, och den ändrar bilden.** Nomor finns inte
längre som eget bolag. Rentokil Initial förvärvade Nomor AB 2022 och sedan
1 januari 2024 drivs verksamheten under namnet Rentokil,
[news.cision.com](https://news.cision.com/se/rentokil-sverige/r/nomor-blir-rentokil,c3896882).
"De två stora svenska aktörerna" är alltså en svensk, Anticimex, och en
brittiskägd konsolidator.

**Men omsättningarna handlar mest om skadedjur.** Anticimex 1,37 miljarder är
till övervägande del sanering och försäkring, inte matsäkerhet, och
matsäkerhetsdelen går inte att skilja ut ur boksluten. Rentokil Sverige går
dessutom med förlust.

**Rena mjukvaruaktörer på restaurangsidan finns knappt.** Det svenska eSmiley
omsätter 3,1 miljoner kronor med noll anställda. EGNCTRL drivs av två personer
som drev restaurang i sjutton år. `checked.se`, som rankar på "digital
egenkontroll" i Google, svarar i dag med ett Vercel-fel, alltså 404.
`livsmedelskvalite.se` har ett utgånget certifikat och går inte att öppna.

Slutsatsen är obekväm på ett nyttigt sätt: **det här är inte en konsoliderad
mjukvarumarknad, det är knappt en marknad.** Det betyder både att fältet är
ledigt och att ingen före oss har lyckats ta betalt där.

### 4.5 Pengarna som redan rör sig, och kommunens eget argument

Se §5.6 för vad kontrollavgiften kostar i vårt eget bestånd. Här står bara det
som gör argumentet säljbart, och det är kommunens egen text.

Stockholms stad, om avgiften 2026, läst 2026-08-31:

> "För 2026 är kostnaden för livsmedelstillsyn 1 810 kronor per timme."

> "En typisk planerad kontroll tar cirka fyra timmar."

> "Ju bättre ordning du har i verksamheten och i dokumentationen, desto mindre
> tid behöver vi lägga på tillsynen och avgiften blir lägre."

> "Kontrollavgift: Cirka 6 000 kronor. Om vi hittar brister i er
> livsmedelshantering blir summan högre."

[tillstand.stockholm](https://tillstand.stockholm/tillstand-regler-och-tillsyn/servering-av-mat/avgift-till-livsmedelskontrollen/).

**Kommunen skriver alltså själv att bättre dokumentation ger lägre avgift.**
Det är den enda avkastningskalkylen för ett efterlevnadsverktyg i Sverige som
inte är hittepå, och den kommer från myndigheten och inte från en säljare.
Sedan 2024 debiteras kontrollen i efterhand, vilket gör kopplingen direkt: färre
timmar, lägre faktura.

### 4.6 Ingen i Sverige kopplar ihop kontrolldatan med hjälpen

Det här är avsnittets huvudfynd.

- **Livsmedelskollen är en kommunprodukt.** Androidpaketet heter
  `com.vismaconsultingapp.Livsmedelskollen`, alltså är Visma Consulting
  leverantör åt kommunerna. Den säljs till kommunen, aldrig till restaurangen.
  Den finns i Uppsala, Stockholm och Karlstad.
- **Sambruks specifikation finns och används inte kommersiellt.** Samma
  slutsats som `docs/44` §6.5, nu prövad från andra hållet: ingen kommersiell
  konsument av specifikationen har gått att hitta.
- **Livsmedelsverkets nationella datamängd duger inte till det här.** Den
  samlas in en gång om året och innehåller inte vilken anläggning kontrollen
  gällde.
- **Sverige övervägde och byggde aldrig smileysystemet.** SOU 2005:44 "Smiley:
  Hygien och redlighet i livsmedelshanteringen" och prop. 2005/06:214 föreslog
  publicering av kontrollresultat med restauranger först.
  [riksdagen.se](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/statens-offentliga-utredningar/smiley-hygien-och-redlighet-i_gtb344/html/).
  Det blev ingenting. Tjugo års passivitet i `docs/11` §11 har alltså ett
  aktstycke.

**Alltså: kontrolldatan är offentlig, utlämningspliktig, standardiserad på
papper, splittrad i praktiken, och monetiserad av ingen. Samtidigt gömmer varje
leverantör av botemedlet sitt pris bakom ett formulär och vet inte vilken
restaurang som just fick en anmärkning.**

Det är luckan. Frågan i §6 är om vi får fylla den.

---

## 5. Våra egna tal

Allt i avsnittet är kört mot `site/src/data/*.json` 2026-08-31, alltså efter
att färskhetsfönstret blev fem år samma dag.

### 5.1 Målgruppen, mätt

| Mått | Antal | Andel |
|---|---:|---:|
| Verksamheter totalt, 13 kommuner | 17 066 | |
| Med bedömning | 15 365 | 90,0 % av beståndet |
| Utan bedömning, aldrig kontrollerade | 1 574 | |
| Utan bedömning, för gammal kontroll | 127 | |
| **Inga anmärkningar** | **13 591** | 88,5 % av de bedömda |
| **Brister** | **1 362** | **8,9 % av de bedömda** |
| **Brister som kvarstår** | **412** | **2,7 % av de bedömda** |
| **Summa med brister av något slag** | **1 774** | **11,5 % av de bedömda** |

Räknat på hela beståndet i stället för på de bedömda är andelen 10,4 procent.

De 1 774 är målgruppen för ett efterlevnadsverktyg. Det är den enda siffra i
hela affärsfrågan som är mätt och inte gissad, och den är mindre än den känns.

### 5.2 Talet som gör en riksextrapolering osäker

| Kommun | Bedömda | Andel med brister |
|---|---:|---:|
| Lomma | 145 | **51,0 %** |
| Svenljunga | 83 | 48,2 % |
| Örebro | 1 189 | 26,9 % |
| Oskarshamn | 213 | 25,8 % |
| Karlstad | 601 | 20,1 % |
| Kristinehamn | 118 | 18,6 % |
| Stockholm | 7 911 | 11,0 % |
| Höganäs | 315 | 9,2 % |
| Linköping | 1 202 | 8,6 % |
| Borgholm | 305 | 7,2 % |
| Norrköping | 953 | 5,6 % |
| Uppsala | 1 218 | 3,9 % |
| Jönköping | 1 112 | **1,7 %** |

Spannet är trettio gånger. Det säger ingenting om hygienen i Lomma jämfört med
Jönköping, det säger vad kommunen skriver ned och hur den redovisar
uppföljning. Samma sak som gör att vi aldrig rangordnar kommuner gör att en
riksextrapolering av målgruppen är ett spann och inte ett tal.

Utan Stockholm, som ensam bär hälften av de bedömda, blir andelen 12,1 procent
i stället för 11,5. Riktningen håller, precisionen gör det inte.

### 5.3 Beståndet och flödet, som är två olika affärer

Ett bestånd på 1 774 verksamheter med brister är en engångsmarknad. Det som
går att sälja återkommande är **flödet**, alltså de som får en ny anmärkning.

| Mått | Antal |
|---|---:|
| Med brister, senaste kontrollen inom 12 månader | **1 039** |
| därav "Brister" | 754 |
| därav "Brister som kvarstår" | 285 |
| Med brister, senaste kontrollen 12 till 24 månader tillbaka | 374 |

1 039 av 15 365 bedömda, alltså **6,8 procent per år**. Det är takten som en
prenumeration ska räknas mot, och det är ett tal vi har och ingen annan i
Sverige har.

### 5.4 Vid 50 kommuner och vid hela riket

Nämnaren är Livsmedelsverkets egen: 92 746 anläggningar i kontrollmyndigheternas
register, ur "Sveriges livsmedelskontroll 2024" (L 2025 nr 13), summerad per
myndighet i `pipeline/data/kommunregister.csv`.

| Nivå | Anläggningar i registret | Andel av riket |
|---|---:|---:|
| Våra 13 myndigheter | 18 701 | 20,2 % |
| De 25 största | 41 128 | 44,3 % |
| **De 50 största** | **55 538** | **59,9 %** |
| De 100 största | 72 384 | 78,0 % |
| Samtliga 247 | 92 746 | 100 % |

Av de 50 största har vi sju. Sex av våra tretton ligger utanför listan, för de
är små. Att gå till femtio betyder alltså att hämta 43 myndigheter till, med
38 275 anläggningar.

Skalat med våra egna kvoter, alltså att vi publicerar 91,3 procent av de
registrerade och kan bedöma 90,0 procent av dem vi publicerar:

| Nivå | Bedömda | Med brister vid 11,5 % | Flöde per år vid 6,8 % |
|---|---:|---:|---:|
| I dag, 13 myndigheter | 15 365 | **1 774** | **1 039** |
| De 50 största | ca 45 600 | ca **5 300** | ca **3 100** |
| Hela riket | ca 76 200 | ca **8 800** | ca **5 200** |

**Talen i de två nedersta raderna är uppskattningar och ska skrivas som
uppskattningar överallt de används.** Spannet i §5.2 gör att riksbeståndet lika
gärna kan vara 6 000 som 12 000. Storleksordningen är däremot robust: den
svenska målgruppen för ett efterlevnadsverktyg riktat mot dem med anmärkning är
i tusental, inte i tiotusental.

### 5.5 Kedjorna, mätta i Stockholm

Kedjeaffären i §2.3 går att storleksbestämma direkt, eftersom
Stockholms registreringsintyg bär organisationsnummer. 8 016 av 8 514 rader har
ett publicerbart organisationsnummer, se `docs/12`.

Publika ägare borträknade, alltså allt som börjar på 20, 21 eller 22:

| Innehavare med | Antal innehavare | Enheter | Varav med brister |
|---|---:|---:|---:|
| 2 enheter eller fler | 509 | 2 047 | 223 |
| 3 enheter eller fler | 201 | 1 431 | 160 |
| **5 enheter eller fler** | **90** | **1 063** | **125** |
| 10 enheter eller fler | 40 | 741 | 92 |
| 20 enheter eller fler | 15 | 418 | 66 |

I en enda kommun finns alltså **90 privata innehavare med fem enheter eller
fler**, och de bär 1 063 verksamheter. Största enskilda innehavaren i
Stockholm är för övrigt kommunen själv, med 813 anläggningar, alltså skolkök
och omsorgskök.

Nittio kunder är en säljbar lista. Åttatusen är det inte. Och en kedja med
enheter i flera kommuner kan bara köpa av den som har flera kommuner, vilket
gör täckningen till en förutsättning och inte till ett mål i sig.

### 5.6 Vad kunden redan betalar, och till vem

En anmärkning kostar redan pengar, och det är den summan en betalningsvilja ska
mätas mot.

Sedan 2024 debiteras livsmedelskontrollen i efterhand. Nacka kommun skriver:
"Timavgiften är 1 648 kronor år 2026", och om uppföljningen: "Den uppföljande
kontrollen ingår inte i den normala kontrolltiden, vilket innebär att en extra
avgift tas ut för uppföljningen."
[nacka.se](https://www.nacka.se/naringsliv-foretag/tillstandsguiden/alla-tillstand/livsmedelskontroll-i-nacka/avgifter-for-livsmedelskontroll/),
läst 2026-08-31. Timtaxan 2026 ligger enligt kommunernas egna sidor mellan
ungefär 1 450 och 1 800 kronor.

I vårt bestånd finns **15 543 återbesök**. De 1 774 verksamheterna med brister
bär **2 405** av dem, alltså 1,4 återbesök per verksamhet. Varje sådant besök
faktureras utöver den planerade kontrollen.

Det är den enda belagda betalningsviljan i hela frågan, och den går inte till
oss. Den går till kommunen. Ett verktyg som gör ett återbesök onödigt har ett
prisankare på en till två timmar kommunal taxa per undviket besök.

### 5.7 Motvikten, som ska stå i samma avsnitt

`site/src/content/artiklar/vad-hander-efter-en-anmarkning.mdx` räknade fram
detta ur samma bestånd, och det talar mot hela affärsidén: av 3 437
kontrollpunkter som följdes upp vid ett återbesök var **2 821 åtgärdade, alltså
82,1 procent**. Av 15 552 återbesök gav 80,6 procent inga anmärkningar alls.

**De allra flesta löser sitt problem själva, utan att köpa något.** Den brittiska
modellen bygger på att en femma är värd mycket och en tvåa är dyr, eftersom
betyget sitter i fönstret och på Deliveroo. I Sverige finns ingen sådan press,
och därför finns troligen inte heller samma betalningsvilja. Det är den
enskilt starkaste invändningen mot att bygga något här, och den ska inte
gömmas i en fotnot.

---

## 6. Intressekonflikten

### 6.1 Den ska sägas rakt ut

Vi publicerar att en namngiven restaurang har brister. Sedan säljer vi till
samma restaurang hjälp att bli av med dem.

Det är en intressekonflikt. Den bortförklaras inte av att bedömningen är
kommunens underlag, inte av att modellen är publicerad, och inte av att vi
aldrig skulle ändra ett betyg mot betalning. Den finns i formen, oavsett hur
vi uppför oss.

Och den är inte en konflikt utan tre. De blandas nästan alltid ihop, och bara
den första är löst.

### 6.2 Konflikt ett: att sälja betyget

Att en verksamhet betalar och bedömningen ändras.

**Den är strukturellt stängd, och det är den enda av de tre som är det.**
Bedömningen räknas fram av en publicerad modell med versionsnummer per
bedömning, `modelVersion`, beskriven på `/metodik/`. Företagsytan når enligt
`docs/21` §5 varken bedömningen, kontrollhistoriken eller utmärkelsen, varken i
klienten eller i radsäkerheten. Det finns ingen manuell väg in.

Priset för att luta en enda bedömning är därför att publicera en annan
algoritm för alla. Det är inte omöjligt, det är bara olönsamt och synligt.

Samma linje som Reco och Trustpilot, refererad i `docs/21` §1: företaget kan
aldrig ta bort ett omdöme, och att säga det högt **är** produkten.

### 6.3 Konflikt två: att välja vilka som pekas ut

Att vi tjänar pengar per verksamhet med anmärkning ger oss ett intresse av att
fler får anmärkning.

**Den är inte löst, den går inte att designa bort, och den demonstrerades i
dag.** Modellversion 5 vidgade färskhetsfönstret från tre år till fem. Effekten
står mätt i `pipeline/prikko/grading.py`: antalet bedömda gick från 13 764 till
15 365, och av de 1 601 nytillkomna blev **142 "Brister" och 14 "Brister som
kvarstår"**. Dessutom skärptes **25 redan bedömda från "Brister" till "Brister
som kvarstår"**, eftersom det bredare fönstret gjorde upprepningen synlig.

Ändringen är riktig. Motiveringen i modulen är genomtänkt och den handlar om
vad läsaren får veta, inte om målgrupper. **Och den lade ändå 156 verksamheter
till den grupp ett efterlevnadsverktyg skulle säljas till, plus 25 uppflyttade
till den allvarligare nivån.**

Det är hela poängen. Ingen enskild ändring behöver vara oärlig för att summan
av dem ska luta åt att fler hamnar i den betalande målgruppen, och den dag en
intäkt hänger på talet finns ingen som kan avgöra om nästa modellversion valdes
av rätt skäl. Inte ens vi själva.

Det här är den farliga konflikten, inte mutan. Den syns inte, den kräver ingen
uppsåtlig handling, och den skulle kännas som produktutveckling hela vägen.

Den enda motvikt som betyder något är att modelländringar bär datum och
version, publiceras, och att en ändring som ökar andelen utpekade motiveras
skriftligt innan den går i produktion. Det är en bromskloss, inte en lösning.

### 6.4 Konflikt tre: att göra det ont

Ett efterlevnadsverktygs värde för köparen står i proportion till hur illa
sidan känns. Vi bestämmer hur illa den känns: hur högt bedömningen sitter, hur
den formuleras, om den finns på matsnusk-listan, hur väl sidan rankar på
verksamhetens eget namn.

Det är samma konflikt som två, uttryckt i formgivning i stället för i modell,
och den är lika olöst.

### 6.5 Vad andra gjort med samma konflikt

**Hemnet är inte svaret, och det ska sägas eftersom beställningen frågar.** Att
86,1 procent av intäkten kommer från bostadssäljaren och att Hemnet betalade
tillbaka 403,7 MSEK till mäklarkontoren löser en helt annan sak, nämligen vem
som betalar när två parter har nytta av samma annons. `docs/44` §5.3 drar rätt
slutsats ur det, att den som betalar inte behöver vara den som syns. Men Hemnet
bedömer ingen. De sätter inget betyg på säljaren. Analogin bär inte hit.

**Den svenska analogin finns, och den är obekväm.** allabolag publicerar
företagets kreditbetyg och säljer samtidigt Marknadspaket till samma företag,
i fyra steg från 7 990 kr till 30 990 kr, med formuleringen "Med detta paket
kommer du att få den högsta rankingen i våra träfflistor",
[allabolag.se/info/marknadspaket](https://www.allabolag.se/info/marknadspaket/),
läst 2026-08-31. Reservation: sidan anger inte avtalsperiod, så det är okänt
om talen är per år. `docs/44` §5.1 hade "pris ej publikt" på den raden, och det
ska rättas.

Alltså: den svenska branschens svar på exakt vår konflikt är att inte bry sig.
Den som bedöms får köpa förstaplatsen. Det svaret kan vi inte ta, inte av
finkänslighet utan för att kreditbetyg och matsäkerhet inte tål samma sak. Ett
felaktigt kreditbetyg kostar pengar. Ett felaktigt hygienbetyg som någon köpt
sig ur kostar någon annans hälsa, och den dagen det avslöjas finns ingen
verksamhet kvar att rädda.

**Forkto slipper konflikten helt, och det är därför de kan göra det de gör.**
De publicerar ingenting. FSA publicerar. Forkto läser registret och säljer
hjälp. Den som sätter betyget och den som säljer botemedlet är två olika
parter. Vi skulle vara samma part. Hela §2.4 hänger på den skillnaden.

**Livsmedelsverket har formulerat principen åt oss**, om sina egna inspektörer,
i §4.3: den som föreslagit lösningen hamnar i jäv när lösningen ska prövas. Det
är svenskt, det gäller livsmedelskontroll, och det är skrivet av myndigheten.
Om det inte är rimligt att inspektören pekar ut ett fabrikat, är det inte
självklart rimligt att den som publicerar bedömningen gör det.

### 6.6 Formerna, prövade en och en

| Form | Konflikt 1 | Konflikt 2 | Konflikt 3 | Dom |
|---|---|---|---|---|
| A. Vi säljer verktyget själva till den vi bedömt | stängd | **öppen** | **öppen** | Inte ren |
| B. Vi hänvisar utan provision | stängd | stängd | stängd | **Ren.** Ger noll kronor |
| C. Vi hänvisar mot provision | stängd | **värst av alla** | **öppen** | **Aldrig** |
| D1. Kedjan betalar för sina egna enheter | stängd | svag | svag | Minst smutsig av de betalda |
| D2. Försäkringsbolag betalar | stängd | **öppen** | stängd | Nej, se nedan |
| D3. Datamängden till den som inte agerar mot enskild | stängd | stängd | stängd | **Ren** |
| E. Annons från efterlevnadssäljare bredvid brister | stängd | **öppen** | **öppen** | Är C i förklädnad |

**Om C.** En provision per lead är den enda formen där intäkten är en direkt
funktion av antalet utpekade. Den ska inte byggas, inte prövas och inte
utredas vidare.

**Om D2.** `docs/44` §6.4 visade att försäkringsspåret är verkligt i
Storbritannien och outnyttjat i Sverige. Men om vår bedömning börjar påverka
någons premie blir modellen en myndighetsutövning utan överklagande. FSA har
överklagande inom 21 dagar och avgiftsfri omprövning, och `docs/44` §3.7 slår
fast att vi inte kan bygga någon av delarna. Ett mått med följder men utan väg
tillbaka är precis den invändning som kan sänka projektet.

**Om D1.** Kedjan är fortfarande den vi bedömer, en nivå upp. Skillnaden som
gör den bärbar är att kedjan köper för att hitta sina egna problem före
kommunen, alltså i förebyggande syfte, och att ingen enskild sida blir mildare
av köpet. Det är samma affär som Scores on the Doors och som Ecolab HDI, och
det är den enda betalda formen med två oberoende prejudikat.

### 6.7 Domen

**Ingen betald form är helt ren utom D3, alltså att sälja datamängden till
någon som inte är den vi bedömer och som inte agerar mot en enskild
verksamhet.** Allt annat som ger pengar bär konflikt två i någon styrka, och
konflikt två går att begränsa men inte att ta bort.

Det betyder inte att inget får byggas. Det betyder att formerna ska sorteras
efter hur mycket konflikt de bär, att den renaste ska byggas först, och att
ingen av dem får byggas utan att konflikten står skriven där kunden och
besökaren kan läsa den.

Och en regel som följer direkt: **utmärkelsen och märket får aldrig kosta
pengar.** Att sälja beviset på en bra bedömning är att sälja bedömningen, med
ett extra steg emellan.

---

## 7. Två gränser som inte är etiska utan hårda

De här två avgör mer än hela §6, och ingen av dem är en åsikt.

### 7.1 Grundlagen förbjuder den produkt bibeln föreslår

`docs/47` §2.1 räknar upp kriterierna för utgivningsbevis. Det sista lyder att
**innehållet inte kan ändras av någon annan än redaktionen**, och `docs/47`
§2.4 citerar blankettens skärpning: finns innehåll som publiceras utan att
redaktionen godkänt det i förväg kan utgivningsbevis inte utfärdas, och den
omodererade delen måste avskiljas till en egen databas.

`docs/11` §10 punkt 2 säger "claim och hantera profil" och räknar upp hantera
profil, notiser, verifierat märke, konkurrentjämförelse och widget som en
betald nivå. **En självbetjänad betald yta där kunden ändrar vad som står på
sidan kostar grundlagsskyddet.** Det är inte en avvägning, det är ett
uteslutande villkor i 1 kap. 5 § yttrandefrihetsgrundlagen så som
Mediemyndigheten tillämpar det.

Prikko är redan byggt rätt, och `docs/21` §5 beskriver hur: en rad är en
insändning, en människa publicerar eller avslår, texten kan aldrig ändras på
vägen. Det är redaktion, inte självbetjäning.

**Följden för affären är exakt och lätt att missa: värdet i en betald produkt
får inte ligga i vad kunden kan ändra på sidan. Det måste ligga i vad kunden
får skickat till sig.** Bevakning, export, sammanställning, avisering, allt
utåtriktat. Det utesluter SaaS-formen i bibeln och pekar rakt på
bevakningsformen i §2.3.

Det är också ett bra besked. Bevakning är billigare att bygga, den skalar utan
moderering, och den är den enda form två oberoende utländska aktörer faktiskt
tagit betalt för.

### 7.2 Vi har ingen kanal till dem vi skulle sälja till

Vi lagrar varken telefon, e-post eller webbplats. `docs/13` §A7 och `docs/21`
§4 säger det, och `docs/21` bygger hela verifieringsvalet på att
verksamhetsställets adress är den enda kontaktväg vi har.

Av de 1 774 verksamheterna med brister har **1 588 en adress, alltså 89,5
procent**, mätt 2026-08-31. Enda utgående kanalen är brev, och `docs/21` §3
prissatte den till 15,60 kr ex moms per brev via Ekopost.

Ett årsflöde på 1 039 brev kostar alltså ungefär 16 000 kronor i porto för
dagens tretton kommuner, och ungefär 81 000 kronor för ett riksflöde på 5 200.
Billigt.

**Och det ska ändå inte göras.** Ett brev till en restaurang som säger att vi
har publicerat att den har brister och att vi säljer hjälp mot dem är den mest
skadliga enskilda handling som finns beskriven i det här dokumentet. Det läser
som utpressning även när det inte är det, och det behöver bara hända en gång
för att bli den enda historia som skrivs om Prikko.

Alltså: **inbound är inte den bästa kanalen, den är den enda.** Och den
inbound-kanal som finns för en verksamhet med anmärkning är att den söker på
sitt eget namn och hittar sin egen sida.

Det gör `docs/44` §8.5, alltså en rad på verksamhetssidan om vad man kan göra
åt sitt resultat, till något annat än en legitimitetsgest. **Den är hela
tratten.** Den ska byggas som legitimitet, och den ska skrivas som legitimitet,
och den kommer ändå att vara det enda ställe där en betalande kund någonsin
kan hitta oss. Att den skrivs utan säljande ton är därför inte bara hederligt,
det är villkoret för att den ska få stå kvar.

---

## 8. Intäktsströmmarna, rangordnade om

Bibelns fem, plus det mätningen tillför, sorterade efter vad de kan ge delat
med vad de kostar i förtroende. Bibelns nummer står inom parentes.

### 8.1 Ordningen

| # | Ström | Kan ge | Förtroendekostnad | Kräver |
|---|---|---|---|---|
| 1 | **Kedjebevakning** (delvis bibelns 3) | 0,4 till 3 MSEK ARR, se 8.2 | låg | Täckning, ingen säljorganisation |
| 2 | **Datamängden som produkt** (bibelns 3) | okänt, inget svenskt jämförelsepris finns | ingen | Täckning |
| 3 | **Displayannonser** (bibelns 1) | `docs/11` räknar 1,5 till 20 kEUR/mån vid nationell trafik | medel, och bara i en form | Trafik som ännu inte är mätt |
| 4 | **Fri hänvisning efter anmärkning** | noll kronor | **negativ, alltså den bygger förtroende** | En rad text per kommun |
| 5 | **Efterlevnadsverktyg till den vi bedömt** (bibelns 2, omtänkt) | högst i teorin, se 8.3 | **hög** | Att §6.3, §7.1 och §7.2 löses först |
| 6 | **Utbildning som affiliate** (bibelns 5) | liten | **hög** | Ska inte göras, se 8.4 |
| 7 | **Certifikat och premiummärken** (bibelns 4) | | **förbjuden** | Märket är gratis, alltid |
| 8 | **Betald placering** | branschens vanligaste | **förbjuden** | |

**Bibelns punkt 2 faller från första till femte plats.** Bibelns punkt 3 delas
i två, och den ena halvan, kedjebevakningen, går upp till första. Punkt 4 och 5
stryks som intäktsströmmar.

### 8.2 Kedjebevakningen, räknad

Det här är den enda ström som har två oberoende prejudikat, Scores on the Doors
i §2.3 och Ecolab HDI i §3, och den enda som är läsbar utåt och därmed förenlig
med §7.1.

Underlaget ur §5.5: 90 privata innehavare i Stockholm har fem enheter eller
fler, och de bär 1 063 verksamheter. Stockholm är 10,2 procent av landets
anläggningar. Rakt uppskalat blir det ungefär **880 innehavare och 10 400
enheter i riket**, med en tydlig reservation: kedjetätheten är högre i
Stockholm än i landet, så talet är ett tak och inte en prognos.

Prisankaren finns i `docs/44` §6.6. Ren bevakning ligger på tolv till fyrtio
kronor per objekt och månad, Calculate. Redaktionellt bearbetad bevakning
ligger på 899 till 3 750 kronor per användare och månad, Blendow Lexnova.

| Modell | Vid full täckning | Vid 10 procents penetration |
|---|---:|---:|
| 12 kr per enhet och månad | 1,5 MSEK/år | 0,15 MSEK/år |
| 30 kr per enhet och månad | 3,8 MSEK/år | 0,38 MSEK/år |
| 1 500 kr per kund och månad | 15,9 MSEK/år | 1,6 MSEK/år |

**Talen är aritmetik, inte prognos.** Ingen av dem bygger på en enda mätt
betalningsvilja. Det de säger är storleksordningen: den här strömmen är en
verksamhet i miljonklassen, inte i tiomiljonersklassen, och den är
återkommande.

**En sak i den brittiska produkten får inte följa med.** Scores on the Doors
säljer "benchmark themselves against their competitors", alltså jämförelse mot
namngivna konkurrenter. Det får de göra eftersom FHRS är ett enda mått. Här
skulle samma bild inte vara en jämförelse, `docs/44` §3.8. Vår version är att
kedjan ser sina egna enheter mot varandra och mot riksmedianen. Det är
mindre än vad britterna säljer, och det är den enda formen som är sann.

Det som avgör vilken rad man hamnar på är om produkten är en avisering eller
ett mått. `docs/44` §6.6 formulerar det redan: "vi mejlar när din rapport
publiceras" hamnar i tolvkronorsfacket, medan normaliserat mått plus jämförelse
plus åtgärdsflöde ligger i det andra. Vår normaliserade bedömning är precis det
som skiljer.

Och en detalj som gör strömmen säljbar tidigt: **de 90 finns redan i dagens
bestånd.** Kedjebevakning i Stockholm går att sälja innan riket är hämtat, för
Stockholm ensam är en tiondel av landet.

### 8.3 Efterlevnadsverktyget, och varför det faller till femte plats

Det är fyndet som beställde det här dokumentet, och genomgången gör det svagare
än det såg ut.

**Fyra saker talar emot, och tre av dem är mätta.**

1. **Målgruppen är liten.** 1 774 i dag, uppskattningsvis 8 800 i riket, §5.1
   och §5.4. Vid 250 kronor i månaden och tio procents penetration är det
   ungefär 2,6 MSEK om året i hela Sverige, och det förutsätter att varenda
   kommun är hämtad.
2. **De löser det själva.** 82,1 procent av de uppföljda kontrollpunkterna var
   åtgärdade vid återbesöket, §5.7. Problemet är ofta borta innan någon hinner
   sälja något mot det.
3. **Grundlagen stänger den vanliga formen.** §7.1.
4. **Vi kan inte nå dem, och skulle inte få göra det.** §7.2.

Och den bärande skillnaden mot Storbritannien: Forkto säljer mot ett betyg som
sitter i fönstret och styr om Deliveroo listar dig. I Sverige finns inget
sådant tryck, och `docs/44` §6.3 mätte att beställningsportalerna här inte har
något att visa. Betalningsviljan är byggd på en press som inte finns här.

**Om det någonsin ska prövas ska det ske i Forktos form och ingen annan:**
betalning knuten till utfallet, alltså gratis tills problemet är löst. Det är
den enda utformning som inte ger oss en intäkt av att någon har brister, utan
en intäkt av att någon slutat ha dem. Konflikt två i §6.3 vänds då åt rätt
håll. Den formen är inte ren, men den är den enda som ens är diskuterbar.

### 8.4 Det som stryks ur bibeln

**Punkt 4, certifikat och premiummärken.** `docs/45` B2 till B4 gör märket och
dekalen till distributionskanal, och Danmark bevisade i `docs/44` §4.1 att
belöningen kan strykas medan kanalen behålls. Ett märke som kostar pengar är ett
köpt bevis på en bedömning. Det ska vara gratis för alla som uppfyller
villkoret, och gratis för alltid.

**Punkt 5, affiliate på HACCP-utbildning.** Det är form C i §6.6, alltså
provision per lead, och den är den enda formen där intäkten är en rak funktion
av hur många vi pekar ut. Att den är liten gör den inte ofarlig, den gör den
bara billig att avstå från.

Bordsbokningsdelen av punkt 5 är en annan sak och faller inte på etiken utan på
att den inte är utredd. Den lämnas därhän.

**Betald placering** stod aldrig i bibeln och står här bara för att `docs/44`
§5.1 visade att det är branschens vanligaste form och att `docs/44` §5.3 och
§6.6 visade att alla svenska jämförelseobjekt lever på den. Att avstå den är
det dyraste enskilda beslutet i hela affärsmodellen, och det ska erkännas som
en kostnad och inte firas som en dygd.

---

## 9. Rekommenderad sekvens

### 9.1 Klockan som gör ordningen brådskande

SOU 2025:64 vill flytta all livsmedelskontroll från kommunerna till
Livsmedelsverket den 1 januari 2028, `docs/44` §2.1. Det betyder två saker för
affären, och de drar åt motsatt håll.

Skördandet är i dag vår vallgrav, `docs/44` §6.5. En enda nationell myndighet
gör skördandet trivialt och vallgraven värdelös. Samtidigt är serien vi bygger
nu den enda som går att lägga över skarven, och en kedja som vill följa sina
enheter över reformen kan bara göra det hos den som har båda sidorna.

**Fönstret där skördandet är värt något är alltså ungefär 2026 till 2028.** Det
är inte ett skäl att sälja tidigt. Det är ett skäl att hämta fort.

### 9.2 Vad som ska säljas först

**Ingenting, på ungefär sex månader.** Och sedan kedjebevakning.

Det första som ska göras är de tre saker som varje intäktsström är beroende av
och som ingen av dem betalar för:

1. **Täckning.** `docs/45` A1 och H1. Varje ström i §8 har täckning som villkor,
   och kedjeströmmen kan inte säljas till en kedja med enheter i kommuner vi
   saknar. De 50 största myndigheterna bär 59,9 procent av anläggningarna, och
   43 av dem har vi inte.
2. **Raden om vad man kan göra åt sitt resultat.** `docs/44` §8.5. Den är
   legitimitet, och enligt §7.2 är den dessutom den enda kanal som någonsin
   kommer att leda en betalande kund till oss. Den ska skrivas utan säljande
   ton, och det är inte en stilfråga.
3. **Utgivningsbeviset.** `docs/47`. 4 000 kronor. Ingen betald produkt ska
   byggas medan den frågan är öppen, eftersom §7.1 visar att produktvalet och
   grundlagsskyddet hänger ihop.

**Första betalda produkten: kedjebevakning, testad i Stockholm.** Skälet är att
den är den enda ström som har två prejudikat, den enda som är läsbar utåt och
därmed förenlig med §7.1, den enda med en räknad kundlista, och den enda som
går att sälja innan riket är hämtat. Testet är litet och konkret: nittio
innehavare med fem enheter eller fler finns i dagens data. Tio samtal räcker
för att veta om betalningsviljan finns.

Priset ska testas i det övre facket, alltså som mått och jämförelse och inte
som avisering, av skälet i §8.2.

**Och här ska en avvägning stå skriven i stället för att gömmas.** §6.7 säger
att den enda helt rena betalda formen är att sälja datamängden till någon som
inte är den vi bedömer. Den formen rekommenderas ändå inte först, eftersom den
kräver täckning vi inte har. Kedjebevakningen är alltså inte den renaste
formen, den är den renaste av dem som går att sälja i år. Skillnaden är
medveten, den bärs av att kedjan köper förebyggande och att ingen enskild sida
blir mildare av köpet, och den ska omprövas den dag datamängden går att sälja.

### 9.3 Vad som ska vänta

**Datamängden som produkt.** Ren, men den kräver täckning för att vara värd
något, och `docs/45` B1 vill samtidigt ge bort en öppen fil gratis för
positionens skull. De två går ihop, men gränsen mellan den fria filen och den
betalda leveransen måste dras medvetet och inte i efterhand. Vänta tills
täckningen passerat halva riket.

**Displayannonser.** `docs/45` B11 säger att vi inte vet om våra sidor ens finns
i Google. Att prissätta trafik vi inte mätt är att gissa. Mät indexeringen
först. Och när de införs: aldrig riktade mot verksamhetstyp, aldrig i närheten
av en bedömning, aldrig från en säljare av efterlevnad. Annars är det form E i
§6.6.

**Efterlevnadsverktyget till verksamheten.** Vänta, och antagligen för alltid.
Villkoren för att ens ta upp frågan igen: att bedömningsmodellen är stabil och
har en publicerad ändringslogg, att §7.1 är löst i en form som inte kostar
grundlagsskyddet, och att formen är Forktos, alltså betalning knuten till
utfallet.

**Försäkringsspåret.** Vänta på att någon annan öppnar det. Vi ska inte vara
den part som gör vår egen bedömning till en premiefaktor, se §6.6 om D2.

### 9.4 Vad vi aldrig ska röra

1. **Betald placering i sökresultatet, i någon form.** Det är branschens
   vanligaste intäkt och den enda vi aldrig kan ta.
2. **Ett bättre betyg för pengar, i någon form,** inklusive en snabbare
   omprövning, en mildare formulering eller en tidigare borttagning av en rad.
3. **Provision per lead till en efterlevnadssäljare.** Den enda formen där
   intäkten växer med antalet utpekade.
4. **Ett betalt märke eller certifikat.**
5. **Utgående brev eller mejl till en verksamhet med anmärkning där något
   säljs.** Även när porto och adresser finns, och de finns.
6. **En rangordning av kommuner eller namngivna kedjor**, även när en betalande
   kund ber om den, och det kommer den att göra. Scores on the Doors säljer
   uttryckligen "benchmark themselves against their competitors", och
   hygienewatch.uk rangordnar 59 kedjor publikt. `docs/44` §3.8 förklarar
   varför det går i Storbritannien och inte här: FHRS är ett mått, våra
   kommuner bedömer olika, och samma bild skulle här inte vara en jämförelse
   utan en osanning. **Gränsen som gäller: en kedja får se sina egna enheter
   mot varandra och mot riksmedianen, aldrig mot en namngiven konkurrent.**
   Det är samma regel som `docs/17` redan sätter för kommunsidorna, och den
   ska stå i avtalet och inte bara i koden.
7. **En värstinglista i säljbar form,** alltså sortering, filtrering eller
   export av de sämsta åt en betalande part.

### 9.5 Sammanfattat i tre rader

**Sälj först:** ingenting på ett halvår, sedan kedjebevakning till de 90
innehavarna i Stockholm.
**Vänta med:** datamängden till halva riket är hämtat, annonserna till
indexeringen är mätt, efterlevnadsverktyget till modellen är fryst och
antagligen för alltid.
**Rör aldrig:** placering, betyg, provision, betalt märke, utgående säljbrev
till den vi pekat ut.

---

## 10. Rättelser till andra dokument

Ingen av dem har rättats i sitt eget dokument. De står här så att nästa omgång
vet.

### Till `docs/11` avsnitt 10

1. **Punkt 2 är fel.** "Restaurang-SaaS (claim och hantera profil) är DÄR de
   riktiga pengarna finns" stämmer inte mot någon mätning. Ingen av de fyra
   brittiska aktörerna säljer det, §2.1. Formen kostar dessutom
   grundlagsskyddet, §7.1. Strömmen faller från första till femte plats, §8.1.
2. **Punkt 3 ska delas.** "Franchisekedjor (bevaka enheter)" ligger begravd som
   en kundtyp under datalicensiering. Det är en egen produkt, den har två
   prejudikat, och den är den ström som ska säljas först, §8.2.
3. **Punkt 4 och 5 ska strykas som intäktsströmmar.** §8.4.
4. **"1 000 till 3 000 betalande × 10 till 30 EUR/mån" saknar underlag.** Den
   mätta målgruppen med anmärkning i hela riket är uppskattningsvis 8 800,
   §5.4, och 82,1 procent av bristerna är åtgärdade vid återbesöket, §5.7.
5. **Den ärliga domens sista mening står kvar och ska förstärkas.**
   "ryktes-balansgången (du betygsätter dem *och* säljer till dem)" är inte en
   risk bland sju. Det är den fråga hela avsnittet måste byggas kring, §6.

### Till `docs/44`

6. **§6.2, tabellen.** Raden "Scores on the Doors, SFBB+, digital egenkontroll,
   4,99 GBP/mån" har fel aktör. SFBB+ drivs av All Environmental Health
   Services ltd och har ingen känd koppling till Scores on the Doors, §2.2.
7. **§6.2, raden om leads.** Food Alert och Safer Food Scores är länkade från
   `for-food-business.php` och stämmer. **High Speed Training är inte länkad
   därifrån** och det ledet ska strykas tills någon belägger det, §2.5.
8. **§6.2 saknar det viktigaste om Scores on the Doors.** De är inte en
   efterlevnadssäljare mot små verksamheter, de är en bevakningstjänst för
   kedjor med namngivna kunder som Wetherspoon, Whitbread, Tesco och Greene
   King, §2.3. Det är den enskilt viktigaste rättelsen i dokumentet.
9. **§5.1, raden "allabolag.se Marknadspaket, pris ej publikt".** Priserna är
   publika: 7 990, 9 990, 14 990 och 30 990 kronor, med "den högsta rankingen i
   våra träfflistor" som säljargument. Avtalsperiod anges inte, §6.5.

### Till `docs/45`

10. **C1 och C5 ska byta plats med C3.** Verksamhetsprofilen som betald produkt
    faller, kedjebevakningen går först. C3 ligger i dag i våg 3 och ska upp.
11. **C2 Prislistan har fått sitt underlag** och svaret är att prislistan inte
    ska skrivas, eftersom produkten den skulle prissätta inte ska byggas.

---

## 11. Vad som inte gick att belägga

1. **EGNCTRL:s priser.** Lästa en gång 2026-08-31, men sidan renderas i
   webbläsaren och gick inte att hämta om med ett andra anrop. Det är det enda
   publika svenska priset för ett digitalt egenkontrollprogram och det ska
   verifieras för hand innan det används i ett beslut.
2. **Priser på svensk hygienrådgivning.** Noll av de genomgångna konsulterna
   och tjänsteföretagen publicerar en timtaxa eller ett paketpris, §4.3. Det är
   ett resultat och inte en lucka, men det betyder att prisankaret för
   åtgärdsledet saknas helt.
3. **Anticimex matsäkerhetsdel.** Går inte att skilja ut ur koncernbokslutet,
   §4.4. Hur stor den svenska matsäkerhetsmarknaden faktiskt är i kronor är
   därför okänt.
4. **Scores on the Doors priser.** Säljs mot offert. Vad en kedjebevakning
   faktiskt kostar i Storbritannien är alltså obekant, och prisankaret i §8.2
   är hämtat från svensk bolagsbevakning i stället.
5. **Betalningsviljan hos en svensk verksamhet med anmärkning.** Helt oprövad.
   Den kan bara mätas genom att fråga, och §7.2 säger att vi inte får fråga
   utgående. Det är ett verkligt hinder för att någonsin veta.
6. **Om allabolags marknadspaketpriser är per år eller per period.** Sidan
   anger ingen avtalsperiod.
7. **Kedjetätheten utanför Stockholm.** §5.5 är mätt bara i Stockholm, eftersom
   det är den enda kommunen där vi har organisationsnummer, `docs/12`.
   Riksuppskalningen i §8.2 är därför ett tak.
8. **Rentokils kurspris.** Sidan anger ett kursdatum i oktober 2025 och kan
   vara inaktuell.
9. **Om Livsmedelsakademin, Svensk Certifiering, Företagsuniversitetet, SGS,
   RISE eller Visita säljer hygienutbildning direkt till restauranger.** Inga
   belägg hittades. Det betyder inte att de saknas.

---

## 11. Hazel Analytics, hela fallet, mätt 2026-08-31

Avsnitt 3 byggde på det som gick att läsa snabbt. Det här är genomgången i sin
helhet, och den ändrar tre saker: prisbilden, storleken på bolaget, och vad
LIVES faktiskt är i dag.

### 11.1 Bolaget var litet, självfinansierat och lönsamt

Grundat 2014 av fyra personer, varav två är författarna till den studie som
skapade hela marknaden: Jin och Leslie skrev *"The Effect of Information on
Product Quality: Evidence from Restaurant Hygiene Grade Cards"* i Quarterly
Journal of Economics 2003, alltså den om betygsskyltarna i Los Angeles. De
skrev forskningen, byggde sedan bolaget som sålde in i den, och levererade
sedan datan till plattformen som citerar deras uppsats.

**Hela den registrerade externa finansieringen är omkring 113 000 dollar**,
tre Form D hos SEC: 59 dollar 2015, 69 000 i lån 2017, 43 588 i eget kapital
2017. Ingen riskkapitalrunda någonsin. Bolaget skrev själva upprepade gånger
på Hacker News att de var lönsamma, ägda av de anställda och utan externa
ägare, med "lönsamma sedan 2018" 2021. Ungefär femton anställda vid
försäljningen.

**Det är den viktigaste enskilda uppgiften i hela genomgången.** Affären
byggdes av ett femtonmannabolag på hundratusen dollar. Det är en storlek som
är nåbar.

### 11.2 Priset var publikt en gång, och det är fyra dollar

Från deras egen prissida, arkiverad 18 januari 2016:

> "We charge $4 per month for the first 100 facilities, and it gets cheaper
> from there." Och: "Hazel only charges for facilities we cover, so you don't
> pay for any restaurant outside of our data coverage area."

**Fyra dollar per anläggning och månad, alltså 48 dollar per plats och år**,
med mängdrabatt, och betalning bara för de anläggningar de faktiskt täcker.
Vid de 100 000 platser de senare påstod sig täcka blir det omkring fem
miljoner dollar i årlig återkommande intäkt på 2016 års listpris, vilket
stämmer med ett lönsamt femtonmannabolag.

Prissidan i december 2021 har inga tal alls, bara tre produkter med "Contact
Sales" och "Request a Demo". **Resan är alltså transparent självbetjäning 2016
till offertaffär 2021 till offertaffär under Ecolab i dag.**

### 11.3 Köpeskillingen går inte att få fram, men den går att avgränsa

Ecolab skriver "no additional transaction terms will be disclosed", och ordet
Hazel förekommer noll gånger i deras 10-K för 2023 och 2024. Sökning i hela
EDGAR ger fem träffar på namnet, tre egna Form D och två Yelp-filningar, och
noll från Ecolab.

Tre inramningar ur Ecolabs egna rapporter:
- Första halvåret 2023 betalade de **105 miljoner dollar** för förvärv netto,
  och första kvartalet hade noll. Alla tre förvärv under andra kvartalet ryms
  alltså i det talet.
- Av dem namnger de bara Chemlink. Hazel är en av **två "immateriella"**
  förvärv de inte tycker är värda att nämna.
- Goodwill som lades till segmentet under året: 39,3 miljoner, återigen för
  alla tre.

**Den som anger ett pris för Hazel gissar.** Det försvarbara påståendet är att
det var ett av två oväsentliga förvärv i ett kvartal på omkring 105 miljoner,
gjort av ett bolag som tagit in 113 000 dollar.

**Och det var ingen budgivning.** Ecolab var Hazels exklusiva världsomspännande
kanal sedan 2017 och lanserade produkten under eget varumärke i maj 2018 utan
att nämna Hazel alls. De köpte alltså ut sin enda leverantör efter sex år som
återförsäljare. Varumärket HDI är fem år äldre än förvärvet.

### 11.4 Två betyg på samma data, och det är etikavsnittets kärna

Det här är fyndet som hör hemma i avsnitt 6 om intressekonflikten.

**Det interna "Hazel Score" är en percentil.** Ur deras egen produktblad:
antalet avvikelser viktas, kritiska och ovanliga tyngre, alla inspektioner i
en jurisdiktion rangordnas, och var och en får en percentilplacering noll till
hundra. Motiveringen är att myndighetens egna betyg är för milda: över nittio
procent av inspektionerna i Los Angeles får A, och över nittio procent av
poängen i de jurisdiktioner som använder skalan noll till hundra ligger över
80.

**Det publika betyget på Yelp är något annat.** Ur Ecolabs egen FAQ: antalet
avvikelser räknas, kritiska dubbelt, och summan blir en poäng av hundra, med
tillägget att de ser till att fördelningen i varje jurisdiktion "follows a
fixed distribution that's representative of average health department
behavior" och att de vill undvika att vara "overly harsh or lenient".

Alltså: **konsumenten ser ett medvetet milt absolut tal, den betalande kunden
ser en sträng percentil. Samma underliggande data, två motsatta kalibreringar,
valda för två olika publiker.** Och Hazel skriver själva att deras percentil
inte bör ersätta myndighetens betyg och inte nödvändigtvis bör användas för att
belöna eller bestraffa en restaurangägare.

Det är precis den konflikt avsnitt 6 namnger, och här är den byggd i produkt av
någon som redan sålt bolaget. **Vi ska inte ha två kalibreringar.** Om vi
någonsin visar ett tal för en betalande kund ska det vara samma tal besökaren
ser.

### 11.5 LIVES är kapat, och det gäller vårt eget API-beslut

Räknat i Yelps egen registersida över LIVES-flöden, 2026-08-31: **247
jurisdiktioner listade, 237 levererade av Hazel eller Ecolab HDI, och bara tio
kommuner som fortfarande publicerar ett eget flöde.** Yelp kallar det
fortfarande LIVES.

Standarden togs fram 2013 för att kommuner skulle publicera direkt till en
öppen plattform. Tretton år senare går nittiosex procent av röret genom en
kommersiell mellanhand ägd av ett börsnoterat kemibolag, och myndigheternas
eget deltagande har krympt till tio län. Specifikationen har inte uppdaterats
sedan 2015.

**Följden för `docs/55` och punkt B1:** argumentet "ett etablerat format som
andra redan kan läsa" är svagare än det såg ut. Vi kan låna fältuppsättningen,
för den är genomtänkt och Montreal använder den under CC BY 4.0, men vi går
inte med i ett levande ekosystem. Om vi använder formen ska det stå att vi
lånar den och inte att vi ansluter oss.

### 11.6 Jämförbara priser, för den dag frågan blir vår

| Affär | Datum | Pris | Multipel |
|---|---|---|---|
| Digi International köper Jolt | 2025-08-18 | 145,5 miljoner dollar | omkring 7 gånger årlig återkommande intäkt |
| Veralto köper TraceGains | 2024-10-07 | 350 miljoner dollar | omkring 11,7 gånger omsättning |
| Rentokil köper Steritech | 2015-10-02 | 425 miljoner dollar | omkring 2,8 gånger omsättning |

Och en varning: HDScores, Yelps tidigare leverantör, startades med 20 000
dollar, byggde en databas på över en miljon anläggningar, förlorade
Yelp-avtalet till Hazel 2022 och **lades ned utan att köpas**. Två
självfinansierade bolag konkurrerade om samma enda ankarkund. Det ena såldes
till en strategisk köpare, det andra försvann.

### 11.7 Vad som inte gick att belägga

Köpeskillingen, Hazels omsättning, betalningsriktningen i Yelp-avtalet, Ecolabs
prislista efter 2016, och exakt när de fyra dollarna togs bort från prissidan.
Arkivets uppspelningsservrar svarade 503 under större delen av arbetet, så
ögonblicksbilderna från 2019 och 2020 är olästa. En omgång till när arkivet är
friskt daterar övergången exakt.

### 11.8 Ett prisspår till, och en motsägelse mellan två genomgångar

Två oberoende genomgångar av samma fråga gav olika svar, och skillnaden är
värd att skriva ned innan den blir ett falskt faktum.

**Den andra genomgången skriver att Hazel höll en prissida från 2016 till 2023
och aldrig satte ett tal på den.** Det stämmer inte. Den läste
ögonblicksbilden från september 2022, som mycket riktigt bara har "Contact
Sales". Den första genomgången läste bilden från **18 januari 2016**, som bär
de fyra dollarna ordagrant. Båda har rätt om sin egen bild och fel om den
andras.

**Slutsatsen är alltså den i 11.2 och står fast:** priset var publikt 2016 och
borta 2021. Det som fortfarande är okänt är vilket år det försvann, och
arkivets uppspelning låg nere under båda körningarna.

**Ett publicerat jämförelsepris finns, och det är det närmaste vi kommer.**
RizePoint säljer efterlevnadsprogram per plats och publicerar sina tal öppet:

| Nivå | Platser | Årsvis | Månadsvis |
|---|---:|---:|---:|
| Basic | 20 | gratis | gratis |
| Standard | 100 | 399 dollar i månaden | 459 |
| Growth | 500 | 999 dollar i månaden | 1 149 |
| Growth | 1 000 | 1 999 dollar i månaden | 2 299 |

Det blir omkring **två dollar per plats och månad vid 500 till 1 000 platser**,
alltså 24 dollar per plats och år, och omkring fyra dollar vid hundra platser.
Samma storleksordning som Hazels 2016 års lista, och den bekräftar att fyra
dollar var ett rimligt tal och inte en felläsning.

**Priset för Ecolab HDI är ett belagt negativt.** Inte på leverantörens sajt,
inte hos någon återförsäljarkatalog, inte i någon upphandlingsdatabas, inte i
någon SEC-filning. Behöver någon ett tal måste det komma ur en offert.

**Och ett fynd som säger något om branschen.** Hazels egen sida med
kundberättelser innehöll aldrig en enda kund. Ögonblicksbilden från februari
2023 listar fem poster och samtliga är mediegenomgångar eller akademiska
samarbeten: Star Tribune, Harvard Business Review, ESPN och UCLA Anderson.
Rubriken hade fortfarande platshållartexten "A description here!" kvar. Ett
bolag som byggde exakt vår affär och sålde den till ett börsnoterat kemibolag
körde en kundberättelsesida i åratal utan att sätta en kund på den.

**En fälla i sökningen, för nästa gång:** träffar på "Hazel Analytics" i
upphandlingsdatabaser är nästan uteslutande **Hazel Health**, en
telemedicinleverantör till amerikanska skolor. Namnkrocken ger annars ett
påhittat pris.
