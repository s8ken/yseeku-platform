'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Plus, 
  Trash2, 
  Play, 
  Settings, 
  Webhook, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw,
  Slack,
  MessageSquare,
  Bell,
  Mail,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchAPI } from '@/lib/api/client';



// Types
interface WebhookChannel {
  type: 'webhook' | 'email' | 'slack' | 'pagerduty' | 'teams' | 'discord';
  name: string;
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  enabled?: boolean;
}

interface AlertRuleCondition {
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  threshold: number;
}

interface AlertRule {
  id?: string;
  name: string;
  description?: string;
  conditions: AlertRuleCondition[];
  severity?: 'critical' | 'error' | 'warning' | 'info';
  enabled?: boolean;
}

interface WebhookConfig {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  channelCount: number;
  ruleCount: number;
  createdAt: string;
  updatedAt: string;
}

interface WebhookConfigFull extends WebhookConfig {
  channels: WebhookChannel[];
  rules?: AlertRule[];
  eventTypes?: string[];
  severityFilter?: string[];
  secret?: string;
  rateLimiting?: {
    enabled: boolean;
    maxPerMinute?: number;
    maxPerHour?: number;
  };
  retryConfig?: {
    maxRetries?: number;
    timeoutMs?: number;
  };
}

interface DeliveryStats {
  total: number;
  success: number;
  failed: number;
  retrying: number;
  avgResponseTime: number;
  successRate: number;
}

interface Delivery {
  id: string;
  alertType: string;
  alertSeverity: string;
  ruleName?: string;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempt: number;
  responseStatus?: number;
  responseTime?: number;
  error?: string;
  createdAt: string;
  deliveredAt?: string;
}

// API functions
async function fetchWebhooks(): Promise<WebhookConfig[]> {
  const res = await fetch('/api/webhooks', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch webhooks');
  const data = await res.json();
  return data.data;
}

async function fetchWebhook(id: string): Promise<WebhookConfigFull> {
  const res = await fetch(`/api/webhooks/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch webhook');
  const data = await res.json();
  return data.data;
}

async function createWebhook(config: Partial<WebhookConfigFull>): Promise<WebhookConfigFull> {
  const res = await fetch('/api/webhooks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.details?.[0]?.message || 'Failed to create webhook');
  }
  const data = await res.json();
  return data.data;
}

async function updateWebhook(id: string, config: Partial<WebhookConfigFull>): Promise<WebhookConfigFull> {
  const res = await fetch(`/api/webhooks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to update webhook');
  const data = await res.json();
  return data.data;
}

async function deleteWebhook(id: string): Promise<void> {
  const res = await fetch(`/api/webhooks/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete webhook');
}

async function testWebhook(id: string): Promise<{ success: boolean; responseTime: number; error?: string }> {
  const res = await fetch(`/api/webhooks/${id}/test`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  return data;
}

async function toggleWebhook(id: string): Promise<{ enabled: boolean }> {
  const res = await fetch(`/api/webhooks/${id}/toggle`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to toggle webhook');
  const data = await res.json();
  return data.data;
}

async function fetchDeliveryStats(id: string): Promise<DeliveryStats> {
  const res = await fetch(`/api/webhooks/${id}/stats`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch stats');
  const data = await res.json();
  return data.data;
}

async function fetchDeliveries(id: string): Promise<Delivery[]> {
  const res = await fetch(`/api/webhooks/${id}/deliveries?limit=20`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch deliveries');
  const data = await res.json();
  return data.data;
}

async function fetchEventTypes(): Promise<{ id: string; name: string; description: string }[]> {
  const res = await fetch('/api/webhooks/meta/event-types', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch event types');
  const data = await res.json();
  return data.data;
}

async function fetchMetrics(): Promise<{ id: string; name: string; description: string; unit: string }[]> {
  const res = await fetch('/api/webhooks/meta/metrics', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch metrics');
  const data = await res.json();
  return data.data;
}

// Channel type icons
const channelIcons: Record<string, React.ReactNode> = {
  webhook: <Webhook className="h-4 w-4" />,
  slack: <Slack className="h-4 w-4" />,
  discord: <MessageSquare className="h-4 w-4" />,
  teams: <MessageSquare className="h-4 w-4" />,
  pagerduty: <Bell className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
};

// Status badge
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    success: { variant: 'default', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
    failed: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
    retrying: { variant: 'secondary', icon: <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> },
    pending: { variant: 'outline', icon: <Clock className="h-3 w-3 mr-1" /> },
  };
  const { variant, icon } = variants[status] || variants.pending;
  return (
    <Badge variant={variant} className="flex items-center">
      {icon}
      {status}
    </Badge>
  );
}

// Webhook creation/edit dialog
function WebhookDialog({ 
  open, 
  onOpenChange, 
  webhook,
  onSave
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  webhook?: WebhookConfigFull | null;
  onSave: (data: Partial<WebhookConfigFull>) => Promise<void>;
}) {
  const [name, setName] = useState(webhook?.name || '');
  const [description, setDescription] = useState(webhook?.description || '');
  const [channelType, setChannelType] = useState<WebhookChannel['type']>('webhook');
  const [channelName, setChannelName] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [channels, setChannels] = useState<WebhookChannel[]>(webhook?.channels || []);
  const [severityFilter, setSeverityFilter] = useState<string[]>(webhook?.severityFilter || []);
  const [saving, setSaving] = useState(false);

  const handleAddChannel = () => {
    if (!channelName || !channelUrl) {
      toast.error('Channel name and URL are required');
      return;
    }
    setChannels([...channels, { type: channelType, name: channelName, url: channelUrl, enabled: true }]);
    setChannelName('');
    setChannelUrl('');
  };

  const handleRemoveChannel = (index: number) => {
    setChannels(channels.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name || channels.length === 0) {
      toast.error('Name and at least one channel are required');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name,
        description,
        channels,
        severityFilter: severityFilter.length > 0 ? severityFilter as any : undefined,
        enabled: true,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{webhook ? 'Edit Webhook' : 'Create Webhook'}</DialogTitle>
        <DialogDescription>
          Configure webhook endpoints to receive alerts from Yseeku Platform
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input 
            id="name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Production Alerts" 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="Send critical alerts to the team Slack channel" 
          />
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <Label>Channels</Label>
          
          {channels.length > 0 && (
            <div className="space-y-2">
              {channels.map((channel, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    {channelIcons[channel.type]}
                    <span className="font-medium">{channel.name}</span>
                    <Badge variant="outline">{channel.type}</Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveChannel(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-2">
            <Select value={channelType} onValueChange={(v) => setChannelType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="slack">Slack</SelectItem>
                <SelectItem value="discord">Discord</SelectItem>
                <SelectItem value="teams">Teams</SelectItem>
                <SelectItem value="pagerduty">PagerDuty</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              placeholder="Channel name" 
              value={channelName} 
              onChange={(e) => setChannelName(e.target.value)} 
            />
            <Input 
              placeholder={channelType === 'email' ? 'email@example.com' : 'https://...'} 
              value={channelUrl} 
              onChange={(e) => setChannelUrl(e.target.value)} 
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleAddChannel}>
            <Plus className="h-4 w-4 mr-1" /> Add Channel
          </Button>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <Label>Severity Filter</Label>
          <div className="flex gap-2">
            {['critical', 'error', 'warning', 'info'].map((sev) => (
              <Badge 
                key={sev}
                variant={severityFilter.includes(sev) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => {
                  setSeverityFilter(
                    severityFilter.includes(sev) 
                      ? severityFilter.filter(s => s !== sev)
                      : [...severityFilter, sev]
                  );
                }}
              >
                {sev}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Leave empty to receive all severities
          </p>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
          {webhook ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// Webhook detail panel
function WebhookDetail({ 
  webhookId, 
  onClose 
}: { 
  webhookId: string; 
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  
  const { data: webhook, isLoading } = useQuery({
    queryKey: ['webhook', webhookId],
    queryFn: () => fetchWebhook(webhookId),
  });
  
  const { data: stats } = useQuery({
    queryKey: ['webhook-stats', webhookId],
    queryFn: () => fetchDeliveryStats(webhookId),
    refetchInterval: 30000,
  });
  
  const { data: deliveries } = useQuery({
    queryKey: ['webhook-deliveries', webhookId],
    queryFn: () => fetchDeliveries(webhookId),
  });

  const testMutation = useMutation({
    mutationFn: () => testWebhook(webhookId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Test delivered in ${result.responseTime}ms`);
      } else {
        toast.error(`Test failed: ${result.error}`);
      }
    },
  });

  if (isLoading || !webhook) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            {webhook.name}
          </CardTitle>
          <CardDescription>{webhook.description}</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
          >
            {testMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            Test
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl">{stats.total}</CardTitle>
                    <CardDescription>Total Deliveries (24h)</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl text-green-600">{stats.successRate.toFixed(1)}%</CardTitle>
                    <CardDescription>Success Rate</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl text-red-600">{stats.failed}</CardTitle>
                    <CardDescription>Failed</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl">{stats.avgResponseTime?.toFixed(0) || 0}ms</CardTitle>
                    <CardDescription>Avg Response Time</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            )}
            
            {/* Channels */}
            <div className="space-y-2">
              <h3 className="font-semibold">Channels ({webhook.channels.length})</h3>
              {webhook.channels.map((channel, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  {channelIcons[channel.type]}
                  <div className="flex-1">
                    <div className="font-medium">{channel.name}</div>
                    <div className="text-sm text-muted-foreground truncate">{channel.url}</div>
                  </div>
                  <Badge variant={channel.enabled !== false ? 'default' : 'secondary'}>
                    {channel.enabled !== false ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="deliveries" className="mt-4">
            <div className="space-y-2">
              {deliveries?.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No deliveries yet</p>
              )}
              {deliveries?.map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={delivery.status} />
                    <div>
                      <div className="font-medium">{delivery.alertType}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(delivery.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {delivery.responseTime && (
                      <div className="text-sm">{delivery.responseTime}ms</div>
                    )}
                    {delivery.error && (
                      <div className="text-xs text-destructive truncate max-w-[200px]">{delivery.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Severity Filter</h4>
                <div className="flex gap-2 mt-2">
                  {webhook.severityFilter?.length ? (
                    webhook.severityFilter.map(s => (
                      <Badge key={s}>{s}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">All severities</span>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium">Rate Limiting</h4>
                <p className="text-sm text-muted-foreground">
                  {webhook.rateLimiting?.enabled ? (
                    `${webhook.rateLimiting.maxPerMinute}/min, ${webhook.rateLimiting.maxPerHour}/hour`
                  ) : (
                    'Disabled'
                  )}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">Retry Config</h4>
                <p className="text-sm text-muted-foreground">
                  Max {webhook.retryConfig?.maxRetries || 3} retries, {webhook.retryConfig?.timeoutMs || 30000}ms timeout
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Main page component
export default function WebhooksPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  
  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: fetchWebhooks,
  });

  const createMutation = useMutation({
    mutationFn: createWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook deleted');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Webhook className="h-8 w-8" />
            Webhooks
          </h1>
          <p className="text-muted-foreground">
            Configure alert notifications to external services
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <WebhookDialog 
            open={dialogOpen} 
            onOpenChange={setDialogOpen}
            onSave={async (data) => {
              await createMutation.mutateAsync(data as any);
            }}
          />
        </Dialog>
      </div>

      {selectedWebhook ? (
        <WebhookDetail 
          webhookId={selectedWebhook} 
          onClose={() => setSelectedWebhook(null)} 
        />
      ) : (
        <div className="grid gap-4">
          {isLoading && (
            <Card>
              <CardContent className="p-8 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </CardContent>
            </Card>
          )}
          
          {webhooks?.length === 0 && !isLoading && (
            <Card>
              <CardContent className="p-8 text-center">
                <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No webhooks configured</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first webhook to receive real-time alerts
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Webhook
                </Button>
              </CardContent>
            </Card>
          )}
          
          {webhooks?.map((webhook) => (
            <Card 
              key={webhook.id} 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelectedWebhook(webhook.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Webhook className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-lg">{webhook.name}</CardTitle>
                      <CardDescription>
                        {webhook.channelCount} channel{webhook.channelCount !== 1 ? 's' : ''} • 
                        {webhook.ruleCount} rule{webhook.ruleCount !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={webhook.enabled}
                      onCheckedChange={() => toggleMutation.mutate(webhook.id)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Delete this webhook?')) {
                          deleteMutation.mutate(webhook.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
