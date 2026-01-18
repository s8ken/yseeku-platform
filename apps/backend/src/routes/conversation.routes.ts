/**
 * Conversation Routes
 * Chat history management with trust scores
 * Ported and enhanced from YCQ-Sonate/backend/routes/conversation.routes.js
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { Conversation, IMessage } from '../models/conversation.model';
import { Agent } from '../models/agent.model';
import { User } from '../models/user.model';
import { llmService } from '../services/llm.service';
import { TrustReceiptModel } from '../models/trust-receipt.model';
import { trustService } from '../services/trust.service';

const router = Router();

/**
 * @route   GET /api/conversations
 * @desc    Get all conversations for current user
 * @access  Private
 * @query   archived - Filter by archived status
 * @query   limit - Number of results (default: 50)
 * @query   offset - Pagination offset (default: 0)
 */
router.get('/', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { archived, limit = '50', offset = '0' } = req.query;

    const query: any = { user: req.userId };

    if (archived !== undefined) {
      query.isArchived = archived === 'true';
    }

    const conversations = await Conversation.find(query)
      .populate('agents', 'name model provider')
      .sort({ lastActivity: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const total = await Conversation.countDocuments(query);

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      },
    });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/conversations/:id
 * @desc    Get single conversation by ID
 * @access  Private
 */
router.get('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.userId,
    }).populate('agents', 'name model provider systemPrompt');

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { conversation },
    });
  } catch (error: any) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/conversations
 * @desc    Create new conversation
 * @access  Private
 * @body    { title, agentId?, ciEnabled?, contextTags? }
 */
router.post('/', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, agentId, ciEnabled, contextTags } = req.body;

    if (!title) {
      res.status(400).json({
        success: false,
        message: 'Conversation title is required',
      });
      return;
    }

    // Verify agent exists if provided
    const agents: any[] = [];
    if (agentId) {
      const agent = await Agent.findOne({
        _id: agentId,
        user: req.userId,
      });

      if (!agent) {
        res.status(404).json({
          success: false,
          message: 'Agent not found',
        });
        return;
      }

      agents.push(agent._id);
    }

    const conversation = await Conversation.create({
      title,
      user: req.userId,
      agents,
      ciEnabled: ciEnabled || false,
      contextTags: contextTags || [],
      messages: [],
    });

    await conversation.populate('agents', 'name model provider');

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: { conversation },
    });
  } catch (error: any) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/conversations/:id
 * @desc    Update conversation (title, archived status, tags)
 * @access  Private
 */
router.put('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, isArchived, contextTags, ciEnabled } = req.body;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
      return;
    }

    // Update fields
    if (title !== undefined) conversation.title = title;
    if (isArchived !== undefined) conversation.isArchived = isArchived;
    if (contextTags !== undefined) conversation.contextTags = contextTags;
    if (ciEnabled !== undefined) conversation.ciEnabled = ciEnabled;

    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation updated successfully',
      data: { conversation },
    });
  } catch (error: any) {
    console.error('Update conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update conversation',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/conversations/:id
 * @desc    Delete conversation
 * @access  Private
 */
router.delete('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully',
      data: { conversationId: conversation._id },
    });
  } catch (error: any) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete conversation',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/conversations/:id/messages
 * @desc    Get messages from conversation
 * @access  Private
 * @query   limit - Number of messages (default: 100)
 * @query   before - Get messages before this timestamp
 */
router.get('/:id/messages', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '100', before } = req.query;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
      return;
    }

    let messages = conversation.messages;

    // Filter by timestamp if 'before' is provided
    if (before) {
      const beforeDate = new Date(before as string);
      messages = messages.filter(msg => msg.timestamp < beforeDate);
    }

    // Limit messages
    const limitNum = parseInt(limit as string);
    const paginatedMessages = messages.slice(-limitNum);

    res.json({
      success: true,
      data: {
        messages: paginatedMessages,
        total: messages.length,
      },
    });
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/conversations/:id/messages
 * @desc    Add message to conversation and get AI response
 * @access  Private
 * @body    { content, agentId?, generateResponse? }
 */
router.post('/:id/messages', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, agentId, generateResponse = true } = req.body;

    if (!content) {
      res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
      return;
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
      return;
    }

    // Add user message
    const userMessage: IMessage = {
      sender: 'user',
      content,
      metadata: {
        messageId: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      },
      ciModel: 'none',
      trustScore: 5,
      timestamp: new Date(),
    };

    conversation.messages.push(userMessage);

    // Evaluate trust for user message
    try {
      const userTrustEval = await trustService.evaluateMessage(userMessage, {
        conversationId: conversation._id.toString(),
        sessionId: conversation._id.toString(),
        previousMessages: conversation.messages.slice(-11, -1), // Last 10 messages before this one
      });

      // Store trust evaluation in message metadata
      userMessage.metadata.trustEvaluation = {
        trustScore: userTrustEval.trustScore,
        status: userTrustEval.status,
        detection: userTrustEval.detection,
        receipt: userTrustEval.receipt,
        receiptHash: userTrustEval.receiptHash,
      };

      // Persist receipt in TrustReceipt collection (upsert)
      try {
        await TrustReceiptModel.updateOne(
          { self_hash: userTrustEval.receiptHash },
          {
            $set: {
              self_hash: userTrustEval.receiptHash,
              session_id: conversation._id.toString(),
              version: userTrustEval.receipt.version || '1.0.0',
              timestamp: userTrustEval.timestamp,
              mode: userTrustEval.receipt.mode || 'constitutional',
              ciq_metrics: userTrustEval.receipt.ciq_metrics || { clarity: 0, integrity: 0, quality: 0 },
              previous_hash: (userTrustEval.receipt as any).previous_hash,
              signature: userTrustEval.signature,
              tenant_id: req.userTenant || 'default',
              issuer: userTrustEval.issuer,
              subject: userTrustEval.subject,
              agent_id: userMessage.agentId,
              proof: userTrustEval.proof,
            },
          },
          { upsert: true }
        );
      } catch (persistErr: any) {
        console.warn('Failed to persist user trust receipt:', persistErr?.message || persistErr);
      }

      // Update message trust score (convert 0-10 to 0-5 scale)
      userMessage.trustScore = Math.round((userTrustEval.trustScore.overall / 10) * 5 * 10) / 10;
    } catch (trustError: any) {
      console.error('Trust evaluation error for user message:', trustError);
      // Continue even if trust evaluation fails
    }

    // Generate AI response if requested
    if (generateResponse) {
      // Clean up orphaned agent IDs from conversation
      const validAgents = [];
      for (const agentId of conversation.agents) {
        const agentExists = await Agent.findById(agentId);
        if (agentExists) {
          validAgents.push(agentId);
        }
      }
      conversation.agents = validAgents;
      
      // Get agent to use, fallback to user's first agent or any public agent
      let targetAgentId = agentId || conversation.agents[0];
      let agent = targetAgentId ? await Agent.findById(targetAgentId) : null;
      if (!agent) {
        // Try find user's agent or any public agent
        agent = await Agent.findOne({ user: req.userId });
        if (!agent) {
          const publicAgent = await Agent.findOne({ isPublic: true });
          if (publicAgent) {
            agent = publicAgent;
            targetAgentId = agent._id;
            if (!conversation.agents.includes(agent._id)) {
              conversation.agents.push(agent._id);
            }
          }
        }
        
        if (agent) {
          targetAgentId = agent._id;
          if (!conversation.agents.includes(agent._id)) {
            conversation.agents.push(agent._id);
          }
        } else {
          // Check if user has Anthropic API key before auto-provisioning
          const user = await User.findById(req.userId);
          const hasAnthropicKey = user?.apiKeys?.some(key => key.provider === 'anthropic' && key.isActive);
          
          if (hasAnthropicKey) {
            // Auto-provision a default Anthropic agent when user has the key
            const mongoose = require('mongoose');
            const apiKeyId = new mongoose.Types.ObjectId();
            agent = await Agent.create({
              name: 'Nova - Creative Writer',
              description: 'Anthropic agent for trustworthy creative assistance',
              user: req.userId,
              provider: 'anthropic',
              model: 'claude-sonnet-4-20250514',
              apiKeyId,
              systemPrompt: 'You are Nova, a helpful assistant. Be concise, accurate, and ethically aligned.',
              temperature: 0.7,
              maxTokens: 2000,
              isPublic: true,
              traits: new Map([
                ['ethical_alignment', 4.8],
                ['creativity', 4.5],
                ['precision', 4.6],
                ['adaptability', 4.2]
              ]),
              ciModel: 'symbi-core',
            });
            targetAgentId = agent._id;
            conversation.agents.push(agent._id);
          } else {
            // No agent and no API key - save user message and continue without AI
            await conversation.save();
            res.json({
              success: true,
              message: 'Message added successfully',
              data: {
                conversation,
                lastMessage: conversation.messages[conversation.messages.length - 1],
                warning: 'AI response not available - No agent configured. Please add an API key in settings.',
              },
            });
            return;
          }
        }
      }
      
      if (!agent) {
        await conversation.save();
        res.status(400).json({
          success: false,
          message: 'No agent available. Create an agent first.',
          data: { conversation },
        });
        return;
      }

      // Build conversation history for context
      const recentMessages = conversation.messages.slice(-10); // Last 10 messages
      const messages = [
        {
          role: 'system' as const,
          content: agent.systemPrompt,
        },
        ...recentMessages.map(msg => ({
          role: (msg.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: msg.content,
        })),
      ];

      try {
        // Generate response using LLM service
        const llmResponse = await llmService.generate({
          provider: agent.provider,
          model: agent.model,
          messages,
          temperature: agent.temperature,
          maxTokens: agent.maxTokens,
          userId: req.userId,
        });

        // Add AI response to conversation
        const aiMessage: IMessage = {
          sender: 'ai',
          content: llmResponse.content,
          agentId: agent._id,
          metadata: {
            messageId: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            model: agent.model,
            provider: agent.provider,
            usage: llmResponse.usage,
          },
          ciModel: agent.ciModel,
          trustScore: 5,
          timestamp: new Date(),
        };

        conversation.messages.push(aiMessage);

        // Evaluate trust for AI response
        try {
          const aiTrustEval = await trustService.evaluateMessage(aiMessage, {
            conversationId: conversation._id.toString(),
            sessionId: conversation._id.toString(),
            previousMessages: conversation.messages.slice(-11, -1), // Last 10 messages before this one
          });

          // Store trust evaluation in message metadata
          aiMessage.metadata.trustEvaluation = {
            trustScore: aiTrustEval.trustScore,
            status: aiTrustEval.status,
            detection: aiTrustEval.detection,
            receipt: aiTrustEval.receipt,
            receiptHash: aiTrustEval.receiptHash,
          };

          // Persist receipt in TrustReceipt collection (upsert)
          try {
            await TrustReceiptModel.updateOne(
              { self_hash: aiTrustEval.receiptHash },
              {
                $set: {
                  self_hash: aiTrustEval.receiptHash,
                  session_id: conversation._id.toString(),
                  version: aiTrustEval.receipt.version || '1.0.0',
                  timestamp: aiTrustEval.timestamp,
                  mode: aiTrustEval.receipt.mode || 'constitutional',
                  ciq_metrics: aiTrustEval.receipt.ciq_metrics || { clarity: 0, integrity: 0, quality: 0 },
                  previous_hash: (aiTrustEval.receipt as any).previous_hash,
                  signature: aiTrustEval.signature,
                  tenant_id: req.userTenant || 'default',
                  issuer: aiTrustEval.issuer,
                  subject: aiTrustEval.subject,
                  agent_id: aiMessage.agentId,
                  proof: aiTrustEval.proof,
                },
              },
              { upsert: true }
            );
          } catch (persistErr: any) {
            console.warn('Failed to persist AI trust receipt:', persistErr?.message || persistErr);
          }

          // Update message trust score (convert 0-10 to 0-5 scale)
          aiMessage.trustScore = Math.round((aiTrustEval.trustScore.overall / 10) * 5 * 10) / 10;

          // Log trust violations for AI responses
          if (aiTrustEval.status === 'FAIL' || aiTrustEval.status === 'PARTIAL') {
            console.warn(`Trust violation in AI response:`, {
              conversationId: conversation._id,
              agentId: agent._id,
              status: aiTrustEval.status,
              violations: aiTrustEval.trustScore.violations,
              trustScore: aiTrustEval.trustScore.overall,
            });
          }
        } catch (trustError: any) {
          console.error('Trust evaluation error for AI message:', trustError);
          // Continue even if trust evaluation fails
        }
      } catch (llmError: any) {
        console.error('LLM generation error:', llmError);
        // Save user message even if AI response fails
        await conversation.save();

        res.status(500).json({
          success: false,
          message: 'Failed to generate AI response',
          error: llmError.message,
          data: { conversation },
        });
        return;
      }
    }

    // Update last activity and save
    conversation.lastActivity = new Date();
    await conversation.save();

    // Recalculate ethical score
    await conversation.calculateEthicalScore();

    res.json({
      success: true,
      message: 'Message added successfully',
      data: {
        conversation,
        lastMessage: conversation.messages[conversation.messages.length - 1],
      },
    });
  } catch (error: any) {
    console.error('Add message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/conversations/:id/export
 * @desc    Export conversation to IPFS
 * @access  Private
 */
router.post('/:id/export', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
      return;
    }

    const exportResult = await conversation.exportToIPFS();

    res.json({
      success: true,
      message: 'Conversation exported successfully',
      data: exportResult,
    });
  } catch (error: any) {
    console.error('Export conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export conversation',
      error: error.message,
    });
  }
});

export default router;
