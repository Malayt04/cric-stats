import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import PlayerDetail from './pages/PlayerDetail/PlayerDetail'
import PlayersListing from './pages/PlayersListing/PlayersListing'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<PlayersListing />} />
            <Route path="/player/:id" element={<PlayerDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
