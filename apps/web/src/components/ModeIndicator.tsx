'use client';

import { useDemo } from '@/hooks/use-demo';
import { Play, Zap, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ModeIndicator() {
  const { isDemo, isLoaded, toggleDemo, isInitializing } = useDemo();

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          isDemo
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
        }`}
      >
        {isDemo ? (
          <>
            <Play className="h-3 w-3" />
            <span>Demo Mode</span>
          </>
        ) : (
          <>
            <Zap className="h-3 w-3" />
            <span>Live Mode</span>
          </>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleDemo()}
        disabled={isInitializing}
        className="h-7 text-xs"
      >
        {isInitializing ? (
          <RefreshCw className="h-3 w-3 animate-spin" />
        ) : (
          <span>Switch to {isDemo ? 'Live' : 'Demo'}</span>
        )}
      </Button>
    </div>
  );
}