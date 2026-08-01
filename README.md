# Prikko

Nationell, SEO-först konsumentsajt som samlar svenska kommuners offentliga
livsmedelskontroller till ett jämförbart hygienbetyg per restaurang — med karta,
kontrollhistorik och verksamhetens svar.

Specen är [`docs/11_master_projektbibel.md`](docs/11_master_projektbibel.md).
Den är sanningen; den här filen beskriver bara hur man kör koden.

## Struktur

```
site/        Astro-sajten (publik, SEO-bärande)
pipeline/    Python: hämta → normalisera → Supabase
brand/       Designsystem: tokens.css, logotyp, mockups
docs/        Strategi, research och arkitekturbeslut (ADR)
research/    Verifierad research (datakällor, SEO-sizing, juridik)
```

## Utveckling

```bash
cd site
npm install
npm run dev      # http://localhost:4321
npm run build    # statisk output till site/dist
```

## Principer som inte får brytas

Dessa är inte stilpreferenser — de skyddar domänens rankning och projektets
juridiska hållbarhet.

1. **Datan är innehållet.** Ingen AI-genererad brödtext, inga AI-genererade
   bilder. Google straffar skalad tunn text, och "svagaste länken" drar ner hela
   domänen.
2. **Kvalitetsgrind på varje sida.** Saknas tillräckligt underlag visas inget
   betyg, och sidan no-indexeras. Ett gissat betyg är både orättvist mot
   verksamheten och en juridisk risk.
3. **Aldrig `Review`- eller `AggregateRating`-schema.** Vårt betyg bygger på
   myndighetsdata, inte på recensioner insamlade hos oss. Att märka upp det som
   omdömen bryter mot Googles policy. Använd `FoodEstablishment`.
4. **Betyg = färg + bokstav + text.** Aldrig enbart färg.
5. **Öppen metodik.** Hela beräkningen publiceras, och verksamhetens svar
   publiceras oredigerat.
6. **Typografiska vikter: endast 400 och 600.**

## Status

Under uppbyggnad. Sajten är ännu inte publik och ska köras med `noindex` tills
namn, domän och utgivningsbevis är på plats.
