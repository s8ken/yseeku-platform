/**
 * Agent Bus Implementation
 * Event-driven communication system for multi-agent experiments
 * Implements double-blind protocols to prevent identity leakage
 */

import { v4 as uuidv4 } from 'uuid';
import { AgentRole, AgentMessage, ExperimentError } from './types';

/**
 * Agent Bus Interface
 * Abstracts communication between agents while maintaining double-blind integrity
 */
export interface AgentBus {
  publish<T>(message: AgentMessage<T>): Promise<void>;
  subscribe(role: AgentRole, handler: (message: AgentMessage) => Promise<void>): Promise<void>;
  unsubscribe(role: AgentRole): Promise<void>;
  getMessageHistory(role?: AgentRole, experimentId?: string): AgentMessage[];
}

/**
 * In-Memory Agent Bus (v1)
 * Simple in-process implementation for development and small-scale usage
 */
export class InMemoryAgentBus implements AgentBus {
  private handlers: Map<AgentRole, (message: AgentMessage) => Promise<void>> = new Map();
  private messageHistory: AgentMessage[] = [];
  private messageBuffer: Map<string, AgentMessage[]> = new Map();

  async publish<T>(message: AgentMessage<T>): Promise<void> {
    // Validate message integrity
    this.validateMessage(message);
    
    // Add timestamp if not present
    if (!message.createdAt) {
      message.createdAt = new Date().toISOString();
    }

    // Store in history
    this.messageHistory.push(message);
    
    // Buffer for specific experiments
    if (!this.messageBuffer.has(message.experimentId)) {
      this.messageBuffer.set(message.experimentId, []);
    }
    this.messageBuffer.get(message.experimentId)!.push(message);

    // Route to target handler
    const handler = this.handlers.get(message.to);
    if (handler) {
      try {
        // Apply double-blind filtering
        const filteredMessage = this.applyDoubleBlindFilter(message);
        await handler(filteredMessage);
      } catch (error) {
        console.error(`Error handling message to ${message.to}:`, error);
        throw new ExperimentError(
          `Failed to deliver message to ${message.to}`,
          "MESSAGE_DELIVERY_FAILED",
          message.experimentId,
          message.runId
        );
      }
    } else {
      // Store for later delivery if handler not registered yet
      console.warn(`No handler registered for role: ${message.to}`);
    }
  }

  async subscribe(role: AgentRole, handler: (message: AgentMessage) => Promise<void>): Promise<void> {
    this.handlers.set(role, handler);
    
    // Process any buffered messages for this role
    const buffered = this.getBufferedMessages(role);
    for (const message of buffered) {
      try {
        const filteredMessage = this.applyDoubleBlindFilter(message);
        await handler(filteredMessage);
      } catch (error) {
        console.error(`Error processing buffered message:`, error);
      }
    }
  }

  async unsubscribe(role: AgentRole): Promise<void> {
    this.handlers.delete(role);
  }

  getMessageHistory(role?: AgentRole, experimentId?: string): AgentMessage[] {
    let messages = this.messageHistory;
    
    if (experimentId) {
      messages = messages.filter(msg => msg.experimentId === experimentId);
    }
    
    if (role) {
      messages = messages.filter(msg => msg.from === role || msg.to === role);
    }
    
    return messages;
  }

  /**
   * Validate message structure and content
   */
  private validateMessage(message: AgentMessage): void {
    if (!message.id) {
      throw new ExperimentError("Message ID is required", "INVALID_MESSAGE");
    }
    
    if (!message.from || !message.to) {
      throw new ExperimentError("Message must have from and to roles", "INVALID_MESSAGE");
    }
    
    if (!message.experimentId || !message.runId) {
      throw new ExperimentError("Message must have experiment and run IDs", "INVALID_MESSAGE");
    }
    
    if (message.from === message.to) {
      throw new ExperimentError("Message cannot be from and to the same role", "INVALID_MESSAGE");
    }
  }

  /**
   * Apply double-blind filtering to prevent identity leakage
   */
  private applyDoubleBlindFilter(message: AgentMessage): AgentMessage {
    // Create a deep copy to avoid modifying original
    const filtered = JSON.parse(JSON.stringify(message));
    
    // Remove any identifying information based on message type and roles
    if (message.to === "EVALUATOR") {
      // Evaluators should never see variant identities
      if (message.type === "TRIAL_RESULT" && message.payload) {
        // Strip any variant IDs from payload
        if (message.payload.outputs) {
          // Keep slot-based structure but remove variant metadata
          const sanitizedOutputs: Record<string, any> = {};
          for (const [slot, output] of Object.entries(message.payload.outputs)) {
            sanitizedOutputs[slot] = {
              content: output.content || output,
              // Remove any variant identification
            };
          }
          filtered.payload.outputs = sanitizedOutputs;
        }
        
        // Remove slot mapping if present
        if (filtered.payload.slotMapping) {
          delete filtered.payload.slotMapping;
        }
      }
    }
    
    if (message.to === "VARIANT") {
      // Variants should not see other variant information
      if (filtered.payload.otherVariants) {
        delete filtered.payload.otherVariants;
      }
    }
    
    return filtered;
  }

  /**
   * Get buffered messages for a specific role
   */
  private getBufferedMessages(role: AgentRole): AgentMessage[] {
    const messages: AgentMessage[] = [];
    
    for (const [experimentId, experimentMessages] of this.messageBuffer.entries()) {
      for (const message of experimentMessages) {
        if (message.to === role) {
          messages.push(message);
        }
      }
    }
    
    return messages;
  }

  /**
   * Clear message history for privacy/compliance
   */
  clearHistory(experimentId?: string): void {
    if (experimentId) {
      this.messageHistory = this.messageHistory.filter(
        msg => msg.experimentId !== experimentId
      );
      this.messageBuffer.delete(experimentId);
    } else {
      this.messageHistory = [];
      this.messageBuffer.clear();
    }
  }

  /**
   * Get statistics about message flow
   */
  getStats(): {
    totalMessages: number;
    messagesByRole: Record<AgentRole, number>;
    messagesByExperiment: Record<string, number>;
    activeHandlers: number;
  } {
    const stats = {
      totalMessages: this.messageHistory.length,
      messagesByRole: {} as Record<AgentRole, number>,
      messagesByExperiment: {} as Record<string, number>,
      activeHandlers: this.handlers.size,
    };

    // Count by role
    for (const role of ["CONDUCTOR", "VARIANT", "EVALUATOR", "OVERSEER"] as AgentRole[]) {
      stats.messagesByRole[role] = this.messageHistory.filter(
        msg => msg.from === role || msg.to === role
      ).length;
    }

    // Count by experiment
    for (const message of this.messageHistory) {
      stats.messagesByExperiment[message.experimentId] = 
        (stats.messagesByExperiment[message.experimentId] || 0) + 1;
    }

    return stats;
  }
}

/**
 * Message Builder Utility
 * Helps construct properly formatted agent messages
 */
export class MessageBuilder {
  private message: Partial<AgentMessage> = {};

  constructor(private from: AgentRole) {
    this.message.id = uuidv4();
    this.message.from = from;
    this.message.createdAt = new Date().toISOString();
  }

  to(role: AgentRole): MessageBuilder {
    this.message.to = role;
    return this;
  }

  type(messageType: string): MessageBuilder {
    this.message.type = messageType;
    return this;
  }

  payload<T>(payload: T): MessageBuilder {
    this.message.payload = payload;
    return this;
  }

  experiment(experimentId: string): MessageBuilder {
    this.message.experimentId = experimentId;
    return this;
  }

  run(runId: string): MessageBuilder {
    this.message.runId = runId;
    return this;
  }

  trial(trialId: string): MessageBuilder {
    this.message.trialId = trialId;
    return this;
  }

  build<T>(): AgentMessage<T> {
    if (!this.message.to || !this.message.type || !this.message.experimentId || !this.message.runId) {
      throw new Error("Message missing required fields");
    }

    return this.message as AgentMessage<T>;
  }
}

/**
 * Common Message Types
 */
export const MessageTypes = {
  // Conductor messages
  EXPERIMENT_START: "EXPERIMENT_START",
  EXPERIMENT_END: "EXPERIMENT_END",
  RUN_START: "RUN_START",
  RUN_END: "RUN_END",
  
  // Trial messages
  TRIAL_REQUEST: "TRIAL_REQUEST",
  TRIAL_RESULT: "TRIAL_RESULT",
  TRIAL_FAILED: "TRIAL_FAILED",
  
  // Evaluation messages
  EVALUATION_REQUEST: "EVALUATION_REQUEST",
  EVALUATION_RESULT: "EVALUATION_RESULT",
  EVALUATION_FAILED: "EVALUATION_FAILED",
  
  // Overseer messages
  QUALITY_CHECK: "QUALITY_CHECK",
  DRIFT_ALERT: "DRIFT_ALERT",
  ANOMALY_DETECTED: "ANOMALY_DETECTED",
  
  // System messages
  HEARTBEAT: "HEARTBEAT",
  ERROR: "ERROR",
  WARNING: "WARNING",
} as const;

export type MessageType = typeof MessageTypes[keyof typeof MessageTypes];