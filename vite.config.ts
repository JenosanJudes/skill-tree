import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages lægger appen under /skill-tree/, ikke i roden af domænet.
  base: '/skill-tree/',
  plugins: [react()],
  test: {
    // jsdom simulerer en browser, så fx localStorage findes i tests.
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
  },
})
