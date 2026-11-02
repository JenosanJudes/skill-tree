import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BACKUP_KEY,
  STORAGE_KEY,
  getDefaultTree,
  loadTree,
  saveTree,
} from './storage'
import { makeTestTree } from './testTree'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('bruger startskabelonen, når intet er gemt', () => {
    expect(loadTree()).toEqual(getDefaultTree())
  })

  it('indlæser det samme træ, som blev gemt', () => {
    const tree = makeTestTree()
    expect(saveTree(tree)).toBe(true)
    expect(loadTree()).toEqual(tree)
  })

  it('falder tilbage til skabelonen og gemmer en backup ved ødelagt data', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem(STORAGE_KEY, '{ ikke gyldig json')

    expect(loadTree()).toEqual(getDefaultTree())
    expect(localStorage.getItem(BACKUP_KEY)).toBe('{ ikke gyldig json')
  })

  it('falder tilbage til skabelonen ved ukendt formatVersion', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    saveTree({ ...makeTestTree(), formatVersion: 99 } as never)

    expect(loadTree()).toEqual(getDefaultTree())
  })

  it('returnerer false, hvis browseren nægter at gemme', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(saveTree(makeTestTree())).toBe(false)
  })

  it('giver en ny kopi af skabelonen hver gang', () => {
    const a = getDefaultTree()
    a.root.name = 'Ændret'
    expect(getDefaultTree().root.name).not.toBe('Ændret')
  })
})

describe('startskabelonen', () => {
  it('er gyldig og har fire hovedgrene uden niveau', () => {
    const tree = getDefaultTree()
    expect(tree.root.children).toHaveLength(4)
    for (const branch of tree.root.children) {
      expect(branch.color).toBeDefined()
      expect(branch.level).toBeUndefined()
    }
  })
})
