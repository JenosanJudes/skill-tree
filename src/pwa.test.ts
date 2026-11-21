// @vitest-environment node
// Denne test læser filer fra disken, så den har brug for Nodes typer.
/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Manifestet og ikonerne ligger i public/ og bliver ikke tjekket af
// TypeScript. Disse tests fanger en slåfejl eller et ikon, der mangler.
const manifest = JSON.parse(
  readFileSync('public/manifest.webmanifest', 'utf8'),
) as {
  display: string
  start_url: string
  icons: { src: string; sizes: string; purpose?: string }[]
}

describe('manifestet', () => {
  it('åbner appen i fuld skærm fra sin egen mappe', () => {
    expect(manifest.display).toBe('standalone')
    // En relativ adresse virker både lokalt og under /skill-tree/.
    expect(manifest.start_url).toBe('.')
  })

  it('har ikoner i 192 og 512 pixels og et, der kan beskæres', () => {
    const sizes = manifest.icons.map((icon) => icon.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(
      true,
    )
  })

  it('peger kun på ikoner, der findes', () => {
    for (const icon of manifest.icons) {
      expect(existsSync(`public/${icon.src}`)).toBe(true)
    }
    expect(existsSync('public/apple-touch-icon.png')).toBe(true)
    expect(existsSync('public/sw.js')).toBe(true)
  })
})
