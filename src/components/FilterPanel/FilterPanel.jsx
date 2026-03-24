import SearchableSelect from '../SearchableSelect/SearchableSelect'
import './FilterPanel.css'

function FilterPanel({
  filters,
  onChange,
  onReset,
  countries,
  positions,
  tournamentTypes,
  isOpen,
  onToggle,
}) {
  return (
    <aside className="filter-panel">
      <button className="filter-panel__toggle" type="button" onClick={onToggle}>
        Filters {isOpen ? '▲' : '▼'}
      </button>

      <div className={`filter-panel__body ${isOpen ? 'filter-panel__body--open' : ''}`}>
        <div className="filter-panel__header">
          <h2>Filters</h2>
          <button className="filter-panel__reset" type="button" onClick={onReset}>
            Reset
          </button>
        </div>

        <div className="filter-panel__field">
          <SearchableSelect
            label="Country"
            value={filters.country}
            options={countries}
            placeholder="All countries"
            onChange={(value) => onChange('country', value)}
          />
        </div>

        <div className="filter-panel__field">
          <SearchableSelect
            label="Position"
            value={filters.position}
            options={positions}
            placeholder="All positions"
            onChange={(value) => onChange('position', value)}
          />
        </div>

        <div className="filter-panel__field">
          <SearchableSelect
            label="Career Tournament Type"
            value={filters.tournamentType}
            options={tournamentTypes}
            placeholder="All tournament types"
            onChange={(value) => onChange('tournamentType', value)}
          />
        </div>
      </div>
    </aside>
  )
}

export default FilterPanel
