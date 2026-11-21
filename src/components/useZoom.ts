import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { select } from 'd3-selection'
import { zoom, zoomIdentity, zoomTransform } from 'd3-zoom'
import type { D3ZoomEvent, ZoomBehavior, ZoomTransform } from 'd3-zoom'
import type { Bounds } from '../layout/computeLayout'
import { cameraBetween } from '../layout/viewport'
import type { Camera } from '../layout/viewport'

export const MIN_SCALE = 0.5
export const MAX_SCALE = 8

/** Hvor længe en flyvning varer. */
const FLY_MS = 650

const HOME: Camera = { x: 0, y: 0, k: 1 }

/** Langsom start og langsom slutning (kubisk ease-in-out). */
function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Skal kameraet flyve eller hoppe? Det hopper, hvis brugeren har bedt
 * systemet om mindre bevægelse, og i tests, hvor matchMedia ikke findes.
 */
function shouldAnimate(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Kobler d3-zoom på en SVG. d3 lytter kun efter hjul, træk og knib og regner
 * en transform ud (x, y og k). Transformen lægges i React-state, og React
 * sætter den på en <g>, så d3 aldrig ændrer selve tegningen.
 */
export function useZoom(
  svgRef: RefObject<SVGSVGElement | null>,
  bounds: Bounds,
  /** Kaldes, når en zoom eller et træk begynder. Skal være stabil (useCallback). */
  onZoomStart?: () => void,
) {
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity)
  const behaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  // Id på det næste billede i en igangværende flyvning (0 = ingen).
  const frameRef = useRef(0)

  const { x, y, width, height } = bounds

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_SCALE, MAX_SCALE])
      // Samme koordinater som viewBox, så vi ikke er afhængige af browseren.
      .extent([
        [x, y],
        [x + width, y + height],
      ])
      .on('start', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        // sourceEvent findes kun, når brugeren selv zoomer eller trækker.
        // Så afbrydes en flyvning, så de to ikke slås om kameraet.
        if (event.sourceEvent) cancelAnimationFrame(frameRef.current)
        onZoomStart?.()
      })
      .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        setTransform(event.transform)
      })

    behaviorRef.current = behavior
    select(svg).call(behavior)

    // Rydder op: fjerner lytterne igen, når komponenten forsvinder.
    return () => {
      cancelAnimationFrame(frameRef.current)
      select(svg).on('.zoom', null)
      behaviorRef.current = null
    }
  }, [svgRef, x, y, width, height, onZoomStart])

  // Skærmens midte i tegningens koordinater (viewBox er centreret).
  const centerX = x + width / 2
  const centerY = y + height / 2

  /** Flytter kameraet til en ny stilling, som en flyvning hvis det er muligt. */
  const flyTo = useCallback(
    (target: Camera) => {
      const svg = svgRef.current
      const behavior = behaviorRef.current
      if (!svg || !behavior) return
      cancelAnimationFrame(frameRef.current)

      // Vi beder d3-zoom om at skifte transform. Så kender d3 den nye
      // stilling, og næste træk eller knib fortsætter derfra.
      const apply = (camera: Camera) =>
        select(svg).call(
          behavior.transform,
          zoomIdentity.translate(camera.x, camera.y).scale(camera.k),
        )

      if (!shouldAnimate()) {
        apply(target)
        return
      }

      const from = zoomTransform(svg)
      const center = { x: centerX, y: centerY }
      const startTime = performance.now()
      // requestAnimationFrame kalder tick lige før hvert skærmbillede.
      const tick = (now: number) => {
        const t = Math.min((now - startTime) / FLY_MS, 1)
        apply(cameraBetween(from, target, ease(t), center))
        if (t < 1) frameRef.current = requestAnimationFrame(tick)
      }
      frameRef.current = requestAnimationFrame(tick)
    },
    [svgRef, centerX, centerY],
  )

  /** "Vis alt": viewBox viser allerede hele træet, så vi flyver hjem. */
  const resetZoom = useCallback(() => flyTo(HOME), [flyTo])

  return { transform, resetZoom, flyTo }
}
