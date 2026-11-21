import { describe, expect, it } from 'vitest'
import { makeTestTree } from './testTree'
import { rankFor, treeStats } from './treeStats'

describe('treeStats', () => {
  it('lægger niveauerne sammen for hele træet', () => {
    // Blad A (1) + Blad B (2) + Dyb (0) = 3 ud af 3 × 5.
    const stats = treeStats(makeTestTree().root)
    expect(stats.power).toBe(3)
    expect(stats.maxPower).toBe(15)
  })

  it('regner hver hovedgren for sig', () => {
    const tree = makeTestTree()
    tree.root.children.push({
      id: 'other',
      name: 'Anden gren',
      color: '#00ff00',
      children: [{ id: 'c', name: 'Blad C', level: 5, children: [] }],
    })
    const stats = treeStats(tree.root)
    expect(stats.branches).toEqual([
      {
        id: 'branch',
        name: 'Hovedgren',
        color: '#ff0000',
        power: 3,
        maxPower: 15,
      },
      {
        id: 'other',
        name: 'Anden gren',
        color: '#00ff00',
        power: 5,
        maxPower: 5,
      },
    ])
    expect(stats.power).toBe(8)
    expect(stats.maxPower).toBe(20)
  })

  it('giver nul for et træ uden færdigheder', () => {
    expect(treeStats({ id: 'root', name: 'Rod', children: [] })).toEqual({
      power: 0,
      maxPower: 0,
      branches: [],
    })
  })

  it('ændrer ikke det træ, den får', () => {
    const original = makeTestTree()
    const copy = structuredClone(original)
    treeStats(original.root)
    expect(original).toEqual(copy)
  })
})

describe('rankFor', () => {
  it('giver en titel efter andelen af den mulige kraft', () => {
    expect(rankFor(0, 100)).toBe('Novice')
    expect(rankFor(20, 100)).toBe('Lærling')
    expect(rankFor(59, 100)).toBe('Øvet')
    expect(rankFor(60, 100)).toBe('Ekspert')
    expect(rankFor(100, 100)).toBe('Mester')
  })

  it('giver Novice for et tomt træ', () => {
    expect(rankFor(0, 0)).toBe('Novice')
  })
})
