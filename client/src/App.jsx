import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Register from './Register'
import Login from './Login'
import Dashboard from './Dashboard'
import Conn from './Conn'
import Match from './Match'
import { GameSocketProvider, useGameSocket } from './hooks/useGameSocket'

function MatchRedirector() {
  const { currentMatch } = useGameSocket()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!currentMatch?.id) return
    if (currentMatch.inProgress !== true) return
    if (location.pathname === `/match/${currentMatch.id}`) return

    navigate(`/match/${currentMatch.id}`)
  }, [currentMatch, location.pathname, navigate])

  return null
}

function App() {
  return (
    // Wrap the app with GameSocketProvider to provide WebSocket functionality to all components
    <GameSocketProvider>
      <BrowserRouter>
        <MatchRedirector />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/testing" element={<Conn />} />
          <Route path="/match/:matchId" element={<Match />} />
        </Routes>
      </BrowserRouter>
    </GameSocketProvider>
  )
}

export default App;
