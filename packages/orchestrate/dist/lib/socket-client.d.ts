export interface SocketClient {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    emit(event: string, data: any): void;
    on(event: string, handler: (data: any) => void): void;
    off(event: string, handler: (data: any) => void): void;
}
export declare function createSocketClient(): SocketClient;
export declare const socketManager: SocketClient;
//# sourceMappingURL=socket-client.d.ts.map