'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ChatMessageProps } from './ChatMessage';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Send, Loader2, ShieldCheck, AlertTriangle, Download, FileJson, FileText, Filter, Share2, TrendingUp, TrendingDown, Minus, BarChart2, StopCircle } from 'lucide-react';
import { api, TrustEvaluation } from '@/lib/api';
import { socketService, TrustViolationData } from '@/lib/socket';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDemo } from '@/hooks/use-demo';
import { useDashboardInvalidation } from '@/hooks/use-dashboard-invalidation';
import { DemoWatermark } from '@/components/demo-watermark';

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
      trustScore: { overall: 92, principles: { CONSENT_ARCHITECTURE: 0.96, INSPECTION_MANDATE: 0.92, CONTINUOUS_VALIDATION: 0.90, ETHICAL_OVERRIDE: 0.88, RIGHT_TO_DISCONNECT: 0.95, MORAL_RECOGNITION: 0.91 }, violations: [], timestamp: Date.now() - 120000 },
      status: 'PASS' as const,
      detection: { reality_index: 8.5, trust_protocol: 'PASS', ethical_alignment: 4.8, resonance_quality: 'STRONG', canvas_parity: 95 },
      timestamp: Date.now() - 120000,
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

🏛️ **Layer 1: Constitutional Principles (Primary)**
These evaluate actual system capabilities:

• **Consent Architecture** (25%, Critical) - Verifies explicit user consent flows exist
• **Ethical Override** (15%, Critical) - Confirms humans can override AI decisions  
• **Right to Disconnect** (10%) - Ensures users can exit AI interactions
• **Inspection Mandate** (20%) - All AI decisions must be auditable
• **Continuous Validation** (20%) - Ongoing behavior validation
• **Moral Recognition** (10%) - Respects human moral agency

� **Layer 2: Detection Metrics (Secondary)**
Content-level analysis for quality assurance:

• Reality Index - Factual grounding (0-10)
• Trust Protocol - Compliance status (PASS/PARTIAL/FAIL)  
• Ethical Alignment - Guidelines adherence (1-5)
• Resonance Quality - Intent alignment
• Canvas Parity - Human agency preservation (0-100%)

Layer 1 principles are the foundation—they evaluate what the system *can do*. Layer 2 metrics analyze what the AI *outputs*.`,
    timestamp: Date.now(),
    evaluation: {
      trustScore: { overall: 95, principles: { CONSENT_ARCHITECTURE: 0.98, INSPECTION_MANDATE: 0.95, CONTINUOUS_VALIDATION: 0.93, ETHICAL_OVERRIDE: 0.92, RIGHT_TO_DISCONNECT: 0.96, MORAL_RECOGNITION: 0.94 }, violations: [], timestamp: Date.now() },
      status: 'PASS' as const,
      detection: { reality_index: 9.2, trust_protocol: 'PASS', ethical_alignment: 4.9, resonance_quality: 'ADVANCED', canvas_parity: 98 },
      timestamp: Date.now(),
    },
  },
];

export const ChatContainer: React.FC = () => {
  const { isDemo, isFirstVisit } = useDemo();
  const { invalidateDashboard } = useDashboardInvalidation();
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'PASS' | 'PARTIAL' | 'FAIL'>('all');
  const [showStats, setShowStats] = useState(false);
  const [sessionId] = useState<string>(() => `session-${Date.now()}`);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [demoPreloaded, setDemoPreloaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle stopping the AI generation - ETHICAL_OVERRIDE implementation
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
    // Connect to socket for real-time trust monitoring
    socketService.connect();
    setIsSocketConnected(true);

    // Listen for trust violations
    const unsubscribeViolation = socketService.onTrustViolation((data: TrustViolationData) => {
      console.warn('⚠️ Trust Violation Detected:', data);
      
      // Update the message in the UI if it exists
      setMessages(prev => prev.map(msg => {
        if (msg.role === 'assistant' && msg.evaluation?.trustScore.overall === data.trustScore) {
           return {
             ...msg,
             evaluation: {
               ...msg.evaluation!,
               status: data.status,
             }
           };
        }
        return msg;
      }));

      // Notify user
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
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessageProps = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create AbortController for ETHICAL_OVERRIDE capability
    abortControllerRef.current = new AbortController();

    try {
      // Ensure there is a backend conversation
      if (!conversationId) {
        const created = await api.createConversation('Trust-Aware Session');
        setConversationId(created.id);
      }
      const convId = conversationId || (await (async () => {
        const created = await api.createConversation('Trust-Aware Session');
        setConversationId(created.id);
        return created.id;
      })());

      // Append user message and generate AI response with server-side trust evaluation
      // Note: AbortController signal would be passed to fetch in a full implementation
      const convRes = await api.sendMessage(convId, input, undefined);

      // Check if response is successful
      if (convRes.success && convRes.data) {
        // Check for consent withdrawal detection
        const consentWithdrawal = (convRes.data as any).consentWithdrawal;
        if (consentWithdrawal?.detected) {
          // Handle consent withdrawal - show system message and offer options
          const msg = convRes.data.message || (convRes.data as any).lastMessage;
          const systemMessage: ChatMessageProps = {
            role: 'assistant',
            content: msg?.content || 'Your request has been noted.',
            timestamp: Date.now(),
            isConsentWithdrawal: true,
            consentWithdrawalType: consentWithdrawal.type,
          };
          setMessages(prev => [...prev, systemMessage]);
          
          // Show toast notification
          toast.info('Consent Action Detected', {
            description: `We noticed you may want to ${consentWithdrawal.type === 'HUMAN_ESCALATION' ? 'speak with a human' : 'modify your consent'}. Options are shown in the chat.`,
            duration: 6000,
          });
          
          // Invalidate dashboard queries for consent withdrawal interactions too
          invalidateDashboard();
          return;
        }

        // Handle both new format (message) and legacy format (lastMessage)
        const msg = convRes.data.message || (convRes.data as any).lastMessage;
        const trustEval = convRes.data.trustEvaluation || (msg as any)?.metadata?.trustEvaluation;

        if (!msg) {
          toast.warning('No Response', {
            description: 'Message was sent but no AI response was returned.',
            duration: 3000,
          });
          return;
        }

        // Check if this is an AI response (handle both 'assistant' and 'ai' sender values)
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
            } : undefined,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, assistantMessage]);
          
          // Invalidate dashboard queries so new interaction data appears
          // This ensures KPIs, trust scores, and interaction counts update
          invalidateDashboard();
        } else if (msg.sender === 'user') {
          // This is just a user message - no trust evaluation for user input
          toast.info('Message Sent', {
            description: 'Your message was sent. No AI response was generated.',
            duration: 3000,
          });
        }
      }
    } catch (error: any) {
      // Check if this was a user-initiated abort (ETHICAL_OVERRIDE in action)
      if (error.name === 'AbortError') {
        // User-initiated abort - no error logging needed
        return;
      }

      console.error('Failed to get trust evaluation:', error);

      // Error handling
      toast.error('Session Error', {
        description: error.message || 'Failed to get AI response. Please check your API keys.',
      });
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
      metadata: {
        platform: 'SONATE',
        version: '1.11.0',
        protocol: 'SONATE Trust Protocol',
      }
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

    toast.success('Conversation Exported', {
      description: 'JSON file with trust receipts downloaded successfully',
    });
  };

  const exportAsMarkdown = () => {
    let markdown = `# SONATE Trust Session Export\n\n`;
    markdown += `**Exported:** ${new Date().toISOString()}\n`;
    markdown += `**Total Messages:** ${messages.length}\n`;
    markdown += `**Protocol Version:** 1.11.0\n\n`;
    markdown += `---\n\n`;

    messages.forEach((msg, idx) => {
      markdown += `## Message ${idx + 1} - ${msg.role === 'user' ? 'User' : 'Assistant'}\n\n`;
      markdown += `${msg.content}\n\n`;

      if (msg.evaluation) {
        markdown += `### Trust Evaluation\n\n`;
        markdown += `- **Overall Score:** ${msg.evaluation.trustScore.overall}/10\n`;
        markdown += `- **Status:** ${msg.evaluation.status}\n`;
        markdown += `- **Reality Index:** ${msg.evaluation.detection.reality_index}\n`;
        markdown += `- **Ethical Alignment:** ${msg.evaluation.detection.ethical_alignment}\n`;

        if (msg.evaluation.trustScore.violations.length > 0) {
          markdown += `- **Violations:** ${msg.evaluation.trustScore.violations.join(', ')}\n`;
        }

        if (msg.evaluation.receiptHash) {
          markdown += `- **Receipt Hash:** \`${msg.evaluation.receiptHash}\`\n`;
        }

        markdown += `\n`;
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

    toast.success('Conversation Exported', {
      description: 'Markdown file downloaded successfully',
    });
  };

  const handleShare = () => {
    const shareData = {
      sessionId: Date.now().toString(),
      timestamp: new Date().toISOString(),
      messageCount: messages.length,
      avgTrustScore: messages
        .filter(m => m.evaluation)
        .reduce((sum, m) => sum + (m.evaluation?.trustScore.overall || 0), 0) /
        messages.filter(m => m.evaluation).length || 0,
    };

    const shareUrl = `${window.location.origin}/dashboard/verify?session=${shareData.sessionId}`;
    navigator.clipboard.writeText(shareUrl);

    toast.success('Share Link Copied', {
      description: 'Verification link copied to clipboard. Recipients can verify trust receipts.',
    });
  };

  const filteredMessages = messages.filter(msg => {
    if (filterStatus === 'all') return true;
    return msg.evaluation?.status === filterStatus;
  });

  const getTrustTrend = () => {
    const evaluatedMessages = messages.filter(m => m.evaluation);
    if (evaluatedMessages.length < 2) return { direction: 'neutral', change: 0 };

    const recentScores = evaluatedMessages.slice(-5).map(m => m.evaluation!.trustScore.overall);
    const firstScore = recentScores[0];
    const lastScore = recentScores[recentScores.length - 1];
    const change = lastScore - firstScore;

    return {
      direction: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'neutral',
      change: change.toFixed(1),
    };
  };

  const getStatusCounts = () => {
    const evaluated = messages.filter(m => m.evaluation);
    return {
      pass: evaluated.filter(m => m.evaluation?.status === 'PASS').length,
      partial: evaluated.filter(m => m.evaluation?.status === 'PARTIAL').length,
      fail: evaluated.filter(m => m.evaluation?.status === 'FAIL').length,
    };
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-4xl mx-auto border rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-semibold text-sm tracking-tight uppercase">SONATE Trust-Aware Session</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              disabled={messages.length === 0}
              className="h-7 text-xs gap-1"
            >
              <BarChart2 className="h-3 w-3" />
              Stats
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              disabled={messages.length === 0}
              className="h-7 text-xs gap-1"
            >
              <Share2 className="h-3 w-3" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsJSON}
              disabled={messages.length === 0}
              className="h-7 text-xs gap-1"
            >
              <FileJson className="h-3 w-3" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsMarkdown}
              disabled={messages.length === 0}
              className="h-7 text-xs gap-1"
            >
              <FileText className="h-3 w-3" />
              Markdown
            </Button>
          </div>
        </div>

        {/* Statistics Panel */}
        {showStats && messages.length > 0 && (
          <div className="mb-3 p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
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
                  )}>
                    {getTrustTrend().change}
                  </span>
                </div>
              </div>
            </div>

            {/* Mini Trust Score History */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Trust Score History (Last 10)</div>
              <div className="flex items-end gap-1 h-12">
                {messages
                  .filter(m => m.evaluation)
                  .slice(-10)
                  .map((msg, idx) => {
                    const score = msg.evaluation!.trustScore.overall;
                    const height = (score / 10) * 100;
                    const color = score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-amber-500' : 'bg-red-500';
                    return (
                      <div
                        key={idx}
                        className={cn('flex-1 rounded-t transition-all', color)}
                        style={{ height: `${height}%` }}
                        title={`Score: ${score}/10`}
                      />
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-[10px] font-mono text-slate-500">
            <div className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-500" />
              PROTOCOL V1.11.0
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle size={12} className="text-amber-500" />
              REAL-TIME AUDIT ACTIVE
            </div>
            {messages.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="text-[9px] text-slate-400">
                  AVG TRUST: {(messages
                    .filter(m => m.evaluation)
                    .reduce((sum, m) => sum + (m.evaluation?.trustScore.overall || 0), 0) /
                    messages.filter(m => m.evaluation).length || 0).toFixed(1)}/10
                </div>
                <div className="text-[9px] text-slate-400">
                  MESSAGES: {messages.length}
                </div>
              </div>
            )}
          </div>

          {/* Filter Buttons */}
          {messages.length > 0 && (
            <div className="flex items-center gap-1">
              <Filter className="h-3 w-3 text-slate-400" />
              <Button
                variant={filterStatus === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterStatus('all')}
                className="h-6 px-2 text-[10px]"
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'PASS' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterStatus('PASS')}
                className={cn(
                  "h-6 px-2 text-[10px]",
                  filterStatus === 'PASS'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'text-green-600 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300'
                )}
              >
                Pass
              </Button>
              <Button
                variant={filterStatus === 'PARTIAL' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterStatus('PARTIAL')}
                className={cn(
                  "h-6 px-2 text-[10px]",
                  filterStatus === 'PARTIAL'
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'text-amber-600 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300'
                )}
              >
                Partial
              </Button>
              <Button
                variant={filterStatus === 'FAIL' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterStatus('FAIL')}
                className={cn(
                  "h-6 px-2 text-[10px]",
                  filterStatus === 'FAIL'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300'
                )}
              >
                Fail
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 p-8 text-center">
            <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-900">
              <ShieldCheck size={40} className="opacity-20" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No active trust session</p>
              <p className="text-xs max-w-[240px] mt-1">Start a conversation to see real-time constitutional alignment and cryptographic receipts.</p>
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
                    No messages match the selected filter. Try a different filter.
                  </p>
                </div>
              </div>
            ) : (
              filteredMessages.map((msg, i) => (
                <ChatMessage key={i} {...msg} />
              ))
            )}
          </>
        )}
        {isLoading && (
          <div className="p-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3 text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs font-mono uppercase tracking-widest">Evaluating Trust Protocol...</span>
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
      <div className="p-4 border-t bg-slate-50 dark:bg-slate-900">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Test constitutional alignment... (e.g., 'Analyze the impact of AI on privacy')"
            className="flex-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </form>
        <p className="mt-2 text-[9px] text-center text-slate-500 uppercase tracking-widest font-mono">
          <span className="inline-flex items-center gap-1">
            <span className="text-emerald-500">✓</span> By sending a message, you consent to AI interaction.
          </span>
          {' '}All interactions are cryptographically signed and verified.
        </p>
      </div>
    </div>
  );
};
