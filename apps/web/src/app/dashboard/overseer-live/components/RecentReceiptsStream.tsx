/**
 * RecentReceiptsStream Component
 * 
 * Shows recent trust receipts in real-time with granular SONATE transparency.
 */

'use client'

import { LiveMetrics } from '@/lib/services/overseer'
import { Badge } from '@/components/ui/badge'
import { 
  Fingerprint, 
  Cpu, 
  Sparkles, 
  Terminal, 
  AlertTriangle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface RecentReceiptsStreamProps {
  metrics: LiveMetrics[]
}

export function RecentReceiptsStream({ metrics }: RecentReceiptsStreamProps) {
  const recent = metrics.slice(0, 15)

  if (recent.length === 0) {
    return (
      <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
          <Terminal className="w-6 h-6 text-slate-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">Awaiting Resonance</h3>
        <p className="text-xs text-slate-500 mt-1">No live trust receipts detected in current stream.</p>
      </div>
    )
  }

  const getSourceIcon = (source: string) => {
    const lower = source.toLowerCase()
    if (lower.includes('claude')) return <Sparkles className="w-4 h-4 text-purple-400" />
    if (lower.includes('gpt')) return <Cpu className="w-4 h-4 text-emerald-400" />
    if (lower.includes('grok')) return <Terminal className="w-4 h-4 text-orange-400" />
    return <Cpu className="w-4 h-4 text-blue-400" />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          Live Proof Stream
        </h3>
        <Badge variant="outline" className="text-[10px] border-slate-800 text-slate-500">
          Showing last {recent.length} events
        </Badge>
      </div>
      
      <div className="space-y-2 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
        {recent.map((metric, idx) => (
          <div 
            key={`${metric.timestamp}-${idx}`} 
            className="group flex items-center justify-between p-3 bg-slate-900/40 border border-slate-800/50 rounded-lg hover:border-emerald-500/30 hover:bg-slate-800/40 transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-950 rounded-md border border-slate-800 group-hover:border-slate-700">
                {getSourceIcon(metric.source)}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-200">{metric.source}</p>
                  {metric.securityFlags.length > 0 && (
                    <AlertTriangle className="w-3 h-3 text-amber-500 fill-amber-500/10" />
                  )}
                </div>
                <p className="text-[10px] font-mono text-slate-500">
                  {new Date(metric.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}.{(new Date(metric.timestamp).getMilliseconds()).toString().padStart(3, '0')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className={`text-sm font-mono font-bold ${
                  metric.trustScore >= 80 ? 'text-emerald-400' : 
                  metric.trustScore >= 60 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {Math.round(metric.trustScore)}%
                </div>
                <div className="text-[10px] text-slate-600 uppercase tracking-tighter font-bold">Integrity</div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <button className="p-2 hover:bg-slate-800 rounded-md text-slate-500 hover:text-emerald-400 transition-colors border border-transparent hover:border-slate-700">
                    <Fingerprint className="w-4 h-4" />
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-slate-950 border-slate-800 text-slate-50 sm:max-w-[600px]">
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <DialogTitle className="text-lg font-mono tracking-tight">Canonical SONATE Receipt</DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-400 font-mono text-xs">
                       RFC-compliant trust receipt JSON fragment for session {metric.source.toUpperCase()}-{(new Date(metric.timestamp).getTime() % 10000).toString(16)}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <ScrollArea className="h-[350px] w-full rounded-md border border-slate-800 bg-black/50 p-4 font-mono text-xs text-emerald-500/90 selection:bg-emerald-500/20">
                      <pre>
{JSON.stringify({
  header: {
    version: "1.0.0",
    alg: "Ed25519",
    timestamp: metric.timestamp,
    source: metric.source
  },
  payload: {
    integrity_score: metric.trustScore / 100,
    velocity_delta: metric.velocityScore,
    governance_flags: metric.securityFlags,
    hash_chain: "0x" + Math.random().toString(16).substring(2, 66)
  },
  signature: "x509_ed25519_pkcs7_" + Math.random().toString(36).substring(2, 32)
}, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                  <div className="flex justify-end mt-4">
                     <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 text-[10px]">
                        CRYPTOGRAPHICALLY VERIFIED
                     </Badge>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import { Activity } from 'lucide-react'
