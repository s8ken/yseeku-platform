'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Shield,
  TrendingUp,
  Clock,
  Activity,
  AlertTriangle,
  FileX,
  RefreshCw,
  CheckCircle2,
  Search,
  Zap,
  ExternalLink
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { ConstitutionalPrinciples } from '@/components/ConstitutionalPrinciples';
import { agentsApi, api } from '@/lib/api';
import { useDashboardKPIs, useTrustAnalytics } from '@/hooks/use-demo-data';
import { useDemo } from '@/hooks/use-demo';
import { useLiveMetrics } from '@/lib/hooks/useLiveMetrics';

interface AgentTrustData {
  id: string;
  name: string;
  model: string;
  trustScore: number;
  sonateDimensions: {
    trustProtocol: string;
    ethicalAlignment: number;
    resonanceQuality: string;
    // Deprecated in v2.0.1 - removed Reality Index and Canvas Parity
  };
  lastInteraction: string;
  interactions24h: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface KPIResponse {
  success: boolean;
  data: {
    trustScore: number;
    activeAgents: number;
    totalInteractions: number;
    complianceRate: number;
    trends: {
      trustScore: { change: number; direction: string };
    };
  };
}

function TrustScoreGauge({ score }: { score: number }) {
  const color = score >= 85 ? 'var(--detect-primary)' : score >= 70 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset} className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold">{score}</span>
      </div>
    </div>
  );
}

function DimensionBadge({ label, value, type, tooltipTerm }: { label: string; value: string | number; type: 'score' | 'status' | 'percent'; tooltipTerm?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-dashed last:border-0">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {label}
        {tooltipTerm && <InfoTooltip term={tooltipTerm} />}
      </span>
      <span className="text-sm font-medium">
        {type === 'score' && `${value}/10`}
        {type === 'status' && (
          <span className={`px-1.5 py-0.5 rounded text-xs ${
            value === 'PASS' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
            value === 'PARTIAL' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>{value}</span>
        )}
        {type === 'percent' && `${value}%`}
      </span>
    </div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <Card className="p-12 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <FileX className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">No Agents Configured</h3>
          <p className="text-muted-foreground max-w-md mx-auto mt-2">
            Add AI agents to your platform to start monitoring trust scores
            and ethical compliance.
          </p>
        </div>
      </div>
    </Card>
  );
}

function ProtocolVerificationTool() {
  const [receiptHash, setReceiptHash] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{ verified: boolean; score?: number } | null>(null);

  const handleVerify = async () => {
    if (!receiptHash.trim()) {
      toast.error('Hash Required', { description: 'Please enter a receipt hash.' });
      return;
    }

    setIsVerifying(true);
    try {
      const json = await api.getTrustReceiptByHash(receiptHash);
      const record = json?.data;
      if (record) {
        setResult({ verified: !!record.verified, score: record.trustScore });
        toast.success('Receipt Verified', { description: 'Cryptographic proof confirmed.' });
      } else {
        setResult({ verified: false });
        toast.error('Verification Failed', { description: 'Receipt not found in ledger.' });
      }
    } catch (error) {
      setResult({ verified: false });
      toast.error('Error', { description: 'Failed to connect to verification node.' });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4 text-[var(--detect-primary)]" />
          Protocol Verification
        </CardTitle>
        <CardDescription className="text-xs">Validate SONATE trust receipts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input 
            placeholder="Paste receipt hash..." 
            className="text-xs h-8"
            value={receiptHash}
            onChange={(e) => setReceiptHash(e.target.value)}
          />
          <Button 
            size="sm" 
            className="h-8 px-3 text-xs" 
            onClick={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Verify'}
          </Button>
        </div>
        {result && (
          <div className={`p-2 rounded-md text-xs flex items-center justify-between ${result.verified ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20' : 'bg-red-50 text-red-700 dark:bg-red-900/20'}`}>
            <div className="flex items-center gap-2">
              {result.verified ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              <span>{result.verified ? 'Valid Receipt' : 'Invalid/Not Found'}</span>
            </div>
            {result.verified && result.score && (
              <span className="font-bold">Score: {result.score}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LiveReceiptStream() {
  const { metrics, connected } = useLiveMetrics();
  
  const getTrustColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            Live Proof of Trust
          </CardTitle>
          <CardDescription className="text-xs">Real-time SONATE receipt stream</CardDescription>
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${connected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-muted text-muted-foreground'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
          {connected ? 'LIVE' : 'OFFLINE'}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[140px] pr-4">
          <div className="space-y-3">
            {metrics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <Zap className="h-5 w-5 mb-2 opacity-20" />
                <p className="text-[10px]">Waiting for receipts...</p>
              </div>
            ) : (
              metrics.slice(0, 10).map((m, i) => (
                <div key={i} className="flex items-center justify-between border-b border-muted pb-2 last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{m.source}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(m.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold ${getTrustColor(m.trustScore)}`}>
                      {Math.round(m.trustScore)}
                    </span>
                    <div className="flex gap-1 justify-end">
                      {m.securityFlags.length > 0 && <AlertTriangle className="h-2 w-2 text-red-500" />}
                      <Shield className="h-2 w-2 text-[var(--detect-primary)]" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function TrustScoresPage() {
  const [agents, setAgents] = useState<AgentTrustData[]>([]);
  const queryClient = useQueryClient();
  const { isDemo } = useDemo();

  // Use demo-aware hooks for consistent data
  const { data: kpisData, isLoading: kpisLoading, refetch: refetchKpis } = useDashboardKPIs();
  const { data: analyticsData, isLoading: analyticsLoading } = useTrustAnalytics();

  // Fetch real agents (these are user's agents, not demo data)
  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.getAgents(),
    staleTime: 30000,
  });

  const isLoading = kpisLoading || analyticsLoading || agentsLoading;

  // Process agents data
  useEffect(() => {
    if (agentsData?.data?.agents?.length) {
      // Use KPIs trust score for consistency
      const avgScore = kpisData?.trustScore || 8.5;
      
      const apiAgents = agentsData.data.agents.map((agent: any) => {
        // Calculate trust score from KPIs or agent data
        const trustScore = agent.trustScore || Math.round(avgScore * 10);
        return {
          id: agent.id || agent._id,
          name: agent.name,
          model: agent.model || agent.type || 'unknown',
          trustScore,
          sonateDimensions: {
            trustProtocol: trustScore >= 85 ? 'PASS' : trustScore >= 70 ? 'PARTIAL' : 'FAIL',
            ethicalAlignment: Number(agent.sonateDimensions?.ethicalAlignment) || kpisData?.sonateDimensions?.ethicalAlignment || avgScore * 0.5,
            resonanceQuality: kpisData?.sonateDimensions?.resonanceQuality || (trustScore >= 85 ? 'ADVANCED' : 'STRONG'),
          },
          lastInteraction: agent.lastInteraction || agent.updatedAt || new Date().toISOString(),
          interactions24h: kpisData?.totalInteractions || agent.interactionCount || 0,
          status: (trustScore >= 85 ? 'healthy' : trustScore >= 70 ? 'warning' : 'critical') as 'healthy' | 'warning' | 'critical'
        };
      });
      setAgents(apiAgents);
    } else {
      setAgents([]);
    }
  }, [agentsData, kpisData]);

  // Extract metrics from the unified KPI data
  const avgTrust = kpisData?.trustScore 
    ? Math.round(kpisData.trustScore * 10) 
    : (agents.length > 0 ? Math.round(agents.reduce((sum, a) => sum + a.trustScore, 0) / agents.length) : 0);
  
  const healthyCount = agents.filter(a => a.status === 'healthy').length;
  const totalInteractions = kpisData?.totalInteractions || agents.reduce((sum, a) => sum + a.interactions24h, 0);
  const passRate = kpisData?.complianceRate ?? (agents.length > 0 
    ? Math.round((agents.filter(a => a.sonateDimensions.trustProtocol === 'PASS').length / agents.length) * 100) 
    : 0);
  
  // Calculate trend from KPIs
  const trendChange = kpisData?.trends?.trustScore?.change || 0;

  const hasData = totalInteractions > 0 || agents.length > 0;

  const handleRefresh = () => {
    refetchKpis();
    queryClient.invalidateQueries({ queryKey: ['agents'] });
  };

  return (
    <div className="space-y-6">
      {!hasData && !isLoading && (
        <div className="demo-notice mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
          <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-blue-800 dark:text-blue-200">No Interaction Data Yet</strong>
            <p className="text-sm text-blue-700 dark:text-blue-300">Start chatting with an AI agent to see your trust metrics populate here.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Enterprise Dashboard Overview
            <Shield className="h-5 w-5 text-[var(--detect-primary)]" />
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="live-indicator">SONATE</span>
            Live governance and trust protocol monitoring
          </p>
        </div>
        <button 
          onClick={handleRefresh}
          className="px-3 py-1.5 text-xs rounded-md bg-muted hover:bg-muted/80 flex items-center gap-2"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh Registry
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-[var(--detect-primary)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-[var(--detect-primary)]" />
              Average Trust Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgTrust}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {trendChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
              )}
              {trendChange >= 0 ? '+' : ''}{trendChange}% trend
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Protocol Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{passRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">SONATE pass rate</p>
          </CardContent>
        </Card>
        
        <div className="md:col-span-2 lg:col-span-2">
          <ProtocolVerificationTool />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ConstitutionalPrinciples compact={true} />
        </div>
        <div>
          <LiveReceiptStream />
        </div>
      </div>

      {!isLoading && agents.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {agents.map((agent) => (
          <Card key={agent.id} className={`${
            agent.status === 'warning' ? 'border-l-4 border-l-amber-500' : 
            agent.status === 'critical' ? 'border-l-4 border-l-red-500' : ''
          }`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {agent.name}
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      agent.status === 'healthy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      agent.status === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {agent.status.toUpperCase()}
                    </span>
                  </CardTitle>
                  <CardDescription>{agent.model}</CardDescription>
                </div>
                <TrustScoreGauge score={agent.trustScore} />
              </div>
            </CardHeader>
            <CardContent>
              {/* Constitutional Principles (Primary) */}
              <div className="space-y-1 mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Constitutional Compliance</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground">Consent</p>
                    <p className={`font-semibold ${agent.trustScore >= 85 ? 'text-emerald-500' : agent.trustScore >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                      {((agent.trustScore / 100) * 10).toFixed(1)}
                    </p>
                  </div>
                  <div className="text-center p-2 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground">Override</p>
                    <p className={`font-semibold ${agent.status === 'healthy' ? 'text-emerald-500' : agent.status === 'warning' ? 'text-amber-500' : 'text-red-500'}`}>
                      {agent.status === 'healthy' ? '✓' : agent.status === 'warning' ? '⚠' : '✗'}
                    </p>
                  </div>
                  <div className="text-center p-2 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground">Disconnect</p>
                    <p className="font-semibold text-emerald-500">✓</p>
                  </div>
                </div>
              </div>
              
              {/* Detection Metrics (Secondary) - v2.0.1 Validated Dimensions Only */}
              <details className="group">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1">
                  <span className="group-open:rotate-90 transition-transform">▶</span>
                  Detection Metrics
                </summary>
                <div className="space-y-1 mt-2 pt-2 border-t border-dashed">
                  <DimensionBadge label="Trust Protocol" value={agent.sonateDimensions.trustProtocol} type="status" tooltipTerm="Trust Protocol" />
                  <DimensionBadge label="Ethical Alignment" value={agent.sonateDimensions.ethicalAlignment} type="score" tooltipTerm="Ethical Alignment" />
                  <div className="flex items-center justify-between py-1.5 border-b border-dashed last:border-0">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      Resonance
                      <InfoTooltip term="Resonance Quality" />
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      agent.sonateDimensions.resonanceQuality === 'BREAKTHROUGH' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      agent.sonateDimensions.resonanceQuality === 'ADVANCED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>{agent.sonateDimensions.resonanceQuality}</span>
                  </div>
                </div>
              </details>
              <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {agent.interactions24h.toLocaleString()} interactions today
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last active
                </span>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}
    </div>
  );
}
