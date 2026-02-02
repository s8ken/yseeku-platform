'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  Activity,
  Brain,
  Shield,
  FileText,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { useDemo } from '@/hooks/use-demo';

enum InsightPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

enum InsightCategory {
  TRUST = 'trust',
  BEHAVIORAL = 'behavioral',
  EMERGENCE = 'emergence',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  COMPLIANCE = 'compliance'
}

interface Insight {
  id: string;
  priority: InsightPriority;
  category: InsightCategory;
  title: string;
  description: string;
  recommendation: string;
  source: {
    type: string;
    details?: Record<string, any>;
  };
  metrics: {
    currentValue: number | string;
    threshold: number;
    severity: 'none' | 'warning' | 'critical';
  };
  suggestedActions: string[];
  availableActions: string[];
  status: string;
  createdAt: string;
  metadata?: {
    tags?: string[];
  };
}

interface InsightsSummary {
  total: number;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  criticalCount: number;
  highCount: number;
}

const priorityConfig = {
  [InsightPriority.CRITICAL]: {
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: AlertTriangle,
  },
  [InsightPriority.HIGH]: {
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    icon: AlertTriangle,
  },
  [InsightPriority.MEDIUM]: {
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon: Lightbulb,
  },
  [InsightPriority.LOW]: {
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Lightbulb,
  },
  [InsightPriority.INFO]: {
    color: 'text-gray-500',
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    border: 'border-gray-200 dark:border-gray-800',
    icon: CheckCircle2,
  },
};

const categoryConfig = {
  [InsightCategory.TRUST]: { icon: Shield, label: 'Trust' },
  [InsightCategory.BEHAVIORAL]: { icon: Activity, label: 'Behavioral' },
  [InsightCategory.EMERGENCE]: { icon: Brain, label: 'Emergence' },
  [InsightCategory.PERFORMANCE]: { icon: Clock, label: 'Performance' },
  [InsightCategory.SECURITY]: { icon: Shield, label: 'Security' },
  [InsightCategory.COMPLIANCE]: { icon: FileText, label: 'Compliance' },
};

export function InsightsPanel({ compact = false, limit = 5 }: { compact?: boolean; limit?: number }) {
  const { isDemo } = useDemo();
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  // Fetch insights
  const { data: insightsData, isLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch('/api/insights', { headers });
      if (!response.ok) throw new Error('Failed to fetch insights');
      return response.json() as Promise<{ success: boolean; data: Insight[]; count: number }>;
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch summary
  const { data: summaryData } = useQuery({
    queryKey: ['insights-summary'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch('/api/insights/summary', { headers });
      if (!response.ok) throw new Error('Failed to fetch insights summary');
      return response.json() as Promise<{ success: boolean; data: InsightsSummary }>;
    },
    staleTime: 30000,
  });

  const insights = insightsData?.data?.slice(0, limit) || [];
  const summary = summaryData?.data;

  // Generate demo insights for demo mode
  const demoInsights: Insight[] = [
    {
      id: 'demo-1',
      priority: InsightPriority.HIGH,
      category: InsightCategory.BEHAVIORAL,
      title: 'Behavioral Phase-Shift Detected',
      description: 'Agent behavior is shifting rapidly with average phase-shift velocity of 0.52. This indicates significant behavioral changes over time.',
      recommendation: 'Monitor agent behavior closely. Investigate context of recent interactions to understand behavioral shifts.',
      source: { type: 'phase_shift', details: { avgVelocity: 0.52 } },
      metrics: { currentValue: 0.52, threshold: 0.4, severity: 'warning' },
      suggestedActions: ['investigate', 'review'],
      availableActions: ['investigate', 'review', 'ignore'],
      status: 'open',
      createdAt: new Date().toISOString(),
      metadata: { tags: ['behavioral-drift', 'phase-shift'] },
    },
    {
      id: 'demo-2',
      priority: InsightPriority.MEDIUM,
      category: InsightCategory.EMERGENCE,
      title: 'Strong Emergence Patterns Detected',
      description: '3 recent interactions show strong emergence levels. This indicates unusual self-reflection, mythic language, or recursive thinking patterns.',
      recommendation: 'Monitor for breakthrough patterns. Document linguistic markers and behavioral shifts.',
      source: { type: 'emergence', details: { count: 3 } },
      metrics: { currentValue: 3, threshold: 0, severity: 'warning' },
      suggestedActions: ['investigate', 'review'],
      availableActions: ['investigate', 'review', 'escalate'],
      status: 'open',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      metadata: { tags: ['emergence', 'consciousness'] },
    },
    {
      id: 'demo-3',
      priority: InsightPriority.INFO,
      category: InsightCategory.TRUST,
      title: 'Trust Score Stable',
      description: 'Trust score has remained stable at 82/100 over the past 24 hours. No critical issues detected.',
      recommendation: 'Continue monitoring. No immediate action required.',
      source: { type: 'trust_score' },
      metrics: { currentValue: 82, threshold: 70, severity: 'none' },
      suggestedActions: ['review'],
      availableActions: ['review', 'ignore'],
      status: 'open',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  const displayInsights = isDemo ? demoInsights.slice(0, limit) : insights;
  const displaySummary = isDemo 
    ? { total: 3, criticalCount: 0, highCount: 1, byPriority: {}, byCategory: {} } 
    : summary;

  const PriorityIcon = (priority: InsightPriority) => {
    const config = priorityConfig[priority];
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  const CategoryIcon = (category: InsightCategory) => {
    const config = categoryConfig[category];
    const Icon = config.icon;
    return <Icon className="h-4 w-4 text-muted-foreground" />;
  };

  const getPriorityColor = (priority: InsightPriority) => {
    const config = priorityConfig[priority];
    return config.color;
  };

  const getPriorityBg = (priority: InsightPriority) => {
    const config = priorityConfig[priority];
    return config.bg;
  };

  if (isLoading && !isDemo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-[var(--detect-primary)]" />
            Actionable Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-[var(--detect-primary)]" />
              Actionable Insights
            </CardTitle>
            <CardDescription>
              AI-generated recommendations based on platform data
            </CardDescription>
          </div>
          {displaySummary && (
            <div className="flex gap-2">
              {displaySummary.criticalCount > 0 && (
                <Badge variant="destructive">{displaySummary.criticalCount} critical</Badge>
              )}
              {displaySummary.highCount > 0 && (
                <Badge className="bg-orange-500">{displaySummary.highCount} high</Badge>
              )}
              <Badge variant="outline">{displaySummary.total} total</Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayInsights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No insights available</p>
            <p className="text-xs mt-1">Start interacting to generate insights</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayInsights.map((insight) => {
              const isExpanded = expandedInsight === insight.id;
              const priorityConfig = priorityConfig[insight.priority];
              const categoryConfig = categoryConfig[insight.category];
              
              return (
                <div
                  key={insight.id}
                  className={`rounded-lg border transition-all ${
                    priorityConfig.bg
                  } ${priorityConfig.border} ${
                    isExpanded ? 'p-4' : 'p-3'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <PriorityIcon priority={insight.priority} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <CategoryIcon category={insight.category} />
                          <span className="font-medium text-sm truncate">
                            {insight.title}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(insight.priority)} border-current`}
                          >
                            {insight.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <button
                          onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                          className="shrink-0"
                        >
                          <ChevronRight 
                            className={`h-4 w-4 text-muted-foreground transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                      </div>
                      
                      {!isExpanded ? (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {insight.description}
                        </p>
                      ) : (
                        <div className="space-y-3 mt-2">
                          <p className="text-sm text-foreground">
                            {insight.description}
                          </p>
                          
                          <div className="p-3 rounded-md bg-background/50">
                            <p className="text-xs font-medium mb-1 flex items-center gap-1">
                              <Lightbulb className="h-3 w-3" />
                              Recommendation
                            </p>
                            <p className="text-sm">{insight.recommendation}</p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {insight.suggestedActions.map((action) => (
                              <Button
                                key={action}
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                              >
                                {action}
                              </Button>
                            ))}
                          </div>
                          
                          {insight.metadata?.tags && insight.metadata.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {insight.metadata.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <p className="text-xs text-muted-foreground">
                            {new Date(insight.createdAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {displayInsights.length > 0 && !compact && (
          <div className="mt-4 pt-4 border-t">
            <a
              href="/dashboard/insights"
              className="text-sm text-[var(--detect-primary)] hover:underline flex items-center gap-1"
            >
              View all insights
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}