import { LEVEL_STEPS } from '../components/levels'

/** Mellemrum mellem to stykker af ringen, i grader. */
const GAP_DEGREES = 16

function pointAt(radius: number, degrees: number): string {
  // 0 grader er lige op; vinklen vokser med uret.
  const radians = (degrees * Math.PI) / 180
  const x = radius * Math.sin(radians)
  const y = -radius * Math.cos(radians)
  return `${x.toFixed(2)},${y.toFixed(2)}`
}

/**
 * Ringen om en node, delt i fem stykker: ét pr. niveau. Første stykke
 * begynder øverst, og de følger uret. Hvert stykke er en SVG-bue (A).
 */
export function levelSegments(radius: number): string[] {
  const span = 360 / LEVEL_STEPS.length
  return LEVEL_STEPS.map((_, index) => {
    const from = index * span + GAP_DEGREES / 2
    const to = (index + 1) * span - GAP_DEGREES / 2
    return `M${pointAt(radius, from)}A${radius},${radius} 0 0 1 ${pointAt(radius, to)}`
  })
}
