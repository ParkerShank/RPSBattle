import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useGameSocket } from './hooks/useGameSocket'

const TWEMOJI = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg'
const PLAY_OPTIONS = [
  { label: 'Rock',     value: 'Rock',     img: `${TWEMOJI}/270a.svg` },
  { label: 'Paper',    value: 'Paper',    img: `${TWEMOJI}/270b.svg` },
  { label: 'Scissors', value: 'Scissors', img: `${TWEMOJI}/270c.svg` },
]

function Match() {
  const navigate = useNavigate()
  const { matchId } = useParams()
  const { authenticated, currentMatch, matchStatus, roundResult, send, resetCurrentMatch, forceBack } = useGameSocket()
  const [selectedPlay, setSelectedPlay] = useState(null)

  const [timeLeft, setTimeLeft] = useState({ seconds: 0, deciseconds: 0 })
  const timerDuration = 5000
  const endTimeRef = useRef(null)

  useEffect(() => {
    if (!currentMatch?.inProgress) return
    endTimeRef.current = Date.now() + timerDuration
    const interval = setInterval(() => {
      const remaining = endTimeRef.current - Date.now()
      if (remaining <= 0) {
        setTimeLeft({ seconds: 0, deciseconds: 0 })
        clearInterval(interval)
        return
      }
      setTimeLeft({
        seconds: Math.floor(remaining / 1000),
        deciseconds: Math.floor((remaining % 1000) / 100),
      })
    }, 100)
    return () => clearInterval(interval)
  }, [currentMatch?.inProgress, currentMatch?.round])

  useEffect(() => {
    if (forceBack) navigate('/dashboard')
  }, [forceBack, navigate])

  useEffect(() => {
    if (roundResult) setSelectedPlay(null)
  }, [roundResult])

  const match = currentMatch && `${currentMatch.id}` === matchId ? currentMatch : null
  const playerScore = match?.scores?.[match.playerId] ?? 0
  const opponentScore = match?.scores?.[match.opponent?.id] ?? 0

  const resultBoxClass = match && !match.inProgress
    ? playerScore > opponentScore ? 'result-box result-box-win'
    : playerScore < opponentScore ? 'result-box result-box-loss'
    : 'result-box result-box-tie'
    : 'result-box'

  const resultHeadline = playerScore > opponentScore ? 'You Won!'
    : playerScore < opponentScore ? 'Better luck next time.'
    : "It's a Tie!"

  function handlePlay(value) {
    setSelectedPlay(value)
    send({ type: 'PLAY', play: value })
  }

  function handleLeaveMatch() {
    if (match?.inProgress) send({ type: 'LEAVE_MATCH' })
    resetCurrentMatch()
    navigate('/dashboard')
  }

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

  return (
    <main className="page">
      <section className="panel center">
        <h1>Match #{matchId}</h1>

        {match ? (
          <>
            <p className="subtitle">vs {match.opponent?.name || 'Opponent'}</p>

            <div className={`timer${currentMatch?.inProgress && timeLeft.seconds === 0 ? ' timer-low' : ''}`}>
              {currentMatch?.inProgress
                ? `${timeLeft.seconds}.${timeLeft.deciseconds}`
                : '—'}
            </div>

            <div className="score-grid">
              <div className="score-card">
                <div className="score-label">You</div>
                <div className="score-value">{playerScore}</div>
              </div>
              <div className="score-card">
                <div className="score-label">{match.opponent?.name || 'Opponent'}</div>
                <div className="score-value">{opponentScore}</div>
              </div>
            </div>

            {match.inProgress && (
              <div className="choice-grid">
                {PLAY_OPTIONS.map(({ label, value, img }) => (
                  <button
                    key={value}
                    type="button"
                    className={`choice-btn${selectedPlay === value ? ' choice-btn-selected' : ''}`}
                    onClick={() => handlePlay(value)}
                  >
                    <img src={img} alt={label} className="choice-emoji" />
                    {label}
                  </button>
                ))}
              </div>
            )}

            {roundResult && (
              <div className="result-box" style={{ marginTop: '0.75rem' }}>
                <p>
                  <strong>Round {roundResult.round}:</strong>{' '}
                  {roundResult.tie
                    ? 'Tie round!'
                    : roundResult.winnerId === match.playerId
                    ? 'You won this round!'
                    : 'Opponent won this round.'}
                </p>
                <p style={{ marginTop: '0.4rem', fontSize: '0.88rem', color: 'var(--muted)' }}>
                  You played <strong>{roundResult.choices?.[match.playerId]}</strong>
                  {' · '}
                  Opponent played <strong>{roundResult.choices?.[match.opponent?.id]}</strong>
                </p>
              </div>
            )}

            {matchStatus && !roundResult && (
              <p className="status status-muted">{matchStatus}</p>
            )}

            {!match.inProgress && (
              <div className={resultBoxClass}>
                <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{resultHeadline}</p>
                <p style={{ marginTop: '0.35rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
                  Final — You: {playerScore} / {match.opponent?.name || 'Opponent'}: {opponentScore}
                </p>
                <div className="menu">
                  <button type="button" className="btn btn-primary" onClick={handleLeaveMatch}>
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )}

            {match.inProgress && (
              <div className="menu">
                <button type="button" className="btn btn-secondary" onClick={handleLeaveMatch}>
                  Forfeit &amp; Leave
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="status status-muted">Waiting for match details...</p>
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
