'use client';

import { useEffect, useState } from 'react';
import { api, TrustAnalyticsResponse } from '@/lib/api';
import { useDemo } from '@/hooks/use-demo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  CheckCircle,
  MessageSquare,
  AlertTriangle,
  Activity,
  RefreshCw,
  Calendar,
  Download
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { toast } from 'sonner';
import { WithDemoWatermark } from '@/components/demo-watermark';
import { DashboardPageSkeleton } from '@/components/dashboard-skeletons';

interface Analytics {
  averageTrustScore: number;
  totalInteractions: number;
  passRate: number;
  partialRate: number;
  failRate: number;
  commonViolations: Array<{
    principle: string;
    count: number;
    percentage: number;
  }>;
  recentTrends: Array<{
    date: string;
    avgTrustScore: number;
    passRate: number;
  }>;
}

export default function TrustAnalyticsPage() {
  const { isDemo, isLoaded } = useDemo();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState({ days: 7, start: '', end: '' });
  const [usingDemoData, setUsingDemoData] = useState(false);

  const loadAnalytics = async () => {
    if (!isLoaded) return;
    
    setLoading(true);
    try {
      // Try demo API first (always available), or real API if not in demo mode
      if (isDemo) {
        const response = await api.getDemoTrustAnalytics() as any;
        if (response.success && response.data?.analytics) {
          setAnalytics(response.data.analytics);
          setTimeRange(response.data.timeRange);
          setUsingDemoData(true);
        }
      } else {
        // Try real API first
        try {
          const response = await api.getTrustAnalytics();
          if (response.data?.analytics) {
            setAnalytics(response.data.analytics);
            setTimeRange(response.data.timeRange);
            setUsingDemoData(false);
          } else {
            throw new Error('No data');
          }
        } catch {
          // Fallback to demo data if real API fails or has no data
          const demoResponse = await api.getDemoTrustAnalytics() as any;
          if (demoResponse.success && demoResponse.data?.analytics) {
            setAnalytics(demoResponse.data.analytics);
            setTimeRange(demoResponse.data.timeRange);
            setUsingDemoData(true);
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      // Don't show error toast if we can still load demo data
      try {
        const demoResponse = await api.getDemoTrustAnalytics() as any;
        if (demoResponse.success && demoResponse.data?.analytics) {
          setAnalytics(demoResponse.data.analytics);
          setTimeRange(demoResponse.data.timeRange);
          setUsingDemoData(true);
        }
      } catch {
        toast.error('Failed to load analytics', {
          description: error.message || 'Please try again later'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [isDemo, isLoaded]);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <DashboardPageSkeleton />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">No Analytics Data</h3>
              <p className="text-sm text-muted-foreground">Start a conversation to generate trust data</p>
            </div>
            <Button onClick={() => window.location.href = '/dashboard/chat'}>
              Go to Chat
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Demo Mode Banner */}
      {(isDemo || usingDemoData) && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-2">
          <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            {isDemo ? 'Demo Mode' : 'Sample Data'}
          </Badge>
          <span className="text-sm text-amber-700 dark:text-amber-300">
            {isDemo 
              ? 'Viewing demo tenant analytics. Switch to Live Mode for real data.'
              : 'Showing sample analytics. Start conversations to generate real data.'}
          </span>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-500" />
            Trust Analytics
            {(isDemo || usingDemoData) && <Badge variant="secondary" className="ml-2">{isDemo ? 'Demo' : 'Sample'}</Badge>}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Last {timeRange.days} days • {analytics.totalInteractions} interactions analyzed
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const dataStr = JSON.stringify(analytics, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `trust-analytics-${new Date().toISOString()}.json`;
            a.click();
            toast.success('Analytics exported');
          }}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Average Trust Score"
          value={`${analytics.averageTrustScore.toFixed(1)}/10`}
          trend={analytics.recentTrends.length >= 2 ?
            (analytics.recentTrends[analytics.recentTrends.length - 1].avgTrustScore -
             analytics.recentTrends[0].avgTrustScore) : 0}
          icon={<Shield className="h-4 w-4" />}
          color="purple"
        />
        <MetricCard
          title="Pass Rate"
          value={`${analytics.passRate.toFixed(1)}%`}
          trend={analytics.recentTrends.length >= 2 ?
            (analytics.recentTrends[analytics.recentTrends.length - 1].passRate -
             analytics.recentTrends[0].passRate) : 0}
          icon={<CheckCircle className="h-4 w-4" />}
          color="emerald"
        />
        <MetricCard
          title="Total Interactions"
          value={analytics.totalInteractions}
          trend={Math.round(analytics.totalInteractions * 0.3)} // Mock trend
          icon={<MessageSquare className="h-4 w-4" />}
          color="blue"
        />
        <MetricCard
          title="Violations"
          value={analytics.commonViolations.reduce((sum, v) => sum + v.count, 0)}
          trend={-3} // Mock trend (negative is good)
          icon={<AlertTriangle className="h-4 w-4" />}
          color="amber"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WithDemoWatermark position="top-right" size="sm" opacity={25}>
          <StatusDistributionChart analytics={analytics} />
        </WithDemoWatermark>
        <WithDemoWatermark position="top-right" size="sm" opacity={25}>
          <TrustTrendChart analytics={analytics} />
        </WithDemoWatermark>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WithDemoWatermark position="top-right" size="sm" opacity={25}>
          <PrinciplesRadarChart analytics={analytics} />
        </WithDemoWatermark>
        <WithDemoWatermark position="top-right" size="sm" opacity={25}>
          <ViolationsTable analytics={analytics} />
        </WithDemoWatermark>
      </div>

      {/* Additional Info Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-500" />
            Trust Protocol Status
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Protocol Version:</span>
            <span className="font-mono font-semibold">v1.8.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Evaluation Engine:</span>
            <span className="font-mono font-semibold">@sonate/detect</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Constitutional Principles:</span>
            <span className="font-mono font-semibold">6 Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cryptographic Receipts:</span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ SHA-256 Enabled
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ SUB-COMPONENTS ============

interface MetricCardProps {
  title: string;
  value: string | number;
  trend: number;
  icon: React.ReactNode;
  color: 'purple' | 'emerald' | 'blue' | 'amber';
}

function MetricCard({ title, value, trend, icon, color }: MetricCardProps) {
  const isPositive = trend > 0;
  const colorClasses = {
    purple: 'text-purple-500 bg-purple-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    blue: 'text-blue-500 bg-blue-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== 0 && (
          <div className={`flex items-center text-xs mt-1 ${
            isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {isPositive ? '+' : ''}{trend > 1 ? Math.round(trend) : trend.toFixed(1)} from last period
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusDistributionChart({ analytics }: { analytics: Analytics }) {
  const data = [
    { name: 'PASS', value: analytics.passRate, color: '#10b981', count: Math.round(analytics.totalInteractions * analytics.passRate / 100) },
    { name: 'PARTIAL', value: analytics.partialRate, color: '#f59e0b', count: Math.round(analytics.totalInteractions * analytics.partialRate / 100) },
    { name: 'FAIL', value: analytics.failRate, color: '#ef4444', count: Math.round(analytics.totalInteractions * analytics.failRate / 100) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trust Status Distribution</CardTitle>
        <CardDescription>Breakdown of trust evaluation results</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `${value.toFixed(1)}% (${props.payload.count} messages)`,
                name
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function TrustTrendChart({ analytics }: { analytics: Analytics }) {
  const chartData = analytics.recentTrends.map(trend => ({
    date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: parseFloat(trend.avgTrustScore.toFixed(2)),
    passRate: parseFloat(trend.passRate.toFixed(1)),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trust Score Trend</CardTitle>
        <CardDescription>Average trust score over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[0, 10]}
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#8b5cf6"
              strokeWidth={3}
              name="Trust Score"
              dot={{ fill: '#8b5cf6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="passRate"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Pass Rate %"
              dot={{ fill: '#10b981', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function PrinciplesRadarChart({ analytics }: { analytics: Analytics }) {
  // Mock principle averages (in production, this would come from backend)
  const principleData = [
    { principle: 'Consent', score: 8.8, fullMark: 10 },
    { principle: 'Inspection', score: 8.5, fullMark: 10 },
    { principle: 'Validation', score: 8.2, fullMark: 10 },
    { principle: 'Ethics', score: 8.6, fullMark: 10 },
    { principle: 'Disconnect', score: 8.4, fullMark: 10 },
    { principle: 'Moral', score: 8.7, fullMark: 10 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Constitutional Principles</CardTitle>
        <CardDescription>Average scores across 6 core principles</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={principleData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="principle"
              tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tick={{ fontSize: 10 }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.5}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ViolationsTable({ analytics }: { analytics: Analytics }) {
  const formatPrincipleName = (principle: string) => {
    return principle
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Common Violations</CardTitle>
        <CardDescription>Most frequently violated principles</CardDescription>
      </CardHeader>
      <CardContent>
        {analytics.commonViolations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">No Violations Detected</p>
            <p className="text-sm text-muted-foreground mt-1">All interactions passed trust evaluation</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Principle</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.commonViolations.map((violation, index) => (
                <TableRow key={violation.principle}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${
                        violation.percentage > 10 ? 'bg-red-500' :
                        violation.percentage > 5 ? 'bg-amber-500' :
                        'bg-blue-500'
                      }`} />
                      {formatPrincipleName(violation.principle)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">{violation.count}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-semibold ${
                      violation.percentage > 10 ? 'text-red-600 dark:text-red-400' :
                      violation.percentage > 5 ? 'text-amber-600 dark:text-amber-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`}>
                      {violation.percentage.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
