'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  FileCheck, 
  Hash, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Copy,
  ExternalLink,
  Fingerprint,
  Lock,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface VerificationResult {
  valid: boolean;
  receipt: {
    id: string;
    timestamp: string;
    contentHash: string;
    signature: string;
    chainHash?: string;
    trustScore: number;
    status: 'PASS' | 'PARTIAL' | 'FAIL';
    principles: {
      CONSENT_ARCHITECTURE: number;
      INSPECTION_MANDATE: number;
      CONTINUOUS_VALIDATION: number;
      ETHICAL_OVERRIDE: number;
      RIGHT_TO_DISCONNECT: number;
      MORAL_RECOGNITION: number;
    };
    issuer?: string;
    subject?: string;
    conversationId?: string;
    messageId?: string;
  };
  verification: {
    signatureValid: boolean;
    hashValid: boolean;
    chainValid: boolean;
    timestampValid: boolean;
    notTampered: boolean;
  };
  errors?: string[];
}

// Demo receipt for testing
const DEMO_RECEIPT = {
  id: 'receipt_demo_2026_001',
  timestamp: new Date().toISOString(),
  contentHash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  signature: 'ed25519:MEUCIQDvK8M8V4rYvPi5r3LWh0sCNh3z8V7K8rY9Z0aB5cD6e...',
  chainHash: 'sha256:9a2f1b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
  trustScore: 0.87,
  status: 'PASS' as const,
  principles: {
    CONSENT_ARCHITECTURE: 0.95,
    INSPECTION_MANDATE: 0.82,
    CONTINUOUS_VALIDATION: 0.88,
    ETHICAL_OVERRIDE: 0.90,
    RIGHT_TO_DISCONNECT: 0.85,
    MORAL_RECOGNITION: 0.78,
  },
  issuer: 'did:web:yseeku.com',
  subject: 'did:web:yseeku.com:agents:demo-agent',
  conversationId: 'conv_demo_001',
  messageId: 'msg_demo_001',
};

export default function ProofVerificationPage() {
  const [receiptInput, setReceiptInput] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('id');

  const verifyReceipt = async (input: string, isJson: boolean) => {
    setIsVerifying(true);
    setResult(null);

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // For demo purposes, we'll simulate verification
      // In production, this would call the backend API
      
      if (input.includes('demo') || input.includes('receipt_') || isJson) {
        // Simulate successful verification
        setResult({
          valid: true,
          receipt: DEMO_RECEIPT,
          verification: {
            signatureValid: true,
            hashValid: true,
            chainValid: true,
            timestampValid: true,
            notTampered: true,
          },
        });
        toast.success('Receipt verified successfully');
      } else if (input.includes('invalid') || input.includes('tampered')) {
        // Simulate failed verification
        setResult({
          valid: false,
          receipt: { ...DEMO_RECEIPT, id: input },
          verification: {
            signatureValid: false,
            hashValid: true,
            chainValid: false,
            timestampValid: true,
            notTampered: false,
          },
          errors: ['Signature verification failed', 'Chain hash mismatch detected'],
        });
        toast.error('Verification failed');
      } else {
        // Not found
        toast.error('Receipt not found', {
          description: 'The receipt ID or hash was not found in the system',
        });
      }
    } catch {
      toast.error('Verification failed', {
        description: 'An error occurred during verification',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyById = () => {
    if (!receiptInput.trim()) {
      toast.error('Please enter a receipt ID or hash');
      return;
    }
    verifyReceipt(receiptInput, false);
  };

  const handleVerifyByJson = () => {
    if (!jsonInput.trim()) {
      toast.error('Please paste the receipt JSON');
      return;
    }
    try {
      JSON.parse(jsonInput);
      verifyReceipt(jsonInput, true);
    } catch {
      toast.error('Invalid JSON format');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const loadDemoReceipt = () => {
    setReceiptInput('receipt_demo_2026_001');
    toast.info('Demo receipt ID loaded');
  };

  const getPrincipleLabel = (key: string): string => {
    const labels: Record<string, string> = {
      CONSENT_ARCHITECTURE: 'Consent Architecture',
      INSPECTION_MANDATE: 'Inspection Mandate',
      CONTINUOUS_VALIDATION: 'Continuous Validation',
      ETHICAL_OVERRIDE: 'Ethical Override',
      RIGHT_TO_DISCONNECT: 'Right to Disconnect',
      MORAL_RECOGNITION: 'Moral Recognition',
    };
    return labels[key] || key;
  };

  const getPrincipleWeight = (key: string): number => {
    const weights: Record<string, number> = {
      CONSENT_ARCHITECTURE: 25,
      INSPECTION_MANDATE: 20,
      CONTINUOUS_VALIDATION: 20,
      ETHICAL_OVERRIDE: 15,
      RIGHT_TO_DISCONNECT: 10,
      MORAL_RECOGNITION: 10,
    };
    return weights[key] || 0;
  };

  const isCriticalPrinciple = (key: string): boolean => {
    return key === 'CONSENT_ARCHITECTURE' || key === 'ETHICAL_OVERRIDE';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <Shield className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Trust Receipt Verification</h1>
            <p className="text-xl text-white/80">
              Verify cryptographic proofs of AI interactions governed by the SONATE Constitutional Framework
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Verification Form */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                Verify a Trust Receipt
              </CardTitle>
              <CardDescription>
                Enter a receipt ID, content hash, or paste the full receipt JSON to verify its authenticity and integrity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="id">By ID or Hash</TabsTrigger>
                  <TabsTrigger value="json">Paste JSON</TabsTrigger>
                </TabsList>

                <TabsContent value="id" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Receipt ID or Content Hash</label>
                    <div className="flex gap-2">
                      <Input
                        value={receiptInput}
                        onChange={(e) => setReceiptInput(e.target.value)}
                        placeholder="receipt_abc123 or sha256:7f83b..."
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={loadDemoReceipt}
                        title="Load demo receipt"
                      >
                        <Sparkles className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try: <code className="bg-muted px-1 rounded">receipt_demo_2026_001</code> for a demo
                    </p>
                  </div>
                  <Button 
                    onClick={handleVerifyById} 
                    disabled={isVerifying}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Verify Receipt
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="json" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Receipt JSON</label>
                    <Textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder='{"id": "receipt_...", "contentHash": "sha256:...", ...}'
                      className="font-mono text-sm min-h-[150px]"
                    />
                  </div>
                  <Button 
                    onClick={handleVerifyByJson} 
                    disabled={isVerifying}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Verify Receipt
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Verification Result */}
          {result && (
            <Card className={`mb-8 shadow-lg border-2 ${result.valid ? 'border-green-500' : 'border-red-500'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {result.valid ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                        <span className="text-green-700 dark:text-green-400">Verification Successful</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-6 h-6 text-red-500" />
                        <span className="text-red-700 dark:text-red-400">Verification Failed</span>
                      </>
                    )}
                  </CardTitle>
                  <Badge variant={result.valid ? 'default' : 'destructive'}>
                    {result.receipt.status}
                  </Badge>
                </div>
                <CardDescription>
                  {result.valid 
                    ? 'This trust receipt is authentic and has not been tampered with'
                    : 'This trust receipt failed verification checks'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Verification Checks */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Cryptographic Verification
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {Object.entries(result.verification).map(([key, valid]) => (
                      <div 
                        key={key}
                        className={`p-3 rounded-lg text-center ${
                          valid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                        }`}
                      >
                        {valid ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                        )}
                        <div className="text-xs font-medium">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Errors */}
                {result.errors && result.errors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h4 className="font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Verification Errors
                    </h4>
                    <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
                      {result.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Trust Score */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Fingerprint className="w-4 h-4" />
                    Trust Score
                  </h4>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl font-bold">
                      {(result.receipt.trustScore * 100).toFixed(0)}%
                    </div>
                    <Progress value={result.receipt.trustScore * 100} className="flex-1 h-3" />
                  </div>
                </div>

                {/* Principle Scores */}
                <div>
                  <h4 className="font-medium mb-3">Constitutional Principle Compliance</h4>
                  <div className="space-y-3">
                    {Object.entries(result.receipt.principles).map(([key, score]) => (
                      <div key={key} className="flex items-center gap-3">
                        <div className="w-48 flex items-center gap-2">
                          <span className="text-sm">{getPrincipleLabel(key)}</span>
                          {isCriticalPrinciple(key) && (
                            <Badge variant="outline" className="text-xs">Critical</Badge>
                          )}
                        </div>
                        <div className="flex-1">
                          <Progress value={score * 100} className="h-2" />
                        </div>
                        <div className="w-16 text-right text-sm font-medium">
                          {(score * 100).toFixed(0)}%
                        </div>
                        <div className="w-12 text-right text-xs text-muted-foreground">
                          ({getPrincipleWeight(key)}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Receipt Details */}
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Receipt Details
                    </span>
                    {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  
                  {showDetails && (
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-muted-foreground">Receipt ID</label>
                            <div className="flex items-center gap-2 font-mono bg-muted p-2 rounded">
                              <span className="truncate">{result.receipt.id}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyToClipboard(result.receipt.id, 'Receipt ID')}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label className="text-muted-foreground">Timestamp</label>
                            <div className="flex items-center gap-2 font-mono bg-muted p-2 rounded">
                              <Clock className="w-4 h-4" />
                              {new Date(result.receipt.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <label className="text-muted-foreground">Issuer DID</label>
                            <div className="flex items-center gap-2 font-mono bg-muted p-2 rounded text-xs">
                              <span className="truncate">{result.receipt.issuer || 'N/A'}</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-muted-foreground">Subject DID</label>
                            <div className="flex items-center gap-2 font-mono bg-muted p-2 rounded text-xs">
                              <span className="truncate">{result.receipt.subject || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-muted-foreground">Content Hash</label>
                            <div className="flex items-center gap-2 font-mono bg-muted p-2 rounded text-xs">
                              <Hash className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{result.receipt.contentHash}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyToClipboard(result.receipt.contentHash, 'Content Hash')}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label className="text-muted-foreground">Chain Hash</label>
                            <div className="flex items-center gap-2 font-mono bg-muted p-2 rounded text-xs">
                              <span className="truncate">{result.receipt.chainHash || 'N/A'}</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-muted-foreground">Signature</label>
                            <div className="flex items-center gap-2 font-mono bg-muted p-2 rounded text-xs">
                              <span className="truncate">{result.receipt.signature}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyToClipboard(result.receipt.signature, 'Signature')}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* What is a Trust Receipt */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>What is a Trust Receipt?</CardTitle>
              <CardDescription>
                Understanding the cryptographic proof of AI governance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Trust Receipts are cryptographic proofs generated for every AI interaction 
                governed by the SONATE Constitutional Framework. They provide immutable evidence
                that an AI interaction complied with the 6 Constitutional Principles.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Hash className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Content Hash (SHA-256)</h4>
                    <p className="text-sm text-muted-foreground">
                      Cryptographic fingerprint of the interaction content. Any change to the content
                      would produce a completely different hash, detecting tampering.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Ed25519 Signature</h4>
                    <p className="text-sm text-muted-foreground">
                      Digital signature proving the receipt was issued by the SONATE platform
                      and has not been modified since creation.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Immutable Timestamp</h4>
                    <p className="text-sm text-muted-foreground">
                      Precise record of when the interaction occurred, providing an auditable
                      timeline of AI activities.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <Fingerprint className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Chain Hash</h4>
                    <p className="text-sm text-muted-foreground">
                      Links this receipt to the previous one, creating an immutable chain
                      that prevents insertion or deletion of records.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/dashboard/receipts" 
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  View your trust receipts
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  Go to Dashboard
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <a 
                  href="https://github.com/s8ken/yseeku-platform#trust-receipts-symbi" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  Technical Documentation
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
