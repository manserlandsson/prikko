-- Prikko — datamodell (Supabase/Postgres)
--
-- Speglar de källformat vi faktiskt mött, normaliserat till en gemensam
-- modell. Se research/R1_sambruk_datamodell.md och R2_linkoping_api_verifierad.md.
--
-- Designprinciper:
--   * Rådata och härledda värden hålls isär. `inspections` är vad kommunen
--     sagt; `assessments` är vad vi räknat fram. Blandas de går ett publicerat
--     omdöme inte längre att härleda i efterhand.
--   * Varje rad bär sin källa och hämttidpunkt. "Senast uppdaterad" är en
--     dokumenterad AEO-signal och måste kunna visas per sida.
--   * Koordinater lagras som explicita lat/lng i WGS84. Källorna levererar
--     SWEREF 99 i olika lokala zoner; den tvetydigheten får aldrig nå databasen.
--   * Ingenting kommunspecifikt hårdkodas. Nya kommuner är rader, inte kod.
--
-- Körs i Supabase SQL Editor. Idempotent: kan köras om.

-- ---------------------------------------------------------------------------
-- Kommuner
-- ---------------------------------------------------------------------------
create table if not exists municipalities (
    code                text primary key,          -- SCB REGINA, t.ex. '0180'
    name                text not null,             -- 'Stockholms stad'
    city                text not null,             -- 'Stockholm', i grundform
    slug                text not null unique,      -- 'stockholm'
    region              text,

    -- Hur datan hämtas. Driver pipelinen; ingen adapter väljs i kod.
    source_type         text not null
                            check (source_type in ('open_data', 'reverse_engineered',
                                                   'scrape', 'foi_request', 'none')),
    source_url          text,
    source_licence      text,
    -- Vilket verksamhetssystem kommunen kör (Ecos, EDP Vision, Castor).
    source_system       text,
    -- Vilken adaptermodul som hanterar formatet, t.ex. 'linkoping'.
    adapter             text,

    population          integer,
    last_fetched_at     timestamptz,
    created_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Anläggningar
-- ---------------------------------------------------------------------------
create table if not exists establishments (
    -- 'F-0180-<lokalt id>'. Nationellt unik enligt Sambruk-konventionen.
    id                  text primary key,
    municipality_code   text not null references municipalities (code) on delete cascade,
    id_local            text not null,

    name                text not null,
    -- OBS: för enskild firma ÄR detta ägarens personnummer, och specen
    -- föreskriver maskering av de fyra sista. Duger därför inte ensamt som
    -- join-nyckel mot företagsregister, och är personuppgift.
    organization_number text,

    types               text[] not null default '{}',
    exp_class           text check (exp_class in ('A', 'B', 'C')),
    risk_class          text,
    inspection_time_h   numeric,

    -- 0 = inaktiv, 1 = väntande, 2 = aktiv. Endast 2 publiceras.
    active              smallint check (active between 0 and 2),

    street_address      text,
    postal_code         text,
    locality            text,
    district            text,                      -- stadsdel, härledd
    region              text,
    country             text not null default 'SE',

    lat                 double precision check (lat between 55 and 70),
    lng                 double precision check (lng between 10 and 25),

    -- URL-segment. Unikt inom kommunen så /stockholm/<slug> är entydig.
    slug                text not null,

    source_created_at   timestamptz,
    source_modified_at  timestamptz,
    fetched_at          timestamptz not null default now(),

    unique (municipality_code, slug)
);

create index if not exists establishments_municipality_idx
    on establishments (municipality_code);
create index if not exists establishments_geo_idx
    on establishments (lat, lng);
-- Fritextsök på namn och adress, utan extern söktjänst.
create index if not exists establishments_search_idx
    on establishments using gin (
        to_tsvector('swedish', coalesce(name, '') || ' ' || coalesce(street_address, ''))
    );

-- ---------------------------------------------------------------------------
-- Inspektioner
-- ---------------------------------------------------------------------------
create table if not exists inspections (
    id                  text primary key,          -- 'I-0180-<lokalt id>'
    establishment_id    text not null
                            references establishments (id) on delete cascade,

    inspected_at        date not null,

    -- 0 = rutin, 1 = uppföljning/återbesök, 2 = händelsestyrd
    type                smallint not null check (type between 0 and 2),

    -- 0 = inga anmärkningar, 1 = mindre, 2 = allvarliga.
    -- Grunden för bedömningen. Alla källor mappas hit.
    assessment          smallint not null check (assessment between 0 and 2),

    prenotified         boolean,
    audit               boolean not null default false,
    on_site             boolean not null default true,

    -- Verksamhetens replikrätt. Publiceras oredigerat.
    owner_comment       text,

    source_modified_at  timestamptz,
    fetched_at          timestamptz not null default now()
);

create index if not exists inspections_establishment_idx
    on inspections (establishment_id, inspected_at desc);

-- ---------------------------------------------------------------------------
-- Kontrollområden per inspektion
--
-- Livsmedelsverkets rapporteringspunkter. En frånvarande punkt betyder
-- OKONTROLLERAD, aldrig godkänd — kontroller sprids över en treårscykel.
-- Vissa källor (Stockholm) redovisar bara punkter MED avvikelse.
-- ---------------------------------------------------------------------------
create table if not exists control_areas (
    id                  bigserial primary key,
    inspection_id       text not null references inspections (id) on delete cascade,

    code                text,                      -- 'J03'
    area_group          text,                      -- 'Grundförutsättningar, hygien'
    description         text,                      -- 'Hygien före, under och efter processen'
    status              text not null
                            check (status in ('ok', 'fixed', 'deviation', 'persisting'))
);

create index if not exists control_areas_inspection_idx
    on control_areas (inspection_id);

-- ---------------------------------------------------------------------------
-- Bilder
--
-- Gatubilder (Mapillary, CC-BY-SA) och senare verksamheternas egna
-- uppladdningar. Google Places-foton får INTE lagras här — deras villkor
-- förbjuder cachning.
-- ---------------------------------------------------------------------------
create table if not exists images (
    id                  bigserial primary key,
    establishment_id    text not null references establishments (id) on delete cascade,

    url                 text not null,
    source              text not null
                            check (source in ('mapillary', 'owner', 'own', 'wikimedia')),
    source_id           text,
    licence             text,
    attribution         text,
    captured_at         date,
    -- Ordning på verksamhetens sida. Lägst först.
    position            smallint not null default 0,

    created_at          timestamptz not null default now()
);

create index if not exists images_establishment_idx
    on images (establishment_id, position);

-- ---------------------------------------------------------------------------
-- Bedömning (härledd — vår slutsats, inte kommunens)
--
-- Tre nivåer, speglar källdatans assessment 0/1/2 ett till ett. Ingen
-- bokstavsskala: den hade krävt precision datan inte har, och A–E krockar med
-- de svenska skolbetygen där E är lägsta godkända.
-- ---------------------------------------------------------------------------
create table if not exists assessments (
    establishment_id    text primary key
                            references establishments (id) on delete cascade,

    -- NULL = otillräckligt underlag. Ett giltigt utfall som ALDRIG betyder
    -- dålig hygien. Sidor med NULL no-indexeras av kvalitetsgrinden.
    verdict             text check (verdict in ('clean', 'minor', 'major')),

    -- Genomgående utan anmärkningar vid de tre senaste kontrollerna.
    -- Vår motsvarighet till Danmarks Elite-Smiley: historiken ger ett
    -- erkännande, aldrig en ändrad allvarlighetsgrad.
    distinction         boolean not null default false,

    reason              text not null,   -- 'assessed' | 'stale_inspections' | 'no_inspections'
    model_version       integer not null,
    based_on            text[] not null default '{}',
    computed_at         timestamptz not null default now(),

    constraint distinction_requires_clean
        check (not distinction or verdict = 'clean')
);

create index if not exists assessments_verdict_idx
    on assessments (verdict) where verdict is not null;

-- ---------------------------------------------------------------------------
-- Publiceringsvy: vad sajten får rendera som indexerbar sida.
-- Kvalitetsgrinden i SQL i stället för utspridd i sidmallar.
-- ---------------------------------------------------------------------------
create or replace view publishable_establishments as
select
    e.*,
    m.slug          as municipality_slug,
    m.city          as municipality_city,
    m.name          as municipality_name,
    a.verdict,
    a.distinction,
    a.reason        as assessment_reason,
    a.model_version as assessment_model_version,
    a.based_on      as assessment_based_on,
    a.computed_at   as assessed_at
from establishments e
join municipalities m on m.code = e.municipality_code
left join assessments a on a.establishment_id = e.id
-- Koordinater är INTE ett krav. Uppsala publicerar inga, och en verksamhet
-- utan kartnål är ändå fullt publicerbar: namn, adress, bedömning och
-- historik finns. Kvalitetsgrinden sitter i bedömningen, inte i kartan.
where coalesce(e.active, 2) = 2;

-- ---------------------------------------------------------------------------
-- Radsäkerhet
--
-- Allt innehåll är allmänna handlingar och ska vara läsbart för alla.
-- Skrivning sker enbart från pipelinen med service_role-nyckeln, som går
-- förbi RLS. Ingen anon-nyckel får någonsin kunna skriva.
-- ---------------------------------------------------------------------------
alter table municipalities  enable row level security;
alter table establishments  enable row level security;
alter table inspections     enable row level security;
alter table control_areas   enable row level security;
alter table images          enable row level security;
alter table assessments     enable row level security;

do $$
declare t text;
begin
    foreach t in array array['municipalities', 'establishments', 'inspections',
                             'control_areas', 'images', 'assessments']
    loop
        execute format(
            'drop policy if exists %I on %I', 'public_read_' || t, t);
        execute format(
            'create policy %I on %I for select using (true)',
            'public_read_' || t, t);

        -- Explicit exponering. Projektet är satt att INTE exponera nya
        -- tabeller automatiskt, så varje tabell måste släppas fram medvetet.
        -- Det är hela poängen: framtida tabeller för uppladdningar och
        -- användarkonton ska inte bli publika av misstag.
        execute format('grant select on table %I to anon, authenticated', t);
    end loop;
end $$;

-- Låt vyn respektera anroparens radsäkerhet i stället för att kringgå den.
-- Utan detta kör vyn som sin ägare (security definer) och skulle kunna
-- exponera framtida känsliga kolumner förbi RLS.
alter view publishable_establishments set (security_invoker = true);

-- Vyn ärver inte rättigheter från sina tabeller.
grant select on publishable_establishments to anon, authenticated;

-- Ingen roll utom service_role får skriva. service_role går förbi RLS och
-- används enbart av pipelinen.
revoke insert, update, delete on all tables in schema public from anon, authenticated;
