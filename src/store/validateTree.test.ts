import { describe, expect, it } from 'vitest'
import { makeTestTree } from './testTree'
import { validateTree } from './validateTree'

describe('validateTree', () => {
  it('godkender et gyldigt træ', () => {
    expect(validateTree(makeTestTree()).ok).toBe(true)
  })

  it('afviser noget, der ikke er et objekt', () => {
    expect(validateTree(null).ok).toBe(false)
    expect(validateTree('tekst').ok).toBe(false)
    expect(validateTree([]).ok).toBe(false)
  })

  it('afviser forkert formatVersion', () => {
    const result = validateTree({ ...makeTestTree(), formatVersion: 2 })
    expect(result.ok).toBe(false)
  })

  it('afviser id, der bruges to gange', () => {
    const tree = makeTestTree()
    tree.root.children[0].children[1].id = 'leaf-a'
    const result = validateTree(tree)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors[0]).toContain('leaf-a')
  })

  it.each([-1, 6, 2.5, '3'])('afviser niveau %s', (level) => {
    const tree = makeTestTree() as unknown as {
      root: { children: { children: { level: unknown }[] }[] }
    }
    tree.root.children[0].children[0].level = level
    expect(validateTree(tree).ok).toBe(false)
  })

  it('afviser en node uden children og forkerte links', () => {
    const tree = makeTestTree() as unknown as {
      root: { children: Record<string, unknown>[] }
    }
    delete tree.root.children[0].children
    expect(validateTree(tree).ok).toBe(false)

    const withBadLinks = makeTestTree() as unknown as {
      root: Record<string, unknown>
    }
    withBadLinks.root.links = [{ title: 'Mangler url' }]
    expect(validateTree(withBadLinks).ok).toBe(false)
  })
})
