import { useNavigate } from 'react-router-dom'
import Badge from '../Badge/Badge'
import './PlayerCard.css'

const badgeColorByPosition = {
  Batsman: 'blue',
  Bowler: 'green',
  'All-Rounder': 'amber',
  'Wicket-Keeper': 'gray',
}

function PlayerCard({ player }) {
  const navigate = useNavigate()

  return (
    <article
      className="player-card"
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/player/${player.id}`, { state: { player } })}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          navigate(`/player/${player.id}`, { state: { player } })
        }
      }}
    >
      <img className="player-card__avatar" src={player.image} alt={player.fullName} />
      <h3 className="player-card__name">{player.fullName}</h3>
      
      <div className="player-card__info">
        <p className="player-card__meta">
          <span>Country:</span> {player.country}
        </p>
        <p className="player-card__meta">
          <span>Born:</span> {player.dateOfBirth}
        </p>
      </div>

      <div className="player-card__role">
        <Badge label={player.position} color={badgeColorByPosition[player.position] || 'gray'} />
      </div>
    </article>
  )
}

export default PlayerCard
