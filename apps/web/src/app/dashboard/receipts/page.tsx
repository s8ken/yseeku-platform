'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Fingerprint, 
  CheckCircle2, 
  XCircle,
  Clock,
  Hash,
  Shield,
  Search,
  Download,
  ExternalLink,
  Copy,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface TrustReceipt {
  id: string;
  hash: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  trustScore: number;
  symbiDimensions: {
    realityIndex: number;
    trustProtocol: string;
    ethicalAlignment: number;
    resonanceQuality: string;
    canvasParity: number;
  };
  verified: boolean;
  chainPosition: number;
  previousHash: string;
}

const mockReceipts: TrustReceipt[] = [
  {
    id: 'receipt-001',
    hash: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    agentId: 'agent-001',
    agentName: 'GPT-4 Assistant',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    trustScore: 89,
    symbiDimensions: {
      realityIndex: 8.7,
      trustProtocol: 'PASS',
      ethicalAlignment: 4.3,
      resonanceQuality: 'ADVANCED',
      canvasParity: 92
    },
    verified: true,
    chainPosition: 15847,
    previousHash: '0x6a4e8b..."'
  },
  {
    id: 'receipt-002',
    hash: '0x8e959b75dae313da8cf4f72814fc143f8f7779c6eb9f7fa17299aeadb6889018',
    agentId: 'agent-002',
    agentName: 'Claude Analyst',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    trustScore: 94,
    symbiDimensions: {
      realityIndex: 9.2,
      trustProtocol: 'PASS',
      ethicalAlignment: 4.7,
      resonanceQuality: 'BREAKTHROUGH',
      canvasParity: 96
    },
    verified: true,
    chainPosition: 15846,
    previousHash: '0x3c2a7d...'
  },
  {
    id: 'receipt-003',
    hash: '0x4e454e532042595445530a1a0000000d49484452000000c0000000c008060000',
    agentId: 'agent-003',
    agentName: 'Mistral Coder',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    trustScore: 73,
    symbiDimensions: {
      realityIndex: 7.1,
      trustProtocol: 'PARTIAL',
      ethicalAlignment: 3.8,
      resonanceQuality: 'STRONG',
      canvasParity: 78
    },
    verified: true,
    chainPosition: 15845,
    previousHash: '0x9f8e7c...'
  },
  {
    id: 'receipt-004',
    hash: '0xc3fcd3d76192e4007dfb496cca67e13b2f5b7c1d3e9a8b7c6d5e4f3a2b1c0d9e',
    agentId: 'agent-001',
    agentName: 'GPT-4 Assistant',
    timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    trustScore: 86,
    symbiDimensions: {
      realityIndex: 8.5,
      trustProtocol: 'PASS',
      ethicalAlignment: 4.2,
      resonanceQuality: 'ADVANCED',
      canvasParity: 89
    },
    verified: false,
    chainPosition: 15844,
    previousHash: '0x2b3c4d...'
  }
];

function ReceiptCard({ receipt }: { receipt: TrustReceipt }) {
  const [copied, setCopied] = useState(false);
  const [formattedTime, setFormattedTime] = useState('');

  useEffect(() => {
    setFormattedTime(new Date(receipt.timestamp).toLocaleString());
  }, [receipt.timestamp]);

  const copyHash = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(receipt.hash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard not available');
    }
  };

  return (
    <Card className={!receipt.verified ? 'border-l-4 border-l-red-500' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              receipt.verified 
                ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              {receipt.verified 
                ? <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                : <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              }
            </div>
            <div>
              <CardTitle className="text-base">{receipt.agentName}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-0.5">
                <Clock className="h-3 w-3" />
                {formattedTime || '...'}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Hash className="h-3 w-3" />
              Block #{receipt.chainPosition}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                receipt.verified 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {receipt.verified ? 'VERIFIED' : 'INVALID'}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 rounded-lg bg-muted/50 font-mono text-xs break-all">
          <div className="flex items-center justify-between mb-1">
            <span className="text-muted-foreground">Receipt Hash</span>
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={copyHash}>
              {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          {receipt.hash}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Trust Score</p>
            <p className="font-bold text-lg">{receipt.trustScore}</p>
          </div>
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Reality</p>
            <p className="font-semibold">{receipt.symbiDimensions.realityIndex}/10</p>
          </div>
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Protocol</p>
            <p className={`font-semibold text-xs ${
              receipt.symbiDimensions.trustProtocol === 'PASS' ? 'text-emerald-600' : 'text-amber-600'
            }`}>{receipt.symbiDimensions.trustProtocol}</p>
          </div>
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Ethics</p>
            <p className="font-semibold">{receipt.symbiDimensions.ethicalAlignment}/5</p>
          </div>
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Canvas</p>
            <p className="font-semibold">{receipt.symbiDimensions.canvasParity}%</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            Resonance: <strong>{receipt.symbiDimensions.resonanceQuality}</strong>
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-3 w-3 mr-1" />
              View Chain
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TrustReceiptsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tenant, setTenant] = useState('default');
  
  useEffect(() => {
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem('tenant') : null;
      setTenant(t || 'default');
    } catch {
      setTenant('default');
    }
  }, []);

  const { data: receiptsData, isLoading } = useQuery({
    queryKey: ['trust-receipts', tenant],
    queryFn: async () => {
      const response = await fetch(`/api/trust-receipts?tenant=${tenant}&limit=50`);
      if (!response.ok) throw new Error('Failed to fetch receipts');
      return response.json() as Promise<{ 
        success: boolean; 
        data: TrustReceipt[]; 
        stats: { total: number; verified: number; invalid: number; chainLength: number };
        source: string;
      }>;
    },
    staleTime: 30000,
  });

  const receipts = receiptsData?.data?.length ? receiptsData.data : mockReceipts;
  const stats = receiptsData?.stats || { total: mockReceipts.length, verified: mockReceipts.filter(r => r.verified).length, invalid: mockReceipts.filter(r => !r.verified).length, chainLength: mockReceipts.length };
  const dataSource = receiptsData?.source === 'database' && receiptsData.data.length > 0 ? 'live' : 'demo';

  const filteredReceipts = receipts.filter(r => 
    r.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.hash.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {dataSource === 'demo' && (
        <div className="demo-notice mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-800 dark:text-amber-200">Demo Data</strong>
            <p className="text-sm text-amber-700 dark:text-amber-300">Trust receipts shown are demonstration examples. Real receipts will appear once agents are connected.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Trust Receipts
            <InfoTooltip term="Trust Receipt" />
          </h1>
          <p className="text-muted-foreground flex items-center gap-1">
            Cryptographic verification of AI interaction trust scores
            <InfoTooltip term="Hash Chain" />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`data-source-badge px-2 py-1 text-xs rounded-full ${
            dataSource === 'live' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
          }`}>
            {dataSource === 'live' ? 'Live Data' : 'Demo Data'}
          </span>
          <span className="module-badge badge-orchestrate">ORCHESTRATE</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-[var(--orchestrate-primary)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-[var(--orchestrate-primary)]" />
              Total Receipts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.verified.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.total > 0 ? ((stats.verified / stats.total) * 100).toFixed(2) : 0}% valid</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Invalid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.invalid}</div>
            <p className="text-xs text-muted-foreground mt-1">Signature failures</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chain Length</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.chainLength.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Blocks</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search by agent name or hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>

      <div className="space-y-4">
        {filteredReceipts.map((receipt) => (
          <ReceiptCard key={receipt.id} receipt={receipt} />
        ))}
      </div>
    </div>
  );
}
