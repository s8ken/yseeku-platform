'use client';

import { useDemo } from '@/hooks/use-demo';

interface DemoWatermarkProps {
  /** Position of the watermark */
  position?: 'top-right' | 'bottom-right' | 'center' | 'top-left' | 'bottom-left';
  /** Size of the watermark text */
  size?: 'sm' | 'md' | 'lg';
  /** Opacity of the watermark (0-100) */
  opacity?: number;
  /** Custom class name */
  className?: string;
}

/**
 * Demo Watermark Component
 * 
 * Displays a subtle "DEMO" watermark on charts and exports when in demo mode.
 * Only renders when demo mode is active.
 */
export function DemoWatermark({ 
  position = 'bottom-right',
  size = 'md',
  opacity = 15,
  className = ''
}: DemoWatermarkProps) {
  const { isDemo } = useDemo();

  if (!isDemo) return null;

  const positionClasses = {
    'top-right': 'top-2 right-2',
    'bottom-right': 'bottom-2 right-2',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'top-left': 'top-2 left-2',
    'bottom-left': 'bottom-2 left-2',
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <div 
      className={`absolute ${positionClasses[position]} ${sizeClasses[size]} pointer-events-none select-none z-10 ${className}`}
      style={{ opacity: opacity / 100 }}
    >
      <div className="bg-gray-500/30 text-gray-700 dark:text-gray-300 font-bold rounded border border-gray-400/20 tracking-wider">
        DEMO
      </div>
    </div>
  );
}

/**
 * Demo Watermark Overlay
 * 
 * A diagonal watermark that spans the entire container.
 * Use for exports or when a more prominent watermark is needed.
 */
export function DemoWatermarkOverlay({ 
  opacity = 8,
  className = '' 
}: { 
  opacity?: number; 
  className?: string;
}) {
  const { isDemo } = useDemo();

  if (!isDemo) return null;

  return (
    <div 
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden z-10 ${className}`}
      style={{ opacity: opacity / 100 }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="text-6xl font-bold text-gray-500 tracking-[0.5em] transform -rotate-45 whitespace-nowrap"
          style={{ 
            textShadow: '2px 2px 0 rgba(255,255,255,0.5)',
          }}
        >
          DEMO DATA
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper component that adds demo watermark to its children
 */
export function WithDemoWatermark({ 
  children, 
  position = 'bottom-right',
  size = 'sm',
  opacity = 20,
  className = ''
}: DemoWatermarkProps & { children: React.ReactNode }) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <DemoWatermark position={position} size={size} opacity={opacity} />
    </div>
  );
}
