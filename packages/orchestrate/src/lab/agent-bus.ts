// agent-bus.ts - Mock implementation
export interface AgentBus {
  publish(topic: string, message: any): Promise<void>;
  subscribe(topic: string, handler: (message: any) => void): Promise<void>;
  unsubscribe(topic: string): Promise<void>;
}

export function createAgentBus(): AgentBus {
  return {
    async publish(topic, message) {
      console.log(`Mock publish to ${topic}:`, message);
    },
    async subscribe(topic, handler) {
      console.log(`Mock subscribe to ${topic}`);
    },
    async unsubscribe(topic) {
      console.log(`Mock unsubscribe from ${topic}`);
    },
  };
}

// Mock AgentOrchestrator for compatibility
export class AgentOrchestrator {
  async start(): Promise<void> {
    console.log('Mock AgentOrchestrator started');
  }

  async stop(): Promise<void> {
    console.log('Mock AgentOrchestrator stopped');
  }
}
