import { IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { loadBackground, saveBackground } from './backgroundStorage'
import { useBackground } from './useBackground'

describe('useBackground', () => {
  // Typen fortæller TypeScript, at mock'en har samme signatur som den
  // rigtige funktion, så den må sættes ind i stedet for den.
  let revokeObjectURL: Mock<(url: string) => void>

  beforeEach(() => {
    // jsdom har ingen blob-adresser, så vi laver falske, der kan tælles.
    let count = 0
    URL.createObjectURL = vi.fn<(obj: Blob | MediaSource) => string>(
      () => `blob:${++count}`,
    )
    revokeObjectURL = vi.fn<(url: string) => void>()
    URL.revokeObjectURL = revokeObjectURL
  })

  afterEach(() => {
    globalThis.indexedDB = new IDBFactory()
  })

  it('starter uden billede, når intet er gemt', async () => {
    const { result } = renderHook(() => useBackground())
    // Giv indlæsningen tid til at blive færdig.
    await act(async () => {})
    expect(result.current.url).toBeNull()
  })

  it('indlæser et gemt billede ved start', async () => {
    await saveBackground(new Blob(['x'], { type: 'image/png' }))
    const { result } = renderHook(() => useBackground())
    await waitFor(() => expect(result.current.url).toBe('blob:1'))
  })

  it('gemmer et nyt billede og frigiver den gamle adresse', async () => {
    const { result } = renderHook(() => useBackground())
    await act(() =>
      result.current.setBackground(new Blob(['a'], { type: 'image/png' })),
    )
    expect(result.current.url).toBe('blob:1')

    await act(() =>
      result.current.setBackground(new Blob(['b'], { type: 'image/png' })),
    )
    expect(result.current.url).toBe('blob:2')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:1')
    expect((await loadBackground())?.size).toBe(1)
  })

  it('fjerner billedet fra visningen og databasen', async () => {
    const { result } = renderHook(() => useBackground())
    await act(() =>
      result.current.setBackground(new Blob(['a'], { type: 'image/png' })),
    )
    await act(() => result.current.removeBackground())

    expect(result.current.url).toBeNull()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:1')
    expect(await loadBackground()).toBeNull()
  })
})
