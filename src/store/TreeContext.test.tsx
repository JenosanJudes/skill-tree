import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { STORAGE_KEY } from './storage'
import { makeTestTree } from './testTree'
import { TreeProvider } from './TreeContext'
import { useTree } from './useTree'

// En lille komponent, der viser stammens navn og kan omdøbe den.
function TestConsumer() {
  const { tree, dispatch } = useTree()
  return (
    <div>
      <p>{tree.root.name}</p>
      <button
        onClick={() =>
          dispatch({ type: 'renameNode', id: 'root', name: 'Nyt navn' })
        }
      >
        Omdøb
      </button>
    </div>
  )
}

describe('TreeContext', () => {
  // Vitest rydder ikke automatisk op efter hver test, så det gør vi selv.
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('giver komponenter adgang til træet', () => {
    render(
      <TreeProvider initialTree={makeTestTree()}>
        <TestConsumer />
      </TreeProvider>,
    )
    expect(screen.getByText('Rod')).toBeInTheDocument()
  })

  it('opdaterer komponenterne, når en handling sendes', () => {
    render(
      <TreeProvider initialTree={makeTestTree()}>
        <TestConsumer />
      </TreeProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Omdøb' }))
    expect(screen.getByText('Nyt navn')).toBeInTheDocument()
    expect(screen.queryByText('Rod')).not.toBeInTheDocument()
  })

  it('indlæser det gemte træ fra localStorage uden initialTree', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(makeTestTree()))
    render(
      <TreeProvider>
        <TestConsumer />
      </TreeProvider>,
    )
    expect(screen.getByText('Rod')).toBeInTheDocument()
  })

  it('kaster en fejl, hvis useTree bruges uden TreeProvider', () => {
    // React skriver fejlen til konsollen; det dæmper vi, så testen er stille.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow(
      'useTree skal bruges inde i en TreeProvider.',
    )
  })
})
