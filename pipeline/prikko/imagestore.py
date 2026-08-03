"""Objektlagring för bilder som pipelinen hämtar.

Varför en egen lagring över huvud taget:

Bygget ligger på drygt 16 400 filer och Cloudflare Pages gratisplan tar 20 000
per sajt. 8 802 verksamheter har både koordinat och en typ där en fasadbild hör
hemma. Räkningen går inte ihop, så bilderna kan aldrig checkas in i repot. De
ska ligga i objektlagring utanför bygget, precis som ägarnas uppladdade bilder
redan gör. Se docs/13_bilder_och_verksamhetsdata.md, del D.

Varför Cloudflare R2 och inte Supabase Storage:

R2:s gratisnivå är 10 GB lagring och, det som avgör, ingen avgift alls för
utgående trafik. Supabase Storage ger 1 GB och 10 GB trafik i månaden, vilket
en artikel i lokalpressen kan spränga. En sajt som lever på söktrafik ska inte
ha ett trafiktak på sina bilder. Ägaruppladdningarna ligger kvar i Supabase
eftersom moderering och radsäkerhet redan sitter där.

Ingen nyckel är hårdkodad och ingen får bli det. Allt läses ur miljön:

    R2_ACCOUNT_ID           kontots id, syns i R2-panelens URL
    R2_BUCKET               bucketens namn, t.ex. prikko-bilder
    R2_ACCESS_KEY_ID        från R2 → Manage API tokens
    R2_SECRET_ACCESS_KEY    visas EN gång när token skapas
    R2_PUBLIC_BASE_URL      https://bilder.prikko.se eller https://pub-....r2.dev

Saknas någon av dem är lagringen okonfigurerad, och den som frågar får veta det
i stället för att få en trasig URL.

KLICKVÄGEN, som bara ägaren kan gå:

  1. dash.cloudflare.com → R2 Object Storage → Create bucket.
     Namn: prikko-bilder. Location: Automatic. Klicka Create bucket.
  2. Bucketen → Settings → Public access → Custom domains, alternativt
     R2.dev subdomain → Allow Access. Det första är att föredra: en egen
     underdomän, t.ex. bilder.prikko.se, går att byta lagring bakom senare
     utan att varje URL i databasen blir fel. r2.dev-adressen är dessutom
     hastighetsbegränsad av Cloudflare och avsedd för utveckling.
     Adressen som visas här är R2_PUBLIC_BASE_URL.
  3. R2 Object Storage → API → Manage API tokens → Create Account API token.
     Permissions: Object Read & Write. Specify bucket: prikko-bilder.
     TTL: Forever. Klicka Create.
  4. Sidan visar Access Key ID och Secret Access Key. Hemligheten visas EN
     gång. Access Key ID är R2_ACCESS_KEY_ID, hemligheten
     R2_SECRET_ACCESS_KEY.
  5. R2-översikten visar Account ID i högerspalten. Det är R2_ACCOUNT_ID.
  6. Lägg alla fem i ~/.prikko-env, aldrig i site/.env och aldrig i repot:

         export R2_ACCOUNT_ID=...
         export R2_BUCKET=prikko-bilder
         export R2_ACCESS_KEY_ID=...
         export R2_SECRET_ACCESS_KEY=...
         export R2_PUBLIC_BASE_URL=https://bilder.prikko.se

Gratisnivån är 10 GB lagring, 1 miljon skrivningar och 10 miljoner läsningar
per månad. 8 802 bilder à cirka 60 kB WebP är ungefär 530 MB och 8 802
skrivningar, alltså långt innanför.

R2 talar S3-protokollet, så autentiseringen är AWS Signature Version 4.
Den är implementerad här i stället för via boto3, eftersom hela pipelinen går
på standardbiblioteket och kontrollbygget installerar inga paket.
"""

from __future__ import annotations

import hashlib
import hmac
import os
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Protocol

#: R2 har inga regioner. S3-protokollet kräver ändå ett värde, och Cloudflare
#: dokumenterar "auto".
REGION = "auto"
SERVICE = "s3"
ALGORITHM = "AWS4-HMAC-SHA256"


class StorageError(RuntimeError):
    pass


class Store(Protocol):
    """Det pipelinen behöver av en lagring: lägg bytes någonstans, få en URL."""

    def put(self, key: str, data: bytes, content_type: str) -> str:
        ...


# ---------------------------------------------------------------------------
# Signering
# ---------------------------------------------------------------------------


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _sign(key: bytes, message: str) -> bytes:
    return hmac.new(key, message.encode("utf-8"), hashlib.sha256).digest()


def _quote_key(key: str) -> str:
    """URI-koda objektnyckeln men behåll snedstrecken som sökvägsavgränsare."""
    return urllib.parse.quote(key, safe="/~")


def canonical_request(
    method: str,
    path: str,
    headers: dict[str, str],
    payload_hash: str,
) -> tuple[str, str]:
    """Kanonisk begäran och listan över signerade huvuden, enligt SigV4.

    Bruten ur signeringen för att kunna testas för sig. Formatet är exakt: en
    felplacerad radbrytning ger ett giltigt men värdelöst signaturvärde, och
    felet syns först som 403 från R2.
    """
    lowered = {k.lower(): v.strip() for k, v in headers.items()}
    signed = ";".join(sorted(lowered))
    canonical_headers = "".join(f"{k}:{lowered[k]}\n" for k in sorted(lowered))
    request = "\n".join(
        [
            method,
            path,
            "",  # tom frågesträng
            canonical_headers,
            signed,
            payload_hash,
        ]
    )
    return request, signed


def authorization_header(
    *,
    method: str,
    host: str,
    path: str,
    payload: bytes,
    content_type: Optional[str],
    access_key: str,
    secret_key: str,
    now: datetime,
    extra_headers: Optional[dict[str, str]] = None,
    region: str = REGION,
    service: str = SERVICE,
) -> dict[str, str]:
    """Färdiga huvuden för en signerad S3-begäran mot R2.

    `region` och `service` är parametrar enbart för att kunna prova
    implementationen mot AWS egna publicerade testvektorer, som är i us-east-1.
    R2 kör alltid på förvalen.
    """
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    datestamp = now.strftime("%Y%m%d")
    payload_hash = _sha256(payload)

    headers = {
        "host": host,
        "x-amz-content-sha256": payload_hash,
        "x-amz-date": amz_date,
    }
    if content_type:
        headers["content-type"] = content_type
    if extra_headers:
        headers.update(extra_headers)
    request, signed = canonical_request(method, path, headers, payload_hash)

    scope = f"{datestamp}/{region}/{service}/aws4_request"
    to_sign = "\n".join([ALGORITHM, amz_date, scope, _sha256(request.encode("utf-8"))])

    key = _sign(f"AWS4{secret_key}".encode("utf-8"), datestamp)
    key = _sign(key, region)
    key = _sign(key, service)
    key = _sign(key, "aws4_request")
    signature = hmac.new(key, to_sign.encode("utf-8"), hashlib.sha256).hexdigest()

    headers["Authorization"] = (
        f"{ALGORITHM} Credential={access_key}/{scope}, "
        f"SignedHeaders={signed}, Signature={signature}"
    )
    return headers


# ---------------------------------------------------------------------------
# Cloudflare R2
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class R2Store:
    account_id: str
    bucket: str
    access_key: str
    secret_key: str
    public_base_url: str

    @property
    def host(self) -> str:
        return f"{self.account_id}.r2.cloudflarestorage.com"

    def put(self, key: str, data: bytes, content_type: str) -> str:
        path = f"/{self.bucket}/{_quote_key(key)}"
        headers = authorization_header(
            method="PUT",
            host=self.host,
            path=path,
            payload=data,
            content_type=content_type,
            access_key=self.access_key,
            secret_key=self.secret_key,
            now=datetime.now(timezone.utc),
        )
        request = urllib.request.Request(
            f"https://{self.host}{path}", data=data, headers=headers, method="PUT"
        )
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                response.read()
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")[:400]
            raise StorageError(f"R2 PUT {key} → {exc.code}: {detail}") from exc
        except OSError as exc:
            raise StorageError(f"R2 PUT {key} → {exc}") from exc

        return f"{self.public_base_url.rstrip('/')}/{_quote_key(key)}"


# ---------------------------------------------------------------------------
# Lokal katalog
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class LocalStore:
    """Skriver till en katalog i stället för till R2.

    Finns för att kunna köra igenom hela kedjan utan konto: hämtning,
    nedskalning, namngivning och den URL som hamnar i databasen. Katalogen
    ligger med avsikt utanför `site/`, så att en provkörning aldrig kan råka
    lägga tusentals filer i bygget.
    """

    directory: Path
    public_base_url: str

    def put(self, key: str, data: bytes, content_type: str) -> str:
        target = self.directory / key
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        return f"{self.public_base_url.rstrip('/')}/{_quote_key(key)}"


# ---------------------------------------------------------------------------
# Val av lagring
# ---------------------------------------------------------------------------

REQUIRED = (
    "R2_ACCOUNT_ID",
    "R2_BUCKET",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_PUBLIC_BASE_URL",
)


def missing_settings(env: Optional[dict] = None) -> list[str]:
    """Vilka miljövariabler som saknas. Tom lista betyder färdigkonfigurerat."""
    source = os.environ if env is None else env
    return [name for name in REQUIRED if not (source.get(name) or "").strip()]


def from_env(env: Optional[dict] = None) -> Optional[R2Store]:
    """R2-lagringen ur miljön, eller None om den inte är konfigurerad.

    Returnerar hellre None än en halvt ifylld lagring. Anroparen ska säga till
    om att bilder hoppas över, inte skriva en URL som pekar ingenstans.
    """
    source = os.environ if env is None else env
    if missing_settings(source):
        return None
    return R2Store(
        account_id=source["R2_ACCOUNT_ID"].strip(),
        bucket=source["R2_BUCKET"].strip(),
        access_key=source["R2_ACCESS_KEY_ID"].strip(),
        secret_key=source["R2_SECRET_ACCESS_KEY"].strip(),
        public_base_url=source["R2_PUBLIC_BASE_URL"].strip(),
    )
