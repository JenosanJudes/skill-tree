import { describe, expect, it } from 'vitest'
import { STAR_LAYERS, starTile } from './stars'

describe('starTile', () => {
  it('giver én farveovergang pr. stjerne', () => {
    expect(starTile(1, 5, 100, 1).match(/radial-gradient/g)).toHaveLength(5)
  })

  it('giver samme himmel for samme frø', () => {
    expect(starTile(3, 8, 200, 1)).toBe(starTile(3, 8, 200, 1))
  })

  it('giver en anden himmel for et andet frø', () => {
    expect(starTile(3, 8, 200, 1)).not.toBe(starTile(4, 8, 200, 1))
  })

  it('holder stjernerne inden for flisen', () => {
    const positions = [
      ...starTile(9, 30, 120, 1).matchAll(/at (\d+)px (\d+)px/g),
    ]
    expect(positions).toHaveLength(30)
    for (const [, x, y] of positions) {
      expect(Number(x)).toBeLessThanOrEqual(120)
      expect(Number(y)).toBeLessThanOrEqual(120)
    }
  })
})

describe('STAR_LAYERS', () => {
  it('lader de nære stjerner flytte sig mere end de fjerne', () => {
    const [far, near] = STAR_LAYERS
    expect(near.parallax).toBeGreaterThan(far.parallax)
  })
})
