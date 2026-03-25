/**
 * Application-wide constants.
 *
 * All values here are plain primitives — no imports, no side effects.
 * This file is safe to import from Web Workers (no `window` or `import.meta` usage).
 */

// ─── IndexedDB cache keys ──────────────────────────────────────────────────────
// Increment the version suffix when the cached data shape changes
// so stale records are automatically invalidated.
export const CACHE_KEYS = {
  PLAYERS:  'players_list_v1',
  COUNTRIES: 'country_map_v1',
  CAREER:   'career_tournament_map_v4',
}

// ─── Cache TTLs (ms) ───────────────────────────────────────────────────────────
export const CACHE_TTL = {
  PLAYERS:   1000 * 60 * 60 * 6,  // 6 hours  — roster updates infrequently
  COUNTRIES: 1000 * 60 * 60 * 24, // 24 hours — nearly static
  CAREER:    1000 * 60 * 60 * 6,  // 6 hours  — updated seasonally
}

// ─── Pagination ────────────────────────────────────────────────────────────────
export const PAGE_SIZE = 12

// ─── API ───────────────────────────────────────────────────────────────────────
export const REQUEST_TIMEOUT_MS = 60_000

export const TOURNAMENT_TYPES = [
  '100-Ball',
  'List A',
  'ODI',
  'T10',
  'T20',
  'T20I',
  'Test',
  'Youth ODI',
]
