'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Copy,
  CheckCircle2,
  Terminal,
  Code2,
  Zap,
  ArrowRight,
  Package,
  Key,
  Shield,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

type Tab = 'openai' | 'anthropic' | 'manual';

const SNIPPETS: Record<Tab, { title: string; lang: string; code: string }[]> = {
  openai: [
    {
      title: '1. Install',
      lang: 'bash',
      code: `npm install @sonate/trust-receipts openai`,
    },
    {
      title: '2. Wrap your OpenAI call',
      lang: 'typescript',
      code: `import { TrustReceipts } from '@sonate/trust-receipts';
import OpenAI from 'openai';

const receipts = new TrustReceipts({
  privateKey: process.env.SONATE_PRIVATE_KEY,
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const messages = [{ role: 'user' as const, content: 'Summarise this contract.' }];

// Wrap the call — receipt is generated automatically
const { response, receipt } = await receipts.wrap(
  () => openai.chat.completions.create({ model: 'gpt-4', messages }),
  {
    sessionId: 'session-' + Date.now(),
    input: messages,
    agentId: 'gpt-4',
  }
);

console.log('AI Response:', response.choices[0].message.content);
console.log('Receipt Hash:', receipt.receiptHash);   // SHA-256 of receipt
console.log('Prompt Hash:', receipt.promptHash);     // SHA-256 of prompt
console.log('Signature:', receipt.signature);        // Ed25519 signature`,
    },
    {
      title: '3. Chain receipts across a conversation',
      lang: 'typescript',
      code: `// Pass the previous receipt to create a cryptographic chain
let previousReceipt = undefined;

for (const userMessage of conversationMessages) {
  const { response, receipt } = await receipts.wrap(
    () => openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: userMessage }],
    }),
    {
      sessionId: 'conversation-abc123',
      input: userMessage,
      agentId: 'gpt-4',
      previousReceipt,  // Links this receipt to the previous one
    }
  );

  // receipt.prevReceiptHash === previousReceipt.receiptHash ✓
  previousReceipt = receipt;
}`,
    },
  ],
  anthropic: [
    {
      title: '1. Install',
      lang: 'bash',
      code: `npm install @sonate/trust-receipts @anthropic-ai/sdk`,
    },
    {
      title: '2. Wrap your Anthropic call',
      lang: 'typescript',
      code: `import { TrustReceipts } from '@sonate/trust-receipts';
import Anthropic from '@anthropic-ai/sdk';

const receipts = new TrustReceipts({
  privateKey: process.env.SONATE_PRIVATE_KEY,
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const prompt = 'Analyse the risk in this document.';

// Wrap the call — receipt is generated automatically
const { response, receipt } = await receipts.wrap(
  () => anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  }),
  {
    sessionId: 'session-' + Date.now(),
    input: prompt,
    agentId: 'claude-3-5-sonnet',
  }
);

console.log('AI Response:', response.content[0].type === 'text' ? response.content[0].text : '');
console.log('Receipt Hash:', receipt.receiptHash);
console.log('Signature:', receipt.signature);`,
    },
  ],
  manual: [
    {
      title: '1. Install',
      lang: 'bash',
      code: `npm install @sonate/trust-receipts`,
    },
    {
      title: '2. Generate a key pair',
      lang: 'typescript',
      code: `import { generateKeyPair, bytesToHex } from '@sonate/trust-receipts';

// Generate a new Ed25519 key pair
const keyPair = await generateKeyPair();

// Convert to hex strings for storage
const privateKeyHex = bytesToHex(keyPair.privateKey);
const publicKeyHex = bytesToHex(keyPair.publicKey);

// Store privateKeyHex in your environment as SONATE_PRIVATE_KEY
// Publish publicKeyHex so others can verify your receipts
console.log('Private Key (store securely):', privateKeyHex);
console.log('Public Key (share openly):', publicKeyHex);`,
    },
    {
      title: '3. Create a receipt manually',
      lang: 'typescript',
      code: `import { TrustReceipts } from '@sonate/trust-receipts';

const receipts = new TrustReceipts({
  privateKey: process.env.SONATE_PRIVATE_KEY,
});

// Create a receipt for any AI interaction — not just wrapped calls
const receipt = await receipts.createReceipt({
  sessionId: 'session-abc123',
  prompt: 'What is the capital of France?',
  response: 'The capital of France is Paris.',
  agentId: 'my-custom-agent',
});

// receipt.receiptHash  — SHA-256 of the full receipt
// receipt.promptHash   — SHA-256 of the prompt
// receipt.responseHash — SHA-256 of the response
// receipt.signature    — Ed25519 signature (verifiable with public key)
console.log(JSON.stringify(receipt, null, 2));`,
    },
    {
      title: '4. Verify a receipt',
      lang: 'typescript',
      code: `import { verify, hexToBytes, sha256 } from '@sonate/trust-receipts';

async function verifyReceipt(receipt: any, publicKeyHex: string): Promise<boolean> {
  // 1. Re-hash the receipt content
  const { signature, ...receiptWithoutSig } = receipt;
  const receiptJson = JSON.stringify(receiptWithoutSig);
  const receiptHash = await sha256(receiptJson);

  // 2. Verify the Ed25519 signature
  const sigBytes = hexToBytes(signature);
  const pubKeyBytes = hexToBytes(publicKeyHex);
  const msgBytes = new TextEncoder().encode(receiptHash);

  return verify(sigBytes, msgBytes, pubKeyBytes);
}

const isValid = await verifyReceipt(receipt, process.env.SONATE_PUBLIC_KEY!);
console.log('Receipt valid:', isValid); // true`,
    },
  ],
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
      title="Copy code"
    >
      {copied ? (
        <CheckCircle2 className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-white/60" />
      )}
    </button>
  );
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="relative mt-2">
      <pre className="bg-black/40 border border-white/10 rounded-lg p-4 overflow-x-auto text-sm font-mono text-white/80 leading-relaxed">
        <code>{code}</code>
      </pre>
      <CopyButton text={code} />
    </div>
  );
}

export default function QuickstartPage() {
  const [activeTab, setActiveTab] = useState<Tab>('openai');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Where do I get my SONATE_PRIVATE_KEY?',
      a: 'Go to Settings → API Keys in your dashboard. Generate a new key pair — the private key is shown once and should be stored securely in your environment variables. The public key is automatically registered with the platform for verification.',
    },
    {
      q: 'What does receipt.receiptHash represent?',
      a: 'It is the SHA-256 hash of the full receipt object (excluding the signature field). This is the canonical identifier for the receipt. Use it as the receipt ID when submitting to the platform or sharing for verification.',
    },
    {
      q: 'How does hash chaining work?',
      a: 'When you pass previousReceipt to wrap(), the new receipt includes prevReceiptHash = previousReceipt.receiptHash. This creates a cryptographic chain where each receipt is linked to the previous one. Tampering with any receipt in the chain breaks all subsequent links.',
    },
    {
      q: 'Can I use this with any AI provider?',
      a: 'Yes. The wrap() method accepts any async function that returns a response. Use createReceipt() for providers where you want to manually control the prompt and response extraction.',
    },
    {
      q: 'Does the package send data to SONATE servers?',
      a: 'No. The @sonate/trust-receipts package is entirely local — it generates and signs receipts using your private key without any network calls. You choose when and whether to submit receipts to the platform API.',
    },
  ];

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h1 className="text-2xl font-bold">Integration Quickstart</h1>
            <Badge variant="outline" className="text-xs border-green-500/40 text-green-400">
              18/18 tests passing
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Add cryptographic trust receipts to any AI call in under 5 minutes.
          </p>
        </div>
        <a
          href="https://www.npmjs.com/package/@sonate/trust-receipts"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm" className="gap-2">
            <Package className="w-4 h-4" />
            npm package
            <ExternalLink className="w-3 h-3" />
          </Button>
        </a>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: <Terminal className="w-5 h-5 text-blue-400" />, title: 'Install', desc: 'npm install @sonate/trust-receipts' },
          { icon: <Code2 className="w-5 h-5 text-purple-400" />, title: 'Wrap', desc: 'Wrap any AI call with receipts.wrap()' },
          { icon: <Shield className="w-5 h-5 text-green-400" />, title: 'Verify', desc: 'Every interaction is cryptographically signed' },
        ].map((step, i) => (
          <Card key={i} className="bg-card/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">
                  {i + 1}
                </div>
                {step.icon}
                <span className="font-semibold text-sm">{step.title}</span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">{step.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Provider tabs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              Code Examples
            </CardTitle>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {(['openai', 'anthropic', 'manual'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'openai' ? 'OpenAI' : tab === 'anthropic' ? 'Anthropic' : 'Manual / Other'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {SNIPPETS[activeTab].map((snippet, i) => (
            <div key={i}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">{snippet.title}</span>
                <Badge variant="outline" className="text-xs">{snippet.lang}</Badge>
              </div>
              <CodeBlock code={snippet.code} lang={snippet.lang} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Receipt field reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="w-4 h-4" />
            Receipt Field Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Field</th>
                  <th className="text-left py-2 pr-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Type</th>
                  <th className="text-left py-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {[
                  { field: 'receiptHash', type: 'string (64-char hex)', desc: 'SHA-256 hash of the receipt — use as the receipt ID' },
                  { field: 'promptHash', type: 'string (64-char hex)', desc: 'SHA-256 hash of the canonicalized prompt/input' },
                  { field: 'responseHash', type: 'string (64-char hex)', desc: 'SHA-256 hash of the AI response' },
                  { field: 'prevReceiptHash', type: 'string | null', desc: 'Hash of the previous receipt — null for genesis receipts' },
                  { field: 'signature', type: 'string (128-char hex)', desc: 'Ed25519 signature over the receipt hash' },
                  { field: 'sessionId', type: 'string', desc: 'Session identifier provided at wrap time' },
                  { field: 'agentId', type: 'string | null', desc: 'Agent/model identifier' },
                  { field: 'timestamp', type: 'string (ISO 8601)', desc: 'UTC timestamp of receipt creation' },
                  { field: 'version', type: 'string', desc: 'Protocol version (e.g. "1.0")' },
                  { field: 'scores', type: 'object', desc: 'Optional trust/quality scores attached to the receipt' },
                  { field: 'metadata', type: 'object', desc: 'Optional custom metadata passed at wrap time' },
                ].map((row) => (
                  <tr key={row.field}>
                    <td className="py-2 pr-4 font-mono text-xs text-blue-400">{row.field}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{row.type}</td>
                    <td className="py-2 text-xs text-muted-foreground">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-border/50 rounded-lg overflow-hidden">
              <button
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm font-medium">{faq.q}</span>
                {faqOpen === i ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              {faqOpen === i && (
                <div className="px-3 pb-3 text-sm text-muted-foreground border-t border-border/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Next steps */}
      <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-sm">Next Steps</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'View your trust receipts', href: '/dashboard/receipts' },
              { label: 'Set up API keys', href: '/dashboard/api' },
              { label: 'Configure agents', href: '/dashboard/agents' },
              { label: 'Full API reference', href: '/dashboard/docs' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ArrowRight className="w-3 h-3" />
                {link.label}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}