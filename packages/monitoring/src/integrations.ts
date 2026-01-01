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
export class WebhookIntegration {
  private config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  async sendAlert(alert: any): Promise<boolean> {
    if (!this.config.enabled) return true;

    try {
      const response = await fetch(this.config.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.config.headers
        },
        body: JSON.stringify({
          alert,
          timestamp: new Date().toISOString(),
          source: 'sonate-monitoring'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Webhook integration failed:', error);
      return false;
    }
  }

  async sendMetrics(metrics: any): Promise<boolean> {
    if (!this.config.enabled) return true;

    try {
      const response = await fetch(this.config.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.config.headers
        },
        body: JSON.stringify({
          metrics,
          timestamp: new Date().toISOString(),
          source: 'sonate-monitoring'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Webhook metrics integration failed:', error);
      return false;
    }
  }
}

/**
 * Slack Integration
 * Send alerts to Slack channels
 */
export class SlackIntegration {
  private config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  async sendAlert(alert: any): Promise<boolean> {
    if (!this.config.enabled) return true;

    const severityEmojis: Record<string, string> = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🚨',
      critical: '🔴'
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
            text: `${severityEmoji} ${alert.title}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${alert.description}*\n\nMetric: \`${alert.metric}\`\nValue: \`${alert.value}\`\nThreshold: \`${alert.threshold}\``
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Severity: ${alert.severity.toUpperCase()} | Timestamp: ${alert.timestamp.toISOString()}`
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch(this.config.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      return response.ok;
    } catch (error) {
      console.error('Slack integration failed:', error);
      return false;
    }
  }
}

/**
 * Email Integration
 * Send alerts via email
 */
export class EmailIntegration {
  private config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  async sendAlert(alert: any): Promise<boolean> {
    if (!this.config.enabled) return true;

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
      `.trim()
    });

    return true;
  }
}

/**
 * DataDog Integration
 * Send metrics to DataDog
 */
export class DataDogIntegration {
  private config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  async sendMetrics(metrics: any): Promise<boolean> {
    if (!this.config.enabled) return true;

    const series = Object.entries(metrics).map(([name, value]: [string, any]) => ({
      metric: name,
      points: [[Date.now() / 1000, value]],
      tags: [`service:sonate`, `env:${this.config.config.env || 'production'}`]
    }));

    try {
      const response = await fetch(`https://api.datadoghq.com/api/v1/series?api_key=${this.config.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ series })
      });

      return response.ok;
    } catch (error) {
      console.error('DataDog integration failed:', error);
      return false;
    }
  }
}

/**
 * Integration Manager
 * Manages all third-party integrations
 */
export class IntegrationManager {
  private integrations: Map<string, any> = new Map();

  addIntegration(type: string, config: IntegrationConfig): void {
    let integration: any;

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

  async sendAlertToAll(alert: any): Promise<void> {
    const promises = Array.from(this.integrations.values()).map(integration =>
      integration.sendAlert?.(alert) ?? Promise.resolve(true)
    );

    await Promise.allSettled(promises);
  }

  async sendMetricsToAll(metrics: any): Promise<void> {
    const promises = Array.from(this.integrations.values()).map(integration =>
      integration.sendMetrics?.(metrics) ?? Promise.resolve(true)
    );

    await Promise.allSettled(promises);
  }

  getIntegration(type: string): any {
    return this.integrations.get(type);
  }

  removeIntegration(type: string): void {
    this.integrations.delete(type);
  }
}

/**
 * Global integration manager instance
 */
export const integrationManager = new IntegrationManager();

/**
 * Pre-configured integration templates
 */
export const integrationTemplates = {
  slack: {
    type: 'slack' as const,
    enabled: false,
    config: {
      webhookUrl: '',
      channel: '#alerts'
    }
  },

  email: {
    type: 'email' as const,
    enabled: false,
    config: {
      recipients: [],
      smtpConfig: {}
    }
  },

  webhook: {
    type: 'webhook' as const,
    enabled: false,
    config: {
      url: '',
      headers: {}
    }
  },

  datadog: {
    type: 'datadog' as const,
    enabled: false,
    config: {
      apiKey: '',
      env: 'production'
    }
  }
};