'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Shield, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

export function OverseerWidget() {
  const { data: overseerStatus, isLoading, error, refetch } = useQuery({
    queryKey: ['overseer-status'],
    queryFn: () => api.getOverseerStatus(),
    refetchInterval: 30000
  });

  const [isThinking, setIsThinking] = useState(false);

  const handleThink = async () => {
    try {
      setIsThinking(true);
      await api.triggerOverseerThink();
      // Wait a moment before refetching to allow backend to process
      setTimeout(() => {
        refetch();
        setIsThinking(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to trigger thinking cycle:', error);
      setIsThinking(false);
    }
  };
  
  useEffect(() => {
    if (error) console.error('Overseer Widget Error:', error);
    if (overseerStatus) console.log('Overseer Status:', overseerStatus);
  }, [overseerStatus, error]);

  if (isLoading) return <div className="h-24 w-full bg-muted/50 animate-pulse rounded-lg mb-6" />;
  if (error) return <div className="text-red-500 text-sm mb-6">System Brain Connection Failed</div>;
  // If no data, render a placeholder instead of null to debug visibility
  if (!overseerStatus) {
      return (
          <div className="p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              Waiting for Overseer status...
          </div>
      );
  }
  
  return (
    <div className="space-y-4">
      {/* Header Badge */}
      <div className="flex justify-end mb-4">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${
          overseerStatus.status === 'active' 
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
        }`}>
          <Brain size={16} className={overseerStatus.status === 'active' ? "animate-pulse" : ""} />
          OVERSEER: {overseerStatus.status.toUpperCase()}
        </div>
      </div>

      {/* Main Banner */}
      {overseerStatus.message && (
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-none text-white overflow-hidden relative shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Brain size={120} />
          </div>
          <CardContent className="flex items-center justify-between p-6 relative z-10">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                <Brain size={20} className="text-purple-400" />
                System Brain Active
              </h3>
              <p className="text-slate-300 text-lg font-light max-w-2xl italic">
                "{overseerStatus.message}"
              </p>
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Zap size={12} />
                  Last thought: <TimeDisplay date={overseerStatus.lastThought} />
                </span>
                {overseerStatus.metrics && (
                  <span className="flex items-center gap-1">
                    <Shield size={12} />
                    System Trust: {overseerStatus.metrics.systemTrustScore?.toFixed(1) || 'N/A'}/10
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white min-w-[160px]"
                onClick={handleThink}
                disabled={isThinking}
              >
                {isThinking ? (
                  <>
                    <Brain size={16} className="mr-2 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Zap size={16} className="mr-2" />
                    Force Think Cycle
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TimeDisplay({ date }: { date: string }) {
  const [time, setTime] = useState<string>('');
  
  useEffect(() => {
    try {
        setTime(new Date(date).toLocaleTimeString());
    } catch (e) {
        setTime('Just now');
    }
  }, [date]);
  
  return <>{time || '...'}</>;
}
