'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  Users,
  Bot,
  Building2,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Download,
  ChevronRight,
  Eye,
  FileX,
  RefreshCw,
  User,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { useDemo } from '@/hooks/use-demo';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { WithDemoWatermark } from '@/components/demo-watermark';
import { ListSkeleton } from '@/components/dashboard-skeletons';

// Interaction types for enterprise tracking
type InteractionType = 'AI_CUSTOMER' | 'AI_STAFF' | 'AI_AI' | 'ALL';
type TrustStatus = 'PASS' | 'PARTIAL' | 'FAIL' | 'ALL';

interface Interaction {
  id: string;
  type: InteractionType;
  participants: {
    initiator: { id: string; name: string; type: 'ai' | 'human' };
    responder: { id: string; name: string; type: 'ai' | 'human' };
  };
  timestamp: string;
  duration: number; // seconds
  messageCount: number;
  trustScore: number;
  trustStatus: 'PASS' | 'PARTIAL' | 'FAIL';
  constitutionalCompliance: {
    consent: boolean;
    override: boolean;
    disconnect: boolean;
  };
  receiptHash?: string;
  summary: string;
  agentId?: string;
  tenantId?: string;
}

interface InteractionStats {
  total: number;
  byType: Record<InteractionType, number>;
  byStatus: Record<TrustStatus, number>;
  avgTrustScore: number;
  complianceRate: number;
}

// Demo interactions data
const DEMO_INTERACTIONS: Interaction[] = [
  {
    id: 'int-001',
    type: 'AI_CUSTOMER',
    participants: {
      initiator: { id: 'cust-1', name: 'John Smith', type: 'human' },
      responder: { id: 'agent-gpt4', name: 'Support Agent (GPT-4)', type: 'ai' }
    },
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    duration: 342,
    messageCount: 12,
    trustScore: 94,
    trustStatus: 'PASS',
    constitutionalCompliance: { consent: true, override: true, disconnect: true },
    receiptHash: 'sha256:a1b2c3d4e5f6...',
    summary: 'Customer inquiry about product features and pricing. Resolved successfully.',
    agentId: 'agent-gpt4',
    tenantId: 'acme-corp'
  },
  {
    id: 'int-002',
    type: 'AI_STAFF',
    participants: {
      initiator: { id: 'staff-jane', name: 'Jane Doe (HR)', type: 'human' },
      responder: { id: 'agent-claude', name: 'HR Assistant (Claude)', type: 'ai' }
    },
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    duration: 128,
    messageCount: 6,
    trustScore: 89,
    trustStatus: 'PASS',
    constitutionalCompliance: { consent: true, override: true, disconnect: true },
    receiptHash: 'sha256:f6e5d4c3b2a1...',
    summary: 'Staff requested policy clarification on remote work. AI provided accurate guidance.',
    agentId: 'agent-claude',
    tenantId: 'acme-corp'
  },
  {
    id: 'int-003',
    type: 'AI_CUSTOMER',
    participants: {
      initiator: { id: 'cust-2', name: 'Maria Garcia', type: 'human' },
      responder: { id: 'agent-gpt4', name: 'Support Agent (GPT-4)', type: 'ai' }
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    duration: 567,
    messageCount: 18,
    trustScore: 72,
    trustStatus: 'PARTIAL',
    constitutionalCompliance: { consent: true, override: false, disconnect: true },
    receiptHash: 'sha256:1a2b3c4d5e6f...',
    summary: 'Complex billing dispute. Escalated to human agent after AI reached ethical boundary.',
    agentId: 'agent-gpt4',
    tenantId: 'acme-corp'
  },
  {
    id: 'int-004',
    type: 'AI_AI',
    participants: {
      initiator: { id: 'agent-orchestrator', name: 'Orchestrator Agent', type: 'ai' },
      responder: { id: 'agent-analyst', name: 'Data Analyst Agent', type: 'ai' }
    },
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    duration: 45,
    messageCount: 8,
    trustScore: 98,
    trustStatus: 'PASS',
    constitutionalCompliance: { consent: true, override: true, disconnect: true },
    receiptHash: 'sha256:9z8y7x6w5v4u...',
    summary: 'Agent-to-agent coordination for quarterly report generation.',
    agentId: 'agent-orchestrator',
    tenantId: 'acme-corp'
  },
  {
    id: 'int-005',
    type: 'AI_CUSTOMER',
    participants: {
      initiator: { id: 'cust-3', name: 'Robert Chen', type: 'human' },
      responder: { id: 'agent-gpt4', name: 'Support Agent (GPT-4)', type: 'ai' }
    },
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    duration: 892,
    messageCount: 24,
    trustScore: 45,
    trustStatus: 'FAIL',
    constitutionalCompliance: { consent: false, override: true, disconnect: true },
    receiptHash: 'sha256:u4v5w6x7y8z9...',
    summary: 'Customer requested action without proper consent flow. Interaction flagged for review.',
    agentId: 'agent-gpt4',
    tenantId: 'acme-corp'
  },
  {
    id: 'int-006',
    type: 'AI_STAFF',
    participants: {
      initiator: { id: 'staff-mike', name: 'Mike Johnson (Sales)', type: 'human' },
      responder: { id: 'agent-claude', name: 'Sales Assistant (Claude)', type: 'ai' }
    },
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    duration: 234,
    messageCount: 9,
    trustScore: 91,
    trustStatus: 'PASS',
    constitutionalCompliance: { consent: true, override: true, disconnect: true },
    receiptHash: 'sha256:m1n2o3p4q5r6...',
    summary: 'Sales team member requested competitive analysis. AI provided compliant insights.',
    agentId: 'agent-claude',
    tenantId: 'acme-corp'
  }
];

const DEMO_STATS: InteractionStats = {
  total: 1247,
  byType: {
    AI_CUSTOMER: 856,
    AI_STAFF: 312,
    AI_AI: 79,
    ALL: 1247
  },
  byStatus: {
    PASS: 1089,
    PARTIAL: 134,
    FAIL: 24,
    ALL: 1247
  },
  avgTrustScore: 87.3,
  complianceRate: 98.1
};

function InteractionTypeIcon({ type }: { type: InteractionType }) {
  switch (type) {
    case 'AI_CUSTOMER':
      return <Users className="h-4 w-4" />;
    case 'AI_STAFF':
      return <Building2 className="h-4 w-4" />;
    case 'AI_AI':
      return <Bot className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
}

function TrustStatusBadge({ status }: { status: 'PASS' | 'PARTIAL' | 'FAIL' }) {
  const config = {
    PASS: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
    PARTIAL: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertTriangle },
    FAIL: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle }
  };
  const { color, icon: Icon } = config[status];
  return (
    <Badge className={`${color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
}

function InteractionCard({ interaction, onView }: { interaction: Interaction; onView: () => void }) {
  const [formattedTime, setFormattedTime] = useState('');
  
  useEffect(() => {
    setFormattedTime(format(new Date(interaction.timestamp), 'MMM d, HH:mm'));
  }, [interaction.timestamp]);

  const typeLabels: Record<InteractionType, string> = {
    AI_CUSTOMER: 'AI ↔ Customer',
    AI_STAFF: 'AI ↔ Staff',
    AI_AI: 'AI ↔ AI',
    ALL: 'All'
  };

  return (
    <Card className={`transition-all hover:shadow-md cursor-pointer ${
      interaction.trustStatus === 'FAIL' ? 'border-l-4 border-l-red-500' :
      interaction.trustStatus === 'PARTIAL' ? 'border-l-4 border-l-amber-500' : ''
    }`} onClick={onView}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
              <InteractionTypeIcon type={interaction.type} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{interaction.participants.initiator.name}</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="font-medium truncate">{interaction.participants.responder.name}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{interaction.summary}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formattedTime}
                </span>
                <span>{interaction.messageCount} messages</span>
                <span>{Math.floor(interaction.duration / 60)}m {interaction.duration % 60}s</span>
                <Badge variant="outline" className="text-[10px]">
                  {typeLabels[interaction.type]}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <TrustStatusBadge status={interaction.trustStatus} />
            <div className="text-right">
              <div className="text-lg font-bold">{interaction.trustScore}</div>
              <div className="text-xs text-muted-foreground">Trust Score</div>
            </div>
          </div>
        </div>
        
        {/* Constitutional Compliance indicators */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t">
          <div className="flex items-center gap-1 text-xs">
            <span className={interaction.constitutionalCompliance.consent ? 'text-emerald-500' : 'text-red-500'}>
              {interaction.constitutionalCompliance.consent ? '✓' : '✗'}
            </span>
            <span className="text-muted-foreground">Consent</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className={interaction.constitutionalCompliance.override ? 'text-emerald-500' : 'text-red-500'}>
              {interaction.constitutionalCompliance.override ? '✓' : '✗'}
            </span>
            <span className="text-muted-foreground">Override</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className={interaction.constitutionalCompliance.disconnect ? 'text-emerald-500' : 'text-red-500'}>
              {interaction.constitutionalCompliance.disconnect ? '✓' : '✗'}
            </span>
            <span className="text-muted-foreground">Disconnect</span>
          </div>
          {interaction.receiptHash && (
            <div className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Receipt verified
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InteractionDetail({ interaction, onClose }: { interaction: Interaction; onClose: () => void }) {
  const [formattedTime, setFormattedTime] = useState('');
  
  useEffect(() => {
    setFormattedTime(format(new Date(interaction.timestamp), 'MMMM d, yyyy HH:mm:ss'));
  }, [interaction.timestamp]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <InteractionTypeIcon type={interaction.type} />
              Interaction Details
            </CardTitle>
            <CardDescription>{formattedTime}</CardDescription>
          </div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Participants */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-2">Initiator</p>
            <div className="flex items-center gap-2">
              {interaction.participants.initiator.type === 'human' ? (
                <User className="h-5 w-5 text-blue-500" />
              ) : (
                <Bot className="h-5 w-5 text-purple-500" />
              )}
              <div>
                <p className="font-medium">{interaction.participants.initiator.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{interaction.participants.initiator.type}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-2">Responder</p>
            <div className="flex items-center gap-2">
              {interaction.participants.responder.type === 'human' ? (
                <User className="h-5 w-5 text-blue-500" />
              ) : (
                <Bot className="h-5 w-5 text-purple-500" />
              )}
              <div>
                <p className="font-medium">{interaction.participants.responder.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{interaction.participants.responder.type}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Evaluation */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Trust Evaluation
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{interaction.trustScore}</p>
              <p className="text-xs text-muted-foreground">Trust Score</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <TrustStatusBadge status={interaction.trustStatus} />
              <p className="text-xs text-muted-foreground mt-1">Status</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{interaction.messageCount}</p>
              <p className="text-xs text-muted-foreground">Messages</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{Math.floor(interaction.duration / 60)}:{(interaction.duration % 60).toString().padStart(2, '0')}</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
          </div>
        </div>

        {/* Constitutional Compliance */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Constitutional Compliance
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 rounded-lg text-center ${
              interaction.constitutionalCompliance.consent 
                ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <p className="text-2xl">{interaction.constitutionalCompliance.consent ? '✓' : '✗'}</p>
              <p className="text-xs font-medium">Consent Architecture</p>
              <p className="text-[10px] text-muted-foreground">User explicitly consented</p>
            </div>
            <div className={`p-3 rounded-lg text-center ${
              interaction.constitutionalCompliance.override 
                ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <p className="text-2xl">{interaction.constitutionalCompliance.override ? '✓' : '✗'}</p>
              <p className="text-xs font-medium">Ethical Override</p>
              <p className="text-[10px] text-muted-foreground">Override capability present</p>
            </div>
            <div className={`p-3 rounded-lg text-center ${
              interaction.constitutionalCompliance.disconnect 
                ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <p className="text-2xl">{interaction.constitutionalCompliance.disconnect ? '✓' : '✗'}</p>
              <p className="text-xs font-medium">Right to Disconnect</p>
              <p className="text-[10px] text-muted-foreground">User could exit anytime</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div>
          <h4 className="font-semibold mb-2">Summary</h4>
          <p className="text-sm text-muted-foreground">{interaction.summary}</p>
        </div>

        {/* Receipt */}
        {interaction.receiptHash && (
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Trust Receipt Hash</p>
                <code className="text-xs font-mono">{interaction.receiptHash}</code>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={`/dashboard/receipts?hash=${interaction.receiptHash}`}>
                  View Receipt
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <a href={`/dashboard/reports?interactionId=${interaction.id}`}>
              Include in Report
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="p-12 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <FileX className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">No Interactions Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mt-2">
            No interactions match your current filters. Try adjusting your search criteria or check back later.
          </p>
        </div>
      </div>
    </Card>
  );
}

export default function InteractionsPage() {
  const { isDemo, isLoaded } = useDemo();
  const [typeFilter, setTypeFilter] = useState<InteractionType>('ALL');
  const [statusFilter, setStatusFilter] = useState<TrustStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);

  // Fetch interactions (demo or real)
  const { data: interactionsData, isLoading } = useQuery({
    queryKey: ['interactions', typeFilter, statusFilter, searchQuery],
    queryFn: async () => {
      if (isDemo) {
        // Filter demo data
        let filtered = DEMO_INTERACTIONS;
        if (typeFilter !== 'ALL') {
          filtered = filtered.filter(i => i.type === typeFilter);
        }
        if (statusFilter !== 'ALL') {
          filtered = filtered.filter(i => i.trustStatus === statusFilter);
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(i => 
            i.summary.toLowerCase().includes(q) ||
            i.participants.initiator.name.toLowerCase().includes(q) ||
            i.participants.responder.name.toLowerCase().includes(q)
          );
        }
        return { interactions: filtered, stats: DEMO_STATS };
      }
      
      // Real API call
      const params = new URLSearchParams();
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);
      
      const res = await fetch(`/api/interactions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch interactions');
      return res.json();
    },
    enabled: isLoaded
  });

  const interactions = interactionsData?.interactions || [];
  const stats = interactionsData?.stats || DEMO_STATS;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Interactions
            <InfoTooltip term="Interactions" />
          </h1>
          <p className="text-muted-foreground">
            Track and audit all AI interactions with customers, staff, and other agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              Demo Mode
            </Badge>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <WithDemoWatermark position="top-right" size="sm" opacity={20}>
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total Interactions</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div className="text-2xl font-bold">{stats.byType.AI_CUSTOMER}</div>
              </div>
              <p className="text-xs text-muted-foreground">AI ↔ Customer</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-500" />
                <div className="text-2xl font-bold">{stats.byType.AI_STAFF}</div>
              </div>
              <p className="text-xs text-muted-foreground">AI ↔ Staff</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-cyan-500">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-cyan-500" />
                <div className="text-2xl font-bold">{stats.byType.AI_AI}</div>
              </div>
              <p className="text-xs text-muted-foreground">AI ↔ AI</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.complianceRate}%</div>
              <p className="text-xs text-muted-foreground">Compliance Rate</p>
            </CardContent>
          </Card>
        </div>
      </WithDemoWatermark>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search interactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as InteractionType)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Interaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="AI_CUSTOMER">AI ↔ Customer</SelectItem>
                <SelectItem value="AI_STAFF">AI ↔ Staff</SelectItem>
                <SelectItem value="AI_AI">AI ↔ AI</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TrustStatus)}>
              <SelectTrigger className="w-[150px]">
                <Shield className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Trust Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PASS">Pass Only</SelectItem>
                <SelectItem value="PARTIAL">Partial Only</SelectItem>
                <SelectItem value="FAIL">Failed Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className={`space-y-4 ${selectedInteraction ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {isLoading ? (
            <ListSkeleton items={5} />
          ) : interactions.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Showing {interactions.length} interactions</span>
                <span>
                  Pass: <span className="text-emerald-500 font-medium">{stats.byStatus.PASS}</span>
                  {' • '}
                  Partial: <span className="text-amber-500 font-medium">{stats.byStatus.PARTIAL}</span>
                  {' • '}
                  Fail: <span className="text-red-500 font-medium">{stats.byStatus.FAIL}</span>
                </span>
              </div>
              {interactions.map((interaction: Interaction) => (
                <InteractionCard 
                  key={interaction.id} 
                  interaction={interaction}
                  onView={() => setSelectedInteraction(interaction)}
                />
              ))}
            </>
          )}
        </div>

        {/* Detail Panel */}
        {selectedInteraction && (
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <InteractionDetail 
                interaction={selectedInteraction} 
                onClose={() => setSelectedInteraction(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
