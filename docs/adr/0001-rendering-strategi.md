# ADR 0001: Renderingsstrategi och val av ramverk

**Status:** Beslutad · **Datum:** 2026-08-02

## Kontext

Prikko ska publicera en sida per restaurang i Sverige. Beståndet är i
storleksordningen 30 000–40 000 verksamheter inom SNI 56, plus hubbsidor för
kommun, stadsdel och kökstyp samt leaderboards. Sidorna måste:

1. Levereras som färdig HTML, en tom JS-shell är död för både SEO och för de
   AI-crawlers som ska citera oss (bibeln §6b).
2. Vara snabba. Core Web Vitals är en rankningssignal och vi konkurrerar mot
   etablerade domäner utan att ha deras länkprofil.
3. Kunna uppdateras ofta. Färskhet är en dokumenterad citeringsfaktor: sidor
   uppdaterade senaste två månaderna får ~28 % fler AI-citeringar.
4. Byggas och underhållas av en person på deltid.

## Beslut

**Astro**, statiskt genererat till att börja med, med en planerad migration till
hybridrendering på Cloudflare Workers.

### Varför Astro

Astro skickar noll JavaScript by default och renderar allt till statisk HTML vid
bygget. Interaktivitet (karta, sökfilter) läggs som isolerade öar som hydreras
för sig, kartan tvingar alltså inte restaurangsidan att skicka ett helt
ramverk till klienten. Det är exakt profilen för en datakatalog: mycket
innehåll, lite interaktion.

Verifierat i praktiken: startsidan väger 6,0 kB HTML och 2,5 kB JS (Astros
prefetch-hjälpare) efter bygge.

**Alternativ som övervägdes.** *Next.js*, kraftfullare för inloggade vyer och
dashboards, men skickar väsentligt mer JS per sida och gör det lättare att råka
bygga något klientrenderat. Om vi senare behöver restaurang-dashboarden
(monetiseringsspåret, bibeln §10) byggs den som en separat applikation på egen
subdomän; den behöver inte ranka. *11ty*, snabbt och enkelt men saknar
ö-arkitekturen vi behöver för kartan. *SvelteKit/Nuxt*, jämförbara, men Astros
innehållsfokus passar bäst och ekosystemet för sitemap/content är moget.

### Varför inte ren SSG hela vägen

Två gränser tvingar fram hybrid längre fram:

- Cloudflare Pages fria nivå har en gräns på 20 000 filer. Ett nationellt
  bestånd överskrider det.
- Byggtiden växer linjärt med sidantalet. Vid tiotusentals sidor blir varje
  datauppdatering ett långt bygge, vilket direkt motverkar färskhetsmålet.

### Migrationsvägen

När sidantalet passerar ~15 000:

1. Lägg till Cloudflare-adaptern.
2. Sätt `export const prerender = false` på restaurangsidornas rutt.
3. Cachea på edge med revalidering när pipelinen skrivit ny data.

Hubbar, leaderboards och redaktionella sidor fortsätter förrenderas, de är få,
högt värderade och ändras sällan.

**Konsekvens för hur vi skriver kod nu:** all dataåtkomst ligger i `site/src/lib/`
och får aldrig anropas direkt från en sidmall. Då blir bytet ett adaptertillägg
i stället för en omskrivning.

## Följder

- Vi accepterar att inloggade/interaktiva ytor på sikt blir en separat app.
- Vi binder oss inte till Cloudflare: Astro-adaptrar finns för flera plattformar,
  och datalagret ligger i Supabase, inte hos hostingleverantören.
- Domänen `.se` kan inte registreras hos Cloudflare Registrar (verifierat
  2026-08-02 mot deras TLD-lista). Domänen köps hos svensk registrar och
  DNS pekas till Cloudflare.
