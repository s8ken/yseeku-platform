/**
 * Third-party Integrations for SONATE Monitoring
 * Integration hooks for external monitoring and alerting systems
 */
export interface IntegrationConfig {
    type: 'webhook' | 'slack' | 'email' | 'pagerduty' | 'datadog' | 'newrelic';
    enabled: boolean;
    config: Record<string, any>;
}
/**
 * Webhook Integration
 * Send alerts and metrics to custom webhooks
 */
export declare class WebhookIntegration {
    private config;
    constructor(config: IntegrationConfig);
    sendAlert(alert: any): Promise<boolean>;
    sendMetrics(metrics: any): Promise<boolean>;
}
/**
 * Slack Integration
 * Send alerts to Slack channels
 */
export declare class SlackIntegration {
    private config;
    constructor(config: IntegrationConfig);
    sendAlert(alert: any): Promise<boolean>;
}
/**
 * Email Integration
 * Send alerts via email
 */
export declare class EmailIntegration {
    private config;
    constructor(config: IntegrationConfig);
    sendAlert(alert: any): Promise<boolean>;
}
/**
 * DataDog Integration
 * Send metrics to DataDog
 */
export declare class DataDogIntegration {
    private config;
    constructor(config: IntegrationConfig);
    sendMetrics(metrics: any): Promise<boolean>;
}
/**
 * Integration Manager
 * Manages all third-party integrations
 */
export declare class IntegrationManager {
    private integrations;
    addIntegration(type: string, config: IntegrationConfig): void;
    sendAlertToAll(alert: any): Promise<void>;
    sendMetricsToAll(metrics: any): Promise<void>;
    getIntegration(type: string): any;
    removeIntegration(type: string): void;
}
/**
 * Global integration manager instance
 */
export declare const integrationManager: IntegrationManager;
/**
 * Pre-configured integration templates
 */
export declare const integrationTemplates: {
    slack: {
        type: "slack";
        enabled: boolean;
        config: {
            webhookUrl: string;
            channel: string;
        };
    };
    email: {
        type: "email";
        enabled: boolean;
        config: {
            recipients: never[];
            smtpConfig: {};
        };
    };
    webhook: {
        type: "webhook";
        enabled: boolean;
        config: {
            url: string;
            headers: {};
        };
    };
    datadog: {
        type: "datadog";
        enabled: boolean;
        config: {
            apiKey: string;
            env: string;
        };
    };
};
//# sourceMappingURL=integrations.d.ts.map