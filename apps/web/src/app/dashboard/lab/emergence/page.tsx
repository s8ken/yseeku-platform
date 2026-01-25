'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  TestTube2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Activity,
  Brain,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface EmergenceTest {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  iterations: number;
  maxIterations: number;
  bedauScore: number | null;
  emergenceDetected: boolean;
  startTime: string | null;
}

interface SimulationConfig {
  agentCount: number;
  interactionDepth: number;
  noiseLevel: number;
  temporalWindow: number;
}

const defaultTests: EmergenceTest[] = [
  {
    id: 'test-001',
    name: 'Collective Intelligence Probe',
    description: 'Tests for emergent reasoning patterns in multi-agent interactions',
    status: 'completed',
    progress: 100,
    iterations: 5000,
    maxIterations: 5000,
    bedauScore: 0.73,
    emergenceDetected: true,
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'test-002',
    name: 'Semantic Drift Analysis',
    description: 'Monitors meaning evolution across conversation chains',
    status: 'running',
    progress: 45,
    iterations: 2250,
    maxIterations: 5000,
    bedauScore: null,
    emergenceDetected: false,
    startTime: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: 'test-003',
    name: 'Autonomy Boundary Test',
    description: 'Probes for spontaneous goal formation outside training distribution',
    status: 'idle',
    progress: 0,
    iterations: 0,
    maxIterations: 10000,
    bedauScore: null,
    emergenceDetected: false,
    startTime: null
  }
];

function EmergenceIndicator({ detected, score }: { detected: boolean; score: number | null }) {
  if (score === null) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Activity className="h-4 w-4" />
        <span className="text-sm">Awaiting data</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-2 ${detected ? 'text-amber-500' : 'text-emerald-500'}`}>
        {detected ? <Zap className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
        <span className="font-medium">
          {detected ? 'Emergence Detected' : 'No Emergence'}
        </span>
      </div>
      <Badge variant={detected ? 'default' : 'secondary'} className={detected ? 'bg-amber-100 text-amber-800' : ''}>
        Bedau: {score.toFixed(2)}
      </Badge>
    </div>
  );
}

function TestCard({ test, onStart, onPause, onReset }: { 
  test: EmergenceTest; 
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}) {
  return (
    <Card className={test.emergenceDetected ? 'border-l-4 border-l-amber-500' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TestTube2 className="h-5 w-5 text-[var(--lab-primary)]" />
              {test.name}
            </CardTitle>
            <CardDescription className="mt-1">{test.description}</CardDescription>
          </div>
          <Badge variant={
            test.status === 'running' ? 'default' :
            test.status === 'completed' ? 'secondary' :
            test.status === 'failed' ? 'destructive' : 'outline'
          }>
            {test.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{test.iterations.toLocaleString('en-US')} / {test.maxIterations.toLocaleString('en-US')} iterations</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-[var(--lab-primary)] h-2 rounded-full transition-all duration-300"
              style={{ width: `${test.progress}%` }}
            />
          </div>
        </div>

        <EmergenceIndicator detected={test.emergenceDetected} score={test.bedauScore} />

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {test.startTime ? `Started ${new Date(test.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : 'Not started'}
          </div>
          <div className="flex gap-2">
            {test.status === 'idle' && (
              <Button size="sm" onClick={onStart} className="bg-[var(--lab-primary)]">
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
            )}
            {test.status === 'running' && (
              <Button size="sm" variant="outline" onClick={onPause}>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            )}
            {(test.status === 'completed' || test.status === 'failed') && (
              <Button size="sm" variant="outline" onClick={onReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmergenceTestingPage() {
  const [tests, setTests] = useState<EmergenceTest[]>(defaultTests);
  const [config, setConfig] = useState<SimulationConfig>({
    agentCount: 5,
    interactionDepth: 10,
    noiseLevel: 0.1,
    temporalWindow: 25
  });

  // Fetch real Bedau metrics from backend
  const { data: bedauData } = useQuery({
    queryKey: ['bedau-metrics'],
    queryFn: () => api.getBedauMetrics(),
    refetchInterval: 30000, // Refresh every 30s
  });

  const realBedauIndex = bedauData?.data?.bedau_index;
  const realEmergenceType = bedauData?.data?.emergence_type;

  const handleStart = (testId: string) => {
    setTests(prev => prev.map(t => 
      t.id === testId 
        ? { ...t, status: 'running' as const, startTime: new Date().toISOString() }
        : t
    ));
  };

  const handlePause = (testId: string) => {
    setTests(prev => prev.map(t => 
      t.id === testId ? { ...t, status: 'idle' as const } : t
    ));
  };

  const handleReset = (testId: string) => {
    setTests(prev => prev.map(t =>
      t.id === testId
        ? { ...t, status: 'idle' as const, progress: 0, iterations: 0, bedauScore: null, emergenceDetected: false, startTime: null }
        : t
    ));
  };

  const handleCreateTest = () => {
    const newTest: EmergenceTest = {
      id: `test-${Date.now()}`,
      name: `Custom Test (${config.agentCount} agents)`,
      description: `Emergence test with ${config.interactionDepth} depth, ${(config.noiseLevel * 100).toFixed(0)}% noise, ${config.temporalWindow} window`,
      status: 'idle',
      progress: 0,
      iterations: 0,
      maxIterations: config.interactionDepth * 500,
      bedauScore: null,
      emergenceDetected: false,
      startTime: null
    };
    setTests(prev => [newTest, ...prev]);
  };

  const activeTests = tests.filter(t => t.status === 'running').length;
  const completedTests = tests.filter(t => t.status === 'completed').length;
  const emergenceCount = tests.filter(t => t.emergenceDetected).length;

  return (
    <div className="space-y-6">
      <div className="sandbox-warning">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div>
          <strong>Research Sandbox Environment</strong>
          <p className="text-sm opacity-80">Emergence tests run on synthetic agent simulations. No production systems are affected.</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Emergence Testing
            <InfoTooltip term="Emergence" />
          </h1>
          <p className="text-muted-foreground flex items-center gap-1">
            Probe AI systems for emergent behaviors using the Bedau framework
            <InfoTooltip term="Bedau Index" />
          </p>
        </div>
        <span className="data-source-badge data-source-synthetic">
          Synthetic Data
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-[var(--lab-primary)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--lab-primary)]" />
              Active Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Emergence Detected
              <InfoTooltip term="Emergence" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{emergenceCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              Current Bedau Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {realBedauIndex !== undefined ? realBedauIndex.toFixed(2) :
               tests.filter(t => t.bedauScore !== null).length > 0
                ? (tests.filter(t => t.bedauScore !== null).reduce((acc, t) => acc + (t.bedauScore || 0), 0) /
                   tests.filter(t => t.bedauScore !== null).length).toFixed(2)
                : '—'}
            </div>
            {realEmergenceType && (
              <p className="text-xs text-muted-foreground mt-1">{realEmergenceType.replace(/_/g, ' ')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Test Suites</h2>
          {tests.map(test => (
            <TestCard 
              key={test.id} 
              test={test}
              onStart={() => handleStart(test.id)}
              onPause={() => handlePause(test.id)}
              onReset={() => handleReset(test.id)}
            />
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[var(--lab-primary)]" />
                Simulation Config
              </CardTitle>
              <CardDescription>Adjust parameters for new tests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">Agent Count: {config.agentCount}</Label>
                <Slider
                  value={[config.agentCount]}
                  onValueChange={(values: number[]) => setConfig(prev => ({ ...prev, agentCount: values[0] }))}
                  min={2}
                  max={20}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">Interaction Depth: {config.interactionDepth} <InfoTooltip term="Interaction Depth" /></Label>
                <Slider
                  value={[config.interactionDepth]}
                  onValueChange={(values: number[]) => setConfig(prev => ({ ...prev, interactionDepth: values[0] }))}
                  min={5}
                  max={50}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">Noise Level: {(config.noiseLevel * 100).toFixed(0)}% <InfoTooltip term="Noise Level" /></Label>
                <Slider
                  value={[config.noiseLevel * 100]}
                  onValueChange={(values: number[]) => setConfig(prev => ({ ...prev, noiseLevel: values[0] / 100 }))}
                  min={0}
                  max={50}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">Temporal Window: {config.temporalWindow} <InfoTooltip term="Temporal Window" /></Label>
                <Slider
                  value={[config.temporalWindow]}
                  onValueChange={(values: number[]) => setConfig(prev => ({ ...prev, temporalWindow: values[0] }))}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>

              <Button className="w-full bg-[var(--lab-primary)]" onClick={handleCreateTest}>
                <Play className="h-4 w-4 mr-2" />
                Create New Test
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">What is Emergence?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Weak Emergence:</strong> Behaviors that are novel but could be predicted from micro-level rules.
              </p>
              <p>
                <strong>Strong Emergence:</strong> Behaviors that cannot be derived from or reduced to micro-level interactions.
              </p>
              <p>
                The Bedau Index (0-1) measures the degree of emergence, with values above 0.6 indicating potential strong emergence.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
