// Giver ekstra matchers som toBeInTheDocument() i alle tests.
import '@testing-library/jest-dom/vitest'
// jsdom har ingen IndexedDB. Denne pakke lægger en falsk en i hukommelsen,
// så baggrundsbilledet kan testes. Den kommer ikke med i den færdige app.
import 'fake-indexeddb/auto'
