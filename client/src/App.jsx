import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Register from './Register'
import Login from './Login'
import Dashboard from './Dashboard'
import Conn from './Conn'
import { GameSocketProvider } from './hooks/useGameSocket'

function App() {
  return (
    // Wrap the app with GameSocketProvider to provide WebSocket functionality to all components
    <GameSocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/testing" element={<Conn />} />
        </Routes>
      </BrowserRouter>
    </GameSocketProvider>
  )
}

export default App;