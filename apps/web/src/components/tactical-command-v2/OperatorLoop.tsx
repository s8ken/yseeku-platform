'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, RotateCcw } from 'lucide-react';

const CHECKLIST_KEY = 'tactical-command-checklist';

const CHECKLIST_ITEMS = [
  { id: 'alerts', label: 'Scan critical alerts and assign ownership' },
  { id: 'agents', label: 'Inspect low-trust agents and recent spikes' },
  { id: 'workflow', label: 'Run the smallest workflow that mitigates risk' },
];

export function OperatorLoop(): JSX.Element {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = sessionStorage.getItem(CHECKLIST_KEY);
      if (saved) setChecked(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (mounted) {
      sessionStorage.setItem(CHECKLIST_KEY, JSON.stringify(checked));
    }
  }, [checked, mounted]);

  const toggleItem = (id: string) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const resetChecklist = () => {
    setChecked({});
  };

  const completedCount = CHECKLIST_ITEMS.filter(item => checked[item.id]).length;
  const progress = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);
  const allComplete = completedCount === CHECKLIST_ITEMS.length;

  return (
    <Card className="border-white/10 bg-white/5 text-white lg:col-span-5">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            Operator Loop
            {allComplete && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          </CardTitle>
          <CardDescription className="text-white/60">
            Fast checklist for triage • {progress}% complete
          </CardDescription>
        </div>
        {completedCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white/50 hover:text-white hover:bg-white/10"
            onClick={resetChecklist}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Checklist items */}
        <div className="space-y-2">
          {CHECKLIST_ITEMS.map((item, idx) => (
            <div 
              key={item.id}
              className={`flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                checked[item.id] 
                  ? 'bg-emerald-500/10 border border-emerald-500/20' 
                  : 'hover:bg-white/5'
              }`}
              onClick={() => toggleItem(item.id)}
            >
              <Checkbox 
                checked={!!checked[item.id]}
                onCheckedChange={() => toggleItem(item.id)}
                className="mt-0.5 border-white/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
              />
              <span className={`text-sm ${checked[item.id] ? 'text-white/50 line-through' : 'text-white/80'}`}>
                <span className="text-white/40 mr-2">{idx + 1}.</span>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <Link href="/dashboard/brain" target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10">
              Open System Brain
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

