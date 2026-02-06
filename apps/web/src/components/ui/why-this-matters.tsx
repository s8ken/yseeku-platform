'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Lightbulb, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface WhyThisMattersProps {
  title?: string;
  children: React.ReactNode;
  learnMoreHref?: string;
  learnMoreText?: string;
  defaultOpen?: boolean;
  storageKey?: string;
  variant?: 'default' | 'compact' | 'highlight';
  className?: string;
}

export function WhyThisMatters({
  title = "Why This Matters",
  children,
  learnMoreHref,
  learnMoreText = "Learn more",
  defaultOpen,
  storageKey,
  variant = 'default',
  className,
}: WhyThisMattersProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? true);
  const [hasSeenBefore, setHasSeenBefore] = useState(false);

  // Check localStorage for whether user has seen this card before
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      const seen = localStorage.getItem(`wtm-${storageKey}`);
      if (seen) {
        setHasSeenBefore(true);
        // If they've seen it before, default to closed
        if (defaultOpen === undefined) {
          setIsOpen(false);
        }
      }
    }
  }, [storageKey, defaultOpen]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    
    // Mark as seen when closed for the first time
    if (!newState && storageKey && typeof window !== 'undefined') {
      localStorage.setItem(`wtm-${storageKey}`, 'true');
      setHasSeenBefore(true);
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-start gap-3 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30",
        className
      )}>
        <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-800 dark:text-amber-200">
          {children}
          {learnMoreHref && (
            <Link 
              href={learnMoreHref} 
              className="inline-flex items-center gap-1 ml-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 underline"
            >
              {learnMoreText}
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      variant === 'highlight' && "border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10",
      !hasSeenBefore && variant !== 'highlight' && "ring-2 ring-amber-200 dark:ring-amber-800",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            {title}
            {!hasSeenBefore && (
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full font-normal">
                New
              </span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleToggle}
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground space-y-2">
            {children}
          </div>
          {learnMoreHref && (
            <Link 
              href={learnMoreHref}
              className="inline-flex items-center gap-1 mt-3 text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
            >
              {learnMoreText}
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Quick context tips for inline use
export function ContextTip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "flex items-start gap-2 text-xs text-muted-foreground p-2 rounded bg-muted/50",
      className
    )}>
      <Lightbulb className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}
