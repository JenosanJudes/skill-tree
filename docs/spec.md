# Skill tree app: spec v1

2. november 2026

## Formål og vision

En personlig webapp, der viser mine færdigheder som et interaktivt skill tree i spilstil. Jeg kan se, hvor jeg er på min rejse som softwareingeniør, vurdere hver færdighed og gemme noter om, hvad jeg skal lære næste gang.

- **Bruger i version 1:** kun mig selv, på computer.
- **Formål:** holde overblik over mange fag, sprog og værktøjer på én gang, se mine huller og vælge, hvad jeg skal lære næste gang.
- **I jobsøgning:** et screenshot af hele træet kan sendes til en arbejdsgiver som overblik over mine færdigheder.
- **Langsigtet vision:** appen bliver universel, så alle kan lave et skill tree for deres fag (kok, musiker osv.).

## Afgrænsning

Version 1 er en brugbar app til mig selv. Alt andet venter, til den bliver brugt.

| Version | Indhold |
| --- | --- |
| 1 (MVP) | Træ med én stamme, automatisk layout, zoom og panorering, "vis alt"-knap, niveau 0-5, noter og links, hover og sidepanel, tilføj/omdøb/slet, lokal lagring, JSON-eksport/import, simpel startskabelon, glød og egen baggrund |
| 1.5 | Sammenklappelige hovedgrene |
| 2 | Drag-and-drop, ikoner pr. node, flere startskabeloner (fx studerende) |
| Senere | Mobil, backend med ASP.NET og synkronisering mellem enheder, afhængigheder mellem skills, flere rødder, universelle skabeloner til andre fag |

**Ikke med i version 1:** login, flere brugere, server, tidshistorik, niveau på hovedgrene, ikoner og drag-and-drop.

## Funktionelle krav

Version 1 er færdig, når alle punkter herunder virker.

**Træet**

- [x] Vise træet med én stamme, hovedgrene og undergrene i flere niveauer
- [x] Beregne positioner automatisk, så noder og navne aldrig overlapper
- [x] Zoome med scroll og flytte rundt ved at trække
- [x] "Vis alt"-knap, der tilpasser hele træet til skærmen

**Noder**

- [x] Hover viser navn, beskrivelse, niveau og noter (kun læsning)
- [x] Klik åbner et sidepanel til redigering
- [x] Sætte niveau 0-5 ved at klikke på cirkler (undergrene, ikke hovedgrene)
- [x] Skrive noter og tilføje links
- [x] Tilføje en ny undernode, omdøbe og slette en node

**Data**

- [x] Gemme alt lokalt i browseren automatisk
- [x] Eksportere træet som JSON, med spørgsmål om noter skal med
- [x] Importere en JSON-fil og erstatte det nuværende træ
- [x] Starte fra en simpel skabelon første gang

**Udseende**

- [x] Uploade et eget baggrundsbillede, sort som standard
- [x] Noder gløder stærkere, jo højere niveau

## Design og brugeroplevelse

Træet vokser opad fra én stamme på mørk baggrund, og noderne lyser op efter niveau, inspireret af skill trees i spil.

- **Retning:** fra stammen i bunden og opad. Forbindelser går lodret og vandret i knæk.
- **Farver:** hver hovedgren har sin egen farve, som alle dens undergrene arver.
- **Niveau:** 0 = gråt og stiplet (ikke låst op). 1-5 = stigende fyld og glød i grenens farve.
- **Hovedgrene:** rene overskrifter med farve, intet niveau.
- **Navne:** altid synlige under noden, må gå på to linjer.
- **Hover:** lille boks med navn, beskrivelse, cirkler og noter. Kun læsning.
- **Klik:** sidepanel med redigering af navn, beskrivelse, niveau, noter og links samt knapper til tilføj og slet.
- **Zoom:** scroll for at zoome, træk for at flytte, "vis alt" til overblik og screenshot.
- **Baggrund:** sort som standard, eget billede kan uploades.
- **Arbejdsgiver-visning:** hele træet via "vis alt" og et screenshot. Ingen særskilt visning i version 1.

## Datamodel og JSON-format

Træet gemmes som ét indlejret JSON-objekt, så det både kan læses af `d3-hierarchy` direkte og forstås af en LLM, der skal omstrukturere det.

```typescript
type SkillTree = {
  formatVersion: 1;        // gør det muligt at ændre formatet senere
  root: SkillNode;
};

type SkillNode = {
  id: string;              // unikt, fx genereret med crypto.randomUUID()
  name: string;
  description?: string;
  level?: 0 | 1 | 2 | 3 | 4 | 5;  // udelades på stamme og hovedgrene
  color?: string;          // kun på hovedgrene, arves af undergrene
  notes?: string;
  links?: { title: string; url: string }[];
  children: SkillNode[];
};
```

- **Eksport:** hele `SkillTree`. Hvis noter fravælges, fjernes `notes` og `links` fra alle noder.
- **Import:** filen valideres (format, unikke id'er, niveau 0-5), før den erstatter det nuværende træ.
- **Baggrundsbillede:** gemmes separat i IndexedDB og er ikke med i JSON-filen.
- **Startskabelon:** en JSON-fil i samme format, der indlæses første gang appen åbnes.

## Teknisk arkitektur og stack

Version 1 er en ren frontend-app i React og TypeScript uden backend. Al logik og data ligger i browseren.

Tre lag, alt i browseren:

- **Brugerflade (React-komponenter):** Træ-visning (SVG, noder, glød), sidepanel, hover-boks, værktøjslinje (eksport og import).
- **Logik (TypeScript):** Tree store (state og handlinger: tilføj, omdøb, slet, niveau) samt layout og zoom (`d3-hierarchy`, `d3-zoom`).
- **Lagring:** localStorage (træet), IndexedDB (baggrundsbillede) og JSON-fil (eksport og import).

Komponenterne kalder kun Tree store, og kun Tree store taler med lagringen. d3 beregner positioner, mens React tegner SVG'en, så de to aldrig styrer siden samtidig.

| Del | Valg | Hvorfor |
| --- | --- | --- |
| Framework | React + TypeScript | Efterspurgt i jobopslag, typer føles som Java/C# |
| Byggeværktøj | Vite | Hurtig opstart, standardvalg til React |
| Layout og zoom | `d3-hierarchy`, `d3-zoom` | Færdigt træ-layout og zoom, Claude kender dem godt |
| State | `useReducer` + Context | Ingen ekstra bibliotek, let at teste |
| Lagring | localStorage og IndexedDB | Lokalt, ingen server |
| Test | Vitest + React Testing Library | Passer til Vite |
| Hosting | GitHub Pages eller Vercel | Gratis til statiske apps |

Lagdelingen (brugerflade, logik, lagring) svarer til de arkitektoniske mønstre fra SDT1 og gør det let at skifte lagringen ud med en backend senere.

## Faseplan og første opgaver

Byg i tynde lodrette udsnit: hvert trin giver en app, der virker, og kan tjekkes af, før det næste begynder.

1. **Setup:** Vite + React + TypeScript, Git-repo, linting, CLAUDE.md, deploy af tom app (fx GitHub Pages eller Vercel).
2. **Data:** typerne fra datamodellen, startskabelonen som JSON og en store med gem/indlæs i localStorage. Tests af tilføj, omdøb og slet.
3. **Statisk træ:** layout med `d3-hierarchy`, noder, navne og forbindelser tegnet i SVG ud fra skabelonen.
4. **Zoom:** `d3-zoom` til zoom og panorering samt "vis alt"-knap.
5. **Sidepanel:** klik på node, rediger niveau, noter og links, tilføj og slet.
6. **Hover-boks:** visning af info og cirkler ved hover.
7. **Eksport og import:** JSON med valg om noter, validering ved import.
8. **Udseende:** glød efter niveau, farver pr. hovedgren, upload af baggrund i IndexedDB.
9. **Afslutning:** test af hele flowet, opryd i koden, README og et screenshot til CV'et.

**Første opgave i næste chat:** trin 1 og 2, startende med CLAUDE.md.

## Arbejdsgang med Claude og token-strategi

Hver ny samtale starter fra dette dokument og ikke fra idéchatten, så Claude kun læser det, der er brug for.

**Faste regler**

- **Ny chat pr. fase eller feature.** Hele samtalen sendes med ved hvert svar, så lange chats bliver dyre.
- **CLAUDE.md i repoet** med stack, mappestruktur, konventioner og kommandoer. Opdateres, når der træffes nye beslutninger.
- **Plan før kode.** Bed om en plan, læs den, og godkend den, før der skrives kode.
- **Små, præcise opgaver.** Én klar besked er billigere end tre rettelser.
- **Bed om ændringer, ikke hele filer.** Output koster mere end input.
- **Henvis til filer frem for at indsætte dem**, når Claude Code kan læse dem selv.
- **Kendte biblioteker frem for egen kode** (`d3`, React). Claude rammer oftere rigtigt første gang.
- **Prototype det usikre, byg det sikre.** En hurtig skitse er billigere end at bygge forkert.

**Læring**

- Læs altid diffen selv, og bed Claude forklare det, du ikke forstår, som til en mundtlig eksamen.
- Lad en frisk session reviewe koden kritisk før en større ændring merges.
- Noter efter hvert trin ét token-tip, der virkede, så du bygger din egen tjekliste.

## Åbne spørgsmål og fremtidige idéer

**Åbne spørgsmål**

- [x] Hvad skal startskabelonen indeholde? Forslag: stamme + 4 hovedgrene (AI, Softwareingeniør, Kodesprog, Programmer) med 2-3 noder hver.
- [x] Hvor skal appen hostes: GitHub Pages, Vercel eller kun lokalt? Besluttet: GitHub Pages.
- [ ] Hvad gør appen let at opdatere efter en forelæsning, så den bliver brugt?

**Idéer til senere**

- Skill eller fast prompt, der lader en LLM omstrukturere træet ud fra en JSON-eksport.
- Flere startskabeloner (studerende, jobsøgende) og senere andre fag.
- Afhængigheder mellem skills og flere rødder.
- Backend i ASP.NET Core med database, så træet kan bruges på flere enheder.
