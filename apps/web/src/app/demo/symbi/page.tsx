'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import * as Chart from 'chart.js';

export default function SymbiPage() {
  const [input, setInput] = useState('');
  const [scores, setScores] = useState(null);

  const analyze = async () => {
    // Mock analysis using @sonate/detect
    // In real, call API like in resonance page
    const mockScores = {
      reality: Math.random() * 10,
      trust: Math.random() * 10,
      ethical: Math.random() * 10,
      resonance: Math.random() * 10,
      canvas: Math.random() * 10,
    };
    setScores(mockScores);

    // Render charts
    const ctx = document.getElementById('symbi-chart');
    new Chart.Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Reality', 'Trust', 'Ethical', 'Resonance', 'Canvas'],
        datasets: [{
          label: 'SYMBI Scores',
          data: Object.values(mockScores),
          backgroundColor: 'rgba(0, 255, 255, 0.2)',
          borderColor: 'cyan',
        }]
      },
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">SYMBI Framework Explorer</h1>
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter conversation text" />
      <Button onClick={analyze}>Analyze</Button>
      {scores && (
        <canvas id="symbi-chart" width="400" height="400"></canvas>
      )}
    </div>
  );
}
