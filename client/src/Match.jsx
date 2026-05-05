import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useGameSocket } from './hooks/useGameSocket'

function Match() {
  const navigate = useNavigate()
  const { matchId } = useParams()
  const { authenticated, currentMatch, matchStatus, roundResult, send } = useGameSocket()
  const [selectedPlay, setSelectedPlay] = useState(null)

  // -Timer Code-
  const [timeLeft, setTimeLeft] = useState({seconds: 0, deciseconds: 0});
  const timerDuration = 3000; // ms

  useEffect(() => {
    if (!currentMatch?.inProgress) {
      setTimeLeft({seconds: 0, deciseconds: 0});
      return;
    }

    setSelectedPlay(null);
    setTimeLeft({seconds: Math.floor(timerDuration / 1000), deciseconds: 0});

    const endTime = Date.now() + timerDuration;

    const interval = setInterval(() => {
        const remaining = endTime - Date.now();

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

  if (!authenticated) {
    return (
      <div>
        <h1>Match</h1>
        <p>You must be logged in to view a match.</p>
        <Link to="/">Go to Login</Link>
      </div>
    )
  }

  const match = currentMatch && `${currentMatch.id}` === matchId ? currentMatch : null
  const playerScore = match ? match.scores?.[match.playerId] ?? 0 : 0
  const opponentScore = match ? match.scores?.[match.opponent?.id] ?? 0 : 0

  function handlePlay(play) {
    setSelectedPlay(play)
    send({ type: 'PLAY', play })
  }

  return (
    <div>
      <h1>Match {matchId}</h1>
      <div>
        {`${timeLeft.seconds}:${timeLeft.deciseconds.toString().padStart(1, "0")}`}
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
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {['Rock', 'Paper', 'Scissors'].map((play) => (
              <button key={play} type="button" onClick={() => handlePlay(play)}>
                {play}
              </button>
            ))}
          </div>
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
          <div style={{ marginTop: '1rem' }}>
            <button type="button" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          </div>
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
