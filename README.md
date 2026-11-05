# Skill tree

Et interaktivt skill tree i spilstil, hvor jeg holder styr på mine færdigheder som softwareingeniør: hvad jeg kan, hvor godt, og hvad jeg skal lære næste gang.

**Prøv den:** [jenosanjudes.github.io/skill-tree](https://jenosanjudes.github.io/skill-tree/)

Appen kører helt i browseren. Der er ingen server og intet login, og alt gemmes lokalt på din egen computer.

## Funktioner

- **Træ, der vokser opad** fra én stamme gennem hovedgrene til de enkelte færdigheder. Positionerne regnes ud automatisk.
- **Niveau 0-5** på hver færdighed. Niveau 0 er gråt og stiplet (ikke låst op), og jo højere niveau, jo mere fylder og gløder noden i grenens farve.
- **Zoom og panorering** med musehjul og træk. "Vis alt" viser hele træet igen.
- **Hover-boks** med navn, niveau, beskrivelse og noter.
- **Sidepanel** til redigering: navn, beskrivelse, niveau, farve (hovedgrene), noter og links. Her tilføjes og slettes noder også.
- **Automatisk gemning** i browserens localStorage.
- **Eksport og import** som JSON, med valg om noter og links skal med. Importerede filer valideres, før de erstatter træet.
- **Eget baggrundsbillede**, gemt i browserens IndexedDB. Sort som standard.
- **Kan bruges med tastaturet:** Tab mellem knapper og noder, Enter vælger, Escape lukker.

## Sådan bruges den

| Handling | Sådan |
| --- | --- |
| Se detaljer | Hold musen over en node |
| Redigere | Klik på en node |
| Sætte niveau | Klik på en af de fem cirkler i sidepanelet; klik på den valgte igen for niveau 0 |
| Zoome / flytte | Musehjul / træk i baggrunden |
| Tage backup | Eksportér, og gem filen |

## Kom i gang lokalt

Kræver [Node.js](https://nodejs.org/) 22 eller nyere.

```bash
npm install       # installér pakkerne
npm run dev       # start på http://localhost:5173/skill-tree/
```

| Kommando | Gør |
| --- | --- |
| `npm run dev` | Udviklingsserver, der opdaterer siden, når koden ændres |
| `npm test` | Kør alle tests én gang |
| `npm run test:watch` | Kør tests igen ved hver ændring |
| `npm run lint` | Find mistænkelig kode med oxlint |
| `npm run format` | Formatér koden med Prettier |
| `npm run build` | Typetjek og byg til `dist/` |

## Teknologi

| Del | Valg |
| --- | --- |
| Brugerflade | React 19 og TypeScript (strict) |
| Byggeværktøj | Vite |
| Layout | `d3-hierarchy` |
| Zoom og panorering | `d3-zoom` og `d3-selection` |
| State | `useReducer` og Context, intet ekstra bibliotek |
| Lagring | localStorage (træet) og IndexedDB (baggrundsbillede) |
| Test | Vitest, React Testing Library og jsdom |
| Kodekvalitet | oxlint og Prettier |
| Udgivelse | GitHub Actions til GitHub Pages ved hvert push til `main` |

## Arkitektur

Appen er delt i tre lag, og hvert lag taler kun med laget under sig:

```
Brugerflade (React-komponenter)   src/components/
        ↓
Logik (Tree store og layout)      src/store/, src/layout/
        ↓
Lagring                           localStorage, IndexedDB, JSON-filer
```

Nogle principper, der går igen i koden:

- **d3 regner, React tegner.** d3 beregner positioner og zoom, men det er React, der tegner SVG'en. De to ændrer aldrig de samme elementer.
- **Ren logik for sig.** Reduceren, layoutet og valideringen er rene funktioner uden sideeffekter. Ændringer laver altid et nyt træ i stedet for at ændre det gamle.
- **Data udefra valideres.** Træet tjekkes, når det indlæses fra localStorage eller en fil, og links skal starte med `http://` eller `https://`.
- **Data og UI-tilstand er adskilt.** Træet gemmes. Hvilken node der er valgt, hover og zoom gemmes ikke.

## Dataformat

Træet gemmes og eksporteres som ét JSON-objekt:

```json
{
  "formatVersion": 1,
  "root": {
    "id": "root",
    "name": "Mine færdigheder",
    "children": [
      {
        "id": "kodesprog",
        "name": "Kodesprog",
        "color": "#81c784",
        "children": [
          {
            "id": "ts",
            "name": "TypeScript",
            "level": 3,
            "description": "Typer oven på JavaScript.",
            "notes": "Øv generics.",
            "links": [{ "title": "Handbook", "url": "https://www.typescriptlang.org/docs/" }],
            "children": []
          }
        ]
      }
    ]
  }
}
```

Kun hovedgrene har `color`, og deres undergrene arver den. Kun undergrene har `level` (0-5). Baggrundsbilledet er ikke en del af filen.

## Mappestruktur

```
src/
  components/   React-komponenter (træ, sidepanel, hover-boks, værktøjslinje)
  store/        Tree store: reducer, validering, lagring, eksport/import
  layout/       rene beregninger: positioner, glød, placering af hover-boks
  types/        TypeScript-typer for datamodellen
  data/         startskabelonen
docs/           specifikation og planer for hvert trin
```

Tests ligger ved siden af den fil, de tester, fx `treeReducer.ts` og `treeReducer.test.ts`.

## Videre planer

- **Version 1.5:** hovedgrene, der kan klappes sammen
- **Version 2:** træk og slip af noder, ikoner og flere startskabeloner
- **Senere:** backend i ASP.NET med synkronisering mellem enheder
