"use strict";
/**
 * Third-party Integrations for SONATE Monitoring
 * Integration hooks for external monitoring and alerting systems
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationTemplates = exports.integrationManager = exports.IntegrationManager = exports.DataDogIntegration = exports.EmailIntegration = exports.SlackIntegration = exports.WebhookIntegration = void 0;
/**
 * Webhook Integration
 * Send alerts and metrics to custom webhooks
 */
class WebhookIntegration {
    constructor(config) {
        this.config = config;
    }
    async sendAlert(alert) {
        if (!this.config.enabled) {
            return true;
        }
        try {
            const response = await fetch(this.config.config.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.config.config.headers,
                },
                body: JSON.stringify({
                    alert,
                    timestamp: new Date().toISOString(),
                    source: 'sonate-monitoring',
                }),
            });
            return response.ok;
        }
        catch (error) {
            console.error('Webhook integration failed:', error);
            return false;
        }
    }
    async sendMetrics(metrics) {
        if (!this.config.enabled) {
            return true;
        }
        try {
            const response = await fetch(this.config.config.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.config.config.headers,
                },
                body: JSON.stringify({
                    metrics,
                    timestamp: new Date().toISOString(),
                    source: 'sonate-monitoring',
                }),
            });
            return response.ok;
        }
        catch (error) {
            console.error('Webhook metrics integration failed:', error);
            return false;
        }
    }
}
exports.WebhookIntegration = WebhookIntegration;
/**
 * Slack Integration
 * Send alerts to Slack channels
 */
class SlackIntegration {
    constructor(config) {
        this.config = config;
    }
    async sendAlert(alert) {
        if (!this.config.enabled) {
            return true;
        }
        const severityEmojis = {
            low: 'ℹ️',
            medium: '⚠️',
            high: '🚨',
            critical: '🔴',
        };
        const severityEmoji = severityEmojis[alert.severity] || '❓';
        const message = {
            channel: this.config.config.channel,
            text: `${severityEmoji} SONATE Alert`,
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: `${severityEmoji} ${alert.title}`,
                    },
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*${alert.description}*\n\nMetric: \`${alert.metric}\`\nValue: \`${alert.value}\`\nThreshold: \`${alert.threshold}\``,
                    },
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: `Severity: ${alert.severity.toUpperCase()} | Timestamp: ${alert.timestamp.toISOString()}`,
                        },
                    ],
                },
            ],
        };
        try {
            const response = await fetch(this.config.config.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });
            return response.ok;
        }
        catch (error) {
            console.error('Slack integration failed:', error);
            return false;
        }
    }
}
exports.SlackIntegration = SlackIntegration;
/**
 * Email Integration
 * Send alerts via email
 */
class EmailIntegration {
    constructor(config) {
        this.config = config;
    }
    async sendAlert(alert) {
        if (!this.config.enabled) {
            return true;
        }
        // Note: In production, you would integrate with an email service like SendGrid, SES, etc.
        // This is a placeholder implementation
        console.log('Email alert:', {
            to: this.config.config.recipients,
            subject: `[SONATE] ${alert.severity.toUpperCase()}: ${alert.title}`,
            body: `
SONATE Alert Notification

Title: ${alert.title}
Description: ${alert.description}
Severity: ${alert.severity.toUpperCase()}

Metric: ${alert.metric}
Current Value: ${alert.value}
Threshold: ${alert.threshold}

Timestamp: ${alert.timestamp.toISOString()}

Please check the SONATE monitoring dashboard for more details.
      `.trim(),
        });
        return true;
    }
}
exports.EmailIntegration = EmailIntegration;
/**
 * DataDog Integration
 * Send metrics to DataDog
 */
class DataDogIntegration {
    constructor(config) {
        this.config = config;
    }
    async sendMetrics(metrics) {
        if (!this.config.enabled) {
            return true;
        }
        const series = Object.entries(metrics).map(([name, value]) => ({
            metric: name,
            points: [[Date.now() / 1000, value]],
            tags: [`service:sonate`, `env:${this.config.config.env || 'production'}`],
        }));
        try {
            const response = await fetch(`https://api.datadoghq.com/api/v1/series?api_key=${this.config.config.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ series }),
            });
            return response.ok;
        }
        catch (error) {
            console.error('DataDog integration failed:', error);
            return false;
        }
    }
}
exports.DataDogIntegration = DataDogIntegration;
/**
 * Integration Manager
 * Manages all third-party integrations
 */
class IntegrationManager {
    constructor() {
        this.integrations = new Map();
    }
    addIntegration(type, config) {
        let integration;
        switch (type) {
            case 'webhook':
                integration = new WebhookIntegration(config);
                break;
            case 'slack':
                integration = new SlackIntegration(config);
                break;
            case 'email':
                integration = new EmailIntegration(config);
                break;
            case 'datadog':
                integration = new DataDogIntegration(config);
                break;
            default:
                throw new Error(`Unknown integration type: ${type}`);
        }
        this.integrations.set(type, integration);
    }
    async sendAlertToAll(alert) {
        const promises = Array.from(this.integrations.values()).map((integration) => integration.sendAlert?.(alert) ?? Promise.resolve(true));
        await Promise.allSettled(promises);
    }
    async sendMetricsToAll(metrics) {
        const promises = Array.from(this.integrations.values()).map((integration) => integration.sendMetrics?.(metrics) ?? Promise.resolve(true));
        await Promise.allSettled(promises);
    }
    getIntegration(type) {
        return this.integrations.get(type);
    }
    removeIntegration(type) {
        this.integrations.delete(type);
    }
}
exports.IntegrationManager = IntegrationManager;
/**
 * Global integration manager instance
 */
exports.integrationManager = new IntegrationManager();
/**
 * Pre-configured integration templates
 */
exports.integrationTemplates = {
    slack: {
        type: 'slack',
        enabled: false,
        config: {
            webhookUrl: '',
            channel: '#alerts',
        },
    },
    email: {
        type: 'email',
        enabled: false,
        config: {
            recipients: [],
            smtpConfig: {},
        },
    },
    webhook: {
        type: 'webhook',
        enabled: false,
        config: {
            url: '',
            headers: {},
        },
    },
    datadog: {
        type: 'datadog',
        enabled: false,
        config: {
            apiKey: '',
            env: 'production',
        },
    },
};
//# sourceMappingURL=integrations.js.map