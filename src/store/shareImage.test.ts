import { describe, expect, it } from 'vitest'
import { shareFileName, shareSubtitle } from './shareImage'
import { makeTestTree } from './testTree'

describe('shareSubtitle', () => {
  it('viser titel og kraft', () => {
    expect(shareSubtitle(makeTestTree())).toBe('LÆRLING · 3 / 15')
  })

  it('har en reserve for et træ uden færdigheder', () => {
    expect(
      shareSubtitle({
        formatVersion: 1,
        root: { id: 'root', name: 'Rod', children: [] },
      }),
    ).toBe('Skill tree')
  })
})

describe('shareFileName', () => {
  it('har datoen i navnet', () => {
    expect(shareFileName(new Date('2026-11-17T10:00:00Z'))).toBe(
      'skill-tree-2026-11-17.png',
    )
  })
})
