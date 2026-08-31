/**
 * Vilka rader kommunens registeruppgift får bli på sidan.
 *
 * Modulen finns av samma skäl som `harNagot` i lib/kontakt.ts: sidmallen måste
 * kunna veta OM panelen får något att visa innan den ritar lådan runt den. En
 * `.panel` med ram, radie och skugga runt noll rader är en tom vit ruta i
 * spalten, och sajten visar hellre ingenting än en tom ruta.
 *
 * Urvalet, alltså vilka fyra av intygets sexton fält som får synas och varför
 * de tolv andra inte får det, står i sin helhet i
 * site/src/components/Foretagsregister.astro. Här bor bara mekaniken.
 */
import type { Registration } from './db';
import { formatDate } from './data';

export interface Registerrad {
  label: string;
  value: string;
}

/** Bolagsformen i löptext. Bara de former som får en egen rad, se nedan. */
const FORM: Record<string, string> = {
  enskild: 'Enskild firma',
};

/*
 * Namnen jämförs avskalade. "Allegrine" och "Allegrine " är samma skylt, och
 * en rad som upprepar sidans rubrik är brus.
 *
 * Bolagsändelsen skalas däremot INTE bort. "Pizzeria Roma" och "Pizzeria Roma
 * AB" är olika parter, skylten och den juridiska personen, och att det finns
 * ett bolag med nästan samma namn är precis vad raden finns för att säga.
 */
const skala = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Raderna panelen ska bära, i ordning. Tom lista betyder ingen panel alls.
 *
 * @param name Verksamhetens namn, för att slippa upprepa det som "Drivs av".
 */
export function registerrader(r: Registration, name: string): Registerrad[] {
  /*
   * "DRIVS AV" KRÄVER ETT ORGANISATIONSNUMMER, och det är en integritetsregel
   * och inte en teknikalitet.
   *
   * Pipelinen håller inne numret när det är en fysisk persons, se
   * `ar_personnummer`. Kommunens fält "Livsmedelsföretagare" bär i samma fall
   * personens NAMN: "Pierre Oanes", "Åsa Johansson Ef Niddes Café", "Dana
   * Halanova Ef". Att hålla inne numret och skriva ut namnet är att hålla inne
   * halva uppgiften.
   *
   * SEDAN 2026-08-31 KOMMER NAMNET INTE ENS HIT. `utan_personuppgifter` i
   * pipeline/prikko/stockholmsintyg.py sållar `operator` på samma villkor som
   * numret, och 498 rader i stockholm.json som bar ett namn står nu som null.
   * Villkoret nedan står ändå kvar, och ska stå kvar. Det är samma två lager
   * som gäller personnumret: en spärr i pipelinen så att uppgiften aldrig når
   * ett bygge, och en grind här så att den inte skrivs ut om den ändå gör det.
   * Ett fält som är tomt i dag kan fyllas av en annan kommun i morgon.
   *
   * En enskild firma HAR ingen juridisk person, alltså är innehavarens namn
   * en personuppgift. Det är samma slutsats som docs/12 avsnitt C drar om
   * numret, och den gäller ord för ord om namnet. Sidan bär dessutom en
   * hygienbedömning, vilket är en tyngre sammanställning än en neutral
   * företagslistning, och där väger försiktigheten ännu tyngre.
   *
   * Villkoret är alltså numret och inte `companyForm`. Sju rader bär varken
   * nummer eller läsbar form, eftersom staden skrivit "Enskild firma. Se
   * övrigt." i sifferfältet på bland annat Kriminalvården och
   * Specialpedagogiska Skolmyndigheten. Att de sju faller med är billigt; en
   * regel med undantag är det inte.
   *
   * Kvar står 7 423 rader där den som driver stället ÄR ett bolag, och där är
   * raden en upplysning ingen annan yta på sidan bär.
   */
  const drivsAv =
    r.orgnr && r.operator && skala(r.operator) !== skala(name)
      ? r.operator
      : null;

  /* Företagsformen står BARA när numret hålls inne, alltså på enskild firma.
     Med ett utskrivet organisationsnummer säger raden "Aktiebolag" det numret
     redan säger, och panelen ska ha så få rader som den har upplysningar. */
  const form = !r.orgnr && r.companyForm ? (FORM[r.companyForm] ?? null) : null;

  return [
    drivsAv && { label: 'Drivs av', value: drivsAv },
    r.orgnr && { label: 'Organisationsnummer', value: r.orgnr },
    form && { label: 'Företagsform', value: form },
    r.registeredAt && { label: 'Registrerad', value: formatDate(r.registeredAt) },
  ].filter(Boolean) as Registerrad[];
}
