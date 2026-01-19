/**
 * Socket.IO Real-time Chat Server
 * Handles WebSocket connections for live chat with AI agents
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { authService } from '../middleware/auth.middleware';
import { Conversation, IMessage } from '../models/conversation.model';
import { Agent } from '../models/agent.model';
import { llmService } from '../services/llm.service';
import { trustService } from '../services/trust.service';
import { allow } from './rate-limit';
import { recordSocketEvent } from '../observability/socket-metrics';
import { tracer, withSpan } from '../observability/tracing';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export function initializeSocket(io: SocketIOServer): void {
  // Optional Redis adapter for horizontal scaling
  if (process.env.REDIS_URL) {
    const pub = new Redis(process.env.REDIS_URL);
    const sub = new Redis(process.env.REDIS_URL);
    io.adapter(createAdapter(pub, sub));
  }
  // Authentication middleware for Socket.IO
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const payload = authService.verifyToken(token);
      socket.userId = payload.userId;
      socket.username = payload.username;

      next();
    } catch (error: unknown) {
      logger.error('Socket authentication error', { error: getErrorMessage(error) });
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`🔌 User connected: ${socket.username} (${socket.userId})`);

    // Join user's personal room for private notifications
    socket.join(`user:${socket.userId}`);

    /**
     * Join a conversation room
     */
    socket.on('join:conversation', async (conversationId: string) => {
      try {
        // Verify user has access to this conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          user: socket.userId,
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found or access denied' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        socket.emit('joined:conversation', {
          conversationId,
          messageCount: conversation.messages.length,
        });

        logger.info(`User ${socket.username} joined conversation: ${conversationId}`);
      } catch (error: unknown) {
        logger.error('Join conversation error', { error: getErrorMessage(error) });
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    /**
     * Leave a conversation room
     */
    socket.on('leave:conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      socket.emit('left:conversation', { conversationId });
      logger.info(`User ${socket.username} left conversation: ${conversationId}`);
    });

    /**
     * Send a message to conversation (real-time chat)
     */
    socket.on('message:send', async (data: {
      conversationId: string;
      content: string;
      agentId?: string;
      generateResponse?: boolean;
    }) => {
      try {
        if (socket.userId && !allow(socket.userId)) {
          socket.emit('error', { message: 'Rate limit exceeded' });
          recordSocketEvent('message:send','error');
          return;
        }
        const { conversationId, content, agentId, generateResponse = true } = data;

        if (!content) {
          socket.emit('error', { message: 'Message content is required' });
          return;
        }

        // Find conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          user: socket.userId,
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // Create user message
        const userMessage: IMessage = {
          sender: 'user',
          content,
          metadata: {
            socketId: socket.id,
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
            conversationId: conversationId,
            sessionId: conversationId,
            previousMessages: conversation.messages.slice(-11, -1),
          });

          userMessage.metadata.trustEvaluation = {
            trustScore: userTrustEval.trustScore,
            status: userTrustEval.status,
            detection: userTrustEval.detection,
            receiptHash: userTrustEval.receiptHash,
          };
          userMessage.trustScore = Math.round((userTrustEval.trustScore.overall / 10) * 5 * 10) / 10;
        } catch (trustError: unknown) {
          logger.error('Trust evaluation error (Socket.IO user message)', { error: getErrorMessage(trustError) });
        }

        await conversation.save();

        // Broadcast user message to conversation room
        io.to(`conversation:${conversationId}`).emit('message:new', {
          conversationId,
          message: userMessage,
        });
        recordSocketEvent('message:send','ok');

        // Generate AI response if requested
        if (generateResponse) {
          // Emit typing indicator
          io.to(`conversation:${conversationId}`).emit('agent:typing', {
            conversationId,
            agentId: agentId || conversation.agents[0],
          });

          try {
            // Get agent
            const targetAgentId = agentId || conversation.agents[0];
            const agent = await Agent.findById(targetAgentId);

            if (!agent) {
              throw new Error('Agent not found');
            }

            // Build conversation context
            const recentMessages = conversation.messages.slice(-10);
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

            // Generate response within trace span
            const llmResponse = await withSpan('llm.generate', async () => {
              return llmService.generate({
                provider: agent.provider,
                model: agent.model,
                messages,
                temperature: agent.temperature,
                maxTokens: agent.maxTokens,
                userId: socket.userId,
              });
            }, undefined, {
              'user.id': socket.userId || 'unknown',
              'agent.id': String(targetAgentId),
              'llm.provider': agent.provider,
              'llm.model': agent.model,
            });

            // Create AI message
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
                conversationId: conversationId,
                sessionId: conversationId,
                previousMessages: conversation.messages.slice(-11, -1),
              });

              aiMessage.metadata.trustEvaluation = {
                trustScore: aiTrustEval.trustScore,
                status: aiTrustEval.status,
                detection: aiTrustEval.detection,
                receiptHash: aiTrustEval.receiptHash,
              };
              aiMessage.trustScore = Math.round((aiTrustEval.trustScore.overall / 10) * 5 * 10) / 10;

              // Emit trust violation event if needed
              if (aiTrustEval.status === 'FAIL' || aiTrustEval.status === 'PARTIAL') {
                io.to(`conversation:${conversationId}`).emit('trust:violation', {
                  conversationId,
                  messageId: aiMessage.metadata.messageId,
                  status: aiTrustEval.status,
                  violations: aiTrustEval.trustScore.violations,
                  trustScore: aiTrustEval.trustScore.overall,
                });
              }
            } catch (trustError: unknown) {
              logger.error('Trust evaluation error (Socket.IO AI message)', { error: getErrorMessage(trustError) });
            }

            conversation.lastActivity = new Date();
            await conversation.save();

            // Stop typing indicator
            io.to(`conversation:${conversationId}`).emit('agent:stopped-typing', {
              conversationId,
              agentId: agent._id,
            });

            // Broadcast AI response
            io.to(`conversation:${conversationId}`).emit('message:new', {
              conversationId,
              message: aiMessage,
            });
          } catch (llmError: unknown) {
            logger.error('LLM generation error', { error: getErrorMessage(llmError) });

            // Stop typing indicator
            io.to(`conversation:${conversationId}`).emit('agent:stopped-typing', {
              conversationId,
            });

            socket.emit('error', {
              message: 'Failed to generate AI response',
              error: getErrorMessage(llmError),
            });
          }
        }
      } catch (error: unknown) {
        logger.error('Send message error', { error: getErrorMessage(error) });
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * User is typing indicator
     */
    socket.on('typing:start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user:typing', {
        conversationId,
        userId: socket.userId,
        username: socket.username,
      });
    });

    socket.on('typing:stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user:stopped-typing', {
        conversationId,
        userId: socket.userId,
      });
    });

    /**
     * Disconnect handler
     */
    socket.on('disconnect', () => {
      logger.info(`🔌 User disconnected: ${socket.username} (${socket.userId})`);
    });
  });
}
