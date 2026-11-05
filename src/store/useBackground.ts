import { useCallback, useEffect, useState } from 'react'
import {
  clearBackground,
  loadBackground,
  saveBackground,
} from './backgroundStorage'

/**
 * Baggrundsbilledet som en midlertidig adresse (blob:...), som CSS kan vise.
 * Billedet indlæses fra IndexedDB ved start. Komponenterne bruger kun denne
 * hook; kun store/ taler med IndexedDB.
 */
export function useBackground() {
  const [url, setUrl] = useState<string | null>(null)

  // Indlæs det gemte billede én gang. `cancelled` forhindrer, at et svar, der
  // kommer efter, at komponenten er væk, alligevel sætter state.
  useEffect(() => {
    let cancelled = false
    loadBackground()
      .then((blob) => {
        if (!cancelled && blob) setUrl(URL.createObjectURL(blob))
      })
      .catch((error: unknown) => {
        console.warn('Baggrundsbilledet kunne ikke indlæses.', error)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // En blob-adresse holder billedet i hukommelsen. Når adressen skiftes ud
  // (eller komponenten forsvinder), frigives den gamle.
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  /** Gemmer billedet og viser det. Kaster en fejl, hvis det ikke kan gemmes. */
  const setBackground = useCallback(async (file: Blob) => {
    await saveBackground(file)
    setUrl(URL.createObjectURL(file))
  }, [])

  const removeBackground = useCallback(async () => {
    await clearBackground()
    setUrl(null)
  }, [])

  return { url, setBackground, removeBackground }
}
