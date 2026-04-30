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
  // useRef to hold the WebSocket instance across renders without causing re-renders
  const ws = useRef(null)
    // useEffect to establish WebSocket connection when component mounts
  useEffect(() => {
    // create WebSocket connection to server
    const socket = new WebSocket('ws://localhost:3001')
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
      } else if (data.type === 'AUTH_ERROR') {
        console.error('[WS_CLIENT] Authentication failed:', data.message)
        setAuthenticated(false)
      } else if (data.type === 'AUTH_REQUIRED') {
        console.log('[WS_CLIENT] Server requesting authentication')
        setAuthenticated(false)
      }
    }
    socket.onerror = (event) => {
      console.error('[WS_CLIENT] WebSocket error:', event)
    }

    // cleanup: close socket if component unmounts
    return () => socket.close()
  }, [authToken])  // re-establish connection if auth token changes
  // function to send a message to the server, only if connected and authenticated
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
  return { connected, authenticated, send, authToken, setAuthToken }
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