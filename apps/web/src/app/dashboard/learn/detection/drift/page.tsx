'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle2, Activity, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const lessons = [
  { id: 1, title: 'What is Drift?', content: `**Drift** occurs when AI behavior gradually changes over time, diverging from its original baseline.

Like a ship drifting off course, AI systems can slowly change due to:
- Changes in input data patterns
- Model updates and fine-tuning
- Environmental changes
- Accumulated edge cases` },
  { id: 2, title: 'Types of Drift', content: `SONATE monitors multiple drift types:

**Data Drift**
Input data distribution changes

**Concept Drift**
The relationship between inputs and outputs changes

**Model Drift**
Model behavior changes (often from updates)

**Performance Drift**
Accuracy or quality degrades over time` },
  { id: 3, title: 'Detecting Drift', content: `How SONATE detects drift:

**Baseline Comparison**
Compare current behavior to historical baseline

**Statistical Tests**
KL divergence, PSI, and other statistical measures

**Embedding Distance**
Track movement in semantic space

**Performance Metrics**
Monitor accuracy, latency, user feedback` },
  { id: 4, title: 'Drift Alerts', content: `When drift is detected, SONATE alerts you with:

**Severity Level**
How significant is the drift?

**Drift Type**
What kind of drift is occurring?

**Affected Metrics**
Which dimensions are impacted?

**Trend Direction**
Is it getting worse or stabilizing?

**Recommended Action**
What should you do about it?` },
  { id: 5, title: 'Managing Drift', content: `How to manage drift:

**Prevention**
- Regular model retraining
- Stable data pipelines
- Version control for models

**Detection**
- Continuous monitoring
- Automated alerts
- Regular audits

**Remediation**
- Rollback to stable version
- Retrain on current data
- Adjust thresholds` }
];

function DriftVisualization() {
  const [dataPoints, setDataPoints] = useState<number[]>([]);
  
  useEffect(() => {
    const points = [];
    let value = 92;
    for (let i = 0; i < 30; i++) {
      value += (Math.random() - 0.5) * 2 - 0.1; // Slight downward drift
      points.push(Math.max(70, Math.min(100, value)));
    }
    setDataPoints(points);
  }, []);
  
  const baseline = 92;
  const current = dataPoints[dataPoints.length - 1] || baseline;
  const drift = baseline - current;
  
  return (
    <Card className="border-2 border-cyan-200 dark:border-cyan-800">
      <CardHeader className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-950 dark:to-teal-950">
        <CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5" />Drift Visualization</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div><p className="text-sm text-muted-foreground">Baseline</p><p className="text-2xl font-bold text-green-600">{baseline.toFixed(1)}%</p></div>
          <div className="text-right"><p className="text-sm text-muted-foreground">Current</p><p className={cn('text-2xl font-bold', drift > 3 ? 'text-amber-600' : 'text-green-600')}>{current.toFixed(1)}%</p></div>
        </div>
        
        <div className="h-32 flex items-end gap-1">
          {dataPoints.map((point, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end">
              <div className={cn('rounded-t transition-all', point >= 85 ? 'bg-green-500' : point >= 75 ? 'bg-amber-500' : 'bg-red-500')} style={{ height: `${point}%` }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2"><span>30 days ago</span><span>Today</span></div>
        
        {drift > 3 && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700 dark:text-amber-300">Drift of {drift.toFixed(1)}% detected from baseline</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DriftPage() {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const handleNext = () => { if (!completedLessons.includes(currentLesson)) setCompletedLessons([...completedLessons, currentLesson]); if (currentLesson < lessons.length - 1) setCurrentLesson(currentLesson + 1); };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4 mr-1" />Back to Learning Hub</Link>
        <div className="flex items-center gap-3 mb-4"><div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white"><Activity className="h-6 w-6" /></div><div><h1 className="text-3xl font-bold">Drift Detection Explained</h1><p className="text-muted-foreground">How we detect when AI behavior changes over time</p></div></div>
        <div className="flex items-center gap-4"><Progress value={(completedLessons.length / lessons.length) * 100} className="flex-1 h-2" /><span className="text-sm text-muted-foreground">{completedLessons.length}/{lessons.length}</span></div>
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">{lessons.map((l, i) => <Button key={l.id} variant={currentLesson === i ? 'default' : 'outline'} size="sm" onClick={() => setCurrentLesson(i)}>{completedLessons.includes(i) && <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />}{i + 1}</Button>)}</div>
      <Card className="mb-6"><CardHeader><Badge variant="outline">Lesson {currentLesson + 1}</Badge><CardTitle className="text-2xl">{lessons[currentLesson].title}</CardTitle></CardHeader><CardContent><div className="prose prose-slate dark:prose-invert max-w-none">{lessons[currentLesson].content.split('\n').map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />)}</div></CardContent></Card>
      {currentLesson >= 2 && <div className="mb-6"><DriftVisualization /></div>}
      <div className="flex justify-between"><Button variant="outline" onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))} disabled={currentLesson === 0}><ArrowLeft className="h-4 w-4 mr-2" />Previous</Button>{currentLesson === lessons.length - 1 ? <Link href="/dashboard/learn"><Button className="bg-gradient-to-r from-cyan-500 to-teal-500"><CheckCircle2 className="h-4 w-4 mr-2" />Complete</Button></Link> : <Button onClick={handleNext}>Next<ArrowRight className="h-4 w-4 ml-2" /></Button>}</div>
    </div>
  );
}
