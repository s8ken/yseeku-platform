export interface AgentBus {
    publish(topic: string, message: any): Promise<void>;
    subscribe(topic: string, handler: (message: any) => void): Promise<void>;
    unsubscribe(topic: string): Promise<void>;
}
export declare function createAgentBus(): AgentBus;
export declare class AgentOrchestrator {
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=agent-bus.d.ts.map