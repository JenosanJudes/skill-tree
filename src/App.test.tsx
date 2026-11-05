import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from './App'
import { STORAGE_KEY } from './store/storage'
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
})
