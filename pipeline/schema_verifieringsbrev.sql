-- ===========================================================================
-- Verifiering med brevkod
--
-- Körs EFTER schema_community.sql.
--
-- ---------------------------------------------------------------------------
-- VARFÖR BREV OCH INGET ANNAT
-- ---------------------------------------------------------------------------
-- Verksamhetsställets adress är den ENDA kontaktväg vi har till företaget. Vi
-- lagrar varken telefonnummer, e-post eller webbplats. Ett brev är alltså inte
-- den bekvämaste kanalen, det är den enda som går att automatisera alls.
--
-- Det är samma logik som Googles vykod, och den bevisar samma sak: att någon
-- hämtar posten på adressen. Det är svagare än att veta vem personen är och
-- starkare än att veta att någon svarar i en telefon.
--
-- Metoden 'postal_code' fanns redan som ett värde i establishment_claims.
-- Den här filen är det som saknades för att den ska gå att använda.
--
-- ---------------------------------------------------------------------------
-- VAD SOM ALDRIG LAGRAS
-- ---------------------------------------------------------------------------
-- Koden. Bara sha256 av den. Den som läser databasen kan verifiera en kod som
-- någon uppger, men inte skriva ut ett brevs kod och ta över en verksamhet.
-- Koden finns i klartext exakt en gång, i utskriften som blir ett brev.
-- ===========================================================================

create table if not exists community.verification_letters (
    id            uuid primary key default gen_random_uuid(),
    claim_id      uuid not null references community.establishment_claims (id) on delete cascade,

    -- sha256 av koden, hex. Aldrig koden.
    code_hash     text not null check (code_hash ~ '^[0-9a-f]{64}$'),

    -- Adressen brevet gick till, som den såg ut när det skickades. Sparas för
    -- att en tvist ska gå att reda ut: adressen i datan kan ha ändrats sedan.
    sent_to       text not null,

    sent_at       timestamptz,
    expires_at    timestamptz not null,

    -- Räknas upp vid varje försök, även misslyckat. Se redeem_letter_code().
    attempts      int not null default 0,
    redeemed_at   timestamptz,

    created_at    timestamptz not null default now()
);

create index if not exists verification_letters_claim_idx
    on community.verification_letters (claim_id) where redeemed_at is null;

-- ---------------------------------------------------------------------------
-- Radsäkerhet: ingen inloggad rör den här tabellen. Alls.
--
-- Det finns ingen policy och inga grants för authenticated eller anon, och det
-- är avsiktligt. Kodhashen ska inte gå att läsa, försöksräknaren ska inte gå
-- att nollställa, och utgångstiden ska inte gå att flytta. Allt som en
-- inloggad får göra går genom redeem_letter_code() nedan.
-- ---------------------------------------------------------------------------
alter table community.verification_letters enable row level security;

revoke all on community.verification_letters from anon, authenticated;
grant select, insert, update, delete on community.verification_letters to service_role;


-- ---------------------------------------------------------------------------
-- Lösa in en kod
--
-- SECURITY DEFINER, för att den gör precis det en inloggad inte får göra
-- själv: sätter ett anspråk till godkänt. Att den är definer är också skälet
-- att den är så kort som den är, och att den bara kan sluta på två sätt.
--
-- search_path = '' så att ingen kan lägga en egen tabell framför våra.
--
-- Försöksräknaren skrivs upp FÖRE jämförelsen. Går funktionen sönder mitt i,
-- eller avbryter någon anropet, ska försöket ändå vara räknat. Fem försök per
-- brev räcker för den som skrivit fel och inte för den som gissar: koden har
-- 28^6 möjliga värden.
--
-- Returnerar ett meddelande på svenska. Klienten visar det ordagrant.
-- ---------------------------------------------------------------------------
create or replace function community.redeem_letter_code(
    p_establishment_id text,
    p_code             text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_claim  community.establishment_claims%rowtype;
    v_letter community.verification_letters%rowtype;
    v_hash   text;
begin
    if auth.uid() is null then
        raise exception 'Du är utloggad. Logga in igen.';
    end if;

    select * into v_claim
    from community.establishment_claims
    where user_id = auth.uid()
      and establishment_id = p_establishment_id
    limit 1;

    if not found then
        raise exception 'Du har ingen ansökan för den här verksamheten.';
    end if;

    if v_claim.status = 'published' then
        return 'Du är redan godkänd som företrädare.';
    end if;

    if v_claim.status = 'rejected' then
        raise exception 'Ansökan är avslagen. Hör av dig till redaktionen.';
    end if;

    select * into v_letter
    from community.verification_letters
    where claim_id = v_claim.id
      and redeemed_at is null
    order by created_at desc
    limit 1;

    if not found then
        raise exception 'Det finns ingen kod att lösa in för den här ansökan.';
    end if;

    -- Räknas upp först, och det gäller även när koden visar sig vara rätt.
    update community.verification_letters
    set attempts = attempts + 1
    where id = v_letter.id;

    if v_letter.attempts >= 5 then
        raise exception 'För många försök. Hör av dig till redaktionen.';
    end if;

    if v_letter.expires_at < now() then
        raise exception 'Koden har gått ut. Hör av dig till redaktionen för ett nytt brev.';
    end if;

    -- sha256() finns i Postgres själv. Ingen tillägg behövs.
    v_hash := encode(sha256(convert_to(upper(btrim(p_code)), 'UTF8')), 'hex');

    if v_hash <> v_letter.code_hash then
        raise exception 'Fel kod. Kontrollera siffrorna i brevet.';
    end if;

    update community.verification_letters
    set redeemed_at = now()
    where id = v_letter.id;

    update community.establishment_claims
    set status              = 'published',
        verification_method = 'postal_code',
        verified_at         = now(),
        verified_by         = 'brevkod'
    where id = v_claim.id;

    return 'Klart. Du är godkänd som företrädare för verksamheten.';
end;
$$;

revoke all on function community.redeem_letter_code(text, text) from public, anon;
grant execute on function community.redeem_letter_code(text, text) to authenticated;
