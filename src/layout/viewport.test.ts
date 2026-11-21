import { describe, expect, it } from 'vitest'
import {
  cameraBetween,
  cameraToFit,
  viewportFor,
  withoutCovered,
} from './viewport'

const bounds = { x: -100, y: -100, width: 200, height: 200 }

describe('viewportFor', () => {
  it('regner med, at skærmen viser viewBox, når størrelsen er ukendt', () => {
    expect(viewportFor(bounds, null)).toEqual({ fitScale: 1, visible: bounds })
    expect(viewportFor(bounds, { width: 0, height: 0 }).fitScale).toBe(1)
  })

  it('giver ekstra plads over og under på en høj skærm', () => {
    // 400 × 800 pixels: bredden bestemmer, så 2 pixels pr. enhed.
    const viewport = viewportFor(bounds, { width: 400, height: 800 })
    expect(viewport.fitScale).toBe(2)
    expect(viewport.visible).toEqual({
      x: -100,
      y: -200,
      width: 200,
      height: 400,
    })
  })

  it('giver ekstra plads i siderne på en bred skærm', () => {
    const viewport = viewportFor(bounds, { width: 300, height: 100 })
    expect(viewport.fitScale).toBe(0.5)
    expect(viewport.visible.width).toBe(600)
    expect(viewport.visible.x).toBe(-300)
  })
})

describe('withoutCovered', () => {
  // 1000 × 1000 pixels og 5 pixels pr. enhed.
  const viewport = viewportFor(bounds, { width: 1000, height: 1000 })

  it('fjerner den del af skærmen, et panel dækker i højre side', () => {
    const free = withoutCovered(viewport, { right: 400, bottom: 0 })
    expect(free.visible.x).toBe(viewport.visible.x)
    // 600 frie pixels er 120 enheder.
    expect(free.visible.width).toBe(120)
    expect(free.visible.height).toBe(viewport.visible.height)
  })

  it('fjerner den del af skærmen, et ark dækker i bunden', () => {
    const free = withoutCovered(viewport, { right: 0, bottom: 500 })
    expect(free.visible.y).toBe(viewport.visible.y)
    expect(free.visible.height).toBe(100)
    expect(free.visible.width).toBe(viewport.visible.width)
  })

  it('lader viewporten være, når panelet fylder næsten hele skærmen', () => {
    expect(withoutCovered(viewport, { right: 900, bottom: 0 })).toBe(viewport)
  })

  it('lader viewporten være, når intet er dækket', () => {
    expect(withoutCovered(viewport, { right: 0, bottom: 0 })).toBe(viewport)
  })
})

describe('cameraToFit', () => {
  const viewport = viewportFor(bounds, null)

  it('zoomer ind, så målet fylder skærmen, og stiller det i midten', () => {
    const camera = cameraToFit(
      { x: 50, y: 50, width: 50, height: 50 },
      viewport,
      0.5,
      8,
    )
    expect(camera.k).toBe(4)
    // Målets midte (75, 75) skal havne i skærmens midte (0, 0).
    expect(75 * camera.k + camera.x).toBe(0)
    expect(75 * camera.k + camera.y).toBe(0)
  })

  it('bruger den side, der er mindst plads på', () => {
    const camera = cameraToFit(
      { x: 0, y: 0, width: 100, height: 50 },
      viewport,
      0.5,
      8,
    )
    expect(camera.k).toBe(2)
  })

  it('holder zoomet inden for grænserne', () => {
    const tiny = { x: 0, y: 0, width: 1, height: 1 }
    expect(cameraToFit(tiny, viewport, 0.5, 3).k).toBe(3)
  })

  it('giver udgangsstillingen, når målet er hele træet', () => {
    expect(cameraToFit(bounds, viewport, 0.5, 8)).toEqual({ x: 0, y: 0, k: 1 })
  })
})

describe('cameraBetween', () => {
  const center = { x: 0, y: 0 }
  const from = { x: 0, y: 0, k: 1 }
  const to = { x: -300, y: -300, k: 4 }

  it('begynder i den ene stilling og ender i den anden', () => {
    const start = cameraBetween(from, to, 0, center)
    const end = cameraBetween(from, to, 1, center)
    expect(start.k).toBeCloseTo(1)
    expect(start.x).toBeCloseTo(0)
    expect(end.k).toBeCloseTo(4)
    expect(end.x).toBeCloseTo(-300)
    expect(end.y).toBeCloseTo(-300)
  })

  it('ganger zoomet jævnt op undervejs', () => {
    // Halvvejs mellem zoom 1 og 4 er 2, ikke 2,5.
    expect(cameraBetween(from, to, 0.5, center).k).toBeCloseTo(2)
  })
})
