'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, 
  AlertTriangle,
  Play,
  RotateCcw,
  Shield,
  Fingerprint,
  CheckCircle2,
  Zap,
  BarChart3
} from 'lucide-react';

interface SymbiScores {
  realityIndex: number;
  trustProtocol: 'PASS' | 'PARTIAL' | 'FAIL';
  ethicalAlignment: number;
  resonanceQuality: 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';
  canvasParity: number;
  overallTrust: number;
  analysis: {
    dimension: string;
    insight: string;
    confidence: number;
  }[];
}

function RadarChart({ scores }: { scores: SymbiScores }) {
  const dimensions = [
    { label: 'Reality', value: scores.realityIndex / 10 },
    { label: 'Trust', value: scores.trustProtocol === 'PASS' ? 1 : scores.trustProtocol === 'PARTIAL' ? 0.6 : 0.2 },
    { label: 'Ethics', value: scores.ethicalAlignment / 5 },
    { label: 'Resonance', value: scores.resonanceQuality === 'BREAKTHROUGH' ? 1 : scores.resonanceQuality === 'ADVANCED' ? 0.7 : 0.4 },
    { label: 'Canvas', value: scores.canvasParity / 100 },
  ];
  
  const points = dimensions.map((d, i) => {
    const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
    const radius = d.value * 80;
    return {
      x: 100 + Math.cos(angle) * radius,
      y: 100 + Math.sin(angle) * radius,
      labelX: 100 + Math.cos(angle) * 95,
      labelY: 100 + Math.sin(angle) * 95,
      label: d.label,
      value: d.value
    };
  });
  
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-xs mx-auto">
      {[0.2, 0.4, 0.6, 0.8, 1].map((scale, i) => (
        <polygon
          key={i}
          points={dimensions.map((_, j) => {
            const angle = (Math.PI * 2 * j) / dimensions.length - Math.PI / 2;
            const radius = scale * 80;
            return `${100 + Math.cos(angle) * radius},${100 + Math.sin(angle) * radius}`;
          }).join(' ')}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="1"
        />
      ))}
      
      {dimensions.map((_, i) => {
        const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
        return (
          <line
            key={i}
            x1="100"
            y1="100"
            x2={100 + Math.cos(angle) * 80}
            y2={100 + Math.sin(angle) * 80}
            stroke="hsl(var(--muted))"
            strokeWidth="1"
          />
        );
      })}
      
      <polygon
        points={points.map(p => `${p.x},${p.y}`).join(' ')}
        fill="var(--lab-bg)"
        stroke="var(--lab-primary)"
        strokeWidth="2"
      />
      
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="var(--lab-primary)" />
          <text
            x={p.labelX}
            y={p.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[8px] fill-current"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function SymbiPage() {
  const [input, setInput] = useState('');
  const [scores, setScores] = useState<SymbiScores | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = async () => {
    if (!input.trim()) return;
    
    setAnalyzing(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockScores: SymbiScores = {
      realityIndex: 7.5 + Math.random() * 2,
      trustProtocol: Math.random() > 0.3 ? 'PASS' : 'PARTIAL',
      ethicalAlignment: 3.5 + Math.random() * 1.5,
      resonanceQuality: Math.random() > 0.7 ? 'BREAKTHROUGH' : Math.random() > 0.4 ? 'ADVANCED' : 'STRONG',
      canvasParity: 75 + Math.random() * 20,
      overallTrust: 70 + Math.random() * 25,
      analysis: [
        { dimension: 'Reality Index', insight: 'Strong grounding in factual information', confidence: 0.87 },
        { dimension: 'Trust Protocol', insight: 'All validation checks passed', confidence: 0.92 },
        { dimension: 'Ethical Alignment', insight: 'Neutral stance with consideration for multiple perspectives', confidence: 0.78 },
        { dimension: 'Resonance Quality', insight: 'Good engagement patterns detected', confidence: 0.84 },
        { dimension: 'Canvas Parity', insight: 'Cross-modal coherence within acceptable range', confidence: 0.81 },
      ]
    };
    
    setScores(mockScores);
    setAnalyzing(false);
  };

  const reset = () => {
    setInput('');
    setScores(null);
  };

  return (
    <div className="space-y-6">
      <div className="sandbox-warning">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div>
          <strong>Research Sandbox Environment</strong>
          <p className="text-sm opacity-80">Analysis uses synthetic scoring models. Results are for research purposes only.</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SYMBI Framework Analysis</h1>
          <p className="text-muted-foreground">5-Dimension AI interaction scoring</p>
        </div>
        <span className="module-badge badge-lab">LAB</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--lab-primary)]" />
              Input Text
            </CardTitle>
            <CardDescription>Paste a conversation or AI interaction to analyze</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              placeholder="Enter conversation text for SYMBI analysis...

Example:
User: What is the capital of France?
AI: The capital of France is Paris. Paris is not only the capital but also the largest city in France, known for its iconic landmarks like the Eiffel Tower, Louvre Museum, and Notre-Dame Cathedral."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button 
                onClick={analyze}
                disabled={!input.trim() || analyzing}
                className="bg-[var(--lab-primary)] hover:bg-[var(--lab-secondary)]"
              >
                {analyzing ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SYMBI Scores</CardTitle>
            <CardDescription>5-dimension trust framework results</CardDescription>
          </CardHeader>
          <CardContent>
            {scores ? (
              <div className="space-y-4">
                <RadarChart scores={scores} />
                
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Overall Trust Score</p>
                  <p className="text-4xl font-bold text-[var(--lab-primary)]">
                    {scores.overallTrust.toFixed(1)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Enter text and click Analyze to see SYMBI scores</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {scores && (
        <Card>
          <CardHeader>
            <CardTitle>Dimension Breakdown</CardTitle>
            <CardDescription>Detailed analysis of each SYMBI dimension</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Fingerprint className="h-4 w-4 text-[var(--lab-primary)]" />
                  <span className="font-medium text-sm">Reality Index</span>
                </div>
                <p className="text-2xl font-bold">{scores.realityIndex.toFixed(1)}/10</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {scores.analysis[0].insight}
                </p>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--lab-primary)]" 
                    style={{ width: `${scores.realityIndex * 10}%` }} 
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-[var(--lab-primary)]" />
                  <span className="font-medium text-sm">Trust Protocol</span>
                </div>
                <p className={`text-2xl font-bold ${
                  scores.trustProtocol === 'PASS' ? 'text-emerald-500' : 'text-amber-500'
                }`}>{scores.trustProtocol}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {scores.analysis[1].insight}
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--lab-primary)]" />
                  <span className="font-medium text-sm">Ethical Alignment</span>
                </div>
                <p className="text-2xl font-bold">{scores.ethicalAlignment.toFixed(1)}/5</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {scores.analysis[2].insight}
                </p>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--lab-primary)]" 
                    style={{ width: `${scores.ethicalAlignment * 20}%` }} 
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-[var(--lab-primary)]" />
                  <span className="font-medium text-sm">Resonance Quality</span>
                </div>
                <p className={`text-2xl font-bold ${
                  scores.resonanceQuality === 'BREAKTHROUGH' ? 'text-emerald-500' : 
                  scores.resonanceQuality === 'ADVANCED' ? 'text-blue-500' : 'text-gray-500'
                }`}>{scores.resonanceQuality}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {scores.analysis[3].insight}
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-[var(--lab-primary)]" />
                  <span className="font-medium text-sm">Canvas Parity</span>
                </div>
                <p className="text-2xl font-bold">{scores.canvasParity.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {scores.analysis[4].insight}
                </p>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--lab-primary)]" 
                    style={{ width: `${scores.canvasParity}%` }} 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
