import { useLayoutEffect, useMemo, useState } from 'react'
import type { RefObject } from 'react'
import type { Bounds } from '../layout/computeLayout'
import { viewportFor } from '../layout/viewport'
import type { Viewport } from '../layout/viewport'

/**
 * Måler SVG-elementets størrelse på skærmen og holder øje med, om den ændres
 * (vinduet trækkes, telefonen vendes). Selve udregningen ligger i den rene
 * funktion viewportFor.
 */
export function useViewport(
  svgRef: RefObject<SVGSVGElement | null>,
  bounds: Bounds,
): Viewport {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  )

  // useLayoutEffect kører, før browseren viser siden. Så er størrelsen kendt
  // fra første billede, og navnene blinker ikke frem og væk ved start.
  useLayoutEffect(() => {
    const svg = svgRef.current
    // ResizeObserver findes i alle browsere, men ikke i jsdom (tests).
    if (!svg || typeof ResizeObserver === 'undefined') return
    const box = svg.getBoundingClientRect()
    setSize({ width: box.width, height: box.height })
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    observer.observe(svg)
    return () => observer.disconnect()
  }, [svgRef])

  const { x, y, width, height } = bounds
  // useMemo giver det samme objekt, så længe tallene er de samme. Ellers
  // ville alt, der afhænger af viewporten, blive regnet om ved hver tegning.
  return useMemo(
    () => viewportFor({ x, y, width, height }, size),
    [x, y, width, height, size],
  )
}
