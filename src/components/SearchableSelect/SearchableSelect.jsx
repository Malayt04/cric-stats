import { useEffect, useId, useMemo, useRef, useState } from 'react'
import './SearchableSelect.css'

function SearchableSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
  isSearchable = true,
  showDefaultOption = true,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const wrapperRef = useRef(null)
  const menuId = useId()
  const labelId = useId()

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const filteredOptions = useMemo(() => {
    if (!isSearchable || !query.trim()) {
      return options
    }

    const normalized = query.trim().toLowerCase()
    return options.filter((option) => option.toLowerCase().includes(normalized))
  }, [isSearchable, options, query])

  const allSelectable = useMemo(() => {
    return showDefaultOption ? ['', ...filteredOptions] : filteredOptions
  }, [showDefaultOption, filteredOptions])

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
      setQuery('')
      return
    }

    if (!isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        event.preventDefault()
        setIsOpen(true)
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setFocusedIndex((prev) => (prev < allSelectable.length - 1 ? prev + 1 : prev))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (focusedIndex >= 0 && focusedIndex < allSelectable.length) {
        onChange(allSelectable[focusedIndex])
        setIsOpen(false)
        setQuery('')
      }
    }
  }

  return (
    <div className="searchable-select" ref={wrapperRef}>
      <span className="searchable-select__label" id={labelId}>
        {label}
      </span>

      <div className="searchable-select__trigger">
        <input
          className="searchable-select__input-trigger"
          type="text"
          value={isOpen && isSearchable ? query : (value || '')}
          placeholder={placeholder}
          readOnly={!isSearchable}
          onClick={() => {
            setIsOpen(true)
            setFocusedIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          onChange={(event) => {
            if (!isOpen) setIsOpen(true)
            setQuery(event.target.value)
            setFocusedIndex(-1)
          }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-labelledby={labelId}
        />
        <button 
          className="searchable-select__icon" 
          type="button" 
          tabIndex={-1}
          onClick={() => {
            setIsOpen((prev) => {
              if (!prev) setFocusedIndex(-1)
              return !prev
            })
          }}
        >
          {isOpen ? '▲' : '▼'}
        </button>
      </div>

      {isOpen ? (
        <div className="searchable-select__menu" id={menuId} role="listbox" aria-labelledby={labelId}>

          {showDefaultOption ? (
            <button
              className={`searchable-select__option ${value === '' ? 'is-selected' : ''} ${
                focusedIndex === 0 ? 'is-focused' : ''
              }`}
              type="button"
              onClick={() => {
                onChange('')
                setIsOpen(false)
                setQuery('')
              }}
              onMouseEnter={() => setFocusedIndex(0)}
            >
              {placeholder}
            </button>
          ) : null}

          <div className="searchable-select__list">
            {filteredOptions.length ? (
              filteredOptions.map((option, idx) => {
                const actualIndex = showDefaultOption ? idx + 1 : idx
                return (
                  <button
                    key={option}
                    className={`searchable-select__option ${value === option ? 'is-selected' : ''} ${
                      focusedIndex === actualIndex ? 'is-focused' : ''
                    }`}
                    type="button"
                    role="option"
                    aria-selected={value === option}
                    onClick={() => {
                      onChange(option)
                      setIsOpen(false)
                      setQuery('')
                    }}
                    onMouseEnter={() => setFocusedIndex(actualIndex)}
                  >
                    {option}
                  </button>
                )
              })
            ) : (
              <p className="searchable-select__empty">No results found</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default SearchableSelect
