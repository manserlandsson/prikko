# 18. Språkregler för sajten

Reglerna finns för att texten inte ska växa tillbaka. De gäller all synlig
text på sajten: rubriker, ingresser, svarsmeningar, paneler, sidfötter och
meta-beskrivningar.

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

Proveniensen (varifrån uppgifterna kommer, när de hämtades) får stå EN gång
per sida, kort, längst ned eller i en källrad. Aldrig som ett stycke ovanför
innehållet.

## Det som alltid ska finnas kvar

Kortas, men stryks aldrig:

- Replikrätten: verksamheter har rätt att svara, svar publiceras oredigerade.
- Attributionen till OpenStreetMap, Mapillary, Panoramax, Livsmedelsverket
  och Kolada, intill det de gäller.
- Upplysningen att bedömningen är Prikkos och inte kommunens.
- Varningen att kommuner inte går att jämföra med varandra.
- Förbehållet i Uncovered om verksamheter som kan ha upphört.

Metodiksidan och källsidan är undantag från kortningsreglerna: deras uppgift
är att förklara. Men även de ska sakna svammel.

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
