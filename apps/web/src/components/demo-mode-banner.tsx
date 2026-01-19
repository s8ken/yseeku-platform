'use client';

import { X, Sparkles, ExternalLink, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/hooks/use-demo';
import Link from 'next/link';

/**
 * Format milliseconds to human-readable time remaining
 */
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expired';
  const minutes = Math.floor(ms / 60000);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  return `${minutes}m`;
}

/**
 * Demo Mode Banner
 * 
 * Displays when the platform is in demo mode.
 * Shows status, time remaining, allows exiting/extending demo mode.
 */
export function DemoModeBanner() {
  const { 
    isDemo, 
    isInitializing, 
    disableDemo, 
    timeRemaining, 
    showExpiryWarning,
    extendDemo 
  } = useDemo();

  if (!isDemo) return null;

  const isExpired = timeRemaining !== null && timeRemaining <= 0;
  const isWarning = showExpiryWarning && !isExpired;

  return (
    <div className={`${
      isExpired 
        ? 'bg-gradient-to-r from-red-600 via-red-700 to-red-600' 
        : isWarning 
          ? 'bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500' 
          : 'bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600'
    } text-white px-4 py-2 relative overflow-hidden`}>
      {/* Animated background */}
      <div className={`absolute inset-0 ${
        isExpired || isWarning ? '' : 'bg-gradient-to-r from-cyan-600/50 via-purple-600/50 to-cyan-600/50 animate-pulse'
      }`} />
      
      <div className="relative flex items-center justify-between max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
            {isExpired ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="text-sm font-semibold">
              {isExpired ? 'DEMO EXPIRED' : 'DEMO MODE'}
            </span>
          </div>
          
          <span className="text-sm hidden sm:inline">
            {isExpired
              ? 'Your demo session has ended'
              : isInitializing 
                ? 'Initializing demo data...' 
                : 'Exploring YSEEKU with sample data'
            }
          </span>

          {/* Time remaining indicator */}
          {timeRemaining !== null && !isExpired && (
            <div className="hidden md:flex items-center gap-1 text-sm bg-white/10 rounded px-2 py-0.5">
              <Clock className="h-3 w-3" />
              <span>{formatTimeRemaining(timeRemaining)} left</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Extend demo button (show when warning or expired) */}
          {(isWarning || isExpired) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={extendDemo}
              className="text-white hover:bg-white/20 h-7 px-2 border border-white/30"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Extend 30m</span>
            </Button>
          )}

          <Link 
            href="https://docs.yseeku.com" 
            target="_blank"
            className="hidden sm:flex items-center gap-1 text-sm hover:underline"
          >
            <span>Documentation</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={disableDemo}
            className="text-white hover:bg-white/20 h-7 px-2"
          >
            <X className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Exit Demo</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
