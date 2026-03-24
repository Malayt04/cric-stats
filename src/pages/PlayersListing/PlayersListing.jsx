import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import FilterPanel from '../../components/FilterPanel/FilterPanel'
import Pagination from '../../components/Pagination/Pagination'
import PlayerCard from '../../components/PlayerCard/PlayerCard'
import PlayerCardSkeleton from '../../components/PlayerCardSkeleton/PlayerCardSkeleton'
import SearchBar from '../../components/SearchBar/SearchBar'
import SortControls from '../../components/SortControls/SortControls'
import {
  CACHE_KEYS,
  CACHE_TTL,
  PAGE_SIZE,
  TOURNAMENT_TYPES,
} from '../../constants'
import {
  fetchAllPlayers,
  fetchCareerTournamentMap,
} from '../../services/sportmonks'
import { getCachedData, setCachedData } from '../../utils/indexedDbCache'
import { filterPlayers, sortPlayers } from '../../utils/playerUtils'
import './PlayersListing.css'

function PlayersListing() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [players, setPlayers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isHydratingCareer, setIsHydratingCareer] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [error, setError] = useState('')

  // The raw search input is kept in local state to allow fast typing.
  // It's debounced before being written to the URL so we don't spam history entries.
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const debouncedSearch = searchParams.get('search') || ''

  // All filter, sort, and pagination state lives in the URL so that:
  //  - Specific views can be bookmarked or shared.
  //  - Browser back/forward buttons restore the correct state.
  const currentPage = parseInt(searchParams.get('page'), 10) || 1

  const filters = useMemo(() => ({
    country:        searchParams.get('country') || '',
    position:       searchParams.get('position') || '',
    tournamentType: searchParams.get('tournamentType') || '',
  }), [searchParams])

  const sortConfig = useMemo(() => ({
    field:     searchParams.get('sortField') || 'firstName',
    direction: searchParams.get('sortDir') || 'asc',
  }), [searchParams])

  // Whether the per-player career data has been merged into `players` state.
  const [isCareerHydrated, setIsCareerHydrated] = useState(false)

  // ── Debounce search input → URL ────────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => {
      setSearchParams((prev) => {
        if ((prev.get('search') || '') === searchInput) return prev
        if (searchInput) prev.set('search', searchInput)
        else prev.delete('search')
        prev.set('page', '1')
        return prev
      }, { replace: true })
    }, 300)
    return () => clearTimeout(id)
  }, [searchInput, setSearchParams])

  // ── Initial player list fetch ──────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      // Serve from IndexedDB if still fresh — avoids spinner on back navigation
      const cached = await getCachedData(CACHE_KEYS.PLAYERS, CACHE_TTL.PLAYERS)
      if (cached) {
        setPlayers(cached)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError('')
        const result = await fetchAllPlayers({ signal: controller.signal })
        setPlayers(result)
        await setCachedData(CACHE_KEYS.PLAYERS, result)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load players.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [])

  // ── On-demand career hydration (only when tournament filter is active) ─────
  // The Web Worker pre-caches this data in the background, so by the time the
  // user clicks a tournament filter the data is usually already in IndexedDB.
  useEffect(() => {
    if (!filters.tournamentType || isCareerHydrated || players.length === 0) return

    const controller = new AbortController()

    const hydrate = async () => {
      try {
        setIsHydratingCareer(true)
        const map = await fetchCareerTournamentMap({ signal: controller.signal })
        setPlayers((prev) =>
          prev.map((player) => ({ ...player, tournamentTypes: map[player.id] || [] }))
        )
        setIsCareerHydrated(true)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load career data.')
        }
      } finally {
        setIsHydratingCareer(false)
      }
    }

    hydrate()
    return () => controller.abort()
  }, [filters.tournamentType, isCareerHydrated, players.length])

  // ── Background career pre-fetch via Web Worker ─────────────────────────────
  // Starts immediately on mount so that career data is already cached in IndexedDB
  // by the time the user interacts with the tournament filter.
  useEffect(() => {
    const worker = new Worker(
      new URL('../../workers/careerPreloadWorker.js', import.meta.url),
      { type: 'module' }
    )

    worker.postMessage({
      action:   'PRELOAD_CAREER',
      apiToken: import.meta.env.VITE_SPORTMONKS_API_TOKEN,
      // In Vercel, the origin receives the request and vercel.json proxies it to the exact URL.
      baseUrl: `${window.location.origin}/sportmonks/api/v2.0`,
      cacheKey: CACHE_KEYS.CAREER,
    })

    worker.onmessage = ({ data }) => {
      if (data.status === 'SUCCESS') {
        // eslint-disable-next-line no-console
        console.info('✅ Career data pre-fetched & cached by Web Worker.')
      } else if (data.status === 'SKIPPED') {
        // eslint-disable-next-line no-console
        console.info('⚡ Worker: IndexedDB cache is fresh — skipped fetch.')
      } else if (data.status === 'ERROR') {
        // eslint-disable-next-line no-console
        console.warn('⚠️ Career preload worker error:', data.message)
      }
    }

    return () => worker.terminate()
  }, [])

  // ── Derived data ───────────────────────────────────────────────────────────

  const countryOptions = useMemo(
    () => [...new Set(players.map((p) => p.country).filter(Boolean))].sort(),
    [players]
  )

  const positionOptions = useMemo(
    () => [...new Set(players.map((p) => p.position).filter(Boolean))].sort(),
    [players]
  )

  const filteredPlayers = useMemo(
    () => filterPlayers(players, { searchQuery: debouncedSearch, filters }),
    [players, debouncedSearch, filters]
  )

  const sortedPlayers = useMemo(
    () => sortPlayers(filteredPlayers, sortConfig),
    [filteredPlayers, sortConfig]
  )

  const totalPages = Math.max(1, Math.ceil(sortedPlayers.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedPlayers = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE
    return sortedPlayers.slice(start, start + PAGE_SIZE)
  }, [safeCurrentPage, sortedPlayers])

  // ── URL update helpers ─────────────────────────────────────────────────────

  const handleFilterChange = (key, value) => {
    setSearchParams((prev) => {
      if (value) prev.set(key, value)
      else prev.delete(key)
      prev.set('page', '1')
      return prev
    })
  }

  const handleSortChange = (nextSort) => {
    setSearchParams((prev) => {
      prev.set('sortField', nextSort.field)
      prev.set('sortDir', nextSort.direction)
      prev.set('page', '1')
      return prev
    })
  }

  const resetFilters = () => {
    setSearchParams((prev) => {
      prev.delete('country')
      prev.delete('position')
      prev.delete('tournamentType')
      prev.set('page', '1')
      return prev
    })
  }

  const handlePageChange = (page) => {
    setSearchParams((prev) => { prev.set('page', String(page)); return prev })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isContentLoading = isLoading || isHydratingCareer

  return (
    <section className="players-page">
      <header className="players-page__header">
        <h1>Cricket Players</h1>
        <p>Explore players by country, role, and tournament type.</p>
      </header>

      <div className="players-page__layout">
        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onReset={resetFilters}
          countries={countryOptions}
          positions={positionOptions}
          tournamentTypes={TOURNAMENT_TYPES}
          isOpen={isFilterOpen}
          onToggle={() => setIsFilterOpen((prev) => !prev)}
        />

        <div className="players-page__content">
          <div className="players-page__controls">
            <SearchBar value={searchInput} onChange={setSearchInput} />
            <SortControls sortConfig={sortConfig} onChange={handleSortChange} />
          </div>

          {!isContentLoading && (
            <p className="players-page__count">
              Showing {paginatedPlayers.length} of {sortedPlayers.length} matching players
            </p>
          )}

          {isContentLoading ? (
            <div className="players-page__grid">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <PlayerCardSkeleton key={i} />
              ))}
            </div>
          ) : error && sortedPlayers.length === 0 ? (
            <div className="players-page__error">{error}</div>
          ) : paginatedPlayers.length ? (
            <>
              {error && <div className="players-page__warning">{error}</div>}
              <div className="players-page__grid">
                {paginatedPlayers.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            </>
          ) : (
            <div className="players-page__empty">No players match the selected criteria.</div>
          )}

          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </section>
  )
}

export default PlayersListing
