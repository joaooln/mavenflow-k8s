import { useEffect, useRef, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`;

export function useWebSocket({ onBoardUpdate, onNotification }) {
  const ws = useRef(null);
  const subscriptions = useRef(new Set());
  const handlers = useRef({ onBoardUpdate, onNotification });
  handlers.current = { onBoardUpdate, onNotification };

  useEffect(() => {
    const token = localStorage.getItem('mavenflow_token');
    if (!token) return;

    const connect = () => {
      const socket = new WebSocket(`${WS_URL}?token=${token}`);
      ws.current = socket;

      socket.onopen = () => {
        // Re-subscribe to all tracked boards after reconnect
        subscriptions.current.forEach(boardId => {
          socket.send(JSON.stringify({ type: 'subscribe', boardId }));
        });
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'board:update') {
            handlers.current.onBoardUpdate?.(msg.boardId);
          }
          if (msg.type === 'notification') {
            handlers.current.onNotification?.(msg.notification);
          }
        } catch {}
      };

      socket.onclose = (e) => {
        // Reconnect after 3s unless intentionally closed
        if (e.code !== 1000 && e.code !== 4001) {
          setTimeout(connect, 3000);
        }
      };
    };

    connect();
    return () => {
      ws.current?.close(1000);
    };
  }, []);

  const subscribe = useCallback((boardId) => {
    subscriptions.current.add(boardId);
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'subscribe', boardId }));
    }
  }, []);

  const unsubscribe = useCallback((boardId) => {
    subscriptions.current.delete(boardId);
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'unsubscribe', boardId }));
    }
  }, []);

  return { subscribe, unsubscribe };
}
