"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeInteraction = void 0;
const detect_1 = require("@sonate/detect");
const logger_1 = __importDefault(require("../utils/logger"));
// Initialize client (pointing to the Python Sidecar)
// In production, use process.env.RESONANCE_ENGINE_URL
const resonanceClient = new detect_1.ResonanceClient(process.env.RESONANCE_ENGINE_URL || 'http://localhost:8000');
const analyzeInteraction = async (req, res) => {
    try {
        const { user_input, ai_response, history } = req.body;
        // 1. Validation
        if (!user_input || !ai_response) {
            return res.status(400).json({ error: 'Missing required fields: user_input, ai_response' });
        }
        // 2. Health Check (Optional, but good for stability)
        const isEngineOnline = await resonanceClient.healthCheck();
        if (!isEngineOnline) {
            logger_1.default.warn('⚠️ Resonance Engine is offline. Returning fallback receipt.');
            // You could return a "Standard" non-verified receipt here if needed
            return res.status(503).json({ error: 'Resonance Engine unavailable' });
        }
        // 3. The "Heavy Lifting" - Call Python Sidecar
        logger_1.default.info(`📡 Requesting Vector Analysis for: "${user_input.substring(0, 20)}..."`);
        const receipt = await resonanceClient.generateReceipt({
            user_input,
            ai_response,
            history: history || []
        });
        // 4. (Future) Database Persistence
        // await db.receipts.create({ ...receipt, userId: req.user.id });
        // 5. Return the Trust Receipt to the Frontend
        logger_1.default.info(`✅ Receipt Minted: ${receipt.sonate_dimensions.trust_protocol}`);
        return res.json(receipt);
    }
    catch (error) {
        logger_1.default.error('❌ Interaction Analysis Failed:', error);
        return res.status(500).json({ error: 'Internal Trust Protocol Error' });
    }
};
exports.analyzeInteraction = analyzeInteraction;
