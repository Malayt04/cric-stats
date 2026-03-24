import './SearchBar.css'

function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <span className="search-bar__icon">🔍</span>
      <input
        className="search-bar__input"
        type="text"
        placeholder="Search by last name..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value ? (
        <button className="search-bar__clear" type="button" onClick={() => onChange('')}>
          ×
        </button>
      ) : null}
    </div>
  )
}

export default SearchBar
