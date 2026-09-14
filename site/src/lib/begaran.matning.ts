/**
 * Klickräknaren bakom "Begär ut kontrollen". KÖRS BARA I WEBBLÄSAREN.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR DEN FINNS
 * ---------------------------------------------------------------------------
 * Raden är inte bara en tjänst åt läsaren, den är MÄTINSTRUMENTET. docs/50 §9
 * skäl 2: passerar räknaren omkring 200 klick i månaden är förstudien fel och
 * ska göras om med riktiga tal i stället för uppskattningar. Utan räknaren är
 * den lilla formen bara en liten form, och frågan om den stora någonsin ska
 * byggas förblir obesvarad för alltid.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR INTE WEBBANALYS
 * ---------------------------------------------------------------------------
 * `docs/14` underhållsregel: läggs webbanalys eller något annat
 * tredjepartsskript till är /cookies osann samma dag, och då ska
 * samtyckesrutan byggas först. Ett klick i månaden i en enda ruta är inte värt
 * en samtyckesruta på 17 146 sidor.
 *
 * Sajten har ingen egen trafikmätning alls, `docs/59` §12 punkt 1. Det enda
 * projektet någonsin mätt sig på är SQL mot community-schemat i Supabase, och
 * det är precis vad den här räknaren skriver till. Ingen ny mätväg uppfanns.
 *
 * ---------------------------------------------------------------------------
 * VAD SOM LAGRAS, UTTÖMMANDE
 * ---------------------------------------------------------------------------
 * Månaden, kommunkoden och ett heltal. Det är hela raden.
 *
 * Inte vem som klickade. Inte vilken verksamhet. Inte vilken sida. Inte
 * klockslaget. Ingen kaka, ingen localStorage, ingen sessionStorage, ingen
 * identifierare av något slag. Anropet är därför inte lagring i eller
 * hämtning från terminalutrustning, alltså är 9 kap. 28 § lagen (2022:482) om
 * elektronisk kommunikation inte ens tillämplig, och det finns ingen
 * personuppgift att hitta en rättslig grund för.
 *
 * Verksamheten utelämnas MED AVSIKT, och det är inte en glömska. En räknare
 * per verksamhet hade blivit en lista över vilka ställen folk misstänker, och
 * en sådan lista är ett påstående om namngivna verksamheter som den här sajten
 * aldrig gör. Kommunkoden räcker för det förstudien ska besvara: finns det en
 * efterfrågan, och var.
 *
 * Cloudflare framför Supabase ser IP-adressen på anropet, precis som på varje
 * annat anrop sajten redan gör. Det är en utlämning i transporten och inte en
 * lagring hos oss, samma post som `__cf_bm` i docs/14. Skillnaden mot den
 * posten är att det här anropet sker EFTER ett klick och aldrig vid
 * sidladdning, alltså inom undantaget för en tjänst besökaren uttryckligen
 * begärt även om man läser undantaget snävt.
 *
 * ---------------------------------------------------------------------------
 * ATT DEN KAN MISSLYCKAS ÄR INTE ETT FEL
 * ---------------------------------------------------------------------------
 * Funktionen svarar aldrig, kastar aldrig och blockerar aldrig. Är Supabase
 * nere, saknas nycklarna i bygget, eller har någon en blockerare, öppnas
 * mejlet ändå. Räknaren är vår sak, brevet är besökarens, och besökarens sak
 * går först.
 *
 * `keepalive` av samma skäl. En `mailto:` lämnar i de flesta webbläsare sidan
 * orörd, men i några startar den ett systemanrop som tar fokus, och ett anrop
 * utan keepalive kan då hinna avbrytas. Kroppen är under en kilobyte, alltså
 * långt under de 64 kB keepalive tillåter.
 *
 * ---------------------------------------------------------------------------
 * FUNKTIONEN I DATABASEN
 * ---------------------------------------------------------------------------
 * `community.rakna_begaran(text)`, se pipeline/schema_community.sql. Den är
 * `security definer` av samma skäl som avregistreringsfunktionerna: anon har
 * varken select eller insert på tabellen och ska inte få det. Anropet kan bara
 * öka en räknare, aldrig läsa en.
 *
 * TILLS SCHEMAT ÄR KÖRT SVARAR ANROPET 404 och räknaren står på noll. Det
 * märks inte på sidan, och det är rätt ordning: koden får ligga före
 * migreringen, aldrig tvärtom.
 *
 * MEN EN TYST 404 ÄR OCKSÅ HUR ETT FEL I ANROPET SER UT. Just den tystnaden
 * dolde ett fel i nio dagar, se kroppen nedan. En räknare som står på noll ska
 * därför provas med ett riktigt anrop innan nollan tolkas som att ingen
 * klickat: POST med samma rubriker och kroppen {"kommunkod": "<kod>"} ska
 * svara 204, och testraden tas sedan bort med service_role.
 */

const URL_BASE = (import.meta.env.PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
const ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Räkna ett klick på begäran i en kommun.
 *
 * @param kommunkod Fyra siffror, `Municipality.code`. Skickas ordagrant.
 */
export function raknaBegaran(kommunkod: string): void {
  if (!URL_BASE || !ANON_KEY) return;

  try {
    void fetch(`${URL_BASE}/rest/v1/rpc/rakna_begaran`, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        /* PostgREST väljer schema med Content-Profile för skrivning. Utan den
           faller anropet tillbaka på public och svarar 404, se rest() i
           community.ts där samma miss en gång gjorde avfölj trasig. */
        'Content-Profile': 'community',
      },
      /* Nyckeln MÅSTE heta som parametern i SQL-funktionen, `kommunkod`.
         PostgREST matchar RPC-argument på namn, och fram till 2026-09-14 stod
         här `kommun`. Varje klick från 5 till 14 september fick då 404,
         "Could not find the function community.rakna_begaran(kommun)", och
         svaldes av catch nedan. Räknaren stod på noll i nio dagar av det
         skälet och inget annat, alltså säger de dagarna ingenting om
         efterfrågan. */
      body: JSON.stringify({ kommunkod }),
    }).catch(() => {
      /* Nätverket. Brevet är redan på väg att öppnas. */
    });
  } catch {
    /* fetch saknas. Samma svar: gör ingenting. */
  }
}
