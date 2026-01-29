/**
 * Dashboard Configurations for SONATE Monitoring
 * Pre-built Grafana/Prometheus dashboard templates
 */
export interface DashboardConfig {
    id: string;
    name: string;
    description: string;
    template: string;
    panels: DashboardPanel[];
    tags: string[];
}
export interface DashboardPanel {
    id: string;
    title: string;
    type: 'graph' | 'singlestat' | 'table' | 'heatmap' | 'histogram';
    targets: string[];
    description?: string;
}
/**
 * SONATE Executive Dashboard
 * High-level business metrics and KPIs
 */
export declare const executiveDashboard: DashboardConfig;
/**
 * Technical Operations Dashboard
 * Detailed system performance and technical metrics
 */
export declare const technicalDashboard: DashboardConfig;
/**
 * AI Performance Dashboard
 * Detailed AI model performance and accuracy metrics
 */
export declare const aiPerformanceDashboard: DashboardConfig;
/**
 * Security & Compliance Dashboard
 * Security events, audit logs, and compliance metrics
 */
export declare const securityDashboard: DashboardConfig;
/**
 * Business Intelligence Dashboard
 * Business metrics and ROI tracking
 */
export declare const businessDashboard: DashboardConfig;
/**
 * Get all pre-configured dashboards
 */
export declare function getAllDashboards(): DashboardConfig[];
/**
 * Get dashboard by ID
 */
export declare function getDashboardById(id: string): DashboardConfig | null;
/**
 * Generate Grafana dashboard JSON from config
 */
export declare function generateGrafanaDashboard(config: DashboardConfig): string;
/**
 * Export dashboard configurations for external monitoring systems
 */
export declare function exportDashboardConfigs(): Record<string, DashboardConfig>;
//# sourceMappingURL=dashboards.d.ts.map