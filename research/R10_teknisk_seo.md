# R10. Teknisk SEO-granskning av utfallet

**Datum:** 2026-08-03
**Granskat:** `site/dist` efter bygge 2026-08-03 00:51. **15 428 HTML-sidor, 15 428 URL:er i sitemap.**
**Metod:** allt nedan är mätt i det byggda utfallet, inte läst ur källkoden. Varje sida är parsad;
länkgrafen är byggd och traverserad; sidvikter är komprimerade och vägda. Där jag anger ett antal
är det räknat, inte uppskattat.

**Förbehåll om rörligt mål.** Sex andra agenter byggde om sajten under granskningen. Siffrorna
gäller den ovan angivna byggnaden. Under arbetets gång tillkom **kategorisidor**
(`/<kommun>/kategori/<kategori>/`, 257 st) som inte ingår i mätningen. En snabbkoll på dem
ligger sist i rapporten.

**Antaganden som inte omprövas:** slutsatserna i R2 och R3 (restaurangsidor vinner på naket namn
plus ort, kommunsidor är viktigaste sidtypen, aldrig Review- eller AggregateRating-schema) samt
URL-strukturen `/<kommun>/<slug>`. De ligger fast och används här som måttstock.

---

## Sammanfattning

Utfallet är tekniskt bättre än det brukar vara på en sajt i den här storleken. Kanoniska URL:er
är korrekta på **samtliga** 15 428 sidor inklusive hela sidindelningen, `/sida/1` existerar inte,
inget Review- eller AggregateRating-schema finns någonstans, det finns noll föräldralösa sidor,
och en restaurangsida väger 9,7 kB komprimerad. Det är ett gott utgångsläge.

Tio fynd nedan, rangordnade efter faktisk påverkan. De fyra första är de som spelar roll: tre av
dem är strukturella och berör i praktiken varenda sida. Resten är noterade men bör inte få styra
prioriteringen.

| # | Fynd | Sidor | Allvar |
|---|---|---:|---|
| 1 | Interna länkar och strukturerad data pekar på icke-kanonisk URL-form | 15 428 | Hög |
| 2 | Samtliga 2 137 no-indexerade sidor ligger i sitemapen | 2 137 | Hög |
| 3 | Härledda koordinater publiceras oförbehållna i JSON-LD | 1 570 | Hög |
| 4 | `og:image` pekar på en fil som inte finns | 15 428 | Hög |
| 5 | 2 136 sidor bär en meningslös eller självmotsägande brödtext | 2 136 | Medel |
| 6 | Crawldjup upp till 24 klick i Stockholm | 2 253 | Medel |
| 7 | Kommunhubbarna är titlade mot ett ord ingen söker | 9 | Medel |
| 8 | `lastmod` i sitemapen är byggtiden, inte datans datum | 15 428 | Medel |
| 9 | `SearchAction` pekar på en URL som robots.txt blockerar | 1 | Låg |
| 10 | 374 restaurangsidor delar titel med en annan sida | 374 | Låg |

---

## 1. Interna länkar och strukturerad data pekar på icke-kanonisk URL-form

**Vad som är fel.** `build.format: 'directory'` gör att varje publicerad URL slutar med
snedstreck. Canonical, `rel=prev` och `rel=next` följer det korrekt. Ingenting annat gör det.

Av **888 585** `<a href>` i utfallet pekar **518 589** på formen utan avslutande snedstreck.
Det är inte en handfull missar, det är varenda navigeringslänk på sajten:

| Länkmål | Förekomster |
|---|---:|
| `/sok` | 61 712 |
| `/metodik` | 15 433 |
| `/stockholm`, `/uppsala`, `/linkoping` … (9 kommuner) | 15 428 vardera |
| `/stockholm/anmarkningar` … (9 kommuner) | 15 428 vardera |
| `/om`, `/kallor`, `/ratta`, `/villkor`, `/cookies`, `/integritetspolicy` | 15 428 vardera |
| `/stockholm/sida/N` (sidnavigeringen) | 1 till 86 vardera |
| brödsmulan till kommunen på varje restaurangsida | 15 241 |

Samma fel finns i den strukturerade datan, där det väger tyngre:

- **BreadcrumbList:** 15 419 block med sammanlagt **30 840** `item`-URL:er. **Samtliga 30 840**
  saknar avslutande snedstreck (`https://prikko.se/uppsala`, `https://prikko.se`).
- **ItemList** på anmärkningssidorna: alla `url` i `itemListElement` likaså.
- `Dataset.url` på `/kallor`, `TechArticle.url` på `/metodik`, `Organization.url` på startsidan.

Och internt motsäger sajten sig själv: sidnavigeringens `<a href>` säger `/stockholm/sida/2`
medan `<link rel="next">` på samma sida säger `https://prikko.se/stockholm/sida/2/`.
Källan är `pageHref()` respektive `pageUrl()` i `site/src/lib/pagination.ts`, som medvetet gör
olika saker. Kommentaren i den filen förklarar varför `pageUrl` har snedstrecket, men `pageHref`
fick aldrig samma behandling.

**Varför det spelar roll.** På Cloudflare Pages, som ADR 0001 pekar ut, svarar en katalogsökväg
utan snedstreck med en 308 till formen med snedstreck. Varje intern klick blir alltså en
omdirigering. Med 15 428 sidor och en halv miljon länkar betyder det:

1. **Crawlbudget.** Googlebot hämtar två svar där ett räcker, på i princip varje länk den följer.
   På en ny domän utan auktoritet är crawlbudget den knappa resursen.
2. **Länkvärde.** Google följer omdirigeringar och skickar vidare värdet, men det är en extra
   hoppning på varje kant i länkgrafen och en känd källa till fördröjd indexering.
3. **Brödsmulesnutten.** Googles krav på BreadcrumbList är att `item` ska vara sidans kanoniska
   URL. 30 840 av 30 840 uppfyller inte det. Brödsmulan i sökresultatet riskerar att utebli.
4. **Sidindelningen kan läsas som två serier.** `rel=next` pekar på en URL och den synliga länken
   på en annan. Bing använder fortfarande `rel=prev/next`, och Bing driver ChatGPT:s webbsökning,
   vilket enligt bibeln §6b är en uttalad kanal.

**Vad som ska göras.** En hjälpare som producerar länkformen och används överallt. Ställena är
kända och få: `pageHref()` i `lib/pagination.ts`, `Footer.astro`, `Header.astro`,
`EstablishmentList.astro`, `KommunKort.astro`, `RemarkHub.astro`, `KommunHub.astro`,
`pages/index.astro`, samt brödsmulan och `breadcrumbs`-objektet i `pages/[kommun]/[slug].astro`
och `ItemList`-URL:erna på anmärkningssidorna.
Lägg därefter en rad i `kontroll.yml` som fäller bygget om ett `href="/..."` i utfallet saknar
snedstreck och pekar på en katalog.

---

## 2. Samtliga no-indexerade sidor ligger i sitemapen

**Vad som är fel.** **2 137 sidor** bär `<meta name="robots" content="noindex, follow">`.
**Alla 2 137 ligger i `sitemap-0.xml`.** Det är 13,9 procent av sitemapen.

Fördelning:

| Kommun | No-index | Andel av kommunens sidor |
|---|---:|---:|
| Stockholm | 1 234 | 14,5 % |
| Uppsala | 524 | 30,1 % |
| Örebro | 129 | 10,5 % |
| Karlstad | 93 | 13,4 % |
| Linköping | 78 | 6,3 % |
| Oskarshamn | 31 | 13,0 % |
| Lomma | 25 | 16,3 % |
| Höganäs | 20 | 6,5 % |
| Jönköping | 2 | 0,2 % |
| `/ratta` | 1 | (ej tillämpligt) |

Regeln är `isIndexable()` i `lib/data.ts`: sidan indexeras bara om verksamheten har en bedömning
och minst en kontroll. Det är rätt kvalitetsgrind. Problemet är att sitemap-filtret i
`astro.config.mjs` bara utesluter `/preview/`, en sökväg som inte finns i utfallet:

```js
filter: (page) => !page.includes('/preview/'),
```

Kommentaren över raden säger uttryckligen "no-indexade sidor får aldrig hamna i sitemap" och
"filtret utökas när sidmallarna finns". Mallarna finns nu. Filtret utökades aldrig.

**Varför det spelar roll.** En sitemap är ett påstående om vilka sidor som ska indexeras. Att be
Google indexera 2 137 sidor som samtidigt säger noindex är en direkt motsägelse. Search Console
kommer att rapportera "Skickad URL markerad som noindex" på 2 137 URL:er, vilket dränker riktiga
fel, och Google lär sig att sitemapen inte är tillförlitlig. På en ny domän är den signalen dyr.

**Vad som ska göras.** Byt filtret till samma predikat som mallen använder. Enklaste robusta
formen är att låta filtret slå upp mot en mängd indexerbara sökvägar som byggs ur `db.ts`, i
stället för mot en strängmatchning. Behåll länkarna från kommunlistan: `noindex, follow` är rätt
val där, sidorna ska nås men inte indexeras.

---

## 3. Härledda koordinater publiceras oförbehållna i JSON-LD

**Vad som är fel.** Uppsala och Örebro lämnar inga koordinater. **1 570 verksamheter** har
därför en punkt som geokodats mot OpenStreetMap i pipelinen (`geoSource: 'osm'`), varav
**228** bara matchat närmaste grannport (`geoPrecision: 'approximate'`).

I den synliga sidan är det korrekt hanterat. `LocationMap.astro` ritar nålen med streckad kant
och skriver ut i klartext: "Platsen är beräknad från adressen, inte lämnad av kommunen", plus en
extra mening för grannportsfallen. Kommentaren i filen argumenterar utförligt och riktigt för
varför det måste stå där.

**I JSON-LD står ingenting.** Schemat är identiskt för en kommunlämnad och en härledd punkt:

```json
"geo": {"@type":"GeoCoordinates","latitude":59.862723,"longitude":17.636015}
```

Det är utfallet för `/uppsala/asian-livs/`, som är en `approximate`-punkt, alltså grannporten.
`geoSource` och `geoPrecision` finns i datan, går genom `db.ts` och `[slug].astro` fram till
`LocationMap`, men de når aldrig `jsonLd`-objektet.

**Varför det spelar roll.** Tre skäl, i stigande ordning:

1. **Maskinläsaren ser bara JSON-LD.** Google, en språkmodell som citerar sidan och en framtida
   datalicenstagare läser den strukturerade datan, inte figcaption. Förbehållet finns exakt där
   människan läser och saknas exakt där maskinen läser.
2. **OSMF:s geokodningsriktlinje kräver attribution där den härledda koordinaten visas.**
   Argumentet i `LocationMap.astro` är att Mapbox inbakade attribution gäller kartbilden och
   inte vår nål. Samma resonemang gäller `geo`-fältet: den koordinaten publiceras utan någon
   attribution alls.
3. **Det strider mot projektets egen regel.** "Verifiera, aldrig gissa" är sajtens grundhållning
   och sidan säger det själv i klartext på skärmen. Att den maskinläsbara versionen påstår en
   precision vi inte har är samma fel som sidan redan bestämt sig för att inte göra.

**Vad som ska göras.** Schema.org har ingen standardiserad flagga för "härledd" på
`GeoCoordinates`. Två hållbara vägar:

- **Enklast och renast:** utelämna `geo` när `geoSource === 'osm'`. Kartan står kvar på sidan med
  sitt förbehåll, men vi påstår ingen koordinat maskinellt. Kostnaden är att 1 570 sidor tappar
  ett fält som ändå inte ger någon rik träff för `FoodEstablishment`.
- **Om fältet ska behållas:** utelämna det för de 228 `approximate` och märk de återstående
  1 342 med `additionalProperty` (`PropertyValue` med `name: "geoSource"` respektive
  `"geoPrecision"`). Det är giltig schema.org och läsbart för en licenstagare, men Google kommer
  inte att tolka det, så förbehållet skyddar bara den som läser rådatan.

Rekommendation: det första alternativet. Det andra bygger en förbehållsmekanism som ingen
konsument faktiskt läser.

Två närliggande observationer på samma schema: **1 867** `FoodEstablishment` saknar `geo` helt
och **1 467** saknar `streetAddress` i `PostalAddress` (fältet försvinner tyst när det är
`undefined`). Och **ingen** av de 15 241 har `image`, trots att `StreetPhoto` renderas på sidan
när `e.image` finns. Det är ett fält som `FoodEstablishment` faktiskt använder.

---

## 4. `og:image` pekar på en fil som inte finns

**Vad som är fel.** Varje sida sätter:

```html
<meta property="og:image" content="https://prikko.se/og-default.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

Ingen av filerna finns. `site/public/` innehåller `favicon.svg` och `prikko-mark.svg`, ingenting
annat. Båda ger 404 på samtliga 15 428 sidor. Även `twitter:card` är satt till
`summary_large_image`, vilket kräver en bild för att rendera alls.

**Varför det spelar roll.** R3 §1 säger att Prikko inte fångar efterfrågan utan skapar en
kategori, och att PR och varumärke måste gå först. Då är delningsförhandsvisningen inte kosmetik,
den är distributionsytan. En länk i Slack, LinkedIn, Facebook, X eller ett redaktionellt
nyhetsbrev renderas idag som en tom ruta. Detsamma gäller Google Discover, som kräver en bild på
minst 1 200 px bredd.

**Vad som ska göras.** Kortsiktigt: lägg en `og-default.png` (1 200 × 630) och en
`apple-touch-icon.png` (180 × 180) i `site/public/`. Låt `kontroll.yml` verifiera att filerna
som `Base.astro` refererar faktiskt existerar i `dist`. Den befintliga dödlänkskontrollen i
arbetsflödet kollar bara åtta statiska kataloger och missar detta.

Längre fram är en genererad delningsbild per restaurangsida (namn, ort, bedömning) den enskilt
billigaste PR-hävstången på sajten, men den kan vänta.

---

## 5. 2 136 sidor bär en meningslös eller självmotsägande brödtext

**Vad som är fel.** Meningsmallen i `[slug].astro` är

```
`${e.name} ${presentation.sentence} den ${formatDate(latest)}.`
```

och beskrivningen är den meningen plus en fast svans. Mallen håller inte för två av fallen.

**A. Självmotsägelse, 1 279 sidor.**

> Bärsta Gårdsmusteri mobil anläggning har ingen registrerad hygienkontroll hos kommunen.
> Se vilka kontrollområden som granskades och hela kontrollhistoriken.

Andra meningen inbjuder till att läsa en kontrollhistorik som första meningen just sagt inte
finns.

**B. Trasig svenska, 857 sidor.**

> Normal Linköping, I-Huset har ingen hygienkontroll de senaste tre åren, så nuläget går inte att
> bedöma **den 17 maj 2023**. Se vilka kontrollområden som granskades och hela kontrollhistoriken.

Meningen `presentation.sentence` för `stale_inspections` tar inget datumled, men mallen limmar på
"den `<datum>`" ändå. Resultatet går inte att läsa.

Samma sträng används på tre ställen: `<title>`-syskonet `description`, `og:description`, och den
synliga `<p class="answer">` som enligt filens egen kommentar ska vara "självbärande och
citerbar" för AI-svar. Alla 2 136 sidorna är no-index, så de dyker inte upp i sökresultat, men
de syns vid delning och de är precis vad en språkmodell citerar när den crawlar.

**Vad som ska göras.** Separera meningsmallen per utfall i stället för att konkatenera. Fallen är
tre: bedömd med datum, ingen kontroll alls (inget datum, ingen svans om kontrollområden),
för gammal kontroll (datum i en egen bisats, "senaste kontrollen var den X"). Den fasta svansen
"Se vilka kontrollområden som granskades och hela kontrollhistoriken" ska bara sättas när det
finns kontrollområden att se.

Detta är det enda fyndet i rapporten som är ett rent faktafel i metadata. Jag har inte åtgärdat
det, eftersom filen ligger i `site/src` där sex andra agenter arbetar.

---

## 6. Crawldjup upp till 24 klick

**Vad som är fel.** Länkgrafen är traverserad från startsidan. Ingen sida är föräldralös, alla
15 428 är nåbara. Men djupet är ojämnt:

| Djup från startsidan | Restaurangsidor |
|---|---:|
| 1 till 3 | 5 256 |
| 4 till 6 | 7 732 |
| 7 till 10 | 1 102 |
| 11 till 24 | **1 151** |

| Kommun | Sidor | Median | Max |
|---|---:|---:|---:|
| Stockholm | 8 511 | 5 | **24** |
| Uppsala | 1 740 | 4 | 7 |
| Linköping | 1 241 | 3 | 6 |
| Örebro | 1 233 | 3 | 6 |
| Jönköping | 1 120 | 3 | 5 |
| Karlstad | 694 | 3 | 4 |
| Höganäs | 310 | 3 | 3 |
| Oskarshamn | 239 | 2 | 3 |
| Lomma | 153 | 2 | 3 |

Orsaken är Stockholms 86-sidiga serie med ett fönster på plus minus två sidor i navigeringen.
För att nå sida 40 krävs ungefär tio klick genom serien. Modulen "Närliggande" på
restaurangsidorna kortar en del av det (median 5 inlänkar per restaurangsida, minst 1), men den
länkar geografiskt nära verksamheter, vilket i Stockholm ofta betyder samma alfabetiska region.

**Varför det spelar roll.** Sitemapen ser till att sidorna upptäcks. Klickdjupet styr hur ofta
de crawlas om och hur viktiga Google bedömer dem. Med FSA:s siffra att objektsidor står för
5,8 procent av trafiken är detta ingen katastrof, men 1 151 sidor på djup 11 eller mer kommer i
praktiken att crawlas sällan.

**Vad som ska göras.** Kategorisidorna som landade under granskningen adresserar detta delvis
och är rätt lösning i princip: fler ingångar högre upp gör serien grundare. Två billiga tillägg:

1. Låt sidnavigeringen visa fler ankarpunkter i långa serier, till exempel var tionde sida
   utöver fönstret. Det tar Stockholm från djup 24 till ungefär 6.
2. Överväg en bokstavsindelning på kommunhubben. Listan är redan alfabetisk, så
   `/<kommun>/bokstav/<a-ö>` skulle kosta 29 sidor per kommun och göra hela serien tre klick djup.
   Bedöm mot risken för fler tunna listsidor.

---

## 7. Kommunhubbarna är titlade mot ett ord ingen söker

**Vad som är fel.** Alla nio kommunhubbar har samma mönster:

- `<title>`: "Hygienkontroller i Stockholm | Prikko"
- `<h1>`: "Hygienkontroller i Stockholm"
- `description`: "Hygienkontroller för 8 511 restauranger och livsmedelsverksamheter i Stockholm. 776 har anmärkningar vid senaste kontrollen."

R3 §3 och §6 är entydiga på den här punkten. `livsmedelskontroll stockholm` ligger på 0,00 i
262 av 262 veckor. `restauranger stockholm` ligger på index 61,3, ungefär 8 600 sökningar per
månad, med noll nollveckor. R3 §6 skriver rakt ut: rikta stadssidorna mot upptäckt-intent, inte
mot `livsmedelskontroll [stad]`. Kommunsidorna är dessutom den sidtyp som enligt FSA:s
officiella statistik bär 90 procent av topptrafiken. Det är den enskilt viktigaste titeln på
sajten och den leder med kategorins döda ord.

Samma mönster upprepas i sidfoten på varje sida: "Kontroller i Stockholm", "Anmärkningar i
Stockholm". Det är ankartexten som 15 428 sidor skickar till hubben.

**En relaterad lucka.** Sidhuvudet innehåller tre populära sökningar som renderas som länkar:

```
/sok?q=Espresso%20House    15 428 gånger
/sok?q=Max                 15 428 gånger
/sok?q=McDonalds           15 428 gånger
```

Sammanlagt **46 284** länkar till URL:er som robots.txt uttryckligen blockerar
(`Disallow: /sok?`), och som dessutom inte renderar något utan JavaScript. Kedjevarumärken är
enligt R2 §3.4 det **enda** entitetsmönster som genererar någon hygienrelaterad sökning alls
(`max hamburgare dålig hygien`, `mcdonalds hygien`). Sajten har alltså identifierat rätt mönster
och pekat det mot en blockerad, tom URL.

**Vad som ska göras.**

1. Byt kommunhubbens titel och H1 till upptäckt-intent, till exempel "Restauranger i Stockholm,
   kontrollerade av kommunen" eller "Restauranger och livsmedelsbutiker i Stockholm". Behåll
   hygienen som differentiator i description och i första stycket, inte i titeln. Det är samma
   logik som redan tillämpas korrekt på restaurangsidorna, där titeln är naket namn plus ort.
2. Ge kedjorna en riktig sida. `/kedja/mcdonalds/` eller `/stockholm/kedja/max/` är statiskt
   renderbart ur befintlig data, är crawlbart, och fångar det enda entitetsmönster som mätningen
   hittade. Låt sidhuvudets länkar peka dit i stället för till `/sok?q=`.

Kategorisidorna som landade under granskningen gör redan detta rätt: titeln är
"Restauranger i Stockholm". Kommunhubben bör följa efter, annars konkurrerar hubben och
kategorisidan om samma fråga med olika framing.

---

## 8. `lastmod` i sitemapen är byggtiden

**Vad som är fel.** Samtliga 15 428 poster i `sitemap-0.xml` har identisk `lastmod`, satt av
`new Date()` i `astro.config.mjs`:

```xml
<lastmod>2026-08-02T22:50:53.666Z</lastmod>
```

Restaurangsidorna bär samtidigt ett riktigt datumfält i huvudet:

```html
<meta name="last-modified" content="2026-02-19">
```

Det fältet är inte ett erkänt sökmotorattribut och ignoreras av Google. Det riktiga datumet
finns alltså i datan, det renderas till och med i HTML, men det når inte det enda ställe där
Google faktiskt läser det.

**Varför det spelar roll.** Google använder `lastmod` för att prioritera omcrawlning, men bara
när värdet är trovärdigt. En sitemap där alla 15 428 URL:er ändras i samma millisekund vid varje
bygge är per definition inte trovärdig och ignoreras. Färskhet är dessutom en uttalad AEO-signal
i bibeln §6b. Datat uppdateras enligt `uppdatera-data.yml` regelbundet, och just förmågan att
säga "den här verksamheten kontrollerades i förrgår" är sajtens skarpaste kant mot
konkurrenterna. Den signalen kastas bort i sitemapen.

**Vad som ska göras.** Sätt `lastmod` per URL: restaurangsidan får sin senaste kontrolls datum,
kommunhubben och anmärkningssidan får kommunens `source.fetchedAt`, de statiska sidorna får
sitt eget innehållsdatum. `@astrojs/sitemap` stöder `serialize` för detta.
`changefreq: 'weekly'` kan tas bort, Google ignorerar fältet helt.

---

## 9. `SearchAction` pekar på en URL som robots.txt blockerar

Startsidans `WebSite`-schema deklarerar:

```json
"target": {"@type":"EntryPoint","urlTemplate":"https://prikko.se/sok?q={search_term_string}"}
```

och robots.txt säger:

```
Disallow: /sok?
```

Sitelinks-sökrutan kan alltså aldrig fungera. Antingen tas `potentialAction` bort, eller så
öppnas mönstret. Notera också att `Disallow: /sok?` inte blockerar `/sok/`: sökvägsmatchningen
är prefixbaserad och `/sok/` börjar inte med `/sok?`. Sidan `/sok/` är därför crawlbar,
indexerbar och ligger i sitemapen, samtidigt som den (känt sedan tidigare) renderar noll
resultat utan JavaScript. Det minsta som bör göras är att sätta `noindex` på `/sok` och filtrera
bort den ur sitemapen, oavsett vad man gör med resten.

---

## 10. 374 restaurangsidor delar titel med en annan sida

**Vad som är fel.** Titelmallen är `{namn}, {ort} | Prikko`, vilket är rätt enligt R3 §5. Men
kedjebutiker i samma stad får identiska titlar:

| Titel | Sidor |
|---|---:|
| Joe & The Juice, Stockholm \| Prikko | 12 |
| Lidl, Stockholm \| Prikko | 10 |
| Fabrique Stenugnsbageri, Stockholm \| Prikko | 10 |
| Bröd & Salt, Stockholm \| Prikko | 9 |
| Flying Tiger Copenhagen, Stockholm \| Prikko | 7 |
| Mcdonalds, Stockholm \| Prikko | 6 |
| Burger King, Stockholm \| Prikko | 6 |

Sammanlagt **374 sidor i 137 grupper**. Beskrivningarna skiljer sig (kontrolldatumen är olika),
och bara 16 sidor i 8 grupper har helt identisk description, så dubbletten sitter i titeln.

**Varför det spelar roll.** Google klustrar sidor med identisk titel och visar en av dem. Det är
precis den delmängd av korpusen där det finns någon sökefterfrågan alls: kedjevarumärken.

**Vad som ska göras.** Lägg till gatan eller stadsdelen i titeln när namnet inte är unikt inom
kommunen: "Joe & The Juice, Sveavägen 24, Stockholm". Adressen finns redan i datan för alla utom
1 467 poster. Gör det villkorat på kollision, inte generellt, annars förlängs 15 241 titlar i
onödan.

---

## 11. Övriga fynd, i fallande ordning

**Beskrivningslängd.** Median 161 tecken på restaurangsidorna, **8 050 av 15 241 över 160**.
Orsaken är enbart den fasta svansen. Första meningen, som är den citerbara, är median 92 tecken
och aldrig över 154, så den överlever alltid trunkeringen. Effekten är alltså liten, men svansen
är 68 tecken identiskt innehåll upprepat 15 241 gånger och gör ingen nytta i sökresultatet.

**Titellängd.** 148 restaurangsidor har titlar över 60 tecken, längst 145. Uteslutande långa
verksamhetsnamn. Kan lämnas.

**Kommunhubben saknar `ItemList`.** Anmärkningssidorna har den, kommunhubbarna och de 149
sidindelade sidorna har bara `BreadcrumbList`, trots att de listar 100 verksamheter var.
Inkonsekvent. Kategorisidorna som landade under granskningen har `ItemList`, så hubben är nu
den enda listsidan utan.

**Blankstegsfel i H1 på 164 sidindelade sidor.** `Hygienkontroller i Stockholm , sida 2`.
Renderingsartefakt i mallen, syns för besökaren.

**Ingen `404.html`.** Astro genererar en om `src/pages/404.astro` finns. Den gör den inte.
En sajt med 15 428 URL:er och slugar som ändras när kommunen byter namnform kommer att generera
404:or.

**Mapbox-nyckeln ligger i klartext i HTML** på ungefär 13 400 sidor, i formen
`?access_token=pk.eyJ1...`. Det är en publik token och det är avsett bruk, men två saker:
den fria nivån är 50 000 kartbilder per månad och varje sidvisning kostar en, och tokenen bör ha
en URL-restriktion satt i Mapbox-konsolen så att den inte kan användas från annan domän.
Med R3:s månad-36-prognos på 27 500 besök i månaden är kvoten inte ett problem än, men
bildcrawlers räknas också.

**18 sidor publicerar kommunens interna redaktionsmarkörer i titeln**, till exempel
"Nordic Wellness Uppsala Fyrislund Padel \*Upphörd, Uppsala" och "HAKEPI\*, Linköping".
Asterisken betyder något i kommunens system och ingenting hos oss. Städa i normaliseringen.

**Filantal mot Cloudflare Pages.** `dist` innehöll 15 459 filer i den granskade byggnaden och
15 818 efter att kategorisidorna landat. Cloudflare Pages fria nivå har en gräns på 20 000 filer,
vilket ADR 0001 redan noterar. Två till tre kommuner till, eller en kategoriexpansion, spränger
taket. Det är inte ett SEO-fynd men det är ett publiceringsstopp och det ligger nära.

---

## 12. Vad som är rätt, och bör lämnas i fred

Det här är inte artighet, det är sådant som ofta är trasigt på sajter i den här storleken och
som här är mätbart korrekt.

- **Kanoniska URL:er: 15 428 av 15 428 korrekta.** Varje sida pekar på sig själv, med snedstreck,
  mot produktionsdomänen. Noll avvikelser.
- **Sidindelningen är korrekt byggd.** Sida 1 ligger på `/<kommun>/`, `/sida/1` existerar inte
  någonstans i utfallet. Varje sida i serien har egen självrefererande canonical, egen unik titel
  ("sida 2 av 86") och en description som numrerar sidans egna rader ur seriens totala antal. `rel=prev` på
  sida 2 pekar korrekt på seriens rot, inte på `/sida/1`. Ingen `noindex` på sidorna 2 och framåt,
  vilket är rätt sedan Google slutade rekommendera det.
- **Inget Review- eller AggregateRating-schema någonstans** i utfallet. CI-grinden håller.
- **Noll föräldralösa sidor.** Alla 15 428 är nåbara från startsidan.
- **Språk och teckenkodning.** `lang="sv"` på 15 428 av 15 428, `<meta charset="utf-8">` överallt,
  `og:locale` `sv_SE`, `inLanguage` `sv-SE` i schemat. **Noll hreflang-taggar**, vilket är exakt
  rätt för en enspråkig sajt: en `hreflang="sv"` utan alternativ hade varit brus.
- **Rubrikstruktur.** Exakt en `<h1>` på varje sida. Noll sidor utan, noll med flera.
- **Prestanda.** Mätt, inte gissat:

  | Sidtyp | Rå HTML | Gzip |
  |---|---:|---:|
  | Startsida | 53,3 kB | **10,2 kB** |
  | Kommunhubb | 98,4 kB | **12,5 kB** |
  | Sidindelad hubb | 98,4 kB | **12,8 kB** |
  | Anmärkningssida | 106,3 kB | **13,9 kB** |
  | Restaurangsida (120 sidor mätta) | 43,5 kB median | **9,7 kB median, 12,7 kB max** |

  Delade resurser: 5,8 kB gzip CSS i två filer, **3,4 kB gzip JavaScript** i två filer
  (Astros prefetch-runtime 1,1 kB och sökrutan 2,3 kB). Typsnittet är självhostat med
  `font-display: swap` och unicode-range-uppdelning. **En enda extern värd**, `api.mapbox.com`,
  för den statiska kartbilden, som är `loading="lazy"` med angiven bredd och höjd. Sökindexet på
  1 MB hämtas först vid fokus i sökfältet, inte vid sidladdning. Beslutet i `LocationMap.astro`
  att byta interaktiv MapLibre mot en `<img>` är rätt och syns i siffrorna: `maplibre-gl` ligger
  kvar i `package.json` men levereras inte till någon sida.

  Formellt är sajten inte "noll JavaScript": 3,4 kB komprimerat går ut på varje sida. Det är
  tillräckligt lite för att inte påverka någonting, men påståendet bör justeras.

---

## 13. Kategorisidorna, som landade under granskningen

Utanför mätningen, men värt att notera eftersom de nu finns: 257 sidor på
`/<kommun>/kategori/<kategori>/`, med i sitemapen. Stickprovet ser rätt ut. Titeln är
"Restauranger i Stockholm", alltså upptäckt-intent precis som R3 §6 föreskriver, canonical är
självrefererande med snedstreck, `rel=next` pekar korrekt på `/sida/2/`, och sidan har både
`BreadcrumbList` och `ItemList`.

Två saker att kontrollera när de är klara:

1. Länkarna till dem från kommunhubben saknar avslutande snedstreck, samma fel som fynd 1.
2. `Övrigt` som kategori är en tunn samlingssida med 1 406 verksamheter i Stockholm och riskerar
   att bli en sida utan sökintention. Överväg att inte länka eller inte indexera just den.

---

## 14. Åtgärdsordning

Rangordnad efter påverkan per timme, inte efter hur lätt fyndet var att hitta.

| Ordning | Åtgärd | Fynd |
|---|---|---|
| 1 | Lägg `og-default.png` och `apple-touch-icon.png` i `site/public/` | 4 |
| 2 | Utöka sitemap-filtret till samma predikat som `isIndexable()` | 2 |
| 3 | En enda länkhjälpare med avslutande snedstreck, använd överallt inklusive JSON-LD | 1 |
| 4 | Utelämna `geo` när `geoSource === 'osm'` | 3 |
| 5 | Dela meningsmallen per utfall så de 2 136 sidorna blir läsbara | 5 |
| 6 | `lastmod` per URL ur datans egna datum | 8 |
| 7 | Byt kommunhubbens titel och H1 till upptäckt-intent | 7 |
| 8 | Fler ankarpunkter i långa sidnavigeringar, eller bokstavsindex | 6 |
| 9 | Gata eller stadsdel i titeln vid namnkollision | 10 |
| 10 | `noindex` på `/sok`, ta bort eller öppna `SearchAction` | 9 |

Ingenting i den här rapporten har åtgärdats. `site/src` är orört.

---

## 15. Redan kända fel, inte utredda

Nämnda för fullständighetens skull, enligt uppdraget inte tidsatta:

- `/sok` renderar inga resultat utan JavaScript. Tillägg från mätningen: sidan är dessutom
  indexerbar, ligger i sitemapen, och tar emot 61 712 interna länkar plus 46 284 länkar till sin
  blockerade frågesträngsform.
- `/ratta` är `noindex` men länkas från sidhuvudet på alla sidor. Tillägg: den ligger också i
  sitemapen, som en av de 2 137 posterna i fynd 2.
- `InfoTip` genererar id med `Math.random()`, så bygget är inte reproducerbart. Tillägg: det gör
  också att varje bygge ändrar varenda restaurangsidas HTML, vilket är ytterligare ett skäl att
  inte låta `lastmod` följa byggtiden (fynd 8).

---

## 16. Metod

- Utfall: `site/dist`, bygge 2026-08-03 00:51, 15 428 HTML-filer, 15 459 filer totalt.
- Varje sida parsad för titel, description, canonical, robots, `lang`, `rel=prev/next`, H1,
  JSON-LD, skriptreferenser och samtliga `<a href>`.
- Länkgrafen byggd över alla 888 585 länkar och traverserad i bredden från `/` för klickdjup och
  föräldralöshet.
- Sitemapen jämförd URL för URL mot den faktiska filmängden i båda riktningar.
- All JSON-LD JSON-parsad och typräknad; noll parsfel.
- Sidvikter mätta som gzip nivå 6 på ett stickprov om 120 slumpade restaurangsidor plus varje
  sidtyps representanter.
- Koordinatstatistiken räknad direkt ur `site/src/data/uppsala.json` och `orebro.json`:
  1 570 med `geoSource: 'osm'`, varav 228 `geoPrecision: 'approximate'`. Stämmer mot uppdragets
  siffra.
- Ej gjort: körning mot en riktig server, alltså inga faktiska HTTP-statuskoder. Påståendet att
  länkar utan snedstreck omdirigeras bygger på Cloudflare Pages dokumenterade beteende och på
  ADR 0001:s val av plattform. Verifiera med `curl -I` efter första driftsättning.
