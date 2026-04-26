import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
// Custom hook to manage WebSocket connection and provide send function
const GameSocketContext = createContext(null)
// this function creates the value for the context provider, which includes connection status and send function
function useGameSocketProviderValue() {
    //connected state to track if WebSocket is connected
  const [connected, setConnected] = useState(false)
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
      console.log('Connected!')
      setConnected(true)
    }
    socket.onclose = () => {
      console.log('Disconnected!')
      setConnected(false)
    }
    // log any messages received from server (for testing)
    socket.onmessage = (event) => {
      console.log('Server said:', event.data)
    }


    // cleanup: close socket if component unmounts
    return () => socket.close()
  }, [])  // empty array = run once on mount, never again
  // function to send a message to the server, only if connected
  const send = (payload) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload))
    }
  }
  // return the connection status and send function as the context value
  return { connected, send }
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