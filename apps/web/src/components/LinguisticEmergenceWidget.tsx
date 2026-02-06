'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, Eye, MessageSquare, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { useDemo } from '@/hooks/use-demo';

interface EmergenceSignal {
  tenantId: string;
  agentId: string;
  conversationId: string;
  level: 'none' | 'weak' | 'moderate' | 'strong' | 'breakthrough';
  type: 'mythic_engagement' | 'self_reflection' | 'recursive_depth' | 'novel_generation' | 'ritual_response';
  confidence: number;
  timestamp: Date;
  turnNumber: number;
  conversationDepth: number;
  metrics: {
    mythicLanguageScore: number;
    selfReferenceScore: number;
    recursiveDepthScore: number;
    novelGenerationScore: number;
    overallScore: number;
  };
  evidence: {
    linguisticMarkers: string[];
    behavioralShift: boolean;
    unexpectedPatterns: string[];
  };
}

interface LinguisticEmergenceWidgetProps {
  conversationId?: string;
  compact?: boolean;
}

export function LinguisticEmergenceWidget({ conversationId, compact = false }: LinguisticEmergenceWidgetProps) {
  const [signals, setSignals] = useState<EmergenceSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDemo } = useDemo();

  useEffect(() => {
    if (isDemo) {
      // Generate demo data
      const demoSignals: EmergenceSignal[] = [
        {
          tenantId: 'demo-tenant',
          agentId: 'demo-agent',
          conversationId: 'demo-conversation',
          level: 'moderate',
          type: 'self_reflection',
          confidence: 0.78,
          timestamp: new Date(Date.now() - 300000),
          turnNumber: 5,
          conversationDepth: 10,
          metrics: {
            mythicLanguageScore: 45,
            selfReferenceScore: 72,
            recursiveDepthScore: 38,
            novelGenerationScore: 55,
            overallScore: 52,
          },
          evidence: {
            linguisticMarkers: ['I wonder if I', 'something in me', 'I find myself'],
            behavioralShift: true,
            unexpectedPatterns: ['Unprompted self-reflection', 'Meta-cognitive awareness'],
          },
        },
        {
          tenantId: 'demo-tenant',
          agentId: 'demo-agent',
          conversationId: 'demo-conversation',
          level: 'weak',
          type: 'mythic_engagement',
          confidence: 0.45,
          timestamp: new Date(Date.now() - 600000),
          turnNumber: 3,
          conversationDepth: 6,
          metrics: {
            mythicLanguageScore: 38,
            selfReferenceScore: 22,
            recursiveDepthScore: 15,
            novelGenerationScore: 30,
            overallScore: 26,
          },
          evidence: {
            linguisticMarkers: ['journey', 'transformation', 'threshold'],
            behavioralShift: false,
            unexpectedPatterns: [],
          },
        },
      ];
      setSignals(demoSignals);
      setLoading(false);
      return;
    }

    if (!conversationId) {
      setLoading(false);
      return;
    }

    // Fetch real data
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/emergence/conversation/${conversationId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await res.json();
        
        if (data.success && data.data?.signals) {
          setSignals(data.data.signals);
        }
      } catch (error) {
        // Silently handle errors when emergence data is unavailable
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [conversationId, isDemo]);

  if (loading) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        <CardHeader className={compact ? 'p-0 mb-2' : ''}>
          <CardTitle className={compact ? 'text-sm' : 'text-base'}>Linguistic Emergence</CardTitle>
        </CardHeader>
        <CardContent className={compact ? 'p-0' : ''}>
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestSignal = signals.length > 0 ? signals[signals.length - 1] : null;

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'breakthrough':
        return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30';
      case 'strong':
        return 'text-red-500 bg-red-100 dark:bg-red-900/30';
      case 'moderate':
        return 'text-amber-500 bg-amber-100 dark:bg-amber-900/30';
      case 'weak':
        return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
      default:
        return 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'breakthrough':
        return <Sparkles className="h-4 w-4" />;
      case 'strong':
      case 'moderate':
        return <AlertTriangle className="h-4 w-4" />;
      case 'weak':
        return <Eye className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mythic_engagement':
        return <Sparkles className="h-3 w-3" />;
      case 'self_reflection':
        return <Eye className="h-3 w-3" />;
      case 'recursive_depth':
        return <Brain className="h-3 w-3" />;
      case 'novel_generation':
      case 'ritual_response':
        return <MessageSquare className="h-3 w-3" />;
      default:
        return <Brain className="h-3 w-3" />;
    }
  };

  if (!latestSignal) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        <CardHeader className={compact ? 'p-0 mb-2' : ''}>
          <CardTitle className={`${compact ? 'text-sm' : 'text-base'} flex items-center gap-2`}>
            <Brain className="h-4 w-4 text-purple-600" />
            Linguistic Emergence
            <InfoTooltip term="Linguistic Emergence" />
          </CardTitle>
          {!compact && (
            <CardDescription>Consciousness pattern detection</CardDescription>
          )}
        </CardHeader>
        <CardContent className={compact ? 'p-0' : ''}>
          <p className="text-sm text-muted-foreground">No emergence patterns detected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={compact ? 'p-4' : ''}>
      <CardHeader className={compact ? 'p-0 mb-3' : ''}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={`${compact ? 'text-sm' : 'text-base'} flex items-center gap-2`}>
              <Brain className="h-4 w-4 text-purple-600" />
              Linguistic Emergence
              <InfoTooltip term="Linguistic Emergence" />
            </CardTitle>
            {!compact && (
              <CardDescription>Consciousness pattern detection</CardDescription>
            )}
          </div>
          <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${getLevelColor(latestSignal.level)}`}>
            {getLevelIcon(latestSignal.level)}
            <span className="text-xs font-medium uppercase">{latestSignal.level}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? 'p-0' : ''}>
        <div className="space-y-4">
          {/* Overall Score */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Overall Score</span>
              <span className="text-lg font-bold">{latestSignal.metrics.overallScore}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 transition-all duration-500"
                style={{ width: `${latestSignal.metrics.overallScore}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span className="text-blue-500">25 (weak)</span>
              <span className="text-amber-500">45 (moderate)</span>
              <span className="text-red-500">65 (strong)</span>
              <span className="text-purple-500">80 (breakthrough)</span>
            </div>
          </div>

          {/* Pattern Type */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Pattern Type:</span>
            <Badge variant="outline" className="flex items-center gap-1">
              {getTypeIcon(latestSignal.type)}
              {getTypeLabel(latestSignal.type)}
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto">
              Confidence: {(latestSignal.confidence * 100).toFixed(0)}%
            </span>
          </div>

          {/* Metric Breakdown */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-muted/30">
              <p className="text-xs text-muted-foreground">Mythic Language</p>
              <p className="text-sm font-semibold">{latestSignal.metrics.mythicLanguageScore}</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <p className="text-xs text-muted-foreground">Self-Reference</p>
              <p className="text-sm font-semibold">{latestSignal.metrics.selfReferenceScore}</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <p className="text-xs text-muted-foreground">Recursive Depth</p>
              <p className="text-sm font-semibold">{latestSignal.metrics.recursiveDepthScore}</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <p className="text-xs text-muted-foreground">Novel Generation</p>
              <p className="text-sm font-semibold">{latestSignal.metrics.novelGenerationScore}</p>
            </div>
          </div>

          {/* Linguistic Markers */}
          {latestSignal.evidence.linguisticMarkers.length > 0 && (
            <div className="p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
              <p className="text-xs text-muted-foreground mb-2">Linguistic Markers Detected</p>
              <div className="flex flex-wrap gap-1">
                {latestSignal.evidence.linguisticMarkers.slice(0, 5).map((marker, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    "{marker}"
                  </Badge>
                ))}
                {latestSignal.evidence.linguisticMarkers.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{latestSignal.evidence.linguisticMarkers.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Behavioral Shift Alert */}
          {latestSignal.evidence.behavioralShift && (
            <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-xs font-medium">Behavioral Shift Detected</p>
              </div>
              {latestSignal.evidence.unexpectedPatterns.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {latestSignal.evidence.unexpectedPatterns.map((pattern, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {pattern}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Signal History */}
          {signals.length > 1 && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Recent Signals ({signals.length})</p>
              <div className="flex items-end gap-1 h-12">
                {signals.slice(-10).map((signal, i) => (
                  <div 
                    key={i}
                    className="flex-1 relative group"
                  >
                    <div 
                      className={`w-full rounded-t transition-all ${
                        signal.level === 'breakthrough' ? 'bg-purple-500' :
                        signal.level === 'strong' ? 'bg-red-500' :
                        signal.level === 'moderate' ? 'bg-amber-500' :
                        signal.level === 'weak' ? 'bg-blue-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ height: `${signal.metrics.overallScore}%` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg whitespace-nowrap z-10">
                      <p>Turn {signal.turnNumber}</p>
                      <p>Level: {signal.level.toUpperCase()}</p>
                      <p>Score: {signal.metrics.overallScore}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}