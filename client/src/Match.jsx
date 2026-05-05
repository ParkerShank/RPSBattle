import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useGameSocket } from './hooks/useGameSocket'

function Match() {
  const navigate = useNavigate()
  const { matchId } = useParams()
  const { authenticated, currentMatch, matchStatus, roundResult, send, resetCurrentMatch, forceBack } = useGameSocket()
  const [selectedPlay, setSelectedPlay] = useState(null)

  // -Timer Code-
  const [timeLeft, setTimeLeft] = useState({seconds: 0, deciseconds: 0});
  const timerDuration = 5000; // ms
  const endTimeRef = useRef(null)

  useEffect(() => {
    if (!currentMatch?.inProgress) {
      return;
    }

    endTimeRef.current = Date.now() + timerDuration;

    const interval = setInterval(() => {
        const remaining = endTimeRef.current - Date.now();

        if (remaining <= 0) {
            setTimeLeft({seconds: 0, deciseconds: 0});
            clearInterval(interval);
            return;
        }

        const seconds = Math.floor(remaining / 1000);
        const deciseconds = Math.floor((remaining % 1000) / 100);

        setTimeLeft({seconds, deciseconds});
    }, 100); // 0.1 sec

    return () => clearInterval(interval);
  }, [currentMatch?.inProgress, currentMatch?.round]);
  // -Timer Code End-

  const match = currentMatch && `${currentMatch.id}` === matchId ? currentMatch : null
  const playerScore = match ? match.scores?.[match.playerId] ?? 0 : 0
  const opponentScore = match ? match.scores?.[match.opponent?.id] ?? 0 : 0
  const matchResultMessage = match?.resultMessage || matchStatus

  useEffect(() => {
    if (forceBack) {
      navigate('/dashboard')
    }
  }, [forceBack, navigate])

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

  function handlePlay(play) {
    setSelectedPlay(play)
    send({ type: 'PLAY', play })
  }

  function handleLeaveMatch() {
    if (match?.inProgress) {
      send({ type: 'LEAVE_MATCH' })
    }
    resetCurrentMatch()
    navigate('/dashboard')
  }

  return (
    <div>
      <h1>Match {matchId}</h1>
      <div>
        {currentMatch?.inProgress ? `${timeLeft.seconds}:${timeLeft.deciseconds.toString().padStart(1, "0")}` : '0:0'}
      </div>
      {match ? (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Opponent:</strong> {match.opponent?.name || 'Unknown'}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Scores</strong>
            <div>You: {playerScore ?? 0}</div>
            <div>{match.opponent?.name || 'Opponent'}: {opponentScore ?? 0}</div>
          </div>
          {match.inProgress && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {['Rock', 'Paper', 'Scissors'].map((play) => (
                <button key={play} type="button" onClick={() => handlePlay(play)}>
                  {play}
                </button>
              ))}
            </div>
          )}
          <div>
            {selectedPlay ? <p>You played: {selectedPlay}</p> : <p>Choose your play.</p>}
            {matchStatus && <p><em>{matchStatus}</em></p>}
            {roundResult && (
              <div style={{ marginTop: '1rem' }}>
                <p><strong>Round {roundResult.round} result:</strong></p>
                <p>{roundResult.tie ? 'It was a tie.' : roundResult.winnerId === match.playerId ? 'You won this round!' : 'Opponent won this round.'}</p>
                <p>Your play: {roundResult.choices[match.playerId]}</p>
                <p>{match.opponent?.name || 'Opponent'} played: {roundResult.choices[match.opponent?.id]}</p>
              </div>
            )}
          </div>
          {match && !match.inProgress && (
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
              <h3>Match Complete!</h3>
              <p><strong>Final Scores:</strong></p>
              <p>You: {playerScore}</p>
              <p>{match.opponent?.name || 'Opponent'}: {opponentScore}</p>
              <p style={{ marginTop: '1rem' }}>{matchResultMessage || (playerScore > opponentScore ? '🎉 You Won! 🎉' : playerScore < opponentScore ? 'Better luck next time!' : "It's a Tie!")}</p>
              <button
                type="button"
                onClick={handleLeaveMatch}
                style={{ marginTop: '1rem', padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
              >
                Return to Dashboard
              </button>
            </div>
          )}
          {match?.inProgress && (
            <div style={{ marginTop: '1rem' }}>
              <button
                type="button"
                onClick={handleLeaveMatch}
                style={{ padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Dashboard
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <p>Waiting for match details...</p>
          <p>If you were redirected here too early, please wait a moment or return to the queue.</p>
          <Link to="/testing">Back to Queue</Link>
        </>
      )}
    </div>
  )
}

export default Match
