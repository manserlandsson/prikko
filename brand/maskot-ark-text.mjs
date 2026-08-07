/**
 * Förslagsarkets löpande text. Bryts ut ur byggskriptet så att texten går att
 * läsa och rätta som text.
 *
 * Allt här är research, inte tyckande. Varje påstående om Duolingo är uppmätt
 * i deras egna publicerade SVG-filer eller citerat ur deras designguide, och
 * varje påstående om varumärkesrätt är hämtat ur USPTO:s register eller ur
 * EU-domstolens praxis. Källorna står i tabellerna.
 */

export const INGRESS = `
<p class="lead">Fem maskotförslag har underkänts. Det här arket är gjort på ett annat
sätt: först research i Duolingos egna filer och i varumärkesregistret, sedan fem
tolkningar ritade oberoende av varandra, sedan urval. Bredd först, förfining sedan.</p>

<p>Beskedet som styr allt här: figuren ska se äkta ut, den ska gå att ha springande
på sidan, den ska byta färg med bedömningen, den får inte vara en fågel, och den ska
vara <b>tydlig men också supersnygg eller kul</b>. Tydlig betyder att man ser vad
figuren känner i 24 px. Kul betyder att den har en egenhet man minns. En figur som
är tydlig utan att vara kul blir ett piktogram. En som är kul utan att vara tydlig
går inte att använda som bedömningsmärke.</p>

<p>Och det senaste beskedet, som är rätt ände att bygga från: munnen och ögonen är
maskotens kärna. Prikkos identitet är redan ett ansikte. Ordmärket bär två punkter
och en båge, bedömningsmärkena är samma två punkter med bågen vänd åt tre håll.
Varje figur här nedanför är därför ritad ansikte först, och varje figur prövas med
kroppen bortklippt.</p>
`;

export const RESEARCH = `
<h2>Vad Duo faktiskt är, uppmätt</h2>

<p class="read">Duo är ingen bild, det är ett recept. Duolingo publicerar en tiostegs
ritordning och en formlära med exakt tre tillåtna grundformer: rundad rektangel,
cirkel, rundad triangel. Här är det som gick att mäta i deras egna filer, och som
vi har byggt efter.</p>

<table>
<tr><th>Vad</th><th>Uppmätt</th><th>Vad vi gör med det</th></tr>
<tr><td>Formbudget</td><td>Duolingos egen skala: 6 former för abstrakt, 15 lagom,
30 för många. Duos helkropp är exakt 15 banor.</td>
<td>Varje förslag här redovisar sin formräkning. Över 20 är underkänt.</td></tr>
<tr><td>Kroppen</td><td>Kropp, öron och vingar är EN enda path. Delarna är utskurna
ur silhuetten, inte pålagda ovanpå.</td>
<td>En huvudsilhuett per figur, inte tio hopklistrade klumpar.</td></tr>
<tr><td>Kontur</td><td>Noll stroke-attribut i fyra officiella filer. Ingen kontur
alls, medvetet.</td><td>Vi har heller ingen. Separation görs med valörskillnad.</td></tr>
<tr><td>Toning</td><td>Noll gradienter i fyra officiella filer. Volymen görs av
platta färgytor som ligger på varandra.</td>
<td>Tre toner per tillstånd, hårda kanter. Ingen linearGradient någonstans.</td></tr>
<tr><td>Skuggan</td><td>Alltid en pillerform under figuren, aldrig en oval, eftersom
ovaler antyder perspektiv.</td><td>Samma regel.</td></tr>
<tr><td>Ögonen i ikonläge</td><td>Ögonvitan är 31,6 procent av ikonens bredd per öga,
alltså 63 procent tillsammans. Pupillen är 47,5 procent av ögats bredd.</td>
<td>Vi gör motsatsen, se varumärkesavsnittet.</td></tr>
<tr><td>Pupillerna</td><td>Uttrycklig regel: centrera dem aldrig vertikalt. Centrerade
pupiller gör figuren obehaglig. I helkroppsläget sitter de nästan mot underkanten.</td>
<td>Ingen figur här har centrerade pupiller. Det är den billigaste knappen för liv
som finns.</td></tr>
<tr><td>Munnen</td><td>Den minst geometriska formen i hela stilen. Ska vara
asymmetrisk och favorisera ena sidan. Får bryta ut ur ansiktets ram vid starka
känslor.</td><td>Samma. Våra munbågar är asymmetriska.</td></tr>
<tr><td>Nedskalning</td><td>App-ikonen är inte Duo förminskad, den är ansiktet
beskuret tills ögonmasken går kant i kant. Kropp, vingar, öron, fötter och en
färgnyans offras.</td>
<td>Varje förslag har en helkroppsvariant och en beskuren ansiktsvariant för 40 px
och mindre, och redovisar vad som tas bort och i vilken ordning.</td></tr>
<tr><td>Rörelse</td><td>Duo står mestadels stilla, gör små uttrycksfulla rörelser,
och aldrig plötsliga eller snabba. Typisk längd i appen är fem sekunder eller
kortare.</td><td>Fyra rörelser, alla korta, alla på transform, ingen snabb loop.</td></tr>
<tr><td>Silhuetten</td><td>Duolingos egen historia: silhuetten kom först. Fungerar
inte helhetsformen kan detaljerna inuti den inte rädda den.</td>
<td>Varje förslag visas helsvart i 200, 64 och 24 px.</td></tr>
</table>

<p class="note">Formräkningen och de uppmätta procenttalen är gjorda i Duolingos
publicerade lockup-SVG och app-ikon-SVG från design.duolingo.com. Reglerna om
pupiller, mun, skugga och formbudget är citat ur deras egen designguide
(design.duolingo.com/illustration/duo och /illustration/shape-language) och ur
blog.duolingo.com/how-to-draw-duo-the-owl.</p>
`;

export const FALTET = `
<h2>Elva regler ur fältet, inte ur tyckande</h2>

<p class="read">Duo är en referens, inte facit. Tjugo maskotar och märken som bär hela
varumärken har gåtts igenom, och där det gick har SVG-filerna laddats ner och mätts:
antal banor, antal färger, antal gradienter, antal konturer. Det här är vad som
återkommer hos flera av dem oberoende av varandra.</p>

<div class="kort">
<h4>1. Tre färger eller färre i grundvarianten, helt platt</h4>
<p>Nyckelhålet har exakt tre, grön #007A33, svart och vit. GitLabs tanuki exakt tre.
Reddits app-ikon exakt två fyllningar. Androids bugdroid exakt två. Motexemplen är
lärorika: Firefox har tolv gradienter och blir meningslöst under 24 px, och Tux har
59 gradienter och behöver en separat svartvit fil för att fungera alls.</p>
</div>

<div class="kort">
<h4>2. Ingen ögonvita och ingen pupill. Ögat är en solid form eller ett hål</h4>
<p>Reddits Snoo: ögonen är solida orangea former, och i logotypen är de HÅL där
bakgrunden lyser igenom. Deras manual förklarar varför det är smart: mot mörk
bakgrund ska man använda huvudet fristående "to avoid inverting the eyes and mouth".
Hål kan inte inverteras. GitLab: ögat är en negativ triangel. Android: en vit cirkel
med radie 4 i ett huvud med radie 84, alltså 4,8 procent. LEGO 1978: två solida
svarta prickar, uttryckligen för att barnet skulle få bestämma uttrycket.
Twitter-fågeln och GitHubs Invertocat har inget öga alls.</p>
<p><b>Duolingo är undantaget, och det kostar dem en extra regel.</b> De har ögonvita
och pupill, och tvingas därför skriva att pupillen aldrig får centreras vertikalt,
annars ser figuren obehaglig ut. Ögonvita kostar en regel till.</p>
<p>Prikkos prickögon ligger alltså på rätt sida av den här regeln sedan första
ritningen. Det är ingen tillfällighet att de överlever 16 px.</p>
</div>

<div class="kort">
<h4>3. Ingen kontur. Stroke är en nödlösning för kontrast, inte ett stilgrepp</h4>
<p>Reddit förbjuder det ordagrant, "DON'T OUTLINE THE SNOO HEAD". GitLab förbjuder
"strokes, color fills, outlines or shadows". Noll stroke uppmätt i Mailchimp, Reddit,
GitLab, Slack, Docker, Firefox och Tux. Nyckelhålet tillåter en hårfin vit linje
enbart när bakgrunden har samma färg som symbolen. Den enda som gör konturen till
bärande stil är PostgreSQL, och den gör det med fyra olika vikter i samma figur.
Väljer man kontur ska den alltså variera, för det är det enda som läser som handverk.</p>
</div>

<div class="kort">
<h4>4. Uttrycket ska sitta i exakt EN parameter</h4>
<p>Reddits Snoo: enbart antennens krökning. "The curve and bend of the antenna helps
to show emotion." Mailchimps Freddie: enbart blinkningen, och den ändras aldrig,
"Freddie always winks because he has a great attitude".</p>
<p>Och den som ligger närmast oss av alla: <b>danska smileyordningen ändrar bara
munnen.</b> Den 1 januari 2022 gick Fødevarestyrelsen från fyra ansikten till tre och
tog bort den lätt leende, just för att de fyra inte gick att skilja åt. 2023 kastade
de dessutom kontrollrapporten i fönstret och gjorde smileyn central, eftersom folk
inte läste texten, de tittade på ansiktet.</p>
<p>Det är exakt vår situation, och det är Prikkos befintliga märke: tre lägen, samma
två prickar, bara munnen vänd. Den lösningen är alltså redan validerad av en
myndighet som drivit den i över tjugo år.</p>
</div>

<div class="kort">
<h4>5. Skriv ner vad som är FÖRBJUDET, inte bara vad som är tillåtet</h4>
<p>Den skarpaste skiljelinjen i hela materialet. De starkaste systemen dokumenterar
negativspecifikationer. Reddit: ge inte Snoo näsa, fingrar eller tår. Duolingo:
spetsiga former är off brand, ovaler är inte tillåtna som ögon, skuggan är en
pillerform och aldrig en oval. GitLab: skapa inte maskotar inspirerade av tanukin.
Ett förbud är den sortens regel som inte glider iväg mot generiskt.</p>
</div>

<div class="kort">
<h4>6. Låt en dimension i figuren bli en systemenhet</h4>
<p>Reddit: skiljelinjen i partnerlogotyper har samma tjocklek som Snoos antenn.
Klarna mäter frizonen i K-höjder. Spotify i halva ikonhöjder. GitLab i x-höjden på
a:et. Nyckelhålet i 0,25 diametrar. Måtten härleds ur figuren, aldrig ur px.</p>
</div>

<div class="kort">
<h4>7. Figuren måste ha ett enpathsläge, och det ska vara en egen fil</h4>
<p>Tre projekt löser det identiskt. GitLab: 8 banor i 3 färger blir 1 bana i 1 färg i
16x16-spriten. Tux: 65 banor med 59 gradienter blir 2 banor i tux-bw.svg. Docker:
14 banor i 5 färger blev till slut en enfärgad valsilhuett utan ansiktsdrag alls.
GitHub gör samma sak strukturellt genom att skilja Mona, illustrationen, från
Invertocat, som är en enda sluten kontur utan ögon.</p>
<p><b>Testet:</b> kan figuren inte kollapsa till en fylld silhuett har den inget
faviconläge. Därför står siluettprovet på varje kort här.</p>
</div>

<div class="kort">
<h4>8. Rita om figuren för liten storlek. Skala den inte ned</h4>
<p>Ingrid Vang Nyman gjorde Pippi knubbigare och mer småbarnslik när hon skulle bli
serie 1957, för att fungera i de små rutorna. Mailchimps Freddie fick 2018 renare
linjer, starkare silhuett och färre detaljer. Klarnas avatar är konstruerad så att
den kan beskäras från kvadrat till cirkel utan att skalas.</p>
<p>Publicerade minsta storlekar i fältet: Reddit 40 px, Spotify 21 px för ikonen,
GitLab 20 px, Klarna 20 px symbolbredd, Slack 15 till 20 px, BankID 16 px.</p>
</div>

<div class="kort">
<h4>9. Lås grundformen, frigör allt annat</h4>
<p>Octodex är beviset: 162 octocats där huvud, öron, morrhår och nos ligger fast,
GitHub kallar öron och morrhår "important elements of her silhouette", medan
tentakler, pose, kostym och färg är fria. Konsistensen hålls med model sheets och
expression sheets, inte med smak.</p>
<p>Reddit skriver sina proportionsregler i klartext, och det är så en sådan regel ska
se ut: SNOO IS TWO HEADS TALL, ARMS ONLY EXTEND THE WIDTH OF SNOO'S HEAD, EYES SIT ON
THE CENTER LINE OF SNOO'S HEAD, SMALL SNOUT AND CHEEKS.</p>
</div>

<div class="kort">
<h4>10. Låt figurens formspråk läcka in i typografin</h4>
<p>Reddits i-prickar är OrangeRed och överdimensionerade, uttryckligen för att påminna
om Snoos ögon. Duolingos Feather Bold har bokstavsformer hämtade ur Duos vingform.
Klarna gjorde punkten i logotypen till en bärande del av rubriktypografin.</p>
<p>Prikko har redan halva den kopplingen: wordmarkens ansikte sitter i ordet. Den dag
maskoten är vald kan pricken över i:et bli figurens öga, och då hänger identiteten
ihop även på sidor där figuren inte syns.</p>
</div>

<div class="kort">
<h4>11. Metaforen ska vara godtycklig, inte bokstavlig</h4>
<p>En schimpans i postmössa för mejl. En katt korsad med en bläckfisk. En utomjording
som pratar med antenn. En pingvin som är för proppmätt för att stå upp. Ett kodfel
som gjorde grisen hög i stället för lång.</p>
<p>Motexemplet är Docker: valen med containrar på ryggen är den enda i urvalet där
metaforen är helt bokstavlig, den köptes för 799 dollar i en crowdsourcad tävling,
och den är också den enda som med tiden fick sina ansiktsdrag borttagna helt.</p>
<p><b>Det här är den regel som väger tyngst mot tvättbjörnen</b>, där tvätt bokstavligen
står i namnet, och delvis mot kameleonten, där färgbytet är figuren rakt av. Den väger
för grävlingen, där kopplingen går via ordet gräva och inte via en bild på smuts.</p>
<p class="note">Bonusregel som är svårast av alla att härma: subtrahera något figuren
borde ha. Angry Birds har inga armar och ben, ett aktivt bortval. Firefox tog bort
rävens ben. Twitter-fågeln har inget öga. Snoo har ingen näsa.</p>
</div>
`;

export const VARUMARKE = `
<h2>Varumärket. Varför vår figur inte kan bli en Duo i annan färg</h2>

<p class="read">Det här är den delen som avgör vad vi INTE får göra. Ett tidigare
förslag underkändes med orden "ser ut som en kopia på den jag skickade", och den
domen var juridiskt lika riktig som den var estetisk.</p>

<div class="kort">
<h4>Vad Duolingo faktiskt äger</h4>
<table>
<tr><th>Registrering</th><th>Vad</th><th>Varför det spelar roll för oss</th></tr>
<tr><td>US 88718551, klass 41</td><td>Figurmärke: "an owl with large eyes, a beak,
and three half circle feathers on the chest". <b>Ingen färg gjord anspråk på.</b></td>
<td>Att byta färg på en uggla hjälper inte. Formen är skyddad oavsett kulör.</td></tr>
<tr><td>US 90181934, reg. 7255487, klass 42</td><td>"two white eyes with black pupils
and an orange beak with green feathers". <b>Grönt, orange, svart och vitt är
uttryckligen väsentliga delar av märket.</b></td>
<td>Klass 42 är webbtjänster, alltså vår klass. Grönt som figurens primärfärg plus
orange nos är den kombination de äger.</td></tr>
<tr><td>Upphovsrätt</td><td>Duolingo uppger i sina SEC-inlagor att de har
registrerade upphovsrätter som täcker logotyper och figurer, inklusive Duo.</td>
<td>Upphovsrätten bryr sig inte om klasser eller branscher och gäller i Sverige
via Bernkonventionen. Det är den farligare grunden för en maskot.</td></tr>
</table>
</div>

<div class="kort">
<h4>Praxis: det är inte arten som fäller</h4>
<p><b>Sabel mot Puma, EU-domstolen C-251/95.</b> Två springande kattdjur.
Domstolen slog fast att bedömningen är en helhetsbedömning av helhetsintrycket,
att begreppsmässig likhet ensam inte räcker, men att ju mer känt det äldre märket
är, desto längre sträcker sig skyddet. Duo är extremt känt, vilket drar åt fel håll
för oss.</p>
<p><b>Buc-ee's mot Mickey's, 2026.</b> En bäver stämde en älg. Alltså ett helt annat
djur. Grunden var att båda var "a cartoon animal facing right with wide eyes and a
smile, overlaying a round background" med jämförbar palett. Sensmoralen är den
viktigaste lärdomen i hela researchen: <b>det är inte arten som fäller, det är posen,
inramningen, ansiktsuttrycket och paletten.</b></p>
<p class="note">Duolingos egna dokumenterade processer handlar uteslutande om namnet,
alltså suffixet -lingo, inte om ugglan. Det ska inte tolkas som att risken är noll,
bara att den bevisade aggressionen ligger på namnet.</p>
</div>

<div class="kort">
<h4>Checklistan varje förslag här har prövats mot</h4>
<ol class="steg">
<li>Ingen fågel, oavsett art och färg.</li>
<li>Inget runt djurhuvud som fyller en cirkulär platta med kroppen bortklippt. Det
var precis grunden i Buc-ee's. Vår beskurna variant sitter därför i den rundade
kvadrat märket redan har, inte i en cirkel.</li>
<li>Inte två stora runda ögon med små pupiller som dominerar huvudet. Det är
ordagrant med i Duos märkesbeskrivning.</li>
<li>Ingen grön kropp med orange eller gul nos.</li>
<li>Inga tre halvcirklar eller fjäderbågar på bröstet.</li>
<li>Inte rakt framifrån, symmetriskt, med fötterna ihop.</li>
<li>Inte Duos beteendespråk: hotfulla notiser, streaks, en figur som blir ledsen
när du inte kommer tillbaka.</li>
</ol>
</div>

<div class="kort">
<h4>Vårt starkaste avstånd till Duo är något vi redan äger</h4>
<p>Duos ögon är vita glober med mörka pupiller, och de tar 63 procent av ikonens
bredd. Prikkos ögon är <b>två solida vita prickar utan ögonvita</b>, 12,8 procent
av märkets bredd vardera, och de har varit det sedan första ritningen.</p>
<p>Det är en inversion, inte en variation. Där Duo har ljust fält med mörk kärna har
vi mörkt fält med ljus kärna. Ingen figur som behåller Prikkos prickögon kan
förväxlas med Duo, hur bra hantverket än blir. Därför bär varje förslag här
prickögonen oförändrade, och det är också därför de går att skala: en solid prick
överlever 16 px, en glob med pupill och glansdager gör det inte.</p>
</div>
`;

export const LAGEN = `
<h2>Två lägen, en karaktär</h2>

<p class="read">Sajtens bedömningsmärke är i dag en rundad kvadrat med ett ansikte i,
och den strukturen ska inte kastas. Duolingo gör exakt samma sak: app-ikonen är inte
Duo förminskad, den är ansiktet beskuret i en rundad kvadrat tills ögonmasken går kant
i kant, medan hela figuren lever fritt inne i appen. Kropp, vingar, öron, fötter och en
färgnyans offras i ikonen. De två formerna är alltså inte konkurrenter, de är två lägen
av samma karaktär.</p>

<div class="kort">
<table>
<tr><th></th><th>Inramat läge</th><th>Fritt läge</th></tr>
<tr><td><b>Vad det är</b></td>
<td>Ansiktet beskuret i den rundade kvadraten. Detta ÄR bedömningsmärket.</td>
<td>Hela figuren, ingen ram, kropp och lemmar.</td></tr>
<tr><td><b>Var det står</b></td>
<td>Listor, kartnålar, sökträffar, favicon, delningsbilder.</td>
<td>Tomma sidor, 404, illustrationer, och den som springer över en yta.</td></tr>
<tr><td><b>Minsta storlek</b></td>
<td>16 px. Fältet ligger på 15 till 40 px för motsvarande märken: Reddit 40, Spotify 21,
GitLab 20, Klarna 20, BankID 16.</td>
<td>72 px. Under det försvinner lemmarna och då ska det inramade läget användas.</td></tr>
<tr><td><b>Geometri</b></td>
<td>FaceMark.astro oförändrad: 100-ruta, rx 17. Ingen anledning att röra den, den är
inarbetad på hela sajten och igenkänningen är gratis.</td>
<td>120-ruta, marken på y 116.</td></tr>
</table>

<p>Tricket som får det inramade läget att sitta ihop är Duolingos eget: <b>ramens
fyllning är figurens egen grundton.</b> Huvudets kontur försvinner då in i bakgrunden och
det enda som syns är dragen. Märket blir därmed strukturellt identiskt med dagens,
alltså en färgad rundad kvadrat med två vita prickögon och en vit munbåge, och det som
tillkommer är artens tecken.</p>

<p>Det ger också ett hårt och nyttigt villkor som varje figur här har ritats mot från
början: <b>ansiktet måste fungera både beskuret i kvadraten och som del av en hel
kropp.</b> Det är därför ansiktsraden ligger först på varje kort och kroppen sist.</p>

<p class="note">En anmärkning från varumärkessidan som gjorde valet av ram lättare: i
Buc-ee's mot Mickey's 2026 var grunden att båda maskotarna var "a cartoon animal facing
right with wide eyes and a smile, overlaying a <b>round</b> background". Vår ram är en
rundad kvadrat och har varit det sedan första ritningen. Den runda varianten som finns i
FaceMark bör inte bli maskotens hemvist.</p>
</div>
`;

export const DETEKTIV = `
<h2>Detektiven, utan hatt och förstoringsglas</h2>

<p class="read">Beskedet var att figuren gärna får läsa som detektiv, men att rekvisitan
är farlig. Förstoringsglas, deerstalker och kappa är det första en bildbank spottar ur
sig, och de signalerar dessutom mysterium snarare än granskning. Vi vill ha granskning.</p>

<p class="read">Så här löses det i stället, och alla fem figurerna använder samma sex
grepp. Ingen av dem bär rekvisita i någon pose på det här arket.</p>

<div class="kort">
<ol class="steg">
<li><b>Blickriktningen är den bärande signalen.</b> Figuren tittar inte på dig, den
tittar på något i gränssnittet: på en siffra, på ett datum, in i en lista. En figur som
möter din blick och ler är en värd. En figur som tittar bort på något specifikt är en
granskare. Det är det enskilt viktigaste greppet och det kostar ingenting.</li>
<li><b>Huvudlutning plus ETT höjt ögonbryn.</b> Lutning är nyfikenhet, sammandragna bryn
är fokus, smala ögon är misstro. Ett höjt bryn läser som "jaha, är det så?" utan att bli
fientligt. Två höjda bryn blir förvåning, två sänkta blir ilska, och vi vill ha
varken.</li>
<li><b>Framåtlutad kropp.</b> Att luta sig in mot något, stanna upp, sträcka på halsen.
Hållning och silhuett bär personligheten starkare än ansiktet, särskilt i små storlekar
där ansiktet ändå försvinner.</li>
<li><b>Den upprätta spanarposen.</b> Compare the Markets surikat fungerar av precis det
skälet: djuret står upprätt på bakbenen och skannar horisonten, ett beteende som är
väldokumenterat i forskningen. Vi lånar posen, inte arten.</li>
<li><b>En tass på något.</b> Figuren håller i, pekar på eller vilar tassen mot en rad i
listan. Det gör den till en aktör i gränssnittet i stället för en dekoration bredvid
det.</li>
<li><b>Naturlig mask i pälsteckningen.</b> Grävlingens två band genom ögonen och
tvättbjörnens mask är färdiga detektivmasker som arten redan har. Ingen har hängt på
dem, de var där. Det är den enda "rekvisita" som aldrig kan se pålagd ut.</li>
</ol>
<p class="note">En anmärkning om litet format: grävlingens band är LODRÄTA och
tvättbjörnens mask är VÅGRÄT. Två separerade lodräta streck överlever nedskalning,
medan ett brett vågrätt band smetar ihop till ett enda mörkt fält. Det är en av
anledningarna till att grävlingen klarar 24 px bättre.</p>
</div>
`;

export const BETYDELSE = `
<h2>Vad djuret säger om tjänsten</h2>

<p class="read">Form är halva jobbet. Den andra halvan är vad figuren betyder utan att
någon förklarar den. Här är beläggen bakom de fem, och de invändningar som följer
med dem.</p>

<table>
<tr><th>Figur</th><th>Vad den säger</th><th>Belägg</th><th>Invändningen</th></tr>

<tr><td><b>Grävlingen</b></td>
<td>Den som gräver fram det någon inte lagt fram frivilligt, och som håller rent
omkring sig.</td>
<td>Ordet <b>gräva</b> är svenskans etablerade ord för granskning: Föreningen Grävande
Journalister sedan 1990, priset Guldspaden sedan 1991, Grävseminariet sedan 1989 med
500 till 700 deltagare om året. Beteendet är också belagt: grävlingen anlägger
latringropar UTANFÖR grytet, byter ut bäddmaterialet i stället för att lägga nytt
ovanpå, och vädrar det. Nowak 1999 via Wikipedia, plus Mammal Society och
Wildlife Online.</td>
<td>I svensk vardag är grävlingen också ett djur man kör på med bilen. Måste ritas
alert, aldrig tjock och sömnig.</td></tr>

<tr><td><b>Kameleonten</b></td>
<td>Den som ser åt två håll samtidigt, och som inte kan dölja vad den hittade
eftersom det syns på skinnet.</td>
<td>Ägarens eget uppslag, och det enda djur där färgbytet ÄR artens egenskap.
Biologin bär dessutom rätt berättelse: Stuart-Fox och Moussalli visade 2008 på 21
populationer att färgbytet drivits fram av <b>signalering, inte kamouflage</b>, och
Milinkovitchs grupp visade 2015 mekanismen, ett gitter av guaninnanokristaller som
aktivt omorganiseras. Alltså: figuren byter inte färg för att gömma sig, den byter
färg för att tala om. Synen är också belagd, 342 graders synfält med en blind fläck
på 18 grader, och ögonen kan följa två mål samtidigt.</td>
<td><b>Allvarlig, och den gäller språket.</b> SAOB ger den bildliga betydelsen av
kameleont om en person som "person som, med egen fördel för ögonen, ändrar mening
eller uppträder helt olika allt efter omständigheterna". Synonymerna är anpassling,
opportunist och vindflöjel. Ordet ligger i samma fält som att vända kappan efter
vinden. Vår tjänst går ut på att säga som det är oavsett vem som frågar, och vi
skulle alltså välja ett djurnamn vars svenska huvudbetydelse är motsatsen.
<br><br>Dessutom: Singapores bankförening lanserade 2024 antibedrägerimaskoten Leon
the Skameleon, där kameleonten står för <b>bedragaren</b> som byter färg för att
smälta in. Det är konsumentskydd, alltså vår kategori, med rakt motsatt symbolik.
SUSE äger dessutom kameleonten i teknikvärlden sedan 2000, och figuren är stockbankernas
favoritdjur, vilket gör det svårt att inte se generisk ut.
<br><br>Och metaforen är bokstavlig: färg betyder färg. Fältregel 11 säger att de
metaforer som håller är godtyckliga.</td></tr>

<tr><td><b>Tvättbjörnen</b></td>
<td>Den som känner efter med händerna, med en färdig detektivmask i pälsteckningen.</td>
<td>Artepitetet <i>lotor</i> är latin för tvättare. Framtassarna är extremt känsliga.
Masken löser detektivspåret utan hatt och förstoringsglas.</td>
<td>Allvarlig. Naturvårdsverket och Havs- och vattenmyndigheten säger uttryckligen att
tvättbjörnen INTE tvättar sin mat, den letar föda med tassarna. En hygientjänst vars
maskot bygger på en missuppfattning är en rubrik som väntar. Arten är dessutom
EU-listad invasiv och förbjuden i Sverige, och kulturassociationen är soptunna och
tjuv.</td></tr>

<tr><td><b>Gårdsvätten</b></td>
<td>Den lilla som går runt på gården, ser efter att det är rent, och säger som det är.</td>
<td>Institutet för språk och folkminnen beskriver tomtegubben som ett väsen som
sopade, skötte djuren och höll ordning, som KRÄVDE renlighet, som straffade vanvård
och slarv med en örfil, och som belönade den som skötte sig. Det är Prikkos affärsidé
formulerad som svensk folktro, hundratals år innan tjänsten fanns.</td>
<td>Två. Det är inte ett djur, och ägaren sa djur. Och julkopplingen är svår att bli
av med året runt. Måste vara vätte i arbetskläder med grå luva, aldrig jultomte.</td></tr>

<tr><td><b>Spårhunden</b></td>
<td>Den som luktar sig fram till vad som faktiskt hände i köket.</td>
<td>Det enda djur allmänheten redan förknippar med att söka upp något dolt.</td>
<td>Hunden är det mest ritade djuret som finns och fältet är överfullt. Metaforen är
dessutom bokstavlig på samma sätt som Dockers val med containrar på ryggen.</td></tr>
</table>

<p class="note">Kategorikontext som gäller alla fem: den etablerade visuella koden för
livsmedelskontroll i Norden är smileyn. Danmark har smileyordningen sedan 2001, och
Sverige utredde samma sak i SOU 2005:44 utan att införa den. Vår figur konkurrerar
alltså om samma mentala plats som en gul gubbe, och det talar för en figur med
karaktär och blick snarare än för ett ansiktsuttryck.</p>
`;

export const NAMN = `
<h2>Namnet är avgjort. Djuret heter Prikko</h2>

<p class="read">Maskoten och tjänsten är samma sak. Det är precis så Duo fungerar hos
Duolingo, och det förenklar bedömningsmärkena mer än det låter: det är <b>Prikko</b> som
är nöjd, tveksam eller bekymrad, inte en figur som råkar stå bredvid ett resultat.
Meningen "Prikko säger inga anmärkningar" går att skriva. "Benny säger inga anmärkningar"
gör det inte, för då är Benny en tredje part.</p>

<p class="read">Det stänger också en dörr som annars stod öppen. Namnkandidaterna Prick,
Kikko och Gräv är avfärdade. Prick var dessutom den enda med ett verkligt hinder:
barnboksserien Prick och Fläck av Lotta Geffenblad är väletablerad i svensk barnkontext.</p>

<p class="note">Duolingo processar bevisligen mot namn som slutar på -lingo, och mot
ingenting annat. Prikko ligger fritt från det problemet.</p>
`;

export const REGLER = `
<h2>Regellistan, med skäl</h2>

<p class="read">En tidigare version av det här arket bar en regellista utan motiveringar,
och den frågan kom direkt och med rätta: varför? En regel utan skäl är inte disciplin, det
är vidskepelse. Här står varje rad med sitt skäl, och skälet ska hålla för en följdfråga.</p>

<p class="read">Två saker att säga rakt ut först. Det här är en <b>redesign</b>. Det gamla
märket får ändras, och att bevara det är inget värde i sig. Och Duo är en <b>referens att
lära av, inte en mall att följa</b>: där vi gör tvärtemot Duo ska det vara ett val vi kan
försvara, inte en regel som råkade skrivas ned.</p>

<div class="kort">
<table>
<tr><th>Regel</th><th>Skäl</th><th>Status</th></tr>

<tr><td><b>Ögonen är solida vita prickar, ingen ögonvita och ingen pupill</b></td>
<td>Detta är den regel som ifrågasattes, och den förtjänade det, eftersom Duos hela
känsloregister bevisligen bärs av ögonvita, pupillplacering och ögonlockets vinkel.
Fyra skäl att ändå välja bort det. <b>Ett:</b> fältet gör det. Reddits Snoo har solida
ögon utan pupill, GitLabs tanuki har en negativ triangel, Androids bugdroid har en vit
cirkel med radie 4 i ett huvud med radie 84, LEGO 1978 har två solida svarta prickar, och
Twitter-fågeln och GitHubs Invertocat har inget öga alls. Duo är undantaget, inte normen.
<b>Två:</b> ögonvita kostar en regel till. Duolingo tvingas skriva att pupillen aldrig får
centreras vertikalt, annars ser figuren obehaglig ut. <b>Tre:</b> en solid prick överlever
16 px, en glob med pupill och glansdager gör det inte, och vårt märke måste ned till 16.
<b>Fyra:</b> det är vårt tydligaste avstånd till Duo. Där han har ljust fält med mörk
kärna har vi mörkt fält med ljus kärna. Det är en inversion, inte en variation.</td>
<td><span class="tagg ok">Behålls</span><br><span class="note">Ägaren: "fine utan
pupillar osv"</span></td></tr>

<tr><td><b>Uttrycket bärs av en enda parameter</b></td>
<td>Danska smileyordningen ändrar bara munnen, och Fødevarestyrelsen gick 1 januari 2022
från fyra ansikten till tre just för att de fyra inte gick att skilja åt. Det är samma
kategori som vår och över tjugo års drift. Reddit gör samma sak med antennen, Mailchimp
med blinkningen.</td>
<td><span class="tagg ok">Behålls</span></td></tr>

<tr><td><b>Ingen kontur</b></td>
<td>Noll stroke uppmätt i Duos, Mailchimps, Reddits, GitLabs, Slacks, Dockers och Firefox
egna filer. Reddit och GitLab förbjuder det uttryckligen i sina manualer. Skälet är
praktiskt: en kontur som är läsbar i 200 px täpper igen figuren i 16 px.</td>
<td><span class="tagg ok">Behålls</span></td></tr>

<tr><td><b>Inga gradienter</b></td>
<td>Verifierat i fyra officiella Duo-filer: noll gradienter. Firefox har tolv och blir
meningslöst under 24 px, Tux har 59 och behöver en separat svartvit fil. Flera platta
toner med hårda kanter ger volymen utan priset.</td>
<td><span class="tagg ok">Behålls</span><br><span class="note">Detta ändrar dagens märke,
som faktiskt HAR en gradient i FaceMark. Redesignen tar bort den.</span></td></tr>

<tr><td><b>Rundad kvadrat, inte cirkel</b></td>
<td>Inte estetik utan juridik. I Buc-ee's mot Mickey's 2026 var grunden att båda
maskotarna var "a cartoon animal facing right with wide eyes and a smile, overlaying a
<b>round</b> background". Vår ram är en rundad kvadrat och har varit det sedan första
ritningen.</td>
<td><span class="tagg ok">Behålls</span></td></tr>

<tr><td><b>Ramens fyllning är figurens egen grundton</b></td>
<td>Det här var Duolingos grepp, och det var FEL för oss. Duos ansikte har fyra värden
inuti det gröna fältet: ljusare ögonmask, vit ögonvita, mörk pupill och gul näbb. Vår
figur hade ett värde plus vitt, och då blir märket en klump.</td>
<td><span class="tagg varning">Struken</span><br><span class="note">Ägarens diagnos:
"deras huvud sätts mot samma bakgrund som märket". Se kontrastprovet.</span></td></tr>

<tr><td><b>Formbudget: 15 banor</b></td>
<td>Duolingos egen skala, 6 för abstrakt, 15 lagom, 30 för många, och Duos helkropp
mäter exakt 15. Siffran är deras, inte vår.</td>
<td><span class="tagg">Riktvärde, inte lag</span></td></tr>

<tr><td><b>Nedskalning genom beskärning</b></td>
<td>Duolingos app-ikon är ansiktet beskuret tills ögonmasken går kant i kant, inte Duo
förminskad. Samma mönster hos GitLab, Tux, Docker och GitHub, som alla har ett separat
förenklat läge för litet format.</td>
<td><span class="tagg ok">Behålls</span></td></tr>

<tr><td><b>Centrera aldrig pupillerna</b></td>
<td>Duolingos egen regel. Utan pupiller gäller den oss inte, men <b>motsvarigheten</b>
gör det: prickögonen ska inte sitta symmetriskt mitt i ansiktet och möta betraktarens
blick. En figur som möter din blick och ler är en värd, en som tittar på något i
gränssnittet är en granskare.</td>
<td><span class="tagg">Omskriven för vårt öga</span></td></tr>
</table>
</div>
`;

export const DUOJAMFORELSE = `
<h2>Duo bredvid vår, mätt</h2>

<p class="read">Begäran var att lägga Duo bredvid våra skisser så att skillnaden går att se
med ögat. Duos figur ritas <b>inte</b> av här, och det är ett medvetet val: Duolingo uppger
i sina SEC-inlagor att de har registrerade upphovsrätter som täcker figuren, och att klistra
in deras teckning i vår varumärkesmapp är precis det vi säger att vi inte gör. Det som går
att jämföra utan att kopiera är TALEN, och de är uppmätta i deras egna publicerade
SVG-filer.</p>

<div class="kort">
<table>
<tr><th>Mått</th><th>Duo, uppmätt</th><th>Prikko</th><th>Vad skillnaden betyder</th></tr>

<tr><td>Banor i helkropp</td><td>15</td><td>11 respektive 13</td>
<td>Vi ligger under deras egen budget. Det är inte automatiskt bättre: 6 former är enligt
dem själva för abstrakt.</td></tr>

<tr><td>Gradienter</td><td>0 i fyra officiella filer</td><td>0</td>
<td>Samma. Volymen görs av platta ytor som ligger på varandra.</td></tr>

<tr><td>Konturer</td><td>0 stroke-attribut</td><td>0</td><td>Samma.</td></tr>

<tr><td>Ögonvitans bredd</td><td>31,6 % av ikonen per öga, 63 % tillsammans</td>
<td>Ingen ögonvita. Pricken är 12,8 % av bredden</td>
<td>Den största skillnaden i hela jämförelsen, och den är ett val. Deras öga är fem gånger
så stort som vårt.</td></tr>

<tr><td>Pupillen</td><td>47,5 % av ögats bredd, aldrig vertikalt centrerad</td>
<td>Ingen pupill</td>
<td>Här ligger konsekvensen: Duo bär hela sitt känsloregister i ögonen. Vi har stängt den
kanalen och måste därför bära det i munnen.</td></tr>

<tr><td>Munnens bredd</td><td>Övre näbben 11,9 % av kroppens bredd</td>
<td>38,3 % av märkets bredd</td>
<td>Vår mun är över tre gånger så bred relativt figuren. Det är rätt, eftersom den bär
det ögonen bär hos honom.</td></tr>

<tr><td>Var rörelsen sitter</td><td>Mest i ansiktet. Kroppen står mestadels stilla, aldrig
plötsliga eller snabba rörelser</td>
<td>Bildrutor med ojämn hålltid, ansiktet deformeras med kroppen</td>
<td>Detta är den kritiska punkten. En figur vars ansikte bara åker med läser som en
pappersdocka, hur bra kroppen än rör sig.</td></tr>

<tr><td>Looplängd</td><td>Fem sekunder eller kortare i appen</td>
<td>0,68 sekunder för gångcykeln</td>
<td>Vår är en loop, deras är en händelse. Olika saker.</td></tr>

<tr><td>Nedskalning</td><td>Ansiktet beskuret tills ögonmasken går kant i kant. Kropp,
vingar, öron, fötter och en färgnyans offras</td>
<td>Samma metod, offerordningen redovisas per figur</td>
<td>Samma.</td></tr>

<tr><td>Teknik</td><td>Rive med State Machine. 8 huvudanimationer gånger 8
kroppsanimationer ger över 64 varianter, filen under 1 MB. Två animationsstudior köpta,
Gunner 2022 och Hobbes 2024 med tolv motion designers</td>
<td>Bildrutor i SVG, noll körtid</td>
<td>Ärligt: de har en avdelning, vi har en byggfil. Bildrutor är rätt val för oss, men det
är ett val under en annan budget och det ska sägas rakt ut.</td></tr>
</table>
</div>

<p class="note">Källor: design.duolingo.com/illustration/duo och /illustration/shape-language,
blog.duolingo.com/how-to-draw-duo-the-owl och /reshaping-duo, samt egna mätningar i
Duolingos publicerade lockup-SVG och app-ikon-SVG från design.duolingo.com/identity/logos.</p>
`;
