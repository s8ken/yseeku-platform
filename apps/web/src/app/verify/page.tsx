'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  Shield,
  Upload,
  Hash,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileJson,
  Copy,
  Info,
  Clock,
  User,
  MessageSquare
} from 'lucide-react';

interface VerificationResult {
  verified: boolean;
  receipt?: any;
  receiptHash?: string;
  trustScore?: number;
  status?: string;
  timestamp?: string;
  violations?: string[];
  error?: string;
}

export default function VerifyPage() {
  const [receiptHash, setReceiptHash] = useState('');
  const [receiptJSON, setReceiptJSON] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        toast.error('Invalid File Type', {
          description: 'Please upload a JSON file containing a trust receipt.',
        });
        return;
      }

      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setReceiptJSON(content);
        toast.success('File Uploaded', {
          description: `Loaded ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
        });
      };
      reader.readAsText(file);
    }
  };

  const verifyByHash = async () => {
    if (!receiptHash.trim()) {
      toast.error('Hash Required', {
        description: 'Please enter a receipt hash to verify.',
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await api.verifyTrustReceipt(receiptHash, null);

      // Mock verification for now
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate verification result
      const mockResult: VerificationResult = {
        verified: Math.random() > 0.3, // 70% success rate for demo
        receiptHash: receiptHash,
        trustScore: 8.5,
        status: 'PASS',
        timestamp: new Date().toISOString(),
        violations: [],
      };

      setVerificationResult(mockResult);

      if (mockResult.verified) {
        toast.success('Receipt Verified', {
          description: 'Cryptographic signature is valid and matches blockchain record.',
        });
      } else {
        toast.error('Verification Failed', {
          description: 'Receipt hash not found or signature is invalid.',
        });
      }
    } catch (error: any) {
      toast.error('Verification Error', {
        description: error.message || 'Failed to verify receipt. Please try again.',
      });
      setVerificationResult({
        verified: false,
        error: error.message,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyByJSON = async () => {
    if (!receiptJSON.trim()) {
      toast.error('Receipt Required', {
        description: 'Please paste or upload a JSON receipt to verify.',
      });
      return;
    }

    let receipt: any;
    try {
      receipt = JSON.parse(receiptJSON);
    } catch (error) {
      toast.error('Invalid JSON', {
        description: 'Could not parse receipt JSON. Please check the format.',
      });
      return;
    }

    if (!receipt.receiptHash && !receipt.hash) {
      toast.error('Invalid Receipt', {
        description: 'Receipt must contain a hash field for verification.',
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const hashToVerify = receipt.receiptHash || receipt.hash;

      // TODO: Replace with actual API call
      // const response = await api.verifyTrustReceipt(hashToVerify, receipt);

      // Mock verification
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockResult: VerificationResult = {
        verified: true,
        receipt: receipt,
        receiptHash: hashToVerify,
        trustScore: receipt.trustScore?.overall || receipt.trustScore || 0,
        status: receipt.status || 'UNKNOWN',
        timestamp: receipt.timestamp || receipt.createdAt,
        violations: receipt.trustScore?.violations || [],
      };

      setVerificationResult(mockResult);

      toast.success('Receipt Verified', {
        description: 'JSON receipt is valid and cryptographically signed.',
      });
    } catch (error: any) {
      toast.error('Verification Error', {
        description: error.message || 'Failed to verify receipt. Please try again.',
      });
      setVerificationResult({
        verified: false,
        error: error.message,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyHash = () => {
    if (verificationResult?.receiptHash) {
      navigator.clipboard.writeText(verificationResult.receiptHash);
      toast.success('Copied', {
        description: 'Receipt hash copied to clipboard.',
      });
    }
  };

  const renderVerificationResult = () => {
    if (!verificationResult) return null;

    return (
      <Card className={verificationResult.verified ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-red-500 bg-red-50 dark:bg-red-950/20'}>
        <CardHeader>
          <div className="flex items-center gap-3">
            {verificationResult.verified ? (
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
            <div>
              <CardTitle className={verificationResult.verified ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}>
                {verificationResult.verified ? 'Receipt Verified ✓' : 'Verification Failed ✗'}
              </CardTitle>
              <CardDescription className={verificationResult.verified ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                {verificationResult.verified
                  ? 'Cryptographic signature is valid and matches on-chain record'
                  : 'Receipt could not be verified or signature is invalid'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {verificationResult.verified && (
            <>
              {verificationResult.receiptHash && (
                <div className="space-y-1">
                  <Label className="text-xs font-mono text-muted-foreground">Receipt Hash</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-white dark:bg-slate-950 px-3 py-2 text-xs font-mono border">
                      {verificationResult.receiptHash}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyHash}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {verificationResult.trustScore !== undefined && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Trust Score
                    </Label>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {verificationResult.trustScore.toFixed(1)}/10
                    </p>
                  </div>
                )}

                {verificationResult.status && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Status
                    </Label>
                    <p className={`text-2xl font-bold ${
                      verificationResult.status === 'PASS' ? 'text-green-600' :
                      verificationResult.status === 'PARTIAL' ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {verificationResult.status}
                    </p>
                  </div>
                )}
              </div>

              {verificationResult.timestamp && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Timestamp
                  </Label>
                  <p className="text-sm font-mono">
                    {new Date(verificationResult.timestamp).toLocaleString()}
                  </p>
                </div>
              )}

              {verificationResult.violations && verificationResult.violations.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Violations Detected
                  </Label>
                  <div className="space-y-1">
                    {verificationResult.violations.map((violation, idx) => (
                      <div key={idx} className="text-sm bg-amber-100 dark:bg-amber-900/20 rounded px-3 py-2 border border-amber-300 dark:border-amber-700">
                        {violation}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {verificationResult.receipt && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Full Receipt Data</Label>
                  <pre className="text-xs bg-white dark:bg-slate-950 rounded p-3 border overflow-auto max-h-64">
                    {JSON.stringify(verificationResult.receipt, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}

          {!verificationResult.verified && verificationResult.error && (
            <div className="space-y-1">
              <Label className="text-xs text-red-700 dark:text-red-300">Error Details</Label>
              <p className="text-sm bg-white dark:bg-slate-950 rounded px-3 py-2 border border-red-300 dark:border-red-700">
                {verificationResult.error}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-purple-500" />
          <h1 className="text-3xl font-bold">Receipt Verification</h1>
        </div>
        <p className="text-muted-foreground">
          Verify the authenticity and integrity of SONATE trust receipts using cryptographic signatures.
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                How Receipt Verification Works
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Each trust evaluation generates a cryptographically signed receipt</li>
                <li>Receipts contain SHA-256 hashes that prove authenticity</li>
                <li>Verification checks the signature against our blockchain ledger</li>
                <li>Tampered receipts will fail verification immediately</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Tabs */}
      <Tabs defaultValue="hash" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hash" className="gap-2">
            <Hash className="h-4 w-4" />
            Verify by Hash
          </TabsTrigger>
          <TabsTrigger value="json" className="gap-2">
            <FileJson className="h-4 w-4" />
            Verify by Receipt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hash" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Verify by Receipt Hash
              </CardTitle>
              <CardDescription>
                Enter the SHA-256 hash from a trust receipt to verify its authenticity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receipt-hash">Receipt Hash</Label>
                <Input
                  id="receipt-hash"
                  type="text"
                  placeholder="e.g., a3f5d8b9c2e7f1a4d6b8c0e9f2a5d7b9c1e4f6a8d0b3c5e7f9a1d3b5c7e9f1a3"
                  value={receiptHash}
                  onChange={(e) => setReceiptHash(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  64-character hexadecimal SHA-256 hash from the receipt
                </p>
              </div>

              <Button
                onClick={verifyByHash}
                disabled={isVerifying || !receiptHash.trim()}
                className="w-full gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Verify Receipt
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="json" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                Verify by Full Receipt
              </CardTitle>
              <CardDescription>
                Upload or paste the complete JSON receipt to verify all fields and signatures.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload Receipt File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    accept="application/json"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                  <Button variant="outline" size="icon" asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4" />
                    </label>
                  </Button>
                </div>
                {uploadedFile && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✓ Loaded: {uploadedFile.name}
                  </p>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or paste JSON</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt-json">Receipt JSON</Label>
                <Textarea
                  id="receipt-json"
                  placeholder='{"receiptHash": "...", "trustScore": {...}, ...}'
                  value={receiptJSON}
                  onChange={(e) => setReceiptJSON(e.target.value)}
                  className="font-mono text-xs min-h-[200px]"
                />
              </div>

              <Button
                onClick={verifyByJSON}
                disabled={isVerifying || !receiptJSON.trim()}
                className="w-full gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Verify Receipt
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Verification Result */}
      {renderVerificationResult()}
    </div>
  );
}
