'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Fingerprint,
  Copy,
  Check,
  ExternalLink,
  FileJson,
  Lock,
} from 'lucide-react';

interface VerificationResult {
  valid: boolean;
  checks: {
    schema_valid: boolean;
    signature_valid: boolean;
    chain_valid: boolean;
    chain_hash_valid: boolean;
  };
  errors: string[];
  warnings: string[];
  receipt_id?: string;
}

export default function ProofPage() {
  const [receiptJSON, setReceiptJSON] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleVerify = async () => {
    if (!receiptJSON.trim()) return;

    setIsVerifying(true);
    setResult(null);

    try {
      let parsedReceipt: any;
      try {
        parsedReceipt = JSON.parse(receiptJSON);
      } catch {
        setResult({
          valid: false,
          checks: { schema_valid: false, signature_valid: false, chain_valid: false, chain_hash_valid: false },
          errors: ['Invalid JSON: Could not parse the receipt data.'],
          warnings: [],
        });
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiBase}/api/v1/receipts/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receipt: parsedReceipt,
          publicKey: publicKey.trim() || undefined,
        }),
      });

      const data = await response.json();
      setResult(data.data || {
        valid: false,
        checks: { schema_valid: false, signature_valid: false, chain_valid: false, chain_hash_valid: false },
        errors: [data.error || 'Verification failed'],
        warnings: [],
      });
    } catch (err) {
      setResult({
        valid: false,
        checks: { schema_valid: false, signature_valid: false, chain_valid: false, chain_hash_valid: false },
        errors: [`Network error: ${err instanceof Error ? err.message : 'Could not reach verification API'}`],
        warnings: [],
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyExample = async () => {
    const example = JSON.stringify({
      id: '<receipt-sha256-hash>',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      session_id: 'session_example',
      agent_did: 'did:sonate:agent0000000000000000000000000000000000',
      human_did: 'did:sonate:human0000000000000000000000000000000000',
      policy_version: 'policy_v1.0.0',
      mode: 'constitutional',
      interaction: {
        prompt: 'What is the capital of France?',
        response: 'Paris is the capital of France.',
        model: 'gpt-4-turbo',
      },
      chain: { previous_hash: 'GENESIS', chain_hash: '<computed-hash>', chain_length: 1 },
      signature: { algorithm: 'Ed25519', value: '<signature-hex>', key_version: 'key_v1' },
    }, null, 2);
    await navigator.clipboard.writeText(example);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const CheckIcon = ({ passed, label }: { passed: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {passed ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400" />
      )}
      <span className={passed ? 'text-emerald-300' : 'text-red-300'}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl font-bold text-white">SONATE Trust Receipt Verification</h1>
          </div>
          <p className="text-slate-400 text-lg">
            Cryptographically verify the authenticity and integrity of any SONATE Trust Receipt.
            Paste a receipt JSON below to validate its schema, signature, and hash chain.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Input Card */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileJson className="w-5 h-5 text-cyan-400" />
              Receipt Data
            </CardTitle>
            <CardDescription className="text-slate-400">
              Paste the full Trust Receipt JSON to verify its cryptographic integrity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder='{"id": "abc123...", "version": "2.0.0", "timestamp": "...", ...}'
              value={receiptJSON}
              onChange={(e) => setReceiptJSON(e.target.value)}
              className="min-h-[200px] font-mono text-sm bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500"
            />

            <div>
              <label className="text-sm text-slate-400 mb-1 block">
                <Lock className="w-3 h-3 inline mr-1" />
                Public Key (optional — for signature verification)
              </label>
              <input
                type="text"
                placeholder="Base64 or hex-encoded Ed25519 public key"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 text-slate-200 text-sm font-mono placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleVerify}
                disabled={isVerifying || !receiptJSON.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {isVerifying ? (
                  <>
                    <Fingerprint className="w-4 h-4 mr-2 animate-pulse" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Receipt
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleCopyExample}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy Example'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        {result && (
          <Card className={`border ${result.valid ? 'bg-emerald-950/30 border-emerald-700/50' : 'bg-red-950/30 border-red-700/50'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.valid ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <span className="text-emerald-300">Receipt Verified</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-400" />
                    <span className="text-red-300">Verification Failed</span>
                  </>
                )}
              </CardTitle>
              {result.receipt_id && (
                <CardDescription className="font-mono text-xs text-slate-500">
                  Receipt ID: {result.receipt_id}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Checks */}
              <div className="grid grid-cols-2 gap-3">
                <CheckIcon passed={result.checks.schema_valid} label="Schema Valid" />
                <CheckIcon passed={result.checks.signature_valid} label="Signature Valid" />
                <CheckIcon passed={result.checks.chain_valid} label="Chain Integrity" />
                <CheckIcon passed={result.checks.chain_hash_valid} label="Chain Hash Valid" />
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="p-3 rounded bg-red-900/20 border border-red-700/50">
                  <div className="flex items-center gap-2 text-red-300 text-sm font-semibold mb-2">
                    <XCircle className="w-4 h-4" /> Errors
                  </div>
                  <ul className="list-disc list-inside text-red-200 text-sm space-y-1">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="p-3 rounded bg-amber-900/20 border border-amber-700/50">
                  <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold mb-2">
                    <AlertTriangle className="w-4 h-4" /> Warnings
                  </div>
                  <ul className="list-disc list-inside text-amber-200 text-sm space-y-1">
                    {result.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <ExternalLink className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
              <div className="text-sm text-slate-400">
                <p className="mb-2">
                  <strong className="text-slate-300">How verification works:</strong> SONATE Trust Receipts
                  use SHA-256 content hashing and Ed25519 digital signatures to create tamper-proof records
                  of AI interactions. Each receipt is hash-chained to the previous one, forming an immutable
                  audit trail.
                </p>
                <p>
                  Learn more about the SONATE Trust Framework at{' '}
                  <a href="https://gammatria.com" className="text-purple-400 hover:text-purple-300 underline" target="_blank" rel="noopener noreferrer">
                    gammatria.com
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}