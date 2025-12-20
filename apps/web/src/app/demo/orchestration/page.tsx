'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function OrchestrationPage() {
  const [status, setStatus] = useState('Idle');

  const deployAgent = () => {
    setStatus('Deploying...');
    setTimeout(() => setStatus('Active'), 2000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Agent Orchestration Dashboard</h1>
      <Button onClick={deployAgent}>Deploy Agent</Button>
      <p>Status: {status}</p>
    </div>
  );
}
