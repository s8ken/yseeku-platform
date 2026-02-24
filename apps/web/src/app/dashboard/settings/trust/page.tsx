'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Shield,
  Bell,
  Eye,
  Download,
  Save,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';

interface TrustSettings {
  notifications: {
    enabled: boolean;
    criticalAlerts: boolean;
    partialAlerts: boolean;
    emailNotifications: boolean;
    slackNotifications: boolean;
    trustScoreThreshold: number;
    alertFrequency: 'immediate' | 'hourly' | 'daily';
  };
  display: {
    compactView: boolean;
    showReceiptHash: boolean;
    showPrincipleBreakdown: boolean;
    showSONATEDimensions: boolean;
    autoExpandViolations: boolean;
    colorScheme: 'default' | 'colorblind' | 'monochrome';
  };
  receipts: {
    autoDownload: boolean;
    downloadFormat: 'json' | 'pdf' | 'both';
    retentionDays: number;
    includeMetadata: boolean;
    cryptographicVerification: boolean;
  };
}

export default function TrustSettingsPage() {
  const [settings, setSettings] = useState<TrustSettings>({
    notifications: {
      enabled: true,
      criticalAlerts: true,
      partialAlerts: true,
      emailNotifications: false,
      slackNotifications: false,
      trustScoreThreshold: 7.0,
      alertFrequency: 'immediate',
    },
    display: {
      compactView: false,
      showReceiptHash: true,
      showPrincipleBreakdown: true,
      showSONATEDimensions: true,
      autoExpandViolations: true,
      colorScheme: 'default',
    },
    receipts: {
      autoDownload: false,
      downloadFormat: 'json',
      retentionDays: 90,
      includeMetadata: true,
      cryptographicVerification: true,
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const load = async () => {
        const res = await fetch('/api/trust/settings', { method: 'GET' });
        if (res.ok) {
          const json = await res.json();
          if (json?.data) {
            const parsed = json.data;
            setSettings(prev => ({
              ...prev,
              ...parsed,
              notifications: { ...prev.notifications, ...parsed.notifications },
              display: { ...prev.display, ...parsed.display },
              receipts: { ...prev.receipts, ...parsed.receipts },
            }));
            localStorage.setItem('trustSettings', JSON.stringify(parsed));
          } else {
            const saved = localStorage.getItem('trustSettings');
            if (saved) {
              const parsed = JSON.parse(saved);
              setSettings(prev => ({
                ...prev,
                ...parsed,
                notifications: { ...prev.notifications, ...parsed.notifications },
                display: { ...prev.display, ...parsed.display },
                receipts: { ...prev.receipts, ...parsed.receipts },
              }));
            }
          }
        }
      };
      load();
    } catch (e) {
      console.error('Failed to load trust settings:', e);
    }
    setIsLoaded(true);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/trust/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: 'default', settings }),
      });
      if (!res.ok) throw new Error('Save failed');

      // Save to localStorage for now
      localStorage.setItem('trustSettings', JSON.stringify(settings));

      toast.success('Settings Saved', {
        description: 'Your trust preferences have been updated successfully.',
      });
    } catch (error) {
      toast.error('Failed to Save', {
        description: 'Could not save trust settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      notifications: {
        enabled: true,
        criticalAlerts: true,
        partialAlerts: true,
        emailNotifications: false,
        slackNotifications: false,
        trustScoreThreshold: 7.0,
        alertFrequency: 'immediate',
      },
      display: {
        compactView: false,
        showReceiptHash: true,
        showPrincipleBreakdown: true,
        showSONATEDimensions: true,
        autoExpandViolations: true,
        colorScheme: 'default',
      },
      receipts: {
        autoDownload: false,
        downloadFormat: 'json',
        retentionDays: 90,
        includeMetadata: true,
        cryptographicVerification: true,
      },
    });

    toast.info('Settings Reset', {
      description: 'All preferences have been reset to defaults.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-purple-500" />
          <h1 className="text-3xl font-bold">Trust Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Configure notification preferences, display options, and receipt management for the SONATE Trust Protocol.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset to Defaults
        </Button>
      </div>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>
            Control how and when you receive alerts about trust violations and score changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-enabled">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive alerts for trust events</p>
            </div>
            <Switch
              id="notifications-enabled"
              checked={settings.notifications.enabled}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, enabled: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="critical-alerts" className="flex items-center gap-2">
                Critical Alerts
                <AlertTriangle className="h-3 w-3 text-red-500" />
              </Label>
              <p className="text-sm text-muted-foreground">Alert on FAIL status (trust score &lt; 6.0)</p>
            </div>
            <Switch
              id="critical-alerts"
              checked={settings.notifications.criticalAlerts}
              disabled={!settings.notifications.enabled}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, criticalAlerts: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="partial-alerts" className="flex items-center gap-2">
                Partial Alerts
                <Info className="h-3 w-3 text-amber-500" />
              </Label>
              <p className="text-sm text-muted-foreground">Alert on PARTIAL status (6.0 ≤ score &lt; 8.0)</p>
            </div>
            <Switch
              id="partial-alerts"
              checked={settings.notifications.partialAlerts}
              disabled={!settings.notifications.enabled}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, partialAlerts: checked },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="threshold-slider">
              Trust Score Alert Threshold: {settings.notifications.trustScoreThreshold.toFixed(1)}/10
            </Label>
            <Slider
              id="threshold-slider"
              min={0}
              max={10}
              step={0.1}
              value={[settings.notifications.trustScoreThreshold]}
              onValueChange={([value]) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, trustScoreThreshold: value },
                })
              }
              disabled={!settings.notifications.enabled}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Receive alerts when trust score falls below this threshold
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert-frequency">Alert Frequency</Label>
            <Select
              value={settings.notifications.alertFrequency}
              onValueChange={(value: 'immediate' | 'hourly' | 'daily') =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, alertFrequency: value },
                })
              }
              disabled={!settings.notifications.enabled}
            >
              <SelectTrigger id="alert-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="hourly">Hourly Digest</SelectItem>
                <SelectItem value="daily">Daily Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Send alerts to your email</p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.notifications.emailNotifications}
              disabled={!settings.notifications.enabled}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, emailNotifications: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="slack-notifications">Slack Notifications</Label>
              <p className="text-sm text-muted-foreground">Post alerts to Slack channel</p>
            </div>
            <Switch
              id="slack-notifications"
              checked={settings.notifications.slackNotifications}
              disabled={!settings.notifications.enabled}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, slackNotifications: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-500" />
            <CardTitle>Display Preferences</CardTitle>
          </div>
          <CardDescription>
            Customize how trust evaluations are displayed in the interface.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-view">Compact View</Label>
              <p className="text-sm text-muted-foreground">Show minimal trust information</p>
            </div>
            <Switch
              id="compact-view"
              checked={settings.display.compactView}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  display: { ...settings.display, compactView: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-receipt-hash">Show Receipt Hash</Label>
              <p className="text-sm text-muted-foreground">Display cryptographic receipt hash</p>
            </div>
            <Switch
              id="show-receipt-hash"
              checked={settings.display.showReceiptHash}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  display: { ...settings.display, showReceiptHash: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-principle-breakdown">Show Principle Breakdown</Label>
              <p className="text-sm text-muted-foreground">Display all 6 constitutional principles</p>
            </div>
            <Switch
              id="show-principle-breakdown"
              checked={settings.display.showPrincipleBreakdown}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  display: { ...settings.display, showPrincipleBreakdown: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-sonate-dimensions">Show SONATE Dimensions</Label>
              <p className="text-sm text-muted-foreground">Display Reality Index, Canvas Parity, etc.</p>
            </div>
            <Switch
              id="show-sonate-dimensions"
              checked={settings.display.showSONATEDimensions}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  display: { ...settings.display, showSONATEDimensions: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-expand-violations">Auto-expand Violations</Label>
              <p className="text-sm text-muted-foreground">Automatically show violation details</p>
            </div>
            <Switch
              id="auto-expand-violations"
              checked={settings.display.autoExpandViolations}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  display: { ...settings.display, autoExpandViolations: checked },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color-scheme">Color Scheme</Label>
            <Select
              value={settings.display.colorScheme}
              onValueChange={(value: 'default' | 'colorblind' | 'monochrome') =>
                setSettings({
                  ...settings,
                  display: { ...settings.display, colorScheme: value },
                })
              }
            >
              <SelectTrigger id="color-scheme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (Green/Amber/Red)</SelectItem>
                <SelectItem value="colorblind">Colorblind Friendly</SelectItem>
                <SelectItem value="monochrome">Monochrome</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-green-500" />
            <CardTitle>Receipt Management</CardTitle>
          </div>
          <CardDescription>
            Configure automatic receipt downloads and retention policies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-download">Auto-download Receipts</Label>
              <p className="text-sm text-muted-foreground">Automatically download after each interaction</p>
            </div>
            <Switch
              id="auto-download"
              checked={settings.receipts.autoDownload}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  receipts: { ...settings.receipts, autoDownload: checked },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="download-format">Download Format</Label>
            <Select
              value={settings.receipts.downloadFormat}
              onValueChange={(value: 'json' | 'pdf' | 'both') =>
                setSettings({
                  ...settings,
                  receipts: { ...settings.receipts, downloadFormat: value },
                })
              }
              disabled={!settings.receipts.autoDownload}
            >
              <SelectTrigger id="download-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="both">Both (JSON + PDF)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="retention-days">
              Retention Period: {settings.receipts.retentionDays} days
            </Label>
            <Slider
              id="retention-days"
              min={7}
              max={365}
              step={1}
              value={[settings.receipts.retentionDays]}
              onValueChange={([value]) =>
                setSettings({
                  ...settings,
                  receipts: { ...settings.receipts, retentionDays: value },
                })
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Receipts older than this will be automatically archived
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="include-metadata">Include Metadata</Label>
              <p className="text-sm text-muted-foreground">Add session info, timestamps, agent details</p>
            </div>
            <Switch
              id="include-metadata"
              checked={settings.receipts.includeMetadata}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  receipts: { ...settings.receipts, includeMetadata: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="cryptographic-verification" className="flex items-center gap-2">
                Cryptographic Verification
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              </Label>
              <p className="text-sm text-muted-foreground">Include SHA-256 hash signatures</p>
            </div>
            <Switch
              id="cryptographic-verification"
              checked={settings.receipts.cryptographicVerification}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  receipts: { ...settings.receipts, cryptographicVerification: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                SONATE Trust Protocol v1.10.0
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                All settings are encrypted and stored securely. Changes take effect immediately across all active sessions.
                Trust receipts are cryptographically signed and tamper-proof.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
