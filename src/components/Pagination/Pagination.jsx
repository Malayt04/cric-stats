import './Pagination.css'

const createPageWindow = (currentPage, totalPages) => {
  const maxButtons = 5
  const half = Math.floor(maxButtons / 2)

  let start = Math.max(1, currentPage - half)
  let end = Math.min(totalPages, start + maxButtons - 1)

  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null
  }

  const pages = createPageWindow(currentPage, totalPages)

  return (
    <nav className="pagination" aria-label="Players pagination">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ‹ Prev
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          className={page === currentPage ? 'pagination__active' : ''}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next ›
      </button>
    </nav>
  )
}

export default Pagination
