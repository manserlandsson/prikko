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
