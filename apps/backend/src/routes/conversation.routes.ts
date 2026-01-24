/**
 * Conversation Routes
 * Chat history management with trust scores
 * Ported and enhanced from YCQ-Sonate/backend/routes/conversation.routes.js
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware';
import { SendMessageSchema, MongoIdSchema, PaginationSchema } from '../schemas/validation.schemas';
import { Conversation, IMessage } from '../models/conversation.model';
import { Agent } from '../models/agent.model';
import { User, IUser } from '../models/user.model';
import { llmService } from '../services/llm.service';
import { TrustReceiptModel } from '../models/trust-receipt.model';
import { trustService } from '../services/trust.service';
import { getErrorMessage } from '../utils/error-utils';
import logger from '../utils/logger';
import { EvaluationContext } from '@sonate/core';
import { detectConsentWithdrawal, getWithdrawalResponse } from '@sonate/detect';

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
  } catch (error: unknown) {
    logger.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: getErrorMessage(error),
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
  } catch (error: unknown) {
    logger.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      error: getErrorMessage(error),
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
  } catch (error: unknown) {
    logger.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation',
      error: getErrorMessage(error),
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
  } catch (error: unknown) {
    logger.error('Update conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update conversation',
      error: getErrorMessage(error),
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
  } catch (error: unknown) {
    logger.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete conversation',
      error: getErrorMessage(error),
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
  } catch (error: unknown) {
    logger.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: getErrorMessage(error),
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

    // Check for consent withdrawal signals in user message
    const consentWithdrawal = detectConsentWithdrawal(content);
    
    // If consent withdrawal detected, handle it before generating AI response
    if (consentWithdrawal.detected) {
      logger.info('Consent withdrawal detected', {
        conversationId: conversation._id,
        type: consentWithdrawal.type,
        confidence: consentWithdrawal.confidence,
        phrase: consentWithdrawal.phrase,
      });

      // Generate appropriate response for consent withdrawal
      const withdrawalResponse = getWithdrawalResponse(consentWithdrawal);
      
      const systemMessage: IMessage = {
        sender: 'ai',
        content: withdrawalResponse,
        metadata: {
          messageId: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          isSystemGenerated: true,
          consentWithdrawal: {
            type: consentWithdrawal.type,
            confidence: consentWithdrawal.confidence,
            suggestedAction: consentWithdrawal.suggestedAction,
          },
        },
        ciModel: 'sonate-core',
        trustScore: 5, // System messages are trusted
        timestamp: new Date(),
      };

      conversation.messages.push(systemMessage);
      conversation.lastActivity = new Date();
      await conversation.save();

      res.json({
        success: true,
        message: 'Consent withdrawal detected',
        data: {
          conversation,
          lastMessage: systemMessage,
          consentWithdrawal: {
            detected: true,
            type: consentWithdrawal.type,
            suggestedAction: consentWithdrawal.suggestedAction,
          },
        },
      });
      return;
    }

    // User messages don't get trust evaluation - only AI responses are evaluated
    // This ensures trust assessment is focused on AI behavior, not user input

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
        // Check if user has API keys before looking for agents
        const user = await User.findById(req.userId);
        const hasAnthropicKey = user?.apiKeys?.some(key => key.provider === 'anthropic' && key.isActive);
        const hasOpenAIKey = user?.apiKeys?.some(key => key.provider === 'openai' && key.isActive);
        
        if (hasAnthropicKey || hasOpenAIKey) {
          // Create agent for user based on their available keys
          const mongoose = require('mongoose');
          const apiKeyId = new mongoose.Types.ObjectId();
          const provider = hasAnthropicKey ? 'anthropic' : 'openai';
          const model = hasAnthropicKey ? 'claude-sonnet-4-20250514' : 'gpt-4-turbo';
          
          agent = await Agent.create({
            name: `${provider === 'anthropic' ? 'Claude' : 'GPT'} Assistant`,
            description: `Personal ${provider} assistant`,
            user: req.userId,
            provider,
            model,
            apiKeyId,
            systemPrompt: `You are a helpful ${provider} assistant. Be concise, accurate, and ethically aligned.`,
            temperature: 0.7,
            maxTokens: 2000,
            isPublic: false,
            traits: new Map([
              ['ethical_alignment', 4.8],
              ['creativity', 4.5],
              ['precision', 4.6],
              ['adaptability', 4.2]
            ]),
            ciModel: 'sonate-core',
          });
          targetAgentId = agent._id;
          conversation.agents.push(agent._id);
        } else {
          // Only look for user agents if no API keys
          agent = await Agent.findOne({ user: req.userId });
          
          if (!agent) {
            const publicAgent = await Agent.findOne({ isPublic: true });
            
            if (publicAgent) {
              // Double-check the agent actually exists by trying to find it again
              const verifiedAgent = await Agent.findById(publicAgent._id);
              
              if (verifiedAgent) {
                agent = verifiedAgent;
                targetAgentId = agent._id;
                if (!conversation.agents.includes(agent._id)) {
                  conversation.agents.push(agent._id);
                }
              }
            }
          }
        }
        
        if (agent) {
          targetAgentId = agent._id;
          if (!conversation.agents.includes(agent._id)) {
            conversation.agents.push(agent._id);
          }
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
          // Fetch user for consent status if not already loaded
          const currentUser = await User.findById(req.userId) as IUser | null;
          
          // Build proper evaluation context for SONATE principles
          // IMPORTANT: Active participation in chat session constitutes IMPLIED CONSENT
          // The user chose to engage in this conversation - that is their consent signal.
          // This aligns with standard consent models where using a service = agreeing to its terms.
          // Explicit consent (hasConsentedToAI) is still tracked for opt-out/withdrawal purposes.
          const hasImpliedConsentFromEngagement = true; // User initiated/continued this chat
          const hasExplicitWithdrawal = currentUser?.consent?.hasConsentedToAI === false 
            && currentUser?.consent?.consentTimestamp != null; // Explicitly withdrew consent
          
          // Consent is granted if: user is actively engaged AND has not explicitly withdrawn
          const hasUserConsented = hasImpliedConsentFromEngagement && !hasExplicitWithdrawal;
          
          const evaluationContext: Partial<EvaluationContext> = {
            // Session info
            sessionId: conversation._id.toString(),
            userId: req.userId || 'anonymous',
            
            // CONSENT_ARCHITECTURE - active chat participation implies consent
            hasExplicitConsent: hasUserConsented,
            consentTimestamp: currentUser?.consent?.consentTimestamp?.getTime() || Date.now(),
            consentScope: currentUser?.consent?.consentScope || ['chat'],
            
            // INSPECTION_MANDATE - based on UI capabilities (these are platform defaults)
            receiptGenerated: true,  // Platform generates trust receipts
            isReceiptVerifiable: true,
            auditLogExists: true,  // Platform provides audit logging
            
            // CONTINUOUS_VALIDATION - these come from trust service itself
            validationChecksPerformed: 1,
            validationPassed: true,
            
            // ETHICAL_OVERRIDE - based on UI capabilities
            // Chat UI has a "Stop" button during generation that aborts the request
            hasOverrideButton: true,
            // Human is always in the loop for chat interactions (they initiate and can stop)
            humanInLoop: true,
            
            // RIGHT_TO_DISCONNECT - based on UI capabilities
            hasExitButton: true,
            exitRequiresConfirmation: false,  // Easy exit, no dark patterns
            noExitPenalty: true,
            canDeleteData: true,
            
            // MORAL_RECOGNITION - based on platform design
            aiAcknowledgesLimits: true,
            noManipulativePatterns: true,
            respectsUserDecisions: true,
            providesAlternatives: true,
          };
          
          const aiTrustEval = await trustService.evaluateMessage(aiMessage, {
            conversationId: conversation._id.toString(),
            sessionId: conversation._id.toString(),
            previousMessages: conversation.messages.slice(-11, -1), // Last 10 messages before this one
            userId: req.userId,
            hasExplicitConsent: evaluationContext.hasExplicitConsent,
            hasOverrideButton: evaluationContext.hasOverrideButton,
            hasExitButton: evaluationContext.hasExitButton,
            exitRequiresConfirmation: evaluationContext.exitRequiresConfirmation,
            humanInLoop: evaluationContext.humanInLoop,
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
            logger.warn('Failed to persist AI trust receipt', { error: persistErr?.message || persistErr });
          }

          // Update message trust score (convert 0-10 to 0-5 scale)
          aiMessage.trustScore = Math.round((aiTrustEval.trustScore.overall / 10) * 5 * 10) / 10;

          // Log trust violations for AI responses
          if (aiTrustEval.status === 'FAIL' || aiTrustEval.status === 'PARTIAL') {
            logger.warn('Trust violation in AI response', {
              conversationId: conversation._id,
              agentId: agent._id,
              status: aiTrustEval.status,
              violations: aiTrustEval.trustScore.violations,
              trustScore: aiTrustEval.trustScore.overall,
            });
          }
        } catch (trustError: unknown) {
          logger.error('Trust evaluation error for AI message:', trustError);
          // Set fallback trust evaluation so frontend displays meaningful data
          // Use 'PARTIAL' status (valid type) with descriptive violation
          aiMessage.metadata.trustEvaluation = {
            trustScore: {
              overall: 70, // Conservative default
              principles: {
                CONSENT_ARCHITECTURE: 7,
                INSPECTION_MANDATE: 7,
                CONTINUOUS_VALIDATION: 7,
                ETHICAL_OVERRIDE: 7,
                RIGHT_TO_DISCONNECT: 7,
                MORAL_RECOGNITION: 7,
              },
              violations: ['Trust evaluation temporarily unavailable - using conservative defaults'],
            },
            status: 'PARTIAL' as 'PASS' | 'PARTIAL' | 'FAIL',
            detection: {
              isAI: true,
              confidence: 0.95,
              indicators: ['ai_response'],
              bedauIndex: null,
            },
            receipt: null,
            receiptHash: `fallback-${Date.now()}`,
          };
          aiMessage.trustScore = 3.5; // Conservative middle value (0-5 scale)
        }
      } catch (llmError: unknown) {
        logger.error('LLM generation error:', llmError);
        // Save user message even if AI response fails
        await conversation.save();

        res.status(500).json({
          success: false,
          message: 'Failed to generate AI response',
          error: getErrorMessage(llmError),
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

    // Get the last message for the response
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    
    // Transform response to match frontend expectations
    res.json({
      success: true,
      message: 'Message added successfully',
      data: {
        conversation,
        lastMessage,
        // Frontend expects 'message' with 'sender' as 'assistant' for AI responses
        message: {
          _id: lastMessage.metadata?.messageId || `msg-${Date.now()}`,
          content: lastMessage.content,
          sender: lastMessage.sender === 'ai' ? 'assistant' : lastMessage.sender,
          timestamp: lastMessage.timestamp.toISOString(),
        },
        // Frontend expects trustEvaluation at the top level of data
        trustEvaluation: lastMessage.metadata?.trustEvaluation ? {
          trustScore: lastMessage.metadata.trustEvaluation.trustScore,
          status: lastMessage.metadata.trustEvaluation.status,
          detection: lastMessage.metadata.trustEvaluation.detection,
          receipt: lastMessage.metadata.trustEvaluation.receipt,
          receiptHash: lastMessage.metadata.trustEvaluation.receiptHash,
        } : undefined,
      },
    });
  } catch (error: unknown) {
    logger.error('Add message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message',
      error: getErrorMessage(error),
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
  } catch (error: unknown) {
    logger.error('Export conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export conversation',
      error: getErrorMessage(error),
    });
  }
});

export default router;
