/**
 * Actionable Insights System
 * 
 * Provides AI-generated recommendations and next steps for platform operators
 * based on real-time trust data, behavioral analysis, and system health.
 */

export enum InsightPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export enum InsightCategory {
  TRUST = 'trust',
  BEHAVIORAL = 'behavioral',
  EMERGENCE = 'emergence',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  COMPLIANCE = 'compliance'
}

export enum InsightAction {
  APPROVE = 'approve',
  OVERRIDE = 'override',
  INVESTIGATE = 'investigate',
  REVIEW = 'review',
  IGNORE = 'ignore',
  ESCALATE = 'escalate',
  RESOLVE = 'resolve'
}

export interface Insight {
  id: string;
  tenantId: string;
  priority: InsightPriority;
  category: InsightCategory;
  title: string;
  description: string;
  recommendation: string;
  
  // Context
  source: {
    type: 'trust_score' | 'phase_shift' | 'emergence' | 'drift' | 'compliance' | 'alert';
    id?: string;
    details?: Record<string, any>;
  };
  
  // Metrics
  metrics: {
    currentValue: number | string;
    threshold: number;
    severity: 'none' | 'warning' | 'critical';
    trend?: {
      direction: 'up' | 'down' | 'stable';
      change: number;
      timeframe: string;
    };
  };
  
  // Actions
  suggestedActions: InsightAction[];
  availableActions: InsightAction[];
  
  // Status
  status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  
  // Metadata
  metadata?: {
    confidence?: number;
    relatedInsights?: string[];
    tags?: string[];
  };
}

export interface InsightsSummary {
  total: number;
  byPriority: Record<InsightPriority, number>;
  byCategory: Record<InsightCategory, number>;
  byStatus: Record<string, number>;
  criticalCount: number;
  highCount: number;
}

export interface GenerateInsightsRequest {
  tenantId: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  includeHistorical?: boolean;
  maxInsights?: number;
}

export interface InsightsConfig {
  thresholds: {
    trustScore: {
      critical: number;
      warning: number;
    };
    phaseShiftVelocity: {
      critical: number;
      warning: number;
    };
    emergenceLevel: {
      threshold: 'strong' | 'breakthrough';
    };
    driftScore: {
      critical: number;
      warning: number;
    };
  };
  priorities: {
    overrideEnabled: boolean;
    autoResolveLowPriority: boolean;
    escalateToOverseer: boolean;
  };
}