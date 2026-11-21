import { useCallback, useSyncExternalStore } from 'react'

/** Smalle skærme (telefoner). Skal passe med @media-reglen i index.css. */
export const MOBILE_QUERY = '(max-width: 640px)'

/**
 * Fortæller, om en CSS media query passer lige nu, og giver besked, når det
 * ændrer sig (fx når telefonen vendes). useSyncExternalStore er Reacts måde
 * at lytte på noget uden for React. Findes matchMedia ikke (tests), er
 * svaret nej.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () =>
      typeof window.matchMedia === 'function' &&
      window.matchMedia(query).matches,
  )
}
