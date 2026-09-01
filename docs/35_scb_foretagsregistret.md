# 35. SCB:s allmänna företagsregister som facit på nedlagda verksamheter

**Datum:** 2026-08-18. Alla tal om vårt eget bestånd är körda mot databasen
samma dag. Alla uppgifter om SCB är avlästa ur SCB:s egna sidor och
postbeskrivningar samma dag, och sidorna anges där de citeras.
**Beställning:** verifiera att registret går att använda, bygg valideringen om
den går.
**Utfall:** källan bär, nyckeln saknas, och dörren är stängd med ett handtag
bara ägaren kan vrida. Ingen kod skrevs. Skälen står nedan, med tal.

---

## 1. Slutsatsen först

Tre besked, i den ordning de avgör saken.

1. **Uppgiften finns, på exakt rätt kornighet.** SCB:s allmänna
   företagsregister har ett arbetsställeregister med kommunkod, besöksadress,
   femsiffrig SNI-kod och en statusvariabel som antar värdet `9 Är ej längre
   verksam`, plus ett `Slutdatum` för när arbetsstället avaktiverades.
   Variabeln uppdateras veckovis. Det är ett **positivt** påstående om
   nedläggning, inte en frånvaro, och det är den enda formen som duger för en
   not på en verksamhetssida.

2. **Vi har ingen nyckel att slå upp med.** `organization_number` är ifyllt i
   **0 av 16 106 rader**, i alla tolv kommunerna. Beställningens premiss att
   "vi har organisationsnummer på många rader redan" håller inte. Det är
   samma tal som doc 12 mätte den 3 augusti, 0 av 15 916, och beståndet har
   vuxit med 190 rader sedan dess utan att ett enda organisationsnummer
   tillkommit. Ingen adapter skriver kolumnen, och ingen källa lämnar ut den.

3. **Åtkomsten kräver en ansökan, och det som ska ansökas om byts ut nästa
   månad.** API:et kräver att en namngiven person godkänner användarvillkor
   som inte är publicerade, varefter SCB skickar certifikat och lösenord. Det
   är ägarens åtgärd, inte en agents. Och SCB skriver på samma sida att ett
   nytt API ersätter det nuvarande **i september 2026**, med API-nyckel i
   stället för certifikat, med paginering och med ändrad sökfunktionalitet.
   Att bygga en klient mot det nuvarande kontraktet i augusti är att bygga
   samma sak två gånger.

Punkt 2 är inte ett nej till hela idén. Det är ett nej till uppslag på
organisationsnummer, och det pekar ut den enda kvarvarande vägen: matcha på
kommun, besöksadress och bransch. Punkt 3 är däremot ett tydligt "inte nu".

---

## 2. Vad som är verifierat om källan

### 2.1 Avgiften och grunden

Regeringen ändrade förordningen om det allmänna företagsregistret. Ändringen
trädde i kraft **26 juni 2025** och innebär att SCB inte längre tar ut avgifter
för uppgifter ur registret. SCB har därför tillgängliggjort ett avgiftsfritt
API. Beställningens datum stämmer.

Källa: `scb.se/vara-tjanster/bestall-data-och-statistik/foretagsregistret/avgiftsfria-uppgifter-i-foretagsregistret/`

### 2.2 Vad som ligger i vilken lucka, och varför det avgör allt

Det finns **två** olika avgiftsfria erbjudanden hos SCB, och de blandas lätt
ihop. Skillnaden mellan dem är hela frågan.

**A. Värdefulla datamängder**, gemensam lösning med Bolagsverket, REST-API med
OAuth 2 plus filnedladdning, avgiftsfritt utan avtal enligt EU:s öppna
data-direktiv och genomförandeförordningen `EU 2023/138`. Detta är den öppna
dörren. Men SCB räknar upp precis vad som ingår, och varenda post i listan
ligger på **organisationsnivå**: organisationsnamn, organisationsform,
avregistrerad organisation, avregistreringsorsak, pågående avveckling,
verksam organisation, juridisk form, postadress organisation, registreringsdatum,
SNI-koder organisation, identitetsbeteckning, digitalt inlämnade
årsredovisningar.

**Inget arbetsställe. Ingen CFAR. Ingen besöksadress. Ingen kommunkod.**

Det gör den öppna dörren obrukbar för vårt ändamål av två skäl, inte ett. Dels
saknar vi organisationsnumret som är hela ingången. Dels säger "avregistrerad
organisation" fel sak: ett bolag kan leva vidare medan restaurangen stänger,
och en restaurang kan drivas vidare av ett nytt bolag på samma adress. Ett
bolag som avregistrerats är inte ett bevis för att lokalen är tom.

Källa: `scb.se/.../foretagsregistret/vardefulla-datamangder--grundlaggande-foretagsinformation/`

**B. Allmänna företagsregistrets API**, certifikat och lösenord efter godkända
användarvillkor. Det är här arbetsställena ligger. Det är den enda vägen till
det vi vill veta.

### 2.3 Vad layouten Arbetsställe faktiskt innehåller

Avläst ur `postbeskrivning-arbetsstalle.pdf`, daterad 2025-06-26, och ur
`variabelbeskrivning-api.pdf`. Basutbudet, alltså det alla har tillgång till
utan tilläggsgrupper:

| Fält | Innebörd |
|---|---|
| `CFARNr` | arbetsställets åttasiffriga identitet |
| `PeOrgNr`, `OrgNr` | person- eller organisationsnummer |
| `Företagsnamn`, `Benämning` | bolagets namn och arbetsställets benämning |
| `BesöksAdress`, `BesöksPostOrt` | adressen där arbetsstället är verksamt |
| `PostAdress`, `PostNr`, `PostOrt` | bolagets postadress, ofta redovisningsbyrån |
| `Kommun, kod` | fyrsiffrig kommunkod, uppdateras veckovis |
| `Arbetsställestatus, kod` | `0` har aldrig varit verksam, `1` är verksam, `9` är ej längre verksam |
| `Startdatum`, `Slutdatum` | när arbetsstället aktiverades respektive avaktiverades |
| `Bransch_1` till `Bransch_5` | femsiffriga SNI-koder, huvudbransch först |
| `Stkl, kod` | storleksklass anställda |

Två fält bär hela funktionen: `Arbetsställestatus = 9` och `Slutdatum`.
Tillsammans säger de "det här arbetsstället är inte längre verksamt, sedan det
här datumet", och det är ett påstående med myndighet och datum bakom sig.

`BesöksPostNr` ligger i tilläggsgruppen `TG02BPostNr` och måste beställas
särskilt. Det spelar ingen roll för oss: vi har postnummer på **0 av 16 047**
publicerade rader, så det finns inget att jämföra mot ändå.

### 2.4 Tekniska förutsättningar och deras hållbarhet

- REST över https, json eller xml. Auktorisation via certifikat från SCB.
- Max **2 000 rader per anrop**, **10 anrop per 10 sekunder** per användare.
- Uppdateras varje natt utom natten mellan lördag och söndag. De flesta
  variabler veckovis, andra några gånger per år eller årligen.
- **Ingen historik.** SCB:s egen fråga och svar: "Finns historik med i API:et?
  Nej, det är aktuell information som finns i API:et."
- **Ingen förändringsutdragning.** Vill man ha löpande uppdateringar av en
  population finns en aviseringstjänst, och den kostar pengar.

Takgränserna är inget problem. Ett uttag av alla arbetsställen i SNI 56 per
kommun är någon handfull anrop, och tolv kommuner blir tolv handfullar, en gång
i veckan. Att ta hem hela Stockholm kräver dock att uttaget delas på
femsiffrig SNI eller postort, eftersom 2 000 rader utan paginering annars
kapar svaret.

### 2.5 Kontraktet byts i september 2026

SCB skriver rakt ut på samma sida att ett nytt API lanseras i september 2026,
att det **ersätter** det nuvarande, och att förändringen omfattar:

- certifikat byts mot API-nyckel,
- paginering införs och antalet rader per anrop ökas,
- **sökfunktionaliteten ändras**,
- de sammanslagna layouterna utgår,
- variabler både läggs till och tas bort, och de som utgår är gulmarkerade i
  postbeskrivningen.

Det nuvarande API:et finns kvar under en övergångsperiod. Postbeskrivningen
markerar alltså redan i dag vilka variabler som dör, men markeringen är en
färg i ett pdf-lager som inte gick att läsa av maskinellt, så vilka fält det
gäller är **inte** verifierat. Det är den enskilt viktigaste osäkerheten i
hela dokumentet: om `Arbetsställestatus` eller `Slutdatum` står gulmarkerade
faller funktionen, och det går att ta reda på med ett mejl innan en rad kod
skrivs.

---

## 3. Vad vi mätte i vårt eget bestånd

Kört 2026-08-18 mot databasen. 16 106 rader totalt, varav 16 047 publicerade
och 59 avpublicerade.

### 3.1 Organisationsnumret

**0 av 16 106.** Ingen kommun har en enda rad med organisationsnummer:

| Kommun | Rader | Med orgnr |
|---|---:|---:|
| Stockholms stad | 8 552 | 0 |
| Uppsala kommun | 1 854 | 0 |
| Linköpings kommun | 1 249 | 0 |
| Örebro kommun | 1 236 | 0 |
| Jönköpings kommun | 1 129 | 0 |
| Karlstads kommun | 700 | 0 |
| Borgholms kommun | 406 | 0 |
| Höganäs kommun | 318 | 0 |
| Oskarshamns kommun | 240 | 0 |
| Kristinehamns kommun | 170 | 0 |
| Lomma kommun | 153 | 0 |
| Svenljunga kommun | 99 | 0 |

Kolumnen finns i schemat, den skrivs aldrig. Doc 12 avsnitt A1 gick igenom
alla tolv adaptrarna och deras råsvar och fann att källorna inte bär numret.
Den slutsatsen står kvar, och råfilerna i `data/` bekräftar den: nyckeluppsättningen
i utlämningarna är `id, name, address, lat, lng, types, verdict, inspections`
och ingenting som liknar ett organisationsnummer.

### 3.2 Vad vi har att matcha med i stället

| Kommun | Publicerade | Med gatuadress | Varken adress eller koordinat |
|---|---:|---:|---:|
| Stockholms stad | 8 520 | 8 407 | 0 |
| Uppsala kommun | 1 854 | 1 525 | 329 |
| Linköpings kommun | 1 246 | 1 224 | 0 |
| Örebro kommun | 1 233 | 1 233 | 0 |
| Jönköpings kommun | 1 115 | 1 115 | 0 |
| Karlstads kommun | 696 | **0** | 0 |
| Borgholms kommun | 406 | 251 | 155 |
| Höganäs kommun | 316 | 156 | 160 |
| Oskarshamns kommun | 239 | 227 | 1 |
| Kristinehamns kommun | 170 | 103 | 0 |
| Lomma kommun | 153 | **0** | 153 |
| Svenljunga kommun | 99 | 32 | 67 |
| **Summa** | **16 047** | **14 273** | **865** |

Gatuadress finns på 88,9 procent. Postnummer på 0 procent. Koordinat på
11 991 rader, 74,7 procent.

Karlstad och Lomma har **noll** adresser, tillsammans 849 rader. De går inte
att matcha mot en besöksadress alls, oavsett hur bra matchningen blir. Lommas
153 rader saknar dessutom koordinat och är därmed helt omatchbara. Karlstads
696 har koordinat, vilket ger en väg via närmaste belägenhetsadress, men det
är en härledning ovanpå en härledning.

### 3.3 Hur stort problemet vi vill lösa faktiskt är

Det här är talen som avgör om saken är värd ett mejl till SCB.

| Kommun | Publicerade | Utan kontroll alls | Senaste kontroll äldre än 2 år | Äldre än 3 år | Nyaste kontroll |
|---|---:|---:|---:|---:|---|
| Stockholms stad | 8 520 | 578 | 1 531 | 691 | 2026-08-17 |
| Uppsala kommun | 1 854 | 634 | 50 | 0 | 2026-08-17 |
| Linköpings kommun | 1 246 | 42 | 209 | 44 | 2026-08-07 |
| Örebro kommun | 1 233 | 40 | 170 | 92 | 2026-07-15 |
| Jönköpings kommun | 1 115 | 2 | 149 | 0 | 2026-08-13 |
| Karlstads kommun | 696 | 86 | 74 | 0 | 2026-07-28 |
| Borgholms kommun | 406 | 101 | 118 | 0 | 2025-09-30 |
| Höganäs kommun | 316 | 0 | 59 | 20 | 2026-08-12 |
| Oskarshamns kommun | 239 | 24 | 21 | 5 | 2026-08-13 |
| Kristinehamns kommun | 170 | 40 | 53 | 32 | 2026-05-27 |
| Lomma kommun | 153 | 3 | 44 | 22 | 2026-07-02 |
| Svenljunga kommun | 99 | 15 | 23 | 16 | 2026-06-30 |
| **Summa** | **16 047** | **1 565** | **2 501** | **922** | |

**2 501 publicerade verksamheter, 15,6 procent, har ingen kontroll nyare än
två år. 922, 5,7 procent, ingen nyare än tre år.** Det är beställningens
oro mätt: vi visar kontroller från 2023 och tidigare på ställen som kan ha
stängt.

**Färskhetsfönstret skärper det här, det mildrar det inte.** Fönstret gick från
tre år till fem den 31 augusti 2026, se bibeln §4b. De 922 stod tidigare utan
bedömning och var därmed no-indexerade; nu bär de ett omdöme, syns på kartan och
går att sortera på. Argumentet nedan för en NOT i stället för avpublicering blir
alltså viktigare och inte mindre viktigt, eftersom fler av de tveksamma sidorna
numera bär ett synligt märke. Noten är fortfarande rätt svar, men den behöver nu
finnas på fler sidor än när den här mätningen gjordes.

Och den avgörande siffran, den som visar att `deactivate_missing` inte täcker
hålet:

**Kommunerna har sammanlagt slutat lämna ut 59 rader av 16 106, alltså
0,37 procent, under hela vår historik.** Fördelat: Stockholm 32, Jönköping 14,
Karlstad 4, Linköping 3, Örebro 3, Höganäs 2, Oskarshamn 1, övriga fem
kommuner noll.

Noll avpubliceringar i fem kommuner är inte fem kommuner utan nedläggningar.
Det är fem kommuner som inte städar sitt register. Restaurangbranschens
omsättning av verksamheter ligger långt över en tredjedels procent, och
skillnaden mellan 0,37 procent och verkligheten är exakt den mängd påståenden
sajten inte kan stå för i dag. `deactivate_missing` fångar bara det kommunen
själv slutar lämna ut, och den här mätningen visar att kommunerna nästan
aldrig gör det.

---

## 4. Varför uppslag på organisationsnummer inte är vägen, och vad som är det

Med 0 av 16 106 finns bara en riktning kvar: **hämta hem alla arbetsställen i
kommunen inom relevanta SNI-koder och matcha mot dem**, i stället för att slå
upp våra rader en och en.

Det är faktiskt den bättre riktningen, av tre skäl:

1. **Den är billig.** Tolv kommuner gånger några anrop per vecka, i stället för
   16 047 uppslag.
2. **Den blir inte fel av att vi gissar ett nummer.** Doc 12 avsnitt A2 slog
   fast att ett felaktigt organisationsnummer kopplar en namngiven verksamhets
   hygienbrister till fel bolags skulder och konkurs. Att matcha adress mot
   adress inom en kommun bär inte den risken på samma sätt, eftersom vi aldrig
   publicerar det matchade bolagets identitet, bara statusen på lokalen.
3. **SCB:s besöksadress är restaurangens adress**, inte redovisningsbyråns.
   `PostAdress` är bolagets, `BesöksAdress` är arbetsställets. Det är precis
   den distinktion doc 12 A2 saknade svar på, och svaret är att fältet finns.

Två svagheter måste skrivas ned lika tydligt:

- **SCB:s definition av arbetsställe kräver anställd personal.** Ur
  variabelbeskrivningen: för att ytterligare arbetsställen ska bli verksamma
  krävs bland annat att "det ska finnas anställd personal (heltid eller
  deltid)". En enmansdriven korvkiosk eller ett kafé utan anställda kan alltså
  sakna eget arbetsställe helt. Frånvaro i SCB betyder därför verkligen
  ingenting.
- **Vår typindelning är inte SNI.** `types` är inte normaliserad mellan
  kommuner, vilket redan är känt. Uttaget måste därför hämta hela
  SNI-avdelning `I` samt de delar av `47` och `56` som bär butiker, kiosker och
  storkök, och matchningen får inte kräva att branschen stämmer, bara att den
  är rimlig.

---

## 5. Vad som ska byggas när nyckeln finns, och varför just så

Detta är avgjort nu så att det inte behöver avgöras under tidspress sedan.
Ingenting av det är byggt.

### 5.1 SCB säger `9 Är ej längre verksam`, kommunen lämnar fortfarande ut raden

**En not på sidan. Inte avpublicering.** Fyra skäl, det första viktigast:

1. **Sidan är det enda stället noten kan läsas.** Den som googlar "har X i
   Vasastan stängt" ska landa på en sida som svarar. En avpublicerad sida
   svarar ingenting, och den som söker får i stället tre år gamla omdömen
   någon annanstans. Att ta bort sidan tar bort svaret.
2. **Regeln om sidor och SEO.** En sida som försvinner tappar sin ranking, och
   en funktion får aldrig kosta en sida. Noten är en funktion som sker där
   besökaren står.
3. **Kontrollerna är fortfarande sanna.** De är allmänna handlingar om en
   period som faktiskt inträffade. Vi drar inte tillbaka dem, vi daterar dem.
4. **Noten är sourcad, inte härledd.** Formuleringen ska bära myndighet, datum
   och det som SCB faktiskt säger, ungefär: "SCB:s företagsregister anger att
   arbetsstället på den här adressen inte längre är verksamt sedan
   `<Slutdatum>`. Kommunen lämnar fortfarande ut verksamheten i sitt register."
   Båda leden är påståenden om vad två register säger, inte ett påstående om
   att stället är stängt. Det är skillnaden mellan att rapportera och att
   gissa.

Noten ska ligga högt på sidan, före kontrollhistoriken, eftersom den ändrar hur
allt under den ska läsas. Verksamheten stannar i kartan och i sökningen, men
med samma markering, annars är noten en fälla man bara ser om man klickar in.

### 5.2 SCB känner inte till arbetsstället, kommunen lämnar ut det

**Ingenting.** Ingen not, ingen markering, ingen ledtrådsformulering.

Frånvaro är inte nedläggning, och avsnitt 4 räknar upp minst tre skäl till att
ett fullt levande ställe saknas i SCB: inga anställda, avvikande besöksadress,
eller en matchning som helt enkelt missade. Att skriva "vi hittar inte den här
verksamheten i företagsregistret" på en sida är att lägga ett tvivel på ett
företag utan att ha något att grunda det på. Utfallet loggas internt som
omatchat och används bara för att mäta matchningens kvalitet.

### 5.3 SCB säger `1 Är verksam`, kommunen har slutat lämna ut raden

**Ingenting på sidan.** `deactivate_missing` har redan gjort sitt, och en
avpublicerad rad har ingen sida att sätta en not på.

Men det är en gratis kvalitetssignal åt andra hållet, och den ska tas: står en
kommuns avpublicerade rader kvar som verksamma i SCB är avpubliceringen
troligare ett hämtningsfel än en våg av nedläggningar. Det är samma misstanke
som `MAX_MISSING_SHARE` i `load_supabase.py` redan är byggd för, med ett andra
vittne. Det hör hemma i körningens larm, inte på sajten.

### 5.4 Vad en matchning måste klara för att få bära en not

Tröskeln sätts av vad ett fel kostar, och ett fel kostar att en öppen
restaurang står som nedlagd på Sveriges mest lästa sida om just den. Därför:

- Samma kommunkod, och
- normaliserad besöksadress lika med vår `street_address`, gatunamn och nummer,
  och
- exakt **ett** arbetsställe på den adressen inom rimliga SNI-koder, eller
  namnlikhet över tröskel om de är flera.

En sannolik matchning räcker aldrig. Rader utan gatuadress, **1 774 av 16 047**
i dag, kan aldrig få en not. Karlstads 696 och Lommas 153 är inbakade i det
talet och är utanför funktionen i sin helhet tills adresser finns.

### 5.5 Hur många rader skulle få en not?

**Går inte att mäta i dag, och siffran ska inte gissas.** Den kräver ett uttag
ur SCB. Det som går att sätta är taket: 14 273 rader kan över huvud taget
matchas, och något färre kan få en not. Golvet är okänt.

Det som däremot är mätt, och som är det egentliga skälet att göra jobbet, är
att 2 501 publicerade rader saknar kontroll nyare än två år och att kommunerna
själva bara avpublicerat 59 rader någonsin.

---

## 6. Vad som krävs av ägaren, och varför en agent inte kan göra det

För att komma vidare behöver SCB ett mejl till `scbforetag@scb.se` med, enligt
deras egen lista:

1. företagsnamn och organisationsnummer,
2. namn och e-post till **den som ska godkänna användarvillkoren**,
3. namn, e-post och mobiltelefonnummer till den som ska ta emot certifikat och
   lösenord,
4. vilken layout som önskas. Det ska vara **`Arbetsställe`**, inte de
   sammanslagna layouterna, eftersom de senare utgår i september 2026.

Detta är ägarens åtgärd. En agent ska inte godkänna avtal i någon annans namn,
inte uppge en fysisk person som avtalspart, och inte ta emot eller hantera
certifikat och lösenord.

Lägg gärna till två frågor i samma mejl, båda står obesvarade och båda avgör
om funktionen alls går att bygga:

- **Får uppgifterna lagras och visas publikt?** Användarvillkoren är inte
  publicerade någonstans, så villkoret för att visa "SCB anger att
  arbetsstället inte längre är verksamt" på en publik sida går inte att läsa
  utifrån. Det öppna data-direktivets fria vidareutnyttjande gäller de
  värdefulla datamängderna, och arbetsställena ligger inte i dem, se 2.2.
- **Står `Arbetsställestatus` eller `Slutdatum` bland de gulmarkerade
  variabler som utgår i det nya API:et?** Om ja faller hela funktionen och
  ingen kod ska skrivas.

---

## 7. Rekommendation

**Vänta till september 2026 och ansök då.** Skälet är inte tveksamhet inför
funktionen, den är rätt och talen i 3.3 motiverar den. Skälet är att det
nuvarande API:et ersätts inom en månad, att auktoriseringen byts från certifikat
till nyckel, och att sökfunktionaliteten ändras. En klient byggd i augusti
skrivs om i september.

Mejlet i avsnitt 6 kan däremot skickas nu, eftersom de två frågorna där avgör
om funktionen är möjlig, och ett svar på dem kostar ingenting att ha liggande.

Ingen kod skrevs i detta arbete. Att skriva en klient mot ett REST-kontrakt
vars bas-URL SCB inte publicerar, utan certifikat att pröva den med och en
månad innan den ersätts, hade varit att gissa tre gånger om.

---

## 8. Osäkerheter

Skrivet så att nästa läsare vet exakt var golvet slutar.

- **Vilka variabler som gulmarkerats som utgående** gick inte att läsa. Färgen
  ligger i pdf:ens grafiklager och följde inte med textextraktionen.
- **Användarvillkorens innehåll** är inte publicerat och därmed oläst. Frågan
  om lagring och publicering är obesvarad.
- **API:ets bas-URL och exakta söksyntax** publiceras inte av SCB. Att uttaget
  kan filtreras på `Kommun` och `Bransch` följer av att båda är variabler i
  layouten och av SCB:s formulering "nerladdning av variabler för framsökta
  arbetsställen", men själva anropsformen är inte sedd.
- **Hur många av våra rader som faktiskt finns i SCB** är helt omätt och kan
  inte mätas utan certifikat. Alla tal i avsnitt 3 är om vårt eget bestånd.
- **Aviseringstjänstens pris** är okänt. Den behövs inte, veckovisa hela uttag
  per kommun ryms med marginal i takgränsen.

---

## 9. Noten är byggd, och den är byggd på Stockholm

**Datum:** 2026-08-31. Alla tal nedan är körda mot `site/src/data/` samma dag,
och statusvärdena är hämtade om från stadens levande intyg samma dag, ett GET
per anläggnings-id.

Avsnitt 5 skrevs mot SCB och skulle vänta på ett certifikat. Den väntan gäller
inte längre för Stockholm, och skälet står i `docs/25_oppna_punkter.md`:
stadens registreringsintyg svarar `Status` per anläggnings-id, utan certifikat
och utan avtal. Designen i 5.1 ändras inte av det. Det som ändras är att den
går att bygga.

### 9.1 Läget, mätt om

| | |
|---|---|
| Verksamheter i beståndet | 17 066 i 13 kommuner |
| Rader med registeruppgift | 8 514, alla i Stockholm |
| Rader utan registeruppgift | 8 552, alltså halva beståndet |
| Kommunen svarar `Aktiv` | 8 484 |
| **Kommunen svarar något annat** | **30** |

De trettio, per statusvärde, avlästa ordagrant ur intyget 2026-08-31:

| Statusvärde | Antal |
|---|---|
| `Inaktiv` | 27 |
| `Upphörd/Skrotad` | 3 |

Samma tal som 2026-08-27, och det är i sig en uppgift: ingen av de trettio har
gått tillbaka till `Aktiv`, ingen ny har tillkommit, och inget id svarade
"Inget data kunde hittas". De tre `Upphörd/Skrotad` är LDM Transport &
Logistics AB, Kanaans Trädgårdscafe och Sätra Tobak.

Färskhetsfönstret är fem år sedan modell 5, och det ändrar bilden av vilka de
trettio är:

| | |
|---|---|
| Har en kontroll inom femårsfönstret, alltså en bedömning | 23 |
| Saknar bedömning | 7 |
| ...därav utan en enda publicerad kontroll | 5 |
| ...därav med kontroller äldre än fönstret | 2, senast 2020-09-21 och 2020-12-03 |

Bedömningarna på de 23: 21 utan anmärkning, 1 med brister, 1 med brister som
kvarstår. Alla 30 har en koordinat, alltså står alla 30 på kartan.

Norrköping tillkom med 622 koordinater men utan registeruppgift, och kommunen
kan därför aldrig få en markering. Det är inte en lucka utan hela poängen med
§5.2: predikatet frågar `active === false` och aldrig `!active`.

### 9.2 Lydelsen

Orden bor i `AVREGISTRERAD` i `site/src/lib/site.ts` och skrivs ingen
annanstans. Noten på verksamhetssidan lyder, med kommunens formella namn
insatt:

> **Inte längre registrerad**
>
> Stockholms stad anger att verksamheten inte längre är registrerad som
> livsmedelsverksamhet. Registret säger inte om stället har stängt, bytt ägare
> eller registrerats på nytt. Kontrollerna nedan gäller tiden då verksamheten
> var registrerad.
>
> Källa: Stockholms stads registreringsintyg, läst 27 augusti 2026.

Tre saker i lydelsen är beslut och inte formuleringar:

1. **Ledet är kommunens, inte vårt.** "Stockholms stad anger" och inte "har
   stängt". Vi rapporterar vad ett register säger, vi gissar inte vad som hänt
   på gatan. Det är samma skiljelinje som 5.1 punkt 4 drar.
2. **Förbehållet står alltid.** En avregistrering har minst tre andra
   förklaringar än nedläggning: ägarbyte där den nya ägaren registrerats som en
   ny anläggning, flytt, eller en post staden städat. Utan meningen läser
   besökaren "stängt", och då har noten sagt något vi inte har täckning för.
3. **Sista meningen står bara där den är sann.** Fem av de trettio har noll
   kontroller, och "Kontrollerna nedan" pekar där på tomrum.

Källraden bär datumet intyget lästes och aldrig dagens datum, av samma skäl som
`checkedAt` finns på `hours` och `contact`: en uppgift utan tidpunkt går inte
att åldra.

### 9.3 `Inaktiv` och `Upphörd/Skrotad` säger samma sak

Skillnaden bärs inte vidare till sajten. Tre skäl:

1. **Läsarens fråga är en.** Står stället kvar i kommunens register? Båda
   värdena svarar nej. "Skrotad" är stadens ord om en POST i ett diarium, inte
   om ett ställe på en gata, och att skriva ut det ordet om en namngiven
   verksamhet är att låna en administrativ ton vi inte behöver.
2. **Slutsatsen är redan dragen, och av en människa.** `STATUS` i
   `pipeline/prikko/stockholmsintyg.py` översätter båda till `False`, och
   skälet står där: alla tre `Upphörd/Skrotad` bär ordet "Upphörd" redan i
   verksamhetens namn. Att bära skillnaden till sajten hade krävt att fältet
   `active` blev en sträng, alltså en ändring i datamodellen för en skillnad
   ingen läsare kan använda.
3. **Tre rader av trettio.** Varje extra formulering är ännu en mening som
   måste hållas sann, och den här hade mötts av nästan ingen.

### 9.4 Markeringen, och varför den är densamma på alla ytor

§5.1 kräver samma markering i listor, sök och karta, annars är noten "en fälla
man bara ser om man klickar in". Märket är därför ordagrant notens egen rubrik,
**Inte längre registrerad**, som ett grått ofyllt pillret. Ingen färg, ingen
ikon, ingen fyllning: sidan bär redan en färgskala där varje steg betyder något
om hygienen, och ett märke i en fjärde färg hade lästs in i den skalan och
blivit en bedömning vi inte har täckning för. Samma regel som håller "God
efterlevnad" ute ur `Foretagsregister.astro`.

| Yta | Var märket står | Varför just där |
|---|---|---|
| Verksamhetssidan | Not högst upp i huvudkolumnen, före bedömningen | Beskedet ändrar hur bedömningen ska läsas, alltså kommer det före den |
| Kommunhubbens lista | Efter namnet | Raden bryter i stället för att klippa, alltså kan märket inte falla bort |
| Startsidans kort | Egen rad under namnet, före bedömningen | Namnet är klippt vid två rader, så ett märke inuti hade kunnat klippas bort helt |
| Sökpanelen och /sok | Först i metaraden | Namnraden klipps från höger, alltså överlever märket bara om det står först |
| Kartans listrad | Först i metaraden, före bedömningen | Samma klippning, och samma ordning som på verksamhetssidan |
| Kartans nålkort | Egen rad över bedömningen | Kortet är enda stället på kartan där hela beskedet ryms i ord |

Sökregistret bär de trettio som en lista radnummer och inte som ett fält per
rad. Talet som avgjorde det: 30 av 17 066 är 0,18 procent, alltså hade ett
sjätte fält skrivit `,0` sjuttontusen gånger, ungefär 34 kB, för att bära
trettio ettor. Listan är under 200 byte, och filen ligger på varje sidvisning.

### 9.5 Indexeringen: sidorna ligger kvar i sitemapen

**Beslut: `isIndexable()` i `lib/data.ts` är oförändrad, och därmed
`noindexPaths()` i `lib/webbkarta.ts`.** Sitemapvakten går igenom oförändrad,
16 096 URL:er varav 15 365 verksamhetssidor.

Argumentet för att lyfta ut dem är att sidan kan handla om något som inte finns.
Det håller inte, av tre skäl som alla är notens egna:

1. **Sidan är det enda stället noten kan läsas.** Den som googlar "har X i
   Vasastan stängt" ska landa på en sida som svarar. Att ta sidan ur indexet är
   att ta bort svaret på precis den fråga funktionen finns för, alltså en
   avpublicering i allt utom namnet. §5.1 punkt 1.
2. **En funktion får aldrig kosta en sida.** §5.1 punkt 2, och
   `docs/49_indexeringen.md`.
3. **Sidan handlar inte om ingenting.** Kontrollerna är allmänna handlingar om
   en period som faktiskt inträffade, och 23 av de 30 bär en publicerad
   kontrollhistorik inom femårsfönstret. Det är faktisk information i
   kvalitetsgrindens mening.

Grinden gör dessutom redan sitt jobb på de tunna av dem utan att veta något om
registret: de 7 utan bedömning faller på `verdict !== null &&
inspections.length > 0` som vilken annan tunn sida som helst. Kvar i indexet
står 23 sidor som var och en har något att svara med.

### 9.6 Kartan: nålen står kvar, dämpad

**Beslut: nålen tas inte bort och byter inte färg. Den ritas med
`icon-opacity` 0,45 och bär märket i listraden och i nålkortet.**

En karta är ett påstående om en plats, och det är just därför nålen ska stå
kvar. Att ta bort den är att avpublicera i kartan: den som drar över kvarteret
och undrar vad som hände med stället på hörnet får då ingenting alls, och
ingenting är inget besked. §5.1 säger det rakt ut, att verksamheten "stannar i
kartan och i sökningen, men med samma markering".

Att rita nålen grå, alltså som `face-none`, prövades och förkastades. Grått
betyder "ingen bedömning" på hela sajten, och 23 av de 30 HAR en bedömning. En
femte färg löser ingenting, den lägger bara till en nivå i en skala där varje
steg betyder något om hygienen.

Talet 0,45 är valt mot kartbotten och inte mot vitt. Vid 0,6 är skillnaden mot
en granne knappt läsbar på en ljus gata, och vid 0,3 börjar en gul nål försvinna
i en gul väg, alltså blir markeringen en avpublicering i praktiken. Lagret
`nal-lyft` bär inte dämpningen: den nål man pekar på eller väljer poppar ut i
full styrka, av samma skäl som den poppar ut ur områdesskuggan.

**En känd gräns, och den är mätt.** 13 av de 30 delar adress med minst en annan
verksamhet. Nålarna i en sådan stapel ritas ovanpå varandra, alltså kan en
dämpad nål ligga under en granne i full färg och inte synas som dämpad. Det är
staplingens egen effekt och inte något den här funktionen infört, och den är
täckt på den yta som finns för just stapeln: kortets bläddring visar var och en
för sig, och den som är avregistrerad bär märket i ord. De 17 som ligger ensamma
på sin adress syns dämpade direkt i kartan.

### 9.7 Vad som är verifierat, och hur

Bygget kördes i en egen worktree med `--outDir dist-nedlagda`, 17 805 sidor.

- **Noten:** 30 sidor bär den, alltså exakt de trettio. Läst i den byggda
  HTML:en, och sidan utan kontroller saknar riktigt den sista meningen.
- **Listorna:** märket står i kommunhubbens listor, områdes-, kategori- och
  kedjesidor. Sett i bild på `/kedja/sushi-yama/`.
- **Sökningen:** registret bär nyckeln `a` med 30 radnummer.
- **Kartan:** alla 30 nålarna bär `av: 1` i rutarkivet, läst genom att
  avkoda varje ruta upp till z12. Dämpningen är sedd i bild på Hi Mala Town,
  Tulegatan 37, bredvid grannar i full färg.
- **Sitemapvakten:** går igenom oförändrad.

Kartan går inte att se i `astro dev`, den kräver ett riktigt bygge, och
`astro build` utan npm-hooken `prebuild` lägger inte maplibre i `public/`.
Kör `node scripts/kopiera-maplibre.mjs` först, annars svarar kartan "Kartan gick
inte att ladda" av ett skäl som inte har med koden att göra.

### 9.8 Vad som INTE är byggt, och varför

- **SCB-spåret.** Avsnitt 5 till 8 står oförändrade. Noten vilar i dag på
  kommunens eget intyg, vilket är ett starkare underlag än SCB:s
  arbetsställeregister och utan certifikat, men det finns bara i Stockholm.
  Rekommendationen i avsnitt 7 gäller fortfarande för de andra tolv kommunerna.
- **Ingenting när källan bara saknar stället.** §5.2 oförändrad, och det är
  8 552 rader.
- **Ingen avpublicering, någonsin.** §5.1 oförändrad.

### 9.9 Nattjobbet nollställde noten, och skälet var två fält med samma namn

**Datum:** 2026-09-01. Noten byggdes 08-31 och var borta ur drift 09-01, utan
att en rad sajtkod ändrats.

| Commit | Rader | `registration` | `active: false` |
|---|---:|---:|---:|
| `8d4d5d63` sista exporten före natten | 8 520 | 8 514 | **30** |
| `f1a4183b` nattjobbet 09-01 09:28 UTC | 8 537 | 8 466 | **0** |

#### Mekanismen

Verksamheten togs inte ur filen fält för fält. **Hela raden försvann.** Ingen
av de trettio finns kvar i `f1a4183b`, varken på sitt id eller på sin slug, och
ingen rad som blev kvar tappade sin registeruppgift. De 48 uppgifter som
saknades satt på 48 av de 49 rader som utgick i sin helhet.

Kedjan har tre led:

1. **Staden slutar lämna ut anläggningen samma dag som intyget säger `Inaktiv`.**
   Livsmedelskollen svarar med det registrerade beståndet, och en avregistrerad
   anläggning står inte i det. Nattens hämtning gav 49 rader färre än
   databasens publicerade bestånd.
2. **`deactivate_missing` i `pipeline/load_supabase.py` skrev `active = 0` på
   dem.** Spärren `MAX_MISSING_SHARE` gick inte i gång: 49 av 8 520 är 0,57
   procent mot taket 426 rader, alltså precis det bortfall spärren är byggd för
   att SLÄPPA igenom som verkliga nedläggningar.
3. **`export()` i `pipeline/export_supabase.py` utelämnar varje rad med
   `active = 0` innan den bygger filen.** Raden nådde därför aldrig
   bevarandeslingan, och noten hade ingen sida att stå på.

Korrelationen är fullständig och den är inte en slump: **30 av 30**
avregistrerade rader utgick, medan slumpen hade gett 0,17 av dem. Det är samma
händelse sedd två gånger.

#### Vilken fälla det var, och vilken det inte var

FILFALT-kommentaren varnar för två fällor, och det här är ingendera. Båda
prövades först:

- **Fältet byggs från grunden i pipelinen och hör inte i bevarandelistan.**
  Nej. `registration` har ingen kolumn i Supabase. `pipeline/schema.sql` ger
  `establishments` inget fält för organisationsnummer, riskklass eller
  registerstatus, `load_supabase.py` skriver ingen av dem, och den enda vägen
  in i filen är `raden()` i `pipeline/prikko/stockholmsintyg.py` via
  `tillampa`. Gårdagens fil kan alltså inte vinna över databasen, för databasen
  har ingenting att vinna med. Det är samma svar som `caseNumber` fick och
  motsatsen till det `images` fick. **`registration` ska stå kvar i FILFALT.**
- **Ett booleskt `false` är falsy, och `if forra.get(namn)` hoppar över det.**
  Nej. Bevarandeslingan frågar på FILFALT-namnet, alltså på `registration`, och
  det är en ordbok. En icke-tom ordbok är sann, och hela blocket bärs över med
  `active`, `compliance` och `certified` inuti sig. Reproducerat: en rad med
  `registration.active: false` som ligger kvar i databasen behåller sitt
  `false` genom exporten, både före och efter rättelsen.

Fällan var en tredje: **två fält heter `active` och betyder olika saker.**

| Fält | Vem det tillhör | Vad det betyder |
|---|---|---|
| `establishments.active` | oss | publiceringsflagga, `0` eller `2`, se `deactivate_missing` |
| `registration.active` | kommunen | står anläggningen kvar i stadens register |

En avregistrering sätter båda, och publiceringsflaggan vann. Det som §5.3 kallar
"en avpublicerad rad har ingen sida att sätta en not på" var skrivet mot SCB och
mot fallet att kommunen INTE har något besked. Nu har kommunen skrivit ut
beskedet själv, och då är frånvaron förklarad i stället för misstänkt.

#### Lagningen

`export()` läser gårdagens filer FÖRE avpubliceringsfiltret och håller kvar den
avpublicerade rad kommunen själv skrivit ut som avregistrerad. Villkoret är så
smalt det kan vara, se `filavregistrerade`:

- Predikatet är `registration.active is False` och aldrig `not active`,
  ordagrant samma tre tillstånd som `avregistrerad` i
  `site/src/lib/registrering.ts`. Frånvaro av intyg gäller 8 552 rader, alltså
  halva beståndet, och `not` hade hållit kvar varje avpublicerad rad i landet.
- En rad som bara försvann behandlas som förr. Vi vet inte om det var en
  nedläggning eller en ruta i rutnätet som svarade fel, och 19 av nattens 49
  var av det slaget.
- Filen läses en gång och inte två. Kartan skickas vidare in i kommunslingan,
  som förr läste den själv. `stockholm.json` är 16 MB.

Detta är §5.1 och §9.5 tillämpade på det fall som faktiskt inträffade: en not på
sidan, aldrig en avpublicering, eftersom sidan är det enda stället noten kan
läsas.

Provet står i `Avregistrerade` i `pipeline/tests/test_export_koordinater.py`,
samma mönster som `Kontrollfalten`. Två av sju prov faller på koden som fanns
före rättelsen, och det är beviset. De fem andra är grindar åt andra hållet: en
avpublicerad rad UTAN intyg, och en med `Aktiv`, ska fortsätta utgå.

#### Syskonen: vilka fler fält stod i samma läge

Frågan är två och de har olika svar.

**Inuti `registration` är alla sexton fälten i exakt samma läge, och det är
radens läge.** Blocket bärs som en enhet, alltså föll allt med raden, och
allt kommer tillbaka med den. Ingen enskild nyckel behöver egen behandling.
Uppmätt 2026-09-01 i `stockholm.json`:

| Fält | Typ | Läge |
|---|---|---|
| `active` | boolesk | `false` på 30, hela funktionen |
| `compliance` | boolesk | `false` på 4 180 av 8 466 |
| `certified` | boolesk | `false` på 8 282 av 8 466 |
| `frequency` | tal | inget värde är noll i dag, men noll är ett mätvärde |
| `activities` | lista | tom på 854 rader |
| `businessTypes` | lista | tom på 3 rader |
| `orgnr`, `operator`, `postalCode`, `city`, `scope`, `riskDecidedAt`, `companyForm` | text | `null` på mellan 1 och 598 rader |
| `registeredAt`, `focus`, `checkedAt` | text | står på alla 8 466 |

`compliance` och `certified` är de två som hade fallit om `registration` någon
gång bryts upp i ett fält per uppgift. `test_falska_syskonfalt_i_registration_overlever`
finns för att den dagen ska mötas av ett rött prov och inte av en tyst radering.

**På FILFALT-nivån är riskerna prövade och tomma i dag.** `registeredAt`,
`operator`, `riskClass` och `decisions` står på noll rader i hela
`site/src/data`, alltså finns ingen mätning som visar problemet. `riskClass` är
den att hålla ögonen på: den är ett TAL, och en riskklass noll hade tappats av
`if forra.get(namn)` på precis det sätt som `openDeviations` en gång tappade
183 av 241 rena kontroller. Linköpings hämtning är den som får talet att växa.

#### Återställningen

De trettio raderna ligger kvar i Supabase med `active = 0`, historiken orörd och
sluggen reserverad, alltså skrivs de ut av den rättade exporten nästa gång den
kör mot databasen:

    python3 pipeline/export_supabase.py --out site/src/data

Datafilen är återställd redan nu ur den sista exporten före natten,
`8d4d5d63`, och 2 131 rader lades till utan att en enda togs bort. Att den
återställningen är trogen är kontrollerat och inte antaget:
`python3 pipeline/stockholmsintyg.py tillampa site/src/data/stockholm.json`
skrev **0 rader**, alltså bär de återlagda raderna exakt det intygscachen i
`pipeline/data/interim/stockholmsintyg.json` säger. Ingen sida hämtades om ur
stadens e-tjänst.

Verifierat i ett riktigt bygge, `--outDir dist-status`, 17 872 sidor:

- **Noten:** 30 sidor bär `aria-label="Uppgift ur kommunens register"`, alltså
  exakt de trettio. Kanaans Trädgårdscafe, som saknar kontroller, saknar
  riktigt sista meningen.
- **Märket:** 121 sidor bär rubriken, alltså de trettio plus listorna, sök- och
  kategorisidorna som visar dem.
- **Sökregistret:** nyckeln `a` bär 30 radnummer igen.
- **Grindarna:** sitemapvakten 16 115 URL:er, döda länkar noll, rutarkivet
  läsbart, filtaket 18 150 av 100 000.
- `python3 -m pytest pipeline/tests/ -q`: 1 310 gröna.
