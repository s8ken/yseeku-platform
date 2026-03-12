"use client";

import * as React from "react";
import { Info, Brain } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface LLMReasoningTooltipProps {
  reasoning?: string;
  score?: number;
  maxScore?: number;
  label?: string;
  className?: string;
  iconClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

function getStatusFromScore(score: number, maxScore: number = 10): "good" | "warning" | "critical" {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 70) return "good";
  if (percentage >= 50) return "warning";
  return "critical";
}

export function LLMReasoningTooltip({
  reasoning,
  score,
  maxScore = 10,
  label,
  className,
  iconClassName,
  side = "top",
  align = "center",
}: LLMReasoningTooltipProps) {
  // Don't render if no reasoning available
  if (!reasoning) {
    return null;
  }

  const status = score !== undefined ? getStatusFromScore(score, maxScore) : "good";

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
            aria-label="View LLM reasoning"
          >
            <Brain className={cn("h-3 w-3", iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn("max-w-sm p-3 border", statusColors[status])}
        >
          <div className="flex items-center gap-2 mb-2">
            <Brain className={cn("h-4 w-4", statusTextColors[status])} />
            <p className={cn("font-semibold text-sm", statusTextColors[status])}>
              {label || "LLM Analysis"}
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {reasoning}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
