import { NextRequest } from 'next/server';

// Mock the imported modules
jest.mock('@sonate/orchestrate', () => ({
  getRBACManager: () => ({
    cacheUser: jest.fn(),
  }),
  Role: {
    ADMIN: 'admin',
  },
}));

jest.mock('@sonate/core', () => ({
  SymbiScorer: jest.fn().mockImplementation(() => ({
    scoreInteraction: jest.fn().mockReturnValue({
      totalScore: 85,
      principleScores: {
        consentArchitecture: 20,
        inspectionMandate: 18,
        continuousValidation: 17,
        ethicalOverride: 15,
        rightToDisconnect: 8,
        moralRecognition: 7,
      },
    }),
  })),
  TrustProtocol: jest.fn(),
}));

jest.mock('@sonate/detect', () => ({
  SymbiFrameworkDetector: jest.fn().mockImplementation(() => ({
    analyzeContent: jest.fn().mockResolvedValue({
      assessment: {
        realityIndex: { score: 85 },
        trustProtocol: { score: 90 },
        ethicalAlignment: { score: 88 },
        resonanceQuality: { score: 92 },
        canvasParity: { score: 87 },
        overallScore: 88,
      },
    }),
  })),
}));

jest.mock('@sonate/lab', () => ({
  ExperimentOrchestrator: jest.fn(),
}));

jest.mock('@sonate/orchestrate', () => ({
  ...jest.requireActual('@sonate/orchestrate'),
  getAuditLogger: () => ({
    query: jest.fn().mockResolvedValue([
      {
        id: '1',
        timestamp: new Date().toISOString(),
        severity: 'error',
        action: 'Test error',
        eventType: 'system.error',
        outcome: 'failure',
        details: {},
      },
    ]),
  }),
  AgentOrchestrator: jest.fn(),
}));

// Import handlers after mocking
import { POST as loginHandler } from '../auth/login/route';
import { GET as kpisHandler } from '../dashboard/kpis/route';
import { GET as alertsHandler } from '../dashboard/alerts/route';
import { GET as detectHandler } from '../detect/scores/route';
import { GET as labHandler } from '../lab/experiments/route';
import { GET as agentsHandler } from '../orchestrate/agents/route';

describe('API Routes', () => {
  describe('/api/auth/login', () => {
    it('should handle valid login request', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': 'test-tenant',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'testpass',
        }),
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.username).toBe('testuser');
      expect(data.data.tenant).toBe('test-tenant');
    });

    it('should reject missing credentials', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Username and password are required');
    });
  });

  describe('/api/dashboard/kpis', () => {
    it('should return KPI data', async () => {
      const request = new NextRequest('http://localhost:3000/api/dashboard/kpis?tenant=test');

      const response = await kpisHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.trustScore).toBeDefined();
      expect(data.data.activeAgents).toBeDefined();
    });
  });

  describe('/api/dashboard/alerts', () => {
    it('should return alerts data', async () => {
      const request = new NextRequest('http://localhost:3000/api/dashboard/alerts?tenant=test');

      const response = await alertsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.alerts).toBeDefined();
      expect(data.data.summary).toBeDefined();
    });
  });

  describe('/api/detect/scores', () => {
    it('should return trust detection scores', async () => {
      const request = new NextRequest('http://localhost:3000/api/detect/scores?tenant=test');

      const response = await detectHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.latestAssessment).toBeDefined();
      expect(data.data.trustScores).toBeDefined();
    });
  });

  describe('/api/lab/experiments', () => {
    it('should return experiments data', async () => {
      const request = new NextRequest('http://localhost:3000/api/lab/experiments?tenant=test');

      const response = await labHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.experiments).toBeDefined();
      expect(data.data.summary).toBeDefined();
    });
  });

  describe('/api/orchestrate/agents', () => {
    it('should return agents data', async () => {
      const request = new NextRequest('http://localhost:3000/api/orchestrate/agents?tenant=test');

      const response = await agentsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.agents).toBeDefined();
      expect(data.data.summary).toBeDefined();
    });
  });
});