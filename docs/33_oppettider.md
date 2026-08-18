# 33. Öppettider och "öppet nu"

**Datum:** 2026-08-18
**Föregångare:** `docs/31_vad_far_folk_att_valja_oss.md` §5.2 och §6.3 mätte
efterfrågan och pekade ut OpenStreetMap som källa. `docs/17_produktfunktioner.md`
äger domen om grönt.
**Beställning:** ägaren, ordagrant: "öppet nu går ju att visa, det är bra om det
finns."
**Utfall:** byggt. **2 748 av 9 961 konsumentvända verksamheter (27,6 procent)**
har öppettider på sin sida. Inget filter, inga nya sidor, ingen JSON-LD.

---

## 1. Slutsatsen först

1. **Nämnaren i `docs/31` var fel, och den felet var stort.** Där mättes
   öppettiderna mot 15 983 rader. Sex tusen av dem är förskolekök,
   äldreboenden, matmäklare, grossister, transportörer och dricksvattenposter.
   En öppettid betyder ingenting för ett förskolekök, och OSM kartlägger inte
   heller sådana. Den riktiga nämnaren är **9 961**. §2.
2. **Täckningen är 27,6 procent av den nämnaren, och den är extremt ojämn.**
   Linköping 40,8 procent, Stockholm 36,5, Kristinehamn 5,9, och fyra kommuner
   på exakt noll. §3.
3. **De fyra nollorna beror inte på OSM utan på kommunerna.** Borgholm,
   Höganäs, Lomma och Svenljunga har 649 konsumentvända verksamheter UTAN
   KOORDINAT. De kan inte paras mot någonting alls, oavsett hur bra OSM är
   där. Deras OSM-uttag innehåller 106 matpunkter med öppettider som vi alltså
   inte kan nå. §3.2. Punkten stod först som "utan oss" och det var fel:
   geokodningen prövades 2026-08-18 och ingen av de fyra publicerar en
   gatuadress att geokoda. §10.1.
4. **Ett filter på "öppet nu" byggdes inte, och skälet är mätt.** På en
   kommunsida i Jönköping skulle ett sådant filter ha en känd tid för 65 av
   712 ställen. Det som ser ut som "här är de öppna" hade i själva verket varit
   "här är de nio procent vi råkar veta något om". §7.

---

## 2. Nämnaren

### 2.1 Varför 15 983 är fel tal

Beståndet innehåller 228 olika råvärden för verksamhetstyp, och de är inte
normaliserade mellan kommuner. `site/src/lib/categories.ts` löser redan upp dem
i fem toppkategorier, och den tabellen är sanningen. Konsumentvänt är
**Restauranger**, **Caféer och bagerier** och **Butiker**. Skolor och omsorg
och Övrigt är det inte: ingen besökare planerar ett besök på ett tillagningskök
på ett äldreboende, och OSM har ingen post för det.

Räkningen görs INTE av en kopierad tabell i pipelinen. `pipeline/oppettider.py`
anropar `classify()` i `categories.ts` med Node och får tillbaka
toppkategorierna. En avskrift av 228 råvärden till Python hade blivit en andra
sanning som glider isär från den första utan att någon märker det.

Höganäs enda stora grupp heter `Butik, restaurang och servering` och är
`spanning` i tabellens mening: ett känt värde som indelningen inte kan lösa
upp. Alla tre kategorier i den hinken är konsumentvända, så den räknas som
konsumentvänd i sin helhet. Det gäller 221 rader.

### 2.2 Talet

| | Rader |
|---|---:|
| Verksamheter totalt | 15 983 |
| **Konsumentvända** | **9 961 (62,3 %)** |
| Varav utan koordinat, och alltså omöjliga att para | 1 275 |
| Kvar att försöka para | 8 686 |

---

## 3. Täckningen per kommun

Mätt 2026-08-18 mot Overpass-uttag hämtade 2026-08-17. Kolumnen "OSM med
tider" är matpunkter i kommunen som har både namn och `opening_hours`;
"öppettid" är våra verksamheter som fick en belagd hopparning OCH ett uttryck
vi kunde tolka helt.

| Kommun | Rader | Konsumentvända | OSM-matpunkter | OSM med tider | Öppettid | Andel |
|---|---:|---:|---:|---:|---:|---:|
| Linköping | 1 243 | 676 | 485 | 407 (83,9 %) | **276** | **40,8 %** |
| Stockholm | 8 499 | 5 595 | 4 631 | 3 130 (67,6 %) | **2 041** | **36,5 %** |
| Karlstad | 693 | 446 | 306 | 158 (51,6 %) | **93** | **20,9 %** |
| Uppsala | 1 815 | 949 | 630 | 440 (69,8 %) | **194** | **20,4 %** |
| Oskarshamn | 239 | 129 | 49 | 19 (38,8 %) | **13** | **10,1 %** |
| Jönköping | 1 123 | 712 | 301 | 103 (34,2 %) | **65** | **9,1 %** |
| Örebro | 1 233 | 686 | 401 | 116 (28,9 %) | **59** | **8,6 %** |
| Kristinehamn | 170 | 119 | 59 | 10 (16,9 %) | **7** | **5,9 %** |
| Borgholm | 406 | 317 | 117 | 35 (29,9 %) | **0** | **0 %** |
| Höganäs | 310 | 212 | 79 | 27 (34,2 %) | **0** | **0 %** |
| Lomma | 153 | 78 | 58 | 17 (29,3 %) | **0** | **0 %** |
| Svenljunga | 99 | 42 | 24 | 7 (29,2 %) | **0** | **0 %** |
| **Summa** | **15 983** | **9 961** | **7 140** | **4 469** | **2 748** | **27,6 %** |

### 3.1 Vad `docs/31` mätte, och vad som stod i stället

`docs/31` §6.3 mätte 4 501 matpunkter i Stockholms kommun med 66,4 procents
täckning på `opening_hours`. Vårt uttag ger 4 712 element, varav 4 631
namngivna och 3 130 med `opening_hours`, alltså **66,4 procent av alla element**
och 67,6 procent av de namngivna. Samma tal. Det som var fel i det dokumentet
var inte OSM-mätningen utan vad den ställdes mot.

### 3.2 De fyra nollorna är vårt fel, inte OSM:s

| Kommun | Konsumentvända utan koordinat | OSM-matpunkter med tider som vi alltså inte når |
|---|---:|---:|
| Borgholm | 317 av 317 | 35 |
| Höganäs | 212 av 212 | 27 |
| Lomma | 78 av 78 | 17 |
| Svenljunga | 42 av 42 | 7 |

Uppsala och Örebro har samma brist på en del av beståndet: 377 respektive 249
konsumentvända rader saknar koordinat.

**Det är alltså inte öppettidsspåret som är stoppat i de fyra kommunerna, det är
geokodningen.** `pipeline/geocode.py` har inte körts på dem. Körs den, och den
tar Lantmäteriets belägenhetsadresser där uttaget finns, faller de här
nollorna av sig själva utan att en rad öppettidskod behöver ändras. Det är den
enskilt största åtgärden som återstår, och den ligger utanför den här omgången.

### 3.3 Varför träffar uteblir

Sammanräknat över alla tolv kommuner:

| Orsak | Antal | Vad det betyder |
|---|---:|---|
| `matched` | 2 748 | Fick öppettid |
| `no_osm_nearby` | 4 685 | Ingen OSM-punkt med samma namn inom radien |
| `matched_without_hours` | 1 100 | Rätt ställe hittat, men OSM har ingen `opening_hours` |
| `no_coordinate` | 1 275 | Vi saknar koordinat, se §3.2 |
| `unsupported_syntax` | 84 | Uttryck utanför vår delmängd, se §5 |
| `ambiguous_name_nearby` | 67 | Två OSM-punkter med samma namn och olika tider |
| `no_name` | 2 | Verksamheten saknar användbart namn |

De 1 100 under `matched_without_hours` är värda att stanna vid: där vet vi
vilket OSM-objekt det är, och uppgiften saknas hos källan. Det är den enda
posten i tabellen som skulle kunna fyllas genom att någon kartlägger i OSM.

---

## 4. Hopparningen

En öppettid som står på fel ställe är värre än ingen öppettid alls. Läsaren har
inget sätt att upptäcka felet, och följden är att någon står utanför en låst
dörr. Regeln är därför: **en hopparning ska vara belagd på namn OCH närhet, och
en osäker hopparning ska hellre utebli.**

Koden ligger i `pipeline/prikko/oppettider.py`, proven i
`pipeline/tests/test_oppettider.py` (50 stycken).

### 4.1 Reglerna

1. **Närhet ensam räcker aldrig.** Södermalm har 607 restauranger i en enda
   kategoriskärning. Närmaste OSM-punkt inom hundra meter är i det kvarteret en
   gissning.
2. **Radien är 100 meter**, eller 250 när vår egen koordinat bara är gatunivå
   (`geoPrecision: approximate`, alltså grannporten). Namnkravet är det som bär
   hopparningen, inte radien.
3. **Namnen jämförs som ordmängder** efter att bolagsformer strukits.
   Antingen är mängderna lika, eller så är den ena en hel delmängd av den
   andra på minst två ord.
4. **Ett ENSAMT gemensamt ord måste vara huvudordet i BÅDA namnen**, alltså
   första ordet som inte är en verksamhetsform. Regeln kom ur en granskning av
   de 465 hopparningar som vilade på ett enda ord. De felaktiga vilade
   genomgående på ett ORTNAMN eller ett GATUNAMN som båda namnen råkade bära
   för att de ligger på samma plats:

   | Vårt register | OSM | Avstånd |
   |---|---|---:|
   | Livs Södermalm | ICA Kvantum Södermalm | 62 m |
   | United Spaces Götgatsbacken | Götgatsbacken | 85 m |

   Kravet kostade 40 riktiga par, bland andra "Dramaten Restaurangen/ Frippe"
   mot "Frippe". Det är rätt riktning att fela åt.
5. **Tvetydighet fäller båda.** Ligger två OSM-punkter med samma normaliserade
   namn inom radien och de har OLIKA öppettider blir det ingen träff. Samma
   punkt kartlagd två gånger med samma tider går däremot bra: vilken vi tar
   spelar ingen roll.
6. **Öppettiden skrivs bara på konsumentvända verksamheter.** Ett förskolekök
   som råkar ligga tio meter från ett café ska aldrig ärva caféets öppettid.

### 4.2 Vad hopparningen ser ut som när den fungerar

Slumpade par ur Stockholm, oredigerade:

| Vårt register | OSM |
|---|---|
| Bun Bo Hue | Bún Bò Huê |
| Meatballs - For the people | Meatballs for the People |
| Mae Thai Fridhemsplan | Mae Thai |
| Kronans Apotek Karlbergsvägen 43b | Kronans Apotek |
| Pizzeria Bodino | Bodino |
| Pressbyrån 4205454 | Pressbyrån |

Kedjorna är det svåraste fallet och löses av radien plus tvetydighetsregeln:
`Pressbyrån 4205454` paras med den Pressbyrå som ligger sex meter bort, och
skulle två Pressbyråer med olika tider ligga inom hundra meter blir det ingen
träff alls.

---

## 5. Vilken delmängd av `opening_hours` vi stöder

`opening_hours` är ett eget litet språk med veckonummer, datumintervall,
soluppgång, ordningstal och kommentarer. **Ett uttryck vi inte förstår HELT
kastas**, och verksamheten får ingen öppettid. En halvtolkad öppettid är precis
den sortens fel som gör att någon står utanför en låst dörr.

Delmängden, i BNF-liknande form:

```
uttryck   := block (";" block)*
block     := "24/7" | "off" | "closed" | del ("," del)*
del       := dagar | dagar? tider | dagar? ("off" | "closed")
dagar     := dagspec ("-" dagspec)?      ("PH" räknas som dagspec)
dag       := Mo | Tu | We | Th | Fr | Sa | Su
tider     := tid "-" tid
tid       := H+:MM, timmen får gå till 47
```

### 5.1 Kommatecknet betyder tre saker

Alla tre finns i vår data, och det är därför delarna klassas på vad de
INNEHÅLLER och inte på vilket tecken som står före dem:

```
Sa,Su 12:00-21:00                       en dagslista
Mo-Fr 11:00-14:00,17:00-22:00           två pass samma dag
Mo-Fr 11:00-21:00, Sa-Su 12:00-21:00    två regler
```

**758 av våra 3 913 uttryck (19,4 procent) använder kommatecknet som
regelavskiljare.** En tolkare som bara delar på semikolon lämnar 399 uttryck
(10,2 procent) utanför delmängden. Med kommatecknet inräknat, plus de 76
uttryck som skriver ett bart tidsspann utan dagdel (`07:00-22:00`, vilket
betyder varje dag) och timmar över 24 (`16:00-25:00` betyder klockan ett på
natten), är det **121 uttryck (3,1 procent)** som faller utanför.

### 5.2 Vad som faller utanför, och varför det ska göra det

De 121 som återstår går inte att stödja utan att gissa:

| Form | Exempel ur vår data | Varför |
|---|---|---|
| Öppet slut | `Tu-Sa 17:00+` | Säger när det öppnar men inte när det stänger. Går inte att svara "öppet nu" med. |
| Säsong | `May 13-Sep 06`, `Apr-Sep Mo-Su,PH 12:00-20:00` | Kräver en datumkalender vi inte har byggt. |
| Veckonummer | `week 28-32: Su 10:00-15:00` | Samma sak. |
| Rörlig helgdag | `Jan 05,easter -1 day,Apr 30 10:00-15:00` | Samma sak. |
| Kommentar | `12:00-17:00 "Meddelande på webbplatsen"` | Uppgiften finns inte, texten säger var den finns. |
| Permanent stängt | `closed` | Inget schema att visa. Verksamheten får inget avsnitt, vilket är rätt. |

### 5.3 Röda dagar

`PH` i OSM betyder röd dag i det land objektet ligger i. **61 av våra 2 748
uttryck bär en helgdagsregel.** Utan stöd för den hade en verksamhet som
skriver `PH off` stått som öppen på juldagen.

`isPublicHoliday()` i `site/src/lib/oppettider.ts` räknar de tretton röda
dagarna enligt lagen (1989:253) om allmänna helgdagar, med Gauss påskformel för
de rörliga. **Midsommarafton, julafton och nyårsafton är INTE allmänna helgdagar
i lagens mening** och räknas därför inte, trots att många har stängt då. Att
lägga dit dem hade varit att tolka mer än källan säger.

### 5.4 Andra former som faktiskt förekommer

| Form | Antal av 2 748 |
|---|---:|
| Öppet över midnatt (`18:00-02:00`) | 328 |
| Två pass samma dag (lunch och kväll) | 61 |
| Helgdagsregel | 61 |

Alla tre stöds, och alla tre har egna prov med inskickad klocka i
`site/scripts/check-oppettider.ts` (38 stycken).

---

## 6. Hur det visas

### 6.1 Var på sidan

Avsnittet står **direkt under kartan** i huvudkolumnen på verksamhetssidan, och
det är inte godtyckligt. De två avsnitten svarar på samma sorts fråga, var
ligger det och när är det öppet, och båda är HÄRLEDDA av oss ur OpenStreetMap i
stället för hämtade ur kommunens register.

Ovanför kontrollberättelsen får de inte stå. En öppettid mellan bedömningen och
"Vad kontrollen visade" läses som en del av beskedet, och den kommer inte från
kommunen.

**Saknas tiderna visas ingenting alls.** Ingen rubrik, ingen rad som säger att
vi inte vet. Sajten skriver aldrig ut att den saknar en uppgift; en tom ruta med
"Öppettider saknas" är en rad som ser ut som ett besked, och den hade stått på
över tio tusen sidor.

### 6.2 Veckoschemat i filen, tillståndet i webbläsaren

Sju rader, måndag först, renderade vid bygget. De ändras inte under dagen, de är
citerbara, och de är vad ett sökresultat kan plocka.

**"Öppet nu" räknas i webbläsaren och aldrig vid bygget.** Sajten är statisk och
en HTML-fil kan ligga i en cache i timmar; ett tillstånd skrivet vid bygget hade
varit osant större delen av dygnet. Utan JavaScript syns schemat men ingen
pille, och det är rätt ordning: vi påstår hellre ingenting än fel sak.

Samma dom som `Foretagsuppgifter.astro` redan tagit för företagens egna
öppettider, ordagrant därifrån: "Öppet nu GÅR inte att sätta vid bygget."

Tre tillstånd:

| Tillstånd | Text | Färg |
|---|---|---|
| Öppet | "Öppet nu · Stänger 22:00" | `--brand-ink`, märkesbläck |
| Stänger inom en timme | "Stänger snart · Stänger 22:00" | `#B26B00`, bärnsten |
| Stängt | "Stängt nu · Öppnar i morgon 11:00" | `--ink-quiet`, dämpat grått |

Tröskeln för "stänger snart" är **60 minuter**. Kortare och beskedet kommer för
sent för den som ska ta sig dit, längre och halva kvällen står som en varning.

Klockan läses ur **Europe/Stockholm** och aldrig ur webbläsarens egen tidszon.
Öppettider gäller på plats; en läsare i London ska se restaurangens klocka.

### 6.3 Grönt lånas aldrig ut

`docs/17` stoppade en grön "öppet nu"-pille redan i rapport 15, och den domen
står. Grönt är bedömningens språk på den här sajten. En grön pille bredvid ett
verksamhetsnamn läses som hygien och inte som klockslag, och sidan bär redan ett
grönt märke som betyder något helt annat.

### 6.4 Källan står i sidans fot, en gång för hela sidan

Avsnittet har ingen egen källrad och ingen egen (i)-knapp. Attributionen står i
`Sidupphov.astro`, i källfoten längst ned på verksamhetssidan, och räknar upp
exakt de OSM-fält sidan visar.

Ordagrant på sidan, när alla fälten finns:

> Kartnålens läge, hållplatsen, parkeringarna, öppettiderna och kontaktkortet
> kommer från © OpenStreetMap contributors, ODbL 1.0, hämtat 18 augusti 2026.
> Rätta uppgiften

**Skälet är ODbL 4.3.** Villkoret gäller "the Produced Work", alltså sidan, och
föreskriver ingen notis per block. Sidan bar tre sådana notiser för en enda
källa, uppmätt i bygget 2026-08-18 till y 464, 2 491 och 2 898 i 1 200 px, och
ägaren såg det: "i-ikonen på bra att veta ... sitter liksom helt ensamt ...
måste vi ens ha det?"

Två länkar i raden och inte en. `openstreetmap.org/copyright` är OSM:s egen
upphovssida, den licensen och stiftelsens riktlinjer pekar på, och den fanns
tidigare ingenstans på sajten. "Rätta uppgiften" går till objektet, så att den
som ser ett fel rättar det vid källan i stället för att skriva till oss om
något vi inte äger.

Ordet OpenStreetMap står i foten och aldrig ute i innehållet. Ägarens regel,
"skriv inte ut openstreetmap, den ska ligga i I-ikonen, HA INGET SÅNT där",
gällde källraden INTILL varje uppgift. En fotnot längst ned kommenterar ingen
enskild rad.

**Kartans egen upphovsrad rörs inte.** MapLibres `AttributionControl` i
`Platskarta.astro` gäller kakelleverantören och kartdatan bakom bilden, alltså
något annat än de fält vi hämtat ur Overpass, och den laddas av kartbiblioteket.

### 6.5 Verksamhetens egna tider slår OSM:s

`Foretagsuppgifter.astro` visar de öppettider verksamheten själv skickat in och
redaktionen släppt fram. De är förstahandsuppgifter. När det avsnittet får en
vecka att rita **döljer det OSM-avsnittet**: två veckoscheman med olika
klockslag på samma sida är sämre än ett.

Modulerna hålls åtskilda med flit. `lib/foretag.ts` äger den insända formen och
`lib/oppettider.ts` OSM-formen. De ser lika ut på skärmen och är olika data med
olika villkor.

### 6.6 Ingen JSON-LD

Tiderna går INTE in i `openingHoursSpecification`, av två skäl som var för sig
räcker.

`openingHoursSpecification` har ingen flagga för "härledd ur en annan källa". Ett
schema som ser identiskt ut för en tid verksamheten själv uppgett och en tid vi
läst i OSM saknar förbehållet exakt där maskinen läser. Det är samma dom som
`geo` fick i `[slug].astro`, och av samma skäl.

Och `Foretagsuppgifter.astro` skriver redan en nod med SAMMA `@id` när
verksamhetens egna tider kommit hem. Två noder med samma id slås ihop av den som
läser dem, alltså hade OSM:s tider blandats med förstahandsuppgifter utan att
någon kan se vilken som är vilken. På skärmen löses det genom att avsnittet
döljs; i strukturerad data finns ingen motsvarande väg.

---

## 7. Varför det inte finns något filter

Beställningen säger att ett filter på "öppet nu" aldrig får tyst dölja de vi
saknar tider för. Räknat är slutsatsen starkare än så: **filtret ska inte finnas
alls, ännu.**

| Kommunsida | Konsumentvända | Med känd tid | Filtret hade vetat något om |
|---|---:|---:|---:|
| Jönköping | 712 | 65 | 9,1 % |
| Örebro | 686 | 59 | 8,6 % |
| Kristinehamn | 119 | 7 | 5,9 % |
| Borgholm | 317 | 0 | 0 % |

Ett filter ser auktoritativt ut. Besökaren kan inte skilja "stängt" från "vi vet
inte", och på en kommunsida i Jönköping hade "öppet nu" i praktiken betytt "de
nio procent vi råkar veta något om". Att lägga till "okänd" som en synlig
kategori löser inte det, det gör bara luckan mätbar för den som redan förstått
problemet.

**Vad som skulle ändra domen:** täckningen i den kommun filtret sitter på. Över
ungefär två tredjedelar av de konsumentvända är ett filter en upplysning; under
en tredjedel är det en vilseledning. Ingen kommun ligger i dag över två
tredjedelar, och Linköping ligger högst på 40,8 procent. Kör
`pipeline/oppettider.py --matt` och läs andelen innan någon bygger filtret.

Samma resonemang gäller listor och kort: ingen "Öppet nu"-etikett i
sökresultatet, på kommunsidan eller på kartan. En etikett som står på var
fjärde rad läses som ett besked om de tre andra.

---

## 8. Vad det kostade i filer

**Noll.** Inga nya sidor, ingen ny sidtyp, ingen ny route. Avsnittet ritas på
sidor som redan finns. Filtaket är hårt, se `docs/25_oppna_punkter.md`, och
ägarens regel gäller: "jag köper sidor för SEO men inte för funktioner."

Datafilerna växte med cirka 45 000 rader. Veckoschemat skrivs därför som en RAD
per dygn (`"660-840,1020-1320"`) och inte som nästlade listor: med `indent=1`,
som resten av datafilerna skrivs med, hade nästlade listor blivit femtio rader
per verksamhet, alltså drygt 100 000 rader, och gjort varje framtida diff
oläsbar. Uppackningen är en `split` i `lib/oppettider.ts`.

---

## 9. Hur det körs om

```
python3 pipeline/oppettider.py --matt site/src/data/*.json   # mäter, skriver inget
python3 pipeline/oppettider.py site/src/data/*.json          # skriver hours
python3 pipeline/oppettider.py --refresh site/src/data/*.json  # hämtar OSM på nytt
```

OSM-uttaget cachas i `pipeline/data/interim/osm_poi_<kommunkod>.json`, utanför
versionshanteringen precis som adressuttagen i `geocode.py`. Utan `--refresh`
görs inga nätanrop för en kommun som redan har sitt uttag.

**Overpass är opålitligt.** Körningen 2026-08-17 fick HTTP 504 på sju av tolv
kommuner och HTTP 429 på en. Skriptet växlar mellan två speglar och backar av,
och det räcker: alla tolv gick till slut igenom. Men en kommun svarade `200` med
en TOM lista, och det är farligare än ett fel. Örebro fick noll matpunkter, och
hade uttaget skrivits till disk hade nästa körning läst det ur cachen och tyst
tagit bort öppettiderna i hela kommunen. Därför gäller: **noll matpunkter är ett
fel och inte ett utfall**, körningen stannar, och uttaget skrivs inte.

Proven körs så här och ingår i det som ska vara grönt före en push:

```
python3 pipeline/tests/test_oppettider.py     # 50 prov
node site/scripts/check-oppettider.ts         # 38 prov med inskickad klocka
```

---

## 10. Vad som återstår

1. ~~**Geokoda Borgholm, Höganäs, Lomma och Svenljunga.**~~ **Går inte, och
   skälet är mätt.** Punkten stod här som den enskilt största åtgärden.
   Försöket gjordes 2026-08-18 och gav noll nya nålar i alla fyra, eftersom
   ingen av dem publicerar en gatuadress:

   | kommun | verksamheter | adressrader | varav med husnummer | distinkta orter |
   |---|---:|---:|---:|---:|
   | Borgholm | 406 | 251 | **0** | 22 |
   | Höganäs | 316 | 156 | **0** | 13 |
   | Svenljunga | 99 | 32 | **0** | 11 |
   | Lomma | 153 | **0** | 0 | 0 |

   De tre översta publicerar en ORT och inget mer, och inte en av de 439
   raderna innehåller så mycket som en siffra. Lomma publicerar varken ort
   eller adress: kommunens fyra listsidor lästes om samma dag och bär namn,
   färg, datum och avvikelser. Den enda gatuadressen på sidorna är kommunens
   egen besöksadress i sidfoten. Inläsarna missar alltså ingenting.

   En ortmittpunkt vore ingen lösning utan en gissning. Färjestaden och
   Byxelkrok är kilometer breda, och en nål i ortens mitt är fel adress för
   nästan varje verksamhet. Hopparningen i §4 kräver dessutom hundra meter,
   så en ortnål hade inte gett en enda riktig öppettid utan bara felaktiga.

   Det som öppnar de fyra är att kommunen börjar lämna ut adressen, ingenting
   annat. Se `pipeline/geocode.py` och `pipeline/prikko/sources/lomma.py`.

   Uppsala och Örebro geokodades däremot om samma dag och steg från 966 till
   986 respektive tillbaka till 645. Kvar utan nål står 868 i Uppsala och 588
   i Örebro, och det är OSM:s luckor: 242 gatunamn och 296 husnummer saknas i
   Uppsalas uttag, 328 och 259 i Örebros. Lantmäteriets register hade täckt
   dem, och den ansökan avslogs 2026-08-17. Se
   docs/34_ny_ansokan_lantmateriet.md.
2. **Kör om uttagen med jämna mellanrum.** OSM ändras. `checkedAt` står på varje
   post och på sidan, så en gammal uppgift är åtminstone märkt som gammal.
3. **Filtret, men först när täckningen bär det.** §7 säger vad talet ska vara.
4. **Rör inte säsongsuttrycken utan att bygga en datumkalender.** De 121
   uttrycken utanför delmängden är utanför för att de kräver något vi inte har,
   inte för att tolkaren är slarvig.
