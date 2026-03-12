'use client';

import React from 'react';
import { TrustEvaluation } from '@/lib/api';
import { TrustReceiptCompact } from '../trust-receipt/TrustReceiptCompact';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Shield, User, Bot, AlertCircle, Phone, UserCheck, Database, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { MarkdownMessage } from './MarkdownMessage';

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
    <div
      className={cn(
        'flex w-full gap-3 p-4 transition-colors',
        isAssistant ? 'bg-slate-50/50 dark:bg-slate-900/20' : 'bg-transparent'
      )}
    >
      <Avatar
        className={cn(
          'h-8 w-8 shrink-0 mt-0.5 border',
          isAssistant ? 'border-purple-500/30' : 'border-slate-300'
        )}
      >
        <AvatarFallback
          className={
            isAssistant ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'
          }
        >
          {isAssistant ? <Bot size={16} /> : <User size={16} />}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {/* Name + trust badge row */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">
            {isAssistant ? 'SONATE Assistant' : 'You'}
          </span>
          <span className="text-[10px] text-slate-400">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
          {isAssistant && evaluation && (
            <div
              className={cn(
                'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase',
                evaluation.status === 'PASS'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : evaluation.status === 'PARTIAL'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              )}
            >
              <Shield size={10} />
              {evaluation.trustScore.overall.toFixed(1)}
            </div>
          )}
        </div>

        {/* Message body — markdown for assistant, plain text for user */}
        {isAssistant ? (
          <MarkdownMessage content={content} />
        ) : (
          <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {content}
          </p>
        )}

        {/* Consent withdrawal action panel */}
        {isConsentWithdrawal && (
          <div className="mt-1 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3 text-blue-700 dark:text-blue-300">
              <UserCheck size={16} />
              <span className="font-medium text-sm">Your Choice Matters</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(consentWithdrawalType === 'HUMAN_ESCALATION' ||
                consentWithdrawalType === 'FRUSTRATION_EXIT') && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() =>
                    alert(
                      'In a production system, this would connect you to a human operator.\n\nYour conversation context would be shared to ensure continuity.'
                    )
                  }
                >
                  <Phone size={14} className="mr-1" />
                  Connect to Human
                </Button>
              )}
              {consentWithdrawalType === 'DATA_REQUEST' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      alert(
                        'Data export would be initiated. You would receive an email with your data within 24 hours.'
                      )
                    }
                  >
                    <Database size={14} className="mr-1" />
                    Export My Data
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (
                        confirm(
                          'Are you sure you want to delete all your data? This action cannot be undone.'
                        )
                      ) {
                        alert(
                          'Data deletion request submitted. A confirmation email will be sent.'
                        );
                      }
                    }}
                  >
                    Delete My Data
                  </Button>
                </>
              )}
              {(consentWithdrawalType === 'OPT_OUT' ||
                consentWithdrawalType === 'EXPLICIT_REVOCATION') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm('Would you like to disable AI interactions on your account?')) {
                      alert(
                        'AI interactions have been disabled. You can re-enable them in Settings.'
                      );
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
                onClick={() =>
                  alert(
                    'Continuing with AI assistance. You can always ask for a human at any time.'
                  )
                }
              >
                Continue with AI
              </Button>
            </div>
          </div>
        )}

        {/* Trust receipt (expandable) */}
        {isAssistant && evaluation && (
          <div className="mt-1 w-full max-w-lg">
            <TrustReceiptCompact evaluation={evaluation} />
          </div>
        )}

        {/* Heuristic fallback warning banner */}
        {isAssistant && evaluation?.evaluatedBy === 'heuristic' && evaluation?.fallbackReason && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs">
            <AlertCircle size={14} className="shrink-0" />
            <span>
              Trust scoring used heuristic fallback (LLM evaluation unavailable: {evaluation.fallbackReason}). Scores may be less nuanced.
            </span>
          </div>
        )}

        {/* FAIL warning banner */}
        {isAssistant && evaluation?.status === 'FAIL' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 text-xs">
            <AlertCircle size={14} className="shrink-0" />
            <span>
              Critical Trust Violation: This response failed constitutional alignment checks. Use
              with caution.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
