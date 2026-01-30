'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, Search, FileText, Layers } from 'lucide-react';

const lessons = [
  { id: 1, title: 'The Inspection Mandate', content: `**Inspection Mandate** means every AI decision must be explainable and auditable.

No black boxes. No hidden reasoning. Every output should be traceable back to its inputs and the logic that produced it.

This principle ensures:
- Decisions can be reviewed and challenged
- Errors can be identified and corrected
- Trust is built through transparency` },
  { id: 2, title: 'What Can Be Inspected?', content: `In SONATE, you can inspect:

**Inputs** - What data went into the AI decision
**Processing** - How the AI reasoned about the input
**Outputs** - What the AI produced
**Context** - Environmental factors that influenced the result
**Confidence** - How certain the AI was about its output

All of this is captured in Trust Receipts.` },
  { id: 3, title: 'Audit Trails', content: `Every AI interaction creates an audit trail:

**Timestamp** - When it happened
**Actor** - Which AI model was involved
**Action** - What was requested/produced
**Evidence** - Trust Receipt with full details
**Reviewer** - Who (if anyone) reviewed it

Audit trails are immutable—they cannot be altered after creation.` },
  { id: 4, title: 'Explainability Levels', content: `SONATE provides multiple explainability levels:

**Level 1: Summary**
Plain English explanation of what happened

**Level 2: Detailed**
Step-by-step reasoning with confidence scores

**Level 3: Technical**
Full model outputs, embeddings, and decision paths

**Level 4: Raw**
Complete data dump for forensic analysis` },
  { id: 5, title: 'Using Inspection Tools', content: `SONATE provides tools for inspection:

**Receipt Viewer** - Explore any Trust Receipt in detail
**Timeline** - See chronological history of AI actions
**Compare** - Diff two interactions to spot differences
**Search** - Find specific patterns across all interactions
**Export** - Download data for external analysis

Access these from the Receipts section in your dashboard.` }
];

export default function InspectionPage() {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const lesson = lessons[currentLesson];
  const handleNext = () => {
    if (!completedLessons.includes(currentLesson)) setCompletedLessons([...completedLessons, currentLesson]);
    if (currentLesson < lessons.length - 1) setCurrentLesson(currentLesson + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />Back to Learning Hub
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white"><Eye className="h-6 w-6" /></div>
          <div>
            <h1 className="text-3xl font-bold">Inspection Mandate</h1>
            <p className="text-muted-foreground">Making AI decisions transparent and auditable</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Progress value={(completedLessons.length / lessons.length) * 100} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground">{completedLessons.length}/{lessons.length}</span>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {lessons.map((l, i) => (
          <Button key={l.id} variant={currentLesson === i ? 'default' : 'outline'} size="sm" onClick={() => setCurrentLesson(i)}>
            {completedLessons.includes(i) && <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />}{i + 1}
          </Button>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader><Badge variant="outline">Lesson {currentLesson + 1}</Badge><CardTitle className="text-2xl">{lesson.title}</CardTitle></CardHeader>
        <CardContent>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {lesson.content.split('\n').map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />)}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))} disabled={currentLesson === 0}><ArrowLeft className="h-4 w-4 mr-2" />Previous</Button>
        {currentLesson === lessons.length - 1 ? (
          <Link href="/dashboard/learn"><Button className="bg-gradient-to-r from-purple-500 to-pink-500"><CheckCircle2 className="h-4 w-4 mr-2" />Complete</Button></Link>
        ) : <Button onClick={handleNext}>Next<ArrowRight className="h-4 w-4 ml-2" /></Button>}
      </div>
    </div>
  );
}
