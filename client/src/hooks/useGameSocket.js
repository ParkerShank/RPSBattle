import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
// Custom hook to manage WebSocket connection and provide send function
const GameSocketContext = createContext(null)
// this function creates the value for the context provider, which includes connection status and send function
function useGameSocketProviderValue() {
    //connected state to track if WebSocket is connected
  const [connected, setConnected] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [authToken, setAuthToken] = useState(() => {
    return localStorage.getItem('authToken') || null
  })
  const [currentUser, setCurrentUser] = useState(null)
  const [currentMatch, setCurrentMatch] = useState(null)
  const [matchStatus, setMatchStatus] = useState(null)
  const [roundResult, setRoundResult] = useState(null)
  const [forceBack, setForceBack] = useState(false)
  // the following is used for setting the client-side timer
  const [matchInProgress, setMatchInProgress] = useState(false);
  // useRef to hold the WebSocket instance across renders without causing re-renders
  const ws = useRef(null)
    // useEffect to establish WebSocket connection when component mounts
  useEffect(() => {
    // create WebSocket connection to server
    const socket = new WebSocket('ws://3.141.165.85:3000')
    // store socket in ref so we can use it in send function
    ws.current = socket
    // set up event handlers for WebSocket
    socket.onopen = () => {
      console.log('[WS_CLIENT] WebSocket opened')
      setConnected(true)
      // Send auth token immediately upon connection
      if (authToken) {
        console.log('[WS_CLIENT] Sending AUTH message with token:', authToken.substring(0, 8) + '...')
        socket.send(JSON.stringify({ type: 'AUTH', token: authToken }))
      } else {
        console.log('[WS_CLIENT] No auth token available')
      }
    }
    socket.onclose = () => {
      console.log('[WS_CLIENT] WebSocket closed')
      setConnected(false)
      setAuthenticated(false)
    }
    // log any messages received from server (for testing)
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('[WS_CLIENT] Server message:', data.type, data)
      
      if (data.type === 'AUTH_SUCCESS') {
        console.log('[WS_CLIENT] Authentication successful!')
        setAuthenticated(true)
        setCurrentUser(data.user)

      } else if (data.type === 'AUTH_ERROR') {
        console.error('[WS_CLIENT] Authentication failed:', data.message)
        setAuthenticated(false)

      } else if (data.type === 'AUTH_REQUIRED') {
        console.log('[WS_CLIENT] Server requesting authentication')
        setAuthenticated(false)

      } else if (data.type === 'MATCH_FOUND') {
        console.log('[WS_CLIENT] Match found:', data.match.id)
        setForceBack(false)
        setCurrentMatch({
          ...data.match,
          matchId: data.match.id,
          playerId: data.playerId,
          opponent: data.opponent,
        })
        setMatchStatus('Match found! Choose your play.')
        setRoundResult(null)
    
      // Added an explicit match in-progress message to implement client-side timer - wes
      } else if (data.type === 'IN_PROGRESS') {
        console.log("[WS_CLIENT] Match in progress");
        setMatchInProgress(true);

      } else if (data.type === 'PLAY_RECEIVED') {
        setMatchStatus('Play received. Waiting for the opponent.')

      } else if (data.type === 'WAITING_FOR_OPPONENT') {
        setMatchStatus(data.message || 'Waiting for the opponent to play.')

      } else if (data.type === 'ROUND_RESULT') {
        setMatchStatus(data.tie ? 'Round tied.' : 'Round complete.')
        setRoundResult(data)
        setCurrentMatch((prevMatch) => {
          if (!prevMatch || prevMatch.id !== data.matchId) return prevMatch
          return { ...prevMatch, round: data.round, scores: data.scores }
        })
      } else if (data.type === 'MATCH_ENDED' || data.type === 'MATCH_END') {
        setForceBack(false)
        setMatchStatus(data.resultMessage || 'Match ended.')
        setRoundResult(null)
        setCurrentMatch((prevMatch) => {
          if (!prevMatch || prevMatch.id !== data.matchId) return prevMatch
          return {
            ...prevMatch,
            inProgress: false,
            scores: data.scores ?? prevMatch.scores,
            winnerId: data.winnerId ?? prevMatch.winnerId,
            resultMessage: data.resultMessage ?? prevMatch.resultMessage,
            forceBackAfterMs: data.forceBackAfterMs
          }
        })
      } else if (data.type === 'FORCE_BACK_TO_DASHBOARD') {
        setMatchStatus('Match ended. Returning to dashboard...')
        setForceBack(true)
      }
 else if (data.type === 'OPPONENT_DISCONNECTED') {
        setMatchStatus('Opponent disconnected. Match ended.')
        setCurrentMatch((prevMatch) => {
          if (!prevMatch) return prevMatch
          return { ...prevMatch, inProgress: false }
        })
      }
    }
    socket.onerror = (event) => {
      console.error('[WS_CLIENT] WebSocket error:', event)
    }

    // cleanup: close socket if component unmounts
    return () => socket.close()
  }, [authToken])  // re-establish connection if auth token changes
  // function to send a message to the server, only if connected and authenticated
  const resetCurrentMatch = () => {
    setCurrentMatch(null)
    setMatchStatus(null)
    setRoundResult(null)
    setForceBack(false)
  }

  const send = (payload) => {
    if (!authenticated) {
      console.warn('[WS_CLIENT] Cannot send - not authenticated')
      return
    }
    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('[WS_CLIENT] Sending:', payload.type)
      ws.current.send(JSON.stringify(payload))
    } else {
      console.warn('[WS_CLIENT] WebSocket not open')
    }
  }
  // return the connection status and send function as the context value
  return { 
    connected,
    authenticated,
    currentUser,
    currentMatch,
    matchInProgress,
    matchStatus,
    roundResult,
    forceBack,
    send,
    authToken,
    setAuthToken,
    resetCurrentMatch }
}
// Context provider component to wrap the app and provide WebSocket functionality
export function GameSocketProvider({ children }) {
  const value = useGameSocketProviderValue()
  return React.createElement(GameSocketContext.Provider, { value }, children)
}
// Custom hook to consume the GameSocketContext and access connection status and send function
export function useGameSocket() {
  const context = useContext(GameSocketContext)
  if (!context) {
    throw new Error('useGameSocket must be used within a GameSocketProvider')
  }
  return context
}
