# CLAUDE.md

## Formål

Personlig webapp, der viser mine færdigheder som et interaktivt skill tree i spilstil. Version 1 er kun frontend, uden server og login. Detaljer, krav og faseplan står i `docs/spec.md`. Læs kun de afsnit, opgaven kræver.

## Stack

- React 19 + TypeScript (strict), bygget med Vite
- Test: Vitest + React Testing Library (jsdom)
- Linting: oxlint. Formatering: Prettier (ingen semikolon, enkelte anførselstegn)
- Senere: `d3-hierarchy` (layout) og `d3-zoom` (zoom og panorering)
- Lagring: localStorage (træet), IndexedDB (baggrundsbillede, trin 8)
- Deploy: GitHub Pages via `.github/workflows/deploy.yml` ved push til `main`. `base` i `vite.config.ts` er `/skill-tree/`.

## Mappestruktur

```
src/
  types/       skillTree.ts         typerne fra datamodellen
  data/        defaultTree.json     startskabelon
  store/       treeReducer.ts       rene handlinger på træet
               treeUtils.ts         hjælpefunktioner (find, opdater)
               validateTree.ts      validering, bruges ved indlæsning og import
               storage.ts           gem/indlæs i localStorage
               TreeContext.tsx      useReducer + Context (fra trin 3)
  components/  React-komponenter (fra trin 3)
docs/spec.md   specifikation og faseplan
```

## Konventioner

- Lagdeling: komponenter kalder kun Tree store, og kun Tree store taler med lagringen.
- d3 beregner positioner, React tegner SVG'en. d3 må aldrig ændre DOM'en direkte.
- Reducer og hjælpefunktioner er rene: ingen sideeffekter, data ændres aldrig på stedet, der returneres altid et nyt objekt.
- Regler fra specen: stamme og hovedgrene har intet `level`; kun hovedgrene har `color`, og undergrene arver den; stammen kan ikke slettes.
- Kode og identifiers på engelsk. Kommentarer, testnavne, UI-tekster og commit-beskeder på dansk.
- Tests ligger ved siden af filen: `treeReducer.ts` → `treeReducer.test.ts`. Importer `describe`, `it` og `expect` fra `vitest`.

## Arbejdsgang

- Plan før kode. Brugeren godkender planen, før der skrives kode.
- Kør aldrig git-kommandoer, der ændrer repoet (add, commit, push, checkout). Brugeren gør det selv og får et forslag til commit-besked efter hvert trin.
- Forklar vigtige valg kort og pædagogisk; brugeren er studerende.
- Opdater denne fil, når der træffes nye beslutninger.

## Kommandoer

```
npm run dev           udviklingsserver (http://localhost:5173/skill-tree/)
npm run build         typetjek og byg til dist/
npm run preview       vis den byggede app lokalt
npm test              kør alle tests én gang
npm run test:watch    kør tests igen ved hver ændring
npm run lint          oxlint
npm run format        formater med Prettier
npm run format:check  tjek formatering uden at ændre
```
