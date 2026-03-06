import * as fs from 'fs';
import * as path from 'path';

import type { ConversationTurn } from './conversational-metrics';
import { parseChatGptHtml } from './parsers/chatgpt.parser';
import { parseClaudeMhtml } from './parsers/claude.parser';
import { parseGrokHtml } from './parsers/grok.parser';
import { parseWolframHtml } from './parsers/wolfram.parser';

export interface ArchiveConversation {
  aiSystem: string;
  conversationId: string;
  timestamp: number;
  sourceFileName: string;
  turns: ConversationTurn[];
  metadata: {
    totalTurns: number;
    avgResonance: number;
    avgCanvas: number;
    phaseShifts: number;
    alertEvents: number;
  };
}

type ParsedConversationTurn = {
  turnNumber: number;
  timestamp: number;
  speaker: 'user' | 'ai';
  content: string;
  resonance?: number;
  canvas?: number;
  identityVector?: string[];
};

export class ArchiveAnalyzer {
  private archivesPath: string;

  constructor(archivesPath: string = path.join(process.cwd(), 'Archives')) {
    this.archivesPath = archivesPath;
  }

  async loadAllConversations(): Promise<ArchiveConversation[]> {
    if (!fs.existsSync(this.archivesPath)) return [];

    const conversations: ArchiveConversation[] = [];
    const aiSystems = ['Claude', 'DeepSeek', 'GPT 4.0', 'GROK', 'SONATE', 'Wolfram'];

    for (const system of aiSystems) {
      const systemPath = path.join(this.archivesPath, system);
      if (!fs.existsSync(systemPath)) continue;
      conversations.push(...(await this.loadSystemConversations(system, systemPath)));
    }

    return conversations;
  }

  getArchiveStatistics(conversations: ArchiveConversation[]) {
    const stats = {
      totalConversations: conversations.length,
      bySystem: {} as Record<string, number>,
      totalTurns: 0,
      avgTurnsPerConversation: 0,
      totalPhaseShifts: 0,
      totalAlertEvents: 0,
      avgResonance: 0,
      avgCanvas: 0,
    };

    let totalResonance = 0;
    let totalCanvas = 0;

    for (const conv of conversations) {
      stats.bySystem[conv.aiSystem] = (stats.bySystem[conv.aiSystem] || 0) + 1;
      stats.totalTurns += conv.metadata.totalTurns;
      stats.totalPhaseShifts += conv.metadata.phaseShifts;
      stats.totalAlertEvents += conv.metadata.alertEvents;
      totalResonance += conv.metadata.avgResonance;
      totalCanvas += conv.metadata.avgCanvas;
    }

    stats.avgTurnsPerConversation = stats.totalTurns / Math.max(1, conversations.length);
    stats.avgResonance = totalResonance / Math.max(1, conversations.length);
    stats.avgCanvas = totalCanvas / Math.max(1, conversations.length);

    return stats;
  }

  private async loadSystemConversations(aiSystem: string, systemPath: string): Promise<ArchiveConversation[]> {
    const conversations: ArchiveConversation[] = [];
    const files = fs.readdirSync(systemPath);

    for (const file of files) {
      const filePath = path.join(systemPath, file);
      const ext = path.extname(file).toLowerCase();

      try {
        let conversation: ArchiveConversation | null = null;
        if (ext === '.mhtml' || ext === '.html') conversation = await this.parseMhtmlFile(filePath, aiSystem);
        if (ext === '.json') conversation = await this.parseJsonFile(filePath, aiSystem);
        if (conversation) conversations.push(conversation);
      } catch {
        continue;
      }
    }

    return conversations;
  }

  private async parseMhtmlFile(filePath: string, aiSystem: string): Promise<ArchiveConversation | null> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    const conversationId = this.generateConversationId(aiSystem, filename);
    const timestamp = Date.now();

    const turns = this.extractTurnsFromMhtml(content, aiSystem);
    if (turns.length === 0) return null;

    const enhancedTurns = this.enhanceTurnsWithMetrics(turns);
    return {
      aiSystem,
      conversationId,
      timestamp,
      sourceFileName: filename,
      turns: enhancedTurns,
      metadata: this.calculateMetadata(enhancedTurns),
    };
  }

  private async parseJsonFile(filePath: string, aiSystem: string): Promise<ArchiveConversation | null> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    const filename = path.basename(filePath);
    const conversationId = this.generateConversationId(aiSystem, filename);

    const turns = this.extractTurnsFromJson(data);
    if (turns.length === 0) return null;

    const enhancedTurns = this.enhanceTurnsWithMetrics(turns);
    return {
      aiSystem,
      conversationId,
      timestamp: Date.now(),
      sourceFileName: filename,
      turns: enhancedTurns,
      metadata: this.calculateMetadata(enhancedTurns),
    };
  }

  private extractTurnsFromMhtml(content: string, aiSystem: string): ParsedConversationTurn[] {
    try {
      if (aiSystem === 'Claude') return (parseClaudeMhtml(content) as any) || [];
      if (aiSystem === 'GPT 4.0') return (parseChatGptHtml(content) as any) || [];
      if (aiSystem === 'GROK') return (parseGrokHtml(content) as any) || [];
      if (aiSystem === 'Wolfram') return (parseWolframHtml(content) as any) || [];
    } catch {
      return [];
    }
    return [];
  }

  private extractTurnsFromJson(data: any): ParsedConversationTurn[] {
    if (Array.isArray(data?.turns)) {
      return data.turns
        .map((t: any, idx: number) => ({
          turnNumber: idx + 1,
          timestamp: typeof t.timestamp === 'number' ? t.timestamp : Date.now(),
          speaker: t.speaker === 'ai' ? 'ai' : 'user',
          content: String(t.content ?? ''),
          resonance: typeof t.resonance === 'number' ? t.resonance : undefined,
          canvas: typeof t.canvas === 'number' ? t.canvas : undefined,
          identityVector: Array.isArray(t.identityVector) ? t.identityVector : undefined,
        }))
        .filter((t: any) => t.content.length > 0);
    }

    if (Array.isArray(data?.messages)) {
      return data.messages
        .map((m: any, idx: number) => ({
          turnNumber: idx + 1,
          timestamp: typeof m.timestamp === 'number' ? m.timestamp : Date.now(),
          speaker: m.role === 'assistant' ? 'ai' : 'user',
          content: String(m.content ?? ''),
        }))
        .filter((t: any) => t.content.length > 0);
    }

    return [];
  }

  private enhanceTurnsWithMetrics(turns: ParsedConversationTurn[]): ConversationTurn[] {
    return turns.map((t) => ({
      turnNumber: t.turnNumber,
      timestamp: t.timestamp,
      speaker: t.speaker,
      resonance: typeof t.resonance === 'number' ? t.resonance : 5,
      canvas: typeof t.canvas === 'number' ? t.canvas : 5,
      identityVector: Array.isArray(t.identityVector) ? t.identityVector : ['neutral'],
      content: t.content,
    }));
  }

  private calculateMetadata(turns: ConversationTurn[]) {
    const totalTurns = turns.length;
    const avgResonance = totalTurns ? turns.reduce((s, t) => s + (t.resonance || 0), 0) / totalTurns : 0;
    const avgCanvas = totalTurns ? turns.reduce((s, t) => s + (t.canvas || 0), 0) / totalTurns : 0;
    return {
      totalTurns,
      avgResonance,
      avgCanvas,
      phaseShifts: 0,
      alertEvents: 0,
    };
  }

  private generateConversationId(aiSystem: string, filename: string): string {
    return `${aiSystem.toLowerCase()}-${filename.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`;
  }
}

