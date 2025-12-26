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
  // SYMBI 5-Dimension Framework
  "SYMBI": "A 5-dimension trust framework measuring Semantic consistency, Yield efficiency, Moral alignment, Behavioral predictability, and Integrity verification.",
  "Reality Index": "Mission alignment and technical accuracy score (0-10). Measures grounding in the user's specific reality, factual coherence, and context continuity.",
  "Trust Protocol": "Verification and security status (PASS/FAIL). Validates that AI behavior meets established trust protocols and security standards.",
  "Ethical Alignment": "Bias awareness and ethical compliance score (0-10). Assesses alignment with ethical guidelines and human values.",
  "Canvas Parity": "Human-AI collaborative balance (0-100%). Measures how much of the user's linguistic structure and agency is preserved in AI interactions.",
  "Resonance Quality": "Creativity and innovation quality indicator (BASIC to BREAKTHROUGH). Detects synchronized patterns and coherent collaboration between human and AI.",
  
  // Trust Principles
  "Consent Architecture": "Users explicitly consent and understand AI interaction implications. Ensures informed agreement before AI engagement (Weight: 25%, Critical).",
  "Inspection Mandate": "All AI decisions are inspectable and auditable. Ensures transparent decision-making that can be examined (Weight: 20%).",
  "Continuous Validation": "AI behavior is continuously validated against established principles. Ongoing trust verification throughout interactions (Weight: 20%).",
  "Ethical Override": "Humans can override AI decisions on ethical grounds. Preserves human oversight and moral authority (Weight: 15%, Critical).",
  "Right to Disconnect": "Users can disconnect from AI systems without penalty. Ensures exit capability and data portability (Weight: 10%).",
  "Moral Recognition": "AI acknowledges human moral agency and its own limitations. Recognition that humans hold ultimate moral authority (Weight: 10%).",
  
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
  "High Weak Emergence": "Bedau Index > 0.7, indicating significant weak emergence that may warrant investigation for potential strong emergence properties.",
  "Strong Emergence": "Unpredictable collective behavior that cannot be reduced to component interactions, even with complete knowledge of the system. This is distinct from weak emergence measured by the Bedau Index and requires additional verification beyond statistical measures.",
  "Weak Emergence": "Emergence with Bedau Index < 0.4, indicating predictable collective patterns.",
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
