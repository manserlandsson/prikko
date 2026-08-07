-- Prikko — rörelsen i beståndet
--
-- Vad som saknas i schema.sql och varför det här finns:
--
-- `establishments.active` säger om raden lämnas ut just nu. Den säger inte när
-- den började lämnas ut och inte när den slutade. `source_created_at` och
-- `source_modified_at` finns men är null i de flesta källorna, och de kommuner
-- som fyller dem fyller dem olika. Ingen kolumn i schema.sql kan alltså svara
-- på frågan "vad är nytt i Stockholm den här månaden".
--
-- Svaret går inte att hämta i efterhand. Varje körning skriver över den förra,
-- så observationen finns bara i det ögonblick jämförelsen görs. Tabellerna här
-- är därför en LOGG, inte en vy: de byggs på en rad i taget, natt för natt, och
-- den historik de bär börjar den dag de sätts upp.
--
-- Två saker hålls isär, av samma skäl som inspections och assessments hålls
-- isär i schema.sql:
--
--   * `roster_deliveries` är vad vi observerade. En rad per kommun och körning.
--   * `establishment_spells` är hur observationen klassades. Klassningen kan
--     räknas om när reglerna i pipeline/prikko/rorelse.py ändras; observationen
--     kan det aldrig.
--
-- Körs i Supabase SQL Editor. Idempotent: kan köras om.

-- ---------------------------------------------------------------------------
-- Utlämningar
-- ---------------------------------------------------------------------------
create table if not exists roster_deliveries (
    id                  bigserial primary key,
    municipality_code   text not null references municipalities (code) on delete cascade,

    -- Källans egen hämttidpunkt, alltså samma värde som municipalities
    -- .last_fetched_at får. Två körningar mot samma utlämning ska bli EN rad,
    -- annars räknas en omkörning som en natt till och en frånvaro blir
    -- bekräftad för tidigt. Unikhetsvillkoret nedan gör om till en no-op.
    observed_at         timestamptz not null,

    -- 'seed'   = första körningen mot kommunen, inget att jämföra mot
    -- 'bulk'   = tillskottet är för stort för att vara registreringar
    -- 'normal' = en vanlig natt
    kind                text not null check (kind in ('seed', 'bulk', 'normal')),

    delivered           integer not null,
    live_before         integer not null,
    -- Nytillkomna id, oavsett om de publiceras. Driver medianen som gränsen
    -- justeras mot, och den ska mäta kommunens takt och inte vår publicering.
    appeared            integer not null default 0,
    departed            integer not null default 0,
    renumbered          integer not null default 0,

    -- Dygn sedan förra utlämningen. Gränsen skalas med det: en körning som
    -- stått stilla en månad bär en månads registreringar.
    days_since          numeric,

    -- Gränsen som räknades fram den natten. Sparas för att beslutet ska gå att
    -- läsa i efterhand, precis som model_version på en bedömning.
    bulk_limit          integer,

    created_at          timestamptz not null default now(),

    unique (municipality_code, observed_at)
);

create index if not exists roster_deliveries_municipality_idx
    on roster_deliveries (municipality_code, observed_at desc);

-- ---------------------------------------------------------------------------
-- Sviter
--
-- En svit är en sammanhängande följd av utlämningar där ett id fanns med. Ett
-- id kan ha flera: försvinner det och kommer tillbaka är det två sviter, inte
-- en lucka i en. Att modellera det som en lucka hade krävt att vi valde vilken
-- av de två tidpunkterna som är "den riktiga", och det vet vi inte.
--
-- Notera vad som INTE står här: inget `last_seen_at`, inga räknare för hur
-- många utlämningar raden setts i. De är HÄRLEDDA ur roster_deliveries längre
-- ned. Skälet är rent praktiskt: en lagrad räknare hade krävt att 8 511
-- Stockholmsrader skrevs om varje natt bara för att konstatera att ingenting
-- hänt. En pågående svit rörs nu inte alls förrän den tar slut.
-- ---------------------------------------------------------------------------
create table if not exists establishment_spells (
    id                  bigserial primary key,
    establishment_id    text not null
                            references establishments (id) on delete cascade,
    municipality_code   text not null references municipalities (code) on delete cascade,

    -- Utlämningen där id:t först syntes i den här sviten.
    appeared_at         timestamptz not null,
    -- Utlämningen där det FÖRST SAKNADES. Inte den sista det syntes: det är
    -- den enda av de två tidpunkterna vi faktiskt observerat. Null = pågår.
    gone_at             timestamptz,

    -- Hur raden kom in. Bara 'new' publiceras.
    --   seed        första körningen mot kommunen
    --   bulk        en omläggning av registret
    --   new         ett id kommunen inte lämnat ut förut
    --   returned    ett id som varit borta och kommit tillbaka
    --   renumbered  samma lokal, nytt id
    --   succession  samma adress, annat namn, samma utlämning
    appearance          text not null
                            check (appearance in ('seed', 'bulk', 'new',
                                                  'returned', 'renumbered',
                                                  'succession')),

    -- Hur raden gick ut. Bara 'gone' publiceras. Null medan sviten pågår.
    --   gone          slutade lämnas ut, inget som förklarar det
    --   uncontrolled  raden bar aldrig en kontroll, alltså registerstädning
    --   bulk          omläggning, eller ett bortfall spärren stoppat
    --   renumbered    samma lokal, nytt id
    --   succession    samma adress, annat namn, samma utlämning
    disappearance       text check (disappearance in ('gone', 'uncontrolled', 'bulk',
                                                      'renumbered', 'succession')),

    -- Vid id-byte: motparten. Gör att en felaktig parning går att hitta och
    -- ångra utan att gissa sig fram i loggen.
    counterpart_id      text,

    created_at          timestamptz not null default now()
);

create index if not exists establishment_spells_establishment_idx
    on establishment_spells (establishment_id, appeared_at desc);

create index if not exists establishment_spells_municipality_idx
    on establishment_spells (municipality_code, appeared_at desc);

-- Ett id får ha högst en pågående svit. Utan spärren kan en avbruten körning
-- lägga en andra öppen svit på samma rad, och då dubbleras verksamheten på
-- sidan.
create unique index if not exists establishment_spells_open_idx
    on establishment_spells (establishment_id)
    where gone_at is null;

-- ---------------------------------------------------------------------------
-- Bekräftelse
--
-- Skillnaden mellan en observation och ett påstående. En rad som synts en enda
-- natt kan vara ett hål i föregående hämtning, och en rad som saknas en enda
-- natt kan vara ett hål i den här. Först när mönstret hållit i sig över flera
-- utlämningar säger sidan något.
--
-- Kraven speglar CONFIRM_SIGHTINGS, CONFIRM_ABSENCES och CONFIRM_DAYS i
-- pipeline/prikko/rorelse.py och måste ändras i takt med dem. Grinden ligger
-- både där och här, så att en fråga som ställs för hand mot databasen får
-- samma svar som exporten.
-- ---------------------------------------------------------------------------
drop view if exists roster_months;
drop view if exists roster_events;
drop view if exists establishment_spell_counts;

create view establishment_spell_counts as
select
    s.*,
    (select count(*)
       from roster_deliveries d
      where d.municipality_code = s.municipality_code
        and d.observed_at >= s.appeared_at
        and (s.gone_at is null or d.observed_at < s.gone_at))   as sightings,
    (select count(*)
       from roster_deliveries d
      where d.municipality_code = s.municipality_code
        and s.gone_at is not null
        and d.observed_at >= s.gone_at)                          as absences,
    (select max(d.observed_at)
       from roster_deliveries d
      where d.municipality_code = s.municipality_code
        and d.observed_at >= s.appeared_at
        and (s.gone_at is null or d.observed_at < s.gone_at))    as last_seen_at
from establishment_spells s;

-- ---------------------------------------------------------------------------
-- Vad sidan får visa
--
-- Namnet och adressen läses ur establishments, som ligger kvar även när raden
-- avpublicerats med active = 0. Det är hela skälet till att deactivate_missing
-- aldrig raderar: utan raden hade en borttagen verksamhet inte kunnat nämnas
-- vid namn på sidan som säger att den är borta.
--
-- Att raden aldrig burit en kontroll prövas INTE här, trots att det avgör om
-- ett försvinnande får publiceras. Kravet ligger i klassningen, alltså i det
-- ögonblick observationen görs, och syns här som `disappearance = 'gone'`
-- eftersom en okontrollerad rad då fått 'uncontrolled' i stället. Prövade
-- vyn saken en gång till skulle en kontroll som kommunen senare tar bort tyst
-- ändra en redan publicerad rad, och en observation ska inte kunna skrivas om
-- i efterhand. Se punkt 4 i pipeline/prikko/rorelse.py.
-- ---------------------------------------------------------------------------
create view roster_events as
select
    s.establishment_id,
    s.municipality_code,
    m.slug                          as municipality_slug,
    'ny'::text                      as kind,
    s.appeared_at::date             as observed_on,
    e.slug,
    e.name,
    e.street_address
from establishment_spell_counts s
join establishments e   on e.id = s.establishment_id
join municipalities m   on m.code = s.municipality_code
where s.appearance = 'new'
  and s.sightings >= 2

union all

select
    s.establishment_id,
    s.municipality_code,
    m.slug,
    'borta'::text,
    s.gone_at::date,
    e.slug,
    e.name,
    e.street_address
from establishment_spell_counts s
join establishments e   on e.id = s.establishment_id
join municipalities m   on m.code = s.municipality_code
where s.disappearance = 'gone'
  and s.gone_at is not null
  and s.absences >= 2
  and now() - s.gone_at >= interval '14 days';

-- Månadsöversikt per kommun. Talen bär kommunens egen rörelse och får ALDRIG
-- ställas bredvid en annan kommuns: de speglar hur kommunen sköter sitt
-- register minst lika mycket som hur många som öppnar och stänger.
create view roster_months as
select
    municipality_slug,
    to_char(observed_on, 'YYYY-MM')                    as month,
    count(*) filter (where kind = 'ny')                as arrived,
    count(*) filter (where kind = 'borta')             as departed
from roster_events
group by municipality_slug, to_char(observed_on, 'YYYY-MM');


-- ---------------------------------------------------------------------------
-- Radsäkerhet: stängt för alla utom service_role
--
-- Tabellerna ligger i `public`, och Supabase ger som standard anon- och
-- authenticated-rollerna rättigheter på nya tabeller där. Utan raderna nedan
-- hade alltså vem som helst med sajtens publika nyckel kunnat både läsa och
-- skriva i rörelseloggen. SQL-editorn varnar för det, men varningen är lätt
-- att klicka förbi, och en spärr som beror på vilken knapp någon tryckte på
-- är ingen spärr.
--
-- RLS PÅ UTAN EN ENDA POLICY betyder nej till alla. Det är avsiktligt och
-- fullständigt:
--
--   * Pipelinen skriver med service_role, som går förbi radsäkerheten.
--   * Sajten läser aldrig de här tabellerna. Den läser de exporterade
--     filerna, se pipeline/rorelse.py exportera och site/src/lib/rorelse.ts.
--
-- Skulle en yta någon gång behöva läsa loggen direkt är rätt åtgärd en
-- namngiven läspolicy, inte att stänga av radsäkerheten.
--
-- Vyerna ärver tabellernas skydd genom security_invoker, alltså läser de med
-- frågeställarens rättigheter och inte med sina egna.
-- ---------------------------------------------------------------------------
alter table roster_deliveries      enable row level security;
alter table establishment_spells   enable row level security;

revoke all on roster_deliveries    from anon, authenticated;
revoke all on establishment_spells from anon, authenticated;

alter view establishment_spell_counts set (security_invoker = true);
alter view roster_events             set (security_invoker = true);
alter view roster_months             set (security_invoker = true);

revoke all on establishment_spell_counts from anon, authenticated;
revoke all on roster_events             from anon, authenticated;
revoke all on roster_months             from anon, authenticated;
