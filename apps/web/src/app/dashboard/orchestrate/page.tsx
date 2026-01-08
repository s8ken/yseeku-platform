'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  GitBranch,
  Play,
  Plus,
  Settings2,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function OrchestrationPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null);
  const [runInput, setRunInput] = useState('');
  const queryClient = useQueryClient();

  // Fetch workflows
  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      // We need to add getWorkflows to api.ts, for now using direct fetch
      // Assuming we will add it to api.ts or use direct fetch here
      const token = localStorage.getItem('token');
      const res = await fetch('/api/orchestrate/workflows', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch workflows');
      const json = await res.json();
      return json.data || [];
    }
  });

  // Fetch agents for template creation (needed for CEV)
  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.getAgents()
  });
  const agents = agentsData?.agents || [];

  // Create Template Mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (agentIds: { coordinator: string, executor: string, validator: string }) => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/orchestrate/workflows/template/cev', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          coordinatorId: agentIds.coordinator,
          executorId: agentIds.executor,
          validatorId: agentIds.validator
        })
      });
      if (!res.ok) throw new Error('Failed to create template');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Workflow created successfully');
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
    onError: (err: any) => {
      toast.error('Failed to create workflow', { description: err.message });
    }
  });

  // Run Workflow Mutation
  const runWorkflowMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string, input: string }) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orchestrate/workflows/${id}/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ input })
      });
      if (!res.ok) throw new Error('Failed to start execution');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Workflow execution started');
      setSelectedWorkflow(null);
      setRunInput('');
      // In a real app, we would redirect to an execution details page
      // For now, we just stay here
    }
  });

  const handleCreateTemplate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTemplateMutation.mutate({
      coordinator: formData.get('coordinator') as string,
      executor: formData.get('executor') as string,
      validator: formData.get('validator') as string,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Workflow Orchestration
            <InfoTooltip term="Orchestration" />
          </h1>
          <p className="text-muted-foreground">
            Design and execute multi-agent collaborative workflows
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Workflow</DialogTitle>
              <DialogDescription>
                Start with a template or build from scratch.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">Research & Validate (CEV)</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Standard pattern: Coordinator plans -> Executor acts -> Validator checks.
                </p>
                
                <div className="space-y-3">
                  <div className="grid gap-2">
                    <Label>Coordinator Agent</Label>
                    <select name="coordinator" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" required>
                      <option value="">Select agent...</option>
                      {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Executor Agent</Label>
                    <select name="executor" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" required>
                      <option value="">Select agent...</option>
                      {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Validator Agent</Label>
                    <select name="validator" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" required>
                      <option value="">Select agent...</option>
                      {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={createTemplateMutation.isPending}>
                  {createTemplateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create from Template
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted/50" />
              <CardContent className="h-32" />
            </Card>
          ))
        ) : workflows.length === 0 ? (
          <div className="col-span-full text-center py-12 border rounded-lg border-dashed">
            <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No Workflows Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first multi-agent workflow to get started.</p>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>Create Workflow</Button>
          </div>
        ) : (
          workflows.map((workflow: any) => (
            <Card key={workflow._id} className="group hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {workflow.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {workflow.description}
                    </CardDescription>
                  </div>
                  <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                    {workflow.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GitBranch className="h-4 w-4" />
                    {workflow.steps.length} Steps
                  </div>
                  
                  <div className="flex -space-x-2 overflow-hidden">
                    {workflow.steps.map((step: any, i: number) => (
                      <div 
                        key={step.id} 
                        className="relative inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-background bg-muted text-xs font-medium"
                        title={`${step.name} (${step.role})`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full" variant="default">
                          <Play className="h-4 w-4 mr-2" />
                          Run
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Run Workflow: {workflow.name}</DialogTitle>
                          <DialogDescription>
                            Provide the initial input to start the execution chain.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Input Prompt</Label>
                            <textarea 
                              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="e.g., Research the impact of quantum computing on cryptography..."
                              value={runInput}
                              onChange={(e) => setRunInput(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={() => runWorkflowMutation.mutate({ id: workflow._id, input: runInput })}
                            disabled={!runInput || runWorkflowMutation.isPending}
                          >
                            {runWorkflowMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Execute
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="outline" size="icon">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
