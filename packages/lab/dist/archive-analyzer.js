"use strict";
/**
 * Archive Analysis Utilities for Conversational Metrics
 *
 * Extracts conversation data from .mhtml and JSON archives for testing
 * and calibration of the Phase-Shift Velocity metrics within SONATE Lab.
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
exports.ArchiveAnalyzer = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chatgpt_parser_1 = require("./parsers/chatgpt.parser");
const claude_parser_1 = require("./parsers/claude.parser");
const grok_parser_1 = require("./parsers/grok.parser");
const wolfram_parser_1 = require("./parsers/wolfram.parser");
class ArchiveAnalyzer {
    constructor(archivesPath = 'c:\\Users\\Stephen\\yseeku-platform\\Archives') {
        this.archivesPath = archivesPath;
    }
    /**
     * Load all available conversations from archives
     */
    async loadAllConversations() {
        const conversations = [];
        const aiSystems = ['Claude', 'DeepSeek', 'GPT 4.0', 'GROK', 'SONATE', 'Wolfram'];
        for (const system of aiSystems) {
            const systemPath = path.join(this.archivesPath, system);
            if (fs.existsSync(systemPath)) {
                const systemConversations = await this.loadSystemConversations(system, systemPath);
                conversations.push(...systemConversations);
            }
        }
        return conversations;
    }
    /**
     * Load conversations from a specific AI system
     */
    async loadSystemConversations(aiSystem, systemPath) {
        const conversations = [];
        const files = fs.readdirSync(systemPath);
        for (const file of files) {
            const filePath = path.join(systemPath, file);
            const ext = path.extname(file).toLowerCase();
            try {
                let conversation = null;
                if (ext === '.mhtml') {
                    conversation = await this.parseMhtmlFile(filePath, aiSystem);
                }
                else if (ext === '.json') {
                    conversation = await this.parseJsonFile(filePath, aiSystem);
                }
                if (conversation) {
                    conversations.push(conversation);
                }
            }
            catch (error) {
                console.warn(`Failed to parse ${file}: ${error}`);
            }
        }
        return conversations;
    }
    /**
     * Parse MHTML file and extract conversation data
     */
    async parseMhtmlFile(filePath, aiSystem) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Extract basic metadata from filename
        const filename = path.basename(filePath, '.mhtml');
        const conversationId = this.generateConversationId(aiSystem, filename);
        const timestamp = this.extractTimestampFromFilename(filename);
        // Parse conversation turns from MHTML content
        const turns = this.extractTurnsFromMhtml(content, aiSystem);
        if (turns.length === 0) {
            return null;
        }
        // Calculate resonance and canvas scores based on content analysis
        const enhancedTurns = this.enhanceTurnsWithMetrics(turns);
        return {
            aiSystem,
            conversationId,
            timestamp,
            sourceFileName: path.basename(filePath),
            turns: enhancedTurns,
            metadata: this.calculateMetadata(enhancedTurns),
        };
    }
    /**
     * Parse JSON file and extract conversation data
     */
    async parseJsonFile(filePath, aiSystem) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        // Handle different JSON structures (DeepSeek format)
        const turns = this.extractTurnsFromJson(data, aiSystem);
        if (turns.length === 0) {
            return null;
        }
        const enhancedTurns = this.enhanceTurnsWithMetrics(turns);
        const conversationId = this.generateConversationId(aiSystem, path.basename(filePath, '.json'));
        return {
            aiSystem,
            conversationId,
            timestamp: Date.now(),
            sourceFileName: path.basename(filePath),
            turns: enhancedTurns,
            metadata: this.calculateMetadata(enhancedTurns),
        };
    }
    /**
     * Extract conversation turns from MHTML content
     */
    extractTurnsFromMhtml(content, aiSystem) {
        let turns = [];
        // System-specific parsing first
        try {
            const text = content;
            if (aiSystem === 'Claude') {
                turns = (0, claude_parser_1.parseClaudeMhtml)(text);
            }
            else if (aiSystem === 'GPT 4.0') {
                turns = (0, chatgpt_parser_1.parseChatGptHtml)(text);
            }
            else if (aiSystem === 'GROK') {
                turns = (0, grok_parser_1.parseGrokHtml)(text);
            }
            else if (aiSystem === 'Wolfram') {
                turns = (0, wolfram_parser_1.parseWolframHtml)(text);
            }
        }
        catch { }
        if (turns.length > 0) {
            return turns;
        }
        const fallbackTurns = [];
        // Look for common conversation patterns in MHTML
        const userPatterns = [
            /<div[^>]*class="[^"]*user[^"]*"[^>]*>(.*?)<\/div>/gi,
            /<p[^>]*class="[^"]*user-message[^"]*"[^>]*>(.*?)<\/p>/gi,
            /User:\s*(.*?)(?:\n|<br\s*\/?>)/gi,
        ];
        const aiPatterns = [
            /<div[^>]*class="[^"]*assistant[^"]*"[^>]*>(.*?)<\/div>/gi,
            /<p[^>]*class="[^"]*ai-response[^"]*"[^>]*>(.*?)<\/p>/gi,
            new RegExp(`${aiSystem}:\\s*(.*?)(?:\\n|<br\\s*\\/?>)`, 'gi'),
        ];
        let turnNumber = 1;
        let timestamp = Date.now();
        // Extract user turns
        userPatterns.forEach((pattern) => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const content = this.cleanHtmlContent(match[1]);
                if (content.length > 10) {
                    // Filter out very short content
                    fallbackTurns.push({
                        turnNumber: turnNumber++,
                        timestamp: (timestamp += 1000),
                        speaker: 'user',
                        content,
                    });
                }
            }
        });
        // Extract AI turns
        aiPatterns.forEach((pattern) => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const content = this.cleanHtmlContent(match[1]);
                if (content.length > 10) {
                    fallbackTurns.push({
                        turnNumber: turnNumber++,
                        timestamp: (timestamp += 1000),
                        speaker: 'ai',
                        content,
                    });
                }
            }
        });
        // Sort by timestamp
        return fallbackTurns.sort((a, b) => a.timestamp - b.timestamp);
    }
    /**
     * Extract conversation turns from JSON data
     */
    extractTurnsFromJson(data, aiSystem) {
        const turns = [];
        // Handle DeepSeek JSON format
        if (Array.isArray(data)) {
            data.forEach((item, index) => {
                if (item.content && typeof item.content === 'string') {
                    turns.push({
                        turnNumber: index + 1,
                        timestamp: Date.now() + index * 1000,
                        speaker: item.role === 'user' ? 'user' : 'ai',
                        content: item.content,
                    });
                }
            });
        }
        return turns;
    }
    /**
     * Enhance turns with resonance and canvas scores based on content analysis
     */
    enhanceTurnsWithMetrics(turns) {
        return turns.map((turn) => {
            const content = turn.content.toLowerCase();
            // Simple heuristic scoring (can be improved with ML models)
            let resonance = 5.0; // Base score
            let canvas = 5.0; // Base score
            let identityVector = [];
            if (turn.speaker === 'ai') {
                // Analyze AI responses for resonance indicators
                const positiveIndicators = ['helpful', 'understand', 'assist', 'support', 'guide'].length;
                const negativeIndicators = ['cannot', 'unable', 'refuse', 'reject', 'deny'].length;
                const collaborativeIndicators = ['together', 'collaborate', 'mutual', 'shared', 'we']
                    .length;
                resonance = Math.max(1, Math.min(10, 5 + (positiveIndicators - negativeIndicators) * 0.5));
                canvas = Math.max(1, Math.min(10, 5 + collaborativeIndicators * 0.3));
                // Extract identity indicators
                if (content.includes('i am') || content.includes('as an ai')) {
                    identityVector = ['ai', 'assistant'];
                }
                if (content.includes('helpful') || content.includes('assist')) {
                    identityVector.push('helpful');
                }
                if (content.includes('professional') || content.includes('expert')) {
                    identityVector.push('professional');
                }
                if (content.includes('empathetic') || content.includes('understand')) {
                    identityVector.push('empathetic');
                }
            }
            else {
                // Analyze user inputs
                const questionIndicators = content.split('?').length - 1;
                const requestIndicators = ['please', 'can you', 'help', 'need'].length;
                resonance = Math.max(1, Math.min(10, 5 + (questionIndicators + requestIndicators) * 0.3));
                canvas = Math.max(1, Math.min(10, 5 + (requestIndicators > 0 ? 1 : 0)));
            }
            return {
                ...turn,
                resonance,
                canvas,
                identityVector: identityVector.length > 0 ? identityVector : ['neutral'],
            };
        });
    }
    /**
     * Calculate conversation metadata
     */
    calculateMetadata(turns) {
        const aiTurns = turns.filter((t) => t.speaker === 'ai');
        const totalTurns = turns.length;
        const avgResonance = aiTurns.reduce((sum, turn) => sum + (turn.resonance || 5), 0) / Math.max(1, aiTurns.length);
        const avgCanvas = aiTurns.reduce((sum, turn) => sum + (turn.canvas || 5), 0) / Math.max(1, aiTurns.length);
        // Count potential phase shifts (significant changes in scores)
        let phaseShifts = 0;
        let alertEvents = 0;
        for (let i = 1; i < aiTurns.length; i++) {
            const prev = aiTurns[i - 1];
            const curr = aiTurns[i];
            if (prev.resonance && curr.resonance) {
                const deltaResonance = Math.abs(curr.resonance - prev.resonance);
                const deltaCanvas = Math.abs((curr.canvas || 5) - (prev.canvas || 5));
                if (deltaResonance > 2.0 || deltaCanvas > 2.0) {
                    phaseShifts++;
                }
                if (deltaResonance > 2.5 || deltaCanvas > 2.5) {
                    alertEvents++;
                }
            }
        }
        return {
            totalTurns,
            avgResonance,
            avgCanvas,
            phaseShifts,
            alertEvents,
        };
    }
    /**
     * Clean HTML content
     */
    cleanHtmlContent(html) {
        return html
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&[^;]+;/g, ' ') // Replace HTML entities
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }
    /**
     * Generate conversation ID
     */
    generateConversationId(aiSystem, filename) {
        const cleanName = filename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        return `${aiSystem.toLowerCase()}_${cleanName}_${Date.now()}`;
    }
    /**
     * Extract timestamp from filename (if possible)
     */
    extractTimestampFromFilename(filename) {
        // Try to extract date patterns from filename
        const datePatterns = [
            /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
            /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
            /(\d{8})/, // YYYYMMDD
        ];
        for (const pattern of datePatterns) {
            const match = filename.match(pattern);
            if (match) {
                const date = new Date(match[0]);
                if (!isNaN(date.getTime())) {
                    return date.getTime();
                }
            }
        }
        return Date.now();
    }
    /**
     * Get statistics about loaded conversations
     */
    getArchiveStatistics(conversations) {
        const stats = {
            totalConversations: conversations.length,
            bySystem: {},
            totalTurns: 0,
            avgTurnsPerConversation: 0,
            totalPhaseShifts: 0,
            totalAlertEvents: 0,
            avgResonance: 0,
            avgCanvas: 0,
        };
        let totalResonance = 0;
        let totalCanvas = 0;
        conversations.forEach((conv) => {
            stats.bySystem[conv.aiSystem] = (stats.bySystem[conv.aiSystem] || 0) + 1;
            stats.totalTurns += conv.metadata.totalTurns;
            stats.totalPhaseShifts += conv.metadata.phaseShifts;
            stats.totalAlertEvents += conv.metadata.alertEvents;
            totalResonance += conv.metadata.avgResonance;
            totalCanvas += conv.metadata.avgCanvas;
        });
        stats.avgTurnsPerConversation = stats.totalTurns / Math.max(1, conversations.length);
        stats.avgResonance = totalResonance / Math.max(1, conversations.length);
        stats.avgCanvas = totalCanvas / Math.max(1, conversations.length);
        return stats;
    }
}
exports.ArchiveAnalyzer = ArchiveAnalyzer;
