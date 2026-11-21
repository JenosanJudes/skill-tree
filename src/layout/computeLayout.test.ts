import { describe, expect, it } from 'vitest'
import { makeTestTree } from '../store/testTree'
import type { SkillNode } from '../types/skillTree'
import {
  NODE_SPACING,
  RING_STEP,
  branchBounds,
  computeLayout,
  linkPath,
} from './computeLayout'
import type { Layout, LayoutNode } from './computeLayout'

function getNode(layout: Layout, id: string): LayoutNode {
  const node = layout.nodes.find((n) => n.id === id)
  if (!node) throw new Error(`Noden ${id} findes ikke i layoutet`)
  return node
}

/** Afstand fra stammen i midten. */
function distance(node: LayoutNode): number {
  return Math.hypot(node.x, node.y)
}

function between(a: LayoutNode, b: LayoutNode): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Et træ med mange hovedgrene, der hver har to undergrene. */
function makeWideTree(branches: number): SkillNode {
  return {
    id: 'root',
    name: 'Rod',
    children: Array.from({ length: branches }, (_, b) => ({
      id: `b${b}`,
      name: `Gren ${b}`,
      color: '#ff0000',
      children: [
        { id: `b${b}-1`, name: 'Et', level: 1 as const, children: [] },
        { id: `b${b}-2`, name: 'To', level: 2 as const, children: [] },
      ],
    })),
  }
}

describe('computeLayout', () => {
  const layout = computeLayout(makeTestTree().root)

  it('giver én layoutnode pr. node i træet', () => {
    expect(layout.nodes.map((n) => n.id).sort()).toEqual(
      ['branch', 'deep', 'leaf-a', 'leaf-b', 'root'].sort(),
    )
  })

  it('placerer stammen i midten, i (0, 0)', () => {
    const root = getNode(layout, 'root')
    expect(root.x).toBe(0)
    expect(root.y).toBe(0)
  })

  it('placerer hver dybde på sin egen ring om stammen', () => {
    const ring = distance(getNode(layout, 'branch'))
    expect(ring).toBeGreaterThanOrEqual(RING_STEP - 0.1)
    expect(distance(getNode(layout, 'leaf-a'))).toBeCloseTo(2 * ring, 0)
    expect(distance(getNode(layout, 'leaf-b'))).toBeCloseTo(2 * ring, 0)
    expect(distance(getNode(layout, 'deep'))).toBeCloseTo(3 * ring, 0)
  })

  it('holder naboer på samme ring fra hinanden', () => {
    expect(
      between(getNode(layout, 'leaf-a'), getNode(layout, 'leaf-b')),
    ).toBeGreaterThanOrEqual(NODE_SPACING - 0.1)
  })

  it('gør cirklen større, når der er mange noder', () => {
    const wide = computeLayout(makeWideTree(20))
    const outer = wide.nodes.filter((n) => n.kind === 'skill')
    for (const a of outer) {
      for (const b of outer) {
        if (a.id < b.id) {
          expect(between(a, b)).toBeGreaterThanOrEqual(NODE_SPACING - 0.1)
        }
      }
    }
    expect(distance(getNode(wide, 'b0'))).toBeGreaterThan(RING_STEP)
  })

  it('spreder hovedgrenene hele vejen rundt om stammen', () => {
    const wide = computeLayout(makeWideTree(4))
    const branches = wide.nodes.filter((n) => n.kind === 'branch')
    // Der er grene både over, under, til venstre og til højre for stammen.
    expect(Math.min(...branches.map((n) => n.x))).toBeLessThan(0)
    expect(Math.max(...branches.map((n) => n.x))).toBeGreaterThan(0)
    expect(Math.min(...branches.map((n) => n.y))).toBeLessThan(0)
    expect(Math.max(...branches.map((n) => n.y))).toBeGreaterThan(0)
  })

  it('kan lægge et træ ud, der kun har en stamme', () => {
    const alone = computeLayout({ id: 'root', name: 'Rod', children: [] })
    expect(alone.nodes).toHaveLength(1)
    expect(alone.links).toHaveLength(0)
    expect(alone.bounds.width).toBeGreaterThan(0)
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

  it('fortæller, hvilken hovedgren en node hører under', () => {
    expect(getNode(layout, 'root').branchId).toBeUndefined()
    expect(getNode(layout, 'branch').branchId).toBe('branch')
    expect(getNode(layout, 'deep').branchId).toBe('branch')
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

  it('giver forbindelsen barnets farve', () => {
    const link = layout.links.find((l) => l.id === 'leaf-a')
    expect(link?.color).toBe('#ff0000')
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

describe('branchBounds', () => {
  const wide = computeLayout(makeWideTree(4))

  it('rummer hovedgrenen og dens undergrene', () => {
    const bounds = branchBounds(wide, 'b1')
    expect(bounds).not.toBeNull()
    if (!bounds) return
    for (const id of ['b1', 'b1-1', 'b1-2']) {
      const node = getNode(wide, id)
      expect(node.x).toBeGreaterThan(bounds.x)
      expect(node.x).toBeLessThan(bounds.x + bounds.width)
      expect(node.y).toBeGreaterThan(bounds.y)
      expect(node.y).toBeLessThan(bounds.y + bounds.height)
    }
  })

  it('er mindre end hele træet', () => {
    const bounds = branchBounds(wide, 'b1')
    expect(bounds?.width).toBeLessThan(wide.bounds.width)
  })

  it('giver null for en node, der ikke er en hovedgren', () => {
    expect(branchBounds(wide, 'root')).toBeNull()
    expect(branchBounds(wide, 'b1-1')).toBeNull()
  })
})

describe('linkPath', () => {
  it('tegner en lige streg, der stopper lidt før de to cirkler', () => {
    // Radius 10 og 5 enheders luft i hver ende.
    expect(linkPath({ x: 0, y: 0 }, { x: 100, y: 0 }, 10, 10)).toBe(
      'M15,0L85,0',
    )
  })

  it('tegner hele vejen, når noderne står for tæt', () => {
    expect(linkPath({ x: 0, y: 0 }, { x: 20, y: 0 }, 10, 10)).toBe('M0,0L20,0')
  })
})
