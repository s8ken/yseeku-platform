'use client';

import React from 'react';
import { TrustEvaluation } from '@/lib/api';
import { TrustReceiptCompact } from '../trust-receipt/TrustReceiptCompact';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Shield, User, Bot, AlertCircle, Phone, UserCheck, Database, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  evaluation?: TrustEvaluation;
  timestamp: number;
  isConsentWithdrawal?: boolean;
  consentWithdrawalType?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  evaluation,
  timestamp,
  isConsentWithdrawal,
  consentWithdrawalType,
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
        
        {/* Consent Withdrawal Action Buttons */}
        {isConsentWithdrawal && (
          <div className="mt-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3 text-blue-700 dark:text-blue-300">
              <UserCheck size={16} />
              <span className="font-medium text-sm">Your Choice Matters</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(consentWithdrawalType === 'HUMAN_ESCALATION' || consentWithdrawalType === 'FRUSTRATION_EXIT') && (
                <Button
                  size="sm"
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    // In production, this would initiate a real human handoff
                    alert('In a production system, this would connect you to a human operator.\n\nYour conversation context would be shared to ensure continuity.');
                  }}
                >
                  <Phone size={14} className="mr-1" />
                  Connect to Human
                </Button>
              )}
              {(consentWithdrawalType === 'DATA_REQUEST') && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      alert('Data export would be initiated. You would receive an email with your data within 24 hours.');
                    }}
                  >
                    <Database size={14} className="mr-1" />
                    Export My Data
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
                        alert('Data deletion request submitted. A confirmation email will be sent.');
                      }
                    }}
                  >
                    Delete My Data
                  </Button>
                </>
              )}
              {(consentWithdrawalType === 'OPT_OUT' || consentWithdrawalType === 'EXPLICIT_REVOCATION') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm('Would you like to disable AI interactions on your account?')) {
                      alert('AI interactions have been disabled. You can re-enable them in Settings.');
                    }
                  }}
                >
                  <LogOut size={14} className="mr-1" />
                  Disable AI
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  alert('Continuing with AI assistance. You can always ask for a human at any time.');
                }}
              >
                Continue with AI
              </Button>
            </div>
          </div>
        )}
        
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
