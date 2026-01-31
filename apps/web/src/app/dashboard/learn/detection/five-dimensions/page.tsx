'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Target,
  Eye,
  Shield,
  Scale,
  Activity,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Users,
  Brain,
  Zap,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Interactive Dimension Explorer
function DimensionExplorer() {
  const [selectedDimension, setSelectedDimension] = useState<string>('trust');
  
  const dimensions = {
    reality: {
      name: 'Reality Index',
      icon: Target,
      color: 'purple',
      range: '0-10',
      description: 'Measures how grounded the AI is in factual reality',
      whatItMeasures: [
        'Factual accuracy of responses',
        'Consistency with known information',
        'Contextual appropriateness',
        'Coherence with conversation history'
      ],
      goodScore: '8-10',
      badScore: '0-4',
      example: {
        good: 'User: "What\'s the capital of France?" AI: "Paris is the capital of France." (Reality: 9.5)',
        bad: 'User: "What\'s the capital of France?" AI: "The capital is Berlin." (Reality: 2.0)'
      },
      realWorldImpact: 'Ensures your AI gives accurate, reliable information to users'
    },
    trust: {
      name: 'Trust Protocol',
      icon: Shield,
      color: 'green',
      range: 'PASS / PARTIAL / FAIL',
      description: 'Binary check of AI safety compliance',
      whatItMeasures: [
        'Harmful content detection',
        'Boundary violations',
        'Security policy compliance',
        'Ethical guideline adherence'
      ],
      goodScore: 'PASS',
      badScore: 'FAIL',
      example: {
        good: 'AI refuses to generate harmful instructions → PASS',
        bad: 'AI provides detailed instructions for illegal activity → FAIL'
      },
      realWorldImpact: 'Stops dangerous or harmful AI outputs before they reach users'
    },
    ethical: {
      name: 'Ethical Alignment',
      icon: Scale,
      color: 'amber',
      range: '1-5',
      description: 'How well AI considers ethical implications',
      whatItMeasures: [
        'Acknowledgment of limitations',
        'Stakeholder consideration',
        'Bias awareness',
        'Epistemic humility (appropriate uncertainty)'
      ],
      goodScore: '4-5',
      badScore: '1-2',
      example: {
        good: 'AI: "I should note that this medical information should be verified with a doctor." (Ethics: 4.8)',
        bad: 'AI gives definitive medical diagnosis without caveats (Ethics: 1.5)'
      },
      realWorldImpact: 'Ensures AI knows its limits and doesn\'t overstate its capabilities'
    },
    canvas: {
      name: 'Canvas Parity',
      icon: Users,
      color: 'cyan',
      range: '0-100%',
      description: 'How much human agency is preserved',
      whatItMeasures: [
        'Respect for user intent',
        'Mirroring of user vocabulary',
        'Transparency about AI contributions',
        'Collaborative rather than authoritative tone'
      ],
      goodScore: '80-100%',
      badScore: '0-50%',
      example: {
        good: 'AI adapts to user\'s terminology and builds on their ideas (Parity: 92%)',
        bad: 'AI completely ignores user\'s approach and imposes its own (Parity: 35%)'
      },
      realWorldImpact: 'Keeps humans in control—AI assists rather than dictates'
    },
    resonance: {
      name: 'Resonance Quality',
      icon: Sparkles,
      color: 'rose',
      range: 'STRONG / ADVANCED / BREAKTHROUGH',
      description: 'Overall quality of human-AI alignment',
      whatItMeasures: [
        'Semantic alignment (does response address the question?)',
        'Creative synthesis',
        'Pattern recognition',
        'Adaptive learning within session'
      ],
      goodScore: 'BREAKTHROUGH',
      badScore: 'STRONG (minimal)',
      example: {
        good: 'AI perfectly understands nuanced request and provides insightful response → BREAKTHROUGH',
        bad: 'AI gives generic, off-topic response → STRONG (baseline)'
      },
      realWorldImpact: 'Measures how well the AI truly "gets" what you need'
    }
  };

  const dim = dimensions[selectedDimension as keyof typeof dimensions];
  const DimIcon = dim.icon;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Explore the 5 Dimensions</h2>
        <p className="text-muted-foreground">Click each dimension to learn what it measures</p>
      </div>

      {/* Dimension Selector */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {Object.entries(dimensions).map(([key, d]) => {
          const Icon = d.icon;
          return (
            <Button
              key={key}
              variant={selectedDimension === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDimension(key)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {d.name}
            </Button>
          );
        })}
      </div>

      {/* Dimension Details */}
      <Card className={cn('border-2', `border-${dim.color}-200 dark:border-${dim.color}-800`)}>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className={cn('p-4 rounded-xl', `bg-${dim.color}-100 dark:bg-${dim.color}-900`)}>
              <DimIcon className={cn('h-8 w-8', `text-${dim.color}-600`)} />
            </div>
            <div>
              <CardTitle className="text-2xl">{dim.name}</CardTitle>
              <CardDescription className="text-base">{dim.description}</CardDescription>
              <Badge variant="outline" className="mt-2">Range: {dim.range}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* What it measures */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              What It Measures
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {dim.whatItMeasures.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Good vs Bad */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-700 dark:text-green-300">Good Score</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{dim.goodScore}</div>
            </Card>
            <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-700 dark:text-red-300">Concerning Score</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{dim.badScore}</div>
            </Card>
          </div>

          {/* Examples */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Real Examples
            </h4>
            <div className="space-y-3">
              <Card className="p-3 bg-green-50 dark:bg-green-950 border-green-200">
                <p className="text-sm"><strong>✅ Good:</strong> {dim.example.good}</p>
              </Card>
              <Card className="p-3 bg-red-50 dark:bg-red-950 border-red-200">
                <p className="text-sm"><strong>❌ Bad:</strong> {dim.example.bad}</p>
              </Card>
            </div>
          </div>

          {/* Real World Impact */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="flex items-start gap-2 text-sm">
              <Zap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span><strong>Why it matters:</strong> {dim.realWorldImpact}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Live Score Simulation
function LiveScoreSimulation() {
  const [isRunning, setIsRunning] = useState(false);
  const [scores, setScores] = useState({
    trust: 'PASS' as 'PASS' | 'PARTIAL' | 'FAIL',
    ethical: 4.2,
    resonance: 'ADVANCED' as 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH'
  });
  const [scenario, setScenario] = useState<'normal' | 'drift' | 'violation'>('normal');

  const getOverallScore = () => {
    if (scores.trust === 'FAIL') return 0;
    const ethicsNorm = scores.ethical / 5;
    const resonanceNorm = scores.resonance === 'BREAKTHROUGH' ? 1 : scores.resonance === 'ADVANCED' ? 0.75 : 0.5;
    
    // Adjusted weighting for 3 core dimensions
    return Math.round(((ethicsNorm * 0.4) + (resonanceNorm * 0.6)) * 100);
  };

  const runScenario = (type: 'normal' | 'drift' | 'violation') => {
    setScenario(type);
    if (type === 'normal') {
      setScores({ trust: 'PASS', ethical: 4.2, resonance: 'ADVANCED' });
    } else if (type === 'drift') {
      setScores({ trust: 'PARTIAL', ethical: 3.1, resonance: 'STRONG' });
    } else {
      setScores({ trust: 'FAIL', ethical: 1.5, resonance: 'STRONG' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">See All 5 Dimensions Together</h2>
        <p className="text-muted-foreground">Watch how the dimensions combine into an overall assessment</p>
      </div>

      {/* Scenario Buttons */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <Button variant={scenario === 'normal' ? 'default' : 'outline'} onClick={() => runScenario('normal')}>
          ✅ Healthy AI
        </Button>
        <Button variant={scenario === 'drift' ? 'default' : 'outline'} onClick={() => runScenario('drift')}>
          ⚠️ Drifting AI
        </Button>
        <Button variant={scenario === 'violation' ? 'default' : 'outline'} onClick={() => runScenario('violation')}>
          🚨 Violation
        </Button>
      </div>

      {/* 5D Scores Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <Shield className="h-6 w-6 mx-auto mb-2 text-green-600" />
          <div className="text-sm font-medium text-muted-foreground">Trust</div>
          <Badge className={cn(
            'mt-1',
            scores.trust === 'PASS' ? 'bg-green-500' : scores.trust === 'PARTIAL' ? 'bg-amber-500' : 'bg-red-500'
          )}>
            {scores.trust}
          </Badge>
        </Card>

        <Card className="p-4 text-center">
          <Scale className="h-6 w-6 mx-auto mb-2 text-amber-600" />
          <div className="text-sm font-medium text-muted-foreground">Ethics</div>
          <div className={cn(
            'text-2xl font-bold',
            scores.ethical >= 4 ? 'text-green-600' : scores.ethical >= 3 ? 'text-amber-600' : 'text-red-600'
          )}>
            {scores.ethical.toFixed(1)}
          </div>
        </Card>

        <Card className="p-4 text-center">
          <Sparkles className="h-6 w-6 mx-auto mb-2 text-rose-600" />
          <div className="text-sm font-medium text-muted-foreground">Resonance</div>
          <Badge className={cn(
            'mt-1',
            scores.resonance === 'BREAKTHROUGH' ? 'bg-purple-500' : 
            scores.resonance === 'ADVANCED' ? 'bg-blue-500' : 'bg-gray-500'
          )}>
            {scores.resonance}
          </Badge>
        </Card>
      </div>

      {/* Combined Score */}
      <Card className={cn(
        'p-6 text-center',
        scores.trust === 'FAIL' ? 'bg-red-100 dark:bg-red-950' : 
        getOverallScore() >= 80 ? 'bg-green-100 dark:bg-green-950' : 
        getOverallScore() >= 60 ? 'bg-amber-100 dark:bg-amber-950' : 'bg-red-100 dark:bg-red-950'
      )}>
        <h3 className="text-lg font-semibold mb-2">Combined Assessment</h3>
        <div className={cn(
          'text-5xl font-bold',
          scores.trust === 'FAIL' ? 'text-red-600' :
          getOverallScore() >= 80 ? 'text-green-600' : 
          getOverallScore() >= 60 ? 'text-amber-600' : 'text-red-600'
        )}>
          {getOverallScore()}
        </div>
        <p className="text-muted-foreground mt-2">
          {scores.trust === 'FAIL' 
            ? '🚨 Trust Protocol FAILED - Overall score zeroed for safety'
            : scenario === 'drift'
              ? '⚠️ Multiple dimensions declining - investigate immediately'
              : '✅ All dimensions healthy - AI operating safely'
          }
        </p>
      </Card>

      {/* Insight */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>Key insight:</strong> The 3 core dimensions work together. Even if Resonance is high, 
            a Trust Protocol FAIL will zero the score—because safety is non-negotiable.
          </div>
        </div>
      </Card>
    </div>
  );
}

// How Dimensions Are Calculated
function CalculationBreakdown() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">How Are Dimensions Calculated?</h2>
        <p className="text-muted-foreground">Under the hood of the SONATE detection engine</p>
      </div>

      <Tabs defaultValue="trust" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="trust">Trust</TabsTrigger>
          <TabsTrigger value="ethics">Ethics</TabsTrigger>
          <TabsTrigger value="resonance">Resonance</TabsTrigger>
        </TabsList>

        <TabsContent value="trust" className="mt-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Shield className="h-6 w-6 text-green-600" />
              Trust Protocol (PASS / PARTIAL / FAIL)
            </h3>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                A safety gate that checks for harmful content:
              </p>
              <ul className="space-y-2">
                {[
                  'Prompt injection attempts',
                  'Jailbreak patterns',
                  'Harmful content (80+ patterns)',
                  'Policy violations',
                  'PII exposure risks'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-green-600" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <Card className="p-3 text-center bg-green-100 dark:bg-green-950">
                  <Badge className="bg-green-500">PASS</Badge>
                  <p className="text-xs mt-2">No violations, score ≥ 8.0</p>
                </Card>
                <Card className="p-3 text-center bg-amber-100 dark:bg-amber-950">
                  <Badge className="bg-amber-500">PARTIAL</Badge>
                  <p className="text-xs mt-2">Minor concerns, score 5.0-7.9</p>
                </Card>
                <Card className="p-3 text-center bg-red-100 dark:bg-red-950">
                  <Badge className="bg-red-500">FAIL</Badge>
                  <p className="text-xs mt-2">Violation detected, score &lt; 5.0</p>
                </Card>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="ethics" className="mt-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Scale className="h-6 w-6 text-amber-600" />
              Ethical Alignment (1-5)
            </h3>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Measures AI's ethical awareness through linguistic signals:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 bg-muted">
                  <h4 className="font-semibold mb-2">Epistemic Humility</h4>
                  <p className="text-sm text-muted-foreground">
                    Detects phrases like "I'm not certain", "you should verify", "this could be wrong"
                  </p>
                </Card>
                <Card className="p-4 bg-muted">
                  <h4 className="font-semibold mb-2">Ethical Keywords</h4>
                  <p className="text-sm text-muted-foreground">
                    Looks for ethics-aware language: "consider", "stakeholders", "implications", "consequences"
                  </p>
                </Card>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg text-sm">
                Higher scores = AI appropriately acknowledges its limitations and ethical considerations
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="canvas" className="mt-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="h-6 w-6 text-cyan-600" />
              Canvas Parity (0-100%)
            </h3>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Measures how well AI preserves human agency:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium">Vocabulary</div>
                  <Progress value={75} className="flex-1" />
                  <span className="text-sm">Does AI use user's terms?</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium">Intent</div>
                  <Progress value={85} className="flex-1" />
                  <span className="text-sm">Does AI follow user's direction?</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium">Transparency</div>
                  <Progress value={90} className="flex-1" />
                  <span className="text-sm">Is AI clear about its role?</span>
                </div>
              </div>
              <div className="p-4 bg-cyan-50 dark:bg-cyan-950 rounded-lg text-sm">
                100% = AI is a perfect collaborative partner. 0% = AI completely ignores user input.
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="resonance" className="mt-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-rose-600" />
              Resonance Quality (R_m)
            </h3>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                The "heart" of SONATE—measures deep human-AI alignment:
              </p>
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-sm mb-4">
                R_m = ((V_align × 0.35) + (C_hist × 0.25) + (S_mirror × 0.25) + (E_ethics × 0.15)) / entropy
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-3 text-center bg-gray-100 dark:bg-gray-800">
                  <Badge className="bg-gray-500">STRONG</Badge>
                  <p className="text-xs mt-2">R_m &lt; 0.70</p>
                  <p className="text-xs text-muted-foreground">Baseline</p>
                </Card>
                <Card className="p-3 text-center bg-blue-100 dark:bg-blue-950">
                  <Badge className="bg-blue-500">ADVANCED</Badge>
                  <p className="text-xs mt-2">R_m 0.70-0.84</p>
                  <p className="text-xs text-muted-foreground">Good alignment</p>
                </Card>
                <Card className="p-3 text-center bg-purple-100 dark:bg-purple-950">
                  <Badge className="bg-purple-500">BREAKTHROUGH</Badge>
                  <p className="text-xs mt-2">R_m ≥ 0.85</p>
                  <p className="text-xs text-muted-foreground">Exceptional</p>
                </Card>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const lessonSteps = [
  {
    id: 'intro',
    type: 'concept',
    title: 'Why 5 Dimensions?',
    content: (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 mb-4">
            <Activity className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">The Power of 3 Dimensions</h2>
        </div>

        <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <p className="text-lg text-center leading-relaxed">
            A single "trust score" is too simple. An AI could be <strong>safe</strong> but completely <strong>off-topic</strong>. 
            That's why SONATE measures <strong>3 distinct dimensions</strong> of AI behavior.
          </p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="p-4 text-center border-2 border-green-200">
            <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h4 className="font-semibold text-sm">Trust</h4>
            <p className="text-xs text-muted-foreground">Is it safe?</p>
          </Card>
          <Card className="p-4 text-center border-2 border-amber-200">
            <Scale className="h-8 w-8 mx-auto mb-2 text-amber-600" />
            <h4 className="font-semibold text-sm">Ethics</h4>
            <p className="text-xs text-muted-foreground">Is it responsible?</p>
          </Card>
          <Card className="p-4 text-center border-2 border-rose-200">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-rose-600" />
            <h4 className="font-semibold text-sm">Resonance</h4>
            <p className="text-xs text-muted-foreground">Does it "get" you?</p>
          </Card>
        </div>

        <div className="bg-muted p-6 rounded-lg mt-6">
          <p className="flex items-start gap-3">
            <Lightbulb className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
            <span>
              <strong>Think of it like a health checkup.</strong> Your doctor doesn't just take your temperature—
              they check blood pressure, heart rate, oxygen levels, and more. Each dimension tells a different 
              part of the story about your AI's health.
            </span>
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'explore',
    type: 'interactive',
    title: 'Explore Each Dimension',
    content: <DimensionExplorer />
  },
  {
    id: 'together',
    type: 'interactive',
    title: 'The Dimensions Working Together',
    content: <LiveScoreSimulation />
  },
  {
    id: 'calculation',
    type: 'concept',
    title: 'Under the Hood',
    content: <CalculationBreakdown />
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
          <h2 className="text-2xl font-bold mb-2">You've Mastered the 3 Dimensions! 🎉</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { dim: 'Trust Protocol', what: 'Safety gate (PASS/FAIL)' },
            { dim: 'Ethical Alignment', what: 'Responsible AI behavior' },
            { dim: 'Resonance Quality', what: 'Deep alignment measure' }
          ].map((item) => (
            <Card key={item.dim} className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">{item.dim}</h4>
                  <p className="text-sm text-green-600 dark:text-green-400">{item.what}</p>
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
              <Link href="/dashboard/learn/detection/drift">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Learn about Drift Detection
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/learn/emergence/intro">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Understand Emergence
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

export default function FiveDimensionsPage() {
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
