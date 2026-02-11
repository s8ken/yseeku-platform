'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield,
  Copy,
  Check,
  ExternalLink,
  Code,
  Palette,
  Maximize2,
  Info,
  Sparkles,
  Eye
} from 'lucide-react';
import { TrustPassport } from '@/components/TrustPassport';
import Link from 'next/link';

export default function ToolsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [passportConfig, setPassportConfig] = useState({
    agentId: '',
    sessionId: '',
    theme: 'dark' as 'light' | 'dark',
    size: 'medium' as 'small' | 'medium' | 'large',
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateEmbedCode = () => {
    const params = new URLSearchParams();
    if (passportConfig.agentId) params.set('agent', passportConfig.agentId);
    if (passportConfig.sessionId) params.set('session', passportConfig.sessionId);
    params.set('theme', passportConfig.theme);
    params.set('size', passportConfig.size);
    
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/widget/passport?${params.toString()}`;
    
    return `<iframe 
  src="${url}"
  width="${passportConfig.size === 'small' ? 150 : passportConfig.size === 'medium' ? 200 : 240}"
  height="${passportConfig.size === 'small' ? 45 : passportConfig.size === 'medium' ? 60 : 80}"
  frameborder="0"
  style="border: none; overflow: hidden;"
  allow="clipboard-write"
></iframe>`;
  };

  const previewUrl = () => {
    const params = new URLSearchParams();
    if (passportConfig.agentId) params.set('agent', passportConfig.agentId);
    if (passportConfig.sessionId) params.set('session', passportConfig.sessionId);
    params.set('theme', passportConfig.theme);
    params.set('size', passportConfig.size);
    return `/widget/passport?${params.toString()}`;
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Developer Tools</h1>
        <p className="text-muted-foreground mt-2">
          Embeddable widgets and integration tools for your applications
        </p>
      </div>

      {/* Trust Passport Widget */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle>Trust Passport Widget</CardTitle>
              <CardDescription>
                Embeddable badge showing real-time AI trust status - like the SSL padlock for AI
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Explanation */}
          <div className="bg-muted/50 rounded-lg p-4 border">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
              <div className="space-y-2 text-sm">
                <p>
                  The <strong>Trust Passport</strong> is a visual indicator that shows users the current 
                  trust status of an AI agent or session. It displays:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>Resonance score</strong> - Overall trust/alignment metric (0-1)</li>
                  <li><strong>Status indicator</strong> - Verified (green), Warning (yellow), or Unknown (gray)</li>
                  <li><strong>Real-time updates</strong> - Polls every 10 seconds when connected to a live session</li>
                </ul>
                <p className="text-muted-foreground">
                  Embed it in your application to give users confidence that AI interactions are being monitored 
                  and validated by SONATE.
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="configure" className="w-full">
            <TabsList>
              <TabsTrigger value="configure">Configure</TabsTrigger>
              <TabsTrigger value="embed">Embed Code</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
            </TabsList>

            <TabsContent value="configure" className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Configuration */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Widget Options
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="agentId">Agent ID (optional)</Label>
                      <Input
                        id="agentId"
                        placeholder="e.g., agent-abc123"
                        value={passportConfig.agentId}
                        onChange={(e) => setPassportConfig({ ...passportConfig, agentId: e.target.value })}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Leave empty for demo mode
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="sessionId">Session ID (optional)</Label>
                      <Input
                        id="sessionId"
                        placeholder="e.g., session-xyz789"
                        value={passportConfig.sessionId}
                        onChange={(e) => setPassportConfig({ ...passportConfig, sessionId: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Theme</Label>
                      <Select
                        value={passportConfig.theme}
                        onValueChange={(v) => setPassportConfig({ ...passportConfig, theme: v as 'light' | 'dark' })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="light">Light</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Size</Label>
                      <Select
                        value={passportConfig.size}
                        onValueChange={(v) => setPassportConfig({ ...passportConfig, size: v as 'small' | 'medium' | 'large' })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small (150x45)</SelectItem>
                          <SelectItem value="medium">Medium (200x60)</SelectItem>
                          <SelectItem value="large">Large (240x80)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Preview
                  </h3>
                  
                  <div className={`rounded-lg p-8 flex items-center justify-center border ${
                    passportConfig.theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'
                  }`}>
                    <TrustPassport
                      agentId={passportConfig.agentId || undefined}
                      sessionId={passportConfig.sessionId || undefined}
                      resonance={0.87}
                      status="verified"
                      size={passportConfig.size}
                      theme={passportConfig.theme}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Link href={previewUrl()} target="_blank" className="flex-1">
                      <Button variant="outline" className="w-full gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Open in New Tab
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="embed" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>HTML Embed Code</Label>
                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{generateEmbedCode()}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(generateEmbedCode(), 'embed')}
                  >
                    {copied === 'embed' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Direct URL</Label>
                <div className="relative">
                  <Input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/widget/passport?${new URLSearchParams({
                      ...(passportConfig.agentId && { agent: passportConfig.agentId }),
                      ...(passportConfig.sessionId && { session: passportConfig.sessionId }),
                      theme: passportConfig.theme,
                      size: passportConfig.size,
                    }).toString()}`}
                    className="pr-20 font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-1 right-1"
                    onClick={() => copyToClipboard(previewUrl(), 'url')}
                  >
                    {copied === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Session Status Endpoint</h4>
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg">
                    <code className="text-sm">GET /api/trust/session/:sessionId/status</code>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Returns the current trust status for a specific session.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Response Format</h4>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "success": true,
  "data": {
    "resonance": 0.87,
    "status": "verified",
    "lastUpdated": "2024-01-15T10:30:00Z",
    "receiptCount": 42
  }
}`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium mb-2">PostMessage Events</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    The widget sends resize events to the parent window for responsive iframes:
                  </p>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`window.addEventListener('message', (event) => {
  if (event.data.type === 'sonate-passport-resize') {
    const { width, height } = event.data;
    // Resize your iframe accordingly
  }
});`}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Additional Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <div>
                <CardTitle className="text-lg">Emergence Lab</CardTitle>
                <CardDescription>Bedau emergence detection</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Run simulations to detect weak and strong emergence patterns in AI behavior using 
              Bedau's formal emergence framework.
            </p>
            <Link href="/dashboard/lab/emergence">
              <Button variant="outline" className="w-full">Open Emergence Lab</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Code className="w-5 h-5 text-cyan-400" />
              <div>
                <CardTitle className="text-lg">Verify SDK</CardTitle>
                <CardDescription>Client-side verification</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Use <code className="text-xs bg-muted px-1 py-0.5 rounded">@sonate/verify-sdk</code> to 
              verify trust receipts client-side without backend calls.
            </p>
            <Link href="/dashboard/docs">
              <Button variant="outline" className="w-full">View Documentation</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
