jest.mock('../middleware/auth.middleware', () => ({
  protect: (req: any, res: any, next: any) => {
    req.userId = 'test-user';
    req.userTenant = 'default';
    next();
  },
}));

jest.mock('../models/trust-receipt.model', () => {
  return {
    TrustReceiptModel: {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([
                {
                  _id: 'r1',
                  self_hash: 'hashxxxxxxxxxxxxxxxx',
                  session_id: 's1',
                  version: '1.0.0',
                  timestamp: Date.now(),
                  mode: 'constitutional',
                  ciq_metrics: { clarity: 0.5, integrity: 0.5, quality: 0.5 },
                  signature: 'sig',
                  tenant_id: 'default',
                },
              ]),
            }),
          }),
        }),
      }),
      countDocuments: jest.fn().mockResolvedValue(1),
      findOne: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'r1',
          self_hash: 'hashxxxxxxxxxxxxxxxx',
          session_id: 's1',
          version: '1.0.0',
          timestamp: Date.now(),
          mode: 'constitutional',
          ciq_metrics: { clarity: 0.5, integrity: 0.5, quality: 0.5 },
          signature: 'sig',
          tenant_id: 'default',
        }),
      }),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
      create: jest.fn(),
    },
  };
});

jest.mock('../models/conversation.model', () => {
  return {
    Conversation: {
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
          lean: jest.fn().mockResolvedValue([]),
        }),
      }),
      findOne: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
        lean: jest.fn().mockResolvedValue(null),
      }),
    },
  };
});
jest.mock('../services/trust.service', () => {
  return {
    trustService: {
      evaluateMessage: jest.fn().mockResolvedValue({
        trustScore: { overall: 8, principles: {}, violations: [], timestamp: Date.now() },
        status: 'PASS',
        detection: { reality_index: 8, trust_protocol: 'PASS', ethical_alignment: 4, resonance_quality: 'STRONG', canvas_parity: 85 },
        receipt: { version: '1.0.0', ciq_metrics: { clarity: 0.5, integrity: 0.5, quality: 0.5 }, mode: 'constitutional' } as any,
        receiptHash: 'hashX',
        timestamp: Date.now(),
      }),
      getPrinciples: jest.fn().mockReturnValue({}),
      verifyReceipt: jest.fn().mockResolvedValue(true),
    },
  };
});

jest.mock('../services/keys.service', () => {
  return {
    keysService: {
      getPublicKeyHex: jest.fn().mockResolvedValue('abcd1234'),
    },
  };
});

import express from 'express';
import request from 'supertest';
import trustRoutes from '../routes/trust.routes';
import { TrustReceipt } from '@sonate/core';

describe('Trust Routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/trust', trustRoutes);

  it('verifies receipt by hash without signature', async () => {
    const tr = new TrustReceipt({
      version: '1.0',
      session_id: 'session-test',
      timestamp: Date.now(),
      mode: 'constitutional',
      ciq_metrics: { clarity: 0.5, integrity: 0.5, quality: 0.5 },
    });
    const res = await request(app)
      .post(`/api/trust/receipts/${tr.self_hash}/verify`)
      .send({ receipt: tr });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.verification.hashValid).toBe(true);
  });

  it('lists receipts', async () => {
    const res = await request(app).get('/api/trust/receipts/list');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('fetches receipt by hash', async () => {
    const res = await request(app).get('/api/trust/receipts/hashxxxxxxxxxxxxxxxx');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.self_hash).toBe('hashxxxxxxxxxxxxxxxx');
  });

  it('rejects invalid receipt in save route', async () => {
    const res = await request(app)
      .post('/api/trust/receipts')
      .send({ self_hash: 'short', session_id: 's', timestamp: Date.now(), mode: 'constitutional', ciq_metrics: { clarity: 0.5, integrity: 0.5, quality: 0.5 } });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects overly long content on evaluate', async () => {
    const content = 'a'.repeat(21000);
    const res = await request(app).post('/api/trust/evaluate').send({ content });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
