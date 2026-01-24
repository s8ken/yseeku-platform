'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Activity,
  LayoutDashboard,
  TrendingUp,
  Shield,
  Bell,
  Settings,
  Clock,
  Eye,
  Zap,
  BarChart3,
  PieChart,
  Users,
  MousePointer
} from 'lucide-react';
import { cn } from '@/lib/utils';

const lessons = [
  {
    id: 1,
    title: 'Dashboard Overview',
    content: `The SONATE dashboard is your command center for AI governance. At a glance, you can see:

**Key Metrics Panel** (Top)
- Overall Trust Score across all AI systems
- Active alerts requiring attention
- Total interactions monitored today

**Navigation Sidebar** (Left)
- Quick access to all platform features
- Organized by function: Monitor, Detect, Govern, Learn

**Main Content Area** (Center)
- Dynamic visualizations of your AI health
- Drill-down into specific metrics and events`
  },
  {
    id: 2,
    title: 'The Trust Score Widget',
    content: `The Trust Score is prominently displayed at the top of your dashboard.

**What the colors mean:**
- 🟢 **Green (90-100%)** - Excellent. AI is behaving as expected
- 🟡 **Amber (70-89%)** - Caution. Some metrics need attention
- 🔴 **Red (0-69%)** - Warning. Immediate review recommended

**Click the score** to see a breakdown by:
- Individual AI models
- Time periods (hourly, daily, weekly)
- Specific dimensions (Reality, Trust, Ethics, etc.)`
  },
  {
    id: 3,
    title: 'Activity Feed',
    content: `The Activity Feed shows real-time events from your AI systems.

**Event Types:**
- ✅ **Normal interactions** - Routine AI operations
- ⚠️ **Anomalies detected** - Unusual patterns flagged
- 🚨 **Trust violations** - Policy breaches requiring action
- 🔧 **System events** - Configuration changes, updates

**Filtering:**
Use the filter buttons to focus on specific event types or severity levels.

**Pro tip:** Click any event to see full details including the Trust Receipt.`
  },
  {
    id: 4,
    title: 'Charts & Visualizations',
    content: `SONATE provides several visualizations to help you understand trends:

**Trust Score Trend**
Line chart showing your trust score over time. Hover for exact values.

**Dimension Radar**
Spider chart showing scores across all 5 detection dimensions.

**Alert Distribution**
Pie chart breaking down alerts by type and severity.

**Model Comparison**
Bar chart comparing trust scores across different AI models.

All charts are interactive—click, hover, and zoom to explore.`
  },
  {
    id: 5,
    title: 'Quick Actions',
    content: `The Quick Actions panel gives you one-click access to common tasks:

**🔍 View Recent Receipts**
Jump to the last 10 Trust Receipts for inspection.

**⚡ Check Alerts**
See all pending alerts that need your attention.

**📊 Generate Report**
Create a compliance report for the selected time period.

**⚙️ Configure Thresholds**
Adjust sensitivity and alert settings.

These actions adapt based on your role and permissions.`
  },
  {
    id: 6,
    title: 'Customizing Your Dashboard',
    content: `Make the dashboard work for you:

**Rearrange Widgets**
Drag and drop widgets to reorder them based on your priorities.

**Add/Remove Widgets**
Click the ⚙️ icon to show/hide specific widgets.

**Time Range**
Use the date picker to view historical data.

**Dark Mode**
Toggle between light and dark themes in Settings.

**Keyboard Shortcuts**
Press \`?\` to see all available keyboard shortcuts.`
  }
];

function DashboardPreview({ activeSection }: { activeSection: string }) {
  const sections = {
    sidebar: activeSection === 'sidebar',
    header: activeSection === 'header',
    main: activeSection === 'main',
    widgets: activeSection === 'widgets'
  };

  return (
    <div className="border-2 rounded-xl overflow-hidden bg-background">
      {/* Header */}
      <div className={cn(
        'h-12 border-b flex items-center justify-between px-4 transition-colors',
        sections.header ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted/50'
      )}>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary/20" />
          <span className="text-sm font-semibold">SONATE</span>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <Settings className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      
      <div className="flex">
        {/* Sidebar */}
        <div className={cn(
          'w-16 border-r p-2 space-y-2 transition-colors',
          sections.sidebar ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted/30'
        )}>
          {[LayoutDashboard, Activity, Shield, Eye, Settings].map((Icon, i) => (
            <div key={i} className="h-10 w-full rounded-lg bg-muted/50 flex items-center justify-center">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
        
        {/* Main Content */}
        <div className={cn(
          'flex-1 p-4 space-y-3 transition-colors',
          sections.main ? 'bg-primary/10 ring-2 ring-primary' : ''
        )}>
          {/* Trust Score */}
          <div className={cn(
            'p-4 rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950',
            sections.widgets ? 'ring-2 ring-primary' : ''
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Trust Score</p>
                <p className="text-2xl font-bold text-green-600">94.2%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          {/* Metrics Row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Active Alerts', value: '3', icon: Bell },
              { label: 'Interactions', value: '1.2K', icon: Activity },
              { label: 'Models', value: '5', icon: Users }
            ].map((metric, i) => (
              <div key={i} className={cn(
                'p-3 rounded-lg border bg-card',
                sections.widgets ? 'ring-2 ring-primary' : ''
              )}>
                <metric.icon className="h-4 w-4 text-muted-foreground mb-1" />
                <p className="text-lg font-bold">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>
          
          {/* Chart Placeholder */}
          <div className={cn(
            'h-24 rounded-lg border bg-card flex items-center justify-center',
            sections.widgets ? 'ring-2 ring-primary' : ''
          )}>
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FirstDashboardPage() {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [highlightedSection, setHighlightedSection] = useState('');
  
  const lesson = lessons[currentLesson];
  const progress = (completedLessons.length / lessons.length) * 100;
  
  const handleNext = () => {
    if (!completedLessons.includes(currentLesson)) {
      setCompletedLessons([...completedLessons, currentLesson]);
    }
    if (currentLesson < lessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <Link href="/dashboard/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Learning Hub
        </Link>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Your First Dashboard</h1>
            <p className="text-muted-foreground">Interactive walkthrough of the main dashboard features</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground">{completedLessons.length}/{lessons.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {lessons.map((l, index) => (
              <Button
                key={l.id}
                variant={currentLesson === index ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentLesson(index)}
              >
                {completedLessons.includes(index) && <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />}
                {index + 1}
              </Button>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <Badge variant="outline">Lesson {currentLesson + 1}</Badge>
              <CardTitle>{lesson.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert">
                {lesson.content.split('\n').map((p, i) => (
                  <p key={i} dangerouslySetInnerHTML={{
                    __html: p
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/`(.*?)`/g, '<code>$1</code>')
                  }} />
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))} disabled={currentLesson === 0}>
              <ArrowLeft className="h-4 w-4 mr-2" />Previous
            </Button>
            {currentLesson === lessons.length - 1 ? (
              <Link href="/dashboard/learn">
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-500">
                  <CheckCircle2 className="h-4 w-4 mr-2" />Complete
                </Button>
              </Link>
            ) : (
              <Button onClick={handleNext}>Next<ArrowRight className="h-4 w-4 ml-2" /></Button>
            )}
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium mb-3 flex items-center gap-2">
            <MousePointer className="h-4 w-4" />
            Interactive Preview
          </p>
          <DashboardPreview activeSection={
            currentLesson === 0 ? 'main' :
            currentLesson === 1 ? 'widgets' :
            currentLesson === 2 ? 'main' :
            currentLesson === 3 ? 'widgets' :
            currentLesson === 4 ? 'sidebar' : ''
          } />
          
          <Card className="mt-4 bg-blue-50 dark:bg-blue-950 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">💡 Try it yourself</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                After completing this tutorial, head to your actual dashboard to explore these features firsthand.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
