'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { api, Agent, BanSeverity } from '@/lib/api';
import {
  Bot,
  Plus,
  Search,
  Activity,
  TrendingUp,
  Settings,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Zap,
  Shield,
  Clock,
  Ban,
  ShieldOff,
  Lock,
  Unlock,
  MoreVertical,
  AlertTriangle,
  Copy,
  ExternalLink,
  Fingerprint
} from 'lucide-react';
import { AgentCreateModal } from '@/components/agents/AgentCreateModal';
import { AgentEditModal } from '@/components/agents/AgentEditModal';

// DID display component
function DIDDisplay({ did, didDocument }: { did?: string; didDocument?: string }) {
  if (!did) return null;

  const copyDID = async () => {
    try {
      await navigator.clipboard.writeText(did);
      toast.success('DID Copied', {
        description: 'Decentralized Identifier copied to clipboard',
      });
    } catch (err) {
      toast.error('Copy Failed', {
        description: 'Could not copy DID to clipboard',
      });
    }
  };

  // Truncate DID for display
  const truncatedDID = did.length > 40
    ? `${did.substring(0, 20)}...${did.substring(did.length - 12)}`
    : did;

  return (
    <div className="pt-2 border-t">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Fingerprint className="h-3 w-3" />
        <span>Decentralized ID (DID)</span>
      </div>
      <div className="flex items-center gap-1">
        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono truncate flex-1" title={did}>
          {truncatedDID}
        </code>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={copyDID}
          title="Copy DID"
        >
          <Copy className="h-3 w-3" />
        </Button>
        {didDocument && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => window.open(didDocument, '_blank')}
            title="View DID Document"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Ban status badge component
function BanStatusBadge({ status }: { status?: string }) {
  if (!status || status === 'active') return null;

  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    banned: {
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200',
      icon: <Ban className="h-3 w-3" />,
      label: 'Banned'
    },
    restricted: {
      color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200',
      icon: <ShieldOff className="h-3 w-3" />,
      label: 'Restricted'
    },
    quarantined: {
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200',
      icon: <Lock className="h-3 w-3" />,
      label: 'Quarantined'
    },
  };

  const cfg = config[status] || config.restricted;
  return (
    <Badge className={`${cfg.color} flex items-center gap-1 border`}>
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

// Ban action dialog
interface BanDialogProps {
  open: boolean;
  onClose: () => void;
  agent: Agent | null;
  action: 'ban' | 'restrict' | 'quarantine';
  onConfirm: (reason: string, severity?: BanSeverity, restrictions?: string[]) => void;
}

function BanActionDialog({ open, onClose, agent, action, onConfirm }: BanDialogProps) {
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState<BanSeverity>('medium');
  const [restrictions, setRestrictions] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    const restrictionList = action === 'restrict'
      ? restrictions.split(',').map(r => r.trim()).filter(Boolean)
      : undefined;
    onConfirm(reason, severity, restrictionList);
    setReason('');
    setSeverity('medium');
    setRestrictions('');
  };

  const titles: Record<string, string> = {
    ban: 'Ban Agent',
    restrict: 'Restrict Agent',
    quarantine: 'Quarantine Agent',
  };

  const descriptions: Record<string, string> = {
    ban: 'This will completely disable the agent and clear all active sessions.',
    restrict: 'This will limit the agent\'s capabilities to the specified features.',
    quarantine: 'This will isolate the agent for investigation while preserving state.',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {titles[action]} - {agent?.name}
          </DialogTitle>
          <DialogDescription>{descriptions[action]}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this action is being taken..."
              rows={3}
            />
          </div>
          {action === 'ban' && (
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as BanSeverity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {action === 'restrict' && (
            <div className="space-y-2">
              <Label>Restricted Features (comma-separated)</Label>
              <Input
                value={restrictions}
                onChange={(e) => setRestrictions(e.target.value)}
                placeholder="chat, api_calls, external_systems"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
            Confirm {action.charAt(0).toUpperCase() + action.slice(1)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banAction, setBanAction] = useState<'ban' | 'restrict' | 'quarantine'>('ban');
  const [targetAgent, setTargetAgent] = useState<Agent | null>(null);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await api.getAgents();
      setAgents(response.data.agents);
      setSummary(response.data.summary);
    } catch (error: any) {
      console.error('Failed to load agents:', error);
      toast.error('Failed to Load Agents', {
        description: error.message || 'Could not fetch agents from the server.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleCreateAgent = async (data: any) => {
    try {
      await api.createAgent(data);
      toast.success('Agent Created', {
        description: `Agent "${data.name}" has been created successfully.`,
      });
      loadAgents();
      setIsCreateModalOpen(false);
    } catch (error: any) {
      toast.error('Creation Failed', {
        description: error.message || 'Failed to create agent.',
      });
    }
  };

  const handleUpdateAgent = async (id: string, data: any) => {
    try {
      await api.updateAgent(id, data);
      toast.success('Agent Updated', {
        description: 'Agent has been updated successfully.',
      });
      loadAgents();
      setEditingAgent(null);
    } catch (error: any) {
      toast.error('Update Failed', {
        description: error.message || 'Failed to update agent.',
      });
    }
  };

  const handleDeleteAgent = async (agent: Agent) => {
    if (!confirm(`Are you sure you want to delete agent "${agent.name}"?`)) {
      return;
    }

    try {
      await api.deleteAgent(agent.id);
      toast.success('Agent Deleted', {
        description: `Agent "${agent.name}" has been deleted.`,
      });
      loadAgents();
    } catch (error: any) {
      toast.error('Deletion Failed', {
        description: error.message || 'Failed to delete agent.',
      });
    }
  };

  const openBanDialog = (agent: Agent, action: 'ban' | 'restrict' | 'quarantine') => {
    setTargetAgent(agent);
    setBanAction(action);
    setBanDialogOpen(true);
  };

  const handleBanAction = async (reason: string, severity?: BanSeverity, restrictions?: string[]) => {
    if (!targetAgent) return;

    try {
      if (banAction === 'ban') {
        await api.banAgent(targetAgent.id, reason, severity || 'medium');
        toast.success('Agent Banned', {
          description: `Agent "${targetAgent.name}" has been banned.`,
        });
      } else if (banAction === 'restrict') {
        await api.restrictAgent(targetAgent.id, restrictions || [], reason);
        toast.success('Agent Restricted', {
          description: `Agent "${targetAgent.name}" has been restricted.`,
        });
      } else if (banAction === 'quarantine') {
        await api.quarantineAgent(targetAgent.id, reason);
        toast.success('Agent Quarantined', {
          description: `Agent "${targetAgent.name}" has been quarantined.`,
        });
      }
      setBanDialogOpen(false);
      loadAgents();
    } catch (error: any) {
      toast.error('Action Failed', {
        description: error.message || `Failed to ${banAction} agent.`,
      });
    }
  };

  const handleUnbanAgent = async (agent: Agent) => {
    if (!confirm(`Are you sure you want to unban agent "${agent.name}"?`)) {
      return;
    }

    try {
      await api.unbanAgent(agent.id);
      toast.success('Agent Unbanned', {
        description: `Agent "${agent.name}" has been restored to active status.`,
      });
      loadAgents();
    } catch (error: any) {
      toast.error('Unban Failed', {
        description: error.message || 'Failed to unban agent.',
      });
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-500 dark:bg-green-600';
      case 'idle':
        return 'bg-yellow-500 dark:bg-yellow-600';
      case 'inactive':
        return 'bg-gray-500 dark:bg-gray-600';
      default:
        return 'bg-blue-500 dark:bg-blue-600';
    }
  };

  const getLastActiveText = (lastInteraction: string) => {
    const now = new Date();
    const lastActive = new Date(lastInteraction);
    const hoursDiff = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 1) return 'Active now';
    if (hoursDiff < 24) return `${Math.floor(hoursDiff)}h ago`;
    const daysDiff = Math.floor(hoursDiff / 24);
    return `${daysDiff}d ago`;
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Bot className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Agent Management</h1>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Agent
          </Button>
        </div>
        <p className="text-muted-foreground">
          Manage your AI agents, configurations, and monitoring
        </p>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Total Agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {summary.active}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Inactive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-500">
                {summary.inactive}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Ban className="h-4 w-4" />
                Banned/Restricted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {agents.filter(a => a.banStatus && a.banStatus !== 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Avg Trust Score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {summary.avgTrustScore > 0 ? summary.avgTrustScore.toFixed(1) : 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents by name or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading agents...</p>
          </div>
        </div>
      ) : filteredAgents.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium">No Agents Found</p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search' : 'Create your first agent to get started'}
                </p>
              </div>
              {!searchTerm && (
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Agent
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => {
            const isBanned = agent.banStatus && agent.banStatus !== 'active';
            const borderClass = isBanned
              ? agent.banStatus === 'banned'
                ? 'border-red-300 dark:border-red-700'
                : agent.banStatus === 'quarantined'
                ? 'border-purple-300 dark:border-purple-700'
                : 'border-amber-300 dark:border-amber-700'
              : '';

            return (
              <Card key={agent.id} className={`hover:shadow-lg transition-shadow ${borderClass}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className={`h-5 w-5 ${isBanned ? 'text-gray-400' : 'text-blue-500'}`} />
                        <CardTitle className={`text-lg ${isBanned ? 'text-gray-500' : ''}`}>{agent.name}</CardTitle>
                        <BanStatusBadge status={agent.banStatus} />
                      </div>
                      <CardDescription className="line-clamp-2">
                        {agent.type || 'AI Agent'}
                        {agent.banReason && (
                          <span className="block text-xs text-red-500 dark:text-red-400 mt-1" title={agent.banReason}>
                            Reason: {agent.banReason.length > 50 ? agent.banReason.substring(0, 50) + '...' : agent.banReason}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${getStatusColor(agent.status)}`} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingAgent(agent)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Agent
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {(!agent.banStatus || agent.banStatus === 'active') ? (
                            <>
                              <DropdownMenuItem onClick={() => openBanDialog(agent, 'restrict')}>
                                <ShieldOff className="h-4 w-4 mr-2 text-amber-500" />
                                Restrict
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openBanDialog(agent, 'quarantine')}>
                                <Lock className="h-4 w-4 mr-2 text-purple-500" />
                                Quarantine
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openBanDialog(agent, 'ban')}>
                                <Ban className="h-4 w-4 mr-2 text-red-500" />
                                Ban Agent
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUnbanAgent(agent)}>
                              <Unlock className="h-4 w-4 mr-2 text-green-500" />
                              Unban Agent
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteAgent(agent)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Agent
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={`space-y-4 ${isBanned ? 'opacity-60' : ''}`}>
                  {/* Trust Score */}
                  {agent.trustScore !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Trust Score</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden w-20">
                          <div
                            className={`h-full ${
                              agent.trustScore >= 8 ? 'bg-green-500' :
                              agent.trustScore >= 5 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${(agent.trustScore / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{agent.trustScore.toFixed(1)}</span>
                      </div>
                    </div>
                  )}

                  {/* Restricted Features */}
                  {agent.restrictedFeatures && agent.restrictedFeatures.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {agent.restrictedFeatures.slice(0, 3).map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {agent.restrictedFeatures.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.restrictedFeatures.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Interactions</div>
                      <div className="font-medium">{agent.interactionCount || 0}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Last Active</div>
                      <div className="font-medium">
                        {agent.lastInteraction ? getLastActiveText(agent.lastInteraction) : 'Never'}
                      </div>
                    </div>
                  </div>

                  {/* SYMBI Dimensions (if available) */}
                  {agent.symbiDimensions && (
                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground mb-2">SYMBI Dimensions</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Reality</div>
                          <div className="font-medium">{agent.symbiDimensions.realityIndex?.toFixed(1) || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Ethics</div>
                          <div className="font-medium">{agent.symbiDimensions.ethicalAlignment?.toFixed(1) || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Parity</div>
                          <div className="font-medium">{agent.symbiDimensions.canvasParity?.toFixed(0) || 'N/A'}%</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DID (Decentralized Identifier) */}
                  <DIDDisplay did={agent.did} didDocument={agent.didDocument} />

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => setEditingAgent(agent)}
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    {isBanned ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                        onClick={() => handleUnbanAgent(agent)}
                      >
                        <Unlock className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDeleteAgent(agent)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AgentCreateModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateAgent}
      />

      {editingAgent && (
        <AgentEditModal
          agent={editingAgent}
          open={!!editingAgent}
          onClose={() => setEditingAgent(null)}
          onUpdate={handleUpdateAgent}
        />
      )}

      <BanActionDialog
        open={banDialogOpen}
        onClose={() => setBanDialogOpen(false)}
        agent={targetAgent}
        action={banAction}
        onConfirm={handleBanAction}
      />
    </div>
  );
}
