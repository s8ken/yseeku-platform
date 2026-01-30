'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle2, Zap, Power, Unplug, RefreshCw } from 'lucide-react';

const lessons = [
  { id: 1, title: 'The Right to Disconnect', content: `**Right to Disconnect** means users can disengage from AI at any time, for any reason, without penalty.

This principle recognizes that:
- AI should serve humans, not trap them
- Users may need breaks from AI interaction
- Dependency on AI should be a choice
- Alternatives should always exist` },
  { id: 2, title: 'What Disconnection Means', content: `Disconnection can happen at multiple levels:

**Pause** - Temporarily stop AI involvement
**Disable** - Turn off AI for a specific function
**Delete** - Remove your data from AI systems
**Opt-out** - Permanently exclude yourself from AI features

Each level is reversible except deletion.` },
  { id: 3, title: 'Graceful Degradation', content: `When AI is disconnected, systems should continue functioning:

**With AI**: Full-featured, personalized experience
**Without AI**: Basic functionality still works

Examples:
- Search still works (just less personalized)
- Forms still submit (just no auto-complete)
- Support still available (just human agents)

No AI lock-in.` },
  { id: 4, title: 'Implementing Disconnect', content: `SONATE helps you implement disconnect:

**Toggle Controls**
Users can enable/disable AI per feature

**Session Boundaries**
Clear start/end of AI-assisted sessions

**Data Portability**
Export your data before disconnecting

**Reconnection**
Easy path to re-enable if desired` },
  { id: 5, title: 'Respecting the Choice', content: `Key principles for disconnect:

✅ No guilt-tripping users who disconnect
✅ No hidden penalties for AI-free usage
✅ No dark patterns to prevent disconnection
✅ No data retention after deletion request
✅ No degraded service to punish disconnection

The choice must be genuine.` }
];

export default function DisconnectPage() {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const handleNext = () => { if (!completedLessons.includes(currentLesson)) setCompletedLessons([...completedLessons, currentLesson]); if (currentLesson < lessons.length - 1) setCurrentLesson(currentLesson + 1); };
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4 mr-1" />Back to Learning Hub</Link>
        <div className="flex items-center gap-3 mb-4"><div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white"><Zap className="h-6 w-6" /></div><div><h1 className="text-3xl font-bold">Right to Disconnect</h1><p className="text-muted-foreground">Your freedom to disengage from AI at any time</p></div></div>
        <div className="flex items-center gap-4"><Progress value={(completedLessons.length / lessons.length) * 100} className="flex-1 h-2" /><span className="text-sm text-muted-foreground">{completedLessons.length}/{lessons.length}</span></div>
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">{lessons.map((l, i) => <Button key={l.id} variant={currentLesson === i ? 'default' : 'outline'} size="sm" onClick={() => setCurrentLesson(i)}>{completedLessons.includes(i) && <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />}{i + 1}</Button>)}</div>
      <Card className="mb-6"><CardHeader><Badge variant="outline">Lesson {currentLesson + 1}</Badge><CardTitle className="text-2xl">{lessons[currentLesson].title}</CardTitle></CardHeader><CardContent><div className="prose prose-slate dark:prose-invert max-w-none">{lessons[currentLesson].content.split('\n').map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />)}</div></CardContent></Card>
      <div className="flex justify-between"><Button variant="outline" onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))} disabled={currentLesson === 0}><ArrowLeft className="h-4 w-4 mr-2" />Previous</Button>{currentLesson === lessons.length - 1 ? <Link href="/dashboard/learn"><Button className="bg-gradient-to-r from-purple-500 to-pink-500"><CheckCircle2 className="h-4 w-4 mr-2" />Complete</Button></Link> : <Button onClick={handleNext}>Next<ArrowRight className="h-4 w-4 ml-2" /></Button>}</div>
    </div>
  );
}
