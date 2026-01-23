'use client';

import { useState, useEffect, useCallback } from 'react';
import { socketService, TrustViolationData } from '@/lib/socket';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

interface UseSocketReturn {
  status: ConnectionStatus;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  onTrustViolation: (callback: (data: TrustViolationData) => void) => () => void;
}

export function useSocket(): UseSocketReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    // Get the underlying socket from the service
    // This is a workaround since socketService exposes limited API
    const socket = (socketService as any).socket;

    if (socket) {
      // Set initial status based on current state
      if (socket.connected) {
        setStatus('connected');
      } else if (socket.connecting) {
        setStatus('connecting');
      }

      const handleConnect = () => {
        setStatus('connected');
      };

      const handleDisconnect = () => {
        setStatus('disconnected');
      };

      const handleReconnecting = () => {
        setStatus('reconnecting');
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.io?.on('reconnect_attempt', handleReconnecting);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.io?.off('reconnect_attempt', handleReconnecting);
      };
    }

    return undefined;
  }, []);

  const connect = useCallback(() => {
    setStatus('connecting');
    socketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setStatus('disconnected');
  }, []);

  const onTrustViolation = useCallback((callback: (data: TrustViolationData) => void) => {
    return socketService.onTrustViolation(callback);
  }, []);

  return {
    status,
    isConnected: status === 'connected',
    connect,
    disconnect,
    onTrustViolation,
  };
}
