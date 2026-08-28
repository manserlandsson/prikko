# 28. Gatubilder: vad som finns, vad Google kostar, vad Mapillary täcker

Datum: 2026-08-13, rättad 2026-08-28. Alla tal om vårt eget bestånd är körda mot
databasen och mot `site/src/data/*.json` samma dag, utom täckningstalen i del C,
som är omräknade 2026-08-26 och rättade här den 28:e. Alla licensvillkor är hämtade ur källans egen
text samma dag och citeras ordagrant på den punkt som avgör. Där jag inte kunnat
mäta står det utskrivet.

Rapport 13 är utredningen bakom bildfrågan i stort och upprepas inte här. Den
här rapporten svarar på tre saker som stod öppna i den: vad Google faktiskt
kostar och tillåter i dag, hur stor Mapillarys täckning är kommun för kommun,
och var bilderna ska ligga när R2 inte är uppsatt.

> ## STATUS 2026-08-27: GATUBILDER ÄR AVSTÄLLDA
>
> Ägaren gick igenom granskningskön och **avvisade alla 48 kandidater**. Ingen
> gatubild är publicerad och ingen ska publiceras förrän urvalsproblemet i
> **del C8** är löst. Skälet är inte täckningen, som tvärtom visade sig vara
> högre än rapporten först skrev, utan vad bilderna föreställer.
>
> Resten av rapporten står kvar, för mätningarna är riktiga och kostar
> ingenting att läsa om. Det som är omkullkastat är slutsatsen i del E, och
> den är omskriven där.

---

## Kort sammanfattning

**Beställningen.** Ägaren: "kan vi fixa bilder på restaurangerna på något vis?
typ google street views för varje restaurang eller något."

**Läget innan.** Inte 58 procent utan hundra. `public.images` har noll rader och
ingen datafil bär ett enda `image`-fält. Hela kedjan är byggd, inklusive
komponenten som visar bilden och attributionen, och ingen bild har någonsin
hämtats. Det som stoppade var inte kod utan en lagring.

**Google är stängt, och det är fortfarande inte en prisfråga.** Tre av varandra
oberoende spärrar, alla kontrollerade i Googles egen text i dag. Priset är
dessutom inte det man tror: en engångshämtning av HELA beståndet skulle kosta
42 dollar. Det är förbudet mot att lagra bilden som gör den till en avgift per
sidvisning, och då växer notan med precis det vi bygger sajten för att få.

**Mapillary bär funktionen, men ojämnt.** **60,0 procent** av de 8 830
publikvända verksamheterna med koordinat har en gatubild inom trettio meter,
alltså 5 298 rader av 8 830. Spannet mellan kommunerna går från 75,4 procent i
Stockholm till 3,6 i Karlstad, och Stockholm står ensamt för 82 procent av alla
bilder funktionen ger. Det ska sägas rakt ut: det här är en Stockholmsfunktion
med utlöpare, inte en rikstäckande funktion.

**Talet är RÄKNAT och inte skattat, och det är därför det ändrats.** Här stod
49,2 procent, mätt på ett stratifierat urval om sextio rader per kommun, alltså
480 mätpunkter. Sedan dess är varenda rad frågad, och skillnaden sitter nästan
helt i Stockholm. Hela jämförelsen står i C2.

**Och taket gäller kandidater, inte publicerbara foton.** Sextio procent är
andelen rader där geometrin säger att en kamera stod nära nog och pekade åt
rätt håll. Hur många av dem som visar en fasad någon känner igen är en annan
fråga, och svaret på den är det som stängde spåret. Se C8.

**Lagringen är löst utan ägarens nycklar.** Supabase Storage är inkopplad,
provkörd hela vägen och skriver mot en publik hink. R2 är fortfarande målet och
väljs automatiskt så snart nycklarna finns. Bilderna ligger i objektlagring och
tar därför noll filer av Cloudflare Pages tak.

---

## Del A. Vad som redan fanns

Mer än det ser ut. Det här är byggt och fungerar:

| del | fil | läge |
|---|---|---|
| sökning i Mapillary och Panoramax | `pipeline/prikko/imagery.py` | klar |
| grindar: avstånd, kamerariktning, dagsljus, bort med 360 | samma | klar |
| hämtning, nedskalning till 1024 px WebP | samma | klar |
| objektlagring, R2 med S3-signering | `pipeline/prikko/imagestore.py` | klar, saknar nycklar |
| körskriptet, ett anrop per verksamhet | `pipeline/hamta_gatubilder.py` | klar |
| visning, bildtext, licensrad, Mapillarys logotyp | `site/src/components/StreetPhoto.astro` | klar |
| logotypfilen villkoren kräver | `site/src/brand/mapillary-logo.png` | på plats |

Två saker var trasiga och är rättade i den här omgången. Båda var tysta, alltså
den sortens fel som inte syns förrän man mäter utfallet.

**Mapillary-token sönderdelades av skalet.** Tokenen har formen
`MLY|<id>|<hemlighet>`, och lodstrecken är rörtecken. Den dokumenterade raden
`set -a && . ~/.prikko-env && set +a` satte alltså variabeln till ingenting,
skrev två rader "command not found" och lät skriptet fortsätta. Skriptet föll då
tillbaka på enbart Panoramax, som täcker en bråkdel. Mätt på fyrtio
verksamheter i Linköping: **noll bilder med den sönderdelade tokenen, tjugo med
den hela.** En skarp körning hade alltså hämtat nästan inga bilder och sett ut
att lyckas. Skriptet läser nu `site/.env` som reserv, se `mapillary_token()`.

**Mätskriptet kunde inte svara på frågan "räcker det i en mindre ort".** Urvalet
var proportionellt mot beståndet, och Stockholm är 65 procent av det, så ett
urval om 400 gav fem rader i Oskarshamn. `matt_troskel.py --per-kommun` tar nu
lika många ur varje kommun och väger tillbaka till en rikssiffra efteråt.

---

## Del B. Google Street View: vad det kostar och vad det tillåter

Det här är den fråga ägaren ställde rakt ut, så den är utredd i sin helhet mot
primärkällan i dag, inte mot minnet.

### B1. Priset, och varför det är den minst intressanta delen

Ur Googles egen prislista, hämtad 2026-08-13:

| SKU | gratis per månad | pris per 1 000 |
|---|---|---|
| Street View Static (9BD0-A2EE-44C3) | 10 000 | 7,00 USD |
| Street View Metadata (3168-48A9-5C8C) | obegränsat | gratis |
| Dynamic Street View (658E-F885-E11A) | 5 000 | 14,00 USD |
| Maps Embed API, inklusive Street View-läge | obegränsat | **gratis** |

**Som engångshämtning vore det nästan gratis.** Om vi fick hämta bilderna en
gång och lagra dem, precis som vi gör med Mapillary:

| vad | anrop | betalda | kostnad |
|---|---|---|---|
| hela beståndet | 15 983 | 5 983 | **41,88 USD, en gång** |
| publikvända | 10 070 | 70 | 0,49 USD |
| publikvända med koordinat | 8 830 | 0 | **0 USD** |

Det är värt att stanna vid. Den arkitektur vi faktiskt vill ha kostar noll
kronor hos Google. Priset har aldrig varit spärren.

**Som anrop per sidvisning, vilket är det enda villkoren tillåter**, ser det ut
så här. Varje visning av en sida som visar en bild är ett betalt anrop:

| sidvisningar per månad | betalda anrop | kostnad per månad | per år |
|---|---|---|---|
| 10 000 | 0 | 0 USD | 0 |
| 50 000 | 40 000 | 280 USD | 3 360 USD |
| 100 000 | 90 000 | 630 USD | 7 560 USD |
| 500 000 | 490 000 | 3 430 USD | 41 160 USD |
| 1 000 000 | 990 000 | 6 930 USD | 83 160 USD |

Det är den kostnadskurva man minst av allt vill ha på en sajt som lever på
söktrafik: den växer exakt i takt med att sajten lyckas. Varje ny besökare
Google skickar till oss är en avgift till Google.

**Och en sak till som sällan står i kalkylerna.** Ett anrop per sidvisning
betyder att adressen med API-nyckeln i står i HTML-koden på 16 000 publika
sidor. Nyckeln går att kopiera av vem som helst och notan är ägarens.
Hänvisningsbegränsning dämpar men löser inte, eftersom sidorna är publika.

### B2. Villkoren, tre spärrar, alla kontrollerade i dag

**Spärr 1: bilden får inte lagras.** Google Maps Platform Terms of Service,
avsnitt 3.2.3, hämtat 2026-08-13:

> "**No Scraping.** Customer will not export, extract, or otherwise scrape
> Google Maps Content for use outside the Services. For example, Customer will
> not: (i) pre-fetch, index, store, reshare, or rehost Google Maps Content
> outside the services; (ii) bulk download Google Maps tiles, Street View
> images, geocodes, ..."

> "**No Caching.** Customer will not cache Google Maps Content except as
> expressly permitted under the Maps Service Specific Terms."

Vad som uttryckligen får sparas är uppräknat och rör inga bilder: "Customer may
cache (a) `place_id` ..., (b) `pano_ID`, from Street View Static API, and (c)
`video_ID` from Aerial View API." Alltså identiteten på panoramat, aldrig
panoramat.

Punkt (ii) beskriver ordagrant den enda arkitektur som fungerar för en statiskt
byggd sajt. Det är därför tabellen ovan ser ut som den gör.

**Spärr 2: Street View får inte visas bredvid en karta.** EES Service Specific
Terms, som gäller oss eftersom faktureringslandet ligger i EES. Avsnitt 22,
hela texten:

> "**22. Street View Static API. 22.1 No Use With any Map.** Customer may not
> use any Google Maps Content from the Street View Static API With any Map."

Och `With any Map` är ett definierat begrepp:

> "'With any Map' means to (1) display Google Maps Content on, next to, or in a
> manner that is visually associated with any map, including a Google Map; or
> (2) link Google Maps Content to any map or link any map to Google Maps
> Content, unless the specific map being linked to is the source of the
> applicable Google Maps Content."

Vår verksamhetssida visar `StreetPhoto` ovanför kartan. Det är ordagrant "on,
next to, or visually associated with any map". Det finns ingen version av sidan
som både har kartan och en Street View-bild och är avtalsenlig.

**Spärr 3: en katalogtjänst får inte använda tjänsterna alls.** Huvudavtalets
3.2.3(d):

> "Customer will not: ... (iii) use the Google Maps Core Services in a
> **listings or directory service** or to create or augment an advertising
> product"

Prikko är per definition en listings-tjänst. Och "Google Maps Core Services" är
definierat som tjänsterna i Googles egen lista, som jag kontrollerade i dag:
Street View Static API står med, liksom Maps Embed API. Listan är senast ändrad
22 april 2026.

**Det stänger också den gratis vägen.** Maps Embed API kostar ingenting alls,
har obegränsad användning, kan visa ett Street View-panorama, och har inget
"No Use With any Map"-villkor i EES-texten. Den ser vid första anblicken ut som
kryphålet. Den är en Core Service, så spärr 3 gäller den, och tre saker till
talar emot även om man vore villig att tolka spärr 3 välvilligt:

- Det är en iframe till google.com på varje sidvisning. Besökarens IP-adress
  och kakor går till Google. Det kräver samtycke innan den laddas, och
  `StreetPhoto.astro` är uttryckligen byggd som motsatsen: "utan knapp att
  klicka, utan iframe och utan samtycke".
- Det är ett interaktivt panorama på några hundra kilobyte skript, inte ett
  foto på femtio kilobyte. På 16 000 SEO-sidor är det sidans tyngsta sak.
- Det ger oss ingen bild att beskära till en liten ruta i panelen. Det ger en
  Google-produkt inne i vår sida.

### B3. Attributionen, om frågan någon gång blir aktuell

Ur Street View Static API:s policysida, hämtad i dag: attributionen ska helst
vara Google Maps-logotypen, och där utrymmet är litet duger texten "Google
Maps". Logotypens höjd minst 16 dp och högst 19 dp, fri yta 10 dp åt vänster,
höger och uppåt samt 5 dp nedåt, typsnitt Roboto 400 i 12 till 16 sp, och minst
4,5:1 i kontrast. Alltså strängare formkrav än Mapillarys, som bara kräver att
logotypen syns.

### B4. Vad vi faktiskt förlorar, sagt rakt ut

Googles svenska gatutäckning är väsentligt bättre än Mapillarys, särskilt i
mindre orter. Det är den enda verkliga kostnaden av att stänga dörren, och den
ska inte pratas bort.

**Hur mycket bättre har jag inte kunnat mäta.** Street View Metadata är gratis
och obegränsad och svarar just på frågan "finns det ett panorama här", och
`pano_ID` får dessutom sparas. Den mätningen kräver en Google Cloud-nyckel, och
ägaren har inget Google Cloud-konto. Skulle han vilja veta exakt vad vi avstår
är det den mätningen som ska köras, och den kostar noll kronor. Den ändrar
däremot ingenting i slutsatsen, eftersom slutsatsen inte handlar om täckning.

**Verdikt: Google är stängt.** Inte dyrt, inte krångligt. Stängt. Lägg ingen
mer tid på spåret.

---

## Del C. Mapillary och Panoramax: den mätta täckningen

**Två mätningar ligger i den här delen och de ska inte blandas ihop.** C1 är
kurvan över hur grindarna påverkar utfallet, mätt på ett urval 2026-08-13. C2
och C3 är täckningen, RÄKNAD på varje rad 2026-08-26. Det är räkningen som är
rapportens tal; urvalet står kvar för att kurvan bara finns där.

Urvalet kördes med `python3 pipeline/matt_troskel.py 60 --per-kommun`, alltså
**60 slumpade publikvända verksamheter med koordinat ur var och en av de åtta
kommuner som har koordinater, 480 mätpunkter, noll fel.** Grindarna importeras
från `prikko.imagery` och är alltså exakt de som körs skarpt.

### C1. Kurvan, och varför den mäts i två riktningar

Talen här är URVALETS och ovägda, alltså väger Kristinehamn lika tungt som
Stockholm i varje ruta. Kurvans FORM är det som är intressant, inte dess nivå.

Raderna är hur nära bilden måste vara. Kolumnerna är hur mycket kameran får
peka fel. Alla tal har dessutom dagsljuskravet och bort med 360-utvikningar.

| m / grad | 30° | 45° | 60° | 90° | fritt |
|---|---|---|---|---|---|
| 20 m | 16,0 % | 22,1 % | 25,0 % | 30,0 % | 32,5 % |
| 25 m | 22,3 % | 26,7 % | 29,8 % | 35,8 % | 37,5 % |
| **30 m** | 27,3 % | **31,5 %** | 36,0 % | 41,9 % | 44,4 % |
| 40 m | 35,8 % | 40,2 % | 44,4 % | 48,5 % | 51,2 % |
| 60 m | 47,5 % | 54,0 % | 59,0 % | 62,3 % | 64,0 % |
| 100 m | 62,3 % | 66,9 % | 70,4 % | 73,8 % | 75,0 % |

Den fetmarkerade rutan är läget som körs: 30 meter och ±45 grader.

### C2. Rikssiffran, och skillnaden mellan att skatta och att räkna

**Talet i den här rapporten var en skattning och är nu en räkning.** Metoden är
hela skillnaden, så båda står skrivna.

**Urvalet, 2026-08-13.** 480 mätpunkter, sextio slumpade rader ur var och en av
de åtta kommuner som har koordinater, en fråga till graph-API:t per punkt.
Stratifierat och alltså inte proportionellt mot beståndet, med avsikt:
proportionellt hade Stockholm varit 65 procent av mätpunkterna och frågan
"räcker Mapillary i en mindre ort" hade inte gått att besvara. Priset är att
31,5 procent i C1 inte är rikssiffran, eftersom Kristinehamn och Stockholm
väger lika i den. Vägt mot kommunernas verkliga storlek gav urvalet **49,2
procent**, och det är det tal som stod i den här rapporten fram till nu.

**Räkningen, 2026-08-26.** Varenda rad, ingen slump. `pipeline/gatubildsko.py`
hämtar Mapillarys vektorrutor i stället för att fråga om en punkt i taget: 640
rutor räckte för hela målgruppen, alltså 13,8 rader per anrop i stället för ett
anrop per rad. Noll fel och noll rutor utan täckning. Grindarna importeras ur
`prikko.imagery` och är därför ordagrant de som körs skarpt.

> **5 298 av 8 830 publikvända verksamheter med koordinat har en gatubild inom
> trettio meter, alltså 60,0 procent.**

Räknat mot hela beståndet, 16 047 rader vid räkningen, är det 33 procent.
Skillnaden mellan de två talen är inte täckning utan koordinater och
verksamhetstyp, se C4.

**Att räkningen ligger ÖVER urvalet har två skäl, och bara det ena är brus.**
Skillnaden sitter nästan helt i Stockholm, som är 65 procent av beståndet och
där urvalet gav 58,3 procent mot räkningens 75,4. Med n = 60 ligger det
95-procentiga intervallet kring 58,3 på ungefär 46 till 71 procent, alltså
hamnar räkningens tal strax utanför. Resten är en verklig vinst: graph-API:t
sorterar inte sitt svar efter avstånd utan returnerar en godtycklig delmängd
inom `SEARCH_LIMIT`, medan en vektorruta bär allt som finns i den. Rutvägen är
prövad mot punktvägen på 80 rader i fyra kommuner och missade aldrig något
punktvägen hittade, alltså är den en övermängd och inte ett närmevärde. Hela
provningen står i noten överst i `gatubildsko.py`.

**Rapport 13 hade 63,0 procent, och det talet var i praktiken Stockholms.** Det
var mätt på 200 verksamheter med ett proportionellt urval som till två
tredjedelar var Stockholm. Räkningen ger Stockholm 75,4, så rapport 13 låg för
lågt även för sin egen kommun. **Rapport 13 ska läsas med 60,0 procent i
stället för 63,0.**

### C3. Per kommun, och det är här den viktiga upplysningen ligger

Vid 30 meter och ±45 grader, alltså skarpt läge. Talen är RÄKNADE, alltså varje
publikvänd rad med koordinat och inte sextio slumpade. Urvalets tal står i
högerspalten för den som vill se hur långt en skattning på n = 60 kan hamna
från sitt eget bestånd.

| kommun | med gatubild | av bestånd | täckning | urvalet gav |
|---|---:|---:|---:|---:|
| Stockholm | 4 350 | 5 771 | **75,4 %** | 58,3 % |
| Örebro | 232 | 437 | 53,1 % | 48,3 % |
| Uppsala | 269 | 580 | 46,4 % | 53,3 % |
| Linköping | 285 | 673 | 42,3 % | 36,7 % |
| Oskarshamn | 26 | 117 | 22,2 % | 20,0 % |
| Jönköping | 113 | 726 | 15,6 % | 21,7 % |
| Kristinehamn | 7 | 79 | 8,9 % | 8,3 % |
| Karlstad | 16 | 447 | **3,6 %** | 5,0 % |
| **hela beståndet** | **5 298** | **8 830** | **60,0 %** | 49,2 % |

Spannet är från 75,4 till 3,6 procent, alltså mer än tjugo gånger. **Mapillarys
täckning är en lokalfråga och kan aldrig utlovas jämnt över landet.** Det ska
sägas rakt ut innan funktionen presenteras för någon som inte bor i Stockholm.

Karlstad är överraskningen och den blev värre av räkningen, inte bättre.
Kommunen har alla sina rader geokodade och 447 publikvända, men Mapillary har
nästan ingenting inom trettio meter. Där ger gatubildsvägen 16 bilder av 447
möjliga.

Sammanlagt är Stockholm 82 procent av alla bilder funktionen någonsin kommer
att ge, alltså en högre andel än urvalet trodde. Det säger något om vad
funktionen är: en Stockholmsfunktion med utlöpare.

**Fyra kommuner saknas ur tabellen** av samma skäl som förut: Borgholm,
Höganäs, Lomma och Svenljunga har noll koordinater och därmed ingen fråga att
ställa. Se C4.

### C4. Fyra kommuner får ingenting, och det beror inte på Mapillary

Borgholm, Höganäs, Lomma och Svenljunga har **968 verksamheter och noll
koordinater**. Ingen geografisk bildkälla kan hjälpa dem. Det är geokodningen
som fattas, inte bilderna, och det är en annan uppgift. Den är dessutom mer
värd än den ser ut, eftersom kartan och områdessidorna hänger på samma fält.

### C5. Vad grindarna kostar, mätt var för sig

Frågan är rimlig och svaret är att alla tre är billiga i förhållande till vad de
skyddar mot.

- **Dagsljuskravet kostar 3,3 procentenheter** vid 30 meter. Det köper att
  ingen sida visar en beckmörk vindrutebild under rubriken "så här ser stället
  ut".
- **Riktningskravet ±45° kostar 12,9 procentenheter** mot att inte ha något
  krav alls (31,5 mot 44,4). Det köper att kameran faktiskt pekade mot huset
  och inte bort från det. Utan kravet är bilden lika ofta vägbanan.
- **Trettiometersgränsen kostar 8,7 procentenheter** mot fyrtio (31,5 mot
  40,2). Se rekommendation 4 i del E för varför den ändå ska stå kvar.

**Bilden som faktiskt väljs ligger på 16,4 meters median**, medel 16,5 och som
längst 29,8. Taket binder alltså sällan. Det tar bort de fall där ingenting
närmare fanns, vilket är precis de bilder som var svagast.

### C6. Panoramax ovanpå

Mätningen ovan är Mapillary ensam. Panoramax frågas bara när Mapillary inte gav
något, och den lägger till några enstaka procentenheter, koncentrerade till
Uppsala. Rapport 13 mätte den till 5,8 procent inom 30 meter mot hela
beståndet, alltså i stor utsträckning i samma kommuner där Mapillary redan är
stark. **Den är inte mätt tillsammans med Mapillary här**, så jag skriver ingen
kombinerad siffra. Den kostar ingenting och den är redan inkopplad.

### C7. Vad talet betyder för beslutet, och vad det inte betyder

Rapport 13 satte upp tolkningen i förväg: över 40 procent inom 30 meter betyder
"bygg klart gatubildsvägen, det är den bästa affären i rapporten". 60,0 procent
ligger med god marginal över den gränsen.

**Tröskeln var ändå fel fråga, och det syntes först när bilderna låg på bordet.**
Den mäter täckning, alltså om det finns en bild att hämta. Den mäter ingenting
om vad bilden föreställer. Se C8.

### C8. RESERVATIONEN, som är viktigare än talet

**60 procent är ett tak för KANDIDATER, inte ett tal för publicerbara foton.**
Varje procent i tabellerna ovan betyder exakt en sak: det fanns en Mapillarybild
inom trettio meter, tagen i dagsljus, inte en 360-utvikning, med kompassen inom
45 grader mot verksamhetens koordinat. Det är geometri. Grindarna vet att
kameran pekade mot punkten. **De vet inte att det är rätt port.**

Skälet är vad Mapillary till övervägande del ÄR i Sverige: bilder tagna genom
en vindruta av någon som körde förbi. En sådan bild pekar per definition framåt
längs gatan. Att kameran råkade ha verksamheten inom 45 grader betyder då ofta
att verksamheten låg snett framåt i bilden, inte att den är bildens motiv.

**Vad kön faktiskt innehöll.** Av de fjorton första kandidaterna i
`brand/_granska-gatubilder.html` var ungefär tre igenkännbara fasader. Resten
var vindrutebilder rakt ned för en gata, ren asfalt, eller en närbild på en
menytavla. Syftet är "aha, det är DEN restaurangen", och en bild av vägbanan
utanför svarar inte på det.

**Ägaren gick igenom hela arket 2026-08-27 och avvisade alla 48 kandidater.**
Noll godkända. `gatubildsko.py tillampa` har därför aldrig körts, och
`site/src/data/*.json` bär ingen gatubild.

**Det som fattas är ett urval och inte en källa.** Frågan "finns det en bild
här" är löst, billigt och exakt, och den ska inte utredas igen. Frågan "visar
den här bilden stället" är öppen, och tills den har ett svar är spåret
avställt. Vägarna som är tänkbara, ingen av dem prövad:

- En hårdare vinkelgrind. ±45 grader är valt för täckning. En verklig
  fasadbild kräver snarare att kameran pekar nära vinkelrätt mot husraden. Vad
  en sådan grind kostar går att räkna direkt ur
  `pipeline/data/interim/gatubilds_ko.json`, som bär `avvikelse_grader` och
  `avstand_m` för varje av de 5 298 raderna. Att LÅTA en hårdare grind välja en
  annan bild per rad kräver att rutorna hämtas om, alltså 640 anrop.
- Motivbedömning per bild i stället för per geometri. Det är den enda vägen som
  faktiskt svarar på frågan, och den kostar en modell eller en människa per rad.
- Kön kvar men mycket kortare, alltså bara de kandidater som klarar en
  hårdare grind. Ett ark på 48 bilder som ger noll godkända är inte en kö, det
  är ett urvalsfel som lastas över på en människa.

**Bygg inte om det här utan att först lösa urvalet.** Täckningstalet lockar,
för 60 procent låter som en färdig funktion. Det är den mätningen som är
färdig, inte funktionen.

---

## Del D. Lagringen: vad som byggdes, och vad det kostar

### D1. Blockeringen, och att den fortfarande gällde

Rapport 13 del D säger att bilderna måste ligga i vår egen objektlagring,
aldrig hotlänkas, och att lagringen ska bli Cloudflare R2. Det står fast och är
oförändrat riktigt. Kontrollerat i dag: **R2-variablerna saknas fortfarande
helt i `~/.prikko-env`.** Där ligger `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`,
`MAPILLARY_TOKEN` och `PEXELS_API_KEY`, och ingen av de fem R2-nycklarna.

Hela gatubildsvägen stod alltså still på en klickväg i Cloudflares panel, inte
på ett tekniskt problem. Det är fel sak att stå still på i flera månader.

### D2. Vägen runt: Supabase Storage, som redan är i bruk

Supabases service-nyckel finns redan i miljön och projektet lagrar redan bilder
där. Det som byggdes i den här omgången:

- `imagestore.SupabaseStore`, som skriver med `x-upsert` så att en omkörning
  skriver över samma objekt i stället för att svara 409.
- `imagestore.from_env()` är nu en rangordning: **R2 först, Supabase sedan.**
  Den dagen ägaren skapar R2-nycklarna byter nästa körning lagring av sig
  själv, utan att någon behöver komma ihåg en flagga. Det finns ett test som
  faller om ordningen kastas om.
- Hinken heter `prikko-bilder`, alltså R2-hinkens namn, trots att den ligger i
  Supabase. Då är objektets hela sökväg efter bas-adressen identisk i båda
  lagringarna, och flytten till R2 blir en ren kopiering plus ett `replace`
  över bas-adressen i `public.images.url`. Ett annat namn hade gjort flytten
  till en översättningstabell.

En detalj som kostade en stund och som är värd att skriva ned: projektets
service-nyckel är av den nya sorten, `sb_secret_…`, och den är ingen JWT.
Storage försöker tolka ett `Authorization: Bearer`-värde som en signerad token
och svarar annars 400 med "Invalid Compact JWS", vilket läser som ett fel i
nyckeln i stället för i huvudet. Mätt mot projektet i dag: enbart `apikey` ger
200, enbart `Authorization` ger 400. Klienten skickar därför båda.

**Provkört hela vägen** 2026-08-13: skriva ett objekt, hämta tillbaka det
anonymt utan nyckel, jämföra byte för byte, och skriva om på samma nyckel utan
konflikt. Allt grönt. Provobjekten är städade efteråt.

Hinken `prikko-bilder` **är skapad och tom**, publik, med tak 12 MB per fil och
bara `image/jpeg`, `image/png` och `image/webp` tillåtna. Ingenting behöver
klickas i Supabase innan hämtningen kan köras.

Och hela kedjan är körd skarpt mot Mapillary: fyrtio verksamheter i Linköping
gav tjugo riktiga bilder, hämtade, nedskalade, omlagda till WebP och namngivna
med sin deterministiska nyckel. Det är de tjugo filerna storleksmätningen nedan
bygger på.

### D3. Vad det kostar, räknat på verkliga tal

Bildstorleken är **mätt och inte uppskattad**: tjugo riktiga gatubilder hämtade
från Mapillary, skalade till 1024 px och lagda om till WebP med samma kod som
körs skarpt.

| | |
|---|---|
| median | **53,1 kB** |
| medel | **63,1 kB** |
| minst | 28,9 kB |
| störst | 142,9 kB |

Med 5 298 kandidater och 63,1 kB i snitt. Talet stod på 4 330 här och följer
räkningen i C2. Det är ett tak och inte en prognos: ingen av kandidaterna är
godkänd och spåret är avställt, se C8.

| | |
|---|---|
| bilder att lagra, som mest | **5 298** |
| lagring totalt | **omkring 334 MB** |
| andel av Supabases gratisnivå på 1 GB | 33 % |
| andel av R2:s gratisnivå på 10 GB | 3,3 % |
| skrivningar vid första körningen | 5 298 av R2:s 1 000 000 per månad |
| filer i Cloudflare Pages-bygget | **0** |

Även om täckningen mot förmodan skulle fördubblas ryms beståndet i båda
lagringarna. Lagringsutrymmet är alltså inte den bindande gränsen och har
aldrig varit det.

**Filer i bygget: noll.** Det är hela poängen med objektlagring. Bygget ligger
på omkring 16 800 filer av Cloudflare Pages tak på 20 000, och en bild som
ligger i en hink räknas inte. Hade bilderna checkats in i repot hade taket
sprängts med råge redan innan nästa kommun lades till.

**Trafiken är den enda punkt där Supabase är sämre än R2, och det är den punkt
som avgör.** R2 tar ingen avgift alls för utgående trafik. Supabases
gratisnivå ger 5 GB cachad och 5 GB ocachad utgående i månaden. Vid 63 kB per
bild räcker det till omkring 80 000 bildvisningar i månaden innan taket börjar
kosta, och en artikel i lokalpressen kan passera det på en dag. Bilderna sätts
med `Cache-Control: public, max-age=86400`, så upprepade visningar går över
CDN, men taket finns kvar.

Därför är rangordningen som den är: Supabase i dag för att komma igång, R2 så
snart ägaren har tio minuter.

---

## Del E. Rekommendation

**0. Spåret är avställt sedan 2026-08-27, och det ändrar punkt 2 och 3.**
Ägaren avvisade alla 48 kandidater i granskningskön. Punkterna nedan står kvar
i sin ordning eftersom skälen bakom dem inte har ändrats, men punkt 2 är
omskriven och punkt 3 väntar på punkt 2. Se C8.

**1. Lägg ned Google. Slutgiltigt.** Tre spärrar, var och en tillräcklig, alla
kontrollerade i primärkällan i dag. Det gäller även den gratis Embed-vägen.
Frågan är utredd två gånger nu och svaret är detsamma. Den ska inte utredas en
tredje gång.

**2. Kör INTE hämtningen. Lös urvalet först.** Här stod "kör Mapillary med
Panoramax som reserv, mot Supabase, nu", och kedjan är fortfarande byggd,
rättad och provkörd. Det som saknades var att någon tittade på bilderna.
Granskningskön gjorde det, och utfallet var noll godkända av 48. Att hämta hem
5 298 bilder som till största delen visar asfalt hade kostat lagring, trafik
och trovärdighet på en gång. Nästa steg är en hårdare grind mätt mot de rutor
som redan ligger sparade, inte ett hämtningskommando. Se C8.

**3. Flytta till R2 när det finns bilder att flytta.** Det är en klickväg och
fem rader i en fil, och nästa körning byter lagring av sig själv. Skälet är
trafiktaket och ingenting annat. Ingen bild är publicerad i dag, så punkten
väntar på punkt 2 och har ingen brådska.

**4. Sänk inte trettiometersgränsen för att köpa täckning.** Frestelsen kommer
att finnas, eftersom kurvan stiger snabbt över trettio meter. Men syftet är
"aha, det är DEN restaurangen", och mot det syftet är en ungefärlig bild inte
en halv bild utan ett fel: besökaren tror att hen sett stället. Resonemanget
står utskrivet vid `MAX_DISTANCE_M` i `imagery.py` och ska stå kvar.

**5. Fyll svansen inifrån, inte med en sämre gatubild.** De verksamheter
Mapillary inte når är i stor utsträckning de i mindre orter, och där är
besökaruppladdningen redan byggd och redan öppen. En bild från matsalen är
dessutom bättre än en bild av fasaden.

---

## Del F. Vad som kräver ägaren

Allt annat är gjort. Det här är det som ingen annan kan göra.

### F1. Cloudflare R2, tio minuter

Skälet är trafiktaket i del D3, inte lagringsutrymmet. Punkten stod som rapportens
viktigaste och är det inte längre: utan godkända bilder finns ingen trafik att
ta tak på. Den ligger kvar för den dag urvalet är löst.

1. `dash.cloudflare.com` → R2 Object Storage → Create bucket.
   Namn: **`prikko-bilder`**. Location: Automatic. Create bucket.
2. Bucketen → Settings → Public access → Custom domains → Connect domain:
   `bilder.prikko.se`. Inte r2.dev-adressen: den är hastighetsbegränsad och går
   inte att byta lagring bakom senare.
3. R2 Object Storage → API → Manage API tokens → Create Account API token.
   Permissions: **Object Read & Write**. Specify bucket: `prikko-bilder`.
   TTL: Forever. Create. Access Key ID och Secret Access Key visas EN gång.
4. Account ID står i R2-översiktens högerspalt.
5. Lägg fem rader i `~/.prikko-env`, aldrig i `site/.env` och aldrig i repot:

       export R2_ACCOUNT_ID=...
       export R2_BUCKET=prikko-bilder
       export R2_ACCESS_KEY_ID=...
       export R2_SECRET_ACCESS_KEY=...
       export R2_PUBLIC_BASE_URL=https://bilder.prikko.se

Nästa körning väljer R2 av sig själv. Redan hämtade bilder flyttas med en
kopiering och en SQL-sats, eftersom sökvägarna är identiska:

```sql
update public.images
set url = replace(
    url,
    '<supabase-url>/storage/v1/object/public/prikko-bilder',
    'https://bilder.prikko.se'
)
where source in ('mapillary', 'panoramax');
```

### F2. Sätt citattecken runt Mapillary-token, tio sekunder

I `~/.prikko-env` står raden utan citattecken, och värdet innehåller lodstreck
som skalet läser som rörtecken. Sätt citattecken runt värdet:

    MAPILLARY_TOKEN="MLY|...|..."

Skriptet klarar sig utan det nu, eftersom det läser `site/.env` som reserv, men
de två raderna "command not found" står kvar tills citattecknen finns, och de
ser ut som ett fel varje gång miljön läses in.

### F3. Beslutet om den skarpa körningen, som är fattat och blev nej

**Beslutet är taget 2026-08-27 och svaret är nej.** Ägaren granskade de 48
kandidaterna och godkände ingen, se C8. Kommandot nedan står kvar som
dokumentation av hur körningen går till den dag urvalet är löst, och ska inte
köras innan dess.

Att hämta hem hela beståndet skriver några hundra megabyte till ägarens
Supabase-lagring och skriver några tusen rader i `public.images`. Det är hans
kvot och hans beslut, inte mitt. Kommandot är en rad:

    set -a && . ~/.prikko-env && set +a
    python3 pipeline/hamta_gatubilder.py            # alla kommuner
    python3 pipeline/hamta_gatubilder.py --kommun 0580   # en i taget

Formen är oförändrad och det är den som gör det billigt: **ett anrop per
verksamhet, aldrig ett per bygge och aldrig ett per sidvisning.** Skriptet
hoppar över alla som redan har en bild, så första körningen kostar några tusen
anrop utspridda över en natt och varje körning därefter kostar några dussin.

### F4. Nattkörningen hämtar inga bilder

`.github/workflows/uppdatera-data.yml` kör hämtning, inläsning och export varje
natt, men aldrig `hamta_gatubilder.py`. Nya verksamheter får alltså ingen bild
förrän någon kör skriptet för hand.

Att koppla in det är fem rader i arbetsflödet, men det kräver två hemligheter i
GitHub som bara ägaren kan lägga in: `MAPILLARY_TOKEN` och de
Supabase-variabler skriptet redan behöver. Utan dem faller steget varje natt
och gör en grön körning röd.

**Ordningen spelar roll när det väl kopplas in.** Steget ska ligga EFTER
`load_supabase.py` och FÖRE `export_supabase.py`. Ligger det efter exporten
hamnar bilderna i databasen men inte i datafilerna, och sidan visar ingenting
förrän nästa natt.

Kostnaden per natt är låg av samma skäl som första körningen är dyr:
skriptet frågar bara efter rader som saknar bild, alltså några dussin anrop.

### F5. Den kvarvarande risken, som är ägarens att ta

Oförändrad sedan rapport 13 och upprepas här för att den inte ska glömmas bort
när bilderna väl syns: Mapillarys villkor säger "CC BY-SA ... unless we indicate
otherwise", och undantaget exemplifieras med datamängder under CC BY-NC-SA,
alltså med förbud mot kommersiell användning. Prikko är kommersiell. Någon
licensuppgift per bild finns inte i API:t, så de går inte att skilja åt
maskinellt. Bedömningen bakom att vi ändå hämtar står vid `LICENCE` i
`imagery.py`. Det är en bedömning och inte ett belägg.
