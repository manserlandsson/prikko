# Projektbibel — Nationell hygien-/livsmedelskontrollsajt
*Allt vår research, samlat. Arbetsnamn ej låst (ej "Smiley", inga å/ä/ö). Version 1, 2026-07-15.*

> Bärande princip: **mycket djup, empirisk research + SEO-first, allt kalkylerat.** Aldrig gissa, aldrig bygga innan vi vet. Läs primärkällor och bloggar i varje delvertikal.

---

## 1. Idén i en mening
En snabb, snygg, SEO-först konsumentsajt som samlar kommunernas offentliga livsmedelskontroller till ETT jämförbart hygienbetyg per restaurang — med karta, historik och verksamhetens svar. Det nationella lager staten aldrig byggde.

**Varför den passar Måns:** ren Cysel-logik — offentlig data + SEO/distribution (hans bevisade edge), solo-byggbar, ingen telefon, svensk moat. Värde först, pengar sen.

---

## 2. Gap & marknad (belagt)
- **Inget nationellt konsumentalternativ finns.** Närmast: Livsmedelskollen (Visma-app), men per kommun, app (svag SEO), myndighetskänsla. Enda aktör att bevaka — de har datarören men inte gått nationellt/webb/varumärke.
- **Efterfrågan belagd:** Sifo/Tork — var femte gäst missnöjd med hygienen. SVT gör återkommande "matsnusk"-granskningar för hand. SVT själva: "det finns inget system som låter konsumenter veta vilka restauranger fått varningar."
- **Staten avstod i 20 år:** SOU 2005:44 "Smiley" → prop 2005/06:214 (frivillig pilot) → tillbakadragen 15 nov 2006, ej rörd sedan. Stoppades av branschmotstånd (SHR/Visita), inte teknik. → gapet är politiskt hållbart, och du står stabilare eftersom du inte tvingar någon — du speglar offentliga handlingar.

---

## 3. Datan (kärnan)
**Ryggrad (alla restauranger):** bygg från SCB/Bolagsverkets företagsdata (gratis sedan 3 feb 2025, SNI 56 restaurang/café) + öppna datans anläggningar. Join på org.nr.

**Kontrollresultat — tre åtkomstnivåer:**
1. **Öppna data** enligt Sambruk/NSÖD-specen (JSON/CSV, CC0-licens = fritt kommersiellt) på dataportal.se — ät direkt. *Men*: bara en del av 290 kommuner publicerar än (pågående nationellt mål, plats 31 på topp-100-listan) → därför är din aggregering värdet.
2. **Skrapa** kommuner som publicerar på webb/app/karta (Stockholm/Uppsala/Karlstad "Livsmedelskollen", Jönköping-karta, Malmö-listor).
3. **Offentlighetsprincipen** — massutlämnande (Nylander-metoden) för resten: mejla miljöförvaltningen kommun för kommun, få PDF, parsa/OCR. Segt = moat.

**Under huven = 3 system:** Ecos (Sokigo), EDP Vision (Vertigis), Castor (Prosona). Bygg robust inläsning för dem → täck landet.

**Fält per inspektion (ur JSON-schemat):** namn, org.nr, typ, riskklass, WGS84-koordinater (→ karta utan Google), nationellt id, kontrolldatum, godkända/anmärkta kontrollpunkter (kodade), bedömning, `ownerComment` (verksamhetens replikrätt), datum. 2 v fördröjning (replikrätten). Re-polla per källa för färskhet.

**Coverage-plan:** storstäder först (PoC) → topp-20 kommuner → massutlämnande för svansen. Var transparent om vad som saknas.

---

## 4. Betygssystem
- **Ej smiley** (varumärkesskyddat + urvattnat). Eget, distinkt märke: bokstav/sköld (NYC-ikoniskt) eller trafikljus+siffra.
- **Modell:** Norges "sämsta punkten avgör" som förklarbar grund; visa **historik (3 senaste)** som Danmark; **topp-märke** för konsekvent bäst (Elite-Smiley-morot).
- **Normalisering:** kommuner bedömer olika (likvärdighetsproblemet staten ej löst) — normalisera för det, publicera hela metodiken öppet. Det = din IP + juridiska/förtroendeskydd. Obs betygsinflation (Stanford-forskning) → var transparent.

---

## 5. Internationella modeller (stjäl detta)
- **Danmark – Smiley (findsmiley.dk):** 4 ansikten, tre senaste resultaten, Elite-Smiley. → historik + toppmärke.
- **Norge – Smilefjes (smilefjes.mattilsynet.no):** 3 ansikten, "sämsta punkten avgör". → förklarbar rubrik.
- **UK – FHRS (ratings.food.gov.uk):** 0–5, klistermärke, **inbäddningsbara auto-badges**, sök+karta+filter, schema.org. Privata sajter (foodhygieneratings.org.uk m.fl.) lever på datan = bevis på din modell.
- **USA/Kanada – bokstavsbetyg (NYC/LA/Toronto):** ikoniskt märke i fönstret; 88% väger in det. Toronto: skylten når fler än sajten → **gratis fönsterdekaler**.

---

## 6. SEO-first (prio 1 — allt kalkylerat)
- **Programmatiska sidor** på unik data: en per restaurang, stad, stadsdel, kök. Schema.org (LocalBusiness + rating) → betyg i Googles SERP.
- **Leaderboard-sidor** för long-tail ("matsnusk [stad]", "bäst hygien [stadsdel]") = trafik + PR.
- **Intern länkning** stad → stadsdel → restaurang. Snabb statisk generering (hastighet = ranking).
- **Backlänkar** via inbäddningsbara badges (UK-modellen).

### Undvik Googles "AI-slask"-straff (belagt)
Google bannar inte AI, men straffar **scaled content abuse** (tunna, mallade massidor) — "svagaste länken" drar ner hela domänen. Programmatisk SEO **överlever på unik strukturerad data** (kataloger/jämförelse) = precis oss. Regler:
- Låt **datan vara innehållet** — inte AI-genererad brödtext.
- **Inga AI-genererade bilder** (SynthID-vattenstämpel i pixlar, även från ChatGPT/DALL·E) → egen design, riktiga kartor, datavis, äkta foto. Spraya ej LLM-text (kan vattenstämplas).
- **Kvalitetsgrind varje sida**; no-indexa tunna spöksidor.
- **E-E-A-T:** öppen metodiksida, namngiven utgivare, utgivningsbevis, källa per sida, "om oss".
- Snygg UX = låg studs = rankningssignal.

---

## 6b. AEO/GEO — bli citerad av AI-svar (ChatGPT, Perplexity, AI Overviews, Claude)
Stort: ChatGPT ~883 milj användare/mån; AI Overviews i ~55% av Google-sökningar. **Nyckelinsikt: AEO belönar motsatsen till AI-slask** — färsk, strukturerad, källbelagd primärdata. Din sajt ÄR primärkällan om svensk restauranghygien → inherent citerbar. Och LLM:er använder en *annan* trusthierarki än backlänkar (struktur, datatäthet, färskhet, entitetsstyrka) → en utmanare med unik data kan bli citerad mot stora domäner.

Taktik (bygg in från start):
- **Led med svaret** på varje sida: "Pizzeria Vesuvio har hygienbetyg A — inga avvikelser vid senaste kontrollen 19 mars 2026." AI extraherar det direkt.
- **Ren struktur:** H2/H3-hierarki, **server-side-renderad HTML** (inte bara JS), JSON-LD. LLM:er "parsar struktur före mening".
- **Färskhet = citeringsmagnet:** 85% av AI Overview-citat kommer från innehåll <2 år; sidor uppdaterade <2 mån får 28% fler citat. Din dagligt uppdaterade data är ett enormt AEO-övertag — visa "senast uppdaterad".
- **Källhänvisa per sida** (kommun + kontrolldatum) + kvantifierbar data → precis vad LLM:er citerar.
- **Entitetskonsistens:** namn/org.nr/adress lika överallt (28–40% fler citat vid konsistent entitetsdata).
- **Crawlbar i både Google och Bing** (Bing driver ChatGPT-sök).
- **llms.txt** i roten (billig karta för AI-crawlers) — men obs: motorerna har inte lovat läsa den, så komplement, ej strategi.
- **Answer-/leaderboardsidor** ("sämsta restaurangerna för hygien i Stockholm 2026") = kvantifierbart, strukturerat, källbelagt → dubbel vinst (SEO + AEO + PR).

### Schema-fälla (viktigt, belagt)
Google tillåter `AggregateRating`/`Review`-schema **endast för recensioner insamlade på din egen sajt** — att märka upp tredjepartsbetyg bryter mot policyn och riskerar manuell åtgärd. Ditt betyg kommer från myndighetsdata, **inte recensioner** → använd `FoodEstablishment`/`LocalBusiness`-schema (NAP, geo, kök) och representera hygienen som strukturerade fakta/datum/källa — **fejka aldrig Review-stjärnor**. Det är dessutom en styrka: officiell data är mer trovärdig/citerbar för hygienfrågor än Yelps recensioner.

### Lärt av Yelp & TheFork
- Stark entitetsdata per restaurangsida (namn, adress, kök, öppettider) + schema → rich results + Knowledge Graph + local pack. Stjäl sidstrukturen.
- **NAP-konsistens** avgörande för att Google/AI ska koppla ihop entiteten.
- De lever på recensioner (UGC); din differentiering är den *officiella hygienfaktan* — försök inte bli Yelp, äg hygiennischen.
- 2026: utan schema = osynlig för AI-sök och röstassistenter.

---

## 7. Design ("inte AI-slask")
Redaktionell skärpa, generöst utrymme, stark typografi, EN varumärkesfärg + neutral gråskala, platt. Betyget är hjälten; kartan är navet (Zillow-känsla). Egen ikonografi. Referenser: NYC-placard + Airbnb-karta + NYT-datagrafik. Mönsterbank: **Mobbin** (i ritfasen). UI-mockup finns: `hygienkartan_ui_mockup.html`.

---

## 7b. Features (produkt)
**Baslinje (table stakes):** sök på org.nr/namn/adress/område + karta; visa inspektioner + historik; ladda ner registreringsintyg.
**Differentiatorer:**
- **Anmälningsrobot:** användaren fyller i fälten på vår sida → vi auto-skickar anmälan (misstänkt matförgiftning / brister) till rätt kommuns e-tjänst/miljöförvaltning. Sömlöst — till skillnad från Livsmedelskollen som flyttade ut det till en klumpig webbläsar-e-tjänst. Civilt värde + goodwill mot myndigheter + privat signal om heta ställen att bevaka. Obs: anti-spam/verifiering; bekräfta att kommunen tar emot tredjepartsanmälan (annars: skicka på användarens vägnar med deras uppgifter).
- **Recensioner:** förstaparts-recensioner på VÅR sajt (Google tillåter `Review`/`AggregateRating`-schema för egna recensioner → legitimt). Ev. även visa Google-recensioner. **Håll hygienbetyget (officiell fakta) visuellt tydligt separat från recensioner (åsikt)** för att skydda trovärdigheten.
- **Bevakning/notiser:** följ en restaurang → notis vid ny kontroll. Engagemang + färskhet (bra för SEO/AEO).
- **Fönsterdekaler + inbäddningsbara badges** (offline-distribution + backlänkar).
- **Certifikat/diplom** (senare): restauranger kan skriva ut ett snyggt certifikat på sitt betyg och hänga upp → gratis distribution + varumärke, finare än dekalen.
- **Animerat märke** (senare): SVG-ansiktet blinkar/morphar mun efter betyg; nål droppar på kartan.
- **Logga + huvudfärg LÅST:** wordmark "prikko" (gemener) + fristående ansiktsmärke (två prickar + leende), gjord i Figma. **Brandfärg = blå** (exakt hex hämtas från Figma, ~#3B78E7). Grönt endast i betygsskalan. Ansiktsmärket = favicon / app-ikon / betygschip (färg efter betyg) / kartnål. Namn EUIPO-clear (0 träffar); kvar: PRV-nationell + jurist innan formell lock.

## 7c. Lärdomar från konkurrentappar (vad som är trasigt = vår wedge)
**Livsmedelskollen (Stockholm, Visma) — App Store: 2,6/5 (17 betyg).** Egna recensioner: "Kunde inte söka på restaurang eller område… kunde inte göra någonting"; "Denna app såg man fram emot. Men inget fungerar"; "vinner inga innovations- el designpriser". Dessutom: **endast engelska**, **endast Stockholm**, frös vid anmälan, tog bort röda pluppar (statussignal användare ville ha), anmälan utflyttad till klumpig e-tjänst. Tidigare buggar: vit skärm vid start, misslyckades visa position/hämta verksamheter.
→ **Vår wedge:** nationell · svensk · snabb webb (ingen app-install, SEO/AEO) · pålitlig · snygg · tydliga statussignaler · sömlös anmälan.
**Norge:** öppen data på data.norge.no; utvecklare bygger egna webbappar ovanpå (GitHub) → bekräftar modellen.
**Danmark:** Smiley-systemet ska förenklas (2024/25) — läs djupare (bechbruun-artikeln kräver JS-rendering → ta via Chrome). Även guldstandarden reformeras.
**TODO (mer research via Chrome):** läs Danmarks/Norges app-recensioner + bechbruun-artikeln i sin helhet.

## 8. Varumärke & juridik
- **Inte "Smiley"** (The Smiley Company, aggressiv enforcement). **Inga å/ä/ö** i namnet. Eget namn + egen ikon.
- **Utgivningsbevis** (som Ratsit/Hitta) → grundlagsskydd vid publicering av namngivna verksamheter.
- Replikrätt synlig per sida (`ownerComment`).
- Kör PRV + EUIPO-sökning + varumärkesjurist innan namnet låses.

### Namnkandidater (ASCII, verifiera .se + PRV)
Nollprick · Rentbord · Bordskoll · Krogbetyget · Hygienkartan · Tryggkrog · Krogvakt · Prickkoll.
Favoriter: **Nollprick** (noll anmärkningar = perfekt, blir bra märke) och **Rentbord**. Beskrivande/SEO: Hygienkartan.

---

## 9. Distribution & lansering
- **PR-splash:** ge redaktionerna en färdig **nationell matsnuskliga** (SVT gör den manuellt idag) = gratis räckvidd.
- **TikTok:** äckel-fascination + "kolla din stamkrog" = självspridande.
- **Fönsterdekaler** till bra ställen (billigt).
- **Inbäddningsbara badges** = backlänkar + spridning.

---

## 10. Kommersiell väg (monetisering) — ärlig bedömning
Sekvens: **värde/förtroende först** (gratis konsumentsajt → trafik + varumärke + täckning), monetisera sen. För tidig monetisering — eller "betala för bättre betyg" — dödar förtroendet som gör allt annat värt något.

Intäktsströmmar (grovt kalkylerat):
1. **Displayannonser** (konsumenttrafik): vid ~0,5–2M sidvisningar/mån (rimligt nationellt över 1–2 år) × RPM €3–10 ≈ €1,5–20k/mån. Nära noll driftskostnad = hög marginal. Ensam = "fin sidoinkomst", ej venture.
2. **Restaurang-SaaS ("claim & hantera profil")** — DÄR de riktiga pengarna finns. Restauranger bryr sig om betyget → betald nivå: hantera profil, notiser före kontroll, verifierad badge, konkurrent-benchmark, embed-widget. 1 000–3 000 betalande × €10–30/mån ≈ €120k–1M ARR. Återkommande, skalbart (badge = inbound). Etik: sälj *verktyg/synlighet*, aldrig "betala för bättre poäng".
3. **B2B-datalicensiering** — den normaliserade nationella datamängden till försäkringsbolag (restaurangrisk), matleverans (Foodora/Uber Eats), franchisekedjor (bevaka enheter), mäklare, media. Dansk Smiley-data används redan så → bevisad efterfrågan. Hög marginal, försvarbar moat.
4. **Certifikat/premium-badges** (din idé): små men återkommande.
5. **Affiliate** (bordsbokning, HACCP-utbildning): modest, hantera etiken.

**Portfölj-/plattformsuppsida:** när maskinen (offentlig data → SEO → monetisering) funkar, replikera till andra nischer (äldreomsorg, andra inspektioner) → "förtroendelagret på svensk offentlig data".
**Endgame:** bli de facto-standard → staten partnar/adopterar, eller uppköp (Visma, mediehus, försäkringsbolag, matleverans).

**Ärlig dom:** Ja, kommersiellt möjligt. Som ren ads/konsumentsajt = verkligt kassaflödande sidoprojekt (passar kvällar/helger, <$5k). Vägen till *riktig* verksamhet går via B2B (SaaS + datalicens), med en moat ingen annan har (den aggregerade datan). Risker där osäkerheten sitter: restaurangers betalningsvilja oprövad; datalicens-säljcykler långsamma; ad-intäkt kräver stor trafik; ryktes-balansgången (du betygsätter dem *och* säljer till dem).

---

## 11. Risker & motdrag
| Risk | Motdrag |
|---|---|
| Branschmotstånd (Visita) | Faktisk offentlig data + replikrätt + utgivningsbevis |
| Kommuner bedömer olika | Transparent, publicerad normalisering |
| Datainsamling seg (200 kommuner) | Öppna data först; 3-system-inläsning; massutlämnande |
| Visma/Livsmedelskollen går nationellt | Vinn på SEO/webb + varumärke + badges + täckning först |
| Staten bygger eget | Låg (20 års passivitet); du kan bli partnern/uppköpet |
| Google "AI-slask"-straff | Unik data som innehåll, ingen AI-text/-bild, kvalitetsgrind |
| Taket (privata analoger små) | Bli standarden + B2B-data, eller portföljexpansion |

---

## 11b. Teknisk arkitektur, stack & workflow (billigt + SEO-first)

**Grundprincip (backend för SEO):** för-rendera varje sida till färdig HTML (SSG) — servern skickar komplett HTML, aldrig en tom JS-shell (client-only SPA = död för SEO/AEO). Skilj **datapipeline** (hämta → normalisera → databas) från **rendering** (generera sidor från datan). Ren URL-struktur (`/stad/stadsdel/restaurang`), JSON-LD-schema, XML-sitemap, snabb (Core Web Vitals = rankingsignal).

**Rekommenderad stack (nära 0 kr att börja):**
- **Frontend/generering: Astro.** Skickar ~0 JS by default, 2–3× snabbare laddning, bäst Core Web Vitals, bygger tusentals sidor snabbt, perfekt indexerbar statisk HTML. Idealisk för en data-katalog. (Next.js är alternativet om vi vill ha tung interaktivitet/auth/ISR + React — vi kan lägga en liten Next/Astro-server-del för anmälningsformulär/dashboard senare. Hybrid är vanligt: Astro för publika SEO-sidan, dynamisk del separat.)
- **Databas: Supabase** (Postgres, gratis tier) — normaliserad data ligger här; sajten läser vid bygge.
- **Hosting: Cloudflare Pages/Workers** — billigast, global, i praktiken omätt bandbredd, $5/mån över gratis. Obs: gratis tier har 20 000-filers-gräns → med tiotusentals sidor kör vi antingen $5-planen eller **SSR/hybrid på edge (Workers)** så vi inte shippar 30k statiska filer. (Vercel gratis = bara hobby, kommersiellt kräver $20; Netlify gratis 100 GB.)
- **Färskhet:** schemalagda ombyggen när ny data kommit in (Astro-rebuild via CI), eller hybrid-SSR för de färskaste sidorna.

**Datapipeline / skrapning (billigt, robust, i ordning):**
1. **Öppna data (Sambruk JSON/CSV):** bara `fetch` — ingen skrapning.
2. **Reverse-engineera portal/app-API:** öppna Network-fliken → hitta JSON-endpointen (t.ex. Livsmedelskollens e-tjänst returnerar JSON) → hämta direkt. Ingen webbläsare behövs = billigt + stabilt.
3. **HTML-sidor:** lätt parsing (Python `httpx` + `selectolax`/BeautifulSoup). **Playwright/Puppeteer bara när sidan kräver JS.**
4. **Offentlighetsprincipen → PDF:** `pdfplumber`/OCR.
- **Schemaläggning gratis via GitHub Actions** (cron) → normalisera → skriv till Supabase. (Alternativ $5 VPS/Hetzner om vi växer.) Firecrawl som option för stökiga sidor.

**Kostnad att börja:** ~0 kr (GitHub Actions gratis, Supabase gratis, Cloudflare gratis/$5) + domän ~100–150 kr/år. Skalar billigt.

**Hur vi kör (workflow):**
- Starta ett git-repo. Bygg med **Claude Code** (CLI-agenten) — kör den i **VS Codes integrerade terminal** (VS Code som editor + Claude Code som gör jobbet), eller fristående terminal. Den här Cowork-sessionen (research/strategi) matar Claude Code med specen (denna bibel).
- Repo-struktur: `/pipeline` (Python-skrapare + normalisering), `/site` (Astro), data i Supabase.
- Sätt upp Google Search Console + Bing + sitemap tidigt (indexering i båda; Bing driver ChatGPT-sök).

**Kvar att bestämma innan bygge:** (1) namn + domän, (2) designspråk (Figma för system/mockup, Mobbin för referenser — UI-mockup finns redan), (3) datakälla-inventering (vilka kommuner är live), (4) utgivningsbevis-koll, (5) visuell competitor-teardown (Chrome).

## 12. Börja imorgon — konkret startplan
**Fas 0 (research, denna vecka — SEO-first, allt kalkylerat):**
1. **Domän + namn:** verifiera .se på 3–4 favoriter (Nollprick, Rentbord, Hygienkartan), grabba en, PRV/EUIPO-sök.
2. **Sökvolymer:** kartlägg efterfrågan (t.ex. "livsmedelskontroll [stad]", "[restaurang] hygien", "matsnusk [stad]") med SEO-verktyg → dimensionera trafikpotentialen kalkylerat.
3. **Datainventering:** lista exakt vilka kommuner som publicerar öppna data live nu (dataportal.se, sök "Livsmedelsinspektioner"), och dra ner EN riktig fil → verifiera fälten mot schemat.
4. **Visuell teardown:** koppla Claude i Chrome → skärmdumpa findsmiley.dk, smilefjes, ratings.food.gov.uk, foodhygieneratings, NYC-kartan + Zillow/Ratsit/Hitta → annoterat UI/UX-dok.
5. **Juridik-koll:** läs på utgivningsbevis (ansökan hos MPRT) + offentlighetsprincipen-utlämnande i praktiken.

**Fas 1 (PoC — en stad, Stockholm):** ryggrad från SCB + öppna data + normaliserat betyg + SEO-sidmall (schema.org). Mät: rankar vi? Ser datan bra ut? Känns produkten proffsig?

**Fas 2:** utöka stad för stad; starta massutlämnanden parallellt; bygg badge/dekal-systemet.

**Fas 3:** lanserings-PR (matsnuskliga + TikTok) när täckningen räcker.

---

*Fördjupning finns i docs 00–10 (elimineringsresan + teardown). Denna fil är den samlade sanningen att bygga från.*

---

## 13. Beslut & status (2026-07-15, kväll)

**Domäner (.se, via IIS whois):**
- LEDIGA: `klarprick.se`, `nollprick.se`, `rentbord.se`, `matvakt.se`, `bordskoll.se`, `hygienkoll.se`, `hygienkartan.se`, `matbetyget.se`.
- TAGNA: krogkoll.se, hygia.se, krogindex.se, prickkoll.se.

**Namnriktning (ej låst — kör PRV/EUIPO innan beslut):** coined varumärke + beskrivande SEO-domän. Lediga brand-kandidater: **Klarprick**, **Nollprick**, Matvakt, Rentbord. SEO-domäner att grabba parallellt: hygienkoll.se, hygienkartan.se, matbetyget.se.

**Designriktning (vald rekommendation): "Nordic Registry"** — institutionell tillit + redaktionell polish (out-positionerar den klumpiga myndighetsappen). Blått = tillit; grönt hålls ENBART till betygsskalan (undviker greenwashing-trötthet).
```
--brand:#0E2A47  --accent:#C8A24B (brass)
--bg:#F4F3EE (Cloud Dancer)  --card:#FFFFFF  --text:#1A1D21  --muted:#6B7280
Betyg A–E: #0E7A4B / #7FA83C / #E3A008 / #DB6A1E / #B5342A
Typsnitt: Familjen Grotesk (display) / Inter (UI) / Source Serif 4 (artiklar) — alla Google Fonts
Betygsmärke: squircle "registry chip" med bokstav A–E; dubblar som kartnål
Tillgänglighet: bokstav + fyllnad/mönster + luminans (aldrig bara färg — 8% färgblinda)
```

**Datatäckning (verklighet, belagt):** endast **Linköping** har öppet JSON-API idag. **~8–15 kommuner** är skrapbara (Stockholm/Uppsala/Karlstad/Linköping delar Visma-backend → EN skrapare täcker flera; Örebro/Jönköping/Malmö/Helsingborg bespoke). **~270–280 kräver offentlighetsprincipen** (Göteborg är uttryckligen request-only). → PoC startar regionalt (storstäderna), nationell täckning kräver FOI-grind. Moaten bekräftad: svårt = därför har ingen gjort det.

**Arbetsnamn: Prikko** (prikko.se ledig; coined av "prick"). SEO-domäner att grabba: hygienkoll.se / hygienkartan.se. PRV/EUIPO-sök innan slutgiltigt.

## 13b. UX-mönster (från etablerade, icke-AI-siga sajter)
Teardown av Zillow, Airbnb, Ratsit, Hitta (skärmdumpade). Beslut:
- **Hero = stor självsäker rubrik + EN dominant sökruta** (Ratsit + Zillow). Ratsit är i princip vår mall: offentlig-data + sök-först + ett starkt märke + en "koll"-hook + gratiskonto.
- **Resultat = delad vy karta + kortlista** (Zillow), färgade betygsnålar (grade = färg + bokstav).
- **Kort** (Airbnb-stil, mycket whitespace, rundade): bild/placeholder + namn + stort betygschip + stadsdel + senaste kontrolldatum; **"Topp-betyg"-badge** för de bästa (motsvarar Airbnbs "Gästfavorit"); **hjärta = följ** (matar notis-featuren).
- **Stadskaruseller på hemsidan** ("Bäst i Stockholm", "Flest anmärkningar i Göteborg") — Airbnb-mönster som *också* är SEO/leaderboard-sidor.
- **App-lik vänster ikon-rail** (Zillow: Sök/Följer/Favoriter) — senare.
- **Varumärkesmärke:** registry-chip (bokstavsbetyg) — Ratsit bevisar att ett starkt enskilt märke bär hela sajten. Palett: vår "Nordic Registry" (navy/brass/crème), ej Ratsits lila.

## 13c. Design-parallell från adjacent nischer (unik inspo, skärmdumpad)
Fyra produkter som redan löst "ett normaliserat betyg per plats, snyggt":
- **Yuka** (mat/kosmetik-hälsobetyg): stort färgkodat betyg överst ("8/100") + scanbar lista "Negatives/Positives" med färgprickar per rad. → **Restaurangsidan:** betyg överst + "Brister / Godkänt"-breakdown av kontrollpunkter (GHP/HACCP/redlighet) med färgprickar.
- **Walk Score** (gångbarhet): siffra i kartnålen ("87"), adress-sök-först hero, "Add to Your Site"-badge. → siffra/bokstav i nålen + embeddbar badge.
- **IQAir** (luftkvalitet): split — vänster färgkodat betygskort ("58 Moderate" i tile + litet ansikte + forecast-knapp), höger stor karta; "80 000 sensorer". → **Hemsidan/sökresultat:** betygskort + karta; färgtile med bokstav + återhållet ansikte (validerar eget ansiktsmärke); "byggd på X kontroller"-trust.
- **Hemnet** (svensk bostad): område/adress-sök + radie + typ-chips med ikoner + stark CTA + "Senaste:"-minne. → svensk sök-UX användarna redan kan; filter = kök/typ + betyg.

**Prikkos blend:** Yuka-breakdown (restaurangsida) + IQAir-split & Hemnet-sök (hemsida) + Walk Score-nål & badge, i vår palett + eget litet ansiktsmärke.

## 14. Designsystem — exakta tokens & komponenter (från Apple + Hemnet CSS-teardown)
Faktiska värden inspekterade live: **Apple** = SF Pro Text/Display, brödtext 17/lh20, rubrik 24/lh28 & 40/lh44, vikt endast 400/600 (aldrig 700), canvas #f5f5f7, text #1d1d1f, sekundär #6e6e73, piller-knappar (980px), nästan inga skuggor. **Hemnet** = Roboto + egen displayfont, bas 16/lh24, radie 8px, mjuk tvålagersskugga, grön #007E47.

### Tokens (Prikko)
```
FONT: Inter (UI/text, SF-substitut) + valfri egen displayfont bara för logotyp
TYPSKALA (px/vikt/line-height):
  eyebrow 12/600/16 (+0.02em, versal)   caption 13/400/18
  body-s 14/400/20    body 17/400/25    h-s 21/600/25
  h 24/600/28         display 40/600/44
  VIKTER: endast 400 och 600 (Apple-disciplin)
FÄRG:
  canvas #F5F5F7   card #FFFFFF
  text #1D1D1F   sekundär #6E6E73   muted #A1A1A6   hairline rgba(0,0,0,.098)
  accent (brand) blå ~#3B78E7 (exakt hex från Figma) — EN accent, sparsamt
  betyg A #0E7A4B · B #34C759 · C #E3A008 · D #E8730C · E #D0342C  (färg=betydelse)
RADIE: kort 12px · kontroller 10px · primär CTA piller 999px · nål/avatar 50%
SKUGGA (sparsamt): sm 0 1px 2px rgba(0,0,0,.06) · pop 0 8px 30px rgba(0,0,0,.12); annars hairline + luft
SPACING: 4px-grid → 4/8/12/16/24/32/48/64; kort-padding 20–24; sektionsgap 32–48
LAYOUT: web-container max 1080px; läs-/objektsida kolumn 600–680px
```

### Komponenter (hur de byggs)
- **Betygschip (Yuka/IQAir):** rundad kvadrat radie 20–22px, fylld i betygsfärg, bokstav Inter 600 ~46px vit, etikett under i betygsfärg 600/15. Flex-kolumn, fast ~92–96px. Dubblar som kartnål (mindre variant + vit 3px kant).
- **Restaurang-hero:** vitt kort (radie 12, padding 22), flex-row: vänster info (h 24/600 titel, 17/400 adress sekundär, chips), höger betygschip. Stackar på mobil.
- **Inspektions-breakdown (Yuka):** grupperat kort (radie 12); rad = färgprick 10px + text (16/400 + 14/400 sekundär) + status (14/600 betygsfärg) + chevron; hairline mellan rader. Grupp "Brister" + grupp "Godkänt".
- **Hemsida-split (IQAir):** CSS-grid 2 kol (minmax) — vänster betygs-/sökkort, höger karta (MapLibre + OSM). Stackar på mobil.
- **Sök (Hemnet):** område-input (radie 10, ~50px hög) + radie-utökning + typ-chips (piller, 1px kant, ikon+text) + primär piller-CTA + "Senaste:"-minne.
- **Badge:** inbäddbar auto-uppdaterande + fysisk fönsterdekal (samma chip).

## 15. Byggplan: från nu till färdig sajt (bokstavligt, i ordning)
Ansvar: **Måns** bygger i Claude Code med bibeln som spec. **Cowork (jag)** stöttar research, datakällor, SEO-kalkyl, PR, verifiering. Kritisk väg till första livemilstolpe = Fas 0–3 (en-stads-PoC live).

**Fas 0 — Lås grunden (denna vecka)**
- Grabba prikko.se (+ hygienkoll.se). PRV/EUIPO-sök på "Prikko".
- Skissa logga/eget ansiktsmärke + betygschip.
- Lås designsystemet (avsnitt 14) → generera `tokens.css` + komponent-startkod.
- Repo & infra: git + Astro + Supabase (gratis) + Cloudflare Pages + GitHub Actions. Koppla Google Search Console + Bing Webmaster.
- *Definition of done:* tomt repo som deployar en "hello world" på prikko.se, designsystem inlagt.

**Fas 1 — Datapipeline, PoC (en stad: Stockholm el. Linköping)**
- Ryggrad: hämta restauranglista från SCB/Bolagsverket (SNI 56) för staden.
- Kontrolldata: Linköpings öppna API + Stockholm (reverse-engineera Livsmedelskollen-JSON).
- Normalisera → betygsmodell v1 ("sämsta punkten avgör", visa 3 senaste) → Supabase. Publicera öppen metodik.
- *Definition of done:* en stads restauranger med normaliserat betyg i databasen.

**Fas 2 — Bygg sajten (Astro, PoC-stad)**
- Implementera komponenter: betygschip, hero, Yuka-breakdown, Hemnet-sök, kort, karta (MapLibre + OSM).
- Sidtyper: restaurangsida (schema.org FoodEstablishment, "led med svaret"), stads-hub, stadsdels-hub, leaderboard ("sämst/bäst i [stad]"), hemsida (IQAir-split).
- SEO/AEO inbyggt: SSG, ren URL (`/stad/stadsdel/restaurang`), intern länkning hub-spoke, dynamisk sitemap, "senast uppdaterad", inga AI-genererade texter/bilder.
- *Definition of done:* fungerande, indexerbar en-stads-sajt live.

**Fas 3 — Mät & iterera (validera PoC)**
- Deploya. Search Console: indexeras sidorna? Rankar vi på long-tail?
- Sanity-checka betyget (rättvist? känns proffsigt?). Justera normalisering.
- Features: Följ/notiser, anmälningsrobot (routing till kommun), inbäddbar badge.
- *Definition of done:* bevisad indexering + ranking + produktkänsla i en stad.

**Fas 4 — Skala täckning**
- Lägg till storstäder + de ~8–15 skrapbara (Visma-delad backend först → flera på en gång; sen Örebro/Jönköping/Malmö/Helsingborg + Smiley-kommunerna).
- Starta massutlämnanden (offentlighetsprincipen) för svansen — mall + spårningskalkyl, kommun för kommun.
- Automatisera: GitHub Actions cron, re-poll för färskhet.
- *Definition of done:* stor regional → nationell täckning.

**Fas 5 — Lansering & distribution**
- PR-splash: färdig nationell "matsnuskliga" till redaktionerna.
- TikTok, fönsterdekaler till bra ställen, inbäddbara badges brett, leaderboard-innehåll.
- *Definition of done:* organisk trafik + varumärke rullar.

**Fas 6 — Monetisering (efter förtroende)**
- Annonser · claim/hantera profil · premium-badges · B2B-datalicens. Aldrig förbättringstjänster till lågt betygsatta.

*Första riktiga milstolpen att sikta på: Fas 3 — en stad live, indexerad, som rankar. Allt annat följer.*
