import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Register from './Register'
import Login from './Login'
import Dashboard from './Dashboard'
import Conn from './Conn'
import Match from './Match'
import Header from './Header'
import { GameSocketProvider, useGameSocket } from './hooks/useGameSocket'
import './App.css'

function MatchRedirector() {
  const { currentMatch } = useGameSocket()
  const navigate = useNavigate()

  useEffect(() => {
    if (currentMatch?.matchId) {
      navigate(`/match/${currentMatch.matchId}`)
    }
  }, [currentMatch, navigate])

  return null
}

function App() {
  return (
    // Wrap the app with GameSocketProvider to provide WebSocket functionality to all components
    <GameSocketProvider>
      <BrowserRouter>
        <Header />
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