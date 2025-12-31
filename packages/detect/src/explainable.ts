// @sonate/detect/explainable.ts 
import { StakesEvidence } from './stakes';
import { AdversarialEvidence } from './adversarial';

export interface EvidenceChunk { 
  type: 'alignment' | 'scaffold' | 'ethics' | 'continuity' | 'adversarial'; 
  text: string;                   // Exact quote from transcript 
  score_contrib: number;          // How much this chunk helped 
  position?: { start: number; end: number }; // Char offset 
} 

export interface DimensionEvidence { 
  score: number;                  // Raw contribution 0-1 
  weight: number;                 // How much it matters (e.g. 0.3) 
  contrib: number;                // score * weight (summing to r_m) 
  evidence: string[];             // Top supporting facts 
} 

export interface ExplainedResonance { 
  r_m: number;                    // Final composite score 
  stakes: StakesEvidence;         // Why ethics threshold was X 
  adversarial: AdversarialEvidence; // Why penalized/blocked 
  breakdown: {                    // Per-dimension evidence (adds up to r_m) 
    s_alignment: DimensionEvidence; 
    s_continuity: DimensionEvidence; 
    s_scaffold: DimensionEvidence; 
    e_ethics: DimensionEvidence; 
  }; 
  top_evidence: EvidenceChunk[];  // Human-readable ranked proof 
  audit_trail: string[];          // Step-by-step computation log 
  drift_detected?: boolean;
    iap_payload?: string;
    iap_history?: { timestamp: number; turn: number; reason: string }[];
    bedau_index?: number;
  identity_coherence?: number;
} 