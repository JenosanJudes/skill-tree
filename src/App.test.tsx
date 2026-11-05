import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from './App'
import { SAVE_DELAY_MS, STORAGE_KEY } from './store/storage'
import { makeTestTree } from './store/testTree'

describe('App', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('viser skill treet', () => {
    render(<App />)
    expect(
      screen.getByRole('group', { name: 'Skill tree' }),
    ).toBeInTheDocument()
  })

  it('åbner sidepanelet ved klik på en node og lukker det igen', () => {
    // App indlæser fra localStorage, så vi lægger testtræet der.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(makeTestTree()))
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Blad A' }))
    expect(screen.getByLabelText('Navn')).toHaveValue('Blad A')

    fireEvent.click(screen.getByRole('group', { name: 'Skill tree' }))
    expect(screen.queryByLabelText('Navn')).not.toBeInTheDocument()
  })

  it('lukker sidepanelet og viser det nye træ efter en import', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(makeTestTree()))
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Blad A' }))

    const imported = makeTestTree()
    imported.root.name = 'Nyt træ'
    const file = new File([JSON.stringify(imported)], 'nyt.json')
    fireEvent.change(screen.getByLabelText('Vælg JSON-fil'), {
      target: { files: [file] },
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Erstat' }))

    expect(screen.queryByLabelText('Navn')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nyt træ' })).toBeInTheDocument()
  })

  // Integrationstests: hele appen bruges som en bruger ville, og vi tjekker,
  // at delene (komponenter, reducer, autosave, lagring) virker sammen.
  describe('hele flowet', () => {
    afterEach(() => {
      vi.useRealTimers()
      vi.restoreAllMocks()
    })

    /** Skriver i et felt i sidepanelet og forlader det, så det gemmes. */
    function edit(label: string, value: string) {
      const field = screen.getByLabelText(label)
      fireEvent.change(field, { target: { value } })
      fireEvent.blur(field)
    }

    it('redigerer, gemmer automatisk og er der stadig efter genstart', () => {
      vi.useFakeTimers()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(makeTestTree()))
      render(<App />)

      // Omdøb, sæt niveau, skriv en note og tilføj en undernode.
      fireEvent.click(screen.getByRole('button', { name: 'Blad A' }))
      edit('Navn', 'React')
      fireEvent.click(screen.getByRole('button', { name: 'Niveau 3' }))
      edit('Noter', 'Øv hooks')
      fireEvent.click(screen.getByRole('button', { name: 'Tilføj undernode' }))
      edit('Navn', 'Hooks')

      // Autosave venter på stilhed, før den gemmer.
      act(() => vi.advanceTimersByTime(SAVE_DELAY_MS))

      // "Genstart": fjern appen helt og vis den igen fra localStorage.
      cleanup()
      render(<App />)

      expect(screen.getByRole('button', { name: 'Hooks' })).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'React' }))
      expect(screen.getByText('Niveau: 3 af 5')).toBeInTheDocument()
      expect(screen.getByLabelText('Noter')).toHaveValue('Øv hooks')
    })

    it('kan gendanne et slettet træ fra en eksporteret fil', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(makeTestTree()))
      // Fang filen, der "downloades", i stedet for at gemme den.
      const createObjectURL = vi.fn((_blob: Blob) => 'blob:eksport')
      URL.createObjectURL = createObjectURL
      URL.revokeObjectURL = vi.fn()
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
        () => {},
      )
      render(<App />)

      // Eksportér med noter.
      fireEvent.click(screen.getByRole('button', { name: 'Eksportér' }))
      fireEvent.click(screen.getByRole('button', { name: 'Med noter' }))
      const exported = createObjectURL.mock.calls[0][0]

      // Slet en gren med to klik.
      fireEvent.click(screen.getByRole('button', { name: 'Blad B' }))
      fireEvent.click(screen.getByRole('button', { name: 'Slet' }))
      fireEvent.click(screen.getByRole('button', { name: 'Er du sikker?' }))
      expect(
        screen.queryByRole('button', { name: 'Blad B' }),
      ).not.toBeInTheDocument()

      // Importér den eksporterede fil igen.
      fireEvent.change(screen.getByLabelText('Vælg JSON-fil'), {
        target: { files: [new File([exported], 'backup.json')] },
      })
      fireEvent.click(await screen.findByRole('button', { name: 'Erstat' }))

      expect(screen.getByRole('button', { name: 'Blad B' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Dyb' })).toBeInTheDocument()
    })
  })
})
