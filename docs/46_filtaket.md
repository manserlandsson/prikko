# 46. Filtaket: vad som faktiskt begränsar 290 kommuner

**Datum:** 2026-08-30
**Föregångare:** `docs/30_programmatisk_seo.md` §3 räknade fram problemet.
`docs/45_entreprenorslistan.md` punkt A0 beställde utredningen och kallade den
blockerande för A1 till A7. `docs/adr/0001-rendering-strategi.md` pekade ut
hybridrendering på Workers som svaret redan 2026-08-02.
**Beställning:** avgör arkitekturvalet med mätta tal, inte med antaganden.
**Utfall:** premissen i A0 är fel på en punkt som ändrar hela svaret, byggtiden
är inte den vägg vi trodde, och tre gränser som ingen räknat på ligger före den
gräns vi har räknat på i fyra dokument.

Varje tal i det här dokumentet har sin mätning skriven bredvid sig. Talen som är
uppskattningar heter uppskattningar, och §8 samlar allt som inte gick att mäta.

---

## 1. Slutsatsen först

Sju slutsatser, i fallande ordning av vad de betyder.

1. **Vi behöver inte byta värd, inte bygga om något och inte fatta ADR 0001:s
   hybridbeslut i år. Cloudflare Pages tar 100 000 filer på den betalda planen,
   inte 20 000.** Talet 100 000 står i våra dokument som något Workers Static
   Assets kan och Pages inte kan. Det är fel: Cloudflares egen gränssida ger
   exakt samma två tal för båda plattformarna. Priset är 5 dollar i månaden och
   ändringen är ett klick, inte en migration. §4.1.
2. **Hela riket ryms under det taket, men med 2,7 procents marginal.** 92 746
   anläggningar ger 96 940 till 97 413 filer mot 100 000. Det räcker, och det
   räcker inte till en sidtyp till. §3.2.
3. **Byggtiden är inte väggen.** Vi har antagit motsatsen sedan ADR 0001. Mätt:
   hela riket landar på omkring 11 minuter på den här maskinen och omkring
   12,5 minuter på en löpare av GitHubs slag, mot Cloudflares tak på 20 minuter.
   Marginalen är knapp men den finns, och kvoten mellan löpare och laptop är
   mätt och inte gissad. §3.3.
4. **Overheaden per verksamhet är 0,043 filer, inte 1,035.** Docs/30 §3 dividerade
   totalen med antalet verksamheter och fick 1,035, vilket beskriver dagens bestånd
   men inte marginalkostnaden. Slår vi ihop varenda extrafil sparar vi under fyra
   procent av utgåvan. Den vägen finns alltså inte. §4.5.
5. **Hybriden är inte "ett adaptertillägg plus `prerender = false`". ADR 0001 har
   fel på den punkten.** `site/src/data` är 49 MB i dag och omkring 286 MB
   nationellt. En Worker får vara 10 MB komprimerad. Hybriden kräver att
   datalagret flyttas ut ur bygget, alltså precis den omskrivning ADR 0001 lovade
   att vi slapp. §4.3.
6. **Tre gränser ligger före filtaket och ingen av dem står i något av våra
   dokument.** Rutarkivet växer mot Cloudflares 25 MiB per fil, sökregistret växer
   till 6,3 MB och serveras i sin helhet vid varje cachemiss, och git-arkivet
   växer med en ögonblicksbild på 286 MB varje natt. §5.
7. **Nattjobbet har inte lyckats sedan 18 augusti, och sedan 27 augusti startar
   det inte alls.** GitHub svarar att kontot har en betalningsspärr. Det ligger
   utanför beställningen men det blockerar allt som står i det här dokumentet,
   så det står här. §7.4.

---

## 2. Nuläget, mätt

### 2.1 Så mättes det

```
cd site && npm run build -- --outDir dist-taket
```

Kört 2026-08-30 klockan 15:34 på ägarens maskin, med `git status` rent så när som
på två ospårade filer i `pipeline/`, och utan att något annat bygge pågick.

Körningen gjordes två gånger. Den första kördes medan den här utredningen läste
filer parallellt, och buntningssteget tog då 3 min 57 s i stället för 26,83 s.
Alla tal nedan kommer ur den andra, ostörda körningen. Att skillnaden var
1,5 gånger på totalen är i sig ett resultat: byggtiden är dominerad av väntan på
disk, inte av processorn.

Filantalet är identiskt i båda körningarna, 17 011.

### 2.2 Filer per sidtyp

`/usr/bin/time -p` gav `real 155.65`, alltså **2 minuter 36 sekunder**, varav
`user 85.52` och `sys 30.91`. Bara 116 av 156 sekunder är processorarbete.
Resten är väntan på att 1,95 GB ska skrivas till disk.

| Sidtyp | Filer | Byte | Snitt |
|---|---:|---:|---:|
| Verksamhetssida | 16 044 | 1 846 657 643 | 115 100 |
| Kategorisida | 256 | 29 226 749 | 114 167 |
| `_astro` (JS, CSS, typsnitt, bilder) | 167 | 10 039 756 | 60 118 |
| Kommunens sidindelning | 154 | 18 835 917 | 122 311 |
| Områdessida | 148 | 17 830 563 | 120 477 |
| Kedjesida | 53 | 6 307 660 | 119 012 |
| Artikel | 25 | 2 499 616 | 99 985 |
| Anmärkningssida | 22 | 2 325 765 | 105 717 |
| Toppsida | 16 | 2 113 768 | 132 111 |
| Områdesytor (.json) | 13 | 335 464 | 25 805 |
| Sitemap | 12 | 1 596 666 | 133 056 |
| Kommunhubb | 12 | 1 857 682 | 154 807 |
| Jämförindex (.json) | 12 | 1 536 768 | 128 064 |
| Rotfiler (robots, llms, sökregistrets reserv med flera) | 10 | 1 152 191 | 115 219 |
| Kommunkarta | 9 | 1 066 359 | 118 484 |
| Kartlista (.json) | 9 | 1 687 507 | 187 501 |
| Rapport | 8 | 514 053 | 64 257 |
| Gatunamn (.json) | 8 | 221 091 | 27 636 |
| Utmärkelse | 6 | 436 671 | 72 779 |
| Övriga tillgångar | 6 | 292 526 | 48 754 |
| Utan anmärkning | 5 | 379 133 | 75 827 |
| Konto | 5 | 223 644 | 44 729 |
| MapLibre | 4 | 1 127 620 | 281 905 |
| Matsnusk | 2 | 273 620 | 136 810 |
| Sökregister (.json) | 1 | 1 092 084 | 1 092 084 |
| Rutarkiv (.bin) | 1 | 3 245 528 | 3 245 528 |
| Kartstil (.json) | 1 | 41 239 | 41 239 |
| Rikskarta | 1 | 66 058 | 66 058 |
| Nytt och borta, riket | 1 | 54 411 | 54 411 |
| **Totalt** | **17 011** | **1 953 037 752** | |
| Varav HTML | 16 767 | | |
| Varav tillgångar | 244 | | |

Bygget rapporterade själv `17011 filer i utgåvan, 2489 kvar till taket` och
`16766 page(s) built in 2m 14s`.

En verksamhetssida väger 115 100 byte rå. Mätt på
`/stockholm/08-burger-kebab-bandhagen/`: 133 791 byte rå, 26 329 med gzip och
23 546 med brotli. Vikten på tråden är alltså omkring 24 kB, och det är inte ett
problem. Vikten på disk är det, se §3.4.

### 2.3 Vad en verksamhet faktiskt kostar i filer

Det här är dokumentets viktigaste enskilda mätning, eftersom docs/30 §3 svarade
fel på frågan och hela rangordningen där bygger på svaret.

Filerna räknades per kommun, med kommunens egna list-, kart- och kategorisidor
och dess fyra JSON-tillgångar lagda på kommunen.

| Kommun | Verksamheter | Verksamhetssidor | Övriga filer | Övriga per verksamhet |
|---|---:|---:|---:|---:|
| Svenljunga | 99 | 99 | 6 | 0,061 |
| Lomma | 153 | 153 | 8 | 0,052 |
| Kristinehamn | 170 | 170 | 13 | 0,076 |
| Oskarshamn | 239 | 239 | 13 | 0,054 |
| Höganäs | 316 | 316 | 10 | 0,032 |
| Borgholm | 406 | 406 | 13 | 0,032 |
| Karlstad | 694 | 694 | 28 | 0,040 |
| Jönköping | 1 114 | 1 114 | 38 | 0,034 |
| Örebro | 1 233 | 1 233 | 39 | 0,032 |
| Linköping | 1 246 | 1 246 | 47 | 0,038 |
| Uppsala | 1 854 | 1 854 | 48 | 0,026 |
| Stockholm | 8 520 | 8 520 | 387 | 0,045 |

Utanför kommunerna ligger 317 filer: rikets egna sidor, `_astro`, MapLibre,
sitemapen, rutarkivet, sökregistret och rotfilerna.

**Exakt en HTML-fil per verksamhet, och inget mer.** Overheaden ligger på
kommunen och inte på verksamheten. Docs/30 §3 skrev "1,035 sidor per
verksamhet", vilket är 17 011 delat med 16 044. Det talet beskriver dagens
utgåva korrekt men säger fel sak om marginalen, och det är marginalen som
avgör vad nästa kommun kostar.

Två linjära anpassningar, båda över tabellen ovan:

* **Utan Stockholm:** `övriga = 5,56 + 0,0268 × verksamheter`, r² = 0,931.
* **Alla tolv:** `övriga = 0,0452 × verksamheter`, r² = 0,988, men med negativ
  konstant, vilket inte går att använda för 290 kommuner där de flesta är små.

Stockholm ligger 153 filer över den första anpassningen, och skälet är känt:
Stockholm är den enda kommun som har en full områdesindelning ur SCB:s RegSO.
Den ger 135 områdessidor och drar med sig 149 kategorisidor. De två
anpassningarna är därför inte två gissningar utan ett golv och ett tak: golvet
är dagens läge där bara Stockholm har områden, taket är läget där alla större
kommuner fått samma indelning. Prognoserna i §3 redovisar båda.

### 2.4 Byggtidens faser

Ur den ostörda körningens tidsstämplar:

| Fas | Tid | Skalar med |
|---|---:|---|
| `prebuild`, innehållssynk, typer | omkring 2 s | nej |
| Buntning i Vite | 26,83 s | nej, i praktiken |
| Statiska rutter, 16 766 sidor | 1 min 11 s | ja, 4,23 ms per sida |
| Bildoptimering | 0,04 s | nej |
| Sitemapen skrivs | 1 s | ja, svagt |
| `prikko:sitemap-guard` | 16 s | ja, läser all HTML |
| `prikko:filtak` och `prikko:nesting-guard` | 1 s | ja, svagt |
| `prikko:lankar` | 17 s | ja, läser all HTML igen |
| `prikko:kartrutegrind` | under 1 s | ja, svagt |
| **Totalt** | **2 min 36 s** | |

Uppdelat: **50 sekunder fast kostnad** och **106 sekunder som skalar**, alltså
**6,23 ms per fil**. En tredjedel av den skalande delen är våra egna grindar,
som läser hela utgåvans HTML två gånger om.

---

## 3. Extrapoleringen

### 3.1 Modellen, och hur den prövades

Antalet anläggningar per kommun är inte uppskattat. Det står i
`pipeline/data/kommunregister.csv`, kolumnen `anlaggningar`, med 247 myndigheter
och **92 746 anläggningar** totalt. Det är samma tal som Livsmedelsverkets
rapport L 2025 nr 13 ger och som docs/30 §3.2 redan citerade.

Kommunerna tas i storleksordning, eftersom det är i den ordningen de faktiskt
kommer att kopplas in.

| Antal kommuner | Anläggningar | Andel av riket |
|---:|---:|---:|
| 25 | 41 128 | 44,3 % |
| 50 | 55 538 | 59,9 % |
| 100 | 72 384 | 78,0 % |
| 200 | 89 204 | 96,2 % |
| 247 | 92 746 | 100 % |

Filmodellen är:

```
filer = verksamheter + Σ overhead(kommun) + 317 fasta + sitemapens tillväxt
```

där `overhead` är golvet respektive taket ur §2.3, summerat kommun för kommun.

**Modellen prövades mot mätningen innan den användes.** Med våra tolv kommuner
och 16 044 verksamheter ger golvet 16 870 filer och taket 17 100. Det uppmätta
talet är 17 011, alltså inuti spannet, 0,8 procent över golvet och 0,5 procent
under taket. En modell som inte kan reproducera det bygge den byggdes på är
värdelös, och den här kan det.

En avvikelse att känna till: registret säger 9 456 anläggningar i Stockholm, vår
egen hämtning ger 8 520. Registret räknar alla anläggningstyper i myndighetens
register, vi publicerar de som klarar kvalitetsgrinden. Prognoserna nedan
använder registrets tal, vilket gör dem försiktiga åt rätt håll.

### 3.2 Filer

| Kommuner | Anläggningar | Filer, golv | Filer, tak | Andel av 20 000 | Andel av 100 000 |
|---:|---:|---:|---:|---:|---:|
| 12 (dagens) | 16 044 | 16 870 | 17 100 | **85 %** | 17 % |
| 25 | 41 128 | 42 699 | 43 316 | 217 % | 43 % |
| 50 | 55 538 | 57 637 | 58 379 | 292 % | 58 % |
| 100 | 72 384 | 75 212 | 75 987 | 380 % | 76 % |
| 200 | 89 204 | 93 039 | 93 587 | 468 % | 94 % |
| 247 | 92 746 | 96 940 | 97 413 | 487 % | **97 %** |

**Taket på 20 000 passeras vid den fjärde största kommunen**, alltså vid 19 912
anläggningar och 21 141 filer. Docs/30 §3.2 skrev "cirka 19 300 verksamheter" och
"två till tre kommuner av normalstorlek". Mätningen ger fyra av de största, vilket
är samma sak sagt om en annan ordning på inkopplingen, och docs/30 hade alltså
rätt.

**Taket på 100 000 passeras aldrig.** Hela riket landar på 97 413 filer i värsta
fallet, alltså 2 587 filers marginal. Det är tillräckligt för att göra jobbet och
otillräckligt för att göra det bekvämt. En ny sidtyp som kostar en fil per
kommun ryms; en som kostar en fil per verksamhet gör det inte.

### 3.3 Byggtiden

Med 50 sekunder fast och 6,23 ms per fil, på ägarens maskin:

| Kommuner | Filer (tak) | Byggtid, denna maskin | På GitHub-löpare |
|---:|---:|---:|---:|
| 12 | 17 100 | 2:36 (mätt) | 2:57 (mätt) |
| 25 | 43 316 | 5:20 | 6:05 |
| 50 | 58 379 | 6:54 | 7:52 |
| 100 | 75 987 | 8:43 | 9:56 |
| 200 | 93 587 | 10:33 | 12:02 |
| 247 | 97 413 | 10:57 | 12:29 |

Kvoten mellan löpare och laptop är **mätt och inte gissad**. Kontrollkörningen på
GitHub 2026-08-18 (körning 32175892042) hade steget `Bygg` mellan 19:19:10 och
19:22:07, alltså 177 sekunder, på ett bygge av samma storlek som dagens. Vår egen
ostörda körning tog 155,65 sekunder. Kvoten är 1,14.

Cloudflares byggtimeout är **20 minuter**, samma på Pages och på Workers Builds.
Vid full nationell täckning ligger vi på omkring 12,5 minuter plus en kall
`npm ci`, alltså inom taket med sju minuters marginal.

**Detta motsäger ADR 0001.** Där står att byggtiden "växer linjärt med sidantalet"
och att det "direkt motverkar färskhetsmålet". Tillväxten är linjär, det stämmer,
men lutningen är så flack att 290 kommuner går på tolv och en halv minut. Ett
nattligt bygge på tolv minuter är fullt arbetsbart. Det som inte är arbetsbart är
tolv minuter varje gång man ändrar en rad CSS lokalt, och det är ett
utvecklingsproblem med egna lösningar, inte ett arkitekturproblem.

Den billigaste tidsvinsten om vi behöver den: `prikko:sitemap-guard` och
`prikko:lankar` läser tillsammans hela utgåvans HTML två gånger och kostar 33 av
156 sekunder. Slås läsningen ihop till en passage försvinner ungefär hälften av
den kostnaden, alltså omkring 1,5 minuter vid nationell skala.

### 3.4 Byte

| Kommuner | Utgåvans storlek |
|---:|---:|
| 12 | 1,95 GB (mätt) |
| 25 | 5,0 GB |
| 50 | 6,7 GB |
| 100 | 8,7 GB |
| 247 | 11,2 GB |

Cloudflare dokumenterar **ingen** gräns för en utgåvas totala storlek, bara
25 MiB per enskild fil. Elva gigabyte är därför inte känt som ett problem, men
det är inte heller känt som ett icke-problem. Det är ett av de tal som ska
prövas skarpt vid kommun nummer trettio, inte vid kommun nummer tvåhundra.

Bandbredden är däremot avgjord: Cloudflare skriver rakt ut att förfrågningar mot
statiska tillgångar är gratis och obegränsade på både den fria och den betalda
planen. Det gäller Pages och det gäller Workers Static Assets.

---

## 4. Vägarna

### 4.1 Byt plan, inte värd

Detta är fyndet.

`site/astro.config.mjs` skriver i `filtaksgrind()`: "Workers Static Assets tar
100 000 filer på den betalda planen, 5 dollar i månaden. Den dagen taket flyttas
ska talen här flyttas med." Samma påstående står i felmeddelandet grinden kastar,
och docs/45 A0 bygger på det när den listar "flytta till en värd utan filtak" som
en av tre vägar.

Cloudflares gränssida för Pages, hämtad 2026-08-30, säger att en Pages-sajt tar
upp till 20 000 filer på den fria planen och upp till 100 000 på de betalda.
Gränssidan för Workers ger samma två tal för Workers Static Assets. **Skillnaden
mellan plattformarna ligger alltså inte i filtaket.** Den fanns aldrig där.

| | Pages, fri | Pages, betald | Workers Static Assets, fri | Workers, betald |
|---|---:|---:|---:|---:|
| Filer | 20 000 | **100 000** | 20 000 | 100 000 |
| Största fil | 25 MiB | 25 MiB | 25 MiB | 25 MiB |
| Byggtimeout | 20 min | 20 min | 20 min | 20 min |
| `_headers`-regler | 100 | 100 | 100 | 100 |
| Statiska förfrågningar | gratis, obegränsat | gratis, obegränsat | gratis, obegränsat | gratis, obegränsat |

Den betalda Pages-planen är Workers Paid, alltså **5 dollar i månaden**, som
utöver filtaket ger 10 miljoner funktionsanrop och 30 miljoner CPU-millisekunder
i månaden. `functions/api/ratta.ts` är i dag den enda funktionen och skulle
behöva sextusen rättelser om dagen för att märka av det.

**Vad som måste byggas om:** ingenting. Samma värd, samma `_headers`, samma
`functions/`-katalog, samma byggkommando, samma `.bin`-beteende. Det enda som
ska ändras i koden är `FILTAK_VARNING` och `FILTAK_FEL` i `astro.config.mjs`, och
den kommentar som just nu påstår fel sak om Workers.

**Vad det inte löser:** taket flyttas från 20 000 till 100 000, alltså till 97
procents fyllnad vid full täckning. Det är en femdubbling och inte en befrielse.

### 4.2 Byt värd

Alla tal hämtade ur leverantörernas egen dokumentation 2026-08-30.

**Cloudflare Workers Static Assets.** Samma tak, samma priser, samma
`_headers`-syntax. Men migrationen är inte gratis: Cloudflares egen
migrationsguide säger att Pages Functions filbaserade routing inte har någon
motsvarighet, att `functions/api/ratta.ts` först måste kompileras till ett enda
Worker-skript med `wrangler pages functions build`, och att den som vill behålla
filbaserad routing bör överväga ett annat ramverk. Dessutom byter ordningen
plats: Pages kör funktioner först, Workers serverar tillgångar först om man inte
sätter `run_worker_first`. Vi skulle alltså betala en riktig migrationskostnad
för ett tak vi redan har. **Ingen anledning.**

Värre: Cloudflares dokumentation nämner ingenstans om Workers Static Assets
besvarar `Range` med 206. Det är precis det beroende som tömde kartan
2026-08-08. Att byta bort en plattform där vi har mätt att räckvidden fungerar
mot en där beteendet är odokumenterat är att byta en känd risk mot en okänd.

**Netlify.** Ingen dokumenterad gräns på antal filer per utgåva, men högst 54 000
filer per katalog, och `dist/[kommun]/` skulle vid Stockholms storlek hamna långt
under det. Prismodellen är kreditbaserad: 20 krediter per GB webbandbredd, och
den fria planen ger 300 krediter, alltså i storleksordningen 15 GB bandbredd i
månaden. Med 11 GB utgåva och en crawler som hämtar den är det för lite, och Pro
börjar på 20 dollar. Byggtimeouten står inte i dokumentationen. `_headers` och
`_redirects` stöds. Om Netlify svarar 206 på `Range` är inte dokumenterat.

**Vercel.** Hobbyplanen är begränsad till icke-kommersiell användning, vilket
utesluter den. Utdatafiler från bygget har enligt dokumentationen ingen övre
gräns, men de varnar för längre byggtider vid 100 000 filer och uppåt.
Byggtimeout 45 minuter, alltså generösare än Cloudflare. Om Vercel svarar 206
framgår inte, och deras cachedokumentation säger att svar med `Range` i
förfrågan inte cachas alls, vilket är exakt det läge som gav en tom karta hos oss.

**Egen server.** Löser filtaket helt, eftersom ett filsystem inte har ett tak vid
100 000 filer. Kostar i stället det vi i dag får gratis: kanten, certifikaten,
bandbredden, drifttiden och en människas uppmärksamhet. För ett soloprojekt är
det fel byte.

### 4.3 Hybrid

ADR 0001 säger att bytet ska vara "ett adapter-tillägg plus `export const
prerender = false` på svanssidorna, inget omskrivet datalager".

**Det stämmer inte, och det är viktigt att det står här och inte upptäcks senare.**

`site/src/data` är i dag 49 445 335 byte JSON, alltså 3 082 byte per verksamhet.
Nationellt blir det omkring 286 MB. En Worker får vara 3 MB komprimerad på den
fria planen och 10 MB på den betalda. Datan kan alltså inte följa med in i
paketet, oavsett hur många `prerender = false` vi skriver.

En hybrid kräver därför att `src/lib/db.ts` slutar läsa filer och i stället
frågar något som finns vid kanten: D1, KV, R2 eller Supabase över nätet. Det är
en riktig ombyggnad av datalagret, med en ny felkälla i varje sidvisning och en
svarstid som ska hållas under Cloudflares 10 ms processortid på den fria planen.
Att `src/lib/` är väl avgränsat, vilket ADR 0001 krävde, gör ombyggnaden möjlig
att göra på ett ställe. Det gör den inte liten.

**Vad hybriden skulle omfatta.** Delar man som ADR 0001 föreslår blir det:

| | Sidor vid 247 kommuner | Statiskt eller vid kanten |
|---|---:|---|
| Verksamhetssidor | 92 746 | vid kanten |
| Kommunernas list-, kategori-, områdes- och kartsidor | omkring 4 350 | statiskt |
| Kedjor, artiklar, rapporter, utmärkelser, toppsidor | omkring 320 | statiskt |
| Tillgångar | omkring 350 | statiskt |
| **Statisk utgåva** | **omkring 5 000 filer** | |

Fem tusen filer ryms med råge under 20 000, alltså skulle hybriden fungera på den
FRIA planen. Det är hybridens verkliga argument, och det är ett svagt argument
när alternativet kostar 5 dollar i månaden.

### 4.4 Stycka utplaceringen per region

Idén: fyra Pages-projekt bakom `prikko.se`, ett per landsdel.

Det går, men bara med en Worker framför som väljer projekt per sökväg, eftersom
Pages inte kan dela en domän mellan projekt. Vi har då infört Workers ändå, med
allt vad §4.2 säger om Pages Functions, och dessutom fått fyra byggen att hålla i
takt, fyra utgåvor som kan glida isär, och en fråga som inte har något bra svar:

**Det delade sökindexet.** `sok-index/<hash>.json` byggs ur hela beståndet och är
en fil. Antingen bygger varje region sitt eget register, och då hittar en sökning
i norr inte ett ställe i söder, vilket dödar den funktion som är hela sajtens
ingång. Eller så byggs registret en gång och läggs på alla fyra, och då måste alla
fyra byggas om när vilken kommun som helst ändras, vilket tar bort hela vinsten.

Vägen löser ett problem vi inte längre har, till priset av ett problem vi inte
har i dag. **Avfärdad.**

### 4.5 Färre filer per verksamhet

Mätningen i §2.3 avgör den här vägen på en rad: en verksamhet kostar **exakt en
fil**. Det finns ingen andra fil att slå ihop den med.

Allt annat, alltså 967 filer av 17 011, är kommunernas listsidor och rikets
tillgångar. Slår vi ihop varenda en av dem sparar vi 5,7 procent i dag och
omkring 4,5 procent nationellt, alltså drygt 4 000 filer av 97 413. Det räcker
inte för att göra någon skillnad för valet, och varje sammanslagning kostar en
sida som rankar.

En sak är ändå värd att göra av andra skäl: sökregistret byggs i två exemplar,
`/sok-index/<hash>.json` och `/sok-index.json`, och det andra är en reserv för
webbläsare med gammal HTML i cachen. Två filer på 1,09 MB i dag, två på 6,3 MB
nationellt. Se §5.2.

### 4.6 Två vägar som inte stod i beställningen

**R2 för de tunga binärfilerna.** Rutarkivet och sökregistret är de enda filer
som växer mot en storleksgräns i stället för mot filtaket. R2 kostar 0,015 dollar
per GB och månad, har gratis egress, och är det enda alternativ i hela den här
utredningen där stöd för `Range` står uttryckligen i dokumentationen. Det är
reservplanen om rutarkivet närmar sig 25 MiB, se §5.1. Det är inte en väg för
sajten, bara för två filer.

**Minska HTML-vikten.** En verksamhetssida är 115 kB rå och 24 kB komprimerad.
Den komprimerade siffran är bra; den råa är vad som gör utgåvan till 11 GB och
byggtiden till väntan på disk. Det påverkar inte filtaket alls, men det är den
enda kända spaken mot byggtidens I/O-del och mot utgåvans totala storlek. Ingen
åtgärd föreslås här, men talet ska finnas skrivet den dag någon undrar varför
bygget väntar mer än det räknar.

---

## 5. Tre gränser som ligger före filtaket

Ingen av dessa står i docs/30, docs/45 eller ADR 0001. Alla tre är mätta i dag.

### 5.1 Rutarkivet mot 25 MiB per fil

`kartrutor/punkter-<hash>.bin` är 3 245 528 byte för 16 044 verksamheter, alltså
**202 byte per verksamhet**. Vid 92 746 blir det omkring **18,8 MB** mot
Cloudflares tak på 25 MiB, alltså 26 214 400 byte. Det ryms, med 28 procents
marginal, och det är den minsta marginalen någonstans i det här dokumentet.

Bygget rapporterar dessutom att den tyngsta provade rutan, z10/563/301, redan är
478,6 kB uppackad med 7 269 features. Den rutan är Stockholms innerstad och den
växer inte nationellt, men motsvarande rutor för Göteborg och Malmö tillkommer.

Grinden som ska finnas: `scripts/kartrutegrind.mjs` känner redan arkivets storlek
och skriver ut den. Den ska fälla bygget vid 20 MB, av exakt samma skäl som
`filtaksgrind` fäller vid 19 500 i stället för vid 20 000.

### 5.2 Sökregistret serveras helt vid varje cachemiss

Mätt mot produktion i dag, med en frågesträng som tvingar fram en cachemiss:

```
/kartrutor/punkter-....bin   Range: bytes=1500000-1500063
  → 206, content-range: bytes 1500000-1500063/3279666, cf-cache-status: MISS

/sok-index/f42c68f9dfff.json  Range: bytes=0-127
  → 200, content-length: 1092084, cf-cache-status: DYNAMIC
```

Sökregistret är 1 092 084 byte för 16 044 verksamheter, alltså **68 byte per
verksamhet**, och nationellt omkring **6,3 MB**. Det ligger på en `.json`-adress,
alltså utanför kantens cache, alltså DYNAMIC, alltså hämtas det i sin helhet från
ursprunget vid varje besökare som inte har det i webbläsarens cache.

`public/_headers` konstaterar redan att `/sok-index/` är DYNAMIC och att "samma
byte av ändelse skulle hjälpa den också". Vid 6,3 MB är det inte längre en
förbättring utan en rättelse. Registret ska antingen byta ändelse så att kanten
cachar det, eller delas per kommun som `jamfor-index` redan är, eller bli det
serveranrop som `sok-index/[hash].json.ts` själv förutspår i sin
källkodskommentar.

### 5.3 Git-arkivet växer med 286 MB per natt

`site/src/data` är 49 MB och checkas in av nattjobbet varje gång datan ändras.
Nationellt blir varje ögonblicksbild omkring **286 MB**.

`.git` i det här repot är i dag **235 MB** efter 52 datacommits på 25 dagar.
Skalat med sex gånger större ögonblicksbilder blir det i storleksordningen ett par
gigabyte i månaden, alltså över tjugo på ett år, mot GitHubs rekommenderade tak
på 5 GB per repo.

Det här är den gräns som slår först i praktiken, före både filtaket och
byggtiden, och den har ingenting med hosting att göra. Datan ska sluta bo i git
och börja hämtas från Supabase vid byggtid, eller checkas in komprimerad, eller
båda. Det är ett eget beslut och det hör inte hemma i det här dokumentet, men det
ska stå med i rangordningen.

---

## 6. Rekommendationen

**Uppgradera Cloudflare-kontot till Workers Paid, 5 dollar i månaden, och flytta
grindens tal i `astro.config.mjs` från 18 000 och 19 500 till 90 000 och 98 000.
Byt inte värd. Bygg inte hybriden i år.**

Talen är valda så att varningen går vid ungefär kommun nummer 180 och att felet
lämnar 2 000 filers marginal, alltså samma andel av taket som dagens 19 500
lämnar av 20 000. Notera att prognosen för full täckning är 97 413 filer, alltså
inuti varningsområdet och strax under felet. **Grinden kommer att varna under
resten av utbyggnaden, och det är meningen.** Sista tiondelen av landet ska
kopplas in med en människa som tittar på talet.

### Varför

Det är den enda vägen som löser hela problemet utan att röra en rad kod som
levererar en sida. Ingen migration, ingen ny felkälla, inget odokumenterat
`Range`-beteende, ingen omskrivning av datalagret, ingen delad utplacering att
hålla i takt. Filtaket femdubblas och räcker till hela riket. Byggtiden hamnar på
tolv och en halv minut mot ett tak på tjugo, mätt och inte gissat. A0 slutar
blockera A1 till A7 samma dag betalningen går igenom.

Alla andra vägar löser samma problem sämre. Workers Static Assets ger samma tak
mot en riktig migrationskostnad och ett odokumenterat räckviddsbeteende.
Styckningen kräver Workers ändå och offrar det delade sökindexet. Färre filer per
verksamhet är matematiskt omöjligt eftersom en verksamhet redan kostar en fil.
Hybriden är rätt på lång sikt men är inte det ADR 0001 lovade att den skulle
vara, och den behöver inte fattas nu.

### Kostnad

60 dollar om året. Uppgraderingen är ett klick i Cloudflares gränssnitt.
Kodändringen är två konstanter och en kommentar som just nu påstår fel sak.

### Vad som måste byggas om

1. `FILTAK_VARNING` och `FILTAK_FEL` i `site/astro.config.mjs`, plus den
   förklarande kommentaren som i dag säger att 100 000 bara finns hos Workers.
2. En storleksgrind på rutarkivet i `scripts/kartrutegrind.mjs`, fällande vid
   20 MB. §5.1.
3. Sökregistret bort från DYNAMIC innan det passerar ett par megabyte. §5.2.
4. Datan ut ur git innan repot passerar ett par gigabyte. §5.3.

Punkt 1 tar en kvart och gör beslutet. Punkterna 2 till 4 ska göras före kommun
nummer femtio, inte före kommun nummer tvåhundra.

### Vad som INTE ska göras nu

ADR 0001 ska inte rivas. Hybriden är fortfarande rätt slutstation, av skäl som
inte handlar om filtaket: 97 procents fyllnad är ingen plats att stanna på, och
den dag en ny sidtyp kostar en fil per verksamhet är hybriden det enda som
finns. Men ADR 0001 ska rättas på två punkter, båda mätta här: byggtiden är inte
den tvingande gränsen den påstås vara (§3.3), och bytet är inte ett
adaptertillägg utan en ombyggnad av datalagret (§4.3).

---

## 7. Vad som provades skarpt

Beställningen bad om det billigaste steget prövat skarpt. Själva uppgraderingen
rör produktionsuppsättningen och är därför inte gjord; den kräver ägarens hand på
betalningen. Det som gick att pröva utan att ändra något är prövat, och det som
prövades är det känsligaste beroendet.

### 7.1 Rutarkivet svarar fortfarande 206

```
node scripts/kontrollera-rackvidd.mjs
```

```
arkiv         /kartrutor/punkter-fecc471e73b9.bin
hela filen    200
cache         public, max-age=31536000, immutable
typ           application/octet-stream
accept-range  bytes
räckvidd      206, 128 byte
content-range bytes 0-127/3279666
cf-cache      HIT
```

### 7.2 Och det gör det även utan cache, vilket är nytt

Cloudflares dokumentation för Pages säger fortfarande att räckviddsförfrågningar
besvaras med 200 och att arbete pågår med riktiga 206-svar. Mätningen i dag säger
något annat, och därför står den här:

| Förfrågan | Cachestatus | Svar |
|---|---|---|
| `.bin`, `bytes=0-127` | HIT | 206, 128 byte |
| `.bin`, `bytes=0-127`, cachebrytande frågesträng | MISS | 206, 128 byte |
| `.bin`, `bytes=1500000-1500063`, cachebrytande | MISS | 206, rätt `content-range` |
| `.json`, `bytes=0-127`, cachebrytande | DYNAMIC | 200, hela 1 092 084 byte |

Slutsatsen är exakt den `public/_headers` redan drar, och den står sig: **det är
filändelsen som avgör.** `.bin` är cachebar och får då korrekta 206-svar även på
en miss. `.json` är inte cachebar, blir DYNAMIC och får hela filen. Bytet från
`.pmtiles` till `.bin` är alltså fortfarande det som håller kartan vid liv, och
det är inte ett arv från en gammal bugg som kan tas bort.

**En planuppgradering rör ingenting av det här.** Filtaket är en gräns på hur
många tillgångar en utgåva får innehålla, inte på hur de serveras. Samma
tillgångar, samma ändelser, samma kant.

### 7.3 Funktionen lever

`GET https://prikko.se/api/ratta` svarar **405 Method Not Allowed**, alltså är
Pages-funktionen utrullad och routad. Ingen POST skickades, eftersom en POST hade
mejlat redaktionen.

`public/_headers` har sex regelrader mot ett tak på hundra.

### 7.4 Ett fynd som inte var beställt men som blockerar allt

Nattjobbet `uppdatera-data.yml` lyckades senast **2026-08-18**. Det har fallit
varje körning sedan dess. Från och med 2026-08-27 startar det inte alls, och
GitHub svarar att jobbet inte påbörjades för att kontots betalning misslyckats
eller för att utgiftstaket behöver höjas. Samma sak gäller `kontroll.yml`, som
alltså inte har byggt eller testat något på tre dagar: senaste körningarna faller
efter tre till fyra sekunder utan att ha kört ett enda steg.

Två konsekvenser. Färskheten, som docs/11 §6b kallar sajtens skarpaste kant,
står stilla sedan tolv dagar. Och byggrinden som ska fälla ett trasigt bygge är
grön i betydelsen "kördes aldrig".

Det här ska åtgärdas före allt annat i det här dokumentet, eftersom en
kommunexpansion utan nattjobb bara gör tystnaden större.

---

## 8. Osäkerheten

Det här är vad som inte gick att mäta, i fallande ordning av vad det skulle
kunna ändra.

1. **Om filtaket 100 000 gäller per utgåva eller per sajt.** Cloudflare skriver
   "files per site". Om gamla utgåvor räknas in vore slutsatsen en annan. Det
   är osannolikt, eftersom talet 20 000 uppenbart gäller per utgåva i dag, men
   det är inte verifierat och det ska verifieras vid första bygget över 20 000.
2. **Om utgåvans totala storlek har ett tak.** Ingen sådan rad finns i
   dokumentationen för vare sig Pages eller Workers. Elva gigabyte är obeprövat.
3. **Cloudflares byggmaskin är inte mätt.** Kvoten 1,14 är mätt mot GitHubs
   `ubuntu-latest`, inte mot Cloudflares egen löpare. Är Cloudflares dubbelt så
   långsam som GitHubs ligger nationell täckning på 25 minuter mot ett tak på 20,
   och då blir §3.3 fel. Detta är den enskilt svagaste punkten i dokumentet, och
   den går att mäta i morgon: läs den faktiska byggtiden i Pages instrumentpanel
   och jämför med de 156 sekunderna här.
4. **Anläggningstalen i `kommunregister.csv` är myndigheternas egna register**,
   inte vad vi skulle publicera. Vår kvalitetsgrind sållar bort en dryg tiondel i
   Stockholm. Prognoserna är alltså försiktiga, men hur försiktiga vet vi inte
   förrän femte kommunen är inne.
5. **Overheadmodellen bygger på tolv kommuner varav en är stor.** Golv och tak
   ligger 0,5 procent isär vid dagens skala. Den dag Göteborg och Malmö får
   RegSO-områden ska anpassningen räknas om.
6. **Workers Static Assets och `Range`.** Odokumenterat, som §4.2 säger. Vi
   rekommenderar bort den vägen delvis av det skälet, alltså vore det oärligt att
   inte säga att osäkerheten kan peka åt andra hållet: det kan mycket väl fungera
   utmärkt.
7. **Netlifys byggtimeout och byggminuter i den kreditbaserade modellen** gick
   inte att hitta i deras dokumentation. Det påverkar inte slutsatsen, eftersom
   Netlify faller på bandbredden ändå.

---

## 9. Vad som ska rättas i andra dokument

Fyra påståenden i bibeln är motbevisade här och ska rättas där de står, inte bara
här.

| Dokument | Påstående | Rättelse |
|---|---|---|
| `site/astro.config.mjs`, `filtaksgrind()` | 100 000 filer finns hos Workers Static Assets på betald plan | Gäller Pages betalda plan också. Vi behöver inte byta plattform. §4.1 |
| `docs/30_programmatisk_seo.md` §3.1 | "1,035 sidor per verksamhet" | Beskriver dagens totalsumma, inte marginalen. En verksamhet kostar en fil, kommunen kostar 5,56 plus 0,027 per verksamhet. §2.3 |
| `docs/adr/0001` | Bytet är "ett adapter-tillägg plus `prerender = false`" | Datan är 49 MB i dag och 286 MB nationellt mot en Worker på högst 10 MB. Datalagret måste byggas om. §4.3 |
| `docs/adr/0001` | Byggtiden motverkar färskhetsmålet vid tiotusentals sidor | Linjärt men flackt: 290 kommuner går på omkring 12,5 minuter mot ett tak på 20. §3.3 |
| `docs/45` punkt A0 | "Pages tar 20 000 filer och vi ligger på 15 500" | Vi ligger på 17 011 per bygget 2026-08-30, och taket är 20 000 bara på den fria planen. §2.2 |
