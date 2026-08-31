/**
 * Datakälla.
 *
 * All läsning går genom den här modulen — aldrig direkt från en sidmall och
 * aldrig mot en namngiven fil. Kommuner upptäcks automatiskt: lägg en ny
 * datafil i `src/data/` och den finns på sajten. Ingen kod ska behöva ändras
 * för att lägga till en kommun.
 *
 * Källan är i dag filer som pipelinen skriver. Nästa steg är Supabase, och
 * bytet sker enbart här: signaturerna utåt är redan asynkrona och
 * kommunagnostiska, så sidmallarna påverkas inte.
 *
 * Se pipeline/schema.sql för måltabellerna.
 */

import type { Hours } from './oppettider';
import type { Contact } from './kontakt';

export type { Hours };

export type Verdict = 'clean' | 'minor' | 'major';
export type MissingReason = 'no_inspections' | 'stale_inspections';
export type AreaStatus = 'ok' | 'fixed' | 'deviation' | 'persisting';

export interface ControlArea {
  /** Livsmedelsverkets rapporteringspunkt, t.ex. "J03". */
  code: string;
  /** Övergripande område, t.ex. "Grundförutsättningar, hygien". */
  group: string;
  /** Vad punkten avser. */
  description: string;
  status: AreaStatus;
}

export interface Inspection {
  id: string;
  /** ISO-datum. En kontroll hör till ett datum, inte till en sekund. */
  date: string;
  /** 0 = inga anmärkningar, 1 = mindre, 2 = allvarliga. */
  assessment: 0 | 1 | 2;
  /** 0 = rutin, 1 = uppföljning, 2 = händelsestyrd. */
  type: 0 | 1 | 2;
  prenotified: boolean | null;
  audit: boolean;
  onSite: boolean;
  areas: ControlArea[];
  /**
   * Verksamhetens replikrätt, publicerad ORDAGRANT.
   *
   * Sidfoten och metodiksidan lovar att svaren publiceras oredigerade, och
   * det löftet hålls i tre steg. Verksamheten skriver i schemat `community`,
   * där en trigger fryser texten så att ingen kan ändra den efter
   * insändning. Redaktionen väljer sedan mellan att publicera ordagrant och
   * att avslå; någon ändra-väg finns inte. Först vid publicering skrivs
   * texten till `inspections.owner_comment` och följer med exporten hit.
   *
   * Att fältet är satt betyder alltså att en människa släppt fram exakt de
   * tecknen. Se pipeline/schema_community.sql och pipeline/moderate.py.
   */
  ownerComment?: string | null;
}

export interface StreetImage {
  /**
   * VÅR kopia av bilden, i vår egen objektlagring.
   *
   * Aldrig källans egen adress. Mapillarys miniatyr-URL:er är signerade och har
   * en utgångstid, så en sådan här ger en bild som slutar visas en tid efter
   * bygget utan att något klagar. Pipelinen laddar ned bytesen och lägger dem i
   * Cloudflare R2. Se pipeline/prikko/imagery.py.
   */
  url: string;
  /**
   * Bildens id hos källan, för länken tillbaka dit.
   *
   * För `wikimedia` är det filens namn på Commons, "Den Gyldene Freden
   * 2013a.jpg", och det är den strängen filsidans adress byggs av. För ett
   * eget foto är det ursprungsfilens namn, så att bilden går att spåra
   * tillbaka dit den kom ifrån. Se `kallans_sida` i Bildband.astro.
   */
  id: string;
  /**
   * ISO-datum, YYYY-MM-DD, eller null.
   *
   * Null är vanligt för `wikimedia`: Commons datumfält är fritext och står i
   * former som "2009", "1959-09" och "mellan 1912 och 1920". Bara ett fullt
   * datum skrivs hit, för `images.captured_at` är en `date`. ÅRTALET som visas
   * under bilden kommer därför inte härifrån utan ur `attribution`, se nedan.
   */
  capturedAt: string | null;
  /**
   * Var bilden kommer ifrån. Styr attributionen, som skiljer sig åt: Mapillarys
   * villkor kräver deras logotyp och en länk, inte bara en textrad, medan en
   * Commons-bild kräver fotografens namn, licensnamnet och en länk till
   * filsidan. Fältet är alltså inte en upplysning utan det som avgör vilken
   * komponent som får rita bilden.
   *
   * De tre sista är alla "egna" i den meningen att ingen tredje part har ett
   * villkor att uppfylla, men de är tre olika påståenden om VEM som tagit
   * bilden och de får aldrig skrivas ihop:
   *
   *   owner    verksamheten själv, inskickad genom företagsytan
   *   own      verksamhetens egen bild på annan väg
   *   prikko   VÅRT eget fotografi, taget av redaktionen och lagt i
   *            brand/egna-foton. Tillkom 2026-08-27 med ägarens tolv foton på
   *            Holy Smoke. Kräver ingen attribution, men bär `id` med
   *            ursprungsfilens namn så att bilden går att spåra tillbaka till
   *            filen den kom ur.
   */
  source?: 'mapillary' | 'panoramax' | 'owner' | 'own' | 'prikko' | 'wikimedia';
  /**
   * SPDX-beteckning, t.ex. "CC-BY-SA-4.0". För `wikimedia` läst ur Commons
   * eget maskinvärde `extmetadata.License` och aldrig ur texten för
   * människor. "PD" betyder public domain, som inte är en licens.
   */
  licence?: string | null;
  /**
   * Färdig attributionstext, t.ex. "Mapillary, CC BY-SA 4.0" eller
   * "Foto: Holger.Ellgaard, 2013".
   *
   * Byggd i pipelinen och skriven ut ordagrant av mallen. Attributionen är ett
   * licensvillkor, och den ska följa bilden genom databasen i stället för att
   * sättas ihop på nytt av varje mall som råkar visa den.
   */
  attribution?: string | null;
}

/**
 * LICENSGRINDEN, på ETT ställe.
 *
 * En bild får visas när den antingen bär en känd licenskod eller kommer från
 * en källa som inte har någon tredje part att kreditera. Utan något av de två
 * finns ingen resurs att hänvisa till, och tomt är alltid det säkra utfallet:
 * en bild utan sann licensrad är precis det vi inte får publicera.
 *
 * Regeln stod i fyra kopior: Bildyta.astro, Verksamhetskort.astro,
 * pages/index.astro och verksamhetssidan. Tre av dem sa dessutom OLIKA saker,
 * och det märktes först 2026-08-27 när källan `prikko` tillkom: kortet och
 * startsidan krävde en licenskod rakt av, alltså hade ägarens tolv egna foton
 * på Holy Smoke visats i bandet på verksamhetssidan men ersatts av en
 * platshållare i varje lista och på varje kort. En grind som gäller samma sak
 * på fyra ytor ska stå en gång.
 */
const UTAN_ATTRIBUTION = new Set(['prikko', 'own', 'owner']);

/** Sant för en bild vi står bakom själva, alltså en utan villkor att uppfylla. */
export function egenBild(image: StreetImage | null | undefined): boolean {
  return image ? UTAN_ATTRIBUTION.has(image.source ?? '') : false;
}

/** Bilden om den får visas, annars null. Se kommentaren över UTAN_ATTRIBUTION. */
export function visbarBild(image: StreetImage | null | undefined): StreetImage | null {
  if (!image?.url) return null;
  return egenBild(image) || image.licence ? image : null;
}

export type SourceType =
  | 'open_data'          // kommunen publicerar en öppen datamängd
  | 'reverse_engineered' // vi anropar samma gränssnitt som kommunens egen tjänst
  | 'scrape'
  | 'foi_request';

/**
 * Kommunens egen registeruppgift om verksamheten.
 *
 * Skrivs av pipeline/stockholmsintyg.py ur Stockholms registreringsintyg och
 * står i dag bara på stockholmsrader. Fältet är valfritt och ska förbli
 * valfritt: sajten visar uppgiften där den finns och ingenting alls där den
 * saknas, samma dom som `hours`, `contact` och `stop` redan lyder under.
 *
 * INGET AV DET HÄR ÄR VERKSAMHETENS EGEN UPPGIFT. Det som företaget självt
 * skickat in bor i community-schemat och visas av Foretagsuppgifter.astro.
 * Skillnaden är hela poängen med att de är två fält och två avsnitt.
 *
 * ORGANISATIONSNUMRET SAKNAS PÅ VARJE ENSKILD FIRMA, och det är avsiktligt.
 * Kommunens fält heter "Person/Organisationsnummer" och bär innehavarens
 * PERSONNUMMER när det inte finns någon juridisk person. Pipelinen håller
 * inne numret och låter `companyForm` bära upplysningen i stället. Se
 * `ar_personnummer` i pipeline/prikko/stockholmsintyg.py.
 *
 * `operator` SAKNAS PÅ SAMMA RADER, av samma skäl. Fältet är kommunens
 * "Livsmedelsföretagare", och utan juridisk person är det innehavarens namn.
 * 498 rader i stockholm.json bar ett sådant namn fram till 2026-08-31. Se
 * `utan_personuppgifter` i samma modul.
 */
export interface Registration {
  /** Bara ett BOLAGS nummer, aldrig en fysisk persons. Se ovan. */
  orgnr?: string | null;
  /** 'aktiebolag' | 'enskild' | 'stat_kommun' | 'ideell_forening' | ... */
  companyForm?: string | null;
  /** Livsmedelsföretagaren. Bara ett BOLAGS namn, aldrig en fysisk persons. */
  operator?: string | null;
  postalCode?: string | null;
  city?: string | null;
  /** Kommunens besked om sin EGEN registrering, Aktiv eller Inaktiv. */
  active?: boolean | null;
  /** ISO-datum då verksamheten registrerades hos kommunen. */
  registeredAt?: string | null;
  focus?: string | null;
  businessTypes?: string[];
  activities?: string[];
  /** Storleksklass: Mikro, Liten, Mellan, Stor. */
  scope?: string | null;
  /** Kommunens egen efterlevnadsbedömning. Visas inte, se Foretagsregister.astro. */
  compliance?: boolean | null;
  certified?: boolean | null;
  riskDecidedAt?: string | null;
  /** Beslutad kontrollfrekvens per fem år. Visas inte, se Foretagsregister.astro. */
  frequency?: number | null;
  /** När intyget lästes, ISO. */
  checkedAt?: string | null;
}

export interface Municipality {
  code: string;
  /** Formellt namn: "Stockholms stad". */
  name: string;
  /** Orten i grundform: "Stockholm". Härled aldrig ur `name`. */
  city: string;
  slug: string;
  sourceType?: SourceType;
}

export interface Establishment {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  types: string[];
  lat: number | null;
  lng: number | null;
  /**
   * Satt bara när koordinaten är HÄRLEDD ur adressen i stället för publicerad
   * av kommunen. Uppsala och Örebro lämnar inga koordinater; deras nålar är
   * geokodade mot OpenStreetMap. Saknas fältet kommer punkten från källan.
   */
  geoSource?: 'osm' | 'lantmateriet';
  /** 'address' = adressens egen punkt. 'approximate' = grannporten. */
  geoPrecision?: 'address' | 'approximate';
  /**
   * Öppettider ur OpenStreetMap, satt bara när pipelinen kunde para ihop
   * verksamheten med ett OSM-objekt på BÅDE namn och närhet. Uppgiften är
   * alltså aldrig kommunens, och den är inte heller vanlig: se
   * docs/33_oppettider.md för täckningen per kommun.
   *
   * Fältet är valfritt och ska förbli valfritt. Sajten visar öppettider där
   * de finns och ingenting alls där de saknas. Se lib/oppettider.ts.
   */
  hours?: Hours;
  /**
   * Telefon, webbplats, e-post och egenskaper ur SAMMA OSM-uttag som `hours`,
   * och satt på samma villkor: verksamheten måste vara hopparad med ett
   * OSM-objekt på BÅDE namn och närhet.
   *
   * Fältet står på FLER verksamheter än `hours`, inte färre. Öppettiden
   * kräver dessutom att OSM-objektet bär en `opening_hours` som vi kan tolka
   * helt; kontakten kräver bara hopparningen. 3 274 av 9 995 konsumentvända
   * mot 2 747. Se docs/37_osm_taggar.md.
   *
   * Valfritt, och ska förbli valfritt. Sajten visar uppgiften där den finns
   * och ingenting alls där den saknas. Se lib/kontakt.ts.
   */
  contact?: Contact;
  /**
   * Närmaste hållplats, packad som "Stadshuset|bus|80": namn, trafikslag och
   * avstånd FÅGELVÄGEN i hela tiotal meter. Namnet kan vara tomt.
   *
   * En sträng och inte ett objekt, av samma skäl som veckoschemat i `hours`
   * är en rad: datafilerna skrivs med indent=1, och tre nycklar gånger nio
   * tusen verksamheter hade lagt 27 000 rader i site/src/data. Uppackningen
   * är en `split` i lib/narhet.ts.
   *
   * Valfritt, och ska förbli valfritt. Sajten visar raden där den finns och
   * ingenting alls där den saknas. Se docs/38_ta_mig_hit.md.
   */
  stop?: string;
  /** Parkeringar inom 200 m, packat som "3|40": antal och avstånd till den närmaste. */
  parking?: string;
  /**
   * Kommunens registeruppgift, se `Registration`. Står i dag på Stockholms
   * 8 520 rader och på ingen annan kommun.
   */
  registration?: Registration;
  /**
   * FÖRSTABILDEN, och ingenting mer.
   *
   * Kvar som eget fält efter att listan tillkom, för det är den här bilden
   * kort, listrader, kartnålens popup och sidans og:image visar, och de
   * behöver inte veta att det finns fler. Den är alltid `images[0]`: lagret
   * härleder fältet ur listan, se `withMunicipality`, så att en fil där de två
   * råkar säga olika saker inte kan ge en förstabild i kortet och en annan i
   * bandet.
   */
  image: StreetImage | null;
  /**
   * ALLA bilder på verksamheten, i den ordning de ska visas.
   *
   * ── VARFÖR FÄLTET BLEV EN LISTA ────────────────────────────────────────
   * Ägaren 2026-08-27: "fixa så en restaurang kan ha flera bilder också,
   * första kan vara på utsidan, sedan blir det om vi laddat upp fler". Han
   * hade då just lagt tolv foton på Holy Smoke i Höganäs, och elva av dem
   * hade kastats av ett fält som bara rymde en.
   *
   * Databasen bar redan flera: `public.images` har en rad per bild och en
   * kolumn `position`, se pipeline/schema.sql. Det var EXPORTEN som tog
   * första raden och kastade resten, och sajten som bara hade ett fält att ta
   * emot dem i. Ingen tabell behövde alltså ändras.
   *
   * ── ORDNINGEN ÄR INTE KOSMETISK ────────────────────────────────────────
   * Första bilden är den som visas i listor, på kort och i kartnålens popup,
   * alltså är den vad sajten PÅSTÅR att stället ser ut som. Ordningen sätts
   * därför i pipelinen, av det bedömda motivfältet i lib/bildmotiv.data.json:
   * fasaden före byggnaden före tallriken. Se site/scripts/egna-foton.mjs
   * `sortera`. Mallen sorterar aldrig om, den läser listan som den står.
   *
   * ── ALLTID SATT, ALDRIG UNDEFINED ──────────────────────────────────────
   * Lagret fyller i fältet för varje rad, också de 15 678 utan en enda bild,
   * som får en tom lista. En anropare ska aldrig behöva välja mellan `image`
   * och `images` eller skriva `?? []`.
   *
   * I FILEN står fältet bara när det finns MER ÄN EN bild. En rad med en enda
   * bild bär bara `image`, precis som förut, och de 366 sådana raderna är
   * därför oförändrade i diffen. Se `images` i pipeline/export_supabase.py.
   */
  images: StreetImage[];
  verdict: Verdict | null;
  distinction: boolean;
  reason: string;
  modelVersion: number;
  uncertain: boolean;
  inspections: Inspection[];
  /** Fylls i av lagret, så anropare alltid vet vilken kommun posten hör till. */
  municipality: Municipality;
  /**
   * Datumet OSM-uttaget bakom `stop` och `parking` hämtades, ISO.
   *
   * Fylls i av lagret ur filens `narhet`-block och står ALDRIG på raden i
   * datafilen. Det är samma datum för hela uttaget, och nio tusen kopior av
   * det hade varit nio tusen rader utan innehåll. Att `hours.checkedAt` och
   * `contact.checkedAt` upprepas per verksamhet är ett arv och inte en
   * förebild.
   */
  narhetCheckedAt?: string;
}

interface Dataset {
  municipality: Municipality;
  source: {
    url: string;
    fetchedAt: string;
    /**
     * När KÄLLAN senast ändrades, ISO-datum. Valfritt, och står bara där
     * källan själv svarar på frågan.
     *
     * `fetchedAt` säger när VI läste filen och ingenting om hur gammalt
     * materialet är. Skillnaden är noll i en kommun vars tjänst svarar med
     * dagens läge, och den är allt i en kommun vars fil ligger stilla:
     * Norrköpings Ecos-utdrag hämtas i dag och skrevs 2024-03-17. Fältet
     * finns för att kommunsidan ska kunna säga det utan att besökaren
     * behöver klicka sig vidare. Se pipeline/fetch_ecos.py.
     */
    modifiedAt?: string;
  };
  /** Skrivs av pipeline/narhet.py, bara när filen faktiskt bär en sådan uppgift. */
  narhet?: { checkedAt: string };
  /**
   * `images` är valfritt i FILEN och står bara på rader med mer än en bild.
   * `image` är förstabilden och står som förut. Lagret gör om båda till ett
   * `images` som alltid finns, se `withMunicipality`.
   */
  establishments: (Omit<Establishment, 'municipality' | 'narhetCheckedAt' | 'images'> & {
    images?: StreetImage[];
  })[];
}

/**
 * Kommuner upptäcks från filsystemet — ingen lista i kod. `eager` krävs
 * eftersom Astro behöver datan synkront vid bygget.
 */
const files = import.meta.glob<{ default: Dataset }>('../data/*.json', {
  eager: true,
});

const datasets: Dataset[] = Object.values(files)
  .map((m) => m.default as unknown as Dataset)
  .filter((d) => d && d.municipality && Array.isArray(d.establishments))
  .sort((a, b) => a.municipality.city.localeCompare(b.municipality.city, 'sv'));

/** Alla kommuner vi har data för, i bokstavsordning. */
export function municipalities(): Municipality[] {
  return datasets.map((d) => d.municipality);
}

export function municipality(slug: string): Municipality | undefined {
  return datasets.find((d) => d.municipality.slug === slug)?.municipality;
}

export function sourceFor(slug: string) {
  return datasets.find((d) => d.municipality.slug === slug)?.source;
}

/**
 * Filens två bildfält blir ett.
 *
 * `images` vinner över `image` när båda står på raden, och `image` skrivs om
 * till listans första. Poängen är att de två aldrig kan säga olika saker om
 * vilken bild som är förstabild: kortet och bandet läser samma bild, oavsett
 * vilken väg raden tagit in i filen. En rad utan bild alls får en tom lista
 * och `image: null`, alltså exakt vad den redan hade.
 */
function bildlista(e: { image: StreetImage | null; images?: StreetImage[] }): StreetImage[] {
  if (e.images?.length) return e.images;
  return e.image ? [e.image] : [];
}

function withMunicipality(d: Dataset): Establishment[] {
  return d.establishments.map((e) => {
    const images = bildlista(e);
    return {
      ...e,
      images,
      image: images[0] ?? null,
      municipality: d.municipality,
      narhetCheckedAt: d.narhet?.checkedAt,
    };
  });
}

/**
 * Färdiga listor per kommun, plus rikslistan under nyckeln ''.
 *
 * Utan minnet byggdes listan om vid VARJE anrop, och anropen är inte få:
 * sidfoten och sökrutan ligger i baslayouten och frågar efter varje kommun på
 * varje sida. Med 14 950 sidor blev det närmare en miljard objektkopior per
 * bygge och ungefär två tredjedelar av byggtiden.
 *
 * Datan är oföränderlig under ett bygg. Filerna läses in en gång via
 * import.meta.glob, så en delad instans är säker. Villkoret är att ingen
 * anropare sorterar eller muterar listan hon får tillbaka. Alla anropare
 * filtrerar eller kopierar först (se municipalityListing), och nya måste göra
 * detsamma: sortera aldrig direkt på det establishments() returnerar.
 */
const listCache = new Map<string, Establishment[]>();

/** Alla verksamheter i landet, eller i en kommun om slug anges. */
export function establishments(slug?: string): Establishment[] {
  const key = slug ?? '';
  const cached = listCache.get(key);
  if (cached) return cached;

  const wanted = slug ? datasets.filter((d) => d.municipality.slug === slug) : datasets;
  const built = wanted.flatMap(withMunicipality);
  listCache.set(key, built);
  return built;
}

export function findEstablishment(
  slug: string,
  establishmentSlug: string,
): Establishment | undefined {
  return establishments(slug).find((e) => e.slug === establishmentSlug);
}

/** Sammanlagd täckning. Används på startsida och källsida. */
export function coverage() {
  const all = establishments();
  return {
    municipalities: datasets.length,
    establishments: all.length,
    inspections: all.reduce((n, e) => n + e.inspections.length, 0),
    assessed: all.filter((e) => e.verdict !== null).length,
  };
}
