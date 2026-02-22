import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

export interface TrustViolationData {
  conversationId: string;
  messageId: string;
  status: 'FAIL' | 'PARTIAL';
  violations: string[];
  trustScore: number;
}

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    try {
      this.socket = io(SOCKET_URL, {
        auth: {
          token
        },
        transports: ['websocket'],
        autoConnect: true,
        connectTimeout: 5000,  // Fail fast if backend unreachable
        reconnection: true,
        reconnectionAttempts: 3,  // Reduced from 10 to fail faster
        reconnectionDelay: 500,
        reconnectionDelayMax: 2000,  // Reduced from 5000
      });
    } catch (error) {
      console.warn('Failed to initialize Socket.IO:', error);
      // Don't throw - graceful degradation if socket fails
      return;
    }

    this.socket.on('connect', () => {
      // Connection status is tracked via useSocket hook
    });

    this.socket.on('disconnect', () => {
      // Disconnection status is tracked via useSocket hook
    });

    this.socket.io.on('reconnect_attempt', () => {
      // Reconnection status is tracked via useSocket hook
    });

    this.socket.io.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after multiple attempts');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onTrustViolation(callback: (data: TrustViolationData) => void) {
    this.socket?.on('trust:violation', callback);
    return () => {
      this.socket?.off('trust:violation', callback);
    };
  }

  joinConversation(conversationId: string) {
    this.socket?.emit('join:conversation', conversationId);
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('leave:conversation', conversationId);
  }

  sendMessage(data: {
    conversationId: string;
    content: string;
    agentId?: string;
    generateResponse?: boolean;
  }) {
    this.socket?.emit('message:send', data);
  }

  onNewMessage(callback: (data: any) => void) {
    this.socket?.on('message:new', callback);
    return () => {
      this.socket?.off('message:new', callback);
    };
  }
}

export const socketService = new SocketService();
