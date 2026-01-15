'use client';

import React from 'react';
import { TrustEvaluation } from '@/lib/api';
import { TrustReceiptCompact } from '../trust-receipt/TrustReceiptCompact';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Shield, User, Bot, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  evaluation?: TrustEvaluation;
  timestamp: number;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  evaluation,
  timestamp,
}) => {
  const isAssistant = role === 'assistant';
  
  return (
    <div className={cn(
      "flex w-full gap-4 p-4 transition-colors",
      isAssistant ? "bg-slate-50/50 dark:bg-slate-900/20" : "bg-transparent"
    )}>
      <Avatar className={cn(
        "h-10 w-10 shrink-0 border",
        isAssistant ? "border-purple-500/30" : "border-slate-300"
      )}>
        <AvatarFallback className={isAssistant ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-600"}>
          {isAssistant ? <Bot size={20} /> : <User size={20} />}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">
            {isAssistant ? 'SYMBI Assistant' : 'You'}
          </span>
          <span className="text-[10px] text-slate-500">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
          {isAssistant && evaluation && (
            <div className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
              evaluation.status === 'PASS' ? "bg-emerald-100 text-emerald-700" :
              evaluation.status === 'PARTIAL' ? "bg-amber-100 text-amber-700" :
              "bg-red-100 text-red-700"
            )}>
              <Shield size={10} />
              Trust Score: {evaluation.trustScore.overall.toFixed(1)}
            </div>
          )}
        </div>
        
        <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">
          {content}
        </div>
        
        {isAssistant && evaluation && (
          <div className="mt-2 w-full max-w-lg">
            <TrustReceiptCompact evaluation={evaluation} />
          </div>
        )}
        
        {isAssistant && evaluation?.status === 'FAIL' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs">
            <AlertCircle size={14} className="shrink-0" />
            <span>Critical Trust Violation: This response failed constitutional alignment checks. Use with caution.</span>
          </div>
        )}
      </div>
    </div>
  );
};
