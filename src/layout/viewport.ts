import type { Bounds } from './computeLayout'

/** Kameraets stilling: forskydning (x, y) og zoom (k), som d3-zoom bruger. */
export type Camera = { x: number; y: number; k: number }

export type Viewport = {
  /** Skærm-pixels pr. SVG-enhed, når hele træet vises (zoom 1). */
  fitScale: number
  /** Den del af tegningen, der kan ses på skærmen ved zoom 1. */
  visible: Bounds
}

type Size = { width: number; height: number }

/**
 * Regner ud, hvor meget af tegningen skærmen viser. viewBox bliver passet
 * ind i SVG-elementet og centreret, så på en høj telefon er der ekstra plads
 * over og under træet. Kendes størrelsen ikke (fx i tests), regner vi med,
 * at skærmen viser præcis viewBox.
 */
export function viewportFor(bounds: Bounds, size: Size | null): Viewport {
  if (!size || size.width <= 0 || size.height <= 0) {
    return { fitScale: 1, visible: bounds }
  }
  const fitScale = Math.min(
    size.width / bounds.width,
    size.height / bounds.height,
  )
  const width = size.width / fitScale
  const height = size.height / fitScale
  return {
    fitScale,
    visible: {
      x: bounds.x + (bounds.width - width) / 2,
      y: bounds.y + (bounds.height - height) / 2,
      width,
      height,
    },
  }
}

/** Skærm-pixels, som et panel dækker i højre side og i bunden. */
export type Covered = { right: number; bottom: number }

/** Mindre fri plads end dette (i pixels) regnes som "helt dækket". */
const MIN_FREE_PIXELS = 240

/**
 * Viewporten uden den del, et panel dækker: sidepanelet til højre på en bred
 * skærm, bundarket forneden på en telefon. Er der næsten ingen plads tilbage
 * i en retning (panelet fylder hele skærmen), ses der bort fra den retning.
 */
export function withoutCovered(viewport: Viewport, covered: Covered): Viewport {
  const { fitScale, visible } = viewport
  const freeWidth = visible.width * fitScale - covered.right
  const freeHeight = visible.height * fitScale - covered.bottom
  const cutRight = covered.right > 0 && freeWidth >= MIN_FREE_PIXELS
  const cutBottom = covered.bottom > 0 && freeHeight >= MIN_FREE_PIXELS
  if (!cutRight && !cutBottom) return viewport
  return {
    fitScale,
    visible: {
      ...visible,
      width: cutRight ? freeWidth / fitScale : visible.width,
      height: cutBottom ? freeHeight / fitScale : visible.height,
    },
  }
}

/**
 * Den kamerastilling, hvor `target` fylder mest muligt af skærmen og står
 * i midten. Zoomet holdes mellem `minScale` og `maxScale`.
 */
export function cameraToFit(
  target: Bounds,
  viewport: Viewport,
  minScale: number,
  maxScale: number,
): Camera {
  const { visible } = viewport
  const k = clamp(
    Math.min(visible.width / target.width, visible.height / target.height),
    minScale,
    maxScale,
  )
  // Et punkt p tegnes i p · k + (x, y). Vi vælger (x, y), så målets midte
  // havner i skærmens midte.
  return {
    x: visible.x + visible.width / 2 - k * (target.x + target.width / 2),
    y: visible.y + visible.height / 2 - k * (target.y + target.height / 2),
    k,
  }
}

/**
 * Kameraet et stykke af vejen fra `from` til `to`; t går fra 0 til 1.
 * Vi flytter det punkt, kameraet ser på, i en lige linje og ganger zoomet
 * jævnt op, så bevægelsen føles som en flyvning og ikke et ryk.
 */
export function cameraBetween(
  from: Camera,
  to: Camera,
  t: number,
  center: { x: number; y: number },
): Camera {
  const k = from.k * Math.pow(to.k / from.k, t)
  // Det punkt i tegningen, der står i skærmens midte.
  const lookAt = (camera: Camera) => ({
    x: (center.x - camera.x) / camera.k,
    y: (center.y - camera.y) / camera.k,
  })
  const a = lookAt(from)
  const b = lookAt(to)
  const focusX = a.x + (b.x - a.x) * t
  const focusY = a.y + (b.y - a.y) * t
  return { x: center.x - k * focusX, y: center.y - k * focusY, k }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
