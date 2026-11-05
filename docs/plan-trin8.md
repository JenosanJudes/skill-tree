# Plan: trin 8, udseende

Status: godkendt og gennemført 2026-11-05.

**Mål:** Noderne gløder stærkere, jo højere niveauet er, og man kan uploade sit eget baggrundsbillede. Baggrunden er sort som standard. Farver pr. hovedgren blev lavet i trin 5 (farvevælgeren), så den del er allerede gjort.

## Del A: Glød efter niveau

1. **Ét SVG-filter** (`<filter>` med `feGaussianBlur`) i `<defs>`. Det slører en kopi af cirklen, så den lyser i sin egen farve. Derfor er ét filter nok til alle grenfarver.
2. **En glorie bag cirklen:** en ekstra cirkel med filteret, hvis størrelse og gennemsigtighed vokser med niveauet. Niveau 0 har ingen glød; niveau 5 lyser kraftigst.
3. **Stamme og hovedgrene** får en svag, fast glød, så de stadig ligner noder, der hører til, selv om de ikke har niveau.
4. **Beregningen er en ren funktion** (`glowFor(kind, level)` i `layout/`), som giver radius og gennemsigtighed. Den er let at teste og at justere.
5. **Ydelse:** filtre koster lidt under zoom. `TreeDrawing` er allerede `memo`, så glorierne tegnes ikke igen ved zoom, kun transformen flyttes. Tjekkes i browseren.

## Del B: Eget baggrundsbillede i IndexedDB

1. **Hvorfor IndexedDB og ikke localStorage?** localStorage kan kun gemme tekst og har plads til ca. 5 MB. IndexedDB er browserens database og kan gemme binære data uden at lave dem om til tekst. (Ændret under arbejdet: billedet gemmes som bytes (`ArrayBuffer`) plus filtype i stedet for som en Blob, fordi bytes kan gemmes overalt, også i testenes falske IndexedDB.)
2. **`store/backgroundStorage.ts`:** `saveBackground(file)`, `loadBackground()` og `clearBackground()`. Skrevet direkte mod IndexedDB uden bibliotek, med en lille hjælpefunktion, der laver IndexedDB's hændelser om til Promises (`async`/`await`).
3. **`store/useBackground.ts`:** en hook, der indlæser billedet ved start og giver en midlertidig adresse (`URL.createObjectURL`) til det. Adressen frigives igen, når billedet skiftes eller fjernes.
4. **Kun billeder:** PNG, JPEG, WebP eller GIF, højst 10 MB. Andet afvises med en besked.
5. **Visning:** billedet ligger fast bag træet (det flytter sig ikke ved zoom) med et mørkt slør oven på, så noder og navne stadig kan læses. Prikmønstret skjules, når der er et billede.
6. **Værktøjslinjen** får knappen "Baggrund" med en lille boks: "Vælg billede" og "Fjern billede".

## Tests

- `glowFor`: ingen glød på niveau 0, stigende fra 1 til 5, fast glød på stamme og hovedgrene.
- `TreeNode` tegner en glorie kun, når der skal være glød.
- `backgroundStorage`: gem, indlæs og fjern. jsdom har ikke IndexedDB, så testene bruger **`fake-indexeddb`**, en lille udviklingspakke, der efterligner IndexedDB i hukommelsen (installeres med `npm install -D fake-indexeddb`).
- Værktøjslinjen: forkert filtype afvises, "Fjern billede" fjerner baggrunden.

## Vigtige valg

- **Baggrunden er ikke en del af træets JSON** (som specen siger) og kommer derfor ikke med ved eksport.
- **Ingen animation** af gløden, kun en fast styrke. Det holder ydelsen god og passer til folk, der har slået bevægelse fra (`prefers-reduced-motion`).
- **Lagdelingen holdes:** komponenterne kalder kun `useBackground` i `store/`, og kun `store/` taler med IndexedDB.

## Ikke med i trin 8

Beskæring eller placering af billedet, valg af slørets styrke og temaer eller lyst udseende.
