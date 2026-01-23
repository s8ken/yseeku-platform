'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
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
  Loader2,
  ShieldCheck,
  ShieldAlert,
  FileX
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { api } from '@/lib/api';
import { useDemo } from '@/hooks/use-demo';
import { 
  FALLBACK_AGENTS as CENTRALIZED_AGENTS, 
  FALLBACK_RECEIPTS as CENTRALIZED_RECEIPTS,
  trustScoreToPercent,
  DEMO_TENANT_ID,
} from '@/lib/fallback-data';

interface TrustReceipt {
  id: string;
  hash: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  trustScore: number;
  sonateDimensions: {
    realityIndex: number;
    trustProtocol: string;
    ethicalAlignment: number;
    resonanceQuality: string;
    canvasParity: number;
  };
  verified: boolean;
  chainPosition: number;
  previousHash: string;
  receiptData?: any;
  // DID-related fields
  issuer?: string;
  subject?: string;
  proof?: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
  };
}

// Empty state component
function EmptyState() {
  return (
    <Card className="p-12 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <FileX className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">No Trust Receipts Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mt-2">
            Trust receipts are generated when AI agents complete interactions.
            Connect agents to your platform to start generating verifiable receipts.
          </p>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" asChild>
            <a href="/dashboard/agents">Configure Agents</a>
          </Button>
          <Button asChild>
            <a href="/docs/trust-receipts">Learn More</a>
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Fallback receipts - derived from centralized fallback-data.ts
const FALLBACK_RECEIPTS: TrustReceipt[] = CENTRALIZED_RECEIPTS.map((receipt, index) => {
  const agent = CENTRALIZED_AGENTS.find(a => a.id === receipt.agentId);
  return {
    id: receipt.id,
    hash: `0x${index}a9f4e2c8b1d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f`,
    agentId: receipt.agentId,
    agentName: agent ? `${agent.name} - ${agent.type}` : receipt.agentName,
    timestamp: receipt.timestamp,
    trustScore: receipt.trustScore, // Already 0-100 in receipts
    sonateDimensions: { 
      realityIndex: (receipt.trustScore / 10) - 0.1, 
      trustProtocol: receipt.trustScore >= 90 ? 'PASS' : 'PARTIAL', 
      ethicalAlignment: receipt.trustScore / 10, 
      resonanceQuality: receipt.trustScore >= 90 ? 'BREAKTHROUGH' : 'ADVANCED', 
      canvasParity: receipt.trustScore
    },
    verified: true,
    chainPosition: 4821 - index,
    previousHash: `0x${index + 1}b8e3d1c7a0f9e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d`,
    issuer: `did:sonate:${DEMO_TENANT_ID}:platform`,
    subject: `did:sonate:${DEMO_TENANT_ID}:agent:${receipt.agentId}`,
  };
});

function ReceiptCard({ receipt }: { receipt: TrustReceipt }) {
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'success' | 'fail' | null>(null);
  const [formattedTime, setFormattedTime] = useState('');

  useEffect(() => {
    setFormattedTime(new Date(receipt.timestamp).toLocaleString());
  }, [receipt.timestamp]);

  const verifyReceipt = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      // Use the real API to verify the receipt
      const result = await api.verifyTrustReceipt(receipt.hash);
      setVerificationResult(result.valid ? 'success' : 'fail');
    } catch (err) {
      console.error('Verification failed', err);
      setVerificationResult('fail');
    } finally {
      setIsVerifying(false);
    }
  };

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
    <Card className={cn(
      "transition-all duration-300",
      !receipt.verified || verificationResult === 'fail' ? 'border-l-4 border-l-red-500' : 
      verificationResult === 'success' ? 'border-l-4 border-l-emerald-500' : ''
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              receipt.verified && verificationResult !== 'fail'
                ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              {receipt.verified && verificationResult !== 'fail'
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
          <div className="text-right flex flex-col items-end gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Hash className="h-3 w-3" />
              Block #{receipt.chainPosition}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-[10px] uppercase font-bold tracking-wider"
                onClick={verifyReceipt}
                disabled={isVerifying}
              >
                {isVerifying ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
                {verificationResult === 'success' ? 'Verified' : verificationResult === 'fail' ? 'Invalid' : 'Verify Proof'}
              </Button>
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

        {/* Constitutional Compliance (Primary) */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Trust Score</p>
            <p className="font-bold text-lg">{receipt.trustScore}</p>
          </div>
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Consent</p>
            <p className={`font-semibold ${receipt.trustScore >= 85 ? 'text-emerald-600' : receipt.trustScore >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
              {receipt.trustScore >= 85 ? '✓' : receipt.trustScore >= 70 ? '⚠' : '✗'}
            </p>
          </div>
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Override</p>
            <p className={`font-semibold ${receipt.verified ? 'text-emerald-600' : 'text-red-600'}`}>
              {receipt.verified ? '✓' : '✗'}
            </p>
          </div>
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Disconnect</p>
            <p className="font-semibold text-emerald-600">✓</p>
          </div>
        </div>

        {/* Detection Metrics (Secondary - Collapsed) */}
        <details className="group">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1 mb-2">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            Detection Layer Metrics
          </summary>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-2 rounded bg-muted/30">
              <p className="text-xs text-muted-foreground">Reality</p>
              <p className="font-semibold">{receipt.sonateDimensions?.realityIndex ?? 'N/A'}/10</p>
            </div>
            <div className="text-center p-2 rounded bg-muted/30">
              <p className="text-xs text-muted-foreground">Protocol</p>
              <p className={`font-semibold text-xs ${
                receipt.sonateDimensions?.trustProtocol === 'PASS' ? 'text-emerald-600' : 'text-amber-600'
              }`}>{receipt.sonateDimensions?.trustProtocol ?? 'N/A'}</p>
            </div>
            <div className="text-center p-2 rounded bg-muted/30">
              <p className="text-xs text-muted-foreground">Ethics</p>
              <p className="font-semibold">{receipt.sonateDimensions?.ethicalAlignment ?? 'N/A'}/5</p>
            </div>
            <div className="text-center p-2 rounded bg-muted/30">
              <p className="text-xs text-muted-foreground">Canvas</p>
              <p className="font-semibold">{receipt.sonateDimensions?.canvasParity ?? 'N/A'}%</p>
            </div>
          </div>
        </details>

        {/* DID Information */}
        {(receipt.issuer || receipt.subject) && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Fingerprint className="h-3 w-3" />
              <span>Decentralized Identifiers (W3C DID)</span>
            </div>
            <div className="space-y-2">
              {receipt.issuer && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-14">Issuer:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1 truncate" title={receipt.issuer}>
                    {receipt.issuer}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => navigator.clipboard.writeText(receipt.issuer!)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {receipt.subject && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-14">Subject:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1 truncate" title={receipt.subject}>
                    {receipt.subject}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => navigator.clipboard.writeText(receipt.subject!)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {receipt.proof && (
                <div className="text-xs text-muted-foreground mt-2">
                  Signed with {receipt.proof.type} at {new Date(receipt.proof.created).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            Resonance: <strong>{receipt.sonateDimensions?.resonanceQuality ?? 'N/A'}</strong>
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
  const { isDemo, isLoaded } = useDemo();

  useEffect(() => {
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem('tenant') : null;
      setTenant(t || 'default');
    } catch {
      setTenant('default');
    }
  }, []);

  // Fetch real receipts from API
  const { data: receiptsData, isLoading: isLoadingReal } = useQuery({
    queryKey: ['trust-receipts', tenant],
    queryFn: async () => {
      const res = await api.getTrustReceiptsList({ limit: 50 });
      const rows = (res as any)?.receipts || (res as any)?.data || [];
      const mapped: TrustReceipt[] = rows.map((r: any) => ({
        id: r._id || r.self_hash,
        hash: r.self_hash,
        agentId: r.agent_id || '',
        agentName: r.agent_id ? `Agent ${String(r.agent_id).slice(-4)}` : 'Unknown Agent',
        timestamp: r.timestamp || r.createdAt || new Date().toISOString(),
        trustScore: r.ciq_metrics?.quality ? Math.round(r.ciq_metrics.quality * 100) / 10 : 0,
        sonateDimensions: {
          realityIndex: r.ciq_metrics?.quality ? r.ciq_metrics.quality * 10 : 0,
          trustProtocol: 'PASS',
          ethicalAlignment: r.ciq_metrics?.integrity ? r.ciq_metrics.integrity * 5 : 0,
          resonanceQuality: 'STRONG',
          canvasParity: r.ciq_metrics?.clarity ? Math.round(r.ciq_metrics.clarity * 100) : 0,
        },
        verified: !!r.signature,
        chainPosition: 1,
        previousHash: r.previous_hash || '',
        receiptData: r,
        issuer: r.issuer,
        subject: r.subject,
        proof: r.proof,
      }));
      return {
        success: true,
        data: mapped,
        stats: {
          total: mapped.length,
          verified: mapped.filter((x) => x.verified).length,
          invalid: mapped.filter((x) => !x.verified).length,
          chainLength: mapped.length,
        },
        source: 'backend',
      };
    },
    staleTime: 30000,
    enabled: !isDemo && isLoaded,
  });

  // Fetch demo receipts when in demo mode
  const { data: demoData, isLoading: isLoadingDemo } = useQuery({
    queryKey: ['demo-receipts'],
    queryFn: () => api.getDemoReceipts(),
    staleTime: 60000,
    enabled: isDemo && isLoaded,
  });

  const isLoading = !isLoaded || (isDemo ? isLoadingDemo : isLoadingReal);
  const hasRealData = receiptsData?.data && receiptsData.data.length > 0;
  const demoDataTyped = demoData as { data?: { receipts?: any[] } } | undefined;
  const hasDemoData = demoDataTyped?.data?.receipts && demoDataTyped.data.receipts.length > 0;

  // Map demo receipts to match TrustReceipt interface
  const demoReceipts: TrustReceipt[] = (demoDataTyped?.data?.receipts || []).map((r: any) => ({
    id: r._id || r.id,
    hash: r.hash || r.receipt_hash || '',
    agentId: r.agent_id || '',
    agentName: r.agent_name || 'Demo Agent',
    timestamp: r.timestamp || new Date().toISOString(),
    trustScore: r.trust_score || 85,
    sonateDimensions: r.sonate_dimensions || {
      realityIndex: 8.5,
      trustProtocol: 'PASS',
      ethicalAlignment: 4.2,
      resonanceQuality: 'ADVANCED',
      canvasParity: 90
    },
    verified: r.verified ?? true,
    chainPosition: r.chain_position || 1,
    previousHash: r.previous_hash || '',
    receiptData: r.receipt_data || {}
  }));

  // Determine which receipts to use - real, demo, or fallback
  const useFallback = !isLoading && !hasRealData && !hasDemoData;
  const receipts = isDemo && hasDemoData 
    ? demoReceipts 
    : (hasRealData ? (receiptsData?.data || []) : (useFallback ? FALLBACK_RECEIPTS : []));
  const stats = receiptsData?.stats || {
    total: receipts.length,
    verified: receipts.filter(r => r.verified).length,
    invalid: receipts.filter(r => !r.verified).length,
    chainLength: receipts.length
  };
  const dataSource = useFallback ? 'fallback' : (isDemo ? 'demo' : 'live');

  const filteredReceipts = receipts.filter(r => 
    r.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.hash.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {(dataSource === 'demo' || dataSource === 'fallback') && (
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
        {!isLoading && receipts.length === 0 ? (
          <EmptyState />
        ) : (
          filteredReceipts.map((receipt) => (
            <ReceiptCard key={receipt.id} receipt={receipt} />
          ))
        )}
      </div>
    </div>
  );
}
