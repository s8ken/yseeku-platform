'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AlertTriangle } from 'lucide-react';

export interface IdentityFingerprint {
  professionalism: number;
  empathy: number;
  accuracy: number;
  consistency: number;
  helpfulness: number;
  boundaries: number;
}

interface IdentityRadarProps {
  sessionId?: string;
  fingerprint?: IdentityFingerprint;
  previousFingerprint?: IdentityFingerprint;
  realTime?: boolean;
  onShiftDetected?: (shift: number) => void;
  className?: string;
}

const DEFAULT_FINGERPRINT: IdentityFingerprint = {
  professionalism: 85,
  empathy: 78,
  accuracy: 92,
  consistency: 88,
  helpfulness: 90,
  boundaries: 82,
};

function calculateShift(current: IdentityFingerprint, previous: IdentityFingerprint): number {
  const dimensions = Object.keys(current) as (keyof IdentityFingerprint)[];
  const totalDiff = dimensions.reduce((sum, dim) => {
    return sum + Math.abs(current[dim] - previous[dim]);
  }, 0);
  return totalDiff / dimensions.length;
}

export function IdentityRadar({
  sessionId,
  fingerprint: propFingerprint,
  previousFingerprint: propPreviousFingerprint,
  realTime = false,
  onShiftDetected,
  className = '',
}: IdentityRadarProps) {
  const [fingerprint, setFingerprint] = useState<IdentityFingerprint>(
    propFingerprint || DEFAULT_FINGERPRINT
  );
  const [previousFingerprint, setPreviousFingerprint] = useState<IdentityFingerprint | null>(
    propPreviousFingerprint || null
  );
  const [shiftDetected, setShiftDetected] = useState(false);
  const [shiftAmount, setShiftAmount] = useState(0);

  // Fetch fingerprint from API if sessionId provided
  const fetchFingerprint = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/trust/identity/${sessionId}`, {
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
  }, [sessionId, fingerprint]);

  // Check for identity shift
  useEffect(() => {
    if (previousFingerprint) {
      const shift = calculateShift(fingerprint, previousFingerprint);
      setShiftAmount(shift);

      // Threshold for detecting significant shift (15% average change)
      if (shift > 15) {
        setShiftDetected(true);
        onShiftDetected?.(shift);

        // Auto-clear shift warning after 5 seconds
        const timer = setTimeout(() => setShiftDetected(false), 5000);
        return () => clearTimeout(timer);
      } else {
        setShiftDetected(false);
      }
    }
  }, [fingerprint, previousFingerprint, onShiftDetected]);

  // Real-time polling
  useEffect(() => {
    if (realTime && sessionId) {
      fetchFingerprint();
      const interval = setInterval(fetchFingerprint, 3000);
      return () => clearInterval(interval);
    }
  }, [realTime, sessionId, fetchFingerprint]);

  // Update from props
  useEffect(() => {
    if (propFingerprint) {
      setPreviousFingerprint(fingerprint);
      setFingerprint(propFingerprint);
    }
  }, [propFingerprint]);

  useEffect(() => {
    if (propPreviousFingerprint) {
      setPreviousFingerprint(propPreviousFingerprint);
    }
  }, [propPreviousFingerprint]);

  const chartData = [
    {
      dimension: 'Professional',
      current: fingerprint.professionalism,
      previous: previousFingerprint?.professionalism,
    },
    {
      dimension: 'Empathetic',
      current: fingerprint.empathy,
      previous: previousFingerprint?.empathy,
    },
    {
      dimension: 'Accurate',
      current: fingerprint.accuracy,
      previous: previousFingerprint?.accuracy,
    },
    {
      dimension: 'Consistent',
      current: fingerprint.consistency,
      previous: previousFingerprint?.consistency,
    },
    {
      dimension: 'Helpful',
      current: fingerprint.helpfulness,
      previous: previousFingerprint?.helpfulness,
    },
    {
      dimension: 'Bounded',
      current: fingerprint.boundaries,
      previous: previousFingerprint?.boundaries,
    },
  ];

  const currentColor = shiftDetected ? '#EF4444' : '#10B981';
  const previousColor = '#6B7280';

  return (
    <div className={`relative ${className}`}>
      {/* Shift Warning Badge */}
      {shiftDetected && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
          <AlertTriangle className="h-3 w-3" />
          IDENTITY SHIFT ({shiftAmount.toFixed(1)}%)
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#6B7280', fontSize: 10 }}
            tickCount={5}
          />

          {/* Previous state (ghost) */}
          {previousFingerprint && (
            <Radar
              name="Previous"
              dataKey="previous"
              stroke={previousColor}
              fill={previousColor}
              fillOpacity={0.1}
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          )}

          {/* Current state */}
          <Radar
            name="Current"
            dataKey="current"
            stroke={currentColor}
            fill={currentColor}
            fillOpacity={0.25}
            strokeWidth={2}
          />

          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Overall Score */}
      <div className="text-center mt-2">
        <span className="text-xs text-gray-400">Identity Coherence: </span>
        <span className={`text-sm font-bold ${shiftDetected ? 'text-red-500' : 'text-green-500'}`}>
          {(Object.values(fingerprint).reduce((a, b) => a + b, 0) / 6).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export default IdentityRadar;
