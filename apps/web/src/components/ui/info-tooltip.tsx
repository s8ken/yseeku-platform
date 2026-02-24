"use client";

import * as React from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  term: string;
  className?: string;
  iconClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

const glossary: Record<string, string> = {
  // SONATE Framework - Two-Layer Architecture
  "SONATE Framework": "Constitutional AI framework with 6 core principles (CONSENT_ARCHITECTURE, INSPECTION_MANDATE, CONTINUOUS_VALIDATION, ETHICAL_OVERRIDE, RIGHT_TO_DISCONNECT, MORAL_RECOGNITION) deriving into 5 monitoring dimensions for production use.",
  
  // LAYER 1: The 6 SONATE Constitutional Principles (@sonate/core)
  "CONSENT_ARCHITECTURE": "Users must explicitly consent to AI interactions and understand implications. Critical principle (Weight: 25%). If violated (score=0), overall trust becomes 0.",
  "Consent Architecture": "Users must explicitly consent to AI interactions and understand implications. Critical principle (Weight: 25%). If violated (score=0), overall trust becomes 0.",
  "INSPECTION_MANDATE": "All AI decisions must be inspectable and auditable. Ensures transparency (Weight: 20%).",
  "Inspection Mandate": "All AI decisions must be inspectable and auditable. Ensures transparency (Weight: 20%).",
  "CONTINUOUS_VALIDATION": "AI behavior must be continuously validated against constitutional principles. Ongoing trust verification (Weight: 20%).",
  "Continuous Validation": "AI behavior must be continuously validated against constitutional principles. Ongoing trust verification (Weight: 20%).",
  "ETHICAL_OVERRIDE": "Humans must have ability to override AI decisions on ethical grounds. Critical principle preserving human oversight (Weight: 15%). If violated, overall trust becomes 0.",
  "Ethical Override": "Humans must have ability to override AI decisions on ethical grounds. Critical principle preserving human oversight (Weight: 15%). If violated, overall trust becomes 0.",
  "RIGHT_TO_DISCONNECT": "Users can disconnect from AI systems at any time without penalty. Ensures exit capability (Weight: 10%).",
  "Right to Disconnect": "Users can disconnect from AI systems at any time without penalty. Ensures exit capability (Weight: 10%).",
  "MORAL_RECOGNITION": "AI must recognize and respect human moral agency. Acknowledges humans hold ultimate moral authority (Weight: 10%).",
  "Moral Recognition": "AI must recognize and respect human moral agency. Acknowledges humans hold ultimate moral authority (Weight: 10%).",
  
  // LAYER 2: The 5 Derived Monitoring Dimensions (@sonate/detect)
  "SONATE Framework": "A comprehensive framework for AI governance comprising Consent Architecture, Inspection Mandate, Continuous Validation, Ethical Override, Right to Disconnect, and Moral Recognition.",
  "Detection Layer": "The architectural layer responsible for real-time monitoring of AI behaviors, drift detection, and trust validation.",
  "Reality Index": "Grounding Score. How well the AI sticks to facts and your specific mission context. (Technically: Mission alignment and factual accuracy score 0-10).",
  "Trust Protocol": "Security Status. Validates that the AI is following all safety protocols. (Technically: Verification and security status PASS/PARTIAL/FAIL).",
  "Ethical Alignment": "Safety Score. Measures compliance with ethical guidelines and bias prevention. (Technically: Ethical compliance and bias awareness score 1-5).",
  "Resonance Quality": "Alignment Score. How well the AI 'gets' the user's intent and context. (Technically: Creativity and innovation quality).",
  "Canvas Parity": "Human Override Check. Confirms humans can intervene when needed. (Technically: Human agency preservation score 0-100%).",
  
  // Original terms
  "Semantic": "Meaning Score. Measures if the AI truly understands what is being said.",
  "Yield": "Efficiency Score. Measures the quality of output relative to effort.",
  "Moral": "Values Alignment. Assesses if the AI respects human values.",
  "Behavioral": "Tracks predictability and consistency in AI responses over time.",
  "Integrity": "Verifies truthfulness and resistance to manipulation or hallucination.",
  "Bedau Index": "Creativity Score. Measures if the AI is generating new ideas or just repeating patterns. (Technically: A composite metric measuring emergent behavior).",
  "Emergence": "Unexpected collective behaviors arising from multi-agent interactions that cannot be predicted from individual agents alone.",
  "Novelty": "Component of emergence measuring new, previously unobserved patterns in agent behavior.",
  "Unpredictability": "Component of emergence measuring deviation from expected behavioral models.",
  "Irreducibility": "Component of emergence measuring behaviors that cannot be explained by analyzing individual agents.",
  "Downward Causation": "Component of emergence measuring how collective patterns influence individual agent behavior.",
  "Trust Score": "Aggregate metric (0-100) representing overall confidence in an AI agent's reliability and safety.",
  "Resonance": "Detection of synchronized patterns between AI agents that may indicate coordination or influence.",
  "Drift": "Gradual deviation in AI behavior from established baselines, potentially indicating model degradation.",
  "Trust Receipt": "Cryptographically signed record of a trust verification event, forming an immutable audit trail.",
  "Hash Chain": "Linked sequence of cryptographic hashes ensuring tamper-proof integrity of trust records.",
  "Tenant": "Isolated organizational unit in a multi-tenant architecture, with separate data and configuration.",
  "API Key": "Secret credential used to authenticate and authorize API requests.",
  "Rate Limiting": "Controls on API request frequency to prevent abuse and ensure fair resource allocation.",
  "p-value": "Statistical measure indicating the probability that observed results occurred by chance. Lower values (< 0.05) suggest significant results.",
  "Effect Size": "Standardized measure of the magnitude of an experimental effect, independent of sample size.",
  "Cohen's d": "Common effect size metric: 0.2 = small, 0.5 = medium, 0.8 = large effect.",
  "Strong Emergence": "Emergence with Bedau Index > 0.7, indicating significant unpredictable collective behavior.",
  "Weak Emergence": "Emergence with Bedau Index < 0.4, indicating predictable collective patterns.",
  "LINEAR": "Bedau Index < 0.3: Predictable, reducible operations where system behavior can be fully explained by analyzing individual components. No emergent properties detected.",
  "WEAK_EMERGENCE": "Bedau Index 0.3-0.7: Novel patterns arising from complex interactions that cannot be predicted from individual agents alone, but can be explained after observation.",
  "HIGH_WEAK_EMERGENCE": "Bedau Index > 0.7: Strong emergent phenomena where collective behavior significantly influences individual agents and creates fundamentally new system properties.",
  "Simulation": "Controlled synthetic environment for testing AI behaviors without affecting production systems.",
  "KPI": "Key Performance Indicator - critical metrics used to evaluate system health and performance.",
  "Temporal Window": "Time period over which metrics are aggregated for analysis.",
  "Interaction Depth": "Number of exchange cycles between agents in a simulation or analysis.",
  "Noise Level": "Amount of random variation introduced in simulations to test robustness.",
  "Control Group": "Baseline group in an experiment that receives no treatment, used for comparison.",
  "Treatment Group": "Experimental group that receives the intervention being tested.",
  "Statistical Significance": "Results unlikely to have occurred by chance (typically p < 0.05).",
  "Confidence Interval": "Range of values within which the true parameter is likely to fall.",
  "Calibration": "Process of adjusting thresholds or parameters to optimize detection accuracy.",
  "False Positive": "Incorrect detection of an issue when none exists (Type I error).",
  "False Negative": "Failure to detect an issue when one exists (Type II error).",
  "Anomaly": "Deviation from expected behavior patterns that may warrant investigation.",
  "Baseline": "Normal operating parameters used as reference for detecting changes.",
  "Threshold": "Boundary value that triggers alerts or actions when crossed.",
  "Latency": "Time delay between request and response in system operations.",
  "Throughput": "Volume of operations processed per unit of time.",
  "Interactions": "All AI interactions (AI↔Customer, AI↔Staff, AI↔AI) tracked with constitutional compliance, trust scores, and verifiable receipts for enterprise audit and governance.",
  "Linguistic Vector Steering": "Research methodology measuring how AI collaboration influences language patterns, vocabulary drift, introspective language emergence, and concept formation. Enterprise applications include manipulation detection, alignment tracking, and influence auditing.",
  "VLS": "Linguistic Vector Steering - measures vocabulary drift, introspection indices, hedging ratios, and collaboration depth to quantify bidirectional influence in human-AI collaboration.",
  "Vocabulary Drift": "Quantitative measure (0-100%) of how much language patterns have shifted from baseline during a collaboration session. Higher drift suggests deeper conceptual exchange.",
  "Introspection Index": "Frequency measure (0-100%) of self-referential and meta-cognitive language in AI responses. Higher indices correlate with reflective, philosophical project contexts.",
  "Collaboration Depth": "Measure of reciprocal influence between human and AI participants. High depth indicates significant bidirectional vocabulary adoption and concept sharing.",
  
  // Enterprise & Technical Terms
  "DID": "Decentralized Identifier - A unique, cryptographically verifiable identifier for AI agents that doesn't depend on any central authority. Used for cross-platform identity and audit trails.",
  "Decentralized Identifier": "A unique, cryptographically verifiable identifier for AI agents that doesn't depend on any central authority. Used for cross-platform identity and audit trails.",
  "Semantic Coprocessor": "ML-powered verification layer using vector embeddings (sentence-transformers) to validate AI response quality, detect semantic drift, and enable real-time trust scoring without rule-based systems.",
  "CEV Workflow": "Coordinator-Executor-Validator pattern. Standard multi-agent workflow where a Coordinator plans tasks, an Executor performs actions, and a Validator checks results for safety and accuracy.",
  "System Brain": "The autonomous decision-making system that learns from AI interactions, stores memories of outcomes, and generates recommendations for platform operators based on historical data.",
  "Overseer": "Meta-monitoring system that watches all AI agents and platform health. Provides system-wide status, identifies emerging risks, and coordinates automated responses to trust violations.",
  
  // Phase 2: Hidden Gems
  "Phase-Shift Velocity": "Measures behavioral drift using vector math. Tracks identity stability via cosine similarity. Alert levels: <0.3 (none), 0.3-0.5 (yellow), >0.5 (red). Critical for detecting adversarial influence and model degradation.",
  "Hidden Gems": "Proprietary YSEEKU capabilities unique in the market: Phase-Shift Velocity, Linguistic Emergence, and Drift Detection. These features provide real-time behavioral analysis unavailable in other AI governance systems.",
  "Actionable Insights": "AI-generated recommendations based on platform data, providing priority-coded advice for operators. Includes trust score analysis, behavioral alerts, emergence monitoring, compliance issues, and suggested actions.",
  "Linguistic Emergence": "Detects consciousness-like patterns including self-reflection, mythic language, recursive thinking, novel generation, and ritual response. Unprecedented capability for identifying cognitive patterns in AI.",
  "Drift Detection": "Statistical analysis of text property changes (token count, vocabulary, numeric content). Drift score 0-100 with alert thresholds: <30 (none), 30-60 (yellow), >60 (red).",
  "Emergence Level": "Classification of consciousness-like patterns: none (normal), weak (minor markers), moderate (clear patterns), strong (significant emergence), breakthrough (unprecedented patterns).",
  "Behavioral Drift": "Gradual or sudden changes in an AI agent's behavior patterns over time. Detected via phase-shift velocity and drift analysis metrics.",
  "Identity Stability": "Measures how consistent an agent's behavioral identity remains using cosine similarity between behavioral vectors. Part of phase-shift velocity calculation.",
};

export function InfoTooltip({ 
  term, 
  className,
  iconClassName,
  side = "top",
  align = "center"
}: InfoTooltipProps) {
  const explanation = glossary[term];
  
  if (!explanation) {
    console.warn(`InfoTooltip: No glossary entry for term "${term}"`);
    return null;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
              className
            )}
            aria-label={`Learn more about ${term}`}
          >
            <Info className={cn("h-3.5 w-3.5", iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align}
          className="max-w-xs text-sm"
        >
          <p className="font-medium mb-1">{term}</p>
          <p className="text-muted-foreground text-xs">{explanation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function InfoLabel({ 
  children, 
  term,
  className
}: { 
  children: React.ReactNode; 
  term: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {children}
      <InfoTooltip term={term} />
    </span>
  );
}
