'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, Calendar, User, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { overridesAPI, OverrideQueueItem } from '@/lib/api-overrides';

export default function OverridesQueuePage() {
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showBulkActions, setShowBulkActions] = useState(false);
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
    queryKey: ['overrides-queue', tenant, currentPage, filters],
    queryFn: async () => {
      const apiFilters = {
        status: filters.status ? [filters.status] : undefined,
        type: filters.type ? [filters.type] : undefined,
        search: filters.search || undefined,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined
      };

      return overridesAPI.getOverrideQueue(apiFilters, {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      });
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
    setSelectedItems(new Set()); // Clear selection when filters change
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      type: '',
      search: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
    setSelectedItems(new Set());
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && data?.data?.items) {
      const allIds = new Set<string>(data.data.items.map((item: OverrideQueueItem) => item.id));
      setSelectedItems(allIds);
      setShowBulkActions(true);
    } else {
      setSelectedItems(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedItems.size === 0) return;
    
    const reason = prompt('Enter justification for bulk approval:');
    if (!reason || reason.trim().length < 3) {
      alert('Justification must be at least 3 characters');
      return;
    }

    try {
      await overridesAPI.processBulkOverrides({
        actionIds: Array.from(selectedItems),
        decision: 'approve',
        reason: reason.trim()
      });
      
      setSelectedItems(new Set());
      setShowBulkActions(false);
      refetch();
      alert('Bulk approval completed successfully');
    } catch (error: any) {
      alert(`Bulk approval failed: ${error.message}`);
    }
  };

  const handleBulkReject = async () => {
    if (selectedItems.size === 0) return;
    
    const reason = prompt('Enter justification for bulk rejection:');
    if (!reason || reason.trim().length < 3) {
      alert('Justification must be at least 3 characters');
      return;
    }

    try {
      await overridesAPI.processBulkOverrides({
        actionIds: Array.from(selectedItems),
        decision: 'reject',
        reason: reason.trim()
      });
      
      setSelectedItems(new Set());
      setShowBulkActions(false);
      refetch();
      alert('Bulk rejection completed successfully');
    } catch (error: any) {
      alert(`Bulk rejection failed: ${error.message}`);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'executed': return 'success';
      case 'failed': return 'destructive';
      case 'overridden': return 'outline';
      default: return 'default';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
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
        <h2 className="text-3xl font-bold tracking-tight">Overrides Queue</h2>
        <div className="flex items-center space-x-2">
          {showBulkActions && (
            <>
              <Button variant="outline" size="sm" onClick={handleBulkApprove}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Selected ({selectedItems.size})
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkReject}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Selected ({selectedItems.size})
              </Button>
            </>
          )}
          <Button onClick={() => refetch()}>
            <AlertTriangle className="mr-2 h-4 w-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search actions, targets..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-8"
                  aria-label="Search overrides"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="executed">Executed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="overridden">Overridden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action Type</label>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="adjust_threshold">Adjust Threshold</SelectItem>
                  <SelectItem value="ban_agent">Ban Agent</SelectItem>
                  <SelectItem value="restrict_agent">Restrict Agent</SelectItem>
                  <SelectItem value="quarantine_agent">Quarantine Agent</SelectItem>
                  <SelectItem value="unban_agent">Unban Agent</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <Card className="bg-muted">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedItems.size} items selected
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedItems(new Set())}>
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overrides Queue Table */}
      <Card>
        <CardHeader>
          <CardDescription>
            Showing {items.length} of {total} override requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8" role="status" aria-live="polite">
              Loading override queue...
            </div>
          ) : items.length === 0 ? (
            <div className="flex justify-center py-8 text-muted-foreground" role="status" aria-live="polite">
              No override requests found matching the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col" className="w-12">
                      <Checkbox
                        checked={selectedItems.size === items.length && items.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all items"
                      />
                    </TableHead>
                    <TableHead scope="col">Action</TableHead>
                    <TableHead scope="col">Target</TableHead>
                    <TableHead scope="col">Severity</TableHead>
                    <TableHead scope="col">Status</TableHead>
                    <TableHead scope="col">Requested By</TableHead>
                    <TableHead scope="col">Created</TableHead>
                    <TableHead scope="col">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: OverrideQueueItem) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                          aria-label={`Select item ${item.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{item.type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.target}
                      </TableCell>
                      <TableCell>
                        {item.severity && (
                          <Badge variant={getSeverityBadgeVariant(item.severity)}>
                            {item.severity}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {item.requestedBy || 'system'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell>
                        {item.canOverride && (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const reason = prompt(`Enter justification for approving ${item.type} on ${item.target}:`);
                                if (reason && reason.trim().length >= 3) {
                                  overridesAPI.processOverride({
                                    actionId: item.id,
                                    decision: 'approve',
                                    reason: reason.trim()
                                  }).then(() => {
                                    refetch();
                                  }).catch((error: any) => {
                                    alert(`Approval failed: ${error.message}`);
                                  });
                                } else if (reason) {
                                  alert('Justification must be at least 3 characters');
                                }
                              }}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const reason = prompt(`Enter justification for rejecting ${item.type} on ${item.target}:`);
                                if (reason && reason.trim().length >= 3) {
                                  overridesAPI.processOverride({
                                    actionId: item.id,
                                    decision: 'reject',
                                    reason: reason.trim()
                                  }).then(() => {
                                    refetch();
                                  }).catch((error: any) => {
                                    alert(`Rejection failed: ${error.message}`);
                                  });
                                } else if (reason) {
                                  alert('Justification must be at least 3 characters');
                                }
                              }}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                              Reject
                            </Button>
                          </div>
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