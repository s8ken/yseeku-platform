'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, RefreshCw, Shield, Activity, BarChart3, Waves } from 'lucide-react';
import { fetchAPI } from '@/lib/api/client';
import { PhaseShiftVelocityWidget } from '@/components/PhaseShiftVelocityWidget';
import { DriftDetectionWidget } from '@/components/DriftDetectionWidget';
import { LinguisticEmergenceWidget } from '@/components/LinguisticEmergenceWidget';

interface ConversationDetail {
  id: string;
  title?: string;
  agentId?: string;
  agentName?: string;
  createdAt?: string;
  updatedAt?: string;
  messageCount?: number;
  trustScore?: number;
  status?: string;
}

export default function ConversationDetailPage() {
  const params = useParams();
  const conversationId = params?.id as string;

  const {
    data: convResp,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () =>
      fetchAPI<{ success: boolean; data: ConversationDetail }>(
        `/api/conversations/${conversationId}`
      ).catch(() => ({ success: false, data: null as any })),
    enabled: !!conversationId,
  });

  const conv: ConversationDetail | null = convResp?.data ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/interactions">
            <Button variant="ghost" size="icon" className="mt-0.5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
              Conversation Analysis
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5 font-mono">
              ID: {conversationId}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Conversation Metadata */}
      {!isLoading && conv && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Conversation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {conv.agentName && (
                <div>
                  <div className="text-muted-foreground text-xs">Agent</div>
                  <div className="font-medium">{conv.agentName}</div>
                </div>
              )}
              {conv.trustScore !== undefined && (
                <div>
                  <div className="text-muted-foreground text-xs">Trust Score</div>
                  <div className="font-medium">{Number(conv.trustScore).toFixed(1)}/10</div>
                </div>
              )}
              {conv.messageCount !== undefined && (
                <div>
                  <div className="text-muted-foreground text-xs">Messages</div>
                  <div className="font-medium">{conv.messageCount}</div>
                </div>
              )}
              {conv.status && (
                <div>
                  <div className="text-muted-foreground text-xs">Status</div>
                  <Badge variant="outline">{conv.status}</Badge>
                </div>
              )}
              {conv.createdAt && (
                <div>
                  <div className="text-muted-foreground text-xs">Started</div>
                  <div className="font-medium">{new Date(conv.createdAt).toLocaleString()}</div>
                </div>
              )}
              {conv.updatedAt && (
                <div>
                  <div className="text-muted-foreground text-xs">Last Activity</div>
                  <div className="font-medium">{new Date(conv.updatedAt).toLocaleString()}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error / Not found state */}
      {isError && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="pt-4">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Conversation metadata not available. Detection signals below may still have data.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detection Signals — 3 widgets */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          Detection Signals
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                Phase-Shift Velocity
              </CardTitle>
              <CardDescription className="text-xs">Identity drift detection</CardDescription>
            </CardHeader>
            <CardContent>
              <PhaseShiftVelocityWidget conversationId={conversationId} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-600" />
                Drift Detection
              </CardTitle>
              <CardDescription className="text-xs">Text property monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <DriftDetectionWidget conversationId={conversationId} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Waves className="h-4 w-4 text-purple-600" />
                Linguistic Emergence
              </CardTitle>
              <CardDescription className="text-xs">Pattern classification</CardDescription>
            </CardHeader>
            <CardContent>
              <LinguisticEmergenceWidget conversationId={conversationId} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link href={`/dashboard/receipts?conversation=${conversationId}`}>
          <Button variant="outline" size="sm">View Trust Receipt</Button>
        </Link>
        <Link href="/dashboard/brain?tab=recommendations">
          <Button variant="outline" size="sm">System Brain Recommendations</Button>
        </Link>
        <Link href="/dashboard/agents">
          <Button variant="outline" size="sm">View Agents</Button>
        </Link>
      </div>
    </div>
  );
}
