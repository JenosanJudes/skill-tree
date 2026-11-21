/**
 * Tilmelder appens service worker (public/sw.js), så appen kan installeres
 * og åbne uden net. Det sker kun i den byggede app: under udvikling ville
 * gemte kopier af filerne komme i vejen for de ændringer, man lige har lavet.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  window.addEventListener('load', async () => {
    try {
      // BASE_URL er /skill-tree/ (fra vite.config.ts), så adressen passer
      // på GitHub Pages.
      await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
      const registration = await navigator.serviceWorker.ready
      // Fortæl den, hvilke filer siden lige har hentet, så de kan gemmes.
      const urls = [
        location.href,
        ...performance.getEntriesByType('resource').map((entry) => entry.name),
      ]
      registration.active?.postMessage({ type: 'cache', urls })
    } catch {
      // Uden service worker virker appen stadig, bare ikke uden net.
    }
  })
}
