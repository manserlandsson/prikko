# 13. Bilder på verksamheterna, och resten av det en verksamhetssida borde bära

Datum: 2026-08-03. Alla siffror om vårt eget bestånd är körda mot databasen samma
dag. Alla licensvillkor är hämtade ur källans egen text och citeras ordagrant på
den punkt som avgör. Där jag inte kunnat verifiera står det utskrivet.

Rapport 12 handlar om företagsdata och organisationsnummer. Den upprepas inte här,
men juridiken i dess del E gäller även den här rapporten: öppna data-lagen
(2022:818) som grund, och utgivningsbeviset som den avgörande hävstången.

---

## Kort sammanfattning

Ägaren vill att en besökare ska tänka "det är DEN restaurangen". Frågan är var
bilderna kommer ifrån.

Det finns fem saker i den här rapporten som avgör svaret:

1. **Google är stängt, och inte främst på grund av priset.** Villkoren förbjuder
   uttryckligen att lagra bilderna, och kräver därmed ett anrop per sidvisning på
   en sajt som är statiskt byggd. Dessutom: eftersom vårt faktureringsland ligger i
   EES gäller Googles EES-villkor, och de räknar upp nio tillåtna
   användningsområden för Places API. Ingen av de nio är vårt. Street View har en
   egen spärr: dess innehåll får inte visas bredvid en karta, och vår
   verksamhetssida har en karta. Google faller alltså på tre av varandra oberoende
   grunder.

2. **Rörledningen som redan finns är trasig, och det upptäcks först i drift.**
   `pipeline/prikko/imagery.py` sparar Mapillarys `thumb_1024_url` rakt av och
   `StreetPhoto.astro` renderar den. De URL:erna är signerade och har en
   utgångstid. Bilderna hade alltså slutat visas efter en tid utan att något i
   bygget klagade. `public.images` har i dag 0 rader, så det har aldrig märkts.

3. **`MAPILLARY_TOKEN` i `site/.env` är TOM.** Källan med mest kod bakom sig är
   den enda jag inte kunnat mäta. Mätskriptet finns färdigt, se del A2. Det tar tio
   minuter att svara på frågan och det avgör om del A2 är en helg värd att lägga.

4. **Bilder får aldrig checkas in i repot.** Bygget ligger på 16 466 filer av
   Cloudflare Pages tak på 20 000. Marginalen är 3 534 filer, och 8 802 verksamheter
   har både koordinat och en typ där en bild hör hemma. Räkningen går inte ihop.
   Bilder måste ligga i objektlagring utanför bygget, vilket ägaruppladdningen redan
   gör. Cloudflare R2:s gratisnivå är 10 GB med fri utgående trafik och passar exakt.

5. **Besökaruppladdning är den enda lagliga vägen till bilder INIFRÅN, och den
   spärr som står i vägen är en enda rad SQL.** Men den ska inte bara tas bort. Den
   ska bytas mot en kvot, och skrivordningen mellan fil och rad ska vändas, annars
   är den privata bucketen öppen för vem som helst att fylla.

Och en sak till, som inte handlar om bilder men som visade sig vara den mest
lovande mätningen i hela utredningen: **OpenStreetMap går faktiskt att para ihop
med vårt bestånd.** 46,1 procent av Karlstads publikvända verksamheter och 26,7
procent av Jönköpings matchade mot en OSM-POI på både namn och läge. Bland de
matchade har över hälften öppettider och webbplats i Karlstad. Det fyller resten av
verksamhetssidan gratis, och det ger oss dessutom webbplatserna, vilket i sin tur
gör ägarverifiering via domänmejl möjlig.

Prioriteringen som följer av det: gatubild i skala från Mapillary och Panoramax,
interiörbild i den långa svansen från besökare och ägare, resten av sidan från OSM,
och ingenting alls från Google.

---

## Del A. Bildkällorna, en i taget

### Vårt faktiska bestånd, som allt mäts emot

Kört i dag mot `public.establishments`:

| | antal |
|---|---|
| verksamheter totalt | 15 916 |
| med koordinat (`lat`/`lng`) | 13 544 |
| med gatuadress | 14 160 |
| med postnummer | 0 |
| med organisationsnummer | 0 |
| rader i `public.images` | 0 |

Koordinattäckningen är ojämn, och det spelar roll eftersom varje geografisk
bildkälla slår i noll utan koordinat:

| kommun | rader | med koordinat |
|---|---|---|
| Stockholms stad | 8 511 | 8 511 |
| Uppsala kommun | 1 740 | 925 |
| Linköpings kommun | 1 241 | 1 241 |
| Örebro kommun | 1 233 | 645 |
| Jönköpings kommun | 1 120 | 1 120 |
| Karlstads kommun | 694 | 694 |
| Borgholms kommun | 406 | **0** |
| Höganäs kommun | 310 | **0** |
| Oskarshamns kommun | 239 | 238 |
| Kristinehamns kommun | 170 | 170 |
| Lomma kommun | 153 | **0** |
| Svenljunga kommun | 99 | **0** |

Fyra kommuner, 968 verksamheter, saknar koordinat helt. För dem är varje
gatubildskälla i den här rapporten värdelös tills geokodningen är gjord.

Och alla 15 916 ska inte ha en bild. En uppdelning på `types`:

- **10 051** har en publikvänd typ (restaurang, café, servering, pizzeria,
  snabbmat, butik, handel). Av dem har **8 802** koordinat. Det är den verkliga
  målgruppen för en fasadbild.
- **3 035** är skola, förskola, vård eller omsorg. Ett foto på ett skolkök är
  varken önskat eller lämpligt.
- **1 354** är huvudkontor, grossist, import, matmäklare, e-handel, tillverkning
  eller verksamhet i hemmet. Det finns ingen fasad att fotografera.

**Det är alltså 8 802 sidor som behöver en bild, inte 15 916.** Den siffran gör
hela problemet en tredjedel mindre och bör användas i varje kalkyl nedan.

---

### A1. Google: Places Photos och Street View Static

Detta är den fälla briefen pekar ut, och den är värre än väntat. Tre spärrar,
oberoende av varandra. Vilken som helst av dem räcker.

#### Spärr 1: villkoren förbjuder att lagra bilden

Google Maps Platform Terms of Service, avsnitt 3.2.3(a), ordagrant:

> "**No Scraping.** Customer will not export, extract, or otherwise scrape Google
> Maps Content for use outside the Services. For example, Customer will not: (i)
> pre-fetch, index, store, reshare, or rehost Google Maps Content outside the
> services; (ii) bulk download Google Maps tiles, Street View images, geocodes,
> directions, distance matrix results, roads information, places information,
> elevation values, and time zone details; (iii) copy and save business names,
> addresses, or user reviews"

Punkt (ii) beskriver ordagrant den enda arkitektur som fungerar för oss: hämta
13 544 Street View-bilder en gång och servera dem själva. Och 3.2.3(b):

> "**No Caching.** Customer will not cache Google Maps Content except as expressly
> permitted under the Maps Service Specific Terms."

Vad Service Specific Terms uttryckligen tillåter är smalt och rör inga bilder:
`place_id`, `pano_ID` och `video_ID` får sparas, och latitud och longitud i högst
30 dagar. Bilden själv, aldrig.

Places-dokumentationen säger samma sak, med en extra skruv:

> "**Caution:** You cannot cache a photo name. Also, the name can expire. Ensure
> you always get the name from a response to a request to Place Details (New),
> Nearby Search (New), or Text Search (New)."

Alltså: inte ens *referensen* till bilden får sparas. Varje sidvisning kräver först
ett Place Details-anrop för att få ett färskt fotonamn och sedan ett
Places Photo-anrop för själva bilden. Två betalda anrop per sidvisning, på en sajt
som är statiskt genererad och byggs om varje natt. Det är fel form på den
grundligaste tänkbara nivån.

#### Spärr 2: EES-villkoren räknar upp nio tillåtna användningar, och vi är ingen

Sedan 8 juli 2025 gäller separata villkor för den som har faktureringsadress inom
EES. `Places API Permitted Uses (EEA)`, senast ändrad 4 juni 2025, ordagrant:

> "Customers with a billing address in the EEA may only use the Google Maps Content
> from the Places API within Customer Applications to (collectively, the 'Permitted
> Uses'): (1) facilitate address lookup and autocompletion functionalities; (2)
> display information about **Customer's** physical stores, offices, or official
> service points; (3) ... (4) ... (5) show information about nearby points of
> interest ... to provide context for a real estate listing or rental property ...
> (6) ... (7) ... (8) allow users to tag or share a specific Place in their posts
> ... (9) ..."

Punkt (2) är den som ligger närmast och den träffar inte oss: det är *kundens egna*
butiker och kontor. Prikko visar andras verksamheter. Ingen av de nio punkterna
beskriver en katalog över tredje parts restauranger. **Places-foton är i EES inte
en tillåten användning för Prikko, oavsett vad vi betalar.**

Detta bekräftas från andra hållet i huvudavtalets 3.2.3(d):

> "Customer will not: ... (iii) use the Google Maps Core Services in a **listings or
> directory service** or to create or augment an advertising product"

Prikko är per definition en listings-tjänst.

#### Spärr 3: Street View får inte visas bredvid en karta

Street View har en egen och lika hård spärr. EES Service Specific Terms, avsnitt
22.1, hela texten:

> "**Street View Static API. 22.1 No Use With any Map.** Customer may not use any
> Google Maps Content from the Street View Static API With any Map."

Och `With any Map` är ett definierat begrepp:

> "'With any Map' means to (1) display Google Maps Content on, next to, or in a
> manner that is visually associated with any map, **including a Google Map**; or
> (2) link Google Maps Content to any map or link any map to Google Maps Content,
> unless the specific map being linked to is the source of the applicable Google
> Maps Content."

Vår verksamhetssida visar `StreetPhoto` direkt ovanför `LocationMap`. Det är exakt
"on, next to, or visually associated with" en karta. Det finns ingen version av
sidan som både har en karta och en Street View-bild och är avtalsenlig. Samma sak
följer av huvudavtalets 3.2.3(e):

> "**No Use With Non-Google Maps.** ... Customer will not (i) display or use Places
> content on a non-Google Map, (ii) display Street View imagery and non-Google Maps
> on the same screen"

Vår karta är Mapbox.

#### Priset, för fullständighetens skull

Hämtat ur Googles egen SKU-lista i dag. Kolumnen är den första betalande nivån,
"Cap till 100 000":

| SKU | gratis per månad | pris per 1 000 |
|---|---|---|
| Street View (9BD0-A2EE-44C3) | 10 000 | 7,00 USD |
| Street View Metadata (3168-48A9-5C8C) | obegränsat | gratis |
| Dynamic Street View (658E-F885-E11A) | 5 000 | 14,00 USD |
| Places Photo (81E7-85D0-58A7) | 1 000 | 7,00 USD |
| Place Details Enterprise (2D9A-3DE0-3766) | 1 000 | 20,00 USD |
| Text Search Pro (4FDA-34B1-A910) | 5 000 | 32,00 USD |

Att sätta ett Places-foto på 8 802 sidor kräver Text Search för att hitta
`place_id`, Place Details Enterprise för att få fotonamnet och Places Photo för
bilden. Det landar på ungefär 280 + 160 + 60 = **cirka 500 USD, per bygge**,
eftersom ingenting får sparas mellan byggen. Vid en nattlig ombyggnad är det
15 000 USD i månaden. Street View Static är billigare, 8 802 bilder ryms nästan
inom gratisnivån på 10 000 per månad, men får ändå inte lagras och får ändå inte
visas bredvid kartan.

**Verdikt: Google är stängt.** Inte "dyrt men möjligt". Stängt. Det är den fråga
briefen bad mig reda ut ordentligt, och svaret är entydigt.

Det ägaren är ute efter går ändå att få. Det Street View ger är en fasadbild som
gör att man känner igen stället. Den effekten är inte Googles egendom. Mapillary
och Panoramax ger samma sorts bild, från samma sorts kamera på samma gata, och de
får lagras.

---

### A2. Mapillary

Detta är den källa som redan har kod bakom sig, och den enda jag inte kunnat mäta.

**Licens.** Mapillarys villkor, om användarinnehåll:

> "Your use of any User Content provided by other users is subject to the Creative
> Commons Attribution ShareAlike (CC BY-SA) license"

CC BY-SA är rätt licens för oss. Vi får hämta bilden en gång, lagra den, ändra
storlek på den och servera den själva. Kravet är attribution.

**Vad share-alike innebär för oss, konkret.** Detta är den fråga briefen ställer
och svaret är lugnande. Share-alike gäller *bearbetat material*, inte samlingar. En
webbsida som visar en CC BY-SA-bild är enligt Creative Commons egen definition en
samling och inte en bearbetning. Sidan smittas alltså inte, och Prikkos övriga
innehåll behöver inte licensieras BY-SA. Det som däremot smittas är bilden själv
om vi ändrar den: skalar vi ner den och konverterar till WebP är den nedskalade
filen ett bearbetat verk och ska bära CC BY-SA. Det är ingen börda, det är en rad
i bildtexten. Notera att `object-fit: cover` i CSS inte är en bearbetning, det är
ett visningsval.

**Attributionskravet är hårdare än vad vi bygger i dag.** Mapillarys utvecklarvillkor:

> "you must attribute such images by prominently displaying the Mapillary logo and
> including a link"

`StreetPhoto.astro` skriver i dag bara texten "Mapillary, CC BY-SA" med en länk.
Logotypen saknas. Det är en liten sak men den ska rättas innan något publiceras.

**Den allvarliga bristen: bild-URL:erna går ut.** Mapillary bekräftar för API v4
att miniatyr-URL:erna inte längre är stabila, har en TTL och ligger bakom en
signerad cache. Användare rapporterar "URL signature expired" på tidigare hämtade
URL:er. Vår `imagery.py` returnerar `thumb_1024_url` och pipelinen skriver den till
`public.images.url`, som `StreetPhoto.astro` renderar rakt av. **Den konstruktionen
går sönder av sig själv efter en tid, och bygget märker ingenting.** Rättningen är
enkel och nödvändig: ladda ned själva bytesen i pipelinen och lägg dem i vår egen
lagring. CC BY-SA tillåter det uttryckligen. Det är dessutom precis det som gör
kostnaden noll per sidvisning.

**Täckningen kunde jag inte mäta, och det ska stå tydligt.** `MAPILLARY_TOKEN` i
`site/.env` finns som rad men är tom, och API:t svarar `{"error":{"message":
"Invalid OAuth 2.0 Access Token","code":190}}` på varje anrop. Utan token finns
ingen väg in: `graph.mapillary.com` och `tiles.mapillary.com` avvisar båda
anonyma anrop.

**Så här mäts det, på tio minuter.** Ett gratiskonto på mapillary.com, Settings →
Developers, klistra in token i `site/.env`, kör sedan:

    python3 pipeline/matt_bildtackning.py

Skriptet är skrivet och incheckat. Det läser de exporterade kommunfilerna, tar 400
slumpade verksamheter som både har koordinat och publikvänd typ, frågar Mapillary
en punkt i taget och skriver ut en täckningskurva per maxavstånd samt en fördelning
per kommun. Det mäter Panoramax samtidigt, och det gör det utan token, så
Panoramax-siffrorna i A3 går att reproducera direkt. Kör det innan en enda rad kod
skrivs vidare. Utfallet avgör allt:

- Över 40 procent inom 30 meter: bygg klart gatubildsvägen, det är den bästa
  affären i hela rapporten.
- 15 till 40 procent: bygg den ändå, men bara för Stockholm, Uppsala, Linköping
  och Jönköping, och planera sidan så att den ser hel ut utan bild.
- Under 15 procent: lägg ned spåret och gå direkt på besökaruppladdning.

Min gissning, och det är en gissning: Mapillary är grundat i Malmö och har ovanligt
stark svensk täckning i förhållande till sin storlek i övrigt, så jag väntar mig
det mellersta till det översta utfallet i storstäderna och nära noll i Borgholm och
Svenljunga. Men jag har inte mätt det och skriver därför ingen siffra.

**Kostnad.** Noll. Gratis konto, gratis API, och noll per sidvisning eftersom
bilden ligger hos oss.

**Skalar den till 16 000 sidor?** Ja, i rätt form. Ett anrop per verksamhet som
saknar bild, inte per bygge. Efter första körningen är det bara nya verksamheter
som kostar anrop, alltså några dussin per natt.

---

### A3. Panoramax

Den här källan stod inte i briefen och den är värd att känna till, för den är den
enda gatubildskällan jag kunnat mäta helt utan att be om något.

Panoramax är den öppna, federerade motsvarigheten till Mapillary, driven av bland
andra IGN och OpenStreetMap France. Bilderna är CC-BY-SA-4.0. API:t kräver ingen
token alls, och till skillnad från Mapillary är bild-URL:erna **stabila och
osignerade**, med `access-control-allow-origin: *`.

**Mätt i dag** mot 400 slumpade verksamheter ur vårt bestånd, med koordinat och
publikvänd typ:

| närmaste bild inom | träffar | andel |
|---|---|---|
| 20 m | 14 | 3,5 % |
| 30 m | 23 | 5,8 % |
| 40 m | 29 | 7,2 % |
| 60 m | 46 | 11,5 % |
| 100 m | 64 | 16,0 % |
| 150 m | 89 | 22,2 % |

Per kommun, inom 60 meter: Uppsala 19,0 procent, Jönköping 14,3 procent, Stockholm
13,2 procent, Linköping 2,9 procent. Örebro, Karlstad, Oskarshamn och Kristinehamn:
**noll**.

**Verdikt.** För tunt för att bära funktionen ensam. 11,5 procent inom 60 meter
betyder att nio sidor av tio står utan bild, och 60 meter är dessutom för långt för
att man ska se rätt hus. Men den kostar ingenting att lägga till som andrahandskälla
efter Mapillary, och den har inga signerade URL:er att bråka med. Bygg den som en
fallback, inte som grunden.

---

### A4. Wikimedia Commons

Briefen gissar att Commons är bra för landmärken och tunt för en pizzeria i
Huskvarna. Mätningen bekräftar gissningen, men på ett sätt som är värt att förstå
exakt, för den råa siffran ser bedrägligt bra ut.

**Mätt i dag** med Commons `geosearch` mot slumpade verksamheter ur vårt bestånd:

- Någon Commons-bild inom 250 meter: **176 av 200, alltså 88,0 procent.**
- Någon Commons-bild inom 120 meter: **190 av 250, alltså 76,0 procent.**

De siffrorna betyder ingenting. Titta på vad som faktiskt kom tillbaka:

| verksamhet | närmaste Commons-bild |
|---|---|
| CBRE GWS Sweden Café | `File:Peter Linde, kungsholmen.jpg` |
| Yummy Sweets | `File:Upplandskubb.jpg` |
| Restaurang Tjuren | `File:Martin Luther King memorial during Allt ljus på Uppsala 2008-11-15.jpg` |
| Tabbouli, Skånegatan 51 | `File:RestaurangPelikan.JPG` |
| Buddha Haga | `File:Getingen 14.jpg` |

En skulptur, ett bröd, en ljusinstallation, grannrestaurangen och en fastighet. Att
en bild är geokodad i närheten säger ingenting om att den föreställer stället. Den
fjärde raden är den farligaste: en bild av **fel restaurang** i samma kvarter, som
en naiv geosökning hade satt på sidan.

Så jag mätte relevansen i stället för närheten. Proxyn är om filnamnet nämner
verksamheten. Av 250 verksamheter träffade **18,8 procent** en bild vars filnamn
delade ett ord med verksamhetsnamnet. Men även den siffran är för hög, för nästan
alla träffarna är adressord och inte verksamhetsnamn:

| verksamhet | "namnmatchad" bild | vad som egentligen matchade |
|---|---|---|
| Dirty Taco, Rörstrandsgatan 5 | `File:Rörstrandsgatan 4-6.JPG` | gatunamnet |
| Coop Kärrtorp | `File:Kärrtorp 2013-2.jpg` | stadsdelen |
| ICA Kvantum Kista Galleria | `File:Kista torn 20141216.jpg` | stadsdelen |
| Stikkinikki Mariatorget | `File:Mariatorget thor.jpg` | torget |
| Sospeso Stockholm | `File:Stockholm.Mås (37512878734).jpg` | staden, plus en mås |

**Den verkliga relevanta täckningen är alltså inte 88 procent och inte 19 procent.
Den är i praktiken noll.** Licenserna på träffarna är däremot oproblematiska: CC
BY-SA 3.0 dominerar, sedan CC BY-SA 4.0, public domain, CC BY och CC0. Men en fri
licens på fel bild hjälper inte.

**Verdikt.** Commons duger inte. Varken som geografisk källa eller med
namnmatchning. Lägg ned spåret.

---

### A5. OpenStreetMap som bildkälla

Briefen frågar hur ofta `image` förekommer på svenska restauranger. **Mätt: 1 av
399 matchade POI:er i Karlstad och Jönköping.** Noll i Karlstad, en i Jönköping.

Och även den enda träffen vore oanvändbar: `image` pekar på en URL någon
annanstans, ofta Wikimedia men lika ofta en privat sajt, med okänd licens per rad
och utan löfte om att filen ligger kvar. Att visa den är att hotlinka en okänd fil
med okänd rätt.

OSM:s verkliga värde ligger inte i bilder utan i öppettider, telefon, webbplats och
kök. Det behandlas i del B, som är den delen som faktiskt bär.

---

### A6. Verksamhetens egna bilder, från ägaren

**Detta är redan byggt och det är byggt bra.** `community.image_uploads`, en privat
bucket `verksamhetsbilder-inkomna`, manuell granskning i `pipeline/moderate.py`,
och vid publicering kopieras filen till den publika bucketen och en rad skrivs i
`public.images` med `source='owner'`.

En viktig konsekvens som är lätt att missa: **ägaruppladdade bilder ligger redan
utanför Cloudflare Pages-bygget**, i Supabase Storage. De äter alltså inte av taket
på 20 000 filer. Arkitekturen är redan rätt, den behöver bara användas för fler
källor.

Begränsningen är täckning. En godkänd ägare per verksamhet, en manuell
registerkontroll per anspråk, och en ensam människa som granskar. Det ger de bästa
bilderna på sajten och det ger dem på kanske några hundra sidor, aldrig på 8 802.

---

### A7. Verksamhetens egen webbplats och `og:image`

Två frågor: får vi, och går det i skala.

**Får vi?** Skiljelinjen i EU-rätten är skarp och den går mellan att länka och att
kopiera.

- **Att bädda in** en bild som ligger fritt tillgänglig på restaurangens egen sajt,
  med rättighetshavarens samtycke, är enligt Svensson (C-466/12) och den praxis som
  följt inte en ny överföring till allmänheten och kräver inget tillstånd. Undantag
  enligt VG Bild-Kunst (C-392/19): om rättighetshavaren har vidtagit tekniska
  skyddsåtgärder mot inbäddning får de inte kringgås.
- **Att ladda ned bilden och lägga den hos oss** är enligt Renckhoff (C-161/17) en
  ny överföring till en ny publik, och kräver tillstånd. Det är alltså intrång att
  göra med og:image exakt det vi gör med Mapillary.

Vi får alltså hotlinka men inte lagra. Och hotlinka är sämre än det låter:

- Varje sidvisning skickar besökarens IP-adress till restaurangens webbserver eller
  dess CDN. Det är en tredjepartsöverföring som integritetspolicyn och
  cookiesidan i dag inte beskriver, och som `site/src/pages/cookies.astro` redan
  ställer frågan om för Mapillary.
- Bilden försvinner utan förvarning när sajten byggs om. Sidan går sönder tyst.
- En og:image är ofta en logotyp, en meny-PDF eller en generisk stockbild av en
  hamburgare. Den ger inte igenkänningen ägaren är ute efter.

**Går det i skala?** Nej, av en enkel anledning: **vi lagrar inga webbplatser.**
Det finns inget `website`-fält i `public.establishments`, och `schema_community.sql`
konstaterar redan det i sin kommentar om anspråksverifiering: `'domain_email'`
kan inte användas eftersom vi inte har domänen. Att först hitta 8 802 webbplatser
och sedan hämta og:image från var och en är två svåra steg, av vilka det första
löses bättre av OSM (del B).

**Verdikt.** Inte en bildkälla. Men webbplatsen i sig är en bra uppgift att visa,
och OSM kan ge oss den.

---

### A8. Sammanställning av bildkällorna

| källa | täckning mot vårt bestånd | kostnad | licens | 8 802 sidor? |
|---|---|---|---|---|
| **Mapillary** | **ej mätt, token saknas** | 0 | CC BY-SA, får lagras | sannolikt ja i städer |
| **Besökaruppladdning** | 0 i dag, spärrad | 0 | inskickarens, vi får rätt via villkoren | nej, lång svans |
| **Ägaruppladdning** | 0 i dag, byggd | 0 | ägarens | nej, några hundra |
| **Panoramax** | 11,5 % inom 60 m, 5,8 % inom 30 m | 0 | CC BY-SA 4.0, stabila URL:er | nej, komplement |
| **Wikimedia Commons** | 88 % geografiskt, i praktiken 0 relevant | 0 | CC, blandat | nej |
| **OSM `image`** | 1 av 399 matchade POI:er | 0 | okänd per rad | nej |
| **og:image** | kräver webbplats vi saknar | 0 | får bäddas in, ej lagras | nej |
| **Google Street View** | hela beståndet, tekniskt | ca 7 USD/1 000 | **får ej lagras, ej visas vid karta** | **nej, otillåtet** |
| **Google Places Photos** | hela beståndet, tekniskt | ca 500 USD/bygge | **ej tillåten användning i EES** | **nej, otillåtet** |

---

## Del B. Vad mer kan visas på sidan

Foton var frågan. Men samma sida saknar öppettider, telefon, webbplats och kök, och
det är sådant som gör en verksamhetssida till en verksamhetssida i stället för ett
myndighetsutdrag.

### B1. OpenStreetMap: öppettider, telefon, webbplats, kök, tillgänglighet

OSM har alla fyra på en del POI:er. Frågan är två: hur ofta, och går de alls att
para ihop med våra rader.

**Hopparningen är det svåra och det jag mätte.** Vi har namn och koordinat, OSM har
namn och koordinat. Matchning kräver att båda stämmer: minst hälften av
namnorden gemensamma efter normalisering, och högst 75 meters avstånd. Det är en
sträng tröskel med avsikt, för samma resonemang som rapport 12 för om
organisationsnummer gäller här: en felkopplad öppettid är sämre än ingen öppettid.

Kört i dag mot Karlstad och Jönköping:

| | Karlstad | Jönköping |
|---|---|---|
| våra rader med koordinat | 694 | 1 120 |
| varav publikvänd typ | 447 | 724 |
| OSM mat-POI:er i kommunen | 318 | 315 |
| **matchade** | **206** | **193** |
| andel av publikvända | **46,1 %** | **26,7 %** |

Och det här är vad OSM faktiskt bär på de matchade:

| tagg | Karlstad, andel av matchade | Jönköping, andel av matchade |
|---|---|---|
| `opening_hours` | 55,3 % | 33,2 % |
| `website` | 52,4 % | 30,6 % |
| `cuisine` | 34,5 % | 35,8 % |
| `outdoor_seating` | 38,8 % | 11,9 % |
| `wheelchair` | 37,9 % | 10,4 % |
| `brand` | 29,6 % | 28,5 % |
| `phone` | 29,1 % | 25,9 % |
| `takeaway` | 9,2 % | 10,9 % |
| `image` | 0 av 206 | 1 av 193 |

Räknat mot hela vårt bestånd med koordinat i respektive kommun landar det på
16,4 procent öppettider och 15,6 procent webbplats i Karlstad, 5,7 och 5,3 procent
i Jönköping.

**Tre saker att läsa ut ur den tabellen.** För det första: hopparningen fungerar.
Nästan hälften av Karlstads publikvända verksamheter går att matcha mot en OSM-POI
med både namn och läge. Det var inte givet. För det andra: skillnaden mellan
Karlstad och Jönköping är nästan dubbel, alltså är OSM:s kvalitet en lokalfråga och
ingen funktion som kan lovas jämnt över landet. För det tredje: **`image` är
1 av 399 matchade.** Det avgör A5 slutgiltigt. OSM har inga bilder åt oss.

En fullständig Overpass-körning över Stockholms kommun ger **4 268 mat-POI:er**
(restaurant, cafe, fast_food, bar, pub, ice_cream, samt bageri, livs, delikatess,
charkuteri, konditori). Storleksordningen är alltså god även där.

**Licensen är ODbL och den har en hake värd att förstå.** Attributionskravet är
enkelt: "© OpenStreetMap contributors" ska stå synligt. Haken är share-alike på
databasnivå. ODbL skiljer mellan:

- **Produced Work**, alltså den renderade sidan. Kräver bara attribution.
- **Derivative Database**, alltså vår databas med OSM-fält inbakade. Kräver
  share-alike, men bara om vi *publikt använder* den, alltså gör den tillgänglig
  för tredje part.

Vi publicerar sidor, inte databasen, så attribution räcker. **Men:** `site/src/data/*.json`
är 38 MB exporterad databas som ligger incheckad i repot. Repot är i dag privat
(verifierat med `gh repo view`), så frågan är sovande. **Blir repot någon gång
publikt vaknar den**, och då distribuerar vi en derivatdatabas som ska vara ODbL.
Enklaste motmedlet är att hålla OSM-härledda fält i en egen tabell och en egen
JSON-fil, så att gränsen mellan vår data och OSM:s går att peka på. Det är ett
billigt beslut att fatta nu och ett dyrt att backa senare.

**Kostnad.** Noll. Overpass är gratis men delad och skör: under den här
utredningen fick jag 504 Gateway Timeout upprepade gånger på kommunstora frågor
mot både `overpass-api.de` och `overpass.kumi.systems`. En nattlig pipeline ska
inte bero på Overpass. Rätt form är en Geofabrik-utdragsfil för Sverige, hämtad en
gång i veckan och matchad lokalt. Det är också snällare mot en gratis gemensam
resurs, samma resonemang som rapport 12 för om Stockholms e-tjänst.

**En andrahandsvinst som är lätt att missa:** får vi verksamheternas webbplatser
från OSM blir `'domain_email'` i `community.establishment_claims.verification_method`
plötsligt användbar. Den står i dag som omöjlig just för att vi saknar domänen. Att
kunna verifiera en ägare med ett mejl från restaurangens egen domän, i stället för
en manuell registerkontroll per anspråk, är skillnaden mellan att ägaruppladdning
skalar och inte.

### B2. Verksamhetstyp och kök

Vi har kommunernas egna typfält, och de är inte normaliserade. Så här ser det ut
mätt i dag, de vanligaste värdena i `types`:

| värde | antal |
|---|---|
| 1. Restaurang | 2 854 |
| Restaurang och servering | 2 026 |
| Restaurang | 1 121 |
| 1. Butik | 1 069 |
| Skola och omsorg | 991 |
| 1. Café | 960 |
| Butik | 742 |
| Skolor, förskolor och annan omsorg | 501 |
| 1. Snabbmatsrestaurang | 488 |
| Café | 413 |
| Pizzeria | 206 |

Tre olika stavningar av "restaurang" med sammanlagt 6 001 rader, tre av "café",
tre av "butik". Det är inte 12 kommuner som är oense om innehållet, det är 12
kommuner som är oense om etiketten. `site/src/lib/categories.ts` finns redan och
gör en normalisering, och den är rätt plats att fortsätta i.

Men **kök**, alltså om det är sushi, thai eller pizza, finns inte i kommunernas
data överhuvudtaget. Bara Jönköping har "Pizzeria" som egen typ, 206 rader.
`cuisine` i OSM är den enda källan till kök som är gratis och laglig, och den är
värdefull just för att den är det enda som kan bära den filtrering på
verksamhetstyp som ligger parkerad till designfasen.

### B3. Prisklass, tillgänglighet, uteservering

- **Prisklass** finns inte i någon fri källa. OSM har ingen prisnivåtagg som
  används i praktiken i Sverige. Google har den och Google är stängt. **Lägg ned
  den här idén.**
- **Tillgänglighet** finns som `wheelchair` i OSM, med värdena `yes`, `limited`,
  `no`. Den är särskilt värd att visa eftersom den är svår att hitta någon
  annanstans och betyder mycket för den som behöver den.
- **Uteservering** finns som `outdoor_seating` i OSM. Trevlig men inte viktig.

För alla tre gäller samma sak: de är bara värda något om hopparningen i B1 håller.

### B4. Serveringstillstånd för alkohol

Briefen frågar om det finns samlat någonstans. **Det gör det.**

Folkhälsomyndigheten för enligt alkohollagen ett centralt register,
Alkohol- och tobaksregistret. Kommunerna är skyldiga att skicka kopia av sina
beslut om serveringstillstånd dit, enligt 9 kap. 7 § alkohollagen. Registret
innehåller sedan 2008 gällande och avslutade stadigvarande serveringstillstånd,
partihandlare, godkända upplagshavare och de årliga restaurangrapporterna.

Det är alltså exakt samma offentlighetslogik som kontrolldatan: kommunala beslut,
inrapporterade till en myndighet, hos en myndighet som lyder under
offentlighetsprincipen och öppna data-lagen (2022:818). Rapport 12 del E1 är
grunden och den bär här också.

**Vad jag inte kunnat verifiera:** om registret har ett publikt sökgränssnitt,
en nedladdningsbar fil eller ett API. Jag hittade ingen sådan ingång.
Folkhälsomyndighetens publika sidor beskriver registret och statistiken ur det, men
inte en maskinläsbar väg in. Sannolikt är rätt väg en utlämnandebegäran, samma
förfarande som mot kommunerna.

**Varför det är intressant:** ett serveringstillstånd är en stark och neutral
faktauppgift bredvid hygienbedömningen, den ökar sidans SEO-tyngd, och den är en
enda begäran mot en enda myndighet i stället för 275 kommunbrev. Det är den bästa
kvoten mellan värde och insats i hela del B. Men den ska inte ligga i topp tre
eftersom den inte ger bilder och eftersom svarstiden inte går att styra.

---

## Del C. Besökaruppladdning: vad spärren ska bytas mot

Ägaren vill att besökare ska kunna ladda upp bilder, som en del av omdömet. Det är
den enda vägen till bilder inifrån lokalen som fungerar i skala. Här är vad som
faktiskt står i vägen och vad det ska bytas mot.

### C1. Spärren i dag

`pipeline/schema_community.sql`, policyn `inkomna_upload_own` på `storage.objects`:

```sql
and exists (
    select 1 from community.establishment_claims c
    where c.user_id = auth.uid() and c.status = 'published'
)
```

Motsvarande villkor står i `image_uploads_insert` på `community.image_uploads`, där
det dessutom är knutet till just den verksamheten. Med de raderna kan ingen vanlig
besökare skriva någonting alls.

### C2. Det som är farligare än spärren: skrivordningen

`site/src/lib/community.ts` skriver **filen först och raden sedan**, och motiverar
det i en kommentar: en fil utan rad är osynlig för alla, medan en rad utan fil hade
sett ut som en väntande bild i granskningen.

Det resonemanget var riktigt så länge bara registerkontrollerade ägare kunde
skriva. **Med öppen uppladdning vänder det.** Storage-policyn kontrollerar bara
att mappen tillhör användaren. Räknar vi kvoten på raderna i `image_uploads`, men
filen skrivs innan raden, kan vem som helst med ett konto skriva tusen filer i
bucketen och aldrig skapa en enda rad. Kvoten skulle vakta en dörr som ingen
behöver gå igenom.

**Vänd ordningen.** Skriv raden först, med en klientgenererad `storage_path`, och
låt sedan storage-policyn kräva att det finns en väntande rad som pekar på exakt
den sökvägen:

```sql
create policy "inkomna_upload_own" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'verksamhetsbilder-inkomna'
        and exists (
            select 1 from community.image_uploads u
            where u.user_id = auth.uid()
              and u.storage_path = storage.objects.name
              and u.status = 'pending'
        )
    );
```

Då är bucketen stängd som förval. Ingen fil kan hamna där utan att databasen först
delat ut en plats, och kvoten sitter på radinsättningen där den kan skrivas i vanlig
SQL utan att riskera rekursion mot `storage.objects` egna policyer.

Felläget blir en tom plats i granskningskön i stället för en oredovisad fil. Det är
den ofarliga riktningen nu. Låt pipelinen städa rader som saknar fil efter en
timme.

### C3. Kvoterna

Tre gränser, alla i `with check` på `community.image_uploads`:

- **Fem bilder per dygn och konto.** Skyddar lagringen och granskningskön mot en
  enskild person.
- **Tre bilder per verksamhet och konto, för alltid**, räknat exklusive avslagna.
  Skyddar en enskild verksamhet mot att bli nedtryckt av en person.
- **Högst tio öppna `pending` samtidigt per konto.** Detta är den viktigaste av de
  tre. Granskningen är en ensam människa. En kö som går att fylla snabbare än den
  töms är i praktiken en avstängning av funktionen.

Kvoterna ska stå i policyn, inte i klienten. Det är samma skillnad som
`schema_community.sql` redan formulerar på annat håll: "vi visar inte formuläret"
mot "databasen vägrar ta emot raden".

### C4. Bilden ska höra ihop med omdömet, och texten ska vara obligatorisk

Briefen ber om ställningstagande. **Kräv text.**

Så ser de andra ut: Google tillåter foto utan text. Yelp tillåter foto skilt från
omdöme men kräver text i själva omdömet. TheFork binder ihop dem hårdare.
Rekommendationen är TheFork-änden, av tre skäl som är specifika för oss:

1. **Granskningen är en person.** Foto utan text är det svåraste möjliga
   granskningsärendet: ingen kontext, ingen förklaring, ingen ledtråd om vad man
   tittar på. Med tjugo tecken text vet granskaren om det är disken, skylten eller
   en tallrik.
2. **Omdömen är numera anonyma.** Vyn skriver "Besökare" och inget namn skickas.
   Då är det enda som återstår av ansvar att någon faktiskt skrivit något om
   stället. Ett foto utan text från ett anonymt konto är den lägsta möjliga
   tröskeln för att lägga en bild på någon annans näringsverksamhet.
3. **Kvoten faller ut gratis.** `community.reviews` har redan
   `unique (user_id, establishment_id)` och `body` mellan 20 och 2 000 tecken. Ett
   omdöme per person och ställe ger automatiskt taket på tre bilder per person och
   ställe.

Konkret: lägg till `review_id uuid` på `community.image_uploads` och kräv i policyn
antingen ett godkänt anspråk på verksamheten, alltså ägarvägen som finns i dag,
eller ett eget omdöme på just den verksamheten:

```sql
and (
    exists (select 1 from community.establishment_claims c
            where c.user_id = auth.uid()
              and c.establishment_id = image_uploads.establishment_id
              and c.status = 'published')
    or exists (select 1 from community.reviews r
               where r.id = image_uploads.review_id
                 and r.user_id = auth.uid()
                 and r.establishment_id = image_uploads.establishment_id)
)
```

Granska omdöme och bild som **en enhet**. Avslås texten avslås bilden med den.

### C5. Vad anonymiteten gör med bilder, och som måste åtgärdas

Att omdömen blev anonyma är en större förändring för bilder än för text, och två
saker följer direkt.

**EXIF måste rensas. Detta är nu ett måste, inte en förbättring.**
`schema_community.sql` skriver ärligt ut att det inte finns någon EXIF-rensning. Ett
mobilfoto bär GPS-koordinat, tidsstämpel, kameramodell och ibland serienummer. Om
en anonym besökares bild publiceras med EXIF intakt kan personen spåras, och vi har
lovat anonymitet. Rensningen hör hemma i `moderate.py` vid publicering, där filen
ändå kopieras, och den bör också göras vid uppladdning så att inte ens den privata
bucketen bär datan längre än nödvändigt.

**Ansiktena.** En interiörbild från en restaurang innehåller nästan alltid gäster
och personal. Det är personuppgifter, och även med utgivningsbevis är det en
bedömningsfråga snarare än en rättighet. Skriv in en regel för granskaren: avslå
bilder där en enskild person är identifierbar och är motivet.

### C6. Den risk som inte går att bygga bort

En anonym person kan ladda upp en bild av ett smutsigt kök som **inte är den här
restaurangens** och binda den till ett dåligt hygienbetyg. Det finns ingen teknisk
kontroll som avslöjar det. Dämpningarna är de som redan finns eller föreslås ovan:
texten som kontext, originalet som ligger kvar i den privata bucketen som underlag,
manuell granskning, och ägarens möjlighet att göra anspråk och begära bort. Det ska
stå i klartext för ägaren att detta är den kvarvarande risken med öppen
uppladdning, för den är priset för funktionen.

### C6b. BYGGT 2026-08-05, och vad som ändrades mot planen ovan

Del C är genomförd. Fyra saker blev annorlunda än vad texten ovan föreslår, och
alla fyra är medvetna.

**Ägaren är utestängd från besökarflödet, inte inbjuden till det.** C4 föreslår
att policyn ska släppa in antingen ett godkänt anspråk eller ett eget omdöme.
Ägaren har beslutat motsatsen: `image_uploads_insert` kräver ett eget omdöme och
kräver dessutom att uppladdaren INTE har ett godkänt anspråk på just den
verksamheten. Skälet är att verksamhetens egna bilder och gästernas inte är
samma sorts uppgift och inte ska kunna förväxlas. Ägarens ord: "restaurangägare
kan ladda upp bilder men inte under omdömessidan, istället får fixa en pro
tjänst senare där företagen kan få snygga till deras sida."

**Ägarens bildyta är därmed PARKERAD, och parkerad med avsikt.** Den byggs inte
nu, inte i någon halv form och inte som ett gömt fält. Det som en gång fanns,
alltså uppladdning för den som fått ett anspråk godkänt, är borttaget och inte
avstängt. Skälet att inte lämna kvar en halv version är detsamma som gäller
OAuth-knapparna i `community.ts`: en yta som finns men säger nej är sämre än en
yta som inte finns. När proytan byggs är den en egen funktion med egen
uppladdning, egen granskning och en egen rad i `public.images` med
`source='owner'`, inte ett undantag i besökarnas policy.

**Bilder går ALDRIG in i `public.images`.** C7 nedan förutsätter att de gör det
och att `'visitor'` därför måste läggas till i kolumnens check-villkor. Det
behövs inte. En besökares bild är användarinnehåll och ligger på samma sida om
gränsen som omdömena: i schemat `community`, läst i webbläsaren ur vyn
`community.published_images`, aldrig i ett bygge. `public.images` är
redaktionellt material som byggs in i sidorna, och att blanda in
användaruppladdningar där hade varit precis den sammanblandning
`schema_community.sql` finns för att förhindra. Kolumnen `attribution` behöver
därför inte heller någon ny sträng: en publicerad bild bär ingen uppgift alls om
vem som skickat in den, vilket är vad anonymiteten kräver.

**EXIF rensas vid UPPLADDNING, inte vid publicering.** C5 föreslår
`moderate.py`. Det blev webbläsaren i stället, som en följd av komprimeringen:
bilden ritas om på en canvas innan den skickas, och en canvas bär ingen
metadata. Det är bättre än planen, för då finns koordinaten inte ens i den
privata bucketen. Den som en dag flyttar eller tar bort komprimeringen måste
veta att den bär den här funktionen också, och det står utskrivet vid `shrink()`
i `site/src/lib/community.ts`.

Kvar av C som INTE är byggt: ingen städning av rader vars fil aldrig kom fram.
Klienten tar bort sin egen rad när en uppladdning faller, vilket täcker det
vanliga fallet, men en webbläsare som stängs mitt i lämnar en tom plats i
granskningskön. Den syns som ett ärende utan bild och kan avslås för hand.

### C7. Två småsaker som annars stoppar bygget

- `public.images.source` har en check-villkor som bara tillåter
  `('mapillary', 'owner', 'own', 'wikimedia')`. `'visitor'` och `'panoramax'` måste
  läggas till, annars faller `moderate.py` på sista raden.
- `public.images.attribution` sätts i dag till "Verksamhetens egen bild". För en
  besökarbild ska den läsa "Inskickad av en besökare", aldrig ett namn, eftersom
  omdömen är anonyma.

---

## Del D. Formen: var bilderna ska ligga

Detta är den bindande gränsen i briefen, och den är räknad.

**Bygget ligger på 16 466 filer.** Cloudflare Pages gratisplan tar 20 000 per sajt,
med 25 MiB per fil och 500 byggen per månad. Fördelningen i `site/dist`:

| typ | antal |
|---|---|
| html | 16 390 |
| webp | 48 |
| js | 11 |
| css | 4 |
| övrigt | 13 |

**Marginalen är 3 534 filer.** 8 802 verksamheter behöver en bild. Att checka in
bilderna i repot spränger taket med råge, redan innan nästa kommun läggs till.
Frågan är inte "hur många får plats", den är "var ska de ligga i stället".

**Svaret är objektlagring utanför bygget**, och den arkitekturen finns redan:
`moderate.py` lägger ägarbilder i Supabase Storage och skriver en absolut URL till
`public.images.url`. HTML:en refererar den. Noll filer i bygget, noll anrop vid
sidvisning, ingen extra rundtur.

Vilken lagring:

| | gratis lagring | utgående trafik | anmärkning |
|---|---|---|---|
| **Cloudflare R2** | 10 GB/mån | **gratis, obegränsat** | 1 M Class A, 10 M Class B per månad |
| **Supabase Storage** | 1 GB | 5 GB cachad + 5 GB ocachad | redan i bruk för ägarbilder |

8 802 bilder à cirka 60 kB WebP är ungefär 530 MB. Det ryms i Supabase, men med
liten marginal och med ett trafiktak som en artikel i lokalpressen kan spränga. R2
har tio gånger lagringen och **ingen utgående trafikavgift alls**, vilket är exakt
rätt egenskap för en sajt som lever på söktrafik. Ligger det dessutom på Cloudflare
sedan tidigare är det ingen ny leverantör.

**Rekommendation:** R2 för pipelinehämtade bilder, Supabase Storage kvar för
inskickade bilder eftersom moderering och radsäkerhet redan sitter där.
`moderate.py` kan kopiera till R2 vid publicering om trafiken någon gång kräver
det.

**Formen på hämtningen:** en gång per verksamhet, aldrig per bygge. Pipelinen
frågar efter bild bara för rader som saknar en i `public.images`. Första körningen
är 8 802 anrop utspridda över en natt eller flera. Därefter är det bara nya
verksamheter, alltså några dussin. Det uppfyller båda gränserna i briefen: inget
anrop per sidvisning, och inga 16 000 anrop per bygge.

---

## Osäkerheter jag inte kunnat verifiera

- ~~**Mapillarys täckning mot vårt bestånd.**~~ **BESVARAD**, och svaret blev
  betydligt bättre än den första mätningen visade. Mätningen 2026-08-04 gav 42,0
  procent inom 60 meter, men både den och `matt_bildtackning.py` bad Mapillary om
  bara 50 bilder per punkt. API:t sorterar inte svaret efter avstånd, så på en
  innerstadsgata med flera hundra bilder inom hundra meter var det slumpen som
  avgjorde om den närmaste kom med. Med den rättade frågan
  (`pipeline/matt_troskel.py`, 200 verksamheter, 2026-08-05) och med ALLA grindar
  på, alltså avstånd, kamerariktning, dagsljus och bort med 360:

  | inom | täckning |
  |---|---|
  | 20 m | 50,5 % |
  | 30 m | 63,0 % |
  | 40 m | 71,5 % |
  | 60 m | 79,0 % |

  Vald tröskel är 30 meter. Den bild som faktiskt väljs ligger på 15,9 meters
  median, så taket binder sällan; det tar bort de fall där ingenting närmare
  fanns. Per kommun vid 30 meter är Stockholm högst och Karlstad lägst.
  `matt_bildtackning.py` har kvar den gamla gränsen och underskattar därför
  täckningen; den är inte längre den mätning man ska gå på.
- **Vilken VERSION av CC BY-SA Mapillary-bilder ligger under.** Villkoren
  (mapillary.com/terms, avsnitt 3, kontrollerat 2026-08-05) säger ordagrant
  "subject to the Creative Commons Share Alike (CC BY-SA) license" och nämner ingen
  version. 4.0 uppges stå i en hjälpartikel, men `help.mapillary.com` svarar 403 på
  maskinella anrop och gick inte att läsa som primärkälla. Pipelinen skriver därför
  `CC-BY-SA` utan version för Mapillary, och sajten länkar licensraden till
  villkoren i stället för till en versionsdeklaration vi inte kan belägga. Öppna
  hjälpartikeln i en riktig webbläsare, och står 4.0 där kan `MAPILLARY_LICENCE` i
  `pipeline/prikko/imagery.py` uppdateras på ett ställe.
- **Om någon av de bilder vi hämtar ligger under CC BY-NC-SA.** Samma mening i
  avsnitt 3 fortsätter "unless we indicate otherwise" och ger som exempel
  datamängder under CC BY-NC-SA, alltså med förbud mot kommersiell användning.
  Prikko är kommersiell. Mapillarys bild-API har ingen licensuppgift per bild, så
  det går inte att skilja dem maskinellt, och något dokumenterat sätt att göra det
  finns inte. Bedömningen bakom att vi ändå hämtar: undantaget är formulerat om
  särskilt tillhandahållna datamängder, inte om enskilda bilder ur det vanliga
  API:t, som avsnitt 11 uttryckligen förutser att man laddar ned och serverar
  själv. Det är en bedömning och inte ett belägg, och den är ägarens att ta.
- **OSM-hopparningen är mätt men bara på två kommuner, och matchningen är inte
  granskad manuellt.** 46,1 procent i Karlstad och 26,7 procent i Jönköping är
  automatiska matchningar på namnord plus avstånd. Hur många av dem som är rätt har
  jag inte kontrollerat för hand. Innan öppettider publiceras bör ett stickprov på
  femtio matchningar ögonkollas, av samma skäl som rapport 12 anger för
  organisationsnummer: ett felkopplat fält är värre än ett tomt.
- **Overpass går inte att lita på för en nattlig pipeline.** Under utredningen
  svarade både `overpass-api.de` och `overpass.kumi.systems` med upprepade 504 och
  502 på kommunstora frågor, och en fullständig 12-kommunerskörning gick aldrig
  igenom. Det är i sig ett resultat, inte bara en olägenhet. Använd en
  Geofabrik-utdragsfil.
- **Alkohol- och tobaksregistrets maskinläsbarhet.** Att registret finns och vad det
  innehåller är verifierat mot Folkhälsomyndighetens egna sidor. Om det finns ett
  API, en nedladdningsfil eller bara en utlämnandebegäran har jag inte kunnat
  fastställa.
- **Om en `select` mot `storage.objects` inuti en policy på `storage.objects` går
  att skriva utan rekursionsproblem i Supabases nuvarande version.** Förslaget i C2
  undviker frågan genom att låta policyn läsa `community.image_uploads` i stället,
  men om någon vill räkna kvoten direkt på filerna behöver det provas.
- **Exakt hur länge Mapillarys signerade miniatyr-URL:er lever.** Att de har en TTL
  och går ut är bekräftat av Mapillary själva och av användarrapporter. Den exakta
  livslängden har jag inte kunnat läsa ut, och den spelar heller ingen roll:
  slutsatsen är att de inte får sparas oavsett.
- **Googles pris i EES-specifika listor.** Siffrorna ovan är hämtade ur Googles
  huvudprislista. Eftersom slutsatsen är att Google inte får användas alls lade jag
  inte tid på att kontrollera om EES-listan avviker.

---

## Rekommendation: de tre första sakerna, i ordning

Rankat efter kvot mellan värde och insats, för en ensam utvecklare.

**0. Innan något annat: skaffa en Mapillary-token och kör mätskriptet. Tio
minuter.** Det är inte en av de tre, det är förutsättningen för att veta om den
första är rätt. Gratis konto på mapillary.com, Settings → Developers, klistra in i
`site/.env`, kör `python3 pipeline/matt_bildtackning.py`. Utfallet avgör om punkt 1
är en helg eller ett nedlagt spår.

**1. Bygg gatubildsvägen färdig för en kommun, med rätt lagring.** En helg.

Detta är den enda källan som kan ge en bild till tusentals sidor gratis och lagligt,
och den är halvbyggd. Fyra saker ingår, och de tre första måste göras oavsett vilken
bildkälla som vinner i längden:

- Ladda ned bildens bytes i pipelinen i stället för att spara Mapillarys URL. Dagens
  konstruktion går sönder av sig själv när den signerade URL:en går ut.
- Lägg bilderna i Cloudflare R2, aldrig i repot. Bygget har 3 534 filers marginal och
  behöver 8 802 bilder.
- Rätta attributionen i `StreetPhoto.astro`: Mapillarys villkor kräver logotypen,
  inte bara en textlänk.
- Kör mot Stockholm först, 8 511 rader med koordinat, och lägg Panoramax som
  andrahandskälla. Se sedan hur sidan ser ut. Sidan måste se hel ut även utan bild,
  för det kommer den att vara på de flesta ställen.

**2. Öppna bilduppladdningen för besökare, bunden till omdömet.** En helg.

Detta är vad ägaren bad om och den enda lagliga vägen till bilder inifrån lokalen.
Ordningen på arbetet, och den spelar roll:

- Vänd skrivordningen i `community.ts`: rad först, fil sedan. Utan det steget är
  varje kvot verkningslös.
- Byt anspråkskravet i `inkomna_upload_own` mot villkoret att det finns en väntande
  rad som pekar på just den sökvägen.
- Lägg kvoterna i `image_uploads_insert`: fem per dygn, tre per verksamhet, tio
  öppna samtidigt.
- Lägg till `review_id` och kräv ett eget omdöme på verksamheten. Granska text och
  bild som en enhet.
- Rensa EXIF vid publicering. Med anonyma omdömen är detta inte längre valfritt.
- Lägg till `'visitor'` i check-villkoret på `public.images.source` och sätt
  attributionen till "Inskickad av en besökare".

**3. Anrika med OpenStreetMap: webbplats, telefon, öppettider, kök,
tillgänglighet.** Två till tre dagar.

Gratis, lagligt, och mätt: 46,1 procent av Karlstads publikvända verksamheter går
att matcha, och av dem har 55,3 procent öppettider och 52,4 procent webbplats. Det
fyller resten av sidan som i dag är tom.

Kör mot en Geofabrik-utdragsfil för Sverige, inte mot Overpass, som svarade 502 och
504 genom hela den här utredningen. Matcha på namn plus koordinat inom 75 meter, och
håll de OSM-härledda fälten i en egen tabell så att ODbL-gränsen går att peka på om
repot någon gång blir publikt. "© OpenStreetMap contributors" i sidfoten. Ögonkolla
femtio matchningar innan något publiceras.

Den här punkten har en andrahandsvinst som är värd mer än den ser ut: med
verksamheternas webbplatser i databasen blir `'domain_email'`-verifieringen av
ägaranspråk möjlig, och den står i dag utskriven som omöjlig just för att vi saknar
domänen. Det är skillnaden mellan att ägaruppladdning kräver en manuell
registerkontroll per anspråk och att den skalar.

**Det som medvetet INTE ligger i topp tre:**

- **Google, i varje form.** Det är inte en prisfråga. Places-foton är inte en
  tillåten användning i EES, Street View får inte visas bredvid vår karta, och
  ingendera får lagras. Lägg ned spåret helt och lägg inte mer tid på det.
- **Wikimedia Commons.** 88 procent geografisk träff och nära noll relevant träff.
  Den siffran är en fälla och inte en möjlighet.
- **og:image från restaurangernas egna sajter.** Får bäddas in men inte lagras, ger
  ofta en logotyp i stället för en fasad, läcker besökarens IP till tredje part, och
  kräver dessutom webbplatser vi inte har. Punkt 3 ger oss webbplatserna; ta frågan
  igen då, om den fortfarande känns angelägen.
- **Alkoholtillståndet.** Bäst kvot i del B och rätt sak att begära ut, men den ger
  inga bilder och svarstiden går inte att styra. Skicka begäran, men räkna inte med
  den.
