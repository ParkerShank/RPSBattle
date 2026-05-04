import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useGameSocket } from './hooks/useGameSocket'

function Match() {
  const navigate = useNavigate()
  const { matchId } = useParams()
  const { authenticated, currentMatch, matchStatus, roundResult, send } = useGameSocket()
  const [selectedPlay, setSelectedPlay] = useState(null)

  if (!authenticated) {
    return (
      <main className="page">
        <section className="panel center">
          <h1>Match</h1>
          <p className="status status-error">You must be logged in to view a match.</p>
          <div className="menu">
            <Link className="btn btn-secondary" to="/">Go to Login</Link>
          </div>
        </section>
      </main>
    )
  }

  const match = currentMatch && `${currentMatch.matchId}` === matchId ? currentMatch : null
  const playerScore = match ? match.scores?.[match.playerId] ?? 0 : 0
  const opponentScore = match ? match.scores?.[match.opponent?.id] ?? 0 : 0

  function handlePlay(play) {
    setSelectedPlay(play)
    send({ type: 'PLAY', play })
  }

  return (
    <main className="page">
      <section className="panel center">
        <h1>Match</h1>
        {match ? (
          <>
            <p className="subtitle">Opponent: {match.opponent?.name || 'Unknown'}</p>
            <div className="score-grid">
              <div className="score-card">
                <div className="score-label">You</div>
                <div className="score-value">{playerScore ?? 0}</div>
              </div>
              <div className="score-card">
                <div className="score-label">{match.opponent?.name || 'Opponent'}</div>
                <div className="score-value">{opponentScore ?? 0}</div>
              </div>
            </div>

            <div className="choice-grid">
              {['Rock', 'Paper', 'Scissors'].map((play) => (
                <button className="btn btn-primary" key={play} type="button" onClick={() => handlePlay(play)}>
                  {play}
                </button>
              ))}
            </div>

            <div>
              {selectedPlay ? (
                <p className="status status-success">You played: {selectedPlay}</p>
              ) : (
                <p className="status status-muted">Choose your play.</p>
              )}
              {matchStatus && <p className="status status-muted"><em>{matchStatus}</em></p>}
              {roundResult && (
                <div className="result-box">
                  <p><strong>Round {roundResult.round} result:</strong></p>
                  <p>{roundResult.tie ? 'It was a tie.' : roundResult.winnerId === match.playerId ? 'You won this round!' : 'Opponent won this round.'}</p>
                  <p>Your play: {roundResult.choices[match.playerId]}</p>
                  <p>{match.opponent?.name || 'Opponent'} played: {roundResult.choices[match.opponent?.id]}</p>
                </div>
              )}
            </div>

            <div className="menu">
              <button className="btn btn-secondary" type="button" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            </div>
          </>
        ) : (
          <>
            <p className="status status-muted">Waiting for match details...</p>
            <p className="subtitle">If you were redirected too early, wait a moment or return to queue.</p>
            <div className="menu">
              <Link className="btn btn-secondary" to="/testing">Back to Queue</Link>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default Match
