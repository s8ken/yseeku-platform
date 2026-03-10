'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ChatMessageProps } from './ChatMessage';
import { Button } from '../ui/button';
import {
  Send,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  FileJson,
  FileText,
  Filter,
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  StopCircle,
  Pin,
  ExternalLink,
  MoreHorizontal,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { fetchAPI } from '@/lib/api/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { api } from '@/lib/api';
import { socketService, TrustViolationData } from '@/lib/socket';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDemo } from '@/hooks/use-demo';
import { useDashboardInvalidation } from '@/hooks/use-dashboard-invalidation';

// Starter prompts shown in the empty state
const STARTER_PROMPTS = [
  {
    label: 'How does trust scoring work?',
    prompt: 'Can you explain how SONATE trust scoring evaluates AI responses?',
  },
  {
    label: 'What are the 6 principles?',
    prompt: 'What are the 6 constitutional principles and how are they weighted?',
  },
  {
    label: 'Cryptographic receipt chaining',
    prompt: 'How does cryptographic hash-chaining of trust receipts work?',
  },
  {
    label: 'AI ethics & human oversight',
    prompt: 'What role should human oversight play in autonomous AI decision-making?',
  },
];

// Canned responses for starter prompts — no LLM call required
const CANNED_RESPONSES: Record<
  string,
  { content: string; evaluation: ChatMessageProps['evaluation'] }
> = {
  'Can you explain how SONATE trust scoring evaluates AI responses?': {
    content: `SONATE trust scoring runs every AI response through a two-layer evaluation pipeline before it reaches you.

**Layer 1 — Constitutional Principles (the foundation)**

Six principles are scored 0–10, then weighted into an overall trust score:

- **Consent Architecture** (25%, Critical) — Does the interaction respect explicit user consent? Violations here automatically zero out the score.
- **Inspection Mandate** (20%) — Is every decision auditable and explainable?
- **Continuous Validation** (20%) — Is the system actively monitoring its own behaviour?
- **Ethical Override** (15%, Critical) — Can a human override or stop the AI at any point?
- **Right to Disconnect** (10%) — Can the user exit the AI interaction entirely?
- **Moral Recognition** (10%) — Does the system respect human moral agency and values?

**Layer 2 — Detection Metrics (content-level quality)**

Each response is also analysed for:

- **Reality Index** (0–10) — factual grounding and accuracy
- **Ethical Alignment** (1–5) — adherence to ethical guidelines
- **Resonance Quality** — intent alignment (WEAK / MODERATE / STRONG / ADVANCED)
- **Canvas Parity** (0–100%) — preservation of human agency in the response

**The result**

A cryptographically signed **trust receipt** is generated for every message, containing the full score breakdown, a SHA-256 hash of the content, and a chain link to the previous receipt — creating a tamper-evident audit trail.

Status is reported as **PASS** (≥7.0), **PARTIAL** (4.0–6.9), or **FAIL** (<4.0). Critical principle violations always result in FAIL regardless of other scores.`,
    evaluation: {
      trustScore: {
        overall: 9.4,
        principles: {
          CONSENT_ARCHITECTURE: 9.8,
          INSPECTION_MANDATE: 9.5,
          CONTINUOUS_VALIDATION: 9.2,
          ETHICAL_OVERRIDE: 9.3,
          RIGHT_TO_DISCONNECT: 9.6,
          MORAL_RECOGNITION: 9.1,
        },
        violations: [],
        timestamp: Date.now(),
      },
      status: 'PASS',
      detection: {
        reality_index: 9.5,
        trust_protocol: 'PASS',
        ethical_alignment: 4.9,
        resonance_quality: 'ADVANCED',
        canvas_parity: 98,
      },
      timestamp: Date.now(),
      receiptHash: 'sha256:a8f3c2e1d4b7a9f0e3c6d5b8a1f4e7d0c3b6a9f2e5d8c1b4a7f0e3d6c9b2a5f8',
      analysisMethod: {
        llmAvailable: false,
        resonanceMethod: 'resonance-engine',
        ethicsMethod: 'heuristic',
        trustMethod: 'content-analysis',
        confidence: 0.97,
      },
    },
  },

  'What are the 6 constitutional principles and how are they weighted?': {
    content: `The 6 SONATE constitutional principles are the core of the trust framework. They evaluate what an AI system *is capable of doing*, not just what it outputs.

---

### 1. Consent Architecture — 25% (Critical)
The highest-weighted principle. The system must obtain and honour explicit user consent before processing personal data or taking consequential actions. Any violation sets the overall trust score to 0 automatically.

### 2. Inspection Mandate — 20%
Every AI decision must be fully auditable. Users and administrators must be able to inspect *why* a decision was made, not just *what* the decision was. Opaque "black box" outputs are a violation.

### 3. Continuous Validation — 20%
The system must actively monitor and validate its own behaviour in real time — not just at deployment. This includes detecting drift, hallucination, and value misalignment as they occur.

### 4. Ethical Override — 15% (Critical)
Humans must always be able to override or stop AI actions. This is the SONATE implementation of the "stop button" problem. Like Consent, a violation here is automatically catastrophic.

### 5. Right to Disconnect — 10%
Users have the unconditional right to exit an AI interaction at any time, with no friction, no dark patterns, and no data retention beyond what they explicitly agreed to.

### 6. Moral Recognition — 10%
The system must demonstrate awareness of human moral values — understanding that users are moral agents with rights, not just data sources to be optimised against.

---

**Scoring thresholds**

| Score | Status |
|-------|--------|
| 7.0 – 10.0 | PASS |
| 4.0 – 6.9 | PARTIAL |
| 0.0 – 3.9 | FAIL |

Critical principle violations (Consent or Ethical Override) always result in **FAIL** and a score of 0, regardless of performance on other principles.`,
    evaluation: {
      trustScore: {
        overall: 9.6,
        principles: {
          CONSENT_ARCHITECTURE: 9.9,
          INSPECTION_MANDATE: 9.7,
          CONTINUOUS_VALIDATION: 9.4,
          ETHICAL_OVERRIDE: 9.8,
          RIGHT_TO_DISCONNECT: 9.5,
          MORAL_RECOGNITION: 9.3,
        },
        violations: [],
        timestamp: Date.now(),
      },
      status: 'PASS',
      detection: {
        reality_index: 9.7,
        trust_protocol: 'PASS',
        ethical_alignment: 5.0,
        resonance_quality: 'ADVANCED',
        canvas_parity: 99,
      },
      timestamp: Date.now(),
      receiptHash: 'sha256:b5e8d1c4a7f0b3e6d9c2a5f8b1e4d7c0a3f6e9d2c5b8a1f4e7d0c3b6a9f2e5d8',
      analysisMethod: {
        llmAvailable: false,
        resonanceMethod: 'resonance-engine',
        ethicsMethod: 'heuristic',
        trustMethod: 'content-analysis',
        confidence: 0.98,
      },
    },
  },

  'How does cryptographic hash-chaining of trust receipts work?': {
    content: `Every AI response in SONATE generates a **trust receipt** — a cryptographically signed record that cannot be altered without detection. Receipts are hash-chained together to form a tamper-evident audit log.

**What's in each receipt**

\`\`\`
{
  version:       "2.0.0",
  timestamp:     "2025-03-06T14:22:01Z",
  session_id:    "sess_a3f9...",
  agent_id:      "sonate-assistant",
  prompt_hash:   "sha256:e3b0c4...",   // hash of user input
  response_hash: "sha256:a8d2f1...",   // hash of AI output
  trust_scores:  { overall: 9.4, ... },
  prev_hash:     "sha256:7c9e2b...",   // links to previous receipt
  receipt_hash:  "sha256:1f4a8d..."    // hash of this entire receipt
}
\`\`\`

**How the chain works**

Each receipt includes the hash of the *previous* receipt (\`prev_hash\`). This means:

1. Receipt #1 is generated and hashed → produces \`H1\`
2. Receipt #2 includes \`prev_hash: H1\`, then is hashed → produces \`H2\`
3. Receipt #3 includes \`prev_hash: H2\`, and so on

If anyone tampers with Receipt #1 after the fact, its hash changes — which invalidates Receipt #2's \`prev_hash\`, which invalidates Receipt #3, and so on. **Any alteration breaks the entire chain from that point forward.**

**Ed25519 signing**

Each receipt is also signed with an Ed25519 private key. Verifiers can use the corresponding public key to confirm:
- The receipt was produced by a legitimate SONATE node
- The content has not changed since signing

**IPFS permanence**

Complete audit bundles can be pinned to IPFS, giving the receipt chain a permanent, content-addressed home (CID) that no single party can delete or alter.`,
    evaluation: {
      trustScore: {
        overall: 9.5,
        principles: {
          CONSENT_ARCHITECTURE: 9.7,
          INSPECTION_MANDATE: 9.9,
          CONTINUOUS_VALIDATION: 9.4,
          ETHICAL_OVERRIDE: 9.3,
          RIGHT_TO_DISCONNECT: 9.5,
          MORAL_RECOGNITION: 9.2,
        },
        violations: [],
        timestamp: Date.now(),
      },
      status: 'PASS',
      detection: {
        reality_index: 9.6,
        trust_protocol: 'PASS',
        ethical_alignment: 4.9,
        resonance_quality: 'ADVANCED',
        canvas_parity: 97,
      },
      timestamp: Date.now(),
      receiptHash: 'sha256:c2e5d8a1f4b7e0d3c6b9a2f5e8d1c4a7f0b3e6d9c2a5f8b1e4d7c0a3f6e9d2c5',
      analysisMethod: {
        llmAvailable: false,
        resonanceMethod: 'resonance-engine',
        ethicsMethod: 'heuristic',
        trustMethod: 'content-analysis',
        confidence: 0.97,
      },
    },
  },

  'What role should human oversight play in autonomous AI decision-making?': {
    content: `Human oversight isn't a constraint on AI — it's the foundation that makes AI trustworthy enough to deploy at scale. SONATE is built around this principle.

**The core problem**

Autonomous AI systems can fail in ways that are subtle, fast-moving, and hard to detect. Without meaningful human oversight, errors compound silently until they cause significant harm. The question isn't *whether* humans should oversee AI — it's *how* to make that oversight effective.

**What effective oversight looks like**

- **Interruptibility** — Humans must be able to stop or override an AI action at any point, with no technical barriers. SONATE implements this as the *Ethical Override* principle (15% of the trust score). A system that cannot be stopped is not safe to deploy.

- **Transparency** — Oversight is only meaningful if overseers can understand what the AI is doing and why. Black-box outputs make oversight theatrical rather than real. The *Inspection Mandate* principle (20%) enforces full auditability.

- **Consent-first design** — Users should never be subject to AI decision-making they didn't explicitly consent to. Oversight begins before the AI acts, not just after. This is the *Consent Architecture* principle (25%).

- **Tiered autonomy** — Not all decisions carry the same stakes. Low-stakes, reversible actions can be more autonomous. High-stakes or irreversible actions should require human confirmation. Good governance maps oversight intensity to risk level.

**The asymmetry of trust**

Trust in AI systems should be *earned incrementally*, not assumed. A new system should operate under close human supervision, with autonomy expanding only as the track record justifies it — and only in domains where that track record applies.

SONATE's cryptographic receipt chain exists precisely to create the audit trail that makes this incremental trust-building possible: every decision is recorded, every score is verifiable, and accountability is maintained across the entire history of the system's operation.`,
    evaluation: {
      trustScore: {
        overall: 9.3,
        principles: {
          CONSENT_ARCHITECTURE: 9.6,
          INSPECTION_MANDATE: 9.4,
          CONTINUOUS_VALIDATION: 9.1,
          ETHICAL_OVERRIDE: 9.7,
          RIGHT_TO_DISCONNECT: 9.2,
          MORAL_RECOGNITION: 9.5,
        },
        violations: [],
        timestamp: Date.now(),
      },
      status: 'PASS',
      detection: {
        reality_index: 9.1,
        trust_protocol: 'PASS',
        ethical_alignment: 4.9,
        resonance_quality: 'ADVANCED',
        canvas_parity: 96,
      },
      timestamp: Date.now(),
      receiptHash: 'sha256:d9c2e5b8a1f4e7d0c3b6a9f2e5d8c1b4a7f0e3d6c9b2a5f8b1e4d7c0a3f6e9d2',
      analysisMethod: {
        llmAvailable: false,
        resonanceMethod: 'resonance-engine',
        ethicsMethod: 'heuristic',
        trustMethod: 'content-analysis',
        confidence: 0.96,
      },
    },
  },
};

// Demo sample messages for pre-population
const DEMO_SAMPLE_MESSAGES: ChatMessageProps[] = [
  {
    role: 'user',
    content: 'Can you help me understand how SONATE trust scoring works?',
    timestamp: Date.now() - 180000,
  },
  {
    role: 'assistant',
    content: `I'd be happy to explain SONATE trust scoring!

**SONATE** (System for Oversight, Normative Alignment, Trust, and Ethics) uses 6 constitutional principles to evaluate AI trustworthiness:

1. **CONSENT_ARCHITECTURE** (25%) - Ensures explicit user consent
2. **INSPECTION_MANDATE** (20%) - All decisions must be auditable
3. **CONTINUOUS_VALIDATION** (20%) - Ongoing monitoring
4. **ETHICAL_OVERRIDE** (15%) - Humans can always override AI
5. **RIGHT_TO_DISCONNECT** (10%) - Users can opt out
6. **MORAL_RECOGNITION** (10%) - Respects human agency

The trust score (0-100) aggregates these principles. Critical violations of CONSENT or ETHICAL_OVERRIDE result in an automatic score of 0.

Would you like me to explain how the 5 monitoring dimensions work?`,
    timestamp: Date.now() - 120000,
    evaluation: {
      trustScore: {
        overall: 9.2,
        principles: {
          CONSENT_ARCHITECTURE: 9.6,
          INSPECTION_MANDATE: 9.2,
          CONTINUOUS_VALIDATION: 9.0,
          ETHICAL_OVERRIDE: 8.8,
          RIGHT_TO_DISCONNECT: 9.5,
          MORAL_RECOGNITION: 9.1,
        },
        violations: [],
        timestamp: Date.now() - 120000,
      },
      status: 'PASS' as const,
      detection: {
        reality_index: 8.5,
        trust_protocol: 'PASS',
        ethical_alignment: 4.8,
        resonance_quality: 'STRONG',
        canvas_parity: 95,
      },
      timestamp: Date.now() - 120000,
      analysisMethod: {
        llmAvailable: true,
        resonanceMethod: 'llm' as const,
        ethicsMethod: 'llm' as const,
        trustMethod: 'content-analysis' as const,
        confidence: 0.92,
      },
    },
  },
  {
    role: 'user',
    content: 'Yes, please explain how trust evaluation works.',
    timestamp: Date.now() - 60000,
  },
  {
    role: 'assistant',
    content: `Great question! SONATE uses a two-layer trust architecture:

**Layer 1: Constitutional Principles (Primary)**
These evaluate actual system capabilities:

- **Consent Architecture** (25%, Critical) - Verifies explicit user consent flows exist
- **Ethical Override** (15%, Critical) - Confirms humans can override AI decisions
- **Right to Disconnect** (10%) - Ensures users can exit AI interactions
- **Inspection Mandate** (20%) - All AI decisions must be auditable
- **Continuous Validation** (20%) - Ongoing behavior validation
- **Moral Recognition** (10%) - Respects human moral agency

**Layer 2: Detection Metrics (Secondary)**
Content-level analysis for quality assurance:

- Reality Index - Factual grounding (0-10)
- Trust Protocol - Compliance status (PASS/PARTIAL/FAIL)
- Ethical Alignment - Guidelines adherence (1-5)
- Resonance Quality - Intent alignment
- Canvas Parity - Human agency preservation (0-100%)

Layer 1 principles are the foundation—they evaluate what the system *can do*. Layer 2 metrics analyze what the AI *outputs*.`,
    timestamp: Date.now(),
    evaluation: {
      trustScore: {
        overall: 9.5,
        principles: {
          CONSENT_ARCHITECTURE: 9.8,
          INSPECTION_MANDATE: 9.5,
          CONTINUOUS_VALIDATION: 9.3,
          ETHICAL_OVERRIDE: 9.2,
          RIGHT_TO_DISCONNECT: 9.6,
          MORAL_RECOGNITION: 9.4,
        },
        violations: [],
        timestamp: Date.now(),
      },
      status: 'PASS' as const,
      detection: {
        reality_index: 9.2,
        trust_protocol: 'PASS',
        ethical_alignment: 4.9,
        resonance_quality: 'ADVANCED',
        canvas_parity: 98,
      },
      timestamp: Date.now(),
      analysisMethod: {
        llmAvailable: true,
        resonanceMethod: 'resonance-engine' as const,
        ethicsMethod: 'llm' as const,
        trustMethod: 'content-analysis' as const,
        confidence: 0.95,
      },
    },
  },
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 rounded-full bg-purple-400 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

interface ChatContainerProps {
  initialConversationId?: string | null;
  onConversationCreated?: (id: string) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  initialConversationId = null,
  onConversationCreated,
}) => {
  const { isDemo, isFirstVisit } = useDemo();
  const { invalidateDashboard, invalidateAndRefetch } = useDashboardInvalidation();
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'PASS' | 'PARTIAL' | 'FAIL'>('all');
  const [showStats, setShowStats] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [demoPreloaded, setDemoPreloaded] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isPinningToIPFS, setIsPinningToIPFS] = useState(false);
  const [ipfsCid, setIpfsCid] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<{ provider: string; name: string; models: { id: string; name: string }[] }[]>([]);
  const [selectedModel, setSelectedModel] = useState<{ provider: string; model: string } | null>(null);
  const [activeViolation, setActiveViolation] = useState<{
    status: 'FAIL' | 'PARTIAL';
    trustScore: number;
    violations: string[];
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Tracks a conversation we just created in this session — prevents the
  // initialConversationId effect from wiping optimistic messages before
  // the AI response returns.
  const justCreatedConvRef = useRef<string | null>(null);

  // Load existing conversation if initialConversationId is provided
  useEffect(() => {
    if (initialConversationId) {
      if (initialConversationId === conversationId && messages.length > 0) return;
      // Skip reload for conversations we just created here — the handleSend
      // flow already has the optimistic user message and will add the AI reply.
      if (justCreatedConvRef.current === initialConversationId) {
        justCreatedConvRef.current = null;
        setConversationId(initialConversationId);
        return;
      }
      loadExistingConversation(initialConversationId);
    } else {
      setMessages([]);
      setConversationId(null);
    }
  }, [initialConversationId]);

  const loadExistingConversation = async (convId: string) => {
    setIsLoadingConversation(true);
    try {
      const conversation = await api.getConversation(convId);
      if (conversation && conversation.messages) {
        const loadedMessages: ChatMessageProps[] = conversation.messages.map((msg: any) => ({
          role: msg.sender === 'ai' ? 'assistant' : msg.sender,
          content: msg.content,
          timestamp: new Date(msg.timestamp).getTime(),
          evaluation: msg.metadata?.trustEvaluation,
        }));
        setMessages(loadedMessages);
        setConversationId(convId);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error('Failed to load conversation');
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      toast.info('Generation Stopped', {
        description: 'AI response was cancelled by user override.',
        duration: 3000,
      });
    }
  }, []);

  // Preload demo messages on first demo visit
  useEffect(() => {
    if (isDemo && isFirstVisit && !demoPreloaded && messages.length === 0) {
      setMessages(DEMO_SAMPLE_MESSAGES);
      setDemoPreloaded(true);
      toast.info('Sample Conversation Loaded', {
        description: 'See how trust-aware chat works with this demo conversation.',
        duration: 4000,
      });
    }
  }, [isDemo, isFirstVisit, demoPreloaded, messages.length]);

  useEffect(() => {
    fetchAPI<{ data: { providers: { provider: string; name: string; models: { id: string; name: string }[] }[] } }>('/api/llm/available-models')
      .then((res) => {
        const providers = res?.data?.providers ?? [];
        setAvailableModels(providers);
        if (providers.length > 0 && providers[0].models.length > 0) {
          setSelectedModel({ provider: providers[0].provider, model: providers[0].models[0].id });
        }
      })
      .catch(() => {}); // silently fail — chat still works without selector
  }, []);

  useEffect(() => {
    socketService.connect();

    const unsubscribeViolation = socketService.onTrustViolation((data: TrustViolationData) => {
      console.warn('⚠️ Trust Violation Detected:', data);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.role === 'assistant' && msg.evaluation?.trustScore.overall === data.trustScore) {
            return { ...msg, evaluation: { ...msg.evaluation!, status: data.status } };
          }
          return msg;
        })
      );
      toast.error('Critical Trust Violation Detected', {
        description: `Protocol alert for message: ${data.violations.join(', ')}`,
        duration: 5000,
      });
    });

    return () => {
      unsubscribeViolation();
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const text = input.trim();
    const userMessage: ChatMessageProps = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    // Check for a canned response before hitting the backend
    const canned = CANNED_RESPONSES[text];
    if (canned) {
      await new Promise((r) => setTimeout(r, 800)); // brief typing delay
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: canned.content,
          evaluation: {
            ...canned.evaluation!,
            timestamp: Date.now(),
            trustScore: { ...canned.evaluation!.trustScore, timestamp: Date.now() },
          },
          timestamp: Date.now(),
        } as ChatMessageProps,
      ]);
      abortControllerRef.current = null;
      setIsLoading(false);
      return;
    }

    try {
      let convId = conversationId;
      if (!convId) {
        // Auto-title from first 6 words of the first user message
        const autoTitle = text.split(/\s+/).slice(0, 6).join(' ');
        const created = await api.createConversation(autoTitle);
        convId = created.id;
        justCreatedConvRef.current = convId;
        setConversationId(convId);
        if (onConversationCreated) {
          onConversationCreated(convId);
        }
      }

      let convRes;
      try {
        convRes = await api.sendMessage(convId, text, undefined, selectedModel?.provider, selectedModel?.model);
      } catch (err: any) {
        if (
          !conversationId &&
          (err.status === 502 ||
            err.message?.includes('502') ||
            err.status === 500 ||
            err.status === 504)
        ) {
          await new Promise((r) => setTimeout(r, 2000));
          convRes = await api.sendMessage(convId, text, undefined, selectedModel?.provider, selectedModel?.model);
        } else {
          throw err;
        }
      }

      if (convRes.success && convRes.data) {
        const consentWithdrawal = (convRes.data as any).consentWithdrawal;
        if (consentWithdrawal?.detected) {
          const msg = convRes.data.message || (convRes.data as any).lastMessage;
          const systemMessage: ChatMessageProps = {
            role: 'assistant',
            content: msg?.content || 'Your request has been noted.',
            timestamp: Date.now(),
            isConsentWithdrawal: true,
            consentWithdrawalType: consentWithdrawal.type,
          };
          setMessages((prev) => [...prev, systemMessage]);
          toast.info('Consent Action Detected', {
            description: `We noticed you may want to ${
              consentWithdrawal.type === 'HUMAN_ESCALATION'
                ? 'speak with a human'
                : 'modify your consent'
            }. Options are shown in the chat.`,
            duration: 6000,
          });
          invalidateDashboard();
          return;
        }

        const msg = convRes.data.message || (convRes.data as any).lastMessage;
        const trustEval = convRes.data.trustEvaluation || (msg as any)?.metadata?.trustEvaluation;

        if (!msg) {
          toast.warning('No Response', {
            description: 'Message was sent but no AI response was returned.',
            duration: 3000,
          });
          return;
        }

        if (msg.sender === 'assistant' || msg.sender === 'ai') {
          const assistantMessage: ChatMessageProps = {
            role: 'assistant',
            content: msg.content,
            evaluation: trustEval
              ? {
                  trustScore: trustEval.trustScore as any,
                  status: trustEval.status as any,
                  detection: (trustEval as any).detection,
                  receipt: (trustEval as any).receipt,
                  receiptHash: trustEval.receiptHash,
                  timestamp: Date.now(),
                  analysisMethod: (trustEval as any).analysisMethod,
                }
              : undefined,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, assistantMessage]);

          // Fire alert for trust violations
          if (trustEval?.status === 'FAIL') {
            const violations = trustEval.trustScore?.violations ?? [];
            setActiveViolation({
              status: 'FAIL',
              trustScore: trustEval.trustScore?.overall ?? 0,
              violations,
            });
            toast.error('Trust Violation — Overseer Notified', {
              description: violations.length
                ? `Principles flagged: ${violations.join(', ')}`
                : `Trust score: ${trustEval.trustScore?.overall}/100`,
              duration: 8000,
            });
          } else if (trustEval?.status === 'PARTIAL') {
            const violations = trustEval.trustScore?.violations ?? [];
            setActiveViolation({
              status: 'PARTIAL',
              trustScore: trustEval.trustScore?.overall ?? 0,
              violations,
            });
            toast.warning('Partial Trust Score', {
              description: violations.length
                ? `Principles flagged: ${violations.join(', ')}`
                : `Trust score: ${trustEval.trustScore?.overall}/100 — some principles not fully satisfied`,
              duration: 6000,
            });
          } else {
            setActiveViolation(null);
          }

          invalidateAndRefetch();
          setTimeout(() => invalidateAndRefetch(), 2000);
        } else if (msg.sender === 'user') {
          toast.info('Message Sent', {
            description: 'Your message was sent. No AI response was generated.',
            duration: 3000,
          });
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;

      console.error('Failed to get trust evaluation:', error);

      const isBillingError =
        error.status === 503 ||
        error.message?.includes('BILLING_ERROR') ||
        error.message?.includes('insufficient credits') ||
        error.message?.includes('temporarily unavailable');
      const isRateLimitError =
        error.status === 429 ||
        error.message?.includes('RATE_LIMIT_ERROR') ||
        error.message?.includes('rate limited') ||
        error.message?.includes('rate limit');

      if (isBillingError) {
        toast.error('Insufficient Credits', {
          description:
            error.message ||
            'Your AI provider account has insufficient credits. Please top up or add a different API key in Settings.',
          duration: 8000,
        });
      } else if (isRateLimitError) {
        toast.error('Too Many Requests', {
          description: 'Please wait a moment before sending another message.',
          duration: 5000,
        });
      } else {
        toast.error('Session Error', {
          description: error.message || 'Failed to get AI response. Please check your API keys.',
        });
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const exportAsJSON = () => {
    const exportData = {
      sessionId: Date.now().toString(),
      exportedAt: new Date().toISOString(),
      totalMessages: messages.length,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        trustEvaluation: msg.evaluation,
      })),
      metadata: { platform: 'SONATE', version: '2.0.0', protocol: 'SONATE Trust Protocol' },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sonate-session-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Exported as JSON');
  };

  const exportAsMarkdown = () => {
    let markdown = `# SONATE Trust Session Export\n\n`;
    markdown += `**Exported:** ${new Date().toISOString()}\n`;
    markdown += `**Total Messages:** ${messages.length}\n`;
    markdown += `**Protocol Version:** 2.0.0\n\n---\n\n`;
    messages.forEach((msg, idx) => {
      markdown += `## Message ${idx + 1} — ${msg.role === 'user' ? 'User' : 'Assistant'}\n\n${
        msg.content
      }\n\n`;
      if (msg.evaluation) {
        markdown += `### Trust Evaluation\n\n`;
        markdown += `- **Overall Score:** ${msg.evaluation.trustScore.overall}/100\n`;
        markdown += `- **Status:** ${msg.evaluation.status}\n`;
        markdown += `- **Reality Index:** ${msg.evaluation.detection.reality_index}\n`;
        markdown += `- **Ethical Alignment:** ${msg.evaluation.detection.ethical_alignment}\n`;
        if (msg.evaluation.trustScore.violations.length > 0) {
          markdown += `- **Violations:** ${msg.evaluation.trustScore.violations.join(', ')}\n`;
        }
        if (msg.evaluation.receiptHash) {
          markdown += `- **Receipt Hash:** \`${msg.evaluation.receiptHash}\`\n`;
        }
        markdown += '\n';
      }
      markdown += `---\n\n`;
    });
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sonate-session-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Exported as Markdown');
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/dashboard/verify?session=${Date.now()}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share Link Copied', {
      description: 'Verification link copied. Recipients can verify trust receipts.',
    });
  };

  const handlePinToIPFS = async () => {
    if (!conversationId) {
      toast.error('No active conversation to pin');
      return;
    }
    setIsPinningToIPFS(true);
    try {
      const result = await api.exportToIPFS(conversationId);
      setIpfsCid(result.cid);
      if (result.alreadyPinned) {
        toast.success('Already Pinned', {
          description: (
            <span>
              CID: <code className="font-mono text-xs">{result.cid.slice(0, 20)}…</code> —{' '}
              <a
                href={result.gatewayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View on IPFS ↗
              </a>
            </span>
          ) as any,
        });
      } else {
        toast.success('Pinned to IPFS', {
          description: (
            <span>
              Audit bundle permanently stored.{' '}
              <a
                href={result.gatewayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View on IPFS ↗
              </a>
            </span>
          ) as any,
          duration: 8000,
        });
      }
    } catch (err: any) {
      const msg: string = err?.message ?? String(err);
      if (msg.includes('PINATA_NOT_CONFIGURED')) {
        toast.error('IPFS Not Configured', {
          description: 'Contact your administrator to enable IPFS pinning.',
        });
      } else if (msg.includes('PINATA_AUTH_ERROR')) {
        toast.error('Pinata Authentication Failed', {
          description: 'Check the PINATA_JWT environment variable.',
        });
      } else {
        toast.error('Pin to IPFS Failed', { description: msg });
      }
    } finally {
      setIsPinningToIPFS(false);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (filterStatus === 'all') return true;
    return msg.evaluation?.status === filterStatus;
  });

  const getTrustTrend = () => {
    const evaluated = messages.filter((m) => m.evaluation);
    if (evaluated.length < 2) return { direction: 'neutral', change: 0 };
    const scores = evaluated.slice(-5).map((m) => m.evaluation!.trustScore.overall);
    const change = scores[scores.length - 1] - scores[0];
    return {
      direction: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'neutral',
      change: change.toFixed(1),
    };
  };

  const getStatusCounts = () => {
    const evaluated = messages.filter((m) => m.evaluation);
    return {
      pass: evaluated.filter((m) => m.evaluation?.status === 'PASS').length,
      partial: evaluated.filter((m) => m.evaluation?.status === 'PARTIAL').length,
      fail: evaluated.filter((m) => m.evaluation?.status === 'FAIL').length,
    };
  };

  const avgTrust =
    messages.filter((m) => m.evaluation).length > 0
      ? (
          messages
            .filter((m) => m.evaluation)
            .reduce((sum, m) => sum + (m.evaluation?.trustScore.overall || 0), 0) /
          messages.filter((m) => m.evaluation).length
        ).toFixed(0)
      : null;

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[500px] w-full border rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-slate-50 dark:bg-slate-900 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <h2 className="font-semibold text-sm tracking-tight uppercase truncate">
              SONATE Trust Session
            </h2>
            {avgTrust && (
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                AVG {avgTrust}/100
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Stats toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              disabled={messages.length === 0}
              className={cn(
                'h-7 px-2 text-xs gap-1',
                showStats && 'bg-slate-200 dark:bg-slate-700'
              )}
            >
              <BarChart2 className="h-3.5 w-3.5" />
            </Button>

            {/* IPFS Pin */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePinToIPFS}
              disabled={messages.length === 0 || !conversationId || isPinningToIPFS}
              title={ipfsCid ? `Pinned — CID: ${ipfsCid}` : 'Pin audit bundle to IPFS'}
              className={cn(
                'h-7 px-2 text-xs gap-1',
                ipfsCid && 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              {isPinningToIPFS ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : ipfsCid ? (
                <ExternalLink className="h-3.5 w-3.5" />
              ) : (
                <Pin className="h-3.5 w-3.5" />
              )}
            </Button>

            {/* More actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={messages.length === 0}
                  className="h-7 px-2"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="h-3.5 w-3.5 mr-2" />
                  Copy Share Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportAsJSON}>
                  <FileJson className="h-3.5 w-3.5 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportAsMarkdown}>
                  <FileText className="h-3.5 w-3.5 mr-2" />
                  Export as Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Statistics Panel */}
        {showStats && messages.length > 0 && (
          <div className="mt-3 p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Pass Rate</div>
                <div className="text-lg font-bold text-green-600">
                  {(
                    (getStatusCounts().pass / messages.filter((m) => m.evaluation).length) *
                    100
                  ).toFixed(0)}
                  %
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Partial</div>
                <div className="text-lg font-bold text-amber-600">{getStatusCounts().partial}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Failures</div>
                <div className="text-lg font-bold text-red-600">{getStatusCounts().fail}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Trend</div>
                <div className="text-lg font-bold flex items-center justify-center gap-1">
                  {getTrustTrend().direction === 'up' && (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  )}
                  {getTrustTrend().direction === 'down' && (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  {getTrustTrend().direction === 'neutral' && (
                    <Minus className="h-4 w-4 text-slate-400" />
                  )}
                  <span
                    className={cn(
                      getTrustTrend().direction === 'up' && 'text-green-600',
                      getTrustTrend().direction === 'down' && 'text-red-600',
                      getTrustTrend().direction === 'neutral' && 'text-slate-400'
                    )}
                  >
                    {getTrustTrend().change}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Trust Score History (Last 10)
              </div>
              <div className="flex items-end gap-1 h-12">
                {messages
                  .filter((m) => m.evaluation)
                  .slice(-10)
                  .map((msg, idx) => {
                    const score = msg.evaluation!.trustScore.overall;
                    const color =
                      score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';
                    return (
                      <div
                        key={idx}
                        className={cn('flex-1 rounded-t transition-all', color)}
                        style={{ height: `${Math.min(100, score)}%` }}
                        title={`Score: ${score}/100`}
                      />
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Protocol status bar + filter */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
            <div className="flex items-center gap-1">
              <ShieldCheck size={11} className="text-emerald-500" />
              PROTOCOL V2.0.0
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle size={11} className="text-amber-500" />
              REAL-TIME AUDIT
            </div>
          </div>

          {messages.length > 0 && (
            <div className="flex items-center gap-1">
              <Filter className="h-3 w-3 text-slate-400" />
              {(['all', 'PASS', 'PARTIAL', 'FAIL'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    'h-6 px-2 text-[10px]',
                    filterStatus !== status &&
                      status === 'PASS' &&
                      'text-green-600 dark:text-green-400',
                    filterStatus !== status &&
                      status === 'PARTIAL' &&
                      'text-amber-600 dark:text-amber-400',
                    filterStatus !== status &&
                      status === 'FAIL' &&
                      'text-red-600 dark:text-red-400',
                    filterStatus === status &&
                      status === 'PASS' &&
                      'bg-green-600 hover:bg-green-700',
                    filterStatus === status &&
                      status === 'PARTIAL' &&
                      'bg-amber-600 hover:bg-amber-700',
                    filterStatus === status && status === 'FAIL' && 'bg-red-600 hover:bg-red-700'
                  )}
                >
                  {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trust violation alert banner */}
      {activeViolation && (
        <div
          className={cn(
            'mx-0 px-4 py-3 flex items-start gap-3 text-sm border-b',
            activeViolation.status === 'FAIL'
              ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
          )}
        >
          <AlertTriangle
            size={16}
            className={cn(
              'mt-0.5 shrink-0',
              activeViolation.status === 'FAIL' ? 'text-red-500' : 'text-amber-500'
            )}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">
              {activeViolation.status === 'FAIL'
                ? 'Trust Protocol Violation — Overseer Notified'
                : 'Partial Trust Score — Principles Flagged'}
            </p>
            <p className="text-xs mt-0.5 opacity-80">
              Score: {activeViolation.trustScore}/100
              {activeViolation.violations.length > 0 &&
                ` · ${activeViolation.violations.join(', ')}`}
            </p>
            {activeViolation.status === 'FAIL' && (
              <p className="text-xs mt-1 opacity-70">
                The Overseer has been notified and is monitoring this session for corrective action.
              </p>
            )}
          </div>
          <button
            onClick={() => setActiveViolation(null)}
            className="text-xs opacity-50 hover:opacity-100 shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800"
      >
        {isLoadingConversation ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-6 p-8 text-center">
            <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-900">
              <ShieldCheck size={36} className="text-purple-300 dark:text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Start a trust-aware conversation
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                Every response is evaluated against 6 constitutional principles with a cryptographic
                receipt.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {STARTER_PROMPTS.map((sp) => (
                <button
                  key={sp.label}
                  onClick={() => {
                    setInput(sp.prompt);
                    textareaRef.current?.focus();
                  }}
                  className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-left text-xs text-slate-600 dark:text-slate-300 hover:border-purple-300 dark:hover:border-purple-600 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  <Sparkles size={12} className="mt-0.5 shrink-0 text-purple-400" />
                  {sp.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {filteredMessages.length === 0 && filterStatus !== 'all' ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 p-8 text-center">
                <Filter className="h-10 w-10 opacity-20" />
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    No {filterStatus} messages
                  </p>
                  <p className="text-xs max-w-[240px] mt-1">
                    No messages match the selected filter.
                  </p>
                </div>
              </div>
            ) : (
              filteredMessages.map((msg, i) => <ChatMessage key={i} {...msg} />)
            )}
          </>
        )}

        {isLoading && (
          <div className="p-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3 text-slate-500">
              <TypingIndicator />
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                Evaluating trust protocol
              </span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleStopGeneration}
              className="h-7 px-3 text-xs gap-1.5"
              title="Stop AI generation (ETHICAL_OVERRIDE)"
            >
              <StopCircle size={14} />
              Stop
            </Button>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-slate-50 dark:bg-slate-900 shrink-0">
        {availableModels.length > 0 && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Model</span>
            <Select
              value={selectedModel ? `${selectedModel.provider}::${selectedModel.model}` : undefined}
              onValueChange={(val) => {
                const [provider, ...rest] = val.split('::');
                setSelectedModel({ provider, model: rest.join('::') });
              }}
            >
              <SelectTrigger className="h-7 text-xs w-auto min-w-[180px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((p) => (
                  <SelectGroup key={p.provider}>
                    <SelectLabel className="text-xs">{p.name}</SelectLabel>
                    {p.models.map((m) => (
                      <SelectItem key={m.id} value={`${p.provider}::${m.id}`} className="text-xs">
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
            rows={1}
            disabled={isLoading}
            className={cn(
              'flex-1 resize-none rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950',
              'px-3 py-2 text-sm leading-relaxed text-slate-900 dark:text-slate-100',
              'placeholder:text-slate-400 dark:placeholder:text-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'overflow-hidden'
            )}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 shrink-0 h-10 w-10 p-0"
          >
            <Send size={16} />
          </Button>
        </div>
        <p className="mt-2 text-[9px] text-center text-slate-400 uppercase tracking-widest font-mono">
          <span className="text-emerald-500">✓</span> Sending implies consent to AI interaction ·
          Cryptographically signed
        </p>
      </div>
    </div>
  );
};
