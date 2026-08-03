# 13. E-post på prikko.se: ta emot, svara, och skicka till kommunerna

Datum: 2026-08-03. DNS-läget nedan är kört mot prikko.se samma dag med `dig`,
inte gissat. Varje uppgift om Cloudflare, Resend och Gmail är hämtad ur
respektive leverantörs egen dokumentation. Källor står sist.

Det här är en instruktion att följa, inte en utredning. Utredningen ligger under
rubriken **Bakgrund och utredning** längst ned. Ingen kod ändras av det här
dokumentet. Allt sker i tre webbpaneler: Cloudflare, Resend och Gmail.

---

## Vad du har när du är klar

Fyra adresser som tar emot post i din vanliga Gmail-inkorg, och som du kan svara
från så att mottagaren ser `@prikko.se` och aldrig din Gmail-adress.

| Adress | Varför den finns |
|---|---|
| `mans@prikko.se` | Din personliga adress. Den undertecknar utlämnandebegärandena till kommunerna. En namngiven människa är mer trovärdig för en handläggare än `info@`. |
| `dataskydd@prikko.se` | Redan utlovad i integritetspolicyn och står i `site/src/lib/site.ts`. GDPR-begäranden har en månadsfrist. Måste fungera innan sajten får marknadsföras. |
| `ratta@prikko.se` | Redan utskriven på `/ratta`. Den stod inte i uppdraget men finns i koden, så den måste med. |
| `no-reply@prikko.se` | Supabase skickar inloggningskoderna härifrån. Adressen ska kunna ta emot svar, så att en förvirrad användare som trycker svara inte får en studs tillbaka. |

Fler adresser skapar du inte. Inga `info@`, `kontakt@`, `support@`, `press@`
eller `hej@`. Varje adress är en brevlåda som måste bevakas, och en radda
rolladresser bygger en organisation som inte finns.

Kommunkampanjen får ingen egen adress. Den skickas från `mans@prikko.se`, för en
utlämnandebegäran undertecknas av en person och diarieförs som sådan.

---

## Innan du börjar

Ha tre flikar öppna: Cloudflare-panelen, Resend-panelen och Gmail. Räkna med
30 minuter. Gör stegen i ordning: bekräftelsekoden i steg 3 skickas till
`mans@prikko.se`, så mottagningen i steg 1 måste fungera först.

---

## Steg 1. Ta emot post (Cloudflare, cirka 10 minuter)

Roten på prikko.se har i dag **ingen MX-post och ingen TXT-post alls**. Det är
kontrollerat. Resend valde subdomänen `send`, så roten står ledig och det finns
inget att krocka med.

1. Logga in på Cloudflare och välj domänen `prikko.se`.
2. Gå till **Compute** i vänstermenyn, sedan **Email Service**, sedan
   **Email Routing**.
3. Klicka **Onboard Domain**.
4. Cloudflare visar de DNS-poster den vill lägga till. **Läs dem innan du
   godkänner.** Det ska vara:
   - tre MX-poster på roten: `route1.mx.cloudflare.net`,
     `route2.mx.cloudflare.net`, `route3.mx.cloudflare.net`
   - en TXT-post på roten med värdet `v=spf1 include:_spf.mx.cloudflare.net ~all`
   - en DKIM-post
5. **Kontrollera DKIM-postens namn.** Det får inte vara
   `resend._domainkey`. Cloudflare använder ett eget selektornamn, så det ska
   inte kunna krocka, men titta efter. Ser du `resend._domainkey` i listan,
   avbryt och hör av dig innan du klickar vidare.
6. Godkänn. Cloudflare lägger in posterna själv, eftersom DNS redan ligger här.
7. Gå till **Destination Addresses**. Lägg in din Gmail-adress. Cloudflare
   skickar ett bekräftelsemejl. Klicka länken i det. Tills adressen är bekräftad
   är alla regler som pekar på den avstängda.
8. Gå till **Routing Rules** och skapa fyra regler, alla med åtgärden
   *Send to* och din bekräftade Gmail-adress som mål:
   - `mans`
   - `dataskydd`
   - `ratta`
   - `no-reply`
9. På samma sida, slå på **Catch-all rule** med åtgärden *Send to* och samma
   Gmail-adress. Motiv: under kommunkampanjen kommer handläggare att felstava
   adressen, och ett tappat svar från en myndighet går inte att be om igen.
   Börjar det droppa in skräppost efter att domänen skrapats, byt åtgärden till
   *Drop*.

---

## Steg 2. Kontrollera att inget gick sönder

Kör det här i terminalen och jämför mot facit under varje rad.

```
dig +short MX prikko.se
```
Ska ge tre rader med `route1/2/3.mx.cloudflare.net`.

```
dig +short TXT prikko.se
```
Ska ge **exakt en** rad som börjar med `v=spf1`. Ser du två, är domänens
avsändarautentisering trasig. Radera den ena direkt.

```
dig +short MX send.prikko.se
dig +short TXT send.prikko.se
```
Ska vara oförändrade: `feedback-smtp.eu-west-1.amazonses.com` respektive
`v=spf1 include:amazonses.com ~all`. Rör inte de här. De hör till Resends
utgående post och har ingenting med mottagningen att göra.

**Lägg aldrig till Resend i SPF-posten på roten.** Det är frestande och det är
fel. Resend sätter returadressen på `send.prikko.se`, så SPF kontrolleras mot
den subdomänen. Roten behöver bara Cloudflares include.

Skicka sedan ett testmejl från din Gmail till `mans@prikko.se`. Det ska landa i
samma inkorg inom en minut.

---

## Steg 3. Kunna svara från adresserna (Resend och Gmail, cirka 15 minuter)

Cloudflare Email Routing vidarebefordrar men skickar ingenting. För att svara
*från* `mans@prikko.se` behöver Gmail en utgående SMTP-server. Resend fungerar,
och deras SMTP-uppgifter är verifierade mot dokumentationen.

### 3a. Hämta en nyckel i Resend

1. Logga in på Resend, gå till **API Keys**, klicka **Create API Key**.
2. Namn: `gmail-smtp`. Behörighet: **Sending access**. Begränsa den till domänen
   `prikko.se` om fältet finns.
3. Kopiera nyckeln. Resend visar den bara en gång. Lägg den i lösenordshanteraren.

### 3b. Lägg in adressen i Gmail

Gör det här en gång per adress, alltså fyra gånger. Börja med `mans`.

1. Gmail, kugghjulet uppe till höger, **Visa alla inställningar**.
2. Fliken **Konton och import**.
3. Under **Skicka e-post som:** klicka **Lägg till en annan e-postadress**.
4. I rutan som öppnas:
   - **Namn:** `Måns Erlandsson` (för `dataskydd` och `ratta` skriv `Prikko`
     i stället, för de adresserna är roller och inte du)
   - **E-postadress:** `mans@prikko.se`
   - **Behandla som ett alias:** låt den vara **ikryssad**
   - Klicka **Nästa steg**
5. Nästa ruta är SMTP-servern. Fyll i exakt så här:
   - **SMTP-server:** `smtp.resend.com`
   - **Port:** `465`
   - **Användarnamn:** `resend` (bokstavligen ordet resend, inte din adress)
   - **Lösenord:** API-nyckeln från 3a
   - **Skyddad anslutning med SSL** (port 465 är implicit SSL hos Resend)
   - Klicka **Lägg till konto**
6. Gmail skickar en bekräftelsekod till `mans@prikko.se`. Den går via Cloudflare
   till samma inkorg. Klistra in koden.
7. Upprepa för `dataskydd`, `ratta` och `no-reply`.

### 3c. Två inställningar du inte får glömma

Fortfarande under **Konton och import**:

- Sätt **Använd som standard** på `mans@prikko.se`. Annars går nya mejl ut från
  Gmail-adressen utan att du märker det.
- Välj **Svara från samma adress som meddelandet skickades till**. Annars går
  svaret på ett GDPR-ärende ut som `mans@` i stället för `dataskydd@`.

---

## Steg 4. Testa på riktigt, inte bara på dig själv

Skicka ett mejl från `mans@prikko.se` till en adress hos **Outlook eller
Microsoft 365**, inte till en Gmail-adress. Kommunerna kör nästan uteslutande
Microsoft, och Microsoft är strängast mot nya domäner.

Öppna det mottagna mejlet och visa källkoden. Kontrollera tre saker:

1. Det ska stå `dmarc=pass` i `Authentication-Results`.
2. Det ska stå `dkim=pass` med `d=prikko.se`.
3. Det får **inte** finnas någon `Sender:`-rad som avslöjar din Gmail-adress.
   Gör det ändå, så visar Outlook mejlet som "på uppdrag av", och det ser
   oseriöst ut för en handläggare. Hör av dig om raden dyker upp.

Testa också att det hamnar i inkorgen och inte i skräpposten.

---

## Steg 5. Före kommunkampanjen: läs det här, hoppa inte över det

Det finns två problem med att skicka 237 utlämnandebegäranden genom uppställningen
ovan, och de är av olika slag.

### Problem 1: Resends villkor tillåter det förmodligen inte

Resends Acceptable Use Policy säger rakt ut att oombedda meddelanden är
förbjudna, "including cold outreach", och att all post ska gå till mottagare som
uttryckligen tackat ja. En handläggare på Arboga kommun har inte tackat ja till
någonting.

Att begäran juridiskt är en framställan enligt tryckfrihetsförordningen och inte
marknadsföring hjälper inte mot ett villkor som är skrivet i termer av samtycke.
Det här är alltså tveksamt, och jag säger det rakt ut i stället för att låta dig
upptäcka det när kontot stängs av.

**Det allvarliga är kopplingen.** Supabase skickar inloggningskoderna genom samma
Resend-konto. Stryper eller stänger Resend kontot på grund av kampanjen, kan
ingen logga in på Prikko. Kampanjen och inloggningen får inte dela öde.

Lägg till att gratisnivån är 3 000 mejl per månad med tak på 100 per dygn. 237
mejl äter tre dygns hela kvot, och inloggningskoderna får dela på det som blir
över.

### Vad du gör i stället

Skaffa en riktig brevlåda innan kampanjen och flytta människopost dit. Det är en
kostnad på några hundralappar om året och det löser båda problemen: en brevlåda
med IMAP har en skickat-mapp, egen SMTP, och inga villkor mot vanlig
korrespondens. Inleed, där domänen redan ligger, säljer e-posthosting, och
Migadu och Fastmail är de vanliga alternativen.

Konsekvensen: MX på roten kan bara peka på ett ställe. Väljer du en riktig
brevlåda ersätter den Cloudflare Email Routing på roten. Det är ett byte av
MX-poster och en ny SMTP-uppgift i Gmail, alltså tio minuter, inte ett omtag.

Så gör så här:

- **Nu:** kör stegen 1 till 4. De är gratis och de gör `dataskydd@` och `ratta@`
  levande, vilket är det som blockerar publiceringen.
- **Före kampanjen:** flytta `mans@`, `dataskydd@` och `ratta@` till en riktig
  brevlåda. Låt Resend behålla `no-reply@` och ingenting annat.

Vill du hellre stanna kvar på Resend, fråga deras support först, skriftligt, och
beskriv att det handlar om individuella framställningar till myndigheter. Ett
skriftligt ja är värt mer än en gissning.

### Problem 2: domänen har noll sändhistorik

prikko.se har aldrig skickat ett enda mejl. Ett utskick till 237 myndigheter från
en färsk domän är den klassiska vägen rakt ned i skräpposten, och hos en kommun
är det värre än vanligt: första intrycket går inte att göra om hos någon som
diarieför allt.

Googles egna avsändarriktlinjer säger att man ska börja med låg volym och öka
långsamt, undvika volymtoppar, och backa om studsarna ökar. Microsoft är
strängare än så. Praktisk plan:

- **Vecka 1:** 10 mejl per dag. Börja med de tolv kommuner som redan är med i
  Prikko, för dem har du en relation till.
- **Vecka 2:** 25 per dag, om inga studsar och inga skräppostmarkeringar.
- **Vecka 3 och framåt:** 40 per dag. Hela listan är ute på ungefär tre veckor.
- Backa ett steg direkt om studsarna ökar.

Regler som gäller hela vägen:

- **Ett mejl per mottagare.** Aldrig BCC till 237 adresser. Det är den enskilt
  starkaste skräppostsignalen som finns.
- **Personalisera på riktigt.** Kommunens namn, myndighetens namn, och en mening
  som visar att du vet vad de publicerar i dag.
- **Slå av öppnings- och klickspårning i Resend** om du ändå skickar därifrån.
  Spårningspixlar och omskrivna länkar får en utlämnandebegäran att se ut som
  reklam, och det syns i filtren.
- **Ren text eller nästan ren text.** Inga bilder, ingen mall, inga
  länkförkortare.
- **En svarsadress som en människa läser.** Det är `mans@prikko.se`, och den ska
  vara bevakad under hela kampanjen.
- Skicka på vardagar under kontorstid. Post som kommer 02:40 en söndag ser
  automatiserad ut.
- Kom ihåg R11: mottagarlistan byggs på kontrollmyndighet, inte på kommun. Det är
  cirka 237 mottagare, inte 275, och fyra mejl till samma handläggare är värre än
  ett.

---

## Steg 6. Skärp DMARC, men först när allt annat fungerar

I dag står det `v=DMARC1; p=none;` på `_dmarc.prikko.se`. Ingen rapportadress,
alltså får du inga rapporter, alltså vet du ingenting om hur din post behandlas.

**Gör nu, samtidigt som steg 1:** ändra posten i Cloudflares DNS till

```
v=DMARC1; p=none; rua=mailto:dmarc@prikko.se; fo=1
```

och lägg till `dmarc` som en femte routingregel i steg 1.8, eller lita på
catch-all-regeln.

Rapportadressen **måste ligga på prikko.se**. Pekar `rua` på en Gmail-adress
kräver standarden att gmail.com publicerar en godkännandepost för prikko.se, och
det gör Google inte. Rapporterna skulle tyst kastas.

**Gör om två till fyra veckor**, när rapporterna visat grönt för både Resends
utgående post och Cloudflares vidarebefordran: byt till

```
v=DMARC1; p=quarantine; pct=25; rua=mailto:dmarc@prikko.se; fo=1
```

Höj `pct` till 50, sedan 100, sedan byt till `p=reject`. Ett steg i taget, med
minst en vecka emellan.

**Skärp aldrig DMARC under pågående kampanj.** Om något är felkonfigurerat märker
du det på 237 misslyckade myndighetskontakter. Skärp före, eller efter.

En varning: Cloudflare skriver själva att restriktiva DMARC-policyer kan göra att
vidarebefordrad post inte kommer fram. Vid `p=reject` behöver du ha sett
`dkim=pass` för din vidarebefordrade post i rapporterna först.

---

## Bakgrund och utredning

### DNS-läget som det faktiskt ser ut, kört 2026-08-03

| Namn | Typ | Värde |
|---|---|---|
| `prikko.se` | MX | tomt |
| `prikko.se` | TXT | tomt |
| `send.prikko.se` | MX | `10 feedback-smtp.eu-west-1.amazonses.com` |
| `send.prikko.se` | TXT | `v=spf1 include:amazonses.com ~all` |
| `resend._domainkey.prikko.se` | TXT | finns, 1024-bitars nyckel |
| `_dmarc.prikko.se` | TXT | `v=DMARC1; p=none;` |
| `prikko.se` | NS | `lia.ns.cloudflare.com`, `jeff.ns.cloudflare.com` |

**SPF-fällan visade sig inte finnas.** Antagandet i uppdraget var att en befintlig
SPF-post på roten skulle krocka med den Cloudflare lägger till. Roten har ingen
TXT-post över huvud taget. Resend lade sin SPF på `send`, inte på roten, just för
att hålla returadressen separerad. Cloudflare kan alltså lägga sin SPF på roten
utan att något går sönder. Fällan flyttar i stället framåt i tiden: den slår till
den dag någon "hjälpsamt" lägger till Resend i rotens SPF och domänen plötsligt
har två poster som börjar med `v=spf1`.

**DMARC-justering fungerar redan.** Resend signerar med `d=prikko.se`, vilket
ligger i linje med avsändaradressen. Returadressen ligger på `send.prikko.se`,
vilket ligger i linje med roten under avslappnad matchning. Både DKIM och SPF
justerar alltså, och DMARC går igenom på båda benen. Det är därför skärpning till
`p=reject` är realistisk på sikt.

### Varför Cloudflare Email Routing och inte något annat

Gratis, ligger i samma panel som DNS, och tar roten som står ledig. Gränserna som
spelar roll: 200 destinationsadresser per konto, 5 MiB per meddelande, 25 MiB om
mottagaren är en verifierad destinationsadress. Ingen mottagen bilaga från en
kommun kommer i närheten.

Den kan inte skicka. Det är hela anledningen till att steg 3 finns.

### Varför inte Cloudflares egen sändtjänst

Cloudflare har numera utgående SMTP på `smtp.mx.cloudflare.net`, port 465, med
API-token som lösenord. Det skulle samla allt i en panel. Men den ligger i beta
och kräver Workers Paid. Den är alltså varken gratis eller färdig, och därför
faller den bort i dag. Värd att titta på om ett år.

### Resends villkor, ordagrant

Acceptable Use Policy: "You are prohibited from sending unsolicited messages of
any kind, including cold outreach, purchased lists, or scraped contact data" och
"All mail must be sent to recipients who have explicitly opted in to receive
communications from you."

För `mans@`, `dataskydd@` och `ratta@` i vardagligt bruk är det här inget problem:
svar på inkommande post är per definition inte oombedda. För kampanjen är det ett
problem. Slutsatsen står i steg 5.

Gratisnivån: 3 000 mejl per månad, tak 100 per dygn, en verifierad domän, 30
dagars loggar. Sändningen pausas vid taket i stället för att kosta pengar, vilket
låter vänligt tills det är inloggningskoderna som pausas.

### Om adressvalet

Uppdraget föreslog en särskild avsändare för kommunkampanjen. Den behövs inte och
gör skada. En utlämnandebegäran enligt tryckfrihetsförordningen och öppna
data-lagen är en handling som undertecknas av en person, och den diarieförs med
avsändare. `kommun@prikko.se` eller `data@prikko.se` läses av en handläggare som
ett massutskick, vilket det tekniskt sett också är. `mans@prikko.se` med ett
riktigt namn under är både ärligare och mer verkningsfullt.

`ratta@prikko.se` fanns inte i uppdraget men står redan utskriven i
`site/src/pages/ratta.astro` och i `site/src/lib/site.ts`. Den är alltså lika
utlovad som `dataskydd@` och lika obligatorisk.

### Källor

- Cloudflare, Email Routing, DNS-poster:
  https://developers.cloudflare.com/email-routing/setup/email-routing-dns-records/
- Cloudflare, Email Routing, adresser och regler:
  https://developers.cloudflare.com/email-routing/setup/email-routing-addresses/
- Cloudflare, Email Routing, gränser:
  https://developers.cloudflare.com/email-routing/limits/
- Cloudflare, postmaster, SRS och DMARC vid vidarebefordran:
  https://developers.cloudflare.com/email-routing/postmaster/
- Cloudflare, utgående sändning, beta och Workers Paid:
  https://developers.cloudflare.com/email-routing/email-sending/
- Resend, SMTP-uppgifter: https://resend.com/docs/send-with-smtp
- Resend, Acceptable Use Policy: https://resend.com/legal/acceptable-use
- Resend, kvoter och gränser:
  https://resend.com/docs/knowledge-base/account-quotas-and-limits
- Google, riktlinjer för avsändare: https://support.google.com/a/answer/81126
- Gmail, skicka e-post som: https://support.google.com/mail/answer/22370
- Egen research: `research/R11_utlamnandeplan.md` för mottagarlistan och
  formuleringen av begäran.
