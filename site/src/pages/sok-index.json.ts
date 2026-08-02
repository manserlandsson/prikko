import type { APIRoute } from 'astro';
import { establishments, municipalities } from '../lib/data';

/**
 * Sökregistret som en egen fil i stället för inbakat i /sok.
 *
 * Registret låg tidigare i ett <script type="application/json"> mitt i
 * söksidan. Det gjorde /sok till ett 2,4 MB HTML-dokument som måste laddas
 * ner i sin helhet innan sidan ens ritades — och laddas ner igen vid varje
 * besök, eftersom HTML sällan cachas länge. Som egen fil hämtas den efter
 * att sidan ritats, ligger kvar i webbläsarens cache och komprimeras av
 * servern som vilken statisk resurs som helst.
 *
 * Formatet är arrayer, inte objekt. Med 14 500 poster kostar nyckelnamnen i
 * ett objektformat mer än datan de beskriver.
 *
 * Den normaliserade söksträngen skickas INTE med. Den var en kopia av namn,
 * adress och ort i gemener och stod för ungefär halva filen. Klienten bygger
 * den själv en gång när registret laddats.
 *
 * När beståndet växer nationellt byts den här filen mot ett serveranrop.
 * Formatet utåt får då se likadant ut.
 */
export const prerender = true;

export const GET: APIRoute = () => {
  const kommuner = municipalities();
  const kommunIndex = new Map(kommuner.map((m, i) => [m.slug, i]));

  // Ordningen speglar VERDICTS. -1 = ingen bedömning.
  const verdicts = ['clean', 'minor', 'major'];
  const verdictIndex = new Map(verdicts.map((v, i) => [v, i]));

  const rows = establishments().map((e) => [
    e.name,
    e.address ?? '',
    e.slug,
    kommunIndex.get(e.municipality.slug) ?? 0,
    e.verdict ? (verdictIndex.get(e.verdict) ?? -1) : -1,
  ]);

  const body = JSON.stringify({
    k: kommuner.map((m) => [m.slug, m.city]),
    v: verdicts,
    e: rows,
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Registret byts bara när pipelinen kört. En timme är kort nog att en
      // rättelse syns samma dag och lång nog att bläddra utan att hämta om.
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
