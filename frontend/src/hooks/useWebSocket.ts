import { useEffect, useRef, useState } from "react"

const defaultClientUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"
const WS_URL = defaultClientUrl.replace("http", "ws") + "/ws/tenant-events"

type WebSocketEvent = {
  type: string
  payload?: any
  tenant_id?: string
}

export function useWebSocket(onMessage?: (event: WebSocketEvent) => void) {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Only run in the browser
    if (typeof window === "undefined") return

    let isUnmounted = false

    const connect = () => {
      const token = localStorage.getItem("access_token")
      if (!token) {
        console.log("[WebSocket] No auth token found, aborting connection.")
        return
      }

      // Pass token as query parameter
      const url = new URL(WS_URL)
      url.searchParams.append("token", token)

      const ws = new WebSocket(url.toString())
      wsRef.current = ws

      ws.onopen = () => {
        if (!isUnmounted) {
          console.log("[WebSocket] Connected successfully")
          setIsConnected(true)
        }
      }

      ws.onmessage = (event) => {
        if (!isUnmounted) {
          try {
            if (event.data === "pong") return
            const data = JSON.parse(event.data) as WebSocketEvent
            console.log("[WebSocket] Message received:", data)
            if (onMessage) onMessage(data)
          } catch (err) {
            console.error("[WebSocket] Failed to parse message:", err)
          }
        }
      }

      ws.onerror = (error) => {
        if (!isUnmounted) {
          console.error("[WebSocket] Error occurred:", error)
        }
      }

      ws.onclose = (event) => {
        if (!isUnmounted) {
          console.log("[WebSocket] Connection closed", event.code, event.reason)
          setIsConnected(false)
          // Attempt to reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(connect, 3000)
        }
      }
    }

    connect()

    // Send a ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send("ping")
      }
    }, 30000)

    return () => {
      isUnmounted = true
      clearInterval(pingInterval)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Unmounting")
        wsRef.current = null
      }
    }
  }, [onMessage])

  return { isConnected }
}
