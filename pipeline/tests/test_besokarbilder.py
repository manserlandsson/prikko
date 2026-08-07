"""Test för bilder från besökare.

En bild på en namngiven näringsverksamhet är det farligaste en främling kan
skicka in på den här sajten. Till skillnad från en text går innehållet inte att
läsa igenom maskinellt, den kan föreställa fel ställe, och den kan bära
personuppgifter i själva bildrutan. Hela funktionen vilar därför på fyra
spärrar, och testerna nedan finns för att var och en av dem ska gå sönder högt i
stället för tyst:

  1. Bara den som skrivit ett eget omdöme om samma verksamhet får skicka en
     bild, och den som FÖRETRÄDER verksamheten får det inte. Ägarens bildyta
     blir en betaltjänst; den ska inte smygas in genom besökarflödet.
  2. Raden skrivs före filen. Vänds ordningen är varje kvot verkningslös,
     eftersom bucketens policy bara kan se vilken mapp en fil hamnar i.
  3. Ingen bild syns förrän en människa släppt fram den, och en avslagen bild
     RADERAS ur lagringen i stället för att bara flaggas.
  4. Ingenting av det här går in i ett bygge eller i public.images.

Körs utan beroenden:  python3 pipeline/tests/test_besokarbilder.py
"""

import io
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import moderate  # noqa: E402

ROT = Path(__file__).resolve().parents[2]
SCHEMAT = (ROT / "pipeline" / "schema_community.sql").read_text(encoding="utf-8")
KLIENTEN = (ROT / "site" / "src" / "lib" / "community.ts").read_text(encoding="utf-8")
RUTAN = (ROT / "site" / "src" / "components" / "Reviews.astro").read_text(encoding="utf-8")
VISNINGEN = (ROT / "site" / "src" / "components" / "Bilder.astro").read_text(encoding="utf-8")
VILLKOREN = (ROT / "site" / "src" / "pages" / "villkor.astro").read_text(encoding="utf-8")


def block(sql: str, start: str, slut: str = ";") -> str:
    """Texten från `start` fram till första `slut` efter den."""
    i = sql.index(start)
    return sql[i : sql.index(slut, i)]


class Uppladdningspolicyn(unittest.TestCase):
    """Vem som får skicka in en bild, och vem som inte får det."""

    def setUp(self):
        self.policy = block(SCHEMAT, "create policy image_uploads_insert")

    def test_bilden_kraver_inget_omdome(self):
        """Ägarens beslut, och testet finns för att det inte ska krypa tillbaka.

        "Man ska såklart kunna ladda upp bilder endast, behöver ej va text."
        En bild utan omdöme ska gå igenom policyn, alltså måste `review_id is
        null` vara ett godkänt fall.
        """
        self.assertIn("review_id is null", self.policy)
        self.assertNotIn(
            "r.body is not null",
            self.policy,
            "Kravet på text är borttaget och ska inte återinföras.",
        )

    def test_ett_angivet_omdome_maste_vara_eget_och_gälla_samma_stalle(self):
        # Villkoret gäller bara när review_id är satt, men då gäller det helt.
        # Utan `r.user_id = auth.uid()` räcker någon annans omdöme, och utan
        # establishment_id räcker ett omdöme om vilken verksamhet som helst för
        # att lägga bilder på vilken annan som helst.
        self.assertIn("from community.reviews r", self.policy)
        self.assertIn("r.user_id = auth.uid()", self.policy)
        self.assertIn("r.establishment_id = image_uploads.establishment_id", self.policy)
        self.assertIn("r.id = image_uploads.review_id", self.policy)

    def test_kolumnen_ar_nullbar(self):
        # `not null` på review_id hade gjort policyn ovan verkningslös: raden
        # kan då inte skrivas utan ett omdöme oavsett vad policyn tillåter.
        rad = re.search(r"review_id\s+uuid references community\.reviews \(id\)[^,\n]*", SCHEMAT)
        self.assertIsNotNone(rad)
        self.assertNotIn("not null", rad.group(0))

    def test_ingen_tom_omdomesrad_skapas_som_bakvag(self):
        # Rutan skickar bara ett omdöme när det finns ett betyg eller en text.
        # Ett tomt omdöme för att bära en bild hade dessutom fällts av
        # review_says_something.
        self.assertIn("stars || body", RUTAN)
        self.assertIn("review_says_something", SCHEMAT)

    def test_foretradare_ar_utestangd(self):
        # `not exists` och inte `exists`. Det här är hela ägarens beslut: bilder
        # i omdömesflödet är gästernas, och verksamhetens egen bildyta är en
        # betaltjänst som inte finns. Ett `exists` här hade vänt regeln rakt om.
        self.assertIn(
            "and not exists (",
            self.policy,
            "Policyn ska stänga ute den som har ett godkänt anspråk på "
            "verksamheten. Utan `not exists` kan en företrädare lägga sina egna "
            "bilder i besökarnas flöde.",
        )
        # Villkoret börjar vid `not exists` och gäller anspråken. Att leta i
        # resten av policyn räcker: `not exists` är den enda negationen där.
        efter = self.policy[self.policy.index("and not exists (") :]
        self.assertIn("select 1 from community.establishment_claims c", efter)
        self.assertIn("c.establishment_id = image_uploads.establishment_id", efter)
        self.assertIn("c.status = 'published'", efter)
        # Och att anspråken bara nämns EN gång, i det negerade villkoret. Två
        # omnämnanden hade betytt att någon lagt tillbaka ägarvägen bredvid.
        self.assertEqual(
            self.policy.count("establishment_claims"),
            1,
            "Anspråk ska bara nämnas i det villkor som stänger ute företrädaren.",
        )

    def test_rutan_tar_emot_en_insandning_som_bara_ar_bilder(self):
        # En bild ensam ska räcka för att knappen ska göra något. Villkoret som
        # stoppar en tom insändning måste därför räkna bilderna med.
        self.assertIn("!stars && !body && chosen.length === 0", RUTAN)

    def test_kraver_bekraftad_ratt_till_bilden(self):
        self.assertIn("and rights_confirmed", self.policy)

    def test_kolumnen_ar_false_som_forval(self):
        # Policyn kräver true. Är förvalet något annat kan en rad utan
        # försäkran skrivas genom att fältet utelämnas.
        self.assertRegex(
            SCHEMAT,
            r"rights_confirmed\s+boolean not null default false",
        )

    def test_ingen_uppdatering_for_inloggade(self):
        # Vägen från pending till published går bara genom moderate.py.
        self.assertRegex(
            SCHEMAT,
            r"revoke update on community\.image_uploads\s+from anon, authenticated",
        )


class Kvoterna(unittest.TestCase):
    """Triggern som håller granskningskön hanterbar.

    Kvoterna står i en trigger och inte i policyn av ett enda skäl: en trigger
    kan säga på svenska varför den sa nej, och texten går rakt ut till den som
    laddar upp. En avvisad rad från en policy säger bara att radsäkerheten
    fällde den.
    """

    def setUp(self):
        self.kropp = block(
            SCHEMAT, "create or replace function community.set_image_status()", "$$;"
        )

    def test_statusen_kommer_aldrig_utifran(self):
        self.assertIn("new.status := 'pending'", self.kropp)
        self.assertIn("new.published_url := null", self.kropp)

    def test_sokvagen_maste_ligga_i_egen_mapp(self):
        # Utan den här kan en rad peka på någon annans fil, och bucketens policy
        # hade då släppt in en skrivning där enbart för att raden fanns.
        self.assertIn("'pending/' || new.user_id::text || '/%'", self.kropp)

    def test_tre_kvoter_med_lasbara_skal(self):
        for gräns, ord in ((">= 5", "dygn"), (">= 3", "verksamhet"), (">= 10", "granskning")):
            self.assertIn(gräns, self.kropp)
            self.assertIn(ord, self.kropp)

    def test_taket_per_verksamhet_raknar_bort_avslagna(self):
        # En avslagen bild ska inte förbruka en plats. Annars straffas den som
        # skickat något som inte höll av att aldrig kunna försöka igen.
        self.assertIn("i.status <> 'rejected'", self.kropp)

    def test_kvoten_i_rutan_stammer_med_kvoten_i_databasen(self):
        # Sex i klienten och tre i databasen hade låtit besökaren välja bilder
        # som sedan avvisas en efter en.
        self.assertIn("const MAX_FILES = 3;", RUTAN)


class Lagringen(unittest.TestCase):
    """Bucketen ska vara stängd som förval."""

    def setUp(self):
        self.policy = block(SCHEMAT, 'create policy "inkomna_upload_own"')

    def test_filen_kraver_en_vantande_rad_pa_samma_sokvag(self):
        self.assertIn("from community.image_uploads u", self.policy)
        self.assertIn("u.storage_path = storage.objects.name", self.policy)
        self.assertIn("u.status = 'pending'", self.policy)

    def test_gamla_anspraksvillkoret_ar_borta(self):
        # Kravet på ett godkänt anspråk NÅGONSTANS var det som stängde ute
        # besökare. Ligger det kvar är funktionen avstängd i praktiken.
        self.assertNotIn("establishment_claims", self.policy)

    def test_klienten_skriver_raden_fore_filen(self):
        rad = KLIENTEN.index("await rest('POST', 'image_uploads'")
        fil = KLIENTEN.index("storage/v1/object/${INBOX_BUCKET}")
        self.assertLess(
            rad,
            fil,
            "Raden måste skrivas före filen. Med filen först kan vem som helst "
            "med ett konto fylla bucketen utan att skapa en rad, och varje kvot "
            "i databasen vaktar då en dörr ingen behöver gå igenom.",
        )

    def test_klienten_stadar_raden_om_filen_inte_kom_fram(self):
        self.assertIn("await rest('DELETE', `image_uploads?id=eq.", KLIENTEN)
        self.assertIn("create policy image_uploads_delete_own", SCHEMAT)


class Borttagning(unittest.TestCase):
    """Rätten att ta tillbaka en bild man skickat in.

    Bar tidigare av kaskaden från omdömet: att ta bort bilden var att ta bort
    omdömet den hängde på. En fristående bild har ingen sådan väg, så rätten
    måste finnas för sig.
    """

    def test_alla_egna_rader_gar_att_ta_bort(self):
        policy = block(SCHEMAT, "create policy image_uploads_delete_own")
        self.assertIn("using (user_id = auth.uid())", policy)
        self.assertNotIn(
            "status = 'pending'",
            policy,
            "Villkoret på pending höll bara när varje bild hängde på ett "
            "omdöme. En fristående publicerad bild hade suttit fast för alltid.",
        )

    def test_filen_gar_att_ta_bort_ur_bada_bucketarna(self):
        inkomna = block(SCHEMAT, 'create policy "inkomna_delete_own"')
        self.assertIn("(storage.foldername(name))[2] = auth.uid()::text", inkomna)
        publika = block(SCHEMAT, 'create policy "publika_delete_own"')
        self.assertIn("(storage.foldername(name))[1] = auth.uid()::text", publika)

    def test_klienten_tar_filen_fore_raden(self):
        # Omvänt mot uppladdningen, och av samma skäl: den ofarliga riktningen
        # vinner. En fil utan rad ligger kvar på en publik URL som ingen kan nå
        # eller städa bort.
        kropp = KLIENTEN[KLIENTEN.index("export async function deleteUpload(") :]
        kropp = kropp[: kropp.index("\n}\n")]
        fil = kropp.index("method: 'DELETE'")
        rad = kropp.index("await rest('DELETE', `image_uploads?id=eq.")
        self.assertLess(fil, rad)

    def test_kontosidan_har_en_knapp(self):
        konto = (ROT / "site" / "src" / "pages" / "konto" / "index.astro").read_text(
            encoding="utf-8"
        )
        self.assertIn("deleteUpload", konto)
        self.assertIn("quietButton('Ta bort'", konto)


class Heic(unittest.TestCase):
    """iPhones förvalda format, hela vägen.

    Att stänga ute HEIC var vårt eget beslut och stängde ute den vanligaste
    kameran våra besökare har. Ägaren rev det: "varför tillåts ej heic bilder
    att ladda upp? så länge det inte är något dåligt med dom, så låt dom."

    Kedjan har fyra led och vart och ett kan stoppa en bild tyst:
    filväljaren, klientens kontroll, hinken, och konverteringen före publicering.
    """

    def test_filvaljaren_grayar_inte_ut_iphone_bilder(self):
        # BÅDE MIME-typen och ändelsen. macOS filväljare matchar på det den
        # känner igen, och utan `.heic` är iPhone-bilder oklickbara.
        rad = re.search(r'id="review-files"[^>]*accept="([^"]+)"', RUTAN, re.S)
        self.assertIsNotNone(rad, "Hittade inget accept-attribut på filfältet.")
        accept = rad.group(1)
        for väntat in ("image/heic", "image/heif", ".heic", ".heif"):
            self.assertIn(väntat, accept)

    def test_klienten_tar_emot_heic(self):
        for typ in ("'image/heic'", "'image/heif'"):
            self.assertIn(typ, KLIENTEN)

    def test_klienten_klarar_en_tom_filtyp(self):
        # Flera webbläsare lämnar `file.type` TOM för HEIC eftersom formatet inte
        # står i deras tabell. En tom sträng är inte ett nej, den är ett vet
        # inte, och då är ändelsen det enda vi har.
        self.assertIn("export function imageType(file: File)", KLIENTEN)
        kropp = KLIENTEN[KLIENTEN.index("export function imageType(file: File)") :]
        kropp = kropp[: kropp.index("\n}\n")]
        self.assertIn("file.name.toLowerCase()", kropp)
        self.assertIn("'image/heic'", kropp)

    def test_ingen_egen_formatlista_i_rutan(self):
        # Två listor glider isär. Rutan ska fråga imageType() och inte ha en
        # egen uppräkning som säger nej till något databasen tar emot.
        self.assertNotIn("const ALLOWED = [", RUTAN)
        self.assertIn("if (!imageType(file))", RUTAN)

    def test_databasen_tar_emot_heic(self):
        villkor = block(SCHEMAT, "add constraint image_uploads_content_type_check")
        for typ in ("'image/heic'", "'image/heif'"):
            self.assertIn(typ, villkor)

    def test_inkomna_hinken_tar_emot_heic(self):
        hink = block(SCHEMAT, "values ('verksamhetsbilder-inkomna'")
        self.assertIn("'image/heic'", hink)
        self.assertIn("'image/heif'", hink)

    def test_publika_hinken_tar_ALDRIG_emot_heic(self):
        """Den bärande regeln. En publicerad bild måste kunna visas av alla.

        Chrome och Firefox kan inte avkoda HEIC, så en HEIC i den publika hinken
        hade varit en bild som är osynlig för de flesta besökare.
        """
        hink = block(SCHEMAT, "values ('verksamhetsbilder',")
        self.assertNotIn("heic", hink)
        self.assertNotIn("heif", hink)
        self.assertIn("'image/jpeg'", hink)
        # `do nothing` hade låtit en hink som skapats för hand behålla sina egna
        # inställningar tyst, alltså också en som råkar tillåta heic.
        self.assertIn("on conflict (id) do update", hink)

    def test_taket_racker_for_en_okomprimerad_heic(self):
        # En HEIC som webbläsaren inte kan avkoda går iväg orörd. Åtta megabyte
        # var för snävt för en 48-megapixelbild.
        self.assertIn("between 1 and 12582912", SCHEMAT)
        self.assertIn("file_size_limit = excluded.file_size_limit", SCHEMAT)
        self.assertIn("12582912", block(SCHEMAT, "values ('verksamhetsbilder-inkomna'"))
        self.assertIn("const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;", KLIENTEN)
        self.assertIn("const MAX_BYTES = 12 * 1024 * 1024;", RUTAN)

    def test_miniatyren_faller_tillbaka_nar_bilden_inte_kan_ritas(self):
        # En trasig bildikon läser som ett fel, och filen är hel.
        self.assertIn("thumb.addEventListener('error'", RUTAN)
        self.assertIn("ingen-forhandsvisning", RUTAN)


class Konvertering(unittest.TestCase):
    """Själva omvandlingen, körd mot en riktig HEIC-fil.

    Testet SKIPPAS där verktygen saknas, alltså i CI på Linux. Det är avsiktligt:
    granskningen körs av ägaren på en Mac, och det är den maskinen provet gäller.
    """

    @classmethod
    def setUpClass(cls):
        cls.heic = None
        if not shutil.which("sips"):
            return
        try:
            from PIL import Image
        except ImportError:
            return

        cls.folder = tempfile.mkdtemp()
        jpg = os.path.join(cls.folder, "in.jpg")
        heic = os.path.join(cls.folder, "in.heic")

        image = Image.new("RGB", (3000, 2000), (40, 90, 60))
        # Metadata som en telefon faktiskt bär, inklusive koordinaten.
        exif = Image.Exif()
        exif[271] = "Apple"
        exif[272] = "iPhone 15 Pro"
        gps = exif.get_ifd(0x8825)
        gps[1] = "N"
        gps[2] = ((59, 1), (20, 1), (0, 1))
        image.save(jpg, quality=95, exif=exif)

        if subprocess.run(
            ["sips", "-s", "format", "heic", jpg, "--out", heic], capture_output=True
        ).returncode == 0 and os.path.exists(heic):
            cls.heic = heic

    def setUp(self):
        if not self.heic:
            self.skipTest("sips eller Pillow saknas, alltså inte den här maskinen")

    def test_utfallet_ar_en_nedskalad_jpeg(self):
        from PIL import Image

        jpeg = moderate.heic_to_jpeg(open(self.heic, "rb").read())
        image = Image.open(io.BytesIO(jpeg))
        self.assertEqual(image.format, "JPEG")
        self.assertEqual(max(image.size), moderate.MAX_EDGE)

    def test_metadatan_foljer_inte_med(self):
        """Den enda platsen där EXIF kan tas bort på HEIC-vägen.

        Den vanliga vägen tappar metadatan i webbläsaren, på en canvas. HEIC-
        vägen finns just för att webbläsaren INTE kunde rita bilden, alltså är
        det här sista chansen. Omdömen är anonyma, och en bild med koordinaten
        till fotografens hem är inte anonym.
        """
        from PIL import Image

        jpeg = moderate.heic_to_jpeg(open(self.heic, "rb").read())
        exif = Image.open(io.BytesIO(jpeg)).getexif()
        self.assertEqual(dict(exif), {})
        self.assertEqual(dict(exif.get_ifd(0x8825)), {})


class Komprimeringen(unittest.TestCase):
    """Bilden ritas om innan den lämnar datorn.

    Två skäl, och det andra är det tyngre: filen blir liten, och EXIF försvinner.
    En canvas bär ingen metadata, alltså följer varken GPS-koordinat eller
    kameramodell med. Sedan omdömen blev anonyma är det inte en förbättring utan
    ett krav.
    """

    def test_langsta_sidan_ar_begransad(self):
        self.assertIn("const MAX_EDGE = 1600;", KLIENTEN)

    def test_bilden_ritas_om_pa_en_canvas(self):
        self.assertIn("createImageBitmap(file, { imageOrientation: 'from-image' })", KLIENTEN)
        self.assertIn("canvas.toBlob(", KLIENTEN)

    def test_komprimeringen_sitter_fore_uppladdningen(self):
        krymp = KLIENTEN.index("const sending = await shrink(file);")
        fil = KLIENTEN.index("storage/v1/object/${INBOX_BUCKET}")
        self.assertLess(krymp, fil)

    def test_storleken_som_skickas_ar_den_komprimerade(self):
        # byte_size och content_type måste beskriva filen som FAKTISKT skrivs,
        # annars stämmer varken kontrollvillkoret i databasen eller det
        # granskaren ser. Skillnaden märks på HEIC: samma fil blir en JPEG i
        # Safari och förblir en HEIC i Chrome.
        self.assertIn("byte_size: sending.size", KLIENTEN)
        self.assertIn("const type = imageType(sending)", KLIENTEN)
        self.assertIn("content_type: type,", KLIENTEN)


class Visningen(unittest.TestCase):
    """Publicerade bilder läses i webbläsaren, aldrig ur ett bygge."""

    def test_vyn_valjer_sina_kolumner(self):
        vy = block(SCHEMAT, "create view community.published_images")
        for kolumn in ("i.id", "i.establishment_id", "i.published_url", "i.created_at"):
            self.assertIn(kolumn, vy)

    def test_vyn_lacker_inte_uppladdaren(self):
        vy = block(SCHEMAT, "create view community.published_images")
        for känsligt in ("user_id", "moderated_by", "rejection_reason", "storage_path"):
            self.assertNotIn(
                känsligt,
                vy,
                f"'{känsligt}' hör inte hemma i en publik vy. En bild bredvid ett "
                "anonymt omdöme får inte vara vägen till att identifiera den som "
                "skrev det.",
            )

    def test_vyn_visar_bara_publicerade_med_url(self):
        vy = block(SCHEMAT, "create view community.published_images")
        self.assertIn("i.status = 'published'", vy)
        self.assertIn("i.published_url is not null", vy)

    def test_vyn_ar_security_invoker(self):
        # Utan det går vyn förbi radsäkerheten på tabellen under.
        self.assertIn(
            "alter view community.published_images set (security_invoker = true)", SCHEMAT
        )

    def test_avsnittet_ar_tomt_i_bygget(self):
        # Samma regel som omdömena: ingenting en besökare skickat in får ligga
        # i en byggd fil. Rutnätet ska vara tomt i mallen.
        self.assertIn('<div class="grid" id="bilder-grid"></div>', VISNINGEN)

    def test_avsnittet_kan_observeras_nar_det_ar_hopfallt(self):
        # `display: none` ger ingen låda, och en IntersectionObserver på ett
        # element utan låda utlöser aldrig. Bilderna hade då aldrig hämtats.
        tom = block(VISNINGEN, ".bilder.tom {", "}")
        self.assertIn("visibility: hidden", tom)
        self.assertNotIn("display: none", tom)

    def test_avsnittet_tar_ingen_plats_nar_det_ar_tomt(self):
        # Sidmallen ger varje syskon i huvudkolumnen marginal, indrag och en
        # hårlinje. Alla fyra måste nollas, annars ritas en avdelare mitt på
        # sidan som inte delar av något.
        tom = block(VISNINGEN, ".bilder.tom {", "}")
        for egenskap in ("height: 0", "margin-top: 0", "padding-top: 0", "border-top: 0"):
            self.assertIn(egenskap, tom)

    def test_ingen_brodtext_som_forklarar_funktionen(self):
        """docs/18_sprakregler.md: sidan visar, den förklarar inte.

        Ingen rad om varifrån bilderna kommer och ingen om vad funktionen gör.
        Rubriken och bilderna räcker. Testet läser bara MARKUPEN, inte filens
        kommentarer: en kommentar ska förklara mycket, det är brödtexten som
        ska vara mager.
        """
        markup = VISNINGEN[VISNINGEN.index("---\n", VISNINGEN.index("const {")) :]
        markup = markup[: markup.index("<style")]
        # Kommentarerna i mallen står som {/* ... */} och räknas inte som text.
        synligt = re.sub(r"\{/\*.*?\*/\}", "", markup, flags=re.S)

        # `<p[\s>]` och inte `<p`: krysset i förstoringen är en <path>.
        self.assertIsNone(
            re.search(r"<p[\s>]", synligt),
            "Avsnittet ska inte bära något stycke text.",
        )
        for ord in ("besökare", "inskickad", "kommer från", "moderer", "granskn"):
            self.assertNotIn(ord, synligt.lower(), f"'{ord}' är en förklaring och ska bort.")


class Villkoren(unittest.TestCase):
    """Vilken rätt Prikko får till en inskickad bild."""

    def test_licensen_star_i_villkoren(self):
        self.assertIn("Om du skickar in en bild", VILLKOREN)
        self.assertIn("icke-exklusiv", VILLKOREN)
        self.assertIn("Du behåller upphovsrätten", VILLKOREN)

    def test_rutan_lankar_till_villkoren(self):
        self.assertIn('href="/villkor/"', RUTAN)
        self.assertIn('id="review-rights"', RUTAN)


# ---------------------------------------------------------------------------
# moderate.py
# ---------------------------------------------------------------------------


class FalskDatabas:
    """En Supabase som svarar med förberedda rader och antecknar vad som gjordes.

    Räcker för att pröva verktygets beslut. Det som ska fångas här är inte
    HTTP-lagret utan ordningen: att en avslagen bild verkligen raderas, och att
    en besökares bild aldrig hamnar i public.images.
    """

    def __init__(self, rader=None, filer=None):
        self.rader = rader or {}
        self.filer = filer or {}
        self.patchar = []
        self.raderade = []
        self.kopior = []
        self.uppladdade = []
        self.publika_skrivningar = []
        self.url = "https://exempel.supabase.co"

    def community(self, method, path, body=None, prefer=""):
        if method == "PATCH":
            self.patchar.append((path, body))
            return []
        tabell = path.split("?")[0]
        for nyckel, rader in self.rader.items():
            if nyckel == tabell:
                return rader
        return []

    def public(self, method, path, body=None, prefer=""):
        if method == "POST":
            self.publika_skrivningar.append((path, body))
        return []

    def sign(self, bucket, path, seconds=3600):
        return f"{self.url}/signerad/{path}"

    def copy_object(self, source, destination):
        self.kopior.append((source, destination))

    def download_object(self, bucket, path):
        return self.filer.get(path, b"\x00heic")

    def upload_object(self, bucket, path, data, content_type):
        self.uppladdade.append((bucket, path, content_type, len(data)))

    def remove_object(self, bucket, path):
        self.raderade.append((bucket, path))

    def public_url(self, path):
        return f"{self.url}/storage/v1/object/public/verksamhetsbilder/{path}"


BILD = {
    "id": "b1",
    "user_id": "u1",
    "establishment_id": "F-0580-1",
    "review_id": "r1",
    "storage_path": "pending/u1/abc.jpg",
    "content_type": "image/jpeg",
    "status": "pending",
    "published_url": None,
}

HEIC = dict(
    BILD,
    storage_path="pending/u1/abc.heic",
    content_type="image/heic",
)

OMDOME = {
    "id": "r1",
    "body": "God mat och rent i lokalen, trevlig personal hela kvällen.",
    "rating": 4,
    "status": "published",
    "establishment_id": "F-0580-1",
}


class Publicering(unittest.TestCase):
    def test_bilden_kopieras_och_far_en_url(self):
        db = FalskDatabas({"image_uploads": [BILD], "reviews": [OMDOME]})
        moderate.cmd_publish(db, "bild", "b1", None)

        self.assertEqual(db.kopior, [("pending/u1/abc.jpg", "u1/abc.jpg")])
        path, body = db.patchar[-1]
        self.assertIn("image_uploads?id=eq.b1", path)
        self.assertEqual(body["status"], "published")
        self.assertTrue(body["published_url"].endswith("verksamhetsbilder/u1/abc.jpg"))
        self.assertTrue(body["moderated_by"])

    def test_ingen_rad_i_public_images(self):
        """Besökarinnehåll går aldrig in i den redaktionella databasen.

        public.images byggs in i sidorna. En bild därifrån är redaktionellt
        material; en bild från en gäst är det inte, och den ska ligga på samma
        sida om gränsen som omdömena.
        """
        db = FalskDatabas({"image_uploads": [BILD], "reviews": [OMDOME]})
        moderate.cmd_publish(db, "bild", "b1", None)
        self.assertEqual(db.publika_skrivningar, [])

    def test_bild_utan_omdome_publiceras_inte(self):
        db = FalskDatabas({"image_uploads": [BILD], "reviews": []})
        with self.assertRaises(moderate.ModerationError):
            moderate.cmd_publish(db, "bild", "b1", None)
        self.assertEqual(db.kopior, [])

    def test_bild_till_avslaget_omdome_publiceras_inte(self):
        avslaget = dict(OMDOME, status="rejected")
        db = FalskDatabas({"image_uploads": [BILD], "reviews": [avslaget]})
        with self.assertRaises(moderate.ModerationError):
            moderate.cmd_publish(db, "bild", "b1", None)
        self.assertEqual(db.kopior, [])

    def test_en_heic_konverteras_i_stallet_for_att_kopieras(self):
        """Serverkopian duger inte här, för filen ska inte vara samma fil.

        En kopia hade lagt en HEIC i den publika hinken, och den hinken avvisar
        formatet. Bilden ska hem, göras om till JPEG och skrivas som en ny fil.
        """
        db = FalskDatabas({"image_uploads": [HEIC], "reviews": [OMDOME]})
        db_heic = moderate.heic_to_jpeg
        moderate.heic_to_jpeg = lambda data: b"jpeg-bytes"
        try:
            moderate.cmd_publish(db, "bild", "b1", None)
        finally:
            moderate.heic_to_jpeg = db_heic

        self.assertEqual(db.kopior, [], "En HEIC får inte serverkopieras.")
        self.assertEqual(len(db.uppladdade), 1)
        bucket, path, content_type, _ = db.uppladdade[0]
        self.assertEqual(bucket, "verksamhetsbilder")
        self.assertEqual(content_type, "image/jpeg")
        self.assertTrue(path.endswith(".jpg"), path)
        self.assertNotIn("heic", path)

        _, body = db.patchar[-1]
        self.assertTrue(body["published_url"].endswith(".jpg"), body["published_url"])

    def test_en_jpeg_kopieras_som_forut(self):
        # Ingenting behöver hem till den här maskinen när formatet redan duger.
        db = FalskDatabas({"image_uploads": [BILD], "reviews": [OMDOME]})
        moderate.cmd_publish(db, "bild", "b1", None)
        self.assertEqual(db.kopior, [("pending/u1/abc.jpg", "u1/abc.jpg")])
        self.assertEqual(db.uppladdade, [])

    def test_redan_avgjord_bild_publiceras_inte_igen(self):
        db = FalskDatabas(
            {"image_uploads": [dict(BILD, status="published")], "reviews": [OMDOME]}
        )
        with self.assertRaises(moderate.ModerationError):
            moderate.cmd_publish(db, "bild", "b1", None)


class Avslag(unittest.TestCase):
    def test_avslagen_bild_raderas_ur_lagringen(self):
        db = FalskDatabas({"image_uploads": [BILD]})
        moderate.cmd_reject(db, "bild", "b1", "Föreställer inte verksamheten")

        self.assertEqual(db.raderade, [("verksamhetsbilder-inkomna", "pending/u1/abc.jpg")])
        path, body = db.patchar[-1]
        self.assertEqual(body["status"], "rejected")
        self.assertEqual(body["rejection_reason"], "Föreställer inte verksamheten")

    def test_avslagen_publicerad_bild_raderas_ur_bada_bucketarna(self):
        publicerad = dict(
            BILD,
            status="published",
            published_url="https://x/storage/v1/object/public/verksamhetsbilder/u1/abc.jpg",
        )
        db = FalskDatabas({"image_uploads": [publicerad]})
        moderate.cmd_reject(db, "bild", "b1", "Ägaren har begärt bort den")

        self.assertIn(("verksamhetsbilder-inkomna", "pending/u1/abc.jpg"), db.raderade)
        self.assertIn(("verksamhetsbilder", "u1/abc.jpg"), db.raderade)

    def test_en_konverterad_bild_raderas_pa_sin_riktiga_sokvag(self):
        """Sökvägen läses ur published_url och gissas inte ur storage_path.

        En HEIC byter ändelse vid publicering. Den gamla uträkningen hade letat
        efter en .heic som aldrig funnits i den publika hinken och lämnat kvar
        den .jpg som faktiskt låg på en publik adress.
        """
        publicerad = dict(
            HEIC,
            status="published",
            published_url="https://x/storage/v1/object/public/verksamhetsbilder/u1/abc.jpg",
        )
        db = FalskDatabas({"image_uploads": [publicerad]})
        moderate.cmd_reject(db, "bild", "b1", "Föreställer inte verksamheten")

        self.assertIn(("verksamhetsbilder-inkomna", "pending/u1/abc.heic"), db.raderade)
        self.assertIn(("verksamhetsbilder", "u1/abc.jpg"), db.raderade)
        self.assertNotIn(("verksamhetsbilder", "u1/abc.heic"), db.raderade)

    def test_avslag_pa_omdome_tar_bilderna_med_sig(self):
        """Text och bild granskas som en enhet.

        Att avslå en text men lämna dess bilder i kön är att låta samma
        insändning prövas två gånger, och det som fällde texten gäller nästan
        alltid bilderna med.
        """
        db = FalskDatabas({"reviews": [OMDOME], "image_uploads": [BILD]})
        moderate.cmd_reject(db, "omdome", "r1", "Namnger personal")

        self.assertEqual(db.raderade, [("verksamhetsbilder-inkomna", "pending/u1/abc.jpg")])
        avslagna = [b for p, b in db.patchar if b.get("status") == "rejected"]
        self.assertEqual(len(avslagna), 2, "Både omdömet och bilden ska avslås.")

    def test_redan_avslagen_bild_raderas_inte_en_gang_till(self):
        db = FalskDatabas(
            {"reviews": [OMDOME], "image_uploads": [dict(BILD, status="rejected")]}
        )
        moderate.cmd_reject(db, "omdome", "r1", "Namnger personal")
        self.assertEqual(db.raderade, [])

    def test_en_fil_som_redan_ar_borta_stoppar_inte_avslaget(self):
        # Kommandot ska gå att köra om utan att fastna på en fil någon redan
        # städat bort för hand.
        db = FalskDatabas({"image_uploads": [BILD]})

        def faller(bucket, path):
            raise moderate.ModerationError("404")

        db.remove_object = faller
        moderate.cmd_reject(db, "bild", "b1", "Suddig")
        self.assertTrue(any(b.get("status") == "rejected" for _, b in db.patchar))


class Granskningen(unittest.TestCase):
    def test_bilden_visas_med_sitt_omdome(self):
        db = FalskDatabas({"image_uploads": [BILD], "reviews": [OMDOME]})
        moderate.cmd_show(db, "bild", "b1")
        # Inget att hämta ur utskriften här; testet fäller om koden slutar
        # klara en bild vars omdöme finns. Det verkliga skyddet står nedan.

    def test_bild_utan_omdome_varnar_i_stallet_for_att_falla(self):
        db = FalskDatabas({"image_uploads": [BILD], "reviews": []})
        moderate.cmd_show(db, "bild", "b1")

    def test_sorten_bild_finns_kvar_i_granssnittet(self):
        self.assertEqual(moderate.KINDS["bild"], "image_uploads")


if __name__ == "__main__":
    unittest.main()
