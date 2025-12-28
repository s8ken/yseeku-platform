import { Agent, User } from './agent.model';
import asyncHandler from 'express-async-handler';
import Ajv from 'ajv';
import { appendEvent } from '../services/ledger.service';
import { OrchestrateService } from './orchestrate-service';

const ajv = new Ajv({ allErrors: true, removeAdditional: true });

// @desc    Get all agents for user
// @route   GET /api/agents
// @access  Private
const getAllAgents = asyncHandler(async (req, res) => {
  const agents = await Agent.find({ user: req.user.id })
    .populate('connectedAgents', 'name description')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: agents.length,
    data: agents
  });
});

// @desc    Get all public agents
// @route   GET /api/agents/public
// @access  Private
const getPublicAgents = asyncHandler(async (req, res) => {
  const agents = await Agent.find({ isPublic: true })
    .populate('user', 'name')
    .populate('connectedAgents', 'name description')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: agents.length,
    data: agents
  });
});

// @desc    Get single agent
// @route   GET /api/agents/:id
// @access  Private
const getAgent = asyncHandler(async (req, res) => {
  const agent = await Agent.findById(req.params.id)
    .populate('connectedAgents', 'name description')
    .populate('user', 'name email');

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  // Check ownership
  if (agent.user._id.toString() !== req.user.id && !agent.isPublic) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this agent'
    });
  }

  res.status(200).json({
    success: true,
    data: agent
  });
});

// @desc    Create new agent
// @route   POST /api/agents
// @access  Private
const createAgent = asyncHandler(async (req, res) => {
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
    ciModel
  } = req.body;

  // Verify API key belongs to user or use default (explicitly select key field)
  const user = await User.findById(req.user.id).select('+apiKeys.key');
  let selectedApiKeyId = apiKeyId;
  
  // If no API key specified, use the first available key for the provider
  if (!apiKeyId || apiKeyId === '') {
    const defaultKey = user.apiKeys.find(key => key.provider === provider && key.isActive);
    if (!defaultKey) {
      return res.status(400).json({
        success: false,
        message: `No API key found for provider: ${provider}. Please add an API key in Settings.`
      });
    }
    selectedApiKeyId = defaultKey._id;
  }
  
  const apiKey = user.apiKeys.id(selectedApiKeyId);
  
  if (!apiKey) {
    return res.status(400).json({
      success: false,
      message: 'Invalid API key'
    });
  }

  const agent = await Agent.create({
    name,
    description,
    user: req.user.id,
    provider,
    model,
    apiKeyId: selectedApiKeyId,
    systemPrompt,
    temperature,
    maxTokens,
    isPublic,
    traits,
    ciModel
  });

  res.status(201).json({
    success: true,
    data: agent
  });
});

// @desc    Update agent
// @route   PUT /api/agents/:id
// @access  Private
const updateAgent = asyncHandler(async (req, res) => {
  let agent = await Agent.findById(req.params.id);

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  // Check ownership
  if (agent.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this agent'
    });
  }

  agent = await Agent.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: agent
  });
});

// @desc    Delete agent
// @route   DELETE /api/agents/:id
// @access  Private
const deleteAgent = asyncHandler(async (req, res) => {
  const agent = await Agent.findById(req.params.id);

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  // Check ownership
  if (agent.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this agent'
    });
  }

  await agent.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Agent deleted successfully'
  });
});

// @desc    Connect agents
// @route   POST /api/agents/connect
// @access  Private
const connectAgents = asyncHandler(async (req, res) => {
  const { agentId, targetAgentId } = req.body;

  const agent = await Agent.findById(agentId);
  const targetAgent = await Agent.findById(targetAgentId);

  if (!agent || !targetAgent) {
    return res.status(404).json({
      success: false,
      message: 'One or both agents not found'
    });
  }

  // Check ownership of source agent
  if (agent.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to modify this agent'
    });
  }

  // Check if target agent is public or owned by user
  if (targetAgent.user.toString() !== req.user.id && !targetAgent.isPublic) {
    return res.status(403).json({
      success: false,
      message: 'Target agent is not accessible'
    });
  }

  // Add connection if not already connected
  if (!agent.connectedAgents.includes(targetAgentId)) {
    agent.connectedAgents.push(targetAgentId);
    await agent.save();
  }

  res.status(200).json({
    success: true,
    message: 'Agents connected successfully',
    data: agent
  });
});

// @desc    Add external system to agent
// @route   POST /api/agents/:id/external-systems
// @access  Private
const addExternalSystem = asyncHandler(async (req, res) => {
  const agent = await Agent.findById(req.params.id);

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  // Check ownership
  if (agent.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to modify this agent'
    });
  }

  const { name, type, endpoint, apiKey, config } = req.body;

  // Validate required fields
  if (!name || !type || !endpoint) {
    return res.status(400).json({
      success: false,
      message: 'Name, type, and endpoint are required'
    });
  }

  // Check if external system with same name already exists
  const existingSystem = agent.externalSystems.find(sys => sys.name === name);
  if (existingSystem) {
    return res.status(400).json({
      success: false,
      message: 'External system with this name already exists'
    });
  }

  await agent.addExternalSystem({
    name,
    type,
    endpoint,
    apiKey,
    config
  });

  res.status(201).json({
    success: true,
    message: 'External system added successfully',
    data: agent
  });
});

// @desc    Update external system status
// @route   PUT /api/agents/:id/external-systems/:systemName/toggle
// @access  Private
const toggleExternalSystem = asyncHandler(async (req, res) => {
  const agent = await Agent.findById(req.params.id);

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  // Check ownership
  if (agent.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to modify this agent'
    });
  }

  const { isActive } = req.body;
  await agent.toggleExternalSystem(req.params.systemName, isActive);

  res.status(200).json({
    success: true,
    message: 'External system status updated',
    data: agent
  });
});

// @desc    Sync with external system
// @route   POST /api/agents/:id/external-systems/:systemName/sync
// @access  Private
const syncExternalSystem = asyncHandler(async (req, res) => {
  const agent = await Agent.findById(req.params.id);

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }

  // Check ownership
  if (agent.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to modify this agent'
    });
  }

  const systemName = req.params.systemName;
  const system = agent.externalSystems.find(sys => sys.name === systemName);

  if (!system) {
    return res.status(404).json({
      success: false,
      message: 'External system not found'
    });
  }

  if (!system.isActive) {
    return res.status(400).json({
      success: false,
      message: 'External system is not active'
    });
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
      status: 'synced'
    }
  });
});

module.exports = {
  getAllAgents,
  getPublicAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  connectAgents,
  addExternalSystem,
  toggleExternalSystem,
  syncExternalSystem,
  // Bonding: initiate
  initiateBonding: asyncHandler(async (req, res) => {
    const agent = await Agent.findById(req.params.id);
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

    const isOwner = String(agent.user) === String(req.user.id);
    const isAdmin = Array.isArray(req.user?.roles) && req.user.roles.includes('admin');
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this agent' });
    }

    const status = agent.bondingStatus || 'none';
    if (status !== 'none') {
      return res.status(409).json({ success: false, message: 'Invalid state: bonding already initiated or completed', from: status });
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
        response: `agent ${String(agent._id)} bonding initiated by ${String(req.user?.id || 'system')}`,
        metadata: { bonding: { action: 'initiate' } },
        analysis: { actions: ['bonding_initiated'] }
      });
    } catch (_) {}

    return res.json({ success: true, agentId: agent._id, bondingStatus: agent.bondingStatus });
  }),
  // Bonding: complete
  completeBonding: asyncHandler(async (req, res) => {
    const agent = await Agent.findById(req.params.id);
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

    const isOwner = String(agent.user) === String(req.user.id);
    const isAdmin = Array.isArray(req.user?.roles) && req.user.roles.includes('admin');
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this agent' });
    }

    const schema = {
      type: 'object',
      properties: {
        decision: { enum: ['bonded', 'rejected'] },
        notes: { type: 'string', maxLength: 2000 },
        traitsSnapshot: { type: 'object' }
      },
      required: ['decision'],
      additionalProperties: true
    };
    const validate = ajv.compile(schema);
    if (!validate(req.body || {})) {
      return res.status(400).json({ success: false, message: 'Invalid request', details: validate.errors });
    }

    const { decision, notes, traitsSnapshot } = req.body;
    const status = agent.bondingStatus || 'none';
    if (status !== 'initiated') {
      return res.status(409).json({ success: false, message: 'Invalid state: must be initiated', from: status });
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
        analysis: { actions: ['bonding_completed'] }
      });
    } catch (_) {}

    return res.json({ success: true, agentId: agent._id, bondingStatus: agent.bondingStatus });
  })
};
