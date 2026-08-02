# R7 — Kategoriindelning för verksamheter

**Underlag: all data i `site/src/data/*.json` per 2026-08-02.**
6 kommuner, 14 540 verksamheter, **216 distinkta publicerade typvärden**.
Räknat, inte gissat — skripten ligger beskrivna i bilagan sist.

Förslag, inte implementation. Ingen kod är ändrad.

---

## Sammanfattning

1. **Fem toppkategorier** räcker och täcker allt: Restauranger, Caféer och
   bagerier, Butiker, Skolor och omsorg, Övrigt. Fyra av fem går att fylla i
   alla sex kommuner. Undantaget är Caféer, som Uppsala inte skiljer ut.
2. **"Hamburgerrestaurang" går inte att göra.** Ordet finns inte i någon av de
   sex kommunernas data — noll träffar. Se avsnittet om kökstyper.
3. **Undernivån ska inte vara ett nationellt filter.** Ingen underkategori
   finns i alla sex kommuner. Den ska bara erbjudas inne på en kommunsida, och
   bara de underkategorier just den kommunen faktiskt levererar.
4. Två databuggar hittades på vägen (komma-split och HTML-entiteter). Se
   "Fynd i datat".

---

## Steg 1 — Vad datat faktiskt innehåller

### Distinkta typvärden per kommun

| Kommun | Verksamheter | Publicerade strängar | Efter komma-split | Typvärden per verksamhet |
|---|---:|---:|---:|---|
| Stockholm | 8 511 | 83 | 83 | 1–9 (median 1) |
| Uppsala | 1 740 | **4** | 4 | alltid 1 |
| Linköping | 1 241 | 70 | 32 | 0, 2 eller 3 |
| Örebro | 1 234 | **6** | 6 | alltid 1 |
| Jönköping | 1 120 | 27 | 27 | alltid 2 |
| Karlstad | 694 | 53 | 33 | 2 eller 3 |

Fullständiga frekvenslistor: se mappningstabellen i Steg 3, som listar varje
värde med antal, sorterat på frekvens per kommun.

### Så är fälten uppbyggda

Varje kommun lägger in flera fält i samma `types`-lista. Betydelsen av en
position skiljer sig mellan kommunerna:

| Kommun | Vad listan innehåller | Grov nivå | Specifik nivå |
|---|---|---|---|
| Jönköping | `typ` + `kategori` | 5 värden | 22 värden |
| Karlstad | `kategori` + `inriktning` + lagerrubrik | 4 värden | 29 värden |
| Linköping | `verksamhet[]` + `allaInriktningar` | 4 värden | 28 värden |
| Stockholm | `Business` + `AllOtherBusinessTypes` | *saknas* | 31 huvudtyper + 52 tillägg |
| Uppsala | `Verksamhet` | 4 värden | *saknas* |
| Örebro | `Typ` | *saknas* | 6 värden, en enda nivå |

Stockholms värden är prefixade: `1.` = huvudverksamhet, `2.` = tilläggs­egenskap.
**Varenda stockholmsverksamhet har minst ett `1.`-värde** (kontrollerat: 0
undantag), och bara 21 av 8 511 har fler än ett. Det gör Stockholm till den
renaste källan trots flest värden — `2.`-värdena är attribut ("2. Kväll",
"2. Med fiskdisk", "2. Import"), inte verksamhetstyper, och får aldrig styra
kategorin.

### Fynd i datat

**Bugg 1 — kommaseparerade strängar splittas inte.** Karlstads `inriktning`
och Linköpings `allaInriktningar` innehåller flera värden i en sträng, men
adaptrarna lägger in strängen hel. Därför ser Karlstad ut att ha 53 typer och
Linköping 70 — i verkligheten 33 respektive 32. Värden som
`"Café, Säsong"`, `"Restaurang, Pizzeria"` och
`"Butik utan egen beredning, Café, Säsong"` finns i datat idag.
`pipeline/prikko/sources/karlstad.py:162` och
`pipeline/prikko/sources/linkoping.py:173`. Stockholm splittar redan korrekt.
**Splitten får inte göras generellt** — Uppsalas `Skolor, förskolor och annan
omsorg` är ett enda värde och skulle gå sönder.

**Bugg 2 — HTML-entiteter avkodas inte i Karlstad.** Värdet
`&gt;150 engångs/flergångs` (4 st) ligger rått i datat.

**Lucka — 78 verksamheter i Linköping (6,3 %) saknar `types` helt.**
Exempel: "Hungrish (Mobil verksamhet)", "Stycklokal - Grimstad",
"Gruppbostad LSS. Fogdegatan 20-21". Källan publicerar dem utan `verksamhet`.
Ingen kategoriindelning kan rädda dem; de måste hanteras som "kategori
saknas".

**Skräpvärden i Stockholm.** `smörgåsar` (25) och `fsk eller annan omsorg`
(15) är fritext som läckt in i ett annars prefixat fält.

### Samma ord betyder olika saker i olika kommuner

Detta är det viktigaste enskilda fyndet, och skälet till att mappningen måste
kunna nycklas per kommun:

| Råvärde | Jönköping | Karlstad | Linköping |
|---|---|---|---|
| `Bageri` | ligger under *Restaurang och servering* | under *Butik och handel* | under *Övriga verksamheter* |

| Råvärde | Kommun | Kommunens egen grovkategori |
|---|---|---|
| `Mottagningskök` | Jönköping | *Skola och omsorg* — 87 av 87 |
| `Mottagningskök/serveringskök` | Linköping | *Restaurang och servering* — 28 av 30 |

Samma ord, motsatt innebörd. Ett bageri hamnar i tre olika hinkar beroende på
vilken kommun som skrivit etiketten. Idag krockar inga strängar så illa att
en per-kommun-override behövs för att mappningen ska gå ihop, men tabellen
ska ha `(kommun, råvärde)` som nyckel med kommunen valfri, så överstyrningen
finns den dag den behövs.

---

## Steg 2 — Föreslagen indelning

### Toppnivå: fem kategorier

| id | Namn i gränssnittet | Underrubrik | Antal | Andel |
|---|---|---|---:|---:|
| `restaurang` | **Restauranger** | — | 5 639 | 38,8 % |
| `cafe` | **Caféer och bagerier** | — | 1 446 | 9,9 % |
| `butik` | **Butiker** | Mataffärer, kiosker, hälsokost | 1 976 | 13,6 % |
| `skola` | **Skolor och omsorg** | Förskolor, skolor, äldreboenden | 3 208 | 22,1 % |
| `ovrigt` | **Övrigt** | Tillverkare, grossister, lager | 2 193 | 15,1 % |
| — | *(kategori saknas)* | | 78 | 0,5 % |

Visas i den ordningen. **Övrigt sist och nedtonat** — det är restposten, inte
en jämbördig kategori.

### Täckning per kommun — den avgörande tabellen

| Kategori | Jönköping | Karlstad | Linköping | Örebro | Stockholm | Uppsala | Kommuner |
|---|---:|---:|---:|---:|---:|---:|---|
| Restauranger | 409 | 232 | 392 | 362 | 3 556 | 688 | **6/6** |
| Caféer och bagerier | 117 | 112 | 103 | 133 | 981 | **0** | **5/6** |
| Butiker | 184 | 103 | 181 | 192 | 1 082 | 234 | **6/6** |
| Skolor och omsorg | 308 | 150 | 385 | 352 | 1 512 | 501 | **6/6** |
| Övrigt | 102 | 97 | 102 | 195 | 1 380 | 317 | **6/6** |
| *(saknas)* | 0 | 0 | 78 | 0 | 0 | 0 | 1/6 |

**Uppsala är taket.** Fyra värden, punkt. Varje toppkategori som är finare än
Uppsalas fyra hinkar blir tom i Uppsala. Det gäller exakt en kategori: Caféer.
Uppsalas 688 caféer *och* restauranger ligger tillsammans under *Restaurang
och servering*.

Hantering: **visa inte café-filtret på Uppsalas kommunsida.** Skriv i stället
ut, på hubben: *"Uppsala skiljer inte caféer från restauranger. Caféer ligger
under Restauranger."* Ett filter som inte finns ljuger inte. Ett filter som
ger noll träffar gör det.

### Varför just de här fem

- **Café som egen toppkategori, trots Uppsala.** 1 446 verksamheter i fem av
  sex kommuner. Café och restaurang är olika ärenden för besökaren — det är
  den vanligaste uppdelningen på hitta.se och Yelp. Att slå ihop dem för att
  Uppsala inte kan skilja dem åt vore att låta den sämsta källan bestämma.
- **Bagerier ligger hos caféerna, inte hos butikerna.** Kommunerna är oense
  (se tabellen ovan), så vi måste välja. Besökaren gör ingen skillnad på ett
  bageri med disk och ett café — ärendet är detsamma. Konsekvens: Linköpings
  20 rena produktionsbagerier hamnar fel. Se osäkerhetslistan.
- **Skola och omsorg är EN kategori, inte två.** Att dela dem hade fungerat i
  Stockholm, Karlstad och Linköping — men Jönköpings `Tillagningskök` /
  `Mottagningskök` (287 st) säger ingenting om skola eller vård, Örebros
  `Tillagning` (352 st) inte heller, och Uppsala buntar ihop dem i namnet på
  sin egen etikett. Tre av sex hade fått ett tomt eller halvtomt filter.
  Uppdelningen finns kvar på undernivån där den går.
- **Tillverkning, grossist och lager ligger under Övrigt, inte som egen
  toppkategori.** Frestande att bryta ut — 1 836 verksamheter. Men Uppsalas
  317 och Örebros 195 ligger i odelbara restposter (`Övriga verksamheter`,
  `Buffert`) som innehåller precis dessa verksamheter utan att säga det. En
  egen toppkategori hade varit tom i två av sex kommuner samtidigt som
  verksamheterna faktiskt fanns, gömda i Övrigt. Sämsta tänkbara utfall.
- **Kiosker ligger hos butikerna.** Linköpings 15 kiosker ligger 15/15 under
  kommunens egen grovkategori *Butik*. Vi följer källan. Osäkert — en
  korvkiosk är ett ätställe. Se osäkerhetslistan.

### Undernivå

21 underkategorier. **Ingen av dem finns i alla sex kommuner.**

| Toppkategori | Underkategori | Antal | Kommuner |
|---|---|---:|---|
| Restauranger | Snabbmat och gatukök | 512 | 2/6 (Stockholm, Linköping) |
| | Pizzeria | 157 | 4/6 (saknas i Stockholm, Uppsala) |
| | Enklare servering | 100 | 2/6 |
| | Food truck och mobilt | 79 | 4/6 |
| | Catering | 55 | 3/6 |
| Caféer och bagerier | Café | 1 320 | 5/6 |
| | Bageri | 96 | 4/6 |
| Butiker | Livsmedelsbutik | 1 271 | 3/6 |
| | Kiosk | 63 | 2/6 |
| | Hälsokost och apotek | 53 | 3/6 |
| | Gårdsförsäljning | 13 | 1/6 |
| Skolor och omsorg | Förskola | 1 108 | 3/6 |
| | Vård och äldreomsorg | 529 | 4/6 |
| | Skola och fritids | 430 | 4/6 |
| Övrigt | Mellanhand och e-handel | 776 | 4/6 |
| | Grossist | 237 | 3/6 |
| | Tillverkning | 222 | 3/6 |
| | Huvudkontor | 192 | 2/6 |
| | Lager och transport | 187 | 3/6 |
| | Förpackningar | 21 | 1/6 |
| | Dricksvatten | 20 | 1/6 |

**Rekommendation: undernivån blir aldrig ett nationellt filter.** Den används
på två ställen:

1. **Som etikett på verksamhetssidan.** "Pizzeria" står bredvid namnet när
   kommunen säger det, och står inte där annars. Ingen kan bli lurad av en
   etikett som saknas.
2. **Som filter enbart inne på en kommunsida**, och bara med de
   underkategorier just den kommunen faktiskt levererar. Örebros filter får
   Pizzeria och Café. Uppsalas får inget alls. Stockholms får Snabbmat,
   Café, Bageri, Livsmedelsbutik, Kiosk, Förskola, Skola, Vård och sex till.

---

## Frågan om "Hamburgerrestaurang"

**Nej, det går inte. Inte i någon kommun.**

Sökning på `hamburg`, `burger`, `sushi`, `thai`, `kines`, `indisk`, `asiat`,
`italien`, `wok`, `falafel`, `taco`, `vegan`, `vegetar`, `buffé`, `sten`
över alla 14 540 verksamheters typvärden i alla sex kommuner:

| Kommun | Träffar |
|---|---|
| Jönköping | `pizz` 52 |
| Karlstad | `pizz` 43 |
| Linköping | `pizz` 48, `kebab` 5, `korv` 3 |
| Örebro | `pizz` 63 |
| Stockholm | `grill` 32 *(2. Grillad kyckling)*, `sallad` 25 *(2. Med sallader)* |
| Uppsala | **inga** |

Kökstyp finns alltså i en enda variant — **Pizzeria** — och saknas helt i
Stockholm, som ensamt är 58 % av datat. Även om vi byggde ett pizzafilter
skulle det ge noll träffar i Sveriges största kommun. Misstanken i uppdraget
stämmer, och den är värre än väntat: det handlar inte om två av sex kommuner,
det handlar om ett enda ord.

Stockholms `1. Snabbmatsrestaurang` (488) är närmast en hamburgerkategori,
men den är Stockholms och ingen annans, och den blandar hamburgare, kebab,
sallad och asiatiskt.

**Vad som faktiskt går att göra nationellt, i stigande ambition:**

1. **Ingenting nu.** Visa Pizzeria som etikett där den finns, aldrig som
   filter. Detta är rekommendationen.
2. **Kedjeigenkänning på namn.** McDonald's, Max, Burger King, Sibylla,
   O'Learys, Espresso House, Wayne's — matchas mot verksamhetsnamnet, som
   alla sex kommuner publicerar. Ger en verkligt nationell "Hamburgare"-
   etikett för kedjorna, men inte för fristående ställen. Ärlig om den märks
   ut som "känd kedja", inte som en fullständig kategori.
3. **Egen redaktionell inriktning.** Klassificera manuellt eller från extern
   källa. Dyrt, och en helt annan produkt än "vi speglar kommunernas data".

Alternativ 2 är den enda vägen till ett nationellt kökstypsfilter, och den
måste i så fall vara uttalat ofullständig i gränssnittet.

---

## Så väljs kategorin för en verksamhet

Varje råvärde får en **rang**:

- **rang 2 — specifik typ.** `Pizzeria`, `1. Förskola tillagning`, `Vårdkök`.
- **rang 1 — kommunens grovetikett.** `Restaurang och servering`,
  `Övriga verksamheter`, `Skolor, förskolor och annan omsorg`.
- **rang 0 — attribut.** `2. Kväll`, `Säsong`, `2. Import`, `2. Med fiskdisk`.
  Styr aldrig kategori. Kan senare visas som chip på verksamhetssidan.

Regeln: **högsta rang vinner.** Grovetiketten används bara när ingen specifik
typ finns — vilket är hela Uppsala och delar av alla andra.

**204 verksamheter (1,4 %) får två kategorier på samma rang** — främst
Stockholm (164), t.ex. `1. Café` + `1. Restaurang`. Lagra därför
`categories: []` som lista och filtrera på "innehåller". Sätt dessutom en
`category` för visning, vald i fast ordning
`restaurang > cafe > butik > skola > ovrigt`. Då försvinner ingen verksamhet
ur ett filter den hör hemma i.

---

## Steg 3 — Fullständig mappning

Varje råvärde som förekommer, per kommun, med antal och målkategori.
**Noll omappade värden** — kontrollerat maskinellt mot all data.
*(grov)* = rang 1, används bara i brist på specifikt värde.

### Jönköping — 27 värden

| Råvärde | Antal | Toppkategori | Underkategori |
|---|---:|---|---|
| `Restaurang och servering` | 526 | Restauranger *(grov)* | — |
| `Skola och omsorg` | 308 | Skolor och omsorg *(grov)* | — |
| `Restaurang` | 280 | Restauranger | — |
| `Tillagningskök` | 200 | Skolor och omsorg | — |
| `Butik och handel` | 198 | Butiker *(grov)* | — |
| `Butik` | 146 | Butiker *(grov)* | — |
| `Café` | 90 | Caféer och bagerier | Café |
| `Mottagningskök` | 87 | Skolor och omsorg | — |
| `Pizzeria` | 52 | Restauranger | Pizzeria |
| `Övriga` | 48 | Övrigt *(grov)* | — |
| `Förening` | 41 | Restauranger | — |
| `Tillverkare` | 40 | Övrigt *(grov)* | — |
| `Lager/Transport/Omlastning` | 39 | Övrigt | Lager och transport |
| `Bageri` | 27 | Caféer och bagerier | Bageri |
| `Mobil verksamhet` | 27 | Restauranger | Food truck och mobilt |
| `Hälsokost` | 25 | Butiker | Hälsokost och apotek |
| `Tillverkare av konfektyr` | 19 | Övrigt | Tillverkning |
| `Fritidsverksamhet` | 15 | Skolor och omsorg | Skola och fritids |
| `Grossist` | 14 | Övrigt | Grossist |
| `Gårdsförsäljning` | 13 | Butiker | Gårdsförsäljning |
| `Tillverkare övriga livsmedel` | 11 | Övrigt | Tillverkning |
| `Tillverkare av dryck` | 10 | Övrigt | Tillverkning |
| `Cateringverksamhet` | 9 | Restauranger | Catering |
| `Hemtjänst` | 6 | Skolor och omsorg | Vård och äldreomsorg |
| `Matmäklare` | 6 | Övrigt | Mellanhand och e-handel |
| `Övrigt` | 2 | Övrigt *(grov)* | — |
| `Viltanläggning` | 1 | Övrigt | Tillverkning |

### Karlstad — 33 värden *(efter komma-split, se buggen ovan)*

| Råvärde | Antal | Toppkategori | Underkategori |
|---|---:|---|---|
| `Restaurang och servering` | 338 | Restauranger *(grov)* | — |
| `Restaurang` | 230 | Restauranger | — |
| `Skola och omsorg` | 150 | Skolor och omsorg *(grov)* | — |
| `Café` | 122 | Caféer och bagerier | Café |
| `Butik och handel` | 109 | Butiker *(grov)* | — |
| `Butik` | 104 | Butiker *(grov)* | — |
| `Övrigt` | 97 | Övrigt *(grov)* | — |
| `Övriga verksamheter` | 97 | Övrigt *(grov)* | — |
| `Butik utan egen beredning` | 75 | Butiker | Livsmedelsbutik |
| `Förskolekök` | 74 | Skolor och omsorg | Förskola |
| `Mottagningskök förskola` | 55 | Skolor och omsorg | Förskola |
| `Pizzeria` | 43 | Restauranger | Pizzeria |
| `Skolkök` | 41 | Skolor och omsorg | Skola och fritids |
| `Grossist/lager/transport` | 39 | Övrigt | Grossist |
| `Vårdkök` | 35 | Skolor och omsorg | Vård och äldreomsorg |
| `Butik med egen beredning` | 31 | Butiker | Livsmedelsbutik |
| `Tillagningskök skola` | 31 | Skolor och omsorg | Skola och fritids |
| `Kosttillskott` | 29 | Övrigt | Mellanhand och e-handel |
| `Mottagningskök vård` | 23 | Skolor och omsorg | Vård och äldreomsorg |
| `Tillverkare` | 19 | Övrigt *(grov)* | — |
| `Tillagningskök förskola` | 19 | Skolor och omsorg | Förskola |
| `Mobil anläggning` | 15 | Restauranger | Food truck och mobilt |
| `Tillagningskök vård` | 12 | Skolor och omsorg | Vård och äldreomsorg |
| `Food trucks` | 11 | Restauranger | Food truck och mobilt |
| `Säsong` | 11 | *attribut — styr ingen kategori* | — |
| `Huvudkontor` | 11 | Övrigt | Huvudkontor |
| `Mottagningskök skola` | 10 | Skolor och omsorg | Skola och fritids |
| `Bageri` | 8 | Caféer och bagerier | Bageri |
| `Hantering i hemlika förhållanden` | 7 | *attribut — styr ingen kategori* | — |
| `&gt;150 engångs/flergångs` | 4 | *attribut — styr ingen kategori* | — |
| `Skyddad beteckning` | 1 | *attribut — styr ingen kategori* | — |
| `Fri från-livsmedel` | 1 | *attribut — styr ingen kategori* | — |
| `Matmäklare` | 1 | Övrigt | Mellanhand och e-handel |

### Linköping — 32 värden *(efter komma-split, se buggen ovan)*

| Råvärde | Antal | Toppkategori | Underkategori |
|---|---:|---|---|
| `Restaurang och servering` | 474 | Restauranger *(grov)* | — |
| `Skola och omsorg` | 415 | Skolor och omsorg *(grov)* | — |
| `Restaurang` | 250 | Restauranger | — |
| `Butik` | 187 | Butiker *(grov)* | — |
| `Övriga verksamheter` | 113 | Övrigt *(grov)* | — |
| `Förskolekök mottagning` | 99 | Skolor och omsorg | Förskola |
| `Café` | 94 | Caféer och bagerier | Café |
| `Livsmedelsbutik ej hantering` | 84 | Butiker | Livsmedelsbutik |
| `Livsmedelsbutik med hantering` | 68 | Butiker | Livsmedelsbutik |
| `Förskolekök tillagning` | 62 | Skolor och omsorg | Förskola |
| `Gruppboende` | 50 | Skolor och omsorg | Vård och äldreomsorg |
| `Pizzeria` | 48 | Restauranger | Pizzeria |
| `Distributör` | 46 | Övrigt | Lager och transport |
| `Skolkök tillagning` | 42 | Skolor och omsorg | Skola och fritids |
| `Mobil anläggning` | 36 | Restauranger | Food truck och mobilt |
| `Skolkök mottagning` | 31 | Skolor och omsorg | Skola och fritids |
| `Mottagningskök/serveringskök` | 30 | Restauranger | Enklare servering |
| `Äldreboende mottagningskök` | 30 | Skolor och omsorg | Vård och äldreomsorg |
| `US Avdelningskök` | 27 | Skolor och omsorg | Vård och äldreomsorg |
| `Daglig verksamhet` | 27 | Skolor och omsorg | Vård och äldreomsorg |
| `Äldreboende tillagningskök` | 26 | Skolor och omsorg | Vård och äldreomsorg |
| `Livsmedelslager` | 26 | Övrigt | Lager och transport |
| `Bageri` | 25 | Caféer och bagerier | Bageri |
| `Industriell tillv och bered` | 24 | Övrigt | Tillverkning |
| `Apotek` | 21 | Butiker | Hälsokost och apotek |
| `Gatukök` | 16 | Restauranger | Snabbmat och gatukök |
| `Kiosk` | 15 | Butiker | Kiosk |
| `Frukostservering` | 14 | Restauranger | Enklare servering |
| `Kosttillskott` | 14 | Övrigt | Mellanhand och e-handel |
| `Kebabhantering` | 5 | Restauranger | Snabbmat och gatukök |
| `Catering` | 4 | Restauranger | Catering |
| `Korv` | 3 | Restauranger | Snabbmat och gatukök |

### Örebro — 6 värden

| Råvärde | Antal | Toppkategori | Underkategori |
|---|---:|---|---|
| `Tillagning` | 352 | Skolor och omsorg | — |
| `Restaurang` | 299 | Restauranger | — |
| `Buffert` | 195 | Övrigt *(grov)* | — |
| `Butik` | 192 | Butiker *(grov)* | — |
| `Café` | 133 | Caféer och bagerier | Café |
| `Pizzeria` | 63 | Restauranger | Pizzeria |

### Stockholm — 83 värden

| Råvärde | Antal | Toppkategori | Underkategori |
|---|---:|---|---|
| `1. Restaurang` | 2854 | Restauranger | — |
| `1. Butik` | 1069 | Butiker | Livsmedelsbutik |
| `1. Café` | 960 | Caféer och bagerier | Café |
| `2. Kopplad till HK` | 816 | *attribut — styr ingen kategori* | — |
| `1. Förskola tillagning` | 570 | Skolor och omsorg | Förskola |
| `2. Kväll` | 521 | *attribut — styr ingen kategori* | — |
| `1. Snabbmatsrestaurang` | 488 | Restauranger | Snabbmat och gatukök |
| `1. Matmäklare` | 361 | Övrigt | Mellanhand och e-handel |
| `1. Kosttillskott` | 323 | Övrigt | Mellanhand och e-handel |
| `1. Förskola mottagning` | 309 | Skolor och omsorg | Förskola |
| `2. Införsel` | 236 | *attribut — styr ingen kategori* | — |
| `2. Import` | 213 | *attribut — styr ingen kategori* | — |
| `1. Grossist` | 186 | Övrigt | Grossist |
| `1. Huvudkontor` | 185 | Övrigt | Huvudkontor |
| `2. E-handel` | 185 | *attribut — styr ingen kategori* | — |
| `1. Skola tillagning` | 162 | Skolor och omsorg | Skola och fritids |
| `1. Vård/omsorg mottagning` | 141 | Skolor och omsorg | Vård och äldreomsorg |
| `1. Skola mottagning` | 137 | Skolor och omsorg | Skola och fritids |
| `1. Vård/omsorg tillagning` | 134 | Skolor och omsorg | Vård och äldreomsorg |
| `1. Tillverkning` | 131 | Övrigt | Tillverkning |
| `2. Säsong sommar` | 130 | *attribut — styr ingen kategori* | — |
| `2. I hemmet` | 117 | *attribut — styr ingen kategori* | — |
| `2. EMV` | 94 | *attribut — styr ingen kategori* | — |
| `2. Butik` | 88 | *attribut — styr ingen kategori* | — |
| `2. Bageri` | 87 | *attribut — styr ingen kategori* | — |
| `2. Med mobil verksamhet` | 82 | *attribut — styr ingen kategori* | — |
| `2. Mobil` | 75 | Restauranger | Food truck och mobilt |
| `2. Catering` | 71 | Restauranger | Catering |
| `2. Båt` | 66 | *attribut — styr ingen kategori* | — |
| `1. Transportör` | 64 | Övrigt | Lager och transport |
| `1. Hemtjänst` | 62 | Skolor och omsorg | Vård och äldreomsorg |
| `2. Café` | 58 | Caféer och bagerier | Café |
| `1. Enklare servering` | 57 | Restauranger | Enklare servering |
| `1. E-handel` | 54 | Övrigt | Mellanhand och e-handel |
| `1. Bageri` | 50 | Caféer och bagerier | Bageri |
| `1. Kiosk` | 50 | Butiker | Kiosk |
| `2. Huvudkontor` | 47 | *attribut — styr ingen kategori* | — |
| `1. Catering` | 45 | Restauranger | Catering |
| `2. Transportör` | 45 | *attribut — styr ingen kategori* | — |
| `1. 853` | 38 | Övrigt | Tillverkning |
| `2. Grillad kyckling` | 32 | *attribut — styr ingen kategori* | — |
| `2. Med fiskdisk` | 30 | *attribut — styr ingen kategori* | — |
| `2. Grossist` | 29 | *attribut — styr ingen kategori* | — |
| `2. Med köttdisk` | 28 | *attribut — styr ingen kategori* | — |
| `2. Med servering` | 28 | *attribut — styr ingen kategori* | — |
| `2. Med sallader` | 25 | *attribut — styr ingen kategori* | — |
| `smörgåsar` | 25 | *attribut — styr ingen kategori* | — |
| `2. Glass` | 24 | *attribut — styr ingen kategori* | — |
| `2. Tillverkning` | 23 | *attribut — styr ingen kategori* | — |
| `2. Restaurang` | 23 | Restauranger | — |
| `2. Med bageri` | 22 | *attribut — styr ingen kategori* | — |
| `1. Kontaktmaterialverksamhet` | 22 | Övrigt | Förpackningar |
| `1. Lager` | 21 | Övrigt | Lager och transport |
| `2. Med tillagning` | 20 | *attribut — styr ingen kategori* | — |
| `2. Med bearbetade animalier` | 16 | *attribut — styr ingen kategori* | — |
| `2. Leverans till skolor` | 15 | Skolor och omsorg | Skola och fritids |
| `fsk eller annan omsorg` | 15 | Skolor och omsorg | Förskola |
| `2. Kosttillskott` | 14 | *attribut — styr ingen kategori* | — |
| `2. Matmäklare` | 14 | *attribut — styr ingen kategori* | — |
| `2. Med FCM` | 14 | *attribut — styr ingen kategori* | — |
| `1. Dricksvattenpost` | 14 | Övrigt | Dricksvatten |
| `1. Torghandel` | 14 | Restauranger | Food truck och mobilt |
| `2. Undantag 853-anläggning` | 13 | *attribut — styr ingen kategori* | — |
| `1. Fritidshem` | 12 | Skolor och omsorg | Skola och fritids |
| `2. Med vegetabilier` | 12 | *attribut — styr ingen kategori* | — |
| `2. Säsong vinter` | 12 | *attribut — styr ingen kategori* | — |
| `2. Matdemonstrationer` | 10 | *attribut — styr ingen kategori* | — |
| `2. Med ABP` | 8 | *attribut — styr ingen kategori* | — |
| `2. Lager` | 7 | *attribut — styr ingen kategori* | — |
| `2. Snabbmatsrestaurang` | 7 | Restauranger | Snabbmat och gatukök |
| `1. Apotek` | 7 | Butiker | Hälsokost och apotek |
| `1. Matdemonstrationer` | 7 | Övrigt | — |
| `1. Dricksvatten - Distributionsnät` | 6 | Övrigt | Dricksvatten |
| `2. Med Livsmedel (för FCM)` | 6 | *attribut — styr ingen kategori* | — |
| `2. Korttidstillstånd` | 5 | *attribut — styr ingen kategori* | — |
| `2. Vagn` | 5 | Restauranger | Food truck och mobilt |
| `2. Med matlådor` | 5 | *attribut — styr ingen kategori* | — |
| `2. Förpackade livsmedel` | 5 | *attribut — styr ingen kategori* | — |
| `2. Food truck` | 4 | Restauranger | Food truck och mobilt |
| `2. Export` | 2 | *attribut — styr ingen kategori* | — |
| `2. Fristående` | 2 | *attribut — styr ingen kategori* | — |
| `2. Fri från (SLV)` | 2 | *attribut — styr ingen kategori* | — |
| `2. Cykel` | 1 | Restauranger | Food truck och mobilt |

### Uppsala — 4 värden

| Råvärde | Antal | Toppkategori | Underkategori |
|---|---:|---|---|
| `Restaurang och servering` | 688 | Restauranger *(grov)* | — |
| `Skolor, förskolor och annan omsorg` | 501 | Skolor och omsorg *(grov)* | — |
| `Övriga verksamheter` | 317 | Övrigt *(grov)* | — |
| `Butiker och annan handel` | 234 | Butiker *(grov)* | — |

---

## Osäkra placeringar — markerade, inte bortförklarade

Elva värden där jag valt en sida men inte kan stå för den fullt ut. De bör
granskas som produktbeslut.

| Råvärde | Antal | Placerad i | Varför osäker |
|---|---:|---|---|
| `Buffert` (Örebro) | 195 | Övrigt | Kommunens interna restpost. Namnproven visar bryggerier, chokladtillverkare, rökerier, åkerier, DHL-terminaler — men även bagerier ("Rosta Bageri", "Smörgåsbutikens Bageri") och mobil servering ("Mobil Livsmedelsverksamhet JE"). Övervägande Övrigt, men rymmer ställen som borde legat under Caféer och Restauranger. **Örebro kan alltså inte leverera Övrigt-underkategorier alls.** |
| `Bageri` | 96 | Caféer och bagerier | Tre kommuner placerar det i tre olika grovkategorier. Linköpings 20 ligger under *Övriga verksamheter* och är sannolikt produktionsbagerier utan disk. |
| `Kiosk` | 63 | Butiker | Linköping placerar dem 15/15 under *Butik*, så vi följer källan. Men en korvkiosk är ett ätställe. Datat kan inte skilja dem åt. |
| `Kosttillskott` | 366 | Övrigt / Mellanhand | Låg *inte* i Butiker. Stockholms 323 samförekommer med `2. E-handel` (76), `2. Huvudkontor` (42) och `2. Import` (8) — inte butik. Karlstad och Linköping placerar dem själva under *Övriga verksamheter*. |
| `Livsmedelslager` (Linköping) | 26 | Övrigt / Lager | 24 av 26 ligger under kommunens grovkategori *Skola och omsorg* — kommunala centrallager. Här följer jag det specifika värdet och inte grovetiketten. Motsatt val vore också försvarbart. |
| `1. Torghandel` (Stockholm) | 14 | Restauranger / Mobilt | Kan lika gärna vara råvaruförsäljning som matservering. |
| `Förening` (Jönköping) | 41 | Restauranger | Kommunen placerar dem under *Restaurang och servering* — troligen idrottsföreningars kiosker. Vi följer kommunen. |
| `Mottagningskök/serveringskök` (Linköping) | 30 | Restauranger / Enklare servering | Ordet betyder motsatsen till Jönköpings `Mottagningskök`. Följer kommunens egen grovkategori (28/30 *Restaurang och servering*). |
| `Apotek` | 28 | Butiker | Säljer kosttillskott och barnmat, men är inte en matbutik i vardaglig mening. |
| `US Avdelningskök` (Linköping) | 27 | Skolor och omsorg / Vård | Universitetssjukhusets avdelningskök. Rimligt men lokalt. |
| `fsk eller annan omsorg` (Stockholm) | 15 | Skolor och omsorg / Förskola | Fritext som läckt in i ett prefixat fält. "fsk" tolkat som förskola. |

---

## Namn på svenska

| id | Namn | Underrubrik i gränssnittet | Valt framför |
|---|---|---|---|
| `restaurang` | **Restauranger** | — | "Restaurang och servering" (kommunernas ord, myndighetssvenska) |
| `cafe` | **Caféer och bagerier** | — | "Fik" (för vardagligt för en sajt som ska kännas pålitlig) |
| `butik` | **Butiker** | Mataffärer, kiosker och hälsokost | "Butik och handel", "Butiker och annan handel" |
| `skola` | **Skolor och omsorg** | Förskolor, skolor, äldreboenden och annan omsorg | "Skolor, förskolor och annan omsorg" (för långt), "Storkök" (fackspråk) |
| `ovrigt` | **Övrigt** | Tillverkare, grossister, lager och annat du inte besöker | "Tillverkning och partihandel" (partihandel är ett myndighetsord, och namnet hade ljugit om Uppsalas och Örebros restposter) |

Underkategoriernas namn: Pizzeria, Snabbmat och gatukök, Enklare servering,
Food truck och mobilt, Catering, Café, Bageri, Livsmedelsbutik, Kiosk,
Hälsokost och apotek, Gårdsförsäljning, Förskola, Skola och fritids,
Vård och äldreomsorg, Tillverkning, Grossist, Lager och transport,
Mellanhand och e-handel, Huvudkontor, Förpackningar, Dricksvatten.

Två anmärkningar:

- **"Skolor och omsorg"** är den svagaste av de fem. "Omsorg" är på gränsen
  till myndighetsord. Men alternativen utesluter delar av innehållet —
  "äldreboenden" missar gruppboende, daglig verksamhet och hemtjänst — och
  fyra av sex kommuner kallar det redan detta. Underrubriken får bära
  klarspråket.
- **"Mellanhand och e-handel"** ersätter kommunernas `Matmäklare`, som ingen
  utanför branschen förstår.

---

## Okända framtida värden

Nya kommuner kommer med nya råvärden. Kravet är att ett okänt värde **aldrig
tyst hamnar i Övrigt**. Fem delar:

**1. Mappningen är en explicit tabell, inte en heuristik.**
Föreslagen plats: `pipeline/prikko/categories.py`, med `(kommun, råvärde)`
som nyckel där kommunen är valfri. Ingen strängmatchning, inga prefixregler,
ingen fuzzy matching. Ett värde är antingen med i tabellen eller okänt.

**2. Okänt värde ger `category = null` — inte `ovrigt`.**
De två är olika saker och får aldrig blandas ihop. `null` betyder "vi vet
inte", `ovrigt` betyder "vi vet, och det är en grossist".

**3. Två lägen i pipelinen.**

| Läge | Var | Beteende vid okänt värde |
|---|---|---|
| `strict` | tester och CI | `UnknownSourceValue` — bygget faller. Ett nytt värde kan inte smyga in oupptäckt. |
| `warn` | nattlig produktionskörning | Verksamheten får `category = null` och körningen fortsätter. En ny typ i Stockholm får inte blockera hela uppdateringen. |

**4. Okända värden skrivs till en fil som är omöjlig att missa.**
`pipeline/unknown_types.json`: kommun, råvärde, antal verksamheter, datum
första gången sett. Körningen skriver ut en sammanfattning i klartext, och
**avbryter om andelen okategoriserade överstiger 1 % av kommunens
verksamheter** — då är det inte en ny nisch, då har källan lagt om sin modell.

**5. Sajten säger det högt.**
En verksamhet med `category = null` har sin sida och går att söka fram, men
syns inte i något kategorifilter. Kommunhubben skriver ut, under filtret:
*"N verksamheter saknar kategori."* Det gäller redan idag — Linköpings 78
utan `types` är exakt det fallet, och de ska visas som saknade, inte gömmas
i Övrigt.

**Låsande test.** Ett enhetstest som läser alla `site/src/data/*.json` och
kräver noll omappade värden. Det låser dagens 216 strängar och gör varje
framtida tillskott synligt i en diff.

---

## Att bestämma innan bygget

1. **Café som egen toppkategori trots att Uppsala inte kan fylla den** —
   ja eller nej? Alternativet är fyra kategorier och café som underkategori.
   Min rekommendation: ja, med filtret dolt i Uppsala.
2. **Bagerier hos caféerna eller hos butikerna?** Kommunerna är oense. Min
   rekommendation: caféerna.
3. **Kiosker hos butikerna eller hos restaurangerna?** Min rekommendation:
   butikerna, enligt källan.
4. **Ska attributen (`2. Kväll`, `Säsong`, `2. Med fiskdisk`, `2. Båt`) sparas
   alls?** De styr ingen kategori men är 43 distinkta värden med verkligt
   innehåll — "kvällsöppet", "säsong", "på båt". Kan bli chips på
   verksamhetssidan i ett senare steg. Finns bara i Stockholm och Karlstad.
5. **Ska Bugg 1 och 2 fixas före kategoriindelningen?** Ja — mappningen ovan
   förutsätter att Karlstads och Linköpings kommaseparerade strängar splittas,
   och att `&gt;` avkodas.

---

## Bilaga — så räknades det

Tre skript kördes mot `site/src/data/*.json`:

1. Alla distinkta `types`-värden per kommun med antal, sorterat på frekvens.
2. Slotanalys — vilken position i listan som bär grov respektive specifik typ,
   plus samförekomst mellan specifikt värde och kommunens egen grovetikett.
   Det var så `Mottagningskök`, `Bageri`, `Kiosk` och `Buffert` avgjordes:
   genom att räkna vad kommunen själv grupperar dem under, inte genom att
   tolka ordet.
3. Validering av mappningen mot varje enskild verksamhet: noll omappade
   värden, 78 utan kategori (alla Linköping, alla utan `types` i källan),
   204 med fler än en kategori.

Örebros datafil skrevs under arbetets gång och är inräknad.
