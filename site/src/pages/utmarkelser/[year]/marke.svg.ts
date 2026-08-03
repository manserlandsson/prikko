/**
 * Märket som fil, en per utgåva.
 *
 * Samma URL används på två sätt: sidorna visar den som `<img>`, och
 * verksamheten laddar ner den och sätter den i fönstret, på menyn eller på sin
 * egen sajt. Att det är en och samma fil är avsiktligt. Fanns det en variant
 * för skärm och en för nedladdning skulle de förr eller senare visa olika
 * saker, och då är märket i fönstret inte längre samma märke som listan delar
 * ut.
 *
 * Två krav som ingenting annat på sajten har, eftersom filen lever utanför den:
 *
 * 1. Den måste bära sitt årtal i själva bilden. Ett märke utan årtal blir ett
 *    påstående om nuläget så fort det lämnat oss, och det påståendet kan vi
 *    inte stå för dagen efter nästa kontroll.
 * 2. Den måste kunna slås upp. XML-kommentaren överst pekar tillbaka på
 *    utgåvan, så att den som hittar filen lös kan se exakt vad som gällde.
 *
 * Märket är GENERISKT och nämner ingen verksamhet. Ett märke med namn i hade
 * krävt 1 541 filer, och namnet hade dessutom gjort det svårare att upptäcka om
 * någon som inte står i listan använder det. Vem som fick utmärkelsen avgörs av
 * listan, inte av bilden.
 */
import type { APIRoute } from 'astro';
import { markDocument } from '../../../lib/marke';
import { editions } from '../../../lib/utmarkelser';
import { absolute } from '../../../lib/urls';

export function getStaticPaths() {
  return editions().map((e) => ({ params: { year: String(e.year) } }));
}

export const GET: APIRoute = ({ params }) => {
  const year = Number(params.year);
  return new Response(markDocument(year, absolute('utmarkelser', year)), {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // Märket ändras aldrig inom en utgåva, och filen ligger på 1 541 sidor
      // som annars hämtar den om och om igen.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
