'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Alert } from '../AlertFeed';

interface UseWebSocketAlertsReturn {
  alerts: Alert[];
  isConnected: boolean;
  subscribe: (agentDids: string[], alertTypes: string[]) => void;
  unsubscribe: (agentDids: string[]) => void;
}

export const useWebSocketAlerts = (autoConnect = true): UseWebSocketAlertsReturn => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    // Connect to WebSocket server
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    const newSocket = io(wsUrl.replace('ws://', 'http://'), {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    });

    newSocket.on('alert', (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev.slice(0, 999)]);
    });

    newSocket.on('subscribed', (data) => {
      console.log('Subscribed to alerts:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [autoConnect]);

  const subscribe = useCallback(
    (agentDids: string[], alertTypes: string[]) => {
      if (socket && isConnected) {
        socket.emit('subscribe', {
          agentDids,
          alertTypes,
        });
      }
    },
    [socket, isConnected]
  );

  const unsubscribe = useCallback(
    (agentDids: string[]) => {
      if (socket && isConnected) {
        socket.emit('unsubscribe', {
          agentDids,
        });
      }
    },
    [socket, isConnected]
  );

  return {
    alerts,
    isConnected,
    subscribe,
    unsubscribe,
  };
};
