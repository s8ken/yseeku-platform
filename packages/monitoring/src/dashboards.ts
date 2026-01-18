/**
 * Dashboard Configurations for SONATE Monitoring
 * Pre-built Grafana/Prometheus dashboard templates
 */

export interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  template: string; // JSON template for Grafana
  panels: DashboardPanel[];
  tags: string[];
}

export interface DashboardPanel {
  id: string;
  title: string;
  type: 'graph' | 'singlestat' | 'table' | 'heatmap' | 'histogram';
  targets: string[]; // PromQL queries
  description?: string;
}

/**
 * SONATE Executive Dashboard
 * High-level business metrics and KPIs
 */
export const executiveDashboard: DashboardConfig = {
  id: 'executive-overview',
  name: 'Executive Overview',
  description: 'High-level business metrics and system health',
  template: 'grafana-template',
  tags: ['executive', 'business', 'overview'],
  panels: [
    {
      id: 'active-users',
      title: 'Active Users',
      type: 'singlestat',
      targets: ['sonate_active_users'],
      description: 'Current number of active users',
    },
    {
      id: 'tenant-count',
      title: 'Total Tenants',
      type: 'singlestat',
      targets: ['sonate_tenant_count'],
      description: 'Total number of active tenants',
    },
    {
      id: 'trust-score-avg',
      title: 'Average Trust Score',
      type: 'singlestat',
      targets: ['avg(sonate_trust_score_distribution)'],
      description: 'Average trust score across all detections',
    },
    {
      id: 'system-health',
      title: 'System Health',
      type: 'singlestat',
      targets: ['up'],
      description: 'Overall system health status',
    },
  ],
};

/**
 * Technical Operations Dashboard
 * Detailed system performance and technical metrics
 */
export const technicalDashboard: DashboardConfig = {
  id: 'technical-operations',
  name: 'Technical Operations',
  description: 'Detailed system performance and technical health',
  template: 'grafana-template',
  tags: ['technical', 'operations', 'performance'],
  panels: [
    {
      id: 'detection-latency',
      title: 'Detection Latency',
      type: 'graph',
      targets: ['histogram_quantile(0.95, sonate_detection_duration_seconds)'],
      description: '95th percentile detection latency',
    },
    {
      id: 'cache-performance',
      title: 'Cache Performance',
      type: 'graph',
      targets: [
        'sonate_cache_hit_rate',
        'rate(sonate_embedding_cache_hits_total[5m]) / rate(sonate_embedding_cache_hits_total[5m] + sonate_embedding_cache_misses_total[5m])',
      ],
      description: 'Cache hit rate over time',
    },
    {
      id: 'error-rates',
      title: 'Error Rates',
      type: 'graph',
      targets: ['rate(sonate_errors_total[5m]) / rate(sonate_api_requests_total[5m])'],
      description: 'API error rate over time',
    },
    {
      id: 'redis-status',
      title: 'Redis Connection Status',
      type: 'singlestat',
      targets: ['sonate_redis_connection_status'],
      description: 'Redis cache connection status',
    },
  ],
};

/**
 * AI Performance Dashboard
 * Detailed AI model performance and accuracy metrics
 */
export const aiPerformanceDashboard: DashboardConfig = {
  id: 'ai-performance',
  name: 'AI Performance',
  description: 'AI model performance, accuracy, and confidence metrics',
  template: 'grafana-template',
  tags: ['ai', 'performance', 'ml'],
  panels: [
    {
      id: 'trust-score-distribution',
      title: 'Trust Score Distribution',
      type: 'histogram',
      targets: ['sonate_trust_score_distribution'],
      description: 'Distribution of trust scores across detections',
    },
    {
      id: 'confidence-levels',
      title: 'Confidence Levels',
      type: 'graph',
      targets: ['sonate_confidence_level'],
      description: 'AI confidence levels over time',
    },
    {
      id: 'detection-throughput',
      title: 'Detection Throughput',
      type: 'graph',
      targets: ['rate(sonate_detection_requests_total[5m])'],
      description: 'Rate of detection requests per minute',
    },
    {
      id: 'embedding-performance',
      title: 'Embedding Performance',
      type: 'graph',
      targets: [
        'rate(sonate_embedding_cache_hits_total[5m])',
        'rate(sonate_embedding_cache_misses_total[5m])',
      ],
      description: 'Embedding cache hits vs misses',
    },
  ],
};

/**
 * Security & Compliance Dashboard
 * Security events, audit logs, and compliance metrics
 */
export const securityDashboard: DashboardConfig = {
  id: 'security-compliance',
  name: 'Security & Compliance',
  description: 'Security events, audit trails, and compliance monitoring',
  template: 'grafana-template',
  tags: ['security', 'compliance', 'audit'],
  panels: [
    {
      id: 'security-events',
      title: 'Security Events',
      type: 'graph',
      targets: ['rate(sonate_security_events_total[5m])'],
      description: 'Rate of security events by severity',
    },
    {
      id: 'audit-log-volume',
      title: 'Audit Log Volume',
      type: 'graph',
      targets: ['rate(sonate_audit_log_entries_total[5m])'],
      description: 'Volume of audit log entries',
    },
    {
      id: 'api-requests-by-status',
      title: 'API Requests by Status',
      type: 'table',
      targets: ['sonate_api_requests_total'],
      description: 'API request breakdown by HTTP status code',
    },
    {
      id: 'error-breakdown',
      title: 'Error Breakdown',
      type: 'table',
      targets: ['sonate_errors_total'],
      description: 'Errors by type and component',
    },
  ],
};

/**
 * Business Intelligence Dashboard
 * Business metrics and ROI tracking
 */
export const businessDashboard: DashboardConfig = {
  id: 'business-intelligence',
  name: 'Business Intelligence',
  description: 'Business metrics, user adoption, and ROI tracking',
  template: 'grafana-template',
  tags: ['business', 'roi', 'adoption'],
  panels: [
    {
      id: 'user-growth',
      title: 'User Growth',
      type: 'graph',
      targets: ['increase(sonate_active_users[30d])'],
      description: 'User growth over the last 30 days',
    },
    {
      id: 'tenant-growth',
      title: 'Tenant Growth',
      type: 'graph',
      targets: ['increase(sonate_tenant_count[30d])'],
      description: 'Tenant growth over the last 30 days',
    },
    {
      id: 'api-usage-trends',
      title: 'API Usage Trends',
      type: 'graph',
      targets: ['rate(sonate_api_requests_total[1h])'],
      description: 'API usage trends by endpoint',
    },
    {
      id: 'trust-score-trends',
      title: 'Trust Score Trends',
      type: 'graph',
      targets: ['avg(sonate_trust_score_distribution)'],
      description: 'Average trust scores over time',
    },
  ],
};

/**
 * Get all pre-configured dashboards
 */
export function getAllDashboards(): DashboardConfig[] {
  return [
    executiveDashboard,
    technicalDashboard,
    aiPerformanceDashboard,
    securityDashboard,
    businessDashboard,
  ];
}

/**
 * Get dashboard by ID
 */
export function getDashboardById(id: string): DashboardConfig | null {
  const dashboards = getAllDashboards();
  return dashboards.find((d) => d.id === id) || null;
}

/**
 * Generate Grafana dashboard JSON from config
 */
export function generateGrafanaDashboard(config: DashboardConfig): string {
  // This would generate actual Grafana JSON dashboard configuration
  // For now, return a placeholder structure
  return JSON.stringify(
    {
      dashboard: {
        id: null,
        title: config.name,
        tags: config.tags,
        timezone: 'browser',
        panels: config.panels.map((panel, index) => ({
          id: index + 1,
          title: panel.title,
          type: panel.type,
          targets: panel.targets.map((target) => ({
            expr: target,
            refId: 'A',
          })),
          description: panel.description,
        })),
        time: {
          from: 'now-1h',
          to: 'now',
        },
        refresh: '5s',
      },
    },
    null,
    2
  );
}

/**
 * Export dashboard configurations for external monitoring systems
 */
export function exportDashboardConfigs(): Record<string, DashboardConfig> {
  const dashboards = getAllDashboards();
  return dashboards.reduce((acc, dashboard) => {
    acc[dashboard.id] = dashboard;
    return acc;
  }, {} as Record<string, DashboardConfig>);
}
