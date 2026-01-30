'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle2, Brain, Heart, Scale, Users } from 'lucide-react';

const lessons = [
  { id: 1, title: 'What is Moral Recognition?', content: `**Moral Recognition** is the principle that AI must acknowledge and defer to human moral agency.

AI systems should:
- Recognize that humans are the moral authorities
- Defer to human judgment on ethical matters
- Not claim moral authority for themselves
- Support human moral reasoning, not replace it` },
  { id: 2, title: 'AI is Not a Moral Agent', content: `Despite sophisticated outputs, AI systems:

❌ Do not have genuine moral understanding
❌ Cannot feel moral emotions (guilt, empathy)
❌ Do not bear moral responsibility
❌ Cannot make binding moral judgments

AI can *simulate* moral reasoning but doesn't *experience* it.` },
  { id: 3, title: 'Supporting Human Ethics', content: `AI can support moral decision-making by:

✅ Presenting relevant information
✅ Highlighting potential consequences
✅ Identifying stakeholders affected
✅ Surfacing ethical considerations
✅ Providing different perspectives

But the moral conclusion belongs to the human.` },
  { id: 4, title: 'Moral Recognition in Practice', content: `How SONATE enforces moral recognition:

**Disclosure**
AI outputs are labeled as AI-generated

**Deference**
AI suggests but doesn't decide on moral matters

**Escalation**
Moral dilemmas are escalated to humans

**Humility**
AI expresses uncertainty on ethical issues` },
  { id: 5, title: 'Edge Cases', content: `Moral recognition gets complex with:

**Time Pressure**
When humans can't review in time

**Scale**
When decisions affect millions

**Expertise**
When humans lack relevant knowledge

In these cases, SONATE helps by:
- Pre-configuring ethical guardrails
- Defaulting to safe choices
- Flagging for later review` }
];

export default function MoralPage() {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const handleNext = () => { if (!completedLessons.includes(currentLesson)) setCompletedLessons([...completedLessons, currentLesson]); if (currentLesson < lessons.length - 1) setCurrentLesson(currentLesson + 1); };
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4 mr-1" />Back to Learning Hub</Link>
        <div className="flex items-center gap-3 mb-4"><div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white"><Brain className="h-6 w-6" /></div><div><h1 className="text-3xl font-bold">Moral Recognition</h1><p className="text-muted-foreground">AI acknowledging human moral agency</p></div></div>
        <div className="flex items-center gap-4"><Progress value={(completedLessons.length / lessons.length) * 100} className="flex-1 h-2" /><span className="text-sm text-muted-foreground">{completedLessons.length}/{lessons.length}</span></div>
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">{lessons.map((l, i) => <Button key={l.id} variant={currentLesson === i ? 'default' : 'outline'} size="sm" onClick={() => setCurrentLesson(i)}>{completedLessons.includes(i) && <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />}{i + 1}</Button>)}</div>
      <Card className="mb-6"><CardHeader><Badge variant="outline">Lesson {currentLesson + 1}</Badge><CardTitle className="text-2xl">{lessons[currentLesson].title}</CardTitle></CardHeader><CardContent><div className="prose prose-slate dark:prose-invert max-w-none">{lessons[currentLesson].content.split('\n').map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />)}</div></CardContent></Card>
      <div className="flex justify-between"><Button variant="outline" onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))} disabled={currentLesson === 0}><ArrowLeft className="h-4 w-4 mr-2" />Previous</Button>{currentLesson === lessons.length - 1 ? <Link href="/dashboard/learn"><Button className="bg-gradient-to-r from-purple-500 to-pink-500"><CheckCircle2 className="h-4 w-4 mr-2" />Complete</Button></Link> : <Button onClick={handleNext}>Next<ArrowRight className="h-4 w-4 ml-2" /></Button>}</div>
    </div>
  );
}
