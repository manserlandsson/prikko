# Prikko

[prikko.se](https://prikko.se) samlar svenska kommuners offentliga
livsmedelskontroller och visar hur varje verksamhet klarade sin senaste
hygienkontroll. **17 130 verksamheter i 13 kommuner**, räknade ur 73 708
kontroller, uppdaterade varje natt.

Sajten är byggd, publik och indexerad. Specen är
[`docs/11_master_projektbibel.md`](docs/11_master_projektbibel.md), och den är
sanningen när den och den här filen säger emot varandra.

## Vad som finns

| | |
|---|---|
| Sajten | 17 891 statiska sidor, Astro, Cloudflare Pages |
| Kartan | MapLibre med eget rutarkiv, 14 384 verksamheter med känd plats |
| Öppna data | [`/api/v1/`](https://prikko.se/api/) som JSON, Atom-flöden per kommun |
| Maskinläsbart | JSON-LD per sida, `sitemap-index.xml`, `llms.txt` |
| Nattjobbet | hämtar tretton kommuner, laddar Supabase, exporterar och anmäler ändrade adresser till IndexNow |

## Struktur

```
site/        Astro-sajten
pipeline/    Python: hämta, normalisera, ladda, exportera
brand/       Designsystemet: tokens, logotyp, märket
docs/        Beslut, research och mätningar, numrerade i ordning
research/    Verifierad research med källor
```

## Utveckling

```bash
cd site
npm install
npm run dev      # http://localhost:4321
npm run build    # statisk utgåva
```

Bygget tar 8 till 15 minuter för knappt 18 000 sidor och har egna grindar: det
fäller om sitemapen säger emot en sidas `noindex`, om en intern länk är död,
eller om utgåvan närmar sig Cloudflares filtak.

## Principer som inte får brytas

Det här är inga stilpreferenser. De skyddar riktiga företags anseende och
projektets hållbarhet.

1. **Datan är innehållet.** Ingen AI-genererad brödtext, inga AI-genererade
   bilder.
2. **Bedömningen är vår slutsats, aldrig kommunens betyg.** Hela beräkningen är
   publicerad på [prikko.se/metodik](https://prikko.se/metodik/), och varje sida
   säger vilken kontroll den vilar på och vilket datum.
3. **Kvalitetsgrind på varje sida.** Saknas underlag visas ingen bedömning, och
   sidan indexeras inte. Ett gissat omdöme är orättvist mot verksamheten.
4. **Aldrig `Review` eller `AggregateRating` i strukturerad data.** Underlaget är
   myndighetsdata och inte omdömen insamlade hos oss. Schemat är
   `FoodEstablishment`.
5. **Aldrig färg ensamt.** Bedömningen bärs av färg, ansikte och text
   tillsammans.
6. **Kommuner rangordnas aldrig mot varandra**, och ingen lista framställer en
   namngiven verksamhet som något att undvika. Kommunerna kontrollerar och
   publicerar olika mycket, vilket är motiverat på metodiksidan.
7. **Verifiera, aldrig gissa.** Ett påstående utan mätning hör inte hemma
   varken i koden, i dokumenten eller på sajten. Det gäller den maskinläsbara
   sidan också: en härledd koordinat publiceras inte i JSON-LD, eftersom schemat
   saknar sätt att märka den som härledd.

## Data och rättigheter

Kontrolluppgifterna är allmänna handlingar från kommunernas livsmedelskontroll,
hämtade ur kommunens egen publicering eller öppna gränssnitt. Varje kommunsida
anger sin källa och sitt hämtdatum, och villkoren står på
[prikko.se/kallor](https://prikko.se/kallor/). Kartunderlag och kontaktkort
kommer från OpenStreetMap under ODbL.

**Koden i det här repot har ingen licens än**, vilket betyder att full
upphovsrätt gäller. Det är inte ett ställningstagande mot öppen källkod utan en
fråga som inte är avgjord.

Prikko drivs av Magoed AB och är ingen myndighet.
