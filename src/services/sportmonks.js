import { getCachedData, setCachedData } from '../utils/indexedDbCache'
import { normalizeCareerType } from '../utils/careerUtils'
import {
  CACHE_KEYS,
  CACHE_TTL,
  REQUEST_TIMEOUT_MS,
  TOURNAMENT_TYPES,
} from '../constants'

export { CACHE_KEYS, CACHE_TTL, TOURNAMENT_TYPES }

const TOKEN = import.meta.env.VITE_SPORTMONKS_API_TOKEN
// We use a relative path purely so that Proxy/Rewrites can intercept the request.
// Locally: vite.config.js intercepts this and proxies to Sportmonks.
// Vercel (Prod): vercel.json intercepts this and rewrites to Sportmonks, completely bypassing CORS!
const BASE = '/sportmonks/api/v2.0'

/**
 * Combines an external abort signal with an internal timeout signal.
 * Falls back to a manual controller for environments that don't support
 * the newer `AbortSignal.any()` static method.
 */
const createCombinedSignal = (externalSignal, timeoutSignal) => {
  if (!externalSignal) return timeoutSignal

  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([externalSignal, timeoutSignal])
  }

  // Polyfill for environments without AbortSignal.any
  const controller = new AbortController()
  const abort = () => controller.abort()
  externalSignal.addEventListener('abort', abort, { once: true })
  timeoutSignal.addEventListener('abort', abort, { once: true })
  return controller.signal
}

/**
 * Core HTTP GET helper. Appends the API token, enforces a request timeout,
 * and combines it with any external abort signal from the caller.
 *
 * @param {string} path - API path (e.g. '/players', '/players/2?include=career')
 * @param {AbortSignal} [signal] - Optional external abort signal
 * @returns {Promise<Object>} Parsed JSON response body
 */
const get = async (path, signal) => {
  if (!TOKEN) {
    throw new Error('Missing VITE_SPORTMONKS_API_TOKEN in environment.')
  }

  const [pathname, queryString] = path.split('?')
  const url = new URL(`${BASE}${pathname}`, window.location.origin)

  new URLSearchParams(queryString).forEach((value, key) => {
    url.searchParams.set(key, value)
  })
  url.searchParams.set('api_token', TOKEN)

  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url.toString(), {
      signal: createCombinedSignal(signal, timeoutController.signal),
    })
    if (!response.ok) throw new Error(`API error ${response.status} on ${path}`)
    return response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Returns a { countryId -> countryName } map, served from IndexedDB cache
 * where possible to avoid redundant network calls on every page visit.
 */
const getCountryMap = async (signal) => {
  const cached = await getCachedData(CACHE_KEYS.COUNTRIES, CACHE_TTL.COUNTRIES)
  if (cached) return cached

  const json = await get('/countries', signal)
  const map = Object.fromEntries(
    (Array.isArray(json?.data) ? json.data : []).map((c) => [c.id, c.name])
  )

  await setCachedData(CACHE_KEYS.COUNTRIES, map)
  return map
}

/** Normalizes a raw API gender value to a human-readable string. */
const toDisplayGender = (value) => {
  const v = String(value || '').toLowerCase()
  if (v === 'm') return 'Male'
  if (v === 'f') return 'Female'
  return value || 'N/A'
}

/**
 * Converts a hyphenated API slug (e.g. 'right-arm-fast-medium')
 * into title case (e.g. 'Right Arm Fast Medium').
 */
const slugToTitle = (slug) =>
  slug
    ? slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'N/A'




/**
 * Consolidates career records per format and returns aggregated batting/bowling stats.
 * Uses `normalizeCareerType` from careerUtils to handle all API format variations.
 *
 * @param {Array} careerRecords - Raw career array from the API response.
 * @returns {{ ODI, T20, Test }} Aggregated career stats per format.
 */
const aggregateCareer = (careerRecords = []) => {
  const buckets = {
    ODI:  { matches: 0, runs: 0, wickets: 0 },
    T20:  { matches: 0, runs: 0, wickets: 0 },
    TEST: { matches: 0, runs: 0, wickets: 0 },
  }

  for (const record of careerRecords) {
    const type = normalizeCareerType(record?.type)
    const key = type === 'Test' ? 'TEST' : type
    if (!key || !buckets[key]) continue

    const batting = record?.batting || {}
    const bowling = record?.bowling || {}

    buckets[key].matches += Number(batting.matches ?? bowling.matches ?? 0) || 0
    buckets[key].runs    += Number(batting.runs_scored ?? 0) || 0
    buckets[key].wickets += Number(bowling.wickets ?? 0) || 0
  }

  const summarize = ({ matches, runs, wickets }) =>
    matches === 0
      ? { matches: '-', runs: '-', wickets: '-', average: '-' }
      : { matches, runs, wickets, average: Number((runs / matches).toFixed(2)) }

  return {
    ODI:  summarize(buckets.ODI),
    T20:  summarize(buckets.T20),
    Test: summarize(buckets.TEST),
  }
}

/** Empty career placeholder used for the player listing (career not fetched here). */
const EMPTY_CAREER = {
  ODI:  { matches: '-', runs: '-', wickets: '-', average: '-' },
  T20:  { matches: '-', runs: '-', wickets: '-', average: '-' },
  Test: { matches: '-', runs: '-', wickets: '-', average: '-' },
}

/** Normalizes a raw Sportmonks player object into our app's data shape. */
const normalizePlayer = (p, countryMap, career) => ({
  id: p.id,
  firstName: p.firstname || '',
  lastName: p.lastname || '',
  fullName: p.fullname || `${p.firstname || ''} ${p.lastname || ''}`.trim(),
  image: p.image_path || 'https://placehold.co/160x160?text=Player',
  country: countryMap[p.country_id] || 'Unknown',
  position: p.position?.name || 'Unknown',
  dateOfBirth: p.dateofbirth || 'N/A',
  gender: toDisplayGender(p.gender),
  battingStyle: slugToTitle(p.battingstyle),
  bowlingStyle: slugToTitle(p.bowlingstyle),
  updatedAt: p.updated_at || '',
  tournamentTypes: [],
  teams: [],
  career,
})

/**
 * Fetches all players from the API, hydrated with country names.
 * Returns from IndexedDB cache if the data is still fresh.
 *
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Array<Object>>}
 */
export const fetchAllPlayers = async ({ signal } = {}) => {
  const [playersJson, countryMap] = await Promise.all([
    get('/players', signal),
    getCountryMap(signal),
  ])

  return (Array.isArray(playersJson?.data) ? playersJson.data : []).map((p) =>
    normalizePlayer(p, countryMap, EMPTY_CAREER)
  )
}

/**
 * Fetches full detail for a single player including career stats and teams.
 *
 * @param {Object} options
 * @param {number|string} options.id - Sportmonks player ID
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Object>}
 */
export const fetchPlayerById = async ({ id, signal } = {}) => {
  const [playerJson, countryMap] = await Promise.all([
    get(`/players/${id}?include=career,teams`, signal),
    getCountryMap(signal),
  ])

  const p = playerJson?.data
  if (!p?.id) throw new Error('Player not found')

  const teams = Array.isArray(p.teams) ? p.teams : []
  const uniqueTeams = [
    ...new Map(teams.map((t) => [t.id, t.name]).filter(([, n]) => Boolean(n))).values(),
  ]

  const player = normalizePlayer(p, countryMap, aggregateCareer(p.career))
  player.teams = uniqueTeams
  return player
}

/**
 * Fetches all players with their career data and builds a
 * lightweight { playerId: string[] } map for the tournament filter.
 *
 * This is a heavy request (~50MB). Designed to run from a Web Worker
 * to avoid freezing the UI thread. Results are cached in IndexedDB.
 *
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Record<number, string[]>>}
 */
export const fetchCareerTournamentMap = async ({ signal } = {}) => {
  const cached = await getCachedData(CACHE_KEYS.CAREER, CACHE_TTL.CAREER)
  if (cached) return cached

  const json = await get('/players?include=career', signal)
  const players = Array.isArray(json?.data) ? json.data : []

  const map = {}
  for (const player of players) {
    const types = new Set(
      (Array.isArray(player.career) ? player.career : [])
        .map((r) => normalizeCareerType(r?.type))
        .filter(Boolean)
    )
    map[player.id] = [...types]
  }

  await setCachedData(CACHE_KEYS.CAREER, map)
  return map
}
