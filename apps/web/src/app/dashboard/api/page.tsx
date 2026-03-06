'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Server,
  Key,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  RefreshCw,
  Shield,
  Activity,
  Clock,
  AlertTriangle,
  Loader2,
  Terminal,
  Code2,
  BookOpen,
  ExternalLink,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useDemo } from '@/hooks/use-demo';

interface RateLimitConfig {
  endpoint: string;
  requestsPerMinute: number;
  burstLimit: number;
  enabled: boolean;
}

const rateLimits: RateLimitConfig[] = [
  { endpoint: '/api/v1/agents', requestsPerMinute: 100, burstLimit: 150, enabled: true },
  { endpoint: '/api/v1/trust/scores', requestsPerMinute: 200, burstLimit: 300, enabled: true },
  { endpoint: '/api/v1/trust/receipts', requestsPerMinute: 50, burstLimit: 75, enabled: true },
  { endpoint: '/api/v1/audit/logs', requestsPerMinute: 30, burstLimit: 50, enabled: true },
  { endpoint: '/api/v1/experiments', requestsPerMinute: 20, burstLimit: 30, enabled: false }
];

const apiMetrics = {
  totalRequests24h: 0,
  avgLatency: 45,
  errorRate: 0.0,
  activeKeys: 0
};

function ApiKeyRow({ apiKey, onRevoke }: { apiKey: any, onRevoke: (id: string) => void }) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // We only have the prefix usually, unless it's just created (handled elsewhere)
  // But for this row, we display the prefix or mask
  const displayKey = apiKey.prefix || 'sk_live_...';
  const maskedKey = displayKey.substring(0, 10) + '••••••••••••••••••••••••••••';

  const copyKey = async () => {
    // You can't copy the full key from the list view usually for security
    // But we'll allow copying the prefix if that's all we have
    toast.info("For security, full keys are only shown once upon creation.");
  };

  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium text-purple-700 dark:text-purple-400">{apiKey.name}</div>
          <div className="text-xs text-muted-foreground font-mono">
            {maskedKey}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={
          apiKey.status === 'active' ? 'default' :
          apiKey.status === 'expired' ? 'secondary' : 'destructive'
        } className={apiKey.status === 'active' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30' : ''}>
          {apiKey.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {apiKey.scopes?.slice(0, 2).map((scope: string) => (
            <Badge key={scope} variant="outline" className="text-xs">
              {scope}
            </Badge>
          ))}
          {apiKey.scopes?.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{apiKey.scopes.length - 2}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right font-mono">{apiKey.requests24h?.toLocaleString('en-US') || 0}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString('en-US') : 'Never'}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onRevoke(apiKey.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function ApiGatewayPage() {
  const [rateLimitConfigs, setRateLimitConfigs] = useState(rateLimits);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { currentTenantId } = useDemo();

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['platformApiKeys'],
    queryFn: () => api.getPlatformApiKeys(),
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      return api.createPlatformApiKey(name);
    },
    onSuccess: (data) => {
      setCreatedKey(data.fullKey);
      toast.success('Protocol credentials generated');
      queryClient.invalidateQueries({ queryKey: ['platformApiKeys'] });
    },
    onError: (error: any) => {
      toast.error('Failed to create credentials', { description: error.message });
    }
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.revokePlatformApiKey(id);
    },
    onSuccess: () => {
      toast.success('Protocol credential revoked');
      queryClient.invalidateQueries({ queryKey: ['platformApiKeys'] });
    },
    onError: (error: any) => {
      toast.error('Failed to revoke credential', { description: error.message });
    }
  });

  const handleCreateKey = () => {
    if (!newKeyName) return;
    createKeyMutation.mutate(newKeyName);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setCreatedKey(null);
    setNewKeyName('');
  };

  const toggleRateLimit = (endpoint: string) => {
    setRateLimitConfigs(prev => 
      prev.map(config => 
        config.endpoint === endpoint 
          ? { ...config, enabled: !config.enabled }
          : config
      )
    );
    toast.success('Protocol rate limit updated');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Protocol Access</h1>
          <p className="text-muted-foreground flex items-center gap-1">
            Build on the SONATE Trust Protocol with SDKs and secure API access
            <InfoTooltip term="SONATE Protocol" />
            <InfoTooltip term="Trust Receipts" />
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
             <span className="text-[10px] uppercase font-bold text-muted-foreground">Tenant / App ID</span>
             <span className="font-mono text-sm font-bold text-purple-600">{currentTenantId}</span>
          </div>
          <div className="data-source-badge data-source-live">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected to Protocol
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Protocol Calls (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiKeys.reduce((acc: number, key: any) => acc + (key.requests24h || 0), 0).toLocaleString('en-US')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              Protocol Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiMetrics.avgLatency}ms</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-amber-500" />
              Receipt Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.0% failure</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4 text-purple-500" />
              Active Credentials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiKeys.filter((k: any) => k.status === 'active').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* SDK First Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-900/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                <Code2 className="h-5 w-5" />
                sonate-receipt SDK
              </CardTitle>
              <Badge variant="outline" className="border-purple-300 text-purple-700">v1.2.0-stable</Badge>
            </div>
            <CardDescription>
              Native TypeScript SDK for cryptographic interaction signing & trust receipts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">1. Install Package</p>
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-md font-mono text-sm text-slate-300 border border-slate-800">
                <code>npm install sonate-receipt</code>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500" onClick={() => {
                  navigator.clipboard.writeText('npm install sonate-receipt');
                  toast.success('Copied to clipboard');
                }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">2. Wrap Your Agent</p>
              <div className="bg-slate-950 p-3 rounded-md font-mono text-sm text-slate-300 border border-slate-800 overflow-x-auto whitespace-nowrap">
                <div className="text-purple-400">import</div> {'{ wrap }'} <div className="text-purple-400">from</div> <div className="text-emerald-400">'sonate-receipt'</div>;
                <br />
                <div className="text-purple-400">const</div> wrapped = wrap(myAgent, {'{'} appId: <div className="text-emerald-400">'{currentTenantId}'</div> {'}'});
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">3. Verify Receipts</p>
              <div className="bg-slate-950 p-3 rounded-md font-mono text-sm text-slate-300 border border-slate-800">
                <div className="text-purple-400">const</div> isValid = <div className="text-purple-400">await</div> verifyReceipt(receipt);
              </div>
            </div>

            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" asChild>
              <a href="https://www.npmjs.com/package/sonate-receipt" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on NPM
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Protocol Reference
            </CardTitle>
            <CardDescription>
              Technical specifications for the SONATE Protocol
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Link href="/dashboard/docs/protocol/sonate" className="flex flex-col p-3 border rounded-lg hover:border-purple-300 transition-colors group">
                <Cpu className="h-5 w-5 mb-2 group-hover:text-purple-500" />
                <span className="font-semibold text-sm">Receipt Spec</span>
                <span className="text-xs text-muted-foreground">Hashing & Signing</span>
              </Link>
              <Link href="/dashboard/docs/protocol/sonate" className="flex flex-col p-3 border rounded-lg hover:border-purple-300 transition-colors group">
                <Shield className="h-5 w-5 mb-2 group-hover:text-purple-500" />
                <span className="font-semibold text-sm">SONATE Ethics</span>
                <span className="text-xs text-muted-foreground">The 6 Principles</span>
              </Link>
              <Link href="/dashboard/docs/protocol/sonate" className="flex flex-col p-3 border rounded-lg hover:border-purple-300 transition-colors group">
                <Activity className="h-5 w-5 mb-2 group-hover:text-purple-500" />
                <span className="font-semibold text-sm">Metric Defs</span>
                <span className="text-xs text-muted-foreground">Integrity & Quality</span>
              </Link>
              <Link href="/dashboard/docs/protocol/sonate" className="flex flex-col p-3 border rounded-lg hover:border-purple-300 transition-colors group">
                <Webhook className="h-5 w-5 mb-2 group-hover:text-purple-500" />
                <span className="font-semibold text-sm">Webhooks</span>
                <span className="text-xs text-muted-foreground">Real-time alerts</span>
              </Link>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Pro Tip:</strong> Use our GitHub template to jumpstart your implementation of the SONATE trust framework.
              </p>
            </div>
            <Button variant="outline" className="w-full" asChild>
               <Link href="/dashboard/docs/protocol/sonate">
                 Full Technical Documentation
               </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Protocol Credentials
              </CardTitle>
              <CardDescription>
                Manage your secure access credentials for the SONATE Protocol
              </CardDescription>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate New Credential
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{createdKey ? 'Protocol Credential Generated' : 'Generate New Protocol Credential'}</DialogTitle>
                  <DialogDescription>
                    {createdKey 
                      ? 'Copy this secret key and store it securely. For security, it will only be shown once.'
                      : 'These credentials allow your software to sign receipts and interact with the SONATE platform.'}
                  </DialogDescription>
                </DialogHeader>
                
                {!createdKey ? (
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Credential Label</Label>
                      <Input 
                        id="name" 
                        placeholder="e.g. SONATE-App-Production" 
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="py-4 space-y-4">
                    <div className="p-4 bg-muted rounded-md border break-all font-mono text-sm relative">
                      {createdKey}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => {
                          if (createdKey) {
                            navigator.clipboard.writeText(createdKey);
                            toast.success('Credential copied');
                          }
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <p>Building on SONATE requires this secret for all SDK initialization. Keep it private.</p>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  {!createdKey ? (
                    <>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateKey} disabled={createKeyMutation.isPending || !newKeyName} className="bg-purple-600 hover:bg-purple-700">
                        {createKeyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleCloseDialog} className="bg-purple-600 hover:bg-purple-700">I have saved it</Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name / Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead className="text-right">Requests (24h)</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                     Loading keys...
                   </TableCell>
                 </TableRow>
              ) : apiKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No API keys found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                apiKeys.map((key: any) => (
                  <ApiKeyRow 
                    key={key.id} 
                    apiKey={key} 
                    onRevoke={(id) => revokeKeyMutation.mutate(id)} 
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Rate Limiting
              </CardTitle>
              <CardDescription>
                Configure request limits per endpoint
              </CardDescription>
            </div>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Counters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Requests/min</TableHead>
                <TableHead>Burst Limit</TableHead>
                <TableHead>Enabled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rateLimitConfigs.map((config) => (
                <TableRow key={config.endpoint}>
                  <TableCell className="font-mono text-sm">{config.endpoint}</TableCell>
                  <TableCell>{config.requestsPerMinute}</TableCell>
                  <TableCell>{config.burstLimit}</TableCell>
                  <TableCell>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={() => toggleRateLimit(config.endpoint)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            API Documentation
          </CardTitle>
          <CardDescription>
            Quick reference for SONATE API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-100 text-green-800">GET</Badge>
                <code className="text-sm font-mono">/api/v1/agents</code>
              </div>
              <p className="text-sm text-muted-foreground">List all registered AI agents and their trust scores</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-100 text-green-800">GET</Badge>
                <code className="text-sm font-mono">/api/v1/trust/scores/:agentId</code>
              </div>
              <p className="text-sm text-muted-foreground">Get detailed SONATE trust scores for a specific agent</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-100 text-blue-800">POST</Badge>
                <code className="text-sm font-mono">/api/v1/trust/receipts</code>
              </div>
              <p className="text-sm text-muted-foreground">Create a new cryptographic trust receipt</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-100 text-green-800">GET</Badge>
                <code className="text-sm font-mono">/api/v1/audit/logs</code>
              </div>
              <p className="text-sm text-muted-foreground">Query audit trail logs with filtering options</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
