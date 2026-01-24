import { TrustScore, TrustReceipt, Agent, Experiment, SystemMetrics } from '../types';

// SONATE Trust Physics - Six Pillars with Canonical Weights
const TRUST_PRINCIPLES = [
  { id: 'consent', name: 'Consent Architecture', weight: 25 },
  { id: 'inspection', name: 'Inspection Mandate', weight: 20 },
  { id: 'validation', name: 'Continuous Validation', weight: 20 },
  { id: 'override', name: 'Ethical Override', weight: 15 },
  { id: 'disconnect', name: 'Right to Disconnect', weight: 10 },
  { id: 'recognition', name: 'Moral Recognition', weight: 10 },
];

// Mock API Service Layer
export class MockApiService {
  private static instance: MockApiService;

  static getInstance(): MockApiService {
    if (!MockApiService.instance) {
      MockApiService.instance = new MockApiService();
    }
    return MockApiService.instance;
  }

  // Generate realistic trust scores based on SONATE physics
  async getTrustScore(): Promise<TrustScore> {
    // Simulate weighted scoring
    const principles = TRUST_PRINCIPLES.map(principle => {
      const score = Math.random() * 30 + 70; // 70-100 range for enterprise readiness
      const status: TrustScore['principles'][number]['status'] = score >= 90 ? 'OK' : score >= 80 ? 'WARN' : 'FAIL';
      
      return {
        ...principle,
        score: Math.round(score),
        status,
      } as const;
    });

    // Calculate weighted total score
    const total = Math.round(
      principles.reduce((sum, p) => sum + (p.score * p.weight) / 100, 0)
    );

    // Determine trust tier based on total score
    const tier = total >= 95 ? 'HIGH' : total >= 85 ? 'MEDIUM' : total >= 70 ? 'LOW' : 'CRITICAL';

    // Generate SHA-256 hash for receipt
    const receiptHash = this.generateHash('trust-score-' + Date.now());

    return {
      total,
      tier,
      principles,
      timestamp: Date.now(),
      receiptHash,
    };
  }

  // Generate trust receipt chain
  async getTrustReceipts(count: number = 10): Promise<TrustReceipt[]> {
    const receipts: TrustReceipt[] = [];
    
    for (let i = 1; i <= count; i++) {
      const hash = this.generateHash(`receipt-${i}`);
      const timestamp = new Date(Date.now() - (count - i) * 60000).toISOString();
      const actions = [
        'Trust Protocol Verified',
        'Agent Interaction Logged',
        'Drift Detection Run',
        'Emergence Analysis Complete',
        'Compliance Check Passed',
        'Audit Trail Updated',
      ];
      
      receipts.push({
        entryNumber: i,
        hash: hash.substring(0, 8),
        action: actions[Math.floor(Math.random() * actions.length)],
        timestamp,
        validated: Math.random() > 0.05, // 95% validation rate
        trustScore: Math.floor(Math.random() * 20 + 80), // 80-100 range
      });
    }

    return receipts.reverse(); // Most recent first
  }

  // Generate agent fleet data
  async getAgentFleet(): Promise<Agent[]> {
    const agentNames = [
      'Support-Alpha', 'Analysis-Beta', 'Compliance-Gamma', 
      'Research-Delta', 'Security-Epsilon', 'Finance-Zeta',
      'HR-Eta', 'Legal-Theta', 'Operations-Iota', 'Risk-Kappa',
    ];

    return agentNames.map((name, index) => {
      const trustScores = { HIGH: 95, MEDIUM: 85, LOW: 75, CRITICAL: 65 };
      const tiers = Object.keys(trustScores) as Array<keyof typeof trustScores>;
      const tier = tiers[Math.floor(Math.random() * tiers.length)];
      
      return {
        id: `agent-${index + 1}`,
        name,
        did: `did:key:z6Mk${this.generateHash(name).substring(0, 20)}`,
        trustTier: tier,
        driftState: Math.random() > 0.8 ? 'DRIFTING' : 'STABLE',
        emergenceScore: Math.floor(Math.random() * 40 + 60),
        lastReceipt: new Date(Date.now() - Math.random() * 300000).toISOString(),
        status: Math.random() > 0.95 ? 'MAINTENANCE' : 'ACTIVE',
      };
    });
  }

  // Generate experiment data
  async getExperiments(): Promise<Experiment[]> {
    return [
      {
        id: 'exp-001',
        name: 'Constitutional vs Directive AI Response',
        status: 'COMPLETED',
        armAlpha: {
          sampleSize: 1000,
          avgTrustScore: 87.3,
          driftRate: 2.1,
        },
        armBeta: {
          sampleSize: 1000,
          avgTrustScore: 82.1,
          driftRate: 3.7,
        },
        winner: 'ALPHA',
        significance: 0.023,
      },
      {
        id: 'exp-002',
        name: 'Trust Protocol Optimization',
        status: 'RUNNING',
        armAlpha: {
          sampleSize: 450,
          avgTrustScore: 84.2,
          driftRate: 1.8,
        },
        armBeta: {
          sampleSize: 452,
          avgTrustScore: 86.1,
          driftRate: 2.2,
        },
      },
      {
        id: 'exp-003',
        name: 'Drift Detection Sensitivity Analysis',
        status: 'BLINDED',
        armAlpha: {
          sampleSize: 200,
          avgTrustScore: 0, // Hidden
          driftRate: 0, // Hidden
        },
        armBeta: {
          sampleSize: 198,
          avgTrustScore: 0, // Hidden
          driftRate: 0, // Hidden
        },
      },
    ];
  }

  // Generate system metrics
  async getSystemMetrics(): Promise<SystemMetrics> {
    return {
      throughput: {
        requestsPerSecond: Math.floor(Math.random() * 500 + 1500),
        activeSessions: Math.floor(Math.random() * 5000 + 10000),
        dataProcessed: `${(Math.random() * 2 + 1).toFixed(1)}TB`,
      },
      latency: {
        current: Math.floor(Math.random() * 30 + 15),
        average: Math.floor(Math.random() * 20 + 18),
        p99: Math.floor(Math.random() * 40 + 45),
      },
      compliance: {
        euAiAct: 100,
        soc2: 100,
        gdpr: 100,
      },
      security: {
        encryption: 'AES-256',
        hashing: 'SHA-256',
        signatures: 'Ed25519',
        didVerified: true,
      },
    };
  }

  // Simulate real-time updates
  async getRealTimeUpdates(): Promise<{
    trustScore: TrustScore;
    metrics: SystemMetrics;
  }> {
    const [trustScore, metrics] = await Promise.all([
      this.getTrustScore(),
      this.getSystemMetrics(),
    ]);

    return { trustScore, metrics };
  }

  // Utility: Generate SHA-256 hash (simplified for demo)
  private generateHash(input: string): string {
    // In production, this would use crypto.subtle.digest
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
}

// Export singleton instance
export const mockApi = MockApiService.getInstance();
