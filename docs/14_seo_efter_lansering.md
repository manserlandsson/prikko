# 14. SEO efter lanseringen: mätt mot drift, inte mot koden

**Datum:** 2026-08-03, samma dag som prikko.se gick live.
**Metod:** allt i avsnitt 1 till 4 är hämtat med `curl` mot den publicerade sajten, inte läst ur
källkoden. 199 verksamhetssidor är slumpade ur sitemapen och hämtade i sin helhet, plus varje
sidtyps representanter. Där ett antal står är det räknat.
**Föregående granskning:** `research/R10_teknisk_seo.md`, gjord mot `site/dist` 2026-08-03 00:51,
alltså före driftsättning. Den mätte aldrig en riktig server och skrev själv i sitt metodavsnitt
att statuskoderna måste verifieras med `curl` efter första driftsättningen. Det är gjort här, och
det avslöjade det allvarligaste felet på sajten.

---

## Sammanfattning

R10 lämnade tio fynd. **Sex är åtgärdade**, och några av dem bättre än rapporten föreslog:
sitemap-filtret fick en byggrind som mäter utfallet i stället för att lita på källdatan, och
länkformen fick en riktig hjälpare i `lib/urls.ts`. Fyra ligger kvar, varav ett bara ser åtgärdat
ut: `SearchAction` pekade tidigare på `/sok?q=` som robots.txt blockerade, och pekar nu på
`/sok/?q=` som robots.txt också blockerar. Felet flyttade, det försvann inte.

Mätningen mot drift lade till tre fynd som ingen granskning av `dist` kunde ha hittat:

| # | Fynd | Omfattning | Allvar |
|---|---|---|---|
| A | Okända URL:er svarar **HTTP 200 med startsidan**, inte 404 | obegränsat | **Kritisk** |
| B | `prikko.pages.dev` serverar hela sajten, crawlbar, 200 | 14 041 URL:er i dubblett | Hög |
| C | Cloudflare skjuter in ett eget robots-block före vårt | hela filen | Låg, men bör förstås |

Fynd A är rättat i den här omgången, tillsammans med `lastmod` och `SearchAction`. Fynd B kräver
ett beslut om driftsättningen och ligger som förslag.

Det som fungerar är fortsatt starkt och ska inte röras: kanoniska URL:er stämmer på samtliga
mätta sidtyper, `www` och `http` 301:ar korrekt till roten, inget Review-schema finns någonstans,
brödsmulorna pekar numera på kanonisk form (398 av 398 i stickprovet), och en verksamhetssida
väger under tio kilobyte komprimerad.

Det som skaver mest är inte tekniskt. Det står i avsnitt 6.

---

## 1. Vad R10 föreslog, och vad som faktiskt blev gjort

Ordningen är R10:s egen åtgärdslista.

| R10 | Åtgärd | Status i drift | Belägg |
|---:|---|---|---|
| 1 | `og-default.png` och `apple-touch-icon.png` | **Klart** | 200, 23 031 respektive 2 760 byte |
| 2 | Sitemap-filtret till samma predikat som `isIndexable()` | **Klart, och bättre** | 14 041 URL:er mot tidigare 15 428, `/ratta/` borta, plus en byggrind |
| 3 | En enda länkhjälpare med avslutande snedstreck | **Klart** | 0 av 0 länkar utan snedstreck på sex sidtyper, 398 av 398 brödsmule-URL:er med |
| 4 | Utelämna `geo` när `geoSource === 'osm'` | **Klart** | 35 av 199 verksamheter saknar `geo`, däribland `/uppsala/asian-livs/` som var R10:s exempel |
| 5 | Dela meningsmallen per utfall | **Klart** | Den trasiga svenskan är borta, se avsnitt 1b |
| 6 | `lastmod` per URL ur datans egna datum | **Var inte gjort. Rättat här.** | Samtliga 14 041 poster hade identisk byggtidsstämpel |
| 7 | Kommunhubbens titel till upptäckt-intent | **Inte gjort** | `<title>` är fortfarande "Hygienkontroller i Stockholm" |
| 8 | Fler ankarpunkter i långa sidnavigeringar | **Delvis** | Fönstret är plus minus två plus sista sidan, se avsnitt 5 |
| 9 | Gata eller stadsdel i titeln vid namnkollision | **Inte gjort** | 137 namngrupper, 374 sidor delar titel, oförändrat |
| 10 | `noindex` på `/sok`, ta bort eller öppna `SearchAction` | **Halvt.** `SearchAction` borttagen här. `/sok/` kvar | Se avsnitt 1c |

Av R10:s övriga fynd: blankstegsfelet i sidindelningens H1 är borta ("Hygienkontroller i Uppsala,
sida 2" renderas rätt), och kommunernas redaktionsmarkörer i titeln är nere från 18 sidor till 7,
alla i Linköping ("HAKEPI\*", "BUTTERFLY\*", "247 PUNKTEN\*"). Kommunhubben saknar fortfarande
`ItemList` trots att den listar hundra verksamheter, och kategorisidorna intill har den. `image`
saknas fortfarande i samtliga 199 `FoodEstablishment` i stickprovet.

### 1b. Meningsmallen, som var det enda rena faktafelet

R10 fynd 5 gällde 2 136 sidor med obegriplig eller självmotsägande brödtext. Kontrollerat i drift
på tre no-indexerade sidor, och det håller nu i båda fallen:

> 7A Odenplan. har ingen hygienkontroll de senaste tre åren, så nuläget går inte att bedöma.
> Den senaste kontrollen gjordes den 14 mars 2023. Se hela kontrollhistoriken hos kommunen.

> 61 har ingen registrerad hygienkontroll hos kommunen. Verksamheten finns i kommunens register,
> men Stockholms stad har inte publicerat någon kontroll av den.

Datumet ligger i en egen sats, och svansen om kontrollområden sätts bara när det finns
kontrollområden. Sidan utan kontroll får dessutom en egen andra mening som förklarar varför den
är tom, i stället för den generiska svansen. Det är gjort bättre än R10 föreslog.

### 1c. `SearchAction`, felet som flyttade

R10 fynd 9 gällde att startsidans `WebSite`-schema deklarerade en sökingång på `/sok?q=` som
robots.txt blockerade med `Disallow: /sok?`. I drift lyder schemat nu `/sok/?q=` och robots.txt
har fått en andra rad, `Disallow: /sok/?`. Båda formerna är alltså blockerade, och schemat pekar
fortfarande på en av dem. Blockeringen är rätt, tunna resultatsidor ska inte i indexet. Det som
skulle falla var påståendet. Det är gjort nu, se avsnitt 4.

---

## 2. Fynd A: okända URL:er svarar 200 med startsidan

Det här är det allvarligaste tekniska felet på sajten, och det gick inte att se i `dist`.

```
$ curl -o /dev/null -w "%{http_code} %{size_download}\n" https://prikko.se/finns-inte-alls/
200 68648
$ curl -o /dev/null -w "%{http_code} %{size_download}\n" https://prikko.se/uppsala/kategori/restaurang/
200 68648
$ curl -o /dev/null -w "%{http_code} %{size_download}\n" https://prikko.se/llms.txt
200 68648
```

Alla tre har md5 `1c9081b4459d032ea0a36f8440c73006`, vilket är exakt startsidans. Orsaken är att
`site/src/pages/404.astro` inte fanns, så Astro genererade ingen `dist/404.html`, och då faller
Cloudflare Pages tillbaka på sitt beteende för ensidesappar: `index.html` med statuskod 200 för
varje sökväg som inte matchar en byggd sida.

Notera särskilt den mittersta raden. `restaurang` i stället för `restauranger` är precis den sorts
felstavning en riktig inlänk innehåller, och sajten svarade 200 på den.

Tre konsekvenser, i stigande ordning:

1. **Obegränsat med mjuka 404:or.** Varje död inlänk, varje slug som ändras när kommunen byter
   namnform, varje gammal bokmärkessida blir en URL som svarar 200. Google klassar dem som soft
   404, rapporterar dem i Search Console och crawlar om dem, på en crawlbudget som enligt R10
   redan är den knappa resursen på en ny domän.
2. **Kvalitetsgrinden går att kringgå utifrån.** Bibeln §6 säger att tunna sidor drar ner hela
   domänen vid bedömning av skalat innehåll. Sajten grindar sina egna 14 041 sidor noggrant med
   `isIndexable()` och släppte samtidigt in ett obegränsat antal ogrindade.
3. **Besökaren får fel svar.** Den som klickar på en död länk till en restaurang landar på
   startsidan utan besked om att sidan är borta.

**Rättat.** `site/src/pages/404.astro` är skapad. Bygget lägger nu `dist/404.html` i roten, med
`noindex, follow`, egen titel och en kommunlista så att sidan inte blir en återvändsgränd.
Slugarna bär kommunen först, så den som landar där har nästan alltid rätt kommun och fel
verksamhet.

**Verifiera efter nästa driftsättning**, eftersom effekten sitter i Cloudflares svar och inte i
filen:

```
curl -o /dev/null -w "%{http_code}\n" https://prikko.se/finns-inte-alls/
```

Ska svara `404`. Gör den fortfarande `200` ligger det en uttrycklig fallback-regel i Pages-projektets
inställningar som måste tas bort.

---

## 3. Fynd B: `prikko.pages.dev` serverar hela sajten parallellt

```
$ curl -I https://prikko.pages.dev/
HTTP/2 200
$ curl -I https://prikko.pages.dev/uppsala/asian-livs/
HTTP/2 200
```

Hela beståndet ligger alltså på två värdnamn. Två saker dämpar skadan och ett förvärrar den:

- **Dämpar:** varje sida på pages.dev bär `<link rel="canonical" href="https://prikko.se/...">`,
  alltså korspekande mot rätt domän. Google följer normalt det.
- **Dämpar:** robots.txt på pages.dev anger `Sitemap: https://prikko.se/sitemap-index.xml`, så
  ingen sitemap pekar in i dubbletten.
- **Förvärrar:** canonical är en rekommendation, inte ett direktiv, och pages.dev-robotsen säger
  `Allow: /`. Domänen är fullt crawlbar, och crawlningen betalas ur samma budget. Blir en enda
  pages.dev-adress delad publikt kan den indexeras.

**Förslag, inte genomfört**, eftersom det ändrar driftsättningens form och det beslutet är Måns.
Cloudflare Pages går inte att be sluta servera sitt eget `pages.dev`-namn, så det måste
omdirigeras i kod. Lägg `site/functions/_middleware.js`:

```js
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname.endsWith('.pages.dev')) {
    url.hostname = 'prikko.se';
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
```

Priset är att projektet går från rent statiskt till Pages Functions, alltså att varje förfrågan
räknas som en anropsinvokation. Fria nivån är 100 000 per dygn, och R3:s prognos för månad 36 är
27 500 besök i månaden, så taket är avlägset. Men det är ett byte av driftmodell och ska inte
göras i förbifarten.

Billigare mellansteg om beslutet dröjer: lägg upp `prikko.pages.dev` som egen egendom i Search
Console och håll ögonen på om något faktiskt indexeras. Gör det inte det, är canonical tillräckligt.

---

## 4. Fynd C: robots.txt är två filer, inte en

Vad `curl https://prikko.se/robots.txt` faktiskt levererar är Cloudflares hanterade block först,
sedan vår genererade fil. Resultatet innehåller **två skilda `User-agent: *`-grupper**:

```
# BEGIN Cloudflare Managed content
User-agent: *
Content-Signal: search=yes,ai-train=no,use=reference
Allow: /

User-agent: Amazonbot          Disallow: /
User-agent: Applebot-Extended  Disallow: /
User-agent: Bytespider         Disallow: /
User-agent: CCBot              Disallow: /
User-agent: ClaudeBot          Disallow: /
User-agent: Google-Extended    Disallow: /
User-agent: GPTBot             Disallow: /
User-agent: meta-externalagent Disallow: /
# END Cloudflare Managed Content

User-agent: *
Allow: /
Disallow: /sok?
Disallow: /sok/?
Disallow: /preview/
```

Det är inte trasigt. RFC 9309 säger att grupper med samma user-agent ska slås ihop, och Google gör
det, så våra `Disallow`-rader gäller. Men filen är inte längre vad `robots.txt.ts` säger att den
är, och den kommentaren i filen förtjänar en rad om det.

**Policyn stämmer med bibeln §6b och rörs inte här.** Googlebot och Bingbot är fria, vilket är
kravet, och Bing driver ChatGPT:s webbsökning. `Google-Extended` styr träning och inte indexering,
så AI Overviews påverkas inte av blockeringen.

**En sak att ta ställning till, inte att ändra utan beslut.** `Content-Signal` sätter `search=yes`
och `ai-train=no`, men lämnar **`ai-input` osagt**. `ai-input` är precis det bibeln §6b vill ha,
alltså att innehållet hämtas i stunden för att grunda ett AI-svar som citerar oss. Osagt betyder
enligt signalens egen definition varken beviljat eller nekat. Vill vi säga uttryckligen ja till
citering är raden `search=yes,ai-input=yes,ai-train=no`. Det är ett policybeslut och ligger i
Cloudflare, inte i repot. **Jag har inte rört det.**

En sidoeffekt värd att känna till: `GPTBot` är blockerad, vilket är rätt enligt "träning
blockeras". OpenAI kör dock även `OAI-SearchBot` för sitt sökindex och `ChatGPT-User` för
användarutlöst hämtning. Ingen av dem är blockerad, så ChatGPT-vägen är öppen. Det är det utfall
policyn ville ha, men det beror på att listan råkar vara rätt, inte på att någon skrivit ner
skillnaden.

---

## 5. Vad mätningen i övrigt visar

**Kanonisering och omdirigering, allt korrekt.**

| Kontroll | Utfall |
|---|---|
| `https://www.prikko.se/` | 301 till `https://prikko.se/` |
| `http://prikko.se/` | 301 till `https://prikko.se/` |
| `https://prikko.se/uppsala` (utan snedstreck) | 308 till `/uppsala/` |
| Canonical på startsida, kommunhubb, kategorisida, verksamhetssida | Självrefererande, med snedstreck, mot produktionsdomänen |
| Canonical i 199-stickprovet | 199 av 199 rätt |
| `rel=prev` på `/uppsala/sida/2/` | Pekar på `/uppsala/`, inte på `/sida/1/` |

**Strukturerad data per sidtyp.**

| Sidtyp | JSON-LD |
|---|---|
| Startsida | `WebSite`, `Organization` |
| Kommunhubb | `BreadcrumbList` **enbart** |
| Sidindelad hubb | `BreadcrumbList` enbart |
| Kategorisida | `BreadcrumbList`, `ItemList` |
| Anmärkningssida | `BreadcrumbList`, `ItemList` |
| Verksamhetssida | `FoodEstablishment`, `BreadcrumbList` |
| Rapport | `Report` med `datePublished`, `dateModified`, `author`, `publisher`, `isBasedOn` mot `Dataset` |

Kommunhubben är den enda listsidan utan `ItemList`, och den är enligt R10 den sidtyp som bär
merparten av trafiken. `FoodEstablishment` bär `name`, `url`, `address` och `geo` i 164 av 199
fall. Ingen bär `image`, `servesCuisine`, `telephone` eller `openingHours`. R10 påpekade `image`,
resten är nytt: bibeln §6b säger uttryckligen att Yelps entitetsstruktur ska stjälas, och just de
fälten är vad som gör en `FoodEstablishment` till en entitet Google kopplar ihop med sin egen
kunskapsgraf.

**Intern länkning, kommun till kategori till verksamhet.** Triangeln är sluten:

| Riktning | Utfall |
|---|---|
| Kommunhubb till kategori | 5 kategorilänkar |
| Kategori till verksamhet | Hela listan plus `ItemList` |
| Verksamhet till sin kategori | 198 av 199 har exakt en |
| Verksamhet till kommunhubb | Alla |
| Verksamhet till närliggande verksamheter | 180 av 199 |
| Alla sidor till `/rapporter/` | Alla |

**Sidnavigeringen är fortfarande djup.** Fönstret är plus minus två sidor plus en ankarpunkt till
seriens sista sida. Från `/stockholm/` når man sida 2, 3 och 86. Från sida 40 når man 38 till 42
och 86. Stockholm har 86 sidor, så mitten av serien ligger fortfarande omkring tjugo klick bort.
Sista sidan halverar det värsta fallet men gör inte serien grund. R10:s förslag om ankarpunkter
var tionde sida står kvar och kostar en rad.

**Filantal mot Cloudflares tak.** Bygget är 16 470 filer efter 404-sidan. Fria nivån på Pages
tar 20 000. Två till tre kommuner till spränger taket. Det är ingen SEO-fråga men det är ett
publiceringsstopp, och det ligger nära.

---

## 6. Det som skaver: fjortontusen beskrivningar som säger samma sak

Det här är rapportens viktigaste avsnitt, och svaret på frågan är att beskrivningarna är
**formellt unika och innehållsligt en mall**.

199 slumpade verksamhetssidor, hämtade i drift:

- 199 av 199 har unik `<title>`.
- 199 av 199 har unik `description`.
- Mediandescription är 135 tecken, 18 av 199 över 160. Längden är alltså inget problem längre;
  R10:s siffra var median 161 med 8 050 sidor över gränsen, så den fasta svansen har kortats.

Så långt ser det bra ut. Men normaliserar man bort namnet och siffrorna återstår **37 skelett**,
och tar man bort månadsnamnet också återstår i praktiken **två meningar**:

| Antal | Mening |
|---:|---|
| 159 av 199 | `{namn} fick inga anmärkningar vid den senaste hygienkontrollen den {datum}. Se hela kontrollhistoriken hos kommunen.` |
| 40 av 199 | Samma inledning, med svansen `Se vilka kontrollområden som granskades och hela kontrollhistoriken.` |

**Åtta av tio indexerbara sidor på hela sajten säger ordagrant samma sak, med bara namn och datum
utbytt.**

Samma mönster i sidkroppen. Räknat på ord som förekommer på fler än 90 procent av de 199 sidorna:

| Mått | Värde |
|---|---|
| Brödtext, median | 2 230 tecken |
| Andel ord som **inte** är boilerplate, median | **17,1 %** |
| Samma, lägsta | 5,7 % |
| Samma, högsta | 50,3 % |

En medianverksamhetssida är alltså till fem sjättedelar identisk med alla andra. Rubrikerna
bekräftar det: `Statistik`, `Kontrollhistorik` och `Besökarnas omdömen` står på 199 av 199, och
`Vad kontrollen visade` bara på 40.

### Är det en risk?

Ärligt svar: **ja, men inte den risk som ordet "tunt innehåll" brukar betyda.**

Argumentet för att det håller är starkt och står i bibeln §6: programmatisk SEO överlever på unik
strukturerad data, och regeln är att låta datan vara innehållet i stället för att spraya
AI-genererad brödtext. Prikko följer den regeln exakt. Hitta.se, Yelp och FSA ser likadana ut på
mallnivå och rankar utmärkt. Datan bakom varje sida är dessutom genuint olika, även när meningen
som beskriver den inte är det.

Argumentet emot är att den variabel som skiljer sidorna åt är för liten. Skillnaden mellan två
sidor är ett namn, ett datum och ibland en rad. Google klustrar sidor vars innehåll ligger nära
varandra och visar en representant, och den delmängd där det finns någon sökefterfrågan alls,
kedjevarumärkena, är precis där mallen kollapsar helt: **137 namngrupper omfattande 374 sidor
delar `<title>` rakt av**, som tolv `Joe & The Juice, Stockholm | Prikko` och tio
`Lidl, Stockholm | Prikko`. Där är inte ens titeln unik.

Titelmönstret som helhet, naket namn plus ort, är rätt och ska inte ändras. Det följer R3 §5 och
det är vad en människa faktiskt söker på. Problemet är inte mönstret, det är att det saknar en
utväg vid kollision.

### Vad som konkret ökar skillnaden mellan sidorna

Ingen av de här kräver en enda skriven mening, allt finns i datan:

1. **Adressen i titeln vid kollision, och bara då.** `Joe & The Juice, Sveavägen 24, Stockholm`.
   Villkorat på att namnet inte är unikt inom kommunen, annars förlängs 13 000 titlar i onödan.
   Löser 374 sidor. Detta är R10 fynd 10 och det står fortfarande obesvarat.
2. **Låt beskrivningen bära det som faktiskt skiljer.** Antal kontroller i historiken, hur länge
   sedan den förra var, om det finns återkommande brister. `Statistik` och `recurringIssues()`
   räknar redan fram alltihop, det når bara aldrig `description`. Två sidor som båda är rena men
   den ena har nio kontroller sedan 2019 och den andra en enda skulle då sluta se likadana ut.
3. **Fyll `FoodEstablishment`.** `servesCuisine`, `telephone`, `openingHours` och `image`
   differentierar sidan för maskinläsaren, som är den läsare bibeln §6b bryr sig mest om.
4. **Adressen och stadsdelen i H1-området.** NAP-konsistens är enligt §6b värd 28 till 40 procent
   fler citat, och det är också vad som gör två `Lidl` till två entiteter.

Det som **inte** ska göras är att skriva mer text per sida. Metodiksidan lovar uttryckligen att
ingen text skrivs med AI, och att bryta det löftet för att fixa ett SEO-mått vore att byta bort
det enda som gör sajten trovärdig.

---

## 7. Rapporterna som redaktionell ingång

`site/src/lib/rapporter.ts` är 499 rader och är väsentligt mer genomtänkt än en vanlig
bloggmodul. Vad den gör:

- **`REPORTS`** är ett register av `Report`-objekt med `slug`, `title`, `description`, `lede`,
  `summary` och `published`. Två rapporter finns, båda publicerade 2026-08-03.
- **En beräkningsfunktion per rapport**, `deviationAreaReport()` och `inspectionTypeReport()`,
  med cache. De räknar varje tal ur beståndet vid bygget.
- **`dataUpdated()`** ger senaste `fetchedAt` över alla källor, och används som `dateModified`.
  Det är ovanligt ärligt: sidan påstår inte att den ändrats när bara bygget kört.
- **Sidmallen** `layouts/Rapport.astro` renderar `Report`-schema med `author`, `publisher` och
  `isBasedOn` mot vårt `Dataset` på `/kallor/`. Kontrollerat i drift, det stämmer.

Filens egen huvudkommentar är dessutom rätt om det svåra: sökefterfrågan på hygien i Sverige är
400 till 1 200 sökningar i månaden nationellt, `hygienbetyg` och `restaurang hygien` ligger på noll
i 262 av 262 veckor, och en blogg som jagar den efterfrågan jagar ingenting. Rapporterna finns för
att bli citerade, inte för att ranka. Den analysen står sig.

### Vad som saknas för att det ska bli en riktig ingång

**Det som inte ska byggas först.** Att skala rapporterna per kommun, `/rapporter/<slug>/<kommun>/`,
ger tolv gånger fler sidor byggda på samma mall och skulle upprepa exakt problemet i avsnitt 6 i
ett nytt hörn av sajten. Dessutom ligger en kommunuppdelad rapport nära en rangordning, och vi
rangordnar inte kommuner. Låt bli.

**Det som ska byggas, i ordning:**

1. **Kontextuell länk från verksamhetssida till rätt rapport.** Idag länkas `/rapporter/` från
   sidfoten på varje sida, men **ingen enskild rapport länkas från någon annan sida än
   rapportindex**. En verksamhet vars avvikelse bär kod `J` borde länka rakt till "Vad
   anmärkningarna faktiskt gäller", och en med ett återbesök i historiken till "Tre sorters
   kontroll". Det är en äkta redaktionell länk, den hjälper besökaren, och den flyttar
   länkvärde till de två sidor på sajten som faktiskt är citerbara. Billigast av allt här.

2. **En content collection bredvid registret, för text med byline.** Filen föreslår det själv och
   har rätt i varför: `REPORTS` är räknade sidor, en författad artikel är något annat och ska inte
   trängas in i samma struktur. Och det finns exakt en angränsande fråga med verklig volym.
   **Matförgiftning, ungefär 5 300 sökningar i månaden enligt R3 §3.** Det är tio gånger hela
   hygienefterfrågan. `rapporter.ts` säger uttryckligen att den guiden inte får genereras, att den
   inte går att härleda ur beståndet, att den är hälsorelaterad och att den kräver en namngiven
   mänsklig avsändare. Det är rätt, och det är också hela poängen: **den sidan är den enda på
   sajten som kan ranka på en fråga folk faktiskt ställer, och den måste Måns skriva.** Strukturen
   ska ligga färdig så att det enda som saknas är texten. `Article`-schema med `author` som
   `Person`, inte `Organization`, plus en riktig författarsida. Det är också E-E-A-T i bibelns
   mening, som annars saknas helt: sajten har ingen namngiven utgivare någonstans i sin
   strukturerade data.

3. **Anmälningsroboten som innehåll, inte bara funktion.** Bibeln §7b beskriver den som en
   differentiator. Den som söker "matförgiftning anmäla" har en avsikt som slutar i vår produkt.
   Kopplingen mellan guiden i punkt 2 och roboten är den enda vägen på hela sajten från en fråga
   med volym till något bara vi kan göra.

4. **En rapport som ändrar sig.** Rapporternas `dateModified` följer datan, men innehållet säger
   inte vad som ändrats. En rapport som skriver ut "sedan förra hämtningen har X nya kontroller
   tillkommit i Y kommuner" ger en färskhetssignal som §6b uttryckligen prissätter, och den räknas
   fram precis som allt annat. Kräver att förra hämtningens tal sparas, vilket är den enda
   verkliga kostnaden.

---

## 8. Verktygen, steg för steg

Det här går inte att göra åt Måns. Instruktionen är skriven för att följas ordagrant.

### 8.1 Google Search Console

1. Öppna `https://search.google.com/search-console` och logga in med `mans.erlandsson1@gmail.com`.
2. Klicka **Lägg till egendom**.
3. Två rutor visas. Välj den vänstra, **Domän**. Välj inte "URL-prefix". Domänegendomen täcker
   `prikko.se`, `www.prikko.se`, `http`, `https` och alla subdomäner i en enda egendom, vilket är
   precis vad vi vill när `www` redan 301:ar.
4. Skriv exakt `prikko.se`. Inget `https://`, inget `www`. Klicka **Fortsätt**.
5. Google visar en TXT-post. Kopiera hela värdet. Det ser ut som
   `google-site-verification=` följt av ungefär 43 tecken.
6. Öppna `https://dash.cloudflare.com` i en annan flik. Välj kontot, välj zonen **prikko.se**,
   klicka **DNS** i vänstermenyn, sedan **Records**.
7. Klicka **Add record** och fyll i **exakt** detta:

   | Fält | Värde |
   |---|---|
   | Type | `TXT` |
   | Name | `@` |
   | Content | `google-site-verification=` plus strängen från steg 5, i sin helhet |
   | TTL | `Auto` |

   Klicka **Save**. TXT-poster har ingen proxyinställning, så det finns inget moln att klicka på.
8. Vänta ungefär två minuter. Gå tillbaka till Search Console och klicka **Verifiera**.
   Misslyckas den, vänta tio minuter och försök igen. Ta inte bort posten.
9. **Lämna kvar TXT-posten för alltid.** Google kontrollerar om den med jämna mellanrum, och tas
   den bort tappas egendomen med all historik.
10. I vänstermenyn, klicka **Sitemaps**. Skriv `sitemap-index.xml` i fältet. Fältet har redan
    `https://prikko.se/` som fast prefix, så skriv inte hela adressen. Klicka **Skicka**.
11. Kontrollera efter ett dygn under **Sitemaps** att status är "Lyckades" och att antalet
    upptäckta sidor närmar sig 14 041.

### 8.2 Bing Webmaster Tools

Bing är inte valfritt. Bing driver ChatGPT:s webbsökning, vilket enligt bibeln §6b är en uttalad
kanal.

1. Öppna `https://www.bing.com/webmasters`.
2. Logga in. Välj **Sign in with Google** och använd samma konto som i 8.1.
3. Den snabba vägen: på startskärmen finns **Import Your Sites From Google Search Console**.
   Klicka **Import**, godkänn behörigheten, kryssa i `prikko.se`, klicka **Import**. Det för över
   både verifieringen och sitemapen, och du är klar. Hoppa till steg 6.
4. Fungerar importen inte, gör det manuellt: klicka **Add a site manually**, skriv
   `https://prikko.se` med protokoll, klicka **Add**.
5. Bing visar tre verifieringsalternativ. Välj det tredje, **Add a CNAME record to DNS**. Bing
   visar ett värde. I Cloudflare, samma väg som i 8.1 steg 6, klicka **Add record**:

   | Fält | Värde |
   |---|---|
   | Type | `CNAME` |
   | Name | Strängen Bing visar som "Host" |
   | Target | `verify.bing.com` |
   | Proxy status | **DNS only**, alltså grått moln, inte orange |
   | TTL | `Auto` |

   Proxystatusen är den enda punkt där det brukar gå fel. Är molnet orange proxar Cloudflare
   posten och Bing ser inte det den letar efter. Klicka **Save**, gå tillbaka till Bing och klicka
   **Verify**.
6. I vänstermenyn, klicka **Sitemaps**, sedan **Submit sitemap**. Här ska **hela adressen** skrivas,
   till skillnad från i Google: `https://prikko.se/sitemap-index.xml`. Klicka **Submit**.
7. **IndexNow, gör det här samtidigt.** Det är Bings mekanism för att få veta om ändringar direkt
   i stället för vid nästa crawl, och sajten uppdaterar data enligt schema i `uppdatera-data.yml`.
   Färskhet är enligt §6b värd 28 procent fler citat.
   - I vänstermenyn, klicka **IndexNow**, sedan **Generate key**. Kopiera nyckeln.
   - Lägg en fil i repot: `site/public/<nyckeln>.txt`, vars enda innehåll är nyckeln själv.
     Den hamnar då på `https://prikko.se/<nyckeln>.txt`, vilket är där IndexNow letar.
   - Efter varje lyckad datauppdatering, anropa
     `https://api.indexnow.org/indexnow` med de ändrade URL:erna. Ett steg i
     `uppdatera-data.yml` räcker.

### 8.3 Efter verifieringen, i den här ordningen

1. **Google Search Console, URL-inspektion.** Klistra in `https://prikko.se/` och begär
   indexering. Gör samma sak för de tre största kommunhubbarna, `/stockholm/`, `/uppsala/` och
   `/linkoping/`. Fler än så är meningslöst, resten sköter sitemapen.
2. **Search Console, Inställningar, robots.txt.** Kontrollera att Google läser den sammanslagna
   filen från avsnitt 4 och inte rapporterar något fel.
3. **Efter en vecka, Indexering, Sidor.** Titta särskilt efter kategorin **"Mjuk 404"**. Är fynd A
   rättat ska den vara tom. Är den full är fixen inte i drift.
4. **Efter två veckor, Resultat i sökningen.** Ingenting kommer att ha hänt, och det är väntat.
   R3 säger att Prikko inte fångar efterfrågan utan skapar en kategori.

---

## 9. Vad som ändrades i den här omgången

Fyra filer. Bygget går igenom, 14 041 URL:er i sitemapen, byggrinden om noindex passerar.

| Fil | Ändring |
|---|---|
| `site/src/pages/404.astro` | **Ny.** Ger `dist/404.html`, vilket får Cloudflare Pages att svara 404 i stället för 200 med startsidan. Fynd A. |
| `site/astro.config.mjs` | `lastmod` per URL ur datans egna datum. Verksamhetssidan får sin senaste kontroll, kommunens sidor får `source.fetchedAt`, statiska sidor får inget. `changefreq` borttaget, Google ignorerar fältet. R10 fynd 8. |
| `site/src/pages/index.astro` | `potentialAction`/`SearchAction` borttagen. Sitelinks-sökrutan togs bort ur Googles resultat i november 2024, och målsökvägen var blockerad i robots.txt. R10 fynd 9. |
| `.github/workflows/kontroll.yml` | Ny byggrind: `dist/404.html`, `og-default.png`, `apple-touch-icon.png` och `favicon.svg` måste finnas. Den befintliga dödlänkskontrollen tittar bara på kataloger och hade inte fångat något av det. |

Effekten på `lastmod`, mätt i utfallet:

| | Före | Efter |
|---|---:|---:|
| Unika `lastmod`-värden | 1 | 756 |
| URL:er utan `lastmod` | 0 | 14 (de statiska sidorna, med flit) |

---

## 10. Kvar som förslag, rangordnat

| # | Förslag | Fynd |
|---:|---|---|
| 1 | Adress eller stadsdel i titeln vid namnkollision, 374 sidor | R10 fynd 10, avsnitt 6 |
| 2 | Beskrivningen bär det som skiljer sidorna åt, inte bara namn och datum | Avsnitt 6 |
| 3 | Kontextuell länk från verksamhetssida till rätt rapport | Avsnitt 7 |
| 4 | Kommunhubbens titel till upptäckt-intent | R10 fynd 7 |
| 5 | Omdirigera `prikko.pages.dev` till `prikko.se` | Fynd B |
| 6 | `ItemList` på kommunhubben, sajtens enda listsida utan | R10 övrigt |
| 7 | `image`, `servesCuisine`, `telephone`, `openingHours` i `FoodEstablishment` | Avsnitt 5 |
| 8 | Ankarpunkter var tionde sida i långa sidnavigeringar | R10 fynd 6 |
| 9 | `noindex` på `/sok/`, eller lämna den. Sidan har eget innehåll och beslutet står skrivet i filen | R10 fynd 9 |
| 10 | Städa de 7 kvarvarande asteriskerna i Linköpings namn | R10 övrigt |
| 11 | Content collection för författad text med byline, för matförgiftningsguiden | Avsnitt 7 |
| 12 | Ta ställning till `ai-input` i Cloudflares `Content-Signal` | Fynd C |

---

## 11. De tre saker som flyttar mest trafik, i ordning

**1. Bekräfta att 404-rättelsen faktiskt gäller i drift, och lämna in sitemapen samma dag.**
Så länge varje okänd URL svarar 200 med startsidan har Google inget sätt att skilja sajtens
14 041 riktiga sidor från ett obegränsat antal mjuka 404:or, och crawlbudgeten på en domän som är
en dag gammal går åt till fel saker. Fixen finns i repot men effekten sitter i Cloudflares svar.
Ett `curl` efter nästa driftsättning avgör om det är gjort. Direkt därefter avsnitt 8.1 och 8.2:
sajten är inte anmäld någonstans än, och ingenting av det övriga betyder något förrän Googlebot
och Bingbot vet att den finns.

**2. Ge de 374 kollisionssidorna en egen titel, och låt beskrivningen bära det som skiljer
sidorna åt.** Kedjevarumärkena är enligt R2 §3.4 det enda entitetsmönster som genererar någon
hygienrelaterad sökning alls, och det är exakt den delmängd där tolv sidor delar titel rakt av.
Samtidigt är åtta av tio sidor på sajten ordagrant samma mening med namn och datum utbytt, och
sidkroppen är till 83 procent boilerplate. Datan som skiljer dem åt är redan uträknad i
`statistics()` och `recurringIssues()`, den når bara aldrig `description`. Det är den enda
åtgärden som förbättrar hela korpusen på en gång, och den kräver inte en enda skriven mening.

**3. Bygg strukturen för matförgiftningsguiden och skriv den.** Hela sajtens sökefterfrågan är
400 till 1 200 i månaden. Matförgiftning ensamt är ungefär 5 300. Det är tio gånger allt annat
tillsammans, och det är den enda frågan på området där folk faktiskt söker innan de har ett
problem. `rapporter.ts` har redan rätt i att den inte får räknas fram, och pekar redan på att en
content collection är verktyget. Det som saknas är strukturen och en namngiven författare, vilket
dessutom är den E-E-A-T-signal sajten helt saknar idag. Kopplad till anmälningsroboten går den
från en artikel till den enda vägen på sajten från en fråga med volym till något bara vi kan göra.
