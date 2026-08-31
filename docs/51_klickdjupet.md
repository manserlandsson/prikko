# 51. Klickdjupet: hypotesen som föll när den mättes

**Datum:** 2026-08-31.
**Beställning:** `docs/49_indexeringen.md` §5 pekade ut sidindelningen som den
konkreta defekten och klickdjupet som orsaken till att Google inte når
verksamhetssidorna. Uppdraget var att pröva den hypotesen, inte att anta den.
**Metod:** en länkgraf byggd ur den byggda sajten, `site/dist`, med enbart
`<a href>` i renderad HTML. Sitemapen ingår inte. Bygget är daterat 2026-08-28
och innehåller 16 767 HTML-sidor och 13 546 verksamheter i sitemapen, alltså
exakt den sajt som mättes mot Google i dokument 49.
**Utfall:** hypotesen är fel. Klickdjupet är inte problemet, inlänkarna är inte
problemet, och sidindelningen är byggd precis som Google rekommenderar 2026.
Fyndet i dokument 49 om sidindelade adresser är ett urvalsartefakt.

Varje tal nedan har sin mätning skriven bredvid sig. Det som är en uppskattning
heter uppskattning, och §11 samlar allt som inte gick att mäta.

---

## 1. Slutsatsen först

Åtta slutsatser, i fallande ordning av vad de betyder.

1. **Klickdjupet är inte problemet. Varje verksamhetssida nås på högst fem
   klick från startsidan, medianen är tre, och 88 procent ligger på tre klick
   eller mindre.** Ingen enda indexerbar sida är onåbar. §3.
2. **Inlänkarna är inte problemet. Medianverksamheten har åtta inlänkar från
   andra sidor på sajten**, och bara 165 sidor av 13 546 har en enda. Bilden av
   en sida som "bara nås genom en paginerad listsida" stämmer på 922 sidor,
   alltså 6,8 procent, inte på svansen. §4.
3. **Fyndet "åtta av nio sidindelade adresser saknades" är ett urvalsartefakt
   och inte ett fynd om sidindelning.** Sidindelade adresser är 407 av
   sitemapens 14 260 URL:er, alltså 2,9 procent. Det skiktade urvalet i
   dokument 49 drog fyra vardera ur kategorier, kommuner och områden, och i de
   tre skikten är 71, 85 respektive 42 procent av sidorna sidindelade. Nio
   sidindelade träffar av 28 var alltså det väntade utfallet av urvalsmetoden.
   Även om varenda sidindelad sida saknades i Google skulle det förklara 2,9
   procent av de nittio procent som fattas. §6.
4. **Beviskedjan pekar åt motsatt håll.** De två sidindelade adresser som
   dokument 49 fann i Google, `/stockholm/sida/83/` och
   `/stockholm/kategori/skolor-och-omsorg/sida/14/`, ligger på klickdjup 4
   respektive 3 och har fyra inlänkar var. De sju namngivna verksamheter som
   saknades ligger på djup 2 till 4 och har mellan en och åtta inlänkar. **De
   djupaste och sämst länkade sidorna i stickprovet var de som var
   indexerade.** §6.2.
5. **Det som återstår som förklaring är innehållet och domänens ålder.** 61
   procent av den synliga brödtexten på en verksamhetssida står ordagrant på
   minst nio av tio andra verksamhetssidor. Två slumpade verksamhetssidor delar
   62 procent av sina åttaordssekvenser. Verksamheterna har minst eget
   innehåll av alla åtta sidtyper och lägst indexeringsgrad, 20,7 procent unikt
   och en av tolv. Kedjorna, som var fyra av fyra, har dubbelt så hög andel
   eget innehåll. Det är det enda mönster i materialet som håller, och det är
   ett mönster och inte ett samband. §8.
6. **En sak är faktiskt trasig, och den kostar nästan ingenting att laga.**
   `prikko.pages.dev` serverar fortfarande hela sajten med HTTP 200, egen
   robots.txt som säger `Allow: /` och utan noindex. Fyndet är fynd B i
   `docs/14_seo_efter_lansering.md` från 3 augusti och det ligger kvar 28 dagar
   senare. Kanoniska taggen pekar rätt, så skadan är begränsad, men Google
   erbjuds 14 260 extra adresser att genomsöka på en sajt vars problem
   möjligen är genomsökningstakt. §9.1.
7. **Ingen av de tre förlagorna gör det beställningen föreslog att vi skulle
   bygga.** Hitta.se länkar noll andra företagssidor från en företagssida,
   booli.se noll andra objekt, och allabolag.se en, som går till moderbolaget.
   Vi länkar cirka 33. **Vi har den tätaste interna länkstrukturen av alla
   fyra.** Hitta.se har bokstavsregistret, men det renderas med JavaScript, och
   deras djupaste listsida ligger 228 klick från startsidan. Det som bär dem är
   en XML-sitemap med cirka 1,5 miljoner adresser. §7.
8. **Rekommendationen är att inte bygga navigation.** Det finns ingen
   navigationsdefekt att laga. Att lägga till bokstavsregister, en större
   webbkarta eller mer korslänkning vore att bygga en lösning på ett problem
   som mätningen säger inte finns, och varje sådan sida skulle dessutom vara en
   ren navigationssida, vilket ägarens princip förbjuder. §9.

**Vad som inte är fel, mätt i den här omgången:** kanoniska taggar stämmer på
alla 400 kontrollerade verksamheter, sidindelningen har egen kanonisk tagg per
sida och bär inte noindex, titlar och beskrivningar är unika på 400 av 400,
sajten svarar 404 på okända adresser, och Googlebot får sidan brotli-packad på
24 kilobyte med 120 millisekunders svarstid. Det tekniska är i ordning.

---

## 2. Metoden, och vad den är värd

**Länkgrafen.** Samtliga 16 767 HTML-filer i `site/dist` lästes, och varje
`<a href>` i dem plockades ut med reguljärt uttryck. Endast interna adresser
räknas, alltså sådana som pekar på `prikko.se` eller börjar med snedstreck och
har en fil bakom sig i bygget. Länkar med `rel="nofollow"` räknas inte, och de
är få: fem stycken på hela startsidan. Ankare, `mailto:` och `tel:` räknas
inte. Frågesträngar strippas, eftersom sajten inte bygger sidor på dem.

Från det byggdes en riktad graf och en bredden-först-sökning från `/`.
Klickdjup betyder här kortaste väg i den grafen. Sitemapen ingår inte i grafen,
just för att mäta det Google följer och inte det Google får serverat.

**Kontroll mot drift.** Startsidan i bygget har 521 unika tvåledade länkar.
Samma sida hämtad från `https://prikko.se/` samma dag har 521. Bygget och
driften är samma sajt.

**Metodens svaghet.** Grafen mäter nåbarhet, inte genomsökning. Google kan välja
att inte följa en länk, att inte återkomma till en sida, eller att genomsöka
utan att indexera. Nåbarhet är ett nödvändigt villkor, inte ett tillräckligt.
Att mätningen frikänner navigationen betyder alltså inte att den pekar ut vad
som i stället är fel, bara att den utesluter en förklaring. Det riktiga svaret
ligger fortfarande i Search Console, och det är fortfarande ägarens
inloggning som saknas.

**En andra graf kördes** där länkar från noindex-sidor inte följdes, eftersom
Google på sikt slutar besöka en noindex-sida och därmed slutar följa dess
länkar. Utfallet var identiskt på varje rad. Ingen indexerbar sida hänger på en
noindex-sida för sin nåbarhet.

---

## 3. Klickdjupet, mätt

### 3.1 Verksamhetssidorna

| Klickdjup | Sidor | Andel | Kumulativt |
|---:|---:|---:|---:|
| 1 | 478 | 3,5 % | 3,5 % |
| 2 | 4 860 | 35,9 % | 39,4 % |
| 3 | 6 577 | 48,6 % | 88,0 % |
| 4 | 1 592 | 11,8 % | 99,7 % |
| 5 | 39 | 0,3 % | 100,0 % |
| 6 eller mer | 0 | 0 % | |
| onåbara | 0 | 0 % | |

**Median: 3. Max: 5.** Det är en grund sajt, inte en djup.

De 478 på klickdjup 1 står i blocket "Populära ställen" på startsidan, som
länkar 521 verksamheter direkt. Det ensamt gör en stor del av grafen platt: en
verksamhet på djup 2 nås ofta genom en av dessa och inte genom en listsida.

### 3.2 Alla sidtyper

Tabellen räknar sitemapens 14 260 indexerbara adresser, uppdelade på om
adressen bär `/sida/N/` eller inte.

| Sidtyp | Sidor | d1 | d2 | d3 | d4 | d5 | d6 | onåbara |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Verksamheter | 13 546 | 478 | 4 860 | 6 577 | 1 592 | 39 | | 0 |
| Kategorier `/sida/N/` | 181 | | 52 | 63 | 44 | 18 | 4 | 0 |
| Kommuner `/sida/N/` | 164 | | 42 | 59 | 47 | 13 | 3 | 0 |
| Områden | 86 | | 64 | 22 | | | | 0 |
| Kategorier | 75 | 36 | 33 | 6 | | | | 0 |
| Områden `/sida/N/` | 62 | | | 20 | 32 | 10 | | 0 |
| Kedjor | 53 | 13 | 40 | | | | | 0 |
| Kommuner | 28 | 24 | 4 | | | | | 0 |
| Artiklar | 25 | 13 | 12 | | | | | 0 |
| Övriga sidor | 11 | 10 | | | | | | 0 |
| Kartor | 10 | 1 | 9 | | | | | 0 |
| Rapporter | 8 | 1 | 7 | | | | | 0 |
| Utmärkelser | 6 | 1 | 5 | | | | | 0 |
| Topplistor | 5 | | 5 | | | | | 0 |

**Ingen indexerbar sida på hela sajten är onåbar.** De djupaste sidorna som
finns är sju sidindelade kategorilistor på klickdjup 6, och den enda sidtyp där
en sida över huvud taget når djup 5 utöver dem är verksamheterna, med 39 sidor.

### 3.3 Vad som orsakar det grunda djupet

Korslänkningen mellan verksamheter finns redan och är byggd. En verksamhetssida
har median 104 `<a href>`, och av dem pekar ungefär 33 på andra
verksamhetssidor, fördelade på tre block: "Nära dig" med fyra, "Bäst i
närheten" med fyra, och "Jämför X med" med 24.

Det syns i vilken sidtyp som ligger på den kortaste vägen till en verksamhet:

| Sidtypen som ger kortaste vägen | Verksamheter |
|---|---:|
| En annan verksamhetssida | 5 675 |
| En kategorisida | 3 546 |
| En kommunsida | 2 055 |
| En kedjesida | 943 |
| En områdessida | 774 |
| Startsidan och övriga sidor | 478 |
| Övrigt | 75 |

**Den vanligaste vägen till en verksamhet går genom en annan verksamhet**, inte
genom en listsida. Åtgärden "korslänkning mellan närliggande verksamheter" som
stod som kandidat i beställningen är alltså redan genomförd, och det är den som
gör grafen platt.

---

## 4. Inlänkarna, mätt

En inlänk räknas en gång per källsida, oavsett hur många gånger källsidan
länkar målet. `rel="nofollow"` räknas inte. Självlänkar räknas inte.

### 4.1 Fördelningen för verksamhetssidorna

| Inlänkar | Sidor | Andel | Kumulativt |
|---:|---:|---:|---:|
| 1 | 165 | 1,2 % | 1,2 % |
| 2 | 1 224 | 9,0 % | 10,3 % |
| 3 | 531 | 3,9 % | 14,2 % |
| 4 | 467 | 3,4 % | 17,6 % |
| 5 | 714 | 5,3 % | 22,9 % |
| 6 | 1 053 | 7,8 % | 30,7 % |
| 7 | 1 465 | 10,8 % | 41,5 % |
| 8 | 1 534 | 11,3 % | 52,8 % |
| 9 | 1 520 | 11,2 % | 64,0 % |
| 10 | 1 259 | 9,3 % | 73,3 % |
| 11 | 957 | 7,1 % | 80,4 % |
| 12 | 683 | 5,0 % | 85,4 % |
| 13 eller fler | 1 974 | 14,6 % | 100 % |

**Median 8. Tionde percentilen 2. Nittionde percentilen 14. Max 540.**

Bara 165 verksamheter av 13 546 har en enda inlänk. Påståendet i beställningen
att "en sida som bara nås från en enda paginerad listsida är i praktiken
osynlig" beskriver alltså 1,2 procent av beståndet, inte svansen.

**Hur många nås bara via en sidindelad lista:** 922 av 13 546, alltså 6,8
procent, har enbart inlänkar från adresser med `/sida/N/`. 12 624 verksamheter,
alltså 93,2 procent, har minst en inlänk från en sida som inte är sidindelad.

### 4.2 Per sidtyp

| Sidtyp | Antal | Median inlänkar | p10 | p90 |
|---|---:|---:|---:|---:|
| Verksamheter | 13 546 | 8 | 2 | 14 |
| Kategorier `/sida/N/` | 181 | 4 | 2 | 4 |
| Kommuner `/sida/N/` | 164 | 4 | 3 | 4 |
| Områden | 86 | 106 | 4 | 220 |
| Kategorier | 75 | 52 | 1 | 424 |
| Områden `/sida/N/` | 62 | 3 | 1 | 4 |
| Kedjor | 53 | 67 | 61 | 16 755 |
| Kommuner | 28 | 16 755 | 4 | 16 756 |

Kommunsidorna ligger i sidfoten på varje sida, därav 16 755. Kedjorna har
median 67 och lägst 58, alltså är varje kedjesida välförsedd.

### 4.3 De mest inlänkade verksamheterna, och om det stämmer med indexeringen

De tolv toppnoteringarna ligger mellan 540 och 304 inlänkar och är samtliga
stora Stockholmsställen: Hemköp City 540, Rydbergs bar och matsal 482, Eataly
459, Restaurang Prinsen 455, Scandic Continental 429, Downtown Camper 407.
Länkarna kommer från "Jämför X med"-blocket på hundratals andra sidor.

**Stämmer det med att just de är indexerade?** Det går inte att avgöra ur
materialet. Ingen av dem ingick i stickprovet i dokument 49, och den enda
verksamhet som var indexerad där,
`/stockholm/the-wine-team-global-ab-underobjekt/`, har 17 inlänkar och ligger
på klickdjup 3, alltså mitt i fördelningen. Den enda observation som finns är
att den indexerade verksamheten hade fler inlänkar än alla sju namngivna
saknade, som låg mellan en och åtta. Det är en observation på n lika med ett
och ska inte läsas som ett samband. §6.2.

---

## 5. Sidindelningen: rätt byggd, och fel anklagad

### 5.1 Vad vi faktiskt har

Mätt på 60 slumpade sidindelade listsidor i bygget:

| Egenskap | Utfall |
|---|---|
| `rel="next"` i `<head>` | 48 av 60, alltså alla utom sista sidan i varje serie |
| `rel="prev"` i `<head>` | finns, 407 filer totalt bär `rel="prev"` |
| Egen kanonisk tagg per sida | 60 av 60 pekar på sig själv |
| `noindex` | 0 av 60 |
| Ligger i sitemapen | ja, 407 adresser |
| Träffar per listsida | 126 till 136 |
| Sidindelade filer totalt | 407, varav 85 i Stockholms kommunlista |

### 5.2 Vad Google säger 2026

Googles egen dokumentation om paginering, senast uppdaterad 2025-12-10, ger tre
krav: länka sidorna sekventiellt med riktiga `<a href>`, ge varje sida en egen
adress, och ge varje sida en egen kanonisk tagg. Om `rel="next"` och
`rel="prev"` står ordagrant att "Google no longer uses these tags, although
these links may still be used by other search engines".

**Vi uppfyller alla tre kraven.** `rel="next"` och `rel="prev"` är alltså inte
fel, bara verkningslösa för Google, och de kostar ingenting.

Rekommendationen att `noindex`:a sidindelade listor finns inte i Googles
dokumentation. Där noindex nämns i pagineringssammanhang gäller det filter- och
sorteringsvarianter av samma resultatlista, inte sidorna i serien.

### 5.3 Avvägningen som beställningen bad om, avgjord

Frågan var om noindex på sidindelade listor stryper vägen till verksamheterna.
Svaret är ja, den skulle göra det, men frågan är ändå inte aktuell, av två skäl.

Det första är att vi inte noindexar dem, och inte bör börja. Varningen att
`noindex, follow` på sikt behandlas som `nofollow` är verklig men gammal och
muntlig. Den kommer från John Mueller i en Google-hangout 28 december 2017, där
mekanismen beskrivs som att Google slutar besöka sidan och därför inte längre
följer länkarna. Den står inte i någon dokumentation och har inte upprepats
sedan dess, så den ska behandlas som ett väletablerat men obekräftat beteende.

Det andra är att avvägningen skulle vara billig även om varningen stämde. 922
verksamheter, alltså 6,8 procent, nås enbart via sidindelade listor. Resten når
vi ändå. Men eftersom det inte finns något skäl att noindexa dem behöver den
kostnaden aldrig betalas.

---

## 6. Vad mätningen i dokument 49 faktiskt visade

### 6.1 Urvalsartefakten

Dokument 49 §1.3 skriver: "Sidindelningen är där genomsökningen dör. Åtta av
nio provade sidor med `/sida/N/` i adressen saknas i Google."

Det är sant som observation och fel som slutsats, av två skäl.

**Skäl ett: sidindelade adresser är 2,9 procent av sajten.**

| | Antal | Andel av sitemapen |
|---|---:|---:|
| Sitemapens URL:er | 14 260 | 100 % |
| varav sidindelade | 407 | 2,9 % |
| varav verksamheter | 13 546 | 95,0 % |

Om samtliga 407 sidindelade adresser saknas i Google förklarar det 407 av de
ungefär 12 900 sidor som fattas, alltså 3 procent av bortfallet.

**Skäl två: det skiktade urvalet drog dem med avsikt.** Urvalet tog fyra
adresser vardera ur kategorier, kommuner och områden. I de skikten är
andelen sidindelade:

| Skikt | Sidor | varav sidindelade | Andel | Väntat antal i fyra dragningar |
|---|---:|---:|---:|---:|
| Kategorier | 256 | 181 | 70,7 % | 2,8 |
| Kommuner | 192 | 164 | 85,4 % | 3,4 |
| Områden | 148 | 62 | 41,9 % | 1,7 |
| **Summa** | | | | **7,9** |

Det väntade antalet sidindelade adresser i urvalet var alltså cirka åtta. Nio
observerades. **Det är inte ett fynd, det är urvalsmetoden som räknar sig
själv.** Att åtta av dem saknades säger heller inte mer än att de tre skikten
sammantaget hade låg indexeringsgrad, vilket dokument 49 redan visade på
skiktnivå.

### 6.2 Beviskedjan pekar åt motsatt håll

De nio adresser dokument 49 fann i Google, med den här mätningens tal:

| Adress | Sidtyp | Klickdjup | Inlänkar |
|---|---|---:|---:|
| `/kedja/joe-and-the-juice/` | Kedja | 2 | 78 |
| `/kedja/taco-bar/` | Kedja | 2 | 66 |
| `/kedja/naked-juicebar/` | Kedja | 2 | 59 |
| `/kedja/city-gross/` | Kedja | 2 | 58 |
| `/stockholm/omrade/hagerstensasen/` | Område | 2 | 100 |
| `/stockholm/the-wine-team-global-ab-underobjekt/` | Verksamhet | 3 | 17 |
| `/stockholm/omrade/vasastaden/butiker/` | Område | 3 | 4 |
| `/stockholm/kategori/skolor-och-omsorg/sida/14/` | Kategori, sidindelad | 3 | 4 |
| `/stockholm/sida/83/` | Kommun, sidindelad | 4 | 4 |

De sju namngivna verksamheter som saknades:

| Adress | Klickdjup | Inlänkar |
|---|---:|---:|
| `/linkoping/forskolan-skogsmyran/` | 2 | 8 |
| `/orebro/pressbyran-vaghustorget/` | 2 | 6 |
| `/stockholm/tonari-ramen/` | 3 | 8 |
| `/stockholm/kottkompaniet-jarlaplan/` | 3 | 7 |
| `/hoganas/kullagrill/` | 3 | 1 |
| `/stockholm/bitza-hornstull/` | 4 | 8 |
| `/stockholm/meze-store-i-hotorgshallen/` | 4 | 4 |

**`/stockholm/sida/83/` ligger på klickdjup 4 med fyra inlänkar och är
indexerad. `/linkoping/forskolan-skogsmyran/` ligger på klickdjup 2 med åtta
inlänkar och är det inte.** Om klickdjup och inlänkantal styrde utfallet skulle
tabellerna se ut tvärtom. Det gör de inte.

Materialet är litet och ska inte överbelastas. Men det pekar inte åt det håll
hypotesen krävde, och en hypotes som prövas mot sitt eget stickprov och inte
klarar det ska inte byggas på.

---

## 7. Förlagorna

Allt i avsnittet är hämtat 2026-08-31 och räknat i faktisk HTML, i rå källa där
den räcker och i renderad DOM där sajten kräver JavaScript. Det står vid varje
tal vilket som gäller.

**En metodanmärkning som hör hemma här.** `allabolag.se/robots.txt` blockerar
uttryckligen `anthropic-ai`, `ClaudeBot` och `Claude-Web` med `Disallow: /`.
Googlebot är inte blockerad. Sidorna hämtades som vanlig webbläsare för den här
engångsjämförelsen. Om något automatiserat ska röra sajten framöver är spärren
värd att känna till.

### 7.0 Sammanställningen

| Mått | Prikko | hitta.se | allabolag.se | booli.se |
|---|---:|---:|---:|---:|
| Klick från startsidan till en djup sida | **1 till 5, median 3** | 2 | 3 | 2 |
| Interna länkar på startsidan | **521 unika tvåledade, 604 totalt** | 60 unika | 25 unika | 27 |
| Länkar till andra djupa sidor på en djup sida | **cirka 33** | **0** | 1 | **0** |
| Bokstavsregister | nej | ja, 42 bokstäver × 21 län | nej | nej |
| Ortsregister | via kommunsidor | ja | nej | nej, bara `?areaIds=` |
| HTML-webbkarta | ja, 282 länkar | ja, men renderad med JavaScript | nej | nej |
| XML-sitemap | ja, 14 260 adresser | ja, cirka 1,5 miljoner företagsadresser | **ingen alls** | cirka 73 500 adresser |
| Träffar per listsida | **126 till 136** | 25 | 25 | 35 |
| `rel="next"` / `rel="prev"` | ja | ja | nej | nej |
| Egen kanonisk tagg per sidindelad sida | ja | ja | ja | ja |
| `noindex` på sidindelade sidor | nej | nej | nej | nej |
| Nåbart tak i pagineringen | inget | inget | **400 sidor, 10 000 av 42 818** | inget |

**Tre saker faller ut av tabellen.**

**Ingen av de tre förlagorna korslänkar djupa sidor till varandra.** Hitta.se
har noll länkar från en företagssida till en annan och inte ens brödsmulor.
Booli har noll. Allabolag har en, och den går till moderbolaget. Vi har cirka
33. **Vi har den tätaste interna länkstrukturen av alla fyra**, och det är
precis det beställningen föreslog att vi skulle bygga mer av.

**Ingen av dem har grundare navigering än vi.** Vår median är tre klick, deras
kortaste vägar är två till tre. Skillnaden är att deras korta väg går genom en
enda rikstäckande resultatlista och vår går genom tolv kommunhubbar, vilket är
en följd av att vi täcker tolv kommuner och de täcker landet.

**Alla fyra bygger sidindelningen som vi.** Egen adress, egen kanonisk tagg per
sida, ingen noindex. Två av dem har inte ens `rel="next"`. Vi ligger inte efter
på någon punkt i §5.

### 7.1 Booli

Hämtat 2026-08-31 ur renderad DOM, eftersom `curl` möter 403 från Cloudflare.

| Mått | Booli |
|---|---|
| Interna länkar på startsidan | 27 |
| Klick från startsidan till ett objekt | 2 |
| Vägen dit | startsida, `/sok/till-salu` för hela Sverige, objektet |
| Objektlänkar på en objektsida | 0 |
| "Liknande bostäder" på objektsidan | finns inte |
| Områdesregister, gatuindex, bokstavsregister | finns inte |
| HTML-webbkarta | finns inte, `/siteFull.html` i robots.txt är en kvarleva som svarar 404 |
| Områden i URL:en | nej, uttrycks som `?areaIds=115341` |
| Paginering | riktiga `<a href="?page=N">`, 35 träffar per sida |
| `rel="next"` / `rel="prev"` | saknas helt |
| `noindex` på sidindelade sidor | nej |
| Kanonisk tagg på sida 3 | pekar på sida 3 |
| Adresser i sitemap | cirka 48 000 områdesadresser och cirka 25 500 objektadresser |

**Det avgörande i jämförelsen:** Booli har inget av det som stod som kandidat i
beställningen. Ingen webbkarta, inget bokstavsregister, ingen korslänkning
mellan objekt. Objektsidorna är återvändsgränder i länkgrafen med noll utgående
objektlänkar. **Vi har mer intern länkstruktur än Booli, inte mindre.** Vår
verksamhetssida länkar 33 andra verksamheter, deras objektsida länkar noll.

Booli når djupet på två sätt i stället: en platt sökväg där hela landets
resultatlista ligger ett klick från startsidan, och XML-sitemaps med tiotusentals
adresser. De publicerar dessutom bara ett urval, cirka 25 500 objektadresser i
sitemap mot 89 365 objekt till salu på sajten.

Deras enda synliga svaghet är att `?areaIds=1&page=400` svarar 200 med noll
träffar, full layout och utan noindex, alltså en mjuk 404 i ett oändligt
adressutrymme. Det felet har inte vi.

### 7.2 Hitta.se

Den enda av de tre som faktiskt har ett bokstavsregister, alltså den kandidat
beställningen frågade om.

| Steg | Adress | `<a href>` totalt | unika |
|---:|---|---:|---:|
| 0 | `https://www.hitta.se/` | 93 | 60 |
| 1 | `/verksamheter/restauranger`, som 302:ar till `/verksamheter/restauranger/stockholm` | 112 | 75 |
| 2 | `/verksamhet/brisket-and-friends-vasastan-haaoqbyzd` | 61 | 35 |

**Kortaste vägen till ett företag: två klick.** Startsidan länkar 32 unika
kategorisidor direkt i rå HTML, och kategorisidan omdirigerar geografiskt till
närmaste ort och listar 25 företag.

**Företagssidan länkar noll andra företagssidor.** Den har heller inga
listlänkar tillbaka, och `enableBreadcrumbs` står uttryckligen som `false` i
sidans egen JSON. De enda interna länkarna utöver global navigering är
ekonomisidan, namnsökträffen och kartlänkar. **Företagssidan är en
återvändsgränd i länkgrafen.**

**Bokstavsregistret, mätt.** Webbkartan har fem flikar:

| Register | Innehåll |
|---|---|
| `/sitemap/foretag` | 21 län plus 42 bokstavsnycklar, A till Ö plus accenttecken |
| `/sitemap/personer` | 21 län plus 45 bokstavsnycklar |
| `/sitemap/platser` | 21 län, sedan kommun |
| `/sitemap/telefonnummer` | 52 riktnummer |
| `/sitemap/kategorier` | 32 branscher, tre nivåer djupt |

Bokstav korsas med län, alltså `/sitemap/foretag/Stockholms+län/forst/B/`, och
varje bokstavssida listar 51 företagsnamn och pagineras vidare.

**Men webbkartan renderas med JavaScript.** Rå HTML på `/sitemap/kategorier`
har 35 `<a href>` och noll kategorilänkar. De 32 branscherna dyker upp först
efter rendering. Registret hänger alltså på Googles renderingskö, vilket är det
dyraste sättet att bli genomsökt.

**Det som faktiskt bär hitta.se är XML.** Deras robots.txt pekar på ett
sitemapindex med 1 779 filer:

| Filer | Familj | Innehåll |
|---:|---|---|
| 1 527 | `phone_N.txt` | telefonnummer |
| 107 | `person_List_Name_N.txt` | personer |
| 30 | `company_Detailed_N.txt` | cirka 50 000 rader vardera, alltså cirka 1,5 miljoner företagssidor |
| 29 | `company_List_N.txt` | namnsökträffar |
| 8 | `industry_tree_N.txt` | kategori och ort, 47 903 av 49 999 rader i första filen |

**Sidindelningen.** 25 träffar per sida. Restauranger i Stockholm har 5 653
träffar, alltså 227 sidor. Komplett `rel="next"` och `rel="prev"`-kedja,
självrefererande kanonisk tagg på varje sida, ingen robots-metatagg alls. Men
i själva sidan finns bara föregående, nuvarande och nästa som siffror. **Sista
restaurangen i Stockholm ligger 228 sekventiella klick från startsidan**,
eftersom Google inte längre använder `rel="next"`.

**Slutsatsen för oss:** hitta.se har bokstavsregistret vi övervägde, men det
renderas med JavaScript, och deras djupaste listsidor ligger 228 klick bort.
Det är XML-sitemapen som gör hela arbetet. Bokstavsregistret är inte det som
bär deras 1,5 miljoner sidor.

### 7.3 Allabolag.se

Den enda av de fyra utan XML-sitemap. Därför den intressantaste, eftersom den
måste klara sig på länkar precis som hypotesen påstod att vi måste.

| Steg | Adress | `<a href>` totalt | unika |
|---:|---|---:|---:|
| 0 | `https://www.allabolag.se/` | 34 | 25 |
| 1 | `/branscher` | 776 | 770 |
| 2 | `/bransch-sök?q=Restauranger` | 221 | 142 |
| 3 | `/foretag/restaurang-tennstopet/stockholm/restauranger/2JYTYJAI5YH9F` | 65 | 51 |

**Kortaste vägen: tre klick.** Startsidan har 25 unika länkar och den enda
vägen nedåt är `/branscher`, som i gengäld har 719 unika branschlänkar i rå
HTML.

**Inget bokstavsregister och inget ortsregister.** `/foretag`, `/alla-foretag`,
`/bokstav`, `/index`, `/orter`, `/kommuner` och `/län` svarar alla 404.
`/sitemap.xml`, `/sitemap_index.xml` och `/sitemaps/sitemap.xml` svarar 404 och
robots.txt saknar `Sitemap:`-direktiv helt.

**Ortsdatan finns men länkas inte.** I `__NEXT_DATA__` på branschsidan ligger
290 kommuner, 21 län och 100 postorter som färdiga facetter, men de renderas
utan `href`. Det finns alltså inga bransch-gånger-ort-landningssidor hos
allabolag, till skillnad från hitta.se som har nära 400 000.

**Korslänkning på företagssidan:** en länk till ett annat företag, och den går
till moderbolaget. Sex länkar till branschsökningar. Inga moduler för liknande
företag, samma bransch eller samma adress. Hela `hydrationData`-trädet
genomsöktes utan träff på similar, related, nearby eller peers.

Den verkliga korslänkningen sker i stället genom personsidorna.
`/befattning/<namn>/-/<id>` är `index,follow` och länkar varje bolag personen
sitter i. Det bygger en företag till person till företag-graf. På listsidan
finns dessutom 51 länkar till besläktade branscher i rå HTML, alltså genuin
korslänkning mellan hubbar.

**Sidindelningen, och deras allvarligaste fel.** 25 träffar per sida, självrefererande
kanonisk tagg, `index,follow`, ingen `rel="next"`. Restauranger har 42 818
träffar men taket är 400 sidor. 400 gånger 25 är 10 000. **77 procent av
restaurangerna går inte att nå genom sidindelningen**, och sida 401 svarar
HTTP 500. Sidnavigeringen visar aktuell sida plus minus ett samt en genväg till
sista sidan, vilket inte hjälper i mitten: sida 200 kräver cirka 199 hopp från
vardera änden, utan XML-sitemap som skyddsnät.

**Slutsatsen för oss:** allabolag är förlagan som verkligen prövar hypotesen,
eftersom de saknar sitemap. Deras svar är inte bokstavsregister eller
korslänkning mellan företag. Det är en enda mycket bred hubb, 719 branscher på
ett klick, plus horisontell länkning mellan hubbar. Och de betalar för
avsaknaden av sitemap med att tre fjärdedelar av beståndet är onåbart.

---

## 8. Vad som återstår som förklaring

Tre kandidater överlever mätningen. Ingen av dem är navigation.

### 8.1 Innehållet är till 61 procent samma text på varje verksamhetssida

Mätt på 200 slumpade verksamhetssidor, på den synliga brödtexten efter att
skript, stil och SVG tagits bort:

| Mått | Verksamhetssida |
|---|---:|
| Ord i brödtexten, median | 1 065 |
| Andel av orden som står ordagrant på minst 90 procent av sidorna | 61,2 % |
| Ord som är sidans eget, uppskattat | cirka 415 |
| Delade åttaordssekvenser mellan två slumpade sidor, median | 61,7 % |
| Andel av brödtexten som är länktext | 28 % |

Boilerplaten är inte bara sidfot. Den innehåller den förklarande texten om hur
bedömningen sätts, hur en avvikelse ska läsas, och hur historiken följer
lokalen, alltså sidans metodavsnitt. Det är bra text, och den står på 13 546
sidor.

### 8.2 Unikheten följer indexeringsgraden, och klickdjupet gör det inte

Andel unika åttaordssekvenser är räknad inom sidtypen, alltså hur mycket av
sidans text som inte står på någon annan sida av samma typ i urvalet. Kolumnen
längst till höger är dokument 49:s stickprov.

| Sidtyp | Ord, median | Unika 8-gram, median | Andel unikt | Klickdjup, median | Indexerat i stickprovet |
|---|---:|---:|---:|---:|---:|
| Kommuner | 1 449 | 1 114 | 77,6 % | 1 | 1 av 4 |
| Artiklar | 1 421 | 1 055 | 74,1 % | 1 | ej provat |
| Rapporter | 896 | 635 | 71,5 % | 2 | ej provat |
| Kategorier | 1 412 | 562 | 59,6 % | 3 | 1 av 4 |
| Topplistor | 858 | 470 | 54,9 % | 2 | ej provat |
| **Kedjor** | 734 | 306 | **43,6 %** | 2 | **4 av 4** |
| Områden | 1 314 | 410 | 33,2 % | 2 | 2 av 4 |
| **Verksamheter** | 1 062 | 220 | **20,7 %** | 3 | **1 av 12** |

Sambandet är inte rent. Kommunsidorna har högst unikhet och bara en indexerad
av fyra, men tre av de fyra dragna kommunadresserna var sidindelade listor och
inte kommunhubbar, så raden mäter inte det den ser ut att mäta.

**Det som står stadigt är ytterlägena.** Verksamheterna har lägst eget innehåll
av alla sidtyper och lägst indexeringsgrad. Kedjorna har hög unikhet, svarar på
en fråga ingen annan sidtyp hos oss svarar på, och är fyra av fyra. Det är
samma mönster dokument 49 §1.4 pekade ut, men här med ett mått bakom sig.

### 8.3 Datan bakom svansen är tunn

Mätt på 500 slumpade verksamheter, antalet publicerade kontroller sidan vilar
på:

| Kontroller | Verksamheter | Andel | Kumulativt |
|---:|---:|---:|---:|
| 1 | 138 | 27,6 % | 27,6 % |
| 2 | 87 | 17,4 % | 45,0 % |
| 3 | 61 | 12,2 % | 57,2 % |
| 4 | 36 | 7,2 % | 64,4 % |
| 5 till 9 | 103 | 20,6 % | 85,0 % |
| 10 eller fler | 75 | 15,0 % | 100 % |

Och unikheten följer datamängden:

| Kontroller | Unika 8-gram, median |
|---:|---:|
| 1 | 169 |
| 2 | 186 |
| 3 | 209 |
| 4 | 241 |
| 5 eller fler | 294 |

**En verksamhet med en enda kontroll har 169 unika åttaordssekvenser i en text
på drygt tusen ord.** Det är 3 738 sidor av 13 546, uppräknat från stickprovet,
som är sajtens tunnaste. Det är också den grupp där påståendet "svansen
förtjänar inte en sida" har mest fog för sig, och §9.5 tar ställning till det.

### 8.4 Domänen är två månader gammal och har inga inlänkar utifrån

`docs/45_entreprenorslistan.md` §1 skriver att spridningsmaskinen inte finns
och att "ingen utanför projektet vet att den finns". Det gör crawl-efterfrågan
till den mest sannolika enskilda förklaringen, och den går inte att mäta
härifrån.

Ett försök gjordes att hämta domänens auktoritetstal och länkprofil ur Semrush.
Kontot har en aktiv prenumeration men saknar API-enheter, så anropet gick inte
igenom. Ägaren kan se tillgängliga alternativ för fler API-enheter på
`https://www.semrush.com/mcp-access`.

Värt att notera mot dokument 49 §1.2: de två verksamheter som var i Google, AG
i Stockholm och Zocalo i Uppsala, är namn som söks och länkas av andra skäl.
Det är samma förklaring som crawl-efterfrågan, sedd från andra hållet.

### 8.5 Vad som är uteslutet

Genomsökningstakt begränsad av teknik är det inte. Googlebot får sidan
brotli-packad på 24 kilobyte med 120 millisekunders svarstid. Rå HTML är 110
kilobyte, varav 38 inbäddad SVG och 21 `data-astro-cid`-attribut, alltså 52
procent markering utan innehåll, men komprimerat spelar det liten roll.

Google definierar dessutom själv när en sajt behöver bry sig om
genomsökningsbudget: över en miljon sidor med veckovis föränderligt innehåll,
eller över tiotusen sidor med dagligen föränderligt innehåll. **En sajt på
16 767 sidor med stabilt innehåll faller utanför Googles egen definition.**

---

## 9. Åtgärderna, rangordnade efter effekt per arbetstimme

### 9.1 Släck `prikko.pages.dev`. Cirka en halvtimme.

Mätt 2026-08-31 med Googlebots user-agent:

| Adress | Svar | Storlek |
|---|---|---:|
| `https://prikko.pages.dev/` | 200 | 1 023 697 byte |
| `https://prikko.pages.dev/robots.txt` | 200, `Allow: /` | 462 byte |
| `https://prikko.pages.dev/stockholm/tonari-ramen/` | 200, ingen robots-meta | |

Kanoniska taggen på pages.dev pekar korrekt på `https://prikko.se/`, så Google
bör konsolidera. Men konsolidering kostar genomsökning: hela sajten erbjuds två
gånger, alltså 28 520 adresser i stället för 14 260, på en domän vars problem
möjligen är just hur mycket Google orkar hämta.

Det här är fynd B i `docs/14_seo_efter_lansering.md`, skrivet 3 augusti och
lämnat som "kräver ett beslut om driftsättningen". Beslutet är fortfarande inte
taget. **Det är den enda mätbara defekten i hela den här utredningen och den
kostar en halvtimme.**

Åtgärden är en Cloudflare-inställning eller en omdirigering, inte en ändring i
`public/_headers`, eftersom `_headers` inte kan villkoras på värdnamn.

### 9.2 Koppla Search Console. Cirka en timme, och den ligger på ägaren.

Allt i det här dokumentet och i dokument 49 är slutledning från utsidan. Search
Console svarar direkt på den enda fråga som betyder något: hur många sidor
ligger i "Crawled, currently not indexed" och hur många i "Discovered,
currently not indexed".

**Skillnaden mellan de två avgör vilken av §8:s förklaringar som gäller.**
"Discovered" betyder att Google känner till adressen men inte hämtat den, alltså
genomsökningstakt, alltså domänens ålder. "Crawled" betyder att Google hämtat
sidan och valt bort den, alltså kvalitet, alltså §8.1 till §8.3.

Innan det talet finns är varje bygge en gissning. Det är därför den här punkten
står över alla byggåtgärder trots att den inte bygger något.

### 9.3 Bygg ingen navigation. Noll timmar, och det är poängen.

Beställningen listade fem kandidater. Fyra av dem faller på mätningen:

| Kandidat | Varför den faller |
|---|---|
| Kortare väg via bokstavs- eller områdesregister | Medianvägen är redan tre klick och max är fem. Ett register kan i bästa fall flytta 1 592 sidor från djup 4 till djup 3. Booli och allabolag har inget, och hitta.se:s renderas med JavaScript. |
| Korslänkning mellan närliggande verksamheter | Finns redan. 33 verksamhetslänkar per sida, och en annan verksamhet är den vanligaste kortaste vägen för 5 675 av 13 546. Ingen av de tre förlagorna har mer än en. |
| Riktig HTML-webbkarta som täcker allt | Webbkartan har 282 länkar i dag. En som täcker 13 546 vore en länkvägg, den skulle inte sänka något klickdjup som är för högt, och två av tre förlagor har ingen alls. |
| Färre sidor per listsida | Vi har 126 till 136 per sida mot 25, 25 och 35 hos förlagorna. Färre per sida ger fler listsidor och djupare serier. Hitta.se betalar för sina 25 med 228 klick till sista sidan. Vår siffra är rätt, inte fel. |

Utöver att de inte behövs skulle ett bokstavsregister och en heltäckande
webbkarta vara rena navigationssidor. Ägarens princip säger att en funktion
aldrig får kosta en sida och att sidor köps för sökning. **Ett bokstavsregister
över 13 546 verksamheter svarar inte på någon sökning.** Det skulle behöva
försvara sig som söksida och kan inte det.

### 9.4 Höj det egna innehållet på verksamhetssidan. Uppskattningsvis en till två veckor.

Detta är den enda byggåtgärd som riktar sig mot något mätningen faktiskt
pekade ut. Riktningen är att flytta boilerplate ut och eget innehåll in, inte
att skriva mer.

Två konkreta grepp, båda mätbara efteråt med samma skript som §8.1:

1. **Metodtexten som står ordagrant på 13 546 sidor.** Den finns redan som egen
   sida, `/metodik/`. Att korta den på verksamhetssidan till en mening och en
   länk skulle sänka boilerplateandelen utan att ta bort något en läsare
   behöver, och utan att kosta en sida.
2. **De 28 procent av brödtexten som är länktext.** "Jämför X med"-blocket är
   24 länkar och en stor del av det. Det är också det som ger korslänkningen,
   så det ska inte tas bort, men det räknas i dag som sidans text.

**Varning som hör till punkten.** Det är inte belagt att detta är orsaken. Det
är den bäst underbyggda kvarvarande kandidaten, och den ska inte byggas förrän
Search Console säger "Crawled, currently not indexed" och inte "Discovered".
Görs det i fel ordning byggs två veckor mot fel diagnos.

### 9.5 Svansen förtjänar en sida. Ingen åtgärd.

Uppräknat från stickprovet vilar cirka 3 738 verksamhetssidor på en enda
kontroll och har median 169 unika åttaordssekvenser. Frågan i beställningen var
om de förtjänar en sida.

**Ja.** En verksamhet med en kontroll svarar fortfarande på sökningen "är X
rent", vilket är hela sajtens ärende, och det är den enda sidan i landet som
gör det. Att ta bort dem vore att köpa högre indexeringsgrad genom att minska
täljaren och nämnaren samtidigt, och att ge upp precis den täckning som
`docs/45` kallar vallgraven. Att inte indexeras är inte samma sak som att inte
förtjäna att finnas.

Det som däremot är rimligt är att låta sidan säga rakt ut att underlaget är en
kontroll, vilket den redan gör, och att inte prioritera de sidorna i sitemapens
`lastmod`, vilket den redan gör eftersom `lastmod` kommer ur kontrollens datum.

### 9.6 Städa 2 388 föräldralösa filer. Låg prioritet.

2 499 verksamhetssidor bär `noindex` för att de faller under kvalitetsgrinden i
`isIndexable()`. Av dem länkas 111 ändå från sajten, och 2 388 länkas inte alls
och är onåbara i grafen.

De 2 388 är osynliga för Google och kostar ingenting i genomsökning, men de
upptar 2 388 filer av utrymmet. Med taket på 100 000 filer enligt `docs/46` är
det inte brådskande. De 111 som länkas trots noindex är ett litet slöseri med
genomsökning och en inkonsekvens, men elva hundradels procent av sajten.

---

## 10. Är det värt något alls

**Sannolikt inte att bygga för. Sannolikt ja att vänta ut.**

Google publicerar ingen siffra för vad som är rimligt, ingen utlovad andel och
ingen tidslinje. Det bästa tredjepartsmaterialet som gick att hitta är
IndexCheckrs studie av 16 miljoner sidor, publicerad 28 februari 2025:

| Tid sedan publicering | Andel indexerad |
|---|---:|
| 0 till 7 dagar | 14,0 % |
| 0 till 30 dagar | 64,9 % |
| 0 till 90 dagar | 76,8 % |
| 0 till 180 dagar | 93,2 % |

Genomsnittlig indexeringstid i det materialet: 27,4 dagar.

**Tre skäl att inte läsa av vår situation ur den tabellen.** Studien skiljer
inte på nya och etablerade domäner och skriver själv att de 14 procent som
indexeras första veckan sannolikt kommer från väletablerade sajter. Materialet
är sidor någon betalar för att övervaka, alltså sidor någon aktivt arbetar med.
Och 15 000 sidor på en ny domän utan inlänkar är ett annat problem än 15 000
sidor på en domän Google redan besöker dagligen.

**Bedömningen, tydligt märkt som bedömning:** en helt ny domän med 15 000 sidor
och inga inlänkar bör efter två månader räkna med grovt 20 till 50 procent
indexerat. Vi ligger på uppskattningsvis 10 procent, med ett Wilson-intervall
som enligt dokument 49 §4 sträcker sig från 1,5 till 35 procent på
verksamhetssidorna. **Vårt punktvärde ligger under vad som är väntat, men
intervallet överlappar det väntade helt.** Vi kan alltså inte säga att något är
fel, och vi kan inte säga att inget är det.

**Det som talar för att vänta:** navigationen är frikänd, tekniken är i
ordning, sidindelningen följer Googles dokumentation, och den enda mätbara
defekten tar en halvtimme. Domänen är två månader gammal och har noll
inlänkar utifrån, vilket är den mest sannolika förklaringen och samtidigt den
som löser sig av sig själv om något över huvud taget länkar oss.

**Det som talar mot att bara vänta:** om sidorna ligger i "Crawled, currently
not indexed" väntar vi förgäves, eftersom det är ett kvalitetsbeslut och inte
en kö. Skillnaden syns bara i Search Console.

**Därför är rekommendationen ordningen och inte åtgärden.** Släck pages.dev nu,
eftersom det är billigt och rätt oavsett. Koppla Search Console. Mät om om
fyra veckor med samma skiktade metod, men med jämnare skikt, eftersom dokument
49:s skiktning gjorde sidindelade adresser till en tredjedel av urvalet fast de
är 2,9 procent av sajten. Först då finns underlag att avgöra om §9.4 ska
byggas.

Under tiden är den bästa indexeringsåtgärden inte en sida. Den är att något
utanför sajten länkar till oss, alltså spridningsmaskinen i
`docs/45_entreprenorslistan.md`.

---

## 11. Vad som inte gick att mäta

1. **Om Google faktiskt genomsöker `prikko.pages.dev`.** Att den är öppen är
   mätt. Att den kostar genomsökning är slutledning.
2. **Domänens auktoritetstal och länkprofil.** Semrush-kontot saknar API-enheter.
3. **Vilken bucket sidorna ligger i.** "Crawled" mot "Discovered" avgör hela
   diagnosen och kräver Search Console.
4. **Om unikhet orsakar indexering.** §8.2 visar en korrelation över åtta
   sidtyper med ett stickprov på 28 sidor bakom sig. Det är för lite för ett
   samband, och kommunraden i den tabellen mäter dessutom fel sak.
5. **Om `data-astro-cid` och inbäddad SVG spelar någon roll.** De är 52 procent
   av rå HTML men försvinner nästan helt i komprimering. Bedömningen att det är
   oväsentligt är just en bedömning.
6. **Hur mycket av förlagornas bestånd som faktiskt är indexerat.** §7 mäter
   hur de bygger sina sajter, inte hur väl det fungerar. Att hitta.se har cirka
   1,5 miljoner adresser i sitemap säger inget om hur många av dem Google har.
   Jämförelsen svarar på om de gör det beställningen föreslog, inte på om det
   fungerar.
7. **Hitta.se:s och boolis geografiska omdirigering.** Båda anpassar
   startsidans vidare väg efter besökarens IP. Mätningen gjordes från en
   IP-adress som gav Stockholm. Klickdjupet två gäller alltså för en besökare
   nära en storstad, och kan vara ett steg längre för Googlebot beroende på
   varifrån den hämtar.

---

## 12. Skript och underlag

Mätningarna gjordes med engångsskript i sessionens skrivbordsmapp och inget av
dem lades i repot, eftersom uppdraget uttryckligen var att inte ändra kod.
Skripten går att skriva om ur beskrivningarna i §2 och §8. Bygget som mättes är
`site/dist` daterat 2026-08-28, och `site/dist-verif` rördes inte.
