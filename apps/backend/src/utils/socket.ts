// apps/backend/src/utils/socket.ts
import { Server as SocketIOServer } from 'socket.io';

export let ioInstance: SocketIOServer | undefined;

export function setIoInstance(io: SocketIOServer): void {
  ioInstance = io;
}
