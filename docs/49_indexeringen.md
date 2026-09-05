# 49. Indexeringen: hur mycket av sajten Google faktiskt tagit in

**Datum:** 2026-08-31.
**Beställning:** punkt B11 i `45_entreprenorslistan.md`. Vi har byggt 16 766
sidor och aldrig mätt hur många av dem som finns i Google.
**Metod:** stickprov mot Google, sida för sida, med `site:` på exakt URL.
**Utfall:** ungefär en sida av tio är indexerad, och mönstret i vilka som är
det säger mer än talet.

---

## 1. Slutsatsen först

1. **Uppskattningsvis 1 400 av 14 260 sidor är indexerade, alltså omkring
   10 procent.** Talet är vägt per sidtyp, se §3, och det vilar på ett
   stickprov om 28 sidor. Osäkerheten är stor och skrivs ut i §4.
2. **Verksamhetssidorna, som är 13 546 av 16 766, är den svaga länken.**
   1 av 12 slumpvis dragna är indexerad. De två som ligger i Google av dem jag
   sett med egna ögon är AG i Stockholm och Zocalo i Uppsala, alltså namn som
   söks av andra skäl. Indexeringen är selektiv och lutar mot kända namn.
3. **RÄTTAD 2026-08-31: sidindelningen är INTE där genomsökningen dör.**
   Här stod att åtta av nio provade `/sida/N/`-adresser saknas i Google och att
   det pekade ut sidindelningen som defekten. **Det var ett urvalsfel i min
   egen mätning**, och det är utrett i `51_klickdjupet.md`. Sidindelade
   adresser är 407 av sitemapens 14 260, alltså 2,9 procent, men i de skikt
   jag drog ur är de 71 procent av kategorierna, 85 av kommunerna och 42 av
   områdena. Väntat antal sidindelade i ett urval om 28 var därför ungefär 8,
   och observerat blev 9. Talet "åtta av nio saknades" säger alltså ingenting
   om sidindelning, bara att större delen av mitt urval var sidindelat och att
   större delen av mitt urval saknades.

   Beviskedjan pekar dessutom åt andra hållet, och båda leden är mina egna
   mätningar: `/stockholm/sida/83/` ligger på klickdjup 4 och ÄR indexerad,
   medan `/linkoping/forskolan-skogsmyran/` ligger på djup 2 med åtta inlänkar
   och INTE är det.
4. **Kedjesidorna är fyra av fyra.** De är 53 stycken, de har ett eget namn i
   adressen, och de svarar på en fråga ingen annan sida hos oss svarar på.
   Det är mönstret som fungerar.
5. **Sajten är ung.** Första commit i juli 2026, alltså ungefär två månader.
   Tio procent efter två månader är inte ett haveri, men det är ett tal att
   mäta om, och det är ett skäl att inte bygga fler sidor förrän de vi har är
   inne.

**Vad som INTE är fel:** sajten är inte blockerad, robots.txt släpper in
sökmotorer, sitemapen är delad per sidtyp med riktiga `lastmod`, och Google
visar våra sidor med rätt titel och rätt beskrivning på en vanlig `site:`
sökning. Grunden är på plats. Det som saknas är genomsökningsdjup.

---

## 2. Metoden, och vad den är värd

Google visar sedan en tid inget totaltal för en `site:` sökning, så talet går
inte att läsa av. I stället drogs ett skiktat slumpurval ur sitemapen, med
`awk` och fast frö så att urvalet går att göra om, och varje URL slogs upp en
och en med `site:<exakt url>`. En sida räknas som indexerad när Google svarar
med en träff och inte med "did not match any documents".

Metodens svaghet: `site:` är inte samma index som det som visas för en riktig
sökning, och Google svarar ibland tomt på en sida som ändå kan dyka upp för en
fråga. Talet ska därför läsas som ett golv, inte som ett facit.

**Det riktiga svaret finns i Search Console** och det kräver ägarens
inloggning. Den här mätningen är vad som går att göra utan den, och den bör
ersättas så fort kontot är kopplat.

---

## 3. Mätningen, sidtyp för sidtyp

| Sidtyp | Sidor totalt | Provade | Indexerade | Andel |
|---|---:|---:|---:|---:|
| Verksamheter | 13 546 | 12 | 1 | 8 % |
| Kategorier | 256 | 4 | 1 | 25 % |
| Områden | 148 | 4 | 2 | 50 % |
| Kommuner | 192 | 4 | 1 | 25 % |
| Kedjor | 53 | 4 | 4 | 100 % |
| **Summa** | **14 195** | **28** | **9** | |

Vägt med sidtypernas verkliga storlek blir uppskattningen **1 363 sidor**,
alltså 9,6 procent. Artiklar, rapporter, topplistor, kartor, utmärkelser och
startsidan är inte provade och utgör tillsammans 55 sidor.

### Vad som var indexerat

- `/kedja/taco-bar/`, `/kedja/city-gross/`, `/kedja/joe-and-the-juice/`,
  `/kedja/naked-juicebar/`
- `/stockholm/omrade/vasastaden/butiker/`
- `/stockholm/omrade/hagerstensasen/`
- `/stockholm/kategori/skolor-och-omsorg/sida/14/`
- `/stockholm/sida/83/`
- `/stockholm/the-wine-team-global-ab-underobjekt/`

### Vad som saknades

Elva av tolv verksamheter, bland dem Kullagrill i Höganäs, Pressbyrån
Väghustorget i Örebro, Meze Store i Hötorgshallen, Bitza Hornstull,
Köttkompaniet, Förskolan Skogsmyran och Tonari Ramen. Samtliga har egna sidor
med kontrollhistorik.

Och åtta av nio sidindelade adresser, oavsett sidtyp.

---

## 4. Osäkerheten, utskriven

Tolv dragningar på verksamhetssidorna ger ett brett intervall. Med ett
Wilson-intervall ligger den sanna andelen någonstans mellan ungefär 1,5 och
35 procent, alltså mellan 200 och 4 700 sidor. Punktskattningen 8 procent är
mitt bästa svar, inte ett säkert svar.

Det som ändå står stadigt är **mönstret**, eftersom det upprepas över sidtyper
och inte hänger på en enda dragning: kedjesidorna är inne, sidindelade adresser
är ute, och verksamhetssidorna är övervägande ute.

---

## 5. Vad som följer av det

**Bygg inte fler sidor förrän de vi har är inne.** Det talar direkt emot att
prioritera nya sidtyper, och det gäller även de 5 076 verksamheter Göteborg
skulle kunna ge. Se `45_entreprenorslistan.md` avsnitt 6.2, där slutsatsen om
Göteborg redan lutar åt att läsa in dem utan egna sidor.

**Sidindelningen är INTE defekten, och navigationen är inte heller det.**
Det stod här, och det är mätt bort samma dag i `51_klickdjupet.md`. Länkgrafen
byggd ur den renderade HTML:en ger klickdjup med median 3 och max 5, noll
onåbara indexerbara sidor, och medianen 8 inlänkar per verksamhetssida. Bara
165 av 13 546 har en enda inlänk. Vi har dessutom MER intern länkning än
förlagorna: en verksamhetssida hos oss länkar omkring 33 andra, medan
hitta.se och booli.se länkar noll från en företagssida och allabolag.se en.

Det som återstår som förklaring är innehållet och åldern. **61 procent av
brödtexten på en verksamhetssida står ordagrant på minst nio av tio andra**,
och verksamheterna har lägst andel eget innehåll av alla åtta sidtyper, 20,7
procent mot kedjornas 43,6. Domänen är två månader gammal och har inga
inlänkar utifrån.

**Kedjesidorna visar vad som fungerar**, och nu vet vi varför: de har mest
eget innehåll av alla sidtyper. Det är argumentet för att bygga kedjeregistret
nationellt, punkt A10.

**Och en konkret defekt hittades ändå.** `prikko.pages.dev` svarar 200 och
serverar hela sajten med `Allow: /` och utan noindex, alltså erbjuds Google
28 520 adresser i stället för 14 260. Sidorna bär rätt `canonical` mot
prikko.se, vilket är den vanliga dämpningen och gör att skadan sannolikt är
begränsad, men en kanonisk länk är en signal och inte en spärr, och
genomsökningen kostar lika mycket oavsett. Adressen ska släckas, och det
kräver Cloudflares kontrollpanel.

**Search Console först.** Allt ovan är en uppskattning som kan ersättas med
ett facit den dag ägaren kopplar kontot. Det är den billigaste punkten på hela
listan och den ligger på honom.

---

## 6. Andra mätningen, 2026-09-05: anmälan till sökmotorerna

**Datum:** 2026-09-05, fem dagar efter §1 till §5.
**Beställning:** anmäl sajten till sökmotorerna, ta bort varje onödigt hinder
för genomsökning, och skapa ett mätvärde att följa.
**Utfall:** IndexNow är byggt och slutpunkten svarade 202. Sökkanalen är
omogen och inte trasig. Ingen av de sex kandidaterna till genomsökningshinder
överlevde mätningen, och den enda defekt som står kvar är samma
`prikko.pages.dev` som stod här den 31 augusti.

### 6.1 Tonen ändras, och det är ett tal som ändrar den

`59_gtm.md` §8 rättade en uppgift som står fel i §1.5 ovan. **Domänen skapades
2026-08-03 och är 33 dagar gammal, inte två månader.** Ahrefs analys av 1,3
miljoner sökord ger att 1,74 procent av nypublicerade sidor når topp tio inom
ett år och att 72,9 procent av sidorna i topp tio är äldre än tre år.

Att ungefär en sida av tio ligger inne efter 33 dagar är alltså ungefär vad en
ny domän gör. **Uppdraget är därför inte att rädda något.** Det är att ta bort
onödiga hinder, sluta slösa, och skaffa ett tal att jämföra mot om två veckor.

### 6.2 Google går inte att mäta automatiskt, och spärren ska inte kringgås

Ett anrop gjordes, och det räckte. `https://www.google.com/search?q=site:prikko.se`
med en vanlig webbläsarsträng svarade 200 med 45 918 byte som inte innehåller
ett enda sökresultat, utan en omdirigeringssida med texten "Klicka här om du
inte omdirigeras inom några sekunder".

Det är Googles spärr mot automatiserade sökningar. **Den kringgås inte**, och
mätningen i §2, som gjordes en adress i taget för hand, är därför fortfarande
den enda Google-siffra vi har. Talet i §1.1 står kvar oförändrat: omkring
1 400 av 14 260, mätt 2026-08-31.

### 6.3 Bing går inte heller att mäta utifrån, och kontrollen visar att det inte är oss

Bing var det som skulle mätas separat, eftersom IndexNow riktar sig dit. Fyra
vägar prövades och alla fyra föll:

| Väg | Utfall |
|---|---|
| `bing.com/search?q=site:...` som webbläsare | 200, men träffarna är tyska restauranger i Leipzig och har ingenting med frågan att göra |
| `bing.com/search?...&format=rss` | 200 och giltig RSS, men samma orelaterade träffar |
| `url:`-operatorn i stället för `site:` | samma |
| Med kakburk, `Referer` och fullständiga webbläsarhuvuden | 200, noll organiska träffar i markeringen |

**Kontrollen är det som avgör att felet inte ligger hos oss.** Samma anrop med
`site:hitta.se` gav tio träffar, varav noll på hitta.se: YouTube-kanaler,
Instagram och Facebook på turkiska. `site:booli.se` gav nio träffar, varav noll
på booli.se. **En sökmotor som inte hittar hitta.se på `site:hitta.se` mäter
inte index, den skickar ut något annat.** Bings publika slutpunkt är alltså
oanvändbar för den här frågan, oavsett domän.

DuckDuckGo, som kör på Bings index, svarade med en CAPTCHA. Den löstes inte.
Mojeek svarade 403.

**Följden är att det inte finns någon ny indexeringssiffra i det här
avsnittet.** Det talet kräver antingen en människa som slår upp adresserna en
i taget, eller ett verktygskonto. Båda vägarna står i §8.

### 6.4 Urvalet ligger färdigt, och skiktningen är rättad

`51_klickdjupet.md` §6.1 visade att urvalet den 31 augusti drog sidindelade
adresser till en tredjedel fast de är 2,6 procent av sajten. Det är rättat.
Urvalet dras ur de elva sitemapfilerna med `random.seed(20260905)`, alltså går
det att göra om exakt:

| Skikt | Sidor i sitemapen | Dragna |
|---|---:|---:|
| Verksamheter | 15 402 | 30 |
| Kommuner | 208 | 8 |
| Kategorier | 257 | 6 |
| Områden | 151 | 6 |
| Kedjor | 54 | 4 |
| Artiklar | 25 | 2 |
| Toppsidor | 13 | 2 |
| Topplistor, kartor, rapporter, utmärkelser | 30 | 4 |
| **Summa** | **16 140** | **62** |

62 adresser mot 28, alltså mer än dubbelt så många, och varje skikt får
tillräckligt många dragningar för att säga något eget.

**Sidindelade adresser blir 15 av 62, alltså 24 procent, mot 9 av 28 den 31
augusti, alltså 32 procent.** Lägre än så går det inte att komma, och det är
värt att säga rakt ut: 85 procent av kommunskiktet och 71 procent av
kategoriskiktet ÄR sidindelade sidor, så ett urval som speglar de skikten
kommer att bära dem. Rättningen är därför inte att andelen sjunkit åtta
procentenheter. **Rättningen är att vikterna står utskrivna i tabellen ovan**,
så att en skiktvis andel kan räknas upp mot rätt nämnare i stället för att
läsas rakt av som ett tal om hela sajten. Det var precis det felet
`51_klickdjupet.md` §6.1 fällde.

Metoden att köra om den, när det finns ett verktyg som svarar:

1. Hämta de elva `sitemap-*-0.xml` med en egen user-agent, se §6.5 rad 6.
2. Dra urvalet med kvoterna ovan och fröet 20260905.
3. Slå upp varje adress med `site:<exakt url>`, en i taget.
4. Räkna andelen per skikt och väg upp med kolumnen "Sidor i sitemapen".

### 6.5 Vad som faktiskt kan hindra genomsökning

Sex kandidater, var och en avfärdad med tal och inte med resonemang. Allt mätt
mot `https://prikko.se` den 2026-09-05.

**1. Sitemapfilerna är för stora.** Nej, med god marginal på båda måtten.

| Mått | Vår största fil | Standardens tak | Andel |
|---|---:|---:|---:|
| Adresser i `sitemap-verksamheter-0.xml` | 15 402 | 50 000 | 31 % |
| Byte, okomprimerat | 1 723 467 | 52 428 800 | 3,3 % |
| Byte över tråden, gzip | 177 073 | | |

Hela sitemapen är 16 140 adresser i elva filer, och den näst största filen är
32 286 byte. Indexfilen räknar upp elva filer, samtliga svarar 200, och samtliga
adresser i dem börjar med `https://prikko.se`. **Sitemapindexet pekar inte
fel.**

**2. `lastmod` ljuger.** Delvis sant, och det rör 0,7 procent av sajten.

725 av 16 140 adresser, alltså 4,5 procent, ärver sitt `lastmod` från
`source.fetchedAt`, och det datumet flyttas fram av själva hämtningen. Mätt över
de fyra nätterna 1 till 5 september, med kommunernas datafiler jämförda rad för
rad ur git:

| Natt | Kommuner med nytt `fetchedAt` | varav utan en enda ändrad rad |
|---|---:|---:|
| 09-01 → 09-02 | 10 | 3 |
| 09-02 → 09-03 | 9 | 4 |
| 09-03 → 09-04 | 10 | 5 |
| 09-04 → 09-05 | 10 | 7 |
| **Summa** | **39** | **19, alltså 49 procent** |

De åtta kommuner som minst en av de fyra nätterna flyttade sitt datum utan att
ändra en rad är Borgholm, Kristinehamn, Svenljunga, Höganäs, Oskarshamn, Lomma,
Karlstad och Uppsala, och deras sidor är tillsammans **115 adresser, alltså 0,7
procent av sitemapen**. Verksamhetssidorna, som är 95
procent av beståndet, bär sitt eget kontrolldatum och ljuger inte.

Talet är för litet för att förklara något om indexeringen, men det är stort nog
att styra IndexNow: §7 anmäler aldrig en kommunsida bara för att hämtningen
rörde sig.

**Två adresser saknar `lastmod` fast de borde ha ett.** `/karta/` och
`/nytt-och-borta/` är räknade sidor av samma slag som `/rapporter/` och
`/kallor/`, alltså sidor vars varje tal räknas fram ur beståndet vid bygget,
men de saknas i `lastmodIndex()` i `site/astro.config.mjs`. De nio övriga utan
datum är skrivna sidor, och där är tomrummet rätt. Två av 16 140 är för litet
för att åtgärda mitt i en annan ändring, och det står här för att inte glömmas
bort.

**3. Sidorna är långsamma.** Nej.

Tolv adresser, en per sidtyp, hämtade med Googlebots user-agent och brotli:

| Mått | Utfall |
|---|---|
| Svarstid, tolv sidor | 0,14 till 0,40 sekunder |
| Storlek över tråden | 13 079 till 46 897 byte |
| Statuskoder | 200 på tolv av tolv |

Det stämmer med `51_klickdjupet.md` §8.5, som mätte 120 millisekunder och 24
kilobyte. Google definierar dessutom själv att genomsökningsbudget börjar
gälla över en miljon sidor.

**4. `noindex` ligger på något som borde indexeras.** Nej, och det är en grind
och inte en förhoppning.

`sitemapGuard` i `site/astro.config.mjs` fäller bygget om en enda sida är både
`noindex` och med i sitemapen, och den läser samtliga `sitemap-*.xml` efter att
de skrivits. Bygget 2026-09-05 gick igenom. Kvalitetsgrinden `isIndexable()`
håller 1 744 verksamheter av 17 146 utanför, och `51_klickdjupet.md` §9.6 har
redan tagit ställning: de bär `noindex` för att de saknar bedömning eller
kontroll, alltså för att sidan inte har något att säga.

**5. Robotarna släpps inte in.** Nej. Fem crawlerssträngar prövade mot både en
verksamhetssida och den största sitemapfilen:

| User-agent | Sida | Sitemap |
|---|---|---|
| Googlebot | 200 | 200 |
| bingbot | 200 | 200 |
| YandexBot | 200 | 200 |
| SeznamBot | 200 | 200 |
| OAI-SearchBot | 200 | 200 |

Den utlämnade `robots.txt`, alltså med Cloudflares hanterade block inräknat,
blockerar nio robotar helt: Amazonbot, Applebot-Extended, Bytespider, CCBot,
ClaudeBot, CloudflareBrowserRenderingCrawler, GPTBot, Google-Extended och
meta-externalagent. **Ingen sökrobot står i listan.** Amazon är visserligen
deltagare i IndexNow, alltså anmäler vi till en motor vars robot vi samtidigt
stänger ute, men Amazons sök är ingen kanal för oss och inkonsekvensen kostar
ingenting.

**6. En detalj som bet, och som hade blivit ett tyst fel.** Cloudflare svarar
**403 på `Python-urllib/3.12`**, alltså på den user-agent som `urllib` sätter
när ingen anges. Samma adress, `https://prikko.se/sitemap-start-0.xml`, svarar
200 med en egen sträng och 403 utan. `curl/8.4.0` släpps in. Det drabbar inga
sökmotorer, men det hade fått IndexNow-jobbet i §7 att vänta förgäves på en
utrullning varje natt utan att säga varför. Skriptet sätter därför en egen
user-agent, och skälet står i koden.

**Kvar står en defekt, och den är samma som den 31 augusti.**
`https://prikko.pages.dev/` svarade **200 med 1 034 283 byte** när det mättes
2026-09-05, och dess `robots.txt` säger `Allow: /`. Google erbjuds alltså
32 280 adresser i stället för 16 140. Den enda ljusningen sedan sist är att
pages.dev-kopians `robots.txt` pekar på `Sitemap: https://prikko.se/sitemap-index.xml`,
alltså på rätt domän. **Åtgärden ligger i Cloudflares kontrollpanel och på
ägaren**, och den står som steg 2 i §8.

### 6.6 Delningsbilden skapar inga adresser att genomsöka

Sedan 2026-09-05 bär varje sida en egen förhandsvisningsbild via
`site/functions/dela/`, och taggen står på 17 868 sidor. Frågan var om rutten
skapar adresser som en sökmotor försöker genomsöka som sidor.

**Nej, mätt på fyra sätt.**

| Kontroll | Utfall |
|---|---|
| `/dela/` i XML-sitemapen | 0 av 16 140 adresser |
| `<a href="/dela/...">` i renderad HTML, tre sidtyper | 0, 0 och 0 |
| `/dela/` i `llms.txt` | 0 |
| Vad rutten svarar | `/dela/stockholm/tonari-ramen.png` → 200 `image/png`. `/dela/stockholm/tonari-ramen/`, `/dela/` och `/dela/finns-inte.png` → **302 till `/og-default.png`** |

Adressen finns alltså bara som `og:image` och aldrig som en länk, och rutten
svarar aldrig 200 på något som ser ut som en sida. Den mjuka 404 som
`51_klickdjupet.md` §7.1 hittade hos Booli har vi inte här heller.

**`/dela/` ska INTE läggas i `robots.txt`,** och det är värt att skriva ut
eftersom det ser ut som rätt åtgärd. Facebooks, Slacks och LinkedIns crawlers
läser `robots.txt` innan de hämtar `og:image`. En `Disallow: /dela/` hade
alltså tagit bort förhandsvisningen från varje delad länk, alltså släckt hela
den funktion som just byggts, för att spara genomsökning vi inte vet att vi
betalar.

Skulle Search Consoles genomsökningsstatistik längre fram visa att `/dela/`
äter budget är rättningen ett `X-Robots-Tag: noindex` i ruttens egen
`Response`, och inte i `site/public/_headers`: den filen rör inte Pages
Functions, vilket står i dess eget huvud. Bilderna cachas i dag på kanten,
`cf-cache-status: HIT` med `max-age=86400`, så en robot som hämtar samma kort
två gånger kostar ingenting den andra gången.

---

## 7. Vad som byggdes: IndexNow

Protokollet tar emot en lista med adresser som ändrats, och en anmälan till en
slutpunkt delas till samtliga deltagare: Bing, Yandex, Seznam, Naver, Yep och
Amazon. Det kostar ingenting och verkar på timmar. **Google deltar inte**, så
ingenting i det här avsnittet påverkar talet i §1.1 åt något håll.

### 7.1 Anmälan togs emot

Ett skarpt anrop gjordes 2026-09-05 kl. 16:32:35 UTC med startsidan som enda
adress:

```
POST https://api.indexnow.org/indexnow
{"host":"prikko.se","key":"...","keyLocation":"https://prikko.se/<nyckel>.txt",
 "urlList":["https://prikko.se/"]}

HTTP/2 202
x-msedge-ref: Ref A: 05BE122871E74B3593C210F3DBFC867F ...
```

**202 betyder "Accepted, IndexNow key validation pending".** Slutpunkten har
alltså tagit emot anmälan och lagt den i kö för nyckelkontrollen. Att svaret
kommer från `x-msedge-ref` är väntat: `api.indexnow.org` drivs av Microsoft.

**Nyckelkontrollen kommer att falla tills koden är utlagd**, eftersom
`https://prikko.se/<nyckel>.txt` svarade 404 när anropet gjordes. Det är rätt
ordning och inte ett fel: 202 bevisar att formatet, värden och adresslistan
godtas, och nyckelfilen följer med första utrullningen efter att den här
grenen är inne. Kontrollen efteråt är ett kommando:

```
curl -sI https://prikko.se/<nyckel>.txt        # ska ge 200 text/plain
```

### 7.2 Nyckelfilen

`site/public/<nyckel>.txt`, en fil vars namn är nyckeln och vars innehåll är
samma sträng. Nyckeln är 32 hexadecimala tecken.

**Specifikationen säger två saker på samma rad**, och nyckeln är vald för att
ligga inom båda: den räknar upp `a-z`, `A-Z`, `0-9` och bindestreck, och kallar
samtidigt längden "8 till 128 hexadecimala tecken".

Innehållstypen behöver ingen regel i `site/public/_headers`, och det är mätt
och inte antaget. `prikko.se/llms.txt` och `prikko.se/robots.txt` svarade båda
`text/plain; charset=utf-8` med `x-content-type-options: nosniff` samma dag.
**Beviskraften ligger i att de två är statiska filer i drift.** De skrivs av
Astro-rutter som sätter sin egen `Content-Type`, men i ett statiskt bygge
skrivs bara kroppen till en fil och huvudena kastas, vilket är hela ärendet i
huvudet på `site/public/_headers`. Typen kommer alltså från att Cloudflare
Pages mappar filändelsen `.txt`, och nyckelfilen får samma behandling.

Att nyckeln ligger publikt i repot är protokollets egen konstruktion. Den
bevisar bara att den som anmäler råder över domänen, den skyddar ingenting, och
att lägga den i GitHubs hemligheter hade varit att låtsas att den är något den
inte är.

### 7.3 Vad som anmäls, och varför inte allt

`pipeline/indexnow.py`, två kommandon och inget nätverksberoende utöver
slutpunkten och vår egen sitemap.

Att anmäla alla 16 140 adresser varje natt är tekniskt tillåtet och praktiskt
taget spam. Protokollets FAQ säger ordagrant "avoid submitting the same URL
many times a day unless there are meaningful content changes", och 429 är
svaret man får när man ändå gör det.

Anmälan bygger därför på samma datum som sitemapens `lastmod` bygger på:

| Vad | Regel |
|---|---|
| Verksamhetssida | `inspections[0].date` har ändrats, alltså exakt det `latestInspectionDate()` skriver till sitemapen |
| Ny verksamhet | adressen fanns inte i gårdagens ögonblicksbild |
| Borttagen | adressen finns inte längre, och anmäls just därför |
| Kommunens ingångar | hubben, anmärkningssidan och nytt-och-borta, **bara för de kommuner där något av ovanstående hände** |
| Allt annat | anmäls inte |

Sidindelningen, kategorierna och områdena står med flit utanför. De ärver
kommunens `lastmod`, de är omkring 600 adresser, och de skulle dominera varje
natts anmälan utan att en enda av dem behöver hämtas om: en ny verksamhet i
Stockholm ändrar en av 85 sidindelade sidor, inte alla 85.

**Grinden mot sitemapen är det som gör listan sann.** Före anmälan hämtas den
utrullade sitemapen och varje adress som inte ligger där stryks, utom de
borttagna. Grinden fann direkt ett fel i den första versionen:
`/[kommun]/nytt-och-borta/` byggs bara över `MIN_MOVEMENT_PAGE = 12`, och **tio
av tretton kommuner svarar 404** på den adressen. Utan grinden hade jobbet
anmält upp till tio döda adresser varje natt.

Grinden gör samtidigt att `isIndexable()` inte behöver skrivas om i Python:
ligger sidan inte i sitemapen anmäls den inte, och en sida som inte förtjänar
att indexeras kan alltså inte hamna i en anmälan.

**Provkörning mot natten 4 till 5 september**, alltså mot riktig data ur git:

| Steg | Utfall |
|---|---:|
| Adresser framräknade | 81 |
| varav strukna av sitemapgrinden | 1, `/linkoping/nytt-och-borta/` |
| Anmälda | 80, varav 8 borttagna |
| Av de 80: svarar 200 i drift | 72 |
| Av de 80: svarar 404 i drift | 8, exakt de åtta borttagna |

De framräknade talen stämmer dessutom mot en oberoende räkning av samma
commit-par: 14 nya, 8 borta och 50 med ny kontroll, fördelade på Stockholm,
Jönköping och Linköping.

**Spärren.** Fler än 2 000 adresser på en natt fäller steget i stället för att
anmälas. En natt då tolv procent av sajten påstås ha ändrats är nästan alltid
en trasig hämtning eller ett fältbyte i källan, och en anmälan går inte att ta
tillbaka.

### 7.4 Var det ligger i nattjobbet

Två steg i `.github/workflows/uppdatera-data.yml`, jobbet `ladda`, och
ordningen är inte valfri.

1. **`indexnow.py andrade` ligger FÖRE commiten**, av samma skäl som notissteget
   och `rorelse.py registrera`: det jämför arbetskopian med HEAD. Efter commiten
   är de två samma sak och listan blir tom varje natt, tyst.
2. **`indexnow.py anmal` ligger EFTER commiten**, och väntar tills
   `sitemap-start-0.xml` på prikko.se bär nattens datum. En anmälan säger "hämta
   den här adressen nu", och Cloudflare Pages har inte byggt den nya commiten
   när pushen går igenom. Anmäls adresserna för tidigt hämtar roboten gårdagens
   sida, och för en ny verksamhet en 404.

Väntan är satt till 25 minuter, och därför är `ladda`-jobbets `timeout-minutes`
höjd från 30 till 60. **De två talen hänger ihop och får inte ändras var för
sig:** med den gamla gränsen hade jobbet dött mitt i väntan i stället för att
låta steget falla mjukt och skriva varför.

Båda stegen bär `continue-on-error`, av samma skäl som notissteget: datan är
produkten, anmälan är en tjänst ovanpå. Anmälningssteget ligger dessutom före
frysgrinden, som avslutar jobbet med `exit 1`, så att en kommun som frös inte
hindrar att de tolv friska anmäls.

**Ingen hemlighet tillkommer.** Steget läser ingen nyckel ur GitHub och kan
inte skicka något annat än adresser på vår egen domän.

### 7.5 Verifierat i ett riktigt bygge

Byggt 2026-09-05 med `npm run build -- --outDir dist-index` i en egen worktree,
på samma commit som ligger i drift. **17 892 sidor på 4 minuter och 42 sekunder,
och samtliga byggrindar passerade.**

| Kontroll | Utfall |
|---|---|
| `sitemapGuard` | **16 140 URL:er i sitemapen, ingen motsäger sin egen noindex.** Webbkartan länkar 212 av dem, och ingen av dem saknas |
| Sitemapens gruppering | artiklar 25, basta 5, kartor 11, kategorier 257, kedjor 54, kommuner 208, omraden 151, rapporter 8, start 13, utmarkelser 6, verksamheter 15 402 |
| Restgruppen `sitemap-pages-*.xml` | finns inte, alltså föll ingen adress utanför sina grupper |
| `/dela/` i någon sitemapfil | 0 |
| Nyckelfilen | ligger i utgåvans rot som `<nyckel>.txt` och innehåller nyckeln |
| `kartrutegrind` och `nesting-guard` | passerade, alltså rörde ändringen varken kartans rutarkiv eller stilarken |
| Filtaket | **18 173 filer**, alltså en fil mer än före ändringen, och 79 827 kvar till taket |

Talet 16 140 är exakt det som ligger ute på prikko.se, alltså har ändringen
inte flyttat en enda adress. Den enda skillnaden i utgåvan är nyckelfilen.

---

## 8. Tre steg för ägaren

Allt annat i det här dokumentet går att göra utan honom. De här tre gör det
inte, och det första är det enda som kan ersätta hela §1 med ett facit.

### Steg 1: läs "Crawled" mot "Discovered" i Search Console. Fem minuter.

Search Console är kopplat, alltså finns talet redan och är bara inte avläst.
**Skillnaden mellan de två raderna avgör om vi ska vänta eller bygga**, och
ingen mätning utifrån kan svara på det.

1. Gå till `search.google.com/search-console`, välj egendomen `prikko.se`, och
   klicka **Sidor** i vänsterspalten, under rubriken Indexering.
2. Sidan visar två tal överst, "Indexerade" och "Inte indexerade". Klicka på
   **Inte indexerade**. Under den ligger en tabell med rubriken "Varför sidor
   inte indexeras", sorterad på antal.
3. Läs av de två raderna **"Genomsökt – för närvarande inte indexerad"** och
   **"Upptäckt – för närvarande inte indexerad"**. Skriv ned båda talen och
   dagens datum.

**Vad talen betyder, och det är hela poängen med steget:**

- **Ligger tyngdpunkten på "Upptäckt"** känner Google till adresserna men har
  inte hämtat dem. Det är genomsökningstakt, alltså domänens ålder, och då är
  svaret att vänta och att inte bygga om innehållet. Då är också
  `prikko.pages.dev` dyrare än den ser ut, eftersom den dubblar kön.
- **Ligger tyngdpunkten på "Genomsökt"** har Google hämtat sidorna och valt
  bort dem. Det är ett kvalitetsbeslut, inte en kö, och då väntar vi förgäves.
  Först då är åtgärden i `51_klickdjupet.md` §9.4 värd sina två veckor.

Samma sida har en flik per sitemapfil, vilket är hela skälet till att sitemapen
är delad i elva: `verksamheter` mot `kedjor` skiljer "svansen väntar" från
"ingenting går in".

### Steg 2: släck `prikko.pages.dev`. Cirka tio minuter.

Fyndet är från 3 augusti, `14_seo_efter_lansering.md` fynd B, och adressen
svarade fortfarande 200 med `Allow: /` den 5 september. Det är 33 dagar, alltså
domänens hela livslängd.

1. Gå till `dash.cloudflare.com`, välj kontot, och öppna **Workers & Pages**,
   projektet **prikko**.
2. Öppna fliken **Custom domains** och kontrollera att `prikko.se` ligger där.
   Den ska vara kvar, och det är den som är sajten.
3. Gå till **Settings**, avsnittet **Access policy** eller **Deployment
   protection** beroende på gränssnittets version, och sätt en policy som
   täcker produktionsadressen `prikko.pages.dev`, inte bara
   förhandsvisningarna. Efter det kräver adressen inloggning i stället för att
   servera sajten.

**En omdirigeringsregel duger inte**, och det är värt att veta innan tio
minuter läggs på fel meny. `prikko.pages.dev` ligger inte i vår zon utan i
Cloudflares egen, så en Redirect Rule på zonen `prikko.se` rör den aldrig.
`51_klickdjupet.md` §9.1 skrev "en Cloudflare-inställning eller en
omdirigering", och det är bara den första halvan som gäller. Den andra vägen
som faktiskt fungerar är ett `_middleware` i Pages som läser `Host` och
301:ar, alltså kod, och det är dyrare än en inställning.

Kontrollen efteråt är ett kommando, och det ska ge något annat än 200:

```
curl -sI https://prikko.pages.dev/ | head -1
```

### Steg 3: koppla Bing Webmaster Tools. Cirka fem minuter, och det är IndexNows mätare.

§6.3 visar att Bing inte går att mäta utifrån. Bings eget verktyg mäter det
direkt, det är gratis, och det är den enda plats där IndexNow-anmälningarna
syns som ett tal.

1. Gå till `bing.com/webmasters`, logga in, och välj **Import your sites from
   Google Search Console**. Det gör hela verifieringen i två klick, eftersom
   Search Console redan är kopplat.
2. Öppna **IndexNow** i vänsterspalten. Där står hur många adresser som
   anmälts, hur många som godtagits, och om nyckelfilen hittats. **Det är
   kvittot på att `pipeline/indexnow.py` fungerar i drift**, och det som ska
   läsas två veckor efter första nattkörningen.
3. Öppna **Site Explorer**. Den listar vilka adresser Bing har, mapp för mapp,
   alltså precis det tal §6.3 inte kunde mäta. Skriv ned talet för
   `/stockholm/` och för hela domänen, och läs av samma två tal om två veckor.

**Det talet är utgångsvärdet.** Utan det går IndexNows effekt inte att skilja
från vad domänen ändå hade gjort på fjorton dagar.
