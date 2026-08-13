import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseWebSocketProps {
  onMessage: (message: any) => void;
}

export function useWebSocket({ onMessage }: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Try to use HTTPS equivalent for WS (ws/wss) based on the API URL
  const getWsUrl = () => {
    const defaultClientUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
    let wsUrl = defaultClientUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    const token = localStorage.getItem('access_token');
    return `${wsUrl}/ws/tenant-events?token=${token}`;
  };

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return; // Wait for login

    if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      const url = getWsUrl();
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setIsConnected(true);
        console.log('[WebSocket] Connected to tenant events');
        // Clear reconnect timeout if successful
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = null;
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (err) {
          console.warn('[WebSocket] Message parsing error', err);
        }
      };

      ws.current.onclose = (event) => {
        setIsConnected(false);
        console.log('[WebSocket] Disconnected', event.reason);
        // Attempt reconnect after 3 seconds if it was an abnormal close
        if (event.code !== 1000) {
          reconnectTimeout.current = setTimeout(connect, 3000);
        }
      };

      ws.current.onerror = (error) => {
        // Use warn instead of error to prevent Next.js from throwing a fatal dev overlay
        console.warn('[WebSocket] Error', error);
      };

    } catch (err) {
      console.warn('[WebSocket] Connection failed', err);
    }
  }, [onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        ws.current.close(1000, "Component unmounted");
      }
    };
  }, [connect]);

  return { isConnected };
}
