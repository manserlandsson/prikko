# 62. Kommunsidan: från telefonkatalog till sökbar hubb

Uppmätt och byggt 2026-09-14. Filer: `site/src/components/Registerfilter.astro`,
`site/src/lib/kommunregister.ts`, `site/src/pages/kommunregister/[kommun].json.ts`,
samt ändringar i `KommunHub.astro` och `EstablishmentList.astro`.

## 1. Läget före

Mätt på `https://prikko.se/orebro/` i webbläsaren.

| | 1440 | 375 |
|---|---|---|
| första raden i registret | y 467 | y 787 |
| rader i första skärmen | 6 | 1 |
| sidans höjd | 12 190 | 16 761 |
| rader per sida | 100 | 100 |
| första tre raderna | 1 Rum och Kök, 2.0 Tvåpunktnoll, 24 Tobak | samma |

Örebro är 1 231 verksamheter, alltså 13 sidor A till Ö. De enda sätten att smalna
av var fem typlänkar och stadsdelslänkar, och båda leder till andra sidor.

HTML-vikt per sida, gzip -9: `/orebro/` 23,6 kB, `/stockholm/` 25,5 kB,
`/svenljunga/` 20,9 kB.

## 2. Förlagorna, i tal

Uppmätt 2026-09-14 med `getBoundingClientRect` och skärmbild. Samtycke:
bara nödvändiga cookies hos alla tre.

### Booli, `/sok/till-salu?areaIds=1` (Stockholms kommun)

| | 1440 | 375 |
|---|---|---|
| sorteringens standardläge | Nyast | Nyast |
| sorteringslägen | 8: Nyast, Äldst, Pris lägst/högst, Rum flest, Avgift lägst, Kvm-pris lägst/högst | samma |
| filter | områdeschip + sökfält + knappen Sökfilter (dialog med 11 grupper, 17 fält) | samma |
| överst | flikar Till salu / Slutpris / Nyproduktion, sökfält, Sökfilter, Visa karta, Spara sökning, sedan resultatraden som H1 i 14 px | samma, staplat |
| sortering | knapp x 572, y 252 | y 343 |
| första träffen | y 317, 221 hög | y 432, 364 hög |
| träffar i första skärmen | 3 | 1 |
| träffar per sida | 35 | 35 |
| karta | alltid synlig bredvid, 752 × 836 | bakom knappen Visa karta, y 231 |

Startsidan `booli.se`: ett sökfält och tre flikar, ingen lista.

Varför överst står det som står: sökfältet och filtret är produkten, och H1 är
resultatraden. Talen ("3 220 till salu och 4 846 snart till salu") står i
samma rad som svaret på var man är.

### Hemnet, `/bostader?location_ids[]=17744` (Stockholms län)

| | 1440 | 375 |
|---|---|---|
| sorteringens standardläge | Nyast först (`creation=desc`) | samma |
| sorteringslägen | 16, bland dem Adress A-Ö som ett val av sexton | samma |
| filter | Sökfilter i högerspalt: Område, Utöka område, Bostadstyp, Villkor | knapp Sökfilter, y 69 |
| överst | flikar Kommande / Till salu / Slutpriser, kartan som band | flikar, sortering och Karta på samma rad, y 187 |
| första träffen | y 851, 277 hög | y 299, 357 hög |
| träffar i första skärmen | 1, och den börjar på y 851 av 900 (kartbandet tar skärmen) | 1 |
| karta | band ovanför listan, ca 980 bred | bakom knappen Karta |
| H1 | "Stockholms län", 0 × 0, alltså bara för sökmotorn | samma |

Startsidan `hemnet.se`: sökfält och flikar, ingen lista.

### hitta.se, `/sök?vad=restauranger örebro`

| | 1440 | 375 |
|---|---|---|
| sorteringens standardläge | relevans, betald placering först | samma |
| sorteringslägen | inga att välja | inga |
| filter | flikar Företag 941 / Personer 4 / Platser 1, ortchip Örebro | flikarna |
| första träffen | y 176, 234 hög | y 176, 308 hög |
| träffar i första skärmen | 3 plus en annons | 3 |
| karta | alltid synlig bredvid, 442 × 786 | ingen i vyn |

### Vad de tre har gemensamt

1. Ingen av dem listar i bokstavsordning som standard. Hemnet har A-Ö som ett av
   sexton val.
2. Alla tre har ett sökfält ovanför listan, och det verkar på hela urvalet och
   inte på den sida man står på.
3. Sorteringen står i samma band som filtret, aldrig som en egen rubrik.
4. Kartan är antingen synlig bredvid (Booli, hitta) eller en knapp (alla på
   telefon).

## 3. Diagnos

Kommunsidan är en hubb: den bär länkgrafen till varje verksamhetssida, typ- och
områdessidorna och kommunens egen statistik. Den presenterade sig ändå som en
lista, och listan var den enda delen som inte hjälpte någon. Sex rader syns på
dator och en på telefon, och de börjar på siffror; för att hitta en pizzeria i
Örebro fanns ingen väg alls, eftersom matkategorierna bara fanns i kartans
fritext och typlänkarna är fem grova fack. Alla tre förlagor sätter ett sökfält
som verkar på hela urvalet överst, och ingen av dem ordnar alfabetiskt.

Ägarens läsning står sig, med ett tillägg. Kartan filtrerar INTE på tjugo
matkategorier: den filtrerar på fem toppkategorier och bär matkategorierna
bara som söktext, med avsikt, se `mk` i `lib/kartrutor.ts`. Skälet är
täckningen, och det gäller här också.

## 4. Vad som byggdes

En sökruta i kontrollbandet ovanför registret, på varje sida i serien:

- **Sökfält** över namn, adress, kommunens typ och matkategoriernas namn, med
  kartans normalisering.
- **Matkategorier** som val med talet på knappen, bara de kommunen har minst tre
  av. När ett val är aktivt säger statusraden hur många i kommunen som alls har
  en känd matkategori.
- **Område** där kommunen har gränser, ur `site/src/data/omraden/` via `areaOf`.
- **Ordning**: A till Ö eller Senast kontrollerade.
- Resultatet ersätter listan på plats, 100 rader åt gången, och sidnumreringen
  göms medan listan är filtrerad. Rensa lämnar tillbaka den byggda sidan.

### Standardläget

A till Ö i den byggda sidan, med Senast kontrollerade ett val bort. Motiveringen
står i huvudet på `Registerfilter.astro` och är i korthet:

1. Sidindelningen är ordningen. Kronologiskt hade varje ny kontroll flyttat alla
   rader före den, så att Stockholms 86 sidor bytt innehåll vid varje uppdatering.
2. Den bokstavsordnade listan är med flit orörlig (`recentlyInspected`), och
   färskheten har sin plats i sidopanelen.
3. Att byta ordning i klienten vid laddning hade krävt att registret hämtades
   vid varje sidvisning.

Kronologi är tillåtet enligt spärren, rangordning är det inte. Ingenting i
rutan läser bedömningen.

### Datan och vad den kostar

En JSON-fil per kommun, `/kommunregister/<kommun>.json`, byggd ur samma
funktioner som listan, kartan och områdessidorna (se huvudet på
`lib/kommunregister.ts`). En rad är en array med tio fält; nycklar upprepas inte.

Uppmätt i bygget 2026-09-14:

| kommun | rader | rå | gzip -9 | brotli | med matkategori | i ett område |
|---|---:|---:|---:|---:|---:|---:|
| stockholm | 8 555 | 550,7 kB | 170,0 kB | 132,5 kB | 3 128 | 7 226 av 84 områden |
| uppsala | 1 854 | 114,8 kB | 31,7 kB | 27,2 kB | 196 | 117 |
| linkoping | 1 249 | 82,9 kB | 24,4 kB | 21,1 kB | 435 | 303 |
| orebro | 1 231 | 78,4 kB | 22,4 kB | 19,4 kB | 275 | 107 |
| jonkoping | 1 137 | 78,3 kB | 22,4 kB | 19,5 kB | 312 | 386 |
| norrkoping | 1 022 | 67,1 kB | 18,1 kB | 15,8 kB | 0 | 0 |
| karlstad | 696 | 41,5 kB | 12,7 kB | 11,2 kB | 251 | 103 |
| borgholm | 406 | 21,8 kB | 6,1 kB | 5,5 kB | 19 | 0 |
| hoganas | 316 | 16,4 kB | 4,8 kB | 4,2 kB | 0 | 18 |
| oskarshamn | 242 | 16,6 kB | 5,4 kB | 4,8 kB | 46 | 0 |
| kristinehamn | 170 | 9,8 kB | 3,6 kB | 3,2 kB | 58 | 56 |
| lomma | 153 | 7,6 kB | 2,6 kB | 2,2 kB | 60 | 0 |
| svenljunga | 100 | 5,5 kB | 2,0 kB | 1,8 kB | 29 | 0 |

Hela riket är 1,09 MB rått.

**Stockholm är dyr, och det sägs rakt ut.** 132 kB brotlat är ungefär fem gånger
sidans egen HTML (25,5 kB gzip). Därför hämtas filen aldrig vid sidladdning, bara
vid första fokus eller tryck i sökrutan. Den som bara läser sidan betalar noll byte.

Jämfört med alternativet att bara filtrera den sida man står på:

| | byte vid laddning | byte vid första sökning | når i Stockholm |
|---|---:|---:|---:|
| filtrera sidan man står på | 0 | 0 | 100 av 8 555, 1,2 % |
| hämta registret vid avsikt (byggt) | 0 | 132,5 kB | 8 555 av 8 555 |
| hämta registret vid laddning (valt bort) | 132,5 kB | 0 | 8 555 av 8 555 |
| kartlistan (valt bort) | 0 | 183,2 kB | 8 555, men 639 av 1 231 i Örebro och 0 i Svenljunga |

Kartlistan är dessutom dyrare per rad, eftersom den bär koordinater och
rutornas fältnamn.

Täckningen avgör hur valen får se ut. Norrköping och Höganäs har ingen känd
matkategori alls, så matraden ritas inte där. Området kräver en koordinat inom en
avgränsning: 84 procent av Stockholm men 9 procent av Örebro, därför säger
statusraden hur många som inte kan placeras när ett område är valt.

## 5. Vad som valdes bort

- **Sortering eller filter på bedömning.** Förbjudet, inte utrett.
- **Kartlistan som datakälla.** Den bär bara rader med koordinat: 639 av 1 231 i
  Örebro, 0 av 100 i Svenljunga, och ingen fil alls i Svenljunga, Borgholm och
  Lomma. Filtret hade tappat hälften av Örebro utan att säga det.
- **Filtrera bara den sida man står på.** Noll byte, men når 100 av 8 555 i
  Stockholm, alltså 1,2 procent.
- **Ladda registret vid sidladdning.** Se kostnaden ovan; hämtningen sker vid
  första fokus eller tryck i rutan.
- **Frågesträng eller pushState för filtret.** Hade gett delbara men nya adresser.
  Ägaren köper sidor för SEO och inte för funktioner.
- **Kronologisk standardordning i HTML.** Se standardläget.
- **Kartan i samma ruta.** KartaPuff står kvar i sidopanelen; att låta den följa
  filtret kräver att kartan vaknar vid varje filtrering, och det är en egen
  avvägning mot kartans vikt.

## 6. Verifiering

Byggt i worktree med `npm run build -- --outDir dist-kommun`, serverat över http
med `text/javascript` för `.mjs`, och granskat i bild vid 1440 och vid 375 med
pekskärmsemulering (`maxTouchPoints` 5).

### Grindarna, ombygget 2026-09-14 21:52

- `prikko:sitemap-guard`: 16 150 URL:er, ingen motsäger sin egen noindex; kommuner
  208, samma som live. Ingen `kommunregister`-adress i någon sitemapfil.
- `prikko:lankar`: inga döda interna länkar bland 17 877 sidor.
- `prikko:filtak`: 18 173 filer, 79 827 kvar till taket.
- `prikko:nesting-guard`: inga nästlade CSS-regler.
- Sidindelningen oförändrad: Stockholm har kvar 85 filer under `sida/`, och ingen
  kommunsida bär noindex. Filtret skriver aldrig i adressfältet; `location.href`
  var `/orebro/` före och efter filtrering.

### Mätt på skärm

| | 1440 före | 1440 efter | 375 före | 375 efter |
|---|---|---|---|---|
| Örebro, första raden | y 467 | y 643 | y 787 | y 978 |
| Örebro, rader i första skärmen | 6 | 4 | 1 | 0 |
| Stockholm, första raden | | y 713 | | y 1 084 |
| Svenljunga, första raden | | y 603 | | y 764 |

Rutan kostar alltså 176 px på dator och 191 px på telefon innan registret börjar.
Det är priset för att sidan får ett sätt att hitta något alls, och det är mindre
än Hemnets kartband (första träffen på y 851).

### Beteende

- Ingen hämtning av registret vid sidladdning: 0 resursposter för
  `kommunregister` efter 1,5 s på `/orebro/`.
- Örebro, Pizza: 68 av 1 231, A till Ö, med raden om att matkategorin är känd för
  275 av 1 231. Sidnumreringen göms, inga rader bär avregistreringsmärket av misstag.
- Örebro, "kebab" och Senast kontrollerade: 10 träffar, 13 augusti 2026 först;
  filen var 78,7 kB okomprimerad över den lokala servern.
- Stockholm, Södermalm: 1 210 av 8 555, "Visa 100 till av 1 110", och raden om
  1 329 som ligger utanför områdena eller saknar läge.
- Stockholm vid 1440: åtta matval flest först plus "Fler 12"; efter "Fler" syns
  alla 20, `aria-expanded` blir true och fokus flyttar till Sushi 132.
- Vid 375: alla matval i rullraden (11 av 11 i Örebro, 20 av 20 i Stockholm),
  "Fler" dolt, ingen vågrät rullning av sidan (`scrollWidth` 375).
- Svenljunga: tre matval, inget områdesval, ordningsvalet i full bredd, 343 px.
- Rensa lämnar tillbaka den byggda sidan: 100 rader, "1 Rum och Kök" först,
  sidnumreringen synlig.
- Filtrets skript: 4,3 kB rått, 1,8 kB brotlat, plus den delade `slug`-modulen.

### Rättat under verifieringen

1. Matraden i Stockholm radbröt på tre våningar, 112 px. Nu flest först och åtta
   synliga på dator, resten bakom "Fler".
2. `.valj:only-of-type` slog aldrig, eftersom sökfältet också är en `<label>`.
   Ordningsvalet i Svenljunga var 168 px med en tom halva. Nu klassen `ensam`.
3. Statusraden sa "saknar läge" om alla utanför ett område, vilket var fel för de
   flesta i Örebro (639 med koordinat, 107 inom ett område).

## 7. Vad som inte blev gjort

- **Kartan följer inte filtret.** KartaPuff i sidopanelen visar hela kommunen
  även när listan är filtrerad.
- **Valet överlever inte bakåtknappen.** Utan frågesträng och utan sessionStorage
  är rutan tom när man kommer tillbaka från en verksamhetssida.
- **Stockholms fil är 132,5 kB brotlat vid första sökningen.** Den kan halveras
  genom att dela den per bokstav eller per matkategori, men då blir fritexten
  flera hämtningar. Inte prövat.
- **Sökningen matchar ordbörjan**, inte stavfel: "piza" ger ingenting.
