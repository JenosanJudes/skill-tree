# Plan: trin 7, eksport og import

Status: godkendt og gennemført 2026-11-05.

**Mål:** Træet kan gemmes som en JSON-fil og indlæses igen. Ved eksport vælger man, om noter og links skal med. Ved import valideres filen, før den erstatter det nuværende træ.

## Del A: Tree store lærer filer (ingen synlig ændring endnu)

1. **`store/fileTransfer.ts`** med rene funktioner:
   - `exportTree(tree, includeNotes)` giver JSON-teksten. Uden noter fjernes `notes` og `links` fra alle noder (som specen siger). Teksten indrykkes med 2 mellemrum, så den er let at læse for mennesker og en LLM.
   - `exportFileName(date)` giver fx `skill-tree-2026-11-04.json`.
   - `parseImport(text)` laver `JSON.parse` og `validateTree` i ét og giver enten træet eller en liste af fejl på dansk (også hvis filen slet ikke er JSON).
2. **`downloadTree(tree, includeNotes)`**: den eneste funktion med en sideeffekt. Den laver en `Blob` (en fil i hukommelsen), en midlertidig adresse til den og et usynligt link med `download`, som "klikkes". Ingen server er involveret.
3. **Ny handling `replaceTree`** i reduceren. Autosave gemmer så det importerede træ helt af sig selv.
4. **Tests** af alle rene funktioner og af `replaceTree` med `makeTestTree()`.

Lagdelingen holdes: specen nævner JSON-filen som en del af lagringen, så komponenterne kalder kun funktioner i `store/`.

## Del B: Værktøjslinje

1. **`Toolbar.tsx`** øverst til venstre ved siden af "Vis alt" med knapperne "Eksportér" og "Importér".
2. **Eksportér** åbner en lille boks: "Skal noter og links med?" med knapperne "Med noter", "Uden noter" og "Annullér".
3. **Importér** åbner browserens filvælger (`<input type="file" accept=".json">`, skjult bag knappen). Filen læses med `file.text()`.
4. **Bekræftelse før import:** en boks med "Erstat det nuværende træ med 'Mine færdigheder' (19 noder)?" og knapperne "Erstat" og "Annullér". Der står også, at man kan eksportere det nuværende træ først.
5. **Fejl:** er filen ugyldig, vises en boks med de første fejl fra valideringen (fx "id 'x' bruges mere end én gang"), og træet ændres ikke.
6. **Efter import** lukkes sidepanelet, fordi den valgte node normalt ikke findes i det nye træ (panelet lukker allerede sig selv, hvis noden mangler). Zoom nulstilles, så hele det nye træ ses.

## Del C: Tests

- Eksport med og uden noter, filnavn og at `downloadTree` laver et link med det rigtige filnavn (med en falsk `URL.createObjectURL`).
- Import af en gyldig fil: bekræftelse, så erstattes træet. Annullér ændrer intet.
- Import af ugyldig JSON og af et træ med fejl viser fejlbeskeder.

## Vigtige valg

- **Hele træet erstattes**, ingen sammenfletning. Det er det, specen beder om, og det er let at forstå.
- **Ingen automatisk backup ved import.** Bekræftelsesboksen foreslår i stedet at eksportere først. Det holder koden enkel; en automatisk backup kan tilføjes senere.
- **Valideringen er den samme som ved indlæsning fra localStorage** (`validateTree`), så der kun findes ét sted, der bestemmer, hvad et gyldigt træ er.

## Ikke med i trin 7

Træk og slip af filer, import fra en adresse og en "fortryd import"-knap.
