'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api, Agent } from '@/lib/api';
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
  Clock
} from 'lucide-react';
import { AgentCreateModal } from '@/components/agents/AgentCreateModal';
import { AgentEditModal } from '@/components/agents/AgentEditModal';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {agent.type || 'AI Agent'}
                    </CardDescription>
                  </div>
                  <div className={`h-2 w-2 rounded-full ${getStatusColor(agent.status)}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {/* Actions */}
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => handleDeleteAgent(agent)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
    </div>
  );
}
