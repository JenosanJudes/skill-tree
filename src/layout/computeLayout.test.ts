import { describe, expect, it } from 'vitest'
import { makeTestTree } from '../store/testTree'
import {
  LEVEL_HEIGHT,
  NODE_WIDTH,
  computeLayout,
  elbowPath,
} from './computeLayout'
import type { Layout, LayoutNode } from './computeLayout'

function getNode(layout: Layout, id: string): LayoutNode {
  const node = layout.nodes.find((n) => n.id === id)
  if (!node) throw new Error(`Noden ${id} findes ikke i layoutet`)
  return node
}

describe('computeLayout', () => {
  const layout = computeLayout(makeTestTree().root)

  it('giver én layoutnode pr. node i træet', () => {
    expect(layout.nodes.map((n) => n.id).sort()).toEqual(
      ['branch', 'deep', 'leaf-a', 'leaf-b', 'root'].sort(),
    )
  })

  it('placerer stammen i (0, 0) og alle andre over den', () => {
    const root = getNode(layout, 'root')
    expect(root.x).toBe(0)
    expect(root.y).toBe(0)
    for (const node of layout.nodes.filter((n) => n.id !== 'root')) {
      expect(node.y).toBeLessThan(0)
    }
  })

  it('placerer hvert barn én række over sin forælder', () => {
    expect(getNode(layout, 'branch').y).toBe(-LEVEL_HEIGHT)
    expect(getNode(layout, 'leaf-a').y).toBe(-2 * LEVEL_HEIGHT)
    expect(getNode(layout, 'leaf-b').y).toBe(-2 * LEVEL_HEIGHT)
    expect(getNode(layout, 'deep').y).toBe(-3 * LEVEL_HEIGHT)
  })

  it('placerer en forælder midt over sine yderste børn', () => {
    const a = getNode(layout, 'leaf-a')
    const b = getNode(layout, 'leaf-b')
    expect(getNode(layout, 'branch').x).toBeCloseTo((a.x + b.x) / 2)
  })

  it('holder noder på samme række mindst en nodebredde fra hinanden', () => {
    const a = getNode(layout, 'leaf-a')
    const b = getNode(layout, 'leaf-b')
    expect(Math.abs(a.x - b.x)).toBeGreaterThanOrEqual(NODE_WIDTH)
  })

  it('angiver typen: stamme, hovedgren og undergren', () => {
    expect(getNode(layout, 'root').kind).toBe('root')
    expect(getNode(layout, 'branch').kind).toBe('branch')
    expect(getNode(layout, 'leaf-a').kind).toBe('skill')
    expect(getNode(layout, 'deep').kind).toBe('skill')
  })

  it('lader undergrene arve hovedgrenens farve, men ikke stammen', () => {
    expect(getNode(layout, 'root').color).toBeUndefined()
    expect(getNode(layout, 'branch').color).toBe('#ff0000')
    expect(getNode(layout, 'leaf-a').color).toBe('#ff0000')
    expect(getNode(layout, 'deep').color).toBe('#ff0000')
  })

  it('tager navn og niveau med fra noden', () => {
    const leaf = getNode(layout, 'leaf-b')
    expect(leaf.name).toBe('Blad B')
    expect(leaf.level).toBe(2)
    expect(getNode(layout, 'branch').level).toBeUndefined()
  })

  it('giver én forbindelse til hver node undtagen stammen', () => {
    expect(layout.links.map((l) => l.id).sort()).toEqual(
      ['branch', 'deep', 'leaf-a', 'leaf-b'].sort(),
    )
  })

  it('får viewBox til at rumme alle noder', () => {
    const { x, y, width, height } = layout.bounds
    for (const node of layout.nodes) {
      expect(node.x).toBeGreaterThan(x)
      expect(node.x).toBeLessThan(x + width)
      expect(node.y).toBeGreaterThan(y)
      expect(node.y).toBeLessThan(y + height)
    }
  })

  it('ændrer ikke det træ, den får', () => {
    const original = makeTestTree()
    const copy = structuredClone(original)
    computeLayout(original.root)
    expect(original).toEqual(copy)
  })
})

describe('elbowPath', () => {
  it('går lodret, vandret og lodret mellem forælder og barn', () => {
    expect(elbowPath({ x: 0, y: 0 }, { x: 100, y: -120 })).toBe(
      'M0,0V-60H100V-120',
    )
  })
})
