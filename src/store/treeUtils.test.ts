import { describe, expect, it } from 'vitest'
import { makeTestTree } from './testTree'
import { countNodes, findPath, isHexColor, isSafeUrl } from './treeUtils'

describe('isHexColor', () => {
  it('godtager #rrggbb med store og små bogstaver', () => {
    expect(isHexColor('#00ff88')).toBe(true)
    expect(isHexColor('#00FF88')).toBe(true)
  })

  it('afviser andre farveformer', () => {
    for (const color of ['red', '#0f8', '00ff88', '#00ff88aa', 'rgb(0,0,0)']) {
      expect(isHexColor(color)).toBe(false)
    }
  })
})

describe('countNodes', () => {
  it('tæller alle noder, stammen medregnet', () => {
    expect(countNodes(makeTestTree().root)).toBe(5)
  })
})

describe('findPath', () => {
  it('giver vejen fra stammen til noden', () => {
    const path = findPath(makeTestTree().root, 'deep')
    expect(path?.map((node) => node.id)).toEqual([
      'root',
      'branch',
      'leaf-b',
      'deep',
    ])
  })

  it('giver kun stammen for stammen og undefined for ukendt id', () => {
    const { root } = makeTestTree()
    expect(findPath(root, 'root')).toEqual([root])
    expect(findPath(root, 'nope')).toBeUndefined()
  })
})

describe('isSafeUrl', () => {
  it('godtager http- og https-adresser', () => {
    expect(isSafeUrl('https://react.dev/learn')).toBe(true)
    expect(isSafeUrl('http://localhost:5173')).toBe(true)
    expect(isSafeUrl('HTTPS://EKSEMPEL.DK')).toBe(true)
  })

  it('afviser adresser, der kan køre kode eller ikke er webadresser', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeUrl('data:text/html,<script>')).toBe(false)
    expect(isSafeUrl('mailto:a@b.dk')).toBe(false)
    expect(isSafeUrl('react.dev')).toBe(false)
    expect(isSafeUrl('https://')).toBe(false)
    expect(isSafeUrl('')).toBe(false)
  })
})
