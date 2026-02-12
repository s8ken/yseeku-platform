'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { fetchAPI } from '@/lib/api/client';
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
  Info,
  Code,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  Trash2,
  RotateCcw,
  Copy,
  ExternalLink
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface Variant {
  name: string;
  description?: string;
  sampleSize: number;
  avgScore: number;
  successCount: number;
  failureCount: number;
}

interface Experiment {
  id: string;
  name: string;
  description?: string;
  hypothesis: string;
  status: 'draft' | 'running' | 'completed' | 'paused' | 'archived';
  type: 'ab_test' | 'multivariate' | 'sequential' | 'bayesian';
  progress: number;
  currentSampleSize: number;
  targetSampleSize: number;
  startedAt: string | null;
  completedAt: string | null;
  variants: Variant[];
  metrics: {
    pValue?: number;
    effectSize?: number;
    confidenceInterval?: [number, number];
    significant: boolean;
  };
}

const EXPERIMENT_EXAMPLES = [
  {
    name: 'Trust Threshold Optimization',
    hypothesis: 'Lowering the trust threshold from 0.7 to 0.6 will increase approval rates without significantly impacting safety metrics',
    description: 'Compare trust score thresholds for AI response approval'
  },
  {
    name: 'Resonance Weight Study',
    hypothesis: 'Increasing semantic mirroring weight by 20% will improve user satisfaction scores',
    description: 'Test different weights for resonance calculation components'
  },
  {
    name: 'Policy Strictness A/B',
    hypothesis: 'Strict constitutional policy enforcement reduces risk events by 15% compared to moderate enforcement',
    description: 'Compare policy enforcement levels'
  }
];

function ExperimentCard({
  experiment,
  onStart,
  onPause,
  onComplete,
  onDelete,
  onRecordData,
  expanded,
  onToggleExpand
}: {
  experiment: Experiment;
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onRecordData: (variantIndex: number, score: number, success: boolean) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const [recordVariant, setRecordVariant] = useState(0);
  const [recordScore, setRecordScore] = useState([75]);
  const [recordSuccess, setRecordSuccess] = useState(true);

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    archived: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  };

  const handleRecordSubmit = () => {
    onRecordData(recordVariant, recordScore[0] / 100, recordSuccess);
  };

  return (
    <Card className={experiment.metrics?.significant ? 'border-l-4 border-l-emerald-500' : ''}>
      <CardHeader className="cursor-pointer" onClick={onToggleExpand}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {experiment.name}
              {experiment.metrics?.significant && (
                <Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                  SIGNIFICANT
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">{experiment.hypothesis}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[experiment.status]}>
              {experiment.status.toUpperCase()}
            </Badge>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1 text-sm">
            <span className="text-muted-foreground">
              {(experiment.currentSampleSize ?? 0).toLocaleString()} / {(experiment.targetSampleSize ?? 0).toLocaleString()} samples
            </span>
            <span className="font-medium">{experiment.progress ?? 0}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--lab-primary)] transition-all"
              style={{ width: `${experiment.progress}%` }}
            />
          </div>
        </div>

        {/* Variants */}
        <div className="grid gap-3 md:grid-cols-2">
          {experiment.variants?.map((variant, idx) => (
            <div key={idx} className={`p-3 rounded-lg border ${idx === 0 ? 'bg-muted/50' : 'bg-card'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm flex items-center gap-1">
                  {variant.name}
                  {idx === 0 && <Badge variant="outline" className="text-xs ml-1">Control</Badge>}
                </span>
                <span className="text-lg font-bold">{(variant.avgScore * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>n = {(variant.sampleSize ?? 0).toLocaleString()}</span>
                <span className="text-emerald-600">{variant.successCount} success</span>
                <span className="text-red-600">{variant.failureCount} fail</span>
              </div>
            </div>
          ))}
        </div>

        {/* Stats footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3 text-muted-foreground" />
              p-value: <strong>{experiment.metrics?.pValue?.toFixed(4) || 'N/A'}</strong>
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              Effect: <strong>{experiment.metrics?.effectSize?.toFixed(3) || 'N/A'}</strong>
            </span>
            {experiment.metrics?.confidenceInterval && (
              <span className="flex items-center gap-1">
                95% CI: [{experiment.metrics.confidenceInterval[0].toFixed(3)}, {experiment.metrics.confidenceInterval[1].toFixed(3)}]
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {experiment.startedAt ? new Date(experiment.startedAt).toLocaleDateString() : 'Not started'}
          </span>
        </div>

        {/* Expanded section */}
        {expanded && (
          <div className="pt-4 border-t space-y-4">
            {/* Actions */}
            <div className="flex gap-2">
              {experiment.status === 'draft' && (
                <Button size="sm" onClick={onStart} className="bg-[var(--lab-primary)]">
                  <Play className="h-4 w-4 mr-1" /> Start
                </Button>
              )}
              {experiment.status === 'running' && (
                <>
                  <Button size="sm" variant="outline" onClick={onPause}>
                    <Pause className="h-4 w-4 mr-1" /> Pause
                  </Button>
                  <Button size="sm" variant="outline" onClick={onComplete}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Complete
                  </Button>
                </>
              )}
              {experiment.status === 'paused' && (
                <Button size="sm" onClick={onStart} className="bg-[var(--lab-primary)]">
                  <Play className="h-4 w-4 mr-1" /> Resume
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>

            {/* Manual data recording */}
            {experiment.status === 'running' && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Record Data Point
                </h4>
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Variant</label>
                    <Select value={String(recordVariant)} onValueChange={(v) => setRecordVariant(Number(v))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {experiment.variants.map((v, i) => (
                          <SelectItem key={i} value={String(i)}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Score: {recordScore[0]}%</label>
                    <Slider
                      value={recordScore}
                      onValueChange={setRecordScore}
                      max={100}
                      min={0}
                      step={1}
                      className="mt-3"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Outcome</label>
                    <Select value={recordSuccess ? 'success' : 'failure'} onValueChange={(v) => setRecordSuccess(v === 'success')}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="failure">Failure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button size="sm" onClick={handleRecordSubmit} className="w-full">
                      Record
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* API Integration */}
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Code className="h-4 w-4" />
                API Integration
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                Record data programmatically from your application:
              </p>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                {`POST /api/lab/experiments/${experiment.id}/record
{
  "variantIndex": 0,  // 0 = Control, 1 = Treatment
  "score": 0.85,      // 0-1 score value
  "success": true     // outcome boolean
}`}
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={() => {
                  navigator.clipboard.writeText(`curl -X POST ${window.location.origin}/api/lab/experiments/${experiment.id}/record -H "Content-Type: application/json" -d '{"variantIndex": 0, "score": 0.85, "success": true}'`);
                  toast.success('cURL command copied');
                }}
              >
                <Copy className="h-3 w-3 mr-1" /> Copy cURL
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ExperimentsPage() {
  const [showNewExperiment, setShowNewExperiment] = useState(false);
  const [newName, setNewName] = useState('');
  const [newHypothesis, setNewHypothesis] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [targetSampleSize, setTargetSampleSize] = useState(1000);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('experiments');
  const queryClient = useQueryClient();

  const { data: experimentsResponse, isLoading } = useQuery({
    queryKey: ['experiments'],
    queryFn: () => api.getExperiments(),
  });

  const experiments = (experimentsResponse?.data?.experiments || []) as Experiment[];
  const summary = experimentsResponse?.data?.summary || { running: 0, completed: 0, significant: 0, total: 0 };

  const createMutation = useMutation({
    mutationFn: async (data: any) => api.createExperiment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast.success('Experiment created');
      setShowNewExperiment(false);
      setNewName('');
      setNewHypothesis('');
      setNewDescription('');
    },
    onError: (e: any) => toast.error('Failed to create', { description: e.message }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      return fetchAPI(`/api/lab/experiments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast.success('Experiment updated');
    },
    onError: (e: any) => toast.error('Failed to update', { description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return fetchAPI(`/api/lab/experiments/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast.success('Experiment deleted');
    },
    onError: (e: any) => toast.error('Failed to delete', { description: e.message }),
  });

  const recordMutation = useMutation({
    mutationFn: async ({ id, variantIndex, score, success }: { id: string; variantIndex: number; score: number; success: boolean }) => {
      return fetchAPI(`/api/lab/experiments/${id}/record`, {
        method: 'POST',
        body: JSON.stringify({ variantIndex, score, success }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast.success('Data point recorded');
    },
    onError: (e: any) => toast.error('Failed to record', { description: e.message }),
  });

  const handleCreate = () => {
    if (!newName || !newHypothesis) {
      toast.error('Name and hypothesis are required');
      return;
    }
    createMutation.mutate({
      name: newName,
      hypothesis: newHypothesis,
      description: newDescription,
      targetSampleSize,
      variants: [
        { name: 'Control', description: 'Baseline configuration' },
        { name: 'Treatment', description: 'Experimental configuration' }
      ]
    });
  };

  const useExample = (example: typeof EXPERIMENT_EXAMPLES[0]) => {
    setNewName(example.name);
    setNewHypothesis(example.hypothesis);
    setNewDescription(example.description);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-[var(--lab-primary)]" />
            A/B Testing Lab
          </h1>
          <p className="text-muted-foreground">
            Run statistically validated experiments on trust configurations
          </p>
        </div>
        <Button
          onClick={() => setShowNewExperiment(true)}
          className="bg-[var(--lab-primary)] hover:bg-[var(--lab-secondary)]"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Experiment
        </Button>
      </div>

      {/* What is this? */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                What are A/B Experiments?
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                Test different trust protocol configurations (thresholds, weights, policies) against each other.
                Record outcomes from real or simulated interactions, and the system automatically calculates
                statistical significance using two-sample t-tests.
              </p>
              <div className="flex gap-4 pt-1 text-xs text-blue-700 dark:text-blue-300">
                <span className="flex items-center gap-1"><Target className="h-3 w-3" /> Define hypothesis</span>
                <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Record data points</span>
                <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Get statistical results</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-[var(--lab-primary)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Play className="h-4 w-4 text-[var(--lab-primary)]" />
              Running
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.running}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Significant
              <InfoTooltip term="Statistical Significance" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">{summary.significant}</div>
            <p className="text-xs text-muted-foreground">p &lt; 0.05</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* New Experiment Form */}
      {showNewExperiment && (
        <Card className="border-[var(--lab-border)] bg-[var(--lab-bg)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-[var(--lab-primary)]" />
              Create New Experiment
            </CardTitle>
            <CardDescription>
              Define what you want to test. The system will create Control and Treatment variants.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Examples */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Quick start from example:</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {EXPERIMENT_EXAMPLES.map((ex, i) => (
                  <Button key={i} variant="outline" size="sm" onClick={() => useExample(ex)}>
                    {ex.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Experiment Name *</label>
                <Input
                  placeholder="e.g., Trust Threshold Study"
                  className="mt-1"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Target Sample Size</label>
                <Input
                  type="number"
                  placeholder="1000"
                  className="mt-1"
                  value={targetSampleSize}
                  onChange={(e) => setTargetSampleSize(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">Minimum 30 per variant for statistical validity</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Hypothesis *</label>
              <Textarea
                placeholder="State your hypothesis: what change are you testing and what outcome do you expect?"
                value={newHypothesis}
                onChange={(e) => setNewHypothesis(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                placeholder="Additional context about what you're testing..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="bg-[var(--lab-primary)] hover:bg-[var(--lab-secondary)]"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Experiment'}
              </Button>
              <Button variant="outline" onClick={() => setShowNewExperiment(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experiments List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Experiments</h2>

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
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Create an experiment to start comparing trust configurations.
                You can record data manually or integrate via API.
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
        ) : (
          experiments.map((exp) => (
            <ExperimentCard
              key={exp.id}
              experiment={exp}
              expanded={expandedId === exp.id}
              onToggleExpand={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
              onStart={() => updateMutation.mutate({ id: exp.id, action: 'start' })}
              onPause={() => updateMutation.mutate({ id: exp.id, action: 'pause' })}
              onComplete={() => updateMutation.mutate({ id: exp.id, action: 'complete' })}
              onDelete={() => deleteMutation.mutate(exp.id)}
              onRecordData={(variantIndex, score, success) =>
                recordMutation.mutate({ id: exp.id, variantIndex, score, success })
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
