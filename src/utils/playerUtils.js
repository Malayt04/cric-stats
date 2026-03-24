/**
 * Shared utility functions for manipulating the player list (filtering and sorting).
 * 
 * Grouped into one file because both operate on the same data structures and 
 * represent the same domain concern in the UI.
 */

/**
 * Client-side player filtering.
 *
 * The tournament filter relies on player.tournamentTypes being populated by
 * the career hydration step. If the user selects a tournament filter before
 * hydration completes, this correctly returns zero results until data is ready.
 *
 * @param {Array}  players
 * @param {Object} options
 * @param {string} options.searchQuery - Matches against player last name
 * @param {Object} options.filters     - { country, position, tournamentType }
 * @returns {Array} Filtered list of players
 */
export const filterPlayers = (players, { searchQuery, filters }) => {
  const query = searchQuery.trim().toLowerCase()

  return players.filter((player) => {
    if (filters.country && player.country !== filters.country) return false
    if (filters.position && player.position !== filters.position) return false
    if (filters.tournamentType && !player.tournamentTypes?.includes(filters.tournamentType)) return false
    if (query && !player.lastName.toLowerCase().includes(query)) return false
    return true
  })
}

/**
 * Sorts an array of players without mutating the original array.
 *
 * @param {Array}  players
 * @param {Object} sortConfig - { field: string, direction: 'asc' | 'desc' }
 * @returns {Array} A new sorted array of players
 */
export const sortPlayers = (players, { field, direction }) => {
  const multiplier = direction === 'asc' ? 1 : -1

  return [...players].sort((a, b) => {
    if (field === 'firstName') return a.firstName.localeCompare(b.firstName) * multiplier
    if (field === 'id')        return (a.id - b.id) * multiplier
    if (field === 'updatedAt') return (new Date(a.updatedAt) - new Date(b.updatedAt)) * multiplier
    return 0
  })
}
