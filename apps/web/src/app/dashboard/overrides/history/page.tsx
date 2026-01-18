'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Calendar, User, CheckCircle, XCircle, Download } from 'lucide-react';
import { overridesAPI, OverrideHistoryItem } from '@/lib/api-overrides';

export default function OverridesHistoryPage() {
  const [filters, setFilters] = useState({
    decision: '',
    userId: '',
    search: '',
    startDate: '',
    endDate: '',
    emergency: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

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
    queryKey: ['overrides-history', tenant, currentPage, filters],
    queryFn: async () => {
      const apiFilters = {
        decision: filters.decision ? [filters.decision as 'approve' | 'reject'] : undefined,
        userId: filters.userId || undefined,
        search: filters.search || undefined,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        emergency: filters.emergency ? filters.emergency === 'true' : undefined
      };

      return overridesAPI.getOverrideHistory(apiFilters, {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      });
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      decision: '',
      userId: '',
      search: '',
      startDate: '',
      endDate: '',
      emergency: ''
    });
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const items = data?.data?.items || [];
    if (items.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['ID', 'Action Type', 'Target', 'Decision', 'Reason', 'Emergency', 'User', 'Created', 'Impact'];
    const rows = items.map(item => [
      item.id,
      item.actionType,
      item.actionTarget,
      item.decision,
      `"${item.reason.replace(/"/g, '""')}"`, // Escape quotes in CSV
      item.emergency ? 'Yes' : 'No',
      item.userId,
      new Date(item.createdAt).toLocaleString(),
      item.impact ? JSON.stringify(item.impact) : ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overrides-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getDecisionBadgeVariant = (decision: string) => {
    switch (decision) {
      case 'approve': return 'success';
      case 'reject': return 'destructive';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const items = data?.data?.items || [];
  const total = data?.data?.total || 0;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Overrides History</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => refetch()}>
            <Search className="mr-2 h-4 w-4" />
            Refresh
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search actions, targets, reasons..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-8"
                  aria-label="Search override history"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Decision</label>
              <Select value={filters.decision} onValueChange={(value) => handleFilterChange('decision', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All decisions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All decisions</SelectItem>
                  <SelectItem value="approve">Approved</SelectItem>
                  <SelectItem value="reject">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Emergency</label>
              <Select value={filters.emergency} onValueChange={(value) => handleFilterChange('emergency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="true">Emergency</SelectItem>
                  <SelectItem value="false">Normal</SelectItem>
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

      {/* Overrides History Table */}
      <Card>
        <CardHeader>
          <CardDescription>
            Showing {items.length} of {total} override decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8" role="status" aria-live="polite">
              Loading override history...
            </div>
          ) : items.length === 0 ? (
            <div className="flex justify-center py-8 text-muted-foreground" role="status" aria-live="polite">
              No override decisions found matching the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Action Type</TableHead>
                    <TableHead scope="col">Target</TableHead>
                    <TableHead scope="col">Decision</TableHead>
                    <TableHead scope="col">Reason</TableHead>
                    <TableHead scope="col">Emergency</TableHead>
                    <TableHead scope="col">User</TableHead>
                    <TableHead scope="col">Created</TableHead>
                    <TableHead scope="col">Impact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{item.actionType}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.actionTarget}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getDecisionBadgeVariant(item.decision)}>
                          {item.decision === 'approve' ? (
                            <><CheckCircle className="mr-1 h-3 w-3" />Approved</>
                          ) : (
                            <><XCircle className="mr-1 h-3 w-3" />Rejected</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={item.reason}>
                        {item.reason}
                      </TableCell>
                      <TableCell>
                        {item.emergency ? (
                          <Badge variant="destructive">Emergency</Badge>
                        ) : (
                          <Badge variant="secondary">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {item.userId}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {item.impact ? (
                          <span className="text-xs text-muted-foreground">
                            {JSON.stringify(item.impact).slice(0, 50)}...
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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