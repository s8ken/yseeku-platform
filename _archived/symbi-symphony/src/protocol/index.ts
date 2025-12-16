/**
 * Symbi Protocol - Core Trust Framework Implementation
 * 
 * This module provides the foundational "physics engine" for the Symbi ecosystem,
 * implementing the exact 6-pillar weighted scoring system and cryptographic
 * primitives specified in the master context.
 */

// Import core classes for default export
import { TrustProtocol, TRUST_PRINCIPLES } from './trust-protocol';
import { HashChain } from './hash-chain';
import { Ed25519Manager, CryptoUtils } from './crypto';
import { ConversationalMetrics } from './conversational-metrics';

// Core Trust Protocol (6-pillar weighted scoring)
export {
  TrustProtocol,
  TRUST_PRINCIPLES,
  type TrustPrinciple,
  type TrustInteraction,
  type PrincipleScore,
  type TrustScore
} from './trust-protocol';

// Hash Chain Implementation (SHA-256)
export {
  HashChain,
  type HashChainLink,
  type HashChainConfig
} from './hash-chain';

// Cryptographic Utilities (Ed25519)
export {
  Ed25519Manager,
  CryptoUtils,
  type KeyPair,
  type SignatureResult,
  type VerificationResult
} from './crypto';

// Conversational Metrics (Phase-Shift Velocity)
export {
  ConversationalMetrics,
  type ConversationTurn,
  type PhaseShiftMetrics,
  type TransitionEvent,
  type ConversationalMetricsConfig
} from './conversational-metrics';

// Protocol Constants
export const PROTOCOL_CONSTANTS = {
  VERSION: '1.0.0',
  ALGORITHM_ED25519: 'ed25519',
  ALGORITHM_SHA256: 'sha256',
  ENCODING_HEX: 'hex' as BufferEncoding,
  MINIMUM_TRUST_SCORE: 7.0,
  CRITICAL_PRINCIPLE_THRESHOLD: 0,
  REASONING_TRANSPARENCY_THRESHOLD: 5
} as const;

// Protocol Errors
export class ProtocolError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ProtocolError';
  }
}

export class TrustViolationError extends ProtocolError {
  constructor(message: string, public violations: string[]) {
    super(message, 'TRUST_VIOLATION');
    this.name = 'TrustViolationError';
  }
}

export class CryptographicError extends ProtocolError {
  constructor(message: string) {
    super(message, 'CRYPTOGRAPHIC_ERROR');
    this.name = 'CryptographicError';
  }
}

export class HashChainError extends ProtocolError {
  constructor(message: string) {
    super(message, 'HASH_CHAIN_ERROR');
    this.name = 'HashChainError';
  }
}

// Utility Functions
export const ProtocolUtils = {
  /**
   * Validate protocol version compatibility
   */
  validateVersion(version: string): boolean {
    const [major, minor, patch] = version.split('.').map(Number);
    const [currentMajor, currentMinor, currentPatch] = PROTOCOL_CONSTANTS.VERSION.split('.').map(Number);
    
    // Major version must match exactly
    if (major !== currentMajor) {
      return false;
    }
    
    // Minor version must be <= current
    if (minor > currentMinor) {
      return false;
    }
    
    return true;
  },

  /**
   * Format timestamp for protocol use
   */
  formatTimestamp(timestamp: number = Date.now()): string {
    return new Date(timestamp).toISOString();
  },

  /**
   * Parse protocol timestamp
   */
  parseTimestamp(timestamp: string): number {
    return new Date(timestamp).getTime();
  },

  /**
   * Calculate protocol age in milliseconds
   */
  calculateAge(createdAt: number): number {
    return Date.now() - createdAt;
  },

  /**
   * Validate principle weights sum to 1.0
   */
  validatePrincipleWeights(weights: number[]): boolean {
    const sum = weights.reduce((acc, weight) => acc + weight, 0);
    return Math.abs(sum - 1.0) < 0.001; // Allow for floating point precision
  },

  /**
   * Generate a unique protocol identifier
   */
  generateProtocolId(prefix: string = 'symbi'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}-${timestamp}-${random}`;
  }
};

// Default Export for convenience
const SymbiProtocol = {
  TrustProtocol: TrustProtocol,
  HashChain: HashChain,
  Ed25519Manager: Ed25519Manager,
  CryptoUtils: CryptoUtils,
  ConversationalMetrics: ConversationalMetrics,
  ProtocolUtils: ProtocolUtils,
  PROTOCOL_CONSTANTS: PROTOCOL_CONSTANTS,
  ProtocolError: ProtocolError,
  TrustViolationError: TrustViolationError,
  CryptographicError: CryptographicError,
  HashChainError: HashChainError
};

export default SymbiProtocol;