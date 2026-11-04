import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { select } from 'd3-selection'
import { zoom, zoomIdentity } from 'd3-zoom'
import type { D3ZoomEvent, ZoomBehavior, ZoomTransform } from 'd3-zoom'

const MIN_SCALE = 0.5
const MAX_SCALE = 8

type Bounds = { x: number; y: number; width: number; height: number }

/**
 * Kobler d3-zoom på en SVG. d3 lytter kun efter hjul og træk og regner en
 * transform ud (x, y og k). Transformen lægges i React-state, og React sætter
 * den på en <g>, så d3 aldrig ændrer selve tegningen.
 */
export function useZoom(
  svgRef: RefObject<SVGSVGElement | null>,
  bounds: Bounds,
  /** Kaldes, når en zoom eller et træk begynder. Skal være stabil (useCallback). */
  onZoomStart?: () => void,
) {
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity)
  const behaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)

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
      .on('start', () => onZoomStart?.())
      .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        setTransform(event.transform)
      })

    behaviorRef.current = behavior
    select(svg).call(behavior)

    // Rydder op: fjerner lytterne igen, når komponenten forsvinder.
    return () => {
      select(svg).on('.zoom', null)
      behaviorRef.current = null
    }
  }, [svgRef, x, y, width, height, onZoomStart])

  /** "Vis alt": viewBox viser allerede hele træet, så vi nulstiller blot. */
  const resetZoom = useCallback(() => {
    const svg = svgRef.current
    const behavior = behaviorRef.current
    if (!svg || !behavior) return
    select(svg).call(behavior.transform, zoomIdentity)
  }, [svgRef])

  return { transform, resetZoom }
}
