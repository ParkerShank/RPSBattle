import React, { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useGameSocket } from './hooks/useGameSocket'
// This component is just for testing the WebSocket connection and send function
function Conn() {
    const navigate = useNavigate()
    const location = useLocation()
    const { connected, authenticated, currentMatch, send } = useGameSocket()
    // function to send a message to the server when button is clicked
    useEffect(() => {
        if (!currentMatch?.inProgress) return
        if (location.pathname === `/match/${currentMatch.id}`) return
        navigate(`/match/${currentMatch.id}`)
    }, [currentMatch, location.pathname, navigate])

    function joinQueue() {
        if (!authenticated) {
            console.log('[CONN] Cannot join queue - not authenticated')
            return
        }
        send({ type: 'JOIN_QUEUE' })
    }
    // render the UI with connection status, input field, and buttons to navigate to other pages
    return (
                <main className="page">
                    <section className="panel center">
                        <h1>Matchmaking Queue</h1>
                        <p className="subtitle">Connect to the server and get paired with a nearby skill match.</p>

                        <p className={connected ? 'status status-success' : 'status status-muted'}>
                            Connection: {connected ? 'Connected' : 'Connecting...'}
                        </p>
                        <p className={authenticated ? 'status status-success' : 'status status-error'}>
                            Authentication: {authenticated ? 'Authenticated' : 'Not authenticated'}
                        </p>

                        <div className="menu">
                            {authenticated && <button className="btn btn-primary" onClick={joinQueue}>Join Queue</button>}
                            {authenticated && <Link className="btn btn-secondary" to="/dashboard">Dashboard</Link>}
                        </div>
                    </section>
                </main>
    )
}

export default Conn;