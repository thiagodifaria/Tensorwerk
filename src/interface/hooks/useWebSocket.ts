import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: 'market_update' | 'curvature_change' | 'singularities';
  data: any;
  timestamp: number;
}

interface UseWebSocketOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (msg: WebSocketMessage) => void;
  onError?: (error: Event) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (msg: any) => void;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    onMessage,
    onError
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('[WebSocket] Parse error:', error);
        }
      };

      ws.onerror = (error) => onError?.(error);

      ws.onclose = () => {
        setIsConnected(false);

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
    }
  }, [url, reconnectInterval, maxReconnectAttempts, onMessage, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((msg: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { isConnected, lastMessage, sendMessage, connect, disconnect };
}

export function useMarketDataStream(url: string) {
  const [marketData, setMarketData] = useState<any[]>([]);
  const [curvature, setCurvature] = useState<number>(0);

  const handleMessage = useCallback((msg: WebSocketMessage) => {
    switch (msg.type) {
      case 'market_update':
        setMarketData((prev: any[]) => [...prev.slice(-100), msg.data]);
        break;
      case 'curvature_change':
        setCurvature(msg.data.value);
        break;
      case 'singularities':
        console.warn('[ALERT] Singularity detected:', msg.data);
        break;
    }
  }, []);

  const ws = useWebSocket(url, { onMessage: handleMessage });

  return { ...ws, marketData, curvature };
}
