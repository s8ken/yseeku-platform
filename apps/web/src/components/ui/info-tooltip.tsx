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
  "SYMBI Framework": "Legacy name for SONATE Framework. Constitutional AI framework with 6 core principles deriving into 5 monitoring dimensions.",
  
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
  "Reality Index": "Mission alignment and factual accuracy score (0-10). Derived from principles to measure grounding in user's reality, factual coherence, and context continuity. Used for real-time production monitoring.",
  "Trust Protocol": "Verification and security status (PASS/PARTIAL/FAIL). Derived from principles to validate AI behavior meets established protocols. Returns PASS (≥8.0, no violations), PARTIAL (≥5.0), or FAIL (<5.0).",
  "Ethical Alignment": "Ethical compliance and bias awareness score (1-5). Derived dimension assessing alignment with ethical guidelines, limitations acknowledgment, stakeholder consideration, and transparency.",
  "Resonance Quality": "Creativity and innovation quality (STRONG/ADVANCED/BREAKTHROUGH). Derived metric detecting synchronized patterns, creative synthesis, innovation, and adaptive learning in AI responses.",
  "Canvas Parity": "Human agency preservation score (0-100%). Derived dimension measuring how much of user's linguistic structure, agency, contribution transparency, collaboration, and fairness is maintained.",
  
  // Original terms
  "Semantic": "Measures how consistently the AI understands and interprets meaning in context.",
  "Yield": "Measures the efficiency and quality of AI outputs relative to inputs.",
  "Moral": "Assesses alignment with ethical guidelines and human values.",
  "Behavioral": "Tracks predictability and consistency in AI responses over time.",
  "Integrity": "Verifies truthfulness and resistance to manipulation or hallucination.",
  "Bedau Index": "A composite metric (0-1) measuring emergent behavior in AI systems, based on Mark Bedau's complexity theory.",
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
