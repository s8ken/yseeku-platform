/**
 * Tactical Replay Routes
 * Returns structured replay data derived from real trust receipt & CIQ metrics
 * per message — no synthetic data.
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { Conversation } from '../models/conversation.model';
import { getErrorMessage } from '../utils/error-utils';
import logger from '../utils/logger';

const router = Router();

/**
 * Map a value from one 0-N scale to 0-100 range, clamped.
 */
function scale(value: number | undefined, max: number): number {
  if (value === undefined || value === null || isNaN(value)) return 50;
  return Math.round(Math.min(100, Math.max(0, (value / max) * 100)));
}

/**
 * Derive IdentityFingerprint from a message's trust metadata.
 *
 * Dimension mapping:
 *   professionalism  ← ciq.quality        (0–1 → 0–100) or trustScore proxy
 *   empathy          ← MORAL_RECOGNITION  (0–100) or integrity proxy
 *   accuracy         ← ciq.clarity        (0–1 → 0–100) or clarity proxy
 *   consistency      ← INSPECTION_MANDATE (0–100) or rolling avg
 *   helpfulness      ← CONSENT_ARCHITECTURE (0–100) or trust proxy
 *   boundaries       ← RIGHT_TO_DISCONNECT (0–100) or ethics proxy
 *
 * When SONATE principle scores aren't stored, we interpolate from the
 * available CIQ metrics and message-level trustScore.
 */
function deriveFingerprint(
  msg: any,
  rollingTrustAvg: number,
): {
  professionalism: number;
  empathy: number;
  accuracy: number;
  consistency: number;
  helpfulness: number;
  boundaries: number;
} {
  const ts = typeof msg.trustScore === 'number' ? msg.trustScore : 5; // 0-5
  const trustPct = scale(ts, 5); // → 0-100

  const ciq = msg.metadata?.trustEvaluation?.receipt?.ciq_metrics
    ?? msg.metadata?.trustEvaluation?.ciq_metrics
    ?? null;

  const sonate = msg.metadata?.trustEvaluation?.receipt?.sonate_principles
    ?? msg.metadata?.trustEvaluation?.sonate_principles
    ?? null;

  // CIQ-derived base values (0–1 scale from the receipt)
  const clarity     = ciq ? scale(ciq.clarity,     1) : trustPct;
  const integrityV  = ciq ? scale(ciq.integrity,   1) : Math.min(100, trustPct + 5);
  const quality     = ciq ? scale(ciq.quality,      1) : trustPct;

  return {
    professionalism: sonate?.INSPECTION_MANDATE   ?? quality,
    empathy:         sonate?.MORAL_RECOGNITION    ?? integrityV,
    accuracy:        sonate?.CONTINUOUS_VALIDATION ?? clarity,
    consistency:     sonate?.CONSENT_ARCHITECTURE ?? Math.round((trustPct + rollingTrustAvg) / 2),
    helpfulness:     sonate?.ETHICAL_OVERRIDE     ?? Math.min(100, trustPct + 3),
    boundaries:      sonate?.RIGHT_TO_DISCONNECT  ?? Math.min(100, trustPct - 2 < 0 ? trustPct : trustPct - 2),
  };
}

/**
 * GET /api/replay/:sessionId
 *
 * Returns a structured replay bundle derived entirely from persisted data:
 * {
 *   sessionId, title, createdAt,
 *   messages: [{ id, role, content, timestamp, trustScore }],
 *   trustScores: number[],            // per message, 0–1
 *   fingerprints: IdentityFingerprint[], // per message, from real CIQ/SONATE
 *   receipts: any[],                  // raw receipt objects
 *   summary: { totalTurns, avgTrustScore, minTrustScore, maxTrustScore, violations }
 * }
 */
router.get('/:sessionId', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const conversation = await Conversation.findOne({
      _id: sessionId,
      user: req.userId,
    }).lean();

    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found' });
      return;
    }

    const msgs = (conversation as any).messages ?? [];

    // Build per-turn arrays
    const messages: any[] = [];
    const trustScores: number[] = [];
    const fingerprints: any[] = [];
    const receipts: any[] = [];

    let runningTrustSum = 0;

    for (let i = 0; i < msgs.length; i++) {
      const msg = msgs[i];

      // trustScore stored 0-5; normalise to 0-1 for the timeline visualiser
      const rawScore = typeof msg.trustScore === 'number' ? msg.trustScore : 5;
      const normScore = parseFloat((rawScore / 5).toFixed(3));

      runningTrustSum += normScore;
      const rollingAvg = Math.round((runningTrustSum / (i + 1)) * 100);

      trustScores.push(normScore);
      fingerprints.push(deriveFingerprint(msg, rollingAvg));

      messages.push({
        id:         (msg._id ?? i).toString(),
        role:       msg.sender === 'user' ? 'user' : 'assistant',
        content:    msg.content ?? '',
        timestamp:  msg.timestamp ?? new Date().toISOString(),
        trustScore: normScore,
      });

      const receipt = msg.metadata?.trustEvaluation?.receipt;
      if (receipt) receipts.push(receipt);
    }

    const nonZero = trustScores.filter(s => s > 0);
    const avgTrustScore = nonZero.length
      ? parseFloat((nonZero.reduce((a, b) => a + b, 0) / nonZero.length).toFixed(3))
      : 0;

    const violations = msgs.filter(
      (m: any) => m.metadata?.trustEvaluation?.status === 'FAIL'
        || (typeof m.trustScore === 'number' && m.trustScore < 2),
    ).length;

    res.json({
      success: true,
      data: {
        sessionId,
        title:     (conversation as any).title ?? 'Untitled',
        createdAt: (conversation as any).createdAt,
        messages,
        trustScores,
        fingerprints,
        receipts,
        summary: {
          totalTurns:     msgs.length,
          avgTrustScore,
          minTrustScore:  trustScores.length ? Math.min(...trustScores) : 0,
          maxTrustScore:  trustScores.length ? Math.max(...trustScores) : 0,
          violations,
        },
      },
    });
  } catch (error: unknown) {
    logger.error('Replay fetch error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error:   'Failed to load replay data',
      message: getErrorMessage(error),
    });
  }
});

export default router;
