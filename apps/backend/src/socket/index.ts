/**
 * Socket.IO Real-time Chat Server
 * Handles WebSocket connections for live chat with AI agents
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { authService } from '../middleware/auth.middleware';
import { Conversation, IMessage } from '../models/conversation.model';
import { Agent } from '../models/agent.model';
import { llmService } from '../services/llm.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export function initializeSocket(io: SocketIOServer): void {
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
    } catch (error: any) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 User connected: ${socket.username} (${socket.userId})`);

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

        console.log(`User ${socket.username} joined conversation: ${conversationId}`);
      } catch (error: any) {
        console.error('Join conversation error:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    /**
     * Leave a conversation room
     */
    socket.on('leave:conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      socket.emit('left:conversation', { conversationId });
      console.log(`User ${socket.username} left conversation: ${conversationId}`);
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
          metadata: { socketId: socket.id },
          ciModel: 'none',
          trustScore: 5,
          timestamp: new Date(),
        };

        conversation.messages.push(userMessage);
        await conversation.save();

        // Broadcast user message to conversation room
        io.to(`conversation:${conversationId}`).emit('message:new', {
          conversationId,
          message: userMessage,
        });

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

            // Generate response
            const llmResponse = await llmService.generate({
              provider: agent.provider,
              model: agent.model,
              messages,
              temperature: agent.temperature,
              maxTokens: agent.maxTokens,
              userId: socket.userId,
            });

            // Create AI message
            const aiMessage: IMessage = {
              sender: 'ai',
              content: llmResponse.content,
              agentId: agent._id,
              metadata: {
                model: agent.model,
                provider: agent.provider,
                usage: llmResponse.usage,
              },
              ciModel: agent.ciModel,
              trustScore: 5,
              timestamp: new Date(),
            };

            conversation.messages.push(aiMessage);
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
          } catch (llmError: any) {
            console.error('LLM generation error:', llmError);

            // Stop typing indicator
            io.to(`conversation:${conversationId}`).emit('agent:stopped-typing', {
              conversationId,
            });

            socket.emit('error', {
              message: 'Failed to generate AI response',
              error: llmError.message,
            });
          }
        }
      } catch (error: any) {
        console.error('Send message error:', error);
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
      console.log(`🔌 User disconnected: ${socket.username} (${socket.userId})`);
    });
  });
}
