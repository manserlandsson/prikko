-- Prikko, redaktionens behörighet (Supabase/Postgres)
--
-- Kör detta EFTER schema.sql och schema_community.sql. Idempotent: kan köras om.
--
-- ---------------------------------------------------------------------------
-- VAD FILEN LÖSER
-- ---------------------------------------------------------------------------
-- Granskningen har hittills bara funnits i terminalen, i pipeline/moderate.py,
-- som kör med service_role och därför går förbi radsäkerheten helt. Ägaren vill
-- kunna granska i webbläsaren i stället. Skillnaden är inte kosmetisk:
--
--   Terminalen bär en nyckel som går förbi ALLT. Den ligger i ~/.prikko-env på
--     en maskin och kommer aldrig i närheten av en webbläsare.
--   Webbläsaren bär anon-nyckeln, som ligger öppet i varje byggd HTML-fil.
--     Sajten är statiskt genererad, alltså finns det INGEN server hos oss som
--     kan skydda något. Varje spärr måste stå i databasen.
--
-- Därför bygger den här filen behörigheten som data och inte som kod:
--
--   1. community.admins        vem redaktionen är. Skrivbar BARA av service_role.
--   2. community.is_admin()    frågan policyerna ställer. Ett ställe, inte tjugo.
--   3. Läspolicyer             en admin får se kön, alltså andras väntande rader.
--   4. Beslutsfunktioner       den ENDA vägen från pending till published.
--
-- ---------------------------------------------------------------------------
-- VARFÖR FUNKTIONER OCH INTE `grant update`
-- ---------------------------------------------------------------------------
-- schema_community.sql avslutar med raderna
--
--     revoke update on community.reviews from anon, authenticated;
--
-- och kommentaren över dem säger att de är det som gör att `pending` inte kan
-- bli `published` utan att en människa kört verktyget. Det påståendet ska
-- fortsätta vara sant ordagrant, för det är formuleringen som beskriver
-- åtskillnaden mot en myndighet.
--
-- Alternativet hade varit att ge `authenticated` UPDATE och låta en policy
-- avgöra vem som får använda den. Det ger samma spärr på pappret och en mycket
-- större yta i praktiken: med UPDATE på tabellen kan varje kolumn skrivas i
-- varje kombination, och det som skyddar `status` blir ett villkor i en policy
-- som ingen läser om. Med funktioner nedan är ytan fyra namngivna beslut med
-- var sitt argument, och `revoke update` står kvar orörd.
--
-- Funktionerna är `security definer` och gör därför sin egen behörighetsprövning
-- på FÖRSTA raden. Den som inte står i community.admins får 42501 och ingenting
-- annat. Sökvägen är pinnad i var och en, vilket är det som gör en
-- definer-funktion ofarlig.
--
-- ---------------------------------------------------------------------------
-- VAD EN ADMIN INTE KAN, OCH ALDRIG SKA KUNNA
-- ---------------------------------------------------------------------------
-- Hygienbedömningen, kontrollhistoriken och utmärkelsen kommer från kommunernas
-- egna kontroller. De ligger i schemat `public`, de skrivs uteslutande av
-- pipelinen med service_role, och INGEN funktion i den här filen rör dem. En
-- admin kan alltså inte ändra en bedömning, inte lägga till en kontroll och inte
-- flytta en utmärkelse. Det är hela sajtens integritet, och den ska inte hänga
-- på att någon låter bli.
--
-- Verksamhetens svar är gränsfallet och löses utan att göra hål i muren: när ett
-- svar godkänns här sätts `status = 'published'` men `published_at` lämnas NULL,
-- och texten skrivs till public.inspections.owner_comment först av
-- `python3 pipeline/moderate.py synka`, som kör med service_role. Kolumnen är
-- redan beskriven så i schema_community.sql: "Satt när texten faktiskt skrivits
-- till public.inspections.owner_comment. Skiljt från moderated_at eftersom
-- bygget kan ligga efter beslutet."
--
-- ---------------------------------------------------------------------------
-- ÄGARENS MANUELLA STEG EFTER KÖRNING
-- ---------------------------------------------------------------------------
-- Filen skapar tabellen men INGEN admin. Kör raden nedan för att ge en adress
-- behörighet, och kör den igen med en annan adress när det blir fler:
--
--     insert into community.admins (user_id, email)
--     select id, email from auth.users
--      where lower(email) = lower('mans.erlandsson1@gmail.com')
--     on conflict (user_id) do nothing;
--
-- Att ta bort en admin är samma sak baklänges, och verkar direkt:
--
--     delete from community.admins
--      where lower(email) = lower('nagon@example.com');
--
-- Kontot måste ha loggat in minst en gång, annars finns ingen rad i auth.users
-- och insert-satsen träffar noll rader utan att säga något. Kontrollera med:
--
--     select a.email, a.added_at from community.admins a;

-- ---------------------------------------------------------------------------
-- Vem redaktionen är
-- ---------------------------------------------------------------------------
-- EN TABELL OCH INTE `user_metadata`. Skillnaden är avgörande och lätt att
-- missa: `user_metadata` skriver användaren själv genom GoTrue, alltså kan vem
-- som helst med ett konto sätta `admin: true` på sig själv. `app_metadata` går
-- inte att ändra utifrån och hade varit försvarbart, men det bor i en token som
-- lever en timme: en indragen behörighet gäller då inte förrän token förnyas.
--
-- En rad i en tabell har ingen sådan fördröjning, den går att läsa i en fråga
-- när något ser konstigt ut, och den är skrivbar bara av service_role, alltså
-- bara från maskinen som redan har nyckeln som går förbi allt.
create table if not exists community.admins (
    user_id  uuid primary key references auth.users (id) on delete cascade,

    -- Adressen sparas MED raden, som en läsbar etikett. Den är inte
    -- behörigheten: det är `user_id` som prövas, och en admin som byter adress i
    -- auth.users behåller sin behörighet men får en inaktuell etikett här. Det
    -- är rätt riktning att glida åt, för alternativet är att prövningen sker på
    -- en sträng som kan ändras.
    email    text not null,

    -- Varför raden finns. Fritext, för en behörighetstabell utan anteckning blir
    -- efter ett år en lista med uuid:n ingen vågar röra.
    note     text,

    added_at timestamptz not null default now()
);

comment on table community.admins is
    'Redaktionen. Skrivs bara av service_role. Läses av community.is_admin().';

-- Radsäkerhet PÅ och noll policyer, alltså osynlig för varje inloggad roll.
-- service_role går förbi radsäkerheten och är den enda som har rättigheter
-- längre ner. Tabellen ligger i ett exponerat schema, så den syns som en
-- endpoint i PostgREST; utan grant svarar den 401 och det är rätt förvalt läge.
alter table community.admins enable row level security;

revoke all on community.admins from anon, authenticated;
grant select, insert, update, delete on community.admins to service_role;

-- ---------------------------------------------------------------------------
-- Frågan varje policy ställer
-- ---------------------------------------------------------------------------
-- `security definer` därför att `authenticated` varken har eller ska ha läsrätt
-- på tabellen ovan. Funktionen svarar ja eller nej och lämnar aldrig ut listan.
--
-- Anon får `auth.uid() is null` och därmed alltid falskt. Det är avsiktligt
-- utskrivet i formen: villkoret är en likhet mot en kolumn, och en likhet mot
-- null ger aldrig en träff.
create or replace function community.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1 from community.admins a where a.user_id = auth.uid()
    );
$$;

comment on function community.is_admin() is
    'Sant för ett konto i community.admins. Anropas av policyer och av beslutsfunktionerna.';

-- Vem som fattade beslutet, som text.
--
-- Går till kolumnen `moderated_by`. Den bar fram till 2026-08-31 också
-- 'automatik: betyg utan text' för de rader en trigger släppte fram. Den
-- automatiken är stängd, se schema_community.sql, så varje nytt värde i
-- kolumnen är en människa. Adressen ur token är det närmaste ett namn vi har,
-- och faller den tillbaka på uuid:t är raden fortfarande spårbar, vilket är
-- hela kravet.
--
-- INTE definer. Funktionen läser bara anroparens egen token.
create or replace function community.admin_actor()
returns text
language sql
stable
set search_path = ''
as $$
    select coalesce(nullif(auth.jwt() ->> 'email', ''), auth.uid()::text, 'redaktionen');
$$;

-- Spärren, som en rad i varje beslutsfunktion.
--
-- Skriven en gång och anropad fem gånger, av samma skäl som is_admin() finns:
-- ett villkor som upprepas är ett villkor som en dag bara ändras på fyra av fem
-- ställen.
create or replace function community.require_admin()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
    if not community.is_admin() then
        raise exception 'Du har inte behörighet att granska.'
            using errcode = 'insufficient_privilege';
    end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Sökvägar i lagringen
-- ---------------------------------------------------------------------------
-- Två små funktioner som räknar om en sökväg, och som finns för att både en
-- policy och en beslutsfunktion ska räkna på exakt samma sätt.

-- Filens namn utan mapp och utan ändelse.
--
-- Inkorgen lagrar 'pending/<user_id>/<uuid>.<ext>' och den publika hinken
-- '<user_id>/<uuid>.<ext>'. En HEIC BYTER ändelse när den konverteras före
-- publicering, alltså är stammen det enda som är gemensamt för originalet och
-- kopian. Den bär användarens id och ett uuid, så den kan inte peka på någon
-- annans fil.
create or replace function community.object_stem(object_path text)
returns text
language sql
immutable
set search_path = ''
as $$
    select regexp_replace(regexp_replace(object_path, '^pending/', ''), '\.[^./]+$', '');
$$;

-- Sökvägen i den publika hinken, uträknad ur den publicerade adressen.
--
-- GISSAS ALDRIG ur storage_path, av samma skäl som står i moderate.py: en HEIC
-- heter något annat i den publika hinken än i inkorgen, och den gamla
-- uträkningen letade efter en .heic som aldrig funnits där.
create or replace function community.public_object_path(url text)
returns text
language sql
immutable
set search_path = ''
as $$
    select case
        when url is null then null
        when position('/public/verksamhetsbilder/' in url) = 0 then null
        else substring(url from position('/public/verksamhetsbilder/' in url)
                                + length('/public/verksamhetsbilder/'))
    end;
$$;

-- ---------------------------------------------------------------------------
-- Läsning: en admin ser kön
-- ---------------------------------------------------------------------------
-- Fyra policyer som läggs till de befintliga. Policyer läggs ihop med ELLER, så
-- de här raderna kan bara VIDGA vad en admin ser, aldrig smalna av vad någon
-- annan ser: villkoret är falskt för varje konto som inte står i tabellen.
--
-- `status = 'pending'` STÅR MED AV ETT SKÄL, och skälet är den där ELLER:en.
--
-- Kön är allt granskningen behöver se. En policy utan statusvillkoret hade gett
-- en admin hela tabellen, och konsekvensen syns inte på granskningssidan utan i
-- kod någon annan skrivit: varje fråga i klienten som saknar eget filter börjar
-- då svara med andras rader så fort ägaren är inloggad. Ett verkligt exempel
-- fanns när det här skrevs, tierFor() i site/src/lib/foretag.ts frågar
-- establishment_claims på `status = 'published'` utan ägarfilter, och hade med
-- en bredare policy plockat upp någon annans godkända anspråk.
--
-- VARNING TILL KLIENTSKRIVAREN. Samma varning står redan vid
-- reviews_read_published i schema_community.sql, och den är skarpare nu: en
-- fråga utan eget filter ger tillbaka allt policyerna tillåter, och för en admin
-- är det numera också hela kön. "Mina omdömen" måste fortsätta gå genom
-- ownRows() i site/src/lib/community.ts. Testet
-- pipeline/tests/test_egna_rader.py är snubbeltråden.
drop policy if exists reviews_read_admin on community.reviews;
create policy reviews_read_admin on community.reviews
    for select to authenticated
    using (community.is_admin() and status = 'pending');

drop policy if exists image_uploads_read_admin on community.image_uploads;
create policy image_uploads_read_admin on community.image_uploads
    for select to authenticated
    using (community.is_admin() and status = 'pending');

drop policy if exists owner_responses_read_admin on community.owner_responses;
create policy owner_responses_read_admin on community.owner_responses
    for select to authenticated
    using (community.is_admin() and status = 'pending');

drop policy if exists claims_read_admin on community.establishment_claims;
create policy claims_read_admin on community.establishment_claims
    for select to authenticated
    using (community.is_admin() and status = 'pending');

-- INGEN läspolicy på community.profiles, follows, notices eller notice_reads.
-- Granskningen behöver dem inte. En behörighet som inte behövs för uppgiften
-- ska inte finnas, och den som en dag behöver läsa en profil har service_role.

-- ---------------------------------------------------------------------------
-- Besluten
-- ---------------------------------------------------------------------------
-- Fyra funktioner, en per sort, med samma form:
--
--   perform community.require_admin()  först av allt, alltid.
--   decision är 'publish' eller 'reject', aldrig något annat.
--   Ett avslag KRÄVER ett skäl. Skälet visas för den som skickade in, på hens
--     egen kontosida, precis som moderate.py lovar.
--   moderated_by bär den inloggade adminen, aldrig en konstant.
--
-- De två som rör bilder returnerar de filer som ska raderas ur lagringen, som
-- (hink, sökväg). Databasen kan inte ta bort en fil: storage.objects är
-- metadata, och den riktiga filen ligger bakom lagrings-API:t. Klienten gör
-- raderingen och har policyerna längst ner för det.
--
-- ORDNINGEN ÄR RADEN FÖRST OCH FILEN SEDAN, samma som i moderate.py. Faller
-- raderingen ligger en fil kvar som ingen sida kan nå, eftersom en avslagen rad
-- aldrig får en publik adress. Omvänd ordning hade kunnat lämna en rad som ser
-- publicerbar ut men pekar på ingenting.

create or replace function community.moderate_review(
    target_id uuid,
    decision  text,
    reason    text default null
)
returns table (bucket text, path text)
language plpgsql
security definer
set search_path = ''
as $$
declare
    rad   community.reviews%rowtype;
    stamp timestamptz := now();
    who   text        := community.admin_actor();
    skal  text        := nullif(btrim(coalesce(reason, '')), '');
begin
    perform community.require_admin();

    if decision not in ('publish', 'reject') then
        raise exception 'Beslutet måste vara publish eller reject, inte %.', decision
            using errcode = 'check_violation';
    end if;

    select * into rad from community.reviews r where r.id = target_id;
    if not found then
        raise exception 'Omdömet finns inte längre. Författaren kan ha tagit tillbaka det.'
            using errcode = 'no_data_found';
    end if;

    if decision = 'publish' then
        if rad.status <> 'pending' then
            raise exception 'Omdömet är redan %, inte pending.', rad.status
                using errcode = 'check_violation';
        end if;
        -- Texten rörs ALDRIG. Triggern community.freeze_body() fäller varje
        -- försök, även härifrån, och det är avsiktligt: redaktionen kan bara
        -- välja mellan att publicera ordagrant och att inte publicera.
        update community.reviews r
           set status           = 'published',
               moderated_at     = stamp,
               moderated_by     = who,
               rejection_reason = null
         where r.id = target_id;
        return;
    end if;

    if skal is null then
        raise exception 'Ett avslag måste bära ett skäl. Skälet visas för den som skickade in.'
            using errcode = 'check_violation';
    end if;
    if rad.status = 'rejected' then
        raise exception 'Omdömet är redan avslaget.' using errcode = 'check_violation';
    end if;

    update community.reviews r
       set status           = 'rejected',
           moderated_at     = stamp,
           moderated_by     = who,
           rejection_reason = skal
     where r.id = target_id;

    -- Bilderna följer med. Text och bild granskas som en enhet: att avslå en
    -- text men lämna dess bilder i kön är att låta samma insändning prövas två
    -- gånger, och det som fällde texten gäller nästan alltid bilderna med.
    -- Samma regel som cmd_reject() i pipeline/moderate.py.
    return query
    with faller as (
        update community.image_uploads i
           set status           = 'rejected',
               moderated_at     = stamp,
               moderated_by     = who,
               rejection_reason = skal
         where i.review_id = target_id
           and i.status <> 'rejected'
        returning i.storage_path, i.published_url
    )
    select v.hink, v.vag
      from faller f
      cross join lateral (
          values ('verksamhetsbilder-inkomna'::text, f.storage_path),
                 ('verksamhetsbilder'::text, community.public_object_path(f.published_url))
      ) as v(hink, vag)
     where v.vag is not null;
end;
$$;

comment on function community.moderate_review(uuid, text, text) is
    'Publicerar eller avslår ett omdöme. Ett avslag tar bilderna med sig och returnerar filerna som ska raderas.';

create or replace function community.moderate_image(
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
    rad    community.image_uploads%rowtype;
    omdome community.reviews%rowtype;
    stamp  timestamptz := now();
    who    text        := community.admin_actor();
    skal   text        := nullif(btrim(coalesce(reason, '')), '');
    stam   text;
begin
    perform community.require_admin();

    if decision not in ('publish', 'reject') then
        raise exception 'Beslutet måste vara publish eller reject, inte %.', decision
            using errcode = 'check_violation';
    end if;

    select * into rad from community.image_uploads i where i.id = target_id;
    if not found then
        raise exception 'Bilden finns inte längre.' using errcode = 'no_data_found';
    end if;

    if decision = 'publish' then
        if rad.status <> 'pending' then
            raise exception 'Bilden är redan %, inte pending.', rad.status
                using errcode = 'check_violation';
        end if;

        -- Adressen kommer utifrån, alltså prövas den.
        --
        -- Klienten kopierar filen till den publika hinken och skickar hit
        -- adressen den fick. En admin är betrodd, men en betrodd part ska ändå
        -- inte kunna skriva vilken sträng som helst i en kolumn som blir en
        -- publik bildadress. Stammen bär uppladdarens id och ett uuid, så
        -- villkoret nedan binder adressen till exakt den här raden. Ändelsen
        -- lämnas fri, för en HEIC blir en .jpg på vägen.
        if public_url is null then
            raise exception 'Publicering kräver adressen till den kopierade filen.'
                using errcode = 'check_violation';
        end if;
        stam := community.object_stem(rad.storage_path);
        if position('/storage/v1/object/public/verksamhetsbilder/' || stam || '.'
                    in public_url) = 0 then
            raise exception 'Adressen pekar inte på den här bildens fil.'
                using errcode = 'check_violation';
        end if;

        -- Hör bilden till ett omdöme granskas de som en enhet. Samma tre lägen
        -- som cmd_publish() i moderate.py prövar.
        if rad.review_id is not null then
            select * into omdome from community.reviews r where r.id = rad.review_id;
            if not found then
                raise exception 'Bilden pekar på ett omdöme som inte finns kvar. Avslå den i stället.'
                    using errcode = 'check_violation';
            end if;
            if omdome.status = 'rejected' then
                raise exception 'Omdömet bilden hör till är avslaget. Avslå bilden i stället.'
                    using errcode = 'check_violation';
            end if;
        end if;

        update community.image_uploads i
           set status           = 'published',
               published_url    = public_url,
               moderated_at     = stamp,
               moderated_by     = who,
               rejection_reason = null
         where i.id = target_id;
        return;
    end if;

    if skal is null then
        raise exception 'Ett avslag måste bära ett skäl. Skälet visas för den som skickade in.'
            using errcode = 'check_violation';
    end if;
    if rad.status = 'rejected' then
        raise exception 'Bilden är redan avslagen.' using errcode = 'check_violation';
    end if;

    update community.image_uploads i
       set status           = 'rejected',
           moderated_at     = stamp,
           moderated_by     = who,
           rejection_reason = skal
     where i.id = target_id;

    -- ETT AVSLAG RADERAR FILEN, och det är skillnaden mot en text som bara blir
    -- osynlig. Har bilden varit publicerad finns en kopia i den publika hinken
    -- också, och den är den enda av de två någon utomstående kan nå.
    return query
    select v.hink, v.vag
      from (values ('verksamhetsbilder-inkomna'::text, rad.storage_path),
                   ('verksamhetsbilder'::text, community.public_object_path(rad.published_url))
           ) as v(hink, vag)
     where v.vag is not null;
end;
$$;

comment on function community.moderate_image(uuid, text, text, text) is
    'Publicerar eller avslår en bild. Returnerar filerna som ska raderas ur lagringen.';

-- Verksamhetens svar.
--
-- `published_at` lämnas NULL med avsikt. Beslutet är fattat, men texten står
-- inte i den redaktionella databasen förrän `moderate.py synka` skrivit den dit
-- med service_role. Ingen väg från en webbläsare får leda in i schemat `public`.
create or replace function community.moderate_owner_response(
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
    rad   community.owner_responses%rowtype;
    stamp timestamptz := now();
    who   text        := community.admin_actor();
    skal  text        := nullif(btrim(coalesce(reason, '')), '');
begin
    perform community.require_admin();

    if decision not in ('publish', 'reject') then
        raise exception 'Beslutet måste vara publish eller reject, inte %.', decision
            using errcode = 'check_violation';
    end if;

    select * into rad from community.owner_responses o where o.id = target_id;
    if not found then
        raise exception 'Svaret finns inte längre.' using errcode = 'no_data_found';
    end if;
    if rad.status <> 'pending' then
        raise exception 'Svaret är redan %, inte pending.', rad.status
            using errcode = 'check_violation';
    end if;

    if decision = 'publish' then
        update community.owner_responses o
           set status           = 'published',
               moderated_at     = stamp,
               moderated_by     = who,
               rejection_reason = null
         where o.id = target_id;
        return;
    end if;

    if skal is null then
        raise exception 'Ett avslag måste bära ett skäl. Skälet visas för den som skickade in.'
            using errcode = 'check_violation';
    end if;

    update community.owner_responses o
       set status           = 'rejected',
           moderated_at     = stamp,
           moderated_by     = who,
           rejection_reason = skal
     where o.id = target_id;
end;
$$;

comment on function community.moderate_owner_response(uuid, text, text) is
    'Avgör ett svar. Texten skrivs till kontrolldatan först av moderate.py synka.';

-- Anspråk om att företräda en verksamhet.
--
-- Ett godkänt anspråk MÅSTE bära hur det kontrollerades. Villkoret
-- claim_published_requires_method i schema_community.sql fäller annars raden, och
-- kontrollen nedan finns för att felet ska bli en mening på svenska i stället för
-- ett villkorsnamn.
create or replace function community.moderate_claim(
    target_id uuid,
    decision  text,
    method    text default null,
    reason    text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    rad   community.establishment_claims%rowtype;
    stamp timestamptz := now();
    who   text        := community.admin_actor();
    skal  text        := nullif(btrim(coalesce(reason, '')), '');
begin
    perform community.require_admin();

    if decision not in ('publish', 'reject') then
        raise exception 'Beslutet måste vara publish eller reject, inte %.', decision
            using errcode = 'check_violation';
    end if;

    select * into rad from community.establishment_claims c where c.id = target_id;
    if not found then
        raise exception 'Anspråket finns inte längre.' using errcode = 'no_data_found';
    end if;
    if rad.status <> 'pending' then
        raise exception 'Anspråket är redan %, inte pending.', rad.status
            using errcode = 'check_violation';
    end if;

    if decision = 'publish' then
        if method is null or method not in ('register_check', 'postal_code', 'domain_email') then
            raise exception
                'Ett anspråk måste bära hur det kontrollerades: register_check eller postal_code.'
                using errcode = 'check_violation';
        end if;
        update community.establishment_claims c
           set status              = 'published',
               verification_method = method,
               verified_at         = stamp,
               verified_by         = who,
               rejection_reason    = null
         where c.id = target_id;
        return;
    end if;

    if skal is null then
        raise exception 'Ett avslag måste bära ett skäl. Skälet visas för den som skickade in.'
            using errcode = 'check_violation';
    end if;

    update community.establishment_claims c
       set status           = 'rejected',
           verified_by      = who,
           rejection_reason = skal
     where c.id = target_id;
end;
$$;

comment on function community.moderate_claim(uuid, text, text, text) is
    'Godkänner eller avslår ett anspråk. Ett godkännande kräver kontrollmetod.';

-- Efterhandsgranskningen, läsbar i webbläsaren.
--
-- community.rating_signals är avsiktligt stängd för anon och authenticated, och
-- ska förbli det: vyn ser rader ingen annan får se. Funktionen nedan är den enda
-- luckan, den prövar behörigheten på första raden, och den lämnar ut exakt de
-- kolumner vyn redan har.
create or replace function community.admin_signals()
returns table (
    sort    text,
    nyckel  text,
    antal   integer,
    lagsta  integer,
    forsta  timestamptz,
    senaste timestamptz,
    rader   uuid[]
)
language plpgsql
security definer
set search_path = ''
as $$
begin
    perform community.require_admin();
    return query
        select s.sort, s.nyckel, s.antal, s.lagsta, s.forsta, s.senaste, s.rader
          from community.rating_signals s
         order by s.senaste desc;
end;
$$;

comment on function community.admin_signals() is
    'Mönster i publicerade betyg som en rad i taget inte visar. Samma vy som moderate.py signaler.';

-- ---------------------------------------------------------------------------
-- Rättigheter
-- ---------------------------------------------------------------------------
-- Postgres ger som förval EXECUTE till PUBLIC på varje ny funktion. Det förvalet
-- duger inte för sex funktioner varav fem är `security definer`. Raderna nedan
-- stänger först och öppnar sedan för den enda roll som ska nå dem.
--
-- Att `authenticated` får anropa dem är inte ett hål: varje funktion börjar med
-- require_admin(), och den som inte står i tabellen får 42501 utan att något
-- händer. Alternativet, en egen Postgres-roll per admin, hade krävt att
-- inloggningen delade ut databasroller och det gör GoTrue inte.
revoke execute on function community.is_admin()                          from public;
revoke execute on function community.admin_actor()                       from public;
revoke execute on function community.require_admin()                     from public;
revoke execute on function community.object_stem(text)                   from public;
revoke execute on function community.public_object_path(text)            from public;
revoke execute on function community.moderate_review(uuid, text, text)   from public;
revoke execute on function community.moderate_image(uuid, text, text, text) from public;
revoke execute on function community.moderate_owner_response(uuid, text, text) from public;
revoke execute on function community.moderate_claim(uuid, text, text, text)    from public;
revoke execute on function community.admin_signals()                     from public;

grant execute on function community.is_admin()                          to authenticated;
grant execute on function community.admin_actor()                       to authenticated;
grant execute on function community.require_admin()                     to authenticated;
grant execute on function community.object_stem(text)                   to authenticated;
grant execute on function community.public_object_path(text)            to authenticated;
grant execute on function community.moderate_review(uuid, text, text)   to authenticated;
grant execute on function community.moderate_image(uuid, text, text, text) to authenticated;
grant execute on function community.moderate_owner_response(uuid, text, text) to authenticated;
grant execute on function community.moderate_claim(uuid, text, text, text)    to authenticated;
grant execute on function community.admin_signals()                     to authenticated;

-- service_role behöver dem inte, den har redan UPDATE på tabellerna och kör
-- moderate.py. Raderna finns ändå, så att en framtida pipeline kan använda samma
-- beslutsväg i stället för att skriva en egen.
grant execute on function community.is_admin()                          to service_role;
grant execute on function community.object_stem(text)                   to service_role;
grant execute on function community.public_object_path(text)            to service_role;

-- SPÄRREN STÅR KVAR. Raderna nedan upprepar det schema_community.sql redan
-- säger, av samma skäl som den filen upprepar `revoke insert, update, delete on
-- all tables in schema public`: en spärr som bara står i en fil man tror har
-- körts är ingen spärr. Ingen inloggad roll får UPDATE på en modererad tabell,
-- inte ens en admin. Vägen från pending till published går genom funktionerna
-- ovan, och ingen annanstans.
revoke update on community.reviews              from anon, authenticated;
revoke update on community.image_uploads        from anon, authenticated;
revoke update on community.owner_responses      from anon, authenticated;
revoke update on community.establishment_claims from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Lagring: bilderna en admin måste kunna se, kopiera och radera
-- ---------------------------------------------------------------------------
-- Fyra policyer på storage.objects, alla med `community.is_admin()` som villkor
-- och alla vid sidan av de befintliga. De ändrar ingenting för en vanlig
-- besökare: uppladdaren når fortfarande bara sin egen mapp.

-- Se den inkomna bilden. Behövs för att kunna signera en läsbar länk, alltså för
-- att granskaren ska kunna titta på bilden i full storlek. Hinken förblir privat;
-- en signerad länk är en tillfällig nyckel till en fil, inte en öppning av
-- bucketen.
drop policy if exists "inkomna_read_admin" on storage.objects;
create policy "inkomna_read_admin" on storage.objects
    for select to authenticated
    using (bucket_id = 'verksamhetsbilder-inkomna' and community.is_admin());

-- Radera vid avslag, ur inkorgen.
drop policy if exists "inkomna_delete_admin" on storage.objects;
create policy "inkomna_delete_admin" on storage.objects
    for delete to authenticated
    using (bucket_id = 'verksamhetsbilder-inkomna' and community.is_admin());

-- Lägga kopian i den publika hinken vid publicering.
--
-- Villkoret om en väntande rad är inte pynt. Utan det kan en admin skriva vilken
-- fil som helst till en publik adress, och den ytan ska inte finnas: det enda
-- som ska kunna hamna där är en fil som redan ligger i inkorgen och väntar på
-- ett beslut. Stammen är gemensam för de två, se community.object_stem().
drop policy if exists "publika_insert_admin" on storage.objects;
create policy "publika_insert_admin" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'verksamhetsbilder'
        and community.is_admin()
        and exists (
            select 1 from community.image_uploads u
            where u.status = 'pending'
              and community.object_stem(u.storage_path)
                  = community.object_stem(storage.objects.name)
        )
    );

-- Radera vid avslag, ur den publika hinken. Gäller den ovanliga men verkliga
-- vändningen: ett publicerat omdöme avslås i efterhand efter en signal, och
-- bilden som redan ligger på en publik adress måste bort.
drop policy if exists "publika_delete_admin" on storage.objects;
create policy "publika_delete_admin" on storage.objects
    for delete to authenticated
    using (bucket_id = 'verksamhetsbilder' and community.is_admin());

-- EN RADERING KRÄVER OCKSÅ LÄSRÄTT, och det är inte självklart.
--
-- Mätt i produktion: med bara delete-policyn ovan svarade lagrings-API:t
-- "Access denied" på varje försök att ta bort en fil ur den publika hinken.
-- Skälet är att Supabase slår upp objektet innan det tas bort, och den
-- uppslagningen prövas mot select-policyerna. Hinken är publik, men det gäller
-- render-vägen; objekt-API:t går genom radsäkerheten som vanligt.
--
-- Följden var att ett avslag på en redan publicerad bild lämnade kvar filen på
-- en adress vem som helst kunde nå, medan raden sa att bilden var avslagen. Det
-- är exakt den riktningen som aldrig får gå fel.
--
-- Ingen uppgift lämnas ut av den här policyn. Filerna i hinken är publika, och
-- det enda den ger är rätten att slå upp något som redan är läsbart för alla.
drop policy if exists "publika_read_admin" on storage.objects;
create policy "publika_read_admin" on storage.objects
    for select to authenticated
    using (bucket_id = 'verksamhetsbilder' and community.is_admin());

-- ---------------------------------------------------------------------------
-- Exponering mot API:t
-- ---------------------------------------------------------------------------
-- Funktionerna når PostgREST som /rest/v1/rpc/<namn> i schemat community. Nya
-- funktioner syns inte förrän schemacachen laddats om.
notify pgrst, 'reload schema';
