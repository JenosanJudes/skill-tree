# Plan: trin 5, sidepanel og redigering

Status: godkendt 2026-11-04, med farvevælger i del C.

**Mål:** Brugeren klikker på en node og redigerer den i et sidepanel. Alt, hvad der ændres, gemmes automatisk i browseren.

Trinnet deles i tre dele, som hver kan prøves i browseren for sig.

## Del A: Tree store lærer at redigere og gemme

Ingen synlig ændring endnu, men alt er testet.

1. **Nye handlinger i `treeReducer.ts`:** `setDescription`, `setNotes`, `addLink`, `removeLink` og `setColor`. Navn, niveau, tilføj og slet findes allerede. Tomme tekster fjerner feltet helt, så JSON'en holder sig ren.
2. **Linkvalidering:** kun adresser, der starter med `http://` eller `https://`, accepteres. Ellers kunne man gemme `javascript:`-adresser, som kan køre kode, når man klikker.
3. **Autosave i `TreeProvider`:** når træet ændres, kaldes `saveTree` efter 300 ms uden nye ændringer (debounce), så der ikke skrives til localStorage ved hvert tastetryk.
4. **Tests** med `makeTestTree()` og falske timere til autosave.

## Del B: Vælg en node og redigér grundting

1. **Valg af node:** klik markerer noden med en ring og åbner panelet. Noderne kan også nås med tastaturet (`Tab`, `Enter`).
2. **`SidePanel.tsx`:** panel i højre side med navn, beskrivelse, niveau og noter.
3. **Niveau:** fem cirkler. Klik på cirkel _n_ sætter niveau _n_; klik på den allerede valgte cirkel sætter niveau 0. Kun undergrene har niveau.
4. **Tests** af panelet.

## Del C: Links, tilføj, slet og farve

1. **Links:** liste med "slet" ved hvert link og en formular med titel og adresse. Links åbner i ny fane med `rel="noopener noreferrer"`.
2. **Tilføj:** "Tilføj undernode" (på stammen: "Tilføj hovedgren"). Den nye node vælges, så den kan omdøbes med det samme.
3. **Slet:** to-trins knap ("Slet" og så "Er du sikker?"). Findes ikke på stammen.
4. **Farve** på hovedgrene med en farvevælger (kan udskydes til trin 8, hvis brugeren ønsker det).
5. **Tests.**

## Vigtige valg

- **Valgt node er UI-tilstand, ikke data.** Den ligger som `useState` i `App` og sendes ned som props. Slettes den valgte node, finder panelet den ikke og lukker sig selv.
- **Tekstfelter gemmer ved blur eller Enter**, ikke ved hvert tastetryk. For navnet undgår det, at feltet hopper tilbage, fordi reduceren afviser tomme navne.
- **Panelet ligger oven på SVG'en** og skubber den ikke, så layout og zoom er uændrede.
- **Klik og træk forstyrrer ikke hinanden**, fordi `d3-zoom` selv undertrykker klik efter et træk.

## Ikke med i trin 5

Hover-boks (trin 6), eksport og import (trin 7), glød og baggrundsbillede (trin 8) og en besked, hvis localStorage er fuldt (gemning fejler stille og logger i konsollen).
