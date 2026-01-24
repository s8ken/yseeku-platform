'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle2, Zap, Bell, Mail, MessageSquare, Webhook, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const lessons = [
  { id: 1, title: 'Why Alerts Matter', content: `**Alerts** are your early warning system for AI issues.

Without alerts, problems go unnoticed until they cause real damage. With alerts, you can:
- Catch issues in real-time
- Respond before users are affected
- Maintain consistent AI quality
- Meet compliance requirements` },
  { id: 2, title: 'Alert Types', content: `SONATE provides several alert types:

**Threshold Alerts**
Triggered when a metric crosses a defined threshold

**Anomaly Alerts**
Triggered when behavior deviates from patterns

**Trend Alerts**
Triggered when metrics trend in concerning directions

**Scheduled Alerts**
Regular reports regardless of status` },
  { id: 3, title: 'Notification Channels', content: `Receive alerts through multiple channels:

📧 **Email** - Detailed reports for non-urgent issues
💬 **Slack/Teams** - Real-time notifications for teams
📱 **SMS** - Critical alerts that need immediate attention
🔗 **Webhooks** - Custom integrations with your systems
📊 **Dashboard** - Visual indicators in the UI

Configure channels in Settings → Notifications.` },
  { id: 4, title: 'Setting Up Alerts', content: `Creating an alert:

1. **Choose Metric** - What to monitor (Trust Score, Reality Index, etc.)
2. **Set Condition** - When to trigger (below 80%, drops 5%, etc.)
3. **Select Channels** - Where to notify (email, Slack, etc.)
4. **Add Recipients** - Who should know
5. **Set Severity** - Info, Warning, or Critical
6. **Enable** - Activate the alert` },
  { id: 5, title: 'Alert Best Practices', content: `Make alerts effective:

✅ Start with fewer alerts, add as needed
✅ Set appropriate thresholds (not too sensitive)
✅ Include context in alert messages
✅ Define clear response procedures
✅ Review and tune alerts regularly
✅ Avoid alert fatigue with proper severity levels

The goal is actionable alerts, not noise.` }
];

function AlertDemo() {
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'warning', message: 'Trust Score dropped below 85%', time: '2 min ago', channel: 'slack' },
    { id: 2, type: 'info', message: 'Daily summary: 1,234 interactions monitored', time: '1 hour ago', channel: 'email' },
    { id: 3, type: 'critical', message: 'Critical: Reality Index at 62%', time: '5 min ago', channel: 'sms' }
  ]);
  
  const icons = { slack: MessageSquare, email: Mail, sms: Bell, webhook: Webhook };
  const colors = { warning: 'border-amber-500 bg-amber-50 dark:bg-amber-950', info: 'border-blue-500 bg-blue-50 dark:bg-blue-950', critical: 'border-red-500 bg-red-50 dark:bg-red-950' };
  
  return (
    <Card className="border-2 border-cyan-200 dark:border-cyan-800">
      <CardHeader className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-950 dark:to-teal-950">
        <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {alerts.map(alert => {
          const Icon = icons[alert.channel as keyof typeof icons];
          return (
            <div key={alert.id} className={cn('p-3 rounded-lg border-l-4', colors[alert.type as keyof typeof colors])}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{alert.message}</span>
                </div>
                <Badge variant="outline" className="text-xs">{alert.type}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function AlertsPage() {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const handleNext = () => { if (!completedLessons.includes(currentLesson)) setCompletedLessons([...completedLessons, currentLesson]); if (currentLesson < lessons.length - 1) setCurrentLesson(currentLesson + 1); };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4 mr-1" />Back to Learning Hub</Link>
        <div className="flex items-center gap-3 mb-4"><div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white"><Zap className="h-6 w-6" /></div><div><h1 className="text-3xl font-bold">Setting Up Alerts</h1><p className="text-muted-foreground">Configure notifications for trust violations</p></div></div>
        <div className="flex items-center gap-4"><Progress value={(completedLessons.length / lessons.length) * 100} className="flex-1 h-2" /><span className="text-sm text-muted-foreground">{completedLessons.length}/{lessons.length}</span></div>
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">{lessons.map((l, i) => <Button key={l.id} variant={currentLesson === i ? 'default' : 'outline'} size="sm" onClick={() => setCurrentLesson(i)}>{completedLessons.includes(i) && <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />}{i + 1}</Button>)}</div>
      <Card className="mb-6"><CardHeader><Badge variant="outline">Lesson {currentLesson + 1}</Badge><CardTitle className="text-2xl">{lessons[currentLesson].title}</CardTitle></CardHeader><CardContent><div className="prose prose-slate dark:prose-invert max-w-none">{lessons[currentLesson].content.split('\n').map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />)}</div></CardContent></Card>
      {currentLesson >= 2 && <div className="mb-6"><AlertDemo /></div>}
      <div className="flex justify-between"><Button variant="outline" onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))} disabled={currentLesson === 0}><ArrowLeft className="h-4 w-4 mr-2" />Previous</Button>{currentLesson === lessons.length - 1 ? <Link href="/dashboard/learn"><Button className="bg-gradient-to-r from-cyan-500 to-teal-500"><CheckCircle2 className="h-4 w-4 mr-2" />Complete</Button></Link> : <Button onClick={handleNext}>Next<ArrowRight className="h-4 w-4 ml-2" /></Button>}</div>
    </div>
  );
}
