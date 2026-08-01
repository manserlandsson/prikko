# Claude Code — kickoff-instruktion för Prikko
*Öppna Claude Code i den här mappen och klistra in allt nedanför "=== KLISTRA IN ===". Läs `11_master_projektbibel.md` för full kontext; den är specen.*

=== KLISTRA IN ===

Vi bygger **Prikko** — en nationell, SEO-first konsumentsajt som samlar svenska kommuners offentliga livsmedelskontroller till ETT normaliserat hygienbetyg per restaurang (karta, historik, verksamhetens svar). Läs `11_master_projektbibel.md` i denna mapp FÖRST — den är den kompletta specen (strategi, data, betygsmodell, SEO/AEO, designsystem, features, byggplan). Följ den.

## Stack (billigt, SEO-first)
- **Astro** (TypeScript), statisk generering (SSG). React-öar bara där interaktivitet krävs.
- **Supabase** (Postgres, gratis) för data.
- **Cloudflare Pages** för hosting; **GitHub Actions** (cron) för datapipeline.
- Design: importera `tokens.css` (finns i mappen) + Inter. Följ Apple-clean disciplin (vikter endast 400/600).

## Repo-struktur
```
/site        Astro-sajten
/pipeline    Python: hämta + normalisera data → Supabase
/public      tokens.css, logga, favicon
```

## Sprint 1 — gör i denna ordning
1. **Scaffold:** init Astro-projekt i `/site`. Lägg in `tokens.css` globalt + Inter. Bygg baslayout + header med prikko-logga (SVG). Deploya en "hello world" till Cloudflare Pages så pipelinen till prod funkar.
2. **Datamodell (Supabase):** tabeller `establishments` (org.nr, namn, typ, riskklass, wgs84 lat/lng, kommun, adress) och `inspections` (establishment-fk, datum, godkända[], anmärkningar[], bedömning, ownerComment) och `grades` (establishment-fk, normaliserat betyg A–E, beräknat).
3. **Pipeline (en stad först):** hämta ryggrad från SCB/Bolagsverkets öppna företagsdata (SNI 56) för staden. Hämta kontrolldata: Linköpings öppna API + Stockholm (reverse-engineera Livsmedelskollens JSON-endpoint via Network-fliken). Normalisera → betygsmodell **v1: "sämsta kontrollområdet avgör", visa 3 senaste** → skriv till Supabase.
4. **Sidmallar (Astro, SSG):**
   - Restaurangsida `/[kommun]/[stadsdel]/[slug]` — schema.org `FoodEstablishment` (INTE Review/AggregateRating), **led med svaret** ("X har hygienbetyg A…"), betygschip, karta (MapLibre + OSM), Yuka-stil breakdown (Brister/Godkänt med färgprickar), historik, verksamhetens svar, "senast uppdaterad", källa.
   - Stads-hub `/[kommun]` + stadsdels-hub. Leaderboard `/[kommun]/samst-hygien` & `/bast-hygien`.
   - Hemsida: IQAir-split (sökkort + karta) + Hemnet-stil sök (område + typ-chips + CTA).
5. **SEO/AEO:** dynamisk sitemap, ren URL-struktur, intern länkning hub→spoke (inga föräldralösa sidor), JSON-LD, snabb SSG. Koppla Google Search Console + Bing Webmaster.

## Hårda regler
- **Datan är innehållet** — ingen AI-genererad brödtext, inga AI-genererade bilder (SynthID-vattenstämpel + slask-signal). Egen design, riktiga kartor, deterministiskt mallgenererad text.
- Kvalitetsgrind varje sida; no-indexa tunna sidor utan data.
- Följ `tokens.css` exakt. Betyg = färg + bokstav + form (tillgänglighet).
- Publicera betygs-metodiken på en egen sida.

## Definition of done (Sprint 1)
En stad live på Cloudflare, indexerbar, med restaurangsidor + hemsida + leaderboard som rankar-redo (schema, sitemap, intern länkning på plats).

=== SLUT ===
