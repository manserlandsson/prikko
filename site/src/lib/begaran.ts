/**
 * Brevet som besökaren skickar själv, och regeln för när det får erbjudas.
 *
 * ---------------------------------------------------------------------------
 * VAD MODULEN GÖR OCH VAD DEN INTE GÖR
 * ---------------------------------------------------------------------------
 * Den avgör om en verksamhetssida saknar en färsk kontroll, slår upp
 * mottagaren i `begaran.data.ts`, och lämnar ifrån sig en färdig
 * `mailto:`-adress. Den vet ingenting om hur raden ser ut, det är
 * Begaran.astro, och den skickar aldrig något: länken öppnar besökarens EGEN
 * mejlklient, och brevet lämnar aldrig hens dator förrän hen trycker skicka.
 *
 * Ingen adress hos oss står i brevet. Inget svar går till oss. Ingenting om
 * besökaren lagras någonstans. Se docs/50 §6, väg A.
 *
 * ---------------------------------------------------------------------------
 * TVÅ ÅR, OCH VARFÖR JUST DET
 * ---------------------------------------------------------------------------
 * Bedömningen vilar på ett femårsfönster, `FRESHNESS_WINDOW_DAYS` i
 * pipeline/prikko/grading.py, alltså är en sida med en kontroll från 2022
 * fortfarande bedömd. Raden här har ett SNÄVARE mått med avsikt: den handlar
 * inte om huruvida vi kan bedöma, utan om huruvida uppgiften säger något om
 * NULÄGET. Två år är det mått docs/50 §9 anger, och det är samma gräns som
 * data.ts §217 använder när den kallar ett uppehåll på två år längre än nio
 * kontroller av tio.
 *
 * Gränsen räknas mot byggdagen och inte mot ett fruset datum. Sajten byggs om
 * varje gång datan hämtas, alltså glider raden in på fler sidor av sig själv
 * allteftersom kontrollerna åldras, utan att någon rör den här filen.
 *
 * ---------------------------------------------------------------------------
 * HANDLINGEN, ALDRIG UPPGIFTEN
 * ---------------------------------------------------------------------------
 * Brevet ber om kontrollrapporten som handling. Det är inte en formulering
 * utan en spärr, och skälet står i docs/50 §3.3: OSL 6 kap. 4 § låter en
 * myndighet väga arbetsbelastning mot att lämna UPPGIFT ur en handling, medan
 * TF 2 kap. 15 och 16 §§ inte har någon sådan ventil för handlingen själv. Ett
 * brev som frågar "vad blev resultatet av senaste kontrollen" öppnar den
 * dörren. Ett brev som ber om "kontrollrapporten från den senaste
 * livsmedelskontrollen av NN på adressen NN" stänger den.
 *
 * Av samma skäl nämner brevet ingen frist och inget lagrum utöver 2 kap.
 * tryckfrihetsförordningen. En handläggare som får ett brev med paragrafer och
 * tidsgränser läser det som ett krav från någon som varit i konflikt förut.
 * Den som bara ber om en handling får den.
 *
 * Sista stycket om "den senaste handlingen ni har" finns för de 1 616 sidor
 * som saknar kontroll helt. Utan det ledet vore brevet en begäran om något som
 * kanske inte finns, och svaret hade blivit ett nej i stället för en handling.
 * Det är fortfarande en handling som efterfrågas, aldrig en uppgift.
 *
 * ---------------------------------------------------------------------------
 * KODNINGEN, OCH FÄLLAN SOM INTE ÄR ANMÄLNINGSFILENS
 * ---------------------------------------------------------------------------
 * `anmalan.ts` bygger sina länkar med `URLSearchParams`, som skriver mellanslag
 * som `+`. Det är rätt där, för de adresserna går till http-formulär.
 *
 * HÄR VORE DET ETT FEL. RFC 6068 säger att frågesträngen i en `mailto:` är
 * procentkodad och att `+` är ett plustecken och ingenting annat. En ämnesrad
 * byggd med URLSearchParams hade landat som "Begäran+om+allmän+handling" i
 * mottagarens inkorg. Därför `encodeURIComponent`, som kodar mellanslag som
 * %20, och radbrytningar som CRLF, alltså %0D%0A, vilket är det RFC:n anger.
 */

import { UTLAMNARE } from './begaran.data.ts';

/** Det brevet behöver veta om verksamheten. Inget mer. */
export interface Begaranverksamhet {
  name: string;
  address: string | null;
}

export interface Begaran {
  /** Färdig `mailto:`-adress med mottagare, ämne och text. */
  href: string;
  /** Mottagaren, för den som vill se vart brevet går innan hon trycker. */
  epost: string;
}

/**
 * Två år räknat från en dag, som 'ÅÅÅÅ-MM-DD'.
 *
 * `setUTCFullYear` och inte millisekunder: 730 dagar är fel två gånger per
 * åtta år, och en gräns som glider en dag om året är den sortens fel ingen
 * upptäcker förrän en sida får raden en dag för tidigt.
 */
function tvaArTillbaka(idag: Date): string {
  const d = new Date(Date.UTC(idag.getUTCFullYear(), idag.getUTCMonth(), idag.getUTCDate()));
  d.setUTCFullYear(d.getUTCFullYear() - 2);
  return d.toISOString().slice(0, 10);
}

/**
 * Saknar sidan en kontroll som säger något om nuläget?
 *
 * Sant både när kontrollen är äldre än två år och när det inte finns någon
 * alls. De två fallen är olika för läsaren, men de ställer samma fråga: vad
 * gäller i dag? Och svaret på den frågan finns hos kommunen och inte hos oss.
 */
export function saknarFarskKontroll(senaste: string | null, idag: Date): boolean {
  if (!senaste) return true;
  return senaste < tvaArTillbaka(idag);
}

/**
 * Ämnesraden.
 *
 * Bär ärendets namn först, så att en registrator ser vad brevet är innan hon
 * öppnat det, och verksamhetens namn sist, så att den inte kapas mitt i ordet
 * "handling" i en smal inkorgslista.
 */
function amne(namn: string): string {
  return `Begäran om allmän handling: kontrollrapport för ${namn}`;
}

/**
 * Brevet.
 *
 * Skrivet i första person, i besökarens namn, utan hälsningsfras med namn
 * under. Ett `[ditt namn]` att fylla i hade blivit kvar oifyllt i en del av
 * breven, och ett brev som är undertecknat "[ditt namn]" ser ut som ett
 * massutskick, vilket är precis vad det inte är. Den som vill underteckna gör
 * det där markören står, och den som inte vill har rätt att vara anonym.
 */
function brev(namn: string, adress: string | null, ort: string): string {
  const plats = adress ? `${namn}, ${adress}, ${ort}` : `${namn}, ${ort}`;

  return [
    'Hej,',
    '',
    'Jag vill ta del av en allmän handling enligt 2 kap. tryckfrihetsförordningen:',
    '',
    `kontrollrapporten från den senaste livsmedelskontrollen av ${plats}.`,
    '',
    'Finns ingen sådan rapport ber jag i stället om den senaste handlingen ni har om livsmedelskontroll av verksamheten.',
    '',
    'Skicka den gärna som PDF i svar på det här mejlet.',
    '',
    'Med vänlig hälsning',
    '',
  ].join('\r\n');
}

/**
 * Den färdiga länken, eller null när raden inte ska visas.
 *
 * Null i tre fall, och alla tre är avsedda:
 *
 *   1. Kommunen saknar verifierad adress i begaran.data.ts. En begäran i fel
 *      brevlåda kostar en handläggare tid och ger besökaren inget svar.
 *   2. Kommunen finns inte i tabellen alls, alltså en kommun vi lagt till utan
 *      att någon läst dess registratorsadress.
 *   3. Kontrollen är färskare än två år. Då finns uppgiften redan på sidan.
 *
 * @param kommunkod  `Municipality.code`.
 * @param ort        `Municipality.city`, alltså orten i adressraden.
 * @param senaste    Senaste kontrollens datum, eller null.
 * @param idag       Byggdagen. Skickas in så att regeln går att prova.
 */
export function begaran(
  kommunkod: string,
  ort: string,
  v: Begaranverksamhet,
  senaste: string | null,
  idag: Date,
): Begaran | null {
  if (!saknarFarskKontroll(senaste, idag)) return null;

  const mottagare = UTLAMNARE[kommunkod];
  if (!mottagare) return null;

  const q =
    `subject=${encodeURIComponent(amne(v.name))}` +
    `&body=${encodeURIComponent(brev(v.name, v.address, ort))}`;

  return { href: `mailto:${mottagare.epost}?${q}`, epost: mottagare.epost };
}
