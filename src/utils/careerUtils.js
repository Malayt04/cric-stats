/**
 * Shared career data utilities.
 *
 * This file is imported by both `src/services/sportmonks.js` (main thread)
 * and `src/workers/careerPreloadWorker.js` (worker thread).
 *
 * It must remain free of any `window`, `document`, or `import.meta` references
 * so it is safe to use inside Web Workers.
 */

/**
 * Maps a raw Sportmonks career `type` string to one of three canonical
 * UI filter categories: 'T20', 'Test', or 'ODI'.
 *
 * The API returns many variations for the same format:
 *   T20 | T20I   → 'T20'
 *   Test | Test/5day | Test/4day → 'Test'
 *   ODI         → 'ODI'
 *   Anything else → null (excluded from filtering)
 *
 * @param {string} type - Raw career type string from API
 * @returns {'T20'|'Test'|'ODI'|null}
 */
export const normalizeCareerType = (type) => {
  const t = String(type || '').toUpperCase()
  
  if (t.includes('100-BALL')) return '100-Ball'
  if (t.includes('LIST A')) return 'List A'
  // Strict precedence: Check 'Youth ODI' before 'ODI'
  if (t.includes('YOUTH ODI')) return 'Youth ODI'
  
  if (t === 'ODI' || t.includes(' ODI') || t.startsWith('ODI')) return 'ODI'
  if (t.includes('T10')) return 'T10'
  
  // Strict precedence: Check 'T20I' before general 'T20'
  if (t.includes('T20I')) return 'T20I'
  if (t.includes('T20')) return 'T20'
  
  if (t.includes('TEST')) return 'Test'
  
  return null
}
