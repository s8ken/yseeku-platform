'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Building2,
  Plus,
  Users,
  Settings,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  FileX
} from 'lucide-react';
import { api } from '@/lib/api';
import { useDemo } from '@/hooks/use-demo';

interface Tenant {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  userCount: number;
  complianceStatus: 'compliant' | 'warning' | 'non-compliant';
  trustScore: number;
  lastActivity: string;
}

interface TenantResponse {
  success: boolean;
  data: {
    tenants: Tenant[];
    total: number;
    page: number;
    limit: number;
  };
}

// Empty state component
function EmptyState() {
  return (
    <Card className="p-12 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <FileX className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">No Tenants Configured</h3>
          <p className="text-muted-foreground max-w-md mx-auto mt-2">
            Create your first tenant to start managing multi-tenant configurations
            for your AI governance platform.
          </p>
        </div>
      </div>
    </Card>
  );
}

export default function TenantManagementPage() {
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: '',
    description: '',
  });

  const queryClient = useQueryClient();
  const { isDemo, isLoaded } = useDemo();

  // Fetch real tenants from API
  const { data, isLoading: isLoadingReal } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await fetch('/api/tenants');
      if (!response.ok) throw new Error('Failed to fetch tenants');
      return response.json() as Promise<TenantResponse>;
    },
    enabled: !isDemo && isLoaded,
  });

  // Fetch demo tenants when in demo mode
  const { data: demoData, isLoading: isLoadingDemo } = useQuery({
    queryKey: ['demo-tenants'],
    queryFn: () => api.getDemoTenants(),
    staleTime: 60000,
    enabled: isDemo && isLoaded,
  });

  const isLoading = !isLoaded || (isDemo ? isLoadingDemo : isLoadingReal);

  const createTenantMutation = useMutation({
    mutationFn: async (tenantData: { name: string; description: string }) => {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenantData),
      });
      if (!response.ok) throw new Error('Failed to create tenant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setIsCreateDialogOpen(false);
      setNewTenant({ name: '', description: '' });
    },
  });

  const updateTenantMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Tenant> }) => {
      const response = await fetch(`/api/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update tenant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });

  const deleteTenantMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tenants/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete tenant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive': return <Badge variant="secondary">Inactive</Badge>;
      case 'suspended': return <Badge variant="destructive">Suspended</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'non-compliant': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleCreateTenant = () => {
    createTenantMutation.mutate(newTenant);
  };

  const handleUpdateTenant = (id: string, updates: Partial<Tenant>) => {
    updateTenantMutation.mutate({ id, updates });
  };

  const handleDeleteTenant = (id: string) => {
    if (confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      deleteTenantMutation.mutate(id);
    }
  };

  // Map demo tenants to match Tenant interface
  const demoTenants: Tenant[] = ((demoData as any)?.data || []).map((t: any) => ({
    id: t._id || t.id,
    name: t.name,
    description: t.description || '',
    status: t.status || 'active',
    createdAt: t.createdAt || new Date().toISOString(),
    userCount: t.userCount || 0,
    complianceStatus: t.complianceStatus || 'compliant',
    trustScore: t.trustScore || 80,
    lastActivity: t.lastActivity || new Date().toISOString()
  }));

  // Use demo tenants when in demo mode, real tenants otherwise
  const tenants = isDemo ? demoTenants : (data?.data?.tenants || []);
  const dataSource = isDemo ? 'demo' : 'live';

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      {isDemo && (
        <div className="demo-notice mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-800 dark:text-amber-200">Demo Mode</strong>
            <p className="text-sm text-amber-700 dark:text-amber-300">Showing sample tenants for demonstration. Create your own tenants for production use.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between space-y-2">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Tenant Management</h2>
            <span className={`data-source-badge px-2 py-1 text-xs rounded-full ${
              dataSource === 'live'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {dataSource === 'live' ? 'Live Data' : 'Demo Data'}
            </span>
          </div>
          <p className="text-muted-foreground">
            Manage multi-tenant configurations and settings
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>
                Add a new tenant to the SONATE platform.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenantName">Tenant Name</Label>
                <Input
                  id="tenantName"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter tenant name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenantDescription">Description</Label>
                <Textarea
                  id="tenantDescription"
                  value={newTenant.description}
                  onChange={(e) => setNewTenant(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter tenant description"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTenant}
                disabled={!newTenant.name || createTenantMutation.isPending}
              >
                {createTenantMutation.isPending ? 'Creating...' : 'Create Tenant'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
            <p className="text-xs text-muted-foreground">Active configurations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.filter(t => t.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.reduce((sum, t) => sum + t.userCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Trust Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(tenants.reduce((sum, t) => sum + t.trustScore, 0) / tenants.length)}
            </div>
            <p className="text-xs text-muted-foreground">Overall compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tenants</CardTitle>
          <CardDescription>
            Manage tenant configurations and monitor compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">Loading tenants...</div>
          ) : tenants.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Trust Score</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {tenant.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell>{tenant.userCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tenant.trustScore}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${tenant.trustScore}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getComplianceIcon(tenant.complianceStatus)}
                        <span className="capitalize">{tenant.complianceStatus}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm" suppressHydrationWarning>
                      {new Date(tenant.lastActivity).toLocaleDateString('en-US')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTenant(tenant.id)}
                          disabled={deleteTenantMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}