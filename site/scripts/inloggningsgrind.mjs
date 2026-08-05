/**
 * Grind för arken: inloggningsrutan och omdömesrutan.
 *
 * Bygget fälls om något av de fyra fel som gjorde att inloggningen "ploppade
 * till" på telefon smyger tillbaka. Alla fyra var tysta: sajten byggde,
 * inloggningen fungerade, och felet syntes bara för den som råkade ha en
 * iPhone i handen. En regel som bara står som kommentar i en CSS-fil
 * försvinner vid nästa omskrivning, och då är den ingen regel.
 *
 * Grinden läser källan och inte utfallet, till skillnad från sitemap-grinden.
 * Skälet är att de fyra reglerna handlar om HUR arken är byggda, och det går
 * inte att läsa ur en hopslagen CSS-fil utan att tolka den. Det som mäts i
 * utfallet är i stället mätt en gång, i webbläsaren, och står nedskrivet i
 * kommentarerna på de rader grinden vaktar.
 *
 * Kör vid `astro:build:start`, alltså innan 16 000 sidor renderas. Ett fel
 * ska märkas på sekunden och inte efter tre minuter.
 */
import { readFileSync } from 'node:fs';

/** Arken. Båda öppnas med showModal() och båda tar emot text på telefon. */
const SHEETS = ['src/components/SignInDialog.astro', 'src/components/Reviews.astro'];

/** Modulen som äger låset och därmed är undantagen från regel 1. */
const LOCK = 'src/lib/page-lock.ts';

/** Filer som får styla fält utan 16-pixelsgolvet prövat här. */
const FILES_WITH_FIELDS = SHEETS;

export function inloggningsgrind() {
  return {
    name: 'prikko:inloggningsgrind',
    hooks: {
      'astro:build:start': ({ logger }) => {
        const fel = [];
        const läs = (fil) => readFileSync(new URL(`../${fil}`, import.meta.url), 'utf8');

        for (const fil of SHEETS) {
          const källa = läs(fil);

          /* 1. Låset ska vara det delade.
             `overflow: hidden` på body stoppar besökarens svep men inte
             webbläsarens egen rullning, och det är den senare som flyttar
             sidan när tangentbordet fälls upp. Mätt: sidan kunde gå från 400
             till 1200 px medan rutan var öppen och låg kvar där efteråt. */
          if (/document\.body\.style\.overflow/.test(källa)) {
            fel.push(
              `${fil} sätter document.body.style.overflow själv. Det låser inte ` +
                `sidan, det stoppar bara besökarens svep. Använd lockPage() och ` +
                `unlockPage() ur ${LOCK}.`,
            );
          }

          if (!/from '\.\.\/lib\/page-lock'/.test(källa)) {
            fel.push(
              `${fil} importerar inte lockPage/unlockPage ur ${LOCK}. Ett ark som ` +
                'inte låser sidan lämnar besökaren någon annanstans än där hen var.',
            );
          }

          /* 2. Tangentbordet ska räknas.
             iOS krymper inte layoutviewporten när tangentbordet fälls upp,
             och dvh räknar det inte heller. Utan avdraget hamnar arkets nedre
             del bakom tangentbordet och webbläsaren panorerar sidan. */
          if (!källa.includes('--keyboard-inset')) {
            fel.push(
              `${fil} tar inte hänsyn till --keyboard-inset. Arket ligger då mot ` +
                'underkanten av en viewport som tangentbordet redan täckt, och ' +
                'webbläsaren flyttar sidan i stället.',
            );
          }

          /* 3. Fokus får aldrig rulla sidan.
             Rutorna ligger i top layer och syns alltid. Det enda webbläsaren
             kan åstadkomma med att rulla fram fältet är att flytta sidan
             under arket. */
          const nakenFokus = källa.match(/\.focus\(\)/g);
          if (nakenFokus) {
            fel.push(
              `${fil} har ${nakenFokus.length} anrop av .focus() utan ` +
                '{ preventScroll: true }. Rutan syns redan; det enda som händer ' +
                'är att sidan under flyttar sig.',
            );
          }
        }

        /* 4. Sexton pixlar är ett golv.
           Safari på iOS zoomar in hela sidan när ett fält med mindre än 16 px
           text får fokus, och zoomar aldrig ut igen. Fälten ärver 14 px ur
           konto.css, alltså måste varje ark skriva över det själv. */
        for (const fil of FILES_WITH_FIELDS) {
          const källa = läs(fil);
          const golv = /\.field (input|textarea)[^{]*\{[^}]*font-size:\s*(\d+)px/g;
          const träffar = [...källa.matchAll(golv)];
          if (träffar.length === 0) {
            fel.push(
              `${fil} sätter inget teckengolv på sina fält. De ärver 14 px ur ` +
                'konto.css, och iOS Safari zoomar in hela sidan när ett fält under ' +
                '16 px får fokus.',
            );
          }
          for (const träff of träffar) {
            if (Number(träff[2]) < 16) {
              fel.push(
                `${fil} sätter ${träff[2]}px på ett fält i ett ark. 16 är ett golv, ` +
                  'inte ett val: under det zoomar iOS Safari in sidan vid fokus och ' +
                  'zoomar aldrig ut igen.',
              );
            }
          }
        }

        if (fel.length > 0) {
          throw new Error(`Arken klarar inte grinden:\n  ${fel.join('\n  ')}`);
        }

        logger.info(
          `${SHEETS.length} ark delar skrollås, räknar tangentbordet, rullar aldrig ` +
            'vid fokus och håller teckengolvet på 16 px.',
        );
      },
    },
  };
}
