'use client';

import { useState, useEffect } from 'react';
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
  vaultStatus: 'connected' | 'disconnected' | 'error';
  vaultUrl: string;
  cryptoAlgorithm: 'aes-256-gcm' | 'chacha20-poly1305' | 'aes-128-gcm';
  enableHardwareSecurityModule: boolean;
  keyRotationDays: number;
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
  vaultStatus: 'connected',
  vaultUrl: 'https://vault.yseeku.com:8200',
  cryptoAlgorithm: 'aes-256-gcm',
  enableHardwareSecurityModule: false,
  keyRotationDays: 90,
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
  });

  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings.data);
    }
  }, [currentSettings]);

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

        {/* Vault Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Vault Security Settings
            </CardTitle>
            <CardDescription>
              Configure HashiCorp Vault integration and cryptographic settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vaultStatus">Vault Status</Label>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    settings.vaultStatus === 'connected' ? 'bg-green-500' :
                    settings.vaultStatus === 'disconnected' ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  <span className="capitalize">{settings.vaultStatus}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vaultUrl">Vault URL</Label>
                <Input
                  id="vaultUrl"
                  value={settings.vaultUrl}
                  onChange={(e) => handleSettingChange('vaultUrl', e.target.value)}
                  placeholder="https://vault.example.com:8200"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cryptoAlgorithm">Crypto Algorithm</Label>
                <Select
                  value={settings.cryptoAlgorithm}
                  onValueChange={(value: 'aes-256-gcm' | 'chacha20-poly1305' | 'aes-128-gcm') =>
                    handleSettingChange('cryptoAlgorithm', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aes-256-gcm">AES-256-GCM (Recommended)</SelectItem>
                    <SelectItem value="chacha20-poly1305">ChaCha20-Poly1305</SelectItem>
                    <SelectItem value="aes-128-gcm">AES-128-GCM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyRotation">Key Rotation (days)</Label>
                <Input
                  id="keyRotation"
                  type="number"
                  min="1"
                  max="365"
                  value={settings.keyRotationDays}
                  onChange={(e) => handleSettingChange('keyRotationDays', parseInt(e.target.value))}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="hsmEnabled"
                checked={settings.enableHardwareSecurityModule}
                onCheckedChange={(checked) => handleSettingChange('enableHardwareSecurityModule', checked)}
              />
              <Label htmlFor="hsmEnabled">Enable Hardware Security Module (HSM)</Label>
            </div>
            
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium">Security Status:</p>
              <p className="text-muted-foreground">
                {settings.vaultStatus === 'connected' ? 
                  'Vault connected securely. All secrets are encrypted at rest and in transit.' :
                  settings.vaultStatus === 'disconnected' ?
                  'Vault disconnected. Secrets are stored in local encrypted storage.' :
                  'Vault connection error. Please check configuration.'
                }
              </p>
              <p className="text-muted-foreground mt-1">
                Current algorithm: <strong>{settings.cryptoAlgorithm}</strong> • 
                Key rotation: <strong>{settings.keyRotationDays} days</strong> • 
                HSM: <strong>{settings.enableHardwareSecurityModule ? 'Enabled' : 'Disabled'}</strong>
              </p>
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

        {/* Compliance Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Compliance Certifications
            </CardTitle>
            <CardDescription>
              Enterprise-grade compliance and security certifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* SOC 2 Certification */}
              <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">SOC 2 Type II</h4>
                    <p className="text-xs text-blue-600 dark:text-blue-300">Certified</p>
                  </div>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Security, availability, and confidentiality controls verified by independent audit
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300 rounded-full">AICPA</span>
                  <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300 rounded-full">ISO 27001</span>
                </div>
              </div>

              {/* GDPR Compliance */}
              <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900 dark:text-green-100">GDPR</h4>
                    <p className="text-xs text-green-600 dark:text-green-300">Fully Compliant</p>
                  </div>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Comprehensive data protection and privacy framework for EU/EEA citizens
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs px-2 py-1 bg-green-200 text-green-800 dark:bg-green-800/30 dark:text-green-300 rounded-full">Article 30</span>
                  <span className="text-xs px-2 py-1 bg-green-200 text-green-800 dark:bg-green-800/30 dark:text-green-300 rounded-full">DPIA</span>
                </div>
              </div>

              {/* EU AI Act */}
              <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100">EU AI Act</h4>
                    <p className="text-xs text-purple-600 dark:text-purple-300">Ready</p>
                  </div>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Prepared for EU Artificial Intelligence Act compliance requirements
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs px-2 py-1 bg-purple-200 text-purple-800 dark:bg-purple-800/30 dark:text-purple-300 rounded-full">Risk Tier 2</span>
                  <span className="text-xs px-2 py-1 bg-purple-200 text-purple-800 dark:bg-purple-800/30 dark:text-purple-300 rounded-full">Conformity</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Compliance Status: <span className="text-emerald-600">Fully Compliant</span></p>
              <p className="text-xs text-muted-foreground mt-1">
                All systems meet or exceed regulatory requirements for enterprise deployment
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
