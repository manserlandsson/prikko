# 31. Vad får folk att välja oss framför Livsmedelskollen

**Datum:** 2026-08-14
**Föregångare:** `docs/17_produktfunktioner.md` för funktionslistan,
`docs/26_seo_bortom_hygienordet.md`, `docs/29_alternativ_till_monstret.md` och
`docs/30_programmatisk_seo.md` för mätmetoden, som används rakt av.
**Beställning:** vilka coola funktioner saknar vi, och vad får folk att använda
oss före Livsmedelskollen.
**Utfall:** ett inslag byggt, tre spår belagda och rangordnade, fem
nollställda. Och ett fynd som inte är en funktion alls och ändå slår varje
funktion i listan, se §4.

---

## 1. Slutsatsen först

Fyra slutsatser, i fallande ordning av vad de betyder.

1. **Livsmedelskollen är inte en sajt. Den är en app plus en sida per kommun.**
   `livsmedelskollen.se` svarar inte alls, domänen är parkerad. Tjänsten är
   Stockholms stads app från 2017, som har **2,6 av 5 i 17 omdömen** i App
   Store, plus en egen webblista på varje kommuns egen webbplats. Det finns
   ingen nationell ingång, ingen karta, inget konto och ingen kedja. §2.
2. **Vi förlorar ändå på den axel som betyder mest, och det är inte en
   funktion.** Uppsalas egen lista visade 2026-08-14 kontroller från
   **2026-08-13**. Vår `uppsala.json` är hämtad 2026-08-07 och har sin senaste
   kontroll **2026-08-05**. Åtta dagars eftersläpning mot källan, på den enda
   uppgift båda sajterna visar överst på varje rad. §4.
3. **Kvalitetsledet är belagt på varje kornighet vi har, och vi svarar
   fortfarande inte på det.** 8 av 8 fraser kompletteras i dag. Tre dokument i
   rad har bett om samma sak, `docs/26` §9 punkt 2, `docs/29` §7 punkt 1 och
   `docs/30` §10 punkt 3, och den är fortfarande inte gjord. Skälet visade sig
   vara ett riktigt hinder och inte slarv, och det hindret går att gå runt.
   §5 och §7.
4. **Den bäst belagda efterfrågan vi har är öppettider, och vi har inte
   datan.** 7 av 7. Den finns däremot i OpenStreetMap med **66,4 procent
   täckning** i Stockholms kommun, mätt här. §6.3.

---

## 2. Konkurrentgenomgången, med mätta tal

Allt i det här avsnittet är avläst 2026-08-14 i webbläsaren eller med `curl`
och `dig`, inte återgivet ur minnet.

### 2.1 Livsmedelskollen finns inte som en sajt

`livsmedelskollen.se` går inte att slå upp. `dig` mot både systemets resolver
och 8.8.8.8 ger inget A-svar, och namnservrarna är `parked.g1-dns.one` och
`parked.g1-dns.com`. Domänen är alltså parkerad och har aldrig varit tjänsten.

Tjänsten är två saker:

| Form | Vad det är |
|---|---|
| Appen | Stockholms stads mobilapp, lanserad 19 april 2017 |
| Webblistan | En sida på varje kommuns egen webbplats, samma leverantörsform |

Appen i App Store, avläst ur Googles resultatsida: **2,6 av 5 i 17 omdömen**,
gratis, kategori Mat och dryck, placering **#190**, storlek 19,2 MB, angivet
språk engelska, utvecklare Stockholms stad. Beskrivningen ordagrant: "Se
utförda livsmedelsinspektioner, ladda ner registreringsintyg, anmäl misstänkt
matförgiftning eller lämna klagomål om brister i livsmedelsverksamheter".

Sjutton omdömen på nio år är ett tal värt att stanna vid. Det är inte en
konkurrent med en publik. Det är en e-tjänst.

### 2.2 Webblistan, mätt på Uppsala

Uppsalas Livsmedelskollen är den mest kompletta av dem vi öppnat.

| | Mätt värde |
|---|---|
| Verksamheter | **1 846** |
| Sidor i listan | 185, tio rader per sida |
| Historik per verksamhet | **de fem senaste kontrollerna**, utskrivet på sidan |
| Nedre gräns för bedömning | kontroll efter 1 januari 2024 |
| Senaste kontroll i listan | **2026-08-13**, alltså dagen före mätningen |
| Ordning | senaste kontroll först |

Filtren, ordagrant: fritextfältet **Namn eller adress**, **Typ av verksamhet**
med fyra värden (Restaurang och servering, Skolor förskolor och annan omsorg,
Butiker och annan handel, Övriga verksamheter), **Omdöme** med tre värden
(Utan avvikelse, Avvikelse, Ny verksamhet eller ingen kontroll gjord),
**Kontroll gjord** med Före och efter plus datum, samt **Nollställ filter**.

Verksamhetssidan ligger på `/livsmedelskollen/Details?id=1897721096` och bär,
ordagrant: Adress, Verksamhet, och per kontroll **Kontrolldatum**, **Anledning
till kontroll** ("Uppföljning av tidigare avvikelse"), **Typ av kontroll**
("Föranmäld"), **Diarienummer** ("MHN-2026-5834") och **Omdöme**. Bredvid står
en förklaringsspalt och en länk till "Anmäl misstänkt matförgiftning".

Sidorna **är indexerade**. `site:uppsala.se livsmedelskollen Details` ger tio
träffar på första sidan med utdrag i formen "Resultat för Paesano City,
Verksamhet: Restaurang och servering, Adress: Kungsgatan 34A, Datum för
kontroller: 2024-11-27, 2025-01-09, 2025-06-03". De är alltså en riktig
sökkonkurrent på verksamhetsnamnet, trots frågesträngen i adressen.

### 2.3 Vad de har som vi inte har

Tre saker, och bara tre.

1. **Diarienummer per kontroll.** Det gör kontrollen möjlig att begära ut hos
   kommunen. Vi har inget dnr-fält i schemat och inget i någon källa.
2. **Anledning till kontroll som text.** Vi har `type` med tre lägen (planerad,
   återbesök, händelsestyrd) men ingen orsakstext och ingen klagomålsflagga.
3. **Filter på omdöme.** Tre kryssrutor. Vi har inget bedömningsfilter någonstans
   på sajten. Vi har i stället två egna sidtyper, `/[kommun]/anmarkningar/` och
   `/[kommun]/matsnusk/`, alltså bara den negativa halvan av samma axel.

Och en fjärde som inte är en funktion utan en egenskap: **de är källan.** De kan
aldrig ligga efter sig själva.

### 2.4 Vad vi har som de inte har

Räknat ur beståndet 2026-08-14:

| | Prikko | Livsmedelskollen |
|---|---:|---|
| Kommuner i en och samma sökning | **12** | 1 per sajt |
| Verksamheter | **15 983** | 1 846 i Uppsala |
| Kontroller | **68 895** | de fem senaste per verksamhet |
| Karta | ja, riks och per kommun | nej |
| Stadsdelar | ja, 30 med egen sida | nej |
| Kedjor tvärs kommungränser | ja, 52 kedjor, 1 564 ställen | nej |
| Konto och bevakning | ja | nej |
| Jämför två ställen | ja | nej |
| Artiklar och rapporter | 25 plus 7 | nej |
| Utmärkelse med fryst årsutgåva | ja | nej |

En rad som prövades och som INTE blev vår: **deras sökning tål felstavning.**
`?query=suchi` ger "28 verksamheter som innehåller suchi", och samtliga tio på
första sidan heter sushi. Antagandet att en kommunal e-tjänst gör ren
delsträngsmatchning höll inte, och det ska stå här i stället för i tabellen.

Fyra omdömesetiketter förekommer i listan, inte de tre som filtret erbjuder:
"Utan avvikelse", "Avvikelse", "Avvikelse åtgärdad" och "Ingen inspektion gjord
efter 1 januari 2024". Den tredje motsvarar vår `fixed`-status.

Historikdjupet är den viktigaste raden och syns inte i tabellen. Stockholm
lämnar ut upp till 113 kontroller på samma verksamhet och vi visar dem alla.
Livsmedelskollen visar fem, oavsett hur många som finns.

### 2.5 Täckningen, och var namnet söks

`livsmedelskollen` kompletteras rikt hos Google och håller även hos DuckDuckGo.
Svansen ordagrant, i ordning:

> stockholm, uppsala, uppsala kommun, linköping, karlstad, app,
> livsmedelsverket, göteborg, solna, östhammar, jönköping, stockholms stad,
> malmö, enköping, västerås

Elva namngivna kommuner. **Fem av dem är våra**: Stockholm, Uppsala, Linköping,
Karlstad och Jönköping. De sex övriga, Göteborg, Solna, Östhammar, Malmö,
Enköping och Västerås, söks på ett namn som inte nödvändigtvis finns där. Det är
efterfrågan på tjänsten utanför de kommuner som tillhandahåller den.

Bekräftat med egna ögon finns webblistan i **fyra kommuner**: Stockholm, Uppsala,
Karlstad och Linköping. De övriga sju i svansen är inte kontrollerade, och att
namnet söks där är inte ett belägg för att tjänsten finns där.

Det ska inte läsas som en uppmaning att skriva "Livsmedelskollen Göteborg" på en
sida hos oss. `docs/29` §3.4 mätte `alternativ till livsmedelskollen` till noll,
och `docs/29` §9 skrev regeln: mönstret kräver att vår tjänst är känd vid namn
först, och frasen skrivs då av någon annan om oss.

### 2.6 Storbritannien, Danmark och Norge, kort

Brittiska FHRS på `ratings.food.gov.uk` är den mognaste marknaden och har
**607 303 verksamheter** i sin öppna datafil per 2026-08-14, uppdaterad
dagligen. Det de har och som saknas i hela Norden:

- **Öppna data och API utan registrering**, XML och JSON, plus nedladdning per
  verksamhet direkt från verksamhetssidan.
- **Företagswidget** som uppdaterar sig själv, både bild och skript.
- **Range-operator i filtret**: Equal, Greater than or equal, Less than or
  equal. Alltså "minst 4", inte bara "exakt 4".
- **Delbetyg** i tre rader: Hygienic food handling, Cleanliness and condition of
  facilities and building, Management of food safety.
- URL per verksamhet i formen `/business/{id}/{slug}`, alltså med slug.

Danmark ger i stället **rapportinnehållet**: de fyra senaste kontrollrapporterna
som PDF, samt **Abonnér**, en bevakning per verksamhet med mejl vid varje ny
kontroll. Norge ger **delområden och en publiceringsgaranti**, resultat digitalt
inom fem arbetsdagar.

Läsningen som betyder något för oss: UK vann på skala, API och märke. Danmark
vann på historik och bevakning. **Båda de danska greppen har vi redan**, och
UK:s märke har vi som `/utmarkelser/emblem/`.

### 2.7 Svenska registersajter, det gemensamma mönstret

Hitta.se, booli.se och allabolag.se gör alla samma sak på en objektsida, och det
är den enda designlärdomen värd att skriva ned: **objektsidan är aldrig en
återvändsgränd.** Den har alltid något att spara eller bevaka, minst en lista
med liknande eller närliggande, aggregerad statistik för området eller branschen,
och en karta.

Vår verksamhetssida har alla fyra. Det som skiljer är att Boolis och allabolags
bevakning gäller **en sökning eller ett område**, medan vår bara gäller en
enskild verksamhet. Se §6.4.

---

## 3. Metod

Identisk med `docs/26` §2, `docs/29` §2 och `docs/30` §2.1, så att utfallen går
att lägga bredvid varandra. Googles förslagsslutpunkt med `client=chrome`,
`hl=sv` och `gl=se`, plus DuckDuckGos slutpunkt med `kl=se-sv` som oberoende
kontroll på sex fraser. **57 frågor hos Google.**

Läsanvisningen upprepas för att den avgör allt:

- Ett förslag är ett **positivt belägg** för att frasen skrivs. Ett uteblivet
  förslag betyder att frasen ligger **under mätgolvet**, inte att den är noll.
- Metoden ger **ingen volym**, bara existens och rangordning.

Stammatcharen från `docs/30` §2.1 används oförändrad, och den självtestas mot
`docs/29`:s kända utfall före varje körning: `alternativ till maxxfan` måste
falla, `restauranger stockholm` måste hålla. Åtta prov, samtliga höll.

Talen ur beståndet är räknade med egna skript mot `site/src/data/*.json`.
Konkurrentens tal är avlästa på hans egna sidor. Filtalen kommer ur `docs/30`
§3.

---

## 4. Fyndet som inte är en funktion, och som ändå går först

Det här är det viktigaste i dokumentet, och det stod inte i beställningen.

Vår data ligger efter kommunens egen sida.

| | Uppsala kommun | Prikko |
|---|---|---|
| Senaste kontroll i listan | **2026-08-13** | 2026-08-05 |
| Hämtat | löpande | 2026-08-07 |

Åtta dagar, på den enda uppgift som står på varje rad hos båda. Mätt per kommun
i vårt bestånd ser det ut så här:

| Kommun | Senaste kontroll i datan | Hämtat |
|---|---|---|
| Stockholm | 2026-08-06 | 2026-08-07 |
| Uppsala | 2026-08-05 | 2026-08-07 |
| Jönköping | 2026-08-05 | 2026-08-07 |
| Oskarshamn | 2026-08-04 | 2026-08-07 |
| Linköping | 2026-07-24 | 2026-08-06 |
| Karlstad | 2026-07-16 | 2026-08-07 |
| Örebro | 2026-07-06 | 2026-08-05 |
| Lomma | 2026-07-02 | 2026-08-06 |
| Höganäs | 2026-07-01 | 2026-08-03 |
| Svenljunga | 2026-06-30 | 2026-08-04 |
| Kristinehamn | 2026-05-27 | 2026-08-07 |
| Borgholm | 2025-09-30 | 2026-08-07 |

Skillnaden mellan kolumnerna är i de flesta fall kommunens kontrolltakt och inte
vårt fel. Uppsalaraden är däremot ett verkligt fel: kommunen hade en kontroll
från den 13:e uppe medan vi visade den 5:e, och ingen hämtning har skett sedan
den 7:e.

Orsaken står redan i `docs/25`: **GitHub Actions startar inga körningar**, och
det är en punkt under "Din åtgärd". Så länge den står där är varje funktion i
det här dokumentet byggd ovanpå ett underlag som åldras.

En besökare som jämför oss med kommunens sida en enda gång och ser ett äldre
datum hos oss kommer inte tillbaka, och ingen karta i världen rättar det. Det är
skälet till att den här punkten står före funktionslistan och inte i den.

**Bedömning, inte mätning:** jag har inte kunnat pröva om nattjobbet skulle
fungera om det startade, eftersom det kräver ägarens fliktillgång.

---

## 5. Mätningen, grupp för grupp

57 frågor. Utfallet i sammandrag:

| Grupp | Utfall |
|---|---:|
| K1 Kvalitetsledet, omprövat | **8 av 8** |
| K2 Öppettider och öppet nu | **7 av 7** |
| K6 Vem som driver stället | 5 av 5 |
| K4 Skolkök och förskolekök | 7 av 9 |
| K7 Konkurrenten vid namn | 4 av 6 |
| K3 Nyöppnat och stängt | 6 av 11 |
| K8 Kartan och närhetsformen | 3 av 5 |
| K5 Kontrollrapporten som handling | 2 av 6 |

### 5.1 K1. Kvalitetsledet håller, 8 av 8

`docs/30` §8 varnade för att autocomplete är färskvara och att två av
`docs/26`:s fynd inte reproducerades. Kvalitetsledet gör det.

| Fras | Kompletteras |
|---|---|
| `restauranger stockholm högst betyg` | ja, 15 förslag, håller även hos DuckDuckGo |
| `restauranger uppsala högst betyg` | ja, 14 |
| `restauranger linköping högst betyg` | ja, 11 |
| `restauranger örebro högst betyg` | ja, 10 |
| `restauranger jönköping högst betyg` | ja, 10 |
| `restauranger karlstad högst betyg` | ja, 6 |
| `restaurang nära mig högst betyg` | ja, 9 |
| `restauranger södermalm högst betyg` | ja, 13 |

Svansen på stockholmsfrasen, ordagrant: `elegant`, `billigt`, `öppet nu`,
`prisvärda`, `bästa`, `vasagatan`, `mysiga`, `italienska`, `city`, `södermalm`,
`japanska`, `asiatiska`, `fina`, `grekiska`.

Formuleringen som ska stå kvar från tre tidigare dokument: **skriv aldrig
`högst betyg` i en rubrik.** Det är Googles stjärnbetyg i läsarens huvud och vi
har inga stjärnor. Frasen står här som belägg, aldrig som förlaga. Fjärde
dokumentet i rad som säger det.

### 5.2 K2. Öppettider, 7 av 7, och vi har inte datan

| Fras | Kompletteras |
|---|---|
| `restauranger stockholm öppet nu` | ja, 15 |
| `restauranger uppsala öppet nu` | ja, 7 |
| `restauranger linköping öppet nu` | ja, 7 |
| `restauranger örebro öppet nu` | ja, 4 |
| `restaurang öppet nu` | ja, 15 |
| `mataffär öppet nu` | ja, 15 |
| `öppettider mcdonalds` | ja, 15 |

Det avgörande står i svansen och inte i tabellen: **de två leden skrivs
tillsammans.** `restauranger stockholm öppet nu högst betyg`, `restaurang
uppsala högst betyg öppet nu`, `restaurang örebro öppet nu högst betyg`,
`restaurang södermalm högst betyg öppet nu`, `restaurang nära mig högst betyg
öppet nu`.

Läsaren ställer alltså en enda fråga, och den har två halvor. **Vi har den ena
halvan och kan bygga den i dag. Den andra kräver data vi inte har.** Vad den
kostar står i §6.3.

### 5.3 K4. Skolkök, 7 av 9 på papperet och en nolla i verkligheten

`skolmat stockholm`, `skolmat uppsala`, `skolmat linköping` och `skolmat örebro`
kompletteras alla. Svansen avgör vad de betyder:

> skolmat uppsala **kommun**, **gymnasium**, **grundskola**, katedralskolan,
> förskola, **idag**, skollunch, **meny** skolmat uppsala, **veckans** skolmat
> uppsala, **recept** skolmat uppsala, skolmat domarringen

Ordet betyder **matsedeln**, inte köket. `skolmat stockholm meny`, `skolmat idag
stockholm`, `sodexo skolmat stockholm`, `catering skolmat stockholm`. Det är
exakt samma fälla som `docs/26` §4.1 beskriver för `fräsch`, som utan
`restaurang` bredvid sig betyder sallad, och som `docs/30` §6.3 beskriver för
`lager`, där varje träff var klädeskedjan Lager 157.

De två fraser som prövade själva köket, `förskola kök kontroll` och `hur bra är
skolmaten`, gav **noll förslag över huvud taget**, vilket `docs/29` §3.1 noterar
är ett starkare negativt belägg än en luddig träff.

**Dom: skolkategorin får ingen egen satsning.** Den ligger kvar som en av fem
toppkategorier där den hör hemma.

### 5.4 K3. Ordet är `nya`, inte `nyöppnade`, och datan finns inte

| Fras | Kompletteras |
|---|---|
| `nya restauranger [stad]` | **ja, 6 av 6** |
| `nyöppnade restauranger [stad]` | nej, 0 av 3 |
| `nyöppnat stockholm` | nej, faller till `nyöppnat spa stockholm` |
| `restaurang lagt ner stockholm` | nej, noll förslag |

Svansen på `nya restauranger stockholm`: `2026`, `city`, `slussen`, `2025`,
**`högst betyg`**, `östermalm`, `vasastan`, `2024`, `södermalm`, `lunch`. Och
`nya restauranger uppsala högst betyg`. Alltså återigen kvalitetsledet, den här
gången på det nya stället.

Två saker gör att spåret ändå inte byggs nu.

**Datan finns inte i repot.** `site/src/lib/rorelse.ts` läser
`../data/rorelse/*.json`, och den katalogen finns inte. Rörelsesidan byggs alltså
inte i dag, varken per kommun eller för riket. Historiken går inte att räkna fram
i efterhand, den börjar den natt `pipeline/rorelse.py` körs första gången, och
första körningen publicerar ingenting. Det är samma blockerare som §4.

**Ordet får ändå inte bytas.** Huvudkommentaren i `rorelse.ts` säger rakt ut att
sidan skriver "tillkommit" och "försvunnit" och aldrig "nyöppnat" och "stängt",
eftersom det som observeras är att ett anläggnings-id dök upp i utlämningen. En
kommun som lägger om sitt register skulle annars se ut att öppna trehundra
restauranger på en dag. Den regeln står över ett autocompletefynd.

Vad som återstår är alltså: när loggen bär något, är `nya restauranger [stad]`
belagt 6 av 6 och rörelsesidan svarar på det utan att en enda ny sida byggs.

### 5.5 K5 och K6. Två spår som ser levande ut och inte är våra

**K5, kontrollrapporten som handling, 2 av 6.** `kontrollrapport restaurang`
faller till `kontroll restauranger`, `begära ut kontrollrapport` faller till
`begära ut kontrolluppgifter från skatteverket`, `diarienummer
miljöförvaltningen` ger noll förslag. Det enda som håller är den ortslösa
`begära ut offentlig handling kommun`. Livsmedelskollens diarienummer är alltså
en riktig funktion utan mätbar efterfrågan.

**K6, vem som driver stället, 5 av 5, och ändå en nolla.** Svansen avgör:
`vem äger restaurangen **på fotografiska**`, `vem äger restaurang **ted**`,
`restaurang **sjön** ny ägare`. Frågan gäller en namngiven, ofta omskriven
krog, inte ett registeruppslag. Det är inte den fråga en orgnr-brygga svarar på.

---

## 6. Förslagen, rangordnade

Rangordningen är (efterfrågan × genomförbarhet) delat med kostnad. Kostnad räknas
i filer mot Cloudflare Pages tak: bygget ligger på **16 898 av 20 000**, alltså
**3 102 filers marginal**, `docs/30` §3.

### 6.1 Ren historik där man står. BYGGT I DEN HÄR OMGÅNGEN

**Efterfrågan:** mätt, 8 av 8, §5.1. Den bäst belagda formen i hela
dokumentserien, funnen på fyra kornigheter i tre dokument och omprövad här.

**Data:** finns. `distinction` räknas vid varje bygge ur
`pipeline/prikko/grading.py` och står redan i varje datafil. Räknat 2026-08-14:

| Kommun | Med ren historik | Andel |
|---|---:|---:|
| Stockholm | 1 084 | 12,8 % |
| Linköping | 149 | 12,0 % |
| Jönköping | 121 | 10,8 % |
| Uppsala | 96 | 5,3 % |
| Örebro | 79 | 6,4 % |
| Borgholm | 6 | 1,5 % |
| Kristinehamn | 1 | 0,6 % |
| Svenljunga | 1 | 1,0 % |
| Höganäs, Karlstad, Lomma, Oskarshamn | 0 | 0 % |
| **Riket** | **1 537** | **9,6 %** |

**Kostnad:** noll filer. Ett inslag på en sida som redan finns.

**Varför den inte redan var byggd, och det är inte slarv.** Tre dokument bad om
"ordningen på kommunsidan, ren historik först". Motiveringen i
`site/src/lib/data.ts` rad 973 till 991 säger varför ingen gjort det: ordningen
måste vara oberoende av bedömningen, annars flyttar en enda ändrad kontroll
hundratals rader mellan sidor vid varje datauppdatering. Stockholm är 85 sidor
om hundra rader.

Det finns ett andra skäl som ingen skrivit ned förrän nu, och det är det tyngre:
**en lista som sorteras bäst först har en sista sida som är sämst först.**
Sida 85 av Stockholm hade blivit en värstinglista med 85 sidors anlopp, och en
värstinglista publicerar vi aldrig, `docs/17` under Bindande.

Vägen runt båda är densamma: **sortera inte om registret. Lägg ett avgränsat
inslag ovanför det.** Registret behåller sin bokstavsordning och sin stabilitet,
inslaget svarar på frågan, och ingen sista sida uppstår eftersom inslaget inte är
sidindelat.

Urvalet inne i inslaget är den enda kvarvarande fällan, och den löses med
`docs/17` punkt 4:s egen regel: **sorterat på datum och ingenting annat.** Alla
som visas har passerat exakt samma ribba, och ordningen mellan dem är senast
kontrollerad först. Det är därför inte en rangordning av verksamheter, och det
gör dessutom sidan färsk vid varje datauppdatering.

Vad som byggdes står i §7.

### 6.2 Bedömningsfilter i sökningen. Näst bäst, inte byggd här

**Efterfrågan:** mätt, samma 8 av 8 som ovan, plus konkurrentparitet. Det är den
enda av Livsmedelskollens tre funktioner vi saknar som har belagd efterfrågan.

**Data:** finns redan i klienten. Sökregistrets rader är
`[namn, adress, slug, kommunindex, bedömningsindex]`,
`site/src/lib/search-index.ts` rad 50 till 56. Bedömningen ligger alltså redan
i webbläsaren när träffarna ritas.

**Kostnad:** noll filer. `/sok/` ritas i webbläsaren ur hela registret, så ett
filter där kan läggas **före** avkortningen till fyrtio träffar och filtrerar
alltså den faktiska mängden, inte hundra rader av femtontusen. Det är precis den
invändning som stoppar samma filter på kommunsidan.

**Varför den inte byggdes här:** `/sok/` delar kod med `sokforslag.ts` och
snabbvalen, och en ändring där rör sajtens huvudingång. Den förtjänar en egen
omgång med egna prov, inte ett tillägg i slutet av den här.

### 6.3 Öppettider ur OpenStreetMap. Bäst belagd, dyrast

**Efterfrågan:** mätt, 7 av 7, och skrivs tillsammans med kvalitetsledet i
samma fras, §5.2. Ingen annan efterfrågan i någon av de fyra
undersökningarna är belagd på fler sätt.

**Data:** vi har den inte, men källan finns och är mätt här. Overpass mot
Stockholms kommun, matnoder och matytor, 2026-08-14:

| | Antal |
|---|---:|
| Matpunkter i OSM i Stockholms kommun | 4 501 |
| Med namn | 4 421 |
| **Med `opening_hours`** | **2 987 (66,4 %)** |
| Med både namn och `opening_hours` | 2 982 |

**Kostnad:** noll filer, men verkligt pipelinearbete. Hindret är hopkopplingen
och inte hämtningen: bara **1 611 av 15 983** verksamheter har i dag
`geoSource: 'osm'`, alltså en känd OSM-motpart. För de övriga skulle
öppettiderna behöva paras på namn och avstånd, och en felparning ger fel
öppettid på fel ställe.

**Bedömning, inte mätning:** en öppettid som är fel är värre än ingen öppettid,
och en pil som säger "öppet nu" är en tidsberoende uppgift på en statisk sajt,
alltså per definition ibland osann. Spåret ska värderas högt och byggas
försiktigt: först som en uppgift med källa och datum på verksamhetssidan, aldrig
som ett filter på en listsida förrän täckningen är mätt per kommun.

En regel som gäller oavsett: **grönt är bedömningens språk och lånas aldrig ut.**
`docs/17` stoppade en grön "öppet nu"-pille redan i rapport 15, och den domen
står.

### 6.4 Bevaka ett område i stället för ett ställe

**Efterfrågan:** ingen mätt sökefterfrågan, och det är rätt sorts nolla. Det är
en kvarhållningsfunktion och inte en ingång. Belägget är i stället att alla tre
svenska registersajter bygger på den: Booli bevakar en sökning, ett område eller
en gata; allabolag bevakar ett företag; hitta.se har Adresslarm. Danska
findsmiley har Abonnér per verksamhet, alltså exakt det vi redan har.

**Data:** finns. Vad som saknas är schemat. `community.follows` bär
`establishment_id`, `establishment_name`, `municipality_slug` och `created_at`,
`site/src/lib/community.ts` rad 515 till 560. En områdesbevakning kräver en
kolumn till och en gren i `notify.py`.

**Kostnad:** noll filer, men en databasmigrering och en ändring i nattjobbet.

**Gränsen som måste hålla:** `notify.py` skickar bara nya kontroller **med**
anmärkningar. En områdesbevakning som mejlar varje anmärkning i Södermalm är ett
nyhetsbrev om vilka kök som misslyckats, alltså en värstinglista i mejlform med
en veckas fördröjning. Funktionen får byggas, men bara som **en lista på kontot**
med samma ordning som `docs/17` slog fast för bevakningen: listan är funktionen,
mejlet är en påminnelse om listan.

**Prövad och avförd 2026-09-01, se sista avsnittet i `docs/17`.** Gränsen ovan
höll inte när volymen mättes: Södermalm ger 175 nya anmärkningar på ett år och
Norrmalm 190, alltså femton namngivna verksamheter i månaden, medan
medianområdet får fem på ett år och fjorton av 87 får noll. Med namn blir listan
den värstinglista stycket varnar för, utan namn säger den ingenting, och för de
flesta områden tiger den. Kostnaden är också högre än vad som står här:
`district` är tom i databasen och punkt-i-polygon körs bara vid bygget, så
nattjobbet saknar helt begreppet område.

### 6.5 Öppna data, som FHRS

**Efterfrågan:** ingen konsumentefterfrågan alls, och det är hela poängen. FHRS
öppna datafil har 607 303 verksamheter och uppdateras dagligen, och Sverige har
ingen motsvarighet: varje kommun sitter på sin egen utlämning och ingen samlar
dem. **Vi är redan den enda som gjort det.**

**Data:** finns, det är beståndet.

**Kostnad:** en fil, inte tusen. En `.json.ts`-rutt på innehållsbaserad adress är
samma mönster som `/sok-index/[hash].json.ts` och `/jamfor-index/` redan
använder.

**Bedömning, inte mätning:** värdet är inte trafik utan tre andra saker. Det är
ett argument i mejlkampanjen till 275 kommuner (`docs/25`), det är den sortens
tillgång som journalister länkar till, och det gör oss till det andra mäts mot,
vilket är villkoret `docs/29` §9 satte för att kedjespåret någonsin ska öppna.

**Gränsen:** filen får inte innehålla något som möjliggör en rangordning av
kommuner utan att förbehållet följer med. Metodikens ord om olika
kontrollintensitet måste ligga i samma svar.

---

## 7. Vad som byggdes

`site/src/components/RenHistorik.astro`, ett inslag på kommunsidans sida 1,
mellan filtren och registret.

### 7.1 Formen

Rubrik, en mening med kommunens egna tal, en lista på upp till sex verksamheter,
och en rad om vad ribban är med länk till metodiken. Ingen ram, ingen platta,
ingen skugga, hårlinje mellan raderna. Samma radform som sidopanelens "Senast
kontrollerade", alltså sajtens befintliga språk för en kort lista.

### 7.2 De fyra reglerna i koden

1. **Sorterat på datum och ingenting annat.** Alla som visas har passerat exakt
   samma ribba, tre kontroller utan anmärkning. Ordningen mellan dem är senast
   kontrollerad först. Ingen inbördes rangordning uppstår, och inslaget byter
   innehåll vid varje datauppdatering, vilket är färskhetsbeviset `docs/17`
   punkt 4 efterlyste.
2. **Registret rörs inte.** Bokstavsordningen och stabiliteten i `data.ts` står
   kvar, och ingen sista sida blir en värstinglista.
3. **Ritas bara när `distinctionPossible` är sant och antalet når ribban.**
   I Höganäs, Karlstad, Lomma och Oskarshamn kan ingen verksamhet nå märkningen,
   eftersom källan aldrig lämnar ut tre kontroller. Ett tomt eller ettradigt
   avsnitt där hade lästs som att kommunen saknar rena kök, och den slutsatsen
   vore fel. Det är exakt hazarden `docs/29` §5 räknade fram för kedjesidorna.
4. **Ordet är "ren historik", inte "bäst" och inte "högst betyg".** Etiketten
   finns redan i `site/src/lib/site.ts` som `DISTINCTION.short`, och den långa
   formen "Utan anmärkning vid de tre senaste kontrollerna" står som förklaring.
   Vi lånar inte ordet betyg, av skälet fyra dokument nu har skrivit.

### 7.3 Var det syns

Sex kommuner av tolv: Stockholm, Linköping, Jönköping, Uppsala, Örebro och
Borgholm. Kristinehamn och Svenljunga har en verksamhet var och faller på
ribban. De fyra där märkningen är onåbar ritar ingenting.

### 7.4 Vad det kostade

Noll filer. Bygget står kvar på samma antal sidor.

---

## 8. Vad som inte ska göras

1. **Sortera inte om det sidindelade registret på bedömning.** §6.1. Stabiliteten
   i `data.ts` och den sista sidan som blir en värstinglista.
2. **Bygg ingen satsning på skolkategorin.** §5.3. `skolmat` betyder matsedeln,
   och de två fraser som prövade köket gav noll förslag.
3. **Bygg inget kring diarienummer eller utlämnande av handlingar.** §5.5.
   2 av 6, och den enda träffen är ortslös och generisk.
4. **Bygg ingen orgnr-yta på frågan "vem äger".** §5.5. Svansen är Fotografiska
   och Ted, alltså namngivna krogar i pressen, inte registeruppslag.
5. **Byt inte ordet "tillkommit" mot "nyöppnat" på rörelsesidan.** §5.4. Ett
   autocompletefynd väger inte tyngre än att påståendet blir osant vid varje
   registeromläggning.
6. **Skriv aldrig `högst betyg` i en rubrik.** §5.1. Fjärde dokumentet i rad.
7. **Skriv aldrig "Livsmedelskollen [stad]" på en sida hos oss.** §2.5. Mönstret
   kräver enligt `docs/29` §9 att vår tjänst är känd vid namn först, och frasen
   skrivs då av någon annan om oss.
8. **Låt aldrig en områdesbevakning bli ett mejl om varje anmärkning.** §6.4.
   Det är en värstinglista med en veckas fördröjning.
9. **Låt aldrig "öppet nu" bli grönt.** §6.3. Grönt är bedömningens språk.

---

## 9. Nästa steg, i ordning

1. **Få igång nattjobbet.** §4. Åtta dagars eftersläpning mot Uppsalas egen sida
   slår varje funktion i det här dokumentet. Punkten står redan i `docs/25` under
   "Din åtgärd", och den blir dyrare för varje vecka eftersom rörelseloggen i
   §5.4 inte kan räknas fram i efterhand.
2. **Bedömningsfilter i sökningen.** §6.2. Noll filer, datan ligger redan i
   klienten, och det är den enda av konkurrentens funktioner vi saknar som har
   belagd efterfrågan.
3. **Mät OSM-täckningen per kommun och pröva hopkopplingen.** §6.3. 66,4 procent
   i Stockholm är mätt, de elva andra är det inte, och 1 611 av 15 983 rader har
   en känd OSM-motpart.
4. **Öppna data som en fil.** §6.5. Billigast av allt som står kvar och den enda
   punkten som ändrar hur andra ser på oss.
5. **Mät om kvalitetsledet före nästa omgång.** §3. Autocomplete är färskvara,
   `docs/30` §8, och den här dokumentserien har nu fyra mätpunkter på samma
   fras.
