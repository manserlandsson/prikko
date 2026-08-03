/**
 * Verksamhetens URL-segment, härlett ur namnet.
 *
 * Ordagrann portning av `slugify` i pipeline/prikko/text.py. Den är källan;
 * ändras den ska den här följa.
 *
 * ## Varför den finns i webbläsaren
 *
 * Kartan skickar hela kommunens punkter till klienten, och för Stockholm är det
 * 8 511 rader. Slugen är nästan alltid namnet en gång till, i förvanskad form,
 * och att skicka båda kostar 60 kB gzippat av en fil på 110. Klienten räknar
 * därför fram slugen ur namnet i stället.
 *
 * ## Varför det inte är farligt
 *
 * En slug som räknas fel ger en trasig länk, alltså precis det fel man aldrig
 * vill ha i utbyte mot kilobyte. Därför gissar bygget aldrig: det kör den här
 * funktionen på varje namn och JÄMFÖR med den slug pipelinen faktiskt satte.
 * De som inte stämmer skickas med som undantag, indexerade på radnummer (se
 * map-data.ts). Klienten läser undantaget om det finns och härleder annars.
 *
 * Det gör kompressionen korrekt av konstruktion i stället för av tur. Ändrar
 * pipelinen sina regler växer undantagslistan automatiskt vid nästa bygg, och
 * ingen länk går sönder under tiden.
 *
 * I dagens bestånd stämmer härledningen för 8 246 av Stockholms 8 511 rader.
 * De 265 som avviker är dubbletter som fått en sifferändelse av
 * `dedupe_slugs`: två verksamheter med samma namn kan inte ha samma URL.
 */

/**
 * Translittereras uttryckligen, före Unicode-normaliseringen.
 *
 * Utan det blir "Kött" till "ktt" i stället för "kott": NFKD delar ö i o plus
 * en kombinerande prick, och `encode('ascii','ignore')` kastar bort båda.
 * Samma tabell och samma ordning som i Python-källan.
 */
const SWEDISH: Record<string, string> = {
  å: 'a',
  ä: 'a',
  ö: 'o',
  é: 'e',
  è: 'e',
  ü: 'u',
  ø: 'o',
  æ: 'a',
};

export function slugify(name: string): string {
  let lowered = name.toLowerCase();
  for (const [char, replacement] of Object.entries(SWEDISH)) {
    lowered = lowered.split(char).join(replacement);
  }

  // Motsvarar unicodedata.normalize('NFKD', s).encode('ascii', 'ignore'):
  // dela upp tecknen och kasta allt som inte är ren ASCII.
  const asciiOnly = lowered
    .normalize('NFKD')
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\x7F]/g, '');

  const slug = asciiOnly
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug || 'namnlos';
}
