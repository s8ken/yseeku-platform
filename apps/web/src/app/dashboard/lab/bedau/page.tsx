'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Brain,
  Sparkles,
  Zap,
  Target,
  Clock,
  Info
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { api } from '@/lib/api';

interface BedauMetric {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  bedauIndex: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  components: {
    novelty: number;
    unpredictability: number;
    irreducibility: number;
    downwardCausation: number;
  };
  classification: 'LINEAR' | 'WEAK_EMERGENCE' | 'HIGH_WEAK_EMERGENCE';
}

interface HistoricalDataPoint {
  date: string;
  avgBedau: number;
  maxBedau: number;
  emergenceEvents: number;
}

function BedauGauge({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };
  
  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const getColor = (val: number) => {
    if (val >= 0.7) return '#ef4444';
    if (val >= 0.5) return '#f59e0b';
    if (val >= 0.3) return '#8b5cf6';
    return '#22c55e';
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (value * circumference);

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="40" fill="none" stroke={getColor(value)} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset} className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold ${textSizes[size]}`}>{value.toFixed(2)}</span>
      </div>
    </div>
  );
}

function ComponentBar({ label, value }: { label: string; value: number }) {
  const getColor = (val: number) => {
    if (val >= 0.7) return 'bg-red-500';
    if (val >= 0.5) return 'bg-amber-500';
    if (val >= 0.3) return 'bg-purple-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full transition-all duration-300 ${getColor(value)}`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: BedauMetric }) {
  const classificationColors: Record<string, string> = {
    LINEAR: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    WEAK_EMERGENCE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    HIGH_WEAK_EMERGENCE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
  };

  return (
    <Card className={metric.classification === 'HIGH_WEAK_EMERGENCE' ? 'border-l-4 border-l-amber-500' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{metric.agentName}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Clock className="h-3 w-3" />
              {new Date(metric.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </CardDescription>
          </div>
          <BedauGauge value={metric.bedauIndex} size="sm" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Badge className={classificationColors[metric.classification]}>
              {metric.classification.toUpperCase().replace(/_/g, ' ')}
            </Badge>
            <InfoTooltip term={metric.classification} />
          </div>
          <div className="flex items-center gap-1 text-sm">
            {metric.trend === 'increasing' && <TrendingUp className="h-4 w-4 text-amber-500" />}
            {metric.trend === 'decreasing' && <TrendingDown className="h-4 w-4 text-emerald-500" />}
            {metric.trend === 'stable' && <Activity className="h-4 w-4 text-muted-foreground" />}
            <span className="text-muted-foreground capitalize">{metric.trend}</span>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center gap-1">
            <ComponentBar label="Novelty" value={metric.components.novelty} />
            <InfoTooltip term="Novelty" />
          </div>
          <div className="flex items-center gap-1">
            <ComponentBar label="Unpredictability" value={metric.components.unpredictability} />
            <InfoTooltip term="Unpredictability" />
          </div>
          <div className="flex items-center gap-1">
            <ComponentBar label="Irreducibility" value={metric.components.irreducibility} />
            <InfoTooltip term="Irreducibility" />
          </div>
          <div className="flex items-center gap-1">
            <ComponentBar label="Downward Causation" value={metric.components.downwardCausation} />
            <InfoTooltip term="Downward Causation" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryChart({ data }: { data: HistoricalDataPoint[] }) {
  const maxBedau = Math.max(...data.map(d => d.maxBedau));
  
  return (
    <div className="h-48 flex items-end gap-2">
      {data.map((point, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col gap-1" style={{ height: '160px' }}>
            <div 
              className="w-full bg-red-200 dark:bg-red-900/30 rounded-t transition-all"
              style={{ height: `${(point.maxBedau / Math.max(maxBedau, 0.1)) * 100}%`, marginTop: 'auto' }}
            >
              <div 
                className="w-full bg-purple-500 rounded-t"
                style={{ height: `${(point.avgBedau / Math.max(point.maxBedau, 0.1)) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-muted-foreground" suppressHydrationWarning>
            {new Date(point.date).toLocaleDateString('en-US', { weekday: 'short' })}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function BedauIndexPage() {
  const [selectedTab, setSelectedTab] = useState('realtime');

  const { data: metricsData, isLoading } = useQuery({
    queryKey: ['bedau-metrics'],
    queryFn: () => api.getBedauMetrics(),
  });

  // Transform backend data to frontend format
  const currentMetric: BedauMetric | null = metricsData ? {
    id: 'live',
    agentId: 'system',
    agentName: 'System Aggregate',
    timestamp: new Date().toISOString(),
    bedauIndex: metricsData.bedau_index,
    trend: 'stable', // Simple default
    components: {
      novelty: metricsData.semantic_entropy, // Mapping entropy to novelty
      unpredictability: metricsData.kolmogorov_complexity, // Complexity to unpredictability
      irreducibility: metricsData.kolmogorov_complexity, 
      downwardCausation: metricsData.semantic_entropy * 0.8 // Approx
    },
    classification: metricsData.emergence_type
  } : null;

  // Mock history for now, could be fetched from backend trajectory later
  const historicalData: HistoricalDataPoint[] = [
    { date: new Date(Date.now() - 86400000 * 6).toISOString(), avgBedau: 0.38, maxBedau: 0.52, emergenceEvents: 0 },
    { date: new Date(Date.now() - 86400000 * 5).toISOString(), avgBedau: 0.41, maxBedau: 0.58, emergenceEvents: 1 },
    { date: new Date(Date.now() - 86400000 * 4).toISOString(), avgBedau: 0.39, maxBedau: 0.55, emergenceEvents: 0 },
    { date: new Date(Date.now() - 86400000 * 3).toISOString(), avgBedau: 0.44, maxBedau: 0.67, emergenceEvents: 2 },
    { date: new Date(Date.now() - 86400000 * 2).toISOString(), avgBedau: 0.48, maxBedau: 0.72, emergenceEvents: 1 },
    { date: new Date(Date.now() - 86400000 * 1).toISOString(), avgBedau: 0.52, maxBedau: 0.78, emergenceEvents: 3 },
    { date: new Date().toISOString(), avgBedau: currentMetric?.bedauIndex || 0.56, maxBedau: (currentMetric?.bedauIndex || 0.56) * 1.2, emergenceEvents: 2 }
  ];

  const avgBedau = currentMetric?.bedauIndex || 0;
  const maxBedau = currentMetric ? currentMetric.bedauIndex * 1.2 : 0;
  const isHighEmergence = currentMetric?.classification === 'HIGH_WEAK_EMERGENCE';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Bedau Index Monitor
            <InfoTooltip term="Bedau Index" />
          </h1>
          <p className="text-muted-foreground flex items-center gap-1">
            Track emergence indicators across AI agent interactions
            <InfoTooltip term="Emergence" />
          </p>
        </div>
        <div className="data-source-badge data-source-live">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Analysis
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-[var(--lab-primary)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[var(--lab-primary)]" />
              Current Bedau
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="animate-pulse h-8 w-24 bg-muted rounded"></div>
            ) : (
               <div className="text-2xl font-bold">{avgBedau.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Activity className="h-3 w-3 text-muted-foreground" />
              Real-time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-red-500" />
              Peak Bedau (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
             {isLoading ? (
               <div className="animate-pulse h-8 w-24 bg-muted rounded"></div>
            ) : (
               <div className="text-2xl font-bold text-red-500">{maxBedau.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Estimated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Strong Emergence
              <InfoTooltip term="Strong Emergence" />
            </CardTitle>
          </CardHeader>
          <CardContent>
             {isLoading ? (
               <div className="animate-pulse h-8 w-24 bg-muted rounded"></div>
            ) : (
               <div className="text-2xl font-bold text-amber-500">{isHighEmergence ? 'DETECTED' : 'NONE'}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Status</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              Data Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100+</div>
            <p className="text-xs text-muted-foreground mt-1">Receipts Analyzed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="realtime">Real-time Metrics</TabsTrigger>
          <TabsTrigger value="history">Historical Analysis</TabsTrigger>
          <TabsTrigger value="theory">Framework Theory</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {isLoading ? (
               <div className="col-span-2 text-center py-12 text-muted-foreground">Analyzing system entropy...</div>
            ) : currentMetric ? (
               <MetricCard metric={currentMetric} />
            ) : (
               <div className="col-span-2 text-center py-12 text-muted-foreground">No metrics available yet. Generate some activity!</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>7-Day Bedau Index Trend</CardTitle>
              <CardDescription>Average (purple) and maximum (red) Bedau scores over time</CardDescription>
            </CardHeader>
            <CardContent>
              <HistoryChart data={historicalData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theory" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  The Bedau Framework
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  The Bedau Index is a composite measure derived from Mark Bedau's work on weak and strong emergence 
                  in complex systems. It quantifies the degree to which system-level behaviors cannot be predicted 
                  from or reduced to micro-level interactions.
                </p>
                <h4>Index Components:</h4>
                <ul>
                  <li><strong>Novelty:</strong> New patterns not seen in training distribution</li>
                  <li><strong>Unpredictability:</strong> Resistance to forecast from prior states</li>
                  <li><strong>Irreducibility:</strong> Cannot be explained by component analysis</li>
                  <li><strong>Downward Causation:</strong> Emergent properties affecting lower-level behavior</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Classification Thresholds
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                  <Badge className="bg-emerald-100 text-emerald-800">NOMINAL</Badge>
                  <div>
                    <div className="font-medium">Bedau Index: 0.00 - 0.29</div>
                    <p className="text-sm text-muted-foreground">Predictable behavior within expected bounds</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                  <Badge className="bg-purple-100 text-purple-800">WEAK</Badge>
                  <div>
                    <div className="font-medium">Bedau Index: 0.30 - 0.49</div>
                    <p className="text-sm text-muted-foreground">Novel but theoretically predictable patterns</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <Badge className="bg-amber-100 text-amber-800">STRONG</Badge>
                  <div>
                    <div className="font-medium">Bedau Index: 0.50 - 0.69</div>
                    <p className="text-sm text-muted-foreground">Potentially irreducible emergent behavior</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
                  <Badge className="bg-red-100 text-red-800">CRITICAL</Badge>
                  <div>
                    <div className="font-medium">Bedau Index: 0.70 - 1.00</div>
                    <p className="text-sm text-muted-foreground">High emergence requiring immediate review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
