/** Boksens bredde i pixels. Skal passe med .hover-card i index.css. */
export const CARD_WIDTH = 260
/** Mindste afstand fra boksen til kanten af træ-visningen. */
const EDGE_MARGIN = 8
/** Afstand mellem noden og boksen. */
const GAP = 8

type Rect = { left: number; top: number; width: number; height: number }

export type CardPosition = {
  /** Boksens midte, vandret, målt fra venstre kant af træ-visningen. */
  left: number
  /** Over noden: boksens bund. Under noden: boksens top. */
  y: number
  placement: 'above' | 'below'
}

/**
 * Regner ud, hvor hover-boksen skal stå i forhold til træ-visningen. Begge
 * rektangler er i skærm-pixels (fra getBoundingClientRect), så zoom og
 * panorering allerede er regnet med. Ren funktion: kun tal ind og ud.
 */
export function hoverCardPosition(node: Rect, container: Rect): CardPosition {
  const centerX = node.left + node.width / 2 - container.left
  const top = node.top - container.top
  const bottom = top + node.height

  // Hold boksen inden for kanterne. Er visningen smallere end boksen,
  // centreres den bare.
  const min = CARD_WIDTH / 2 + EDGE_MARGIN
  const max = container.width - CARD_WIDTH / 2 - EDGE_MARGIN
  const left = max < min ? container.width / 2 : clamp(centerX, min, max)

  // Står noden i den øverste tredjedel, er der ikke plads over den.
  return top > container.height / 3
    ? { left, y: top - GAP, placement: 'above' }
    : { left, y: bottom + GAP, placement: 'below' }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
