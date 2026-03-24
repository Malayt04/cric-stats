/**
 * Career Preload Web Worker
 *
 * Runs on a dedicated thread to silently download and cache the ~50MB career payload
 * from Sportmonks. Because this runs off the main UI thread, parsing 50MB of JSON never
 * causes the browser tab to freeze.
 *
 * Imports only from files that have zero `window` / `document` / `import.meta` usage,
 * which is a hard requirement for Web Worker compatibility.
 * All runtime config (API token, base URL, cache key) is received via postMessage.
 */

import { normalizeCareerType } from '../utils/careerUtils'
import { CACHE_TTL } from '../constants'

const DB_NAME = 'cricstats-db'
const STORE_NAME = 'cache'
const CACHE_TTL_MS = CACHE_TTL.CAREER

// ─── Minimal IndexedDB helpers (no `window` dependency) ──────────────────────

const openDb = () =>
  new Promise((resolve, reject) => {
    const request = self.indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror  = () => reject(request.error)
  })

const readRecord = async (key) => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    tx.objectStore(STORE_NAME).get(key).onsuccess = (e) => resolve(e.target.result || null)
    tx.onerror    = () => reject(tx.error)
    tx.oncomplete = () => db.close()
  })
}

const writeRecord = async (key, data) => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put({ key, data, updatedAt: Date.now() })
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror    = () => { db.close(); reject(tx.error) }
  })
}

// ─── Main handler ─────────────────────────────────────────────────────────────

self.onmessage = async ({ data: { action, apiToken, baseUrl, cacheKey } }) => {
  if (action !== 'PRELOAD_CAREER') return

  try {
    // Skip if the cache is still fresh — avoids redundant 50MB downloads
    const existing = await readRecord(cacheKey)
    if (existing && Date.now() - existing.updatedAt < CACHE_TTL_MS) {
      self.postMessage({ status: 'SKIPPED' })
      return
    }

    // Fetch the full career payload (safe here — worker thread, not UI thread)
    const response = await fetch(`${baseUrl}/players?include=career&api_token=${apiToken}`)
    if (!response.ok) throw new Error(`API error ${response.status}`)

    const { data: players = [] } = await response.json()

    // Distil 50MB into a lean { playerId: string[] } map
    const map = {}
    for (const player of players) {
      const types = new Set(
        (player.career ?? []).map((r) => normalizeCareerType(r?.type)).filter(Boolean)
      )
      map[player.id] = [...types]
    }

    await writeRecord(cacheKey, map)
    self.postMessage({ status: 'SUCCESS' })
  } catch (err) {
    self.postMessage({ status: 'ERROR', message: err.message })
  }
}
