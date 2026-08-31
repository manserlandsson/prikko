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
