'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { IdentityRadar, IdentityFingerprint } from '@/components/IdentityRadar';
import { TrustPassport } from '@/components/TrustPassport';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  AlertTriangle,
  Clock,
  MessageSquare,
  Shield,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ReplayData {
  messages: Message[];
  trustScores: number[];
  fingerprints: IdentityFingerprint[];
  receipts: any[];
}

export default function TacticalReplayPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [data, setData] = useState<ReplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Load conversation replay data from unified /api/replay/:sessionId endpoint
  useEffect(() => {
    const fetchReplayData = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/replay/${sessionId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to load replay data');
        }

        const json = await response.json();
        const bundle = json.data;

        setData({
          messages:    bundle.messages    ?? [],
          trustScores: bundle.trustScores ?? [],
          fingerprints: bundle.fingerprints ?? [],
          receipts:    bundle.receipts    ?? [],
        });
      } catch (err) {
        console.error('Replay load error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load replay data');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchReplayData();
    }
  }, [sessionId]);

  // Playback logic
  useEffect(() => {
    if (playing && data && currentIndex < data.messages.length - 1) {
      const timer = setTimeout(
        () => setCurrentIndex((i) => i + 1),
        1500 / playbackSpeed
      );
      return () => clearTimeout(timer);
    } else if (playing && data && currentIndex >= data.messages.length - 1) {
      setPlaying(false);
    }
  }, [playing, currentIndex, data, playbackSpeed]);

  const handleSliderChange = useCallback((value: number[]) => {
    setCurrentIndex(value[0]);
    setPlaying(false);
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading replay data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-500 mb-2">Failed to Load Replay</h2>
            <p className="text-muted-foreground mb-4">{error || 'No data available'}</p>
            <Button variant="outline" onClick={() => router.back()}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentTrust = data.trustScores[currentIndex] || 0;
  const previousTrust = currentIndex > 0 ? data.trustScores[currentIndex - 1] : currentTrust;
  const trustDelta = currentTrust - previousTrust;

  const currentFingerprint = data.fingerprints[currentIndex];
  const previousFingerprint = currentIndex > 0 ? data.fingerprints[currentIndex - 1] : undefined;

  const getTrustColor = (score: number) => {
    if (score >= 0.7) return 'text-green-500';
    if (score >= 0.4) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getTrustBgColor = (score: number) => {
    if (score >= 0.7) return 'bg-green-500';
    if (score >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tactical Replay</h1>
            <p className="text-muted-foreground text-sm">
              Session: {sessionId.slice(0, 12)}...
            </p>
          </div>
        </div>
        <TrustPassport
          sessionId={sessionId}
          resonance={currentTrust}
          status={currentTrust >= 0.7 ? 'verified' : currentTrust >= 0.4 ? 'warning' : 'unknown'}
          size="small"
        />
      </div>

      {/* Timeline Scrubber */}
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant={playing ? 'destructive' : 'default'}
              size="sm"
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(Math.min(data.messages.length - 1, currentIndex + 1))}
              disabled={currentIndex >= data.messages.length - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <div className="flex-1">
              <Slider
                value={[currentIndex]}
                max={data.messages.length - 1}
                step={1}
                onValueChange={handleSliderChange}
                className="cursor-pointer"
              />
            </div>

            <span className="text-sm text-gray-400 tabular-nums w-20 text-right">
              {currentIndex + 1} / {data.messages.length}
            </span>

            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
            </select>
          </div>

          {/* Trust Score Timeline Bar */}
          <div className="h-16 flex items-end gap-0.5 rounded overflow-hidden">
            {data.trustScores.map((score, i) => (
              <div
                key={i}
                className={`flex-1 transition-all duration-200 cursor-pointer hover:opacity-80 ${
                  i <= currentIndex ? 'opacity-100' : 'opacity-30'
                }`}
                style={{
                  height: `${score * 100}%`,
                  backgroundColor:
                    score >= 0.7 ? '#10B981' : score >= 0.4 ? '#F59E0B' : '#EF4444',
                }}
                onClick={() => {
                  setCurrentIndex(i);
                  setPlaying(false);
                }}
                title={`Turn ${i + 1}: ${(score * 100).toFixed(1)}%`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversation View */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversation Replay
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto space-y-2">
            {data.messages.slice(0, currentIndex + 1).map((msg, i) => (
              <div
                key={msg.id || i}
                className={`p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-900/50 border border-blue-700'
                    : 'bg-gray-800 border border-gray-700'
                } ${i === currentIndex ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400 capitalize">{msg.role}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{msg.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Trust Metrics */}
        <div className="space-y-4">
          {/* Trust Score Card */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Trust Score at Turn {currentIndex + 1}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${getTrustColor(currentTrust)}`}>
                  {(currentTrust * 100).toFixed(1)}%
                </span>
                {trustDelta !== 0 && (
                  <span
                    className={`text-sm font-medium ${
                      trustDelta > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {trustDelta > 0 ? '↑' : '↓'} {Math.abs(trustDelta * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getTrustBgColor(currentTrust)}`}
                  style={{ width: `${currentTrust * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Identity Radar */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Identity Fingerprint</CardTitle>
            </CardHeader>
            <CardContent>
              <IdentityRadar
                fingerprint={currentFingerprint}
                previousFingerprint={previousFingerprint}
              />
            </CardContent>
          </Card>

          {/* Timestamp */}
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-400">Message Time</div>
                <div className="font-mono">
                  {data.messages[currentIndex]
                    ? new Date(data.messages[currentIndex].timestamp).toLocaleString()
                    : 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
