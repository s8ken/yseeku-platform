/**
 * Tests for HashChain - SHA-256 hash chain implementation
 * Verifies the formula: Current_Hash = SHA256(Prev_Hash + Current_Payload + Timestamp + Signature)
 */

import { HashChain } from '../hash-chain';

describe('HashChain', () => {
  let chain: HashChain;
  const testPayload = 'test interaction data';
  const testSignature = 'test signature';

  beforeEach(() => {
    chain = new HashChain();
  });

  describe('Genesis Hash', () => {
    it('should generate consistent genesis hash for same identifier', () => {
      const identifier = 'test-session-123';
      const genesis1 = chain.genesisHash(identifier);
      const genesis2 = chain.genesisHash(identifier);
      
      expect(genesis1).toBe(genesis2);
      expect(genesis1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex format
    });

    it('should generate different genesis hashes for different identifiers', () => {
      const genesis1 = chain.genesisHash('session-1');
      const genesis2 = chain.genesisHash('session-2');
      
      expect(genesis1).not.toBe(genesis2);
    });
  });

  describe('Hash Chain Link Creation', () => {
    it('should create a valid hash chain link', () => {
      const genesisHash = chain.genesisHash('test');
      const timestamp = Date.now();
      
      const link = chain.createLink(genesisHash, testPayload, timestamp, testSignature);
      
      expect(link.hash).toMatch(/^[a-f0-9]{64}$/);
      expect(link.previousHash).toBe(genesisHash);
      expect(link.payload).toBe(testPayload);
      expect(link.timestamp).toBe(timestamp);
      expect(link.signature).toBe(testSignature);
    });

    it('should use current timestamp if not provided', () => {
      const genesisHash = chain.genesisHash('test');
      const beforeCreation = Date.now();
      
      const link = chain.createLink(genesisHash, testPayload);
      const afterCreation = Date.now();
      
      expect(link.timestamp).toBeGreaterThanOrEqual(beforeCreation);
      expect(link.timestamp).toBeLessThanOrEqual(afterCreation);
    });

    it('should create link without signature', () => {
      const genesisHash = chain.genesisHash('test');
      const link = chain.createLink(genesisHash, testPayload);
      
      expect(link.signature).toBeUndefined();
      expect(link.hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Hash Formula Verification', () => {
    it('should follow the formula: SHA256(Prev_Hash + Payload + Timestamp + Signature)', () => {
      const genesisHash = chain.genesisHash('test');
      const timestamp = 1234567890;
      const payload = 'test payload';
      const signature = 'test signature';
      
      const link = chain.createLink(genesisHash, payload, timestamp, signature);
      
      // Manual calculation to verify the formula
      const expectedInput = `${genesisHash}:${payload}:${timestamp}:${signature}`;
      const crypto = require('crypto');
      const expectedHash = crypto.createHash('sha256').update(expectedInput).digest('hex');
      
      expect(link.hash).toBe(expectedHash);
    });

    it('should produce different hashes for different inputs', () => {
      const genesisHash = chain.genesisHash('test');
      
      const link1 = chain.createLink(genesisHash, 'payload1', 1000, 'sig1');
      const link2 = chain.createLink(genesisHash, 'payload2', 1000, 'sig1');
      const link3 = chain.createLink(genesisHash, 'payload1', 2000, 'sig1');
      const link4 = chain.createLink(genesisHash, 'payload1', 1000, 'sig2');
      
      expect(link1.hash).not.toBe(link2.hash);
      expect(link1.hash).not.toBe(link3.hash);
      expect(link1.hash).not.toBe(link4.hash);
    });
  });

  describe('Link Verification', () => {
    it('should verify a valid link', () => {
      const genesisHash = chain.genesisHash('test');
      const link = chain.createLink(genesisHash, testPayload, Date.now(), testSignature);
      
      expect(chain.verifyLink(link)).toBe(true);
    });

    it('should detect invalid link', () => {
      const genesisHash = chain.genesisHash('test');
      const link = chain.createLink(genesisHash, testPayload, Date.now(), testSignature);
      
      // Tamper with the link
      const tamperedLink = { ...link, payload: 'tampered payload' };
      
      expect(chain.verifyLink(tamperedLink)).toBe(false);
    });

    it('should detect invalid hash', () => {
      const genesisHash = chain.genesisHash('test');
      const link = chain.createLink(genesisHash, testPayload, Date.now(), testSignature);
      
      // Tamper with the hash
      const tamperedLink = { ...link, hash: 'invalid_hash' };
      
      expect(chain.verifyLink(tamperedLink)).toBe(false);
    });
  });

  describe('Chain Verification', () => {
    it('should verify a complete chain', () => {
      const genesisHash = chain.genesisHash('test-chain');
      
      const link1 = chain.createLink(genesisHash, 'payload1', 1000);
      const link2 = chain.createLink(link1.hash, 'payload2', 2000);
      const link3 = chain.createLink(link2.hash, 'payload3', 3000);
      
      expect(chain.verifyChain(link3, genesisHash)).toBe(true);
      expect(chain.verifyChain(link2, genesisHash)).toBe(true);
      expect(chain.verifyChain(link1, genesisHash)).toBe(true);
    });

    it('should detect broken chain', () => {
      const genesisHash = chain.genesisHash('test-chain');
      
      const link1 = chain.createLink(genesisHash, 'payload1', 1000);
      const link2 = chain.createLink(link1.hash, 'payload2', 2000);
      
      // Tamper with link1 after link2 is created
      const tamperedLink1 = { ...link1, payload: 'tampered' };
      chain['links'].set(tamperedLink1.hash, tamperedLink1);
      
      expect(chain.verifyChain(link2, genesisHash)).toBe(false);
    });

    it('should detect invalid genesis hash', () => {
      const genesisHash = chain.genesisHash('test-chain');
      const wrongGenesis = chain.genesisHash('wrong-chain');
      
      const link = chain.createLink(genesisHash, 'payload', 1000);
      
      expect(chain.verifyChain(link, wrongGenesis)).toBe(false);
    });

    it('should prevent infinite loops in chain verification', () => {
      const genesisHash = chain.genesisHash('test-chain');
      
      const link1 = chain.createLink(genesisHash, 'payload1', 1000);
      
      // Create a circular reference
      const circularLink = {
        ...link1,
        previousHash: link1.hash // Points to itself
      };
      chain['links'].set(circularLink.hash, circularLink);
      
      expect(chain.verifyChain(circularLink, genesisHash)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize links correctly', () => {
      const genesisHash = chain.genesisHash('test');
      const originalLink = chain.createLink(genesisHash, testPayload, 1234567890, testSignature);
      
      const serialized = HashChain.serializeLink(originalLink);
      const deserialized = HashChain.deserializeLink(serialized);
      
      expect(deserialized).toEqual(originalLink);
    });

    it('should create chain from serialized links', () => {
      const genesisHash = chain.genesisHash('test');
      const link1 = chain.createLink(genesisHash, 'payload1', 1000);
      const link2 = chain.createLink(link1.hash, 'payload2', 2000);
      
      const newChain = HashChain.fromLinks([link1, link2]);
      
      expect(newChain.getAllLinks()).toHaveLength(2);
      expect(newChain.verifyLink(link1)).toBe(true);
      expect(newChain.verifyLink(link2)).toBe(true);
    });
  });

  describe('Chain Management', () => {
    it('should get link by hash', () => {
      const genesisHash = chain.genesisHash('test');
      const link = chain.createLink(genesisHash, testPayload, Date.now(), testSignature);
      
      const retrievedLink = chain.getLink(link.hash);
      expect(retrievedLink).toEqual(link);
    });

    it('should return undefined for non-existent link', () => {
      const nonExistentHash = 'non_existent_hash_1234567890123456789012345678901234567890';
      expect(chain.getLink(nonExistentHash)).toBeUndefined();
    });

    it('should get latest link by timestamp', () => {
      const genesisHash = chain.genesisHash('test');
      
      const link1 = chain.createLink(genesisHash, 'payload1', 1000);
      const link2 = chain.createLink(link1.hash, 'payload2', 2000);
      const link3 = chain.createLink(link2.hash, 'payload3', 3000);
      
      const latest = chain.getLatestLink();
      expect(latest).toEqual(link3);
    });

    it('should return undefined for latest link on empty chain', () => {
      expect(chain.getLatestLink()).toBeUndefined();
    });

    it('should clear all links', () => {
      const genesisHash = chain.genesisHash('test');
      chain.createLink(genesisHash, 'payload1', 1000);
      chain.createLink(genesisHash, 'payload2', 2000);
      
      expect(chain.getAllLinks()).toHaveLength(2);
      
      chain.clear();
      expect(chain.getAllLinks()).toHaveLength(0);
      expect(chain.getLatestLink()).toBeUndefined();
    });
  });

  describe('Chain Statistics', () => {
    it('should return correct stats for empty chain', () => {
      const stats = chain.getStats();
      
      expect(stats.totalLinks).toBe(0);
      expect(stats.earliestTimestamp).toBeNull();
      expect(stats.latestTimestamp).toBeNull();
      expect(stats.hasSignature).toBe(false);
    });

    it('should return correct stats for populated chain', () => {
      const genesisHash = chain.genesisHash('test');
      
      const link1 = chain.createLink(genesisHash, 'payload1', 1000, 'sig1');
      const link2 = chain.createLink(link1.hash, 'payload2', 2000);
      chain.createLink(link2.hash, 'payload3', 3000, 'sig3'); // Create but don't assign
      
      const stats = chain.getStats();
      
      expect(stats.totalLinks).toBe(3);
      expect(stats.earliestTimestamp).toBe(1000);
      expect(stats.latestTimestamp).toBe(3000);
      expect(stats.hasSignature).toBe(true); // At least one link has signature
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const defaultChain = new HashChain();
      expect(defaultChain['config'].algorithm).toBe('sha256');
      expect(defaultChain['config'].encoding).toBe('hex');
    });

    it('should accept custom configuration', () => {
      const customChain = new HashChain({
        algorithm: 'sha512',
        encoding: 'base64'
      });
      
      expect(customChain['config'].algorithm).toBe('sha512');
      expect(customChain['config'].encoding).toBe('base64');
    });
  });
});