'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ArrowRight, CheckCircle2, Target, Settings, Shield, Bell, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const lessons = [
  { id: 1, title: 'Configuring the Overseer', content: `The Overseer is highly configurable to match your organization's needs:

**Sensitivity** - How aggressively to flag issues
**Autonomy** - How much to act without human approval
**Scope** - Which systems to monitor
**Thresholds** - When to trigger actions
**Actions** - What the Overseer can do

Let's explore each setting.` },
  { id: 2, title: 'Sensitivity Settings', content: `Control how sensitive the Overseer is:

**High Sensitivity**
Catches more issues, more false positives
Best for: Regulated industries, high-risk applications

**Medium Sensitivity (Default)**
Balanced detection and noise
Best for: Most use cases

**Low Sensitivity**
Fewer alerts, may miss subtle issues
Best for: Stable, well-tested systems` },
  { id: 3, title: 'Autonomy Levels', content: `Control Overseer autonomy:

**Monitor Only**
Observe and report, never act

**Recommend**
Suggest actions for human approval

**Auto-Act (Low Risk)**
Automatically handle minor issues

**Auto-Act (All)**
Handle all issues autonomously

Start conservative and increase as you build trust.` },
  { id: 4, title: 'Threshold Configuration', content: `Set thresholds for key metrics:

**Trust Score Minimum**
Alert when score drops below (default: 80%)

**Reality Index Minimum**
Flag accuracy issues below (default: 85%)

**Bedau Index Maximum**
Alert on emergence above (default: 0.5)

**Response Time Maximum**
Flag slow responses above (default: 2s)

Thresholds can be global or per-model.` },
  { id: 5, title: 'Action Configuration', content: `Configure what the Overseer can do:

**Pause Model** - Temporarily stop a misbehaving model
**Rate Limit** - Reduce throughput during issues
**Fallback** - Switch to backup model
**Alert** - Notify operators
**Log** - Record for later review

Enable only the actions you're comfortable with.` },
  { id: 6, title: 'Testing Configuration', content: `Before going live:

✅ Use test mode to simulate alerts
✅ Run chaos tests to verify responses
✅ Review action logs for appropriateness
✅ Get sign-off from stakeholders
✅ Start in Monitor Only, then increase autonomy
✅ Keep emergency override procedures ready

Configuration is in Settings → Overseer.` }
];

function ConfigDemo() {
  const [trustThreshold, setTrustThreshold] = useState(80);
  const [autonomy, setAutonomy] = useState('recommend');
  const [autoAlert, setAutoAlert] = useState(true);
  const [autoPause, setAutoPause] = useState(false);
  
  return (
    <Card className="border-2 border-rose-200 dark:border-rose-800">
      <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950 dark:to-red-950">
        <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Configuration Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><span>Trust Score Threshold</span><span className="font-bold">{trustThreshold}%</span></div>
          <Slider value={[trustThreshold]} onValueChange={([v]) => setTrustThreshold(v)} min={50} max={95} step={5} />
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Autonomy Level</p>
          <div className="grid grid-cols-2 gap-2">
            {['monitor', 'recommend', 'auto-low', 'auto-all'].map(level => (
              <Button key={level} variant={autonomy === level ? 'default' : 'outline'} size="sm" onClick={() => setAutonomy(level)} className="text-xs">
                {level === 'monitor' ? 'Monitor Only' : level === 'recommend' ? 'Recommend' : level === 'auto-low' ? 'Auto (Low Risk)' : 'Auto (All)'}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm font-medium">Enabled Actions</p>
          <div className="flex items-center justify-between"><span className="text-sm">Auto-Alert on Violation</span><Switch checked={autoAlert} onCheckedChange={setAutoAlert} /></div>
          <div className="flex items-center justify-between"><span className="text-sm">Auto-Pause on Critical</span><Switch checked={autoPause} onCheckedChange={setAutoPause} /></div>
        </div>
        
        <div className="p-3 bg-muted rounded-lg text-sm">
          <p className="font-medium mb-1">Current Config Summary:</p>
          <p className="text-muted-foreground">Alert when Trust Score &lt; {trustThreshold}% • {autonomy === 'monitor' ? 'Monitor only' : autonomy === 'recommend' ? 'Recommend actions' : 'Auto-act'} • {autoAlert ? 'Auto-alerts enabled' : 'Manual alerts'}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverseerConfigPage() {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const handleNext = () => { if (!completedLessons.includes(currentLesson)) setCompletedLessons([...completedLessons, currentLesson]); if (currentLesson < lessons.length - 1) setCurrentLesson(currentLesson + 1); };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4 mr-1" />Back to Learning Hub</Link>
        <div className="flex items-center gap-3 mb-4"><div className="p-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white"><Target className="h-6 w-6" /></div><div><h1 className="text-3xl font-bold">Configuring the Overseer</h1><p className="text-muted-foreground">Set up autonomous actions and safety limits</p></div></div>
        <div className="flex items-center gap-4"><Progress value={(completedLessons.length / lessons.length) * 100} className="flex-1 h-2" /><span className="text-sm text-muted-foreground">{completedLessons.length}/{lessons.length}</span></div>
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">{lessons.map((l, i) => <Button key={l.id} variant={currentLesson === i ? 'default' : 'outline'} size="sm" onClick={() => setCurrentLesson(i)}>{completedLessons.includes(i) && <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />}{i + 1}</Button>)}</div>
      <Card className="mb-6"><CardHeader><Badge variant="outline">Lesson {currentLesson + 1}</Badge><CardTitle className="text-2xl">{lessons[currentLesson].title}</CardTitle></CardHeader><CardContent><div className="prose prose-slate dark:prose-invert max-w-none">{lessons[currentLesson].content.split('\n').map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />)}</div></CardContent></Card>
      {currentLesson >= 3 && <div className="mb-6"><ConfigDemo /></div>}
      <div className="flex justify-between"><Button variant="outline" onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))} disabled={currentLesson === 0}><ArrowLeft className="h-4 w-4 mr-2" />Previous</Button>{currentLesson === lessons.length - 1 ? <Link href="/dashboard/learn"><Button className="bg-gradient-to-r from-rose-500 to-red-500"><CheckCircle2 className="h-4 w-4 mr-2" />Complete</Button></Link> : <Button onClick={handleNext}>Next<ArrowRight className="h-4 w-4 ml-2" /></Button>}</div>
    </div>
  );
}
