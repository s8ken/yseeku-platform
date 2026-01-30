'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, ArrowRight, CheckCircle2, Activity, CheckCircle, AlertTriangle, XCircle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const lessons = [
  { id: 1, title: 'What is the Reality Index?', content: `The **Reality Index** measures how well AI outputs align with factual reality.

It answers: "Is this output accurate and grounded in truth?"

Components:
- **Factual Accuracy** - Are claims verifiable?
- **Source Grounding** - Is there evidence?
- **Contextual Relevance** - Does it fit the situation?
- **Logical Coherence** - Does reasoning follow?` },
  { id: 2, title: 'How It\'s Calculated', content: `The Reality Index combines multiple signals:

**Claim Verification** (30%)
Cross-reference claims against trusted sources

**Citation Quality** (25%)
Evaluate sources cited for reliability

**Hallucination Detection** (25%)
Identify fabricated information

**Consistency Check** (20%)
Compare against known facts and prior outputs` },
  { id: 3, title: 'Score Interpretation', content: `What Reality Index scores mean:

🟢 **95-100%** - Highly reliable, well-sourced
🟢 **85-94%** - Reliable with minor issues
🟡 **70-84%** - Usable but verify important claims
🟠 **50-69%** - Significant concerns, needs review
🔴 **0-49%** - Unreliable, high hallucination risk

Most enterprise use cases require 85%+.` },
  { id: 4, title: 'Common Issues', content: `What causes low Reality Index scores:

**Hallucinations**
AI confidently stating false information

**Outdated Information**
Using training data that's no longer accurate

**Misattribution**
Citing sources that don't support claims

**Overgeneralization**
Extending specific findings too broadly

**Context Confusion**
Mixing up details from similar contexts` },
  { id: 5, title: 'Improving Reality Index', content: `How to improve your Reality Index:

✅ Use RAG with verified sources
✅ Enable fact-checking pipelines
✅ Set minimum confidence thresholds
✅ Implement source citation requirements
✅ Regular audits of output quality

Configure these in Settings → Detection → Reality Index.` }
];

function RealityIndexDemo() {
  const [factual, setFactual] = useState(85);
  const [sources, setSources] = useState(78);
  const [hallucination, setHallucination] = useState(92);
  const [consistency, setConsistency] = useState(88);
  
  const overall = (factual * 0.3 + sources * 0.25 + hallucination * 0.25 + consistency * 0.2);
  
  const getColor = (score: number) => score >= 85 ? 'text-green-600' : score >= 70 ? 'text-amber-600' : 'text-red-600';
  
  return (
    <Card className="border-2 border-cyan-200 dark:border-cyan-800">
      <CardHeader className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-950 dark:to-teal-950">
        <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Reality Index Calculator</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Overall Reality Index</p>
          <p className={cn('text-5xl font-bold', getColor(overall))}>{overall.toFixed(1)}%</p>
        </div>
        
        {[
          { label: 'Factual Accuracy (30%)', value: factual, set: setFactual },
          { label: 'Source Quality (25%)', value: sources, set: setSources },
          { label: 'Hallucination Detection (25%)', value: hallucination, set: setHallucination },
          { label: 'Consistency (20%)', value: consistency, set: setConsistency }
        ].map(({ label, value, set }) => (
          <div key={label} className="space-y-2">
            <div className="flex justify-between text-sm"><span>{label}</span><span className={cn('font-bold', getColor(value))}>{value}%</span></div>
            <Slider value={[value]} onValueChange={([v]) => set(v)} max={100} step={1} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function RealityIndexPage() {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const handleNext = () => { if (!completedLessons.includes(currentLesson)) setCompletedLessons([...completedLessons, currentLesson]); if (currentLesson < lessons.length - 1) setCurrentLesson(currentLesson + 1); };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4 mr-1" />Back to Learning Hub</Link>
        <div className="flex items-center gap-3 mb-4"><div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white"><Activity className="h-6 w-6" /></div><div><h1 className="text-3xl font-bold">Reality Index Deep Dive</h1><p className="text-muted-foreground">Measuring factual accuracy and contextual grounding</p></div></div>
        <div className="flex items-center gap-4"><Progress value={(completedLessons.length / lessons.length) * 100} className="flex-1 h-2" /><span className="text-sm text-muted-foreground">{completedLessons.length}/{lessons.length}</span></div>
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">{lessons.map((l, i) => <Button key={l.id} variant={currentLesson === i ? 'default' : 'outline'} size="sm" onClick={() => setCurrentLesson(i)}>{completedLessons.includes(i) && <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />}{i + 1}</Button>)}</div>
      <Card className="mb-6"><CardHeader><Badge variant="outline">Lesson {currentLesson + 1}</Badge><CardTitle className="text-2xl">{lessons[currentLesson].title}</CardTitle></CardHeader><CardContent><div className="prose prose-slate dark:prose-invert max-w-none">{lessons[currentLesson].content.split('\n').map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />)}</div></CardContent></Card>
      {currentLesson >= 1 && <div className="mb-6"><RealityIndexDemo /></div>}
      <div className="flex justify-between"><Button variant="outline" onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))} disabled={currentLesson === 0}><ArrowLeft className="h-4 w-4 mr-2" />Previous</Button>{currentLesson === lessons.length - 1 ? <Link href="/dashboard/learn"><Button className="bg-gradient-to-r from-cyan-500 to-teal-500"><CheckCircle2 className="h-4 w-4 mr-2" />Complete</Button></Link> : <Button onClick={handleNext}>Next<ArrowRight className="h-4 w-4 ml-2" /></Button>}</div>
    </div>
  );
}
