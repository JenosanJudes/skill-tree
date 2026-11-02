import { describe, expect, it } from 'vitest'
import { DEFAULT_BRANCH_COLOR, addNode, treeReducer } from './treeReducer'
import { makeTestTree } from './testTree'
import { findNode } from './treeUtils'

describe('treeReducer', () => {
  describe('addNode', () => {
    it('tilføjer en undergren med niveau 0 og uden farve', () => {
      const state = makeTestTree()
      const action = addNode('branch', 'Ny færdighed')
      const next = treeReducer(state, action)

      const added = findNode(next.root, action.id)
      expect(added).toEqual({
        id: expect.any(String),
        name: 'Ny færdighed',
        level: 0,
        children: [],
      })
      expect(findNode(next.root, 'branch')?.children).toHaveLength(3)
    })

    it('tilføjer en hovedgren med farve og uden niveau under stammen', () => {
      const next = treeReducer(makeTestTree(), {
        type: 'addNode',
        parentId: 'root',
        id: 'new-branch',
        name: 'Ny gren',
      })

      const added = findNode(next.root, 'new-branch')
      expect(added?.color).toBe(DEFAULT_BRANCH_COLOR)
      expect(added?.level).toBeUndefined()
    })

    it('fjerner mellemrum omkring navnet', () => {
      const next = treeReducer(makeTestTree(), {
        type: 'addNode',
        parentId: 'branch',
        id: 'x',
        name: '  React  ',
      })
      expect(findNode(next.root, 'x')?.name).toBe('React')
    })

    it('ignorerer tomt navn, ukendt forælder og et id der findes', () => {
      const state = makeTestTree()
      const base = { type: 'addNode' as const, parentId: 'branch', id: 'x' }

      expect(treeReducer(state, { ...base, name: '   ' })).toBe(state)
      expect(treeReducer(state, { ...base, name: 'A', parentId: 'nope' })).toBe(
        state,
      )
      expect(treeReducer(state, { ...base, name: 'A', id: 'leaf-a' })).toBe(
        state,
      )
    })

    it('giver hver ny node et unikt id', () => {
      const a = addNode('branch', 'A')
      const b = addNode('branch', 'A')
      expect(a.id).not.toBe(b.id)
    })
  })

  describe('renameNode', () => {
    it('omdøber en node i dybden', () => {
      const next = treeReducer(makeTestTree(), {
        type: 'renameNode',
        id: 'deep',
        name: 'Nyt navn',
      })
      expect(findNode(next.root, 'deep')?.name).toBe('Nyt navn')
    })

    it('ignorerer tomt navn og ukendt id', () => {
      const state = makeTestTree()
      expect(
        treeReducer(state, { type: 'renameNode', id: 'deep', name: ' ' }),
      ).toBe(state)
      expect(
        treeReducer(state, { type: 'renameNode', id: 'nope', name: 'X' }),
      ).toBe(state)
    })
  })

  describe('deleteNode', () => {
    it('sletter en node sammen med dens undernoder', () => {
      const next = treeReducer(makeTestTree(), {
        type: 'deleteNode',
        id: 'leaf-b',
      })
      expect(findNode(next.root, 'leaf-b')).toBeUndefined()
      expect(findNode(next.root, 'deep')).toBeUndefined()
      expect(findNode(next.root, 'leaf-a')).toBeDefined()
    })

    it('kan ikke slette stammen', () => {
      const state = makeTestTree()
      expect(treeReducer(state, { type: 'deleteNode', id: 'root' })).toBe(state)
    })
  })

  describe('setLevel', () => {
    it('sætter niveau på en undergren', () => {
      const next = treeReducer(makeTestTree(), {
        type: 'setLevel',
        id: 'leaf-a',
        level: 4,
      })
      expect(findNode(next.root, 'leaf-a')?.level).toBe(4)
    })

    it('ignorerer stammen og hovedgrene', () => {
      const state = makeTestTree()
      expect(
        treeReducer(state, { type: 'setLevel', id: 'root', level: 3 }),
      ).toBe(state)
      expect(
        treeReducer(state, { type: 'setLevel', id: 'branch', level: 3 }),
      ).toBe(state)
    })
  })

  it('ændrer aldrig det gamle træ', () => {
    const state = makeTestTree()
    const snapshot = structuredClone(state)

    treeReducer(state, { type: 'renameNode', id: 'deep', name: 'X' })
    treeReducer(state, { type: 'deleteNode', id: 'leaf-a' })
    treeReducer(state, { type: 'setLevel', id: 'leaf-a', level: 5 })

    expect(state).toEqual(snapshot)
  })

  it('genbruger grene, der ikke er ændret', () => {
    const state = makeTestTree()
    const next = treeReducer(state, {
      type: 'renameNode',
      id: 'leaf-a',
      name: 'X',
    })
    const oldLeafB = findNode(state.root, 'leaf-b')
    expect(findNode(next.root, 'leaf-b')).toBe(oldLeafB)
  })
})
