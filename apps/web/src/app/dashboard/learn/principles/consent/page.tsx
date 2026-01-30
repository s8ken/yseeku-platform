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
  Users,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  FileText,
  Eye,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const lessons = [
  {
    id: 1,
    title: 'What is Consent Architecture?',
    content: `**Consent Architecture** is the foundation of ethical AI—the principle that users must understand and agree to how AI systems use their data and make decisions.

Think of it like informed consent in healthcare: before any procedure, you're told what will happen and you agree to it.

In SONATE, this means:
- Users know when AI is involved
- Users control their data
- Consent is explicit, not assumed
- Users can withdraw consent anytime`
  },
  {
    id: 2,
    title: 'The Three Levels of Consent',
    content: `SONATE recognizes three levels of consent:

**Level 1: Awareness**
Users know AI is being used. No hidden AI.

**Level 2: Understanding**
Users understand what the AI does and how it affects them.

**Level 3: Control**
Users can modify, limit, or revoke AI access to their data.

Each level builds on the previous. True consent requires all three.`
  },
  {
    id: 3,
    title: 'Consent in Practice',
    content: `How consent works in a SONATE-governed system:

**Before Interaction:**
- Clear disclosure that AI is involved
- Explanation of what data will be used
- Options to proceed or decline

**During Interaction:**
- Indicators showing AI is active
- Real-time control options
- Ability to pause or stop

**After Interaction:**
- Record of what occurred
- Option to delete data
- Feedback mechanisms`
  },
  {
    id: 4,
    title: 'Measuring Consent Compliance',
    content: `SONATE tracks consent compliance through:

**Consent Score** (0-100)
How well your AI systems obtain proper consent.

**Key Metrics:**
- Disclosure rate: Are users informed?
- Opt-out availability: Can users decline?
- Consent freshness: Is consent current?
- Granularity: Can users consent partially?

A score below 80% triggers alerts for review.`
  },
  {
    id: 5,
    title: 'Common Consent Violations',
    content: `Watch out for these consent anti-patterns:

❌ **Dark Patterns**
UI designed to trick users into consenting

❌ **Bundled Consent**
Forcing users to accept everything or nothing

❌ **Consent Fatigue**
Overwhelming users with too many requests

❌ **Stale Consent**
Using old consent for new purposes

SONATE detects and flags these violations automatically.`
  }
];

function ConsentDemo() {
  const [consentState, setConsentState] = useState<'pending' | 'granted' | 'denied'>('pending');
  
  return (
    <Card className="border-2 border-purple-200 dark:border-purple-800">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardTitle className="text-lg flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Interactive Consent Flow
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {consentState === 'pending' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium">AI Assistant Request</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The AI assistant would like to analyze your conversation history to provide personalized recommendations.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>View your message history (last 30 days)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Analyze patterns in your requests</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Generate personalized suggestions</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setConsentState('granted')} className="flex-1 bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Allow
              </Button>
              <Button onClick={() => setConsentState('denied')} variant="outline" className="flex-1">
                <XCircle className="h-4 w-4 mr-2" />
                Deny
              </Button>
            </div>
          </div>
        )}
        
        {consentState === 'granted' && (
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-700 dark:text-green-300">Consent Granted</p>
              <p className="text-sm text-muted-foreground mt-1">
                The AI can now provide personalized recommendations. You can revoke this anytime.
              </p>
            </div>
            <Button variant="outline" onClick={() => setConsentState('pending')}>
              Reset Demo
            </Button>
          </div>
        )}
        
        {consentState === 'denied' && (
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 rounded-full bg-amber-100 dark:bg-amber-900">
              <Shield className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-300">Consent Denied</p>
              <p className="text-sm text-muted-foreground mt-1">
                The AI will continue without personalization. Your choice is respected.
              </p>
            </div>
            <Button variant="outline" onClick={() => setConsentState('pending')}>
              Reset Demo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ConsentPage() {
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
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />Back to Learning Hub
        </Link>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Consent Architecture</h1>
            <p className="text-muted-foreground">Why user consent is the foundation of ethical AI</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground">{completedLessons.length}/{lessons.length}</span>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {lessons.map((l, index) => (
          <Button key={l.id} variant={currentLesson === index ? 'default' : 'outline'} size="sm" onClick={() => setCurrentLesson(index)}>
            {completedLessons.includes(index) && <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />}
            {index + 1}
          </Button>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <Badge variant="outline">Lesson {currentLesson + 1} of {lessons.length}</Badge>
          <CardTitle className="text-2xl">{lesson.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {lesson.content.split('\n').map((p, i) => (
              <p key={i} dangerouslySetInnerHTML={{
                __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              }} />
            ))}
          </div>
        </CardContent>
      </Card>

      {currentLesson >= 2 && <div className="mb-6"><ConsentDemo /></div>}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))} disabled={currentLesson === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" />Previous
        </Button>
        {currentLesson === lessons.length - 1 ? (
          <Link href="/dashboard/learn"><Button className="bg-gradient-to-r from-purple-500 to-pink-500"><CheckCircle2 className="h-4 w-4 mr-2" />Complete</Button></Link>
        ) : (
          <Button onClick={handleNext}>Next<ArrowRight className="h-4 w-4 ml-2" /></Button>
        )}
      </div>
    </div>
  );
}
