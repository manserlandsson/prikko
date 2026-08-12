# Artiklarnas bilder

Den här filen är instruktion, inte artikel. Den är undantagen i
`content.config.ts` och i `lib/artiklar.ts`, så den blir aldrig en sida.

## Var filen ska ligga

```
site/src/assets/artiklar/<samma namn som artikelns .mdx-fil>.jpg
```

Filnamnet **är** kopplingen. Artikeln `sa-laser-du-en-hygienkontroll.mdx` får
sin bild från `sa-laser-du-en-hygienkontroll.jpg`. Ingen sökväg skrivs någonstans
i frontmattern, och byter en artikel filnamn ska bilden byta namn med den.

Lägg aldrig bilden i `public/`. Filer där går förbi Astros bildpipeline och
skickas ut i originalstorlek till varje besökare.

## Format och storlek

| | |
|---|---|
| Format | JPEG (`.jpg`) |
| Storlek | 1400 × 788 px, alltså 16:9 |
| Komprimering | mozjpeg, kvalitet 80 |
| Filnamn | gemener, bindestreck, inga å ä ö |

Samma mått som stadsfotona i `src/assets/stad/`, av samma skäl: bilden visas i
16:9 både på kortet i listan och överst i artikeln, och en källfil i fel
proportion beskärs av webbläsaren på ett sätt du inte har sett.

Beskär till 1400 × 788 innan filen läggs in. Astro skalar **ned** till 680,
1080 och 1400 px och skriver webp, men den beskär inte och den kan inte lyfta
en fil som är mindre än så.

Originalet i full storlek ska inte checkas in. Behåll det i `brand/`, som är
ignorerad för de här filerna.

## Vad som ska stå i frontmattern

```yaml
image:
  alt: "Kock med ryggen mot kameran vid passet i ett kommersiellt kök."
  source: "Pexels"
  credit: "Fotografens namn"
  creditUrl: "https://www.pexels.com/photo/…"
```

- **`alt` krävs.** Utan den byggs inte sidan. En bild utan alt-text är en tom
  lucka för den som lyssnar på sidan i stället för att se den. Beskriv vad
  bilden visar, inte vad artikeln handlar om: rubriken står redan intill.
  15–160 tecken.
- **`source` krävs.** Var bilden är hämtad, till exempel `Pexels`.
- **`credit` är fotografens namn.** Fältet är valfritt bara därför att det finns
  bilder vars upphovsperson inte går att spåra i efterhand. **Går namnet att få
  tag på ska det fyllas i**, även långt efteråt: fyll i det på en bild som
  ligger uppe, det syns direkt i bildtexten och i listan på källsidan. Ett tomt
  fält är ärligt, ett påhittat namn är en tillskrivning till fel person.
  De tre första bilderna ligger utan namn av just det skälet.
- **`creditUrl`** är länken till fotot hos källan, när det finns en.

Utelämna hela `image:`-blocket om artikeln inte har någon bild. Kortet och
artikelsidan är byggda för att se hela ut utan.

## Vad som stoppar bygget

Fil och frontmatter måste följas åt åt båda håll, och `lib/artikelbilder.ts`
kastar om de inte gör det:

- fil i `assets/artiklar/` men inget `image:` i frontmattern → en bild utan
  alt-text skulle publiceras
- `image:` i frontmattern men ingen fil → en bild har försvunnit i en flytt

Båda felen ska upptäckas vid bygget och inte av en läsare.

## Vad som aldrig får läggas in

- **AI-genererade bilder.** Bibeln §6. Gäller även bearbetningar och "bara
  bakgrunden".
- **Bilder med läsbara verksamhetsnamn**, skyltar eller logotyper. En namngiven
  restaurang bredvid en text om hygienbrister påstår något om just den
  verksamheten. Beskär bort namnet, eller välj en annan bild.
- **Identifierbara personer i närbild.** Ryggtavlor och händer går bra.
- **Bilder som ser ut att vara tagna hos en verksamhet vi bedömer.** Bilden
  visar ett sammanhang, aldrig ett exempel.

## Var krediterna hamnar

Två ställen, båda automatiska: bildtexten under bilden i artikeln, och listan
under "Bilderna i artiklarna" på `/kallor/`. Ingen av dem skrivs för hand, båda
läser samma frontmatter.

## Dubbletterna är åtgärdade

Mätningen görs med en perceptuell jämförelse av alla filer, nedskalade till
16 x 16 gråsteg och jämförda parvis. Skalan är 0 till 255 per bildpunkt, och
allt under omkring 5 är samma beskärning omkodad en gång till.

Den 11 augusti 2026 låg tre par nära varandra. Alla tre är lösta den 12
augusti, och det närmaste paret ligger nu på 42,8, alltså långt från allt som
läser som samma bild:

| Artikel | Bild |
|---|---|
| `skolmaten-ar-den-renaste-maten` | Ny, ur `brand/storkok-personal.jpg`. Artikeln saknade bild helt. |
| `hur-ofta-kontrolleras-en-restaurang` | Ny, ur `brand/pexels-aysenur-sahin-57769289-30308756.jpg`. Ersatte en andra beskärning av kockbilden. |
| `darfor-gar-kommunernas-siffror-inte-att-jamfora` | Ny, ur `brand/konditori-disk.jpg`. Ersatte en andra beskärning av klämbrädesbilden. |

Två beskärningar är gjorda med bestämd avsikt och ska inte flyttas tillbaka:

- Kafébilden är beskuren till höger om entrén, eftersom verksamhetens namn står
  läsbart på dörren i originalet.
- Konditoribilden är beskuren till höger om de gula plåtburkarna, som bär ett
  läsbart varumärke. Det som blir kvar är rader av likadana kantiner med olika
  innehåll, vilket är precis den bild artikeln behöver.

### Artiklar som fortfarande saknar bild

Sex artiklar har ingen bild, eftersom det inte finns fler obrukade original i
`brand/`. Sidorna fungerar och ser hela ut utan, men de ska få varsin. Motiv,
inte stämning, och samma regler som ovan:

1. **`matforgiftning-fran-restaurang`**. Motiv: ett tomt kuvert på ett
   restaurangbord efter måltiden, eller en dukning i motljus utan gäster.
   Undvik allt som ser sjukt ut. Sökord på Pexels: `empty restaurant table
   after meal`, `restaurant place setting daylight`.

2. **`inkubationstid-matforgiftning`**. Artikeln handlar om tid. Motiv: en
   klocka på en kökvägg i ett storkök, eller en timer på en rostfri bänk.
   Sökord: `commercial kitchen clock`, `kitchen timer stainless steel`.

3. **`kylkedjan-brister-oftast-pa-sommaren`**. Motiv: ett kylrum inifrån med
   backar på rostfria hyllor, eller en termometer i en kyldisk. Tomt på
   människor, inga läsbara varumärken på förpackningarna. Sökord: `walk in
   cooler shelves`, `refrigerator thermometer commercial`.

De tre artiklarna från den 12 augusti står utan bild av samma skäl. Motiven
nedan är valda så att de går att skilja från varandra och från de nio bilder som
redan ligger inne, alltså inte ännu en kaklad köksvägg:

4. **`skadedjur-ar-den-ovanligaste-anmarkningen`**. Artikeln handlar om det som
   hålls ute, inte om djuret. Visa aldrig en råtta eller en kackerlacka: bilden
   ligger bredvid namngivna verksamheter i flödet och skulle läsa som ett
   påstående om dem. Motiv: en stängd lastkaj eller en tät bakdörr av stål mot en
   gränd, eller ett förråd med varor på rostfria hyllor ovanför golvet. Tomt på
   människor. Sökord på Pexels: `restaurant back door alley`, `metal shelving
   storage room`, `loading dock closed door`.

5. **`sa-hittar-du-de-frascha-restaurangerna`**. Artikeln handlar om att välja,
   inte om att städa. Motiv: en gata med flera matställen intill varandra i
   dagsljus, sedd på håll, eller ett fönsterbord med utsikt mot gatan. Ljust och
   vardagligt. Alla skyltar måste vara oläsliga eller beskurna, vilket är
   svårare på just det här motivet än på de andra. Sökord: `street with cafes
   daylight`, `restaurant window seat street view`.

6. **`hur-en-livsmedelskontroll-gar-till`**. Läsaren är den som driver stället,
   och motivet ska vara arbetsdagen och inte inspektionen. Motiv: en rostfri
   arbetsbänk sedd rakt uppifrån med redskap och en anteckningsbok, eller ett
   kök före öppning med tänd belysning och tomma pass. Undvik personer i
   skyddskläder som pekar och antecknar: den bilden ligger redan på
   `anmalda-kontroller-hittar-farre-fel`. Sökord: `stainless steel prep counter
   overhead`, `empty commercial kitchen before service`.

Originalet i full storlek läggs i `brand/`, beskärningen till 1400 x 788 i
`src/assets/artiklar/`.
