'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle2,
  Bot,
  MessageSquare,
  Zap,
  RefreshCw,
  Wifi,
  WifiOff,
  Bell,
  Shield,
  Cpu
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Types
interface LiveMetrics {
  timestamp: string;
  trust: {
    current: number;
    trend: 'up' | 'down' | 'stable';
    delta: number;
  };
  drift: {
    score: number;
    status: 'normal' | 'warning' | 'critical';
  };
  emergence: {
    level: number;
    active: boolean;
  };
  system: {
    activeAgents: number;
    activeConversations: number;
    messagesPerMinute: number;
    errorRate: number;
  };
  alerts: {
    active: number;
    critical: number;
    warning: number;
  };
  principles: {
    consent: number;
    inspection: number;
    validation: number;
    override: number;
    disconnect: number;
    moral: number;
  };
}

interface TrustEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  severity: string;
  agentName?: string;
  trustScore?: number;
}

// Trend indicator component
function TrendIndicator({ trend, delta }: { trend: 'up' | 'down' | 'stable'; delta: number }) {
  if (trend === 'up') {
    return (
      <span className="flex items-center text-green-600 text-sm">
        <TrendingUp className="h-4 w-4 mr-1" />
        +{delta.toFixed(2)}
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="flex items-center text-red-600 text-sm">
        <TrendingDown className="h-4 w-4 mr-1" />
        {delta.toFixed(2)}
      </span>
    );
  }
  return (
    <span className="flex items-center text-gray-500 text-sm">
      <Minus className="h-4 w-4 mr-1" />
      stable
    </span>
  );
}

// Status badge component
function StatusBadge({ status }: { status: 'normal' | 'warning' | 'critical' | 'healthy' }) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    normal: { variant: 'default', label: 'Normal' },
    healthy: { variant: 'default', label: 'Healthy' },
    warning: { variant: 'secondary', label: 'Warning' },
    critical: { variant: 'destructive', label: 'Critical' },
  };
  const { variant, label } = variants[status] || variants.normal;
  return <Badge variant={variant}>{label}</Badge>;
}

// Principle score bar
function PrincipleBar({ name, score, max = 10 }: { name: string; score: number; max?: number }) {
  const percentage = (score / max) * 100;
  const color = score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500';
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{name}</span>
        <span className="font-medium">{score.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Event list item
function EventItem({ event }: { event: TrustEvent }) {
  const severityColors: Record<string, string> = {
    critical: 'border-red-500 bg-red-50 dark:bg-red-900/10',
    warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
    info: 'border-blue-500 bg-blue-50 dark:bg-blue-900/10',
  };
  
  return (
    <div className={`p-3 rounded-lg border-l-4 ${severityColors[event.severity] || severityColors.info}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-sm">{event.description}</p>
          {event.agentName && (
            <p className="text-xs text-muted-foreground">Agent: {event.agentName}</p>
          )}
        </div>
        <div className="text-right">
          {event.trustScore && (
            <Badge variant="outline">{event.trustScore.toFixed(1)}</Badge>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(event.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// Main component
export default function LiveDashboardPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [events, setEvents] = useState<TrustEvent[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch initial metrics
  const { data: initialMetrics, refetch } = useQuery({
    queryKey: ['live-metrics'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/live/metrics`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json();
    },
    refetchInterval: connected ? false : 10000, // Only poll if not connected via socket
  });

  // Fetch events
  const { data: initialEvents } = useQuery({
    queryKey: ['live-events'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/live/events?limit=10`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      return data.data;
    },
  });

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const newSocket = io(API_BASE, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Live dashboard connected');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Live dashboard disconnected');
    });

    newSocket.on('metrics:live', (data: LiveMetrics) => {
      setMetrics(data);
      setLastUpdate(new Date());
    });

    newSocket.on('trust:event', (event: TrustEvent) => {
      setEvents(prev => [event, ...prev].slice(0, 20));
    });

    newSocket.on('alert:new', (alert: any) => {
      setEvents(prev => [{
        id: alert.id,
        timestamp: alert.timestamp,
        type: 'alert',
        description: alert.title,
        severity: alert.severity,
      }, ...prev].slice(0, 20));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Use initial data if no socket data yet
  useEffect(() => {
    if (initialEvents && events.length === 0) {
      setEvents(initialEvents);
    }
  }, [initialEvents, events.length]);

  // Display metrics (from socket or API)
  const displayMetrics = metrics || (initialMetrics?.data ? {
    timestamp: new Date().toISOString(),
    trust: {
      current: initialMetrics.data.trust?.current || 8.5,
      trend: 'stable' as const,
      delta: 0,
    },
    drift: {
      score: 0.15,
      status: 'normal' as const,
    },
    emergence: {
      level: 0.2,
      active: false,
    },
    system: initialMetrics.data.system || {
      activeAgents: 0,
      activeConversations: 0,
      messagesPerMinute: 0,
      errorRate: 0,
    },
    alerts: initialMetrics.data.alerts || {
      active: 0,
      critical: 0,
      warning: 0,
    },
    principles: {
      consent: 8.5,
      inspection: 8.7,
      validation: 8.3,
      override: 9.0,
      disconnect: 8.8,
      moral: 8.6,
    },
  } : null);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Live Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time trust monitoring and system health
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant={connected ? 'default' : 'secondary'} 
            className="flex items-center gap-1"
          >
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connected ? 'Live' : 'Polling'}
          </Badge>
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!displayMetrics ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Loading metrics...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Primary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Trust Score */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Trust Score
                </CardDescription>
                <CardTitle className="text-4xl flex items-baseline gap-2">
                  {displayMetrics.trust.current.toFixed(1)}
                  <span className="text-lg text-muted-foreground">/10</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TrendIndicator 
                  trend={displayMetrics.trust.trend} 
                  delta={displayMetrics.trust.delta} 
                />
              </CardContent>
            </Card>

            {/* Drift Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  Drift Score
                </CardDescription>
                <CardTitle className="text-4xl">
                  {(displayMetrics.drift.score * 100).toFixed(0)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatusBadge status={displayMetrics.drift.status} />
              </CardContent>
            </Card>

            {/* Active Alerts */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Bell className="h-4 w-4" />
                  Active Alerts
                </CardDescription>
                <CardTitle className="text-4xl flex items-baseline gap-2">
                  {displayMetrics.alerts.active}
                  {displayMetrics.alerts.critical > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {displayMetrics.alerts.critical} critical
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {displayMetrics.alerts.warning} warnings
                </p>
              </CardContent>
            </Card>

            {/* System Activity */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Cpu className="h-4 w-4" />
                  System Activity
                </CardDescription>
                <CardTitle className="text-4xl">
                  {displayMetrics.system.messagesPerMinute}
                  <span className="text-lg text-muted-foreground">/min</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Bot className="h-4 w-4" />
                  {displayMetrics.system.activeAgents} agents
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {displayMetrics.system.activeConversations} chats
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SYMBI Principles */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">SYMBI Principles</CardTitle>
                <CardDescription>Real-time compliance scores</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PrincipleBar name="Consent" score={displayMetrics.principles.consent} />
                <PrincipleBar name="Inspection" score={displayMetrics.principles.inspection} />
                <PrincipleBar name="Validation" score={displayMetrics.principles.validation} />
                <PrincipleBar name="Ethical Override" score={displayMetrics.principles.override} />
                <PrincipleBar name="Disconnect" score={displayMetrics.principles.disconnect} />
                <PrincipleBar name="Moral Recognition" score={displayMetrics.principles.moral} />
              </CardContent>
            </Card>

            {/* Live Events */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Live Events
                </CardTitle>
                <CardDescription>Recent trust evaluations and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {events.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No events yet. Waiting for activity...
                    </p>
                  ) : (
                    events.map(event => (
                      <EventItem key={event.id} event={event} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Emergence Indicator */}
          {displayMetrics.emergence.active && (
            <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="h-5 w-5" />
                  Emergence Activity Detected
                </CardTitle>
                <CardDescription>
                  Emergent behavior patterns detected at level {(displayMetrics.emergence.level * 100).toFixed(0)}%
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
