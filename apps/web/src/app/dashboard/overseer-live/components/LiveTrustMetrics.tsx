/**
 * LiveTrustMetrics Component
 * 
 * High-density visualization of the real-time trust landscape.
 */

'use client'

import { LiveMetrics } from '@/lib/services/overseer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  ShieldAlert, 
  TrendingUp,
  Cpu
} from 'lucide-react'

interface LiveTrustMetricsProps {
  metrics: LiveMetrics[]
}

export function LiveTrustMetrics({ metrics }: LiveTrustMetricsProps) {
  if (metrics.length === 0) {
    return (
      <div className="h-full bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
        <Activity className="w-8 h-8 text-slate-700 animate-pulse" />
        <p className="text-sm font-medium text-slate-500">Listening to SONATE Protocol Resonance...</p>
      </div>
    )
  }

  const avgTrust = metrics.reduce((sum, m) => sum + m.trustScore, 0) / metrics.length
  const lowTrustCount = metrics.filter(m => m.trustScore < 60).length
  const flaggedCount = metrics.filter(m => m.securityFlags.length > 0).length
  
  // Calculate source distribution for high-density visual
  const sourceStats = metrics.reduce((acc, m) => {
    acc[m.source] = (acc[m.source] ; 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex flex-col gap-6 h-full">
      <Card className="bg-slate-900 border-slate-800 flex-grow shadow-2xl shadow-emerald-500/5">
        <CardHeader className="pb-4 border-b border-slate-800/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Live Integrity Pulse
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-tighter font-bold">Resonating</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* High Density Metric Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg group hover:border-emerald-500/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] uppercase font-bold text-slate-500">Global Avg</span>
              </div>
              <div className="text-2xl font-mono text-emerald-400">{Math.round(avgTrust)}%</div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg group hover:border-amber-500/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] uppercase font-bold text-slate-500">Alert Latency</span>
              </div>
              <div className="text-2xl font-mono text-amber-500">{flaggedCount}</div>
            </div>
          </div>

          {/* Model Resonance Bar Chart (Pseudo-Chart) */}
          <div className="space-y-3">
             <div className="flex items-center justify-between">
               <span className="text-[10px] uppercase font-bold text-slate-500">Source Distribution</span>
               <span className="text-[10px] font-mono text-slate-400 capitalize">{Object.keys(sourceStats).length} agents connected</span>
             </div>
             <div className="space-y-2">
                {Object.entries(sourceStats).map(([name, count]) => {
                   const percentage = (count / metrics.length) * 100
                   return (
                     <div key={name} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono mb-1">
                           <span className="text-slate-300">{name}</span>
                           <span className="text-slate-500">{count} receipts</span>
                        </div>
                        <div className="h-1 w-full bg-slate-850 rounded-full flex overflow-hidden border border-slate-800/30">
                           <div 
                             className="h-full bg-emerald-600/60 rounded-full" 
                             style={{ width: `${percentage}%` }} 
                           />
                        </div>
                     </div>
                   )
                })}
             </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
               <span>SONATE COMPLIANCE</span>
               <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-500">NOMINAL</Badge>
            </div>
            
            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-md">
               <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Protocol Violation Detected</p>
                    <p className="text-[10px] text-amber-500/80 mt-0.5">
                       {lowTrustCount} session(s) failing principle Inspection. Verify cryptographic receipts immediately.
                    </p>
                  </div>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Mini Activity Monitor */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
         <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-emerald-500" />
         </div>
         <div className="flex-1">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Engine Status</p>
            <p className="text-xs text-slate-300 font-mono">Live Resonance Active (UTC)</p>
         </div>
         <div className="flex flex-col items-end">
            <div className="text-[10px] font-mono text-slate-500">{metrics.length} TPS</div>
            <div className="text-[8px] uppercase tracking-tighter text-emerald-500/50">Optimal</div>
         </div>
      </div>
    </div>
  )
}
