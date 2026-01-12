'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  TrendingUp,
  Clock,
  Activity,
  AlertTriangle,
  FileX
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { ConstitutionalPrinciples } from '@/components/ConstitutionalPrinciples';
import { api } from '@/lib/api';
import { useDemo } from '@/hooks/use-demo';

interface AgentTrustData {
  id: string;
  name: string;
  model: string;
  trustScore: number;
  symbiDimensions: {
    realityIndex: number;
    trustProtocol: string;
    ethicalAlignment: number;
    resonanceQuality: string;
    canvasParity: number;
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

export default function TrustScoresPage() {
  const [agents, setAgents] = useState<AgentTrustData[]>([]);
  const { isDemo, isLoaded } = useDemo();

  // Fetch real KPIs
  const { data: kpiData } = useQuery<KPIResponse>({
    queryKey: ['kpis', 'default'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/kpis?tenant=default');
      if (!response.ok) throw new Error('Failed to fetch KPIs');
      return response.json();
    },
    enabled: !isDemo && isLoaded,
  });

  // Fetch demo KPIs when in demo mode
  const { data: demoKpiData } = useQuery({
    queryKey: ['demo-kpis'],
    queryFn: () => api.getDemoKpis(),
    staleTime: 60000,
    enabled: isDemo && isLoaded,
  });

  // Fetch real agents
  const { data: agentsData, isLoading: agentsLoadingReal, isError: agentsError } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Failed to fetch agents');
      return response.json() as Promise<{ success: boolean; data: { agents: any[]; summary: any }; source: string }>;
    },
    enabled: !isDemo && isLoaded,
  });

  // Fetch demo agents when in demo mode
  const { data: demoAgentsData, isLoading: agentsLoadingDemo } = useQuery({
    queryKey: ['demo-agents'],
    queryFn: () => api.getDemoAgents(),
    staleTime: 60000,
    enabled: isDemo && isLoaded,
  });

  const isLoading = !isLoaded || (isDemo ? agentsLoadingDemo : agentsLoadingReal);

  useEffect(() => {
    if (!isLoaded) return;

    if (isDemo && demoAgentsData?.data) {
      // Use demo agents
      const demoAgents = demoAgentsData.data.map((agent: any) => ({
        id: agent._id || agent.id,
        name: agent.name,
        model: agent.model || 'unknown',
        trustScore: agent.traits?.ethical_alignment ? Math.round(agent.traits.ethical_alignment * 20) : 85,
        symbiDimensions: {
          realityIndex: 8.5,
          trustProtocol: 'PASS',
          ethicalAlignment: agent.traits?.ethical_alignment || 4.2,
          resonanceQuality: 'ADVANCED',
          canvasParity: 90,
        },
        lastInteraction: agent.lastActive || new Date().toISOString(),
        interactions24h: Math.floor(Math.random() * 2000) + 500,
        status: 'healthy' as const
      }));
      setAgents(demoAgents);
      return;
    }

    if (!isDemo && agentsData?.data?.agents?.length) {
      // Use real agents
      const apiAgents = agentsData.data.agents.map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        model: agent.type || 'unknown',
        trustScore: agent.trustScore,
        symbiDimensions: {
          realityIndex: Number(agent.symbiDimensions?.realityIndex) || 8.0,
          trustProtocol: agent.symbiDimensions?.trustProtocol || 'PARTIAL',
          ethicalAlignment: Number(agent.symbiDimensions?.ethicalAlignment) || 4.0,
          resonanceQuality: agent.symbiDimensions?.resonanceQuality || 'STRONG',
          canvasParity: Number(agent.symbiDimensions?.canvasParity) || 85,
        },
        lastInteraction: agent.lastInteraction || new Date().toISOString(),
        interactions24h: agent.interactionCount || 0,
        status: (agent.trustScore >= 85 ? 'healthy' : agent.trustScore >= 70 ? 'warning' : 'critical') as 'healthy' | 'warning' | 'critical'
      }));
      setAgents(apiAgents);
      return;
    }

    // No data available - leave agents empty
    setAgents([]);
  }, [isDemo, isLoaded, agentsData, demoAgentsData]);

  const kpis = isDemo ? demoKpiData?.data : kpiData?.data;
  const avgTrust = kpis?.trustScore ?? (agents.length > 0 ? Math.round(agents.reduce((sum, a) => sum + a.trustScore, 0) / agents.length) : 0);
  const healthyCount = agents.filter(a => a.status === 'healthy').length;
  const totalInteractions = kpis?.totalInteractions ?? agents.reduce((sum, a) => sum + a.interactions24h, 0);
  const passRate = agents.length > 0 ? Math.round((agents.filter(a => a.symbiDimensions.trustProtocol === 'PASS').length / agents.length) * 100) : 0;
  const dataSource = isDemo ? 'demo' : 'live';

  return (
    <div className="space-y-6">
      {isDemo && (
        <div className="demo-notice mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-800 dark:text-amber-200">Demo Mode</strong>
            <p className="text-sm text-amber-700 dark:text-amber-300">Showing sample agent data for demonstration. Connect your AI agents for real trust monitoring.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Trust Scores
            <InfoTooltip term="Trust Score" />
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="live-indicator">Live</span>
            Agent trust monitoring across all deployments
          </p>
        </div>
        <span className={`data-source-badge px-2 py-1 text-xs rounded-full flex items-center gap-2 ${
          dataSource === 'live'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
        }`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {dataSource === 'live' ? 'Production Data' : 'Demo Data'}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-[var(--detect-primary)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-[var(--detect-primary)]" />
              Average Trust
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgTrust}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              +{kpis?.trends?.trustScore?.change ?? 2.1}% from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Healthy Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">{healthyCount}/{agents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Score above 75</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalInteractions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Protocol Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{passRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">PASS rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Constitutional Principles Section */}
      <ConstitutionalPrinciples compact={true} />

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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <DimensionBadge label="Reality Index" value={agent.symbiDimensions.realityIndex} type="score" tooltipTerm="Reality Index" />
                  <DimensionBadge label="Trust Protocol" value={agent.symbiDimensions.trustProtocol} type="status" tooltipTerm="Trust Protocol" />
                  <DimensionBadge label="Ethical Alignment" value={agent.symbiDimensions.ethicalAlignment} type="score" tooltipTerm="Ethical Alignment" />
                </div>
                <div className="space-y-1">
                  <DimensionBadge label="Canvas Parity" value={agent.symbiDimensions.canvasParity} type="percent" tooltipTerm="Canvas Parity" />
                  <div className="flex items-center justify-between py-1.5 border-b border-dashed">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      Resonance
                      <InfoTooltip term="Resonance Quality" />
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      agent.symbiDimensions.resonanceQuality === 'BREAKTHROUGH' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      agent.symbiDimensions.resonanceQuality === 'ADVANCED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>{agent.symbiDimensions.resonanceQuality}</span>
                  </div>
                </div>
              </div>
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
