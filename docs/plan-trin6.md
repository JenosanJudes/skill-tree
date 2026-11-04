# Plan: trin 6, hover-boks

Status: godkendt og gennemført 2026-11-04.

**Mål:** Når musen holdes over en node, vises en lille boks med navn, beskrivelse, niveau som cirkler og noter. Boksen kan kun læses, ikke redigeres (det sker i sidepanelet).

## Del A: Hvilken node holdes musen over?

1. **`hoveredId` som state i `SkillTreeView`.** Ligesom den valgte node er det UI-tilstand og ikke data. Kun træ-visningen har brug for den, så den ligger der og ikke i `App`.
2. **`TreeNode` får `onMouseEnter` og `onMouseLeave`.** Boksen vises også, når noden får fokus med tastaturet (`onFocus` og `onBlur`), så den virker uden mus.
3. **Lille forsinkelse (ca. 300 ms) før boksen vises.** Ellers blinker bokse frem, når musen bare passerer hen over træet. Boksen skjules med det samme, når musen forlader noden.
4. **Boksen skjules under zoom og panorering**, så den ikke hænger et forkert sted, mens træet flytter sig.

## Del B: `HoverCard.tsx`

1. **Almindelig HTML, ikke SVG.** Boksen ligger oven på SVG'en med `position: absolute` ligesom sidepanelet. Lå den inde i SVG'en, ville teksten blive mindre og større med zoom.
2. **Placering:** ud fra nodens placering på skærmen (`getBoundingClientRect()` på nodens `<g>`). Det virker både for mus og tastatur. Boksen står over noden og flyttes ind, hvis den ellers ville gå ud over kanten.
3. **Indhold:** navn, beskrivelse, niveau og noter. Tomme felter vises ikke. Niveau vises kun på undergrene. Noter beholder deres linjeskift.
4. **`pointer-events: none`**, så boksen aldrig kommer i vejen for klik og træk.
5. **Ingen boks på den valgte node**, fordi sidepanelet allerede viser det hele.

## Del C: Cirkler, der kun kan læses

1. **`LevelDots.tsx`:** fem små cirkler, fyldt i grenens farve op til niveauet, med en tekst til skærmlæsere (fx "Niveau 3 af 5").
2. Den er adskilt fra `LevelPicker`, som består af knapper. Boksen må ikke indeholde noget, man kan klikke på.

## Tests

- Boksen vises efter forsinkelsen ved hover og ved fokus, og skjules ved leave og blur (falske timere).
- Indholdet: navn, beskrivelse, noter og niveau. Tomme felter mangler, og hovedgrene og stammen har ingen cirkler.
- Ingen boks på den valgte node.
- `LevelDots` viser det rigtige antal fyldte cirkler.

## Ikke med i trin 6

Links i boksen (står ikke i specen; de kan ikke klikkes i en boks, der forsvinder, når musen flytter sig), touch og mobil (version 1 er til computer) og glød (trin 8).
