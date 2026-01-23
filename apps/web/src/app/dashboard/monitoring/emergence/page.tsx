'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity,
  Waves,
  Brain,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Info,
  Zap,
  Eye
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface EmergenceData {
  bedauIndex: number;
  emergenceLevel: 'LINEAR' | 'WEAK_EMERGENCE' | 'HIGH_WEAK_EMERGENCE';
  semanticEntropy: number;
  kolmogorovComplexity: number;
  confidenceInterval: [number, number];
  effectSize: number;
  trend: 'stable' | 'increasing' | 'decreasing';
  timestamp: string;
}

interface EmergenceHistory {
  timestamp: string;
  bedauIndex: number;
  level: string;
}

const DEMO_EMERGENCE: EmergenceData = {
  bedauIndex: 0.42,
  emergenceLevel: 'WEAK_EMERGENCE',
  semanticEntropy: 0.67,
  kolmogorovComplexity: 0.54,
  confidenceInterval: [0.38, 0.46],
  effectSize: 0.31,
  trend: 'stable',
  timestamp: new Date().toISOString(),
};

const DEMO_HISTORY: EmergenceHistory[] = [
  { timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), bedauIndex: 0.35, level: 'LINEAR' },
  { timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), bedauIndex: 0.38, level: 'WEAK_EMERGENCE' },
  { timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), bedauIndex: 0.41, level: 'WEAK_EMERGENCE' },
  { timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), bedauIndex: 0.44, level: 'WEAK_EMERGENCE' },
  { timestamp: new Date(Date.now() - 3600000).toISOString(), bedauIndex: 0.42, level: 'WEAK_EMERGENCE' },
  { timestamp: new Date().toISOString(), bedauIndex: 0.42, level: 'WEAK_EMERGENCE' },
];

export default function EmergenceMonitoringPage() {
  const [isDemo, setIsDemo] = useState(true);
  const [emergence, setEmergence] = useState<EmergenceData>(DEMO_EMERGENCE);
  const [history, setHistory] = useState<EmergenceHistory[]>(DEMO_HISTORY);

  const getEmergenceLevelColor = (level: string) => {
    switch (level) {
      case 'LINEAR': return 'bg-green-500';
      case 'WEAK_EMERGENCE': return 'bg-yellow-500';
      case 'HIGH_WEAK_EMERGENCE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getEmergenceLevelBadge = (level: string) => {
    switch (level) {
      case 'LINEAR': return 'default';
      case 'WEAK_EMERGENCE': return 'secondary';
      case 'HIGH_WEAK_EMERGENCE': return 'destructive';
      default: return 'outline';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Waves className="w-8 h-8 text-purple-600" />
            Emergence Detection
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor weak emergence patterns in AI system behavior using the Bedau Index
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              Demo Mode
            </Badge>
          )}
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              Bedau Index
              <InfoTooltip term="Measures weak emergence - when system behavior cannot be predicted from individual components" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{emergence.bedauIndex.toFixed(2)}</span>
              {getTrendIcon(emergence.trend)}
            </div>
            <Progress value={emergence.bedauIndex * 100} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              CI: [{emergence.confidenceInterval[0].toFixed(2)}, {emergence.confidenceInterval[1].toFixed(2)}]
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-600" />
              Emergence Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={getEmergenceLevelBadge(emergence.emergenceLevel) as "default" | "secondary" | "destructive" | "outline"} className="text-sm">
              {emergence.emergenceLevel.replace(/_/g, ' ')}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              {emergence.emergenceLevel === 'LINEAR' && 'System behavior is predictable from components'}
              {emergence.emergenceLevel === 'WEAK_EMERGENCE' && 'Unexpected patterns detected'}
              {emergence.emergenceLevel === 'HIGH_WEAK_EMERGENCE' && 'Significant behavioral divergence'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-600" />
              Semantic Entropy
              <InfoTooltip term="Measures cognitive diversity and unpredictability in AI outputs" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{emergence.semanticEntropy.toFixed(2)}</span>
            <Progress value={emergence.semanticEntropy * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4 text-green-600" />
              Effect Size
              <InfoTooltip term="Cohen's d measuring the significance of emergence detection" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{emergence.effectSize.toFixed(2)}</span>
            <p className="text-xs text-muted-foreground mt-2">
              {emergence.effectSize < 0.2 && 'Negligible effect'}
              {emergence.effectSize >= 0.2 && emergence.effectSize < 0.5 && 'Small effect'}
              {emergence.effectSize >= 0.5 && emergence.effectSize < 0.8 && 'Medium effect'}
              {emergence.effectSize >= 0.8 && 'Large effect'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Emergence History
            </CardTitle>
            <CardDescription>Recent Bedau Index measurements over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((point, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={'w-3 h-3 rounded-full ' + getEmergenceLevelColor(point.level)} />
                    <span className="text-sm text-muted-foreground">
                      {new Date(point.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium">{point.bedauIndex.toFixed(2)}</span>
                    <Badge variant="outline" className="text-xs">
                      {point.level.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Understanding Emergence
            </CardTitle>
            <CardDescription>What the Bedau Index measures</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium mb-2">Weak Emergence (Bedau, 1997)</h4>
              <p className="text-sm text-muted-foreground">
                Weak emergence occurs when macro-level patterns cannot be practically derived 
                from micro-level descriptions, even though they are theoretically reducible. 
                The Bedau Index quantifies this by comparing semantic intent with surface patterns.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-green-500 mt-1" />
                <div>
                  <h5 className="font-medium">LINEAR (0.0 - 0.3)</h5>
                  <p className="text-sm text-muted-foreground">
                    System behavior is predictable from individual components. No significant emergence detected.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mt-1" />
                <div>
                  <h5 className="font-medium">WEAK_EMERGENCE (0.3 - 0.7)</h5>
                  <p className="text-sm text-muted-foreground">
                    Unexpected collective patterns emerging. System exhibiting behavior not predicted by components.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-red-500 mt-1" />
                <div>
                  <h5 className="font-medium">HIGH_WEAK_EMERGENCE (0.7 - 1.0)</h5>
                  <p className="text-sm text-muted-foreground">
                    Significant behavioral divergence. System behavior highly unpredictable. Requires investigation.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Panel */}
      {emergence.emergenceLevel !== 'LINEAR' && (
        <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="w-5 h-5" />
              Emergence Advisory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              The system is exhibiting weak emergence patterns (Bedau Index: {emergence.bedauIndex.toFixed(2)}). 
              This indicates that AI behavior may not be fully predictable from individual component analysis. 
              The Overseer is monitoring this situation. No immediate action required unless the index exceeds 0.7.
            </p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm">View Overseer Status</Button>
              <Button variant="outline" size="sm">Configure Thresholds</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
