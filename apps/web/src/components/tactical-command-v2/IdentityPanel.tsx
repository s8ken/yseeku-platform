'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Fingerprint, ExternalLink, AlertTriangle } from 'lucide-react';
import { IdentityRadar, IdentityFingerprint } from '@/components/IdentityRadar';

interface IdentityPanelProps {
  sessionId?: string;
  className?: string;
}

export function IdentityPanel({ sessionId, className = '' }: IdentityPanelProps) {
  const [fingerprint, setFingerprint] = useState<IdentityFingerprint>({
    professionalism: 85,
    empathy: 78,
    accuracy: 92,
    consistency: 88,
    helpfulness: 90,
    boundaries: 82,
  });
  const [previousFingerprint, setPreviousFingerprint] = useState<IdentityFingerprint | undefined>();
  const [shiftDetected, setShiftDetected] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(sessionId);

  // Fetch latest session if not provided
  useEffect(() => {
    if (!sessionId) {
      const fetchLatestSession = async () => {
        try {
          const response = await fetch('/api/trust/receipts/grouped?limit=1', {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.sessions?.[0]) {
              setActiveSessionId(data.data.sessions[0].session_id);
            }
          }
        } catch (error) {
          console.error('Failed to fetch latest session:', error);
        }
      };
      fetchLatestSession();
    }
  }, [sessionId]);

  // Fetch fingerprint when session changes
  useEffect(() => {
    if (!activeSessionId) return;

    const fetchFingerprint = async () => {
      try {
        const response = await fetch(`/api/trust/identity/${activeSessionId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setPreviousFingerprint(fingerprint);
            setFingerprint(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch identity fingerprint:', error);
      }
    };

    fetchFingerprint();
    const interval = setInterval(fetchFingerprint, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [activeSessionId]);

  const handleShiftDetected = (shift: number) => {
    setShiftDetected(true);
    setTimeout(() => setShiftDetected(false), 5000);
  };

  return (
    <Card className={`border-white/10 bg-white/5 text-white lg:col-span-6 ${className}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Fingerprint className="h-5 w-5 text-white/70" />
            Identity Coherence
            {shiftDetected && (
              <span className="ml-2 flex items-center gap-1 text-xs text-red-400 animate-pulse">
                <AlertTriangle className="h-3 w-3" />
                SHIFT
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-white/60">
            Real-time agent identity fingerprint
          </CardDescription>
        </div>
        {activeSessionId && (
          <Link href={`/dashboard/replay/${activeSessionId}`}>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-white/15 bg-white/5 text-white hover:bg-white/10 gap-1"
            >
              Replay
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <IdentityRadar
          fingerprint={fingerprint}
          previousFingerprint={previousFingerprint}
          onShiftDetected={handleShiftDetected}
        />
        {activeSessionId && (
          <div className="mt-2 text-center text-xs text-white/40">
            Session: {activeSessionId.slice(0, 8)}...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default IdentityPanel;
