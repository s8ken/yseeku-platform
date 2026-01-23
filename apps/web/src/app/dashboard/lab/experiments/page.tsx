'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api';
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
  TrendingDown,
  Eye,
  Settings,
  Trash2,
  Copy,
  ExternalLink,
  Info,
  Lightbulb,
  Target,
  Shuffle,
  Shield
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  description: string;
  status: 'running' | 'completed' | 'paused' | 'pending';
  progress: number;
  startedAt: string;
  completedAt?: string;
  variants: Array<{
    name: string;
    description: string;
    sampleSize: number;
    avgScore: number;
    config: Record<string, any>;
  }>;
  metrics: {
    pValue: number;
    effectSize: number;
    significant: boolean;
    confidenceInterval: [number, number];
    statisticalPower: number;
  };
  category: 'threshold' | 'weighting' | 'model' | 'protocol';
}

// Demo experiments showcasing the Lab's capabilities
const DEMO_EXPERIMENTS: Experiment[] = [
  {
    id: 'exp-001',
    name: 'Resonance Threshold Calibration',
    hypothesis: 'Lowering resonance detection threshold from 0.7 to 0.5 improves early detection of trust degradation without increasing false positives',
    description: 'Testing whether a more sensitive resonance threshold catches trust issues earlier while maintaining precision.',
    status: 'running',
    progress: 72,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    category: 'threshold',
    variants: [
      { name: 'Control (0.7)', description: 'Current production threshold', sampleSize: 1245, avgScore: 7.2, config: { threshold: 0.7 } },
      { name: 'Treatment (0.5)', description: 'More sensitive detection', sampleSize: 1189, avgScore: 7.8, config: { threshold: 0.5 } }
    ],
    metrics: { pValue: 0.0023, effectSize: 0.42, significant: true, confidenceInterval: [0.31, 0.53], statisticalPower: 0.89 }
  },
  {
    id: 'exp-002',
    name: 'Bedau Index Window Size',
    hypothesis: 'Extending the temporal window for Bedau Index calculation from 10 to 25 interactions improves emergence detection accuracy',
    description: 'Evaluating whether a larger context window provides better emergence pattern recognition.',
    status: 'running',
    progress: 45,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    category: 'threshold',
    variants: [
      { name: '10 interactions', description: 'Current window size', sampleSize: 678, avgScore: 6.8, config: { windowSize: 10 } },
      { name: '25 interactions', description: 'Extended window', sampleSize: 645, avgScore: 7.1, config: { windowSize: 25 } },
      { name: '50 interactions', description: 'Maximum window', sampleSize: 612, avgScore: 6.5, config: { windowSize: 50 } }
    ],
    metrics: { pValue: 0.089, effectSize: 0.18, significant: false, confidenceInterval: [-0.05, 0.41], statisticalPower: 0.62 }
  },
  {
    id: 'exp-003',
    name: 'SYMBI Principle Weighting',
    hypothesis: 'Equal weighting across SYMBI principles outperforms the current consent-heavy weighting for overall trust scoring',
    description: 'Testing alternative weighting strategies for the 6 constitutional principles.',
    status: 'completed',
    progress: 100,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    category: 'weighting',
    variants: [
      { name: 'Consent-Heavy', description: 'CONSENT: 25%, others distributed', sampleSize: 2341, avgScore: 7.4, config: { weights: { consent: 0.25, inspection: 0.20, validation: 0.20, ethics: 0.15, disconnect: 0.10, moral: 0.10 } } },
      { name: 'Equal Weights', description: 'All principles at 16.67%', sampleSize: 2287, avgScore: 8.1, config: { weights: { consent: 0.167, inspection: 0.167, validation: 0.167, ethics: 0.167, disconnect: 0.166, moral: 0.166 } } }
    ],
    metrics: { pValue: 0.0001, effectSize: 0.67, significant: true, confidenceInterval: [0.52, 0.82], statisticalPower: 0.98 }
  },
  {
    id: 'exp-004',
    name: 'Constitutional vs Directive AI',
    hypothesis: 'Constitutional AI with SYMBI framework produces higher trust scores than directive-only AI systems',
    description: 'Comparing trust outcomes between constitutional and traditional directive AI approaches.',
    status: 'completed',
    progress: 100,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    category: 'model',
    variants: [
      { name: 'Directive AI', description: 'Traditional instruction-following', sampleSize: 3156, avgScore: 6.2, config: { mode: 'directive' } },
      { name: 'Constitutional (SYMBI)', description: 'Full SYMBI framework', sampleSize: 3089, avgScore: 8.7, config: { mode: 'constitutional', framework: 'SYMBI' } }
    ],
    metrics: { pValue: 0.00001, effectSize: 1.24, significant: true, confidenceInterval: [1.08, 1.40], statisticalPower: 0.99 }
  },
  {
    id: 'exp-005',
    name: 'Ethical Override Sensitivity',
    hypothesis: 'Increasing ethical override sensitivity catches more edge cases without blocking legitimate interactions',
    description: 'Fine-tuning the ethical override mechanism for optimal balance.',
    status: 'paused',
    progress: 23,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    category: 'protocol',
    variants: [
      { name: 'Standard', description: 'Current sensitivity level', sampleSize: 234, avgScore: 7.5, config: { sensitivity: 0.6 } },
      { name: 'High Sensitivity', description: 'More aggressive detection', sampleSize: 228, avgScore: 7.3, config: { sensitivity: 0.8 } }
    ],
    metrics: { pValue: 0.34, effectSize: 0.08, significant: false, confidenceInterval: [-0.12, 0.28], statisticalPower: 0.21 }
  }
];

const EXPERIMENT_TEMPLATES = [
  { id: 'threshold', name: 'Threshold Calibration', description: 'Test different detection thresholds', icon: Target },
  { id: 'weighting', name: 'Principle Weighting', description: 'Compare SYMBI weight distributions', icon: BarChart3 },
  { id: 'model', name: 'Model Comparison', description: 'Compare AI model configurations', icon: Shuffle },
  { id: 'protocol', name: 'Protocol Testing', description: 'Test safety protocol variations', icon: Shield },
];

export default function LabPage() {
  const [showNewExperiment, setShowNewExperiment] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [newExperiment, setNewExperiment] = useState({
    name: '',
    hypothesis: '',
    description: '',
    category: 'threshold' as Experiment['category'],
    controlName: '',
    controlConfig: '',
    treatmentName: '',
    treatmentConfig: '',
  });
  
  // Use demo data with fallback
  const [experiments, setExperiments] = useState<Experiment[]>(DEMO_EXPERIMENTS);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate summary stats from experiments
  const summary = {
    running: experiments.filter(e => e.status === 'running').length,
    completed: experiments.filter(e => e.status === 'completed').length,
    paused: experiments.filter(e => e.status === 'paused').length,
    significant: experiments.filter(e => e.metrics.significant).length,
    total: experiments.length,
  };

  const handleCreateExperiment = () => {
    if (!newExperiment.name || !newExperiment.hypothesis) {
      toast.error('Please provide both a name and hypothesis');
      return;
    }

    const experiment: Experiment = {
      id: `exp-${Date.now()}`,
      name: newExperiment.name,
      hypothesis: newExperiment.hypothesis,
      description: newExperiment.description || 'Custom experiment',
      status: 'pending',
      progress: 0,
      startedAt: new Date().toISOString(),
      category: newExperiment.category,
      variants: [
        { 
          name: newExperiment.controlName || 'Control', 
          description: 'Baseline configuration',
          sampleSize: 0, 
          avgScore: 0, 
          config: {} 
        },
        { 
          name: newExperiment.treatmentName || 'Treatment', 
          description: 'Experimental configuration',
          sampleSize: 0, 
          avgScore: 0, 
          config: {} 
        }
      ],
      metrics: { pValue: 1, effectSize: 0, significant: false, confidenceInterval: [0, 0], statisticalPower: 0 }
    };

    setExperiments([experiment, ...experiments]);
    toast.success('Experiment created! It will start collecting data shortly.');
    setShowNewExperiment(false);
    setNewExperiment({
      name: '',
      hypothesis: '',
      description: '',
      category: 'threshold',
      controlName: '',
      controlConfig: '',
      treatmentName: '',
      treatmentConfig: '',
    });
  };

  const handlePauseExperiment = (id: string) => {
    setExperiments(experiments.map(exp => 
      exp.id === id ? { ...exp, status: exp.status === 'paused' ? 'running' : 'paused' as const } : exp
    ));
    toast.success('Experiment status updated');
  };

  const getStatusBadge = (status: Experiment['status']) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-500">Running</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getCategoryIcon = (category: Experiment['category']) => {
    const template = EXPERIMENT_TEMPLATES.find(t => t.id === category);
    if (template) {
      const Icon = template.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <FlaskConical className="h-4 w-4" />;
  };

  const filteredExperiments = activeTab === 'all' 
    ? experiments 
    : experiments.filter(e => e.status === activeTab);

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
            <CardDescription>Define your hypothesis and configure variants for double-blind A/B testing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Experiment Name</label>
                <Input 
                  placeholder="e.g., Resonance Threshold Study" 
                  className="mt-1"
                  value={newExperiment.name}
                  onChange={(e) => setNewExperiment({...newExperiment, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select 
                  value={newExperiment.category} 
                  onValueChange={(value: Experiment['category']) => setNewExperiment({...newExperiment, category: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIMENT_TEMPLATES.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <t.icon className="h-4 w-4" />
                          {t.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Hypothesis</label>
              <Textarea 
                placeholder="State your hypothesis clearly. E.g., 'Lowering the detection threshold from 0.7 to 0.5 will improve early detection rates without increasing false positives'"
                value={newExperiment.hypothesis}
                onChange={(e) => setNewExperiment({...newExperiment, hypothesis: e.target.value})}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input 
                placeholder="Brief description of what this experiment tests"
                className="mt-1"
                value={newExperiment.description}
                onChange={(e) => setNewExperiment({...newExperiment, description: e.target.value})}
              />
            </div>

            {/* Variants Configuration */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Shuffle className="h-4 w-4" />
                Variant Configuration
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span className="font-medium">Control (Baseline)</span>
                  </div>
                  <Input 
                    placeholder="Control variant name"
                    className="mb-2"
                    value={newExperiment.controlName}
                    onChange={(e) => setNewExperiment({...newExperiment, controlName: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">Current production configuration</p>
                </div>
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="font-medium">Treatment (Experimental)</span>
                  </div>
                  <Input 
                    placeholder="Treatment variant name"
                    className="mb-2"
                    value={newExperiment.treatmentName}
                    onChange={(e) => setNewExperiment({...newExperiment, treatmentName: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">New configuration being tested</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                className="bg-[var(--lab-primary)] hover:bg-[var(--lab-secondary)]"
                onClick={handleCreateExperiment}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Experiment
              </Button>
              <Button variant="outline" onClick={() => setShowNewExperiment(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onboarding / Explanation Card */}
      {!showNewExperiment && experiments.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="py-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">What is the Experiment Lab?</h3>
                <p className="text-sm text-muted-foreground">
                  The Lab enables <strong>double-blind A/B testing</strong> of SONATE trust configurations. 
                  Test different thresholds, weights, and protocols with statistical rigor before deploying to production.
                  All experiments run on <strong>synthetic data</strong> in an isolated sandbox.
                </p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs">
                <ExternalLink className="h-3 w-3 mr-1" />
                Docs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experiments List with Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Experiments</h2>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({experiments.length})</TabsTrigger>
              <TabsTrigger value="running">Running ({summary.running})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({summary.completed})</TabsTrigger>
              <TabsTrigger value="paused">Paused ({summary.paused})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading experiments...
            </CardContent>
          </Card>
        ) : filteredExperiments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {activeTab === 'all' ? 'No experiments yet' : `No ${activeTab} experiments`}
              </h3>
              <p className="text-muted-foreground mb-4">
                {activeTab === 'all' 
                  ? 'Create your first experiment to start A/B testing trust protocol configurations.'
                  : `There are no experiments with status "${activeTab}" at the moment.`}
              </p>
              {activeTab === 'all' && (
                <Button
                  onClick={() => setShowNewExperiment(true)}
                  className="bg-[var(--lab-primary)] hover:bg-[var(--lab-secondary)]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Experiment
                </Button>
              )}
            </CardContent>
          </Card>
        ) : filteredExperiments.map((exp) => (
          <Card key={exp.id} className={exp.status === 'completed' ? 'opacity-90' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getCategoryIcon(exp.category)}
                    <CardTitle className="text-lg">{exp.name}</CardTitle>
                    {getStatusBadge(exp.status)}
                    {exp.metrics.significant && (
                      <Badge className="bg-emerald-500 text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        SIGNIFICANT
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1 line-clamp-2">{exp.hypothesis}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {exp.status === 'running' && (
                    <Button variant="outline" size="sm" onClick={() => handlePauseExperiment(exp.id)}>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  )}
                  {exp.status === 'paused' && (
                    <Button variant="outline" size="sm" onClick={() => handlePauseExperiment(exp.id)}>
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium">{exp.progress}%</span>
                </div>
                <Progress value={exp.progress} className="h-2" />
              </div>

              {/* Variants Grid */}
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mb-4">
                {exp.variants.map((variant, idx) => {
                  const isWinner = exp.status === 'completed' && exp.metrics.significant && 
                    variant.avgScore === Math.max(...exp.variants.map(v => v.avgScore));
                  return (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-lg border ${isWinner ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'bg-card'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-gray-400' : 'bg-blue-500'}`} />
                          <span className="font-medium text-sm">{variant.name}</span>
                          {isWinner && <Badge className="bg-emerald-500 text-xs">Winner</Badge>}
                        </div>
                        <span className="text-xl font-bold">{variant.avgScore.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{variant.description}</p>
                      <p className="text-xs text-muted-foreground">
                        n = {variant.sampleSize.toLocaleString()} samples
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Statistics Row */}
              <div className="flex flex-wrap items-center justify-between pt-3 border-t gap-4">
                <div className="flex flex-wrap gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3 text-muted-foreground" />
                    p-value: <strong className={exp.metrics.pValue < 0.05 ? 'text-emerald-600' : ''}>{exp.metrics.pValue.toFixed(4)}</strong>
                    {exp.metrics.pValue < 0.05 && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    Effect Size: <strong>{exp.metrics.effectSize.toFixed(2)}</strong>
                    <span className="text-muted-foreground">
                      ({exp.metrics.effectSize < 0.2 ? 'small' : exp.metrics.effectSize < 0.5 ? 'medium' : 'large'})
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Info className="h-3 w-3 text-muted-foreground" />
                    CI: [{exp.metrics.confidenceInterval[0].toFixed(2)}, {exp.metrics.confidenceInterval[1].toFixed(2)}]
                  </span>
                  <span className="flex items-center gap-1">
                    Power: <strong>{(exp.metrics.statisticalPower * 100).toFixed(0)}%</strong>
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Started: <span suppressHydrationWarning>{new Date(exp.startedAt).toLocaleDateString('en-US')}</span>
                  {exp.completedAt && (
                    <span className="ml-2">
                      • Completed: <span suppressHydrationWarning>{new Date(exp.completedAt).toLocaleDateString('en-US')}</span>
                    </span>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
