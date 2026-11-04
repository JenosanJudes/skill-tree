import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SAVE_DELAY_MS, STORAGE_KEY } from './storage'
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
      <button
        onClick={() =>
          dispatch({ type: 'addNode', parentId: 'root', id: 'x', name: 'X' })
        }
      >
        Tilføj
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

  describe('autosave', () => {
    // Falske timere: vi bestemmer selv, hvornår tiden går, så testen
    // ikke skal vente rigtige 300 ms.
    afterEach(() => {
      vi.useRealTimers()
    })

    function renderAndRename() {
      vi.useFakeTimers()
      render(
        <TreeProvider initialTree={makeTestTree()}>
          <TestConsumer />
        </TreeProvider>,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Omdøb' }))
    }

    it('gemmer ikke træet, før noget er ændret', () => {
      vi.useFakeTimers()
      render(
        <TreeProvider initialTree={makeTestTree()}>
          <TestConsumer />
        </TreeProvider>,
      )
      act(() => vi.advanceTimersByTime(SAVE_DELAY_MS))
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('gemmer træet, når der har været stille i SAVE_DELAY_MS', () => {
      renderAndRename()

      act(() => vi.advanceTimersByTime(SAVE_DELAY_MS - 1))
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()

      act(() => vi.advanceTimersByTime(1))
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
      expect(saved.root.name).toBe('Nyt navn')
    })

    it('gemmer kun én gang ved flere hurtige ændringer', () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem')
      renderAndRename()
      act(() => vi.advanceTimersByTime(100))
      fireEvent.click(screen.getByRole('button', { name: 'Tilføj' }))
      act(() => vi.advanceTimersByTime(SAVE_DELAY_MS))
      expect(setItem).toHaveBeenCalledTimes(1)
    })

    it('advarer i konsollen, hvis gemningen fejler', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Lageret er fuldt')
      })
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      renderAndRename()
      act(() => vi.advanceTimersByTime(SAVE_DELAY_MS))
      expect(warn).toHaveBeenCalled()
    })
  })

  it('kaster en fejl, hvis useTree bruges uden TreeProvider', () => {
    // React skriver fejlen til konsollen; det dæmper vi, så testen er stille.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow(
      'useTree skal bruges inde i en TreeProvider.',
    )
  })
})
