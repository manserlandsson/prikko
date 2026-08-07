-- Prikko — användarinnehåll (Supabase/Postgres)
--
-- SEPARAT SCHEMA MED AVSIKT. Kör detta EFTER schema.sql.
-- Idempotent: kan köras om.
--
-- ---------------------------------------------------------------------------
-- VARFÖR ETT EGET SCHEMA OCH INTE BARA EGNA TABELLER
-- ---------------------------------------------------------------------------
-- Se research/R4_juridik_utgivningsbevis.md, avsnitt 1 och 2.
--
-- Mediemyndigheten kräver för utgivningsbevis att databasen "inte kan ändras
-- av någon annan än redaktionen". R4 pekar ut den fallgrop som träffar oss
-- rakt av: användarbidrag som går rätt in genom ett formulär kan göra att
-- hela avgränsningen ifrågasätts, och då är det inte omdömena som förlorar
-- skyddet utan kontrolldatan.
--
-- Separata tabeller i samma schema räcker inte, av fyra skäl:
--
--   1. Rättigheter sätts per schema. `grant ... on all tables in schema public`
--      är formuleringen som redan står i schema.sql, och den träffar varje ny
--      tabell någon lägger till. En tabell för omdömen i public skulle en dag
--      svepas med av en sådan rad. I ett eget schema kan det inte hända.
--   2. PostgREST exponerar SCHEMAN, inte tabeller. Ligger användarinnehållet i
--      ett eget schema är det en medveten inställning i projektet som släpper
--      fram det, inte en glömd policy.
--   3. Främmande nycklar skapar koppling. Det finns därför INGA FK härifrån
--      till `public`. `establishment_id` är ren text med formatkontroll. Ett
--      omdöme kan aldrig kaskadera in i kontrolldatan, och en join mellan de
--      två kräver att någon skriver den för hand.
--   4. Åtskillnaden går att visa för en myndighet på en rad: den redaktionella
--      databasen är `public`, den byggs av pipelinen, och ingen inloggad roll
--      har skrivrättigheter där.
--
-- ---------------------------------------------------------------------------
-- DEN BÄRANDE REGELN
-- ---------------------------------------------------------------------------
-- Den grundlagsskyddade databasen är DET STATISKA BYGGET. Ingenting en
-- användare skriver kommer in i ett bygge utan att en människa i redaktionen
-- har släppt fram det.
--
-- Allt användarskrivet är `pending` när det skapas, MED ETT UNDANTAG som står
-- utskrivet nedan: ett betyg utan text. Ingen inloggad roll får ändra
-- `status`, för det finns ingen update-policy. Bara service_role, som går
-- förbi RLS och bara används av pipelinen och modereringsverktyget, kan flytta
-- en rad till `published` i efterhand.
--
-- ---------------------------------------------------------------------------
-- UNDANTAGET: BETYG UTAN TEXT
-- ---------------------------------------------------------------------------
-- Här stod tidigare "förhandsgranskning utan undantag". Det stämmer inte
-- längre, och den här filen är det dokument som ska kunna visas för en
-- myndighet, så den ska säga vad som faktiskt gäller.
--
-- Ett omdöme som BARA är ett betyg, alltså en siffra mellan ett och fem utan
-- en enda rad text, publiceras direkt. Allt som bär text granskas av en
-- människa först, precis som förut.
--
-- Skälet är att förhandsgranskningen har ett bestämt syfte: att fånga förtal,
-- namngiven personal och påståenden som en verksamhet har rätt att bemöta. En
-- siffra kan inte bära något av det. Det finns ingenting i en fyra att läsa,
-- och en kö av siffror ger ingen redaktionell bedömning. Den kostar däremot
-- lika många klick som en kö av texter, och det farliga är inte tiden utan
-- vanan: den som klickar igenom hundra siffror slutar läsa texterna ordentligt.
--
-- Undantaget gäller INTE åtskillnaden mot kontrolldatan. Ett publicerat betyg
-- ligger fortfarande i schemat `community`, det når fortfarande aldrig ett
-- bygge, och det räknas fortfarande aldrig ihop till ett tal bredvid
-- hygienbedömningen.
--
-- Beslutet är ägarens och taget medvetet. Villkoret för det var tre spärrar,
-- alla i databasen: ett betyg per konto och verksamhet, fem omdömen per konto
-- och dygn, och ett dygns ålder på kontot innan något publiceras direkt. Se
-- community.set_review_status() längre ner, och community.rating_signals som
-- är efterhandsgranskningen.
--
-- OREDIGERAT betyder inte omodererat. Sidfoten och metodiksidan lovar att
-- verksamhetens svar publiceras oredigerat. Det löftet hålls genom att
-- `body` är frusen efter insändning: en trigger fäller varje försök att ändra
-- texten, även med service_role. Redaktionen kan bara välja mellan att
-- publicera texten ordagrant eller att inte publicera den. Det är samma
-- ordning som en tryckt tidnings genmäle, och det är den enda tolkning som
-- gör både löftet och utgivningsbeviset sanna samtidigt.
--
-- ---------------------------------------------------------------------------
-- ÄGARENS MANUELLA STEG EFTER KÖRNING
-- ---------------------------------------------------------------------------
-- Schemat är osynligt för API:t tills det exponeras uttryckligen:
--   Supabase → Project Settings → API → Exposed schemas → lägg till `community`
-- Utan det steget svarar varje anrop 404, vilket är rätt förvalt läge.
--
-- Klienten väljer schema per anrop med `Accept-Profile` respektive
-- `Content-Profile`. Se site/src/lib/community.ts.

create schema if not exists community;

-- ---------------------------------------------------------------------------
-- Gemensamma byggstenar
-- ---------------------------------------------------------------------------

-- Modereringsläge. `pending` är alltid utgångspunkten.
do $$
begin
    create type community.moderation_status as enum ('pending', 'published', 'rejected');
exception when duplicate_object then null;
end $$;

-- Anläggnings-id är text, inte en främmande nyckel. Formatet är Sambruks:
-- 'F-<kommunkod>-<lokalt id>'. Kontrollen finns för att en felstavning ska
-- fällas direkt i stället för att bli en rad som pekar på ingenting.
create or replace function community.is_establishment_id(value text)
returns boolean
language sql
immutable
-- Låst här och inte bara med en alter längre ned. Filen är idempotent och
-- körs om för hand, och en create or replace skriver över funktionen med
-- exakt det som står här. Låg låsningen bara i en alter i slutet skulle en
-- omflyttning eller borttagning av den raden tyst ta bort skyddet.
set search_path = ''
as $$
    select value ~ '^F-[0-9]{4}-.+$';
$$;

-- Fryser en kolumn efter insändning.
--
-- Det här är mekanismen bakom "publiceras oredigerat". Den gäller alla roller,
-- inklusive service_role, eftersom en trigger inte är en rättighet. Ska en
-- text bort får raden avslås eller raderas, aldrig skrivas om.
create or replace function community.freeze_body()
returns trigger
language plpgsql
-- Samma skäl som ovan, och här väger det tyngre: det är den här triggern som
-- håller löftet vi publicerar ordagrant om att en insänd text aldrig ändras.
set search_path = ''
as $$
begin
    if new.body is distinct from old.body then
        raise exception
            'Texten är frusen efter insändning. Publicera ordagrant eller avslå, ändra aldrig. (%.%)',
            tg_table_schema, tg_table_name;
    end if;
    return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiler
--
-- Minsta möjliga. Vi lagrar ett visningsnamn och ingenting annat. E-post bor i
-- auth.users och hämtas därifrån av användaren själv; den skrivs aldrig av här
-- och kan därför aldrig läcka via en felskriven select-policy.
-- ---------------------------------------------------------------------------
create table if not exists community.profiles (
    user_id      uuid primary key references auth.users (id) on delete cascade,

    -- Namnet som står bredvid ett publicerat omdöme. Fritext, inget krav på
    -- äkthet, och därför aldrig ett påstående om vem personen är.
    display_name text check (length(btrim(display_name)) between 2 and 40),

    created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Bevakning
--
-- Den enklaste funktionen i hela bygget: ingenting publiceras, ingenting
-- modereras, ingen annan användare kan se raden. Den är privat data om en
-- inloggad person och ligger därför bakom RLS på user_id, inte bakom
-- moderering.
-- ---------------------------------------------------------------------------
create table if not exists community.follows (
    user_id           uuid not null references auth.users (id) on delete cascade,
    establishment_id  text not null check (community.is_establishment_id(establishment_id)),

    -- Kommunens slug sparas med raden. Utan den kan kontosidan inte länka till
    -- verksamheten utan att slå mot public, och den kopplingen finns inte.
    municipality_slug text not null,
    -- Namnet vid bevakningstillfället. Samma skäl. Att namnet kan bli inaktuellt
    -- är acceptabelt på en privat lista och bättre än en korsning mellan scheman.
    establishment_name text not null,

    -- Nyckeln i avregistreringslänken. Se stop_following() längre ner.
    unsubscribe_token uuid not null default gen_random_uuid(),

    created_at        timestamptz not null default now(),

    primary key (user_id, establishment_id)
);

-- Kolumnen kom till efter tabellen. `create table if not exists` lägger inte
-- till något i en databas som redan har tabellen, så raden nedan är den som
-- faktiskt kör i produktion. Defaulten är volatil, alltså får varje befintlig
-- rad ett eget värde vid omskrivningen.
alter table community.follows
    add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create index if not exists follows_establishment_idx
    on community.follows (establishment_id);

-- Unik: token ÄR identiteten i avregistreringslänken. Två rader med samma
-- värde hade gjort att en avregistrering träffade fel bevakning.
create unique index if not exists follows_unsubscribe_token_idx
    on community.follows (unsubscribe_token);

-- ---------------------------------------------------------------------------
-- Skickade notiser
--
-- En logg, inte en kö. Raden skrivs EFTER att mejlet gått iväg och finns av
-- tre skäl:
--
--   1. Dubblettspärr. Nattjobbet jämför gårdagens ögonblicksbild med dagens
--      och hittar nya kontroller. Går commiten av snapshoten inte igenom, ser
--      nästa körning samma kontroller som nya igen. Unikheten på
--      (user_id, inspection_id) gör att ingen kan få samma kontroll två gånger.
--   2. Kvot. Resends gratisnivå ger 100 mejl per dygn och 3 000 per månad.
--      Utan en logg går det inte att veta hur mycket som redan förbrukats,
--      och en pipeline som råkar sprängs taket faller tyst.
--   3. Öppenhet. Den som fått ett mejl ska kunna se att vi skickat det.
--      Därför läsrätt på egna rader, inte bara för service_role.
--
-- Notera vad som INTE står här: ingen mejladress, ingen text, inget
-- innehåll. Adressen bor i auth.users och hämtas vid utskicket.
-- ---------------------------------------------------------------------------
create table if not exists community.notifications (
    id               uuid primary key default gen_random_uuid(),
    user_id          uuid not null references auth.users (id) on delete cascade,

    establishment_id text not null check (community.is_establishment_id(establishment_id)),
    -- Kontrollen som utlöste notisen. Text, ingen FK, samma skäl som överallt
    -- annars i det här schemat.
    inspection_id    text not null check (inspection_id ~ '^I-[0-9]{4}-.+$'),

    sent_at          timestamptz not null default now(),

    -- Dubblettspärren. En kontroll är ny exakt en gång per mottagare.
    unique (user_id, inspection_id)
);

create index if not exists notifications_sent_idx
    on community.notifications (sent_at desc);

-- ---------------------------------------------------------------------------
-- Notiser i gränssnittet
--
-- Klockan på kontot. Två händelser ska synas där, och de har hanterats på
-- HELT OLIKA sätt. Skälet är värt att stå utskrivet, för valet ser ut som en
-- inkonsekvens tills man vet varför.
--
--   "Ditt omdöme har publicerats eller avvisats" HÄRLEDS ur community.reviews.
--   Händelsen ÄR redan en rad i databasen: status, moderated_at,
--   moderated_by och rejection_reason står där och skrivs av moderate.py.
--   En kopia i en notistabell hade varit samma sanning på två ställen, och
--   två ställen glider isär. Härledningen ger dessutom rätt beteende gratis:
--   raderar författaren sitt omdöme försvinner notisen med det, vilket är vad
--   man vill och vad en kopia inte hade gjort.
--
--   "En verksamhet du bevakar har fått en ny bedömning" KAN INTE härledas.
--   Det finns ingen rad någonstans som säger att just den här personen har en
--   ny kontroll att se. Kandidaterna prövades och föll:
--
--     community.notifications duger inte. Den loggen skrivs EFTER att ett
--       mejl gått iväg, alltså inte alls när Resend-kvoten tagit slut och
--       inte alls för ett konto med obekräftad adress. En notis i
--       gränssnittet kostar ingenting och får inte ransoneras av ett
--       mejltak. Loggen förblir vad den heter: ett kvitto på skickade mejl.
--     public.inspections duger inte heller. Att jämföra kontrollernas datum
--       mot follows.created_at ser ut att fungera men fäller på samma sak som
--       notify.py bygger hela sitt urval kring: kommunerna efterregistrerar
--       gamla kontroller i klump, och vi lagrar ingen tidpunkt för när en
--       kontroll först dök upp hos oss. Varje sådan städning hade fyllt
--       allas klockor med kontroller från 2021.
--
--   Alltså en rad, skriven av pipeline/notify.py med service_role i samma
--   ögonblick som den räknat ut att något hänt, oavsett om ett mejl blev av.
--
-- LÄSMARKERINGEN BOR HÄR OCH INTE I WEBBLÄSAREN. Se
-- docs/14_samtycke_och_lagring_i_webblasaren.md: de enda nycklar som får
-- finnas hos besökaren utan samtycke är `prikko.session` och `prikko.next`,
-- och /cookies påstår i klartext att listan är uttömmande. En läsmarkering är
-- bekvämlighet, inte nödvändighet, alltså skulle localStorage kräva just den
-- ruta som samma dokument argumenterar emot.
-- ---------------------------------------------------------------------------
create table if not exists community.notices (
    id                 uuid primary key default gen_random_uuid(),
    user_id            uuid not null references auth.users (id) on delete cascade,

    establishment_id   text not null check (community.is_establishment_id(establishment_id)),

    -- Kommun, namn och slug sparas MED raden, av samma skäl som i follows:
    -- det finns ingen främmande nyckel till `public` och ska inte finnas
    -- någon. Utan de tre kan listan varken namnge verksamheten eller länka
    -- till den utan att korsa åtskillnaden mot kontrolldatan.
    --
    -- Slugen står här men INTE i follows, och det är ett medvetet undantag.
    -- En bevakning kan vara år gammal när kontosidan läser den, och en gammal
    -- slug leder till en 404. En notis skrivs samma natt som bygget och läses
    -- inom dagar. Det är dessutom exakt samma länk som notismejlet bär, och
    -- mejlet och klockan måste peka på samma sida.
    municipality_slug  text not null,
    establishment_name text not null,
    establishment_slug text not null,

    -- Kontrollen som utlöste notisen. Text, ingen FK, samma skäl som överallt
    -- annars i det här schemat.
    inspection_id      text not null check (inspection_id ~ '^I-[0-9]{4}-.+$'),
    inspected_at       date not null,

    -- Verksamhetens bedömning när notisen skrevs, alltså den sajten visade.
    -- Aldrig ett eget omdöme och aldrig ett tal: samma två etiketter som
    -- mejlet och sidan använder. `clean` finns inte med, för en godkänd
    -- kontroll är inte något man ska bli störd av. Se worsened() i notify.py.
    verdict            text not null check (verdict in ('minor', 'major')),

    created_at         timestamptz not null default now(),

    -- Dubblettspärren. En kontroll är ny exakt en gång per mottagare, precis
    -- som i notifications, och av samma skäl: jobbet kan köras om.
    unique (user_id, inspection_id)
);

create index if not exists notices_user_idx
    on community.notices (user_id, created_at desc);

-- Läsmarkeringen. EN rad per konto, ETT klockslag, ingenting annat.
--
-- Varför en vattenlinje och inte ett `read_at` per notis: den ena av de två
-- händelsetyperna är härledd och har därför ingen rad att markera. Ett
-- klockslag räcker för båda, och det är också den olästmarkering en klocka
-- faktiskt bär — en prick som försvinner när man tittat, inte ett arkiv över
-- vilka rader man råkat öppna.
--
-- Priset är att man inte kan markera EN notis som läst. Det är rätt pris:
-- funktionen finns inte i förlagan heller, och den hade krävt skrivrätt på
-- varje notisrad i stället för på en tidsstämpel om en själv.
create table if not exists community.notice_reads (
    user_id uuid primary key references auth.users (id) on delete cascade,
    read_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Avregistrering utan inloggning
--
-- Varje notismejl måste bära en länk som stoppar utskicken. Sajten är statisk
-- och har ingen server som kan ta emot ett klick, så länken pekar på en sida
-- som anropar den här funktionen med anon-nyckeln.
--
-- Varför en `security definer`-funktion och inte en policy: anon har varken
-- select eller delete på follows, och ska inte få det. Funktionen är en enda
-- smal lucka — den tar en token, tar bort rader, och kan inte användas till
-- att läsa någon annans lista. Slår token fel händer ingenting alls.
--
-- Varför en slumpad uuid och ingen signatur: en HMAC hade krävt att samma
-- hemlighet fanns både i pipelinen och i databasen, alltså två ställen den kan
-- läcka från. Token är 122 slumpade bitar, den finns bara i mottagarens eget
-- mejl, och den försvinner med raden den pekar på. Att den ligger i en URL är
-- inte ett problem: den är ingen personuppgift och ger ingen läsning av något.
-- ---------------------------------------------------------------------------

-- Vad avregistreringssidan får visa innan besökaren tryckt. Namnet på
-- verksamheten och hur många andra bevakningar personen har. Ingenting om vem
-- personen är.
create or replace function community.follow_by_token(token uuid)
returns table (place_name text, other_follows integer)
language sql
security definer
set search_path = ''
as $$
    select f.establishment_name,
           (select count(*)::integer - 1
              from community.follows g
             where g.user_id = f.user_id)
      from community.follows f
     where f.unsubscribe_token = token;
$$;

-- Själva avregistreringen. `everything` tar bort alla bevakningar för samma
-- person, vilket är den enda globala avanmälan som finns — en bevakning har
-- ingen annan funktion än att ge notiser, så att sluta få mejl och att sluta
-- bevaka är samma sak.
--
-- Returnerar antal borttagna rader. Noll betyder okänd token, och sidan säger
-- då att länken redan använts i stället för att låtsas att något hänt.
create or replace function community.stop_following(
    token uuid,
    everything boolean default false
)
returns table (place_name text, removed integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
    -- Inga variabelnamn som krockar med en kolumn i follows. Gör de det tolkar
    -- plpgsql kolumnen som variabeln och where-satsen blir alltid sann, vilket
    -- i en delete-sats är den dyraste sortens skrivfel.
    owner_id uuid;
    place    text;
    n        integer;
begin
    select f.user_id, f.establishment_name
      into owner_id, place
      from community.follows f
     where f.unsubscribe_token = token;

    if owner_id is null then
        return query select null::text, 0;
        return;
    end if;

    if everything then
        delete from community.follows f where f.user_id = owner_id;
    else
        delete from community.follows f where f.unsubscribe_token = token;
    end if;
    get diagnostics n = row_count;

    return query select place, n;
end;
$$;

-- ---------------------------------------------------------------------------
-- Anspråk på en verksamhet
--
-- INGET HÄR ÄR AUTOMATISKT VERIFIERAT. Se `verification_method`.
--
-- Att bevisa att någon företräder en verksamhet är den svåraste delen av hela
-- funktionen. Vi bygger den ärligaste enkla varianten: ett anspråk är en
-- ANSÖKAN som en människa i redaktionen prövar mot Bolagsverket, och som ger
-- noll rättigheter innan den prövningen är gjord.
--
-- Uppgifterna i anspråket (namn, roll, org.nr, telefon) publiceras ALDRIG. De
-- finns bara för att redaktionen ska kunna göra kontrollen.
-- ---------------------------------------------------------------------------
create table if not exists community.establishment_claims (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references auth.users (id) on delete cascade,
    establishment_id    text not null check (community.is_establishment_id(establishment_id)),
    municipality_slug   text not null,
    establishment_name  text not null,

    -- Vad den sökande uppger. Påståenden, inget annat.
    claimant_name       text not null check (length(btrim(claimant_name)) between 2 and 100),
    claimant_role       text not null check (length(btrim(claimant_role)) between 2 and 100),
    organization_number text,
    contact_email       text not null,
    contact_phone       text,

    status              community.moderation_status not null default 'pending',

    -- Hur anspråket kontrollerades. NULL så länge det är obehandlat.
    --
    --   'register_check'  redaktionen har slagit upp firmatecknare eller
    --                     verklig huvudman och funnit att uppgifterna stämmer.
    --                     Detta är det enda som används i dag.
    --   'postal_code'     engångskod skickad med brev till verksamhetsställets
    --                     adress och återinlämnad. Starkast av de billiga
    --                     metoderna, samma ordning som Google Business Profile.
    --                     FÖRBEREDD, INTE BYGGD.
    --   'domain_email'    bekräftelse från en adress på verksamhetens egen
    --                     domän. Kan inte användas: vi lagrar inga webbplatser.
    verification_method text check (verification_method in
                            ('register_check', 'postal_code', 'domain_email')),
    verified_at         timestamptz,
    verified_by         text,
    rejection_reason    text,

    created_at          timestamptz not null default now(),

    -- Ett anspråk per person och verksamhet. Flera personer kan företräda
    -- samma verksamhet, och det är avsiktligt tillåtet.
    unique (user_id, establishment_id),

    -- Ett godkänt anspråk måste bära hur det godkändes. Utan den här
    -- kontrollen kan en rad se verifierad ut utan att någon vet varför.
    constraint claim_published_requires_method
        check (status <> 'published'
               or (verification_method is not null and verified_at is not null))
);

create index if not exists claims_establishment_idx
    on community.establishment_claims (establishment_id) where status = 'published';

-- ---------------------------------------------------------------------------
-- Verksamhetens svar på en kontroll
--
-- Utlovat på metodiksidan och i sidfoten. Publiceras ORDAGRANT.
--
-- Vägen är: verksamheten skriver → raden är `pending` → redaktionen läser och
-- väljer publicera eller avslå, utan möjlighet att ändra texten → vid
-- publicering skriver moderate.py texten till public.inspections.owner_comment
-- med service_role → nästa export tar med den → nästa bygge visar den.
--
-- Svaret hamnar alltså i den redaktionella databasen först när redaktionen
-- släppt fram det, vilket är exakt vad utgivningsbeviset kräver, samtidigt som
-- texten aldrig kan ha ändrats på vägen.
-- ---------------------------------------------------------------------------
create table if not exists community.owner_responses (
    id                uuid primary key default gen_random_uuid(),
    user_id           uuid not null references auth.users (id) on delete cascade,

    establishment_id  text not null check (community.is_establishment_id(establishment_id)),
    municipality_slug text not null,
    -- Vilken kontroll svaret gäller. Text, ingen FK. 'I-<kommunkod>-<lokalt>'.
    inspection_id     text not null check (inspection_id ~ '^I-[0-9]{4}-.+$'),

    body              text not null check (length(btrim(body)) between 10 and 2000),

    status            community.moderation_status not null default 'pending',
    moderated_at      timestamptz,
    moderated_by      text,
    rejection_reason  text,
    -- Satt när texten faktiskt skrivits till public.inspections.owner_comment.
    -- Skiljt från moderated_at eftersom bygget kan ligga efter beslutet.
    published_at      timestamptz,

    created_at        timestamptz not null default now(),

    -- Ett svar per kontroll och verksamhet. Vill man säga något nytt får det
    -- gamla avslås eller raderas först. Annars kan sidan inte veta vilket av
    -- två publicerade svar som gäller.
    unique (establishment_id, inspection_id)
);

drop trigger if exists owner_responses_frozen on community.owner_responses;
create trigger owner_responses_frozen
    before update on community.owner_responses
    for each row execute function community.freeze_body();

create index if not exists owner_responses_pending_idx
    on community.owner_responses (created_at) where status = 'pending';

-- ---------------------------------------------------------------------------
-- Omdömen från besökare
--
-- FÖRHANDSGRANSKADE UTAN UNDANTAG. Ett omdöme är osynligt för alla utom sin
-- författare tills en människa släppt fram det. Det står som RLS-policy längre
-- ner och inte som en regel i sidmallen, för en regel i en sidmall är ett
-- löfte medan en policy är en spärr.
--
-- BETYGET FINNS, MEN ALDRIG SOM STRUKTURERAD DATA. Här stod tidigare att
-- omdömen inte har något betyg alls. Ägaren har sedan beslutat att de ska ha
-- ett, och `rating` lades till i migrationen community_reviews_rating.
--
-- Skälet till den gamla raden står kvar och gäller fortfarande: ett tal är den
-- enda ingrediens som saknas för att någon en dag ska märka upp sidan med
-- AggregateRating bredvid en hygienbedömning som bygger på myndighetsdata.
-- Spärren ligger nu i .github/workflows/kontroll.yml, som fäller bygget om
-- orden dyker upp i utfallet, i stället för i att talet inte finns.
--
-- Besökarens betyg och kommunens hygienbedömning får aldrig se likadana ut.
-- Stjärnor här, smiley där, och aldrig ett gemensamt tal.
--
-- Omdömen renderas ALDRIG i det statiska bygget. De hämtas i webbläsaren och
-- ligger i en egen, utmärkt del av sidan. Ingen JSON-LD, aldrig `Review`.
-- ---------------------------------------------------------------------------
create table if not exists community.reviews (
    id                uuid primary key default gen_random_uuid(),
    user_id           uuid not null references auth.users (id) on delete cascade,

    establishment_id  text not null check (community.is_establishment_id(establishment_id)),
    municipality_slug text not null,

    -- Texten. NULL när skribenten bara satte betyg.
    --
    -- "Ingen text" och "en text som är tom" är inte samma sak, och alla andra
    -- frivilliga fält i tabellen står som null när de inte fyllts i. En tom
    -- sträng hade dessutom kunnat smyga sig förbi som ett svar: btrim(' ') är
    -- '' och hade sett besvarad ut i varje fråga som inte råkade skriva
    -- length() runt den.
    --
    -- Tjugo tecken gäller fortfarande DEN RAD SOM BÄR EN TEXT. Fem tecken är
    -- inte ett omdöme, med eller utan betyg bredvid.
    body              text check (body is null
                                  or length(btrim(body)) between 20 and 2000),

    -- Betyget, ett till fem. Skalan är fem för att fem är vad besökaren redan
    -- kan läsa utan förklaring; en egen skala hade krävt en teckenförklaring
    -- på en sida som redan förklarar för mycket.
    --
    -- NULLABLE. Den som vill berätta något ska inte tvingas sätta en siffra på
    -- det, och ett tvingande betyg gör att folk klickar en fyra för att komma
    -- vidare i stället för att mena den.
    rating            smallint check (rating is null or rating between 1 and 5),

    -- Månaden besöket gjordes, alltid den FÖRSTA i månaden.
    --
    -- En månad och inte ett datum: ingen minns vilken tisdag det var, och
    -- frågar man om ett exakt datum får man antingen en gissning eller ett
    -- tomt fält. Månaden räcker för det läsaren behöver, alltså om omdömet
    -- gäller i somras eller för två år sedan.
    --
    -- Att dagen alltid är 1 är en kontroll och inte en konvention. Övre
    -- gränsen, att månaden inte får ligga i framtiden, kan inte stå här:
    -- `check` får bara innehålla immutabla uttryck och både now() och
    -- current_date är stabila. Den regeln bärs av triggern längre ner.
    visited_month     date check (visited_month is null
                                  or (extract(day from visited_month) = 1
                                      and visited_month >= date '2015-01-01')),

    -- Namnet som ska stå bredvid omdömet, kopierat från profilen när omdömet
    -- skickades in.
    --
    -- Varför en kopia och inte en join mot community.profiles: dels ska anon
    -- aldrig få läsa profiltabellen, och en vy med security_invoker som
    -- joinar en tabell anon saknar rättighet på fäller hela frågan. Dels är
    -- ett publicerat omdöme ett fruset yttrande. Namnet bredvid det ska vara
    -- namnet som gällde när det skrevs, inte vad personen råkar kalla sig
    -- ett år senare.
    author_name       text check (length(btrim(author_name)) between 2 and 40),

    status            community.moderation_status not null default 'pending',
    moderated_at      timestamptz,
    moderated_by      text,
    rejection_reason  text,

    created_at        timestamptz not null default now(),

    -- Ett omdöme per person och verksamhet.
    unique (user_id, establishment_id),

    -- Publicerat betyder granskat av någon. Utan den här kan en rad bli publik
    -- genom en felskriven update utan att en människa varit inblandad.
    constraint review_published_requires_moderator
        check (status <> 'published'
               or (moderated_by is not null and moderated_at is not null)),

    -- Raden måste bära NÅGOT: ett betyg, en text, eller båda.
    --
    -- Utan det här går det att skriva en rad som varken säger eller visar
    -- något men ändå tar plats i modereringskön. Villkoret står i databasen och
    -- inte bara i formuläret av samma skäl som allt annat här: klienten är ett
    -- formulär, inte en grind.
    constraint review_says_something
        check (rating is not null
               or (body is not null and length(btrim(body)) >= 20))
);

-- Kolumnerna och villkoren nedan kom till efter tabellen, och
-- `create table if not exists` rör inte en databas som redan har den. Raderna
-- här är alltså de som faktiskt kör i produktion. Samma sak gäller `rating` och
-- `visited_month` ovan, som lades till med migrationerna
-- community_reviews_rating och community_reviews_visited_month.
alter table community.reviews
    add column if not exists rating smallint
        check (rating is null or rating between 1 and 5);

alter table community.reviews
    add column if not exists visited_month date
        check (visited_month is null
               or (extract(day from visited_month) = 1
                   and visited_month >= date '2015-01-01'));

alter table community.reviews
    alter column body drop not null;

alter table community.reviews
    drop constraint if exists reviews_body_check;

alter table community.reviews
    add constraint reviews_body_check
    check (body is null or length(btrim(body)) between 20 and 2000);

alter table community.reviews
    drop constraint if exists review_says_something;

alter table community.reviews
    add constraint review_says_something
    check (rating is not null
           or (body is not null and length(btrim(body)) >= 20));

comment on column community.reviews.body is
    'Omdömestexten, minst 20 tecken. NULL när skribenten bara satte betyg.';

drop trigger if exists reviews_frozen on community.reviews;
create trigger reviews_frozen
    before update on community.reviews
    for each row execute function community.freeze_body();

-- Besöksmånaden får inte ligga i framtiden.
--
-- Regeln står som trigger och inte som `check` eftersom ett check-villkor bara
-- får innehålla immutabla uttryck. now() och current_date är stabila, inte
-- immutabla, och Postgres avvisar villkoret.
--
-- `set search_path to ''` av samma skäl som de andra funktionerna i schemat:
-- en funktion utan pinnad sökväg kan luras att kalla något annat än den tror.
create or replace function community.check_visited_month()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
    if new.visited_month is not null
       and new.visited_month > date_trunc('month', current_date)::date then
        raise exception 'Besöksmånaden ligger i framtiden. (%)', new.visited_month;
    end if;
    return new;
end;
$$;

drop trigger if exists reviews_visited_month on community.reviews;
create trigger reviews_visited_month
    before insert or update on community.reviews
    for each row execute function community.check_visited_month();

-- ---------------------------------------------------------------------------
-- Statusen sätts av databasen, aldrig av det som skickas in
-- ---------------------------------------------------------------------------
-- Se UNDANTAGET längst upp i filen för varför betyg utan text publiceras
-- direkt. Det här är mekanismen.
--
-- Statusen får aldrig komma utifrån. Kunde den skickas in vore
-- förhandsgranskningen borta i samma ögonblick som någon skickade
-- `status: published` tillsammans med en text. Funktionen skriver därför
-- status, moderated_by och moderated_at SJÄLV vid varje insättning, oavsett
-- vad raden bar med sig. En trigger är inte en rättighet, så den gäller alla
-- roller, även service_role.
--
-- SPÄRRARNA
--
-- Den bärande spärren är `unique (user_id, establishment_id)` ovan: ett konto
-- kan sätta ETT betyg per verksamhet. Den som vill sänka en konkurrent måste
-- alltså skaffa många konton, och varje konto kräver en fungerande
-- e-postadress. De två spärrarna här skyddar bara mot just det, den som
-- skaffar många konton:
--
--   Tak per konto och dygn. Fem omdömen. Det sjätte avvisas, oavsett om det
--     bär text eller inte. Att taket gäller båda sorterna är med avsikt: det
--     skyddar också modereringskön från att svämma över, och en översvämmad kö
--     är exakt det som gör en granskare slarvig.
--
--   Åldersgräns på kontot. Ett dygn. Det är den minsta gräns som överlever att
--     någon skaffar konton och sprutar betyg i samma sittning. Yngre konton
--     AVVISAS INTE, deras betyg landar som `pending`. Ett nytt konto ska inte
--     mötas av ett fel det inte kan göra något åt, och att bli läst av en
--     människa är samma sak som händer alla som skriver en text.
--
-- `security definer` behövs för att läsa auth.users. Rollen `authenticated` har
-- ingen läsrätt där, och ska inte få det. Sökvägen är pinnad och varje namn
-- utskrivet, vilket är vad som gör en definer-funktion ofarlig.
create or replace function community.set_review_status()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
    kontots_alder interval;
    senaste_dygnet integer;
begin
    new.rejection_reason := null;

    select count(*) into senaste_dygnet
    from community.reviews r
    where r.user_id = new.user_id
      and r.created_at > now() - interval '24 hours';

    if senaste_dygnet >= 5 then
        -- Meddelandet går rakt ut till besökaren. translate() i
        -- site/src/lib/community.ts skickar okända fel vidare ordagrant, så
        -- texten är skriven för den som läser den.
        raise exception 'Fem omdömen per dygn räcker. Försök igen i morgon.'
            using errcode = 'check_violation';
    end if;

    select now() - u.created_at into kontots_alder
    from auth.users u
    where u.id = new.user_id;

    if new.body is null
       and kontots_alder is not null
       and kontots_alder >= interval '24 hours' then
        new.status := 'published';
        -- Vem som släppte fram raden. Villkoret
        -- review_published_requires_moderator kräver ett svar, och svaret ska
        -- vara sant: det var regeln och inte en människa.
        new.moderated_by := 'automatik: betyg utan text';
        new.moderated_at := now();
    else
        new.status := 'pending';
        new.moderated_by := null;
        new.moderated_at := null;
    end if;

    return new;
end;
$$;

comment on function community.set_review_status() is
    'Sätter status vid insättning. Betyg utan text publiceras direkt, allt annat granskas.';

drop trigger if exists reviews_set_status on community.reviews;
create trigger reviews_set_status
    before insert on community.reviews
    for each row execute function community.set_review_status();

create index if not exists reviews_published_idx
    on community.reviews (establishment_id, created_at desc) where status = 'published';

create index if not exists reviews_pending_idx
    on community.reviews (created_at) where status = 'pending';

-- Publik läsvy för omdömen.
--
-- Varför en vy och inte tabellen direkt: tabellen bär moderatorns id,
-- avslagsskäl och författarens user_id. Inget av det ska ut. Vyn väljer
-- kolumner uttryckligen, så en ny känslig kolumn på tabellen blir inte publik
-- av sig själv. `security_invoker` gör att RLS på tabellen gäller ändå.
--
-- Vyn rör INGEN annan tabell. En join mot profiles hade krävt att anon fick
-- läsa profiltabellen, och det ska anon inte få.
-- Vyn DROPPAS och skapas om, aldrig `create or replace`. Den formen kan bara
-- lägga till kolumner sist, och betyget och månaden hör hemma bredvid texten
-- de gäller, inte efter författaren.
drop view if exists community.published_reviews;

create view community.published_reviews as
select
    r.id,
    r.establishment_id,
    r.municipality_slug,
    r.body,
    r.rating,
    r.visited_month,
    r.created_at,
    coalesce(r.author_name, 'Besökare') as author
from community.reviews r
where r.status = 'published';

alter view community.published_reviews set (security_invoker = true);

-- ---------------------------------------------------------------------------
-- Efterhandsgranskning av betyg
-- ---------------------------------------------------------------------------
-- "Publicera nu och moderera på signal" fungerar bara om någon faktiskt ser
-- signalen. Vyn är den signalen, och den läses av pipeline/moderate.py med
-- kommandot `signaler`.
--
-- Två mönster, båda sådana som en enskild rad aldrig avslöjar:
--
--   kluster          en verksamhet som får flera låga betyg inom kort tid.
--                    Enstaka missnöje kommer utspritt; en samordnad sänkning
--                    kommer i klump.
--   ensidigt konto   ett konto vars betyg alltid är en etta. Den som verkligen
--                    äter ute sätter inte samma lägsta siffra varje gång.
--
-- Vyn PEKAR UT, den dömer inte. Redaktionen läser och avgör, och kan avslå
-- eller radera med samma verktyg som förut. Ingen automatik tar bort något.
--
-- `security_invoker` är AVSIKTLIGT bortvalt här, till skillnad från
-- published_reviews. Vyn ska bara läsas av service_role, som ändå går förbi
-- radsäkerheten, och den behöver se rader som ingen annan får se. Rättigheten
-- längst ner är det som håller den stängd: utan grant finns den inte för anon
-- eller authenticated, och schemat exponerar bara det som uttryckligen
-- släppts fram.
create or replace view community.rating_signals as
    select 'kluster'::text                       as sort,
           r.establishment_id                    as nyckel,
           count(*)::integer                     as antal,
           min(r.rating)::integer                as lagsta,
           min(r.created_at)                     as forsta,
           max(r.created_at)                     as senaste,
           array_agg(r.id order by r.created_at) as rader
    from community.reviews r
    where r.body is null
      and r.rating <= 2
      and r.status = 'published'
      and r.created_at > now() - interval '24 hours'
    group by r.establishment_id
    having count(*) >= 3

    union all

    select 'ensidigt konto',
           r.user_id::text,
           count(*)::integer,
           min(r.rating)::integer,
           min(r.created_at),
           max(r.created_at),
           array_agg(r.id order by r.created_at)
    from community.reviews r
    where r.rating is not null
      and r.created_at > now() - interval '30 days'
    group by r.user_id
    having count(*) >= 3 and max(r.rating) = 1;

comment on view community.rating_signals is
    'Mönster värda en blick sedan betyg utan text publiceras direkt. Läses av moderate.py.';

revoke all on community.rating_signals from anon, authenticated;
grant select on community.rating_signals to service_role;

-- ---------------------------------------------------------------------------
-- Antalet olästa notiser
--
-- Ligger i databasen och inte i klienten av ett enda skäl: klockan sitter i
-- sidhuvudet, och sidhuvudet ligger på 15 500 sidor. Räknat i webbläsaren
-- hade varje sidladdning för en inloggad kostat tre anrop mot PostgREST, ett
-- per källa. Här är det ett.
--
-- INGEN `security definer`. Funktionen körs som anroparen, radsäkerheten
-- gäller alltså, och `user_id = auth.uid()` står ändå utskrivet i varje gren.
-- Det senare är inte ett bälte utöver hängslet: community.reviews har TVÅ
-- läspolicyer som läggs ihop med ELLER, och en fråga utan eget filter räknar
-- in allas publicerade omdömen. Se varningen vid reviews_read_published och
-- ownRows() i site/src/lib/community.ts.
--
-- Automatiskt publicerade betyg räknas INTE. Ett betyg utan text publiceras
-- direkt av community.set_review_status(), och en notis om det hade kommit i
-- samma sekund som man tryckte skicka. Klockan ska bära vad någon annan
-- gjort, inte vad man just gjorde själv. Etiketten 'automatik: …' sätts av
-- samma funktion och är kopplingen mellan de två reglerna.
create or replace function community.unread_notices()
returns integer
language sql
stable
set search_path = ''
as $$
    with mark as (
        select coalesce(
            (select r.read_at from community.notice_reads r where r.user_id = auth.uid()),
            '-infinity'::timestamptz
        ) as since
    )
    select (
        (select count(*)
           from community.notices n, mark
          where n.user_id = auth.uid()
            and n.created_at > mark.since)
      + (select count(*)
           from community.reviews v, mark
          where v.user_id = auth.uid()
            and v.moderated_at is not null
            and v.moderated_at > mark.since
            and coalesce(v.moderated_by, '') not like 'automatik:%')
    )::integer;
$$;

comment on function community.unread_notices() is
    'Olästa notiser för den inloggade. Ett anrop i stället för tre, se klockan i PlacePicker.astro.';

-- ---------------------------------------------------------------------------
-- Bilder från besökare
--
-- BESÖKAREN LADDAR UPP, INTE VERKSAMHETEN. Här stod tvärtom fram till
-- 2026-08-05, och bytet är ägarens beslut: "varför kan jag inte som användare,
-- dvs inte restaurangägare ladda upp bilder? det är ju kunder."
--
-- Det är också den enda vägen till en bild INIFRÅN ett ställe som skalar. En
-- godkänd företrädare per verksamhet ger några hundra bilder; gästerna är
-- tusentals. Se docs/13_bilder_och_verksamhetsdata.md, del A6 och C.
--
-- FÖRETRÄDAREN ÄR UTESTÄNGD HÄR, med avsikt. Den som har ett godkänt anspråk
-- på verksamheten får inte lägga bilder i besökarflödet. En verksamhets egna
-- marknadsföringsbilder bredvid gästernas är inte samma sorts uppgift, och de
-- ska inte kunna förväxlas. Ägarens egen bildyta blir en betaltjänst längre
-- fram och finns inte i någon form i dag. Se `image_uploads_insert`.
--
-- Ordningen, och den är omvänd mot förut:
--   1. Bilden hör till ett EGET OMDÖME om just den verksamheten. `review_id`
--      pekar ut det. Ingen text, ingen bild. Skälet är granskningens: ett foto
--      utan sammanhang är det svåraste tänkbara ärendet för den som ska avgöra
--      om det får publiceras, och ett omdöme per konto och verksamhet ger
--      dessutom taket per verksamhet gratis.
--   2. RADEN SKRIVS FÖRST, FILEN SEDAN. Storage-policyn kräver att det redan
--      finns en väntande rad som pekar på exakt den sökvägen. Utan den
--      ordningen vaktar varje kvot en dörr ingen behöver gå igenom: policyn på
--      storage.objects kan bara se mappen, så vem som helst med ett konto hade
--      kunnat fylla bucketen med filer och aldrig skriva en rad.
--   3. Filen går till en PRIVAT bucket under `pending/<user_id>/`. Ingen anon
--      kan läsa den. Det finns ingen URL att sprida.
--   4. Redaktionen tittar på bilden i moderate.py och väljer publicera eller
--      avslå. En AVSLAGEN bild raderas ur lagringen, den flaggas inte bara.
--   5. En publicerad bild läses i webbläsaren ur community.published_images.
--      Den går ALDRIG in i ett bygge och aldrig in i public.images, av exakt
--      samma skäl som omdömen inte gör det: den grundlagsskyddade databasen är
--      det statiska bygget, och ingenting en besökare skickat in hör hemma där.
--
-- EXIF försvinner på vägen, men inte av en regel här. Webbläsaren ritar om
-- bilden på en canvas innan den skickas, och en canvas bär ingen metadata.
-- GPS-koordinat, tidsstämpel och kameramodell finns alltså inte ens i den
-- privata bucketen. Det är en följd av komprimeringen och inte dess syfte, och
-- den som en dag flyttar komprimeringen måste veta det. Se uploadImage() i
-- site/src/lib/community.ts.
--
-- Det som INTE finns och som ägaren bör känna till: ingen automatisk
-- innehållsklassning och ingen dubblettkontroll mot kända bilder. En anonym
-- person kan ladda upp en bild som inte föreställer stället. Det finns ingen
-- teknisk kontroll som avslöjar det. Dämpningarna är texten som sammanhang,
-- originalet som ligger kvar som underlag, och att en människa ser varje bild.
-- ---------------------------------------------------------------------------
create table if not exists community.image_uploads (
    id                uuid primary key default gen_random_uuid(),
    user_id           uuid not null references auth.users (id) on delete cascade,

    establishment_id  text not null check (community.is_establishment_id(establishment_id)),
    municipality_slug text not null,

    -- Omdömet bilden råkar höra till, om den hör till något. FRIVILLIGT.
    --
    -- En bild kan skickas in ensam, utan ett ord skrivet. Det är ägarens
    -- beslut: "Man ska såklart kunna ladda upp bilder endast, behöver ej va
    -- text." Kolumnen är därför nullbar, och policyn kräver den inte.
    --
    -- Är den satt gäller kaskaden: tar författaren tillbaka sitt omdöme följer
    -- bilderna som skickades med det, även publicerade. Ett yttrande man tagit
    -- tillbaka ska inte lämna kvar sina bilder.
    --
    -- Är den NULL bärs raden av `user_id` ensam, och det räcker för allt den
    -- behöver klara: uppladdaren går att spåra, hen kan ta bort bilden själv
    -- genom image_uploads_delete_own, och kvoterna i
    -- community.set_image_status() räknas per konto och verksamhet oavsett om
    -- något omdöme finns.
    review_id         uuid references community.reviews (id) on delete cascade,

    -- Sökväg i den privata bucketen, alltid 'pending/<user_id>/<uuid>.<ext>'.
    -- Formen kontrolleras av community.set_image_status(), inte bara här.
    storage_path      text not null unique,

    -- HEIC OCH HEIF TAS EMOT HÄR, men aldrig i den publika hinken.
    --
    -- Formatet är förvalt på varje iPhone och alltså det vanligaste våra
    -- besökare har. Ägaren: "varför tillåts ej heic bilder att ladda upp? så
    -- länge det inte är något dåligt med dom, så låt dom."
    --
    -- Webbläsare är oense om att avkoda det: Safari kan, Chrome och Firefox kan
    -- inte. Går det att avkoda ritas bilden om till JPEG redan i webbläsaren och
    -- landar aldrig här som HEIC. Går det inte kommer originalet hit, och
    -- pipeline/moderate.py konverterar det före publicering. En publicerad bild
    -- måste kunna visas av alla.
    content_type      text not null check (content_type in
                            ('image/jpeg', 'image/png', 'image/webp',
                             'image/heic', 'image/heif',
                             'image/heic-sequence', 'image/heif-sequence')),

    -- Tolv megabyte, inte åtta.
    --
    -- En bild som webbläsaren kan avkoda krymps före uppladdning och väger ett
    -- par hundra kilobyte. En HEIC som den INTE kan avkoda går iväg som den är,
    -- och en 48-megapixelbild från en modern iPhone sprängde det gamla taket.
    -- Gränsen är alltså höjd för det fall där komprimeringen inte kan hjälpa.
    byte_size         integer not null check (byte_size between 1 and 12582912),
    caption           text check (length(btrim(caption)) <= 200),

    -- Uppladdarens försäkran om att bilden är hens egen.
    --
    -- Står som kolumn och inte bara som en ruta i formuläret. Frågan om vem som
    -- tagit en bild går inte att avgöra i efterhand, och det enda vi kan visa
    -- är att den som skickade in den svarade på frågan. Policyn kräver true,
    -- så en rad utan försäkran kan inte finnas. Villkoren beskriver vilken rätt
    -- Prikko får, se site/src/pages/villkor.astro.
    rights_confirmed  boolean not null default false,

    status            community.moderation_status not null default 'pending',
    moderated_at      timestamptz,
    moderated_by      text,
    rejection_reason  text,
    -- Publik URL efter flytt. NULL tills bilden godkänts.
    published_url     text,

    created_at        timestamptz not null default now()
);

-- Kolumnerna kom till efter tabellen, och `create table if not exists` rör
-- inte en databas som redan har den. Raderna nedan är alltså de som faktiskt
-- kör i produktion. Samma form som rating och visited_month på reviews.
alter table community.image_uploads
    add column if not exists review_id uuid references community.reviews (id) on delete cascade;

alter table community.image_uploads
    add column if not exists rights_confirmed boolean not null default false;

-- Villkoren på content_type och byte_size ändrades när HEIC släpptes in, och ett
-- `check` i en `create table if not exists` rör inte en tabell som redan finns.
-- Raderna nedan är alltså de som faktiskt kör i produktion. Namnen är de
-- Postgres själv ger ett kolumnvillkor: <tabell>_<kolumn>_check.
alter table community.image_uploads
    drop constraint if exists image_uploads_content_type_check;

alter table community.image_uploads
    add constraint image_uploads_content_type_check
    check (content_type in ('image/jpeg', 'image/png', 'image/webp',
                            'image/heic', 'image/heif',
                            'image/heic-sequence', 'image/heif-sequence'));

alter table community.image_uploads
    drop constraint if exists image_uploads_byte_size_check;

alter table community.image_uploads
    add constraint image_uploads_byte_size_check
    check (byte_size between 1 and 12582912);

create index if not exists image_uploads_pending_idx
    on community.image_uploads (created_at) where status = 'pending';

create index if not exists image_uploads_published_idx
    on community.image_uploads (establishment_id, created_at desc) where status = 'published';

create index if not exists image_uploads_review_idx
    on community.image_uploads (review_id);

-- ---------------------------------------------------------------------------
-- Statusen och kvoterna sätts av databasen, aldrig av det som skickas in
-- ---------------------------------------------------------------------------
-- Samma uppdelning som för omdömen: policyn avgör OM raden får finnas,
-- triggern avgör HUR MÅNGA och med vilken status. Skälet att kvoterna ligger
-- här och inte i policyn är att en trigger kan säga varför på svenska.
-- translate() i site/src/lib/community.ts skickar okända fel vidare ordagrant,
-- så texterna nedan går rakt ut till den som laddar upp. En avvisad rad från
-- en policy säger bara "violates row-level security", och det är inget besked
-- till någon som just valt fyra bilder.
--
-- De tre gränserna, alla ur docs/13, del C3:
--
--   Fem bilder per dygn och konto. Skyddar lagringen och kön mot en enskild
--     person.
--   Tre bilder per verksamhet och konto, räknat utan de avslagna. Skyddar en
--     enskild verksamhet mot att bli nedtryckt av en person.
--   Tio öppna bilder samtidigt per konto. Den viktigaste av de tre.
--     Granskningen är en ensam människa, och en kö som går att fylla snabbare
--     än den töms är i praktiken en avstängning av funktionen.
--
-- INGEN security definer. Funktionen läser bara community.image_uploads, och
-- radsäkerheten där släpper redan ut varje egen rad. Filtret user_id =
-- new.user_id står ändå utskrivet i varje fråga, av samma skäl som ownRows()
-- finns i klienten: radsäkerhet är inte ett filter.
create or replace function community.set_image_status()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
    senaste_dygnet integer;
    pa_stallet     integer;
    oppna          integer;
begin
    -- Statusen får aldrig komma utifrån. Kunde den skickas in vore
    -- granskningen borta i samma ögonblick som någon skickade
    -- `status: published` tillsammans med en fil.
    new.status := 'pending';
    new.moderated_at := null;
    new.moderated_by := null;
    new.rejection_reason := null;
    new.published_url := null;

    -- Sökvägen måste ligga i uppladdarens egen mapp. Utan den här raden kan en
    -- rad peka på någon annans fil, och storage-policyn hade då släppt in en
    -- skrivning där för att raden fanns.
    if new.storage_path is null
       or new.storage_path not like 'pending/' || new.user_id::text || '/%' then
        raise exception 'Bildens sökväg hör inte till kontot.'
            using errcode = 'check_violation';
    end if;

    select count(*) into senaste_dygnet
    from community.image_uploads i
    where i.user_id = new.user_id
      and i.created_at > now() - interval '24 hours';

    if senaste_dygnet >= 5 then
        raise exception 'Fem bilder per dygn räcker. Försök igen i morgon.'
            using errcode = 'check_violation';
    end if;

    select count(*) into pa_stallet
    from community.image_uploads i
    where i.user_id = new.user_id
      and i.establishment_id = new.establishment_id
      and i.status <> 'rejected';

    if pa_stallet >= 3 then
        raise exception 'Tre bilder per verksamhet räcker.'
            using errcode = 'check_violation';
    end if;

    select count(*) into oppna
    from community.image_uploads i
    where i.user_id = new.user_id
      and i.status = 'pending';

    if oppna >= 10 then
        raise exception 'Du har tio bilder som väntar på granskning. Vänta tills de är avgjorda.'
            using errcode = 'check_violation';
    end if;

    return new;
end;
$$;

comment on function community.set_image_status() is
    'Sätter status och håller kvoterna vid insättning av en bild. Se docs/13 del C3.';

drop trigger if exists image_uploads_set_status on community.image_uploads;
create trigger image_uploads_set_status
    before insert on community.image_uploads
    for each row execute function community.set_image_status();

-- Publik läsvy för bilder.
--
-- Samma konstruktion och samma skäl som community.published_reviews: tabellen
-- bär uppladdarens user_id, moderatorns namn och avslagsskälet, och inget av
-- det ska ut. Vyn väljer kolumner uttryckligen, så en ny känslig kolumn på
-- tabellen blir inte publik av sig själv. `security_invoker` gör att RLS på
-- tabellen gäller ändå.
--
-- INGEN uppgift om vem som laddat upp bilden, inte ens ett visningsnamn.
-- Omdömen är anonyma, och en bild bredvid ett anonymt omdöme får inte vara
-- vägen till att identifiera den som skrev det.
drop view if exists community.published_images;

create view community.published_images as
select
    i.id,
    i.establishment_id,
    i.municipality_slug,
    i.published_url,
    i.created_at
from community.image_uploads i
where i.status = 'published'
  and i.published_url is not null;

alter view community.published_images set (security_invoker = true);

-- ---------------------------------------------------------------------------
-- Radsäkerhet
--
-- Grundregeln: en inloggad användare ser och skriver sina egna rader. Alla
-- andra ser bara det som redaktionen publicerat. Ingen roll utom service_role
-- får UPPDATERA något, för det är uppdateringen som skulle kunna flytta en rad
-- från pending till published.
-- ---------------------------------------------------------------------------
alter table community.profiles            enable row level security;
alter table community.follows             enable row level security;
alter table community.notifications       enable row level security;
alter table community.notices             enable row level security;
alter table community.notice_reads        enable row level security;
alter table community.establishment_claims enable row level security;
alter table community.owner_responses     enable row level security;
alter table community.reviews             enable row level security;
alter table community.image_uploads       enable row level security;

-- Profiler: egen rad, full kontroll. Ingen kan läsa någon annans profilrad
-- direkt; visningsnamnet når allmänheten bara genom published_reviews.
drop policy if exists profiles_own on community.profiles;
create policy profiles_own on community.profiles
    for all to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- Bevakning: privat, ingen moderering, får raderas fritt.
drop policy if exists follows_own on community.follows;
create policy follows_own on community.follows
    for all to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- Notiser: bara läsning, bara egna rader. Ingen inloggad roll får skriva här —
-- loggen är pipelinens kvitto på vad som skickats, och ett kvitto man kan
-- skriva själv är inget kvitto.
drop policy if exists notifications_read_own on community.notifications;
create policy notifications_read_own on community.notifications
    for select to authenticated
    using (user_id = auth.uid());

-- Notiser: bara läsning, bara egna rader. Samma regel som notifications och av
-- samma skäl. Raderna skrivs av pipeline/notify.py med service_role, och en
-- notis man kan skriva åt sig själv säger ingenting om vad kommunen gjort.
drop policy if exists notices_read_own on community.notices;
create policy notices_read_own on community.notices
    for select to authenticated
    using (user_id = auth.uid());

-- Läsmarkeringen är det ENDA en inloggad får skriva om sig själv utanför sitt
-- eget innehåll. Raden bär ett klockslag och ingenting annat: ingen text, inget
-- utfall, ingen status. Att den går att sätta fritt spelar därför ingen roll —
-- det värsta någon kan göra mot sig själv är att dölja sin egen prick.
drop policy if exists notice_reads_own on community.notice_reads;
create policy notice_reads_own on community.notice_reads
    for all to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- Anspråk: får skapas och läsas av sökanden, aldrig ändras av hen.
drop policy if exists claims_insert on community.establishment_claims;
create policy claims_insert on community.establishment_claims
    for insert to authenticated
    with check (
        user_id = auth.uid()
        -- Den sökande får inte sätta sitt eget utfall.
        and status = 'pending'
        and verification_method is null
        and verified_at is null
    );

drop policy if exists claims_read_own on community.establishment_claims;
create policy claims_read_own on community.establishment_claims
    for select to authenticated
    using (user_id = auth.uid());

-- Svar: får bara skapas av någon med godkänt anspråk på just den verksamheten.
--
-- Kontrollen sitter i policyn och inte i klienten. Det är skillnaden mellan
-- "vi visar inte formuläret" och "databasen vägrar ta emot raden".
drop policy if exists owner_responses_insert on community.owner_responses;
create policy owner_responses_insert on community.owner_responses
    for insert to authenticated
    with check (
        user_id = auth.uid()
        and status = 'pending'
        and moderated_at is null
        and published_at is null
        and exists (
            select 1 from community.establishment_claims c
            where c.user_id = auth.uid()
              and c.establishment_id = owner_responses.establishment_id
              and c.status = 'published'
        )
    );

drop policy if exists owner_responses_read_own on community.owner_responses;
create policy owner_responses_read_own on community.owner_responses
    for select to authenticated
    using (user_id = auth.uid());

-- Omdömen: skapas som pending, läses av sin författare i alla lägen och av
-- alla andra bara när de är publicerade.
-- Policyn kan INTE kräva `status = 'pending'`.
--
-- RLS-villkoret prövas mot raden som den ska lagras, alltså efter att
-- before-triggern kört. Med det gamla villkoret hade varje automatiskt
-- publicerat betyg fällts av sin egen policy.
--
-- Att status, moderated_by och moderated_at inte längre nämns här är ingen
-- lucka: community.set_review_status() skriver över alla tre vid varje
-- insättning, och en trigger går inte att kringgå med en rättighet.
drop policy if exists reviews_insert on community.reviews;
create policy reviews_insert on community.reviews
    for insert to authenticated
    with check (user_id = auth.uid());

drop policy if exists reviews_read_own on community.reviews;
create policy reviews_read_own on community.reviews
    for select to authenticated
    using (user_id = auth.uid());

-- Den enda vägen till någon annans omdöme. `status = 'published'` sätts bara
-- av service_role, och kontrollen `review_published_requires_moderator` gör
-- att en människa måste ha stått bakom beslutet.
--
-- VARNING TILL KLIENTSKRIVAREN: policyer läggs ihop med ELLER. En inloggad
-- som frågar reviews utan eget filter får alltså SINA rader PLUS ALLAS
-- publicerade, och det är rätt ur databasens synvinkel. "Mina omdömen" måste
-- därför alltid fråga med user_id=eq.<eget id>. Det gjorde klienten inte en
-- gång, och den som loggade in med ett nytt konto stod som avsändare av
-- andras omdömen. Se ownRows() i site/src/lib/community.ts och testet
-- pipeline/tests/test_egna_rader.py.
drop policy if exists reviews_read_published on community.reviews;
create policy reviews_read_published on community.reviews
    for select to anon, authenticated
    using (status = 'published');

-- Rätten att ta tillbaka det man skrivit. Gäller även publicerade omdömen:
-- ett omdöme är författarens yttrande, inte redaktionens.
drop policy if exists reviews_delete_own on community.reviews;
create policy reviews_delete_own on community.reviews
    for delete to authenticated
    using (user_id = auth.uid());

-- Bilder: från vem som helst som är inloggad och INTE företräder verksamheten.
--
-- EN BILD KRÄVER INGET OMDÖME. Här stod tidigare ett krav på ett eget omdöme
-- med text, hämtat ur en rekommendation i docs/13. Ägaren har underkänt det:
-- "Om vi har en policy, den ska aldrig begränsa oss, det är bara att ändra
-- den. Man ska såklart kunna ladda upp bilder endast, behöver ej va text."
--
-- Villkoren som står kvar, och vart och ett bär sitt eget skäl:
--
--   Egen rad. `user_id` måste vara den inloggade. Det är också det som gör en
--     fristående bild spårbar och borttagbar av den som skickade in den.
--   Hör bilden till ett omdöme måste det omdömet vara ENS EGET och gälla SAMMA
--     verksamhet. Villkoret gäller bara när `review_id` är satt. Utan det andra
--     ledet räckte ett omdöme om vilken verksamhet som helst för att lägga
--     bilder på vilken annan som helst.
--   Ingen godkänd företrädare. Den som företräder verksamheten laddar inte upp
--     i besökarflödet. Se kommentaren över tabellen: ägarens bildyta är en
--     betaltjänst som inte finns.
--   Bekräftad rätt till bilden. Kolumnen är false som förval, så en rad utan
--     försäkran kan inte skrivas.
--
-- Status och kvoter står INTE här. De sätts av community.set_image_status(),
-- som är en trigger och därför inte går att kringgå med en rättighet, och som
-- till skillnad från en policy kan säga på svenska varför den sa nej. Kvoterna
-- räknas per konto och verksamhet och bryr sig inte om något omdöme finns.
drop policy if exists image_uploads_insert on community.image_uploads;
create policy image_uploads_insert on community.image_uploads
    for insert to authenticated
    with check (
        user_id = auth.uid()
        and rights_confirmed
        and (
            review_id is null
            or exists (
                select 1 from community.reviews r
                where r.id = image_uploads.review_id
                  and r.user_id = auth.uid()
                  and r.establishment_id = image_uploads.establishment_id
            )
        )
        and not exists (
            select 1 from community.establishment_claims c
            where c.user_id = auth.uid()
              and c.establishment_id = image_uploads.establishment_id
              and c.status = 'published'
        )
    );

drop policy if exists image_uploads_read_own on community.image_uploads;
create policy image_uploads_read_own on community.image_uploads
    for select to authenticated
    using (user_id = auth.uid());

-- Rätten att ta tillbaka en bild man skickat in.
--
-- Gäller ALLA egna rader, oavsett status. Villkoret var tidigare `pending`, och
-- det höll bara så länge varje bild hängde på ett omdöme: att ta tillbaka
-- bilden var då att radera omdömet, och kaskaden gjorde resten. En fristående
-- bild har inget omdöme att försvinna med, så utan den här policyn hade en
-- publicerad bild suttit fast för alltid.
--
-- Samma princip som reviews_delete_own: det man skickat in är ens eget, och
-- redaktionen äger inte någons bild för att den råkat bli publicerad.
--
-- Filen tas bort av klienten i samma veva, se deleteUpload() i
-- site/src/lib/community.ts och storage-policyerna längst ner. En rad utan fil
-- är osynlig, men en fil utan rad ligger kvar på en publik URL, och det är den
-- riktningen som måste stängas.
drop policy if exists image_uploads_delete_own on community.image_uploads;
create policy image_uploads_delete_own on community.image_uploads
    for delete to authenticated
    using (user_id = auth.uid());

-- Den enda vägen till någon annans bild, och den går genom vyn
-- community.published_images som väljer sina kolumner uttryckligen.
--
-- SAMMA VARNING SOM VID reviews_read_published: policyer läggs ihop med ELLER.
-- En inloggad som frågar image_uploads utan eget filter får sina rader PLUS
-- allas publicerade. "Mina bilder" måste därför alltid fråga med
-- user_id=eq.<eget id>. Se ownRows() i site/src/lib/community.ts och testet
-- pipeline/tests/test_egna_rader.py, som fäller bygget om någon fråga går förbi.
drop policy if exists image_uploads_read_published on community.image_uploads;
create policy image_uploads_read_published on community.image_uploads
    for select to anon, authenticated
    using (status = 'published');

-- ---------------------------------------------------------------------------
-- Rättigheter
--
-- Explicit och smalt. Ingen `all tables in schema`-formulering här: varje
-- tabell och varje verb står utskrivet, så en ny tabell i det här schemat är
-- osynlig tills någon medvetet släpper fram den.
-- ---------------------------------------------------------------------------
grant usage on schema community to anon, authenticated;

grant select, insert, update, delete on community.profiles to authenticated;
grant select, insert, delete          on community.follows  to authenticated;
grant select, insert                  on community.establishment_claims to authenticated;
grant select, insert                  on community.owner_responses      to authenticated;
grant select, insert, delete          on community.reviews              to authenticated;
-- Delete på bilder är städning efter en misslyckad uppladdning och når bara
-- egna rader som fortfarande är `pending`. Se image_uploads_delete_own.
grant select, insert, delete          on community.image_uploads        to authenticated;
grant select                          on community.notifications        to authenticated;
grant select                          on community.notices              to authenticated;
-- Ingen delete på läsmarkeringen: raden ÄR markeringen, och en borttagen rad
-- betyder "aldrig läst". Att kunna nollställa sin egen klocka är ingen
-- funktion någon efterfrågat, och update räcker för att flytta den framåt.
grant select, insert, update          on community.notice_reads         to authenticated;

-- Anon får läsa publicerade omdömen och publicerade bilder, ingenting annat.
--
-- Rättigheten på tabellerna behövs trots att bara vyerna ska läsas:
-- `security_invoker` gör att frågan körs med anroparens rättigheter, och utan
-- select på tabellen under faller hela vyn med 42501. Radsäkerheten är det som
-- avgör VILKA rader som kommer ut, aldrig den här raden.
grant select on community.reviews           to anon;
grant select on community.image_uploads     to anon;
grant select on community.published_reviews to anon, authenticated;
grant select on community.published_images  to anon, authenticated;

-- Avregistreringsfunktionerna. Postgres ger som förval EXECUTE till PUBLIC på
-- varje ny funktion, och det förvalet ska inte gälla för två `security
-- definer`-funktioner. Raderna nedan stänger först och öppnar sedan för de två
-- roller som ska ha dem.
revoke execute on function community.follow_by_token(uuid)         from public;
revoke execute on function community.stop_following(uuid, boolean) from public;
grant  execute on function community.follow_by_token(uuid)         to anon, authenticated;
grant  execute on function community.stop_following(uuid, boolean) to anon, authenticated;

-- Ingen får UPPDATERA. Moderering sker uteslutande med service_role genom
-- pipeline/moderate.py. Det här är raden som gör att `pending` inte kan bli
-- `published` utan att en människa kört verktyget.
revoke update on community.establishment_claims from anon, authenticated;
revoke update on community.owner_responses      from anon, authenticated;
revoke update on community.reviews              from anon, authenticated;
revoke update on community.image_uploads        from anon, authenticated;
revoke update on community.notices              from anon, authenticated;

-- Modereringsrollen. Utan de här raderna svarar varje anrop från moderate.py
-- med 42501, eftersom service_role varken hade USAGE på schemat eller en enda
-- tabell. Att rollen kringgår radsäkerheten hjälper inte: GRANT prövas först.
--
-- UPDATE är hela poängen. Det är den enda vägen pending kan bli published, och
-- den vägen går bara genom verktyget.
grant usage on schema community to service_role;

grant select, insert, update, delete on community.reviews              to service_role;
grant select, insert, update, delete on community.establishment_claims to service_role;
grant select, insert, update, delete on community.owner_responses      to service_role;
grant select, insert, update, delete on community.image_uploads        to service_role;

-- Profiler och bevakningar modereras inte, men måste gå att radera när någon
-- begär det enligt artikel 17.
grant select, insert, update, delete on community.profiles to service_role;
grant select, insert, update, delete on community.follows  to service_role;

-- Notisloggen och notiserna skrivs av pipeline/notify.py och av ingen annan.
grant select, insert, update, delete on community.notifications to service_role;
grant select, insert, update, delete on community.notices       to service_role;
-- Läsmarkeringen skriver bara användaren själv. service_role har den ändå, för
-- artikel 17: en radering av ett konto ska inte lämna en föräldralös rad.
grant select, insert, update, delete on community.notice_reads  to service_role;

-- Räknaren bakom klockan. Postgres ger som förval EXECUTE till PUBLIC, och
-- funktionen ska inte gå att anropa av anon: den läser auth.uid(), som är null
-- där, men en funktion utan mottagare är ändå en yta att stänga.
revoke execute on function community.unread_notices() from public;
grant  execute on function community.unread_notices() to authenticated;

grant select on community.published_reviews to service_role;
grant select on community.published_images  to service_role;

-- Sekvenser finns inte här (allt är uuid), men förvalet ska ändå vara stängt
-- för framtida tabeller i schemat.
alter default privileges in schema community revoke all on tables from anon, authenticated;

-- Låst search_path på schemats två funktioner. Ingen av dem är security
-- definer, så det här är härdning och inte en akut lucka. Men freeze_body är
-- triggern som håller löftet vi publicerar ordagrant på metodiksidan, och en
-- funktion vars search_path anroparen kan sätta är fel plats att lämna en lös
-- tråd på.
alter function community.freeze_body() set search_path = '';
alter function community.is_establishment_id(text) set search_path = '';

-- De två avregistreringsfunktionerna sätter redan sin search_path i sin egen
-- definition, vilket de MÅSTE göra: de är security definer och anropas av anon.

-- ---------------------------------------------------------------------------
-- Exponering mot API:t
--
-- PostgREST serverar bara de scheman som står i authenticator-rollens
-- pgrst.db_schemas. Raden nedan gör samma sak som rutan "Exposed schemas" i
-- Supabase-panelen, fast i kod så att den här filen ensam räcker för att
-- återskapa uppsättningen.
--
-- OBS: när inställningen satts för hand slutar panelens ruta att styra
-- listan. Ändringar där får då ingen verkan. Tillbaka till panelstyrning med
--     alter role authenticator reset pgrst.db_schemas;
--
-- public och graphql_public är Supabase eget förval och måste stå kvar, annars
-- slutar den redaktionella databasen att svara.
alter role authenticator set pgrst.db_schemas = 'public, graphql_public, community';
notify pgrst, 'reload config';
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Kontroll: den redaktionella databasen får inte ha blivit skrivbar
--
-- schema.sql avslutar med en revoke på public. Den här körningen lägger till
-- ett eget schema och ska inte kunna rubba det. Raden nedan upprepar spärren i
-- stället för att lita på att ingen rört den.
-- ---------------------------------------------------------------------------
revoke insert, update, delete on all tables in schema public from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Lagring för bilder
--
-- Buckets skapas via Storage-API:t och inte med DDL, så de två raderna nedan
-- är den form Supabase själv använder. Den privata bucketen får aldrig sättas
-- till public.
-- ---------------------------------------------------------------------------
-- DEN INKOMNA hinken tar emot HEIC och HEIF. Det är iPhones förvalda format och
-- alltså det vanligaste våra besökare skickar.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verksamhetsbilder-inkomna', 'verksamhetsbilder-inkomna', false, 12582912,
        array['image/jpeg', 'image/png', 'image/webp',
              'image/heic', 'image/heif',
              'image/heic-sequence', 'image/heif-sequence'])
on conflict (id) do update
    set public = false,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

-- DEN PUBLIKA hinken tar ALDRIG emot HEIC, och raden nedan är det som håller
-- den regeln i databasen i stället för bara i moderate.py.
--
-- Skälet är enkelt: en publicerad bild ska kunna visas av alla, och Chrome och
-- Firefox kan inte avkoda HEIC. Kommer en HEIC ända hit har konverteringen i
-- granskningen missats, och då ska skrivningen fällas och inte bli en bild som
-- är osynlig för de flesta besökare.
--
-- `do update` och inte `do nothing`. Med `do nothing` bevarade en omkörning
-- vilken uppsättning hinken än råkade ha, och en hink som skapats för hand i
-- panelen hade behållit sina inställningar tyst.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verksamhetsbilder', 'verksamhetsbilder', true, 12582912,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
    set public = true,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

-- Uppladdning: bara till en plats databasen redan delat ut.
--
-- BUCKETEN ÄR STÄNGD SOM FÖRVAL. En fil kan bara skrivas om det redan finns en
-- väntande rad i community.image_uploads som pekar på exakt den sökvägen, är
-- uppladdarens egen, och har passerat både policyn och kvoterna på den
-- tabellen.
--
-- Här stod tidigare ett krav på ett godkänt anspråk NÅGONSTANS, och resten
-- lämnades åt raden. Det höll bara så länge uppladdarna var en handfull
-- registerkontrollerade företrädare. Med besökaruppladdning vänder det: policyn
-- nedan kan bara se mappen, och räknas kvoten på raderna medan filen skrivs
-- först kan vem som helst med ett konto fylla bucketen utan att skapa en enda
-- rad. Kvoten hade då vaktat en dörr ingen behövde gå igenom.
--
-- Mappvillkoren står kvar som ett andra lager. Sökvägens form kontrolleras
-- redan av community.set_image_status(), men en rad och en fil som pekar på
-- varandra ska stämma överens sedda från båda hållen.
drop policy if exists "inkomna_upload_own" on storage.objects;
create policy "inkomna_upload_own" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'verksamhetsbilder-inkomna'
        and (storage.foldername(name))[1] = 'pending'
        and (storage.foldername(name))[2] = auth.uid()::text
        and exists (
            select 1 from community.image_uploads u
            where u.user_id = auth.uid()
              and u.storage_path = storage.objects.name
              and u.status = 'pending'
        )
    );

-- Uppladdaren får se sin egen fil, ingen annan får se den alls.
drop policy if exists "inkomna_read_own" on storage.objects;
create policy "inkomna_read_own" on storage.objects
    for select to authenticated
    using (
        bucket_id = 'verksamhetsbilder-inkomna'
        and (storage.foldername(name))[2] = auth.uid()::text
    );

-- Att ta bort sin egen fil, ur båda bucketarna.
--
-- Mappen ÄR behörigheten. Inkorgen lagrar under 'pending/<user_id>/' och den
-- publika bucketen under '<user_id>/', alltså står uppladdarens id i första
-- respektive andra ledet, och ingen kan nå någon annans fil.
--
-- Behövs sedan en bild kan stå utan omdöme. Förut var vägen att ta tillbaka en
-- publicerad bild att radera omdömet den hängde på; en fristående bild har
-- ingen sådan väg, och utan de här två policyerna hade en publik URL levt kvar
-- efter att ägaren till bilden bett om att få bort den.
--
-- Redaktionens egen radering vid avslag går inte den här vägen. moderate.py
-- kör med service_role och går förbi radsäkerheten helt.
drop policy if exists "inkomna_delete_own" on storage.objects;
create policy "inkomna_delete_own" on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'verksamhetsbilder-inkomna'
        and (storage.foldername(name))[2] = auth.uid()::text
    );

drop policy if exists "publika_delete_own" on storage.objects;
create policy "publika_delete_own" on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'verksamhetsbilder'
        and (storage.foldername(name))[1] = auth.uid()::text
    );
