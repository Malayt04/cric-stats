import SearchableSelect from '../SearchableSelect/SearchableSelect'
import './SortControls.css'

const sortFieldOptions = ['First Name', 'ID', 'Recently Updated']

const fieldToLabel = {
  firstName: 'First Name',
  id: 'ID',
  updatedAt: 'Recently Updated',
}

const labelToField = {
  'First Name': 'firstName',
  ID: 'id',
  'Recently Updated': 'updatedAt',
}

function SortControls({ sortConfig, onChange }) {
  return (
    <div className="sort-controls">
      <div className="sort-controls__field">
        <SearchableSelect
          label="Sort by"
          value={fieldToLabel[sortConfig.field]}
          options={sortFieldOptions}
          placeholder="Sort by"
          onChange={(selectedLabel) =>
            onChange({
              ...sortConfig,
              field: labelToField[selectedLabel] || 'firstName',
            })
          }
          isSearchable={false}
          showDefaultOption={false}
        />
      </div>

      <div className="sort-controls__direction">
        <button
          type="button"
          className={sortConfig.direction === 'asc' ? 'is-active' : ''}
          onClick={() => onChange({ ...sortConfig, direction: 'asc' })}
        >
          ↑ Asc
        </button>
        <button
          type="button"
          className={sortConfig.direction === 'desc' ? 'is-active' : ''}
          onClick={() => onChange({ ...sortConfig, direction: 'desc' })}
        >
          ↓ Desc
        </button>
      </div>
    </div>
  )
}

export default SortControls
