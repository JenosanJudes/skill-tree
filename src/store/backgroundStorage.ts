/**
 * Gemmer baggrundsbilledet i IndexedDB, browserens indbyggede database.
 * localStorage kan kun gemme tekst og har plads til ca. 5 MB; IndexedDB kan
 * gemme binære data (bytes) og har meget mere plads.
 *
 * Opbygning: en database ("skill-tree") med ét "object store" ("background"),
 * som minder om en tabel. Billedet ligger under nøglen "image".
 */

const DB_NAME = 'skill-tree'
const DB_VERSION = 1
const STORE = 'background'
const KEY = 'image'

export const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]
export const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

/**
 * Det, der faktisk gemmes: billedets bytes og dets type. Bytes (ArrayBuffer)
 * kan gemmes overalt, også i testenes falske IndexedDB.
 */
type StoredImage = { type: string; data: ArrayBuffer }

/** Fejlbesked, hvis filen ikke kan bruges som baggrund, ellers null. */
export function checkBackgroundFile(file: {
  type: string
  size: number
}): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Vælg et billede i PNG, JPEG, WebP eller GIF.'
  }
  if (file.size > MAX_BYTES) {
    return 'Billedet er større end 10 MB. Vælg et mindre billede.'
  }
  return null
}

export async function saveBackground(file: Blob): Promise<void> {
  const image: StoredImage = { type: file.type, data: await file.arrayBuffer() }
  await run('readwrite', (store) => store.put(image, KEY))
}

/** Det gemte billede, eller null hvis der intet er. */
export async function loadBackground(): Promise<Blob | null> {
  const image = await run('readonly', (store) => store.get(KEY))
  if (!isStoredImage(image)) return null
  return new Blob([image.data], { type: image.type })
}

export async function clearBackground(): Promise<void> {
  await run('readwrite', (store) => store.delete(KEY))
}

/** Åbner databasen. Første gang oprettes object store'en. */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    // Kører kun, når databasen er ny (eller versionen er hævet).
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Kører én handling i en transaktion og laver IndexedDB's hændelser om til
 * et Promise. Vi venter på `oncomplete`, så data med sikkerhed er skrevet,
 * før Promise'et er færdigt. Databasen lukkes bagefter.
 */
async function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE, mode)
      const request = action(transaction.objectStore(STORE))
      transaction.oncomplete = () => resolve(request.result)
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  } finally {
    db.close()
  }
}

// Data fra databasen kommer udefra, så formen tjekkes (som validateTree).
function isStoredImage(value: unknown): value is StoredImage {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as StoredImage).type === 'string' &&
    isArrayBuffer((value as StoredImage).data)
  )
}

// `instanceof ArrayBuffer` fejler, hvis bufferen er lavet i en anden
// JavaScript-"verden" (realm), fx i testene. toString læser i stedet
// objektets indbyggede type og virker på tværs af verdener.
function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return Object.prototype.toString.call(value) === '[object ArrayBuffer]'
}
