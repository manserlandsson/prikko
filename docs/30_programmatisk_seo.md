# 30. Programmatisk SEO: vilka axelpar som bär

**Datum:** 2026-08-14
**Föregångare:** `docs/26_seo_bortom_hygienordet.md` och
`docs/29_alternativ_till_monstret.md`, vars metod används rakt av.
**Beställning:** gasa på programmatisk SEO, "en mall gånger ett dataset ger
femhundra sidor".
**Utfall:** ett axelpar byggt, fem nollställda, och en omvärdering av vad
begränsningen faktiskt är.

---

## 1. Slutsatsen först

Prikko ÄR redan programmatisk SEO. Sex sidtyper gånger ett dataset ger 16 662
sidor. Frågan var därför aldrig om metoden ska införas utan vilka kombinationer
som ännu inte byggts OCH som någon faktiskt söker på.

Fyra slutsatser, i fallande ordning av hur mycket de betyder.

1. **Begränsningen är varken mallar eller dataset. Den är filtaket.** Bygget
   ligger på 16 898 filer av Cloudflare Pages 20 000. Ett nationellt bestånd är
   omkring 96 000 filer. "En mall gånger 290 kommuner" är alltså inte en
   ambitiös version av det vi gör, det är fem gånger mer än plattformen tar.
   Räkningen står i §3.
2. **Nästa kommun är dyrare än nästa stadsdel, och stadsdelen är efterfrågad.**
   `restauranger [stadsdel]` kompletteras för 17 av 18 prövade stadsdelar i
   Stockholm OCH för 18 av 18 utanför Stockholm. Områdessidor finns bara i
   Stockholm, och orsaken är att OSM saknar polygoner på annat håll. Det är den
   billigaste obrukade ytan vi har. §5.2.
3. **Det som byggdes är område gånger kategori.** 21 nya sidor, 24 av 24 mätta
   fraser kompletteras. §6.
4. **Fem par gav noll och byggdes inte.** Bedömning gånger kommun, skadedjur
   gånger kommun, år gånger vad som helst, kontrollpunkt som eget sökord, och
   övrigtkategorin gånger stadsdel. §7. Två av dem motsäger dessutom docs/26,
   och det ska stå rakt ut. §8.

---

## 2. Metod

Identisk med docs/26 §2 och docs/29 §2, så att utfallen går att lägga bredvid
varandra. Googles förslagsslutpunkt med `client=chrome`, `hl=sv` och `gl=se`,
plus DuckDuckGo som oberoende kontroll. **265 frågor i två omgångar**, 195 i den
första och 70 i den andra.

Läsanvisningen är densamma och upprepas för att den avgör allt:

- Ett förslag är ett **positivt belägg** för att frasen skrivs. Ett uteblivet
  förslag betyder att frasen ligger **under mätgolvet**, inte att den är noll.
- Metoden ger **ingen volym**, bara existens och rangordning. Varje tal i det
  här dokumentet kommer ur vårt eget bestånd eller ur en namngiven källa.

### 2.1 Fällan, och en ny fälla ovanpå den

Docs/29 §2 varnar för att slutpunkten faller tillbaka på **luddig
prefixmatchning**: `alternativ till max` svarar `alternativ till maxxfan`, vilket
ser ut som en träff och är en nolla. Varje fras här är läst med den kontrollen.

Kontrollen infördes först som rak ordgränsmatchning, och då uppstod motsatt fel.
Kontrollorden är **stammar**: `pizzeri` måste få matcha `pizzeria` och
`kackerlack` måste få matcha `kackerlackor`. Med hela ord föll 36 av 36
kategorifraser ut som nollor trots att svaren var uppenbara träffar.

Regeln som används är därför: kontrollordet måste stå i **början av ett ord** i
förslaget, och det som följer måste vara en **svensk böjningsändelse**.
`pizzeri` plus `a` går igenom, `max` plus `xfan` faller. Dessutom får
kontrollordet självt kapas ned till sin stam, så att sökordet `restauranger`
godtar svaret `restaurang rosta örebro`; det är samma fråga i singular, och att
räkna den som en nolla vore att mäta vår egen formulering i stället för
läsarens.

Matcharen självtestas mot docs/29:s kända utfall före varje körning:
`alternativ till maxxfan` måste falla, `restauranger stockholm` måste hålla. Det
är billigt och det är enda sättet att veta att mätningen mäter samma sak som
förra gången.

### 2.2 Vad som inte gick att mäta

Semrush och Google Trends prövades inte om. Docs/26 §2 lämnade dem som
obesvarade, och ingenting här hänger på volymtal.

---

## 3. Filtaket, och varför det avgör rangordningen

Det här avsnittet är beställningens viktigaste fråga och förtjänar sitt eget
svar med tal: slår en befintlig mall gånger 290 kommuner fem nya mallar gånger
12?

**I princip ja, med mycket god marginal. I praktiken går det inte att göra.**

### 3.1 Vad ett bygge kostar i filer

Räknat i bygget 2026-08-14, alltså med den här ändringen inne:

| | Antal |
|---|---:|
| Filer totalt | 16 898 |
| Varav HTML | 16 662 |
| Verksamhetssidor | 15 983 |
| Kategorisidor | 255 |
| Kommunsidor med sidindelning | 190 |
| Områdessidor, med kategorisnitten | 113 |
| Kedjesidor | 53 |
| Artiklar | 25 |
| Kartor, rapporter, utmärkelser, start och övriga toppsidor | 42 |
| **Cloudflare Pages tak** | **20 000** |
| **Marginal** | **3 102** |

Overheaden är liten och skalar med beståndet: 15 983 verksamheter drar med sig
558 kommunbundna list- och kartsidor, alltså **1,035 sidor per verksamhet**.

### 3.2 Vad riket skulle kosta

Livsmedelsverkets rapport "Sveriges livsmedelskontroll 2024" (L 2025 nr 13) ger
92 746 anläggningar i myndigheternas register. Med samma overhead:

| | Antal |
|---|---:|
| Anläggningar i riket | 92 746 |
| Sidor vid samma arkitektur | **cirka 95 800** |
| Tak | 20 000 |
| **Överskridande** | **4,8 gånger** |

Taket nås vid **cirka 19 300 verksamheter**, alltså efter ytterligare **cirka
3 000**.
Det är omkring 3,4 procent av rikets bestånd, eller **två till tre kommuner av
normalstorlek**. Docs/14 rad 285 sade redan exakt det, och docs/22 §1 kallade
det den verkliga väggen. Mätningen bekräftar dem på dagsfärskt bestånd.

### 3.3 Vad det betyder för rangordningen

Kommunexpansionen i docs/20 är blockerad på att ägaren fyller i `SENDER_EMAIL`.
Det är sant och det är inte hela sanningen. **Mejladressen låser upp två till
tre kommuner. Arkitekturbeslutet i ADR 0001 låser upp de återstående 275.**

Ordningen som följer av det:

1. Sidtyper som ryms i de dryga 3 000 filer som är kvar och som har mätt
   efterfrågan. Det är vad det här dokumentet bygger.
2. Beslutet i ADR 0001 om hybridrendering på Workers, som måste fattas före
   kommun nummer tjugo och som blir dyrare ju senare det fattas.
3. Kommunexpansionen, som är rätt sak men som inte kan gå långt före punkt 2.

Att mata in kommuner nu utan att fatta beslutet betyder att sajten slutar gå att
rulla ut mitt i kampanjen, med brev redan skickade till myndigheter som
diarieför allt. Det är den dyraste ordningen av alla.

---

## 4. Axlarna, och vilka par som är byggda

Datat har åtta axlar. Räknat ur beståndet 2026-08-14:

| Axel | Värden | Anmärkning |
|---|---:|---|
| Kommun | 12 | av 290 |
| Toppkategori | 5 | restaurang, café, butik, skola, övrigt |
| Underkategori | 21 | ingen finns i alla kommuner |
| Område | 60 i filerna | varav 53 i Stockholm, 30 med egen sida |
| Kedja | 52 | 1 564 ställen |
| Verksamhetstyp, rå | 228 | onormaliserad, se `categories.ts` |
| Kontrollpunkt | 154 koder | rikt redovisad i 2 kommuner av 12 |
| År | 2017 till 2026 | |
| Bedömning | 4 lägen | clean, minor, major, ingen |

Paren, och vad som finns i dag:

| Par | Läge | Sidor |
|---|---|---:|
| Kommun × verksamhet | byggt | 15 983 |
| Kommun × kategori | byggt | 255 |
| Kommun × område | byggt, bara Stockholm | 70 |
| Kommun × bedömning | byggt som `/anmarkningar/` och `/matsnusk/` | i de 190 |
| Kedja × riket | byggt | 53 |
| År × kommun | byggt som utmärkelser | 6 |
| **Område × kategori** | **obyggt, byggs här** | **21** |
| Kedja × kommun | obyggt, **nollställt i docs/29** | 298 hade det blivit |
| Kontrollpunkt × kommun | obyggt, nollställt här | |
| Kategori × riket | obyggt, se §7.5 | |
| Verksamhetstyp rå × kommun | ogörligt, typerna är inte normaliserade | |

Kontrollpunktsaxeln förtjänar sin egen mening. Den ser bred ut med 154 koder och
är det inte: **Linköping redovisar 126 koder, Örebro 60, Stockholm 15, Borgholm
9, Lomma och Uppsala 1, och fem kommuner redovisar ingen alls.** En sidtyp på den
axeln hade funnits i två kommuner av tolv. Det är samma sorts utlämnandegräns som
docs/26 §6 beskriver för ren historik, och den ska skrivas ut varje gång den
påverkar ett tal.

---

## 5. Mätningen, par för par

### 5.1 Område × kategori. Starkast, och byggt

24 av 24 fraser kompletteras. Fyra kategoriord gånger sex stadsdelar:

| | Södermalm | Östermalm | Kungsholmen | Vasastan | Gamla stan | Liljeholmen |
|---|---|---|---|---|---|---|
| `restauranger` | ja | ja | ja | ja | ja | ja |
| `caféer` | ja | ja | ja | ja | ja | ja |
| `pizzeria` | ja | ja | ja | ja | ja | ja |
| `bageri` | ja | ja | ja | ja | ja | ja |
| `mataffär` | ja | ja | ja | ja | ja | ja |

Restaurangledet ensamt prövades mot 18 stadsdelar och kompletteras för 17.
Enda nollan är Hjorthagen, som svarar med noll förslag över huvud taget.

Kvalitetsledet följer med ned på stadsdelsnivå, vilket är det enskilt viktigaste
i tabellen: `restauranger södermalm högst betyg`, `restauranger norrmalm högst
betyg`, `restauranger liljeholmen högst betyg`, `bästa restauranger södermalm
högst betyg`, `pizzeria kungsholmen högst betyg`, `cafe kungsholmen högst betyg`.
Docs/26 §4.1 fann formen per stad och docs/29 §7 fann den utan ortsnamn. Den
finns alltså på **varje kornighet vi har**: riket, kommunen, stadsdelen och
närhetsformen.

Det ändrar ingenting om vad som får stå i en rubrik. `högst betyg` är Googles
stjärnbetyg i läsarens huvud och vi har inga stjärnor. Frasen står här som
belägg, aldrig som förlaga, precis som docs/26 §8 punkt 5 kräver.

### 5.2 Område utanför Stockholm. Starkast av alla, och blockerat

18 av 18 kompletteras, i fem kommuner som alla saknar områdessidor:

| Kommun | Prövade stadsdelar | Kompletteras |
|---|---|---|
| Uppsala | Luthagen, Gottsunda, Flogsta, Sävja | 4 av 4 |
| Linköping | Vasastaden, Ryd, Berga, Hjulsbro | 4 av 4 |
| Örebro | Adolfsberg, Vivalla, Marieberg, Rosta | 4 av 4 |
| Jönköping | Råslätt, Huskvarna, Gränna | 3 av 3 |
| Karlstad | Norrstrand, Kronoparken, Våxnäs | 3 av 3 |

Svansen är dessutom vår: `restauranger huskvarna högst betyg`, `restauranger
gränna högst betyg`, `restauranger gränna öppet nu`.

**Blockeraren är inte vår kod utan OSM.** `pipeline/omraden.py` läser bara
polygoner, och skälet står utförligt där: namnen finns överallt som punkter
(Stockholm 166, Uppsala 41, Jönköping 60, Karlstad 53), men en punkt kan inte
säga var ett område slutar, och att rita en cirkel runt noden vore att publicera
en gräns vi hittat på. Polygonutfallet är Stockholm 56, Karlstad 3, Linköping 2,
och noll i Uppsala, Örebro, Jönköping, Kristinehamn och Oskarshamn.

Den regeln ska inte ändras. Vad som ändras är hur högt spåret värderas:

- Det har **den bäst belagda efterfrågan i hela undersökningen**, 18 av 18.
- Det kostar **nästan inga filer**. Tio områden i en kommun är cirka tio
  områdessidor plus en handfull kategorisnitt. Fem kommuner är kanske 150 sidor,
  mot de dryga 3 000 vi har kvar. Kommunexpansionen kostar tusentals.
- Det är den enda ytan där mer dataset inte kolliderar med taket i §3.

Vägen fram är att polygonerna kommer till i OSM, inte att vi hittar på dem. Det
är en kartläggningsinsats och ingen kodinsats, och den bör värderas mot att den
låser upp en efterfrågan vi mätt till 18 av 18.

### 5.3 Underkategori × kommun. 36 av 36, och nästan bara datablockerat

Sex kategoriord gånger sex städer, samtliga kompletteras:

`pizzeria`, `bagerier`, `caféer`, `mataffärer`, `förskolor` och `gatukök`, i
Stockholm, Uppsala, Linköping, Örebro, Jönköping och Karlstad.

Mallen finns redan, `/[kommun]/kategori/[topp]/[under]/`. Ändå har `bageri` sida
bara i Stockholm, `pizzeria` bara i Jönköping och Örebro, och Uppsala har inte en
enda underkategori alls. Orsaken är källan och inte tröskeln: Uppsalas
grovetikett `Restaurang och servering` sväljer kommunens alla caféer, och
`categories.ts` vägrar med rätta gissa. Att härleda `Pizzeria` ur verksamhetens
namn vore precis den heuristik filens huvud förbjuder.

Räknat mot `MIN_SUB_PAGE = 50` ligger **17 par mellan 25 och 50**, alltså
blockerade bara av tröskeln. De största är `pizzeria linköping` (48),
`enklare-servering linköping` (44), `pizzeria karlstad` (43) och `bageri
jönköping` (27). Tröskeln sänks ändå inte: motiveringen i `data.ts` är att
underkategorin konkurrerar med sin egen toppkategori om samma sökning, och den
motiveringen står oemotsagd av allt som mätts här. Elva av de sjutton är
dessutom övrigtkategorier som `grossist` och `lager`, alltså sidor ingen söker.

**Dom: rör inte tröskeln. Spåret öppnas av bättre källdata, inte av en lägre
ribba.**

### 5.4 Närhetsformen. Bekräftar docs/29 §7 på fyra nya ord

6 av 6. `pizzeria nära mig`, `bageri nära mig`, `mataffär nära mig`, `café nära
mig`, `gatukök nära mig`, `restaurang nära mig öppet nu`. Och kvalitetsledet
igen: `bageri nära mig högst betyg`, `mataffär nära mig högst betyg`, `cafe nära
mig högst betyg`.

Ingen ny sida. Det är en kartfråga och `/karta/` finns, precis som docs/29 §7
punkt 2 slog fast.

---

## 6. Vad som byggdes

### 6.1 Sidtypen

`/[kommun]/omrade/[område]/[kategori]/`, med sidindelning under
`/sida/[n]/`. Ingen ny routefil: formen ligger i den befintliga
`[...path].astro`, av samma skäl som kategorisidorna har en fil för fyra former.

Ingen ändring i `sidtyp()` behövdes heller, och det kontrollerades innan bygget:
`segments[1] === 'omrade'` fångar varje djup under `/omrade/`, så samtliga nya
adresser hamnar i gruppen `omraden` och ingen faller i sitemapens restgrupp.

### 6.2 Urvalet, och varför det är 21 sidor och inte 34

Två gränser gäller samtidigt.

**Området måste självt ha en sida** (`MIN_AREA_PAGE = 25`). Det ger 30 områden,
alla i Stockholm.

**Snittet måste bära mer än området** (`MIN_AREA_CATEGORY_PAGE = 50`). Talet är
`MIN_SUB_PAGE`, inte `MIN_CATEGORY_PAGE`, och skälet är hämtat ordagrant ur
`data.ts`: snittet ligger ett steg längre in och konkurrerar med sin egen
förälder om samma sökning, alltså måste det bära mer för att vara värt en URL.

| Tröskel | Snitt som får sida | Sidor med sidindelning |
|---:|---:|---:|
| 25 | 34 | 56 |
| **50** | **21** | **43** |

De tretton som skiljer ligger mellan 26 och 44 verksamheter. Om Search Console
visar klick på dem är 25 rätt tal, men det beslutet fattas på mätning och inte
på magkänsla. Samma undantagsform som docs/26 §5 ger Stockholm.

### 6.3 Fyra kategorier av fem, och varför övrigt inte finns

`ovrigt` är uteslutet, och det är mätt och inte antaget. Andra omgången prövade
grossist- och lagerledet mot åtta stadsdelar:

| Fras | Kompletteras |
|---|---|
| `grossist [område]` | 2 av 8 |
| `lager [område]` | 7 av 8, **men samtliga träffar är klädeskedjan Lager 157** |

Ordet matchar medan avsikten tillhör en annan bransch. Det är exakt fällan
docs/26 §4.1 beskriver för `fräsch`, som utan `restaurang` bredvid sig betyder
sallad. Fem övrigtsidor hade byggts mot en efterfrågan som inte är vår.

De fyra som står kvar är alla belagda: restauranger 17 av 18, caféer 6 av 6,
skolor och omsorg 23 av 24 för förskoleledet, butiker 7 av 8.

**En reservation som står i koden och ska stå här:** butiksledets efterfrågan är
belagd under ordet **mataffär**, inte under ordet butiker. `butiker södermalm`
kompletteras med kläder, vintage och second hand. Sidan heter ändå "Butiker",
för det är vad mängden är, och en rubrik som säger mataffärer om en lista som
rymmer kiosker och apotek vore fel om sitt eget innehåll. Kategorins egen
förklaring står under rubriken och bär orden mataffärer, kiosker, hälsokost och
apotek.

### 6.4 De 21 sidorna

Alla i Stockholm, eftersom det är enda kommunen med områdessidor.

| Område | Restauranger | Caféer och bagerier | Butiker | Skolor och omsorg |
|---|---:|---:|---:|---:|
| Södermalm | 607 | 179 | 102 | 170 |
| Norrmalm | 526 | 170 | 114 | — |
| Vasastaden | 404 | 115 | 74 | 97 |
| Östermalm | 259 | 73 | 56 | 50 |
| Kungsholmen | 180 | 58 | — | — |
| Gamla stan | 125 | 58 | — | — |
| Ladugårdsgärdet | 79 | — | — | — |
| Liljeholmen | 57 | — | — | — |

Streck betyder att snittet finns och syns med sitt tal på områdessidan, men
ligger under 50 och därför saknar egen adress.

### 6.5 Vad varje sida svarar på som ingen annan sida gör

Kannibaliseringsfrågan är den som avgör om sidtypen får finnas, och den har ett
konkret svar. Södermalm har 1 197 verksamheter varav 607 restauranger. Den som
söker `restauranger södermalm` och landar på områdessidan får en lista där
hälften är förskolor, grossister och butiker. Kommunens kategorisida svarar på
hela Stockholm, alltså fel kornighet åt andra hållet. Snittet är det enda som
svarar på frågan som ställdes.

Talen på sidan räknas därför ur snittet och aldrig ur området: fördelningsbandet,
jämförelsen mot kommunen och svarsmeningen hämtar alla ur samma mängd som
rubriken beskriver.

**Kartan står bara på hela områdets sida.** Områdeskartan ritar områdets alla
punkter och går inte att skära på kategori utan att kartlagret byggs om per
snitt. En karta som visar 1 197 punkter under en rubrik som säger 607
restauranger påstår något som inte stämmer, och det är en dyrare sorts fel än en
sida utan karta.

### 6.6 Kostnaden

| | Antal |
|---|---:|
| Nya sidor | **43** |
| Sidtypsgruppen `omraden` i sitemapen, före | 70 |
| Sidtypsgruppen `omraden` i sitemapen, efter | 113 |
| Bygget efter | 16 898 filer |
| Marginal till taket | 3 102 |

Bygget gick igenom båda grindarna: `sitemap-guard` hittar ingen URL som
motsäger sin egen `noindex`, och samtliga nya adresser hamnade i gruppen
`omraden` i stället för i restgruppen.

---

## 7. Vad som gav noll och därför inte byggdes

### 7.1 Bedömning × kommun. 0 av 14

| Fras | Kompletteras |
|---|---|
| `stängda restauranger [stad]` | nej, samtliga åtta |
| `restaurang stängd [stad]` | nej, samtliga sex |

Fyra av städerna svarar med **noll förslag över huvud taget**, vilket docs/29 §3.1
noterar är ett starkare negativt belägg än en luddig träff.

Det bekräftar docs/26 §4.6 från ett nytt håll och bör läsas som ett stöd för den
domen: `/[kommun]/matsnusk/` ska mätas som PR-tillgång och aldrig som
trafikkälla. En sidtyp för stängda eller anmärkta ställen per kategori eller
stadsdel hade varit sidor ingen söker.

### 7.2 Skadedjur × kommun. 1 av 18

| Fras | Kompletteras |
|---|---|
| `råttor restaurang [stad]` | nej, samtliga tolv |
| `kackerlackor restaurang [stad]` | nej i sex av sex |

Sex av de tolv svarar med noll förslag.

Det här är en **precisering av docs/26 §4.2 och inte en motsägelse.** Docs/26
fann `råttor restaurang luleå`, `råtta restaurang borås` och `kackerlackor
restaurang södertälje`, alltså orter vi inte har. Ordet lever, men det fäster
vid orter där något har hänt, aldrig vid våra tolv. Det är exakt samma mönster
som docs/26 §4.6 fann för `matsnusk [stad]`, noll av fjorton.

Artikeln om skadedjur står kvar och är rätt: efterfrågan finns i den
ortslösa formen. Vad som inte ska byggas är en skadedjurssida per kommun.

### 7.3 Kontrollpunkt som eget sökord. 1 av 7 nytt

`kylkedjan restaurang`, `temperatur restaurang kontroll`, `spårbarhet
livsmedel` och `allergener restaurang` ger noll eller fel avsikt. Det enda som
kompletteras är `egenkontroll restaurang mall gratis`, som docs/26 §4.5 redan
fann och som redan är besvarat i `det-har-anmarker-inspektoren-pa.mdx`.

Tillsammans med utlämnandegränsen i §4, alltså att bara två kommuner av tolv
redovisar kontrollpunkter rikt, är den axeln stängd som sidtyp.

### 7.4 År × vad som helst. 1 av 4

`livsmedelskontroll 2025`, `matsnusk 2025` och `restaurang stängd 2025` ger
noll. Det enda som kompletteras är `nya restauranger stockholm 2026`, som
betyder nyöppnade och inte kontrollerade. Årsaxeln är redan rätt använd i
utmärkelserna och ska inte breddas.

### 7.5 Kategori × riket. Kompletteras, men frågan är inte vår

`restauranger i sverige` och `hur många restauranger finns det i sverige`
kompletteras båda. Svansen är dock genomgående Michelin: `med michelinstjärna`,
`med stjärnor i michelinguiden`, `hur många max restauranger`. Räknefrågan är
äkta och vi kan svara på den med ett riktigt tal, men det är en rapport eller en
artikel och inte en sidtyp, och `/rapporter/` finns redan.

### 7.6 Övrigt × stadsdel. Se §6.3

---

## 8. Två rättelser till docs/26

Autocomplete är färskvara, och två av docs/26:s geografiska fynd reproduceras
inte i dag. Det ska stå rakt ut, eftersom det påverkar hur nästa läsare värderar
dokumentet.

**Anmälningsspåret.** Docs/26 §4.3 kallade `anmäla matförgiftning [stad]` det
starkaste geografiska fyndet i hela undersökningen och angav Uppsala, Örebro,
Linköping och Jönköping bland träffarna. Mätt 2026-08-14 kompletteras det för
**1 av våra 12**, Stockholm. Mönstret lever fortfarande, men i andra orter:
förslagen innehåller Karlskoga, Umeå, Östersund, Norrköping, Malmö och Solna.

**Ägarspåret.** Docs/26 §4.5 angav `registrera livsmedelsverksamhet [stad]` för
åtta städer, varav tre av våra. Mätt i dag: **1 av 8**, Stockholm.
`livsmedelskontroll [stad]` och `miljöförvaltningen [stad]` kompletteras för
tre respektive fyra av sex.

Slutsatsen är inte att docs/26 mätte fel. Den är att **ett autocompletefynd har
hållbarhet**, och att ett spår som väger tungt i en rangordning måste mätas om
innan det byggs på. Rekommendationerna i docs/26 §9 punkt 1, att lägga ortsledet
i anmälningstexterna, står därmed på svagare grund än när den skrevs. Den
kostar en rad på en sida som redan finns och är fortfarande billig, men den ska
inte motiveras med att fyra av våra kommuner har efterfrågan, för det har de
inte i dag.

---

## 9. Vad som inte ska göras

1. **Bygg inga fler kommuner innan ADR 0001 är verkställd.** §3. Två till tre
   kommuner ryms, sedan slutar sajten gå att rulla ut.
2. **Bygg ingen övrigtsida per stadsdel.** §6.3. Träffarna är en klädeskedja.
3. **Bygg ingen sidtyp på bedömningsaxeln.** §7.1. 0 av 14.
4. **Bygg ingen skadedjurssida per kommun.** §7.2. 1 av 18, och den enda
   träffen är ortslös.
5. **Sänk inte `MIN_SUB_PAGE`.** §5.3. Elva av de sjutton par som skulle
   frigöras är övrigtkategorier ingen söker.
6. **Härled aldrig underkategori ur verksamhetens namn.** §5.3. Tabellen i
   `categories.ts` är en tabell och inte en heuristik, och det är en av
   husets bärande regler.
7. **Skriv aldrig `högst betyg` i en rubrik**, hur väl belagd frasen än är.
   §5.1. Tredje dokumentet i rad som säger det.
8. **Rita aldrig en områdesgräns vi inte har.** §5.2. Punkter finns överallt,
   polygoner gör det inte, och en Voronoi-cell är en gräns vi hittat på.

---

## 10. Nästa steg, i ordning

1. **Fatta beslutet i ADR 0001.** §3. Allt annat på den här listan är billigare
   än det, och det blir dyrare ju längre det väntar.
2. **Polygoner för Uppsala, Örebro, Linköping, Jönköping och Karlstad.** §5.2.
   Bäst belagda efterfrågan i undersökningen, 18 av 18, och nästan gratis i
   filer. Insatsen är kartläggning i OSM, inte kod: `pipeline/omraden.py` tar
   emot dem den dag de finns, utan att en rad ändras.
3. **Ordningen på listsidorna.** Kvalitetsledet finns nu belagt på fyra
   korningheter, senast per stadsdel. Docs/26 §9 punkt 2 och docs/29 §7 punkt 1
   bad om samma sak och den är fortfarande inte gjord. Ingen ny URL.
4. **Mät om innan tröskeln 50 sänks till 25.** §6.2. Tretton sidor väntar på
   ett tal ur Search Console.
5. **Mät om docs/26:s ortsspår innan de byggs på.** §8.
