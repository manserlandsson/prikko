# 18. Språkregler för sajten

Reglerna finns för att texten inte ska växa tillbaka. De gäller all synlig
text på sajten: rubriker, ingresser, svarsmeningar, paneler, sidfötter och
meta-beskrivningar. De gäller INTE kodkommentarer. En kommentar ska förklara
mycket och gärna länge; det är brödtexten som ska vara mager.

Ägaren har tagit upp samma sak tre gånger. Tredje gången, 2026-08-05: "kan du
också chilla med så mycket förklaring, och framförallt att det är kommunes
data hela tiden ..... det är tydligt på många ställen vi behöver ej skriva det
HELA tiden." Blir det en fjärde gång är det den här filen som var för mjuk.

## Prikko är avsändaren

Kommunens data är underlaget, men bedömningen, jämförbarheten,
kategoriseringen och utmärkelserna är Prikkos. Skriv därför så att Prikko
gör något: vi bedömer, vi jämför, vi följer upp. Skriv aldrig så att sidan
framstår som kommunens spegel.

- Fel: "Kommunens livsmedelskontroll omfattar 412 restauranger."
- Rätt: "412 restauranger i Uppsala. 310 av de 350 vi kan bedöma fick inga
  anmärkningar vid sin senaste hygienkontroll."

Undantaget är när kommunen faktiskt är subjektet: "kommunen noterade en
avvikelse" är kommunens konstaterande och ska stå så.

## Förklara inte, visa

Ingen ingress som beskriver vad sidan innehåller. Sidan visar det själv.
Ingen metodförklaring mitt i en lista; en kort länk till /metodik/ räcker.
Ratsit, hitta.se och Booli förklarar sig inte heller.

## Proveniensen, en gång och längst ned

Varifrån uppgifterna kommer och när de hämtades får stå **EN gång per sida**,
kort, **längst ned eller i en källrad**. Aldrig i en ingress ovanför det den
handlar om. Står den både i ett sidhuvud och i en fot är det en för mycket, och
det är sidhuvudet som ska bort.

Räkna med sidfoten. Den står på varje sida och bär redan avsändaren,
replikrätten och länkarna till metodiken och källsidan. Ett eget block strax
ovanför som säger samma sak är en dubblett även om det står längst ned. Så föll
grundraden på startsidan.

Startsidan har ingen proveniens alls. Inte i heron, inte under vikningen, inte
i en avslutande rad. Ratsit, hitta.se och Booli leder med handlingen och
objektet; källan står på källsidan.

Undantagen är metodiksidan och källsidan, vars uppgift ÄR att förklara. Även de
ska sakna svammel.

## Ordet "kommunens"

Det är underlaget som är kommunens, och det behöver inte upprepas i varje
stycke. Skriv ut det där påståendet faktiskt är kommunens (kommunen noterade,
kommunens uppföljning, kommunens miljöförvaltning äger uppgiften) och stryk det
överallt annars.

- Fel: "Tre krav, alla ur Uppsala kommuns egna kontrolldata: ..."
- Rätt: "Tre krav: ..."

Nämner en sida redan kommunen i rubriken, i svarsmeningen eller i källraden är
kvoten fylld.

## Skriv inte ut det som står en rad bort

Den vanligaste källan till svammel är inte långa meningar utan upprepning på
kort avstånd. Innan en förklarande mening skrivs: står den redan i rubriken, i
listan under, i notisen ovanför, i sidfoten eller på sidan som länken går till?
Gör den det ska den inte skrivas.

- En InfoTip ska inte räkna upp det som står i listan direkt under den.
- "Rättelsen är inte inskickad" ska inte stå i två notiser efter varandra.
- En avslutande sektion ska inte förklara skillnaden mellan två sidtyper som
  läsaren når via länkarna i samma rad.

## Förklara inte sin egen typografi

"Det här är viktigt nog att stå för sig", "Här står vad vi gör", "Vi vill vara
raka med hur vi ser på det", "Det är hela poängen med tjänsten". Rubriken och
placeringen gör redan det arbetet. Stryk meningen, behåll sakuppgiften.

## Det som alltid ska finnas kvar

Kortas, men stryks aldrig:

- Replikrätten: verksamheter har rätt att svara, svar publiceras oredigerade.
- Attributionen till OpenStreetMap, Mapillary, Panoramax, Livsmedelsverket
  och Kolada, intill det de gäller.
- Upplysningen att bedömningen är Prikkos och inte kommunens.
- Varningen att kommuner inte går att jämföra med varandra.
- Förbehållet i Uncovered om verksamheter som kan ha upphört.
- Allt som är juridiskt nödvändigt på villkors-, integritets- och kakssidorna.
  De blir kortare, aldrig färre.

Kortning betyder att samma sak sägs på färre ord, inte att den flyttas till en
annan sida. En obligatorisk upplysning får däremot stå på det ställe där den
gör mest nytta: replikrätten på matsnusklistan flyttades från sidhuvudet till
avsnittet längst ned, och det är en kortning, inte en strykning.

## Inga långa tankstreck

Skriv om meningen i stället. Gäller sajttext, kodkommentarer och
commit-meddelanden. Punkt, kolon eller en omskrivning gör samma jobb.

## Före och efter

Exempel ur nedskärningen i augusti 2026:

| Var | Före | Efter |
| --- | --- | --- |
| Kommunhubben, ingress | "1 234 verksamheter från Uppsala kommuns livsmedelskontroll, i bokstavsordning. Bedömningen speglar den senaste kontrollen." | "1 234 verksamheter i bokstavsordning, bedömda efter sin senaste hygienkontroll." |
| Kommunhubben, fördjupning | "Räknat ur kommunens egna kontrolluppgifter: vad som brister oftast, vad återbesöken gav och hur mycket av registret kontrollen når." | (struket, sektionen visar det själv) |
| Kategorisidan | "Kommunens livsmedelskontroll omfattar 412 restauranger i Uppsala. Av de 350 som har en kontroll att bedöma fick ..." | "412 restauranger i Uppsala. 310 av de 350 vi kan bedöma fick inga anmärkningar vid sin senaste hygienkontroll, ..." |
| Anmärkningssidan | Källrad med hämtdatum och metodiklänk i ingressen | Samma uppgifter i sidfoten, med "Bedömningen är Prikkos" tillagt |
| Rapportindex | Tre stycken om att talen räknas, inte skrivs, och vad som inte kan stå här | En källrad: underlag, hämtdatum och tre länkar |
| Utmärkelserna | Fyra stycken om varför serielängder inte jämförs, med räkneexempel | Två korta stycken och en länk till metodiken |
| Metodiken, ingress | "Prikko visar kommunernas offentliga livsmedelskontroller. Själva bedömningen är däremot vår egen slutsats, härledd ur kommunens data. Därför publicerar vi hela beräkningen. Du ska kunna kontrollera oss." | "Bedömningen är Prikkos egen slutsats, räknad ur kommunernas offentliga kontrolldata. Här står hela beräkningen, så att du kan kontrollera oss." |

Andra omgången, samma vecka, efter att ägaren tagit upp saken en tredje gång:

| Var | Före | Efter |
| --- | --- | --- |
| Startsidan, grundraden | "Underlaget är kommunernas egna kontrollrapporter, allmänna handlingar. Hela beräkningen är publicerad och verksamheten har rätt att svara." + "Läs metodiken" | (struken helt; sidfoten står en skärmhalva längre ned och säger redan båda sakerna) |
| Matsnusklistan, sidhuvud | "Referat av kommunens kontrolldata, hämtad 5 augusti 2026. Verksamheter kan svara; svar publiceras ordagrant." + två länkar | Bara de två länkarna. Hämtdatum och replikrätt står i avsnittet längst ned |
| Matsnusklistan, urvalet | "Tre krav, alla ur Uppsala kommuns egna kontrolldata: ..." | "Tre krav: ..." |
| Artikelindex, foten | Rubrik plus två stycken om skillnaden mellan artiklar och rapporter | En källrad med förbehållet om frusna tal och fyra länkar |
| Artikelindex, ingress | "Kontrollrapporterna är offentliga, men språket i dem är myndighetens. Här förklarar vi hur kontrollen går till, vad orden betyder och hur siffrorna ska läsas. Varje påstående bär sin källa." | "Kontrollrapporterna är offentliga, men språket i dem är myndighetens. Vi översätter." |
| Rapportmallen, foten | Rubrik plus tre stycken om att talen räknas och inte skrivs | En källrad: underlag, hämtdatum, tre länkar |
| Uncovered, InfoTip | "... Antingen finns ingen publicerad kontroll alls, eller så är den senaste äldre än tre år och säger inget om nuläget." | "Uppdelningen står under talet." Listan under rutan säger redan båda fallen |
| Integritetspolicyn, ingress | Fyra meningar som börjar med varifrån datan kommer och slutar med vad sidan innehåller | Två meningar om när det är personuppgifter |
| Villkoren, ingress | "Prikko är gratis att använda och kräver inget konto. Villkoren nedan beskriver vad tjänsten är, vad den inte är, och vad du kan och inte kan förvänta dig av oss." | "Prikko är gratis att använda och kräver inget konto." |
