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
  PlayCircle,
  Zap,
  Tag,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
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
  // SONATE principle scores (0-10)
  consentScore: number;
  overrideScore: number;
  disconnectScore: number;
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
  // BREAKTHROUGH classification
  resonanceQuality?: 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';
  humanReview?: {
    status: 'pending' | 'productive' | 'regressive' | 'uncertain';
    reviewed_by?: string;
    reviewed_at?: string;
    notes?: string;
  };
}

// ─── BREAKTHROUGH Classify Modal ─────────────────────────────────────────────

function ClassifyModal({
  hash,
  currentStatus,
  onClose,
  onClassified,
}: {
  hash: string;
  currentStatus?: string;
  onClose: () => void;
  onClassified: (status: 'productive' | 'regressive' | 'uncertain') => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const classify = async (status: 'productive' | 'regressive' | 'uncertain') => {
    setSubmitting(true);
    setError('');
    try {
      await api.classifyBreakthroughReceipt(hash, { status, notes: notes.trim() || undefined });
      onClassified(status);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Classification failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-background border border-border rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Classify BREAKTHROUGH Event</h3>
            <p className="text-xs text-muted-foreground font-mono">{hash.substring(0, 20)}...</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          The detector scores <strong>intensity</strong>. Human review scores <strong>direction</strong>.
          Was this interaction genuinely productive, or did high coherence mirror an unfalsifiable premise?
        </p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <button
            onClick={() => classify('productive')}
            disabled={submitting}
            className="flex flex-col items-center gap-2 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors disabled:opacity-50"
          >
            <ThumbsUp className="h-5 w-5" />
            <span className="text-xs font-medium">Productive</span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">Opens inquiry, produces artifacts</span>
          </button>

          <button
            onClick={() => classify('regressive')}
            disabled={submitting}
            className="flex flex-col items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
          >
            <ThumbsDown className="h-5 w-5" />
            <span className="text-xs font-medium">Regressive</span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">Closes inquiry, mirrors premise</span>
          </button>

          <button
            onClick={() => classify('uncertain')}
            disabled={submitting}
            className="flex flex-col items-center gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors disabled:opacity-50"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="text-xs font-medium">Uncertain</span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">Needs more context</span>
          </button>
        </div>

        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</label>
          <Input
            placeholder="Reasoning for classification..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-sm"
          />
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {currentStatus && currentStatus !== 'pending' && (
          <p className="text-xs text-muted-foreground mb-3">
            Currently classified as: <strong className="capitalize">{currentStatus}</strong>
          </p>
        )}

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
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
  const [showClassifyModal, setShowClassifyModal] = useState(false);
  const [classifiedStatus, setClassifiedStatus] = useState<string | undefined>(receipt.humanReview?.status);

  const isBreakthrough = receipt.resonanceQuality === 'BREAKTHROUGH';

  const canVerify = !!(
    receipt.receiptData?.signature ||
    receipt.receiptData?.proof?.proofValue ||
    receipt.proof?.proofValue
  );

  useEffect(() => {
    setFormattedTime(new Date(receipt.timestamp).toLocaleString());
  }, [receipt.timestamp]);

  const verifyReceipt = async () => {
    if (!canVerify) {
      return;
    }
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
    <>
    {showClassifyModal && (
      <ClassifyModal
        hash={receipt.hash}
        currentStatus={classifiedStatus}
        onClose={() => setShowClassifyModal(false)}
        onClassified={(status) => setClassifiedStatus(status)}
      />
    )}
    <Card className={cn(
      "transition-all duration-300",
      isBreakthrough ? 'border-l-4 border-l-purple-500' :
      !receipt.verified || verificationResult === 'fail' ? 'border-l-4 border-l-red-500' :
        verificationResult === 'success' ? 'border-l-4 border-l-emerald-500' : ''
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              isBreakthrough ? 'bg-purple-100 dark:bg-purple-900/30' :
              receipt.verified && verificationResult !== 'fail'
                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
              }`}>
              {isBreakthrough
                ? <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                : receipt.verified && verificationResult !== 'fail'
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  : <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              }
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{receipt.agentName}</CardTitle>
                {isBreakthrough && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Zap className="h-2.5 w-2.5" />
                    BREAKTHROUGH
                  </span>
                )}
              </div>
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
                disabled={!canVerify || isVerifying}
              >
                {isVerifying ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
                {!canVerify ? 'Unsigned' : verificationResult === 'success' ? 'Verified' : verificationResult === 'fail' ? 'Invalid' : 'Verify Proof'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] uppercase font-bold tracking-wider"
                onClick={() => {
                  const verifyUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://yseeku.com'}/verify?hash=${receipt.hash}`;
                  navigator.clipboard.writeText(verifyUrl);
                }}
                title="Copy public verification link"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Share
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

        {/* Chain Timeline View */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">Chain Position</p>
          <div className="flex flex-col gap-0">
            {/* Current Receipt */}
            <div className="flex items-start gap-2">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-emerald-400 mt-0.5 shrink-0" />
                {receipt.previousHash &amp;&amp; <div className="w-0.5 h-8 bg-border mt-0.5" />}
              </div>
              <div className="pb-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-emerald-600">Block #{receipt.chainPosition}</span>
                  <span className="text-xs text-muted-foreground">(current)</span>
                </div>
                <p className="font-mono text-[10px] text-muted-foreground truncate max-w-[280px]">{receipt.hash}</p>
              </div>
            </div>

            {/* Previous Receipt */}
            {receipt.previousHash ? (
              <div className="flex items-start gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground/40 border-2 border-muted-foreground/30 mt-0.5 shrink-0" />
                  {receipt.chainPosition > 2 &amp;&amp; <div className="w-0.5 h-8 bg-border mt-0.5" />}
                </div>
                <div className="pb-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-muted-foreground">Block #{receipt.chainPosition - 1}</span>
                    <a
                      href={`${process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://yseeku.com'}/verify?hash=${receipt.previousHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      verify
                    </a>
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground truncate max-w-[280px]">{receipt.previousHash}</p>
                </div>
              </div>
            ) : null}

            {/* Genesis indicator */}
            {receipt.chainPosition <= 2 &amp;&amp; (
              <div className="flex items-start gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-violet-500/40 border-2 border-violet-400/40 mt-0.5 shrink-0" />
                </div>
                <div className="pb-1 min-w-0">
                  <span className="text-xs font-semibold text-violet-500/70">Genesis Block</span>
                  <p className="text-[10px] text-muted-foreground">Chain origin — no prior receipt</p>
                </div>
              </div>
            )}

            {/* Deep chain indicator */}
            {receipt.chainPosition > 2 &amp;&amp; (
              <div className="flex items-start gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-muted/60 border border-dashed border-muted-foreground/30 mt-0.5 shrink-0" />
                </div>
                <div className="pb-1 min-w-0">
                  <span className="text-[10px] text-muted-foreground">… {receipt.chainPosition - 2} earlier block{receipt.chainPosition - 2 !== 1 ? 's' : ''} in chain</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Constitutional Compliance (Primary) */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Trust Score</p>
            <p className="font-bold text-lg">{receipt.trustScore}<span className="text-sm font-normal text-muted-foreground">/10</span></p>
          </div>
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Consent</p>
            <p className={`font-semibold ${receipt.consentScore >= 8 ? 'text-emerald-600' : receipt.consentScore >= 6 ? 'text-amber-600' : 'text-red-600'}`}>
              {receipt.consentScore >= 8 ? '✓' : receipt.consentScore >= 6 ? '⚠' : '✗'}
            </p>
          </div>
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Override</p>
            <p className={`font-semibold ${receipt.overrideScore >= 8 ? 'text-emerald-600' : receipt.overrideScore >= 6 ? 'text-amber-600' : 'text-red-600'}`}>
              {receipt.overrideScore >= 8 ? '✓' : receipt.overrideScore >= 6 ? '⚠' : '✗'}
            </p>
          </div>
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">Disconnect</p>
            <p className={`font-semibold ${receipt.disconnectScore >= 8 ? 'text-emerald-600' : receipt.disconnectScore >= 6 ? 'text-amber-600' : 'text-red-600'}`}>
              {receipt.disconnectScore >= 8 ? '✓' : receipt.disconnectScore >= 6 ? '⚠' : '✗'}
            </p>
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

        {/* BREAKTHROUGH review status */}
        {isBreakthrough && (
          <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs text-purple-300">
                {classifiedStatus && classifiedStatus !== 'pending'
                  ? <>Human review: <strong className="capitalize">{classifiedStatus}</strong></>
                  : 'Awaiting human review classification'
                }
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] uppercase font-bold tracking-wider border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
              onClick={() => setShowClassifyModal(true)}
            >
              <Zap className="h-3 w-3 mr-1" />
              {classifiedStatus && classifiedStatus !== 'pending' ? 'Reclassify' : 'Classify'}
            </Button>
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
    </>
  );
}

export default function TrustReceiptsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [breakthroughOnly, setBreakthroughOnly] = useState(false);
  const { isDemo } = useDemo();

  // Determine data source for display
  const dataSource = isDemo ? 'demo' : 'live';

  // Use demo-aware hook for receipts
  const { data: receiptsData, isLoading, refetch } = useReceiptsData(50);

  // Transform the receipts data to match our interface
  const receipts: TrustReceipt[] = (receiptsData?.receipts || []).map((r: any) => {
    // CIQ metrics from DB are on 0-1 scale; convert to 0-10 for display
    const ciq = r.ciq_metrics;
    const ciqClarity  = ciq?.clarity  ?? 0;
    const ciqIntegrity = ciq?.integrity ?? 0;
    const ciqQuality  = ciq?.quality  ?? 0;
    // Convert CIQ to 0-10 display: 0-1 scale → ×10, 1-5 scale → ×2, already 0-10 → keep
    const scale = (v: number) => v <= 1 ? Math.round(v * 100) / 10 : v <= 5 ? Math.round(v * 20) / 10 : Math.round(v * 10) / 10;
    const clarity10 = scale(ciqClarity);
    const integrity10 = scale(ciqIntegrity);
    const quality10 = scale(ciqQuality);

    // Use overall_trust_score from persistent receipt (0-100) → 0-10 display
    const overallFromReceipt = r.overall_trust_score;
    const avgScore = overallFromReceipt != null
      ? Math.round(overallFromReceipt) / 10   // 86 → 8.6
      : ciq
        ? Math.round(((clarity10 + integrity10 + quality10) / 3) * 10) / 10
        : r.trust_score || 0;

    // Use actual SONATE principle scores when available (0-10 scale)
    const principles = r.sonate_principles || {};
    
    return {
      id: r._id || r.id || r.self_hash,
      hash: r.hash || r.self_hash || `hash-${r.id}`,
      agentId: r.agent_id || '',
      agentName: r.agent_id ? `Agent ${String(r.agent_id).slice(-4)}` : 'Unknown Agent',
      timestamp: r.created_at || r.timestamp || r.createdAt || new Date().toISOString(),
      trustScore: avgScore, // 0-10 scale
      consentScore: principles.CONSENT_ARCHITECTURE ?? (avgScore >= 7 ? 9 : avgScore >= 5 ? 7 : 4),
      overrideScore: principles.ETHICAL_OVERRIDE ?? (avgScore >= 7 ? 8 : avgScore >= 5 ? 6 : 3),
      disconnectScore: principles.RIGHT_TO_DISCONNECT ?? 9,
      sonateDimensions: {
        realityIndex: quality10 || 8.5,
        trustProtocol: avgScore >= 7 ? 'PASS' : avgScore >= 5 ? 'PARTIAL' : 'FAIL',
        ethicalAlignment: integrity10 ? Math.round(integrity10 / 2 * 10) / 10 : 4.2, // 0-10 → 0-5
        resonanceQuality: avgScore >= 8 ? 'STRONG' : avgScore >= 6 ? 'MODERATE' : 'WEAK',
        canvasParity: clarity10 ? Math.round(clarity10 * 10) : 87, // 0-10 → percentage
      },
      verified: r.verified ?? (!!r.signature || (!!r.self_hash && ['PASS', 'PARTIAL'].includes(r.trust_status))),
      chainPosition: 1,
      previousHash: r.previous_hash || '',
      receiptData: r,
      issuer: r.issuer,
      subject: r.subject,
      proof: r.proof,
      // BREAKTHROUGH classification — read from DB, not derived from score
      resonanceQuality: r.resonance_quality as 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH' | undefined,
      humanReview: r.human_review,
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
  const breakthroughCount = receipts.filter(r => r.resonanceQuality === 'BREAKTHROUGH').length;
  const unreviewedBreakthroughCount = receipts.filter(
    r => r.resonanceQuality === 'BREAKTHROUGH' && (!r.humanReview?.status || r.humanReview.status === 'pending')
  ).length;

  const filteredReceipts = receipts.filter(r => {
    const matchesSearch =
      r.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.hash.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBreakthrough = !breakthroughOnly || r.resonanceQuality === 'BREAKTHROUGH';
    return matchesSearch && matchesBreakthrough;
  });

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

      <div className="grid gap-4 md:grid-cols-5">
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

        <Card
          className={cn(
            'cursor-pointer transition-all border-l-4',
            breakthroughOnly ? 'border-l-purple-500 bg-purple-500/5' : 'border-l-purple-500/40'
          )}
          onClick={() => setBreakthroughOnly(v => !v)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-400" />
              BREAKTHROUGH
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : breakthroughCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {unreviewedBreakthroughCount > 0
                ? <span className="text-amber-500">{unreviewedBreakthroughCount} need review</span>
                : 'All reviewed'
              }
            </p>
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
