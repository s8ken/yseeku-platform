'use client';

import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';

type PassportStatus = 'verified' | 'warning' | 'unknown' | 'loading';
type PassportSize = 'small' | 'medium' | 'large';
type PassportTheme = 'light' | 'dark';

interface TrustPassportProps {
  agentId?: string;
  sessionId?: string;
  resonance?: number;
  coherence?: number;
  status?: PassportStatus;
  size?: PassportSize;
  theme?: PassportTheme;
  showDetails?: boolean;
  className?: string;
}

const sizeClasses: Record<PassportSize, string> = {
  small: 'min-w-[140px] h-10 text-xs gap-1.5 px-2',
  medium: 'min-w-[180px] h-14 text-sm gap-2 px-3',
  large: 'min-w-[220px] h-20 text-base gap-3 px-4',
};

const iconSizes: Record<PassportSize, string> = {
  small: 'h-4 w-4',
  medium: 'h-5 w-5',
  large: 'h-6 w-6',
};

const statusConfig: Record<PassportStatus, { color: string; bgColor: string; borderColor: string; Icon: any }> = {
  verified: {
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500',
    Icon: ShieldCheck,
  },
  warning: {
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500',
    Icon: ShieldAlert,
  },
  unknown: {
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500',
    Icon: ShieldQuestion,
  },
  loading: {
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-600',
    Icon: Shield,
  },
};

export function TrustPassport({
  agentId,
  sessionId,
  resonance: propResonance,
  coherence: propCoherence,
  status: propStatus,
  size = 'medium',
  theme = 'dark',
  showDetails = true,
  className = '',
}: TrustPassportProps) {
  const [status, setStatus] = useState<PassportStatus>(propStatus || 'loading');
  const [resonance, setResonance] = useState(propResonance ?? 0);
  const [coherence, setCoherence] = useState(propCoherence ?? 0);

  // Fetch trust status from API
  useEffect(() => {
    if (propStatus) {
      setStatus(propStatus);
      return;
    }

    if (propResonance !== undefined) {
      setResonance(propResonance);
      // Determine status from resonance
      if (propResonance >= 0.7) setStatus('verified');
      else if (propResonance >= 0.4) setStatus('warning');
      else setStatus('unknown');
    }

    if (propCoherence !== undefined) {
      setCoherence(propCoherence);
    }

    // If we have session/agent ID, fetch from API
    const fetchStatus = async () => {
      if (!sessionId && !agentId) {
        setStatus('unknown');
        return;
      }

      try {
        const endpoint = sessionId
          ? `/api/trust/session/${sessionId}/status`
          : `/api/trust/agent/${agentId}/status`;

        const response = await fetch(endpoint, { credentials: 'include' });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setResonance(data.data.resonance ?? 0);
            setCoherence(data.data.coherence ?? 0);

            if (data.data.resonance >= 0.7) setStatus('verified');
            else if (data.data.resonance >= 0.4) setStatus('warning');
            else setStatus('unknown');
          }
        } else {
          setStatus('unknown');
        }
      } catch {
        setStatus('unknown');
      }
    };

    if (!propStatus && (sessionId || agentId)) {
      fetchStatus();
    }
  }, [agentId, sessionId, propStatus, propResonance, propCoherence]);

  const config = statusConfig[status];
  const { Icon } = config;

  const themeClasses = theme === 'dark'
    ? 'bg-gray-900 text-white border-gray-700'
    : 'bg-white text-gray-900 border-gray-200';

  return (
    <div
      className={`
        inline-flex items-center rounded-lg shadow-lg border
        ${sizeClasses[size]}
        ${themeClasses}
        ${config.borderColor}
        ${className}
      `}
      title={`SONATE Trust Passport - ${status.toUpperCase()}`}
    >
      {/* Status indicator dot */}
      <div className={`w-2 h-2 rounded-full ${config.bgColor} ${config.color} animate-pulse`} />

      {/* SONATE Logo/Text */}
      <div className="font-bold tracking-tight">SONATE</div>

      {/* Scores */}
      {showDetails && (
        <div className="flex-1 text-right">
          <div className="opacity-70 leading-tight">Resonance</div>
          <div className="font-mono font-bold leading-tight">
            {status === 'loading' ? '...' : `${(resonance * 100).toFixed(0)}%`}
          </div>
        </div>
      )}

      {/* Status Icon */}
      <Icon className={`${iconSizes[size]} ${config.color}`} />
    </div>
  );
}

/**
 * Embeddable Trust Passport for external websites
 * Renders in an isolated container suitable for iframe embedding
 */
export function EmbeddableTrustPassport(props: TrustPassportProps) {
  return (
    <div className="font-sans antialiased">
      <TrustPassport {...props} />
    </div>
  );
}

export default TrustPassport;
