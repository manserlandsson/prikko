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
