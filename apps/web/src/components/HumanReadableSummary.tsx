'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Sparkles, Activity, CheckCircle2, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Button } from '@/components/ui/button';

interface HumanReadableSummaryProps {
  trustScore: number;
  bedauIndex: number; // 0-1
  activeAgents: number;
  interactionsCount: number;
  alertsCount: number;
  policyStatus: boolean;
}

export function HumanReadableSummary({
  trustScore,
  bedauIndex,
  activeAgents,
  interactionsCount,
  alertsCount,
  policyStatus
}: HumanReadableSummaryProps) {
  const [showScience, setShowScience] = useState(false);
  
  // 1. Safety Narrative
  let safetyStatus = 'Secure';
  let safetyColor = 'text-emerald-500';
  let SafetyIcon = ShieldCheck; // Uppercase for component usage
  let safetyDesc = 'All constitutional principles are being met.';

  if (alertsCount > 0 || !policyStatus) {
    safetyStatus = 'Attention Needed';
    safetyColor = 'text-amber-500';
    SafetyIcon = AlertTriangle;
    safetyDesc = `${alertsCount} alerts require review. Policy compliance checks pending.`;
  }
  if (trustScore < 80) {
    safetyStatus = 'Degraded';
    safetyColor = 'text-red-500';
    SafetyIcon = AlertTriangle;
    safetyDesc = 'Trust score is below safety threshold. Intervention recommended.';
  }

  // 2. Mindset Narrative (Translating Bedau/Creativity)
  let mindsetStatus = 'Standard';
  let mindsetDesc = 'Agents are operating within predictable patterns.';
  let MindsetIcon = Activity; // Uppercase for component usage
  
  if (bedauIndex > 0.7) {
    mindsetStatus = 'Highly Creative';
    mindsetDesc = 'Agents are generating novel strategies and insights (High Emergence).';
    MindsetIcon = Sparkles;
  } else if (bedauIndex > 0.3) {
    mindsetStatus = 'Adaptive';
    mindsetDesc = 'Agents are learning and adapting to new inputs (Weak Emergence).';
    MindsetIcon = Sparkles;
  }

  // 3. Activity Narrative
  const activityStatus = 'Active Monitoring';
  const activityDesc = `Overseeing ${activeAgents} agents across ${interactionsCount} interactions today.`;

  return (
    <div className="mb-6 space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Safety Card */}
        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-opacity-10 ${safetyColor.replace('text-', 'bg-')}`}>
                <SafetyIcon className={`h-8 w-8 ${safetyColor}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Safety Status</p>
                <h3 className="text-2xl font-bold tracking-tight">{safetyStatus}</h3>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {safetyDesc}
            </p>
            {showScience && (
              <div className="mt-4 pt-4 border-t text-xs font-mono text-muted-foreground">
                Trust Score: {trustScore}/100 <br/>
                Alerts: {alertsCount} <br/>
                Policy Pass: {String(policyStatus)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mindset Card */}
        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <MindsetIcon className="h-8 w-8 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  System Mindset
                  <InfoTooltip term="Bedau Index" />
                </p>
                <h3 className="text-2xl font-bold tracking-tight">{mindsetStatus}</h3>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {mindsetDesc}
            </p>
            {showScience && (
              <div className="mt-4 pt-4 border-t text-xs font-mono text-muted-foreground">
                Bedau Index: {bedauIndex.toFixed(3)} <br/>
                Emergence Class: {bedauIndex > 0.7 ? 'HIGH_WEAK' : bedauIndex > 0.3 ? 'WEAK' : 'LINEAR'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Card */}
        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Operational Activity</p>
                <h3 className="text-2xl font-bold tracking-tight">{activeAgents} Agents</h3>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {activityDesc}
            </p>
            {showScience && (
              <div className="mt-4 pt-4 border-t text-xs font-mono text-muted-foreground">
                Interactions: {interactionsCount} <br/>
                Active Agents: {activeAgents}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowScience(!showScience)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {showScience ? (
            <>
              Hide underlying metrics
              <ChevronUp className="ml-1 h-3 w-3" />
            </>
          ) : (
            <>
              View underlying metrics
              <ChevronDown className="ml-1 h-3 w-3" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
