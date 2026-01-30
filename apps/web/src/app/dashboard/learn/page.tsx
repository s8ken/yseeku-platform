'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  Rocket,
  Shield,
  Eye,
  Brain,
  Activity,
  Zap,
  BookOpen,
  Play,
  ChevronRight,
  Clock,
  Target,
  Users,
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Learning Path Definitions
interface LearningModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: React.ReactNode;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  prerequisites?: string[];
  href: string;
  isInteractive?: boolean;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  modules: LearningModule[];
  targetAudience: string;
}

const learningPaths: LearningPath[] = [
  {
    id: 'foundations',
    title: 'Platform Foundations',
    description: 'Start here if you\'re new to SONATE. Learn the core concepts that power AI trust.',
    icon: <Rocket className="h-6 w-6" />,
    color: 'from-blue-500 to-cyan-500',
    targetAudience: 'Everyone',
    modules: [
      {
        id: 'what-is-sonate',
        title: 'What is SONATE?',
        description: 'Understand why AI trust matters and how SONATE solves the problem',
        duration: '5 min',
        icon: <Sparkles className="h-5 w-5" />,
        difficulty: 'beginner',
        topics: ['AI Trust', 'Platform Overview', 'Use Cases'],
        href: '/dashboard/learn/foundations/what-is-sonate',
        isInteractive: true
      },
      {
        id: 'trust-score-explained',
        title: 'Trust Scores Explained',
        description: 'Learn what trust scores mean and how they\'re calculated',
        duration: '8 min',
        icon: <Shield className="h-5 w-5" />,
        difficulty: 'beginner',
        topics: ['Trust Score', 'Scoring System', 'Thresholds'],
        href: '/dashboard/learn/foundations/trust-scores',
        isInteractive: true
      },
      {
        id: 'your-first-dashboard',
        title: 'Your First Dashboard',
        description: 'Interactive walkthrough of the main dashboard features',
        duration: '10 min',
        icon: <Activity className="h-5 w-5" />,
        difficulty: 'beginner',
        topics: ['Dashboard', 'Navigation', 'Key Metrics'],
        href: '/dashboard/learn/foundations/first-dashboard',
        isInteractive: true
      },
      {
        id: 'reading-trust-receipts',
        title: 'Reading Trust Receipts',
        description: 'Understand the cryptographic proof behind every AI interaction',
        duration: '7 min',
        icon: <Eye className="h-5 w-5" />,
        difficulty: 'beginner',
        topics: ['Trust Receipts', 'Verification', 'Audit Trail'],
        href: '/dashboard/learn/foundations/trust-receipts',
        isInteractive: true
      }
    ]
  },
  {
    id: 'constitutional',
    title: 'Constitutional AI Principles',
    description: 'Deep dive into the 6 principles that govern how AI should behave ethically.',
    icon: <Shield className="h-6 w-6" />,
    color: 'from-purple-500 to-pink-500',
    targetAudience: 'All Users',
    modules: [
      {
        id: 'consent-architecture',
        title: 'Consent Architecture',
        description: 'Why user consent is the foundation of ethical AI',
        duration: '6 min',
        icon: <Users className="h-5 w-5" />,
        difficulty: 'beginner',
        topics: ['Consent', 'User Rights', 'Data Control'],
        href: '/dashboard/learn/principles/consent',
        isInteractive: true
      },
      {
        id: 'inspection-mandate',
        title: 'Inspection Mandate',
        description: 'Making AI decisions transparent and auditable',
        duration: '6 min',
        icon: <Eye className="h-5 w-5" />,
        difficulty: 'beginner',
        topics: ['Transparency', 'Auditability', 'Explainability'],
        href: '/dashboard/learn/principles/inspection',
        isInteractive: true
      },
      {
        id: 'continuous-validation',
        title: 'Continuous Validation',
        description: 'How we constantly verify AI behavior',
        duration: '7 min',
        icon: <Activity className="h-5 w-5" />,
        difficulty: 'intermediate',
        topics: ['Monitoring', 'Validation', 'Real-time Checks'],
        href: '/dashboard/learn/principles/validation',
        isInteractive: true
      },
      {
        id: 'ethical-override',
        title: 'Ethical Override',
        description: 'Keeping humans in control of AI decisions',
        duration: '5 min',
        icon: <Shield className="h-5 w-5" />,
        difficulty: 'beginner',
        topics: ['Human Control', 'Override', 'Safety'],
        href: '/dashboard/learn/principles/override',
        isInteractive: true
      },
      {
        id: 'right-to-disconnect',
        title: 'Right to Disconnect',
        description: 'Your freedom to disengage from AI at any time',
        duration: '4 min',
        icon: <Zap className="h-5 w-5" />,
        difficulty: 'beginner',
        topics: ['User Freedom', 'Privacy', 'Control'],
        href: '/dashboard/learn/principles/disconnect',
        isInteractive: true
      },
      {
        id: 'moral-recognition',
        title: 'Moral Recognition',
        description: 'AI acknowledging human moral agency',
        duration: '6 min',
        icon: <Brain className="h-5 w-5" />,
        difficulty: 'intermediate',
        topics: ['Ethics', 'Moral Agency', 'AI Limits'],
        href: '/dashboard/learn/principles/moral',
        isInteractive: true
      }
    ]
  },
  {
    id: 'detection',
    title: 'AI Detection & Monitoring',
    description: 'Learn how SONATE monitors AI behavior in real-time using the 5-dimension framework.',
    icon: <Eye className="h-6 w-6" />,
    color: 'from-cyan-500 to-teal-500',
    targetAudience: 'Operators & Developers',
    modules: [
      {
        id: 'five-dimensions',
        title: 'The 5 Detection Dimensions',
        description: 'Overview of Reality Index, Trust Protocol, Ethical Alignment, Canvas Parity, and Resonance',
        duration: '12 min',
        icon: <Target className="h-5 w-5" />,
        difficulty: 'intermediate',
        topics: ['5D Framework', 'Dimensions', 'Scoring'],
        prerequisites: ['trust-score-explained'],
        href: '/dashboard/learn/detection/five-dimensions',
        isInteractive: true
      },
      {
        id: 'reality-index-deep',
        title: 'Reality Index Deep Dive',
        description: 'Measuring factual accuracy and contextual grounding',
        duration: '10 min',
        icon: <Activity className="h-5 w-5" />,
        difficulty: 'intermediate',
        topics: ['Reality Index', 'Accuracy', 'Context'],
        href: '/dashboard/learn/detection/reality-index',
        isInteractive: true
      },
      {
        id: 'drift-detection',
        title: 'Drift Detection Explained',
        description: 'How we detect when AI behavior changes over time',
        duration: '8 min',
        icon: <Activity className="h-5 w-5" />,
        difficulty: 'intermediate',
        topics: ['Drift', 'Monitoring', 'Baselines'],
        href: '/dashboard/learn/detection/drift',
        isInteractive: true
      },
      {
        id: 'alerts-setup',
        title: 'Setting Up Alerts',
        description: 'Configure notifications for trust violations',
        duration: '10 min',
        icon: <Zap className="h-5 w-5" />,
        difficulty: 'intermediate',
        topics: ['Alerts', 'Webhooks', 'Notifications'],
        href: '/dashboard/learn/detection/alerts',
        isInteractive: true
      }
    ]
  },
  {
    id: 'emergence',
    title: 'Understanding Emergence',
    description: 'Learn about the Bedau Index and detecting emergent AI behaviors.',
    icon: <Brain className="h-6 w-6" />,
    color: 'from-amber-500 to-orange-500',
    targetAudience: 'Researchers & Advanced Users',
    modules: [
      {
        id: 'what-is-emergence',
        title: 'What is AI Emergence?',
        description: 'Understand emergent behaviors in AI systems',
        duration: '8 min',
        icon: <Sparkles className="h-5 w-5" />,
        difficulty: 'intermediate',
        topics: ['Emergence', 'Complex Systems', 'Behaviors'],
        href: '/dashboard/learn/emergence/intro',
        isInteractive: true
      },
      {
        id: 'bedau-index',
        title: 'The Bedau Index',
        description: 'How we measure weak and strong emergence',
        duration: '12 min',
        icon: <Brain className="h-5 w-5" />,
        difficulty: 'advanced',
        topics: ['Bedau Index', 'Metrics', 'Classification'],
        prerequisites: ['what-is-emergence'],
        href: '/dashboard/learn/emergence/bedau',
        isInteractive: true
      },
      {
        id: 'emergence-lab',
        title: 'Emergence Research Lab',
        description: 'Running experiments to study emergence',
        duration: '15 min',
        icon: <BookOpen className="h-5 w-5" />,
        difficulty: 'advanced',
        topics: ['Lab', 'Experiments', 'Research'],
        href: '/dashboard/learn/emergence/lab',
        isInteractive: true
      }
    ]
  },
  {
    id: 'overseer',
    title: 'The Autonomous Overseer',
    description: 'Discover how SONATE\'s AI brain monitors and manages your AI systems.',
    icon: <Brain className="h-6 w-6" />,
    color: 'from-rose-500 to-red-500',
    targetAudience: 'Administrators',
    modules: [
      {
        id: 'overseer-intro',
        title: 'Meet the Overseer',
        description: 'Your autonomous AI governance assistant',
        duration: '8 min',
        icon: <Brain className="h-5 w-5" />,
        difficulty: 'intermediate',
        topics: ['Overseer', 'Autonomous AI', 'Governance'],
        href: '/dashboard/learn/overseer/intro',
        isInteractive: true
      },
      {
        id: 'sense-plan-act',
        title: 'Sense-Plan-Act Cycle',
        description: 'How the Overseer thinks and makes decisions',
        duration: '10 min',
        icon: <Activity className="h-5 w-5" />,
        difficulty: 'advanced',
        topics: ['Sensors', 'Planning', 'Execution'],
        href: '/dashboard/learn/overseer/cycle',
        isInteractive: true
      },
      {
        id: 'configuring-overseer',
        title: 'Configuring the Overseer',
        description: 'Set up autonomous actions and safety limits',
        duration: '12 min',
        icon: <Target className="h-5 w-5" />,
        difficulty: 'advanced',
        topics: ['Configuration', 'Thresholds', 'Actions'],
        href: '/dashboard/learn/overseer/config',
        isInteractive: true
      }
    ]
  }
];

// Quick Start Actions
const quickStartActions = [
  {
    title: 'Take the Platform Tour',
    description: 'Interactive 5-minute walkthrough',
    icon: <Play className="h-5 w-5" />,
    href: '/dashboard?tutorial=true',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500'
  },
  {
    title: 'Try the Demo',
    description: 'Explore with sample data',
    icon: <Rocket className="h-5 w-5" />,
    href: '/dashboard?demo=true',
    color: 'bg-gradient-to-r from-cyan-500 to-blue-500'
  },
  {
    title: 'Watch Video Tutorial',
    description: '10-minute overview video',
    icon: <Play className="h-5 w-5" />,
    href: '/dashboard/learn/video/overview',
    color: 'bg-gradient-to-r from-amber-500 to-orange-500'
  }
];

function DifficultyBadge({ difficulty }: { difficulty: 'beginner' | 'intermediate' | 'advanced' }) {
  const colors = {
    beginner: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    advanced: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
  };
  
  return (
    <Badge variant="outline" className={cn('capitalize', colors[difficulty])}>
      {difficulty}
    </Badge>
  );
}

function ModuleCard({ module, isLocked = false }: { module: LearningModule; isLocked?: boolean }) {
  return (
    <Link href={isLocked ? '#' : module.href}>
      <Card className={cn(
        'h-full transition-all duration-200 hover:shadow-lg border-2',
        isLocked ? 'opacity-60 cursor-not-allowed border-muted' : 'hover:border-primary/50 cursor-pointer'
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                isLocked ? 'bg-muted' : 'bg-primary/10'
              )}>
                {isLocked ? <Lock className="h-5 w-5 text-muted-foreground" /> : module.icon}
              </div>
              <div>
                <h4 className="font-semibold text-sm">{module.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{module.description}</p>
              </div>
            </div>
            {!isLocked && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
          </div>
          
          <div className="flex items-center gap-2 mt-3">
            <DifficultyBadge difficulty={module.difficulty} />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {module.duration}
            </span>
            {module.isInteractive && (
              <Badge variant="secondary" className="text-xs">
                <Play className="h-3 w-3 mr-1" />
                Interactive
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function LearningPathCard({ path, progress = 0 }: { path: LearningPath; progress?: number }) {
  const completedModules = Math.floor((progress / 100) * path.modules.length);
  
  return (
    <Card className="overflow-hidden">
      <div className={cn('h-2 bg-gradient-to-r', path.color)} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-3 rounded-xl bg-gradient-to-r text-white', path.color)}>
              {path.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{path.title}</CardTitle>
              <CardDescription className="text-sm mt-1">{path.description}</CardDescription>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="outline" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {path.targetAudience}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {path.modules.length} modules
          </Badge>
        </div>
        {progress > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{completedModules}/{path.modules.length} completed</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {path.modules.map((module, index) => (
            <ModuleCard 
              key={module.id} 
              module={module} 
              isLocked={module.prerequisites?.some(prereq => true)} // TODO: Check actual completion
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LearnPage() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-4">
          <GraduationCap className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-bold mb-4">
          Learn SONATE
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Master AI trust and governance with interactive tutorials designed for everyone—from beginners to experts.
        </p>
      </div>

      {/* Quick Start Section */}
      <Card className="mb-8 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Quick Start
          </CardTitle>
          <CardDescription>
            New to SONATE? Start here for the fastest way to get up to speed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickStartActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn('p-3 rounded-xl text-white', action.color)}>
                      {action.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skill Level Filter */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <span className="text-sm text-muted-foreground mr-2">Filter by level:</span>
        <Button variant="outline" size="sm" className="gap-1">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          Beginner
        </Button>
        <Button variant="outline" size="sm" className="gap-1">
          <CheckCircle2 className="h-4 w-4 text-amber-500" />
          Intermediate
        </Button>
        <Button variant="outline" size="sm" className="gap-1">
          <CheckCircle2 className="h-4 w-4 text-red-500" />
          Advanced
        </Button>
      </div>

      {/* Learning Paths Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {learningPaths.map((path) => (
          <LearningPathCard key={path.id} path={path} />
        ))}
      </div>

      {/* Additional Resources */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Additional Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/dashboard/glossary">
              <Card className="h-full cursor-pointer hover:shadow-md transition-all">
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <h4 className="font-semibold">Glossary</h4>
                  <p className="text-xs text-muted-foreground">All platform terms explained</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/docs">
              <Card className="h-full cursor-pointer hover:shadow-md transition-all">
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-cyan-500" />
                  <h4 className="font-semibold">Reference Docs</h4>
                  <p className="text-xs text-muted-foreground">Technical documentation</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/api">
              <Card className="h-full cursor-pointer hover:shadow-md transition-all">
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                  <h4 className="font-semibold">API Reference</h4>
                  <p className="text-xs text-muted-foreground">For developers</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="https://github.com/s8ken/yseeku-platform/discussions" target="_blank">
              <Card className="h-full cursor-pointer hover:shadow-md transition-all">
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <h4 className="font-semibold">Community</h4>
                  <p className="text-xs text-muted-foreground">Ask questions, share ideas</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
