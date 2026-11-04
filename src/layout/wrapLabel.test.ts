import { describe, expect, it } from 'vitest'
import { wrapLabel } from './wrapLabel'

describe('wrapLabel', () => {
  it('lader et kort navn stå på én linje', () => {
    expect(wrapLabel('Test')).toEqual(['Test'])
  })

  it('deler et langt navn på to linjer ved et mellemrum', () => {
    expect(wrapLabel('Objektorienteret analyse og design')).toEqual([
      'Objektorienteret',
      'analyse og design',
    ])
  })

  it('forkorter et enkelt ord, der er for langt', () => {
    const [line] = wrapLabel('Superkalifragilistisk', 10)
    expect(line).toHaveLength(10)
    expect(line.endsWith('…')).toBe(true)
  })

  it('forkorter sidste linje, når der er for mange linjer', () => {
    const lines = wrapLabel(
      'en meget lang tekst der fylder for meget i en node',
    )
    expect(lines).toHaveLength(2)
    expect(lines[1].endsWith('…')).toBe(true)
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(18)
  })

  it('ignorerer ekstra mellemrum og giver ingen linjer for tom tekst', () => {
    expect(wrapLabel('  Test   navn ')).toEqual(['Test navn'])
    expect(wrapLabel('   ')).toEqual([])
  })
})
