'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatMessageProps } from './ChatMessage';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Send, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
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
      // 1. Evaluate trust for user message (optional, but good for protocol)
      // 2. Get AI response and evaluate it
      const response = await api.evaluateTrust(input);
      
      const assistantMessage: ChatMessageProps = {
        role: 'assistant',
        content: "I've analyzed your input through the SYMBI Trust Protocol v1.8.0. Here are the constitutional alignment results and the cryptographic receipt for this interaction.",
        evaluation: response,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get trust evaluation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-4xl mx-auto border rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="font-semibold text-sm tracking-tight uppercase">SYMBI Trust-Aware Session</h2>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-500" />
            PROTOCOL V1.8.0
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle size={12} className="text-amber-500" />
            REAL-TIME AUDIT ACTIVE
          </div>
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
