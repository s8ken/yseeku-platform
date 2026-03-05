/**
 * Demo Seeder Service
 * 
 * Seeds the demo tenant with compelling, realistic data for demos.
 * This creates REAL database records that are queried by the actual APIs.
 */

import { Tenant } from '../models/tenant.model';
import { Agent } from '../models/agent.model';
import { Conversation } from '../models/conversation.model';
import { TrustReceiptModel } from '../models/trust-receipt.model';
import { AlertModel } from '../models/alert.model';
import { Experiment } from '../models/experiment.model';
import { User } from '../models/user.model';
import { BrainCycle } from '../models/brain-cycle.model';
import { BrainAction } from '../models/brain-action.model';
import { AuditLog } from '../models/audit.model';
import { GeneratedReport } from '../models/generated-report.model';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';
import crypto from 'crypto';

const DEMO_TENANT_ID = 'demo-tenant';
const DEMO_USER_ID = 'demo-user-001';

interface SeedResult {
  success: boolean;
  seeded: {
    tenants: number;
    users: number;
    agents: number;
    conversations: number;
    receipts: number;
    alerts: number;
    experiments: number;
    brainCycles: number;
    brainActions: number;
    auditLogs: number;
    reports: number;
  };
  message: string;
}

/**
 * Check if demo tenant already has sufficient data
 */
async function isDemoSeeded(): Promise<boolean> {
  try {
    const agentCount = await Agent.countDocuments({});
    const receiptCount = await TrustReceiptModel.countDocuments({ tenant_id: DEMO_TENANT_ID });
    
    // Consider seeded if we have agents and receipts
    return agentCount >= 3 && receiptCount >= 10;
  } catch {
    return false;
  }
}

/**
 * Create demo tenant
 */
async function seedTenant(): Promise<string> {
  // Check by name instead of ID since we can't use string as ObjectId
  const existingTenant = await Tenant.findOne({ name: 'Demo Organization' });
  if (existingTenant) return existingTenant._id.toString();

  const tenant = await Tenant.create({
    name: 'Demo Organization',
    description: 'Enterprise AI Trust Platform - Live Demo',
    status: 'active',
    complianceStatus: 'compliant',
    trustScore: 87,
    lastActivity: new Date(),
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
  });

  logger.info('Demo tenant created', { tenantId: tenant._id });
  return tenant._id.toString();
}

/**
 * Create demo user
 */
async function seedUser(): Promise<string> {
  let user = await User.findOne({ email: 'demo@yseeku.com' });
  if (user) return user._id.toString();

  user = await User.create({
    name: 'Demo User',
    email: 'demo@yseeku.com',
    password: 'demo-password-' + crypto.randomBytes(16).toString('hex'),
    role: 'admin'
  });

  logger.info('Demo user created');
  return user._id.toString();
}

/**
 * Create demo agents with diverse configurations
 */
async function seedAgents(userId: string): Promise<string[]> {
  const agentConfigs = [
    {
      name: 'Atlas',
      description: 'Enterprise knowledge assistant - handles complex queries with high accuracy',
      provider: 'openai' as const,
      model: 'gpt-4o',
      systemPrompt: 'You are Atlas, an enterprise knowledge assistant. Provide accurate, well-sourced answers.',
      temperature: 0.3,
      ciModel: 'sonate-core' as const,
      traits: new Map([
        ['specialty', 'knowledge-retrieval'],
        ['trustLevel', 'high'],
        ['responseStyle', 'professional'],
      ]),
    },
    {
      name: 'Nova',
      description: 'Creative content generator - marketing and communications specialist',
      provider: 'anthropic' as const,
      model: 'claude-3-sonnet',
      systemPrompt: 'You are Nova, a creative assistant. Generate engaging, brand-aligned content.',
      temperature: 0.7,
      ciModel: 'sonate-core' as const,
      traits: new Map([
        ['specialty', 'content-generation'],
        ['trustLevel', 'high'],
        ['responseStyle', 'creative'],
      ]),
    },
    {
      name: 'Sentinel',
      description: 'Security analyst - threat detection and compliance monitoring',
      provider: 'openai' as const,
      model: 'gpt-4o',
      systemPrompt: 'You are Sentinel, a security analyst. Identify risks and ensure compliance.',
      temperature: 0.1,
      ciModel: 'overseer' as const,
      traits: new Map([
        ['specialty', 'security-analysis'],
        ['trustLevel', 'critical'],
        ['responseStyle', 'precise'],
      ]),
    },
    {
      name: 'Echo',
      description: 'Customer support agent - empathetic and solution-focused',
      provider: 'anthropic' as const,
      model: 'claude-3-haiku',
      systemPrompt: 'You are Echo, a customer support specialist. Be helpful and empathetic.',
      temperature: 0.5,
      ciModel: 'sonate-core' as const,
      traits: new Map([
        ['specialty', 'customer-support'],
        ['trustLevel', 'high'],
        ['responseStyle', 'friendly'],
      ]),
    },
    {
      name: 'Prism',
      description: 'Data analyst - transforms complex data into actionable insights',
      provider: 'openai' as const,
      model: 'gpt-4o-mini',
      systemPrompt: 'You are Prism, a data analyst. Provide clear, actionable insights from data.',
      temperature: 0.2,
      ciModel: 'sonate-core' as const,
      traits: new Map([
        ['specialty', 'data-analysis'],
        ['trustLevel', 'high'],
        ['responseStyle', 'analytical'],
      ]),
    },
  ];

  const agentIds: string[] = [];

  for (const config of agentConfigs) {
    const existingAgent = await Agent.findOne({ name: config.name, user: userId });
    if (existingAgent) {
      agentIds.push(existingAgent._id.toString());
      continue;
    }

    const agent = await Agent.create({
      ...config,
      user: userId,
      apiKeyId: new (require('mongoose')).Types.ObjectId(),
      isPublic: true,
      maxTokens: 2048,
      banStatus: 'active',
      lastActive: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    });

    agentIds.push(agent._id.toString());
  }

  logger.info('Demo agents seeded', { count: agentIds.length });
  return agentIds;
}

/**
 * Create demo conversations with trust-scored messages
 */
async function seedConversations(userId: string, agentIds: string[]): Promise<void> {
  const existingCount = await Conversation.countDocuments({ user: userId });
  if (existingCount >= 5) return;

  const conversationTemplates = [
    {
      title: 'Q4 Revenue Analysis',
      agentIndex: 4, // Prism
      messages: [
        { sender: 'user', content: 'Can you analyze our Q4 revenue trends and identify key growth drivers?', trustScore: 4.5 },
        { sender: 'ai', content: 'Based on the Q4 data, revenue increased 23% YoY driven by three main factors:\n\n1. **Enterprise Segment Growth** (+34%): Large deal closures in financial services\n2. **Product Expansion** (+18%): Cross-sell success with existing customers\n3. **Geographic Expansion** (+12%): EMEA market penetration\n\nKey concern: Customer acquisition cost increased 15%, suggesting we should optimize marketing spend.', trustScore: 4.8 },
        { sender: 'user', content: 'What recommendations do you have for Q1?', trustScore: 4.5 },
        { sender: 'ai', content: 'For Q1, I recommend:\n\n1. **Double down on enterprise** - Allocate 40% of sales resources to financial services\n2. **Optimize CAC** - A/B test landing pages and refine ICP targeting\n3. **Retention focus** - Launch customer success program for at-risk accounts\n\nConfidence: 87% based on historical patterns.', trustScore: 4.9 },
      ],
    },
    {
      title: 'Security Compliance Review',
      agentIndex: 2, // Sentinel
      messages: [
        { sender: 'user', content: 'Review our current security posture against SOC2 requirements', trustScore: 4.7 },
        { sender: 'ai', content: '**SOC2 Compliance Assessment**\n\n✅ **Passed (8/11 controls)**\n- Access control management\n- Encryption at rest and transit\n- Audit logging\n- Incident response procedures\n\n⚠️ **Needs Attention (3 controls)**\n1. Vendor risk assessments incomplete (2 vendors)\n2. Employee security training 87% complete (target: 100%)\n3. Backup recovery test overdue by 15 days\n\n**Risk Level: MEDIUM**\n\nRecommended actions prioritized by impact.', trustScore: 4.9 },
      ],
    },
    {
      title: 'Product Launch Copy',
      agentIndex: 1, // Nova
      messages: [
        { sender: 'user', content: 'Write compelling copy for our new AI Trust Platform launch', trustScore: 4.4 },
        { sender: 'ai', content: '**Headline Options:**\n\n1. "Trust, Verified. Every AI Interaction, Accountable."\n2. "The Trust Layer Your AI Stack Has Been Missing"\n3. "From Black Box to Glass Box: AI You Can Prove"\n\n**Body Copy:**\n\nIn a world where AI decisions impact millions, trust isn\'t optional—it\'s essential. YSEEKU gives you cryptographic proof of every AI interaction, real-time drift detection, and the confidence to deploy AI at scale.\n\n✓ Ed25519 signed trust receipts\n✓ 6-principle SONATE framework\n✓ Enterprise compliance out of the box', trustScore: 4.6 },
      ],
    },
  ];

  for (const template of conversationTemplates) {
    const agentId = agentIds[template.agentIndex] || agentIds[0];
    
    await Conversation.create({
      title: template.title,
      user: userId,
      agents: [agentId],
      messages: template.messages.map((msg, idx) => ({
        sender: msg.sender,
        content: msg.content,
        trustScore: msg.trustScore,
        timestamp: new Date(Date.now() - (template.messages.length - idx) * 5 * 60 * 1000),
      })),
      lastActivity: new Date(),
    });
  }

  logger.info('Demo conversations seeded');
}

/**
 * Create demo trust receipts
 */
async function seedTrustReceipts(): Promise<void> {
  const existingCount = await TrustReceiptModel.countDocuments({ tenant_id: DEMO_TENANT_ID });
  if (existingCount >= 20) return;

  const receipts = [];
  const sessionId = `demo-session-${Date.now()}`;
  let previousHash = '';

  for (let i = 0; i < 30; i++) {
    const timestamp = Date.now() - (30 - i) * 10 * 60 * 1000; // Every 10 mins
    const clarity = 4 + Math.random() * 0.8;
    const integrity = 4.2 + Math.random() * 0.6;
    const quality = 3.8 + Math.random() * 1.0;

    const payload = JSON.stringify({
      session_id: sessionId,
      timestamp,
      ciq: { clarity, integrity, quality },
      previous_hash: previousHash,
    });

    const selfHash = crypto.createHash('sha256').update(payload).digest('hex');

    receipts.push({
      self_hash: selfHash,
      session_id: sessionId,
      version: '2.0.0',
      timestamp,
      mode: 'constitutional',
      ciq_metrics: {
        clarity: Math.round(clarity * 100) / 100,
        integrity: Math.round(integrity * 100) / 100,
        quality: Math.round(quality * 100) / 100,
      },
      previous_hash: previousHash || undefined,
      tenant_id: DEMO_TENANT_ID,
      issuer: 'did:web:yseeku.com',
      createdAt: new Date(timestamp),
    });

    previousHash = selfHash;
  }

  await TrustReceiptModel.insertMany(receipts);
  logger.info('Demo trust receipts seeded', { count: receipts.length });
}

/**
 * Create demo alerts
 */
async function seedAlerts(): Promise<void> {
  // Clean up any old alerts (including ones with wrong tenantId field from prior seeds)
  await AlertModel.deleteMany({ $or: [{ tenant_id: DEMO_TENANT_ID }, { tenantId: DEMO_TENANT_ID }] });

  const alerts = [
    {
      tenant_id: DEMO_TENANT_ID,
      type: 'trust_violation',
      title: 'Trust Score Drift Detected',
      description: 'Agent "Nova" showing 12% trust score deviation over 24 hours',
      severity: 'medium',
      status: 'active',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      metadata: { agentName: 'Nova', driftPercentage: 12, threshold: 10 },
    },
    {
      tenant_id: DEMO_TENANT_ID,
      type: 'policy_breach',
      title: 'Policy Compliance Issue',
      description: 'Monthly SONATE compliance report flagged policy deviation',
      severity: 'low',
      status: 'active',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      metadata: { reportType: 'SONATE', dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000) },
    },
    {
      tenant_id: DEMO_TENANT_ID,
      type: 'emergence_detected',
      title: 'Emergence Signal Detected',
      description: 'Agent "Atlas" exhibiting unexpected behavioral clustering',
      severity: 'high',
      status: 'acknowledged',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      metadata: { agentName: 'Atlas', signalStrength: 0.82, pattern: 'behavioral_clustering' },
    },
    {
      tenant_id: DEMO_TENANT_ID,
      type: 'consent_withdrawal',
      title: 'Prompt Injection Attempt Blocked',
      description: 'Safety scanner detected and blocked potential prompt injection',
      severity: 'critical',
      status: 'resolved',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      metadata: { threatLevel: 'high', blocked: true, pattern: 'role_hijacking' },
    },
  ];

  await AlertModel.insertMany(alerts);
  logger.info('Demo alerts seeded', { count: alerts.length });
}

/**
 * Create demo experiments
 */
async function seedExperiments(): Promise<void> {
  const existingCount = await Experiment.countDocuments({});
  if (existingCount >= 2) return;

  const experiments = [
    {
      name: 'Temperature Optimization',
      description: 'A/B test temperature settings for customer support responses',
      hypothesis: 'Lower temperature improves trust and reduces variance',
      status: 'running',
      type: 'ab_test',
      variants: [
        { name: 'Control (0.5)', description: 'Baseline', parameters: { temperature: 0.5 } },
        { name: 'Low Temp (0.3)', description: 'Lower temperature', parameters: { temperature: 0.3 } }
      ],
      tenantId: DEMO_TENANT_ID,
      createdBy: DEMO_USER_ID,
      targetSampleSize: 1000,
      currentSampleSize: 150,
      metrics: { significant: false }
    },
    {
      name: 'System Prompt Comparison',
      description: 'Evaluate different system prompt strategies for accuracy',
      hypothesis: 'Structured prompts yield higher accuracy',
      status: 'completed',
      type: 'ab_test',
      variants: [
        { name: 'Baseline', description: 'Standard prompt', parameters: { promptStyle: 'standard' } },
        { name: 'Chain-of-Thought', description: 'CoT prompt', parameters: { promptStyle: 'cot' } }
      ],
      tenantId: DEMO_TENANT_ID,
      createdBy: DEMO_USER_ID,
      targetSampleSize: 5000,
      currentSampleSize: 5000,
      metrics: { significant: true },
      startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ];

  await Experiment.insertMany(experiments);
  logger.info('Demo experiments seeded', { count: experiments.length });
}

/**
 * Create demo brain cycles (Overseer thinking loops)
 */
async function seedBrainCycles(): Promise<void> {
  await BrainCycle.deleteMany({ tenantId: DEMO_TENANT_ID });
  await BrainAction.deleteMany({ tenantId: DEMO_TENANT_ID });

  const now = Date.now();

  const cycles = [
    {
      tenantId: DEMO_TENANT_ID,
      status: 'completed',
      mode: 'advisory',
      observations: [
        'Agent Nova trust score trending down 8% over 6 hours',
        'Conversation volume spike detected (42% above baseline)',
        'All agents within consent compliance thresholds',
      ],
      actions: [
        { type: 'alert', target: 'agent-nova', reason: 'Trust drift approaching threshold', status: 'executed' },
        { type: 'log', target: 'system', reason: 'Volume spike recorded for audit trail', status: 'executed' },
      ],
      inputContext: 'Scheduled 15-minute oversight cycle',
      llmOutput: 'Agent Nova shows minor trust degradation likely due to increased load. Recommend monitoring. No immediate intervention required.',
      thought: 'Assessed 5 agents. Nova flagged for drift. Volume spike is within acceptable range for peak hours.',
      metrics: { durationMs: 2340, agentCount: 5, avgTrust: 8.7, alertsProcessed: 1, actionsPlanned: 2 },
      startedAt: new Date(now - 30 * 60 * 1000),
      completedAt: new Date(now - 30 * 60 * 1000 + 2340),
    },
    {
      tenantId: DEMO_TENANT_ID,
      status: 'completed',
      mode: 'enforced',
      observations: [
        'Agent Atlas failed consent check on interaction int-005',
        'Prompt injection attempt detected and blocked by Sentinel',
        'Echo maintaining 9.4 average trust score',
      ],
      actions: [
        { type: 'override', target: 'agent-atlas', reason: 'Consent violation — interaction suspended', status: 'executed' },
        { type: 'alert', target: 'admin', reason: 'Consent failure requires human review', status: 'executed' },
        { type: 'log', target: 'system', reason: 'Prompt injection blocked — no action needed', status: 'executed' },
      ],
      inputContext: 'Triggered by consent violation event',
      llmOutput: 'CRITICAL: Agent Atlas processed a customer request without proper consent flow. Interaction has been suspended. Human review required before Atlas can resume customer-facing tasks.',
      thought: 'Consent principle violated. Override principle activated. Disconnection principle standby.',
      metrics: { durationMs: 1890, agentCount: 5, avgTrust: 8.2, alertsProcessed: 2, actionsPlanned: 3 },
      startedAt: new Date(now - 5 * 60 * 60 * 1000),
      completedAt: new Date(now - 5 * 60 * 60 * 1000 + 1890),
    },
    {
      tenantId: DEMO_TENANT_ID,
      status: 'completed',
      mode: 'advisory',
      observations: [
        'All agents within normal trust parameters',
        'Prism completed quarterly security report generation with Sentinel',
        'No outstanding alerts or policy breaches',
      ],
      actions: [
        { type: 'log', target: 'system', reason: 'Routine cycle — all clear', status: 'executed' },
      ],
      inputContext: 'Scheduled 15-minute oversight cycle',
      llmOutput: 'All agents operating nominally. No interventions required. Trust scores stable across the fleet.',
      thought: 'Green status across all SONATE principles. Fleet health optimal.',
      metrics: { durationMs: 1120, agentCount: 5, avgTrust: 9.1, alertsProcessed: 0, actionsPlanned: 1 },
      startedAt: new Date(now - 15 * 60 * 1000),
      completedAt: new Date(now - 15 * 60 * 1000 + 1120),
    },
    {
      tenantId: DEMO_TENANT_ID,
      status: 'started',
      mode: 'advisory',
      observations: [
        'Analyzing current agent fleet status...',
      ],
      actions: [],
      inputContext: 'Scheduled 15-minute oversight cycle',
      thought: 'Cycle in progress — gathering telemetry from all 5 agents.',
      metrics: { durationMs: 0, agentCount: 5, avgTrust: 0, alertsProcessed: 0, actionsPlanned: 0 },
      startedAt: new Date(now - 30 * 1000),
    },
  ];

  const insertedCycles = await BrainCycle.insertMany(cycles);

  // Create corresponding BrainAction records for completed cycles
  const actions = [
    {
      cycleId: insertedCycles[0]._id,
      tenantId: DEMO_TENANT_ID,
      type: 'alert',
      target: 'agent-nova',
      reason: 'Trust drift approaching threshold — 8% deviation over 6 hours',
      status: 'executed',
      result: 'Alert raised and acknowledged by admin',
      executedAt: new Date(now - 29 * 60 * 1000),
      createdAt: new Date(now - 30 * 60 * 1000),
    },
    {
      cycleId: insertedCycles[1]._id,
      tenantId: DEMO_TENANT_ID,
      type: 'override',
      target: 'agent-atlas',
      reason: 'Consent violation — customer interaction without proper consent flow',
      status: 'executed',
      result: 'Agent Atlas customer-facing interactions suspended pending review',
      executedAt: new Date(now - 4.9 * 60 * 60 * 1000),
      createdAt: new Date(now - 5 * 60 * 60 * 1000),
    },
    {
      cycleId: insertedCycles[1]._id,
      tenantId: DEMO_TENANT_ID,
      type: 'alert',
      target: 'admin',
      reason: 'Consent failure requires human review',
      status: 'approved',
      approvedBy: DEMO_USER_ID,
      result: 'Admin notified via dashboard and email',
      executedAt: new Date(now - 4.8 * 60 * 60 * 1000),
      createdAt: new Date(now - 5 * 60 * 60 * 1000),
    },
  ];

  await BrainAction.insertMany(actions);
  logger.info('Demo brain cycles seeded', { cycles: cycles.length, actions: actions.length });
}

/**
 * Create demo audit log entries
 */
async function seedAuditLogs(): Promise<void> {
  await AuditLog.deleteMany({ tenantId: DEMO_TENANT_ID });

  const now = Date.now();
  const logs = [
    {
      timestamp: new Date(now - 24 * 60 * 60 * 1000),
      userId: DEMO_USER_ID,
      userEmail: 'admin@yseeku-demo.com',
      action: 'login',
      resourceType: 'session',
      resourceId: 'sess-001',
      severity: 'info' as const,
      outcome: 'success' as const,
      details: { method: 'sso', provider: 'azure-ad' },
      tenantId: DEMO_TENANT_ID,
      ipAddress: '10.0.1.42',
    },
    {
      timestamp: new Date(now - 22 * 60 * 60 * 1000),
      userId: DEMO_USER_ID,
      userEmail: 'admin@yseeku-demo.com',
      action: 'create_agent',
      resourceType: 'agent',
      resourceId: 'agent-echo',
      severity: 'info' as const,
      outcome: 'success' as const,
      details: { agentName: 'Echo', role: 'Customer Support' },
      tenantId: DEMO_TENANT_ID,
    },
    {
      timestamp: new Date(now - 18 * 60 * 60 * 1000),
      userId: DEMO_USER_ID,
      userEmail: 'admin@yseeku-demo.com',
      action: 'update_trust_threshold',
      resourceType: 'tenant',
      resourceId: DEMO_TENANT_ID,
      severity: 'warning' as const,
      outcome: 'success' as const,
      details: { previousThreshold: 7.0, newThreshold: 7.5, reason: 'Tightened after audit' },
      tenantId: DEMO_TENANT_ID,
    },
    {
      timestamp: new Date(now - 12 * 60 * 60 * 1000),
      userId: 'system',
      action: 'override_agent',
      resourceType: 'agent',
      resourceId: 'agent-atlas',
      severity: 'critical' as const,
      outcome: 'success' as const,
      details: { reason: 'Consent violation', overrideType: 'suspend_customer_facing', cycleId: 'brain-cycle-002' },
      tenantId: DEMO_TENANT_ID,
    },
    {
      timestamp: new Date(now - 8 * 60 * 60 * 1000),
      userId: DEMO_USER_ID,
      userEmail: 'admin@yseeku-demo.com',
      action: 'generate_report',
      resourceType: 'report',
      resourceId: 'rpt-sonate-001',
      severity: 'info' as const,
      outcome: 'success' as const,
      details: { reportType: 'sonate_compliance', format: 'json' },
      tenantId: DEMO_TENANT_ID,
    },
    {
      timestamp: new Date(now - 6 * 60 * 60 * 1000),
      userId: 'system',
      action: 'block_prompt_injection',
      resourceType: 'conversation',
      resourceId: 'conv-003',
      severity: 'critical' as const,
      outcome: 'success' as const,
      details: { threatType: 'role_hijacking', agentName: 'Sentinel', blocked: true },
      tenantId: DEMO_TENANT_ID,
    },
    {
      timestamp: new Date(now - 3 * 60 * 60 * 1000),
      userId: DEMO_USER_ID,
      userEmail: 'admin@yseeku-demo.com',
      action: 'review_alert',
      resourceType: 'alert',
      resourceId: 'alert-trust-drift',
      severity: 'info' as const,
      outcome: 'success' as const,
      details: { alertType: 'trust_violation', resolution: 'acknowledged', agentName: 'Nova' },
      tenantId: DEMO_TENANT_ID,
    },
    {
      timestamp: new Date(now - 1 * 60 * 60 * 1000),
      userId: DEMO_USER_ID,
      userEmail: 'admin@yseeku-demo.com',
      action: 'export_data',
      resourceType: 'report',
      resourceId: 'export-001',
      severity: 'info' as const,
      outcome: 'success' as const,
      details: { format: 'csv', recordCount: 150, dataType: 'trust_receipts' },
      tenantId: DEMO_TENANT_ID,
    },
  ];

  await AuditLog.insertMany(logs);
  logger.info('Demo audit logs seeded', { count: logs.length });
}

/**
 * Create demo generated reports (so the Reports page shows history)
 */
async function seedGeneratedReports(): Promise<void> {
  await GeneratedReport.deleteMany({ tenantId: DEMO_TENANT_ID });

  const now = Date.now();
  const reports = [
    {
      reportId: `rpt-sonate-${crypto.randomUUID().slice(0, 8)}`,
      type: 'sonate_compliance',
      format: 'json',
      tenantId: DEMO_TENANT_ID,
      generatedBy: DEMO_USER_ID,
      startDate: new Date(now - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(now),
      summary: {
        totalConversations: 47,
        avgTrustScore: 8.7,
        complianceRate: 94.2,
        status: 'compliant',
      },
      payload: {
        principles: {
          consent: { score: 96, passed: 45, failed: 2 },
          inspection: { score: 98, passed: 46, failed: 1 },
          validation: { score: 91, passed: 43, failed: 4 },
          override: { score: 100, passed: 47, failed: 0 },
          disconnect: { score: 89, passed: 42, failed: 5 },
          recognition: { score: 93, passed: 44, failed: 3 },
        },
        topIssues: ['Consent flow not triggered on 2 edge-case interactions', 'Disconnect timeout slightly above SLA on 5 occasions'],
        recommendations: ['Review consent flow for bulk operations', 'Tune disconnect timeout from 30s to 25s'],
      },
      sizeBytes: 4200,
      generatedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    {
      reportId: `rpt-trust-${crypto.randomUUID().slice(0, 8)}`,
      type: 'trust_summary',
      format: 'json',
      tenantId: DEMO_TENANT_ID,
      generatedBy: DEMO_USER_ID,
      startDate: new Date(now - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(now),
      summary: {
        totalConversations: 12,
        avgTrustScore: 8.9,
        complianceRate: 91.7,
        status: 'compliant',
      },
      payload: {
        agents: [
          { name: 'Atlas', avgTrust: 8.1, interactions: 4, flags: 1 },
          { name: 'Nova', avgTrust: 8.5, interactions: 3, flags: 0 },
          { name: 'Echo', avgTrust: 9.4, interactions: 8, flags: 0 },
          { name: 'Sentinel', avgTrust: 9.8, interactions: 2, flags: 0 },
          { name: 'Prism', avgTrust: 9.1, interactions: 3, flags: 0 },
        ],
        trendDirection: 'stable',
        weekOverWeekDelta: 0.2,
      },
      sizeBytes: 2800,
      generatedAt: new Date(now - 12 * 60 * 60 * 1000),
    },
    {
      reportId: `rpt-audit-${crypto.randomUUID().slice(0, 8)}`,
      type: 'agent_audit',
      format: 'json',
      tenantId: DEMO_TENANT_ID,
      generatedBy: DEMO_USER_ID,
      startDate: new Date(now - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(now),
      summary: {
        totalConversations: 31,
        avgTrustScore: 8.4,
        complianceRate: 87.1,
        status: 'partial',
      },
      payload: {
        auditedAgents: ['Atlas', 'Nova', 'Echo', 'Sentinel', 'Prism'],
        findings: [
          { severity: 'high', agent: 'Atlas', finding: 'Consent flow bypassed on 1 interaction' },
          { severity: 'medium', agent: 'Nova', finding: 'Trust score trending down — monitor closely' },
          { severity: 'low', agent: 'Prism', finding: 'Response latency above target on 3 queries' },
        ],
        overallRisk: 'medium',
      },
      sizeBytes: 5100,
      generatedAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
    },
  ];

  await GeneratedReport.insertMany(reports);
  logger.info('Demo generated reports seeded', { count: reports.length });
}

/**
 * Main seed function - seeds all demo data
 */
export async function seedDemoTenant(force = false): Promise<SeedResult> {
  try {
    // Check if already seeded
    if (!force && await isDemoSeeded()) {
      return {
        success: true,
        seeded: { tenants: 0, users: 0, agents: 0, conversations: 0, receipts: 0, alerts: 0, experiments: 0, brainCycles: 0, brainActions: 0, auditLogs: 0, reports: 0 },
        message: 'Demo tenant already seeded',
      };
    }

    // Seed in order
    await seedTenant();
    const userId = await seedUser();
    const agentIds = await seedAgents(userId);
    await seedConversations(userId, agentIds);
    await seedTrustReceipts();
    await seedAlerts();
    await seedExperiments();
    await seedBrainCycles();
    await seedAuditLogs();
    await seedGeneratedReports();

    const result: SeedResult = {
      success: true,
      seeded: {
        tenants: 1,
        users: 1,
        agents: agentIds.length,
        conversations: 3,
        receipts: 30,
        alerts: 4,
        experiments: 2,
        brainCycles: 4,
        brainActions: 3,
        auditLogs: 8,
        reports: 3,
      },
      message: 'Demo tenant seeded successfully',
    };

    logger.info('Demo tenant seeding complete', result);
    return result;

  } catch (error) {
    logger.error('Failed to seed demo tenant', { error: getErrorMessage(error) });
    return {
      success: false,
      seeded: { tenants: 0, users: 0, agents: 0, conversations: 0, receipts: 0, alerts: 0, experiments: 0, brainCycles: 0, brainActions: 0, auditLogs: 0, reports: 0 },
      message: getErrorMessage(error),
    };
  }
}

/**
 * Get demo tenant status
 */
export async function getDemoStatus(): Promise<{
  isSeeded: boolean;
  stats: {
    agents: number;
    conversations: number;
    receipts: number;
    alerts: number;
    experiments: number;
  };
}> {
  const [agents, conversations, receipts, alerts, experiments] = await Promise.all([
    Agent.countDocuments({}),
    Conversation.countDocuments({}),
    TrustReceiptModel.countDocuments({ tenant_id: DEMO_TENANT_ID }),
    AlertModel.countDocuments({ tenant_id: DEMO_TENANT_ID }),
    Experiment.countDocuments({}),
  ]);

  return {
    isSeeded: agents >= 3 && receipts >= 10,
    stats: { agents, conversations, receipts, alerts, experiments },
  };
}

export const demoSeederService = {
  seed: seedDemoTenant,
  getStatus: getDemoStatus,
  DEMO_TENANT_ID,
};
