'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSocket, ConnectionStatus as Status } from '@/hooks/use-socket';

interface ConnectionStatusProps {
  className?: string;
  showLabel?: boolean;
}

const statusConfig: Record<Status, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  label: string;
  description: string;
}> = {
  connected: {
    icon: Wifi,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500',
    label: 'Connected',
    description: 'Real-time updates are active',
  },
  connecting: {
    icon: Loader2,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500',
    label: 'Connecting',
    description: 'Establishing connection...',
  },
  disconnected: {
    icon: WifiOff,
    color: 'text-slate-400',
    bgColor: 'bg-slate-400',
    label: 'Offline',
    description: 'Real-time updates unavailable',
  },
  reconnecting: {
    icon: Loader2,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500',
    label: 'Reconnecting',
    description: 'Attempting to reconnect...',
  },
};

export function ConnectionStatus({ className, showLabel = false }: ConnectionStatusProps) {
  const { status, connect } = useSocket();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Auto-connect on mount
    connect();
  }, [connect]);

  if (!mounted) {
    return null;
  }

  const config = statusConfig[status];
  const Icon = config.icon;
  const isAnimating = status === 'connecting' || status === 'reconnecting';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors",
              className
            )}
            onClick={() => {
              if (status === 'disconnected') {
                connect();
              }
            }}
          >
            {/* Status dot */}
            <span className="relative flex h-2 w-2">
              {status === 'connected' && (
                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", config.bgColor)} />
              )}
              <span className={cn("relative inline-flex rounded-full h-2 w-2", config.bgColor)} />
            </span>

            <Icon className={cn(
              "h-4 w-4",
              config.color,
              isAnimating && "animate-spin"
            )} />

            {showLabel && (
              <span className={cn("text-xs font-medium", config.color)}>
                {config.label}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="text-sm">
            <div className="font-semibold flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", config.bgColor)} />
              {config.label}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {config.description}
            </p>
            {status === 'disconnected' && (
              <p className="text-xs text-primary mt-2 cursor-pointer">
                Click to reconnect
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
