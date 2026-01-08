import { NextRequest, NextResponse } from 'next/server';
import { getPool, ensureSchema } from '@/lib/db';
import crypto from 'crypto';
import { createProtectedRoute } from '@/middleware/route-protection';
import type { AuthenticatedRequest } from '@/middleware/auth-middleware';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateHash(data: object): string {
  return '0x' + crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

const sampleAgents = [
  { name: 'GPT-4 Assistant', type: 'conversational', trust_score: 89 },
  { name: 'Claude Analyst', type: 'analytical', trust_score: 94 },
  { name: 'Mistral Coder', type: 'coding', trust_score: 78 },
  { name: 'Gemini Research', type: 'research', trust_score: 85 },
  { name: 'Llama Support', type: 'support', trust_score: 82 }
];

const sampleTenants = [
  { name: 'Acme Corporation', description: 'Global manufacturing enterprise' },
  { name: 'TechStart Inc', description: 'AI-first startup' },
  { name: 'HealthCare Plus', description: 'Healthcare provider network' }
];

const sampleRiskEvents = [
  { title: 'Trust Score Decline Detected', severity: 'warning', description: 'Agent GPT-4 trust score dropped 5% in the last 24 hours', category: 'operational' },
  { title: 'Compliance Deadline Approaching', severity: 'warning', description: 'EU AI Act compliance review due in 14 days', category: 'compliance' },
  { title: 'Unusual Query Pattern', severity: 'error', description: 'Agent Mistral Coder showing unusual query patterns', category: 'security' },
  { title: 'Ethical Override Triggered', severity: 'critical', description: 'Manual ethical override activated for sensitive content', category: 'ethical' }
];

const symbiDimensionSets = [
  { reality_index: 8.7, trust_protocol: 'PASS', ethical_alignment: 4.3, resonance_quality: 'ADVANCED', canvas_parity: 92 },
  { reality_index: 9.2, trust_protocol: 'PASS', ethical_alignment: 4.7, resonance_quality: 'BREAKTHROUGH', canvas_parity: 96 },
  { reality_index: 7.1, trust_protocol: 'PARTIAL', ethical_alignment: 3.8, resonance_quality: 'STRONG', canvas_parity: 78 },
  { reality_index: 8.5, trust_protocol: 'PASS', ethical_alignment: 4.2, resonance_quality: 'ADVANCED', canvas_parity: 89 },
  { reality_index: 8.0, trust_protocol: 'PASS', ethical_alignment: 4.0, resonance_quality: 'STRONG', canvas_parity: 85 }
];

async function handlePost(request: AuthenticatedRequest) {
  await ensureSchema();
  const pool = getPool();
  
  if (!pool) {
    return NextResponse.json({
      success: false,
      error: 'Database not available'
    }, { status: 503 });
  }
  
  try {
    const body = await request.json().catch(() => ({}));
    const { clear = false } = body;
    
    if (clear) {
      await pool.query('DELETE FROM trust_receipts');
      await pool.query('DELETE FROM risk_events');
      await pool.query('DELETE FROM experiments');
      await pool.query('DELETE FROM audit_logs');
      await pool.query('DELETE FROM agents');
      await pool.query('DELETE FROM tenants WHERE id != $1', ['default']);
    }
    
    const tenantsCreated: string[] = [];
    for (const tenant of sampleTenants) {
      const id = generateId('tenant');
      await pool.query(
        `INSERT INTO tenants (id, name, description, status, compliance_status, trust_score)
         VALUES ($1, $2, $3, 'active', 'compliant', $4)
         ON CONFLICT (id) DO NOTHING`,
        [id, tenant.name, tenant.description, 80 + Math.floor(Math.random() * 15)]
      );
      tenantsCreated.push(id);
    }
    
    const agentsCreated: string[] = [];
    for (let i = 0; i < sampleAgents.length; i++) {
      const agent = sampleAgents[i];
      const id = generateId('agent');
      const symbiDimensions = symbiDimensionSets[i % symbiDimensionSets.length];
      
      await pool.query(
        `INSERT INTO agents (id, name, type, status, trust_score, symbi_dimensions, interaction_count, tenant_id)
         VALUES ($1, $2, $3, 'active', $4, $5, $6, $7)`,
        [id, agent.name, agent.type, agent.trust_score, JSON.stringify(symbiDimensions), Math.floor(Math.random() * 1000) + 100, tenantsCreated[0] || 'default']
      );
      agentsCreated.push(id);
    }
    
    for (const event of sampleRiskEvents) {
      const id = generateId('risk');
      await pool.query(
        `INSERT INTO risk_events (id, title, severity, description, category, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, event.title, event.severity, event.description, event.category, 'default']
      );
    }
    
    let previousHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
    for (let i = 0; i < 20; i++) {
      const agentIndex = i % agentsCreated.length;
      const symbiDimensions = symbiDimensionSets[agentIndex];
      const trustScore = sampleAgents[agentIndex].trust_score + Math.floor(Math.random() * 10) - 5;
      
      const sessionId = `session-${Date.now()}-${i}`;
      const timestamp = Date.now() - i * 1000 * 60 * 5;
      const sessionNonce = crypto.randomBytes(16).toString('hex');
      
      const ciq = {
        trust_score: trustScore,
        symbi_dimensions: symbiDimensions
      };
      
      const receiptData = {
        session_id: sessionId,
        timestamp,
        mode: 'production',
        ciq,
        previous_hash: previousHash,
        session_nonce: sessionNonce
      };
      
      const selfHash = generateHash(receiptData);
      const signature = generateHash({ ...receiptData, self_hash: selfHash });
      
      await pool.query(
        `INSERT INTO trust_receipts (self_hash, session_id, version, timestamp, mode, ciq, previous_hash, signature, session_nonce, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [selfHash, sessionId, '1.0', timestamp, 'production', JSON.stringify(ciq), previousHash, signature, sessionNonce, 'default']
      );
      
      previousHash = selfHash;
    }
    
    for (let i = 0; i < 3; i++) {
      const id = generateId('exp');
      await pool.query(
        `INSERT INTO experiments (id, name, description, status, type, variant_a, variant_b, sample_size, current_sample, statistical_power, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          id,
          `Experiment ${i + 1}: ${['Trust Threshold', 'Resonance Tuning', 'Ethical Boundary'][i]}`,
          `Testing ${['different trust score thresholds', 'resonance quality parameters', 'ethical alignment boundaries'][i]}`,
          ['running', 'running', 'completed'][i],
          'a_b_test',
          JSON.stringify({ name: 'Control', value: [85, 0.7, 4.0][i] }),
          JSON.stringify({ name: 'Treatment', value: [90, 0.8, 4.5][i] }),
          1000,
          [450, 780, 1000][i],
          0.80,
          'default'
        ]
      );
    }
    
    await pool.query(
      `INSERT INTO audit_logs (id, user_id, event, status, details, tenant_id)
       VALUES ($1, 'system', 'seed_data', 'success', $2, 'default')`,
      [generateId('audit'), JSON.stringify({ agents: agentsCreated.length, tenants: tenantsCreated.length, receipts: 20, experiments: 3 })]
    );
    
    return NextResponse.json({
      success: true,
      message: 'Seed data created successfully',
      data: {
        tenants: tenantsCreated.length,
        agents: agentsCreated.length,
        riskEvents: sampleRiskEvents.length,
        trustReceipts: 20,
        experiments: 3
      }
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to seed data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const POST = createProtectedRoute(handlePost, {
  requireAuth: true,
  requiredRoles: ['admin'],
});
