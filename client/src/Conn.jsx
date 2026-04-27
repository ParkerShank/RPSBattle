import React from 'react'
import { Link } from 'react-router-dom'
import { useGameSocket } from './hooks/useGameSocket'
import { useState } from 'react'
// This component is just for testing the WebSocket connection and send function
function Conn() {
    // state to hold the name input value
    const [name, setName] = useState('')
    const { connected, send } = useGameSocket()
    // function to send a message to the server when button is clicked
    function sendMessage() {
        if (!connected) return
        send({ type: 'REGISTER', name })
    }
    // render the UI with connection status, input field, and buttons to navigate to other pages
    return (
        <div>
            <h1>WebSocket Test</h1>
            <p>{connected ? 'Connected' : 'Connecting...'}</p>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
            <button onClick={sendMessage} disabled={!connected}>Send Name</button> {/* disable button if not connected */}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <Link to="/">
                <button type="button">Login</button>
              </Link>
              <Link to="/register">
                <button type="button">Register</button>
              </Link>
              <Link to="/dashboard">
                <button type="button">Dashboard</button>
              </Link>
            </div>
        </div>
    )
}

export default Conn;