-- ===========================================================================
-- Företagsytan: vad en godkänd företrädare får fylla på med
--
-- Körs EFTER schema_community.sql. Filen är avsiktligt skild från den, för
-- två skäl som båda är praktiska:
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
    opening_hours       jsonb,

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
        or phone is not null
        or website is not null
        or booking_url is not null
    )
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
create or replace view community.published_profiles
with (security_invoker = true) as
select distinct on (establishment_id)
    establishment_id,
    municipality_slug,
    presentation,
    opening_hours,
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
