/**
 * IPFS Service — Pinata Integration
 *
 * Pins SONATE Audit Bundles to IPFS via Pinata's REST API.
 * No SDK dependency — uses the native fetch API available in Node 18+.
 *
 * An Audit Bundle contains:
 *  - Conversation metadata
 *  - All cryptographically-signed trust receipts for the session
 *  - Platform DID + public key (for independent verification)
 *
 * This creates a permanent, content-addressed, tamper-evident record
 * that anyone can verify without access to the YSEEKU platform.
 *
 * Setup:
 *  1. Create a free Pinata account at https://pinata.cloud
 *  2. Generate an API key (Admin or pinning scope is sufficient)
 *  3. Set PINATA_JWT in your .env
 */

import { Conversation } from '../models/conversation.model';
import { TrustReceiptModel } from '../models/trust-receipt.model';
import { keysService } from './keys.service';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const PINATA_API = 'https://api.pinata.cloud';
const DEFAULT_GATEWAY = 'https://ipfs.io/ipfs';

export interface AuditBundle {
  version: '1.0';
  format: 'sonate-audit-bundle';
  pinnedAt: string;
  conversation: {
    id: string;
    title: string;
    createdAt: string;
    lastActivity: string;
    messageCount: number;
    agentIds: string[];
  };
  trustSummary: {
    receiptCount: number;
    avgCiqScore: number;
    passCount: number;
    partialCount: number;
    failCount: number;
  };
  receipts: any[];
  platform: {
    did: string;
    publicKey: string;
    verificationInstructions: string;
  };
}

export interface PinResult {
  cid: string;              // IPFS Content Identifier (e.g. "bafyb...")
  gatewayUrl: string;       // Public IPFS gateway URL
  pinataUrl: string;        // Pinata-hosted gateway URL
  bundleName: string;
  pinnedAt: string;
  sizeBytes: number;
}

export class IpfsService {
  private get jwt(): string {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) {
      throw new Error(
        'PINATA_JWT environment variable is not set. ' +
        'Create a free Pinata account at https://pinata.cloud and add your JWT to .env'
      );
    }
    return jwt;
  }

  private get gateway(): string {
    return (process.env.PINATA_GATEWAY ?? DEFAULT_GATEWAY).replace(/\/$/, '');
  }

  /**
   * Build and pin a complete SONATE Audit Bundle for a conversation.
   * Fetches the conversation + trust receipts, assembles the bundle,
   * and pins it to IPFS via Pinata.
   */
  async pinConversation(conversationId: string, tenantId: string): Promise<PinResult> {
    // Fetch conversation
    const conversation = await Conversation.findById(conversationId)
      .populate('agents', 'name _id')
      .lean();

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Fetch trust receipts for this session
    const receipts = await TrustReceiptModel.find({
      $or: [
        { session_id: { $regex: conversationId, $options: 'i' } },
        { tenant_id: tenantId, session_id: { $exists: true } },
      ],
    })
      .sort({ timestamp: 1 })
      .lean()
      .catch(() => []);

    // Get platform public key for independent verification
    let publicKey = '';
    try {
      const keyInfo = await keysService.getPublicKey();
      publicKey = keyInfo.publicKey ?? keyInfo ?? '';
    } catch {
      publicKey = 'unavailable';
    }

    const platformDid = `did:web:${process.env.PLATFORM_DOMAIN ?? 'yseeku.com'}`;

    // Calculate trust summary from receipts
    const trustSummary = this.buildTrustSummary(receipts);

    // Assemble the audit bundle
    const bundle: AuditBundle = {
      version: '1.0',
      format: 'sonate-audit-bundle',
      pinnedAt: new Date().toISOString(),
      conversation: {
        id: conversationId,
        title: (conversation as any).title ?? 'Untitled',
        createdAt: (conversation as any).createdAt?.toISOString() ?? '',
        lastActivity: (conversation as any).lastActivity?.toISOString() ?? '',
        messageCount: (conversation as any).messages?.length ?? 0,
        agentIds: ((conversation as any).agents ?? []).map((a: any) =>
          a._id?.toString() ?? a.toString()
        ),
      },
      trustSummary,
      receipts,
      platform: {
        did: platformDid,
        publicKey,
        verificationInstructions:
          'Each receipt in this bundle can be independently verified using the SONATE ' +
          'Verify SDK: https://www.npmjs.com/package/@sonate/verify-sdk. ' +
          'Use the publicKey above to verify the Ed25519 signature on each receipt.',
      },
    };

    const bundleName = `sonate-audit-${conversationId}-${Date.now()}`;
    const result = await this.pinJSON(bundle, bundleName);

    // Store CID back on the conversation
    await Conversation.updateOne(
      { _id: conversationId },
      {
        $set: {
          ipfsCid: result.cid,
          ipfsPinnedAt: new Date(),
        },
      }
    );

    logger.info('Conversation pinned to IPFS', {
      conversationId,
      cid: result.cid,
      gatewayUrl: result.gatewayUrl,
      receiptCount: receipts.length,
    });

    return result;
  }

  /**
   * Pin a JSON object to IPFS via Pinata.
   * Returns the CID and gateway URL.
   */
  async pinJSON(data: object, name: string): Promise<PinResult> {
    const payload = {
      pinataContent: data,
      pinataMetadata: {
        name,
        keyvalues: {
          platform: 'yseeku-sonate',
          format: 'audit-bundle',
          pinnedAt: new Date().toISOString(),
        },
      },
      pinataOptions: {
        cidVersion: 1,  // CIDv1 produces the shorter "bafy..." format
      },
    };

    const response = await fetch(`${PINATA_API}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.jwt}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Pinata API error ${response.status}: ${errorText}`);
    }

    const pinataResult = await response.json() as {
      IpfsHash: string;
      PinSize: number;
      Timestamp: string;
    };

    const cid = pinataResult.IpfsHash;

    return {
      cid,
      gatewayUrl: `${this.gateway}/${cid}`,
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
      bundleName: name,
      pinnedAt: pinataResult.Timestamp,
      sizeBytes: pinataResult.PinSize,
    };
  }

  /**
   * Unpin a CID from Pinata (GDPR right to erasure support).
   * Note: unpinning removes it from Pinata's nodes but not from
   * the broader IPFS network if other nodes have pinned it.
   */
  async unpin(cid: string): Promise<void> {
    const response = await fetch(`${PINATA_API}/pinning/unpin/${cid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.jwt}` },
    });

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Pinata unpin error ${response.status}: ${errorText}`);
    }

    logger.info('CID unpinned from Pinata', { cid });
  }

  /**
   * Check if Pinata is configured and reachable.
   */
  async isConfigured(): Promise<boolean> {
    try {
      if (!process.env.PINATA_JWT) return false;
      const response = await fetch(`${PINATA_API}/data/testAuthentication`, {
        headers: { Authorization: `Bearer ${this.jwt}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private buildTrustSummary(receipts: any[]): AuditBundle['trustSummary'] {
    if (receipts.length === 0) {
      return { receiptCount: 0, avgCiqScore: 0, passCount: 0, partialCount: 0, failCount: 0 };
    }

    const ciqScores = receipts
      .map(r => {
        const m = r.ciq_metrics;
        if (!m) return null;
        return (m.clarity + m.integrity + m.quality) / 3;
      })
      .filter((s): s is number => s !== null);

    const avgCiqScore =
      ciqScores.length > 0
        ? Math.round((ciqScores.reduce((a, b) => a + b, 0) / ciqScores.length) * 100) / 100
        : 0;

    const passCount = receipts.filter(r => r.mode === 'constitutional' || r.mode === 'pass').length;
    const failCount = receipts.filter(r => r.mode === 'fail' || r.mode === 'blocked').length;
    const partialCount = receipts.length - passCount - failCount;

    return {
      receiptCount: receipts.length,
      avgCiqScore,
      passCount,
      partialCount: Math.max(partialCount, 0),
      failCount,
    };
  }
}

export const ipfsService = new IpfsService();
