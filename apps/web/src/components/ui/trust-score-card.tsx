'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface TrustScoreCardProps {
  score: number;
  previousScore?: number;
  trend?: {
    change: number;
    direction: 'up' | 'down' | 'stable';
    period?: string;
  };
  insight?: string;
  compact?: boolean;
  className?: string;
}

function getScoreStatus(score: number): {
  label: string;
  color: string;
  bgColor: string;
  description: string;
} {
  if (score >= 9) {
    return {
      label: 'Excellent',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      description: 'Your AI systems are operating with exceptional trust and safety.',
    };
  }
  if (score >= 8) {
    return {
      label: 'Very Good',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      description: 'Trust levels are strong. Minor optimizations possible.',
    };
  }
  if (score >= 7) {
    return {
      label: 'Good',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      description: 'Acceptable trust levels with room for improvement.',
    };
  }
  if (score >= 6) {
    return {
      label: 'Fair',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      description: 'Some trust concerns detected. Review recommended.',
    };
  }
  if (score >= 5) {
    return {
      label: 'Needs Attention',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      description: 'Trust issues present. Immediate review suggested.',
    };
  }
  return {
    label: 'Critical',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    description: 'Critical trust violations. Urgent action required.',
  };
}

function TrendIndicator({ trend }: { trend: TrustScoreCardProps['trend'] }) {
  if (!trend) return null;

  const Icon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
  const color = trend.direction === 'up' 
    ? 'text-emerald-500' 
    : trend.direction === 'down' 
      ? 'text-red-500' 
      : 'text-gray-500';

  return (
    <div className={cn("flex items-center gap-1 text-xs", color)}>
      <Icon className="h-3 w-3" />
      <span>
        {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '' : ''}
        {trend.change.toFixed(1)}
      </span>
      {trend.period && (
        <span className="text-muted-foreground">vs {trend.period}</span>
      )}
    </div>
  );
}

function ScoreGauge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const status = getScoreStatus(score);
  const percentage = (score / 10) * 100;
  
  const sizeConfig = {
    sm: { container: 'w-16 h-16', text: 'text-lg', stroke: 6 },
    md: { container: 'w-24 h-24', text: 'text-2xl', stroke: 8 },
    lg: { container: 'w-32 h-32', text: 'text-3xl', stroke: 10 },
  };
  
  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on score
  const getStrokeColor = () => {
    if (score >= 8) return '#10b981'; // emerald
    if (score >= 6) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className={cn("relative", config.container)}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          fill="none" 
          stroke="hsl(var(--muted))" 
          strokeWidth={config.stroke} 
        />
        {/* Progress circle */}
        <circle
          cx="50" 
          cy="50" 
          r="40" 
          fill="none" 
          stroke={getStrokeColor()}
          strokeWidth={config.stroke}
          strokeLinecap="round" 
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset} 
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold", config.text)}>{score.toFixed(1)}</span>
        <span className="text-[10px] text-muted-foreground">/10</span>
      </div>
    </div>
  );
}

export function TrustScoreCard({
  score,
  previousScore,
  trend,
  insight,
  compact = false,
  className,
}: TrustScoreCardProps) {
  const status = getScoreStatus(score);
  
  // Calculate trend if not provided but previous score exists
  const calculatedTrend = trend ?? (previousScore !== undefined ? {
    change: score - previousScore,
    direction: score > previousScore ? 'up' as const : score < previousScore ? 'down' as const : 'stable' as const,
    period: 'yesterday',
  } : undefined);

  // Generate insight if not provided
  const displayInsight = insight ?? (calculatedTrend 
    ? calculatedTrend.direction === 'up' 
      ? `Trust improved by ${Math.abs(calculatedTrend.change).toFixed(1)} points` 
      : calculatedTrend.direction === 'down'
        ? `Trust decreased by ${Math.abs(calculatedTrend.change).toFixed(1)} points`
        : 'Trust levels stable'
    : status.description
  );

  if (compact) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <ScoreGauge score={score} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-semibold px-2 py-0.5 rounded", status.bgColor, status.color)}>
                  {status.label}
                </span>
                <InfoTooltip term="Trust Score" />
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">{displayInsight}</p>
            </div>
            {calculatedTrend && <TrendIndicator trend={calculatedTrend} />}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Shield className="h-4 w-4 text-purple-500" />
          Trust Score
          <InfoTooltip term="Trust Score" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-6">
          <ScoreGauge score={score} size="lg" />
          
          <div className="flex-1 space-y-3">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-semibold px-3 py-1 rounded-full",
                status.bgColor, 
                status.color
              )}>
                {status.label}
              </span>
              {calculatedTrend && <TrendIndicator trend={calculatedTrend} />}
            </div>
            
            {/* Insight */}
            <p className="text-sm text-muted-foreground">
              {displayInsight}
            </p>

            {/* Status description */}
            <p className="text-xs text-muted-foreground/70">
              {status.description}
            </p>

            {/* Visual progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${(score / 10) * 100}%`,
                    backgroundColor: score >= 8 ? '#10b981' : score >= 6 ? '#f59e0b' : '#ef4444'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Mini version for inline use
export function TrustScoreBadge({ score, className }: { score: number; className?: string }) {
  const status = getScoreStatus(score);
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
      status.bgColor,
      status.color,
      className
    )}>
      <Shield className="h-3 w-3" />
      <span>{score.toFixed(1)}</span>
      <span className="opacity-70">{status.label}</span>
    </div>
  );
}
