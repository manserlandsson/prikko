/**
 * Märket som fristående fil, en per utgåva.
 *
 * Verksamheten laddar ner den och sätter den i fönstret, på menyn eller på sin
 * egen sajt. Filen är därför den enda delen av Prikko som lever helt utanför
 * sajten, och det ställer två krav som inget annat här har.
 *
 * 1. Den måste bära sitt årtal i själva bilden. Ett märke utan årtal blir ett
 *    påstående om nuläget så fort det lämnat oss, och det påståendet kan vi
 *    inte stå för dagen efter nästa kontroll.
 * 2. Den måste kunna slås upp. XML-kommentaren överst pekar tillbaka på
 *    utgåvan, så att den som hittar filen lös kan se exakt vad som gällde.
 *
 * Märket är GENERISKT och nämner ingen verksamhet. Ett märke med namn i hade
 * krävt 1 541 filer, och namnet i filen hade dessutom gjort det svårare att
 * upptäcka om någon som inte står i listan använder det. Vem som fick
 * utmärkelsen avgörs av listan, inte av bilden.
 */
import type { APIRoute } from 'astro';
import { sealDocument } from '../../../lib/marke';
import { editions } from '../../../lib/utmarkelser';
import { absolute } from '../../../lib/urls';

export function getStaticPaths() {
  return editions().map((e) => ({ params: { year: String(e.year) } }));
}

export const GET: APIRoute = ({ params }) => {
  const year = Number(params.year);
  return new Response(sealDocument(year, absolute('utmarkelser', year)), {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
