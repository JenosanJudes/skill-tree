import { IDBFactory } from 'fake-indexeddb'
import { afterEach, describe, expect, it } from 'vitest'
import {
  MAX_BYTES,
  checkBackgroundFile,
  clearBackground,
  loadBackground,
  saveBackground,
} from './backgroundStorage'

describe('checkBackgroundFile', () => {
  it('godtager almindelige billedtyper', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp', 'image/gif']) {
      expect(checkBackgroundFile({ type, size: 1000 })).toBeNull()
    }
  })

  it('afviser andre filtyper', () => {
    expect(checkBackgroundFile({ type: 'application/pdf', size: 1 })).toContain(
      'PNG',
    )
    expect(
      checkBackgroundFile({ type: 'image/svg+xml', size: 1 }),
    ).not.toBeNull()
  })

  it('afviser billeder over 10 MB', () => {
    expect(
      checkBackgroundFile({ type: 'image/png', size: MAX_BYTES + 1 }),
    ).toContain('10 MB')
  })
})

describe('backgroundStorage', () => {
  // En helt ny, tom falsk database til hver test.
  afterEach(() => {
    globalThis.indexedDB = new IDBFactory()
  })

  it('giver null, når der intet billede er gemt', async () => {
    expect(await loadBackground()).toBeNull()
  })

  it('gemmer og indlæser billedet med samme bytes og type', async () => {
    const bytes = new Uint8Array([137, 80, 78, 71])
    await saveBackground(new Blob([bytes], { type: 'image/png' }))

    const loaded = await loadBackground()
    expect(loaded?.type).toBe('image/png')
    expect(new Uint8Array(await loaded!.arrayBuffer())).toEqual(bytes)
  })

  it('erstatter et tidligere billede', async () => {
    await saveBackground(new Blob(['a'], { type: 'image/png' }))
    await saveBackground(new Blob(['bb'], { type: 'image/jpeg' }))
    const loaded = await loadBackground()
    expect(loaded?.type).toBe('image/jpeg')
    expect(loaded?.size).toBe(2)
  })

  it('fjerner billedet', async () => {
    await saveBackground(new Blob(['a'], { type: 'image/png' }))
    await clearBackground()
    expect(await loadBackground()).toBeNull()
  })
})
