import { describe, expect, it } from 'vitest'
import type { Level } from '../types/skillTree'
import { glowFor } from './glow'

describe('glowFor', () => {
  it('giver ingen glød på niveau 0', () => {
    expect(glowFor('skill', 0)).toBeNull()
    expect(glowFor('skill')).toBeNull()
  })

  it('gløder bredere og stærkere for hvert niveau', () => {
    const glows = ([1, 2, 3, 4, 5] as Level[]).map((level) =>
      glowFor('skill', level),
    )
    for (let i = 1; i < glows.length; i++) {
      expect(glows[i]!.spread).toBeGreaterThan(glows[i - 1]!.spread)
      expect(glows[i]!.opacity).toBeGreaterThan(glows[i - 1]!.opacity)
    }
    expect(glows[4]!.opacity).toBeLessThanOrEqual(1)
  })

  it('giver stamme og hovedgrene en fast glød', () => {
    expect(glowFor('root')).toEqual(glowFor('branch'))
    expect(glowFor('branch')).not.toBeNull()
  })
})
