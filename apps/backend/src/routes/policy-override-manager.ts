/**
 * Policy Override Manager
 * 
 * Manages policy overrides - allowing authorized users to bypass policy blocks
 * with full audit trail
 */

/**
 * Override Record
 */
export interface OverrideRecord {
  id: string;
  receiptId: string;
  agentDid: string;
  overriddenBy: string; // User ID or system identifier
  overriddenAt: string; // ISO timestamp
  reason: string;
  expiresAt?: string; // Optional expiration
  duration?: number; // Duration in milliseconds
  principlesApplied: string[];
  metadata?: Record<string, any>;
}

/**
 * Override Request
 */
export interface OverrideRequest {
  receiptId: string;
  agentDid: string;
  reason: string;
  expiresAt?: string;
  authorizedBy: string;
  principlesApplied: string[];
}

/**
 * Override Statistics
 */
export interface OverrideStats {
  totalOverrides: number;
  activeOverrides: number;
  expiredOverrides: number;
  byReason: Record<string, number>;
  byAuthorizer: Record<string, number>;
  averageDuration?: number;
}

/**
 * Policy Override Manager
 */
export class PolicyOverrideManager {
  private overrides: Map<string, OverrideRecord> = new Map();
  private readonly maxOverrides = 10000;

  /**
   * Create override
   */
  createOverride(request: OverrideRequest): OverrideRecord {
    const now = new Date();
    const override: OverrideRecord = {
      id: `override_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      receiptId: request.receiptId,
      agentDid: request.agentDid,
      overriddenBy: request.authorizedBy,
      overriddenAt: now.toISOString(),
      reason: request.reason,
      expiresAt: request.expiresAt,
      principlesApplied: request.principlesApplied,
    };

    // Calculate duration
    if (request.expiresAt) {
      const expiresDate = new Date(request.expiresAt);
      override.duration = expiresDate.getTime() - now.getTime();
    }

    this.overrides.set(override.id, override);

    // Trim if necessary
    if (this.overrides.size > this.maxOverrides) {
      this.trimOldest();
    }

    return override;
  }

  /**
   * Get override
   */
  getOverride(overrideId: string): OverrideRecord | undefined {
    return this.overrides.get(overrideId);
  }

  /**
   * Check if override is still valid
   */
  isValid(override: OverrideRecord): boolean {
    if (!override.expiresAt) {
      return true; // No expiration
    }

    return new Date(override.expiresAt) > new Date();
  }

  /**
   * Get active overrides for receipt
   */
  getActiveOverridesForReceipt(receiptId: string): OverrideRecord[] {
    return Array.from(this.overrides.values())
      .filter(
        override =>
          override.receiptId === receiptId && this.isValid(override)
      );
  }

  /**
   * Get active overrides for agent
   */
  getActiveOverridesForAgent(agentDid: string): OverrideRecord[] {
    return Array.from(this.overrides.values())
      .filter(
        override =>
          override.agentDid === agentDid && this.isValid(override)
      );
  }

  /**
   * Revoke override
   */
  revokeOverride(overrideId: string): boolean {
    return this.overrides.delete(overrideId);
  }

  /**
   * Check if receipt has valid override
   */
  hasValidOverride(receiptId: string): boolean {
    for (const override of this.overrides.values()) {
      if (
        override.receiptId === receiptId &&
        this.isValid(override)
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get all overrides
   */
  getAllOverrides(): OverrideRecord[] {
    return Array.from(this.overrides.values());
  }

  /**
   * Get statistics
   */
  getStatistics(): OverrideStats {
    const overrides = Array.from(this.overrides.values());
    const now = new Date();

    const stats: OverrideStats = {
      totalOverrides: overrides.length,
      activeOverrides: overrides.filter(o => this.isValid(o)).length,
      expiredOverrides: overrides.filter(o => !this.isValid(o)).length,
      byReason: {},
      byAuthorizer: {},
    };

    // Count by reason
    for (const override of overrides) {
      const reason = override.reason.split(':')[0]; // Use first part as category
      stats.byReason[reason] = (stats.byReason[reason] || 0) + 1;
    }

    // Count by authorizer
    for (const override of overrides) {
      stats.byAuthorizer[override.overriddenBy] =
        (stats.byAuthorizer[override.overriddenBy] || 0) + 1;
    }

    // Calculate average duration
    const durationsWithValues = overrides
      .filter(o => o.duration !== undefined)
      .map(o => o.duration!);

    if (durationsWithValues.length > 0) {
      stats.averageDuration =
        durationsWithValues.reduce((a, b) => a + b, 0) / durationsWithValues.length;
    }

    return stats;
  }

  /**
   * Get overrides in date range
   */
  getOverridesInRange(startDate: Date, endDate: Date): OverrideRecord[] {
    return Array.from(this.overrides.values())
      .filter(
        override =>
          new Date(override.overriddenAt) >= startDate &&
          new Date(override.overriddenAt) <= endDate
      );
  }

  /**
   * Get overrides by authorizer
   */
  getOverridesByAuthorizer(authorizer: string): OverrideRecord[] {
    return Array.from(this.overrides.values())
      .filter(override => override.overriddenBy === authorizer);
  }

  /**
   * Cleanup expired overrides
   */
  cleanupExpired(): number {
    let count = 0;
    const now = new Date();

    for (const [id, override] of this.overrides.entries()) {
      if (override.expiresAt && new Date(override.expiresAt) < now) {
        this.overrides.delete(id);
        count++;
      }
    }

    return count;
  }

  /**
   * Trim oldest overrides
   */
  private trimOldest(): void {
    const sorted = Array.from(this.overrides.entries())
      .sort((a, b) =>
        new Date(a[1].overriddenAt).getTime() -
        new Date(b[1].overriddenAt).getTime()
      );

    const toRemove = sorted.slice(0, Math.floor(this.maxOverrides * 0.2));
    toRemove.forEach(([id]) => this.overrides.delete(id));
  }

  /**
   * Clear all overrides
   */
  clear(): void {
    this.overrides.clear();
  }

  /**
   * Get override count
   */
  getCount(): number {
    return this.overrides.size;
  }

  /**
   * Export overrides as JSON
   */
  exportAsJSON(): string {
    const overrides = Array.from(this.overrides.values());
    return JSON.stringify(overrides, null, 2);
  }

  /**
   * Validate override request
   */
  validateRequest(request: OverrideRequest): { valid: boolean; error?: string } {
    if (!request.receiptId) {
      return { valid: false, error: 'receiptId is required' };
    }

    if (!request.agentDid) {
      return { valid: false, error: 'agentDid is required' };
    }

    if (!request.reason || request.reason.length < 10) {
      return { valid: false, error: 'reason must be at least 10 characters' };
    }

    if (request.expiresAt && new Date(request.expiresAt) < new Date()) {
      return { valid: false, error: 'expiresAt must be in the future' };
    }

    return { valid: true };
  }
}

/**
 * Create override manager
 */
export function createOverrideManager(): PolicyOverrideManager {
  return new PolicyOverrideManager();
}
