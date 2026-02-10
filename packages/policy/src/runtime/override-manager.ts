/**
 * Policy Override Manager
 * 
 * Manages authorized policy overrides with complete audit trail
 * Supports time-limited and permanent overrides
 */

import type { TrustReceipt } from '@sonate/schemas';

/**
 * Override Record
 */
export interface PolicyOverride {
  id: string;
  receiptId: string;
  agentDid: string;
  principleIds: string[];
  
  // Authorization
  authorizedBy: string;
  authorizedAt: string;
  expiresAt?: string; // ISO timestamp, undefined = permanent
  
  // Metadata
  reason: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  
  // Audit
  revokedBy?: string;
  revokedAt?: string;
  revokedReason?: string;
  
  // Tracking
  usageCount: number;
  lastUsedAt?: string;
}

/**
 * Override Request
 */
export interface OverrideRequest {
  receiptId: string;
  agentDid: string;
  principleIds: string[];
  reason: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  authorizedBy: string;
  expiresIn?: number; // milliseconds
  expiresAt?: string; // ISO timestamp
}

/**
 * Override Statistics
 */
export interface OverrideStats {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  byAuthorizer: Record<string, number>;
  bySeverity: Record<string, number>;
  averageUsagePerOverride: number;
}

/**
 * Policy Override Manager
 */
export class PolicyOverrideManager {
  private overrides: Map<string, PolicyOverride> = new Map();
  private readonly maxOverrides = 5000;
  private auditLog: Array<{
    timestamp: string;
    action: string;
    overrideId: string;
    actor: string;
    details: Record<string, any>;
  }> = [];

  /**
   * Create new override
   */
  createOverride(request: OverrideRequest): PolicyOverride | { error: string } {
    // Validate request
    const validation = this.validateRequest(request);
    if (!validation.valid) {
      return { error: validation.error || 'Invalid request' };
    }

    const now = new Date();
    let expiresAt: string | undefined;

    if (request.expiresIn) {
      expiresAt = new Date(now.getTime() + request.expiresIn).toISOString();
    } else if (request.expiresAt) {
      expiresAt = request.expiresAt;
    }

    const override: PolicyOverride = {
      id: `override_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      receiptId: request.receiptId,
      agentDid: request.agentDid,
      principleIds: request.principleIds,
      authorizedBy: request.authorizedBy,
      authorizedAt: now.toISOString(),
      expiresAt,
      reason: request.reason,
      severity: request.severity,
      usageCount: 0,
    };

    this.overrides.set(override.id, override);

    // Audit log
    this.logAction('CREATE', override.id, request.authorizedBy, {
      reason: request.reason,
      expiresAt,
    });

    // Trim if necessary
    if (this.overrides.size > this.maxOverrides) {
      this.trimOldest();
    }

    return override;
  }

  /**
   * Get override by ID
   */
  getOverride(overrideId: string): PolicyOverride | undefined {
    return this.overrides.get(overrideId);
  }

  /**
   * Check if override is valid (not expired, not revoked)
   */
  isValid(override: PolicyOverride): boolean {
    // Check if revoked
    if (override.revokedAt) {
      return false;
    }

    // Check if expired
    if (override.expiresAt) {
      return new Date(override.expiresAt) > new Date();
    }

    return true;
  }

  /**
   * Use override (increment usage count)
   */
  useOverride(overrideId: string): boolean {
    const override = this.overrides.get(overrideId);
    if (!override) return false;

    if (!this.isValid(override)) return false;

    override.usageCount++;
    override.lastUsedAt = new Date().toISOString();

    this.logAction('USE', overrideId, 'SYSTEM', { usageCount: override.usageCount });

    return true;
  }

  /**
   * Revoke override
   */
  revokeOverride(overrideId: string, revokedBy: string, reason: string): boolean {
    const override = this.overrides.get(overrideId);
    if (!override) return false;

    override.revokedBy = revokedBy;
    override.revokedAt = new Date().toISOString();
    override.revokedReason = reason;

    this.logAction('REVOKE', overrideId, revokedBy, { reason });

    return true;
  }

  /**
   * Get overrides for receipt
   */
  getOverridesForReceipt(receiptId: string): PolicyOverride[] {
    return Array.from(this.overrides.values()).filter(
      o => o.receiptId === receiptId && this.isValid(o)
    );
  }

  /**
   * Get overrides for agent
   */
  getOverridesForAgent(agentDid: string): PolicyOverride[] {
    return Array.from(this.overrides.values()).filter(
      o => o.agentDid === agentDid && this.isValid(o)
    );
  }

  /**
   * Get active overrides
   */
  getActiveOverrides(): PolicyOverride[] {
    return Array.from(this.overrides.values()).filter(o => this.isValid(o));
  }

  /**
   * Check if receipt has valid override
   */
  hasValidOverride(receiptId: string): boolean {
    return this.getOverridesForReceipt(receiptId).length > 0;
  }

  /**
   * Get statistics
   */
  getStatistics(): OverrideStats {
    const all = Array.from(this.overrides.values());
    const active = all.filter(o => this.isValid(o));
    const expired = all.filter(o => o.expiresAt && new Date(o.expiresAt) <= new Date() && !o.revokedAt);
    const revoked = all.filter(o => o.revokedAt);

    const byAuthorizer: Record<string, number> = {};
    const bySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    let totalUsage = 0;

    for (const override of all) {
      byAuthorizer[override.authorizedBy] = (byAuthorizer[override.authorizedBy] || 0) + 1;
      bySeverity[override.severity]++;
      totalUsage += override.usageCount;
    }

    return {
      total: all.length,
      active: active.length,
      expired: expired.length,
      revoked: revoked.length,
      byAuthorizer,
      bySeverity,
      averageUsagePerOverride: all.length > 0 ? totalUsage / all.length : 0,
    };
  }

  /**
   * Cleanup expired overrides
   */
  cleanupExpired(): number {
    let count = 0;
    const now = new Date();

    for (const [id, override] of this.overrides.entries()) {
      if (override.expiresAt && new Date(override.expiresAt) < now && !override.revokedAt) {
        // Don't delete, just mark as expired for audit trail
        count++;
      }
    }

    return count;
  }

  /**
   * Validate override request
   */
  private validateRequest(request: OverrideRequest): { valid: boolean; error?: string } {
    if (!request.receiptId) {
      return { valid: false, error: 'receiptId required' };
    }

    if (!request.agentDid) {
      return { valid: false, error: 'agentDid required' };
    }

    if (!request.principleIds || request.principleIds.length === 0) {
      return { valid: false, error: 'principleIds required' };
    }

    if (!request.reason || request.reason.length < 10) {
      return { valid: false, error: 'reason must be at least 10 characters' };
    }

    if (!request.authorizedBy) {
      return { valid: false, error: 'authorizedBy required' };
    }

    if (request.expiresAt && new Date(request.expiresAt) < new Date()) {
      return { valid: false, error: 'expiresAt must be in the future' };
    }

    return { valid: true };
  }

  /**
   * Log action for audit trail
   */
  private logAction(
    action: string,
    overrideId: string,
    actor: string,
    details: Record<string, any>
  ): void {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action,
      overrideId,
      actor,
      details,
    });
  }

  /**
   * Get audit log
   */
  getAuditLog(overrideId?: string, limit: number = 100): Array<any> {
    let log = this.auditLog;

    if (overrideId) {
      log = log.filter(entry => entry.overrideId === overrideId);
    }

    return log.slice(-limit);
  }

  /**
   * Export overrides as JSON
   */
  exportAsJSON(): string {
    const overrides = Array.from(this.overrides.values());
    return JSON.stringify(overrides, null, 2);
  }

  /**
   * Export audit log as JSON
   */
  exportAuditLog(limit: number = 1000): string {
    return JSON.stringify(this.auditLog.slice(-limit), null, 2);
  }

  /**
   * Clear all (use carefully!)
   */
  clear(): void {
    this.overrides.clear();
    this.auditLog = [];
  }

  /**
   * Trim oldest overrides
   */
  private trimOldest(): void {
    const sorted = Array.from(this.overrides.entries())
      .sort((a, b) =>
        new Date(a[1].authorizedAt).getTime() - new Date(b[1].authorizedAt).getTime()
      );

    const toRemove = sorted.slice(0, Math.floor(this.maxOverrides * 0.2));
    toRemove.forEach(([id]) => this.overrides.delete(id));
  }

  /**
   * Get override count
   */
  getCount(): number {
    return this.overrides.size;
  }
}

/**
 * Create override manager
 */
export function createOverrideManager(): PolicyOverrideManager {
  return new PolicyOverrideManager();
}
