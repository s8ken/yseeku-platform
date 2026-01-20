'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Brain,
  Zap,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  TrendingUp,
  TrendingDown,
  Minus,
  Trash2,
  RefreshCw,
  Play,
  Pause,
  Search,
  Tag,
  FileText,
  BarChart3,
  Lightbulb,
  Target,
  History,
  ShieldAlert,
  ShieldCheck,
  HandMetal,
  Undo2,
  Eye,
  Lock,
  Cpu,
  Network,
  Gauge,
  FlaskConical,
  Info
} from 'lucide-react';
import { api, BrainMemory, ActionEffectiveness, BrainRecommendation, BrainCycle } from '@/lib/api';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// Memory kind options
const MEMORY_KINDS = [
  { value: 'all', label: 'All Memories' },
  { value: 'action_outcome', label: 'Action Outcomes' },
  { value: 'agent_state', label: 'Agent States' },
  { value: 'system_state', label: 'System States' },
  { value: 'recommendation', label: 'Recommendations' },
  { value: 'alert', label: 'Alerts' },
];

// Action type options
const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'ban_agent', label: 'Ban Agent' },
  { value: 'restrict_agent', label: 'Restrict Agent' },
  { value: 'quarantine_agent', label: 'Quarantine Agent' },
  { value: 'unban_agent', label: 'Unban Agent' },
  { value: 'alert', label: 'Alert' },
  { value: 'adjust_threshold', label: 'Adjust Threshold' },
];

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode }> = {
    active: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="h-3 w-3" /> },
    completed: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: <CheckCircle className="h-3 w-3" /> },
    running: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
    failed: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="h-3 w-3" /> },
    pending: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: <Clock className="h-3 w-3" /> },
    executed: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <CheckCircle className="h-3 w-3" /> },
  };
  const cfg = config[status] || config.pending;
  return (
    <Badge className={`${cfg.color} flex items-center gap-1`}>
      {cfg.icon}
      {status}
    </Badge>
  );
}

function TrendIndicator({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
  if (trend === 'improving') {
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  }
  if (trend === 'declining') {
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  }
  return <Minus className="h-4 w-4 text-gray-500" />;
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-black',
    low: 'bg-blue-500 text-white',
  };
  return (
    <Badge className={colors[priority] || colors.low}>
      {priority}
    </Badge>
  );
}

function MemoryCard({ memory, onDelete }: { memory: BrainMemory; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="mb-3">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-purple-500" />
            <Badge variant="outline">{memory.kind}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {new Date(memory.timestamp).toLocaleString()}
            </span>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className={`text-sm ${expanded ? '' : 'line-clamp-2'}`}>
          {memory.content}
        </p>
        {memory.content.length > 150 && (
          <Button variant="link" size="sm" onClick={() => setExpanded(!expanded)} className="p-0 h-auto">
            {expanded ? 'Show less' : 'Show more'}
          </Button>
        )}
        {memory.tags && memory.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {memory.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                <Tag className="h-2 w-2 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CycleCard({ cycle, onOverride }: { cycle: BrainCycle; onOverride?: (actionId: string, reason: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{ id: string; type: string; target: string } | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  const refusedActions = cycle.actions.filter(a => a.status === 'failed' && (a.result as any)?.refused);
  const executedActions = cycle.actions.filter(a => a.status === 'executed');
  const overriddenActions = cycle.actions.filter(a => (a.result as any)?.overridden);

  return (
    <Card className={`mb-3 ${cycle.status === 'failed' ? 'border-l-4 border-l-red-500' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            <span className="font-medium">Think Cycle</span>
            <Badge variant={cycle.mode === 'enforced' ? 'default' : 'secondary'}>
              {cycle.mode}
            </Badge>
            <StatusBadge status={cycle.status} />
            {refusedActions.length > 0 && (
              <Badge variant="outline" className="text-amber-600 border-amber-400">
                <ShieldAlert className="h-3 w-3 mr-1" />
                {refusedActions.length} refused
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(cycle.timestamp).toLocaleString()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm italic text-muted-foreground mb-3">"{cycle.thought}"</p>

        {/* Risk Context */}
        {cycle.inputContext && (
          <div className="flex items-center gap-4 mb-3 text-xs">
            <div className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              <span>Risk: {cycle.inputContext.riskScore ?? 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span>Urgency: {cycle.inputContext.urgency ?? 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>Anomalies: {cycle.inputContext.anomalyCount ?? 0}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 text-xs mb-3">
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-bold">{cycle.metrics.agentCount}</div>
            <div className="text-muted-foreground">Agents</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-bold">{cycle.metrics.avgTrust.toFixed(1)}</div>
            <div className="text-muted-foreground">Avg Trust</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-bold">{cycle.metrics.alertsProcessed}</div>
            <div className="text-muted-foreground">Alerts</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-bold">{cycle.metrics.actionsPlanned}</div>
            <div className="text-muted-foreground">Actions</div>
          </div>
        </div>

        {cycle.actions.length > 0 && (
          <>
            <Button variant="link" size="sm" onClick={() => setExpanded(!expanded)} className="p-0 h-auto mb-2">
              {expanded ? 'Hide' : 'Show'} {cycle.actions.length} actions
            </Button>
            {expanded && (
              <div className="space-y-2">
                {cycle.actions.map((action, i) => (
                  <div key={i} className={`p-3 rounded text-xs ${
                    (action.result as any)?.refused ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200' :
                    (action.result as any)?.overridden ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200' :
                    'bg-muted/50'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{action.type}</Badge>
                        <span className="text-muted-foreground">{action.target}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={action.status} />
                        {action.status === 'executed' && !((action.result as any)?.overridden) && onOverride && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              setSelectedAction({ id: (action as any).id || `${cycle.id}-${i}`, type: action.type, target: action.target });
                              setOverrideDialogOpen(true);
                            }}
                          >
                            <Undo2 className="h-3 w-3 mr-1" />
                            Override
                          </Button>
                        )}
                      </div>
                    </div>
                    {action.reason && (
                      <p className="text-muted-foreground mt-1">{action.reason}</p>
                    )}
                    {(action.result as any)?.refused && (
                      <div className="mt-2 p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-amber-800 dark:text-amber-200">
                        <div className="flex items-center gap-1 font-medium">
                          <Lock className="h-3 w-3" />
                          Refused by kernel constraint
                        </div>
                        <p className="mt-1">Rule: {(action.result as any)?.rule}</p>
                        <p>Reason: {(action.result as any)?.reason}</p>
                      </div>
                    )}
                    {(action.result as any)?.overridden && (
                      <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-800 dark:text-blue-200">
                        <div className="flex items-center gap-1 font-medium">
                          <Undo2 className="h-3 w-3" />
                          Overridden by {(action.result as any)?.overriddenBy}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Override Dialog */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Action</DialogTitle>
            <DialogDescription>
              This will revert the effects of the action. A justification is required for audit purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{selectedAction?.type}</Badge>
                <span>{selectedAction?.target}</span>
              </div>
            </div>
            <div>
              <Label htmlFor="override-reason">Justification (required)</Label>
              <Textarea
                id="override-reason"
                placeholder="Explain why this action should be overridden..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (selectedAction && overrideReason.length >= 3 && onOverride) {
                  onOverride(selectedAction.id, overrideReason);
                  setOverrideDialogOpen(false);
                  setOverrideReason('');
                }
              }}
              disabled={overrideReason.length < 3}
              className="bg-amber-500 hover:bg-amber-600"
            >
              <Undo2 className="h-4 w-4 mr-2" />
              Override Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function SystemBrainDashboard() {
  const [tenant, setTenant] = useState('default');
  const [selectedMemoryKind, setSelectedMemoryKind] = useState('all');
  const [selectedActionType, setSelectedActionType] = useState('all');
  const [memorySearch, setMemorySearch] = useState('');
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem('tenant') : null;
      setTenant(t || 'default');
    } catch {
      setTenant('default');
    }
  }, []);

  // Queries
  const { data: overseerStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['overseer-status'],
    queryFn: () => api.getOverseerStatus(),
    refetchInterval: 30000,
  });

  const { data: memories, isLoading: memoriesLoading, refetch: refetchMemories } = useQuery({
    queryKey: ['brain-memories', tenant, selectedMemoryKind],
    queryFn: () => api.getBrainMemories(tenant, selectedMemoryKind === 'all' ? undefined : selectedMemoryKind, 100),
    enabled: !!tenant,
  });

  const { data: effectiveness, isLoading: effectivenessLoading } = useQuery({
    queryKey: ['action-effectiveness', tenant, selectedActionType],
    queryFn: () => api.getActionEffectiveness(tenant, selectedActionType === 'all' ? undefined : selectedActionType),
    enabled: !!tenant,
  });

  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['brain-recommendations', tenant],
    queryFn: () => api.getActionRecommendations(tenant),
    enabled: !!tenant,
  });

  const { data: cycles, isLoading: cyclesLoading, refetch: refetchCycles } = useQuery({
    queryKey: ['brain-cycles', tenant],
    queryFn: () => api.getBrainCycles(tenant, 20),
    enabled: !!tenant,
  });

  const { data: refusals, isLoading: refusalsLoading, refetch: refetchRefusals } = useQuery({
    queryKey: ['brain-refusals', tenant],
    queryFn: () => api.getOverseerRefusals(50),
    enabled: !!tenant,
  });

  // Mutations
  const triggerThinkMutation = useMutation({
    mutationFn: (mode: 'advisory' | 'enforced') => api.triggerOverseerThink(mode),
    onSuccess: () => {
      toast.success('Think cycle triggered');
      setTimeout(() => {
        refetchStatus();
        refetchCycles();
        refetchRefusals();
      }, 2000);
    },
    onError: (error: any) => {
      toast.error('Failed to trigger think cycle', { description: error.message });
    },
  });

  const overrideActionMutation = useMutation({
    mutationFn: ({ actionId, reason }: { actionId: string; reason: string }) => 
      api.overrideOverseerAction(actionId, reason),
    onSuccess: (result) => {
      toast.success(result.reverted ? 'Action overridden and reverted' : 'Action marked as overridden');
      setOverrideOpen(false);
      setOverrideReason('');
      setSelectedActionId(null);
      refetchCycles();
      queryClient.invalidateQueries({ queryKey: ['overseer-refusals'] });
    },
    onError: (error: any) => {
      toast.error('Failed to override action', { description: error.message });
    },
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: (memoryId: string) => api.deleteBrainMemory(memoryId),
    onSuccess: () => {
      toast.success('Memory deleted');
      refetchMemories();
    },
    onError: (error: any) => {
      toast.error('Failed to delete memory', { description: error.message });
    },
  });

  const clearMemoriesMutation = useMutation({
    mutationFn: (kind?: string) => api.clearBrainMemories(tenant, kind === 'all' ? undefined : kind),
    onSuccess: () => {
      toast.success('Memories cleared');
      refetchMemories();
    },
    onError: (error: any) => {
      toast.error('Failed to clear memories', { description: error.message });
    },
  });

  // Filter memories by search
  const filteredMemories = (memories || []).filter(m =>
    m.content.toLowerCase().includes(memorySearch.toLowerCase()) ||
    m.tags?.some((t: string) => t.toLowerCase().includes(memorySearch.toLowerCase()))
  );

  // Calculate summary stats
  const totalMemories = memories?.length || 0;
  const totalCycles = cycles?.length || 0;
  const avgEffectiveness = effectiveness?.length
    ? (effectiveness.reduce((sum: number, e: { effectivenessScore: number }) => sum + e.effectivenessScore, 0) / effectiveness.length * 100).toFixed(0)
    : 0;
  const pendingRecommendations = recommendations?.length || 0;
  const totalRefusals = refusals?.length || 0;

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-6">
      {/* Research Preview Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FlaskConical className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <strong className="text-purple-800 dark:text-purple-200">Autonomous AI Governance System</strong>
              <Badge variant="outline" className="text-purple-600 border-purple-400 text-xs">Production Ready</Badge>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              The System Brain continuously monitors trust metrics, agent behavior, and emergence patterns. 
              It can autonomously detect anomalies, recommend actions, and (in enforced mode) execute governance decisions
              with full audit trails and human override capabilities.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-500" />
            System Brain Dashboard
            <InfoTooltip term="System Brain" />
          </h1>
          <p className="text-muted-foreground">
            Autonomous AI oversight with real-time monitoring and governance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => triggerThinkMutation.mutate('advisory')}
            disabled={triggerThinkMutation.isPending}
          >
            <Eye className="h-4 w-4 mr-2" />
            Advisory Cycle
          </Button>
          <Button
            onClick={() => triggerThinkMutation.mutate('enforced')}
            disabled={triggerThinkMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Zap className="h-4 w-4 mr-2" />
            Enforced Cycle
          </Button>
        </div>
      </div>

      {/* Capabilities Showcase */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="h-5 w-5 text-purple-500" />
            Core Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="font-medium text-sm">Real-Time Sensors</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Trust scores, agent health, alerts, Z-score anomaly detection, trend analysis
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-sm">Autonomous Actions</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ban/restrict/quarantine agents, adjust thresholds, create alerts
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-sm">Kernel Constraints</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Safety layer that refuses high-risk actions without justification
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Network className="h-4 w-4 text-purple-500" />
                <span className="font-medium text-sm">Feedback Learning</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tracks action effectiveness, adjusts recommendations over time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Banner */}
      {overseerStatus && (
        <Card className="bg-gradient-to-r from-slate-900 to-purple-900 border-none text-white">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                overseerStatus.status === 'active' ? 'bg-green-500/20' : 'bg-gray-500/20'
              }`}>
                <Brain className={`h-6 w-6 ${overseerStatus.status === 'active' ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">System Brain</span>
                  <Badge className={overseerStatus.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                    {overseerStatus.status?.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="border-white/30 text-white">
                    {overseerStatus.mode || 'advisory'} mode
                  </Badge>
                </div>
                {overseerStatus.message && (
                  <p className="text-slate-300 italic mt-1">"{overseerStatus.message}"</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Last Thought</div>
              <div className="font-mono">
                {overseerStatus.lastThought ? new Date(overseerStatus.lastThought).toLocaleString() : 'Never'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Total Memories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMemories}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Think Cycles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCycles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Avg Effectiveness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{avgEffectiveness}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pendingRecommendations}</div>
          </CardContent>
        </Card>

        <Card className={totalRefusals > 0 ? 'border-amber-200 dark:border-amber-800' : ''}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Kernel Refusals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totalRefusals > 0 ? 'text-amber-600' : ''}`}>{totalRefusals}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="cycles" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="cycles" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Think Cycles
          </TabsTrigger>
          <TabsTrigger value="refusals" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Refusals
            {totalRefusals > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">{totalRefusals}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="memories" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Memory
          </TabsTrigger>
          <TabsTrigger value="effectiveness" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Effectiveness
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        {/* Think Cycles Tab */}
        <TabsContent value="cycles">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Think Cycles</CardTitle>
                <Button variant="outline" size="sm" onClick={() => refetchCycles()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <CardDescription>History of System Brain reasoning and actions</CardDescription>
            </CardHeader>
            <CardContent>
              {cyclesLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : cycles && cycles.length > 0 ? (
                <ScrollArea className="h-[500px] pr-4">
                  {cycles.map((cycle, i) => (
                    <CycleCard 
                      key={cycle.id || i} 
                      cycle={cycle} 
                      onOverride={(actionId) => {
                        setSelectedActionId(actionId);
                        setOverrideOpen(true);
                      }}
                    />
                  ))}
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No think cycles recorded yet</p>
                  <p className="text-sm">Trigger a think cycle to start monitoring</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value="memories">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Brain Memory</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Clear all memories of this type?')) {
                        clearMemoriesMutation.mutate(selectedMemoryKind);
                      }
                    }}
                    disabled={clearMemoriesMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => refetchMemories()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
              <CardDescription>Stored observations and learnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search memories..."
                      value={memorySearch}
                      onChange={(e) => setMemorySearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedMemoryKind} onValueChange={setSelectedMemoryKind}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by kind" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMORY_KINDS.map(kind => (
                      <SelectItem key={kind.value} value={kind.value}>{kind.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {memoriesLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredMemories.length > 0 ? (
                <ScrollArea className="h-[400px] pr-4">
                  {filteredMemories.map((memory, i) => (
                    <MemoryCard
                      key={memory.id || i}
                      memory={memory}
                      onDelete={() => deleteMemoryMutation.mutate(memory.id)}
                    />
                  ))}
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No memories found</p>
                  <p className="text-sm">Memories are created during think cycles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Effectiveness Tab */}
        <TabsContent value="effectiveness">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Action Effectiveness</CardTitle>
                <Select value={selectedActionType} onValueChange={setSelectedActionType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <CardDescription>Feedback loop metrics for System Brain actions</CardDescription>
            </CardHeader>
            <CardContent>
              {effectivenessLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : effectiveness && effectiveness.length > 0 ? (
                <div className="space-y-4">
                  {effectiveness.map((eff: { actionType: string; trend: 'stable' | 'improving' | 'declining'; effectivenessScore: number; totalActions?: number; avgImpact?: number; avgDuration?: number; successRate?: number; successCount?: number; failureCount?: number }, i: number) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{eff.actionType}</Badge>
                          <TrendIndicator trend={eff.trend} />
                        </div>
                        <span className="text-2xl font-bold text-green-600">
                          {(eff.effectivenessScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={eff.effectivenessScore * 100} className="h-2 mb-3" />
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Total Actions</div>
                          <div className="font-medium">{eff.totalActions ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Successful</div>
                          <div className="font-medium text-green-600">{eff.successCount ?? Math.round((eff.totalActions ?? 0) * (eff.successRate ?? 0))}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Failed</div>
                          <div className="font-medium text-red-600">{eff.failureCount ?? Math.round((eff.totalActions ?? 0) * (1 - (eff.successRate ?? 0)))}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Avg Impact</div>
                          <div className="font-medium">{((eff.avgImpact ?? 0) * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No effectiveness data yet</p>
                  <p className="text-sm">Data is collected as actions are executed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Action Recommendations</CardTitle>
              <CardDescription>AI-generated suggestions based on system analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {recommendationsLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recommendations && recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((rec, i) => (
                    <Card key={rec.id || i} className="border-l-4 border-l-amber-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="h-4 w-4 text-amber-500" />
                              <Badge variant="outline">{rec.actionType}</Badge>
                              <PriorityBadge priority={rec.priority} />
                              {rec.target && (
                                <span className="text-sm text-muted-foreground">
                                  Target: {rec.target}
                                </span>
                              )}
                            </div>
                            <p className="text-sm">{rec.reason}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Confidence: {(rec.confidence * 100).toFixed(0)}%</span>
                              <span>Suggested: {new Date(rec.suggestedAt).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="outline">
                              Dismiss
                            </Button>
                            <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                              Execute
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recommendations at this time</p>
                  <p className="text-sm">The System Brain will suggest actions when needed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Refusals Tab */}
        <TabsContent value="refusals">
          <Card className="border-red-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <HandMetal className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <CardTitle>Kernel Refusals</CardTitle>
                    <CardDescription>Actions blocked by safety constraints</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {refusalsLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : refusals && refusals.length > 0 ? (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {refusals.map((refusal, i) => (
                      <Card key={refusal.id || i} className="border-l-4 border-l-red-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Lock className="h-4 w-4 text-red-500" />
                                <Badge variant="destructive">{refusal.actionType}</Badge>
                                <Badge variant="outline" className="border-red-300 text-red-700 dark:text-red-300">
                                  {refusal.rule}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium mb-1">Target: {refusal.target}</p>
                              <p className="text-sm text-muted-foreground">{refusal.reason}</p>
                              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span>Cycle: {refusal.cycleId?.slice(-8) || 'N/A'}</span>
                                <span>Blocked: {new Date(refusal.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-red-300 text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950"
                                onClick={() => {
                                  setSelectedActionId(refusal.id);
                                  setOverrideOpen(true);
                                }}
                              >
                                <Undo2 className="h-3 w-3 mr-1" />
                                Override
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                    <ShieldCheck className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-lg font-medium text-green-600 dark:text-green-400">No Refusals</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    All actions have passed safety constraints
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Override Dialog */}
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Override Safety Constraint
            </DialogTitle>
            <DialogDescription>
              You are about to override a kernel safety constraint. This action will be logged for audit purposes.
              Please provide a clear justification for this override.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="override-reason" className="text-sm font-medium">
              Justification <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="override-reason"
              placeholder="Explain why this override is necessary..."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="mt-2 min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-2">
              This justification will be stored in the brain memory for audit trail.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setOverrideOpen(false);
              setOverrideReason('');
              setSelectedActionId(null);
            }}>
              Cancel
            </Button>
            <Button 
              className="bg-amber-500 hover:bg-amber-600"
              disabled={!overrideReason.trim() || overrideActionMutation.isPending}
              onClick={() => {
                if (selectedActionId && overrideReason.trim()) {
                  overrideActionMutation.mutate({ actionId: selectedActionId, reason: overrideReason });
                }
              }}
            >
              {overrideActionMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Confirm Override
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
