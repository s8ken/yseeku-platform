'use client';

import { X, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/hooks/use-demo';
import Link from 'next/link';

/**
 * Demo Mode Banner
 * 
 * Displays when the platform is in demo mode.
 * Shows status, allows exiting demo mode, and links to docs.
 */
export function DemoModeBanner() {
  const { isDemo, isInitializing, disableDemo } = useDemo();

  if (!isDemo) return null;

  return (
    <div className="bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600 text-white px-4 py-2 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/50 via-purple-600/50 to-cyan-600/50 animate-pulse" />
      
      <div className="relative flex items-center justify-between max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-semibold">DEMO MODE</span>
          </div>
          
          <span className="text-sm hidden sm:inline">
            {isInitializing 
              ? 'Initializing demo data...' 
              : 'Exploring YSEEKU with sample data'
            }
          </span>
        </div>

        <div className="flex items-center gap-2">
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
