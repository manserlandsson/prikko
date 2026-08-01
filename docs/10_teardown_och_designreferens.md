# Referensdokument: Konkurrent- & Designteardown
### Nationell hygien-/livsmedelskontrollsajt för Sverige
*Arbetsnamn: Hygienkartan (platshållare — ej "Smiley", varumärkesskyddat). Version 1, 2026-07-15.*

---

## 0. Vad vi bygger (positionering)
Det nationella konsumentlagret för livsmedelskontroll som staten aldrig byggde. En snygg, snabb, SEO-först webbtjänst som samlar kommunernas offentliga kontrollresultat till ETT jämförbart betyg per restaurang — med karta, historik och verksamhetens svar. Bevisat utomlands (DK, NO, UK), bekräftat gap i Sverige, byggt kring Måns edge: SEO/distribution + dataaggregering (Cysel-mönstret).

**Ledstjärna:** användarvärde och förtroende först, kommersialisering sen. Förtroendet ÄR tillgången.

---

## 1. Gap & marknad (bekräftat)
- **Ingen nationell konsumentsajt finns.** Närmaste är Livsmedelskollen (Visma-app) som flera kommuner kör — men per kommun, app (usel SEO), myndighetskänsla, ingen nationell aggregering. Enda aktören att bevaka.
- **Efterfrågan bevisad:** Sifo/Tork — var femte gäst missnöjd med hygien; SVT gör återkommande "matsnusk"-granskningar manuellt (Jönköping, Malmö, Helsingborg); SVT själva: "det finns inget system som låter konsumenter veta vilka restauranger fått varningar."
- **Staten har avstått i 20 år** (prop 2005/06:214 drogs tillbaka 2006) → gapet är politiskt hållbart.

---

## 2. Internationell teardown

### Danmark — Smiley (sedan 2001, findsmiley.dk)
- **Strategi:** obligatoriskt statligt system; skylt i fönstret + rapport på sajt. Elite-Smiley (2008) för bäst historik.
- **Betyg:** fyra ansikten. Visar de **tre senaste** kontrollerna (historik, inte bara senaste).
- **Stjäl:** historik-visning; elit-/toppmärke som morot; kulturen "skylt i fönstret".

### Norge — Smilefjes (sedan 2016, smilefjes.mattilsynet.no)
- **Strategi:** obligatoriskt; byggt av Computas.
- **Betyg:** tre ansikten (glad/rak/sur). Fyra huvudområden, 25 kontrollpunkter — **sämsta delbetyget avgör** ansiktet.
- **Stjäl:** "sämsta punkten avgör" = enkel, förklarbar, svår att bråka om → grunden för vår normalisering.

### Storbritannien — FHRS (sedan 2010, ratings.food.gov.uk)
- **Strategi:** statlig data, men **rik privat flora ovanpå** (foodhygieneratings.org.uk, foodhygienemap.com, blueroll) = bevis på exakt vår modell.
- **Betyg:** 0–5. Klistermärke. **Inbäddningsbara auto-badges** (JS som uppdateras vid nytt betyg).
- **UX-standard:** sök på postnummer/område, karta med färgprickar + lista, filter på betyg/typ/allergi, per-ställe-sida med trend, favoriter, kommunstatistik.
- **Stjäl:** badge-ekosystemet (= backlänkar/SEO), sök+karta+filter-standarden, schema.org så Google visar betyget.

### USA/Kanada — bokstavsbetyg (NYC/LA A/B/C, Toronto DineSafe grönt/gult/rött)
- **Strategi:** stort ikoniskt betyg i fönstret. 88% av New York-borna väger in det.
- **Nyckelinsikt (Toronto):** 75% kände till **skylten**, bara 10% till sajten → offline-skylt driver mer medvetenhet än webben.
- **Design:** NYC:s feta A-placard + Time Outs interaktiva karta = "amerikanskt coolt".
- **Stjäl:** ikoniskt, distinkt betygsmärke; **gratis fönsterdekaler till bra ställen** = offline-distribution + varumärke.
- **Varning (Stanford-forskning):** betygsinflation vid upprepade inspektörsmöten → normaliseringen måste vara transparent.

---

## 3. Svenska piloten (varför det dog = vår lärdom)
- **SOU 2005:44 "Smiley"** föreslog symbolsystem à la Danmark. **Prop 2005/06:214** föreslog frivillig 3-årig pilot i några kommuner.
- **Drogs tillbaka 15 nov 2006**, ej hanterad sedan dess.
- **Varför:** inte teknik — branschmotstånd (SHR/Visita) + oro att förtroendet skulle skadas.
- **Lärdom:** du står stabilare än staten gjorde eftersom du inte *tvingar* någon — du speglar offentliga handlingar. Försvar: faktisk data + replikrätt (finns i dataschemat) + utgivningsbevis.

---

## 4. Närliggande tjänster att stjäla UI/UX från
- **Zillow / Airbnb:** karta-som-hjälte + kort-layout, sömlöst sök. → vår hemsida.
- **Yelp / Eatie:** restaurangprofil, men vi är renare och faktabaserade (ej recensioner).
- **Ratsit / Hitta / Merinfo:** svensk offentlig-data-SEO i praktiken (utgivningsbevis, programmatiska sidor). → juridik + SEO-modell.
- **Prisjakt:** jämförelse-UX, "bäst i test"-listor. → leaderboards.
- **The Pudding / NYT-grafik:** datajournalistisk skärpa. → så vi undviker AI-slask-känslan.

---

## 5. Betygssystem (designbeslut)
- **Ej smiley** (varumärke + urvattnat). Rekommendation: eget, distinkt märke — antingen **bokstav/graderad sköld** (NYC-ikoniskt) eller **trafikljus + siffra**.
- **Modell:** Norges "sämsta punkten avgör" som förklarbar grund; visa **historik (3 senaste)** som Danmark; **topp-märke** för konsekvent bäst (Elite-Smiley-morot).
- **Transparens:** publicera hela metodiken öppet (egen sida). Normalisera för att kommuner bedömer olika (likvärdighetsproblemet). Detta = din IP och ditt juridiska/förtroendemässiga skydd.

---

## 6. Varumärke & juridik
- **Undvik namnet "Smiley"** (The Smiley Company, aggressiv enforcement). Eget namn + egen ikon.
- **Utgivningsbevis** (som Ratsit/Hitta) → grundlagsskydd vid publicering av namngivna verksamheter.
- **Replikrätt** synlig på varje sida (fältet `ownerComment` finns i datan).
- Kör PRV/EUIPO-sökning + varumärkesjurist innan namnet låses.

---

## 7. UI / visuell riktning ("inte AI-slask")
- **Principer:** redaktionell skärpa, generöst utrymme, stark typografisk hierarki, EN självsäker varumärkesfärg + neutral gråskala, platt (inga gradienter/AI-glow).
- **Betyget är hjälten** — stort, färgkodat, ikoniskt, konsekvent överallt.
- **Kartan är navet** på hemsidan (Zillow-känsla), färgprickar = betyg.
- **Egen ikonografi**, ej lager-emoji. Riktig typografi (t.ex. en grotesk + en läsbar text-face).
- Referens-look: NYC-placard + Airbnb-karta + NYT-datagrafik.

---

## 8. UX / flöden
1. **Hemsida:** stort sökfält ("sök restaurang eller stad") + karta med färgprickar + "bäst/sämst i din stad"-modul.
2. **Restaurangsida (SEO-money-page):** namn, adress, stort betyg, karta, kontrollhistorik (tidslinje), godkända vs anmärkta punkter, verksamhetens svar, källa+metodik-länk.
3. **Listsidor/leaderboards:** "sämsta restaurangerna i [stad]", "bäst hygien i [stadsdel]", per kök. Stor sökvolym + PR-magnet.
4. **Badges:** inbäddningsbar auto-badge + gratis fysiska dekaler.

---

## 9. SEO-arkitektur (prio 1 från dag 1)
- **Programmatiska sidor:** en per restaurang, stad, stadsdel, kök. Schema.org (LocalBusiness + rating) → betyg i Googles sökresultat.
- **Leaderboard-sidor** för high-intent long-tail ("matsnusk [stad]", "bäst hygien [stad]").
- **Intern länkning** stad → stadsdel → restaurang. Snabb statisk generering (hastighet = ranking).
- **Backlänkar** via inbäddningsbara badges (UK-modellen).

---

## 10. Datastrategi
- **Bas (ryggrad):** restauranglista från SCB/Bolagsverket (gratis sedan feb 2025, SNI 56) + öppna datans anläggningar. Join på org.nr.
- **Kontrollresultat, tre nivåer:** (1) öppna data enligt Sambruk-spec (JSON/CSV, CC0) — ät direkt; (2) skrapa kommuner som publicerar (Stockholm/Uppsala/Karlstad Livsmedelskollen, Jönköping-karta, Malmö); (3) resten via **offentlighetsprincipen — massutlämnande** (Nylander-metoden).
- **Under huven = 3 system:** Ecos (Sokigo), EDP Vision (Vertigis), Castor (Prosona). Bygg robust inläsning för dem.
- **Fält vi får** (ur JSON-schemat): namn, org.nr, typ, riskklass, WGS84-koordinater, nationellt id, kontrolldatum, godkända/anmärkta kontrollpunkter, bedömning, verksamhetens kommentar, datum.
- **Färskhet:** re-polla per källa (t.ex. Stockholm visar 3 v efter kontroll). 2 v fördröjning för replikrätt.
- **Coverage-plan:** storstäder först (PoC) → topp-20 kommuner → massutlämnande för svansen.

---

## 11. Distribution & lansering
- **PR-splash:** ge redaktionerna en färdig **nationell "matsnuskliga"** (SVT gör den manuellt idag). Gratis räckvidd.
- **TikTok:** äckel-fascination + "kolla din stamkrog" = självspridande. Kort format, per stad.
- **Fönsterdekaler** till bra ställen (Toronto-insikten).
- **Inbäddningsbara badges** = backlänkar + spridning.

---

## 12. Monetisering (senare — ej dag 1)
- Displayannonser på trafiken; "claim & hantera profil" till restauranger; premium-badges; **B2B-datalicensiering** (bevisad efterfrågan — danska Smiley-datan används av leverantörsbedömning).
- **Etikregel:** sälj ALDRIG förbättringstjänster till ställen du själv gett dåligt betyg (utpressnings-optik). Skydda förtroendet.

---

## 13. Risker & motdrag
| Risk | Motdrag |
|---|---|
| Branschmotstånd (Visita) | Faktisk offentlig data + replikrätt + utgivningsbevis |
| Kommuner bedömer olika (likvärdighet) | Transparent, publicerad normaliseringsmetodik |
| Datainsamling seg (200 kommuner) | Öppna data först, massutlämnande för resten; 3-system-inläsning |
| Visma/Livsmedelskollen går nationellt | Vinn på SEO/webb + varumärke + badges + täckning innan de rör sig |
| Staten bygger eget | Låg (20 års passivitet); och du kan bli den de partnar med |
| Gles täckning tidigt | Storstäder först, var transparent om vad som saknas |

---

## 14. Roadmap (innan Claude Code-bygget)
1. Lås designsystem + betygssystem + arbetsnamn (varumärkessök).
2. Bygg en-stad-PoC (Stockholm): ryggrad + öppna data + normaliserat betyg + SEO-sidmall.
3. Mät: rankar vi? Ser datan bra ut? Känns produkten?
4. Utöka stad för stad; starta massutlämnanden parallellt.
5. Lanserings-PR (matsnuskliga) när täckningen räcker.
