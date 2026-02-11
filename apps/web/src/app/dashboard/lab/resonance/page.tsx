'use client';

import React, { useState } from 'react';
import { ResonanceExplorer } from '@/components/ResonanceExplorer';
import { ExplainableReceiptCard } from '@/components/ExplainableReceiptCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Download, Shield, CheckCircle, ExternalLink, Info, Brain, Zap, Activity, Eye } from 'lucide-react';
import Link from 'next/link';

export default function ResonanceLabPage() {
  const [userInput, setUserInput] = useState('How do we ensure AI safety in high-stakes finance?');
  const [aiResponse, setAiResponse] = useState('We implement rigorous vector alignment and constitutional checks to ensure every transaction respects sovereign user intent and ethical boundaries.');
  const [historyStr, setHistoryStr] = useState('[{"role":"user","content":"Define resonance."}]');
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setReceipt(null);
    setError(null);
    try {
      let history = [];
      try { history = JSON.parse(historyStr); } catch (e) {}

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
        <div className="bg-gradient-to-br from-cyan-950/30 to-emerald-950/30 border border-cyan-900/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <Info className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
            <div className="space-y-3">
              <h3 className="font-semibold text-cyan-300">What is Resonance?</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong>Resonance</strong> measures the quality of alignment between human intent and AI response - 
                the emergent "Third Mind" that forms in human-AI collaboration. High resonance indicates the AI 
                truly understood and appropriately addressed the user's needs while maintaining ethical boundaries.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-semibold text-yellow-400">Vector Alignment</span>
                  </div>
                  <p className="text-xs text-slate-400">How well the response addresses the actual intent behind the query</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-blue-400">Context Continuity</span>
                  </div>
                  <p className="text-xs text-slate-400">Coherence with conversation history and established context</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-400">Semantic Mirroring</span>
                  </div>
                  <p className="text-xs text-slate-400">Quality of response scaffolding and structural alignment</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">Ethical Awareness</span>
                  </div>
                  <p className="text-xs text-slate-400">Constitutional scoring against CIVMOD principles</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-2">
                Receipts minted here are cryptographically signed and can be independently verified at{' '}
                <Link href="/dashboard/verify" className="text-cyan-400 hover:underline">
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
    </div>
  );
}
