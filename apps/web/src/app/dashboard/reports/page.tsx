'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  Clock, 
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { fetchAPI } from '@/lib/api/client';



type ReportType = 'SONATE' | 'GDPR' | 'SOC2' | 'ISO27001' | 'CUSTOM';
type ReportStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

interface ComplianceReport {
  id: string;
  type: ReportType;
  status: ReportStatus;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  summary: {
    overallScore: number;
    passedChecks: number;
    failedChecks: number;
    warnings: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  content?: string;
}

const reportTypeDescriptions: Record<ReportType, string> = {
  SONATE: 'SONATE Framework compliance - consent, inspection, validation, ethical override',
  GDPR: 'General Data Protection Regulation compliance assessment',
  SOC2: 'Service Organization Control 2 security and availability',
  ISO27001: 'Information Security Management System compliance',
  CUSTOM: 'Custom compliance report with selected criteria'
};

const riskLevelColors: Record<string, string> = {
  LOW: 'bg-green-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500'
};

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<ReportType>('SONATE');
  const [customCriteria, setCustomCriteria] = useState('');
  const [viewingReport, setViewingReport] = useState<ComplianceReport | null>(null);

  // Fetch all reports
  const { data: reports, isLoading } = useQuery<ComplianceReport[]>({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await fetch(`/api/reports`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      return data.reports || [];
    },
    refetchInterval: 10000 // Refresh every 10s to catch completed reports
  });

  // Generate report mutation
  const generateMutation = useMutation({
    mutationFn: async (params: { type: ReportType; criteria?: string }) => {
      const res = await fetch(`/api/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: params.type,
          periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          periodEnd: new Date().toISOString(),
          ...(params.criteria && { criteria: params.criteria })
        })
      });
      if (!res.ok) throw new Error('Failed to generate report');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setCustomCriteria('');
    }
  });

  // Delete report mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete report');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setViewingReport(null);
    }
  });

  // Download report
  const downloadReport = async (id: string, format: 'json' | 'csv') => {
    const res = await fetch(`/api/reports/${id}/download?format=${format}`);
    if (!res.ok) return;
    
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${id}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // View full report
  const viewReport = async (id: string) => {
    const res = await fetch(`/api/reports/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setViewingReport(data.report);
  };

  const handleGenerate = () => {
    generateMutation.mutate({
      type: selectedType,
      criteria: selectedType === 'CUSTOM' ? customCriteria : undefined
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compliance Reports</h1>
          <p className="text-muted-foreground">
            Generate and manage compliance reports for auditing
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {reports?.length || 0} Reports
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Generate Report Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Generate Report
            </CardTitle>
            <CardDescription>
              Create a new compliance report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SONATE">SONATE Framework</SelectItem>
                  <SelectItem value="GDPR">GDPR</SelectItem>
                  <SelectItem value="SOC2">SOC2</SelectItem>
                  <SelectItem value="ISO27001">ISO 27001</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {reportTypeDescriptions[selectedType]}
              </p>
            </div>

            {selectedType === 'CUSTOM' && (
              <div className="space-y-2">
                <Label>Custom Criteria</Label>
                <Textarea
                  placeholder="Enter custom compliance criteria..."
                  value={customCriteria}
                  onChange={(e) => setCustomCriteria(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Reports List / Viewer */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="list">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reports</CardTitle>
                <TabsList>
                  <TabsTrigger value="list">List</TabsTrigger>
                  <TabsTrigger value="view" disabled={!viewingReport}>View</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent>
              <TabsContent value="list" className="mt-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !reports?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No reports generated yet</p>
                    <p className="text-sm">Generate your first compliance report</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div 
                        key={report.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-10 rounded-full ${riskLevelColors[report.summary?.riskLevel || 'LOW']}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{report.type} Report</span>
                              <Badge variant={report.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                {report.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(report.generatedAt), 'MMM d, yyyy HH:mm')}
                              </span>
                              {report.summary && (
                                <>
                                  <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {report.summary.passedChecks} passed
                                  </span>
                                  {report.summary.failedChecks > 0 && (
                                    <span className="flex items-center gap-1 text-red-600">
                                      <AlertTriangle className="h-3 w-3" />
                                      {report.summary.failedChecks} failed
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {report.summary && (
                            <div className="text-right mr-4">
                              <div className="text-2xl font-bold">
                                {Math.round(report.summary.overallScore * 100)}%
                              </div>
                              <div className="text-xs text-muted-foreground">Score</div>
                            </div>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => viewReport(report.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => downloadReport(report.id, 'json')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteMutation.mutate(report.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="view" className="mt-0">
                {viewingReport && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{viewingReport.type} Compliance Report</h3>
                        <p className="text-sm text-muted-foreground">
                          Generated {format(new Date(viewingReport.generatedAt), 'MMMM d, yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => downloadReport(viewingReport.id, 'json')}>
                          <Download className="h-4 w-4 mr-2" />
                          JSON
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => downloadReport(viewingReport.id, 'csv')}>
                          <Download className="h-4 w-4 mr-2" />
                          CSV
                        </Button>
                      </div>
                    </div>

                    {/* Summary Cards */}
                    {viewingReport.summary && (
                      <div className="grid grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-center">
                              {Math.round(viewingReport.summary.overallScore * 100)}%
                            </div>
                            <div className="text-xs text-muted-foreground text-center">Overall Score</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-center text-green-600">
                              {viewingReport.summary.passedChecks}
                            </div>
                            <div className="text-xs text-muted-foreground text-center">Passed</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-center text-red-600">
                              {viewingReport.summary.failedChecks}
                            </div>
                            <div className="text-xs text-muted-foreground text-center">Failed</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <Badge className={`${riskLevelColors[viewingReport.summary.riskLevel]} mx-auto block w-fit`}>
                              {viewingReport.summary.riskLevel}
                            </Badge>
                            <div className="text-xs text-muted-foreground text-center mt-1">Risk Level</div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Report Content */}
                    {viewingReport.content && (
                      <Card>
                        <CardContent className="pt-4">
                          <pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-4 rounded-lg overflow-auto max-h-[400px]">
                            {viewingReport.content}
                          </pre>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Interaction Insights - Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Interaction Insights
          </CardTitle>
          <CardDescription>
            Quick access to AI interactions filtered by trust status for compliance review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a href="/dashboard/interactions?status=FAIL" className="block">
              <Card className="border-red-200 bg-red-50/50 dark:bg-red-900/10 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-red-600">—</p>
                      <p className="text-sm text-muted-foreground">Failed Interactions</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500/50" />
                  </div>
                  <p className="text-xs text-red-600 mt-2">Requires immediate review</p>
                </CardContent>
              </Card>
            </a>
            <a href="/dashboard/interactions?status=PARTIAL" className="block">
              <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-amber-600">—</p>
                      <p className="text-sm text-muted-foreground">Partial Compliance</p>
                    </div>
                    <Clock className="h-8 w-8 text-amber-500/50" />
                  </div>
                  <p className="text-xs text-amber-600 mt-2">May need attention</p>
                </CardContent>
              </Card>
            </a>
            <a href="/dashboard/interactions?status=PASS" className="block">
              <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">—</p>
                      <p className="text-sm text-muted-foreground">Fully Compliant</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
                  </div>
                  <p className="text-xs text-emerald-600 mt-2">Meeting all requirements</p>
                </CardContent>
              </Card>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Report Type Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              SONATE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Evaluates AI trustworthiness: consent mechanisms, inspection capabilities, 
              continuous validation, ethical overrides, and moral recognition.
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-600" />
              GDPR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Data protection assessment covering consent, data minimization, 
              right to access, right to erasure, and data portability.
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              SOC2
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Security and availability controls: access management, 
              change management, risk mitigation, and monitoring.
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-600" />
              ISO 27001
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Information security management: risk assessment, 
              security policies, incident management, and business continuity.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
