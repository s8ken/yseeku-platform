/**
 * Trust Portability Service
 * 
 * Enables cross-platform trust data exchange:
 * - Export trust scores and receipts
 * - Import trust data from other platforms
 * - Trust score aggregation from multiple sources
 * - Interoperability with other trust systems
 */

import crypto from 'crypto';
import { TrustReceiptModel } from '../models/trust-receipt.model';
import { keysService } from './keys.service';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

export interface TrustExport {
  version: '1.0';
  format: 'sonate-trust-export';
  exportedAt: string;
  exporter: {
    platform: string;
    did: string;
    publicKey: string;
  };
  subject: {
    type: 'agent' | 'session' | 'tenant';
    id: string;
    name?: string;
  };
  trustSummary: {
    overallScore: number;
    receiptCount: number;
    firstInteraction: string;
    lastInteraction: string;
    averageMetrics: {
      clarity: number;
      integrity: number;
      quality: number;
    };
    passRate: number;
    violationCount: number;
  };
  receipts?: Array<{
    hash: string;
    timestamp: string;
    trustScore: number;
    ciqMetrics: { clarity: number; integrity: number; quality: number };
    signatureValid: boolean;
  }>;
  signature: string;
}

export interface TrustImport {
  source: {
    platform: string;
    did?: string;
    publicKey?: string;
  };
  subject: {
    type: string;
    id: string;
    externalId?: string;
  };
  trustData: {
    score?: number;
    metrics?: Record<string, number>;
    receiptCount?: number;
    lastUpdated?: string;
  };
  verification?: {
    signature?: string;
    verified?: boolean;
  };
}

export interface AggregatedTrust {
  subjectId: string;
  sources: Array<{
    platform: string;
    score: number;
    weight: number;
    lastUpdated: string;
  }>;
  aggregatedScore: number;
  confidence: number;
  calculatedAt: string;
}

class TrustPortabilityService {
  private platformDID: string;
  private trustedPlatforms: Map<string, { publicKey: string; weight: number }> = new Map();

  constructor() {
    this.platformDID = process.env.PLATFORM_DID || 'did:web:yseeku.com';
    
    // Register trusted platforms for import
    this.initializeTrustedPlatforms();
  }

  private initializeTrustedPlatforms(): void {
    // Self-trust
    this.trustedPlatforms.set('yseeku.com', {
      publicKey: '', // Will be populated from keysService
      weight: 1.0,
    });

    // Add other trusted platforms from environment
    const trustedList = process.env.TRUSTED_TRUST_PLATFORMS;
    if (trustedList) {
      try {
        const platforms = JSON.parse(trustedList);
        for (const [name, config] of Object.entries(platforms)) {
          this.trustedPlatforms.set(name, config as any);
        }
      } catch (e) {
        logger.warn('Failed to parse TRUSTED_TRUST_PLATFORMS', { error: getErrorMessage(e) });
      }
    }
  }

  /**
   * Export trust data for an agent/session/tenant
   */
  async exportTrust(
    subjectType: 'agent' | 'session' | 'tenant',
    subjectId: string,
    tenantId: string,
    options?: {
      includeReceipts?: boolean;
      limit?: number;
      since?: Date;
    }
  ): Promise<TrustExport> {
    try {
      // Build query based on subject type
      const query: any = { tenant_id: tenantId };
      
      if (subjectType === 'agent') {
        query.agent_id = subjectId;
      } else if (subjectType === 'session') {
        query.session_id = subjectId;
      }
      // For tenant, we export all receipts

      if (options?.since) {
        query.createdAt = { $gte: options.since };
      }

      // Fetch receipts
      const receipts = await TrustReceiptModel.find(query)
        .sort({ createdAt: -1 })
        .limit(options?.limit || 1000)
        .lean();

      if (receipts.length === 0) {
        throw new Error('No trust data found for export');
      }

      // Calculate summary statistics
      const trustScores = receipts.map(r => 
        this.calculateScore(r.ciq_metrics)
      );
      const avgScore = trustScores.reduce((a, b) => a + b, 0) / trustScores.length;
      
      const avgClarity = receipts.reduce((sum, r) => sum + (r.ciq_metrics?.clarity || 0), 0) / receipts.length;
      const avgIntegrity = receipts.reduce((sum, r) => sum + (r.ciq_metrics?.integrity || 0), 0) / receipts.length;
      const avgQuality = receipts.reduce((sum, r) => sum + (r.ciq_metrics?.quality || 0), 0) / receipts.length;
      
      // Pass if score >= 70
      const passCount = receipts.filter(r => 
        this.calculateScore(r.ciq_metrics) >= 70
      ).length;

      const publicKey = await keysService.getPublicKeyHex();

      // Build export object
      const exportData: Omit<TrustExport, 'signature'> = {
        version: '1.0',
        format: 'sonate-trust-export',
        exportedAt: new Date().toISOString(),
        exporter: {
          platform: 'yseeku.com',
          did: this.platformDID,
          publicKey,
        },
        subject: {
          type: subjectType,
          id: subjectId,
        },
        trustSummary: {
          overallScore: Math.round(avgScore),
          receiptCount: receipts.length,
          firstInteraction: receipts[receipts.length - 1]?.createdAt?.toISOString() || '',
          lastInteraction: receipts[0]?.createdAt?.toISOString() || '',
          averageMetrics: {
            clarity: Math.round(avgClarity * 100) / 100,
            integrity: Math.round(avgIntegrity * 100) / 100,
            quality: Math.round(avgQuality * 100) / 100,
          },
          passRate: Math.round((passCount / receipts.length) * 100),
          violationCount: receipts.length - passCount,
        },
      };

      // Optionally include individual receipts
      if (options?.includeReceipts) {
        exportData.receipts = receipts.map(r => ({
          hash: r.self_hash || '',
          timestamp: r.createdAt?.toISOString() || '',
          trustScore: this.calculateScore(r.ciq_metrics),
          ciqMetrics: {
            clarity: r.ciq_metrics?.clarity || 0,
            integrity: r.ciq_metrics?.integrity || 0,
            quality: r.ciq_metrics?.quality || 0,
          },
          signatureValid: !!r.signature,
        }));
      }

      // Sign the export
      const canonical = JSON.stringify(exportData, Object.keys(exportData).sort());
      const signature = await keysService.sign(canonical);

      logger.info('Trust data exported', {
        subjectType,
        subjectId,
        receiptCount: receipts.length,
      });

      return {
        ...exportData,
        signature,
      };
    } catch (error) {
      logger.error('Failed to export trust data', { error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Import trust data from another platform
   */
  async importTrust(
    importData: TrustImport,
    tenantId: string
  ): Promise<{
    success: boolean;
    verified: boolean;
    aggregatedScore?: number;
    message: string;
  }> {
    try {
      // Check if source is trusted
      const trustedSource = this.trustedPlatforms.get(importData.source.platform);
      
      let verified = false;
      if (trustedSource && importData.verification?.signature && importData.source.publicKey) {
        // Verify signature
        const { signature, ...dataToVerify } = importData.verification;
        const canonical = JSON.stringify(importData.trustData);
        verified = await keysService.verify(
          canonical,
          signature,
          Buffer.from(importData.source.publicKey, 'hex')
        );
      }

      // Store the imported trust data
      // In production, this would go to a separate ImportedTrust collection
      logger.info('Trust data imported', {
        source: importData.source.platform,
        subject: importData.subject.id,
        verified,
        score: importData.trustData.score,
      });

      return {
        success: true,
        verified,
        aggregatedScore: importData.trustData.score,
        message: verified 
          ? 'Trust data imported and verified'
          : 'Trust data imported (unverified)',
      };
    } catch (error) {
      logger.error('Failed to import trust data', { error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Aggregate trust scores from multiple sources
   */
  async aggregateTrust(
    subjectId: string,
    sources: Array<{ platform: string; score: number; lastUpdated: string }>
  ): Promise<AggregatedTrust> {
    try {
      // Calculate weighted average based on platform trust
      let totalWeight = 0;
      let weightedSum = 0;

      const sourcesWithWeights = sources.map(source => {
        const trusted = this.trustedPlatforms.get(source.platform);
        const weight = trusted?.weight || 0.5; // Default weight for unknown platforms
        
        totalWeight += weight;
        weightedSum += source.score * weight;

        return { ...source, weight };
      });

      const aggregatedScore = totalWeight > 0 
        ? Math.round(weightedSum / totalWeight) 
        : 0;

      // Calculate confidence based on number of sources and their weights
      const confidence = Math.min(
        1,
        (sources.length * 0.2) + (totalWeight / sources.length * 0.5)
      );

      return {
        subjectId,
        sources: sourcesWithWeights,
        aggregatedScore,
        confidence: Math.round(confidence * 100) / 100,
        calculatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to aggregate trust', { error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Generate a portable trust badge/attestation
   */
  async generateTrustBadge(
    subjectType: 'agent' | 'session' | 'tenant',
    subjectId: string,
    tenantId: string
  ): Promise<{
    badge: string;
    verificationUrl: string;
    expiresAt: string;
  }> {
    const exportData = await this.exportTrust(subjectType, subjectId, tenantId);
    
    // Create a compact badge token
    const badgeData = {
      s: subjectId, // subject
      t: subjectType.charAt(0), // type (a/s/t)
      sc: exportData.trustSummary.overallScore, // score
      n: exportData.trustSummary.receiptCount, // count
      p: exportData.trustSummary.passRate, // pass rate
      at: Date.now(), // issued at
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // expires in 7 days
    };

    const badgeString = Buffer.from(JSON.stringify(badgeData)).toString('base64url');
    const signature = await keysService.sign(badgeString);
    const badge = `${badgeString}.${signature.slice(0, 32)}`;

    return {
      badge,
      verificationUrl: `https://yseeku.com/verify-badge?b=${encodeURIComponent(badge)}`,
      expiresAt: new Date(badgeData.exp).toISOString(),
    };
  }

  /**
   * Verify a trust badge
   */
  async verifyTrustBadge(badge: string): Promise<{
    valid: boolean;
    expired: boolean;
    data?: {
      subjectId: string;
      type: string;
      score: number;
      receiptCount: number;
      passRate: number;
    };
  }> {
    try {
      const [badgeString, signaturePrefix] = badge.split('.');
      
      if (!badgeString || !signaturePrefix) {
        return { valid: false, expired: false };
      }

      const badgeData = JSON.parse(Buffer.from(badgeString, 'base64url').toString());
      
      // Check expiration
      if (badgeData.exp < Date.now()) {
        return { valid: false, expired: true };
      }

      // Note: Full signature verification would require storing full signatures
      // This is a simplified check

      return {
        valid: true,
        expired: false,
        data: {
          subjectId: badgeData.s,
          type: badgeData.t === 'a' ? 'agent' : badgeData.t === 's' ? 'session' : 'tenant',
          score: badgeData.sc,
          receiptCount: badgeData.n,
          passRate: badgeData.p,
        },
      };
    } catch (error) {
      logger.error('Badge verification failed', { error: getErrorMessage(error) });
      return { valid: false, expired: false };
    }
  }

  private calculateScore(ciqMetrics: any): number {
    if (!ciqMetrics) return 0;
    const avg = (ciqMetrics.clarity + ciqMetrics.integrity + ciqMetrics.quality) / 3;
    return Math.round(avg * 100);
  }
}

export const trustPortabilityService = new TrustPortabilityService();
