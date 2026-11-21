import { describe, expect, it } from 'vitest'
import { levelSegments } from './levelRing'

describe('levelSegments', () => {
  it('deler ringen i fem stykker', () => {
    expect(levelSegments(20)).toHaveLength(5)
  })

  it('begynder første stykke øverst til højre for midten', () => {
    const [first] = levelSegments(20)
    const [, x, y] = first.match(/^M(-?[\d.]+),(-?[\d.]+)/) ?? []
    expect(Number(x)).toBeGreaterThan(0)
    expect(Number(y)).toBeLessThan(-15)
  })

  it('tegner hvert stykke som en bue med ringens radius', () => {
    for (const segment of levelSegments(20)) {
      expect(segment).toContain('A20,20 0 0 1')
    }
  })
})
