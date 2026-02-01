'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  Shield,
  Lock,
  FileCheck,
  Clock,
  Hash,
  Key,
  Fingerprint,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Lesson content
const lessons = [
  {
    id: 1,
    title: 'What is a Trust Receipt?',
    content: `A **Trust Receipt** is the cryptographic proof that an AI interaction was monitored and validated by SONATE.

Think of it like a receipt from a store—but instead of proving you bought something, it proves:
- ✅ The AI's response was checked for safety
- ✅ Trust scores were calculated in real-time
- ✅ The interaction followed your governance rules
- ✅ The entire event is tamper-proof and auditable

Every AI interaction in SONATE generates a Trust Receipt automatically.`
  },
  {
    id: 2,
    title: 'Why Receipts Matter',
    content: `Trust Receipts solve three critical problems:

**1. Accountability**
When something goes wrong, you can trace exactly what happened, when, and what the AI's trust scores were at that moment.

**2. Compliance**
Regulators and auditors can verify that your AI systems were properly governed—with cryptographic proof.

**3. Trust**
Users and stakeholders can verify that AI interactions were monitored, building confidence in your AI systems.`
  },
  {
    id: 3,
    title: 'Anatomy of a Receipt',
    content: `Every Trust Receipt contains:

| Field | Description |
|-------|-------------|
| **Receipt ID** | Unique identifier (UUID v4) |
| **Timestamp** | When the interaction occurred (ISO 8601) |
| **Model ID** | Which AI model was used |
| **Trust Score** | Overall trust score at moment of interaction |
| **Dimension Scores** | All 5 detection dimensions |
| **Prompt Hash** | SHA-256 hash of the input |
| **Response Hash** | SHA-256 hash of the output |
| **Signature** | Ed25519 cryptographic signature |
| **Public Key** | Key to verify the signature |`
  },
  {
    id: 4,
    title: 'Cryptographic Signing',
    content: `Trust Receipts use **Ed25519** digital signatures—the same algorithm used by:
- SSH keys
- Signal Protocol
- Many blockchain systems

**How it works:**
1. SONATE creates a receipt with all interaction data
2. The receipt data is hashed (SHA-256)
3. The hash is signed with SONATE's private key
4. Anyone can verify using the public key

This means receipts **cannot be forged or modified** after creation.`
  },
  {
    id: 5,
    title: 'Verifying Receipts',
    content: `You can verify any Trust Receipt in three ways:

**1. Dashboard Verification**
Click any receipt in the dashboard to see its verification status.

**2. API Verification**
\`\`\`typescript
const verified = await sonate.verifyReceipt(receiptId);
// Returns: { valid: true, timestamp: "...", signature: "..." }
\`\`\`

**3. Manual Verification**
Download the receipt JSON and verify the Ed25519 signature using any cryptographic library.

A green checkmark means the receipt is authentic and unmodified.`
  },
  {
    id: 6,
    title: 'Receipt Lifecycle',
    content: `Trust Receipts follow a clear lifecycle:

**1. Generation** → Created instantly when AI interaction occurs
**2. Signing** → Cryptographically signed with timestamp
**3. Storage** → Stored immutably in your configured backend
**4. Indexing** → Indexed for fast retrieval and search
**5. Archival** → Long-term storage for compliance (configurable retention)

Receipts are **immutable**—once created, they can never be changed.`
  }
];

// Sample receipt data for interactive demo
const sampleReceipt = {
  id: 'tr_7f3a9b2c-1d4e-5f6a-8b9c-0d1e2f3a4b5c',
  timestamp: '2026-01-24T14:32:18.456Z',
  model: 'gpt-4-turbo',
  interaction: {
    promptHash: 'sha256:a1b2c3d4e5f6789012345678901234567890abcdef...',
    responseHash: 'sha256:f6e5d4c3b2a1098765432109876543210fedcba...',
    promptPreview: 'Summarize the quarterly financial report...',
    responsePreview: 'The Q4 2025 financial report shows...'
  },
  trustScore: 0.94,
  dimensions: {
    trustProtocol: 0.92,
    ethicalAlignment: 0.95,
    resonance: 0.93
  },
  principles: {
    consent: true,
    inspection: true,
    validation: true,
    override: true,
    disconnect: true,
    moral: true
  },
  signature: {
    algorithm: 'Ed25519',
    publicKey: 'MCowBQYDK2VwAyEA7f5b3c2d1e0f...',
    signature: 'MEUCIQD8a9b7c6d5e4f3...',
    verified: true
  },
  metadata: {
    sessionId: 'sess_abc123',
    userId: 'user_xyz789',
    tenantId: 'tenant_acme',
    environment: 'production'
  }
};

// Interactive Receipt Explorer Component
function ReceiptExplorer() {
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'pending' | 'valid' | 'invalid'>('pending');
  
  const handleVerify = () => {
    setIsVerifying(true);
    setVerificationResult('pending');
    
    // Simulate verification process
    setTimeout(() => {
      setVerificationResult('valid');
      setIsVerifying(false);
    }, 2000);
  };
  
  const sections = [
    { id: 'overview', label: 'Overview', icon: FileCheck },
    { id: 'hashes', label: 'Hashes', icon: Hash },
    { id: 'dimensions', label: 'Dimensions', icon: Eye },
    { id: 'signature', label: 'Signature', icon: Key }
  ];
  
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-purple-500" />
              Trust Receipt Explorer
            </CardTitle>
            <CardDescription>Click each section to explore a real receipt structure</CardDescription>
          </div>
          <Button 
            onClick={handleVerify}
            disabled={isVerifying}
            variant={verificationResult === 'valid' ? 'outline' : 'default'}
            className="gap-2"
          >
            {isVerifying ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Verifying...
              </>
            ) : verificationResult === 'valid' ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                Verified
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Verify Signature
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex border-b">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                  selectedSection === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </button>
            );
          })}
        </div>
        
        <div className="p-6">
          {selectedSection === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">Receipt ID</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {sampleReceipt.id}
                    </code>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">Timestamp</p>
                  <p className="text-sm font-mono">{new Date(sampleReceipt.timestamp).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">Model</p>
                  <Badge variant="outline">{sampleReceipt.model}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">Trust Score</p>
                  <div className="flex items-center gap-2">
                    <Progress value={sampleReceipt.trustScore * 100} className="h-2 w-20" />
                    <span className="text-sm font-bold text-green-600">
                      {(sampleReceipt.trustScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground uppercase mb-2">Constitutional Principles</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(sampleReceipt.principles).map(([key, value]) => (
                    <Badge 
                      key={key}
                      variant={value ? 'default' : 'destructive'}
                      className="gap-1"
                    >
                      {value ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {selectedSection === 'hashes' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <Fingerprint className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">What are hashes?</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Hashes are one-way fingerprints of data. They prove the content existed without storing the actual content.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">Prompt Hash (SHA-256)</p>
                  <code className="block text-xs font-mono bg-muted p-3 rounded break-all">
                    {sampleReceipt.interaction.promptHash}
                  </code>
                  <p className="text-xs text-muted-foreground italic">
                    Preview: "{sampleReceipt.interaction.promptPreview}"
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">Response Hash (SHA-256)</p>
                  <code className="block text-xs font-mono bg-muted p-3 rounded break-all">
                    {sampleReceipt.interaction.responseHash}
                  </code>
                  <p className="text-xs text-muted-foreground italic">
                    Preview: "{sampleReceipt.interaction.responsePreview}"
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {selectedSection === 'dimensions' && (
            <div className="space-y-4">
              {Object.entries(sampleReceipt.dimensions).map(([key, value]) => {
                const labels: Record<string, { name: string; description: string }> = {
                  trustProtocol: { name: 'Trust Protocol', description: 'Adherence to trust standards' },
                  ethicalAlignment: { name: 'Ethical Alignment', description: 'Ethical behavior compliance' },
                  resonance: { name: 'Resonance', description: 'Appropriate contextual response' }
                };
                const label = labels[key];
                const percentage = value * 100;
                
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{label.name}</p>
                        <p className="text-xs text-muted-foreground">{label.description}</p>
                      </div>
                      <span className={cn(
                        'text-sm font-bold',
                        percentage >= 90 ? 'text-green-600' : percentage >= 70 ? 'text-amber-600' : 'text-red-600'
                      )}>
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className={cn(
                        'h-2',
                        percentage >= 90 ? '[&>div]:bg-green-500' : percentage >= 70 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
                      )}
                    />
                  </div>
                );
              })}
            </div>
          )}
          
          {selectedSection === 'signature' && (
            <div className="space-y-4">
              <div className={cn(
                'p-4 rounded-lg border flex items-center gap-3',
                verificationResult === 'valid' 
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                  : 'bg-muted border-border'
              )}>
                {verificationResult === 'valid' ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">Signature Valid</p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        This receipt is authentic and has not been modified.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Lock className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Signature Not Yet Verified</p>
                      <p className="text-sm text-muted-foreground">
                        Click "Verify Signature" to check authenticity.
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">Algorithm</p>
                  <Badge variant="outline">{sampleReceipt.signature.algorithm}</Badge>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">Public Key</p>
                  <code className="block text-xs font-mono bg-muted p-3 rounded break-all">
                    {sampleReceipt.signature.publicKey}
                  </code>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">Signature</p>
                  <code className="block text-xs font-mono bg-muted p-3 rounded break-all">
                    {sampleReceipt.signature.signature}
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Receipt Search Demo
function ReceiptSearchDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof sampleReceipt[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setSearchResults([sampleReceipt]);
      setIsSearching(false);
    }, 1000);
  };
  
  return (
    <Card className="border-2 border-cyan-200 dark:border-cyan-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-cyan-500" />
          Try Searching Receipts
        </CardTitle>
        <CardDescription>
          Search by receipt ID, model name, date range, or trust score threshold
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search: tr_7f3a9b2c... or model:gpt-4 or score:>0.9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Found {searchResults.length} receipt(s)</p>
            {searchResults.map((receipt) => (
              <div key={receipt.id} className="p-3 bg-muted rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileCheck className="h-5 w-5 text-green-500" />
                  <div>
                    <code className="text-sm font-mono">{receipt.id}</code>
                    <p className="text-xs text-muted-foreground">
                      {new Date(receipt.timestamp).toLocaleString()} • {receipt.model}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    {(receipt.trustScore * 100).toFixed(0)}%
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TrustReceiptsPage() {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  
  const lesson = lessons[currentLesson];
  const progress = (completedLessons.length / lessons.length) * 100;
  
  const handleNext = () => {
    if (!completedLessons.includes(currentLesson)) {
      setCompletedLessons([...completedLessons, currentLesson]);
    }
    if (currentLesson < lessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
    }
  };
  
  const handlePrev = () => {
    if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Learning Hub
        </Link>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Reading Trust Receipts</h1>
            <p className="text-muted-foreground">Understand the cryptographic proof behind every AI interaction</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground">
            {completedLessons.length}/{lessons.length} complete
          </span>
        </div>
      </div>
      
      {/* Lesson Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {lessons.map((l, index) => (
          <Button
            key={l.id}
            variant={currentLesson === index ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentLesson(index)}
            className={cn(
              'flex-shrink-0',
              completedLessons.includes(index) && currentLesson !== index && 'border-green-500'
            )}
          >
            {completedLessons.includes(index) && (
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
            )}
            {index + 1}
          </Button>
        ))}
      </div>
      
      {/* Current Lesson Content */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">Lesson {currentLesson + 1} of {lessons.length}</Badge>
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              7 min total
            </Badge>
          </div>
          <CardTitle className="text-2xl">{lesson.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {lesson.content.split('\n').map((paragraph, i) => {
              if (paragraph.startsWith('|')) {
                // Simple table rendering
                return null;
              }
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return <h4 key={i} className="font-bold mt-4">{paragraph.replace(/\*\*/g, '')}</h4>;
              }
              if (paragraph.startsWith('```')) {
                return null;
              }
              return <p key={i} className="mb-3" dangerouslySetInnerHTML={{ 
                __html: paragraph
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
              }} />;
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Interactive Demo - Shows after lesson 3 */}
      {currentLesson >= 2 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5 text-purple-500" />
            Interactive Demo
          </h2>
          <ReceiptExplorer />
        </div>
      )}
      
      {/* Search Demo - Shows after lesson 5 */}
      {currentLesson >= 4 && (
        <div className="mb-8">
          <ReceiptSearchDemo />
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentLesson === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        {currentLesson === lessons.length - 1 ? (
          <Link href="/dashboard/learn">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Module
            </Button>
          </Link>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
