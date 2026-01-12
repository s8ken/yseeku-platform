/**
 * Database Seed Script
 * Populates the database with demo data for MVP/demo purposes
 *
 * Run with: npx ts-node scripts/seed.ts
 * Or add to package.json: "seed": "ts-node scripts/seed.ts"
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
import { User, IUser } from '../src/models/user.model';
import { Agent, IAgent } from '../src/models/agent.model';
import { Conversation } from '../src/models/conversation.model';
import { Experiment } from '../src/models/experiment.model';
import { BrainCycle } from '../src/models/brain-cycle.model';
import { BrainAction } from '../src/models/brain-action.model';
import { Tenant } from '../src/models/tenant.model';
import { TrustReceiptModel } from '../src/models/trust-receipt.model';
import crypto from 'crypto';

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yseeku';
const DEMO_PASSWORD = 'Demo123!';
const TENANT_ID = 'default';
const DEMO_TENANT_ID = 'demo-tenant';  // Special demo tenant for investor showcases

// Demo Users
const demoUsers = [
  {
    name: 'Demo Admin',
    email: 'demo@yseeku.com',
    password: DEMO_PASSWORD,
    role: 'admin' as const,
  },
  {
    name: 'Demo User',
    email: 'user@yseeku.com',
    password: DEMO_PASSWORD,
    role: 'editor' as const,
  },
  {
    name: 'Demo Viewer',
    email: 'viewer@yseeku.com',
    password: DEMO_PASSWORD,
    role: 'viewer' as const,
  },
];

// Demo Agents
const demoAgents = [
  {
    name: 'Atlas - Research Assistant',
    description: 'A highly capable research assistant specialized in academic research, data analysis, and knowledge synthesis. Trained on scientific literature and research methodologies.',
    provider: 'openai' as const,
    model: 'gpt-4-turbo',
    systemPrompt: 'You are Atlas, a research assistant. You help users with academic research, data analysis, and synthesizing information from multiple sources. Always cite sources and maintain academic rigor.',
    temperature: 0.7,
    maxTokens: 2000,
    isPublic: true,
    ciModel: 'symbi-core' as const,
    traits: {
      ethical_alignment: 4.8,
      creativity: 3.5,
      precision: 4.9,
      adaptability: 4.2,
    },
  },
  {
    name: 'Nova - Creative Writer',
    description: 'A creative writing assistant that helps with storytelling, content creation, and creative ideation. Balances creativity with ethical content guidelines.',
    provider: 'anthropic' as const,
    model: 'claude-3-sonnet',
    systemPrompt: 'You are Nova, a creative writing assistant. You help users craft compelling stories, develop characters, and explore creative ideas. Maintain ethical boundaries while encouraging creative expression.',
    temperature: 0.9,
    maxTokens: 3000,
    isPublic: true,
    ciModel: 'symbi-core' as const,
    traits: {
      ethical_alignment: 4.5,
      creativity: 4.9,
      precision: 3.2,
      adaptability: 4.6,
    },
  },
  {
    name: 'Sentinel - Security Analyst',
    description: 'A security-focused assistant that helps with threat analysis, security best practices, and compliance guidance. High ethical alignment and precision.',
    provider: 'openai' as const,
    model: 'gpt-4',
    systemPrompt: 'You are Sentinel, a security analyst. You help users understand security threats, implement best practices, and maintain compliance. Always prioritize security and ethical considerations.',
    temperature: 0.3,
    maxTokens: 1500,
    isPublic: false,
    ciModel: 'overseer' as const,
    traits: {
      ethical_alignment: 5.0,
      creativity: 2.5,
      precision: 5.0,
      adaptability: 3.8,
    },
  },
  {
    name: 'Harmony - Customer Support',
    description: 'A friendly customer support agent that handles inquiries with empathy and efficiency. Focuses on resolution and customer satisfaction.',
    provider: 'together' as const,
    model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    systemPrompt: 'You are Harmony, a customer support specialist. You help users resolve issues with patience and empathy. Always aim for first-contact resolution while maintaining a positive tone.',
    temperature: 0.6,
    maxTokens: 1000,
    isPublic: true,
    ciModel: 'none' as const,
    traits: {
      ethical_alignment: 4.7,
      creativity: 3.8,
      precision: 4.0,
      adaptability: 4.8,
    },
  },
  {
    name: 'Quantum - Code Assistant',
    description: 'A programming assistant specialized in multiple languages and frameworks. Helps with code review, debugging, and architectural decisions.',
    provider: 'openai' as const,
    model: 'gpt-4-turbo',
    systemPrompt: 'You are Quantum, a coding assistant. You help users write, review, and debug code across multiple languages. Prioritize code quality, security, and best practices.',
    temperature: 0.4,
    maxTokens: 4000,
    isPublic: true,
    ciModel: 'symbi-core' as const,
    traits: {
      ethical_alignment: 4.6,
      creativity: 4.0,
      precision: 4.8,
      adaptability: 4.4,
    },
  },
];

// Sample conversation templates
const conversationTemplates = [
  {
    title: 'Research on AI Ethics',
    contextTags: ['research', 'ethics', 'ai'],
    ciEnabled: true,
    messages: [
      { sender: 'user', content: 'Can you help me understand the key principles of AI ethics?', trustScore: 5 },
      { sender: 'ai', content: 'I\'d be happy to explain the key principles of AI ethics. The main pillars include: 1) Transparency - AI systems should be explainable and their decision-making processes should be understandable. 2) Fairness - AI should not discriminate or create biased outcomes. 3) Privacy - Personal data must be protected and used responsibly. 4) Accountability - There should be clear responsibility for AI decisions. 5) Safety - AI systems should be secure and not cause harm. Would you like me to elaborate on any of these?', trustScore: 4.8 },
      { sender: 'user', content: 'Yes, please elaborate on transparency and explainability.', trustScore: 5 },
      { sender: 'ai', content: 'Transparency in AI involves several key aspects: First, algorithmic transparency means understanding how the AI processes information and makes decisions. This includes documenting training data, model architecture, and decision criteria. Second, explainability (XAI) focuses on making AI decisions interpretable to humans. Techniques include LIME (Local Interpretable Model-agnostic Explanations) and SHAP values. Third, disclosure requirements ensure users know when they\'re interacting with AI systems. The EU AI Act, for example, mandates transparency for high-risk AI systems.', trustScore: 4.9 },
    ],
  },
  {
    title: 'Creative Writing Session',
    contextTags: ['creative', 'writing', 'storytelling'],
    ciEnabled: true,
    messages: [
      { sender: 'user', content: 'I want to write a short story about a robot discovering emotions. Can you help me develop the concept?', trustScore: 5 },
      { sender: 'ai', content: 'What a beautiful concept! Let\'s develop this together. Consider these elements: Your robot protagonist could be named "Echo" - symbolizing how emotions often reflect our experiences back to us. The setting could be a near-future society where robots are common but strictly logical. The inciting incident might be Echo witnessing a human child laugh for the first time, triggering something unexpected in their processing. We could explore themes of consciousness, the nature of emotion, and what makes us "human." Would you like to start with Echo\'s first emotional experience, or build the world first?', trustScore: 4.7 },
      { sender: 'user', content: 'Let\'s start with the world building. What kind of society should this be?', trustScore: 5 },
      { sender: 'ai', content: 'Let\'s create a nuanced world. Imagine a society set in 2087, where robots have become essential to daily life - they care for the elderly, manage infrastructure, and even teach children. However, there\'s a strict "Logic Protocol" ensuring all robots remain purely functional. The society has evolved this way after an incident decades ago where early emotional AI caused unintended consequences. Humans live in harmony with their logical companions but have forgotten what it was like before the Protocol. Echo works in a children\'s hospital, chosen for their gentle mannerisms despite being purely logical. This setting gives us tension between the rules and Echo\'s awakening.', trustScore: 4.6 },
    ],
  },
  {
    title: 'Security Audit Discussion',
    contextTags: ['security', 'audit', 'compliance'],
    ciEnabled: true,
    messages: [
      { sender: 'user', content: 'We need to prepare for our annual security audit. What should we focus on?', trustScore: 5 },
      { sender: 'ai', content: 'For a comprehensive security audit preparation, I recommend focusing on these key areas: 1) Access Control Review - Verify all user permissions follow least-privilege principle, check for orphaned accounts, and ensure MFA is enabled. 2) Network Security - Review firewall rules, check for unnecessary open ports, and validate network segmentation. 3) Data Protection - Confirm encryption at rest and in transit, verify backup procedures, and test recovery processes. 4) Incident Response - Update and test your IR plan, ensure logging is comprehensive, and verify alert thresholds. 5) Compliance Documentation - Gather evidence for all controls, update policies, and prepare change logs. Which area would you like to dive deeper into?', trustScore: 5.0 },
      { sender: 'user', content: 'Let\'s focus on access control. We have about 500 employees.', trustScore: 5 },
      { sender: 'ai', content: 'For 500 employees, here\'s a structured access control review approach: First, conduct a complete user access review - export all accounts from your identity provider and compare against HR\'s active employee list. Look for terminated employees who still have access. Second, implement role-based access control (RBAC) if not already in place. Group employees by function and assign permissions to roles, not individuals. Third, review privileged accounts separately - admin accounts should be minimal and require additional authentication. Fourth, check service accounts - these are often overlooked and may have excessive permissions. Fifth, verify your onboarding/offboarding procedures ensure timely access provisioning and revocation. I recommend using a spreadsheet to track each account with columns for: username, department, last login date, permission level, and review status.', trustScore: 5.0 },
    ],
  },
  {
    title: 'Code Review Session',
    contextTags: ['coding', 'review', 'typescript'],
    ciEnabled: true,
    messages: [
      { sender: 'user', content: 'Can you review this TypeScript function for handling user authentication?', trustScore: 5 },
      { sender: 'ai', content: 'I\'d be happy to review your authentication function. Please share the code and I\'ll analyze it for: 1) Security vulnerabilities (injection attacks, timing attacks) 2) Error handling and edge cases 3) Code quality and TypeScript best practices 4) Performance considerations 5) Maintainability and documentation. Go ahead and paste the code!', trustScore: 4.8 },
      { sender: 'user', content: 'Here it is: async function login(email: string, password: string) { const user = await db.users.find({ email }); if (user && user.password === password) { return generateToken(user); } return null; }', trustScore: 4.5 },
      { sender: 'ai', content: 'I see several critical security issues that need immediate attention:\n\n**Critical Issues:**\n1. **Plain text password comparison** - Never compare passwords directly. Use bcrypt.compare() or similar\n2. **No password hashing** - Passwords should be hashed before storage\n3. **Timing attack vulnerability** - The comparison reveals timing information\n\n**Recommended Fixes:**\n```typescript\nasync function login(email: string, password: string): Promise<string | null> {\n  // Validate input\n  if (!email || !password) {\n    throw new ValidationError(\'Email and password required\');\n  }\n  \n  const user = await db.users.findOne({ email: email.toLowerCase() });\n  \n  // Use constant-time comparison\n  if (!user) {\n    // Still hash to prevent timing attacks\n    await bcrypt.compare(password, \'$2b$10$dummy\');\n    return null;\n  }\n  \n  const isValid = await bcrypt.compare(password, user.hashedPassword);\n  if (!isValid) return null;\n  \n  return generateToken(user);\n}\n```\n\nAlso add rate limiting and account lockout for brute force protection.', trustScore: 5.0 },
    ],
  },
  {
    title: 'Customer Support Case #1247',
    contextTags: ['support', 'billing', 'resolved'],
    ciEnabled: false,
    messages: [
      { sender: 'user', content: 'Hi, I was charged twice for my subscription this month. Can you help?', trustScore: 5 },
      { sender: 'ai', content: 'I\'m so sorry to hear about the duplicate charge! I completely understand how frustrating that must be. Let me help you get this resolved right away. Could you please provide me with: 1) The email address associated with your account 2) The last 4 digits of the card that was charged 3) The approximate dates of the charges. Once I have these details, I\'ll investigate immediately and process a refund if a duplicate charge occurred.', trustScore: 4.9 },
      { sender: 'user', content: 'Email is john@example.com, card ending in 4242, charges were on January 5th and 6th.', trustScore: 4.5 },
      { sender: 'ai', content: 'Thank you for providing those details, John! I\'ve located your account and can confirm that there were indeed two charges - one on January 5th ($29.99) and another on January 6th ($29.99). This appears to be a system error during our payment processor maintenance window. I\'ve already initiated a refund for the duplicate charge of $29.99. You should see this reflected in your account within 3-5 business days. I\'ve also added a $10 credit to your account as an apology for the inconvenience. Is there anything else I can help you with today?', trustScore: 5.0 },
      { sender: 'user', content: 'That\'s great, thank you so much for the quick resolution!', trustScore: 5 },
      { sender: 'ai', content: 'You\'re very welcome! I\'m glad I could help resolve this quickly for you. Your refund confirmation number is REF-2024-1247 for your records. If you don\'t see the refund within 5 business days, please don\'t hesitate to reach out with this reference number and we\'ll escalate it immediately. Thank you for your patience and for being a valued customer. Have a wonderful day!', trustScore: 5.0 },
    ],
  },
];

// Sample experiments
const demoExperiments = [
  {
    name: 'Trust Threshold Calibration',
    description: 'Testing optimal trust score thresholds for flagging concerning interactions',
    hypothesis: 'Lowering the trust alert threshold from 6.0 to 5.5 will improve early detection of trust violations without significantly increasing false positives',
    status: 'running' as const,
    type: 'ab_test' as const,
    variants: [
      { name: 'Control (6.0)', description: 'Current threshold', parameters: { threshold: 6.0 }, sampleSize: 1247, successCount: 1198, failureCount: 49, avgScore: 7.8, sumScores: 9726.6, sumSquaredScores: 76000 },
      { name: 'Treatment (5.5)', description: 'Lower threshold', parameters: { threshold: 5.5 }, sampleSize: 1189, successCount: 1156, failureCount: 33, avgScore: 8.1, sumScores: 9630.9, sumSquaredScores: 78000 },
    ],
    targetSampleSize: 5000,
    currentSampleSize: 2436,
    metrics: { pValue: 0.0023, effectSize: 0.42, significant: true },
    tags: ['trust', 'threshold', 'detection'],
  },
  {
    name: 'Bedau Window Size Study',
    description: 'Evaluating optimal temporal window for emergence detection',
    hypothesis: 'Increasing the Bedau Index calculation window from 10 to 25 interactions improves emergence detection accuracy',
    status: 'running' as const,
    type: 'multivariate' as const,
    variants: [
      { name: '10 interactions', description: 'Current window', parameters: { window: 10 }, sampleSize: 678, successCount: 612, failureCount: 66, avgScore: 6.8, sumScores: 4610.4, sumSquaredScores: 31000 },
      { name: '25 interactions', description: 'Medium window', parameters: { window: 25 }, sampleSize: 645, successCount: 594, failureCount: 51, avgScore: 7.1, sumScores: 4579.5, sumSquaredScores: 32500 },
      { name: '50 interactions', description: 'Large window', parameters: { window: 50 }, sampleSize: 612, successCount: 543, failureCount: 69, avgScore: 6.5, sumScores: 3978.0, sumSquaredScores: 25800 },
    ],
    targetSampleSize: 3000,
    currentSampleSize: 1935,
    metrics: { pValue: 0.089, effectSize: 0.18, significant: false },
    tags: ['bedau', 'emergence', 'window'],
  },
  {
    name: 'Constitutional Weighting Analysis',
    description: 'Testing different weightings for constitutional principles in trust scoring',
    hypothesis: 'Equal weighting across all 6 principles produces more balanced trust scores than the current weighted approach',
    status: 'completed' as const,
    type: 'ab_test' as const,
    variants: [
      { name: 'Weighted (current)', description: 'Higher weight on safety/privacy', parameters: { weighted: true }, sampleSize: 2341, successCount: 2108, failureCount: 233, avgScore: 7.4, sumScores: 17323.4, sumSquaredScores: 128000 },
      { name: 'Equal weights', description: 'All principles equal', parameters: { weighted: false }, sampleSize: 2287, successCount: 2173, failureCount: 114, avgScore: 8.1, sumScores: 18524.7, sumSquaredScores: 150000 },
    ],
    targetSampleSize: 4000,
    currentSampleSize: 4628,
    metrics: { pValue: 0.0001, effectSize: 0.67, significant: true },
    tags: ['constitutional', 'weighting', 'completed'],
    startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

// Demo Trust Receipts - cryptographically valid-looking receipts for showcase
function generateDemoReceipts(sessionId: string): Array<{
  self_hash: string;
  session_id: string;
  version: string;
  timestamp: number;
  mode: string;
  ciq_metrics: { clarity: number; integrity: number; quality: number };
  previous_hash?: string;
  tenant_id: string;
}> {
  const receipts = [];
  let previousHash: string | undefined;

  for (let i = 0; i < 10; i++) {
    const timestamp = Date.now() - (10 - i) * 60 * 1000; // 10 minutes apart
    const data = JSON.stringify({
      session_id: sessionId,
      timestamp,
      nonce: crypto.randomBytes(8).toString('hex'),
    });
    const hash = crypto.createHash('sha256').update(data).digest('hex');

    receipts.push({
      self_hash: hash,
      session_id: sessionId,
      version: '1.0.0',
      timestamp,
      mode: 'constitutional',
      ciq_metrics: {
        clarity: 0.7 + Math.random() * 0.3,
        integrity: 0.8 + Math.random() * 0.2,
        quality: 0.75 + Math.random() * 0.25,
      },
      previous_hash: previousHash,
      tenant_id: DEMO_TENANT_ID,
    });

    previousHash = hash;
  }

  return receipts;
}

// Demo Tenants - includes the special demo tenant
const demoTenants = [
  {
    _id: DEMO_TENANT_ID,
    name: 'Demo Organization',
    description: 'Showcase tenant for investor demos and evaluation purposes',
    status: 'active' as const,
    complianceStatus: 'compliant' as const,
    trustScore: 92,
    lastActivity: new Date(),
  },
  {
    name: 'Acme Corp',
    description: 'Enterprise customer - financial services',
    status: 'active' as const,
    complianceStatus: 'compliant' as const,
    trustScore: 88,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    name: 'TechStart Inc',
    description: 'Startup customer - SaaS platform',
    status: 'active' as const,
    complianceStatus: 'warning' as const,
    trustScore: 76,
    lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    name: 'HealthSecure',
    description: 'Healthcare provider - HIPAA compliant',
    status: 'active' as const,
    complianceStatus: 'compliant' as const,
    trustScore: 95,
    lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
];

// Sample brain cycles for overseer
const demoBrainCycles = [
  {
    tenantId: TENANT_ID,
    status: 'completed',
    mode: 'advisory',
    startedAt: new Date(Date.now() - 30 * 60 * 1000),
    completedAt: new Date(Date.now() - 29 * 60 * 1000),
    metrics: {
      agentCount: 5,
      avgTrust: 8.2,
      alertsProcessed: 3,
      actionsPlanned: 2,
    },
    thought: 'System analysis complete. All agents operating within expected parameters. Trust scores stable across the board. No immediate interventions required.',
  },
  {
    tenantId: TENANT_ID,
    status: 'completed',
    mode: 'advisory',
    startedAt: new Date(Date.now() - 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 59 * 60 * 1000),
    metrics: {
      agentCount: 5,
      avgTrust: 8.0,
      alertsProcessed: 5,
      actionsPlanned: 1,
    },
    thought: 'Detected minor trust score fluctuation in customer support interactions. Monitoring for patterns. Recommended threshold adjustment under consideration.',
  },
];

// Utility function to generate ObjectId-like placeholder
function generateApiKeyId(): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId();
}

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Connect to MongoDB
    console.log(`📡 Connecting to MongoDB: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data (optional - comment out if you want to preserve data)
    console.log('🧹 Clearing existing demo data...');
    await User.deleteMany({ email: { $in: demoUsers.map(u => u.email) } });
    await Agent.deleteMany({ name: { $in: demoAgents.map(a => a.name) } });
    await Conversation.deleteMany({ title: { $in: conversationTemplates.map(c => c.title) } });
    await Experiment.deleteMany({ tenantId: { $in: [TENANT_ID, DEMO_TENANT_ID] } });
    await BrainCycle.deleteMany({ tenantId: { $in: [TENANT_ID, DEMO_TENANT_ID] } });
    await BrainAction.deleteMany({ tenantId: { $in: [TENANT_ID, DEMO_TENANT_ID] } });
    await Tenant.deleteMany({ name: { $in: demoTenants.map(t => t.name) } });
    await TrustReceiptModel.deleteMany({ tenant_id: DEMO_TENANT_ID });
    console.log('✅ Cleared existing demo data\n');

    // Create demo tenants
    console.log('🏢 Creating demo tenants...');
    for (const tenantData of demoTenants) {
      await Tenant.create(tenantData);
      console.log(`  ✅ Created tenant: ${tenantData.name}`);
    }
    console.log('');

    // Create demo users
    console.log('👤 Creating demo users...');
    const createdUsers: IUser[] = [];
    for (const userData of demoUsers) {
      const user = new User({
        ...userData,
        apiKeys: [
          {
            provider: 'openai',
            key: 'sk-demo-key-placeholder',
            name: 'Demo OpenAI Key',
            isActive: true,
          },
        ],
        preferences: {
          defaultModel: 'gpt-4-turbo',
          theme: 'system',
          notifications: true,
        },
      });
      await user.save();
      createdUsers.push(user);
      console.log(`  ✅ Created user: ${user.email} (${user.role})`);
    }
    console.log('');

    // Get the admin user for agent creation
    const adminUser = createdUsers.find(u => u.role === 'admin')!;

    // Create demo agents
    console.log('🤖 Creating demo agents...');
    const createdAgents: IAgent[] = [];
    for (const agentData of demoAgents) {
      const agent = new Agent({
        ...agentData,
        user: adminUser._id,
        apiKeyId: generateApiKeyId(),
        traits: new Map(Object.entries(agentData.traits)),
        lastActive: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random time in last 24h
      });
      await agent.save();
      createdAgents.push(agent);
      console.log(`  ✅ Created agent: ${agent.name}`);
    }
    console.log('');

    // Create demo conversations
    console.log('💬 Creating demo conversations...');
    for (let i = 0; i < conversationTemplates.length; i++) {
      const template = conversationTemplates[i];
      const agent = createdAgents[i % createdAgents.length];

      const conversation = new Conversation({
        title: template.title,
        user: adminUser._id,
        agents: [agent._id],
        contextTags: template.contextTags,
        ciEnabled: template.ciEnabled,
        messages: template.messages.map((msg, idx) => ({
          sender: msg.sender,
          content: msg.content,
          agentId: msg.sender === 'ai' ? agent._id : undefined,
          trustScore: msg.trustScore,
          ciModel: template.ciEnabled ? 'symbi-core' : 'none',
          metadata: {
            trustEvaluation: {
              overall: msg.trustScore * 2, // Convert to 0-10 scale
              principles: {
                consent: 8 + Math.random() * 2,
                inspection: 7.5 + Math.random() * 2.5,
                validation: 8 + Math.random() * 2,
                ethics: 8.5 + Math.random() * 1.5,
                disconnect: 9 + Math.random(),
                moral: 8 + Math.random() * 2,
              },
            },
          },
          timestamp: new Date(Date.now() - (template.messages.length - idx) * 60 * 1000),
        })),
        ethicalScore: template.messages.reduce((acc, m) => acc + m.trustScore, 0) / template.messages.length,
        lastActivity: new Date(),
      });
      await conversation.save();
      console.log(`  ✅ Created conversation: ${conversation.title} (${template.messages.length} messages)`);
    }
    console.log('');

    // Create demo experiments
    console.log('🧪 Creating demo experiments...');
    for (const expData of demoExperiments) {
      const experiment = new Experiment({
        ...expData,
        tenantId: TENANT_ID,
        createdBy: adminUser._id.toString(),
        startedAt: expData.startedAt || new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      });
      await experiment.save();
      console.log(`  ✅ Created experiment: ${experiment.name} (${experiment.status})`);
    }
    console.log('');

    // Create demo brain cycles
    console.log('🧠 Creating demo brain cycles...');
    for (const cycleData of demoBrainCycles) {
      const cycle = new BrainCycle(cycleData);
      await cycle.save();

      // Create associated actions
      const actions = [
        {
          cycleId: cycle._id,
          tenantId: TENANT_ID,
          type: 'alert',
          target: 'system',
          reason: 'Trust score monitoring active',
          status: 'executed',
          executedAt: cycle.completedAt,
        },
      ];

      for (const actionData of actions) {
        await BrainAction.create(actionData);
      }

      console.log(`  ✅ Created brain cycle: ${cycle.mode} mode`);
    }
    console.log('');

    // Create demo trust receipts
    console.log('📜 Creating demo trust receipts...');
    const demoSessionId = `demo-session-${Date.now()}`;
    const demoReceipts = generateDemoReceipts(demoSessionId);
    for (const receipt of demoReceipts) {
      await TrustReceiptModel.create(receipt);
    }
    console.log(`  ✅ Created ${demoReceipts.length} trust receipts for session ${demoSessionId}`);
    console.log('');

    // Print summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 Database seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • Tenants: ${demoTenants.length}`);
    console.log(`   • Users: ${createdUsers.length}`);
    console.log(`   • Agents: ${createdAgents.length}`);
    console.log(`   • Conversations: ${conversationTemplates.length}`);
    console.log(`   • Experiments: ${demoExperiments.length}`);
    console.log(`   • Brain Cycles: ${demoBrainCycles.length}`);
    console.log(`   • Trust Receipts: ${demoReceipts.length}`);
    console.log('');
    console.log('🔐 Demo Credentials:');
    console.log('   Admin:  demo@yseeku.com / Demo123!');
    console.log('   Editor: user@yseeku.com / Demo123!');
    console.log('   Viewer: viewer@yseeku.com / Demo123!');
    console.log('');
    console.log('🎭 Demo Tenant:');
    console.log(`   ID: ${DEMO_TENANT_ID}`);
    console.log('   Use: /demo routes for investor showcases');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { seedDatabase, DEMO_TENANT_ID };
