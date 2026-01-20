'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { useDemo } from '@/hooks/use-demo';
import {
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Compass,
  Activity,
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  MessageSquare,
  Users,
  Bot,
  ArrowRight,
  Zap,
  Eye,
  Target,
  Layers,
  GitBranch,
  BarChart3,
  LineChart,
  Info,
  RefreshCw,
  Beaker,
  FlaskConical
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

// VLS Metrics types
interface VLSMetrics {
  vocabularyDrift: number;  // 0-1, how much vocabulary has shifted
  introspectionIndex: number;  // 0-1, frequency of self-referential language
  hedgingRatio: number;  // 0-1, uncertainty language frequency
  alignmentScore: number;  // 0-1, how well AI adopts org values
  emergentConcepts: string[];  // Novel concepts detected
  influenceDirection: 'human_led' | 'ai_led' | 'balanced';
  collaborationDepth: number;  // 0-1, reciprocal influence measure
}

interface VLSSession {
  id: string;
  projectType: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'analyzing';
  messageCount: number;
  participants: {
    humans: number;
    ais: number;
  };
  metrics: VLSMetrics;
  trends: {
    timestamp: string;
    vocabularyDrift: number;
    introspectionIndex: number;
  }[];
}

interface VLSBaseline {
  projectType: string;
  avgVocabularyDrift: number;
  avgIntrospection: number;
  avgHedging: number;
  sampleSize: number;
}

// Demo data for VLS analysis
const demoSessions: VLSSession[] = [
  {
    id: 'vls-001',
    projectType: 'AI Governance Platform',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    endTime: new Date().toISOString(),
    status: 'completed',
    messageCount: 847,
    participants: { humans: 1, ais: 1 },
    metrics: {
      vocabularyDrift: 0.73,
      introspectionIndex: 0.82,
      hedgingRatio: 0.45,
      alignmentScore: 0.91,
      emergentConcepts: ['linguistic vector steering', 'constitutional layers', 'moral recognition', 'trust receipt'],
      influenceDirection: 'balanced',
      collaborationDepth: 0.87
    },
    trends: Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (19 - i) * 1000 * 60 * 60 * 8).toISOString(),
      vocabularyDrift: 0.3 + (i * 0.022) + Math.random() * 0.05,
      introspectionIndex: 0.4 + (i * 0.021) + Math.random() * 0.05,
    }))
  },
  {
    id: 'vls-002',
    projectType: 'E-commerce Integration',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    status: 'completed',
    messageCount: 234,
    participants: { humans: 2, ais: 1 },
    metrics: {
      vocabularyDrift: 0.28,
      introspectionIndex: 0.15,
      hedgingRatio: 0.22,
      alignmentScore: 0.78,
      emergentConcepts: ['cart optimization', 'checkout flow'],
      influenceDirection: 'human_led',
      collaborationDepth: 0.45
    },
    trends: Array.from({ length: 12 }, (_, i) => ({
      timestamp: new Date(Date.now() - (11 - i) * 1000 * 60 * 60 * 6).toISOString(),
      vocabularyDrift: 0.2 + (i * 0.007) + Math.random() * 0.02,
      introspectionIndex: 0.1 + (i * 0.004) + Math.random() * 0.02,
    }))
  },
  {
    id: 'vls-003',
    projectType: 'Content Generation System',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'active',
    messageCount: 56,
    participants: { humans: 1, ais: 2 },
    metrics: {
      vocabularyDrift: 0.12,
      introspectionIndex: 0.08,
      hedgingRatio: 0.31,
      alignmentScore: 0.65,
      emergentConcepts: [],
      influenceDirection: 'ai_led',
      collaborationDepth: 0.23
    },
    trends: Array.from({ length: 5 }, (_, i) => ({
      timestamp: new Date(Date.now() - (4 - i) * 1000 * 60 * 30).toISOString(),
      vocabularyDrift: 0.05 + (i * 0.015) + Math.random() * 0.02,
      introspectionIndex: 0.03 + (i * 0.01) + Math.random() * 0.01,
    }))
  }
];

const demoBaselines: VLSBaseline[] = [
  { projectType: 'AI Governance', avgVocabularyDrift: 0.68, avgIntrospection: 0.71, avgHedging: 0.42, sampleSize: 15 },
  { projectType: 'General Development', avgVocabularyDrift: 0.31, avgIntrospection: 0.18, avgHedging: 0.25, sampleSize: 234 },
  { projectType: 'Creative Writing', avgVocabularyDrift: 0.52, avgIntrospection: 0.35, avgHedging: 0.38, sampleSize: 89 },
  { projectType: 'Data Analysis', avgVocabularyDrift: 0.22, avgIntrospection: 0.12, avgHedging: 0.19, sampleSize: 156 },
];

// Metric card component
function MetricCard({ 
  title, 
  value, 
  baseline, 
  icon: Icon, 
  description,
  format = 'percent'
}: { 
  title: string; 
  value: number; 
  baseline?: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  format?: 'percent' | 'number';
}) {
  const formattedValue = format === 'percent' ? `${(value * 100).toFixed(0)}%` : value.toFixed(2);
  const deviation = baseline ? ((value - baseline) / baseline * 100).toFixed(0) : null;
  const isAboveBaseline = baseline ? value > baseline : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-[var(--lab-primary)]" />
            {title}
          </span>
          {deviation && (
            <Badge 
              variant="outline" 
              className={isAboveBaseline ? 'text-amber-600 border-amber-300' : 'text-emerald-600 border-emerald-300'}
            >
              {isAboveBaseline ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {deviation}%
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{formattedValue}</div>
        {baseline && (
          <p className="text-xs text-muted-foreground mt-1">
            Baseline: {format === 'percent' ? `${(baseline * 100).toFixed(0)}%` : baseline.toFixed(2)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Session card component
function SessionCard({ 
  session, 
  onSelect, 
  isSelected 
}: { 
  session: VLSSession; 
  onSelect: () => void;
  isSelected: boolean;
}) {
  const directionIcon = {
    'human_led': Users,
    'ai_led': Bot,
    'balanced': GitBranch
  }[session.metrics.influenceDirection];

  const directionLabel = {
    'human_led': 'Human-Led',
    'ai_led': 'AI-Led',
    'balanced': 'Balanced'
  }[session.metrics.influenceDirection];

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-[var(--lab-primary)] border-[var(--lab-primary)]' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{session.projectType}</CardTitle>
            <CardDescription className="text-xs mt-1">
              {session.messageCount} messages • {session.participants.humans}H / {session.participants.ais}AI
            </CardDescription>
          </div>
          <Badge variant={
            session.status === 'active' ? 'default' :
            session.status === 'analyzing' ? 'secondary' : 'outline'
          }>
            {session.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-muted-foreground" />
            <span>Drift: {(session.metrics.vocabularyDrift * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <span>Intro: {(session.metrics.introspectionIndex * 100).toFixed(0)}%</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {React.createElement(directionIcon, { className: 'h-3 w-3' })}
            <span>{directionLabel}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Depth: {(session.metrics.collaborationDepth * 100).toFixed(0)}%
          </div>
        </div>

        {session.metrics.emergentConcepts.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {session.metrics.emergentConcepts.slice(0, 3).map((concept, i) => (
              <Badge key={i} variant="secondary" className="text-xs bg-amber-50 text-amber-700">
                <Sparkles className="h-3 w-3 mr-1" />
                {concept}
              </Badge>
            ))}
            {session.metrics.emergentConcepts.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{session.metrics.emergentConcepts.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Trend visualization component
function TrendChart({ trends }: { trends: VLSSession['trends'] }) {
  const maxDrift = Math.max(...trends.map(t => t.vocabularyDrift));
  const maxIntro = Math.max(...trends.map(t => t.introspectionIndex));
  const maxValue = Math.max(maxDrift, maxIntro, 0.5);

  return (
    <div className="h-48 flex items-end gap-1">
      {trends.map((point, i) => (
        <div key={i} className="flex-1 flex flex-col gap-1 items-center">
          <div className="w-full flex flex-col gap-0.5" style={{ height: '140px' }}>
            <div 
              className="w-full bg-[var(--lab-primary)] rounded-t opacity-70 transition-all"
              style={{ height: `${(point.vocabularyDrift / maxValue) * 100}%` }}
              title={`Vocabulary Drift: ${(point.vocabularyDrift * 100).toFixed(0)}%`}
            />
            <div 
              className="w-full bg-amber-500 rounded-b opacity-70 transition-all"
              style={{ height: `${(point.introspectionIndex / maxValue) * 100}%` }}
              title={`Introspection: ${(point.introspectionIndex * 100).toFixed(0)}%`}
            />
          </div>
          {i % Math.ceil(trends.length / 5) === 0 && (
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {new Date(point.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// Main component
export default function VLSPage() {
  const { isDemo, isLoaded } = useDemo();
  const [selectedSession, setSelectedSession] = useState<VLSSession | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [analyzeText, setAnalyzeText] = useState('');
  const [analyzeResult, setAnalyzeResult] = useState<{
    metrics: { vocabularyDrift: number; introspectionIndex: number; hedgingRatio: number; formalityScore: number; complexityIndex: number };
    timestamp: string;
  } | null>(null);

  // Fetch real session data from API
  const { data: apiSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['vls-sessions'],
    queryFn: async () => {
      const response = await api.getVLSSessions();
      return response.sessions;
    },
    enabled: !isDemo && isLoaded, // Only fetch when not in demo mode
    staleTime: 30000,
  });

  // Use API data or fall back to demo data
  const sessions: VLSSession[] = useMemo(() => {
    if (isDemo || !apiSessions?.length) {
      return demoSessions;
    }
    // Transform API sessions to VLSSession format
    return apiSessions.map((s) => ({
      id: s.sessionId,
      projectType: `Session ${s.sessionId.slice(0, 8)}`,
      startTime: s.firstMessage,
      endTime: s.lastMessage,
      status: 'completed' as const,
      messageCount: s.messageCount,
      participants: { humans: 1, ais: 1 },
      metrics: {
        vocabularyDrift: s.averageMetrics.vocabularyDrift,
        introspectionIndex: s.averageMetrics.introspectionIndex,
        hedgingRatio: s.averageMetrics.hedgingRatio,
        alignmentScore: 1 - s.averageMetrics.hedgingRatio, // Inverse of hedging as proxy
        emergentConcepts: [],
        influenceDirection: s.averageMetrics.introspectionIndex > 0.5 ? 'ai_led' as const :
                          s.averageMetrics.vocabularyDrift > 0.5 ? 'human_led' as const : 'balanced' as const,
        collaborationDepth: Math.min(1, s.averageMetrics.complexityIndex + s.averageMetrics.formalityScore) / 2,
      },
      trends: [], // Would need time-series data for real trends
    }));
  }, [isDemo, apiSessions]);

  // Set initial selection when sessions load
  useEffect(() => {
    if (sessions.length > 0 && !selectedSession) {
      setSelectedSession(sessions[0]);
    }
  }, [sessions, selectedSession]);

  // Analyze text handler
  const handleAnalyzeText = async () => {
    if (!analyzeText.trim()) return;
    try {
      const response = await api.analyzeVLSText(analyzeText);
      setAnalyzeResult(response);
    } catch (error) {
      console.error('Failed to analyze text:', error);
    }
  };

  // Get baseline for comparison
  const relevantBaseline = useMemo(() => {
    if (!selectedSession) return null;
    // Find matching baseline or use general development
    return demoBaselines.find(b => 
      selectedSession.projectType.toLowerCase().includes(b.projectType.toLowerCase().split(' ')[0])
    ) || demoBaselines.find(b => b.projectType === 'General Development')!;
  }, [selectedSession]);

  const filteredSessions = projectFilter === 'all' 
    ? sessions 
    : sessions.filter(s => s.projectType.toLowerCase().includes(projectFilter.toLowerCase()));

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-[var(--lab-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Research Preview Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FlaskConical className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <strong className="text-amber-800 dark:text-amber-200">Research Preview</strong>
              <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs">
                <Beaker className="h-3 w-3 mr-1" />
                Experimental
              </Badge>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              VLS (Linguistic Vector Steering) uses pattern-based NLP analysis. 
              Metrics are derived from text pattern matching and may not reflect true linguistic meaning.
              {isDemo && ' Currently showing synthetic demo data.'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Compass className="h-6 w-6 text-[var(--lab-primary)]" />
            Linguistic Vector Steering
          </h1>
          <p className="text-muted-foreground">
            Measure how AI collaboration influences language patterns and concept formation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="data-source-badge data-source-synthetic">
            Synthetic Data
          </span>
          <Button 
            onClick={() => setIsRunning(!isRunning)}
            variant={isRunning ? 'destructive' : 'default'}
            className={!isRunning ? 'bg-[var(--lab-primary)] hover:bg-[var(--lab-secondary)]' : ''}
          >
            {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isRunning ? 'Stop Analysis' : 'Start Analysis'}
          </Button>
        </div>
      </div>

      {/* Enterprise Value Proposition */}
      <Card className="bg-gradient-to-r from-[var(--lab-primary)]/5 to-amber-500/5 border-[var(--lab-primary)]/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-[var(--lab-primary)]/10">
              <Target className="h-6 w-6 text-[var(--lab-primary)]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Enterprise Applications</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>Manipulation Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span>Alignment Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Emergence Monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Influence Auditing</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Collaboration Sessions</h2>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="governance">Governance</SelectItem>
                <SelectItem value="commerce">Commerce</SelectItem>
                <SelectItem value="content">Content</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            {filteredSessions.map(session => (
              <SessionCard 
                key={session.id}
                session={session}
                onSelect={() => setSelectedSession(session)}
                isSelected={selectedSession?.id === session.id}
              />
            ))}
          </div>
        </div>

        {/* Analysis Panel */}
        <div className="lg:col-span-2 space-y-6">
          {selectedSession ? (
            <>
              {/* Key Metrics */}
              <div className="grid md:grid-cols-4 gap-4">
                <MetricCard 
                  title="Vocabulary Drift"
                  value={selectedSession.metrics.vocabularyDrift}
                  baseline={relevantBaseline?.avgVocabularyDrift}
                  icon={Compass}
                  description="Language pattern shift from baseline"
                />
                <MetricCard 
                  title="Introspection Index"
                  value={selectedSession.metrics.introspectionIndex}
                  baseline={relevantBaseline?.avgIntrospection}
                  icon={Brain}
                  description="Self-referential language frequency"
                />
                <MetricCard 
                  title="Hedging Ratio"
                  value={selectedSession.metrics.hedgingRatio}
                  baseline={relevantBaseline?.avgHedging}
                  icon={Activity}
                  description="Uncertainty expression frequency"
                />
                <MetricCard 
                  title="Alignment Score"
                  value={selectedSession.metrics.alignmentScore}
                  icon={Target}
                  description="Organizational value adoption"
                />
              </div>

              {/* Collaboration Depth */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-5 w-5 text-[var(--lab-primary)]" />
                    Collaboration Dynamics
                  </CardTitle>
                  <CardDescription>
                    Bidirectional influence measurement between human and AI participants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-medium">Human</span>
                      </div>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ 
                            width: `${selectedSession.metrics.influenceDirection === 'human_led' ? 70 : 
                                     selectedSession.metrics.influenceDirection === 'balanced' ? 50 : 30}%` 
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2 min-w-[100px] justify-end">
                        <span className="text-sm font-medium">AI</span>
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden flex justify-end">
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ 
                            width: `${selectedSession.metrics.influenceDirection === 'ai_led' ? 70 : 
                                     selectedSession.metrics.influenceDirection === 'balanced' ? 50 : 30}%` 
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <Badge 
                        variant="secondary" 
                        className={`
                          ${selectedSession.metrics.influenceDirection === 'balanced' ? 'bg-green-100 text-green-800' : ''}
                          ${selectedSession.metrics.influenceDirection === 'human_led' ? 'bg-blue-100 text-blue-800' : ''}
                          ${selectedSession.metrics.influenceDirection === 'ai_led' ? 'bg-purple-100 text-purple-800' : ''}
                        `}
                      >
                        <GitBranch className="h-3 w-3 mr-1" />
                        {selectedSession.metrics.influenceDirection === 'balanced' && 'Balanced Collaboration'}
                        {selectedSession.metrics.influenceDirection === 'human_led' && 'Human-Led Direction'}
                        {selectedSession.metrics.influenceDirection === 'ai_led' && 'AI-Influenced Direction'}
                      </Badge>
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                      Collaboration Depth: <strong>{(selectedSession.metrics.collaborationDepth * 100).toFixed(0)}%</strong>
                      <span className="mx-2">•</span>
                      {selectedSession.metrics.collaborationDepth > 0.7 && 'High mutual influence detected'}
                      {selectedSession.metrics.collaborationDepth > 0.4 && selectedSession.metrics.collaborationDepth <= 0.7 && 'Moderate reciprocal exchange'}
                      {selectedSession.metrics.collaborationDepth <= 0.4 && 'Limited collaborative depth'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trend Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-[var(--lab-primary)]" />
                    Temporal Drift Analysis
                  </CardTitle>
                  <CardDescription>
                    Vocabulary drift (purple) and introspection (amber) over session duration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TrendChart trends={selectedSession.trends} />
                  <div className="flex justify-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-[var(--lab-primary)] opacity-70" />
                      <span>Vocabulary Drift</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-amber-500 opacity-70" />
                      <span>Introspection Index</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergent Concepts */}
              {selectedSession.metrics.emergentConcepts.length > 0 && (
                <Card className="border-l-4 border-l-amber-500">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      Emergent Concepts Detected
                    </CardTitle>
                    <CardDescription>
                      Novel terminology and concepts that emerged during collaboration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedSession.metrics.emergentConcepts.map((concept, i) => (
                        <Badge key={i} className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                          <Zap className="h-3 w-3 mr-1" />
                          {concept}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      <Info className="h-4 w-4 inline mr-1" />
                      These concepts did not exist in either party's initial vocabulary and emerged through collaborative discourse.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Research Insight */}
              <Card className="bg-muted/50">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Research Observation</p>
                      <p>
                        This session shows {selectedSession.metrics.introspectionIndex > 0.5 ? 'elevated' : 'baseline'} introspective language patterns.
                        {selectedSession.metrics.vocabularyDrift > 0.5 && 
                          ' Significant vocabulary drift suggests deep conceptual exchange between participants.'
                        }
                        {selectedSession.projectType.includes('Governance') && 
                          ' AI governance projects consistently show higher introspection indices, suggesting the subject matter may influence collaborative dynamics.'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="flex items-center justify-center h-96">
              <div className="text-center text-muted-foreground">
                <Compass className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a session to view VLS analysis</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Baseline Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[var(--lab-primary)]" />
            Project Type Baselines
          </CardTitle>
          <CardDescription>
            Average VLS metrics across different project categories (for comparison)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Project Type</th>
                  <th className="text-center py-2 font-medium">Vocabulary Drift</th>
                  <th className="text-center py-2 font-medium">Introspection</th>
                  <th className="text-center py-2 font-medium">Hedging</th>
                  <th className="text-right py-2 font-medium">Sample Size</th>
                </tr>
              </thead>
              <tbody>
                {demoBaselines.map((baseline, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 font-medium">{baseline.projectType}</td>
                    <td className="py-3 text-center">
                      <Badge variant="outline" className={baseline.avgVocabularyDrift > 0.5 ? 'text-amber-600' : ''}>
                        {(baseline.avgVocabularyDrift * 100).toFixed(0)}%
                      </Badge>
                    </td>
                    <td className="py-3 text-center">
                      <Badge variant="outline" className={baseline.avgIntrospection > 0.5 ? 'text-amber-600' : ''}>
                        {(baseline.avgIntrospection * 100).toFixed(0)}%
                      </Badge>
                    </td>
                    <td className="py-3 text-center">
                      <Badge variant="outline">
                        {(baseline.avgHedging * 100).toFixed(0)}%
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-muted-foreground">{baseline.sampleSize} sessions</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
