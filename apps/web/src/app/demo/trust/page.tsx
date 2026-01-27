'use client';

import React from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';

export default function TrustPage() {
  return (
    <div className="container mx-auto max-w-5xl py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Trust-Aware Session Interface</h1>
        <p className="text-muted-foreground">
          Real-time conversation with constitutional AI alignment and cryptographic receipts.
          All interactions are verified and logged to the Trust Ledger.
        </p>
      </div>
      <ChatContainer />
    </div>
  );
}
