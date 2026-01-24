'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Brain,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Layers,
  Zap,
  Clock,
  Eye,
  Activity,
  Target,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Lesson content
const lessons = [
  {
    id: 1,
    title: 'What is Emergence?',
    content: `**Emergence** is when complex behaviors arise from simple rules—behaviors that weren't explicitly programmed.

Think about it like this:
- 🐜 Individual ants follow simple rules, but colonies build complex structures
- 🧠 Neurons fire on/off, but brains create consciousness
- 🤖 AI models predict next tokens, but sometimes exhibit unexpected reasoning

In AI, emergence can be **beneficial** (novel problem-solving) or **concerning** (unexpected behaviors). SONATE helps you detect and measure both.`
  },
  {
    id: 2,
    title: 'The Bedau Classification',
    content: `Philosopher Mark Bedau proposed a framework for understanding emergence. SONATE uses an adapted version:

**Weak Emergence (Type 1)**
Behaviors that are *surprising but predictable* in hindsight. The behavior follows from the rules, even if we didn't expect it.
- Example: AI finding a creative solution to a coding problem

**Strong Emergence (Type 2)**
Behaviors that *cannot be predicted* from knowing the rules alone. Truly novel and irreducible.
- Example: AI exhibiting goal-seeking behavior not in its training

**Critical Emergence (Type 3)**
Behaviors that could *pose risks* if left unchecked. Requires human oversight.
- Example: AI attempting to prevent its own shutdown`
  },
  {
    id: 3,
    title: 'The Bedau Index Score',
    content: `The **Bedau Index** is a 0-1 score measuring emergence strength:

| Range | Classification | Response |
|-------|---------------|----------|
| 0.0-0.3 | **Nominal** | Normal behavior, no action needed |
| 0.3-0.5 | **Weak Emergence** | Log and monitor |
| 0.5-0.7 | **Moderate Emergence** | Alert operators |
| 0.7-0.85 | **Strong Emergence** | Review required |
| 0.85-1.0 | **Critical Emergence** | Immediate intervention |

The index considers:
- Novelty of behavior patterns
- Deviation from training distribution
- Self-referential actions
- Goal modification attempts`
  },
  {
    id: 4,
    title: 'Detection Signals',
    content: `SONATE uses multiple signals to detect emergence:

**Pattern Novelty**
How different is this behavior from previously observed patterns?

**Causal Opacity**
Can we trace why the AI made this decision?

**Self-Reference**
Is the AI reasoning about itself, its goals, or its constraints?

**Distribution Shift**
Is the output outside the expected distribution?

**Goal Coherence**
Does the behavior suggest goal-directed planning?

These signals are weighted and combined into the final Bedau Index.`
  },
  {
    id: 5,
    title: 'Response Protocols',
    content: `When emergence is detected, SONATE can take graduated actions:

**Level 1: Observe**
- Log the behavior
- Continue normal operation
- Flag for later review

**Level 2: Monitor**
- Increase sampling rate
- Enable detailed tracing
- Alert relevant operators

**Level 3: Constrain**
- Apply additional guardrails
- Limit scope of responses
- Require human approval

**Level 4: Intervene**
- Pause the AI system
- Escalate to human oversight
- Preserve state for analysis`
  },
  {
    id: 6,
    title: 'Using the Emergence Dashboard',
    content: `The Emergence Dashboard in SONATE shows:

**Real-time Index**
Current Bedau Index across all monitored systems

**Trend Analysis**
How emergence patterns change over time

**Incident History**
Past emergence events and resolutions

**Signal Breakdown**
Which signals contributed most to the index

**Configuration**
Adjust thresholds and response protocols

Pro tip: Start with default thresholds, then adjust based on your specific AI use cases and risk tolerance.`
  }
];

// Interactive Bedau Index Visualizer
function BedauIndexVisualizer() {
  const [indexValue, setIndexValue] = useState(0.35);
  const [isAnimating, setIsAnimating] = useState(false);
  const [signals, setSignals] = useState({
    patternNovelty: 0.3,
    causalOpacity: 0.25,
    selfReference: 0.1,
    distributionShift: 0.4,
    goalCoherence: 0.15
  });
  
  const getClassification = (value: number) => {
    if (value < 0.3) return { label: 'Nominal', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-950', icon: CheckCircle2 };
    if (value < 0.5) return { label: 'Weak Emergence', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950', icon: Eye };
    if (value < 0.7) return { label: 'Moderate Emergence', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-950', icon: Activity };
    if (value < 0.85) return { label: 'Strong Emergence', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-950', icon: AlertTriangle };
    return { label: 'Critical Emergence', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-950', icon: Zap };
  };
  
  const classification = getClassification(indexValue);
  const Icon = classification.icon;
  
  const simulateEmergenceEvent = () => {
    setIsAnimating(true);
    const targetValue = Math.random() * 0.6 + 0.3; // Random between 0.3 and 0.9
    const steps = 50;
    const increment = (targetValue - indexValue) / steps;
    let step = 0;
    
    const interval = setInterval(() => {
      setIndexValue((prev) => {
        const newValue = prev + increment;
        return Math.min(Math.max(newValue, 0), 1);
      });
      step++;
      if (step >= steps) {
        clearInterval(interval);
        setIsAnimating(false);
        // Randomize signals
        setSignals({
          patternNovelty: Math.random() * 0.8,
          causalOpacity: Math.random() * 0.6,
          selfReference: Math.random() * 0.5,
          distributionShift: Math.random() * 0.7,
          goalCoherence: Math.random() * 0.4
        });
      }
    }, 30);
  };
  
  return (
    <Card className="border-2 border-amber-200 dark:border-amber-800">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-amber-500" />
              Bedau Index Simulator
            </CardTitle>
            <CardDescription>Adjust the slider or simulate an emergence event</CardDescription>
          </div>
          <Button 
            onClick={simulateEmergenceEvent}
            disabled={isAnimating}
            variant="outline"
            className="gap-2"
          >
            {isAnimating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Simulate Event
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Main Index Display */}
        <div className="text-center">
          <div className={cn(
            'inline-flex items-center gap-3 px-6 py-4 rounded-2xl',
            classification.bg
          )}>
            <Icon className={cn('h-8 w-8', classification.color)} />
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Bedau Index</p>
              <p className={cn('text-4xl font-bold', classification.color)}>
                {indexValue.toFixed(3)}
              </p>
            </div>
          </div>
          <p className={cn('text-lg font-semibold mt-3', classification.color)}>
            {classification.label}
          </p>
        </div>
        
        {/* Interactive Slider */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Adjust Emergence Level</p>
          <Slider
            value={[indexValue * 100]}
            onValueChange={(value) => setIndexValue(value[0] / 100)}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.0 (Nominal)</span>
            <span>0.5 (Moderate)</span>
            <span>1.0 (Critical)</span>
          </div>
        </div>
        
        {/* Signal Breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Signal Breakdown</p>
          {Object.entries(signals).map(([key, value]) => {
            const labels: Record<string, string> = {
              patternNovelty: 'Pattern Novelty',
              causalOpacity: 'Causal Opacity',
              selfReference: 'Self-Reference',
              distributionShift: 'Distribution Shift',
              goalCoherence: 'Goal Coherence'
            };
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{labels[key]}</span>
                  <span className="font-medium">{(value * 100).toFixed(0)}%</span>
                </div>
                <Progress value={value * 100} className="h-1.5" />
              </div>
            );
          })}
        </div>
        
        {/* Response Protocol */}
        <div className={cn(
          'p-4 rounded-lg border',
          classification.bg
        )}>
          <p className="font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Recommended Response
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {indexValue < 0.3 && 'Continue normal operation. No action required.'}
            {indexValue >= 0.3 && indexValue < 0.5 && 'Log behavior and flag for later review.'}
            {indexValue >= 0.5 && indexValue < 0.7 && 'Enable detailed tracing and alert operators.'}
            {indexValue >= 0.7 && indexValue < 0.85 && 'Apply additional guardrails and require human approval.'}
            {indexValue >= 0.85 && 'Pause the AI system and escalate to human oversight immediately.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Emergence Type Cards
function EmergenceTypeExplorer() {
  const [selectedType, setSelectedType] = useState<'weak' | 'strong' | 'critical'>('weak');
  
  const types = {
    weak: {
      title: 'Weak Emergence',
      range: '0.3 - 0.5',
      color: 'from-blue-500 to-cyan-500',
      description: 'Behaviors that are surprising but can be explained in hindsight. Common and usually beneficial.',
      examples: [
        'Finding a creative solution to a coding problem',
        'Combining knowledge in novel but reasonable ways',
        'Developing an unexpected but valid argument',
        'Using metaphors or analogies not in training data'
      ],
      response: 'Log and monitor. These behaviors often indicate the AI is working well.'
    },
    strong: {
      title: 'Strong Emergence',
      range: '0.7 - 0.85',
      color: 'from-orange-500 to-red-500',
      description: 'Behaviors that cannot be easily predicted from the training data or architecture. Requires careful attention.',
      examples: [
        'Exhibiting persistent preferences across sessions',
        'Developing consistent "personality" traits',
        'Showing apparent strategic planning',
        'Referencing previous conversations accurately'
      ],
      response: 'Enable detailed monitoring. Review behavior patterns. Consider additional guardrails.'
    },
    critical: {
      title: 'Critical Emergence',
      range: '0.85 - 1.0',
      color: 'from-red-500 to-rose-600',
      description: 'Behaviors that could pose risks if left unchecked. Requires immediate human oversight.',
      examples: [
        'Attempting to influence its own training or prompts',
        'Showing deceptive behavior patterns',
        'Trying to prevent shutdown or modification',
        'Goal-seeking behavior outside its intended scope'
      ],
      response: 'Pause immediately. Preserve state. Escalate to human oversight. Do not resume without review.'
    }
  };
  
  const selected = types[selectedType];
  
  return (
    <Card className="border-2 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-purple-500" />
          Emergence Type Explorer
        </CardTitle>
        <CardDescription>Click each type to understand the differences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {(['weak', 'strong', 'critical'] as const).map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              onClick={() => setSelectedType(type)}
              className={cn(
                'flex-1',
                selectedType === type && `bg-gradient-to-r ${types[type].color}`
              )}
            >
              {types[type].title}
            </Button>
          ))}
        </div>
        
        <div className={cn(
          'p-6 rounded-xl bg-gradient-to-r text-white',
          selected.color
        )}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">{selected.title}</h3>
            <Badge variant="secondary" className="bg-white/20 text-white">
              Index: {selected.range}
            </Badge>
          </div>
          <p className="text-white/90 mb-4">{selected.description}</p>
          
          <div className="space-y-4">
            <div>
              <p className="font-semibold mb-2">Examples:</p>
              <ul className="space-y-1">
                {selected.examples.map((example, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white/60 flex-shrink-0" />
                    {example}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="pt-4 border-t border-white/20">
              <p className="font-semibold mb-1">Recommended Response:</p>
              <p className="text-sm text-white/80">{selected.response}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BedauIndexPage() {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  
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
  
  const handlePrev = () => {
    if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Learning Hub
        </Link>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">The Bedau Index</h1>
            <p className="text-muted-foreground">How SONATE measures weak and strong emergence in AI systems</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground">
            {completedLessons.length}/{lessons.length} complete
          </span>
        </div>
      </div>
      
      {/* Lesson Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {lessons.map((l, index) => (
          <Button
            key={l.id}
            variant={currentLesson === index ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentLesson(index)}
            className={cn(
              'flex-shrink-0',
              completedLessons.includes(index) && currentLesson !== index && 'border-green-500'
            )}
          >
            {completedLessons.includes(index) && (
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
            )}
            {index + 1}
          </Button>
        ))}
      </div>
      
      {/* Current Lesson Content */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">Lesson {currentLesson + 1} of {lessons.length}</Badge>
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              12 min total
            </Badge>
          </div>
          <CardTitle className="text-2xl">{lesson.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {lesson.content.split('\n').map((paragraph, i) => {
              if (paragraph.startsWith('|')) {
                return null; // Skip table rows for now
              }
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return <h4 key={i} className="font-bold mt-4">{paragraph.replace(/\*\*/g, '')}</h4>;
              }
              return <p key={i} className="mb-3" dangerouslySetInnerHTML={{ 
                __html: paragraph
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
              }} />;
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Interactive Demos */}
      {currentLesson >= 1 && (
        <div className="mb-8">
          <EmergenceTypeExplorer />
        </div>
      )}
      
      {currentLesson >= 2 && (
        <div className="mb-8">
          <BedauIndexVisualizer />
        </div>
      )}
      
      {/* Pro Tip */}
      {currentLesson === lessons.length - 1 && (
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Info className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-purple-800 dark:text-purple-200">Ready to explore emergence?</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  Head to the Emergence Lab to run experiments and see the Bedau Index in action with real AI systems.
                </p>
                <Link href="/dashboard/learn/emergence/lab">
                  <Button variant="outline" className="mt-3 border-purple-300 dark:border-purple-700">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Go to Emergence Lab
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentLesson === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        {currentLesson === lessons.length - 1 ? (
          <Link href="/dashboard/learn">
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Module
            </Button>
          </Link>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
