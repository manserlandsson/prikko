# 58. Registreringen: når bekräftelsemejlet fram?

Datum: 2026-09-05. Allt nedan är mätt samma dag mot det riktiga Supabase-projektet,
mot prikko.se:s riktiga DNS, och mot ett mejl som verkligen kom fram och vars
rubriker är lästa i klartext. Ingenting här är antaget.

---

## Kort svar

**Mejlet skickas, och det skickas rätt.** Det går ut via Resend från
`no-reply@prikko.se`, det är signerat med DKIM på prikko.se, och det klarar SPF
och DMARC hos mottagaren. Ett prov som gjordes i dag tog **två sekunder** från
knapptryck till inkorg.

**Misstanken i uppdraget var fel på en punkt som är värd att ta bort direkt:**
det här är inte Supabas inbyggda mejl. Det är egen SMTP mot Resend, det har det
varit sedan augusti, och gränsen på några få mejl per timme gäller alltså inte
oss.

**Det som återstår är var mejlet hamnar.** Och där finns ett mönster som är
svårt att bortse från: varje registrering till en brevlåda hos **Google**
bekräftades inom 35 sekunder. Ingen av registreringarna till en brevlåda hos
**Microsoft** bekräftades alls.

Mönstret bygger på två Microsoft-adresser. Det är för få för att kalla det
bevisat, och punkt 1 i åtgärdslistan finns just för att avgöra saken på riktigt
innan spåret hinner försvinna.

---

## Mätningen om, 2026-09-05

Talen i uppdraget var fyra dagar gamla. De står sig.

**Tio konton i `auth.users`, oförändrat sedan 2026-09-01.** Inga nya
registreringar på fyra dygn, alltså har inget nytt fall tillkommit.

Två av de tio är testkonton som lagts in genom admin-API:et,
`prikko-test-a@example.com` och `prikko-test-b@example.com`. De har
`confirmation_sent_at = null`, alltså har det aldrig skickats något mejl till
dem. De hör inte hit och räknas bort.

Kvar står **åtta riktiga registreringar**, och de faller ut så här:

| Adress | Skapad (UTC) | Vem tar emot posten | Bekräftad |
|---|---|---|---|
| mans.erlandsson1@gmail.com | 2026-08-03 15:36 | Google | ja, efter ett omskick |
| asaerlandsson818@gmail.com | 2026-08-03 16:42 | Google | ja, efter 28 s |
| landeskogadam@gmail.com | 2026-08-04 09:55 | Google | ja, efter 16 s |
| clicknpick@live.se | 2026-08-05 12:35 | **Microsoft** | **nej** |
| mans@magoed.com | 2026-08-05 13:03 | Google Workspace | ja, efter 25 s |
| mans@magoed.se | 2026-08-11 07:16 | **ingen brevlåda alls** | **nej** |
| muniswamyramya@gmail.com | 2026-08-25 09:30 | Google | ja, efter 35 s |
| omer.yaman88@hotmail.com | 2026-09-01 00:00 | **Microsoft** | **nej** |

Sammanräknat:

- Google: **5 av 5** bekräftade, samtliga inom 35 sekunder.
- Microsoft: **0 av 2**.
- Ingen brevlåda: **0 av 1**.

`live.se` och `hotmail.com` pekar båda på `olc.protection.outlook.com`, alltså
samma Microsoft. `gmail.com` och `magoed.com` pekar båda på Googles servrar.
Det är kontrollerat med `dig`, inte gissat på adressens utseende.

### Ditt eget test på magoed.se är inget fall

`mans@magoed.se` saknar **MX-post helt**. Domänen kan inte ta emot post över
huvud taget. Det mejlet kunde aldrig komma fram, oavsett hur allting annat är
uppsatt, och det säger därför ingenting om problemet. Ta bort det ur
resonemanget.

Då återstår **två förlorade utomstående, och båda ligger hos Microsoft**.

### Sannolikheten, rakt ut

Sju riktiga mottagare hade en fungerande brevlåda. Fem lyckades, två
misslyckades. Att just de två som misslyckades skulle vara just de två
Microsoft-adresserna, av ren slump, har en chans på 21. Alltså ungefär fem
procent.

Det är en signal, inte ett bevis. Det finns en tävlande förklaring som inte går
att avfärda med de här talen: den ena registrerade sig **00:00:31 en natt**, och
folk som fyller i formulär mitt i natten kommer ofta inte tillbaka. Punkt 1
nedan skiljer förklaringarna åt.

---

## Så fungerar registreringen

Ingen magisk länk och inget lösenord. **Sexsiffrig engångskod till e-post.**

1. `SignInDialog.astro` steg 1 tar adressen och kallar `requestCode()` i
   `site/src/lib/community.ts`.
2. `requestCode()` gör `POST /auth/v1/otp` med `create_user: true`. Samma anrop
   skapar kontot om adressen är ny och loggar in om den redan finns. Därför
   heter rubriken "Logga in eller bli medlem" och därför finns bara ett fält.
3. Supabase skapar raden i `auth.users` och lämnar över mejlet till SMTP.
4. Steg 2 i rutan tar emot sex siffror och kallar `verifyCode()`, som gör
   `POST /auth/v1/verify` med `type: 'email'`.

Ingen lämnar sajten. Sidan `konto/inloggad.astro` används bara av Google och
Apple, och de är avstängda.

---

## Mejluppsättningen, som den faktiskt ser ut

Det här är läst ur rubrikerna på ett mejl som kom fram, inte ur en panel.

```
From:         Prikko <no-reply@prikko.se>
Subject:      Din kod till Prikko
Return-Path:  <...@send.prikko.se>
Received:     from a6-244.smtp-out.eu-west-1.amazonses.com [54.240.6.244]
dkim=pass     header.i=@prikko.se header.s=resend
dkim=pass     header.i=@amazonses.com
spf=pass      smtp.mailfrom=...@send.prikko.se
dmarc=pass    (p=NONE) header.from=prikko.se
```

Alltså:

- **Egen SMTP mot Resend är redan påslagen i Supabase.** Resend kör på Amazon
  SES i eu-west-1, vilket är exakt vad `Received`-raden visar.
- **prikko.se är redan verifierad avsändardomän hos Resend.**
  `resend._domainkey.prikko.se` ligger i DNS och signaturen går igenom med
  `d=prikko.se`.
- **Mallen är redan svensk och bär koden.** Innehållet är sex siffror,
  giltiga i en timme. Det finns **ingen inloggningslänk alls** i mejlet.
- **SPF, DKIM och DMARC går alla igenom.**

`RESEND_API_KEY` behöver alltså inte skaffas för det här. Den är redan i bruk
som SMTP-lösenord i Supabase. Det som står i `docs/13_epost_pa_prikko_se.md`
om att Supabase ska skicka från `no-reply@prikko.se` är genomfört.

---

## Autentiseringsloggarna kring de två fallen

**2026-09-01, den som försvann klockan 00:00.**

```
23:58:38  GET  /rest/v1/published_reviews?...establishment_id=eq.F-0180-...   200
00:00:31  OPTIONS /auth/v1/otp                                               200
00:00:31  POST    /auth/v1/otp                                               200
00:00:31  auth_audit: user_confirmation_requested  omer.yaman88@hotmail.com
00:00:33  auth_logs: request completed, status 200, duration 2,1 sekunder
```

Läsningen av det:

- Personen läste en riktig verksamhetssida två minuter innan. Ingen robot.
- Anropet gav **200**, inte ett fel.
- Det tog **2,1 sekunder**. Det är tiden det tar att lämna över ett mejl till en
  SMTP-server och få ett ja tillbaka. Hade överlämningen misslyckats hade
  GoTrue svarat 500, och rutan hade visat "Koden kunde inte skickas", för den
  översättningen finns redan i `translate()`.

**Mejlet skickades alltså. Det är avgjort.**

2026-08-05 är utanför loggfönstret och går inte att granska på samma sätt.

**Ingen studs har synts till.** Det beror inte på att det inte studsat, utan på
att returadressen ligger på `send.prikko.se`, vars MX pekar tillbaka in i
Amazon SES. Studsar går till Resend, inte till dig. Du kan alltså inte se dem
i din inkorg, och det är därför punkt 1 nedan finns.

**Nytt prov i dag.** En kod begärdes till `mans@magoed.com` klockan 08:52:46
och låg i **inkorgen** 08:52:48, inte i skräpposten. Kedjan fungerar alltså
fortfarande, i dag, mot Google.

---

## Vad som inte är fel

Städat ur vägen, så att ingen letar där igen:

- **Inte Supabas inbyggda mejl.** Egen SMTP är påslagen. Taket på några få mejl
  per timme och den generiska avsändaren gäller inte oss.
- **Inte att mejlet saknar kod.** Mallen är utbytt sedan länge. Sex siffror står
  i både text- och HTML-delen.
- **Inte en trasig bild i mejlet.** `https://prikko.se/prikko-wordmark-email.png`
  svarar 200 och är en riktig PNG på 3 kB.
- **Inte att avsändaren är oautentiserad.** DKIM, SPF och DMARC går igenom alla
  tre.
- **Inte att koden inte kan skickas om.** Knappen "Skicka en ny kod" har funnits
  hela tiden.
- **Inte att det saknas en sida som säger "kolla din inkorg".** Steg 2 i rutan
  har alltid sagt "Vi har skickat en kod till" och adressen.

---

## Vad som troligen är fel

Mejlet skickas, är korrekt undertecknat, och kommer fram hos Google på två
sekunder. Kvar står mottagarsidan, och där är prikko.se en domän utan historia
som Microsoft aldrig sett förut. Fyra saker gör den svagare än den behöver
vara, och alla fyra går att rätta.

**1. prikko.se har ingen MX-post.** Roten är tom. Avsändaradressen
`no-reply@prikko.se` kan alltså inte ta emot ett enda mejl. För ett filter är
en avsändardomän som inte går att skriva till en klassisk skräppostsignal, och
för en förvirrad människa som trycker svara är den en vägg. Steg 1 i
`docs/13_epost_pa_prikko_se.md` beskriver precis det här och är aldrig utfört.

**2. prikko.se har ingen SPF-post på roten.** Enda TXT-posten på roten är en
`google-site-verification`. DMARC går ändå igenom, eftersom kontrollen görs mot
returadressen på `send.prikko.se`, men en avsändardomän som inte publicerar SPF
alls är ännu en sak som drar ned.

**3. DMARC står på `p=none` utan rapportadress.** Posten lyder
`v=DMARC1; p=none;` och ingenting mer. Ingen `rua`, alltså inga rapporter,
alltså **är vi blinda**. Det är den egentliga anledningen till att den här
utredningen behövde göras med `dig` och Gmail i stället för med en rapport.
Steg 6 i dokument 13 beskriver rättelsen och är aldrig utförd.

**4. Domänen har nästan ingen sändhistorik.** Första mejlet gick 2026-08-03.
Det totala antalet är i storleksordningen ett femtontal. Microsoft är
notoriskt strängt mot färska lågvolymdomäner, och det stämmer med att just
Microsoft är där det faller.

En femte punkt som inte är fel men värd att veta: DKIM-nyckeln är på 1024 bitar,
vilket är Resends förval. Den godtas överallt i dag, den går igenom, men 2048
är det som rekommenderas. Byt den när du ändå är inne, inte som en brådskande
sak.

---

## Åtgärdslista

Punkt för punkt, i ordning. Punkt 1 har en tidsgräns.

### 1. Slå upp det försvunna mejlet i Resend. Gör det före 1 oktober.

Det här är den enda mätning som avgör saken, och Resends loggar på gratisnivån
är **30 dagar**. Mejlet från 2026-08-05 är redan borta. Mejlet från 2026-09-01
finns kvar till ungefär 1 oktober, och sedan är även det spåret väck.

1. Logga in på Resend.
2. Gå till **Logs**.
3. Sök upp mejlet till `omer.yaman88@hotmail.com`, skickat
   **2026-09-01 klockan 00:00:32 UTC**, med ämnet `Din kod till Prikko`.
4. Läs statusen och hör av dig med vad det står. Det finns tre svar och de
   pekar åt tre olika håll:
   - **Delivered:** Microsoft tog emot mejlet. Då ligger det i skräpposten
     eller så öppnade personen det aldrig. Punkterna 2 till 4 nedan är då rätt
     medicin.
   - **Bounced:** Microsoft avvisade det. Studstexten säger nästan alltid
     varför, ofta med en kod som `S3140` eller `550 5.7.1`. Skicka den texten
     vidare, den pekar rakt på åtgärden.
   - **Complained:** någon tryckte skräppost. Osannolikt men värt att veta.

Titta samtidigt på **Domains → prikko.se** i Resend efter varningar om
avsändarrykte.

### 2. Sätt på DMARC-rapporter

Utan dem sker nästa utredning likadant som den här, alltså i blindo.

1. Cloudflare, domänen `prikko.se`, **DNS → Records**.
2. Ändra TXT-posten på `_dmarc` från `v=DMARC1; p=none;` till:

```
v=DMARC1; p=none; rua=mailto:dmarc@prikko.se; fo=1
```

Rapportadressen **måste** ligga på prikko.se. Pekar den på en Gmail-adress
kastas rapporterna tyst, eftersom gmail.com inte publicerar något
godkännande för prikko.se. Adressen börjar fungera i punkt 3.

### 3. Ge prikko.se en brevlåda, alltså MX på roten

Det här är steg 1 i `docs/13_epost_pa_prikko_se.md`, skrivet 2026-08-03 och
aldrig utfört. Det tar tio minuter och det är den största enskilda sak du kan
göra åt avsändarryktet, för det gör `no-reply@` och `dmarc@` till adresser som
finns på riktigt i stället för till namn i en From-rad.

Följ dokument 13 rakt av. I korthet:

1. Cloudflare, `prikko.se`, **Compute → Email Service → Email Routing**.
2. **Onboard Domain**. Läs de föreslagna posterna innan du godkänner: tre
   MX-poster på `route1/2/3.mx.cloudflare.net`, en TXT med
   `v=spf1 include:_spf.mx.cloudflare.net ~all`, och en DKIM-post.
3. Kontrollera att DKIM-posten **inte** heter `resend._domainkey`. Gör den det,
   avbryt och hör av dig.
4. **Destination Addresses:** lägg in din Gmail och klicka länken i
   bekräftelsemejlet.
5. **Routing Rules:** `mans`, `dataskydd`, `ratta`, `no-reply` och `dmarc`, alla
   med *Send to* och din bekräftade Gmail som mål. Slå på **Catch-all**.

Kontrollera efteråt:

```
dig +short MX prikko.se
dig +short TXT prikko.se
```

Det ska ge tre `route`-rader, och **exakt en** rad som börjar med `v=spf1`.
Ser du två SPF-poster är avsändarautentiseringen trasig, radera den ena direkt.

**Lägg aldrig till Resend i SPF-posten på roten.** Resend sätter returadressen
på `send.prikko.se` och kontrolleras där. Roten behöver bara Cloudflares
include. Det står i dokument 13 och det är fortfarande sant.

### 4. Skärp DMARC, men först om två till fyra veckor

När rapporterna från punkt 2 har visat grönt för både Resends utgående post och
Cloudflares vidarebefordran, byt till `p=quarantine; pct=25`, sedan 50, sedan
100, sedan `p=reject`. Ett steg i taget, minst en vecka emellan. En domän som
publicerar en skarp DMARC-policy behandlas mildare av Microsoft än en som står
på `none`.

Skärp aldrig mitt under kommunkampanjen.

### 5. Räkna inte med att kunna anmäla dig hos Microsoft

Microsofts två program för avsändare, SNDS och JMRP, går på **IP-adress**, och
IP-adresserna är Resends delade SES-adresser som vi inte äger. Vi kan alltså
inte registrera oss där, och det är ingen idé att lägga tid på det.

Vägen till Microsoft går i stället genom punkterna 2 till 4, och genom Resends
support om punkt 1 visar en studs. Resend äger IP-adresserna och kan föra vår
talan.

### 6. Kolla Site URL i Supabase, en tioandersak

I autentiseringsloggen för registreringen 2026-09-01 står
`referer: http://localhost:3000`, från en Samsung-telefon på ett Telia-abonnemang
som omöjligen kan ha stått på en localhost. Anrop som jag själv gjorde i dag
loggade i stället den adress jag verkligen satt på, vilket tyder på att
`localhost:3000` kommer från projektets **Site URL** och inte från besökaren.

Kolla **Authentication → URL Configuration → Site URL**. Står det
`http://localhost:3000`, ändra till `https://prikko.se`.

Det påverkar **inte** kodmejlet, för det mejlet innehåller ingen länk. Det
påverkar återställnings- och adressbytesmallarna, och det kommer att gå sönder
den dagen Google- eller Apple-inloggningen slås på. Ändra det medan du minns.

---

## Vad jag byggde

Två filer, i grenen `agent/reg58`. Inget är commitat.

### `site/src/components/SignInDialog.astro`

**En rad som säger var mejlet ligger.** Steg 2 sa tidigare bara "Vi har skickat
en kod till" och adressen. Nu står det under knapparna:

> Inget mejl? Titta i skräpposten. Det kommer från **no-reply@prikko.se** och
> har ämnet **Din kod till Prikko**.

Avsändare och ämne står **ordagrant**, för det är dem man skriver i ett sökfält.
Adressen bryts aldrig mitt itu, vilket den gjorde vid 375 px innan
`white-space: nowrap` kom på plats.

Raden står framme direkt. Den byggdes först så att den fälldes ut efter tjugo
sekunder, och det mättes bort: raden är 53 px hög, arket växer lika mycket, och
eftersom ett `<dialog>` ligger centrerat steg kodrutorna **27 px uppåt** när den
kom, alltså en halv rutas höjd rakt under fingret på någon som skriver.
Dessutom hjälper en rad som dyker upp vid tjugonde sekunden ingen som gav upp
vid den tolfte, och det är just de vi förlorar.

**Nedräkning på "Skicka en ny kod".** Knappen låg tidigare avstängd i **fem**
sekunder efter ett utskick. GoTrues spärr mellan två koder till samma adress är
**sextio**. Knappen var alltså tänd i femtiofem sekunder under vilka den
garanterat gav ett felmeddelande. Nu räknar den ned från 60, och klockan startar
redan när steg 2 visas, eftersom den första koden gick ut i samma ögonblick.
Kvittensen "En ny kod är skickad" ligger kvar tre sekunder innan nedräkningen
tar över, så den som tryckte får fortfarande veta att det gick vägen.

### `site/src/lib/community.ts`

**Två skilda spärrar hade samma svar.** `translate()` gav "För många försök.
Vänta en minut och prova igen." både på GoTrues sextiosekundersspärr och på
`over_email_send_rate_limit`, som är projektets tak per timme. Det taket rör
sig inte för att en enskild besökare väntar en minut, så beskedet skickade in
folk i en slinga av försök som alla var dömda att misslyckas. Nu är de två fall
med två svar.

**Kommentaren om ägarens steg är rättad.** Där stod att mallen måste bytas ut
mot en som bär `{{ .Token }}`. Det är gjort sedan länge, och nu står i stället
det som verkligen skickas, med rubrikerna utskrivna.

### Verifierat i bild

Bygget gick igenom. Rutan är körd mot riktiga Supabase från en fryst kopia av
utgåvan, med två riktiga kodmejl till dina egna adresser, och fotograferad vid
900 px och vid 375 px. Nedräkningen syns ticka, raden står på plats från första
bildrutan, och arket klipps inte ens vid 667 px höjd.

---

## Så mäter du om, när som helst

Kör i SQL-fönstret i Supabase:

```sql
select email,
       created_at,
       confirmation_sent_at,
       email_confirmed_at
from auth.users
where email_confirmed_at is null
order by created_at desc;
```

Varje rad är en människa som fyllde i formuläret och aldrig kom in.
`confirmation_sent_at` med ett värde betyder att mejlet lämnade Supabase.
Blir listan längre, och är adresserna hos Microsoft, är det fortfarande samma
sak. Kommer det rader med gmail-adresser är det något nytt och värt en egen
titt.
