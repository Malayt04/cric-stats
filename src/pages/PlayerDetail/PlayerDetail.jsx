import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Badge from '../../components/Badge/Badge'
import Loader from '../../components/Loader/Loader'
import { fetchPlayerById } from '../../services/sportmonks'
import './PlayerDetail.css'

function StatCard({ label, value }) {
  return (
    <article className="stat-card">
      <p>{label}</p>
      <h4>{value}</h4>
    </article>
  )
}

function PlayerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const numericId = Number(id)

  const playerFromState = location.state?.player
  const [player, setPlayer] = useState(playerFromState || null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!Number.isFinite(numericId)) {
      setError('Invalid player id.')
      setIsLoading(false)
      return undefined
    }

    const controller = new AbortController()

    const loadPlayer = async () => {
      try {
        setIsLoading(true)
        setError('')
        const result = await fetchPlayerById({ id: numericId, signal: controller.signal })
        setPlayer(result)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load player details.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadPlayer()

    return () => controller.abort()
  }, [numericId])

  if (isLoading && !player) {
    return <Loader />
  }

  if (error && !player) {
    return (
      <section className="player-detail player-detail--not-found">
        <h1>{error}</h1>
        <Link className="player-detail__link" to="/">
          Back to Players
        </Link>
      </section>
    )
  }

  if (!player) {
    return (
      <section className="player-detail player-detail--not-found">
        <h1>Player not found</h1>
        <Link className="player-detail__link" to="/">
          Back to Players
        </Link>
      </section>
    )
  }

  return (
    <section className="player-detail">
      <button className="player-detail__back" type="button" onClick={() => navigate(-1)}>
        ← Back to Players
      </button>

      <div className="player-detail__hero">
        <img src={player.image} alt={player.fullName} />
        <div>
          <h1>{player.fullName}</h1>
          <div className="player-detail__meta-row">
            <span>{player.country}</span>
            <Badge label={player.position} color="blue" />
          </div>
          <p>{player.dateOfBirth}</p>
          <p>{player.gender}</p>
          <p>{player.battingStyle}</p>
          <p>{player.bowlingStyle}</p>
        </div>
      </div>

      <section className="player-detail__section">
        <h2>Career Stats</h2>
        {Object.keys(player.career || {}).length > 0 ? (
          <div className="player-detail__formats">
            {Object.keys(player.career || {}).sort().map((format) => (
              <article key={format} className="format-block">
                <h3>{format}</h3>
                <div className="format-block__grid">
                  <StatCard label="Matches" value={player.career[format].matches} />
                  <StatCard label="Runs" value={player.career[format].runs} />
                  <StatCard label="Wickets" value={player.career[format].wickets} />
                  <StatCard label="Average" value={player.career[format].average} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-sub)', fontSize: '1.1rem' }}>
            No career matches recorded.
          </p>
        )}
      </section>

      <section className="player-detail__section">
        <h2>Teams</h2>
        <div className="player-detail__teams">
          {(player.teams || []).map((team) => (
            <Badge key={team} label={team} color="gray" />
          ))}
        </div>
      </section>
    </section>
  )
}

export default PlayerDetail
