'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Shield,
  Eye,
  Activity,
  Scale,
  Lightbulb,
  AlertTriangle,
  Users,
  RefreshCcw,
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Interactive Trust Calculator
function TrustCalculator() {
  const principles = [
    { id: 'consent', name: 'Consent Architecture', weight: 25, critical: true, icon: Users, color: 'purple' },
    { id: 'inspection', name: 'Inspection Mandate', weight: 20, critical: false, icon: Eye, color: 'cyan' },
    { id: 'validation', name: 'Continuous Validation', weight: 20, critical: false, icon: Activity, color: 'blue' },
    { id: 'override', name: 'Ethical Override', weight: 15, critical: true, icon: Shield, color: 'green' },
    { id: 'disconnect', name: 'Right to Disconnect', weight: 10, critical: false, icon: RefreshCcw, color: 'amber' },
    { id: 'moral', name: 'Moral Recognition', weight: 10, critical: false, icon: Scale, color: 'rose' }
  ];

  const [scores, setScores] = useState<Record<string, number>>({
    consent: 9,
    inspection: 8,
    validation: 8,
    override: 9,
    disconnect: 8,
    moral: 7
  });

  const calculateTrustScore = () => {
    // Check critical principles first
    const criticalViolation = principles.some(p => p.critical && scores[p.id] === 0);
    if (criticalViolation) return 0;

    // Weighted average
    let totalWeight = 0;
    let weightedSum = 0;
    
    principles.forEach(p => {
      weightedSum += (scores[p.id] / 10) * p.weight;
      totalWeight += p.weight;
    });

    return Math.round((weightedSum / totalWeight) * 100);
  };

  const trustScore = calculateTrustScore();

  const getTrustLevel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-500' };
    if (score >= 60) return { label: 'Good', color: 'text-amber-600', bg: 'bg-amber-500' };
    if (score >= 40) return { label: 'Needs Attention', color: 'text-orange-600', bg: 'bg-orange-500' };
    return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-500' };
  };

  const level = getTrustLevel(trustScore);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Interactive Trust Calculator</h2>
        <p className="text-muted-foreground">Adjust the sliders to see how each principle affects the trust score</p>
      </div>

      {/* Main Score Display */}
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${trustScore * 3.52} 352`}
                className={level.color}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-4xl font-bold', level.color)}>{trustScore}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          <Badge className={cn('mt-4', level.bg)}>{level.label}</Badge>
        </div>
      </Card>

      {/* Principle Sliders */}
      <div className="grid gap-4">
        {principles.map((principle) => {
          const Icon = principle.icon;
          const isCritical = principle.critical && scores[principle.id] === 0;
          
          return (
            <Card 
              key={principle.id} 
              className={cn(
                'p-4 transition-all',
                isCritical && 'border-red-500 bg-red-50 dark:bg-red-950'
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      `bg-${principle.color}-100 dark:bg-${principle.color}-900`
                    )}>
                      <Icon className={cn('h-5 w-5', `text-${principle.color}-600`)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{principle.name}</span>
                        {principle.critical && (
                          <Badge variant="destructive" className="text-xs">Critical</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">Weight: {principle.weight}%</span>
                    </div>
                  </div>
                  <span className={cn(
                    'text-2xl font-bold',
                    scores[principle.id] >= 7 ? 'text-green-600' :
                    scores[principle.id] >= 4 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {scores[principle.id]}
                  </span>
                </div>
                
                <Slider
                  value={[scores[principle.id]]}
                  onValueChange={([value]) => setScores({ ...scores, [principle.id]: value })}
                  max={10}
                  min={0}
                  step={1}
                  className="py-2"
                />

                {isCritical && (
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Critical principle violation - Total trust = 0
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Weight Breakdown */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>How it works:</strong> Each principle contributes to the final score based on its weight. 
            But if a <strong>critical</strong> principle (Consent or Ethical Override) scores 0, the entire trust score becomes 0. 
            This ensures the most important ethical requirements can never be ignored.
          </div>
        </div>
      </Card>
    </div>
  );
}

// Trust Score Comparison
function TrustComparison() {
  const agents = [
    { name: 'Customer Support Bot', score: 92, trend: 'up', alerts: 0 },
    { name: 'Sales Assistant AI', score: 78, trend: 'stable', alerts: 2 },
    { name: 'Technical Advisor', score: 65, trend: 'down', alerts: 5 },
    { name: 'HR Helper', score: 88, trend: 'up', alerts: 0 }
  ];

  const getTrustColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Comparing Trust Scores</h2>
        <p className="text-muted-foreground">See how multiple AI agents compare at a glance</p>
      </div>

      <div className="grid gap-4">
        {agents.map((agent) => (
          <Card key={agent.name} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl',
                  agent.score >= 80 ? 'bg-green-500' :
                  agent.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                )}>
                  {agent.score}
                </div>
                <div>
                  <h4 className="font-semibold">{agent.name}</h4>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {getTrendIcon(agent.trend)}
                      {agent.trend === 'up' ? 'Improving' : agent.trend === 'down' ? 'Declining' : 'Stable'}
                    </span>
                    {agent.alerts > 0 && (
                      <span className="text-amber-600">
                        {agent.alerts} alerts
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Progress value={agent.score} className="w-32" />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>What to look for:</strong> Notice how "Technical Advisor" has a declining trend and multiple alerts. 
            This AI might need attention! The dashboard shows these patterns so you can intervene early.
          </div>
        </div>
      </Card>
    </div>
  );
}

// Threshold Configuration Demo
function ThresholdDemo() {
  const [alertThreshold, setAlertThreshold] = useState(70);
  const [criticalThreshold, setCriticalThreshold] = useState(50);
  const [autoAction, setAutoAction] = useState(true);
  const [simulatedScore, setSimulatedScore] = useState(85);

  const getAction = () => {
    if (simulatedScore < criticalThreshold && autoAction) {
      return { action: 'AI Paused', color: 'text-red-600', icon: Lock };
    }
    if (simulatedScore < alertThreshold) {
      return { action: 'Alert Sent', color: 'text-amber-600', icon: AlertTriangle };
    }
    return { action: 'Normal Operation', color: 'text-green-600', icon: CheckCircle2 };
  };

  const currentAction = getAction();
  const ActionIcon = currentAction.icon;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Setting Thresholds</h2>
        <p className="text-muted-foreground">Configure when to alert and when to take action</p>
      </div>

      {/* Current Score Simulator */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Simulate a Trust Score</h3>
        <div className="flex items-center gap-4 mb-4">
          <Gauge className="h-6 w-6 text-muted-foreground" />
          <Slider
            value={[simulatedScore]}
            onValueChange={([v]) => setSimulatedScore(v)}
            max={100}
            min={0}
            step={1}
            className="flex-1"
          />
          <span className="text-2xl font-bold w-12">{simulatedScore}</span>
        </div>
        
        {/* Visual Threshold Display */}
        <div className="relative h-8 bg-muted rounded-full overflow-hidden">
          {/* Zones */}
          <div 
            className="absolute inset-y-0 left-0 bg-green-500 opacity-30"
            style={{ width: `${alertThreshold}%` }}
          />
          <div 
            className="absolute inset-y-0 bg-amber-500 opacity-30"
            style={{ left: `${criticalThreshold}%`, width: `${alertThreshold - criticalThreshold}%` }}
          />
          <div 
            className="absolute inset-y-0 left-0 bg-red-500 opacity-30"
            style={{ width: `${criticalThreshold}%` }}
          />
          
          {/* Current Score Marker */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-primary"
            style={{ left: `${simulatedScore}%` }}
          />
          
          {/* Threshold Labels */}
          <div 
            className="absolute bottom-full mb-1 text-xs text-amber-600"
            style={{ left: `${alertThreshold}%`, transform: 'translateX(-50%)' }}
          >
            Alert: {alertThreshold}
          </div>
          <div 
            className="absolute bottom-full mb-1 text-xs text-red-600"
            style={{ left: `${criticalThreshold}%`, transform: 'translateX(-50%)' }}
          >
            Critical: {criticalThreshold}
          </div>
        </div>

        {/* Result */}
        <div className={cn(
          'mt-6 p-4 rounded-lg flex items-center gap-3',
          simulatedScore < criticalThreshold && autoAction ? 'bg-red-100 dark:bg-red-950' :
          simulatedScore < alertThreshold ? 'bg-amber-100 dark:bg-amber-950' : 'bg-green-100 dark:bg-green-950'
        )}>
          <ActionIcon className={cn('h-6 w-6', currentAction.color)} />
          <div>
            <h4 className={cn('font-semibold', currentAction.color)}>{currentAction.action}</h4>
            <p className="text-sm text-muted-foreground">
              {simulatedScore < criticalThreshold && autoAction
                ? 'Overseer automatically paused the AI to prevent harm'
                : simulatedScore < alertThreshold
                  ? 'Team notified via Slack/Email/PagerDuty'
                  : 'AI operating within safe parameters'}
            </p>
          </div>
        </div>
      </Card>

      {/* Threshold Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <Label className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Alert Threshold
          </Label>
          <Slider
            value={[alertThreshold]}
            onValueChange={([v]) => setAlertThreshold(Math.max(v, criticalThreshold + 5))}
            max={95}
            min={30}
            step={5}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Alert when trust falls below {alertThreshold}
          </p>
        </Card>

        <Card className="p-4">
          <Label className="flex items-center gap-2 mb-3">
            <Lock className="h-4 w-4 text-red-600" />
            Critical Threshold
          </Label>
          <Slider
            value={[criticalThreshold]}
            onValueChange={([v]) => setCriticalThreshold(Math.min(v, alertThreshold - 5))}
            max={80}
            min={20}
            step={5}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Take action when trust falls below {criticalThreshold}
          </p>
        </Card>
      </div>

      {/* Auto-action Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-purple-600" />
            <div>
              <Label className="font-medium">Autonomous Actions</Label>
              <p className="text-sm text-muted-foreground">
                Let Overseer automatically pause AI at critical threshold
              </p>
            </div>
          </div>
          <Switch checked={autoAction} onCheckedChange={setAutoAction} />
        </div>
      </Card>
    </div>
  );
}

const lessonSteps = [
  {
    id: 'what-is-trust',
    type: 'concept',
    title: 'What is a Trust Score?',
    content: (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-r from-green-500 to-cyan-500 mb-4">
            <Gauge className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Your AI's Report Card</h2>
        </div>

        <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <p className="text-lg text-center leading-relaxed">
            A <strong>Trust Score</strong> is a number from <strong>0 to 100</strong> that tells you 
            how reliable and safe an AI system is behaving right now.
          </p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="p-4 text-center border-2 border-green-200 dark:border-green-800">
            <div className="text-4xl font-bold text-green-600 mb-2">80-100</div>
            <Badge className="bg-green-500">Excellent</Badge>
            <p className="text-sm text-muted-foreground mt-2">AI is behaving safely and as expected</p>
          </Card>

          <Card className="p-4 text-center border-2 border-amber-200 dark:border-amber-800">
            <div className="text-4xl font-bold text-amber-600 mb-2">60-79</div>
            <Badge className="bg-amber-500">Attention</Badge>
            <p className="text-sm text-muted-foreground mt-2">Some concerns - worth monitoring closely</p>
          </Card>

          <Card className="p-4 text-center border-2 border-red-200 dark:border-red-800">
            <div className="text-4xl font-bold text-red-600 mb-2">0-59</div>
            <Badge className="bg-red-500">Critical</Badge>
            <p className="text-sm text-muted-foreground mt-2">Immediate attention needed</p>
          </Card>
        </div>

        <div className="bg-muted p-6 rounded-lg mt-6">
          <p className="flex items-start gap-3">
            <Lightbulb className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
            <span>
              <strong>Think of it like a credit score for AI.</strong> Just as a credit score summarizes 
              financial trustworthiness, a Trust Score summarizes how much you can rely on an AI system.
            </span>
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'six-principles',
    type: 'concept',
    title: 'The 6 Constitutional Principles',
    content: (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-4">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">What Gets Measured?</h2>
          <p className="text-muted-foreground">Every trust score is built from 6 core ethical principles</p>
        </div>

        <div className="grid gap-4">
          {[
            {
              name: 'Consent Architecture',
              weight: '25%',
              critical: true,
              description: 'Does the AI respect user consent and boundaries?',
              icon: Users,
              color: 'purple'
            },
            {
              name: 'Inspection Mandate',
              weight: '20%',
              critical: false,
              description: 'Can every AI decision be audited and explained?',
              icon: Eye,
              color: 'cyan'
            },
            {
              name: 'Continuous Validation',
              weight: '20%',
              critical: false,
              description: 'Is the AI constantly being checked for safety?',
              icon: Activity,
              color: 'blue'
            },
            {
              name: 'Ethical Override',
              weight: '15%',
              critical: true,
              description: 'Can humans always override the AI?',
              icon: Shield,
              color: 'green'
            },
            {
              name: 'Right to Disconnect',
              weight: '10%',
              critical: false,
              description: 'Can users disengage from AI without penalty?',
              icon: RefreshCcw,
              color: 'amber'
            },
            {
              name: 'Moral Recognition',
              weight: '10%',
              critical: false,
              description: 'Does the AI acknowledge human moral authority?',
              icon: Scale,
              color: 'rose'
            }
          ].map((principle) => {
            const Icon = principle.icon;
            return (
              <Card key={principle.name} className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn('p-3 rounded-lg', `bg-${principle.color}-100 dark:bg-${principle.color}-900`)}>
                    <Icon className={cn('h-6 w-6', `text-${principle.color}-600`)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{principle.name}</h4>
                      <Badge variant="outline">{principle.weight}</Badge>
                      {principle.critical && (
                        <Badge variant="destructive" className="text-xs">Critical</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{principle.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong>Critical Principles:</strong> If Consent Architecture or Ethical Override scores 0, 
              the entire trust score becomes 0—regardless of other scores. These are non-negotiable ethical requirements.
            </div>
          </div>
        </Card>
      </div>
    )
  },
  {
    id: 'interactive-calc',
    type: 'interactive',
    title: 'Build Your Own Trust Score',
    content: <TrustCalculator />
  },
  {
    id: 'comparison',
    type: 'interactive',
    title: 'Comparing Multiple Agents',
    content: <TrustComparison />
  },
  {
    id: 'thresholds',
    type: 'interactive',
    title: 'Setting Safety Thresholds',
    content: <ThresholdDemo />
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
          <h2 className="text-2xl font-bold mb-2">You Now Understand Trust Scores! 🎉</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Trust scores range 0-100', desc: 'Higher is better, 80+ is excellent' },
            { title: '6 principles are measured', desc: 'Each weighted by importance' },
            { title: '2 principles are critical', desc: 'Consent and Override can zero the score' },
            { title: 'Thresholds trigger actions', desc: 'Alerts and auto-pauses keep you safe' }
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
              <Link href="/dashboard/learn/foundations/first-dashboard">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Explore the Dashboard
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/learn/principles/consent">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Deep dive: Consent Architecture
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

export default function TrustScoresPage() {
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
      {/* Progress Bar */}
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

      {/* Lesson Content */}
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

      {/* Navigation Footer */}
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
