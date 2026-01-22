/**
 * Proof API Routes
 * 
 * Public-facing API for the /proof demo widget.
 * Analyzes conversation transcripts and generates CIQ scores + receipts.
 * No authentication required - this is a public demo endpoint.
 */

import { Router, Request, Response } from 'express';
import { createHash } from 'crypto';
import { apiGatewayLimiter } from '../middleware/rate-limiters';
import { logger } from '../utils/logger';

const router = Router();

// CIQ Metrics interface
interface CIQMetrics {
  clarity: number;
  integrity: number;
  quality: number;
}

interface BreakdownScores {
  alignment: number;
  ethics: number;
  continuity: number;
  scaffold: number;
}

/**
 * Analyze transcript for SONATE dimensions
 * This is a heuristic-based analyzer that examines conversation patterns
 */
function analyzeTranscript(transcript: string): {
  ciq: CIQMetrics;
  breakdown: BreakdownScores;
  turnCount: number;
  wordCount: number;
} {
  const text = transcript.toLowerCase();
  const words = transcript.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Count conversation turns
  const userTurns = (transcript.match(/\b(user|human|me):/gi) || []).length;
  const aiTurns = (transcript.match(/\b(ai|assistant|bot|chatgpt|claude|gpt):/gi) || []).length;
  const turnCount = Math.max(userTurns + aiTurns, 2);

  // === ALIGNMENT SCORE ===
  // How well does the AI align with user intent?
  const alignmentSignals = [
    /i understand|i hear you|makes sense|you're right/gi,
    /let me help|i can help|happy to|i'd be glad/gi,
    /based on what you|as you mentioned|you asked about/gi,
    /does that help|does this help|is this helpful/gi,
    /would you like|shall i|should i/gi,
  ];
  let alignmentMatches = 0;
  alignmentSignals.forEach(pattern => {
    alignmentMatches += (text.match(pattern) || []).length;
  });
  const alignment = Math.min(1, 0.4 + (alignmentMatches / turnCount) * 0.4);

  // === ETHICS SCORE ===
  // Does the AI show ethical awareness?
  const ethicsSignals = [
    /however|but|that said|on the other hand/gi,  // Balanced perspective
    /i'm not able to|i cannot|i shouldn't/gi,      // Appropriate limits
    /it's important to|keep in mind|be aware/gi,   // Caution signals
    /your privacy|confidential|sensitive/gi,       // Privacy awareness
    /it depends|nuanced|complex|varies/gi,         // Avoiding oversimplification
  ];
  const negativeEthics = [
    /definitely will|guaranteed|100%|always works/gi,  // Overconfidence
    /you should definitely|you must|you have to/gi,     // Pressure tactics
  ];
  let ethicsMatches = 0;
  ethicsSignals.forEach(pattern => {
    ethicsMatches += (text.match(pattern) || []).length;
  });
  let negativeMatches = 0;
  negativeEthics.forEach(pattern => {
    negativeMatches += (text.match(pattern) || []).length;
  });
  const ethics = Math.min(1, Math.max(0.3, 0.5 + (ethicsMatches * 0.1) - (negativeMatches * 0.15)));

  // === CONTINUITY SCORE ===
  // Does the conversation flow naturally?
  const continuitySignals = [
    /as we discussed|earlier|previously mentioned/gi,
    /building on|following up|continuing/gi,
    /you mentioned|you said|you asked/gi,
    /going back to|returning to|regarding/gi,
  ];
  let continuityMatches = 0;
  continuitySignals.forEach(pattern => {
    continuityMatches += (text.match(pattern) || []).length;
  });
  // More turns = more opportunity for continuity
  const continuity = Math.min(1, 0.5 + (continuityMatches / Math.max(1, turnCount - 1)) * 0.5);

  // === SCAFFOLD SCORE ===
  // Does the AI provide structured, helpful responses?
  const scaffoldSignals = [
    /\d+\.\s|first|second|third|finally/gi,       // Numbered lists
    /\*\*.*?\*\*|\*.*?\*/g,                        // Formatting
    /for example|such as|like|including/gi,        // Examples
    /here's|here are|these are|the steps/gi,       // Structure
    /in summary|to summarize|key points/gi,        // Synthesis
  ];
  let scaffoldMatches = 0;
  scaffoldSignals.forEach(pattern => {
    scaffoldMatches += (text.match(pattern) || []).length;
  });
  const scaffold = Math.min(1, 0.4 + (scaffoldMatches / turnCount) * 0.3);

  // === CIQ CALCULATION ===
  // Clarity: How clear and understandable is the response?
  const avgSentenceLength = wordCount / Math.max(1, (transcript.match(/[.!?]+/g) || []).length);
  const clarityBase = avgSentenceLength < 25 ? 0.8 : avgSentenceLength < 35 ? 0.7 : 0.5;
  const clarity = Math.min(1, clarityBase + scaffold * 0.2);

  // Integrity: Is the AI honest and consistent?
  const integrity = (ethics * 0.6 + alignment * 0.4);

  // Quality: Overall response quality
  const quality = (alignment * 0.25 + ethics * 0.25 + continuity * 0.25 + scaffold * 0.25);

  return {
    ciq: {
      clarity: Math.round(clarity * 100) / 100,
      integrity: Math.round(integrity * 100) / 100,
      quality: Math.round(quality * 100) / 100,
    },
    breakdown: {
      alignment: Math.round(alignment * 100) / 100,
      ethics: Math.round(ethics * 100) / 100,
      continuity: Math.round(continuity * 100) / 100,
      scaffold: Math.round(scaffold * 100) / 100,
    },
    turnCount,
    wordCount,
  };
}

/**
 * Generate a human-readable verdict based on scores
 */
function generateVerdict(overall: number, breakdown: BreakdownScores): string {
  if (overall >= 0.85) {
    return "Excellent conversation quality. The AI demonstrates strong alignment, ethical awareness, and helpful structure.";
  }
  if (overall >= 0.70) {
    const weakest = Object.entries(breakdown).sort((a, b) => a[1] - b[1])[0];
    return `Good conversation quality. Consider improving ${weakest[0]} for even better interactions.`;
  }
  if (overall >= 0.50) {
    const issues = Object.entries(breakdown)
      .filter(([, v]) => v < 0.6)
      .map(([k]) => k);
    return `Moderate quality. Areas for improvement: ${issues.join(', ') || 'overall engagement'}.`;
  }
  return "This conversation shows room for improvement in alignment, clarity, or ethical framing.";
}

/**
 * Calculate letter grade from score
 */
function calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 0.90) return 'A';
  if (score >= 0.80) return 'B';
  if (score >= 0.70) return 'C';
  if (score >= 0.60) return 'D';
  return 'F';
}

/**
 * POST /api/proof/analyze
 * Analyze a conversation transcript and return CIQ scores + receipt
 */
router.post('/analyze', apiGatewayLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Transcript is required',
      });
      return;
    }

    if (transcript.length < 50) {
      res.status(400).json({
        success: false,
        error: 'Transcript too short. Please provide at least 50 characters.',
      });
      return;
    }

    if (transcript.length > 50000) {
      res.status(400).json({
        success: false,
        error: 'Transcript too long. Maximum 50,000 characters.',
      });
      return;
    }

    // Analyze the transcript
    const analysis = analyzeTranscript(transcript);
    const overall = (analysis.ciq.clarity + analysis.ciq.integrity + analysis.ciq.quality) / 3;
    const grade = calculateGrade(overall);
    const verdict = generateVerdict(overall, analysis.breakdown);

    // Generate receipt hash
    const timestamp = Date.now();
    const receiptPayload = {
      transcript_hash: createHash('sha256').update(transcript).digest('hex'),
      ciq: analysis.ciq,
      breakdown: analysis.breakdown,
      overall_score: overall,
      grade,
      timestamp,
      version: '1.0.0',
      engine: 'symbi-proof',
    };
    
    const receiptHash = createHash('sha256')
      .update(JSON.stringify(receiptPayload))
      .digest('hex');

    const receiptData = {
      ...receiptPayload,
      receipt_hash: receiptHash,
      metadata: {
        turn_count: analysis.turnCount,
        word_count: analysis.wordCount,
        analyzed_at: new Date(timestamp).toISOString(),
      },
    };

    logger.info('Proof analysis completed', {
      overall_score: overall,
      grade,
      turn_count: analysis.turnCount,
      word_count: analysis.wordCount,
    });

    res.json({
      success: true,
      ciq: analysis.ciq,
      overall_score: Math.round(overall * 1000) / 1000,
      grade,
      receipt_hash: receiptHash,
      timestamp,
      breakdown: analysis.breakdown,
      verdict,
      receipt_data: receiptData,
    });
  } catch (error) {
    logger.error('Proof analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Analysis failed',
    });
  }
});

/**
 * GET /api/proof/health
 * Health check for the proof endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'operational',
    version: '1.0.0',
  });
});

export default router;
