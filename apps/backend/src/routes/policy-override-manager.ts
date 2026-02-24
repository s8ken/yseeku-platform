/**
 * Policy Override Manager
 * 
 * Re-exports the override manager from @sonate/policy for backward compatibility
 */

export {
  PolicyOverrideManager,
  createOverrideManager,
  type PolicyOverride,
  type OverrideRequest,
  type OverrideStats,
} from '@sonate/policy';
