/**
 * Verifiable Credentials Service
 * 
 * Wraps Trust Receipts in W3C Verifiable Credentials format for interoperability.
 * Supports:
 * - VC creation from trust receipts
 * - VP (Verifiable Presentation) generation
 * - VC verification
 * - Status list for revocation
 */

import crypto from 'crypto';
import { keysService } from './keys.service';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

// W3C VC Context URLs
const VC_CONTEXT = [
  'https://www.w3.org/2018/credentials/v1',
  'https://w3id.org/security/suites/ed25519-2020/v1',
  'https://yseeku.com/ns/trust/v1'
];

// SONATE Trust Receipt credential type
const TRUST_RECEIPT_TYPE = ['VerifiableCredential', 'TrustReceiptCredential'];

export interface TrustReceiptSubject {
  id: string;
  sessionId: string;
  agentId?: string;
  interaction: {
    promptHash: string;
    responseHash: string;
    timestamp: string;
  };
  trustScore: number;
  ciqMetrics: {
    clarity: number;
    integrity: number;
    quality: number;
  };
  chain: {
    selfHash: string;
    previousHash: string;
    chainHash: string;
    position: number;
  };
  evaluation: {
    passed: boolean;
    principlesEvaluated: string[];
  };
}

export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string | { id: string; name?: string };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: TrustReceiptSubject;
  credentialStatus?: {
    id: string;
    type: string;
    statusListIndex: string;
    statusListCredential: string;
  };
  proof?: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
  };
}

export interface VerifiablePresentation {
  '@context': string[];
  id: string;
  type: string[];
  holder: string;
  verifiableCredential: VerifiableCredential[];
  proof?: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    challenge?: string;
    domain?: string;
    proofValue: string;
  };
}

export interface VCVerificationResult {
  valid: boolean;
  checks: {
    signature: boolean;
    issuer: boolean;
    expiration: boolean;
    revocation: boolean;
  };
  errors: string[];
  credential?: VerifiableCredential;
}

class VerifiableCredentialsService {
  private platformDID: string;
  private statusListCredentials: Map<string, Set<number>> = new Map();

  constructor() {
    this.platformDID = process.env.PLATFORM_DID || 'did:web:yseeku.com';
  }

  /**
   * Create a Verifiable Credential from a Trust Receipt
   */
  async createCredential(
    receipt: any,
    options?: {
      expirationDays?: number;
      includeStatus?: boolean;
    }
  ): Promise<VerifiableCredential> {
    try {
      const credentialId = `urn:uuid:${crypto.randomUUID()}`;
      const issuanceDate = new Date().toISOString();
      
      // Calculate expiration if specified
      let expirationDate: string | undefined;
      if (options?.expirationDays) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + options.expirationDays);
        expirationDate = expDate.toISOString();
      }

      // Hash sensitive content for privacy
      const promptHash = this.hashContent(receipt.interaction?.prompt || '');
      const responseHash = this.hashContent(receipt.interaction?.response || '');

      // Build credential subject
      const credentialSubject: TrustReceiptSubject = {
        id: `${this.platformDID}:receipts:${receipt.self_hash || receipt.id}`,
        sessionId: receipt.session_id || '',
        agentId: receipt.agent_id,
        interaction: {
          promptHash,
          responseHash,
          timestamp: receipt.timestamp ? new Date(receipt.timestamp).toISOString() : issuanceDate,
        },
        trustScore: receipt.trust_score || this.calculateTrustScore(receipt.ciq_metrics),
        ciqMetrics: {
          clarity: receipt.ciq_metrics?.clarity || 0,
          integrity: receipt.ciq_metrics?.integrity || 0,
          quality: receipt.ciq_metrics?.quality || 0,
        },
        chain: {
          selfHash: receipt.self_hash || '',
          previousHash: receipt.chain?.previous_hash || receipt.previous_hash || '',
          chainHash: receipt.chain?.chain_hash || '',
          position: receipt.chain?.chain_length || 1,
        },
        evaluation: {
          passed: receipt.trust_protocol === 'PASS' || receipt.trust_score >= 70,
          principlesEvaluated: ['CONSENT', 'INSPECTION', 'VALIDATION', 'OVERRIDE', 'DISCONNECT', 'MORAL'],
        },
      };

      // Build unsigned credential
      const credential: VerifiableCredential = {
        '@context': VC_CONTEXT,
        id: credentialId,
        type: TRUST_RECEIPT_TYPE,
        issuer: {
          id: this.platformDID,
          name: 'SONATE Trust Platform',
        },
        issuanceDate,
        credentialSubject,
      };

      if (expirationDate) {
        credential.expirationDate = expirationDate;
      }

      // Add credential status if requested
      if (options?.includeStatus) {
        const statusListIndex = this.getNextStatusIndex();
        credential.credentialStatus = {
          id: `${this.platformDID}/credentials/status/1#${statusListIndex}`,
          type: 'StatusList2021Entry',
          statusListIndex: String(statusListIndex),
          statusListCredential: `${this.platformDID}/credentials/status/1`,
        };
      }

      // Sign the credential
      const signedCredential = await this.signCredential(credential);

      logger.info('Verifiable Credential created', { 
        credentialId, 
        receiptHash: receipt.self_hash 
      });

      return signedCredential;
    } catch (error) {
      logger.error('Failed to create Verifiable Credential', { error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Create a Verifiable Presentation containing multiple credentials
   */
  async createPresentation(
    credentials: VerifiableCredential[],
    holder: string,
    options?: {
      challenge?: string;
      domain?: string;
    }
  ): Promise<VerifiablePresentation> {
    try {
      const presentationId = `urn:uuid:${crypto.randomUUID()}`;

      const presentation: VerifiablePresentation = {
        '@context': VC_CONTEXT,
        id: presentationId,
        type: ['VerifiablePresentation'],
        holder,
        verifiableCredential: credentials,
      };

      // Sign the presentation
      const signedPresentation = await this.signPresentation(presentation, options);

      logger.info('Verifiable Presentation created', { 
        presentationId, 
        credentialCount: credentials.length 
      });

      return signedPresentation;
    } catch (error) {
      logger.error('Failed to create Verifiable Presentation', { error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Verify a Verifiable Credential
   */
  async verifyCredential(credential: VerifiableCredential): Promise<VCVerificationResult> {
    const errors: string[] = [];
    const checks = {
      signature: false,
      issuer: false,
      expiration: false,
      revocation: false,
    };

    try {
      // Check issuer
      const issuerId = typeof credential.issuer === 'string' 
        ? credential.issuer 
        : credential.issuer.id;
      
      if (issuerId === this.platformDID || issuerId.startsWith('did:web:yseeku')) {
        checks.issuer = true;
      } else {
        errors.push(`Unknown issuer: ${issuerId}`);
      }

      // Check expiration
      if (credential.expirationDate) {
        const expDate = new Date(credential.expirationDate);
        if (expDate > new Date()) {
          checks.expiration = true;
        } else {
          errors.push('Credential has expired');
        }
      } else {
        checks.expiration = true; // No expiration set
      }

      // Verify signature
      if (credential.proof) {
        const isValid = await this.verifyProof(credential);
        checks.signature = isValid;
        if (!isValid) {
          errors.push('Signature verification failed');
        }
      } else {
        errors.push('No proof present');
      }

      // Check revocation status
      if (credential.credentialStatus) {
        const isRevoked = this.checkRevocationStatus(credential.credentialStatus);
        checks.revocation = !isRevoked;
        if (isRevoked) {
          errors.push('Credential has been revoked');
        }
      } else {
        checks.revocation = true; // No status means not revoked
      }

      const valid = checks.signature && checks.issuer && checks.expiration && checks.revocation;

      return {
        valid,
        checks,
        errors,
        credential: valid ? credential : undefined,
      };
    } catch (error) {
      logger.error('Credential verification failed', { error: getErrorMessage(error) });
      return {
        valid: false,
        checks,
        errors: [...errors, getErrorMessage(error)],
      };
    }
  }

  /**
   * Revoke a credential by its status index
   */
  revokeCredential(statusListId: string, index: number): void {
    if (!this.statusListCredentials.has(statusListId)) {
      this.statusListCredentials.set(statusListId, new Set());
    }
    this.statusListCredentials.get(statusListId)!.add(index);
    logger.info('Credential revoked', { statusListId, index });
  }

  /**
   * Export credential as JWT for compact representation
   */
  async exportAsJWT(credential: VerifiableCredential): Promise<string> {
    const header = {
      alg: 'EdDSA',
      typ: 'JWT',
    };

    const payload = {
      iss: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
      sub: credential.credentialSubject.id,
      vc: credential,
      iat: Math.floor(new Date(credential.issuanceDate).getTime() / 1000),
      exp: credential.expirationDate 
        ? Math.floor(new Date(credential.expirationDate).getTime() / 1000) 
        : undefined,
    };

    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const message = `${headerB64}.${payloadB64}`;
    
    const signature = await keysService.sign(message);
    const signatureB64 = Buffer.from(signature, 'hex').toString('base64url');

    return `${message}.${signatureB64}`;
  }

  /**
   * Import credential from JWT
   */
  async importFromJWT(jwt: string): Promise<VerifiableCredential> {
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return payload.vc as VerifiableCredential;
  }

  // Private helper methods

  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private calculateTrustScore(ciqMetrics: any): number {
    if (!ciqMetrics) return 0;
    const avg = (ciqMetrics.clarity + ciqMetrics.integrity + ciqMetrics.quality) / 3;
    return Math.round(avg * 100);
  }

  private getNextStatusIndex(): number {
    // Simple incrementing index - in production, use persistent storage
    return Math.floor(Math.random() * 1000000);
  }

  private async signCredential(credential: VerifiableCredential): Promise<VerifiableCredential> {
    const created = new Date().toISOString();
    
    // Create canonical form for signing (exclude proof)
    const { proof: _, ...credentialWithoutProof } = credential;
    const canonical = JSON.stringify(credentialWithoutProof, Object.keys(credentialWithoutProof).sort());
    
    const signature = await keysService.sign(canonical);
    const publicKeyHex = await keysService.getPublicKeyHex();

    return {
      ...credential,
      proof: {
        type: 'Ed25519Signature2020',
        created,
        verificationMethod: `${this.platformDID}#key-1`,
        proofPurpose: 'assertionMethod',
        proofValue: signature,
      },
    };
  }

  private async signPresentation(
    presentation: VerifiablePresentation,
    options?: { challenge?: string; domain?: string }
  ): Promise<VerifiablePresentation> {
    const created = new Date().toISOString();
    
    const { proof: _, ...presentationWithoutProof } = presentation;
    const canonical = JSON.stringify(presentationWithoutProof, Object.keys(presentationWithoutProof).sort());
    
    const signature = await keysService.sign(canonical);

    return {
      ...presentation,
      proof: {
        type: 'Ed25519Signature2020',
        created,
        verificationMethod: `${this.platformDID}#key-1`,
        proofPurpose: 'authentication',
        challenge: options?.challenge,
        domain: options?.domain,
        proofValue: signature,
      },
    };
  }

  private async verifyProof(credential: VerifiableCredential): Promise<boolean> {
    if (!credential.proof) return false;

    try {
      const { proof, ...credentialWithoutProof } = credential;
      const canonical = JSON.stringify(credentialWithoutProof, Object.keys(credentialWithoutProof).sort());
      
      return await keysService.verify(canonical, proof.proofValue);
    } catch (error) {
      logger.error('Proof verification error', { error: getErrorMessage(error) });
      return false;
    }
  }

  private checkRevocationStatus(status: any): boolean {
    const statusList = this.statusListCredentials.get(status.statusListCredential);
    if (!statusList) return false;
    return statusList.has(parseInt(status.statusListIndex));
  }
}

export const verifiableCredentialsService = new VerifiableCredentialsService();
