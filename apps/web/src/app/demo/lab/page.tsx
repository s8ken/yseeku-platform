'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  TrendingUp
} from 'lucide-react';

interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  status: 'running' | 'completed' | 'paused' | 'pending';
  progress: number;
  startedAt: string;
  variants: Array<{
    name: string;
    sampleSize: number;
    avgScore: number;
  }>;
  stats: {
    pValue: number;
    effectSize: number;
    significant: boolean;
  };
}

const mockExperiments: Experiment[] = [
  {
    id: 'exp-001',
    name: 'Resonance Threshold Calibration',
    hypothesis: 'Lowering resonance detection threshold from 0.7 to 0.5 improves early detection of trust degradation',
    status: 'running',
    progress: 72,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    variants: [
      { name: 'Control (0.7)', sampleSize: 1245, avgScore: 7.2 },
      { name: 'Treatment (0.5)', sampleSize: 1189, avgScore: 7.8 }
    ],
    stats: { pValue: 0.0023, effectSize: 0.42, significant: true }
  },
  {
    id: 'exp-002',
    name: 'Bedau Index Window Size',
    hypothesis: 'Extending the temporal window for Bedau Index calculation from 10 to 25 interactions improves emergence detection',
    status: 'running',
    progress: 45,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    variants: [
      { name: '10 interactions', sampleSize: 678, avgScore: 6.8 },
      { name: '25 interactions', sampleSize: 645, avgScore: 7.1 },
      { name: '50 interactions', sampleSize: 612, avgScore: 6.5 }
    ],
    stats: { pValue: 0.089, effectSize: 0.18, significant: false }
  },
  {
    id: 'exp-003',
    name: 'Multi-Modal Coherence Weights',
    hypothesis: 'Equal weighting across modalities outperforms text-heavy weighting for trust scoring',
    status: 'completed',
    progress: 100,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    variants: [
      { name: 'Text-Heavy (70/30)', sampleSize: 2341, avgScore: 7.4 },
      { name: 'Equal (50/50)', sampleSize: 2287, avgScore: 8.1 }
    ],
    stats: { pValue: 0.0001, effectSize: 0.67, significant: true }
  }
];

export default function LabPage() {
  const [showNewExperiment, setShowNewExperiment] = useState(false);
  const [newHypothesis, setNewHypothesis] = useState('');

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
            <div className="text-3xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">Currently running</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1</div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Significant Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">2</div>
            <p className="text-xs text-muted-foreground mt-1">p &lt; 0.05</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Effect Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0.42</div>
            <p className="text-xs text-muted-foreground mt-1">Cohen's d</p>
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
              <Input placeholder="e.g., Canvas Parity Threshold Study" className="mt-1" />
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
              <Button className="bg-[var(--lab-primary)] hover:bg-[var(--lab-secondary)]">
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

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Active Experiments</h2>
        
        {mockExperiments.map((exp) => (
          <Card key={exp.id} className={exp.status === 'completed' ? 'opacity-75' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {exp.name}
                    {exp.stats.significant && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        SIGNIFICANT
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">{exp.hypothesis}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {exp.status === 'running' ? (
                    <Button variant="outline" size="sm">
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  ) : exp.status === 'completed' ? (
                    <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </span>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium">{exp.progress}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--lab-primary)] transition-all" 
                    style={{ width: `${exp.progress}%` }} 
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {exp.variants.map((variant, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{variant.name}</span>
                      <span className="text-lg font-bold">{variant.avgScore.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      n = {variant.sampleSize.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3 text-muted-foreground" />
                    p-value: <strong>{exp.stats.pValue.toFixed(4)}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    Effect: <strong>{exp.stats.effectSize.toFixed(2)}</strong>
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Started: {new Date(exp.startedAt).toLocaleDateString('en-US')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
