'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle2, Activity, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

const lessons = [
  { id: 1, title: 'Why Continuous Validation?', content: `AI systems can drift, degrade, or behave unexpectedly over time. **Continuous Validation** ensures AI behavior is constantly verified against expected standards.

Unlike one-time testing, continuous validation:
- Monitors every interaction in real-time
- Detects subtle changes in behavior
- Catches issues before they escalate
- Maintains trust over time` },
  { id: 2, title: 'What Gets Validated?', content: `SONATE continuously validates:

**Output Quality** - Are responses accurate and appropriate?
**Safety Compliance** - Does output follow safety guidelines?
**Consistency** - Is behavior stable across similar inputs?
**Performance** - Are latency and reliability acceptable?
**Drift** - Has behavior changed from the baseline?

Each aspect is scored and tracked over time.` },
  { id: 3, title: 'Validation Methods', content: `SONATE uses multiple validation methods:

**Rule-Based Checks**
Predefined rules that outputs must satisfy

**Statistical Analysis**
Comparing current behavior to historical baselines

**Semantic Analysis**
Understanding meaning, not just pattern matching

**Cross-Reference**
Comparing outputs across models and contexts

**Human Review**
Sampling for manual inspection` },
  { id: 4, title: 'Real-Time vs Batch', content: `Validation happens at two speeds:

**Real-Time Validation**
Every interaction is checked instantly. Critical violations trigger immediate alerts.

**Batch Validation**
Periodic deep analysis of aggregated data. Catches subtle trends invisible in real-time.

Both are essential for comprehensive governance.` },
  { id: 5, title: 'Validation Thresholds', content: `You can configure validation sensitivity:

**Strict Mode** - Flag any deviation (high false positives, high safety)
**Balanced Mode** - Flag significant deviations (recommended)
**Permissive Mode** - Flag only major violations (low noise, lower safety)

Adjust thresholds in Settings → Governance → Validation.` }
];

export default function ValidationPage() {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const handleNext = () => {
    if (!completedLessons.includes(currentLesson)) setCompletedLessons([...completedLessons, currentLesson]);
    if (currentLesson < lessons.length - 1) setCurrentLesson(currentLesson + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4 mr-1" />Back to Learning Hub</Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white"><Activity className="h-6 w-6" /></div>
          <div><h1 className="text-3xl font-bold">Continuous Validation</h1><p className="text-muted-foreground">How we constantly verify AI behavior</p></div>
        </div>
        <div className="flex items-center gap-4"><Progress value={(completedLessons.length / lessons.length) * 100} className="flex-1 h-2" /><span className="text-sm text-muted-foreground">{completedLessons.length}/{lessons.length}</span></div>
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {lessons.map((l, i) => <Button key={l.id} variant={currentLesson === i ? 'default' : 'outline'} size="sm" onClick={() => setCurrentLesson(i)}>{completedLessons.includes(i) && <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />}{i + 1}</Button>)}
      </div>
      <Card className="mb-6"><CardHeader><Badge variant="outline">Lesson {currentLesson + 1}</Badge><CardTitle className="text-2xl">{lessons[currentLesson].title}</CardTitle></CardHeader><CardContent><div className="prose prose-slate dark:prose-invert max-w-none">{lessons[currentLesson].content.split('\n').map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />)}</div></CardContent></Card>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))} disabled={currentLesson === 0}><ArrowLeft className="h-4 w-4 mr-2" />Previous</Button>
        {currentLesson === lessons.length - 1 ? <Link href="/dashboard/learn"><Button className="bg-gradient-to-r from-purple-500 to-pink-500"><CheckCircle2 className="h-4 w-4 mr-2" />Complete</Button></Link> : <Button onClick={handleNext}>Next<ArrowRight className="h-4 w-4 ml-2" /></Button>}
      </div>
    </div>
  );
}
