-- Prikko — datamodell (Supabase/Postgres)
--
-- Speglar Sambruk/NSÖD-specen för livsmedelskontroller, normaliserad.
-- Se research/R1_sambruk_datamodell.md för verifierad fältdokumentation.
--
-- Designprinciper:
--   * Rådata och härledda värden hålls isär. `inspections` är vad kommunen
--     sagt; `grades` är vad vi räknat fram. Blandas de går ett publicerat
--     betyg inte längre att härleda i efterhand.
--   * Varje rad bär sin källa och sin hämttidpunkt. "Senast uppdaterad" är en
--     dokumenterad AEO-signal och måste kunna visas per sida.
--   * Koordinater lagras som explicita lat/lng. Sambruk-specen kallar sitt
--     fält GeoJSON men anger latitud först, tvärtemot standarden — den
--     tvetydigheten får aldrig läcka in i databasen.

-- ---------------------------------------------------------------------------
-- Kommuner
-- ---------------------------------------------------------------------------
create table municipalities (
    code                text primary key,          -- SCB REGINA, t.ex. '1280'
    name                text not null,             -- 'Malmö stad'
    slug                text not null unique,      -- 'malmo'
    region              text,                      -- län
    -- Var datan kommer ifrån och hur den hämtas. Driver pipelinen.
    source_type         text not null check (source_type in
                            ('open_data', 'scrape', 'foi_request', 'none')),
    source_url          text,
    source_licence      text,                      -- 'CC0', 'CC-BY' ...
    -- Vilket verksamhetssystem kommunen kör (Ecos / EDP Vision / Castor).
    -- Avläses ur fältet `generator` och avgör vilken inläsare som används.
    source_system       text,
    last_fetched_at     timestamptz,
    created_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Anläggningar
-- ---------------------------------------------------------------------------
create table establishments (
    -- 'F-1280-14' = F + kommunkod + lokalt id. Nationellt unik enligt specen.
    id_national         text primary key,
    municipality_code   text not null references municipalities (code),
    id_local            text not null,

    name                text not null,
    -- OBS: för enskild firma ÄR detta ägarens personnummer, och specen
    -- föreskriver att de fyra sista siffrorna maskeras. Duger därför inte
    -- ensamt som join-nyckel mot företagsregister, och är personuppgift.
    organization_number text,

    types               text[] not null default '{}',   -- 1–4 nivåer
    exp_class           text check (exp_class in ('A', 'B', 'C')),
    risk_class          text,                           -- 'Riskklass 1'–'8'
    inspection_time_h   numeric,

    -- 0 = inaktiv, 1 = väntande, 2 = aktiv. Endast 2 publiceras.
    active              smallint check (active between 0 and 2),

    street_address      text,
    postal_code         text,
    locality            text,
    district            text,                           -- stadsdel, härledd
    region              text,
    country             text not null default 'SE',

    lat                 double precision check (lat between 55 and 70),
    lng                 double precision check (lng between 10 and 25),

    -- URL-segment. Unikt inom kommunen så /malmo/<slug> alltid är entydig.
    slug                text not null,

    source_created_at   timestamptz,
    source_modified_at  timestamptz,
    fetched_at          timestamptz not null default now(),

    unique (municipality_code, slug)
);

create index on establishments (municipality_code);
create index on establishments (lat, lng);

-- ---------------------------------------------------------------------------
-- Inspektioner
-- ---------------------------------------------------------------------------
create table inspections (
    id_national         text primary key,               -- 'I-1280-1'

    -- VARNING: Sambruk-specen definierar INGET fält som kopplar en inspektion
    -- till en anläggning. Kopplingen måste härledas vid inläsning (sannolikt
    -- via nästling i den faktiska filen) och är EJ VERIFIERAD mot riktig data.
    -- Se research/R1_sambruk_datamodell.md, fynd 2.
    establishment_id    text not null
                            references establishments (id_national)
                            on delete cascade,

    id_local            text not null,
    inspected_at        date not null,

    -- 0 = rutin, 1 = uppföljning, 2 = händelse
    type                smallint not null check (type between 0 and 2),

    -- 0 = inga anmärkningar, 1 = mindre, 2 = allvarliga.
    -- Ovillkorligt obligatoriskt i specen — och därför grunden för betyget.
    assessment          smallint not null check (assessment between 0 and 2),

    prenotified         boolean,

    -- Livsmedelsverkets rapporteringspunkter. Frånvarande punkt betyder
    -- OKONTROLLERAD, aldrig godkänd — kontroller sprids över en treårscykel.
    points_passed       text[] not null default '{}',
    points_remark       text[] not null default '{}',

    -- Verksamhetens replikrätt. Publiceras oredigerat.
    owner_comment       text,

    source_modified_at  timestamptz,
    fetched_at          timestamptz not null default now()
);

create index on inspections (establishment_id, inspected_at desc);

-- ---------------------------------------------------------------------------
-- Bedömning (härledd — vår slutsats, inte kommunens)
--
-- Tre nivåer, speglar källdatans `assessment` 0/1/2 ett till ett. Ingen
-- bokstavsskala: den hade krävt precision datan inte har, och A–E krockar med
-- de svenska skolbetygen där E är lägsta godkända.
-- ---------------------------------------------------------------------------
create table assessments (
    establishment_id    text primary key
                            references establishments (id_national)
                            on delete cascade,

    -- NULL = otillräckligt underlag. Ett giltigt utfall som ALDRIG betyder
    -- dålig hygien. Sidor med NULL no-indexeras av kvalitetsgrinden.
    verdict             text check (verdict in ('clean', 'minor', 'major')),

    -- Genomgående utan anmärkningar vid de tre senaste kontrollerna.
    -- Vår motsvarighet till Danmarks Elite-Smiley: historiken ger ett
    -- erkännande, aldrig en ändrad allvarlighetsgrad.
    distinction         boolean not null default false,

    reason              text not null,      -- 'assessed' | 'stale_inspections' | 'no_inspections'
    model_version       integer not null,   -- måste matcha grading.MODEL_VERSION
    based_on            text[] not null default '{}',   -- inspektions-id, nyast först
    computed_at         timestamptz not null default now(),

    -- En utmärkelse utan ren bedömning vore självmotsägande.
    constraint distinction_requires_clean
        check (not distinction or verdict = 'clean')
);

create index on assessments (verdict) where verdict is not null;

-- ---------------------------------------------------------------------------
-- Publiceringsvy: vad sajten får rendera som en indexerbar sida.
-- Kvalitetsgrinden i SQL i stället för utspridd i sidmallar.
-- ---------------------------------------------------------------------------
create view publishable_establishments as
select
    e.*,
    a.verdict,
    a.distinction,
    a.reason        as assessment_reason,
    a.model_version as assessment_model_version,
    a.based_on      as assessment_based_on,
    a.computed_at   as assessed_at
from establishments e
join assessments a on a.establishment_id = e.id_national
where e.active = 2
  and a.verdict is not null
  and e.lat is not null
  and e.lng is not null;
