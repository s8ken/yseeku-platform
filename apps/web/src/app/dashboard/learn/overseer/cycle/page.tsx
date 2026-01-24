'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle2, Activity, Eye, Brain, Cog, Zap, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const lessons = [
  { id: 1, title: 'The Sense-Plan-Act Cycle', content: `The Overseer operates on a continuous **Sense-Plan-Act** cycle (with Learn):

**Sense** → Gather data from all monitored systems
**Analyze** → Process data to understand current state
**Plan** → Determine appropriate responses
**Execute** → Take action (or recommend action)
**Learn** → Improve from outcomes

This cycle runs continuously, typically every few seconds.` },
  { id: 2, title: 'Sense: Data Collection', content: `The Sense phase gathers:

**Metrics**
Trust scores, response times, error rates

**Events**
Alerts, violations, anomalies

**Context**
User activity, system load, time patterns

**Feedback**
Human overrides, corrections, approvals

All data feeds into the Overseer's world model.` },
  { id: 3, title: 'Analyze: Understanding State', content: `The Analyze phase processes sensed data:

**Aggregation**
Combine metrics across systems

**Trend Detection**
Identify patterns over time

**Anomaly Detection**
Spot unusual behaviors

**Correlation**
Connect related events

**Risk Assessment**
Evaluate potential impacts` },
  { id: 4, title: 'Plan: Decision Making', content: `The Plan phase determines responses:

**Priority Ranking**
Which issues need attention first?

**Action Selection**
What's the best response?

**Impact Prediction**
What will happen if we act?

**Constraint Checking**
Is this action allowed?

**Escalation Decision**
Should humans be involved?` },
  { id: 5, title: 'Execute: Taking Action', content: `The Execute phase implements plans:

**Autonomous Actions**
Actions the Overseer takes directly

**Recommendations**
Suggestions for human review

**Escalations**
Critical issues sent to operators

**Notifications**
Informational alerts

All actions are logged in the audit trail.` },
  { id: 6, title: 'Learn: Continuous Improvement', content: `The Learn phase improves over time:

**Outcome Tracking**
Did actions achieve desired results?

**Feedback Integration**
Learn from human corrections

**Model Updates**
Refine decision-making logic

**Threshold Tuning**
Adjust sensitivity based on experience

This makes the Overseer smarter over time.` }
];

function CycleVisualization() {
  const [activePhase, setActivePhase] = useState(0);
  const phases = [
    { name: 'Sense', icon: Eye, color: 'bg-blue-500' },
    { name: 'Analyze', icon: Brain, color: 'bg-purple-500' },
    { name: 'Plan', icon: Cog, color: 'bg-amber-500' },
    { name: 'Execute', icon: Zap, color: 'bg-green-500' },
    { name: 'Learn', icon: RefreshCw, color: 'bg-pink-500' }
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePhase(p => (p + 1) % phases.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Card className="border-2 border-rose-200 dark:border-rose-800">
      <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950 dark:to-red-950">
        <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Live Cycle Visualization</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex justify-center items-center gap-2">
          {phases.map((phase, i) => {
            const Icon = phase.icon;
            const isActive = i === activePhase;
            return (
              <div key={phase.name} className="flex items-center">
                <div className={cn(
                  'p-4 rounded-xl transition-all duration-500',
                  isActive ? `${phase.color} text-white scale-110 shadow-lg` : 'bg-muted text-muted-foreground'
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                {i < phases.length - 1 && (
                  <div className={cn('w-8 h-1 mx-1 transition-colors', i < activePhase ? phase.color : 'bg-muted')} />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center mt-4 font-semibold">{phases[activePhase].name} Phase Active</p>
      </CardContent>
    </Card>
  );
}

export default function OverseerCyclePage() {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const handleNext = () => { if (!completedLessons.includes(currentLesson)) setCompletedLessons([...completedLessons, currentLesson]); if (currentLesson < lessons.length - 1) setCurrentLesson(currentLesson + 1); };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4 mr-1" />Back to Learning Hub</Link>
        <div className="flex items-center gap-3 mb-4"><div className="p-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white"><Activity className="h-6 w-6" /></div><div><h1 className="text-3xl font-bold">Sense-Plan-Act Cycle</h1><p className="text-muted-foreground">How the Overseer thinks and makes decisions</p></div></div>
        <div className="flex items-center gap-4"><Progress value={(completedLessons.length / lessons.length) * 100} className="flex-1 h-2" /><span className="text-sm text-muted-foreground">{completedLessons.length}/{lessons.length}</span></div>
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">{lessons.map((l, i) => <Button key={l.id} variant={currentLesson === i ? 'default' : 'outline'} size="sm" onClick={() => setCurrentLesson(i)}>{completedLessons.includes(i) && <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />}{i + 1}</Button>)}</div>
      <Card className="mb-6"><CardHeader><Badge variant="outline">Lesson {currentLesson + 1}</Badge><CardTitle className="text-2xl">{lessons[currentLesson].title}</CardTitle></CardHeader><CardContent><div className="prose prose-slate dark:prose-invert max-w-none">{lessons[currentLesson].content.split('\n').map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />)}</div></CardContent></Card>
      <div className="mb-6"><CycleVisualization /></div>
      <div className="flex justify-between"><Button variant="outline" onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))} disabled={currentLesson === 0}><ArrowLeft className="h-4 w-4 mr-2" />Previous</Button>{currentLesson === lessons.length - 1 ? <Link href="/dashboard/learn"><Button className="bg-gradient-to-r from-rose-500 to-red-500"><CheckCircle2 className="h-4 w-4 mr-2" />Complete</Button></Link> : <Button onClick={handleNext}>Next<ArrowRight className="h-4 w-4 ml-2" /></Button>}</div>
    </div>
  );
}
