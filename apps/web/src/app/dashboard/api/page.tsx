'use client';

import { useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
  requests24h: number;
  status: 'active' | 'revoked' | 'expired';
  scopes: string[];
}

interface RateLimitConfig {
  endpoint: string;
  requestsPerMinute: number;
  burstLimit: number;
  enabled: boolean;
}

const mockApiKeys: ApiKey[] = [
  {
    id: 'key-001',
    name: 'Production API Key',
    key: 'sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    createdAt: '2025-01-15T10:00:00Z',
    lastUsed: '2025-12-25T08:30:00Z',
    requests24h: 15420,
    status: 'active',
    scopes: ['read:agents', 'write:agents', 'read:trust', 'read:audit']
  },
  {
    id: 'key-002',
    name: 'Development Key',
    key: 'sk_yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
    createdAt: '2025-02-20T14:00:00Z',
    lastUsed: '2025-12-24T16:45:00Z',
    requests24h: 3240,
    status: 'active',
    scopes: ['read:agents', 'read:trust']
  },
  {
    id: 'key-003',
    name: 'Legacy Integration',
    key: 'sk_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
    createdAt: '2024-06-10T09:00:00Z',
    lastUsed: '2025-11-01T12:00:00Z',
    requests24h: 0,
    status: 'expired',
    scopes: ['read:agents']
  }
];

const rateLimits: RateLimitConfig[] = [
  { endpoint: '/api/v1/agents', requestsPerMinute: 100, burstLimit: 150, enabled: true },
  { endpoint: '/api/v1/trust/scores', requestsPerMinute: 200, burstLimit: 300, enabled: true },
  { endpoint: '/api/v1/trust/receipts', requestsPerMinute: 50, burstLimit: 75, enabled: true },
  { endpoint: '/api/v1/audit/logs', requestsPerMinute: 30, burstLimit: 50, enabled: true },
  { endpoint: '/api/v1/experiments', requestsPerMinute: 20, burstLimit: 30, enabled: false }
];

const apiMetrics = {
  totalRequests24h: 142580,
  avgLatency: 45,
  errorRate: 0.12,
  activeKeys: 2
};

function ApiKeyRow({ apiKey }: { apiKey: ApiKey }) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyKey = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(apiKey.key);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard not available');
    }
  };

  const maskedKey = apiKey.key.slice(0, 7) + '••••••••••••••••••••••••••••';

  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">{apiKey.name}</div>
          <div className="text-xs text-muted-foreground font-mono">
            {showKey ? apiKey.key : maskedKey}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={
          apiKey.status === 'active' ? 'default' :
          apiKey.status === 'expired' ? 'secondary' : 'destructive'
        }>
          {apiKey.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {apiKey.scopes.slice(0, 2).map((scope) => (
            <Badge key={scope} variant="outline" className="text-xs">
              {scope}
            </Badge>
          ))}
          {apiKey.scopes.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{apiKey.scopes.length - 2}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">{apiKey.requests24h.toLocaleString('en-US')}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString('en-US') : 'Never'}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowKey(!showKey)}>
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={copyKey}>
            {copied ? <span className="text-xs text-green-600">Copied!</span> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function ApiGatewayPage() {
  const [rateLimitConfigs, setRateLimitConfigs] = useState(rateLimits);

  const toggleRateLimit = (endpoint: string) => {
    setRateLimitConfigs(prev => 
      prev.map(config => 
        config.endpoint === endpoint 
          ? { ...config, enabled: !config.enabled }
          : config
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Gateway</h1>
          <p className="text-muted-foreground flex items-center gap-1">
            Manage API keys, rate limits, and monitor usage
            <InfoTooltip term="API Key" />
            <InfoTooltip term="Rate Limiting" />
          </p>
        </div>
        <div className="data-source-badge data-source-live">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          Admin Access
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Requests (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiMetrics.totalRequests24h.toLocaleString('en-US')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              Avg Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiMetrics.avgLatency}ms</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiMetrics.errorRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4 text-purple-500" />
              Active Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiMetrics.activeKeys}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Manage authentication keys for API access
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Key
            </Button>
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
              {mockApiKeys.map((key) => (
                <ApiKeyRow key={key.id} apiKey={key} />
              ))}
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
              <p className="text-sm text-muted-foreground">Get detailed SYMBI trust scores for a specific agent</p>
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
