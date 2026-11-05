import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  downloadTree,
  exportFileName,
  exportTree,
  parseImport,
} from './fileTransfer'
import { makeTestTree } from './testTree'
import { findNode } from './treeUtils'

/** Testtræet med noter og links på to noder, også dybt nede. */
function treeWithNotes() {
  const tree = makeTestTree()
  const branch = tree.root.children[0]
  branch.notes = 'Grennote'
  branch.description = 'Beskrivelse bliver'
  const deep = branch.children[1].children[0]
  deep.notes = 'Dyb note'
  deep.links = [{ title: 'A', url: 'https://a.dk' }]
  return tree
}

describe('exportTree', () => {
  it('eksporterer hele træet med noter som læsbar JSON', () => {
    const tree = treeWithNotes()
    const text = exportTree(tree, true)
    expect(JSON.parse(text)).toEqual(tree)
    expect(text).toContain('\n  "formatVersion": 1') // indrykket
  })

  it('fjerner noter og links fra alle noder, men ikke beskrivelser', () => {
    const exported = JSON.parse(exportTree(treeWithNotes(), false))
    const branch = findNode(exported.root, 'branch')
    const deep = findNode(exported.root, 'deep')

    expect(branch).not.toHaveProperty('notes')
    expect(branch?.description).toBe('Beskrivelse bliver')
    expect(deep).not.toHaveProperty('notes')
    expect(deep).not.toHaveProperty('links')
  })

  it('ændrer ikke det rigtige træ', () => {
    const tree = treeWithNotes()
    const snapshot = structuredClone(tree)
    exportTree(tree, false)
    expect(tree).toEqual(snapshot)
  })

  it('giver en fil, der kan importeres igen', () => {
    const result = parseImport(exportTree(treeWithNotes(), false))
    expect(result.ok).toBe(true)
  })
})

describe('exportFileName', () => {
  it('bruger datoen med foranstillede nuller', () => {
    expect(exportFileName(new Date(2026, 0, 5))).toBe(
      'skill-tree-2026-01-05.json',
    )
  })
})

describe('parseImport', () => {
  it('godkender et gyldigt træ', () => {
    const result = parseImport(JSON.stringify(makeTestTree()))
    expect(result).toEqual({ ok: true, tree: makeTestTree() })
  })

  it('afviser tekst, der ikke er JSON', () => {
    expect(parseImport('{ ikke json')).toEqual({
      ok: false,
      errors: ['Filen er ikke gyldig JSON.'],
    })
  })

  it('afviser gyldig JSON, der ikke er et skill tree', () => {
    const result = parseImport(JSON.stringify({ formatVersion: 2 }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('downloadTree', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('laver et link med filnavnet og klikker på det', async () => {
    // jsdom har ingen createObjectURL, så vi giver den en falsk.
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:test')
    const revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL
    // Et rigtigt klik ville få jsdom til at forsøge at navigere.
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    downloadTree(makeTestTree(), true, new Date(2026, 10, 5))

    expect(click).toHaveBeenCalledTimes(1)
    const link = click.mock.contexts[0] as HTMLAnchorElement
    expect(link.download).toBe('skill-tree-2026-11-05.json')
    expect(link.href).toBe('blob:test')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')

    const blob = createObjectURL.mock.calls[0][0]
    expect(JSON.parse(await blob.text())).toEqual(makeTestTree())
  })
})
