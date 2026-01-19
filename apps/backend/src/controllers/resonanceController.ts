import { Request, Response } from 'express';
import { ResonanceClient } from '@sonate/detect';
import logger from '../utils/logger';

// Initialize client (pointing to the Python Sidecar)
// In production, use process.env.RESONANCE_ENGINE_URL
const resonanceClient = new ResonanceClient(process.env.RESONANCE_ENGINE_URL || 'http://localhost:8000');

export const analyzeInteraction = async (req: Request, res: Response) => {
  try {
    const { user_input, ai_response, history } = req.body;

    // 1. Validation
    if (!user_input || !ai_response) {
      return res.status(400).json({ error: 'Missing required fields: user_input, ai_response' });
    }

    // 2. Health Check (Optional, but good for stability)
    const isEngineOnline = await resonanceClient.healthCheck();
    if (!isEngineOnline) {
      logger.warn('⚠️ Resonance Engine is offline. Returning fallback receipt.');
      // You could return a "Standard" non-verified receipt here if needed
      return res.status(503).json({ error: 'Resonance Engine unavailable' });
    }

    // 3. The "Heavy Lifting" - Call Python Sidecar
    logger.info(`📡 Requesting Vector Analysis for: "${user_input.substring(0, 20)}..."`);
    const receipt = await resonanceClient.generateReceipt({
      user_input,
      ai_response,
      history: history || []
    });

    // 4. (Future) Database Persistence
    // await db.receipts.create({ ...receipt, userId: req.user.id });

    // 5. Return the Trust Receipt to the Frontend
    logger.info(`✅ Receipt Minted: ${receipt.symbi_dimensions.trust_protocol}`);
    return res.json(receipt);

  } catch (error) {
    logger.error('❌ Interaction Analysis Failed:', error);
    return res.status(500).json({ error: 'Internal Trust Protocol Error' });
  }
};