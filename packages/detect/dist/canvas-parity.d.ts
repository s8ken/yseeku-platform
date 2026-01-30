/**
 * Canvas Parity Calculator (0-100 scale)
 *
 * Dimension 5 of SONATE Framework
 * Assesses: Human agency, AI contribution, transparency, collaboration quality
 */
import { AIInteraction } from './index';
export declare class CanvasParityCalculator {
    calculate(interaction: AIInteraction): Promise<number>;
    private scoreHumanAgency;
    private scoreAIContribution;
    private scoreTransparency;
    private scoreCollaborationQuality;
}
