'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function OperatorLoop(): JSX.Element {
  return (
    <Card className="border-white/10 bg-white/5 text-white lg:col-span-5">
      <CardHeader>
        <CardTitle className="text-base">Operator Loop</CardTitle>
        <CardDescription className="text-white/60">Fast checklist for triage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-white/80">
        <div className="flex items-start gap-2">
          <span className="text-white/40">1.</span>
          <span>Scan critical alerts and assign ownership.</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-white/40">2.</span>
          <span>Inspect low-trust agents and recent spikes.</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-white/40">3.</span>
          <span>Run the smallest workflow that mitigates risk.</span>
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

