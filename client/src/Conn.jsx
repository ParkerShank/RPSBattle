import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useGameSocket } from './hooks/useGameSocket'

function Conn() {
  const navigate = useNavigate()
  const location = useLocation()
  const { connected, authenticated, currentMatch, send } = useGameSocket()
  const [inQueue, setInQueue] = useState(false)

  useEffect(() => {
    if (!currentMatch?.inProgress) return
    if (location.pathname === `/match/${currentMatch.id}`) return
    navigate(`/match/${currentMatch.id}`)
  }, [currentMatch, location.pathname, navigate])

  function joinQueue() {
    if (!authenticated) return
    send({ type: 'JOIN_QUEUE' })
    setInQueue(true)
  }

  function leaveQueue() {
    send({ type: 'LEAVE_QUEUE' })
    setInQueue(false)
  }

  return (
    <main className="page">
      <section className="panel center">
        <h1>Matchmaking Queue</h1>
        <p className="subtitle">Get paired with an opponent and jump into a match.</p>

        <p className={connected ? 'status status-success' : 'status status-muted'}>
          Server: {connected ? 'Connected' : 'Connecting...'}
        </p>
        <p className={authenticated ? 'status status-success' : 'status status-error'}>
          Auth: {authenticated ? 'Authenticated' : 'Not authenticated'}
        </p>

        {inQueue && (
          <>
            <p className="status status-muted" style={{ marginTop: '0.5rem' }}>
              Searching for an opponent...
            </p>
            <div className="searching-dots">
              <span /><span /><span />
            </div>
          </>
        )}

        <div className="menu">
          {authenticated && !inQueue && (
            <button className="btn btn-primary" type="button" onClick={joinQueue}>
              Find Match
            </button>
          )}
          {authenticated && inQueue && (
            <button className="btn btn-danger" type="button" onClick={leaveQueue}>
              Cancel
            </button>
          )}
          <Link className="btn btn-secondary" to="/dashboard">Dashboard</Link>
        </div>
      </section>
    </main>
  )
}

export default Conn
