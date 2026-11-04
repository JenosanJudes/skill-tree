import { useEffect, useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TreeProvider } from '../store/TreeContext'
import { makeTestTree } from '../store/testTree'
import { findNode } from '../store/treeUtils'
import { useTree } from '../store/useTree'
import type { SkillNode, SkillTree } from '../types/skillTree'
import { SidePanel } from './SidePanel'

// Det seneste træ, så testene kan se, hvad panelet har ændret.
let currentTree: SkillTree

function TreeSpy() {
  const { tree } = useTree()
  useEffect(() => {
    currentTree = tree
  }, [tree])
  return null
}

// Holder valget i state, ligesom App gør.
function Harness({ initialId }: { initialId: string | null }) {
  const [selectedId, setSelectedId] = useState(initialId)
  return (
    <>
      <SidePanel selectedId={selectedId} onSelect={setSelectedId} />
      <p data-testid="selected">{selectedId ?? 'ingen'}</p>
    </>
  )
}

function renderPanel(initialId: string | null) {
  return render(
    <TreeProvider initialTree={makeTestTree()}>
      <Harness initialId={initialId} />
      <TreeSpy />
    </TreeProvider>,
  )
}

function node(id: string): SkillNode | undefined {
  return findNode(currentTree.root, id)
}

/** Skriver i et felt og forlader det, så ændringen gemmes. */
function typeAndBlur(label: string, value: string) {
  const field = screen.getByLabelText(label)
  fireEvent.change(field, { target: { value } })
  fireEvent.blur(field)
}

describe('SidePanel', () => {
  afterEach(cleanup)

  it('vises ikke, når ingen node er valgt', () => {
    renderPanel(null)
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('viser navnet på den valgte node', () => {
    renderPanel('leaf-a')
    expect(screen.getByLabelText('Navn')).toHaveValue('Blad A')
    expect(screen.getByText('Færdighed')).toBeInTheDocument()
  })

  describe('tekstfelter', () => {
    it('omdøber noden, når feltet forlades', () => {
      renderPanel('leaf-a')
      typeAndBlur('Navn', 'React')
      expect(node('leaf-a')?.name).toBe('React')
    })

    it('gemmer ikke, mens man skriver', () => {
      renderPanel('leaf-a')
      fireEvent.change(screen.getByLabelText('Navn'), {
        target: { value: 'Rea' },
      })
      expect(node('leaf-a')?.name).toBe('Blad A')
    })

    it('gemmer navnet, når man trykker Enter', () => {
      renderPanel('leaf-a')
      const field = screen.getByLabelText('Navn')
      field.focus()
      fireEvent.change(field, { target: { value: 'React' } })
      fireEvent.keyDown(field, { key: 'Enter' })
      expect(node('leaf-a')?.name).toBe('React')
    })

    it('sætter et tomt navn tilbage til det gamle', () => {
      renderPanel('leaf-a')
      typeAndBlur('Navn', '   ')
      expect(screen.getByLabelText('Navn')).toHaveValue('Blad A')
      expect(node('leaf-a')?.name).toBe('Blad A')
    })

    it('fortryder med Escape', () => {
      renderPanel('leaf-a')
      const field = screen.getByLabelText('Navn')
      fireEvent.change(field, { target: { value: 'Noget andet' } })
      fireEvent.keyDown(field, { key: 'Escape' })
      expect(field).toHaveValue('Blad A')
      // Escape fortrød kun feltet; panelet er stadig åbent.
      expect(screen.getByRole('complementary')).toBeInTheDocument()
    })

    it('gemmer beskrivelse og noter', () => {
      renderPanel('leaf-a')
      typeAndBlur('Beskrivelse', 'Kan bygge komponenter')
      typeAndBlur('Noter', 'Øv hooks')
      expect(node('leaf-a')?.description).toBe('Kan bygge komponenter')
      expect(node('leaf-a')?.notes).toBe('Øv hooks')
    })
  })

  describe('niveau og farve', () => {
    it('sætter niveau ved klik og nulstiller ved klik på samme cirkel', () => {
      renderPanel('leaf-a')
      fireEvent.click(screen.getByRole('button', { name: 'Niveau 4' }))
      expect(node('leaf-a')?.level).toBe(4)
      expect(screen.getByText('Niveau: 4 af 5')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Niveau 4' }))
      expect(node('leaf-a')?.level).toBe(0)
      expect(screen.getByText('Niveau: ikke låst op')).toBeInTheDocument()
    })

    it('markerer cirklerne op til niveauet', () => {
      renderPanel('leaf-b') // niveau 2
      expect(screen.getByRole('button', { name: 'Niveau 2' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(screen.getByRole('button', { name: 'Niveau 3' })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
    })

    it('viser farve men ikke niveau på en hovedgren', () => {
      renderPanel('branch')
      expect(screen.queryByText(/^Niveau/)).not.toBeInTheDocument()
      fireEvent.change(screen.getByLabelText('Farve'), {
        target: { value: '#00ff88' },
      })
      expect(node('branch')?.color).toBe('#00ff88')
    })

    it('viser hverken farve eller niveau på stammen', () => {
      renderPanel('root')
      expect(screen.queryByLabelText('Farve')).not.toBeInTheDocument()
      expect(screen.queryByText(/^Niveau/)).not.toBeInTheDocument()
    })
  })

  describe('links', () => {
    function addLink(title: string, url: string) {
      fireEvent.change(screen.getByLabelText('Linkets titel'), {
        target: { value: title },
      })
      fireEvent.change(screen.getByLabelText('Linkets adresse'), {
        target: { value: url },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Tilføj link' }))
    }

    it('tilføjer et link, der åbner sikkert i en ny fane', () => {
      renderPanel('leaf-a')
      addLink('React-docs', 'https://react.dev')

      const link = screen.getByRole('link', { name: 'React-docs' })
      expect(link).toHaveAttribute('href', 'https://react.dev')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      // Formularen tømmes efter et link er tilføjet.
      expect(screen.getByLabelText('Linkets adresse')).toHaveValue('')
    })

    it('afviser en adresse uden http eller https', () => {
      renderPanel('leaf-a')
      addLink('Farligt', 'javascript:alert(1)')
      expect(screen.getByRole('alert')).toHaveTextContent('http://')
      expect(node('leaf-a')?.links).toBeUndefined()
    })

    it('sletter et link', () => {
      renderPanel('leaf-a')
      addLink('A', 'https://a.dk')
      fireEvent.click(screen.getByRole('button', { name: 'Slet link A' }))
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
      expect(node('leaf-a')?.links).toBeUndefined()
    })
  })

  describe('tilføj og slet', () => {
    it('tilføjer en undernode og vælger den med fokus i navnet', () => {
      renderPanel('leaf-a')
      fireEvent.click(screen.getByRole('button', { name: 'Tilføj undernode' }))

      const nameField = screen.getByLabelText('Navn')
      expect(nameField).toHaveValue('Ny færdighed')
      expect(nameField).toHaveFocus()
      expect(node('leaf-a')?.children).toHaveLength(1)
    })

    it('tilføjer en hovedgren fra stammen', () => {
      renderPanel('root')
      fireEvent.click(screen.getByRole('button', { name: 'Tilføj hovedgren' }))
      expect(screen.getByLabelText('Navn')).toHaveValue('Ny gren')
      expect(screen.getByText('Hovedgren')).toBeInTheDocument()
    })

    it('sletter først efter to klik og lukker så panelet', () => {
      renderPanel('leaf-b')
      fireEvent.click(screen.getByRole('button', { name: 'Slet' }))
      expect(node('leaf-b')).toBeDefined()

      fireEvent.click(screen.getByRole('button', { name: 'Er du sikker?' }))
      expect(node('leaf-b')).toBeUndefined()
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    })

    it('fortryder sletning, når knappen mister fokus', () => {
      renderPanel('leaf-b')
      fireEvent.click(screen.getByRole('button', { name: 'Slet' }))
      fireEvent.blur(screen.getByRole('button', { name: 'Er du sikker?' }))
      expect(screen.getByRole('button', { name: 'Slet' })).toBeInTheDocument()
    })

    it('har ingen slet-knap på stammen', () => {
      renderPanel('root')
      expect(
        screen.queryByRole('button', { name: 'Slet' }),
      ).not.toBeInTheDocument()
    })
  })

  describe('lukning', () => {
    it('lukker med lukkeknappen', () => {
      renderPanel('leaf-a')
      fireEvent.click(screen.getByRole('button', { name: 'Luk panel' }))
      expect(screen.getByTestId('selected')).toHaveTextContent('ingen')
    })

    it('lukker med Escape', () => {
      renderPanel('leaf-a')
      fireEvent.keyDown(screen.getByLabelText('Navn'), { key: 'Escape' })
      expect(screen.getByTestId('selected')).toHaveTextContent('ingen')
    })
  })
})
