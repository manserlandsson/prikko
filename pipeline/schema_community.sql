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
-- Allt användarskrivet är `pending` när det skapas. Ingen inloggad roll får
-- ändra `status`, för det finns ingen update-policy. Bara service_role, som
-- går förbi RLS och bara används av pipelinen och modereringsverktyget, kan
-- flytta en rad till `published`.
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
-- INGET BETYG I SIFFROR, med avsikt. Ett stjärnbetyg är den enda ingrediens
-- som saknas för att någon en dag ska märka upp sidan med AggregateRating
-- bredvid en hygienbedömning som bygger på myndighetsdata. Finns talet inte
-- kan misstaget inte begås. Omdömen är text.
--
-- Omdömen renderas ALDRIG i det statiska bygget. De hämtas i webbläsaren och
-- ligger i en egen, utmärkt del av sidan. Ingen JSON-LD, aldrig `Review`.
-- ---------------------------------------------------------------------------
create table if not exists community.reviews (
    id                uuid primary key default gen_random_uuid(),
    user_id           uuid not null references auth.users (id) on delete cascade,

    establishment_id  text not null check (community.is_establishment_id(establishment_id)),
    municipality_slug text not null,

    body              text not null check (length(btrim(body)) between 20 and 2000),

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
               or (moderated_by is not null and moderated_at is not null))
);

drop trigger if exists reviews_frozen on community.reviews;
create trigger reviews_frozen
    before update on community.reviews
    for each row execute function community.freeze_body();

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
drop view if exists community.published_reviews;

create view community.published_reviews as
select
    r.id,
    r.establishment_id,
    r.municipality_slug,
    r.body,
    r.created_at,
    coalesce(r.author_name, 'Besökare') as author
from community.reviews r
where r.status = 'published';

alter view community.published_reviews set (security_invoker = true);

-- ---------------------------------------------------------------------------
-- Bilduppladdningar
--
-- En användaruppladdad bild på en namngiven restaurang kan vara vad som helst,
-- och till skillnad från en text går innehållet inte att söka igenom. Därför
-- finns ingen öppen uppladdning.
--
-- Ordningen:
--   1. Bara inloggade som har ett GODKÄNT anspråk på verksamheten får ladda
--      upp. Besökare kan inte ladda upp bilder alls i den här versionen. Det
--      halverar problemet direkt: uppladdaren är en känd, registerkontrollerad
--      motpart med något att förlora.
--   2. Filen går till en PRIVAT bucket under `pending/<user_id>/`. Ingen anon
--      kan läsa den. Det finns ingen URL att sprida.
--   3. Storlek och filtyp kontrolleras både i bucketens policy och här.
--   4. Redaktionen tittar på bilden i moderate.py och väljer publicera eller
--      avslå. Vid publicering flyttas filen till den publika bucketen och en
--      rad skrivs i public.images med source='owner'.
--   5. Bilden syns på sajten först i nästa bygge.
--
-- Det som INTE finns och som ägaren bör känna till: ingen automatisk
-- innehållsklassning, ingen EXIF-rensning, ingen dubblettkontroll mot kända
-- bilder. Steg 1 gör manuell granskning hanterbar i volym; går uppladdning en
-- dag ut till besökare håller den ordningen inte.
-- ---------------------------------------------------------------------------
create table if not exists community.image_uploads (
    id                uuid primary key default gen_random_uuid(),
    user_id           uuid not null references auth.users (id) on delete cascade,

    establishment_id  text not null check (community.is_establishment_id(establishment_id)),
    municipality_slug text not null,

    -- Sökväg i den privata bucketen, t.ex. 'pending/<user_id>/<uuid>.jpg'.
    storage_path      text not null unique,
    content_type      text not null check (content_type in
                            ('image/jpeg', 'image/png', 'image/webp')),
    byte_size         integer not null check (byte_size between 1 and 8388608),
    caption           text check (length(btrim(caption)) <= 200),

    status            community.moderation_status not null default 'pending',
    moderated_at      timestamptz,
    moderated_by      text,
    rejection_reason  text,
    -- Publik URL efter flytt. NULL tills bilden godkänts.
    published_url     text,

    created_at        timestamptz not null default now()
);

create index if not exists image_uploads_pending_idx
    on community.image_uploads (created_at) where status = 'pending';

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
drop policy if exists reviews_insert on community.reviews;
create policy reviews_insert on community.reviews
    for insert to authenticated
    with check (
        user_id = auth.uid()
        and status = 'pending'
        and moderated_at is null
        and moderated_by is null
    );

drop policy if exists reviews_read_own on community.reviews;
create policy reviews_read_own on community.reviews
    for select to authenticated
    using (user_id = auth.uid());

-- Den enda vägen till någon annans omdöme. `status = 'published'` sätts bara
-- av service_role, och kontrollen `review_published_requires_moderator` gör
-- att en människa måste ha stått bakom beslutet.
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

-- Bilder: samma spärr som svar. Bara godkända företrädare får ladda upp.
drop policy if exists image_uploads_insert on community.image_uploads;
create policy image_uploads_insert on community.image_uploads
    for insert to authenticated
    with check (
        user_id = auth.uid()
        and status = 'pending'
        and published_url is null
        and exists (
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
grant select, insert                  on community.image_uploads        to authenticated;
grant select                          on community.notifications        to authenticated;

-- Anon får läsa publicerade omdömen och ingenting annat.
grant select on community.reviews           to anon;
grant select on community.published_reviews to anon, authenticated;

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

-- Notisloggen skrivs av pipeline/notify.py och av ingen annan.
grant select, insert, update, delete on community.notifications to service_role;

grant select on community.published_reviews to service_role;

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
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verksamhetsbilder-inkomna', 'verksamhetsbilder-inkomna', false, 8388608,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
    set public = false,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verksamhetsbilder', 'verksamhetsbilder', true, 8388608,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Uppladdning: bara till den privata bucketen, bara under den egna
-- användarens mapp, och bara av någon som har ett godkänt anspråk någonstans.
-- Vilken verksamhet bilden gäller kontrolleras av raden i image_uploads.
drop policy if exists "inkomna_upload_own" on storage.objects;
create policy "inkomna_upload_own" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'verksamhetsbilder-inkomna'
        and (storage.foldername(name))[1] = 'pending'
        and (storage.foldername(name))[2] = auth.uid()::text
        and exists (
            select 1 from community.establishment_claims c
            where c.user_id = auth.uid() and c.status = 'published'
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
