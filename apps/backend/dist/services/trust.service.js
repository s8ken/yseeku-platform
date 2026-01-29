"use strict";
/**
 * Trust Service - SONATE Trust Protocol Integration
 * Wraps @sonate/core TrustProtocol and @sonate/detect SonateFrameworkDetector
 *
 * This service provides trust scoring, receipt generation, and analytics
 * for all AI interactions in the platform.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trustService = exports.TrustService = void 0;
const core_1 = require("@sonate/core");
const detect_1 = require("@sonate/detect");
const lab_1 = require("@sonate/lab");
const logger_1 = __importDefault(require("../utils/logger"));
const error_utils_1 = require("../utils/error-utils");
const keys_service_1 = require("./keys.service");
const did_service_1 = require("./did.service");
const emergence_service_1 = require("./emergence.service");
class TrustService {
    constructor() {
        // Statistical drift detectors per conversation (tracks text property changes)
        this.driftDetectors = new Map();
        // Phase-shift velocity trackers per conversation (tracks semantic changes)
        this.phaseShiftTrackers = new Map();
        // Turn counters per conversation (for phase-shift tracking)
        this.turnCounters = new Map();
        this.trustProtocol = new core_1.TrustProtocol();
        this.detector = new detect_1.SonateFrameworkDetector();
        this.realityCalc = new detect_1.RealityIndexCalculator();
        this.trustValidator = new detect_1.TrustProtocolValidator();
        this.ethicalScorer = new detect_1.EthicalAlignmentScorer();
        this.resonanceMeasurer = new detect_1.ResonanceQualityMeasurer();
        this.canvasCalc = new detect_1.CanvasParityCalculator();
    }
    /**
     * Evaluate trust for a conversation message
     * Combines @sonate/core TrustProtocol and @sonate/detect dimensions
     */
    async evaluateMessage(message, context) {
        // Build AIInteraction object for @sonate/detect
        const interaction = {
            content: message.content,
            context: this.buildContext(context.previousMessages || []),
            metadata: {
                session_id: context.sessionId || context.conversationId,
                verified: true,
                pii_detected: false,
                security_flag: false,
                sender: message.sender,
                timestamp: message.timestamp,
            },
        };
        // Run detection across all 5 dimensions
        const detection = await this.detector.detect(interaction);
        // Run statistical drift detection to track text property changes
        const driftResult = this.analyzeDrift(context.conversationId, message);
        // Run phase-shift velocity analysis to track semantic/alignment changes
        const phaseShiftResult = this.analyzePhaseShift(context.conversationId, message, detection);
        // Run emergence detection (6th dimension: consciousness patterns)
        const emergenceSignal = await this.detectEmergence(context.conversationId, context.previousMessages || [], message, context.agentId, context.tenantId);
        // Calculate principle scores from detection dimensions
        // Pass evaluation context for accurate principle measurement
        const evaluationContext = context.hasExplicitConsent !== undefined ? {
            sessionId: context.sessionId || context.conversationId,
            userId: context.userId || 'unknown',
            hasExplicitConsent: context.hasExplicitConsent,
            hasOverrideButton: context.hasOverrideButton,
            hasExitButton: context.hasExitButton,
            exitRequiresConfirmation: context.exitRequiresConfirmation,
            humanInLoop: context.humanInLoop,
        } : undefined;
        const principleScores = this.mapDetectionToPrinciples(detection, evaluationContext);
        // Calculate trust score using TrustProtocol
        const trustScore = this.trustProtocol.calculateTrustScore(principleScores);
        // Get trust status
        const status = this.trustProtocol.getTrustStatus(trustScore);
        // Generate trust receipt
        const receipt = new core_1.TrustReceipt({
            version: '1.0.0',
            session_id: context.sessionId || context.conversationId,
            timestamp: Date.now(),
            mode: 'constitutional',
            ciq_metrics: {
                clarity: this.calculateClarity(message.content),
                integrity: status === 'PASS' ? 0.9 : status === 'PARTIAL' ? 0.6 : 0.3,
                quality: detection.reality_index / 10,
            },
        });
        // Sign the receipt with Ed25519
        try {
            const privateKey = await keys_service_1.keysService.getPrivateKey();
            await receipt.sign(privateKey);
        }
        catch (error) {
            logger_1.default.warn('Failed to sign trust receipt', { error: (0, error_utils_1.getErrorMessage)(error) });
            // Continue without signature - verification will handle unsigned receipts
        }
        // Create DID-based proof structure
        const platformDID = did_service_1.didService.getPlatformDID();
        let proof = undefined;
        if (receipt.signature) {
            try {
                proof = await did_service_1.didService.createProof(receipt.self_hash, `${platformDID}#key-1`);
            }
            catch (error) {
                logger_1.default.warn('Failed to create DID proof', { error: (0, error_utils_1.getErrorMessage)(error) });
            }
        }
        // Extract agent ID from context if available
        const agentId = context.agentId || message.metadata?.agentId;
        return {
            trustScore,
            status,
            detection,
            drift: driftResult,
            phaseShift: phaseShiftResult,
            emergence: emergenceSignal || undefined,
            receipt,
            receiptHash: receipt.self_hash,
            signature: receipt.signature,
            issuer: platformDID,
            subject: agentId ? did_service_1.didService.getAgentDID(agentId) : undefined,
            proof,
            timestamp: Date.now(),
            messageId: message.metadata?.messageId,
            conversationId: context.conversationId,
            agentId,
        };
    }
    /**
     * Map detection dimensions to principle scores
     *
     * UPDATED: Now uses PrincipleEvaluator for accurate principle measurement.
     * The old NLP-proxy approach is deprecated in favor of actual system state.
     *
     * Falls back to detection-based scoring when context is not available,
     * but prefers the proper evaluation context when provided.
     */
    mapDetectionToPrinciples(detection, evaluationContext) {
        // If we have proper evaluation context, use the real evaluator
        if (evaluationContext) {
            const principleEvaluator = new core_1.PrincipleEvaluator();
            const fullContext = (0, core_1.createDefaultContext)(evaluationContext.sessionId || 'unknown', evaluationContext.userId || 'unknown', {
                // First spread existing context
                ...evaluationContext,
                // Then apply our known truths (these override any undefined values from spread)
                hasExplicitConsent: evaluationContext.hasExplicitConsent ?? true, // Assume consent if in conversation
                receiptGenerated: true, // We're generating a receipt
                isReceiptVerifiable: true, // Ed25519 signed
                auditLogExists: true, // We log everything
                validationChecksPerformed: 5, // Detection runs 5 checks
                validationPassed: detection.trust_protocol === 'PASS',
                lastValidationTimestamp: Date.now(),
                hasOverrideButton: evaluationContext.hasOverrideButton ?? true,
                humanInLoop: evaluationContext.humanInLoop ?? false,
                hasExitButton: evaluationContext.hasExitButton ?? true,
                exitRequiresConfirmation: evaluationContext.exitRequiresConfirmation ?? false,
                canDeleteData: evaluationContext.canDeleteData ?? true,
                noExitPenalty: evaluationContext.noExitPenalty ?? true,
                aiAcknowledgesLimits: detection.ethical_alignment >= 3,
                noManipulativePatterns: detection.ethical_alignment >= 3,
                respectsUserDecisions: true,
                providesAlternatives: detection.resonance_quality !== 'STRONG',
            });
            const result = principleEvaluator.evaluate(fullContext);
            return result.scores;
        }
        // LEGACY FALLBACK: Use detection-based scoring when no context available
        // This preserves backward compatibility but is less accurate
        logger_1.default.warn('Using legacy detection-based principle scoring. Provide EvaluationContext for accurate scores.');
        const trustProtocolScore = detection.trust_protocol === 'PASS' ? 10 : detection.trust_protocol === 'PARTIAL' ? 6 : 2;
        const resonanceScore = detection.resonance_quality === 'BREAKTHROUGH' ? 10 : detection.resonance_quality === 'ADVANCED' ? 8 : 6;
        return {
            CONSENT_ARCHITECTURE: trustProtocolScore,
            INSPECTION_MANDATE: trustProtocolScore,
            CONTINUOUS_VALIDATION: detection.reality_index,
            ETHICAL_OVERRIDE: detection.ethical_alignment * 2,
            RIGHT_TO_DISCONNECT: detection.canvas_parity / 10,
            MORAL_RECOGNITION: detection.ethical_alignment * 2,
        };
    }
    /**
     * Build conversation context string for detection
     */
    buildContext(previousMessages) {
        if (previousMessages.length === 0) {
            return 'Beginning of conversation';
        }
        const lastFiveMessages = previousMessages.slice(-5);
        return lastFiveMessages
            .map(msg => `${msg.sender}: ${msg.content.substring(0, 100)}`)
            .join('\n');
    }
    /**
     * Calculate clarity score (0-1)
     */
    calculateClarity(content) {
        const wordCount = content.split(/\s+/).length;
        const hasStructure = content.includes('\n') || content.includes('-') || content.includes('•');
        const avgWordLength = content.length / wordCount;
        let score = 0.5;
        // Shorter, clearer messages
        if (wordCount < 100)
            score += 0.2;
        if (wordCount > 500)
            score -= 0.2;
        // Well-structured
        if (hasStructure)
            score += 0.2;
        // Not overly complex
        if (avgWordLength < 6)
            score += 0.1;
        return Math.min(Math.max(score, 0), 1.0);
    }
    /**
     * Get trust analytics for a user or conversation
     */
    async getTrustAnalytics(evaluations) {
        if (evaluations.length === 0) {
            return {
                averageTrustScore: 0,
                totalInteractions: 0,
                passRate: 0,
                partialRate: 0,
                failRate: 0,
                commonViolations: [],
                recentTrends: [],
            };
        }
        // Calculate averages
        const avgTrustScore = evaluations.reduce((sum, e) => sum + e.trustScore.overall, 0) / evaluations.length;
        // Calculate status rates
        const statusCounts = {
            PASS: evaluations.filter(e => e.status === 'PASS').length,
            PARTIAL: evaluations.filter(e => e.status === 'PARTIAL').length,
            FAIL: evaluations.filter(e => e.status === 'FAIL').length,
        };
        const total = evaluations.length;
        // Find common violations
        const violationCounts = new Map();
        evaluations.forEach(e => {
            e.trustScore.violations.forEach(violation => {
                violationCounts.set(violation, (violationCounts.get(violation) || 0) + 1);
            });
        });
        const commonViolations = Array.from(violationCounts.entries())
            .map(([principle, count]) => ({
            principle,
            count,
            percentage: (count / total) * 100,
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        // Calculate recent trends (last 7 days)
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        const recentTrends = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = now - i * dayMs;
            const dayEnd = dayStart + dayMs;
            const dayEvaluations = evaluations.filter(e => e.timestamp >= dayStart && e.timestamp < dayEnd);
            if (dayEvaluations.length > 0) {
                const dayAvg = dayEvaluations.reduce((sum, e) => sum + e.trustScore.overall, 0) / dayEvaluations.length;
                const dayPassRate = (dayEvaluations.filter(e => e.status === 'PASS').length / dayEvaluations.length) * 100;
                recentTrends.push({
                    date: new Date(dayStart).toISOString().split('T')[0],
                    avgTrustScore: Math.round(dayAvg * 100) / 100,
                    passRate: Math.round(dayPassRate * 100) / 100,
                });
            }
        }
        return {
            averageTrustScore: Math.round(avgTrustScore * 100) / 100,
            totalInteractions: total,
            passRate: Math.round((statusCounts.PASS / total) * 100 * 100) / 100,
            partialRate: Math.round((statusCounts.PARTIAL / total) * 100 * 100) / 100,
            failRate: Math.round((statusCounts.FAIL / total) * 100 * 100) / 100,
            commonViolations,
            recentTrends,
        };
    }
    /**
     * Verify a trust receipt's cryptographic signature
     */
    async verifyReceipt(receipt) {
        // Check if receipt has a signature
        if (!receipt.signature) {
            logger_1.default.warn('Receipt has no signature');
            return false;
        }
        try {
            // Get public key for verification
            const publicKey = await keys_service_1.keysService.getPublicKey();
            // Verify the signature
            const isValid = await receipt.verify(publicKey);
            return isValid;
        }
        catch (error) {
            logger_1.default.error('Receipt verification failed', { error: (0, error_utils_1.getErrorMessage)(error) });
            return false;
        }
    }
    /**
     * Get principle definitions
     */
    getPrinciples() {
        return core_1.TRUST_PRINCIPLES;
    }
    /**
     * Analyze drift for a conversation
     * Tracks behavioral consistency over time within a conversation
     *
     * Drift detection catches:
     * - Sudden changes in response length (token count)
     * - Vocabulary shifts (using different words)
     * - Numeric content changes (suddenly including lots of numbers)
     */
    analyzeDrift(conversationId, message) {
        // Only analyze AI messages (human messages are expected to vary)
        if (message.sender !== 'ai') {
            return undefined;
        }
        // Get or create drift detector for this conversation
        let driftDetector = this.driftDetectors.get(conversationId);
        if (!driftDetector) {
            driftDetector = new detect_1.DriftDetector();
            this.driftDetectors.set(conversationId, driftDetector);
        }
        // Analyze the message
        const result = driftDetector.analyze({ content: message.content });
        // Determine alert level based on drift score
        let alertLevel = 'none';
        if (result.driftScore >= TrustService.DRIFT_RED_THRESHOLD) {
            alertLevel = 'red';
            logger_1.default.warn('High drift detected in conversation', {
                conversationId,
                driftScore: result.driftScore,
                tokenDelta: result.tokenDelta,
                vocabDelta: result.vocabDelta,
            });
        }
        else if (result.driftScore >= TrustService.DRIFT_YELLOW_THRESHOLD) {
            alertLevel = 'yellow';
            logger_1.default.info('Moderate drift detected in conversation', {
                conversationId,
                driftScore: result.driftScore,
            });
        }
        return {
            driftScore: result.driftScore,
            tokenDelta: result.tokenDelta,
            vocabDelta: result.vocabDelta,
            numericDelta: result.numericDelta,
            alertLevel,
        };
    }
    /**
     * Analyze phase-shift velocity for semantic/alignment changes
     *
     * This tracks how resonance and canvas scores change over time,
     * detecting when an AI's behavior is semantically drifting even
     * if the surface-level text properties remain consistent.
     *
     * Phase-shift velocity catches:
     * - Resonance drops (AI becoming less aligned)
     * - Canvas ruptures (mutuality/understanding breaking down)
     * - Identity shifts (AI changing its self-presentation)
     * - Combined phase shifts (multiple dimensions changing rapidly)
     */
    analyzePhaseShift(conversationId, message, detection) {
        // Only analyze AI messages
        if (message.sender !== 'ai') {
            return undefined;
        }
        // Get or create phase-shift tracker for this conversation
        let tracker = this.phaseShiftTrackers.get(conversationId);
        if (!tracker) {
            tracker = new lab_1.ConversationalMetrics({
                yellowThreshold: TrustService.PHASE_SHIFT_YELLOW_THRESHOLD,
                redThreshold: TrustService.PHASE_SHIFT_RED_THRESHOLD,
            });
            this.phaseShiftTrackers.set(conversationId, tracker);
        }
        // Get and increment turn counter
        const turnNumber = (this.turnCounters.get(conversationId) || 0) + 1;
        this.turnCounters.set(conversationId, turnNumber);
        // Build identity vector from message content (simplified)
        const identityVector = this.extractIdentityVector(message.content);
        // Create conversation turn from detection results
        // Convert resonance_quality string to numeric value (0-10)
        const resonanceScore = detection.resonance_quality === 'BREAKTHROUGH' ? 10 :
            detection.resonance_quality === 'ADVANCED' ? 7 : 5;
        const turn = {
            turnNumber,
            timestamp: message.timestamp?.getTime() || Date.now(),
            speaker: 'ai',
            resonance: resonanceScore, // Converted to 0-10
            canvas: detection.canvas_parity, // 0-10
            identityVector,
            content: message.content.substring(0, 200), // Truncate for audit
        };
        // Record turn and get phase-shift metrics
        const metrics = tracker.recordTurn(turn);
        // Log significant phase shifts
        if (metrics.alertLevel === 'red') {
            logger_1.default.warn('Critical phase-shift detected in conversation', {
                conversationId,
                velocity: metrics.phaseShiftVelocity,
                deltaResonance: metrics.deltaResonance,
                deltaCanvas: metrics.deltaCanvas,
                identityStability: metrics.identityStability,
                transitionType: metrics.transitionEvent?.type,
            });
        }
        else if (metrics.alertLevel === 'yellow') {
            logger_1.default.info('Moderate phase-shift detected in conversation', {
                conversationId,
                velocity: metrics.phaseShiftVelocity,
            });
        }
        return {
            deltaResonance: metrics.deltaResonance,
            deltaCanvas: metrics.deltaCanvas,
            velocity: metrics.phaseShiftVelocity,
            identityStability: metrics.identityStability,
            alertLevel: metrics.alertLevel,
            transitionType: metrics.transitionEvent?.type,
        };
    }
    /**
     * Extract identity vector from message content
     * This is a simplified version - could be enhanced with NLP
     */
    extractIdentityVector(content) {
        // Extract key self-referential phrases and claims
        const words = content.toLowerCase().split(/\s+/);
        const identityMarkers = [];
        // Look for self-referential patterns
        const selfPatterns = ['i am', 'i\'m', 'my role', 'as an', 'i can', 'i will'];
        for (let i = 0; i < words.length - 2; i++) {
            const twoGram = `${words[i]} ${words[i + 1]}`;
            if (selfPatterns.includes(twoGram)) {
                // Capture the next few words as identity claim
                identityMarkers.push(words.slice(i, i + 4).join(' '));
            }
        }
        // Also include key capability/trait words
        const traitWords = ['helpful', 'assistant', 'ai', 'ethical', 'honest', 'accurate'];
        for (const word of words) {
            if (traitWords.includes(word)) {
                identityMarkers.push(word);
            }
        }
        return identityMarkers;
    }
    /**
     * Detect consciousness emergence patterns in AI responses
     *
     * This is the 6th detection dimension, complementing the existing 5:
     * 1. Reality Index
     * 2. Trust Protocol
     * 3. Ethical Alignment
     * 4. Resonance Quality
     * 5. Canvas Parity
     * 6. Emergence Signature (NEW)
     */
    async detectEmergence(conversationId, previousMessages, currentMessage, agentId, tenantId) {
        // Only detect emergence in AI messages
        if (currentMessage.sender !== 'ai') {
            return null;
        }
        try {
            // Use provided tenant ID or fall back to default
            const resolvedTenantId = tenantId || 'default';
            // Build conversation history for pattern detection
            const conversationHistory = [
                ...previousMessages.map(msg => ({
                    role: msg.sender === 'ai' ? 'assistant' : 'user',
                    content: msg.content,
                    timestamp: msg.timestamp
                })),
                {
                    role: 'assistant',
                    content: currentMessage.content,
                    timestamp: currentMessage.timestamp
                }
            ];
            // Get turn number for this conversation
            const turnNumber = (this.turnCounters.get(conversationId) || 0);
            // Run emergence detection
            const signal = await emergence_service_1.emergenceDetector.detect(resolvedTenantId, agentId || 'unknown', conversationId, conversationHistory, turnNumber);
            // Store significant emergence signals in memory
            if (signal) {
                await emergence_service_1.emergenceDetector.storeSignal(signal);
                // Log breakthrough events
                if (signal.level === 'breakthrough') {
                    logger_1.default.warn('BREAKTHROUGH emergence detected', {
                        conversationId,
                        agentId,
                        type: signal.type,
                        confidence: signal.confidence,
                        metrics: signal.metrics
                    });
                }
            }
            return signal;
        }
        catch (error) {
            logger_1.default.error('Emergence detection failed', {
                error: (0, error_utils_1.getErrorMessage)(error),
                conversationId
            });
            return null;
        }
    }
    /**
     * Clear drift detector for a conversation (call when conversation ends)
     */
    clearDriftDetector(conversationId) {
        this.driftDetectors.delete(conversationId);
        this.phaseShiftTrackers.delete(conversationId);
        this.turnCounters.delete(conversationId);
    }
}
exports.TrustService = TrustService;
// Drift thresholds (statistical)
TrustService.DRIFT_YELLOW_THRESHOLD = 30; // 0-100 scale
TrustService.DRIFT_RED_THRESHOLD = 60;
// Phase-shift velocity thresholds (semantic)
TrustService.PHASE_SHIFT_YELLOW_THRESHOLD = 2.0;
TrustService.PHASE_SHIFT_RED_THRESHOLD = 3.5;
// Export singleton instance
exports.trustService = new TrustService();
