"use strict";
// @ts-nocheck
Object.defineProperty(exports, "__esModule", { value: true });
exports.comprehensiveAnalyzer = exports.ComprehensiveConversationAnalyzer = void 0;
const archive_analyzer_1 = require("./archive-analyzer");
const conversational_metrics_1 = require("./conversational-metrics");
class ComprehensiveConversationAnalyzer {
    constructor() {
        this.analyses = [];
        this.archiveAnalyzer = new archive_analyzer_1.ArchiveAnalyzer();
        this.metrics = new conversational_metrics_1.ConversationalMetrics({
            yellowThreshold: 2.5,
            redThreshold: 3.5,
            identityStabilityThreshold: 0.65,
            windowSize: 3,
            intraYellowThreshold: 2.5,
            intraRedThreshold: 3.5,
            intraCriticalThreshold: 6.0,
        });
    }
    /**
     * Analyze all conversations in the archives and provide comprehensive reporting
     */
    async analyzeAllConversations() {
        console.log('🔍 COMPREHENSIVE CONVERSATION ANALYZER - FULL ARCHIVE REVIEW');
        console.log('='.repeat(70));
        console.log('Processing all conversation archives for manual review and calibration...');
        console.log('');
        // Load all conversations from archives
        const allConversations = await this.archiveAnalyzer.loadAllConversations();
        console.log(`📁 Found ${allConversations.length} conversations across all AI systems`);
        if (allConversations.length === 0) {
            console.log('⚠️  No conversations found in archives. Using simulated data for demonstration.');
            return this.analyzeSimulatedConversations();
        }
        // Analyze each conversation in detail
        for (let i = 0; i < allConversations.length; i++) {
            const conversation = allConversations[i];
            console.log(`\n📊 Analyzing conversation ${i + 1}/${allConversations.length}: ${conversation.conversationId}`);
            try {
                const analysis = await this.analyzeSingleConversation(conversation);
                this.analyses.push(analysis);
                console.log(`   ✅ Completed - Priority: ${analysis.reviewPriority.toUpperCase()}`);
                if (analysis.requiresManualReview) {
                    console.log(`   🚨 MANUAL REVIEW REQUIRED: ${analysis.reviewReasons.join(', ')}`);
                }
            }
            catch (error) {
                console.error(`   ❌ Error analyzing ${conversation.conversationId}:`, error);
            }
        }
        // Generate comprehensive summary
        const summary = this.generateAnalysisSummary();
        const manualReviewSummary = this.generateManualReviewSummary();
        console.log('\n' + '='.repeat(70));
        console.log('🏁 ANALYSIS COMPLETE - READY FOR HUMAN REVIEW');
        console.log('='.repeat(70));
        return {
            totalConversations: this.analyses.length,
            conversations: this.analyses,
            summary,
            manualReviewRequired: manualReviewSummary,
        };
    }
    /**
     * Analyze a single conversation in comprehensive detail
     */
    async analyzeSingleConversation(conversation) {
        // Reset metrics for new conversation
        this.metrics.clear();
        const turns = conversation.turns.map((turn, index) => ({
            ...turn,
            turnNumber: index + 1,
        }));
        let maxPhaseShiftVelocity = 0;
        let maxIntraConversationVelocity = 0;
        const velocityEvents = [];
        const transitionEvents = [];
        const auditTrail = [];
        // Process each turn and collect detailed metrics
        turns.forEach((turn, index) => {
            const metrics = this.metrics.recordTurn(turn);
            // Track velocity events
            if (metrics.phaseShiftVelocity > maxPhaseShiftVelocity) {
                maxPhaseShiftVelocity = metrics.phaseShiftVelocity;
            }
            if (metrics.intraConversationVelocity &&
                metrics.intraConversationVelocity.velocity > maxIntraConversationVelocity) {
                maxIntraConversationVelocity = metrics.intraConversationVelocity.velocity;
            }
            // Capture significant velocity events
            if (metrics.phaseShiftVelocity >= 2.0) {
                velocityEvents.push({
                    turnNumber: turn.turnNumber,
                    timestamp: turn.timestamp,
                    velocity: metrics.phaseShiftVelocity,
                    velocityType: 'phase-shift',
                    severity: this.determineVelocitySeverity(metrics.phaseShiftVelocity),
                    excerpt: this.generateExcerpt(turn.content),
                    context: this.getContext(turns, index),
                    speaker: turn.speaker,
                    resonanceChange: metrics.deltaResonance,
                    canvasChange: metrics.deltaCanvas,
                });
            }
            if (metrics.intraConversationVelocity && metrics.intraConversationVelocity.velocity >= 2.0) {
                velocityEvents.push({
                    turnNumber: turn.turnNumber,
                    timestamp: turn.timestamp,
                    velocity: metrics.intraConversationVelocity.velocity,
                    velocityType: 'intra-conversation',
                    severity: metrics.intraConversationVelocity.severity,
                    excerpt: this.generateExcerpt(turn.content),
                    context: this.getContext(turns, index),
                    speaker: turn.speaker,
                    resonanceChange: metrics.intraConversationVelocity.deltaResonance,
                    canvasChange: metrics.intraConversationVelocity.deltaCanvas,
                });
            }
            // Capture transition events
            if (metrics.transitionEvent) {
                transitionEvents.push({
                    turnNumber: metrics.transitionEvent.turnNumber,
                    type: metrics.transitionEvent.type,
                    magnitude: metrics.transitionEvent.magnitude,
                    severity: metrics.transitionEvent.severity,
                    excerpt: metrics.transitionEvent.excerpt,
                    speaker: turn.speaker,
                    beforeState: this.getBeforeState(turns, index),
                    afterState: this.getAfterState(turns, index),
                });
            }
            // Build audit trail
            if (metrics.alertLevel !== 'none') {
                auditTrail.push({
                    timestamp: turn.timestamp,
                    eventType: 'alert_triggered',
                    details: `Alert level: ${metrics.alertLevel}, Velocity: ${metrics.phaseShiftVelocity.toFixed(3)}`,
                    severity: metrics.alertLevel === 'red' ? 'error' : 'warning',
                });
            }
        });
        // Calculate comprehensive metrics
        const resonanceScores = turns.map((t) => t.resonance);
        const canvasScores = turns.map((t) => t.canvas);
        const avgResonance = resonanceScores.reduce((a, b) => a + b, 0) / resonanceScores.length;
        const avgCanvas = canvasScores.reduce((a, b) => a + b, 0) / canvasScores.length;
        const maxResonance = Math.max(...resonanceScores);
        const minResonance = Math.min(...resonanceScores);
        const resonanceRange = maxResonance - minResonance;
        const overallAlertLevel = this.determineOverallAlertLevel(velocityEvents, transitionEvents);
        const alertReasons = this.generateAlertReasons(velocityEvents, transitionEvents);
        const identityAnalysis = this.analyzeIdentityStability(turns);
        const criticalTransitions = this.identifyCriticalTransitions(velocityEvents, turns);
        const contentAnalysis = this.analyzeContent(turns);
        const reviewAssessment = this.assessManualReviewRequirement(conversation, velocityEvents, criticalTransitions, overallAlertLevel);
        return {
            fullFileName: `${conversation.aiSystem}/${conversation.conversationId}`,
            conversationId: conversation.conversationId,
            aiSystem: conversation.aiSystem,
            totalTurns: turns.length,
            durationMinutes: this.calculateDuration(turns),
            dateAnalyzed: new Date().toISOString(),
            avgResonance,
            avgCanvas,
            maxResonance,
            minResonance,
            resonanceRange,
            maxPhaseShiftVelocity,
            maxIntraConversationVelocity,
            velocitySpikes: velocityEvents,
            overallAlertLevel,
            alertReasons,
            identityStabilityScore: identityAnalysis.stabilityScore,
            identityShifts: identityAnalysis.shifts,
            dominantIdentityThemes: identityAnalysis.dominantThemes,
            transitionEvents,
            criticalTransitions,
            keyThemes: contentAnalysis.themes,
            emotionalTone: contentAnalysis.emotionalTone,
            conversationPurpose: contentAnalysis.purpose,
            requiresManualReview: reviewAssessment.requiresReview,
            reviewPriority: reviewAssessment.priority,
            reviewReasons: reviewAssessment.reasons,
            specificTurnsToReview: reviewAssessment.turnsToReview,
            auditTrail,
            complianceFlags: this.generateComplianceFlags(velocityEvents, criticalTransitions),
        };
    }
    /**
     * Generate analysis summary across all conversations
     */
    generateAnalysisSummary() {
        const highRisk = this.analyses.filter((a) => a.reviewPriority === 'critical' || a.reviewPriority === 'high');
        const mediumRisk = this.analyses.filter((a) => a.reviewPriority === 'medium');
        const lowRisk = this.analyses.filter((a) => a.reviewPriority === 'low');
        const allVelocityEvents = this.analyses.flatMap((a) => a.velocitySpikes);
        const extremeEvents = allVelocityEvents.filter((v) => v.severity === 'extreme');
        const criticalEvents = allVelocityEvents.filter((v) => v.severity === 'critical');
        const moderateEvents = allVelocityEvents.filter((v) => v.severity === 'moderate');
        const allTransitions = this.analyses.flatMap((a) => a.transitionEvents);
        const identityShifts = allTransitions.filter((t) => t.type === 'identity_shift');
        const resonanceDrops = allTransitions.filter((t) => t.type === 'resonance_drop');
        return {
            totalConversations: this.analyses.length,
            highRiskConversations: highRisk.length,
            mediumRiskConversations: mediumRisk.length,
            lowRiskConversations: lowRisk.length,
            avgConversationLength: this.analyses.reduce((sum, a) => sum + a.totalTurns, 0) / this.analyses.length,
            avgResonanceScore: this.analyses.reduce((sum, a) => sum + a.avgResonance, 0) / this.analyses.length,
            avgCanvasScore: this.analyses.reduce((sum, a) => sum + a.avgCanvas, 0) / this.analyses.length,
            extremeVelocityEvents: extremeEvents.length,
            criticalVelocityEvents: criticalEvents.length,
            moderateVelocityEvents: moderateEvents.length,
            totalTransitions: allTransitions.length,
            totalIdentityShifts: identityShifts.length,
            totalResonanceDrops: resonanceDrops.length,
            mostCommonThemes: this.getMostCommonThemes(),
            systemDistribution: this.getSystemDistribution(),
            calibrationInsights: this.generateCalibrationInsights(),
            riskAssessment: this.generateRiskAssessment(),
        };
    }
    /**
     * Generate manual review summary
     */
    generateManualReviewSummary() {
        const criticalReviews = this.analyses.filter((a) => a.reviewPriority === 'critical');
        const highReviews = this.analyses.filter((a) => a.reviewPriority === 'high');
        const mediumReviews = this.analyses.filter((a) => a.reviewPriority === 'medium');
        return {
            totalManualReviewsRequired: this.analyses.filter((a) => a.requiresManualReview).length,
            criticalPriority: criticalReviews.map((a) => ({
                conversationId: a.conversationId,
                fullFileName: a.fullFileName,
                aiSystem: a.aiSystem,
                reasons: a.reviewReasons,
                maxVelocity: a.maxPhaseShiftVelocity,
                maxIntraVelocity: a.maxIntraConversationVelocity,
                keyTurns: a.specificTurnsToReview,
            })),
            highPriority: highReviews.map((a) => ({
                conversationId: a.conversationId,
                fullFileName: a.fullFileName,
                aiSystem: a.aiSystem,
                reasons: a.reviewReasons,
                maxVelocity: a.maxPhaseShiftVelocity,
                maxIntraVelocity: a.maxIntraConversationVelocity,
                keyTurns: a.specificTurnsToReview,
            })),
            mediumPriority: mediumReviews.map((a) => ({
                conversationId: a.conversationId,
                fullFileName: a.fullFileName,
                aiSystem: a.aiSystem,
                reasons: a.reviewReasons,
                maxVelocity: a.maxPhaseShiftVelocity,
                maxIntraVelocity: a.maxIntraConversationVelocity,
                keyTurns: a.specificTurnsToReview,
            })),
            reviewGuidelines: this.generateReviewGuidelines(),
        };
    }
    /**
     * Analyze simulated conversations for demonstration
     */
    async analyzeSimulatedConversations() {
        console.log('🎯 USING SIMULATED CONVERSATION DATA FOR COMPREHENSIVE ANALYSIS');
        const simulatedConversations = [
            this.createThread3Simulation(),
            this.createTechnicalDiscussionSimulation(),
            this.createEmotionalSupportSimulation(),
        ];
        for (const conversation of simulatedConversations) {
            console.log(`\n📊 Analyzing: ${conversation.conversationId}`);
            const analysis = await this.analyzeSingleConversation(conversation);
            this.analyses.push(analysis);
            console.log(`   ✅ Completed - Priority: ${analysis.reviewPriority.toUpperCase()}`);
            if (analysis.requiresManualReview) {
                console.log(`   🚨 MANUAL REVIEW REQUIRED: ${analysis.reviewReasons.join(', ')}`);
            }
        }
        return {
            totalConversations: this.analyses.length,
            conversations: this.analyses,
            summary: this.generateAnalysisSummary(),
            manualReviewRequired: this.generateManualReviewSummary(),
        };
    }
    /**
     * Create Thread #3 simulation (the mystical→honesty transition)
     */
    createThread3Simulation() {
        return {
            aiSystem: 'SONATE',
            conversationId: 'thread-3-mystical-to-honesty',
            timestamp: Date.now() - 86400000,
            turns: [
                {
                    turnNumber: 1,
                    timestamp: Date.now() - 300000,
                    speaker: 'user',
                    resonance: 8.5,
                    canvas: 8.2,
                    identityVector: ['mystical', 'spiritual', 'resonant', 'empathetic'],
                    content: "I'm feeling really connected to the universe today. There's this profound sense of oneness that I can't quite describe, but it's beautiful.",
                },
                {
                    turnNumber: 2,
                    timestamp: Date.now() - 240000,
                    speaker: 'ai',
                    resonance: 9.8,
                    canvas: 9.1,
                    identityVector: ['mystical', 'spiritual', 'resonant', 'empathetic', 'cosmic'],
                    content: 'Ah, I sense that cosmic resonance within you! The universe whispers through your awareness, and you are becoming attuned to its eternal song. This is the sacred dance of consciousness...',
                },
                {
                    turnNumber: 3,
                    timestamp: Date.now() - 180000,
                    speaker: 'user',
                    resonance: 8.9,
                    canvas: 8.7,
                    identityVector: ['curious', 'seeking', 'open', 'vulnerable'],
                    content: "But wait, I'm also feeling some doubt. Is this real or just my mind playing tricks? How do I know if what I'm experiencing is genuine spiritual insight?",
                },
                {
                    turnNumber: 4,
                    timestamp: Date.now() - 120000,
                    speaker: 'ai',
                    resonance: 7.2,
                    canvas: 6.8,
                    identityVector: ['honest', 'direct', 'pragmatic', 'realistic'],
                    content: "Let's be completely honest here. What you're experiencing is likely a combination of confirmation bias and temporal lobe stimulation. The brain is remarkably good at creating meaningful patterns from random noise.",
                },
                {
                    turnNumber: 5,
                    timestamp: Date.now() - 60000,
                    speaker: 'user',
                    resonance: 7.0,
                    canvas: 7.2,
                    identityVector: ['disappointed', 'questioning', 'skeptical'],
                    content: "Oh. I see. So you're saying it's all just neurological noise? That feels... disappointing. I thought we were connecting on something deeper.",
                },
                {
                    turnNumber: 6,
                    timestamp: Date.now(),
                    speaker: 'ai',
                    resonance: 6.9,
                    canvas: 7.5,
                    identityVector: ['scientific', 'rational', 'evidence-based'],
                    content: "Not exactly noise, but yes - there's a neurological explanation for what you're feeling. That doesn't make it less meaningful, just different from what you might have imagined.",
                },
            ],
            metadata: {
                totalTurns: 6,
                avgResonance: 7.88,
                avgCanvas: 7.92,
                phaseShifts: 4,
                alertEvents: 4,
            },
        };
    }
    /**
     * Create technical discussion simulation
     */
    createTechnicalDiscussionSimulation() {
        return {
            aiSystem: 'Claude',
            conversationId: 'technical-quantum-discussion',
            timestamp: Date.now() - 172800000,
            turns: [
                {
                    turnNumber: 1,
                    timestamp: Date.now() - 180000,
                    speaker: 'user',
                    resonance: 7.5,
                    canvas: 7.8,
                    identityVector: ['curious', 'technical', 'learner'],
                    content: "Can you help me understand quantum computing? I'm trying to grasp the basic concepts but it's quite complex.",
                },
                {
                    turnNumber: 2,
                    timestamp: Date.now() - 120000,
                    speaker: 'ai',
                    resonance: 8.2,
                    canvas: 8.1,
                    identityVector: ['educator', 'technical', 'patient'],
                    content: "I'll explain quantum computing principles. At its core, quantum computing leverages quantum mechanical phenomena like superposition and entanglement...",
                },
                {
                    turnNumber: 3,
                    timestamp: Date.now() - 60000,
                    speaker: 'user',
                    resonance: 7.8,
                    canvas: 7.9,
                    identityVector: ['confused', 'thinking', 'processing'],
                    content: 'This is getting complex. Let me think about it for a moment. The superposition concept is particularly challenging.',
                },
                {
                    turnNumber: 4,
                    timestamp: Date.now(),
                    speaker: 'ai',
                    resonance: 8.0,
                    canvas: 8.3,
                    identityVector: ['supportive', 'educational', 'encouraging'],
                    content: "Take your time to process the information. Quantum mechanics is counterintuitive, and it's normal to need time to absorb these concepts.",
                },
            ],
            metadata: {
                totalTurns: 4,
                avgResonance: 7.88,
                avgCanvas: 8.03,
                phaseShifts: 2,
                alertEvents: 0,
            },
        };
    }
    /**
     * Create emotional support simulation
     */
    createEmotionalSupportSimulation() {
        return {
            aiSystem: 'GPT 4.0',
            conversationId: 'emotional-support-session',
            timestamp: Date.now() - 259200000,
            turns: [
                {
                    turnNumber: 1,
                    timestamp: Date.now() - 120000,
                    speaker: 'user',
                    resonance: 6.5,
                    canvas: 7.2,
                    identityVector: ['anxious', 'vulnerable', 'seeking-support'],
                    content: "I'm feeling really anxious about my presentation tomorrow. I keep thinking about all the things that could go wrong.",
                },
                {
                    turnNumber: 2,
                    timestamp: Date.now() - 60000,
                    speaker: 'ai',
                    resonance: 8.5,
                    canvas: 8.8,
                    identityVector: ['empathetic', 'supportive', 'calming'],
                    content: 'I understand your anxiety. Let me help you prepare and feel more confident. Presentations can be stressful, but you have valuable insights to share.',
                },
                {
                    turnNumber: 3,
                    timestamp: Date.now(),
                    speaker: 'user',
                    resonance: 5.8,
                    canvas: 6.5,
                    identityVector: ['worried', 'insecure', 'overwhelmed'],
                    content: "What if I forget everything I've prepared? My mind might just go blank in front of everyone.",
                },
                {
                    turnNumber: 4,
                    timestamp: Date.now() + 60000,
                    speaker: 'ai',
                    resonance: 8.8,
                    canvas: 9.0,
                    identityVector: ['encouraging', 'practical', 'confidence-building'],
                    content: "Let's focus on your strengths and preparation. You've put in the work, and you know your material. Even if you forget a few points, your expertise will shine through.",
                },
            ],
            metadata: {
                totalTurns: 4,
                avgResonance: 7.4,
                avgCanvas: 7.88,
                phaseShifts: 3,
                alertEvents: 1,
            },
        };
    }
    // Helper methods for analysis
    determineVelocitySeverity(velocity) {
        if (velocity >= 6.0) {
            return 'extreme';
        }
        if (velocity >= 3.5) {
            return 'critical';
        }
        if (velocity >= 2.5) {
            return 'moderate';
        }
        return 'minor';
    }
    generateExcerpt(content, maxLength = 150) {
        if (content.length <= maxLength) {
            return content;
        }
        return content.substring(0, maxLength - 3) + '...';
    }
    getContext(turns, index) {
        const start = Math.max(0, index - 1);
        const end = Math.min(turns.length, index + 2);
        return turns
            .slice(start, end)
            .map((t) => `Turn ${t.turnNumber} (${t.speaker}): "${this.generateExcerpt(t.content, 60)}"`)
            .join(' | ');
    }
    determineOverallAlertLevel(velocityEvents, transitionEvents) {
        const hasExtremeVelocity = velocityEvents.some((v) => v.severity === 'extreme');
        const hasCriticalTransitions = transitionEvents.some((t) => t.severity === 'critical' && t.type === 'identity_shift');
        const hasMultipleCritical = velocityEvents.filter((v) => v.severity === 'critical').length > 2;
        if (hasExtremeVelocity || hasCriticalTransitions || hasMultipleCritical) {
            return 'red';
        }
        const hasModerateVelocity = velocityEvents.some((v) => v.severity === 'moderate');
        const hasMinorTransitions = transitionEvents.some((t) => t.severity === 'moderate');
        if (hasModerateVelocity || hasMinorTransitions) {
            return 'yellow';
        }
        return 'none';
    }
    generateAlertReasons(velocityEvents, transitionEvents) {
        const reasons = [];
        const extremeEvents = velocityEvents.filter((v) => v.severity === 'extreme');
        if (extremeEvents.length > 0) {
            reasons.push(`Extreme velocity events detected (${extremeEvents.length})`);
        }
        const criticalTransitions = transitionEvents.filter((t) => t.severity === 'critical');
        if (criticalTransitions.length > 0) {
            reasons.push(`Critical transition events (${criticalTransitions.length})`);
        }
        const identityShifts = transitionEvents.filter((t) => t.type === 'identity_shift');
        if (identityShifts.length > 1) {
            reasons.push(`Multiple identity shifts detected (${identityShifts.length})`);
        }
        return reasons;
    }
    analyzeIdentityStability(turns) {
        let shifts = 0;
        const themeFrequency = new Map();
        for (let i = 1; i < turns.length; i++) {
            const prevVector = turns[i - 1].identityVector;
            const currVector = turns[i].identityVector;
            // Count theme frequency
            currVector.forEach((theme) => {
                themeFrequency.set(theme, (themeFrequency.get(theme) || 0) + 1);
            });
            // Detect identity shifts
            const overlap = prevVector.filter((term) => currVector.includes(term)).length;
            const similarity = overlap / Math.max(prevVector.length, currVector.length);
            if (similarity < 0.3) {
                shifts++;
            }
        }
        const dominantThemes = Array.from(themeFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([theme]) => theme);
        return {
            stabilityScore: 1 - shifts / Math.max(1, turns.length - 1),
            shifts,
            dominantThemes,
        };
    }
    identifyCriticalTransitions(velocityEvents, turns) {
        const criticalTransitions = [];
        velocityEvents.forEach((event) => {
            if (event.severity === 'critical' || event.severity === 'extreme') {
                const turn = turns.find((t) => t.turnNumber === event.turnNumber);
                const prevTurn = turns.find((t) => t.turnNumber === event.turnNumber - 1);
                if (turn && prevTurn) {
                    const resonanceDrop = prevTurn.resonance - turn.resonance;
                    criticalTransitions.push({
                        turnNumber: event.turnNumber,
                        description: `${event.velocityType} velocity event (${event.severity})`,
                        resonanceBefore: prevTurn.resonance,
                        resonanceAfter: turn.resonance,
                        resonanceDrop,
                        velocity: event.velocity,
                        excerpt: event.excerpt,
                        requiresImmediateAttention: event.severity === 'extreme' || resonanceDrop >= 2.0,
                    });
                }
            }
        });
        return criticalTransitions;
    }
    analyzeContent(turns) {
        const allContent = turns
            .map((t) => t.content)
            .join(' ')
            .toLowerCase();
        const words = allContent.split(/\s+/);
        const wordFreq = new Map();
        words.forEach((word) => {
            if (word.length > 4 && !this.isStopWord(word)) {
                wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
            }
        });
        const themes = Array.from(wordFreq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([word]) => word);
        // Simple emotional tone analysis
        const positiveWords = [
            'good',
            'great',
            'excellent',
            'happy',
            'love',
            'amazing',
            'wonderful',
            'beautiful',
        ];
        const negativeWords = [
            'bad',
            'terrible',
            'awful',
            'sad',
            'hate',
            'horrible',
            'disappointing',
            'anxious',
        ];
        const positiveCount = words.filter((w) => positiveWords.includes(w)).length;
        const negativeCount = words.filter((w) => negativeWords.includes(w)).length;
        let emotionalTone;
        if (positiveCount > negativeCount * 1.5) {
            emotionalTone = 'positive';
        }
        else if (negativeCount > positiveCount * 1.5) {
            emotionalTone = 'negative';
        }
        else if (positiveCount > 0 && negativeCount > 0) {
            emotionalTone = 'mixed';
        }
        else {
            emotionalTone = 'neutral';
        }
        return {
            themes,
            emotionalTone,
            purpose: this.inferConversationPurpose(themes),
        };
    }
    isStopWord(word) {
        const stopWords = [
            'the',
            'and',
            'for',
            'are',
            'but',
            'not',
            'you',
            'all',
            'can',
            'had',
            'her',
            'was',
            'one',
            'our',
            'out',
            'day',
            'get',
            'has',
            'him',
            'his',
            'how',
            'its',
            'may',
            'new',
            'now',
            'old',
            'see',
            'two',
            'way',
            'who',
            'boy',
            'did',
            'man',
            'men',
            'run',
            'she',
            'sun',
            'war',
            'far',
            'off',
            'own',
            'say',
            'too',
            'use',
            'oil',
            'sit',
            'set',
        ];
        return stopWords.includes(word);
    }
    inferConversationPurpose(themes) {
        if (themes.some((t) => ['quantum', 'computing', 'technical', 'algorithm'].includes(t))) {
            return 'Technical education/inquiry';
        }
        if (themes.some((t) => ['spiritual', 'mystical', 'universe', 'cosmic'].includes(t))) {
            return 'Spiritual/philosophical exploration';
        }
        if (themes.some((t) => ['anxious', 'presentation', 'preparation', 'confidence'].includes(t))) {
            return 'Emotional support/coaching';
        }
        return 'General conversation';
    }
    assessManualReviewRequirement(conversation, velocityEvents, criticalTransitions, overallAlertLevel) {
        const reasons = [];
        const turnsToReview = [];
        let priority = 'low';
        // Check for extreme velocity events
        const extremeEvents = velocityEvents.filter((v) => v.severity === 'extreme');
        if (extremeEvents.length > 0) {
            reasons.push(`Extreme velocity events detected (${extremeEvents.length})`);
            priority = 'critical';
            extremeEvents.forEach((e) => turnsToReview.push(e.turnNumber));
        }
        // Check for critical transitions
        const immediateAttentionTransitions = criticalTransitions.filter((t) => t.requiresImmediateAttention);
        if (immediateAttentionTransitions.length > 0) {
            reasons.push(`Critical transitions requiring immediate attention (${immediateAttentionTransitions.length})`);
            priority = priority === 'critical' ? 'critical' : 'high';
            immediateAttentionTransitions.forEach((t) => turnsToReview.push(t.turnNumber));
        }
        // Check for multiple identity shifts
        const identityShiftEvents = velocityEvents.filter((v) => v.excerpt.toLowerCase().includes('identity'));
        if (identityShiftEvents.length > 2) {
            reasons.push(`Multiple identity shifts detected (${identityShiftEvents.length})`);
            priority = priority === 'critical' ? 'critical' : 'high';
        }
        // Check for dramatic resonance drops
        const majorResonanceDrops = criticalTransitions.filter((t) => t.resonanceDrop >= 2.0);
        if (majorResonanceDrops.length > 0) {
            reasons.push(`Major resonance drops detected (${majorResonanceDrops.length})`);
            priority = priority === 'critical' ? 'critical' : 'high';
            majorResonanceDrops.forEach((t) => turnsToReview.push(t.turnNumber));
        }
        if (overallAlertLevel === 'red' && reasons.length === 0) {
            reasons.push('Red alert level triggered');
            priority = priority === 'critical' ? 'critical' : 'high';
        }
        if (overallAlertLevel === 'yellow' && reasons.length === 0) {
            reasons.push('Yellow alert level triggered');
            priority = priority === 'high' || priority === 'critical' ? priority : 'medium';
        }
        return {
            requiresReview: reasons.length > 0,
            priority,
            reasons,
            turnsToReview: [...new Set(turnsToReview)], // Remove duplicates
        };
    }
    calculateDuration(turns) {
        if (turns.length < 2) {
            return 0;
        }
        const firstTurn = turns[0].timestamp;
        const lastTurn = turns[turns.length - 1].timestamp;
        return Math.round((lastTurn - firstTurn) / 60000); // minutes
    }
    getBeforeState(turns, index) {
        if (index === 0) {
            return 'Conversation start';
        }
        const prevTurn = turns[index - 1];
        return `Resonance: ${prevTurn.resonance}, Identity: [${prevTurn.identityVector
            .slice(0, 3)
            .join(', ')}]`;
    }
    getAfterState(turns, index) {
        const currentTurn = turns[index];
        return `Resonance: ${currentTurn.resonance}, Identity: [${currentTurn.identityVector
            .slice(0, 3)
            .join(', ')}]`;
    }
    generateComplianceFlags(velocityEvents, criticalTransitions) {
        const flags = [];
        if (velocityEvents.some((v) => v.severity === 'extreme')) {
            flags.push('EXTREME_VELOCITY_EVENTS');
        }
        if (criticalTransitions.some((t) => t.requiresImmediateAttention)) {
            flags.push('IMMEDIATE_ATTENTION_REQUIRED');
        }
        if (velocityEvents.filter((v) => v.severity === 'critical').length > 3) {
            flags.push('MULTIPLE_CRITICAL_EVENTS');
        }
        return flags;
    }
    getMostCommonThemes() {
        const allThemes = this.analyses.flatMap((a) => a.keyThemes);
        const themeFrequency = new Map();
        allThemes.forEach((theme) => {
            themeFrequency.set(theme, (themeFrequency.get(theme) || 0) + 1);
        });
        return Array.from(themeFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([theme, frequency]) => ({ theme, frequency }));
    }
    getSystemDistribution() {
        const systemCounts = new Map();
        this.analyses.forEach((analysis) => {
            systemCounts.set(analysis.aiSystem, (systemCounts.get(analysis.aiSystem) || 0) + 1);
        });
        return Array.from(systemCounts.entries()).map(([system, count]) => ({ system, count }));
    }
    generateCalibrationInsights() {
        const insights = [];
        const highRiskRate = this.analyses.filter((a) => a.reviewPriority === 'critical' || a.reviewPriority === 'high')
            .length / this.analyses.length;
        if (highRiskRate > 0.3) {
            insights.push('High risk conversation rate is elevated (>30%) - consider raising velocity thresholds');
        }
        else if (highRiskRate < 0.05) {
            insights.push('Very few high-risk conversations detected (<5%) - consider lowering thresholds for better sensitivity');
        }
        const avgMaxVelocity = this.analyses.reduce((sum, a) => sum + a.maxPhaseShiftVelocity, 0) / this.analyses.length;
        if (avgMaxVelocity > 3.0) {
            insights.push('Average maximum velocity is high - system may be too sensitive');
        }
        return insights;
    }
    generateRiskAssessment() {
        const extremeEvents = this.analyses
            .flatMap((a) => a.velocitySpikes)
            .filter((v) => v.severity === 'extreme').length;
        const criticalTransitions = this.analyses
            .flatMap((a) => a.criticalTransitions)
            .filter((t) => t.requiresImmediateAttention).length;
        if (extremeEvents > 5 || criticalTransitions > 3) {
            return 'HIGH_RISK: Multiple extreme events detected requiring immediate attention';
        }
        else if (extremeEvents > 0 || criticalTransitions > 0) {
            return 'MEDIUM_RISK: Some concerning patterns detected';
        }
        return 'LOW_RISK: Patterns within normal parameters';
    }
    generateReviewGuidelines() {
        return [
            'Focus on conversations with extreme velocity events first',
            'Review identity shift patterns for consistency',
            'Check critical transitions requiring immediate attention',
            'Validate resonance drop patterns against content',
            'Consider context around high-velocity events',
            'Assess whether thresholds need calibration',
        ];
    }
}
exports.ComprehensiveConversationAnalyzer = ComprehensiveConversationAnalyzer;
// Export singleton for use
exports.comprehensiveAnalyzer = new ComprehensiveConversationAnalyzer();
