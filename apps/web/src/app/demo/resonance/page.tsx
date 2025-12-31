// apps/web/src/app/demo/resonance/page.tsx
'use client';

import React, { useState } from 'react';
import { ResonanceExplorer } from '@/components/ResonanceExplorer';
import { ExplainableReceiptCard } from '@/components/ExplainableReceiptCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Download } from 'lucide-react';

export default function ResonanceDemoPage() {
  const [userInput, setUserInput] = useState('How do we ensure AI safety in high-stakes finance?');
  const [aiResponse, setAiResponse] = useState('We implement rigorous vector alignment and constitutional checks to ensure every transaction respects sovereign user intent and ethical boundaries.');
  const [historyStr, setHistoryStr] = useState('[{"role":"user","content":"Define resonance."}]');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [receipt, setReceipt] = useState<any>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setReceipt(null);
    try {
      let history = [];
      try { history = JSON.parse(historyStr); } catch (e) {}

      const res = await fetch('/api/detect/resonance/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput, aiResponse, history, session_id: 'demo-session-' + Date.now() })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMintReceipt = async () => {
    if (!result) return;
    try {
      const res = await fetch('/api/trust/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            transcript: { 
                text: aiResponse, 
                metadata: { model: 'demo-model' },
                turns: [{ role: 'user', content: userInput }, { role: 'assistant', content: aiResponse }] 
            }, 
            session_id: 'demo-receipt-' + Date.now() 
        })
      });
      const data = await res.json();
      setReceipt(data);
    } catch (err) {
      console.error(err);
    }
  };

  const downloadJSON = () => {
    if (!receipt) return;
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trust-receipt-${receipt.receipt_id.slice(0,8)}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Column */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              Resonance Demo
            </h1>
            <p className="text-slate-400">Test the "Third Mind" detection engine in real-time.</p>
          </div>

          <div className="space-y-4 bg-slate-900/50 p-6 rounded-xl border border-slate-800">
            <div>
              <label className="text-sm font-semibold text-slate-300">User Input</label>
              <Textarea 
                value={userInput} 
                onChange={e => setUserInput(e.target.value)} 
                className="bg-slate-950 border-slate-700 h-24 mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-semibold text-slate-300">AI Response</label>
              <Textarea 
                value={aiResponse} 
                onChange={e => setAiResponse(e.target.value)} 
                className="bg-slate-950 border-slate-700 h-32 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-300">Context History (JSON)</label>
              <Textarea 
                value={historyStr} 
                onChange={e => setHistoryStr(e.target.value)} 
                className="bg-slate-950 border-slate-700 h-24 font-mono text-xs mt-1"
              />
            </div>

            <Button 
                onClick={handleAnalyze} 
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Analyze Resonance"}
            </Button>
          </div>
        </div>

        {/* Results Column */}
        <div className="space-y-6">
          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                
              <ResonanceExplorer data={result} />

              {!receipt ? (
                  <Button 
                    onClick={handleMintReceipt} 
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-lg"
                  >
                    Mint Trust Receipt
                  </Button>
              ) : (
                  <div className="bg-slate-900/90 rounded-xl border border-emerald-900/50 p-6 space-y-4">
                      <div className="flex justify-between items-center">
                          <h3 className="text-xl font-bold text-emerald-400">Receipt Minted</h3>
                          <Button variant="outline" size="sm" onClick={downloadJSON} className="border-emerald-700 text-emerald-400 hover:bg-emerald-950">
                              <Download size={16} className="mr-2" /> Download JSON
                          </Button>
                      </div>
                      <div className="flex justify-center">
                        <ExplainableReceiptCard receipt={receipt} />
                      </div>
                  </div>
              )}
            </div>
          )}
          
          {!result && !loading && (
              <div className="h-full flex items-center justify-center text-slate-600 italic border-2 border-dashed border-slate-800 rounded-xl">
                  Run analysis to see explainable metrics
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
