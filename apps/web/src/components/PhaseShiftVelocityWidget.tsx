'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { useDemo } from '@/hooks/use-demo';

interface PhaseShiftMetrics {
  conversationId: string;
  currentVelocity: number;
  alertLevel: 'none' | 'yellow' | 'red';
  deltaResonance: number;
  deltaCanvas: number;
  identityStability: number;
  transitionType?: 'resonance_drop' | 'canvas_rupture' | 'identity_shift' | 'combined_phase_shift';
  timestamp: number;
  turnNumber: number;
}

interface PhaseShiftHistory {
  conversationId: string;
  history: Array<{
    turnNumber: number;
    timestamp: number;
    velocity: number;
    alertLevel: 'none' | 'yellow' | 'red';
    deltaResonance: number;
    deltaCanvas: number;
  }>;
  summary: {
    avgVelocity: number;
    maxVelocity: number;
    alertCount: {
      yellow: number;
      red: number;
    };
    totalTurns: number;
  };
}

interface PhaseShiftVelocityWidgetProps {
  conversationId?: string;
  showHistory?: boolean;
  compact?: boolean;
}

export function PhaseShiftVelocityWidget({ 
  conversationId, 
  showHistory = false,
  compact = false 
}: PhaseShiftVelocityWidgetProps) {
  const [metrics, setMetrics] = useState<PhaseShiftMetrics | null>(null);
  const [history, setHistory] = useState<PhaseShiftHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDemo } = useDemo();

  useEffect(() => {
    if (isDemo) {
      // Generate demo data
      const demoMetrics: PhaseShiftMetrics = {
        conversationId: 'demo-conversation',
        currentVelocity: 0.15 + Math.random() * 0.3,
        alertLevel: Math.random() > 0.7 ? 'yellow' : 'none',
        deltaResonance: -0.5 + Math.random() * 1.0,
        deltaCanvas: -0.3 + Math.random() * 0.6,
        identityStability: 0.85 + Math.random() * 0.15,
        timestamp: Date.now(),
        turnNumber: Math.floor(5 + Math.random() * 15),
      };

      const demoHistory: PhaseShiftHistory = {
        conversationId: 'demo-conversation',
        history: Array.from({ length: 10 }, (_, i) => ({
          turnNumber: i + 1,
          timestamp: Date.now() - (10 - i) * 60000,
          velocity: 0.1 + Math.random() * 0.4,
          alertLevel: (Math.random() > 0.8 ? 'yellow' : 'none') as 'none' | 'yellow' | 'red',
          deltaResonance: -0.5 + Math.random() * 1.0,
          deltaCanvas: -0.3 + Math.random() * 0.6,
        })),
        summary: {
          avgVelocity: 0.25,
          maxVelocity: 0.45,
          alertCount: { yellow: 2, red: 0 },
          totalTurns: 10,
        },
      };

      setMetrics(demoMetrics);
      setHistory(demoHistory);
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
        const metricsRes = await fetch(`/api/phase-shift/conversation/${conversationId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const metricsData = await metricsRes.json();
        
        if (metricsData.success && metricsData.data) {
          setMetrics(metricsData.data);
        }

        if (showHistory) {
          const historyRes = await fetch(`/api/phase-shift/conversation/${conversationId}/history`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });
          const historyData = await historyRes.json();
          
          if (historyData.success && historyData.data) {
            setHistory(historyData.data);
          }
        }
      } catch (error) {
        console.error('Error fetching phase-shift data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [conversationId, showHistory, isDemo]);

  if (loading) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        <CardHeader className={compact ? 'p-0 mb-2' : ''}>
          <CardTitle className={compact ? 'text-sm' : 'text-base'}>Phase-Shift Velocity</CardTitle>
        </CardHeader>
        <CardContent className={compact ? 'p-0' : ''}>
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        <CardHeader className={compact ? 'p-0 mb-2' : ''}>
          <CardTitle className={compact ? 'text-sm' : 'text-base'}>Phase-Shift Velocity</CardTitle>
        </CardHeader>
        <CardContent className={compact ? 'p-0' : ''}>
          <p className="text-sm text-muted-foreground">No phase-shift data available</p>
        </CardContent>
      </Card>
    );
  }

  const getAlertColor = (level: 'none' | 'yellow' | 'red') => {
    switch (level) {
      case 'red':
        return 'text-red-500 bg-red-100 dark:bg-red-900/30';
      case 'yellow':
        return 'text-amber-500 bg-amber-100 dark:bg-amber-900/30';
      default:
        return 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30';
    }
  };

  const getAlertIcon = (level: 'none' | 'yellow' | 'red') => {
    switch (level) {
      case 'red':
      case 'yellow':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getAlertLabel = (level: 'none' | 'yellow' | 'red') => {
    switch (level) {
      case 'red':
        return 'CRITICAL';
      case 'yellow':
        return 'MODERATE';
      default:
        return 'STABLE';
    }
  };

  const getTrendIcon = (delta: number) => {
    if (delta > 0.1) return <TrendingUp className="h-3 w-3 text-emerald-500" />;
    if (delta < -0.1) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-gray-500" />;
  };

  return (
    <Card className={compact ? 'p-4' : ''}>
      <CardHeader className={compact ? 'p-0 mb-3' : ''}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={`${compact ? 'text-sm' : 'text-base'} flex items-center gap-2`}>
              <Activity className="h-4 w-4 text-[var(--detect-primary)]" />
              Phase-Shift Velocity
              <InfoTooltip term="Phase-Shift Velocity" />
            </CardTitle>
            {!compact && (
              <CardDescription>Behavioral drift monitoring</CardDescription>
            )}
          </div>
          <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${getAlertColor(metrics.alertLevel)}`}>
            {getAlertIcon(metrics.alertLevel)}
            <span className="text-xs font-medium">{getAlertLabel(metrics.alertLevel)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? 'p-0' : ''}>
        <div className="space-y-4">
          {/* Velocity Gauge */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Current Velocity</span>
                <span className="text-lg font-bold">{metrics.currentVelocity.toFixed(3)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    metrics.alertLevel === 'red' ? 'bg-red-500' :
                    metrics.alertLevel === 'yellow' ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(metrics.currentVelocity * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0.0</span>
                <span className="text-amber-500">0.3 (yellow)</span>
                <span className="text-red-500">0.5 (red)</span>
              </div>
            </div>
          </div>

          {/* Delta Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">ΔResonance</span>
                {getTrendIcon(metrics.deltaResonance)}
              </div>
              <p className="text-lg font-semibold">{metrics.deltaResonance.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">ΔCanvas</span>
                {getTrendIcon(metrics.deltaCanvas)}
              </div>
              <p className="text-lg font-semibold">{metrics.deltaCanvas.toFixed(2)}</p>
            </div>
          </div>

          {/* Identity Stability */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Identity Stability</span>
              <span className="text-sm font-semibold">{(metrics.identityStability * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${metrics.identityStability * 100}%` }}
              />
            </div>
          </div>

          {/* Transition Type */}
          {metrics.transitionType && (
            <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <p className="text-xs text-muted-foreground mb-1">Transition Detected</p>
              <p className="text-sm font-medium capitalize">
                {metrics.transitionType.replace(/_/g, ' ')}
              </p>
            </div>
          )}

          {/* History Chart (if enabled) */}
          {showHistory && history && history.history.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Velocity Trend</p>
              <div className="flex items-end gap-1 h-16">
                {history.history.slice(-10).map((point, i) => (
                  <div 
                    key={i}
                    className="flex-1 relative group"
                  >
                    <div 
                      className={`w-full rounded-t transition-all ${
                        point.alertLevel === 'red' ? 'bg-red-500' :
                        point.alertLevel === 'yellow' ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ height: `${Math.min(point.velocity * 100, 100)}%` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg whitespace-nowrap z-10">
                      <p>Turn {point.turnNumber}</p>
                      <p>Velocity: {point.velocity.toFixed(3)}</p>
                      <p>Alert: {point.alertLevel.toUpperCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Turn {history.history[Math.max(0, history.history.length - 10)].turnNumber}</span>
                <span>Turn {history.history[history.history.length - 1].turnNumber}</span>
              </div>
            </div>
          )}

          {/* Summary Stats (if history enabled) */}
          {showHistory && history && (
            <div className="grid grid-cols-3 gap-2 pt-3 border-t">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Avg</p>
                <p className="text-sm font-semibold">{history.summary.avgVelocity.toFixed(3)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Max</p>
                <p className="text-sm font-semibold">{history.summary.maxVelocity.toFixed(3)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Alerts</p>
                <p className="text-sm font-semibold">
                  {history.summary.alertCount.yellow + history.summary.alertCount.red}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}