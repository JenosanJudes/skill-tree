import type { Level } from '../types/skillTree'
import type { NodeKind } from './computeLayout'

export type Glow = {
  /** Hvor meget større glorien er end selve cirklen (SVG-enheder). */
  spread: number
  /** Gloriens gennemsigtighed: 0 = usynlig, 1 = fuld farve. */
  opacity: number
}

/** Id på SVG-filteret, der slører glorien. Bruges af TreeDrawing og TreeNode. */
export const GLOW_FILTER_ID = 'node-glow'

/** Hvor meget filteret slører (standardafvigelsen i Gauss-sløringen). */
export const GLOW_BLUR = 5

/** Stamme og hovedgrene har intet niveau, men en svag, fast glød. */
const HEADING_GLOW: Glow = { spread: 6, opacity: 0.4 }

/**
 * Hvor meget en node skal gløde. Niveau 0 (ikke låst op) gløder ikke;
 * niveau 1-5 gløder stærkere og bredere for hvert niveau. Ren funktion.
 */
export function glowFor(kind: NodeKind, level: Level = 0): Glow | null {
  if (kind !== 'skill') return HEADING_GLOW
  if (level === 0) return null
  return { spread: 2 + level * 2, opacity: 0.15 + level * 0.15 }
}
