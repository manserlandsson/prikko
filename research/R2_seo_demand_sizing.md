# R2 — SEO Demand Sizing, Sweden (Prikko)

*Research date: 2026-08-02. Read with §6 and §10 of `11_master_projektbibel.md`.*

> **Methodology note, up front:** The Semrush MCP connector returned
> `"active subscription, but does not have enough API units"` on **every** toolkit
> (`keyword_research`, `domain_overview`, `organic_research`) — zero Semrush data was
> obtainable. **To restore Semrush access, add API units at https://www.semrush.com/mcp-access.**
>
> All numbers below therefore come from fallback sources, and every figure is labelled by
> confidence. The fallback stack is stronger than a typical "estimate", because two of the
> sources are **direct observational data, not modelled**:
> 1. **Google Autocomplete API** (`suggestqueries.google.com`, `hl=sv&gl=se`) — derived from real
>    Google query logs. Proves *which query patterns exist*. **Hard evidence.**
> 2. **Google Trends public API** (geo=SE, 12 months) — real relative search interest. **Hard evidence for ratios.**
> 3. **Similarweb / Ahrefs public pages** — modelled traffic estimates for competitor domains. **Medium confidence.**
> 4. **Absolute volumes** are *derived* by chaining Trends ratios to one verified anchor
>    (`"food hygiene rating"` UK = 14K/mo). **Low-to-medium confidence, ±2–3× at the small end.**
>    Directional conclusions are robust; individual keyword volumes are not precise.

---

## 1. VERDICT (read this even if you read nothing else)

**The hygiene-search demand in Sweden is far too small to build a business on, and SEO is not
the edge here. The core thesis of §6 of the projektbibel does not survive contact with the data.**

Four findings, in descending order of how much they should change the plan:

**① The Swedish hygiene keyword universe is ~400–1,200 searches/month in total.**
Not per city — *nationally, across every phrasing.* For calibration, a single mid-sized Swedish
restaurant's own brand name gets more search than the entire category. `"livsmedelskontroll"`
scores **0.57** on Google Trends where `"matförgiftning"` scores **60.2** and
`"restaurang stockholm"` scores ~**395** (normalised). `"hygienbetyg"`, `"restaurang hygien"`,
`"matsnusk"`, `"smiley restaurang"` and `"livsmedelskollen"` all register **0.00** — below the
Trends detection floor. `"hygienbetyg"` returns **zero Google autocomplete suggestions**, which
means Google has effectively never seen it. The word the product is built around is not a word
Swedes search.

**② The per-restaurant page — the "tens of thousands of pages" play — has no demand.**
This is the most important negative. Two independent proofs:
- **Autocomplete:** `"operakällaren hygien"`, `"sturehof hygien"`, `"sushi yama hygien"`,
  `"restaurang hygien stockholm"` → **zero suggestions each**. Only *chain* brands
  (McDonald's, Max, Vapiano, Espresso House) produce hygiene queries at all, and most of those
  results are UK/German/Finnish, not Swedish.
- **The UK proof:** `scoresonthedoors.org.uk` has **528,817 premises pages** and ranks for
  **518 keywords total** (~1,000 pages per ranking keyword), pulling ~**11K visits/month**.
  Its top keywords are its own *brand* and the generic head term — **not** restaurant names.

  Publishing 60,000 pages against demand this thin is also precisely the "scaled content abuse"
  fingerprint §6 of the bibel is trying to avoid.

**③ The UK — a best case in every respect — caps the private-aggregator model at ~11K visits/month.**
The UK has a mandatory-display national scheme, window stickers, 15+ years of state promotion, and
82% of consumers claiming they avoid low-rated venues. In that market the *government* site takes
~156K visits/mo and the best *private* aggregator takes ~11K. Population-scaled to Sweden that
private ceiling is **~1,700 visits/month** — and Sweden has no scheme, no stickers and no public
awareness, so the realistic figure is lower still.

**④ Your own comparables run on brand, not on long-tail pages.**
`hitta.se` (~3.1M visits/mo) and `ratsit.se` — the two "public data + SEO" models named in the
bibel — have top keywords of `"hitta"`, `"hitta.se"`, `"vem ringde"`, `"ratsit"`, `"ratsit lönekoll"`.
**Every one is branded or a distinctive named feature.** They are brand businesses with an SEO
long tail attached, not SEO businesses. Emulating "Ratsit's SEO" means building a brand first.

### What is genuinely positive

Three real signals, and they should be taken seriously:

- **`"livsmedelskollen [stad]"` autocompletes for cities the incumbent does not cover** —
  göteborg, malmö, västerås, borås, jönköping. That is *demonstrated unmet demand for exactly this
  product*, expressed through a competitor's brand. Small, but it is the cleanest product-market-fit
  signal in the dataset.
- **`"sämsta restaurangen i [stad]"` autocompletes across 8+ cities** (sverige, stockholm, göteborg,
  uppsala, örebro, malmö, helsingborg, norrköping). The *leaderboard* has consumer pull that the
  *directory* does not.
- **`"matförgiftning"` is a ~4,400/mo head term with a 200+ variant tail**, including real
  entity-level queries (`matförgiftning gobi sushi`, `liseberg`, `yasuragi`, `picadeli`, `mcdonalds`)
  and city variants. This is ~100× the `livsmedelskontroll` cluster and is the only genuinely
  large adjacent pool with honest hygiene relevance.

### The strategic reframe this data forces

> Sweden has **no** occupant of the category that ratings.food.gov.uk occupies in the UK
> (~156K visits/mo; ~24K/mo population-scaled to Sweden). That space is genuinely empty.
> But **empty is not the same as waiting**. SEO harvests demand that already exists — and here it
> does not. Reaching the Sweden-equivalent ceiling requires *creating* the category through PR,
> stickers, TikTok and media partnerships, with SEO as the compounding layer that captures demand
> **after** it has been manufactured.
>
> **That inverts the founder's premise.** The bibel says "SEO-first, PR later" (§6, §9). The data
> says **PR/category-creation first, SEO second.** Prikko may still be worth building — but not
> as an SEO play, and not on the traffic assumptions currently in §10.

---

## 2. THE TRAFFIC MODEL

### 2.1 Anchor and arithmetic (shown explicitly)

**Verified anchor:** `"food hygiene rating"` (UK) = **14,000 searches/mo**, driving 13K/mo to
food.gov.uk (Ahrefs public data).

**Cross-market bridge** (Google Trends, 12mo, cross-geo):
`"food hygiene rating"` [GB] = 29.83 · `"matförgiftning"` [SE] = 60.21

Trends indices are *share of each region's total searches*, so:

```
absolute(SE) / absolute(GB) = (index_SE / index_GB) × (total_SE / total_GB)
                            = (60.21 / 29.83) × (1 / 6.4)      [UK 68.3M vs SE 10.6M pop]
                            = 2.018 × 0.1563 = 0.315
matförgiftning (SE) ≈ 0.315 × 14,000 ≈ 4,400 searches/month
```

**Sanity checks (both pass):**
- `magsjuka` = 4.46 × matförgiftning ≈ **19,600/mo** — plausible for a common seasonal illness term.
- `restaurang stockholm` = 6.56 × matförgiftning ≈ **28,900/mo** — plausible for Sweden's largest
  restaurant-discovery query.

Everything below chains off this anchor. **Treat small values as ±2–3×.**

### 2.2 12-month model (base case)

Assumes: Stockholm + Linköping + the ~8–15 scrapable municipalities live (per bibel §13);
~5,000–15,000 restaurant pages; new domain, low authority; no major PR hit yet.

| # | Page type | Pages | Capturable searches/mo | Assumed capture | Visits/mo |
|---|---|---:|---:|---:|---:|
| 1 | City hub — `livsmedelskontroll/hygien [stad]` | ~20 | ~250 | 40% | ~100 |
| 2 | Reporting tool — `anmäla restaurang hygien [stad]` | ~30 | ~150 | 35% | ~50 |
| 3 | Branded intercept — `livsmedelskollen [stad]` | ~16 | ~250 | 25% | ~60 |
| 4 | Leaderboards — `sämsta/bästa hygien [stad]` | ~40 | ~100 | 40% | ~40 |
| 5 | `matförgiftning` subset (anmäla / [stad] / [entity]) | ~50 | ~1,500 | 8% (YMYL, low authority) | ~120 |
| 6 | Per-restaurant pages | 5–15k | negligible direct intent | ~0.02 visits/page/mo | ~150–300 |
| 7 | Editorial + PR spillover | — | — | — | ~100–400 (spiky) |
| | **TOTAL** | | | | **~600–1,200** |

**12-month base case: ~800 organic visits/month** (≈2,400 pageviews at 3 pp/visit).
At €3–10 RPM that is **€7–24/month** in ad revenue.

### 2.3 36-month model

Assumes national or near-national coverage (FOI grind completed), 60,000–90,000 restaurant pages,
brand established, PR flywheel running.

| Scenario | Driver | Visits/mo |
|---|---|---:|
| **Bear** — coverage stalls at ~20 kommuner, PR does not land | long tail only | **1,500–3,000** |
| **Base** — national coverage, moderate PR, brand exists | per-restaurant 3.5–10.5k + hubs/leaderboards ~1.5k + matförgiftning ~450 + discovery adjacency ~750 | **6,000–15,000** |
| **Bull** — category creation succeeds (stickers, TikTok, media) | approaches the Sweden-equivalent of the UK government site | **25,000–40,000** |

Base-case arithmetic: 70,000 pages × 0.05–0.15 visits/page/mo = 3,500–10,500; plus ~1,500 hub/leaderboard;
plus 15–20% of the ~2,500/mo capturable matförgiftning subset ≈ 450; plus ~0.3% of ~250,000/mo
national restaurant-discovery demand ≈ 750.

### 2.4 Reconciliation with the projektbibel

> §10 assumes **0.5–2M pageviews/month** ("rimligt nationellt över 1–2 år") as the basis for the
> €1.5–20k/mo ad line.

The 36-month **base case is ~30,000 pageviews/month** — **20–70× below** that assumption. Even the
**bull case (~120,000 pv/mo) is 4–17× below it.** The 0.5–2M figure is not supportable by any
evidence found here, and the entire display-advertising revenue line in §10 should be treated as
**disproven**: at base case it is ~€150/month.

**Implication:** advertising cannot fund this. The B2B paths in §10 (restaurant SaaS, data
licensing) are not the "upside" — they are the *only* viable monetisation, and they must be
validated directly rather than assumed to follow from traffic.

---

## 3. DATA TABLES

### 3.1 Head terms (Trends index + derived volume)

| Keyword | Trends index (SE, 12mo) | Derived vol/mo | Autocomplete? | Read |
|---|---:|---:|---|---|
| `matförgiftning` | 60.21 | ~4,400 | Yes — 200+ variants | Large; health intent |
| `bästa restaurang stockholm` | 18.80 | ~1,370 | Yes, 10 | Adjacent, competitive |
| `livsmedelskontroll` | 0.57 | **~40–100** | Yes, ~25 cities | **Head term is tiny + B2B-skewed** |
| `livsmedelskontroll stockholm` | 1.06 (of 3.32 head) | ~13 | Yes | City tail exists but negligible |
| `anmäla restaurang` | 0.23 (of 3.32) | ~3 | Yes, 19 variants | Real intent, tiny volume |
| `restaurang hygien` | **0.00** | <10 | Weak; mostly non-Swedish results | Below floor |
| `livsmedelskollen` | **0.00** | <10 | Yes, 16 city variants | Branded, below floor |
| `matsnusk` | **0.00** | <10 | Only 4 entities (2 Finnish) | Media term, not a search term |
| `hygienbetyg` | **0.00** | <10 | **ZERO suggestions** | **Google has never seen this word** |
| `smiley restaurang` | n/a | <10 | **ZERO suggestions** | Dead |
| `livsmedelsinspektion` | n/a | <50 | 4 suggestions | Professional term |

### 3.2 Intent audit of `livsmedelskontroll` — the killer detail

Alphabet-soup enumeration of `"livsmedelskontroll "` returned ~105 distinct real queries.
Classified by intent:

| Intent | Share | Examples |
|---|---|---|
| **Jobs / careers** | ~35% | `livsmedelsinspektör jobb`, `lön`, `utbildning`, `lediga jobb`, `utbildning distans` |
| **Business / regulatory compliance** | ~30% | `avgift`, `taxa`, `efterhandsdebitering`, `checklista`, `protokoll`, `behovsutredning`, `revision` |
| **Policy / civil service** | ~15% | `förstatligande av livsmedelskontrollen`, `SOU`, `remiss`, `betänkande`, `vid kris och höjd beredskap` |
| **Municipal navigation** | ~18% | `livsmedelskontroll [stad]` × ~25 cities |
| **Consumer** | **~2%** | `resultat från livsmedelskontroll`, `max livsmedelskontroll` |

**`livsmedelskontroll` is a regulator's word, not a consumer's word.** Ranking #1 for it delivers
job seekers, restaurateurs and civil servants — not diners. Any city-hub page must be titled in
consumer language, and even then the pool is tiny.

### 3.3 City-modifier pattern — does it exist?

**Yes, the pattern is real — but the volume behind it is not.**

`livsmedelskontroll [stad]` autocompletes for **~25 municipalities**: stockholm, göteborg, malmö,
uppsala, linköping, örebro, västerås, norrköping, borås, helsingborg, jönköping, gävle, lund,
karlstad, kalmar, växjö, halmstad, huddinge, haninge, järfälla, solna, södertälje, täby, nyköping,
kristinehamn, karlskoga, gotland, hässleholm.

`livsmedelskollen [stad]` autocompletes for **16**, including **göteborg, malmö, västerås, borås,
jönköping — cities the incumbent app does not serve.** ← best PMF signal found.

But `"livsmedelskontroll stockholm"` — the largest city variant — derives to **~13 searches/month**,
and `"livsmedelskollen stockholm"` and `"sämsta restaurangen i stockholm"` both register **0.00**.

> **Conclusion:** programmatic city pages will *work* (they will rank — competition is only
> municipal .se pages) but they will not *matter*. Build ~20–40 of them, not 290.

### 3.4 Entity/branded tail — the decisive test

| Query tested | Autocomplete result |
|---|---|
| `operakällaren hygien` | **none** |
| `sturehof hygien` | **none** |
| `sushi yama hygien` | **none** |
| `restaurang hygien stockholm` | **none** |
| `restaurang underkänd` | **none** |
| `vapiano hygien` | 3 — but `hygiene rating` / `hygiene skandal` (UK/DE) |
| `mcdonalds hygien` | 10 — mostly UK (`hygiene rating halifax`, `barrow`) |
| `max hamburgare hygien` | 3 — **genuinely Swedish** (`max hamburgare dålig hygien`) |
| `espresso house hygien` | 3 — partly Finnish (`hygieniapassi`) |
| `sämsta restaurangen i [stad]` | **10 — strong, 8 cities** |
| `anmäla smutsig restaurang` | yes |

**Independent restaurants generate zero hygiene search. Only national chains do, and thinly.**

The one nuance worth keeping: the `matförgiftning` soup contains **real entity queries** —
`matförgiftning gobi sushi`, `gobi lerum`, `lerum flashback`, `liseberg`, `yasuragi`, `picadeli`,
`coco carmen`, `oliver`, `mcdonalds`, `burger king`. So entity-level interest **does** exist, but it
is **event-driven** (outbreaks), not standing. A site with every restaurant pre-indexed captures
those spikes for free — which is a real argument for building the pages, just **not a traffic
model you can forecast**.

### 3.5 Adjacent high-volume intent

| Keyword | Trends index | Derived vol/mo | Winnable? |
|---|---:|---:|---|
| `restaurang stockholm` | 69.08 | ~28,900 | **No** — Google local pack + TheFork + Tripadvisor |
| `restauranger göteborg` | 10.09 | ~4,200 | No |
| `bästa restaurang stockholm` | 18.80 | ~1,370 | Marginal, with genuine editorial |
| `magsjuka` | 47.92 | ~19,600 | No — YMYL, 1177.se |
| `matförgiftning symtom` | 1.17 | ~480 | No — YMYL |
| `matförgiftning anmäla` / `[stad]` / `[entity]` | — | ~1,500–3,000 (cluster) | **Yes, partially** |

Also discovered: **`restaurang [stad] högst betyg`** autocompletes for stockholm, göteborg, malmö,
örebro, uppsala, helsingborg, södermalm. Note the intent is *review* score, not hygiene — but it is
the closest high-volume pattern to a hygiene leaderboard, and worth a page template.

**Honest read on adjacency:** the national restaurant-discovery pool is ~150,000–400,000/mo, and
capturing even 0.3% of it (~750 visits/mo) requires competing on editorial quality with White Guide,
Thatsup and Tripadvisor. Hygiene data alone will not win it. Do not model this as a primary channel.

### 3.6 Competitor & analogue benchmarks

| Domain | Visits/mo | Organic share | Ranking keywords | Top keywords | Lesson |
|---|---:|---:|---:|---|---|
| **ratings.food.gov.uk** (UK gov) | ~156K* | 72.9% | 28.9K | `food hygiene rating`, `hygine rating`, **`chinese near me`** | Ceiling of category. Traffic sits on the **head term**, not the entity tail. Bounce 64.8%, 1min visits. |
| **scoresonthedoors.org.uk** (UK private, 528,817 pages) | ~11K | 73.4% | **518** | `scores on the doors` (brand), `food hygiene rating`, `scores` | **Private ceiling. 1,000 pages per ranking keyword.** |
| **foodhygieneratings.org.uk** (UK private) | negligible | 100% | **149** | `gyo curry`, `one beyond derby`, `satkaar`, `jarrow supermarkets` | Entity pages *can* rank — and still yield ~nothing. |
| **food.gov.uk** (UK gov, main) | 451K (Jul 2026) | — | — | `food hygiene rating` 14K vol → 13K traffic | Anchor source. |
| **hitta.se** | ~3.1M | 69.7% | 103.6K | `hitta`, `hitta.se`, `vem ringde` | **Brand-led**, not long-tail-led. |
| **ratsit.se** | (masked) | 46.8% | 34.6K | `ratsit`, `ratist`, `rasit`, `ratsit lönekoll` | **Brand-led + misspellings.** SE #47. |
| **livsmedelskollen.se** | — | — | — | — | **Domain does not resolve** (no A record). Incumbent has no web presence — only the app. |

\* Similarweb free tier is ambiguous between "monthly" and "3-month total" (it reported 467.3K);
~156K/mo is the conservative reading. Order of magnitude is what matters.

**The single most valuable row is `foodhygieneratings.org.uk`.** Its top keywords *are* restaurant
names — proving entity pages can rank — while its total of **149 keywords** proves the aggregate
is worthless. That is the empirical answer to "should we build 60,000 restaurant pages for SEO":
**they will index, they will rank, and they will not bring traffic.**

Note also `ratings.food.gov.uk`'s #3 keyword: **`chinese near me`**. The UK government site's
third-biggest term is a *restaurant discovery* query, not a hygiene query. Even the category
winner earns its traffic partly by accident, from discovery intent.

---

## 4. RANKED BUILD ORDER (demand vs. difficulty)

| Rank | Page type | Demand | Difficulty | Why |
|---|---|---|---|---|
| **1** | **City hubs** — `/[stad]`, consumer-titled ("Hygienbetyg för restauranger i Göteborg") | Low (~250/mo total) | **Very low** | Only municipal .se pages compete. Cheap, ranks fast, anchors internal linking, proves indexation for Fas 3. Build ~20–40, **not 290**. |
| **2** | **Reporting tool** — `anmäla restaurang hygien [stad]`, `matförgiftning anmäla` | Low but **high-intent** | Low | Clear unmet intent (19 autocomplete variants). Genuinely differentiated vs. Livsmedelskollen's clumsy e-tjänst. Civic value + goodwill + a private signal of which venues to watch. |
| **3** | **`matförgiftning` cluster** — `[stad]`, `[restaurang]`, `anmäla`, outbreak news | **Highest adjacent (~1.5–3k/mo capturable)** | Medium (YMYL) | The only large pool with honest hygiene relevance. Stay strictly on reporting/incident/venue angles — **do not** write symptom content; you will not beat 1177.se and you risk YMYL quality issues. |
| **4** | **Leaderboards** — `sämsta/bästa hygien i [stad]` | Low search, **high PR/social** | Low | `sämsta restaurangen i [stad]` autocompletes in 8+ cities. Build for **distribution and media**, not for search volume. This is the PR asset from §9 — treat it as the *category-creation* engine, which the data says must come first. |
| **5** | **Branded intercept** — `livsmedelskollen [stad]` | Tiny but **best PMF signal** | Very low | Cities the incumbent does not cover. Cheap to build; validates that people want this product. |
| **6** | **Per-restaurant pages** | **~Zero direct** | Low | Build because they are **the product** and because they capture event-driven outbreak spikes — **not** because they will rank for traffic. **Do not build 60,000 before #1–#4 are proven to rank.** Gate on quality; a huge thin corpus is the exact "scaled content abuse" profile §6 warns about. |
| — | **Restaurant discovery** (`bästa restaurang [stad]`) | Huge | **Very high** | Do not attempt as a primary channel. Revisit only once brand authority exists. |

---

## 5. WHAT WOULD CHANGE THIS VERDICT

The negative finding is about **SEO**, not necessarily about **Prikko**. These would move the needle:

1. **Semrush data contradicting the Trends-derived volumes.** The small-end numbers carry ±2–3×
   error. If `livsmedelskontroll` is really 500/mo rather than 40/mo, the 12-month model roughly
   quintuples — still small, but less bleak. **This is the first thing to check when API units
   are restored.**
2. **Evidence that PR reliably converts to category demand.** The UK's ~24K/mo Sweden-equivalent
   ceiling is real and unoccupied. If one SVT/Aftonbladet "matsnuskliga" placement measurably lifts
   `hygienbetyg`-type query volume, the category-creation thesis is live and the bull case opens.
3. **Direct validation of restaurant willingness to pay** (§10 stream 2). Traffic is not the
   bottleneck for the B2B path — and the B2B path is now the *only* path. Test it before building
   the corpus, not after.
4. **A single-city PoC that actually ranks** (Fas 3). Cheap to run, and it tests indexation and
   ranking directly rather than through modelled volumes.

**Recommendation:** proceed to the Fas 1–3 PoC, because it is cheap and it tests the real
uncertainty. But **rewrite §6 and §10 first**: SEO is a compounding second-order channel here,
not the edge, and the advertising revenue line should be removed. Build the leaderboard/PR engine
and the B2B validation *in parallel with* the PoC, not after it.

---

## 6. SOURCES

- Google Autocomplete API — `suggestqueries.google.com/complete/search?hl=sv&gl=se` (real query logs)
- Google Trends public API — geo=SE / geo=GB, `today 12-m`
- [Ahrefs — food.gov.uk](https://ahrefs.com/websites/food.gov.uk) (anchor: `food hygiene rating` = 14K/mo)
- [Similarweb — scoresonthedoors.org.uk](https://www.similarweb.com/website/scoresonthedoors.org.uk/)
- [Similarweb — ratings.food.gov.uk](https://www.similarweb.com/website/ratings.food.gov.uk/)
- [Similarweb — foodhygieneratings.org.uk](https://www.similarweb.com/website/foodhygieneratings.org.uk/)
- [Similarweb — hitta.se](https://www.similarweb.com/website/hitta.se/) · [ratsit.se](https://www.similarweb.com/website/ratsit.se/)
- [FSA — Understanding Consumer Needs re Food Hygiene Ratings](https://science.food.gov.uk/article/123520) (46% claim to check; 36% actually do; 82% would avoid low-rated)
- [FSA — Food Hygiene Rating Scheme](https://www.food.gov.uk/safety-hygiene/food-hygiene-rating-scheme)
- [Scores on the Doors](https://www.scoresonthedoors.org.uk/) (528,817 premises)
- Semrush MCP — **no data returned; API units exhausted** (https://www.semrush.com/mcp-access)
