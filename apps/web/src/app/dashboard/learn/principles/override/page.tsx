'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle2, Shield, Hand, AlertOctagon, UserCheck } from 'lucide-react';

const lessons = [
  { id: 1, title: 'What is Ethical Override?', content: `**Ethical Override** ensures humans always have the final say over AI decisions.

No matter how autonomous an AI system becomes, humans must be able to:
- Stop AI actions immediately
- Reverse AI decisions
- Modify AI behavior
- Shut down AI systems entirely

This is a non-negotiable safety principle.` },
  { id: 2, title: 'Override Triggers', content: `Overrides can be triggered by:

**Manual Override**
A human operator explicitly intervenes

**Automatic Override**
System detects a threshold breach and pauses automatically

**Emergency Stop**
Critical safety violation triggers immediate halt

**Scheduled Override**
Pre-planned human review points in workflows` },
  { id: 3, title: 'The Override Process', content: `When an override occurs:

1. **Halt** - AI action is paused immediately
2. **Preserve** - Current state is saved for review
3. **Notify** - Relevant stakeholders are alerted
4. **Review** - Human reviews the situation
5. **Decide** - Human chooses to resume, modify, or terminate
6. **Log** - Decision is recorded for audit` },
  { id: 4, title: 'Override Authority', content: `Different roles have different override powers:

**Viewer** - Can request override (not execute)
**Operator** - Can pause and resume specific systems
**Admin** - Full override authority on all systems
**Emergency** - Special key for critical situations

Configure roles in Settings → Access Control.` },
  { id: 5, title: 'Best Practices', content: `Override best practices:

✅ Test override procedures regularly
✅ Ensure multiple people have override access
✅ Document all override decisions
✅ Review override frequency (too many = system issues)
✅ Train team on when to use overrides

The goal isn't to override often—it's to know you can.` }
];

export default function OverridePage() {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const handleNext = () => { if (!completedLessons.includes(currentLesson)) setCompletedLessons([...completedLessons, currentLesson]); if (currentLesson < lessons.length - 1) setCurrentLesson(currentLesson + 1); };
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4 mr-1" />Back to Learning Hub</Link>
        <div className="flex items-center gap-3 mb-4"><div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white"><Shield className="h-6 w-6" /></div><div><h1 className="text-3xl font-bold">Ethical Override</h1><p className="text-muted-foreground">Keeping humans in control of AI decisions</p></div></div>
        <div className="flex items-center gap-4"><Progress value={(completedLessons.length / lessons.length) * 100} className="flex-1 h-2" /><span className="text-sm text-muted-foreground">{completedLessons.length}/{lessons.length}</span></div>
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">{lessons.map((l, i) => <Button key={l.id} variant={currentLesson === i ? 'default' : 'outline'} size="sm" onClick={() => setCurrentLesson(i)}>{completedLessons.includes(i) && <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />}{i + 1}</Button>)}</div>
      <Card className="mb-6"><CardHeader><Badge variant="outline">Lesson {currentLesson + 1}</Badge><CardTitle className="text-2xl">{lessons[currentLesson].title}</CardTitle></CardHeader><CardContent><div className="prose prose-slate dark:prose-invert max-w-none">{lessons[currentLesson].content.split('\n').map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />)}</div></CardContent></Card>
      <div className="flex justify-between"><Button variant="outline" onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))} disabled={currentLesson === 0}><ArrowLeft className="h-4 w-4 mr-2" />Previous</Button>{currentLesson === lessons.length - 1 ? <Link href="/dashboard/learn"><Button className="bg-gradient-to-r from-purple-500 to-pink-500"><CheckCircle2 className="h-4 w-4 mr-2" />Complete</Button></Link> : <Button onClick={handleNext}>Next<ArrowRight className="h-4 w-4 ml-2" /></Button>}</div>
    </div>
  );
}
