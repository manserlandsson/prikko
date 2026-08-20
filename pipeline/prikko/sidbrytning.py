"""Stabil sidbrytning mot PostgREST.

PostgREST lämnar högst 1 000 rader per svar, så allt som läser en hel tabell
gör det med `limit` och `offset` över flera anrop. Det är säkert bara så länge
raderna kommer i samma ordning i varje anrop, och det gör de INTE av sig
själva: utan `order` är radordningen odefinierad mellan två satser, och
Postgres får flytta om rader i högen när som helst mellan dem. Då hoppas rader
över eller kommer två gånger, och sidhämtningen lämnar ifrån sig en tyst
ofullständig lista.

Sorteringen måste ske på en UNIK nyckel. En sortering på `observed_at`, där
tusentals rader delar datum, ger odefinierad ordning inom varje datumgrupp och
alltså samma fel fast mindre ofta. Exporten skrev ned det redan 2026-08-07,
efter elva felplacerade kontroller, se COORDINATE_DECIMALS-grannskapet i
pipeline/export_supabase.py.

## Vad det kostade natten till 2026-08-19

`reconcile_slugs` i pipeline/load_supabase.py läser hela kommunens bestånd för
att låsa varje verksamhet vid den slug den redan är publicerad på. Läsningen
gick utan `order`, och för Stockholms 8 552 rader är det nio anrop i rad.

Tappar den läsningen en löpa rader slutar låset gälla för just dem, tyst.
Precis de rader som `reconcile_slugs` finns för att skydda blir då lösa igen:
Stockholms utlämning den natten bar 15 bytespar, alltså par av likanämnda
verksamheter där källans numrering hade kastats om sedan förra körningen, och
13 av de 15 paren ligger som grannar i filordningen. Ett sammanhängande tapp
räcker därför för att ta båda halvorna av ett par.

Uppmätt på nattens egen utlämning, med databasens innehåll som facit:

    komplett läsning                    0 rader skriver någon annans slug
    tappade 10 rader i följd            fäller vid 125 av 8 510 startlägen
    tappade 50 rader i följd            fäller vid 664 av 8 470 startlägen
    tappade portion 9, rad 4000-4499    8 rader skriver någon annans slug

De åtta är fyra bytespar: Bröd & Salt, Coop Konsum, Fabrique Stenugnsbageri
och Gateau. Var och en försöker skriva en slug som den andra halvan
fortfarande håller, och unikheten prövas per rad inne i satsen, så bytet
fäller även när sluttillståndet hade varit rent. Databasen svarade

    23505: duplicate key value violates unique constraint
           "establishments_municipality_code_slug_key"

klockan 04:38:29, på POST /rest/v1/establishments?on_conflict=id. Upserten går
på `id` medan unikheten också gäller (municipality_code, slug), så
konfliktlösningen på id hjälper inte mot den andra nyckeln. Portionen var den
nionde av arton, alltså rad 4000 till 4499, och det är exakt fönstret de fyra
paren ligger i.

Felet är intermittent av samma skäl som sammanslagningen i `upsert` beskriver:
det syns först den natt högen råkar flytta sig mellan två sidor OCH ett
bytespar råkar ligga i tappet. Därför är det ingen lösning att läsa om vid
fel. Ordningen måste vara unik från början.
"""

from __future__ import annotations


def med_unik_ordning(query: str, unik: str) -> str:
    """Lägg en unik sorteringsnyckel sist i frågans `order`.

    `query` är en PostgREST-frågesträng som den ser ut i anropen, till exempel
    `select=id,slug&municipality_code=eq.0180`. Strängen skrivs INTE om i
    övrigt: anropen bär värden med citattecken och parenteser,
    `establishment_id=in.("F-0180-a","F-0180-b")`, och en omkodning genom
    urlencode hade ändrat dem.

    En order som redan finns behålls och får den unika nyckeln tillagd sist.
    Sorteringen på `observed_at.desc` är det anroparen vill läsa i, den unika
    nyckeln är bara det som gör sidbrytningen entydig när flera rader delar
    värde.

    `unik` får vara flera kolumner: en vy har ingen primärnyckel, och
    roster_events blir entydig först på establishment_id, kind och observed_on
    tillsammans.
    """
    delar = query.split("&")
    kolumner: list[str] = []
    ovrigt: list[str] = []
    for del_ in delar:
        if del_.startswith("order="):
            kolumner = [k for k in del_[len("order=") :].split(",") if k]
        elif del_:
            ovrigt.append(del_)

    # Riktningen skrivs som `kolumn.desc`, så jämförelsen sker på namnet.
    # Annars hade en order på `observed_at.desc` fått `observed_at` tillagd
    # och sorterat på samma kolumn två gånger åt olika håll.
    namngivna = {k.split(".", 1)[0] for k in kolumner}
    for kolumn in unik.split(","):
        kolumn = kolumn.strip()
        if kolumn and kolumn not in namngivna:
            kolumner.append(kolumn)
            namngivna.add(kolumn)

    return "&".join(ovrigt + ["order=" + ",".join(kolumner)])
