# Skill tree

Et interaktivt skill tree i spilstil, hvor jeg holder styr på mine færdigheder som softwareingeniør: hvad jeg kan, hvor godt, og hvad jeg skal lære næste gang.

**Prøv den:** [jenosanjudes.github.io/skill-tree](https://jenosanjudes.github.io/skill-tree/)

Appen kører helt i browseren. Der er ingen server og intet login, og alt gemmes lokalt på din egen enhed. Den er bygget til telefonen først og kan installeres på hjemmeskærmen som en app.

## Funktioner

- **Stjernekort:** stammen står i midten, hovedgrenene stråler ud, og hver dybde ligger på sin egen ring. Positionerne regnes ud automatisk, og cirklen vokser, når der kommer flere færdigheder.
- **Niveau 0-5** på hver færdighed, vist som en ring i fem stykker om noden. Niveau 0 er gråt og stiplet (ikke låst op), og jo højere niveau, jo mere gløder og pulserer noden i grenens farve.
- **Levende:** stjernehimmel, der forskyder sig, når man flytter rundt, og lys, der løber langs forbindelserne. Et glimt, når et niveau stiger. Det hele står stille, hvis systemet er sat til mindre bevægelse.
- **Kraft-måler** med samlet kraft, en titel fra Novice til Mester og en bjælke pr. hovedgren.
- **Kamera:** tryk på en hovedgren for at flyve ind på den. Zoom og panorering med knib, musehjul og træk. "Vis alt" flyver ud igen.
- **Bundark på telefon:** et tryk viser navn, beskrivelse, noter og niveauvælger; "Redigér" folder hele formularen ud. På computer er det et sidepanel, og en hover-boks viser detaljer.
- **Redigering:** navn, beskrivelse, niveau, farve (hovedgrene), noter og links. Her tilføjes og slettes noder også.
- **Automatisk gemning** i browserens localStorage.
- **Eksport og import** som JSON, med valg om noter og links skal med. Importerede filer valideres, før de erstatter træet.
- **Del som billede:** laver et billede af træet i højformat og åbner telefonens del-menu (eller gemmer filen på computer).
- **Installerbar og offline:** kan lægges på hjemmeskærmen og åbner uden net efter første besøg.
- **Eget baggrundsbillede**, gemt i browserens IndexedDB. Stjernehimmel som standard.
- **Kan bruges med tastaturet:** Tab mellem knapper og noder, Enter vælger, Escape lukker.

## Sådan bruges den

| Handling | Telefon | Computer |
| --- | --- | --- |
| Se detaljer | Tryk på en node | Hold musen over en node |
| Sætte niveau | Tryk på en af de fem cirkler i bundarket | Klik på en af de fem cirkler i sidepanelet |
| Redigere | Tryk på noden og derefter "Redigér" | Klik på en node |
| Flyve ind på en gren | Tryk på hovedgrenen | Klik på hovedgrenen |
| Zoome / flytte | Knib / træk | Musehjul / træk i baggrunden |
| Dele | "Del" åbner del-menuen | "Del" gemmer et billede |
| Tage backup | Eksportér, og gem filen | Eksportér, og gem filen |

Et tryk på den valgte cirkel igen sætter niveauet til 0.

### Installér på telefonen

- **iPhone (Safari):** Del-knappen → "Føj til hjemmeskærm".
- **Android (Chrome):** menuen → "Installér app" eller "Føj til startskærm".

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
| `npm run preview` | Vis den byggede app lokalt (her virker offline-delen) |

## Teknologi

| Del | Valg |
| --- | --- |
| Brugerflade | React 19 og TypeScript (strict) |
| Byggeværktøj | Vite |
| Layout | `d3-hierarchy` |
| Zoom og panorering | `d3-zoom` og `d3-selection` |
| Animationer | CSS (puls, lys, stjerner) og `requestAnimationFrame` (kamera) |
| App på telefonen | Web app manifest og en håndskrevet service worker |
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
- **Udseende, der følger zoom, ligger i CSS.** React sætter én CSS-variabel med den aktuelle skala, og stylesheetet holder navne og trykflader store nok. Så tegnes træet ikke om, hver gang der zoomes.
- **Afledte tal gemmes ikke.** Kraft og titel regnes ud fra niveauerne hver gang, så de ikke kan blive forkerte, og filformatet er uændret.

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
  store/        Tree store: reducer, validering, lagring, eksport/import, kraft
  layout/       rene beregninger: positioner, kamera, glød, niveauring, delebillede
  types/        TypeScript-typer for datamodellen
  data/         startskabelonen
public/         ikoner, manifest og service worker (sw.js)
```

Tests ligger ved siden af den fil, de tester, fx `treeReducer.ts` og `treeReducer.test.ts`.

## Videre planer

- **Version 1.5:** hovedgrene, der kan klappes sammen
- **Version 2:** træk og slip af noder, ikoner og flere startskabeloner
- **Senere:** backend i ASP.NET med synkronisering mellem enheder
