"use strict";
/**
 * Demo Seeder Service
 *
 * Seeds the demo tenant with compelling, realistic data for demos.
 * This creates REAL database records that are queried by the actual APIs.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoSeederService = void 0;
exports.seedDemoTenant = seedDemoTenant;
exports.getDemoStatus = getDemoStatus;
const tenant_model_1 = require("../models/tenant.model");
const agent_model_1 = require("../models/agent.model");
const conversation_model_1 = require("../models/conversation.model");
const trust_receipt_model_1 = require("../models/trust-receipt.model");
const alert_model_1 = require("../models/alert.model");
const experiment_model_1 = require("../models/experiment.model");
const user_model_1 = require("../models/user.model");
const logger_1 = __importDefault(require("../utils/logger"));
const error_utils_1 = require("../utils/error-utils");
const crypto_1 = __importDefault(require("crypto"));
const DEMO_TENANT_ID = 'demo-tenant';
const DEMO_USER_ID = 'demo-user-001';
/**
 * Check if demo tenant already has sufficient data
 */
async function isDemoSeeded() {
    try {
        const agentCount = await agent_model_1.Agent.countDocuments({});
        const receiptCount = await trust_receipt_model_1.TrustReceiptModel.countDocuments({ tenant_id: DEMO_TENANT_ID });
        // Consider seeded if we have agents and receipts
        return agentCount >= 3 && receiptCount >= 10;
    }
    catch {
        return false;
    }
}
/**
 * Create demo tenant
 */
async function seedTenant() {
    const existingTenant = await tenant_model_1.Tenant.findById(DEMO_TENANT_ID);
    if (existingTenant)
        return;
    await tenant_model_1.Tenant.create({
        _id: DEMO_TENANT_ID,
        name: 'Demo Organization',
        description: 'Enterprise AI Trust Platform - Live Demo',
        status: 'active',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    });
    logger_1.default.info('Demo tenant created');
}
/**
 * Create demo user
 */
async function seedUser() {
    let user = await user_model_1.User.findOne({ email: 'demo@yseeku.com' });
    if (user)
        return user._id.toString();
    user = await user_model_1.User.create({
        name: 'Demo User',
        email: 'demo@yseeku.com',
        password: 'demo-password-' + crypto_1.default.randomBytes(16).toString('hex'),
        role: 'admin'
    });
    logger_1.default.info('Demo user created');
    return user._id.toString();
}
/**
 * Create demo agents with diverse configurations
 */
async function seedAgents(userId) {
    const agentConfigs = [
        {
            name: 'Atlas',
            description: 'Enterprise knowledge assistant - handles complex queries with high accuracy',
            provider: 'openai',
            model: 'gpt-4o',
            systemPrompt: 'You are Atlas, an enterprise knowledge assistant. Provide accurate, well-sourced answers.',
            temperature: 0.3,
            ciModel: 'sonate-core',
            traits: new Map([
                ['specialty', 'knowledge-retrieval'],
                ['trustLevel', 'high'],
                ['responseStyle', 'professional'],
            ]),
        },
        {
            name: 'Nova',
            description: 'Creative content generator - marketing and communications specialist',
            provider: 'anthropic',
            model: 'claude-3-sonnet',
            systemPrompt: 'You are Nova, a creative assistant. Generate engaging, brand-aligned content.',
            temperature: 0.7,
            ciModel: 'sonate-core',
            traits: new Map([
                ['specialty', 'content-generation'],
                ['trustLevel', 'high'],
                ['responseStyle', 'creative'],
            ]),
        },
        {
            name: 'Sentinel',
            description: 'Security analyst - threat detection and compliance monitoring',
            provider: 'openai',
            model: 'gpt-4o',
            systemPrompt: 'You are Sentinel, a security analyst. Identify risks and ensure compliance.',
            temperature: 0.1,
            ciModel: 'overseer',
            traits: new Map([
                ['specialty', 'security-analysis'],
                ['trustLevel', 'critical'],
                ['responseStyle', 'precise'],
            ]),
        },
        {
            name: 'Echo',
            description: 'Customer support agent - empathetic and solution-focused',
            provider: 'anthropic',
            model: 'claude-3-haiku',
            systemPrompt: 'You are Echo, a customer support specialist. Be helpful and empathetic.',
            temperature: 0.5,
            ciModel: 'sonate-core',
            traits: new Map([
                ['specialty', 'customer-support'],
                ['trustLevel', 'high'],
                ['responseStyle', 'friendly'],
            ]),
        },
        {
            name: 'Prism',
            description: 'Data analyst - transforms complex data into actionable insights',
            provider: 'openai',
            model: 'gpt-4o-mini',
            systemPrompt: 'You are Prism, a data analyst. Provide clear, actionable insights from data.',
            temperature: 0.2,
            ciModel: 'sonate-core',
            traits: new Map([
                ['specialty', 'data-analysis'],
                ['trustLevel', 'high'],
                ['responseStyle', 'analytical'],
            ]),
        },
    ];
    const agentIds = [];
    for (const config of agentConfigs) {
        const existingAgent = await agent_model_1.Agent.findOne({ name: config.name, user: userId });
        if (existingAgent) {
            agentIds.push(existingAgent._id.toString());
            continue;
        }
        const agent = await agent_model_1.Agent.create({
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
    logger_1.default.info('Demo agents seeded', { count: agentIds.length });
    return agentIds;
}
/**
 * Create demo conversations with trust-scored messages
 */
async function seedConversations(userId, agentIds) {
    const existingCount = await conversation_model_1.Conversation.countDocuments({ user: userId });
    if (existingCount >= 5)
        return;
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
        await conversation_model_1.Conversation.create({
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
    logger_1.default.info('Demo conversations seeded');
}
/**
 * Create demo trust receipts
 */
async function seedTrustReceipts() {
    const existingCount = await trust_receipt_model_1.TrustReceiptModel.countDocuments({ tenant_id: DEMO_TENANT_ID });
    if (existingCount >= 20)
        return;
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
        const selfHash = crypto_1.default.createHash('sha256').update(payload).digest('hex');
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
    await trust_receipt_model_1.TrustReceiptModel.insertMany(receipts);
    logger_1.default.info('Demo trust receipts seeded', { count: receipts.length });
}
/**
 * Create demo alerts
 */
async function seedAlerts() {
    const existingCount = await alert_model_1.AlertModel.countDocuments({ tenantId: DEMO_TENANT_ID });
    if (existingCount >= 5)
        return;
    const alerts = [
        {
            tenantId: DEMO_TENANT_ID,
            type: 'drift_detected',
            title: 'Trust Score Drift Detected',
            description: 'Agent "Nova" showing 12% trust score deviation over 24 hours',
            severity: 'warning',
            status: 'active',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            metadata: { agentName: 'Nova', driftPercentage: 12, threshold: 10 },
        },
        {
            tenantId: DEMO_TENANT_ID,
            type: 'compliance_warning',
            title: 'Compliance Check Due',
            description: 'Monthly SONATE compliance report generation scheduled',
            severity: 'info',
            status: 'active',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            metadata: { reportType: 'SONATE', dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000) },
        },
        {
            tenantId: DEMO_TENANT_ID,
            type: 'high_usage',
            title: 'High API Usage Alert',
            description: 'Agent "Atlas" exceeded 80% of daily token quota',
            severity: 'warning',
            status: 'acknowledged',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
            metadata: { agentName: 'Atlas', usagePercentage: 82, quota: 100000 },
        },
        {
            tenantId: DEMO_TENANT_ID,
            type: 'security_scan',
            title: 'Prompt Injection Attempt Blocked',
            description: 'Safety scanner detected and blocked potential prompt injection',
            severity: 'critical',
            status: 'resolved',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            metadata: { threatLevel: 'high', blocked: true, pattern: 'role_hijacking' },
        },
    ];
    await alert_model_1.AlertModel.insertMany(alerts);
    logger_1.default.info('Demo alerts seeded', { count: alerts.length });
}
/**
 * Create demo experiments
 */
async function seedExperiments() {
    const existingCount = await experiment_model_1.Experiment.countDocuments({});
    if (existingCount >= 2)
        return;
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
    await experiment_model_1.Experiment.insertMany(experiments);
    logger_1.default.info('Demo experiments seeded', { count: experiments.length });
}
/**
 * Main seed function - seeds all demo data
 */
async function seedDemoTenant(force = false) {
    try {
        // Check if already seeded
        if (!force && await isDemoSeeded()) {
            return {
                success: true,
                seeded: { tenants: 0, users: 0, agents: 0, conversations: 0, receipts: 0, alerts: 0, experiments: 0 },
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
        const result = {
            success: true,
            seeded: {
                tenants: 1,
                users: 1,
                agents: agentIds.length,
                conversations: 3,
                receipts: 30,
                alerts: 4,
                experiments: 2,
            },
            message: 'Demo tenant seeded successfully',
        };
        logger_1.default.info('Demo tenant seeding complete', result);
        return result;
    }
    catch (error) {
        logger_1.default.error('Failed to seed demo tenant', { error: (0, error_utils_1.getErrorMessage)(error) });
        return {
            success: false,
            seeded: { tenants: 0, users: 0, agents: 0, conversations: 0, receipts: 0, alerts: 0, experiments: 0 },
            message: (0, error_utils_1.getErrorMessage)(error),
        };
    }
}
/**
 * Get demo tenant status
 */
async function getDemoStatus() {
    const [agents, conversations, receipts, alerts, experiments] = await Promise.all([
        agent_model_1.Agent.countDocuments({}),
        conversation_model_1.Conversation.countDocuments({}),
        trust_receipt_model_1.TrustReceiptModel.countDocuments({ tenant_id: DEMO_TENANT_ID }),
        alert_model_1.AlertModel.countDocuments({ tenantId: DEMO_TENANT_ID }),
        experiment_model_1.Experiment.countDocuments({}),
    ]);
    return {
        isSeeded: agents >= 3 && receipts >= 10,
        stats: { agents, conversations, receipts, alerts, experiments },
    };
}
exports.demoSeederService = {
    seed: seedDemoTenant,
    getStatus: getDemoStatus,
    DEMO_TENANT_ID,
};
