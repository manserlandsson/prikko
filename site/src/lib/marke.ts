/**
 * Märket: en lagerkrans om wordmarken, och under den utgåvans årtal.
 *
 * Ritningen är Måns egen. Originalet ligger i brand/, och
 * `scripts/importera-marke.mjs` gör om den till modulen
 * `src/marks/utmarkelse-<år>.ts`. Det skriptets huvud förklarar både varför det
 * är en ritning per årtal och varför kompilatet är en modul och inte en .svg.
 *
 * ## Varför årtalet bär hela konstruktionen
 *
 * Ett märke i ett fönster tas inte ned den dag kommunen hittar en avvikelse,
 * och verksamheten har ingen skyldighet att göra det. Därför får märket aldrig
 * påstå något om NULÄGET. Det påstår att verksamheten fanns med i en namngiven
 * årsutgåva, vilket är sant för alltid och går att slå upp. Samma konstruktion
 * som Michelin och Danmarks Elite-Smiley, och det enda sättet vi kan låta ett
 * märke lämna sajten utan att riskera att det ljuger.
 *
 * ## Varför sidorna länkar till filen i stället för att baka in den
 *
 * Ritningen är 10 kB. Den ska stå på 1 541 verksamhetssidor plus utgåvornas
 * egna, och inbakad hade den kostat de kilobyten på varje enskild sida utan
 * att någon av dem kan dela dem med nästa. Som `<img src>` hämtas filen en
 * gång och ligger sedan i webbläsarens cache.
 *
 * Det ger också något bättre än en optimering: den bild sidan visar och den
 * fil verksamheten laddar ner är samma URL. De kan inte glida isär.
 *
 * ## Varför källfilen ändå bär currentColor
 *
 * Källan är färglös och färgen sätts när filen serveras. Det var också det som
 * gjorde två ritningar till en: Måns blå och grå visade sig vara samma ritning
 * med tjugo enheters skillnad i sidmarginal, jämförda koordinat för koordinat.
 * Vill någon ha en dämpad variant är det en substitution till ur samma källa,
 * inte en andra ritning att hålla synkroniserad.
 */

/**
 * Märkets färg i den serverade filen.
 *
 * Måns ritning bär #007BE0, vilket är `--brand` ur tokens.css exakt. Värdet
 * står som literal här och inte som `var(--brand)` därför att filen är
 * fristående: den hamnar i ett trycksaksprogram eller på någon annans sajt och
 * har ingen tokens.css att ärva ur. Ändras `--brand` måste den här raden
 * ändras med den.
 *
 * Kontrast mot vitt och mot `--canvas` (#FCFCFD): 4,28:1. Det räcker för
 * grafik, där WCAG 1.4.11 kräver 3:1, och för årtalet, som renderas långt över
 * gränsen för stor text. Måns gråa variant ligger på 3,60:1 och duger till form
 * men inte till brödtext, vilket är ett av skälen till att den blå är den som
 * serveras.
 */
export const MARK_INK = '#007BE0';

interface Mark {
  year: number;
  /** SVG-koden som den ligger i src/marks, alltså med currentColor. */
  source: string;
  /** Bredd genom höjd ur viewBox. Märket är brett, inte kvadratiskt. */
  ratio: number;
}

interface MarkModule {
  year: number;
  viewBox: string;
  source: string;
}

/**
 * Ritningarna upptäcks ur filsystemet, precis som kommunerna i db.ts och
 * utgåvorna i utmarkelser.ts. En ny årsritning är en fil, inte en kodändring.
 *
 * Modulerna är GENERERADE av scripts/importera-marke.mjs och inte .svg-filer.
 * Skälet står i det skriptets huvud: Astro gör om varje .svg under src/ till en
 * komponent, och att i stället läsa filens text via `?raw` fick bygget att
 * snurra utan att ta slut. En modul går förbi hela den apparaten.
 */
const files = import.meta.glob<MarkModule>('../marks/utmarkelse-*.ts', {
  eager: true,
});

const MARKS = new Map<number, Mark>();

for (const [file, module] of Object.entries(files)) {
  const { year, viewBox, source } = module;
  if (!Number.isInteger(year) || !viewBox || !source) {
    throw new Error(`${file} ser inte ut som en genererad märkesmodul.`);
  }

  const box = viewBox.trim().split(/\s+/).map(Number);
  if (box.length !== 4 || !box[2] || !box[3]) {
    throw new Error(`${file} har en viewBox som inte går att skala: ${viewBox}`);
  }

  MARKS.set(year, { year, source, ratio: box[2] / box[3] });
}

export function hasMark(year: number): boolean {
  return MARKS.has(year);
}

function mark(year: number): Mark {
  const found = MARKS.get(year);
  if (found) return found;
  throw new Error(
    `Ingen ritning för ${year}. Lägg Måns fil i brand/ och kör ` +
      `node scripts/importera-marke.mjs <fil> ${year} från site/.`,
  );
}

/**
 * Förhållandet mellan bredd och höjd.
 *
 * Måns märke är brett, inte runt: kransen står som två grenar kring
 * wordmarken. Sidorna sätter bredden och räknar höjden ur det här talet, så
 * att layouten inte hoppar om en framtida ritning har andra proportioner.
 */
export function markRatio(year: number): number {
  return mark(year).ratio;
}

/** Vad märket betyder, som text. Används som alt-text och som bildtext. */
export function markTitle(year: number): string {
  return `Prikkos utmärkelse ${year}: genomgående utan anmärkningar`;
}

/**
 * Filen som serveras och laddas ner.
 *
 * Kommentaren överst finns för den som hittar filen lös, utan sidan omkring.
 * Den säger vad märket avser och var det går att slå upp, vilket är skillnaden
 * mellan ett märke och en bild av en lagerkrans.
 */
export function markDocument(year: number, editionUrl: string): string {
  const { source } = mark(year);
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    `<!-- ${markTitle(year)}. Utmärkelsen avser ${year} års utgåva och säger ` +
    `ingenting om nuläget. Vad som gällde då: ${editionUrl} -->\n` +
    source
      .replace(/currentColor/g, MARK_INK)
      .replace('<svg ', `<svg role="img" aria-label="${markTitle(year)}" `) +
    '\n'
  );
}
