'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TrustPage() {
  const [data, setData] = useState('');
  const [receipt, setReceipt] = useState<{id: string, hash: string, signature: string} | null>(null);

  const generateReceipt = async () => {
    // Mock using @sonate/core
    const mockReceipt = { id: 'receipt-' + Date.now(), hash: 'abc123', signature: 'sig456' };
    setReceipt(mockReceipt);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Trust Protocol Simulator</h1>
      <Input value={data} onChange={(e) => setData(e.target.value)} placeholder="Enter data" />
      <Button onClick={generateReceipt}>Generate Receipt</Button>
      {receipt && (
        <div className="p-4 bg-muted rounded">
          <p>Receipt ID: {receipt.id}</p>
          <p>Hash: {receipt.hash}</p>
          <p>Signature: {receipt.signature}</p>
        </div>
      )}
    </div>
  );
}
