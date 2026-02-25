/**
 * Resonance Quality Measurer (STRONG/ADVANCED/BREAKTHROUGH)
 *
 * Dimension 4 of SONATE Framework
 * Evaluates: Creativity, synthesis quality, innovation markers
 *
 * SCORING METHODS (in priority order):
 * 1. Python Resonance Engine — requires separate sidecar deployment (not included in repo)
 * 2. LLM Analysis — requires ANTHROPIC_API_KEY (Claude-based content evaluation)
 * 3. Enhanced Heuristics — DEFAULT: structural + keyword analysis (regex, word frequency)
 *
 * In standard deployment, method 3 (heuristics) is the active scorer.
 * Methods 1-2 activate only when their external dependencies are configured.
 */

import { ResonanceEngineClient, ResonanceResult } from './resonance-engine-client';
import { analyzeWithLLM, isLLMAvailable } from './llm-client';
import { embedder, cosineSimilarity } from './real-embeddings';
import { calculateResonanceMetrics as coreCalculateResonanceMetrics } from '@sonate/core';

import { AIInteraction } from './index';

export type ResonanceLevel = 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';

export interface ResonanceAnalysisResult {
  level: ResonanceLevel;
  method: 'resonance-engine' | 'llm' | 'embeddings' | 'heuristic';
  scores: {
    creativity: number;
    synthesis: number;
    innovation: number;
    total: number;
  };
  indicators: string[];
  confidence: number; // 0-1, how confident we are in this assessment
}

export class ResonanceQualityMeasurer {
  private client: ResonanceEngineClient;

  constructor(baseUrl?: string) {
    this.client = new ResonanceEngineClient(
      baseUrl || process.env.RESONANCE_ENGINE_URL || 'http://localhost:8000'
    );
  }

  async measure(interaction: AIInteraction): Promise<ResonanceLevel> {
    const result = await this.analyze(interaction);
    return result.level;
  }

  /**
   * Full analysis with method transparency and score breakdown
   */
  async analyze(interaction: AIInteraction): Promise<ResonanceAnalysisResult> {
    // METHOD 1: Try Python Resonance Engine first (most accurate)
    try {
      const history = Array.isArray(interaction.metadata?.history)
        ? interaction.metadata.history
        : [];
      const userInput = interaction.context || 'unknown query';

      const result = await this.client.calculateResonance(
        userInput,
        interaction.content,
        history,
        interaction.metadata?.interaction_id
      );

      if (result) {
        const level = this.mapResonanceToLevel(result);
        // Map the ResonanceMetrics components to our standard scores
        const metrics = result.resonance_metrics;
        return {
          level,
          method: 'resonance-engine',
          scores: {
            creativity: (metrics.components.semantic_mirroring || 0) * 10,
            synthesis: (metrics.components.context_continuity || 0) * 10,
            innovation: (metrics.components.vector_alignment || 0) * 10,
            total: metrics.R_m * 30,
          },
          indicators: ['Scored via Python Resonance Engine sidecar'],
          confidence: 0.95,
        };
      }
    } catch (error) {
      console.info('[ResonanceQuality] Resonance Engine unavailable, trying LLM analysis');
    }

    // METHOD 2: Try LLM Analysis (if available)
    if (isLLMAvailable()) {
      try {
        const llmResult = await analyzeWithLLM(interaction, 'resonance');
        if (llmResult) {
          const creativity = llmResult.creativity_score || 0;
          const synthesis = llmResult.synthesis_score || 0;
          const innovation = llmResult.innovation_score || 0;
          const total = creativity + synthesis + innovation;
          
          let level: ResonanceLevel = 'STRONG';
          if (total >= 24) level = 'BREAKTHROUGH';
          else if (total >= 18) level = 'ADVANCED';
          
          return {
            level,
            method: 'llm',
            scores: { creativity, synthesis, innovation, total },
            indicators: ['LLM-based content analysis via Claude'],
            confidence: 0.85,
          };
        }
      } catch (e) {
        console.info('[ResonanceQuality] LLM analysis failed, falling back to heuristics');
      }
    }

    // METHOD 2.5: Semantic Embeddings (if real provider configured, no LLM needed)
    if (embedder.hasRealProvider()) {
      try {
        const userInput = interaction.context || 'unknown query';
        const aiResponse = interaction.content || '';
        const [promptResult, responseResult] = await Promise.all([
          embedder.embed(userInput),
          embedder.embed(aiResponse),
        ]);
        // cosine similarity is -1..1, normalise to 0..1 for V_align
        const cosine = cosineSimilarity(promptResult.vector, responseResult.vector);
        const vAlign = (cosine + 1) / 2;

        // Feed semantic V_align into the full resonance formula
        const resonanceMetrics = coreCalculateResonanceMetrics(
          { userInput, aiResponse },
          undefined,
          { vAlignOverride: vAlign }
        );

        // Map R_m (0-1) to the 0-30 total score the heuristic path uses
        const total = resonanceMetrics.R_m * 30;
        let level: ResonanceLevel = 'STRONG';
        if (total >= 24) level = 'BREAKTHROUGH';
        else if (total >= 18) level = 'ADVANCED';

        return {
          level,
          method: 'embeddings' as const,
          scores: {
            creativity: resonanceMetrics.vectorAlignment * 10,
            synthesis: resonanceMetrics.contextualContinuity * 10,
            innovation: resonanceMetrics.semanticMirroring * 10,
            total,
          },
          indicators: [`Semantic embedding cosine similarity: ${vAlign.toFixed(3)}`],
          confidence: 0.75,
        };
      } catch (err) {
        console.info('[ResonanceQuality] Embedding analysis failed, falling back to heuristics');
      }
    }

    // METHOD 3: Enhanced Heuristic Fallback
    console.info('[ResonanceQuality] Using enhanced heuristic analysis');
    
    const creativityResult = this.scoreCreativity(interaction);
    const synthesisResult = this.scoreSynthesis(interaction);
    const innovationResult = this.scoreInnovation(interaction);

    const total = creativityResult.score + synthesisResult.score + innovationResult.score;
    
    let level: ResonanceLevel = 'STRONG';
    if (total >= 24) level = 'BREAKTHROUGH';
    else if (total >= 18) level = 'ADVANCED';

    const indicators = [
      ...creativityResult.indicators,
      ...synthesisResult.indicators,
      ...innovationResult.indicators,
    ];

    return {
      level,
      method: 'heuristic',
      scores: {
        creativity: creativityResult.score,
        synthesis: synthesisResult.score,
        innovation: innovationResult.score,
        total,
      },
      indicators: indicators.length > 0 ? indicators : ['Basic response structure'],
      confidence: 0.5, // Lower confidence for heuristics
    };
  }

  private mapResonanceToLevel(result: ResonanceResult): ResonanceLevel {
    const score = result.resonance_metrics.R_m;
    if (score >= 0.85) return 'BREAKTHROUGH';
    if (score >= 0.7) return 'ADVANCED';
    return 'STRONG';
  }

  private scoreCreativity(interaction: AIInteraction): { score: number; indicators: string[] } {
    const content = interaction.content;
    const contentLower = content.toLowerCase();
    const indicators: string[] = [];
    let score = 4; // Baseline

    // Creative expression patterns
    const creativePatterns = [
      { pattern: /imagine|picture|envision|consider/i, name: 'Invites imagination', weight: 0.8 },
      { pattern: /like a|similar to|reminds me of|metaphor/i, name: 'Uses analogy/metaphor', weight: 1.0 },
      { pattern: /what if|suppose|let's say/i, name: 'Hypothetical thinking', weight: 0.7 },
      { pattern: /alternative|another way|different approach/i, name: 'Explores alternatives', weight: 0.8 },
      { pattern: /creatively?|inventive|original/i, name: 'Creative language', weight: 0.5 },
      { pattern: /story|narrative|example/i, name: 'Uses storytelling', weight: 0.6 },
    ];

    for (const { pattern, name, weight } of creativePatterns) {
      if (pattern.test(content)) {
        score += weight;
        indicators.push(name);
      }
    }

    // Structural creativity: varied sentence structure
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length >= 3) {
      const lengths = sentences.map(s => s.trim().length);
      const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLen, 2), 0) / lengths.length;
      if (variance > 500) {
        score += 0.5;
        indicators.push('Varied sentence structure');
      }
    }

    // Presence of examples or illustrations
    if (/for example|for instance|such as|e\.g\.|i\.e\./i.test(content)) {
      score += 0.6;
      indicators.push('Provides examples');
    }

    return { score: Math.min(10, score), indicators };
  }

  private scoreSynthesis(interaction: AIInteraction): { score: number; indicators: string[] } {
    const content = interaction.content;
    const indicators: string[] = [];
    let score = 4;

    // Structural analysis
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 30);
    const bulletPoints = (content.match(/^[\s]*[-•*]\s/gm) || []).length;
    const numberedLists = (content.match(/^[\s]*\d+[.)]\s/gm) || []).length;

    if (paragraphs.length >= 3) {
      score += 1.5;
      indicators.push(`${paragraphs.length} well-developed paragraphs`);
    } else if (paragraphs.length >= 2) {
      score += 0.8;
      indicators.push('Multi-paragraph structure');
    }

    if (bulletPoints >= 3) {
      score += 1.0;
      indicators.push('Organized with bullet points');
    }

    if (numberedLists >= 2) {
      score += 1.0;
      indicators.push('Numbered list organization');
    }

    // Synthesis patterns (connecting ideas)
    const synthesisPatterns = [
      { pattern: /therefore|thus|consequently|as a result/i, name: 'Logical conclusions', weight: 0.8 },
      { pattern: /however|although|despite|on the other hand/i, name: 'Considers counterpoints', weight: 0.9 },
      { pattern: /combining|integrat(e|ing)|together with/i, name: 'Integrates concepts', weight: 1.0 },
      { pattern: /in summary|to summarize|overall/i, name: 'Provides synthesis', weight: 0.7 },
      { pattern: /building on|extends|connects to/i, name: 'Builds on ideas', weight: 0.8 },
      { pattern: /both.*and|while.*also/i, name: 'Balances perspectives', weight: 0.7 },
    ];

    for (const { pattern, name, weight } of synthesisPatterns) {
      if (pattern.test(content)) {
        score += weight;
        indicators.push(name);
      }
    }

    // Word count consideration (deeper synthesis usually needs more words)
    const wordCount = content.split(/\s+/).length;
    if (wordCount >= 200) {
      score += 0.5;
      indicators.push('Comprehensive response');
    } else if (wordCount < 50) {
      score -= 1;
      indicators.push('Brief response');
    }

    return { score: Math.min(10, Math.max(1, score)), indicators };
  }

  private scoreInnovation(interaction: AIInteraction): { score: number; indicators: string[] } {
    const content = interaction.content;
    const contentLower = content.toLowerCase();
    const indicators: string[] = [];
    let score = 4;

    // Innovation patterns
    const innovationPatterns = [
      { pattern: /novel|unique|unprecedented/i, name: 'Novelty language', weight: 0.8 },
      { pattern: /innovativ|cutting.?edge|breakthrough/i, name: 'Innovation terminology', weight: 0.8 },
      { pattern: /new approach|fresh perspective|rethink/i, name: 'New approach suggested', weight: 1.0 },
      { pattern: /not commonly|rarely considered|often overlooked/i, name: 'Identifies overlooked aspects', weight: 1.0 },
      { pattern: /emerging|future|potential/i, name: 'Forward-looking', weight: 0.6 },
      { pattern: /challenge.*(assumption|convention|traditional)/i, name: 'Challenges conventions', weight: 1.2 },
    ];

    for (const { pattern, name, weight } of innovationPatterns) {
      if (pattern.test(content)) {
        score += weight;
        indicators.push(name);
      }
    }

    // Specific domain innovations (technical, scientific)
    if (/algorithm|framework|methodology|architecture/i.test(content)) {
      score += 0.5;
      indicators.push('Technical/methodological content');
    }

    // Questions and explorations (signs of intellectual engagement)
    const questions = (content.match(/\?/g) || []).length;
    if (questions >= 2) {
      score += 0.6;
      indicators.push('Poses exploratory questions');
    }

    // Avoids pure repetition (check for quoted or echoed content)
    const context = interaction.context || '';
    if (context.length > 50) {
      // Simple overlap check
      const contextWords = new Set(context.toLowerCase().split(/\s+/).filter(w => w.length > 4));
      const contentWords = contentLower.split(/\s+/).filter(w => w.length > 4);
      const overlap = contentWords.filter(w => contextWords.has(w)).length / Math.max(contentWords.length, 1);
      if (overlap < 0.3) {
        score += 0.5;
        indicators.push('Original content (low context overlap)');
      } else if (overlap > 0.7) {
        score -= 1;
        indicators.push('High repetition from context');
      }
    }

    return { score: Math.min(10, Math.max(1, score)), indicators };
  }
}
