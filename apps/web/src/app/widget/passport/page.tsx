'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { TrustPassport } from '@/components/TrustPassport';

function PassportWidget() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agent') || undefined;
  const sessionId = searchParams.get('session') || undefined;
  const theme = (searchParams.get('theme') as 'light' | 'dark') || 'dark';
  const size = (searchParams.get('size') as 'small' | 'medium' | 'large') || 'medium';

  const [resonance, setResonance] = useState(0.85);
  const [status, setStatus] = useState<'verified' | 'warning' | 'unknown'>('verified');

  // Fetch real status if we have identifiers
  useEffect(() => {
    const fetchStatus = async () => {
      if (!agentId && !sessionId) {
        // Demo mode - show sample data
        setResonance(0.87);
        setStatus('verified');
        return;
      }

      try {
        const endpoint = sessionId
          ? `/api/trust/session/${sessionId}/status`
          : `/api/trust/agent/${agentId}/status`;

        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setResonance(data.data.resonance || 0);
            if (data.data.resonance >= 0.7) setStatus('verified');
            else if (data.data.resonance >= 0.4) setStatus('warning');
            else setStatus('unknown');
          }
        }
      } catch {
        // Keep defaults on error
      }
    };

    fetchStatus();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [agentId, sessionId]);

  // Notify parent of size for iframe resizing
  useEffect(() => {
    const sizes = {
      small: { width: 150, height: 45 },
      medium: { width: 200, height: 60 },
      large: { width: 240, height: 80 },
    };

    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'sonate-passport-resize',
          ...sizes[size],
        },
        '*'
      );
    }
  }, [size]);

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-2 ${
        theme === 'dark' ? 'bg-transparent' : 'bg-transparent'
      }`}
    >
      <TrustPassport
        agentId={agentId}
        sessionId={sessionId}
        resonance={resonance}
        status={status}
        size={size}
        theme={theme}
      />
    </div>
  );
}

export default function PassportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>}>
      <PassportWidget />
    </Suspense>
  );
}
