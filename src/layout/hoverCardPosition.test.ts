import { describe, expect, it } from 'vitest'
import { CARD_WIDTH, hoverCardPosition } from './hoverCardPosition'

// En træ-visning på 1000 x 600 pixels, 50 pixels fra skærmens venstre kant.
const container = { left: 50, top: 0, width: 1000, height: 600 }

function nodeAt(centerX: number, top: number) {
  return { left: centerX - 10, top, width: 20, height: 30 }
}

describe('hoverCardPosition', () => {
  it('placerer boksen centreret over en node i midten', () => {
    expect(hoverCardPosition(nodeAt(550, 400), container)).toEqual({
      left: 500, // målt fra træ-visningens kant, ikke skærmens
      y: 392, // 8 pixels over noden
      placement: 'above',
    })
  })

  it('placerer boksen under en node i den øverste tredjedel', () => {
    expect(hoverCardPosition(nodeAt(550, 100), container)).toEqual({
      left: 500,
      y: 138, // nodens bund (130) + 8
      placement: 'below',
    })
  })

  it('holder boksen inden for venstre og højre kant', () => {
    const half = CARD_WIDTH / 2
    expect(hoverCardPosition(nodeAt(55, 400), container).left).toBe(half + 8)
    expect(hoverCardPosition(nodeAt(1045, 400), container).left).toBe(
      1000 - half - 8,
    )
  })

  it('centrerer boksen, når visningen er smallere end boksen', () => {
    const narrow = { left: 0, top: 0, width: 200, height: 600 }
    expect(hoverCardPosition(nodeAt(20, 400), narrow).left).toBe(100)
  })
})
