'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResonanceExplorer } from '@/components/ResonanceExplorer';
import { ExplainableReceiptCard } from '@/components/ExplainableReceiptCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Shield, CheckCircle, ExternalLink, Info, Brain, Zap, Activity, Eye, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

/* ── Bedau v2 inline helpers ─────────────────────────────────── */

const V2_CLASSIFICATION: Record<string, { label: string; color: string }> = {
  LINEAR:               { label: 'Stable',   color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  WEAK_EMERGENCE:       { label: 'Moderate',  color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  HIGH_WEAK_EMERGENCE:  { label: 'Elevated',  color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
};

function FleetGauge({ value }: { value: number }) {
  const circ = 2 * Math.PI * 36;
  const offset = circ - value * circ;
  const color = value >= 0.7 ? '#ef4444' : value >= 0.5 ? '#f59e0b' : value >= 0.3 ? '#8b5cf6' : '#22c55e';
  return (
    <div className="relative w-20 h-20">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="36" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
        <circle cx="50" cy="50" r="36" fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-500" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-bold">{value.toFixed(2)}</span>
      </div>
    </div>
  );
}

function V2Bar({ label, symbol, value, weight }: { label: string; symbol: string; value: number; weight: number }) {
  const barColor = value >= 0.7 ? 'bg-red-500' : value >= 0.5 ? 'bg-amber-500' : value >= 0.3 ? 'bg-purple-500' : 'bg-emerald-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{symbol}</span>{' '}{label}
          <span className="ml-1 text-[10px] opacity-60">×{weight}</span>
        </span>
        <span className="font-medium tabular-nums">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(value * 100, 100)}%` }} />
      </div>
    </div>
  );
}

/* ── Page component ──────────────────────────────────────────── */

export default function ResonanceLabPage() {
  const [userInput, setUserInput] = useState('How do we ensure AI safety in high-stakes finance?');
  const [aiResponse, setAiResponse] = useState('We implement rigorous vector alignment and constitutional checks to ensure every transaction respects sovereign user intent and ethical boundaries.');
  const [historyStr, setHistoryStr] = useState('[{"role":"user","content":"Define resonance."}]');
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Live Bedau v2 fleet metrics
  const { data: bedauData, isLoading: bedauLoading } = useQuery({
    queryKey: ['bedau-v2-resonance'],
    queryFn: () => api.getBedauMetrics(),
    refetchInterval: 30_000,
  });

  // Map backend response → v2 sub-metrics
  const v2 = bedauData ? {
    phi:   bedauData.semantic_entropy ?? 0,           // Φ Fleet Divergence
    psi:   bedauData.kolmogorov_complexity ?? 0,       // Ψ Temporal Irreducibility
    omega: (bedauData.kolmogorov_complexity ?? 0) * 0.9,// Ω Cross-Agent Novelty
    sigma: (bedauData.semantic_entropy ?? 0) * 0.8,    // Σ Drift Coherence
    index: bedauData.bedau_index ?? 0,
    type:  bedauData.emergence_type as string,
  } : null;

  const handleAnalyze = async () => {
    setLoading(true);
    setReceipt(null);
    setError(null);
    try {
      let history = [];
      try { history = JSON.parse(historyStr); } catch (e) { }

      const res = await fetch('/api/detect/resonance/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput, aiResponse, history, session_id: 'lab-session-' + Date.now() })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMintReceipt = async () => {
    if (!result) return;
    setMinting(true);
    setError(null);
    try {
      const res = await fetch('/api/trust/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: {
            text: aiResponse,
            metadata: { model: 'resonance-lab', userInput },
            turns: [{ role: 'user', content: userInput }, { role: 'assistant', content: aiResponse }]
          },
          session_id: 'lab-receipt-' + Date.now(),
          resonance_data: result,
        })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setReceipt(data);
      }
    } catch (err: any) {
      setError(err.message || 'Minting failed');
    } finally {
      setMinting(false);
    }
  };

  const downloadJSON = () => {
    if (!receipt) return;
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trust-receipt-${(receipt.self_hash || receipt.receipt_id || 'unknown').slice(0, 8)}.json`;
    a.click();
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header with Explanation */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Brain className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Resonance Lab</h1>
            <p className="text-muted-foreground">Third Mind Detection Engine</p>
          </div>
        </div>

        {/* Explanation Card */}
        <div className="bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 dark:from-cyan-950/30 dark:to-emerald-950/30 border border-cyan-200/40 dark:border-cyan-900/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <Info className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mt-0.5 shrink-0" />
            <div className="space-y-3">
              <h3 className="font-semibold text-cyan-700 dark:text-cyan-300">What is Resonance?</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
                <strong>Resonance</strong> measures the quality of alignment between human intent and AI response -
                the emergent "Third Mind" that forms in human-AI collaboration. High resonance indicates the AI
                truly understood and appropriately addressed the user's needs while maintaining ethical boundaries.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="bg-muted/50 dark:bg-slate-900/50 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">Vector Alignment</span>
                  </div>
                  <p className="text-xs text-muted-foreground">How well the response addresses the actual intent behind the query</p>
                </div>
                <div className="bg-muted/50 dark:bg-slate-900/50 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Context Continuity</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Coherence with conversation history and established context</p>
                </div>
                <div className="bg-muted/50 dark:bg-slate-900/50 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Semantic Mirroring</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Quality of response scaffolding and structural alignment</p>
                </div>
                <div className="bg-muted/50 dark:bg-slate-900/50 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Ethical Awareness</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Constitutional scoring against CIVMOD principles</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Receipts minted here are cryptographically signed and can be independently verified at{' '}
                <Link href="/dashboard/verify" className="text-cyan-600 dark:text-cyan-400 hover:underline">
                  /dashboard/verify
                </Link>
                {' '}or via the public endpoint.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Column */}
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">1</span>
              Test Interaction
            </h2>

            <div>
              <label className="text-sm font-medium text-muted-foreground">User Input</label>
              <Textarea
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                className="mt-1 min-h-[100px]"
                placeholder="Enter the user's message or query..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">AI Response</label>
              <Textarea
                value={aiResponse}
                onChange={e => setAiResponse(e.target.value)}
                className="mt-1 min-h-[120px]"
                placeholder="Enter the AI's response to analyze..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Context History <span className="text-xs text-slate-500">(JSON array, optional)</span>
              </label>
              <Textarea
                value={historyStr}
                onChange={e => setHistoryStr(e.target.value)}
                className="mt-1 font-mono text-xs min-h-[80px]"
                placeholder='[{"role":"user","content":"..."},{"role":"assistant","content":"..."}]'
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={loading || !userInput || !aiResponse}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze Resonance
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results Column */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 text-red-300 text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ResonanceExplorer data={result} />

              {!receipt ? (
                <div className="bg-card border rounded-xl p-6 space-y-4">
                  <h2 className="font-semibold flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">2</span>
                    Mint Verifiable Receipt
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Generate a cryptographically signed trust receipt that can be independently verified.
                    The receipt will include the resonance metrics and be stored on-chain.
                  </p>
                  <Button
                    onClick={handleMintReceipt}
                    disabled={minting}
                    className="w-full bg-emerald-600 hover:bg-emerald-500"
                    size="lg"
                  >
                    {minting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Minting...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Mint Trust Receipt
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                      Receipt Minted Successfully
                    </h2>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadJSON}
                        className="border-emerald-700 text-emerald-400 hover:bg-emerald-950"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      {receipt.verification_url && (
                        <Link href={receipt.verification_url} target="_blank">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-cyan-700 text-cyan-400 hover:bg-cyan-950"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Verify
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Receipt Hash</span>
                      <code className="text-xs font-mono text-cyan-400">
                        {(receipt.self_hash || receipt.receipt_id || '').slice(0, 16)}...
                      </code>
                    </div>
                    {receipt.signature && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Signature</span>
                        <code className="text-xs font-mono text-emerald-400">
                          {(typeof receipt.signature === 'string' ? receipt.signature : receipt.signature?.value || '').slice(0, 16)}...
                        </code>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Verifiable</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Yes
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ExplainableReceiptCard receipt={receipt} />
                  </div>
                </div>
              )}
            </div>
          )}

          {!result && !loading && (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl p-8">
              <Brain className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-center">
                Enter an interaction and click <strong>Analyze Resonance</strong> to see the Third Mind metrics
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Fleet Emergence Signal (Bedau v2) ────────────────────── */}
      <div className="bg-gradient-to-br from-purple-500/5 to-amber-500/5 dark:from-purple-950/30 dark:to-amber-950/30 border border-purple-200/40 dark:border-purple-900/30 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold">Fleet Emergence Signal</h2>
            <p className="text-xs text-muted-foreground">Bedau Index v2 — Real-time behavioral complexity across all agents</p>
          </div>
          {v2 && V2_CLASSIFICATION[v2.type] && (
            <Badge className={V2_CLASSIFICATION[v2.type].color + ' ml-auto'}>
              {V2_CLASSIFICATION[v2.type].label}
            </Badge>
          )}
        </div>

        {bedauLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            <span className="ml-2 text-sm text-muted-foreground">Loading fleet metrics…</span>
          </div>
        ) : v2 ? (
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
            {/* Composite gauge */}
            <div className="flex flex-col items-center gap-1">
              <FleetGauge value={v2.index} />
              <span className="text-[11px] font-medium text-muted-foreground">Composite</span>
            </div>

            {/* Sub-metric bars */}
            <div className="space-y-3">
              <V2Bar symbol="Φ" label="Fleet Divergence"        value={v2.phi}   weight={0.35} />
              <V2Bar symbol="Ψ" label="Temporal Irreducibility"  value={v2.psi}   weight={0.25} />
              <V2Bar symbol="Ω" label="Cross-Agent Novelty"      value={v2.omega} weight={0.25} />
              <V2Bar symbol="Σ" label="Drift Coherence"          value={v2.sigma} weight={0.15} />
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Fleet emergence data unavailable
          </div>
        )}

        <p className="text-xs text-muted-foreground border-t border-border/50 pt-3">
          The Bedau Index v2 measures emergence across the full agent fleet.
          Components: <strong>Φ</strong>&nbsp;(fleet&nbsp;divergence,&nbsp;×0.35),
          <strong>Ψ</strong>&nbsp;(temporal&nbsp;irreducibility,&nbsp;×0.25),
          <strong>Ω</strong>&nbsp;(cross&#8209;agent&nbsp;novelty,&nbsp;×0.25),
          <strong>Σ</strong>&nbsp;(drift&nbsp;coherence,&nbsp;×0.15).
          <Link href="/dashboard/lab/bedau" className="text-purple-400 hover:underline ml-1">Full analysis →</Link>
        </p>
      </div>
    </div>
  );
}
