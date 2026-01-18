'use client';

import React from 'react';
import { EnhancedChatContainer } from '@/components/chat/EnhancedChatContainer';
import { Shield, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChatPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Shield className="h-8 w-8 text-purple-500" />
          Trust-Aware Session
        </h1>
        <p className="text-muted-foreground">
          Real-time AI interaction monitoring with SYMBI Trust Protocol v1.8.0.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <EnhancedChatContainer conversationId="default" />
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info size={16} className="text-blue-500" />
                How it works
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3 text-slate-600 dark:text-slate-400">
              <p>
                Every message in this session is processed through the <strong>SYMBI Trust Protocol</strong>.
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold">1</div>
                  <span><strong>Evaluation:</strong> AI responses are scored against 6 constitutional principles.</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold">2</div>
                  <span><strong>Verification:</strong> A cryptographic receipt is generated for every interaction.</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold">3</div>
                  <span><strong>Transparency:</strong> You can inspect the "Principle Breakdown" for any response.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                Protocol Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[11px] text-amber-700 dark:text-amber-300">
              If a response falls below a 5.0 trust score, a <strong>Trust Violation</strong> alert will trigger automatically.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
