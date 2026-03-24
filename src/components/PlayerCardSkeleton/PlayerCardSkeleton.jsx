import './PlayerCardSkeleton.css'

function PlayerCardSkeleton() {
  return (
    <div className="player-card-skeleton" aria-hidden="true">
      <div className="player-card-skeleton__avatar"></div>
      <div className="player-card-skeleton__name"></div>
      
      <div className="player-card-skeleton__info">
        <div className="player-card-skeleton__meta"></div>
        <div className="player-card-skeleton__meta"></div>
      </div>

      <div className="player-card-skeleton__role"></div>
    </div>
  )
}

export default PlayerCardSkeleton
