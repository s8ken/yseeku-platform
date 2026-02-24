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
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  SkipForward,
  SkipBack,
  Clock,
  CheckCircle2,
  BookOpen,
  Shield,
  Activity,
  Brain,
  Sparkles,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Video Chapter Interface
interface VideoChapter {
  id: string;
  title: string;
  timestamp: string;
  duration: string;
  description: string;
  icon: React.ReactNode;
}

const videoChapters: VideoChapter[] = [
  {
    id: 'intro',
    title: 'Introduction',
    timestamp: '0:00',
    duration: '1:30',
    description: 'Welcome to SONATE and what you\'ll learn',
    icon: <Play className="h-4 w-4" />
  },
  {
    id: 'problem',
    title: 'The Trust Problem',
    timestamp: '1:30',
    duration: '2:00',
    description: 'Why AI trust matters in enterprise deployments',
    icon: <Shield className="h-4 w-4" />
  },
  {
    id: 'solution',
    title: 'SONATE Solution',
    timestamp: '3:30',
    duration: '2:30',
    description: 'How SONATE solves the trust gap',
    icon: <Sparkles className="h-4 w-4" />
  },
  {
    id: 'dashboard',
    title: 'Dashboard Tour',
    timestamp: '6:00',
    duration: '3:00',
    description: 'Navigate the main dashboard',
    icon: <Activity className="h-4 w-4" />
  },
  {
    id: 'dimensions',
    title: 'The 5 Dimensions',
    timestamp: '9:00',
    duration: '2:30',
    description: 'Understanding trust measurement',
    icon: <Brain className="h-4 w-4" />
  },
  {
    id: 'next-steps',
    title: 'Next Steps',
    timestamp: '11:30',
    duration: '1:00',
    description: 'What to do after this video',
    icon: <CheckCircle2 className="h-4 w-4" />
  }
];

// Simulated Video Player Component
function VideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const totalDuration = 750; // 12:30 in seconds

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (currentTime / totalDuration) * 100;

  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
      {/* Video Content Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center text-white">
          <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-12 w-12" />
          </div>
          <h3 className="text-2xl font-bold mb-2">SONATE Platform Overview</h3>
          <p className="text-white/60">Interactive video tutorial coming soon</p>
          <p className="text-sm text-white/40 mt-4">
            In the meantime, explore our interactive learning modules below
          </p>
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />

      {/* Video Controls */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        {/* Progress Bar */}
        <div className="mb-3">
          <div 
            className="h-1 bg-white/30 rounded-full cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              setCurrentTime(Math.floor(percent * totalDuration));
            }}
          >
            <div 
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-12 w-12"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setCurrentTime(Math.min(totalDuration, currentTime + 10))}
            >
              <SkipForward className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>

            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Chapter List Component
function ChapterList({ chapters, onSelect }: { chapters: VideoChapter[]; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-2">
      {chapters.map((chapter) => (
        <Card 
          key={chapter.id}
          className="p-3 cursor-pointer hover:bg-muted transition-colors"
          onClick={() => onSelect(chapter.id)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {chapter.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm truncate">{chapter.title}</h4>
                <span className="text-xs text-muted-foreground">{chapter.timestamp}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{chapter.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Related Resources
function RelatedResources() {
  const resources = [
    {
      title: 'What is SONATE?',
      type: 'Interactive Module',
      duration: '5 min',
      href: '/dashboard/learn/foundations/what-is-sonate'
    },
    {
      title: 'Trust Scores Explained',
      type: 'Interactive Module',
      duration: '8 min',
      href: '/dashboard/learn/foundations/trust-scores'
    },
    {
      title: 'The 5 Detection Dimensions',
      type: 'Interactive Module',
      duration: '12 min',
      href: '/dashboard/learn/detection/five-dimensions'
    },
    {
      title: 'Meet the Overseer',
      type: 'Interactive Module',
      duration: '8 min',
      href: '/dashboard/learn/overseer/intro'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Related Resources
        </CardTitle>
        <CardDescription>
          Continue learning with interactive modules
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {resources.map((resource) => (
          <Link key={resource.title} href={resource.href}>
            <Card className="p-3 hover:bg-muted transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">{resource.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {resource.duration}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Card>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export default function VideoOverviewPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <Link 
            href="/dashboard/learn" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Learning Hub
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Section */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Badge className="mb-2">Video Tutorial</Badge>
              <h1 className="text-3xl font-bold">SONATE Platform Overview</h1>
              <p className="text-muted-foreground mt-2">
                A comprehensive introduction to the SONATE AI Trust Platform
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  12:30
                </span>
                <span>•</span>
                <span>6 chapters</span>
                <span>•</span>
                <Badge variant="outline">Beginner</Badge>
              </div>
            </div>

            <VideoPlayer />

            {/* Chapters on Desktop */}
            <Card className="hidden lg:block">
              <CardHeader>
                <CardTitle className="text-lg">Chapters</CardTitle>
              </CardHeader>
              <CardContent>
                <ChapterList 
                  chapters={videoChapters} 
                  onSelect={() => {}} 
                />
              </CardContent>
            </Card>

            {/* Key Takeaways */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Key Takeaways
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    'SONATE is the trust layer for AI—monitoring, auditing, and governing AI systems',
                    'Trust scores combine 6 constitutional principles into a single 0-100 metric',
                    'The 5 detection dimensions measure different aspects of AI behavior',
                    'Trust receipts provide cryptographic proof of every AI interaction',
                    'The Overseer provides autonomous 24/7 monitoring and response'
                  ].map((takeaway, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      {takeaway}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Chapters on Mobile */}
            <Card className="lg:hidden">
              <CardHeader>
                <CardTitle className="text-lg">Chapters</CardTitle>
              </CardHeader>
              <CardContent>
                <ChapterList 
                  chapters={videoChapters} 
                  onSelect={() => {}} 
                />
              </CardContent>
            </Card>

            <RelatedResources />

            {/* Next Steps CTA */}
            <Card className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Ready to Try It?</h3>
                <p className="text-white/80 text-sm mb-4">
                  Take an interactive tour of the actual dashboard
                </p>
                <Link href="/dashboard?tutorial=true">
                  <Button variant="secondary" className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Start Dashboard Tour
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
