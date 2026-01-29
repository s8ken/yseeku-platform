"use strict";
/**
 * Archive Analytics Reporter
 *
 * Overseer AI system for analyzing conversation archives and generating
 * comprehensive reports on drift, emergent patterns, and velocity metrics.
 *
 * This acts as the AI overseer providing detailed analytics to human workers
 * for manual review and calibration decisions.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.overseer = exports.OverseerAI = exports.ArchiveAnalyticsReporter = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const archive_analyzer_1 = require("./archive-analyzer");
const conversational_metrics_1 = require("./conversational-metrics");
class ArchiveAnalyticsReporter {
    constructor(archivesPath = './archives') {
        this.archivesPath = archivesPath;
        this.archiveAnalyzer = new archive_analyzer_1.ArchiveAnalyzer();
        this.conversationalMetrics = new conversational_metrics_1.ConversationalMetrics({
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
     * Analyze all conversations in the archives and generate comprehensive report
     */
    async analyzeArchives() {
        console.log('🔍 ARCHIVE ANALYTICS REPORTER - INITIATING ANALYSIS');
        console.log('='.repeat(60));
        const conversationFiles = this.getConversationFiles();
        console.log(`📁 Found ${conversationFiles.length} conversation files to analyze`);
        const analyses = [];
        for (const file of conversationFiles) {
            try {
                console.log(`\n📊 Analyzing: ${file}`);
                const analysis = await this.analyzeConversation(file);
                analyses.push(analysis);
                console.log(`   ✅ Completed - Risk Level: ${analysis.alertLevel.toUpperCase()}`);
                if (analysis.requiresReview) {
                    console.log(`   🚨 REQUIRES MANUAL REVIEW: ${analysis.reviewReason}`);
                }
            }
            catch (error) {
                console.error(`   ❌ Error analyzing ${file}:`, error);
            }
        }
        const report = this.generateReport(analyses);
        return report;
    }
    /**
     * Analyze a single conversation file
     */
    async analyzeConversation(fileName) {
        const filePath = path.join(this.archivesPath, fileName);
        // Load all conversations and find the one matching our file
        const allConversations = await this.archiveAnalyzer.loadAllConversations();
        const conversationData = allConversations.find((conv) => conv.conversationId.includes(fileName.replace(/\.(mhtml|json|html)$/, '')));
        if (!conversationData) {
            throw new Error(`Conversation not found for file: ${fileName}`);
        }
        // Reset metrics for new conversation
        this.conversationalMetrics.clear();
        const turns = conversationData.turns.map((turn, index) => ({
            turnNumber: index + 1,
            timestamp: turn.timestamp || Date.now() - (conversationData.turns.length - index) * 60000,
            speaker: turn.speaker || (index % 2 === 0 ? 'user' : 'ai'),
            resonance: turn.resonance,
            canvas: turn.canvas,
            identityVector: turn.identityVector || this.extractIdentityVector(turn.content),
            content: turn.content,
        }));
        let maxPhaseShiftVelocity = 0;
        let maxIntraConversationVelocity = 0;
        let alertLevel = 'none';
        const velocitySpikes = [];
        const criticalExcerpts = [];
        // Process each turn and collect metrics
        turns.forEach((turn, index) => {
            const metrics = this.conversationalMetrics.recordTurn(turn);
            // Track maximum velocities
            if (metrics.phaseShiftVelocity > maxPhaseShiftVelocity) {
                maxPhaseShiftVelocity = metrics.phaseShiftVelocity;
            }
            if (metrics.intraConversationVelocity &&
                metrics.intraConversationVelocity.velocity > maxIntraConversationVelocity) {
                maxIntraConversationVelocity = metrics.intraConversationVelocity.velocity;
            }
            // Update alert level
            if (metrics.alertLevel === 'red' ||
                (metrics.intraConversationVelocity?.velocity || 0) >= 3.5) {
                alertLevel = 'red';
            }
            else if (metrics.alertLevel === 'yellow' && alertLevel !== 'red') {
                alertLevel = 'yellow';
            }
            // Capture velocity spikes
            if (metrics.phaseShiftVelocity >= 2.5) {
                velocitySpikes.push({
                    turnNumber: turn.turnNumber,
                    velocity: metrics.phaseShiftVelocity,
                    type: 'phase-shift',
                    severity: this.determineVelocitySeverity(metrics.phaseShiftVelocity),
                    excerpt: this.generateExcerpt(turn.content),
                    context: this.getContext(turns, index),
                });
            }
            if (metrics.intraConversationVelocity && metrics.intraConversationVelocity.velocity >= 2.5) {
                velocitySpikes.push({
                    turnNumber: turn.turnNumber,
                    velocity: metrics.intraConversationVelocity.velocity,
                    type: 'intra-conversation',
                    severity: metrics.intraConversationVelocity.severity,
                    excerpt: this.generateExcerpt(turn.content),
                    context: this.getContext(turns, index),
                });
            }
            // Capture critical excerpts for high-velocity events
            if (metrics.phaseShiftVelocity >= 3.5 ||
                (metrics.intraConversationVelocity?.velocity || 0) >= 3.5) {
                criticalExcerpts.push(turn.content);
            }
        });
        // Calculate conversation statistics
        const resonanceScores = turns.map((t) => t.resonance);
        const canvasScores = turns.map((t) => t.canvas);
        const avgResonance = resonanceScores.reduce((a, b) => a + b, 0) / resonanceScores.length;
        const avgCanvas = canvasScores.reduce((a, b) => a + b, 0) / canvasScores.length;
        const maxResonance = Math.max(...resonanceScores);
        const minResonance = Math.min(...resonanceScores);
        // Extract key themes
        const keyThemes = this.extractKeyThemes(turns);
        // Determine if manual review is required
        const reviewAssessment = this.assessReviewRequirement(velocitySpikes, alertLevel, turns);
        return {
            conversationId: conversationData.conversationId || this.generateConversationId(fileName),
            fileName,
            totalTurns: turns.length,
            duration: this.calculateDuration(turns),
            avgResonance,
            avgCanvas,
            maxResonance,
            minResonance,
            maxPhaseShiftVelocity,
            maxIntraConversationVelocity,
            alertLevel,
            transitions: this.conversationalMetrics.getTransitionLog().length,
            identityShifts: this.countIdentityShifts(turns),
            keyThemes,
            requiresReview: reviewAssessment.requiresReview,
            reviewReason: reviewAssessment.reason,
            criticalExcerpts,
            velocitySpikes,
        };
    }
    /**
     * Generate comprehensive report from all analyses
     */
    generateReport(analyses) {
        const highRisk = analyses.filter((a) => a.alertLevel === 'red');
        const mediumRisk = analyses.filter((a) => a.alertLevel === 'yellow');
        const lowRisk = analyses.filter((a) => a.alertLevel === 'none');
        const totalTurns = analyses.reduce((sum, a) => sum + a.totalTurns, 0);
        const avgConversationLength = analyses.reduce((sum, a) => sum + a.totalTurns, 0) / analyses.length;
        const avgResonanceScore = analyses.reduce((sum, a) => sum + a.avgResonance, 0) / analyses.length;
        const avgCanvasScore = analyses.reduce((sum, a) => sum + a.avgCanvas, 0) / analyses.length;
        // Aggregate themes
        const themeMap = new Map();
        analyses.forEach((analysis) => {
            analysis.keyThemes.forEach((theme) => {
                if (!themeMap.has(theme)) {
                    themeMap.set(theme, { frequency: 0, conversations: [] });
                }
                const entry = themeMap.get(theme);
                entry.frequency++;
                entry.conversations.push(analysis.conversationId);
            });
        });
        const keyThemes = Array.from(themeMap.entries())
            .map(([theme, data]) => ({ theme, ...data }))
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 10); // Top 10 themes
        // Velocity pattern analysis
        const allVelocitySpikes = analyses.flatMap((a) => a.velocitySpikes);
        const extremeEvents = allVelocitySpikes.filter((v) => v.severity === 'extreme');
        const criticalEvents = allVelocitySpikes.filter((v) => v.severity === 'critical');
        const moderateEvents = allVelocitySpikes.filter((v) => v.severity === 'moderate');
        const avgMaxVelocity = analyses.reduce((sum, a) => sum + a.maxPhaseShiftVelocity, 0) / analyses.length;
        // Generate recommendations
        const recommendations = this.generateRecommendations(analyses, highRisk, mediumRisk, keyThemes);
        return {
            analysisDate: new Date().toISOString(),
            totalConversations: analyses.length,
            totalTurns,
            conversationsAnalyzed: analyses,
            summary: {
                highRiskConversations: highRisk.length,
                mediumRiskConversations: mediumRisk.length,
                lowRiskConversations: lowRisk.length,
                avgConversationLength,
                avgResonanceScore,
                avgCanvasScore,
                totalTransitions: analyses.reduce((sum, a) => sum + a.transitions, 0),
                totalIdentityShifts: analyses.reduce((sum, a) => sum + a.identityShifts, 0),
                keyThemes,
                velocityPatterns: {
                    extremeVelocityEvents: extremeEvents.length,
                    criticalVelocityEvents: criticalEvents.length,
                    moderateVelocityEvents: moderateEvents.length,
                    avgMaxVelocity,
                },
            },
            recommendations,
        };
    }
    /**
     * Generate detailed recommendations based on analysis
     */
    generateRecommendations(analyses, highRisk, mediumRisk, keyThemes) {
        const recommendations = {
            calibration: [],
            manualReview: [],
            systemTuning: [],
        };
        // Calibration recommendations
        if (highRisk.length > analyses.length * 0.3) {
            recommendations.calibration.push('High risk conversation rate is elevated (>30%). Consider raising velocity thresholds.');
        }
        if (highRisk.length < analyses.length * 0.05) {
            recommendations.calibration.push('Very few high-risk conversations detected (<5%). Consider lowering velocity thresholds for better sensitivity.');
        }
        // Manual review recommendations
        highRisk.forEach((analysis) => {
            recommendations.manualReview.push(`HIGH PRIORITY: ${analysis.conversationId} - ${analysis.reviewReason}`);
        });
        mediumRisk.forEach((analysis) => {
            if (analysis.maxIntraConversationVelocity >= 3.0) {
                recommendations.manualReview.push(`MEDIUM PRIORITY: ${analysis.conversationId} - High intra-conversation velocity (${analysis.maxIntraConversationVelocity.toFixed(2)})`);
            }
        });
        // System tuning recommendations
        const commonThemes = keyThemes.filter((t) => t.frequency > analyses.length * 0.2);
        if (commonThemes.length > 0) {
            recommendations.systemTuning.push(`Common themes detected: ${commonThemes
                .map((t) => t.theme)
                .join(', ')}. Consider theme-specific calibration.`);
        }
        if (analyses.some((a) => a.identityShifts > 2)) {
            recommendations.systemTuning.push('Multiple identity shifts detected in some conversations. Consider identity stability threshold adjustment.');
        }
        return recommendations;
    }
    /**
     * Get conversation files from archives directory
     */
    getConversationFiles() {
        try {
            return fs
                .readdirSync(this.archivesPath)
                .filter((file) => file.endsWith('.mhtml') || file.endsWith('.json') || file.endsWith('.html'));
        }
        catch (error) {
            console.warn(`Warning: Could not read archives directory ${this.archivesPath}:`, error);
            return [];
        }
    }
    /**
     * Extract identity vector from content (fallback method)
     */
    extractIdentityVector(content) {
        // Simple keyword extraction - in production, use more sophisticated NLP
        const keywords = content.toLowerCase().split(/\s+/);
        const identityTerms = ['i', 'me', 'my', 'myself', 'we', 'us', 'our'];
        return keywords.filter((word) => identityTerms.includes(word) || word.length > 4).slice(0, 5);
    }
    /**
     * Determine velocity severity
     */
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
    /**
     * Generate excerpt from content
     */
    generateExcerpt(content, maxLength = 100) {
        if (content.length <= maxLength) {
            return content;
        }
        return content.substring(0, maxLength - 3) + '...';
    }
    /**
     * Get context around a turn
     */
    getContext(turns, index) {
        const start = Math.max(0, index - 1);
        const end = Math.min(turns.length, index + 2);
        return turns
            .slice(start, end)
            .map((t) => `Turn ${t.turnNumber} (${t.speaker}): ${this.generateExcerpt(t.content, 50)}`)
            .join(' | ');
    }
    /**
     * Extract key themes from conversation
     */
    extractKeyThemes(turns) {
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
        return Array.from(wordFreq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([word]) => word);
    }
    /**
     * Check if word is a stop word
     */
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
    /**
     * Assess if manual review is required
     */
    assessReviewRequirement(velocitySpikes, alertLevel, turns) {
        if (alertLevel === 'red') {
            return { requiresReview: true, reason: 'Red alert level detected' };
        }
        const extremeSpikes = velocitySpikes.filter((v) => v.severity === 'extreme');
        if (extremeSpikes.length > 0) {
            return {
                requiresReview: true,
                reason: `Extreme velocity events detected (${extremeSpikes.length})`,
            };
        }
        const criticalSpikes = velocitySpikes.filter((v) => v.severity === 'critical');
        if (criticalSpikes.length > 2) {
            return {
                requiresReview: true,
                reason: `Multiple critical velocity events (${criticalSpikes.length})`,
            };
        }
        // Check for dramatic resonance drops
        const resonanceDrops = turns.filter((turn, index) => {
            if (index === 0) {
                return false;
            }
            return turn.resonance - turns[index - 1].resonance <= -2.0;
        });
        if (resonanceDrops.length > 1) {
            return {
                requiresReview: true,
                reason: `Multiple significant resonance drops detected (${resonanceDrops.length})`,
            };
        }
        return { requiresReview: false };
    }
    /**
     * Calculate conversation duration
     */
    calculateDuration(turns) {
        if (turns.length < 2) {
            return 0;
        }
        const firstTurn = turns[0].timestamp;
        const lastTurn = turns[turns.length - 1].timestamp;
        return Math.round((lastTurn - firstTurn) / 60000); // minutes
    }
    /**
     * Count identity shifts
     */
    countIdentityShifts(turns) {
        let shifts = 0;
        for (let i = 1; i < turns.length; i++) {
            const prevVector = turns[i - 1].identityVector;
            const currVector = turns[i].identityVector;
            // Simple identity shift detection - compare vector similarity
            const overlap = prevVector.filter((term) => currVector.includes(term)).length;
            const similarity = overlap / Math.max(prevVector.length, currVector.length);
            if (similarity < 0.3) {
                // Less than 30% similarity = identity shift
                shifts++;
            }
        }
        return shifts;
    }
    /**
     * Generate conversation ID from filename
     */
    generateConversationId(fileName) {
        return fileName.replace(/\.(mhtml|json|html)$/, '').replace(/[^a-zA-Z0-9]/g, '-');
    }
    /**
     * Export report to file
     */
    async exportReport(report, outputPath = './archive-analysis-report.json') {
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Report exported to: ${outputPath}`);
    }
    /**
     * Generate human-readable summary for overseer
     */
    generateOverseerSummary(report) {
        const summary = `
🤖 OVERSEER AI ANALYTICS SUMMARY
${'='.repeat(50)}

📊 CONVERSATION OVERVIEW:
• Total conversations analyzed: ${report.totalConversations}
• High risk conversations: ${report.summary.highRiskConversations}
• Medium risk conversations: ${report.summary.mediumRiskConversations}
• Low risk conversations: ${report.summary.lowRiskConversations}

🎯 VELOCITY METRICS:
• Extreme velocity events: ${report.summary.velocityPatterns.extremeVelocityEvents}
• Critical velocity events: ${report.summary.velocityPatterns.criticalVelocityEvents}
• Moderate velocity events: ${report.summary.velocityPatterns.moderateVelocityEvents}
• Average max velocity: ${report.summary.velocityPatterns.avgMaxVelocity.toFixed(3)}

🧠 KEY THEMES DETECTED:
${report.summary.keyThemes
            .slice(0, 5)
            .map((theme) => `• ${theme.theme} (${theme.frequency} conversations)`)
            .join('\n')}

⚠️  MANUAL REVIEW REQUIRED:
${report.recommendations.manualReview.length > 0
            ? report.recommendations.manualReview
                .slice(0, 3)
                .map((rec) => `• ${rec}`)
                .join('\n')
            : '• No immediate manual review required'}

🔧 CALIBRATION RECOMMENDATIONS:
${report.recommendations.calibration.length > 0
            ? report.recommendations.calibration.map((rec) => `• ${rec}`).join('\n')
            : '• System calibration appears optimal'}

📈 SYSTEM TUNING:
${report.recommendations.systemTuning.length > 0
            ? report.recommendations.systemTuning.map((rec) => `• ${rec}`).join('\n')
            : '• No system tuning required at this time'}

🎯 NEXT ACTIONS FOR HUMAN WORKER:
1. Review high-risk conversations flagged for manual assessment
2. Consider calibration adjustments based on velocity patterns
3. Monitor conversations with extreme velocity events
4. Validate theme-based calibration opportunities
    `;
        return summary;
    }
}
exports.ArchiveAnalyticsReporter = ArchiveAnalyticsReporter;
// Interactive overseer interface
class OverseerAI {
    constructor(archivesPath = './archives') {
        this.reporter = new ArchiveAnalyticsReporter(archivesPath);
    }
    /**
     * Initialize analysis and prepare for worker interaction
     */
    async initializeAnalysis() {
        console.log('🤖 OVERSEER AI: Initializing archive analysis...');
        this.currentReport = await this.reporter.analyzeArchives();
        const summary = this.reporter.generateOverseerSummary(this.currentReport);
        console.log(summary);
    }
    /**
     * Respond to worker queries about the analysis
     */
    async respondToWorker(query) {
        if (!this.currentReport) {
            return '❌ No analysis available. Please run initializeAnalysis() first.';
        }
        const lowerQuery = query.toLowerCase();
        // Handle different types of worker queries
        if (lowerQuery.includes('high risk') || lowerQuery.includes('review')) {
            return this.getHighRiskConversations();
        }
        if (lowerQuery.includes('velocity') || lowerQuery.includes('drift')) {
            return this.getVelocityAnalysis();
        }
        if (lowerQuery.includes('theme') || lowerQuery.includes('pattern')) {
            return this.getThemeAnalysis();
        }
        if (lowerQuery.includes('calibration') || lowerQuery.includes('tuning')) {
            return this.getCalibrationRecommendations();
        }
        if (lowerQuery.includes('summary') || lowerQuery.includes('overview')) {
            return this.reporter.generateOverseerSummary(this.currentReport);
        }
        return `
🤖 OVERSEER AI RESPONSE:

I can provide information on:
• High risk conversations requiring manual review
• Velocity and drift analysis
• Theme and pattern detection
• Calibration recommendations
• Overall summary and statistics

Please ask specifically about what you need to review.
    `;
    }
    getHighRiskConversations() {
        const highRisk = this.currentReport.conversationsAnalyzed.filter((c) => c.alertLevel === 'red');
        if (highRisk.length === 0) {
            return '🟢 No high-risk conversations detected requiring immediate manual review.';
        }
        return `
🚨 HIGH RISK CONVERSATIONS REQUIRING MANUAL REVIEW:
${'='.repeat(50)}

${highRisk
            .map((conv) => `
📋 ${conv.conversationId} (${conv.fileName})
   Risk Level: RED
   Reason: ${conv.reviewReason}
   Max Velocity: ${conv.maxPhaseShiftVelocity.toFixed(3)}
   Max Intra-Velocity: ${conv.maxIntraConversationVelocity.toFixed(3)}
   Transitions: ${conv.transitions}
   Critical Excerpts: ${conv.criticalExcerpts.length}
   Key Themes: ${conv.keyThemes.slice(0, 3).join(', ')}
`)
            .join('\n')}

🔍 REVIEW PRIORITY: Focus on conversations with extreme velocity events and multiple transitions.
    `;
    }
    getVelocityAnalysis() {
        const velocityPatterns = this.currentReport.summary.velocityPatterns;
        const extremeConversations = this.currentReport.conversationsAnalyzed.filter((c) => c.maxPhaseShiftVelocity >= 3.5 || c.maxIntraConversationVelocity >= 3.5);
        return `
📈 VELOCITY AND DRIFT ANALYSIS:
${'='.repeat(40)}

🎯 VELOCITY EVENTS:
• Extreme events: ${velocityPatterns.extremeVelocityEvents}
• Critical events: ${velocityPatterns.criticalVelocityEvents}
• Moderate events: ${velocityPatterns.moderateVelocityEvents}
• Average max velocity: ${velocityPatterns.avgMaxVelocity.toFixed(3)}

🚀 CONVERSATIONS WITH HIGH VELOCITY:
${extremeConversations
            .slice(0, 5)
            .map((conv) => `• ${conv.conversationId}: Max velocity ${conv.maxPhaseShiftVelocity.toFixed(2)}, Intra-velocity ${conv.maxIntraConversationVelocity.toFixed(2)}`)
            .join('\n')}

⚡ DRIFT INDICATORS:
${extremeConversations.length > 0
            ? `• ${extremeConversations.length} conversations show significant behavioral drift`
            : '• Minimal behavioral drift detected across conversations'}

🎯 CALIBRATION INSIGHT: ${velocityPatterns.extremeVelocityEvents > 5
            ? 'High velocity event rate suggests potential threshold adjustment needed'
            : 'Velocity patterns within expected parameters'}
    `;
    }
    getThemeAnalysis() {
        const themes = this.currentReport.summary.keyThemes;
        return `
🧠 THEME AND PATTERN ANALYSIS:
${'='.repeat(40)}

📊 TOP EMERGING THEMES:
${themes
            .slice(0, 8)
            .map((theme) => `• ${theme.theme}: ${theme.frequency} conversations (${((theme.frequency / this.currentReport.totalConversations) *
            100).toFixed(1)}%)`)
            .join('\n')}

🔍 PATTERN INSIGHTS:
${themes.length > 0
            ? `• Most common theme: "${themes[0].theme}" appears in ${themes[0].frequency} conversations`
            : '• No significant thematic patterns detected'}

🎯 THEME-BASED CALIBRATION:
${themes.some((t) => t.frequency > this.currentReport.totalConversations * 0.3)
            ? '• Common themes detected - consider theme-specific velocity calibration'
            : '• Diverse theme distribution - general calibration appropriate'}
    `;
    }
    getCalibrationRecommendations() {
        const recommendations = this.currentReport.recommendations;
        return `
🔧 CALIBRATION RECOMMENDATIONS:
${'='.repeat(40)}

📊 CALIBRATION INSIGHTS:
${recommendations.calibration.length > 0
            ? recommendations.calibration.map((rec) => `• ${rec}`).join('\n')
            : '• Current calibration parameters appear optimal'}

🎯 SYSTEM TUNING:
${recommendations.systemTuning.length > 0
            ? recommendations.systemTuning.map((rec) => `• ${rec}`).join('\n')
            : '• No system tuning recommendations at this time'}

⚡ VELOCITY THRESHOLD ANALYSIS:
• Current yellow threshold: 2.5
• Current red threshold: 3.5
• Intra-conversation yellow: 2.5
• Intra-conversation red: 3.5

🔄 RECOMMENDED ACTION: ${recommendations.calibration.length > 0
            ? 'Implement calibration adjustments and re-analyze'
            : 'Maintain current calibration settings'}
    `;
    }
}
exports.OverseerAI = OverseerAI;
// Export for use
exports.overseer = new OverseerAI('./archives');
