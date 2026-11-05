import { useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TreeProvider } from '../store/TreeContext'
import { makeTestTree } from '../store/testTree'
import { useTree } from '../store/useTree'
import type { SkillTree } from '../types/skillTree'
import { Toolbar } from './Toolbar'

let currentTree: SkillTree

function TreeSpy() {
  const { tree } = useTree()
  useEffect(() => {
    currentTree = tree
  }, [tree])
  return null
}

function renderToolbar(onImported = vi.fn()) {
  const tree = makeTestTree()
  tree.root.children[0].notes = 'Hemmelig note'
  render(
    <TreeProvider initialTree={tree}>
      <Toolbar onImported={onImported} />
      <TreeSpy />
    </TreeProvider>,
  )
  return onImported
}

/** "Vælger" en fil i den skjulte filvælger. */
function chooseFile(content: string, name = 'træ.json') {
  const file = new File([content], name, { type: 'application/json' })
  fireEvent.change(screen.getByLabelText('Vælg JSON-fil'), {
    target: { files: [file] },
  })
}

function importedTree(): SkillTree {
  const tree = makeTestTree()
  tree.root.name = 'Importeret træ'
  return tree
}

describe('Toolbar', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  describe('eksport', () => {
    function mockDownload() {
      const createObjectURL = vi.fn((_blob: Blob) => 'blob:test')
      URL.createObjectURL = createObjectURL
      URL.revokeObjectURL = vi.fn()
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
        () => {},
      )
      // Teksten i den fil, der blev "downloadet".
      return () => createObjectURL.mock.calls[0][0].text()
    }

    it('spørger, om noter skal med, og eksporterer uden noter', async () => {
      const downloadedText = mockDownload()
      renderToolbar()

      fireEvent.click(screen.getByRole('button', { name: 'Eksportér' }))
      expect(
        screen.getByText('Skal noter og links med i filen?'),
      ).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Uden noter' }))
      expect(await downloadedText()).not.toContain('Hemmelig note')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('eksporterer med noter', async () => {
      const downloadedText = mockDownload()
      renderToolbar()
      fireEvent.click(screen.getByRole('button', { name: 'Eksportér' }))
      fireEvent.click(screen.getByRole('button', { name: 'Med noter' }))
      expect(await downloadedText()).toContain('Hemmelig note')
    })

    it('kan annulleres med knappen og med Escape', () => {
      renderToolbar()
      fireEvent.click(screen.getByRole('button', { name: 'Eksportér' }))
      fireEvent.click(screen.getByRole('button', { name: 'Annullér' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Eksportér' }))
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('import', () => {
    it('beder om bekræftelse og erstatter så træet', async () => {
      const onImported = renderToolbar()
      chooseFile(JSON.stringify(importedTree()), 'backup.json')

      const dialog = await screen.findByRole('dialog', {
        name: 'Bekræft import',
      })
      expect(dialog).toHaveTextContent('Importeret træ')
      expect(dialog).toHaveTextContent('5 noder')
      expect(dialog).toHaveTextContent('backup.json')
      expect(currentTree.root.name).toBe('Rod') // ikke erstattet endnu

      fireEvent.click(screen.getByRole('button', { name: 'Erstat' }))
      expect(currentTree.root.name).toBe('Importeret træ')
      expect(onImported).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('ændrer intet, hvis man annullerer', async () => {
      const onImported = renderToolbar()
      chooseFile(JSON.stringify(importedTree()))
      await screen.findByRole('dialog', { name: 'Bekræft import' })

      fireEvent.click(screen.getByRole('button', { name: 'Annullér' }))
      expect(currentTree.root.name).toBe('Rod')
      expect(onImported).not.toHaveBeenCalled()
    })

    it('viser en fejl, hvis filen ikke er JSON', async () => {
      renderToolbar()
      chooseFile('dette er ikke json', 'noter.txt')

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('noter.txt kunne ikke importeres')
      expect(alert).toHaveTextContent('Filen er ikke gyldig JSON.')
      expect(currentTree.root.name).toBe('Rod')
    })

    it('viser valideringsfejl for et ugyldigt træ', async () => {
      renderToolbar()
      const tree = importedTree()
      tree.root.children[0].children[1].id = 'leaf-a' // dobbelt id
      chooseFile(JSON.stringify(tree))

      expect(await screen.findByRole('alert')).toHaveTextContent('leaf-a')
      expect(currentTree.root.name).toBe('Rod')
    })
  })
})
