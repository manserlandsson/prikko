/**
 * Vart en begäran om en kontrollrapport går, kommun för kommun.
 *
 * ---------------------------------------------------------------------------
 * DET HÄR ÄR EN ANNAN TABELL ÄN anmalan.data.ts, OCH DET ÄR HELA POÄNGEN
 * ---------------------------------------------------------------------------
 * `anmalan.data.ts` bär kommunernas E-TJÄNSTER FÖR ANMÄLAN: matförgiftning och
 * brister. Det är ett ärende som startar något nytt hos kommunen.
 *
 * Här står mottagaren för det MOTSATTA ärendet: att få ut en handling som redan
 * finns. En begäran om allmän handling går till myndighetens registrator eller
 * motsvarande funktionsbrevlåda, aldrig in i ett anmälningsformulär, och den
 * får enligt JO dnr 10735-2024 (2025-06-10) inte tvingas in i en e-tjänst med
 * legitimering. Att återanvända anmälningsadressen hade alltså varit fel
 * ärende till fel brevlåda.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR TABELLEN LIGGER HÄR OCH INTE I src/data/
 * ---------------------------------------------------------------------------
 * Samma skäl som systerfilen anger: `src/data/` globbas av pipelinen, och en
 * främmande fil där har dödat en skarp körning en gång. Det här är dessutom
 * inte hämtad data utan handskriven kunskap om tretton myndigheters
 * brevlådor, alltså kod och inte ett bestånd.
 *
 * ---------------------------------------------------------------------------
 * DET SOM STÅR HÄR ÄR HÄMTAT, INTE ANTAGET
 * ---------------------------------------------------------------------------
 * Varje adress är läst i markupen på den sida som står i `kalla`, en kommun i
 * taget, den dag som står i `kontrollerad`. `etikett` är rubriken adressen
 * stod under, ordagrant, så att nästa läsare kan se att adressen gäller rätt
 * myndighet och inte kommunens växel. `scripts/kontrollera-begaran.mjs` gör om
 * hela mätningen och fäller när en adress inte längre står på sin källsida.
 *
 * Ingen adress är gissad ur ett mönster. `miljoforvaltningen@` finns i
 * Stockholm, Uppsala och Karlstad men INTE i Örebro, som skriver
 * `miljoavdelningen@`, och inte i Linköping, som inte publicerar någon
 * förvaltningsadress alls. Ett mönster hade träffat fel i minst två fall.
 *
 * `null` är ett fullgott svar. En kommun utan verifierad adress får ingen rad,
 * och då visas ingen länk för dess verksamheter. En begäran som landar i fel
 * brevlåda är värre än ingen begäran: den kostar en handläggare tid och ger
 * besökaren ett svar som aldrig kommer.
 *
 * ---------------------------------------------------------------------------
 * VILKEN BREVLÅDA SOM VALDES, OCH REGELN BAKOM VALET
 * ---------------------------------------------------------------------------
 * Myndigheten är nämnden, och handlingen förvaras hos det kontor som utför
 * livsmedelskontrollen. Regeln, i fallande ordning:
 *
 *   1. Den brevlåda kommunen själv anvisar PÅ SIN LIVSMEDELSSIDA. Nio av
 *      tretton har en, och den är alltid bäst: den går rakt till enheten som
 *      har rapporten i sitt eget system.
 *   2. Förvaltningens eller kontorets officiella brevlåda, läst på kommunens
 *      egen organisationssida. Stockholm, Karlstad och Oskarshamn.
 *   3. Kommunens gemensamma funktionsbrevlåda, när kommunen uttryckligen
 *      anger den som vägen in till förvaltningen. Linköping, Lomma,
 *      Svenljunga och Borgholm är små nog att det är sant där.
 *
 * Stockholm har två kandidater och valet är medvetet.
 * `livsmedelskontrollen@stockholm.se` står på samma sida och tillhör
 * avdelningen som gör kontrollerna, men sidan beskriver den som vägen för
 * klagomål och frågor. En begäran om allmän handling är varken det ena eller
 * det andra, den ska diarieföras, och därför står förvaltningens egen adress
 * här.
 *
 * ---------------------------------------------------------------------------
 * VI ÄR ALDRIG AVSÄNDARE
 * ---------------------------------------------------------------------------
 * Adresserna används bara för att fylla i `mailto:` i besökarens egen
 * mejlklient. Ingen adress hos oss står i brevet, inget svar går till oss, och
 * ingenting om besökaren lagras någonstans. Se docs/50 §6: skickade VI i
 * besökarens namn skulle besökarens adress bli en allmän handling i kommunens
 * diarium, och det vore vi som satte den där.
 */

/** En myndighets brevlåda för en begäran om allmän handling. */
export interface Utlamnare {
  /** Funktionsbrevlådan. Aldrig en namngiven handläggare. */
  epost: string;
  /** Sidan adressen lästes på, ordagrant. */
  kalla: string;
  /** Rubriken eller meningen adressen stod under, ordagrant, samma dag. */
  etikett: string;
  /** Datum då adressen senast lästes på sin källsida. */
  kontrollerad: string;
}

/** Datum då hela tabellen mättes, adress för adress. */
export const KONTROLLERAD = '2026-09-05';

/**
 * Nyckeln är kommunkoden, samma som `Municipality.code`.
 *
 * Ordningen är beståndets storlek, störst först, precis som i
 * anmalan.data.ts, så att den som läser ser vad som väger tyngst innan hon
 * tröttnar.
 */
export const UTLAMNARE: Readonly<Record<string, Utlamnare | null>> = {
  // Stockholm, 8 567 verksamheter. Miljöförvaltningen.
  //
  // Sidan bär två adresser, se rubriken om regeln ovan. Förvaltningens egen
  // står under rubriken "E-post" i kontaktrutan; avdelningens
  // livsmedelskontrollen@stockholm.se står i den löpande texten om vad
  // avdelningen gör.
  '0180': {
    epost: 'miljoforvaltningen@stockholm.se',
    kalla: 'https://start.stockholm/om-stockholms-stad/organisation/fackforvaltningar/miljoforvaltningen/',
    etikett: 'E-post',
    kontrollerad: KONTROLLERAD,
  },

  // Uppsala, 1 863 verksamheter. Miljöförvaltningen.
  //
  // Adressen står i kontaktrutan på samma sida som publicerar
  // kontrollresultaten, alltså på Livsmedelskollen. Sidan skriver dessutom
  // själv ut det som är hela skälet till att vi aldrig skickar åt någon: "När
  // du skickar ett mejl blir det som huvudregel en allmän handling."
  '0380': {
    epost: 'miljoforvaltningen@uppsala.se',
    kalla: 'https://www.uppsala.se/foretag-och-naringsliv/tillstand-regler-och-tillsyn/livsmedelskollen',
    etikett: 'Kontakta miljöförvaltningen',
    kontrollerad: KONTROLLERAD,
  },

  // Linköping, 1 247 verksamheter. Kontakt Linköping.
  //
  // KOMMUNEN PUBLICERAR INGEN FÖRVALTNINGSADRESS, och det är inte en lucka i
  // mätningen utan kommunens eget svar. Förvaltningssidan säger ordagrant:
  // "Kontaktvägen till Miljö- och samhällsbyggnadsförvaltningen är via Kontakt
  // Linköping." Miljöavdelningens egen sida, linkoping.se/miljokontoret,
  // svarade 404 den 5 september 2026.
  //
  // Adressen är alltså kommunens gemensamma, och det är den väg kommunen
  // anvisar. JO dnr 10735-2024: en begäran kan ställas till vem som helst inom
  // en myndighet, så vägen håller även när brevet ska vidare internt.
  '0580': {
    epost: 'kontakt@linkoping.se',
    kalla: 'https://www.linkoping.se/kommun-och-politik/kommunens-organisation/forvaltningar/miljo--och-samhallsbyggnadsforvaltningen',
    etikett: 'Kontaktvägen till Miljö- och samhällsbyggnadsförvaltningen är via Kontakt Linköping',
    kontrollerad: KONTROLLERAD,
  },

  // Norrköping, 1 022 verksamheter. Miljö och hälsa, samhällsbyggnadskontoret.
  //
  // Kommunens livsmedelssida anvisar adressen tre gånger, varje gång som vägen
  // in för den som inte har e-legitimation. Det är precis den egenskap en
  // begäran om allmän handling behöver: JO dnr 10735-2024 säger att en
  // myndighet inte får kräva legitimering för att ta emot en begäran.
  //
  // Kommunens gemensamma kontakt@norrkoping.se är Kontakt Norrköping, alltså
  // ett servicecenter och inte den enhet som förvarar rapporterna.
  '0581': {
    epost: 'miljo@norrkoping.se',
    kalla: 'https://norrkoping.se/arbete-och-naringsliv/livsmedel-alkohol-tobak-med-mera/livsmedelsverksamhet',
    etikett: 'kontakta miljo@norrkoping.se',
    kontrollerad: KONTROLLERAD,
  },

  // Jönköping, 1 136 verksamheter. Miljö- och hälsoskyddskontoret,
  // livsmedelsenheten.
  //
  // Den bästa posten i hela tabellen: adressen står i kontaktrutan på exakt
  // den sida som publicerar kontrollresultaten, under enhetens eget namn.
  // Sidan är kommunens egen och serverrenderad, till skillnad från
  // etjanst.jonkoping.se, vars klientrenderade skal gör en 200 värdelös som
  // bevis. Se punkt 2 i scripts/kontrollera-anmalan.mjs.
  '0680': {
    epost: 'miljo@jonkoping.se',
    kalla: 'https://www.jonkoping.se/bygga-bo--miljo/miljo-och-halsa/livsmedel-matforgiftning-och-klagomal',
    etikett: 'KONTAKT Miljö- och hälsoskyddskontoret Livsmedelsenheten',
    kontrollerad: KONTROLLERAD,
  },

  // Örebro, 1 231 verksamheter. Miljöavdelningen.
  //
  // Mönstret från Stockholm, Uppsala och Karlstad håller INTE här:
  // miljoforvaltningen@orebro.se finns inte, kommunen skriver
  // miljoavdelningen@. Adressen står på kommunens livsmedelssida som vägen för
  // anmälningar om ändrad verksamhet, alltså till den enhet som för registret.
  '1880': {
    epost: 'miljoavdelningen@orebro.se',
    kalla: 'https://www.orebro.se/foretag--naringsliv/driva-foretag/livsmedelsverksamhet.html',
    etikett: 'Anmäl ändringarna via e-post till miljoavdelningen@orebro.se',
    kontrollerad: KONTROLLERAD,
  },

  // Karlstad, 697 verksamheter. Miljöförvaltningen.
  //
  // Livsmedelskollen, kommunens sida för kontrollresultaten, bär bara
  // karlstadskommun@karlstad.se, alltså kommunens gemensamma. Förvaltningens
  // egen står i kontaktrutan på organisationssidan och är närmare handlingen.
  '1780': {
    epost: 'miljoforvaltningen@karlstad.se',
    kalla: 'https://karlstad.se/kommun-och-politik/kommunens-organisation/forvaltningar/miljoforvaltningen',
    etikett: 'Kontakt',
    kontrollerad: KONTROLLERAD,
  },

  // Borgholm, 406 verksamheter. Miljöenheten.
  //
  // `mobn@` är miljö- och byggnadsnämnden, alltså myndigheten själv, och
  // adressen står i kontaktrutan under rubriken KONTAKT med "Miljöenheten"
  // som avsändarnamn på kommunens livsmedelssida.
  '0885': {
    epost: 'mobn@borgholm.se',
    kalla: 'https://www.borgholm.se/livsmedel/',
    etikett: 'KONTAKT Miljöenheten',
    kontrollerad: KONTROLLERAD,
  },

  // Höganäs, 316 verksamheter. Miljöavdelningen.
  //
  // Adressen ligger som mailto bakom ordet "miljöavdelningen" i meningen
  // "Mejla gärna miljöavdelningen om du saknar ditt favoritsställe", på samma
  // sida som publicerar kontrollresultaten. Kommunens gemensamma
  // kommunen@hoganas.se står i sidfoten och är alltså inte enhetens.
  '1284': {
    epost: 'miljoavdelningen@hoganas.se',
    kalla: 'https://www.hoganas.se/boende-trafik--miljo/boendemiljo/livsmedel/livsmedelskontroller.html',
    etikett: 'Mejla gärna miljöavdelningen',
    kontrollerad: KONTROLLERAD,
  },

  // Oskarshamn, 238 verksamheter. Samhällsbyggnadskontoret.
  //
  // Samma adress som kommunens matförgiftningssida anger som mottagare, se
  // posten '0882' i anmalan.data.ts. Här är den läst på kontorets egen sida
  // under samhällsbyggnadsnämnden, alltså hos myndigheten och inte i en
  // anvisning för ett annat ärende.
  '0882': {
    epost: 'sbk@oskarshamn.se',
    kalla: 'https://www.oskarshamn.se/mer-om-kommunen/politik-och-forvaltning/politik/namnder-och-forvaltningar/samhallsbyggnadsnamnden/samhallsbyggnadskontoret/',
    etikett: 'E-post: sbk@oskarshamn.se',
    kontrollerad: KONTROLLERAD,
  },

  // Kristinehamn, 170 verksamheter. Miljö- och hälsoskydd, miljö- och
  // stadsbyggnadsförvaltningen.
  //
  // Adressen står i kontaktrutan på sidan som publicerar rapporterna, med
  // enhetens och förvaltningens namn utskrivna över sig. Kommunens gemensamma
  // kommunen@kristinehamn.se står på översiktssidan ett steg upp.
  '1781': {
    epost: 'miljo@kristinehamn.se',
    kalla: 'https://www.kristinehamn.se/naringsliv-och-arbete/livsmedel/livsmedelsrapporter/',
    etikett: 'Miljö- och hälsoskydd, miljö- och stadsbyggnadsförvaltningen',
    kontrollerad: KONTROLLERAD,
  },

  // Lomma, 153 verksamheter. Kommunens funktionsbrevlåda.
  //
  // Ingen egen adress för miljöenheten går att läsa någonstans på lomma.se.
  // Kontaktrutan på sidan som publicerar inspektionerna bär info@lomma.se, och
  // den är alltså kommunens eget svar på var posten tas emot. En kommun med
  // 153 verksamheter har inte ett registratorskontor per förvaltning.
  '1262': {
    epost: 'info@lomma.se',
    kalla: 'https://lomma.se/jobbochforetagande/tillstandreglerochtillsyn/livsmedel/livsmedelsinspektioner.1218.html',
    etikett: 'Kontakt',
    kontrollerad: KONTROLLERAD,
  },

  // Svenljunga, 100 verksamheter. Kommunens funktionsbrevlåda.
  //
  // Samma läge som Lomma: kontaktrutan på sidan med kontrollresultaten bär
  // kommun@svenljunga.se och ingen förvaltningsadress finns publicerad.
  '1465': {
    epost: 'kommun@svenljunga.se',
    kalla: 'https://www.svenljunga.se/naringsliv--arbete/tillstand-regler-och-tillsyn/livsmedel/livsmedelskontroll-och-avgifter/resultat-fran-livsmedelskontrollen',
    etikett: 'Kontakta oss',
    kontrollerad: KONTROLLERAD,
  },
};
