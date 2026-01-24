'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  Play,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConceptCardProps {
  term: string;
  shortDefinition: string;
  fullExplanation?: string;
  example?: string;
  warning?: string;
  tip?: string;
  relatedTerms?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  icon?: React.ReactNode;
  color?: string;
}

export function ConceptCard({
  term,
  shortDefinition,
  fullExplanation,
  example,
  warning,
  tip,
  relatedTerms,
  difficulty = 'beginner',
  icon,
  color = 'purple',
}: ConceptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    advanced: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <Card className={cn('transition-all duration-200', isExpanded && 'ring-2 ring-primary/50')}>
      <CardHeader 
        className="cursor-pointer pb-3" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {icon && (
              <div className={cn('p-2 rounded-lg', `bg-${color}-100 dark:bg-${color}-900`)}>
                {icon}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{term}</CardTitle>
                <Badge variant="outline" className={difficultyColors[difficulty]}>
                  {difficulty}
                </Badge>
              </div>
              <CardDescription className="mt-1">{shortDefinition}</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="flex-shrink-0">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {fullExplanation && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4" />
                Full Explanation
              </h4>
              <p className="text-sm text-muted-foreground">{fullExplanation}</p>
            </div>
          )}

          {example && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <Play className="h-4 w-4" />
                Example
              </h4>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">{example}</p>
            </div>
          )}

          {warning && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                <AlertCircle className="h-4 w-4" />
                Important
              </h4>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">{warning}</p>
            </div>
          )}

          {tip && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <h4 className="font-semibold flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                <Lightbulb className="h-4 w-4" />
                Pro Tip
              </h4>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">{tip}</p>
            </div>
          )}

          {relatedTerms && relatedTerms.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Related Concepts</h4>
              <div className="flex flex-wrap gap-2">
                {relatedTerms.map((related) => (
                  <Badge key={related} variant="secondary" className="text-xs">
                    {related}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Interactive Quiz Card
interface QuizCardProps {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  onComplete?: (isCorrect: boolean) => void;
}

export function QuizCard({ question, options, correctIndex, explanation, onComplete }: QuizCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index);
    setShowResult(true);
    onComplete?.(index === correctIndex);
  };

  const reset = () => {
    setSelectedAnswer(null);
    setShowResult(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-purple-600" />
          <Badge variant="secondary">Quick Check</Badge>
        </div>
        <CardTitle className="text-lg">{question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {options.map((option, index) => (
          <Button
            key={index}
            variant={
              showResult
                ? index === correctIndex
                  ? 'default'
                  : selectedAnswer === index
                    ? 'destructive'
                    : 'outline'
                : selectedAnswer === index
                  ? 'secondary'
                  : 'outline'
            }
            className={cn(
              'w-full justify-start text-left h-auto py-3 px-4',
              showResult && index === correctIndex && 'bg-green-600 hover:bg-green-600'
            )}
            onClick={() => handleAnswer(index)}
            disabled={showResult}
          >
            <span className="mr-3 font-bold">{String.fromCharCode(65 + index)}.</span>
            {option}
            {showResult && index === correctIndex && (
              <CheckCircle2 className="ml-auto h-5 w-5" />
            )}
          </Button>
        ))}

        {showResult && (
          <div className={cn(
            'p-4 rounded-lg mt-4',
            selectedAnswer === correctIndex
              ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
              : 'bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800'
          )}>
            <div className="flex items-start gap-3">
              {selectedAnswer === correctIndex ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              ) : (
                <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold">
                  {selectedAnswer === correctIndex ? 'Correct! 🎉' : 'Not quite!'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{explanation}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={reset}>
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Scenario Card for "What would you do?" exercises
interface ScenarioCardProps {
  title: string;
  description: string;
  context: string;
  choices: {
    label: string;
    outcome: string;
    isOptimal: boolean;
  }[];
}

export function ScenarioCard({ title, description, context, choices }: ScenarioCardProps) {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-500">Scenario</Badge>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm italic">{context}</p>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-sm">What would you do?</p>
          {choices.map((choice, index) => (
            <Button
              key={index}
              variant={selectedChoice === index ? 'default' : 'outline'}
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => setSelectedChoice(index)}
            >
              {choice.label}
            </Button>
          ))}
        </div>

        {selectedChoice !== null && (
          <div className={cn(
            'p-4 rounded-lg',
            choices[selectedChoice].isOptimal
              ? 'bg-green-50 dark:bg-green-950 border border-green-200'
              : 'bg-amber-50 dark:bg-amber-950 border border-amber-200'
          )}>
            <p className={cn(
              'font-semibold mb-2',
              choices[selectedChoice].isOptimal ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'
            )}>
              {choices[selectedChoice].isOptimal ? '✅ Good choice!' : '⚠️ Could be better'}
            </p>
            <p className="text-sm text-muted-foreground">{choices[selectedChoice].outcome}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Step-by-step tutorial card
interface StepByStepCardProps {
  title: string;
  steps: {
    title: string;
    description: string;
    action?: React.ReactNode;
  }[];
}

export function StepByStepCard({ title, steps }: StepByStepCardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const markComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="flex gap-1 mt-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors',
                completedSteps.has(index) ? 'bg-green-500' :
                index === currentStep ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
              completedSteps.has(currentStep) ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground'
            )}>
              {completedSteps.has(currentStep) ? '✓' : currentStep + 1}
            </div>
            <div>
              <h4 className="font-semibold">{steps[currentStep].title}</h4>
              <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
            </div>
          </div>

          {steps[currentStep].action && (
            <div className="pl-11">{steps[currentStep].action}</div>
          )}

          <div className="flex gap-2 pl-11">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button size="sm" onClick={markComplete}>
              {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
