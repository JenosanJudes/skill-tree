// Service worker: et lille program, browseren kører i baggrunden for appen.
// Den står mellem appen og nettet og gemmer en kopi af appens filer, så
// appen også kan åbne uden forbindelse. Træet selv ligger i localStorage og
// har ikke noget med denne fil at gøre.
//
// Filen ligger i public/, fordi den skal have en fast adresse (sw.js) og
// ikke må pakkes sammen med resten af koden.

// Skift navnet, hvis gamle kopier skal smides ud hos alle brugere.
const CACHE = 'skill-tree-v1'

self.addEventListener('install', () => {
  // Tag over med det samme i stedet for at vente på, at alle faner lukkes.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Ryd kopier fra ældre udgaver af denne fil.
      const names = await caches.keys()
      await Promise.all(
        names
          .filter((name) => name !== CACHE)
          .map((name) => caches.delete(name)),
      )
      await self.clients.claim()
    })(),
  )
})

// Siden sender en liste over de filer, den lige har hentet. Dem gemmer vi,
// så appen virker uden net allerede efter første besøg.
self.addEventListener('message', (event) => {
  const urls = event.data?.type === 'cache' ? event.data.urls : null
  if (!Array.isArray(urls)) return
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      const own = urls.filter(
        (url) => new URL(url).origin === self.location.origin,
      )
      // Én fil, der fejler, må ikke vælte resten.
      await Promise.all(own.map((url) => cache.add(url).catch(() => {})))
    })(),
  )
})

// "Nettet først": hent altid den nyeste udgave, når der er forbindelse, og
// gem den. Uden forbindelse bruges kopien. Så får man aldrig en gammel app,
// bare fordi der ligger en kopi.
self.addEventListener('fetch', (event) => {
  const request = event.request
  const sameOrigin = new URL(request.url).origin === self.location.origin
  if (request.method !== 'GET' || !sameOrigin) return

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      try {
        const response = await fetch(request)
        if (response.ok) cache.put(request, response.clone())
        return response
      } catch (error) {
        const copy =
          (await cache.match(request)) ??
          // En sidevisning uden kopi: vis appens forside i stedet.
          (request.mode === 'navigate'
            ? await cache.match(self.registration.scope)
            : undefined)
        if (copy) return copy
        throw error
      }
    })(),
  )
})
