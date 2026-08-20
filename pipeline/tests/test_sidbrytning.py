"""Test för att sidbrytningen mot PostgREST lämnar en HEL lista.

Bakgrunden är nattkörningen 2026-08-19, som föll i steget "Skriv till
Supabase" med

    23505: duplicate key value violates unique constraint
           "establishments_municipality_code_slug_key"

`reconcile_slugs` läser hela kommunens bestånd för att låsa varje verksamhet
vid den slug den redan är publicerad på. Läsningen gick utan `order`, alltså
nio anrop med odefinierad radordning för Stockholms 8 552 rader. Tappar den
en löpa rader slutar låset gälla för just dem, tyst, och två likanämnda
verksamheter kan byta slug med varandra igen. Det är precis vad
test_slugstabilitet.py finns för att hindra, och den natten gick det runt
skyddet i stället för igenom det.

Det lömska är att en ofullständig läsning inte ser ut som ett fel. Den
returnerar en kortare lista, ingenting kastar, och `reconcile_slugs` gör sitt
arbete perfekt på de rader den fick se.

Testet är snubbeltråden. Faller det kan låset sluta gälla utan att något
klagar, och adresser kan börja vandra mellan verksamheter igen.

Körs utan beroenden:  python3 pipeline/tests/test_sidbrytning.py
"""

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from load_supabase import Supabase, reconcile_slugs  # noqa: E402
from prikko.sidbrytning import med_unik_ordning  # noqa: E402


class Ordningen(unittest.TestCase):
    def test_fraga_utan_order_far_en(self):
        self.assertEqual(
            med_unik_ordning("select=id,slug&municipality_code=eq.0180", "id"),
            "select=id,slug&municipality_code=eq.0180&order=id",
        )

    def test_befintlig_order_behalls_och_far_avgoraren_sist(self):
        """Anroparen läser i sin ordning, den unika nyckeln skiljer lika."""
        self.assertEqual(
            med_unik_ordning(
                "select=appeared&kind=eq.normal&order=observed_at.desc", "id"
            ),
            "select=appeared&kind=eq.normal&order=observed_at.desc,id",
        )

    def test_kolumn_som_redan_sorteras_laggs_inte_till_igen(self):
        """Annars hade observed_on sorterats två gånger åt olika håll."""
        self.assertEqual(
            med_unik_ordning(
                "select=*&order=observed_on.desc", "establishment_id,kind,observed_on"
            ),
            "select=*&order=observed_on.desc,establishment_id,kind",
        )

    def test_resten_av_fragan_skrivs_inte_om(self):
        """Anropen bär citattecken och parenteser i värdena. En omkodning
        genom urlencode hade ändrat dem och gett noll träffar."""
        fraga = 'select=establishment_id&establishment_id=in.("F-0180-a","F-0180-b")'
        self.assertEqual(med_unik_ordning(fraga, "id"), fraga + "&order=id")


class FlyttandeHog(Supabase):
    """PostgREST-attrapp där högen rör sig mellan anropen.

    Svarar på `order`, `limit` och `offset` som PostgREST gör. Saknas `order`
    roteras raderna ett snäpp per anrop, vilket är vad en tabell som skrivs
    om eller städas av autovacuum ser ut som för en läsare som sidbryter på
    offset. Ordningen mellan två satser är då odefinierad, och rader hoppas
    över eller kommer två gånger.
    """

    def __init__(self, rows):
        super().__init__("https://exempel.supabase.co", "nyckel")
        self.rows = list(rows)
        self.anrop = 0

    def _request(self, method, path, body=None, prefer=""):
        self.anrop += 1
        fraga = path.split("?", 1)[1]
        params = dict(p.split("=", 1) for p in fraga.split("&"))
        limit = int(params["limit"])
        offset = int(params["offset"])

        rader = list(self.rows)
        if "order" in params:
            for kolumn in reversed(params["order"].split(",")):
                namn = kolumn.split(".", 1)[0]
                rader.sort(key=lambda r: r[namn], reverse=kolumn.endswith(".desc"))
        else:
            skift = 7 * self.anrop
            rader = rader[skift:] + rader[:skift]

        return json.dumps(rader[offset : offset + limit]).encode("utf-8")


def bestand(antal):
    return [
        {"id": f"F-0180-{n:06}", "slug": f"verksamhet-{n:06}"} for n in range(antal)
    ]


class Sidbrytning(unittest.TestCase):
    def test_attrappen_ar_en_riktig_falla(self):
        """Utan det här provet vore resten intetsägande.

        Visar att en sidbrytning UTAN order faktiskt tappar rader mot samma
        attrapp. Går det här provet sönder har attrappen slutat efterlikna
        felet, och proven nedan bevisar ingenting längre.
        """
        client = FlyttandeHog(bestand(2500))
        rader = []
        while True:
            data = client._request(
                "GET", f"establishments?select=id,slug&limit=1000&offset={len(rader)}"
            )
            bit = json.loads(data.decode("utf-8"))
            rader += bit
            if len(bit) < 1000:
                break
        self.assertLess(len({r["id"] for r in rader}), 2500)

    def test_hela_bestandet_kommer_med(self):
        """Tre sidor om 1 000, och alla 2 500 raderna ska vara med en gång."""
        client = FlyttandeHog(bestand(2500))
        rader = client.select_all("establishments", "select=id,slug")
        self.assertEqual(len(rader), 2500)
        self.assertEqual(len({r["id"] for r in rader}), 2500)

    def test_sista_sidan_avslutar(self):
        """Jämnt delbart antal: sidbrytningen får inte snurra vidare."""
        client = FlyttandeHog(bestand(2000))
        self.assertEqual(len(client.select_all("establishments", "select=id,slug")), 2000)

    def test_tom_tabell(self):
        client = FlyttandeHog([])
        self.assertEqual(client.select_all("establishments", "select=id,slug"), [])


#: Bytesparet som fällde natten till 2026-08-19. Bröd & Salt låg på rad 4 284
#: och 4 285 i Stockholms utlämning, alltså grannar, och båda hamnade i
#: portion nio av arton. 13 av nattens 15 bytespar låg som grannar på det
#: viset, vilket är varför ett sammanhängande tapp räcker för att ta båda.
BROD_A = "F-0180-3f2a1c94-6d18-4b7e-9a52-ab6c4a0d5aa4"
BROD_B = "F-0180-8c5e2d71-0f43-4a96-b8d1-5dec30fe7c85"


class BytesparOverlever(unittest.TestCase):
    """Kärnan: låset ska gälla även när beståndet kräver flera sidor.

    Samma fall som test_slugstabilitet.py provar mot en klient som svarar med
    allt på en gång. Här ligger paret mitt i ett bestånd som kräver tre sidor,
    och det är den situation där låset tyst slutade gälla.
    """

    #: Raderna attrappens flyttande hög faktiskt tappar är 1007 till 1013 och
    #: 2014 till 2020, alltså två sammanhängande löpor kring sidbrytningarna.
    #: Paret läggs i den första av dem, för det är så verkligheten såg ut:
    #: nattens fyra bytespar i portion nio låg som grannar i filordningen.
    TAPPAD_RAD = 1007

    def _bestand_med_par(self):
        rader = bestand(2500)
        rader[self.TAPPAD_RAD] = {"id": BROD_A, "slug": "brod-salt-5"}
        rader[self.TAPPAD_RAD + 1] = {"id": BROD_B, "slug": "brod-salt-4"}
        return rader

    def test_paret_behaller_sina_publicerade_slugar(self):
        client = FlyttandeHog(self._bestand_med_par())
        # Källan levererar dem i omvänd ordning mot förra körningen, så
        # dedupe_slugs har gett dem varandras nummer.
        utlamning = [
            {"id": BROD_A, "slug": "brod-salt-4"},
            {"id": BROD_B, "slug": "brod-salt-5"},
        ]

        reconcile_slugs(client, "0180", utlamning)

        self.assertEqual(utlamning[0]["slug"], "brod-salt-5")
        self.assertEqual(utlamning[1]["slug"], "brod-salt-4")

    def test_ingen_rad_skriver_nagon_annans_slug(self):
        """Predikatet databasen faktiskt fäller på.

        Unikheten prövas per rad inne i satsen, så ett byte ger 23505 även
        när sluttillståndet hade varit rent.
        """
        rader = self._bestand_med_par()
        client = FlyttandeHog(rader)
        agare = {r["slug"]: r["id"] for r in rader}
        utlamning = [
            {"id": BROD_A, "slug": "brod-salt-4"},
            {"id": BROD_B, "slug": "brod-salt-5"},
            {"id": "F-0180-helt-ny", "slug": "verksamhet-000500"},
        ]

        reconcile_slugs(client, "0180", utlamning)

        for e in utlamning:
            self.assertNotIn(
                agare.get(e["slug"], e["id"]),
                [i for i in agare.values() if i != e["id"]],
                f"{e['id']} skriver {e['slug']!r} som någon annan håller",
            )

    def test_ny_rad_far_inte_ta_en_upptagen_slug(self):
        """Den enda verkligt nya posten i Stockholm den natten var en
        7-Eleven. Hade läsningen varit kort kunde den ha landat på en
        upptagen adress."""
        client = FlyttandeHog(bestand(2500))
        # Sluggen hör till en rad som ligger i den löpa attrappen tappar.
        # Läses beståndet kort ser den ledig ut, och den nya raden hade
        # skrivit sig ovanpå någon annans adress.
        utlamning = [{"id": "F-0180-helt-ny", "slug": "verksamhet-001010"}]

        reconcile_slugs(client, "0180", utlamning)

        self.assertEqual(utlamning[0]["slug"], "verksamhet-001010-2")


if __name__ == "__main__":
    unittest.main()
