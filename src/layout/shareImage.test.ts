import { describe, expect, it } from 'vitest'
import { makeTestTree } from '../store/testTree'
import { computeLayout } from './computeLayout'
import { SHARE_HEIGHT, SHARE_WIDTH, shareSvg } from './shareImage'

const text = { title: 'Rod', subtitle: 'LÆRLING · 3 / 15' }

function render(tree = makeTestTree()) {
  return shareSvg(computeLayout(tree.root), text)
}

describe('shareSvg', () => {
  it('er gyldig SVG i den rigtige størrelse', () => {
    const doc = new DOMParser().parseFromString(render(), 'image/svg+xml')
    expect(doc.querySelector('parsererror')).toBeNull()
    const svg = doc.documentElement
    expect(svg.getAttribute('width')).toBe(String(SHARE_WIDTH))
    expect(svg.getAttribute('height')).toBe(String(SHARE_HEIGHT))
  })

  it('viser titel, undertitel og alle navne', () => {
    const svg = render()
    for (const word of [
      'Rod',
      'LÆRLING · 3 / 15',
      'Hovedgren',
      'Blad A',
      'Dyb',
    ]) {
      expect(svg).toContain(word)
    }
  })

  it('tegner en forbindelse pr. node undtagen stammen', () => {
    const doc = new DOMParser().parseFromString(render(), 'image/svg+xml')
    // Hver undergren har desuden fem stykker i sin niveauring.
    const paths = doc.querySelectorAll('path')
    expect(paths).toHaveLength(4 + 3 * 5)
  })

  it('skriver særlige tegn i navne om, så de ikke bliver til kode', () => {
    const tree = makeTestTree()
    tree.root.children[0].name = 'C < D & "E"'
    const svg = render(tree)
    expect(svg).toContain('C &lt; D &amp; &quot;E&quot;')
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
    expect(doc.querySelector('parsererror')).toBeNull()
  })

  it('erstatter en farve, der ikke er #rrggbb', () => {
    const tree = makeTestTree()
    tree.root.children[0].color = '"/><script>'
    const svg = render(tree)
    expect(svg).not.toContain('<script>')
  })

  it('giver samme billede for samme træ', () => {
    expect(render()).toBe(render())
  })
})
