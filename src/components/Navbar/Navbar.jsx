import { NavLink } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink className="navbar__brand" to="/">
          <span className="navbar__logo">🏏</span> CricStats
        </NavLink>
      </div>
    </header>
  )
}

export default Navbar
