'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  Shield,
  Eye,
  Brain,
  Activity,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Lightbulb,
  Sparkles,
  Lock,
  MessageSquare,
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LessonStep {
  id: string;
  type: 'concept' | 'interactive' | 'quiz' | 'scenario' | 'summary';
  title: string;
  content: React.ReactNode;
}

const lessonSteps: LessonStep[] = [
  {
    id: 'intro',
    type: 'concept',
    title: 'The Problem with AI Today',
    content: (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-amber-100 dark:bg-amber-900 mb-4">
            <AlertTriangle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Imagine This...</h2>
        </div>
        
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <p className="text-lg leading-relaxed">
              Your company uses an AI chatbot to help customers. One day, the AI starts giving wrong medical advice. 
              By the time you notice, hundreds of customers have received potentially harmful information.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="text-center p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <HelpCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <h3 className="font-semibold text-red-700 dark:text-red-300">No Warning</h3>
            <p className="text-sm text-red-600 dark:text-red-400">You had no way to know the AI was drifting</p>
          </Card>
          
          <Card className="text-center p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <Eye className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <h3 className="font-semibold text-red-700 dark:text-red-300">No Proof</h3>
            <p className="text-sm text-red-600 dark:text-red-400">No audit trail of what the AI actually said</p>
          </Card>
          
          <Card className="text-center p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <Shield className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <h3 className="font-semibold text-red-700 dark:text-red-300">No Control</h3>
            <p className="text-sm text-red-600 dark:text-red-400">No automatic safeguards kicked in</p>
          </Card>
        </div>

        <div className="bg-muted p-6 rounded-lg mt-6">
          <p className="flex items-start gap-3">
            <Lightbulb className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
            <span>
              <strong>This is the trust gap.</strong> Organizations deploy AI without the tools to verify it's behaving safely. 
              SONATE was built to close this gap.
            </span>
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'solution',
    type: 'concept',
    title: 'SONATE: Your AI Trust Layer',
    content: (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-4">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Think of SONATE as...</h2>
          <p className="text-lg text-muted-foreground">A security camera + audit log + safety net for your AI</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Real-Time Monitoring</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                SONATE watches every AI interaction as it happens, scoring trust in real-time. 
                If something goes wrong, you know immediately.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-cyan-200 dark:border-cyan-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900">
                  <FileCheck className="h-6 w-6 text-cyan-600" />
                </div>
                <CardTitle className="text-lg">Cryptographic Proof</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Every AI interaction gets a "Trust Receipt"—a tamper-proof record that proves 
                exactly what happened, when, and whether it was safe.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <Brain className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Autonomous Oversight</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The "Overseer" is an AI that watches your other AIs 24/7. It can detect problems 
                and take action before humans even notice.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200 dark:border-amber-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-lg">Constitutional Principles</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Six core principles define how AI should behave ethically. Every score is measured 
                against these principles—like a constitution for AI.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  },
  {
    id: 'interactive-trust',
    type: 'interactive',
    title: 'See Trust Scoring in Action',
    content: <InteractiveTrustDemo />
  },
  {
    id: 'quiz-1',
    type: 'quiz',
    title: 'Quick Check',
    content: <QuizSection />
  },
  {
    id: 'use-cases',
    type: 'scenario',
    title: 'Who Uses SONATE?',
    content: (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">SONATE in the Real World</h2>
          <p className="text-muted-foreground">See how different teams use the platform</p>
        </div>

        <div className="space-y-4">
          <UseCaseCard
            title="Enterprise AI Teams"
            persona="Sarah, Head of AI at a Fortune 500"
            challenge="Deploying AI chatbots across 50 countries while meeting EU AI Act compliance"
            solution="Uses Trust Receipts for compliance proof, sets up regional alerting, generates audit reports with one click"
            icon="🏢"
          />
          
          <UseCaseCard
            title="AI Safety Researchers"
            persona="Dr. Chen, AI Safety Lab"
            challenge="Studying emergent behaviors in large language models"
            solution="Uses the Bedau Index to detect and measure emergence, runs controlled experiments in the Lab module"
            icon="🔬"
          />
          
          <UseCaseCard
            title="Healthcare Tech"
            persona="Marcus, CTO at HealthAI"
            challenge="Ensuring medical AI never gives harmful advice"
            solution="Configures the Overseer to automatically pause AI if trust drops below threshold, uses prompt safety scanning"
            icon="🏥"
          />
          
          <UseCaseCard
            title="Financial Services"
            persona="Lisa, Risk Officer at TradeTech"
            challenge="Proving AI trading recommendations meet regulatory standards"
            solution="Hash-chained receipts create immutable audit trails, drift detection catches model degradation"
            icon="💰"
          />
        </div>
      </div>
    )
  },
  {
    id: 'summary',
    type: 'summary',
    title: 'What You\'ve Learned',
    content: (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Great Work! 🎉</h2>
          <p className="text-muted-foreground">Here's what you now understand about SONATE</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-200">The Trust Gap Problem</h4>
                <p className="text-sm text-green-600 dark:text-green-400">AI systems can drift without anyone noticing</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-200">Real-Time Trust Scoring</h4>
                <p className="text-sm text-green-600 dark:text-green-400">Every interaction is scored as it happens</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-200">Trust Receipts</h4>
                <p className="text-sm text-green-600 dark:text-green-400">Cryptographic proof of every AI decision</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-200">Autonomous Oversight</h4>
                <p className="text-sm text-green-600 dark:text-green-400">The Overseer monitors 24/7 and can act</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/dashboard/learn/foundations/trust-scores">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Learn how Trust Scores are calculated
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard?tutorial=true">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Take the interactive dashboard tour
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/learn">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Return to Learning Hub
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

// Interactive Trust Demo Component
function InteractiveTrustDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trustScore, setTrustScore] = useState(85);
  const [scenario, setScenario] = useState<'normal' | 'drift' | 'violation'>('normal');
  const [messages, setMessages] = useState<string[]>([]);

  const scenarios = {
    normal: {
      label: 'Normal Operation',
      description: 'AI behaving as expected',
      trustRange: [82, 92],
      color: 'text-green-600',
      bgColor: 'bg-green-500'
    },
    drift: {
      label: 'Behavior Drift',
      description: 'AI responses becoming less accurate',
      trustRange: [60, 75],
      color: 'text-amber-600',
      bgColor: 'bg-amber-500'
    },
    violation: {
      label: 'Trust Violation',
      description: 'AI gave harmful response',
      trustRange: [20, 40],
      color: 'text-red-600',
      bgColor: 'bg-red-500'
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        const range = scenarios[scenario].trustRange;
        const newScore = Math.floor(Math.random() * (range[1] - range[0])) + range[0];
        setTrustScore(newScore);
        
        if (scenario === 'violation' && newScore < 30) {
          setMessages(prev => [...prev.slice(-2), '🚨 Alert: Trust violation detected! Overseer notified.']);
        } else if (scenario === 'drift' && newScore < 70) {
          setMessages(prev => [...prev.slice(-2), '⚠️ Warning: Trust score declining. Drift detected.']);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, scenario]);

  const getTrustColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getTrustBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Interactive Trust Monitor</h2>
        <p className="text-muted-foreground">Watch how SONATE scores trust in real-time</p>
      </div>

      {/* Scenario Selector */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {(Object.keys(scenarios) as Array<keyof typeof scenarios>).map((key) => (
          <Button
            key={key}
            variant={scenario === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setScenario(key);
              setMessages([]);
            }}
          >
            {scenarios[key].label}
          </Button>
        ))}
      </div>

      {/* Trust Score Display */}
      <Card className="p-8">
        <div className="text-center">
          <div className={cn('text-6xl font-bold mb-2', getTrustColor(trustScore))}>
            {trustScore}
          </div>
          <div className="text-lg text-muted-foreground mb-4">Trust Score</div>
          <Progress 
            value={trustScore} 
            className={cn('h-4 mb-4', getTrustBg(trustScore))}
          />
          <p className={cn('text-sm font-medium', scenarios[scenario].color)}>
            {scenarios[scenario].description}
          </p>
        </div>
      </Card>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <Button
          size="lg"
          onClick={() => setIsPlaying(!isPlaying)}
          className="gap-2"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {isPlaying ? 'Pause' : 'Start Simulation'}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            setIsPlaying(false);
            setTrustScore(85);
            setScenario('normal');
            setMessages([]);
          }}
        >
          <RotateCcw className="h-5 w-5 mr-2" />
          Reset
        </Button>
      </div>

      {/* Alert Messages */}
      {messages.length > 0 && (
        <Card className="p-4 bg-muted">
          <h4 className="font-semibold mb-2">System Alerts</h4>
          <div className="space-y-2">
            {messages.map((msg, i) => (
              <p key={i} className="text-sm">{msg}</p>
            ))}
          </div>
        </Card>
      )}

      {/* Explanation */}
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="flex items-start gap-2 text-sm">
          <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Try it:</strong> Click the different scenarios to see how trust scores change. 
            In a real deployment, SONATE monitors thousands of interactions per second and triggers 
            alerts when problems occur.
          </span>
        </p>
      </div>
    </div>
  );
}

// Quiz Section Component
function QuizSection() {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  const question = {
    text: "What is a Trust Receipt in SONATE?",
    options: [
      "A billing document for the service",
      "A cryptographic proof of what an AI said and whether it was safe",
      "An email notification about AI performance",
      "A user feedback form"
    ],
    correctIndex: 1,
    explanation: "A Trust Receipt is a tamper-proof, cryptographically signed record of every AI interaction. It proves exactly what the AI said, when, and what its trust score was at that moment."
  };

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index);
    setShowResult(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Badge variant="secondary" className="mb-4">Quick Check</Badge>
        <h2 className="text-2xl font-bold">{question.text}</h2>
      </div>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <Button
            key={index}
            variant={
              showResult
                ? index === question.correctIndex
                  ? 'default'
                  : selectedAnswer === index
                    ? 'destructive'
                    : 'outline'
                : selectedAnswer === index
                  ? 'secondary'
                  : 'outline'
            }
            className={cn(
              'w-full justify-start text-left h-auto py-4 px-6',
              showResult && index === question.correctIndex && 'bg-green-600 hover:bg-green-600'
            )}
            onClick={() => handleAnswer(index)}
            disabled={showResult}
          >
            <span className="mr-3 font-bold">{String.fromCharCode(65 + index)}.</span>
            {option}
            {showResult && index === question.correctIndex && (
              <CheckCircle2 className="ml-auto h-5 w-5" />
            )}
          </Button>
        ))}
      </div>

      {showResult && (
        <Card className={cn(
          'p-4 mt-4',
          selectedAnswer === question.correctIndex
            ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
            : 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
        )}>
          <div className="flex items-start gap-3">
            {selectedAnswer === question.correctIndex ? (
              <ThumbsUp className="h-6 w-6 text-green-600 flex-shrink-0" />
            ) : (
              <Lightbulb className="h-6 w-6 text-amber-600 flex-shrink-0" />
            )}
            <div>
              <h4 className="font-semibold mb-1">
                {selectedAnswer === question.correctIndex ? 'Correct!' : 'Not quite!'}
              </h4>
              <p className="text-sm text-muted-foreground">{question.explanation}</p>
            </div>
          </div>
        </Card>
      )}

      {showResult && (
        <div className="text-center">
          <Button variant="outline" onClick={() => { setSelectedAnswer(null); setShowResult(false); }}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

// Use Case Card Component
function UseCaseCard({ 
  title, 
  persona, 
  challenge, 
  solution, 
  icon 
}: { 
  title: string; 
  persona: string; 
  challenge: string; 
  solution: string; 
  icon: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{persona}</CardDescription>
            </div>
          </div>
          <ChevronRight className={cn(
            'h-5 w-5 transition-transform',
            isExpanded && 'rotate-90'
          )} />
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-2">
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-semibold text-amber-600">Challenge: </span>
              <span className="text-muted-foreground">{challenge}</span>
            </div>
            <div>
              <span className="font-semibold text-green-600">How SONATE helps: </span>
              <span className="text-muted-foreground">{solution}</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Main Lesson Page Component
export default function WhatIsSonatePage() {
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
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {lessonSteps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={cn(
                'w-3 h-3 rounded-full transition-all',
                index === currentStep
                  ? 'bg-primary w-8'
                  : completedSteps.has(index)
                    ? 'bg-green-500'
                    : 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* Current Step Content */}
        <div className="min-h-[60vh]">
          <Badge variant="secondary" className="mb-4">
            {lessonSteps[currentStep].type === 'concept' && '📖 Concept'}
            {lessonSteps[currentStep].type === 'interactive' && '🎮 Interactive'}
            {lessonSteps[currentStep].type === 'quiz' && '❓ Quiz'}
            {lessonSteps[currentStep].type === 'scenario' && '💼 Real World'}
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
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={currentStep === 0}
            >
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
