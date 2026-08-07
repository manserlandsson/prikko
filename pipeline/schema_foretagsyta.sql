-- ===========================================================================
-- Företagsytan: vad en godkänd företrädare får fylla på med
--
-- Körs EFTER schema_community.sql OCH schema_admin.sql. Ordningen är inte
-- godtycklig sedan granskningen flyttade in i webbläsaren: filen slutar med
-- beslutsfunktioner som anropar community.require_admin() och
-- community.object_stem(), och båda definieras i schema_admin.sql.
--
-- Filen är avsiktligt skild från schema_community.sql, för två skäl som båda
-- är praktiska:
--
--   1. Anspråket och replikrätten är sajtens integritet och ändras nästan
--      aldrig. Företagsytan är en produktyta som kommer att ändras ofta.
--   2. Två filer kan skrivas av två personer samma dag utan att krocka.
--
-- ---------------------------------------------------------------------------
-- VAD SOM INTE FÅR FINNAS HÄR
-- ---------------------------------------------------------------------------
-- Ingenting i den här filen får röra bedömningen, kontrollhistoriken eller
-- utmärkelsen. Ett företag kan lägga till uppgifter OM sig självt. Det kan
-- inte dölja, nyansera eller kommentera en kontroll härifrån. Vägen att
-- kommentera en kontroll är community.owner_responses, den går genom
-- moderering, och den publiceras ordagrant.
--
-- Företaget kan inte heller lägga bilder i besökarnas omdömesflöde.
-- community.image_uploads hör till besökaren och stänger uttryckligen ute den
-- som har ett godkänt anspråk. Den regeln bor där, inte här.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- Nivå på anspråket
--
-- Tjänsten är gratis i dag och kan komma att kosta senare. Skillnaden mellan
-- gratis och betalt ska då vara EN uppgift i databasen, inte en lista med
-- funktioner utspridd i sidmallar.
--
-- Därför bär anspråket en nivå. Vad varje nivå får göra avgörs på ett enda
-- ställe i klienten (site/src/lib/foretag.ts, NIVAER) och kan flyttas hit som
-- en policy den dag en gräns måste hålla mot någon som läser vår JavaScript.
--
-- I dag har alla nivån 'gratis' och 'gratis' får allt som är byggt. Det är
-- avsikten: kolumnen finns för att slippa en migrering senare, inte för att
-- stänga någon ute nu.
-- ---------------------------------------------------------------------------
alter table community.establishment_claims
    add column if not exists tier text not null default 'gratis';

do $$
begin
    alter table community.establishment_claims
        add constraint claim_tier_known check (tier in ('gratis', 'plus'));
exception when duplicate_object then null;
end $$;


-- ---------------------------------------------------------------------------
-- Företagets egna uppgifter
--
-- EN RAD ÄR EN INSÄNDNING, INTE ETT FORMULÄR SOM SPARAS ÖVER.
--
-- Samma ordning som owner_responses: raden skrivs en gång, en människa
-- publicerar eller avslår, och texten kan aldrig ändras på vägen. Vill
-- företaget ändra något skickar det en ny insändning, och den som är
-- publicerad senast är den som gäller. Det ger en historik som går att gå
-- tillbaka i när någon påstår att vi ändrat i deras text.
--
-- Skillnaden mot owner_responses är att en insändning som ännu inte granskats
-- FÅR tas bort av den som skrev den. Ett svar på en kontroll är ett yttrande
-- och ska stå kvar; öppettider är en uppgift och ska kunna dras tillbaka när
-- man stavat fel. Därför finns en delete-policy längre ner, begränsad till
-- egna rader som fortfarande är obehandlade.
--
-- ALLT HÄR ÄR PÅSTÅENDEN FRÅN FÖRETAGET. Redaktionen kontrollerar att det är
-- rimligt och inte olagligt, inte att det är sant. En felaktig öppettid är
-- företagets fel, till skillnad från en felaktig kontrolluppgift.
-- ---------------------------------------------------------------------------
create table if not exists community.business_profiles (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references auth.users (id) on delete cascade,
    establishment_id    text not null check (community.is_establishment_id(establishment_id)),
    municipality_slug   text not null,

    -- Vad företaget vill berätta. Alla fält är frivilliga var för sig, men en
    -- insändning utan innehåll är meningslös och fälls av profile_not_empty.
    presentation        text check (presentation is null
                                    or length(btrim(presentation)) between 20 and 1500),

    -- Öppettider som {"mon": {"from": "11:00", "to": "22:00"}, "tue": {"closed": true}, ...}.
    -- Formen valideras i community.check_profile() och inte med ett
    -- check-villkor, för ett check-villkor kan inte ge ett begripligt fel.
    --
    -- Ett klockslag "to" som är mindre än "from" betyder att kvällen fortsätter
    -- efter midnatt. 17:00 till 02:00 är en vanlig restaurangkväll, och den som
    -- läser tabellen tolkar den utan hjälp. Beräkningen av "öppet nu" gör det
    -- inte av sig själv, och den regeln bor i oppetNu() i site/src/lib/foretag.ts.
    opening_hours       jsonb,

    -- Avvikande tider för enskilda datum, som
    -- {"2026-12-24": {"closed": true, "label": "Julafton"},
    --  "2026-12-31": {"from": "12:00", "to": "16:00", "label": "Nyårsafton"}}.
    --
    -- EGEN KOLUMN OCH INTE EN NYCKEL I opening_hours. Veckoschemat är en regel
    -- som gäller tills vidare, ett datum är ett undantag som går ut av sig
    -- självt. Läggs de i samma objekt måste varje läsare veta vilken sorts
    -- nyckel den håller i, och den som en dag vill glömma gamla undantag måste
    -- skriva om veckoschemat för att göra det.
    --
    -- Röda dagar räknas inte fram av oss. Vilka dagar som är röda är enkelt att
    -- slå upp, men vad ETT STÄLLE gör en röd dag är det inte, och att gissa åt
    -- företaget vore att publicera ett påstående vi inte har täckning för. Den
    -- som vill ha avvikande jultider skriver in dem.
    opening_hours_exceptions jsonb,

    phone               text check (phone is null or length(btrim(phone)) between 5 and 30),
    website             text check (website is null or website ~* '^https?://[^[:space:]]{4,200}$'),
    booking_url         text check (booking_url is null or booking_url ~* '^https?://[^[:space:]]{4,200}$'),

    status              community.moderation_status not null default 'pending',
    moderated_at        timestamptz,
    moderated_by        text,
    rejection_reason    text,
    published_at        timestamptz,

    created_at          timestamptz not null default now(),

    -- En tom insändning är inget att granska.
    constraint profile_not_empty check (
        presentation is not null
        or opening_hours is not null
        or opening_hours_exceptions is not null
        or phone is not null
        or website is not null
        or booking_url is not null
    )
);


-- Tillägg för en databas där tabellen redan finns.
--
-- `create table if not exists` ovan är sanningen för en ny installation och gör
-- ingenting alls för en som redan körts. Kolumnen och villkoret måste därför
-- sättas en gång till, på en form som tål att köras om.
alter table community.business_profiles
    add column if not exists opening_hours_exceptions jsonb;

alter table community.business_profiles
    drop constraint if exists profile_not_empty;

alter table community.business_profiles
    add constraint profile_not_empty check (
        presentation is not null
        or opening_hours is not null
        or opening_hours_exceptions is not null
        or phone is not null
        or website is not null
        or booking_url is not null
    );

-- En obehandlad insändning per företrädare och verksamhet. Utan den här kan
-- en rastlös företagare lägga tjugo rader i kön medan hen finslipar en text,
-- och redaktionen får granska nitton inaktuella.
create unique index if not exists business_profiles_one_pending_idx
    on community.business_profiles (establishment_id, user_id)
    where status = 'pending';

-- Läsningen som sidan gör: senast publicerade raden för en verksamhet.
create index if not exists business_profiles_published_idx
    on community.business_profiles (establishment_id, published_at desc)
    where status = 'published';

create index if not exists business_profiles_pending_idx
    on community.business_profiles (created_at) where status = 'pending';


-- ---------------------------------------------------------------------------
-- Kontroll av insändningen
--
-- Sitter som trigger och inte som check-villkor, av två skäl: formen på
-- öppettiderna går inte att uttrycka begripligt i ett check-villkor, och en
-- trigger kan säga vad som är fel på svenska. Klienten skickar felet vidare
-- ordagrant (translate() i community.ts släpper igenom okänd text).
--
-- Triggern nollställer också moderationsfälten vid insert. Radsäkerheten
-- säger samma sak, men en policy kan bytas ut och en trigger gäller även för
-- service_role. Det är samma ordning som community.set_image_status().
-- ---------------------------------------------------------------------------
create or replace function community.check_profile()
returns trigger language plpgsql
set search_path = ''
as $$
declare
    dag    text;
    varde  jsonb;
    dagar  text[] := array['mon','tue','wed','thu','fri','sat','sun'];
    antal  integer;
begin
    if tg_op = 'INSERT' then
        new.status         := 'pending';
        new.moderated_at   := null;
        new.moderated_by   := null;
        new.published_at   := null;
        new.rejection_reason := null;
    end if;

    if new.opening_hours is not null then
        if jsonb_typeof(new.opening_hours) <> 'object' then
            raise exception 'Öppettiderna har fel form.';
        end if;

        for dag, varde in select * from jsonb_each(new.opening_hours) loop
            if not (dag = any(dagar)) then
                raise exception 'Okänd veckodag i öppettiderna: %', dag;
            end if;
            if jsonb_typeof(varde) <> 'object' then
                raise exception 'Öppettiden för % har fel form.', dag;
            end if;
            -- Antingen stängt, eller ett par klockslag på formen HH:MM.
            if coalesce((varde ->> 'closed')::boolean, false) then
                continue;
            end if;
            if (varde ->> 'from') !~ '^[0-2][0-9]:[0-5][0-9]$'
               or (varde ->> 'to') !~ '^[0-2][0-9]:[0-5][0-9]$' then
                raise exception 'Öppettiden för % måste vara två klockslag, till exempel 11:00 och 22:00.', dag;
            end if;
        end loop;
    end if;

    -- Avvikande datum. Samma form på värdet som en veckodag har, plus en
    -- frivillig etikett. Nyckeln är ett datum och inte en veckodag.
    if new.opening_hours_exceptions is not null then
        if jsonb_typeof(new.opening_hours_exceptions) <> 'object' then
            raise exception 'De avvikande tiderna har fel form.';
        end if;

        -- Ett tak, så att kolumnen inte blir en almanacka. Fyrtio datum räcker
        -- till alla röda dagar på ett år och några semesterveckor därtill.
        select count(*) into antal
        from jsonb_object_keys(new.opening_hours_exceptions);
        if antal > 40 then
            raise exception 'Högst 40 avvikande datum åt gången.';
        end if;

        for dag, varde in select * from jsonb_each(new.opening_hours_exceptions) loop
            if dag !~ '^\d{4}-\d{2}-\d{2}$' then
                raise exception 'Avvikande tider anges per datum på formen 2026-12-24, inte %.', dag;
            end if;
            -- Formen kan stämma utan att dagen finns. 2026-02-30 fastnar här.
            begin
                perform dag::date;
            exception when others then
                raise exception 'Datumet % finns inte.', dag;
            end;

            if jsonb_typeof(varde) <> 'object' then
                raise exception 'Den avvikande tiden för % har fel form.', dag;
            end if;
            if (varde ->> 'label') is not null
               and length(btrim(varde ->> 'label')) > 40 then
                raise exception 'Namnet på dagen % får vara högst 40 tecken.', dag;
            end if;
            if coalesce((varde ->> 'closed')::boolean, false) then
                continue;
            end if;
            if (varde ->> 'from') !~ '^[0-2][0-9]:[0-5][0-9]$'
               or (varde ->> 'to') !~ '^[0-2][0-9]:[0-5][0-9]$' then
                raise exception 'Den avvikande tiden för % måste vara två klockslag eller stängt.', dag;
            end if;
        end loop;
    end if;

    return new;
end;
$$;

drop trigger if exists business_profiles_checked on community.business_profiles;
create trigger business_profiles_checked
    before insert on community.business_profiles
    for each row execute function community.check_profile();


-- ---------------------------------------------------------------------------
-- Innehållet fryses efter insändning
--
-- Samma löfte som community.freeze_body() ger på svar och omdömen: redaktionen
-- kan publicera eller avslå, aldrig ändra. Gäller även service_role, för en
-- trigger är inte en behörighet.
-- ---------------------------------------------------------------------------
create or replace function community.freeze_profile()
returns trigger language plpgsql
set search_path = ''
as $$
begin
    if new.presentation  is distinct from old.presentation
       or new.opening_hours is distinct from old.opening_hours
       or new.opening_hours_exceptions is distinct from old.opening_hours_exceptions
       or new.phone       is distinct from old.phone
       or new.website     is distinct from old.website
       or new.booking_url is distinct from old.booking_url then
        raise exception
            'Uppgifterna är frusna efter insändning. Publicera eller avslå, ändra aldrig. (%.%)',
            tg_table_schema, tg_table_name;
    end if;
    return new;
end;
$$;

drop trigger if exists business_profiles_frozen on community.business_profiles;
create trigger business_profiles_frozen
    before update on community.business_profiles
    for each row execute function community.freeze_profile();


-- ---------------------------------------------------------------------------
-- Vad sidan läser
--
-- En rad per verksamhet: den senast publicerade insändningen. distinct on
-- kräver att order by börjar med samma uttryck.
--
-- security_invoker så att vyn läser med frågeställarens rättigheter och inte
-- med sina egna. Utan det hade vyn varit en väg runt radsäkerheten.
-- ---------------------------------------------------------------------------
-- DROP före CREATE, inte "create or replace".
--
-- Postgres vägrar byta namn eller ordning på en befintlig vys kolumner med
-- create or replace, och svarar då "cannot change name of view column". Det
-- slog till när presentationen fick fältet opening_hours_exceptions: kolumnen
-- lades in mitt i listan, och alla kolumner efter den förskjöts.
--
-- Filen ska gå att köra om hur många gånger som helst, också efter att vyn
-- ändrat form. Ett drop är ofarligt här: vyn bär ingen egen data, den läses
-- av sajten i webbläsaren och byggs om i samma transaktion.
drop view if exists community.published_profiles;
create view community.published_profiles
with (security_invoker = true) as
select distinct on (establishment_id)
    establishment_id,
    municipality_slug,
    presentation,
    opening_hours,
    opening_hours_exceptions,
    phone,
    website,
    booking_url,
    published_at
from community.business_profiles
where status = 'published'
order by establishment_id, published_at desc;


-- ---------------------------------------------------------------------------
-- Radsäkerhet
--
-- Skriva: bara den som har ett GODKÄNT anspråk på verksamheten. Samma spärr
-- som owner_responses_insert, och den sitter här och inte i sidmallen: en
-- regel i en sidmall är ett löfte, en policy är en spärr.
-- ---------------------------------------------------------------------------
alter table community.business_profiles enable row level security;

drop policy if exists business_profiles_insert on community.business_profiles;
create policy business_profiles_insert on community.business_profiles
    for insert to authenticated
    with check (
        user_id = auth.uid()
        and status = 'pending'
        and moderated_at is null
        and published_at is null
        and exists (
            select 1 from community.establishment_claims c
            where c.user_id = auth.uid()
              and c.establishment_id = business_profiles.establishment_id
              and c.status = 'published'
        )
    );

drop policy if exists business_profiles_read_own on community.business_profiles;
create policy business_profiles_read_own on community.business_profiles
    for select to authenticated
    using (user_id = auth.uid());

-- Publicerade uppgifter är till för att visas. Läses av utloggade också.
drop policy if exists business_profiles_read_published on community.business_profiles;
create policy business_profiles_read_published on community.business_profiles
    for select to anon, authenticated
    using (status = 'published');

-- Ångra en insändning som ingen hunnit titta på. Aldrig en publicerad, och
-- aldrig någon annans.
drop policy if exists business_profiles_delete_pending on community.business_profiles;
create policy business_profiles_delete_pending on community.business_profiles
    for delete to authenticated
    using (user_id = auth.uid() and status = 'pending');

grant select, insert, delete on community.business_profiles to authenticated;
grant select                 on community.business_profiles to anon;
grant select                 on community.published_profiles to anon, authenticated, service_role;
grant select, insert, update, delete on community.business_profiles to service_role;

-- Ingen update för någon inloggad. Redaktionen publicerar med service_role,
-- och frystriggern håller även den från att ändra i texten.
revoke update on community.business_profiles from anon, authenticated;


-- ===========================================================================
-- Företagets egna bilder
--
-- EN ANNAN SORTS BILD ÄN BESÖKARNAS, OCH DÄRFÖR EN ANNAN TABELL.
--
-- community.image_uploads är besökarens. Dess insert-policy stänger uttryckligen
-- ute den som har ett godkänt anspråk, och den spärren ska stå kvar precis som
-- den är: den som driver stället ska inte kunna lägga sina reklambilder i
-- gästernas flöde. Den här tabellen är spegelbilden. Här krävs ett godkänt
-- anspråk, och den som inte har ett kommer inte in.
--
-- De två flödena delar ingenting utom lagringsutrymmet. Bilderna hamnar i samma
-- två bucketar, under en egen mapp 'foretag/', med egna policyer som inte rör
-- besökarnas. Skälet att inte skapa två bucketar till är att en bucket inte är
-- en avgränsning här: åtkomsten avgörs av mappen och av raden som pekar på
-- filen, och båda är åtskilda redan.
--
-- VAD BILDERNA ALDRIG FÅR VARA: en kommentar till en kontroll. En bild på ett
-- rent kök säger ingenting om vad inspektören fann, och den ligger på sin egen
-- plats på sidan, långt under kontrollberättelsen. Vägen att kommentera en
-- kontroll är fortfarande community.owner_responses och ingen annan.
-- ===========================================================================
create table if not exists community.business_images (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references auth.users (id) on delete cascade,
    establishment_id    text not null check (community.is_establishment_id(establishment_id)),
    municipality_slug   text not null,

    storage_path        text not null unique,

    -- HEIC OCH HEIF TAS EMOT HÄR, men aldrig i den publika hinken. Formatet är
    -- förvalt på varje iPhone sedan 2017, och en krögare fotograferar sin egen
    -- matsal med samma telefon som gästerna. Konverteringen till JPEG sker i
    -- pipeline/moderate.py före publicering. Samma lista som image_uploads.
    content_type        text not null check (content_type in (
                            'image/jpeg', 'image/png', 'image/webp',
                            'image/heic', 'image/heif',
                            'image/heic-sequence', 'image/heif-sequence')),

    -- Tolv megabyte och inte åtta: en HEIC kan sällan komprimeras i
    -- webbläsaren, eftersom Chrome och Firefox inte kan avkoda den.
    byte_size           integer not null check (byte_size between 1 and 12582912),

    -- Bildtexten är frivillig och beskriver bilden, ingenting annat.
    caption             text check (caption is null or length(btrim(caption)) between 1 and 120),

    -- Samma försäkran som besökaren lämnar: att bilden är ens egen att ge bort.
    -- Ett företag som lägger upp fotografens bild utan avtal är fotografens
    -- motpart och inte vår, men frågan ska vara ställd och svaret sparat.
    rights_confirmed    boolean not null default false,

    status              community.moderation_status not null default 'pending',
    moderated_at        timestamptz,
    moderated_by        text,
    rejection_reason    text,
    published_url       text,

    -- Ordningen bilderna visas i. Företaget bestämmer vilken bild som är
    -- först, för det är den enda som syns i en smal spalt.
    sort_order          smallint not null default 0 check (sort_order between 0 and 99),

    created_at          timestamptz not null default now()
);

create index if not exists business_images_published_idx
    on community.business_images (establishment_id, sort_order, created_at)
    where status = 'published';

create index if not exists business_images_pending_idx
    on community.business_images (created_at) where status = 'pending';


-- ---------------------------------------------------------------------------
-- Kontroll av en inskickad bild
--
-- Samma ordning som community.set_image_status() på besökarsidan: statusen
-- nollställs, sökvägen måste ligga i uppladdarens egen mapp, och kvoterna
-- räknas här och inte i klienten. En trigger gäller även för service_role.
--
-- Kvoterna är hårda tak och inte nivån. Vad en nivå får ligger i NIVAER i
-- site/src/lib/foretag.ts och är avsiktligt lägre än taket här: nivån är en
-- produktgräns som ska gå att flytta, taket är ett skydd mot att någon fyller
-- lagringen. De två ska aldrig vara samma tal.
-- ---------------------------------------------------------------------------
create or replace function community.check_business_image()
returns trigger language plpgsql
set search_path = ''
as $$
declare
    antal integer;
begin
    new.status         := 'pending';
    new.moderated_at   := null;
    new.moderated_by   := null;
    new.rejection_reason := null;
    new.published_url  := null;

    if not new.rights_confirmed then
        raise exception 'Bekräfta att bilden är er egen att publicera.';
    end if;

    if new.storage_path not like 'foretag/' || new.user_id::text || '/%' then
        raise exception 'Bilden ska laddas upp till er egen mapp.';
    end if;

    -- Per verksamhet. Avslagna räknas inte: den som fått en bild avvisad ska
    -- kunna skicka en annan i stället.
    select count(*) into antal
    from community.business_images
    where establishment_id = new.establishment_id
      and status <> 'rejected';
    if antal >= 24 then
        raise exception 'Verksamheten har redan 24 bilder. Ta bort en innan du lägger till en ny.';
    end if;

    -- Öppna ärenden per konto, så att granskningskön inte går att fylla.
    select count(*) into antal
    from community.business_images
    where user_id = new.user_id and status = 'pending';
    if antal >= 12 then
        raise exception 'Du har 12 bilder som väntar på granskning. Vänta tills de är behandlade.';
    end if;

    return new;
end;
$$;

drop trigger if exists business_images_checked on community.business_images;
create trigger business_images_checked
    before insert on community.business_images
    for each row execute function community.check_business_image();


-- ---------------------------------------------------------------------------
-- Vad sidan läser
-- ---------------------------------------------------------------------------
-- Samma skäl som vid published_profiles ovan: drop före create, så att filen
-- går att köra om även när vyns kolumner ändrat namn eller ordning.
drop view if exists community.published_business_images;
create view community.published_business_images
with (security_invoker = true) as
select
    id,
    establishment_id,
    municipality_slug,
    published_url,
    caption,
    sort_order,
    created_at
from community.business_images
where status = 'published' and published_url is not null;


-- ---------------------------------------------------------------------------
-- Radsäkerhet
--
-- Skriva: bara den som har ett GODKÄNT anspråk. Exakt tvärtom mot
-- image_uploads_insert, och det är avsikten.
-- ---------------------------------------------------------------------------
alter table community.business_images enable row level security;

drop policy if exists business_images_insert on community.business_images;
create policy business_images_insert on community.business_images
    for insert to authenticated
    with check (
        user_id = auth.uid()
        and status = 'pending'
        and moderated_at is null
        and published_url is null
        and exists (
            select 1 from community.establishment_claims c
            where c.user_id = auth.uid()
              and c.establishment_id = business_images.establishment_id
              and c.status = 'published'
        )
    );

drop policy if exists business_images_read_own on community.business_images;
create policy business_images_read_own on community.business_images
    for select to authenticated
    using (user_id = auth.uid());

drop policy if exists business_images_read_published on community.business_images;
create policy business_images_read_published on community.business_images
    for select to anon, authenticated
    using (status = 'published');

-- Att ta bort sin egen bild, också en publicerad.
--
-- Här skiljer sig en bild från en uppgift och från ett svar. Ett svar på en
-- kontroll är ett yttrande och står kvar; en publicerad öppettid ersätts av en
-- ny insändning. En bild är varken: den kan vara fel bild, den kan vara ett
-- ombyggt kök, och den kan vara en bild fotografen ändrat sig om. Det ska gå
-- att ta bort den utan att be någon om lov.
drop policy if exists business_images_delete_own on community.business_images;
create policy business_images_delete_own on community.business_images
    for delete to authenticated
    using (user_id = auth.uid());

grant select, insert, delete on community.business_images to authenticated;
grant select                 on community.business_images to anon;
grant select on community.published_business_images to anon, authenticated, service_role;
grant select, insert, update, delete on community.business_images to service_role;

-- Ingen update för någon inloggad. Sorteringen ändras genom att raden skickas
-- in på nytt, precis som allt annat på företagsytan.
revoke update on community.business_images from anon, authenticated;


-- ---------------------------------------------------------------------------
-- Lagring
--
-- Bucketarna skapas i schema_community.sql och antas finnas. Policyerna här rör
-- BARA mappen 'foretag/' och kan inte nå besökarnas filer. De heter något annat
-- än inkomna_*, för policynamn är unika per tabell och storage.objects är en
-- enda tabell för hela installationen.
-- ---------------------------------------------------------------------------
drop policy if exists "foretag_upload_own" on storage.objects;
create policy "foretag_upload_own" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'verksamhetsbilder-inkomna'
        and (storage.foldername(name))[1] = 'foretag'
        and (storage.foldername(name))[2] = auth.uid()::text
        and exists (
            select 1 from community.business_images b
            where b.user_id = auth.uid()
              and b.storage_path = storage.objects.name
              and b.status = 'pending'
        )
    );

-- Läsning och radering i inkorgen täcks redan av inkomna_read_own och
-- inkomna_delete_own, som bara ser till att andra ledet i sökvägen är ens eget
-- id. De policyerna hör till besökarbilderna och kan skrivas om av den som
-- äger den filen. Företagsytan ska inte gå sönder av det, alltså står samma
-- rätt en gång till här, uttryckligen för mappen 'foretag/'.
drop policy if exists "foretag_inkomna_read_own" on storage.objects;
create policy "foretag_inkomna_read_own" on storage.objects
    for select to authenticated
    using (
        bucket_id = 'verksamhetsbilder-inkomna'
        and (storage.foldername(name))[1] = 'foretag'
        and (storage.foldername(name))[2] = auth.uid()::text
    );

drop policy if exists "foretag_inkomna_delete_own" on storage.objects;
create policy "foretag_inkomna_delete_own" on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'verksamhetsbilder-inkomna'
        and (storage.foldername(name))[1] = 'foretag'
        and (storage.foldername(name))[2] = auth.uid()::text
    );

-- Den publicerade kopian ligger under samma sökväg i den publika bucketen.
-- Besökarbildernas publika kopia ligger under '<user_id>/', alltså kan de två
-- aldrig peka på samma nyckel.
drop policy if exists "foretag_publika_delete_own" on storage.objects;
create policy "foretag_publika_delete_own" on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'verksamhetsbilder'
        and (storage.foldername(name))[1] = 'foretag'
        and (storage.foldername(name))[2] = auth.uid()::text
    );


-- ===========================================================================
-- Granskningen i webbläsaren
--
-- Företagsytan granskas genom SAMMA flöde som allt annat användarinnehåll, och
-- inte genom ett eget. Behörigheten, admin-tabellen och hjälpfunktionerna bor i
-- pipeline/schema_admin.sql; här står bara de två besluten som är den här
-- filens, byggda på exakt samma form.
--
-- Varför funktioner och inte `grant update`: se den långa förklaringen överst i
-- schema_admin.sql. Kortversionen är att `revoke update` längre upp i den här
-- filen ska fortsätta vara sann ordagrant, och att en namngiven funktion per
-- beslut är en mycket mindre yta än UPDATE på en hel tabell.
--
-- VAD EN ADMIN INTE KAN HÄRIFRÅN: röra bedömningen, kontrollhistoriken eller
-- utmärkelsen. De ligger i schemat `public` och ingen funktion här tar i dem.
-- ===========================================================================

-- En admin ser kön, alltså andras VÄNTANDE rader. Aldrig mer än så: en
-- publicerad uppgift är redan läsbar för alla, och en avslagen angår bara den
-- som skickade in den. Samma villkor som image_uploads_read_admin.
drop policy if exists business_profiles_read_admin on community.business_profiles;
create policy business_profiles_read_admin on community.business_profiles
    for select to authenticated
    using (community.is_admin() and status = 'pending');

drop policy if exists business_images_read_admin on community.business_images;
create policy business_images_read_admin on community.business_images
    for select to authenticated
    using (community.is_admin() and status = 'pending');


-- ---------------------------------------------------------------------------
-- Beslut om inskickade uppgifter
--
-- Ingen fil att städa, alltså returneras ingenting. Texten kan inte ha ändrats
-- på vägen: freeze_profile() fäller varje försök att skriva om den efter
-- insändning, även med service_role.
-- ---------------------------------------------------------------------------
create or replace function community.moderate_business_profile(
    target_id uuid,
    decision  text,
    reason    text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    rad   community.business_profiles%rowtype;
    stamp timestamptz := now();
    who   text        := community.admin_actor();
    skal  text        := nullif(btrim(coalesce(reason, '')), '');
begin
    perform community.require_admin();

    if decision not in ('publish', 'reject') then
        raise exception 'Beslutet måste vara publish eller reject, inte %.', decision
            using errcode = 'check_violation';
    end if;

    select * into rad from community.business_profiles b where b.id = target_id;
    if not found then
        raise exception 'Insändningen finns inte längre.' using errcode = 'no_data_found';
    end if;

    if decision = 'publish' then
        if rad.status <> 'pending' then
            raise exception 'Insändningen är redan %, inte pending.', rad.status
                using errcode = 'check_violation';
        end if;

        -- Spärren står i insert-policyn också, men den prövades när raden
        -- skrevs. Ett anspråk som dragits tillbaka DÄREFTER ska inte kunna
        -- publiceras av att någon råkar fatta beslutet i fel ordning.
        if not exists (
            select 1 from community.establishment_claims c
            where c.user_id = rad.user_id
              and c.establishment_id = rad.establishment_id
              and c.status = 'published'
        ) then
            raise exception
                'Den som skickade in har inget godkänt anspråk på verksamheten.'
                using errcode = 'check_violation';
        end if;

        update community.business_profiles b
           set status           = 'published',
               moderated_at     = stamp,
               moderated_by     = who,
               published_at     = stamp,
               rejection_reason = null
         where b.id = target_id;
        return;
    end if;

    if skal is null then
        raise exception 'Ett avslag måste bära ett skäl. Skälet visas för den som skickade in.'
            using errcode = 'check_violation';
    end if;
    if rad.status = 'rejected' then
        raise exception 'Insändningen är redan avslagen.' using errcode = 'check_violation';
    end if;

    update community.business_profiles b
       set status           = 'rejected',
           moderated_at     = stamp,
           moderated_by     = who,
           rejection_reason = skal
     where b.id = target_id;
end;
$$;


-- ---------------------------------------------------------------------------
-- Beslut om en av företagets bilder
--
-- Samma form som community.moderate_image(): klienten kopierar filen till den
-- publika hinken, konverterar en HEIC på vägen, och skickar hit adressen den
-- fick. Adressen prövas mot radens egen stam, så att en betrodd part ändå inte
-- kan skriva vilken sträng som helst i en kolumn som blir en publik bildadress.
--
-- Ett avslag returnerar filerna att radera, precis som moderate_image().
-- ---------------------------------------------------------------------------
create or replace function community.moderate_business_image(
    target_id  uuid,
    decision   text,
    public_url text default null,
    reason     text default null
)
returns table (bucket text, path text)
language plpgsql
security definer
set search_path = ''
as $$
declare
    rad   community.business_images%rowtype;
    stamp timestamptz := now();
    who   text        := community.admin_actor();
    skal  text        := nullif(btrim(coalesce(reason, '')), '');
    stam  text;
begin
    perform community.require_admin();

    if decision not in ('publish', 'reject') then
        raise exception 'Beslutet måste vara publish eller reject, inte %.', decision
            using errcode = 'check_violation';
    end if;

    select * into rad from community.business_images b where b.id = target_id;
    if not found then
        raise exception 'Bilden finns inte längre.' using errcode = 'no_data_found';
    end if;

    if decision = 'publish' then
        if rad.status <> 'pending' then
            raise exception 'Bilden är redan %, inte pending.', rad.status
                using errcode = 'check_violation';
        end if;
        if public_url is null then
            raise exception 'Publicering kräver adressen till den kopierade filen.'
                using errcode = 'check_violation';
        end if;

        if not exists (
            select 1 from community.establishment_claims c
            where c.user_id = rad.user_id
              and c.establishment_id = rad.establishment_id
              and c.status = 'published'
        ) then
            raise exception
                'Den som skickade in har inget godkänt anspråk på verksamheten.'
                using errcode = 'check_violation';
        end if;

        -- Stammen bär uppladdarens id och ett uuid, så villkoret binder
        -- adressen till exakt den här raden. Ändelsen lämnas fri, för en HEIC
        -- blir en .jpg på vägen.
        stam := community.object_stem(rad.storage_path);
        if position('/storage/v1/object/public/verksamhetsbilder/' || stam || '.'
                    in public_url) = 0 then
            raise exception 'Adressen pekar inte på den här bildens fil.'
                using errcode = 'check_violation';
        end if;

        update community.business_images b
           set status           = 'published',
               published_url    = public_url,
               moderated_at     = stamp,
               moderated_by     = who,
               rejection_reason = null
         where b.id = target_id;
        return;
    end if;

    if skal is null then
        raise exception 'Ett avslag måste bära ett skäl. Skälet visas för den som skickade in.'
            using errcode = 'check_violation';
    end if;
    if rad.status = 'rejected' then
        raise exception 'Bilden är redan avslagen.' using errcode = 'check_violation';
    end if;

    update community.business_images b
       set status           = 'rejected',
           moderated_at     = stamp,
           moderated_by     = who,
           rejection_reason = skal
     where b.id = target_id;

    -- Ett avslag raderar filen. Har bilden varit publicerad finns en kopia i
    -- den publika hinken också, och den är den enda av de två någon utomstående
    -- kan nå.
    return query
    select v.hink, v.vag
      from (values ('verksamhetsbilder-inkomna'::text, rad.storage_path),
                   ('verksamhetsbilder'::text, community.public_object_path(rad.published_url))
           ) as v(hink, vag)
     where v.vag is not null;
end;
$$;


revoke execute on function community.moderate_business_profile(uuid, text, text) from public;
revoke execute on function community.moderate_business_image(uuid, text, text, text) from public;

grant execute on function community.moderate_business_profile(uuid, text, text) to authenticated;
grant execute on function community.moderate_business_image(uuid, text, text, text) to authenticated;
grant execute on function community.moderate_business_profile(uuid, text, text) to service_role;
grant execute on function community.moderate_business_image(uuid, text, text, text) to service_role;
