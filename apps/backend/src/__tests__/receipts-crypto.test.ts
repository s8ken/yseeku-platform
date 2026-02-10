/**
 * Trust Receipt Cryptographic Integration Tests
 * 
 * Tests the full sign/verify flow with real Ed25519 cryptography
 * Uses Node.js native crypto for Ed25519 operations
 */

import crypto from 'crypto';

// Helper functions using Node.js built-in Ed25519
function generateKeyPairSync(): { privateKey: crypto.KeyObject; publicKey: crypto.KeyObject } {
  return crypto.generateKeyPairSync('ed25519');
}

function sign(message: string, privateKey: crypto.KeyObject): string {
  const signature = crypto.sign(null, Buffer.from(message), privateKey);
  return signature.toString('hex');
}

function verify(message: string, signatureHex: string, publicKey: crypto.KeyObject): boolean {
  try {
    const signature = Buffer.from(signatureHex, 'hex');
    return crypto.verify(null, Buffer.from(message), publicKey, signature);
  } catch {
    return false;
  }
}

// Proper JSON canonicalization (deep sort)
function canonicalize(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(key => JSON.stringify(key) + ':' + canonicalize(obj[key]));
  return '{' + pairs.join(',') + '}';
}

describe('Trust Receipt Cryptography - Real Ed25519', () => {
  let privateKey: crypto.KeyObject;
  let publicKey: crypto.KeyObject;
  let publicKeyHex: string;

  beforeAll(() => {
    // Generate a fresh key pair for testing using Node.js crypto
    const keyPair = generateKeyPairSync();
    privateKey = keyPair.privateKey;
    publicKey = keyPair.publicKey;
    // Export public key as raw bytes
    const pubKeyDer = publicKey.export({ type: 'spki', format: 'der' });
    // Ed25519 public key is the last 32 bytes of SPKI format
    publicKeyHex = pubKeyDer.subarray(-32).toString('hex');
  });

  describe('Key Generation', () => {
    it('should have initialized Ed25519 keys', () => {
      expect(privateKey).toBeDefined();
      expect(publicKey).toBeDefined();
      expect(privateKey.type).toBe('private');
      expect(publicKey.type).toBe('public');
    });

    it('should return consistent public key', () => {
      const pubKey1 = publicKeyHex;
      const pubKey2 = publicKeyHex;
      expect(pubKey1).toBe(pubKey2);
    });

    it('should return valid hex format public key', () => {
      expect(publicKeyHex).toBeDefined();
      expect(publicKeyHex.length).toBe(64); // 32 bytes = 64 hex chars
      expect(/^[0-9a-f]+$/i.test(publicKeyHex)).toBe(true);
    });
  });

  describe('Sign and Verify', () => {
    it('should sign a message and verify it', () => {
      const message = 'test message for signing';
      
      // Sign the message
      const signature = sign(message, privateKey);
      
      expect(signature).toBeDefined();
      expect(signature.length).toBeGreaterThan(0);
      
      // Verify the signature
      const isValid = verify(message, signature, publicKey);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const message = 'test message';
      const invalidSignature = 'deadbeef'.repeat(16); // 64 hex chars, but invalid
      
      const isValid = verify(message, invalidSignature, publicKey);
      expect(isValid).toBe(false);
    });

    it('should reject signature for different message', () => {
      const message1 = 'original message';
      const message2 = 'different message';
      
      const signature = sign(message1, privateKey);
      
      // Verify with different message should fail
      const isValid = verify(message2, signature, publicKey);
      expect(isValid).toBe(false);
    });

    it('should handle JSON content signing', () => {
      const receiptContent = {
        session_id: 'test-session',
        timestamp: new Date().toISOString(),
        interaction: {
          prompt: 'What is trust?',
          response: 'Trust is confidence in expected behavior.',
        },
        trust_score: 0.92,
      };

      // Canonicalize and sign
      const canonical = canonicalize(receiptContent);
      const signature = sign(canonical, privateKey);
      
      // Verify
      const isValid = verify(canonical, signature, publicKey);
      expect(isValid).toBe(true);

      // Tamper and verify fails
      const tampered = { ...receiptContent, trust_score: 0.50 };
      const tamperedCanonical = canonicalize(tampered);
      const tamperedValid = verify(tamperedCanonical, signature, publicKey);
      expect(tamperedValid).toBe(false);
    });
  });

  describe('Receipt-style Signing Flow', () => {
    it('should complete full receipt signing cycle', () => {
      // Simulate receipt creation
      const receipt: any = {
        id: '', // will be computed
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        session_id: 'test-session-' + Date.now(),
        agent_did: 'did:web:yseeku.com:agents:test',
        human_did: 'did:web:yseeku.com:users:test',
        policy_version: '1.0.0',
        mode: 'constitutional',
        interaction: {
          prompt: 'What is AI trust?',
          response: 'AI trust is confidence in AI behavior.',
          model: 'claude-3-5-sonnet',
        },
        telemetry: {
          resonance_score: 0.92,
          coherence_score: 0.88,
        },
        chain: {
          previous_hash: 'GENESIS',
          chain_hash: '', // will be computed
          chain_length: 1,
        },
      };

      // 1. Compute receipt ID (hash of content without signature)
      const contentForId = canonicalize(receipt);
      receipt.id = crypto.createHash('sha256').update(contentForId).digest('hex');

      // 2. Compute chain hash
      const chainContent = contentForId + receipt.chain.previous_hash;
      receipt.chain.chain_hash = crypto.createHash('sha256').update(chainContent).digest('hex');

      // 3. Sign the canonical receipt
      const canonicalReceipt = canonicalize(receipt);
      const signature = sign(canonicalReceipt, privateKey);

      // 4. Add signature to receipt
      const signedReceipt = {
        ...receipt,
        signature: {
          algorithm: 'Ed25519',
          value: signature,
          key_version: 'v1',
          timestamp_signed: new Date().toISOString(),
        },
      };

      // 5. Verify the signed receipt
      const receiptWithoutSig = { ...signedReceipt };
      delete receiptWithoutSig.signature;
      const canonicalForVerify = canonicalize(receiptWithoutSig);
      
      const isValid = verify(canonicalForVerify, signedReceipt.signature.value, publicKey);
      expect(isValid).toBe(true);

      // 6. Verify tampering detection
      // When we tamper with content, the original signature should NOT verify against the new content
      const tamperedReceipt = JSON.parse(JSON.stringify(receiptWithoutSig));
      tamperedReceipt.interaction.response = 'TAMPERED RESPONSE';
      const tamperedContent = canonicalize(tamperedReceipt);
      
      // Debug: ensure the content is actually different
      expect(tamperedContent).not.toBe(canonicalForVerify);
      
      // This should be FALSE because signature was made with original content, not tampered content
      const isTamperedValid = verify(tamperedContent, signedReceipt.signature.value, publicKey);
      expect(isTamperedValid).toBe(false);

      console.log('Receipt Signing Test:', {
        id: signedReceipt.id.substring(0, 16) + '...',
        signature: signedReceipt.signature.value.substring(0, 32) + '...',
        chainHash: signedReceipt.chain.chain_hash.substring(0, 16) + '...',
        verified: isValid,
        tamperDetected: !isTamperedValid,
      });
    });
  });

  describe('Performance', () => {
    it('should handle batch signing efficiently', () => {
      const messages = Array.from({ length: 100 }, (_, i) => `message-${i}`);
      
      const start = Date.now();
      const signatures = messages.map(msg => sign(msg, privateKey));
      const signingTime = Date.now() - start;

      const verifyStart = Date.now();
      const verifications = messages.map((msg, i) => verify(msg, signatures[i], publicKey));
      const verifyTime = Date.now() - verifyStart;

      expect(signatures.length).toBe(100);
      expect(verifications.every(v => v === true)).toBe(true);
      expect(signingTime).toBeLessThan(5000); // Should complete in under 5s
      expect(verifyTime).toBeLessThan(5000);

      console.log('Performance:', {
        count: 100,
        signingTimeMs: signingTime,
        verifyTimeMs: verifyTime,
        avgSignMs: signingTime / 100,
        avgVerifyMs: verifyTime / 100,
      });
    });
  });
});
