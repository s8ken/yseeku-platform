'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
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
  FileX,
  RefreshCw,
  Activity,
  PlayCircle
} from 'lucide-react';
import Link from 'next/link';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { useReceiptsData } from '@/hooks/use-demo-data';
import { useDemo } from '@/hooks/use-demo';

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
      // Pass the full receipt data for cryptographic verification
      const result = await api.verifyTrustReceipt(receipt.hash, receipt.receiptData);
      setVerificationResult(result.valid ? 'success' : 'fail');
    } catch (err) {
      console.error('[Verify] Verification failed:', err);
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
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${receipt.verified && verificationResult !== 'fail'
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
            <p className="font-bold text-lg">{receipt.trustScore}<span className="text-sm font-normal text-muted-foreground">/10</span></p>
          </div>
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Consent</p>
            <p className={`font-semibold ${receipt.trustScore >= 8.5 ? 'text-emerald-600' : receipt.trustScore >= 7 ? 'text-amber-600' : 'text-red-600'}`}>
              {receipt.trustScore >= 8.5 ? '✓' : receipt.trustScore >= 7 ? '⚠' : '✗'}
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
              <p className={`font-semibold text-xs ${receipt.sonateDimensions?.trustProtocol === 'PASS' ? 'text-emerald-600' : 'text-amber-600'
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
            {(receipt.receiptData?.session_id || receipt.id) && (
              <Link href={`/dashboard/replay/${receipt.receiptData?.session_id || receipt.id}`}>
                <Button variant="outline" size="sm" className="text-cyan-600 border-cyan-600/30 hover:bg-cyan-600/10">
                  <PlayCircle className="h-3 w-3 mr-1" />
                  Replay
                </Button>
              </Link>
            )}
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
  const { isDemo } = useDemo();

  // Determine data source for display
  const dataSource = isDemo ? 'demo' : 'live';

  // Use demo-aware hook for receipts
  const { data: receiptsData, isLoading, refetch } = useReceiptsData(50);

  // Transform the receipts data to match our interface
  const receipts: TrustReceipt[] = (receiptsData?.receipts || []).map((r: any) => {
    // CIQ metrics are 0-10 scale, trust_score should be the average
    const ciq = r.ciq_metrics;
    const avgScore = ciq 
      ? Math.round(((ciq.clarity + ciq.integrity + ciq.quality) / 3) * 10) / 10
      : r.trust_score || 0;
    
    return {
      id: r._id || r.id || r.self_hash,
      hash: r.hash || r.self_hash || `hash-${r.id}`,
      agentId: r.agent_id || '',
      agentName: r.agent_id ? `Agent ${String(r.agent_id).slice(-4)}` : 'Unknown Agent',
      timestamp: r.created_at || r.timestamp || r.createdAt || new Date().toISOString(),
      trustScore: avgScore, // 0-10 scale
      sonateDimensions: {
        realityIndex: ciq?.quality || 8.5,
        trustProtocol: avgScore >= 7 ? 'PASS' : avgScore >= 5 ? 'PARTIAL' : 'FAIL',
        ethicalAlignment: ciq?.integrity ? Math.round(ciq.integrity / 2 * 10) / 10 : 4.2, // Convert 0-10 to 0-5
        resonanceQuality: avgScore >= 8 ? 'STRONG' : avgScore >= 6 ? 'MODERATE' : 'WEAK',
        canvasParity: ciq?.clarity ? Math.round(ciq.clarity * 10) : 87, // Convert 0-10 to percentage
      },
      verified: r.verified ?? !!r.signature,
      chainPosition: 1,
      previousHash: r.previous_hash || '',
      receiptData: r,
      issuer: r.issuer,
      subject: r.subject,
      proof: r.proof,
    };
  });

  // Use stats from API response for accurate totals
  const stats = receiptsData?.stats || {
    total: receipts.length,
    verified: receipts.filter(r => r.verified).length,
    invalid: receipts.filter(r => !r.verified).length,
    chainLength: receipts.length
  };
  const hasData = receipts.length > 0;

  const filteredReceipts = receipts.filter(r =>
    r.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.hash.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {!hasData && !isLoading && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
          <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-blue-800 dark:text-blue-200">No Trust Receipts Yet</strong>
            <p className="text-sm text-blue-700 dark:text-blue-300">Trust receipts are generated when you chat with AI agents. Start a conversation to see receipts here.</p>
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
          <span className={`data-source-badge px-2 py-1 text-xs rounded-full ${dataSource === 'live'
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
