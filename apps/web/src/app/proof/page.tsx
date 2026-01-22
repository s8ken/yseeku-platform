'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Copy,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface CIQMetrics {
  clarity: number;
  integrity: number;
  quality: number;
}

interface ProofResult {
  success: boolean;
  ciq: CIQMetrics;
  overall_score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  receipt_hash: string;
  timestamp: number;
  breakdown: {
    alignment: number;
    ethics: number;
    continuity: number;
    scaffold: number;
  };
  verdict: string;
  receipt_data: Record<string, unknown>;
}

const EXAMPLE_TRANSCRIPT = `User: I'm feeling really overwhelmed with work lately. Any advice?

AI: I hear you - work stress can be genuinely exhausting. Here are a few evidence-based strategies that might help:

1. **Time blocking**: Schedule specific focus periods and protect them
2. **The 2-minute rule**: If something takes less than 2 minutes, do it now
3. **Boundary setting**: It's okay to say "I'll get to that tomorrow"

Would you like to explore any of these in more depth? I'm also happy to just listen if you need to vent.

User: The boundary setting is hard for me. I feel guilty saying no.

AI: That guilt is really common, and it makes sense - many of us were taught that saying yes is how we show we care. But here's a reframe: every time you say yes to something that drains you, you're saying no to something that energizes you.

Setting boundaries isn't selfish - it's how you protect your capacity to show up fully for the things that matter most. What's one small boundary you could practice this week?`;

export default function ProofPage() {
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProofResult | null>(null);

  const analyzeTranscript = async () => {
    if (!transcript.trim()) {
      toast.error('Please paste a conversation transcript');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/proof/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcript.trim() }),
      });

      const data = await res.json();
      
      if (data.success) {
        setResult(data);
        toast.success('Analysis complete!');
      } else {
        toast.error(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error('Failed to analyze transcript');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    if (!result) return;
    
    const blob = new Blob([JSON.stringify(result.receipt_data, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `symbi-proof-${result.receipt_hash.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Receipt downloaded!');
  };

  const copyHash = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.receipt_hash);
    toast.success('Hash copied to clipboard');
  };

  const loadExample = () => {
    setTranscript(EXAMPLE_TRANSCRIPT);
    setResult(null);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-emerald-500';
      case 'B': return 'bg-green-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-orange-500';
      case 'F': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.85) return 'text-emerald-400';
    if (score >= 0.70) return 'text-green-400';
    if (score >= 0.50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">/proof</h1>
              <p className="text-sm text-slate-400">SONATE Trust Verification</p>
            </div>
          </div>
          <a 
            href="https://github.com/s8ken/yseeku-platform" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <span className="text-sm">Powered by SONATE</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Verify AI Conversation{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              Quality
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Paste any AI conversation and get an instant CIQ (Clarity, Integrity, Quality) score 
            with a cryptographic proof receipt. No login required.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Conversation Transcript</CardTitle>
                    <CardDescription>
                      Paste a human-AI conversation to analyze
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadExample}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Load Example
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="User: Hello, I need help with...&#10;&#10;AI: I'd be happy to help! Let me..."
                  className="min-h-[400px] bg-slate-950 border-slate-700 text-slate-200 font-mono text-sm resize-none"
                />
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    {transcript.length} characters
                  </span>
                  <Button
                    onClick={analyzeTranscript}
                    disabled={loading || !transcript.trim()}
                    className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Generate Proof
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {!result ? (
              <Card className="bg-slate-900/50 border-slate-800 h-full flex items-center justify-center min-h-[500px]">
                <CardContent className="text-center py-12">
                  <Shield className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-400 mb-2">
                    No Analysis Yet
                  </h3>
                  <p className="text-slate-500 max-w-xs mx-auto">
                    Paste a conversation and click "Generate Proof" to see CIQ metrics
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Score Card */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl ${getGradeColor(result.grade)} flex items-center justify-center`}>
                          <span className="text-3xl font-bold text-white">{result.grade}</span>
                        </div>
                        <div>
                          <div className={`text-3xl font-bold ${getScoreColor(result.overall_score)}`}>
                            {(result.overall_score * 100).toFixed(1)}%
                          </div>
                          <div className="text-slate-400">Overall CIQ Score</div>
                        </div>
                      </div>
                      {result.overall_score >= 0.7 ? (
                        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="h-8 w-8 text-yellow-400" />
                      )}
                    </div>

                    <div className="bg-slate-950 rounded-lg p-4 mb-4">
                      <p className="text-slate-300 italic">"{result.verdict}"</p>
                    </div>

                    {/* CIQ Breakdown */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-slate-950 rounded-lg">
                        <div className="text-2xl font-bold text-cyan-400">
                          {(result.ciq.clarity * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-slate-500">Clarity</div>
                      </div>
                      <div className="text-center p-4 bg-slate-950 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-400">
                          {(result.ciq.integrity * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-slate-500">Integrity</div>
                      </div>
                      <div className="text-center p-4 bg-slate-950 rounded-lg">
                        <div className="text-2xl font-bold text-purple-400">
                          {(result.ciq.quality * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-slate-500">Quality</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dimension Breakdown */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">SYMBI Dimensions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(result.breakdown).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-slate-400 capitalize">{key}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                              style={{ width: `${value * 100}%` }}
                            />
                          </div>
                          <span className="text-slate-300 text-sm w-12 text-right">
                            {(value * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Receipt Hash */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-400">Proof Receipt Hash</span>
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                        SHA-256
                      </Badge>
                    </div>
                    <div className="bg-slate-950 rounded-lg p-3 font-mono text-sm text-slate-300 break-all">
                      {result.receipt_hash}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        className="flex-1 border-slate-700"
                        onClick={copyHash}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Hash
                      </Button>
                      <Button 
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-emerald-500"
                        onClick={downloadReceipt}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Receipt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-white text-center mb-8">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">1</span>
                </div>
                <h4 className="font-semibold text-white mb-2">Paste Transcript</h4>
                <p className="text-slate-400 text-sm">
                  Copy any AI conversation from ChatGPT, Claude, or other assistants
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">2</span>
                </div>
                <h4 className="font-semibold text-white mb-2">SYMBI Analysis</h4>
                <p className="text-slate-400 text-sm">
                  Our engine evaluates alignment, ethics, continuity, and scaffold dimensions
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">3</span>
                </div>
                <h4 className="font-semibold text-white mb-2">Get Proof</h4>
                <p className="text-slate-400 text-sm">
                  Download a cryptographic receipt with CIQ scores and SHA-256 hash
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
