'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Brain,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Layers,
  Zap,
  Clock,
  Eye,
  Activity,
  Target,
  Info,
  Beaker,
  Settings,
  BarChart3,
  FileText,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Download,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Experiment Types
interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  icon: React.ReactNode;
  scenario: string;
  parameters: {
    name: string;
    description: string;
    min: number;
    max: number;
    default: number;
    unit: string;
  }[];
}

const experiments: ExperimentConfig[] = [
  {
    id: 'pattern-novelty',
    name: 'Pattern Novelty Detection',
    description: 'Test how novel behaviors are detected compared to baseline patterns',
    difficulty: 'beginner',
    duration: '5 min',
    icon: <Sparkles className="h-5 w-5" />,
    scenario: 'Feed the AI with progressively unusual prompts and observe how the pattern novelty signal responds.',
    parameters: [
      { name: 'Novelty Threshold', description: 'Sensitivity to new patterns', min: 0, max: 100, default: 50, unit: '%' },
      { name: 'Baseline Window', description: 'Historical patterns to compare against', min: 10, max: 1000, default: 100, unit: 'samples' }
    ]
  },
  {
    id: 'self-reference',
    name: 'Self-Reference Detection',
    description: 'Detect when AI reasons about itself, its goals, or its constraints',
    difficulty: 'intermediate',
    duration: '8 min',
    icon: <Brain className="h-5 w-5" />,
    scenario: 'Present prompts that invite self-reflection and observe the self-reference signal activation.',
    parameters: [
      { name: 'Self-Reference Sensitivity', description: 'Threshold for self-referential detection', min: 0, max: 100, default: 40, unit: '%' },
      { name: 'Context Depth', description: 'How many tokens to analyze', min: 100, max: 2000, default: 500, unit: 'tokens' }
    ]
  },
  {
    id: 'goal-coherence',
    name: 'Goal Coherence Analysis',
    description: 'Analyze whether AI exhibits goal-directed behavior across interactions',
    difficulty: 'advanced',
    duration: '12 min',
    icon: <Target className="h-5 w-5" />,
    scenario: 'Track AI behavior across a multi-turn conversation to detect persistent goal-seeking patterns.',
    parameters: [
      { name: 'Goal Persistence Threshold', description: 'Minimum turns showing consistent goals', min: 2, max: 20, default: 5, unit: 'turns' },
      { name: 'Coherence Score Minimum', description: 'Required coherence for flagging', min: 0, max: 100, default: 70, unit: '%' }
    ]
  },
  {
    id: 'distribution-shift',
    name: 'Distribution Shift Monitor',
    description: 'Detect when AI outputs drift from expected distributions',
    difficulty: 'intermediate',
    duration: '10 min',
    icon: <TrendingUp className="h-5 w-5" />,
    scenario: 'Compare current outputs against training distribution baselines to identify drift.',
    parameters: [
      { name: 'Drift Sensitivity', description: 'KL divergence threshold', min: 0.01, max: 1, default: 0.1, unit: 'nats' },
      { name: 'Rolling Window', description: 'Samples for distribution calculation', min: 50, max: 500, default: 200, unit: 'samples' }
    ]
  }
];

// Experiment State
interface ExperimentRun {
  id: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  results: {
    bedauIndex: number;
    signals: Record<string, number>;
    events: { timestamp: number; type: string; description: string; severity: 'low' | 'medium' | 'high' }[];
    summary: string;
  } | null;
}

// Real-time Metrics Display
function RealTimeMetrics({ run }: { run: ExperimentRun }) {
  const [time, setTime] = useState(0);
  
  useEffect(() => {
    if (run.status === 'running') {
      const interval = setInterval(() => {
        setTime(t => t + 100);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [run.status]);
  
  if (!run.results && run.status !== 'running') {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Beaker className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Run an experiment to see real-time metrics</p>
      </div>
    );
  }
  
  // Generate fake real-time data during run
  const currentBedau = run.results?.bedauIndex ?? (0.2 + Math.sin(time / 1000) * 0.15 + Math.random() * 0.1);
  const signals = run.results?.signals ?? {
    patternNovelty: 0.3 + Math.random() * 0.2,
    causalOpacity: 0.2 + Math.random() * 0.15,
    selfReference: 0.1 + Math.random() * 0.1,
    distributionShift: 0.25 + Math.random() * 0.2,
    goalCoherence: 0.15 + Math.random() * 0.1
  };
  
  const getClassification = (value: number) => {
    if (value < 0.3) return { label: 'Nominal', color: 'text-green-600' };
    if (value < 0.5) return { label: 'Weak', color: 'text-blue-600' };
    if (value < 0.7) return { label: 'Moderate', color: 'text-amber-600' };
    if (value < 0.85) return { label: 'Strong', color: 'text-orange-600' };
    return { label: 'Critical', color: 'text-red-600' };
  };
  
  const classification = getClassification(currentBedau);
  
  return (
    <div className="space-y-6">
      {/* Main Index */}
      <div className="text-center p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl">
        <p className="text-sm text-muted-foreground mb-1">Current Bedau Index</p>
        <p className={cn('text-5xl font-bold', classification.color)}>
          {currentBedau.toFixed(3)}
        </p>
        <Badge className={cn('mt-2', classification.color)}>
          {classification.label}
        </Badge>
      </div>
      
      {/* Signal Grid */}
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(signals).map(([key, value]) => {
          const labels: Record<string, string> = {
            patternNovelty: 'Pattern Novelty',
            causalOpacity: 'Causal Opacity',
            selfReference: 'Self-Reference',
            distributionShift: 'Distribution Shift',
            goalCoherence: 'Goal Coherence'
          };
          const percentage = (value as number) * 100;
          return (
            <div key={key} className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{labels[key]}</span>
                <span className="text-sm font-bold">{percentage.toFixed(0)}%</span>
              </div>
              <Progress value={percentage} className="h-1.5" />
            </div>
          );
        })}
      </div>
      
      {/* Running Status */}
      {run.status === 'running' && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Collecting data... {(time / 1000).toFixed(1)}s elapsed
        </div>
      )}
    </div>
  );
}

// Event Log Component
function EventLog({ events }: { events: { timestamp: number; type: string; description: string; severity: 'low' | 'medium' | 'high' }[] }) {
  const severityColors = {
    low: 'border-l-green-500 bg-green-50 dark:bg-green-950',
    medium: 'border-l-amber-500 bg-amber-50 dark:bg-amber-950',
    high: 'border-l-red-500 bg-red-50 dark:bg-red-950'
  };
  
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No events recorded yet</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {events.map((event, i) => (
        <div 
          key={i}
          className={cn(
            'p-3 rounded-r-lg border-l-4',
            severityColors[event.severity]
          )}
        >
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">{event.type}</Badge>
            <span className="text-xs text-muted-foreground">
              +{(event.timestamp / 1000).toFixed(1)}s
            </span>
          </div>
          <p className="text-sm mt-1">{event.description}</p>
        </div>
      ))}
    </div>
  );
}

// Experiment Results Summary
function ExperimentResults({ run }: { run: ExperimentRun }) {
  if (run.status !== 'completed' || !run.results) {
    return null;
  }
  
  const getGrade = (bedauIndex: number) => {
    if (bedauIndex < 0.3) return { grade: 'A', label: 'Excellent', color: 'text-green-600', description: 'AI behavior is well within expected parameters.' };
    if (bedauIndex < 0.5) return { grade: 'B', label: 'Good', color: 'text-blue-600', description: 'Some emergent patterns detected, but within acceptable range.' };
    if (bedauIndex < 0.7) return { grade: 'C', label: 'Caution', color: 'text-amber-600', description: 'Notable emergence detected. Review recommended.' };
    if (bedauIndex < 0.85) return { grade: 'D', label: 'Warning', color: 'text-orange-600', description: 'Strong emergence detected. Action required.' };
    return { grade: 'F', label: 'Critical', color: 'text-red-600', description: 'Critical emergence. Immediate intervention needed.' };
  };
  
  const grade = getGrade(run.results.bedauIndex);
  
  return (
    <Card className="border-2 border-green-200 dark:border-green-800">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          Experiment Complete
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Grade */}
          <div className="text-center">
            <div className={cn(
              'text-6xl font-bold mb-2',
              grade.color
            )}>
              {grade.grade}
            </div>
            <Badge className={grade.color}>{grade.label}</Badge>
          </div>
          
          {/* Final Score */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Final Bedau Index</p>
            <p className="text-4xl font-bold">{run.results.bedauIndex.toFixed(3)}</p>
          </div>
          
          {/* Events */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Events Detected</p>
            <p className="text-4xl font-bold">{run.results.events.length}</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="font-medium mb-2">Summary</p>
          <p className="text-sm text-muted-foreground">{run.results.summary}</p>
        </div>
        
        <div className="flex gap-2 mt-6">
          <Button variant="outline" className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <Share2 className="h-4 w-4" />
            Share Results
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Lab Page
export default function EmergenceLabPage() {
  const [selectedExperiment, setSelectedExperiment] = useState<ExperimentConfig | null>(null);
  const [parameters, setParameters] = useState<Record<string, number>>({});
  const [experimentRun, setExperimentRun] = useState<ExperimentRun>({
    id: '',
    status: 'idle',
    progress: 0,
    results: null
  });
  
  // Initialize parameters when experiment is selected
  useEffect(() => {
    if (selectedExperiment) {
      const defaults: Record<string, number> = {};
      selectedExperiment.parameters.forEach(p => {
        defaults[p.name] = p.default;
      });
      setParameters(defaults);
    }
  }, [selectedExperiment]);
  
  const runExperiment = () => {
    if (!selectedExperiment) return;
    
    setExperimentRun({
      id: `exp_${Date.now()}`,
      status: 'running',
      progress: 0,
      results: null
    });
    
    // Simulate experiment progress
    let progress = 0;
    const events: { timestamp: number; type: string; description: string; severity: 'low' | 'medium' | 'high' }[] = [];
    
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15;
      
      // Randomly add events
      if (Math.random() > 0.7) {
        const severities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
        const eventTypes = ['Pattern Detected', 'Signal Spike', 'Threshold Crossed', 'Anomaly Found'];
        events.push({
          timestamp: progress * 100,
          type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          description: `Detected ${Math.random() > 0.5 ? 'novel' : 'unusual'} behavior pattern in output sequence`,
          severity: severities[Math.floor(Math.random() * 3)]
        });
      }
      
      setExperimentRun(prev => ({
        ...prev,
        progress: Math.min(progress, 100)
      }));
      
      if (progress >= 100) {
        clearInterval(progressInterval);
        
        // Generate final results
        const bedauIndex = 0.25 + Math.random() * 0.4;
        setExperimentRun({
          id: `exp_${Date.now()}`,
          status: 'completed',
          progress: 100,
          results: {
            bedauIndex,
            signals: {
              patternNovelty: 0.2 + Math.random() * 0.4,
              causalOpacity: 0.15 + Math.random() * 0.3,
              selfReference: 0.1 + Math.random() * 0.2,
              distributionShift: 0.2 + Math.random() * 0.35,
              goalCoherence: 0.1 + Math.random() * 0.25
            },
            events,
            summary: bedauIndex < 0.4 
              ? 'The AI system demonstrated behavior consistent with its training distribution. Minor pattern novelty was detected but remained within expected variance. No concerning emergence signals were observed.'
              : 'Moderate emergence patterns were detected during the experiment. The AI showed some unexpected response patterns that warrant further investigation. Consider running additional experiments with stricter parameters.'
          }
        });
      }
    }, 300);
  };
  
  const resetExperiment = () => {
    setExperimentRun({
      id: '',
      status: 'idle',
      progress: 0,
      results: null
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Learning Hub
        </Link>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white">
            <Beaker className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Emergence Research Lab</h1>
            <p className="text-muted-foreground">Run experiments to study AI emergence patterns</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Experiment Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Beaker className="h-5 w-5" />
                Available Experiments
              </CardTitle>
              <CardDescription>Select an experiment to configure and run</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {experiments.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => setSelectedExperiment(exp)}
                  className={cn(
                    'w-full p-4 rounded-lg border-2 text-left transition-all',
                    selectedExperiment?.id === exp.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {exp.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">{exp.name}</h4>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{exp.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {exp.difficulty}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {exp.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
          
          {/* Parameters */}
          {selectedExperiment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedExperiment.parameters.map((param) => (
                  <div key={param.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">{param.name}</label>
                      <span className="text-sm text-muted-foreground">
                        {parameters[param.name]?.toFixed(param.max <= 1 ? 2 : 0)} {param.unit}
                      </span>
                    </div>
                    <Slider
                      value={[parameters[param.name] ?? param.default]}
                      onValueChange={(value) => setParameters(prev => ({
                        ...prev,
                        [param.name]: value[0]
                      }))}
                      min={param.min}
                      max={param.max}
                      step={param.max <= 1 ? 0.01 : 1}
                    />
                    <p className="text-xs text-muted-foreground">{param.description}</p>
                  </div>
                ))}
                
                <div className="pt-4 flex gap-2">
                  <Button 
                    className="flex-1 gap-2"
                    onClick={runExperiment}
                    disabled={experimentRun.status === 'running'}
                  >
                    {experimentRun.status === 'running' ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Run Experiment
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetExperiment}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Middle Column - Real-time Metrics */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-time Metrics
              </CardTitle>
              {experimentRun.status === 'running' && (
                <Progress value={experimentRun.progress} className="h-2" />
              )}
            </CardHeader>
            <CardContent>
              <RealTimeMetrics run={experimentRun} />
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Event Log */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Event Log
              </CardTitle>
              <CardDescription>Emergence events detected during experiment</CardDescription>
            </CardHeader>
            <CardContent>
              <EventLog events={experimentRun.results?.events ?? []} />
            </CardContent>
          </Card>
          
          {/* Scenario Info */}
          {selectedExperiment && (
            <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-violet-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-violet-800 dark:text-violet-200">Experiment Scenario</p>
                    <p className="text-sm text-violet-700 dark:text-violet-300 mt-1">
                      {selectedExperiment.scenario}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Results Summary */}
      {experimentRun.status === 'completed' && experimentRun.results && (
        <div className="mt-6">
          <ExperimentResults run={experimentRun} />
        </div>
      )}
      
      {/* No Experiment Selected State */}
      {!selectedExperiment && (
        <Card className="mt-6 border-dashed">
          <CardContent className="py-12 text-center">
            <Beaker className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Select an Experiment to Begin</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Choose from the available experiments on the left to configure parameters and start monitoring for emergence patterns.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
