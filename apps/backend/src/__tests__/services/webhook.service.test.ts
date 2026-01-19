import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock mongoose before importing the service
vi.mock('mongoose', async () => {
  const actual = await vi.importActual('mongoose');
  return {
    ...actual,
    default: {
      ...actual,
      Types: {
        ObjectId: class ObjectId {
          private id: string;
          constructor(id?: string) {
            this.id = id || 'mock-id-' + Math.random().toString(36).substr(2, 9);
          }
          toString() {
            return this.id;
          }
        },
      },
      models: {},
      model: vi.fn(),
    },
  };
});

// Mock models
vi.mock('../../models/webhook-config.model', () => ({
  WebhookConfigModel: {
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
    create: vi.fn(),
  },
  AlertSeverity: {},
}));

vi.mock('../../models/webhook-delivery.model', () => ({
  WebhookDeliveryModel: {
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    create: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
  },
}));

vi.mock('../../models/alert.model', () => ({
  AlertModel: {},
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import after mocks
import { webhookService } from '../webhook.service';
import { WebhookConfigModel } from '../../models/webhook-config.model';
import { WebhookDeliveryModel } from '../../models/webhook-delivery.model';

describe('WebhookService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('evaluateRules', () => {
    it('should return matching rule when conditions are met', () => {
      const rules = [
        {
          id: 'rule-1',
          name: 'High Trust Alert',
          conditions: [
            { metric: 'trustScore', operator: 'lt' as const, threshold: 0.5 },
          ],
          severity: 'critical' as const,
          enabled: true,
        },
      ];

      const metrics = { trustScore: 0.3 };
      const alert = { severity: 'critical', type: 'trust_low' } as any;

      const result = webhookService.evaluateRules(rules, metrics, alert);
      expect(result).toBeDefined();
      expect(result?.id).toBe('rule-1');
    });

    it('should return undefined when no rules match', () => {
      const rules = [
        {
          id: 'rule-1',
          name: 'High Trust Alert',
          conditions: [
            { metric: 'trustScore', operator: 'lt' as const, threshold: 0.5 },
          ],
          severity: 'critical' as const,
          enabled: true,
        },
      ];

      const metrics = { trustScore: 0.8 }; // Above threshold
      const alert = { severity: 'critical', type: 'trust_low' } as any;

      const result = webhookService.evaluateRules(rules, metrics, alert);
      expect(result).toBeUndefined();
    });

    it('should skip disabled rules', () => {
      const rules = [
        {
          id: 'rule-1',
          name: 'Disabled Rule',
          conditions: [
            { metric: 'trustScore', operator: 'lt' as const, threshold: 0.5 },
          ],
          enabled: false, // Disabled
        },
      ];

      const metrics = { trustScore: 0.3 };
      const alert = { severity: 'critical', type: 'trust_low' } as any;

      const result = webhookService.evaluateRules(rules, metrics, alert);
      expect(result).toBeUndefined();
    });

    it('should require all conditions to match', () => {
      const rules = [
        {
          id: 'rule-1',
          name: 'Multi-condition Rule',
          conditions: [
            { metric: 'trustScore', operator: 'lt' as const, threshold: 0.5 },
            { metric: 'driftScore', operator: 'gt' as const, threshold: 0.7 },
          ],
          enabled: true,
        },
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
      const testCases = [
        { operator: 'gt' as const, threshold: 0.5, value: 0.6, expected: true },
        { operator: 'gt' as const, threshold: 0.5, value: 0.5, expected: false },
        { operator: 'gte' as const, threshold: 0.5, value: 0.5, expected: true },
        { operator: 'lt' as const, threshold: 0.5, value: 0.4, expected: true },
        { operator: 'lt' as const, threshold: 0.5, value: 0.5, expected: false },
        { operator: 'lte' as const, threshold: 0.5, value: 0.5, expected: true },
        { operator: 'eq' as const, threshold: 0.5, value: 0.5, expected: true },
        { operator: 'eq' as const, threshold: 0.5, value: 0.6, expected: false },
        { operator: 'neq' as const, threshold: 0.5, value: 0.6, expected: true },
        { operator: 'neq' as const, threshold: 0.5, value: 0.5, expected: false },
      ];

      for (const tc of testCases) {
        const rules = [
          {
            id: 'rule-test',
            name: 'Test Rule',
            conditions: [
              { metric: 'score', operator: tc.operator, threshold: tc.threshold },
            ],
            enabled: true,
          },
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
        sort: vi.fn().mockResolvedValue(mockConfigs),
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
        channels: [{ type: 'webhook', name: 'Test', url: 'https://example.com' }],
      };

      (WebhookConfigModel.create as any).mockResolvedValue(mockConfig);

      const result = await webhookService.createConfig({
        name: 'New Webhook',
        tenantId: 'tenant-1',
        channels: [{ type: 'webhook', name: 'Test', url: 'https://example.com', enabled: true }],
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
      expect(result.successRate).toBeUndefined(); // Only calculated in route
    });

    it('should return zeros when no deliveries exist', async () => {
      (WebhookDeliveryModel.aggregate as any).mockResolvedValue([]);

      const result = await webhookService.getDeliveryStats('config-1', 24);

      expect(result.total).toBe(0);
      expect(result.success).toBe(0);
    });
  });
});
