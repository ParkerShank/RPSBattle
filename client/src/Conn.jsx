import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGameSocket } from './hooks/useGameSocket'
// This component is just for testing the WebSocket connection and send function
function Conn() {
    const navigate = useNavigate()
    const { connected, authenticated, currentMatch, send } = useGameSocket()
    // function to send a message to the server when button is clicked
    useEffect(() => {
        if (currentMatch?.id) {
            navigate(`/match/${currentMatch.id}`)
        }
    }, [currentMatch, navigate])

    function joinQueue() {
        if (!authenticated) {
            console.log('[CONN] Cannot join queue - not authenticated')
            return
        }
        send({ type: 'JOIN_QUEUE' })
    }
    // render the UI with connection status, input field, and buttons to navigate to other pages
    return (
        <div>
            <h1>WebSocket Test</h1>
            <p>Connection: {connected ? 'Connected ✓' : 'Connecting...'}</p>
            <p>Authentication: {authenticated ? 'Authenticated ✓' : 'Not authenticated'}</p>
            <button onClick={joinQueue} disabled={!authenticated}>Join Queue</button>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <Link to="/dashboard">
                <button type="button">Dashboard</button>
              </Link>
            </div>
        </div>
    )
}

export default Conn;