'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, Users, Shield, Database, Key } from 'lucide-react';

interface TenantSettings {
  name: string;
  description: string;
  contactEmail: string;
  complianceLevel: 'basic' | 'standard' | 'enterprise';
  trustScoreThreshold: number;
  auditRetentionDays: number;
  enableAutoCompliance: boolean;
  enableRiskAlerts: boolean;
  maxConcurrentAgents: number;
  dataRetentionPolicy: '30days' | '90days' | '1year' | 'unlimited';
  apiRateLimit: number;
}

const defaultSettings: TenantSettings = {
  name: 'Default Tenant',
  description: 'Default tenant configuration',
  contactEmail: 'admin@default.com',
  complianceLevel: 'standard',
  trustScoreThreshold: 80,
  auditRetentionDays: 365,
  enableAutoCompliance: true,
  enableRiskAlerts: true,
  maxConcurrentAgents: 10,
  dataRetentionPolicy: '90days',
  apiRateLimit: 1000,
};

export default function TenantSettingsPage() {
  const [settings, setSettings] = useState<TenantSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  const queryClient = useQueryClient();

  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: async () => {
      // Mock API call - replace with actual endpoint
      return { success: true, data: defaultSettings };
    },
    onSuccess: (data) => {
      setSettings(data.data);
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: TenantSettings) => {
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, data: newSettings };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      setHasChanges(false);
    },
  });

  const handleSettingChange = (key: keyof TenantSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  const handleReset = () => {
    if (currentSettings) {
      setSettings(currentSettings.data);
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading settings...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tenant Settings</h2>
          <p className="text-muted-foreground">
            Configure your tenant's compliance, security, and operational settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || updateSettingsMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              General tenant information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tenant Name</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => handleSettingChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={settings.description}
                onChange={(e) => handleSettingChange('description', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Compliance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Compliance & Trust Settings
            </CardTitle>
            <CardDescription>
              Configure compliance levels and trust score thresholds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="complianceLevel">Compliance Level</Label>
                <Select
                  value={settings.complianceLevel}
                  onValueChange={(value: 'basic' | 'standard' | 'enterprise') =>
                    handleSettingChange('complianceLevel', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">
                      <div className="flex items-center gap-2">
                        <span>Basic</span>
                        <Badge variant="secondary">GDPR</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="standard">
                      <div className="flex items-center gap-2">
                        <span>Standard</span>
                        <Badge>EU AI Act</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="enterprise">
                      <div className="flex items-center gap-2">
                        <span>Enterprise</span>
                        <Badge variant="destructive">Full Suite</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trustScoreThreshold">Trust Score Threshold</Label>
                <Input
                  id="trustScoreThreshold"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.trustScoreThreshold}
                  onChange={(e) => handleSettingChange('trustScoreThreshold', parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="autoCompliance"
                checked={settings.enableAutoCompliance}
                onCheckedChange={(checked) => handleSettingChange('enableAutoCompliance', checked)}
              />
              <Label htmlFor="autoCompliance">Enable automatic compliance checks</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="riskAlerts"
                checked={settings.enableRiskAlerts}
                onCheckedChange={(checked) => handleSettingChange('enableRiskAlerts', checked)}
              />
              <Label htmlFor="riskAlerts">Enable risk assessment alerts</Label>
            </div>
          </CardContent>
        </Card>

        {/* Operational Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Operational Settings
            </CardTitle>
            <CardDescription>
              Configure operational limits and data retention policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxAgents">Max Concurrent Agents</Label>
                <Input
                  id="maxAgents"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.maxConcurrentAgents}
                  onChange={(e) => handleSettingChange('maxConcurrentAgents', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiRateLimit">API Rate Limit (requests/min)</Label>
                <Input
                  id="apiRateLimit"
                  type="number"
                  min="10"
                  max="10000"
                  value={settings.apiRateLimit}
                  onChange={(e) => handleSettingChange('apiRateLimit', parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataRetention">Data Retention Policy</Label>
                <Select
                  value={settings.dataRetentionPolicy}
                  onValueChange={(value: '30days' | '90days' | '1year' | 'unlimited') =>
                    handleSettingChange('dataRetentionPolicy', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30days">30 Days</SelectItem>
                    <SelectItem value="90days">90 Days</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="auditRetention">Audit Log Retention (days)</Label>
                <Input
                  id="auditRetention"
                  type="number"
                  min="30"
                  max="3650"
                  value={settings.auditRetentionDays}
                  onChange={(e) => handleSettingChange('auditRetentionDays', parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Keys Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Manage API keys for programmatic access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Production API Key</p>
                  <p className="text-sm text-muted-foreground">Created 30 days ago</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Regenerate</Button>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </div>
              <Button className="w-full" variant="outline">
                <Key className="mr-2 h-4 w-4" />
                Generate New API Key
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}