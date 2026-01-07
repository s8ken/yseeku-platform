'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { api } from '@/lib/api';
import { Shield, Activity, AlertCircle, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { Progress } from './ui/progress';
import { ConstitutionalPrinciples } from './ConstitutionalPrinciples';

export function Dashboard() {
  const tenant = typeof window !== 'undefined' ? localStorage.getItem('tenant') || 'default' : 'default';

  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ['kpis', tenant],
    queryFn: () => api.getKPIs(tenant),
  });

  const { data: alertData, isLoading: alertLoading } = useQuery({
    queryKey: ['alerts', tenant],
    queryFn: () => api.getAlerts(tenant),
  });

  const { data: trustAnalytics, isLoading: trustLoading } = useQuery({
    queryKey: ['trust-analytics'],
    queryFn: () => api.getTrustAnalytics(),
  });

  if (kpiLoading || alertLoading || trustLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const kpis = kpiData;
  const alerts = alertData;
  const trust = trustAnalytics?.data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SONATE Dashboard</h1>
            <p className="text-gray-500 dark:text-slate-400">SYMBI Trust Protocol v1.8.0 Monitoring</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-bold">
            <Shield size={16} />
            SYSTEM SECURE
          </div>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex justify-between">
                Overall Trust Score
                {trust?.analytics.trend && (
                  trust.analytics.trend[trust.analytics.trend.length - 1].score >= trust.analytics.trend[0].score ? 
                  <TrendingUp className="text-emerald-500 h-4 w-4" /> : 
                  <TrendingDown className="text-red-500 h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(trust?.analytics.overallScore || 0).toFixed(1)}/10</div>
              <Progress value={(trust?.analytics.overallScore || 0) * 10} className="h-1.5 mt-2" />
              <p className="text-xs text-gray-500 mt-2">Weighted constitutional average</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex justify-between">
                Compliance Rate
                <Shield className="text-emerald-500 h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(trust?.analytics.complianceRate || 0).toFixed(1)}%</div>
              <Progress value={trust?.analytics.complianceRate || 0} className="h-1.5 mt-2" />
              <p className="text-xs text-gray-500 mt-2">Principles pass rate</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex justify-between">
                Active Agents
                <Activity className="text-amber-500 h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpis?.activeAgents || 0}</div>
              <p className="text-xs text-gray-500 mt-2">Verified autonomous units</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex justify-between">
                Violations
                <AlertCircle className="text-red-500 h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Object.values(trust?.analytics.violationCounts || {}).reduce((a, b) => a + b, 0)}
              </div>
              <p className="text-xs text-gray-500 mt-2">Critical principle failures</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content: Principles */}
          <div className="lg:col-span-2 space-y-6">
            <ConstitutionalPrinciples principleScores={trust?.analytics.principleAverages} />
            
            <Card>
              <CardHeader>
                <CardTitle>Trust Trend (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full flex items-end gap-2 pb-4">
                  {trust?.analytics.trend.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-purple-500/20 hover:bg-purple-500/40 rounded-t transition-all duration-300 relative group"
                        style={{ height: `${day.score * 10}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.score.toFixed(1)}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 rotate-45 mt-2 origin-left whitespace-nowrap">
                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Alerts & Distribution */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trust Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(trust?.analytics.statusDistribution || {}).map(([status, count]) => (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{status}</span>
                      <span className="text-gray-500">{count} evaluations</span>
                    </div>
                    <Progress 
                      value={(count / (trust?.evaluationsCount || 1)) * 100} 
                      className={`h-2 ${
                        status === 'PASS' ? 'bg-emerald-500/20' : 
                        status === 'PARTIAL' ? 'bg-amber-500/20' : 'bg-red-500/20'
                      }`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">System Alerts</CardTitle>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">
                    {alerts?.summary.critical} CRITICAL
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts?.alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                        alert.severity === 'critical' ? 'bg-red-500' :
                        alert.severity === 'error' ? 'bg-orange-500' : 'bg-yellow-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{alert.title}</p>
                        <p className="text-[10px] text-gray-500 line-clamp-2">{alert.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}