/**
 * Bygggrind: rutarkivet ska gå att läsa med den kod webbläsaren kör.
 *
 * `src/lib/pmtiles.ts` är vår egen skrivare mot ett publicerat format, och en
 * egen skrivare utan en mätning är ett löfte. Den här grinden öppnar den
 * FÄRDIGA filen i `dist/` med det officiella `pmtiles`-paketet, alltså exakt
 * samma läsare som MapLibres protokollhandtag använder, och packar upp ett
 * urval rutor med samma protobuf-avkodare.
 *
 * Går något av det inte stannar bygget. Alternativet är en karta som laddar
 * stilen, ritar kontrollerna och sedan står tom, vilket är det svåraste felet
 * som finns i det här systemet: det säger ingenting i konsolen.
 *
 * Fem saker prövas:
 *
 *   1. Huvudet går att läsa och säger rätt version, rutformat och zoomspann.
 *   2. Metadatan går att packa upp och innehåller vårt lager.
 *   3. Varje ruta i pyramidens topp går att hämta och avkoda.
 *   4. Den TÄTASTE rutan går att avkoda, och bär både kluster och nålar.
 *   5. En ruta som inte finns ger undefined och inte ett kastat fel.
 */
import { globSync, openSync, readSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PMTiles } from 'pmtiles';
import { VectorTile } from '@mapbox/vector-tile';
import { PbfReader } from 'pbf';
import { TILE_LAYER } from '../src/lib/kartrutor.ts';

/** pmtiles egen FileSource förutsätter webbläsarens File. Den här läser ur
 *  filsystemet med samma gränssnitt. */
function nodeSource(path) {
  const fd = openSync(path, 'r');
  return {
    getKey: () => path,
    async getBytes(offset, length) {
      const b = Buffer.alloc(length);
      readSync(fd, b, 0, length, offset);
      return { data: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) };
    },
  };
}

function decode(data) {
  return new VectorTile(new PbfReader(new Uint8Array(data))).layers[TILE_LAYER];
}

export function kartrutegrind() {
  return {
    name: 'prikko:kartrutegrind',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const filer = globSync('kartrutor/*.bin', { cwd: out });

        if (filer.length !== 1) {
          throw new Error(
            `Förväntade exakt ett rutarkiv i dist/kartrutor/, hittade ${filer.length}. ` +
              'Adressen är innehållsbaserad, så två filer betyder att rutten byggt ' +
              'fler hashar än en. Se src/pages/kartrutor/[file].bin.ts.',
          );
        }

        const path = `${out}${filer[0]}`;
        const arkiv = new PMTiles(nodeSource(path));
        const h = await arkiv.getHeader();

        if (h.specVersion !== 3) throw new Error(`Rutarkivet säger spec ${h.specVersion}, ska vara 3.`);
        if (h.tileType !== 1) throw new Error(`Rutarkivet säger rutformat ${h.tileType}, ska vara 1 (mvt).`);
        if (h.minZoom !== 0) throw new Error(`Rutarkivet börjar på z${h.minZoom}, ska börja på z0.`);
        if (!h.clustered) throw new Error('Rutarkivet är inte märkt clustered, alltså ligger rutorna inte i tal-ordning.');

        const meta = await arkiv.getMetadata();
        if (!meta.vector_layers?.some((l) => l.id === TILE_LAYER)) {
          throw new Error(`Rutarkivets metadata saknar lagret "${TILE_LAYER}". Kartans lager läser det namnet.`);
        }

        /*
         * Toppen av pyramiden. Den som öppnar rikskartan ser z0 till z5, och en
         * trasig ruta där är en tom karta för varenda besökare.
         */
        for (let z = 0; z <= 5; z += 1) {
          let hittad = false;
          for (let x = 0; x < 2 ** z && !hittad; x += 1) {
            for (let y = 0; y < 2 ** z && !hittad; y += 1) {
              const t = await arkiv.getZxy(z, x, y);
              if (!t) continue;
              if (!decode(t.data)) throw new Error(`Rutan z${z}/${x}/${y} saknar lagret ${TILE_LAYER}.`);
              hittad = true;
            }
          }
          if (!hittad) throw new Error(`Ingen ruta alls på z${z}. Pyramidens topp är tom.`);
        }

        /* Den tätaste rutan i beståndet, alltså den enda som kan bli för stor.
           Talet loggas så att en avdrift syns i byggloggen i stället för i en
           mätning någon gör om ett halvår. Läsaren har redan packat upp rutan,
           så måttet är UPPACKAT; över nätet går den gzippad och väger ungefär
           hälften. */
        let tyngst = { bytes: 0, key: '', features: 0, kluster: 0 };
        const kandidater = [
          [14, 9014, 4817], // Norrmalm
          [12, 2253, 1204],
          [10, 563, 301],
        ];
        for (const [z, x, y] of kandidater) {
          const t = await arkiv.getZxy(z, x, y);
          if (!t) continue;
          const lager = decode(t.data);
          if (!lager) throw new Error(`Rutan z${z}/${x}/${y} gick inte att avkoda.`);
          let kluster = 0;
          for (let i = 0; i < lager.length; i += 1) {
            const p = lager.feature(i).properties;
            if (p.cluster) {
              kluster += 1;
              if (typeof p.ez !== 'number' || typeof p.bx !== 'string') {
                throw new Error(
                  `Ett kluster i z${z}/${x}/${y} saknar ez eller bx. delaKluster() i ` +
                    'Karta.astro läser dem i stället för att fråga källan.',
                );
              }
            } else if (typeof p.nm !== 'string') {
              throw new Error(`En nål i z${z}/${x}/${y} saknar namn.`);
            }
          }
          if (t.data.byteLength > tyngst.bytes) {
            tyngst = { bytes: t.data.byteLength, key: `z${z}/${x}/${y}`, features: lager.length, kluster };
          }
        }

        const saknas = await arkiv.getZxy(14, 1, 1);
        if (saknas !== undefined) throw new Error('En ruta mitt i Atlanten gav data. Katalogen pekar fel.');

        logger.info(
          `Rutarkivet ${filer[0]} går att läsa: ${(statSync(path).size / 1048576).toFixed(2)} MB, ` +
            `${h.numAddressedTiles} rutor, z0-${h.maxZoom}. Tyngsta provade rutan ${tyngst.key} ` +
            `är ${(tyngst.bytes / 1024).toFixed(1)} kB uppackad med ${tyngst.features} features.`,
        );
      },
    },
  };
}
