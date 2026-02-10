'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Zap, 
  ShieldOff, 
  FileText, 
  BellOff, 
  ChevronDown,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

type ActionStatus = 'idle' | 'loading' | 'success';

export function QuickActionsPanel(props: {
  onQuarantineAgent?: (agentId: string) => Promise<void>;
  onSilenceAlerts?: (duration: number) => Promise<void>;
  onGenerateReport?: () => Promise<void>;
  selectedAgentId?: string | null;
}): JSX.Element {
  const [reportStatus, setReportStatus] = useState<ActionStatus>('idle');
  const [silenceStatus, setSilenceStatus] = useState<ActionStatus>('idle');
  const [quarantineStatus, setQuarantineStatus] = useState<ActionStatus>('idle');

  const handleGenerateReport = async () => {
    setReportStatus('loading');
    try {
      if (props.onGenerateReport) {
        await props.onGenerateReport();
      } else {
        // Default: navigate to reports page
        window.open('/dashboard/reports', '_blank');
      }
      setReportStatus('success');
      toast.success('Compliance report initiated');
      setTimeout(() => setReportStatus('idle'), 2000);
    } catch {
      toast.error('Failed to generate report');
      setReportStatus('idle');
    }
  };

  const handleSilenceAlerts = async (minutes: number) => {
    setSilenceStatus('loading');
    try {
      if (props.onSilenceAlerts) {
        await props.onSilenceAlerts(minutes);
      }
      setSilenceStatus('success');
      toast.success(`Alerts silenced for ${minutes} minutes`);
      setTimeout(() => setSilenceStatus('idle'), 2000);
    } catch {
      toast.error('Failed to silence alerts');
      setSilenceStatus('idle');
    }
  };

  const handleQuarantineAgent = async () => {
    if (!props.selectedAgentId) {
      toast.error('Select an agent first');
      return;
    }
    setQuarantineStatus('loading');
    try {
      if (props.onQuarantineAgent) {
        await props.onQuarantineAgent(props.selectedAgentId);
      }
      setQuarantineStatus('success');
      toast.success('Agent quarantined');
      setTimeout(() => setQuarantineStatus('idle'), 2000);
    } catch {
      toast.error('Failed to quarantine agent');
      setQuarantineStatus('idle');
    }
  };

  const getButtonContent = (status: ActionStatus, icon: React.ReactNode, label: string) => {
    if (status === 'loading') return <Loader2 className="h-4 w-4 animate-spin" />;
    if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    return (
      <>
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </>
    );
  };

  return (
    <Card className="border-white/10 bg-white/5 text-white lg:col-span-7">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-5 w-5 text-amber-400" />
          Quick Actions
        </CardTitle>
        <CardDescription className="text-white/60">
          Common operator actions for rapid response
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 gap-2"
            onClick={handleQuarantineAgent}
            disabled={quarantineStatus === 'loading' || !props.selectedAgentId}
          >
            {getButtonContent(quarantineStatus, <ShieldOff className="h-4 w-4" />, 'Quarantine Agent')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 gap-2"
            onClick={handleGenerateReport}
            disabled={reportStatus === 'loading'}
          >
            {getButtonContent(reportStatus, <FileText className="h-4 w-4" />, 'Generate Report')}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 gap-2"
                disabled={silenceStatus === 'loading'}
              >
                {silenceStatus === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : silenceStatus === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <>
                    <BellOff className="h-4 w-4" />
                    <span className="hidden sm:inline">Silence Alerts</span>
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0B1020] border-white/10 text-white">
              <DropdownMenuItem 
                onClick={() => handleSilenceAlerts(15)}
                className="hover:bg-white/10 cursor-pointer"
              >
                15 minutes
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleSilenceAlerts(60)}
                className="hover:bg-white/10 cursor-pointer"
              >
                1 hour
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleSilenceAlerts(240)}
                className="hover:bg-white/10 cursor-pointer"
              >
                4 hours
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/dashboard/audit" target="_blank" rel="noreferrer">
            <Button
              variant="outline"
              size="sm"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10 gap-2"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Export Audit</span>
            </Button>
          </Link>
        </div>

        {!props.selectedAgentId && (
          <div className="mt-3 text-xs text-white/40">
            Tip: Select an agent from the Agents panel to enable quarantine
          </div>
        )}
      </CardContent>
    </Card>
  );
}
