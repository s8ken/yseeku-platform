jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  const ObjectId = class ObjectId {
    id: string;
    constructor(id?: string) {
      this.id = id || 'mock-id-' + Math.random().toString(36).substring(2, 11);
    }
    toString() {
      return this.id;
    }
  };

  return {
    ...actual,
    Types: { ...actual.Types, ObjectId },
    default: {
      ...actual,
      Types: { ...actual.Types, ObjectId },
      models: {},
      model: jest.fn(),
    },
  };
});

// Mock models
jest.mock('../../models/webhook-config.model', () => ({
  WebhookConfigModel: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
  },
  AlertSeverity: {},
}));

jest.mock('../../models/webhook-delivery.model', () => ({
  WebhookDeliveryModel: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}));

jest.mock('../../models/alert.model', () => ({
  AlertModel: {},
}));

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { webhookService } from '../../services/webhook.service';
import { WebhookConfigModel } from '../../models/webhook-config.model';
import { WebhookDeliveryModel } from '../../models/webhook-delivery.model';
import type { AlertRule, AlertCondition } from '../../models/webhook-config.model';

type Operator = AlertCondition['operator'];

// Helper to build a valid AlertRule for tests
function buildRule(overrides: {
  id: string;
  name: string;
  enabled?: boolean;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  cooldownMinutes?: number;
  conditions?: Array<{ metric: string; operator: Operator; threshold: number }>;
}): AlertRule {
  const conditions: AlertCondition[] = (overrides.conditions || []).map(c => ({
    field: c.metric,
    operator: c.operator,
    value: c.threshold,
  }));
  return {
    id: overrides.id,
    name: overrides.name,
    enabled: overrides.enabled ?? true,
    severity: overrides.severity,
    condition: conditions[0] || { field: '', operator: 'eq' as Operator, value: 0 },
    conditions,
    cooldownMinutes: overrides.cooldownMinutes ?? 5,
  };
}

describe('WebhookService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('evaluateRules', () => {
    it('should return matching rule when conditions are met', () => {
      const rules: AlertRule[] = [
        buildRule({
          id: 'rule-1',
          name: 'High Trust Alert',
          conditions: [
            { metric: 'trustScore', operator: 'lt', threshold: 0.5 },
          ],
          severity: 'critical',
        }),
      ];

      const metrics = { trustScore: 0.3 };
      const alert = { severity: 'critical', type: 'trust_low' } as any;

      const result = webhookService.evaluateRules(rules, metrics, alert);
      expect(result).toBeDefined();
      expect(result?.id).toBe('rule-1');
    });

    it('should return undefined when no rules match', () => {
      const rules: AlertRule[] = [
        buildRule({
          id: 'rule-1',
          name: 'High Trust Alert',
          conditions: [
            { metric: 'trustScore', operator: 'lt', threshold: 0.5 },
          ],
          severity: 'critical',
        }),
      ];

      const metrics = { trustScore: 0.8 }; // Above threshold
      const alert = { severity: 'critical', type: 'trust_low' } as any;

      const result = webhookService.evaluateRules(rules, metrics, alert);
      expect(result).toBeUndefined();
    });

    it('should skip disabled rules', () => {
      const rules: AlertRule[] = [
        buildRule({
          id: 'rule-1',
          name: 'Disabled Rule',
          conditions: [
            { metric: 'trustScore', operator: 'lt', threshold: 0.5 },
          ],
          enabled: false,
        }),
      ];

      const metrics = { trustScore: 0.3 };
      const alert = { severity: 'critical', type: 'trust_low' } as any;

      const result = webhookService.evaluateRules(rules, metrics, alert);
      expect(result).toBeUndefined();
    });

    it('should require all conditions to match', () => {
      const rules: AlertRule[] = [
        buildRule({
          id: 'rule-1',
          name: 'Multi-condition Rule',
          conditions: [
            { metric: 'trustScore', operator: 'lt', threshold: 0.5 },
            { metric: 'driftScore', operator: 'gt', threshold: 0.7 },
          ],
        }),
      ];

      // Only one condition met
      const metrics = { trustScore: 0.3, driftScore: 0.5 };
      const alert = { severity: 'warning', type: 'drift' } as any;

      const result = webhookService.evaluateRules(rules, metrics, alert);
      expect(result).toBeUndefined();

      // Both conditions met
      const metrics2 = { trustScore: 0.3, driftScore: 0.9 };
      const result2 = webhookService.evaluateRules(rules, metrics2, alert);
      expect(result2).toBeDefined();
      expect(result2?.id).toBe('rule-1');
    });

    it('should support all operators', () => {
      const testCases: Array<{ operator: Operator; threshold: number; value: number; expected: boolean }> = [
        { operator: 'gt', threshold: 0.5, value: 0.6, expected: true },
        { operator: 'gt', threshold: 0.5, value: 0.5, expected: false },
        { operator: 'gte', threshold: 0.5, value: 0.5, expected: true },
        { operator: 'lt', threshold: 0.5, value: 0.4, expected: true },
        { operator: 'lt', threshold: 0.5, value: 0.5, expected: false },
        { operator: 'lte', threshold: 0.5, value: 0.5, expected: true },
        { operator: 'eq', threshold: 0.5, value: 0.5, expected: true },
        { operator: 'eq', threshold: 0.5, value: 0.6, expected: false },
        { operator: 'ne', threshold: 0.5, value: 0.6, expected: true },
        { operator: 'ne', threshold: 0.5, value: 0.5, expected: false },
      ];

      for (const tc of testCases) {
        const rules: AlertRule[] = [
          buildRule({
            id: 'rule-test',
            name: 'Test Rule',
            conditions: [
              { metric: 'score', operator: tc.operator, threshold: tc.threshold },
            ],
          }),
        ];

        const metrics = { score: tc.value };
        const alert = { severity: 'info', type: 'test' } as any;
        const result = webhookService.evaluateRules(rules, metrics, alert);

        if (tc.expected) {
          expect(result).toBeDefined();
        } else {
          expect(result).toBeUndefined();
        }
      }
    });
  });

  describe('CRUD operations', () => {
    it('should list configs for tenant', async () => {
      const mockConfigs = [
        { _id: 'config-1', name: 'Slack Alerts', tenantId: 'tenant-1' },
        { _id: 'config-2', name: 'PagerDuty', tenantId: 'tenant-1' },
      ];

      (WebhookConfigModel.find as any).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockConfigs),
      });

      const result = await webhookService.listConfigs('tenant-1');

      expect(WebhookConfigModel.find).toHaveBeenCalledWith({ tenantId: 'tenant-1' });
      expect(result).toHaveLength(2);
    });

    it('should create config with correct data', async () => {
      const mockConfig = {
        _id: 'new-config',
        name: 'New Webhook',
        tenantId: 'tenant-1',
        channels: [{ type: 'webhook', url: 'https://example.com' }],
      };

      (WebhookConfigModel.create as any).mockResolvedValue(mockConfig);

      const result = await webhookService.createConfig({
        name: 'New Webhook',
        tenantId: 'tenant-1',
        channels: [{ type: 'webhook', url: 'https://example.com' } as any],
      });

      expect(WebhookConfigModel.create).toHaveBeenCalled();
      expect(result.name).toBe('New Webhook');
    });

    it('should update config', async () => {
      const mockConfig = {
        _id: 'config-1',
        name: 'Updated Webhook',
        enabled: false,
      };

      (WebhookConfigModel.findByIdAndUpdate as any).mockResolvedValue(mockConfig);

      const result = await webhookService.updateConfig('config-1', { enabled: false });

      expect(WebhookConfigModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(result?.enabled).toBe(false);
    });

    it('should delete config', async () => {
      (WebhookConfigModel.findByIdAndDelete as any).mockResolvedValue({ _id: 'config-1' });

      const result = await webhookService.deleteConfig('config-1');

      expect(WebhookConfigModel.findByIdAndDelete).toHaveBeenCalledWith('config-1');
      expect(result).toBe(true);
    });

    it('should return false when deleting non-existent config', async () => {
      (WebhookConfigModel.findByIdAndDelete as any).mockResolvedValue(null);

      const result = await webhookService.deleteConfig('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getDeliveryStats', () => {
    it('should aggregate delivery statistics', async () => {
      const mockStats = [{
        _id: null,
        total: 100,
        success: 95,
        failed: 3,
        retrying: 2,
        avgResponseTime: 150,
      }];

      (WebhookDeliveryModel.aggregate as any).mockResolvedValue(mockStats);

      const result = await webhookService.getDeliveryStats('config-1', 24);

      expect(WebhookDeliveryModel.aggregate).toHaveBeenCalled();
      expect(result.total).toBe(100);
      expect(result.success).toBe(95);
      // successRate is calculated at the route layer, not in the service
      expect((result as any).successRate).toBeUndefined();
    });

    it('should return zeros when no deliveries exist', async () => {
      (WebhookDeliveryModel.aggregate as any).mockResolvedValue([]);

      const result = await webhookService.getDeliveryStats('config-1', 24);

      expect(result.total).toBe(0);
      expect(result.success).toBe(0);
    });
  });
});
