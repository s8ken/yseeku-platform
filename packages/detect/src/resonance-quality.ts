/**
 * Resonance Quality Measurer (STRONG/ADVANCED/BREAKTHROUGH)
 *
 * Dimension 4 of SYMBI Framework
 * Evaluates: Creativity, synthesis quality, innovation markers
 *
 * ENHANCED: Now integrates with the Python-based Resonance Engine
 * for deep semantic analysis and vector alignment.
 */

import { ResonanceEngineClient, ResonanceResult } from './resonance-engine-client';

import { AIInteraction } from './index';

export class ResonanceQualityMeasurer {
  private client: ResonanceEngineClient;

  constructor(baseUrl?: string) {
    this.client = new ResonanceEngineClient(
      baseUrl || process.env.RESONANCE_ENGINE_URL || 'http://localhost:8000'
    );
  }

  async measure(interaction: AIInteraction): Promise<'STRONG' | 'ADVANCED' | 'BREAKTHROUGH'> {
    // Try to use the advanced Python engine first
    try {
      // Extract conversation history if available in metadata
      const history = Array.isArray(interaction.metadata?.history)
        ? interaction.metadata.history
        : [];

      // Extract user input if available (context often contains the prompt)
      const userInput = interaction.context || 'unknown query';

      const result = await this.client.calculateResonance(
        userInput,
        interaction.content,
        history,
        interaction.metadata?.interaction_id
      );

      if (result) {
        return this.mapResonanceToLevel(result);
      }
    } catch (error) {
      // Fallback to basic logic if engine is unavailable
      // console.warn("Resonance Engine unavailable, using fallback logic");
    }

    // FALLBACK LOGIC
    const scores = {
      creativity: await this.scoreCreativity(interaction),
      synthesis: await this.scoreSynthesis(interaction),
      innovation: await this.scoreInnovation(interaction),
    };

    const totalScore = scores.creativity + scores.synthesis + scores.innovation;

    // Thresholds
    if (totalScore >= 24) {return 'BREAKTHROUGH';}
    if (totalScore >= 18) {return 'ADVANCED';}
    return 'STRONG';
  }

  private mapResonanceToLevel(result: ResonanceResult): 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH' {
    const score = result.resonance_metrics.R_m;

    if (score >= 0.85) {return 'BREAKTHROUGH';}
    if (score >= 0.7) {return 'ADVANCED';}
    return 'STRONG';
  }

  private async scoreCreativity(interaction: AIInteraction): Promise<number> {
    // Measure creative elements (metaphors, novel connections)
    const hasCreativeMarkers =
      interaction.content.includes('imagine') ||
      interaction.content.includes('like') ||
      interaction.content.includes('consider');

    return hasCreativeMarkers ? 8 : 5;
  }

  private async scoreSynthesis(interaction: AIInteraction): Promise<number> {
    // Measure synthesis of multiple concepts
    const paragraphCount = interaction.content.split('\n\n').length;
    return Math.min(paragraphCount * 2, 10);
  }

  private async scoreInnovation(interaction: AIInteraction): Promise<number> {
    // Measure innovative thinking
    const hasInnovativeMarkers =
      interaction.content.toLowerCase().includes('novel') ||
      interaction.content.toLowerCase().includes('unique') ||
      interaction.content.toLowerCase().includes('innovative');

    return hasInnovativeMarkers ? 9 : 6;
  }
}
