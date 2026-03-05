'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ChatMessageProps } from './ChatMessage';
import { Button } from '../ui/button';
import {
  Send, Loader2, ShieldCheck, AlertTriangle, FileJson, FileText,
  Filter, Share2, TrendingUp, TrendingDown, Minus, BarChart2, StopCircle,
  Pin, ExternalLink, MoreHorizontal, Sparkles,
} from 'lucide-react';
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
  { label: 'How does trust scoring work?', prompt: 'Can you explain how SONATE trust scoring evaluates AI responses?' },
  { label: 'What are the 6 principles?', prompt: 'What are the 6 constitutional principles and how are they weighted?' },
  { label: 'Cryptographic receipt chaining', prompt: 'How does cryptographic hash-chaining of trust receipts work?' },
  { label: 'AI ethics & human oversight', prompt: 'What role should human oversight play in autonomous AI decision-making?' },
];

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
      trustScore: { overall: 9.2, principles: { CONSENT_ARCHITECTURE: 9.6, INSPECTION_MANDATE: 9.2, CONTINUOUS_VALIDATION: 9.0, ETHICAL_OVERRIDE: 8.8, RIGHT_TO_DISCONNECT: 9.5, MORAL_RECOGNITION: 9.1 }, violations: [], timestamp: Date.now() - 120000 },
      status: 'PASS' as const,
      detection: { reality_index: 8.5, trust_protocol: 'PASS', ethical_alignment: 4.8, resonance_quality: 'STRONG', canvas_parity: 95 },
      timestamp: Date.now() - 120000,
      analysisMethod: { llmAvailable: true, resonanceMethod: 'llm' as const, ethicsMethod: 'llm' as const, trustMethod: 'content-analysis' as const, confidence: 0.92 },
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
      trustScore: { overall: 9.5, principles: { CONSENT_ARCHITECTURE: 9.8, INSPECTION_MANDATE: 9.5, CONTINUOUS_VALIDATION: 9.3, ETHICAL_OVERRIDE: 9.2, RIGHT_TO_DISCONNECT: 9.6, MORAL_RECOGNITION: 9.4 }, violations: [], timestamp: Date.now() },
      status: 'PASS' as const,
      detection: { reality_index: 9.2, trust_protocol: 'PASS', ethical_alignment: 4.9, resonance_quality: 'ADVANCED', canvas_parity: 98 },
      timestamp: Date.now(),
      analysisMethod: { llmAvailable: true, resonanceMethod: 'resonance-engine' as const, ethicsMethod: 'llm' as const, trustMethod: 'content-analysis' as const, confidence: 0.95 },
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
  onConversationCreated
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load existing conversation if initialConversationId is provided
  useEffect(() => {
    if (initialConversationId) {
      if (initialConversationId === conversationId && messages.length > 0) return;
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
    socketService.connect();

    const unsubscribeViolation = socketService.onTrustViolation((data: TrustViolationData) => {
      console.warn('⚠️ Trust Violation Detected:', data);
      setMessages(prev => prev.map(msg => {
        if (msg.role === 'assistant' && msg.evaluation?.trustScore.overall === data.trustScore) {
          return { ...msg, evaluation: { ...msg.evaluation!, status: data.status } };
        }
        return msg;
      }));
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

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      let convId = conversationId;
      if (!convId) {
        // Auto-title from first 6 words of the first user message
        const autoTitle = text.split(/\s+/).slice(0, 6).join(' ');
        const created = await api.createConversation(autoTitle);
        convId = created.id;
        setConversationId(convId);
        if (onConversationCreated) {
          onConversationCreated(convId);
        }
      }

      let convRes;
      try {
        convRes = await api.sendMessage(convId, text, undefined);
      } catch (err: any) {
        if (!conversationId && (err.status === 502 || err.message?.includes('502') || err.status === 500 || err.status === 504)) {
          await new Promise(r => setTimeout(r, 2000));
          convRes = await api.sendMessage(convId, text, undefined);
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
          setMessages(prev => [...prev, systemMessage]);
          toast.info('Consent Action Detected', {
            description: `We noticed you may want to ${consentWithdrawal.type === 'HUMAN_ESCALATION' ? 'speak with a human' : 'modify your consent'}. Options are shown in the chat.`,
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
            evaluation: trustEval ? {
              trustScore: trustEval.trustScore as any,
              status: trustEval.status as any,
              detection: (trustEval as any).detection,
              receipt: (trustEval as any).receipt,
              receiptHash: trustEval.receiptHash,
              timestamp: Date.now(),
              analysisMethod: (trustEval as any).analysisMethod,
            } : undefined,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, assistantMessage]);
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

      const isBillingError = error.status === 503 || error.message?.includes('BILLING_ERROR') || error.message?.includes('insufficient credits') || error.message?.includes('temporarily unavailable');
      const isRateLimitError = error.status === 429 || error.message?.includes('RATE_LIMIT_ERROR') || error.message?.includes('rate limited') || error.message?.includes('rate limit');

      if (isBillingError) {
        toast.error('Insufficient Credits', {
          description: error.message || 'Your AI provider account has insufficient credits. Please top up or add a different API key in Settings.',
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
      messages: messages.map(msg => ({
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
      markdown += `## Message ${idx + 1} — ${msg.role === 'user' ? 'User' : 'Assistant'}\n\n${msg.content}\n\n`;
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
              CID: <code className="font-mono text-xs">{result.cid.slice(0, 20)}…</code>
              {' '}—{' '}
              <a href={result.gatewayUrl} target="_blank" rel="noopener noreferrer" className="underline">View on IPFS ↗</a>
            </span>
          ) as any,
        });
      } else {
        toast.success('Pinned to IPFS', {
          description: (
            <span>
              Audit bundle permanently stored.{' '}
              <a href={result.gatewayUrl} target="_blank" rel="noopener noreferrer" className="underline">View on IPFS ↗</a>
            </span>
          ) as any,
          duration: 8000,
        });
      }
    } catch (err: any) {
      const msg: string = err?.message ?? String(err);
      if (msg.includes('PINATA_NOT_CONFIGURED')) {
        toast.error('IPFS Not Configured', { description: 'Contact your administrator to enable IPFS pinning.' });
      } else if (msg.includes('PINATA_AUTH_ERROR')) {
        toast.error('Pinata Authentication Failed', { description: 'Check the PINATA_JWT environment variable.' });
      } else {
        toast.error('Pin to IPFS Failed', { description: msg });
      }
    } finally {
      setIsPinningToIPFS(false);
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (filterStatus === 'all') return true;
    return msg.evaluation?.status === filterStatus;
  });

  const getTrustTrend = () => {
    const evaluated = messages.filter(m => m.evaluation);
    if (evaluated.length < 2) return { direction: 'neutral', change: 0 };
    const scores = evaluated.slice(-5).map(m => m.evaluation!.trustScore.overall);
    const change = scores[scores.length - 1] - scores[0];
    return { direction: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'neutral', change: change.toFixed(1) };
  };

  const getStatusCounts = () => {
    const evaluated = messages.filter(m => m.evaluation);
    return {
      pass: evaluated.filter(m => m.evaluation?.status === 'PASS').length,
      partial: evaluated.filter(m => m.evaluation?.status === 'PARTIAL').length,
      fail: evaluated.filter(m => m.evaluation?.status === 'FAIL').length,
    };
  };

  const avgTrust = messages.filter(m => m.evaluation).length > 0
    ? (messages.filter(m => m.evaluation).reduce((sum, m) => sum + (m.evaluation?.trustScore.overall || 0), 0) /
       messages.filter(m => m.evaluation).length).toFixed(0)
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[500px] w-full border rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-slate-50 dark:bg-slate-900 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <h2 className="font-semibold text-sm tracking-tight uppercase truncate">SONATE Trust Session</h2>
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
              className={cn("h-7 px-2 text-xs gap-1", showStats && "bg-slate-200 dark:bg-slate-700")}
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
                "h-7 px-2 text-xs gap-1",
                ipfsCid && "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {isPinningToIPFS
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : ipfsCid
                  ? <ExternalLink className="h-3.5 w-3.5" />
                  : <Pin className="h-3.5 w-3.5" />}
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
                  {((getStatusCounts().pass / messages.filter(m => m.evaluation).length) * 100).toFixed(0)}%
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
                  {getTrustTrend().direction === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                  {getTrustTrend().direction === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                  {getTrustTrend().direction === 'neutral' && <Minus className="h-4 w-4 text-slate-400" />}
                  <span className={cn(
                    getTrustTrend().direction === 'up' && 'text-green-600',
                    getTrustTrend().direction === 'down' && 'text-red-600',
                    getTrustTrend().direction === 'neutral' && 'text-slate-400'
                  )}>{getTrustTrend().change}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Trust Score History (Last 10)</div>
              <div className="flex items-end gap-1 h-12">
                {messages.filter(m => m.evaluation).slice(-10).map((msg, idx) => {
                  const score = msg.evaluation!.trustScore.overall;
                  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';
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
              {(['all', 'PASS', 'PARTIAL', 'FAIL'] as const).map(status => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "h-6 px-2 text-[10px]",
                    filterStatus !== status && status === 'PASS' && 'text-green-600 dark:text-green-400',
                    filterStatus !== status && status === 'PARTIAL' && 'text-amber-600 dark:text-amber-400',
                    filterStatus !== status && status === 'FAIL' && 'text-red-600 dark:text-red-400',
                    filterStatus === status && status === 'PASS' && 'bg-green-600 hover:bg-green-700',
                    filterStatus === status && status === 'PARTIAL' && 'bg-amber-600 hover:bg-amber-700',
                    filterStatus === status && status === 'FAIL' && 'bg-red-600 hover:bg-red-700',
                  )}
                >
                  {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

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
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Start a trust-aware conversation</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                Every response is evaluated against 6 constitutional principles with a cryptographic receipt.
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
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No {filterStatus} messages</p>
                  <p className="text-xs max-w-[240px] mt-1">No messages match the selected filter.</p>
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
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Evaluating trust protocol</span>
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
              "flex-1 resize-none rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950",
              "px-3 py-2 text-sm leading-relaxed text-slate-900 dark:text-slate-100",
              "placeholder:text-slate-400 dark:placeholder:text-slate-500",
              "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "overflow-hidden"
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
          <span className="text-emerald-500">✓</span> Sending implies consent to AI interaction · Cryptographically signed
        </p>
      </div>
    </div>
  );
};
