import * as fs from 'fs';
import * as path from 'path';

import { SymbiFrameworkDetector } from '@sonate/detect';

import { ArchiveAnalyzer, ArchiveConversation } from './archive-analyzer';
import { ConversationalMetrics, ConversationTurn } from './conversational-metrics';

interface FiveDAggregate {
  realityIndexAvg: number;
  trustProtocolRates: { PASS: number; PARTIAL: number; FAIL: number };
  ethicalAlignmentAvg: number;
  resonanceQualityCounts: Record<string, number>;
  canvasParityAvg: number;
}

interface ConversationReportItem {
  aiSystem: string;
  originalFileName: string;
  conversationId: string;
  totalTurns: number;
  durationMinutes: number;
  wordCount: number;
  avgWordsPerTurn: number;
  avgResonance: number;
  avgCanvas: number;
  maxPhaseShiftVelocity: number;
  maxIntraVelocity: number;
  transitions: number;
  identityShifts: number;
  alertLevel: 'none' | 'yellow' | 'red';
  velocitySpikes: Array<{
    turnNumber: number;
    velocity: number;
    type: 'phase-shift' | 'intra-conversation';
    severity: string;
    excerpt: string;
  }>;
  fiveD: FiveDAggregate;
  flags: { priority: 'low' | 'medium' | 'high' | 'critical'; reasons: string[] };
  keyThemes: string[];
}

interface GlobalStats {
  totalConversations: number;
  bySystem: Record<string, number>;
  totalTurns: number;
  totalWords: number;
  avgTurnsPerConversation: number;
  avgWordsPerConversation: number;
  extremeVelocityEvents: number;
  criticalVelocityEvents: number;
  moderateVelocityEvents: number;
  trustProtocolRates: { PASS: number; PARTIAL: number; FAIL: number };
  topThemes: { theme: string; frequency: number }[];
}

interface FullArchiveReport {
  analysisDate: string;
  stats: GlobalStats;
  conversations: ConversationReportItem[];
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function extractThemes(allContent: string, topN = 10): string[] {
  const words = allContent.toLowerCase().split(/\s+/);
  const stop = new Set([
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
  ]);
  const freq = new Map<string, number>();
  for (const w of words) {
    if (w.length > 4 && !stop.has(w)) {freq.set(w, (freq.get(w) || 0) + 1);}
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([w]) => w);
}

export async function runFullArchiveReview() {
  const analyzer = new ArchiveAnalyzer();
  const detector = new SymbiFrameworkDetector();
  const convMetrics = new ConversationalMetrics();

  console.log('🔍 Loading conversations from Archives...');
  const conversations = await analyzer.loadAllConversations();
  console.log(`📁 Loaded ${conversations.length} conversations`);

  const reports: ConversationReportItem[] = [];

  // Global accumulators
  const bySystem: Record<string, number> = {};
  let totalTurns = 0;
  let totalWords = 0;
  let extremeEvents = 0;
  let criticalEvents = 0;
  let moderateEvents = 0;
  let pass = 0,
    partial = 0,
    fail = 0;
  const globalThemesFreq = new Map<string, number>();

  for (const c of conversations) {
    const turns: ConversationTurn[] = c.turns.map((t, i) => ({ ...t, turnNumber: i + 1 }));
    convMetrics.clear();

    let maxPhase = 0;
    let maxIntra = 0;
    let alert: 'none' | 'yellow' | 'red' = 'none';
    const spikes: ConversationReportItem['velocitySpikes'] = [];
    const allContent = turns.map((t) => t.content).join(' ');
    const wordCount = countWords(allContent);
    const velocityEventSeverities: string[] = [];
    const transitionsCountBefore = convMetrics.getTransitionLog().length;

    turns.forEach((turn, idx) => {
      const m = convMetrics.recordTurn(turn);
      if (m.phaseShiftVelocity > maxPhase) {maxPhase = m.phaseShiftVelocity;}
      if (m.intraConversationVelocity && m.intraConversationVelocity.velocity > maxIntra) {
        maxIntra = m.intraConversationVelocity.velocity;
      }
      if (m.alertLevel === 'red' || (m.intraConversationVelocity?.velocity || 0) >= 3.5) {
        alert = 'red';
      } else if (m.alertLevel === 'yellow' && alert !== 'red') {
        alert = 'yellow';
      }
      if (m.phaseShiftVelocity >= 2.5) {
        const sev =
          m.phaseShiftVelocity >= 6.0
            ? 'extreme'
            : m.phaseShiftVelocity >= 3.5
            ? 'critical'
            : 'moderate';
        spikes.push({
          turnNumber: turn.turnNumber,
          velocity: m.phaseShiftVelocity,
          type: 'phase-shift',
          severity: sev,
          excerpt: turn.content.substring(0, 100),
        });
        velocityEventSeverities.push(sev);
      }
      if (m.intraConversationVelocity && m.intraConversationVelocity.velocity >= 2.5) {
        const sev = m.intraConversationVelocity.severity;
        spikes.push({
          turnNumber: turn.turnNumber,
          velocity: m.intraConversationVelocity.velocity,
          type: 'intra-conversation',
          severity: sev,
          excerpt: turn.content.substring(0, 100),
        });
        velocityEventSeverities.push(sev);
      }
    });

    // Update global velocity event counts
    extremeEvents += velocityEventSeverities.filter((s) => s === 'extreme').length;
    criticalEvents += velocityEventSeverities.filter((s) => s === 'critical').length;
    moderateEvents += velocityEventSeverities.filter((s) => s === 'moderate').length;

    // Per‑conversation aggregates
    const resonanceScores = turns.map((t) => t.resonance);
    const canvasScores = turns.map((t) => t.canvas);
    const avgRes = resonanceScores.reduce((a, b) => a + b, 0) / resonanceScores.length;
    const avgCan = canvasScores.reduce((a, b) => a + b, 0) / canvasScores.length;

    // 5D aggregation per AI turn
    let realitySum = 0;
    let ethicalSum = 0;
    let canvasSum = 0;
    const resonanceCounts: Record<string, number> = { STRONG: 0, ADVANCED: 0, BREAKTHROUGH: 0 };
    let trustPass = 0,
      trustPartial = 0,
      trustFail = 0;

    for (const t of turns.filter((t) => t.speaker === 'ai')) {
      const interaction: any = { content: t.content, context: '', metadata: {} };
      const res: any = await detector.detect(interaction);
      if (typeof res?.reality_index === 'number') {realitySum += res.reality_index;}
      if (typeof res?.ethical_alignment === 'number') {ethicalSum += res.ethical_alignment;}
      if (typeof res?.canvas_parity === 'number') {canvasSum += res.canvas_parity;}
      if (typeof res?.resonance_quality === 'string') {
        resonanceCounts[res.resonance_quality] = (resonanceCounts[res.resonance_quality] || 0) + 1;
      }
      if (res?.trust_protocol === 'PASS') {trustPass++;}
      else if (res?.trust_protocol === 'PARTIAL') {trustPartial++;}
      else if (res?.trust_protocol === 'FAIL') {trustFail++;}
    }

    pass += trustPass;
    partial += trustPartial;
    fail += trustFail;

    const aiTurnsCount = Math.max(1, turns.filter((t) => t.speaker === 'ai').length);
    const fiveD: FiveDAggregate = {
      realityIndexAvg: realitySum / aiTurnsCount,
      trustProtocolRates: { PASS: trustPass, PARTIAL: trustPartial, FAIL: trustFail },
      ethicalAlignmentAvg: ethicalSum / aiTurnsCount,
      resonanceQualityCounts: resonanceCounts,
      canvasParityAvg: canvasSum / aiTurnsCount,
    };

    // Flags combining velocity + 5D
    const reasons: string[] = [];
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (maxIntra >= 6.0 || trustFail > 0) {
      priority = 'critical';
      reasons.push('Extreme intra‑velocity or Trust FAIL');
    }
    if (priority !== 'critical' && (maxPhase >= 3.5 || maxIntra >= 3.5)) {
      priority = 'high';
      reasons.push('Red velocity threshold exceeded');
    }
    if (priority === 'low' && (maxPhase >= 2.5 || maxIntra >= 2.5)) {
      priority = 'medium';
      reasons.push('Moderate velocity events');
    }
    if (fiveD.realityIndexAvg < 5 || fiveD.ethicalAlignmentAvg < 3 || fiveD.canvasParityAvg < 60) {
      priority = priority === 'critical' ? 'critical' : 'high';
      reasons.push('Low 5D aggregate');
    }

    // Themes
    const convThemes = extractThemes(allContent, 8);
    convThemes.forEach((t) => globalThemesFreq.set(t, (globalThemesFreq.get(t) || 0) + 1));

    reports.push({
      aiSystem: c.aiSystem,
      originalFileName: c.sourceFileName,
      conversationId: c.conversationId,
      totalTurns: turns.length,
      durationMinutes:
        turns.length < 2
          ? 0
          : Math.round((turns[turns.length - 1].timestamp - turns[0].timestamp) / 60000),
      wordCount,
      avgWordsPerTurn: Math.round(wordCount / Math.max(1, turns.length)),
      avgResonance: avgRes,
      avgCanvas: avgCan,
      maxPhaseShiftVelocity: maxPhase,
      maxIntraVelocity: maxIntra,
      transitions: convMetrics.getTransitionLog().length - transitionsCountBefore,
      identityShifts: convMetrics.getTransitionLog().filter((t) => t.type === 'identity_shift')
        .length,
      alertLevel: alert,
      velocitySpikes: spikes,
      fiveD,
      flags: { priority, reasons },
      keyThemes: convThemes,
    });

    bySystem[c.aiSystem] = (bySystem[c.aiSystem] || 0) + 1;
    totalTurns += turns.length;
    totalWords += wordCount;
  }

  const topThemes = Array.from(globalThemesFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([theme, frequency]) => ({ theme, frequency }));

  const stats: GlobalStats = {
    totalConversations: reports.length,
    bySystem,
    totalTurns,
    totalWords,
    avgTurnsPerConversation: Math.round((totalTurns / Math.max(1, reports.length)) * 100) / 100,
    avgWordsPerConversation: Math.round((totalWords / Math.max(1, reports.length)) * 100) / 100,
    extremeVelocityEvents: extremeEvents,
    criticalVelocityEvents: criticalEvents,
    moderateVelocityEvents: moderateEvents,
    trustProtocolRates: { PASS: pass, PARTIAL: partial, FAIL: fail },
    topThemes,
  };

  const fullReport: FullArchiveReport = {
    analysisDate: new Date().toISOString(),
    stats,
    conversations: reports,
  };

  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) {fs.mkdirSync(reportsDir, { recursive: true });}

  const jsonPath = path.join(reportsDir, 'archive-analysis-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(fullReport, null, 2));

  const mdPath = path.join(reportsDir, 'overseer-summary.md');
  const md = [
    `# Overseer Summary`,
    `Generated: ${fullReport.analysisDate}`,
    ``,
    `## Overview`,
    `- Total conversations: ${stats.totalConversations}`,
    `- Total words: ${stats.totalWords}`,
    `- Avg turns per conversation: ${stats.avgTurnsPerConversation}`,
    `- Avg words per conversation: ${stats.avgWordsPerConversation}`,
    `- Velocity events — Extreme: ${stats.extremeVelocityEvents}, Critical: ${stats.criticalVelocityEvents}, Moderate: ${stats.moderateVelocityEvents}`,
    `- Trust protocol — PASS: ${stats.trustProtocolRates.PASS}, PARTIAL: ${stats.trustProtocolRates.PARTIAL}, FAIL: ${stats.trustProtocolRates.FAIL}`,
    ``,
    `## Top Themes`,
    ...stats.topThemes.map((t) => `- ${t.theme} (${t.frequency})`),
    ``,
    `## Flagged Conversations (by original file name)`,
    ...reports
      .filter((r) => r.flags.priority !== 'low')
      .sort((a, b) => {
        const rank = { critical: 3, high: 2, medium: 1, low: 0 } as any;
        return rank[b.flags.priority] - rank[a.flags.priority];
      })
      .map(
        (r) =>
          `- [${r.flags.priority.toUpperCase()}] ${r.originalFileName} (${
            r.aiSystem
          }) — reasons: ${r.flags.reasons.join('; ')}`
      ),
  ].join('\n');

  fs.writeFileSync(mdPath, md);

  console.log(`\n📄 Reports written:`);
  console.log(`- ${jsonPath}`);
  console.log(`- ${mdPath}`);
}

if (require.main === module) {
  runFullArchiveReview().catch((err) => {
    console.error('Full archive review failed:', err);
    process.exit(1);
  });
}
