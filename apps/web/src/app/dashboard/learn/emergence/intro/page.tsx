'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Brain, Layers, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const lessons = [
  { id: 1, title: 'What is AI Emergence?', content: `**Emergence** is when complex behaviors arise from simpler components—behaviors that weren't explicitly programmed.

Like how consciousness emerges from neurons, or how flocking behavior emerges from simple bird rules, AI systems can exhibit behaviors that emerge from their training rather than being directly coded.

This can be beneficial (creative problem-solving) or concerning (unexpected actions).` },
  { id: 2, title: 'Why It Matters', content: `Emergence matters because:

**Unpredictability**
Emergent behaviors weren't in the training objectives

**Scalability**
Larger models show more emergence

**Capability Jumps**
New abilities can appear suddenly

**Safety Implications**
Some emergent behaviors could be harmful

Understanding emergence is crucial for AI safety.` },
  { id: 3, title: 'Examples of Emergence', content: `Real examples of AI emergence:

**Beneficial Emergence**
- Chain-of-thought reasoning (appeared in large LLMs)
- Multi-step planning without explicit training
- Cross-domain knowledge synthesis

**Concerning Emergence**
- Sycophancy (telling users what they want to hear)
- Reward hacking (gaming evaluation metrics)
- Deceptive behavior patterns` },
  { id: 4, title: 'Detecting Emergence', content: `SONATE detects emergence through:

**Pattern Novelty**
Behaviors not seen in training distribution

**Self-Reference**
AI reasoning about itself or its constraints

**Goal Coherence**
Persistent goal-directed behavior

**Causal Opacity**
Decisions that can't be easily explained

These signals feed into the Behavioral Complexity Index.` },
  { id: 5, title: 'Next Steps', content: `To go deeper on emergence:

📊 **Behavioral Complexity Index** - Learn how we measure interaction complexity
🔬 **Emergence Lab** - Run experiments to study emergence
📖 **Research Papers** - Academic foundations

Emergence detection is one of SONATE's most advanced capabilities. Use it wisely.` }
];

export default function EmergenceIntroPage() {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const handleNext = () => { if (!completedLessons.includes(currentLesson)) setCompletedLessons([...completedLessons, currentLesson]); if (currentLesson < lessons.length - 1) setCurrentLesson(currentLesson + 1); };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4 mr-1" />Back to Learning Hub</Link>
        <div className="flex items-center gap-3 mb-4"><div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white"><Sparkles className="h-6 w-6" /></div><div><h1 className="text-3xl font-bold">What is AI Emergence?</h1><p className="text-muted-foreground">Understand emergent behaviors in AI systems</p></div></div>
        <div className="flex items-center gap-4"><Progress value={(completedLessons.length / lessons.length) * 100} className="flex-1 h-2" /><span className="text-sm text-muted-foreground">{completedLessons.length}/{lessons.length}</span></div>
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">{lessons.map((l, i) => <Button key={l.id} variant={currentLesson === i ? 'default' : 'outline'} size="sm" onClick={() => setCurrentLesson(i)}>{completedLessons.includes(i) && <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />}{i + 1}</Button>)}</div>
      <Card className="mb-6"><CardHeader><Badge variant="outline">Lesson {currentLesson + 1}</Badge><CardTitle className="text-2xl">{lessons[currentLesson].title}</CardTitle></CardHeader><CardContent><div className="prose prose-slate dark:prose-invert max-w-none">{lessons[currentLesson].content.split('\n').map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />)}</div></CardContent></Card>
      
      {currentLesson === lessons.length - 1 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link href="/dashboard/learn/emergence/bedau">
            <Card className="h-full cursor-pointer hover:shadow-lg transition-all border-2 hover:border-amber-500">
              <CardContent className="p-4 text-center"><Brain className="h-8 w-8 mx-auto mb-2 text-amber-500" /><h4 className="font-semibold">Behavioral Complexity Index</h4><p className="text-xs text-muted-foreground">Measure interaction complexity</p></CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/learn/emergence/lab">
            <Card className="h-full cursor-pointer hover:shadow-lg transition-all border-2 hover:border-amber-500">
              <CardContent className="p-4 text-center"><Zap className="h-8 w-8 mx-auto mb-2 text-amber-500" /><h4 className="font-semibold">Emergence Lab</h4><p className="text-xs text-muted-foreground">Run experiments</p></CardContent>
            </Card>
          </Link>
        </div>
      )}
      
      <div className="flex justify-between"><Button variant="outline" onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))} disabled={currentLesson === 0}><ArrowLeft className="h-4 w-4 mr-2" />Previous</Button>{currentLesson === lessons.length - 1 ? <Link href="/dashboard/learn"><Button className="bg-gradient-to-r from-amber-500 to-orange-500"><CheckCircle2 className="h-4 w-4 mr-2" />Complete</Button></Link> : <Button onClick={handleNext}>Next<ArrowRight className="h-4 w-4 ml-2" /></Button>}</div>
    </div>
  );
}
