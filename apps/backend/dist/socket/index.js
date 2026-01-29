"use strict";
/**
 * Socket.IO Real-time Chat Server
 * Handles WebSocket connections for live chat with AI agents
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = initializeSocket;
const redis_adapter_1 = require("@socket.io/redis-adapter");
const ioredis_1 = __importDefault(require("ioredis"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const conversation_model_1 = require("../models/conversation.model");
const agent_model_1 = require("../models/agent.model");
const llm_service_1 = require("../services/llm.service");
const trust_service_1 = require("../services/trust.service");
const rate_limit_1 = require("./rate-limit");
const socket_metrics_1 = require("../observability/socket-metrics");
const tracing_1 = require("../observability/tracing");
const logger_1 = require("../utils/logger");
const error_utils_1 = require("../utils/error-utils");
function initializeSocket(io) {
    // Optional Redis adapter for horizontal scaling
    if (process.env.REDIS_URL) {
        const pub = new ioredis_1.default(process.env.REDIS_URL);
        const sub = new ioredis_1.default(process.env.REDIS_URL);
        io.adapter((0, redis_adapter_1.createAdapter)(pub, sub));
    }
    // Authentication middleware for Socket.IO
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return next(new Error('Authentication token required'));
            }
            // Verify JWT token
            const payload = auth_middleware_1.authService.verifyToken(token);
            socket.userId = payload.userId;
            socket.username = payload.username;
            next();
        }
        catch (error) {
            logger_1.logger.error('Socket authentication error', { error: (0, error_utils_1.getErrorMessage)(error) });
            next(new Error('Authentication failed'));
        }
    });
    // Connection handler
    io.on('connection', (socket) => {
        logger_1.logger.info(`🔌 User connected: ${socket.username} (${socket.userId})`);
        // Join user's personal room for private notifications
        socket.join(`user:${socket.userId}`);
        /**
         * Join a conversation room
         */
        socket.on('join:conversation', async (conversationId) => {
            try {
                // Verify user has access to this conversation
                const conversation = await conversation_model_1.Conversation.findOne({
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
                logger_1.logger.info(`User ${socket.username} joined conversation: ${conversationId}`);
            }
            catch (error) {
                logger_1.logger.error('Join conversation error', { error: (0, error_utils_1.getErrorMessage)(error) });
                socket.emit('error', { message: 'Failed to join conversation' });
            }
        });
        /**
         * Leave a conversation room
         */
        socket.on('leave:conversation', (conversationId) => {
            socket.leave(`conversation:${conversationId}`);
            socket.emit('left:conversation', { conversationId });
            logger_1.logger.info(`User ${socket.username} left conversation: ${conversationId}`);
        });
        /**
         * Send a message to conversation (real-time chat)
         */
        socket.on('message:send', async (data) => {
            try {
                if (socket.userId && !(0, rate_limit_1.allow)(socket.userId)) {
                    socket.emit('error', { message: 'Rate limit exceeded' });
                    (0, socket_metrics_1.recordSocketEvent)('message:send', 'error');
                    return;
                }
                const { conversationId, content, agentId, generateResponse = true } = data;
                if (!content) {
                    socket.emit('error', { message: 'Message content is required' });
                    return;
                }
                // Find conversation
                const conversation = await conversation_model_1.Conversation.findOne({
                    _id: conversationId,
                    user: socket.userId,
                });
                if (!conversation) {
                    socket.emit('error', { message: 'Conversation not found' });
                    return;
                }
                // Create user message
                const userMessage = {
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
                    const userTrustEval = await trust_service_1.trustService.evaluateMessage(userMessage, {
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
                }
                catch (trustError) {
                    logger_1.logger.error('Trust evaluation error (Socket.IO user message)', { error: (0, error_utils_1.getErrorMessage)(trustError) });
                }
                await conversation.save();
                // Broadcast user message to conversation room
                io.to(`conversation:${conversationId}`).emit('message:new', {
                    conversationId,
                    message: userMessage,
                });
                (0, socket_metrics_1.recordSocketEvent)('message:send', 'ok');
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
                        const agent = await agent_model_1.Agent.findById(targetAgentId);
                        if (!agent) {
                            throw new Error('Agent not found');
                        }
                        // Build conversation context
                        const recentMessages = conversation.messages.slice(-10);
                        const messages = [
                            {
                                role: 'system',
                                content: agent.systemPrompt,
                            },
                            ...recentMessages.map(msg => ({
                                role: (msg.sender === 'user' ? 'user' : 'assistant'),
                                content: msg.content,
                            })),
                        ];
                        // Generate response within trace span
                        const llmResponse = await (0, tracing_1.withSpan)('llm.generate', async () => {
                            return llm_service_1.llmService.generate({
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
                        const aiMessage = {
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
                            const aiTrustEval = await trust_service_1.trustService.evaluateMessage(aiMessage, {
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
                        }
                        catch (trustError) {
                            logger_1.logger.error('Trust evaluation error (Socket.IO AI message)', { error: (0, error_utils_1.getErrorMessage)(trustError) });
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
                    }
                    catch (llmError) {
                        logger_1.logger.error('LLM generation error', { error: (0, error_utils_1.getErrorMessage)(llmError) });
                        // Stop typing indicator
                        io.to(`conversation:${conversationId}`).emit('agent:stopped-typing', {
                            conversationId,
                        });
                        socket.emit('error', {
                            message: 'Failed to generate AI response',
                            error: (0, error_utils_1.getErrorMessage)(llmError),
                        });
                    }
                }
            }
            catch (error) {
                logger_1.logger.error('Send message error', { error: (0, error_utils_1.getErrorMessage)(error) });
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        /**
         * User is typing indicator
         */
        socket.on('typing:start', (conversationId) => {
            socket.to(`conversation:${conversationId}`).emit('user:typing', {
                conversationId,
                userId: socket.userId,
                username: socket.username,
            });
        });
        socket.on('typing:stop', (conversationId) => {
            socket.to(`conversation:${conversationId}`).emit('user:stopped-typing', {
                conversationId,
                userId: socket.userId,
            });
        });
        /**
         * Disconnect handler
         */
        socket.on('disconnect', () => {
            logger_1.logger.info(`🔌 User disconnected: ${socket.username} (${socket.userId})`);
        });
    });
}
