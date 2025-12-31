// socket-client.ts - Mock implementation
export interface SocketClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  emit(event: string, data: any): void;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
}

export function createSocketClient(): SocketClient {
  return {
    async connect() {
      console.log('Mock socket connected');
    },
    async disconnect() {
      console.log('Mock socket disconnected');
    },
    emit(event, data) {
      console.log(`Mock emit ${event}:`, data);
    },
    on(event, handler) {
      console.log(`Mock listener for ${event}`);
    },
    // @ts-ignore
    off(event, handler) {
      console.log(`Mock off for ${event}`);
    }
  };
}

export const socketManager = createSocketClient();