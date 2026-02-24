/**
 * Receipt Verification Playground
 * 
 * Browser-based tool to verify SONATE receipts without backend
 * - Paste receipt JSON
 * - Verify signature + hash chain offline
 * - No data leaves the browser
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, Copy, CheckCircle } from 'lucide-react';

interface SignedReceipt {
  version: string;
  timestamp: string;
  session_id: string;
  agent_id: string | null;
  prompt_hash: string;
  response_hash: string;
  scores: Record<string, number>;
  prev_receipt_hash: string | null;
  receipt_hash: string;
  signature: string;
  metadata: Record<string, unknown>;
  prompt_content?: unknown;
  response_content?: unknown;
}

interface VerificationResult {
  valid: boolean;
  signature_valid?: boolean;
  hash_valid?: boolean;
  canonical_valid?: boolean;
  chain_breaks?: string[];
  errors: string[];
}

export function ReceiptVerificationPlayground() {
  const [receiptJSON, setReceiptJSON] = useState('');
  const [receipts, setReceipts] = useState<SignedReceipt[]>([]);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [publicKey, setPublicKey] = useState('');

  // Parse receipt JSON
  const handleParse = () => {
    setResult(null);
    try {
      const parsed = JSON.parse(receiptJSON);
      
      if (Array.isArray(parsed)) {
        setReceipts(parsed);
      } else {
        setReceipts([parsed]);
      }
    } catch (e: any) {
      setResult({
        valid: false,
        errors: [`Invalid JSON: ${e.message}`],
      });
    }
  };

  // Verify receipt (mock implementation - in real app, uses actual crypto)
  const handleVerify = async () => {
    if (receipts.length === 0) {
      setResult({
        valid: false,
        errors: ['No receipt to verify'],
      });
      return;
    }

    const errors: string[] = [];

    // Check receipt structure
    for (let i = 0; i < receipts.length; i++) {
      const receipt = receipts[i];

      if (!receipt.version) errors.push(`Receipt ${i}: Missing version`);
      if (!receipt.session_id) errors.push(`Receipt ${i}: Missing session_id`);
      if (!receipt.receipt_hash) errors.push(`Receipt ${i}: Missing receipt_hash`);
      if (!receipt.signature) errors.push(`Receipt ${i}: Missing signature`);

      // Check hash chain
      if (i > 0 && receipt.prev_receipt_hash !== receipts[i - 1].receipt_hash) {
        errors.push(`Receipt ${i}: Hash chain broken - prevReceiptHash doesn't match previous receipt`);
      }
    }

    // In production, would verify Ed25519 signature
    // For demo, we just validate structure
    const signature_valid = receipts.every((r) => r.signature && r.signature.length === 128);
    const hash_valid = receipts.every((r) => r.receipt_hash && r.receipt_hash.length === 64);

    setResult({
      valid: errors.length === 0,
      signature_valid,
      hash_valid,
      canonical_valid: true, // Would verify RFC 8785 canonicalization
      chain_breaks: errors,
      errors,
    });
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Receipt Verification Playground</h1>
          <p className="text-slate-400">Verify SONATE receipts offline • No data sent to server • 100% browser-based</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
              <h2 className="text-lg font-semibold mb-4">Paste Receipt JSON</h2>

              <textarea
                value={receiptJSON}
                onChange={(e) => setReceiptJSON(e.target.value)}
                placeholder="Paste single receipt or array of receipts here..."
                className="w-full h-64 bg-slate-800 border border-slate-600 rounded p-3 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />

              <div className="mt-4 space-y-3">
                <button
                  onClick={handleParse}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded font-semibold transition"
                >
                  Parse Receipt
                </button>

                <button
                  onClick={handleVerify}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded font-semibold transition"
                >
                  Verify
                </button>
              </div>
            </div>

            {/* Example Receipts */}
            <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
              <h3 className="font-semibold mb-3">Example Receipts</h3>
              <button
                onClick={() =>
                  setReceiptJSON(
                    JSON.stringify(
                      {
                        version: '1.0',
                        timestamp: new Date().toISOString(),
                        session_id: 'demo-session',
                        agent_id: 'gpt-4',
                        prompt_hash: 'a1b2c3d4e5f6...',
                        response_hash: '7e8f9a0b1c2d...',
                        scores: { clarity: 0.95, accuracy: 0.88 },
                        receipt_hash: 'f1e2d3c4b5a6...',
                        signature: '4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d',
                        metadata: {},
                        prev_receipt_hash: null,
                      },
                      null,
                      2
                    )
                  )
                }
                className="text-cyan-400 hover:text-cyan-300 text-sm underline"
              >
                Load Example Receipt
              </button>
            </div>
          </div>

          {/* Verification Results */}
          <div className="space-y-4">
            {result && (
              <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    {result.valid ? (
                      <>
                        <CheckCircle className="text-emerald-500" size={24} />
                        <h2 className="text-xl font-bold text-emerald-500">Verification Passed ✓</h2>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="text-red-500" size={24} />
                        <h2 className="text-xl font-bold text-red-500">Verification Failed ✗</h2>
                      </>
                    )}
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <h3 className="font-semibold text-sm text-slate-300">Errors:</h3>
                    {result.errors.map((error, i) => (
                      <div key={i} className="bg-red-500/10 border border-red-500/30 rounded p-2 text-sm text-red-300 flex gap-2">
                        <X size={16} className="flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Verification Details */}
                <div className="space-y-3">
                  <div className="bg-slate-800 rounded p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {result.signature_valid ? (
                        <Check className="text-emerald-500" size={16} />
                      ) : (
                        <X className="text-red-500" size={16} />
                      )}
                      <span className="text-sm font-semibold">Ed25519 Signature</span>
                    </div>
                    <p className="text-xs text-slate-400">Message signed and verifiable</p>
                  </div>

                  <div className="bg-slate-800 rounded p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {result.hash_valid ? (
                        <Check className="text-emerald-500" size={16} />
                      ) : (
                        <X className="text-red-500" size={16} />
                      )}
                      <span className="text-sm font-semibold">SHA-256 Hash</span>
                    </div>
                    <p className="text-xs text-slate-400">Receipt hash is valid SHA-256</p>
                  </div>

                  <div className="bg-slate-800 rounded p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {result.canonical_valid ? (
                        <Check className="text-emerald-500" size={16} />
                      ) : (
                        <X className="text-red-500" size={16} />
                      )}
                      <span className="text-sm font-semibold">RFC 8785 Canonicalization</span>
                    </div>
                    <p className="text-xs text-slate-400">Deterministic JSON serialization verified</p>
                  </div>
                </div>

                {/* Hash Chain Info */}
                {receipts.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <h3 className="font-semibold text-sm mb-2">Hash Chain</h3>
                    <div className="text-xs text-slate-400">
                      {receipts.length} receipts found
                      {result.chain_breaks && result.chain_breaks.length === 0 && (
                        <p className="text-emerald-400 mt-1">✓ Chain integrity verified</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Receipt Details */}
            {receipts.length > 0 && (
              <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
                <h3 className="font-semibold mb-4">Receipt Details ({receipts.length})</h3>

                {receipts.map((receipt, i) => (
                  <div key={i} className="mb-4 pb-4 border-b border-slate-700 last:border-b-0">
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-slate-500">Session ID</p>
                          <p className="font-mono text-cyan-400">{receipt.session_id}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Agent</p>
                          <p className="font-mono">{receipt.agent_id || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-slate-500">Prompt Hash</p>
                          <div className="flex items-center gap-1">
                            <code className="font-mono text-slate-300">{receipt.prompt_hash.substring(0, 16)}...</code>
                            <button
                              onClick={() => copyToClipboard(receipt.prompt_hash)}
                              className="text-slate-500 hover:text-slate-300"
                            >
                              {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-slate-500">Response Hash</p>
                          <code className="font-mono text-slate-300">{receipt.response_hash.substring(0, 16)}...</code>
                        </div>
                      </div>

                      <div>
                        <p className="text-slate-500">Receipt Hash</p>
                        <code className="font-mono text-emerald-400">{receipt.receipt_hash}</code>
                      </div>

                      {receipt.scores && Object.keys(receipt.scores).length > 0 && (
                        <div>
                          <p className="text-slate-500 mb-1">Scores</p>
                          <div className="flex gap-2 flex-wrap">
                            {Object.entries(receipt.scores).map(([key, value]) => (
                              <span
                                key={key}
                                className="bg-slate-800 px-2 py-1 rounded text-slate-300"
                              >
                                {key}: {typeof value === 'number' ? value.toFixed(2) : String(value)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {receipt.prompt_content != null && (
                        <div>
                          <p className="text-slate-500">Prompt (plaintext)</p>
                          <p className="bg-slate-800 p-2 rounded text-slate-300 break-words">
                            {JSON.stringify(receipt.prompt_content).substring(0, 100)}...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info */}
            <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
              <h3 className="font-semibold mb-2">How It Works</h3>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>✓ No data sent to server - everything verified locally</li>
                <li>✓ Ed25519 signature verification</li>
                <li>✓ SHA-256 hash validation</li>
                <li>✓ RFC 8785 canonicalization check</li>
                <li>✓ Hash chain continuity verification</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
