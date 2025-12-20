// @ts-nocheck\n'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LabPage() {
  const [data, setData] = useState('');
  const [result, setResult] = useState<{metrics: number} | null>(null);

  const runExperiment = () => {
    // Mock lab experiment
    setResult({ metrics: Math.random() * 100 });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Experiment Lab Playground</h1>
      <Input value={data} onChange={(e) => setData(e.target.value)} placeholder="Enter experiment data" />
      <Button onClick={runExperiment}>Run Experiment</Button>
      {result && <p>Metrics: {result.metrics}</p>}
    </div>
  );
}
