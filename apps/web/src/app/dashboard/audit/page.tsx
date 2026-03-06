'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Calendar, User, FileText, Shield, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  outcome: string;
  details?: Record<string, any>;
}

interface AuditResponse {
  success: boolean;
  data: {
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
  };
}

export default function AuditTrailsPage() {
  const [filters, setFilters] = useState({
    severity: '',
    resourceType: '',
    userId: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const [tenant, setTenant] = useState('default');
  // Read tenant from localStorage on client only
  useEffect(() => {
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem('tenant') : null;
      setTenant(t || 'default');
    } catch {
      setTenant('default');
    }
  }, []);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', tenant, currentPage, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        tenant,
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      // Use the API client instead of raw fetch if possible, or keep fetch but handle auth
      // For now, we'll use the api helper which handles auth headers automatically
      const response = await api.getAuditLogs(params);
      return response;
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      severity: '',
      resourceType: '',
      userId: '',
      startDate: '',
      endDate: '',
      search: '',
    });
    setCurrentPage(1);
  };

  /**
   * Export audit logs as CSV
   */
  const exportAsCSV = async () => {
    try {
      const params = new URLSearchParams();
      
      // Add date filters if provided
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      // Get CSV from policy audit endpoint
      const response = await fetch(`/api/v2/audit/export/csv?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }
      
      // Create blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export audit logs as CSV');
    }
  };

  /**
   * Export audit logs as JSON
   */
  const exportAsJSON = async () => {
    try {
      const params = new URLSearchParams();
      
      // Add date filters if provided
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      // Get JSON from policy audit endpoint
      const response = await fetch(`/api/v2/audit/export/json?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to export JSON');
      }
      
      // Create blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export audit logs as JSON');
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'default';
    }
  };

  const logs = data?.data?.logs || [];
  const total = data?.data?.total || 0;

  const getVerificationMethod = (log: AuditLog) => {
    if (log.resourceType === 'trust-receipt' || log.action.includes('sign')) {
      return { label: 'Cryptographically Signed', variant: 'default' as const };
    }
    if (log.resourceType === 'policy' || log.resourceType === 'agent') {
      return { label: 'SONATE Chain', variant: 'secondary' as const };
    }
    return { label: 'System Verified', variant: 'outline' as const };
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Governance Audit Logs</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportAsJSON}>
            <FileText className="mr-2 h-4 w-4" />
            JSON
          </Button>
          <Button variant="outline" size="sm" onClick={exportAsCSV}>
            <FileText className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Logs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search actions, resources..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-8"
                  aria-label="Search audit logs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select value={filters.severity} onValueChange={(value) => handleFilterChange('severity', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severities</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Resource Type</label>
              <Select value={filters.resourceType} onValueChange={(value) => handleFilterChange('resourceType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="experiment">Experiment</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="trust-score">Trust Score</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">User ID</label>
              <Input
                placeholder="User ID"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="flex items-end space-x-2">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardDescription>
            Showing {logs.length} of {total} audit logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8" role="status" aria-live="polite">
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex justify-center py-8 text-muted-foreground" role="status" aria-live="polite">
              No audit logs found matching the current filters.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead scope="col" className="w-[180px] text-xs uppercase font-bold">Timestamp</TableHead>
                  <TableHead scope="col" className="text-xs uppercase font-bold">Identity</TableHead>
                  <TableHead scope="col" className="text-xs uppercase font-bold">Action</TableHead>
                  <TableHead scope="col" className="text-xs uppercase font-bold">Resource</TableHead>
                  <TableHead scope="col" className="text-xs uppercase font-bold">Verification</TableHead>
                  <TableHead scope="col" className="text-xs uppercase font-bold">Severity</TableHead>
                  <TableHead scope="col" className="text-xs uppercase font-bold">Outcome</TableHead>
                  <TableHead scope="col" className="text-xs uppercase font-bold">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: AuditLog) => {
                  const verification = getVerificationMethod(log);
                  return (
                    <TableRow key={log.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-[10px] py-2">
                        {new Date(log.timestamp).toLocaleString('en-GB', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1.5 text-xs">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[100px]">{log.userId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-xs py-2">{log.action}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                          {log.resourceType}:{log.resourceId.substring(0, 8)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant={verification.variant} className="text-[10px] px-1 py-0 h-4 whitespace-nowrap">
                          {verification.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant={getSeverityBadgeVariant(log.severity)} className="text-[10px] px-1 py-0 h-4 uppercase">
                          {log.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs py-2">{log.outcome}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-[10px] text-muted-foreground py-2 font-mono">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {Math.ceil(total / pageSize)}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              aria-label={`Go to previous page, currently on page ${currentPage}`}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= Math.ceil(total / pageSize)}
              aria-label={`Go to next page, currently on page ${currentPage}`}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
