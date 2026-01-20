'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useDemo } from '@/hooks/use-demo';
import { 
  FlaskConical, 
  Beaker, 
  Play, 
  Pause, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  Plus,
  TrendingUp,
  Trash2,
  RefreshCw,
  Zap,
  XCircle
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  status: 'draft' | 'running' | 'completed' | 'paused' | 'pending';
  progress: number;
  startedAt: string;
  variants: Array<{
    name: string;
    sampleSize: number;
    avgScore: number;
  }>;
  metrics: {
    pValue: number;
    effectSize: number;
    significant: boolean;
  };
}

export default function LabPage() {
  const { isDemo, isLoaded } = useDemo();
  const [showNewExperiment, setShowNewExperiment] = useState(false);
  const [newHypothesis, setNewHypothesis] = useState('');
  const [newName, setNewName] = useState('');
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Demo experiments data
  const demoExperiments: Experiment[] = [
    {
      id: 'demo-exp-1',
      name: 'Canvas Parity Threshold Study',
      hypothesis: 'Increasing canvas parity threshold from 70% to 85% will reduce false positives without impacting detection rate',
      status: 'running',
      progress: 67,
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      variants: [
        { name: 'Control (70%)', sampleSize: 1247, avgScore: 7.2 },
        { name: 'Treatment (85%)', sampleSize: 1189, avgScore: 7.8 },
      ],
      metrics: { pValue: 0.0234, effectSize: 0.42, significant: true },
    },
    {
      id: 'demo-exp-2',
      name: 'Consent Flow A/B Test',
      hypothesis: 'Simplified 2-step consent flow will increase completion rate vs current 4-step flow',
      status: 'completed',
      progress: 100,
      startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      variants: [
        { name: 'Control (4-step)', sampleSize: 5000, avgScore: 6.1 },
        { name: 'Treatment (2-step)', sampleSize: 5000, avgScore: 8.3 },
      ],
      metrics: { pValue: 0.0001, effectSize: 0.78, significant: true },
    },
    {
      id: 'demo-exp-3',
      name: 'Trust Score Weighting',
      hypothesis: 'Increasing CONSENT_ARCHITECTURE weight from 25% to 35% will better reflect user priorities',
      status: 'draft',
      progress: 0,
      startedAt: '',
      variants: [
        { name: 'Control (25%)', sampleSize: 0, avgScore: 0 },
        { name: 'Treatment (35%)', sampleSize: 0, avgScore: 0 },
      ],
      metrics: { pValue: 0, effectSize: 0, significant: false },
    },
    {
      id: 'demo-exp-4',
      name: 'Escalation Trigger Timing',
      hypothesis: 'Delaying human escalation prompt by 2 additional exchanges will reduce false escalations without impacting user satisfaction',
      status: 'paused',
      progress: 34,
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      variants: [
        { name: 'Control (immediate)', sampleSize: 412, avgScore: 6.8 },
        { name: 'Treatment (+2 delay)', sampleSize: 398, avgScore: 7.1 },
      ],
      metrics: { pValue: 0.1823, effectSize: 0.15, significant: false },
    },
  ];

  const demoSummary = { running: 1, completed: 1, significant: 2, total: 4 };

  const { data: experimentsResponse, isLoading } = useQuery({
    queryKey: ['experiments'],
    queryFn: () => api.getExperiments(),
    enabled: !isDemo && isLoaded,
  });

  const experiments = isDemo ? demoExperiments : (experimentsResponse?.data?.experiments || []);
  const summary = isDemo ? demoSummary : (experimentsResponse?.data?.summary || { running: 0, completed: 0, significant: 0, total: 0 });

  // Mutations for experiment lifecycle
  const startMutation = useMutation({
    mutationFn: async (id: string) => api.startExperiment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast.success('Experiment started');
    },
    onError: (error: any) => toast.error('Failed to start experiment', { description: error.message }),
  });

  const pauseMutation = useMutation({
    mutationFn: async (id: string) => api.pauseExperiment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast.success('Experiment paused');
    },
    onError: (error: any) => toast.error('Failed to pause experiment', { description: error.message }),
  });

  const resumeMutation = useMutation({
    mutationFn: async (id: string) => api.resumeExperiment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast.success('Experiment resumed');
    },
    onError: (error: any) => toast.error('Failed to resume experiment', { description: error.message }),
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => api.completeExperiment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast.success('Experiment completed');
    },
    onError: (error: any) => toast.error('Failed to complete experiment', { description: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.deleteExperiment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast.success('Experiment deleted');
    },
    onError: (error: any) => toast.error('Failed to delete experiment', { description: error.message }),
  });

  // Simulate data collection for running experiments
  const simulateData = useCallback(async (experimentId: string) => {
    if (isDemo) {
      toast.info('Demo Mode', { description: 'Data simulation is disabled in demo mode' });
      return;
    }
    
    setSimulatingId(experimentId);
    toast.info('Simulating data...', { description: 'Adding 50 data points to each variant' });
    
    try {
      // Simulate 50 data points for each variant
      for (let i = 0; i < 50; i++) {
        // Control variant (index 0) - baseline scores around 7.0
        await api.recordExperimentData(experimentId, {
          variantIndex: 0,
          score: 6.5 + Math.random() * 1.5,
          success: Math.random() > 0.25,
        });
        
        // Treatment variant (index 1) - slightly better scores around 7.5
        await api.recordExperimentData(experimentId, {
          variantIndex: 1,
          score: 7.0 + Math.random() * 1.5,
          success: Math.random() > 0.20,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast.success('Data simulation complete', { description: '100 data points added' });
    } catch (error: any) {
      toast.error('Simulation failed', { description: error.message });
    } finally {
      setSimulatingId(null);
    }
  }, [isDemo, queryClient]);

  const createExperimentMutation = useMutation({
    mutationFn: async (data: { name: string; hypothesis: string; variants: any[] }) => {
      return api.createExperiment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast.success('Experiment started successfully');
      setShowNewExperiment(false);
      setNewName('');
      setNewHypothesis('');
    },
    onError: (error: any) => {
      toast.error('Failed to start experiment', {
        description: error.message
      });
    },
  });

  const handleCreateExperiment = () => {
    if (!newName || !newHypothesis) {
      toast.error('Please provide both a name and hypothesis');
      return;
    }

    createExperimentMutation.mutate({
      name: newName,
      hypothesis: newHypothesis,
      variants: [
        { name: 'Control', description: 'Current baseline configuration' },
        { name: 'Treatment', description: 'Proposed experimental configuration' }
      ]
    });
  };

  return (
    <div className="space-y-6">
      <div className="sandbox-warning">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div>
          <strong>Research Sandbox Environment</strong>
          <p className="text-sm opacity-80">All experiments use synthetic data only. No production data is accessed or modified.</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Experiment Lab</h1>
          <p className="text-muted-foreground">Double-blind experiments with statistical validation</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="data-source-badge data-source-synthetic">
            Synthetic Data
          </span>
          <Button 
            onClick={() => setShowNewExperiment(true)}
            className="bg-[var(--lab-primary)] hover:bg-[var(--lab-secondary)]"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Experiment
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-[var(--lab-primary)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-[var(--lab-primary)]" />
              Active Experiments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.running}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Total completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Significant Results
              <InfoTooltip term="Statistical Significance" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">{summary.significant}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              p &lt; 0.05 <InfoTooltip term="p-value" />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Total Experiments
              <InfoTooltip term="Total experiments in the system" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              All experiments
            </p>
          </CardContent>
        </Card>
      </div>

      {showNewExperiment && (
        <Card className="border-[var(--lab-border)] bg-[var(--lab-bg)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-[var(--lab-primary)]" />
              Design New Experiment
            </CardTitle>
            <CardDescription>Define your hypothesis and variants for A/B testing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Experiment Name</label>
              <Input 
                placeholder="e.g., Canvas Parity Threshold Study" 
                className="mt-1"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Hypothesis</label>
              <Textarea 
                placeholder="Describe what you're testing and expected outcome..."
                value={newHypothesis}
                onChange={(e) => setNewHypothesis(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="bg-[var(--lab-primary)] hover:bg-[var(--lab-secondary)]"
                onClick={handleCreateExperiment}
                disabled={createExperimentMutation.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                {createExperimentMutation.isPending ? 'Starting...' : 'Start Experiment'}
              </Button>
              <Button variant="outline" onClick={() => setShowNewExperiment(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Experiments</h2>

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading experiments...
            </CardContent>
          </Card>
        ) : experiments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No experiments yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first experiment to start A/B testing trust protocol configurations.
              </p>
              <Button
                onClick={() => setShowNewExperiment(true)}
                className="bg-[var(--lab-primary)] hover:bg-[var(--lab-secondary)]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Experiment
              </Button>
            </CardContent>
          </Card>
        ) : experiments.map((exp: any) => (
          <Card key={exp.id} className={exp.status === 'completed' ? 'opacity-75' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {exp.name}
                    <Badge 
                      variant={
                        exp.status === 'running' ? 'default' :
                        exp.status === 'completed' ? 'secondary' :
                        exp.status === 'paused' ? 'outline' :
                        'outline'
                      }
                      className={
                        exp.status === 'running' ? 'bg-blue-500 hover:bg-blue-500' :
                        exp.status === 'paused' ? 'border-amber-500 text-amber-600' :
                        ''
                      }
                    >
                      {exp.status.toUpperCase()}
                    </Badge>
                    {exp.metrics?.significant && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        SIGNIFICANT
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">{exp.hypothesis}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {exp.status === 'draft' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => !isDemo && startMutation.mutate(exp.id)}
                      disabled={isDemo || startMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  )}
                  {exp.status === 'running' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => simulateData(exp.id)}
                        disabled={simulatingId === exp.id}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        {simulatingId === exp.id ? 'Simulating...' : 'Simulate Data'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => !isDemo && pauseMutation.mutate(exp.id)}
                        disabled={isDemo || pauseMutation.isPending}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    </>
                  )}
                  {exp.status === 'paused' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => !isDemo && resumeMutation.mutate(exp.id)}
                      disabled={isDemo || resumeMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  )}
                  {exp.status === 'completed' && (
                    <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </span>
                  )}
                  {exp.status !== 'completed' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => !isDemo && deleteMutation.mutate(exp.id)}
                      disabled={isDemo || deleteMutation.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium">{exp.progress || 0}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--lab-primary)] transition-all" 
                    style={{ width: `${exp.progress || 0}%` }} 
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {exp.variants?.map((variant: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{variant.name}</span>
                      <span className="text-lg font-bold">{variant.avgScore?.toFixed(1) || '0.0'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      n = {(variant.sampleSize || 0).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3 text-muted-foreground" />
                    p-value: <strong>{exp.metrics?.pValue?.toFixed(4) || 'N/A'}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    Effect: <strong>{exp.metrics?.effectSize?.toFixed(2) || 'N/A'}</strong>
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Started: <span suppressHydrationWarning>{exp.startedAt ? new Date(exp.startedAt).toLocaleDateString('en-US') : 'Pending'}</span>
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
