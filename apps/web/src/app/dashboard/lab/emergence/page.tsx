'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDemo } from '@/hooks/use-demo';
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
  const simulationTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const { isDemo, isLoaded } = useDemo();

  // Fetch real Bedau metrics from backend
  const { data: bedauData } = useQuery({
    queryKey: ['bedau-metrics', isDemo],
    queryFn: async () => {
      if (isDemo) {
        const res = await api.getDemoBedauMetrics() as { success: boolean; data: any };
        return res.data;
      }
      return api.getBedauMetrics();
    },
    enabled: isLoaded,
    refetchInterval: 30000, // Refresh every 30s
  });

  const realBedauIndex = bedauData?.bedau_index;
  const realEmergenceType = bedauData?.emergence_type;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      simulationTimers.current.forEach(timer => clearInterval(timer));
    };
  }, []);

  /**
   * Bedau Index Simulation Algorithm
   * 
   * The Bedau Index measures emergence through 4 components:
   * 1. Novelty - new patterns not in training (influenced by agentCount diversity)
   * 2. Unpredictability - resistance to forecasting (influenced by noiseLevel)
   * 3. Irreducibility - cannot be explained by components (influenced by interactionDepth)
   * 4. Downward Causation - emergent properties affecting lower levels (influenced by temporalWindow)
   * 
   * Formula: Bedau = 0.25*Novelty + 0.25*Unpredictability + 0.25*Irreducibility + 0.25*Causation
   */
  const calculateBedauScore = useCallback((cfg: SimulationConfig, progress: number): number => {
    // Novelty: More agents = more diverse patterns = higher novelty
    // Normalized: 2 agents = 0.1, 20 agents = 0.9
    const novelty = 0.1 + (cfg.agentCount - 2) / 18 * 0.8;
    
    // Unpredictability: Higher noise = more unpredictable
    // noiseLevel 0 = 0.1, noiseLevel 0.5 = 0.6
    const unpredictability = 0.1 + cfg.noiseLevel * 1.0;
    
    // Irreducibility: Deeper interactions = harder to reduce to component behaviors
    // depth 5 = 0.2, depth 50 = 0.9
    const irreducibility = 0.2 + (cfg.interactionDepth - 5) / 45 * 0.7;
    
    // Downward Causation: Larger temporal window = more opportunity for macro->micro effects
    // window 10 = 0.2, window 100 = 0.8
    const downwardCausation = 0.2 + (cfg.temporalWindow - 10) / 90 * 0.6;
    
    // Base Bedau from parameters
    const baseBedau = 0.25 * novelty + 0.25 * unpredictability + 0.25 * irreducibility + 0.25 * downwardCausation;
    
    // Add stochastic element based on simulation progress
    // As simulation runs, we "discover" the true emergence level with noise
    const progressFactor = progress / 100;
    const noise = (Math.random() - 0.5) * 0.1 * (1 - progressFactor); // Noise decreases as we get more data
    
    return Math.max(0, Math.min(1, baseBedau + noise));
  }, []);

  const runSimulation = useCallback((testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    // Clear any existing timer for this test
    if (simulationTimers.current.has(testId)) {
      clearInterval(simulationTimers.current.get(testId));
    }

    // Run simulation with progress updates
    const timer = setInterval(() => {
      setTests(prev => {
        const currentTest = prev.find(t => t.id === testId);
        if (!currentTest || currentTest.status !== 'running') {
          clearInterval(simulationTimers.current.get(testId));
          simulationTimers.current.delete(testId);
          return prev;
        }

        const newIterations = Math.min(
          currentTest.iterations + Math.floor(currentTest.maxIterations / 20),
          currentTest.maxIterations
        );
        const newProgress = Math.round((newIterations / currentTest.maxIterations) * 100);
        
        // Calculate running Bedau score
        const bedauScore = calculateBedauScore(config, newProgress);
        const emergenceDetected = bedauScore > 0.5;

        // Check if complete
        if (newProgress >= 100) {
          clearInterval(simulationTimers.current.get(testId));
          simulationTimers.current.delete(testId);
          return prev.map(t =>
            t.id === testId
              ? { 
                  ...t, 
                  status: 'completed' as const, 
                  progress: 100, 
                  iterations: currentTest.maxIterations,
                  bedauScore,
                  emergenceDetected
                }
              : t
          );
        }

        return prev.map(t =>
          t.id === testId
            ? { ...t, progress: newProgress, iterations: newIterations, bedauScore, emergenceDetected }
            : t
        );
      });
    }, 500); // Update every 500ms

    simulationTimers.current.set(testId, timer);
  }, [tests, config, calculateBedauScore]);

  const handleStart = useCallback((testId: string) => {
    setTests(prev => prev.map(t => 
      t.id === testId 
        ? { ...t, status: 'running' as const, startTime: new Date().toISOString() }
        : t
    ));
    // Start simulation after state update
    setTimeout(() => runSimulation(testId), 0);
  }, [runSimulation]);

  const handlePause = useCallback((testId: string) => {
    // Stop the simulation timer
    if (simulationTimers.current.has(testId)) {
      clearInterval(simulationTimers.current.get(testId));
      simulationTimers.current.delete(testId);
    }
    setTests(prev => prev.map(t => 
      t.id === testId ? { ...t, status: 'idle' as const } : t
    ));
  }, []);

  const handleReset = useCallback((testId: string) => {
    // Stop any running simulation
    if (simulationTimers.current.has(testId)) {
      clearInterval(simulationTimers.current.get(testId));
      simulationTimers.current.delete(testId);
    }
    setTests(prev => prev.map(t =>
      t.id === testId
        ? { ...t, status: 'idle' as const, progress: 0, iterations: 0, bedauScore: null, emergenceDetected: false, startTime: null }
        : t
    ));
  }, []);

  const handleCreateTest = useCallback(() => {
    /**
     * Max iterations calculation based on simulation complexity:
     * - Base: interactionDepth * 100 (more depth = more iterations needed)
     * - Multiplier: agentCount / 5 (more agents = slightly more iterations)
     * - Minimum: 500 iterations for statistical significance
     */
    const baseIterations = config.interactionDepth * 100;
    const agentMultiplier = config.agentCount / 5;
    const maxIterations = Math.max(500, Math.floor(baseIterations * agentMultiplier));
    
    const newTest: EmergenceTest = {
      id: `test-${Date.now()}`,
      name: `Custom Test (${config.agentCount} agents)`,
      description: `Emergence test with ${config.interactionDepth} depth, ${(config.noiseLevel * 100).toFixed(0)}% noise, ${config.temporalWindow} window`,
      status: 'idle',
      progress: 0,
      iterations: 0,
      maxIterations,
      bedauScore: null,
      emergenceDetected: false,
      startTime: null
    };
    setTests(prev => [newTest, ...prev]);
  }, [config]);

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
              <CardDescription>Configure parameters that influence the Bedau Index calculation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Agent Count: {config.agentCount}
                  <InfoTooltip term="Agent Count affects Novelty - more agents create more diverse interaction patterns" />
                </Label>
                <Slider
                  value={[config.agentCount]}
                  onValueChange={(values: number[]) => setConfig(prev => ({ ...prev, agentCount: values[0] }))}
                  min={2}
                  max={20}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">More agents → higher novelty component</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Interaction Depth: {config.interactionDepth}
                  <InfoTooltip term="Interaction Depth affects Irreducibility - deeper chains are harder to analyze" />
                </Label>
                <Slider
                  value={[config.interactionDepth]}
                  onValueChange={(values: number[]) => setConfig(prev => ({ ...prev, interactionDepth: values[0] }))}
                  min={5}
                  max={50}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">Deeper interactions → higher irreducibility</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Noise Level: {(config.noiseLevel * 100).toFixed(0)}%
                  <InfoTooltip term="Noise Level affects Unpredictability - random perturbations in agent behavior" />
                </Label>
                <Slider
                  value={[config.noiseLevel * 100]}
                  onValueChange={(values: number[]) => setConfig(prev => ({ ...prev, noiseLevel: values[0] / 100 }))}
                  min={0}
                  max={50}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">More noise → higher unpredictability</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Temporal Window: {config.temporalWindow}
                  <InfoTooltip term="Temporal Window affects Downward Causation - how far back patterns can influence current behavior" />
                </Label>
                <Slider
                  value={[config.temporalWindow]}
                  onValueChange={(values: number[]) => setConfig(prev => ({ ...prev, temporalWindow: values[0] }))}
                  min={10}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">Larger window → stronger downward causation</p>
              </div>

              {/* Expected Bedau Preview */}
              <div className="pt-3 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expected Bedau Range:</span>
                  <span className="font-medium">
                    {(() => {
                      const novelty = 0.1 + (config.agentCount - 2) / 18 * 0.8;
                      const unpredictability = 0.1 + config.noiseLevel * 1.0;
                      const irreducibility = 0.2 + (config.interactionDepth - 5) / 45 * 0.7;
                      const downwardCausation = 0.2 + (config.temporalWindow - 10) / 90 * 0.6;
                      const expected = 0.25 * novelty + 0.25 * unpredictability + 0.25 * irreducibility + 0.25 * downwardCausation;
                      return `${Math.max(0, expected - 0.1).toFixed(2)} - ${Math.min(1, expected + 0.1).toFixed(2)}`;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Iterations:</span>
                  <span className="font-medium">{Math.max(500, Math.floor(config.interactionDepth * 100 * (config.agentCount / 5))).toLocaleString()}</span>
                </div>
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
