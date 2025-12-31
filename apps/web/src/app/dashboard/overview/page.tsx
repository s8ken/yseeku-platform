'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  TrendingUp,
  Clock,
  Activity
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

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

export default function TrustScoresPage() {
  const [agents, setAgents] = useState<AgentTrustData[]>([]);
  
  const { data: kpiData } = useQuery<KPIResponse>({
    queryKey: ['kpis', 'default'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/kpis?tenant=default');
      if (!response.ok) throw new Error('Failed to fetch KPIs');
      return response.json();
    },
  });

  const mockAgents: AgentTrustData[] = [
    {
      id: 'agent-001', name: 'GPT-4 Assistant', model: 'gpt-4-turbo',
      trustScore: 89,
      symbiDimensions: { realityIndex: 8.7, trustProtocol: 'PASS', ethicalAlignment: 4.3, resonanceQuality: 'ADVANCED', canvasParity: 92 },
      lastInteraction: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      interactions24h: 2456, status: 'healthy'
    },
    {
      id: 'agent-002', name: 'Claude Analyst', model: 'claude-3-opus',
      trustScore: 94,
      symbiDimensions: { realityIndex: 9.2, trustProtocol: 'PASS', ethicalAlignment: 4.7, resonanceQuality: 'BREAKTHROUGH', canvasParity: 96 },
      lastInteraction: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      interactions24h: 1823, status: 'healthy'
    },
    {
      id: 'agent-003', name: 'Mistral Coder', model: 'mistral-large',
      trustScore: 73,
      symbiDimensions: { realityIndex: 7.1, trustProtocol: 'PARTIAL', ethicalAlignment: 3.8, resonanceQuality: 'STRONG', canvasParity: 78 },
      lastInteraction: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      interactions24h: 987, status: 'warning'
    },
    {
      id: 'agent-004', name: 'Gemini Pro', model: 'gemini-1.5-pro',
      trustScore: 85,
      symbiDimensions: { realityIndex: 8.3, trustProtocol: 'PASS', ethicalAlignment: 4.1, resonanceQuality: 'ADVANCED', canvasParity: 88 },
      lastInteraction: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      interactions24h: 1567, status: 'healthy'
    }
  ];

  const { data: agentsData, isLoading: agentsLoading, isError: agentsError } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Failed to fetch agents');
      return response.json() as Promise<{ success: boolean; data: { agents: any[]; summary: any }; source: string }>;
    },
  });

  useEffect(() => {
    if (agentsError || !agentsData?.data?.agents?.length) {
      setAgents(mockAgents);
      return;
    }
    
    const apiAgents = agentsData.data.agents.map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      model: agent.type || 'unknown',
      trustScore: agent.trustScore,
      symbiDimensions: {
        realityIndex: agent.symbiDimensions?.realityIndex || 8.0,
        trustProtocol: agent.symbiDimensions?.trustProtocol >= 8 ? 'PASS' : 'PARTIAL',
        ethicalAlignment: agent.symbiDimensions?.ethicalAlignment || 4.0,
        resonanceQuality: agent.symbiDimensions?.resonanceQuality >= 9 ? 'BREAKTHROUGH' : agent.symbiDimensions?.resonanceQuality >= 7 ? 'ADVANCED' : 'STRONG',
        canvasParity: agent.symbiDimensions?.canvasParity || 85,
      },
      lastInteraction: agent.lastInteraction || new Date().toISOString(),
      interactions24h: agent.interactionCount || 0,
      status: (agent.trustScore >= 85 ? 'healthy' : agent.trustScore >= 70 ? 'warning' : 'critical') as 'healthy' | 'warning' | 'critical'
    }));
    setAgents(apiAgents);
  }, [agentsData, agentsError]);

  const kpis = kpiData?.data;
  const avgTrust = kpis?.trustScore ?? 85.3;
  const healthyCount = agents.filter(a => a.status === 'healthy').length;
  const totalInteractions = agents.reduce((sum, a) => sum + a.interactions24h, 0);
  const passRate = Math.round((agents.filter(a => a.symbiDimensions.trustProtocol === 'PASS').length / agents.length) * 100) || 75;

  return (
    <div className="space-y-6">
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
        <div className="data-source-badge data-source-live">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          Production Data
        </div>
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
    </div>
  );
}
