/**
 * Emblemet: märket som lämnar sajten och sätts upp någon annanstans.
 *
 * Ritningen finns redan, se lib/marke.ts. Den här filen handlar om det som
 * saknades: formaten, den färdiga kodsnutten, och vem som får sätta upp den.
 *
 * ============================================================================
 * 1. Varför det inte blev en emblemsida per verksamhet
 * ============================================================================
 *
 * Beställningen var en sida per utmärkt verksamhet. 254 sidor ryms i bygget:
 * det ligger på 16 780 filer mot Cloudflares tak på 20 000, så plats är inte
 * skälet.
 *
 * Skälet är att sidorna inte kan ranka. En emblemsida för AG i Stockholm
 * konkurrerar om exakt samma sökning som AG:s egen verksamhetssida, alltså
 * namnet plus hygien, och den sidan är starkare på varje mått: den har
 * kontrollhistorik, karta, foto och omdömen medan emblemsidan har en bild och
 * en textruta. Två sidor om samma sak på samma domän gör inte den ena
 * synligare, de delar på den signal en av dem hade fått ensam.
 *
 * Ägarens princip är dessutom uttrycklig: en funktion får aldrig kosta en
 * sida, funktioner sker där man står. Att hämta sitt emblem är en funktion.
 *
 * Kvar blir EN sida, /utmarkelser/emblem/, som är något annat än en
 * verksamhetssida. Den söks upp på "hygienmärke", "visa hygienbetyg på
 * hemsidan" och "utmärkelse livsmedelskontroll", alltså sökningar där ingen
 * verksamhet nämns och där vi i dag inte har någon sida alls. Verksamheten
 * väljs på plats i ett fält, och adressen kan bära valet i förväg
 * (?v=stockholm/ag) så att en länk från företagsytan landar färdigt ifylld.
 *
 * ============================================================================
 * 2. Det svåra: ett emblem som kan bli osant
 * ============================================================================
 *
 * Frågan var om emblemet ska vara en fryst årsutgåva eller ett dynamiskt
 * märke som hämtas från oss vid varje visning och därmed alltid visar
 * nuläget.
 *
 * Det ska sägas först att vi KAN bygga det dynamiska. Sajten är statisk, men
 * site/functions/api/ratta.ts är redan en Cloudflare Pages Function, alltså
 * finns apparaten och en emblemrutt hade varit ännu en fil i samma katalog.
 * Beslutet är därför inte tekniskt, och får inte motiveras som om det vore.
 *
 * Svaret är fryst, och skälen är fyra.
 *
 * FÖRST: ett dynamiskt emblem blir ett negativt emblem. Om märket försvinner
 * eller bleknar den vecka kommunen noterar en avvikelse, då är frånvaron ett
 * offentligt påstående, publicerat av oss på verksamhetens egen webbplats,
 * om att något hänt. Det är precis det vi har förbjudit oss själva: vi delar
 * aldrig ut ett märke som säger att någon är dålig. Ett dynamiskt märke gör
 * det ändå, bara genom att sluta lysa. Ett årtal kan aldrig göra det.
 *
 * SEDAN: dynamiken löser inte det problem den påstår sig lösa. Det som
 * verkligen kan hänga kvar som en lögn är papperet i fönstret, och ingen
 * serverlogik når dit. Det som räddar papperet är att det bär sitt årtal, och
 * bär det årtalet så behövs ingen server för skärmen heller.
 *
 * SEDAN: en bild som hämtas per visning gör oss till en tredje part på någon
 * annans webbplats. Varje besökare hos restaurangen skickar sin IP-adress och
 * sin referrer till oss, utan att stå i deras integritetspolicy och utan att
 * ha valt det. Ett märke ska inte vara ett spårpixel.
 *
 * SIST: det binder deras sajt till vår drifttid. Ligger vi nere är det inte
 * vår sida som ser trasig ut utan deras.
 *
 * Det som ändå ska stå med, eftersom det är den starkaste invändningen mot
 * beslutet: ett fryst emblem KAN sitta uppe hos ett ställe som numera har
 * brister. Det är inte löst, det är hanterat, och mekanismen är delad i två
 * halvor som fungerar olika:
 *
 *   PÅ WEBBEN gäller påståendet plus länken. Ritningen står still och säger
 *   2026, medan länken går till verksamhetens sida hos oss, där dagens
 *   bedömning räknas om vid varje uppdatering. Den som ser märket är ett
 *   klick från nuläget. Därför är länken inte marknadsföring utan villkor,
 *   och därför bär kodsnutten alltid en <a> och aldrig en lös <img>.
 *
 *   I FÖNSTRET finns ingen länk, och då är årtalet allt som finns. Det är
 *   skälet till att det står i själva ritningen och inte i texten omkring,
 *   och skälet till att PNG-filerna rasteriseras ur exakt samma ritning som
 *   skärmen visar. Samma konstruktion som Michelin och Danmarks Elite-Smiley.
 *
 * Priset för beslutet står också skrivet: skulle vi någon gång vilja ha ett
 * dynamiskt märke måste snutten bytas ut hos var och en som satt upp den,
 * eftersom /utmarkelser/2026/marke.svg är samma bild för alla och inte kan
 * börja svara olika per verksamhet. Det är ett utskick och inte en migrering.
 *
 * Den utvägen fanns: lägga verksamheten i adressen redan nu, till exempel som
 * marke.svg?v=stockholm/ag, som statisk hosting struntar i men en framtida
 * Function kan läsa. Den är vald bort. En parameter som inte gör något i dag
 * är en parameter ingen kan förklara, den ser ut som spårning i en snutt någon
 * ska våga klistra in, och det enda den köper är förmågan att dra tillbaka ett
 * enskilt märke i efterhand. Just den förmågan är samma sak som det negativa
 * emblemet ovan, alltså inte något vi vill ha.
 *
 * ============================================================================
 * 3. Varför bilden är generisk och snutten är personlig
 * ============================================================================
 *
 * Märket nämner ingen verksamhet, se huvudet i pages/utmarkelser/[year]/
 * marke.svg.ts. Det som skiljer en verksamhets emblem från en annans är
 * länken det sitter i, och länken är text. Alltså behövs tre bildfiler per
 * utgåva och noll per verksamhet, oavsett om utgåvan har 254 eller 25 000.
 */
import { markRatio, markTitle } from './marke';
import { absolute, path } from './urls';
import { latestEdition, standings } from './utmarkelser';

/**
 * PNG-bredderna, i pixlar, och vad var och en är till för.
 *
 * Talet ÄR filens bredd i pixlar, inklusive marginalen. 2 400 px är 203 mm
 * vid 300 dpi, alltså full bredd på ett A4 med marginal kvar.
 */
export const RASTER = [
  { width: 1000, purpose: 'Sociala medier och nyhetsbrev' },
  { width: 2400, purpose: 'Utskrift, 203 mm vid 300 dpi' },
] as const;

/**
 * Luften runt ritningen i PNG-filerna, som andel av filens bredd.
 *
 * SVG:n har ingen: den sätts i ett dokument som redan har marginaler. En PNG
 * hamnar i ett inlägg eller på ett papper där den är hela ytan, och ett märke
 * som går ut i kanten läser som avskuret.
 */
export const RASTER_PAD = 0.07;

/** Vit botten i PNG. Skälet står i pngGeometry. */
export const RASTER_BG = '#FFFFFF';

export interface RasterGeometry {
  /** Filens mått. `width` är alltid talet i filnamnet. */
  width: number;
  height: number;
  /** Ritningens mått inuti marginalen. */
  inner: { width: number; height: number };
  pad: number;
}

/**
 * Måtten på en PNG, räknade ur ritningens egen viewBox.
 *
 * Bottnen är vit och inte genomskinlig. Kontrasten i MARK_INK är uppmätt mot
 * vitt (4,28:1), och en genomskinlig PNG hamnar på svart så fort någon lägger
 * den i ett mörkt inlägg, där samma blå ligger på 3,1:1. SVG:n är däremot
 * genomskinlig, eftersom den sätts på en sida vars bakgrund vi kan se.
 */
export function pngGeometry(year: number, width: number): RasterGeometry {
  const pad = Math.round(width * RASTER_PAD);
  const innerWidth = width - pad * 2;
  const innerHeight = Math.round(innerWidth / markRatio(year));
  return {
    width,
    height: innerHeight + pad * 2,
    inner: { width: innerWidth, height: innerHeight },
    pad,
  };
}

/** Filnamnet för en PNG-bredd. Ett ställe, så att rutt och sida är överens. */
export function pngName(width: number): string {
  return `marke-${width}.png`;
}

/**
 * Bredden märket får i den färdiga kodsnutten.
 *
 * 180 px är samma storlek som sigillet har på verksamhetssidan i mobilläge.
 * Stort nog att årtalet går att läsa, litet nog att få plats i en sidfot,
 * vilket är där den här sortens märke nästan alltid hamnar.
 */
export const EMBED_WIDTH = 180;

export interface EmblemFile {
  href: string;
  /** Vad man laddar ner, som det står i listan. */
  label: string;
  purpose: string;
  /** "SVG" eller "PNG". */
  kind: string;
  size: string;
}

/** Filerna en utgåva delar ut, i den ordning de ska stå. */
export function emblemFiles(year: number): EmblemFile[] {
  const base = path('utmarkelser', year);
  const svgHeight = Math.round(EMBED_WIDTH / markRatio(year));
  return [
    {
      href: `${base}marke.svg`,
      label: 'Märket som SVG',
      purpose: 'Webb. Skalar utan att bli suddig, genomskinlig botten',
      kind: 'SVG',
      size: `${EMBED_WIDTH} × ${svgHeight} px som standard, valfri storlek`,
    },
    ...RASTER.map((r) => {
      const g = pngGeometry(year, r.width);
      return {
        href: `${base}${pngName(r.width)}`,
        label: `Märket som PNG, ${r.width} px`,
        purpose: r.purpose,
        kind: 'PNG',
        size: `${g.width} × ${g.height} px, vit botten`,
      };
    }),
  ];
}

export interface EmblemHolder {
  /** Kommunens slug, alltså första ledet i adressen. */
  municipality: string;
  /** Kommunens namn i bestämd form, som det står i utgåvan. */
  municipalityName: string;
  /** Ortnamnet, för gruppering i väljaren. */
  city: string;
  slug: string;
  name: string;
  year: number;
}

/** Nyckeln som bär ett val genom en adress: `stockholm/ag`. */
export function holderKey(h: Pick<EmblemHolder, 'municipality' | 'slug'>): string {
  return `${h.municipality}/${h.slug}`;
}

/**
 * Verksamheterna som får ett emblem, ur den senaste utgåvan.
 *
 * Bara den senaste. Ett emblem är något man sätter upp nu, och den som står i
 * flera utgåvor sätter upp den färskaste. Äldre utgåvor finns kvar och deras
 * märken slutar aldrig gälla, men de behöver ingen egen väg att hämtas: de
 * ligger på sin utgåvas sida.
 *
 * Ordningen är kommun och sedan namn, alltså samma ordning som väljaren visar.
 */
export function emblemHolders(): EmblemHolder[] {
  const edition = latestEdition();
  if (!edition) return [];

  const holders: EmblemHolder[] = [];
  for (const m of standings(edition.year)) {
    for (const q of m.qualified) {
      holders.push({
        municipality: m.slug,
        municipalityName: m.name,
        city: m.city,
        slug: q.slug,
        name: q.name,
        year: edition.year,
      });
    }
  }

  return holders.sort(
    (a, b) => a.city.localeCompare(b.city, 'sv') || a.name.localeCompare(b.name, 'sv'),
  );
}

/** Verksamheterna grupperade på kommun, för väljarens optgroups. */
export function holdersByCity(): Array<{ city: string; holders: EmblemHolder[] }> {
  const groups = new Map<string, EmblemHolder[]>();
  for (const h of emblemHolders()) {
    const bucket = groups.get(h.city) ?? [];
    bucket.push(h);
    groups.set(h.city, bucket);
  }
  return [...groups.entries()].map(([city, holders]) => ({ city, holders }));
}

/**
 * Den färdiga kodsnutten.
 *
 * Tre saker är inte utbytbara och står därför i villkoren också:
 *
 *  1. Adresserna är ABSOLUTA. Snutten klistras in på någon annans domän, där
 *     /utmarkelser/2026/marke.svg pekar på deras egen sajt och ger en trasig
 *     bild.
 *  2. Det är en LÄNK och inte en lös bild. Länken är emblemets färskhetsgaranti,
 *     se huvudet i den här filen.
 *  3. `width` och `height` står utskrivna. Utan dem hoppar deras layout när
 *     bilden landar, och ett märke som får sidan att skaka tas ned igen.
 *
 * `loading="lazy"` står INTE här. Märket hamnar oftast i en sidfot, men vi vet
 * inte det, och ett lazy-attribut på något som ligger högt upp fördröjer bara
 * bilden. Att välja åt dem är att gissa om en sida vi inte sett.
 */
export function emblemSnippet(holder: EmblemHolder): string {
  const width = EMBED_WIDTH;
  const height = Math.round(width / markRatio(holder.year));
  const target = absolute(holder.municipality, holder.slug);
  const image = new URL(
    `${path('utmarkelser', holder.year)}marke.svg`,
    absolute(),
  ).href;

  return (
    `<a href="${target}" target="_blank" rel="noopener">\n` +
    `  <img src="${image}"\n` +
    `       alt="${markTitle(holder.year)}"\n` +
    `       width="${width}" height="${height}">\n` +
    `</a>`
  );
}

/** Adressen till verksamhetens egen sida. Visas bredvid snutten. */
export function holderUrl(holder: EmblemHolder): string {
  return absolute(holder.municipality, holder.slug);
}
