/**
 * Consent Configuration Routes
 * 
 * API endpoints for managing enterprise consent configuration.
 * Allows tenants to customize their consent model, escalation channels,
 * and withdrawal behavior while staying compliant.
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getErrorMessage } from '../utils/error-utils';
import logger from '../utils/logger';
import {
  ConsentConfiguration,
  DEFAULT_EU_CONFIG,
  STREAMLINED_CONFIG,
  STRICT_CONFIG,
  US_CONFIG,
  getConsentConfig,
  validateConsentConfig,
  mergeWithDefaults,
} from '@sonate/core';

const router = Router();

// In-memory store for tenant configs (in production, use database)
const tenantConfigs = new Map<string, ConsentConfiguration>();

/**
 * @route   GET /api/consent/config
 * @desc    Get consent configuration for current tenant
 * @access  Private
 */
router.get('/config', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.userTenant || 'default';
    
    // Get tenant-specific config or default
    const config = tenantConfigs.get(tenantId) || DEFAULT_EU_CONFIG;
    
    res.json({
      success: true,
      data: {
        config,
        tenantId,
        isDefault: !tenantConfigs.has(tenantId),
      },
    });
  } catch (error: unknown) {
    logger.error('Get consent config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consent configuration',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   GET /api/consent/config/presets
 * @desc    Get available consent configuration presets
 * @access  Private
 */
router.get('/config/presets', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const presets = [
      {
        id: 'default',
        name: 'EU Standard (GDPR/AI Act)',
        description: 'Full GDPR and AI Act compliance with layered consent and human oversight',
        config: DEFAULT_EU_CONFIG,
        recommended: true,
      },
      {
        id: 'streamlined',
        name: 'EU Streamlined',
        description: 'GDPR compliant with streamlined UX - minimal friction consent flow',
        config: STREAMLINED_CONFIG,
        recommended: false,
      },
      {
        id: 'strict',
        name: 'High Compliance (Healthcare/Finance)',
        description: 'Strict binary consent with manual review for data requests',
        config: STRICT_CONFIG,
        recommended: false,
      },
      {
        id: 'us',
        name: 'US Standard (CCPA)',
        description: 'CCPA compliant with opt-out model - not GDPR compliant',
        config: US_CONFIG,
        recommended: false,
      },
    ];
    
    res.json({
      success: true,
      data: { presets },
    });
  } catch (error: unknown) {
    logger.error('Get consent presets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consent presets',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   PUT /api/consent/config
 * @desc    Update consent configuration for current tenant
 * @access  Private (Admin only in production)
 */
router.put('/config', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.userTenant || 'default';
    const { config, preset } = req.body;
    
    let newConfig: ConsentConfiguration;
    
    if (preset) {
      // Use a preset
      newConfig = getConsentConfig(preset);
    } else if (config) {
      // Merge custom config with defaults
      const baseConfig = tenantConfigs.get(tenantId) || DEFAULT_EU_CONFIG;
      newConfig = mergeWithDefaults(config, baseConfig);
    } else {
      res.status(400).json({
        success: false,
        message: 'Either config or preset must be provided',
      });
      return;
    }
    
    // Validate configuration
    const validation = validateConsentConfig(newConfig);
    
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        message: 'Configuration validation failed',
        errors: validation.errors,
        warnings: validation.warnings,
      });
      return;
    }
    
    // Store configuration
    tenantConfigs.set(tenantId, newConfig);
    
    logger.info('Consent config updated', { tenantId, preset: preset || 'custom' });
    
    res.json({
      success: true,
      message: 'Consent configuration updated successfully',
      data: {
        config: newConfig,
        warnings: validation.warnings,
      },
    });
  } catch (error: unknown) {
    logger.error('Update consent config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update consent configuration',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   POST /api/consent/config/validate
 * @desc    Validate a consent configuration without saving
 * @access  Private
 */
router.post('/config/validate', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { config } = req.body;
    
    if (!config) {
      res.status(400).json({
        success: false,
        message: 'Configuration is required',
      });
      return;
    }
    
    // Merge with defaults to get complete config
    const fullConfig = mergeWithDefaults(config, DEFAULT_EU_CONFIG);
    
    // Validate
    const validation = validateConsentConfig(fullConfig);
    
    res.json({
      success: true,
      data: {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
        resultingConfig: fullConfig,
      },
    });
  } catch (error: unknown) {
    logger.error('Validate consent config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate consent configuration',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   GET /api/consent/escalation-channels
 * @desc    Get available escalation channels for current tenant
 * @access  Private
 */
router.get('/escalation-channels', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.userTenant || 'default';
    const config = tenantConfigs.get(tenantId) || DEFAULT_EU_CONFIG;
    
    // Get enabled channels sorted by priority
    const channels = config.escalationChannels
      .filter(c => c.enabled)
      .sort((a, b) => a.priority - b.priority);
    
    res.json({
      success: true,
      data: { channels },
    });
  } catch (error: unknown) {
    logger.error('Get escalation channels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch escalation channels',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   POST /api/consent/escalate
 * @desc    Initiate escalation to human
 * @access  Private
 */
router.post('/escalate', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.userTenant || 'default';
    const { channelType, conversationId, context } = req.body;
    
    const config = tenantConfigs.get(tenantId) || DEFAULT_EU_CONFIG;
    
    // Find the requested channel
    const channel = config.escalationChannels.find(
      c => c.type === channelType && c.enabled
    );
    
    if (!channel) {
      res.status(400).json({
        success: false,
        message: `Escalation channel ${channelType} is not available`,
      });
      return;
    }
    
    // In production, this would:
    // 1. Create a ticket in the support system
    // 2. Transfer to live agent queue
    // 3. Send email notification
    // 4. etc.
    
    logger.info('Escalation initiated', {
      tenantId,
      channel: channelType,
      conversationId,
      userId: req.userId,
    });
    
    // Return escalation confirmation
    res.json({
      success: true,
      message: 'Escalation initiated successfully',
      data: {
        escalationId: `esc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        channel: {
          type: channel.type,
          label: channel.label,
          expectedResponseTime: channel.expectedResponseTime,
        },
        contextPreserved: config.withdrawalBehavior.humanEscalation.preserveContext,
        nextSteps: getNextSteps(channel),
      },
    });
  } catch (error: unknown) {
    logger.error('Escalation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate escalation',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   POST /api/consent/data-request
 * @desc    Submit a data request (export, deletion, etc.)
 * @access  Private
 */
router.post('/data-request', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.userTenant || 'default';
    const { requestType, details } = req.body;
    
    const config = tenantConfigs.get(tenantId) || DEFAULT_EU_CONFIG;
    
    // Validate request type
    if (!['export', 'deletion', 'restriction', 'portability'].includes(requestType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid request type',
      });
      return;
    }
    
    const requestConfig = config.dataRequests[requestType as keyof typeof config.dataRequests];
    
    if (!requestConfig.enabled) {
      res.status(400).json({
        success: false,
        message: `${requestType} requests are not enabled for this tenant`,
      });
      return;
    }
    
    // Create data request
    const requestId = `dr-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    logger.info('Data request created', {
      requestId,
      tenantId,
      requestType,
      userId: req.userId,
      mode: requestConfig.mode,
    });
    
    res.json({
      success: true,
      message: 'Data request submitted successfully',
      data: {
        requestId,
        requestType,
        status: requestConfig.mode === 'IMMEDIATE' ? 'PROCESSING' : 'PENDING_REVIEW',
        estimatedCompletion: getEstimatedCompletion(requestType, config),
        verificationRequired: (requestConfig as any).verificationRequired || false,
        nextSteps: getDataRequestNextSteps(requestType, requestConfig),
      },
    });
  } catch (error: unknown) {
    logger.error('Data request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit data request',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   DELETE /api/consent/config
 * @desc    Reset consent configuration to default for current tenant
 * @access  Private (Admin only in production)
 */
router.delete('/config', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.userTenant || 'default';
    
    tenantConfigs.delete(tenantId);
    
    logger.info('Consent config reset to default', { tenantId });
    
    res.json({
      success: true,
      message: 'Consent configuration reset to EU default',
      data: {
        config: DEFAULT_EU_CONFIG,
      },
    });
  } catch (error: unknown) {
    logger.error('Reset consent config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset consent configuration',
      error: getErrorMessage(error),
    });
  }
});

// Helper functions
function getNextSteps(channel: any): string[] {
  switch (channel.type) {
    case 'LIVE_HANDOFF':
      return [
        'You will be connected to a human agent shortly',
        `Expected wait time: ${channel.expectedResponseTime}`,
        'Your conversation context will be shared with the agent',
      ];
    case 'CALLBACK_REQUEST':
      return [
        'A team member will call you back',
        `Expected callback within: ${channel.expectedResponseTime}`,
        'Please ensure your contact number is up to date',
      ];
    case 'EMAIL_SUPPORT':
      return [
        `Your request has been sent to ${channel.email}`,
        `Expected response within: ${channel.expectedResponseTime}`,
        'Check your inbox for updates',
      ];
    default:
      return ['Your request has been submitted'];
  }
}

function getEstimatedCompletion(requestType: string, config: ConsentConfiguration): string {
  switch (requestType) {
    case 'export':
      return config.dataRequests.export.maxWaitTime;
    case 'deletion':
      return `${config.dataRequests.deletion.gracePeriod} (after grace period)`;
    default:
      return '30 days';
  }
}

function getDataRequestNextSteps(requestType: string, requestConfig: any): string[] {
  const steps: string[] = [];
  
  if (requestConfig.verificationRequired) {
    steps.push('Identity verification will be required before processing');
  }
  
  if (requestConfig.mode === 'MANUAL_REVIEW') {
    steps.push('Your request will be reviewed by a team member');
  }
  
  if (requestType === 'deletion' && requestConfig.gracePeriod) {
    steps.push(`A ${requestConfig.gracePeriod} grace period applies before permanent deletion`);
  }
  
  if (requestConfig.notifyOnCompletion) {
    steps.push('You will be notified when your request is complete');
  }
  
  return steps;
}

export default router;
