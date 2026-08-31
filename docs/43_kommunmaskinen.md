# 43. Kommunmaskinen: grunddatat för 290 begäranden

*Byggt 2026-08-30. Kommundatat är genererat ur källor och går att bygga om med
`python3 pipeline/fetch_kommuner.py`. Juridiken är läst mot lagtext och
publicerade avgöranden, och varje påstående bär sin källa. Det som inte gick
att belägga står som overifierat.*

Dokument 20 byggde kampanjen på myndighetsnivå: 250 mottagare, ett brev var.
Det här dokumentet bygger lagret under, på kommunnivå, och svarar på de fyra
frågor som avgör om maskinen går att veva: vem finns det, vem har en adress,
vad kostar det, och vad står i brevet.

---

## 1. Slutsatsen först

**Maskinen är genomförbar, och den är billigare än vi trodde. Men den
juridiska hävstången vi trodde vi hade finns inte.**

| Fråga | Svar | Var det står |
|---|---|---:|
| Går det att nå alla 290? | Ja. 269 har en funktionsadress läst ur egen webbplats | 3 |
| Hur många brev krävs? | 250, inte 290. 23 myndigheter bär 63 kommuner | 4 |
| Vad kostar ett elektroniskt uttag? | Sannolikt 0 kr. En avgift kräver stöd i beslutad taxa | 5.1 |
| Vad är den verkliga kostnadsrisken? | Att någon skriver ut. 15 000 sidor kostade 30 000 kr 2025 | 5.4 |
| Kan vi kräva maskinläsbart format? | **Nej.** Öppna data-lagen ger ingen sådan rätt | 5.2 |
| Hur snabbt ska de svara? | Samma dag som norm. En vecka är redan sent | 5.5 |
| Har någon gjort det förut? | Ja. En privatperson fick ut data ur 271 kommuner | 5.6 |

Tre saker är nya sedan dokument 20 och forskningsrapporten R11, och två av dem
är obehagliga.

**Det ena obehagliga: formatkravet är dött.** R11 avsnitt 1.4 byggde hela
formatargumentet på att lagen (2022:818) om den offentliga sektorns
tillgängliggörande av data tvingar fram digitalt format. Högsta domstolen sa
nej i NJA 2023 s. 498, och regeringen bekräftade den tolkningen i prop.
2023/24:73 med orden att tryckfrihetsförordningen "inte kommer att grunda någon
rätt för enskilda att få tillgång till data för vidareutnyttjande". HD
tillämpade den igen i juni 2025. Det finns dessutom ingen väg att överklaga en
formatvägran: har man fått handlingen på papper har man fått sin rätt enligt
tryckfrihetsförordningen, och talerätten är slut (NJA 2020 s. 717 p. 13).

Meningen om öppna data-lagen ska ändå stå kvar i brevet, för den kostar
ingenting och bär fristen, den skriftliga beslutsplikten och avgiftstaket. Men
den ska aldrig mer beskrivas internt som lösningen på formatfrågan.
Formatfrågan har ingen juridisk lösning i Sverige i dag. Den har bara en social
lösning: gör det så lätt att skicka filen att ingen kommer på tanken att
skriva ut.

**Det andra obehagliga: pappersrisken ligger i första brevet, inte i svaret.**
Skinnskattebergs kommun lämnade 2024 ut 15 000 sidor för cirka 30 000 kronor,
och JO kritiserade kommunen för att inte ha varnat i tid (JO dnr 1922-2024).
R11 säger "betala aldrig för papper", vilket är rätt men reaktivt. Spärren
måste stå i första mejlet, och den gör det i lydelsen i avsnitt 7.

**Det uppmuntrande: någon har redan gjort det.** Jens Nylander har sedan 2022
begärt ut leverantörsfakturor ur samtliga kommuner och byggt en databas med 66
miljoner fakturor från 271 kommuner, 18 regioner och 44 myndigheter. Hans egen
sammanfattning är att det i nio fall av tio inte var några problem att få ut
uppgifterna, och att det enda verkligt svåra var att alla levererar i sitt eget
format. Vår planeringssiffra på 60 procents svarsfrekvens i dokument 20 avsnitt
6.1 är alltså sannolikt för pessimistisk. Vi ändrar den inte förrän vi mätt
själva, men vi vet nu åt vilket håll den lutar.

---

## 2. Vad som byggdes

| Fil | Innehåll | Byggs med |
|---|---|---|
| `pipeline/data/kommuner.json` | 290 poster, en per kommun | `pipeline/fetch_kommuner.py` |
| `pipeline/data/kommunregister.csv` | 250 poster, en per kontrollmyndighet | `fetch_kommunregister.py` (fanns) |
| `pipeline/data/kommunkontakter.csv` | Handskrivna, verifierade mottagare | För hand (fanns) |

De två filnivåerna beskriver samma verklighet ur var sitt håll. Ett brev går
till en myndighet, så registret är rätt enhet när brev skrivs. En besökare bor
i en kommun, så `kommuner.json` är rätt enhet när täckning mäts och när sajten
ska svara på en fråga om en viss ort. Kopplingen mellan dem är kolumnen
`kommunkoder` i registret.

Varje fält i `kommuner.json` bär sin egen källa i objektet `kallor`. Det är med
avsikt omständligt. En adresslista där man inte kan se vilket fält som är läst
och vilket som är härlett blir obrukbar efter tre månader, för då minns ingen.

---

## 3. Kommunerna, och hur listan verifierades

### 3.1 Grinden är att talet ska bli 290

| Mått | Tal | Källa |
|---|---:|---|
| Kommuner | 290 | Kolada `/v3/municipality`, typ `K` |
| Län | 21 | Kommunkodens två första siffror |
| Invånare i riket | 10 605 520 | Kolada N01951 för 2025, ursprung SCB |
| Kommuner med webbplats | 290 | Wikidata P856 |
| Största kommun | Stockholm, 999 239 | Kolada N01951 |
| Minsta kommun | Dorotea, 2 241 | Kolada N01951 |

Kolada är grinden. Bygget avbryter om listan inte är exakt 290, för en
adresslista som tyst tappat en kommun är värre än ingen lista.

**Länet härleds men gissas inte.** Kommunkodens två första siffror är
länskoden, vilket är SCB:s egen konstruktion. Härledningen kontrolleras vid
varje körning mot Wikidatas egen länstillhörighet per kommun, och körningen
stannar om ett prefix pekar på fler än ett län. Vid bygget gav de 290
kommunkoderna exakt 21 län utan en enda konflikt.

**Webbplatsen har två oberoende källor.** Wikidata P856 gav webbplats för
samtliga 290. Den svenska instansen av Alaveteli, handlingar.se, publicerar en
lista över 2 478 svenska myndigheter med hemsida, och 150 av dem gick att para
med en kommun på namn. Av de 150 var 146 exakt överens med Wikidata. De fyra
som skilde sig gällde underadress eller alternativ värd, till exempel
`motala.se` mot `motala.se/kommun`, alltså ingen egentlig motsägelse. Två
källor som är överens i 97 procent av fallen är gott nog.

Wikidata bär även historiska kommunkoder, till exempel Skövdes 1683 vid sidan
av dagens 1496. Därför filtreras allt mot Koladas 290.

### 3.2 E-postadresserna är lästa, inte gissade

Nästan varje svensk kommun kan nås på `kommun@<namn>.se`. Mönstret stämmer
ofta, och det är ändå oanvändbart: de gånger det inte stämmer syns inte, och
ett brev till en död adress ser för avsändaren likadant ut som ett brev ingen
svarat på än. Därför läses varje adress ur kommunens egen webbplats, och varje
adress bär den URL den lästes på.

Krypningen hämtar startsidan, följer länkar som ser ut att leda till
kontaktuppgifter eller till livsmedels- och miljösidor, och plockar ut
adresser på kommunens egen domän. Den läser inga formulär, fyller inte i något
och rör ingen e-tjänst.

| Bästa adress per kommun | Kommuner | Andel |
|---|---:|---:|
| Verifierad för hand sedan tidigare | 48 | 16,6 % |
| Förbundets egen adress | 6 | 2,1 % |
| Miljöförvaltningen eller motsvarande | 48 | 16,6 % |
| Kommunens allmänna adress eller registrator | 167 | 57,6 % |
| Bara en adress vi inte kan bedöma | 1 | 0,3 % |
| **Ingen adress alls** | **20** | **6,9 %** |
| **Användbar funktionsadress** | **269** | **92,8 %** |

En miljöadress går rakt till nämnden som äger livsmedelskontrollen. En allmän
adress går till registrator, som är en fullgod mottagare enligt
tryckfrihetsförordningen men kostar ett internt steg. Bägge duger, den första
är snabbare.

De 48 raderna högst upp i tabellen är de 33 myndigheter som redan står i
`kommunkontakter.csv`, lästa fram för hand enligt dokument 20 avsnitt 2.3. De
bär 36,4 procent av rikets invånare, vilket är skälet att de gjordes först.
Krypningen ersätter dem inte, den lägger till en adress för de 222 kommuner
ingen hunnit läsa.

**De 20 utan adress** är Stockholm, Lidingö, Enköping, Gnosjö, Värnamo,
Högsby, Ängelholm, Falkenberg, Herrljunga, Mariestad, Munkfors, Årjäng, Sunne,
Mora, Gävle, Ånge, Nordmaling, Storuman, Pajala och Gällivare. De flesta av dem
bygger kontaktsidan med skript, eller anvisar bara ett formulär. De ska läsas
fram för hand och skrivas in i `kommunkontakter.csv` med datum och källa, precis
som de 48 som redan står där. Gävle är sedan tidigare känt som ett fall där
adressen inte gick att belägga alls.

**Två saker kastas medvetet bort.** Adresser som ser ut som en persons namn,
till exempel `anna.svensson@kommun.se`, plockas bort helt: en framställan ska gå
till en funktion och inte till en handläggare som kan ha slutat, och adressen är
dessutom en personuppgift vi inte har anledning att spara. Platshållare som
`fornamn.efternamn@kommun.se`, som kommunerna skriver ut för att förklara sitt
eget adressmönster, kastas av samma skäl som en död länk kastas.

---

## 4. Förbunden, som är de billigaste vinsterna

**23 kontrollmyndigheter är gemensamma för flera kommuner. De bär 63 kommuner,
och de sparar 40 brev.**

| Mått | Tal |
|---|---:|
| Kontrollmyndigheter i riket | 250 |
| Varav gemensamma för flera kommuner | 23 |
| Kommuner som täcks av dessa 23 | 63 |
| **Brev vi slipper skriva** | **40** |
| Invånare i de 63 kommunerna | 935 136 (8,8 %) |
| Anläggningar hos de 23 myndigheterna | 9 479 (10,2 %) |

Ett svar från Miljösamverkan östra Skaraborg ger sex kommuner. Ett svar från
Söderåsens miljöförbund ger fyra. Räknat i anläggningar per brev är förbunden
den bästa affären i hela kampanjen efter storstäderna.

### 4.1 De sju som är verifierade mot förbundets egen webbplats

Medlemskretsen i registret är härledd ur Livsmedelsverkets rapport för 2024 och
kan alltså vara ett par år gammal. De sju största lästes därför om mot
förbundens egna sidor 2026-08-30, och adresserna nedan är hämtade samma dag.

| Förbund | Medlemmar | E-post | Källa |
|---|---:|---|---|
| Miljösamverkan östra Skaraborg | 6 | info@miljoskaraborg.se | miljoskaraborg.se/vara-medlemskommuner/ |
| Söderåsens miljöförbund | 4 | info@smfo.se | smfo.se |
| Dalslands miljö- och energiförbund | 4 | kansli@dalsland.se | dalsland.se |
| Ystad-Österlenregionens miljöförbund | 3 | exp@ystadosterlenmiljo.se | ystadosterlenmiljo.se |
| Miljöförbundet Blekinge Väst | 3 | miljokontoret@miljovast.se | miljovast.se |
| Västra Gästriklands samhällsbyggnadsnämnd | 3 | vgs@sandviken.se | sandviken.se/vgs |
| Västra Mälardalens Myndighetsförbund | 2 | arboga.kommun@arboga.se | vmmf.se |

Samtliga sju bekräftade den medlemskrets registret redan hade. Det gäller även
Essunga, som blev sjätte medlem i Miljösamverkan östra Skaraborg 2026-01-01 och
som rapporten för 2024 alltså inte kände till. Registret var redan rättat på den
punkten och rättelsen höll.

**Södertörns upplösning bekräftades i förbigående.** smohf.se, som var
Södertörns miljö- och hälsoskyddsförbunds adress, visar i dag kontaktuppgifter
till Haninge, Tyresö och Nynäshamn var för sig. Det bekräftar dokument 20
avsnitt 2.4 ur förbundets egen webbplats, och ger dessutom de tre adresserna.

### 4.2 De sexton övriga

De återstående sexton gemensamma myndigheterna står i registret men är inte
omlästa mot egna sidor. De bär 38 kommuner tillsammans. Ingen av dem är större
än fyra medlemmar och de flesta är två. De ska verifieras innan brev går, av
samma skäl som alla adresser ska det: en medlemskrets är färskvara.

Två av dem har dessutom stympade namn i registret, ett arv från att
Livsmedelsverkets PDF-tabell bryter långa namn över flera rader:
"byggnadsnämnd Norberg Fagersta Avesta" och "och räddningsnämnd Nordanstig
Hudiksvall". De rättas när någon läser fram de riktiga namnen, inte genom att
gissa fram dem.

---

## 5. Vad ett massutlämnande kostar och vad lagen kräver

Underlaget här är läst mot lagtext på rkrattsbaser.gov.se och mot publicerade
avgöranden. Det bygger vidare på `research/R11_utlamnandeplan.md` och rättar
den på en avgörande punkt.

### 5.1 Får en kommun ta betalt för att skicka en fil?

Bara om kommunfullmäktige har beslutat en taxa som uttryckligen omfattar
elektroniskt utlämnande. Rättskedjan har fyra led:

1. **Kommunallagen (2017:725) 2 kap. 5 §.** För tjänster kommunen är *skyldig*
   att tillhandahålla får avgift tas ut "endast om det följer av lag eller annan
   författning". Att lämna ut en allmän handling är en sådan skyldighet.
2. **Tryckfrihetsförordningen 2 kap. 16 §** ger rätt till kopia "mot en
   fastställd avgift". Ordet fastställd bär hela avgiftsrätten: utan fastställd
   avgift finns ingen avgift.
3. **Kommunallagen 2 kap. 6 §**, självkostnadsprincipen, sätter taket.
4. **JO dnr 1149-2015** avgör saken. Kungälvs kommun kritiserades för att ta
   betalt för handlingar utlämnade som PDF. Kommunens taxa hänvisade till
   avgiftsförordningen, som inte innehåller någon fastställd avgift för
   elektronisk form, och kommunen hade inte beslutat något eget. Alltså fanns
   ingen avgift att ta ut.

**Avgiftsförordningen (1992:191) gäller inte kommuner alls.** Dess 1 a § säger
att förordningen gäller "för myndigheter under regeringen". Den täcker inte
heller filer: 15 § räknar upp kopia, avskrift och utskrift, alltså analoga
bärare, vilket Kammarrätten i Stockholm bekräftat i mål nr 4805-14. En kommun
som åberopar "50 kronor för tio sidor" har därmed åberopat en statlig förordning
som varken gäller den eller täcker det den gör.

**Läsning på stället är alltid gratis**, utan undantag (TF 2 kap. 15 §).

**Slutsats: räkna med 0 kronor per kommun för ett elektroniskt uttag.**
Stickprov bland publicerade taxor stödjer det. Falun tar ingen avgift för
handlingar som skickas med e-post upp till nio sidor, och Västervik Miljö och
Energi har de första 24 filerna gratis.

### 5.2 Kan vi kräva maskinläsbart format? Nej.

Detta är dokumentets viktigaste fynd och det ogiltigförklarar R11 avsnitt 1.4.

Utskriftsundantaget i TF 2 kap. 16 § betyder att en myndighet inte är skyldig
att lämna ut i elektronisk form. R11 antog att lagen (2022:818) om
tillgängliggörande av data upphävde det undantaget vid vidareutnyttjande. Den
gör inte det.

- **NJA 2023 s. 498.** Högsta domstolen uttalade att öppna data-lagen inte
  påverkar den begränsning som följer av utskriftsundantaget. Kroken är lagens
  egen 1 kap. 2 §, som säger att lagen inte påverkar bestämmelser i annan lag
  som begränsar rätten att få tillgång till data.
- **Prop. 2023/24:73.** Regeringen refererar domen och konstaterar att det "i
  praktiken" innebär att tryckfrihetsförordningen inte grundar någon rätt till
  data för vidareutnyttjande. Digg frågade regeringen om tolkningen stämde med
  lagstiftarens avsikt. Svaret blev alltså ja.
- **HD dnr HDO 2025/282**, 9 juni 2025. Tillämpat igen.
- **NJA 2020 s. 717 p. 13.** Det finns ingen rätt till domstolsprövning för den
  som vägrats digitalt utlämnande.

**Vad detta ändrar i praktiken.** Överklaga aldrig ett format, bara ett avslag.
Behåll öppna data-meningen i brevet, men för fristen och avgiftstakets skull.
Och lägg energin på att göra filen lätt att skicka i stället för på att hävda en
rätt som inte finns.

### 5.3 Den andra risken: att uttaget inte anses vara en allmän handling

**TF 2 kap. 6 § andra stycket.** En sammanställning ur en databas är förvarad
hos myndigheten bara om den kan göras tillgänglig "med rutinbetonade åtgärder".

- **HFD 2015 ref. 25.** Fyra till sex timmars arbete inklusive programmering
  går utöver en begränsad arbetsinsats. Inte allmän handling.
- **HFD 2025 not. 20**, mål 620-25. Skarpare än väntat: att räkna fram åldern på
  fem anställda ur födelsedatum som redan fanns i systemet var inte rutinbetonat.
  Matematiska beräkningar räknas inte som rutinbetonade åtgärder.

**Följden för brevet är konkret: be aldrig om beräknade eller härledda värden.**
Inte "antal kontroller per verksamhet", inte "andel avvikelser", inte
"verksamheter med kvarstående brister". Be om råposter och räkna själva. R11:s
fältlista klarar redan detta, men nu finns ett uttryckligt rättsligt skäl.

**Motvikten är användbar.** Kammarrätten i Jönköping upphävde 2021-03-13 sex
avslag i rad därför att myndigheterna inte konkret angett hur mycket arbete som
krävdes. Ett svepande "det kräver mer än rutinbetonade åtgärder" utan
tidsuppskattning är alltså angripbart. Be då vänligt om en uppskattning i
timmar. Frågan är hövlig, rättsligt relevant, och brukar avsluta invändningen på
ett av två sätt.

**Att begäran är stor är inget avslagsskäl.** Ds 2017:37 avvisade uttryckligen
att begränsa insynsrätten på grund av volym, frekvens eller resursåtgång.

### 5.4 Sekretess, och den kostnadsrisk som är verklig

**Huvudregeln är offentlighet.** OSL 30 kap. 27 § andra stycket undantar
uttryckligen kommunal miljö- och hälsoskyddstillsyn från affärssekretess när
allmänintresset av kännedom om hälsa, miljö eller redlighet i handeln har sådan
vikt att uppgiften bör lämnas ut. Lagstiftaren har sagt samma sak rakt ut: en
inspektionsrapport är en allmän handling när den är färdigställd och expedierad,
och en konsument kan begära att få se den oavsett kommun (prop. 2005/06:214).

**Ett fynd som stärker genvägen via Livsmedelsverket.** Samma allmänintresseundantag gäller mot Livsmedelsverket, genom offentlighets- och
sekretessförordningen (2009:641) 9 § och bilagan punkt 28, som dessutom slår
fast att sekretessen "gäller inte beslut i ärenden". Genväg B i R11 avsnitt 2.4
är alltså juridiskt starkare än R11 antog.

**Det troliga motståndet är inte avslag utan förbehåll.** NJA 2025 s. 123
lämnade ut ett större antal brottmålsdomar men med förbehåll enligt TF 2 kap.
19 §, trots grundlagsskydd hos mottagaren. Kolumnen `villkor` i spårningen ska
därför vara obligatorisk och inte något man fyller i om man kommer på det. Ett
förbehåll måste synas före publicering, inte efter.

**Den verkliga kostnadsrisken är papper.** JO dnr 1922-2024, Skinnskattebergs
kommun, 11 april 2025: en reporter begärde fakturor, kommunen lämnade ut drygt
15 000 sidor för cirka 30 000 kronor, och JO kritiserade kommunen för att inte
ha varnat om att avgiften kunde bli mycket hög. **Det är den enda posten i hela
kalkylen som kan bli fyrsiffrig, och den är helt undvikbar.** Därför står
papperspärren i första stycket av lydelsen i avsnitt 7 och inte i en påminnelse.

### 5.5 Vad "skyndsamt" betyder i praktiken

TF 2 kap. 16 § tredje stycket: en begäran om kopia "ska behandlas skyndsamt".
JO:s norm är att besked normalt bör lämnas samma dag, att någon eller några
dagars fördröjning kan godtas om det behövs för att ta ställning, och att
ytterligare dröjsmål kan vara ofrånkomligt vid omfattande material.

Ett mätvärde från 2025 sätter nivån. I JO dnr 3911-2024 hade ett sjukhus ett
internt mål att hantera beställningar inom en vecka. JO konstaterade att **även
det målet var för lågt satt**. En vecka är alltså inte en frist, det är redan
sent.

| Grund | Frist | Överklagas till |
|---|---|---|
| TF 2 kap. 16 § | Skyndsamt, i praktiken samma dag till några dagar | Kammarrätten, prövas skyndsamt |
| Öppna data-lagen 5 kap. 1 § | Fyra veckor, förlängning fyra veckor vid omfattande begäran | Förvaltningsrätten |

Vägen till ett överklagbart beslut går genom OSL 6 kap. 3 §: begär att frågan
hänskjuts till myndigheten och att ett skriftligt beslut med besvärshänvisning
meddelas. Utan skriftligt myndighetsbeslut finns ingenting att överklaga.
Överklagandet är avgiftsfritt och kräver inget ombud.

**En kommun får inte parkera vår begäran för att den är stor.**

**RÄTTAD KÄLLA 2026-08-31.** Här stod diarienumret JO dnr 384-2025, och det
går inte att belägga hos JO. Rättssatsen står kvar, den bärs bara av ett annat
beslut: **JO dnr 5301-2019**, meddelat 22 oktober 2020. Se
`docs/50_begar_ut_kontrollen.md` §10, där hela kontrollen av lagrummen i det
här avsnittet är gjord om.

Innebörden är densamma. Skyndsamhetskravet gäller i varje enskilt ärende, och
att myndigheten samtidigt handlägger andra utlämnandeärenden är inte ett skäl
att låta vårt vänta.

### 5.6 De får inte fråga vilka vi är

Efterforskningsförbudet i TF 2 kap. 18 § är starkare än vi trott, och det är
värt att känna till vid en tredje påminnelse.

- **JO dnr 3837-2022.** En tingsrätt frågade om den sökande hade utgivningsbevis
  inför ett e-postutlämnande. Kritik.
- **JO dnr 2762-2024**, Vännäs kommun, 28 februari 2025. Kommunen bad den
  sökande beskriva sin roll och vilket "stöd eller auktorisering" han hade.
  Kritik.
- **JO dnr 10735-2024**, Kristinehamns kommun, 10 juni 2025. Kritik för att
  hänvisa allmänheten till en e-tjänst som krävde e-legitimering, utformad så
  att andra kontaktvägar hamnade i skymundan.

Att vi frivilligt berättar vilka vi är och vad datan ska användas till är
fortfarande rätt strategi, och det underlättar prövningen. Men kommunen får inte
kräva det som villkor, och vi är aldrig skyldiga att använda en e-tjänst.

---

## 6. Ärendesystemen

Under huven kör kommunerna tre system: **Ecos** (Sokigo), **EDP Vision**
(Vertigis) och **Castor** (Prosona). Vilket system en kommun kör avgör hur
svaret ser ut när det kommer, och därmed hur många läsare `sources/levererad.py`
behöver.

**Kartläggningen är i dag tom, och det är ett resultat och inte en lucka.**
Fältet `verksamhetssystem` finns i både `kommuner.json` och
`kommunregister.csv` och står tomt för samtliga 290 kommuner, eftersom
ingenting gick att belägga.

Skälet är att leverantörerna inte publicerar sina kundlistor. Sokigos egen
produktsida för Ecos beskriver funktionerna men nämner inte en enda kommun, och
uppger varken kundantal eller exportformat. Det är den normala bilden i
branschen: systemen upphandlas, och referenserna ligger i anbud och inte på
webben.

Det finns två spår som ändå fungerar, och de är olika dyra:

| Spår | Vad det ger | Kostnad |
|---|---|---|
| **Begäran till Livsmedelsverket (genväg A)** | Systemet för samtliga 250 myndigheter på en gång | Ett mejl |
| Kommunernas registerförteckningar enligt GDPR art. 30 | En kommun i taget, systemnamnet står ofta utskrivet | 290 sökningar |

Andra spåret fungerar men skalar illa. Första spåret är hela svaret: eftersom
myndighetsrapporteringen passerar Livsmedelsverket vet verket vilket system
varje kommun rapporterar ur. Genväg A i R11 är alltså en enda begäran som ger
systemkartan för samtliga 250 myndigheter på en gång. Den kan skickas i dag,
oberoende av sajtens status, och den är fortfarande den billigaste enskilda
åtgärden i hela planen.

Det är också skälet att kartläggningen inte ska drivas vidare för hand. Att
söka fram trettio kommuners system ur registerförteckningar tar en dag och gör
kartan tolv procent färdig. Ett mejl gör den hel.

---

## 7. Lydelsen

Detta är grundlydelsen, den som fungerar mot vilken kommun som helst. Den
generade varianten i `pipeline/begaran.py` lägger till fyra uppgifter som bara
gäller mottagaren: myndighetens namn, samtliga kommuner den svarar för, antalet
anläggningar de själva rapporterat, och vad de publicerar i dag. Använd den
generade när registret räcker till, och den här när den inte gör det.

> **Ämne:** Begäran om utlämnande av allmän handling: livsmedelskontroller
>
> Hej,
>
> jag begär att få ta del av uppgifter om utförd livsmedelskontroll i NN
> kommun, och ber att få dem i elektronisk form.
>
> Det jag ber om är ett uttag ur ert ärendesystem med en rad per utförd kontroll
> de tre senaste åren, med verksamhetens namn, besöksadress, anläggnings- eller
> objektsid, kontrolldatum, typ av kontroll, noterade avvikelser och uppgift om
> verksamheten är aktiv. Jag ber inte om några sammanställda eller uträknade
> tal, bara om uppgifterna som de står. Är det enklare att exportera hela
> beståndet än att avgränsa på datum går det lika bra, vi sorterar själva.
>
> Samma fil som ni lämnar till Livsmedelsverkets myndighetsrapportering fungerar
> utmärkt om den är enklare för er att ta fram.
>
> Format i första hand CSV, XML, JSON eller Excel. **Vi vill inte ha
> papperskopior. Skulle uttaget bli en stor utskrift, hör av er först så
> avgränsar vi begäran i stället.**
>
> Rättslig grund: 2 kap. tryckfrihetsförordningen. Begäran görs samtidigt som en
> begäran om tillgängliggörande av data för vidareutnyttjande enligt lagen
> (2022:818) om den offentliga sektorns tillgängliggörande av data.
>
> Jag begär inga personuppgifter utöver de företagsnamn och besöksadresser som
> redan är offentliga. Dricksvattenanläggningar kan lämnas utanför.
>
> Avser ni att ta ut en avgift ber jag er meddela beloppet innan uttaget görs,
> så tar jag ställning först. Kan någon del inte lämnas ut ber jag om ett
> skriftligt beslut med besvärshänvisning.
>
> Uppgifterna publiceras på prikko.se med er kommun angiven som källa och med
> kontrolldatum. Varje verksamhet kan publicera ett eget svar intill sin
> kontroll, och vi rättar fel så snart de påtalas.
>
> Hör gärna av er om något är oklart eller om uttaget blir omfattande, så
> avgränsar vi det tillsammans.
>
> Med vänlig hälsning
> Måns Erlandsson
> Magoed AB, org.nr 559386-1015
> prikko.se

### 7.1 Varför varje stycke står där det står

| Mening | Varför |
|---|---|
| "i elektronisk form" | Vi ber, vi kräver inte. Rätten finns inte, se 5.2 |
| "inga sammanställda eller uträknade tal" | HFD 2025 not. 20. Beräkningar är inte rutinbetonade åtgärder, se 5.3 |
| "hela beståndet går lika bra" | Ett ofiltrerat uttag är mer rutinbetonat än ett filtrerat |
| "samma fil som ni lämnar till Livsmedelsverket" | Den finns redan. En fil som finns kostar ingen arbetsinsats |
| **Papperspärren** | JO dnr 1922-2024. Den dyraste enskilda risken, avväpnad i förväg, se 5.4 |
| Öppna data-lagen | Fristen, beslutsplikten och avgiftstaket. Inte formatet längre |
| "meddela beloppet innan" | Avgiften ska aldrig komma som en överraskning efteråt |
| "skriftligt beslut med besvärshänvisning" | Utan det finns ingenting att överklaga, OSL 6 kap. 3 § |
| Replikrätten och rättelserutinen | Underlättar prövningen enligt OSL 21 kap. 7 §, se 5.4 |

Juridiken och beskrivningen av vad datan ska användas till varieras aldrig
mellan brev. Den är prövad, och myndigheter i samma län läser varandras
handlingar.

---

## 8. Det som inte är verifierat

| Fråga | Läge |
|---|---|
| Verksamhetssystem per kommun | Se avsnitt 6. Löses av genväg A, inte av gissningar |
| Medlemskretsen i 15 av 23 förbund | Härledd ur rapporten för 2024, inte omläst mot egna sidor. Dalslands fyra bekräftades 2026-08-31, se 10.4 |
| Två stympade myndighetsnamn | "byggnadsnämnd Norberg Fagersta Avesta" och "och räddningsnämnd Nordanstig Hudiksvall" |
| 20 kommuner utan adress | Se 3.2. Ska läsas fram för hand |
| Om öppna data-lagens frist och avgiftstak går att åberopa | Lagtexten talar för, HD:s beslut 2025 talar emot. Behåll meningen, förlita er inte på den |
| Statistiksekretess hos Livsmedelsverket (OSL 24 kap. 8 §) | Fortfarande overifierat, som i R11. Bilagans uppdelning talar för R11:s bedömning |
| Om vår begäran bedöms som rutinbetonad | XML-filen som redan tagits fram är trygg. Ett kombinerat filtrerat uttag är det inte |
| Publiceringsstatus för 241 kommuner | Ingen har kontrollerat dem |
| Svarsfrekvens | Okänd. Nylanders nio av tio är en annan sorts begäran, inte vår mätning |

---

## 9. Vad som görs härnäst

1. **Skicka genväg A till Livsmedelsverket.** En begäran, systemkartan för alla
   250 myndigheter. Billigast i hela planen och oberoende av sajtens status.
   `python3 pipeline/begaran.py livsmedelsverket`
2. ~~**Rätta brevmallen efter avsnitt 5.2.**~~ Gjort 2026-08-31, se 10.3.
   Formatkravet är borta ur både `request_letter` och genväg B. R11 avsnitt 1.4
   är fortfarande orättad.
3. ~~**Lägg in papperspärren i `request_letter`.**~~ Gjort 2026-08-31, se 10.3.
   Den står i andra stycket, före listan över vad vi ber om.
4. ~~**Ta bort alla beräknade fält ur det vi ber om.**~~ Gjort 2026-08-31, se
   10.3. Brevet säger nu uttryckligen att vi inte ber om uträknade tal.
5. **Läs fram de 20 saknade adresserna för hand** och skriv in dem i
   `kommunkontakter.csv` med datum och källa.
6. **Verifiera de 15 återstående förbunden** mot deras egna sidor. 34 kommuner,
   och varje bekräftad medlemskrets sparar ett brev. Dalsland är avbetat, se 10.4.
7. **Hör av er till Jens Nylander.** Han har löst exakt det formatproblem vi
   står inför, för 271 kommuner, och han är den enda i landet som har.

---

## 10. Första omgången: ordningen, adresserna och rutinen

*Skrivet 2026-08-31. Ordningen är räknad ur registret, varje adress i omgången
är läst på myndighetens egen webbplats samma dag, och breven ligger färdiga i
`pipeline/data/begaran/`. Ingenting är skickat. Det är ägarens knapp.*

### 10.1 Ordningen: störst först vinner, och det var inte givet

Frågan var vilken ordning som ger flest nya anläggningar per skickat brev.
Svaret är generatorns förval, och skälet är att anläggningstalet i registret
redan är per myndighet. En gemensam nämnds tal rymmer alla medlemskommuner.
Varje brev ger alltså exakt sin myndighets tal, oberoende av de andra breven,
och då är den giriga ordningen optimal för varje prefix: de k största breven
ger mest efter k skickade brev, för alla k.

Förbundsspåret i `docs/45` punkt A3 vinner därför inte den här mätningen. Så
här ser de två ordningarna ut över de sex första breven:

| Ordning | Anläggningar | Per brev | Kommuner | Per brev |
|---|---:|---:|---:|---:|
| Störst först | 13 342 | 2 224 | 11 | 1,8 |
| Förbunden först | 4 092 | 682 | 21 | 3,5 |

**Förbunden ger 3,3 gånger färre anläggningar per brev och nästan dubbelt så
många kommuner per brev.** Vilket som är rätt beror på vad man mäter. Vårt mått
är täckning av anläggningar, alltså sidor på sajten och verksamheter en
besökare kan söka på, och då förlorar förbundsspåret. Förbunden ska läsas som
det `docs/45` faktiskt skriver i A3, att de är billigast per kommun, inte som
en instruktion att skicka dem först. De kommer med ändå på egen förtjänst:
Miljösamverkan östra Skaraborg är fjärde brev och Ystad-Österlen sextonde.

**Södertörn bär inte tio kommuner.** Påståendet i `docs/45` A3 håller inte i
någon del. Förbundet hade tre ägarkommuner, inte tio, och det är avvecklat:
smohf.se skriver 2026-08-31 att verksamheten gick över till Haninge, Tyresö och
Nynäshamn den 1 juli 2026. Den gemensamma myndighet som bär flest kommuner är
Miljösamverkan östra Skaraborg med sex.

### 10.2 De tjugo första breven

| # | Myndighet | Kommuner | Anläggningar | Andel |
|---:|---|---:|---:|---:|
| 1 | Miljöförvaltningen, Göteborgs Stad | 1 | 5 418 | 5,84 % |
| 2 | Miljöförvaltningen, Malmö stad | 1 | 3 150 | 3,40 % |
| 3 | Miljöförvaltningen, Helsingborgs stad | 1 | 1 509 | 1,63 % |
| 4 | Miljösamverkan östra Skaraborg | 6 | 1 105 | 1,19 % |
| 5 | Miljö- och hälsoskyddsförvaltningen i Västerås | 1 | 1 094 | 1,18 % |
| 6 | Bygg- och miljöförvaltningen, Halmstads kommun | 1 | 1 066 | 1,15 % |
| 7 | Samhällsbyggnadsförvaltningen, Lunds kommun | 1 | 1 051 | 1,13 % |
| 8 | Miljö- och byggnämnden, Region Gotland | 1 | 970 | 1,05 % |
| 9 | Miljö- och hälsoskyddsnämnden i Umeå | 1 | 969 | 1,04 % |
| 10 | Miljöförvaltningen, Borås Stad | 1 | 931 | 1,00 % |
| 11 | Räddningstjänst- och tillståndsnämnden i Eskilstuna | 1 | 914 | 0,99 % |
| 12 | Miljönämnden i Södertälje | 1 | 861 | 0,93 % |
| 13 | Miljö- och hälsoskyddsnämnden i Kristianstad | 1 | 829 | 0,89 % |
| 14 | Miljö- och hälsoskyddsnämnden i Solna | 1 | 810 | 0,87 % |
| 15 | Miljönämnden i Sundsvall | 1 | 798 | 0,86 % |
| 16 | Ystad-Österlenregionens miljöförbund | 3 | 785 | 0,85 % |
| 17 | Miljö- och byggnämnden i Växjö | 1 | 747 | 0,81 % |
| 18 | Bygg- och miljönämnden i Norrtälje | 1 | 713 | 0,77 % |
| 19 | Miljö- och hälsoskyddsnämnden i Varberg | 1 | 700 | 0,75 % |
| 20 | Samhällsbyggnadsnämnden i Kalmar | 1 | 697 | 0,75 % |
| | **Summa** | **27** | **25 117** | **27,1 %** |

Besvaras alla tjugo går täckningen från 20,2 procent av rikets anläggningar
till 47,3. Det är en optimistisk räkning, för den förutsätter att alla svarar
och att allt går att läsa in, men storleksordningen är rätt: **tjugo mejl är
värda mer än allt annat som står på entreprenörslistan.**

**Urvalet är litet, och det är begränsningen.** De tjugo är valda ur 34
myndigheter, inte ur 250, eftersom bara 34 har en mottagare som är läst för
hand. De 269 adresserna i `kommuner.json` är krypta och inte verifierade, och
avsnitt 10.4 visar varför skillnaden spelar roll. Att läsa fram de återstående
216 är det enskilt största arbetet som står mellan oss och full täckning.

**En blind fläck i ordningen.** Haninge, Tyresö och Nynäshamn saknar
anläggningstal, eftersom Södertörns 1 087 anläggningar i rapporten för 2024
inte går att dela upp på de tre. De sorteras därför som noll och hamnar sist,
trots att de rimligen hör hemma runt plats 25. Talet ska hämtas ur nästa
rapport eller frågas efter i brevet.

### 10.3 Vad brevet inte längre säger

Generatorns brev hade båda de spärrar som avsnitt 5.2 och 5.4 kräver saknade
eller brutna. Det som ändrades:

| Vad | Före | Nu | Varför |
|---|---|---|---|
| Papperspärren | Fanns inte alls, och brevet erbjöd PDF utan förbehåll | Andra stycket, före listan över vad vi ber om | JO dnr 1922-2024, se 5.4. Enda posten som kan bli fyrsiffrig |
| Formatkravet | "enligt lagen (2022:818) ..., och jag ber därför att uppgifterna lämnas i befintligt digitalt format" | Öppna data-meningen står kvar, ordet "därför" och kravet är borta | NJA 2023 s. 498 och prop. 2023/24:73, se 5.2. Lagen bär inte formatet |
| Uträknade tal | Brevet bad inte om dem, men sa det inte heller | "Jag ber inte om några sammanställda eller uträknade tal, bara om uppgifterna som de står" | HFD 2025 not. 20, se 5.3 |
| Överklagbarheten | Saknades | "Kan någon del inte lämnas ut ber jag om ett skriftligt beslut med besvärshänvisning" | OSL 6 kap. 3 §, läst mot lagtext 2026-08-31 |
| Antalet kommuner | Hårdkodat "tolv" | Räknas ur registret, blev tretton | Siffran hade redan hunnit bli fel |
| Kopieadressen | "Kopia" skrevs ut även när den var samma adress som "Till" | Skrivs bara när den skiljer sig | Två mejl till samma brevlåda ser slarvigt ut |

Samma formatpåstående stod i genväg B till Livsmedelsverket och är borttaget
där också. Genväg B har dessutom fått papperspärren, för den begäran är den
största av alla.

**De tre rättsliga spärrarna är nu tester.** `TestSparrar` i
`pipeline/tests/test_begaran.py` faller om brevet börjar kräva ett format, om
papperspärren hamnar under listan över vad vi ber om, eller om någon börjar be
om andelar och genomsnitt. En spärr som bara står som en kommentar kommer
tillbaka nästa gång någon skriver om en mening.

### 10.4 Adresserna: tjugo lästa en och en, och en var fel

Varje mottagare i omgången är läst på myndighetens egen webbplats 2026-08-31.
**Nitton av tjugo stämde. En var fel.**

**Norrtälje pekade på fel myndighet.** I registret stod
`miljokontoret@srmh.se`, och källan var `vaxholm.se`, alltså en annan
myndighets sida. Södra Roslagens miljö- och hälsoskyddsnämnd är gemensam nämnd
för Täby och Vaxholm, och i Norrtälje utövar kontoret bara tillsyn enligt
alkohol- och tobakslagen och kontroll av vissa receptfria läkemedel, inte
livsmedelskontroll (taby.se om SRMH, läst 2026-08-31). Registret motsade
dessutom sig självt: anteckningen på raden för SRMH sa redan att begäran ska gå
till kommunens egen nämnd. Norrtälje publicerar ingen egen adress till bygg-
och miljökontoret, så mottagaren är nu `kontaktcenter@norrtalje.se`, läst på
norrtalje.se.

Tre ändringar till gjordes utanför de tjugo:

- **Nacka** flyttades från `info@nacka.se` till `registrator@nacka.se`. Nackas
  egen kontaktsida skriver att begäran om allmänna handlingar ska gå dit. Den
  gamla adressen var inte fel, den var bara sämre än den kommunen själv anvisar.
- **Dalslands miljö- och energiförbund** och **Västra Mälardalens
  Myndighetsförbund** fick de adresser som stod verifierade i avsnitt 4.1 men
  aldrig hade skrivits in i kontaktfilen. Båda hade dessutom avhuggna namn i
  registret, och namnen är nu lästa ur förbundens egna sidor. De två breven
  hamnar på plats 30 och 33 och är alltså inte med i den här omgången, men de
  finns nu att skicka.

**Tre adresser i omgången är svagare än de andra, och det är inga fel.**
Halmstad och Kristianstad publicerar ingen egen adress till förvaltningen alls,
bara kommunens allmänna, och Solnas adress är den som anvisas för att begära ut
handlingar i bygglovsärenden medan livsmedelskontrollen ligger hos en annan
nämnd. Alla tre är fullgoda mottagare enligt tryckfrihetsförordningen, de
kostar bara ett internt steg. Det står i anteckningsfältet på respektive rad.

**Vad felprocenten betyder för resten av landet.** En på tjugo var fel bland de
adresser som lästs fram för hand. De 269 krypta adresserna i `kommuner.json` är
lästa av ett skript som inte kan se skillnad på en myndighets sida och en
grannmyndighets, vilket är precis det fel Norrtälje var. Räkna alltså inte med
att de är bättre än de handlästa, räkna med att de är sämre, och läs varje
adress innan brevet går.

### 10.5 Rutinen när svaren kommer

All spårning ligger i `pipeline/data/utlamnanden.csv`, en rad per myndighet.
Generatorn skriver raden när brevet skrivs och sätter `utfall` till `utkast`.
Allt därefter fylls i för hand, och det är med avsikt: ett svar ska läsas av en
människa innan det bokförs.

**Varje dag ett brev går:** skriv datum i `skickat` och sätt `utfall` till
`vantar`. Kommer ett diarienummer i mottagningsbekräftelsen, skriv in det i
`diarienummer`. Det numret gör att påminnelsen hamnar i rätt ärende hos dem i
stället för att bli ett nytt.

**Varannan dag:** `python3 pipeline/begaran.py status`. Den skriver täckningen,
antalet ärenden per utfall, och vem som behöver följas upp i dag. Kommandot
läser bara filerna och skickar ingenting.

**Schemat, räknat från `skickat`:**

| Dag | Åtgärd | Kommando |
|---:|---|---|
| 7 | Vänlig påminnelse i samma tråd | `paminnelse KOD --steg 7` |
| 21 | Fyraveckorsfristen i 5 kap. 1 § öppna data-lagen | `paminnelse KOD --steg 21` |
| 30 | Begär skriftligt beslut enligt 5 kap. 2 § och myndighetens prövning enligt OSL 6 kap. 3 § | `paminnelse KOD --steg 30` |
| 45 | Beslutspunkt: överklaga eller lägg åt sidan | inget brev |

Steg 45 skriver samma text som steg 30, och skriptet säger till om det. Skicka
det bara om steg 30 aldrig gick i väg. Att mejla samma påminnelse två gånger är
sämre än tystnad.

`status` hoppar över den som redan svarat, och den påminner aldrig två gånger
inom en vecka. Skriv därför in datum i `paminnelse_1` och `paminnelse_2` när
en påminnelse går, annars fortsätter samma rad att dyka upp.

**Vad varje sorts svar betyder:**

| Svar | `utfall` | Vad som görs |
|---|---|---|
| Filen kom, allt vi bad om | `komplett` | Fyll i `format`, `omfattning`, `period_fran`, `period_till` och `fil`. Sedan bygger vi inläsaren |
| Något kom, inte allt | `delvis` | Samma, och skriv i `anteckning` vad som fattas. Fråga efter resten i samma tråd |
| De frågar något | `dialog` | Svara samma dag. En fråga är en handläggare som vill lösa det |
| De vill ha betalt först | `avgiftskrav` | Skriv beloppet i `avgift_kr` och sätt `avgift_status`. Se 5.1: en avgift kräver en beslutad taxa som omfattar elektroniskt utlämnande. Betala aldrig för en utskrift |
| Nej | `avslag` | Har vi ett skriftligt beslut med besvärshänvisning? Utan det finns inget att överklaga, begär det då först |
| De pekar vidare | `hanvisad` | Notera vart, och lägg raden åt sidan tills genvägen är prövad |

**Kolumnen `villkor` är obligatorisk och inte valfri.** Kommer materialet med
ett förbehåll enligt TF 2 kap. 19 § ska det stå där innan något publiceras. Se
5.4 om NJA 2025 s. 123: det troliga motståndet är inte avslag utan förbehåll,
och ett förbehåll som upptäcks efter publicering är upptäckt för sent.

### 10.6 Det som fortfarande inte är gjort

| Fråga | Läge |
|---|---|
| Verifierad mottagare för 216 av 250 myndigheter | Största arbetet som återstår. Krypningens adresser räcker inte, se 10.4 |
| Anläggningstal för Haninge, Tyresö och Nynäshamn | Går inte att dela ur rapporten för 2024. Ordningen är blind för dem tills talet finns |
| Medlemskretsen i 15 av 23 gemensamma myndigheter | Dalslands fyra medlemmar bekräftades 2026-08-31. Västra Mälardalens egen sajt räknar inte upp sina medlemmar, så den raden vilar fortfarande på rapporten |
| Om brevlådan i signaturen tar emot post | Okänt. `SENDER_EMAIL` står tom i koden med avsikt, och steg 0 i följesedeln är att skicka ett testmejl enligt `docs/13` |
| Året för Skinnskattebergsutlämnandet | Avsnitt 1 i det här dokumentet skriver 2024 och avsnitt 5.4 skriver att JO:s beslut kom 11 april 2025. Rättssatsen berörs inte, men årtalet ska läsas om mot JO dnr 1922-2024 |
