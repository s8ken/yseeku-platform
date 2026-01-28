import { tenantContext } from '@sonate/core';
import Ajv from 'ajv';
import { Request, Response, ParamsDictionary } from 'express';
import { ParsedQs } from 'qs';
import asyncHandler from 'express-async-handler';

import { Agent, UserModel as User } from './agent.model';
import { appendEvent } from './services/ledger.service';


// Custom Request type to include user - extends Express Request with all properties
interface AuthenticatedRequest extends Request<ParamsDictionary, unknown, unknown, ParsedQs> {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    permissions: string[];
    tenantId?: string;
    roles?: string[]; // Added roles for bonding check
  };
}

const ajv = new Ajv({ allErrors: true, removeAdditional: true });

// @desc    Get all agents for user
// @route   GET /api/agents
// @access  Private
export const getAllAgents = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const tenantId = tenantContext.getTenantId(false) || req.user.tenantId;
  const query: any = { user: req.user.id };
  if (tenantId) {query.tenantId = tenantId;}

  const agents = await Agent.find(query)
    .populate('connectedAgents', 'name description')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: agents.length,
    data: agents,
  });
});

// @desc    Get all public agents
// @route   GET /api/agents/public
// @access  Private
export const getPublicAgents = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = tenantContext.getTenantId(false) || req.user?.tenantId;
  const query: any = { isPublic: true };
  if (tenantId) {query.tenantId = tenantId;}

  const agents = await Agent.find(query)
    .populate('user', 'name')
    .populate('connectedAgents', 'name description')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: agents.length,
    data: agents,
  });
});

// @desc    Get single agent
// @route   GET /api/agents/:id
// @access  Private
export const getAgent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const agent = await Agent.findById(req.params.id)
    .populate('connectedAgents', 'name description')
    .populate('user', 'name email');

  if (!agent) {
    res.status(404).json({
      success: false,
      message: 'Agent not found',
    });
    return;
  }

  // Check tenant isolation
  const tenantId = tenantContext.getTenantId(false) || req.user.tenantId;
  if (tenantId && agent.tenantId && agent.tenantId !== tenantId) {
    res.status(403).json({
      success: false,
      message: 'Not authorized to access this agent (tenant mismatch)',
    });
    return;
  }

  // Check ownership
  const agentUserId = (agent.user as any)._id
    ? (agent.user as any)._id.toString()
    : agent.user.toString();

  if (agentUserId !== req.user.id && !agent.isPublic) {
    res.status(403).json({
      success: false,
      message: 'Not authorized to access this agent',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: agent,
  });
});

// @desc    Create new agent
// @route   POST /api/agents
// @access  Private
export const createAgent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const {
    name,
    description,
    provider,
    model,
    apiKeyId,
    systemPrompt,
    temperature,
    maxTokens,
    isPublic,
    traits,
    ciModel,
  } = req.body;

  // Verify API key belongs to user or use default (explicitly select key field)
  const user = await User.findById(req.user.id).select('+apiKeys.key');
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  let selectedApiKeyId = apiKeyId;

  // If no API key specified, use the first available key for the provider
  if (!apiKeyId || apiKeyId === '') {
    const defaultKey = user.apiKeys.find((key) => key.provider === provider && key.isActive);
    if (!defaultKey) {
      res.status(400).json({
        success: false,
        message: `No API key found for provider: ${provider}. Please add an API key in Settings.`,
      });
      return;
    }
    selectedApiKeyId = defaultKey._id;
  }

  const apiKey = user.apiKeys.find((key) => key._id?.toString() === selectedApiKeyId.toString());

  if (!apiKey) {
    res.status(400).json({
      success: false,
      message: 'Invalid API key',
    });
    return;
  }

  const tenantId = tenantContext.getTenantId(false) || req.user.tenantId;

  // Create agent
  const agent = await Agent.create({
    name,
    description,
    user: req.user.id,
    tenantId,
    provider,
    model,
    apiKeyId: selectedApiKeyId,
    systemPrompt,
    temperature,
    maxTokens,
    isPublic,
    traits,
    ciModel,
  });

  res.status(201).json({
    success: true,
    data: agent,
  });
});

// @desc    Update agent
// @route   PUT /api/agents/:id
// @access  Private
export const updateAgent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  let agent = await Agent.findById(req.params.id);

  if (!agent) {
    res.status(404).json({
      success: false,
      message: 'Agent not found',
    });
    return;
  }

  // Check ownership
  if (agent.user.toString() !== req.user.id) {
    res.status(403).json({
      success: false,
      message: 'Not authorized to update this agent',
    });
    return;
  }

  // Check tenant isolation
  const tenantId = tenantContext.getTenantId(false) || req.user.tenantId;
  if (tenantId && agent.tenantId && agent.tenantId !== tenantId) {
    res.status(403).json({
      success: false,
      message: 'Not authorized to update this agent (tenant mismatch)',
    });
    return;
  }

  agent = await Agent.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: agent,
  });
});

// @desc    Delete agent
// @route   DELETE /api/agents/:id
// @access  Private
export const deleteAgent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const agent = await Agent.findById(req.params.id);

  if (!agent) {
    res.status(404).json({
      success: false,
      message: 'Agent not found',
    });
    return;
  }

  // Check ownership
  if (agent.user.toString() !== req.user.id) {
    res.status(403).json({
      success: false,
      message: 'Not authorized to delete this agent',
    });
    return;
  }

  // Check tenant isolation
  const tenantId = tenantContext.getTenantId(false) || req.user.tenantId;
  if (tenantId && agent.tenantId && agent.tenantId !== tenantId) {
    res.status(403).json({
      success: false,
      message: 'Not authorized to delete this agent (tenant mismatch)',
    });
    return;
  }

  await agent.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Agent deleted successfully',
  });
});

// @desc    Connect agents
// @route   POST /api/agents/connect
// @access  Private
export const connectAgents = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { agentId, targetAgentId } = req.body;

  const agent = await Agent.findById(agentId);
  const targetAgent = await Agent.findById(targetAgentId);

  if (!agent || !targetAgent) {
    res.status(404).json({
      success: false,
      message: 'One or both agents not found',
    });
    return;
  }

  // Check tenant isolation for source agent
  const tenantId = tenantContext.getTenantId(false) || req.user.tenantId;
  if (tenantId && agent.tenantId && agent.tenantId !== tenantId) {
    res.status(403).json({
      success: false,
      message: 'Not authorized to modify this agent (tenant mismatch)',
    });
    return;
  }

  // Check ownership of source agent
  if (agent.user.toString() !== req.user.id) {
    res.status(403).json({
      success: false,
      message: 'Not authorized to modify this agent',
    });
    return;
  }

  // Check if target agent is public or owned by user
  if (targetAgent.user.toString() !== req.user.id && !targetAgent.isPublic) {
    res.status(403).json({
      success: false,
      message: 'Target agent is not accessible',
    });
    return;
  }

  // Check tenant isolation for target agent if not public
  if (
    !targetAgent.isPublic &&
    tenantId &&
    targetAgent.tenantId &&
    targetAgent.tenantId !== tenantId
  ) {
    res.status(403).json({
      success: false,
      message: 'Target agent is not accessible (tenant mismatch)',
    });
    return;
  }

  // Add connection if not already connected
  if (!agent.connectedAgents.includes(targetAgentId)) {
    agent.connectedAgents.push(targetAgentId);
    await agent.save();
  }

  res.status(200).json({
    success: true,
    message: 'Agents connected successfully',
    data: agent,
  });
});

// @desc    Add external system to agent
// @route   POST /api/agents/:id/external-systems
// @access  Private
export const addExternalSystem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const agent = await Agent.findById(req.params.id);

  if (!agent) {
    res.status(404).json({
      success: false,
      message: 'Agent not found',
    });
    return;
  }

  // Check ownership
  if (agent.user.toString() !== req.user.id) {
    res.status(403).json({
      success: false,
      message: 'Not authorized to modify this agent',
    });
    return;
  }

  // Check tenant isolation
  const tenantId = tenantContext.getTenantId(false) || req.user.tenantId;
  if (tenantId && agent.tenantId && agent.tenantId !== tenantId) {
    res.status(403).json({
      success: false,
      message: 'Not authorized to modify this agent (tenant mismatch)',
    });
    return;
  }

  const { name, type, endpoint, apiKey, config } = req.body;

  // Validate required fields
  if (!name || !type || !endpoint) {
    res.status(400).json({
      success: false,
      message: 'Name, type, and endpoint are required',
    });
    return;
  }

  // Check if external system with same name already exists
  const existingSystem = agent.externalSystems.find((sys) => sys.name === name);
  if (existingSystem) {
    res.status(400).json({
      success: false,
      message: 'External system with this name already exists',
    });
    return;
  }

  await agent.addExternalSystem({
    name,
    type,
    endpoint,
    apiKey,
    config,
  });

  res.status(201).json({
    success: true,
    message: 'External system added successfully',
    data: agent,
  });
});

// @desc    Update external system status
// @route   PUT /api/agents/:id/external-systems/:systemName/toggle
// @access  Private
export const toggleExternalSystem = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
      return;
    }

    // Check ownership
    if (agent.user.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to modify this agent',
      });
      return;
    }

    // Check tenant isolation
    const tenantId = tenantContext.getTenantId(false) || req.user.tenantId;
    if (tenantId && agent.tenantId && agent.tenantId !== tenantId) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to modify this agent (tenant mismatch)',
      });
      return;
    }

    const { isActive } = req.body;
    await agent.toggleExternalSystem(req.params.systemName as string, isActive);

    res.status(200).json({
      success: true,
      message: 'External system status updated',
      data: agent,
    });
  }
);

// @desc    Sync with external system
// @route   POST /api/agents/:id/external-systems/:systemName/sync
// @access  Private
export const syncExternalSystem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const agent = await Agent.findById(req.params.id);

  if (!agent) {
    res.status(404).json({
      success: false,
      message: 'Agent not found',
    });
    return;
  }

  // Check ownership
  if (agent.user.toString() !== req.user.id) {
    res.status(403).json({
      success: false,
      message: 'Not authorized to modify this agent',
    });
    return;
  }

  // Check tenant isolation
  const tenantId = tenantContext.getTenantId(false) || req.user.tenantId;
  if (tenantId && agent.tenantId && agent.tenantId !== tenantId) {
    res.status(403).json({
      success: false,
      message: 'Not authorized to modify this agent (tenant mismatch)',
    });
    return;
  }

  const systemName = req.params.systemName as string;
  const system = agent.externalSystems.find((sys) => sys.name === systemName);

  if (!system) {
    res.status(404).json({
      success: false,
      message: 'External system not found',
    });
    return;
  }

  if (!system.isActive) {
    res.status(400).json({
      success: false,
      message: 'External system is not active',
    });
    return;
  }

  // Update sync timestamp
  await agent.updateExternalSystemSync(systemName);

  // Here you would implement the actual sync logic based on system type
  // For now, we'll just return success
  res.status(200).json({
    success: true,
    message: `Synced with ${systemName} successfully`,
    data: {
      systemName,
      lastSync: new Date(),
      status: 'synced',
    },
  });
});

// @desc    Initiate bonding ritual
// @route   POST /api/agents/:id/bonding/initiate
// @access  Private
export const initiateBonding = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const agent = await Agent.findById(req.params.id);
  if (!agent) {
    res.status(404).json({ success: false, message: 'Agent not found' });
    return;
  }

  const isOwner = String(agent.user) === String(req.user.id);
  const isAdmin = Array.isArray(req.user?.roles) && req.user.roles.includes('admin');
  if (!isOwner && !isAdmin) {
    res.status(403).json({ success: false, message: 'Not authorized to modify this agent' });
    return;
  }

  // Check tenant isolation
  const tenantId = tenantContext.getTenantId(false) || req.user.tenantId;
  if (tenantId && agent.tenantId && agent.tenantId !== tenantId) {
    res.status(403).json({
      success: false,
      message: 'Not authorized to modify this agent (tenant mismatch)',
    });
    return;
  }

  const status = agent.bondingStatus || 'none';
  if (status !== 'none') {
    res
      .status(409)
      .json({
        success: false,
        message: 'Invalid state: bonding already initiated or completed',
        from: status,
      });
    return;
  }

  if (typeof agent.initiateBonding === 'function') {
    await agent.initiateBonding();
  } else {
    agent.bondingStatus = 'initiated';
    await agent.save();
  }

  // Ledger receipt (agent session)
  try {
    await appendEvent({
      session_id: `agent:${agent._id}`,
      prompt: '[BOND] initiate',
      response: `agent ${String(agent._id)} bonding initiated by ${String(
        req.user?.id || 'system'
      )}`,
      metadata: { bonding: { action: 'initiate' } },
      analysis: { actions: ['bonding_initiated'] },
    });
  } catch (_) {}

  res.json({ success: true, agentId: agent._id, bondingStatus: agent.bondingStatus });
});

// @desc    Complete bonding ritual
// @route   POST /api/agents/:id/bonding/complete
// @access  Private
export const completeBonding = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const agent = await Agent.findById(req.params.id);
  if (!agent) {
    res.status(404).json({ success: false, message: 'Agent not found' });
    return;
  }

  const isOwner = String(agent.user) === String(req.user.id);
  const isAdmin = Array.isArray(req.user?.roles) && req.user.roles.includes('admin');
  if (!isOwner && !isAdmin) {
    res.status(403).json({ success: false, message: 'Not authorized to modify this agent' });
    return;
  }

  // Check tenant isolation
  const tenantId = tenantContext.getTenantId(false) || req.user.tenantId;
  if (tenantId && agent.tenantId && agent.tenantId !== tenantId) {
    res.status(403).json({
      success: false,
      message: 'Not authorized to modify this agent (tenant mismatch)',
    });
    return;
  }

  const schema = {
    type: 'object',
    properties: {
      decision: { enum: ['bonded', 'rejected'] },
      notes: { type: 'string', maxLength: 2000 },
      traitsSnapshot: { type: 'object' },
    },
    required: ['decision'],
    additionalProperties: true,
  };
  const validate = ajv.compile(schema);
  if (!validate(req.body || {})) {
    res.status(400).json({ success: false, message: 'Invalid request', details: validate.errors });
    return;
  }

  const { decision, notes, traitsSnapshot } = req.body;
  const status = agent.bondingStatus || 'none';
  if (status !== 'initiated') {
    res
      .status(409)
      .json({ success: false, message: 'Invalid state: must be initiated', from: status });
    return;
  }

  if (typeof agent.completeBonding === 'function') {
    await agent.completeBonding(decision === 'bonded');
  } else {
    agent.bondingStatus = decision;
    await agent.save();
  }

  // Ledger receipt
  try {
    await appendEvent({
      session_id: `agent:${agent._id}`,
      prompt: '[BOND] complete',
      response: `agent ${String(agent._id)} bonding ${decision}`,
      metadata: { bonding: { action: 'complete', decision, notes, traitsSnapshot } },
      analysis: { actions: ['bonding_completed'] },
    });
  } catch (_) {}

  res.json({ success: true, agentId: agent._id, bondingStatus: agent.bondingStatus });
});
