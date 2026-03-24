/**
 * Lightweight IndexedDB cache with TTL-based expiry.
 *
 * Used to persist large API payloads (players list, country map, career map)
 * across sessions, significantly reducing repeat network usage.
 */

const DB_NAME = 'cricstats-db'
const DB_VERSION = 1
const STORE_NAME = 'cache'

// Fallback memory cache for strict privacy environments or incognito modes
// where IndexedDB is completely blocked by the browser.
const memoryFallback = new Map()

/** Opens (and upgrades if needed) the IndexedDB database, returning the db handle. */
const openDb = () =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available in this environment.'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror  = () => reject(request.error)
  })

/**
 * Reads a single cache record by key. Returns null if not found.
 * Always closes the database connection after the transaction.
 */
const readRecord = async (key) => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    tx.objectStore(STORE_NAME).get(key).onsuccess = (e) => resolve(e.target.result || null)
    tx.onerror    = () => reject(tx.error)
    tx.oncomplete = () => db.close()
    tx.onabort    = () => db.close()
  })
}

/**
 * Retrieves data from the cache, returning null if the record is missing or expired.
 *
 * @param {string} key
 * @param {number} maxAgeMs - Maximum acceptable age of the record in milliseconds
 * @returns {Promise<any|null>}
 */
export const getCachedData = async (key, maxAgeMs) => {
  try {
    const record = await readRecord(key)
    if (!record || Date.now() - record.updatedAt > maxAgeMs) return null
    return record.data
  } catch {
    // If IndexedDB fails (e.g. Incognito), check memory fallback before triggering network
    const memRecord = memoryFallback.get(key)
    if (!memRecord || Date.now() - memRecord.updatedAt > maxAgeMs) return null
    return memRecord.data
  }
}

/**
 * Writes a single cache record by key.
 * Always closes the database connection after the transaction.
 */
const writeRecord = async (key, data) => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put({ key, data, updatedAt: Date.now() })
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror    = () => { db.close(); reject(tx.error) }
    tx.onabort    = () => { db.close(); reject(tx.error) }
  })
}

/**
 * Persists data to the cache with the current timestamp.
 * Write failures are silently swallowed to avoid disrupting the UI.
 *
 * @param {string} key
 * @param {any}    data
 * @returns {Promise<void>}
 */
export const setCachedData = async (key, data) => {
  try {
    await writeRecord(key, data)
  } catch {
    // If IndexedDB write is blocked, gracefully fall back to in-memory caching
    memoryFallback.set(key, { data, updatedAt: Date.now() })
  }
}
