"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResonanceClient = void 0;
// packages/detect/src/ResonanceClient.ts
const axios_1 = __importDefault(require("axios"));
class ResonanceClient {
    constructor(engineUrl = 'http://localhost:8000') {
        this.engineUrl = engineUrl || process.env.RESONANCE_ENGINE_URL || 'http://localhost:8000';
    }
    /**
     * Bridges the gap between Node.js and the Python Resonance Engine.
     */
    async generateReceipt(data) {
        try {
            const response = await axios_1.default.post(`${this.engineUrl}/v1/analyze`, {
                user_input: data.user_input,
                ai_response: data.ai_response,
                history: data.history || [],
            });
            return response.data;
        }
        catch (error) {
            throw new Error('Resonance Engine unavailable');
        }
    }
    async healthCheck() {
        try {
            const res = await axios_1.default.get(`${this.engineUrl}/health`);
            return res.data.status === 'operational';
        }
        catch {
            return false;
        }
    }
}
exports.ResonanceClient = ResonanceClient;
