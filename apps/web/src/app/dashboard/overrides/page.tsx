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
import { Search, Filter, Calendar, User, AlertTriangle, CheckCircle, XCircle, Zap } from 'lucide-react';
import { overridesAPI, OverrideQueueItem } from '@/lib/api-overrides';

type PageTab = 'queue' | 'breakthrough';

export default function OverridesQueuePage() {
  const [activeTab, setActiveTab] = useState<PageTab>('queue');
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
      const allIds = new Set(data.data.items.map(item => item.id));
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

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'executed': return 'secondary';
      case 'failed': return 'destructive';
      case 'overridden': return 'outline';
      default: return 'default';
    }
  };

  const getSeverityBadgeVariant = (severity: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'outline';
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

  // BREAKTHROUGH review tab — query for breakthrough_review alerts
  const { data: btData, isLoading: btLoading, refetch: btRefetch } = useQuery({
    queryKey: ['breakthrough-alerts', tenant],
    queryFn: () => overridesAPI.getOverrideQueue(
      { search: 'breakthrough_review' },
      { limit: 50, offset: 0 }
    ),
    enabled: activeTab === 'breakthrough',
  });
  const btItems = (btData?.data?.items || []).filter(item => item.target === 'breakthrough_review');

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

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'queue'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Override Queue
          </button>
          <button
            onClick={() => setActiveTab('breakthrough')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'breakthrough'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Zap className="h-4 w-4" />
            BREAKTHROUGH Review
            {btItems.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400">
                {btItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* BREAKTHROUGH Review Tab */}
      {activeTab === 'breakthrough' && (
        <div className="space-y-4">
          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-5 w-5 text-purple-400" />
                BREAKTHROUGH Human Review Queue
              </CardTitle>
              <CardDescription>
                Overseer has flagged these sessions as peak-intensity interactions requiring direction classification.
                The detector scores intensity — human review scores whether the breakthrough was productive or regressive.
              </CardDescription>
            </CardHeader>
          </Card>

          {btLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading BREAKTHROUGH alerts...</div>
          ) : btItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="h-10 w-10 text-purple-400/40 mx-auto mb-3" />
                <p className="font-medium text-muted-foreground">No BREAKTHROUGH events awaiting review</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Overseer alerts appear here when high-intensity interactions are detected.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {btItems.map((item) => (
                  <Card key={item.id} className="border-l-4 border-l-purple-500">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              <Zap className="h-2.5 w-2.5" />
                              BREAKTHROUGH
                            </span>
                            <Badge variant="outline" className="text-[10px]">{item.status}</Badge>
                            <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{item.reason}</p>
                          <p className="text-xs text-muted-foreground/70">
                            Go to <strong>Trust Receipts</strong> and click the purple BREAKTHROUGH card to classify individual receipts.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <a href="/dashboard/receipts">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-xs whitespace-nowrap"
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              Review Receipts
                            </Button>
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Override Queue Tab */}
      {activeTab !== 'breakthrough' && (
      <>

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
              <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
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
              <Select value={filters.type || 'all'} onValueChange={(value) => handleFilterChange('type', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
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
                  {items.map((item) => (
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
      </>
      )}
    </div>
  );
}