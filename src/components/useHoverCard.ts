import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { hoverCardPosition } from '../layout/hoverCardPosition'
import type { CardPosition } from '../layout/hoverCardPosition'

/** Ventetid, før boksen vises, så den ikke blinker, når musen bare passerer. */
export const HOVER_DELAY_MS = 300

export type HoverTarget = { id: string; position: CardPosition }

/**
 * Holder styr på, hvilken node hover-boksen skal vises for. show() starter en
 * nedtælling; hide() stopper den og skjuler boksen med det samme. Det minder
 * om autosave i TreeProvider, men her er det UI-tilstand, ikke data.
 */
export function useHoverCard(containerRef: RefObject<HTMLElement | null>) {
  const [hovered, setHovered] = useState<HoverTarget | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const show = useCallback(
    (id: string, element: Element) => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        const container = containerRef.current
        if (!container) return
        // Positionen måles først nu, så den passer, når boksen vises.
        const position = hoverCardPosition(
          element.getBoundingClientRect(),
          container.getBoundingClientRect(),
        )
        setHovered({ id, position })
      }, HOVER_DELAY_MS)
    },
    [containerRef],
  )

  const hide = useCallback(() => {
    clearTimeout(timer.current)
    setHovered(null)
  }, [])

  // Stop en ventende nedtælling, hvis komponenten forsvinder.
  useEffect(() => () => clearTimeout(timer.current), [])

  return { hovered, show, hide }
}
