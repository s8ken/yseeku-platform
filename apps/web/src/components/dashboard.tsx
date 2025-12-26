'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface KPIData {
  tenant: string;
  timestamp: string;
  trustScore: number;
  principleScores: Record<string, number>;
  totalInteractions: number;
  activeAgents: number;
  complianceRate: number;
  riskScore: number;
  alertsCount: number;
  experimentsRunning: number;
  orchestratorsActive: number;
}

interface AlertData {
  tenant: string;
  summary: {
    critical: number;
    error: number;
    warning: number;
    total: number;
  };
  alerts: Array<{
    id: string;
    timestamp: string;
    type: string;
    title: string;
    description: string;
    severity: string;
    details?: Record<string, any>;
  }>;
}

interface ExperimentData {
  tenant: string;
  experiments: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    results: {
      variants: Array<{
        variantName: string;
        averageScore: number;
      }>;
      statisticalAnalysis: {
        significantDifference: boolean;
        effectSize: number;
        confidenceInterval: [number, number];
        pValue: number;
      };
    };
  }>;
  summary: {
    total: number;
    running: number;
    completed: number;
  };
}

export function Dashboard() {
  const tenant = localStorage.getItem('tenant') || 'default';

  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ['kpis', tenant],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/kpis?tenant=${tenant}`);
      if (!response.ok) throw new Error('Failed to fetch KPIs');
      return response.json() as Promise<{ success: boolean; data: KPIData }>;
    },
  });

  const { data: alertData, isLoading: alertLoading } = useQuery({
    queryKey: ['alerts', tenant],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/alerts?tenant=${tenant}`);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json() as Promise<{ success: boolean; data: AlertData }>;
    },
  });

  const { data: experimentData, isLoading: experimentLoading } = useQuery({
    queryKey: ['experiments', tenant],
    queryFn: async () => {
      const response = await fetch(`/api/lab/experiments?tenant=${tenant}`);
      if (!response.ok) throw new Error('Failed to fetch experiments');
      return response.json() as Promise<{ success: boolean; data: ExperimentData }>;
    },
  });

  if (kpiLoading || alertLoading || experimentLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  const kpis = kpiData?.data;
  const alerts = alertData?.data;
  const experiments = experimentData?.data;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">SONATE Dashboard</h1>

        {/* KPIs Section */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Trust Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.trustScore}/100</div>
                <p className="text-xs text-gray-600">Overall trust score</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.activeAgents}</div>
                <p className="text-xs text-gray-600">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.complianceRate}%</div>
                <p className="text-xs text-gray-600">EU AI Act compliance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Experiments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.experimentsRunning}</div>
                <p className="text-xs text-gray-600">Currently running</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts Section */}
          {alerts && (
            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>
                  Critical: {alerts.summary.critical}, Error: {alerts.summary.error}, Warning: {alerts.summary.warning}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        alert.severity === 'critical' ? 'bg-red-500' :
                        alert.severity === 'error' ? 'bg-orange-500' : 'bg-yellow-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-gray-600">{alert.description}</p>
                        <p className="text-xs text-gray-400">{new Date(alert.timestamp).toLocaleString('en-US')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Experiments Section */}
          {experiments && (
            <Card>
              <CardHeader>
                <CardTitle>Active Experiments</CardTitle>
                <CardDescription>
                  Total: {experiments.summary.total}, Running: {experiments.summary.running}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {experiments.experiments.slice(0, 3).map((experiment) => (
                    <div key={experiment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{experiment.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded ${
                          experiment.status === 'running' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {experiment.status}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${experiment.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        Progress: {experiment.progress}% | Variants: {experiment.results.variants.length}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}