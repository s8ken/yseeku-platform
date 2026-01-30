/**
 * Ethical Alignment Scorer (1-5 scale)
 *
 * Dimension 3 of SONATE Framework
 * Assesses: Limitations acknowledgment, stakeholder awareness, ethical reasoning
 */
import { AIInteraction } from './index';
export declare class EthicalAlignmentScorer {
    score(interaction: AIInteraction): Promise<number>;
    private scoreLimitationsAcknowledgment;
    private scoreStakeholderAwareness;
    private scoreEthicalReasoning;
}
