"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentOrchestrator = void 0;
exports.createAgentBus = createAgentBus;
function createAgentBus() {
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
class AgentOrchestrator {
    async start() {
        console.log('Mock AgentOrchestrator started');
    }
    async stop() {
        console.log('Mock AgentOrchestrator stopped');
    }
}
exports.AgentOrchestrator = AgentOrchestrator;
