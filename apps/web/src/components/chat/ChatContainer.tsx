'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatMessageProps } from './ChatMessage';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Send, Loader2, ShieldCheck, AlertTriangle, Download, FileJson, FileText } from 'lucide-react';
import { api, TrustEvaluation } from '@/lib/api';
import { socketService, TrustViolationData } from '@/lib/socket';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const ChatContainer: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

    try {
      // 1. Generate AI response
      const llmResponse = await api.generateLLMResponse('anthropic', 'claude-3-haiku-20240307', [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: input }
      ]);

      const aiContent = llmResponse.data.response;

      // 2. Evaluate trust for the AI response
      const response = await api.evaluateTrust(aiContent);

      const assistantMessage: ChatMessageProps = {
        role: 'assistant',
        content: aiContent,
        evaluation: response.data.evaluation,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Failed to get trust evaluation:', error);
      toast.error('Session Error', {
        description: error.message || 'Failed to get AI response. Please check your API keys.',
      });
    } finally {
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
        version: '1.10.0',
        protocol: 'SYMBI Trust Protocol',
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
    markdown += `**Protocol Version:** 1.10.0\n\n`;
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

  return (
    <div className="flex flex-col h-[600px] w-full max-w-4xl mx-auto border rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-semibold text-sm tracking-tight uppercase">SYMBI Trust-Aware Session</h2>
          </div>
          <div className="flex items-center gap-2">
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

        <div className="flex items-center gap-6 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-500" />
            PROTOCOL V1.10.0
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle size={12} className="text-amber-500" />
            REAL-TIME AUDIT ACTIVE
          </div>
          {messages.length > 0 && (
            <div className="flex items-center gap-3 ml-auto">
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
          messages.map((msg, i) => (
            <ChatMessage key={i} {...msg} />
          ))
        )}
        {isLoading && (
          <div className="p-4 flex items-center gap-3 text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs font-mono uppercase tracking-widest">Evaluating Trust Protocol...</span>
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
          All interactions are cryptographically signed and verified against the 6 constitutional principles.
        </p>
      </div>
    </div>
  );
};
