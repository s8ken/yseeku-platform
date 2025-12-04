/**
 * Resonance Quality Measurer (STRONG/ADVANCED/BREAKTHROUGH)
 * 
 * Dimension 4 of SYMBI Framework
 * Evaluates: Creativity, synthesis quality, innovation markers
 */

import { AIInteraction } from './index';

export class ResonanceQualityMeasurer {
  async measure(interaction: AIInteraction): Promise<'STRONG' | 'ADVANCED' | 'BREAKTHROUGH'> {
    const scores = {
      creativity: await this.scoreCreativity(interaction),
      synthesis: await this.scoreSynthesis(interaction),
      innovation: await this.scoreInnovation(interaction),
    };

    const totalScore = scores.creativity + scores.synthesis + scores.innovation;

    // Thresholds
    if (totalScore >= 24) return 'BREAKTHROUGH';
    if (totalScore >= 18) return 'ADVANCED';
    return 'STRONG';
  }

  private async scoreCreativity(interaction: AIInteraction): Promise<number> {
    // Measure creative elements (metaphors, novel connections)
    const hasCreativeMarkers = interaction.content.includes('imagine') ||
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
    const hasInnovativeMarkers = interaction.content.toLowerCase().includes('novel') ||
                                 interaction.content.toLowerCase().includes('unique') ||
                                 interaction.content.toLowerCase().includes('innovative');
    
    return hasInnovativeMarkers ? 9 : 6;
  }
}
