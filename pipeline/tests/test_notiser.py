"""Test för notiser om bevakade verksamheter.

Det här är det enda stället i bygget där vi mejlar riktiga människor om
namngivna restauranger. Går urvalet sönder åt ena hållet uteblir notiserna
tyst; går det sönder åt andra hållet skickar vi ut hela beståndet och bränner
både förtroendet och Resend-kvoten på en natt.

Testerna beskriver därför regeln i sin helhet: en NY kontroll, MED
anmärkningar, som är anläggningens SENASTE, på en anläggning vi sett förut.

Körs utan beroenden:  python3 pipeline/tests/test_notiser.py
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from notify import (  # noqa: E402
    build_email,
    subject_for,
    swedish_date,
    unsubscribe_for,
    worsened,
)


def inspection(ident, date, assessment, type_=0):
    return {"id": ident, "date": date, "assessment": assessment, "type": type_}


def establishment(ident, verdict, inspections, name="Kajsas Kök"):
    return {
        "id": ident,
        "slug": "kajsas-kok",
        "name": name,
        "verdict": verdict,
        "inspections": inspections,
    }


def snapshot(*establishments):
    return {
        "municipality": {"city": "Linköping", "slug": "linkoping"},
        "establishments": list(establishments),
    }


ID = "F-0580-1"


class Urval(unittest.TestCase):
    def test_ny_kontroll_med_anmarkningar_ger_notis(self):
        before = snapshot(establishment(ID, "clean", [inspection("I-0580-1", "2024-03-01", 0)]))
        after = snapshot(
            establishment(
                ID,
                "minor",
                [inspection("I-0580-2", "2026-08-01", 1), inspection("I-0580-1", "2024-03-01", 0)],
            )
        )
        found = worsened(before, after)
        self.assertIn(ID, found)
        self.assertEqual(found[ID]["inspection_id"], "I-0580-2")
        self.assertEqual(found[ID]["verdict"], "minor")

    def test_kvarstaende_brist_vid_aterbesok_ger_notis(self):
        """Modellen skärper en anmärkning till `major` när den överlevt en
        uppföljning. Notisen ska ärva den bedömningen, inte göra en egen."""
        before = snapshot(establishment(ID, "minor", [inspection("I-0580-1", "2026-05-01", 1)]))
        after = snapshot(
            establishment(
                ID,
                "major",
                [
                    inspection("I-0580-2", "2026-08-01", 1, type_=1),
                    inspection("I-0580-1", "2026-05-01", 1),
                ],
            )
        )
        self.assertEqual(worsened(before, after)[ID]["verdict"], "major")

    def test_godkand_kontroll_ger_ingen_notis(self):
        """Att en restaurang klarade en kontroll är bra men inte något man
        vill bli störd för."""
        before = snapshot(establishment(ID, "minor", [inspection("I-0580-1", "2026-05-01", 1)]))
        after = snapshot(
            establishment(
                ID,
                "clean",
                [inspection("I-0580-2", "2026-08-01", 0), inspection("I-0580-1", "2026-05-01", 1)],
            )
        )
        self.assertEqual(worsened(before, after), {})

    def test_ny_anlaggning_ger_ingen_notis(self):
        """Ingen kan bevaka något vi aldrig visat, och historiken kan vara
        flera år gammal. Utan jämförelse finns ingen förändring."""
        after = snapshot(establishment(ID, "major", [inspection("I-0580-9", "2026-08-01", 2)]))
        self.assertEqual(worsened(snapshot(), after), {})

    def test_efterregistrerad_gammal_kontroll_ger_ingen_notis(self):
        """Kommunerna fyller ibland på med gamla kontroller i klump. En
        kontroll från 2021 som dyker upp i dag säger ingenting om nuläget, och
        utan det här villkoret hade en enda sådan städning mejlat ut hela
        bevakningslistan."""
        before = snapshot(establishment(ID, "clean", [inspection("I-0580-2", "2026-05-01", 0)]))
        after = snapshot(
            establishment(
                ID,
                "clean",
                [inspection("I-0580-2", "2026-05-01", 0), inspection("I-0580-1", "2021-04-02", 2)],
            )
        )
        self.assertEqual(worsened(before, after), {})

    def test_oforandrat_bestand_ger_ingen_notis(self):
        before = snapshot(establishment(ID, "minor", [inspection("I-0580-1", "2026-05-01", 1)]))
        self.assertEqual(worsened(before, before), {})

    def test_utan_bedomning_ger_ingen_notis(self):
        """Modellen vägrar gissa när underlaget inte räcker. Ett mejl som
        påstår något om en verksamhet vi inte bedömt vore vårt eget påstående
        att försvara."""
        before = snapshot(establishment(ID, None, [inspection("I-0580-1", "2015-05-01", 0)]))
        after = snapshot(
            establishment(
                ID,
                None,
                [inspection("I-0580-2", "2016-08-01", 1), inspection("I-0580-1", "2015-05-01", 0)],
            )
        )
        self.assertEqual(worsened(before, after), {})

    def test_kontroll_utan_datum_ignoreras(self):
        """Stockholms `date` kan vara null. En kontroll utan datum går varken
        att sortera eller att skriva i ett mejl."""
        before = snapshot(establishment(ID, "clean", [inspection("I-0180-1", "2026-05-01", 0)]))
        after = snapshot(
            establishment(
                ID,
                "clean",
                [inspection("I-0180-2", None, 2), inspection("I-0180-1", "2026-05-01", 0)],
            )
        )
        self.assertEqual(worsened(before, after), {})


def item(name="Kajsas Kök", verdict="minor", token="tok-1"):
    return {
        "establishment_id": ID,
        "token": token,
        "name": name,
        "city": "Linköping",
        "date": "2026-08-01",
        "verdict": verdict,
        "inspection_id": "I-0580-2",
        "url": "https://prikko.se/linkoping/kajsas-kok/",
    }


class Mejlet(unittest.TestCase):
    def test_avregistrering_finns_alltid(self):
        """Kravet, inte artigheten. Ett mejl utan avregistreringslänk får
        aldrig gå iväg."""
        url, label = unsubscribe_for([item()])
        body = build_email([item()], url, label)
        self.assertIn("/sluta-bevaka/?t=tok-1", body)
        self.assertIn("Sluta bevaka Kajsas Kök", body)

    def test_flera_verksamheter_erbjuder_avregistrering_fran_allt(self):
        url, label = unsubscribe_for([item(), item(name="Bageriet", token="tok-2")])
        self.assertIn("allt=1", url)
        self.assertEqual(label, "Sluta bevaka alla verksamheter")

    def test_en_rad_per_verksamhet(self):
        items = [item(), item(name="Bageriet")]
        url, label = unsubscribe_for(items)
        body = build_email(items, url, label)
        self.assertIn("Kajsas Kök", body)
        self.assertIn("Bageriet", body)
        self.assertEqual(body.count("Läs vad kommunen skrev"), 2)

    def test_namn_med_specialtecken_escapas(self):
        """Namnen kommer ur kommunernas register och är fritext. Ett `&` i ett
        restaurangnamn får inte ha sönder markupen, och en vinkelparentes får
        inte bli en tagg."""
        items = [item(name='Bar & Bistro <Ost>')]
        url, label = unsubscribe_for(items)
        body = build_email(items, url, label)
        self.assertIn("Bar &amp; Bistro &lt;Ost&gt;", body)
        self.assertNotIn("<Ost>", body)

    def test_inga_kommentarer_folj_med_ut(self):
        """Mallens kommentarer är längre än mejlet och är skrivna för den som
        ändrar den. Gmail klipper brev över 102 kB."""
        items = [item()]
        url, label = unsubscribe_for(items)
        body = build_email(items, url, label)
        self.assertNotIn("<!--", body)

    def test_mejlet_namner_ingen_annan_verksamhet(self):
        """Ingen värstinglista i miniatyr. Mejlet handlar bara om det
        mottagaren själv valt att bevaka."""
        items = [item()]
        url, label = unsubscribe_for(items)
        body = build_email(items, url, label)
        self.assertNotIn("Bageriet", body)
        self.assertEqual(body.count("Kajsas Kök"), 3)  # rad, ämnesrad-eko, avregistrering

    def test_amnesrad(self):
        self.assertEqual(subject_for([item()]), "Ny kontroll hos Kajsas Kök")
        self.assertEqual(
            subject_for([item(), item(name="Bageriet")]),
            "Nya kontroller hos 2 verksamheter du bevakar",
        )

    def test_datum_pa_svenska(self):
        self.assertEqual(swedish_date("2026-08-01"), "1 augusti 2026")
        self.assertEqual(swedish_date("2026-12-24T00:00:00"), "24 december 2026")


if __name__ == "__main__":
    unittest.main(verbosity=2)
