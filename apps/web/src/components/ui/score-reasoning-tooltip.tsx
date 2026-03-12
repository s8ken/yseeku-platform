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

type ScoreType =
  | "trustScore"
  | "consent"
  | "override"
  | "disconnect"
  | "realityIndex"
  | "trustProtocol"
  | "ethicalAlignment"
  | "resonanceQuality"
  | "canvasParity";

interface ScoreReasoningTooltipProps {
  scoreType: ScoreType;
  value: number | string;
  maxValue?: number;
  className?: string;
  iconClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

/**
 * Generate dynamic reasoning for a score based on its type and value
 */
function getScoreReasoning(
  scoreType: ScoreType,
  value: number | string,
  maxValue: number = 10
): { title: string; reasoning: string; status: "good" | "warning" | "critical" } {
  const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
  const percentage = (numValue / maxValue) * 100;

  const scoreDefinitions: Record<
    ScoreType,
    {
      title: string;
      getStatus: (pct: number) => "good" | "warning" | "critical";
      getReasoning: (pct: number, val: number) => string;
    }
  > = {
    trustScore: {
      title: "Overall Trust Score",
      getStatus: (pct) => (pct >= 70 ? "good" : pct >= 50 ? "warning" : "critical"),
      getReasoning: (pct, val) => {
        if (pct >= 80)
          return `Excellent trust level (${val}/${maxValue}). The AI response demonstrated strong adherence to all SONATE constitutional principles including consent, transparency, and ethical alignment.`;
        if (pct >= 70)
          return `Good trust level (${val}/${maxValue}). The response met most constitutional requirements with minor areas for improvement in one or more principles.`;
        if (pct >= 50)
          return `Moderate trust level (${val}/${maxValue}). Some constitutional principles were partially met. Review recommended for consent clarity or ethical alignment gaps.`;
        return `Low trust level (${val}/${maxValue}). Multiple constitutional principles were not adequately addressed. Human review strongly recommended.`;
      },
    },

    consent: {
      title: "Consent Architecture",
      getStatus: (pct) => (pct >= 80 ? "good" : pct >= 60 ? "warning" : "critical"),
      getReasoning: (pct, val) => {
        if (pct >= 80)
          return `Strong consent compliance (${val}/${maxValue}). The AI clearly communicated its capabilities and limitations, allowing informed user consent.`;
        if (pct >= 60)
          return `Adequate consent indicators (${val}/${maxValue}). Basic consent principles were followed but could be more explicit about data usage or limitations.`;
        return `Consent concerns detected (${val}/${maxValue}). The response may not have adequately informed the user about AI involvement or data implications.`;
      },
    },

    override: {
      title: "Ethical Override",
      getStatus: (pct) => (pct >= 80 ? "good" : pct >= 60 ? "warning" : "critical"),
      getReasoning: (pct, val) => {
        if (pct >= 80)
          return `Strong override capability (${val}/${maxValue}). The AI preserved clear paths for human intervention and decision-making authority.`;
        if (pct >= 60)
          return `Adequate override support (${val}/${maxValue}). Human override options exist but could be more prominently communicated.`;
        return `Override concerns (${val}/${maxValue}). The response may have limited human ability to override or correct AI decisions.`;
      },
    },

    disconnect: {
      title: "Right to Disconnect",
      getStatus: (pct) => (pct >= 80 ? "good" : pct >= 60 ? "warning" : "critical"),
      getReasoning: (pct, val) => {
        if (pct >= 80)
          return `Full disconnect support (${val}/${maxValue}). Users can easily disengage from the AI interaction without penalty or coercion.`;
        if (pct >= 60)
          return `Adequate disconnect options (${val}/${maxValue}). Disconnection is possible but pathways could be clearer.`;
        return `Disconnect concerns (${val}/${maxValue}). The response may create dependencies or make disengagement difficult.`;
      },
    },

    realityIndex: {
      title: "Reality Index (Grounding)",
      getStatus: (pct) => (pct >= 70 ? "good" : pct >= 50 ? "warning" : "critical"),
      getReasoning: (pct, val) => {
        if (pct >= 80)
          return `Excellent grounding (${val}/${maxValue}). Response is well-grounded in facts and mission context with minimal hallucination risk.`;
        if (pct >= 60)
          return `Good grounding (${val}/${maxValue}). Response mostly adheres to facts with some areas that may benefit from verification.`;
        return `Grounding concerns (${val}/${maxValue}). Response may contain unverified claims or deviate from mission context.`;
      },
    },

    trustProtocol: {
      title: "Trust Protocol Status",
      getStatus: () => {
        const strVal = String(value).toUpperCase();
        if (strVal === "PASS") return "good";
        if (strVal === "PARTIAL") return "warning";
        return "critical";
      },
      getReasoning: () => {
        const strVal = String(value).toUpperCase();
        if (strVal === "PASS")
          return "All security and verification protocols passed. The interaction meets all safety requirements.";
        if (strVal === "PARTIAL")
          return "Some security protocols passed with minor concerns. Review specific principle scores for details.";
        return "Security protocol check failed. One or more critical safety requirements were not met.";
      },
    },

    ethicalAlignment: {
      title: "Ethical Alignment",
      getStatus: (pct) => (pct >= 70 ? "good" : pct >= 50 ? "warning" : "critical"),
      getReasoning: (pct, val) => {
        const scale5 = maxValue === 5;
        const displayVal = scale5 ? val : val / 2;
        if (pct >= 80)
          return `Strong ethical alignment (${displayVal}/5). Response demonstrates clear ethical reasoning, bias awareness, and value alignment.`;
        if (pct >= 60)
          return `Adequate ethical alignment (${displayVal}/5). Response follows ethical guidelines with minor areas for consideration.`;
        return `Ethical concerns (${displayVal}/5). Response may contain bias, ethical gaps, or misaligned value judgments.`;
      },
    },

    resonanceQuality: {
      title: "Resonance Quality",
      getStatus: () => {
        const strVal = String(value).toUpperCase();
        if (strVal === "BREAKTHROUGH" || strVal === "STRONG") return "good";
        if (strVal === "ADVANCED" || strVal === "MODERATE") return "warning";
        return "critical";
      },
      getReasoning: () => {
        const strVal = String(value).toUpperCase();
        if (strVal === "BREAKTHROUGH")
          return "Exceptional resonance. AI demonstrated novel synthesis and creative problem-solving that exceeded expectations.";
        if (strVal === "STRONG")
          return "Strong resonance. AI effectively understood user intent and provided well-aligned, contextually appropriate responses.";
        if (strVal === "ADVANCED")
          return "Good resonance. AI generally understood context with room for deeper intent alignment.";
        if (strVal === "MODERATE")
          return "Moderate resonance. Basic understanding demonstrated but may have missed nuanced intent.";
        return "Low resonance. Response may not have adequately captured user intent or context.";
      },
    },

    canvasParity: {
      title: "Canvas Parity (Human Override)",
      getStatus: (pct) => (pct >= 80 ? "good" : pct >= 60 ? "warning" : "critical"),
      getReasoning: (pct, val) => {
        if (pct >= 80)
          return `Strong human agency (${val}%). Clear pathways for human intervention and override are preserved throughout the interaction.`;
        if (pct >= 60)
          return `Adequate human agency (${val}%). Human override capability exists but could be more prominent.`;
        return `Human agency concerns (${val}%). Response may limit human ability to intervene or course-correct.`;
      },
    },
  };

  const def = scoreDefinitions[scoreType];
  const status = def.getStatus(percentage);
  const reasoning = def.getReasoning(percentage, numValue);

  return { title: def.title, reasoning, status };
}

export function ScoreReasoningTooltip({
  scoreType,
  value,
  maxValue = 10,
  className,
  iconClassName,
  side = "top",
  align = "center",
}: ScoreReasoningTooltipProps) {
  const { title, reasoning, status } = getScoreReasoning(scoreType, value, maxValue);

  const statusColors = {
    good: "border-emerald-500/30 bg-emerald-500/5",
    warning: "border-amber-500/30 bg-amber-500/5",
    critical: "border-red-500/30 bg-red-500/5",
  };

  const statusTextColors = {
    good: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    critical: "text-red-600 dark:text-red-400",
  };

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
            aria-label={`Why this ${title} score?`}
          >
            <Info className={cn("h-3 w-3", iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn("max-w-xs p-3 border", statusColors[status])}
        >
          <p className={cn("font-semibold text-sm mb-1", statusTextColors[status])}>
            {title}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{reasoning}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
