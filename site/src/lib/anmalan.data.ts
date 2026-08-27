/**
 * Vart en anmälan om mat går, kommun för kommun.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR TABELLEN LIGGER HÄR OCH INTE I src/data/
 * ---------------------------------------------------------------------------
 * `src/data/` globbas av pipelinen. En främmande fil där har dödat en skarp
 * körning en gång. Det här är dessutom inte hämtad data utan handskriven
 * kunskap om tolv kommuners e-tjänster, alltså kod och inte ett bestånd.
 *
 * ---------------------------------------------------------------------------
 * DET SOM STÅR HÄR ÄR HÄMTAT, INTE ANTAGET
 * ---------------------------------------------------------------------------
 * Varje adress i tabellen har hämtats och svarat 200 den dag som står i
 * `kontrollerad`. Fältnamnen i `forifyllning` är utlästa ur formulärens egen
 * markup samma dag. `scripts/kontrollera-anmalan.mjs` gör om hela mätningen
 * och fäller på en död adress eller ett fält som bytt namn.
 *
 * En död länk i en anmälningsruta är värre än ingen ruta. Därför är `null` ett
 * fullgott svar: kommunen får då ingen länk för det ärendet, och saknar den
 * båda får verksamheten ingen ruta alls.
 *
 * ---------------------------------------------------------------------------
 * FÖRIFYLLD OCH ALLMÄN ÄR INTE BÄTTRE OCH SÄMRE
 * ---------------------------------------------------------------------------
 * Tre av tolv kommuner tar emot verksamheten i frågesträngen. De nio andra gör
 * det inte, och för dem är den allmänna länken det RÄTTA svaret, inte ett
 * halvt. Besökaren vill komma till rätt formulär; hur mycket vi kunde fylla i
 * åt hen är vår sak och inte hennes. Rutan säger därför ingenting om
 * skillnaden, och tabellen har ingen "kvalitetsnivå" att visa upp.
 *
 * ---------------------------------------------------------------------------
 * DE TVÅ PLATTFORMSFAMILJERNA, OCH VARFÖR PREFILL BARA GÅR PÅ DEN ENA
 * ---------------------------------------------------------------------------
 * Fem kommuner (Uppsala, Linköping, Örebro, Karlstad, Borgholm, samt
 * Oskarshamns klagomål) kör Abou e-tjänsteplattform. Den tar bara en
 * tjänstekod i URL:en och bygger fälten först efter en postback i en
 * serversession, alltså finns det inget fält att fylla i. Höganäs och
 * Kristinehamn kör Open ePlatform och Jönköping kör Salesforce; prefill är
 * prövad och avvisad på alla tre.
 *
 * Lomma och Svenljunga kör SiteVisions formulärmodul, som läser GET-parametrar
 * rakt in i fälten. Stockholm har ett eget bygge som tar sitt foodplaceid.
 * Det är hela listan.
 */

/** Vad ett formulär kan ta emot i frågesträngen. */
export interface Forifyllning {
  /** Fältet för verksamhetens namn. */
  namn: string;
  /**
   * Etiketten fältet bar när det senast kontrollerades. Utelämnad när
   * formuläret inte har någon etikett att läsa, vilket gäller Stockholm: där
   * binds parametrarna i ett `urlParameters`-objekt i sidans skript i stället
   * för i ett `<input>`.
   *
   * SPÄRREN. SiteVisions fältnamn är nodid:n i kommunens eget CMS. Bygger
   * kommunen om formuläret byter de värde, och en okänd parameter kastas då
   * bort UTAN felmeddelande: sidan svarar 200 och laddar oifylld.
   * `scripts/kontrollera-anmalan.mjs` skickar ett provnamn, kräver att det kommer
   * tillbaka i svaret, och jämför dessutom etiketten mot den här strängen. En
   * tyst ändring blir då en fällande körning i stället för en tom ruta.
   *
   * Förbehållet, om spärren aldrig körs: en okänd parameter fyller inte i FEL
   * fält, den fyller inte i något alls. Värsta utfallet är alltså att
   * förifyllningen tystnar och länken beter sig som en allmän länk, vilket är
   * precis vad nio av tolv kommuner har ändå. Prövat 2026-08-27 med det
   * påhittade fältnamnet `field_120_PRIKKOPAHITT` på båda
   * SiteVision-formulären: namnfältet kom tillbaka tomt, sidan svarade 200 och
   * inget annat fält rubbades.
   */
  namnEtikett?: string;
  /** Fältet för verksamhetens id. Bara Stockholm har ett. */
  id?: string;
  /** Prefix att skala av vårt id innan det skickas. */
  idPrefix?: string;
  /** Fältet för gatuadressen. Utelämnat när formuläret inte har något. */
  adress?: string;
  /**
   * Sant när formulärets parameterbindning är ALLT ELLER INGET.
   *
   * Stockholms båda formulär kräver att id, namn OCH adress är icke-tomma. Är
   * adressen tom släpper deras bindning hela blocket, och då blir även namnet
   * tomt. Sidan svarar 200 och laddar som vanligt, den är bara oifylld: en
   * tyst förlust av hela poängen.
   *
   * Uppmätt 2026-08-25 på M/s Ballerina, id 00b1cf0a-aa70-4533-bbe0-2e19cb88a9a7:
   *
   *     address=       ->  formuläret visar inget namn      (trasigt)
   *     address=%20    ->  formuläret visar "M/s Ballerina" (fungerar)
   *     address=+      ->  formuläret visar "M/s Ballerina" (fungerar)
   *
   * Därför ADRESS_SAKNAS, ett mellanslag, och aldrig en tom sträng. Det gäller
   * 113 av 8 520 stockholmsrader.
   *
   * SAMMA SAK ÄR PRÖVAD PÅ SVENLJUNGA, den enda andra kommun som tar två fält,
   * 2026-08-27. SiteVision binder varje fält för sig: en tom adress lämnade
   * namnet ifyllt. Flaggan är alltså falsk där, och adressparametern utelämnas
   * helt när adressen saknas i stället för att skickas tom.
   */
  allaEllerInget?: boolean;
}

export interface Anmalningslank {
  /** Adressen som besökaren skickas till, utan frågesträng. */
  url: string;
  /** Datum då adressen senast hämtades och svarade 200. */
  kontrollerad: string;
  /** Satt bara när formuläret tar emot verksamheten i frågesträngen. */
  forifyllning?: Forifyllning;
}

export interface KommunAnmalan {
  /**
   * Misstänkt matförgiftning. Visas bara på konsumentvända verksamheter: ett
   * förskolekök, en transportör eller ett huvudkontor är ingen plats någon
   * ätit på.
   */
  matforgiftning: Anmalningslank | null;
  /**
   * Brister i livsmedelshanteringen. Får stå på alla, även skolkök, för
   * brister i livsmedelshantering finns även där.
   */
  brister: Anmalningslank | null;
}

/** Datum då hela tabellen mättes om, adress för adress. */
export const KONTROLLERAD = '2026-08-27';

/**
 * Nyckeln är kommunkoden, samma som `Municipality.code`.
 *
 * Ordningen är beståndets storlek, störst först, så att den som läser ser vad
 * som väger tyngst innan hon tröttnar.
 */
export const ANMALAN: Readonly<Record<string, KommunAnmalan>> = {
  // Stockholm, 8 520 verksamheter.
  //
  // Enda kommunen med formulär per verksamhet. Guiden i vårt id ÄR stadens
  // foodplaceid, alltså kostar länken noll nätverk och noll fält i datafilen.
  //
  // Rådata från SearchFacilitiesMap bär färdiga fält PoisoningLink och
  // ComplainLink. Det är frestande att skriva av dem, men de har samma bugg
  // som beskrivs under `allaEllerInget`: stadens egen karta bygger `address=`
  // tomt för de 113 adresslösa och producerar alltså trasiga länkar till sig
  // själv. Vi bygger dem därför här, av id, namn och adress som redan står i
  // raden.
  '0180': {
    matforgiftning: {
      url: 'https://etjanster.stockholm.se/matforgiftning/sallskap',
      kontrollerad: KONTROLLERAD,
      forifyllning: {
        id: 'foodplaceid',
        idPrefix: 'F-0180-',
        namn: 'name',
        adress: 'address',
        allaEllerInget: true,
      },
    },
    brister: {
      url: 'https://etjanster.stockholm.se/brister/brister',
      kontrollerad: KONTROLLERAD,
      forifyllning: {
        id: 'FoodPlaceId',
        idPrefix: 'F-0180-',
        namn: 'FoodPlaceName',
        adress: 'FoodPlaceAddress',
        allaEllerInget: true,
      },
    },
  },

  // Uppsala, 1 854 verksamheter. Abou e-tjänsteplattform.
  // Titel 2026-08-27: "Anmäla misstänkt matförgiftning" respektive
  // "E-tjänst för att lämna in klagomål", vars ingress uttryckligen nämner
  // livsmedel ("olägenhet för miljö, hälsa och livsmedel").
  '0380': {
    matforgiftning: { url: 'https://minut.uppsala.se/MMMATGIFT', kontrollerad: KONTROLLERAD },
    brister: { url: 'https://minut.uppsala.se/MMKLAG', kontrollerad: KONTROLLERAD },
  },

  // Linköping, 1 246 verksamheter. Abou.
  // Matförgiftningstjänsten heter "Anmäla misstänkt matförgiftning eller
  // allergisk reaktion" och täcker alltså båda. Klagomålstjänsten heter bara
  // "Klagomål" och är miljöavdelningens gemensamma; kommunen anvisar den själv
  // för livsmedel.
  '0580': {
    matforgiftning: { url: 'https://eservice.linkoping.se/MMMATGIFT', kontrollerad: KONTROLLERAD },
    brister: { url: 'https://eservice.linkoping.se/MMKLAG', kontrollerad: KONTROLLERAD },
  },

  // Örebro, 1 233 verksamheter. Abou.
  // Klagomålstjänsten nämner livsmedelsverksamhet först i sin egen rubrik.
  // Kommunen har också O732 för enbart allergisk reaktion; den utelämnas,
  // för O7300 heter "Anmäl misstänkt matförgiftning" och är den vidare vägen.
  '1880': {
    matforgiftning: { url: 'https://service.orebro.se/O7300', kontrollerad: KONTROLLERAD },
    brister: { url: 'https://service.orebro.se/O7305', kontrollerad: KONTROLLERAD },
  },

  // Jönköping, 1 114 verksamheter. Salesforce Experience Cloud.
  //
  // Sidorna renderas i klienten, alltså säger en 200 från curl ingenting: en
  // påhittad sökväg svarar också 200 med samma skal på 4 652 byte. Båda
  // adresserna är därför renderade i webbläsare 2026-08-27 och visade rätt
  // formulär, och kontrollen är gjord att `/s/prikko-finns-inte` går till
  // `/404`. Spärren i kontrollera-anmalan.mjs gör om just den mätningen.
  //
  // Prefill prövad och avvisad: plattformen bär vidare okända parametrar i
  // sina egna länkar men fyller inte i något fält.
  '0680': {
    matforgiftning: {
      url: 'https://etjanst.jonkoping.se/s/anmal-en-matforgiftning',
      kontrollerad: KONTROLLERAD,
    },
    brister: {
      url: 'https://etjanst.jonkoping.se/s/lamna-klagomal-om-livsmedelsverksamhet',
      kontrollerad: KONTROLLERAD,
    },
  },

  // Karlstad, 694 verksamheter. Abou.
  //
  // Två varianter finns: `1FPG` kräver BankID, `1fpg_anonym` kräver ingen
  // inloggning. Vi länkar den anonyma. Skälet är inte anonymiteten utan
  // tröskeln: alla elva andra kommuners formulär går att fylla i utan
  // inloggning, och den anonyma tar ändå emot kontaktuppgifter frivilligt
  // ("Du kan välja att inte lämna kontaktuppgifter"). En BankID-vägg som enda
  // väg till att anmäla en misstänkt matförgiftning hade varit vår vägg.
  //
  // Ingen klagomålstjänst. Kommunens livsmedelssidor länkar bara portalens
  // startsida, kontrollerat 2026-08-27 på både /livsmedelskollen och
  // /mat-miljo-och-halsoskydd/. En länk till en portalrot är inte en väg
  // vidare, det är att lämna över sökandet igen.
  '1780': {
    matforgiftning: { url: 'https://e-tjanster.karlstad.se/1fpg_anonym', kontrollerad: KONTROLLERAD },
    brister: null,
  },

  // Borgholm, 406 verksamheter. Abou.
  //
  // EN ENDA TJÄNST FÖR BÅDA ÄRENDENA. `MMKLAG` heter bara "Klagomål" och är
  // gemensam för miljöbalksstörningar och matförgiftning; kommunens egen sida
  // /matforgiftning/ länkar den med texten "E-tjänst: Anmälan om misstänkt
  // matförgiftning", kontrollerat 2026-08-27.
  //
  // Båda posterna pekar därför på samma adress. Rutan visar aldrig två
  // etiketter till samma ställe, se `anmalningsvagar` i anmalan.ts: den
  // konsumentvända ser "Misstänkt matförgiftning", övriga ser
  // "Brister i livsmedelshanteringen", och ingen ser båda.
  '0885': {
    matforgiftning: { url: 'https://service.borgholm.se/MMKLAG', kontrollerad: KONTROLLERAD },
    brister: { url: 'https://service.borgholm.se/MMKLAG', kontrollerad: KONTROLLERAD },
  },

  // Höganäs, 316 verksamheter. Open ePlatform.
  //
  // Adressen är kommunens egen kortform och 302:ar till /oversikt/overview/456,
  // som i sin tur startar flow/3949. Vi länkar kortformen: den överlever att
  // kommunen numrerar om sina flöden.
  //
  // Ingen klagomålstjänst för livsmedel. Kommunens "Klagomål avseende miljö
  // och hälsoskydd" handlar om bostäder och störningar; livsmedelsklagomål
  // utan matförgiftning hänvisas till en mejladress. En mejladress är inget
  // formulär och hör inte hemma i den här rutan.
  //
  // Notera att HELA Höganäs är `spanning` i kategoriseringen: kommunens enda
  // stora grupp heter "Butik, restaurang och servering". De 217 raderna är
  // konsumentvända och får matförgiftningslänken, se anmalan.ts.
  '1284': {
    matforgiftning: { url: 'https://minasidor.hoganas.se/matforgiftning', kontrollerad: KONTROLLERAD },
    brister: null,
  },

  // Oskarshamn, 239 verksamheter.
  //
  // MATFÖRGIFTNING ÄR EN BLANKETTSIDA, OCH DEN FÅR STÅ. Kommunen har ingen
  // ifyllbar e-tjänst; sidan har ingen "Starta e-tjänsten"-knapp, bara "Hämta
  // blankett (pdf, 263 KB)" mot ett AcroForm från 2017. Att ändå länka den är
  // ett val och inte en slarvpost:
  //
  //   - Sidan är kommunens egen, levande och rätt rubricerad ("Matförgiftning"),
  //     och den skriver ut vem som tar emot: Samhällsbyggnadskontoret,
  //     sbk@oskarshamn.se, Box 706. Kontrollerat 2026-08-27.
  //   - Besökarens alternativ utan länken är att söka själv och landa på exakt
  //     den här sidan. Vi kortar vägen dit, vi skapar ingen återvändsgränd.
  //   - Vi länkar SIDAN och aldrig PDF:en. Sidan bär anvisningen, mottagaren
  //     och nedladdningen. En rå 2017-blankett utan sammanhang hade varit
  //     återvändsgränden.
  //
  // Klagomål är däremot en riktig webblankett på Abou, och dess ingress nämner
  // livsmedel uttryckligen.
  '0882': {
    matforgiftning: {
      url: 'https://minasidor.oskarshamn.se/oversikt/overview/136',
      kontrollerad: KONTROLLERAD,
    },
    brister: { url: 'https://minut.oskarshamn.se/MMKLAG', kontrollerad: KONTROLLERAD },
  },

  // Kristinehamn, 170 verksamheter. Open ePlatform.
  //
  // Kortformen 302:ar till /oversikt/overview/322, som startar flow/1222.
  // Samma resonemang som Höganäs: kortformen överlever omnumrering.
  //
  // Ingen klagomålstjänst för livsmedel, bara en generell synpunktstjänst
  // ("kontakta kommunen"). Ett kontaktformulär är inte en anmälan och skulle
  // göra etiketten osann.
  '1781': {
    matforgiftning: {
      url: 'https://sjalvservice.kristinehamn.se/misstanktmatforgiftning',
      kontrollerad: KONTROLLERAD,
    },
    brister: null,
  },

  // Lomma, 153 verksamheter. SiteVision, FÖRIFYLLD PÅ NAMN.
  //
  // Formuläret ligger direkt på kommunens egen sida, inte i e-tjänstportalen,
  // och läser GET-parametrar rakt in i fälten. Verifierat 2026-08-27:
  //
  //     ?field_120_6b027a8519bf37f407e19677=Caf%C3%A9%20L%C3%B6dde%20%C3%85%20%26%20Co
  //     -> value="Café Lödde Å &amp; Co"
  //
  // Svenska tecken, snedstreck, plus och ampersand kom tillbaka oförändrade.
  // Formuläret har inget adressfält, bara "Var ägde måltiden rum?", och Lommas
  // 153 rader saknar ändå gatuadress allihop.
  //
  // Ingen klagomålstjänst.
  '1262': {
    matforgiftning: {
      url: 'https://lomma.se/jobbochforetagande/tillstandreglerochtillsyn/livsmedel/matforgiftning.4287.html',
      kontrollerad: KONTROLLERAD,
      forifyllning: {
        namn: 'field_120_6b027a8519bf37f407e19677',
        namnEtikett: 'Var ägde måltiden rum?',
      },
    },
    brister: null,
  },

  // Svenljunga, 99 verksamheter. SiteVision, FÖRIFYLLD PÅ NAMN OCH ADRESS.
  //
  // Kartläggningen 2026-08-25 skrev av Svenljunga som "prefill prövad,
  // avvisad". Den provade `?matstalle=...`, ett namn den hittat på. Formuläret
  // är samma SiteVision-modul som Lommas och tar sina egna fältnamn.
  // Omprövat 2026-08-27 med de riktiga id:na, och båda fälten fylls i:
  //
  //     ?field_120_12c5294816adf09ebd142e=Caesar+Restaurang+%26+Bar
  //     &field_120_12c5294816adf09ebd142f=Provgatan+1
  //     -> value="Caesar Restaurang &amp; Bar" och value="Provgatan 1"
  //
  // 32 av 99 rader har gatuadress. De övriga får bara namnet; adressfältet
  // utelämnas ur frågesträngen i stället för att skickas tomt, för här binds
  // varje fält för sig och Stockholms fälla finns inte.
  //
  // Ingen klagomålstjänst för livsmedel; kommunens två klagomålsärenden är
  // PDF-blanketter som inte nämner livsmedel.
  '1465': {
    matforgiftning: {
      url: 'https://www.svenljunga.se/bygga-bo-miljo--trafik/livsmedel-och-halsa/livsmedel/anmala-misstankt-matforgiftning',
      kontrollerad: KONTROLLERAD,
      forifyllning: {
        namn: 'field_120_12c5294816adf09ebd142e',
        namnEtikett: 'Matställets namn',
        adress: 'field_120_12c5294816adf09ebd142f',
      },
    },
    brister: null,
  },
};
