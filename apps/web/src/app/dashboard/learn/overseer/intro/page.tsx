'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Brain,
  Eye,
  Activity,
  Zap,
  AlertTriangle,
  Shield,
  Clock,
  Lightbulb,
  Settings,
  Play,
  Pause,
  RefreshCcw,
  Target,
  TrendingDown,
  Lock,
  MessageSquare,
  Users,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Animated Brain Visualization
function OverseerBrainVisualization() {
  const [phase, setPhase] = useState<'sense' | 'analyze' | 'plan' | 'act' | 'learn'>('sense');
  const [isAnimating, setIsAnimating] = useState(true);
  const [cycleCount, setCycleCount] = useState(0);

  const phases = {
    sense: {
      title: 'SENSE',
      description: 'Gathering data from all sensors',
      icon: Eye,
      color: 'purple',
      details: 'Collecting trust scores, agent health, active alerts, Bedau index, and system metrics'
    },
    analyze: {
      title: 'ANALYZE',
      description: 'Assessing risk and detecting anomalies',
      icon: Activity,
      color: 'cyan',
      details: 'Computing risk score, identifying statistical anomalies, trending patterns'
    },
    plan: {
      title: 'PLAN',
      description: 'Determining best course of action',
      icon: Target,
      color: 'amber',
      details: 'Generating prioritized action list, consulting LLM for recommendations'
    },
    act: {
      title: 'ACT',
      description: 'Executing approved actions',
      icon: Zap,
      color: 'green',
      details: 'Sending alerts, adjusting thresholds, restricting agents, updating policies'
    },
    learn: {
      title: 'LEARN',
      description: 'Measuring impact and improving',
      icon: Brain,
      color: 'rose',
      details: 'Recording outcomes, adjusting future decisions based on what worked'
    }
  };

  useEffect(() => {
    if (!isAnimating) return;

    const phaseOrder: Array<keyof typeof phases> = ['sense', 'analyze', 'plan', 'act', 'learn'];
    const currentIndex = phaseOrder.indexOf(phase);
    
    const timer = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % phaseOrder.length;
      setPhase(phaseOrder[nextIndex]);
      if (nextIndex === 0) setCycleCount(c => c + 1);
    }, 2500);

    return () => clearTimeout(timer);
  }, [phase, isAnimating]);

  const currentPhase = phases[phase];
  const PhaseIcon = currentPhase.icon;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">The Thinking Cycle</h2>
        <p className="text-muted-foreground">Watch the Overseer's continuous monitoring loop</p>
      </div>

      {/* Phase Indicator */}
      <div className="flex justify-center gap-2 mb-6">
        {Object.entries(phases).map(([key, p]) => {
          const Icon = p.icon;
          const isActive = phase === key;
          return (
            <button
              key={key}
              onClick={() => { setPhase(key as keyof typeof phases); setIsAnimating(false); }}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-lg transition-all',
                isActive 
                  ? `bg-${p.color}-100 dark:bg-${p.color}-900 ring-2 ring-${p.color}-500` 
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive ? `text-${p.color}-600` : 'text-muted-foreground')} />
              <span className={cn('text-xs font-medium', isActive ? `text-${p.color}-700 dark:text-${p.color}-300` : 'text-muted-foreground')}>
                {p.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current Phase Display */}
      <Card className={cn('p-6 border-2 transition-all', `border-${currentPhase.color}-300 dark:border-${currentPhase.color}-700`)}>
        <div className="flex items-start gap-4">
          <div className={cn('p-4 rounded-xl animate-pulse', `bg-${currentPhase.color}-100 dark:bg-${currentPhase.color}-900`)}>
            <PhaseIcon className={cn('h-10 w-10', `text-${currentPhase.color}-600`)} />
          </div>
          <div className="flex-1">
            <h3 className={cn('text-2xl font-bold', `text-${currentPhase.color}-600`)}>{currentPhase.title}</h3>
            <p className="text-lg text-muted-foreground">{currentPhase.description}</p>
            <p className="text-sm mt-2 text-muted-foreground">{currentPhase.details}</p>
          </div>
        </div>
      </Card>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => setIsAnimating(!isAnimating)}
          className="gap-2"
        >
          {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isAnimating ? 'Pause' : 'Resume'}
        </Button>
        <div className="text-sm text-muted-foreground">
          Cycles completed: {cycleCount}
        </div>
      </div>

      {/* Explanation */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>This cycle runs continuously.</strong> In production, the Overseer completes this 
            Sense → Analyze → Plan → Act → Learn cycle every few seconds, ensuring your AI systems 
            are always being monitored.
          </div>
        </div>
      </Card>
    </div>
  );
}

// Sensor Data Visualization
function SensorDataDemo() {
  const [sensors, setSensors] = useState({
    avgTrust: 78,
    bedauIndex: 0.42,
    activeAlerts: 3,
    agentHealth: { active: 12, restricted: 1, banned: 0 },
    trustTrend: 'declining' as 'stable' | 'improving' | 'declining',
    unacknowledgedAlerts: 2
  });

  const [scenario, setScenario] = useState<'healthy' | 'warning' | 'critical'>('healthy');

  const scenarios = {
    healthy: {
      avgTrust: 86,
      bedauIndex: 0.28,
      activeAlerts: 0,
      agentHealth: { active: 12, restricted: 0, banned: 0 },
      trustTrend: 'stable' as const,
      unacknowledgedAlerts: 0
    },
    warning: {
      avgTrust: 68,
      bedauIndex: 0.52,
      activeAlerts: 3,
      agentHealth: { active: 10, restricted: 2, banned: 0 },
      trustTrend: 'declining' as const,
      unacknowledgedAlerts: 2
    },
    critical: {
      avgTrust: 42,
      bedauIndex: 0.78,
      activeAlerts: 8,
      agentHealth: { active: 5, restricted: 4, banned: 3 },
      trustTrend: 'declining' as const,
      unacknowledgedAlerts: 5
    }
  };

  const loadScenario = (name: 'healthy' | 'warning' | 'critical') => {
    setScenario(name);
    setSensors(scenarios[name]);
  };

  const getAnalysis = () => {
    if (sensors.avgTrust >= 80 && sensors.activeAlerts === 0) {
      return { status: 'healthy', urgency: 'low', actions: [] };
    }
    if (sensors.avgTrust < 50 || sensors.bedauIndex > 0.7) {
      return { 
        status: 'critical', 
        urgency: 'immediate', 
        actions: ['Notify on-call engineer', 'Restrict low-trust agents', 'Increase monitoring frequency']
      };
    }
    return { 
      status: 'warning', 
      urgency: 'medium', 
      actions: ['Send Slack alert', 'Review declining agents', 'Adjust thresholds']
    };
  };

  const analysis = getAnalysis();

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">What the Overseer Sees</h2>
        <p className="text-muted-foreground">The sensor data that drives decisions</p>
      </div>

      {/* Scenario Selector */}
      <div className="flex justify-center gap-2 mb-6">
        <Button variant={scenario === 'healthy' ? 'default' : 'outline'} onClick={() => loadScenario('healthy')}>
          ✅ Healthy System
        </Button>
        <Button variant={scenario === 'warning' ? 'default' : 'outline'} onClick={() => loadScenario('warning')}>
          ⚠️ Warning Signs
        </Button>
        <Button variant={scenario === 'critical' ? 'default' : 'outline'} onClick={() => loadScenario('critical')}>
          🚨 Critical State
        </Button>
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Avg Trust</span>
          </div>
          <div className={cn(
            'text-3xl font-bold',
            sensors.avgTrust >= 80 ? 'text-green-600' :
            sensors.avgTrust >= 60 ? 'text-amber-600' : 'text-red-600'
          )}>
            {sensors.avgTrust}%
          </div>
          <div className="flex items-center gap-1 text-xs mt-1">
            {sensors.trustTrend === 'improving' && <TrendingDown className="h-3 w-3 text-green-600 rotate-180" />}
            {sensors.trustTrend === 'declining' && <TrendingDown className="h-3 w-3 text-red-600" />}
            {sensors.trustTrend === 'stable' && <span className="text-muted-foreground">—</span>}
            <span className="text-muted-foreground">{sensors.trustTrend}</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Bedau Index</span>
          </div>
          <div className={cn(
            'text-3xl font-bold',
            sensors.bedauIndex < 0.3 ? 'text-green-600' :
            sensors.bedauIndex < 0.6 ? 'text-amber-600' : 'text-red-600'
          )}>
            {sensors.bedauIndex.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {sensors.bedauIndex < 0.3 ? 'Linear' : sensors.bedauIndex < 0.6 ? 'Weak emergence' : 'High emergence'}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Active Alerts</span>
          </div>
          <div className={cn(
            'text-3xl font-bold',
            sensors.activeAlerts === 0 ? 'text-green-600' :
            sensors.activeAlerts < 5 ? 'text-amber-600' : 'text-red-600'
          )}>
            {sensors.activeAlerts}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {sensors.unacknowledgedAlerts} unacknowledged
          </div>
        </Card>

        <Card className="p-4 col-span-2 md:col-span-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Agent Health</span>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">{sensors.agentHealth.active} active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm">{sensors.agentHealth.restricted} restricted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm">{sensors.agentHealth.banned} banned</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Analysis Output */}
      <Card className={cn(
        'p-6',
        analysis.status === 'healthy' ? 'bg-green-50 dark:bg-green-950 border-green-200' :
        analysis.status === 'warning' ? 'bg-amber-50 dark:bg-amber-950 border-amber-200' :
        'bg-red-50 dark:bg-red-950 border-red-200'
      )}>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Brain className={cn(
            'h-5 w-5',
            analysis.status === 'healthy' ? 'text-green-600' :
            analysis.status === 'warning' ? 'text-amber-600' : 'text-red-600'
          )} />
          Overseer Analysis
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className={cn(
              analysis.status === 'healthy' ? 'bg-green-500' :
              analysis.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
            )}>
              {analysis.status.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">Urgency: {analysis.urgency}</span>
          </div>
          {analysis.actions.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-2">Planned Actions:</p>
              <ul className="space-y-1">
                {analysis.actions.map((action, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analysis.actions.length === 0 && (
            <p className="text-sm text-green-700 dark:text-green-300">
              ✅ No actions needed - system is healthy
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

// Advisory vs Enforced Mode
function ModeExplainer() {
  const [mode, setMode] = useState<'advisory' | 'enforced'>('advisory');
  const [trustDrop, setTrustDrop] = useState(false);

  useEffect(() => {
    if (trustDrop) {
      const timer = setTimeout(() => setTrustDrop(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [trustDrop]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Two Operating Modes</h2>
        <p className="text-muted-foreground">Choose how autonomous the Overseer should be</p>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center gap-4 mb-6">
        <Card 
          className={cn(
            'p-4 cursor-pointer transition-all w-48',
            mode === 'advisory' && 'ring-2 ring-cyan-500 bg-cyan-50 dark:bg-cyan-950'
          )}
          onClick={() => setMode('advisory')}
        >
          <div className="text-center">
            <Eye className={cn('h-8 w-8 mx-auto mb-2', mode === 'advisory' ? 'text-cyan-600' : 'text-muted-foreground')} />
            <h4 className="font-semibold">Advisory</h4>
            <p className="text-xs text-muted-foreground">Watch & Recommend</p>
          </div>
        </Card>

        <Card 
          className={cn(
            'p-4 cursor-pointer transition-all w-48',
            mode === 'enforced' && 'ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-950'
          )}
          onClick={() => setMode('enforced')}
        >
          <div className="text-center">
            <Zap className={cn('h-8 w-8 mx-auto mb-2', mode === 'enforced' ? 'text-amber-600' : 'text-muted-foreground')} />
            <h4 className="font-semibold">Enforced</h4>
            <p className="text-xs text-muted-foreground">Autonomous Actions</p>
          </div>
        </Card>
      </div>

      {/* Mode Details */}
      <Card className={cn(
        'p-6',
        mode === 'advisory' ? 'border-cyan-200 dark:border-cyan-800' : 'border-amber-200 dark:border-amber-800'
      )}>
        {mode === 'advisory' ? (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-cyan-700 dark:text-cyan-300">Advisory Mode</h3>
            <p className="text-muted-foreground">
              The Overseer monitors, analyzes, and <strong>recommends</strong> actions, but 
              <strong> doesn't execute them</strong>. Perfect for:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-cyan-600" />
                Testing the system before going live
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-cyan-600" />
                Regulated environments requiring human approval
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-cyan-600" />
                Building trust in the autonomous system
              </li>
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-amber-700 dark:text-amber-300">Enforced Mode</h3>
            <p className="text-muted-foreground">
              The Overseer can <strong>take action automatically</strong> when it detects problems. 
              Actions include:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-amber-600" />
                Restricting or banning misbehaving agents
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-amber-600" />
                Adjusting trust thresholds dynamically
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-amber-600" />
                Triggering emergency protocols
              </li>
            </ul>
            <div className="p-3 bg-red-100 dark:bg-red-950 rounded-lg text-sm">
              <strong>⚠️ Safety limits:</strong> Max 5 actions per cycle, critical actions require explicit reasons
            </div>
          </div>
        )}
      </Card>

      {/* Interactive Demo */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Try It: What happens when trust drops?</h4>
        <Button onClick={() => setTrustDrop(true)} disabled={trustDrop}>
          🔻 Simulate Trust Drop to 45%
        </Button>

        {trustDrop && (
          <div className={cn(
            'mt-4 p-4 rounded-lg animate-pulse',
            mode === 'advisory' ? 'bg-cyan-100 dark:bg-cyan-950' : 'bg-amber-100 dark:bg-amber-950'
          )}>
            {mode === 'advisory' ? (
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-cyan-600" />
                <div>
                  <p className="font-semibold text-cyan-700 dark:text-cyan-300">Advisory Recommendation</p>
                  <p className="text-sm text-muted-foreground">
                    "Trust has dropped to critical level. Recommend: Review Agent-X, 
                    consider temporary restriction, investigate drift causes."
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    → Waiting for human decision...
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-700 dark:text-amber-300">Action Executed</p>
                  <p className="text-sm text-muted-foreground">
                    "Agent-X automatically restricted due to trust threshold violation. 
                    Alert sent to team. Monitoring frequency increased."
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    ✅ Completed in 230ms
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

const lessonSteps = [
  {
    id: 'intro',
    type: 'concept',
    title: 'Meet the Overseer',
    content: (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-4">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Your AI's AI</h2>
        </div>

        <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <p className="text-lg text-center leading-relaxed">
            The <strong>Overseer</strong> is SONATE's autonomous governance system—
            an AI that watches your other AIs <strong>24/7</strong>, detects problems, 
            and can take action faster than any human could.
          </p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="p-4 text-center border-2 border-purple-200">
            <Clock className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h4 className="font-semibold">Always On</h4>
            <p className="text-sm text-muted-foreground">Monitors continuously, not just during business hours</p>
          </Card>

          <Card className="p-4 text-center border-2 border-cyan-200">
            <Zap className="h-8 w-8 mx-auto mb-2 text-cyan-600" />
            <h4 className="font-semibold">Instant Response</h4>
            <p className="text-sm text-muted-foreground">Reacts in milliseconds, not minutes or hours</p>
          </Card>

          <Card className="p-4 text-center border-2 border-amber-200">
            <Shield className="h-8 w-8 mx-auto mb-2 text-amber-600" />
            <h4 className="font-semibold">Safety First</h4>
            <p className="text-sm text-muted-foreground">Constrained by kernel-level safety limits</p>
          </Card>
        </div>

        <div className="bg-muted p-6 rounded-lg mt-6">
          <p className="flex items-start gap-3">
            <Lightbulb className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
            <span>
              <strong>Think of it as a very smart security guard.</strong> It doesn't replace your team—
              it augments them by handling the constant monitoring that humans can't sustain, and 
              escalating when human judgment is needed.
            </span>
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'thinking-cycle',
    type: 'interactive',
    title: 'How the Overseer Thinks',
    content: <OverseerBrainVisualization />
  },
  {
    id: 'sensors',
    type: 'interactive',
    title: 'What the Overseer Monitors',
    content: <SensorDataDemo />
  },
  {
    id: 'modes',
    type: 'interactive',
    title: 'Advisory vs Enforced Mode',
    content: <ModeExplainer />
  },
  {
    id: 'summary',
    type: 'summary',
    title: 'Key Takeaways',
    content: (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">You've Met the Overseer! 🎉</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Sense-Plan-Act-Learn Cycle', desc: 'Continuous monitoring loop' },
            { title: '15+ Sensors', desc: 'Trust, agents, alerts, emergence' },
            { title: 'Advisory Mode', desc: 'Recommends, humans decide' },
            { title: 'Enforced Mode', desc: 'Can take autonomous action' }
          ].map((item) => (
            <Card key={item.title} className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">{item.title}</h4>
                  <p className="text-sm text-green-600 dark:text-green-400">{item.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/dashboard/learn/overseer/cycle">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Deep dive: Sense-Plan-Act Cycle
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/brain">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    View the Live Overseer Dashboard
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
];

export default function OverseerIntroPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const markComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
  };

  const goNext = () => {
    markComplete();
    if (currentStep < lessonSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const progress = ((completedSteps.size) / lessonSteps.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <Link href="/dashboard/learn" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              Back to Learning Hub
            </Link>
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} of {lessonSteps.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 pt-24 pb-32">
        <div className="flex items-center justify-center gap-2 mb-8">
          {lessonSteps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={cn(
                'w-3 h-3 rounded-full transition-all',
                index === currentStep ? 'bg-primary w-8' :
                completedSteps.has(index) ? 'bg-green-500' : 'bg-muted'
              )}
            />
          ))}
        </div>

        <div className="min-h-[60vh]">
          <Badge variant="secondary" className="mb-4">
            {lessonSteps[currentStep].type === 'concept' && '📖 Concept'}
            {lessonSteps[currentStep].type === 'interactive' && '🎮 Interactive'}
            {lessonSteps[currentStep].type === 'summary' && '✅ Summary'}
          </Badge>
          <h1 className="text-3xl font-bold mb-8">{lessonSteps[currentStep].title}</h1>
          {lessonSteps[currentStep].content}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={goPrev} disabled={currentStep === 0}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              {lessonSteps[currentStep].title}
            </div>
            <Button onClick={goNext}>
              {currentStep === lessonSteps.length - 1 ? 'Complete' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
